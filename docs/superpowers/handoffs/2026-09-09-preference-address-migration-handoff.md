# Handoff — preferences have one address (2026-09-09)

Branch `feat/strict-rebuild-from-source`, continuing from
[the preference address surface handoff](2026-09-09-preference-address-surface-handoff.md).
Nothing pushed, no PR.

Plan: `docs/superpowers/plans/2026-09-09-preference-address-surface.md`.
Spec: `docs/superpowers/specs/2026-09-09-preference-address-design.md`.

| | |
| --- | --- |
| done | Tasks 3–9, plus an unplanned 8b |
| next | **Task 11 first, then Task 10** — see *Why 11 before 10* |
| open | Task 11 needs a design correction, below |

Gates at every commit: fixtures unmoved, native rebuilt, validate byte-identical
— rust `147 / 207 / 1259`, typescript `143 / 193 / 1063`, python
`126 / 142 / 1286`, `AstMatch` equal to `Pass` on every row — suite 246 files /
3467 passed / 0 failed, `cargo test -p sittir-core` 113.

## What landed

| task | commit | |
| --- | --- | --- |
| 3 | `ccf89f10f` | `readOptionsBlock` — the block read into declarations and bindings |
| 4 | `8232fb90f` | `addressSites` / `matchAddress` — a site knows its address |
| 5 | `e1b3691b8` | `resolveBindings` — narrowest site set wins, conflicts at load time |
| — | `bb853e020` | the plan reconciled to what was built |
| 6 | `fa4b73e66` | sites numbered by canonical path order, `SITE_PATHS` |
| 7 | `a0c5f6d89` | `site_range` and a nested walk, additive beside the ladder |
| 8 | `3b24fcd07` | the address surface as a mapped type |
| 8b | `61bfb5a48` | the block reaches a site |
| — | `5c8595008` | a separator gap names its token |
| 9 | `b955add7f` `b023afd48` `d3101ff29` | python, rust, typescript migrated |

100 preferences are addressed; 27 stay under `patches:` deliberately — 15 empty
separators (Task 11 retires them) and 5 delimiter preferences (a different arm
space the address surface does not carry), plus rust's two array-form slot
declarations.

Across all three migrations **not one site changed its arm** and no rendered
string moved. Only labels moved: 10 in rust, 12 in typescript.

## Two things the plan did not have

**Task 8b — the block reaches a site.** `readOptionsBlock` and `resolveBindings`
were built and connected to nothing; migrating would have deleted every declared
default rather than respelling it. The block is now carried unread from `wire()`
through `RawGrammar` to the model, and resolved in `resolveRenderRules`, which
runs both render-rule passes, resolves against the enumerated sites, and runs
both again. Both passes, not just the seam one — a separator's arm is resolved
while spacing.

**The label half of Task 8.** `deriveAddressTables` built its tables from sites,
and a virtual label has no site, so a migrated label vanished from the flat
surface without arriving in the nested one — a lost capability, not a rename. A
declaration matching no site is now a label, typed from the sites its bindings
reach.

## Task 11 needs a correction before it can be built

Its Step 3 mints the new pair in `withKindEdges`, which attaches a kind's edges
to **the kind's own rule**:

```ts
const part = (side) => seamChoice(kind, seamLabel(publicKindName(kind), side), 'tight', resolver, seams);
return { ...rule, members: [part('before'), ...r.members, part('after')] };
```

That cannot carry a per-seating arm, because a kind has more than one seating.
rust's `attribute_item` sits in `source_file/statements` and in at least four
`attributes` slots. One body cannot hold two pairs — which is what the spec
already says elsewhere: *a kind edge is part of a child's own render body and
fires on every occurrence*.

**The site is (parent kind, slot, child kind), and the seam is emitted where the
parent renders its slot** — child kind X scoped within parent kind Y, selected
per element by the element's kind, which the list already knows. `base + ordinal`,
as the punctuation arm seams do it. The child's own `before`/`after` edges are
left alone, so nothing else has to move and the render context that plan 2
defers is not needed.

