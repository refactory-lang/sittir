# Phase 0 Research: Parity & Regressions

**Feature**: `016-parity-regressions`
**Date**: 2026-04-25
**Plan**: [plan.md](./plan.md)

No `NEEDS CLARIFICATION` markers in the Technical Context — every decision was either pinned by spec input, locked by `/speckit.superb.clarify` (six choices), or determined by existing project tooling. This document records the load-bearing decisions and the alternatives considered.

---

## Decision: Cluster ordering — high-leverage first

**Decision**: Land cluster fixes in this order:

1. Python comprehensions × 6 (`generator_expression`, `list_comprehension` × 2, `dictionary_comprehension`, `set_comprehension`)
2. Rust patterns × 5 (`mut_pattern` × 3, `captured_pattern` × 2)
3. Codegen factory round-trip integration × 1
4. TypeScript template coverage 138 → ≥140 × 1
5. Codegen DSL tests × 3 (refine-emit, enrich kind-to-name, transform-path)

**Rationale**: Spec exists because parity work is the load-bearing problem. The python-comprehension cluster is the highest-leverage fix (6 tests, suspected single shared root cause); landing it on commit #2 confirms the "shared root cause → many tests pass" hypothesis fast. If the hypothesis fails, that signal also arrives early — better to discover surprise complexity on commit #2 than commit #5. DSL tests are bookkeeping that don't block anything; saving them for last preserves momentum on the parity arc.

**Alternatives considered**:

- **By size, smallest first** (3 dsl → 1 ts cov → 1 factory-rt → 5 rust → 6 python): rejected because it puts 3 commits of bookkeeping ahead of any signal-bearing parity work.
- **Easy wins first** (1 ts cov → 3 dsl → 1 factory-rt → 6 python → 5 rust): rejected because it defers the architectural insight from python/rust clusters that may inform native parity (US3) work.

---

## Decision: Tooling-first — baseline collection lands as commit #1

**Decision**: Commit #1 on `016-parity-regressions` contains only `packages/codegen/src/scripts/collect-baseline.ts` plus the initial `specs/016-parity-regressions/baselines/{ts,native}.json`. No fixes. Subsequent commits each carry one cluster fix and the updated JSON in lock-step.

**Rationale**: The spec's contract (per-commit baseline JSON, regression-checker-verified) requires the tooling to exist before the contract has teeth. Doing it last makes the whole approach retroactive; the regression-checker can't catch a drop on commit #2 if commit #1 was the cluster fix. Tooling-first is also lower-risk: ~50–100 lines of harness with no behaviour change is mechanical work that derisks the rest of the feature.

**Alternatives considered**:

- **Fix-driven baseline** (piggyback the JSON onto the first cluster commit): rejected because conflating tooling and fix in the same commit makes the regression-checker's first reference point a moving target.
- **Manual baseline + script later**: rejected because SC-004 (zero regressions) becomes unverifiable for the first few cluster commits — you're trusting vitest output reads.

---

## Decision: `collect-baseline.ts` lives under `packages/codegen/src/scripts/`

**Decision**: New script at `packages/codegen/src/scripts/collect-baseline.ts`, sibling to `probe-kind.ts` and `probe-stages.ts`. Invoked via `npx tsx`.

**Rationale**: Matches existing convention for diagnostic scripts. Reuses validator infrastructure (`loadCorpusEntries`, `loadLanguageForGrammar`, `treeHandle`, `nativeTreeHandle`, `validateRoundTrip`, `validateFromCorpus`, `validateFactoryRoundtrip`, `readnode-roundtrip`) directly without crossing package boundaries. Output path stays at `specs/016-parity-regressions/baselines/<backend>.json` regardless of script location.

**Alternatives considered**:

- **Repo-root `scripts/collect-baseline.ts`**: rejected because it pulls validator functions across the codegen-package boundary (extra import paths) and adds another scripts directory contributors must know about.
- **Bash wrapper around `pnpm test --reporter=json`**: rejected because vitest's reporter contract isn't stable across versions; brittle long-term.

---

## Decision: Regression-checker enforced as a CI step

**Decision**: New GitHub Actions job in `.github/workflows/ci.yml` runs `collect-baseline` against the PR head, diffs against `git show <BASE>:specs/016-parity-regressions/baselines/*.json`, fails CI if any count dropped. Slots next to existing `Check .jinja templates` and `Lint generated packages` steps.

**Rationale**: Authoritative — runs on every PR regardless of local config. Reuses CI's existing test-running setup. Catches the same problem a pre-commit hook would, with one extra job and zero contributor-side setup. Standard convention on this repo for "did this change break anything."

**Alternatives considered**:

