// tests for type-decoders (display and getting value in other things)

/* global test expect */

import * as decoders from '../src/decoders'
import { wireTypes } from '../src/index'

const enc = new TextEncoder()

test('bytes', () => {
  const b = new Uint8Array([0, 1, 2, 3, 4, 5, 6])
  const t = { index: 1, type: wireTypes.LEN, value: b, renderType: 'bytes' }
  expect(decoders.getValue(t, 'bytes')).toEqual(b)
  expect(decoders.bytes(b)).toEqual('00 01 02 03 04 05 06')
  expect(decoders.display(t)).toEqual('00 01 02 03 04 05 06')
})

test('string', () => {
  const b = enc.encode('testing')
  const t = { index: 1, type: wireTypes.LEN, value: b, renderType: 'string' }
  expect(decoders.getValue(t, 'string')).toEqual('testing')
  expect(decoders.string(b)).toEqual('testing')
  expect(decoders.display(t)).toEqual('testing')
})

test('uint64', () => {
  const b = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7])
  const t = { index: 1, type: wireTypes.I64, value: b, renderType: 'uint' }
  expect(decoders.getValue(t, 'uint')).toEqual(506097522914230528n)
  expect(decoders.uint64(b)).toEqual(506097522914230528n)
  expect(decoders.display(t)).toEqual('506097522914230528')
})

test('int64', () => {
  const b = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7])
  const t = { index: 1, type: wireTypes.I64, value: b, renderType: 'int' }
  expect(decoders.getValue(t, 'int')).toEqual(506097522914230528n)
  expect(decoders.int64(b)).toEqual(506097522914230528n)
  expect(decoders.display(t)).toEqual('506097522914230528')
})

test('float64', () => {
  const b = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7])
  const t = { index: 1, type: wireTypes.I64, value: b, renderType: 'float' }
  expect(decoders.getValue(t, 'float')).toEqual(7.949928895127363e-275)
  expect(decoders.float64(b)).toEqual(7.949928895127363e-275)
  expect(decoders.display(t)).toEqual('7.949928895127363e-275')
})

test('uint32', () => {
  const b = new Uint8Array([0, 1, 2, 3])
  const t = { index: 1, type: wireTypes.I32, value: b, renderType: 'uint' }
  expect(decoders.getValue(t, 'uint')).toEqual(50462976)
  expect(decoders.uint32(b)).toEqual(50462976)
  expect(decoders.display(t)).toEqual('50462976')
})

test('int32', () => {
  const b = new Uint8Array([0, 1, 2, 3])
  const t = { index: 1, type: wireTypes.I32, value: b, renderType: 'int' }
  expect(decoders.getValue(t, 'int')).toEqual(50462976)
  expect(decoders.uint32(b)).toEqual(50462976)
  expect(decoders.display(t)).toEqual('50462976')
})

test('float32', () => {
  const b = new Uint8Array([0, 1, 2, 3])
  const t = { index: 1, type: wireTypes.I32, value: b, renderType: 'float' }
  expect(decoders.getValue(t, 'float')).toEqual(3.820471434542632e-37)
  expect(decoders.float32(b)).toEqual(3.820471434542632e-37)
  expect(decoders.display(t)).toEqual('3.820471434542632e-37')
})

test('packedIntVar', () => {
  const b = new Uint8Array([0x03, 0x8e, 0x02, 0x9e, 0xa7, 0x05])
  const t = { index: 1, type: wireTypes.LEN, value: b, renderType: 'packedvarint' }
  expect(decoders.getValue(t, 'packedvarint')).toEqual([3, 270, 86942])
  expect(decoders.packedIntVar(b)).toEqual([3, 270, 86942])
  expect(decoders.display(t)).toEqual('3,270,86942')
})

// TODO: need to work on these

test.skip('packedInt32', () => {
  const b = new Uint8Array([0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3])
  const t = { index: 1, type: wireTypes.LEN, value: b, renderType: 'packedint32' }
  expect(decoders.getValue(t, 'packedint32')).toEqual([50462976, 50462976, 50462976])
  expect(decoders.packedInt32(b)).toEqual([50462976, 50462976, 50462976])
  expect(decoders.display(t)).toEqual('50462976,50462976,50462976')
})

test.skip('packedInt64', () => {
  const b = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3, 4, 5, 6, 7])
  const t = { index: 1, type: wireTypes.LEN, value: b, renderType: 'packedint64' }
  expect(decoders.getValue(t, 'packedint64')).toEqual([506097522914230528n, 506097522914230528n, 506097522914230528n])
  expect(decoders.packedInt64(b)).toEqual([506097522914230528n, 506097522914230528n, 506097522914230528n])
  expect(decoders.display(t)).toEqual('506097522914230528,506097522914230528,506097522914230528')
})
