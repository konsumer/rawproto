#!/usr/bin/env node

var rawproto = require('./index.js')

process.stdin.setEncoding('binary')

process.stdin.on('readable', function() {
  var chunk = process.stdin.read()
  if (chunk !== null) {
    console.log(rawproto.getProto(Buffer.from(chunk)))
  }
})