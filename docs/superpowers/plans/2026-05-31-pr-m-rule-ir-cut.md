# PR-M — Sittir-invention rule-IR cut + `AssembledPolymorph`→`AssembledBranch` — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cut the three sittir-invented Rule-IR types that have **no grammar-visible kind** (`PolymorphRule`/`VariantRule` §B, `ClauseRule` §C) and the opaque Link `GroupRule` classifier path (§D), and **collapse `AssembledPolymorph` into `AssembledBranch`** (§H-fold): a polymorph kind becomes an `AssembledBranch` carrying a `discriminatingSlot` whose choice-slot arms ARE its former forms. PR-M is the **model restructure**; the emitter rewrite that consumes the new shape is **PR-I** — `M ≺ I` is a HARD GATE.

**Architecture:** Strangler step on the spine `… → H → **M** → I → K → … → L`. Build `AssembledBranch`'s polymorph-handling **beside** `AssembledPolymorph` (a derived `forms` getter that reproduces today's forms byte-for-byte), migrate the ~10 emitter dispatch **conditions** (not bodies) onto a structural predicate, flip the constructor, **then cut** the old types. The derived `forms` getter is the **byte-neutral hinge** — it lets every emitter body stay unchanged this PR; **PR-I deletes the getter** when it rewrites the emitters onto the discriminating-slot resolver.

**Tech Stack:** TypeScript (ESM, `.ts` local imports), `pnpm`, the codegen pipeline in `packages/codegen/src/compiler/` + `packages/codegen/src/emitters/`, the rust napi crate (`packages/*/native` / render-module emit), vitest, the `pnpm validate:native` gate + manual `cargo check`.

**Source of truth:** spec `docs/superpowers/specs/2026-05-22-compiler-simplification-design.md` — §5 PR-M row (line 1520), §B (line 1900, Polymorph/Variant → discriminating-slot), §C (line 1939, ClauseRule), §G-cut header context, §7.3 (class hierarchy, lines 1796–1858), §7.4 (Rule union end-state, lines 1860–1898), §4d/§4d.1 (dispatch + the FLAG that defers collapse/resolver/`$variant` to PR-I, lines 1200–1257). Master plan `docs/superpowers/plans/2026-05-26-compiler-simplification-master-plan.md` (PR-M row line 45; carry-forward baseline line 107).

---

## ★ SCOPE DISCIPLINE — what is PR-M vs what is PR-I ★

**Read this before touching anything.** §4f/§H describe a *general* discriminating-slot model spanning all ~168 branches. That generalization is **PR-I, not PR-M.** The §4d FLAG (spec line 1250) is explicit: "the collapse + the resolver + `$variant` removal are all **PR-I**, which depends on **PR-M**."

**IN SCOPE (PR-M):**
- Delete `PolymorphRule` + `VariantRule` from the `Rule` union; delete `ClauseRule`; delete Link's `classifyHiddenSeqRule` GroupRule classifier path.
- Delete `AssembledPolymorph` + `modelType:'polymorph'`; a former polymorph kind becomes an `AssembledBranch` with `discriminatingSlot?`.
- Record a thin `DiscriminatingSlotMarker` (which-slot + arm-name overrides) where `promotePolymorph`/`applyOverridePolymorphs` previously built per-form structures.
- Keep emit **byte-identical** for the existing ~32 polymorph kinds via the derived `forms` getter.

**OUT OF SCOPE — explicitly deferred to PR-I:**
- `$variant` removal from emitted surfaces (~95+ ts sites). **Stays this PR.**
- The general resolver + per-arm submethods for the other ~136 non-polymorph branches. **PR-I.**
- Identical-arm collapse (C2 / §4d). **PR-I.**
- Deleting the derived `forms` getter. **PR-I deletes it** when it rewrites emitters onto the resolver.
- Arm-naming rewrite to tree-sitter `cSymbol` (§4f/§4g), `TOKEN_NAMES`/`tokenToName` deletion. **PR-I.**

PR-M's job is narrow: **collapse the existing polymorphs into branches-with-`discriminatingSlot`, keeping their emitted code byte-identical, while the sittir-invented Rule types leave the union.**

