#!/usr/bin/env node

const rawproto = require('.')
const yargs = require('yargs')
const pkg = require('./package.json')

const args = yargs
  .usage('Usage: $0 [options]')
  .option('json', {
    alias: 'j',
    describe: 'Output JSON instead of proto definition',
    default: false
  })
  .choices('s', ['auto', 'string', 'binary'])
  .alias('s', 'stringMode')
  .describe('s', 'How should strings be handled? "auto" detects if it\'s binary based on characters, "string" is always a JS string, and "binary" is always a buffer.')
  .default('s', 'auto')
  .help('h')
  .alias('h', 'help')
  .epilog(pkg.name + ' v' + pkg.version)
  .example('rawproto < myfile.pb', 'Get guessed proto3 definition from binary protobuf')
  .example('rawproto -j < myfile.pb', 'Get JSON represenation of binary protobuf')
  .example('rawproto -j -s binary < myfile.pb', 'Get JSON represenation of binary protobuf, assume all strings are binary buffers')
  .argv

process.stdin.on('readable', function () {
  const body = []
  process.stdin
    .on('data', function (chunk) {
      body.push(Buffer.from(chunk))
    })
    .on('end', function () {
      const buffer = Buffer.concat(body)
      if (args.json) {
        console.log(JSON.stringify(rawproto.getData(buffer), null, 2))
      } else {
        console.log(rawproto.getProto(buffer))
      }
    })
})
