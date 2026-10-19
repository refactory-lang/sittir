# @sittir/common

The shared runtime boundary for Sittir: language loading, engine ownership, node operations, query evaluation, and native integration.

```ts
import { createEngine } from '@sittir/common';
import rust from '@sittir/rust';

using rs = await createEngine(rust);
rs.build.identifier('value').$render(); // "value"
```

The language descriptor supplies the generated API and native binding. There is no JavaScript renderer fallback. Use the engine's builders and readers rather than constructing raw node storage.

## Portable preview

For a language with authored bindings, `api: 'portable'` selects vocabulary kinds and guards. The typed standalone factory exposes that preview separately from the grammar-specific engine:

```ts
import { createEngine } from '@sittir/common';
import rust from '@sittir/rust';

using grammar = await createEngine(rust);
const portable = await createEngine(rust, { api: 'portable' });
const name = grammar.build.identifier('value');

portable.is.identifier(name); // true
grammar.is.portable.identifier(name); // true: the same guards, on every engine of the language
portable.kinds.identifier.$path; // 'identifier': one kind object, shared by every language
```

A language's guards take a node of the language or a kind id of it. A keyword leaf is a kind id (rust's `u8`, `true` or `self`), classified by its kind and its fixed text: `rust.is.portable.type.primitive.boolean(rust.kinds.BoolKeyword)` is true. Reading a kind id needs the language's rows, so it throws until an engine of the language exists. The shared guards in `@sittir/common/portable` read nodes of every bound language and answer false for a bare kind id, which names no language. A kind whose reading depends on where it sits reads by its next reading: a method inside an impl or class body reads as a function, and a closure parameter as no parameter. The preview contains classification metadata and guards; the grammar-specific engine owns native resources and supplies node construction, parsing, queries, and rendering. Portable node projections, readers, and builders remain planned.

See the [usage guide](../../docs/use-cases-and-examples.md), [architecture](../../docs/architecture.md), and [development guide](../../DEVELOPMENT.md).
