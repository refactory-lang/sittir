# Compiler Workflow Simplification — Design

**Date:** 2026-05-22
**Status:** 📋 SPEC RECONCILED — brainstorm (above) + code-grounded implementation spec §1–§7 (below); **all 5 decisions resolved + DRY/simplify review folded (2026-05-22)**. End-state is clean (no transitional aliases, no sunset PRs; old code is removed within the superseding strangler step). **Ready for user review → `writing-plans`.** 10 PRs (PR3 prereq + PR-A..PR-J). PR3 is a gating prerequisite (not yet landed — only its design doc is on this branch).
**Base:** branch `026-pr3-delete-legacy-render-walker` (off `master`, post-PR2 merge `bbadd99b`).

---

## Scope & approach (decided)

- **Scope:** the full pipeline **+ emitters** (largest scope).
- **Primary pain:** *all three* — re-derivation/divergence, conditional special-casing, phase/representation sprawl. They share one root: **the same fact is derived in multiple places that drift apart** (this session's `block`-vs-`body`; the Codex stale-slot transport breaks).
- **Structure:** **incremental strangler, one spec** — build the new model beside the old, migrate phase/emitter at a time, regen+validate every step, **never regress** the pass rates (rust 178/134/107, python 104/95/73, ts 172/81/59).
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
2. **Normalize is non-lossy; Simplify is lossy *by consumer*** — *per Principle #6 (canonical statement); not re-spelled here.* Simplify is a derived projection for artifacts 1–5; it discards render-only detail (literals, adjacency, spacing).
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

---
---

# IMPLEMENTATION SPEC (code-grounded expansion)

> **Authored by the spec-writer research agent, 2026-05-22.** Everything below
> this line makes the brainstorm above concrete and code-grounded. The
> brainstorm sections are the source of truth for *intent*; this section is the
> *how*, citing `file:line`. Where the code contradicts a brainstorm assumption
> it is flagged with **⚠ FLAG**.

## Pre-flight: actual PR3 state (verified)

The brainstorm and the dispatch brief both say "assume PR3 has landed." **PR3
has NOT landed.** The branch `026-pr3-delete-legacy-render-walker` carries only
the PR3 *design doc* (`1ebe0407 docs(pr3): design — delete legacy render walker
+ ClauseRule`) ahead of the PR2 merge `bbadd99b`. Verified by:

- `compiler/template-walker.ts` still exists (and is imported by
  `collect-slots.ts:50` — `import { findRepeatFlag } from './template-walker.ts'`).
- `ClauseRule` / the `'clause'` case still live: `collect-slots.ts:474` has a
  `case 'clause'` arm; `link.ts`'s `detectClause` still runs (glossary
  Phase 2, line 277).
- Wrapper rule types (`OptionalRule`/`FieldRule`/`RepeatRule`/`Repeat1Rule`)
  still exist as `applyWrapperDeletion`'s input (`rule.ts` `RuleBase` comment,
  glossary lines 92–94).
- `AssembledXxx.renderTemplate()` methods still exist and are still called
  (`render-module.ts:2324`, `templates.ts:1615`, `node-map.ts:2343/2364`).

**Consequence for this spec.** This spec is *written for* the post-PR3 world (it
does not propose anything depending on the legacy walker or wrapper rule types
surviving), but the **strangler PR sequence below makes PR3 its first
prerequisite phase** rather than assuming it. The pass-rate baseline this spec
must not regress, re-measured on this branch via
`pnpm exec tsx packages/validator/src/cli.ts counts --backend native rust`:

```
rust/native:   cov 178/185   read-render-parse 134/136 ast=107   from 133/168
```

matching the brainstorm's `rust 178/134/107`. (python `104/95/73`, ts
`172/81/59` are quoted from the brainstorm; re-measure per grammar at each PR
gate — see cleanup-rules §D2.)

---

## §1. Model contents — worked outward from each consumer

The Model's job (#0): carry **every fact 1–6 consume** (consumer-side
completeness) **and every fact a rule states** (source-side completeness). This
section reads each emitter, lists the facts it consumes *today*, then unions
them into the class-based `AssembledNonterminal` + the Rule IR. The key
finding: **almost every fact already has a home** on `AssembledNonterminal`
(`node-map.ts:1543`), `NodeOrTerminal` (`node-map.ts:168/195`), or `RuleBase`
(`rule.ts`). The pain is **re-derivation**, not missing fields — three parallel
naming derivations (`name`/`storageName` vs the `_new` getters vs wrap.ts's
`SlotModel`) and one parallel projection type (`SlotModel`,
`compiler/slot-model.ts:4`).

### The slot fact inventory (current homes)

`AssembledNonterminal` (`node-map.ts:1543–1575`) currently carries:

| Fact | Field | Home today | Note |
|---|---|---|---|
| display name | `name` | `node-map.ts:1544` | LEGACY derivation (`buildSlot`, `collect-slots.ts:304`) |
| property name (camel, plural) | `propertyName` | `:1545` | |
| config key (singular camel) | `configKey` | `:1547` | |
| storage name (TS-facing) | `storageName` | `:1548` | LEGACY — equals `name` today |
| value list | `values: NodeOrTerminal[]` | `:1549` | the value-union; carries per-value multiplicity/separator/immediate |
| param name | `paramName` | `:1550` | |
| trailing/leading separator flags | `hasTrailing`/`hasLeading` | `:1551–1552` | ⚠ also duplicated per-value on `NodeRef`/`TerminalValue` |
| alias source map | `aliasSources?` | `:1553` | `{target: source}` |
| provenance | `source` | `:1554` | grammar/override/inlined/enriched/inferred |
| name origin | `origin?` | `:1555` | **⚠ UNRELIABLE** — see §1 finding below |
| rule back-pointer | `sourceRuleId?` | `:1565` | `feedback_ruleid_backpointer` |
| storage info | `storageInfo?` | `:1566` | boolean/bitflag/kindEnum/verbatim |
| **`_new` single-source naming** | `fieldName?`/`storageNameNew?`/`nameNew?`/`parseNamesNew?` | `:1571–1574` | **DIAGNOSTIC SCAFFOLDING — no emitter reads these yet** (verified: only `collect-slots.ts` + `node-map.ts` reference them) |

