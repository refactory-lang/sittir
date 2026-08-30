# Handoff — 3d: slot classes are structural (opening prompt for the next session)

Paste from the `---` line down.

---

Continue spec step 3d on branch `step3d-node-types` (PR #249, stacked on
`gate3-catalog-anon` #248). Session memory: `get_latest_session`; narrative in
`.infigraph/sessions/session_2026-08-29.md`. Comments never go in
`packages/codegen/src`; declarations are documented in `docs/glossary/<dir>.md`.
Run vitest from the repo root as `pnpm exec vitest run --root packages/codegen`
(running inside `packages/codegen` breaks id-table loading). Commit by
`--pathspec-from-file`; never commit `TODO.md`, `examples/01-construct-nodes.ts`,
`examples/18-dogfood-typescript-strict.ts`, `tsconfig.json`,
`packages/tools/validation-report.json`. Foundational codegen work inline;
mechanical fan-outs and glossary sweeps to `sittir-codegen` (sonnet) agents.

## Where the tree is

`step3d-node-types` at `6faee6a41`, tree clean. Model as committed:

- `ModelType = envelope | branch | polymorph | supertype | enum | token | pattern | list`.
- `AbstractAssembledCompound<R>` (node-map.ts) is the slot-bearing base for
  `AssembledBranch`, `AssembledEnvelope` (body is one symbol today),
  `AssembledPolymorph` (body is a choice of leaves), `AssembledList`
  (`rule` = element rule, `renderRule` explicit). `AssembledSupertype` is its
  own class and label (a collection of subtypes, no slot — never a polymorph).
  Keyword/token leaves share `token` with the `word` fact.
- Hoist facts (former "group") live in `AssembledNodeBase.enrichment.hoisted`,
  read through compound getters (`hoisted`, `name`, `detectToken`,
  `parentKind`, `overridePassthrough`) — transitional until the enrichment
  step (3e) dissolves hoisted kinds. Every `hoisted` read in a core emitter
  is a bridge that 3e's overlay/barrel modules replace.
- Emitters dispatch on class/`modelType` (`isAuthoredCompound`,
  `isSlotBearingCompound`, `compoundModelTypeFor`); `instanceof` is
  sufficient and preferred, remaining `modelType` switches are cleanup.
- Gates on `6faee6a41`: generated output identical to the pre-rename state
  except `node-model.json5` labels; validators exact at floor (rust
  146/146·208/208·134/137·1519/1519, ts 142/143·194/194·112/114·1202/1202,
  py 122/122·142/142·115/116·1390/1390); unit 1086; tsc 4-error baseline;
  propose-14 OK; `DBG_SLOT_MISS` rust 5 (3 structural) / ts 4 (4 structural)
  / py 0; `unclassifiable-shape` rust 2 / ts 4 / py 0.

## Rulings (user, 2026-08-29) — implement next

The derived single-slot classifier (`BranchSlotClass`, `classifyBranchSlots`,
`computeSlotClasses`, `userSlotsOf` in `emitters/shared.ts`; `slotClass` on
the compound) is **deleted, not relocated**. `AssembledEnvelope` = exactly one
slot, structurally; `AssembledBranch` = more than one (or none). The census of
where the derived fact and the structural class disagree
(`scratchpad/outliers.mts` of the prior session; rerun it) had four families,
each ruled at its source:

1. **Determined-literal siblings** (rust `mut_pattern.mutable_specifier`,
   `_range_expression_{prefix,postfix}.operator`, doc-comment markers;
   python `decorator`/`_simple_statements` `_newline`): simplify strips a
   reference to a determined kind (a kind whose render rule is one fixed
   literal — keyword/token leaf) beside slots exactly as it strips a literal.
   The text is **template only**: the render rule keeps the reference and the
   template emitter renders the kind's fixed text; no stamping at
   construction, no `determinedSlots` on the node, no wire key. Delete
   `determinedSlots`, `pruneDeterminedSlots`, `isDeterminedSlot`,
   `determinedSlotText`, `stampExpression`/`stampChildExpression`, the
   `determined` flag on `AssembledNonterminal`, `generate.ts`'s prune call,
   and `node-model.ts`'s `determinedSlots`/`stampExpression` serialization.
   Caveat found in `tools/src/validate/factory-render-parse.ts`
   (`determinedStorageKeys`, `isDeterminedKey`) and
   `template-coverage.ts` (`determinedFieldsByKind`): the **read** wire still
   carries the determined child (tree-sitter field labels are load-bearing),
   so the validator must still skip those keys — derive that per-kind list
   from the render rule (one derivation in the node-model emitter: required
   singular references to determined kinds), not from a node fact.
   `parameterless` on compounds then means "every slot is optional"
   (measure the delta; today it requires a determined slot).
2. **Keyword-presence flags** (`async_block.move_marker`,
   `self_parameter`'s `&`/lifetime/`mut`, `field_pattern`'s `ref`/`mut`,
   python `_simple_pattern_negative.sign`): real slots → those kinds are
   `AssembledBranch`; their factories become config surfaces (output changes
   by design; validators are the gate).
3. **Hidden terminators** (typescript `_automatic_semicolon | ";"` on every
   statement, `_class_body_member.terminator`): multiple slots →
   `AssembledBranch`.
4. **Layout** (`INDENT`/`DEDENT`/`NEWLINE`): `nonterminal: false` — layout
   terminals the render rule owns, never slots; simplify strips them beside
   slots like literals (python `block`, `_suite_block_with_indent`,
   `_match_block_block` become envelopes by structure).

After 1–4 the structural class and the factory surface coincide, so
`classifyFactoryShape`, `resolveSingleFieldFactorySlot`,
`resolveDirectFactorySlot`, `forwardedTargetKind`, `soleSlotFacts`,
`classifyChildFactorySurface` read `instanceof AssembledEnvelope` /
`node.soleSlot` (Envelope's structural sole slot; `AssembledPolymorph`'s union
slot counts as one slot). `from.ts` reads `slotClass` at 3 sites,
`test.ts`/`factories.ts` via `soleSlotFacts`; tests: `taxonomy.test.ts`
(`classifyBranchSlots`), `factory-surface.test.ts`, `determined-slots.test.ts`
(19 refs — retire with the machinery), `factories-single-field-reserved-word`
and `namespaced-constructors` tests call `computeSlotClasses`.

Order: (1) simplify strips determined refs + layout, template renders
determined text, machinery deleted, validator skip list derived from render
rules — gate: rendered templates unchanged, validators at floor; (2) delete the
derived classifier, factory surface on the class — review-gated (case 2
factories move direct→config; report the kinds); (3) glossary sweep; PR body.

## Then

- `block_comment`'s id-less synthesized PATTERN (one `DBG_SLOT_MISS` line).
- 3e: enrichment overlays — barrel/overlay modules apply hoist suppression,
  polymorph-form arm skipping, namespacing; core emitters stop reading
  `hoisted`; hoisted kinds dissolve into nested shapes/sub-factories;
  VARIANT/GROUP leave the rule vocabulary. 3f: static spacing (owns the python
  `returnf` seam's dynamic-space eligibility in the sittir-core spacing
  writer, and the `_`-trimmed variant names).
- Separate cheap-agent task: glossary-wide provenance-wording audit (~176
  pre-existing "former/no longer/previously" phrasings).

## Standing rules and tooling

Byte-identical output is the only gate for a refactor; tests are updated,
never preserved. After narrowing a discriminant union, audit comparisons
against labels that survive (`'branch'`, `'token'`) by diffing against HEAD —
tsc cannot see the semantic shift (six such sites bit the rename). Measure
id/slot questions only through `gen` (`DBG_SLOT_MISS=1 gen --grammar <g> --all
--no-build-native --no-workspace-check`). A NodeMap assembled without
`generatedIdTables` has no anonymous kinds — pass the tables. Never commit the
never-commit files. Infigraph search before rg; the Bash hook blocks grep/rg
unless `.infigraph/.search-fallback-allowed` holds a fresh `date +%s`.
