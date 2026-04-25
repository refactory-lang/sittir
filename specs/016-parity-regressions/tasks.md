# Tasks: Parity & Regressions

**Input**: Design documents from `/specs/016-parity-regressions/`
**Branch**: `016-parity-regressions`
**Prerequisites**: spec.md, plan.md, research.md, data-model.md, contracts/baseline-json.md, quickstart.md

**Tests**: Existing vitest suite + new regression-checker CI step are the test surface. No new test scaffolding requested — cluster fixes are validated by existing tests flipping from fail to pass, captured in the baseline JSON.

**Organization**: Tasks grouped by user story. US1 (baseline tooling) is foundational and MUST complete before any cluster work. US2 (TS-mode floor → 0) and US3 (native floor > 0) run after US1, with US3 woven into US2's cluster commits where the same root cause spans backends.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete dependencies)
- **[Story]**: US1, US2, US3 — maps to spec.md user stories
- Every task includes the exact path it touches

## Path Conventions

This is a pnpm workspace. Touch surface for this feature:
- Codegen pipeline: `packages/codegen/src/{compiler,emitters,dsl,validate,scripts}/`
- Per-grammar overrides (hand-authored): `packages/{rust,typescript,python}/overrides.ts`
- Per-grammar generated output (codegen-only): `packages/{rust,typescript,python}/src/`, `packages/{rust,typescript,python}/templates/*.jinja`
- Spec artifacts: `specs/016-parity-regressions/baselines/{ts,native}.json`
- CI: `.github/workflows/ci.yml`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No new package init needed — this feature layers on top of an existing pnpm workspace. Setup tasks here are spec-side scaffolding only.

- [X] T001 Verify branch `016-parity-regressions` is checked out and based on `012-rust-core-port`@`b4ccc6cc`. Run `git status` + `git log --oneline -3`; confirm clean tree and expected base.
- [X] T002 Create directory `specs/016-parity-regressions/baselines/` (already created by Phase 1 plan) and add `.gitkeep` so the dir lands in commit #1 even if both JSON files end up in the same commit.

**Checkpoint**: Branch + spec-side dirs ready.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The baseline-collection script and the CI regression-checker are blocking prerequisites — every cluster commit depends on both. This phase is User Story 1's deliverable in execution-order terms; it lands as commit #1 on the branch.

**⚠️ CRITICAL**: No cluster fix (US2 / US3) can begin until US1's tooling is in place — the per-commit baseline JSON contract has no force without it.

> **Note**: Tasks T003–T010 below are User Story 1's implementation tasks. They appear in this Foundational section because the rest of the feature blocks on them, matching the spec's priority structure (US1 = P1, baseline-tooling-first).

### User Story 1 — Establish a measurable starting baseline (Priority: P1)

**Goal**: A single deterministic command produces `specs/016-parity-regressions/baselines/{ts,native}.json` reflecting the current corpus-validator pass/fail state. CI gains a regression-checker job that fails any PR which drops a count.

**Independent Test**: Per spec — a fresh checkout of `016-parity-regressions` after this phase has the script + initial JSONs; running the script twice in a row produces byte-identical output (determinism); a contrived count-drop in a hand-edited JSON makes CI fire red.

