// basic tests of walk (see test/generate/ for testing pre-built walkers)

/* global test expect */

import { fileURLToPath } from 'url'
import { join, dirname } from 'path'
import { readFile } from 'fs/promises'
import RawProto from 'rawproto'

// build an initial array of the data I want to look at
// do this, and you can use getPath() to get values
const tree = new RawProto(await readFile(join(dirname(fileURLToPath(import.meta.url)), 'hearthstone.bin')))
const appTree = tree['1'][0]['2'][0]['4'][0]

test.skip('make sure all members of fields are defined', () => {
  let counter = 0
  appTree.walk(field => {
    counter++
  })
})