Per-value facts on `NodeRef` (`node-map.ts:168`) / `TerminalValue` (`:195`):
`multiplicity`, `separator?`, `trailing?`, `leading?`, plus `immediate?` /
`tokenized?` / `resolvedKind?` on terminals (render adjacency — these are the
**non-droppable IMMEDIATE_TOKEN render facts** the brainstorm #0.4 names).

### Consumer 1 — Canonical typed representation (`emitters/types.ts`)

Facts consumed (verified via field-access scan of `types.ts`):
`slot.name`, `slot.configKey` (the dominant key — Config-type field names),
`slot.values` (→ the value union type via `kindsOf`), `slot.source`,
`slot.fieldName`. Cardinality via `isRequired`/`isMultiple`/`isNonEmpty`
(`node-map.ts:236/246/255`, derived from `values`, no stored booleans —
already DRY). Node-level: `node.typeName`, `node.fields`/`node.slots`,
`node.forms` (polymorph), `node.subtypes` (supertype), `node.isParameterless`.

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
(`wrap.ts:497`, `project_alias_target_routing`) which keys off
`slot.origin === 'kind'` and inverts `slot.aliasSources`, and
`resolveFieldStorageInfo` → `storageInfo` (boolean/bitflag/kindEnum).

→ **Model union:** `arity` = `isMultiple(slot) ? 'many':'one'` (derivable);
`storageKey` = `` `_${storageName}` `` (derivable); `origin` is the
**unreliable** signal (§1 finding 2). **The entire `SlotModel` indirection
should be deleted** — wrap should read `slot.arity` / `slot.storageKey` as
getters on the class. This is the highest-value strangler step (see §5 PR-D).

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

**Finding 5 — `SlotSource` usage discovery + the `'inferred'` removal (CW2).**
Discovery (every `file:line` traced; note `AssembledNonterminal.source` is the
SLOT source — distinct from `RuleSource` on Rule objects):

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

*Consumers of `slot.source === 'inferred'` (all read "this slot is unnamed/positional"):*
- `shared.ts:1056` `resolveSingleFieldFactorySlot` — exclude unnamed single slot
- `shared.ts:1138` factory-mode `'direct'` detection
- `shared.ts:1173` factory-mode `'spread'` detection
- `render-module.ts:585–586` partition slots into named vs unnamed
- `render-module.ts:598` per-variant unnamed children
- `render-module.ts:695,708` unnamed-slot multiplicity handling
- `templates.ts:1203,1438,1449` skip unnamed/link/group-lift slots in coverage
- `node-model.ts:318` serializes `field.source` (diagnostic only)
- `suggested.ts` reads a DIFFERENT `f.source` (round-trip failure origin, not slot source — `suggested.ts:250/296`) — **not** a `SlotSource` consumer.

**Concrete removal of `'inferred'`** (folds into PR-C, the same `origin`
elimination — both encode the identical "no `fieldName`" fact):
- **Producer change:** `buildSlot`/the `AssembledNonterminal` constructor stops
  computing a positional `source`; `source` carries only the rule's genuine
  provenance (`'grammar'`/`'override'`/`'enriched'`/`'inlined'`).
- **Consumer change:** every `slot.source === 'inferred'` test above becomes
  `slot.fieldName === undefined` (the authoritative unnamed-slot signal — exactly
  the dual `origin === 'kind'` also encoded, Finding 2). The two redundant
  signals (`origin`, `source==='inferred'`) collapse into one read of
  `fieldName`.
- **Type change:** `'inferred'` removed (see concrete end-state below).

**Other variants — justified against a discovered producer + consumer:**
- `'grammar'` — **KEEP.** The default provenance (`collect-slots.ts:305`);
  serialized (`node-model.ts:318`); read by `suggested.ts`'s override-candidate
  surfacing.
- `'override'` — **KEEP.** Stamped from override directives
  (`transform.ts:595/691/743`), carried onto the slot via `rule.source`
  (`collect-slots.ts:305/358`); surfaced by `suggested.ts`.
- `'enriched'` — **KEEP.** Stamped by enrich (`enrich.ts:262`), carried onto the
  slot via `rule.source`; surfaced by `suggested.ts` as an override candidate.
- `'inlined'` — **REMOVE (also dead).** Discovery: `'inlined'` is *declared* in
  the slot `source` type (`node-map.ts:1554`), on `FieldRule.source`
  (`rule.ts:207`), and in the IncludeFilter default (`link.ts:70`) /
  `DerivedFieldSource` (`types.ts:394`) — but it is **never stamped onto a slot**:
  the sole slot producer `buildSlot` (`collect-slots.ts:305–358`) only ever sets
  `'inferred'`/`'grammar'` or passes `rule.source` through, and no rule reaching a
  slot carries `source:'inlined'` (inlining rewrites the body, it does not tag the
  surviving leaf `'inlined'`). So the SLOT-level `'inlined'` variant has no
  producer → remove it from `SlotSource` too. (The Rule-level `'inlined'` /
  `DerivedFieldSource` usage is a separate concern, out of scope here.)

**Concrete end-state type:**
```ts
type SlotSource = 'grammar' | 'override' | 'enriched';   // 'inferred' + 'inlined' removed
```
Both removals fold into **PR-C** (the `origin`-elimination PR — all three signals,
`origin`/`source==='inferred'`/the dead `'inlined'`, are resolved by routing on
`fieldName === undefined` + carrying only genuine rule provenance).

---

## §2. `AssembledNonterminal` as a class

Today `AssembledNonterminal` is a plain `interface` / record literal
(`node-map.ts:1543`), constructed by `buildSlot` (`collect-slots.ts:281`) which
stamps ~16 fields including three parallel naming derivations. `AssembledNode`
is **already a class** (`AssembledNodeBase`, `node-map.ts:1281`) with
encapsulated behavior (`isTextTemplate`, `textTemplate`, `hidden` getter,
`stampChildExpression` getter, protected `rule`). Promoting
`AssembledNonterminal` to a class **extends the established pattern** (#11).

### Target class shape (END-STATE)

The Model speaks **one casing: snake_case** (Q1 decision), and **one slot
identity: `storageName`** — there is no `name` alias in the end-state. camelCase
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
  // `#refKindNames` is PRIVATE (CW4): `kinds` is the single public surface
  // for the referenced-kind list; there are not two public names for one value.
  // ---------------------------------------------------------------
  readonly fieldName?: string;               // the grammar field() name, or undefined
  #refKindNames: readonly string[];          // kinds this slot references (declaration order, deduped) — private
  readonly values: readonly NodeOrTerminal[];// the value union (per-value multiplicity/separator/immediate)
  readonly aliasSources?: Readonly<Record<string, string>>; // {target: source}
  readonly source: SlotSource;               // see SlotSource below
  readonly sourceRuleId?: RuleId;            // back-pointer (feedback_ruleid_backpointer)
  readonly storageInfo?: FieldStorageInfo;   // boolean|bitflag|kindEnum|verbatim

  constructor(init: {
    fieldName?: string;
    values: readonly NodeOrTerminal[];
    aliasSources?: Readonly<Record<string, string>>;
    source: SlotSource;
    sourceRuleId?: RuleId;
    storageInfo?: FieldStorageInfo;
  }) {
    this.fieldName = init.fieldName;
    this.values = init.values;
    this.#refKindNames = kindsOf(this);      // derived once from values (node-map.ts:1593)
    this.aliasSources = init.aliasSources;
    this.source = init.source;
    this.sourceRuleId = init.sourceRuleId;
    this.storageInfo = init.storageInfo;
  }

  // ---------------------------------------------------------------
  // Naming — ONE derivation (the today-inert `_new` logic, promoted to
  // canonical). `fieldName` wins; else the single referenced kind name
  // (incl. a supertype's own name); else a `content` fallback that ALSO
  // emits a fail-level unnamed-slot diagnostic (§5 — a complete Model never
  // ships a `content` slot). Replaces: legacy buildSlot baseName/origin
  // (collect-slots.ts:304-370), the `_new` suffixed fields
  // (node-map.ts:1571-1574), AND wrap.ts's SlotModel (slot-model.ts).
  //
  // The END-STATE has exactly ONE identity: `storageName` (snake_case). All
  // other names are derived projections of it.
  // ---------------------------------------------------------------
  get storageName(): string {                // snake_case — THE single identity (no `name` alias)
    if (this.fieldName !== undefined) return this.fieldName;
    if (this.#refKindNames.length === 1) return this.#refKindNames[0]!;
    return 'content';                        // diagnosed at the Assemble→Project gate
  }
  get storageKey(): string { return `_${this.storageName}`; } // tree-sitter-facing key; no $children/$other catch-all
  get parseNames(): readonly string[] {      // parser routes by field, else by ref-kinds
    return this.fieldName !== undefined ? [this.fieldName] : this.#refKindNames;
  }

  // camelCase projections (NEVER the identity — projection-time only, #3)
  get configKey(): string { return snakeToCamel(this.storageName); }       // singular camel
  get propertyName(): string {                                             // pluralized when multi
    return this.isMultiple ? pluralize(this.configKey) : this.configKey;
  }
  get paramName(): string { return safeParamName(this.propertyName); }

  // ---------------------------------------------------------------
  // Cardinality + flank facts — derived from `values` (already DRY today;
  // these are isRequired/isMultiple/isNonEmpty from node-map.ts:236/246/255
  // promoted to instance getters).
  // ---------------------------------------------------------------
  get isRequired(): boolean { return isRequired(this); }
  get isMultiple(): boolean { return isMultiple(this); }
  get isNonEmpty(): boolean { return isNonEmpty(this); }
  get arity(): 'one' | 'many' { return this.isMultiple ? 'many' : 'one'; }
  get hasTrailing(): boolean { return this.values.some((v) => v.trailing === true); }
  get hasLeading(): boolean { return this.values.some((v) => v.leading === true); }
  get kinds(): readonly string[] { return this.#refKindNames; }  // the ONE public ref-kind surface (CW4)
}

// Slot provenance (was AssembledNonterminal['source'], node-map.ts:1554).
// Discovery (Finding 5): `'inferred'` is redundant with `fieldName === undefined`
// (consumers route on that instead); `'inlined'` has no slot-level producer.
// Both removed → only genuine rule provenance survives.
export type SlotSource = 'grammar' | 'override' | 'enriched';
```

**Deleted vs today:** `origin?` / `SlotOrigin` (Finding 2 — consumers route on
`fieldName === undefined`); the `_new` suffixed fields (now the canonical
getters); the stored `propertyName`/`configKey`/`paramName`/`storageName` (now
getters, cannot drift); the `name` field/alias entirely (one identity:
`storageName`); the `SlotSource` variants `'inferred'` + `'inlined'` (Finding 5);
`compiler/slot-model.ts`'s `SlotModel` (`arity`/`storageKey` are getters here);
the public `refKindNames` field (now private `#refKindNames`, surfaced only via
`kinds`, CW4).

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
| Classify | `compiler/classify.ts` (rename of `link.ts`) | `link.ts`, `link-refine.ts`, `field-shape.ts` |
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
- **`template-walker.ts` → deleted** (PR3; `collect-slots.ts:50`'s
  `findRepeatFlag` import moves to `transforms.ts` or the class).
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
| `buildSlot(rule, kindForName, kindEntries, inherited, sep)` (`collect-slots.ts:281`) | becomes the `AssembledNonterminal` constructor (no longer a free function) |
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

### ⚠ FLAG — `node.rule` (RawRule) is still consumed beyond the legacy walker

`AssembledBranch` template emission historically read raw `rule` "because
templates need the literals" (`node-map.ts:2605` comment). With the
authoritative `TemplateEmitter` reading `renderRule` (which *also* preserves
literals), the RawRule snapshot should be deletable. But `node.rule` is also the
generic `R` stored on every `AssembledNodeBase` (`node-map.ts:1378`, protected)
and read by `isTextTemplate` / `members` / `separator` getters. **Deleting the
RawRule snapshot (brainstorm PR3 item) requires auditing those getters to read
`renderRule` instead.** Flagged as a PR3 sub-task, not assumed done.

---

## §4b. Diagnostics — severity model + the Assemble→Project gate (Q3 DECIDED)

Principle #4 ("derive-or-diagnose; never guess") is a **hard gate**, not advice.
A fact the compiler cannot derive deterministically emits a **fail-level**
diagnostic; if any fail-level diagnostic survives to the end of Assemble,
**Project (Emit) is halted** — no incomplete Model is ever projected to 1–6.
This is grammar-agnostic: it holds for every kind in every grammar.

### Severity model (END-STATE types — NEW)

```ts
// compiler/diagnostics.ts (NEW)
export type DiagnosticSeverity = 'fail' | 'warn' | 'info';

export interface Diagnostic {
  readonly severity: DiagnosticSeverity;
  readonly code: string;          // stable machine code, e.g. 'unnamed-slot', 'no-variant-resolution'
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

### Heuristics that become fail-diagnostics

Every heuristic the brainstorm names converts to a *deterministic resolver +
fail-on-unresolved*, never a guess:

- **unnamed slot** — when a slot's `storageName` would fall back to `'content'`
  (`AssembledNonterminal.storageName`, §2), emit `fail{code:'unnamed-slot'}` with
  a suggested `field('<name>', …)` override. (Today this is a non-blocking warn
  accumulated in `collect-slots.ts:355`; it becomes blocking.)
- **field-name inference** (`inferFieldNames`, `link.ts`) — drop the
  ≥5-refs/≥80%-agreement guess; emit a suggested `field()` override and `fail`
  if the name is needed and unsupplied.
- **polymorph candidacy** (`looksLikePolymorphCandidate` /
  `choiceNeedsVariantWrapping`, `link.ts`) — drop the heuristic; a polymorph is
  recognized only from explicit `variant()`/`polymorphs:` metadata, else `fail`
  with a suggested `polymorphs:` override.
- **choice distribute-vs-union** (`collect-slots.ts:520`) — replace the
  `isStructuralChoice` guess with the deterministic rule "a choice is one union
  slot, named by its enclosing field or shared-arm field; an unnamed structural
  choice is a `fail`."
- **unslotted child** (JC5) — a non-empty wrap-only `$other` bucket (a parsed
  child matching no named slot) emits `fail{code:'unslotted-child'}`. `$other`
  never renders; the defect surfaces here rather than silently round-tripping.
- **polymorph dispatch** (Q5) — see §4c.

### §4c. Polymorph dispatch is deterministic + total; `$variant` is diagnostics-only (Q5 DECIDED)

A compile-time "no variant matched" must **never** happen. Polymorph dispatch is
a **deterministic resolver** over slot presence + concrete kind (the
`project_polymorph_dispatcher_slot_probe` resolver, generalized): given a
polymorph parent and a concrete parse, exactly one form resolves. If the
resolver cannot resolve a form, that is a Model-completeness defect → **`fail`
diagnostic, halt** (not a runtime warning).

Consequence for the shipped artifacts: **no stored `$variant` discriminant
ships in 1–6.** The runtime resolves polymorphs structurally — wrap knows the
concrete kind; factory/`from` select a form explicitly; render dispatches on
kind + slot presence. `$variant` is **diagnostics/validate-only** (the same
scope discipline as `node-model.json5`, #10): it may appear in the serialized
Model and the validator's dispatch map, never in generated `types.ts` /
`factories.ts` / `from.ts` / `wrap.ts` / transports / templates.

### ⚠ FLAG — `$variant` removal touches the polymorph-form Model surface

`AssembledPolymorph` (`node-map.ts:3106`) and `PolymorphRule` carry form
metadata that today feeds a stored discriminant. The end-state keeps the form
metadata (the resolver reads it) but removes `$variant` from the *emitted* code
surfaces. This is sequenced in **PR-I** (§5) alongside the `polymorphVariants`
consolidation, because both touch the same dispatch surface.

> **Blast-radius note (verified).** `$variant` ships *heavily* in current
> generated code (e.g. typescript `types.ts` ~25 occurrences, `factories.ts`
> ~70; also `from.ts` / `wrap.ts` across all 3 grammars). Removing it from the
> shipped surfaces (PR-I) is a substantial, validate-gated change — the
> structural resolver must reproduce every dispatch decision the stored
> discriminant currently makes, with `fail` (not silent fallthrough) on any
> non-resolution.

---

## §5. Strangler PR sequence

Ordered so each PR (a) migrates one concern, (b) regenerates all 3 grammars +
runs `counts --backend native`, (c) **cannot regress** because each is either
behavior-preserving-by-construction or gated by a diff probe that must reach
zero before merge. The baseline gate per PR: `rust 178/134/107`,
`python 104/95/73`, `ts 172/81/59` (re-measure each).

**PR3 is a hard prerequisite** (it has not landed; this spec's later PRs assume
the legacy walker / wrapper types / ClauseRule are gone).

| PR | Name | Changes | Validates | Why it can't regress |
|---|---|---|---|---|
| **PR3** (prereq) | Delete legacy render walker + ClauseRule + wrapper types | Per `1ebe0407` design: delete `template-walker.ts`, `renderTemplate()` methods, `ClauseRule`/`detectClause`, the `'clause'` arm (`collect-slots.ts:474`), wrapper rule types, RawRule snapshot. | full regen + counts; the `TemplateEmitter` is already authoritative | the authoritative path already produces the output; legacy is dead-weight |
| **PR-A** | Reconcile `_new` naming to legacy (diff → 0) | No emitter changes. Add a probe (`tools` CLI) counting `storageName !== storageNameNew` / `name vs nameNew` divergences per grammar. Fix `collect-slots.ts` / `simplify.ts` until the count is 0 across all 3. | the divergence probe = 0; counts unchanged | pure measurement + fixes that converge legacy and `_new`; no consumer reads `_new` yet |
| **PR-B** | `AssembledNonterminal` → class | Swap the interface for the class (§2 getters). Construct via `new` in `collect-slots.ts`. Delete the `_new` suffixed fields (now getters). One slot identity: `storageName` (snake_case); migrate `slot.name` reads → `slot.storageName` here. `refKindNames` is private `#refKindNames`, public via `kinds` only (CW4). | counts unchanged (byte-identical, guaranteed by PR-A) | getters return PR-A-reconciled values = old stored values; `name`→`storageName` is value-identical |
| **PR-C** | Eliminate `origin` + redundant `SlotSource` variants; route on `fieldName` | Replace every `slot.origin === 'kind'` test (wrap `collectConcreteStorageKeys` `wrap.ts:497`) AND every `slot.source === 'inferred'` test (`shared.ts:1056/1138/1173`, `render-module.ts:585/586/598/695/708`, `templates.ts:1203/1438/1449`) with `slot.fieldName === undefined`. Delete `origin` + `SlotOrigin`; drop `'inferred'` + `'inlined'` from `SlotSource` (Finding 5) — leaving `'grammar' | 'override' | 'enriched'`. | counts unchanged; wrap + render + factory-mode byte-diff | `fieldName === undefined` is the authoritative signal both `origin:'kind'` and `source:'inferred'` approximated; `'inlined'` had no slot producer |
| **PR-D** | wrap reads the class; delete `SlotModel`; `$children`→`$other` | Delete `compiler/slot-model.ts`. wrap.ts reads `slot.arity` / `slot.storageKey` getters instead of `createNamedSlotModel(...)`. **Redesign** the `$children` catch-all to a wrap-only `$other` bucket (Finding 3 / Q4) — paired codegen + rust-reader change. | counts (esp. rust read-render-parse ast); wrap byte-diff | `arity`/`storageKey` getters are identical functions to `SlotModel`'s; `$other` is wrap-only so no other surface changes |
| **PR-E** | transport + render read the class | Transport-projection / render-module read `slot.values` / `slot.kinds` / `slot.storageKey` getters; drop node-wide `meta.separators` fallback (per-slot stamping covers all kinds). | counts; no slot name leaking a synthesized-helper name into emitted artifacts | the slot's `values` already hold inlined target kinds (Normalize/Simplify, §1 Consumer 5); getters identical |
| **PR-F** | factory + from + types read the class | factories/from/types consume getters; `from.ts` storageKey param becomes `slot.storageKey`. **No `$other`** on these surfaces (Q4). | counts; from pass-rate | getters identical to today's stored fields; `$other` was never on these surfaces in the end-state |
| **PR-G** | Diagnostics severity model + Assemble→Project gate | Add `compiler/diagnostics.ts` (`DiagnosticSink`, severity) + `compiler/emit-gate.ts` (`assertEmittable`); wire the gate into `generate.ts` after `assemble()`. Move the unnamed-choice warner global (`collect-slots.ts:61-68`) into the sink. Initially all current heuristics still fire (no `fail` yet) — gate is a no-op until PR-J flips severities. | counts unchanged; gate passes (no `fail` emitted yet) | additive infrastructure; no severity is `fail` until PR-J |
| **PR-H** | Phase rename + shared `transforms.ts` + ctx | Rename `link.ts`→`classify.ts`, `optimize.ts`→`normalize.ts`. Extract shared idempotent ops to `transforms.ts`. Introduce `NormalizeCtx`/`SimplifyCtx`/`AssembleCtx` (carrying the sink from PR-G). Apply `<operation><ObjectType>(target, ctx)` signatures. | counts; full test suite | pure rename + move; no logic change |
| **PR-I** | `factory-map.json5`→`node-model.json5`; `$variant` off shipped surfaces; deterministic polymorph dispatch | Make `node-model.json5` carry factory-map's subset (§6); point validator/tooling at it; delete `factory-map.json5` + emitter. Make polymorph dispatch a deterministic resolver (Q5); a non-resolution becomes `fail`. Remove the stored `$variant` discriminant from `types.ts`/`factories.ts`/`from.ts`/`wrap.ts`/transports/templates; keep it in the serialized Model + validator dispatch map only. | validator passes against the consolidated model; counts; no compile-time "no variant matched" | factory-map is a strict subset (§6 proof); the resolver replaces the stored discriminant with structural dispatch (kind + slot presence) |
| **PR-J** | Flip heuristics to fail-diagnostics (author overrides first) | For each heuristic (`inferFieldNames`, `looksLikePolymorphCandidate`/`choiceNeedsVariantWrapping`, choice distribute-vs-union `collect-slots.ts:520`, the `'content'`-fallback unnamed slot, parameterless fixpoint): **first** author the overrides that clear its would-be `fail` diagnostics across all 3 grammars (counts must hold), **then** delete the heuristic and emit `fail` on the now-impossible non-deterministic case. | counts hold AT EACH heuristic removal; `overrides.suggested.ts` reviewed; gate (PR-G) now actively blocks | overrides are authored before the guess is removed → the deterministic path produces the same Model; the `fail` is unreachable for the corpus |

**Proposed PR count: 10** (PR3 prereq + PR-A..PR-J). PR3, PR-A, PR-B, PR-C, PR-D
are the load-bearing core (centralize naming + kill `SlotModel`/`origin`/`name`,
narrow `$children`→`$other`); PR-E..PR-F migrate the remaining read sites;
PR-G..PR-J are the diagnostics gate, phase reorg, build-artifact consolidation,
and the heuristics-to-fail flip. Each PR is a strangler step that **removes the
old code it supersedes within the same PR** — there are no dedicated "sunset"
PRs; detailed removal sequencing is the implementation plan's concern.

**Gating discipline (#12, brainstorm validation gate).** Each PR ends with:
`npx tsx packages/codegen/src/cli.ts --grammar <g> --all --output …` for all 3,
then `counts --backend native <g>` for all 3, asserting no regression vs the
baseline. PR-A and PR-B additionally gate on the divergence probe = 0. PR-J
gates on counts holding *at each individual heuristic removal* (not just at PR
end), because each removal is independently reversible only before the next.

---

## §6. `factory-map.json5` → `node-model.json5` consolidation

### factory-map's contents are a subset of the Model

`buildFactoryMap` (`factory-map.ts:71`) produces five maps. Each is a
derivation already available from the assembled `NodeMap`:

| factory-map map | Source on the Model | Already serialized in node-model? |
|---|---|---|
| `factoryShapes` | `classifyFactoryShape(node)` (`shared.ts`) — pure function of node modelType + slots | derivable; node-model has `modelType` + slots |
| `fieldAliasMap` | `slot.aliasSources` (`factory-map.ts:87`) | YES — `node-model.ts:328` serializes `aliasSources` per field |
| `factoryFields` | `resolveFactoryFieldNames(node)` (`factory-map.ts:96`) — the factory-field gating predicate | derivable from slots + `isParameterless` |
| `factorySlots` | `deriveSlotCardinality(field)` per slot (`factory-map.ts:106`) | YES — `node-model.ts:314` serializes `required`/`multiple`/`nonEmpty` per field |
| `polymorphVariants` | `node.forms` field-signatures / `node.variantChildKinds` (`factory-map.ts:119`) | partially — node-model has `forms` + `variantChildKinds` (`node-model.ts:249/304`) but not the pre-computed `childKind`/`fields` dispatch map |

**Two maps are already in `node-model.json5`** (`fieldAliasMap`,
`factorySlots`). Two are pure functions of serialized facts
(`factoryShapes`, `factoryFields`). One (`polymorphVariants`) has its *inputs*
serialized but not the dispatch-ready form.

### Consolidation mechanism (PR-I)

1. **Extend `buildNodeModel` (`node-model.ts:178`)** to also emit the
   dispatch-ready `polymorphVariants` (move `buildFactoryMap`'s `polymorphVariants`
   logic, `factory-map.ts:119–192`, into the node-model serializer — it reads
   `node.forms` / `node.variantChildKinds` / `expandRuntimeDiscriminatorKinds`,
   all already available). Emit `factoryShapes` + `factoryFields` by calling the
   same `classifyFactoryShape` / `resolveFactoryFieldNames` (`shared.ts`) the
   factory-map emitter calls.
2. **Point the validator + `nodeToConfig` at `node-model.json5`** instead of
   `factory-map.json5` (the `factory-map.ts:5` docstring names the consumers:
   `validate-factory-roundtrip`, `validate-from`, `nodeToConfig`).
3. **Delete `factory-map.json5` + `emitters/factory-map.ts`.** One serialized
   source (#10).
4. **`$variant` lands here as diagnostics/validate-only (Q5).** The
   `polymorphVariants` dispatch map is consumed by the *validator* and serialized
   into `node-model.json5` — never emitted into shipped code. The shipped runtime
   uses the deterministic structural resolver (§4c). This consolidation is the
   natural home for that scoping because both touch the same dispatch surface.

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
| `compiler/evaluate.ts` | UNCHANGED — see `evaluate.ts:200` | **Evaluate** | `evaluate(entryPath)`, DSL primitives, `synthesize*`, `liftCommaSep`, `grammarFn` |
| `compiler/classify.ts` | RENAME of `link.ts` (+ folds `link-refine.ts`, `field-shape.ts`) | **Classify** | `classifyGrammar(raw, ctx)` (was `link`), `resolveRule`, `classifyHiddenRule`, `promotePolymorph`, `applyOverridePolymorphs`, `hoistIndentIntoRepeat`, `annotateBlockBearerFields`. **DELETED:** `detectClause` (ClauseRule gone, PR3); `inferFieldNames`, `looksLikePolymorphCandidate`, `choiceNeedsVariantWrapping` (→ diagnostics, PR-J) |
| `compiler/normalize.ts` | RENAME of `optimize.ts` (+ folds `wrapper-deletion.ts`) | **Normalize (non-lossy)** | `normalizeGrammar(linked, ctx)` (was `optimize`), `fanOutSeqChoices`, `factorChoiceBranches`, `dedupeSeqMembers`, `inlineSingleUseHidden`, `collapseWrappers`, `pushdownWrappers` (was `applyWrapperDeletion`). Produces the **RenderRule** snapshot |
| `compiler/simplify.ts` | UNCHANGED structure — see `simplify.ts:331` | **Simplify (lossy)** | `computeSimplifiedRules`, `simplifyRules`, `simplifyRule`, `fuseHeadRepeatLists`, `hoistSharedFieldAcrossChoiceBranches`, `mergeChoiceBranches`, the field-hoist helpers. Produces the **SimplifiedRule** snapshot |
| `compiler/transforms.ts` | **NEW** (#13a) | shared idempotent ops invoked by BOTH Normalize & Simplify | `collapseSeq(rule, ctx)`, `canonicalizeSeqOfLeaves(rule, ctx)`, `inlineRefs(rule, ctx)`, `deleteWrapper(rule, ctx)`, `pushAttrsToLeaves(rule, …)`, `combineMultiplicity`, `extractRepeatShape`, `findRepeatFlag` (moved out of the deleted `template-walker.ts`) |
| `compiler/assemble.ts` (+ slot walk) | REFINED — see `assemble.ts:407` | **Assemble** (sole Model-builder) | `assemble(normalized, ctx)`, `classifyNode`, `hydrateSlotRefs`, `markUserFacing`, `markParameterlessKinds`, `resolveCollidingNames`, `resolveIrKeys`, `collectAnonymousNodes`, `collectSlots(rule, ctx)` (slot-enumeration walk — naming logic MOVED to the class, §7.3). **DELETED:** `buildSlot` free function (→ `AssembledNonterminal` constructor) |
| `compiler/rule.ts` | REFINED — see §7.4 | **shared rule helpers** (#13c) | Rule IR types + `RuleBase`; type guards (`isSeq`, …); `normalizeEnumMembers`, `literalTextOf`, `collectFieldNames`, `replaceAtPath`. **DELETED (PR3):** `OptionalRule`/`FieldRule`/`RepeatRule`/`Repeat1Rule`/`ClauseRule` |
| `compiler/node-map.ts` | REFINED — see §7.3 | the `AssembledNode*` class hierarchy + `AssembledNonterminal` class + slot value types | (class defs only — no free-standing pipeline methods). **DELETED:** `inlineJinjaClauses`, `translateToJinja`, `renderTemplate()` methods (PR3) |
| `compiler/slot-model.ts` | **DELETED** | — | `SlotModel`/`createSlotModel`/`createNamedSlotModel`/`createUnnamedKindSlotModel`/`createUnnamedChildrenSlotModel`/`slotStorageKey` all gone — replaced by class getters (§7.3) |
| `compiler/template-walker.ts` | **DELETED** (PR3) | — | `findRepeatFlag` survivor → `transforms.ts`; everything else deleted |
| `compiler/diagnostics.ts` | **NEW** (§7.5) | cross-cutting diagnostics | `DiagnosticSink`, `Diagnostic`, `DiagnosticSeverity`, `EmitHaltedError` |
| `compiler/emit-gate.ts` | **NEW** (§7.5) | Assemble→Project gate | `assertEmittable(nodeMap, sink)` |
| `compiler/generate.ts` | REFINED — see `generate.ts` | pipeline driver | sequences Evaluate→Classify→Normalize→Simplify→Assemble→`assertEmittable`→Emit; constructs + threads the `DiagnosticSink` |
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

| Artifact | Emitter module | Entry point (UNCHANGED signature unless noted) | End-state change |
|---|---|---|---|
| 1 — canonical types | `emitters/types.ts` | `emitTypes(config): string` (`types.ts:103`) | reads `slot.configKey`/`slot.values`/`slot.isRequired` getters; **no `$other`** |
| 2 — factories | `emitters/factories.ts` | `emitFactories(config): string` (`factories.ts:81`) | reads getters; **no `$other`**; no stored `$variant` |
| 3 — `from` | `emitters/from.ts` | `emitFrom(config): string` (`from.ts:304`) | `storageKey` param → `slot.storageKey` getter; **no `$other`**; explicit form selection (no `$variant`) |
| 4 — wrap | `emitters/wrap.ts` | `emitWrap(config): string` (`wrap.ts:80`) | reads `slot.arity`/`slot.storageKey`; `collectConcreteStorageKeys` routes on `slot.fieldName === undefined` (not `origin`); **`$other`** bucket lives HERE + its rust-reader twin only |
| 5 — transports | `emitters/transport-common.ts`, `transport-projection.ts`, `transport-projection-cache.ts` | `buildSupertypeTransportSet(nodeMap)` (`transport-common.ts:71`) + projection builders | read `slot.values`/`slot.kinds`; **no `$other`**; no stored `$variant` |
| 5/6 — render bridge | `emitters/render-module.ts` | `emitRenderModule(...)` (`render-module.ts:2349`), `emitRenderModuleBundle(...)` (`:436`), `emitHashFiles(...)` (`:2315`) | per-slot separator from value stamp (drop node-wide `meta.separators`); structural polymorph dispatch on kind+slots |
| 6 — template renderer | `emitters/templates.ts` | `runTemplateEmitter(config): EmittedTemplates` (`templates.ts:1506`); per-modelType `emitBranchTemplate`/`emitGroupTemplate`/`emitMultiTemplate`/`emitPolymorphTemplate`; shared `emitRule(rule, ctx)` (`:739`) | reads **`node.renderRule`** (non-lossy); **DELETED:** legacy `emitBodyForNode` + `emitJinjaTemplates` legacy path |
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

### §7.3 The `AssembledNode` class hierarchy (complete)

`AssembledNonterminal` becomes a class (§2 — full definition there). The node
class hierarchy is **already class-based**; only the listed members change.

| Class | Status | End-state note |
|---|---|---|
| `AssembledNodeBase<R>` | REFINED — see `node-map.ts:1281` | **DELETED method:** `renderTemplate()` (PR3). `protected rule: R` getters (`members`/`separator`/`isTextTemplate`) read `renderRule` after the RawRule snapshot is dropped (§4 FLAG). Otherwise unchanged (`kind`/`typeName`/`factoryName`/`irKey`/`source`/`isParameterless`/`stampExpression`/`userFacing`/`hidden`) |
| `AssembledNonterminal` | **REFINED → CLASS** (§2 full def) | the slot class; getters `storageName` (the ONE identity)/`storageKey`/`parseNames`/`configKey`/`propertyName`/`paramName`/`arity`/`isRequired`/`isMultiple`/`isNonEmpty`/`hasTrailing`/`hasLeading`/`kinds`. **DELETED:** the `name` field/alias (one identity: `storageName`); stored `storageName`/`propertyName`/`configKey`/`paramName`/`hasTrailing`/`hasLeading`/`origin`; the `_new` suffixed fields; `SlotSource` variants `'inferred'`+`'inlined'` |
| `AssembledBranch` | REFINED — see `node-map.ts:2586` | `_slots` record now holds `AssembledNonterminal` instances; `slots`/`fields` getters unchanged. **DELETED:** `renderTemplate()`. `children` getter already retired (returns `[]`) |
| `AssembledPolymorph` | REFINED — see `node-map.ts:3106` | keeps `forms`/`formRules`/`variantChildKinds` (the deterministic resolver reads them); **no emitted `$variant`** (§4c). **DELETED:** `renderTemplate()` |
| `AssembledGroup` | REFINED — see `node-map.ts:3659` | hidden synthesized-group; `fields`/`children` unchanged. **DELETED:** `renderTemplate()` |
| `AssembledMulti` | REFINED — see `node-map.ts:3617` | `elementRule`/`separator`/`nonEmpty`/`trailing`/`leading` unchanged. **DELETED:** `renderTemplate()` |
| `AssembledSupertype` | UNCHANGED — see `node-map.ts:3573` | `subtypes` getter |
| `AssembledLeaf<R>` (abstract) | UNCHANGED — see `node-map.ts:3393` | base for the four leaf classes |
| `AssembledPattern` | UNCHANGED — see `node-map.ts:3406` | `pattern` getter |
| `AssembledKeyword` | UNCHANGED — see `node-map.ts:3419` | `text` getter; self-sets `stampExpression` |
| `AssembledToken` | UNCHANGED — see `node-map.ts:3463` | `text` getter; `stampChildExpression` override |
| `AssembledEnum` | UNCHANGED — see `node-map.ts:3543` | `values` getter |

Slot **value** types (on `AssembledNonterminal.values`): `NodeRef`
(`node-map.ts:168`), `TerminalValue` (`:195`), `NodeOrTerminal` union (`:210`),
`UnresolvedRef` (`:128`) — all **UNCHANGED** (carry per-value
`multiplicity`/`separator`/`trailing`/`leading`/`immediate`/`tokenized`/`resolvedKind`,
the non-droppable render facts). `FieldStorageInfo` (`:161`) UNCHANGED.
`BranchSlotClass` (`:149`) UNCHANGED.

### §7.4 Rule IR (already extended — PR0 shipped)

**The leaf-attribute extension the brainstorm calls for is ALREADY DONE.**
`RuleBase` (`rule.ts:59`) already carries `fieldName` / `multiplicity` /
`nonterminal` / `separator` / `aliasedFrom` / `aliasNamed` on EVERY variant —
no parallel type was introduced (#11 satisfied). End-state:

| Rule IR piece | Status |
|---|---|
| `RuleBase` (the leaf attributes) | UNCHANGED — see `rule.ts:59-88` |
| `Multiplicity` | UNCHANGED — see `rule.ts:37` |
| `Rule` union | REFINED — drop the wrapper + clause members (PR3); see below |
| `RenderRule` / `SimplifiedRule` branded types | UNCHANGED — see `rule.ts:144/160` (the `Exclude<…>` of wrapper types becomes a no-op once they delete) |
| Structural variants kept | `SeqRule`, `ChoiceRule`, `VariantRule`, `GroupRule`, `PolymorphRule`, `SupertypeRule`, `EnumRule`, `TerminalRule`, `StringRule`, `PatternRule`, `IndentRule`, `DedentRule`, `NewlineRule`, `SymbolRule`, `TokenRule` — UNCHANGED |
| Variants **DELETED** (PR3, wrapper info already pushed to `RuleBase`) | `OptionalRule`, `FieldRule`, `RepeatRule`, `Repeat1Rule`, `ClauseRule`, `AliasRule` |
| `RuleIdentity` deprecated alias | DELETED — see `rule.ts:95` |

End-state `Rule` union:
```ts
export type Rule =
  | SeqRule | ChoiceRule                    // structural grouping (wrappers gone)
  | VariantRule | EnumRule | SupertypeRule | GroupRule | TerminalRule | PolymorphRule
  | StringRule | PatternRule                // terminals
  | IndentRule | DedentRule | NewlineRule   // structural whitespace
  | SymbolRule | TokenRule;                 // references (Link resolves symbol; token kept for adjacency)
```
> Note: `TokenRule` is **kept** — it carries `immediate`/`tokenized` render
> adjacency (a non-droppable render fact, #0.4). `repeat`/`repeat1` cardinality
> survives as `multiplicity` on the leaf; `optional` as `multiplicity:'optional'`;
> `field` as `fieldName`; `alias` as `aliasedFrom`/`aliasNamed`.

### §7.5 Diagnostic severity model + the gate (NEW)

Full definitions in §4b/§4c. Inventory: `compiler/diagnostics.ts` exports
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
`AssembledNonterminal` instances; `slotByRuleId` (`:475`) maps to those
instances; the `rules?` field's docstring referencing "the template walker"
(`:484`) updates (walker deleted) but the field stays (Simplify/inlineRefs read
it). `nodeByRuleId`/`signatures`/`derivations`/`word`/`polymorphFormKinds`/`externals`
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
  readonly diagnostics: DiagnosticSink;      // unnamed-slot fail-diagnostics emit here
}
```

Shared `transforms.ts` ops take a `TransformCtx`; `NormalizeCtx` (an alias) and
`SimplifyCtx` (an extension) both ARE one, so the call sites need no widening.
The uniform `(target, ctx[, recursionState])` shape — with recursion state kept
explicit and separate from `ctx` — enables the single trace wrapper (#14 note;
`compiler/trace.ts` is the seed).

Method-rename map (END-STATE names):

| End-state method | Was | Module |
|---|---|---|
| `classifyGrammar(raw, ctx)` | `link(raw, include?)` | `classify.ts` |
| `normalizeGrammar(linked, ctx)` | `optimize(linked, inlineKinds?)` | `normalize.ts` |
| `pushdownWrappers(rule, ctx)` | `applyWrapperDeletion` / `deleteWrapper` | `normalize.ts` |
| `inlineRefs(rule, ctx)` | `inlineRefs(rule, rules, inlineKinds?, visited?)` | `transforms.ts` |
| `collapseSeq(rule, ctx)` | `collapseSeq(rule, wordMatcher?, inField?)` | `transforms.ts` |
| `canonicalizeSeqOfLeaves(rule, ctx)` | same, positional args | `transforms.ts` |
| `simplifyRule(rule, ctx)` | `simplifyRule(rule, wordMatcher?, inField?)` | `simplify.ts` |
| `collectSlots(rule, ctx)` | `collectSlots(rule, kindForName?, kindEntries?, inherited?, sep?)` | `assemble.ts` |
| `assertEmittable(nodeMap, sink)` | (new) | `emit-gate.ts` |

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
   - **✅ DECIDED (2026-05-22): `slot.name` = snake_case** — maximally consistent with kind/field/storage names (the whole Model speaks one casing). camelCase is a separately-named accessor / projection-time `snakeToCamel` transform (principle #3), not the canonical identity. Matches recommendation; minimal churn.

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
