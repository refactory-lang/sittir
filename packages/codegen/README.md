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

## Override DSL — `@sittir/codegen/dsl`

Stable authoring surface for `packages/<grammar>/overrides.ts` files.
Tree-sitter baseline DSL (`grammar`, `seq`, `choice`, `optional`,
`repeat`, `repeat1`, `field`, `token`, `prec`, `alias`, `blank`) is
injected as globals at evaluate time — *don't* import those. The
sittir-specific extensions below ARE imported explicitly:

```ts
import { transform, role, enrich, field, alias, insert, replace } from '@sittir/codegen/dsl'
```

| Function | Signature | Purpose |
|---|---|---|
| **`transform`** | `transform(original, patches: Record<string, Rule>)` | Patch an existing rule by position or path. Numeric keys (`{0: ..., 2: ...}`) apply by flat seq position with recursive descent through choice/wrappers. Path keys (`{'0/0': ..., '0/*\/1': ...}`) reach into nested structures and support `*` wildcards. Precedence wrappers are transparent — the same path works whether sittir strips `prec` or tree-sitter preserves it. |
| **`role`** | `role(symbol, name)` | Mark an external token symbol with a structural-whitespace role (`indent`/`dedent`/`newline`). Returns the symbol unchanged. Records the binding on a per-grammar accumulator that Link reads. Tree-sitter compat: outside any sittir scope, the side-effect is dropped silently. |
| **`enrich`** | `enrich(base): base` | Run mechanical enrichment passes on a tree-sitter grammar result before extension. Currently: unambiguous kind-to-name field wrapping. Sittir-only — passes through tree-sitter-shaped input as a no-op. |
| **`field`** | `field(name)` / `field(name, content)` | Two-arg form delegates to runtime native `field()`. One-arg form returns a placeholder that `transform()` patches swap out using the original member at the target position. |
| **`alias`** | `alias(rule)` / `alias(rule, value)` | Two-arg form delegates to runtime native `alias()`. One-arg form is shorthand for `alias($.name, $.name)` — aliasing a symbol to itself with `named: true`. |
| **`insert`** | `insert(rule, position, wrapper)` | Wrap a single seq member at `position` using the wrapper function. Marks the result as `source: 'override'`. |
| **`replace`** | `replace(rule, position, replacement)` | Replace a seq member by position. Pass `null` to remove. |

### Transform examples

```ts
// Flat positional — numeric keys, recursive descent into choice/wrappers
comparison_operator: ($, original) => transform(original, {
    0: field('left'),
    1: field('comparators'),
}),

// Path-addressed — reach into nested choice alternatives
range_expression: ($, original) => transform(original, {
    '0/0': field('start'),
    '0/1': field('operator'),
    '0/2': field('end'),
    '1/0': field('start'),
    '1/1': field('operator'),
    '2/0': field('operator'),
    '2/1': field('end'),
    '3':   field('operator'),
}),
```

### Role bindings — externals callback pattern

```ts
externals: ($, prev) => {
    role($._indent,  'indent')
    role($._dedent,  'dedent')
    role($._newline, 'newline')
    return prev
},
```

`role()` records the binding as a side-effect and returns the symbol
unchanged. `prev` is returned directly so neither runtime sees
duplicate externals (sittir runtime dedupes by name; tree-sitter
runtime doesn't dedupe at all and would reject the parser.c link step).

See `specs/006-override-dsl-enrich/` and `docs/adr/0001..0005` for the
design rationale behind these primitives.

## Tree-sitter compat — transpile + parse

The override DSL is also consumable by tree-sitter's own parser
generator. Each grammar package's `overrides.ts` is transpiled to
`packages/<grammar>/.sittir/grammar.js` (CJS for tree-sitter CLI) via
esbuild, with the base grammar package and its transitive
`tree-sitter-*` deps externalized so tree-sitter's CLI resolves them
at runtime. `tree-sitter generate` against the bundled output
produces a parser whose parse tree carries every field label sittir's
transforms add — verifiable by reading the generated `node-types.json`.

## License

MIT
