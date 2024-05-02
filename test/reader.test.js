/* global test, expect */

// these are very manual tests of basic reader stuff
// you should see query for better examples

import Reader, { decoders } from 'rawproto'

test('A Simple Message', () => {
  /*
    1: 150
  */
  const tree = new Reader([0x08, 0x96, 0x01]).readMessage()
  expect(tree.length).toEqual(1)
  expect(tree[0].pos).toEqual([1, 3])
  expect(tree[0].index).toEqual(1)
  expect(tree[0].type).toEqual(0)
  expect(tree[0].value).toEqual(150)
})

test('Length-Delimited Records', () => {
  /*
    2: {"testing"}
  */
  const tree = new Reader([0x12, 0x07, 0x74, 0x65, 0x73, 0x74, 0x69, 0x6e, 0x67]).readMessage()
  expect(tree.length).toEqual(1)
  expect(tree[0].index).toEqual(2)
  expect(tree[0].type).toEqual(2)
  expect(decoders.string(tree[0].value)).toEqual('testing')
})

test('Submessages', () => {
  /*
    3: {1: 150}
  */
  const tree = new Reader([0x1a, 0x03, 0x08, 0x96, 0x01]).readMessage()
  expect(tree.length).toEqual(1)
  expect(tree[0].index).toEqual(3)
  expect(tree[0].type).toEqual(2)

  const s = new Reader(tree[0].value).readMessage()
  expect(s.length).toEqual(1)
  expect(s[0].pos).toEqual([1, 3])
  expect(s[0].type).toEqual(0)
  expect(s[0].index).toEqual(1)
  expect(s[0].value).toEqual(150)
})

test('Repeated Elements', () => {
  /*
    4: {"hello"}
    5: 1
    5: 2
    5: 3
  */
  const tree = new Reader([0x22, 0x05, 0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x28, 0x01, 0x28, 0x02, 0x28, 0x03]).readMessage()
  expect(tree.length).toEqual(4)
  expect(tree[0].index).toEqual(4)
  expect(decoders.string(tree[0].value)).toEqual('hello')
  expect(tree[1].index).toEqual(5)
  expect(tree[1].value).toEqual(1)
  expect(tree[2].index).toEqual(5)
  expect(tree[2].value).toEqual(2)
  expect(tree[3].index).toEqual(5)
  expect(tree[3].value).toEqual(3)
})

test('Packed Repeated Fields', () => {
  /*
    6: {5 270 86942}
  */
  const tree = new Reader([0x32, 0x06, 0x05, 0x8e, 0x02, 0x9e, 0xa7, 0x05]).readMessage()
  expect(tree.length).toEqual(1)
  expect(tree[0].index).toEqual(6)
  expect(tree[0].type).toEqual(2)
  expect(decoders.packedIntVar(tree[0].value)).toEqual([5, 270, 86942])
})
