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
- `factories.ts` — unified factories: config input (camelCase) → NodeData output (`_<name>` storage + pure getters + `$with` setters + `$`-methods via `withMethods<T>`)
- `from.ts` — `.from()` ergonomic resolution with inlined per-field logic (tree-shakeable)
- `wrap.ts` — tree node → NodeData hydration via `readNode()` entry point + per-kind wrap functions + `edit()` alias + override field promotion heuristics
- `utils.ts` — shared client-side utilities (`isNodeData`, `_inferBranch`, `_BRANCH_FIELDS`)
- `ir.ts` — developer-facing namespace with short names
- `consts.ts` — discoverable arrays/maps of kinds, keywords, operators
- `index.ts` — barrel re-exports

## Key Design Decisions

- **NodeData** — plain objects, not ES classes. Branches: `{ $type, $source, $named, _<field>..., $children? }`. Leaves: `{ $type, $source, $named, $text }`. Fields stored as `_<name>` top-level keys (ADR-0018 de-hoisted storage). `$`-prefix on metadata eliminates collisions with user-facing field names.
- **`$source` provenance** — every NodeData carries `$source: 0 | 1 | 2` (0=ts, 1=sg, 2=factory) at construction. `readTreeNode` sets `0`; factories set `2`. `.from()` dispatch can branch on it instead of structural probing.
- **Concrete interfaces** — `interface FunctionItem { $type: TSKindId.FunctionItem; _name: Identifier; name(): Identifier; ... }` — the source of truth for each node's shape. Storage (`_name`) + getter method (`name()`) + `$with` setters. Config/Tree/FromInput derived via type transformations.
- **Tree-sitter nodes keep unprefixed API** — `AnyTreeNode`, `TreeNodeOf<T>`, `readTreeNode` output all use `.type` / `.text()` / `.children()` (tree-sitter convention). Only the data / factory surface uses `$`-prefix and `_`-storage.
- **Jinja templates** — per-rule `.jinja` files for render rules. Field references use raw names.
- **Grammar-aligned terminology** — kind, field, named, anonymous, supertype (tree-sitter/ast-grep terms)
- **Supertype unions** — `_expression` → `Expression`, `ExpressionTree`
- **Factory shape A** — closure-based storage locals, pure getter methods, `$with` setters via direct factory rebuild, `withMethods<T>` wrapper from per-grammar `utils.ts`. No `Object.defineProperty`, no `Record<string,unknown>` casts, no spread of shared-methods const.
- **Render guards** — branch nodes without `_<field>` storage throw; leaf nodes without `$text` throw

### Public API surfaces (post-008)

Three ways to reach the same per-kind type family — all resolve identically:

```ts
import type { FunctionItem, ConfigFor, NamespaceMap } from '@sittir/rust';

FunctionItem.Config; // namespace sugar (preferred)
ConfigFor<'function_item'>; // generic (kind-parametric code)
NamespaceMap['function_item']['Config']; // direct map (meta-utilities)
```

Guards — narrow through kind × shape (spec 008 US2):

```ts
import { is, isTree, isNode, assert } from '@sittir/rust';

if (is.functionItem(v) && isNode(v)) {
	// kind + data-shape
	v.name(); // typed getter
}
if (is.expression(v) && isTree(v)) {
	// supertype + tree-shape
	v.field('name'); // tree-sitter typed field
}
assert.functionItem(v); // throws TypeError on mismatch
```

IR namespace — flat + grouped (spec 008 US5), both tree-shakeable:

```ts
import { ir, expression } from '@sittir/rust';

ir.binary(config); // flat camelCase (supertype-stripped short name)
ir.expression.binary(config); // grouped (attached to ir)
expression.binary(config); // standalone (tree-shakeable)
```

### Data Flow & API Tiers

Seven surfaces, one common shape (`NodeData`):

