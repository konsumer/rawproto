// test JSON-generation

/* global test expect */

import RawProto from 'rawproto'

// You can build your protobuf bytes with this
// import { promisify } from 'util'
// import protobuf from 'protobufjs'
// import data from './test.json'
// const proto = promisify(protobuf.load)
// const { Message } = await proto('test/test.proto')
// const bytes = Message.encode(data).finish()
// console.log(bytes.toString('base64'))

const bytes = Buffer.from('CQAAAAAAwGJAFQAAFkMYlgEglgEolgEwlgE4rAJArAJNlgAAAFGWAAAAAAAAAF2WAAAAYZYAAAAAAAAAaAFyB3Rlc3Rpbmd6B3Rlc3RpbmeCAQOIAQKIAQKSAQQAAQIDmgEQAAAAAAEAAAACAAAAAwAAAKIBIAAAAAAAAAAAAQAAAAAAAAACAAAAAAAAAAMAAAAAAAAA', 'base64')

const tree = new RawProto(bytes)

test('Get JSON from binary proto', () => {

})
