# PR-M-φ2 — Enrich-converged clause/group synthesis & the ClauseRule cut — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking. Implementer agent = **sittir-codegen**; root-cause diagnosis = **sittir-research**.

**Goal:** Retire the bespoke `ClauseRule` by making enrich the single home for auto-group synthesis (so wire + IR converge from `base.grammar.rules`), then delete `ClauseRule`, the dead de-polymorph assemble machinery, and `applyAutoGroups`.

**Architecture:** A new enrich pass hoists `optional(seq(STRING, FIELD))` into a hidden `_<parent>_optionalN` group injected into `base.grammar.rules` — reaching tree-sitter (kindId) and the IR (evaluate) from one source. The keyword stays inside the group, off the parent factory. Path-addressing transparency is consolidated into one `isTransparentWrapper` predicate (skip for in-place enriched wrappers; follow-through for hoist symbols). `ClauseRule`/`detectClause`/`emitClause` and the now-dead assemble polymorph-form code are deleted; the 23 `'clause'` switch arms fold into `'group'`. Finally `applyAutoGroups` (outRules-only) retires.

**Tech Stack:** TypeScript (ESM, `.ts` local imports), vitest, tree-sitter grammar DSL, Rust napi render engine. Spec: `docs/superpowers/specs/2026-06-02-pr-m-phi2-enrich-clause-group-convergence-design.md`.

**Branch:** `pr-m-phi2-enrich-clause-convergence` (already created; no worktree per user preference).

**Carry-forward gate floor (deep `read-render-parseAstMatchPass`, `pnpm validate:native`):** rust **111** / ts **69** / py **74**. Hold-or-improve each chunk; target recovery toward rust 125 / ts 72 / py 76. Per Rust-emitting commit: independent `cargo check --workspace --features napi-bindings` must pass, **no segfault** in any grammar.

---

## Conventions for every implementer task

- **Never hand-edit generated artifacts** (`packages/{rust,python,typescript}/{src,templates,.sittir}`, `rust/crates/sittir-*/src/**`). Fix codegen + regenerate. Edit only `packages/codegen/src/**` (and `packages/<lang>/overrides.ts` if explicitly needed — not expected here).
- **Fast iteration:** `tsx` resolves `@sittir/*` to source — NO build for unit tests/probes. Keep `cargo` out of the inner loop; gate on it only before committing a Rust-emitting change.
- **Regen (debug+incremental, fast):** `SITTIR_NATIVE_DEBUG=1` is set in `.claude/settings.local.json`, so `gen --all` uses `build:debug`. Regen a grammar: `pnpm exec tsx packages/cli/src/cli.ts gen --grammar <g> --all --output packages/<g>/src`.
- **Native counts (per grammar):** `pnpm exec tsx packages/cli/src/cli.ts validate counts --backend native <g>` — read covPass / read-render-parsePass / **read-render-parseAstMatchPass**.
- **Full gate:** `pnpm validate:native`.
- **Type check:** `pnpm exec tsgo --noEmit -p packages/codegen` (the hook rejects bare `tsc`/`tsgo`; always `--noEmit`/`-p`).
- **NEVER stage** `packages/validator/validation-history.jsonl` or `rust/crates/sittir-*/test-fixtures.json` (regen dirties them; restore with `git checkout -- <path>`). Stage by explicit pathspec. The pre-commit manifest hook may require `--no-verify` for codegen commits where you intentionally regenerated — confirm the regen is consistent first.
- **End commit messages** with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Avoid the literal `tsc` in commit messages (hook).
- **Search/navigate** with ast-grep + the native LSP tool (reads); lspeasy CLI for writes only.

---

## File Structure

