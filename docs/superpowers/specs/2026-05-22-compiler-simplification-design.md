# Compiler Workflow Simplification — Design

**Date:** 2026-05-22
**Status:** 📋 SPEC RECONCILED TO REPO — brainstorm (above) + code-grounded implementation spec §1–§7 (below); **all prior folds + repo-reconciliation (2026-05-25)**. **PR3 has LANDED** (#36 `ee3d7a0b`, merged to master 2026-05-24): legacy render walker pipeline deleted, render-fidelity fixes, native-staleness guard. **PR-A0 is DONE** (the Normalize losslessness fix shipped in #36: `c38ffbf1` collapseWrappers+canonicalizeSeqOfLeaves, `a91927c6` fanOut+factor id-preservation; `withAttrsFrom`/`combineMultiplicity` live in `rule-attrs.ts`) → the pending sequence now starts at **PR-A**. The remaining design (Principles #15–#18, the Rule-IR cuts, the choice-slot-submethods + naming/enum/registration unification) is intact — no assumption broke. **Losslessness audit verdict: Simplify lossless-modulo-literal-removal HOLDS; `token.immediate` drop CONFIRMED FIXED; the Normalize `collapseWrappers` violation is now CLOSED (PR-A0, `c38ffbf1`) — Normalize is genuinely lossless, #2 enforced.** Adds **Principle #16 (synthesis only if deterministic AND grammar-visible)**; cuts **ALL sittir-invented + content-classification Rule types** — `PolymorphRule`/`VariantRule`/`ClauseRule` + the opaque Group classifier (§B/§C/§D — **ClauseRule still pending**, `detectClause` live at `link.ts:2338`) AND `EnumRule`/`TerminalRule` (→ predicates + Model nodes, §G-cut); the `propose-*` diagnostic class (§E); enrich-widening (§F); plus #15, the sanctioned `content` slot (§4c), identical-form collapse (§4d), the H2 helper-leak fix, the #14 getter-vs-method line, the `parameterless`-as-memoized-getter convergence, and the M1/MO2/M3/P1 structural de-dups. End-state `Rule` union is purely structural. The **choice-slot-submethods fold (§4f/§H, #17)** + the **naming/enum/registration unification (§4g/§4h, #18)** are the largest: emission keys on a STRUCTURAL fact (a branch's discriminating choice slot); **all literals are kinds** named by tree-sitter (`parser.c`); registration = **ELEVATE** ⊕ **RELABEL** (existing passes). **Branch 029 has landed a SEED of the §4b/§E diagnostics channel** — `diagnoseSlotGrouping` (`diagnose-slot-grouping.ts`, Simplify-time, 3 shapes with `proposal` strings) + `slot-count.ts` (`countSlots ≡ collectSlots`, the "a slot never contains slots" invariant). **Parse-naming decomposition (folded):** each slot value carries TWO kind REFERENCES (#4g) — `value.kind` (render/source) + `value.parseKind` (parse-as: alias target / variant base / own kind); `TerminalValue.resolvedKind`→`parseKind`. The slot-level `aliasSources` map + stored `#refKindNames` DISSOLVE into per-value `parseKind`/`kind` (#1); `kinds`/`parseNames` project `values`; `deriveAliasSources` deletes (PR-B adds the refs, PR-C removes the map + re-points wrap's 4 reader sites). **Ready for user review → `writing-plans`.** **18 PRs** (PR-A..PR-Q + PR-L; PR3 + PR-A0 DONE; old PR-J merged into PR-I).
**Base:** branch `029-slot-grouping-diagnostic` (off `master`, post-PR3 merge `ee3d7a0b` #36; #37/#38 landed). **Baseline to hold (deep `read-render-parsePass`; confirm with a fresh `pnpm validate:native` at implementation start):** **rust** cov 181/186 · read-render-parse 134/136 · ast 125 — **python** cov 107/110 · read-render-parse 96/115 · ast 74 — **typescript** cov 174/182 · read-render-parse 82/111 · ast 75.
> **Baseline caveat (FOLD-2 / visible kinds):** the headline rust number above
> (`cov 181/186 · ast 125`) is **`origin/master`-accurate** (`486c5add`, #38) and
> does NOT include 029's applied `type_arguments`/`type_parameters` visible groups
> (`fc7c77de`). Those groups + the two visible-kind band-aids they motivated (§5
> PR-E) are on **029**, not master. **If carried into the implementation base**,
> the handoff measured **rust cov 182/186 · read-render-parse 134/136 · ast 126**
> (cov +1, ast +1; py/ts unchanged); **otherwise the origin/master baseline above
> holds.** Confirm with a fresh `pnpm validate:native` at implementation start.

---

## Scope & approach (decided)

- **Scope:** the full pipeline **+ emitters** (largest scope).
- **Primary pain:** *all three* — re-derivation/divergence, conditional special-casing, phase/representation sprawl. They share one root: **the same fact is derived in multiple places that drift apart** (this session's `block`-vs-`body`; the Codex stale-slot transport breaks).
- **Structure:** **incremental strangler, one spec** — build the new model beside the old, migrate phase/emitter at a time, `pnpm validate:native` every step, **never regress** the pass rates (current baseline, 2026-05-25: rust cov 181/186 · read-render-parse 134/136 · ast 125; python 107/110 · 96/115 · ast 74; ts 174/182 · 82/111 · ast 75 — deep `read-render-parsePass`).
- **Architecture:** **centralize & strangle the existing slot model.** Make `AssembledNonterminal` (with the `_new` naming getters) authoritative; derive slots uniformly; migrate each emitter (wrap → transport → bridge → render → types/factories) to **read** the slot via `slotByRuleId` instead of re-deriving. Defer phase/Rule-type collapse to last.
- **Refinement, not greenfield.** The Model and Rule IR *enhance* the existing `AssembledNonterminal` + Rule IR — never rebuild them. Concrete refinement: **make `AssembledNonterminal` a class** — following the existing class-based node model (`AssembledNode` is *already* a class, so this extends the established pattern rather than introducing one). It becomes the authoritative model object that encapsulates the naming derivation (today's `_new` getters) as methods. Emitters hold a reference and call `.storageName`/`.parseNames`/`.name`; re-derivation becomes impossible because there is no raw shape to re-walk. Same for the Rule IR: extend it with the leaf attributes (multiplicity/separator/fieldName/nonterminal) rather than introducing a parallel type — the strangler migrates *onto* it.

---

## Design Principles

**The Model (#0)** — Principles #1–4 are the *names* of the Model's four
properties; the substance lives in **"#0 — The Model: four properties"** (the
canonical home). Do not restate them — reference that section.
1. **Single source of truth** → see #0 (Complete, single-home corollary).
2. **Complete & non-lossy** → see #0 properties 1 + 4.
3. **Pure** → see #0 property 2.
4. **Derive-or-diagnose** → see #0 property 3.

**The phases**
5. **One job per phase** — single responsibility, typed output, no cross-phase rewriting overlap.
6. **Lossy by consumer, not by default** — *canonical statement here:* Normalize keeps everything; Simplify reduces *only* for the non-render emitters (1–5); the renderer (#6) reads the non-lossy source. Everywhere else (§B.2, §4) references this principle rather than re-spelling it.
7. **Transforms are shared & idempotent** — defined once, re-applicable; Simplify reduces then re-applies to a fixpoint.
8. **Shared grammar layer** — Enrich/Wire run in both compilers, so the parser and the IR see the identical grammar.

**The projections (1–6)**
9. **Emitters are pure projections** — read the Model, never re-derive; each preserves its artifact's goal (compile-time validation, runtime validation, DX, lazy traversal, memory-efficiency, zero-copy).
10. **Build artifacts are single-sourced too** — one serialized Model (`node-model.json5`) for tooling/diagnostics; obviates `factory-map.json5`; never a production-runtime dependency.

**The approach**
11. **Refinement, not greenfield** — enhance the existing `AssembledNonterminal`/Rule IR; centralize via a class (encapsulation *enforces* single-source — no raw shape to re-walk).
12. **Strangler-safe** — new beside old, migrate incrementally, never regress the pass rates.

**Code organization**
13. **One module per phase** — each phase is exactly one file (`evaluate.ts`, `link.ts`, `normalize.ts`, `simplify.ts`, `assemble.ts`, `emit.ts`); every method called within the pipeline lives in its phase module. Only exceptions:
    - (a) **transforms shared between Normalize & Simplify** → a shared transforms module (per #7);
    - (b) **per-artifact emitters** (`emitters/factory.ts`, `emitters/templates.ts`, …) dispatched from `emit.ts`;
    - (c) **shared rule helpers** → `rules.ts`.
    **Shared *node* methods don't exist** — node behavior lives on the `AssembledNode`/`AssembledNonterminal` classes (#11), not a util module. *Pure node-self reads* (a value computed from the node alone) are class **getters**; computations that need cross-node or phase state are pipeline **methods** (#14), not getters.
14. **Uniform method signature & naming** — every pipeline method takes exactly two inputs: the **target** (a rule or node) and a **phase context** (`NormalizeCtx`, `SimplifyCtx`, `AssembleCtx`, …). It is named `<operation><ObjectType>` — the operation plus the type of object operated on (rule type / model type / slot class). E.g. `collapseSeq(rule: SeqRule, ctx: SimplifyCtx)`, `pushdownField(rule: FieldRule, ctx: NormalizeCtx)`. The context **absorbs ALL extra inputs** (`nodeMap`, `kindEntries`, `wordMatcher`, the rule map, …) — so **there is no genuinely non-conforming pipeline method**: anything that "needs another argument" puts that argument in `ctx`. The context carries phase-shared state and the **diagnostics sink** (the home for #4's derive-or-diagnose) — methods never reach for globals.
    - **Getter vs method — the explicit line.** A **pure node-self read** (needs nothing but the node itself) stays a class **getter** (`node.hidden`, `node.storageName`, `slot.arity`). **Anything needing cross-node or phase state** is a `(target, ctx)` **method** — e.g. `(node, ctx)` with `nodeMap` in `ctx` — **never a getter that takes an argument**. There are no `node.foo(nodeMap)` getter-with-arg shapes in the end-state; such a computation is `computeFoo(node, ctx)` (a method) whose result may be cached onto a plain node field that emitters then read field-style (`node.foo`).
    - *(Benefit, not a rule: the uniform shape means a single injected wrapper can provide trace-level probing across the whole pipeline — printing `methodName` + input per step — with no per-method instrumentation.)*

**Provenance vs behavior (added by the DRY review)**
15. **Metadata/provenance may be retained for diagnostics, but MUST NEVER drive compiler behavior.** Behavior derives *only* from structural facts — `fieldName`, `kinds`/`values`, `multiplicity`. Provenance fields (`SlotSource`, the serialized `$variant`, `node-model.json5` itself) are *observability*, read by tooling/diagnostics and never branched on by the pipeline or the emitters. This generalizes three already-decided cuts: the `origin` deletion (Finding 2 — route on `fieldName`), `$variant`-validate-only (§4d), and `node-model`-tooling-only (#10). The test: *"if I deleted this field, would any 1–6 projection change?"* — if yes, it is structural (keep + drive); if no, it is provenance (may keep for diagnostics, must not drive). The retained-but-inert `SlotSource['inferred']` (Finding 5 / C1) is the canonical example.

**Synthesis discipline (added by the critical-review batch)**
16. **Synthesis is permitted only if deterministic AND grammar-visible.** Any new kind/rule the compiler invents is synthesized in **enrich/wire** and emitted into `outRules` / `base.grammar.rules`, so **both compilers** (tree-sitter generate + sittir evaluate) see it and it gets a `kindId` (`project_every_kind_has_kindid_invariant`). **Opaque sittir-only synthesis is forbidden** — no TS-side "virtual" kinds, no `source:'synthesized'` rules that exist only inside the sittir IR (these are exactly what §B/§D below delete: `PolymorphRule`/`VariantRule` inventions, Link's opaque `GroupRule` classifier). Non-deterministic naming or classification is **never guessed** → it becomes a `propose-*` diagnostic + suggested override (§4b / §E). The **only** permitted sittir-side derivation is **projection-naming** — e.g. deriving `storageName` from the single referenced kind (§2). Projection-naming invents no kind and adds no rule; it is a deterministic transform of a fact the grammar already states, so it does not violate this principle. *Test:* "does this create a kind/rule tree-sitter can't see, or guess a non-deterministic fact?" → if yes, forbidden (synthesize-in-wire or diagnose instead); if it only renames an existing grammar fact deterministically, allowed.

**Emission keys on structure, not classification (added by the choice-slot-submethods fold)**
17. **Emission keys on a structural fact, never on a classification tag.** The factory/types/from/wrap surface for a branch is driven by whether it has a **discriminating choice-typed slot** (`slot.values.length > 1`) — a structural property of the slot model — NOT by whether a kind was *classified* "polymorph." Polymorph forms are subsumed: a form IS an arm of a discriminating choice slot. "Polymorph" registration (`variant()` / `polymorphs:`) is **demoted to metadata** that only (a) supplies arm names, (b) marks WHICH slot discriminates when a branch has 0-or->1 candidates, and (c) carries `$variant` validation metadata (validate-only, serialized to node-model) — it **never gates emission**. This is #15 (a classification is provenance, doesn't drive code) + #16 (a structural property does) applied to the emit surface: ~168 branches with a discriminating choice slot get per-arm submethods, not just the 32 registered polymorphs. *Test:* "would deleting the polymorph registration change which branches emit submethods?" → must be **no** (it changes arm *names*, never *whether* submethods emit).

**Names come from tree-sitter; registration is composition (added by the naming/enum/registration unification)**
18. **Token names are tree-sitter's; semantic names are grammar aliases; registration is the composition of existing grammar-visible passes — no new naming map, no new mechanism.** A literal's identifier is its `parser.c` symbol (`anon_sym_*`), or `alias_sym_<name>` when the grammar relabels it — **read, never invented** (so the hand-maintained `TOKEN_NAMES` / `charFallback` / `tokenToName` map is DELETED, §4g; a hardcoded operator table is exactly the opaque assumption #3 forbids). Every literal is therefore a **kind** with a `kindId` (§4g) — `TerminalValue` unifies with `NodeRef` at the naming/dispatch layer. "Registration" is not a monolithic primitive: it is **ELEVATE** (`groups:`/`auto-groups` — synthesize a named kind for a slot, #16) ⊕ **RELABEL** (`alias()`/`variant()` — name the arms, #16), two orthogonal grammar-visible passes (§4h); `polymorphs:`/`enums:` are author sugar that desugar to them. *Test:* "does naming/registration introduce a sittir-only table or a one-off pass?" → must be **no** (it reads parser.c + composes `groups:`/`alias`).

---

## A. The compiler's objective

Given a grammar + overrides, generate a **rendering pipeline**:

- **0. The Model** — an abstract model capturing *everything* needed to generate 1–6.
- **1. Canonical typed representation** of the AST — *goal: maximize compile-time information/validation, intuitive DX.*
- **2. Factories** — serialization-friendly storage of #1 — *goal: runtime validation where compile-time can't (regex/pattern); getter/setter surface matching #1.*
- **3. Coercion functions (`from`)** — developer-friendly surfaces onto the factories — *goal: ergonomic input, type-safe.*
- **4. Wrapping functions** — map Tree-Sitter output → #1 — *goal: retain TS incremental parse / lazy traversal.*
- **5. Transports** — serialize the sittir AST to a native backend — *goal: memory-efficient.*
- **6. Template renderer** — prints the transports — *goal: zero-copy.*

**1–6 are pure projections of #0.** The whole compiler is two responsibilities: *build a complete, canonical #0*, then *project #0 → 1–6*.

### #0 — The Model: four properties

1. **Complete** — carries every fact 1–6 consume (consumer-side completeness). A projection must never have to look past the Model.
2. **Pure** — captured *from and only from* the grammar + overrides; **no hardcoded assumptions, no opaque heuristics.** Deterministic transforms (casing, `'+'`→`plus`) are baked in. **Non-deterministic decisions must be supplied as overrides.**
3. **Deterministic / derive-or-diagnose** — where a fact can't be determined deterministically, the compiler **emits a diagnostic + suggestion** (never guesses); the author applies an override. **Completeness ⇔ no blocking diagnostics.** Each deleted heuristic (`inferFieldNames`, `looksLikePolymorphCandidate`, the distribution guess, `origin` guessing, parameterless fixpoint) *converts* to a diagnostic + suggested override — info isn't lost, it becomes explicit.
4. **Non-lossy** — *every* fact in a rule has a **home** in the Model. **Only sanctioned relaxation:** drop a rule type iff **proven** to have no value to sittir (e.g. `PREC`/`PREC_LEFT/RIGHT/DYNAMIC` — parser-disambiguation, no Model/render meaning). Render-relevant facts are NOT droppable — e.g. `IMMEDIATE_TOKEN` encodes render adjacency (no space); dropping it (as `link.ts` once did to `token.immediate`) is *unproven* and illegal. The test: *"does this rule type carry information any of 1–6 consume?"*

### Diagnostics (cross-cutting)

A **pipeline-wide channel**, not a 7th artifact. Discipline for every phase: **"derive deterministically, or diagnose — never guess."** Seeds landed today: `overrides.suggested.ts`; the unnamed-choice diagnostic; and (branch 029, #38-adjacent) **`diagnoseSlotGrouping`** (`compiler/diagnose-slot-grouping.ts`, Simplify-time, 3 shapes — multi-slot-nested-seq / supertype-list / repeat-choice-with-literal — each carrying a `proposal` string) backed by **`slot-count.ts`** (`countSlots ≡ collectSlots`, pinning the "a slot never contains multiple slots" invariant). This is a working SEED of the §4b/§E `propose-*` channel — though the landed form is a flat `SlotGroupingDiagnostic[]` of proposal strings (NO severity enum yet); the spec's `fail`/`warn`/`info` model is the target it grows into.

Contract: `(grammar + overrides) → Model → {1–6}`, **plus** `→ diagnostics/suggestions` that loop back as overrides.

### `node-model.json5` — serialized Model (diagnostics/tooling only)

A serialized form of the `AssembledNode`s (the Model). **Scope: runtime metadata for diagnostics/validations + internal tooling ONLY** (`probe-kind`, `counts`, the validator, etc.). It is **NOT** a runtime dependency of artifacts 1–6 — those are generated *code* with no json5 dependency and never load it. Serializing the Model to json5 lets tooling validate against the *same* Model the emitters projected from (no Model-vs-tooling divergence). Two audiences for the Model: **emitters** (project → 1–6 at build time) and **tooling** (read the serialized form at tool-runtime); the production runtime touches neither.

**`node-model.json5` obviates `factory-map.json5`.** factory-map's contents (factory-field gating, orphan-promotion) are a *subset* of the Model — so the single serialized Model replaces it. One serialized source, not two (single-source-of-truth applied to the build artifacts themselves).

---

## B. The phases (refined)

Phases stay **distinct** — the sprawl to kill is overlap/conditional-logic *within* phases, not phase count. The defining discipline is the **lossy/non-lossy line** + each phase's single job:

### Shared grammar layer (NOT sittir phases): Enrich + Wire

**Enrich + Wire are injected into the `grammar.js` and run by BOTH compilers that consume it** — they are *not* sittir pipeline phases, and Evaluate does **not** call them:
- **tree-sitter generate** runs the `grammar.js` → the parser.
- **sittir's evaluation** runs the *same* `grammar.js` → the Rule IR.

| Injected step | One job | Effect |
|---|---|---|
| **Enrich** | deterministic transforms on the upstream/stock grammar | `stock grammar.js → enriched` |
| **Wire** | apply overrides + transforms that need the overrides or the evaluated base | `enriched → overridden` |

This shared layer is the **seam that keeps the parser and the IR consistent** (both see the identical enriched/wired grammar). The residual *dsl.js divergence* lives here: both run the same enrich/wire, but the two DSLs' primitives still differ (sittir keeps `optional`; tree-sitter lowers to `choice(x, blank())`). The design must **preserve the shared enrich/wire** and treat primitive divergence as the only gap to handle.

### sittir pipeline phases

| Phase | One job | In → Out | Lossy? |
|---|---|---|---|
| **Evaluate** | execute a `grammar.js` (API-compat with `dsl.js`) — the same one tree-sitter generate consumes, already carrying enrich/wire | `grammar.js` (+ overrides) → Rule IR (TS Rule IR + extensions) | non-lossy |
| **Link** | classify *what each rule is* | Rule IR → classified IR | non-lossy |
| **Normalize** *(was Optimize)* | structural canonicalization, **non-lossy** | classified IR → normalized IR | **non-lossy** |
| **Simplify** | **LOSSY** — reduce rules, throwing out what isn't needed to emit *everything except the renderer* | normalized IR → reduced rules | **lossy (by design)** |
| **Assemble** | build the Model | normalized + reduced → the Model | — |
| **Project** (Emit) | the Model → each of 1–6 | the Model → artifacts | — |
| *Diagnostics* | *cross-cutting — "can't determine" → suggestion* | — | — |

**Key principles:**
1. **Evaluate is the input boundary** — it executes the (enriched/wired) `grammar.js` and produces the Rule IR; it does not itself enrich or wire.
2. **Normalize is non-lossy; Simplify is lossy *by consumer*** — *per Principle #6 (canonical statement); not re-spelled here.* Simplify is a derived projection for artifacts 1–5; it discards render-only detail (literals, adjacency, spacing).
   - **Simplify reduces, then re-applies Normalize transforms (fixpoint).** Throwing out rules re-exposes normalizable shapes (single-member collapse, newly-adjacent leaves, collapsible wrappers). So Normalize's transforms are factored as **shared, idempotent operations** both phases invoke — Normalize to canonicalize the full rule, Simplify to re-canonicalize the reduced result. The re-application is non-lossy; only the reduction is lossy, done once. (Matches today's `inlineRefs`+`simplifyRule` fixpoint + the `deleteWrapper` final re-push, untangled.)
3. **The renderer (#6) reads Normalize's non-lossy output, NEVER Simplify's reduced rules.** This resolves the non-lossy-Model-vs-lossy-Simplify tension (different levels: Model = retained; Simplify = a 1–5 view) AND is the structural fix for the render-on-slot-path breaks (render was mis-fed the reduced view).
4. **Assemble is the sole Model-builder** (keystone) — from the normalized rules (non-lossy, render + completeness) + the simplified rules (slot view for 1–5).
5. **Enrich/Wire are shared, not sequenced.** They live in the `grammar.js` and run in both compilers; there is no Wire↔Evaluate ordering — Wire sees the evaluated base because it runs *during* evaluation.

---

## Open / TODO (next brainstorm steps)

- [x] **Phases confirmed** — Evaluate · Link · Normalize (non-lossy) · Simplify (lossy, by-consumer) · Assemble · Project; Enrich/Wire are the shared grammar layer (run by both compilers).
- [→] **Define the Model's contents** — *delegated to the spec-writer research agent.* It enumerates the per-consumer facts (1→6) grounded in the existing emitters, as a **refinement** of `AssembledNonterminal`/Rule IR — not hand-specified here. Method: work outward from each projection's consumed facts, union into the (class-based) Model, cross-check against #0's non-lossy source-side completeness.
- [ ] **The strangler PR sequence** — proposed order: centralize naming (`_new` → the one rule) → collect-slots uniform derivation (kill distribution/origin) → wrap reads slot → transport → bridge → render → types/factories → (last) phase + Rule-type collapse.
- [ ] **Validation gate per step** — **`pnpm validate:native`** (NOT raw `counts` — it doesn't rebuild the `.node`; see §5 gating); never regress the 2026-05-25 baseline (rust cov 181/186 · 134/136 · ast 125; python 107/110 · 96/115 · ast 74; ts 174/182 · 82/111 · ast 75).
- [x] **Settle Canonicalize's non-lossy mechanism** — *largely DONE:* leaf-attribute push lives in `rule-attrs.ts` (`withAttrsFrom`/`combineMultiplicity`) and the #37 push-down; the collapse-losslessness gap closed via PR-A0 (`c38ffbf1`/`a91927c6`, #36). Remaining: the §B/§C/§G-cut Rule-type cuts.

## References

- This session's findings: field-named-choice fix (python block family +39/+22), the `_new` getters, `origin` unreliability, the `inlineRefs`/distribution interactions, the `_suite`→`block` inline name-loss.
- Memory: `feedback_no_lossy_distillation`, `feedback_emitter_pattern_consistency`, `feedback_ruleid_backpointer`, `project_pr2_merged_and_collectslots_simplification`.
- The glossary agent (running) is documenting the **actual current** phases (`docs/compiler-phase-glossary.md`) — diff against this **ideal** framing once it lands.

---
---

# IMPLEMENTATION SPEC (code-grounded expansion)

> **Authored by the spec-writer research agent, 2026-05-22.** Everything below
> this line makes the brainstorm above concrete and code-grounded. The
> brainstorm sections are the source of truth for *intent*; this section is the
> *how*, citing `file:line`. Where the code contradicts a brainstorm assumption
> it is flagged with **⚠ FLAG**.

## Pre-flight: repo state (verified 2026-05-25, branch `029-slot-grouping-diagnostic`)

**PR3 LANDED** — `ee3d7a0b` "PR3: delete legacy render walker + render-fidelity
fixes + staleness guard (#36)", merged to master 2026-05-24. The legacy render
**walker pipeline** is gone; `AssembledXxx.renderTemplate()` and the
`render-module`/`templates`/`node-map` legacy call sites it cited are deleted.
**PR-A0 (the Normalize losslessness fix) also landed in #36** (`c38ffbf1`
collapseWrappers + canonicalizeSeqOfLeaves; `a91927c6` fanOut + factor
id-preservation), with `withAttrsFrom`/`combineMultiplicity` now living in
`compiler/rule-attrs.ts`. #37 (slot-model multiplicity push-down) and #38
(supertype routing) followed.

**What PR3 did NOT remove (still pending in THIS spec — design intact):**
- **`template-walker.ts` SURVIVES** as a query-helper module — `findRepeatSeparator`
  / `findRepeatFlag` / `findFieldsWithRepeatFlag` remain, imported by
  `node-map.ts` (AssembledBranch) and `collect-slots.ts:50`. Only the walker
  *pipeline* was deleted. (Moving `findRepeatFlag`→`transforms.ts` + deleting the
  rest stays a valid future step — §7.1.)
- **`ClauseRule` + `detectClause` still live** (`detectClause` at `link.ts:2338`,
  + the `'clause'` case arms). PR-M's §C carve-out is correct and still needed.
- The other sittir-invention / content-classification Rule types
  (`PolymorphRule`/`VariantRule`/`EnumRule`/`TerminalRule`, the opaque Group
  classifier) are all **still present** — PR-M/PR-I/PR-P pending.

**Baseline this spec must not regress (deep `read-render-parsePass`; from
`validation-history.jsonl` HEAD + #37/#38; re-confirm with `pnpm validate:native`
at implementation start):**

```
rust:        cov 181/186   read-render-parse 134/136   ast 125
python:      cov 107/110   read-render-parse  96/115   ast  74
typescript:  cov 174/182   read-render-parse  82/111   ast  75
```

---

## §1. Model contents — worked outward from each consumer

The Model's job (#0): carry **every fact 1–6 consume** (consumer-side
completeness) **and every fact a rule states** (source-side completeness). This
section reads each emitter, lists the facts it consumes *today*, then unions
them into the class-based `AssembledNonterminal` + the Rule IR. The key
finding: **almost every fact already has a home** on `AssembledNonterminal`
(`node-map.ts:1476`, **still an interface** — class promotion PENDING),
`NodeOrTerminal` (`node-map.ts:166/193`), or `RuleBase` (`rule.ts`). The pain is
**re-derivation**, not missing fields — three parallel naming derivations
(`name`/`storageName` vs the `_new` getters vs wrap.ts's `SlotModel`) and one
parallel projection type (`SlotModel`, `compiler/slot-model.ts:4`).

### The slot fact inventory (current homes)

`AssembledNonterminal` (`node-map.ts:1476`+; field offsets below are relative to
that block and shift with edits) currently carries:

| Fact | Field | Home today | Note |
|---|---|---|---|
| display name | `name` | `node-map.ts:1544` | LEGACY derivation (`buildSlot`, `collect-slots.ts:304`) |
| property name (camel, plural) | `propertyName` | `:1545` | |
| config key (singular camel) | `configKey` | `:1547` | |
| storage name (TS-facing) | `storageName` | `:1548` | LEGACY — equals `name` today |
| value list | `values: NodeOrTerminal[]` | `:1549` | the value-union; carries per-value multiplicity/separator/immediate |
| param name | `paramName` | `:1550` | |
| trailing/leading separator flags | `hasTrailing`/`hasLeading` | `:1551–1552` | ⚠ also duplicated per-value on `NodeRef`/`TerminalValue` |
| alias / parse-as | slot-level `aliasSources?` (`node-map.ts:1486`) **TODAY** → moves PER-VALUE to `value.parseKind` (end-state) | `{target: source}` today; a kind ref per value in the end-state (§7.3 / §4g). #1 — the alias/parse fact lives on the value, not a slot map |
| provenance | `source` | `:1554` | grammar/override/inlined/enriched/inferred |
| name origin | `origin?` | `node-map.ts:1488` | **⚠ UNRELIABLE + STILL PRESENT** (PR-C pending) — see §1 finding below |
| rule back-pointer(s) | `sourceRuleId?` (in block) **TODAY** → **`sourceRuleIds: RuleId[]`** (FOLD-1) | `feedback_ruleid_backpointer`. Keep **ALL** ids — every renderRule + simplifiedRule position the slot corresponds to — so `slotByRuleId` resolves at whichever view a consumer walks (the render emitter walks `renderRule`; the simplify-vs-render divergence is why a single id missed). §7.6 / §4 |
| storage info | `storageInfo?` | (in block) | boolean/bitflag/kindEnum/verbatim |
| **`_new` single-source naming** | `fieldName?`/`storageNameNew?`/`nameNew?`/`parseNamesNew?` | `node-map.ts:1505-1507`+ | **STILL DIAGNOSTIC SCAFFOLDING — no emitter reads these yet** (Finding-4 pending; only `collect-slots.ts` + `node-map.ts` reference them) |

Per-value facts on `NodeRef` (`node-map.ts:166`) / `TerminalValue` (`:193`):
`multiplicity`, `separator?`, `trailing?`, `leading?`, `immediate?` /
`tokenized?` on terminals (the **non-droppable IMMEDIATE_TOKEN render facts**,
#0.4), plus the end-state per-value kind refs **`kind` (render/source)** +
**`parseKind` (parse-as)** — `TerminalValue.resolvedKind?` (today a kind-name
string, `:196`) becomes `parseKind` (a kind ref, §7.3 / parse-naming
decomposition).

### Consumer 1 — Canonical typed representation (`emitters/types.ts`)

Facts consumed (verified via field-access scan of `types.ts`):
`slot.name`, `slot.configKey` (the dominant key — Config-type field names),
`slot.values` (→ the value union type via `kindsOf`), `slot.source`,
`slot.fieldName`. Cardinality via `isRequired`/`isMultiple`/`isNonEmpty`
(`node-map.ts:236/246/255`, derived from `values`, no stored booleans —
already DRY). Node-level: `node.typeName`, `node.fields`/`node.slots`,
`node.forms` (polymorph — *today*; in the end-state a polymorph is an
`AssembledBranch` with a discriminating choice slot whose `values` arms ARE the
forms, §4f/§H-fold), `node.subtypes` (supertype), `node.isParameterless`.

→ **Model union:** all already homed. `configKey`/`propertyName`/`paramName` are
deterministic functions of the canonical slot name (`snakeToCamel` +
`pluralize`, `node-map.ts:350/359`) — they should be **getters on the class**,
not stored fields, so they cannot drift from the name.

### Consumer 2 — Factories (`emitters/factories.ts`)

Facts: `slot.name`, `slot.configKey`, `slot.values`, `slot.aliasSources`,
`slot.source`, plus shape classification via `classifyFactoryShape` /
`resolveFactoryFieldNames` (`emitters/shared.ts`) and `node.stampExpression` /
`node.isParameterless` (auto-stamp gating, `node-map.ts:1328/1345`).

→ **Model union:** all homed. The factory-field gating predicate
(`resolveFactoryFieldNames`) is the logic `factory-map.json5` serializes — see
§6.

### Consumer 3 — `from` coercion (`emitters/from.ts`)

Facts: `slot.name`, `slot.configKey`, `slot.values`, **`slot.storageKey`**
(`from.ts:859/936` — passed a `storageKey: string`), `node.variantChildKinds`
(`.from()` dispatch), polymorph `forms`. `from.ts` consumes `AssembledGroup`
for synthesized-group projection (glossary Phase 5, `from.ts`).

→ **Model union:** `storageKey` is **`_<storageName>`** — a deterministic
function of the slot name. Today `from.ts` is passed it as a raw string param;
under the class it becomes `slot.storageKey` getter (= `` `_${this.storageName}` ``).
**⚠ FLAG:** `storageKey` exists in TWO places — `slot-model.ts:12`
(`` `_${name}` ``) and the `$children` special case (`slot-model.ts:30`,
`createUnnamedChildrenSlotModel` returns `'$children'`). The `$children`
divergence is the `project_kind_named_slots_session` "final unification"
debt — see §1 finding 3.

### Consumer 4 — Wrap (`emitters/wrap.ts`)

**This is the single biggest re-derivation site.** wrap.ts does NOT consume
`AssembledNonterminal` directly for storage; it maps each slot through a
**parallel `SlotModel` type** (`compiler/slot-model.ts:4`) at `wrap.ts:627` and
`:677`:

```ts
const slot = createNamedSlotModel(f.name, isMultiple(f) ? 'many' : 'one');
```

`SlotModel` re-derives: `name` (copied), `storageKey` (= `` `_${name}` ``),
`arity` (`'one'|'many'`, re-derived from `isMultiple(f)`), `origin`
(`'field'|'kind'`, copied from a separate `createNamed`/`createUnnamedKind`
choice). wrap then reads `slot.arity` (`wrap.ts:371/395/411/534/558/761/809`)
and `slot.storageKey` (`wrap.ts:378/384/390/398/404/524/530/536/538`).

Plus the alias-routing probe `collectConcreteStorageKeys(slot, nodeMap)`
(`wrap.ts:470`, `project_alias_target_routing`) which TODAY keys off
`slot.origin === 'kind'` and inverts `slot.aliasSources` (with the alias loops at
`wrap.ts:648/698`), and `resolveFieldStorageInfo` → `storageInfo`.

→ **Model union:** `arity` = `isMultiple(slot) ? 'many':'one'` (derivable);
`storageKey` = `` `_${storageName}` `` (derivable); `origin` is the
**unreliable** signal (§1 finding 2). **The entire `SlotModel` indirection
should be deleted** — wrap reads `slot.arity` / `slot.storageKey` getters.
**Alias-routing re-points to per-value `value.parseKind`** (the parse-as kind
ref, §7.3) instead of inverting the slot-level `aliasSources` map: the probe
already wants "the CST kind to store under," which is exactly `parseKind` — the
`type_query` dual (real-alias target + validation-only base) is preserved
per-value. (`collectConcreteStorageKeys` + the `wrap.ts:648/698` loops re-point
in PR-C; `deriveAliasSources` deletes.) Highest-value strangler step (§5 PR-D/PR-C).

### Consumer 5 — Transports (`emitters/transport-common.ts`, `transport-projection.ts`, `render-module.ts` transport structs)

Facts (verified): `slot.values` (dominant — the per-slot transport enum is built
from the value union, `transport-projection.ts:106`), `slot.name`, plus
node-level `node.text` (`transport-projection.ts:133/135`),
`node.elementRule` (multi). The per-slot enum work
(`project_universal_per_slot_enums`) keys entirely off `values[].multiplicity`
and `kindsOf(slot)`. Box-at-back-edge (`project_box_at_backedge_pattern`) keys
off SCC over the value-ref graph (`render-module.ts` SCC infra).

→ **Model union:** all homed in `values` + `kindsOf`. **⚠ FLAG (stale-slot
class):** glossary hotspot #4 — transport/render code references slot names
(`type_arguments_repeat1`, `*_optional1`) that **don't survive inlining**. Root
cause is synthesized-helper names (`_<parent>_optional<N>`) leaking into
`values` ref names before `inlineRefs` rewrites them. The Model fix: the slot's
`values` must already hold the *inlined* target kinds (Normalize/Simplify
responsibility), so transports never see the helper name. This is a
**completeness gap that is really a phase-ordering bug** — flagged for §4.

### Consumer 6 — Renderer (`emitters/render-module.ts` + `emitters/templates.ts`)

Two render consumers today (the duplication PR3 deletes):

- **Authoritative `TemplateEmitter`** (`templates.ts`, `runTemplateEmitter`):
  consumes `node.renderRule` (the **non-lossy** RenderRule), walks it with
  `emitRule(rule, ctx)` reading PR0 leaf attributes (`fieldName`,
  `multiplicity`, `separator`) directly off the Rule, and resolves slot
  property names through `EmitCtx.ownerSlots`. **This already matches
  brainstorm #B.3** ("renderer reads Normalize's non-lossy output"): renderRule
  is the wrapper-deleted-but-structure-preserved view, NOT the reduced
  SimplifiedRule.
- **Legacy `render-module.ts` per-slot render** (`render-module.ts:2324`
  calling `renderTemplate()`): consumes `slot.values`, `slot.separator`,
  `slot.name`, `slot.storageName`, `slot.hasTrailing`/`hasLeading`,
  `slot.resolvedKind`, `slot.multiplicity`, `slot.aliasSources`, falling back
  to node-wide `meta.separators` (glossary line 528). **PR3 deletes this
  path.**

→ **Model union:** render-relevant facts the renderer needs that 1–5 do NOT:
**adjacency** (`immediate`/`tokenized` on `TerminalValue`, `node-map.ts:203–204`),
**literal text** of anonymous tokens (kept in `renderRule`, dropped in
`simplifiedRule`), **spacing/separator** (`separator` + flank flags). These are
exactly the "render-only detail (literals, adjacency, spacing)" the brainstorm
#B.2 says Simplify discards — so the renderer must read `renderRule`, which it
already does in the authoritative path. **The Model carries both views**
(renderRule = non-lossy for #6; simplifiedRule = reduced for slots/1–5),
attached per node at `node-map.ts:2609/2618`.

### §1 findings — facts and their homes

**Finding 1 — every consumed fact already has a home.** No consumer needs a
fact with no clean home on `AssembledNonterminal` / `NodeOrTerminal` / `RuleBase`
/ the node classes. The Model is *complete enough today*; the work is
**centralization** (kill the 3 parallel derivations), not adding fields. This
confirms the brainstorm's "refinement, not greenfield" framing (#11).

**Finding 2 — `origin` is a derived-not-authoritative signal that consumers
branch on.** `buildSlot` (`collect-slots.ts:321–322`) **force-stamps
`origin:'kind'` on every positional symbol slot even when it came from a
`field()`** (the `source='inferred'` arm). wrap's `collectConcreteStorageKeys`
(`wrap.ts:497`) keys entirely off `slot.origin === 'kind'`. Per design
principle #3 (pure / no heuristics) and the glossary hotspot #2, `origin` must
be **eliminated**: replace the `origin === 'kind'` branch with a fact derived
from `fieldName === undefined` (the authoritative "this slot has no grammar
field name" signal). `slot-model.ts:8` already warns "consumers should not
branch on this."

**Finding 3 — `$children` → `$other`, a wrap-only bucket (Q4 DECIDED).**
`slot-model.ts:30` (`createUnnamedChildrenSlotModel`) returns
`storageKey:'$children'` while every other slot uses `` `_${name}` ``. Today
this catch-all leaks across the typed/constructed surfaces. The end-state
**narrows it to a parse-time-only bucket** named **`$other`** (alt `$unnamed`)
that exists in **exactly two places**:

1. `emitters/wrap.ts` (#4) — wrap collects parsed children that match no named
   slot into `$other`.
2. its **native rust reader counterpart** (the rust crate twin of wrap).

`$other` is **removed from** `types.ts` / `factories.ts` / `from.ts` /
transports / templates — the typed and constructed surfaces carry **only named
slots** (no catch-all field). Per the completeness principle (#0): a complete
Model slots every child to a named slot, so a **non-empty `$other` at parse time
is a completeness defect → `fail{code:'unslotted-child'}`** (§4b severity model),
and **`$other` NEVER renders** — its content has no typed surface to render off,
which is exactly what keeps the bucket wrap-only and forces the defect to surface
as a diagnostic rather than silently round-trip (JC5). This contains the blast
radius to the wrap/reader path (a paired codegen+rust change *there*, gated on
rust read-render-parse ast count) instead of touching all six surfaces. See §5
PR-D (redesign, not removal).

**Finding 4 — the `_new` naming fields are inert today.** Verified: only
`collect-slots.ts` (writes) and `node-map.ts` (declares) reference
`storageNameNew`/`nameNew`/`parseNamesNew`/`fieldName`. **Zero emitters read
them.** They are pure diagnostic scaffolding (compare-to-legacy). The migration
is to make the `_new` derivation *the* derivation (encapsulated as class
getters) and delete both the legacy `name`/`storageName` fields AND the `_new`
suffixed duplicates. See §2.

**Finding 5 — `SlotSource` usage discovery → RETAIN `'inferred'` as provenance,
re-point only the behavior consumers (C1, per Principle #15).** Discovery (every
`file:line` traced; note `AssembledNonterminal.source` is the SLOT source —
distinct from `RuleSource` on Rule objects):

*Producer (slot `source` is stamped in exactly one place):*
`buildSlot` (`collect-slots.ts:305–358`):
- default: `source = rule.source ?? 'grammar'` (`:305`)
- positional `symbol` arm → `source = 'inferred'` (`:321`)
- positional `supertype` arm → `source = 'inferred'` (`:327`)
- shared-arm-field choice → `source = 'grammar'` (`:346`)
- unnamed choice → `source = rule.source ?? 'inferred'` (`:358`)

So a slot is stamped `'inferred'` **iff it has no `fieldName`** (the positional /
unnamed paths); `'grammar'` / `'override'` / `'enriched'` / `'inlined'` ride
through from the originating rule's own `source` when a `fieldName` IS present.

*Consumers of `slot.source === 'inferred'` — classified BEHAVIOR vs DIAGNOSTIC:*
- **BEHAVIOR (re-point to the `slot.isUnnamed` getter `= fieldName === undefined`, §2 / EmitDRY-4):**
  - `shared.ts:1056` `resolveSingleFieldFactorySlot` — exclude unnamed single slot
  - `shared.ts:1138` factory-mode `'direct'` detection
  - `shared.ts:1173` factory-mode `'spread'` detection
  - `render-module.ts:585/597` partition slots into named vs unnamed / per-variant unnamed children
  - `render-module.ts:656,669` unnamed-slot multiplicity handling
  - `templates.ts:1540` skip unnamed slots in coverage (+ the `link`/`group-lift` `source`-string reads at `templates.ts:1273` stay — those test `rule.source`, a Rule field, not the slot `SlotSource`)
  (line numbers re-verified 2026-05-23; the eight behavior sites read `slot.isUnnamed`, not `source==='inferred'`.)
- **DIAGNOSTIC (keep reading `source`):**
  - `node-model.ts:318` serializes `field.source` (tooling/diagnostics only)
- **NOT a `SlotSource` consumer:** `suggested.ts:250/296` reads a different
  `f.source` (round-trip failure origin), not the slot source.

**Resolution (C1 — reverses the earlier "remove `'inferred'`" decision):** by
Principle #15, `'inferred'` is *provenance* — it is **retained** (serialized at
`node-model.ts:318` for diagnostics) but **must not drive behavior**. So:
- **Producer change:** NONE. `buildSlot`/the `AssembledNonterminal` constructor
  KEEPS stamping `'inferred'` (it is honest provenance: "this slot's name was
  inferred, not authored"). The diagnostic value is real.
- **Consumer change:** re-point only the **behavior** consumers above to
  `slot.fieldName === undefined` (the authoritative structural signal — the same
  dual `origin === 'kind'` encoded, Finding 2). Diagnostic consumers keep reading
  `source`. After this, `'inferred'` is inert-but-retained: deleting it would
  change *no* 1–6 projection (the #15 test), confirming it is pure provenance.

**Other variants:**
- `'grammar'` / `'override'` / `'enriched'` — **KEEP** (genuine provenance;
  `'grammar'` default `collect-slots.ts:305`; `'override'` from
  `transform.ts:595/691/743`; `'enriched'` from `enrich.ts:262`; all serialized +
  surfaced by `suggested.ts`).
- `'inferred'` — **KEEP** (provenance, per above; behavior consumers re-pointed).
- `'inlined'` — **REMOVE (genuinely dead — not even diagnostics data).**
  Discovery: `'inlined'` is *declared* in the slot `source` type
  (`node-map.ts:1554`), on `FieldRule.source` (`rule.ts:207`), and in the
  IncludeFilter default (`link.ts:70`) / `DerivedFieldSource` (`types.ts:394`) —
  but it is **never stamped onto a slot**: the sole slot producer `buildSlot`
  (`collect-slots.ts:305–358`) only ever sets `'inferred'`/`'grammar'` or passes
  `rule.source` through, and no rule reaching a slot carries `source:'inlined'`
  (inlining rewrites the body, it does not tag the surviving leaf). With no
  producer it is not even diagnostics data → remove it from `SlotSource`. (The
  Rule-level `'inlined'` / `DerivedFieldSource` usage is a separate concern, out
  of scope here.)

**Concrete end-state type:**
```ts
type SlotSource = 'grammar' | 'override' | 'enriched' | 'inferred';  // only 'inlined' removed
```
The behavior re-point folds into **PR-C** (the `origin`-elimination PR — both
`origin` and the behavior reads of `source==='inferred'` resolve to
`fieldName === undefined`); the `'inlined'` variant deletion rides along. The
`'inferred'` variant itself **stays** as retained provenance (#15).

**Finding 6 — slot-model multiplicity LANDED in #37 (reconciles the §1/§2 model).**
The intended slot-multiplicity model is now in the repo: **intrinsic single-by-
default** — `combineMultiplicity` returns `undefined` for single (`rule-attrs.ts:69`),
a missing multiplicity defaults to `'single'`. The **`collect-slots` seq-inheritance
band-aid is DELETED** (`collect-slots.ts:288-290`): the `seq` case no longer
propagates `rule.multiplicity ?? inherited` onto members — multiplicity is **always
carried on the group, never distributed onto members**. The **visible vs inlined
group split** landed: authored `groups:` → a **visible, multi-slot** group;
auto-groups (wire `applyAutoGroups`) → an **inlined, single-slot** helper. This
confirms §2's class-getter multiplicity derivation (read the leaf's own
multiplicity; default single) against the shipped model — no design change, just
ground-truth alignment. (`rule-attrs.ts` is the same module PR-A0 centralized
`withAttrsFrom` into.)

---

## §2. `AssembledNonterminal` as a class

Today `AssembledNonterminal` is a plain `interface` / record literal
(`node-map.ts:1476`), constructed by `buildSlot` (`collect-slots.ts:316`) which
stamps ~16 fields including three parallel naming derivations. `AssembledNode`
is **already a class** (`AssembledNodeBase`, `node-map.ts:1281`) with
encapsulated behavior (`isTextTemplate`, `textTemplate`, `hidden` getter,
`stampChildExpression` getter, protected `rule`). Promoting
`AssembledNonterminal` to a class **extends the established pattern** (#11).

### Target class shape (END-STATE)

The Model speaks **one casing: snake_case** (Q1 decision), and **one STORED slot
identity: `storageName`** — `name` survives only as a **getter** over `storageName` (a pure projection with parity to `node.name`; #1 holds — one SOURCE, the getter can't drift). The old *stored* `name` field is what's gone. camelCase
is **never** the identity; it is a projection-time transform (`snakeToCamel`,
applied by the consuming emitter or surfaced via the explicit
`configKey`/`propertyName`/`paramName` accessors). This satisfies principle #3
(deterministic transform baked in, not a stored second identity).

```ts
// compiler/node-map.ts — AssembledNonterminal is a CLASS (parallels AssembledNodeBase)
export class AssembledNonterminal {
  // ---------------------------------------------------------------
  // Stored state — the ONLY non-derived fields. Captured at construction
  // from the wrapper-free Rule node. Everything else is a getter.
  // NOTE: there is NO stored `#refKindNames` and NO slot-level `aliasSources`
  // — the referenced-kind + alias/parse-as facts live PER VALUE on
  // `value.kind` / `value.parseKind` (kind references, §7.3 / §4g). `kinds`
  // and `parseNames` are projections of `values`, not stored lists.
  // ---------------------------------------------------------------
  readonly fieldName?: string;               // the grammar field() name, or undefined
  readonly values: readonly NodeOrTerminal[];// the value union; each value carries `kind` (render/source) + `parseKind` (parse-as), both kind REFS (#4g)
  readonly source: SlotSource;               // see SlotSource below
  readonly sourceRuleIds: readonly RuleId[]; // ALL rule-position ids this slot corresponds to —
                                             // across BOTH the renderRule and simplifiedRule views
                                             // (FOLD-1; was a single `sourceRuleId?`). `slotByRuleId`
                                             // maps EACH id here → this slot (§7.6), so the render emitter
                                             // resolves the slot via the renderRule-position id it walks
                                             // (no lookup-miss → no re-derivation, #9 holds by construction).
  readonly storageInfo?: FieldStorageInfo;   // boolean|bitflag|kindEnum|verbatim

  constructor(init: {
    fieldName?: string;
    values: readonly NodeOrTerminal[];
    source: SlotSource;
    sourceRuleIds: readonly RuleId[];
    storageInfo?: FieldStorageInfo;
  }) {
    this.fieldName = init.fieldName;
    this.values = init.values;
    this.source = init.source;
    this.sourceRuleIds = init.sourceRuleIds; // every renderRule + simplifiedRule position id
    this.storageInfo = init.storageInfo;
  }

  // ---------------------------------------------------------------
  // Naming — ONE derivation (the today-inert `_new` logic, promoted to
  // canonical). `fieldName` wins; else the single **parse-as** kind name
  // (`value.parseKind.name` — implementer-confirmed via PR-A parity: `_suite`→`block`,
  // not `simple_statements`; coincides with the render kind except for aliased/variant);
  // else the SANCTIONED `content` fallback (§4c — warn for ONE per node; 2+ `content`
  // slots on one node = fail{content-collision}).
  // Replaces: legacy buildSlot baseName/origin (collect-slots.ts:304-370), the
  // `_new` suffixed fields (node-map.ts:1505-1507), AND wrap.ts's SlotModel.
  //
  // TWO kind projections of `values` (#4g — every value is a kind ref):
  //   • `kinds`      = render/source kinds  = values.map(v => v.kind.name)
  //   • `parseNames` = parse-as / CST kinds = values.map(v => v.parseKind.name)
  // (They coincide except where a value is aliased / a variant — there the
  //  render kind and the parse-as kind differ; per-value `parseKind` carries
  //  exactly that distinction, replacing the slot-level `aliasSources` map.)
  // The END-STATE has exactly ONE identity: `storageName` (snake_case).
  // ---------------------------------------------------------------
  get storageName(): string {                // snake_case — THE single STORED identity
    if (this.fieldName !== undefined) return this.fieldName;
    if (this.parseNames.length === 1) return this.parseNames[0]!;  // PARSE-AS kind (value.parseKind.name), not render kind — implementer-confirmed (PR-A parity: `_suite`→`block`)
    return 'content';                        // §4c anonymous-content: warn for ONE; 2+ on one node = fail{content-collision}
  }
  get name(): string { return this.storageName; }  // snake_case convenience alias = storageName (parity with node.name); NOT the identity — pure projection (#1/#3)
  get storageKey(): string { return `_${this.storageName}`; } // tree-sitter-facing key; no $children/$other catch-all
  get parseNames(): readonly string[] {      // parser routes by field, else by per-value parse-as kind
    return this.fieldName !== undefined ? [this.fieldName] : dedupe(this.values.map((v) => v.parseKind.name));
  }

  // camelCase projections (NEVER the identity — projection-time only, #3)
  get configKey(): string { return snakeToCamel(this.storageName); }       // singular camel
  get propertyName(): string {                                             // pluralized when multi
    return this.isMultiple ? pluralize(this.configKey) : this.configKey;
  }
  get paramName(): string { return safeParamName(this.propertyName); }

  // ---------------------------------------------------------------
  // Cardinality + flank facts — derived from `values` (already DRY today).
  // ---------------------------------------------------------------
  get isRequired(): boolean { return isRequired(this); }
  get isMultiple(): boolean { return isMultiple(this); }
  get isNonEmpty(): boolean { return isNonEmpty(this); }
  get arity(): 'one' | 'many' { return this.isMultiple ? 'many' : 'one'; }
  get hasTrailing(): boolean { return this.values.some((v) => v.trailing === true); }
  get hasLeading(): boolean { return this.values.some((v) => v.leading === true); }
  get kinds(): readonly string[] { return dedupe(this.values.map((v) => v.kind.name)); } // render/source kinds (CW4)
                                                                 // — `dedupe` = order-preserving dedup (the same `kindsOf`
                                                                 //   does today, node-map.ts:1526 — now reading `v.kind.name`);
                                                                 //   the ONE public surface, replaces shared.ts:124 slotKindNames (EmitDRY-1)
  get isUnnamed(): boolean { return this.fieldName === undefined; }  // the structural "no grammar field name"
                                                                     // signal — behavior consumers read THIS, not
                                                                     // source==='inferred' (Finding 5 / C1 / EmitDRY-4)
}

// Slot provenance (was AssembledNonterminal['source'], node-map.ts:1554).
// PROVENANCE, not behavior (#15): serialized for diagnostics (node-model.ts:318),
// never branched on by the pipeline/emitters. `'inferred'` is RETAINED (Finding 5 /
// C1) — behavior consumers route on `fieldName === undefined` instead, but the
// honest "name was inferred" provenance is kept for tooling. Only `'inlined'` is
// removed (no producer — not even diagnostics data).
export type SlotSource = 'grammar' | 'override' | 'enriched' | 'inferred';

// The visibility test (FOLD-2, §4 visible-kind-reference invariant). A PER-NODE
// predicate (a target kind, not a slot field) — the single authoritative answer
// the render/slot path needs for "do I inline this symbol's body, or keep it a
// slot reference." NOT "lacks a leading `_`" (registered `groups:` are `_`-prefixed
// yet visible via markUserFacing). The render emitter + the slot model read THIS.
isVisibleKind(node): boolean = node.userFacing /* has a real kindId */
                            && !grammar.inline.has(node.kind);  // inverse of inlineRefs-expandable
// Visible → renders as a `{{ slot }}` reference (own template); only an
// inline-listed hidden helper's body is spliced into the parent.
```

**Deleted vs today:** `origin?` / `SlotOrigin` (Finding 2 — consumers route on
`fieldName === undefined`, now via the `isUnnamed` getter); the `_new` suffixed
fields (now the canonical getters); the stored
`propertyName`/`configKey`/`paramName`/`storageName` (now getters, cannot drift);
the `name` field/alias entirely (one identity: `storageName`); the `SlotSource`
variant `'inlined'` only (Finding 5 — `'inferred'` is RETAINED as provenance per
#15); `compiler/slot-model.ts`'s `SlotModel` (`arity`/`storageKey` are getters
here); **the slot-level `aliasSources` map (`node-map.ts:1486`)** — the
alias/parse-as fact moves PER-VALUE to `value.parseKind` (§1 fact inventory / §7.3),
so `deriveAliasSources` (`node-map.ts:908`) + the slot alias-merges
(`collect-slots.ts:251`, `node-map.ts:809/2149`) DELETE; **the stored
`#refKindNames`** (now `kinds` projects `values.map(v => v.kind.name)` on read);
**the free fn `slotKindNames` (`shared.ts:124`)** — a parallel, NON-deduped,
unresolved-including derivation read across factories/from/types/test; callers
re-point to `slot.kinds`, eliminating the divergent-semantics duplicate
(EmitDRY-1).

### What this encapsulation buys (enforces single-source, #1/#11)

1. **The three naming derivations collapse to one.** `storageName` /
   `parseNames` getters = today's `_new` derivation
   (`collect-slots.ts:441–445`), promoted from inert scaffolding to *the*
   source. The legacy `buildSlot` `baseName`/`origin` branch
   (`collect-slots.ts:304–370`) and the `_new` suffixed fields both delete.
2. **wrap.ts's `SlotModel` deletes entirely.** `slot.arity` and
   `slot.storageKey` become class getters; `compiler/slot-model.ts` is removed;
   wrap reads the `AssembledNonterminal` directly.
3. **`origin` deletes** (Finding 2). `collectConcreteStorageKeys`'s
   `origin === 'kind'` test becomes `fieldName === undefined`.
4. **`configKey`/`propertyName`/`paramName`/`storageKey` cannot drift** — they
   are pure functions of `storageName`, computed on read.
5. **Re-derivation becomes impossible** (#11): there is no raw record to
   re-walk; emitters hold an `AssembledNonterminal` and call getters.

### Why the class swap is value-preserving

The getters produce **byte-identical** values to today's stored fields for the
current grammars — the `_new` derivation already matches the legacy one for the
corpus (that is the whole point of the diagnostic scaffolding). The single
identity is `storageName` (snake_case, Q1); emitters that need camelCase call
`snakeToCamel` or read `configKey`/`propertyName` (the projection-time transform,
#3). Migrating the existing `slot.name` reads to `slot.storageName` is mechanical
and value-identical (both were snake_case). *How* and *when* old fields get
removed as each consumer migrates is the implementation plan's concern (the
strangler removes within the superseding step), not part of this clean
end-state.

---

## §3. Module + method organization (principles #13/#14)

> This section gives the conceptual source→module mapping. **§7.1 is the
> authoritative, exhaustive per-module method inventory** (with
> `[UNCHANGED — file:line]` markers); read it for the complete end-state.

### Target layout (one module per phase)

| Phase | Target module | Current source(s) that fold in |
|---|---|---|
| Evaluate | `compiler/evaluate.ts` | `evaluate.ts` (+ `dsl/wire/*`, `dsl/runtime-shapes.ts` stay — they are the shared grammar layer, not a sittir phase) |
| Link | `compiler/link.ts` (REFINED, not renamed — folds in `link-refine.ts` + `field-shape.ts`) | `link.ts`, `link-refine.ts`, `field-shape.ts` |
| Normalize | `compiler/normalize.ts` (rename of `optimize.ts`, non-lossy half) | `optimize.ts` normalization passes (`fanOutSeqChoices`/`factorChoiceBranches`/`dedupeSeqMembers`/`inlineSingleUseHidden`/`collapseWrappers`), `wrapper-deletion.ts` (the leaf-attribute push) |
| Simplify | `compiler/simplify.ts` | `simplify.ts` (already named) |
| Assemble | `compiler/assemble.ts` | `assemble.ts`, `collect-slots.ts`, `node-map.ts` class defs |
| Project (Emit) | `emitters/emit.ts` dispatch → per-artifact `emitters/*.ts` | already structured this way (`emit.ts` exists) |
| **shared transforms** (#13a) | `compiler/transforms.ts` (NEW) | the idempotent ops both Normalize & Simplify call: `collapseSeq`, `canonicalizeSeqOfLeaves`, `inlineRefs`, `deleteWrapper`, `pushAttrsToLeaves` — currently scattered across `simplify.ts` + `wrapper-deletion.ts` |
| **shared rule helpers** (#13c) | `compiler/rule.ts` | already exists (`normalizeEnumMembers`, type guards, `literalTextOf`, `collectFieldNames`, `replaceAtPath`) |
| node behavior (#13, NO shared util) | the `AssembledNode*` classes | `node-map.ts` — already class-based |

### What MOVES (concrete)

- **`collect-slots.ts` → folds into `assemble.ts`** (or stays a sibling of it
  under the Assemble phase). Its `buildSlot` naming logic *deletes* (moves onto
  the `AssembledNonterminal` class, §2). Its tree-walk (`collectSlots` switch on
  `seq`/`choice`/`variant`/`group`/`clause`) stays as the slot-enumeration walk.
- **`compiler/slot-model.ts` → deleted** (its `SlotModel` is replaced by the
  class getters, §2).
- **`template-walker.ts` → walker pipeline already deleted (PR3 #36); the
  surviving query helpers** (`findRepeatSeparator`/`findRepeatFlag`/`findFieldsWithRepeatFlag`,
  imported by `node-map.ts` + `collect-slots.ts:50`) → move `findRepeatFlag` to
  `transforms.ts` or the class + delete the rest (pending step).
- **`wrapper-deletion.ts` → folds into `normalize.ts`** (it is the non-lossy
  leaf-attribute push — Normalize's defining transform).
- **The Normalize/Simplify shared ops** (`collapseSeq`,
  `canonicalizeSeqOfLeaves`, `inlineRefs`, `deleteWrapper`) → `transforms.ts`,
  imported by both `normalize.ts` and `simplify.ts` (#7 — defined once,
  re-applicable).

### Uniform method signature (#14)

Every pipeline method takes `(target, ctx)` and is named
`<operation><ObjectType>`. Map the current code:

| Current | Target signature |
|---|---|
| `simplifyRule(rule, wordMatcher?, inField?)` (`simplify.ts:341`) | `simplifyRule(rule: Rule, ctx: SimplifyCtx)` — `wordMatcher`/`inField` move into `SimplifyCtx` |
| `collapseSeq(rule, wordMatcher?, inField?)` (`simplify.ts:346`) | `collapseSeq(rule: SeqRule, ctx: SimplifyCtx)` |
| `applyWrapperDeletion(rules)` / `deleteWrapper(rule)` | `pushdownWrappers(rule: Rule, ctx: NormalizeCtx)` |
| `inlineRefs(rule, rules, inlineKinds?, visited?)` (`simplify.ts:356`) | `inlineRefs(rule: Rule, ctx)` — `rules`/`inlineKinds`/`visited` in ctx |
| `buildSlot(rule, kindForName, kindEntries, inherited, sep)` (`collect-slots.ts:316`; `baseName`/`origin` arms `:339`/`:341`) | becomes the `AssembledNonterminal` constructor (no longer a free function) |
| `collectSlots(rule, kindForName?, ...)` (`collect-slots.ts:455`) | `collectSlots(rule: Rule, ctx: AssembleCtx)` |

**`NormalizeCtx` / `SimplifyCtx` / `AssembleCtx`** each carry phase-shared state
(the rules map, `inlineKinds`, `wordMatcher`, `kindEntries`) **plus the
diagnostics sink** (the home for #4's derive-or-diagnose; today the
unnamed-choice warner is a module-level mutable global,
`collect-slots.ts:61–68` — that global moves into the ctx). The uniform
`(target, ctx)` shape enables the single trace wrapper benefit (#14 note;
`compiler/trace.ts` already exists as the seed).

---

## §4. The lossy / non-lossy phase split

> This section is the *realization* of **Principle #6** (lossy-by-consumer —
> canonical statement there); it does not re-derive the principle.

### Current reality (verified)

`optimize()` (`optimize.ts`, glossary Phase 3) already produces **three
snapshots**, attached per node in `assemble()`:

1. **RawRule** (`applyNormalizationPasses`) → `node.rule` — consumed by the
   **legacy walker** (deleted by PR3).
2. **RenderRule** (`applyWrapperDeletion`) → `node.renderRule`
   (`node-map.ts:2618`) — consumed by the authoritative `TemplateEmitter`.
   **This is the non-lossy view the renderer reads.**
3. **SimplifiedRule** (`computeSimplifiedRules`, `simplify.ts:331`) →
   `node.simplifiedRule` (`node-map.ts:2609`) — consumed by slot derivation
   (`collectSlots`), factories, wrap, from. **It is a DELETABLE CACHE**
   (JC4): `simplifiedRule = f(renderRule, shared transforms)` — a derived view,
   never an independent source. It can be recomputed from `renderRule` at any
   time; it exists only to avoid re-running the transforms per consumer, and
   therefore cannot drift into a second source of truth.

**The brainstorm's lossy/non-lossy split is ALREADY STRUCTURALLY PRESENT** —
RenderRule (non-lossy, render) vs SimplifiedRule (lossy, slots-for-1–5). The
work is to make the boundary *clean and named*, not to invent it.

### Target realization

- **Normalize = RenderRule production.** Rename `optimize.ts` →
  `normalize.ts`. Its output is the wrapper-free-but-structure-preserved
  RenderRule (`applyWrapperDeletion` folds in here). **Non-lossy** — literals,
  adjacency (`immediate`), separators all preserved. This is the Model's
  retained source and the renderer's (#6) input.
- **Simplify = SimplifiedRule production.** `simplify.ts` already does this.
  It is **lossy by consumer** — it strips render-only detail (anonymous
  delimiters via `collapseSeq`'s string-filter, `simplify.ts:348`) to leave the
  slot structure for 1–5.
- **Simplify reduces, then re-applies Normalize transforms to a fixpoint.**
  The current `computeSimplifiedRules` (`simplify.ts:331`) already does this:
  `simplifyRules` (fixpoint of `inlineRefs` + `simplifyRule`) → per-rule
  `canonicalizeSeqOfLeaves` → `deleteWrapper` (final re-push) → `fuseHeadRepeatLists`.
  The brainstorm #B.2 names exactly this pattern. Realization: extract
  `inlineRefs`, `canonicalizeSeqOfLeaves`, `collapseSeq`, `deleteWrapper` into
  the shared `transforms.ts` (#7) so Normalize and Simplify call the *same*
  idempotent ops. **The reduction (string-filter / inline) is lossy and done
  once; the re-canonicalization is non-lossy.**
- **The renderer reads RenderRule, never SimplifiedRule.** Already true for the
  authoritative `TemplateEmitter` (consumes `node.renderRule`). PR3 deletes the
  legacy `render-module.ts` path that read the reduced/slot view. **This is the
  structural fix for the render-on-slot-path breaks** the brainstorm #B.3 cites.

### The simplify-vs-render lookup divergence (FOLD-1 — the `lookupSlot` correctness fix)

Slots are keyed on the **`simplifiedRule`** position id (that is the view
`collectSlots` walks). But the template emitter (`lookupSlot` / `emitChoice`,
`templates.ts`) walks the **`renderRule`** — and Normalize factors choices
*differently* in the two views (e.g. `factorChoiceBranches` on the render side;
the simplify reduction restructures the slot side). So a `renderRule` position the
template visits has an id that is **not** the id the slot was registered under →
`lookupSlot` / `slotByRuleId` **MISSES** → the emitter falls back to
**re-deriving** the slot name from the arm/symbol — the
`{{ parameter }}`-not-`{{ content }}` symptom. **That re-derivation violates #9**
(emitters read the slot, never re-derive).

**Resolution (two parts, both FOLD-1):**
1. **Register the slot under EVERY position it occupies — `sourceRuleIds`** (§2):
   each slot tracks all its rule-position ids across **both** the `renderRule` and
   `simplifiedRule` views, and `slotByRuleId` maps **each** to the slot (§7.6).
2. **The render emitter resolves at the position it walks** — `lookupSlot` keys
   off the **renderRule-position id** (now in `sourceRuleIds`), so it hits
   **directly**, with NO arm/symbol-name fallback. Registering under the
   renderRule position the template walks IS the fix; the fallback search becomes
   only a safety floor. This makes **#9 hold by construction** — lookup always
   resolves, so the emitter never re-derives.

**Caveat — this is a LOOKUP-correctness fix, NOT an AstMatch lever**
(`project_optimize_id_loss_fix`). The "fix the lookup misses → AstMatch goes up"
thesis was **DISPROVEN**: the divergent class (Class D) was cosmetic
(`{{ parameter }}` vs `{{ content }}` render the same text), **+0 AstMatch**. Fold
it as the #9-correctness fix it is (no re-derivation), not a count-mover. (PR-A's
naming probe is unaffected — that is about *naming* derivation, not slot
*lookup*.) **Sequencing:** PR-B owns `sourceRuleIds` (the class/slot-model field +
`slotByRuleId` mapping each id); PR-E (render reads the class) makes the render
emitter resolve via the renderRule-position id.

### The visible-kind-reference invariant (FOLD-2 — the visibility predicate)

> Integrates `docs/superpowers/handoffs/2026-05-26-029-visible-kind-rendering-foldin.md`.
> Same root as the FOLD-1 `lookupSlot` divergence (a symbol ref resolving to the
> wrong slot); the two folds are one fix driven by one authoritative source.

**Invariant:** a symbol that resolves to a **VISIBLE kind** (its own `kindId`, its
own node, rendered as its own template — *including* registered `groups:`, which
are `_`-prefixed yet visible via `markUserFacing`) **must stay a slot REFERENCE in
any parent's render body — its body is NEVER inlined.** Inlining is **only** for
pure hidden helpers: exactly the kinds `grammar.inline` lists / `inlineRefs` may
expand. A visible kind renders as `{{ <its slot name> }}`, recursing into its own
template; only a hidden helper's body is spliced into the parent.

**The visibility predicate is NOT "lacks a leading `_`".** Registered `groups:`
are `_`-prefixed *and* visible (`markUserFacing` flags them). The correct,
authoritative test:

> **visible ⇔ user-facing / has a real `kindId` / NOT in `grammar.inline`** —
> the **inverse of `inlineRefs`-expandable.**

This is **the single authoritative visibility test the render + slot path needs**,
from the **same authoritative source the `_new` naming derivation provides**
(PR-A/PR-B): once the slot model answers "is this target visible, and what is its
slot name," both the inline decision and the slot-reference name are determined —
no emitter improvises either. (Cross-ref: §1/§2 slot model carries the
`isVisibleKind` test; §4h ELEVATE creates visible kinds, which therefore render as
references; §5 PR-E deletes the two band-aids this invariant subsumes.)

> **Baseline note.** The two band-aids (PR-E) and their source groups
> (`type_arguments`/`type_parameters`, 029 `fc7c77de`) are on **029, not
> `origin/master`**. If carried into the implementation base, the handoff measured
> **rust cov 182/186 · ast 126** (cov +1, ast +1 over the master headline; py/ts
> unchanged); otherwise the origin/master baseline holds. Confirm with a fresh
> `pnpm validate:native` at implementation start. (Headline baseline at line 5 is
> left master-accurate per this caveat.)

**Corollary — the emitter rebuilds must handle the group-list slot shape
(generated-code-cleanup acceptance criteria).** Promoting a repeated unit to a
visible group makes the **parent slot a non-empty list of the group kind**
(`nonEmptyArray` of `_<group>`, e.g. `type_arguments` → `_type_argument`). The
emitter rebuilds (#3 `from`, #4 `wrap`, #6 render, the generated-test emitter)
**MUST** handle this shape — **branch on the slot's `multiplicity`, key on its
`storageName` (NOT `$children`)**, reading the slot model's multiplicity +
`isVisibleKind` facts. A correctly-built pure projection (#9) handles it *by
construction*; the four sites flagged in `docs/superpowers/specs/2026-05-26-generated-code-cleanup-design.md`
are latent emitter defects (verified non-regressing on 029, not exercised by the
corpus today) that a correctly-rebuilt emitter eliminates. **These are folded as
per-PR ACCEPTANCE CRITERIA on the emitters that already rebuild each surface — NOT
new PRs:** wrap-`$with` → PR-D, `from` reconstruction + the generated-test → PR-F,
the deprecated-`bridge.rs` render path → PR-E's deprecated-path sunset. See that
spec for the detailed per-site shape. (Gate: native counts hold-or-improve per the
baseline caveat above — no new baseline.)

### Losslessness audit (verified — verdict + the one real violation)

Principle #2 ("complete & non-lossy") was **asserted** above; this audit
**verifies** it against the code and finds **one real Normalize violation** that
the fix-PR below closes (so #2 is enforced, not just claimed).

- **Simplify = lossless modulo literal-removal — HOLDS.** Verified:
  `collapseSeq` filters *only* anonymous non-keyword literals (`simplify.ts:983`);
  every other arm threads `withAttrsFrom` (carrying `fieldName`/`multiplicity`/
  `separator`/`id`); and the renderer reads `renderRule` (non-lossy), so the
  literal removal never reaches #6. The intentional loss is exactly the
  by-consumer reduction Principle #6 sanctions — nothing unintended escapes.
- **`token.immediate` drop — CONFIRMED FIXED.** `wrapper-deletion.ts:160-164`
  preserves the token node, so the `project_preserve_token_wrappers` bug (link
  once dropped `token.immediate`, an illegal render-fact loss per #0.4) is gone.
- **Normalize = fully lossless — the `collapseWrappers` violation is CLOSED
  (PR-A0, shipped #36).** The single-member-collapse arms (`collapseWrappers`,
  `optimize.ts:618-…` `seq([X])`/`choice([X])` + the wrapper-fold arms) once
  dropped the discarded node's `id`/`separator` with no `withAttrsFrom` — the
  exact omission `collapseSeq`/`fanOutSeqChoices`/`factorChoiceBranches` were
  patched to avoid. **Fixed in `c38ffbf1`** (collapseWrappers +
  `canonicalizeSeqOfLeaves` now thread `withAttrsFrom`) **+ `a91927c6`** (fanOut +
  factor preserve rule ids), with the shared `withAttrsFrom`/`combineMultiplicity`
  now centralized in `compiler/rule-attrs.ts`. So Normalize is **genuinely
  lossless today** — #2 enforced, not just asserted. (Was an open VIOLATION in the
  pre-#36 spec; now historical.)
- **`canonicalizeSeqOfLeaves`** shared the pattern and was fixed in the same
  `c38ffbf1` for parity + defense.

**Status: DONE (PR-A0 shipped in #36).** The fix gave `collapseWrappers`'s
`seq`/`choice`/wrapper-fold arms (and `canonicalizeSeqOfLeaves`) the
`withAttrsFrom(rule, survivor)` treatment (parity with `collapseSeq`,
`simplify.ts:945`) so `id`/`separator` survive single-member collapse. The
sequencing constraint ("land before any emitter reads `slotByRuleId`") is
satisfied — it shipped with PR3 itself, ahead of the pending emitter-migration
PRs.

### ⚠ FLAG — `node.rule` (RawRule) is still the generic `R` consumed by node getters

PR3 (#36) deleted the legacy render *walker* + the `renderTemplate()` methods, so
the walker no longer reads raw `rule`. But `node.rule` is still the generic `R`
stored on every `AssembledNodeBase` (protected) and read by
`isTextTemplate`/`members`/`separator` getters. **Deleting the RawRule snapshot
entirely still requires auditing those getters to read `renderRule` instead** —
it was NOT part of PR3's walker deletion. Remains a follow-up, not assumed done.

---

## §4b. Diagnostics — severity model + the Assemble→Project gate (Q3 DECIDED)

Principle #4 ("derive-or-diagnose; never guess") is a **hard gate**, not advice.
A fact the compiler cannot derive deterministically emits a **fail-level**
diagnostic; if any fail-level diagnostic survives to the end of Assemble,
**Project (Emit) is halted** — no incomplete Model is ever projected to 1–6.
This is grammar-agnostic: it holds for every kind in every grammar.

> **Landed seed (branch 029).** `diagnoseSlotGrouping` (`compiler/diagnose-slot-grouping.ts`)
> is a working Simplify-time precursor: it emits a flat `SlotGroupingDiagnostic[]`
> for 3 shapes — ① multi-slot-nested-seq, ② supertype-list, ③ repeat-choice-with-literal
> — each with a `proposal` string, backed by `slot-count.ts` (`countSlots ≡
> collectSlots`, enforcing "a slot never contains slots"). **It has proposal
> strings but NO severity enum yet** — the `DiagnosticSeverity` model below is the
> target it grows into (proposal-string → `Diagnostic.suggestion`; the 3 shapes →
> `propose-*` codes). **#38's `transforms: { '(_type)': field('type') }`
> (`packages/rust/overrides.ts:591`) is the IMPLEMENTED form of shape ②** — the
> author applying the supertype-list proposal as a real override. So the
> diagnose→suggest→override loop is already demonstrated end-to-end for one shape.

### Severity model (END-STATE types — NEW)

```ts
// compiler/diagnostics.ts (NEW)
export type DiagnosticSeverity = 'fail' | 'warn' | 'info';

export interface Diagnostic {
  readonly severity: DiagnosticSeverity;
  readonly code: string;          // stable machine code. The propose-* class (§E): 'propose-top-level-rule' (info/warn),
                                  //   'propose-discriminator' (info/warn — §H-fold),
                                  //   'propose-field' (fail when ambiguous+needed, else warn), 'propose-polymorph' (fail).
                                  //   Plus: 'arm-name-collision' (fail — §4f), 'unslotted-child' (fail),
                                  //   'anonymous-content' (warn), 'no-variant-resolution' (fail).
                                  //   ('propose-arm-name' DELETED — parser.c names every token cleanly, §4g.)
  readonly kind?: string;         // owning grammar kind, when known
  readonly ruleId?: RuleId;       // owning rule-tree position (provenance)
  readonly message: string;       // human text
  readonly suggestion?: string;   // a ready-to-paste overrides.ts snippet (seeds overrides.suggested.ts)
}

// The sink carried on every phase context (§3). Replaces the module-level
// unnamed-choice warner global (collect-slots.ts:61-68).
export class DiagnosticSink {
  private readonly items: Diagnostic[] = [];
  emit(d: Diagnostic): void { this.items.push(d); }
  fail(d: Omit<Diagnostic, 'severity'>): void { this.emit({ ...d, severity: 'fail' }); }
  warn(d: Omit<Diagnostic, 'severity'>): void { this.emit({ ...d, severity: 'warn' }); }
  info(d: Omit<Diagnostic, 'severity'>): void { this.emit({ ...d, severity: 'info' }); }
  all(): readonly Diagnostic[] { return this.items; }
  hasBlocking(): boolean { return this.items.some((d) => d.severity === 'fail'); }
}
```

- **`fail`** — the Model is incomplete (a non-deterministic fact had no
  override). Halts Project. Each maps to a suggested override.
- **`warn`** — surfaces a likely-wrong shape that is still emittable
  (non-blocking).
- **`info`** — provenance / observability only.

### The gate (END-STATE — NEW)

```ts
// compiler/emit-gate.ts (NEW) — the single Assemble→Project boundary check.
export function assertEmittable(nodeMap: NodeMap, diagnostics: DiagnosticSink): void {
  if (diagnostics.hasBlocking()) {
    const blocking = diagnostics.all().filter((d) => d.severity === 'fail');
    throw new EmitHaltedError(blocking);   // prints message + suggestion per item
  }
}
```

Called exactly once, by the pipeline driver (`compiler/generate.ts`), **after
`assemble()` returns and before any `emitters/*` runs.** It is the structural
realization of "Completeness ⇔ no blocking diagnostics" (#0.3).

### Heuristics → the `propose-*` diagnostic class (§E)

Every guessing heuristic converts to a `propose-*` diagnostic carrying a
ready-to-paste override snippet (`Diagnostic.suggestion`), never a silent guess.
The vocabulary has **no `source:'synthesized'`** (forbidden by #16); `'inferred'`
stays serialized for diagnostics only (#15), correlating with where
`propose-field` fires but never driving behavior. The `propose-*` codes:

- **`propose-top-level-rule`** (info/warn) — a wire-synthesized auto-group
  (`_<parent>_optionalN` / `_repeatN`) has no author-meaningful name. Non-blocking:
  the helper is grammar-visible (§D) and renders fine; the diagnostic suggests a
  `groups:` override to give it a real top-level name.
- **`propose-field`** (**fail** when the name is ambiguous *and* needed; else
  warn) — a positional symbol slot that is **not deterministically
  field-nameable**: the direct+repeat-mix residue (§F) + the dropped
  `inferFieldNames` guess. Suggests a `field('<name>', …)` override.
- **`propose-polymorph`** (**fail**) — a heterogeneous-field `choice` is a
  candidate to *be* a discriminating choice slot with no `variant()` /
  `polymorphs:` declared (was `looksLikePolymorphCandidate` / the
  `evaluate.ts:330` retype). Suggests a `polymorphs:` override. (Replaces the
  deleted §B retype + the link heuristic.)
- **`propose-discriminator`** (info/warn — §H-fold) — a branch has **0 or >1
  candidate** discriminating choice slots, so the compiler cannot deterministically
  pick which slot drives per-arm submethods (the default is "the single required
  choice slot"). Non-blocking: the branch keeps emitting plain union slots until
  the author marks WHICH slot discriminates (`variant()` / `polymorphs:` selects
  it). Deterministic, no guess — the diagnostic suggests the marker. A branch with
  exactly one required choice slot needs no diagnostic (the default fires).
- **`propose-distinct-alias`** (**fail** — §4d.1) — a slot's `parseKind` is
  **non-injective**: 2+ structurally-distinct `value.kind` aliased to one CST name
  (e.g. python `_suite.block ← {_simple_statements, block, _newline}`), so child-kind
  dispatch can't disambiguate and runtime structural recovery is forbidden (§4d).
  Suggests distinct `variant()`/`alias()` names per arm to restore injectivity.
  (Structurally-identical collisions MERGE with no diagnostic; only genuinely-distinct
  structures fail — ~5 cases corpus-wide.)

> **`propose-arm-name` DELETED (§4g/§4f rewrite).** The earlier draft surfaced
> `tok_*` `charFallback` operator names as an optional DX nudge. With arm names now
> read from tree-sitter (`parser.c` `anon_sym_*` / grammar `alias_sym_<name>`,
> §4g), every token already has a clean name — there is nothing ugly to propose
> against. The code is removed.

And one new `fail` (a hard error only on a true collision):
- **`arm-name-collision`** → `fail{arm-name-collision}` (§4f) — two **distinct**
  arms (POST logical-identity dedup) resolve to the same identifier. Suggests a
  `variant()` / `polymorphs:` override to disambiguate. **Replaces the deleted
  `form_<index>` positional fallback** (`link.ts:684`) — the one non-deterministic
  naming path; instead of silently numbering, a real collision halts with a
  fixable suggestion. (Grounded: **0 today** — dedup-first makes apparent dupes
  fold to one arm.)

Plus the two non-`propose` slot diagnostics already specced:
- **`content` slot** → `warn{anonymous-content}`, a **sanctioned non-fail** path
  for genuinely-anonymous structural content (§4c — the C3 reconciliation; an
  earlier draft's blanket `fail{unnamed-slot}` was proven wrong by discovery).
  **But 2+ `content` slots on the SAME node → `fail{content-collision}`** — two
  slots cannot share the `_content` storage key, so the node can't be emitted
  unambiguously; the author must `field()`-name at least one. (This is the PR-A
  naming call — the parity check needs it to define a correct `storageName`.)
- **unslotted child** → `fail{unslotted-child}` — a non-empty wrap-only `$other`
  bucket (JC5); `$other` never renders, so the defect surfaces here. (Distinct
  from a `content` slot, which IS a real named slot that renders — §4c.)
- **polymorph dispatch** non-resolution → `fail{no-variant-resolution}` (§4d).

**Why `propose-field` is the load-bearing cliff (and §F shrinks it).** The
positional-symbol naming guess is the heuristic with the most occurrences. §F
(enrich-widening) deterministically names the easy cases, leaving only the
genuinely-ambiguous residue as `propose-field` FAIL — see §F + the QUANTIFY note
below for the concrete count.

### §4c. The `content` slot is sanctioned, not a fail (C3 DECIDED)

**Discovery (cited — current committed `node-model.json5`):** `content` slots
exist today and **render + round-trip**: **rust 13, ts 20, python 16 (49 total)**.
Examples (all `modelType: branch`/`group`, all rendered via `{{ content }}`):
- rust: `bracketed_type`, `else_clause`, `generic_pattern`, `type_arguments`,
  `string_literal`, `comment`, `reference_expression`, the
  `_attributed_*`/`_type_*_repeat1` helpers, `_visibility_modifier_pub_parens`.
- ts: `object_type`, `class_body`, `decorator`, `rest_pattern`, `literal_type`,
  `template_string`/`template_literal_type`/`template_type`, `type_query`,
  `asserts`, `for_in_statement`, `_for_header`, `_lhs_expression`, …
- python: `parenthesized_expression`, `case_pattern`/`complex_pattern`/
  `splat_pattern`/`list_splat_pattern`/`dictionary_splat_pattern`,
  `except_clause`, `format_specifier`, `string`/`string_content`, `type`,
  `typed_parameter`, `_match_block`, `_comprehension_clauses`, …

**Assessment:** these split into two classes.
1. **Genuinely-anonymous structural content** — a node whose body is an
   unnamed union/sequence with no meaningful field name to assign
   (`object_type`'s `{ … }` members, `parenthesized_expression`'s inner expr,
   `bracketed_type`'s `[T]`, `class_body`'s members). Tree-sitter gives these no
   field; the grammar author has no natural name; forcing a `field()` override
   would invent a fiction. These are **irreducible** — answer (b) in the review's
   framing is real.
2. **Inference-gap content** — a node where a field name DOES exist conceptually
   but the heuristic failed to assign it (a subset of the `inferFieldNames`
   cases). These ARE field-nameable via override.

**Reconciliation (the end-state rule):** the `'content'` storage name is a
**sanctioned, deterministic outcome** — a choice/seq body with no `fieldName`
and no shared-arm field name resolves to ONE slot named `content`. It is a real
named slot: it renders (`{{ content }}`), stores at `_content`, and round-trips.
A **single** `content` slot per node is **NOT** a `fail`. Two `fail` cases are
reserved: (1) a slot whose `kinds`/`values` are empty or contradictory (nothing
to render) — `fail{code:'empty-slot'}`; (2) **2+ `content` slots on the SAME node
— `fail{code:'content-collision'}`** — they would share the `_content` storage
key (an unemittable ambiguity), so the author must `field()`-name at least one.
A lone `content` slot stays sanctioned (warn). *(This is the call PR-A must make:
without deciding the `content`-collision boundary, the storageName parity check
is undefined for the multi-`content` case.)*

**Distinguishing it from the deleted heuristic:** what is removed is the
*guess* — `inferFieldNames`'s "≥5 refs / ≥80% agreement → fabricate a name."
What is kept is the *deterministic* `content` fallback (no guessing: an unnamed
structural union deterministically yields a `content` slot). So `content` is
fully consistent with Principle #3 (pure, no heuristics) — it is a fixed rule,
not an inference.

**Diagnostic, not fail:** each `content` slot emits `warn{code:'anonymous-content'}`
(non-blocking) carrying a suggested `field('<name>', …)` override, so an author
*may* name it for nicer DX — but absence of a name is not an error. This makes
the **PR-L risk concrete**: PR-L does NOT need to field-name all 49 `content`
slots (most are class-1 irreducible); it only converts the `inferFieldNames`
*guess* to a suggestion. The pass-rate gate holds because `content` slots keep
rendering exactly as today.

> **No fail-cliff.** The earlier §4b draft's `fail{unnamed-slot}` on any
> `'content'` fallback would have blocked emit for all 49 current slots — a hard
> regression. C3 corrects this: `content` is sanctioned + warned, never failed.

### §4d. Child-kind dispatch on the discriminating choice slot's arm; `$variant` is diagnostics-only (Q5 + §H-fold)

Dispatch keys on a **structural fact** (#17), not "is-polymorph": a branch with a
**discriminating choice slot** dispatches on the **concrete arm** of that slot.
A compile-time "no arm matched" must **never** happen. The resolver
(`project_polymorph_dispatcher_slot_probe`, generalized to *any* discriminating
choice slot) keys on the slot's `values` arms:
- **kind-arm** (a `NodeRef` value) → match `$type === armKind` (delegate to the
  arm-kind's factory).
- **literal-arm** (a `TerminalValue` value) → match the literal value (pin it).

Given a branch and a concrete parse, **exactly one arm resolves**. If none does,
that is a Model-completeness defect → **`fail{code:'no-variant-resolution'}`,
halt** (not a runtime warning). Polymorph forms are subsumed — a form is just a
kind-arm of the discriminating slot, so the *same* resolver covers the 168
discriminating-slot branches, not only the 32 registered polymorphs.

**Totality requires identical-ARM collapse first (C2, generalized).** Arm-presence
dispatch cannot disambiguate two arms with the *same* observable signature. The
resolution: **identical-signature arms collapse to one arm** — redundant by
construction (same observable shape), nothing to disambiguate, nothing to `fail`
on. Collapse rule: group the discriminating slot's arms by their structural
signature (for a kind-arm, the arm-kind's field-`storageName` set + children
count — the key `factory-map.ts:170` already computes; for a literal-arm, the
literal value); each group becomes ONE arm. After collapse every surviving arm
has a distinct signature ⇒ arm dispatch is total. Collapsing is part of the
**general choice-slot-submethods PR** (§5), upstream of the resolver.

> **Discovery (cited):** in the *current committed* `node-model.json5`, the
> identical-signature count is **0 across all 3 grammars** (verified by grouping
> each polymorph's `forms[].fields[].name` + `children.length`). The cited ts
> `primary_type` is today a **`supertype`** (0 forms), so the nonsense-variants
> were already eliminated upstream. So the collapse is
> **defensive/total-by-construction** for the current corpus but remains a
> required invariant: the resolver MUST collapse-then-dispatch so a future
> grammar that reintroduces identical arms cannot produce a spurious `fail`. The
> PR adds the collapse + an assertion that no discriminating slot retains a
> duplicate-signature arm post-collapse.

Consequence for the shipped artifacts: **no stored `$variant` discriminant
ships in 1–6.** The runtime routes on the **concrete child kind** — wrap reads the
CST node's `$type` (or the literal value); factory/`from` select an arm explicitly via the
per-arm submethods (§factory-fold below); render dispatches on `$type`. **This is
deterministic child-kind routing, NOT runtime structural recovery** — no
structure-walking and no slot-presence probe at read time. `$variant` is **diagnostics/validate-only** (the same scope discipline
as `node-model.json5`, #10): it may appear in the serialized Model and the
validator's dispatch map, never in generated `types.ts` / `factories.ts` /
`from.ts` / `wrap.ts` / transports / templates.

> **Dispatch is by child kind ONLY — no runtime structural recovery (clarified 2026-05-26).**
> The polymorph construction already recovers the arm from the child's concrete kind
> (`$type`) alone — distinct `variant()` aliases make every arm a distinct CST kind, so
> the reader routes on the kind it reads. The slot model's "structural fact" (#17) is the
> **compile-time** property of *which slot discriminates*; it is **not** a license to walk
> structure at read time. The **one gap** child-kind dispatch cannot close is a
> **non-injective `parseKind`** — a tree-sitter shared `alias()` collapsing 2+ distinct
> logical kinds onto one CST kind name, so `$type` no longer disambiguates. That case is
> detected and **resolved-or-diagnosed at CODEGEN** by the **non-injective-`parseKind` pass**
> (§4d.1 below; `block`/`_suite` is the discovered example), **never** recovered at runtime. This **supersedes** any runtime
> slot-presence probe (`project_polymorph_dispatcher_slot_probe` → codegen-time).

### §4d.1. The non-injective-`parseKind` pass (shared-alias gap — codegen-time, merge-or-diagnose)

tree-sitter `alias()` is many-to-one: a `choice` can alias 2+ structurally distinct
rules to one named kind. Discovered case: python `_suite =
choice(alias($._simple_statements, $.block), seq($._indent, $.block), alias($._newline, $.block))`
→ CST kind `block` ← `{_simple_statements, block, _newline}`. The per-value `parseKind`
is then **non-injective** — multiple distinct `value.kind` share one `parseKind.name` —
so child-kind dispatch (§4d) cannot disambiguate. (Per-value `parseKind` from PR-B/PR-C
preserves the full value-set; the old slot-level `aliasSources: Record<target→source>`
clobbered it to one source — that loss disappears with PR-C.)

**Where:** a pass in `node-map.ts` after the slot `values` are populated (where
`parseNames` is projected). **Detection:** group a slot's `values` by `parseKind.name`;
a bucket with ≥2 entries whose `value.kind.name` differ is non-injective.

**Resolution — exactly two outcomes (no runtime structural recovery, no resolution tables):**
1. **MERGE** — if the colliding sources are structurally identical (bare keyword/literal
   relabels `alias(STRING, X)` / `alias(choice(literals), X)`, or identical lexer-fragment
   rules), they are legitimately ONE kind: collapse the bucket to a single value, no
   diagnostic. (Clears the ~12 trivial relabels — the bulk of the inventory.)
2. **DIAGNOSE** — otherwise (genuinely distinct structures) → **`propose-distinct-alias`**
   (`fail`): the grammar collapsed distinguishable kinds onto one CST name with no read-time
   way back. The fix is the existing `variant()`/`overrides.ts` pattern — give each arm a
   distinct alias (`block_simple`/`block_compound`/`block_empty`), restoring an injective
   `parseKind`. **No "resolution table" / sub-discriminator routing** — that would
   reintroduce read-time structural inspection (rejected, §4d).

**Inventory (genuine slot-level collisions = the actionable set):** python 1
(`_suite.block`), rust 1 (`scoped_type_identifier.path ← {generic_type,
generic_type_with_turbofish}`), typescript ~3 (`type_predicate.name`, string-fragment,
`_jsx_identifier`); ~12 further buckets are trivial relabels that MERGE. So the
diagnose-and-author-override burden is ~5 cases total.

### ⚠ FLAG — dispatch is total ONLY after identical-arm collapse

A discriminating choice slot's `values` arms are the dispatch metadata (the
resolver reads them). The end-state removes `$variant` from the *emitted* code
surfaces but keeps the arm metadata. **Dispatch is total ONLY after
identical-signature arms collapse** (C2 above) — the collapse + the resolver +
`$variant` removal are all **PR-I** (the general choice-slot path, §4f), which
depends on **PR-M** (the `AssembledPolymorph`→`AssembledBranch` collapse). See §5.

> **Blast-radius note (verified).** `$variant` ships *heavily* in current
> generated code (e.g. typescript `types.ts` ~25 occurrences, `factories.ts`
> ~70; also `from.ts` / `wrap.ts` across all 3 grammars). Removing it from the
> shipped surfaces (**PR-I**) is a substantial, validate-gated change — the
> general structural resolver must reproduce every dispatch decision the stored
> discriminant currently makes, with `fail` (not silent fallthrough) on any
> non-resolution.

### §4e. enrich-widening shrinks the `propose-field` residue (§F)

Today field-name promotion is conservative. **§F widens enrich's
symbol-to-field promotion to ALL unambiguous single-occurrence positional
symbols** — now LR-safe because the landed `syntheticInline` `_kw_*` auto-inline
(wire) keeps the parser table stable when a bare symbol is wrapped in `field()`.
This deterministically names the easy cases, so they never reach `propose-field`.

**Discovery — the inferred-slot population + the residue (cited, current
committed `node-model.json5`):**
- Total slots with `source:'inferred'` (positional, no grammar field name):
  **rust 95, ts 87, python 61 — 243 total** (matches the brief's "~243").
- **Direct+repeat-mix residue** (the `propose-field` FAIL candidates — a node
  with both a single and a repeated positional slot over the *same* referenced
  kind, which cannot be deterministically named): **0 observable in the current
  committed model** across all 3 grammars.

**⚠ The "0" is a measurement artifact, not an absence of risk — and this is the
real tension.** `mergeSlotsByName` (`node-map.ts:799`) collapses same-named slots
*before* serialization, so any latent ambiguity is hidden in the emitted
`node-model.json5`. The honest characterization:
- **Pure-direct duplicates** (multiple single positional slots of the same kind)
  → deterministically **numberable** (`name`, `name2`, …) — kept as
  projection-naming (#16-allowed), no diagnostic.
- **Direct+repeat-mix** (one singular + one array of the same kind in one node)
  → genuinely ambiguous (which occurrence is the scalar?) → `propose-field`
  **FAIL**. The count is **not extractable from the post-merge model** because
  the merge already folded them; it must be measured **pre-merge** during PR-L by
  instrumenting `collectSlots` before `mergeSlotsByName` runs.
- **PR-L gate (concrete):** PR-L instruments the pre-merge slot stream to count
  direct+repeat-mix occurrences per grammar, authors the `field()` overrides that
  resolve each, confirms count→0, *then* flips `propose-field` to FAIL. The
  "author overrides first" discipline (§5 PR-L) covers exactly this residue.
  Until that pre-merge instrumentation runs, the residue count is **unknown but
  bounded above by 243** (the inferred population) and almost certainly small
  (the corpus shows 0 *surviving* mixes, i.e. authors/heuristics already resolved
  them — PR-L makes that resolution explicit + deterministic).

### §4f. The general choice-slot → factory-submethods model (§H-fold)

Emission keys on a **structural fact** (#17): an `AssembledBranch` with a
**discriminating choice-typed slot** (`slot.values.length > 1`) emits **per-arm
submethods** `branch.<armName>(...remaining slots)` that pin the discriminating
slot to that arm. This is keyed on the slot's structure, **not** on "is-polymorph"
— polymorph forms are subsumed (a form = an arm). **Scope: 168 branches** across
the 3 grammars (rust 54 / ts 73 / python 41 — measured), vs the 32 registered
polymorphs (rust 19 / ts 10 / python 3) today. The intended API expansion to all
168 is confirmed.

**Arm kinds (from the slot's `values`) — both are KINDS (§4g):**
- **kind-arm** (a `NodeRef`) — the submethod delegates to the arm-kind's factory.
- **literal-arm** (a `TerminalValue`) — ALSO a kind-ref (its `resolvedKind`, §4g);
  the submethod pins the literal value (render text survives on `TerminalValue.value`,
  #0.4). New surface, e.g. `binary_expression.equal()` pinning `==` (kind name
  from parser.c / a grammar alias).

**Discriminating-slot mechanism (deterministic, no guess).** Default: the
**single required choice slot** on a branch is the discriminating slot and gets
submethods. If a branch has **0 or >1** candidate required choice slots → emit a
**`propose-discriminator`** diagnostic (info/warn, §4b) and keep plain union slots
until the author marks one — registration (§4-registration) selects WHICH slot
discriminates (the ELEVATE primitive), not a guess.

**Arm-naming — the ONE rule (REWRITTEN): arm name = the arm's KIND NAME.** Since
every arm is a kind (§4g — literals included), the submethod name is simply
`snakeToCamel(armKind(v))`, where `armKind(v) = v.kind.name` (the per-value
render-kind ref, §7.3 parse-naming — no `isNodeRef` fork post-PR-B). The arm's
kind name is **tree-sitter's**:
the `anon_sym_*` parser.c symbol for a bare literal, or `alias_sym_<name>` when the
grammar relabels it (§4-registration RELABEL). **DELETED** vs the prior rule:
- the priority cascade (no more "registered → literal → kind" — kind name is the
  one source),
- the parent-prefix-strip (`k.startsWith(P + '_')`) — **replaced by aliasing**: a
  variant-synthesized arm kind gets a clean name via the RELABEL alias the
  registration performs (so `arm-name = kind-name` yields `eq` / `addition`, not
  `assignmentEq`),
- the `form_<index>` positional fallback (`link.ts:684`) — the one
  non-deterministic path; a true collision → `fail{arm-name-collision}` (§4b).
- `armNameOf` is still a **derived** property (not stored), now trivially =
  `snakeToCamel(armKind(v))`.

**Dedup BEFORE collision-check (load-bearing order, retained).** First fold arms
that are the *same logical arm*: alias-pairs (a value whose `parseKind` differs
from its `kind` — the per-value parse-naming, replacing the slot `aliasSources`
map) and multiplicity-merges (via `mergeSlotValues` `node-map.ts:272`) collapse to
one arm. *Then* collision-check. Genuine collisions are 0 today.

**Registration's residual role (never gates emission, #17):** registration is the
two orthogonal primitives (§4-registration) — ELEVATE marks the discriminating
slot / makes a named kind, RELABEL sets arm kind names via grammar aliases. It
supplies (a) the discriminating-slot marker (the 0-or->1 case), (b) semantic arm
kind names (via RELABEL), and (c) `$variant` validation metadata (validate-only,
#15). Emission keys on the structural fact; deleting registration changes arm
*names* (they fall back to parser.c `anon_sym_*`), never *whether* submethods emit.

**The ONE general emit path (replaces all polymorph-specific functions).** For
EVERY branch with a discriminating choice slot, ONE path drives
factory/types/from/wrap:
- **types** — emit the union type + per-arm narrowed views (replaces
  `emitFormInterface` `types.ts:1231`).
- **factory** — emit the dispatcher + per-arm submethods: kind-arm delegates to
  the arm-kind factory; literal-arm pins the value (replaces `emitPolymorphFactory`
  `factories.ts:1401` + the per-form loop `:1426/1435` + `emitPolymorphDispatcher`
  `factories.ts:1713`).
- **from** — dispatch structurally on the concrete arm (replaces
  `emitPolymorphDispatcher` `from.ts:1110/1293`).
- **wrap** — dispatch on the concrete arm (`$type` for kind-arm, literal for
  literal-arm); replaces the wrap polymorph path + the override/promoted dispatch
  maps.

**Additivity / gate.** Submethods are **ADDITIVE** for the ~136 non-polymorph
discriminating-slot branches (168 − 32) — those branches gain new per-arm methods
while their existing factory/type output is unchanged. So the count gate **accepts
the new surface** (new methods + new literal-arm submethods) and asserts the
*existing* output is byte-identical. The 32 already-polymorph branches re-route
through the general path with identical output (a form = an arm).

**Arm-naming scope (measured, cited).** Across the 3 grammars: **180
discriminating slots; 157 literal arms / ~500 kind arms; 0 unmapped, 0 genuine
collisions** (post-logical-identity-dedup) today. So the model **ships with ZERO
forced overrides** — `armKind`/`snakeToCamel` resolves every arm deterministically
from tree-sitter's names. Because parser.c names every token cleanly
(`anon_sym_*`), the prior `tok_*` `charFallback` ugliness **disappears** — so
`info{propose-arm-name}` is **DELETED** (no longer needed; tree-sitter's name is
the name). A multi-char operator now reads e.g. `binary_expression.equalEqual()`
(or whatever parser.c / a grammar alias yields) — clean by construction, no map to
maintain.

### §4g. All literals are kinds (token naming is tree-sitter's, not sittir's)

**Every grammar literal already HAS a kindId + a canonical name** — its tree-sitter
symbol from `parser.c`: `anon_sym_*` for a bare literal, or `alias_sym_<name>`
when the grammar relabels it (§4h RELABEL). tree-sitter already implements this; we
read it, we do not invent it (#3/#16 — token naming is tree-sitter's). The
machinery exists: `generated-metadata.ts` parses `parser.c` (`:64`), captures
`cSymbol: entry.cName` (`:371`) with an `anon` flag (`:374`) and lowercasing
(`:398-406`); `TerminalValue.resolvedKind` (`node-map.ts:196`) is already set from
`findGeneratedKindEntry` (`:1029`). **The ONE new plumbing:** surface `cSymbol` on
`GeneratedKindEntry` (`generated-metadata.ts:47`, already captured at `:371`) so
naming can read the tree-sitter symbol name.

**`TerminalValue` survives but unifies with `NodeRef` at the naming/dispatch
layer:** it keeps `value` (render text, #0.4) but is a **kind-ref**. With the
parse-naming decomposition (§7.3 / §2) the unified accessor is just the per-value
render-kind ref — no `isNodeRef` fork needed:
```ts
armKind(v)      = v.kind.name        // render/source kind — both NodeRef + TerminalValue carry `kind` (#4g)
armParseKind(v) = v.parseKind.name   // parse-as kind (alias target / variant base / own)
```
(Pre-decomposition this read `isNodeRef(v) ? v.node.kind : v.resolvedKind`;
post-PR-B both value types carry `kind`/`parseKind` refs, collapsing the fork.)
So §4f arm-naming uses `armKind` (render) and §4d dispatch uses `armParseKind`
(CST) — literal-arm and kind-arm treated identically, both arm kinds.

**Deletions (superseded by reading parser.c):** `TOKEN_NAMES` (`link.ts:1537`) +
`charFallback` (`link.ts:1607`) + `tokenToName` (`link.ts:1648`) — the sittir-side
literal→identifier map is **DELETED**; `nameVariant` (`link.ts:675`) / `nameNode`
(`node-map.ts:1254`) re-point to the kind entry's tree-sitter name. (This is the
#3 "no hardcoded maps" cut: a hand-maintained operator table is exactly the
"opaque assumption" the principle forbids when tree-sitter already names them.)

### §4h. Registration = two orthogonal primitives (no monolithic `registerChoice`)

Registration is NOT one opaque "register a polymorph" call — it is **two
orthogonal, grammar-visible primitives** at different layers, each = an EXISTING
pass (#16, no new mechanism):

- **ELEVATE** `(parent, slot|path, name?)` — synthesize a named kind for a slot's
  choice content + rewrite the slot to ref it. **Mechanism = the existing
  `groups:` / `auto-groups.ts` synthesis into `outRules`** (#16, grammar-visible,
  gets a `kindId`). Default name `<parent>_<slot>` (e.g.
  `binary_expression_operator`). Zero new machinery. *Rewrites the PARENT body.*
  **An ELEVATE'd kind is VISIBLE (§4 visible-kind-reference invariant)** — even
  though `_`-prefixed, `markUserFacing` flags it — so it **renders as a slot
  reference in the parent, never inlined** (`isVisibleKind` true; not in
  `grammar.inline`). This is why `type_arguments`/`type_parameters` (registered
  `groups:`) keep their `type_argument` slot reference instead of expanding the
  group body — the two band-aids §5 PR-E deletes were patching exactly this.
- **RELABEL** `(choice, {arm: name})` — `alias(arm, name)` each arm →
  `alias_sym_<name>` kinds. **Mechanism = the existing `alias()` primitive
  (`dsl/primitives/alias.ts:35`) / `variant()` hoist (`transform.ts:422`)**
  (#16). Relabel is what sets the arm kind names *semantically*. *Wraps the ARMS.*

**Composition (orthogonal — different layers):**

| Case | ELEVATE | RELABEL | Result |
|---|---|---|---|
| registered enum | ✓ | ✓ (literals) | named kind, semantic literal-arm names |
| top-level-choice polymorph (`assignment`) | — | ✓ (kinds) | relabel-only; the choice is already the kind's body |
| deep / inline polymorph slot | ✓ | ✓ (kinds) | elevate the slot to a kind, relabel its arms |
| elevate-only | ✓ | — | named kind; arm names = parser.c `anon_sym_*` |
| relabel-only | — | ✓ | inline choice; arms get semantic names, no new parent kind |

**Sugar (kept as author-facing intent + validation metadata):**
- `enums:` ≡ **elevate + relabel(literal-arms)**.
- `polymorphs:` / `variant()` ≡ **relabel(kind-arms) + elevate-iff-deep**.
The spec exposes `elevate` / `relabel` as the primitives these desugar to;
`polymorphs:` / `enums:` remain the ergonomic surface (carrying intent + the
`$variant` validation metadata).

**Enum-registration replaces the per-slot enum sidecar — for REGISTERED enums
only.** An ELEVATE'd enum is a real grammar kind, so it **replaces
`collectPerSlotChildEnums` (`render-module.ts:2480/3198`)** for registered enums.
The sidecar **remains** for *unregistered* enum-shaped slots (the zero-config
predicate path, §G-cut — `predicate = classifier, always on; elevate = kind-maker,
opt-in; relabel = namer, opt-in`).

**Reconcile with prior decisions (they LAYER, no conflict):** unregistered
choice-of-literals → the enum-shaped **predicate** (§G-cut, parser.c names) — the
always-on zero-config classifier. `AssembledEnum` (§7.3) is retained for standalone
leaf choice-of-literals (which ELEVATE *produces* as a kind). A choice slot inside
a branch = the unified choice-slot (§4f). §4d dispatch is unchanged (structural on
`armKind(v)`).

---

## §5. Strangler PR sequence

Ordered so each PR (a) migrates one concern, (b) runs **`pnpm validate:native`**
for all 3 grammars, (c) **cannot regress** because each is either
behavior-preserving-by-construction or gated by a diff probe that must reach
zero before merge. The baseline gate per PR (2026-05-25): **rust** cov 181/186 ·
read-render-parse 134/136 · ast 125 — **python** 107/110 · 96/115 · ast 74 —
**typescript** 174/182 · 82/111 · ast 75 (re-measure each).

**`pnpm validate:native`, NOT raw `counts --backend native`.** Raw `counts` does
NOT rebuild the napi `.node`; Askama bakes templates into the binary, so a stale
`.node` silently falls back to the TS path and masks regressions
(`project_native_build_and_staleness`). `pnpm validate:native` rebuilds first.
**For every RUST-EMITTING PR** (PR-D, PR-M, PR-P, PR-I — the general choice-slot /
§H path): run an **independent `cargo check --workspace --features napi-bindings`
+ re-count** — the SubagentStop gate NO-OPS after a regen
(`feedback_verify_cargo_not_gate`), so cargo-check is a manual step, not an
automatic net.

**PR3 + PR-A0 are DONE (#36).** PR3 deleted the legacy walker pipeline; PR-A0
shipped the Normalize losslessness fix (`c38ffbf1`/`a91927c6`). The pending
sequence starts at **PR-A**. **ClauseRule was NOT part of PR3** (`detectClause`
live at `link.ts:2338`) — it is removed by **PR-M** in THIS spec (§C).

| PR | Name | Changes | Validates | Why it can't regress |
|---|---|---|---|---|
| ~~**PR3**~~ ✅ **DONE (#36, `ee3d7a0b`)** | Delete legacy render walker + render-fidelity fixes + staleness guard | Deleted the walker *pipeline* + `renderTemplate()` methods + the legacy call sites. **NOTE:** `template-walker.ts` SURVIVES as a query-helper module (`findRepeatSeparator`/`findRepeatFlag`/`findFieldsWithRepeatFlag`); wrapper rule types + ClauseRule were NOT removed (→ PR-M). | (landed) | — |
| ~~**PR-A0**~~ ✅ **DONE (#36, `c38ffbf1` + `a91927c6`)** | Normalize losslessness fix — `collapseWrappers`/`canonicalizeSeqOfLeaves`/`fanOut`/`factor` preserve `id`/`separator` | `withAttrsFrom`/`combineMultiplicity` centralized in `compiler/rule-attrs.ts`; the single-member-collapse + wrapper-fold arms thread `withAttrsFrom`. Normalize is genuinely lossless (#2 enforced). | (landed — probe satisfied) | — |
| **PR-A** | Reconcile `_new` naming to legacy (diff → 0), WIDE probe | No emitter changes. Probe asserts each projected name = its getter-computed value: `storageName` vs `storageNameNew`, `name`→`storageName`, `configKey`/`propertyName`/`paramName`/`parseNames` vs the §2 getter formulas. **FRONT-LOADS the value→`parseKind` decomposition (was PR-B's)** — the WIDE probe proved the naive `_new` proxies diverge from legacy and can't reconcile without it. Two corrections: (1) `storageName` names from the **parse-as** kind (`value.parseKind.name`), NOT `kindsOf`/render kind — 13 divergences, e.g. `_suite`→`block` is RIGHT (the naive `simple_statements` was an error); (2) `parseNames` = `values.map(v => v.parseKind.name)`, NOT `ref-kinds ∪ Object.keys(aliasSources)` — 7 over-inclusions (`semicolon`/`newline` terminals, un-collapsed `public_field_definition_*` variant-forms, `last_match_arm`); the claimed `expandRuntimeDiscriminatorKinds` equivalence does NOT hold. **Naming call PR-A MUST make (else the parity check is undefined):** unnamed slot with >1 distinct `parseKind` → `content` (warn); **2+ `content` slots on one node → `fail{content-collision}`** (§4c). Probe target = **0 unexpected divergences + N allowlisted intentional renames** (each count-gated on `validate:native`), NOT strict byte-identity. Fix `collect-slots.ts`/`simplify.ts` until **all** divergences = 0 (H1). | the WIDE divergence probe = 0 for every projected name; counts unchanged | no consumer reads `_new` yet; the probe guarantees every getter PR-B introduces is byte-identical |
| **PR-B** | `AssembledNonterminal` → class + per-value `kind`/`parseKind` refs (+ `sourceRuleIds`) | Swap the interface for the class (§2 getters). Delete the `_new` suffixed fields (now getters). One STORED identity: `storageName`; **`slot.name` becomes a getter over it (NO read-site migration — the ~65 `name` reads keep working)**. *(The `kind`/`parseKind` value-ref decomposition below front-loads to PR-A — the parity check needs it; PR-B then consumes it.)* **Add `kind` (render/source) + `parseKind` (parse-as) kind REFS to `NodeRef`/`TerminalValue` (`node-map.ts:166/193`)** — resolve the `kind`-discriminant collision (§7.3 flag); **`TerminalValue.resolvedKind`→`parseKind`**. Set them in `deriveValuesForRule` (`node-map.ts:977`): symbol case (`:999/1004`) `parseKind = rule.name` target when aliased else the kind; literal case `:1029/1038` resolvedKind→`parseKind`. `kinds`/`parseNames` now project `values`. **FOLD-1:** `sourceRuleId?` → **`sourceRuleIds: RuleId[]`** (every renderRule + simplifiedRule position the slot occupies); `slotByRuleId` maps EACH id → the slot (§7.6). | counts unchanged (byte-identical, guaranteed by PR-A's WIDE probe + the equivalence note); `slotByRuleId` resolves at both views | every getter value-identical in PR-A; per-value `parseKind` reproduces `parseNamesNew` post-expansion; `sourceRuleIds` is purely additive registration (more ids → fewer misses, never a behavior change) |
| **PR-C** | Eliminate `origin` + slot `aliasSources`; re-point behavior reads to `slot.isUnnamed` / `value.parseKind`; drop dead `'inlined'`; **+ §4d.1 non-injective-`parseKind` pass** | Replace `slot.origin === 'kind'` (`wrap.ts:470`) + every **behavior** read of `slot.source === 'inferred'` (`shared.ts:1056/1138/1173`, `render-module.ts:585/597/656/669`, `templates.ts:1540`) with `slot.isUnnamed`. **Remove the slot-level `aliasSources` map; re-point the 4 reader sites** (`collectConcreteStorageKeys` `wrap.ts:470` + the alias loops `wrap.ts:648/698`) to **`value.parseKind`**; **DELETE `deriveAliasSources` (`node-map.ts:908`) + the slot alias-merges (`collect-slots.ts:251`, `node-map.ts:809/2149`)** — values carry `parseKind` through merges. Delete `origin`+`SlotOrigin`. KEEP the `'inferred'` producer + diagnostic read (`node-model.ts:318`, #15). Drop `'inlined'` from `SlotSource`. **Add the §4d.1 non-injective-`parseKind` pass** — now that per-value `parseKind` is in place, detect slots where 2+ distinct `value.kind` share one `parseKind.name`; **MERGE** structurally-identical relabels (~12 trivial cases), else emit **`propose-distinct-alias`** (fail). The `aliasSources`→`value.parseKind` dissolution above also fixes the `Record<target→source>` clobber (the silently-dropped `_simple_statements→block`). | counts unchanged (the ~12 trivial relabels merge); the ~5 genuine collisions (py1/rust1/ts~3) emit `propose-distinct-alias` or clear via overrides; no runtime structural recovery; wrap + render + factory-mode byte-diff; the `type_query` dual preserved per-value; `node-model.json5` still serializes `source` | `isUnnamed`/`value.parseKind` are the structural signals `origin`/`source==='inferred'`/`aliasSources` approximated; per-value `parseKind` carries the alias-target/variant-base distinction the map did, without map-ambiguity; §4d.1's MERGE is structurally-identical (no behavior change) and its DIAGNOSE surfaces a real defect (no silent collapse) |
| **PR-D** | wrap reads the class; delete `SlotModel`; `$children`→`$other` (paired codegen+rust) | Delete `compiler/slot-model.ts`. wrap.ts reads `slot.arity`/`slot.storageKey` getters instead of `createNamedSlotModel(...)`. **Redesign** the `$children` catch-all → wrap-only `$other` bucket (Finding 3 / Q4 / JC5). **Rust-reader twin (M2):** the napi reader's child-routing pass — which today routes unmatched children to a `$children`-keyed field — re-targets them to a `$other`-keyed accumulator; the reader emits `$other` ONLY for parsed children matching no named slot, and the codegen emits the matching rust struct field (a `Vec` of raw transports, NOT a typed slot). Both sides land together. **ACCEPTANCE CRITERION (generated-code-cleanup item 1, `wrap.ts:3653`):** for a `nonEmptyArray`-of-group-kind slot, `$with` must emit a **variadic-of-element** signature — `$with: { <slot>: (...vs: readonly [T.X, ...T.X[]]) => wrap…({ ...data, _<group>: vs }, tree) }` — updating the backing `_<group>` storageName key, **NOT** the uncallable `(...vs: readonly [never])`. Branch on slot multiplicity; key on `storageName`, not `$children`. | counts (esp. rust read-render-parse ast); wrap byte-diff; rust `cargo check`; **`$with` for a group-list slot is callable (variadic-of-element, not `[never]`)** | `arity`/`storageKey` getters are identical functions to `SlotModel`'s; `$other` is wrap+reader-only so no typed/render surface changes; a multiplicity-branched `$with` handles the group-list shape by construction (#9) |
| **PR-D2** | Helper names must not leak into slot `values` (H2 — fixes a real OPEN bug) | **Discovery (cited):** today rust leaks 5 synthesized-helper names into slot values — `const_item.const_item_optional1 → _const_item_optional1`, `for_expression`, `function_signature_item`, `let_declaration` (`_..._optional3`), `loop_expression` (verified against `node-model.json5`); ts/python leak 0. Ensure the slot's `values` hold the **inlined target kinds**, not the `_<parent>_optionalN`/`_repeatN` helper name. Fix in Normalize/Simplify (`inlineRefs`/`reapplyInlinedLeafAttrs`, `simplify.ts:356/366`): when a helper ref is inlined, the surviving slot value must reference the helper's CONTENT kinds, not the helper symbol. | the H2 leak probe = 0 across all 3 grammars (rust 5→0); counts unchanged | makes PR-E's assumption TRUE before PR-E relies on it; the leaked names render to invalid kinds today, so fixing them only corrects |
| **PR-E** | transport + render read the class (+ delete the two visible-kind band-aids) | Transport-projection / render-module read `slot.values`/`slot.kinds`/`slot.storageKey` getters; drop node-wide `meta.separators` fallback. **Depends on PR-D2** (values hold inlined kinds) **+ PR-A/PR-B** (authoritative `isVisibleKind` predicate + slot name via `_new`/`sourceRuleIds`). **FOLD-1:** `lookupSlot`/`emitChoice` (`templates.ts`) resolves the slot via the **renderRule-position id** (now in `sourceRuleIds`, PR-B) — direct hit, NO arm/symbol-name fallback → #9 holds by construction. **FOLD-2 — delete both band-aids (general fix = visibility predicate + authoritative slot name):** (1) **`emitSymbol`'s "Named-alias push-down" munge (`templates.ts:1290-1318`, on 029)** — it string-munges `aliasedFrom` to reproduce the slot name because `lookupSlot` returned the GROUP's own `content` slot instead of the PARENT's `type_argument` slot; general fix = `lookupSlot` resolves the PARENT's slot for a visible-kind/aliased-group ref (the §4 invariant), then the normal path emits the right name → delete the munge. (2) **`collectTopLevelAliasBodies`/`dereferenceTopLevelAliasBody` `patternReplacementKinds`-only skip (`link.ts:511/545`; the `:532-538` check on 029)** — generalize to "keep as a reference ANY symbol whose target is a visible kind" (`isVisibleKind`), subsuming + removing the narrow registered-group check. **ACCEPTANCE CRITERION (generated-code-cleanup item 3, `bridge.rs:1035`):** **DELETE the deprecated `bridge.rs` render path** as part of this PR's deprecated-path sunset — it collapses the two-slot group (`element` + optional `trait_bounds`) into one `children.as_scalar()` (bounds unrenderable) and computes an unused `children_renderables`. Production already renders correctly via `render_transport_dispatch` (the +1 AstMatch); `bridge.rs` is `#[deprecated]` (dead code). PR3 set the precedent (deleted the legacy walker); stop generating the bridge path entirely. | **native `pnpm validate:native` hold-or-improve** (handoff gate); `lookupSlot` miss-count = 0; the slot-grouping diagnostic stays silent on `type_arguments`/`type_parameters`, nothing new fires; both band-aids gone; **the deprecated `bridge.rs` render path no longer generated** | both band-aids encode the *same* missing invariant (§4); the predicate + authoritative slot name (PR-A/PR-B) make the general path emit the right reference, so deleting the improvisations can only hold-or-improve; `bridge.rs` is dead (`#[deprecated]`, production uses `render_transport_dispatch`) so deleting it is pure dead-code removal. Caveat: FOLD-1's `lookupSlot` part is a #9-correctness fix, **NOT** an AstMatch lever (Class D cosmetic, +0 AstMatch, `project_optimize_id_loss_fix`) |
| **PR-F** | factory + from + types read the class | factories/from/types consume getters; `from.ts` storageKey param becomes `slot.storageKey`. **No `$other`** on these surfaces (Q4). **ACCEPTANCE CRITERION (generated-code-cleanup item 2, `from.ts:2050`):** `from` reconstruction for a `nonEmptyArray` group-backed slot must **error explicitly on missing/empty** (or return the input node unchanged if already valid) — NOT silently fall back to `children = []` then throw on the non-empty assert. **LOW-PRI CRITERION (item 4, `nodes.test.ts:1782`):** the generated node-test emitter must construct a **valid non-empty** child for `nonEmptyArray` slots (so tests stay correct as more groups land). | counts; from pass-rate; **a multi-element `type_arguments` round-trips through `from` (+ `$with`, with PR-D); the group-list `from` errors-or-returns, never silent `[]`** | getters identical to today's stored fields; `$other` was never on these surfaces in the end-state; multiplicity-branched reconstruction handles the group-list shape by construction (#9) |
| **PR-G** | Diagnostics severity model + Assemble→Project gate | Add `compiler/diagnostics.ts` (`DiagnosticSink`, severity) + `compiler/emit-gate.ts` (`assertEmittable`); wire the gate into `generate.ts` after `assemble()`. Move the unnamed-choice warner global (`collect-slots.ts:61-68`) into the sink. Initially all current heuristics still fire (no `fail` yet) — gate is a no-op until PR-L flips severities. | counts unchanged; gate passes (no `fail` emitted yet) | additive infrastructure; no severity is `fail` until PR-L |
| **PR-H** | Phase module rename(s) + shared `transforms.ts` + ctx + node-behavior-to-class | Rename `optimize.ts`→`normalize.ts` (the Link phase keeps its module name `link.ts` — NOT renamed). Extract shared idempotent ops to `transforms.ts`. Introduce `NormalizeCtx`/`SimplifyCtx`/`AssembleCtx` (carrying the sink from PR-G). Apply the §7.7 `<operation><ObjectType>(target, ctx)` signatures. **Node-behavior-to-class:** `markUserFacing`→`(node, ctx)` method; **DELETE the `markParameterlessKinds` fixpoint + stored field → memoized cycle-guarded `isParameterless`/`stampExpression` getters** on `AssembledNode` (§7.3 / §7.7), terminals override the base case. | counts; full test suite; the parameterless getter produces byte-identical factory auto-stamp output | pure rename + move + method relocations; the getter is the *same* recursion the fixpoint computed (cycle = not-parameterless matches the fixpoint's never-marks-a-cycle behavior), so factory output is unchanged |
| **PR-M** | Sittir-invention rule-IR cut + `AssembledPolymorph` collapse (§B/§C/§D + §H-fold, #16) | **§B + §H-fold:** delete `PolymorphRule`/`VariantRule` from the `Rule` union; **DELETE `AssembledPolymorph` + `modelType:'polymorph'` (`node-map.ts:2599/3163`)** — a polymorph becomes an `AssembledBranch` with `discriminatingSlot?` (the former `structuralSlotRecordFromForms` `:2131` cross-arm union generalizes into the branch slot merge; `variantChildKinds` derived = `discriminatingSlot.kinds`); reframe `promotePolymorph`/`applyOverridePolymorphs` to RECORD a thin `DiscriminatingSlotMarker` (which-slot + arm-names, NOT per-form `FormSpec`); delete the 6 `mapPolymorphForms` arms; delete the `evaluate.ts:330-339` variant-retype. **§C:** delete `ClauseRule` + `detectClause` (`link.ts:2338`) + the `'clause'` arms (closes `project_clause_multifield_gap`). **§D:** delete Link's `classifyHiddenSeqRule` GroupRule path (`link.ts:2010/1975`); Assemble builds `AssembledGroup` from the wire helper. | counts unchanged; `AssembledPolymorph` gone; `PolymorphRule` import reach 7→marker-only; the secondary-field gap closes | a branch + its discriminating-slot `values` reconstruct the identical Model the per-form `AssembledPolymorph` held (a form = an arm); clause fields were already in the seq (restoring them only adds); the wire group helper is the kind Link's classifier shadowed |
| **PR-I** | General choice-slot → factory submethods + structural arm-dispatch + `$variant` removal (§4f / §H-fold — replaces the old polymorph-specific PR-I + PR-J) | Add the **general resolver** keyed on a discriminating choice slot's `values` arms (kind-arm → `$type`; literal-arm → literal) — generalizes `project_polymorph_dispatcher_slot_probe` to all 168 branches. **Identical-arm collapse** first (C2 / §4d), assert no duplicate-signature arm. ONE general emit path replaces the polymorph-specific functions (`emitPolymorphFactory` `factories.ts:1401`, per-form loop `:1426/1435`, `emitPolymorphDispatcher` `factories.ts:1713`+`from.ts:1110/1293`, `emitFormInterface` `types.ts:1231`, wrap polymorph path `wrap.ts:158-197`/dispatch maps `:305-322`, `emitPolymorphTemplate`): types emit union + per-arm narrowed views; factory emits dispatcher + per-arm submethods (kind-arm delegates, literal-arm pins, e.g. `binary_operator.plus()`); from/wrap dispatch on the concrete arm. **Discriminating-slot default** = single required choice slot; 0-or->1 → `propose-discriminator` (keep plain unions). **Arm-naming = the arm's KIND NAME (§4f rewrite + §4g)**: `snakeToCamel(armKind(v))` where `armKind(v) = v.kind.name` (the per-value render-kind ref, §7.3 — no `isNodeRef` fork post-PR-B) — read from tree-sitter (`parser.c` `anon_sym_*` / grammar `alias_sym_<name>`). Dedup-by-logical-identity FIRST (per-value `parseKind`≠`kind` alias-pairs + `mergeSlotValues`), then collision-check. **DELETE `TOKEN_NAMES`/`charFallback`/`tokenToName` (`link.ts:1537/1607/1648`)** + the priority cascade + the parent-prefix-strip + the `form_<index>` fallback (`link.ts:684`) + `propose-arm-name`; re-point `nameVariant`/`nameNode` to the kind entry's tree-sitter name (surface `cSymbol` on `GeneratedKindEntry`, §4g); a true post-dedup collision → `fail{arm-name-collision}`. **Remove the stored `$variant`** from all shipped surfaces (~95+ ts sites); validate-only in node-model. | counts: **existing output byte-identical**; new per-arm submethods ADDITIVE for the ~136 non-polymorph branches → gate ACCEPTS new surface; no compile-time "no arm matched"; collapse assertion holds; **0 `arm-name-collision` today**; no `$variant` in generated 1–6 | a kind's name is tree-sitter's (already in parser.c) — reading it can't regress; the general path reproduces every dispatch decision (a form = an arm); the other 136 branches only GAIN methods |
| **PR-K** | `factory-map.json5` → `node-model.json5` + registration-primitive surfacing + enum-sidecar retirement (orthogonal) | Make `node-model.json5` carry factory-map's subset (§6); **`polymorphVariants` rebuilt per-branch from the discriminating slot's `values` arms** (§6 / §H-fold). **§4h:** expose `elevate`/`relabel` as the two primitives `polymorphs:`/`enums:` desugar to (ELEVATE = existing `groups:`/`auto-groups`; RELABEL = existing `alias()`/`variant()` — no new machinery); **replace `collectPerSlotChildEnums` (`render-module.ts:2480/3198`) with the ELEVATE'd grammar kind FOR REGISTERED enums only** (the sidecar remains for unregistered enum-shaped slots, §G-cut). Point validator/`nodeToConfig` at node-model; delete `factory-map.json5` + emitter. | validator passes; counts; registered-enum slots render via the elevated kind (sidecar output unchanged for unregistered) | factory-map is a strict subset (§6 proof); elevate/relabel are existing passes surfaced (#16); the sidecar→kind swap is per-registered-enum, gated on counts |
| **PR-N** | enrich-widening — name the easy positional symbols (§F) | Widen enrich symbol-to-field promotion to ALL unambiguous single-occurrence positional symbols (LR-safe via the landed `syntheticInline` `_kw_*` auto-inline). Shrinks the 243 `inferred` slots; pure-direct duplicates → deterministic positional numbering. | counts; the `inferred` slot count drops; no LR regression (override-parser errors unchanged) | promotion is deterministic + grammar-visible (#16); the `_kw_*` auto-inline keeps the parse table stable; naming a slot doesn't change its values/cardinality |
| **PR-O** | Structural de-dup (M1/MO2/P1 — non-behavioral) | **MO2:** extract `SlotValueBase` (`NodeRef`+`TerminalValue` share 5 fields). **P1:** extract `BaseEmitConfig` (`grammar`/`nodeMap`/`generatedIdTables?` on every emit Config). **M1:** relocate the shared transforms into `transforms.ts` (de-scatter — already single-bodied, no merge). | counts unchanged; type-check passes | pure type/interface refactors + a file move; zero runtime behavior change |
| **PR-P** | Content-classification cut: Terminal + Enum (flat) → predicates (§G-cut, #16/#1) | **Terminal (clean):** delete `TerminalRule` + `isTerminal`; delete `promoteAndLogTerminalRules` (`link.ts:389`); delete the transparent `case 'terminal'` arms (`wrapper-deletion.ts:155`, `simplify.ts:404/734/1159/1222`, `optimize.ts:484/546/718`, `rule.ts:485/556/925`, `templates.ts:605`); add `isTerminalShaped` (reconcile `link.ts:1663` + `assemble.ts:1561`); `classifyTerminalFallback` becomes primary, the `assemble.ts:1549` throw becomes the normal path; `AssembledPattern` narrows to `PatternRule` + natural subtree. **Enum (FLAT, shape-identical):** delete `EnumRule` + `isEnum`; `normalizeEnumMembers` keeps only single-literal→`StringRule`; `evaluate.ts:268` stops emitting `EnumRule`; delete the enum branch of `classifyHiddenChoiceRule` (`link.ts:1981`) + the `case 'enum'` arms; classify enums at Assemble via **`choice && members.every(isEnumLeaf)` (FLAT, no recursion)** → `AssembledEnum`. | counts unchanged; **the classified enum set + pattern set are byte-identical to today** (flat predicate matches the old flat `EnumRule`/`isAllTextShape` exactly); transport enums (read `AssembledEnum`) unchanged | both predicates reproduce the exact shape the rule-type wrappers classified; the wrappers were transparent (terminal) / a flat all-string test (enum) — no nested widening yet |
| **PR-Q** | Enum recursive-widening (count-gated, §G-cut staging step 2) | Switch the enum predicate from flat to **recursive `isEnumShaped`** (`choice && members.every(isEnumShaped)`) so nested literal-choices classify as `AssembledEnum`; `AssembledEnum.values` flattens nested leaves. **Count-gated:** the newly-classified nested choices are reviewed + all 3 grammars regen'd; pass-rate must hold. | counts hold; the newly-`enum` kinds are reviewed; **measured widening delta = rust 0 / ts 1 / python 0** (so a near-no-op) | the widening only re-classifies choices whose members are all literal sets (recursively) — semantically already enums; the measured delta is ≤ a handful, each regen-verified |
| **PR-L** | Flip remaining heuristics to `propose-*` fail-diagnostics (author overrides first) | For each *guess* still present after PR-M/PR-I/PR-N (`inferFieldNames` residue → `propose-field`; any leftover polymorph candidacy → `propose-polymorph`; the choice distribute-vs-union guess `collect-slots.ts:520`; the discriminating-slot 0-or->1 case → `propose-discriminator`): **first** instrument the **pre-merge** slot stream (before `mergeSlotsByName`, §F) to count the direct+repeat-mix `propose-field` FAIL residue per grammar; author the `field()`/`polymorphs:` overrides that clear it (counts must hold); **then** delete the heuristic and `fail`. **NOT in scope:** (a) the sanctioned `content` slot (§4c) — stays `warn`, never `fail`; (b) `propose-top-level-rule` — info/warn, never `fail` (auto-groups render fine); (c) the **parameterless derivation** — not a guess, became a getter in PR-H. | counts hold AT EACH heuristic removal; the pre-merge `propose-field` residue → 0 via overrides; `overrides.suggested.ts` reviewed; gate (PR-G) actively blocks | overrides authored before each guess is removed → deterministic path produces the same Model; `content`/`propose-top-level-rule`/parameterless are not fails, so no surprise cliff |

**PR count: 18 designed; PR3 + PR-A0 already DONE (#36) → 16 PENDING**
(PR-A..PR-I/K..PR-Q + PR-L; **the old PR-J `$variant`-removal merged into PR-I**,
the general choice-slot path).
**Pending sequence order (PR3 + PR-A0 landed):** PR-A → B → C → D → D2 → E → F →
G → H → **M → I → K** → N → O → P → Q → L.
**PR-A0 was the Normalize losslessness fix (§4 audit) — shipped in #36**
(`c38ffbf1`/`a91927c6`), ahead of every pending emitter-migration PR, so the
degraded-`slotByRuleId` window is already closed.
PR-A..PR-D are the load-bearing core (centralize naming + kill
`SlotModel`/`origin`/`name`, narrow `$children`→`$other`); PR-D2 fixes the
helper-name leak; PR-E..PR-F migrate the remaining read sites; PR-G is the
diagnostics gate; PR-H is the phase reorg + method conformance + the
parameterless getter. **PR-M cuts the sittir-invention rule types
(Polymorph/Variant/Clause/opaque-Group) per #16 AND collapses `AssembledPolymorph`
into `AssembledBranch` (§H-fold) — it MUST precede PR-I.** **PR-I is the general
choice-slot → factory-submethods path (§4f): one resolver + per-arm submethods for
all 168 discriminating-slot branches, subsuming the old polymorph-emitter PRs +
`$variant` removal — the emitter sections SHRINK (one path replaces ~6
polymorph-specific functions).** PR-K consolidates factory-map→node-model
(orthogonal). PR-N widens enrich; PR-O is non-behavioral structural de-dup; PR-P
cuts the content-classification rule types (Terminal + flat Enum) to predicates;
PR-Q is the count-gated recursive-enum widening. PR-L is the final `propose-*`
heuristics-to-fail flip (it runs LAST — it depends on PR-M/PR-I removing the
retype + establishing the discriminating-slot model, PR-N shrinking the residue,
and PR-G providing the gate). Each PR is a strangler step that **removes the old
code it supersedes within the same PR** — no dedicated "sunset" PRs.

**Gating discipline (#12, brainstorm validation gate).** Each PR ends with
**`pnpm validate:native`** (rebuilds the `.node` then re-counts — NOT raw
`counts`, see above) for all 3, asserting no regression vs the 2026-05-25
baseline; rust-emitting PRs also run an independent `cargo check --workspace
--features napi-bindings`. **PR-A0 DONE (#36)** — its probe (single-member
collapse preserves `id`/`separator`) is satisfied by `c38ffbf1`/`a91927c6`. PR-A
gates on the WIDE divergence probe = 0 (every projected name);
PR-D2 gates on the H2 helper-leak probe = 0; **PR-M gates on `AssembledPolymorph`
deleted + the clause-multifield gap closing (no field lost) + `PolymorphRule`
leaving the Rule union; PR-I gates on the identical-arm collapse assertion +
existing output byte-identical while ACCEPTING the new additive per-arm submethods
(168 branches) + no `$variant` in generated 1–6;** PR-N gates on the `inferred` count
dropping with no LR regression; **PR-P gates on the enum + pattern classified
sets being byte-identical to today (flat predicate ≡ old wrappers); PR-Q gates
on the recursive-widening delta (rust 0 / ts 1 / python 0) being regen-verified
with pass-rate held;** PR-L gates on the pre-merge `propose-field` residue → 0
and counts holding *at each individual heuristic removal*.

---

## §6. `factory-map.json5` → `node-model.json5` consolidation

### factory-map's contents are a subset of the Model

`buildFactoryMap` (`factory-map.ts:71`) produces five maps. Each is a
derivation already available from the assembled `NodeMap`:

| factory-map map | Source on the Model | Already serialized in node-model? |
|---|---|---|
| `factoryShapes` | `classifyFactoryShape(node)` (`shared.ts`) — pure function of node modelType + slots | derivable; node-model has `modelType` + slots |
| `fieldAliasMap` | `slot.aliasSources` (`factory-map.ts:87`) **TODAY**; post-PR-C rebuilds from per-value `value.parseKind` (the alias-target ref) — same data, relocated off the slot map | YES — `node-model.ts:328` serializes it per field |
| `factoryFields` | `resolveFactoryFieldNames(node)` (`factory-map.ts:96`) — the factory-field gating predicate | derivable from slots + `isParameterless` |
| `factorySlots` | `deriveSlotCardinality(field)` per slot (`factory-map.ts:106`) | YES — `node-model.ts:314` serializes `required`/`multiple`/`nonEmpty` per field |
| `polymorphVariants` | `node.forms` field-signatures / `node.variantChildKinds` (`factory-map.ts:119`) | partially — node-model has `forms` + `variantChildKinds` (`node-model.ts:249/304`) but not the pre-computed `childKind`/`fields` dispatch map |

**Two maps are already in `node-model.json5`** (`fieldAliasMap`,
`factorySlots`). Two are pure functions of serialized facts
(`factoryShapes`, `factoryFields`). One (`polymorphVariants`) has its *inputs*
serialized but not the dispatch-ready form.

### Consolidation mechanism (PR-K)

1. **Extend `buildNodeModel` (`node-model.ts:178`)** to also emit the
   dispatch-ready `polymorphVariants`. **Per §H-fold this is now PER-BRANCH, built
   from the discriminating choice slot's `values` arms** (not stored form fields):
   for each `AssembledBranch` with a `discriminatingSlot`, serialize the slot's
   arms — each arm's name (§H arm-naming) + its match key (kind-arm: `$type`;
   literal-arm: the value) + the `$variant` validation metadata. (Replaces
   `buildFactoryMap`'s form-field logic `factory-map.ts:119–192`, which read
   `node.forms`/`node.variantChildKinds` — `node.forms` is gone with
   `AssembledPolymorph`.) Emit `factoryShapes` + `factoryFields` by calling the
   same `classifyFactoryShape` / `resolveFactoryFieldNames` (`shared.ts`) the
   factory-map emitter calls. **These STAY shared functions, not Model getters
   (KEEP-clarification, §7.2):** `classifyFactoryShape` takes an
   `options.includeTokenText` flag (from.ts vs factories.ts ask different
   questions of the same node), so it is a per-consumer query — a
   `node.factoryShape` getter would lose that variance. Single-sourced as a
   function is correct here; do not promote it to a getter.
2. **Point the validator + `nodeToConfig` at `node-model.json5`** instead of
   `factory-map.json5` (the `factory-map.ts:5` docstring names the consumers:
   `validate-factory-roundtrip`, `validate-from`, `nodeToConfig`).
3. **Delete `factory-map.json5` + `emitters/factory-map.ts`.** One serialized
   source (#10).
4. **`$variant` is serialized here, but its REMOVAL from shipped code is PR-I**
   (the general choice-slot path). The `polymorphVariants` dispatch map (carrying
   `$variant`) is consumed by the *validator* and serialized into
   `node-model.json5` — this PR-K consolidation provides that serialized home. The
   separate act of *removing* `$variant` from generated `types.ts`/`factories.ts`/etc.
   is **PR-I**, via the structural arm resolver. Keeping the two apart
   (consolidation orthogonal to dispatch) is why they are separate PRs: PR-K can
   land without touching the shipped surfaces, and the validator keeps reading
   `$variant` from the Model regardless.

**Elevated enum kinds are ordinary node-model kinds (§4h).** A REGISTERED enum
(ELEVATE'd, §4h) is a real grammar kind, so it appears in `node-model.json5` as an
**ordinary kind** — replacing its per-slot sidecar entry (`collectPerSlotChildEnums`)
for registered enums. The sidecar representation **remains** in node-model for
*unregistered* enum-shaped slots (the zero-config predicate path).

**⚠ FLAG — schema bump + migration.** `node-model.json5`'s schema grows
(new `polymorphVariants` / `factoryShapes` / `factoryFields` sections). Per
glossary line 535, `cli.ts` needs a schema-version bump + migration step. The
`project_manifest_committed` note warns that node-model is git-committed and
drift-checked — the consolidation PR must regenerate + commit all 3 grammars'
`node-model.json5` atomically.

**⚠ FLAG — `node-model.json5` is diagnostics/tooling ONLY (not runtime).** The
brainstorm #0 and #10 are emphatic: artifacts 1–6 are generated *code* with no
json5 dependency. Verified: `factory-map.json5` is consumed only by the
validator harness (`factory-map.ts:5–11`), never imported by generated
`factories.ts`/`types.ts`/`wrap.ts`. The consolidation preserves this — the
production runtime touches neither file.

---

## §7. EXHAUSTIVE END-STATE INVENTORY

> The complete target inventory. **Every** class, type, emitter module, and
> pipeline module is listed. Pieces that **do not change** are marked
> `[UNCHANGED — see file:line]`; pieces that are **new or refined** get a full
> end-state definition. An implementer should be able to build the whole
> end-state from this section with nothing left to infer. All shapes are
> grammar-agnostic.

### §7.1 Pipeline modules + the methods in each

Principle #13: one module per phase; the only exceptions are the shared
transforms module (#13a), the per-artifact emitters (#13b), and shared rule
helpers (#13c). **No shared node-method module** — node behavior lives on the
classes (§7.3).

| Module | Status | Phase / role | Methods that live here (end-state) |
|---|---|---|---|
| `dsl/enrich.ts` | UNCHANGED — see glossary Phase 0 | shared grammar layer (not a sittir phase) | `enrich`, `applyEnrichPasses`, `enrichFieldWrappers`, `enrichMultiplicityWrappers`, … |
| `dsl/wire/*` + `dsl/runtime-shapes.ts` | UNCHANGED — see glossary Phase 1 | shared grammar layer | `wire`, `applyAutoGroups`, dual-case predicates, … |
| `compiler/evaluate.ts` | REFINED — see `evaluate.ts:200` | **Evaluate** | `evaluate(entryPath)`, DSL primitives, `synthesize*`, `liftCommaSep`, `grammarFn`. **DELETED (§B):** the heterogeneous-field-choice → `variant`-retype block (`evaluate.ts:330-339`). **CHANGED (§G-cut):** `choice()` (`evaluate.ts:268`) stops emitting `EnumRule` — `normalizeEnumMembers` returns a single-literal `StringRule` or a plain `ChoiceRule` |
| `compiler/link.ts` | REFINED (folds in `link-refine.ts`, `field-shape.ts`) — NOT renamed | **Link** | `link(raw, ctx)`, `resolveRule`, `classifyHiddenRule`, `hoistIndentIntoRepeat`, `annotateBlockBearerFields`. **`promotePolymorph`/`applyOverridePolymorphs` REFRAMED** — they RECORD a `PolymorphSpec` (§B). **DELETED:** `detectClause` (§C); `classifyHiddenSeqRule`'s opaque GroupRule path (`link.ts:2010/1975`, §D); `promoteAndLogTerminalRules` (`link.ts:389`, called `:138`) + the enum branch of `classifyHiddenChoiceRule` (`link.ts:1979/1937`) as rewriters (§G-cut — classification is now a predicate at Assemble); `inferFieldNames`, `looksLikePolymorphCandidate`, `choiceNeedsVariantWrapping` (→ `propose-*` diagnostics, §E / PR-L). **NEW:** `isTerminalShaped` (reconciles `link.ts:1663` `isTerminalShape` + `assemble.ts:1561` `isAllTextShape` into one shared predicate) |
| `compiler/normalize.ts` | RENAME of `optimize.ts` (+ folds `wrapper-deletion.ts`) | **Normalize (non-lossy)** | `normalizeGrammar(linked, ctx)` (was `optimize`), `fanOutSeqChoices`, `factorChoiceBranches`, `dedupeSeqMembers`, `inlineSingleUseHidden`, `collapseWrappers`, `pushdownWrappers` (was `applyWrapperDeletion`). Produces the **RenderRule** snapshot. **FIXED (PR-A0, §4 audit):** `collapseWrappers` (`optimize.ts:618-…`) now threads `withAttrsFrom` on its single-member-collapse + wrapper-fold arms so `id`/`separator` survive — the one place Normalize was NOT actually lossless (#2). **DELETED (§B):** the 6 `mapPolymorphForms` arms (`optimize.ts:226/357/399/…`) + the per-form snapshot block. **DELETED (§G-cut):** the transparent `case 'terminal'` arms (`optimize.ts:484/546/718`) + `case 'enum'` arms — the natural `seq`/`string`/`choice` arms already handle the shape; `rulesEqual`'s enum arm folds into the choice arm |
| `compiler/simplify.ts` | REFINED — see `simplify.ts:331` | **Simplify (lossy)** | `computeSimplifiedRules`, `simplifyRules`, `simplifyRule`, `fuseHeadRepeatLists`, `hoistSharedFieldAcrossChoiceBranches`, `mergeChoiceBranches`, the field-hoist helpers. Produces the **SimplifiedRule** snapshot. **DELETED (§G-cut):** the transparent `case 'terminal'` arms (`simplify.ts:404/734/1159/1222`) + `case 'enum'` leaf arms — the underlying natural shapes are handled directly |
| `compiler/transforms.ts` | **NEW** (#13a) — **rationale: de-scatter, not de-dup (M1).** These ops are already a *single body each*, shared by import between Normalize & Simplify today; there is no duplicated implementation to merge. The module exists to give the shared ops one named home (so a reader finds them in one place, and the `(rule, ctx)` signature is uniform) — not to eliminate copy-paste. | shared idempotent ops invoked by BOTH Normalize & Simplify | `collapseSeq(rule, ctx)`, `canonicalizeSeqOfLeaves(rule, ctx)` (`withAttrsFrom`-threaded per PR-A0 — single-member collapse preserves `id`/`separator`), `inlineRefs(rule, ctx)`, `deleteWrapper(rule, ctx)`, `pushAttrsToLeaves(rule, …)`, `combineMultiplicity`, `extractRepeatShape`, `findRepeatFlag` (moved out of the deleted `template-walker.ts`) |
| `compiler/assemble.ts` (+ slot walk) | REFINED — see `assemble.ts:407` | **Assemble** (sole Model-builder) | `assembleModel(normalized, ctx)`, `classifyNode(rule, ctx)`, `hydrateSlotRefs(nodeMap, ctx)`, `markUserFacing(node, ctx)` (merged — §G/M3), `resolveCollidingNames(nodeMap, ctx)`, `resolveIrKeys(nodeMap, ctx)`, `collectAnonymousNodes(nodeMap, ctx)`, `collectSlots(rule, ctx)` (slot-enum walk — naming logic MOVED to the class, §7.3), `buildAssembledFormGroups(node, ctx)` (now reads the `PolymorphSpec` + parent `ChoiceRule` arms, §B — was `PolymorphRule.forms`). **AssembledPolymorph** built from `PolymorphSpec`; **AssembledGroup** built from the **wire-synthesized helper kind** (`dsl/wire/auto-groups.ts`, grammar-visible with a `kindId`, §D) — NOT from Link's opaque GroupRule classifier. **`classifyTerminalFallback` (`assemble.ts:1546`) becomes the PRIMARY predicate-driven classifier (§G-cut)** — `isTerminalShaped` → `modelType:'pattern'` (`AssembledPattern`); `isEnumShaped` → `modelType:'enum'` (`AssembledEnum`); **the `throw` at `assemble.ts:1549` becomes the normal path** (no longer a fallback). **DELETED:** `buildSlot` free function (→ `AssembledNonterminal` constructor); **`markParameterlessKinds` fixpoint + helpers (→ memoized getters, §7.3).** All signatures per the §7.7 exhaustive map |
| `compiler/rule.ts` | REFINED — see §7.4 | **shared rule helpers** (#13c) | Rule IR types + `RuleBase`; type guards (`isSeq`, …); `literalTextOf`, `collectFieldNames`, `replaceAtPath`; **NEW predicates `isTerminalShaped`/`isEnumLeaf`/`isEnumShaped`** (§G-cut — or a sibling `predicates.ts`). **DELETED — wrappers (PR3):** `OptionalRule`/`FieldRule`/`RepeatRule`/`Repeat1Rule`/`AliasRule`. **DELETED — sittir inventions (PR-M, §B/§C):** `PolymorphRule`/`VariantRule`/`ClauseRule` + `isClause` (`rule.ts:440`). **DELETED — content classifications (§G-cut):** `EnumRule`/`TerminalRule` + `isEnum` (`rule.ts:441`)/`isTerminal` (`rule.ts:444`); `normalizeEnumMembers` (`rule.ts:276`) keeps ONLY the single-literal→`StringRule` collapse, else returns a plain `ChoiceRule` |
| `compiler/node-map.ts` | REFINED — see §7.3 | the `AssembledNode*` class hierarchy + `AssembledNonterminal` class + slot value types | (class defs only — no free-standing pipeline methods). **DELETED:** `inlineJinjaClauses`, `translateToJinja`, `renderTemplate()` methods (PR3) |
| `compiler/slot-model.ts` | **DELETED** | — | `SlotModel`/`createSlotModel`/`createNamedSlotModel`/`createUnnamedKindSlotModel`/`createUnnamedChildrenSlotModel`/`slotStorageKey` all gone — replaced by class getters (§7.3) |
| `compiler/template-walker.ts` | **PIPELINE DELETED (PR3 #36); module SURVIVES** | query helpers | PR3 deleted the walker *pipeline*; the file now holds only the query helpers `findRepeatSeparator` / `findRepeatFlag` / `findFieldsWithRepeatFlag` (imported by `node-map.ts` + `collect-slots.ts:50`). **Pending future step:** move `findRepeatFlag` → `transforms.ts` (or onto the class) + delete the rest |
| `compiler/diagnostics.ts` | **NEW** (§7.5) | cross-cutting diagnostics | `DiagnosticSink`, `Diagnostic`, `DiagnosticSeverity`, `EmitHaltedError` |
| `compiler/emit-gate.ts` | **NEW** (§7.5) | Assemble→Project gate | `assertEmittable(nodeMap, sink)` |
| `compiler/generate.ts` | REFINED — see `generate.ts` | pipeline driver | sequences Evaluate→Link→Normalize→Simplify→Assemble→`assertEmittable`→Emit; constructs + threads the `DiagnosticSink` |
| `emitters/emit.ts` | UNCHANGED dispatch — see `emit.ts` | **Project** dispatcher | iterates `nodeMap.nodes`, dispatches per artifact to §7.2 emitters |

Other compiler files **UNCHANGED**: `scc.ts`, `rule-catalog.ts`,
`group-synthesis.ts`, `list-fusion.ts`, `generated-metadata.ts`,
`resolve-grammar.ts`, `common.ts`, `trace.ts`, `types.ts` (the `NodeMap`
interface, §7.6).

> **JC3 — `transforms.ts` vs `rule.ts` membership predicate (structural rule —
> applies as stated).** A function belongs in **`transforms.ts`** iff it returns
> a structurally-modified `Rule` (a tree rewrite) AND is idempotent
> (re-applicable to a fixpoint, per #7). It belongs in **`rule.ts`** iff it is a
> pure reader / type-guard / path-op that does NOT transform structure
> (`isSeq`, `literalTextOf`, `collectFieldNames`, `replaceAtPath`).
>
> **Per-member audit is a DISCOVERY task** (depends on actual code behavior, not
> doc structure — so it is flagged, not asserted): walk each function currently
> listed under `rule.ts` / `simplify.ts` / `wrapper-deletion.ts` and place it by
> the predicate. E.g. `normalizeEnumMembers` (`rule.ts`) *appears* to rewrite a
> rule (collapse single-literal `EnumRule` → `StringRule`) and so *may* belong in
> `transforms.ts` — but confirm it is idempotent and a structural rewrite (not a
> pure reader) before moving it. Do not move on the spec's say-so; the
> implementation plan does the audit against the predicate.

### §7.2 Emitter modules (one per artifact) + entry signatures

Every emitter follows the canonical pattern (`feedback_emitter_pattern_consistency`):
iterate `nodeMap.nodes`, dispatch on `node.modelType`, own ALL string
generation; read slot facts via the §7.3 class getters (NEVER re-derive). The
artifact numbers map to brainstorm #0's 1–6.

> **JC2 — the repeated dispatch loop is an INTENTIONAL convention, not DRY
> debt.** Each emitter independently iterating `nodeMap.nodes` + switching on
> `modelType` + owning its own string generation is a deliberate consistency
> contract (`feedback_emitter_pattern_consistency`), consistent with #13's
> "no shared *node* methods." **Do NOT factor a shared visitor / base-emitter
> module** — that would re-introduce the cross-emitter coupling the convention
> exists to prevent. The loop body is per-artifact; only the *data it reads*
> (the §7.3 getters) is shared. This is a decided non-goal of the refactor.

> **P1 (discovery) — `BaseEmitConfig` input type is justified (JC2-safe).**
> Discovery: **every** emit Config interface shares ≥3 input fields — `grammar`,
> `nodeMap`, `generatedIdTables?` are on all of `EmitTypesConfig`/`Factories`/
> `From`/`Wrap`/`Ir`/`Is`/`Consts`/… (`types.ts:94`, `factories.ts:51`,
> `from.ts:53`, `wrap.ts:52`, `ir.ts:23`, `is.ts:31`, `consts.ts:18`); several
> also share `kindEntries?`/`inlineKinds?`/`synthesizedKinds?`. Extract a
> `BaseEmitConfig { grammar; nodeMap; generatedIdTables? }` that each
> `Emit<X>Config` extends. This is **JC2-safe**: it de-dups an *input shape*, not
> the dispatch loop — no shared visitor, no behavior coupling. (Decided on the
> evidence above.)

| Artifact | Emitter module | Entry point (UNCHANGED signature unless noted) | End-state change |
|---|---|---|---|
| 1 — canonical types | `emitters/types.ts` | `emitTypes(config): string` (`types.ts:103`) | reads `slot.configKey`/`slot.values`/`slot.isRequired`/`slot.kinds`; keyword-presence via cached `slot.storageInfo?.kind` (EmitDRY-2); **§H-fold: ONE path** — a discriminating-choice-slot branch emits the union + per-arm narrowed views (replaces `emitFormInterface` `types.ts:1231`); **no `$other`** |
| 2 — factories | `emitters/factories.ts` | `emitFactories(config): string` (`factories.ts:81`) | reads getters (incl. `slot.kinds`, `slot.storageInfo`); **§H-fold: ONE path** — discriminating-slot branch emits dispatcher + per-arm submethods (kind-arm delegates, literal-arm pins); replaces `emitPolymorphFactory` (`factories.ts:1401`), the per-form loop (`:1426/1435`), `emitPolymorphDispatcher` (`:1713`); **no `$other`**; no stored `$variant` |
| 3 — `from` | `emitters/from.ts` | `emitFrom(config): string` (`from.ts:304`) | `storageKey` param → `slot.storageKey`; `slot.kinds` (not `slotKindNames`); keyword-presence via cached `slot.storageInfo?.kind` (EmitDRY-2); **§H-fold: ONE path** — dispatch structurally on the concrete arm (replaces `emitPolymorphDispatcher` `from.ts:1110/1293`); **no `$other`**; no stored `$variant` |
| 4 — wrap | `emitters/wrap.ts` | `emitWrap(config): string` (`wrap.ts:80`) | reads `slot.arity`/`slot.storageKey`; `collectConcreteStorageKeys` routes on `slot.isUnnamed`; **§H-fold: ONE path** — dispatch on the concrete arm (`$type` for kind-arm, literal for literal-arm); replaces the wrap polymorph path (`wrap.ts:158-197`) + dispatch maps (`:305-322`); **`$other`** bucket lives HERE + its rust-reader twin only |
| 5 — transports | `emitters/transport-common.ts`, `transport-projection.ts`, `transport-projection-cache.ts` | `buildSupertypeTransportSet(nodeMap)` (`transport-common.ts:71`) + projection builders | read `slot.values`/`slot.kinds`; **no `$other`**; no stored `$variant` |
| 5/6 — render bridge | `emitters/render-module.ts` | `emitRenderModule(...)` (`render-module.ts:2456`), `emitRenderModuleBundle(...)` (`:436`), `emitHashFiles(...)` (`:2315`) | per-slot separator from value stamp (drop node-wide `meta.separators`); structural arm dispatch on `$type`/literal (not "is-polymorph", §H-fold) |
| 6 — template renderer | `emitters/templates.ts` | `runTemplateEmitter(config): EmittedTemplates` (`templates.ts:1608`); per-modelType `emitBranchTemplate`/`emitGroupTemplate`/`emitMultiTemplate`; shared `emitRule(rule, ctx)` (`:780`) | reads **`node.renderRule`** (non-lossy). **§H-fold:** `emitPolymorphTemplate` folds into `emitBranchTemplate` (a polymorph IS a branch with a discriminating slot — its arms render via the slot's `values`); no separate polymorph dispatch in templates. **DELETED:** legacy `emitBodyForNode` + `emitJinjaTemplates`; the `case 'terminal'` arms (`templates.ts:605`, §G-cut); the dead `snakeToCamel` copy (`templates.ts:137`, EmitDRY-5) |
| build artifact — serialized Model | `emitters/node-model.ts` | `emitNodeModel(config): string` (`node-model.ts:172`), `buildNodeModel(nodeMap)` (`:178`) | **absorbs** factory-map's 5 maps (§6) incl. dispatch-ready `polymorphVariants` + `$variant` (diagnostics/validate-only) |
| — | `emitters/factory-map.ts` | **DELETED** (`emitFactoryMap`/`buildFactoryMap` fold into `node-model.ts`, §6) | — |

Other emitter modules **UNCHANGED** (support artifacts, not the 6 projections):
`ir.ts` (`emitIr`), `is.ts` (`emitIs`), `consts.ts` (`emitConsts`),
`kind-id-rust.ts` (`emitKindIdRust`), `grammar.ts` (`emitGrammar`),
`index-file.ts` (`emitIndex`), `suggested.ts` (`emitSuggested` — now also drains
the `DiagnosticSink`'s `suggestion` fields), `shared.ts`
(`classifyFactoryShape`/`resolveFactoryFieldNames` — now called by
`node-model.ts`), `engine.ts`, `client-utils.ts`, `config.ts`,
`render-module-paths.ts`, `render-module-runner.ts`, `template-hash.ts`,
`type-test.ts`, `parity-fixtures.ts`, `refine-emit.ts`, `kind-discriminant.ts`.

> **Emit-DRY tightenings (audit confirmed the rest of §7.2; these are the new
> deltas — all fold into EXISTING PRs, no new PR).**
> 1. **`slot.kinds` is the one surface; delete `slotKindNames` (EmitDRY-1).**
>    `slotKindNames` (`shared.ts:124`, NON-deduped, includes unresolved) and
>    `kindsOf` (`node-map.ts:1526`, deduped) are two parallel kind-name
>    derivations with **divergent semantics**, read across factories/from/types/test.
>    The deduped `kinds` getter (CW4) is canonical; `slotKindNames` deletes;
>    callers read `slot.kinds`. → lands in **PR-B** (the getter) / **PR-F** (the
>    factory+from+types re-point).
> 2. **Keyword-presence reads the cached `slot.storageInfo.kind` (EmitDRY-2).**
>    `keywordPresenceKind` (`shared.ts:777`) is re-run uncached in
>    consts/from/types/test, but `classifyFieldStorageInfo` (`shared.ts:848`)
>    ALREADY memoizes it as `slot.storageInfo.kind` (`shared.ts:939/953`).
>    Behavior consumers read `slot.storageInfo?.kind === 'boolean' | 'bitflag'`,
>    not a fresh `keywordPresenceKind(...)` call. → **PR-F** (factory/from/types
>    re-point); the cached precompute already exists.
> 3. **`form.discriminatorKindsOrDefault` getter (EmitDRY-3)** on `AssembledGroup`
>    (§7.3) replaces the byte-identical fallback at `factory-map.ts:146` +
>    `wrap.ts:310`. → getter in **PR-B**; consumers re-point in **PR-D** (wrap) /
>    **PR-K** (factory-map→node-model).
> 4. **`slot.isUnnamed` getter (EmitDRY-4)** = `fieldName === undefined`, the 8
>    behavior sites read it (Finding 5). → getter in **PR-B**, re-point in **PR-C**.
> 5. **Delete dead `snakeToCamel` (`templates.ts:137`) (EmitDRY-5)** — duplicate
>    of canonical `node-map.ts:343`, zero in-file callers. → housekeeping in
>    **PR-H** (or any emit-touching PR); the test import re-points.

> **KEEP-clarification — what stays a shared FUNCTION (not a Model getter), and
> why (makes the keep-decision visible).** `classifyFactoryShape` /
> `resolveFactoryFieldNames` STAY shared functions in `shared.ts` (single-sourced),
> **NOT** `node.factoryShape` getters: `classifyFactoryShape` takes an
> `options.includeTokenText` flag (from.ts vs factories.ts ask *different
> questions* of the same node), so it is a **per-consumer query, not a single node
> fact** — a getter would lose that variance. Likewise the transport-enum build,
> the leftmost-immediate-adjacency test, and per-slot-separator are **correct
> per-emitter Model-reads** (each emitter owns its projection of shared Model
> data, JC2) — they stay as-is. The pattern to FOLLOW is the
> `storageInfo`/`slotClass` **precompute-and-cache** passes (computed once at
> Assemble, read field-style by emitters) — that is the shape EmitDRY-1/2/4
> converge on; it is NOT a license to turn every per-consumer query into a getter.

### §7.3 The `AssembledNode` class hierarchy (complete)

`AssembledNonterminal` becomes a class (§2 — full definition there). The node
class hierarchy is **already class-based**; only the listed members change.

| Class | Status | End-state note |
|---|---|---|
| `AssembledNodeBase<R>` | REFINED — see `node-map.ts:1281` | **DELETED method:** `renderTemplate()` (PR3). `protected rule: R` getters (`members`/`separator`/`isTextTemplate`) read `renderRule` after the RawRule snapshot is dropped (§4 FLAG). **NEW memoized getters (replace the deleted fixpoint pass + stored fields, §7.7):** `isParameterless` + `stampExpression`/`stampChildExpression` — recursive over `slot.values[].node`, cycle-guarded (in-progress = not parameterless), memoized per node; terminal subclasses override the base case. **Stored field populated by a `(node, ctx)` pass, read field-style:** `userFacing` (set by `markUserFacing` — cross-node, NOT a getter). Otherwise unchanged (`kind`/`typeName`/`factoryName`/`irKey`/`source`/`hidden`) |
| `AssembledNonterminal` | **REFINED → CLASS** (§2 full def) | the slot class; getters `storageName` (the ONE identity)/`storageKey`/`parseNames`/`configKey`/`propertyName`/`paramName`/`arity`/`isRequired`/`isMultiple`/`isNonEmpty`/`hasTrailing`/`hasLeading`/`kinds`. Stored: `fieldName`/`values` (each value carries `kind`+`parseKind` refs, §7.3)/`source` (provenance, incl. retained `'inferred'`)/**`sourceRuleIds: RuleId[]`** (FOLD-1 — ALL renderRule+simplifiedRule position ids, was `sourceRuleId?`)/`storageInfo`. **DELETED:** the `name` field/alias (one identity: `storageName`); stored `storageName`/`propertyName`/`configKey`/`paramName`/`hasTrailing`/`hasLeading`/`origin`; the `_new` suffixed fields; **the slot-level `aliasSources` map (→ per-value `parseKind`) + the stored `#refKindNames` (→ `kinds` projects `values`)**; `SlotSource` variant `'inlined'` only (`'inferred'` retained as provenance) |
| `AssembledBranch` | REFINED — see `node-map.ts:2586` | `_slots` record now holds `AssembledNonterminal` instances; `slots`/`fields` getters unchanged. **ABSORBS `AssembledPolymorph` (§H-fold):** a branch with a **discriminating choice slot** (`slot.values.length > 1`) carries `discriminatingSlot?: string` (the slot's `storageName`) + `variantChildKinds` (now derived = `discriminatingSlot.kinds`, not stored from forms). The former `structuralSlotRecordFromForms` (`node-map.ts:2131`) cross-arm union + optionality-relax generalizes into the branch slot merge. **Arm name is a DERIVED property `armNameOf(slot, value, parentKind)` (§4f)** — registration provides only the priority-1 override name + the discriminating-slot marker + `$variant` validation, NOT a stored per-arm name. **DELETED:** `renderTemplate()`; `children` getter already retired (returns `[]`) |
| `AssembledPolymorph` | **DELETED (§H-fold) — PENDING** (still present at `node-map.ts:2599-2710`; union member at `node-map.ts:3163`) | Removed entirely; `modelType:'polymorph'` removed from the `AssembledNode` union (`node-map.ts:3163`). A polymorph kind is now an `AssembledBranch` with a `discriminatingSlot`; each form = one arm of that slot. The per-form `AssembledGroup` (the prior `PolymorphSpec`/`FormSpec` dissolution, §B) is gone — arms are `ChoiceRule` members fully modeled by the slot's `values` (kind-arm = `NodeRef`, literal-arm = `TerminalValue`) |
| `AssembledGroup` | REFINED — see `node-map.ts:3659` | hidden synthesized-group; `fields`/`children` unchanged, but **built from the wire-synthesized helper kind** (grammar-visible, `kindId`, §D), not Link's deleted opaque GroupRule classifier. **NEW getter `discriminatorKindsOrDefault` (EmitDRY-3)** `= discriminatorKinds ?? [\`${parentKind}_${name}\`]` — the byte-identical fallback duplicated at `factory-map.ts:146` + `wrap.ts:310`; both consumers read the getter (a polymorph form IS an `AssembledGroup`). **DELETED:** `renderTemplate()` |
| `AssembledMulti` | REFINED — see `node-map.ts:3617` | `elementRule`/`separator`/`nonEmpty`/`trailing`/`leading` unchanged. **DELETED:** `renderTemplate()` |
| `AssembledSupertype` | UNCHANGED — see `node-map.ts:3573` | `subtypes` getter |
| `AssembledLeaf<R>` (abstract) | UNCHANGED — see `node-map.ts:3393` | base for the four leaf classes |
| `AssembledPattern` | REFINED — see `node-map.ts:3406` | `pattern` getter. **Constructed from `PatternRule` + the natural terminal subtree** (`seq`/`string`/`token`), selected by the `isTerminalShaped` predicate (§G-cut) — was `PatternRule | TerminalRule`. The `TerminalRule` wrapper no longer exists; the accepted type narrows accordingly. |
| `AssembledTerminalShape` note | — | No new class: a `TerminalRule`-shaped leaf classifies to `modelType:'pattern'` → `AssembledPattern`. The predicate replaces the rule type. |
| `AssembledKeyword` | REFINED — see `node-map.ts:3419` | `text` getter; **overrides `isParameterless` → `true` and `stampExpression` → the text literal** (base case of the recursive getter; was a constructor field-set) |
| `AssembledToken` | REFINED — see `node-map.ts:3463` | `text` getter; overrides `isParameterless`/`stampExpression` (base case) + `stampChildExpression` |
| `AssembledEnum` | REFINED — see `node-map.ts:3543` | `values` getter. **Constructed from a plain `ChoiceRule`** (selected by `isEnumShaped`, §G-cut) — was an `EnumRule`. **`.values` flattens nested string leaves** to the flat literal list (a recursive literal-choice yields one value set). Transport per-slot enums read this node (insulated from the rule-IR cut). |

Slot **value** types (on `AssembledNonterminal.values`): `NodeRef`
(`node-map.ts:166`), `TerminalValue` (`:193`), `NodeOrTerminal` union,
`UnresolvedRef` (`:128`) — carry per-value
`multiplicity`/`separator`/`trailing`/`leading`/`immediate`/`tokenized`,
the non-droppable render facts.

> **Per-value parse-naming (the parse-naming decomposition).** Each value carries
> **two kind REFERENCES** (objects with `.name` + a kindId, per all-literals-are-kinds
> §4g) — NOT bare strings:
> - **`value.kind`** = the **render/source** kind ref — what to render / recurse
>   into. (For `NodeRef` this is today's `node` *name* promoted to a ref; for
>   `TerminalValue` the literal's own kind.)
> - **`value.parseKind`** = the **parse-as / CST** kind ref — the alias **target**
>   when a real tree-sitter alias, the validation-only **base** when a variant,
>   else the value's **own** kind. **`TerminalValue.resolvedKind` (today a
>   kind-name string, `node-map.ts:196`) IS `parseKind`** → becomes `parseKind`,
>   a kind ref.
>
> This is where the slot-level `aliasSources` map dissolves (§1 / §2): the
> render-vs-parse distinction is now PER VALUE (`kind` vs `parseKind`), so a slot
> needs no `{target: source}` map. The two `AssembledNonterminal` projections
> read straight off the values: `kinds = values.map(v => v.kind.name)` (render),
> `parseNames = values.map(v => v.parseKind.name)` (parse). The `type_query`
> dual (a real-alias target AND a validation-only base for different arms) is
> preserved naturally — each arm-value carries its own `parseKind`.
>
> **⚠ Naming-collision flag:** `NodeRef`/`TerminalValue` already use a field named
> `kind` as the union *discriminant* (`'node-ref'`/`'terminal'`,
> `node-map.ts:167/193`). Adding `value.kind` as the render-kind ref collides.
> Resolve at PR-B: rename the discriminant (e.g. `tag: 'node-ref'|'terminal'`, or
> rely on the `isNodeRef`/`isTerminalValue` guards) so `kind` is free for the
> render-kind ref. (Implementation-plan detail; the design intent — `value.kind`
> = render ref, `value.parseKind` = parse ref — is unaffected.)

> **MO2 — extract `SlotValueBase`.** `NodeRef` and `TerminalValue` share fields
> (the discriminant, `multiplicity`, `separator?`, `trailing?`, `leading?`, AND
> now `kind`/`parseKind`). Extract a `SlotValueBase` both extend (carrying the
> shared `kind`/`parseKind` refs + cardinality/flank); each adds only its own
> payload (`NodeRef.node`; `TerminalValue.value`/`immediate?`/`tokenized?`). The
> `NodeOrTerminal` union + the `isNodeRef`/`isTerminalValue` guards are unchanged.
> Pure structural de-dup — no behavior change. `FieldStorageInfo` (`:161`) +
> `BranchSlotClass` (`:149`) UNCHANGED.

### §7.4 Rule IR (already extended — PR0 shipped)

**The leaf-attribute extension the brainstorm calls for is ALREADY DONE.**
`RuleBase` (`rule.ts:59`) already carries `fieldName` / `multiplicity` /
`nonterminal` / `separator` / `aliasedFrom` / `aliasNamed` on EVERY variant —
no parallel type was introduced (#11 satisfied). End-state:

| Rule IR piece | Status |
|---|---|
| `RuleBase` (the leaf attributes) | UNCHANGED — see `rule.ts:59-88` |
| `Multiplicity` | UNCHANGED — see `rule.ts:37` |
| `Rule` union | REFINED — drop the wrapper members (PR3), the sittir-invented members (`VariantRule`/`PolymorphRule`/`ClauseRule`, §B/§C), AND the content-classification members (`EnumRule`/`TerminalRule`, §G-cut below); see below |
| `RenderRule` / `SimplifiedRule` branded types | UNCHANGED — see `rule.ts:144/160` (the `Exclude<…>` of wrapper types becomes a no-op once they delete) |
| Structural members kept | `SeqRule`, `ChoiceRule`, `GroupRule`, `SupertypeRule`, `StringRule`, `PatternRule`, `IndentRule`, `DedentRule`, `NewlineRule`, `SymbolRule`, `TokenRule` — UNCHANGED |
| Variants **DELETED — wrappers** (PR3, info pushed to `RuleBase`) | `OptionalRule`, `FieldRule`, `RepeatRule`, `Repeat1Rule`, `AliasRule` |
| Variants **DELETED — sittir inventions, Model-only** (§B/§C, this spec — they violate #16: no grammar-visible kind underlies them) | `PolymorphRule`, `VariantRule` (→ `PolymorphSpec`/`FormSpec` classification side-channel; the structural rule is a plain `ChoiceRule`), `ClauseRule` (→ plain `optional(seq(fields))` structure) |
| Variants **DELETED — content classifications, now predicates + Model nodes** (§G-cut, this spec — both wrap a natural structural shape redundantly) | `EnumRule` (→ `isEnumLeaf`/`isEnumShaped` predicates over a plain `ChoiceRule`; the Model node `AssembledEnum` stays), `TerminalRule` (→ `isTerminalShaped` predicate over the natural `seq`/`string`/`token` subtree; the Model node `AssembledPattern` stays) |
| `RuleIdentity` deprecated alias | DELETED — see `rule.ts:95` |

End-state `Rule` union:
```ts
export type Rule =
  | SeqRule | ChoiceRule                    // structural grouping (wrappers gone)
  | SupertypeRule | GroupRule
  | StringRule | PatternRule                // terminals (the natural leaf shapes)
  | IndentRule | DedentRule | NewlineRule   // structural whitespace
  | SymbolRule | TokenRule;                 // references (Link resolves symbol; token kept for adjacency)
```
> Note: `TokenRule` is **kept** — it carries `immediate`/`tokenized` render
> adjacency (a non-droppable render fact, #0.4). `repeat`/`repeat1` cardinality
> survives as `multiplicity` on the leaf; `optional` as `multiplicity:'optional'`;
> `field` as `fieldName`; `alias` as `aliasedFrom`/`aliasNamed`.
> `VariantRule`/`PolymorphRule`/`ClauseRule` had **no grammar-visible kind**
> (sittir-side rewrites of a plain `choice` / `optional(seq)`) → Model side-channel
> (§B) or structure (§C). `EnumRule`/`TerminalRule` were **content classifications
> redundantly wrapped as Rule types** — the underlying grammar shape is a plain
> `choice`-of-strings (enum) or a `seq`/`string`/`token` leaf subtree (terminal),
> which the natural rule arms already handle; the classification is a predicate +
> a Model node, not a Rule member (§G-cut below).

#### §B. Polymorph / Variant are Model-only — superseded by the discriminating-slot model (§H-fold)

`PolymorphRule`/`VariantRule`/`PolymorphForm` were a **sittir-only rewrite** of a
grammar `choice` — there is no tree-sitter kind named "polymorph"; the parser
sees a `choice`. Per #16 the *structural* rule stays a plain `ChoiceRule`. The
**§H-fold supersedes the original `PolymorphSpec`/`FormSpec` side-channel** (which
fed the now-deleted `AssembledPolymorph`): a polymorph is just an `AssembledBranch`
with a **discriminating choice slot**, and each form is an arm of that slot,
already fully modeled by the slot's `values` (kind-arm = `NodeRef`, literal-arm =
`TerminalValue`). So **no per-form side-channel and no `FormSpec` survive** — the
arm metadata IS the slot's `values`.

What registration still contributes (metadata only, never gates emission, #17) is
a thin **marker** on the linked grammar:

```ts
// link.ts output (LinkedGrammar) — registration metadata, NOT a rule, NOT per-form
interface DiscriminatingSlotMarker {
  readonly parentKind: string;            // the branch with a discriminating choice slot
  readonly discriminatingSlotName: string;// WHICH slot discriminates (the marker's only job
                                          //   when a branch has 0-or->1 candidates, §H discriminator mechanism)
  readonly armNames?: Record<string, string>; // optional registered arm-name overrides (else derived, §H arm-naming)
  readonly source: 'promoted' | 'override';   // provenance, validate-only (#15)
}
```

- **Construction:** the deleted `AssembledPolymorph` is replaced by an
  `AssembledBranch` whose `discriminatingSlot` names the choice slot; its arms'
  slots come from the `ChoiceRule` arms via `collectSlots` (the former
  `structuralSlotRecordFromForms` cross-arm union + optionality-relax,
  `node-map.ts:2131`, generalizes into the branch slot merge). No
  `buildAssembledFormGroups`-per-form step — the branch IS the model.
- **The resolver (§4d) reads the slot's `values` arms**, not a `FormSpec`.
- **Verified import-shrink:** `PolymorphRule` is imported across **7** compiler
  files today (`optimize.ts`, `link.ts`, `node-map.ts`, `assemble.ts`,
  `evaluate.ts`, `wrapper-deletion.ts`, `rule.ts`); after §B + §H-fold, only the
  thin `DiscriminatingSlotMarker` survives (1–2 definition sites) and
  `AssembledPolymorph` is gone entirely.

#### §C. ClauseRule removal (NEW to THIS spec — did NOT land in PR3)

`ClauseRule` is the same anti-pattern: `detectClause` (`link.ts:2338`, called at
`link.ts:1733`) rewrites `optional(seq(string, field, …))` into a sittir-only
`ClauseRule` named after the *first* field — which **dropped secondary fields**
(`project_clause_multifield_gap`). Per #16 there is no grammar kind for a
"clause"; it is plain `optional(seq(...))`. Remove it:
- Delete `ClauseRule` from the `Rule` union (`rule.ts:113/232`), `isClause`
  (`rule.ts:440`), the `'clause'` case arms (`rule.ts:490/554`, `link.ts:287/1125`,
  `collect-slots.ts:151/480`), and `detectClause` (`link.ts:2338`).
- `optional(seq(fieldA, fieldB, …))` is left as plain structure; `collectSlots`
  distributes the seq and derives a slot **per field** — so `fieldB` is no longer
  lost. **This closes `project_clause_multifield_gap` as a side effect.**
- The `optional` multiplicity is already on the leaf (`RuleBase.multiplicity`,
  PR0), so the old `collect-slots.ts:480` "clause forces optional" special-case
  is unnecessary — the fields carry their own optionality.

#### §G-cut. Enum + Terminal → content predicates (NEW to THIS spec)

`EnumRule` and `TerminalRule` are **content classifications redundantly wrapped
as Rule types** — Assemble *already* recomputes both as a fallback predicate
(`classifyTerminalFallback` `assemble.ts:1546`, whose `isAllTextShape`
`assemble.ts:1561` is the terminal predicate; `classifyHiddenChoiceRule`
`link.ts:1979` is the enum rewriter). Per #16/#1 the classification is a
**predicate over the natural structural shape + a Model node**, not a Rule
member. Both leave the `Rule` union; the Model nodes `AssembledEnum` /
`AssembledPattern` stay. (This reverses the prior "deferred" note now that the
dig is complete.)

> **§7.4 layer unification (§4g).** At the **slot layer** a literal-arm
> (`TerminalValue`) and a kind-arm (`NodeRef`) are **one concept — both are arm
> KINDS** (`armKind(v) = v.kind.name`, the per-value render-kind ref, §7.3
> parse-naming). There are **no enum/polymorph rule types** (consistent with the
> `EnumRule`/`PolymorphRule` deletions): a choice slot's arms are uniformly kinds,
> named by tree-sitter, dispatched structurally on `v.parseKind` (§4d).
> `AssembledEnum` is retained only as the *standalone leaf* choice-of-literals
> kind (which ELEVATE produces, §4h); `TerminalValue` is retained only for its
> render `value` (#0.4) — neither is a Rule member.

**Shared predicates (composition order; live in `rule.ts` or a `predicates.ts`):**
```ts
// 1. base leaves
isTerminalShaped(rule)  // reconciles link.ts:1663 isTerminalShape + assemble.ts:1561 isAllTextShape
                        //   into ONE predicate: a seq/string/token subtree with no fields/symbols
isEnumLeaf(rule) = rule.type === 'string'   // StringRule ONLY — closed literal set
                                            //   (pattern/token deliberately excluded: not a closed set)
// 2. enum on top (RECURSIVE — the end-state)
isEnumShaped(rule) = isEnumLeaf(rule)
  || (rule.type === 'choice' && rule.members.length > 0 && rule.members.every(isEnumShaped))
```

**Terminal (clean — no behavior change).**
- Delete `TerminalRule` from the union + the `isTerminal` guard (`rule.ts:444`).
- Delete `promoteAndLogTerminalRules` (`link.ts:389`, called `:138`) as a
  rule-rewriter.
- Delete every transparent `case 'terminal'` arm: `wrapper-deletion.ts:155`;
  `simplify.ts:404/734/1159/1222`; `optimize.ts:484/546/718`; `rule.ts:485/556/925`;
  `templates.ts:605` (`isLeftmostTerminalImmediate` now recurses one level
  shallower — onto the natural `seq`/`string` subtree, no render fact lost since
  the terminal wrapper was transparent).
- At Assemble, `classifyTerminalFallback` uses `isTerminalShaped` →
  `modelType:'pattern'`. **The `throw` at `assemble.ts:1549` becomes the normal
  path** (the predicate-driven classifier is now primary, not a fallback).
  `AssembledPattern` narrows its accepted rule type to `PatternRule` + the
  natural leaf subtree (was `PatternRule | TerminalRule`).

**Enum (flat = byte-identical; recursive = end-state, count-gated).**
- Delete `EnumRule` from the union + the `isEnum` guard (`rule.ts:441`).
- `normalizeEnumMembers` (`rule.ts:276`) keeps ONLY the single-literal →
  `StringRule` collapse; otherwise returns a plain `ChoiceRule` (no `EnumRule`).
- `evaluate.ts:268` `choice()` stops emitting `EnumRule`; the enum branch of
  `classifyHiddenChoiceRule` (`link.ts:1981`) is deleted as a rewriter.
- Delete every `case 'enum'` arm: the `link-refine` `Choice | Enum` union
  narrows to just `Choice`; `rulesEqual`'s enum arm folds into the choice arm;
  the leaf arms in `simplify`/`optimize`/`rule.ts`.
- **Transport per-slot enums read `AssembledEnum` (the Model node), so they are
  insulated** from the rule-IR cut (`project_universal_per_slot_enums`).
- At Assemble, `isEnumShaped` → `AssembledEnum`; its constructor takes the
  `ChoiceRule`, and **`.values` flattens nested string leaves to the literal
  list** (so a nested literal-choice yields one flat value set).

**R2 (discovery) — resolved, not a blocker.** `TerminalRule.content` IS read
post-Assemble at `templates.ts:605` (the immediate-leftmost adjacency test). But
the read is on the *transparent wrapper's* content — deleting the wrapper means
`isLeftmostTerminalImmediate` recurses directly onto the same `seq`/`string`
subtree it would have unwrapped to. The render fact (leftmost-immediate) is
preserved; only the wrapper hop is removed. So `Terminal` is a clean cut, not a
deferral.

**Behavior change + staging (Enum).** Today's enum check is **flat** (no
nested-choice flattening); the recursive `isEnumShaped` NEWLY classifies nested
literal-choices as enums — a **count move**. The recursive form is the
END-STATE; the PR sequence STAGES it:
1. **Flat shape-identical step** (in the main Enum-cut PR): use
   `choice && members.every(isEnumLeaf)` (no recursion) — gated to **0 diff vs
   today's `EnumRule` set**.
2. **Count-gated recursive-widening PR**: switch to the recursive `isEnumShaped`,
   explicitly count-gated (the newly-classified nested choices are reviewed +
   regen'd; pass-rate must hold).

> **Discovery (measured + cited) — the nested-literal-choice widening delta is
> tiny.** Probed post-`optimize` rules across all 3 grammars (evaluate→link→optimize,
> counting `choice` nodes that are recursive-enum-shaped but NOT flat-enum):
> **rust 0, typescript 1, python 0**. (Measurement caveat: most enums are already
> `EnumRule`-typed by `optimize`, so this counts the *residual* un-classified
> nested choices — the true delta the recursive predicate newly catches. It is
> ≤ a handful.) The widening is therefore a near-no-op count move, safely
> count-gateable in its own small PR.

### §7.5 Diagnostic severity model + the gate (NEW)

Full definitions in §4b (severity model + gate), §4c (content slot), §4d
(polymorph dispatch). Inventory: `compiler/diagnostics.ts` exports
`DiagnosticSeverity` (`'fail'|'warn'|'info'`), `Diagnostic`, `DiagnosticSink`
(class), `EmitHaltedError`; `compiler/emit-gate.ts` exports
`assertEmittable(nodeMap, sink)`. The sink is constructed in `generate.ts` and
threaded through every phase context (§7.7). The `$other` shape (Q4 / JC5): a
wrap-only key, **not** a Model type — it appears only as a generated property in
`wrap.ts` output + the rust reader, never as an `AssembledNonterminal` or a
`types.ts`/`factories.ts` surface, and **never renders**. A non-empty `$other`
is `fail{code:'unslotted-child'}`.

### §7.6 `NodeMap` (the assembled Model container)

`NodeMap` (`compiler/types.ts:459`) is **UNCHANGED in shape**. End-state notes:
`nodes: Map<string, AssembledNode>` now holds nodes whose slots are
`AssembledNonterminal` instances; **`slotByRuleId` (`:475`) maps EACH id in a
slot's `sourceRuleIds` → that slot** (FOLD-1 — every renderRule + simplifiedRule
position the slot occupies, so a lookup hits regardless of which view the
consumer walks; today's single `sourceRuleId` registers only one position and
misses the other). The `rules?` field's docstring referencing "the template
walker" (`:484`) updates (walker deleted) but the field stays
(Simplify/inlineRefs read it).
`nodeByRuleId`/`signatures`/`derivations`/`word`/`polymorphFormKinds`/`externals`
unchanged.

### §7.7 Phase context types (NEW) + uniform method signature

Principle #14: every pipeline method is `<operation><ObjectType>(target, ctx)`.

```ts
// compiler/transforms.ts — the shared base ctx, declared ONCE (CW5).
// Every shared transform takes a TransformCtx; the phase ctxs are defined
// in terms of it, so there is no "structurally satisfies" prose to drift.
export interface TransformCtx {
  readonly rules: Record<string, Rule>;      // full rule map (for inline lookups)
  readonly inlineKinds: ReadonlySet<string>; // grammar.inline targets
  readonly wordMatcher?: (s: string) => boolean;
  readonly diagnostics: DiagnosticSink;      // §7.5 — the derive-or-diagnose home
}

// compiler/normalize.ts — Normalize adds no phase-shared state of its own.
export type NormalizeCtx = TransformCtx;

// compiler/simplify.ts — Simplify carries the same phase-shared state.
// NOTE (CW6): `inField` is NOT here. It is recursion-LOCAL traversal state
// (whether the current node is inside a field()), not phase-shared state, so
// it stays an explicit recursion parameter on the methods that need it
// (`simplifyRule(rule, ctx, inField)` / `collapseSeq(rule, ctx, inField)`).
// Conflating per-node traversal state with phase ctx is exactly the kind of
// scope-creep this refactor removes.
export interface SimplifyCtx extends TransformCtx {}

// compiler/assemble.ts — Assemble needs only the kind table + the sink.
export interface AssembleCtx {
  readonly kindEntries?: readonly GeneratedKindEntry[];
  readonly nodeMap: NodeMap;                 // cross-node access for the post-passes
                                             //   (markUserFacing/resolveColliding/resolveIrKeys/collectAnonymous/…)
                                             // — this is how #14 keeps them `(target, ctx)`, not getters-with-arg.
                                             // NOTE: isParameterless is NOT here — it is a memoized getter that
                                             // follows resolved slot refs directly (no nodeMap lookup needed).
  readonly diagnostics: DiagnosticSink;      // slot diagnostics emit here (anonymous-content warn, unslotted-child fail, …)
}
```

Shared `transforms.ts` ops take a `TransformCtx`; `NormalizeCtx` (an alias) and
`SimplifyCtx` (an extension) both ARE one, so the call sites need no widening.
The uniform `(target, ctx[, recursionState])` shape — with recursion state kept
explicit and separate from `ctx` — enables the single trace wrapper (#14 note;
`compiler/trace.ts` is the seed).

**Scope of the convention.** `<operation><ObjectType>(target, ctx)` applies to
**pipeline methods** — the phase-level operations that transform/classify/build a
`Rule` / `AssembledNode` / `NodeMap`. It does NOT apply to **pure local helpers**
(predicates, string utils, structural-equality, prefix/suffix finders) — those
are leaf functions with no `target+ctx` semantics (`findCommonPrefix`, `isLeaf`,
`needsSpace`, `rulesEqual`, `dedupeByJson`, `countReferences`, …). They stay
private to their module. The forcing function bites only on *pipeline methods*;
this section makes the pipeline-method set exhaustive and refactors every
non-conformer.

**Exhaustive pipeline-method map (END-STATE).**

*Phase entry points:*

| End-state | Was | Module |
|---|---|---|
| `link(raw, ctx)` | `link(raw, include?)` (signature only — `include?` → `ctx`) | `link.ts` |
| `normalizeGrammar(linked, ctx)` | `optimize(linked, inlineKinds?)` | `normalize.ts` |
| `computeSimplifiedRules(renderRules, ctx)` | `computeSimplifiedRules(renderRules, word, inlineKinds?)` | `simplify.ts` |
| `assembleModel(normalized, ctx)` | `assemble(optimized)` | `assemble.ts` |
| `assertEmittable(nodeMap, sink)` | (new) | `emit-gate.ts` |

*Rule transforms (target=`Rule`, ctx=`TransformCtx`/`Normalize`/`Simplify`):*

| End-state | Was | Module |
|---|---|---|
| `pushdownWrappers(rule, ctx)` | `applyWrapperDeletion` / `deleteWrapper` | `transforms.ts` |
| `inlineRefs(rule, ctx)` | `inlineRefs(rule, rules, inlineKinds?, visited?)` | `transforms.ts` |
| `collapseSeq(rule, ctx, inField?)` | `collapseSeq(rule, wordMatcher?, inField?)` | `transforms.ts` |
| `canonicalizeSeqOfLeaves(rule, ctx)` | same (positional args → ctx) | `transforms.ts` |
| `pushAttrsToLeaves(rule, ctx)` | `pushAttrsToLeaves(rule, mult, sep, fieldName)` | `transforms.ts` |
| `simplifyRule(rule, ctx, inField?)` | `simplifyRule(rule, wordMatcher?, inField?)` | `simplify.ts` |
| `fanOutSeqChoices(rule, ctx)` | same (positional) | `normalize.ts` |
| `factorChoiceBranches(rule, ctx)` | same | `normalize.ts` |
| `dedupeSeqMembers(rule, ctx)` | same | `normalize.ts` |
| `collapseWrappers(rule, ctx)` | same | `normalize.ts` |
| `resolveRule(rule, ctx)` | `resolveRule(rule, currentName, allRules, supertypes, externalRoles)` | `link.ts` (extra args → ctx) |
| `classifyHiddenRule(rule, ctx)` | `classifyHiddenRule(name, rule, supertypes, references)` | `link.ts` |
| `promotePolymorph(rule, ctx)` | same | `link.ts` |
| `applyOverridePolymorphs(rule, ctx)` | same | `link.ts` |
| `collectSlots(rule, ctx)` | `collectSlots(rule, kindForName?, kindEntries?, inherited?, sep?)` | `assemble.ts` |

*RuleMap transforms (target=the rule map):*

| End-state | Was | Module |
|---|---|---|
| `inlineSingleUseHidden(rules, ctx)` | same | `normalize.ts` |
| `hoistIndentIntoRepeat(rules, ctx)` | `hoistIndentIntoRepeat(rules)` | `link.ts` |
| `annotateBlockBearerFields(rules, ctx)` | same | `link.ts` |

*Assemble post-passes — REFACTORED to fit (the forcing function):*

`assemble.ts`'s post-passes (`assemble.ts:208–212`) today take the whole
`Map<string, AssembledNode>` positionally. Each is re-shaped to `(target, ctx)`
per its discovered responsibility — `ctx.nodeMap` absorbs the cross-node access,
so a pass is either per-node `(node, ctx)` or genuinely whole-map `(nodeMap, ctx)`,
and neither becomes a getter-with-arg:

| End-state | Was | Refactor (discovered responsibility) |
|---|---|---|
| `markUserFacing(node, ctx)` (`ctx.nodeMap`) — sets `node.userFacing` | `markUserFacing(nodes)` (`assemble.ts:1070`) **+ `markVariantChildrenUserFacing(nodes)` (`assemble.ts:1111`) MERGED into one (M3)** | **Refactor to ONE `(node, ctx)` method — NOT deprecated, NOT a getter.** Discovery: `userFacing` is a heavily-read live signal — `shared.ts:89/1250/1293`, `from.ts:1915`, `templates.ts:1696`, `types.ts:1340`, `factories.ts:376/830`, `render-module.ts:1521`, plus the validator (`rule-lookup.ts:62`) and `factory-map.ts:273`. Computed from **cross-node** state (is this hidden kind an alias source in some *other* node's slots; `assemble.ts:1092`) → needs `nodeMap`, so per #14 a `(node, ctx)` method, **not** a getter-with-arg. **M3:** the `markVariantChildrenUserFacing` follow-on (`assemble.ts:1111`) is the same "mark this node user-facing" decision restricted to variant children — it merges into the single method (one pass marks both the alias-source kinds and the variant children), not two passes. Emitters keep reading the populated `node.userFacing` field (field-read). |
| `node.isParameterless` / `node.stampExpression` — **memoized recursive getters** (no pass, no stored field) | `markParameterlessKinds(nodes)` fixpoint (`assemble.ts:713`) | **DELETE the fixpoint pass AND the stored field (Principle #1 — it re-derives what the node graph already encodes).** Discovery: the "pass" is pure re-derivation — *parameterless iff every required slot references a parameterless kind*, a recursion over the assembled graph. It becomes a **memoized, cycle-guarded getter** on `AssembledNode` (§7.3), computed on first access AFTER `hydrateSlotRefs` has resolved slot refs (so the getter can follow `value.node` → the referenced `AssembledNode` directly, without a `nodeMap` lookup → no `ctx` needed → a genuine getter, not a `(node, ctx)` method). **Cycle rule (replaces the fixpoint):** a node whose computation is *in progress* is treated as **NOT parameterless** — a required cyclic reference genuinely needs a parameter, which is correct and makes a memoized DFS terminate with no convergence iteration. The former helpers (`isAutoStampSlot`/`getSlotsForParameterless`/`_stampExpressionForSlot`) become private methods backing the getter. Consumers are **unchanged** — `shared.ts:337/403/1092` and `node-model.ts:213` already read `ref.isParameterless`/`ref.stampExpression` field-style off a node fetched from `nodeMap`; a getter is a drop-in (identical `node.isParameterless` access, now computed-on-read). Terminal classes (`AssembledKeyword`/`AssembledToken`) **override the getter base case** (return `true` + the literal stamp) instead of the old constructor field-set at `node-map.ts:3440/3479`. |
| `resolveCollidingNames(nodeMap, ctx)` | `resolveCollidingNames(nodes)` (`assemble.ts:1121`) | **Keep as a NodeMap-wide op** (renaming requires seeing all kinds at once) — conforms once `nodes`→`nodeMap` + `ctx`. The per-pair helpers (`renameCollidingHiddenKinds`, …) stay private. |
| `resolveIrKeys(nodeMap, ctx)` | `resolveIrKeys(nodes)` (`assemble.ts:600`) | **Keep as a NodeMap-wide op** (dedupe-aware short-name pass needs the whole map); conforms via `nodes`→`nodeMap` + `ctx`. |
| `collectAnonymousNodes(nodeMap, ctx)` | `collectAnonymousNodes(rules, nodes, wordMatcher, kindEntries)` (`assemble.ts:208`) | **Re-target to NodeMap + ctx.** The `rules`/`wordMatcher`/`kindEntries` args fold into `AssembleCtx`; it remains a whole-map collection pass (creates `AssembledKeyword`/`AssembledToken` entries). |
| `hydrateSlotRefs(nodeMap, ctx)` | `hydrateSlotRefs(nodeMap)` (`assemble.ts:994`) | Already NodeMap-shaped; add `ctx` for the diagnostics sink (unresolvable-ref logging → `warn`). |
| `classifyNode(rule, ctx)` | `classifyNode(kind, rule, opts?)` (`assemble.ts:109`) | target=`rule`; `kind`/`opts` (variantParents) fold into `ctx`. |

**Resolution of the prior `markUserFacing` / `markParameterlessKinds` open
issue (discover-first):** they resolve *differently* — the discovery showed they
are not the same shape.
- **`markParameterless` → REMOVED (pure re-derivation, Principle #1).** It is
  *parameterless iff every required slot references a parameterless kind* — a
  recursion the assembled node graph already encodes, so the separate fixpoint
  pass + stored field should not exist. It becomes a **memoized, cycle-guarded
  getter** on `AssembledNode` (cycle = not parameterless; terminates without
  convergence iteration). Because slot refs are resolved by `hydrateSlotRefs`
  before any emitter reads it, the getter follows `value.node` directly and needs
  no `nodeMap`/`ctx` — a true pure getter (#13). Consumers
  (`shared.ts:337/403/1092`, `node-model.ts:213`) are unchanged drop-ins.
- **`markUserFacing` → STAYS a `(node, ctx)` method.** Its derivation is
  genuinely *cross-node* (is this kind an alias source in some *other* node's
  slots — not encoded on the node itself), so it is not a pure self-read; it is a
  `(node, ctx)` method (`ctx.nodeMap`) populating `node.userFacing`. (Could also
  be expressed as a memoized getter only if the alias-source index were attached
  to each node; absent that, `(node, ctx)` is the conforming shape.)

The asymmetry IS the point of Principle #1 + the #14 getter/method line:
**a fact the graph already encodes (parameterless) is a memoized getter, never a
pass**; a fact requiring a cross-node index (userFacing) is a `(node, ctx)`
method. Neither is a getter-with-arg.

**Rule for whole-map operations:** a genuinely whole-map pass
(`resolveCollidingNames`, `resolveIrKeys`, `collectAnonymousNodes`,
`hydrateSlotRefs`) is a *legitimate* conforming shape — `target` is the
`NodeMap` and it takes a `ctx`. A per-node cross-node computation
(`markUserFacing`) is `(node, ctx)`. A graph-encoded fact (`isParameterless`) is
a memoized getter, no pass at all. The only thing the convention forbids — a
getter that takes an argument — **does not occur**. **Zero pipeline methods are
non-conforming, zero getters take arguments, and no derived fact is recomputed
by a separate pass when the graph already encodes it.**

---

## Resolved decisions

> All five questions are **DECIDED** (2026-05-22). The decisions are folded into
> the spec body (§1/§2/§4b/§4c/§5/§6/§7); this section is the decision log. Q3,
> Q4, Q5 diverged from the research agent's original recommendations — noted
> inline.

1. **Q1 — `slot.name` semantics.** Today `name` = snake_case storage name
   (read 65× across emitters); `storageName` equals it. The brainstorm wording
   "`name = camelCase(storageName)`" implies flipping `name` to camelCase. Flip
   (matches `_new`), or keep `name`=snake to minimize churn and only rename
   internally? Recommend: keep `name`=snake, rename the camel accessor
   explicitly. **This decision sizes PR-B.**
   - **✅ DECIDED (2026-05-22): `slot.name` = snake_case** — maximally consistent with kind/field/storage names (the whole Model speaks one casing). camelCase is a separately-named accessor / projection-time `snakeToCamel` transform (principle #3), not the canonical identity. Matches recommendation; minimal churn. **(UPDATED 2026-05-26:** `slot.name` is RETAINED as a **getter** over `storageName` — `storageName` is the canonical STORED identity; `name` is a pure projection alias with parity to `node.name`, so PR-B drops the read-site migration entirely. #1 still holds: one SOURCE, the getter can't drift.**)**

2. **Q2 — PR3 ownership.** PR3 (delete legacy walker / wrapper types /
   ClauseRule) is a hard prerequisite but is a *separate already-designed PR*
   (`1ebe0407`). Does this simplification spec absorb PR3, or does PR3 land
   first under its own spec and this spec start at PR-A? Recommend: PR3 lands
   first under its own design; this spec lists it as a gating prerequisite.
   - **✅ DECIDED (2026-05-22): PR3 lands separately** under its own design; this spec starts at **PR-A** and lists PR3 as a gating prerequisite. Matches recommendation.

3. **Q3 — heuristics-to-diagnostics aggressiveness (PR-I).** Converting
   `inferFieldNames` / `looksLikePolymorphCandidate` / choice-distribution to
   diagnostics means the corpus must already field-name everything those
   heuristics currently guess. If any grammar relies on a guess with no
   override, PR-I regresses until overrides are authored. Do we (a) author all
   missing overrides first (corpus sweep), or (b) keep the heuristic as a
   *fallback after* the diagnostic fires (warn-and-guess) during a transition?
   Recommend (b) for strangler-safety, with the diagnostic driving override
   authoring over time.
   - **✅ DECIDED (2026-05-22): FAIL, not warn-and-guess.** A captured failure emits a **fail-level** diagnostic; if any fail-level diagnostics accumulate through the end of **Assemble**, **emit is halted** (no incomplete Model is ever projected). Implies: (1) a diagnostic **severity model** (fail vs warn/info); (2) a single **gate between Assemble and Project**; (3) **PR-I sequencing** — author the overrides that clear each heuristic's fail-diagnostics *first*, then remove the heuristic. Strangler-safety comes from clearing diagnostics, not from a guess fallback. This makes principle #4 a hard gate.

4. **Q4 — `$children` removal blast radius.** Finding 3 / PR-D removes the
   `$children` storage key in favor of `_<kindName>`. This touches the native
   rust reader (kind-routing) and `render-module.ts`'s `pub children`. Is the
   native-side change in scope for this (codegen) spec, or does it need a
   paired rust-crate PR? Recommend: paired, gated together on rust
   read-render-parse ast count.
   - **✅ DECIDED (2026-05-22): `$children` → `$other`, parse-time-only.** A bucket for parsed children unassigned to any field. Exists **only in wrap (#4) + its native rust reader counterpart** — removed from factory/from/types/transport (constructed/typed surfaces carry only named slots; no catch-all). Blast radius is thus contained to the wrap/reader path (still a paired codegen+rust change *there*, gated on rust ast count), not all surfaces. Naming: `$other` (confirm vs `$unnamed`). **Spec follow-up:** since `$other` is off the typed/render surface, resolve what renders its content — likely a non-empty `$other` is a completeness signal (a diagnostic per Q3's fail-gate), since a complete Model slots every child.

5. **Q5 — the polymorph "no variant matched" warnings.** The baseline run
   surfaces `[nodeToConfig] polymorph 'token_tree_pattern': no variant matched`.
   `project_polymorph_dispatcher_slot_probe` says these are recoverable via a
   ~50-LOC slot-presence probe, NOT by removing `$variant`. Is fixing this in
   scope (it touches `polymorphVariants` which PR-H consolidates), or a separate
   follow-up? Recommend: separate follow-up, but PR-H should not make it harder
   to add the slot-presence probe.
   - **✅ DECIDED (2026-05-22): folded in, not deferred.** (1) **Compile-time "no variant matched" must never happen** — if it does, something is fundamentally wrong → **fail-level diagnostic, halt emit** (per Q3). Polymorph dispatch must be **deterministic + total** at compile time; the slot-presence probe is the *deterministic resolver* (resolve by slot presence; if it can't resolve, fail), never a runtime guess. (2) **`$variant` is diagnostics/validate-only** (like `node-model.json5`) — the shipped runtime resolves polymorphs by concrete kind + slots (wrap knows the kind; factory/`from` pick explicitly; render dispatches on kind/slots), so no stored discriminant ships in 1–6. The baseline `token_tree_pattern` warning is a real bug to fix via deterministic dispatch, gated by the fail-gate.
