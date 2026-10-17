# PR-I — Polymorph emit rewrite (the −32 zone) — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite emit for ex-polymorph kinds so they render as **plain branches** — a single merged renderRule `seq(shared-prefix, discriminating-choice-slot, shared-suffix)` rendered dispatch-free by `emitBranchTemplate`, read by the normal branch reader (arm resolved at read by first-child parsed kind), with `$variant` removed and per-arm factory submethod sugar added. This is everything PR-M deferred.

**Architecture:** Strangler step `… → M → **I** → K → …`. PR-M (commit `782aa0aa`, this branch) made `AssembledPolymorph extends AssembledBranch` with a transitional `forms` hinge, byte-neutral. PR-I now does the **emit rewrite**: the model `modelType` flips `polymorph → branch`, render moves off `emitPolymorphTemplate` onto `emitBranchTemplate`, `$variant` leaves the emitted surfaces, and the invention types are cut once nothing constructs/reads them. **This is COUNT-gated, not byte-neutral** — templates + factories CHANGE; the gate is `validate:native` AST-match HOLD with a **real render-text equivalence char-test** as the lead gate.

**⚠ THE −32 LESSON IS THE SPINE OF THIS PLAN.** A prior `buildPolymorphBranchRenderRule` attempt DROPPED slots: `reference_expression` on `&raw const x` rendered `' raw const '` — it kept the *varying* literals (`raw const`) but dropped the **shared prefix literal `&`** and the **shared suffix slot `x` (the operand)**. Decode: the shared-vs-varying partition hoisted `&` and the operand out of the arms, but the merged seq's hoisted positions failed — the hoisted literal lost its text, the hoisted slot lost its `slotByRuleId`-resolvable id. So the crux is NOT "find the choice"; it is **the shared-boundary partition + the representation of hoisted shared parts** (hoisted literals MUST keep their text; hoisted slots MUST keep an id that resolves via `sourceRuleIds`/`slotByRuleId`, or a name that resolves via `ownerSlots`). **The shared suffix slot present in EVERY form (the operand) is the trap** — it must become a sibling branch slot, never swept into the choice.

**Tech Stack:** TypeScript (ESM, `.ts` local imports), `pnpm`, codegen in `packages/codegen/src/compiler/` + `emitters/`, the rust napi crate (render-module + native reader), vitest, `pnpm validate:native` + manual `cargo check`. **Worktree:** branch off PR-M (`pr-m-rule-ir-cut`) once it merges; until then develop against current PR-M HEAD (`a9c1c9c0`, worktree `sittir-prh`).

**Source of truth (verified 2026-05-31 on `pr-m-rule-ir-cut` HEAD):** spec `docs/superpowers/specs/2026-05-22-compiler-simplification-design.md` §4d/§4d.1 (dispatch-by-read-kind; non-injective-parseKind), §4f/§H (choice-slot→submethods). Master plan `docs/superpowers/plans/2026-05-26-compiler-simplification-master-plan.md` (PR-I row line 46; baseline line 107). PR-M plan + handoff `docs/superpowers/plans/2026-05-31-pr-m-rule-ir-cut.md`.

---

## Grounding (verified file:line on `sittir-prh` HEAD `a9c1c9c0`)

| Fact | Location |
|---|---|
| `AssembledPolymorph extends AssembledBranch<PolymorphRule \| ChoiceRule>`; `modelType = 'polymorph' as const`; `get forms()` hinge; `slots = structuralSlotRecordFromForms(forms,…)` | `compiler/node-map.ts:3119`+ |
| Polymorph node passes its rule as **both** simplifiedRule + renderRule | `compiler/node-map.ts:3147` |
| `AssembledPolymorph` constructed | `compiler/assemble.ts:204` (via `derivePolymorphForms` `:454` + `buildAssembledFormGroups` `:485`) |
| **Each form's `renderRule = optimized.renderRules[formKind]`** (per-form hidden-kind render rule) | `compiler/assemble.ts:511` |
| `emitPolymorphTemplate` — per-form `{%- if variant == "X" -%}<emitRule(form.renderRule)>{%- endif -%}` blocks | `emitters/templates.ts:324` |
| `emitBranchTemplate` — `emitRule(node.renderRule, {...ctx, ownerSlots: node.slots})` (dispatch-free) | `emitters/templates.ts:270` |
| **`slotByRuleId` / `sourceRuleIds`** — slot back-pointer: `for (const id of slot.sourceRuleIds) slotByRuleId.set(id, slot)` | `compiler/assemble.ts:322-366`; slot field `node-map.ts:1751` |
| `lookupSlot` O(1) via `slotByRuleId.get(rule.id)`, name fallback via `ownerSlots`; **`DBG_SLOT_MISS=1`** miss inventory | `emitters/templates.ts:87-169` |
| `SITTIR_SLOT_PRESERVATION` gate (each slot ref once — structural backstop, INSUFFICIENT for text) | (templates emitter) |
| emit dispatch switches on `modelType` (the ~15 reroute surface) | `templates.ts:233/1622`; visitors `factories.ts:2004`, `from.ts:2223`, `wrap.ts:891`, `render-module.ts:142`, `emitter.ts:7` |
| `node.forms` consumers | `templates.ts:337`, `types.ts:212-321`, `from.ts:1304`, `wrap.ts:329`, `node-map.ts:3816/3830/3851` |
| `case 'polymorph':` rule-type switches | `node-map.ts:775/2025/2978` |
| `$variant` emitted-surface reach | `from.ts` (12 hits), `wrap.ts` (2 hits) |
| factory per-arm sugar surface | `emitters/factories.ts:1372` `emitPolymorphFactory`, `:363` `fluent` |
| PR-M char-test (the form-hinge invariant) | `packages/codegen/src/__tests__/polymorph-forms-chartest.test.ts` |

