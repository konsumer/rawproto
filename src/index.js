// https://protobuf.dev/programming-guides/encoding/

import * as decoders from './decoders'

export { decoders }

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
  5: '32bit Number'
}

export const wireMap = {
  0: ['uint', 'bool', 'raw'],
  1: ['uint', 'int', 'bytes', 'float', 'raw'],
  2: ['string', 'bytes', 'sub', 'packedvarint', 'packedint32', 'packedint64', 'raw'],
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

// perform a query using a path
export function query(tree, path, choices = {}, prefix = '') {
  if (typeof choices === 'string') {
    if (!prefix) {
      prefix = choices
      choices = {}
    } else {
      throw new Error('Usage: query(tree, choices, "X.X.X") or query(tree, "X.X.X:type")')
    }
  }

  // this allows you to override type in path, but also will apply type-choice & prefix
  let [p, type] = path.split(':')
  if (!type) {
    if (prefix) {
      p = `${prefix}.${p}`
    }
    if (choices[p]) {
      type = choices[p]
    } else {
      type = 'raw'
    }
  }

  // now type is the type of value to pull, and p is the path, from the top

  let current = tree
  const pp = p.split('.').map((i) => parseInt(i))
  const targetField = parseInt(pp.pop())

  // this will give you just the messages that the query asked for
  for (const pathIndex of pp) {
    current = current
      .filter((c) => c.index === parseInt(pathIndex))
      .map((c) => new RawProto(c.value).readMessage())
      .reduce((a, c) => [...a, ...c], [])
  }

  // apply a value-transformer to every field that has the value the user wants
  return current.filter((c) => c.index === targetField).map((f) => decoders.getValue(f, type))
}

export class RawProto {
  constructor(buffer, choices = {}) {
    this.buffer = new Uint8Array(buffer)
    this.offset = 0
    this.choices = choices
  }

  query(path, choices, prefix = '') {
    this.tree ||= this.readMessage()
    return query(this.tree, path, choices || this.choices || {}, prefix)
  }

  // read a VARINT from buffer, at offset
  readVarInt() {
    let result = 0
    let shift = 0
    let byte
    do {
      if (this.offset >= this.buffer.length) {
        throw new Error('Buffer overflow while reading varint')
      }
      byte = this.buffer[this.offset++]
      result |= (byte & 0x7f) << shift
      shift += 7
    } while (byte >= 0x80)
    return result
  }

  // read a portion of the buffer, at offset
  readBuffer(length) {
    if (this.offset + length > this.buffer.length) {
      throw new Error(`Buffer overflow while reading buffer ${length} bytes`)
    }
    const result = this.buffer.slice(this.offset, this.offset + length)
    this.offset += length
    return result
  }

  // read a group for index number (from current offset)
  readGroup(index) {
    const offsetStart = this.offset
    let indexType = parseInt(this.readVarInt())
    let type = indexType & 0b111
    while (type !== wireTypes.EGROUP) {
      indexType = parseInt(this.readVarInt())
      type = indexType & 0b111
    }
    return this.buffer.slice(offsetStart, this.offset)
  }

  handleField(type, index) {
    // choose first renderType as default
    // TODO: handle choices
    let renderType = 'raw'
    if (wireMap[type]) {
      renderType = wireMap[type][0]
    }

    const newrec = { type, index, pos: [this.offset], renderType }
    switch (type) {
      case wireTypes.VARINT:
        newrec.value = this.readVarInt()
        newrec.pos.push(this.offset)
        return newrec
      case wireTypes.I64:
        newrec.value = this.readBuffer(8)
        newrec.pos.push(this.offset)
        return newrec
      case wireTypes.LEN:
        newrec.value = this.readBuffer(this.readVarInt())
        newrec.pos.push(this.offset)
        // this checks if sub-message is possible
        try {
          newrec.sub = new RawProto(newrec.value).readMessage()
          newrec.renderType = 'sub'
        } catch (e) {}
        return newrec
      case wireTypes.SGROUP:
        newrec.value = this.readGroup(index)
        newrec.pos.push(this.offset)
        return newrec
      case wireTypes.EGROUP:
        // I don't think think I should hit this one
        return
      case wireTypes.I32:
        newrec.value = this.readBuffer(4)
        newrec.pos.push(this.offset)
        return newrec
      default:
        throw new Error(`Unknown wireType: ${type}`)
    }
  }

  // read 1 level of LEN message field
  readMessage() {
    const out = []
    while (this.offset < this.buffer.length) {
      const indexType = parseInt(this.readVarInt())
      const r = this.handleField(indexType & 0b111, indexType >> 3)
      if (r) {
        out.push(r)
      }
    }
    return out
  }

  walk(callback) {
    throw new Error('TODO')
  }

  toJS(path = '') {
    throw new Error('TODO')
  }

  toProto(path = '') {
    throw new Error('TODO')
  }
}

export default RawProto
