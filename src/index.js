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
  2: ['bytes', 'string', 'sub', 'packedvarint', 'packedint32', 'packedint64', 'raw'],
  5: ['int', 'uint', 'bytes', 'float', 'raw']
}

export class ReaderFixed {
  constructor (buffer, type) {
    this.buffer = buffer
    this.type = type
    this.dataView = new DataView(this.buffer)
  }

  // lazy-load representations other than this.buffer (ArrayBuffer)
  get string () {
    return this.uint.toString()
  }

  get bytes () {
    this._bytes ||= new Uint8Array(this.buffer)
    return this._bytes
  }
}

export class ReaderFixed64 extends ReaderFixed {
  constructor (buffer) {
    super(buffer, wireTypes.I64)
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
  constructor (buffer) {
    super(buffer, wireTypes.I64)
  }

  // lazy-load representations other than this.buffer (ArrayBuffer)
  get uint () {
    return this.dataView.getBigUint32(0, true)
  }

  get int () {
    return this.dataView.getBigInt32(0, true)
  }

  get float () {
    return this.dataView.getFloat32(0, true)
  }
}

export class ReaderVarInt {
  constructor (buffer, value) {
    this.type = wireTypes.VARINT
    this.buffer = buffer
    this.uint = value
    this.int = value
  }

  // lazy-load representations other than this.buffer (ArrayBuffer)
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
  constructor (buffer) {
    this.type = wireTypes.LEN

    if (buffer instanceof ArrayBuffer) {
      this.buffer = buffer
    } else if (buffer instanceof Array) {
      this.buffer = new Uint8Array(buffer).buffer
    } else if (buffer instanceof Uint8Array) {
      this.buffer = buffer.buffer
    }

    this.offset = 0
    this.fields = {}

    this.bytes = new Uint8Array(this.buffer)

    try {
      while (this.offset < this.buffer.byteLength) {
        const indexType = parseInt(this.readVarInt())
        const type = indexType & 7
        const index = indexType >> 3
        this.fields[index] ||= 0
        this.fields[index]++

        if (type === wireTypes.VARINT) {
          const s = this.offset
          const value = parseInt(this.readVarInt())
          this[index] ||= []
          const reader = new ReaderVarInt(this.buffer.slice(s, this.offset), value)
          reader.pos = [s, this.offset]
          reader.index = index
          this[index].push(reader)
        }

        if (type === wireTypes.LEN) {
          this[index] ||= []
          const byteLength = this.readVarInt()
          const reader = new ReaderMessage(this.buffer.slice(this.offset, this.offset + byteLength))
          reader.pos = [this.offset, this.offset + byteLength]
          reader.index = index
          this[index].push(reader)
          this.offset += byteLength
        }

        // TODO wireTypes.SGROUP

        if (type === wireTypes.I64) {
          this[index] ||= []
          const reader = new ReaderFixed64(this.buffer.slice(this.offset, this.offset + 8))
          reader.pos = [this.offset, this.offset + 8]
          reader.index = index
          this[index].push(reader)
          this.offset += 8
        }

        if (type === wireTypes.I32) {
          this[index] ||= []
          const reader = new ReaderFixed32(this.buffer.slice(this.offset, this.offset + 4))
          reader.pos = [this.offset, this.offset + 4]
          reader.index = index
          this[index].push(reader)
          this.offset += 4
        }
      }
    } catch (e) {
      this.offset = 0
    }
  }

  readVarInt () {
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

  // lazy-load representations other than this.buffer (ArrayBuffer)
  get raw () {
    return this
  }

  get string () {
    this._string ||= dec.decode(this.buffer)
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
}

export default ReaderMessage
