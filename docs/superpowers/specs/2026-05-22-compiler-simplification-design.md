# Compiler Workflow Simplification — Design

**Date:** 2026-05-22
**Status:** 📋 SPEC RECONCILED — brainstorm (above) + code-grounded implementation spec §1–§7 (below); **5 decisions + DRY/simplify review + critical-review batch + method-convergence fold + synthesis-discipline batch + losslessness audit + emit-DRY fold (2026-05-23)**. End-state is clean (no transitional aliases, no sunset PRs; old code removed within the superseding strangler step). **Losslessness audit verdict: Simplify lossless-modulo-literal-removal HOLDS; `token.immediate` drop CONFIRMED FIXED; Normalize had ONE real violation (`collapseWrappers` dropped `id`/`separator` on single-member collapse) — closed by PR-A0 → Normalize is now genuinely lossless, #2 enforced not just asserted.** Adds **Principle #16 (synthesis only if deterministic AND grammar-visible; sittir-only inventions forbidden)**; cuts **ALL sittir-invented + content-classification Rule types** — `PolymorphRule`/`VariantRule`/`ClauseRule` + the opaque Group classifier (→ Model-only `PolymorphSpec` / plain structure / wire helper, §B/§C/§D) AND `EnumRule`/`TerminalRule` (→ `isEnumShaped`/`isTerminalShaped` predicates + the `AssembledEnum`/`AssembledPattern` Model nodes, §G-cut); the `propose-*` diagnostic class (§E); enrich-widening (§F); plus the earlier Principle #15, the sanctioned `content` slot (§4c), identical-form collapse (§4d), the H2 helper-leak fix, the #14 getter-vs-method line, the `parameterless`-as-memoized-getter convergence, and the M1/MO2/M3/P1 structural de-dups. The end-state `Rule` union is now purely structural (`seq`/`choice`/`group`/`supertype`/`string`/`pattern`/whitespace/`symbol`/`token`). The **emit-DRY fold** adds 5 small getter/delete tightenings (`slot.kinds` replaces `slotKindNames`; keyword-presence reads cached `slot.storageInfo.kind`; `discriminatorKindsOrDefault` + `isUnnamed` getters; dead `snakeToCamel` copy deleted) + the KEEP-clarification (`classifyFactoryShape` stays a per-consumer shared function, not a getter) — **all fold into existing PRs, no PR-count change**. **Ready for user review → `writing-plans`.** 19 PRs (PR3 prereq + PR-A0 + PR-A..PR-Q + PR-L). PR3 is a gating prerequisite (not yet landed — only its design doc is on this branch).
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
    **Shared *node* methods don't exist** — node behavior lives on the `AssembledNode`/`AssembledNonterminal` classes (#11), not a util module. *Pure node-self reads* (a value computed from the node alone) are class **getters**; computations that need cross-node or phase state are pipeline **methods** (#14), not getters.
