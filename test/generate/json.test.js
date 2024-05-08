// test JSON generation

/* global test expect */

import RawProto from 'rawproto'

test.skip('A Simple Message', () => {
  /*
    1: 150
  */
  const j = new RawProto([0x08, 0x96, 0x01]).toJS()
  expect(j).toEqual({ 1: [150] })
})

test.skip('Traverse Submessages', () => {
  /*
    3: {1: 150}
  */
  const r = new RawProto([0x1a, 0x03, 0x08, 0x96, 0x01])
  const j = r.toJS()
  expect(j).toEqual({ 3: [{ 1: [150] }] })
})

test.skip('Length-Delimited Records', () => {
  /*
    2: {"testing"}
  */
  const j = new RawProto([0x12, 0x07, 0x74, 0x65, 0x73, 0x74, 0x69, 0x6e, 0x67]).toJS()
  expect(j).toEqual({ 2: ['testing'] })
})
