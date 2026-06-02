# PR-M-φ2 — Enrich-converged clause/group synthesis & the ClauseRule cut

**Status:** Design (approved direction; awaiting spec review)
**Part of:** compiler-simplification strangler — see `docs/superpowers/plans/2026-05-26-compiler-simplification-master-plan.md` (§φ2) and the master design `docs/superpowers/specs/2026-05-22-compiler-simplification-design.md`.
**Supersedes the framing of:** master plan §C (`detectClause`/`ClauseRule` removal) and §D (`GroupRule` classifier cleanup), which were scoped before the empirical findings below reframed them as a single enrich-convergence cut.

---

## 1. Goal

Retire the bespoke `ClauseRule` rule-type — and the wire/IR synthesis divergence that forced it — by making **enrich the single home for all auto-group synthesis**. A co-mandatory `optional(seq(STRING, FIELD))` clause becomes an ordinary hoisted `GroupRule` whose keyword literal stays encapsulated inside the group, off the parent's storage/factory surface. `applyAutoGroups` (the wire-only synthesis path) retires.

One sentence: **one synthesis home (enrich), one transparent-wrapper predicate, one group abstraction — no clause special-case, no wire/IR divergence.**

---

## 2. Background — why this is needed (empirical)

### 2.1 `ClauseRule` exists only to gate a co-mandatory keyword+field

