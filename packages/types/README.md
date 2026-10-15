# @sittir/types

Shared TypeScript contracts and type projections for Sittir engines, generated language APIs, node families, queries, and rendering.

```sh
pnpm add @sittir/types
```

| Type | Contract |
| --- | --- |
| `Language<API>` | A grammar descriptor with a lazily loaded implementation |
| `LanguageAPI` | A grammar's builders, guards, kind IDs, root/node types, and options |
| `Engine<API>` | The bound construction, parse, query, read, and render surface |
| `EngineOptions<API>` | API selection, grammar render options, and interceptors |
| `Rendered` | A render result with `toString`, `print`, and `save` |
| `Types<Engine>` | The engine's grammar-indexed node type map |
| `EngineDiagnostics`, `ParsedRead` | Low-level read diagnostics for tooling |

```ts
import type { Engine } from '@sittir/types';
import rust, { type RustAPI } from '@sittir/rust';

function identifier(engine: Engine<RustAPI>, name: string) {
	return engine.build.identifier(name);
}

using engine = await rust.createEngine();
identifier(engine, 'value').$render(); // "value"
```

These types describe syntax and engine contracts, not the target language's semantic type system. Vocabulary declarations also live here; declarations for a planned portable surface do not imply its runtime implementation is available. See the [usage guide](../../docs/use-cases-and-examples.md) and [architecture](../../docs/architecture.md).
