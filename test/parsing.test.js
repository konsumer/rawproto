/* global test, expect, describe */

import RawProto, { wireTypes } from 'rawproto'

describe('Basic Init', () => {
  test('ArrayBuffer', () => {
  /*
    1: 150
  */
    const b = [0x08, 0x96, 0x01]
    const u = new Uint8Array(b)
    expect(u.buffer instanceof ArrayBuffer).toEqual(true)
    const tree = new RawProto(u.buffer)
    expect(tree.type).toEqual(wireTypes.LEN)
    expect(tree.buffer).toEqual(u.buffer)
    expect(tree.bytes).toEqual(u)
    expect(tree.string).toEqual('�')
    expect(tree.sub['1'][0].int).toEqual(150)
  })

  test('Uint8Array', () => {
  /*
    1: 150
  */
    const b = [0x08, 0x96, 0x01]
    const u = new Uint8Array(b)
    expect(u instanceof Uint8Array).toEqual(true)
    const tree = new RawProto(u)
    expect(tree.type).toEqual(wireTypes.LEN)
    expect(tree.buffer).toEqual(u.buffer)
    expect(tree.bytes).toEqual(u)
    expect(tree.string).toEqual('�')
    expect(tree.sub['1'][0].int).toEqual(150)
  })

  test('Array', () => {
  /*
    1: 150
  */
    const b = [0x08, 0x96, 0x01]
    const u = new Uint8Array(b)
    expect(b instanceof Array).toEqual(true)
    const tree = new RawProto(b)
    expect(tree.type).toEqual(wireTypes.LEN)
    expect(tree.buffer).toEqual(u.buffer)
    expect(tree.bytes).toEqual(u)
    expect(tree.string).toEqual('�')
    expect(tree.sub['1'][0].int).toEqual(150)
  })
})

describe('Length-Delimited Records', () => {
  test('string', () => {
  /*
    2: {"testing"}
  */
    const tree = new RawProto([0x12, 0x07, 0x74, 0x65, 0x73, 0x74, 0x69, 0x6e, 0x67])
    expect(tree.sub['2'][0].string).toEqual('testing')
  })

  test('Sub-message', () => {
  /*
    3: {1: 150}
  */
    const tree = new RawProto([0x1a, 0x03, 0x08, 0x96, 0x01])
    expect(tree.sub['3'][0].sub['1'][0].int).toEqual(150)
  })

  test('Packed Repeated Fields', () => {
  /*
    6: {3 270 86942}
  */
    const tree = new RawProto([0x32, 0x06, 0x03, 0x8e, 0x02, 0x9e, 0xa7, 0x05])
    expect(tree.sub['6'][0].packedIntVar).toEqual([3, 270, 86942])
  })

  test('Repeated Elements', () => {
  /*
    4: {"hello"}
    5: 1
    5: 2
    5: 3
  */
    const tree = new RawProto([0x22, 0x05, 0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x28, 0x01, 0x28, 0x02, 0x28, 0x03])
    // you can get field-index counts
    expect(tree.fields).toEqual({ 4: 1, 5: 3 })

    expect(tree.sub['4'][0].string).toEqual('hello')
    expect(tree.sub['5'].map(i => i.int)).toEqual([1, 2, 3])
  })
})
