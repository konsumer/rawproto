import { unflatten } from 'flat'

export const wireTypes = {
  VARINT: 0, //  int32, int64, uint32, uint64, sint32, sint64, bool, enum
  I64: 1, // fixed64, sfixed64, double
  LEN: 2, // string, bytes, embedded messages, packed repeated fields
  SGROUP: 3, //  group start (deprecated)
  EGROUP: 4, //  group end (deprecated)
  I32: 5 // fixed32, sfixed32, float
}

const dec = new TextDecoder()

export const wireMap = {
  0: ['uint', 'int', 'int32', 'int64', 'uint32', 'uint64', 'sint32', 'sint64', 'bool', 'raw', 'bytes'],
  1: ['uint', 'int', 'bytes', 'fixed64', 'sfixed64', 'double'],
  2: ['raw', 'bytes', 'string', 'sub', 'packedIntVar', 'packedInt32', 'packedInt64'],
  5: ['uint', 'int', 'bytes', 'fixed32', 'sfixed32', 'float', 'raw']
}

export class ReaderFixed {
  constructor (buffer, type, path, renderType) {
    this.buffer = buffer
    this.type = type
    this.dataView = new DataView(this.buffer)
    this.path = path
    this.renderType = renderType || wireMap[this.type][0]
  }

  // lazy-load representations other than this.buffer (ArrayBuffer)
  get raw () {
    return this
  }

  get string () {
    return this.int + ''
  }

  get bytes () {
    this._bytes ||= new Uint8Array(this.buffer)
    return this._bytes
  }
}

export class ReaderFixed64 extends ReaderFixed {
  constructor (buffer, path, renderType) {
    super(buffer, wireTypes.I64, path, renderType)
  }

  // lazy-load representations other than this.buffer (ArrayBuffer)
  get uint () {
    const v = this.dataView.getBigUint64(0, true)
    try {
      return parseInt(v)
    } catch (e) {
      return v
    }
  }

  get int () {
    const v = this.dataView.getBigInt64(0, true)
    try {
      return parseInt(v)
    } catch (e) {
      return v
    }
  }

  get float () {
    const v = this.dataView.getFloat64(0, true)
    try {
      return parseFloat(v)
    } catch (e) {
      return v
    }
  }

  get double () {
    return this.float
  }

  get fixed64 () {
    return this.uint
  }

  get sfixed64 () {
    return this.int
  }
}

export class ReaderFixed32 extends ReaderFixed {
  constructor (buffer, path, renderType) {
    super(buffer, wireTypes.I32, path, renderType)
  }

  // lazy-load representations other than this.buffer (ArrayBuffer)
  get uint () {
    return this.dataView.getUint32(0, true)
  }

  get int () {
    return this.dataView.getInt32(0, true)
  }

  get float () {
    return this.dataView.getFloat32(0, true)
  }

  get fixed32 () {
    return this.uint
  }

  get sfixed32 () {
    return this.int
  }
}

export class ReaderVarInt {
  constructor (buffer, path, renderType, value) {
    this.type = wireTypes.VARINT
    this.buffer = buffer
    this.value = this.uint = this.int = value
    this.path = path
    this.renderType = renderType || wireMap[this.type][0]
  }

  // lazy-load representations other than this.buffer (ArrayBuffer)
  get raw () {
    return this
  }

  get bytes () {
    this._bytes ||= new Uint8Array(this.buffer)
    return this._bytes
  }

  get string () {
    return this.uint.toString()
  }

  get bool () {
    return !!this.uint
  }

  get int32 () {
    return this.int
  }

  get int64 () {
    return this.int
  }

  get sint32 () {
    return this.int
  }

  get sint64 () {
    return this.int
  }

  get uint32 () {
    return this.uint
  }

  get uint64 () {
    return this.uint
  }
}

