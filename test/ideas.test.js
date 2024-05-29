/* global describe test expect */

import { fileURLToPath } from 'url'
import { join, dirname } from 'path'
import { readFile } from 'fs/promises'

export class ProtobufDecoder {
  constructor (buffer) {
    this.buffer = new Uint8Array(buffer)
    this.pos = 0

    this.debugging = false
  }

  debug (...args) {
    this.debugging && console.log.apply(...args)
  }

  readUInt32LE (pos) {
    return this.buffer[pos++] | (this.buffer[pos++] << 8) | (this.buffer[pos++] << 16) | (this.buffer[pos++] << 24)
  }

  decodeVarint () {
    let result = 0
    let shift = 0
    const start = this.pos
    while (true) {
      if (this.pos >= this.buffer.length) {
        throw new Error('Unexpected end of buffer while decoding varint')
      }
      const byte = this.buffer[this.pos++]
      result |= (byte & 0x7f) << shift
      if ((byte & 0x80) === 0) {
        return { int: result, value: this.buffer.slice(start, this.pos) }
      }
      shift += 7
    }
  }

  decode32Bit () {
    if (this.pos + 4 > this.buffer.length) {
      throw new Error('Unexpected end of buffer while decoding 32-bit field')
    }
    const value = { int: this.readUInt32LE(this.pos), value: this.buffer.slice(this.pos, this.pos + 4) }
    this.pos += 4
    return value
  }

  decode64Bit () {
    if (this.pos + 8 > this.buffer.length) {
      throw new Error('Unexpected end of buffer while decoding 64-bit field')
    }
    const low = this.readUInt32LE(this.pos)
    const high = this.readUInt32LE(this.pos + 4)
    const value = { int: { low, high }, value: this.buffer.slice(this.pos, this.pos + 8) }
    this.pos += 8
    return value
  }

  decodeBytes (length) {
    if (this.pos + length > this.buffer.length) {
      throw new Error('Unexpected end of buffer while decoding bytes')
    }
    const bytes = this.buffer.slice(this.pos, this.pos + length)
    this.pos += length
    return bytes
  }

  decodeGroup (fieldNumber) {
    const group = {}
    const start = this.pos
    while (true) {
      if (this.pos >= this.buffer.length) {
        throw new Error('Unexpected end of buffer while decoding group')
      }
      const tag = this.decodeVarint().int
      const wireType = tag & 0x07
      const number = tag >> 0x03
      if (wireType === 4) {
        break // End of group
      }
      const value = this.decodeField(tag, wireType)
      group[number] ||= []
      value.fieldNumber = number
      group[number].push(value)
    }
    return { group, value: this.buffer.slice(start, this.pos) }
  }

  decodeField (fieldNumber, wireType) {
    this.debug(`Decoding field number ${fieldNumber} with wire type ${wireType}`)
    let out = { wireType, fieldNumber }
    switch (wireType) {
      case 0: // Varint
        out = { ...out, ...this.decodeVarint() }; break
      case 1: // 64-bit
        out = { ...out, ...this.decode64Bit() }; break
      case 2: // Length-delimited (string, bytes, or nested message)
        out.value = this.decodeBytes(this.decodeVarint().int); break
      case 3: // Start group
        const d = this.decodeGroup(fieldNumber)
        out = { ...out, ...d }; break
      case 4: // End group
        throw new Error('Unexpected end group tag')
      case 5: // 32-bit
        out = { ...out, ...this.decode32Bit() }; break
      default:
        throw new Error(`Unsupported wire type: ${wireType}`)
    }
    return out
  }

  decode () {
    const result = {}
    while (this.pos < this.buffer.length) {
      const tag = this.decodeVarint().int
      const wireType = tag & 0x07
      const fieldNumber = tag >> 0x03
      result[fieldNumber] ||= []
      const v = this.decodeField(fieldNumber, wireType)
      if (Array.isArray(v)) {
        result[fieldNumber].push(...v)
      } else {
        result[fieldNumber].push(v)
      }
    }
    return result
  }
}

export const decodeMessage = (buffer) => new ProtobufDecoder(buffer).decode()

const tdec = new TextDecoder()

