# sittir

Generate typed factory functions and S-expression render templates from tree-sitter grammars.

## Architecture

Three-layer architecture:

- **`@sittir/core`** — Grammar-driven render engine, validation, CST, Edit creation. S-expression templates parsed once and cached. `render(node, rules)` uses regex replace. Input validation at factory creation time (O(1)).
- **`@sittir/types`** — Pure TypeScript type projections (zero runtime). `NodeType<G,K>`, grammar-derived field types, re-exports core types.
- **`@sittir/codegen`** — Reads grammar.json + node-types.json, emits: S-expression render templates, unified factory functions, ir namespace, const enums, navigation types, tests.

Generated packages (`@sittir/rust`, `@sittir/typescript`, `@sittir/python`) contain:
- `rules.ts` — S-expression render templates (tree-sitter query syntax)
- `joinby.ts` — separator map for list children (ast-grep `joinBy` convention)
- `factories.ts` — unified factories (declarative + fluent + mixed modes)
- `ir.ts` — developer-facing namespace with short names
- `types.ts` — `const enum SyntaxKind`, construction types, navigation types (`*Node` suffix)
- `consts.ts` — discoverable arrays/maps of kinds, keywords, operators

## Key Design Decisions

- **NodeData<K>** — generic plain objects, not ES classes. `{ kind, fields, text? }`
- **S-expression templates** — tree-sitter query syntax for render rules
- **Three API modes** — declarative (config), fluent (chaining), mixed (positional + config)
- **Input validation** — O(1) at factory creation: reserved keyword rejection + pattern matching. No render-time validation.
- **Factories close over rules** — `node.render()`, `node.toEdit()`, `node.replace()` need no extra args
- **`replaceField()`** — type-safe field replacement using navigation types and `KindOf<T>` inference
- **Grammar-aligned terminology** — kind, field, named, anonymous, supertype (tree-sitter/ast-grep terms)

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
