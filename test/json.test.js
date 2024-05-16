// JSON-safe values & correct output for toJS

/* global test, expect, describe */

import { fileURLToPath } from 'url'
import { join, dirname } from 'path'
import { readFile } from 'fs/promises'
import RawProto from 'rawproto'

// build an initial array of the data I want to look at in Hearthstone
const tree = new RawProto(await readFile(join(dirname(fileURLToPath(import.meta.url)), 'hearthstone.bin')))
const appTree = tree.sub['1'][0].sub['2'][0].sub['4'][0]

// You can build your protobuf bytes with this
// import { promisify } from 'util'
// import protobuf from 'protobufjs'
// import data from './test.json'
// const proto = promisify(protobuf.load)
// const { Message } = await proto('test/test.proto')
// const bytes = Message.encode(data).finish()
// console.log(bytes.toString('base64'))

const bytes = Buffer.from('CQAAAAAAwGJAFQAAFkMYlgEglgEolgEwlgE4rAJArAJNlgAAAFGWAAAAAAAAAF2WAAAAYZYAAAAAAAAAaAFyB3Rlc3Rpbmd6B3Rlc3RpbmeCAQOIAQKIAQKSAQQAAQIDmgEQAAAAAAEAAAACAAAAAwAAAKIBIAAAAAAAAAAAAQAAAAAAAAACAAAAAAAAAAMAAAAAAAAA', 'base64')

const simplemap = {
  double: '1:double',
  float: '2:float',
  int32: '3:int32',
  int64: '4:int64',
  uint32: '5:uint32',
  uint64: '6:uint64',
  sint32: '7:sint32',
  sint64: '8:sint64',
  fixed32: '9:fixed32',
  fixed64: '10:fixed64',
  sfixed32: '11:sfixed32',
  sfixed64: '12:sfixed64',
  bool: '13:bool',
  string: '14:string',
  bytes: '15:bytes',
  sub: '16:sub',
  'sub.enum': '16.17:int',
  enum: '17:int',
  packedvarint: '18:packedIntVar',
  packedint32: '19:packedInt32',
  packedint64: '20:packedInt64'
}

describe('Simple', () => {
  test('Get JSON from binary proto', () => {
    const j = JSON.parse(JSON.stringify(new RawProto(bytes).toJS(simplemap)))
    expect(j.double).toEqual([150])
    expect(j.float).toEqual([150])
    expect(j.int32).toEqual([150])
    expect(j.int64).toEqual([150])
    expect(j.uint32).toEqual([150])
    expect(j.uint64).toEqual([150])
    expect(j.fixed32).toEqual([150])
    expect(j.fixed64).toEqual([150])
    expect(j.sfixed32).toEqual([150])
    expect(j.sfixed64).toEqual([150])
    expect(j.bool).toEqual([true])
    expect(j.string).toEqual(['testing'])
    expect(j.bytes).toEqual([{ 0: 116, 1: 101, 2: 115, 3: 116, 4: 105, 5: 110, 6: 103 }])
    expect(j.sub.enum).toEqual([2])

    // TODO: these are broke

    // expect(j.sint32).toEqual([150]) // 300
    // expect(j.sint64).toEqual([150]) // 300
    // expect(j.sub.packedvarint).toEqual([[0, 1, 2, 3]])
    // expect(j.sub.packedint32).toEqual([[0, 1, 2, 3]])
    // expect(j.sub.packedint64).toEqual([[0, 1, 2, 3]])

    // there should be no leftovers
    // expect(j.f0).toBeUndefined()
  })
})

describe('Hearthstone', () => {
  test('Get JSON from binary proto', () => {
    const j = JSON.parse(JSON.stringify(appTree.toJS({
      id: '1.2.4.1:string',
      title: '1.2.4.5:string',
      company: '1.2.4.6:string',
      description: '1.2.4.7:string'
    })))
    expect(j.id).toEqual(['com.blizzard.wtcg.hearthstone'])
    expect(j.title).toEqual(['Hearthstone'])
    expect(j.company).toEqual(['Blizzard Entertainment, Inc.'])
    expect(j.description).toBeDefined()

    // leftovers from fieldMap get put into a kind of array-like structure, using prefix (default is "f")
    expect(j.f0.f1.f2.f4.f2).toEqual(['com.blizzard.wtcg.hearthstone'])
  })
})
