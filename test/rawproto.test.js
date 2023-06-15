import { getData, getProto } from '../index.js'
import protobuf from 'protobufjs'
import hexy from 'hexy'

// get proto-def for tests
const proto = await protobuf.load(new URL('demo.proto', import.meta.url).pathname)

const Test = proto.lookupType('Test')
const Test2 = proto.lookupType('Test2')

// I just define this once to save some code
const demoObject = {
  nums: [1, 2, 3, 4, 5],
  num: 1,
  str: 'hello',
  children: [
    { num: 1, str: 'cool', children: [{ num: 1 }] },
    { num: 2, str: 'awesome', children: [{ num: 2 }] },
    { num: 3, str: 'neat', children: [{ num: 3 }] }
  ],
  extra: 'this one is extra'
}

// make some encoded messages for testing
const test1 = Test.encode(demoObject).finish()
const test2 = Test2.encode(demoObject).finish()

// console.log(hexy.hexy(test1))
// console.log(hexy.hexy(test2))

describe('rawproto', () => {
  test('Test raw', () => {
    expect(getData(test1)).toMatchSnapshot()
  })

  test('Test2 raw', () => {
    expect(getData(test2)).toMatchSnapshot()
  })

  test('Some missing fields', () => {
    expect(getData(test2, Test)).toMatchSnapshot()
  })

  test('getProto', () => {
    const p = getProto(test2, Test2)
    // console.log(p)
    expect(p).toMatchSnapshot()
  })
})
