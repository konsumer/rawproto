/* eslint-env jest */
// import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
// import { hexy } from 'hexy'
import { getData, getProto, analyzeData } from '../src/index'
import protobuf from 'protobufjs'

let proto

beforeAll(function (done) {
  protobuf.load(join(__dirname, 'demo.proto')).then(p => { proto = p; done() })
})

describe('raw parsing', () => {
  let encoded

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
    encoded = Test.encode(msg).finish()
    // console.log('Protobuf:\n', hexy(encoded))
  })

  describe('getData', () => {
    it('parses raw protobuf structure', () => {
      // console.log('Structure:\n', JSON.stringify(getData(encoded), null, 2), '\n')
      expect(getData(encoded)).toMatchSnapshot()
    })
  })

  describe('getProto', () => {
    it('generates example proto definition from raw proto', () => {
      // console.log('Proto:\n', getProto(encoded))
      expect(getProto(encoded)).toMatchSnapshot()
    })
  })
})

// describe('raw proto analysis', function () {
//   it('guesses from set of possible proto definitions', function () {
//     // give it the original .proto but don't tell it which message it's decoding
//     // console.dir(analyzeData(encoded, 'test/demo.proto'), done)
//     // expect(geussData(encoded, readFileSync('demo.proto'))).toMatchObject({
//     //   possibilities: [{
//     //     confidence: 1,
//     //     data:
//     //   }]
//     // })
//   })
// })
