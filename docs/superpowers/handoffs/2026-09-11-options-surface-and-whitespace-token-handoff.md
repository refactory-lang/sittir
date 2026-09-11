# Handoff — one options surface, and a whitespace token that coalesces (2026-09-11)

Branch `feat/strict-rebuild-from-source`, continuing from
[the typed-path-keys handoff](2026-09-10-typed-path-keys-handoff.md). This is
steps 2–4 of [the labels-via-bindings handoff](2026-09-10-labels-via-bindings-handoff.md).
Nothing pushed, no PR.

| | |
| --- | --- |
| done | sibling gaps seat through supertypes and polymorphs; a whitespace-only token coalesces with its seams; `options.ts` is the mapped address type alone; `RenderDefaults` is gone; the whitespace vocabulary is the grammar's `_whitespace` supertype (python adds `double_newline`) |
| commits | `abb52b860` step 2 + whitespace token · `5eb71fe14` tsconfig · `fb2b98e81` step 3 · `7db5e094f` step 4 · the whitespace supertype is the commit that amends this handoff |
| next | the render-options plan's remaining items; typescript/python grammars are still `@ts-nocheck` |

Gates on every commit: `validate:native` identical to the previous runs — rust
`147 / 207 / 134 of 137`, typescript `143 / 193 / 112 of 114`, python
`126 / 142 / 115 of 116` — with the typescript AST-match count up from 110 to
112 (the two try/catch documents) and the S7 ratchet quiet; every generated
crate's own path-table tests pass; codegen `tsc --noEmit` clean; the three
package tsconfigs (which include their tests) clean; comment-slop gate clean;
propose-14 ratchet unchanged; the suite green (245 files, the only failures
ever seen were `collect-baseline` under concurrent load, 13/13 alone).

The examples: all three identical modulo whitespace; typescript and python
re-parse to the same tree. typescript renders 96 lines against 111 of input,
python 15 against 20 (one blank line after a definition, as its rule says),
rust unchanged at 102 against 116.

## What landed

