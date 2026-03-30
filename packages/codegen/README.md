# @sittir/codegen

Generate typed IR builders from tree-sitter grammars.

## Installation

```bash
pnpm add @sittir/codegen
```

## What It Does

Reads `tree-sitter-{lang}/src/node-types.json` and `grammar.json` directly from tree-sitter grammar packages and generates:

- **Self-contained builders** — each builder class extends `Builder<N>` and owns its render logic
- **Fluent API** — `ir.fn(ir.identifier('main')).body(block)` with rest params for array fields
- **Declarative API** — `ir.fn.from({ name: 'main', body: block })` with precise types
- **Leaf builders** — `ir.identifier('x')`, `ir.integerLiteral(42)` for all terminal kinds
- **Type definitions** — grammar-derived types + leaf types + supertype unions
- **CST hydration** — `fromCST()` + `edit()` for codemod-compatible round-trips
- **Test scaffolding** — vitest fixtures per node kind

## Usage

### Programmatic

```ts
import { generate } from '@sittir/codegen';

const files = generate({ grammar: 'rust' });
// files.builders   — Map<string, string> (one file per node kind)
// files.types      — grammar-derived TypeScript types
// files.builder    — ir namespace (fluent + leaf + fromCST + edit)
// files.tests      — Map<string, string> (one test per node kind)
```

### CLI

```bash
sittir --grammar rust --all --output src/
sittir --grammar rust --nodes struct_item,function_item --output src/
```

## How It Works

```
tree-sitter-{lang}/src/node-types.json   (node metadata)
tree-sitter-{lang}/src/grammar.json      (rule structure for render order)
        |
  grammar-reader.ts    (loads + caches both files, resolves namedTypes)
        |
  emitters/
    ├── builder.ts     Per-node builder class + .from() + options interface
    ├── fluent.ts      ir namespace (branch + leaf + operators + fromCST + edit)
    ├── types.ts       Node types + leaf types + supertype unions
    ├── test.ts        Per-node test scaffold
    └── index-file.ts  Package re-exports
        |
  Generated TypeScript (ready to use)
```

### What Each Builder Contains

Each generated node file (`nodes/*.ts`) is self-contained:

```ts
// nodes/function.ts (example)
class FunctionBuilder extends Builder<FunctionItem> {
  private _name: Builder;
  private _parameters?: Builder;
  private _body?: Builder;
  // ...

  renderImpl(ctx?): string { /* grammar-rule-driven */ }
  build(ctx?): FunctionItem { /* recursive render */ }
  toCSTChildren(ctx?): CSTChild[] { /* keyword + child interleaving */ }
}

export type { FunctionBuilder };
export function fn(name: Builder): FunctionBuilder { ... }

export interface FunctionItemOptions {
  name: Builder<Identifier> | string;  // precise type, string auto-resolves
  parameters: Builder<Parameters>;
  body: Builder<Block>;
  returnType?: Builder<Type>;
}

export namespace fn {
  export function from(options: FunctionItemOptions): FunctionBuilder { ... }
}
```

### Type Resolution

The codegen resolves field types from the grammar's `namedTypes`:
- **Single leaf kind** → `Builder<Identifier> | string` (accepts strings in `.from()`)
- **Single branch kind** → `Builder<Parameters>`
- **Supertype** → `Builder<Expression>` (expanded union alias)
- **Multiple types** → `Builder<Type1 | Type2>`
- **Unresolvable** → `Builder` (wide type)

## Generate a New Language IR

```ts
import { generate } from '@sittir/codegen';

const files = generate({ grammar: 'go' });
```

Or use the CLI:

```bash
sittir --grammar go --all --output packages/go/src/
```

This produces a package with the same builder pattern as `@sittir/rust` and `@sittir/typescript`.

## License

MIT