`detectClause` (link.ts:2041, in `resolveRule`'s `optional` case) fires on `optional(seq(STRING, FIELD))` and produces a `ClauseRule` whose template emits one `{% if slot | isPresent %}` gating the **keyword and the field together**. Verified shape (`probe-stages --grammar rust --kind abstract_type`):

```
evaluate:  seq('impl', optional(seq('for', field('type_parameters', …))))
link:      seq('impl', clause{name: type_parameters, content: seq('for', field(…))})
```

The keyword `for` lives *inside* the clause; `abstract_type`'s surface gets one optional slot. **This encapsulation is correct and must be preserved.** The cut removes the *bespoke rule-type*, not the encapsulation — `'clause'` is threaded through ~27 switch arms (link.ts, simplify.ts, field-shape.ts) purely to carry a concept the general `'group'` arm already expresses.

### 2.2 Single-field optionals are NOT clauses (a red herring to retire)

`optional(field(X))` (e.g. `const_item`'s `visibility_modifier`, `let_declaration`'s `mutable_specifier`) lowers cleanly at **simplify** to a bare symbol with `multiplicity: "optional"` — no clause, no group, no phantom. The earlier "§D phantom `_<kind>_optional1`" framing was stale; the live trace shows nothing. **These need no work.** Only `optional(seq(STRING, FIELD))` engages `ClauseRule`.

### 2.3 The wire/IR divergence that forced a bespoke type

`applyAutoGroups` (dsl/wire/auto-groups.ts) writes synthesized `_<parent>_optionalN` helpers to **`outRules` only** — never back to `base.grammar.rules`. Consequence (verified):

- `enum_variant` (not authored) → grammar.json has `_enum_variant_optional1 = SEQ['=', FIELD(value, _expression)]`, a real `TSKindId`. But `enum_variant`'s **IR never references it** — the group is `inline:`-registered, tree-sitter flattens it, and the IR models the flattened members directly.
- This is the documented regression class at applyAutoGroups's own call site: *"link → node-model → factories does not yet consult `syntheticInline` … repeated slot requires at least one value."*

Because the wire group does not reach the IR, the IR needed its *own* representation of the co-mandatory keyword+field — that representation is `ClauseRule`. The two paths never converged, so the bespoke type persisted.

### 2.4 Why naive deletion segfaults

Deleting `detectClause` without a converged replacement leaves the IR with a bare `optional(seq('for', field))`. The template then emits `for` ungated → invalid rendered source → re-parse fails → segfault in `validate:native`. **The root cause is the missing IR-side group, not the template** — fix it at the source (enrich), and the segfault cannot recur.

---

## 3. Design principles

- **DRY (the core correctness rule).** One source for each fact: enrich is the *one* place auto-groups are synthesized; `isTransparentWrapper` is the *one* predicate path-addressing consults for wrapper transparency. No parallel wire-vs-IR synthesis; no scattered prec/optional/choice-blank transparency checks.
- **Every kind has a kindId.** All synthesis routes through `base.grammar.rules` injection *before* tree-sitter consumes the grammar (the established `enrich` `_kw_*` mechanism). No TS-side-only virtual kinds.
- **Behavior derives from structural facts.** The `source: 'enriched' | 'group-lift'` annotation is a *traversal marker*, not a behavior driver for emission — emitters continue to branch on structure (fieldName / kinds / multiplicity), per `feedback_metadata_not_behavior`.
- **Spec = clean end-state.** This document defines the end-state. Sequencing/migration timing lives in the plan.

---

## 4. End-state architecture

### 4.1 Enrich is the single synthesis home

All auto-group synthesis (`optional(seq)`, `repeat(seq)`, `repeat1(seq)`, and the clause case) moves into enrich (dsl/enrich.ts), which **injects hidden helper rules directly into `base.grammar.rules`**. tree-sitter's native `grammar()` and the IR pipeline (`evaluate → link → optimize → simplify`) both read post-enrich `base.grammar.rules`, so a single injection reaches both with no divergence. `applyAutoGroups` and its `outRules`-only / `syntheticInline` machinery retire.

Confirmation that the IR reads post-enrich: `probe-stages` shows `"source": "enriched"` fields at the **evaluate** stage.

### 4.2 The clause-hoist enrich pass

**Trigger:** `optional(seq(…))` whose seq contains **≥1 STRING and ≥1 FIELD** — this must match `detectClause`'s exact current predicate (`content.members.some(isString) && content.members.some(isField)`, link.ts:2043–2045), so the enrich pass covers precisely the kind-set the cut removes (no silent narrowing to a literal two-member `seq(STRING, FIELD)`). Also matches the tree-sitter-normalized form `optional(CHOICE[seq, BLANK])` (enrich pass 4 already descends `CHOICE[X, BLANK]`). "STRING" = an anonymous keyword literal; the seq is co-mandatory (keyword always travels with the field).

**Transform:**
1. Hoist the inner `seq(STRING, FIELD)` into a hidden rule `_<parent>_<kind>N` (naming consistent with existing auto-groups; see §4.6 on whether to use `clause`/`optional`/a unified token), injected into `base.grammar.rules`.
2. Rewrite the parent member from `optional(seq(…))` to `optional(SYMBOL(_<parent>_<kind>N))`, annotated `source: 'group-lift'`.

**Slot-count-preserving invariant:** one optional member → one optional member. The parent's top-level positions are unchanged, so authored *positional* patches (`static_item: { 2: … }`, `block: { 3: … }`) are undisturbed, and `abstract_type: {}` is a no-op.

**IR consequence:** the hidden seq-with-field is classified as a `GroupRule` by the existing `classifyHiddenSeqRule` (link.ts:1725). The parent IR is `optional(group)`; the existing optional+group path renders it — keyword encapsulated, parent factory clean.

### 4.3 Reusable transparent-wrapper traversal

Today, path-addressing transparency is scattered across `transform.ts` (lines ~300, ~482, ~735–746) and `transform-path.ts` (~202): `isPrecWrapper` checks, an ad-hoc "field-transparent wrappers (optional, prec/*)" notion, and a "2-member CHOICE-with-BLANK is transparent" special case.

**Consolidate into one predicate** `isTransparentWrapper(rule): boolean`, which all path-addressing sites route through. It returns true for:
- prec wrappers (existing),
- enriched **in-place** wrappers (`source: 'enriched'` field-wraps) — skip-and-reconstruct (generalizes the documented "override field patches unwrap enrich-inferred fields automatically").

**Hoist descend-through (superset of skip).** For an enriched **hoist** symbol (`source: 'group-lift'` SYMBOL), the path-walker must *follow the symbol to its group definition, descend into the group body, and reconstruct the symbol-ref on return* — the same skip-and-reconstruct contract prec already uses, extended to follow-and-reconstruct. This is required because hoisting *moves* content into a separate rule: a path like `closure_expression`'s `'4/0'` that descends *into* the original seq cannot be satisfied by skipping; it must descend through the hoist.

Net: author path-strings keep addressing the *original* (pre-enrich) grammar shape; enrich's reshaping is invisible to them.

### 4.4 `ClauseRule` / `detectClause` removed

Delete `detectClause` (link.ts:2041) and the `ClauseRule` type. Fold the ~27 `'clause'` switch arms (link.ts, simplify.ts, field-shape.ts) into their `'group'` siblings — a hoisted clause is now an ordinary `GroupRule`. `resolveRule`'s `optional` case reverts to plain optional handling (the hoist already happened in enrich).

### 4.5 `applyAutoGroups` retired

With `optional(seq)` / `repeat(seq)` / `repeat1(seq)` synthesis in enrich, `dsl/wire/auto-groups.ts` and its `outRules`-write + `syntheticInline` bookkeeping are dead. Remove the pass and its wire call site.

### 4.6 Open authoring detail (resolve in plan, not a blocker)

Hidden-helper naming for the clause case: reuse `_<parent>_optionalN` (uniform with existing auto-groups, simplest dedupe) vs a distinct `_<parent>_clauseN`. Recommendation: **reuse `_optionalN`** — the construct *is* an optional-hoisted group; a separate name would re-introduce a clause/non-clause distinction we are deleting. Cross-parent dedupe (canonical-stringified content) carries over from auto-groups.

---

## 5. Invariants preserved

| Invariant | How |
|---|---|
| Every kind has a kindId | enrich injects into `base.grammar.rules` before tree-sitter consumes it |
| Keyword off parent factory | keyword is a member of the hoisted group body, not the parent seq |
| Authored positional patches stable | hoist is slot-count-preserving at the parent |
| Authored descend-into-seq patches stable | `isTransparentWrapper` hoist descend-through |
| Metadata never drives behavior | `source` is a traversal marker; emitters branch on structure |
| Render/parse agreement | single synthesis source → wire and IR cannot diverge |

---

## 6. Risks & mitigations

- **Re-segfault (render-vs-parse mismatch).** Root-caused to the missing IR group; enrich convergence removes it. Gate: segfault must not recur in `validate:native`; deep `read-render-parseAstMatchPass` hold-or-improve.
- **Descend-through breaks an authored path.** Mitigated by routing *all* path sites through one predicate + the existing WIDE override-probe (0-unexpected gate) to catch any silent path-resolution drift.
- **applyAutoGroups removal regresses kinds it currently (wire-only) serves.** Mitigated by sequencing (enrich must own `optional(seq)`/`repeat(seq)` *before* applyAutoGroups is removed) and per-step native counts.

---

## 7. Acceptance criteria / gates

1. `pnpm validate:native` deep `read-render-parseAstMatchPass` **hold-or-improve** vs floor (rust 111 / ts 69 / py 74); target recovery toward the pre-spike carry-forward (rust 125 / ts 72 / py 76).
2. Independent `cargo check --workspace --features napi-bindings` succeeds (Rust-emitting PR).
3. **No segfault** in any grammar's validation run.
4. Byte-diff on representative clause kinds (`abstract_type`, `static_item`, `block`) proving the keyword literal is **absent from the parent factory/types surface** and present inside the hoisted group's template.
5. `grep -r "'clause'" packages/codegen/src` returns zero (type + all switch arms gone); `ClauseRule` and `detectClause` deleted; `dsl/wire/auto-groups.ts` deleted.
6. `isTransparentWrapper` is the sole transparency predicate consulted by `transform.ts` + `transform-path.ts` (no residual ad-hoc prec/optional/choice-blank checks).

---

## 8. Sequencing (detail belongs to the plan)

Three independently gate-verifiable steps:

1. **Clause cut.** Add enrich clause-hoist pass + `isTransparentWrapper` (skip tier only); delete `ClauseRule`/`detectClause`; fold `'clause'` arms. Safe without descend-through (no current clause kind patches inside the seq). Gate full.
2. **Auto-group migration.** Move `optional(seq)` / `repeat(seq)` / `repeat1(seq)` synthesis into enrich; add hoist descend-through to `isTransparentWrapper` (now exercised, e.g. `closure_expression` `'4/0'`/`'4/1'`). Gate full.
3. **Retire applyAutoGroups.** Delete the pass + wire call site. Gate full.

---

## 9. Out of scope / follow-ons

- The in-parallel Surface-types cleanup (`RustGrammarShape → RustSurfaceGrammar`, move to `@sittir/types`, emit to `.sittir/`) — independent; this spec does not depend on it.
- The 6 `[6133]` unused-fn warnings in node-map.ts (separate dead-code pass).
- Adding `tsgo --noEmit` to the gate (deferred per the type-errors-cosmetic policy).
- PR-I-φ2 (match_arm residual + count recovery) remains its own item.
