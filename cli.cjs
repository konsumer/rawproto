#!/usr/bin/env node

const rawproto = require('.')
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')

exports.args = yargs(hideBin(process.argv))
  .usage('Usage: $0 <COMMAND>')
  .command('guess', 'Guess the proto definition', y => {}, a => {
    let b = Buffer.from([])
    process.stdin
      .on('data', chunk => b = Buffer.concat([b, chunk]))
      .on('end', () => process.stdout.write(rawproto.getProto(b)))
  })
  .command('parse', 'Raw-parse the binary protobuf', y => {}, a => {
    let b = Buffer.from([])
    process.stdin
      .on('data', chunk => b = Buffer.concat([b, chunk]))
      .on('end', () => process.stdout.write(JSON.stringify(rawproto.getData(b), null, 2)))
  })
  .demandCommand(1)
  .help()
  .argv
