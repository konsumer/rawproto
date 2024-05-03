// miscellaneous tests that didn;t fit in other tests

/* global test expect */

import { removePathPrefix } from 'rawproto'

test('removePathPrefix', () => {
  const o = {
    '1.3.1': 'string',
    '1.3.2': 'int',
    '1.3.3': 'raw',
    '1.3.5': 'whatever'
  }
  expect(removePathPrefix(o, '1')).toEqual({ 3.1: 'string', 3.2: 'int', 3.3: 'raw', 3.5: 'whatever' })
  expect(removePathPrefix(o, '1.3')).toEqual({ 1: 'string', 2: 'int', 3: 'raw', 5: 'whatever' })

  // this is not really a good use-case, but it does what I expect
  expect(removePathPrefix(o, '1.3.5')).toEqual(o)
})
