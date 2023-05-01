#!/usr/bin/env node

const rawproto = require('.')
const yargs = require('yargs/yargs')
const pkg = require('./package.json')
const protobufjs = require('protobufjs')

const args = yargs(process.argv.slice(2))
  .usage('Usage: $0 [options]')
  .option('json', {
    alias: 'j',
    describe: 'Output JSON instead of proto definition',
    type: 'boolean',
  default: false
  })
  .option('message', {
    alias: 'm',
    describe: 'Message name to decode as (for partial raw)',
    default: 'MessageRoot'
  })
  .option('include', {
    alias: 'i',
    describe: 'Include proto SDL file (for partial raw)'
  })
  .option('field-prefix', {
    alias: 'f',
    describe: 'Add this string to fields for JSON output',
    default: ''
  })
  .choices('s', ['auto', 'string', 'binary'])
  .alias('s', 'stringMode')
  .describe('s', 'How should strings be handled? "auto" detects if it\'s binary based on characters, "string" is always a JS string, and "binary" is always a buffer.')
  .default('s', 'auto')
  .help('h')
  .alias('h', 'help')
  .epilog(pkg.name + ' v' + pkg.version)
  .example('rawproto < myfile.pb', 'Get guessed proto3 definition from binary protobuf')
  .example('rawproto -i def.proto -m Test < myfile.pb', 'Guess any fields that aren\'t defined in Test')
  .example('rawproto -j < myfile.pb', 'Get JSON represenation of binary protobuf')
  .example('rawproto -j -s binary < myfile.pb', 'Get JSON represenation of binary protobuf, assume all strings are binary buffers')
  .argv

const body = []
process.stdin
  .on('data', function (chunk) {
    body.push(Buffer.from(chunk))
  })
  .on('end', async function () {
    const buffer = Buffer.concat(body)
    let root
    if (args.include && args.message) {
      const p = await protobuf.load(args.include)
      root = p.lookupType(args.message)
    }
    if (args.json) {
      console.log(JSON.stringify(rawproto.getData(buffer, root, args.stringMode, args.fieldPrefix), null, 2))
    } else {
      console.log(rawproto.getProto(buffer, root, args.message, args.stringMode))
    }
  })

