# sittir

Generate typed factory functions and render templates from [tree-sitter](https://tree-sitter.github.io/) grammars.

> **Alpha software:** sittir is usable for experimentation and internal codemod workflows, but the public API is still changing. Generated package shapes, render fidelity, native backend behavior, and grammar override conventions may shift between minor releases. Pin versions, expect rough edges, and review generated edits before applying them broadly.

Given any tree-sitter grammar, sittir generates:

- **Typed factories** — one per node kind, producing `NodeData` plain objects with fluent getters/setters
- **Jinja render templates** — one `.jinja` template per renderable kind, with separator metadata and polymorph variants
- **`.from()` resolution** — ergonomic input with string/number/object coercion, fully tree-shakeable
- **`readNode()` round-trip** — reads tree-sitter parse trees into `NodeData` for codemod editing
- **Const enums + navigation types** — `SyntaxKind`, operator/keyword maps, supertype unions
- **Generated tests** — per-kind factory + render + round-trip validation

## Key Features

- **Grammar-agnostic pipeline** — works with any tree-sitter grammar without modification. All language-specific knowledge flows through override configuration.
- **Five-phase compiler** — Evaluate → Link → Optimize → Assemble → Emit. Each phase has a single responsibility and produces a well-defined intermediate representation.
- **Override DSL** — `transform()`, `enrich()`, `role()` primitives let grammar maintainers patch field labels, add mechanical promotions, and declare structural roles without rewriting rules.
- **Small runtime surface** — generated packages depend on `@sittir/core` and `@sittir/types`, with optional native render packages when installed.
- **Deterministic output** — same grammar version produces byte-identical generated code. No timestamps, random identifiers, or order-dependent iteration.

## Packages

| Package                                     | Description                                                                          |
| ------------------------------------------- | ------------------------------------------------------------------------------------ |
| [`@sittir/core`](packages/core)             | Grammar-driven render engine, validation, CST, Edit creation                         |
| [`@sittir/types`](packages/types)           | Pure TypeScript types (zero runtime) — `AnyNodeData`, `ConfigOf<T>`, `TreeNodeOf<T>` |
| [`@sittir/codegen`](packages/codegen)       | Five-phase compiler: reads grammar.json + node-types.json, emits everything          |
| [`@sittir/rust`](packages/rust)             | 210 generated Rust node kinds                                                        |
| [`@sittir/typescript`](packages/typescript) | 269 generated TypeScript node kinds                                                  |
| [`@sittir/python`](packages/python)         | 176 generated Python node kinds                                                      |

## Quick Start

### Factory API

```ts
import { ir } from '@sittir/rust';

const node = ir.functionItem({
	name: ir.identifier('main'), // leaf factory takes text directly
	parameters: ir.parameters(), // variadic child container
	body: ir.block({ children: [] })
});

console.log(node.$type); // "function_item"
console.log(node.name().$text); // "main" (no arg = getter)
console.log(node.render()); // "fn main () {  }"

const renamed = node.name(ir.identifier('run')); // with arg = immutable setter
console.log(renamed.name().$text); // "run"
```

### `.from()` API

`.from()` accepts looser inputs and resolves them into the same `NodeData` shape. Strings become the expected leaf nodes when the grammar gives sittir enough type information.

```ts
import { ir } from '@sittir/typescript';

const fn = ir.functionDeclaration.from({
	name: 'greet', // string → identifier leaf node
	parameters: ir.formalParameters.from(),
	body: ir.statementBlock.from({
		statements: [
			ir.statement.return_.from({
				children: [
					ir.call.call.from({
						function: 'formatGreeting',
						arguments: ir.arguments.from('name')
					})
				]
			})
		]
	})
});

console.log(fn.render().trim());
// function greet () { return formatGreeting (name)  }
```

Grouped namespaces expose the same factories in a grammar-aware shape:

```ts
import { expression, ir } from '@sittir/rust';

const call = ir.expression.call.from({
	function: 'println',
	arguments: ir.arguments.from('value')
});

const alsoCall = expression.call.from({
	function: 'dbg',
	arguments: ir.arguments.from('value')
});
```

### Codemod with ast-grep

Find nodes with ast-grep, read into typed NodeData, modify with fluent setters, emit a text edit:

```ts
import { parse, Lang } from '@ast-grep/napi';
import { ir, readTreeNode } from '@sittir/rust';

// 1. Find all function items using ast-grep
const root = parse(Lang.Rust, source).root();
const matches = root.findAll({ rule: { kind: 'function_item' } });

for (const match of matches) {
	// 2. Read the parse tree node into typed NodeData
	const fn = readTreeNode(match) as ReturnType<typeof ir.functionItem>;

	// 3. Modify — fluent setter returns a new node (immutable)
	const updated = fn
		.visibilityModifier(ir.visibilityModifier({ children: [] }))
		.body(fn.body());

	// 4. replace() renders through the active package backend and pairs
	// the result with the target's byte range.
	const edit = updated.replace(match);
	// edit = { startPos, endPos, insertedText }
}
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
       ├── templates/*.jinja ├── templates/*.jinja ├── templates/*.jinja
       ├── ir.ts            ├── ir.ts              ├── ir.ts
       ├── consts.ts        ├── consts.ts          ├── consts.ts
       └── utils.ts         └── utils.ts           └── utils.ts

  @sittir/core ─── render(), validate(), readNode(), edit(), CST
  @sittir/types ── AnyNodeData, ConfigOf<T>, TreeNodeOf<T>, ByteRange, Edit
```

### Compiler Pipeline

| Phase        | Input                           | Output                            | Purpose                                                              |
| ------------ | ------------------------------- | --------------------------------- | -------------------------------------------------------------------- |
| **Evaluate** | `grammar.json` + `overrides.ts` | Raw grammar with resolved rules   | Parse grammar, apply DSL transforms, collect roles                   |
| **Link**     | Raw grammar + `node-types.json` | Linked `NodeMap` with field specs | Resolve symbols, classify kinds, detect polymorphs                   |
| **Optimize** | Linked NodeMap                  | Optimized NodeMap                 | Merge variants, collapse repeated shapes                             |
| **Assemble** | Optimized NodeMap               | Assembly with render templates    | Walk rules → Jinja templates with field substitutions and separators |
| **Emit**     | Assembly                        | Generated `.ts` + `.jinja` files  | Produce types, factories, from, wrap, templates, consts              |

### Data Flow

```
Factory input (Config, camelCase) ──▶ Factory output (NodeData + fluent getters/setters)
From input (strings, numbers) ──────▶ Factory (via resolution) ──▶ NodeData
SgNode/TreeNode ──▶ readNode() ──▶ NodeData ──▶ readTreeNode() ──▶ NodeData + routing + lazy getters
NodeData + target ──▶ node.replace(target) / toEdit(...) ──▶ Edit { startPos, endPos, insertedText }
Render input (AnyNodeData) ─────────▶ Source text (Jinja template expansion)
```

- `readNode()` (core) maps parse tree fields to raw `NodeData`.
- `readTreeNode()` (generated, per-grammar) adds override routing and lazy getters — the client entry point.
- `node.replace(target)` renders the replacement through the generated package backend and pairs it with the target's byte range — one call to go from NodeData to a text edit.

## Override DSL

Grammar maintainers author `packages/<lang>/overrides.ts` to patch field labels and declare structural roles:

```ts
// packages/python/overrides.ts
import base from 'tree-sitter-python/grammar.js';
import { transform, role, enrich, field } from '../codegen/src/dsl/index.ts';

export default grammar(enrich(base), {
	name: 'python',
	rules: {
		_indent: ($) => role($._indent, 'indent'),
		_dedent: ($) => role($._dedent, 'dedent'),

		conditional_expression: ($, original) =>
			transform(original, {
				0: field('body'),
				2: field('condition'),
				4: field('alternative')
			})
	}
});
```

## Development

```bash
pnpm install                 # install dependencies
pnpm test                    # run all tests
pnpm -r run type-check       # type-check all packages

# Generate a language package
npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src
npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src
npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src
```

## Native backend

The `@sittir/{rust,typescript,python}` packages ship with a native
Rust render engine (spec 012). When the platform-specific
`@sittir/<grammar>-native` package is installed and its template
bundle hash matches the JS-side bundle, the public APIs (`render`,
`readNode`, `applyEdits`) transparently delegate to the Rust engine.
Otherwise they fall back silently to the TypeScript engine — every
public API works on every platform regardless of native availability.

Authored templates remain canonical under `packages/{lang}/templates/`.
The checked-in native Askama crates are generated companions under
`rust/crates/sittir-render-{lang}/`, refreshed by the same
`--all` codegen workflow as the TypeScript package outputs.

### Selecting a backend at runtime

`getActiveBackend()` reports which engine the package resolved on
first import. The result is cached per process — call it any time
after the first `import` of the package.

```ts
import { getActiveBackend } from '@sittir/rust';

console.log(getActiveBackend());
// { name: 'native', hashMatch: true, native: ... }
// or
// { name: 'js', reason: 'native package not installed', hashMatch: false }
```

### Environment variables

| Variable                 | Effect                                                                                          |
| ------------------------ | ----------------------------------------------------------------------------------------------- |
| `SITTIR_BACKEND=native`  | Force the native backend; throw if it can't load. Useful for CI parity diffing.                 |
| `SITTIR_BACKEND=js`      | Skip the native load entirely; always use the JS engine. Useful for capturing reference output. |
| `SITTIR_BACKEND_DEBUG=1` | Emit a single `stderr` line per package indicating which backend resolved and why.              |

### Silent-fallback semantics

The TS layer never throws when the native backend is unavailable —
it only logs (when `SITTIR_BACKEND_DEBUG=1`) and falls through to
the TS engine. The fallback fires on:

- the platform-specific `@sittir/<grammar>-native` package not being
  installed,
- the bundled native binary failing to load (linking error,
  unsupported architecture),
- the native engine's baked template-bundle hash not matching the
  JS-side `TEMPLATE_BUNDLE_HASH` (codegen drift).

For the contracts and code paths see
[`specs/012-rust-core-port/quickstart.md`](specs/012-rust-core-port/quickstart.md).

## Planned Work

- **Override-compiled parser** (spec 007) — compile override grammars to WASM parsers so parse trees carry all field labels natively, eliminating runtime field-promotion heuristics
- **Nested-alias polymorphs** — express polymorphic rules as nested aliases via `transform()`, enabling parse-tree-level variant discrimination
- **Link cleanup** — delete `inferFieldNames` mutation and `promotePolymorph` from Link once the override-compiled parser carries all field information

## License

MIT
