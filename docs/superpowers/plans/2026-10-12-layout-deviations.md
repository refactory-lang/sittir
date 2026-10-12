# Line Layout as Deviations from the Read-Time Options: Plan

**Goal:** a parsed tree stores, as layout entries in its trivia table, only the gaps whose source line layout differs from what the options in effect at read time render there. A gap with no entry renders as the options say. A stored deviation is the occurrence's stamp: it beats per-call options, and only `reformat` drops it. List gaps move to the same entries, and their stamps retire.

**Spec:** `docs/superpowers/specs/2026-10-09-trivia-table-design.md` (§ 1 Layout, ruling 11 as restated below).

**Rulings this plan carries out (the maintainer, 2026-10-12):**
- Layout entries store a gap's deviation from the options, not every gap's source breaks.
- The baseline is the options in effect at read time: the tree's inferred layer, over the engine's options, over the grammar's defaults. This is the "differs from the options" rule the inferred layer already uses.
- A gap whose source layout equals what the options render stores nothing. A gap that differs stores its source class: no break where the options break (`fn f() { x; }`), one break where they give a blank line (`// c⏎fn g() {}`), a break where they keep the line.
- Ruling 11, restated: a gap with no entry renders as the options say.
- A stored deviation beats per-call options. Only `reformat` drops it.
- List gaps migrate to deviation entries, and their stamps retire.
- The fixture generator's detached input keeps the layout, so a moved render fixture replays from it.

## What exists today

- **Breaks stored, in-line runs not.** The trivia table stores every run holding a line break as a layout entry (`trivia_table.rs`, `Assigned::Layout`, read in `engine.rs::assigned_side`), whether or not it is the options' choice. A run on one line is never stored.
- **List gaps are stamps, not entries.** A list keeps its layout runs off the entries ("its source flanks spell its edges"). At render, `prepare.rs::fill_list_gaps` classifies the source text (`SourceGap`) or the snapshot geometry between items, and stamps the items' base edges at trivia strength (`set_gap_edge`). The delimiter flanks reach the render as `SourceFlank`.
- **The gap→site knowledge at read.** It is `DEPTH_REGIONS` alone: per kind, the token anchors of the stretch a template indents (`DepthRegion { kind, open: After(["{"]), close: Before(["}"]) }`), used by the assignment for indentation depth. Everything else (spacing sites, kind edges, seats, delimiter flanks) is known only by the render: the template's site calls and `prepare`'s seat tables.
- **The inferred layer** (`options.rs::InferredOptions`) holds the indentation unit and the root's two edge arms, each only where the source differs from the engine's options.

## The deviation test, per site kind

For a gap a side takes in a parsed tree, the **read-time arm** is what the gap's site resolves to under the baseline, and the **source class** is `classify_whitespace(run, allowed(site), whitespace)`. This is the same classification the inferred layer and `fill_list_gaps` use, now one function. The gap stores an entry of the source class when the two differ, and nothing otherwise.