That makes Task 11 a Task-6-sized job — body IR, the list's template emission,
and the native `ListView` — not the site-minting plus one declaration its Step 3
implies. Steps 6–8 stand as written once the sites exist.

## Why 11 before 10

Task 10 cannot finish while the empty separator is declared: 15 of the 27
remaining `patches:` entries are `preference('empty_separator_space', …)`, and
they flow through a branch Task 10 wants to delete. Task 11 is what makes them
unnecessary — a slot hands its gaps to its children by declaring its separator
tight. Doing 11 first lets Task 10 be one complete deletion instead of two
passes.

The cost of flipping is one transitional branch in `pathOf`, because Task 11
mints `<slot>_<child>_after` and Task 10 is where a site's path starts coming
from its own address. About five lines, deleted with the other four.

## Gotchas

- **Gate on `options.rs`, not only the fixtures.** It records every site's
  resolved default id, so it catches a changed default at a site the corpus
  never exercises. It caught two this session that the fixtures could not see.
  Compare the parsed default column; the label column moves by design when a
  label migrates.
- **Audit every method on `DefaultResolver` when adding a resolution source.**
  `resolveFlank` was the one that never funnelled through `#resolve`, so
  declared flanks silently did nothing.
- **Rebuild the napi binaries before validating** whenever `options.rs` changes,
  or validate reads a stale `.node` and proves nothing.
- **Run the suite as its own Bash call.** Chained after a regen or
  `validate:native` it produces phantom failures — a stale transform cache, or
  `Incompatible language version 0` from a half-written `parser.wasm`. Both
  re-run green.
- **41 failures all reading "SOURCE INPUTS CHANGED"** means the manifest guard
  fired because `packages/codegen/src` was edited without regenerating. Not a
  regression.
- **`vitest run -u <path>` with several paths** runs the whole suite and may
  silently skip one file's snapshot. Update one file at a time and confirm
  `Snapshots N updated`.
- **Read the actual declaration line before an exact-text replacement.** Shared
  labels break the `key: preference('key', arm)` assumption — typescript's
  `switch_case_start` is `preference('case_body_start', 'indent')`.
- **A keyword seam is a field segment, not a literal.** `if_after` addresses as
  `_/if:/after`; `literalSlotOf` and `enumSlotOf` name a field.

## Carried, untouched

`SPACING_DEFAULT` is `'space'`, which is wrong for a separator's leading gap and
is why every grammar buys it back with `*_separator_space_before: 'tight'`.
Aligning it to `tight` moves exactly one construct across all three grammars —
rust's `_let_chain` `&&`, itself already rendering inconsistently
(`b&&c && d`). A deliberate-movement change, kept out of the migration's
no-movement gate.

Word seams get no space from the `SpacingWriter`: it inserts only lexically
required ones (`left === 'word' && right === 'word'`), so `if` + `(` owes
nothing and those boundaries are `static-glued` and baked. `throw"hello"` and
`do{` in the typescript corpus are undeclared style gaps, not writer bugs.

Blank lines in the rust rebuild are 4 correct / 1 spurious / 3 missing. Task 11
closes the spurious one. Also open: field lists diverging inline-vs-multiline,
struct-pattern `lbrace_before`, closure `pipe_after`, no trailing newline at EOF.

## Commands

```bash
for g in rust typescript python; do
  pnpm exec tsx packages/cli/src/cli.ts gen --grammar $g --all --output packages/$g/src
done
git diff --stat -- 'rust/crates/*/test-fixtures.json'          # the whitespace gate
git diff --stat -- 'rust/crates/*/src/render/options.rs'       # the defaults gate
for c in rust typescript python; do (cd rust/crates/sittir-$c && pnpm run build); done
pnpm run validate:native
pnpm exec vitest run                                            # its own call
cd rust && cargo test -p sittir-core
```
