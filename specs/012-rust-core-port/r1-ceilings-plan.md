# R1 — Ceilings-to-Zero Prerequisite Plan

> **For agentic workers:** Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the gap between the corpus-validation `FLOORS` and `LEGACY_BASELINE` numbers across all three grammars so that feature 012 (Rust port) can pass its T001 decision gate and begin implementation.

**Architecture:** Work entirely inside the existing codegen pipeline. Each failing cluster maps to one or more emitters/walkers under `packages/codegen/src/`. Fixes are: (a) identify a cluster from the validator output, (b) trace to the owning emitter/walker, (c) fix at the source of truth (never hand-edit generated output — Constitution Principle III), (d) regenerate, (e) raise the FLOOR value in the pinning test so the gain is locked in.

**Tech Stack:** TypeScript 6.0.2 + pnpm + vitest. Validators under `packages/codegen/src/validate/`. Pinning test at `packages/codegen/src/__tests__/corpus-validation.test.ts`. No new tools; this is ongoing cleanup.

**Owner-facing completion signal:** In `corpus-validation.test.ts`, for every grammar, the FLOOR for `factoryPass`, `factoryAstMatchPass`, `fromPass`, and `rtPass` (full round-trip) has reached a pre-agreed absolute target (see §"Completion signal" below). At that point, spec 012 T001 passes and implementation of T002+ may begin.

---

## Scope check

This is one workstream (cleanup of generated-output correctness across the three grammars, driven by a single pinning test). It's correctly a single plan, not multiple sub-projects. The three grammars share the emitter pipeline; fixes often unblock multiple grammars at once.

---

## File structure

Files this plan touches. No new files expected — the emitters / walkers already exist; we fix them in place.

| File | Role | Expected change class |
|---|---|---|
| `packages/codegen/src/__tests__/corpus-validation.test.ts` | Pinning test (FLOORS + LEGACY_BASELINE) | Raise FLOOR per grammar after each landed cluster |
| `packages/codegen/src/validate/factory-roundtrip.ts` | Validates factory build → render → reparse | Rarely modified; read to understand failure signal |
| `packages/codegen/src/validate/from.ts` | Validates `.from()` resolution | Rarely modified |
| `packages/codegen/src/validate/roundtrip.ts` | Validates full parse → readNode → render → reparse | Rarely modified |
| `packages/codegen/src/emitters/factories.ts` | Factory emission | Frequently — most clusters fix here |
| `packages/codegen/src/emitters/suggested.ts` | Overrides-suggested emission | Occasionally |
| `packages/codegen/src/compiler/template-walker.ts` | Template-string walker | Occasionally — polymorph / variant clusters |
| `packages/codegen/src/dsl/enrich.ts` | Enrich pass (spec 006) | Occasionally |
| `packages/codegen/src/polymorph-variant.ts` | Polymorph classification | For polymorph-null-form cluster |
| `packages/{rust,typescript,python}/overrides.ts` | Hand-authored per-grammar overrides | When a cluster is genuinely grammar-specific |

---

## Baseline inventory (as of 2026-04-22 — revised with direct validator run)

Direct-validator numbers (measured via `npx tsx /tmp/check-actual.mts`; the FLOORS in the pinning test are stale — they reflect a smaller-corpus era and are no longer binding).

| Grammar | Gate | Current actual | Legacy baseline | Gap | Load-bearing for FR-014? |
|---|---|---:|---:|---:|---|
| **Python** | factoryPass (non-recursive) | 197 / 889 | 92 / 99 | Exceeds legacy | No — factory not in FR-014 scope |
| Python | factoryPass (recursive, `SITTIR_VALIDATE_RECURSIVE=1`) | 123 / 889 | — | — | No — parallel track |
| Python | fromPass | 116 / 119 | 92 / 99 | Exceeds legacy | **Yes** — 3 failures remain |
| Python | rtPass (full round-trip) | **96 / 115** | — | **9 short of `rtTotal − 10` target (105)** | **Yes** — 19 failures |
| **Rust** | factoryPass (non-recursive) | 459 / 1026 | 112 / 135 | Exceeds legacy | No |
| Rust | factoryPass (recursive) | 432 / 1026 | — | — | No — parallel track |
| Rust | fromPass | 165 / 176 | 133 / 135 | Exceeds legacy | **Yes** — 11 failures |
| Rust | rtPass (full round-trip) | **118 / 136** | — | **8 short of target (126)** | **Yes** — 18 failures |
| **TypeScript** | factoryPass (non-recursive) | 419 / 952 | 119 / 123 | Exceeds legacy | No |
| TypeScript | factoryPass (recursive) | 330 / 952 | — | — | No — parallel track |
| TypeScript | fromPass | 144 / 152 | 118 / 123 | Exceeds legacy | **Yes** — 8 failures |
| TypeScript | rtPass (full round-trip) | **63 / 112** | — | **39 short of target (102). Biggest lever.** | **Yes** — 49 failures |

