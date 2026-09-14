# Handoff: polymorph flattening and visible variant rules

Branch `feat/polymorph-flattening`, stacked on `feat/whole-arm-variants` (PR #286). Everything below the branch point is uncommitted working-tree state except the validator record commits the pre-commit hook added. Spec: `docs/superpowers/specs/2026-09-14-polymorph-flattening-design.md` (PR #287, review comments addressed).

## Where things stand

| Stream | State |
|---|---|
| Whole-arm variant hoist | PR #286, all gates green; `variant()` decides, enrich lifts are reused, no implicit arm names |
| Flattening spec | PR #287, docs only, four review comments addressed and replied |
| Rule re-authoring retirement spec | PR #285, docs only, sequenced after flattening |
| Flattening implementation | uncommitted on this branch, python only, mid-change |

## Uncommitted changes on this branch

**Flattening (python validated before the visible-rule spike):**

- `dsl/transform/transform.ts` — `applyVariantPatches` calls `registerIfPureVariantChoice`: a parent whose post-patch rule is a pure choice of variant arms (`isMintedVariantArm`, name prefixed by the parent after wire renames) is registered through `wireRegisterFlattenedParent`. Extras are skipped.
- `dsl/wire/wire.ts` — `flattenedParents` on the context, `wireRegisterFlattenedParent`, `wireRenamedSymbol`, and `wrapSupertypesCallback`, which appends registered parents to `supertypes` lazily, the way conflict groups are appended.
- `emitters/overlays/module.ts` — `flattenedVariantParents(nodeMap)`: supertypes whose subtypes are all variant-named, with their variant routes.
- `emitters/overlays/polymorphs.ts` — emits `export const <parent> = { <variant>: <entry | B.key | {strict, coerce}> }` for each flattened parent, so `ir.<parent>.<variant>` survives.
- `emitters/ir.ts` — adds flattened parent keys to `ir`.
- `emitters/shared.ts` — `collectAliasSourceKinds` includes a supertype's hidden aliased subtypes (`subtypeParseNames`), so variant kinds get factory shape, fields and slot metadata. Without it the factory lane dropped `left` from `_assignment_eq`.
- Glossary: `docs/glossary/emitters.md` for `collectAliasSourceKinds`.

Measured on python at that point (supertypes gained `assignment`, `with_clause`): from 124/124, coverage 140/140, read-render-parse 115/116, factory-render-parse 1364/1364, IR-render-parse 1260/1260, accessor throws 0. Totals are below master because wrapper kinds are gone.

**Visible variant rules (spike, user-approved direction: drop the hidden rule plus alias):**

- `wire.ts` — `polymorphHiddenName` returns the visible name.
- `transform.ts` — `makePolymorphAliasNode` returns a symbol when names match; `renameEnrichLift` likewise; `registerAliasedVariant` and the variant ALIAS branch deposit a single hidden-symbol arm (`suite_inline` over `_simple_statements`) as the visible rule's body.
- `packages/python/grammar.sittir.ts` — references renamed: `$._expression_statement_tuple`, `$._except_clause_exception_as` / `_list`, and the authored `except_clause_exception_as` rule key.

Measured on python with visible variant rules (flattening registration did not fire, see below): node kinds identical to before, 3 node-type entries changed (`assignment`, `with_clause`, `suite_empty`); from 140/140, coverage 144/144, read-render-parse 115/116, factory-render-parse 1375/1375, IR-render-parse 1271/1271, accessor throws 0.

**Enrich lifts visible (in progress, does not generate yet):**

- `dsl/enrich.ts` — `visibleGroupSynthName` registers the visible name, `makeVisibleGroupAlias` returns the symbol when names match, `collapseSingletonMintOrdinals` handles visible minted names.
- `transform.ts` — `enrichLiftArmOf` and `isMintedVariantArm` accept a symbol arm as well as an alias arm.
- Python generation fails: `Undefined symbol '_list_pattern_case_patterns'`. Hand-written `rules:` entries reference enrich's hidden minted names.

Pre-spike copies of the edited sources and python outputs are in the session scratchpad only (`*.pre-visible.*`); rely on git for recovery.

## Open issues, in the order they block

1. **Grammar files reference minted hidden names.** Visible minting renames them, and the `$` proxy throws on the old names. Enrich-minted names referenced by hand: python `_collection_elements`, `_list_pattern_case_patterns`; typescript `_binary_expression_arm`, `_class_body_arm1`, `_class_body_arm2`, `_for_header_arm2`, `_jsx_start_opening_element_arm`, `_meta_property_arm1`, `_meta_property_arm2`, `_parenthesized_expression_arm`, `_update_expression_arm1`, `_variable_declarator_arm1`; rust `_closure_expression_arm`, `_tuple_expression_elements`, `_tuple_type_elements`. Variant names referenced by hand: typescript 16 references plus 6 authored rule keys, rust 3 plus 2. Most live in `rules:` entries the retirement spec deletes; decide whether to rename them now or sequence the retirement's transliteration first.
2. **Flattening registration against symbol arms.** Variants are symbols now; `isMintedVariantArm` was widened but not yet re-measured. Its prefix test can match an unrelated symbol that shares the parent prefix; prefer the variant annotation.
3. **Undeposited visible rules survive.** Wire pre-registers a rule for every variant placeholder; a hidden rule without a body was dropped silently, a visible one is not (`match_block_empty` stays a blank rule). Register only names that will be deposited, or prune empty ones on both sides.
4. **Generated tests reference ir keys that do not exist** (`ir.assignmentType`, `ir.simplePatternNegative`, `ir.exceptClauseException`): the test emitter and `ir` disagree about exposing visible variant kinds.
5. **Tests pinned to the old parent surface:** `packages/python/tests/from-loose.test.ts` calls `ir.assignment({ left, content })`.
6. **`_suite`** should flatten (user ruling: variant children are aliases), which visible rules make possible; spec §3 bare-symbol and token variants.
7. **Patch descent fan-out** (spec §4) is not built; current grammars have not needed it yet.
8. **Classifier unit tests** (spec §7): positive case, and negative cases for extras, unmaterializable arms, alias targets.

## Gates for landing

Fresh `pnpm run validate:native` compared with `sittir validate history` against the last pre-change run; `pnpm run build`, `pnpm run type-check`, `pnpm run type-check:examples`, `pnpm run lint`; independent `cargo check` of the generated crates; unit suite on its own; dogfood rebuild examples regenerated with `sittir tool emit-factory-source`; API-surface and options snapshots updated file by file. Commit with pathspec; the pre-commit hook refuses codegen source without regenerated outputs.

## User rulings this stream

- Whole-arm hoist: `variant()` is the signal, enrich owns the lifts; unnamed non-lift arms keep the per-arm form.
- A patch that reaches a flattened parent descends by its variants: choice position plus arm index selects, other positions fan out.
- Variant children are aliases; a parent whose arms are variant aliases qualifies for flattening.
- Drop the hidden rule plus alias ceremony: variants and enrich lifts mint visible rules directly.
