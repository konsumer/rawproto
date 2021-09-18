import { readFileSync } from 'fs'
import hexy from 'hexy'
import { getData, getProto } from '../index.js'
import protobuf from 'protobufjs'

// build a demo message
const proto = await protobuf.load(new URL('demo.proto', import.meta.url).pathname)

const Test = proto.lookupType('Test')
const msg = Test.create({
  nums: [1, 2, 3, 4, 5],
  num: 1,
  str: 'hello',
  children: [
    { num: 1, str: 'cool', children: [{ num: 1 }] },
    { num: 2, str: 'awesome', children: [{ num: 2 }] },
    { num: 3, str: 'neat', children: [{ num: 3 }] }
  ]
})
const encoded = Test.encode(msg).finish()

console.log('Protobuf:')
console.log(hexy.hexy(encoded))

console.log('Structure:')
console.log(JSON.stringify(getData(encoded), null, 2), '\n')

console.log('Structure (all binary):')
console.log(JSON.stringify(getData(encoded, 'binary'), null, 2), '\n')

console.log('Proto:')
console.log(getProto(encoded))

console.log('Proto (all binary):')
console.log(getProto(encoded, 'binary'))
