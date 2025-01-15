# rawproto

[![tests](https://github.com/konsumer/rawproto/actions/workflows/test.yml/badge.svg)](https://github.com/konsumer/rawproto/actions/workflows/test.yml) [![codecov](https://codecov.io/gh/konsumer/rawproto/graph/badge.svg?token=PBL1G8S4WY)](https://codecov.io/gh/konsumer/rawproto) [![NPM Version](https://img.shields.io/npm/v/rawproto)](https://www.npmjs.com/package/rawproto)

Guess structure of protobuf binary from raw data, query binary protobuf without the schema, and output guessed JSON or schema, some CLI utils, and a web tool for exploring raw protobuf.

You can explore your proto binary data [here](https://konsumer.js.org/rawproto/). Use it to view, generate proto/json files, or select how to parse fields.

If you are coming form an older version, or another library, check out [migration instructions](#migration).


## installation

`npm i rawproto` will add this to your project.

You can also use `npx rawproto` to run the CLI.

## usage

### CLI

Install it in your path with `npm i -g rawproto` or use it 1-off with `npx rawproto`. Get help with `rawproto --help`


### code

You can use it, as a library, in code like this:

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
- `LEN` will try to be parsed as sub-tree, but you can override with other types in `query` or with a typemap (for example if it tries to make a sub-message with part of a string)

## query-map

Many things (ui, `toJS`, `toProto`, cli) use `queryMap` which is just a map of `name` to `path:type`. Here is one that works well with [hearthstone test data](test/hearthstone.bin):

```json
{
  "id": "1.2.4.1:string",
  "title": "1.2.4.5:string",
  "company": "1.2.4.6:string",
  "description": "1.2.4.7:string",

  "media": "1.2.4.10",
  "media.dimensions": "1.2.4.10.2",
  "media.dimensions.width": "1.2.4.10.2.3:uint",
  "media.dimensions.height": "1.2.4.10.2.4:uint",
  "media.url": "1.2.4.10.5:string",
  "media.type": "1.2.4.10.1:uint",
  "media.bg": "1.2.4.10.15:string"
}
```

You can use any types, from above, and set the name to whatever you want. Since it's flat, and JSON doesn't allow multiple keys with same name, it helps to prefix it with the path (like `media`, above.) When JSON/proto is generated, or it is viewed in web UI, it will only use the last segment, anyway.

### protoc

If you already have some of your types defined in a proto file, or just find that easier to make proto typemaps in (it generally is much nicer, and there is more tooling available) you can use [protoc-gen-typemap](https://github.com/konsumer/protoc-gen-typemap) to generate typemaps:

```
npm i -g protoc-gen-typemap
cat data.pb | protoc --typemap_out=MyMessage:generated mine.proto
```


You can use partial defintiions to just get the part you want, but you have to make sure to drill all the way into the data, like:

```proto
# this is entrypoint for stuff we want: 1.2.4
message Payload {
  Message1 field1 = 1;
  message Message1 {
    Message2 field2 = 2;
    message Mesage2 {
      App field4 = 4;
    }
  }
}

# this is the actual data we care about
message App {
  string id = 1;
  string title = 5;
  string company = 6;
  string description = 7;
  repeated Media media = 10;
}

message Media {
  int type = 1;
  Dimensions dimensions = 2;
  string url = 5;
  string bg = 15;
}

message Dimensions {
  int width = 3;
  int height = 4;
}
```

Then you would use it like this to generate a typemap:

```
cat data.pb | protoc --typemap_out=Payload:generated app.proto
```

And you can also just decode, directly:

```
cat data.pb | protoc --decode=Payload app.proto
```


## migration

I used to have the functionality of this lib split up into several other projects. Here is migration instructions, if you want to update to this one (recommended):

- [protobuf-decoder](https://github.com/konsumer/protobuf-decoder) -  just use [site](https://konsumer.js.org/rawproto/). The code is [here](https://github.com/konsumer/rawproto/tree/master/ui)
- [rawprotoparse](https://github.com/konsumer/rawprotoparse) - this originally would create JSON from protobuf binary. If you were using this as-is, it had a lot of options, which have been merged into either `toJS` (see [tests](https://github.com/konsumer/rawproto/blob/master/test/json.test.js) for examples.) It may require a little bit more custom-code, if you were not using it with defaults, but overall should work better, and merges shared code that was in both libs. Main thing is that regular `toJS`, without a custom-mapper, will make all values an array, since it's possible for any field ID to be found multiple times.
- [newrawprotoparser](https://github.com/konsumer/newrawprotoparser) - this was some of the start of ideas for this. No one is probly using this. Essentially, it's the same stuff in [path](https://github.com/konsumer/rawproto/blob/master/test/path.test.js)
- [protoquery](https://github.com/konsumer/protoquery) - this was some of the start of ideas for this. No one is probly using this. Essentially it's the same stuff in [query](https://github.com/konsumer/rawproto/blob/master/test/query.test.js)
- rawproto - This lib used to be able to do JSON and generate proto, and provided a different CLI. You should be able to use the new APIs to accomplish all the same stuff, but it may require a bit of a change to your code. Have a look at the [unit-tests](https://github.com/konsumer/rawproto/tree/master/test), to get an idea of how it works.


