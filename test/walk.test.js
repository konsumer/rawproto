// test walkers

/* global test expect */

import { fileURLToPath } from 'url'
import { join, dirname } from 'path'
import { readFile } from 'fs/promises'
import RawProto from 'rawproto'

// build an initial array of the data I want to look at
// do this, and you can use getPath() to get values
const tree = new RawProto(await readFile(join(dirname(fileURLToPath(import.meta.url)), 'hearthstone.bin')))
const appTree = tree['1'][0]['2'][0]['4'][0]

test('make sure all members of fields are defined', () => {
  let counter = 0
  const r = appTree.walk(field => {
    counter++
    expect(field.renderType).toBeDefined()
    expect(field.name).toBeDefined()
    expect(field.path).toBeDefined()
    expect(field.type).toBeDefined()
    expect(field.value).toBeDefined()
    return { path: `${field.path}:${field.type}:${field.renderType}`, value: field.value }
  })
  expect(counter).toEqual(1969)
  expect(Object.keys(r).length).toEqual(1969)
})

test.skip('toJS', () => {
  const r = appTree.toJS()
  console.log(r)
})
