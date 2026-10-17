# Render/Slot Fold Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `renderRule` arrive fully inlined for every non-recursive hidden ref, derived from the *same* fold as the slot side — so `templates.ts` consumes only `renderRule`, never raw rules, and the `source`/`_import_list` carve-outs die.

**Architecture:** There are two hidden-ref inliners today. The slot-side `inlineRefs` (`simplify.ts`, feeds `simplifiedRules`) now folds *all* hidden refs (provenance-free, `isHiddenKind`-keyed — landed this session, floor held). The render-side `inlineHiddenSeqRefs` (`normalize.ts`, feeds `renderRules` → `node.renderRule`) still has carve-outs (group/multi-only, array, `fieldName`, `keepRef`, hardcoded `_import_list`), so hidden refs leak into `renderRule` and the `templates.ts` emit-time blocks (`:1458` renderRule path + `:1509` raw path, gated on `source==='group-lift'`) mop up the leak — the `:1509` path spelunking RAW rules even when a `renderRule` exists. This plan moves the emit-time render logic into the normalize fold so both sides derive from one source.

**Recursion handling (settled — NO new rule needed):** recursive refs are already excluded from folding by **`keepRef` (`refcount > 1`)**, which does double duty — dedup AND recursion-prevention. A self-recursive ref (`_let_chain` refs itself twice) bumps its own refcount → kept. An **alias-target / twin** (`_condition` references `_let_chain` via `alias(_let_chain,'let_chain')`, surfacing a visible `let_chain` CST node) is kept. A multi-parent ref is kept. Kept kinds materialize and the existing box-at-back-edge SCC pass (`scc.ts`/`render-module.ts`) boxes their self-slots (`let_chain: Option<Box<LetChainTransport>>`). So we do **NOT** add a `visited` recursion guard to the fold and do **NOT** narrow `keepRef` — `refcount > 1` is the guard. `_let_chain` is *not* a fold candidate; it's a real (alias-visible) recursive kind, correctly handled today. NO left-recursion elimination, NO recursive-ref rule. (Caveat: `keepRef` catches self-recursion + multi-ref but not single-use *mutual* recursion through group/multi helpers — exotic; if broadening the shape gate ever hangs the gate on such a cycle, add a minimal `visited` guard reactively, not pre-emptively.)

**The one genuine render/slot difference (load-bearing):** multiplicity application. `optional` must apply at the **seq node** (leaf-level distributes `optional` onto bare literals → the render walker drops optional-stamped literals → "64 templates lost syntax tokens"). `array`/`nonEmptyArray` must apply at the **leaves** (`| join(sep)` survives only leaf-level → else the `extends_clause` join-drop regression). The render fold needs both modes; this is the core porting nugget, not a guard deletion.

**Tech Stack:** TypeScript ESM (`.ts` imports), tree-sitter codegen. **The gate is the test:** `SITTIR_NATIVE_DEBUG=0 pnpm validate:native` — metric `readRenderParseAstMatchPass` (deep AST). **Floor: rust 120 / ts 71 / py 74.** `SITTIR_NATIVE_DEBUG` MUST be `0` (debug `.node` segfaults). Use `model: sonnet` for implementation subagents.

---

## File Structure

- `packages/codegen/src/compiler/normalize.ts` — `inlineHiddenSeqRefs`, `spliceFoldableRefs`, `materializeInlinedBody`, `computeKeepRef`. Primary surface: broaden the fold, add recursion guard, split multiplicity application, narrow `keepRef`, drop `_import_list` hardcode.
- `packages/codegen/src/compiler/simplify.ts` — `resolveGroupOrMultiInlineTarget` (`:985`). Shared shape resolver; may need a broader sibling for "any hidden body".
- `packages/codegen/src/emitters/templates.ts` — `:1438`-`:1538` emit-time inline blocks. Final task: shrink to recursion-only, drop `source` reads + raw-rule path.

**DRY note:** the slot fold (`inlineRefs`) and render fold (`spliceFoldableRefs`) should share shape-acceptance + recursion + keepRef logic and differ ONLY in the multiplicity-application step. Where practical, extract the shared decision rather than duplicating it.

---

### Task 1: Broaden the foldable gate to any (non-keepRef) hidden body

**Why first:** lets the fold reach the single-use non-group/multi helpers the emit-time path currently mops up, WITHOUT a recursion guard — `keepRef` (`refcount > 1`) already excludes self-recursive / alias-target / twin / multi-parent refs (see Architecture "Recursion handling"). Expected to hold floor (more folding into `renderRule`, emit-time path fires less).