| File | Responsibility | Change |
|---|---|---|
| `packages/codegen/src/dsl/enrich.ts` | Mechanical pre-generate grammar enrichment (injects to `base.grammar.rules`) | **Add** clause-hoist pass (Ch1); generalize to optional/repeat/repeat1 seq (Ch2) |
| `packages/codegen/src/dsl/wire/transparent-wrapper.ts` | **New** — single `isTransparentWrapper` predicate + hoist follow-through helper | **Create** (Ch1 skip tier; Ch2 follow-through) |
| `packages/codegen/src/dsl/transform/transform.ts` | Transform path-addressing (prec/optional/choice-blank transparency, scattered) | **Route** transparency through `isTransparentWrapper` (Ch1) |
| `packages/codegen/src/dsl/transform/transform-path.ts` | Path segment resolution | **Route** transparency through `isTransparentWrapper` (Ch1) |
| `packages/codegen/src/compiler/assemble.ts` | Node assembly | **Delete** dead polymorph-form machinery + statically-dead `node.forms` consumers (Ch1) |
| `packages/codegen/src/compiler/link.ts` | Link pass; `detectClause`; 13 `'clause'` arms | **Delete** `detectClause`; fold 13 arms → `'group'` (Ch1) |
| `packages/codegen/src/compiler/simplify.ts` | Simplify pass; 9 `'clause'` arms | Fold 9 arms → `'group'` (Ch1) |
| `packages/codegen/src/compiler/field-shape.ts` | 1 `'clause'` arm | Fold 1 arm → `'group'` (Ch1) |
| `packages/codegen/src/compiler/rule.ts` | Rule union; `ClauseRule`; `isClause` | **Delete** `ClauseRule`, `isClause`, remove from union (Ch1) |
| `packages/codegen/src/emitters/templates.ts` | Template emitters; `emitClause` | **Delete** `emitClause` + its dispatch (Ch1) |
| `packages/codegen/src/dsl/wire/auto-groups.ts` | outRules-only auto-group synthesis | **Delete** (Ch3) |
| `packages/codegen/src/dsl/wire/wire.ts` | `applyAutoGroups` call site + `collectAuthoredSynthesisKinds` | **Remove** call site; remove now-dead helper (Ch3) |
| `packages/codegen/src/dsl/__tests__/enrich-clause-hoist.test.ts` | **New** unit tests for the clause-hoist pass | **Create** (Ch1) |
| `packages/codegen/src/dsl/__tests__/transparent-wrapper.test.ts` | **New** unit tests for `isTransparentWrapper` | **Create** (Ch1/Ch2) |

---

## Chunk 1: Clause cut — enrich-converge + delete ClauseRule + dead assemble machinery

### Task 1.0: Delete the dead de-polymorph assemble machinery (isolated prep)

**Rationale:** `assemble.ts`'s polymorph-form merge (`buildBranchRenderRuleFromForms`, `_makeClauseSequenceFromForms`, `_extractDiscriminatorName`) and the `node.modelType === 'polymorph'` / `node.forms` consumers are dead since #57 (no production caller; `'polymorph'` removed from the modelType union → tsc `[2339]/[2367]`). This is safe, isolated, and clears existing type errors. `ClauseRule`/`emitClause` survive this task (detectClause still uses them).

**Files:**
- Modify: `packages/codegen/src/compiler/assemble.ts` (delete fns ~1556–1815 region + dead `node.forms` branches at ~736–737, ~866)

- [ ] **Step 1: Confirm death before deleting.** Use the native LSP tool `findReferences` on `buildBranchRenderRuleFromForms` (assemble.ts:1556) and `_makeClauseSequenceFromForms` (1752). Expected: only their own def + self-recursion + `*.test.ts` references — zero production callers. Also `findReferences` on `AssembledPolymorph` (node-map.ts:3290) → zero production constructors.
- [ ] **Step 2: Delete** `buildBranchRenderRuleFromForms`, `_makeClauseSequenceFromForms`, `_extractDiscriminatorName`, and any now-orphaned helpers they alone used. Delete the statically-dead `node.modelType === 'polymorph'` branches (the `for (const form of node.forms)` consumers) at ~736–737 and ~866.
- [ ] **Step 3: Delete the orphaned tests.** Remove `packages/codegen/src/__tests__/polymorph-branch-renderrule.test.ts` (it only exercises the deleted fns). Confirm with `findReferences` that nothing else imports its helpers.
- [ ] **Step 4: Type check.** `pnpm exec tsgo --noEmit -p packages/codegen` → the `[2339]/[2367]` polymorph errors in assemble.ts are GONE; no new errors.
- [ ] **Step 5: Unit suite.** `pnpm exec vitest run packages/codegen/src/compiler` → green (no test depends on the deleted path beyond the removed file).
- [ ] **Step 6: Native gate (no Rust emission expected, but confirm).** `pnpm validate:native` → deep AST hold-or-improve vs floor (this is dead code; counts MUST be unchanged). If any count moves, STOP — the path was not dead; report to dispatcher.
- [ ] **Step 7: Commit.** `git commit -- packages/codegen/src/compiler/assemble.ts <deleted test path>` — message: "refactor(assemble): delete dead de-polymorph form-merge machinery (#57 residue)".