| site kind | where its site is known | read-time arm |
|---|---|---|
| spacing site between two template elements (slot↔slot, slot↔token) | gap-site table (new, below) | `spacing[site].arm` |
| kind edge (a node's before or after edge) | `EDGE_SITES` (kind → site) | the edge arm |
| seat between repeated items (statements, members) | seat tables (`SEATS_*`, item kind → site) | the seat's arm |
| list item gap, before or after its separator | gap-site table (the separator sites) | the separator site's arm |
| list delimiter flank | gap-site table (the flank sites, `DELIMITER_SITES`) | the flank arm |
| depth site (open and close of a `DepthRegion`) | `DEPTH_REGIONS` | a line break, the template's depth arm |
| the file's two edges | the inferred layer, unchanged | (stays in `InferredOptions.edges`, never an entry) |

Indentation is measured the same way. Only an excess over the template's depth is stored, as depth members, in the inferred indent unit (as today).

## Where the read computes it

**The gap-site table** replaces `DEPTH_REGIONS`: one table states where every site sits. For each kind, codegen emits each template seam that a parsed gap can sit at: the site, and the anchors on its two sides. An anchor is a slot (by field id), a literal token (by text, as `DepthAnchor` is today), or the node's start or end. A depth region is the table's depth-site rows, and every reader of `DEPTH_REGIONS` (the assignment's indentation depth) reads them through it. The table is derived from the rendered template body, the one source of where sites sit, in `packages/codegen/src/emitters/render-options-rs.ts`.

A site the walk cannot anchor is a codegen diagnostic, and that diagnostic is a gate. It must reach zero in every grammar by the end of the pipeline, so a gap the table cannot place cannot occur at read, and the read has no fallback for one. If the diagnostic cannot reach zero for some site, the work stops and the site goes to brainstorm.

**The assignment** (`trivia_table.rs::TriviaTable::assign`, run once per tree on first use) already walks each gap with its owner and the tokens on both sides. For a gap that a side takes:
1. look up the owner kind's gap-site entry whose anchors match the gap's tokens;
2. classify the run against the site's allowed arms;
3. compare with the read-time arm from the baseline, which the parsed tree holds (inferred layer over engine options);
4. store `Assigned::Layout` only on a difference, now including an in-line class (space, tab or tight) where the arm breaks.

Every gap a side takes matches a row: the codegen gate guarantees it.

## How the inferred layer and the deviations stay consistent

- **One baseline, computed first.** The inferred layer is computed at parse (`InferredOptions::infer`), before the trivia table, and the assignment measures against `inferred.over(engine options)`. A source whose indentation unit differs is captured once, in the layer, and depth deviations are counted in that unit.
- **No fact in two stores.** The root's edges stay in the inferred layer, and the assignment stores no entry at the file's edges. A gap's deviation is only in the trivia table.
- **Options change after read.** A deviation is measured once, against the read-time baseline. A later per-call option changes only the gaps with no entry; a stored deviation beats it. `reformat` drops every layout entry and the inferred layer's arms.

## The data shape

- **Trivia table:** `Assigned::Layout { start, end, depth, owner }` is unchanged in form. It is now written only for a deviating gap, and may hold a run with no line break. `engine.rs::assigned_side` turns it into a whitespace member as today (`from_layout`), extended to the in-line kinds: the grammar's `_space`/`_tab` members, and a tight deviation as the gap's zero-width member, if the grammar has one, else a stated refusal in codegen.
- **Retired:** `SourceGap` (`$_layout.gap`, `CoordinateWrites::gap`), `SourceFlank` (`$_layout.flank`), `fill_list_gaps`/`set_gap_edge`/`single_separator`/`geometry_list_gap`, and the list's "flanks spell its edges" assignment rule. A list's gaps and flanks become entries on its items' sides like any other gap. JavaScript stops writing `gap` on rebuilt lists' items: a moved item's sides already carry their entries, and `changed` drops them at a changed edge.
- **The writer:** the stored-gap flag goes. A deviation entry is trivia, which merges at `SEAM_TRIVIA` and beats the template's seam: an in-line entry beats a template break. A held line end stays a floor, but a weaker mark no longer widens a floor that a stored entry holds (`spacing.rs`, below). The whitespace-token exemption is not needed.
- **Snapshots and detached fixtures:** both carry the entries as trivia (`walkTrivia` keeps them), so a detached render fixture replays from its layout. `selfContainedRenderInput` also keeps the facts a render still reads from `$_layout`, with no tree reference: today it drops `at`, `sides` and `span`. The plan checks, per kind, that a detached replay equals the tree render (the fixture gate does this for the whole corpus).

## Files

- `packages/codegen/src/emitters/render-options-rs.ts`, plus its model derivation: the gap-site table, replacing `DEPTH_REGIONS`, with its codegen diagnostic gate. Glossary: `docs/glossary/emitters.md`.
- `rust/crates/sittir-core/src/trivia_table.rs`: the deviation test in `assign`, the in-line class, depth regions read from the gap-site table's depth rows, the list rule retired.
- `rust/crates/sittir-core/src/options.rs`: one `classify_whitespace` use. `InferredOptions` gives the assignment its baseline.
- `rust/crates/sittir-core/src/engine.rs`: the baseline passed to `assign`; `assigned_side` takes the in-line kinds.
- `rust/crates/sittir-core/src/prepare.rs`, `slot.rs`, `layout.rs`: `fill_list_gaps` and the `gap`/`flank` facts retired.
- `rust/crates/sittir-core/src/spacing.rs`: the stored-gap work is dropped. One change: a held line end is widened only by a mark at least as strong as the layout that holds the gap, so a stored single break after a line comment is not widened by the template's blank line (`// c⏎fn g() {}`). Today any wider break widens the floor whatever its strength.
- `packages/common/src/*`: JavaScript stops writing `$_layout.gap` and `flank`.
- `packages/tools/src/validate/read-render-parse.ts`: `selfContainedRenderInput`.
- Spec: § 1 Layout and ruling 11, restated as above.

## Tasks

1. **The gap-site table**, red first. A codegen test pins the table rows for rust `block` and `function_item`, typescript `statement_block`, a list's flanks and separator, and a seat. The diagnostic refuses a site with no anchor, and it reads zero in all five grammars. The depth regions are read from its depth rows, and `DEPTH_REGIONS` goes. Gate: no render, fixture or validation row moves.
2. **Deviations stored at read**, red first with the four cases: rust `fn f() { x; }` and `fn f() {} // c⏎fn g() {}`, typescript `if (a) { b; }`, each in snapshot and template render, plus a built block keeping the template's breaks. Also: an enum or interface whose breaks equal the options stores nothing at its flanks and renders unchanged, and a per-call option changes a gap with no entry but not a deviating one.
3. **List gaps migrate**, in this PR, as their own commit series after task 2. The list gap and flank stamps retire, so line layout has one store when the PR lands. Red first: a rebuilt list whose items moved keeps each item's own layout. Gate: no fixture moves in this task.
4. **Detached input.** Red first: a fixture's detached input replays to the tree render for the moved kinds.
5. **Gates:** fixtures, validation, the suite, cargo and clippy.

## Expected fixture movement

A gap whose source equals the read-time options renders as before, so no fixture that reproduces its source today can move. A moved fixture is one with a deviating gap that a side takes: it moves to its source.
- **Expected movers:** the 67 rust and 29 typescript fixtures that the stored-gap attempt brought to their source.
- **No regressions.** The enum, tuple, interface and argument-list flanks that the attempt broke equal the options, store nothing, and stay as master renders them.
- **Not affected:** a fixture whose deviation sits at a gap no side takes (between an owner's own tokens) does not move, because no entry is stored there.

The gate lists every moved fixture with its before and after, checks that each now equals its source, and checks that `leftOutByKind` does not grow.

## Review Focus

1. A site the gap-site table cannot anchor: refused at codegen, never met at read.
2. A source indented with a unit other than the engine's: depth deviations are counted in the inferred unit, and no gap stores a deviation for the unit alone.
3. A line comment trailing a gap whose deviation is in-line: the comment's held line end still breaks the line.
4. A rebuilt list (moved, removed, inserted items): each kept item keeps its own deviations, and a changed edge drops them.
5. A detached fixture of every moved kind replays to its tree render.
