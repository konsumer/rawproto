
// TODO: flat makes it easier to do things, but is pretty big copy.

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
  0: ['int', 'bool', 'raw'],
  1: ['int', 'uint', 'bytes', 'float', 'raw'],
  2: ['raw', 'bytes', 'string', 'sub', 'packedvarint', 'packedint32', 'packedint64'],
  5: ['int', 'uint', 'bytes', 'float', 'raw']
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
    return this.uint.toString()
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
    return this.dataView.getBigUint64(0, true)
  }

  get int () {
    return this.dataView.getBigInt64(0, true)
  }

  get float () {
    return this.dataView.getFloat64(0, true)
  }
}

export class ReaderFixed32 extends ReaderFixed {
  constructor (buffer, path, renderType) {
    super(buffer, wireTypes.I64, path, renderType)
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
}

export class ReaderVarInt {
  constructor (buffer, value, path, renderType) {
    this.type = wireTypes.VARINT
    this.buffer = buffer
    this.uint = value
    this.int = value
    this.path = path
    this.renderType = renderType || wireMap[this.type][0]
  }

  // lazy-load representations other than this.buffer (ArrayBuffer)
  get raw () {
    return this
  }

  get bytes () {
    this._bytes ||= new Uint8Array(this.buffer).slice(...this.pos)
    return this._bytes
  }

  get string () {
    return this.uint.toString()
  }

  get bool () {
    return !!this.uint
  }
}

export class ReaderMessage {
  constructor (buffer, path = '0', renderType) {
    this.type = wireTypes.LEN
    this.path = path
    this.renderType = renderType || wireMap[this.type][0]

    if (buffer instanceof ArrayBuffer) {
      this.buffer = buffer
    } else if (buffer instanceof Array) {
      this.buffer = new Uint8Array(buffer).buffer
    } else if (buffer instanceof Uint8Array) {
      this.buffer = buffer.buffer
    }
    this.bytes = new Uint8Array(this.buffer)
    this.offset = 0
  }

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

  readVarInt () {
    if (typeof this.offset === 'undefined') {
      throw new Error('offset must be defined to use readVarInt. If you really want to do this, try setting it to 0.')
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

  // is it possible this is a message?
  couldHaveSub () {
    const sub = this.sub
    if (Object.keys(sub).length > 0) {
      return true
    }
    return false
  }

  // lazy-load representations other than this.buffer (ArrayBuffer)

  get fields () {
    if (this._fields) {
      return this._fields
    }

    // sub triggers field-analysis
    const s = this.sub
    return this._fields
  }

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
          const reader = new ReaderVarInt(this.buffer.slice(s, this.offset), value, [this.path, index].join('.'))
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

  get raw () {
    return this
  }

  get string () {
    this._string ||= dec.decode(this.bytes)
    return this._string
  }

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
      this._packedint32.push(this.dataView.getInt64(this.offset, true))
      this.offset += 8
    }
    return this._packedint64
  }

  // utils

  // use string-queries to get data, without walking all messages (just those in query)
  query (q) {
    const [path, type = 'raw'] = q.split(':')
    const p = path.split('.')
    if (p.length === 1) {
      return this.sub[path].map(i => i[type])
    }
    const subq = `${p.slice(1).join('.')}:${type}`
    if (this.sub[p[0]]) {
      return this.sub[p[0]].map(m => m.query(subq)).reduce((a, c) => [...a, ...c], []).filter(m => typeof m !== 'undefined')
    } else {
      return []
    }
  }

  // apply a callback to every field
  walk (cb, typeMap = {}, nameMap = {}) {
    for (const flist of Object.values(this.sub)) {
      for (const field of flist) {
        field.name = nameMap[field.path] || field.path
        cb(field)
        if (field.type === wireTypes.LEN) {
          field.walk(cb, typeMap, nameMap)
        }
      }
    }
  }

  // output JSON-compat object for this message
  toJS (typeMap = {}, nameMap = {}) {
    const out = {}
    return out
  }

  // output string of .proto SDL for this message
  toProto (typeMap = {}, nameMap = {}) {
    const out = []
    return out.join('\n')
  }
}

export default ReaderMessage
