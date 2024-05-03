#!/usr/bin/env node

const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const RawProto = require('./dist/rawproto.cjs')

async function getStdin () {
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(chunk)
  return Buffer.concat(chunks)
}

async function actionJson ({ types }) {
  const p = new RawProto(await getStdin(), types)
  console.log(JSON.stringify(p.toJS(), null, 2))
}

async function actionProto ({ types }) {
  const p = new RawProto(await getStdin(), types)
  console.log(p.toProto())
}

async function actionQuery ({ query, types }) {
  const p = new RawProto(await getStdin(), types)
  console.log(JSON.stringify(p.query(query), null, 2))
}

async function actionTypes ({ query }) {
  const p = new RawProto(await getStdin())
  console.log(JSON.stringify(p.types, null, 2))
}

yargs(hideBin(process.argv))
  .command('json [types]', 'Generate JSON (on stdout) for binary protobuf (on stdin)', (yargs) => {
    return yargs
      .positional('types', {
        describe: 'JSON file that selects types for fields'
      })
      .example('cat myfile.pb | $0 json', 'Get the JSON from myfile.pb, guessing types')
      .example('$0 json < myfile.pb', 'Get the JSON from myfile.pb, guessing types')
      .example('$0 json choices.json < myfile.pb', 'Get the JSON from myfile.pb, using choices.json for types')
  }, (argv) => {
    actionJson(argv)
  })
  .command('proto [types]', 'Generate .proto  (on stdout) for binary protobuf (on stdin)', (yargs) => {
    return yargs
      .positional('types', {
        describe: 'JSON file that selects types for fields'
      })
      .example('cat myfile.pb | $0 proto', 'Get the proto from myfile.pb, guessing types')
      .example('$0 proto < myfile.pb', 'Get the proto from myfile.pb, guessing types')
      .example('$0 proto choices.json < myfile.pb', 'Get the proto from myfile.pb, using choices.json for types')
  }, (argv) => {
    actionProto(argv)
  })
  .command('query <query> [types]', 'Output JSON  (on stdout) for a specific query, for binary protobuf (on stdin)', (yargs) => {
    return yargs
      .positional('query', {
        describe: 'Your protobuf query string'
      })
      .positional('types', {
        describe: 'JSON file that selects types for fields'
      })
      .example('cat myfile.pb | $0 query 1.2.4.10.5:string', 'Get the query from myfile.pb')
      .example('$0 query 1.2.4.10.5:string < myfile.pb', 'Get the query from myfile.pb')
      .example('$0 query 1.2.4.10.5 choices.json < myfile.pb', 'Get the query from myfile.pb, using choices.json for types')
  }, (argv) => {
    actionQuery(argv)
  })
  .command('$0 types', 'Output JSON types guess (on stdout) for binary protobuf (on stdin)', (yargs) => {
    return yargs
      .example('cat myfile.pb | $0 types', 'Get the types from myfile.pb')
      .example('$0 types < myfile.pb', 'Get the types from myfile.pb')
  }, (argv) => {
    actionTypes(argv)
  })
  .example('$0 json --help', 'Get more detailed help on json')
  .example('$0 proto --help', 'Get more detailed help on proto')
  .example('$0 query --help', 'Get more detailed help on query')
  .example('$0 types --help', 'Get more detailed help on types')
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: 'Run with verbose logging'
  })
  .demandCommand(1)
  .parse()