---

## ⚠ SPEC LINE NUMBERS ARE 029-STALE — anchor by symbol, verify at start

The spec was written against branch `029`; PR-A…PR-H have since landed, drifting every line number. Confirmed drift (verified 2026-05-31 on `master`):

| Spec says | Actually (current `master`) |
|---|---|
| `AssembledPolymorph` at `node-map.ts:2599/3163` | **class at `node-map.ts:3119`**; union member ~`:3163` (re-verify) |
| `structuralSlotRecordFromForms` `:2131` | **`node-map.ts:2538`** |
| `detectClause` `link.ts:2338` | **`link.ts:2397`** (called `:1838`) |
| `classifyHiddenSeqRule` GroupRule path `link.ts:2010/1975` | classifier `link.ts:1999`, seq path `link.ts:2081` |
| `evaluate.ts:330-339` variant-retype | `evaluate.ts` ~`:330` (the heterogeneous-name → variant retype) |
| `optimize.ts:484/546/718` (terminal arms — PR-P, not us) | now `normalize.ts` (PR-H renamed) |
| `PolymorphRule` import reach **7** | **14 files** = **9 source** (`assemble.ts`, `evaluate.ts`, `generate.ts`, `link.ts`, `node-map.ts`, `normalize.ts`, `rule.ts`, `wrapper-deletion.ts`, **`diagnose-slot-grouping.ts`** — SOURCE, not a test) + **5 test** (`compiler/__tests__/assemble.test.ts`, `compiler/__tests__/link.test.ts`, `compiler/__tests__/wrap-variant-emit.test.ts`, `compiler/__tests__/wrapper-deletion.test.ts`, `compiler/diagnose-slot-grouping.test.ts`) |

**Every task anchors on a symbol name + `rg` to re-locate; do NOT trust the spec's lines. Re-confirm at implementation start.**

---

## Gate (rust-emitting PR — state both halves explicitly)

PR-M is **rust-emitting** (collapsing `AssembledPolymorph` reshapes what render-module/transport emit for polymorph kinds). Per master-plan execution rule (line 22) + `feedback_verify_cargo_not_gate`, the SubagentStop native gate **no-ops after a regen** — so cargo-verify is a **manual** step.

- **Deep read-render-parse `pnpm validate:native`, all 3 grammars: `rust 125 / ts 72 / py 76` HOLD-OR-IMPROVE.** (Carry-forward baseline, master-plan line 107. **Re-measure at PR-M start** — master may have moved.)
- **PLUS** an independent `cargo check --workspace --features napi-bindings` + a re-count of rust-emitting changes — the gate no-ops after regen, so verify cargo yourself; never trust a self-reported "cargo passed."
- **Per-task byte-diff classification (do NOT assume empty):**
  - **Behavior-preserving steps** (the `forms`-getter "beside" addition, dispatch-condition swaps, constructor flip) → generated **byte-diff EMPTY** (`git diff --stat packages/*/src packages/*/.sittir` after regen). The getter must reproduce `derivePolymorphForms` exactly.
  - **§C ClauseRule removal is BEHAVIORAL → count-gated, EXPLAIN drift.** Removing `detectClause` restores secondary fields that the first-field-only clause dropped (`project_clause_multifield_gap`) → counts may **improve** (more slots derived). This is NOT byte-empty; classify the drift and confirm it is *additive* (no kind loses a field).
  - The final **cut** (deleting `AssembledPolymorph`/the Rule types) → byte-empty relative to the post-flip tree (nothing reads them after the constructor flip).

---

## ★ Task 0 IS AN EMPIRICAL ISOLATION-TEST (apply the PR-E lesson) ★

Master-plan line 105 (PR-E learning): **never trust a "this is removable / it's shadowed" static claim — delete→regen→diff.** §B/§C/§D each carry such a claim. Task 0 *resolves them empirically* and produces an inventory as its **deliverable**, so the plan does not assume them away.

