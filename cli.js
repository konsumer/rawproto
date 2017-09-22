#!/usr/bin/env node

var rawproto = require('./index.js')
var yargs = require('yargs')
var pkg = require('./package.json')

var args = yargs
  .usage('Usage: $0 [options]')
  .option('json', {
    alias: 'j',
    describe: 'Output JSON instead of proto definition',
    default: false
  })
  .help('h')
  .alias('h', 'help')
  .epilog(pkg.name + ' v' + pkg.version)
  .argv

process.stdin.on('readable', function () {
  var body = []
  process.stdin
    .on('data', function (chunk) {
      body.push(Buffer.from(chunk))
    })
    .on('end', function () {
      var buffer = Buffer.concat(body)
      if (args.json) {
        console.log(JSON.stringify(rawproto.getData(buffer), null, 2))
      } else {
        console.log(rawproto.getProto(buffer))
      }
    })
})