**Seating through supertypes and polymorphs.** `matchAddress` treats a
supertype segment as any of its members (`supertypeMembersByPublicName`), and
`seatedSites` expands an admitted kind to what renders in its place: a
supertype to its concrete members, a polymorph with no trailing edge of its own
through its slot's element kinds. It walks `node.slots` with
`slotElementKinds`, never `variantChildKinds` — those carry the public alias
name (`export_statement_default`) while the node map is keyed by storage kind
(`_export_statement_default`), and the first cut silently expanded to nothing.
`seatVariantArms` seats a nested variant with nested matches, every level
rebound through `::std::borrow::BorrowMut`, because a polymorph's content slot
may be boxed and stable Rust has no box patterns; the wildcard arm carries
`#[allow(unreachable_patterns)]`. typescript's `program/statements:/(_)/after:
blankline` now reaches `let`, `function`, `class` and `export`.

**A whitespace token coalesces but is never dropped.** The writer coalesces
only mark payloads; literal text never joins in. typescript's
`_automatic_semicolon: string('\n')` therefore stacked a second break on every
statement gap, and `string('')` lost the break that `try {}` followed by
`catch` on the next line relies on — three AST mismatches, the S7 ratchet, and
fourteen dropped fixtures. The `newline` role python uses for `_newline` is not
available either: typescript's automatic semicolon is an arm of the
`terminator` choice, and stripping it to whitespace leaves wrap with a required
slot and no value. The fix is a third writer mark, `TOKEN_SEAM` U+FDD3
(`spacing.rs`): its payload merges with adjacent seams by width like a seam's,
but `finish()` writes one still held rather than dropping it, since the source
holds that token. `seamMarked` / `isWhitespaceOnly` (`render-body.ts`) apply it
wherever a kind's fixed text is written: an inlined reference (`emitSymbol`), a
leaf transport's `text` (`leafTextWrite`), and the literal arms of a slot or
`AnyTransport` enum. A SEAM-only prefix was tried first and was right except at
the end of a render, where python's tests pin `'pass\n'`.

**One options surface.** The generated `options.ts` is
`AddressedOptions & { readonly indent?: string }` and nothing else; the flat
tiers (`SpacingLabel`, `KindSpacing`, `Members`, `SitesOf`, …) are gone. The
render crate's `resolve` reads `indent` and one address object per root kind;
an unknown key, an address naming no site (`options: (array)/elements:/sideways
names no site`) or a value a site does not admit is an error, where the nested
walk used to fall through to the flat tables. Delimiter sites join the path
table beside spacing sites: `SITE_PATHS: &[(&str, SiteRef)]` with
`SiteRef::Spacing(i) | Delimiter(i)`, so `formal_parameters_elements:
{ formal_parameter: { delimiter: Delimiter.Trailing } }` resolves at runtime as
the type already allowed. The package option tests are written against
addresses; their `@ts-expect-error` negatives are checked by each package's
`tsc`.

**`RenderDefaults` removed.** No grammar declared a `defaults:` block, and the
`options:` block already reached every site. `DefaultResolver` now holds only
the declared option arms (`declaredOptionArms`, which `resolveRenderRules`
feeds back into a second spacing pass), a site's label is its address,
`validateRenderDefaults` / `checkDefaultArms` and the delimiter and separator
default maps in `collectSitePreferences` are gone, and the emitters' signatures
no longer carry it. Generated output was byte-identical across the removal,
manifests and the bundled `grammar.js` aside.

**The whitespace vocabulary belongs to the grammar.** `SPACING_ARMS` and
`WHITESPACE_ARMS` are gone. Each grammar declares a hidden supertype
`_whitespace` — listed under `supertypes:` and written as a choice over its
whitespace externals — and `compiler/model/whitespace-arms.ts` reads every
arm list from it: `whitespaceArmsOf` (all members, each named by the visible
alias `visibleExternals` registers) for flanks, edges and seams,
`spacingArmsOf` (less `indent`/`dedent`, `DEPTH_ARMS`) for separator gaps.
The generated `SpacingArm`/`WhitespaceArm` unions, `whitespaceTextOf` and the
options-block arm checks all derive from the same list. Python adds
`_double_newline` (`string('\n\n\n')`) and its `module` rule prefers it
after every top-level `function_definition`, `class_definition` and
`decorated_definition`; the writer's `seam_rank` is now the newline count,
so the widest run wins without a named table. The example renders two blank
lines between the class and the function that follows it.

Getting the supertype through the compiler took four fixes. A hidden rule
nothing references is pruned by **three** reachability walks — evaluate's
`prunePlaceholderOrphans` (now run after the metadata callbacks, with the
declared supertypes protected), the rule catalog (`buildRuleCatalog` now
takes `roots` and shares `util/reachable-rules.ts` instead of its own walk)
and link's `pruneUnreachableRules` (`ctx.supertypes` join externals and
extras as roots). tree-sitter accepts the supertype but leaves it out of
`node-types.json`, since its members never appear in a parse; the model
builds it from the rule. Python's members are all fixed-text tokens (its
indent and dedent are role externals stripped at link), so
`emitSupertypeUnionDeclarations` now counts token members, whose kind-id
aliases follow — `Whitespace` in `types.ts` is then the same kind-id union
`options.ts` has as `WhitespaceArm` (renamed: the package index re-exports
both modules, and the two names collided). Under the supertype the whitespace kinds reclassify from
visible `pattern` leaves with `buildTight(text)` factories to hidden
parameterless tokens; no other supertype's union changed. Link also stamps
the supertype's aliased members as `variantArms`, which `markUserFacing`
reads as variant children — that put `ir.indent`, `ir.dedent` and their
coercions on the IR surface and tripped the examples-verify builder
ratchet; the whitespace supertype's arms are now excluded there, since a
whitespace kind is chosen by an options address and never authored.

## Facts worth keeping

- An `options:` block addresses a kind by its **public** name: `expression`,
  not `_expression`. A hidden spelling matches nothing and, with
  `requireHit` off in the render-rule pass, is skipped without a word.
- Precedence is the narrowest site set: a kind beats its supertype beats `_`;
  two addresses that overlap without nesting are a build error; on an equal
  set a declaration beats a binding.
- The editor's TypeScript server held ~10 GB with `incremental: true`; the
  root `tsconfig.json` now turns it off, and each composite `tsconfig.build.json`
  turns it back on (TS6379 otherwise). The `vitest-setup` "build failed —
  continuing with cached dist" line is what that error looks like.
- `git commit -- $files` with a newline-separated variable is one pathspec;
  list the paths inline.
- An empty `_whitespace` supertype means the grammar renders no whitespace:
  `whitespaceSymbols` returns nothing and both spacing passes hand the
  rules back untouched. A missing supertype is a build error.

## Commands

```bash
pnpm -C packages/codegen exec tsc --noEmit -p tsconfig.json
for g in typescript rust python; do pnpm exec tsx packages/cli/src/cli.ts gen --grammar $g --all --output packages/$g/src; done
pnpm run validate:native && pnpm run validate:history
for c in sittir-typescript sittir-rust sittir-python; do cargo test -p $c --lib site_address_tests; done
pnpm exec vitest run                                    # its own call
bash scripts/comment-slop-check.sh --working
pnpm exec tsx packages/cli/src/cli.ts tool dump-ast-mismatches -g typescript -v
```
