# sittir

Generate typed factory functions and YAML render templates from [tree-sitter](https://tree-sitter.github.io/) grammars.

Given any tree-sitter grammar, sittir generates:
- **Typed factories** — one per node kind, producing `NodeData` plain objects with fluent getters/setters
- **YAML render templates** — `$FIELD_NAME` placeholder syntax with `joinBy` separators and polymorph variants, stored in `templates.yaml`
- **`.from()` resolution** — ergonomic input with string/number/object coercion, fully tree-shakeable
- **`readNode()` hydration** — wraps tree-sitter parse trees into `NodeData` for round-trip editing
- **Const enums + navigation types** — `SyntaxKind`, operator/keyword maps, supertype unions
- **Generated tests** — per-kind factory + render + round-trip validation

## Key Features

- **Grammar-agnostic pipeline** — works with any tree-sitter grammar without modification. All language-specific knowledge flows through override configuration.
- **Five-phase compiler** — Evaluate → Link → Optimize → Assemble → Emit. Each phase has a single responsibility and produces a well-defined intermediate representation.
- **Override DSL** — `transform()`, `enrich()`, `role()` primitives let grammar maintainers patch field labels, add mechanical promotions, and declare structural roles without rewriting rules.
- **Zero runtime dependencies** — generated packages depend only on `@sittir/core` and `@sittir/types`. No third-party runtime deps.
- **Deterministic output** — same grammar version produces byte-identical generated code. No timestamps, random identifiers, or order-dependent iteration.

## Packages

| Package | Description |
|---------|-------------|
| [`@sittir/core`](packages/core) | Grammar-driven render engine, validation, CST, Edit creation |
| [`@sittir/types`](packages/types) | Pure TypeScript types (zero runtime) — `AnyNodeData`, `ConfigOf<T>`, `TreeNodeOf<T>` |
| [`@sittir/codegen`](packages/codegen) | Five-phase compiler: reads grammar.json + node-types.json, emits everything |
| [`@sittir/rust`](packages/rust) | 210 generated Rust node kinds |
| [`@sittir/typescript`](packages/typescript) | 269 generated TypeScript node kinds |
| [`@sittir/python`](packages/python) | 176 generated Python node kinds |

## Quick Start

### Factory API

```ts
import { ir } from '@sittir/rust'

const node = ir.functionItem({
  name: ir.identifier('main'),       // leaf factory takes text directly
  parameters: ir.parameters(),       // rest-params (variadic children)
  body: ir.block({ children: [] }),
})

console.log(node.type)               // 'function_item'
console.log(node.name().text)        // 'main' (fluent getter, no-arg = get)
const withBody = node.body(newBlock)  // with-arg = setter (returns new node)
```

### `.from()` API

```ts
import { ir } from '@sittir/typescript'

const fn = ir.functionDeclaration.from({
  name: 'greet',             // string → identifier leaf node
  body: ir.statementBlock.from({
    children: [ir.returnStatement.from({ children: [ir.identifier('hello')] })],
  }),
})
```

### Render

```ts
import { render } from '@sittir/core'
import { rules } from '@sittir/rust'

const source = render(node, rules)  // YAML template expansion
```

### Round-Trip (Codemods)

```ts
import { wrap, edit } from '@sittir/rust'

// Hydrate a tree-sitter parse tree node into NodeData
const nodeData = wrap(treeSitterNode)

// Create a text edit
const patch = edit(treeSitterNode, (nd) => {
  return nd.body(ir.block({ children: [] }))
})
// patch = { startIndex, endIndex, newText }
```

## Architecture

```
                    ┌──────────────────────────────────────────────┐
                    │              @sittir/codegen                  │
                    │                                              │
  grammar.json ───▶ │  Evaluate → Link → Optimize → Assemble → Emit│
  node-types.json ─▶ │                                              │
  overrides.ts ────▶ │  DSL: transform() / enrich() / role()        │
                    └──────────────┬───────────────────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              ▼                    ▼                     ▼
       @sittir/rust         @sittir/typescript     @sittir/python
       ├── types.ts         ├── types.ts           ├── types.ts
       ├── factories.ts     ├── factories.ts       ├── factories.ts
       ├── from.ts          ├── from.ts            ├── from.ts
       ├── wrap.ts          ├── wrap.ts            ├── wrap.ts
       ├── rules.ts         ├── rules.ts           ├── rules.ts
       ├── ir.ts            ├── ir.ts              ├── ir.ts
       ├── consts.ts        ├── consts.ts          ├── consts.ts
       └── utils.ts         └── utils.ts           └── utils.ts

  @sittir/core ─── render(), validate(), readNode(), edit(), CST
  @sittir/types ── AnyNodeData, ConfigOf<T>, TreeNodeOf<T>, ByteRange, Edit
```

### Compiler Pipeline

| Phase | Input | Output | Purpose |
|-------|-------|--------|---------|
| **Evaluate** | `grammar.json` + `overrides.ts` | Raw grammar with resolved rules | Parse grammar, apply DSL transforms, collect roles |
| **Link** | Raw grammar + `node-types.json` | Linked `NodeMap` with field specs | Resolve symbols, classify kinds, detect polymorphs |
| **Optimize** | Linked NodeMap | Optimized NodeMap | Merge variants, collapse repeated shapes |
| **Assemble** | Optimized NodeMap | Assembly with render templates | Walk rules → YAML templates with `$FIELD` placeholders, `joinBy` separators |
| **Emit** | Assembly | Generated `.ts` + `.yaml` files | Produce types, factories, from, wrap, rules, consts |

### Data Flow

```
Factory input (Config, camelCase) ──▶ Factory output (NodeData, raw fields)
From input (strings, numbers) ──────▶ Factory (via resolution) ──▶ NodeData
readNode input (SgNode/TreeNode) ───▶ NodeData (direct field mapping)
Render input (AnyNodeData) ─────────▶ Source text (template expansion)
```

## Override DSL

Grammar maintainers author `packages/<lang>/overrides.ts` to patch field labels and declare structural roles:

```ts
// packages/python/overrides.ts
import base from 'tree-sitter-python/grammar.js'
import { transform, role, enrich, field } from '../codegen/src/dsl/index.ts'

export default grammar(enrich(base), {
  name: 'python',
  rules: {
    _indent: ($) => role($._indent, 'indent'),
    _dedent: ($) => role($._dedent, 'dedent'),

    conditional_expression: ($, original) => transform(original, {
      0: field('body'),
      2: field('condition'),
      4: field('alternative'),
    }),
  },
})
```

## Development

```bash
pnpm install                 # install dependencies
pnpm test                    # run all tests (1,121 passing)
pnpm -r run type-check       # type-check all packages

# Generate a language package
npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src
npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src
npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src
```

## Planned Work

- **Override-compiled parser** (spec 007) — compile override grammars to WASM parsers so parse trees carry all field labels natively, eliminating runtime field-promotion heuristics
- **Nested-alias polymorphs** — express polymorphic rules as nested aliases via `transform()`, enabling parse-tree-level variant discrimination
- **Link cleanup** — delete `inferFieldNames` mutation and `promotePolymorph` from Link once the override-compiled parser carries all field information

## License

MIT
