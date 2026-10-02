# @sittir/types

The types of sittir's engine API, shared by `@sittir/common` and every grammar package. It exports types only.

## Installation

```bash
pnpm add @sittir/types
```

## What it holds

| Type                                   | What it is                                                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `Language<API>`                        | A grammar package's default export: its name and a `load()` that imports the implementation on demand        |
| `LanguageAPI`                          | The type-level shape of one language: builder table, guards, kind ids, node types, options, empty forms      |
| `Engine<API>`                          | What `createEngine(language)` returns: `build`, `is`, `kinds`, `parse`, `render`, the node guards |
| `EngineOptions<API>`                   | The options `createEngine` takes: `render` (the language's render options) and `format`                      |
| `Rendered`                             | The lazily rendered text `engine.render` returns: `toString()`, `print()`, `save(path)`                      |
| `Types<Engine>`                        | The kind-to-node-type map of an engine, for generic code                                                     |
| `EngineDiagnostics`, `ParsedRead`      | The raw read a parse makes, for tooling                                                                      |

## Using them

A function can take an engine typed by its language, and builds through that engine's own surface:

```ts
import { createEngine } from '@sittir/common';
import type { Engine } from '@sittir/types';
import rust, { type RustAPI } from '@sittir/rust';

function identifier(engine: Engine<RustAPI>, name: string) {
	return engine.build.identifier(name);
}

const engine = await createEngine(rust);
identifier(engine, 'b').$render(); // "b"
```

## License

MIT
