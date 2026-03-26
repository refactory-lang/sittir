# sittir

Generate typed factory functions and S-expression render templates from tree-sitter grammars.

## Architecture

Three-layer architecture:

- **`@sittir/core`** — Grammar-driven render engine, validation, CST, Edit creation. S-expression templates parsed once and cached. `render(node, rules)` uses regex replace. No `.from()` resolution — generated packages inline all resolution logic.
- **`@sittir/types`** — Pure TypeScript type projections (zero runtime). `NodeData<G,K>`, `NodeFields<G,K>`, `TreeNode<G,K>` grammar-derived types. `AnyNodeData` (loose runtime type, `fields` optional — leaves have `text`, not `fields`).
- **`@sittir/codegen`** — Reads grammar.json + node-types.json, emits: S-expression render templates, unified factory functions, ir namespace, const enums, navigation types, assign functions, `.from()` resolution, tests.

Generated packages (`@sittir/rust`, `@sittir/typescript`, `@sittir/python`) contain:
- `grammar.ts` — grammar type literal for type projections
- `types.ts` — `const enum SyntaxKind`, grammar-bound aliases (`NodeData<K>`, `NodeFields<K>`, `TreeNode<K>`), `interface extends` types, supertype unions (node, fields, tree, FromInput variants)
- `rules.ts` — S-expression render templates (tree-sitter query syntax)
- `joinby.ts` — separator map for list children (ast-grep `joinBy` convention)
- `factories.ts` — unified factories (declarative + fluent + mixed modes), Config/FromInput/Node/FromNode types
- `from.ts` — `.from()` ergonomic resolution with inlined per-field logic (tree-shakeable)
- `assign.ts` — `assignByKind` dispatch + per-kind assign functions for tree node hydration + `edit()` entry point
- `utils.ts` — shared client-side utilities (`isNodeData`, `_inferBranch`, `_BRANCH_FIELDS`)
- `ir.ts` — developer-facing namespace with short names
- `consts.ts` — discoverable arrays/maps of kinds, keywords, operators
- `index.ts` — barrel re-exports

## Key Design Decisions

- **NodeData<G, K>** — grammar-derived plain objects, not ES classes. `{ type, fields?, text? }`. Two params always (grammar + kind). Leaves have `text` only, branches have `fields`.
- **`interface extends` pattern** — `interface FunctionItem extends NodeData<'function_item'> {}` for compiler caching / IDE performance
- **S-expression templates** — tree-sitter query syntax for render rules
- **Three API tiers** — Regular (strict `NodeData` only), `.from()` (ergonomic: strings/numbers/objects), `.assign()` (tree hydration from `TreeNode`)
- **Three factory modes** — declarative (config), fluent (chaining), mixed (positional + config)
- **Input validation** — O(1) at factory creation: reserved keyword rejection + pattern matching. No render-time validation.
- **Factories close over rules** — `node.render()`, `node.toEdit()`, `node.replace()` need no extra args
- **`replaceField()`** — type-safe field replacement using navigation types and `KindOf<T>` inference
- **Grammar-aligned terminology** — kind, field, named, anonymous, supertype (tree-sitter/ast-grep terms)
- **Supertype unions** — `_expression` → `Expression`, `ExpressionFields`, `ExpressionTree`, `ExpressionFromInput`
- **`.from()` coercion** — required array fields default to `[]` when omitted; supertypes expanded to concrete subtypes
- **Render guards** — branch nodes without `fields` throw; leaf nodes without `text` throw. `isNodeData` rejects `{ fields: null }`
- **`edit()` return** — `Simplify<NodeData<K> & methods>` — K flows from `TreeNode<K>` input, flattened for IDE tooltips

## Commands

```bash
pnpm test                    # run all tests
pnpm -r run type-check       # type-check all packages

# Generate grammar packages
npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src
npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src
npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src
```

## Code Style

- TypeScript ESM (`.ts` extensions in imports)
- pnpm workspaces
- Vitest for testing
- oxlint / oxfmt for linting / formatting
- tsgo for type checking

## Speckit Workflow

Specs, plans, tasks under `specs/NNN-feature-name/`. Branch convention: `NNN-short-name`.

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
