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

- **NodeData** — plain objects, not ES classes. Branches: `{ $type, $source, $named, $fields }`. Leaves: `{ $type, $source, $named, $text }`. Fields stored under **raw** (snake_case) names inside `$fields`. `$`-prefix on metadata (spec 008 US7) eliminates collisions with user-facing field names like `type` (python's `type_alias_statement`).
- **`$source` provenance** — every NodeData carries `$source: 'ts' | 'sg' | 'factory'` at construction. `readTreeNode` sets `'ts'`; factories set `'factory'`. `.from()` dispatch can branch on it instead of structural probing.
- **Concrete interfaces** — `interface FunctionItem { $type: 'function_item'; $fields: { ... }; $children?: [...] }` — the source of truth for each node's shape. Config/Tree/FromInput derived via type transformations. Consumer bags (Config, Loose) still use unprefixed `children` for the child-slot key.
- **Tree-sitter nodes keep unprefixed API** — `AnyTreeNode`, `TreeNodeOf<T>`, `readTreeNode` output all use `.type` / `.text()` / `.children()` (tree-sitter convention). Only the data / factory surface uses `$`-prefix.
- **S-expression templates** — tree-sitter query syntax for render rules. Field references use raw names.
- **Grammar-aligned terminology** — kind, field, named, anonymous, supertype (tree-sitter/ast-grep terms)
- **Supertype unions** — `_expression` → `Expression`, `ExpressionTree`
- **Factories close over rules** — `node.render()`, `node.toEdit()`, `node.replace()` need no extra args
- **Render guards** — branch nodes without `$fields` throw; leaf nodes without `$text` throw

### Public API surfaces (post-008)

Three ways to reach the same per-kind type family — all resolve identically:

```ts
import type { FunctionItem, ConfigFor, NamespaceMap } from '@sittir/rust';

FunctionItem.Config                            // namespace sugar (preferred)
ConfigFor<'function_item'>                     // generic (kind-parametric code)
NamespaceMap['function_item']['Config']        // direct map (meta-utilities)
```

Guards — narrow through kind × shape (spec 008 US2):

```ts
import { is, isTree, isNode, assert } from '@sittir/rust';

if (is.functionItem(v) && isNode(v)) {         // kind + data-shape
    v.$fields.name;                             // typed
}
if (is.expression(v) && isTree(v)) {           // supertype + tree-shape
    v.field('name');                            // tree-sitter typed field
}
assert.functionItem(v);                        // throws TypeError on mismatch
```

IR namespace — flat + grouped (spec 008 US5), both tree-shakeable:

```ts
import { ir, expression } from '@sittir/rust';

ir.binary(config);                             // flat camelCase (supertype-stripped short name)
ir.expression.binary(config);                  // grouped (attached to ir)
expression.binary(config);                     // standalone (tree-shakeable)
```

### Data Flow & API Tiers

Seven surfaces, one common shape (`NodeData`):

| Surface | Shape | Notes |
|---------|-------|-------|
| Factory input | `Config` (camelCase, named child slots) | Developer-facing ergonomic API |
| Factory output | `NodeData` + fluent getters/setters + methods | Raw `$`-prefix metadata, `$fields` snake_case, fluent methods camelCase |
| From input | `FromInput` (loose: strings, numbers, objects) | Adds resolution on top of factory |
| From output | Same as factory output | Calls factory internally |
| readNode input | `SgNode` / `TreeNode` (raw field names) | **ast-grep / tree-sitter owns this shape** |
| readNode output | `NodeData` with `$source: 'ts'` | Direct mapping, no translation |
| Render input | `AnyNodeData` — reads `node.$fields[rawName]` | Zero-cost from any producer |

Design targets per tier:

- **Factory** — zero-cost translation + compile-time constraints + client-side validation of text inputs. Config uses camelCase keys; factory maps to raw `$fields` internally and stamps `$source: 'factory'`. Fluent getters/setters provide camelCase access (setters named `value` / `values`): no-arg = getter, with-arg = setter (returns new node).
- **FromInput** — adds resolution (string → leaf, object → branch inference, supertype expansion) on top of factory. Exposed getters/setters same as factory.
- **Wrap / readNode** — strips all protections and translations. `readTreeNode(target)` is the typed public entry point (dispatches to per-kind `wrapXxx()` via `_wrapTable[data.$type]`); `readNode(tree, id?)` is the grammar-agnostic raw reader that emits `$source: 'ts'`. Override field promotion heuristics are inlined.
- **Render** — reads `node.$fields[rawName]` and `node.$children`. Zero-cost consumption from any producer.

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

### Rule type discrimination

The compiler pipeline's `Rule` union (`compiler/rule.ts`) is a discriminated
union keyed by `type`. Prefer these patterns, in this order:

1. **Switch on `rule.type`** — canonical narrowing. TS exhaustiveness
   catches missing variants when a new `Rule` type is added. Use
   `default: assertNever(rule)` to lock it in. Most compiler passes use
   this form.

2. **Per-variant type guards** (`isSeq`, `isChoice`, `isField`, `isSymbol`,
   ... exported from `compiler/rule.ts`) for `.filter()`, `.find()`,
   `.some()`, `.every()`, and standalone predicates. They narrow through
   the callback — `.find(isField)` returns `FieldRule | undefined` with
   no `as FieldRule` cast needed.

3. **Inline `rule.type === 'seq'` checks** — fine inside a switch arm's
   body or for one-off compound predicates that don't fit a guard. TS
   discriminated-union narrowing already makes these type-safe; no enum
   or const-string layer is needed (and doesn't catch any additional
   errors over the union type itself).

**Do not introduce:** enum / const mappings for type strings. The `Rule`
union IS the single source of truth; misspellings are type errors.

**DSL layer exception:** `packages/codegen/src/dsl/*` also accepts
tree-sitter-CLI-shaped rules with uppercase discriminants (`'SEQ'`,
`'CHOICE'`, ...). Dual-case predicates (`isSeqType`, `isChoiceType`, ...,
plus `typeEq(t, lower)`) live in `dsl/runtime-shapes.ts` and must be used
instead of inline `t === 'seq' || t === 'SEQ'` ladders. The case
difference is a cross-pipeline-leak signal — don't normalize it away.

## Speckit Workflow

Specs, plans, tasks under `specs/NNN-feature-name/`. Branch convention: `NNN-short-name`.

<!-- MANUAL ADDITIONS START -->

## Work conventions

The first rule (DRY — one source, one derivation) is the central
correctness principle of the codegen pipeline — read it first. The
three after it (fix-the-generator / no-type-escape-hatches /
wave-decomposition) are auto-checked by `.claude/hooks/quality-gate.sh`
(Stop hook).

### DRY — one source, one derivation (read this first)

This is the central correctness principle of the codegen pipeline.
Every anti-pattern we've hit reduces to violating it. It supersedes
every other rule below.

> **Every fact about the program has exactly one source, and exactly
> one definition of how to extract it.**

Both clauses matter:

- **One source.** A slot's content lives in ONE field, not split across
  parallel arrays (`contentTypes: string[]` + `literalValues: string[]`,
  for example). A kind's parameterless-ness lives in ONE property
  (`isParameterless`), not re-computed per emitter. A rule reference
  lives as ONE object ref (`AssembledNode`), not as a name-string that
  consumers have to re-resolve via `kindMap.get(...)`. Two storage sites
  **drift**.

- **One derivation.** If you need facts from a Rule tree, there is ONE
  walk that produces them — not three separate walkers each keeping
  different subsets (`deriveContentTypes` / `deriveLiteralValues` /
  `deriveAliasSources` was the poster child for this failure mode). Two
  derivations **disagree**.

Every variant of the anti-pattern we've caught is one of these:

- **Ad-hoc tree walkers that collect partial projections** — each walker
  is an alternative derivation of the same underlying facts. Silently
  drops whatever it doesn't care about. Example:
  `deriveContentTypes(choice('const', $.mutable_specifier))` returns
  `['mutable_specifier']` — dropping the literal — while
  `deriveLiteralValues` on the same tree drops the symbol. Both views
  are incomplete; downstream code that combines them has to trust they
  agree. They don't.

- **String-name references instead of object references.** Storing
  `contentTypes: string[]` is storing the fact twice: once as a lookup
  token here, once as the actual assembled node there. Every call site
  that does `kindMap.get(name)?` is a potential drift point.

- **Silent `default:` branches.** `switch (rule.type) { ... default: return [] }`
  declares "I don't cover every variant, and the fallback is to
  contribute nothing." Adding a new Rule variant doesn't fail to
  compile; it silently does the wrong thing. Every switch on a
  discriminated union ends in `assertNever(x)` — full stop.

- **Flattened flags that compress multi-valued facts.** `multiple: true`
  on a slot whose choice contains mixed single + repeat positions is a
  lossy collapse. The flag can't tell you WHICH position is repeated.
  Anyone who needs the full fact re-derives it from the rule — a
  second derivation, disagreeing with the first. The fact belongs on
  the value, not the slot.

**Practical rule for any new code:**

> If you find yourself (a) storing a fact in more than one place, or
> (b) writing a walker that extracts same-shaped information a
> different walker already produces, **stop**. Consolidate first.
> Storage duplication drifts; derivation duplication disagrees —
> both produce silent wrong answers.

When in doubt: put the projection as a method on the class that owns
the data, not as an external walker. Bake the facts into the assembled
representation at construction time so no downstream pass needs to
re-walk. Use object references over names. End every discriminated-
union switch with `assertNever(x)`.

### Fix the generator, not the generated output

(A specific application of DRY — the generated files are a derivation
of the source; hand-editing creates a second source that drifts.)

Sittir generates a lot of TypeScript + YAML per grammar package. Never
hand-edit generated output to work around a problem:

- `packages/{rust,python,typescript}/src/*` — factories, types,
  node-model, etc.
- `packages/{rust,python,typescript}/templates.yaml` — render templates.
- `packages/{rust,python,typescript}/.sittir/grammar.js` — transpiled
  overrides bridge.
- `packages/{rust,python,typescript}/factory-map.json5` +
  `overrides.suggested.ts` — codegen outputs.

If one of these files is wrong, the fix lives in `packages/codegen/src/`
(walker, emitter, link, assemble, evaluate — per the pipeline above) or
in the relevant `packages/<lang>/overrides.ts`. Regenerate via the
commands in "Commands" above. MEMORY.md's `feedback_no_hand_edit_yaml`
captures the long-form rationale.

### No type-escape hatches as workarounds

Do NOT silence type errors with `as any`, `as unknown`, `@ts-ignore`,
`@ts-nocheck`, or `eslint-disable` to make a diff compile. If the types
disagree with your code, the fix is either:

1. Widen/narrow the types honestly (add a discriminated variant, thread
   a generic, tighten a guard).
2. Change the code to match the existing type.
3. Identify the real shape mismatch and fix it at the boundary that
   introduced it.

Allowed exceptions:
- `as const` — legitimate narrowing, not a cast.
- `@ts-nocheck` on `overrides.ts` files — the tree-sitter grammar.js
  shape is untyped by design; we bypass intentionally there.
- `as unknown as Foo` inside `dsl/` cross-runtime shape bridging where
  `runtime-shapes.ts` guards narrow dual-case shapes. Annotate why in a
  one-line comment above.

### Wave-style decomposition before commits

When you've modified a TypeScript file and a function body contains a
3+ line inline comment block explaining "what the next chunk does",
promote that chunk to a named private helper with a JSDoc docstring
using the standard tags (`@param`, `@returns`, `@throws`, `@remarks`,
`@see`). Goal: linear, scannable function bodies — explanations live
next to the code they describe, not above it.

Reference commits: `60a0f77 codegen: wave 2 comment/decomposition
cleanup`, `f72f540 codegen: wave 3 comment/decomposition cleanup`, and
the wave 4 ADR-0009 follow-up. Match that style. Don't merge helpers
that the directive would split — granularity per comment block.

<!-- MANUAL ADDITIONS END -->

## Active Technologies
- TypeScript (ESM, `.ts` extensions in imports), TypeScript 6.0.2 + `@sittir/core`, `@sittir/types`, `@sittir/codegen`; tree-sitter grammars (grammar.json + node-types.json) (004-yaml-render-templates)
- File system (YAML templates at `packages/{lang}/templates.yaml`, read at codegen time) (004-yaml-render-templates)
- TypeScript 6.0.2 (ESM, `.ts` extensions in imports) + None at runtime (zero-dep). Dev: vitest, oxlint, oxfmt, tsgo (005-five-phase-compiler)
- File system (grammar.js input, overrides.ts, generated .ts/.yaml output) (005-five-phase-compiler)
- TypeScript (ESM, `.ts` extensions in imports), TypeScript 6.0.2 + `@sittir/core`, `@sittir/types`, `@sittir/codegen`; tree-sitter grammar packages (`tree-sitter-rust`, `tree-sitter-typescript`, `tree-sitter-python`); tree-sitter CLI for CI validation (006-override-dsl-enrich)
- File system — `packages/<lang>/overrides.ts` (hand-authored source), `packages/<lang>/.sittir/grammar.js` (transpiled output, gitignored), generated `.ts`/`.yaml` artifacts (006-override-dsl-enrich)
- TypeScript (ESM, `.ts` extensions in imports), TypeScript 6.0.2 + tree-sitter-cli ^0.26.7, web-tree-sitter ^0.26.7, esbuild (transpile bridge from spec 006), Emscripten (emsdk, for WASM compilation) (007-override-compiled-parser)
- File system — `.sittir/` directory per grammar for transpiled grammar.js, compiled parser WASM, parser.c, node-types.json (007-override-compiled-parser)
- TypeScript 6.0.2 (ESM, `.ts` extensions in imports) + `@sittir/core`, `@sittir/types`, `@sittir/codegen` (workspace packages — no new deps) (008-factory-ergonomic-cleanup)
- File system — per-grammar generated output under `packages/{rust,typescript,python}/src/` (008-factory-ergonomic-cleanup)

## Recent Changes
- 004-yaml-render-templates: Added TypeScript (ESM, `.ts` extensions in imports), TypeScript 6.0.2 + `@sittir/core`, `@sittir/types`, `@sittir/codegen`; tree-sitter grammars (grammar.json + node-types.json)
