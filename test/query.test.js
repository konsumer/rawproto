// same tests as RawProto, but using more elegant query calls

/* global test expect */

import RawProto, { query } from 'rawproto'

test('A Simple Message', () => {
  /*
    1: 150
  */
  const tree = new RawProto([0x08, 0x96, 0x01]).readMessage()
  expect(query(tree, '1:int')).toEqual([150])
})

test('A Simple Message: choices', () => {
  /*
    1: 150
  */
  const tree = new RawProto([0x08, 0x96, 0x01]).readMessage()
  expect(query(tree, '1', { 1: 'int' })).toEqual([150])
})

test('A Simple Message: choices & prefix', () => {
  /*
    3: {1: 150}
  */
  const tree = new RawProto([0x1a, 0x03, 0x08, 0x96, 0x01]).readMessage()
  expect(query(tree, '1', { 3.1: 'int' }, '3')).toEqual([150])
})

// test same stuff using RawProto.query
test('A Simple Message: RawProto.query', () => {
  /*
    3: {1: 150}
  */
  const tree = new RawProto([0x1a, 0x03, 0x08, 0x96, 0x01], { 3.1: 'uint' })
  // type in query
  expect(tree.query('3.1:int')).toEqual([150])

  // use choices
  expect(tree.query('3.1')).toEqual([150])

  // use type & prefix
  expect(tree.query('1:int', '3')).toEqual([150])

  // use choices & prefix
  expect(tree.query('1', '3')).toEqual([150])
})

test('Length-Delimited Records', () => {
  /*
    2: {"testing"}
  */
  const tree = new RawProto([0x12, 0x07, 0x74, 0x65, 0x73, 0x74, 0x69, 0x6e, 0x67]).readMessage()
  expect(query(tree, '2:string')).toEqual(['testing'])
})

test('Submessages', () => {
  /*
    3: {1: 150}
  */
  const tree = new RawProto([0x1a, 0x03, 0x08, 0x96, 0x01]).readMessage()
  expect(query(tree, '3.1:int')).toEqual([150])
})

test('Repeated Elements', () => {
  /*
    4: {"hello"}
    5: 1
    5: 2
    5: 3
  */
  const tree = new RawProto([0x22, 0x05, 0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x28, 0x01, 0x28, 0x02, 0x28, 0x03]).readMessage()
  expect(query(tree, '5:int')).toEqual([1, 2, 3])
  expect(query(tree, '4:string')).toEqual(['hello'])
})

test('Packed Repeated Fields', () => {
  /*
    6: {3 270 86942}
  */
  const tree = new RawProto([0x32, 0x06, 0x03, 0x8e, 0x02, 0x9e, 0xa7, 0x05]).readMessage()
  expect(query(tree, '6:packedvarint')).toEqual([[3, 270, 86942]])
})
