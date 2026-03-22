# @sittir/codegen

Generate typed IR builders from tree-sitter grammars.

## Installation

```bash
pnpm add @sittir/codegen
```

## What It Does

Reads `tree-sitter-{lang}/src/node-types.json` directly from tree-sitter grammar packages and generates:

- **Builder factory functions** — `structItem()`, `functionItem()`, etc.
- **Fluent builder classes** — `ir.fn("main").body("42").render()`
- **Render switch cases** — IR node to source string
- **Type definitions** — grammar-derived TypeScript types
- **Test scaffolding** — vitest fixtures per node kind

## Usage

### Programmatic

```ts
import { generate } from '@sittir/codegen';

const files = generate({
  grammar: 'rust',
  nodes: ['struct_item', 'function_item', 'use_declaration'],
  outputDir: 'src/generated/',
});
```

### CLI

```bash
sittir --grammar rust --nodes struct_item,function_item --output src/generated/
```

## How It Works

```
tree-sitter-rust/src/node-types.json
        |
  grammar-reader.ts    (loads + caches node-types.json via createRequire)
        |
  emitters/            (types, builder, fluent, render-scaffold, test)
        |
  Generated TypeScript (ready to use)
```

The codegen reads `node-types.json` directly — no intermediary dependencies on jssg-types or ast-grep.

## Generate a New Language IR

```ts
import { generate } from '@sittir/codegen';

const files = generate({
  grammar: 'go',
  nodes: ['struct_type', 'function_declaration', 'import_declaration'],
  outputDir: 'packages/go/src/',
});
```

This produces a package with the same builder pattern as `@sittir/rust`.

## License

MIT
