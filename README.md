# rawproto

Guess structure of protobuf binary from raw data

Very similar to `protoc --decode_raw`, but for javascript.

You can use this to reverse-engineer a protobuf protocol, based on a binary protobuf string.

See some example output (from the demo message in this repo) [here](https://gist.github.com/konsumer/3647d466b497e6950b12291e47f11eeb).

## installation

`npm i -S rawproto` will add this to your project.


## usage

In ES6;

```js
import { readFileSync, writeFileSync } from 'fs'
import { getData, getProto } from 'rawproto'

const buffer = readFileSync('data.pb')

// get info about binary protobuf message
console.log( getData(buffer) )

// save guessed proto file for this binary data
writeFileSync('data.proto', getProto(buffer) )

```

In plain CommonJS:

```js
var fs = require('fs')
var rawproto = require('rawproto')

var buffer = fs.readFileSync('data.pb')

// get info about binary protobuf message
console.log( rawproto.getData(buffer) )

// save guessed proto file for this binary data
fs.writeFileSync('data.proto', rawproto.getProto(buffer) )

```

## cli

You can also use rawproto to parse binary on the command-line!

Install with `npm i -g rawproto`

Use it like this:

```
cat myfile.pb | rawproto
```

You can also use `-j` or `--json` to get JSON output instead of proto definition.

```
cat myfile.pb | rawproto -j
```

## http

I noticed that various request libraries convert binary buffers into text, and this can cause issues. If you build your buffer manually, it seems to work ok:

```js
import get from 'https'
import { getProto } from 'rawproto'

get(url, request => {
  if (response.statusCode < 200 || response.statusCode > 299) {
    throw new Error('Failed to load page, status code: ' + response.statusCode)
  }
  const body = []
  request.on('error', (err) => throw err)
  response.on('data', (chunk) => body.push(chunk))
  response.on('end', () => console.log(getProto(Buffer.concat(body))))
})
```


## limitations

There are several types that just can't be guessed from the data. signedness and precision of numbers can't really be guessed, ints could be enums, and my system of guessing if it's a `string` or `bytes` is naive (but I don't think could be improved.)

You should definitely tune the outputted proto file to how you think your data is structured. I add comments to fields, to help you figure out what [scalar-types](https://developers.google.com/protocol-buffers/docs/proto3#scalar) to use, but without the original proto file, you'll have to do some guessing of your own.


## todo

* Streaming data-parser for large input
* Collection analysis: better type-guessing with more messages
