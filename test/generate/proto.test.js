// test proto generation

/* global test expect */

import RawProto from 'rawproto'

test.skip('A Simple Message', () => {
  /*
    1: 150
  */
  const j = new RawProto([0x08, 0x96, 0x01]).toProto()
  expect(j).toEqual('int field1 = 1;')
})

test.skip('Traverse Submessages', () => {
  /*
    3: {1: 150}
  */

  const b = [0x1a, 0x03, 0x08, 0x96, 0x01]

  // it's bytes by default
  let j = new RawProto(b).toProto()
  expect(j).toEqual('bytes field3 = 3;')

  // we can force types with choices
  j = new RawProto(b, { 3: 'sub' }).toProto()
  expect(j).toEqual('Message3 {\n  int field1 = 1;\n}')
})

test.skip('Length-Delimited Records', () => {
  /*
    2: {"testing"}
  */
  const j = new RawProto([0x12, 0x07, 0x74, 0x65, 0x73, 0x74, 0x69, 0x6e, 0x67]).toProto()
  expect(j).toEqual({ 2: ['testing'] })
})

test.skip('Repeated Elements', () => {
  /*
    4: {"hello"}
    5: 1
    5: 2
    5: 3
  */
  const j = new RawProto([0x22, 0x05, 0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x28, 0x01, 0x28, 0x02, 0x28, 0x03]).toProto()
  expect(j).toEqual({ 4: ['hello'], 5: [1, 2, 3] })
})

test.skip('Packed Repeated Fields', () => {
  /*
    6: {3 270 86942}
  */
  const j = new RawProto([0x32, 0x06, 0x03, 0x8e, 0x02, 0x9e, 0xa7, 0x05], { 6: 'packedvarint' }).toProto()
  expect(j).toEqual({ 6: [[3, 270, 86942]] })
})
