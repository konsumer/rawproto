// test JSON generation

/* global test expect */

import RawProto from 'rawproto'

test('A Simple Message', () => {
  /*
    1: 150
  */
  const j = new RawProto([0x08, 0x96, 0x01]).toJS()
  expect(j).toEqual({ 1: [150] })
})

test('A Deeper Simple Message', () => {
  /*
    3: {1: 150}
  */
  const j = new RawProto([0x1a, 0x03, 0x08, 0x96, 0x01]).toJS()
  expect(j).toEqual({ 3: [{ 1: [150] }] })
})
