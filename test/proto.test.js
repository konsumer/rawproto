// Protobuf SDL generation from toProto

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
  'sub.enum': '16.1:int32',
  enum: '17:int32',
  packedvarint: '18:packedIntVar',
  packedint32: '19:packedInt32',
  packedint64: '20:packedInt64'
}

describe('Simple', () => {
  test('Get JSON from binary proto', () => {
    // TODO: commented need work
    const p = new RawProto(bytes).toProto(simplemap)
    expect(p).toEqual(`message MessageRoot {
  double double = 1;
  float float = 2;
  int32 int32 = 3;
  int64 int64 = 4;
  uint32 uint32 = 5;
  uint64 uint64 = 6;
  sint32 sint32 = 7;
  sint64 sint64 = 8;
  fixed32 fixed32 = 9;
  fixed64 fixed64 = 10;
  sfixed32 sfixed32 = 11;
  sfixed64 sfixed64 = 12;
  bool bool = 13;
  string string = 14;
  bytes bytes = 15;
  Message16 sub = 16;
  message Message16 {
    int32 f1 = 1;
  }
  int32 enum = 17;
  Message18 packedvarint = 18;
  message Message18 {
    repeated int32 f1 = 1;
  }
  bytes packedint32 = 19;
  bytes packedint64 = 20;
}`)
  })
})

describe('Hearthstone', () => {
  test('Get proto SDL from binary proto', () => {
    const p = appTree.toProto({
      id: '1.2.4.1:string',
      title: '1.2.4.5:string',
      company: '1.2.4.6:string',
      description: '1.2.4.7:string'
    })
    expect(p.startsWith(`message MessageRoot {
  string id = 1;
  bytes f2 = 2;
  int32 f3 = 3;
  int32 f4 = 4;
  string title = 5;
  string company = 6;
  string description = 7;`)).toBeTruthy()
  })
})
