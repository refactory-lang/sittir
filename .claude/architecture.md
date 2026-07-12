# Architecture and Data Model

Use this file when the task touches generated packages, runtime data shapes, or public API design.

## Package layers

- `@sittir/legacy-core` — deprecated as a production engine (native is the source of truth; the package name signals this); retained as diagnostic/validator tooling. Grammar-driven render engine, validation, CST/edit creation, and runtime read helpers.
- `@sittir/types` — zero-runtime TypeScript types such as `AnyNodeData`, `ConfigOf<T>`, `TreeNodeOf<T>`, `FromInputOf<T>`, `ByteRange`, `Edit`, and `RenderContext`.
- `@sittir/codegen` — reads `grammar.json` + `node-types.json` and emits the grammar-specific packages.

## Generated grammar packages

Each generated package (`@sittir/rust`, `@sittir/typescript`, `@sittir/python`) exposes:

- `grammar.ts` — grammar type literal for type projections
- `types.ts` — concrete interfaces, `TSKindId`, config/tree/from projections, unions
- `rules.ts` — render rules
- `joinby.ts` — list separator metadata
- `factories.ts` — unified factories
- `from.ts` — `.from()` resolution layer
- `wrap.ts` — tree node → typed node hydration
- `utils.ts` — per-grammar client helpers
- `ir.ts` — developer-facing short-name namespace
- `consts.ts` — discoverable arrays/maps of kinds, keywords, operators
- `index.ts` — barrel exports

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
