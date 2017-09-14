// Setup a demo binary protobuf message in demo.pb

import { writeFileSync } from 'fs'
import { join } from 'path'
import protobuf from 'protobufjs'

protobuf.load(join(__dirname, 'demo.proto')).then(proto => {
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
  const encoded = Test.encode(msg).finish()
  writeFileSync(join(__dirname, 'demo.pb'), encoded)
})
