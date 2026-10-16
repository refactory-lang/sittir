# Repeat/Optional Group Synthesis → Coherent Parent-Slot Derivation

**Date:** 2026-05-21
**Branch:** `025-pr2-canonicalize-template-emitter`
**Status:** design (pre-implementation) — supersedes the per-kind patching attempted in WIP commit `76f8ea15`.

## Problem

The PR2 "wire fix" (`applyAutoGroups` now writes synthesized group-lift helpers + rewritten
parents into `outRules`, the rule-fn map tree-sitter reads) correctly materializes the 16
`_*_repeat1` helpers into `grammar.json` rules + the `inline` array. tree-sitter inlines them →
flat runtime. But sittir's IR slot-derivation does **not** match that flat output, regressing
rust deep AST-match 76 → 51. The mismatch has **two divergent code paths**, both mishandling
multiplicity, plus a **missing optional-helper class**.

### Path A — native `repeat(field(seq(...)))` (no helper synthesized): multiplicity DROPPED

`applyAutoGroups`' synthesis trigger is strict-seq (`optional(seq)` / `repeat(seq)`) and does
**not** fire when the repeat content is a `field` (e.g. rust `arguments`,
`ordered_field_declaration_list`). The native `repeat` survives into `applyWrapperDeletion`,
which stamps `{multiplicity, separator, fieldName}` onto the **structural seq node**
(`wrapper-deletion.ts:117-119` → `stampAttrs`). Simplify then flattens that multi-member seq into
its parent (`simplify.ts:101` `flatMap`; single-member case `canonicalizeSeqOfLeaves`
`simplify.ts:1090`), discarding the seq node **and its multiplicity**. The non-multiplicity
member (`_expression`) is left bare → generated singular → runtime read error
`singular slot "expression" on "arguments" requires one value`.

### Path B — synthesized helper inlined: inner `optional` CLOBBERED

`type_arguments`/`type_parameters` arrive as `repeat1(SYMBOL(_*_repeat1))`. Inlining
(`inlineRefs` → `reapplyInlinedLeafAttrs` → `pushAttrsToLeaves`) pushes the repeat's
`nonEmptyArray` onto the helper-body leaves, but the choice/leaf cases
(`simplify.ts:941-942, 960-962`) overwrite a leaf's **own** inner `optional` (e.g.
`optional(trait_bounds)`) with the outer `nonEmptyArray` → generated `NonEmptyArray<TraitBounds>`
where the slot is actually 0-or-more → runtime `repeated slot "trait_bounds" requires at least
one value`.

### Missing class — optional synthesized types