14. **Uniform method signature & naming** — every pipeline method takes exactly two inputs: the **target** (a rule or node) and a **phase context** (`NormalizeCtx`, `SimplifyCtx`, `AssembleCtx`, …). It is named `<operation><ObjectType>` — the operation plus the type of object operated on (rule type / model type / slot class). E.g. `collapseSeq(rule: SeqRule, ctx: SimplifyCtx)`, `pushdownField(rule: FieldRule, ctx: NormalizeCtx)`. The context **absorbs ALL extra inputs** (`nodeMap`, `kindEntries`, `wordMatcher`, the rule map, …) — so **there is no genuinely non-conforming pipeline method**: anything that "needs another argument" puts that argument in `ctx`. The context carries phase-shared state and the **diagnostics sink** (the home for #4's derive-or-diagnose) — methods never reach for globals.
    - **Getter vs method — the explicit line.** A **pure node-self read** (needs nothing but the node itself) stays a class **getter** (`node.hidden`, `node.storageName`, `slot.arity`). **Anything needing cross-node or phase state** is a `(target, ctx)` **method** — e.g. `(node, ctx)` with `nodeMap` in `ctx` — **never a getter that takes an argument**. There are no `node.foo(nodeMap)` getter-with-arg shapes in the end-state; such a computation is `computeFoo(node, ctx)` (a method) whose result may be cached onto a plain node field that emitters then read field-style (`node.foo`).
    - *(Benefit, not a rule: the uniform shape means a single injected wrapper can provide trace-level probing across the whole pipeline — printing `methodName` + input per step — with no per-method instrumentation.)*

**Provenance vs behavior (added by the DRY review)**
15. **Metadata/provenance may be retained for diagnostics, but MUST NEVER drive compiler behavior.** Behavior derives *only* from structural facts — `fieldName`, `kinds`/`values`, `multiplicity`. Provenance fields (`SlotSource`, the serialized `$variant`, `node-model.json5` itself) are *observability*, read by tooling/diagnostics and never branched on by the pipeline or the emitters. This generalizes three already-decided cuts: the `origin` deletion (Finding 2 — route on `fieldName`), `$variant`-validate-only (§4d), and `node-model`-tooling-only (#10). The test: *"if I deleted this field, would any 1–6 projection change?"* — if yes, it is structural (keep + drive); if no, it is provenance (may keep for diagnostics, must not drive). The retained-but-inert `SlotSource['inferred']` (Finding 5 / C1) is the canonical example.

**Synthesis discipline (added by the critical-review batch)**
16. **Synthesis is permitted only if deterministic AND grammar-visible.** Any new kind/rule the compiler invents is synthesized in **enrich/wire** and emitted into `outRules` / `base.grammar.rules`, so **both compilers** (tree-sitter generate + sittir evaluate) see it and it gets a `kindId` (`project_every_kind_has_kindid_invariant`). **Opaque sittir-only synthesis is forbidden** — no TS-side "virtual" kinds, no `source:'synthesized'` rules that exist only inside the sittir IR (these are exactly what §B/§D below delete: `PolymorphRule`/`VariantRule` inventions, Link's opaque `GroupRule` classifier). Non-deterministic naming or classification is **never guessed** → it becomes a `propose-*` diagnostic + suggested override (§4b / §E). The **only** permitted sittir-side derivation is **projection-naming** — e.g. deriving `storageName` from the single referenced kind (§2). Projection-naming invents no kind and adds no rule; it is a deterministic transform of a fact the grammar already states, so it does not violate this principle. *Test:* "does this create a kind/rule tree-sitter can't see, or guess a non-deterministic fact?" → if yes, forbidden (synthesize-in-wire or diagnose instead); if it only renames an existing grammar fact deterministically, allowed.

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
  // (incl. a supertype's own name); else the SANCTIONED `content` fallback
  // (§4c, C3 — a real named slot that renders `{{ content }}` and round-trips;
  // it emits a non-blocking warn{anonymous-content}, NOT a fail). Replaces:
  // legacy buildSlot baseName/origin (collect-slots.ts:304-370), the `_new`
  // suffixed fields (node-map.ts:1571-1574), AND wrap.ts's SlotModel.
  //
  // The END-STATE has exactly ONE identity: `storageName` (snake_case). All
  // other names are derived projections of it.
  // ---------------------------------------------------------------
  get storageName(): string {                // snake_case — THE single identity (no `name` alias)
    if (this.fieldName !== undefined) return this.fieldName;
    if (this.#refKindNames.length === 1) return this.#refKindNames[0]!;
    return 'content';                        // sanctioned anonymous-content slot (§4c) — warn, not fail
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
                                                                 // — deduped; replaces shared.ts:124 slotKindNames (EmitDRY-1)
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
```

**Deleted vs today:** `origin?` / `SlotOrigin` (Finding 2 — consumers route on
`fieldName === undefined`, now via the `isUnnamed` getter); the `_new` suffixed
fields (now the canonical getters); the stored
`propertyName`/`configKey`/`paramName`/`storageName` (now getters, cannot drift);
the `name` field/alias entirely (one identity: `storageName`); the `SlotSource`
variant `'inlined'` only (Finding 5 — `'inferred'` is RETAINED as provenance per
#15); `compiler/slot-model.ts`'s `SlotModel` (`arity`/`storageKey` are getters
here); the public `refKindNames` field (now private `#refKindNames`, surfaced
only via `kinds`, CW4); **the free fn `slotKindNames` (`shared.ts:124`)** — a
parallel, NON-deduped, unresolved-including kind-name derivation read across
factories/from/types/test; callers re-point to `slot.kinds` (the deduped
`kindsOf`, `node-map.ts:1526`, is canonical), eliminating the divergent-semantics
duplicate (EmitDRY-1).

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
- **Normalize = fully lossless — BREAKS in `collapseWrappers` (`optimize.ts:622-645`). VIOLATION.**
  The single-member-collapse arms — `seq([X]) → members[0]` (`:638`),
  `choice([X]) → members[0]` (`:643`) — and the wrapper-fold arms
  (`:622/624/630/633`) drop the *discarded* node's `id` (and its pre-wrapper-deletion
  `separator`) with **no `withAttrsFrom`** — the exact omission `collapseSeq` /
  `fanOutSeqChoices` / `factorChoiceBranches` were already patched to avoid.
  **Impact:** degraded `slotByRuleId` lookup (bounded — the survivor keeps its own
  `id` + the lookup's fallbacks), but it **contradicts Normalize's "fully
  lossless" requirement** (#2) outright. This is the one place the asserted
  invariant is false today.
- **`canonicalizeSeqOfLeaves` (`simplify.ts:1192-1198`) shares the pattern** but
  is currently *shielded* by the surrounding passes (the discarded id is already
  carried by a prior arm), so it is **benign now** — fixed alongside for parity +
  defense, not because it leaks today.

**The fix (a PR — see §5):** give `collapseWrappers`'s `seq`/`choice`/wrapper-fold
arms the `withAttrsFrom(rule, survivor)` treatment (parity with `collapseSeq`,
`simplify.ts:1001-1002`) so `id` (and `separator`) survive single-member
collapse; apply the same to `canonicalizeSeqOfLeaves`. This makes Normalize
**genuinely lossless** — #2 verified *and* enforced. **Sequencing constraint:**
the fix must land **before any emitter starts reading `slotByRuleId`**, so the
degraded-lookup window never opens — see the PR placement in §5.

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
  readonly code: string;          // stable machine code. The propose-* class (§E): 'propose-top-level-rule' (info/warn),
                                  //   'propose-field' (fail when ambiguous+needed, else warn), 'propose-polymorph' (fail).
                                  //   Plus: 'unslotted-child' (fail), 'anonymous-content' (warn), 'no-variant-resolution' (fail).
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
`propose-field` fires but never driving behavior. The three codes:

- **`propose-top-level-rule`** (info/warn) — a wire-synthesized auto-group
  (`_<parent>_optionalN` / `_repeatN`) has no author-meaningful name. Non-blocking:
  the helper is grammar-visible (§D) and renders fine; the diagnostic suggests a
  `groups:` override to give it a real top-level name.
- **`propose-field`** (**fail** when the name is ambiguous *and* needed; else
  warn) — a positional symbol slot that is **not deterministically
  field-nameable**: the direct+repeat-mix residue (§F) + the dropped
  `inferFieldNames` guess. Suggests a `field('<name>', …)` override.
- **`propose-polymorph`** (**fail**) — a heterogeneous-field `choice` is a
  polymorph candidate with no `variant()` / `polymorphs:` declared (was
  `looksLikePolymorphCandidate` / the `evaluate.ts:330` retype). Suggests a
  `polymorphs:` override. (Replaces the deleted §B retype + the link heuristic.)

Plus the two non-`propose` slot diagnostics already specced:
- **`content` slot** → `warn{anonymous-content}`, a **sanctioned non-fail** path
  for genuinely-anonymous structural content (§4c — the C3 reconciliation; an
  earlier draft's blanket `fail{unnamed-slot}` was proven wrong by discovery).
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
It is **NOT** a `fail`. The `fail` is reserved for the *truly* unresolvable case:
a slot whose `kinds`/`values` are empty or contradictory (nothing to render) —
that is `fail{code:'empty-slot'}`, orthogonal to `content`.

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

### §4d. Polymorph dispatch is deterministic + total; `$variant` is diagnostics-only (Q5 DECIDED)

A compile-time "no variant matched" must **never** happen. Polymorph dispatch is
a **deterministic resolver** over slot presence + concrete kind (the
`project_polymorph_dispatcher_slot_probe` resolver, generalized): given a
polymorph parent and a concrete parse, exactly one form resolves. If the
resolver cannot resolve a form, that is a Model-completeness defect → **`fail`
diagnostic, halt** (not a runtime warning).

**Totality requires identical-signature forms to COLLAPSE first (C2).** Slot-
presence+kind dispatch cannot disambiguate two forms with the *same* field/child
signature (`project_ts_primary_type_nonsense_variants` cited 20 forms, 18
identical). The resolution: **identical-signature forms collapse to one form** —
they are redundant by construction (same observable shape), so there is nothing
to disambiguate and nothing to `fail` on. Collapse rule: group a polymorph's
forms by their structural signature (the sorted set of field `storageName`s plus
the children count, the same key `factory-map.ts:170` already computes for the
shape-collision warn); each group becomes ONE form. After collapse, every
surviving form has a distinct signature ⇒ slot-presence dispatch is total.
Collapsing is part of the **deterministic-dispatch PR** (PR-I), upstream of the
resolver.

> **Discovery (cited):** in the *current committed* `node-model.json5`, the
> identical-signature count is **0 across all 3 grammars** (rust/ts/python: 0
> polymorphs with a duplicate-signature form set; verified by grouping each
> polymorph's `forms[].fields[].name` + `children.length`). The cited ts
> `primary_type` is today a **`supertype`** (0 forms), not a 20-form polymorph —
> the nonsense-variants were already eliminated upstream (likely the `variant()`
> adoption / supertype reclassification on the 024/PR2 line). So the collapse is
> **defensive/total-by-construction** for the current corpus (no forms to
> collapse today) but remains a required invariant: the resolver MUST collapse-
> then-dispatch so a future grammar that reintroduces identical forms cannot
> produce a spurious `fail`. The PR adds the collapse + an assertion that no
> polymorph retains a duplicate signature post-collapse.

Consequence for the shipped artifacts: **no stored `$variant` discriminant
ships in 1–6.** The runtime resolves polymorphs structurally — wrap knows the
concrete kind; factory/`from` select a form explicitly; render dispatches on
kind + slot presence. `$variant` is **diagnostics/validate-only** (the same
scope discipline as `node-model.json5`, #10): it may appear in the serialized
Model and the validator's dispatch map, never in generated `types.ts` /
`factories.ts` / `from.ts` / `wrap.ts` / transports / templates.

### ⚠ FLAG — dispatch is total ONLY after identical-form collapse

`AssembledPolymorph` (`node-map.ts:3106`) and `PolymorphRule` carry form
metadata that today feeds a stored discriminant. The end-state keeps the form
metadata (the resolver reads it) but removes `$variant` from the *emitted* code
surfaces. **Deterministic dispatch is total ONLY after identical-signature forms
collapse** (C2 above) — the collapse is a prerequisite step inside the
deterministic-dispatch PR (**PR-I**, the resolver), upstream of `$variant`
removal (**PR-J**, which depends on PR-I). See §5.

> **Blast-radius note (verified).** `$variant` ships *heavily* in current
> generated code (e.g. typescript `types.ts` ~25 occurrences, `factories.ts`
> ~70; also `from.ts` / `wrap.ts` across all 3 grammars). Removing it from the
> shipped surfaces (**PR-J**) is a substantial, validate-gated change — the
> PR-I structural resolver must reproduce every dispatch decision the stored
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

---

## §5. Strangler PR sequence

Ordered so each PR (a) migrates one concern, (b) regenerates all 3 grammars +
runs `counts --backend native`, (c) **cannot regress** because each is either
behavior-preserving-by-construction or gated by a diff probe that must reach
zero before merge. The baseline gate per PR: `rust 178/134/107`,
`python 104/95/73`, `ts 172/81/59` (re-measure each).

**PR3 is a hard prerequisite** (it has not landed; this spec's later PRs assume
the legacy walker + wrapper types are gone). **ClauseRule is NOT part of PR3** —
it is removed by PR-M in THIS spec (§C), bundled with the other sittir-invention
rule-IR cuts.

| PR | Name | Changes | Validates | Why it can't regress |
|---|---|---|---|---|
| **PR3** (prereq) | Delete legacy render walker + wrapper types | Per `1ebe0407` design (**ClauseRule DROPPED from it — see PR-M**): delete `template-walker.ts`, `renderTemplate()` methods, wrapper rule types (`OptionalRule`/`FieldRule`/`RepeatRule`/`Repeat1Rule`/`AliasRule`), RawRule snapshot. | full regen + counts; the `TemplateEmitter` is already authoritative | the authoritative path already produces the output; legacy is dead-weight |
| **PR-A0** | Normalize losslessness fix — `collapseWrappers` preserves `id`/`separator` (§4 audit) | Give `collapseWrappers`'s single-member-collapse + wrapper-fold arms (`optimize.ts:622/624/630/633/638/643`) the `withAttrsFrom(rule, survivor)` treatment (parity with `collapseSeq` `simplify.ts:1001-1002`), so the discarded node's `id` (and pre-wrapper-deletion `separator`) ride onto the survivor. Apply the same to `canonicalizeSeqOfLeaves` (`simplify.ts:1192-1198`, benign-now but fixed for parity/defense). Makes Normalize **genuinely lossless** (#2 enforced). | counts unchanged + a probe asserting single-member collapse preserves `id`/`separator` (no `slotByRuleId` miss introduced by collapse) | adding `withAttrsFrom` only carries MORE data onto the survivor — strictly non-lossy, can't regress; closes the already-open degraded-`slotByRuleId` window **before** PR-D onward deepen slot-lookup reliance |
| **PR-A** | Reconcile `_new` naming to legacy (diff → 0), WIDE probe | No emitter changes. Add a `tools`-CLI probe that, for every slot in all 3 grammars, asserts **each projected name equals its getter-computed value**: `storageName` vs `storageNameNew`, AND `name`→`storageName`, AND `configKey`/`propertyName`/`paramName`/`parseNames` vs the §2 getter formulas (`snakeToCamel`/`pluralize`/`safeParamName`/the parse-name rule). Fix `collect-slots.ts`/`simplify.ts` until **all** divergences = 0 (H1). | the WIDE divergence probe = 0 for every projected name; counts unchanged | no consumer reads `_new` yet; the probe guarantees every getter PR-B introduces is byte-identical — not just `name`/`storageName` |
| **PR-B** | `AssembledNonterminal` → class | Swap the interface for the class (§2 getters). Construct via `new` in `collect-slots.ts`. Delete the `_new` suffixed fields (now getters). One slot identity: `storageName` (snake_case); migrate `slot.name` reads → `slot.storageName` here. `refKindNames` is private `#refKindNames`, public via `kinds` only (CW4). | counts unchanged (byte-identical, guaranteed by PR-A's WIDE probe) | every getter (`configKey`/`propertyName`/`paramName`/`parseNames` included) was proven value-identical in PR-A |
| **PR-C** | Eliminate `origin`; re-point `'inferred'` behavior reads to `slot.isUnnamed`; drop dead `'inlined'` | Replace every `slot.origin === 'kind'` test (wrap `collectConcreteStorageKeys` `wrap.ts:497`) AND every **behavior** read of `slot.source === 'inferred'` (`shared.ts:1056/1138/1173`, `render-module.ts:585/597/656/669`, `templates.ts:1540`) with the **`slot.isUnnamed` getter** (`= fieldName === undefined`, §2 / EmitDRY-4). Delete `origin` + `SlotOrigin`. **KEEP** the `'inferred'` producer + the diagnostic read (`node-model.ts:318`) — retained provenance (#15 / Finding 5 / C1). Drop only `'inlined'` from `SlotSource` — leaving `'grammar' | 'override' | 'enriched' | 'inferred'`. | counts unchanged; wrap + render + factory-mode byte-diff; `node-model.json5` still serializes `source` | `isUnnamed` (`fieldName === undefined`) is the structural signal both `origin:'kind'` and the behavior reads of `source:'inferred'` approximated; `'inferred'` stays diagnostics-live; `'inlined'` had no producer |
| **PR-D** | wrap reads the class; delete `SlotModel`; `$children`→`$other` (paired codegen+rust) | Delete `compiler/slot-model.ts`. wrap.ts reads `slot.arity`/`slot.storageKey` getters instead of `createNamedSlotModel(...)`. **Redesign** the `$children` catch-all → wrap-only `$other` bucket (Finding 3 / Q4 / JC5). **Rust-reader twin (M2):** the napi reader's child-routing pass — which today routes unmatched children to a `$children`-keyed field — re-targets them to a `$other`-keyed accumulator; the reader emits `$other` ONLY for parsed children matching no named slot, and the codegen emits the matching rust struct field (a `Vec` of raw transports, NOT a typed slot). Both sides land together. | counts (esp. rust read-render-parse ast); wrap byte-diff; rust `cargo check` | `arity`/`storageKey` getters are identical functions to `SlotModel`'s; `$other` is wrap+reader-only so no typed/render surface changes |
| **PR-D2** | Helper names must not leak into slot `values` (H2 — fixes a real OPEN bug) | **Discovery (cited):** today rust leaks 5 synthesized-helper names into slot values — `const_item.const_item_optional1 → _const_item_optional1`, `for_expression`, `function_signature_item`, `let_declaration` (`_..._optional3`), `loop_expression` (verified against `node-model.json5`); ts/python leak 0. Ensure the slot's `values` hold the **inlined target kinds**, not the `_<parent>_optionalN`/`_repeatN` helper name. Fix in Normalize/Simplify (`inlineRefs`/`reapplyInlinedLeafAttrs`, `simplify.ts:356/366`): when a helper ref is inlined, the surviving slot value must reference the helper's CONTENT kinds, not the helper symbol. | the H2 leak probe = 0 across all 3 grammars (rust 5→0); counts unchanged | makes PR-E's assumption TRUE before PR-E relies on it; the leaked names render to invalid kinds today, so fixing them only corrects |
| **PR-E** | transport + render read the class | Transport-projection / render-module read `slot.values`/`slot.kinds`/`slot.storageKey` getters; drop node-wide `meta.separators` fallback (per-slot stamping covers all kinds). **Depends on PR-D2** — values now hold inlined kinds. | counts; H2 leak probe still 0 | the slot's `values` hold inlined target kinds (guaranteed by PR-D2); getters identical |
| **PR-F** | factory + from + types read the class | factories/from/types consume getters; `from.ts` storageKey param becomes `slot.storageKey`. **No `$other`** on these surfaces (Q4). | counts; from pass-rate | getters identical to today's stored fields; `$other` was never on these surfaces in the end-state |
| **PR-G** | Diagnostics severity model + Assemble→Project gate | Add `compiler/diagnostics.ts` (`DiagnosticSink`, severity) + `compiler/emit-gate.ts` (`assertEmittable`); wire the gate into `generate.ts` after `assemble()`. Move the unnamed-choice warner global (`collect-slots.ts:61-68`) into the sink. Initially all current heuristics still fire (no `fail` yet) — gate is a no-op until PR-L flips severities. | counts unchanged; gate passes (no `fail` emitted yet) | additive infrastructure; no severity is `fail` until PR-L |
| **PR-H** | Phase rename + shared `transforms.ts` + ctx + node-behavior-to-class | Rename `link.ts`→`classify.ts`, `optimize.ts`→`normalize.ts`. Extract shared idempotent ops to `transforms.ts`. Introduce `NormalizeCtx`/`SimplifyCtx`/`AssembleCtx` (carrying the sink from PR-G). Apply the §7.7 `<operation><ObjectType>(target, ctx)` signatures. **Node-behavior-to-class:** `markUserFacing`→`(node, ctx)` method; **DELETE the `markParameterlessKinds` fixpoint + stored field → memoized cycle-guarded `isParameterless`/`stampExpression` getters** on `AssembledNode` (§7.3 / §7.7), terminals override the base case. | counts; full test suite; the parameterless getter produces byte-identical factory auto-stamp output | pure rename + move + method relocations; the getter is the *same* recursion the fixpoint computed (cycle = not-parameterless matches the fixpoint's never-marks-a-cycle behavior), so factory output is unchanged |
| **PR-I** | Deterministic polymorph resolver + identical-form collapse (H3 split — resolver) | Add the slot-presence+kind resolver (`project_polymorph_dispatcher_slot_probe`, generalized). **Prerequisite step:** collapse identical-signature forms (C2 / §4d) so dispatch is total; assert no polymorph retains a duplicate signature. Resolver is internal — no shipped-surface change yet. A non-resolution becomes `fail` (unreachable post-collapse). | counts; no compile-time "no variant matched"; collapse assertion holds | collapse removes the only un-disambiguable case; current corpus has 0 identical-form sets (verified §4d) so collapse is a no-op today |
| **PR-J** | Remove `$variant` from shipped surfaces (H3 split — depends on PR-I) | Remove the stored `$variant` discriminant from `types.ts`/`factories.ts`/`from.ts`/`wrap.ts`/transports/templates (~95+ ts sites — see §4d blast-radius). Shipped runtime dispatches via the PR-I resolver. `$variant` survives ONLY in the serialized Model + validator dispatch map (#15, diagnostics/validate-only). | counts; validator still resolves every polymorph; no `$variant` in generated 1–6 | the PR-I resolver reproduces every dispatch decision the discriminant made; `$variant` is provenance, not behavior (#15) |
| **PR-K** | `factory-map.json5` → `node-model.json5` (H3 split — orthogonal) | Make `node-model.json5` carry factory-map's subset (§6); point validator/`nodeToConfig` at it; delete `factory-map.json5` + emitter. | validator passes against the consolidated model; counts | factory-map is a strict subset (§6 proof); pure consolidation, independent of the resolver/`$variant` work |
| **PR-M** | Sittir-invention rule-IR cut: Polymorph/Variant → Model-only + ClauseRule removal + opaque Group classifier delete (§B/§C/§D, #16) | **§B:** delete `PolymorphRule`/`VariantRule` from the `Rule` union; add the `PolymorphSpec`/`FormSpec` side-channel on the linked grammar; reframe `promotePolymorph`/`applyOverridePolymorphs` to RECORD a spec; delete the 6 `mapPolymorphForms` arms + the form-snapshot block in `normalize.ts` (per-form snapshot → Assemble's `buildAssembledFormGroups`); delete the `evaluate.ts:330-339` variant-retype. **§C:** delete `ClauseRule` + `detectClause` (`link.ts:2292`) + the `'clause'` arms — `optional(seq(fields))` is plain structure (closes `project_clause_multifield_gap`). **§D:** delete Link's `classifyHiddenSeqRule` GroupRule path (`link.ts:1963/1975`); Assemble builds `AssembledGroup` from the wire helper. `AssembledPolymorph`/`AssembledGroup` SHAPES unchanged. | counts; `PolymorphRule` import reach 7→spec-only; the secondary-field gap closes (a `clause` multi-field kind now keeps all fields) | the spec + structural `choice` reconstruct the identical `AssembledPolymorph`; clause fields were already in the seq (just dropped at naming) — restoring them only adds, never removes; the wire group helper is the same kind Link's classifier shadowed |
| **PR-N** | enrich-widening — name the easy positional symbols (§F) | Widen enrich symbol-to-field promotion to ALL unambiguous single-occurrence positional symbols (LR-safe via the landed `syntheticInline` `_kw_*` auto-inline). Shrinks the 243 `inferred` slots; pure-direct duplicates → deterministic positional numbering. | counts; the `inferred` slot count drops; no LR regression (override-parser errors unchanged) | promotion is deterministic + grammar-visible (#16); the `_kw_*` auto-inline keeps the parse table stable; naming a slot doesn't change its values/cardinality |
| **PR-O** | Structural de-dup (M1/MO2/P1 — non-behavioral) | **MO2:** extract `SlotValueBase` (`NodeRef`+`TerminalValue` share 5 fields). **P1:** extract `BaseEmitConfig` (`grammar`/`nodeMap`/`generatedIdTables?` on every emit Config). **M1:** relocate the shared transforms into `transforms.ts` (de-scatter — already single-bodied, no merge). | counts unchanged; type-check passes | pure type/interface refactors + a file move; zero runtime behavior change |
| **PR-P** | Content-classification cut: Terminal + Enum (flat) → predicates (§G-cut, #16/#1) | **Terminal (clean):** delete `TerminalRule` + `isTerminal`; delete `promoteAndLogTerminalRules` (`link.ts:388`); delete the transparent `case 'terminal'` arms (`wrapper-deletion.ts:155`, `simplify.ts:404/734/1159/1222`, `optimize.ts:484/546/718`, `rule.ts:485/556/925`, `templates.ts:605`); add `isTerminalShaped` (reconcile `link.ts:1617` + `assemble.ts:1561`); `classifyTerminalFallback` becomes primary, the `assemble.ts:1549` throw becomes the normal path; `AssembledPattern` narrows to `PatternRule` + natural subtree. **Enum (FLAT, shape-identical):** delete `EnumRule` + `isEnum`; `normalizeEnumMembers` keeps only single-literal→`StringRule`; `evaluate.ts:268` stops emitting `EnumRule`; delete the enum branch of `classifyHiddenChoiceRule` (`link.ts:1937`) + the `case 'enum'` arms; classify enums at Assemble via **`choice && members.every(isEnumLeaf)` (FLAT, no recursion)** → `AssembledEnum`. | counts unchanged; **the classified enum set + pattern set are byte-identical to today** (flat predicate matches the old flat `EnumRule`/`isAllTextShape` exactly); transport enums (read `AssembledEnum`) unchanged | both predicates reproduce the exact shape the rule-type wrappers classified; the wrappers were transparent (terminal) / a flat all-string test (enum) — no nested widening yet |
| **PR-Q** | Enum recursive-widening (count-gated, §G-cut staging step 2) | Switch the enum predicate from flat to **recursive `isEnumShaped`** (`choice && members.every(isEnumShaped)`) so nested literal-choices classify as `AssembledEnum`; `AssembledEnum.values` flattens nested leaves. **Count-gated:** the newly-classified nested choices are reviewed + all 3 grammars regen'd; pass-rate must hold. | counts hold; the newly-`enum` kinds are reviewed; **measured widening delta = rust 0 / ts 1 / python 0** (so a near-no-op) | the widening only re-classifies choices whose members are all literal sets (recursively) — semantically already enums; the measured delta is ≤ a handful, each regen-verified |
| **PR-L** | Flip remaining heuristics to `propose-*` fail-diagnostics (author overrides first) | For each *guess* still present after PR-M/PR-N (`inferFieldNames` residue → `propose-field`; any leftover polymorph candidacy → `propose-polymorph`; the choice distribute-vs-union guess `collect-slots.ts:520`): **first** instrument the **pre-merge** slot stream (before `mergeSlotsByName`, §F) to count the direct+repeat-mix `propose-field` FAIL residue per grammar; author the `field()`/`polymorphs:` overrides that clear it (counts must hold); **then** delete the heuristic and `fail`. **NOT in scope:** (a) the sanctioned `content` slot (§4c) — stays `warn`, never `fail`; (b) `propose-top-level-rule` — info/warn, never `fail` (auto-groups render fine); (c) the **parameterless derivation** — not a guess, became a getter in PR-H. | counts hold AT EACH heuristic removal; the pre-merge `propose-field` residue → 0 via overrides; `overrides.suggested.ts` reviewed; gate (PR-G) actively blocks | overrides authored before each guess is removed → deterministic path produces the same Model; `content`/`propose-top-level-rule`/parameterless are not fails, so no surprise cliff |

**Proposed PR count: 19** (PR3 prereq + PR-A0 + PR-A..PR-Q + PR-L, incl. PR-D2/PR-M/PR-N/PR-O/PR-P/PR-Q).
**PR-A0 (first, right after PR3)** is the Normalize losslessness fix (§4 audit) —
sequenced before PR-D onward so the degraded-`slotByRuleId` window closes early.
PR-A..PR-D are the load-bearing core (centralize naming + kill
`SlotModel`/`origin`/`name`, narrow `$children`→`$other`); PR-D2 fixes the
helper-name leak; PR-E..PR-F migrate the remaining read sites; PR-G is the
diagnostics gate; PR-H is the phase reorg + method conformance + the
parameterless getter; PR-I/PR-J/PR-K are the H3-split resolver / `$variant`-removal
/ factory-map consolidation; **PR-M cuts the sittir-invention rule types
(Polymorph/Variant/Clause/opaque-Group) per #16; PR-N widens enrich;
PR-O is non-behavioral structural de-dup; PR-P cuts the content-classification
rule types (Terminal + flat Enum) to predicates; PR-Q is the count-gated
recursive-enum widening;** PR-L is the final `propose-*` heuristics-to-fail flip
(it runs LAST — it depends on PR-M removing the retype, PR-N shrinking the
residue, and PR-G providing the gate). Each PR is a strangler step that
**removes the old code it supersedes within the same PR** — no dedicated
"sunset" PRs.

**Gating discipline (#12, brainstorm validation gate).** Each PR ends with:
`npx tsx packages/codegen/src/cli.ts --grammar <g> --all --output …` for all 3,
then `counts --backend native <g>` for all 3, asserting no regression vs the
baseline. **PR-A0 gates on a probe asserting single-member collapse preserves
`id`/`separator` (no `slotByRuleId` miss from `collapseWrappers`);** PR-A gates
on the WIDE divergence probe = 0 (every projected name);
PR-D2 gates on the H2 helper-leak probe = 0; PR-I gates on the collapse
assertion; PR-M gates on the clause-multifield gap closing (no field lost) +
`PolymorphRule` leaving the Rule union; PR-N gates on the `inferred` count
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
| `fieldAliasMap` | `slot.aliasSources` (`factory-map.ts:87`) | YES — `node-model.ts:328` serializes `aliasSources` per field |
| `factoryFields` | `resolveFactoryFieldNames(node)` (`factory-map.ts:96`) — the factory-field gating predicate | derivable from slots + `isParameterless` |
| `factorySlots` | `deriveSlotCardinality(field)` per slot (`factory-map.ts:106`) | YES — `node-model.ts:314` serializes `required`/`multiple`/`nonEmpty` per field |
| `polymorphVariants` | `node.forms` field-signatures / `node.variantChildKinds` (`factory-map.ts:119`) | partially — node-model has `forms` + `variantChildKinds` (`node-model.ts:249/304`) but not the pre-computed `childKind`/`fields` dispatch map |

**Two maps are already in `node-model.json5`** (`fieldAliasMap`,
`factorySlots`). Two are pure functions of serialized facts
(`factoryShapes`, `factoryFields`). One (`polymorphVariants`) has its *inputs*
serialized but not the dispatch-ready form.

### Consolidation mechanism (PR-K)

1. **Extend `buildNodeModel` (`node-model.ts:178`)** to also emit the
   dispatch-ready `polymorphVariants` (move `buildFactoryMap`'s `polymorphVariants`
   logic, `factory-map.ts:119–192`, into the node-model serializer — it reads
   `node.forms` / `node.variantChildKinds` / `expandRuntimeDiscriminatorKinds`,
   all already available). Emit `factoryShapes` + `factoryFields` by calling the
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
4. **`$variant` is serialized here, but its REMOVAL from shipped code is PR-J
   (H3 split).** The `polymorphVariants` dispatch map (carrying `$variant`) is
   consumed by the *validator* and serialized into `node-model.json5` — this PR-K
   consolidation provides that serialized home. The separate act of *removing*
   `$variant` from generated `types.ts`/`factories.ts`/etc. is **PR-J**, gated on
   the PR-I resolver. Keeping the two apart (consolidation orthogonal to dispatch)
   is exactly why H3 split them: PR-K can land without touching the shipped
   surfaces, and the validator keeps reading `$variant` from the Model regardless.

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
| `compiler/classify.ts` | RENAME of `link.ts` (+ folds `link-refine.ts`, `field-shape.ts`) | **Classify** | `classifyGrammar(raw, ctx)` (was `link`), `resolveRule`, `classifyHiddenRule`, `hoistIndentIntoRepeat`, `annotateBlockBearerFields`. **`promotePolymorph`/`applyOverridePolymorphs` REFRAMED** — they RECORD a `PolymorphSpec` (§B). **DELETED:** `detectClause` (§C); `classifyHiddenSeqRule`'s opaque GroupRule path (`link.ts:1963/1975`, §D); `promoteAndLogTerminalRules` (`link.ts:388`, called `:138`) + the enum branch of `classifyHiddenChoiceRule` (`link.ts:1935/1937`) as rewriters (§G-cut — classification is now a predicate at Assemble); `inferFieldNames`, `looksLikePolymorphCandidate`, `choiceNeedsVariantWrapping` (→ `propose-*` diagnostics, §E / PR-L). **NEW:** `isTerminalShaped` (reconciles `link.ts:1617` `isTerminalShape` + `assemble.ts:1561` `isAllTextShape` into one shared predicate) |
| `compiler/normalize.ts` | RENAME of `optimize.ts` (+ folds `wrapper-deletion.ts`) | **Normalize (non-lossy)** | `normalizeGrammar(linked, ctx)` (was `optimize`), `fanOutSeqChoices`, `factorChoiceBranches`, `dedupeSeqMembers`, `inlineSingleUseHidden`, `collapseWrappers`, `pushdownWrappers` (was `applyWrapperDeletion`). Produces the **RenderRule** snapshot. **FIXED (PR-A0, §4 audit):** `collapseWrappers` (`optimize.ts:622-645`) now threads `withAttrsFrom` on its single-member-collapse + wrapper-fold arms so `id`/`separator` survive — the one place Normalize was NOT actually lossless (#2). **DELETED (§B):** the 6 `mapPolymorphForms` arms (`optimize.ts:226/357/399/…`) + the per-form snapshot block. **DELETED (§G-cut):** the transparent `case 'terminal'` arms (`optimize.ts:484/546/718`) + `case 'enum'` arms — the natural `seq`/`string`/`choice` arms already handle the shape; `rulesEqual`'s enum arm folds into the choice arm |
| `compiler/simplify.ts` | REFINED — see `simplify.ts:331` | **Simplify (lossy)** | `computeSimplifiedRules`, `simplifyRules`, `simplifyRule`, `fuseHeadRepeatLists`, `hoistSharedFieldAcrossChoiceBranches`, `mergeChoiceBranches`, the field-hoist helpers. Produces the **SimplifiedRule** snapshot. **DELETED (§G-cut):** the transparent `case 'terminal'` arms (`simplify.ts:404/734/1159/1222`) + `case 'enum'` leaf arms — the underlying natural shapes are handled directly |
| `compiler/transforms.ts` | **NEW** (#13a) — **rationale: de-scatter, not de-dup (M1).** These ops are already a *single body each*, shared by import between Normalize & Simplify today; there is no duplicated implementation to merge. The module exists to give the shared ops one named home (so a reader finds them in one place, and the `(rule, ctx)` signature is uniform) — not to eliminate copy-paste. | shared idempotent ops invoked by BOTH Normalize & Simplify | `collapseSeq(rule, ctx)`, `canonicalizeSeqOfLeaves(rule, ctx)` (`withAttrsFrom`-threaded per PR-A0 — single-member collapse preserves `id`/`separator`), `inlineRefs(rule, ctx)`, `deleteWrapper(rule, ctx)`, `pushAttrsToLeaves(rule, …)`, `combineMultiplicity`, `extractRepeatShape`, `findRepeatFlag` (moved out of the deleted `template-walker.ts`) |
| `compiler/assemble.ts` (+ slot walk) | REFINED — see `assemble.ts:407` | **Assemble** (sole Model-builder) | `assembleModel(normalized, ctx)`, `classifyNode(rule, ctx)`, `hydrateSlotRefs(nodeMap, ctx)`, `markUserFacing(node, ctx)` (merged — §G/M3), `resolveCollidingNames(nodeMap, ctx)`, `resolveIrKeys(nodeMap, ctx)`, `collectAnonymousNodes(nodeMap, ctx)`, `collectSlots(rule, ctx)` (slot-enum walk — naming logic MOVED to the class, §7.3), `buildAssembledFormGroups(node, ctx)` (now reads the `PolymorphSpec` + parent `ChoiceRule` arms, §B — was `PolymorphRule.forms`). **AssembledPolymorph** built from `PolymorphSpec`; **AssembledGroup** built from the **wire-synthesized helper kind** (`dsl/wire/auto-groups.ts`, grammar-visible with a `kindId`, §D) — NOT from Link's opaque GroupRule classifier. **`classifyTerminalFallback` (`assemble.ts:1546`) becomes the PRIMARY predicate-driven classifier (§G-cut)** — `isTerminalShaped` → `modelType:'pattern'` (`AssembledPattern`); `isEnumShaped` → `modelType:'enum'` (`AssembledEnum`); **the `throw` at `assemble.ts:1549` becomes the normal path** (no longer a fallback). **DELETED:** `buildSlot` free function (→ `AssembledNonterminal` constructor); **`markParameterlessKinds` fixpoint + helpers (→ memoized getters, §7.3).** All signatures per the §7.7 exhaustive map |
| `compiler/rule.ts` | REFINED — see §7.4 | **shared rule helpers** (#13c) | Rule IR types + `RuleBase`; type guards (`isSeq`, …); `literalTextOf`, `collectFieldNames`, `replaceAtPath`; **NEW predicates `isTerminalShaped`/`isEnumLeaf`/`isEnumShaped`** (§G-cut — or a sibling `predicates.ts`). **DELETED — wrappers (PR3):** `OptionalRule`/`FieldRule`/`RepeatRule`/`Repeat1Rule`/`AliasRule`. **DELETED — sittir inventions (PR-M, §B/§C):** `PolymorphRule`/`VariantRule`/`ClauseRule` + `isClause` (`rule.ts:440`). **DELETED — content classifications (§G-cut):** `EnumRule`/`TerminalRule` + `isEnum` (`rule.ts:441`)/`isTerminal` (`rule.ts:444`); `normalizeEnumMembers` (`rule.ts:276`) keeps ONLY the single-literal→`StringRule` collapse, else returns a plain `ChoiceRule` |
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
| 1 — canonical types | `emitters/types.ts` | `emitTypes(config): string` (`types.ts:103`) | reads `slot.configKey`/`slot.values`/`slot.isRequired`/`slot.kinds` getters; keyword-presence via cached `slot.storageInfo?.kind` (EmitDRY-2); **no `$other`** |
| 2 — factories | `emitters/factories.ts` | `emitFactories(config): string` (`factories.ts:81`) | reads getters (incl. `slot.kinds`, `slot.storageInfo`); **no `$other`**; no stored `$variant` |
| 3 — `from` | `emitters/from.ts` | `emitFrom(config): string` (`from.ts:304`) | `storageKey` param → `slot.storageKey` getter; `slot.kinds` (not `slotKindNames`); keyword-presence via cached `slot.storageInfo?.kind` (EmitDRY-2); **no `$other`**; explicit form selection (no `$variant`) |
| 4 — wrap | `emitters/wrap.ts` | `emitWrap(config): string` (`wrap.ts:80`) | reads `slot.arity`/`slot.storageKey`; `collectConcreteStorageKeys` routes on `slot.fieldName === undefined` (not `origin`); **`$other`** bucket lives HERE + its rust-reader twin only |
| 5 — transports | `emitters/transport-common.ts`, `transport-projection.ts`, `transport-projection-cache.ts` | `buildSupertypeTransportSet(nodeMap)` (`transport-common.ts:71`) + projection builders | read `slot.values`/`slot.kinds`; **no `$other`**; no stored `$variant` |
| 5/6 — render bridge | `emitters/render-module.ts` | `emitRenderModule(...)` (`render-module.ts:2349`), `emitRenderModuleBundle(...)` (`:436`), `emitHashFiles(...)` (`:2315`) | per-slot separator from value stamp (drop node-wide `meta.separators`); structural polymorph dispatch on kind+slots |
| 6 — template renderer | `emitters/templates.ts` | `runTemplateEmitter(config): EmittedTemplates` (`templates.ts:1506`); per-modelType `emitBranchTemplate`/`emitGroupTemplate`/`emitMultiTemplate`/`emitPolymorphTemplate`; shared `emitRule(rule, ctx)` (`:739`) | reads **`node.renderRule`** (non-lossy); **DELETED:** legacy `emitBodyForNode` + `emitJinjaTemplates` legacy path; the `case 'terminal'` arms in `emitRule`/`isLeftmostTerminalImmediate` (`templates.ts:605` — recurses one level shallower onto the natural subtree, §G-cut, no render fact lost); **the dead `snakeToCamel` copy (`templates.ts:137`)** — zero in-file callers, duplicate of canonical `node-map.ts:343`; the test import re-points to the canonical export (EmitDRY-5) |
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
| `AssembledNonterminal` | **REFINED → CLASS** (§2 full def) | the slot class; getters `storageName` (the ONE identity)/`storageKey`/`parseNames`/`configKey`/`propertyName`/`paramName`/`arity`/`isRequired`/`isMultiple`/`isNonEmpty`/`hasTrailing`/`hasLeading`/`kinds`. Stored: `fieldName`/`values`/`aliasSources`/`source` (provenance, incl. retained `'inferred'`)/`sourceRuleId`/`storageInfo`/`#refKindNames`. **DELETED:** the `name` field/alias (one identity: `storageName`); stored `storageName`/`propertyName`/`configKey`/`paramName`/`hasTrailing`/`hasLeading`/`origin`; the `_new` suffixed fields; `SlotSource` variant `'inlined'` only (`'inferred'` retained as provenance) |
| `AssembledBranch` | REFINED — see `node-map.ts:2586` | `_slots` record now holds `AssembledNonterminal` instances; `slots`/`fields` getters unchanged. **DELETED:** `renderTemplate()`. `children` getter already retired (returns `[]`) |
| `AssembledPolymorph` | REFINED — see `node-map.ts:3106` | shape (`forms`/`formRules`/`variantChildKinds`) **UNCHANGED**, but **constructed from the `PolymorphSpec` side-channel + the parent's structural `ChoiceRule` arms (§B), not from a `PolymorphRule.forms` rule member**. The deterministic resolver reads the spec; **no emitted `$variant`** (§4d). **DELETED:** `renderTemplate()` |
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
(`node-map.ts:168`), `TerminalValue` (`:195`), `NodeOrTerminal` union (`:210`),
`UnresolvedRef` (`:128`) — carry per-value
`multiplicity`/`separator`/`trailing`/`leading`/`immediate`/`tokenized`/`resolvedKind`,
the non-droppable render facts. `FieldStorageInfo` (`:161`) UNCHANGED.
`BranchSlotClass` (`:149`) UNCHANGED.

> **MO2 — extract `SlotValueBase`.** `NodeRef` and `TerminalValue` share **5
> fields** (`kind` discriminant, `multiplicity`, `separator?`, `trailing?`,
> `leading?` — `node-map.ts:171-175` vs `:199-202`). Extract a `SlotValueBase`
> interface both extend; each adds only its own payload (`NodeRef.node`;
> `TerminalValue.value`/`resolvedKind?`/`immediate?`/`tokenized?`). The
> `NodeOrTerminal` union + the `isNodeRef`/`isTerminalValue` guards are unchanged.
> Pure structural de-dup of the field declarations — no behavior change.

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

#### §B. Polymorph / Variant are Model-only (a classification side-channel)

`PolymorphRule`/`VariantRule`/`PolymorphForm` were a **sittir-only rewrite** of a
grammar `choice` — there is no tree-sitter kind named "polymorph"; the parser
sees a `choice`. Per #16 the *structural* rule stays a plain `ChoiceRule`, and
the polymorph *classification* becomes a side-channel on the linked grammar,
exactly parallel to how `supertypes` and (post-§6) `polymorphVariants` already
ride alongside the rules:

```ts
// classify.ts output (LinkedGrammar) — NEW side-channel, NOT in the Rule union
interface PolymorphSpec {
  readonly parentKind: string;          // the kind whose choice is polymorphic
  readonly source: 'promoted' | 'override';
  readonly forms: readonly FormSpec[];
}
interface FormSpec {
  readonly name: string;                // variant name (was VariantRule.name)
  readonly choiceArmIndex: number;      // which arm of the parent's ChoiceRule this form is
  readonly discriminatorKinds?: readonly string[];  // override dispatch hint
}
```

- **Construction:** `AssembledPolymorph` (`node-map.ts:3106`) shape is
  **UNCHANGED**; it is built in Assemble's `buildAssembledFormGroups`
  (`assemble.ts:389`) from the `PolymorphSpec` + the parent's structural
  `ChoiceRule` arms — **not** from `PolymorphRule.forms`. Each form's slots come
  from the corresponding choice arm via `collectSlots` (the same per-form
  snapshot, relocated here from `normalize.ts`).
- **The deterministic resolver (§4d) reads the spec**, not a rule member.
  `$variant` stays validate-only (#15).
- **Verified import-shrink:** `PolymorphRule` is imported across **7** compiler
  files today (`optimize.ts`, `link.ts`, `node-map.ts`, `assemble.ts`,
  `evaluate.ts`, `wrapper-deletion.ts`, `rule.ts`); after §B only Assemble +
  classify reference the `PolymorphSpec` type → the rule-IR member's reach drops
  to the side-channel's 1–2 definition sites.

#### §C. ClauseRule removal (NEW to THIS spec — did NOT land in PR3)

`ClauseRule` is the same anti-pattern: `detectClause` (`link.ts:2292`, called at
`link.ts:1733`) rewrites `optional(seq(string, field, …))` into a sittir-only
`ClauseRule` named after the *first* field — which **dropped secondary fields**
(`project_clause_multifield_gap`). Per #16 there is no grammar kind for a
"clause"; it is plain `optional(seq(...))`. Remove it:
- Delete `ClauseRule` from the `Rule` union (`rule.ts:113/232`), `isClause`
  (`rule.ts:440`), the `'clause'` case arms (`rule.ts:490/554`, `link.ts:287/1125`,
  `collect-slots.ts:151/480`), and `detectClause` (`link.ts:2292`).
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
`link.ts:1935` is the enum rewriter). Per #16/#1 the classification is a
**predicate over the natural structural shape + a Model node**, not a Rule
member. Both leave the `Rule` union; the Model nodes `AssembledEnum` /
`AssembledPattern` stay. (This reverses the prior "deferred" note now that the
dig is complete.)

**Shared predicates (composition order; live in `rule.ts` or a `predicates.ts`):**
```ts
// 1. base leaves
isTerminalShaped(rule)  // reconciles link.ts:1617 isTerminalShape + assemble.ts:1561 isAllTextShape
                        //   into ONE predicate: a seq/string/token subtree with no fields/symbols
isEnumLeaf(rule) = rule.type === 'string'   // StringRule ONLY — closed literal set
                                            //   (pattern/token deliberately excluded: not a closed set)
// 2. enum on top (RECURSIVE — the end-state)
isEnumShaped(rule) = isEnumLeaf(rule)
  || (rule.type === 'choice' && rule.members.length > 0 && rule.members.every(isEnumShaped))
```

**Terminal (clean — no behavior change).**
- Delete `TerminalRule` from the union + the `isTerminal` guard (`rule.ts:444`).
- Delete `promoteAndLogTerminalRules` (`link.ts:388`, called `:138`) as a
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
  `classifyHiddenChoiceRule` (`link.ts:1937`) is deleted as a rewriter.
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
| `classifyGrammar(raw, ctx)` | `link(raw, include?)` | `classify.ts` |
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
| `resolveRule(rule, ctx)` | `resolveRule(rule, currentName, allRules, supertypes, externalRoles)` | `classify.ts` (extra args → ctx) |
| `classifyHiddenRule(rule, ctx)` | `classifyHiddenRule(name, rule, supertypes, references)` | `classify.ts` |
| `promotePolymorph(rule, ctx)` | same | `classify.ts` |
| `applyOverridePolymorphs(rule, ctx)` | same | `classify.ts` |
| `collectSlots(rule, ctx)` | `collectSlots(rule, kindForName?, kindEntries?, inherited?, sep?)` | `assemble.ts` |

*RuleMap transforms (target=the rule map):*

| End-state | Was | Module |
|---|---|---|
| `inlineSingleUseHidden(rules, ctx)` | same | `normalize.ts` |
| `hoistIndentIntoRepeat(rules, ctx)` | `hoistIndentIntoRepeat(rules)` | `classify.ts` |
| `annotateBlockBearerFields(rules, ctx)` | same | `classify.ts` |

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
