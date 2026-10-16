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

## Rulings (user, 2026-08-29/30) — step 1 landed, step 2 next

`nonterminal` is the single slot switch. Landed on this branch:

- `flatten.ts::stampTerminality` stamps `nonterminal: false` on literals,
  layout tokens (INDENT/DEDENT/NEWLINE), and references to a literal (a
  keyword/token leaf, a link-minted literal kind, a rule whose body is one
  fixed string). A field never makes a slot; an alias never changes
  terminality (`attributeField`/`attributeAlias`, `rule-catalog`'s
  `classifyRule`). The three exclusions are all "a choice is nonterminal":
  a literal that is a CHOICE arm, an optional/repeated literal, and a
  fielded literal whose text/cardinality/presence varies across the
  enclosing choice's arms (`binary_expression.operator`, `declare_marker`)
  stay slots. `simplifySeqRule` strips every `false` member generically;
  the template emitter renders a `false` reference as fixed text
  (`fixedTextOfKind` / `collectFixedLiteral`, now in `dsl/rule-patterns`).
- The determined-slot machinery is gone: `pruneDeterminedSlots`,
  `determinedSlots`, the `determined` flag, `isDeterminedSlot`,
  `determinedSlotText`, node-model `determinedSlots`, and the validators'
  `determinedStorageKeys` / `isDeterminedKey` / `determinedFieldsByKind`.
  The 12 fielded references to a literal (rust `mut_pattern`,
  `extern_crate_declaration.crate`, `self_parameter.self`,
  `_range_expression_{prefix,postfix}.operator`, four doc-comment marker
  forms; ts `_binary_expression_arm.operator`, `_for_header_var_kind.kind`;
  python `decorator.newline`) are template text like the unlabelled ones.
  3e rebuilds `binary_expression`'s `in`-form surface with an overlay — it
  must not stay a separate parser node (`binary_expression_arm` in
  node-types, `binary_expression` missing `in` / `private_property_identifier`).
- Every attribute builder stamps the node it builds (`dsl.md::attributeBuilder`
  table): string/layout false; pattern/symbol/supertype true; choice true
  (the choice node is the slot, no push-down onto arms); seq = any member;
  repeat true; optional = content's, one level only. Distributed choices
  and permutation arms are factored in normalize's post-flatten fixpoint
  (`flatten.ts::factorChoiceArms`, `foldPermutationArms`) so the rebuilt
  choice/optional wraps the literals directly — no field-based rule anywhere.
- The native reader stays grammar-agnostic (it emits a `_<key>` for every
  named child); wrap is the model-driven boundary: every wrap function first
  runs `_keepModelledSlots(data, keys)` with the keys that kind reads, so a
  reference to a literal the model has no slot for never enters a wrapped
  node. `template-coverage` checks the model's fields, not the parser's. No
  validator exemption list exists.
- `AssembledEnvelope` = zero or one slot, structurally; `AssembledBranch` =
  two or more. Compound `parameterless` = a factory and zero slots.
- Gate result for step 1: templates and every generated source byte-identical
  across the three grammars; `node-model.json5` differs only in labels
  (`modelType` branch→envelope for the one-slot kinds, python `block` →
  polymorph like every other array-of-choice body, `isParameterless` off
  `self_parameter` / `_block_comment_doc_*`, `determinedSlots` gone).

Step 2 (landed): the derived classifier is deleted; `AbstractAssembledCompound.soleSlot`
is what the factory-surface helpers read (sole repeated slot → spread; sole
singular child-node slot → direct/forwarded; a sole slot with coerced literal
storage — terminator, keyword form — is a config value; else config). An
array-of-choice body is an envelope like an array of symbols.
`AssembledPolymorph` and `AssembledList` extend `AssembledEnvelope`: the
only distinctions are variant/form handling (3e lifts it) and list facts.
Generated output byte-identical throughout; validators at floor.

Next: glossary sweep (redundant `compound || list` sites can fold —
`AssembledList` is a compound), PR body, push.

## 3e debt (surface ergonomics deliberately dropped by 3d; overlays restore them)

- No slot filtering anywhere: `configurableFactoryFields` is gone; every slot
  is a factory/`from()` config field (markers, terminators included).
- Namespaced constructors (`forHeader.varKind(…)`, `binaryExpression.ampAmp(…)`
  — the form/enum-member surface) are not emitted at all: the module, its
  node-model section, the `$impl`/`attachProps` factory and `from()` wrappers
  and the generated namespaced tests are gone. 3e's overlays are where a form
  surface is authored; when it returns it is non-positional (a config object).
- `debugger_statement(value)` / `meta_property(value)` take their sole
  enum slot directly.
- `binary_expression`'s `in` form: the parser-visible `_binary_expression_arm`
  must dissolve into an overlay form of `binary_expression`; all 13
  enrich-minted `_arm` kinds are parser-visible today.

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
