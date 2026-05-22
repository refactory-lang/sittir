# Compiler Workflow Simplification — Design

**Date:** 2026-05-22
**Status:** 🚧 BRAINSTORM IN PROGRESS — objective set + phase structure framed; **Model contents** (the heart) and the **strangler PR sequence** still TODO. Not yet approved.
**Base:** off `master`, post-PR2 merge (`bbadd99b`).

---

## Scope & approach (decided)

- **Scope:** the full pipeline **+ emitters** (largest scope).
- **Primary pain:** *all three* — re-derivation/divergence, conditional special-casing, phase/representation sprawl. They share one root: **the same fact is derived in multiple places that drift apart** (this session's `block`-vs-`body`; the Codex stale-slot transport breaks).
- **Structure:** **incremental strangler, one spec** — build the new model beside the old, migrate phase/emitter at a time, regen+validate every step, **never regress** the pass rates (rust 178/134/107, python 104/95/73, ts 172/81/59).
- **Architecture:** **centralize & strangle the existing slot model.** Make `AssembledNonterminal` (with the `_new` naming getters) authoritative; derive slots uniformly; migrate each emitter (wrap → transport → bridge → render → types/factories) to **read** the slot via `slotByRuleId` instead of re-deriving. Defer phase/Rule-type collapse to last.
- **Refinement, not greenfield.** The Model and Rule IR *enhance* the existing `AssembledNonterminal` + Rule IR — never rebuild them. Concrete refinement: **make `AssembledNonterminal` a class** — following the existing class-based node model (`AssembledNode` is *already* a class, so this extends the established pattern rather than introducing one). It becomes the authoritative model object that encapsulates the naming derivation (today's `_new` getters) as methods. Emitters hold a reference and call `.storageName`/`.parseNames`/`.name`; re-derivation becomes impossible because there is no raw shape to re-walk. Same for the Rule IR: extend it with the leaf attributes (multiplicity/separator/fieldName/nonterminal) rather than introducing a parallel type — the strangler migrates *onto* it.

---

## Design Principles

**The Model (#0)**
1. **Single source of truth** — each fact has exactly one home in the Model, derived once; nothing re-derives it.
2. **Complete & non-lossy** — carries every fact 1–6 consume *and* every fact a rule states (both completeness directions coincide). Only sanctioned loss: rule types *proven* valueless to sittir (PREC-class).
3. **Pure** — derived *from and only from* grammar + overrides; deterministic transforms baked in; no opaque heuristics, no hardcoded assumptions.
4. **Derive-or-diagnose** — never guess; non-deterministic facts come from overrides, surfaced via diagnostics + suggestions. Completeness ⇔ no blocking diagnostics.

**The phases**
5. **One job per phase** — single responsibility, typed output, no cross-phase rewriting overlap.
6. **Lossy by consumer, not by default** — Normalize keeps everything; Simplify reduces *only* for the non-render emitters; the renderer reads the non-lossy source.
7. **Transforms are shared & idempotent** — defined once, re-applicable; Simplify reduces then re-applies to a fixpoint.
8. **Shared grammar layer** — Enrich/Wire run in both compilers, so the parser and the IR see the identical grammar.

**The projections (1–6)**
9. **Emitters are pure projections** — read the Model, never re-derive; each preserves its artifact's goal (compile-time validation, runtime validation, DX, lazy traversal, memory-efficiency, zero-copy).
10. **Build artifacts are single-sourced too** — one serialized Model (`node-model.json5`) for tooling/diagnostics; obviates `factory-map.json5`; never a production-runtime dependency.

**The approach**
11. **Refinement, not greenfield** — enhance the existing `AssembledNonterminal`/Rule IR; centralize via a class (encapsulation *enforces* single-source — no raw shape to re-walk).
12. **Strangler-safe** — new beside old, migrate incrementally, never regress the pass rates.

**Code organization**
13. **One module per phase** — each phase is exactly one file (`evaluate.ts`, `classify.ts`, `normalize.ts`, `simplify.ts`, `assemble.ts`, `emit.ts`); every method called within the pipeline lives in its phase module. Only exceptions:
    - (a) **transforms shared between Normalize & Simplify** → a shared transforms module (per #7);
    - (b) **per-artifact emitters** (`emitters/factory.ts`, `emitters/templates.ts`, …) dispatched from `emit.ts`;
    - (c) **shared rule helpers** → `rules.ts`.
    **Shared *node* methods don't exist** — node behavior lives on the `AssembledNonterminal` class (#11), not a util module.
14. **Uniform method signature & naming** — every pipeline method takes exactly two inputs: the **target** (a rule or node) and a **phase context** (`NormalizeCtx`, `SimplifyCtx`, …). It is named `<operation><ObjectType>` — the operation plus the type of object operated on (rule type / model type / slot class). E.g. `collapseSeq(rule: SeqRule, ctx: SimplifyCtx)`, `pushdownField(rule: FieldRule, ctx: NormalizeCtx)`. The context carries phase-shared state and the **diagnostics sink** (the home for #4's derive-or-diagnose) — methods never reach for globals.
    - *(Benefit, not a rule: the uniform shape means a single injected wrapper can provide trace-level probing across the whole pipeline — printing `methodName` + input per step — with no per-method instrumentation.)*

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

A **pipeline-wide channel**, not a 7th artifact. Discipline for every phase: **"derive deterministically, or diagnose — never guess."** Seed today: `overrides.suggested.ts` + the unnamed-choice diagnostic built this session.

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
| **Classify** *(was Link)* | classify *what each rule is* | Rule IR → classified IR | non-lossy |
| **Normalize** *(was Optimize)* | structural canonicalization, **non-lossy** | classified IR → normalized IR | **non-lossy** |
| **Simplify** | **LOSSY** — reduce rules, throwing out what isn't needed to emit *everything except the renderer* | normalized IR → reduced rules | **lossy (by design)** |
| **Assemble** | build the Model | normalized + reduced → the Model | — |
| **Project** (Emit) | the Model → each of 1–6 | the Model → artifacts | — |
| *Diagnostics* | *cross-cutting — "can't determine" → suggestion* | — | — |

**Key principles:**
1. **Evaluate is the input boundary** — it executes the (enriched/wired) `grammar.js` and produces the Rule IR; it does not itself enrich or wire.
2. **Normalize is non-lossy; Simplify is lossy *by consumer*.** Normalize keeps everything (the Model's retained source). Simplify is a **derived projection for artifacts 1–5** (types/factories/`from`/wrap/transport) — they need only slot structure, so Simplify discards render-only detail (literals, adjacency, spacing).
   - **Simplify reduces, then re-applies Normalize transforms (fixpoint).** Throwing out rules re-exposes normalizable shapes (single-member collapse, newly-adjacent leaves, collapsible wrappers). So Normalize's transforms are factored as **shared, idempotent operations** both phases invoke — Normalize to canonicalize the full rule, Simplify to re-canonicalize the reduced result. The re-application is non-lossy; only the reduction is lossy, done once. (Matches today's `inlineRefs`+`simplifyRule` fixpoint + the `deleteWrapper` final re-push, untangled.)
3. **The renderer (#6) reads Normalize's non-lossy output, NEVER Simplify's reduced rules.** This resolves the non-lossy-Model-vs-lossy-Simplify tension (different levels: Model = retained; Simplify = a 1–5 view) AND is the structural fix for the render-on-slot-path breaks (render was mis-fed the reduced view).
4. **Assemble is the sole Model-builder** (keystone) — from the normalized rules (non-lossy, render + completeness) + the simplified rules (slot view for 1–5).
5. **Enrich/Wire are shared, not sequenced.** They live in the `grammar.js` and run in both compilers; there is no Wire↔Evaluate ordering — Wire sees the evaluated base because it runs *during* evaluation.

---

## Open / TODO (next brainstorm steps)

- [x] **Phases confirmed** — Evaluate · Classify · Normalize (non-lossy) · Simplify (lossy, by-consumer) · Assemble · Project; Enrich/Wire are the shared grammar layer (run by both compilers).
- [→] **Define the Model's contents** — *delegated to the spec-writer research agent.* It enumerates the per-consumer facts (1→6) grounded in the existing emitters, as a **refinement** of `AssembledNonterminal`/Rule IR — not hand-specified here. Method: work outward from each projection's consumed facts, union into the (class-based) Model, cross-check against #0's non-lossy source-side completeness.
- [ ] **The strangler PR sequence** — proposed order: centralize naming (`_new` → the one rule) → collect-slots uniform derivation (kill distribution/origin) → wrap reads slot → transport → bridge → render → types/factories → (last) phase + Rule-type collapse.
- [ ] **Validation gate per step** — regen all 3 + `counts --backend native`; never regress rust 178/134/107, python 104/95/73, ts 172/81/59.
- [ ] **Settle Canonicalize's non-lossy mechanism** — leaf-attribute push (multiplicity/separator/fieldName/nonterminal) carries everything the collapse used to drop.

## References

- This session's findings: field-named-choice fix (python block family +39/+22), the `_new` getters, `origin` unreliability, the `inlineRefs`/distribution interactions, the `_suite`→`block` inline name-loss.
- Memory: `feedback_no_lossy_distillation`, `feedback_emitter_pattern_consistency`, `feedback_ruleid_backpointer`, `project_pr2_merged_and_collectslots_simplification`.
- The glossary agent (running) is documenting the **actual current** phases (`docs/compiler-phase-glossary.md`) — diff against this **ideal** framing once it lands.
