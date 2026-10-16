# Handoff — a label is a binding (2026-09-10)

Branch `feat/strict-rebuild-from-source`, continuing from
[the sibling-gaps handoff](2026-09-10-sibling-gaps-and-label-addressing-handoff.md).
Nothing pushed, no PR.

Plan: `docs/superpowers/plans/2026-09-09-preference-address-surface.md`.
Spec: `docs/superpowers/specs/2026-09-09-preference-address-design.md`.

| | |
| --- | --- |
| done | that plan's steps 1 and 3, by a route the plan did not describe |
| next | strongly-typed path keys, then step 2, then step 4 |
| open | `RenderDefaults` has no producer left; an `OpenPatchMap` arm is standing in for a typed path |

Gates at both commits: all three `test-fixtures.json` byte-identical, native
rebuilt, validate at baseline — rust `147 / 207 / 1259`, typescript
`143 / 193 / 1063`, python `126 / 142 / 1286`, `AstMatch` equal to `Pass` on
every row — suite 245 files / 3456 passed, `cargo test -p sittir-core` 113,
all three packages `tsc --noEmit` clean, glossary test green, propose-14 OK.

Suite counts fell from 246/3473 because the tests pinning the deleted
mechanism went with it: one file and seventeen tests.

## What landed

| commit | |
| --- | --- |
| `26998cc75` | a label is a binding, and a default comes from the config block |
| `20e9c2373` | `preference()` means one thing — 248 insertions, 917 deletions |

## The design, as it settled

**A choice is a site because it is a choice.** A slot holding more than one
value offers a candidate whose arms are its own members, the way a separated
list's arms come from its separator rule. `delimiter` and `separator` already
worked this way; `declared` was the one source that needed a `patches:`
annotation to exist at all. Candidates are retained only where `options:`
names them, directly or through a binding, and only where the site admits the
declared value — so the site space holds what a grammar addresses, and the
ceiling does not move.

**A label was already expressible as a binding.** The address language reached
these sites without it: the typescript bindings name them by field
(`_/terminator:`) and by kind (`_/automatic_semicolon:`), never by the label.
The doubled generated key `terminator_statement_terminator` — the slot name
with the label restating it — was the tell, and `statements/terminator` in
`options:` was already declaring the same default the patch was.

**Resolution is two coalesces, not one three-tier chain.**

| choice kind | registered in | resolution |
| --- | --- | --- |
| preference site | the `options:` config block | `slot value ?? option value` — the config *supplies* the option's default, so no third tier runs |
| plain choice arm | `patches:` `arm.default` | `slot value ?? arm.default` — its own runtime coalesce |

So `arm.default` is scoped, not retired: it governs plain choices, while a
registered option takes its default from the config block. Strings must not
carry one, because `string` is registered as `quotes/style`.

**A resolved arm is stamped on the model.** `stampResolvedDefaults` writes each
site's arm back as `AssembledNonterminal.optionDefaultArm`,
`AssembledList.resolvedDelimiterArm` and `resolvedSeparatorArm`, beside the
`storageInfo` stamp those classes already carry. The factory reads the stamp,
so the arm it bakes in and the arm the renderer resolves have one source.
Threading instead would have touched an eight-parameter function at five call
sites, all free functions.

**A site carries the address it was born with.** Not carrying it is the
sharpest defect below.

## What the cleanup removed

The two-arg `preference` form and everything that existed only to serve it:
`applyPreference`, `kindPreferencesOf` and the preference limb of the patch
path, `structuralPatchesOf`, `isSitePreferenceEntry`, three `check*Arm`
helpers, `SitePreferenceMap`, and `preferenceLabel` on a value. `renderDefaultsOf`
was reduced to `assertNoSpacingAddressPatches` rather than deleted, so its one
live guard survives: a gap, seam or flank spelled as a top-level patch key
names no rule and says so.

## Three defects, and why the gates missed them

- **The factory's bare-input arm.** `preference(label, default)` had a third
  job nobody had catalogued — it stamped `arm.default`, which the factory reads
  to emit the fourth argument of `_resolveOne`. Removing the label made
  `F.buildString('hello')` throw *a bare X fits more than one arm*, while all
  three corpora stayed byte-identical. **Fixtures render from explicit nodes and
  never exercise bare-input coercion**, so that gate is structurally blind to
  construction-side breaks.
- **The render module never saw the options block.** `RenderModuleEmitter`'s
  constructor built `#options` from three fields and omitted `config.options`,
  and `synthesizeRenderModuleBundle` dropped it again — so it had been planning
  its table from an unresolved site set. Fixing it shrank the `options.rs`
  churn from 2964 lines to 213; most of that "churn" was the render module
  disagreeing with the real site ordering.
- **A retained site without its `path`.** Constructing the `SitePreference`
  without carrying the candidate's `path` lets `pathOf` re-derive the address
  downstream, turning the slot's `fieldName` into a plain `name` segment, which
  no binding spelled with a colon can match. The options-block resolution uses
  the candidate's explicit path and worked fine, so **every gate stayed green**
  while the emitter's address table silently dropped the virtual keys
  `statements` and `quotes` — killing the runtime one-key control that
  `9c9459583` had just added. Only `tsc` caught it, and the suite never runs
  `tsc`.

