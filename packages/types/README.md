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
| `PortableLanguageAPI`, `PortableEngine<API>` | The portable preview's vocabulary kinds and language-scoped guards |
| `EngineOptions<API>` | API selection, grammar render options, and interceptors |
| `Rendered` | A render result with `toString`, `print`, and `save` |
| `Types<Engine>` | The engine's grammar-indexed node type map |
| `EngineDiagnostics`, `ParsedRead` | Low-level read diagnostics for tooling |

```ts
import type { Engine } from '@sittir/types';
import rust, { type RustAPI } from '@sittir/rust';

function identifier(rs: Engine<RustAPI>, name: string) {
	return rs.build.identifier(name);
}

using rs = await rust.createEngine();
identifier(rs, 'value').$render(); // "value"
```

These types describe syntax and engine contracts, not the target language's semantic type system. Vocabulary declarations also live here. The portable preview selected with `api: 'portable'` exposes kinds and guards; portable node projections, readers, and builders remain planned. See the [usage guide](../../docs/use-cases-and-examples.md) and [architecture](../../docs/architecture.md).