**Given findings from the PR-M Task-0 probe (re-derive empirically in Task 0 — do not take on faith):** 36 ex-polymorph kinds; all `source='override'`; **0 shared-signature** (every arm has a distinct first-child CST kind → read resolves the arm without `$variant`); fused prefix/suffix fields are identical across a kind's forms (per-form-distinct = ∅) → they hoist to sibling branch slots rendered ONCE.

---

## Gate (rust-emitting PR — COUNT-gated, byte-diff EXPECTED + classified)

- **`pnpm validate:native` deep read-render-parse AST-match: rust 125 / ts 72 / py 76 HOLD.** **Re-measure at start.** Byte-diff is **EXPECTED** (templates for these kinds change `emitPolymorphTemplate→emitBranchTemplate`; `factories.ts` changes) — classify it to ex-polymorph kinds only; any unrelated-kind change is a bug.
- **Independent `cargo check --workspace --features napi-bindings` + re-count** — native gate no-ops after regen (`feedback_verify_cargo_not_gate`); manual.
- **★ LEAD GATE — real render-TEXT equivalence char-test (NOT a synthetic round-trip).** Per ex-polymorph kind, across all 3 grammars, the new branch-render output (rendered TEXT on real corpus instances, via the read-render-parse path) **EQUALS** the golden output captured from the CURRENT polymorph path (Task 0). The −32 attempt's test never compared real render text and missed the slot drop. **Render TEXT, not slot-ref count** — a lost literal `&` trips no slot counter; a slot that renders empty still "appears once." `SITTIR_SLOT_PRESERVATION` is a structural *backstop*, not the gate.
- **Bisect by kind on any drop** — `classifyNode` is per-kind, so render can flip a subset; the −32 was confined to ~10 rust kinds with fused fields. Flip the must-construct subset last and individually if needed.

---

## Scope decisions (the two the authority asked PR-I to make)

1. **§C ClauseRule removal — OUT of PR-I → its own count-gated mini-PR.** PR-I is already the riskiest count change; §C is an *independent* count change (restores secondary fields, `project_clause_multifield_gap`). Bundling makes a count drop unattributable and defeats per-kind bisection. **Decided OUT.**
2. **Factory submethod sugar — ADDITIVE, late, separately gated.** It applies to ALL choice slots (not just ex-polymorphs), is lower-risk (new surface accepted; existing byte-identical), and is orthogonal to the render-equivalence crux. Made the LAST task so it cannot entangle construction debugging.

---

## File Structure

