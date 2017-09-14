import { readFileSync } from 'fs'
import { join } from 'path'
import { hexy } from 'hexy'
import { getData } from '../src/index'

const encoded = readFileSync(join(__dirname, 'demo.pb'))

console.log('Protobuf:')
console.log(hexy(encoded))

console.log(JSON.stringify(getData(encoded), null, 2))
