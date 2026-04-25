# Contract: Baseline JSON Schema

**Feature**: `016-parity-regressions`
**Files governed**: `specs/016-parity-regressions/baselines/ts.json`, `specs/016-parity-regressions/baselines/native.json`

This contract defines the canonical shape of the per-backend baseline JSON files. The regression-checker, `collect-baseline.ts` writer, and any consumer of the JSON (commit-message Before/After-table renderers, summary scripts) all conform to this schema.

---

## Schema

```ts
interface BackendBaseline {
    /** Which backend produced the counts. */
    backend: 'typescript' | 'native'

    /**
     * Short SHA of HEAD at collection time. Informational — not part of
     * the regression diff (regression-checker only compares counts and
     * failingKinds).
     */
    commit: string  // 7-char hex

    /** Per-grammar counts. Keys MUST be sorted: python, rust, typescript. */
    grammars: {
        readonly [grammar in 'python' | 'rust' | 'typescript']: GrammarEntry
    }

    /** Roll-up across all grammars and validators. Spot-check sums. */
    totals: {
        pass: number
        fail: number
        total: number  // pass + fail
    }
}

interface GrammarEntry {
    /** Per-validator counts. Keys MUST be sorted: coverage, factoryRoundtrip, from, roundtrip. */
    validators: {
        from: ValidatorResult
        coverage: ValidatorResult
        roundtrip: RoundtripResult
        factoryRoundtrip: RoundtripResult
    }

    /** vitest parity fixtures (packages/{grammar}/tests/parity.test.ts). */
    parityFixtures: ParityFixtures
}

interface ValidatorResult {
    pass: number
    total: number
    /**
     * Sorted ascending. Empty array (NOT undefined) when no failures.
     * Determinism requirement — JSON keys in the same order across runs.
     */
    failingKinds: string[]
}

interface RoundtripResult extends ValidatorResult {
    /** Subset of pass — fixtures whose render-reparse-compare matches the original AST shape. */
    astMatchPass: number
}

interface ParityFixtures {
    pass: number
    total: number
    /**
     * Map of kind → list of failing fixture IDs (e.g. "render #344").
     * Object keys MUST be sorted ascending; failure-id values stay in
     * fixture-file declaration order.
     * Empty object (NOT undefined) when zero failures.
     */
    failingByKind: { readonly [kind: string]: readonly string[] }
}
```

---

## Determinism Rules

1. **Sorted keys**: every object in the JSON has its keys in stable ascending order. The writer (`collect-baseline.ts`) sorts before serialising; the regression-checker assumes sorted input.
2. **No timestamps**: the only mutable header field is `commit` (a content-derived hash). No `generatedAt`, no wall-clock data.
3. **Stable serialisation**: 4-space indent, `\n` line endings, trailing newline. Matches existing repo convention for hand-edited JSON5 / JSON files.
4. **Empty collections explicit**: zero failures means `"failingKinds": []` and `"failingByKind": {}`, not omitted keys. Distinguishes "no failures observed" from "this validator wasn't run."

---

## Regression-Checker Verdict Rules

The CI step compares `<commit>:specs/016-parity-regressions/baselines/<backend>.json` against the PR head's version of the same file. **Fail the CI job** iff any of these are true:

1. **Pass-count drop**: any of these field paths has a smaller value than in the base commit:
    - `grammars.<g>.validators.from.pass`
    - `grammars.<g>.validators.coverage.pass`
    - `grammars.<g>.validators.roundtrip.pass`
    - `grammars.<g>.validators.roundtrip.astMatchPass`
    - `grammars.<g>.validators.factoryRoundtrip.pass`
    - `grammars.<g>.validators.factoryRoundtrip.astMatchPass`
    - `grammars.<g>.parityFixtures.pass`
    - `totals.pass`
2. **Total drop**: `totals.total` decreased — almost always means a fixture was deleted; flag for human review.
3. **Total-fail rise**: `totals.fail` increased — covers cases where `pass` stayed flat but `total` increased due to new fixtures.
4. **Schema violation**: the JSON doesn't conform to the schema above (e.g. missing `failingByKind` key, unsorted `failingKinds`).

The CI step does NOT fail on:
- Changes to `commit` (informational).
- Reordering inside `failingKinds` (the writer enforces sort).
- Pass-count INCREASES (the goal of the feature).

---

## Producer Contract

`packages/codegen/src/scripts/collect-baseline.ts`:
- Reads `SITTIR_BACKEND` env var to select target. Default 'typescript' if unset.
- For 'typescript': runs each validator (`validateFromCorpus`, `validateRoundTrip`, `validateFactoryRoundtrip`, `readnode-roundtrip`) against each grammar's corpus, captures pass/total/failingKinds. Runs vitest parity fixtures via direct `import` of the fixture-render machinery (no shelling out to `pnpm test`).
- For 'native': same, but selects `nativeTreeHandle` via `buildReadHandle` (already wired in `validate/common.ts`).
- Writes to `specs/016-parity-regressions/baselines/<backend>.json` with the determinism rules above.
- Exits 0 on success regardless of pass counts (it's a measurement, not a gate). Non-zero only on infrastructure failure (e.g. fixture file unreadable).

## Consumer Contract

Regression-checker (CI script, location TBD in tasks):
- Reads two JSON files: `<base>:specs/016-parity-regressions/baselines/<backend>.json` and `<head>:specs/016-parity-regressions/baselines/<backend>.json`.
- Applies the verdict rules above.
- Prints a one-line summary on success; on failure prints a JSON diff highlighting the dropped counts.
- Exits 0 on pass, 1 on regression.

Commit-message renderer (optional helper, may be inlined into the cluster-commit workflow): reads two BackendBaseline objects, emits a Markdown table grouped by grammar.