On the tree-sitter-evaluated base seed, `optional(seq(...))` is already normalized to
`CHOICE[<seq>, BLANK]` (tree-sitter's `optional` lowering). `synthesizeOptionalGroups` tests
`isOptionalType`, which never matches the normalized form, so **no `_*_optional1` helpers are
ever synthesized**. The optional-group structure is therefore never given a kind, and parents
with `optional(seq(...))` (e.g. `let_declaration`'s `= <value>` tail) lose the grouped slot →
render drops the optional content (`let x = e;` → `let x;`).

## Confirmed non-issues (corrected during diagnosis)

- **Python codegen does NOT hard-error.** It completes exit 0; the earlier "hard error" was a
  transient intermediate state. There is a non-fatal audit line and a separate, unrelated
  `format_expression` un-renderable kind — neither part of this regression.
- **The choice-at-seq merge audit already accepts** the inlined `seq(choice(syms…), optional)`
  shape (`classifyTopLevelShape`: all-symbol/optional-symbol choice members are canonical). No
  audit extension needed.
- **The native-vs-synthesized inline split is benign.** Only 5 of the 16 `_*_repeat1` are
  sittir-synthesized (in `linked.rules`, modelType `branch`); the other 11 are tree-sitter native
  aux sharing the name (`NO-RULE`, absent from IR). `inlineRefs` no-ops on the natives (no rule
  body). Consequence: "is this an auto-group helper" must be tested by `linked.rules` membership,
  **not** inline-list membership.

## Design

### Principle: multiplicity & separator are LEAF attributes, never structural-node attributes

A `seq`/structural node may be flattened or collapsed by simplify at any point; any attribute on
it is therefore unstable. Multiplicity and separator must be pushed to the slot-bearing **leaves**
(symbol / field / terminal) and to **choice nodes** (a choice at a seq position is one slot
boundary and is not flattened). `deriveSlotsRaw` already threads leaf/choice multiplicity
correctly; the only defect is that the attribute is lost before it reaches the leaves.

### One shared push-to-leaves policy

Extract the existing `pushAttrsToLeaves` (simplify.ts) into a single shared function with
**strengthen-only, preserve-distinct-inner** semantics:

- Descend through structural nodes (`seq`, `group`, `variant`, `clause`, `token`, `alias`).
- `choice`: stamp the choice **node** (single slot boundary); do not recurse to clobber arms.
- Leaf: apply the pushed multiplicity **only when the leaf has none**; preserve a leaf's own
  inner multiplicity (esp. `optional`) — never overwrite `optional` with the outer
  `array`/`nonEmptyArray`. (Fixes Path B.)
- Apply `separator` to the same leaves/choice.

Wire this policy into **both** producers of multiplicity:

1. **`applyWrapperDeletion`** (`repeat`/`repeat1`/`optional` cases): when the wrapped content
   (after peeling `field`) is a `seq`/`choice`, push the multiplicity to its leaves/choice-node
   instead of stamping the seq node. (Fixes Path A at the source; the `flatMap` /
   `canonicalizeSeqOfLeaves` flattens then carry leaf-level attrs that survive.)
2. **`inlineRefs` / `reapplyInlinedLeafAttrs`** (already): re-apply the referring symbol's
   pushed-down attrs onto the inlined body via the same shared function. (Path B, with the clobber
   fixed.)

### Optional synthesized types

Make `synthesizeOptionalGroups` recognize the **normalized optional** form in addition to
`optional`-typed nodes: a `CHOICE` with exactly two members, one `BLANK` and one `SEQ`, is
`optional(seq(...))`. On match, synthesize `_<parent>_optional<N>` from the SEQ body and rewrite
the choice's non-blank member to `SYMBOL(helper)` (i.e. `CHOICE[SYMBOL(helper), BLANK]`), routed
to `outRules` + `syntheticInline` exactly like the repeat helpers. The helper then reaches
`grammar.json` + `inline`, tree-sitter inlines it (flat runtime), and the shared push-to-leaves
policy applies the `optional` multiplicity to the inlined leaves — consistent end to end.

Mirror enrich's existing `CHOICE[X, BLANK]` descent so detection is identical to the labeling
passes. Keep the strict guard (exactly one non-blank SEQ member) to avoid mislabeling real
unions.

### Helper classification (so the inline-decision gate selects them)

The inline-decision set (`generate.ts`) already excludes `supertype`/`keyword`/`token`/
`pattern`/`enum` and keeps `branch` (the synthesized helpers classify as `branch`). The optional
helpers will likewise classify as `branch` (seq-with-fields) and be inlined. No classifier change
required, but verify the optional helpers land in `inlinableKinds`.

## Files to change

- `packages/codegen/src/compiler/wrapper-deletion.ts` — push multiplicity/separator to leaves for
  `repeat`/`repeat1`/`optional` over `seq`/`field(seq)`/`choice`, not the seq node.
- `packages/codegen/src/compiler/simplify.ts` — fix the `pushAttrsToLeaves` clobber
  (preserve inner `optional`); export it as the shared policy used by wrapper-deletion + inlining.
- `packages/codegen/src/dsl/wire/auto-groups.ts` — `synthesizeOptionalGroups` also fires on the
  normalized `CHOICE[<seq>, BLANK]` form, emitting `_*_optional1` helpers into `outRules` +
  `syntheticInline`.
- (verify only) `packages/codegen/src/compiler/generate.ts` inline-decision filter;
  `node-map.ts` deriveSlotsRaw / canonical audit (expected no change).

## Build / measure sequence

1. Implement (1) shared push-to-leaves + clobber fix, (2) wrapper-deletion wiring,
   (3) optional synthesis — as separate commits, regen + measure rust after each.
2. Regen all three grammars; expect `arguments` / `type_arguments` / `type_parameters` /
   `ordered_field_declaration_list` read errors to clear together and `let_declaration`'s optional
   tail to render, recovering rust deep AST toward/past the 76 baseline.
3. Re-measure typescript + python (no regressions; reconcile `format_expression` separately).

## Risks / open questions

- Materializing more helpers (now optionals too) could further perturb the override parser —
  measure parse-pass after the optional-synthesis step specifically.
- sepBy first-occurrence + repeat merge: confirm the merged slot is `array` (allows empty) vs
  `nonEmptyArray`. Default: take the strongest non-empty signal from the occurrences.
- `let_declaration` AST-mismatches (`childCount 5 ≠ 3`) and the `format_expression` un-renderable
  are tracked as separate items, not part of this design's success criteria beyond the optional
  tail rendering.
