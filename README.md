# rawproto

[![tests](https://github.com/konsumer/rawproto/actions/workflows/test.yml/badge.svg)](https://github.com/konsumer/rawproto/actions/workflows/test.yml) [![codecov](https://codecov.io/gh/konsumer/rawproto/graph/badge.svg?token=PBL1G8S4WY)](https://codecov.io/gh/konsumer/rawproto) [![NPM Version](https://img.shields.io/npm/v/rawproto)](https://www.npmjs.com/package/rawproto)

Guess structure of protobuf binary from raw data, query binary protobuf without the schema, and output guessed JSON or schema, some CLI utils, and a web tool for exploring raw protobuf.

## installation

`npm i rawproto` will add this to your project.

You can also use `npx rawproto` to run the CLI.

If you just want the CLI, and don't use node, you can also find standalone builds [here](https://github.com/konsumer/rawproto/releases).

## usage

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

### types

Protobuf encodes several different possible types for every wire-type. In this lib, we guess the type based on some context-clues, but it will never be perfect, without hand-tuning. Here are the possible types we support:

```
VARINT - int, bool
FIXED64 - uint, int, bytes, float
LEN - string, bytes, sub, packedvarint, packedint32, packedint64
FIXED32 - int, uint, bytes, float
```

You can also use `raw` for any type to get the raw field with bytes + meta.

Groups are treated as repeated `LEN` message-fields.