| File | Responsibility | Change |
|---|---|---|
| `compiler/assemble.ts` | Model build | `classifyNode` returns `'branch'` for ex-polymorph kinds (per-kind, bisectable). Build the merged renderRule for **must-construct** kinds (or route the existing `renderRules[parentKind]` for **route-existing** kinds) with correct `sourceRuleIds` so `slotByRuleId` resolves every hoisted slot. `derivePolymorphForms`/`buildAssembledFormGroups` retire once nothing reads `forms`. |
| `compiler/node-map.ts` | Model | After the flip: drop the `:3147` "rule as both simplified+render" polymorph special-case; the `forms.flatMap` arms (`:3816/3830/3851`) and the `case 'polymorph':` rule-type switches (`:775/2025/2978`) delete once unreferenced. Cut `AssembledPolymorph` subclass last. |
| `compiler/rule.ts` | Rule IR | Cut `PolymorphRule`/`VariantRule` + `isVariant`/`isPolymorph` once nothing constructs/reads them. |
| `emitters/templates.ts` | render | Ex-polymorph kinds route to `emitBranchTemplate` (`:270`); the `:237`→`emitPolymorphTemplate` arm + `emitPolymorphTemplate` (`:324`) delete once unreached. **Render reads NO `$variant`.** |
| `emitters/wrap.ts` | read/hydrate | Normal branch reader for these kinds; arm resolved by first-child parsed kind (the discriminating choice slot is populated once at read). Remove `$variant` (2 sites). |
| `emitters/from.ts` | coercion | Branch `.from()`; remove `$variant` (12 sites) once read+render are green. |
| `emitters/factories.ts` | factories | Branch factory + the NEW general per-arm submethod sugar (`.block()`/`.expr()` from any discriminating choice slot). `emitPolymorphFactory` (`:1372`) generalizes/retires. |
| `emitters/types.ts`, `render-module.ts`, `node-model.ts`, `factory-map.ts`, `shared.ts`, `consts.ts`, `ir.ts`, `emitter.ts` | per-artifact | Reroute the ~15 `modelType === 'polymorph'` dispatch + visitor `Extract<…{modelType:'polymorph'}>` signatures to the branch path. |
| `compiler/__tests__/` + `packages/codegen/src/__tests__/` | gate | NEW golden-capture fixture + render-equivalence char-test + builder-isolation unit test. |

---

## Tasks

> TDD per task: write/extend a test → run (expect fail) → minimal implement → run (expect pass) → regen → classify byte-diff + AST-match HOLD → cargo check → commit. Bisect by kind on any drop.

### Task 0 — Capture golden + partition the 36 (BLOCKING — golden capture is non-reconstructable)

**Files:** a probe/capture script + committed fixtures under `packages/codegen/src/__tests__/fixtures/polymorph-golden/` + an inventory note.

- [ ] **★ CAPTURE GOLDEN FIRST (literal first step — cannot be reconstructed after the flip).** With the CURRENT polymorph path (`emitPolymorphTemplate` still live), capture per ex-polymorph kind the **rendered TEXT on real corpus instances** (via the validator read-render-parse path) + the per-kind AST-match. Commit as fixtures. Once render flips, this baseline is gone.
- [ ] **Re-measure baseline:** `pnpm validate:native`; confirm `rust 125 / ts 72 / py 76` (or update if master moved).
- [ ] **Re-derive the probe findings empirically** (do not take on faith): enumerate the ex-polymorph kinds (expect ~36); confirm each is `source='override'`; confirm **0 shared-signature** by checking each arm has a **distinct first-child CST kind** (this is the *correctness precondition* for dispatch-free read + `$variant` removal). **Produce the carve-out set:** any kind with two arms sharing a first-child kind (non-injective `parseKind`, the `_suite`/`block` class, §4d.1) cannot resolve dispatch-free → keep dispatch or add a distinguishing alias, and exclude it from the `$variant`-removal set (Task 4).
- [ ] **★ PARTITION the 36 (shrinks the −32 risk surface).** For each kind, inspect `optimized.renderRules[parentKind]` / the parent's `simplifiedRule`:
  - **route-existing:** already `seq(prefix, choice-slot, suffix)` shaped (a grammar rule like `seq('&', optional(choice(...)), field('value', _expr))`) → renderable directly via `emitBranchTemplate` against existing `node.slots`, **NO construction** — just flip dispatch.
  - **must-construct:** a bare `choice(form0, form1…)` parent (the `node-map.ts:3147` case) → needs the merged-renderRule builder.
  Record which kinds are which. **The must-construct subset is where slot-exhaustive testing + bisection focus.**
- [ ] Commit golden fixtures + partition/carve-out inventory. **No production code change.** **Do not proceed until the partition + carve-out set exist.**

### Task 1 — The merged-renderRule builder, tested in ISOLATION against golden (THE CRUX)

**Files:** `compiler/assemble.ts` (new `buildBranchRenderRuleFromForms` or equivalent), a NEW unit test `compiler/__tests__/polymorph-branch-renderrule.test.ts`

