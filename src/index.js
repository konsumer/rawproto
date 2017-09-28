import { load, Reader, Type } from 'protobufjs'
import { uniqBy } from 'lodash'

// indent by count
const indent = count => Array(count).join('  ')

// is a number a float?
const isFloat = n => Number(n) === n && n % 1 !== 0

/**
 * Turn a protobuf into a data-object
 *
 * @param      {Buffer}   buffer  The proto in a binary buffer
 * @return     {object[]}         Info about the protobuf
 */
export const getData = buffer => {
  const reader = Reader.create(buffer)
  const out = []
  while (reader.pos < reader.len) {
    const tag = reader.uint64()
    const id = tag >>> 3
    const wireType = tag & 7
    switch (wireType) {
      case 0: // int32, int64, uint32, bool, enum, etc
        out.push({[id]: reader.uint32()})
        break
      case 1: // fixed64, sfixed64, double
        out.push({[id]: reader.fixed64()})
        break
      case 2: // string, bytes, sub-message
        const bytes = reader.bytes()
        try {
          const innerMessage = getData(bytes)
          out.push({[id]: innerMessage})
        } catch (e) {
          // search buffer for extended chars
          let hasExtended = false
          bytes.forEach(b => {
            if (b < 32) {
              hasExtended = true
            }
          })
          if (hasExtended) {
            out.push({[id]: bytes})
          } else {
            out.push({[id]: bytes.toString()})
          }
        }
        break
      // IGNORE start_group
      // IGNORE end_group
      case 5: // fixed32, sfixed32, float
        out.push({[id]: reader.float()})
        break
      default: reader.skipType(wireType)
    }
  }
  return out
}

// turn a message into a proto-representation
const handleMessage = (msg, m = 'Root', level = 1) => {
  const seen = []
  const repeated = []
  const lines = msg.map(field => {
    const n = Object.keys(field).pop()
    const t = Array.isArray(field[n]) ? 'array' : typeof field[n]
    switch (t) {
      case 'object': // it's a buffer
      case 'string':
        return `${indent(level + 1)}string field${n} = ${n}; // could be a repeated-value, string, buffer, or malformed sub-message`
      case 'number':
        return isFloat(field[n])
          ? `${indent(level + 1)}float field${n} = ${n}; // could be a fixed64, sfixed64, double, fixed32, sfixed32, or float`
          : `${indent(level + 1)}int32 field${n} = ${n}; // could be a int32, int64, uint32, bool, enum, etc, or even a float of some kind`
      case 'array': // sub-message
        if (seen.indexOf(n) === -1) {
          seen.push(n)
          return `\n${handleMessage(field[n], n, level + 1)}\n${indent(level + 1)}\n${indent(level + 1)}Message${n} subMessage${n} = ${n};`
        } else {
          repeated.push(n)
        }
    }
  }).filter(l => l)

  const repeatHandled = []
  repeated.forEach(num => {
    lines.forEach((l, i) => {
      if (l.indexOf(`subMessage${num}`) !== -1 && repeatHandled.indexOf(num) === -1) {
        lines[i] = l.replace(`Message${num} subMessage${num}`, `repeated Message${num} subMessage${num}`)
        repeatHandled.push(num)
      }
    })
  })

  return `${indent(level)}Message${m} {\n${lines.join('\n')}\n${indent(level)}}`
}

/**
 * Analyze ways to parse protobuf given .proto files with possible messages
 *
 * @param      {Buffer}   buffer       The proto in a binary buffer
 * @param      {String[]} protofiles   The protofile(s) to look for possible matching messages
 * @return     {object[]}              Info about the protobuf
 */
