# rawproto

Guess structure of protobuf binary from raw data

Very similar to `protoc --decode_raw`, but for javascript.

## installation

`npm i -S rawproto` will add this to your project.

## usage

```js
import { readFileSync } from 'fs'
import { getData } from 'rawproto'

// binary protobuf message
console.log( getData(readFileSync('data.pb')) )
```