- [ ] Write the builder for **must-construct** kinds: partition each form into **shared prefix** / **discriminating middle** / **shared suffix** by structural equality across forms; emit `seq(shared-prefix-slots-and-literals, choice(arm-middles), shared-suffix-slots-and-literals)`. **Hoisted literals MUST retain their text** (the dropped `&`); **hoisted slots MUST retain a `sourceRuleId` that lands in the slot's `sourceRuleIds`** so `slotByRuleId` resolves them (the dropped operand `x`). The shared suffix slot present in EVERY form becomes a **sibling branch slot**, never inside the choice.
- [ ] **★ Test the builder in ISOLATION BEFORE any dispatch flip:** a unit test that, for all must-construct kinds, calls the builder directly, renders via `emitRule`/`emitBranchTemplate`, and diffs rendered **TEXT vs the Task-0 golden**. Run with `DBG_SLOT_MISS=1` and assert **zero slotByRuleId misses** for these kinds. A divergence localizes to one kind without the global flip muddying attribution — this is the discipline the −32 attempt skipped.
- [ ] Iterate the builder until every must-construct kind's isolated render === golden (text) AND zero slot misses. **No `classifyNode`/dispatch change yet** — the builder is proven in isolation first.
- [ ] Commit. Gate: the isolation unit test green (text-equal + 0 slot misses); no regen yet (nothing wired).

### Task 2 — Flip `classifyNode` polymorph→branch + reroute render dispatch

**Files:** `compiler/assemble.ts` (`classifyNode`), `emitters/templates.ts` (dispatch `:233/1622`), `compiler/node-map.ts` (`:3147` special-case)

