# Handoff — alias form flip, step 2 (opening prompt for the next session)

Paste from the `---` line down.

---

Continue the assemble-off-the-simplified-tree work (ruling 3,
`docs/superpowers/specs/2026-08-28-assemble-off-the-simplified-tree.md`;
rulings 1–2 in `2026-08-27-wrapper-deletion-as-rule-builder.md` and
`2026-08-27-rule-pattern-recognizers.md`). Session memory: call
`get_latest_session` (if the infigraph MCP is down, the fallback file is
`.infigraph/sessions/session_2026-08-28.json` + `.md`). Comments never go in
`packages/codegen/src`; a declaration's rationale is its `###` entry in
`docs/glossary/<dir>.md`.

## Where the tree is

Stack: `master ← #241 ← #242 ← #243 ← assemble-off-normalized ← alias-form-flip`.

- `assemble-off-normalized` — two gated commits, byte-identical, validator
  exact, not pushed, no PR:
  - `0f3e31373` node model holds the normalize view, never a link tree
    (`AssembledBranch/Group/Enum/Supertype` on `RenderRule`;
    `AssembledSeparatedList` on the ELEMENT `SymbolRule | ChoiceRule`;
    `deriveSlots`/`collectSlots` typed `SimplifiedRule`; dead
    `optionalBodyKinds`, `hoistInnerFields*`, slot-grouping REPEAT diagnostics
    deleted; `sittir tool assemble-shape-census` added).
  - `537a9926a` an inlined reference keeps its own id (`inlineRefs` stamps
    `withId(body, ref.id ?? body.id)`; `withId` lives in `dsl/rule-attrs.ts`).
    `buildSlotsRecord`'s render-view id harvest stays (`shapeAudit: false`)
    only for choice arms simplify merges into one slot (rust `_let_chain`;
    `node-map-backpointers.test.ts` pins it).
- `alias-form-flip` — `43df2b550`, **WIP, not byte-neutral**, committed
  `--no-verify`, source only. `alias(sym(x), y)` builds `sym(x){aliasedTo: y}`;
  `SymbolRule.aliasedFrom/aliasedFromId` are gone (`aliasedTo/aliasedToId`);
  every `aliasedFrom ?? name` collapsed to `name`; link substitutes a ref to
  an alias-bodied hidden kind with that body once; no consumer reads
  `aliasedTo` where it read `name`. Regen diff (the finding): alias-minted arm
  kinds vanish (rust nodeCount 371→360), variant `childKind` keys become the
  hidden source names, templates reference real kinds but `string_literal`
  renders the alias target's PATTERN as text (`[bc]?"`), python `gen` fails
  (`expression_list.tail` delimiter → separated-list classification keyed on
  the name), typescript +7 diagnostics. `DBG_SLOT_MISS` rust 96→89, ts
  110→112 (baseline 96/110/59).

## Rulings for step 2 (user, 2026-08-28) — implement on `alias-form-flip`

1. **Visibility is stamped at evaluate.** A top-level rule whose kind name
   begins with `_` gets `hidden: true`. A symbol ref gets `inline: true` when
   its name begins with `_` OR it is in the grammar's `inline` array (a
   post-evaluate stamp over the refs; the array is a grammar field) —
   diagnostic when an inline-array ref does not begin with `_`. The alias
   structural builder flips `inline` true→false on the symbol within. A ref to
   a grammar-declared supertype (`raw.supertypes`) is a kind boundary — never
   inlined.
2. **Link inlines strictly on `inline === true`** (supertypes excluded by
   ruling 1). Hidden choices link used to promote as supertypes
   (`classifiedBy: 'link'`, not in the array) therefore splice as a
   choice-of-leaves member = one union-valued slot — a model change for that
   population, review-gated. Where `inline === false` and the target is hidden,
   the target is un-hidden and **published under the alias name** when that
   name is injective.
3. **Injectivity is a property of the alias name**: used at exactly one site
   and not otherwise a declared kind ⇒ published name of the aliased rule;
   used at more than one site, or also a declared kind ⇒ non-injective
   diagnostic (rust `primitive_type` family, ts `parsekind-noninjective` ×9).
   This must reproduce today's published names exactly (link's
   `aliasedHiddenKinds` / `collectAliasedByParents` + existing diagnostics).
