#!/usr/bin/env node

var rawproto = require('./index.js')

process.stdin.on('readable', function () {
  var body = []
  process.stdin
    .on('data', function (chunk) {
      body.push(Buffer.from(chunk))
    })
    .on('end', function () {
      console.log(rawproto.getProto(Buffer.concat(body), null, 2))
    })
})
