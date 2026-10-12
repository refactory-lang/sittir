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
- The writer is the one source of what the options render (the maintainer, ruling on the baseline). The read never re-implements the seam law: the baseline is a render.

## What exists today

- **Breaks stored, in-line runs not.** The trivia table stores every run holding a line break as a layout entry (`trivia_table.rs`, `Assigned::Layout`, read in `engine.rs::assigned_side`), whether or not it is the options' choice. A run on one line is never stored.
- **List gaps are stamps, not entries.** A list keeps its layout runs off the entries ("its source flanks spell its edges"). At render, `prepare.rs::fill_list_gaps` classifies the source text (`SourceGap`) or the snapshot geometry between items, and stamps the items' base edges at trivia strength (`set_gap_edge`). The delimiter flanks reach the render as `SourceFlank`.
- **Depth at read.** `DEPTH_REGIONS` gives the assignment, per kind, the token anchors of the stretch a template indents, for indentation depth. It stays as it is.
- **The inferred layer** (`options.rs::InferredOptions`) holds the indentation unit and the root's two edge arms, each only where the source differs from the engine's options.

## The baseline: what the options render, from the writer

The seam the options write at a gap is not one site's arm. The writer coalesces several marks there: the left kind's after edge, the template's site or fixed seam, a depth move, the right kind's before edge, a seat or a flank, all under the seam law. So the baseline is a render, never a table the read would have to merge again.

**The baseline render.** Once per tree, lazily, the engine renders the tree from its templates under the read-time options, the inferred layer over the engine's options, fixed at that moment. It does so in a recording mode of the spacing writer.
- **Depth:** the tree is read to full depth, so every node renders from its template and none as a source slice.
- **Trivia:** the render includes the tree's non-layout trivia, comments and `ERROR` entries with their `$before`/`$after`, because a line comment forces a break that would otherwise show as a false deviation. It excludes the layout entries, which are what is being derived.
- **What it records:** at each text it writes, the line breaks written since the text before.

**When it runs.** At the first need for layout entries: the trivia table's assignment, a snapshot, or a render of an edited node. Never for an untouched render, which is a source slice, or for a structure-only read.

**Keying.** The trivia table addresses a layout run by its bytes (`Assigned::Layout { start, end }`). Every run lies beside a named child or a trivia entry, since a side belongs to a child or an entry. In the baseline render, each named node's frame (`open_frame`, its origin) and each comment or `ERROR` entry carries its source span. So the breaks the render wrote in a gap are keyed by the source end byte of the frame or entry the gap follows and the source start byte of the one it precedes. A run `(start, end)` reads its baseline under either key.
- **An empty node's inner run** (`[⏎]`, an owner with no named child): keyed by the owner's frame, as the breaks written inside a frame that opened no child frame.
- **A run between two trivia entries:** keyed by the entries' spans, like any other run.
- **The file's edges:** never keyed and never stored. They stay in the inferred layer.
- **A run neither key reaches:** an error from the assignment, never a silent choice. A test over every corpus entry of the five grammars keeps the count of such runs at zero.

**The deviation test.** A run deviates when its source line breaks differ from the baseline's breaks at its key. Indentation is measured as today: only an excess over the template's depth is stored, as depth members, in the inferred indentation unit (`DEPTH_REGIONS`). A deviating run is stored as `Assigned::Layout` of its source class (`classify_whitespace`), now including an in-line class (space, tab or tight) where the baseline breaks. A run that matches stores nothing.

**Where.** `TriviaTable::assign` runs as today, then filters its layout runs against the baseline, held in a once-per-tree cell beside the table. The baseline render reads the table's non-layout entries, so the two phases do not loop.

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

- `rust/crates/sittir-core/src/trivia_table.rs`: the deviation filter after `assign`, the in-line class, the list rule retired.
- `rust/crates/sittir-core/src/options.rs`: one `classify_whitespace` use. `InferredOptions` gives the assignment its baseline.
- `rust/crates/sittir-core/src/engine.rs`: the once-per-tree baseline render and its cell; `assigned_side` takes the in-line kinds.
- `rust/crates/sittir-core/src/prepare.rs`, `slot.rs`, `layout.rs`: `fill_list_gaps` and the `gap`/`flank` facts retired.
- `rust/crates/sittir-core/src/spacing.rs`: the recording mode (breaks per gap, keyed by the frame and entry spans on either side). The stored-gap work is dropped. One change: a held line end is widened only by a mark at least as strong as the layout that holds the gap, so a stored single break after a line comment is not widened by the template's blank line (`// c⏎fn g() {}`). Today any wider break widens the floor whatever its strength.
- `packages/common/src/*`: JavaScript stops writing `$_layout.gap` and `flank`.
- `packages/tools/src/validate/read-render-parse.ts`: `selfContainedRenderInput`.
- Spec: § 1 Layout and ruling 11, restated as above.

## Tasks

1. **The baseline render**, red first. Engine tests: the recorded breaks per key for rust `fn f() {\n    x;\n}` (a break at each depth site), `fn f() { x; }` (the same breaks: the baseline is the options', not the source's), and `fn f() {} // c\nfn g() {}` (the comment's line end and the seat's blank line). An empty list's inner key. The corpus test: zero unkeyed runs in all five grammars. The baseline is not computed for an untouched render or a structure-only read.
2. **Deviations stored**, red first with the four cases: rust `fn f() { x; }` and `fn f() {} // c\nfn g() {}`, typescript `if (a) { b; }`, each in snapshot and template render, plus a built block keeping the template's breaks. Also: an enum or interface whose breaks equal the options stores nothing at its flanks and renders unchanged, and a per-call option changes a gap with no entry but not a deviating one.
3. **List gaps migrate**, in this PR, as their own commit series after task 2. The list gap and flank stamps retire, so line layout has one store when the PR lands. Red first: a rebuilt list whose items moved keeps each item's own layout. Gate: no fixture moves in this task.
4. **Detached input.** Red first: a fixture's detached input replays to the tree render for the moved kinds.
5. **Gates:** fixtures, validation, the suite, cargo and clippy, and two rows over the corpora: the baseline render's cost per tree (time and peak memory, against a plain render of the same tree) and the count of stored deviations per grammar (expected small).

## Expected fixture movement

A gap whose source equals the read-time options renders as before, so no fixture that reproduces its source today can move. A moved fixture is one with a deviating gap that a side takes: it moves to its source.
- **Expected movers:** the 67 rust and 29 typescript fixtures that the stored-gap attempt brought to their source.
- **No regressions.** The enum, tuple, interface and argument-list flanks that the attempt broke equal the options, store nothing, and stay as master renders them.
- **Not affected:** a fixture whose deviation sits at a gap no side takes (between an owner's own tokens) does not move, because no entry is stored there.

The gate lists every moved fixture with its before and after, checks that each now equals its source, and checks that `leftOutByKind` does not grow.

## Review Focus

1. A layout run the baseline cannot key: an assignment error, held at zero by the corpus test.
2. A source indented with a unit other than the engine's: depth deviations are counted in the inferred unit, and no gap stores a deviation for the unit alone.
6. A line comment beside a gap: the baseline includes it, so its forced break is not a deviation.
3. A line comment trailing a gap whose deviation is in-line: the comment's held line end still breaks the line.
4. A rebuilt list (moved, removed, inserted items): each kept item keeps its own deviations, and a changed edge drops them.
5. A detached fixture of every moved kind replays to its tree render.