**The blocking question (§B forms→arms 1:1):** the spec's identity "a form = a single discriminating-slot arm (one `NodeRef`/`TerminalValue`)" only holds if **every current polymorph form maps to exactly ONE grammar-visible (group) kind.** But `buildOverridePolymorphForms` / `fuseOverridePolymorphFormContent` (`link.ts:988-1053`) produce forms with **fused prefix/suffix** — potentially *multi-field* forms. If any fused form is NOT already a single group kind, the derived `forms` getter (reconstructing forms from single-kind arms) **loses the prefix/suffix fields** → render regression that "counts unchanged" will catch as a drop.

**Task 0 must MECHANICALLY inventory this across all 3 grammars and surface a blocking finding if the 1:1 mapping fails** (the answer is then elevate-to-group, or carve that kind out of PR-M) — as a Task-0 deliverable, not a later discovery.

**"Mechanical," not a static read (option a).** Task 0 is empirical because it *runs the compiler and dumps real data* — it does not eyeball `link.ts`. The concrete artifact is a script (a throwaway `tsx` snippet or a temporary `sittir tool`) that, for each grammar, runs `evaluate → link` and for every polymorph kind dumps `derivePolymorphForms(kind, rule)` and **counts the fields per form** (`collectFieldNames(form.content).size`, or equivalently the slot count `Object.keys(form.slots).length`). The output is the form→arm table: `{grammar, kind, formIndex, fieldCount}`. **`fieldCount === 1` for every form ⇒ 1:1 holds.** Any `fieldCount > 1` is a fused multi-field form ⇒ BLOCKING. This produces the table as a committed artifact instead of an assertion about the code.

**Belt-and-suspenders:** Task 1's characterization test (`branch.forms` getter ≡ `derivePolymorphForms`, exhaustive over all polymorph kinds) is the *second* empirical check — if Task 0's field-count heuristic missed a loss, the deep-equal char-test catches it before any cut. Task 0 establishes the table; Task 1 proves the getter reproduces it. The STOP/re-scope-on-non-1:1 logic gates between them.

---

## File Structure

| File | Responsibility | Change |
|---|---|---|
| `compiler/rule.ts` | shared Rule IR + type guards | DELETE `PolymorphRule`/`VariantRule`/`ClauseRule` from the `Rule` union + `PolymorphForm`; DELETE `isVariant`/`isClause` guards. **Keep `SeqRule`/`ChoiceRule`/`GroupRule`/`SupertypeRule` etc.** A polymorph's structural rule becomes a plain `ChoiceRule`; a clause becomes plain `optional(seq(...))`. |
| `compiler/node-map.ts` | the Model (`AssembledNode` hierarchy + slots) | ADD `discriminatingSlot?: string` + a derived `forms` getter to `AssembledBranch`; generalize `structuralSlotRecordFromForms` (`:2538`) cross-arm union into the branch slot-merge. DELETE `class AssembledPolymorph` (`:3119`) + `modelType:'polymorph'` from the `AssembledNode` union; DELETE the `node.forms.flatMap` arms in the free functions (`:3816/3830/3851`). The `allStructuralSlotsOf` `modelType==='polymorph'` check (`:3867`) is a *separate* edit (drop the `'polymorph'` disjunct — it reads `node.slots`, not `node.forms`). |
| `compiler/link.ts` | Link phase (classify what each rule is) | Reframe `promotePolymorph`/`applyOverridePolymorphs`/`buildOverridePolymorphForms` to RECORD a `DiscriminatingSlotMarker` (NEW thin interface) instead of building `PolymorphRule.forms`; DELETE `detectClause` (`:2397`) + its call (`:1838`) + `classifyHiddenSeqRule` GroupRule path (`:2081`). |
| `compiler/evaluate.ts` | Evaluate (run the DSL) | DELETE the heterogeneous-name → `VariantRule` retype (~`:330`); the all-field choice stays a plain `ChoiceRule` (factored field) — verify no `variant` retype escapes. |
| `compiler/normalize.ts` | Normalize (PR-H renamed from optimize) | DELETE `mapPolymorphForms` (`:735`) + its 4 call sites (`:272/404/446/715`) — a plain `ChoiceRule` recurses via the normal `choice` arm. |
| `compiler/assemble.ts` | Assemble (Model builder) | Reframe `derivePolymorphForms` (`:454`) → produce the `discriminatingSlot` marker / build `AssembledBranch` (not `AssembledPolymorph`); build `AssembledGroup` from the wire helper kind (§D), not Link's classifier. |
| `emitters/*.ts` (**13 files** — verified via `rg "modelType === 'polymorph'\|node\.forms\|variantChildKinds" emitters/`) | per-artifact projections | **CONDITION swaps only (no body rewrite):** replace `modelType === 'polymorph'` / `node.forms` / `variantChildKinds` reads with the structural predicate (`isDiscriminatingBranch`) + the `forms` getter. Files: `types.ts`, `factories.ts`, `from.ts`, `wrap.ts`, `render-module.ts`, **`shared.ts`** (LOAD-BEARING — drives `classifyFactoryShape`/factory-mode), `templates.ts`, `node-model.ts`, `factory-map.ts`, `consts.ts`, `ir.ts`, **`test.ts`**, **`type-test.ts`**. (Note: `transport-projection.ts` did NOT appear in the current `rg` reach — re-verify at edit time; `is.ts` likewise.) |
| `compiler/__tests__/*` + characterization test (NEW) | gate | NEW characterization test pinning the `forms` getter ≡ `derivePolymorphForms` for every polymorph kind; update `PolymorphRule`-referencing tests. |

