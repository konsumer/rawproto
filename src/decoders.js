import Reader from './index'

// get string representation of a field
export function display ({ index, type, sub, renderType, value }) {
  if (renderType === 'raw') {
    return JSON.stringify({ index, type, sub, renderType, value })
  }
  if (renderType === 'bytes') {
    return bytes(value)
  }
  if (type === 0) {
    return value.toString()
  }
  if (renderType === 'string') {
    return string(value)
  }
  if ([1, 5].includes(type)) {
    if (!renderType) {
      renderType = 'int'
    }

    if (renderType === 'int') {
      if (type === 5) {
        return int32(value).toString()
      } else {
        return int64(value).toString()
      }
    }
    if (renderType === 'uint') {
      if (type === 5) {
        return uint32(value).toString()
      } else {
        return uint64(value).toString()
      }
    }
    if (renderType === 'float') {
      if (type === 5) {
        return float32(value).toString()
      } else {
        return float64(value).toString()
      }
    }
  }
}

const dec = new TextDecoder()

// hex string of bytes
export const bytes = b => [...b].map(c => c.toString(16).padStart(2, '0')).join(' ')

// get teh string-value of a buffer
export const string = b => dec.decode(b)

export const uint64 = b => (new DataView(b.buffer)).getBigUInt64(0, true)
export const int64 = b => (new DataView(b.buffer)).getBigInt64(0, true)
export const float64 = b => (new DataView(b.buffer)).getFloat64(0, true)
export const uint32 = b => (new DataView(b.buffer)).getUInt32(0, true)
export const int32 = b => (new DataView(b.buffer)).getInt32(0, true)
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
