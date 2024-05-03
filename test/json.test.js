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

test('Submessages', () => {
  /*
    3: {1: 150}
  */
  const j = new RawProto([0x1a, 0x03, 0x08, 0x96, 0x01]).toJS()
  expect(j).toEqual({ 3: [{ 1: [150] }] })
})

// TODO: these are failing

test.skip('Length-Delimited Records', () => {
  /*
    2: {"testing"}
  */
  const j = new RawProto([0x12, 0x07, 0x74, 0x65, 0x73, 0x74, 0x69, 0x6e, 0x67], { 2: 'string' }).toJS()
  expect(j).toEqual({ 2: ['testing'] })
})

test.skip('Repeated Elements', () => {
  /*
    4: {"hello"}
    5: 1
    5: 2
    5: 3
  */
  const j = new RawProto([0x22, 0x05, 0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x28, 0x01, 0x28, 0x02, 0x28, 0x03], { 4: 'string' }).toJS()
  expect(j).toEqual({ 4: ['hello'], 5: [1, 2, 3] })
})

test.skip('Packed Repeated Fields', () => {
  /*
    6: {3 270 86942}
  */
  const j = new RawProto([0x32, 0x06, 0x03, 0x8e, 0x02, 0x9e, 0xa7, 0x05], { 6: 'packedvarint' }).toJS()
  expect(j).toEqual({ 6: [3, 270, 86942] })
})
