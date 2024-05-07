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

I am still working on this, but will offer a CLI for all the different things you can do with this lib.

### code

You can use it in code like this:

```js
import { readFile } from 'fs/promises'
import RawProto, { query } from 'rawproto'

// load proto & override "best guess" of types for a single field
const proto = new RawProto(await readFile('data.pb'), { '1.2.4.10.5': 'string' })

// get a single field, without parsing the whole tree
console.log(proto.query('1.2.4.10.5:bytes'))

// same thing, but using type-mapping
console.log(proto.query('1.2.4.10.5'))

// You can also cache your tree, reuse it in multiple queries, and use a prefix
console.log(query(proto, '5', '1.2.4.10'))
console.log(query(proto, '1', '1.2.4.10'))

// guess to decode as JS object, also works with prefix
console.log(proto.toJS())

// guess to generate .proto file string, also works with prefix
console.log(proto.toProto())

// walk over messages recursively, calling your callback.
const mydata = proto.walk((path, wireType, data) => {
  console.log({ path, wireType, data })

  // just do whatever it normally does to make JS-object
  return proto.walkerJS(path, wireType, data)
})
```

## types

Protobuf encodes several different possible types for every wire-type. In this lib, we guess the type based on some context-clues, but it will never be perfect, without hand-tuning. Here are the possible types we support:

```
VARINT - int, bool
FIXED64 - uint, int, bytes, float
LEN - string, bytes, sub, packedvarint, packedint32, packedint64
FIXED32 - int, uint, bytes, float
```

You can also use `raw` for any type to get the raw field with bytes + meta.

Groups are treated as repeated `LEN` message-fields.



## migration

I used to have the functionality of this lib split up into several other projects. Here is migration instructions, if you want to update to this one (recommended):

- [protobuf-decoder](https://github.com/konsumer/protobuf-decoder) -  just use [site](https://konsumer.js.org/rawproto/). The code is [here](https://github.com/konsumer/rawproto/tree/master/ui)
- [rawprotoparse](https://github.com/konsumer/rawprotoparse) - this originally would create JSON from protobuf binary. If you were using this as-is, it had a lot of options, which have been merged into either `toJS` (see [tests](https://github.com/konsumer/rawproto/blob/master/test/json.test.js) for examples) or a custom field-mapper, which you can do with `walk()`. It may require a little bit more custom-code, if you ware not using it with defaults, but overall should work better, and merges shared code that was in both libs. Main thing is that regular `toJS`, without a custom-mapper, will make all values an array, since it's possible for any field ID to be found multiple times.
- [newrawprotoparser](https://github.com/konsumer/newrawprotoparser) - this was some of the start of ideas for this. No one is probly using this. Essentially, it's the same stuff in [path](https://github.com/konsumer/rawproto/blob/master/test/path.test.js)
- [protoquery](https://github.com/konsumer/protoquery) - this was some of the start of ideas for this. No one is probly using this. Essentially it's the same stuff in [query](https://github.com/konsumer/rawproto/blob/master/test/query.test.js)
- rawproto - This lib used to be able to do JSON and generate proto, and provided a different CLI. You should be able to use the new APIs to accomplish all the same stuff, but it may require a bit of a change to your code. Have a look at the [unit-tests](https://github.com/konsumer/rawproto/tree/master/test), to get an idea of how it works.


## todo

I have some ideas for improvement. I was in a hurry to get the new ideas working similar to how the older libs worked, and add all the new features, but It's far from optimized.

- on-demand sub-tree parsing. Currently it needs to get sub-trees for query & walking, but it would be better if it only did this when it enters the LEN branch.
- There is a lot of duplication of data in LEN fields (and non-LEN) like `reader`, `tree`, `value` and even kinda `pos` all describe the same data. It would be better if it only used a single instance of bytes for all, and used offsets, so nothing has a "value" but you can pull values as needed. I could use a single `DataView` & buffer object, for the whole reader, and just use offsets to pull out values on-demand (`query`/`walk`/`display`/`getValue`.)
- build `choices` by guessing & merging with another `choices` object. This could be used with last thing to make rendering simpler (all choices would be pre-configured, so choices + offsets get all values.)
- build `choices` from existing proto. This could be used with above to allow guessing types of only the unknown fields, but leaving ther others.
- build `choices` (guess) from existing JSON. This would allow taking some mock JSON and building proto or parsing protobuf.
- setup recursiove proxies so you can get values like `1.2.4.1.toString()` without query

