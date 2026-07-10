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

FunctionItem.Config; // namespace sugar (preferred)
ConfigFor<'function_item'>; // generic (kind-parametric code)
NamespaceMap['function_item']['Config']; // direct map (meta-utilities)
```

Guards — narrow through kind × shape (spec 008 US2):

```ts
import { is, isTree, isNode, assert } from '@sittir/rust';

if (is.functionItem(v) && isNode(v)) {
	// kind + data-shape
	v.$fields.name; // typed
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
| Factory output  | `NodeData` + fluent getters/setters + methods  | Raw `$`-prefix metadata, `$fields` snake_case, fluent methods camelCase |
| From input      | `FromInput` (loose: strings, numbers, objects) | Adds resolution on top of factory                                       |
| From output     | Same as factory output                         | Calls factory internally                                                |
| readNode input  | `SgNode` / `TreeNode` (raw field names)        | **ast-grep / tree-sitter owns this shape**                              |
| readNode output | `NodeData` with `$source: 'ts'`                | Direct mapping, no translation                                          |
| Render input    | `AnyNodeData` — reads `node.$fields[rawName]`  | Zero-cost from any producer                                             |

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
- `packages/{rust,python,typescript}/src/node-model.json5` +
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

<!-- MANUAL ADDITIONS END -->

## Active Technologies
- TypeScript 6.0.2 (workspace ESM) and Rust 1.88+ + `@sittir/codegen`, `@sittir/core`, `@sittir/types`, Askama 0.15, napi-rs 3, `web-tree-sitter`, grammar-owned native/render modules under `rust/crates/sittir-{lang}/src/render` (020-render-pipeline-optimization)
- File system only (generated templates, generated native crates, spec artifacts, parity baselines); no runtime persistence (020-render-pipeline-optimization)
- TypeScript 6.0.3, workspace ESM with `.ts` imports + `@sittir/codegen`, tree-sitter grammar packages, `tree-sitter-cli`/`web-tree-sitter` for generated metadata validation (021-rule-ids-at-evaluate)
- In-memory compiler data plus generated spec artifacts only; no runtime persistence (021-rule-ids-at-evaluate)

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


<!-- infigraph-instructions -->
# Infigraph — Code Intelligence

This project is indexed by Infigraph. Use Infigraph tools FIRST for all code tasks. Fall back to grep/read only if Infigraph returns nothing or for non-code files.

## Rules
1. Check `list_projects` before indexing — don't re-index
2. **`search`** for ALL code search — hybrid BM25+vector+grep in one call, auto-escalates
3. **`get_doc_context`** before editing any function — returns source+callers+callees in one call
4. **`trace_callers`** / **`find_all_references`** before refactoring — never grep for callers
5. **`trace_callees`** / **`transitive_impact`** for blast radius — never manually trace call chains
6. Read files directly only for non-code files (configs, docs, manifests) or edit tool line-number context

## Workflows
- **Find code:** `search` → if need symbol detail: `get_code_snippet` or `symbol_context`
- **Before editing:** `get_doc_context`
- **Before refactoring:** `find_all_references` → `transitive_impact` → edit
- **Onboarding:** `index_project` → `get_architecture` → `get_stats`
- **Multi-repo:** `group_create` → `group_add` × N → `group_index` → `group_sync` → `group_link`

> Each tool description says what it replaces — check descriptions when unsure which tool to use.

## Session Continuity — MANDATORY
- **On session start:** MUST call `get_latest_session` to resume prior context
- **After context compaction:** if you see "continued from a previous conversation" or a compaction summary, IMMEDIATELY call `save_session` with whatever context survived before doing anything else
- **MUST call `save_session` IMMEDIATELY (before responding to the user)** when ANY of these occur. No session-end signal exists — if you don't save now, context is lost forever:
  1. **Finding** — root cause identified, discovered a bug, learned how something works
  2. **Milestone** — bug fixed and verified, feature committed, test passing, build green
  3. **Decision** — chose an approach, ruled something out, changed strategy
  4. **Task done** — any pending task from a prior session is completed
  5. **Periodic** — if you have NOT called `save_session` in the last 5 exchanges with the user, call it NOW regardless of whether anything dramatic happened. This is a hard rule, not a suggestion.
- Do NOT defer saves ("I'll save later"). Do NOT batch them. Do NOT wait for user to ask.
- "Later" does not exist — context compaction or session end can happen at any moment.
- Same-day saves merge: summary/pending_tasks overwrite, decisions append, files_touched union
- **Narrative dumps:** On every `save_session`, include `narrative` field with full session story — what was explored, found, reasoned, decided, and why. Chronological prose, not terse bullets. Written to `.infigraph/sessions/session_YYYY-MM-DD.md` and embedded for semantic search. On session start, if `get_latest_session` shows a narrative log path, read it when structured fields aren't enough context.

<!-- infigraph-instructions -->