**Summary of outstanding debt that R1 gates on** (rtPass + fromPass only — see "Completion signal" for scope):
- **rtPass: 86 total failures** (python 19 + rust 18 + typescript 49). Primary R1 target.
- **fromPass: 22 total failures** (python 3 + rust 11 + typescript 8). Secondary R1 target; all grammars already exceed legacy pass count.
- **Factory recursive debt: ~1985 failures** across grammars. NOT part of R1 gate (see below). Tracked as an ongoing parallel cleanup workstream.
- Stale FLOOR numbers in `corpus-validation.test.ts` are a separate clerical cleanup — they can be raised to current actuals in a single-line PR after R1 lands. Not gating anything.

---

## Cluster inventory (from MEMORY.md + recent commits)

Each cluster below is a root-cause class; fixing one cluster typically closes 5–40 individual failing corpus entries. Ranked by estimated unblock-per-cluster.

### C1 — Polymorph "null forms" crashing render (~30 failures)
Root cause: walker over-expands choice-of-symbol, producing "null" polymorph forms (`mod_item_external` etc.) where `modelType=none` and the render pipeline crashes instead of dispatching.
Owner files: `packages/codegen/src/polymorph-variant.ts`, `packages/codegen/src/compiler/template-walker.ts`.
Affects: `rust/rtPass`, some `typescript/rtPass`.
Signal: failures with "null template" or render throwing on undefined branch.

### C2 — Python soft-keyword overreach (~15 failures)
Root cause: Python `match`, `print`, and other soft keywords are rejected as identifiers by the factory validator.
Owner files: `packages/codegen/src/emitters/factories.ts` (keyword detection), `packages/python/overrides.ts`.
Affects: `python/factoryPass`, `python/factoryAstMatchPass`, downstream `python/fromPass`.
Signal: test output naming the Python identifier that failed construction.

### C3 — TS primary_type nonsense variants (~18 redundant forms)
Root cause: 20 polymorph forms declared; 18 are structurally identical (`$$$CHILDREN` only). Walker emits redundant forms because polymorph detection uses choice-of-symbol instead of render-relevance.
Owner files: `packages/codegen/src/polymorph-variant.ts`, `packages/codegen/src/compiler/template-walker.ts`.
Affects: `typescript/rtPass` (cluster C3 is a major contributor to the 57 rtPass failures).
Signal: test output showing 18+ nearly-identical failure signatures in the `primary_type` family.

### C4 — Choice branches with differentiating literals (3 kinds, multi-failure)
Root cause: `function_type`, `impl_item`, `macro_definition` fail because the walker drops literals from non-primary branches. Needs polymorph split via `variant()` but is blocked by the field-wrapped-choice limitation (MEMORY.md `project_variant_field_wrapped_choice`).
Owner files: `packages/codegen/src/polymorph-variant.ts`, `packages/codegen/src/dsl/enrich.ts`.
Affects: `rust/factoryAstMatchPass`, `rust/rtPass`, cross-grammar if pattern repeats.
Signal: test failures on these specific three kinds with literal-drop diagnostics.

### C5 — Factory anon-token clause gap (3 impl_item failures)
Root cause: walker emits `!`/`?` clauses; factory config has no slot for anon tokens → round-trip fails. MEMORY.md flags this as a residual 6-of-32 item; defer unless user needs factory `!` support.
Owner files: `packages/codegen/src/emitters/factories.ts`.
Affects: `rust/factoryAstMatchPass` (small).
Signal: `impl_item` factory-ast failures.

