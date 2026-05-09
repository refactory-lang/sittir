# Phase 1 Data Model: Parity & Regressions

**Feature**: `016-parity-regressions`
**Date**: 2026-04-25
**Plan**: [plan.md](./plan.md)

This feature operates on existing in-memory entities (validator results, NodeData, render output) plus one new persisted entity: the per-backend baseline JSON. No database, no schema migration, no runtime persistence outside the file system.

---

## Entity: BackendBaseline

**Purpose**: A snapshot of corpus-validator pass/fail counts for one backend at one commit. Stored as `specs/016-parity-regressions/baselines/<backend>.json`. The file is the regression-checker's reference point and the commit-message Before/After table's source of truth.

**Persistence**: File system. One file per backend (`ts.json`, `native.json`). Updated atomically per cluster commit (FR-002).

**Determinism**: Stable key ordering, no embedded timestamps (FR-001). Two runs against the same checkout MUST produce byte-identical files.

**Shape**:

```jsonc
{
	"backend": "typescript", // "typescript" | "native"
	"commit": "abc1234", // git rev-parse --short=7 HEAD at collection time (informational; not in regression diff)
	"grammars": {
		"rust": {
			"validators": {
				"from": { "pass": 130, "total": 148, "failingKinds": ["…"] },
				"coverage": { "pass": 132, "total": 136, "failingKinds": ["…"] },
				"roundtrip": {
					"pass": 121,
					"total": 136,
					"astMatchPass": 120,
					"failingKinds": ["…"]
				},
				"factoryRoundtrip": {
					"pass": 127,
					"total": 135,
					"astMatchPass": 123,
					"failingKinds": ["…"]
				}
			},
			"parityFixtures": {
				"pass": 468,
				"total": 473,
				"failingByKind": {
					"mut_pattern": ["render #344", "render #393", "render #417"],
					"captured_pattern": ["render #402", "render #418"]
				}
			}
		},
		"typescript": { "…": "same shape" },
		"python": { "…": "same shape" }
	},
	"totals": {
		// Roll-up across all per-grammar validators + parity fixtures.
		// `pass` is the sum of every `validators[*].pass` and
		// `parityFixtures.pass`; `total` is the analogous sum of `total`s;
		// `fail = total - pass`. At baseline (commit d0d03d94) this is
		// ts={pass:3134, fail:1825, total:4959}, native={pass:2819,
		// fail:2140, total:4959}. NOTE: this is the validator-level
		// count, NOT the vitest test count — the spec's headline "16
		// baseline failures" refers to the latter (16 it() calls failing
		// out of 2514) and is not directly operationalised in this JSON.
		// The regression-checker's verdict rules cover both layers
		// because per-validator pass counts are also tracked.
		"pass": 3134,
		"fail": 1825,
		"total": 4959
	}
}
```

**Invariants**:

- Every `failingKinds` array is sorted (deterministic ordering for clean diffs).
- Every `failingByKind` object's keys are sorted; each kind's failure-id list is in declaration order from the fixture file.
- `totals.pass + totals.fail === totals.total`; spot-checked by the regression-checker.
- The JSON conforms to the schema in [contracts/baseline-json.md](./contracts/baseline-json.md).

**State transitions**:

- **Initial** (commit #1): Captured at HEAD of `012-rust-core-port` after `b4ccc6cc`. Encodes the 16 known TS-mode failures and the native 0-floor pattern.
- **Per cluster commit**: One or more `validators[grammar].*.pass` counts increase, corresponding `failingKinds` shrink. `parityFixtures` follows. `totals.fail` decreases.
- **Final** (US2 complete): `totals.fail` for the TS-mode file is 0; all `failingKinds` arrays are empty.
- **Final** (US3 partial): Native-mode `validators[grammar].roundtrip.pass` and `astMatchPass` are above 0 across all 3 grammars, reaching at least 50% of the corresponding TS-mode counts.

**Regression rule**: For any field path `$.grammars[*].validators[*].pass` or `$.grammars[*].parityFixtures.pass`, the new value MUST be greater than or equal to the value in the parent commit's file. CI rejects any drop.

---

## Entity: FailureCluster

**Purpose**: A logical group of failing tests that share a single root cause. Not persisted as data — exists only as a documentation entity in this spec, in commit messages, and in `tasks.md` (Phase 2 output).

**Composition**:

- **Name** — short identifier (e.g. `python-comprehensions`, `rust-patterns`, `factory-rt`).
- **Members** — list of failing test names + their `failingKinds` references in the baseline JSON.
- **Root-cause hypothesis** — one paragraph from research / memory note inspection. Updated to "confirmed root cause" once the fix lands.
- **Touch surface** — list of files in `packages/codegen/src/*` and `packages/{lang}/overrides.ts` that the fix modifies. Used to detect cross-cluster scope drift.
- **Waterfall set** (post-fix) — kinds outside the original cluster whose counts also moved up. Listed in the commit message per FR-002 waterfall handling.

**Lifecycle**: Identified during planning → probed before code change → fixed in one commit → marked closed in `tasks.md` once the regression-checker confirms zero count drops elsewhere.

---

## Entity: ClusterCommit

**Purpose**: A single git commit that represents one closed FailureCluster. Not a stored entity per se; the shape is enforced by FR-002 + spec assumptions.

**Required content per commit**:

- Code changes confined to `packages/codegen/src/*` and/or `packages/{rust,typescript,python}/overrides.ts` (FR-003).
- Regenerated output across all three grammars (FR-006), checked in.
- Updated `specs/016-parity-regressions/baselines/{ts,native}.json` matching the new pass counts.
- If applicable, updated/deleted memory note(s) per FR-008.
- Commit message including:
  - Cluster name + member-test count (e.g. "python-comprehensions: 6 → 0 fail").
  - Before/After table (per-grammar `fromPass`, `covPass`, `rtPass`, `rtAstMatch`, `factoryPass` for both backends).
  - Waterfall list, if any, in the form "+N incidental waterfalls (kinds X, Y, Z…)".

**CI gates per commit** (all phase-0 invariants from spec FR-007 + the new regression-checker):

- `pnpm -r run type-check` passes (tsgo strict).
- `oxlint --deny-warnings packages/{rust,typescript,python}/src` reports 0 warnings.
- `npx tsx packages/tools/src/validate/jinja.ts` reports 0 violations.
- `pnpm test` matches the committed `baselines/ts.json` exactly (zero unexpected diffs).
- New regression-checker job: `collect-baseline` output diffed against parent commit's JSON shows no count drops.

---

## Relationships

```text
BackendBaseline  ──── 1:1 ───→  backend (typescript | native)
BackendBaseline  ──── 1:N ───→  GrammarEntry (rust | typescript | python)
GrammarEntry     ──── 1:N ───→  ValidatorResult (from | coverage | roundtrip | factoryRoundtrip)
GrammarEntry     ──── 1:1 ───→  ParityFixtures
FailureCluster   ──── 1:N ───→  failing tests (referenced by failingKinds in BackendBaseline)
ClusterCommit    ──── 1:1 ───→  FailureCluster (closes it)
ClusterCommit    ──── 1:1 ───→  BackendBaseline updates (atomic with code change)
```

No new types in `@sittir/types` — every shape above derives from existing validator return types or is a thin script-local interface in `collect-baseline.ts`.