**Files:**
- Modify: `packages/codegen/src/compiler/normalize.ts` (`inlineHiddenSeqRefs` `:164`, `spliceFoldableRefs` `:204`)
- Reference: `keepRef` (`computeKeepRef:87`) — the existing recursion/twin/dedup guard, left intact

- [ ] **Step 1: Broaden the foldable shape.** In `inlineHiddenSeqRefs` (`:174`) and `spliceFoldableRefs` (`:233`), replace the `resolveGroupOrMultiInlineTarget(rule) !== null` gate so a hidden helper with *any* body (plain seq/choice, not just GROUP/MULTI) is foldable. Keep returning the group `content` for GROUP and the target for MULTI; for other shapes, fold the body directly. The `keepRef` filter (`:172`) stays UNCHANGED — it already excludes recursive/twin/alias-target/multi-ref kinds, so no `visited` guard is needed. Do NOT yet touch the array (`:222`) or `fieldName` (`:230`) bails — those are Task 2 / kept.

- [ ] **Step 2: Gate.** Run `SITTIR_NATIVE_DEBUG=0 pnpm validate:native 2>&1 | rg "native:|read-render-parsePass=" | rg -v shallow`
Expected: `rust …AstMatchPass=120  ts …=71  py …=74` (floor held). If a grammar drops, the shape broadening over-folded — inspect which kind via `tool probe-kind`. If the gate *hangs* (single-use mutual recursion through group/multi — exotic), add a minimal `visited` guard to `spliceFoldableRefs` reactively (mirror `simplify.ts:936`) and re-gate.

- [ ] **Step 3: Commit.**
```bash
git add packages/codegen/src/compiler/normalize.ts packages/{rust,typescript,python}/src packages/{rust,typescript,python}/templates packages/{rust,typescript,python}/.sittir rust/crates
git commit -- packages/codegen/src/compiler/normalize.ts packages/{rust,typescript,python}/src packages/{rust,typescript,python}/templates packages/{rust,typescript,python}/.sittir rust/crates -m "refactor(normalize): broaden hidden-ref fold + recursion guard"
```
(Explicit pathspecs — the tree has unrelated dirty files. Do not bare-commit.)

---

### Task 2: Split multiplicity application (seq-level optional / leaf-level array)

**Why:** this kills the array carve-out (`spliceFoldableRefs:222`) — the exact regression both earlier attempts hit. `array`/`nonEmptyArray` refs must fold with **leaf-level** attrs so `| join(sep)` survives; `optional` keeps **seq-level** gating so bare literals aren't dropped.

**Files:**
- Modify: `packages/codegen/src/compiler/normalize.ts` (`materializeInlinedBody` `:280`, remove the array bail at `spliceFoldableRefs:222`)
- Reference: `simplify.ts` `pushAttrsToLeaves` (used by `reapplyInlinedLeafAttrs:1017`) — the leaf-level applier

- [ ] **Step 1: Remove the array/nonEmptyArray bail** at `spliceFoldableRefs:221-222` so array refs reach `materializeInlinedBody`.

- [ ] **Step 2: Branch the multiplicity application in `materializeInlinedBody`.** When `ref.multiplicity` is `array`/`nonEmptyArray`, apply attrs at the **leaves** via `pushAttrsToLeaves(body, mult, separator, fieldName)` (import from `transforms.ts`, same source `simplify.ts` uses). When `optional` (or singular), keep the current **seq-level** carry (the literal-drop guard). Preserve `metadata.inlinedFrom`.

- [ ] **Step 3: Gate** (same command as Task 1 Step 3). Expected floor 120/71/74. The canonical check: `extends_clause` must still render its comma `| join` — if rust/ts drop, the leaf-level array path is wrong. Inspect with `tool probe-kind --grammar typescript --kind extends_clause`.

- [ ] **Step 4: Commit** (explicit pathspecs, message `refactor(normalize): leaf-level array fold preserves joins`).

---

### Task 3: Drop the `_import_list` hardcode (keep `keepRef` intact)

**Why:** the `_import_list` exclusion (`:173`) is a hardcoded grammar-specific kind name — a DRY smell deferred as "Task 6". With the broadened fold (Task 1) + leaf-level array handling (Task 2), its shape should fold cleanly. **`keepRef` stays UNCHANGED** — `refcount > 1` is the recursion+twin+dedup guard and must not be narrowed (see Architecture "Recursion handling").

