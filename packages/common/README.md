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
portable.kinds.identifier.$ids.includes(grammar.kinds.Identifier); // true
```

The preview contains classification metadata and guards; the grammar-specific engine owns native resources and supplies node construction, parsing, queries, and rendering. Portable node projections, readers, and builders remain planned.

See the [usage guide](../../docs/use-cases-and-examples.md), [architecture](../../docs/architecture.md), and [development guide](../../DEVELOPMENT.md).
