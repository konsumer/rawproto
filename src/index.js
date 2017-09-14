import { Reader } from 'protobufjs'

/**
 * Turn a protobuf into a data-object
 *
 * @param      {Buffer}   buffer  The proto in a binary buffer
 * @return     {object[]}         Info about the protobuf
 */
export const getData = buffer => {
  const reader = Reader.create(buffer)
  const out = []
  while (reader.pos < reader.len) {
    const tag = reader.uint64()
    const id = tag >>> 3
    const wireType = tag & 7
    switch (wireType) {
      case 0: // int32, int64, uint32, bool, enum, etc
        out.push({[id]: reader.uint32()})
        break
      case 1: // fixed64, sfixed64, double
        out.push({[id]: reader.fixed64()})
        break
      case 2: // string, bytes, sub-message
        const bytes = reader.bytes()
        if (bytes[0] === 8) { // this isn't the right way to do this at all, I'm sure
          out.push({[id]: getData(bytes)})
        } else {
          out.push({[id]: bytes.toString()})
        }
        break
      // IGNORE start_group
      // IGNORE end_group
      case 5: // fixed32, sfixed32, float
        out.push({[id]: reader.float()})
        break
      default: reader.skipType(wireType)
    }
  }
  return out
}
