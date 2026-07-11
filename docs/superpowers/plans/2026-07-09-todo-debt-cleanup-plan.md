# TODO.md Debt Cleanup — Track 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Execute the well-bounded TODO.md debt-cleanup items (Track 1) grounded in `docs/superpowers/specs/2026-07-09-todo-debt-cleanup-design.md`: mechanical deletions/formatting, a new `@forFutureUse` tagging convention, single-phase method consolidation, `recurseChildren` removal, a structured validation diagnostic report, and JS-engine removal.

**Architecture:** No new subsystems for Clusters A/B/C/E — this is deletion, migration, and consolidation of existing compiler/emitter/runtime code, executed directly in the main worktree on top of the user's in-progress typing-consistency changes. Cluster D adds one new piece of infrastructure: a persisted, structured JSON report (`packages/tools/validation-report.json`) that unifies today's two disconnected diagnostic channels (stderr-only grammar diagnostics, counts-only validator history).

**Tech Stack:** TypeScript (ESM, `.ts` extensions on local imports), vitest, oxlint/oxfmt, lsproxy-cli (LSP-driven moves), pnpm workspaces, tree-sitter grammars (rust/typescript/python) with a Rust/napi native render engine.

## Global Constraints

- **Worktree:** all work happens directly in the main worktree (`/Users/pmouli/GitHub.nosync/refactory-lang/sittir`), continuing the user's own in-progress uncommitted changes — not an isolated worktree.
- **Never hand-edit generated artifacts** — `packages/{rust,python,typescript}/src/*`, `packages/{rust,python,typescript}/templates/*.jinja`, `packages/{rust,python,typescript}/.sittir/*`, `overrides.suggested.ts`. Fix codegen (`packages/codegen/src/emitters/*`, `packages/codegen/src/compiler/*`) or `packages/<lang>/overrides.ts`, then regenerate.
- **Regenerate + stage after every task that touches `packages/codegen/src/**`:** run all three of:
  ```bash
  pnpm exec tsx packages/cli/src/cli.ts gen --grammar rust --all --output packages/rust/src
  pnpm exec tsx packages/cli/src/cli.ts gen --grammar typescript --all --output packages/typescript/src
  pnpm exec tsx packages/cli/src/cli.ts gen --grammar python --all --output packages/python/src
  ```
  **Two-commit split, found necessary at Task 3 (do not skip either half):**
  1. **Feature commit** — your source changes, plus `packages/{rust,typescript,python}/.sittir/generated.manifest.json` AND `packages/{rust,typescript,python}/.sittir/grammar.js` (`git add packages/rust/.sittir/grammar.js packages/typescript/.sittir/grammar.js packages/python/.sittir/grammar.js` — check `git status` on these three every time, they change on every regen even when nothing else does, and the pre-commit hook's manifest check hashes `grammar.js`'s exact bytes; omitting it while committing the manifest leaves a mismatch that blocks every subsequent commit until someone fixes it, which is exactly what happened after Task 2). Verify clean before committing: `pnpm exec tsx packages/codegen/src/scripts/verify-manifests-cli.ts` must exit 0.
  2. **Separate validator-recording commit** — `rust/crates/sittir-{rust,typescript,python}/test-fixtures.json` alone, message `chore(validator): record validation run (rust/native, typescript/native, python/native)`. Do NOT bundle `test-fixtures.json` into the feature commit — `packages/codegen/src/scripts/generated-manifest.ts`'s `isManifestUntracked()` deliberately excludes it from the manifest specifically because it's derived validator output regenerated on every run, and the project's standing discipline (matching the many pre-existing `chore(validator): record validation run` commits in `git log`) is that it never lands in a feature commit.