### C6 — Python comments-as-extras (2 failures)
Root cause: Python's comment handling treats comments as "extras" in the tree, which the round-trip renderer doesn't preserve.
Owner files: Reparse wrapping in `packages/codegen/src/validate/common.ts` and/or render pipeline.
Affects: `python/rtPass`.
Signal: `python/rtPass` failures on source with inline comments.

### C7 — list_splat grammar field-drop (1 failure)
Root cause: single Python kind (`list_splat`) loses a field during factory-ast roundtrip.
Owner files: Likely a targeted override in `packages/python/overrides.ts`.
Affects: `python/factoryAstMatchPass` (1).
Signal: `list_splat` in test output.

### C8 — Python override-parser drift (MEMORY thread)
Root cause: spec 007 override-compiled parser produces different tree structure than the base parser; generated routing was built against the base parser. T023 of spec 007 was to switch `node-types.json` source to the override version — **status: unclear**; verify before starting Python factoryPass gap work.
Owner files: `packages/codegen/src/validate/node-types-loader.ts`, `packages/python/.sittir/` build artifacts.
Affects: `python/factoryPass` (this is the biggest single contributor to the +53 gap).
Signal: Systematic factory failures that trace to tree-structure mismatch rather than per-kind bugs.

### C9 — Residual aliased-kind / alias-collapse bugs (several failures)
Root cause: codegen emits interfaces/factories for kinds that tree-sitter aliases away (not in node-types.json). MEMORY.md `project_alias_collapse_dead_kinds` catalogues the rust grammar cases.
Owner files: `packages/codegen/src/compiler/*` (alias resolution).
Affects: Mixed; mostly `rust/factoryPass` and `rust/rtPass`.
Signal: factory construction fails for a kind that appears to exist but isn't in the parser's output.

---

## Priority ordering (revised per A′ — rtPass-driven)

Re-ordered by which clusters drop rtPass failures fastest. **TypeScript rtPass is the biggest lever (39 failures to close)**; Python and Rust rtPass are smaller (9 and 8 respectively).

1. **C3 (TS primary_type nonsense variants)** — likely biggest contributor to the 49 typescript rtPass failures. 18 redundant polymorph forms; single walker fix.
2. **C1 (polymorph null forms)** — affects rust + typescript rtPass directly. ~30 failures across grammars before this plan's accounting; closes substantial rtPass debt.
3. **C4 (choice branches w/ literals)** — `function_type`, `impl_item`, `macro_definition` in rust (3 rtPass failures) + any typescript equivalents. Blocked on variant-field-wrapped-choice design limitation; may need workaround (hand-authored overrides) rather than full fix.
4. **C6 (Python comments-as-extras)** — 2–3 python rtPass failures.
5. **C9 (Rust aliased kinds / alias-collapse)** — handful of rust rtPass failures; targeted overrides.
6. **Residual long-tail rtPass failures** — whatever doesn't fall into the above clusters after C3+C1 land.

**Deferred / out of R1 scope**:
- **C8 (Python override-parser drift)** — was the original top priority under the stale FLOOR reading (+53 gap on python/factoryPass). Actual python/factoryPass is 197/889 today, well past legacy. Deprioritized. IF spec 007 T023 is still outstanding it's worth finishing, but not gating.
- **C2 (Python soft keywords)** — was flagged for factoryPass; not in R1 scope.
- **C5 (Factory anon-token clause gap)** — factoryPass only; not in R1 scope.
- **C7 (list_splat)** — factoryAstMatchPass only; not in R1 scope.

Completing the new top 4 should bring rtPass within target across all three grammars.

---

## Completion signal (operational definition — revised per A′)

FR-014's literal wording gates on "render + re-parse + from-resolution ceilings." That maps to **rtPass** (the render + reparse + AST-diff validator) and **fromPass** (`.from()` resolution). Factory correctness — especially recursive factory — is OUT of R1 scope and tracked as a parallel ongoing cleanup workstream.

For each of the three grammars, every one of the following must hold for R1 to be complete:

1. **`rtPass ≥ rtTotal − 10`** — at most 10 real round-trip failures per grammar:
   - python: `rtPass ≥ 105` (currently 96; close 9)
   - rust: `rtPass ≥ 126` (currently 118; close 8)
   - typescript: `rtPass ≥ 102` (currently 63; close 39)
2. **`fromPass ≥ fromTotal − 10`** — at most 10 `.from()` resolution failures per grammar:
   - python: already at 116/119 (3 failures) ✅
   - rust: 165/176 (11 failures) — marginal, needs −1 OR close a cluster to drop to ≤10
   - typescript: 144/152 (8 failures) ✅
3. **No `expect.fail`, `it.skip`, or `it.todo` is added to any validator test to satisfy this gate.** All fixes are genuine source-of-truth fixes in emitters/walkers/overrides.

**Explicitly OUT of R1 scope**:
- `factoryPass` and `factoryAstMatchPass` (non-recursive OR recursive). These are not mentioned in FR-014; they gate factory-construction correctness, which spec 012 MVP exercises only shallowly (T050 acceptance test does leaf-level factory edits, not deep tree construction). The ~1985 recursive-factory failures are tracked as an ongoing cleanup parallel to spec 012 MVP implementation — some of that debt will close incidentally when rtPass clusters are fixed (C1 polymorph null forms, C4 choice-with-literals affect both paths).
- Stale FLOOR numbers in `corpus-validation.test.ts`. These were set in a smaller-corpus era; they can be raised to current actuals in a single-line clerical PR after R1 lands. Not gating.