- **Pre-commit Git hook**: rejected because it requires per-contributor installation and doesn't catch drift in CI for contributors who skip the hook. Could add later as a nice-to-have.
- **Vitest test that asserts `current ≥ committed`**: rejected because the test loads the file the same commit just wrote — circular reference. Also flaky risk if reading vs writing ordering differs.

---

## Decision: Waterfall handling — capture incidental wins in the same commit

**Decision**: When a cluster fix incidentally improves counts beyond its declared cluster (e.g. python-comprehension fix unlocks dict-builder fixtures), the same commit's Before/After table lists ALL newly-passing kinds. Commit message notes "+N incidental waterfalls (kinds X, Y, Z…)".

**Rationale**: The JSON is ground truth, and the commit message is the natural place to note "this fix turned out broader than expected." Splitting commits to separate "intentional" from "downstream" effects is bookkeeping that adds noise without changing the regression-checker's verdict. Renaming clusters mid-feature treats the spec as a contract when it's a working plan.

**Alternatives considered**:

- **Split into two commits** (cluster-fix + incidental-update): rejected as bookkeeping with no signal beyond what the JSON diff already shows.
- **Rename clusters when waterfalls exceed scope**: rejected — the spec churn is not worth the truth-tracking it provides.

---

## Decision: PR stacking — `#016` against `012-rust-core-port`, not `master`

**Decision**: Open PR `#016` with base branch `012-rust-core-port`. When PR `#12` merges to master, GitHub auto-rebases `#016`. Cluster commits land on top of `012`'s tip until `#12` lands.

**Rationale**: PR `#12` is blocked by token-permission issues that need admin coordination — we cannot reliably predict when it merges. Stacking decouples this feature's progress from that timing. The baseline-tooling commit is small enough that it doesn't muddy `#012`'s review even if it sits behind it temporarily. Standard pattern when downstream work needs to continue without waiting on a merge.

**Alternatives considered**:

- **Wait for `#12` to merge** before any `#016` commits: rejected because the wait is unbounded, dependent on admin action you can't fully control.
- **Fold baseline tooling into `#12`**: rejected because it grows `#12`'s scope right when you're trying to merge it; "one feature, one PR" boundary is a deliberate guard rail.

---

## Decision: Treat known memory-noted clusters as starting hypotheses, not contracts

**Decision**: Re-inspect each cluster against the actual current failure messages and codegen output before committing the fix. Memory notes (`project_recursive_factory_cluster.md`, `project_template_quality_gap.md`, `project_multi_separator_templates.md`, `project_choice_with_literals_cluster.md`) are starting points — they describe the cluster groupings to within roughly 80% per the assumption captured in the spec.

**Rationale**: The memory notes were written across multiple sessions and may reflect outdated state (clusters that were partially fixed, walker behaviour that has since changed, override patterns that no longer apply). Trusting them blindly risks fixing a phantom problem. Each cluster fix begins with a probe (e.g. `npx tsx packages/codegen/src/scripts/probe-kind.ts --grammar X --kind Y --reparse`) that confirms the failure shape before any code change.

**Alternatives considered**:

- **Treat memory notes as contract**: rejected per FR-008 — notes are updated/deleted as clusters land, not relied upon as-is.
- **Discard memory notes entirely**: rejected because they encode hard-won investigation context that saves probe time per cluster.

---

## Decision: Native parity work folded into the same cluster commit when template intent is shared

**Decision**: When a TS-mode cluster fix (e.g. python comprehensions) corresponds to a render-template intent that also exists on the native (Rust Askama) side, the same commit fixes both backends. Native template emit lives under `packages/codegen/src/emitters/templates.ts` (jinja for both backends) plus the per-grammar Rust render module under `rust/crates/sittir-{lang}/src/render/`; the codegen pipeline owns both.

**Rationale**: Both backends consume the same per-rule template intent (assumption in spec). A cluster fix that touches TS render but leaves native broken creates an artificial split — the next commit would have to reopen the same investigation. The before/after table covers both backends per FR-002, so the commit shape doesn't grow.

**Alternatives considered**:

- **TS-only first, native as a follow-up cluster pass**: rejected because it doubles the commit count for shared root-cause clusters with no diagnostic benefit.
- **Native-only commits separate from TS commits**: rejected for the same reason; also creates ambiguous attribution when waterfalls cross backends.

---

## Open Questions

None at this stage. Each of the six `/speckit.superb.clarify` decisions is captured above with rationale and alternatives. Remaining unknowns (exact root cause of each cluster, exact size of waterfalls, precise native render gap inventory) are resolved during cluster execution, not in planning — they're investigation artifacts, not design choices.