| Surface         | Shape                                          | Notes                                                                   |
| --------------- | ---------------------------------------------- | ----------------------------------------------------------------------- |
| Factory input   | `Config` (camelCase, named child slots)        | Developer-facing ergonomic API                                          |
| Factory output  | `NodeData` + pure getters + `$with` setters + `$`-methods | `_<name>` storage, `name()` getter, `$with.name(v)` setter, `$render/$toEdit/$replace/$trivia` via `withMethods<T>` |
| From input      | `FromInput` (loose: strings, numbers, objects) | Adds resolution on top of factory                                       |
| From output     | Same as factory output                         | Calls factory internally                                                |
| readNode input  | `SgNode` / `TreeNode` (raw field names)        | **ast-grep / tree-sitter owns this shape**                              |
| readNode output | `NodeData` with `$source: 'ts'`                | Direct mapping, no translation                                          |
| Render input    | `AnyNodeData` — reads `node._<rawName>`         | Zero-cost from any producer                                             |

Design targets per tier:

- **Factory** — zero-cost translation + compile-time constraints + client-side validation of text inputs. Config uses camelCase keys; factory hoists to local `_<name>` consts and returns an inline literal with property shorthand. Pure getter methods (`name() { return _name; }`) for read access; `$with.name(v)` setters for immutable updates via direct factory rebuild. `withMethods<T>` adds `$render/$toEdit/$replace/$trivia`.
- **FromInput** — adds resolution (string → leaf, object → branch inference, supertype expansion) on top of factory. Exposed getters/setters same as factory.
- **Wrap / readNode** — strips all protections and translations. `readTreeNode(target)` is the typed public entry point (dispatches to per-kind `wrapXxx()` via `_wrapTable[data.$type]`); `readNode(tree, id?)` is the grammar-agnostic raw reader that emits `$source: 'ts'`. Override field promotion heuristics are inlined.
- **Render** — reads `node._<rawName>` and `node.$children`. Zero-cost consumption from any producer.

## Commands