export class ReaderMessage {
  constructor (buffer, path = '0', renderType) {
    this.type = wireTypes.LEN
    this.path = path
    this.renderType = renderType || wireMap[this.type][0]

    // Buffer is weird because it will say it's an instance of Uint8Array
    if (typeof Buffer !== 'undefined' && buffer instanceof Buffer) {
      this.bytes = new Uint8Array(buffer)
      this.buffer = this.bytes.buffer
    } else if (buffer instanceof ArrayBuffer) {
      this.buffer = buffer
      this.bytes = new Uint8Array(this.buffer)
    } else if (buffer instanceof Uint8Array) {
      this.buffer = buffer.buffer
      this.bytes = new Uint8Array(this.buffer)
    } else {
      this.bytes = new Uint8Array(buffer)
      this.buffer = this.bytes.buffer
    }
    this.offset = 0
  }

  // render: pull a group (as bytes) from this
  readBufferUntilGroupEnd (index) {
    const offsetStart = this.offset
    let indexType = parseInt(this.readVarInt())
    let type = indexType & 7
    let foundIndex = index

    while (type !== wireTypes.EGROUP) {
      indexType = parseInt(this.readVarInt())
      type = indexType & 7
      foundIndex = indexType >> 3
    }

    if (foundIndex !== index) {
      throw new Error(`Group index ${foundIndex} should match ${index}`)
    }

    return this.buffer.slice(offsetStart, this.offset)
  }

  // render: pull a varint from this
  readVarInt () {
    if (typeof this.offset === 'undefined') {
      throw new Error('Offset must be defined to use readVarInt. If you really want to do this, try setting it to 0.')
    }
    let result = 0
    let shift = 0
    let byte
    do {
      if (this.offset >= this.buffer.byteLength) {
        throw new Error(`Buffer overflow while reading varint: ${this.offset}/${this.buffer.byteLength}`)
      }
      byte = this.bytes[this.offset++]
      result |= (byte & 0x7f) << shift
      shift += 7
    } while (byte >= 0x80)
    return result
  }

  // lazy-load fields

  // is it possible this is a message?
  get couldHaveSub () {
    if (typeof this._couldHaveSub === 'undefined') {
      this._couldHaveSub = Object.keys(this.sub).length > 0
    }
    return this._couldHaveSub
  }

  // is it likely this is a string?
  get likelyString () {
    this._likelyString ||= typeof (this.bytes.find(b => b < 32)) === 'undefined'
    return this._likelyString
  }

  // get list of sub-fields with counts
  get fields () {
    if (this._fields) {
      return this._fields
    }

    // sub triggers field-analysis
    const s = this.sub
    return this._fields
  }

  // get sub-fields, triggers sub-render (cached)
  get sub () {
    if (this._sub) {
      return this._sub
    }

    this.offset = 0
    this._fields = {}
    this._sub = {}

    let rollbackOffset = this.offset

    try {
      while (this.offset < this.buffer.byteLength) {
        const indexType = parseInt(this.readVarInt())
        const type = indexType & 7
        const index = indexType >> 3
        this._fields[index] ||= 0
        this._fields[index]++
        this._sub[index] ||= []

        if (type === wireTypes.VARINT) {
          const s = this.offset
          const value = parseInt(this.readVarInt())
          const reader = new ReaderVarInt(this.buffer.slice(s, this.offset - 1), [this.path, index].join('.'), 'int', value)
          this._sub[index].push(reader)
          rollbackOffset = this.offset
        }

        if (type === wireTypes.LEN) {
          const byteLength = this.readVarInt()
          const reader = new ReaderMessage(this.buffer.slice(this.offset, this.offset + byteLength), [this.path, index].join('.'))
          this.offset += byteLength
          this._sub[index].push(reader)
          rollbackOffset = this.offset
        }

        if (type === wireTypes.SGROUP) {
          const reader = new ReaderMessage(this.readBufferUntilGroupEnd(index), [this.path, index].join('.'))
          this._sub[index].push(reader)
          rollbackOffset = this.offset
        }

        if (type === wireTypes.I64) {
          const reader = new ReaderFixed64(this.buffer.slice(this.offset, this.offset + 8), [this.path, index].join('.'))
          this.offset += 8
          this._sub[index].push(reader)
          rollbackOffset = this.offset
        }

        if (type === wireTypes.I32) {
          const reader = new ReaderFixed32(this.buffer.slice(this.offset, this.offset + 4), [this.path, index].join('.'))
          this.offset += 4
          this._sub[index].push(reader)
          rollbackOffset = this.offset
        }
      }
      return this._sub
    } catch (e) {
      this.remainder = this.buffer.slice(rollbackOffset)
      return {}
    }
  }

