# @sittir/common

The shared runtime boundary for Sittir: language loading, engine ownership, node operations, query evaluation, and native integration.

```ts
import { createEngine } from '@sittir/common';
import rust from '@sittir/rust';

const engine = await createEngine(rust);
engine.build.identifier('value').$render(); // "value"
engine.dispose();
```

The language descriptor supplies the generated API and native binding. There is no JavaScript renderer fallback. Use the engine's builders and readers rather than constructing raw node storage.

See the [usage guide](../../docs/use-cases-and-examples.md), [architecture](../../docs/architecture.md), and [development guide](../../DEVELOPMENT.md).