```bash
pnpm test                    # run all tests
pnpm -r run type-check       # type-check all packages

# Generate grammar packages
npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src
npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src
npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src

# Native (Rust) backend — onboarding for new Rust contributors:
# specs/012-rust-core-port/quickstart.md (T067)
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
wave-decomposition) are auto-checked by `.Codex/hooks/quality-gate.sh`
(Stop hook).

### Generated-output hygiene (read before any codegen or TS source edit)

Five rules that govern what `packages/<lang>/src/factories.ts`,
`wrap.ts`, and other generated TS files are allowed to contain. Each
rule names a forbidden anti-pattern and the canonical replacement.
Apply them when editing any emitter under `packages/codegen/src/` AND
when hand-touching any non-generated TypeScript file.

1. **No `Object.defineProperty` in generated output.** Methods,
   accessors, and namespaces (`$with`, `$render`, etc.) live as
   inline object-literal method shorthand and properties. Methods
   are enumerable — `JSON.stringify` drops functions regardless of
   enumerability, so the only observable difference is `Object.keys`
   includes the method names. The non-enumerable variant from
   ADR-0018 Phase 2 (`withMethods` + per-field `defineProperty`) is
   retired in favor of inline object-literal method shorthand
   (`name() { return _name; }` closure-based getters) and
   `withMethods<T>` wrapper (Object.assign-based `$`-methods).

2. **No `Record<string, unknown>` casts in generated output.** With
   per-kind typed params (`data: T.Block`), storage reads are direct
   property access (`data._label`). No index-signature bridge needed.

3. **Shared boilerplate lives in per-grammar `utils.ts`, not
   `@sittir/core`.** Anything that imports from `./boundary.ts`
   (per-grammar `render` / `toEdit`) is grammar-specific and belongs
   in `utils.ts` (emitted by `packages/codegen/src/emitters/client-utils.ts`).
   `@sittir/core` stays grammar-agnostic — only cross-grammar runtime
   semantics (e.g. `freezeNodeData`, `buildWithNamespace`,
   `materializeStub`) live there.

4. **Shared functions are generic — preserve type information.** Any
   helper that takes a NodeData / Config / factory shape uses
   generics so the caller's concrete type flows through. Do NOT
   widen parameters to `object` or `Record<string, unknown>` if a
   generic would carry the type:

   ```ts
   // ❌ Erases type information.
   export function freezeNodeData(node: object): AnyNodeData;
   export function buildWithNamespace(
     config: object, factory: (c: object) => AnyNodeData, ...
   ): object;

   // ✅ Generics carry the caller's type through.
   export function freezeNodeData<T extends object>(node: T): Readonly<T> & AnyNodeData;
   export function buildWithNamespace<C extends object, F extends (c: C) => AnyNodeData>(
     config: C, factory: F, slotKeys: readonly [string, string][]
   ): { [K in (typeof slotKeys)[number][1]]: (v: unknown) => ReturnType<F> };
   ```

   Cast-at-the-boundary is acceptable for narrow bridges (e.g. the
   `_wrapTable` dispatch where `AnyNodeData` narrows to `T.X` per
   kind). Type erosion at the API surface is not.

5. **Avoid `AnyNodeData` in factory, wrap, and `from` code.** Factory
   return types, wrap function params, and `.from()` resolver
   signatures should use concrete per-kind types (e.g. `T.Block`,
   `T.Block.Config`, `T.Block.Loose | T.Block`). The same applies
   to local variables — concrete types flow through assignments and
   method invocations, `AnyNodeData` does not. The exception is
   shared infrastructure (`withMethods<T>`) where the helper
   genuinely serves all kinds via generics.

6. **Don't `...spread` shared-methods objects into factory literals.**
   Spreading a shared-methods const (or any object whose methods
   are typed with `this: AnyNodeData` or a generic) into a factory's return literal:
   - **Erases the literal's type narrowness** — the spread brings
     in the const's broader `this` type, so `node.$render()`
     dispatches through `AnyNodeData` instead of the concrete
     per-kind shape.
   - **Trips circular type inference** — when the literal contains
     a `$with` whose values reference the factory back, the spread
     widens the inference enough that TS gives up and emits
     TS7022/TS7023 ("implicit any return / circular initializer").
   The fix is `withMethods<T>(literal)` — a generic function that
   uses `Object.assign` to merge the four methods onto the literal.
   Generic `<T>` preserves the literal's narrow type. No spread
   needed — `Object.assign` is a function call, not an object-
   literal spread.

7. **Pre-flight: re-read these rules at the start of any codegen
   work or direct TS edit.** They override the "ship it" instinct.
   When the change touches generated files or emitters, the diff
   must respect rules 1–6 even when adding what feels like a
   minimal one-line patch.

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
- `packages/{rust,python,typescript}/templates/*.jinja` — per-rule
  render templates (feature 011). One file per rule kind; consumed by
  Nunjucks at runtime. Generated output — never hand-edit; see
  `packages/codegen/README.md` "Templates (`.jinja`)" for the
  authoring workflow.
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

### Use `probe-kind.ts` before ad-hoc probes

When debugging parse → `readNode` → render gaps, use
`packages/codegen/src/scripts/probe-kind.ts` before writing any
throwaway `/tmp/probe-*.ts` script. Extend `probe-kind.ts` if a flag is
missing; don't fork one-off diagnostics. This is the standard debugging
surface for CST / NodeData / render / reparse inspection.

### Prefer overrides over inference

When render/codegen logic is trying to guess grammar intent, stop and
ask whether the structure should be made explicit in
`packages/<lang>/overrides.ts` instead. Favor explicit grammar
overrides over heuristics that reverse-engineer intent from parse
output. Every heuristic removed is one less wrong-answer site.

### Fix priority order for template/codegen gaps

When diagnosing a template/from/round-trip failure, triage in this
order:

1. Check whether an existing override is wrong.
2. If codegen must change, fix the earliest phase that still has the
   information (Evaluate → Link → Assemble).
3. If the needed fact is absent from the `Rule` / node type, extend the
   type first, then fix the phase.
4. Use `transform(original, { ... })` overrides as the last resort — do
   not rewrite the whole rule wholesale.

This prevents walker hacks from piling on top of broken overrides.

### Jinja intersection-safe primitives

Shared templates must stay inside the Nunjucks ∩ Askama intersection.
The canonical conditional is:

```jinja
{% if field | isPresent %}...{% endif %}
```

Do **not** rely on:

- `{% if foo is defined %}` — broken on Askama
- truthy `{% if foo %}` — Askama rejects it
- `{% if foo != "" %}` — diverges when undefined
- `{% else if %}` — Askama-only spelling

Use `{% elif %}` and keep separators **inside** the conditional.

### Enrich only affects the codegen surface

`enrich()` operates on post-evaluation `Rule` objects. It updates the
TS-side codegen surface (`types.ts`, factories, templates, wrap) but it
does **not** modify the parser surface that tree-sitter generates from
rule callbacks. Do not retire parser-relevant `overrides.ts` entries
just because enrich now produces the same field name on the TS side —
the parser still needs the pre-generation patch.

### Inline synthesized `_kw_*` rules for LR-precedence fixes

When promoting a standalone optional punctuation/keyword token to
`field('name', 'token')` causes a parse-time ERROR because a sibling arm
still needs the bare token, add `_kw_<name>` to the grammar's
`inline:` array. This preserves the field wrapper in the parse tree
while folding the hidden rule away in LR-table generation. Prefer this
over compensating with extra precedence or conflict noise.

### `overrides.ts` recurring patterns

Before editing `packages/<lang>/overrides.ts`, keep these defaults in
mind:

- use `variant()` for choice arms with different literals / delimiters /
  separators
- extend `conflicts` with `...(previous ?? [])` or
  `previous.concat(...)`; never drop the base grammar's conflicts
- use `field('semicolon', $._semicolon)` for hidden-semicolon drops
- when variant/conflict work changes parser shape, rerun the full
  transpile / generate / compile-parser / emit chain so `.sittir` wasm
  and generated output stay aligned

### Report raw per-grammar counts while iterating

When working on corpus-affecting changes, report raw per-grammar counts
on each rerun, not just aggregate pass/fail totals:

- `fromPass/fromTotal`
- `covPass/covTotal`
- `rtPass/rtTotal/rtAstMatchPass`
- `factoryPass/factoryTotal`

Aggregate totals can hide kinds falling out of the validation universe.

### KindID identity comes from `parser.c`, not `ts_symbol_names[]`

For the KindID runtime migration, the authoritative identity source is
`packages/<lang>/.sittir/src/parser.c` `enum ts_symbol_identifiers`.
Do **not** key KindID metadata off `ts_symbol_names[]` or `parser.wasm` —
the name table is display/debug data and can collapse distinct parser
symbols (`sym__as_pattern` vs `sym_as_pattern` both → `"as_pattern"`).
There is no `parser.wasm` fallback for KindID identity.

Derive parser-side identity by stripping only the prefix family:

- `sym_foo -> foo`
- `anon_sym_PLUS -> PLUS`
- `aux_sym_bar_repeat1 -> bar_repeat1`
- `alias_sym_baz -> baz`

Retain the parser scaffolding as explicit metadata flags instead of
baking it into ad hoc name cleanup:

- `anon`
- `aux`
- `alias`
- `hidden` (`parserName.startsWith('_')`)

### KindID metadata uses `key` + presence/uses flags

For KindID work, `key` is the canonical cross-pipeline join term — the
existing Sittir-facing value used across grammar/node-types/runtime
surfaces. Do not force minimally-cleaned parser names like `PLUS` to
become the global join term just because they came from `parser.c`.

The grammar-wide symbol catalog should cover every parser symbol and
separate:

- parser identity (`id`, `parser.cSymbol`, `parser.parserName`,
  `parser.displayName`, parser-origin flags)
- canonical `key` (optional when a parser symbol does not map to an
  existing Sittir-facing surface)
- JS/native emitted names
- where the symbol exists (`KindPresenceFlag`)
- what Sittir can do with it (`KindUseFlag`)

Use these two flag sets:

- `KindPresenceFlag`: `TSGrammar`, `TSNodeTypes`, `TSRuntime`
- `KindUseFlag`: `Readable`, `Buildable`, `Renderable`

JS/native naming is intentionally asymmetric:

- JS/TS: `enumName: 'AsPattern'`, `methodName: 'asPattern'`
- native: `enumName: 'as_pattern'`, `methodName: 'as_pattern'`

Emitters should read those names from the catalog instead of re-deriving
them independently.

<!-- MANUAL ADDITIONS END -->

## Active Technologies
- TypeScript 6.0.2 (workspace ESM) and Rust 1.88+ + `@sittir/codegen`, `@sittir/core`, `@sittir/types`, Askama 0.15, napi-rs 3, `web-tree-sitter`, grammar-owned native/render modules under `rust/crates/sittir-{lang}/src/render` (020-render-pipeline-optimization)
- File system only (generated templates, generated native crates, spec artifacts, parity baselines); no runtime persistence (020-render-pipeline-optimization)
- TypeScript 6.0.2 (ESM), Rust 1.88+ + `@sittir/core`, `@sittir/types`, `@sittir/codegen`, tree-sitter, napi-rs 3, Askama 0.15 (022-binding-simplify-assemble)
- File system (generated TS/Rust per grammar) (022-binding-simplify-assemble)
- TypeScript 6.0.2 (workspace ESM, `.ts` extensions in imports), Rust 1.88+ + `@sittir/core`, `@sittir/types`, `@sittir/codegen` (workspace); `napi-rs` 3, `web-tree-sitter` 0.26.7, `askama` 0.15 (022-binding-simplify-assemble)
- File system — generated TS/Rust per grammar package; no runtime persistence (022-binding-simplify-assemble)

- TypeScript (ESM, `.ts` extensions in imports), TypeScript 6.0.2 + `@sittir/core`, `@sittir/types`, `@sittir/codegen`; tree-sitter grammars (grammar.json + node-types.json) (004-yaml-render-templates)
- File system (per-rule `.jinja` templates at `packages/{lang}/templates/<kind>.jinja`, read at render time by Nunjucks) (011-jinja-template-migration, supersedes 004's YAML templates)
- TypeScript 6.0.2 (ESM, `.ts` extensions in imports) + None at runtime (zero-dep). Dev: vitest, oxlint, oxfmt, tsgo (005-five-phase-compiler)
- File system (grammar.js input, overrides.ts, generated .ts/.yaml output) (005-five-phase-compiler)
- TypeScript (ESM, `.ts` extensions in imports), TypeScript 6.0.2 + `@sittir/core`, `@sittir/types`, `@sittir/codegen`; tree-sitter grammar packages (`tree-sitter-rust`, `tree-sitter-typescript`, `tree-sitter-python`); tree-sitter CLI for CI validation (006-override-dsl-enrich)
- File system — `packages/<lang>/overrides.ts` (hand-authored source), `packages/<lang>/.sittir/grammar.js` (transpiled output, gitignored), generated `.ts`/`.yaml` artifacts (006-override-dsl-enrich)
- TypeScript (ESM, `.ts` extensions in imports), TypeScript 6.0.2 + tree-sitter-cli ^0.26.7, web-tree-sitter ^0.26.7, esbuild (transpile bridge from spec 006), Emscripten (emsdk, for WASM compilation) (007-override-compiled-parser)
- File system — `.sittir/` directory per grammar for transpiled grammar.js, compiled parser WASM, parser.c, node-types.json (007-override-compiled-parser)
- TypeScript 6.0.2 (ESM, `.ts` extensions in imports) + `@sittir/core`, `@sittir/types`, `@sittir/codegen` (workspace packages — no new deps) (008-factory-ergonomic-cleanup)
- File system — per-grammar generated output under `packages/{rust,typescript,python}/src/` (008-factory-ergonomic-cleanup)
- N/A — the engine is a pure transformation over in-memory strings and parse trees. No persistence layer. (012-rust-core-port)
- Rust 1.88+, sittir-core, askama 0.15, napi-rs 3, per-grammar render crates at `rust/crates/sittir-{lang}/src/render/` (012-rust-core-port)
- TypeScript 6.0.2 (ESM, `.ts` extensions in imports), Rust 1.88+ for native render path (already shipped on 012). + `@sittir/codegen` (walker / emitter / link / assemble / evaluate pipeline), `@sittir/core` (render, readNode, edit), `@sittir/types` (NodeData, ConfigOf, FromInput type projections), per-grammar packages (`@sittir/{rust,typescript,python}`), per-grammar napi crates (`sittir-{rust,typescript,python}-napi` for native render). Vitest for the test suite that defines the baseline. (016-parity-regressions)
- File system — `specs/016-parity-regressions/baselines/{ts,native}.json` is the durable contract; generated TS/templates under `packages/{lang}/src/` and `packages/{lang}/templates/*.jinja` are codegen output (never hand-edited). (016-parity-regressions)

## Recent Changes

- 004-yaml-render-templates: Added TypeScript (ESM, `.ts` extensions in imports), TypeScript 6.0.2 + `@sittir/core`, `@sittir/types`, `@sittir/codegen`; tree-sitter grammars (grammar.json + node-types.json)

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
<!-- SPECKIT END -->
