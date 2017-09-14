import { Reader } from 'protobufjs'

/**
 * Turn a protobuf into a data-object
 *
 * @param      {Buffer}   buffer  The proto in a binary buffer
 * @return     {object[]}         Info about the protobuf
 */
export const getData = (buffer, depth = 0) => {
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
        try {
          const innerMessage = getData(bytes, depth + 1)
          out.push({[id]: innerMessage})
        } catch (e) {
          // search buffer for extended chars
          let hasExtended = false
          bytes.forEach(b => {
            if (b < 32 || b > 126) {
              hasExtended = true
            }
          })
          if (hasExtended) {
            out.push({[id]: bytes})
          } else {
            out.push({[id]: bytes.toString()})
          }
        }
        // // TODO: this isn't the right way to do this at all, I'm sure
        // if (bytes[0] === 8) {
        //   out.push({[id]: getData(bytes, depth + 1)})
        // } else {
        //   out.push({[id]: bytes.toString()})
        // }
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
