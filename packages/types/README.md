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
| `Engine<API>`                          | What `createEngine(language)` returns: `build`, `is`, `kinds`, `parse`, `render`, `applyEdits`, the node guards |
| `EngineOptions<API>`                   | The options `createEngine` takes: `render` (the language's render options) and `format`                      |
| `Rendered`                             | The lazily rendered text `engine.render` returns: `toString()`, `print()`, `save(path)`                      |
| `Edit`                                 | A text edit, `{ startPos, endPos, insertedText }`, which `$toEdit` produces and `applyEdits` consumes         |
| `Types<Engine>`                        | The kind-to-node-type map of an engine, for generic code                                                     |
| `EngineDiagnostics`, `ParsedRead`      | The raw read a parse makes, for tooling                                                                      |

## Using them

A function can take an engine typed by its language, and builds and edits through that engine's own surface:

```ts
import { createEngine } from '@sittir/common';
import type { Edit, Engine } from '@sittir/types';
import rust, { type RustAPI } from '@sittir/rust';

function renameEdit(engine: Engine<RustAPI>, start: number, end: number, name: string): Edit {
	return engine.build.identifier(name).$toEdit(start, end);
}

const engine = await createEngine(rust);
renameEdit(engine, 4, 5, 'b').insertedText; // "b"
```

`Edit` is the shape codemod tools already use: replace bytes `[startPos, endPos)` with `insertedText`.

```ts
import type { Edit } from '@sittir/types';

const edit: Edit = { startPos: 0, endPos: 10, insertedText: 'fn main() {}' };
```

## License

MIT
