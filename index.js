import protobufjs from 'protobufjs'

const { Reader } = protobufjs

// indent by count
const indent = count => Array(count).join('  ')

// is a number a float?
const isFloat = n => Number(n) === n && n % 1 !== 0

// turn a message into a proto-representation
const handleMessage = (msg, name = 'MessageRoot', level = 1) => {
  const seen = []
  const repeated = []
  const lines = msg.map(field => {
    const n = Object.keys(field).pop()
    const t = Array.isArray(field[n]) ? 'array' : typeof field[n]
    switch (t) {
      case 'object': // it's a buffer
        return `${indent(level + 1)}bytes field${n} = ${n}; // could be a repeated-value, string, bytes, or malformed sub-message`
      case 'string':
        return `${indent(level + 1)}string field${n} = ${n}; // could be a repeated-value, string, bytes, or malformed sub-message`
      case 'number':
        return isFloat(field[n])
          ? `${indent(level + 1)}float field${n} = ${n}; // could be a fixed64, sfixed64, double, fixed32, sfixed32, or float`
          : `${indent(level + 1)}int32 field${n} = ${n}; // could be a int32, int64, uint32, bool, enum, etc, or even a float of some kind`
      case 'array': // sub-message
        if (seen.indexOf(n) === -1) {
          seen.push(n)
          return `\n${handleMessage(field[n], name, level + 1)}\n${indent(level + 1)}\n${indent(level + 1)}Message${n} subMessage${n} = ${n};`
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

  return `${indent(level)}message ${name} {\n${lines.join('\n')}\n${indent(level)}}`
}

/**
 * Turn a protobuf into a data-object
 *
 * @param      {Buffer}   buffer     The proto in a binary buffer
 * @param      {Object}   root       protobufjs message-type (for partial parsing)
 * @param      {string}   stringMode How to handle strings that aren't sub-messages: "auto" - guess based on chars, "string" - always a string, "binary" - always a buffer
 * @return     {object[]}            Info about the protobuf
 */
export function getData (buffer, root, stringMode = 'auto', fieldPrefix = '') {
  const reader = Reader.create(buffer)
  const out = []
  while (reader.pos < reader.len) {
    const tag = reader.uint64()
    const id = tag >>> 3
    const wireType = tag & 7
    const key = fieldPrefix + id.toString()
    switch (wireType) {
      case 0: // int32, int64, uint32, bool, enum, etc
        out.push({ [key]: reader.uint32() })
        break
      case 1: // fixed64, sfixed64, double
        out.push({ [key]: reader.fixed64() })
        break
      case 2: // string, bytes, sub-message
        const bytes = reader.bytes()
        try {
          const innerMessage = getData(bytes, root, stringMode, fieldPrefix)
          out.push({ [key]: innerMessage })
        } catch (e) {
          if (stringMode === 'binary') {
            out.push({ [key]: bytes })
          } else if (stringMode === 'string') {
            out.push({ [key]: bytes.toString() })
          } else {
            // search buffer for extended chars
            let hasExtended = false
            bytes.forEach(b => {
              if (b < 32) {
                hasExtended = true
              }
            })
            if (hasExtended) {
              out.push({ [key]: bytes })
            } else {
              out.push({ [key]: bytes.toString() })
            }
          }
        }
        break
      // IGNORE start_group
      // IGNORE end_group
      case 5: // fixed32, sfixed32, float
        out.push({ [key]: reader.float() })
        break
      default: reader.skipType(wireType)
    }
  }
  if (root) {
    const decoded = root.decode(buffer)
    // TODO: work out decoded/raw merge
  }
  return out
}

/**
 * Gets the proto-definition string from a binary protobuf message
 *
 * @param      {Buffer}  buffer     The proto in a binary buffer
 * @param      {Object}  root       protobufjs message-type (for partial parsing)
 * @param      {string}  stringMode How to handle strings that aren't sub-messages: "auto" - guess based on chars, "string" - always a string, "binary" - always a buffer
 * @return     {string}  The proto SDL
 */
export function getProto (buffer, root, name = 'MessageRoot', stringMode = 'auto') {
  const data = getData(buffer, root, stringMode)
  let out = 'syntax = "proto3";\n\n'
  out += handleMessage(data, name)
  return out
}
