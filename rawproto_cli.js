#!/usr/bin/env node

import yargs from 'yargs/yargs'
import { hideBin } from 'yargs/helpers'
import RawProto from './dist/rawproto.modern.js'
import { readFile } from 'fs/promises'

async function getStdin () {
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(chunk)
  return Buffer.concat(chunks)
}

async function actionJson ({ types, prefix }) {
  if (types) {
    types = JSON.parse(await readFile(types))
  } else {
    types = {}
  }
  const j = new RawProto(await getStdin()).toJS(types, prefix)
  console.log(JSON.stringify(j, null, 2))
}

async function actionProto ({ types, prefix }) {
  if (types) {
    types = JSON.parse(await readFile(types))
  } else {
    types = {}
  }
  const p = new RawProto(await getStdin(), types).toProto(types, prefix)
  console.log(p)
}

async function actionQuery ({ query }) {
  const p = new RawProto(await getStdin())
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
      .option('prefix', {
        alias: 'p',
        type: 'string',
        description: 'Path-prefix to add to fields on output',
        default: 'f'
      })
      .example('cat myfile.pb | $0 json', 'Get the JSON from myfile.pb, guessing types')
      .example('$0 json < myfile.pb', 'Get the JSON from myfile.pb, guessing types')
      .example('$0 json -p "" < myfile.pb', 'Get the JSON from myfile.pb, guessing types, oputput no field-prefixes')
      .example('$0 json choices.json < myfile.pb', 'Get the JSON from myfile.pb, using choices.json for types')
  }, (argv) => {
    actionJson(argv)
  })
  .command('proto [types]', 'Generate .proto  (on stdout) for binary protobuf (on stdin)', (yargs) => {
    return yargs
      .positional('types', {
        describe: 'JSON file that selects types for fields'
      })
      .option('prefix', {
        alias: 'p',
        type: 'string',
        description: 'Path-prefix to add to fields on output',
        default: 'f'
      })
      .example('cat myfile.pb | $0 proto', 'Get the proto from myfile.pb, guessing types')
      .example('$0 proto < myfile.pb', 'Get the proto from myfile.pb, guessing types')
      .example('$0 proto choices.json < myfile.pb', 'Get the proto from myfile.pb, using choices.json for types')
  }, (argv) => {
    actionProto(argv)
  })
  .command('query <query>', 'Output JSON  (on stdout) for a specific query, for binary protobuf (on stdin)', (yargs) => {
    return yargs
      .positional('query', {
        describe: 'Your protobuf query string'
      })
      .example('cat myfile.pb | $0 query 1.2.4.10.5:string', 'Get the query from myfile.pb')
      .example('$0 query 1.2.4.10.5:string < myfile.pb', 'Get the query from myfile.pb')
  }, (argv) => {
    actionQuery(argv)
  })
  // .command('$0 types', 'Output JSON types guess (on stdout) for binary protobuf (on stdin)', (yargs) => {
  //   return yargs
  //     .example('cat myfile.pb | $0 types', 'Get the types from myfile.pb')
  //     .example('$0 types < myfile.pb', 'Get the types from myfile.pb')
  // }, (argv) => {
  //   actionTypes(argv)
  // })
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
