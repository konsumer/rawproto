// same tests as reader, but using query calls

/* global test expect */

import Reader, { query } from 'rawproto'

test('A Simple Message', () => {
  /*
    1: 150
  */
  const tree = new Reader([0x08, 0x96, 0x01]).readMessage()
  expect(query(tree, '1:uint')).toEqual([150])
})

test('A Simple Message: choices', () => {
  /*
    1: 150
  */
  const tree = new Reader([0x08, 0x96, 0x01]).readMessage()
  expect(query(tree, '1', { 1: 'uint' })).toEqual([150])
})

test('A Simple Message: choices & prefix', () => {
  /*
    3: {1: 150}
  */
  const tree = new Reader([0x1a, 0x03, 0x08, 0x96, 0x01]).readMessage()
  expect(query(tree, '1', { 3.1: 'uint' }, '3')).toEqual([150])
})

test('Length-Delimited Records', () => {
  /*
    2: {"testing"}
  */
  const tree = new Reader([0x12, 0x07, 0x74, 0x65, 0x73, 0x74, 0x69, 0x6e, 0x67]).readMessage()
  expect(query(tree, '2:string')).toEqual(['testing'])
})

test('Submessages', () => {
  /*
    3: {1: 150}
  */
  const tree = new Reader([0x1a, 0x03, 0x08, 0x96, 0x01]).readMessage()
  expect(query(tree, '3.1:uint')).toEqual([150])
})

test('Repeated Elements', () => {
  /*
    4: {"hello"}
    5: 1
    5: 2
    5: 3
  */
  const tree = new Reader([0x22, 0x05, 0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x28, 0x01, 0x28, 0x02, 0x28, 0x03]).readMessage()
  expect(query(tree, '5:uint')).toEqual([1, 2, 3])
  expect(query(tree, '4:string')).toEqual(['hello'])
})

test('Packed Repeated Fields', () => {
  /*
    6: {3 270 86942}
  */
  const tree = new Reader([0x32, 0x06, 0x03, 0x8e, 0x02, 0x9e, 0xa7, 0x05]).readMessage()
  expect(query(tree, '6:packedvarint')).toEqual([[3, 270, 86942]])
})
