// Basic tests of simple messages, using query

/* global test expect */

import RawProto from 'rawproto'

test('A Simple Message', () => {
  /*
    1: 150
  */
  const tree = new RawProto([0x08, 0x96, 0x01])
  expect(tree.query('1:int')).toEqual([150])
})

test('Length-Delimited Records', () => {
  /*
    2: {"testing"}
  */
  const tree = new RawProto([0x12, 0x07, 0x74, 0x65, 0x73, 0x74, 0x69, 0x6e, 0x67])
  expect(tree.query('2:string')).toEqual(['testing'])
})

test('Traverse Submessages', () => {
  /*
    3: {1: 150}
  */
  const tree = new RawProto([0x1a, 0x03, 0x08, 0x96, 0x01])
  expect(tree.query('3.1:int')).toEqual([150])
})

test('Repeated Elements', () => {
  /*
    4: {"hello"}
    5: 1
    5: 2
    5: 3
  */
  const tree = new RawProto([0x22, 0x05, 0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x28, 0x01, 0x28, 0x02, 0x28, 0x03])
  expect(tree.query('5:int')).toEqual([1, 2, 3])
  expect(tree.query('4:string')).toEqual(['hello'])

  // you can do multiple queries in 1
  expect(tree.query('5:int', '4:string')).toEqual([1, 2, 3, 'hello'])
})

test('Packed Repeated Fields', () => {
  /*
    6: {3 270 86942}
  */
  const tree = new RawProto([0x32, 0x06, 0x03, 0x8e, 0x02, 0x9e, 0xa7, 0x05])
  expect(tree.query('6:packedIntVar')).toEqual([[3, 270, 86942]])
})

// Here are some other type-tests

test('Submessage as bytes', () => {
  /*
    3: {1: 150}
  */
  const tree = new RawProto([0x1a, 0x03, 0x08, 0x96, 0x01])
  expect(tree.query('3:bytes')).toEqual([new Uint8Array([8, 150, 1])])
})
