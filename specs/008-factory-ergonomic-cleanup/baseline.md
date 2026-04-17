# Baseline — Pre-008 Measurements

**Recorded**: 2026-04-17
**Branch**: `008-factory-ergonomic-cleanup` (post-T004a/T004b, pre-Phase 2)
**Source state**: master `bcd65a0` + validator type-hygiene cleanup (T004a/T004b applied)

All numbers captured **after** the validator cleanup so US1–US6 measurements compare apples-to-apples against the clean validator baseline, not against the WIP state.

---

## Tests

```
Test Files  38 passed (38)
     Tests  1228 passed (1228)
```

**Pass count to preserve at every user-story landing: 1228**.

---

## Type-check

```
pnpm -r run type-check
```

All six workspace packages pass with zero errors (types, core, rust, typescript, python, codegen).

---

## Line counts per generated file

| Grammar | types.ts | factories.ts | from.ts | wrap.ts | ir.ts |
|---|---|---|---|---|---|
| rust | 4004 | 4395 | 1956 | 1876 | 199 |
| typescript | 3959 | 4904 | 2198 | 2100 | 227 |
| python | 2538 | 2886 | 1366 | 1290 | 142 |

**Total generated LOC: 34,040**

Target (SC-001): `types.ts` drops by ≥700 lines per grammar after US1.
Target (SC-005): largest single line in `ir.ts` or `from.ts` < 500 chars after US3/US5.

---

## Lint signal

```
$ npx oxlint packages/rust/src packages/typescript/src packages/python/src
Found 637 warnings and 0 errors.
```

The "637" counts emitted diagnostic lines (each warning spans ~4 lines of output). Real distinct warnings: **142** across three rules:

| Rule | Count |
|---|---|
| `unicorn/no-useless-fallback-in-spread` | 122 |
| `no-unused-vars` (dead imports + unused top-level + unused `v` param) | 18 |
| `no-useless-escape` | 2 |

Target (SC-013): `Found 0 warnings and 0 errors` after US6.

---

## Pre-triage `sg` / `grep` signal

Structural queries that must return **zero matches** after the relevant user story lands:

| Pattern | Current matches | Target (post-story) | SC |
|---|---|---|---|
| `sg '_attach($$$)' packages/*/src/ir.ts` | 441 | 0 (after US4) | SC-002 |
| `sg '$E as unknown as WrappedNode<$K>' packages/*/src/wrap.ts` | 2639 | 0 (after US4) | SC-004 |
| `sg '$O.fields?.[$KEY]' packages/*/src/from.ts` | 735 | 0 (after US3) | SC-005a |
| `sg '(input as $T).$P' packages/*/src/from.ts` | 735 | 0 (after US3) | SC-005a |
| `grep -l '_union_' packages/*/src/types.ts` (files with matches) | 2 | 0 (after US4) | SC-003 |

Match counts include context lines around each diagnostic site; they're upper-bounds, not exact hit counts. What matters is the "0" target.

---

## Expected post-US6 deltas (summary)

- types.ts: ≥700 lines removed per grammar
- factories.ts: 122 fewer `?? {}` occurrences
- from.ts: 735+735 dual-access expressions replaced with single-access
- wrap.ts: `interface _NodeData` declaration removed; `as unknown as` double-cast eliminated
- ir.ts: `_attach` helper removed; `ir.ts` largest line < 500 chars
- lint: 142 warnings → 0
- CI: new `oxlint` step runs on PRs