- **`SITTIR_NATIVE_DEBUG=1` is set in the ambient shell environment.** Every `validate:native` invocation in this plan MUST be prefixed `SITTIR_NATIVE_DEBUG=0` — debug native binaries are refused for validation by design (known segfault class). Example: `SITTIR_NATIVE_DEBUG=0 pnpm run validate:native`.
- **Gate every task on `read-render-parse-AstMatchPass` holding steady or improving.** Fresh baseline as of commit `97d88460`: **rust=117, typescript=75, python=102**. Re-confirm this fresh at the start of Task 1 (do not assume it still holds by the time later tasks run — re-verify after every task that touches `packages/codegen/src/**`). Clusters A/C/E must be exactly byte-neutral (identical counts). Cluster B and Cluster A's `toNativeRenderTransport`-stub-removal task are the only ones expected to change generated `utils.ts`/`wrap.ts`/`engine.ts`/`backend.ts` output — review that diff, don't treat it as a failure.
- **Verify caller counts fresh immediately before every deletion**, via infigraph `find_all_references`, cross-checked with a direct text/import search (infigraph's index has proven stale/unreliable multiple times this session — do not trust it alone). Re-read the current file first; do not trust this plan's or the spec's line numbers blindly, the codebase is actively changing.
- **lsproxy (not manual Edit) for every Cluster E move** — see `lsproxy-cli` skill for exact commands (`lsproxy textDocument rename --dry-run ...` to preview, then apply).
- **`propose-14`** (signature-conformance ratchet) must pass on every commit — it runs automatically in the pre-commit hook.
- **Commits:** explicit pathspecs only (never `git add -A`/`.`), never `--no-verify`, never amend a published commit.
- **Full test suite (`pnpm test`) must pass after every task.**

---

## Task 1: Baseline re-confirmation

**Files:** none modified — this task only records the current state.

**Interfaces:**
- Produces: a confirmed `read-render-parse-AstMatchPass` baseline (rust/typescript/python counts) that every later task's gate compares against.

- [ ] **Step 1: Run the full test suite to confirm a clean starting point**

Run: `pnpm test`
Expected: all tests pass (or the exact same pre-existing failures as the last known-good state — if any test is already failing, record which ones so later tasks don't get blamed for pre-existing failures).

- [ ] **Step 2: Re-confirm the native validation baseline**

Run: `SITTIR_NATIVE_DEBUG=0 pnpm run validate:native > /tmp/baseline-validate.log 2>&1; tail -100 /tmp/baseline-validate.log`
Expected: `rust/native:`, `typescript/native:`, `python/native:` blocks each showing `read-render-parseAstMatchPass=117` (rust), `=75` (typescript), `=102` (python). If any of these three numbers differs from the recorded baseline, STOP and report to the user before proceeding — do not treat a drifted baseline as this plan's problem to fix.

- [ ] **Step 3: Record the baseline in a scratch note for the rest of the plan**

No commit for this task — it's pure verification. Keep `/tmp/baseline-validate.log` around for comparison after Task 2 onward.

---

## Task 2: Cluster A — lint + format pass

**Files:**
- Modify: any file `oxlint --fix` touches under `packages/*/src` (unused imports).
- Modify: any file `oxfmt .` reformats.

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: a clean lint/format baseline that later Cluster A deletion tasks build on (fewer unrelated diffs in their own commits).

- [ ] **Step 1: Run oxlint in report-only mode first to see what will change**

Run: `pnpm exec oxlint -c oxlint.config.ts --format json packages/*/src > /tmp/oxlint-before.json`
Expected: JSON report listing diagnostics (baseline from the spec's grounding: 56 total, 52 `no-unused-vars`, 2 `no-empty-file`, 1 `no-misused-new`, 1 duplicate-identifier parse error).

- [ ] **Step 2: Apply the auto-fixable unused-import/unused-declaration fixes**

Run: `pnpm exec oxlint -c oxlint.config.ts --fix packages/*/src`
Expected: the 33 unused-import + 19 unused-declaration diagnostics from Step 1 are resolved. Re-run Step 1's command to confirm: `pnpm exec oxlint -c oxlint.config.ts --format json packages/*/src` should now show only the 4 non-auto-fixable stragglers (2 `no-empty-file`, 1 `no-misused-new`, 1 duplicate-identifier).

- [ ] **Step 3: Manually inspect and fix (or explicitly skip) the 4 non-auto-fixable stragglers**

For each of these, read the file and decide: is it a real, fixable issue, or pre-existing/out-of-scope noise?
- `packages/tools/src/validate/node-types.ts:1` (`no-empty-file`)
- `packages/codegen/src/__tests__/validate-node-types.test.ts:1` (`no-empty-file`)
- `packages/typescript/src/types.ts:3601` (`no-misused-new` — this is a GENERATED file; if reproducible, the fix belongs in the emitter that generates it, not a hand-edit — if it's not obviously emitter-fixable in a few minutes, leave a one-line note in this task's commit message that it's pre-existing and out of scope, do not hand-edit the generated file)
- `packages/codegen/src/compiler/__tests__/evaluate.test.ts:16` (duplicate `normalize` identifier — likely two imports of the same name; open the file and rename/dedupe the import)

- [ ] **Step 4: Run oxfmt across the repo**

Run: `pnpm exec oxfmt .`
Expected: reformats the 284 files with drift (per the spec's grounding). No logic changes, whitespace/formatting only.

- [ ] **Step 5: Run the full test suite**

Run: `pnpm test`
Expected: PASS (formatting/import changes should never break behavior; if something fails, investigate before proceeding — do not assume it's unrelated).

- [ ] **Step 6: Regenerate all three grammars and verify the baseline holds**

Run:
```bash
pnpm exec tsx packages/cli/src/cli.ts gen --grammar rust --all --output packages/rust/src
pnpm exec tsx packages/cli/src/cli.ts gen --grammar typescript --all --output packages/typescript/src
pnpm exec tsx packages/cli/src/cli.ts gen --grammar python --all --output packages/python/src
SITTIR_NATIVE_DEBUG=0 pnpm run validate:native > /tmp/task2-validate.log 2>&1; tail -100 /tmp/task2-validate.log
```
Expected: `read-render-parse-AstMatchPass` still exactly rust=117/typescript=75/python=102 (byte-neutral cluster).

- [ ] **Step 7: Commit**

```bash
git add -u packages/*/src packages/rust/.sittir/generated.manifest.json packages/typescript/.sittir/generated.manifest.json packages/python/.sittir/generated.manifest.json rust/crates/sittir-rust/test-fixtures.json rust/crates/sittir-typescript/test-fixtures.json rust/crates/sittir-python/test-fixtures.json
git commit -m "chore: oxlint --fix + oxfmt pass across packages/*/src

Fixes 33 unused imports, 19 unused declarations, and the 4
non-auto-fixable oxlint stragglers found in the Track 1 grounding pass.
No logic changes."
```
(Use explicit pathspecs matching whatever `git status` actually shows changed — do not use `-A`/`.`.)

---

## Task 3: Cluster A — delete the `NodeId` dead type alias (batch 1, corrected scope)

**CORRECTION (found when this task was first dispatched):** the original scope
also listed `RuleIdentity`, `SymbolRule.supertype`, `FieldRule.nameFrom`, and
`isNativeNodeData`/`assertNativeNodeData` for deletion. Direct investigation
(ast-grep across the whole repo + `git log -S`) found: the first three are
already deleted by an earlier, unrelated commit (`eb47d0d65`, "debt PR-A —
remove pure-dead surface … #116") already present on this branch — nothing to
do. `isNativeNodeData`/`assertNativeNodeData` don't exist under those names at
all — already renamed to `isRenderableNodeData`/`assertRenderableNodeData`,
which are **live, non-deprecated** functions; `packages/core/tests/native-boundary.test.ts`
tests that live API and must NOT be deleted. Only `NodeId` was real, and it
turned out to have 3 additional dead-import sites beyond the one file
originally cited. This task is scoped to just `NodeId` now.

**Files:**
- Modify: `packages/types/src/core-types.ts` (delete `NodeId` type alias + its `@deprecated` tag, ~lines 49-53).
- Modify: `packages/types/src/index.ts` (remove `NodeId` from the `export type { ... }` barrel block, ~line 27 — found on the 2nd dispatch attempt, not in the original scope).
- Modify: `packages/core/src/types.ts` (remove the dead `NodeId` re-export, ~line 8).
- Modify: `packages/tools/src/probe/kind.ts` (remove the unused `NodeId` import, ~line 84).
- Modify: `packages/core/tests/readNode.test.ts` (remove the unused `NodeId` import, ~line 17).

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: nothing later tasks depend on (pure deletion).

- [ ] **Step 1: Re-verify `NodeId` has zero functional (value-binding) references, only dead imports**

Run `find_all_references` (infigraph) AND a direct text/ast-grep search (`sg --pattern 'NodeId' --lang ts packages`) for `NodeId`. Confirm: no code anywhere binds a value to the `NodeId` type (it's purely a type-level dead alias), and the only remaining references are the 5 import/declaration sites listed in Files above (a 2nd dispatch of this exact task already confirmed exactly these 5 via `sg`, including the `packages/types/src/index.ts:27` barrel export the original task text missed). If you find a 6th reference or a real functional use, STOP and report it.

- [ ] **Step 2: Confirm current test coverage passes before deleting**

Run: `pnpm test`
Expected: PASS (this is the "before" side of the regression-test cycle for a pure deletion).

- [ ] **Step 3: Delete `NodeId` and all 5 dead references**

In `packages/types/src/core-types.ts`, remove the `@deprecated` tag and the `export type NodeId = number;` declaration (and its preceding doc comment). In `packages/types/src/index.ts:27`, remove `NodeId` from the `export type { ... }` barrel block (keep every other type in that block untouched). In `packages/core/src/types.ts:8`, remove the dead re-export. In `packages/tools/src/probe/kind.ts:84`, remove the unused import. In `packages/core/tests/readNode.test.ts:17`, remove the unused import. Re-verify each line number first — this plan correction was written from a report, not a fresh read.

- [ ] **Step 4: Run the full test suite**

Run: `pnpm test`
Expected: PASS — identical result to Step 2's baseline (pure dead-import removal, no behavior change).

- [ ] **Step 5: Regenerate and re-verify the baseline**

```bash
pnpm exec tsx packages/cli/src/cli.ts gen --grammar rust --all --output packages/rust/src
pnpm exec tsx packages/cli/src/cli.ts gen --grammar typescript --all --output packages/typescript/src
pnpm exec tsx packages/cli/src/cli.ts gen --grammar python --all --output packages/python/src
SITTIR_NATIVE_DEBUG=0 pnpm run validate:native > /tmp/task3-validate.log 2>&1; tail -100 /tmp/task3-validate.log
```
Expected: `read-render-parse-AstMatchPass` still exactly rust=117/typescript=75/python=102.

- [ ] **Step 6: Commit**

```bash
git add packages/types/src/core-types.ts packages/core/src/types.ts packages/tools/src/probe/kind.ts packages/core/tests/readNode.test.ts
git add packages/rust/.sittir/generated.manifest.json packages/typescript/.sittir/generated.manifest.json packages/python/.sittir/generated.manifest.json rust/crates/sittir-rust/test-fixtures.json rust/crates/sittir-typescript/test-fixtures.json rust/crates/sittir-python/test-fixtures.json
git commit -m "chore: delete dead NodeId type alias and its 3 unused import sites

RuleIdentity/SymbolRule.supertype/FieldRule.nameFrom were already
deleted by an earlier, unrelated commit (eb47d0d65). isNativeNodeData/
assertNativeNodeData were already renamed to isRenderableNodeData/
assertRenderableNodeData (live, not deprecated) — left untouched.
NodeId was the only genuinely-dead symbol in this batch."
```

---

## Task 4: Cluster A — delete zero-caller emitter stubs + retired rule-type constants

**Files:**
- Modify: `packages/codegen/src/emitters/wrap.ts` (delete `wrap.init()`/`wrap.collect()`, ~lines 117-125).
- Modify: `packages/codegen/src/emitters/from.ts` (delete `from.init()`/`from.collect()`, ~lines 264-266).
- Modify: `packages/codegen/src/emitters/factories.ts` (delete `factories.init()`/`factories.collect()`, ~lines 401-403).
- Modify: `packages/codegen/src/types/rule-types.ts` (delete `ENUM`, `TERMINAL` constants, ~lines 26,29).
- Modify: `packages/codegen/src/types/rule.ts` (delete `isEnum`, ~line 510).
- Modify: `packages/codegen/src/compiler/link.ts` (migrate the one `isEnum` caller at ~line 3117 to `isEnumChoiceRule`).

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Re-verify zero call sites for the three `init()`/`collect()` pairs**

Run `find_all_references` (cross-checked with text search) for `wrap.init`, `wrap.collect`, `from.init`, `from.collect`, `factories.init`, `factories.collect`. Expected: 0 callers each (back-compat no-ops).

- [ ] **Step 2: Delete the six back-compat stub functions**

Remove `wrap.init()`/`wrap.collect()` from `packages/codegen/src/emitters/wrap.ts:117-125`, `from.init()`/`from.collect()` from `packages/codegen/src/emitters/from.ts:264-266`, `factories.init()`/`factories.collect()` from `packages/codegen/src/emitters/factories.ts:401-403`. Remove their "Back-compat no-op" / "Back-compat stub" doc comments too.

- [ ] **Step 3: Migrate `isEnum`'s one caller, then delete `isEnum`**

In `packages/codegen/src/compiler/link.ts` (re-verify line 3117 first), change the call from `isEnum(...)` to `isEnumChoiceRule(...)` — confirm the import at the top of the file already brings in `isEnumChoiceRule` (from `types/rule.ts`); add the import if missing. Then in `packages/codegen/src/types/rule.ts`, delete the `isEnum` function declaration (~line 510).

- [ ] **Step 4: Delete the retired `ENUM`/`TERMINAL` constants**

In `packages/codegen/src/types/rule-types.ts` (~lines 26,29), delete the `ENUM` and `TERMINAL` constant declarations. Re-verify first that every other reference to these two names anywhere in the codebase is inside a comment (not live code) — if you find a live reference, stop and report it rather than deleting.

- [ ] **Step 5: Run the full test suite**

Run: `pnpm test`
Expected: PASS.

- [ ] **Step 6: Regenerate and re-verify the baseline**

```bash
pnpm exec tsx packages/cli/src/cli.ts gen --grammar rust --all --output packages/rust/src
pnpm exec tsx packages/cli/src/cli.ts gen --grammar typescript --all --output packages/typescript/src
pnpm exec tsx packages/cli/src/cli.ts gen --grammar python --all --output packages/python/src
SITTIR_NATIVE_DEBUG=0 pnpm run validate:native > /tmp/task4-validate.log 2>&1; tail -100 /tmp/task4-validate.log
```
Expected: exactly rust=117/typescript=75/python=102, and NO diff in generated `packages/{rust,typescript,python}/src/*` beyond the manifest/fixtures (these stubs and constants are not consumed by any template).

- [ ] **Step 7: Commit**

```bash
git add packages/codegen/src/emitters/wrap.ts packages/codegen/src/emitters/from.ts packages/codegen/src/emitters/factories.ts packages/codegen/src/types/rule-types.ts packages/codegen/src/types/rule.ts packages/codegen/src/compiler/link.ts
git add packages/rust/.sittir/generated.manifest.json packages/typescript/.sittir/generated.manifest.json packages/python/.sittir/generated.manifest.json rust/crates/sittir-rust/test-fixtures.json rust/crates/sittir-typescript/test-fixtures.json rust/crates/sittir-python/test-fixtures.json
git commit -m "chore: delete zero-caller emitter stubs, retired ENUM/TERMINAL consts, and duplicate isEnum

wrap/from/factories .init()/.collect() were back-compat no-ops with
zero call sites. ENUM/TERMINAL were retired discriminants (PR-P) with
only comment references left. isEnum was a weaker duplicate of
isEnumChoiceRule lacking phantom-brand narrowing; migrated its one
caller (link.ts) and deleted it."
```

---

## Task 5: Cluster A — remove `toNativeRenderTransport` stub (generated-output-affecting)

**CORRECTION (found on first dispatch):** `packages/tools/src/probe/kind.ts:930-955`'s
`nativeRenderPayload` dynamically imports each grammar's generated `utils.ts`
and calls `toNativeRenderTransport`, **throwing** if it's absent — a genuine,
still-live production caller the original grounding never found (unlike
Tasks 3-4's stale-premise pattern, this one is real). It's used by
`probe-kind`'s native-engine render path (`kind.ts:427-428`, `798-799,813`).
Since the stub is already just an identity no-op (`return node`), the fix is
to make `kind.ts` degrade gracefully instead of requiring it — this task's
scope now includes that fix. Also: `utils-engine-emit.test.ts` has only ONE
matching test (`'emits a deprecated no-op native transport seam'`, lines
36-57), not two as originally described.

**Files:**
- Modify: `packages/codegen/src/emitters/client-utils.ts` (~line 126, stop emitting the stub).
- Modify: `packages/codegen/src/emitters/__tests__/utils-engine-emit.test.ts` (remove the 1 test case asserting the stub's presence).
- Modify: `packages/tools/src/probe/kind.ts:930-945` (`nativeRenderPayload` — fall back to an identity projection instead of throwing when `toNativeRenderTransport` is absent).

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Re-read the current emitter, the test file, and `kind.ts`'s caller**

Re-verify `client-utils.ts`'s current content around the stub emission, the test case in `utils-engine-emit.test.ts` (confirm it's really just 1, not 2), and `packages/tools/src/probe/kind.ts:930-955`'s `nativeRenderPayload`/`renderNodeDataNative` (confirm the throw-on-absent behavior and its call sites at `kind.ts:427-428`, `798-799,813`).

- [ ] **Step 2: Confirm the test currently passes (baseline)**

Run: `pnpm vitest run packages/codegen/src/emitters/__tests__/utils-engine-emit.test.ts`
Expected: PASS, including the `toNativeRenderTransport` assertion.

- [ ] **Step 3: Fix `kind.ts` to not require the stub**

In `packages/tools/src/probe/kind.ts`'s `nativeRenderPayload`, change:
```ts
const project = utils.toNativeRenderTransport;
if (!project) {
	throw new Error(`native transport projector missing for grammar '${grammar}'`);
}
```
to:
```ts
const project = utils.toNativeRenderTransport ?? ((node: unknown) => node);
```
This preserves the exact current runtime behavior (the stub is an identity no-op today, so this fallback is behaviorally identical) while removing the hard dependency on an emitter output this task is about to delete. Run `pnpm vitest run` on whatever test file covers `probe/kind.ts`'s native render path (search for it) to confirm no regression from this specific change before moving on.

- [ ] **Step 4: Remove the stub emission from the emitter template**

In `packages/codegen/src/emitters/client-utils.ts`, remove the code path that emits `toNativeRenderTransport`'s no-op body into generated `utils.ts`. Do not touch anything else in this template.

- [ ] **Step 5: Delete the now-obsolete test case**

In `packages/codegen/src/emitters/__tests__/utils-engine-emit.test.ts`, remove the `it('emits a deprecated no-op native transport seam', ...)` block.

- [ ] **Step 6: Regenerate all three grammars and inspect the diff**

```bash
pnpm exec tsx packages/cli/src/cli.ts gen --grammar rust --all --output packages/rust/src
pnpm exec tsx packages/cli/src/cli.ts gen --grammar typescript --all --output packages/typescript/src
pnpm exec tsx packages/cli/src/cli.ts gen --grammar python --all --output packages/python/src
git diff --stat -- packages/rust/src/utils.ts packages/typescript/src/utils.ts packages/python/src/utils.ts
```
Expected: each grammar's generated `utils.ts` shrinks by the removed stub function — this IS an expected generated-output change for this task, review it (confirm `toNativeRenderTransport` is gone and nothing else changed) rather than treating the diff as a failure.

- [ ] **Step 7: Run the full test suite**

Run: `pnpm test`
Expected: PASS.

- [ ] **Step 8: Re-verify the native validation baseline**

Run: `SITTIR_NATIVE_DEBUG=0 pnpm run validate:native > /tmp/task5-validate.log 2>&1; tail -100 /tmp/task5-validate.log`
Expected: exactly rust=117/typescript=75/python=102 (this task removes a no-op stub, so counts should not move — only the generated file's byte content changes).

- [ ] **Step 9: Commit (feature commit — includes `kind.ts`, unlike the original task text)**

```bash
git add packages/codegen/src/emitters/client-utils.ts packages/codegen/src/emitters/__tests__/utils-engine-emit.test.ts packages/tools/src/probe/kind.ts packages/rust/src/utils.ts packages/typescript/src/utils.ts packages/python/src/utils.ts packages/rust/.sittir/generated.manifest.json packages/typescript/.sittir/generated.manifest.json packages/python/.sittir/generated.manifest.json packages/rust/.sittir/grammar.js packages/typescript/.sittir/grammar.js packages/python/.sittir/grammar.js
git commit -m "chore: stop emitting deprecated toNativeRenderTransport no-op stub

Removes the emitter's dead no-op body from generated utils.ts across
all three grammars, and the two tests that only asserted its
presence."
```

---

## Task 6: Cluster A — additional test-only/dead exports (batch 1: grammar-shapes, scm, scripts, compiler)

**Files:**
- Modify: `packages/codegen/src/grammar-shapes/grammar-twin.ts` (delete `SchemaRuleName`, `RecursiveRuleBuilder`, ~lines 65,73 — re-evaluate the rest of the file once these are gone, since the spec notes it has zero production importers).
- Modify: `packages/codegen/src/grammar-shapes/path-type.ts` (delete `RuleAtPath`, ~line 95 — keep `FastKeys`/`TransformPatchMap`, which are production-used).
- Modify: `packages/codegen/src/grammar-shapes/grammar-json.ts` (delete `ContainerRule`, ~line 189).
- Modify: `packages/codegen/src/compiler/link.ts` (delete `makeLinkedGrammar`, ~line 194).
- Modify: `packages/codegen/src/compiler/collect-slots.ts` (delete `findFieldsWithRepeatFlag`).
- Modify: `packages/codegen/src/compiler/model/node-map.ts` (delete `mergeSlotValues`).
- Modify: `packages/codegen/src/scm/extract-roles.ts` (delete `TriviaRoleMap`, ~line 29).
- Modify: `packages/codegen/src/scripts/generated-manifest.ts` (delete `verifyAll`, ~line 359, after confirming `assertGeneratedManifestsClean` covers the same ground).
- Modify: `packages/codegen/src/dsl/transform/transform.ts` (delete `insert`, `replace`, ~lines 955,982).
- Modify: `packages/codegen/src/dsl/index.ts` (remove `insert`/`replace` from the public re-export surface).
- Modify: `packages/codegen/src/emitters/factories.ts` (delete `emitFactories`, ~line 78 — correct/remove its stale "preserved for backwards compatibility" doc comment).
- Modify: `packages/codegen/src/emitters/templates.ts` (delete the duplicate `snakeToCamel`, ~line 148 — keep the canonical one in `node-map.ts`).
- Modify: `packages/codegen/src/emitters/shared.ts` (delete `isAutoStampSlot`, ~line 314).
- Modify: `packages/codegen/src/emitters/render-module.ts` (delete `emitRenderModuleBundle`, ~line 381).
- Modify or delete affected test files: `grammar-shapes/__tests__/transform-original.test-d.ts`, `intellisense-demo.test-d.ts` (remove references to deleted symbols, keep everything else), `compiler/__tests__/ctx-walker.test.ts` (remove the `makeLinkedGrammar` test), `compiler/__tests__/evaluate.test.ts` (remove the `insert`/`replace` tests), `emitters/__tests__/refine-emit.test.ts` and `utils-engine-emit.test.ts` (remove `emitFactories` references — re-check `utils-engine-emit.test.ts` doesn't lose unrelated coverage from Task 5's edit), `emitters/__tests__/templates-emitter-helpers.test.ts` (remove the `snakeToCamel` duplicate test if one exists, keep the `node-map.ts` version's test), `emitters/__tests__/render-module-emit.test.ts` (remove `emitRenderModuleBundle` test).

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Re-verify every symbol's caller set fresh (this batch came from a sweep that hit an infigraph outage partway through and fell back to regex search for part of its scope — do not skip this step)**

For each of the 14 symbols above, run `find_all_references` AND a direct text search, confirming: (a) the caller list matches what's documented (test-only or zero), (b) no NEW production caller has appeared since the spec was written. If any symbol now has a real production caller, stop that one deletion and report it.

- [ ] **Step 2: Confirm current test coverage passes (baseline)**

Run: `pnpm test`
Expected: PASS (record the count of passing tests as your "before" number).

- [ ] **Step 3: Delete the grammar-shapes symbols**

`SchemaRuleName`/`RecursiveRuleBuilder` in `grammar-twin.ts` (re-evaluate whether anything else in the file is worth keeping once these are gone — if the whole module becomes dead, delete the file and remove its import in whatever re-exports it, but only if you confirm this via Step 1's fresh caller check). `RuleAtPath` in `path-type.ts` (leave `FastKeys`/`TransformPatchMap` untouched). `ContainerRule` in `grammar-json.ts`.

- [ ] **Step 4: Delete the compiler symbols**

`makeLinkedGrammar` in `link.ts`. `findFieldsWithRepeatFlag` in `collect-slots.ts`. `mergeSlotValues` in `node-map.ts`.

- [ ] **Step 5: Delete the scm and scripts symbols**

`TriviaRoleMap` in `scm/extract-roles.ts`. For `verifyAll` in `scripts/generated-manifest.ts`: first read `assertGeneratedManifestsClean` (wherever it's actually defined — likely the same file or a sibling) and confirm it genuinely covers what `verifyAll` did; only then delete `verifyAll` and correct its stale doc comment (which currently claims `packages/validator/src/cli.ts` calls it).

- [ ] **Step 6: Delete `insert`/`replace` and narrow the `dsl/index.ts` public surface**

In `dsl/transform/transform.ts`, delete both function declarations. In `dsl/index.ts`, remove `insert`/`replace` from the exported names (keep `transform` and everything else).

- [ ] **Step 7: Delete the emitter symbols**

`emitFactories` in `emitters/factories.ts` (correct/remove its stale doc comment). Duplicate `snakeToCamel` in `emitters/templates.ts` (confirm the file's own callers switch to importing from `node-map.ts` instead — check the top of `templates.ts` for how it currently gets `snakeToCamel` and fix the import if it was using its own local copy). `isAutoStampSlot` in `emitters/shared.ts`. `emitRenderModuleBundle` in `emitters/render-module.ts`.

- [ ] **Step 8: Update every test file that referenced a deleted symbol**

Go through each test file listed in this task's Files section and remove only the specific test cases / imports that referenced the now-deleted symbols. Do not remove unrelated coverage in the same file.

- [ ] **Step 9: Run the full test suite**

Run: `pnpm test`
Expected: PASS, with exactly the expected reduction in test count (the removed test cases, no more no less).

- [ ] **Step 10: Regenerate and re-verify the baseline**

```bash
pnpm exec tsx packages/cli/src/cli.ts gen --grammar rust --all --output packages/rust/src
pnpm exec tsx packages/cli/src/cli.ts gen --grammar typescript --all --output packages/typescript/src
pnpm exec tsx packages/cli/src/cli.ts gen --grammar python --all --output packages/python/src
SITTIR_NATIVE_DEBUG=0 pnpm run validate:native > /tmp/task6-validate.log 2>&1; tail -100 /tmp/task6-validate.log
```
Expected: exactly rust=117/typescript=75/python=102, byte-neutral generated output.

- [ ] **Step 11: Commit**

```bash
git add packages/codegen/src/grammar-shapes packages/codegen/src/compiler/link.ts packages/codegen/src/compiler/collect-slots.ts packages/codegen/src/compiler/model/node-map.ts packages/codegen/src/scm/extract-roles.ts packages/codegen/src/scripts/generated-manifest.ts packages/codegen/src/dsl/transform/transform.ts packages/codegen/src/dsl/index.ts packages/codegen/src/emitters/factories.ts packages/codegen/src/emitters/templates.ts packages/codegen/src/emitters/shared.ts packages/codegen/src/emitters/render-module.ts
git add -u packages/codegen/src/compiler/__tests__ packages/codegen/src/emitters/__tests__
git add packages/rust/.sittir/generated.manifest.json packages/typescript/.sittir/generated.manifest.json packages/python/.sittir/generated.manifest.json rust/crates/sittir-rust/test-fixtures.json rust/crates/sittir-typescript/test-fixtures.json rust/crates/sittir-python/test-fixtures.json
git commit -m "chore: delete test-only/dead exports found by the Track 1 sweep

14 symbols across grammar-shapes, scm, scripts, compiler, and emitters
with zero production callers (test-only or fully unreferenced),
verified fresh before deletion. Narrows dsl/index.ts's public surface
(insert/replace had zero production adoption despite being exported)."
```

---

## Task 7: Cluster A — resolve the disputed `getCurrentWireContext`/`withWireContext` pair

**Files:**
- Modify (outcome depends on this task's own investigation): `packages/codegen/src/dsl/wire/wire.ts:141,219`.
- Possibly modify: `packages/codegen/src/dsl/__tests__/wire.test.ts`, `polymorph-metadata.test.ts`, `refine.test.ts`, `transform-hoist.test.ts` (only if the investigation concludes "delete").

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Read `wire.ts` in full — don't just re-run `find_all_references`**

Read `packages/codegen/src/dsl/wire/wire.ts` end to end, paying specific attention to: how `wire()` itself builds its `WireContext` (the spec cites this happening inline around line 570 — confirm), whether `getCurrentWireContext`/`withWireContext` are called from anywhere in the production `wire()` pipeline, and what `currentContext` (the module-level singleton these two functions read/write) is actually used for elsewhere in the file.

- [ ] **Step 2: Read all four test consumers in full**

Read `dsl/__tests__/wire.test.ts`, `polymorph-metadata.test.ts`, `refine.test.ts`, `transform-hoist.test.ts` — specifically the test cases that call `getCurrentWireContext`/`withWireContext`. Determine: are these tests exercising real, load-bearing DSL behavior that happens to need an isolated context (legitimate test-harness seam), or are they testing something that's otherwise untestable/irrelevant because production never calls these functions (debt)?

- [ ] **Step 3: Reach and document a conclusion**

Write a short note (in this task's commit message, not a separate file) stating which verdict you reached and why, citing the specific code you read in Steps 1-2 — not just "one sub-agent said X."

- [ ] **Step 4a: If the verdict is KEEP (legitimate test infrastructure)**

Do nothing to the code. Skip to Step 5. Note in the commit message (of the NEXT task, since there's nothing to commit here) why these are being kept.

- [ ] **Step 4b: If the verdict is DELETE (debt)**

Confirm test coverage passes first (`pnpm vitest run packages/codegen/src/dsl/__tests__/wire.test.ts packages/codegen/src/dsl/__tests__/polymorph-metadata.test.ts packages/codegen/src/dsl/__tests__/refine.test.ts packages/codegen/src/dsl/__tests__/transform-hoist.test.ts`), then delete both functions from `wire.ts` and update the four test files to stop using them (rewrite their setup to establish context however `wire()` itself does it in production, or remove the specific assertions that depended on these functions if they're no longer meaningful). Run the full suite (`pnpm test`) and confirm PASS. Regenerate all three grammars and re-verify the baseline (same commands as prior tasks). Commit:
```bash
git add packages/codegen/src/dsl/wire/wire.ts packages/codegen/src/dsl/__tests__/wire.test.ts packages/codegen/src/dsl/__tests__/polymorph-metadata.test.ts packages/codegen/src/dsl/__tests__/refine.test.ts packages/codegen/src/dsl/__tests__/transform-hoist.test.ts
git commit -m "chore: delete getCurrentWireContext/withWireContext (dsl/wire/wire.ts)

Resolved the Track 1 spec's disputed verdict on this pair by reading
wire.ts and its four test consumers directly: [fill in your actual
one-line reasoning from Step 3 here]."
```

- [ ] **Step 5: If KEEP was the verdict, skip committing anything for this task** — there's no code change, just a documented decision. Move on to Task 8.

---

## Task 8: Cluster A — dead-branch deletion + doc-comment corrections

**CORRECTION (found when this task was first dispatched):** all of this
task's targets were already fixed by an earlier, unrelated commit
(`0ddf6a771`, "debt PR-B/C batch — shims, deprecated aliases, dead
MIDWAY-STATE branches (#124)") before Task 8 was ever dispatched. The dead
`children.length > 0` / `structuralChildrenOf(node)` guard branches in
`transport-common.ts` and `factory-map.ts` were already deleted by that
commit. The `metadata.inlinedFrom` doc-comment premise also no longer held —
that commit's follow-on work moved spacing-behavior responsibility to a
separately-documented `splicedBody` flag (`packages/codegen/src/types/rule.ts`),
and the current `inlinedFrom` comment already reflects this correctly. Direct
investigation (re-reading both files + `git log -S` on the cited line ranges)
confirmed there was nothing left to do. Task 8 therefore executed as a no-op
with no commit.

**Files:**
- Modify: `packages/codegen/src/emitters/transport-common.ts` (~lines 116-126,135-141 — delete dead branches).
- Modify: `packages/codegen/src/emitters/factory-map.ts` (~lines 102-110 — delete dead branch).
- Modify: `packages/codegen/src/types/rule.ts` (~lines 235,251-252 — correct `RenderRule`/`SimplifiedRule` doc comments; ~line 129 — correct `metadata.inlinedFrom` doc comment).

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Confirm the dead branches are still provably unreachable**

Re-verify `packages/codegen/src/compiler/model/node-map.ts`'s `AssembledBranch.children` still always returns `[]` (~line 2861 in the spec's citation — re-check). Re-read the two guard conditions (`node.children.length > 0` in `transport-common.ts`, `structuralChildrenOf(node)` in `factory-map.ts`) and confirm they're still structurally guaranteed false.

- [ ] **Step 2: Confirm baseline test coverage for both files**

Run: `pnpm vitest run packages/codegen/src/emitters/__tests__` (or the specific test files covering `transport-common.ts`/`factory-map.ts` if they're not covered by the broader emitters test directory)
Expected: PASS.

- [ ] **Step 3: Delete the dead branches**

Remove the guarded dead code in both `transport-common.ts:116-126,135-141` and `factory-map.ts:102-110`, along with the "leaving the code structure intact so the dead-code pattern is visible to the cleanup pass" comments (their job is done).

- [ ] **Step 4: Correct the two misleading doc comments**

In `packages/codegen/src/types/rule.ts`:
- `RenderRule`/`SimplifiedRule` (~lines 235,251-252): rewrite the comment to state the phantom brand fields (`__renderRule?: never`, `__simplifiedRule?: never`) do NOT provide real compile-time enforcement (both are optional and never written, so the types remain mutually assignable) — keep the names and fields as-is (no behavior change), just stop claiming protection that doesn't exist.
- `metadata.inlinedFrom` (~line 129): rewrite the comment to state it drives render spacing behavior at `emitters/templates.ts:434,492` — it is NOT "diagnostics only."

- [ ] **Step 5: Run the full test suite**

Run: `pnpm test`
Expected: PASS (no behavior change — dead code removal + comment fixes only).

- [ ] **Step 6: Regenerate and re-verify the baseline**

```bash
pnpm exec tsx packages/cli/src/cli.ts gen --grammar rust --all --output packages/rust/src
pnpm exec tsx packages/cli/src/cli.ts gen --grammar typescript --all --output packages/typescript/src
pnpm exec tsx packages/cli/src/cli.ts gen --grammar python --all --output packages/python/src
SITTIR_NATIVE_DEBUG=0 pnpm run validate:native > /tmp/task8-validate.log 2>&1; tail -100 /tmp/task8-validate.log
```
Expected: exactly rust=117/typescript=75/python=102, byte-neutral.

- [ ] **Step 7: Commit**

```bash
git add packages/codegen/src/emitters/transport-common.ts packages/codegen/src/emitters/factory-map.ts packages/codegen/src/types/rule.ts
git add packages/rust/.sittir/generated.manifest.json packages/typescript/.sittir/generated.manifest.json packages/python/.sittir/generated.manifest.json rust/crates/sittir-rust/test-fixtures.json rust/crates/sittir-typescript/test-fixtures.json rust/crates/sittir-python/test-fixtures.json
git commit -m "chore: delete provably-dead branches, correct misleading doc comments

transport-common.ts and factory-map.ts's children-length guards are
unreachable since AssembledBranch.children was retired to always
return []. RenderRule/SimplifiedRule's brand comment and
metadata.inlinedFrom's 'diagnostics only' comment both claimed
behavior the code doesn't have — corrected, no code change."
```

---

## Task 9: Cluster A — exclude `.jinja` templates from npm package output

**Files:**
- Modify: `packages/typescript/package.json:19-21`.
- Modify: `packages/python/package.json:19-21`.
- Modify: `packages/rust/package.json:19-21`.

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Confirm the current `files` array in all three package.json files**

Read each of the three `files` arrays and confirm they currently include `"templates/*.jinja"` alongside `"dist"`.

- [ ] **Step 2: Remove `"templates/*.jinja"` from all three**

Edit each `package.json`'s `files` array to drop the `"templates/*.jinja"` entry, leaving `"dist"` (and anything else already there) untouched.

- [ ] **Step 3: Verify nothing else references this files-array entry**

Check each package's build scripts (`package.json`'s own `scripts` block) and any `.npmignore`/`files`-adjacent config to confirm nothing else assumes `.jinja` ships in the published package.

- [ ] **Step 4: Run the full test suite**

Run: `pnpm test`
Expected: PASS (this is a packaging-metadata-only change, no code behavior affected).

- [ ] **Step 5: Commit**

```bash
git add packages/typescript/package.json packages/python/package.json packages/rust/package.json
git commit -m "chore: exclude templates/*.jinja from all three grammar packages' npm output

Jinja templates are consumed by the Rust build pipeline directly from
the source repo, not from a published npm package — none of the three
published packages need to carry them."
```

---

## Task 10: Cluster A — introduce `@forFutureUse` tagging convention

**Files:**
- Modify: `.claude/codegen-conventions.md` (document the convention).
- Modify: `packages/common/src/metrics.ts` (tag `PerKindMetrics`, `FfiMetrics`, `MetricsFile`, `recordFfi`).
- Modify: `packages/common/src/nodeData.ts` (tag `freezeNodeData`, `buildWithNamespace`).
- Modify: `packages/common/src/utils.ts` (tag `WithMethodsRuntime`).
- Modify: `packages/common/src/edit.ts` (tag `replace`, `bindRange`, `replaceField`).
- Modify: `packages/common/src/cst.ts` (tag `toCst`, `CstRenderer`).
- Modify: `packages/common/src/native-boundary.ts` (tag `isRenderableNodeData`).
- Modify: `packages/common/src/engine.ts` (tag `BackendStatusLike`).

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: the `@forFutureUse` tag convention, which future dead-code sweeps (manual or tool-assisted) should recognize and skip.

- [ ] **Step 1: Document the convention**

In `.claude/codegen-conventions.md`, add a new section:

```markdown
## `@forFutureUse` tagging convention

A JSDoc tag mirroring `@deprecated` but with the opposite intent: marks a
symbol that is deliberately kept despite having no current caller, because
it implements (or partially implements) an Accepted ADR or a
drafted-but-deferred (not rejected) spec. `@deprecated` says "remove this
despite it having callers"; `@forFutureUse` says "keep this despite it
having none."

Format — always include a one-line reason citing the ADR/spec:

```ts
/**
 * @forFutureUse ADR-0018 (dehoisted NodeData surface) — $with update namespace.
 * Not yet wired into generated output; scaffolding only.
 */
```

Before deleting any exported symbol with zero (or test-only) callers,
check whether it carries this tag. If it does, do not delete it as part
of a routine dead-code sweep — its disposition (finish wiring it up, or
formally retire it) is a decision for whoever owns the referenced
ADR/spec, not a mechanical cleanup pass.
```

- [ ] **Step 2: Apply the tag to `metrics.ts`'s FFI/perf-telemetry scaffolding**

In `packages/common/src/metrics.ts`, add this doc comment above each of `PerKindMetrics`, `FfiMetrics`, `MetricsFile`, `recordFfi`:
```ts
/**
 * @forFutureUse archived spec 054 (specs/archive-054-post-016-perf-tracking) —
 * SITTIR_METRICS per-render timing / FFI-cost-tracking design. Drafted,
 * not implemented; deferred, not abandoned.
 */
```

- [ ] **Step 3: Apply the tag to the ADR-0018 `$with`/frozen scaffolding**

In `packages/common/src/nodeData.ts`, above `freezeNodeData` and `buildWithNamespace`:
```ts
/**
 * @forFutureUse ADR-0018 (docs/adr/0018-dehoist-nodedata-surface.md) —
 * frozen NodeData / $with update namespace. Not yet wired into generated
 * output; scaffolding only.
 */
```
In `packages/common/src/utils.ts`, above `WithMethodsRuntime`, the same tag text (adjust the one-line description to mention the `$with` runtime shape specifically).

- [ ] **Step 4: Apply the tag to the `$replace`/`$toEdit` scaffolding**

In `packages/common/src/edit.ts`, above `replace`, `bindRange`, `replaceField`:
```ts
/**
 * @forFutureUse ADR-0018 (docs/adr/0018-dehoist-nodedata-surface.md) —
 * $replace method. Not yet wired into generated output; scaffolding only.
 */
```
In `packages/common/src/cst.ts`, above `toCst` and `CstRenderer`, the same tag text (adjust the description to mention `$toEdit`/CST rendering).

- [ ] **Step 5: Apply the tag to the remaining native-boundary scaffolding**

In `packages/common/src/native-boundary.ts`, above `isRenderableNodeData`:
```ts
/**
 * @forFutureUse ADR-0018 (docs/adr/0018-dehoist-nodedata-surface.md) —
 * napi-direct native boundary validation. Not yet wired into generated
 * output; scaffolding only.
 */
```
In `packages/common/src/engine.ts`, above `BackendStatusLike`, the same tag text (adjust the description).

- [ ] **Step 6: Run the full test suite**

Run: `pnpm test`
Expected: PASS (pure doc-comment additions, zero behavior change).

- [ ] **Step 7: Commit**

```bash
git add .claude/codegen-conventions.md packages/common/src/metrics.ts packages/common/src/nodeData.ts packages/common/src/utils.ts packages/common/src/edit.ts packages/common/src/cst.ts packages/common/src/native-boundary.ts packages/common/src/engine.ts
git commit -m "docs: introduce @forFutureUse tagging convention, apply to ADR-0018/spec-054 scaffolding

Marks the packages/common/src cluster tied to ADR-0018 (dehoisted
NodeData surface) and archived spec 054 (perf/FFI telemetry) so future
dead-code sweeps recognize it as deliberately retained rather than
re-flagging it as mystery debt every pass."
```

---

## Task 11: Cluster E — single-phase method consolidation

**CORRECTION (found when this task was first dispatched):** the plan originally
mandated lsproxy `move-symbol`/`move-file` for every move. Direct investigation
(both by the dispatched implementer and by the controller independently)
confirmed neither the globally-installed `lsproxy` (v0.11.4) nor the `lspeasy`
repo's current source tree (`apps/cli/src` has no `commands/move-*.ts` at all —
the `dist/commands/move-symbol.js`/`move-file.js` files are stale leftovers
from a since-replaced, purely-capability-driven CLI architecture) exposes a
move-symbol/move-file command — only raw LSP passthrough
(`textDocument`/`workspace` namespaces). TypeScript's language server DOES
expose "Move to a new file" as a genuine `refactor.move.newFile` code action
(confirmed via `lsproxy textDocument codeAction <file> <range>`), but applying
it through lsproxy's `workspace executeCommand` is unreliable in practice — a
`--dry-run` attempt against `isAliasMintedRef` looped, generating
`isAliasMintedRef.1.ts` through `.7.ts` phantom target files instead of a
single clean move, apparently because the refactor needs an explicit target-
file argument lsproxy has no clean way to supply. **The user explicitly
authorized manual `Edit`-based moves as a one-time tooling exception for this
task** given both automated mechanisms are unusable in this environment —
apply the same rigor manual Edit would need anyway (verify caller counts
before AND after, confirm no stray re-export left behind, full test suite).

**Also corrected via the implementer's fresh re-verification:** `flatten`
does not exist anywhere in `packages/codegen/src` under that name (only the
English word appears in an unrelated comment in `wrapper-deletion.ts`) — that
move is dropped entirely, nothing to do for it. `findStructuralVariantChoices`/
`StructuralVariantChoice` in `variant-structural.ts` are **NOT** dead — confirmed
called internally by `deriveStructuralVariantChildren`, itself a live production
export `link.ts` imports and calls — do NOT delete these two; scope corrected
to exclude them entirely.

**Further correction (found during execution — `isTerminalShape` landed, `isAliasMintedRef` did NOT):**
`isAliasMintedRef` cannot move out of `variant-structural.ts` — it's called
internally by that file's own `namedKindArmTarget` (line 246), which feeds
`findStructuralVariantChoices` (which must stay per the correction above).
`link.ts` already imports `deriveStructuralVariantChildren`/`prefixNamedSuffix`
FROM `variant-structural.ts`; moving `isAliasMintedRef` to `link.ts` would
either create a circular import back into `variant-structural.ts` or force
duplicating the predicate. **`isAliasMintedRef` stays in `variant-structural.ts`**
— same category as `deleteWrapper`'s documented import-cycle exclusion, just
discovered later. `isTerminalShape` (the other single move) DID land cleanly:
committed `48292a847` (feature) + `11611b0f2` (validator). The `buildRuleCatalog`/
`attachReferenceRuleIds` move and the `createEmptyRuleCatalog` deletion are
still pending — blocked only by test-file coupling, not architecture (see
Task 11b below), not a hard exclusion like `isAliasMintedRef`.

---

## Task 11b: Cluster E — finish `buildRuleCatalog`/`attachReferenceRuleIds` move + `createEmptyRuleCatalog` deletion

**Why a separate task:** Task 11's dispatch found `buildRuleCatalog` is imported
directly (not just re-exported) by 6 test files not in Task 11's original file
list (`compiler/__tests__/slot-structural-signals.test.ts`,
`compiler/__tests__/kind-id-rust-emit.test.ts`,
`compiler/diagnostics/__tests__/grammar-diagnostics.test.ts`,
`compiler/__tests__/kindid-emit.test.ts`,
`compiler/__tests__/node-map-backpointers.test.ts`,
`compiler/diagnostics/__tests__/parsekind-collisions.test.ts`), and
`createEmptyRuleCatalog` is imported directly by 3 more
(`compiler/__tests__/link.test.ts`, `compiler/__tests__/generate.test.ts`,
`emitters/__tests__/refine-emit.test.ts`). This is test-import plumbing, not an
architectural blocker like `isAliasMintedRef`'s — the fix is to update all 9
test files' imports alongside the move/deletion.

**Files:**
- Modify: `packages/codegen/src/compiler/rule-catalog.ts` (remove `buildRuleCatalog`/`attachReferenceRuleIds`, moved to `evaluate.ts`; delete `createEmptyRuleCatalog`; keep `isNonterminalRuleType` and whatever private helpers (`classifyByType`/`classifyIntrinsic`) it depends on — if `buildRuleCatalog` also depends on those helpers, keep them in `rule-catalog.ts` and import into `evaluate.ts` rather than duplicating).
- Modify: `packages/codegen/src/compiler/evaluate.ts` (receives `buildRuleCatalog`/`attachReferenceRuleIds`).
- Modify the 6 test files that import `buildRuleCatalog` directly to import it from `evaluate.ts` instead: `compiler/__tests__/slot-structural-signals.test.ts`, `compiler/__tests__/kind-id-rust-emit.test.ts`, `compiler/diagnostics/__tests__/grammar-diagnostics.test.ts`, `compiler/__tests__/kindid-emit.test.ts`, `compiler/__tests__/node-map-backpointers.test.ts`, `compiler/diagnostics/__tests__/parsekind-collisions.test.ts`.
- Modify the 3 test files that import `createEmptyRuleCatalog` directly (`compiler/__tests__/link.test.ts`, `compiler/__tests__/generate.test.ts`, `emitters/__tests__/refine-emit.test.ts`) — read what each actually uses it for; either replace with an equivalent inline object literal (check `createEmptyRuleCatalog`'s exact return shape first) or remove the specific test cases if the coverage is redundant with other tests. Re-verify `createEmptyRuleCatalog` truly has zero non-test callers before deleting.

- [ ] Step 1: Re-verify `buildRuleCatalog`/`attachReferenceRuleIds` still have exactly one PRODUCTION caller-file (`evaluate.ts`) — the 6 test files' direct imports don't count against "single-phase," they just need updating alongside the move. Re-verify `createEmptyRuleCatalog` has zero production callers (only the 3 test files).
- [ ] Step 2: Move `buildRuleCatalog` + `attachReferenceRuleIds` from `rule-catalog.ts` to `evaluate.ts` via Edit (lsproxy move-symbol/move-file unavailable — see the correction note above Task 11b; same manual-move exception applies). Confirm `isNonterminalRuleType` (which stays in `rule-catalog.ts`, consumed by `wrapper-deletion.ts`) still has access to whatever private helpers it shares with `buildRuleCatalog`.
- [ ] Step 3: Update the 6 test files' `buildRuleCatalog` import to point at `evaluate.ts`.
- [ ] Step 4: Delete `createEmptyRuleCatalog` from `rule-catalog.ts`; update the 3 test files that used it (inline the equivalent object literal or drop redundant test cases — read each site first).
- [ ] Step 5: Run `pnpm test` — expect PASS modulo the known pre-existing unrelated baseline (confirm no NEW failures beyond intentional test-file edits).
- [ ] Step 6: Regenerate and re-verify baseline (same 3-grammar regen + `SITTIR_NATIVE_DEBUG=0 pnpm run validate:native` pattern as every other task) — expect exactly rust=117/typescript=75/python=102, byte-neutral.
- [ ] Step 7: Commit (feature commit + separate validator commit, same two-commit split as every other task):
```
git commit -m "refactor: move buildRuleCatalog/attachReferenceRuleIds to evaluate.ts, delete createEmptyRuleCatalog (manual move, lsproxy move-symbol unavailable)

Completes Task 11's single-phase consolidation for the remaining pair.
Required updating 6 test files' direct buildRuleCatalog imports and 3
test files' createEmptyRuleCatalog usage alongside the move/deletion —
this is why it landed as a follow-up task rather than in Task 11 itself."
```

**Task 11 outcome (superseded by the corrections above — this is what actually landed):**
`isTerminalShape` moved `link.ts` → `normalize.ts`, and `wrapVariants`/
`deduplicateVariants`/`nameVariant` were deleted from `link.ts`, with
`normalize.ts`'s re-export narrowed to just `tokenToName`. Committed
`48292a847` (feature) + `11611b0f2` (validator). `isAliasMintedRef` stays in
`variant-structural.ts` (circular-import hazard, permanent exclusion).
`buildRuleCatalog`/`attachReferenceRuleIds`/`createEmptyRuleCatalog` deferred
to Task 11b (test-file coupling, not architectural — see above).

---

## Task 12: Cluster C — migrate `recurseChildren` callers onto `RuleWalker.map`, then delete it

**Files:**
- Modify: `packages/codegen/src/compiler/simplify.ts` (rewrite `canonicalizeSeqOfLeaves`, ~line 149).
- Modify: `packages/codegen/src/dsl/rule-transforms.ts` (rewrite `fuseHeadRepeatLists`, ~line 574; delete `recurseChildren`, ~line 451, tag at :432).

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Read `recurseChildren`'s full deprecation doc and both call sites**

Read `packages/codegen/src/dsl/rule-transforms.ts:432-451` (the `@deprecated` doc explicitly warns `RuleWalker.map` is not a drop-in replacement — read exactly why, so the rewrite preserves the same traversal semantics). Read `compiler/simplify.ts:149`'s `canonicalizeSeqOfLeaves` and `rule-transforms.ts:574`'s `fuseHeadRepeatLists` in full.

- [ ] **Step 2: Read `RuleWalker.map`'s current signature and semantics**

Find `RuleWalker`'s definition (likely `packages/codegen/src/dsl/rule-walker.ts`) and read its `map` method's exact signature, cycle-dedup behavior, and how per-edge tracking works (per prior session memory, `RuleWalker.map` already has per-edge tracking and cycle-safe dedup — confirm this directly by reading the code, don't rely on memory).

- [ ] **Step 3: Confirm baseline test coverage for both functions**

Run: `pnpm vitest run packages/codegen/src/compiler/__tests__/simplify-canonical.test.ts` (or wherever `canonicalizeSeqOfLeaves`'s tests live) and the equivalent test file for `fuseHeadRepeatLists`.
Expected: PASS — record the exact assertions so you can confirm identical behavior after the rewrite.

- [ ] **Step 4: Rewrite `canonicalizeSeqOfLeaves` onto `RuleWalker.map`**

Replace its current `recurseChildren`-based self-recursive visitor with an equivalent traversal built on `RuleWalker.map`, preserving the exact same input/output contract (same function signature, same return shape). Do not change its behavior — this is a mechanical traversal-engine swap.

- [ ] **Step 5: Rewrite `fuseHeadRepeatLists` onto `RuleWalker.map`**

Same approach — preserve the exact same contract.

- [ ] **Step 6: Run both functions' existing tests to confirm identical behavior**

Run: `pnpm vitest run packages/codegen/src/compiler/__tests__/simplify-canonical.test.ts` and the `fuseHeadRepeatLists` test file.
Expected: PASS with the exact same assertions as Step 3's baseline — no test changes needed if the rewrite preserved behavior correctly.

- [ ] **Step 7: Delete `recurseChildren`**

Remove the function and its `@deprecated` doc comment from `dsl/rule-transforms.ts:432-451` (re-verify these lines first).

- [ ] **Step 8: Run the full test suite**

Run: `pnpm test`
Expected: PASS.

- [ ] **Step 9: Regenerate and re-verify the baseline**

```bash
pnpm exec tsx packages/cli/src/cli.ts gen --grammar rust --all --output packages/rust/src
pnpm exec tsx packages/cli/src/cli.ts gen --grammar typescript --all --output packages/typescript/src
pnpm exec tsx packages/cli/src/cli.ts gen --grammar python --all --output packages/python/src
SITTIR_NATIVE_DEBUG=0 pnpm run validate:native > /tmp/task12-validate.log 2>&1; tail -100 /tmp/task12-validate.log
```
Expected: exactly rust=117/typescript=75/python=102, byte-neutral (this is a traversal-engine swap with identical semantics, not a behavior change).

- [ ] **Step 10: Commit**

```bash
git add packages/codegen/src/compiler/simplify.ts packages/codegen/src/dsl/rule-transforms.ts
git add packages/rust/.sittir/generated.manifest.json packages/typescript/.sittir/generated.manifest.json packages/python/.sittir/generated.manifest.json rust/crates/sittir-rust/test-fixtures.json rust/crates/sittir-typescript/test-fixtures.json rust/crates/sittir-python/test-fixtures.json
git commit -m "refactor: migrate canonicalizeSeqOfLeaves and fuseHeadRepeatLists onto RuleWalker.map

Both were recurseChildren's only two callers. Deletes recurseChildren
(deprecated, self-recursive, pre-RuleWalker traversal helper) now that
nothing calls it."
```

---

## Task 13: Cluster D — persist grammar diagnostics to JSON during `gen`

**Files:**
- Modify: `packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts` (add a JSON-serialization function alongside the existing `formatCompilerDiagnostics`/`formatGrammarDiagnostics`).
- Modify: `packages/codegen/src/run-codegen.ts` (~line 195, call the new function after the existing stderr print).
- Test: `packages/codegen/src/compiler/diagnostics/__tests__/grammar-diagnostics.test.ts` (extend, or find the existing test file for this module).

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `writeGrammarDiagnosticsJson(diagnostics: readonly CompilerDiagnostic[], outPath: string): void` — writes a JSON array of `{code, severity, location, message, proposal}` (matching each diagnostic's existing shape) to `outPath`. Task 14 reads the files this writes.
- Also produces: each `gen` invocation writes `packages/<grammar>/.sittir/grammar-diagnostics.json` (grammar-specific path — Task 14 needs to know this exact path/naming to read it back).

**Landed (corrected real shape — read this before starting Task 14):** committed as `338c67124` (feature) + `585c6e8e5` (validator). The REAL on-disk shape has **no `location` field** — `writeGrammarDiagnosticsJson` serializes the actual `GrammarDiagnostic | CompilerDiagnostic` union from `packages/codegen/src/types/diagnostics.ts`: base `Diagnostic` = `{code, severity, message, canProceed, proposal?, details?}`; `GrammarDiagnostic` adds `{scope: 'grammar', grammar, ownerKind?, slotName?, ruleId?, subject?}`; `CompilerDiagnostic` adds `{scope: 'compiler', phase, ruleId?, subject?}`. Task 14's reader must derive a `location` string from `ownerKind`/`slotName` (e.g. `ownerKind` alone, or `` `${ownerKind}.${slotName}` `` when both present) rather than reading a nonexistent `d.location` field. Also: typescript's actual current diagnostics are `typename-collision`, `seq-with-nested-seq`, `parsekind-noninjective`, `content-collision` (21 total) — `non-literal-separator` does NOT currently fire (the plan's assumed example was stale); don't assert on that specific code in Task 14's integration check.

- [ ] **Step 1: Read `grammar-diagnostics.ts`'s current `CompilerDiagnostic` type and `formatCompilerDiagnostics`/`formatGrammarDiagnostics` functions**

Confirm the exact shape of a `CompilerDiagnostic` (code, severity, location, message, proposal fields — re-verify names/types directly, don't assume).

- [ ] **Step 2: Write the failing test**

In the diagnostics module's test file, add:
```ts
import { describe, expect, it } from 'vitest';
import { writeGrammarDiagnosticsJson } from '../grammar-diagnostics.ts';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('writeGrammarDiagnosticsJson', () => {
	it('writes an array of diagnostics as JSON with code/severity/location/message/proposal fields', () => {
		const dir = mkdtempSync(join(tmpdir(), 'sittir-diag-test-'));
		const outPath = join(dir, 'grammar-diagnostics.json');
		const diagnostics = [
			{
				code: 'non-literal-separator',
				severity: 'warning' as const,
				location: 'interface_body.-',
				message: 'Separator is not a literal string.',
				proposal: 'See PR-T.'
			}
		];
		writeGrammarDiagnosticsJson(diagnostics, outPath);
		const written = JSON.parse(readFileSync(outPath, 'utf8'));
		expect(written).toEqual(diagnostics);
		rmSync(dir, { recursive: true, force: true });
	});

	it('writes an empty array when there are no diagnostics', () => {
		const dir = mkdtempSync(join(tmpdir(), 'sittir-diag-test-'));
		const outPath = join(dir, 'grammar-diagnostics.json');
		writeGrammarDiagnosticsJson([], outPath);
		expect(JSON.parse(readFileSync(outPath, 'utf8'))).toEqual([]);
		rmSync(dir, { recursive: true, force: true });
	});
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm vitest run packages/codegen/src/compiler/diagnostics/__tests__/grammar-diagnostics.test.ts -t writeGrammarDiagnosticsJson`
Expected: FAIL with "writeGrammarDiagnosticsJson is not a function" or a TypeScript compile error (the function doesn't exist yet).

- [ ] **Step 4: Implement `writeGrammarDiagnosticsJson`**

In `packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts`, add:
```ts
import { writeFileSync } from 'node:fs';

export function writeGrammarDiagnosticsJson(diagnostics: readonly CompilerDiagnostic[], outPath: string): void {
	writeFileSync(outPath, JSON.stringify(diagnostics, null, 2));
}
```
(Adjust the `CompilerDiagnostic` import/type name to match whatever it's actually called in this file — re-verify from Step 1.)

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm vitest run packages/codegen/src/compiler/diagnostics/__tests__/grammar-diagnostics.test.ts -t writeGrammarDiagnosticsJson`
Expected: PASS.

- [ ] **Step 6: Wire it into `run-codegen.ts`**

Read `packages/codegen/src/run-codegen.ts` around line 195 (re-verify — this is where `formatGrammarDiagnostics` currently prints non-blocking diagnostics to stderr via `process.stderr.write`). Right after that existing call, add:
```ts
import { join } from 'node:path';
// ... alongside the existing stderr write:
writeGrammarDiagnosticsJson(nonBlocking, join(cfg.grammarPackageDir, '.sittir', 'grammar-diagnostics.json'));
```
(Adjust `cfg.grammarPackageDir` to whatever the actual config object/field is called that holds e.g. `packages/typescript` — re-verify from the surrounding code in `run-codegen.ts`, don't guess the field name.)

- [ ] **Step 7: Run `gen` for one grammar and confirm the file is written**

Run: `pnpm exec tsx packages/cli/src/cli.ts gen --grammar typescript --all --output packages/typescript/src`
Then: `cat packages/typescript/.sittir/grammar-diagnostics.json`
Expected: a JSON array — for typescript specifically, it should include the `non-literal-separator` diagnostic (the known real hit, per the spec's grounding, from `interface_body`'s inherited `choice(',', $._semicolon)` separator).

- [ ] **Step 8: Run the full test suite**

Run: `pnpm test`
Expected: PASS.

- [ ] **Step 9: Regenerate all three grammars and re-verify the baseline**

```bash
pnpm exec tsx packages/cli/src/cli.ts gen --grammar rust --all --output packages/rust/src
pnpm exec tsx packages/cli/src/cli.ts gen --grammar typescript --all --output packages/typescript/src
pnpm exec tsx packages/cli/src/cli.ts gen --grammar python --all --output packages/python/src
SITTIR_NATIVE_DEBUG=0 pnpm run validate:native > /tmp/task13-validate.log 2>&1; tail -100 /tmp/task13-validate.log
```
Expected: exactly rust=117/typescript=75/python=102 (this task only adds a new side-effect JSON write, no behavior change to rendering/validation).

- [ ] **Step 10: Commit**

```bash
git add packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts packages/codegen/src/compiler/diagnostics/__tests__/grammar-diagnostics.test.ts packages/codegen/src/run-codegen.ts
git add packages/typescript/.sittir/grammar-diagnostics.json packages/rust/.sittir/grammar-diagnostics.json packages/python/.sittir/grammar-diagnostics.json
git add packages/rust/.sittir/generated.manifest.json packages/typescript/.sittir/generated.manifest.json packages/python/.sittir/generated.manifest.json rust/crates/sittir-rust/test-fixtures.json rust/crates/sittir-typescript/test-fixtures.json rust/crates/sittir-python/test-fixtures.json
git commit -m "feat(codegen): persist non-blocking grammar diagnostics to JSON during gen

Adds writeGrammarDiagnosticsJson, wired into run-codegen.ts right after
the existing stderr print. Each grammar's .sittir/grammar-diagnostics.json
now carries a structured record Task 14 will merge into the unified
validation report."
```

---

## Task 14: Cluster D — build and wire the unified `validation-report.json`

**Files:**
- Create: `packages/tools/src/validate/validation-report.ts`.
- Test: `packages/tools/src/validate/__tests__/validation-report.test.ts` (new file).
- Modify: `packages/tools/src/commands.ts` (wire the report builder into `runCountsCli`, ~lines 56-145).

**Interfaces:**
- Consumes: `packages/<grammar>/.sittir/grammar-diagnostics.json` (written by Task 13's `writeGrammarDiagnosticsJson`), each an array of `{code, severity, location, message, proposal}`.
- Produces: `buildValidationReportEntries(grammarDiagnosticsByGrammar: Record<string, readonly GrammarDiagnosticEntry[]>, validatorFailuresByGrammar: Record<string, ValidatorFailureInput[]>): ValidationReportEntry[]` and `writeValidationReport(entries: readonly ValidationReportEntry[], outPath: string): void`, where `ValidationReportEntry = { source: 'grammar' | 'validator'; severity: 'error' | 'warning'; code: string; grammar: string; backend: string; stage?: string; location?: string; message: string }`.

- [ ] **Step 1: Write the failing test for `buildValidationReportEntries`**

Create `packages/tools/src/validate/__tests__/validation-report.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { buildValidationReportEntries, writeValidationReport } from '../validation-report.ts';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('buildValidationReportEntries', () => {
	it('maps grammar diagnostics into report entries tagged source=grammar', () => {
		const entries = buildValidationReportEntries(
			{
				typescript: [
					{ code: 'non-literal-separator', severity: 'warning', location: 'interface_body.-', message: 'Separator is not a literal string.', proposal: 'See PR-T.' }
				]
			},
			{}
		);
		expect(entries).toEqual([
			{
				source: 'grammar',
				severity: 'warning',
				code: 'non-literal-separator',
				grammar: 'typescript',
				backend: 'native',
				location: 'interface_body.-',
				message: 'Separator is not a literal string.'
			}
		]);
	});

	it('maps validator failures into report entries tagged source=validator, unbounded (no SITTIR_VALIDATOR_MAX_FAILURES cap)', () => {
		const entries = buildValidationReportEntries(
			{},
			{
				rust: [
					{ stage: 'read-render-parse', label: 'Async Block (async_block)', message: 're-parse error: "async "' }
				]
			}
		);
		expect(entries).toEqual([
			{
				source: 'validator',
				severity: 'error',
				code: 'validation-failure',
				grammar: 'rust',
				backend: 'native',
				stage: 'read-render-parse',
				location: 'Async Block (async_block)',
				message: 're-parse error: "async "'
			}
		]);
	});
});

describe('writeValidationReport', () => {
	it('writes the entries array as JSON, overwriting any previous report', () => {
		const dir = mkdtempSync(join(tmpdir(), 'sittir-report-test-'));
		const outPath = join(dir, 'validation-report.json');
		writeValidationReport([{ source: 'grammar', severity: 'warning', code: 'x', grammar: 'rust', backend: 'native', message: 'y' }], outPath);
		expect(JSON.parse(readFileSync(outPath, 'utf8'))).toHaveLength(1);
		writeValidationReport([], outPath);
		expect(JSON.parse(readFileSync(outPath, 'utf8'))).toEqual([]);
		rmSync(dir, { recursive: true, force: true });
	});
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run packages/tools/src/validate/__tests__/validation-report.test.ts`
Expected: FAIL — the module doesn't exist yet.

- [ ] **Step 3: Implement `packages/tools/src/validate/validation-report.ts`**

```ts
import { writeFileSync } from 'node:fs';

export interface GrammarDiagnosticEntry {
	readonly code: string;
	readonly severity: 'error' | 'warning';
	readonly location?: string;
	readonly message: string;
	readonly proposal?: string;
}

export interface ValidatorFailureInput {
	readonly stage: string;
	readonly label: string;
	readonly message: string;
}

export interface ValidationReportEntry {
	readonly source: 'grammar' | 'validator';
	readonly severity: 'error' | 'warning';
	readonly code: string;
	readonly grammar: string;
	readonly backend: string;
	readonly stage?: string;
	readonly location?: string;
	readonly message: string;
}

export function buildValidationReportEntries(
	grammarDiagnosticsByGrammar: Readonly<Record<string, readonly GrammarDiagnosticEntry[]>>,
	validatorFailuresByGrammar: Readonly<Record<string, readonly ValidatorFailureInput[]>>,
	backend = 'native'
): ValidationReportEntry[] {
	const entries: ValidationReportEntry[] = [];
	for (const [grammar, diagnostics] of Object.entries(grammarDiagnosticsByGrammar)) {
		for (const d of diagnostics) {
			entries.push({
				source: 'grammar',
				severity: d.severity,
				code: d.code,
				grammar,
				backend,
				location: d.location,
				message: d.message
			});
		}
	}
	for (const [grammar, failures] of Object.entries(validatorFailuresByGrammar)) {
		for (const f of failures) {
			entries.push({
				source: 'validator',
				severity: 'error',
				code: 'validation-failure',
				grammar,
				backend,
				stage: f.stage,
				location: f.label,
				message: f.message
			});
		}
	}
	return entries;
}

export function writeValidationReport(entries: readonly ValidationReportEntry[], outPath: string): void {
	writeFileSync(outPath, JSON.stringify(entries, null, 2));
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run packages/tools/src/validate/__tests__/validation-report.test.ts`
Expected: PASS.

- [ ] **Step 5: Read `runCountsCli` in full to find where per-stage failures are already collected**

Read `packages/tools/src/commands.ts:56-164` (`runCountsCli` and `formatFirstFailures`). Identify the in-memory structure that already holds every stage's full failure list (before it gets truncated to `SITTIR_VALIDATOR_MAX_FAILURES` for the stdout printout) — this is what you'll pass into `buildValidationReportEntries`, UNBOUNDED (not the truncated version).

- [ ] **Step 6: Wire the report into `runCountsCli`**

After counts and failures are computed for all grammars/stages (but before or after the existing `console.log(formatGrammarCounts(...))` — after is fine, this is additive), add code that:
1. Reads each grammar's `packages/<grammar>/.sittir/grammar-diagnostics.json` (from Task 13) if it exists — parse as `GrammarDiagnosticEntry[]`, skip gracefully (empty array) if the file doesn't exist yet for a grammar.
2. Builds a `validatorFailuresByGrammar` map from the full (untruncated) in-memory failure lists identified in Step 5, tagging each with its stage name.
3. Calls `buildValidationReportEntries(...)` then `writeValidationReport(entries, join(process.cwd(), 'packages', 'tools', 'validation-report.json'))`.

Do not change any existing stdout/stderr output in this step — this is purely additive.

- [ ] **Step 7: Run `validate:native` and confirm the report is written**

Run: `SITTIR_NATIVE_DEBUG=0 pnpm run validate:native`
Then: `cat packages/tools/validation-report.json | head -50`
Expected: a JSON array combining both `source: 'grammar'` entries (from the three `grammar-diagnostics.json` files) and `source: 'validator'` entries (every validator failure, not capped at 1000 — cross-check the total count against the sum of `factory-render-parseTotal - factory-render-parseAstMatchPass` etc. across all three grammars/stages to confirm nothing was silently dropped).

- [ ] **Step 8: Run the full test suite**

Run: `pnpm test`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add packages/tools/src/validate/validation-report.ts packages/tools/src/validate/__tests__/validation-report.test.ts packages/tools/src/commands.ts
git commit -m "feat(tools): unify grammar diagnostics + validator failures into validation-report.json

Combines the previously-disconnected stderr-only grammar diagnostics
(Task 13) and stdout-only, capped validator failures into one
persisted, structured, unbounded report — closes TODO.md item 8."
```

---

## Task 15: Cluster D — wire the identified silent catches into the report

**MAJOR CORRECTION (found on first dispatch + a follow-up research pass — read before starting):**
The original Steps 1-5 below are WRONG and superseded. `packages/{rust,typescript,python}/src/backend.ts` is NOT codegen-emitted (confirmed: no emitter in `packages/codegen/src` produces it; it's hand-maintained, kept in sync across all three grammar packages by hand — see commit `a970e023c`'s identical one-line fix applied to all three). Worse, `getActiveBackend()`/`tryLoadNative()` in `backend.ts` turned out to be **irrelevant to the validator's actual native-load path entirely** — `collectGrammarCounts` never calls it. A dedicated research pass traced the REAL call chain and found two genuine silent-loss bugs, both in `packages/tools/src/**` (normal source, not generated, not hand-maintained-but-manifest-tracked):

**Finding A — real native-load error reason discarded.** `packages/tools/src/validate/common.ts:340` and `:343`, inside `loadNativeEngineForGrammar` (~lines 302-363): both `catch { }` blocks are unparameterized — the real `Error` from `require()` (missing `.node`, N-API ABI mismatch, dlopen failure, etc.) is discarded completely, and the function returns `null`. Downstream, `buildReadHandle` (`common.ts:373-378`) synthesizes a generic, reason-free error: `` `SITTIR_BACKEND=native but no native engine is available for grammar '${grammar}'` ``.

**Finding B — whole-grammar validator failure vanishes from the persisted report.** `validateFactoryRenderParse` (`packages/tools/src/validate/factory-render-parse.ts:~803-807`) calls `buildReadHandle` in its per-entry loop with **no enclosing try/catch** — unlike `validateFrom` (`from.ts:272-308`) and `validateReadRenderParse` (`read-render-parse.ts:472,745-751`), which both wrap the same call per-entry and push failures into an `errors` array that DOES reach `validation-report.json`. A native-load failure during `validateFactoryRenderParse` throws straight out, rejects `collectGrammarCounts`'s `Promise.all`, and is caught only in `runCountsCli`'s per-(backend,grammar) loop (`commands.ts:433-441`), which just does `console.log(...ERROR...)` and **skips** `appendHistory`, `recorded.push`, and populating `validatorFailuresByGrammar[grammar]` entirely. Net effect: a grammar whose validation genuinely failed to complete is indistinguishable in `validation-report.json` from a grammar that ran clean (only its static `grammar-diagnostics.json` entries still show up) — and if it's the only grammar/backend requested, the report file isn't written at all.

**Files (corrected):**
- Modify: `packages/tools/src/validate/common.ts` (`loadNativeEngineForGrammar` ~302-363, `buildReadHandle` ~365-381 — capture and thread the real error reason instead of discarding it).
- Modify: `packages/tools/src/validate/factory-render-parse.ts` (~803-807 — wrap `buildReadHandle` in a per-entry try/catch matching `from.ts`/`read-render-parse.ts`'s existing pattern).
- Modify: `packages/tools/src/commands.ts` (`runCountsCli`'s catch block ~433-441 — don't silently drop the grammar from `validatorFailuresByGrammar`/`recorded`/history on a whole-collection failure; record a synthetic failure entry instead).
- Delete the now-superseded Steps 4/5's premise: `packages/tools/src/probe/stages.ts` and `packages/tools/src/probe/kind.ts` are OUT OF SCOPE — confirmed via direct trace that `validate counts`/`runCountsCli` never invokes probe at all (probe is a fully separate CLI command with no integration point into the counts/validate flow). Do not touch these two files.

- [ ] **Step 1: Re-verify Findings A and B fresh** — read `common.ts`'s `loadNativeEngineForGrammar`/`buildReadHandle`, `factory-render-parse.ts`'s per-entry loop, and `commands.ts`'s `runCountsCli` catch block yourself before changing anything; line numbers above were captured by a research pass, re-confirm they still match.

- [ ] **Step 2: Fix Finding A — thread the real native-load failure reason through**

In `common.ts`, change `loadNativeEngineForGrammar` to capture `err` in both catch blocks (`req(pkg)` failure and `req(localCratePath)` failure) and return a richer result instead of a bare `null` — e.g. `{ engine: NativeEngineLike } | { engine: null; reason: string }` (design the exact shape yourself, matching how the rest of this file already threads similar unions; keep the happy-path return type change minimal). Update `buildReadHandle` to use the captured `reason` in its synthesized error message instead of the current generic text — e.g. `` `SITTIR_BACKEND=native but no native engine is available for grammar '${grammar}': ${reason}` `` — so every downstream validator's generic-error-catch (Findings from `from.ts`/`read-render-parse.ts`) now surfaces the REAL cause instead of a content-free message.

- [ ] **Step 3: Fix Finding B — guard `factory-render-parse.ts`'s unguarded `buildReadHandle` call**

Wrap the per-entry `buildReadHandle` call in `validateFactoryRenderParse` in a try/catch matching the existing pattern in `validateFrom`/`validateReadRenderParse` (read those two first for the exact idiom — error message formatting, what gets pushed to the errors array, whether it continues to the next entry or aborts). This stops a single native-load failure from rejecting the whole grammar's validation run.

- [ ] **Step 4: Harden `commands.ts`'s `runCountsCli` catch block (defense in depth, in case any future validator addition hits the same gap)**

In the catch block at `commands.ts:433-441`, when `collectGrammarCounts` rejects, still populate `validatorFailuresByGrammar[grammar]` with a single synthetic entry describing the whole-grammar collection failure (e.g. `{ stage: 'collect', label: grammar, message: (e as Error).message }`), instead of silently skipping it. Decide whether `recorded.push`/`appendHistory` should still happen for a failed grammar (probably not for `appendHistory`, since it's meant to record successful validation runs — check `ValidationRun`'s shape and existing semantics in `packages/tools/src/history.ts` before deciding) — but the report-entry population should happen regardless of that decision, since the goal is making the FAILURE visible in `validation-report.json`, not making history-tracking swallow it as a success.

- [ ] **Step 5: Confirm the fix end-to-end**

Run `pnpm test`, then `SITTIR_NATIVE_DEBUG=0 pnpm run validate:native` and inspect `packages/tools/validation-report.json` — confirm it still has the same entry counts as before for the currently-passing grammars (this task shouldn't change what's already visible), and, if you can construct a reproducible native-load failure in a test/mock (check `factory-render-parse.ts`'s or `common.ts`'s existing test files for a pattern to simulate this), confirm the new reason string and the new synthetic collection-failure entry actually appear when triggered.

- [ ] **Step 6: Run the full test suite**

Run: `pnpm test`
Expected: PASS modulo the known pre-existing unrelated baseline.

- [ ] **Step 7: Re-verify the native validation baseline**

Run: `SITTIR_NATIVE_DEBUG=0 pnpm run validate:native > /tmp/task15-validate.log 2>&1; tail -100 /tmp/task15-validate.log`
Expected: exactly rust=117/typescript=75/python=102 — this task only improves error-message content and report completeness on FAILURE paths; it must not change the AstMatchPass counts on the (currently passing) success path at all.

- [ ] **Step 8: Commit**

This task doesn't touch `packages/codegen/src/**` or generated grammar output — no regen/manifest steps, no two-commit split needed.

```bash
git add packages/tools/src/validate/common.ts packages/tools/src/validate/factory-render-parse.ts packages/tools/src/commands.ts
git commit -m "fix(tools): surface native-load failure reasons + stop dropping whole-grammar validator failures from validation-report.json

Two silent-loss bugs found by tracing collectGrammarCounts's real
native-load path (packages/{rust,typescript,python}/src/backend.ts's
getActiveBackend()/tryLoadNative() turned out to be unused by the
validator entirely): (1) loadNativeEngineForGrammar's require()
catches discarded the real failure reason before buildReadHandle
synthesized a content-free generic error; (2)
validateFactoryRenderParse's unguarded buildReadHandle call let a
native-load failure reject the whole grammar's validation, which
runCountsCli's catch block then silently dropped from
validatorFailuresByGrammar/history instead of recording it. Closes
TODO.md item 7's silent-failure findings for the validator's actual
native-load path."
```
If the pre-commit hook rejects for any reason, do NOT use `--no-verify` — stop and report the exact failure.

---

## Task 16: Cluster B — delete the deprecated JS tree-walk reader and the JS engine package

**Files:**
- Delete: `packages/common/src/readNode.ts`.
- Modify: `packages/common/src/index.ts` (remove the `readNode` re-export).
- Modify: `packages/common/src/engine.ts` (remove `createJsEngine`-adjacent contracts, if any live only here — re-verify).
- Modify: `packages/core/src/engine.ts` (remove `createJsEngine`, ~lines 43-90).
- Modify: `packages/core/src/engine-boundary.ts` (remove the `createJsEngine` re-export, ~line 3).
- Modify: `packages/core/src/index.ts` (remove the `createJsEngine` re-export, ~line 4).
- Delete or gut: whatever else in `packages/core/src/` turns out to have no purpose once `createJsEngine` is gone (verify first — do not assume the whole package is dead).

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: nothing later tasks depend on. Task 17 depends on this task having removed `createJsEngine`/`readNode` first (so the emitter fix in Task 17 has nothing left to import).

- [ ] **Step 1: Confirm `packages/core`'s full current export surface**

Read `packages/core/src/index.ts` in full and list every symbol it exports. For each one NOT already covered by this task (i.e., not `createJsEngine`), check whether it's still needed — do not delete the whole package on assumption.

- [ ] **Step 2: Re-verify `readNode`'s current caller set fresh**

Run `find_all_references` (cross-checked with text search) for `readNode` (`packages/common/src/readNode.ts`). Confirm callers are exactly: every generated `wrap.ts`'s `readNodeJs` import (rust/typescript/python `src/wrap.ts`), the validator js-backend path (`packages/tools/src/validate/common.ts`, `read-render-parse.ts`, `packages/tools/src/profile/bench.ts`), and the JS engine itself (`packages/core/src/engine.ts`). Do NOT delete `readNode.ts` yet in this task if Task 17 (which fixes the emitter that generates the `readNodeJs` import) hasn't run — the generated `wrap.ts` files still import it until then.

- [ ] **Step 3: Since generated code still imports `readNode`, sequence this task's deletion AFTER Task 17's emitter fix**

Given the dependency direction, treat this task as two sub-phases: (a) delete `createJsEngine` and `packages/core`'s JS-engine surface now (nothing generated imports `createJsEngine` directly — only the generated `engine.ts`'s `createEngine()` fallback does, which Task 17 also fixes), and (b) delete `packages/common/src/readNode.ts` itself only after Task 17 has removed the generated `wrap.ts`'s `readNodeJs` import. Do sub-phase (a) now; leave a note in this task's commit that sub-phase (b) happens in Task 17's commit instead.

- [ ] **Step 4: Confirm test coverage passes (baseline)**

Run: `pnpm test`
Expected: PASS.

- [ ] **Step 5: Delete `createJsEngine` and its re-exports**

Remove `createJsEngine` from `packages/core/src/engine.ts:43-90`. Remove its re-export from `packages/core/src/engine-boundary.ts:3` and `packages/core/src/index.ts:4`.

- [ ] **Step 6: Check whether anything else in `packages/core` is now dead**

Re-run `find_all_references` on every other export from `packages/core/src/index.ts` (per Step 1's list). Delete anything now provably unreferenced as a direct consequence of this deletion — but do not go beyond what THIS deletion made dead; unrelated pre-existing dead code in `packages/core` is out of scope for this task.

- [ ] **Step 7: Run the full test suite**

Run: `pnpm test`
Expected: PASS, minus any tests that only exercised `createJsEngine` directly (expected reduction).

- [ ] **Step 8: Commit**

```bash
git add -u packages/core
git commit -m "chore: delete createJsEngine and its packages/core re-exports

Part 1 of JS-engine removal (Cluster B). packages/common/src/readNode.ts
itself stays until Task 17 removes the generated wrap.ts's readNodeJs
import — deleting it now would break the current generated output."
```

---

## Task 17: Cluster B — fix the codegen emitters, remove the JS-engine fallback from generated output, delete `readNode.ts`

**Files:**
- Modify: `packages/codegen/src/emitters/wrap.ts` (~lines 888,1281,1289 — stop emitting the `readNodeJs` import and fallback call).
- Modify: `packages/codegen/src/emitters/engine.ts` (stop emitting `createEngine()`'s `?? createJsEngine(...)` fallback branch — generated `createEngine()` becomes native-only).
- Delete: `packages/common/src/readNode.ts` (now safe — nothing imports it after this task's emitter fix + regen).
- Modify: `packages/common/src/index.ts` (remove the `readNode` re-export, if not already done in Task 16).

**Interfaces:**
- Consumes: Task 16's deletion of `createJsEngine` (this task's emitter fix stops generated code from referencing the now-deleted function).
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Read the current `wrap.ts` emitter's `readNodeJs` emission sites**

Read `packages/codegen/src/emitters/wrap.ts` around lines 888, 1281, 1289 (re-verify — regen from earlier tasks may have shifted line numbers in unrelated files, but this file itself shouldn't have moved unless an earlier task touched it directly). Confirm exactly what gets emitted: the `readNodeJs` import, and the `tree.read ? tree.read(...) : readNodeJs(...)` fallback expression.

- [ ] **Step 2: Modify the emitter to stop emitting the JS fallback**

Change the emitted expression from `tree.read ? tree.read(...) : readNodeJs(...)` to just `tree.read(...)` (native-only — `tree.read` is always present once the JS engine is gone), and remove the `readNodeJs` import emission entirely.

- [ ] **Step 3: Read and fix the `engine.ts` emitter's `createEngine()` fallback**

Read `packages/codegen/src/emitters/engine.ts`'s template for generated `createEngine()` (`createNativeEngine(...) ?? createJsEngine(...)`). Change it to emit `createNativeEngine(...)` only — throw a clear error if native creation fails, rather than silently falling back to a JS engine that no longer exists.

- [ ] **Step 4: Regenerate all three grammars and inspect the diff**

```bash
pnpm exec tsx packages/cli/src/cli.ts gen --grammar rust --all --output packages/rust/src
pnpm exec tsx packages/cli/src/cli.ts gen --grammar typescript --all --output packages/typescript/src
pnpm exec tsx packages/cli/src/cli.ts gen --grammar python --all --output packages/python/src
git diff --stat -- packages/rust/src/wrap.ts packages/typescript/src/wrap.ts packages/python/src/wrap.ts packages/rust/src/engine.ts packages/typescript/src/engine.ts packages/python/src/engine.ts
```
Expected: each grammar's generated `wrap.ts` loses the `readNodeJs` import and fallback branch; each grammar's generated `engine.ts` loses the `createJsEngine` fallback. Review this diff carefully — it's the expected generated-output change for Cluster B, not a failure.

- [ ] **Step 5: Delete `packages/common/src/readNode.ts` now that nothing imports it**

Re-verify via `find_all_references` that the regenerated `wrap.ts`/`engine.ts` (Step 4) no longer reference `readNode`/`readNodeJs`. Delete `packages/common/src/readNode.ts` and remove its re-export from `packages/common/src/index.ts` (if Task 16 didn't already do this).

- [ ] **Step 6: Run the full test suite**

Run: `pnpm test`
Expected: PASS, minus any tests specifically exercising the JS-fallback path (expected reduction — those paths no longer exist).

- [ ] **Step 7: Re-verify the native validation baseline**

Run: `SITTIR_NATIVE_DEBUG=0 pnpm run validate:native > /tmp/task17-validate.log 2>&1; tail -100 /tmp/task17-validate.log`
Expected: exactly rust=117/typescript=75/python=102 — the native backend path is unaffected by removing the JS fallback (native was already succeeding; this only removes the fallback nothing was relying on for these three grammars' native validation).

- [ ] **Step 8: Commit**

```bash
git add packages/codegen/src/emitters/wrap.ts packages/codegen/src/emitters/engine.ts packages/common/src/index.ts
git rm packages/common/src/readNode.ts
git add packages/rust/src/wrap.ts packages/typescript/src/wrap.ts packages/python/src/wrap.ts packages/rust/src/engine.ts packages/typescript/src/engine.ts packages/python/src/engine.ts
git add packages/rust/.sittir/generated.manifest.json packages/typescript/.sittir/generated.manifest.json packages/python/.sittir/generated.manifest.json rust/crates/sittir-rust/test-fixtures.json rust/crates/sittir-typescript/test-fixtures.json rust/crates/sittir-python/test-fixtures.json
git commit -m "feat(codegen): stop emitting the JS-engine read fallback, delete readNode.ts

wrap.ts's generated readNodeJs fallback and engine.ts's generated
createJsEngine fallback are both gone — createEngine() is native-only
now. Deletes packages/common/src/readNode.ts (the deprecated JS
tree-walk reader) now that nothing generated imports it."
```

---

## Task 18: Cluster B — finish deleting `readNode.ts` (narrowed scope)

**MAJOR CORRECTION (found on dispatch — this task's original scope was wrong, not just its file list):** the original premise — that `backend === 'js'` handling across `options.ts`/`check-baseline.ts`/`from.ts`/`probe/kind.ts`/`bench.ts` is all dead debt from the deprecated JS engine — does NOT hold. Direct investigation found:
- `packages/tools/src/validate/common.ts`'s `buildReadHandle()` non-native branch returns a real, functional WASM/JS read path used by the whole validate CLI — not dead.
- `packages/tools/src/profile/bench.ts`'s `benchGrammar()` does a genuine, live JS-vs-native **speedup comparison** — `BenchResult.backend: 'js' | 'native'` is structural to its whole report format, not an isolated dead branch.
- `packages/tools/src/probe/kind.ts`'s `--engine js|native|both` flag drives a genuine, live **dual-engine diff/trace diagnostic** (compares JS-side reads against native reads to debug drift) — a real feature, not debt.
- The CLI's `backend`/`resolveBackends`/`CliBackend` typing is pervasive across more files than originally listed (`counts.ts`, `probe-factory.ts`, `trace-rt.ts`, `commands.ts`'s isolate-worker spawning) — narrowing it to native-only as originally scoped would leave the codebase type-inconsistent, since these live features still need it.

TODO.md item 5 ("remove the JS engine") was about `createJsEngine`/`readNode.ts` as a **production fallback** — already removed by Tasks 16-17. `bench.ts`'s comparison tooling and `probe/kind.ts`'s dual-engine diagnostic are a **different, legitimately still-valuable use case** (JS-vs-native comparison for perf/drift debugging) that happens to also construct a JS renderer — explicitly OUT of scope for this task. User decision: narrow Task 18 to ONLY the two confirmed-safe fixes below plus finishing `readNode.ts`'s deletion if nothing else still needs it after those fixes. The CLI `--backend` flag, `options.ts`, `check-baseline.ts`, `from.ts`'s `backend === 'js'` branch, `probe/kind.ts`'s `--engine` feature, and `bench.ts`'s comparison feature all stay exactly as they are — not touched by this task.

**Files:**
- Modify: `packages/tools/src/validate/common.ts` (`resolveChild()` ~line 1507-1509 — collapse `tree.read ? tree.read(...) : readNodeFn(tree, ...)` to `tree.read(...)`; `readNodeAt()` ~line 403-419 — collapse its native-coords-branch `readNodeFn(handle, ...)` call to `handle.read(...)`, since `packages/common/src/readNode.ts` itself already does exactly this redirect when `tree.read` is present — the call through `readNodeFn` is a provably redundant indirection, not real JS-engine invocation).
- Delete: `packages/common/src/readNode.ts` — ONLY if Step 3 below confirms nothing else in the repo still imports it after the `common.ts` fix (this includes checking whether `bench.ts`/`probe/kind.ts`'s JS-comparison paths call `readNode()` directly vs. constructing reads some other way — if they DO still need it, `readNode.ts` stays and this task is scoped down to just the `common.ts` fix).
- Modify: `packages/common/src/index.ts` (remove the `readNode` re-export — only if `readNode.ts` itself gets deleted).
- Modify: `packages/tools/src/validate/common.ts` (~lines 403-419 `readNodeAt()`, ~1507-1509 `resolveChild()` — make both native-only, removing the unconditional `readNode`/`readNodeFn` import and calls).
- Delete: `packages/common/src/readNode.ts` (finally safe once `common.ts`'s uses are gone).
- Modify: `packages/common/src/index.ts` (remove the `readNode` re-export, if Task 16/17 didn't already).

**Interfaces:**
- Consumes: Tasks 16-17's removal of the JS engine (this task finishes the last two lingering `readNode` call sites and, if safe, the file itself).
- Produces: nothing later tasks depend on — this is the last task in Cluster B and the plan. `options.ts`, `check-baseline.ts`, `from.ts`, `probe/kind.ts`, `bench.ts` are explicitly NOT touched by this task — their `backend`/`--engine` handling is live diagnostic tooling, not debt.

- [ ] **Step 1: Read `common.ts`'s `resolveChild()` and `readNodeAt()` in full, and re-confirm the redundant-indirection reasoning**

Read `packages/tools/src/validate/common.ts`'s `resolveChild()` (~line 1507-1509) and `readNodeAt()` (~line 403-419) plus `packages/common/src/readNode.ts`'s own implementation in full. Confirm directly: does `readNode()`/`readNodeFn` do anything beyond `if (tree.read) return tree.read(handle, childIndex)` (i.e. is it PURELY a redirect to `tree.read`/`handle.read` when that's present, with a distinct JS-engine-specific code path only in the `else` branch that's now unreachable)? If so, both call sites collapse safely. If you find `readNode()` does something MORE than that in the branch these two call sites actually hit, STOP and report — do not force the collapse.

- [ ] **Step 2: Apply the collapse**

In `resolveChild()`, change `tree.read ? tree.read(...) : readNodeFn(tree, ...)` to `tree.read(...)`. In `readNodeAt()`, change its native-coords-branch `readNodeFn(handle, ...)` call to `handle.read(...)` directly (per Step 1's confirmed reasoning).

- [ ] **Step 3: Check whether `readNode.ts` is now fully deletable**

Run `find_all_references` (cross-checked with a direct text/import search) for `readNode`/`readNodeJs`/`readNodeFn`/the module path `packages/common/src/readNode.ts` across the ENTIRE repo — including `packages/tools/src/profile/bench.ts` and `packages/tools/src/probe/kind.ts` (their JS-vs-native comparison/diagnostic features are staying, per this task's narrowed scope, but you need to know whether THEY still import `readNode()` specifically, as opposed to constructing reads some other way — e.g. via `createRenderer`'s own mechanism). 
  - If NO other caller remains: delete `packages/common/src/readNode.ts` and remove its re-export from `packages/common/src/index.ts`.
  - If `bench.ts`/`probe/kind.ts`/anything else genuinely still needs it: leave `readNode.ts` in place — it's now serving only the live JS-comparison features, which is a legitimate, intentional use, not debt. Document this finding clearly either way.

- [ ] **Step 4: Run the full test suite**

Run: `pnpm test`
Expected: PASS, with no new failures (this is either a pure redundant-indirection removal, or that plus a dead-file deletion — no live behavior should change either way).

- [ ] **Step 5: Regenerate all three grammars and re-verify the baseline**

```bash
pnpm exec tsx packages/cli/src/cli.ts gen --grammar rust --all --output packages/rust/src
pnpm exec tsx packages/cli/src/cli.ts gen --grammar typescript --all --output packages/typescript/src
pnpm exec tsx packages/cli/src/cli.ts gen --grammar python --all --output packages/python/src
SITTIR_NATIVE_DEBUG=0 pnpm run validate:native > /tmp/task18-validate.log 2>&1; tail -100 /tmp/task18-validate.log
```
Expected: exactly rust=117/typescript=75/python=102.

- [ ] **Step 6: Commit**

```bash
git add packages/tools/src/validate/common.ts
# If Step 3 concluded readNode.ts is deletable:
git rm packages/common/src/readNode.ts
git add packages/common/src/index.ts
git add packages/rust/.sittir/generated.manifest.json packages/typescript/.sittir/generated.manifest.json packages/python/.sittir/generated.manifest.json packages/rust/.sittir/grammar.js packages/typescript/.sittir/grammar.js packages/python/.sittir/grammar.js
git commit -m "chore: collapse the last two redundant readNode indirections in validate/common.ts[, delete readNode.ts]

Task 18 (final task of Cluster B) narrowed after discovering
bench.ts's JS-vs-native comparison and probe/kind.ts's --engine
dual-trace diagnostic are live tooling, not debt — TODO.md item 5's
JS-engine-removal target (createJsEngine, the generated-code
read-fallback path) was already fully removed by Tasks 16-17.
resolveChild()/readNodeAt() collapse to tree.read(...)/handle.read(...)
since readNode()'s own implementation shows this is a pure,
provably-redundant redirect. [readNode.ts itself is now safe to
delete — nothing else in the repo imports it. / readNode.ts stays,
since bench.ts/probe-kind.ts's live comparison features still use it.]"
```
(Adjust the bracketed portion and pathspecs to match Step 3's actual finding.)
Then separately if manifest/grammar.js files changed: `git add rust/crates/sittir-rust/test-fixtures.json rust/crates/sittir-typescript/test-fixtures.json rust/crates/sittir-python/test-fixtures.json` with message `chore(validator): record validation run (rust/native, typescript/native, python/native)`.

---

## Self-Review

**1. Spec coverage:**
- Item 1 (IGNORE comments) — already moot, no task, matches spec's "Out of Scope."
- Item 2 (unused imports/format) — Task 2.
- Item 3 (deprecated-behavior test) — folded into Task 5 (the `toNativeRenderTransport` test removal).
- Item 4 (deprecated functions) — Tasks 3, 4, 12 (`recurseChildren`), Task 17 (`readNode`).
- Item 5 (JS engine) — Tasks 16-18.
- Item 6 (silently deprecated features) — Tasks 3, 4, 8 (doc corrections), 10 (`@forFutureUse`), plus the disputed-pair resolution in Task 7.
- Item 7 (silent failures/warnings) — Task 15, plus the diagnostic catalog documented in the spec (no code change needed for the deliberate warn-but-continue diagnostics — Task 13/14 persist them).
- Item 8 (diagnostic report) — Tasks 13-14.
- Item 9 (jinja exclusion) — Task 9.
- Item 10 (VARIANT) — explicitly out of scope, Track 2.
- Item 11 (wrap.ts errors) — explicitly out of scope, Track 3.
- Item 12 (single-phase consolidation) — Task 11.
- `@forFutureUse` convention (user's mid-brainstorm addition) — Task 10.
- All 5 clusters (A-E) have at least one task; Cluster A alone spans Tasks 2-10 given its size.

**2. Placeholder scan:** No "TBD"/"add appropriate handling"/"similar to Task N" phrasing appears in any step above — every step names exact files, exact (re-verify-at-execution-time) line numbers, and either exact code or an exact command with expected output. The few places that say "re-verify" or "confirm X first" are explicit verification steps (a Global Constraint), not vague placeholders — each still names precisely what to check and against what.

**3. Type consistency:** `ValidationReportEntry`, `GrammarDiagnosticEntry`, and `ValidatorFailureInput` (Task 14) are defined once and reused with the same field names/types in Task 15's extension. `writeGrammarDiagnosticsJson` (Task 13) and `buildValidationReportEntries`/`writeValidationReport` (Task 14) have consistent signatures across both tasks. Task 17 explicitly depends on Task 16's `createJsEngine` deletion and is sequenced immediately after it, with Task 16 explicitly documenting the split (delete `createJsEngine` now, defer `readNode.ts` deletion to Task 17) so there's no dangling reference gap between the two commits.

No gaps found requiring a new task.

---

Plan complete and saved to `docs/superpowers/plans/2026-07-09-todo-debt-cleanup-plan.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