- [X] T003 [US1] Create `packages/codegen/src/scripts/collect-baseline.ts` script that imports the four corpus validators (`validateRoundTrip`, `validateFromCorpus`, `validateFactoryRoundtrip`, `readnode-roundtrip`) from `packages/codegen/src/validate/*.ts`, runs each against all three grammars (rust, typescript, python), and prints the resulting `BackendBaseline` JSON to stdout.
- [X] T004 [US1] In `collect-baseline.ts`, select the read handle via `buildReadHandle(grammar, tree, source)` from `packages/codegen/src/validate/common.ts` so the script honours `SITTIR_BACKEND` and produces TS-mode counts when unset/`typescript`, native counts when `native`.
- [X] T005 [US1] In `collect-baseline.ts`, also collect parity-fixture results by importing the fixture-render machinery from `packages/{rust,typescript,python}/tests/parity.test.ts` (factor out the fixture iteration if needed; do NOT shell out to vitest). Group failures by `$type` for the `failingByKind` map per `contracts/baseline-json.md`.
- [X] T006 [US1] Implement deterministic serialisation in `collect-baseline.ts`: 4-space indent, `\n` line endings, sorted keys at every level, sorted `failingKinds` arrays, sorted `failingByKind` keys (failure-id values stay in fixture order). Spot-check by running twice — output MUST be byte-identical.
- [X] T007 [P] [US1] Run `SITTIR_BACKEND=typescript npx tsx packages/codegen/src/scripts/collect-baseline.ts > specs/016-parity-regressions/baselines/ts.json` and verify the output reproduces the 16 known TS-mode failures: 6 python comprehensions, 5 rust patterns, 1 factory-rt, 1 ts coverage, 3 dsl tests.
- [X] T008 [P] [US1] Run `SITTIR_BACKEND=native npx tsx packages/codegen/src/scripts/collect-baseline.ts > specs/016-parity-regressions/baselines/native.json` and verify the output reproduces the native 0-floor pattern (most floors at zero, render-template parity gaps for `source_file`, `function_item`, `let_declaration` etc.).
- [X] T009 [US1] Add a new GitHub Actions job `regression-checker` to `.github/workflows/ci.yml`. The job runs after the existing test step; checks out the PR base, runs `collect-baseline` for both backends, diffs against `<head>:specs/016-parity-regressions/baselines/<backend>.json`, and exits 1 on any count drop per the verdict rules in `contracts/baseline-json.md`. (TS-mode job landed in commit `285f6585`; native-mode sibling job `regression-checker-native`, gated on `napi-build` for the `.node` artifacts, landed in this follow-up after spec-reviewer found that the original commit's "deferred to rust-parity / napi-build" rationale was inaccurate — those jobs run `--ignored` parity tests under `continue-on-error: true` and never read the baseline files.)
- [X] T010 [US1] Commit and push commit #1 with subject `016/baseline: collect-baseline script + initial ts/native JSONs + CI regression-checker`. Open PR `#016` against `012-rust-core-port` (NOT `master`). Verify CI runs the new job and passes (no count drops vs the brand-new files because they're identical to themselves).

**Checkpoint**: Tooling ready — cluster work can now begin in any order, with each commit measured against the committed baseline.

---

## Phase 3: User Story 2 — Lift the TS-mode corpus floor above 16-failure baseline (Priority: P1)

**Goal**: Drive `baselines/ts.json` `totals.fail` from 16 to 0 across five cluster commits. Each cluster commit follows the per-cluster workflow in `quickstart.md`: probe → fix at the codegen pipeline / overrides → regenerate → re-collect baseline → commit with Before/After table.

**Independent Test**: Per spec — final TS-mode test run reports zero failures; `baselines/ts.json` shows `totals.fail: 0` and every `failingKinds` array is empty.

> **Cluster ordering** (high-leverage first, per research.md):
> 1. python-comprehensions × 6
> 2. rust-patterns × 5
> 3. factory-rt × 1
> 4. ts-template-coverage × 1
> 5. dsl-tests × 3 (split into 3 sub-tasks because the underlying fixes are unrelated)

> **Per-cluster pattern** — every cluster has these tasks:
> - Probe to confirm root-cause hypothesis
> - Apply fix at codegen pipeline OR `overrides.ts`
> - Regenerate all 3 grammars
> - Verify phase-0 invariants (build / lint / jinja-check / api-surface)
> - Re-run collect-baseline for both backends
> - Commit with Before/After table + waterfall list

### Cluster A — python-comprehensions (6 fixtures)

- [ ] T011 [US2] Run `npx tsx packages/codegen/src/scripts/probe-kind.ts --grammar python --kind list_comprehension --reparse --pretty` and `--kind generator_expression`, `--kind dictionary_comprehension`, `--kind set_comprehension`. Capture the diff between expected fixture output and actual `render(node)` output for each. Compare against `project_template_quality_gap.md` and `project_multi_separator_templates.md` to validate or update the root-cause hypothesis.
- [ ] T012 [US2] Apply the cluster-A root-cause fix in `packages/codegen/src/{compiler,emitters,dsl}/*.ts` (specific path determined by T011's findings — likely the multi-separator template walker per `project_multi_separator_templates.md`). If grammar-specific shape patches are needed, also edit `packages/python/overrides.ts`. Do NOT touch generated output.
- [ ] T013 [US2] Regenerate all three grammars: `npx tsx packages/codegen/src/cli.ts --grammar {rust,typescript,python} --all --output packages/{lang}/src` (run all three).
- [ ] T014 [US2] Verify phase-0 invariants: `pnpm -r run type-check`; `npx oxlint --deny-warnings packages/{rust,typescript,python}/src`; `npx tsx scripts/check-jinja-templates.ts`. Fix any regression in the same patch before committing.
- [ ] T015 [US2] Re-collect baselines: `SITTIR_BACKEND=typescript npx tsx packages/codegen/src/scripts/collect-baseline.ts > specs/016-parity-regressions/baselines/ts.json` and the native counterpart. Verify `git diff specs/016-parity-regressions/baselines/` shows only count-up movement (FR-002 + spec edge case). Capture incidental waterfalls per Q5/A.
- [ ] T016 [US2] Run `SITTIR_BACKEND=typescript pnpm test`; confirm 6 python parity fixtures now pass and `totals.fail` is 16 minus 6 minus any waterfalls. Commit with subject `016/python-comprehensions: <one-line summary>` plus Before/After table per quickstart step 9. Update or delete `project_template_quality_gap.md` / `project_multi_separator_templates.md` per FR-008.

### Cluster B — rust-patterns (5 fixtures)

- [ ] T017 [US2] Run `npx tsx packages/codegen/src/scripts/probe-kind.ts --grammar rust --kind mut_pattern --reparse --pretty` (and `--kind captured_pattern`). Compare actual vs expected; the parity fixture errors show "expected 'mut e', actual 'mut'" — confirms missing inner-expression rendering. Validate against `project_choice_with_literals_cluster.md` and `project_walker_hotspot.md`.
- [ ] T018 [US2] Apply the cluster-B fix at the walker / template-emitter level in `packages/codegen/src/compiler/rule.ts` or `packages/codegen/src/emitters/templates.ts` (path determined by T017). If per-kind override needed, edit `packages/rust/overrides.ts` (file is already open in IDE). Do NOT touch generated output.
- [ ] T019 [US2] Regenerate all three grammars (same command as T013).
- [ ] T020 [US2] Verify phase-0 invariants (same checks as T014).
- [ ] T021 [US2] Re-collect baselines (same as T015). Verify count-up movement only.
- [ ] T022 [US2] Run tests; confirm 5 rust parity fixtures now pass. Commit with subject `016/rust-patterns: <one-line summary>` + Before/After + waterfall list. Update memory notes per FR-008.

### Cluster C — codegen factory round-trip integration (1 test)

- [ ] T023 [US2] Inspect `packages/codegen/tests/integration/validate-all.test.ts` "rust e2e validation > round-trip validation > factory round-trip" failure output. Cross-reference with `project_factory_validator_is_passthrough.md` (memory note flagged factory-rt validator behaviour previously).
- [ ] T024 [US2] Fix the integration test failure at the codegen / factory-emit level: `packages/codegen/src/emitters/factories.ts` and/or `packages/codegen/src/validate/factory-roundtrip.ts`. Do NOT skip the test or weaken assertions.
- [ ] T025 [US2] Regenerate, verify invariants, re-collect baselines, run tests (T013/T014/T015 pattern). Commit `016/factory-rt: <summary>` + Before/After. Update or delete relevant memory notes per FR-008 (`project_factory_validator_is_passthrough.md` likely candidate).

### Cluster D — ts-template-coverage (138 → ≥140)

- [ ] T026 [US2] Run `pnpm --filter @sittir/codegen test src/__tests__/corpus-validation.test.ts` and locate which 2+ TypeScript kinds are missing templates (the floor is 140; current 138). Use `npx tsx packages/codegen/src/scripts/counts.ts` if helpful for kind enumeration.
- [ ] T027 [US2] Add render-template emission for the missing kinds via `packages/codegen/src/emitters/templates.ts` walker logic and/or `packages/typescript/overrides.ts` if grammar-shape patches are needed.
- [ ] T028 [US2] Regenerate, verify invariants, re-collect baselines, run tests. Confirm ts coverage ≥140 with no rust/python coverage regressions. Commit `016/ts-template-coverage: <summary>` + Before/After. Update or delete relevant memory notes per FR-008.

### Cluster E — dsl tests (3 fixtures, unrelated)

- [ ] T029 [US2] Fix `packages/codegen/src/__tests__/refine-emit.test.ts > types the per-form factory parameter with the narrowed Config`. Inspect emitter output for the per-form factory parameter type; align with the test's expectation. May involve `packages/codegen/src/emitters/refine-emit.ts` or `factories.ts`.
- [ ] T030 [US2] Fix `packages/codegen/src/dsl/__tests__/enrich.test.ts > kind-to-name field wrapping > skips when a field with the same name already exists`. The stderr "skipped kind-to-name on …" message wasn't emitted — adjust `packages/codegen/src/dsl/enrich.ts` to emit it (or update the test if the message intent changed).
- [ ] T031 [US2] Fix `packages/codegen/src/dsl/__tests__/transform-path.test.ts > unwraps an enrich-inferred field on the original member before re-wrapping`. The test expects `{type: 'symbol', name: 'expr'}` but receives `{type: 'field', name: 'inferred_name'}` — investigate transform-path's interaction with enrich-inferred fields in `packages/codegen/src/dsl/transform/transform-path.ts`.
- [ ] T032 [US2] After all three dsl fixes, regenerate (no codegen output should change since these are pipeline-internal fixes, not template-affecting), verify invariants, re-collect baselines, run tests. May commit T029/T030/T031 as one combined `016/dsl-fixes: <summary>` commit OR three small commits — use the combined approach if the fixes share any helper code; three commits otherwise. Each must carry Before/After. Update or delete relevant memory notes per FR-008.

**Checkpoint**: TS-mode `totals.fail: 0` in `baselines/ts.json`. SC-001 met.

---

## Phase 4: User Story 3 — Lift the native-mode corpus floor above zero (Priority: P2)

**Goal**: Bring native-mode (`SITTIR_BACKEND=native`) corpus floors from 0 to ≥50% of TS-mode pass rate per grammar. The native-mode improvements MAY have already been folded into US2 cluster commits where template intent is shared across backends (per research decision #8). This phase covers the residual native-only gaps.

**Independent Test**: Per spec — `probe-kind --grammar rust --source 'fn main() {}' --engine both` reports both engines agreeing; `baselines/native.json` shows full-roundtrip and AST-match floors above zero across all three grammars; TS-mode `baselines/ts.json` did not regress on any count.

### Cluster F — native-only render gaps

- [ ] T033 [US3] Re-read `baselines/native.json` after Phase 3. Identify the 5 most-common kinds whose native render output diverges from TS render (use `probe-kind --engine both`). Memory notes likely candidates: `source_file`, `function_item`, `let_declaration`, plus 2 surfaced by US3-specific probing.
- [ ] T034 [US3] For each of the 5 kinds, locate the corresponding template emit path in `packages/codegen/src/emitters/templates.ts` AND the Rust render dispatcher under `packages/{lang}/rust-render/` (Rust crate that emits Askama templates for native). Diff TS vs Rust template behaviour to identify the dispatcher gap.
- [ ] T035 [US3] Apply fixes in `packages/codegen/src/emitters/rust-render.ts` (the Rust render emitter) and/or `packages/codegen/src/emitters/templates.ts` (the shared Jinja emitter). The fix is at the dispatcher / walker level — never hand-edit per-kind Rust template files. Per FR-005, target counts are determined by measurement; lower bound is 50% of TS-mode pass rate.
- [ ] T036 [US3] Regenerate all three grammars (T013 command). The Rust render crate also rebuilds via `cargo build` triggered by the napi build step (verify the `.node` files refresh).
- [ ] T037 [US3] Verify phase-0 invariants. Re-collect baselines for BOTH backends — confirm native counts moved up AND TS counts unchanged.
- [ ] T037a [US3] Re-run `npx tsx packages/codegen/src/scripts/probe-kind.ts --grammar rust --source 'fn main() {}' --engine both --reparse` and verify the `compareEngines.summary` field reads "TS and native engines agree on render output". Repeat the both-engine probe for the other kinds named in the spec US3 acceptance scenario (`function_item`, `let_declaration`) and any other high-traffic kinds the cluster targeted. Document the probe results in the cluster-commit message — closes spec acceptance scenario US3#1.
- [ ] T038 [US3] Run `SITTIR_BACKEND=native pnpm test`; verify floors reach the SC-002 target (full-RT + AST-match > 0 across all 3 grammars; ≥50% of TS-mode rate). Commit `016/native-render-gaps: <summary>` + Before/After (both backends). Update or delete relevant memory notes per FR-008.

### Cluster G — native polymorph null-forms (out-of-scope unless waterfall)

- [ ] T039 [US3] If after T038 the native floors are still below SC-002, investigate the polymorph null-forms cluster (`project_recursive_factory_cluster.md` flags ~30 forms with `modelType=none` that render-crash). Otherwise SKIP this task and document the deferral in the spec's edge-case section.
- [ ] T040 [US3] If T039 is run: apply the null-form fix at `packages/codegen/src/compiler/assemble.ts` (the modelType classifier) and/or template emission. Regenerate, verify invariants, re-collect, run tests, commit per the cluster pattern. Update or delete `project_recursive_factory_cluster.md` per FR-008.

**Checkpoint**: Native floors above zero across all 3 grammars; ≥50% of TS-mode pass rate per grammar. SC-002 met. Final `baselines/{ts,native}.json` reflect the full-feature end state.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Verify the feature's measurable success criteria are all met; clean up working artifacts; finalise PR description.

- [ ] T041 Run the full test suite under both backends one final time: `SITTIR_BACKEND=typescript pnpm test` (expect 0 failures), `SITTIR_BACKEND=native pnpm test` (expect floors at ≥50% of TS-mode). Record final pass counts.
- [ ] T042 Verify `git diff --quiet` after a clean regen across all three grammars (SC-006). If diffs appear, the last cluster commit didn't capture all regen changes — ship a follow-up commit.
- [ ] T043 Run a dry regression-checker pass against the entire branch: `git log --oneline 012-rust-core-port..HEAD` enumerates the cluster commits; for each, replay `collect-baseline` against that commit and diff against its parent. SC-004 means zero count drops appear anywhere in this trace.
- [ ] T044 Update `MEMORY.md` index per FR-008 — every cluster fix should have either deleted a memory note (cluster fully closed) or added a one-line "deferred to follow-up" entry. Re-confirm there are no stale notes pointing at clusters this feature closed.
- [ ] T045 Finalise PR `#016` description: include the final TS-mode and native-mode count summary table (initial → final per grammar), list of cluster commits with one-line subject each, link to the baseline JSON in the branch tip. Mark PR ready for review.
- [ ] T046 If/when PR `#12` (`012-rust-core-port`) merges to master, GitHub auto-rebases `#016`. After rebase, re-run T041–T043 once more locally to confirm no breakage from the rebase. Push.

---

## Dependencies

```text
T001-T002  (Phase 1 setup — branch state)
   ↓
T003 → T004 → T005 → T006   (US1 script implementation, sequential)
   ↓
T007 [P] ─┬─→ T009 → T010   (US1 produce JSONs, then CI step + commit)
T008 [P] ─┘
   ↓
[Cluster A: T011 → T012 → T013 → T014 → T015 → T016]    (US2 python)
   ↓
[Cluster B: T017 → T018 → T019 → T020 → T021 → T022]    (US2 rust patterns)
   ↓
[Cluster C: T023 → T024 → T025]                          (US2 factory-rt)
   ↓
[Cluster D: T026 → T027 → T028]                          (US2 ts coverage)
   ↓
[Cluster E: T029 [P], T030 [P], T031 [P] → T032]         (US2 dsl)
   ↓
[Cluster F: T033 → T034 → T035 → T036 → T037 → T038]    (US3 native gaps)
   ↓
[Cluster G: T039 → T040]                                 (US3 null-forms, conditional)
   ↓
[Polish: T041 → T042 → T043 → T044 → T045 → T046]
```

**Cluster A–E within US2 are sequential** by branch-history convention (each cluster's commit lands on the prior cluster's tip; each cluster reads from the latest committed baseline JSON to compute its Before snapshot). They could in principle run on parallel branches, but the per-cluster waterfall handling and zero-regression contract make sequential cleaner.

**T029, T030, T031 are mutually [P]** within Cluster E — three independent dsl tests, three independent files. They can be solved in any order or simultaneously, then commit-batched in T032.

**T007 and T008 are [P]** — two backends, two independent file writes.

---

## Parallel Execution Examples

### Within Cluster E (US2 dsl fixes)

```sh
# Three contributors / three concurrent agent windows, each picks one:
# Window 1: T029 — refine-emit.test.ts
# Window 2: T030 — enrich.test.ts kind-to-name skip
# Window 3: T031 — transform-path.test.ts unwrap

# Then converge on T032 to combine + commit
```

### Within US1 baseline collection

```sh
# Once T006 (deterministic serialisation) lands, run T007 and T008 in two terminals:
SITTIR_BACKEND=typescript npx tsx packages/codegen/src/scripts/collect-baseline.ts > specs/016-parity-regressions/baselines/ts.json &
SITTIR_BACKEND=native     npx tsx packages/codegen/src/scripts/collect-baseline.ts > specs/016-parity-regressions/baselines/native.json &
wait
```

---

## Implementation Strategy — MVP First, Incremental Delivery

**MVP** = US1 alone (T001–T010). Branch ships with:
- A working baseline-collection script
- Two committed JSONs reflecting the current state
- A CI gate that prevents regressions

This is genuinely useful by itself: it gives every future PR a regression check, even if no cluster fixes follow on this branch.

**Incremental delivery beyond MVP**: each cluster commit (T016, T022, T025, T028, T032, T038, T040) is independently mergeable. If review feedback delays Cluster B, Clusters A + C + D + E can still ship. The base-branch stack (against `012-rust-core-port`) handles the ordering — every cluster commit appears in the same PR thread but lands on master in isolation if the PR is reviewed commit-by-commit.

**Suggested cadence**: one cluster per working day (~4 hours of focused work each — guidance, not a contract per `/speckit.superb.review`'s SC-006 → quickstart move), plus baseline tooling on day 1. End-to-end timeline ≈ 7 working days for the full feature, assuming no cluster spawns a recursive investigation that splits it.

---

## Format Validation

All 46 tasks above use the required checklist format:
- ✅ `- [ ]` checkbox prefix
- ✅ Task ID (T001–T046)
- ✅ `[P]` parallel marker where applicable
- ✅ `[Story]` label (US1 / US2 / US3) on phase 3+ tasks; absent on Setup/Foundational/Polish per format rule
- ✅ Concrete file path or path-equivalent (validator name, package directory) in every task description

**Total task count**: 46
**Per user story**:
- US1 (P1, foundational): 8 (T003–T010)
- US2 (P1, TS-mode floor): 22 (T011–T032)
- US3 (P2, native floor): 8 (T033–T040)
- Setup: 2 (T001–T002)
- Polish: 6 (T041–T046)

**Parallel opportunities identified**: T007/T008 within US1; T029/T030/T031 within US2 Cluster E. Most cluster work is sequential by zero-regression contract.

**Independent test criteria**: each user story's "Independent Test" line is captured under the phase header above and matches spec.md's user-story acceptance criteria.

**Suggested MVP scope**: User Story 1 (T001–T010). Lands the baseline tooling + initial JSONs + CI regression-checker, all of which deliver value standalone even if no cluster fix follows on this branch.
