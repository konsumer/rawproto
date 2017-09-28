/* eslint-env jest */
// import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
// import { hexy } from 'hexy'
import { getData, getProto, analyzeData } from '../src/index'
import protobuf from 'protobufjs'

let proto
let TestPb

beforeAll(() => (
  protobuf.load(join(__dirname, 'demo.proto')).then(p => { proto = p })
))

beforeAll(() => {
  const Test = proto.lookupType('Test')
  const msg = Test.create({
    nums: [1, 2, 3, 4, 5],
    num: 1,
    str: 'hello',
    children: [
      {num: 1, str: 'cool', children: [{ num: 1 }]},
      {num: 2, str: 'awesome', children: [{ num: 2 }]},
      {num: 3, str: 'neat', children: [{ num: 3 }]}
    ]
  })
  TestPb = Test.encode(msg).finish()
  // console.log('Protobuf:\n', hexy(TestPb))
})

describe('getData', () => {
  it('parses raw protobuf structure', () => {
    // console.log('Structure:\n', JSON.stringify(getData(TestPb), null, 2), '\n')
    expect(getData(TestPb)).toMatchSnapshot()
  })
})

describe('getProto', () => {
  it('generates example proto definition from raw proto', () => {
    // console.log('Proto:\n', getProto(TestPb))
    expect(getProto(TestPb)).toMatchSnapshot()
  })
})

describe('analyzeData', () => {
  it('compares with set of possible proto definitions', () => {
    // give it the original .proto but don't tell it which message it's decoding
    return analyzeData(TestPb, join(__dirname, 'demo.proto')).then(analysis => {
      // console.log(analysis)
      expect(analysis[0].as).toEqual('Test')
    })
  })
})
