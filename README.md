# sittir

Generate typed IR builders from [tree-sitter](https://tree-sitter.github.io/) grammars.

Given any tree-sitter grammar, sittir generates:
- **Typed IR nodes** — grammar-derived TypeScript types for every node kind
- **Fluent builders** — `ir.fn("main").body("42").render()` style API
- **Render pipeline** — IR node → source string with validation
- **Test scaffolds** — one test file per node kind

## Packages

| Package | Description | npm |
|---------|-------------|-----|
| [`@sittir/types`](packages/types) | Language-agnostic type projection (`BuilderTerminal`, `NodeType`, `BuilderConfig`) | [![npm](https://img.shields.io/npm/v/@sittir/types)](https://www.npmjs.com/package/@sittir/types) |
| [`@sittir/codegen`](packages/codegen) | Reads `tree-sitter-{lang}/src/node-types.json`, generates everything | [![npm](https://img.shields.io/npm/v/@sittir/codegen)](https://www.npmjs.com/package/@sittir/codegen) |
| [`@sittir/rust`](packages/rust) | 134 generated Rust IR node kinds + fluent builders + render + validate | [![npm](https://img.shields.io/npm/v/@sittir/rust)](https://www.npmjs.com/package/@sittir/rust) |

## Quick Start

```ts
import { ir } from '@sittir/rust';

const source = ir.file().children([
  ir.use('std::collections::HashMap').build(),
  ir.structItem('Config').body('name: String,').build(),
  ir.fn('main').body('println!("hello");').build(),
]).render();
```

Output:

```rust
use std::collections::HashMap;

struct Config {
    name: String,
}

fn main() {
    println!("hello");
}
```

## How It Works

```
tree-sitter-rust/src/node-types.json   (MIT, from tree-sitter grammar)
        ↓
  @sittir/codegen                      (reads JSON, generates everything)
        ↓
  @sittir/rust                         (134 typed node kinds + builders)
```

The codegen reads `node-types.json` directly from tree-sitter grammar packages — no intermediary dependencies. The generated types are structurally compatible with `@codemod.com/jssg-types` for codemod consumers.

## Generate a New Language IR

```ts
import { generate, listNodeKinds } from '@sittir/codegen';

const nodes = listNodeKinds('go'); // reads tree-sitter-go/src/node-types.json
generate({ grammar: 'go', nodes, outputDir: 'packages/go/src' });
```

This generates `@sittir/go` with the same builder pattern as `@sittir/rust`.

## Development

```bash
pnpm install          # install dependencies
pnpm test             # run all tests (103 passing)
pnpm type-check       # typecheck all packages
pnpm build            # build all packages
pnpm lint             # lint
pnpm format           # format
```

## Architecture

```
@sittir/types          BuilderTerminal<N>, NodeType<G,K>, BuilderConfig<G,T>
    ↑                  (pure type-level, no runtime)
    │
@sittir/codegen        Grammar reader + emitters (types, builders, render, tests)
    │                  Reads tree-sitter-{lang}/src/node-types.json
    ↓
@sittir/rust           134 generated Rust node kinds, builders, render, validate
```

## License

MIT