**Files:**
- Modify: `packages/codegen/src/compiler/normalize.ts` (drop `:173` hardcode + `:149` doc reference)

- [ ] **Step 1: Delete the `_import_list` hardcode** at `normalize.ts:173` (`if (name === '_import_list') continue;`) and the `:149` doc reference. Note: if `_import_list` is `refcount > 1` it's kept by `keepRef` anyway (no-op); this only matters if it's single-use.

- [ ] **Step 2: Gate.** Expected py holds 74 (and ideally the deferred list now folds cleanly). If py drops, the list-separator handling from Task 2 doesn't cover `_import_list`'s shape — restore the line and file a narrower follow-up rather than forcing it.

- [ ] **Step 3: Commit** (explicit pathspecs, message `refactor(normalize): drop hardcoded _import_list fold exclusion`).

---

### Task 4: Shrink the templates emit-time block to recursion-only; remove `source` + raw path

**Why:** once `renderRule` is fully inlined (Tasks 1-3), the `:1458`/`:1509` blocks only need to handle the recursion cycle-break that Task 1's `visited` guard deliberately left un-inlined. Remove both `source==='group-lift'` reads and the raw-rule (`ctx.rules`) consumption — completing the §15 cleanup AND the architecture fix (templates consumes only `renderRule`).

**Files:**
- Modify: `packages/codegen/src/emitters/templates.ts` (`:1439` skip-slot gate, `:1458`-`:1537` inline blocks)

- [ ] **Step 1: Verify renderRule is fully inlined.** Temporarily re-add a one-line probe in the symbol case: log when a `_`-prefixed ref reaches the emit-time inline with `ctx.nodeMap.nodes.get(name)?.renderRule` present. Regen typescript + rust. Expected: only *recursive* helpers (e.g. `_let_chain`) should still appear. If non-recursive refs still reach it, a fold task is incomplete — fix before proceeding. Remove the probe.

- [ ] **Step 2: Re-point `:1439`** from `rule.source === 'group-lift'` to `rule.name.startsWith('_')` (the skip-slot gate for hidden refs).

- [ ] **Step 3: Replace the `:1458`/`:1509` blocks.** Since non-recursive refs are now inlined upstream in `renderRule`, the only `_`-prefixed refs that reach here are the **recursive** survivors left by Task 1's `visited` guard. Render those as a **slot** (the boxed sub-node self-renders via its own template) — NOT an inline, NOT an opaque scalar. Concretely: emit `emitSlotReference`/`emitScalarSlot` for the recursive ref's slot. Remove the `ctx.rules` (raw) consumption entirely and the `source==='group-lift'` reads. Remove the now-unused `deleteWrapper` import if no other caller. Keep the `visitingHelpers` guard only if mutual self-rendering can still recurse at emit time.

- [ ] **Step 4: Gate.** Expected floor 120/71/74. This is the highest-risk task (it's where both earlier attempts regressed) — if any grammar drops, renderRule was NOT fully inlined for some ref class; revert this task and return to Tasks 1-3.

- [ ] **Step 5: Commit** (explicit pathspecs, message `refactor(templates): consume renderRule only; drop source reads + raw-rule inline`).

---

## Non-goals (documented, do not attempt here)
- **No recursive-ref rule, no `visited` guard, no left-recursion elimination.** Recursion is handled by the EXISTING `keepRef` (`refcount > 1`): self-recursive / alias-target / twin / multi-parent refs are kept, materialize as kinds, and the box-at-back-edge SCC pass boxes their self-slots. `_let_chain` is an alias-target (`alias(_let_chain,'let_chain')` → visible `let_chain` CST node) — a real recursive kind, correctly handled today. Do not try to fold or flatten it.
- **`keepRef` stays UNCHANGED** (`refcount > 1` + supertype-named) — narrowing it would re-expose recursion/duplication.
- **`fieldName` carve-out stays** (`spliceFoldableRefs:230`) — a fielded group ref *is* one named slot; folding surfaces internals + renames. Correct, not a wart.
- **Emit-time block doesn't fully vanish** — kept kinds (recursive/twin/alias-target) still reach `templates.ts` as `_`-refs and render as self-rendering slots; Task 4 reduces the block to that, provenance-free, renderRule-only.

## Related memory
`project_pr2b_source_irreducible` (the diagnosis chain), `project_repeat_seq_group_synthesis`, `project_render_text_fastpath_masks_templates`, `feedback_metadata_not_behavior` (§15), `feedback_verify_cargo_not_gate` (independently cargo-verify rust-emitting commits).
