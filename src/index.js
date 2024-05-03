// https://protobuf.dev/programming-guides/encoding/

import * as decoders from './decoders'

const { wireTypes, wireLabels, wireMap, parseLabels } = decoders

export { decoders, wireTypes, wireLabels, wireMap, parseLabels }

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
  if (prefix) {
    p = `${prefix}.${p}`
  }
  if (!type) {
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

  handleField(type, index, prefix = '') {
    const path = prefix ? `${prefix}.${index}` : index.toString()

    // choose first renderType as default, if chjoice not set
    let renderType = this.choices[path]
    if (!renderType) {
      if (wireMap[type]) {
        renderType = wireMap[type][0]
      }
    }

    const newrec = { path, type, index, pos: [this.offset], renderType }

    if (type === wireTypes.SGROUP || type === wireTypes.EGROUP || type > wireTypes.I32) {
      delete newrec.renderType
    }

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
        newrec.value = decoders.getValue(newrec, renderType)
        newrec.pos.push(this.offset)
        return newrec
      case wireTypes.SGROUP:
        // just get bytes
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
  readMessage(prefix = '') {
    // TODO: use this.choices to insert renderType
    const out = []
    while (this.offset < this.buffer.length) {
      const indexType = parseInt(this.readVarInt())
      const r = this.handleField(indexType & 0b111, indexType >> 3, prefix)
      if (r) {
        out.push(r)
      }
    }
    return out
  }

  // These are wrapopers around other utils that could be used seperately

  query(path, prefix = '') {
    this.offset = 0
    this.tree ||= this.readMessage(prefix)
    this.offset = 0
    return query(this.tree, path, this.choices, prefix)
  }

  walk(callback, prefix = '') {
    return walk(this, callback, prefix)
  }

  toJS(prefix = '') {
    return this.walk(walkerJS, prefix)
  }

  toJSON(...args) {
    return this.toJS(...args)
  }

  toProto(prefix = '') {
    return this.walk(walkerProto, prefix)
  }
}

// simple util to remove a prefix from an object keyed by flat paths (like choices)
export const removePathPrefix = (choices = {}, path = '') =>
  Object.keys(choices).reduce((a, v, i) => {
    return { ...a, [v.replace(new RegExp(`^${path}\.`), '')]: choices[v] }
  }, {})

// walk over a tree recursivley calling callback on each item, each field is outputted as an array, eah message is an object
export function walk(reader, callback, prefix = '') {
  reader.offset = 0
  reader.tree ||= reader.readMessage(prefix)
  reader.offset = 0
  const out = {}
  for (const field of reader.tree) {
    out[field.index] ||= []
    const path = prefix ? `${prefix}.${field.index}` : field.index
    out[field.index].push(callback(field, path, reader, callback))
  }
  return out
}

// generic walker that will apply default transforms to every field
export function walkerJS(field, path, reader, callback) {
  if (field.type === wireTypes.LEN) {
    try {
      return walk(new RawProto(field.value, removePathPrefix(reader.choices, path)), callback, path)
    } catch (e) {
      // check if it is likely a string
      for (const b of field.value) {
        if (b < 32) {
          return decoders.getValue(field, 'bytes')
        }
      }
      return decoders.getValue(field, 'string')
    }
  }
  return decoders.getValue(field, field.renderType)
}

export function walkerProto(field, path, reader) {
  throw new Error('TODO')
}

export default RawProto
