# PR-B review — `AssembledNonterminal` class + computed-getter naming (copilot, `305bcf91`)

> Design-review of copilot's PR-B implementation (branch `pr-b-assembled-nonterminal-class`, commit
> `305bcf91`), verified against spec §5 PR-B row + §2 + the corrected storageKind/parseKind model + the
> Fix-4 / divergent-test from `2026-05-26-pr-a-review-fixes.md`.
> **Verify-don't-trust note:** copilot's self-report was incomplete in BOTH directions — it did Fix 4 + the
> divergent test *without mentioning them*, and it *skipped* FOLD-1 *without flagging it*. The findings below
> are from independent verification, not the self-report.

## ✅ Verified done + correct

- **Interface → class.** `AssembledNonterminal` is now a `class` with 6 computed getters
  (`storageName`/`name`/`configKey`/`propertyName`/`paramName`/`parseNames`) delegating to
  `projectSlotNaming(this)`; added `.with()` + `AssembledNonterminalInit`; removed the `_new` diagnostic
  fields. `collect-slots.ts` (`new AssembledNonterminal(init)` + `.with()` at merge sites),
  `render-module.ts`, `wrap.ts` updated.
- **Fix 4 (storageName cross-wiring) — FIXED.** `projectSlotNaming` (`node-map.ts:1637-1648`) derives
  `parseNames` from `value.parseKind.name` AND `storageName` from **`distinctStorageKinds` (= `kindsOf`, the
  render/source kind)**, NOT from `parseNames`. So `storageKind → storageName`, `parseKind → parseNames` —
  the cross-wiring that rode #40 in is corrected.
- **Divergent test — ADDED** (`reconcile-naming.test.ts`): *"storageName from storageKind, NOT parseKind:
  multi storage-kind / single parse-kind → content (aliased ln shape)"* — values
  `[aliasedRef('_ln','block'), aliasedRef('block','block'), aliasedRef('_newline','block')]` (the `_suite`
  shape: 3 distinct storage-kinds, all `parseKind=block`) → asserts `storageName='content'`. **This is the
  exact case the PR-A probe was structurally blind to** (`sittir-review`'s false-green); it now closes it.
- **Gates green:** `reconcile-naming` 0/0 (rust/py/ts); `validate:native` covPass held — rust 182/187,
  python 107/110, ts 179/185. (TS held, so the "don't gate on the typescript backend" instruction was moot.)

## ❌ Gap — FOLD-1 (`sourceRuleIds`) SKIPPED (the one rework item)

The spec PR-B row requires `sourceRuleId?: RuleId` → **`sourceRuleIds: readonly RuleId[]`** (every
renderRule + simplifiedRule position the slot occupies) + `slotByRuleId` (§7.6) mapping **each** id → the
slot. Copilot left `sourceRuleId` **singular** (`node-map.ts:1515/1544/1563/1577`); `slotByRuleId` is
unchanged. This is the simplify-vs-render lookup fix that **PR-E consumes** (render resolves the slot via the
renderRule-position id, so #9 holds by construction; without it the `lookupSlot` miss → re-derivation
persists).

**Action:** add FOLD-1 to PR-B (it's small and squarely PR-B's scope) — re-dispatch copilot / the implementer
for just this, OR consciously defer it to PR-E with an explicit note in the PR-E row. **Recommend adding it to
PR-B** (don't let PR-E silently inherit the un-done dependency).

## Unverified (lower priority)
- **DRY (brief item 7):** the consolidation of the two shared-arm-attribute derivations (`liftSharedArmAttrs`
  in `simplify.ts` vs `sharedArmFieldName`+`strongestArmMultiplicity` in `collect-slots.ts`) was optional in
  the brief ("leave a TODO if it bloats the PR"). Not confirmed done — a fuller `sittir-review` pass should
  check whether it was consolidated or deferred.

## Minor
- copilot used `git add -A` (the brief said stage-by-name). It committed the codegen `src` changes + the
  legitimately-regenerated artifacts (3-grammar `src`, `node-model.json5`, `.sittir/manifests`, rust
  `transport.rs`/`bridge.rs`) — but **not** the forbidden `test-fixtures.json` / `validation-history.jsonl`
  (those are auto-committed by a separate mechanism). Result is fine; flag the process deviation only.

## Mergeable follow-up items
- **Rust `match_block` final-arm wrap routing (out of scope for PR-B).** The generated JS wrap path currently
  normalizes `_last_match_arm` from `(data._match_arm ?? data._last_match_arm)`, so a repeated `match_arm`
  slot can mask the dedicated `last_match_arm` slot and select the wrong arm (or throw under singular-slot
  normalization). Fix belongs in `packages/codegen/src/emitters/wrap.ts` or upstream slot modeling, not in
  generated `packages/rust/src/wrap.ts`. Carry this into the post-PR-B follow-up queue with a focused
  regression test for `match x { 0 => a, _ => b }`.

## Next
1. **Close FOLD-1** (`sourceRuleIds` + `slotByRuleId` maps each) — the one real PR-B gap.
2. Optional: a fuller `sittir-review` design-conformance pass (the DRY consolidation + the principles) once
   `sittir-review` is dispatchable (after a Claude Code reload) or via a general agent.
3. Then PR-C.

## Provenance
Independent verification (read-only) of `305bcf91` on `pr-b-assembled-nonterminal-class`, 2026-05-26 — the
implement→review loop on copilot's PR-B output.
