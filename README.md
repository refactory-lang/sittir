# sittir

Generate typed IR builders from [tree-sitter](https://tree-sitter.github.io/) grammars.

Given any tree-sitter grammar, sittir generates:
- **Typed IR nodes** — grammar-derived TypeScript types for every node kind
- **Self-contained builders** — each builder owns its render logic, no central switch
- **Fluent + declarative APIs** — `ir.fn(id).body(block)` or `ir.fn.from({ name: 'main' })`
- **Leaf + branch builders** — `LeafBuilder` for terminals, generated builders for branches
- **CST round-trip** — `fromCST()` hydrates tree-sitter nodes into builders, `edit()` for codemods
- **Test scaffolds** — one test file per node kind

## Packages

| Package | Description | npm |
|---------|-------------|-----|
| [`@sittir/types`](packages/types) | `Builder<N>`, `LeafBuilder`, `RenderContext`, `Edit`, type projections | [![npm](https://img.shields.io/npm/v/@sittir/types)](https://www.npmjs.com/package/@sittir/types) |
| [`@sittir/codegen`](packages/codegen) | Reads `tree-sitter-{lang}/src/node-types.json`, generates everything | [![npm](https://img.shields.io/npm/v/@sittir/codegen)](https://www.npmjs.com/package/@sittir/codegen) |
| [`@sittir/rust`](packages/rust) | 135 generated Rust IR node kinds + builders | [![npm](https://img.shields.io/npm/v/@sittir/rust)](https://www.npmjs.com/package/@sittir/rust) |
| [`@sittir/typescript`](packages/typescript) | 140 TypeScript + 146 TSX IR node kinds + builders | [![npm](https://img.shields.io/npm/v/@sittir/typescript)](https://www.npmjs.com/package/@sittir/typescript) |
| [`@sittir/python`](packages/python) | 97 generated Python IR node kinds + builders | [![npm](https://img.shields.io/npm/v/@sittir/python)](https://www.npmjs.com/package/@sittir/python) |

## Quick Start

### Fluent API

```ts
import { ir } from '@sittir/rust';

const node = ir.fn(ir.identifier('main'))
  .parameters(ir.parameters())
  .body(ir.block(
    ir.expressionStatement(ir.macro_invocation(ir.identifier('println')))
  ));

node.render('skip');   // sync, no validation
node.render('fast');   // sync, brace/paren matching
node.render('full', { parser });  // async, tree-sitter
```

### Declarative API (`.from()`)

```ts
import { ir } from '@sittir/typescript';

// Strings auto-resolve to LeafBuilder for leaf-typed fields
const fn = ir.function_.from({
  name: 'greet',                          // string → LeafBuilder('identifier', 'greet')
  parameters: ir.formalParameters(),
  body: ir.statementBlock(
    ir.return_().children(ir.identifier('hello'))
  ),
});

fn.renderImpl();  // "function greet ( ) { return hello }"
```

### CST Round-Trip (Codemods)

```ts
import { fromCST, edit } from '@sittir/rust';

// Hydrate a tree-sitter CST node into a builder
const builder = fromCST(treeSitterNode);

// Or use edit() for codemod-compatible text edits
const patch = edit(treeSitterNode, (b) => {
  return b.body(ir.block());  // transform must return a builder
});
// patch = { startPos, endPos, insertedText }
```

## How It Works

```
tree-sitter-{lang}/src/node-types.json    (from tree-sitter grammar)
tree-sitter-{lang}/src/grammar.json       (for render order + keywords)
        ↓
  @sittir/codegen                          (reads JSON, generates everything)
        ↓
  @sittir/{lang}/src/
    ├── nodes/*.ts     Self-contained builders (render + CST + .from())
    ├── builder.ts     ir namespace (fluent + leaf + fromCST + edit)
    ├── types.ts       Grammar-derived types + leaf types + supertype unions
    └── tests/*.ts     Per-node test scaffolds
```

The codegen reads `node-types.json` and `grammar.json` directly from tree-sitter grammar packages — no intermediary dependencies. The generated types are structurally compatible with `@codemod.com/jssg-types` for codemod consumers.

## Generate a New Language IR

```ts
import { generate } from '@sittir/codegen';

const files = generate({ grammar: 'go' });
// files.builders — Map<string, string> of node builder files
// files.types — grammar-derived types
// files.builder — ir namespace (fluent + leaf + fromCST + edit)
```

Or via CLI:

```bash
sittir --grammar go --all --output packages/go/src/
```

## Development

```bash
pnpm install          # install dependencies
pnpm -r run test      # run all tests (1,121 passing)
pnpm -r run type-check  # typecheck all packages
pnpm -r run build     # build all packages
```

## Architecture

```
@sittir/types          Builder<N>, LeafBuilder, RenderContext, Edit
    ↑                  NodeType<G,K>, BuilderConfig<G,T> (type-level)
    │
@sittir/codegen        Grammar reader + emitters (types, builders, fluent, tests)
    │                  Reads node-types.json + grammar.json
    ↓
@sittir/rust           135 self-contained Rust builders
@sittir/typescript     140 self-contained TypeScript builders (+146 TSX)
@sittir/python         97 self-contained Python builders
```

### Builder Architecture

Every field holds a `Builder` instance — no strings. Rendering is lazy and owned by each builder:

```
Builder<N>                     Abstract base (renderImpl, build, toCST, render)
  ├── LeafBuilder<K>           Terminal nodes (identifiers, literals, keywords)
  └── FunctionBuilder          Generated per-node (owns render logic, field setters)
      StructBuilder
      ...
```

Each generated builder provides:
- **Fluent setters** — `builder.body(value).returnType(value)`
- **Rest params** for array fields — `ir.block(stmt1, stmt2)` not `ir.block([stmt1, stmt2])`
- **`.from()` declarative API** — `ir.fn.from({ name: 'main', body: block })` with precise types
- **`renderImpl(ctx?)`** — grammar-rule-driven rendering
- **`build(ctx?)`** — produces plain-object IR node
- **`toCST(offset?, ctx?)`** — produces lightweight CST with positions

## License

MIT