  // get raw representation of this (used for queries)
  get raw () {
    return this
  }

  // get string of this
  get string () {
    this._string ||= dec.decode(this.bytes)
    return this._string
  }

  // render: pull packed ints from this

  get packedIntVar () {
    if (typeof this._packedintvar !== 'undefined') {
      return this._packedintvar
    }
    this._packedintvar = []
    this.offset = 0
    while (this.offset < this.buffer.byteLength) {
      this._packedintvar.push(this.readVarInt())
    }
    return this._packedintvar
  }

  get packedInt32 () {
    if (typeof this._packedint32 !== 'undefined') {
      return this._packedint32
    }
    this.dataView ||= new DataView(this.buffer)
    this._packedint32 = []
    this.offset = 0
    while (this.offset < this.buffer.byteLength) {
      this._packedint32.push(this.dataView.getInt32(this.offset, true))
      this.offset += 4
    }
    return this._packedint32
  }

  get packedInt64 () {
    if (typeof this._packedint64 !== 'undefined') {
      return this._packedint64
    }
    this.dataView ||= new DataView(this.buffer)
    this._packedint64 = []
    this.offset = 0
    while (this.offset < this.buffer.byteLength) {
      try {
        this._packedint64.push(parseInt(this.dataView.getBigInt64(this.offset, true)))
      } catch (e) {
        this._packedint64.push(this.dataView.getBigInt64(this.offset, true))
      }
      this.offset += 8
    }
    return this._packedint64
  }

  // utils

  // use string-queries to get data, without walking all messages (just those in query)
  query (...queries) {
    return query(this, this.path, ...queries)
  }

  toJS (queryMap = {}, prefix = 'f') {
    return toJS(this, queryMap, prefix)
  }

  toProto (queryMap = {}, prefix = 'f') {
    return toProto(this, queryMap, prefix, queryMap)
  }
}

export function query (tree, prefix = '0', ...queries) {
  const out = []
  for (const q of queries) {
    let [path, type = 'raw'] = q.split(':')
    if (path.substr(0, prefix.length) !== prefix) {
      path = `${prefix}.${path}`
    }
    const pathTraverse = path.replace(new RegExp(`^${prefix}\.`), '').split('.')
    let current = [tree]
    for (const i of pathTraverse) {
      const ca = []
      for (const c of current) {
        if (c.sub[i]) {
          ca.push(...c.sub[i])
        }
      }
      current = ca
    }
    out.push(...current.filter(c => c.path === path).map(c => c[type]))
  }
  return out
}

export function toJS (tree, queryMap, prefix = 'f', nameMap, typeMap) {
  let out = {}

  // this is used as a marker that it's top-level
  if (typeof queryMap === 'object') {
    if (!nameMap) {
      nameMap = {}
    }
    if (!typeMap) {
      typeMap = {}
    }
    for (const name of Object.keys(queryMap)) {
      let [path, type = 'raw'] = queryMap[name].split(':')
      if (path[0] !== '0') {
        path = `0.${path}`
      }
      nameMap[path] = name
      typeMap[path] = type
    }
  }

  for (const subs of Object.values(tree.sub || {})) {
    for (const t of subs) {
      try {
        const name = nameMap[t.path] || t.path
        const renderType = typeMap[t.path] || t.renderType
        if (t.type === wireTypes.LEN && !['string', 'bytes'].includes(renderType)) {
          if (t.couldHaveSub) {
            out = { ...out, ...toJS(t, undefined, prefix, nameMap, typeMap) }
          } else if (t.likelyString) {
            out[name] = t.string
          } else {
            out[name] = t.bytes
          }
        } else {
          out[name] = t[renderType]
        }
      } catch (e) {}
    }
  }

  return unflatten(out)
}

export function toProto (tree, queryMap, prefix = 'f') {
  const out = {}

  return out
}

export const hex = (b, p = '0x') => [...b].map(b => p + b.toString(16)).join(', ')

export default ReaderMessage