export const analyzeData = (buffer, protofiles) => {
  // get all messages in protofiles (from all files, all nested, and imports)
  // TODO: this needs to be tested with multiple protofiles
  return load(protofiles).then(parsedProtofile => {
    // recursively get all nested types
    const getNested = (node) => {
      if (!node.nested) return []
      const nestedNodes = Object.values(node.nested)
      return nestedNodes.concat(...nestedNodes.map(getNested))
    }
    const allTypes = getNested(parsedProtofile)

    // get wiretype and add to defintions
    allTypes.forEach(type => {
      Object.values(type.fields).forEach(field => {
        switch (field.type) {
          case 'int32': case 'int64':
          case 'uint32': case 'uint64':
          case 'sint32': case 'sint64':
          case 'enum': case 'bool':
            // Varint (or Length-delimited if packed repeated)
            field.wiretype = field.repeated && field.packed ? 2 : 0
            break
          case 'double': case 'fixed64': case 'sfixed64':
            // 64-bit (or Length-delimited if packed repeated)
            field.wiretype = field.repeated && field.packed ? 2 : 1
            break
          case 'float': case 'fixed32': case 'sfixed32':
            // 32-bit (or Length-delimited if packed repeated)
            field.wiretype = field.repeated && field.packed ? 2 : 5
            break
          case 'bytes': case 'string':
            // Length-delimited
            field.wiretype = 2
            break
          default:
            // embedded message
            // Length-delimited
            field.wiretype = 2
            field.isSubMessage = true
        }
      })
    })

    // parse message raw to get id-wiretype pairs
    const message = parseWiretypes(buffer)
    // compare each parsed message keys and wiretypes to known messages
    return allTypes.map(type => {
      // get number of matching id-wiretype pairs between message and definition
      const comparison = compareMessageType(message, type, parsedProtofile)

      return {
        as: type.name,
        matchingFields: comparison.matchingFields,
        incompatibilites: comparison.incompatibilites
      }
    }).sort((a, b) => b.matchingFields - a.matchingFields)
  })
}

/**
 * Parses protobuf for raw data and wiretype info
 *
 * @param      {Buffer}  buffer  The protobuf
 * @return     {Object}  Parsed message with wiretype info
 */
const parseWiretypes = buffer => {
  const message = {fields: []}
  const reader = Reader.create(buffer)
  while (reader.pos < reader.len) {
    const tag = reader.uint64()
    const id = tag >>> 3
    const wiretype = tag & 7
    const field = {
      id,
      wiretype
    }
    switch (wiretype) {
      case 0: // int32, int64, uint32, bool, enum, etc
        field.data = reader.uint64()
        break
      case 1: // fixed64, sfixed64, double
        field.data = reader.fixed64()
        break
      case 5: // fixed32, sfixed32, float
        field.data = reader.fixed32()
        break
      // IGNORE start_group
      // IGNORE end_group
      case 2: // string, bytes, sub-message
        field.data = reader.bytes()
        try {
          field.subMessage = parseWiretypes(field.data)
        } catch (err) {
          // ignore if not parseable as subMessage
        }
        break
      default: reader.skipType(wiretype)
    }
    message.fields.push(field)
  }
  return message
}

/**
 * Recursively compare a parsed message from parseWiretypes
 * with a known type definition with added wiretype info
 *
 * @param      {Object}             message          Protobuf parsed with parseWiretypes
 * @param      {<type>}             type             The parsed protobuf defintion with added wiretype info
 * @param      {<type>}             parsedProtofile  The parsed protofile
 * @return     {Array}    Array of possble interpretation of the message with the known types
 *                        from the parsedProtofile
 */
const compareMessageType = (message, type, parsedProtofile) => {
  const comparison = uniqBy(message.fields, f => f.id).reduce((totals, messageField) => {
    const typeField = Object.values(type.fields).find(typeField => typeField.id === messageField.id)
    if (typeField) {
      if (typeField.wiretype !== messageField.wiretype) {
        totals.incompatibilites++
        return totals
      }
      // if typefield is sub message (isSubMessage == true)
      if (typeField.isSubMessage) {
        if (!messageField.subMessage) {
          totals.incompatibilites++
          return totals
        }
        const subType = parsedProtofile.lookup(typeField.type)
        if (subType) {
          const comparison = compareMessageType(messageField.subMessage, subType, parsedProtofile)
          totals.matchingFields += comparison.matchingFields
          totals.incompatibilites += comparison.incompatibilites
        }
      } else {
        totals.matchingFields++
      }
    } // ignore if no match
    return totals
  }, {
    matchingFields: 0,
    incompatibilites: 0
  })
  return comparison
}

/**
 * Gets the proto-definition string from a binary protobuf message
 *
 * @param      {Buffer}  buffer  The buffer
 * @return     {string}  The proto
 */
export const getProto = buffer => {
  const data = getData(buffer)
  let out = 'syntax = "proto3";\n\n'
  out += handleMessage(data)
  return out
}
