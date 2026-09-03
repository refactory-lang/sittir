# Handoff — rule-kind dissolution, in-band seam mark, then patches / defaultArm / form coercers

Paste from the `---` line down.

---

Branch `fix/example-surface-gaps` (PR #265, stacked on #264 → #263). Read
[docs/compiler-phase-glossary.md](../../compiler-phase-glossary.md) first,
then the plan
[docs/superpowers/plans/2026-09-02-rule-kind-dissolution-and-default-arm.md](../plans/2026-09-02-rule-kind-dissolution-and-default-arm.md).
Session memory: `get_latest_session` (session_2026-09-02).

## Rulings from the user (2026-09-02, all binding)

1. GROUP and VARIANT are not rule kinds. Per-arm facts (`variant`,
   `defaultArm`) are rule `annotations`; the per-kind "hoisted form" fact is
   `hoistedKinds: ReadonlySet<string>` on
   `LinkedGrammar`/`NormalizedGrammar`/`SimplifiedGrammar`, carried like
   `supertypes` (a per-node annotation would be dropped by rebuilding passes).
2. The `patches:` block (renamed from `transforms:`) is the ONE declarative
   surface: `field()`, `alias()`, `variant()`, `defaultArm()` placeholders,
   path-keyed. `polymorphs:` retires into it. No `transform()` inside
   `rules:`; the escape hatch is rewriting the rule. `groups:` stays.
3. No behaviour keyed off the hoist stamp in the seam-edge analyzers.
4. Seam adjacency is side-effect free and its position is the write order:
   an in-band sentinel `sittir_core::spacing::ADJACENT` (U+FFFE) in the
   stream, writer-local state, no thread-local, no askama filter.
   `SpacingWriter` short-circuits when either flank is whitespace.
5. Follow-up, not this branch: retire askama for kind bodies (emit Rust so
   static seams are plain writes and the writer never re-evaluates them;
   typed sink). The reader should reject U+FFFE in source.

## Landed

- `6b65e5d58` delete the always-empty `polymorphFormKinds`.
- `28b4e7883` VARIANT is an annotation, not a rule kind (no production
  minter existed; tests rewritten to `annotations: { variant, variantOf }`).

## Landed as `aaabbb11a` — GROUP dissolution + in-band seam mark

Everything below was committed together (gates at commit: codegen
type-check clean; codegen vitest 15 known / 1086 passed; sittir-core
`cargo test` 40 pass; rust package suite 6 known, typescript and python
green; `validate counts` equal the floors on all three grammars; the
Principle #14 ratchet passes — the new pipeline fns take `(target, ctx)`:
`resolveGroupOrMultiInlineTarget(ref, ctx: InlineRefsCtx)`,
`spliceFoldableRefs(rule, foldable, ictx)`, `iterateInliningToFixedPoint(work,
ctx, preserveKinds)`; `makeNormalizedGrammar` stays one-arg and callers spread
`hoistedKinds` over it).

- GROUP dissolved: `types/rule-types.ts`, `types/rule.ts` (`GroupRule`,
  `isGroup` gone), link mints `linkCtx.hoistedKinds` at its two sites
  (`classifyHiddenRule` fielded hidden SEQ; group-lift synthesized kinds),
  `_wouldInlineAtAssemble` (dead) deleted; normalize reads
  `ctx.grammar.hoistedKinds`; simplify's `inlineRefs` gets
  `InlineRefsCtx.hoistedKinds`; assemble `classifyNode(kind, rule, { hoisted })`
  decides hoisted first, `CompoundOpts.hoisted: true`; `HoistedFacts`
  collapsed to `hoisted?: true` (`detectToken`/`name`/`parentKind`/
  `overridePassthrough` were never populated — deleted with
  `resolvePolymorphFormVariantName`, `'skip-polymorph-form-group'`,
  `kindArmName`'s hoisted branch, the node-model keys);
  `unwrapStructuralPassthroughs`, `unwrapGroupViews`, `unwrapForMerge`
  deleted; `enrich.ts::withContent` (28 spread sites).
- Seam mark: `rust/crates/sittir-core/src/spacing.rs` (`ADJACENT`,
  `ADJACENT_STR`, `mark_adjacent(dest)` writes it, `SpacingWriter`
  `adjacent_next` + `write_chunk` + whitespace fast path, thread-local gone),
  `slot.rs`, `filters.rs` (`markSeam` deleted), `emitters/render-module.ts`
  (three `mark_adjacent(dest)` sites; `markSeam` re-export dropped),
  `emitters/templates.ts::joinStaticSeam` (spaced → literal space; glued →
  sentinel only when the right segment is an expression, i.e. a write
  boundary), template-coverage strips U+FFFE. 21 templates changed.

## Why the seam redesign happened (so nobody re-adds the guard)

With GROUP gone, the seam-edge analyzers (`ruleEdgeClass`, `ruleEdgeCharSet`,
`leftmostTerminalImmediate`) could walk hoisted forms' bodies; they had been
hitting `default` on the wrapper and answering "varies". Static seams then
appeared inside form templates (`from{{ source | markSeam }}`), and
typescript read-render-parse fell 112→110 (`importsomething from'foo.css'`).
Cause: `markSeam` was an askama filter calling a thread-local
`mark_adjacent()`, and askama 0.15.6 evaluates filter expressions BEFORE
emitting the writes that precede them (probe:
scratchpad `askama-probe`, `{{ a }}from{{ b | mark }}` → mark consumed by
`a`). The mark is redundant by its own doc except for immediate tokens; the
fix is the in-band sentinel above. Memory:
`project_markseam_inside_forms_runtime_gap` (resolved),
`project_static_spacing_rawwriter` (askama retirement direction).

## Remaining plan (Tasks 4–7), each byte-identical-gated unless stated

4. `polymorphs:` → `patches:` (rename `transforms` → `patches` everywhere:
   `WireConfig`, `TransformsConfig` → `PatchesConfig`, the three grammar
   files, grammar glossaries). Unify `buildTransformParentFn` and
   `buildPolymorphParentFn` into one `buildPatchedParentFn(kind, patchSets,
   userFn, context)` (deposit base for hidden parents); fix
   `registerHiddenRuleForPlaceholder`'s variant branch to use
   `polymorphHiddenName` (today `_${parentKind}_…` double-underscores a
   hidden parent — masked by the polymorph path). Delete `PolymorphsConfig`,
   `WireContext.polymorphsConfig`, `drainPolymorphsConfigMetadata`,
   `RawGrammar.polymorphsConfig`, `buildPolymorphsConfigSkip` +
   `NormalizeCtx.polymorphSkip` (normalize's `variantSkip` from
   `linked.variantChildren` must cover it — probe first), the `polymorphs`
   argument of `applyGroupOverrides`/`validateGroupsConfig`/
   `deriveSynthesizedName` (no grammar's `groups` path sits under a polymorph
   path — verified by census). Move the 27 entries: each `kind: { path:
   name }` → `kind: { path: variant('name') }` appended as the LAST patch set
   (array form) so ordering matches today (transforms first, polymorphs
   after). Tests: `dsl/__tests__/wire.test.ts` (11 `polymorphs:` fixtures →
   `patches` with `variant()`), `post-evaluate-invariant.test.ts`,
   `tools/src/validate/template-coverage.ts` mention. Gate: `.sittir/
   grammar.js`, `src/grammar.json`, `node-model.json5`, all `src/**`
   byte-identical.
5. Inline `transform()` removal: rust `_pattern` → `patches: { _pattern: {
   '-1': alias('wildcard_pattern') } }`; `range_expression` → `{ '-1':
   alias('range_expression_bare') }`; `raw_string_literal` → `{ '0':
   alias('raw_string_literal_start'), '2': alias('raw_string_literal_end') }`;
   typescript `ambient_declaration` → `{ '1/0': variant('declaration'),
   '1/1': variant('global'), '1/2': variant('module') }` (merge with any
   existing entry as an array); rust `string_literal` (hidden name
   `_string_literal_open` ≠ visible `string_open`) and `_non_special_token`
   (slices members after patching) are rewritten in full in `rules:` — dump
   with `sittir tool probe-stages --grammar rust --kind <k>`. Drop the
   `transform` export from `dsl/dsl-authoring.ts` (+ globals d.ts). Gate:
   parser byte-identical.
6. `defaultArm()` placeholder (`dsl/primitives/default-arm.ts`) → resolvePatch
   stamps `annotations.defaultArm: true` on the arm (error if the path is not
   a choice arm) → `deriveValuesForRule` copies it (factor the four
   `...variantOf` spreads into one `armFacts(rule)`) → `NodeRef.defaultArm`
   → `AssembledNonterminal.defaultArm` (storage kind; throws on two) →
   `from.ts`: `resolveFieldCall` passes it as the 4th arg of
   `_resolveOne`/`_resolveMany`; `_pickArm(arms, defaultArm, what)` tie-break
   for the kind route AND a new bare-string route (`_BARE_STRING_ARMS`: kinds
   whose bare closure reaches a leaf-registry kind, from the same closure as
   `_BARE_ACCEPTS`; share `isLeafRegistryKind` with
   `buildLeafRegistryEntries`); `_leafKindFor` split out of
   `_resolveLeafString`. Rust: `patches.impl_item: { '<path to the
   positive-clause arm>': defaultArm() }` — find the path with
   `probe-stages` (member 3 is `optional(field('trait_clause', choice(alias,
   alias)))`; wrappers consume one index each, so try `'3/0/0/0'`, or the
   field-name form `'3/trait_clause:/0'`). Delete the GAP B comments in
   `examples/17-dogfood-rust.ts` (lines ~133-139, ~224).
7. Hoisted forms get a from() coercer: `classifyFromEmission` drops
   `'skip-hoisted-form'`; `bundleEntries` excludes hoisted non-list compounds
   (keeps them off the top-level bundle/`ir`); delete
   `FromEmitter.#localFormChildCoercers` (dead) and `unexported` if unused.
   Gates then include dogfood examples rust 0 · ts 0 · py 0 and the runtime
   probes in the plan (`ir.statement.impl({ traitClause: 'std::fmt::Display',
   … })` renders `impl std::fmt::Display for SpliceError {}`; the negative
   arm via `{ kind: 'impl_item_negative_clause', trait }` or
   `.negativeClause`).

## Gates recipe

Type-check: `pnpm -C packages/codegen run type-check` (clean;
`packages/tools` has 1 pre-existing error). Regen: `pnpm exec tsx
packages/cli/src/cli.ts gen --grammar <g> --all --output packages/<g>/src
--tests-dir packages/<g>/tests --no-workspace-check` ×3 (manifest hashes
codegen sources; regen after ANY later source edit). Crates: `cd
rust/crates/sittir-<g> && pnpm run build` whenever `.jinja` or grammar
changed (STALE-BINARY gate). Validate: `pnpm exec tsx packages/cli/src/cli.ts
validate counts rust typescript python` (positional grammars) then `validate
history 6` — compare numbers. Codegen `vitest run` from inside the package
(15 known; it rewrites python's `.sittir/grammar.js` → regen python after).
Per package `vitest run` (rust 6 known). Commit by pathspec; never
`TODO.md`, `packages/tools/validation-report.json`,
`examples/01-construct-nodes.ts`, `packages/*/node_modules/.vite/**`, the
untracked `*-roles.scm` / `sittir-role-interfaces-scm-spec.md`, older
handoffs.

## Gotchas met

- `rg`/`grep`/`find` are hook-blocked; use infigraph `search`, `awk` with
  `(^|[^A-Za-z_])WORD([^A-Za-z_]|$)` (never `\b`), `sed -n`.
- Edit/Write on `__tests__` files is hook-gated: call
  `mcp__infigraph__generate_test_context` once first.
- Scratch tsx scripts must be `.mts` (scratchpad has no ESM package).
- The validator hook auto-commits `chore(validator): record validation run`
  onto the current branch; check `git log` before assuming the tree.
- A regen deletes `rust/crates/sittir-typescript/test-fixtures.json`; the
  native build recreates it. Restore rather than commit the deletion.
- All GROUP nodes were top-level and attribute-free (probe in
  scratchpad `probe-group-depth.mts`); every nested-GROUP branch was dead.
