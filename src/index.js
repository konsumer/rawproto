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
  0: ['raw', 'uint', 'bool'],
  1: ['raw', 'bytes', 'uint', 'int', 'float'],
  2: ['raw', 'bytes', 'string', 'packedvarint', 'packedint32', 'packedint64'],
  5: ['raw', 'bytes', 'uint', 'int', 'float']
}

export const parseLabels = {
  int: 'Signed Integer',
  uint: 'Unsigned Integer',
  float: 'Decimal',
  bool: 'Boolean',
  string: 'String',
  bytes: 'Bytes',
  raw: 'Raw',
  sub: 'Sub-Message'
}

// perform a query using a path
export function query (tree, path, choices = {}, prefix = '') {
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
  const pp = p.split('.').map(i => parseInt(i))
  const targetField = parseInt(pp.pop())

  // this will give you just the messages that the query asked for
  for (const pathIndex of pp) {
    current = current
      .filter(c => c.index === parseInt(pathIndex))
      .map(c => new Reader(c.value).readMessage())
      .reduce((a, c) => [...a, ...c], [])
  }

  // raw
  let valuePuller = f => f

  if (['int', 'uint', 'float', 'bool'].includes(type)) {
    valuePuller = f => {
      if (f.type === wireTypes.VARINT) {
        if (type === 'uint' || type === 'int') { // I don't really support signed ints, but the user may be mistaken here (using int for VARINT)
          return f.value
        }
        if (type === 'bool') {
          return !!f.value
        }
      }
      // numeric types that require a view
      if (f.type === wireTypes.I64 && type === 'uint') {
        return decoders.uint64(f.value)
      }
      if (f.type === wireTypes.I64 && type === 'int') {
        return decoders.int64(f.value)
      }
      if (f.type === wireTypes.I64 && type === 'float') {
        return decoders.float64(f.value)
      }
      if (f.type === wireTypes.I32 && type === 'uint') {
        return decoders.uint32(f.value)
      }
      if (f.type === wireTypes.I32 && type === 'int') {
        return decoders.int32(f.value)
      }
      if (f.type === wireTypes.I32 && type === 'float') {
        return decoders.float32(f.value)
      }
    }
  }

  if (type === 'bytes') {
    valuePuller = f => f.value
  }

  if (type === 'string') {
    valuePuller = f => decoders.string(f.value)
  }

  if (type === 'packedvarint') {
    valuePuller = f => decoders.packedIntVar(f.value)
  }

  if (type === 'packedint32') {
    valuePuller = f => decoders.packedInt32(f.value)
  }

  if (type === 'packedint64') {
    valuePuller = f => decoders.packedInt64(f.value)
  }

  // apply a value-transformer to every field that has the value the user wants
  return current.filter(c => c.index === targetField).map(valuePuller)
}

export class Reader {
  constructor (buffer) {
    this.buffer = new Uint8Array(buffer)
    this.offset = 0
  }

  // read a VARINT from buffer, at offset
  readVarInt () {
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
  readBuffer (length) {
    if ((this.offset + length) > this.buffer.length) {
      throw new Error(`Buffer overflow while reading buffer ${length} bytes`)
    }
    const result = this.buffer.slice(this.offset, this.offset + length)
    this.offset += length
    return result
  }

  // read a group at current offset
  readGroup (index) {
    const offsetStart = this.offset
    let indexType = parseInt(this.readVarInt())
    let type = indexType & 0b111
    let foundIndex = index

    while (type !== wireTypes.EGROUP) {
      indexType = parseInt(this.readVarInt())
      type = indexType & 0b111
      foundIndex = indexType >> 3
    }

    if (foundIndex !== index) {
      throw new Error(`Group index ${foundIndex} should match ${index}`)
    }

    return this.buffer.slice(offsetStart, this.offset)
  }

  handleField (type, index) {
    const newrec = { type, index, pos: [this.offset] }
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
        // this checks if sub-image is possible
        try {
          new Reader(newrec.value).readMessage()
          newrec.sub = true
        } catch (e) {}
        return newrec
      case wireTypes.SGROUP:
        newrec.value = this.readGroup(index)
        newrec.pos.push(this.offset)
        return newrec
      case wireTypes.I32:
        newrec.value = this.readBuffer(4)
        newrec.pos.push(this.offset)
        return newrec
      default:
        throw new Error(`Unknown wireType: ${type}`)
    }
  }

  // read 1 level of LEN message field
  readMessage () {
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
}

export default Reader
