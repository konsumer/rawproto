import Reader, { wireTypes } from './index'

// get string representation of a field
export function display ({ index, type, sub, renderType, value }) {
  const v = getValue({ index, type, sub, renderType, value }, renderType)
  if (renderType === 'raw') {
    return JSON.stringify(v)
  }
  if (renderType === 'bytes') {
    return bytes(v)
  }
  return v.toString()
}

// this is a wrapper around a field to just get the value form field/renderType
// this is used in query & display & a few other places
export const getValue = (field, type) => {
  if (type === 'raw') {
    return field
  }

  if (['int', 'uint', 'float', 'bool'].includes(type)) {
    if (field.type === wireTypes.VARINT) {
      if (type === 'uint' || type === 'int') { // I don't really support signed ints, but the user may be mistaken here (using int for VARINT)
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

  if (type === 'string') {
    return string(field.value)
  }

  if (type === 'packedvarint') {
    return packedIntVar(field.value)
  }

  if (type === 'packedint32') {
    return packedInt32(field.value)
  }

  if (type === 'packedint64') {
    return packedInt64(field.value)
  }
}

const dec = new TextDecoder()

// hex string of bytes
export const bytes = b => [...b].map(c => c.toString(16).padStart(2, '0')).join(' ')

// get the string-value of a buffer
export const string = b => dec.decode(b)

// get the Unsigned 64-bit Integer value of a 8-byte buffer
export const uint64 = b => (new DataView(b.buffer)).getBigUInt64(0, true)

// get the Signed 64-bit Integer value of a 8-byte buffer
export const int64 = b => (new DataView(b.buffer)).getBigInt64(0, true)

// get the 64-bit Decimal value of a 8-byte buffer
export const float64 = b => (new DataView(b.buffer)).getFloat64(0, true)

// get the Unsigned 32-bit Integer value of a 4-byte buffer
export const uint32 = b => (new DataView(b.buffer)).getUInt32(0, true)

// get the Signed 32-bit Integer value of a 4-byte buffer
export const int32 = b => (new DataView(b.buffer)).getInt32(0, true)

// get the 32-bit Decimal value of a 4-byte buffer
export const float32 = b => (new DataView(b.buffer)).getFloat32(0, true)

export const packedIntVar = b => {
  const out = []
  const r = new Reader(b)
  while (r.offset < r.buffer.length) {
    out.push(r.readVarInt())
  }
  return out
}

export const packedInt32 = b => {
  const out = []
  const d = new DataView(b.buffer)
  let offset = 0
  while (offset < b.buffer.length) {
    out.push(d.getInt32(offset, true))
    offset += 4
  }
  return out
}

export const packedInt64 = b => {
  const out = []
  const d = new DataView(b.buffer)
  let offset = 0
  while (offset < b.buffer.length) {
    out.push(d.getInt64(offset, true))
    offset += 8
  }
  return out
}
