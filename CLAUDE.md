# sittir

Generate typed factory functions and S-expression render templates from tree-sitter grammars.

## Architecture

Three-layer architecture:

- **`@sittir/core`** — Grammar-driven render engine, validation, CST, Edit creation. S-expression templates parsed once and cached. `render(node, rules)` uses regex replace. No `.from()` resolution — generated packages inline all resolution logic.
- **`@sittir/types`** — Pure TypeScript types (zero runtime). `AnyNodeData`, `ConfigOf<T>`, `TreeNodeOf<T>`, `FromInputOf<T>` transformation types. `ByteRange`, `Edit`, `RenderContext`.
- **`@sittir/codegen`** — Reads grammar.json + node-types.json, emits: YAML render templates, unified factory functions, ir namespace, const enums, navigation types, wrap/readNode functions, `.from()` resolution, tests.

Generated packages (`@sittir/rust`, `@sittir/typescript`, `@sittir/python`) contain:
- `grammar.ts` — grammar type literal for type projections
- `types.ts` — `const enum SyntaxKind`, concrete interfaces (source of truth), `ConfigOf`-derived configs, `TreeNode<K>` interfaces, supertype unions, grammar-bound aliases
- `rules.ts` — S-expression render templates (tree-sitter query syntax)
- `joinby.ts` — separator map for list children (ast-grep `joinBy` convention)
- `factories.ts` — unified factories: config input (camelCase) → NodeData output (raw fields) + fluent getters/setters + methods
- `from.ts` — `.from()` ergonomic resolution with inlined per-field logic (tree-shakeable)
- `wrap.ts` — tree node → NodeData hydration via `readNode()` entry point + per-kind wrap functions + `edit()` alias + override field promotion heuristics
- `utils.ts` — shared client-side utilities (`isNodeData`, `_inferBranch`, `_BRANCH_FIELDS`)
- `ir.ts` — developer-facing namespace with short names
- `consts.ts` — discoverable arrays/maps of kinds, keywords, operators
- `index.ts` — barrel re-exports

## Key Design Decisions

- **NodeData** — plain objects, not ES classes. Branches: `{ type, fields }`. Leaves: `{ type, text }`. Fields stored under **raw** (snake_case) names for zero-cost render pass-through.
- **Concrete interfaces** — `interface FunctionItem { type: 'function_item'; fields: { ... }; visibilityModifier?: ... }` — the source of truth for each node's shape. Config/Tree/FromInput derived via type transformations.
- **S-expression templates** — tree-sitter query syntax for render rules. Field references use raw names.
- **Grammar-aligned terminology** — kind, field, named, anonymous, supertype (tree-sitter/ast-grep terms)
- **Supertype unions** — `_expression` → `Expression`, `ExpressionTree`
- **Factories close over rules** — `node.render()`, `node.toEdit()`, `node.replace()` need no extra args
- **Render guards** — branch nodes without `fields` throw; leaf nodes without `text` throw

### Data Flow & API Tiers

Seven surfaces, one common shape (`NodeData`):

| Surface | Shape | Notes |
|---------|-------|-------|
| Factory input | `Config` (camelCase, named child slots) | Developer-facing ergonomic API |
| Factory output | `NodeData` + fluent getters/setters + methods | Raw storage, camelCase accessors |
| From input | `FromInput` (loose: strings, numbers, objects) | Adds resolution on top of factory |
| From output | Same as factory output | Calls factory internally |
| readNode input | `SgNode` / `TreeNode` (raw field names) | **ast-grep owns this shape** |
| readNode output | `NodeData` (raw) | Direct mapping, no translation |
| Render input | `AnyNodeData` — reads `node.fields[rawName]` | Zero-cost from any producer |

Design targets per tier:

- **Factory** — zero-cost translation + compile-time constraints + client-side validation of text inputs. Config uses camelCase keys; factory maps to raw `fields` internally. Fluent getters/setters provide camelCase access: no-arg = getter, with-arg = setter (returns new node).
- **FromInput** — adds resolution (string → leaf, object → branch inference, supertype expansion) on top of factory. Exposed getters/setters same as factory.
- **Wrap / readNode** — strips all protections and translations. `readNode(target)` is the typed public entry point; per-kind `wrapXxx()` functions recursively hydrate from TreeNode to `NodeData`. Override field promotion heuristics are inlined.
- **Render** — reads `node.fields[rawName]` and `node.fields['children']`. Zero-cost consumption from any producer.

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

## Active Technologies
- TypeScript (ESM, `.ts` extensions in imports), TypeScript 6.0.2 + `@sittir/core`, `@sittir/types`, `@sittir/codegen`; tree-sitter grammars (grammar.json + node-types.json) (004-yaml-render-templates)
- File system (YAML templates at `packages/{lang}/templates.yaml`, read at codegen time) (004-yaml-render-templates)
- TypeScript 6.0.2 (ESM, `.ts` extensions in imports) + None at runtime (zero-dep). Dev: vitest, oxlint, oxfmt, tsgo (005-five-phase-compiler)
- File system (grammar.js input, overrides.ts, generated .ts/.yaml output) (005-five-phase-compiler)
- TypeScript (ESM, `.ts` extensions in imports), TypeScript 6.0.2 + `@sittir/core`, `@sittir/types`, `@sittir/codegen`; tree-sitter grammar packages (`tree-sitter-rust`, `tree-sitter-typescript`, `tree-sitter-python`); tree-sitter CLI for CI validation (006-override-dsl-enrich)
- File system — `packages/<lang>/overrides.ts` (hand-authored source), `packages/<lang>/.sittir/grammar.js` (transpiled output, gitignored), generated `.ts`/`.yaml` artifacts (006-override-dsl-enrich)

## Recent Changes
- 004-yaml-render-templates: Added TypeScript (ESM, `.ts` extensions in imports), TypeScript 6.0.2 + `@sittir/core`, `@sittir/types`, `@sittir/codegen`; tree-sitter grammars (grammar.json + node-types.json)