- [ ] Flip `classifyNode` to `'branch'` for the ex-polymorph kinds (route-existing first — lowest risk; then must-construct using Task-1's builder for their `renderRule`). For route-existing kinds, the existing `renderRules[parentKind]` + `node.slots` drive `emitBranchTemplate` directly.
- [ ] Reroute the render dispatch: `'polymorph'` arm in `templates.ts:233/1622` now reaches `emitBranchTemplate` for these kinds (or widen the predicate). Render reads **no `$variant`**.
- [ ] Run the render-equivalence char-test (Task 0 golden) for ALL flipped kinds. Run full `pnpm --filter @sittir/codegen test`.
- [ ] **Regen + `validate:native` + cargo check.** Gate: **AST-match rust 125 / ts 72 / py 76 HOLD**; byte-diff classified to ex-polymorph kind templates. **On any drop: bisect by kind** (flip a subset), localize, fix the builder/partition, do NOT accept the drop. Commit.

### Task 3 — Flip the read path (normal branch reader; arm resolved at read)

**Files:** `emitters/wrap.ts` (`:891` `emitPolymorph`, `:329` forms, `:1328`), the rust native reader twin

- [ ] Route the safe (non-carve-out) ex-polymorph kinds through the normal branch reader; the discriminating choice slot is populated by the parsed arm (resolved by first-child CST kind — Task-0 confirmed injective). Carve-out kinds keep `emitPolymorph`.
- [ ] Update the rust native reader twin to match (paired codegen+rust). 
- [ ] Run read-render-parse on the corpus.
- [ ] **Regen + validate:native + cargo check.** Gate: AST-match HOLD; the read populates the choice slot correctly (round-trip AST identical). Commit.

### Task 4 — Remove `$variant` from emitted surfaces (LAST, gated on read+render green + carve-out)

**Files:** `emitters/from.ts` (12 sites), `emitters/wrap.ts` (2 sites)

- [ ] **Precondition check:** read-resolves-arm (Task 3) AND dispatch-free render (Task 2) are both green for the kind, AND the kind is NOT in the Task-0 carve-out set (non-injective `parseKind`). Only then is `$variant` removable for that kind.
- [ ] Remove the `$variant` field from the emitted `from`/`wrap` surfaces for the safe set; carve-out kinds retain it (and their dispatch) until resolved or PR-K.
- [ ] **Regen + validate:native + cargo check.** Gate: AST-match HOLD; `rg "\$variant"` in generated 1–6 surfaces empty for the safe set. Commit.

### Task 5 — Cut the invention types (once nothing constructs/reads them)

**Files:** `compiler/rule.ts`, `compiler/node-map.ts`, `compiler/assemble.ts`, `emitters/templates.ts`, + the 9 `PolymorphRule`-source importers

- [ ] Confirm via `rg` nothing constructs `AssembledPolymorph` / reads `node.forms` / dispatches `modelType === 'polymorph'` for the safe set (carve-outs may still — see note).
- [ ] Delete: `emitPolymorphTemplate` (`templates.ts:324`) + its dispatch arm; `AssembledPolymorph` subclass; `PolymorphRule`/`VariantRule` from the union + `isVariant`/`isPolymorph`; `derivePolymorphForms`/`buildAssembledFormGroups`; the `forms.flatMap` arms (`node-map.ts:3816/3830/3851`); the `case 'polymorph':` rule-type switches (`:775/2025/2978`); the `:3147` polymorph render special-case. Fix the 9 source + 5 test importers.
- [ ] Run full test suite. **Regen + validate:native + cargo check.** Gate: AST-match HOLD; byte-diff classified (dead-type deletion is behavior-neutral given Tasks 2–4). Commit.

> **Carve-out handling:** if Task 0 carved out any non-injective-`parseKind` kind, `AssembledPolymorph`/`PolymorphRule` survive for those kinds only — Task 5 deletes the types only after they're resolved (author the distinguishing `variant()`/`alias()`, §4d.1) OR explicitly defers the carve-out's type-deletion to a follow-up. Do not leave a half-deleted union.

### Task 6 — General choice-slot → factory submethod sugar (ADDITIVE, separately gated)

**Files:** `emitters/factories.ts` (`:1372` `emitPolymorphFactory` → general resolver), `types.ts`

- [ ] Add the general per-arm submethod resolver keyed on ANY discriminating choice slot's `values` arms (kind-arm → delegate; literal-arm → pin, e.g. `binary_operator.plus()`) — generalizes to all branches with a discriminating choice slot, not just ex-polymorphs. Arm name = `snakeToCamel(armKind)` (the per-value render-kind, read from tree-sitter `parser.c`/`alias_sym_*`).
- [ ] Identical-arm collapse (C2/§4d) first; assert no duplicate-signature arm; a true post-dedup collision → `fail{arm-name-collision}`.
- [ ] **Regen + validate:native + cargo check.** Gate: existing output byte-identical for non-submethod surfaces; new per-arm submethods ADDITIVE (gate ACCEPTS new surface); AST-match HOLD. Commit.

### Task 7 — Final gate + glossary

**Files:** `docs/compiler-phase-glossary.md`

- [ ] `pnpm validate:native` all 3 + cargo check + re-count: `rust 125 / ts 72 / py 76` HOLD.
- [ ] Verify: `emitPolymorphTemplate` gone; `AssembledPolymorph`/`PolymorphRule`/`VariantRule` gone (modulo carve-outs); `$variant` absent from generated 1–6 (safe set); render is dispatch-free; read resolves arms.
- [ ] Update the glossary: ex-polymorphs are plain branches rendered via `emitBranchTemplate` (discrimination at READ, not render); `$variant` removed; the merged-renderRule construction documented; note §C ClauseRule is a separate mini-PR. Commit.

---

## Main risks

1. **(THE CRUX) The merged-renderRule construction — slot/literal preservation.** The −32 dropped a shared prefix literal (`&`) and a shared suffix slot (operand `x`). Hoisted literals must keep text; hoisted slots must keep a `sourceRuleId` that lands in `sourceRuleIds` so `slotByRuleId` resolves. **Mitigation:** Task 1 builds + tests the builder in ISOLATION against golden TEXT with `DBG_SLOT_MISS=1` = 0, BEFORE any dispatch flip. The route-existing/must-construct partition (Task 0) shrinks the builder's surface to a handful.
2. **Shared-field hoisting partition.** The shared suffix slot present in EVERY form (the operand) must become a sibling branch slot, NOT swept into the choice. Mis-partitioning is exactly the −32. **Mitigation:** structural-equality partition + per-kind golden text diff; bisect on drop.
3. **`$variant`-removal / read-resolution interplay.** Dispatch-free read is correct ONLY if each arm has a distinct first-child CST kind (injective `parseKind`). A non-injective kind (`_suite`/`block`, §4d.1) cannot resolve dispatch-free. **Mitigation:** Task 0 produces the carve-out set; `$variant` removal (Task 4) is gated on read+render green AND not-carved-out; the three are coupled and sequenced last.
4. **Golden baseline is non-reconstructable.** Once render flips, the current polymorph output is gone. **Mitigation:** Task 0 captures it as committed fixtures — the literal first step.
5. **Text vs slot-count gate.** `SITTIR_SLOT_PRESERVATION` (slot appears once) is insufficient — a lost literal trips no counter. **Mitigation:** the lead gate is rendered-TEXT equivalence on real corpus instances.
6. **Scope entanglement.** §C (count change) is OUT → own mini-PR; factory sugar (additive) is the LAST, separately-gated task — neither may entangle the construction debugging.

> **Do NOT run `validate:native` while drafting** — the implementer runs it per-task.
