# Architecture and Data Model

Use this file when the task touches generated packages, runtime data shapes, or public API design.

## Package layers

- `@sittir/types` — zero-runtime TypeScript types such as `AnyNodeData`, `ConfigOf<T>`, `TreeNodeOf<T>`, `FromInputOf<T>`, `ByteRange`, `Edit`, and `RenderContext`.
- `@sittir/common` — backend-neutral runtime: `readNode`, `applyEdits`, the native boundary, and `createNativeEngine` behind the shared engine interface.
- `@sittir/codegen` — the compiler (evaluate → link → normalize → simplify → assemble → emit) and emitters producing the grammar-specific packages.
- `@sittir/cli` — the unified `sittir` binary (`gen`, `tool *`, `validate *`).
- `@sittir/tools` — validator + diagnostic implementations the CLI dispatches to.
- `@sittir/legacy-core` — not a production engine (native is the source of truth; the name signals this); retained only as diagnostic/validator tooling (lower-level Nunjucks renderer, shared engine option types).

## Generated grammar packages

Each generated package (`@sittir/rust`, `@sittir/typescript`, `@sittir/python`) exposes:

- `grammar.ts` — grammar type literal for type projections
- `types.ts` — concrete interfaces, `TSKindId`, config/tree/from projections, unions
- `factories/raw.ts` — plain strict builders
- `factories/coerce.ts` — `.from()` coercers and per-field resolvers
- `factories/bundle.ts` — `{ strict, coerce }` pair per kind (`bundle()`)
- `factories/overlays/{refines,polymorphs,supertypes}.ts` — static wiring: refine forms, sub-factories (one method per builder, applied to both flavors), grouped namespaces
- `factories/index.ts` — `hoist()`: the callable consumer surface (bare call = coerce, `.strict` reachable, recursive)
- `wrap.ts` — tree node → typed node hydration
- `is.ts` — type guards (`is.*`, `isNode`, `isTree`, `assert.*`)
- `utils.ts` — per-grammar client helpers
- `ir.ts` — developer-facing short-name namespace
- `consts.ts` — discoverable arrays/maps of kinds, keywords, operators
- `engine.ts` / `backend.ts` / `boundary.ts` / `hash.ts` — native-only `createEngine()`, backend selection, baked template-bundle hash
- `node-model.json5` — debug snapshot of the assembled model
- `index.ts` — barrel exports
- `../templates/*.jinja` — one render template per renderable kind (package root, beside `src/`)

## Current NodeData shape

- NodeData is plain data, not an ES class.
- Branch nodes use `{ $type, $source, $named, _<field>..., $children? }`.
- Leaf nodes use `{ $type, $source, $named, $text }`.
- Field storage is top-level `_<raw_name>` data, not `$fields`.
- `$source` is numeric provenance: `0 = ts`, `1 = sg`, `2 = factory`.
- Tree-sitter-facing tree nodes keep the unprefixed API (`type`, `text()`, `children()`, `field()`); only the data/factory surface uses `$` metadata and `_` field storage.

## Public API surfaces

Three equivalent ways to reach a per-kind family:

```ts
import type { FunctionItem, ConfigFor, NamespaceMap } from '@sittir/rust';

FunctionItem.Config;
ConfigFor<'function_item'>;
NamespaceMap['function_item']['Config'];
```

Guarding and narrowing:

```ts
import { is, isNode, isTree, assert } from '@sittir/rust';

if (is.functionItem(v) && isNode(v)) v.name();
if (is.expression(v) && isTree(v)) v.field('name');
assert.functionItem(v);
```

IR namespace access stays tree-shakeable:

```ts
import { ir, expression } from '@sittir/rust';

ir.binary(config);
ir.expression.binary(config);
expression.binary(config);
```

## Data-flow tiers

- **Factory input** — `Config` uses camelCase ergonomic keys.
- **Factory output** — NodeData with pure getters, `$with` setters, and `withMethods<T>` helpers.
- **From input/output** — same shape as factory output, with loose resolution layered on top.
- **readNode / readTreeNode** — raw tree input mapped into NodeData with no ergonomic translation.
- **Render input** — runtime reads `_raw_name` fields and `$children` directly.

## Design decisions to preserve

- Prefer one shared shape across factory, wrap, from, and render flows.
- Generated clients close over the grammar-specific render/to-edit helpers.
- Supertype unions and namespace aliases are part of the public surface, not just internal codegen details.