---

## Tasks

> TDD per task: write/extend a failing test → run (expect fail) → minimal implement → run (expect pass) → commit. Rust-emitting steps additionally regen + `cargo check` + re-count. Anchor every edit by `rg <symbol>`; re-verify the line at edit time.

### Task 0 — Empirical inventory: do polymorph forms map 1:1 to discriminating-slot arms? (BLOCKING)

**Files:** a throwaway mechanical dump script (`tsx` snippet or temp `sittir tool`) + a committed inventory artifact under `docs/superpowers/notes/` (or inline in the PR description). The script RUNS the compiler — this task is empirical, not a static read of `link.ts`.

- [ ] **Re-measure the baseline.** `pnpm validate:native`; record `rust/ts/py` deep read-render-parse. Confirm `125/72/76` (or update the gate target if master moved).
- [ ] **Write + run the mechanical dump.** For each grammar, run `evaluate → link`, then for every polymorph kind (producer: `promotePolymorph` + `applyOverridePolymorphs`; enumerate via the linked rules with `type === 'polymorph'`) dump `derivePolymorphForms(kind, rule)` and, **for each form, count its fields** — `collectFieldNames(form.content).size` (or the slot count `Object.keys(form.slots).length`). Emit rows `{grammar, kind, formIndex, fieldCount}`. This is the concrete artifact, not an assertion about the source.
- [ ] **Produce the inventory deliverable:** the dumped `{grammar, kind, formIndex, fieldCount}` table. **`fieldCount === 1` for EVERY form ⇒ the byte-neutral `forms`-getter seam is sound; proceed.** **Any `fieldCount > 1` ⇒ a fused multi-field form ⇒ BLOCKING FINDING:** the derived getter would drop the prefix/suffix fields. Surface it; the resolution is either (a) elevate that fused content to a wire group kind (ties to §D/ELEVATE — may itself be out of PR-M scope) or (b) carve that kind out of the collapse for this PR. **Do not proceed to Task 2 until this is answered.** (Task 1's deep-equal char-test is the second, finer empirical check — see Task 1; Task 0 establishes the table, Task 1 proves the getter reproduces it.)
- [ ] **§D pre-check:** for every hidden-seq currently classified by `classifyHiddenSeqRule` (`link.ts:2081`), confirm a wire-synthesized helper twin exists (so deleting the classifier doesn't orphan a kind). Record any without a twin as a §D blocker.
- [ ] **§C pre-check:** confirm wrapper-deletion's `optional` pushdown reaches the inner seq's field leaves once `detectClause` is gone (so the fields carry their own optionality — spec line 1952). Note the expected count *improvement* from restored secondary fields.
- [ ] Commit the inventory note. **No code change in Task 0.**

### Task 1 — `DiscriminatingSlotMarker` + derived `forms` getter on `AssembledBranch` (BESIDE, additive)

**Files:** `compiler/link.ts` (marker interface), `compiler/node-map.ts` (`AssembledBranch`)

- [ ] Write a failing **characterization test**: for every current polymorph kind, assert a new `branch.forms` getter (to be added) deep-equals the existing `AssembledPolymorph.formRules` / `derivePolymorphForms` output. (Initially the getter doesn't exist → fail.)
- [ ] Add `interface DiscriminatingSlotMarker { parentKind; discriminatingSlotName; armNames?; source: 'promoted'|'override' }` to `link.ts` (spec §B, line 1917). Purely additive metadata — does NOT yet replace anything.
- [ ] Add `discriminatingSlot?: string` + a **derived `forms` getter** to `AssembledBranch` (`node-map.ts:2586`). The getter reconstructs forms from the discriminating choice slot's arms (generalize `structuralSlotRecordFromForms`, `:2538`, into the branch slot-merge). **`AssembledPolymorph` stays alive** — this is the "new beside old" step.
- [ ] Run the characterization test (expect pass). Counts/byte-diff unaffected (nothing routes through the new path yet).
- [ ] **Rust-emitting gate (the `forms` getter feeds the render/transport emit path):** regen all 3 grammars + an independent `cargo check --workspace --features napi-bindings` + re-count (the SubagentStop native gate **no-ops after regen** — manual cargo-verify required, `feedback_verify_cargo_not_gate`).
- [ ] Commit. Gate: `pnpm test` green; **byte-diff EMPTY** (additive, unread) + cargo check clean + counts unchanged.

### Task 2 — Migrate emitter dispatch CONDITIONS onto a structural predicate (no body rewrite)

**Files:** the **13 emitter files** from File Structure (incl. **`shared.ts`**, **`test.ts`**, **`type-test.ts`** — re-verify reach via `rg "modelType === 'polymorph'\|node\.forms\|variantChildKinds" emitters/`), `compiler/node-map.ts` (the free-function `node.forms.flatMap` arms `:3816/3830/3851` — NOT `:3867`, which is the separate `allStructuralSlotsOf` `modelType` disjunct handled in Task 5)

- [ ] Add an `isDiscriminatingBranch(node)` predicate (true for the old `AssembledPolymorph` AND a new `AssembledBranch` with `discriminatingSlot`). This is a **condition swap, NOT a rename** — per the PR-H lesson, lspeasy `rename-symbol` does nothing for argument/condition changes; **hand-edit.**
- [ ] For each emitter site, replace `modelType === 'polymorph'` with the predicate and `node.forms`/`node.variantChildKinds` reads with the getter (`variantChildKinds = discriminatingSlot.kinds`). **Bodies unchanged** — same output, sourced via the getter. **`shared.ts` is load-bearing** — it drives `classifyFactoryShape`/factory-mode; do not skip it.
- [ ] Extend a test asserting both the old polymorph node and a hand-constructed branch-with-`discriminatingSlot` drive identical emitter output.
- [ ] Run (expect pass). **Rust-emitting gate (`render-module.ts`/`from.ts` are in the swap set + the getter feeds emit):** regen all 3 grammars + an independent `cargo check --workspace --features napi-bindings` + re-count (the SubagentStop native gate **no-ops after regen** — manual cargo-verify required). Commit. Gate: **byte-diff EMPTY** (the predicate is true for the still-`AssembledPolymorph` nodes; output identical) + cargo check clean + counts unchanged.

### Task 3 — Flip the constructor: build `AssembledBranch`+`discriminatingSlot`, not `AssembledPolymorph`

**Files:** `compiler/assemble.ts` (`derivePolymorphForms` `:454`, the construction site), `compiler/link.ts` (record the marker)

- [ ] Write a failing test: assert that a former polymorph kind now has `modelType === 'branch'` with a populated `discriminatingSlot`, and its `forms` getter still deep-equals the Task-0 inventory.
- [ ] Reframe `promotePolymorph`/`applyOverridePolymorphs` to record the `DiscriminatingSlotMarker` (which-slot + arm-name overrides) instead of building `PolymorphRule.forms`. The structural rule stays a plain `ChoiceRule`.
- [ ] At Assemble, construct `AssembledBranch` (with `discriminatingSlot` from the marker) instead of `AssembledPolymorph`. `AssembledPolymorph` is now **unconstructed but still defined**.
- [ ] Run (expect pass). **Regen all 3 grammars + `cargo check --workspace --features napi-bindings` + re-count** (rust-emitting). Gate: **byte-diff EMPTY** (the getter feeds the same emitter paths) — if any drift, it traces to a Task-0 multi-field form (blocking) or a getter mismatch (fix the getter). Commit.

### Task 4 — §C: delete `ClauseRule` + `detectClause` (BEHAVIORAL — count-gated)

**Files:** `compiler/link.ts` (`detectClause` `:2397`, call `:1838`), `compiler/rule.ts` (union + `isClause`), `compiler/collect-slots.ts` (the `'clause'` arms at `:73` / `:169` / `:473` — the `:473` arm is the force-optional special-case)

- [ ] Write a test asserting a known clause-bearing kind (identified in Task 0's §C pre-check) now derives a slot **per field** (secondary fields restored), closing `project_clause_multifield_gap`.
- [ ] Delete `detectClause` + its call; delete `ClauseRule` from the union + `isClause`; delete the `'clause'` case arms (`rule.ts`, `link.ts`, `collect-slots.ts`). `optional(seq(fields))` is left as plain structure; the optional multiplicity is already on the leaf (PR0 `RuleBase.multiplicity`), so the force-optional special-case is unnecessary.
- [ ] Run (expect pass). **Regen + cargo check + re-count.** Gate: **count-gated, hold-or-IMPROVE** (secondary fields reappear → likely +slots; **EXPLAIN the drift** — confirm additive, no kind loses a field). Commit.

### Task 5 — §B/§D: cut the dead types (`AssembledPolymorph`, `PolymorphRule`, `VariantRule`, GroupRule classifier)

**Files:** `compiler/node-map.ts`, `compiler/rule.ts`, `compiler/link.ts`, `compiler/evaluate.ts`, `compiler/normalize.ts`, `compiler/assemble.ts` + the **14 `PolymorphRule`-importing files** (9 source + 5 test, listed in the spec-drift table)

- [ ] Confirm (via `rg`) nothing constructs or dispatches on `AssembledPolymorph`/`modelType:'polymorph'` after Tasks 2–3.
- [ ] Delete `class AssembledPolymorph` (`:3119`) + `modelType:'polymorph'` from the union + the `node.forms.flatMap` free-function arms (`:3816/3830/3851`). Delete `PolymorphRule`/`VariantRule`/`PolymorphForm` from the `Rule` union + `isVariant`; delete `mapPolymorphForms` (`normalize.ts:735`) + its 4 call sites; delete the `evaluate.ts` variant-retype; delete `classifyHiddenSeqRule`'s GroupRule path (Assemble builds `AssembledGroup` from the wire helper, §D).
- [ ] **Delete/redirect the three `rule.type === 'polymorph'` switch arms in `node-map.ts` (`case 'polymorph':` at `:775`, `:2025`, `:2978` — verified `switch (rule.type)`/`switch (r.type)`, NOT `modelType`).** These are Rule-level dispatches that become unreachable once `PolymorphRule` leaves the union; remove each arm (the rule is now a plain `ChoiceRule`, handled by the existing `case 'choice':`). Confirm the `choice` arm covers what the polymorph arm did.
- [ ] **Delete the `allStructuralSlotsOf` `modelType==='polymorph'` disjunct (`:3867`)** — separate from the `forms.flatMap` arms; it reads `node.slots`, so drop only the `'polymorph'` term (a former polymorph is now a `'branch'`, already covered).
- [ ] Fix the fallout in the 14 `PolymorphRule`-importing files (imports + any residual references; **`diagnose-slot-grouping.ts` is SOURCE, not a test** — it imports `PolymorphRule`) + update/delete `PolymorphRule`-referencing tests. **These are deletions, mostly hand-edits.** If you introduce the `DiscriminatingSlotMarker` as a renamed/moved symbol, use `@lspeasy/cli` (`node /Users/pmouli/GitHub.nosync/active/ts/lspeasy/packages/cli/dist/cli.js rename` / `move-symbol`, ABSOLUTE paths, `--root /Users/pmouli/GitHub.nosync/refactory-lang/sittir`) — otherwise no rename steps (per the PR-H warning, LSP does nothing for deletions/condition swaps).
- [ ] Run full `pnpm --filter @sittir/codegen test` (expect green). **Regen + cargo check + re-count.** Gate: **byte-diff EMPTY** relative to the post-Task-4 tree (nothing read these after the flip). Commit.

### Task 6 — Final gate + glossary/spec reconciliation

**Files:** `docs/compiler-phase-glossary.md` (update at PR-M close, per `feedback_compiler_glossary_first`)

- [ ] `pnpm validate:native` all 3 + `cargo check --workspace --features napi-bindings` + re-count. Assert `rust 125 / ts 72 / py 76` hold-or-improve (with §C improvement explained).
- [ ] Verify `PolymorphRule` import reach → **marker-only**, measured against the **9-source baseline** (`assemble.ts`, `evaluate.ts`, `generate.ts`, `link.ts`, `node-map.ts`, `normalize.ts`, `rule.ts`, `wrapper-deletion.ts`, `diagnose-slot-grouping.ts`): after the cut, `rg -l PolymorphRule packages/codegen/src` returns only the `DiscriminatingSlotMarker` definition site(s) (zero of the 9 source files still import `PolymorphRule`). `AssembledPolymorph` gone entirely; `ClauseRule`/`VariantRule` gone from the union.
- [ ] Update `docs/compiler-phase-glossary.md`: remove `AssembledPolymorph`/`PolymorphRule`/`ClauseRule`/`detectClause` references; document `AssembledBranch.discriminatingSlot` + the derived `forms` getter (flag it as a **PR-I deletion target**); note the Rule union is now sittir-invention-free (Enum/Terminal content classifications remain → PR-P).
- [ ] Commit. **Do NOT** touch `$variant`, the general resolver, or arm-naming — those are PR-I.

---

## Open questions / risks

1. **(BLOCKING, resolved in Task 0) Fused multi-field forms.** If `fuseOverridePolymorphFormContent` produces a form that isn't a single grammar-visible kind, the derived `forms` getter drops prefix/suffix fields → render regression. Task 0's inventory IS the resolution gate; if it fails, the plan needs an explicit elevate-to-group or carve-out answer before Task 2.
2. **The `forms` getter is the entire byte-neutrality hinge.** All of PR-M's "byte-empty" claims rest on it reproducing `derivePolymorphForms` exactly. The Task-1 characterization test must be exhaustive over all polymorph kinds; a silent getter mismatch surfaces only as a `validate:native` drop. Treat any non-zero byte-diff in Tasks 2–3 as a getter/inventory bug, not noise.
3. **The `M ≺ I` boundary.** PR-M leaves `$variant` in the emitted code and the polymorph-specific emitter *bodies* intact (only conditions swapped). PR-I then rewrites bodies onto the general resolver, removes `$variant`, and **deletes the `forms` getter**. If PR-M accidentally generalizes (touches the other 136 branches, removes `$variant`), it breaks the gate boundary and conflates two count-gated changes. Hold the line.
4. **§C is behavioral, not byte-empty.** The clause-multifield gap closing changes counts (improves them). Classifying §C as byte-empty would mask the (legitimate) drift. Keep it count-gated with an explicit additive-only check.
5. **§D classifier vs wire-helper twin.** Deleting `classifyHiddenSeqRule`'s GroupRule path assumes every such hidden-seq has a wire-synthesized helper twin (§D pre-check, Task 0). If a kind lacks a twin, deleting the classifier orphans it — a §D blocker to surface before Task 5.
6. **Spec line drift.** Every spec line number is 029-stale; `PolymorphRule` reach is **14 files (9 source + 5 test)**, not the spec's 7. Anchor by symbol + `rg`; recount the gate metric against current `master`.
7. **Do NOT run `validate:native` while drafting** (this is the plan, not the implementation) — the implementer runs it per-task.
