/* global test, expect, describe */

import RawProto, { wireTypes, hex } from 'rawproto'

// You can build your protobuf bytes with this
// import { promisify } from 'util'
// import protobuf from 'protobufjs'
// import data from './test.json'
// const proto = promisify(protobuf.load)
// const { Message } = await proto('test/test.proto')
// const bytes = Message.encode(data).finish()
// console.log(bytes.toString('base64'))

const bytes = Buffer.from('CQAAAAAAwGJAFQAAFkMYlgEglgEolgEwlgE4rAJArAJNlgAAAFGWAAAAAAAAAF2WAAAAYZYAAAAAAAAAaAFyB3Rlc3Rpbmd6B3Rlc3RpbmeCAQOIAQKIAQKSAQQAAQIDmgEQAAAAAAEAAAACAAAAAwAAAKIBIAAAAAAAAAAAAQAAAAAAAAACAAAAAAAAAAMAAAAAAAAA', 'base64')

const enc = new TextEncoder()

// test a tree made from bytes above, for every type/renderType
// kinda over the top, but it gets that coverage up!
function testTypes (t) {
  // VARINT
  expect(t.sub[3][0].type).toEqual(wireTypes.VARINT)
  expect(t.sub[3][0].bytes).toEqual(new Uint8Array([150]))
  expect(t.sub[3][0].int).toEqual(150)
  expect(t.sub[3][0].int64).toEqual(150)
  expect(t.sub[3][0].sint32).toEqual(150)
  expect(t.sub[3][0].sint64).toEqual(150)
  expect(t.sub[3][0].string).toEqual('150')
  expect(t.sub[3][0].uint).toEqual(150)
  expect(t.sub[3][0].uint32).toEqual(150)
  expect(t.sub[3][0].uint64).toEqual(150)
  expect(t.sub[4][0].type).toEqual(wireTypes.VARINT)
  expect(t.sub[4][0].raw.type).toEqual(wireTypes.VARINT)
  expect(t.sub[5][0].type).toEqual(wireTypes.VARINT)
  expect(t.sub[5][0].int32).toEqual(150)
  expect(t.sub[13][0].type).toEqual(wireTypes.VARINT)
  expect(t.sub[13][0].bool).toEqual(true)

  // I64
  expect(t.sub[1][0].type).toEqual(wireTypes.I64)
  expect(t.sub[1][0].bytes).toEqual(new Uint8Array([0, 0, 0, 0, 0, 192, 98, 64]))
  expect(t.sub[1][0].double).toEqual(150)

  expect(t.sub[10][0].type).toEqual(wireTypes.I64)
  expect(t.sub[10][0].uint).toEqual(150n)
  expect(t.sub[10][0].int).toEqual(150n)
  expect(t.sub[10][0].fixed64).toEqual(150n)
  expect(t.sub[10][0].raw.type).toEqual(wireTypes.I64)
  expect(t.sub[10][0].string).toEqual('150')
  expect(t.sub[12][0].type).toEqual(wireTypes.I64)
  expect(t.sub[12][0].sfixed64).toEqual(150n)

  // LEN
  expect(t.sub[14][0].type).toEqual(wireTypes.LEN)
  expect(t.sub[14][0].bytes).toEqual(enc.encode('testing'))
  expect(t.sub[14][0].raw.type).toEqual(wireTypes.LEN)
  expect(t.sub[14][0].string).toEqual('testing')
  expect(t.sub[14][0].couldHaveSub).toEqual(true)
  expect(t.sub[14][0].likelyString).toEqual(true)
  expect(t.sub[18][0].type).toEqual(wireTypes.LEN)
  expect(t.sub[18][0].packedIntVar).toEqual([0, 1, 2, 3])
  expect(t.sub[19][0].type).toEqual(wireTypes.LEN)
  expect(t.sub[19][0].packedInt32).toEqual([0, 1, 2, 3])
  expect(t.sub[20][0].type).toEqual(wireTypes.LEN)
  expect(t.sub[20][0].packedInt64).toEqual([0n, 1n, 2n, 3n])
  expect(t.sub[20][0].couldHaveSub).toEqual(false)

  // trigger caches
  expect(t.sub[18][0].packedIntVar).toEqual([0, 1, 2, 3])
  expect(t.sub[19][0].packedInt32).toEqual([0, 1, 2, 3])
  expect(t.sub[20][0].packedInt64).toEqual([0n, 1n, 2n, 3n])

  // this is an intentional misread of a sub-message (it's a string, but you can treat it like a message)
  expect(t.sub[14][0].sub['12'][0].path).toEqual('0.14.12')

  // I32
  expect(t.sub[2][0].type).toEqual(wireTypes.I32)
  expect(t.sub[2][0].float).toEqual(150.0)
  expect(t.sub[9][0].type).toEqual(wireTypes.I32)
  expect(t.sub[9][0].raw.type).toEqual(wireTypes.I32)
  expect(t.sub[9][0].uint).toEqual(150)
  expect(t.sub[9][0].bytes).toEqual(new Uint8Array([150, 0, 0, 0]))
  expect(t.sub[9][0].fixed32).toEqual(150)
  expect(t.sub[9][0].string).toEqual('150')
  expect(t.sub[11][0].type).toEqual(wireTypes.I32)
  expect(t.sub[11][0].int).toEqual(150)
  expect(t.sub[11][0].sfixed32).toEqual(150)
}

test('Uint8Array', () => {
  const b = new Uint8Array(bytes)
  expect(b instanceof Uint8Array).toEqual(true)
  const t = new RawProto(b)
  testTypes(t)
})

test('ArrayBuffer', () => {
  const b = new Uint8Array(bytes).buffer
  expect(b instanceof ArrayBuffer).toEqual(true)
  const t = new RawProto(b)
  testTypes(t)
})

test('Array', () => {
  const b = [...bytes]
  expect(b instanceof Array).toEqual(true)
  const t = new RawProto(b)
  testTypes(t)
})

test('Buffer', () => {
  const b = bytes
  expect(b instanceof Buffer).toEqual(true)
  const t = new RawProto(b)
  testTypes(t)
})

describe('Things that should throw', () => {
  test('No offset on varint', () => {
    expect(() => {
      const s = new RawProto([])
      delete s.offset
      s.readVarInt()
    }).toThrowError('Offset must be defined to use readVarInt. If you really want to do this, try setting it to 0.')
  })
  test('Buffer overflow', () => {
    expect(() => {
      const s = new RawProto([])
      s.readVarInt()
    }).toThrowError('Buffer overflow while reading varint: 0/0')
  })
})