export const decoders = {
  string: f => tdec.decode(f.value),
  bytes: f => f.value,
  sub: f => decodeMessage(f.value),
  raw: f => f,
  uint: f => {
    if (f.wireType === 0) {
      return f.int
    }
    const a = f.value.buffer
    const d = new DataView(a)
    if (a.byteLength === 4) {
      return d.getUint32(0, true)
    } else if (a.byteLength >= 8) {
      return d.getBigUint64(0, true)
    }
  },
  int: f => {
    if (f.wireType === 0) {
      return f.int
    }
    const a = f.value.buffer
    const d = new DataView(a)
    if (a.byteLength === 4) {
      return d.getInt32(0, true)
    } else if (a.byteLength >= 8) {
      return d.getBigInt64(0, true)
    }
  },
  float: f => {
    if (f.wireType === 0) {
      return f.int
    }
    const a = f.value.buffer
    const d = new DataView(a)
    if (a.byteLength === 4) {
      return d.getFloat32(0, true)
    } else if (a.byteLength >= 8) {
      return d.getFloat64(0, true)
    }
  }
}

export function query (root, q) {
  const [path, renderType = 'bytes'] = q.split(':')
  let current = [root]
  const findPath = path.split('.')
  const fieldId = findPath.pop()

  for (const p of findPath) {
    const nc = []
    for (const tree of current) {
      try {
        nc.push(...tree[p].map(t => {
          if (t.group) {
            return t.group
          }
          return decodeMessage(t.value)
        }))
      } catch (e) {
        // console.error(e.message)
      }
    }
    current = nc
  }

  const out = []
  for (const c of current) {
    for (const tree of c[fieldId]) {
      out.push(decoders[renderType](tree))
    }
  }
  return out
}

// USAGE TESTING BELOW

const root = decodeMessage(await readFile(join(dirname(fileURLToPath(import.meta.url)), 'hearthstone.bin')))

// this is how to manually delve into each field
describe('Manual', () => {
  // 1.2.4
  const sub1 = decodeMessage(root[1][0].value)
  const sub2 = decodeMessage(sub1[2][0].value)
  const appRoot = decodeMessage(sub2[4][0].value)

  test('ID', () => {
    expect(decoders.string(appRoot[1][0])).toEqual('com.blizzard.wtcg.hearthstone')
  })

  test('Title', () => {
    expect(decoders.string(appRoot[5][0])).toEqual('Hearthstone')
  })

  test('Group Sub-query (media)', () => {
    const mediaItems = []
    for (const m of appRoot[10]) {
      const mediaRoot = decodeMessage(m.value)
      const type = decoders.uint(mediaRoot[1][0])
      const url = decoders.string(mediaRoot[5][0])
      let width
      let height
      try {
        width = decoders.uint(mediaRoot[2][0].group[3][0])
        height = decoders.uint(mediaRoot[2][0].group[4][0])
      } catch (e) {}

      mediaItems.push({ type, url, width, height })
    }
    expect(mediaItems.length).toEqual(10)
  })
})

// this is how to do same with queries (probly better, in general)

describe('Query', () => {
  test('ID', () => {
    expect(query(root, '1.2.4.1:string').pop()).toEqual('com.blizzard.wtcg.hearthstone')
  })

  test('Title', () => {
    expect(query(root, '1.2.4.5:string').pop()).toEqual('Hearthstone')
  })

  test('Group Sub-query (media)', () => {
    const types = query(root, '1.2.4.10.1:uint')
    expect(types.length).toEqual(10)

    const urls = query(root, '1.2.4.10.5:string')
    expect(urls.length).toEqual(10)

    // not all types have height/width, so it's only 8

    const widths = query(root, '1.2.4.10.2.3:uint')
    expect(widths.length).toEqual(8)

    const heights = query(root, '1.2.4.10.2.4:uint')
    expect(heights.length).toEqual(8)

    // here is how to build a cohesive object, since types 3/13 do not have dims
    let type
    const mediaItems = []
    while (type = types.pop()) {
      let width
      let height
      if (![3, 13].includes(type)) {
        width = widths.pop()
        height = heights.pop()
      }
      mediaItems.push({ type, url: urls.pop(), width, height })
    }
    expect(mediaItems.length).toEqual(10)
  })
})