All three lived in a generated surface or a default, and both fail quietly by
construction: a wrong default still renders valid output, and a missing option
key still compiles everywhere except a type-check nobody runs in the suite.

## Next, in this order

1. **Strongly-typed path keys, for `patches:` and `options:` alike.** A path
   may look like anything and should still be checked — the ruling stands even
   where no grammar exercises a form today. `PathKey<N>`
   (`grammar-shapes/path-type.ts`) checks only the first segment; the tail is
   an unchecked `string`. An `OpenPatchMap = Readonly<Record<string,
   TransformPatchValue>>` arm in `PatchesConfig` is the interim that restores
   the capability, and the typed version replaces it.

   Measured depths in use across the three grammars: 1–2 = 109 keys, 3 = 15,
   4 = 5, 5 = 3, 6 = 1 (`rust: 1/1/0/1/3/0`). **A cap of 3 or 4 is not enough.**
   Cap around 8 with the tail degrading to `string` past the cap, so arbitrary
   paths still type while everything current is checked.

   It must admit scm-shaped segments, not only digits: `NonNumericFirstSegment`
   is already `'_' | `(${string})` | `${string}:` | `-${number}`` — node
   `(kind)`, field `name:`, wildcard, negative index. Related untracked work in
   the tree: `{rust,typescript,python}-roles.scm`,
   `sittir-role-interfaces-scm-spec.md`.

   **Measure `tsc --noEmit` per package before and after.**
   `grammar-shape.rust.ts` is ~9,600 lines; a recursive conditional type over
   it can hit *instantiation is excessively deep* or tank wall-time, and a
   regression needs to be attributable.

2. **Teach `matchAddress` supertype membership.** `segmentMatches` compares a
   kind-match by exact name or `_`, so `(statement)/…` matches nothing. This
   must land before step 3 below, or deleting `SUPERTYPE_MEMBERS` /
   `flank_supertype` loses a capability rather than relocating it.

3. **Retire the flat surface.** `KindOther`, `KindSpacing`, `KindWhitespace`
   and the flat runtime tables, migrating `packages/*/tests/options.test.ts`.
   `OtherLabels` is already empty.

4. **Remove `RenderDefaults`.** It now has **no producer** — no grammar
   declares a `defaults:` block and `renderDefaultsOf` is gone — yet it is
   threaded through ~9 signatures plus `validateRenderDefaults`,
   `checkDefaultArms`, `DefaultResolver`, `SiteDefault` and `siteKey`.

## Gotchas

- **Run `tsc --noEmit` per package; the suite does not.** Vitest transpiles
  without type-checking, so an options-surface break passes 3456 tests and
  fails the type-check.
- **A repeated key in one object literal replaces the earlier entry** and takes
  its default with it. Appending `field_declaration_list_elements` to rust's
  `options:` silently reverted both delimiters to `Delimiter.None`. Merge into
  the existing entry; the same trap as `patches:`.
- **Gate a regen on its exit code, never on grepping its output.**
- **`pnpm -C packages/codegen run build` starts with `rm -rf dist`.** Build and
  regen in separate calls.
- **Diff the `defaultId` column of `options.rs` by parsing it.** It staying
  `20` across all 69 changed rows is what proved the rename moved no behavior.
- **`.sittir/grammar.js` shrinking is expected** when dead DSL code goes; the
  gate is that `.sittir/src/grammar.json` and the generated `src/` do not move.
- **The infigraph growth guard** refused to index at 2019 MB against a 63 MB
  baseline; a full reindex cleared it. While its daemon has no graph, the Bash
  hook blocks `rg`/`grep` until `.infigraph/.search-fallback-allowed` is
  written — and that write must be its own Bash call.
- **`save_session` persists its structured record but not its narrative.** Two
  calls reported *Session saved* while `.infigraph/sessions/session_<date>.md`
  stayed byte-identical (the `.json` updated correctly both times). Check the
  file's size or `md5` after saving; if the narrative is missing, append it
  directly as `## Save @ HH:MM UTC` followed by a blank line and the text.

## Carried, untouched

Everything under "Carried, untouched" in the sibling-gaps handoff still
stands: `SPACING_DEFAULT` is `'space'`, wrong for a separator's leading gap;
rust rebuild blank lines are 4 correct / 0 spurious / 3 missing with no
trailing newline at EOF; field lists diverge inline-vs-multiline;
struct-pattern `lbrace_before` and closure `pipe_after` are open.

One new observation: structural minting reaches `class_body_member.terminator`,
which admits `Comma` and which the label never covered. Rendering did not move,
but `_/terminator:` now governs it.

## Commands

```bash
pnpm -C packages/codegen run build                      # separate call — it rm -rf's dist
for g in rust typescript python; do
  pnpm exec tsx packages/cli/src/cli.ts gen --grammar $g --all --output packages/$g/src \
    >/dev/null 2>&1 && echo "$g OK" || echo "$g FAILED"
done
git diff --stat -- 'rust/crates/*/test-fixtures.json'   # the whitespace gate
for g in rust typescript python; do                     # the gate the suite does not run
  pnpm -C packages/$g exec tsc --noEmit -p tsconfig.json && echo "$g types OK"
done
for c in rust typescript python; do (cd rust/crates/sittir-$c && pnpm run build); done
pnpm run validate:native
pnpm exec vitest run                                    # its own call
cd rust && cargo test -p sittir-core
```
