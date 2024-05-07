import RawProto from './index'

export const wireTypes = {
  VARINT: 0, //  int32, int64, uint32, uint64, sint32, sint64, bool, enum
  I64: 1, // fixed64, sfixed64, double
  LEN: 2, // string, bytes, embedded messages, packed repeated fields
  SGROUP: 3, //  group start (deprecated)
  EGROUP: 4, //  group end (deprecated)
  I32: 5 // fixed32, sfixed32, float
}

export const wireLabels = {
  0: 'Variable-length Integer',
  1: '64bit Number',
  2: 'Length-delimited Bytes',
  3: 'Grouped Messages',
  5: '32bit Number'
}

export const wireMap = {
  0: ['int', 'bool', 'raw'],
  1: ['int', 'uint', 'bytes', 'float', 'raw'],
  2: ['bytes', 'string', 'sub', 'packedvarint', 'packedint32', 'packedint64', 'raw'],
  5: ['int', 'uint', 'bytes', 'float', 'raw']
}

export const parseLabels = {
  int: 'Signed Integer',
  uint: 'Unsigned Integer',
  float: 'Decimal',
  bool: 'Boolean',
  string: 'String',
  bytes: 'Bytes',
  raw: 'Raw',
  sub: 'Sub-Message',
  packedint32: 'Packed Int32 Array',
  packedint64: 'Packed Int64 Array',
  packedvarint: 'Packed Variable-length Int Array'
}

// get string representation of a field
export function display (field) {
  const v = getValue(field, field.renderType)
  if (field.renderType === 'raw') {
    return JSON.stringify(v)
  }
  if (field.renderType === 'bytes') {
    return bytes(v)
  }
  if (field.renderType === 'bool') {
    return v ? 'true' : 'false'
  }

  if (v) {
    return v.toString()
  }
}

// this is a wrapper around a field to just get the value form field/renderType
// this is used in query & display & a few other places
export const getValue = (field, type) => {
  if (type === 'raw') {
    return field
  }

  if (type === 'string') {
    return string(field.value)
  }

  if (type === 'packedvarint') {
    if (Array.isArray(field.value)) {
      return field.value
    }
    return packedIntVar(field.value)
  }

  if (type === 'packedint32') {
    if (Array.isArray(field.value)) {
      return field.value
    }
    return packedInt32(field.value)
  }

  if (type === 'packedint64') {
    if (Array.isArray(field.value)) {
      return field.value
    }
    return packedInt64(field.value)
  }

  if (field.parsed) {
    if (type === 'sub') {
      return field.parsed
    }
  }

  if (['int', 'uint', 'float', 'bool'].includes(type)) {
    if (field.type === wireTypes.VARINT) {
      if (type === 'uint' || type === 'int') {
        // I don't really support signed ints for VARINT, but the user may be mistaken here
        return field.value
      }
      if (type === 'bool') {
        return !!field.value
      }
    }
    // numeric types that require a view
    if (field.type === wireTypes.I64 && type === 'uint') {
      return uint64(field.value)
    }
    if (field.type === wireTypes.I64 && type === 'int') {
      return int64(field.value)
    }
    if (field.type === wireTypes.I64 && type === 'float') {
      return float64(field.value)
    }
    if (field.type === wireTypes.I32 && type === 'uint') {
      return uint32(field.value)
    }
    if (field.type === wireTypes.I32 && type === 'int') {
      return int32(field.value)
    }
    if (field.type === wireTypes.I32 && type === 'float') {
      return float32(field.value)
    }
  }

  if (type === 'bytes') {
    return field.value
  }

  // if type is sub, but there is no parsed, build it
  if (type === 'sub') {
    return new RawProto(field.value).readMessage()
  }
}

const dec = new TextDecoder()

// hex string of bytes
export const bytes = (b) => [...b].map((c) => c.toString(16).padStart(2, '0')).join(' ')

// get the string-value of a buffer
export const string = (b) => dec.decode(b)

// get the Unsigned 64-bit Integer value of a 8-byte buffer
export const uint64 = (b) => new DataView(b.buffer).getBigUint64(0, true)

// get the Signed 64-bit Integer value of a 8-byte buffer
export const int64 = (b) => new DataView(b.buffer).getBigInt64(0, true)

// get the 64-bit Decimal value of a 8-byte buffer
export const float64 = (b) => new DataView(b.buffer).getFloat64(0, true)

// get the Unsigned 32-bit Integer value of a 4-byte buffer
export const uint32 = (b) => new DataView(b.buffer).getUint32(0, true)

// get the Signed 32-bit Integer value of a 4-byte buffer
export const int32 = (b) => new DataView(b.buffer).getInt32(0, true)

// get the 32-bit Decimal value of a 4-byte buffer
export const float32 = (b) => new DataView(b.buffer).getFloat32(0, true)

// decode a buffer of packed varints
export const packedIntVar = (b) => {
  const out = []
  const r = new RawProto(b)
  while (r.offset < r.buffer.length) {
    out.push(r.readVarInt())
  }
  return out
}

// decode a buffer of packed int32's
export const packedInt32 = (b) => {
  const out = []
  const d = new DataView(b.buffer)
  let offset = 0
  while (offset < b.buffer.length) {
    out.push(d.getInt32(offset, true))
    offset += 4
  }
  return out
}

// decode a buffer of packed int64's
export const packedInt64 = (b) => {
  const out = []
  const d = new DataView(b.buffer)
  let offset = 0
  while (offset < b.buffer.length) {
    out.push(d.getInt64(offset, true))
    offset += 8
  }
  return out
}

// get Protobuf string for a field
export function getProto (field, renderType, indent = 0) {
  // TODO
}
