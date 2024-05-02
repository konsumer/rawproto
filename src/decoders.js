import Reader from './index'

const dec = new TextDecoder()

export const bytes = b => [...b].map(c => c.toString(16).padStart(2, '0')).join(' ')

export const string = b => dec.decode(b)

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

    const dv = new DataView(value.buffer)
    if (renderType === 'int') {
      if (type === 5) {
        return dv.getInt32(0, true).toString()
      } else {
        return dv.getBigInt64(0, true).toString()
      }
    }
    if (renderType === 'uint') {
      if (type === 5) {
        return dv.getUInt32(0, true).toString()
      } else {
        return dv.getBigUInt64(0, true).toString()
      }
    }
    if (renderType === 'float') {
      if (type === 5) {
        return dv.getFloat32(0, true).toString()
      } else {
        return dv.getFloat64(0, true).toString()
      }
    }
  }
}

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