4. **Variant names trim the leading `_`** for now (3f owns the real fix); do
   not read `aliasedTo` at a privileged site.
5. **Separated-list classification keys on `kindId`, not the name.**
6. **Uniform alias builder**: `alias(x, y) = { ...asSymbol(x), aliasedTo: y }`
   for every content; a STRING content becomes `sym(<its literal kind>){
   literal }` — no STRING special case in link or the attribute builder. Link
   stamping resolves `kindId` (source) and `aliasedToId` (target) and raises a
   diagnostic when the target has no non-anonymous kind id.
7. **Inlined kind stamped on the survivor**: `R → R{ kind: '_xxx' }` at every
   link inlining site (grammar-sourced, on the tree; no consumer yet — type
   inheritance later).

**Gate for step 2**: regen all three grammars; the ONLY sanctioned residual
is the phantom alias-minted arm kinds dropping and references pointing at
real kinds. Published kind names identical to today; `string_literal` must
not render a pattern as text; python `gen` must pass; `DBG_SLOT_MISS`
compared against 96/110/59. Anything else in the diff is a defect to chase,
never a change to accept. Then validator floors (rust
146/146·208/208·134/137·1519/1519, ts 142/143·194/194·112/114·1202/1202, py
122/122·142/142·115/116·1385/1390) may only rise; `pnpm test` from the repo
root green except the two `examples/01` WIP cases; tsc at the codegen
4-error baseline. Tests referencing `aliasedFrom` (5 files) and glossary
entries (~75 mentions across `compiler.md`, `types.md`, `dsl.md`,
`emitters.md`, `compiler-model.md`) are updated with it.

## After step 2

Gate 2 on `assemble-off-normalized` (byte-identical): delete the dead
`emitSuggested` body and its helpers (early `return undefined`; consumers:
`generate.ts`, `run-codegen.ts`, `tools/post-generate.ts`, the tools
codegen-surface entry, `suggested-overrides.test.ts`, 26 glossary entries);
`variantArms` stamped once in link (three derivations today); link stamps
`RefineForm.narrowedFields` (unify the duplicated `RefineForm` in
`dsl/wire/wire.ts` / `compiler/types.ts`); `EdgeClassCtx` / `LeftImmediateCtx`
on `normalizedRules` (templates.ts walks the render view then re-walks link
rules for the same question); tools probes (`probe/stages.ts` mislabels the
normalize stage). Gate 3 (review-gated): catalog-driven anonymous-node
minting filtered by `computeReachableFromRoot` (ts `</` `/>` belong to
unreachable jsx rules; the five raw literals `mut` `...` `True` `False` `None`
are a named literal rule's own body minted twice); drop `linkRules` from
`SimplifiedGrammar` / `NodeMap`. Separate: relocate `packages/tools`
comments to the glossary (`scripts/relocate-comments-to-glossary.mts` has
`SRC_PREFIX` hard-wired to `packages/codegen/src/`; generalize first).

## Standing rules and tooling

No `as` casts until tsc has been run and the need analyzed; builders are
`{...input, attr}` one level down; byte-identical output is the only
invariant for a refactor, tests are updated never preserved; a consumer-side
fallback going green is the moment to ask what the producer lost; a moved
gate is a finding. Commit by `--pathspec-from-file`; never commit `TODO.md`,
`examples/01-construct-nodes.ts`, `examples/18-dogfood-typescript-strict.ts`,
`tsconfig.json`, `packages/tools/validation-report.json`. Measure id/alias
questions only through `gen` (`SITTIR_TRACE=<kind>`, `DBG_SLOT_MISS=1 gen
--grammar <g> --all --no-build-native --no-workspace-check --no-emit-diff`)
with the id tables — `buildSimplifiedGrammar`/`buildNodeMap` omit
`inlineKinds` and the tables and gave a false reading once. Infigraph search
fallback: write `date +%s` to `.infigraph/.search-fallback-allowed` in its own
Bash call before `rg`. Scratch probes are `.mts`.
