# rawproto

> [!CAUTION]
> I am still working on this, and things might change or not work at all

[![tests](https://github.com/konsumer/rawproto/actions/workflows/test.yml/badge.svg)](https://github.com/konsumer/rawproto/actions/workflows/test.yml) [![codecov](https://codecov.io/gh/konsumer/rawproto/graph/badge.svg?token=PBL1G8S4WY)](https://codecov.io/gh/konsumer/rawproto) [![NPM Version](https://img.shields.io/npm/v/rawproto)](https://www.npmjs.com/package/rawproto)

Guess structure of protobuf binary from raw data, query binary protobuf without the schema, and output guessed JSON or schema, some CLI utils, and a web tool for exploring raw protobuf.

You can explore your proto binary data [here](https://konsumer.js.org/rawproto/). Use it to view, generate proto/json files, or select how to parse fields.

If you are coming form an older version, or anothe rlibrary, check out [migration instructions](#migration).


## installation

`npm i rawproto` will add this to your project.

You can also use `npx rawproto` to run the CLI.

If you just want the CLI, and don't use node, you can also find standalone builds [here](https://github.com/konsumer/rawproto/releases).

## usage

### CLI

Install it in your path with `npm i -g rawproto` or use it 1-off with `npx rawproto`. Get help with `rawproto --help`


### code

You can use it in code like this:

```js
import { readFile } from 'fs/promises'
import RawProto from 'rawproto'

// load proto
const proto = new RawProto(await readFile('data.pb'))

// get a single field, without parsing the whole tree
console.log(proto.query('1.2.4.10.5:string'))

// you can also pull things like they are arrays/values
console.log(proto['1'][0]['2'][0]['4'][0]['10'].map(r => r['5'][0].string ))

// guess to decode as JS object
console.log(proto.toJS())

// guess to generate .proto file string
console.log(proto.toProto())

// walk over all fields recursively, calling your callback.
const mydata = proto.walk((field) => {
  console.log(field)

  // just do whatever it normally does to make JS-object
  return walkerJS(field)
})
```

## types

Protobuf encodes several different possible types for every wire-type. In this lib, we guess the type based on some context-clues, but it will never be perfect, without hand-tuning. Here are the possible types we support:

```
VARINT - int, bool, string
FIXED64 - uint, int, bytes, float, string
LEN - string, bytes, packedIntVar, packedInt32, packedInt64, string
FIXED32 - int, uint, bytes, float, string
```

- You can use any [protobuf scalar type-name](https://protobuf.dev/programming-guides/proto3/#scalar).
- You can use `raw` for any type to get the raw field with bytes + meta.
- Groups are treated as repeated `LEN` message-fields
- `LEN` will try to be parsed as sub-tree, but you can override with other types in `query` (for example if it tries to make a sub-message with part of a string)

## query-map

Many things (ui, `toJS`, `toProto`, cli) use `queryMap` which is just a map of `name` to `path:type`. Here is one that works well with [hearthstone test data](https://github.com/konsumer/rawproto/raw/master/test/hearthstone.bin):

```json
{
  "id": "1.2.4.1:string",
  "title": "1.2.4.5:string",
  "company": "1.2.4.6:string",
  "description": "1.2.4.7:string",

  "media": "1.2.4.10",
  
  "dimensions": "1.2.4.10.2",
  "width": "1.2.4.10.2.3:uint",
  "height": "1.2.4.10.2.4:uint",

  "url": "1.2.4.10.5:string",
  "type": "1.2.4.10.1:uint",
  "bg": "1.2.4.10.15:string"
}
```

You can use any types, from above, and set the name to whatever you want.

## migration

I used to have the functionality of this lib split up into several other projects. Here is migration instructions, if you want to update to this one (recommended):

- [protobuf-decoder](https://github.com/konsumer/protobuf-decoder) -  just use [site](https://konsumer.js.org/rawproto/). The code is [here](https://github.com/konsumer/rawproto/tree/master/ui)
- [rawprotoparse](https://github.com/konsumer/rawprotoparse) - this originally would create JSON from protobuf binary. If you were using this as-is, it had a lot of options, which have been merged into either `toJS` (see [tests](https://github.com/konsumer/rawproto/blob/master/test/json.test.js) for examples.) It may require a little bit more custom-code, if you were not using it with defaults, but overall should work better, and merges shared code that was in both libs. Main thing is that regular `toJS`, without a custom-mapper, will make all values an array, since it's possible for any field ID to be found multiple times.
- [newrawprotoparser](https://github.com/konsumer/newrawprotoparser) - this was some of the start of ideas for this. No one is probly using this. Essentially, it's the same stuff in [path](https://github.com/konsumer/rawproto/blob/master/test/path.test.js)
- [protoquery](https://github.com/konsumer/protoquery) - this was some of the start of ideas for this. No one is probly using this. Essentially it's the same stuff in [query](https://github.com/konsumer/rawproto/blob/master/test/query.test.js)
- rawproto - This lib used to be able to do JSON and generate proto, and provided a different CLI. You should be able to use the new APIs to accomplish all the same stuff, but it may require a bit of a change to your code. Have a look at the [unit-tests](https://github.com/konsumer/rawproto/tree/master/test), to get an idea of how it works.


