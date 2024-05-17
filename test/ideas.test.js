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
      const number = tag >> 3
      if (wireType === 4 && number === fieldNumber) {
        break // End of group
      }
      const value = this.decodeField(tag)
      if (group[number]) {
        if (!Array.isArray(group[number])) {
          group[number] = [group[number]]
        }
        group[number].push(value)
      } else {
        group[number] = value
      }
    }
    return { group, value: this.buffer.slice(start, this.pos) }
  }

  decodeField (tag) {
    const wireType = tag & 0x07
    const fieldNumber = tag >> 3
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
        out = { ...out, ...this.decodeGroup(fieldNumber) }; break
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
      const fieldNumber = tag >> 3
      const value = this.decodeField(tag)

      if (result[fieldNumber]) {
        if (!Array.isArray(result[fieldNumber])) {
          result[fieldNumber] = [result[fieldNumber]]
        }
        result[fieldNumber].push(value)
      } else {
        result[fieldNumber] = value
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
      if (Array.isArray(tree[p])) {
        nc.push(...tree[p].map(b => decodeMessage(b.value)))
      } else {
        nc.push(decodeMessage(tree[p].value))
      }
    }
    current = nc
  }

  return current.map(c => decoders[renderType](c[fieldId]))
}

const root = decodeMessage(await readFile(join(dirname(fileURLToPath(import.meta.url)), 'hearthstone.bin')))

describe('Query', async () => {
  test('Basic Fields', () => {
    expect(query(root, '1.2.4.1:string').pop()).toEqual('com.blizzard.wtcg.hearthstone')
    expect(query(root, '1.2.4.5:string').pop()).toEqual('Hearthstone')
  })

  test('Group Sub-query (media)', () => {
    const medias = query(root, '1.2.4.10:sub').map(r => ({
      type: query(r, '1:uint').pop(),
      url: query(r, '5:string').pop(),
      width: query(r, '2.3:uint').pop(),
      height: query(r, '2.4:uint').pop()
    }))
    expect(medias.length).toEqual(10)
  })
})