**Why `rtTotal − 10` and not zero**: some corpus entries include legitimately unrepresentable constructs (weird lexer states, whitespace-sensitive edge cases, language-quirks the render pipeline can't express). A hard zero forces suppressing those; a tolerance of 10 lets them remain as observed-but-tolerated without gating the feature. Narrower than current state (rtPass gaps of 19/18/49) and a clear numerical target.

**Revisit clause**: if the residual ≤10 per grammar includes a cluster that affects spec 012's P1 acceptance tests (T050/T051), that cluster moves above the gate and must be closed before T001 passes.

---

## Task loop (cluster-by-cluster)

The same 5-step loop repeats per cluster. DRY: do NOT open a new plan file per cluster.

### Per-cluster loop template

- [ ] **Step 1: Run the pinning test and record current numbers**

Run: `pnpm -F @sittir/codegen test -- corpus-validation`
Expected: some FLOORS pass, cluster-relevant ones fail with a numeric shortfall. Record the exact `pass/total` numbers for each grammar × gate.

- [ ] **Step 2: Isolate the failing cluster**

Run: `pnpm -F @sittir/codegen test -- corpus-validation --reporter=verbose 2>&1 | grep -A3 'FAIL\|at least'`
Expected: list of failing kinds + their grammar + the gate they fail (factory / from / rt).

Group by root cause per the Cluster Inventory above. If the cluster isn't in the inventory yet, classify it and add it to §"Cluster inventory" in this file as Cn (n = next number) before proceeding — keeps the inventory honest.

- [ ] **Step 3: Trace to the emitter / walker and write the fix**

Identify the owning file from the cluster's "Owner files" list. Read it. Write the fix at the source of truth. Do NOT hand-edit generated output (Constitution Principle III).

If the fix requires a grammar-specific override, edit `packages/{grammar}/overrides.ts`. If it requires a pipeline fix, edit `packages/codegen/src/...`.

- [ ] **Step 4: Regenerate affected grammars**

For each grammar whose generated output changes:
```
npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src
npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src
npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src
```

- [ ] **Step 5: Re-run the pinning test, verify the numbers improved, raise FLOORS in the same commit**

Run: `pnpm -F @sittir/codegen test -- corpus-validation`

Expected: the cluster's failing gate now passes at a higher `pass/total`. Open `packages/codegen/src/__tests__/corpus-validation.test.ts` and raise the `FLOORS.{grammar}.{gate}` value to the new `pass` number. The test ALSO asserts `FLOORS ≤ LEGACY_BASELINE` doesn't regress — so raising FLOORS past LEGACY_BASELINE is a good thing (it means we've beaten legacy on that gate).

Run the test again to confirm the new FLOOR is achievable and the raise was recorded correctly.

- [ ] **Step 6: Commit with a cluster-ID-tagged message**

```bash
git add -u
git commit -m "ceilings: close Cn ({one-line summary}) — {grammar}.{gate} FLOOR raised to NEW (+K)"
```

Example: `ceilings: close C1 (polymorph null forms) — rust.rtPass FLOOR raised to 112 (+5)`

Commit frequently: ONE cluster per commit, even if it's a two-line fix, so reverts and bisects stay scoped.

---

## Cluster-specific task heads (prioritized order)

Each of these expands into the per-cluster loop above. Execute in order; skip or defer per the per-cluster findings.

### C8 head — Python override-parser drift

- [ ] Check whether spec 007 T023 (`switch node-types.json source to override parser version`) was completed. Look at `packages/python/.sittir/` for override-produced artifacts + check `packages/python/node-types.json`'s provenance header. If T023 was NOT completed, complete it first — the ~40 downstream fixes come for free once node-types matches what the parser actually emits. This is likely the cheapest single intervention in the entire plan.
- [ ] Run the per-cluster loop for whatever residual Python failures remain after the T023 switch.

### C1 head — Polymorph null forms

- [ ] Run the per-cluster loop. Start by dumping a failing case to see whether `modelType: 'none'` is being emitted where `modelType: 'polymorph'` should be. Fix in `packages/codegen/src/polymorph-variant.ts`. Re-run across rust + typescript; python is largely unaffected.

### C3 head — TS primary_type nonsense variants

- [ ] Audit `packages/codegen/src/polymorph-variant.ts`: the classification must use render-relevance (does any template branch on the variant?) not just choice-of-symbol. MEMORY.md `project_variant_detection_rendering` has the framing.
- [ ] Run the per-cluster loop with typescript-only focus.

### C2 head — Python soft keywords

- [ ] In `packages/codegen/src/emitters/factories.ts`, check the keyword-detection pass. Python's `match`, `print`, `case`, etc. are soft keywords — valid identifiers in most contexts. The factory validator must allow them.
- [ ] Run the per-cluster loop.

### C4 head — Choice branches with literal differentiators

- [ ] This cluster is blocked by the variant-field-wrapped-choice limitation (MEMORY.md `project_variant_field_wrapped_choice`). Decide: (a) unblock the design limitation first (moderate design work), or (b) add per-kind hand-authored overrides for `function_type` / `impl_item` / `macro_definition` as a pragmatic patch. Option (b) is faster; option (a) is the DRY fix.
- [ ] Execute the chosen option, then run the per-cluster loop.

### C6, C7, C5, C9 heads — Residual polish

- [ ] Run the pinning test. For each remaining failure not covered by C1–C4, classify per the Cluster Inventory and close via the per-cluster loop. Expect each of these to raise a FLOOR by 1–3 pass counts.

---

## Exit gate for this plan

Re-run the corpus-validation pinning test. For each grammar, read the final `pass / total` per gate and check against the Completion signal §4 (rtPass target = rtTotal − 10). If all five conditions hold:

1. ✅ `factoryPass ≥ legacy` — all three grammars.
2. ✅ `factoryAstMatchPass ≥ factoryPass − 2` — all three.
3. ✅ `fromPass ≥ legacy` — all three.
4. ✅ `rtPass ≥ rtTotal − 10` — all three.
5. ✅ No `.skip` / `.todo` / `expect.fail` was added to pass the test.

Then T001 of `specs/012-rust-core-port/tasks.md` passes. Implementation of T002+ may begin.

**Do NOT raise FLOORS artificially to satisfy this gate.** Every FLOOR raise must accompany a genuine source-of-truth fix. The test's dual assertion (`FLOORS ≥ current achievement` + `FLOORS ≤ LEGACY_BASELINE`) enforces this when closing in on legacy; the `rtPass ≥ rtTotal − 10` check is the human-enforced part.

---

## Review & handoff

No subagent-review loop on this plan (it's operational — gated by a numeric test, not by code design that needs a review). Execute in the current session or via superpowers:executing-plans; each cluster-close commit is its own reviewable unit.

If you hit a cluster that falls outside the inventory after two isolated failures, **stop and extend the inventory** — the discipline of classifying before fixing keeps the cluster count honest and prevents whack-a-mole debugging.
