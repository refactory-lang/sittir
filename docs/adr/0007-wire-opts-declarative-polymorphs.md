# ADR 0007 — Declarative polymorphs via `wire()`, no grammar wrapper

**Status**: Accepted
**Date**: 2026-04-20
**Related**: ADR-0001, ADR-0004, ADR-0005, specs/006-override-dsl-enrich/, specs/007-override-compiled-parser/

## Context

Sittir's DSL lets authors express polymorphic variants inside a rule with `variant('name')` placeholders inside `transform()` patches:

```ts
assignment: ($, original) => transform(original, {
  '1/0': variant('eq'),
  '1/1': variant('type'),
}),
```

`variant()` is a side-effecting DSL call: at rule-evaluation time it captures the content at the patch position, registers a hidden rule `_assignment_eq` with that content, and emits `alias($._assignment_eq, $.assignment_eq)` in the tree. `alias()` with a named kind has the same shape.

Tree-sitter's `grammar()` snapshots `Object.keys(options.rules)` into a fixed `ruleMap` at entry (dsl.js lines 283-296). References like `$._assignment_eq` inside rule bodies resolve against this map. Synthetic rules registered mid-iteration don't appear in the snapshot, so unreferenced names throw `ReferenceError`.

The existing mechanism — `installGrammarWrapper` (dsl/synthetic-rules.ts) — worked around this by:

1. Monkey-patching `globalThis.grammar` at DSL-import time.
2. Running a pass-1 dry-run with a permissive `$` proxy to collect synthetic names.
3. Pre-populating `options.rules` with `blank()` stubs for each name.
4. Delegating to tree-sitter's native `grammar()`.
5. Post-swapping the blanks for captured content and appending accumulated conflict groups.

This worked but carried three debts: a globalThis mutation at module load time, a module-level state machine (`currentSyntheticRules`, `currentPolymorphVariants`, `currentConflicts`, `currentRuleKind`, `currentOptsRules`, `currentBlankFn`) that leaked across invocations on any uncaught path, and duplicated between tree-sitter runtime (wrapper) and sittir runtime (evaluate.ts::grammarFn doing the same drain work differently).

Four alternatives were genuinely considered during design.

## Forcing Constraint

> "with wrapOpts, i could add the polymorphs up top with the variant definitions, and not have to add them to rules at all"

The observation that collapsed the design: if the author declares polymorphs once, at the top of `overrides.ts`, then `wrapOpts` has the complete synthetic-name list BEFORE `grammar()` runs — no pass-1 dry-run, no monkey-patch, no static source scan. Declarative polymorphs are an artefact the author already wants (one place to see every variant in the grammar); wiring them into `opts.rules` is a mechanical follow-on the helper does for free.

## Alternatives Considered

- **Named alias without a hidden rule** (`alias(inline_seq, sym('foo_eq'))`). Spike 2 verified that tree-sitter accepts the shape, but Spike 3 comparison showed it **flattens the inner structure** — every child of the inline seq gets stamped with the aliased kind, losing `ident`/`rhs` types. Only symbol-ref-to-declared-rule preserves structure. Rejected: we need the hidden rule.

- **Field-discriminator (unnamed variants)** — Spike 5: `choice(field('body_eq', seq(...)), field('body_type', seq(...)))`. Variants discriminated by marker-field presence instead of aliased kind. Works end-to-end, no synthesis needed. Parked, not rejected: it's a model change that would reshape sittir's type surface (`AssignmentEq | AssignmentType` → `Assignment & ({body_eq}|{body_type})`) and all downstream emitters (factories, types, from, wrap). Kept as a future option for "unnamed variants" where distinct kinds aren't needed.

- **Transpile-time resolution** — run the DSL at transpile-overrides time, emit a fully-resolved `.sittir/grammar.js` with all synthetic rules already declared. Rejected: "transpile is a straight transpile" — the transpile step bundles sittir's DSL extensions inline but doesn't interpret them.

- **Static scan of rule fn source via `fn.toString()`** — regex-match `variant('x')` / `alias('x', ...)` in each user rule's source, register the discovered names. Zero author boilerplate. Rejected: fragile to import-renames, dynamic names, minification. Solves name discovery but not the communication channel for captured content.

- **Explicit `buildGrammar(base, opts)` helper** replacing the wrapper with a local-name invocation at the `overrides.ts` entry point. Same internals (pass-1 dry-run, pre-register, post-swap) without the globalThis mutation. Rejected in favour of the declarative approach because it still carries pass-1 and module state.

## Decision

The DSL exposes a single opts-wrapping helper, `wire(config)`, that the author wraps around the options passed to `grammar()`:

```ts
export default grammar(enrich(base), wire({
  polymorphs: {
    assignment:         { '1/0': 'eq',    '1/1': 'type',   '1/2': 'typed' },
    closure_expression: { '4/0': 'block', '4/1': 'expr' },
  },
  rules: { /* regular rules */ },
}))
```

`wire(config)` is pure and synchronous:

1. For every declared `polymorphs[parent][path] = suffix`, injects `opts.rules['_parent_suffix']` as a deferred-content function. The function reads from a `deposits` map created inside the `wire` closure; it returns `blank()` if the deposit is missing.
2. Synthesizes or composes `opts.rules[parent]` so that its rule fn applies a `transform(original, { path → captureMarker })` patch. If the author supplies an entry for the same parent in `rules`, `wire` composes: user fn first, `wire`-generated transform on the result.
3. The capture marker at each path deposits the content it captured into the closure's `deposits` map and returns `alias($._parent_suffix, $.parent_suffix)`.
4. Wraps `opts.conflicts` (if present, otherwise installs one) so that conflict groups registered by capture markers (for sibling-colliding variants) drain into the return array, symbolised through `$`.

Author-facing flexibility: three equivalent forms all resolve through the same `wire` machinery:

- **Implicit** — the author writes nothing for a polymorph parent. `wire` generates `opts.rules[parent]` on their behalf, applying the declared patches to `original`.
- **`variant('suffix')`** — the author writes `transform(original, { '1/0': variant('eq') })`. `wire` recognises the marker against the polymorphs declaration and wires the deferred capture. Useful when a rule needs field-level transform interleaved with variants.
- **Inline `alias($._parent_suffix, $.parent_suffix)`** — the author writes a plain tree-sitter alias whose target matches a declared polymorph hidden rule. `wire` recognises the pattern and installs content capture around the rule fn.

All state (deposits, conflict groups, polymorph metadata) lives in the `wire` closure — per-grammar, per-invocation. No module-level globals. No `globalThis.grammar` mutation. No pass-1 dry-run.

The polymorph-variant metadata that downstream sittir codegen consumes (`{parent, child}` pairs per form) is sourced by Link-time pattern detection against the emitted grammar (`choice(alias($._parent_suffix, $.parent_suffix), …)` with matching hidden rules → polymorph) rather than from an accumulator drain. Sittir already classifies hidden-rule shapes during Link for enum/supertype/group; polymorph joins that detection set.

## Principles Applied

- **P-001 (External contract first)** — tree-sitter's `grammar()` sees a complete `opts.rules` at its `ruleMap` snapshot; no wrapping of tree-sitter's function.
- **P-008 (Composition over configuration)** — no flags toggle polymorph handling; the `polymorphs` block is declarative data.
- **Locality of effect** — state lives in closures, not module globals. Two parallel `wire()` calls in the same process cannot interfere with each other.
- **Explicit over implicit** — every synthetic kind appears in exactly one place (`polymorphs` declaration). `grep`-able by kind name.

## Consequences

- **Enables**: Deleting `installGrammarWrapper`, `dsl/synthetic-rules.ts`, the `globalThis.grammar` mutation in `dsl/index.ts`, and the six-variable module-level state machine (`currentSyntheticRules`, `currentPolymorphVariants`, `currentConflicts`, `currentRuleKind`, `currentOptsRules`, `currentBlankFn`). Simplifies `compiler/evaluate.ts::grammarFn` — no drain helpers; `opts.rules` already contains every name. Removes divergence between tree-sitter CLI and sittir runtimes; both iterate the same `opts.rules`.
- **Costs**: Authors declare polymorphs once per grammar at the top of `overrides.ts`. Existing `variant()`/`alias()` call sites continue to work (via the `wire`-wired form), so migration is additive for the declaration plus optional simplification of rule bodies. About 30 variant sites × 3 grammars (rust/python/typescript); mechanical. Link needs a small pattern-detection addition to classify polymorphs from the authored shape instead of runtime metadata.
- **Follow-ups**: Unit-test `wire()` against a toy grammar before touching the three production `overrides.ts`. Migrate rust first (smallest variant set), verify recursive-profile baseline (10) holds, propagate to python (15) and typescript (97). Delete legacy wrapper once all three are green. The field-discriminator alternative stays on the table as a potential `unnamedVariant()` primitive for cases where distinct kinds aren't needed — tracked separately, not gated by this ADR.

## Verification

- If we ever find ourselves wanting `variant()` or `alias()` to register a hidden rule **without** a matching entry in the `polymorphs` declaration, the static-scan-vs-explicit-declaration tradeoff re-opens. The expected response is to add to the declaration, not to reintroduce the accumulator. If that response becomes onerous (e.g. hundreds of one-off aliases), revisit.
- If any test observes synthetic rules, polymorph metadata, or conflicts leaking across two `wire()` invocations in the same process, the closure design is broken — investigate whether any state slipped back into module scope.
- If Link's polymorph pattern detection produces false positives (classifying an authored `choice(alias, alias)` as a polymorph when it wasn't intended as one), the authored shape and the polymorph shape have collided and the detection predicate needs a distinguishing feature (e.g. requiring that every arm's alias target be in the polymorphs declaration, or a naming convention on the hidden rules).
- If `tree-sitter generate` ever rejects the `.sittir/grammar.js` output produced by `wire()` + `grammar()` + `enrich()`, compare the emitted grammar JSON against the old wrapper's output — any divergence is a `wire()` bug.
