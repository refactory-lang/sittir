# Handoff — 3e overlay module: spec the design (opening prompt for the next session)

Paste from the `---` line down.

---

Spec the 3e overlay module for sittir before writing any code. Branch
`step3d-node-types` (PR #249, stacked on `gate3-catalog-anon` #248) is
clean at `a543247f3` and pushed. Session memory: `get_latest_session`
(session_2026-08-30). Use the brainstorming skill first, then write the spec
to `docs/superpowers/specs/2026-08-30-3e-overlay-surface.md` (clean
end-state, no PR/task numbers), then a plan. Comments never go in
`packages/codegen/src`; rationale lives in `docs/glossary/<dir>.md`.
Commit by pathspec; never commit `TODO.md`, `examples/*`, `tsconfig.json`,
`packages/tools/validation-report.json`. Gate = `pnpm run validate:native`
at floor (coverage 208/208·194/194·142/142, factory-render-parse
1519·1202·1390, read-render-parse 134/137·112/114·115/116, from()
149·144/145·126); unit `pnpm exec vitest run --root packages/codegen`;
`pnpm run type-check` baseline is 4 errors.

## Status at `a543247f3`

Green: validators at floor on all three grammars (the two read-render-parse
shortfalls and the ts `member_expression` from() case are pre-existing
floors); codegen unit suite 106 files / 1079 tests; `sittir-core` cargo
tests and cargo check; `DBG_SLOT_MISS` 0 on every grammar; propose-14 and
S-class ratchets clean.

Broken, deliberately: `pnpm run type-check` at 126 errors (baseline 4) —
only the consumers listed below; nothing generated is red.

Changed by design (also listed in the 3d handoff's "3e debt"):
`debugger_statement` / `meta_property` take their sole enum slot directly;
form namespaces gone where a terminator sits beside the payload; every
marker / terminator is a config field; `binary_expression`'s `in` form is
still the parser-visible `_binary_expression_arm`.

Outside this branch: Copilot review on #248 / #247 / #246 / #245 must be
requested from the PR UI (the API refuses: reviewer is not a collaborator);
one Copilot thread on #243 (builder return-type tests) is intentionally open.

## What 3d left behind (rulings, all landed)

- `nonterminal` is the single slot switch, stamped by the attribute
  builders; a field never makes a slot, an alias never changes terminality;
  distributed choices and permutations factor in normalize's post-flatten
  fixpoint. Determined-slot machinery deleted. Reader grammar-agnostic; wrap
  model-driven (`_keepModelledSlots`).
- Slot classes are structural: envelope = 0/1 slot (Polymorph and List
  extend Envelope), branch = 2+. The factory surface reads
  `AbstractAssembledCompound.soleSlot`; the derived classifier is gone.
- No slot filtering anywhere: `configurableFactoryFields` is gone; every
  slot is a factory / `from()` config field (markers, terminators
  included). Everything is non-positional (config objects); presence flags
  live in the config; terminators are ordinary enum slots.
- Namespaced constructors are NOT emitted by the core emitters any more —
  the form / enum-member surface (`forHeader.varKind(…)`,
  `binaryExpression.ampAmp(config)`, `ir.statement`) is the overlay's job.
  Their old logic is in history at `486427314`: `emitters/namespaced-
  constructors.ts` (form slot = sole slot or form-carrying slot beside
  optional ones; member constructors from the sole enum slot; recursion
  into child forms; ambiguity resolution), `factories.ts::
  emitNamespacedConstructors`, `from.ts::withNamespaceProps` (FR-side
  `strict` wrappers), `ir.ts::bundleParts` namespace props, `test.ts::
  emitNamespacedTests`. Read it for what the surface WAS; do not resurrect
  it under a new filename — design the overlay.

## Consumers waiting on the overlay

`pnpm run type-check` is at 126 errors (baseline 4), all hand-written users
of the removed surface: `examples/17-dogfood-rust.ts` (49),
`examples/01-construct-nodes.ts`, `examples/18-dogfood-typescript*.ts`,
`examples/19-dogfood-python*.ts`, `packages/*/tests/examples-verify.test.ts`,
`tree-identity-and-verbatim.test.ts`, `ir-grouped-equivalence.test.ts`,
`namespace-map-convergence.test.ts`. The design must state how each call
shape is served (or rewritten) — `Property 'X' does not exist` is 78 of
them.

## Design questions the spec must answer

- Which generated file(s): one overlay module per grammar
  (`namespaces.ts` / `variant.ts` / `indices.ts` — pick the name for the
  concept, not the mechanism) beside the plain `factories.ts` / `from.ts`,
  composed into `ir.ts`'s `_b$<key>` bundles (`attachProps(FR.x, { strict:
  F.x, …refine forms })`) and exported from the barrel (`index-file.ts`).
  Writer: `packages/codegen/src/run-codegen.ts` maps `GeneratedFiles`
  fields to files (`ir.ts` at :227); `emit.ts` / `generate.ts` assemble
  `GeneratedFiles`.
- Derivation source: the model's choice slots (union slots' member kinds
  → form constructors; enum slots' members → member constructors) plus
  enrich's variant metadata — and how hoisted kinds dissolve into forms of
  their parent (the rest of 3e: barrel/overlay applies hoist suppression,
  polymorph-form arm skipping, namespacing; core emitters stop reading
  `hoisted`; VARIANT/GROUP leave the rule vocabulary). `binary_expression`'s
  `in` form must become an overlay form (the enrich-minted, parser-visible
  `_binary_expression_arm` goes — node-types currently lacks `in` and
  `private_property_identifier`); all 13 enrich-minted `_arm` kinds are
  parser-visible today.
- Signatures: non-positional — a member constructor takes
  `Omit<Config, slot>`; a form constructor takes the child (or its config)
  and fills the form slot. No slot filtering; presence flags stay config.
- What node-model / validators need (nothing, ideally — the overlay is
  surface only) and what tests the overlay gets (generated per-kind tests
  like the old `emitNamespacedTests`, plus the dogfood examples as the
  acceptance suite).
- After the overlay: unify `fields` / `slots` / `structuralFieldsOf` /
  `allSlotsOf` into one accessor (every slot is named after assemble);
  3f static spacing.
