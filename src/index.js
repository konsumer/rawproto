import { load, Reader, Type } from 'protobufjs'
import { uniq } from 'lodash'

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
  const backwardsCompatibilityConfidence = 0.9
  // get all messages in protofiles (from all files, all nested, and imports)
  return load(protofiles).then(parsedProtofiles => {
    // recursively get all nested types
    const getNested = (node) => {
      if (!node.nested) return []
      const nestedNodes = Object.values(node.nested)
      return nestedNodes.concat(...nestedNodes.map(getNested))
    }
    const allTypes = getNested(parsedProtofiles)
    // get wiretypes
    allTypes.map(type => {
      Object.values(type.fields).forEach(field => {
        switch (field.type) {
          case 'int32':
          case 'int64':
          case 'uint32':
          case 'uint64':
          case 'sint32':
          case 'sint64':
          case 'bool':
          case 'enum':
            // Varint (or Length-delimited if packed repeated)
            field.wiretype = field.repeated && field.packed ? 2 : 0
            break
          case 'fixed64':
          case 'sfixed64':
          case 'double':
            // 64-bit (or Length-delimited if packed repeated)
            field.wiretype = field.repeated && field.packed ? 2 : 1
            break
          case 'fixed32':
          case 'sfixed32':
          case 'float':
            // 32-bit (or Length-delimited if packed repeated)
            field.wiretype = field.repeated && field.packed ? 2 : 5
            break
          default:
          // case 'string':
          // case 'bytes':
          // case 'embedded message':
            field.wiretype = 2 // Length-delimited
        }
      })
    })
    // debugger
    // console.dir(allTypes.map(({name, fields}) => {
    //   fields = Object.values(fields).map(({name, id, type, repeated, wiretype}) => ({name, id, type, repeated, wiretype}))
    //   return {name, fields}
    // }), {depth: 100})

    // parse buffer raw
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
        case 2: // string, bytes, sub-message
          field.data = reader.bytes()
          break
        // IGNORE start_group
        // IGNORE end_group
        case 5: // fixed32, sfixed32, float
          field.data = reader.fixed32()
          break
        default: reader.skipType(wiretype)
      }
      message.fields.push(field)
    }

    // console.log(message)

    // compare each parsed message keys and wiretypes to known messages with confidence rating
    let possibleValues = allTypes.map(type => {
      // get number of matching id-wiretype pairs between message and definition
      const matchingFields = Object.values(type.fields).filter(typeField => (
        message.fields.find(messageField => messageField.id === typeField.id && messageField.wiretype === typeField.wiretype)
      )).length

      const fieldsDefinitionTotal = Object.values(type.fields).length
      const fieldsMessageTotal = uniq(message.fields.map(x => x.id)).length

      // for every id in message the wiretype for that id matches in definition
      const backwardsCompatible = message.fields.every(messageField => (
        Object.values(type.fields).find(typeField => typeField.id === messageField.id).wiretype === messageField.wiretype
      ))

      let confidence = matchingFields / (fieldsMessageTotal + fieldsDefinitionTotal - matchingFields)

      // confidence will take a hit if the message is not backwards compatible as expected
      if (!backwardsCompatible) {
        confidence *= (1 - backwardsCompatibilityConfidence)
      }

      return {
        as: type.name,
        confidence
      }
    })

    // console.log(possibleValues)

    possibleValues = possibleValues.sort((a, b) => b.confidence - a.confidence)

    return {possibleValues}
  })
  // take best matches above threshold
  // report
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
