// this will decode a message, then use regular protobuf tooling to encode a proto binary

/* global test, expect, describe */

import protobuf from 'protobufjs'
import RawProto from 'rawproto'
import { writeFile } from 'fs/promises'
import { promisify } from 'util'

const parseProto = promisify(protobuf.load)

// this is some proto-bin and named fields/types for it
const bytes = Buffer.from('CQAAAAAAwGJAFQAAFkMYlgEglgEolgEwlgE4rAJArAJNlgAAAFGWAAAAAAAAAF2WAAAAYZYAAAAAAAAAaAFyB3Rlc3Rpbmd6B3Rlc3RpbmeCAQOIAQKIAQKSAQQAAQIDmgEQAAAAAAEAAAACAAAAAwAAAKIBIAAAAAAAAAAAAQAAAAAAAAACAAAAAAAAAAMAAAAAAAAA', 'base64')

describe('Decode / Encode', () => {
  test('get a proto SDL for a binary message', async () => {
    // this is a proto SDL, which you should be able to use with standard proto tooling
    const protoSDL = new RawProto(bytes).toProto()
    await writeFile('/tmp/tester.proto', 'syntax = "proto3";\n' + protoSDL)

    // this is what it looks like, without any edit:
    expect(protoSDL).toEqual(`message MessageRoot {
  uint32 f1 = 1;
  uint32 f2 = 2;
  int32 f3 = 3;
  int32 f4 = 4;
  int32 f5 = 5;
  int32 f6 = 6;
  int32 f7 = 7;
  int32 f8 = 8;
  uint32 f9 = 9;
  uint32 f10 = 10;
  uint32 f11 = 11;
  uint32 f12 = 12;
  int32 f13 = 13;
  Message14 f14 = 14;
  message Message14 {
    uint32 f1 = 1;
  }
  Message15 f15 = 15;
  message Message15 {
    uint32 f1 = 1;
  }
  Message16 f16 = 16;
  message Message16 {
    int32 f1 = 1;
  }
  int32 f17 = 17;
  Message18 f18 = 18;
  message Message18 {
    repeated int32 f1 = 1;
  }
  bytes f19 = 19;
  bytes f20 = 20;
}`)
  })
  test('use decoded proto to encode a new message', async () => {
    const root = await parseProto('/tmp/tester.proto')
    const MessageRoot = root.lookupType('MessageRoot')
    // now you have a sick encoder/decoder for MessageRoot messages

    // encode
    const messageIn = MessageRoot.create({
      f1: 5,
      f2: 10
    })
    const bin = MessageRoot.encode(messageIn).finish()
    expect(bin.toString('base64')).toEqual('CAUQCg==')

    // decode
    const messageOut = MessageRoot.decode(bin)
    expect(messageOut).toEqual({ f1: 5, f2: 10 })
  })
})
