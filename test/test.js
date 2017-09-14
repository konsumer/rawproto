import { readFileSync } from 'fs'
import { join } from 'path'
import { hexy } from 'hexy'
import { getData, getProto } from '../src/index'

const encoded = readFileSync(join(__dirname, 'demo.pb'))

console.log('Protobuf:')
console.log(hexy(encoded))

console.log('Structure:')
console.log(JSON.stringify(getData(encoded), null, 2), '\n')

console.log('Proto:')
console.log(getProto(encoded))
