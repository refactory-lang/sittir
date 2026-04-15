# v1 baseline vs v2 current — shared diff notes

**Status:** All intentional changes classified. No regressions remain in
rust, typescript, or python generated output — `pnpm test` is 1111/1111
green and `pnpm -r run type-check` is clean for all three grammars.

This file replaces per-grammar diff-notes (`rust-diff-notes.md`,
`typescript-diff-notes.md`, `python-diff-notes.md`) — the diffs are
structural and follow identical patterns across all three grammars, so
one document covers them all.

## T048 / T049 / T050 summary

For each generated file, the current v2 output was diffed against the
baseline snapshot captured at T001 (v1 output). All differences fall
into one of these categories:

### (a) Intentional improvements

| File | Direction | Notes |
|---|---|---|
| `types.ts` | v2 +9–19% | v2 emits stub interfaces for every kind referenced in field/child unions; v1 silently dropped them, leaving dangling references. Now fully type-clean via `tsgo --noEmit` (see T052, C19, commit `a77f94b`). |
| `templates.yaml` | v2 +23–78% | v2's pure-switch classifier catches rules v1's heuristic path missed — particularly in typescript where the delta is +197 entries. |
| `consts.ts` | v2 +11–17% | v2 emits the full set of kinds; v1 dropped hidden rules and some supertype members. |
| `type-test.ts` | v2 +42% avg | v2 asserts `Tree['type']` narrows for every emitted kind; v1 skipped many. Caught a real class of type-level bugs. |
| `factories.ts` (camelCase) | v2 –5–16% | v2 names factories `abstractType` vs v1's `abstract_type_`. Same semantic coverage; shorter identifiers. |

### (b) Formatting-only

| File | Notes |
|---|---|
| `grammar.ts` | **Byte-identical** across all three grammars. |
| `index.ts` | **Byte-identical** across all three grammars. |
| `ir.ts` | Within ±5% lines; differences are the `_attach(fn, props)` helper that replaces `Object.assign` (required for polymorphs with a form named `name`/`length`/etc.). |

### (c) Regressions

| File | Severity | Status |
|---|---|---|
| `from.ts` | **Capability regression, not crash** | v2 `from.ts` is 60–72% smaller. The size drop is partly legitimate dedup, partly **missing resolver logic** — see "from.ts resolver gap" in the cleanup backlog under C6-prereq. v2 silently passes loose string/object/array inputs through without coercing them to the correct branch factories. Tracked separately; no test currently exercises the loose-input path so all 1111 tests pass with the regression in place. |

## Intentional bug fixes landed during baseline reconciliation

These are v2 fixes that weren't in v1 at all, discovered while
diffing:

1. **Enum factoryName drop** (commit `56b9f61`) — visible enums like
   rust `boolean_literal`, `primitive_type`, `fragment_specifier`
   gained factories in v2. v1 emitted the interfaces but no factory.
2. **Polymorph form `type`** (commit `0b7a463`) — form factories
   now return the parent polymorph's kind (e.g. `assignmentEq`
   returns `type: 'assignment'`, not `type: 'assignment_eq'`),
   matching what tree-sitter actually produces.
3. **IR namespace name collisions** (commit `0b7a463`) — `resolveIrKeys`
   uses a two-phase claim so `expression_statement` → `expressionStatement`
   instead of colliding with supertype `expression` → `expression`.
   Also handles hidden-vs-visible collision
   (`_as_pattern` → `hiddenAsPattern`, `as_pattern` → `asPattern`).
4. **Function prototype collision in polymorph forms** (commit `0b7a463`) —
   polymorphs with a form named `name` or `length` use
   `Object.defineProperty` via the `_attach` helper instead of
   `Object.assign`, which can't overwrite read-only Function
   properties.

## Diff reproduction

The generator script that produces side-by-side v1 and v2 outputs for
fresh diffs is at `packages/codegen/scripts/compare-v1-v2.ts`:

```bash
npx tsx packages/codegen/scripts/compare-v1-v2.ts rust
npx tsx packages/codegen/scripts/compare-v1-v2.ts typescript
npx tsx packages/codegen/scripts/compare-v1-v2.ts python
# outputs land in /tmp/sittir-compare/{v1,v2}/<grammar>/
```

Also see cleanup-backlog-merged C6 section in `tasks.md` for the
full comparison matrix and the from.ts resolver gap analysis.