### Task 1.1: Enrich clause-hoist pass (the convergence core)

**Files:**
- Create: `packages/codegen/src/dsl/__tests__/enrich-clause-hoist.test.ts`
- Modify: `packages/codegen/src/dsl/enrich.ts` (add pass + wire into `enrich()`'s pass list)

- [ ] **Step 1: Write failing unit tests.** Cover: (a) `optional(seq(STRING 'for', field('x', SYMBOL)))` → `optional(SYMBOL(_parent_optional1))` AND `base.grammar.rules['_parent_optional1']` = the original `seq`, with `source:'group-lift'` on the rewritten member; (b) the tree-sitter-normalized `optional(CHOICE[seq, BLANK])` form descends identically; (c) the trigger matches `detectClause`'s predicate exactly — fires on `seq` with **≥1 STRING and ≥1 FIELD** (multi-member, not just 2), does NOT fire on `optional(field(X))` (single field) or `optional(seq(field,field))` (no string); (d) slot-count preservation: the parent's top-level member count is unchanged.
- [ ] **Step 2: Run, verify fail.** `pnpm exec vitest run packages/codegen/src/dsl/__tests__/enrich-clause-hoist.test.ts` → FAIL (pass not implemented).
- [ ] **Step 3: Implement the pass** in enrich.ts. Mirror the existing pass-4 (`optional(seq(...))` / `CHOICE[X,BLANK]`) descent. Predicate = `members.some(isString) && members.some(isField)`. Hoist the seq into `_<parent>_optionalN` (per-parent 1-indexed; reuse cross-parent dedupe by canonical-stringified content — same convention as auto-groups.ts §4.6), inject into `base.grammar.rules`, rewrite the member to `optional(SYMBOL(name))` with `source:'group-lift'`. Collision-aware (skip + stderr if name claimed), like the other passes. Wire it into `enrich()`'s pass composition.
- [ ] **Step 4: Run, verify pass.** Same vitest → PASS.
- [ ] **Step 5: Integration probe (the key risk check).** `pnpm exec tsx packages/cli/src/cli.ts tool probe-stages --grammar rust --kind abstract_type` → at **link**, `abstract_type` is now `seq('impl', optional(SYMBOL(_abstract_type_optional1)))` (NOT a `clause`); `_abstract_type_optional1` classifies as a `GroupRule`. Confirms enrich made detectClause a no-op for this kind.
- [ ] **Step 6: Regen + native gate (Rust-emitting).** Regen all 3 grammars; `cargo check --workspace --features napi-bindings` passes; `pnpm validate:native` deep AST **hold-or-improve** vs floor, **no segfault**. NOTE: applyAutoGroups is still active — enrich runs first, so its hoisted `optional(SYMBOL)` no longer matches applyAutoGroups's `optional(seq)` trigger (no double-hoist). If a non-authored kind (e.g. `enum_variant`) regresses, `sittir-research` diagnoses the name/dedupe collision between enrich's hoist and the pre-existing wire group.
- [ ] **Step 7: Commit.** `git commit --no-verify -- packages/codegen/src/dsl/enrich.ts packages/codegen/src/dsl/__tests__/enrich-clause-hoist.test.ts packages/<g>/src/... <generated>` (explicit pathspecs; NOT history/fixtures) — "feat(enrich): hoist optional(seq(STRING,FIELD)) clauses into groups".

### Task 1.2: Consolidate transparency into `isTransparentWrapper` (skip tier)

**Files:**
- Create: `packages/codegen/src/dsl/wire/transparent-wrapper.ts`
- Create: `packages/codegen/src/dsl/__tests__/transparent-wrapper.test.ts`
- Modify: `packages/codegen/src/dsl/transform/transform.ts` (sites ~300, ~482, ~735–746), `packages/codegen/src/dsl/transform/transform-path.ts` (~202)

- [ ] **Step 1: Write failing tests** for `isTransparentWrapper(rule)`: true for prec wrappers, true for in-place `source:'enriched'` field-wraps, true for 2-member `CHOICE[X,BLANK]`; false for plain seq/choice/field/symbol. (Follow-through for `source:'group-lift'` is Chunk 2 — not yet.)
- [ ] **Step 2: Run, verify fail.**
- [ ] **Step 3: Implement** `isTransparentWrapper` capturing the union of the currently-scattered checks (prec via `isPrecWrapper`, the "field-transparent wrappers" notion, `CHOICE[X,BLANK]`), plus `source:'enriched'`. Replace the ad-hoc checks at the named transform.ts / transform-path.ts sites with calls to it. **Pure consolidation — no behavior change.**
- [ ] **Step 4: Run, verify pass** + full transform suite green: `pnpm exec vitest run packages/codegen/src/dsl/__tests__/transform-path.test.ts packages/codegen/src/dsl/__tests__/transform-hoist.test.ts packages/codegen/src/dsl/__tests__/transparent-wrapper.test.ts`.
- [ ] **Step 5: WIDE override probe (regression guard).** Confirm 0-unexpected path-resolution drift across overrides (the existing override-probe gate). No authored path should resolve differently.
- [ ] **Step 6: Commit.** Pure-TS, no Rust — fast signals suffice. "refactor(transform): consolidate path-addressing transparency into isTransparentWrapper".

### Task 1.3: Delete `detectClause` (remove the sole live ClauseRule producer)

**Files:**
- Modify: `packages/codegen/src/compiler/link.ts` (delete `detectClause` ~2041; `resolveRule` optional case ~1457–1464 reverts to plain optional)

- [ ] **Step 1:** With enrich now hoisting (Task 1.1), `detectClause` already returns plain `optional` for every input (content is a SYMBOL, never a seq). Confirm via `findReferences` on `detectClause` → only the one call site (link.ts:1462).
- [ ] **Step 2:** Replace the `resolveRule` `optional` case body to just resolve `rule.content` and return `optional` (preserve the `rule.id` carry-through). Delete `detectClause`.
- [ ] **Step 3: Type check** `pnpm exec tsgo --noEmit -p packages/codegen` → green (ClauseRule still exists; arms still present — only the producer is gone).
- [ ] **Step 4: Regen + native gate** all 3 grammars; cargo passes; `pnpm validate:native` deep AST hold-or-improve, no segfault. (Behavior identical to 1.1 since detectClause was already a no-op.)
- [ ] **Step 5: Commit.** "refactor(link): delete detectClause; enrich now owns clause hoisting".

### Task 1.4: Delete `ClauseRule` + `emitClause` + fold the 23 `'clause'` arms

**Files:**
- Modify: `packages/codegen/src/compiler/rule.ts` (delete `ClauseRule` iface ~231, `isClause` ~401, remove from union ~113)
- Modify: `packages/codegen/src/emitters/templates.ts` (delete `emitClause` ~1648 + its dispatch ~1104)
- Modify: `link.ts` (×13 arms), `simplify.ts` (×9), `field-shape.ts` (×1)

- [ ] **Step 1:** `findReferences` on `ClauseRule`, `isClause`, `emitClause` → confirm zero producers remain (post-1.0 + 1.3). Each `'clause'` switch arm should now be unreachable.
- [ ] **Step 2: Fold the arms.** For each of the 23 `case 'clause':` arms, verify its behavior is identical to the adjacent `case 'group':` arm (a hoisted clause is now a `GroupRule`). Where identical, delete the `'clause'` arm (the `'group'` arm covers it). Where an arm did something clause-specific, port that into the `'group'` arm only if a hoisted group needs it (it should not — confirm via probe). Use ast-grep to enumerate all `case 'clause':` and avoid missing one.
- [ ] **Step 3:** Delete `ClauseRule` from the union + interface, `isClause`, and `emitClause` + its dispatch entry.
- [ ] **Step 4: Type check** `pnpm exec tsgo --noEmit -p packages/codegen` → green; `grep -rn "'clause'" packages/codegen/src` (via rg) → **zero**.
- [ ] **Step 5: Regen + native gate** all 3; cargo passes; `pnpm validate:native` deep AST hold-or-improve, no segfault. Byte-diff: `git show`/`diff` the regenerated `abstract_type`/`static_item`/`block` factory + types — keyword literal (`for`/`impl`/`=`) is **absent** from the parent surface, present in the hoisted group's template.
- [ ] **Step 6: Commit.** "refactor: delete ClauseRule/emitClause; fold 23 clause arms into group".

### Chunk 1 review gate
Dispatch `feature-dev:code-reviewer` (or pr-review-toolkit:code-reviewer) over the Chunk 1 diff. Confirm: enrich convergence intact, no `'clause'` residue, dead assemble code gone, gates green, keyword encapsulation proven by byte-diff. Fix findings before Chunk 2.

---

## Chunk 2: Migrate remaining auto-groups to enrich + hoist descend-through

### Task 2.1: Generalize the enrich hoist to `optional(seq)` / `repeat(seq)` / `repeat1(seq)`

**Files:**
- Modify: `packages/codegen/src/dsl/enrich.ts` (generalize the Task 1.1 pass beyond the STRING+FIELD predicate)
- Modify/extend: `packages/codegen/src/dsl/__tests__/enrich-clause-hoist.test.ts` (add repeat/optional-seq cases)

- [ ] **Step 1: Write failing tests** — `repeat(seq(...))`/`repeat1(seq(...))`/`optional(seq(...))` (general seq, not just STRING+FIELD) hoist to `_<parent>_repeatN`/`_<parent>_optionalN`, injected to `base.grammar.rules`, with the same dedupe + naming as `auto-groups.ts` (so the emitted kind names match what applyAutoGroups produced — no churn).
- [ ] **Step 2–4: TDD** the generalization. Reuse `auto-groups.ts`'s naming/dedupe logic (extract the shared helper rather than duplicate — DRY).
- [ ] **Step 5: Regen + native gate** all 3 with applyAutoGroups STILL active. Because enrich runs first and rewrites `optional/repeat(seq)` → `…(SYMBOL)`, applyAutoGroups's `isSeqType(content)` trigger no longer matches → it no-ops. Confirm the emitted grammar.json `_<parent>_(optional|repeat)N` set is unchanged vs pre-Chunk-2 (the hoist just moved from wire-only to enrich). Deep AST hold-or-improve, no segfault. `sittir-research` diagnoses any divergence.

### Task 2.2: Add hoist follow-through to `isTransparentWrapper`

**Files:**
- Modify: `packages/codegen/src/dsl/wire/transparent-wrapper.ts` (+ follow-through helper)
- Modify: `packages/codegen/src/dsl/__tests__/transparent-wrapper.test.ts`
- Modify: `transform.ts` / `transform-path.ts` (path-walker uses follow-through when descending a `source:'group-lift'` symbol)

- [ ] **Step 1: Write failing tests** — a path like `'4/0'` that addresses *inside* a now-hoisted seq resolves by following the `source:'group-lift'` SYMBOL into its `base.grammar.rules` body and descending, then reconstructing the symbol-ref on return (mirrors prec reconstruct). Use `closure_expression` (`{'4/0': variant('block'), '4/1': variant('expr')}`) as the fixture shape.
- [ ] **Step 2–4: TDD** the follow-through. The path-walker, on hitting a `group-lift` symbol, resolves it via the rule map, descends into the body, and rebuilds the ref on the way out.
- [ ] **Step 5: WIDE override probe** → 0-unexpected. `closure_expression` and any kind with authored paths into hoisted seqs resolve correctly.
- [ ] **Step 6: Regen + native gate** all 3 → deep AST hold-or-improve, no segfault.
- [ ] **Step 7: Commit** Chunk 2 (2.1 + 2.2 together if interdependent, else separately). "feat(enrich): own all seq auto-groups; add isTransparentWrapper hoist follow-through".

### Chunk 2 review gate
Dispatch reviewer over the Chunk 2 diff. Confirm grammar.json kind-set parity (no phantom/dropped `_*_(optional|repeat)N`), descend-through correctness, gates green.

---

## Chunk 3: Retire `applyAutoGroups`

### Task 3.1: Delete the outRules-only synthesis path

**Files:**
- Delete: `packages/codegen/src/dsl/wire/auto-groups.ts`
- Modify: `packages/codegen/src/dsl/wire/wire.ts` (remove the `applyAutoGroups(...)` call + the "Re-run body-pattern replacement AFTER applyAutoGroups" follow-up if now redundant; remove `collectAuthoredSynthesisKinds` if it becomes unused; remove `syntheticInline` plumbing if now dead)
- Delete/migrate: `packages/codegen/src/dsl/__tests__/auto-groups.test.ts` (port any still-relevant assertions to `enrich-clause-hoist.test.ts`)

- [ ] **Step 1:** `findReferences` on `applyAutoGroups`, `collectAuthoredSynthesisKinds`, `syntheticInline` → confirm what becomes dead once the call site is removed. Do NOT delete anything still referenced by a live path.
- [ ] **Step 2:** Remove the call site + delete `auto-groups.ts`. Migrate any unique test assertions; delete the obsolete test file.
- [ ] **Step 3: Type check** green; rg `applyAutoGroups` → zero.
- [ ] **Step 4: Regen + native gate** all 3 → deep AST hold-or-improve (enrich fully owns synthesis now), cargo passes, no segfault. This is the decisive parity check: grammar.json and counts must match Chunk 2's end state exactly (enrich already did all the work; this only removes the now-inert wire pass).
- [ ] **Step 5: Commit.** "refactor(wire): retire applyAutoGroups — enrich owns all auto-group synthesis".

### Task 3.2: Final review + finish branch

- [ ] **Step 1:** Dispatch a final `feature-dev:code-reviewer` over the whole branch diff (base = `master`). Confirm all spec §7 acceptance criteria: zero `'clause'`, all deletions done, `[2339]/[2367]` cleared, one `isTransparentWrapper`, gates green, keyword-off-factory byte-diff.
- [ ] **Step 2:** Update the master plan (`docs/superpowers/plans/2026-05-26-compiler-simplification-master-plan.md` §φ2) to mark PR-M-φ2 landed; note the de-polymorph dead-code cleanup as completed here.
- [ ] **Step 3:** Use superpowers:finishing-a-development-branch → open the PR (`GITHUB_TOKEN= gh pr create ...`). Final native counts vs floor in the PR body.

---

## Acceptance criteria (from spec §7 — verify all at Task 3.2)

1. `pnpm validate:native` deep `read-render-parseAstMatchPass` hold-or-improve vs floor (rust 111 / ts 69 / py 74); report final numbers.
2. `cargo check --workspace --features napi-bindings` passes.
3. No segfault in any grammar.
4. Byte-diff: keyword literal off the parent factory/types, inside the hoisted group template (`abstract_type`/`static_item`/`block`).
5. rg `"'clause'"` in `packages/codegen/src` → zero; `ClauseRule`/`detectClause`/`isClause`/`emitClause` + dead assemble machinery deleted; `[2339]/[2367]` cleared; `auto-groups.ts` deleted.
6. `isTransparentWrapper` is the sole transparency predicate in transform.ts + transform-path.ts.
