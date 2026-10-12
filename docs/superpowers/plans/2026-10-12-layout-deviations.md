# Line Layout as Deviations from the Read-Time Options: Plan

**Goal:** a parsed tree stores, as layout entries in its trivia table, only the gaps whose source line layout differs from what the options in effect at read time render there. A gap with no entry renders as the options say. A stored deviation is the occurrence's stamp: it beats per-call options, and only `reformat` drops it. A list slot's gaps and separator are stored once per slot occurrence, and the list gap stamps retire.

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
- The baseline is computed per region, on demand, and cached on the tree. A region is computed when it is first rendered from templates; an untouched region, rendered as a source slice, is never deep-read on any path.
- A list's gap deviations are recorded at the slot level, not on each item: one entry per list-slot occurrence, rendering its existing and inserted gaps alike. A slot whose gaps match the baseline stores nothing. An item moved into another list takes the target slot's entry.
- A separator the grammar chooses per instance (typescript object type members, `,` or `;`) is a preference of the list slot (kind × slot), with the grammar's first arm as its default. A parsed occurrence's source choice is stored with the slot's entry, only where it differs from the options. Inserted items take it, and `reformat` drops it.
- A list slot's ties: a side tied between classes takes the options' class when it is among them, else the first gap's; a tie never stores what the options already give. Mixed separators follow the same rule: the majority token is the slot's separator, a tie prefers the slot's preference, else the first gap's, and an outlier separator is a per-gap choice on the item after it that beats the slot entry.
- Separator spacing: a separator chosen per instance takes its list slot's generic separator sites (kind × slot, `SEPARATOR_SPACE_BEFORE`/`AFTER`), whichever token is chosen. A slot entry's `before` and `after` are those sites' classes.
- `reformat` (per call, `reformat: true`) drops every stored source choice, both layout deviations and preference choices, and renders from the options. It lands next, in its own plan. This plan relies on it only in saying that a stored choice is dropped by `reformat` alone.

## What exists today

- **Breaks stored, in-line runs not.** The trivia table stores every run holding a line break as a layout entry (`trivia_table.rs`, `Assigned::Layout`, read in `engine.rs::assigned_side`), whether or not it is the options' choice. A run on one line is never stored.
- **List gaps are stamps, not entries.** A list keeps its layout runs off the entries ("its source flanks spell its edges"). At render, `prepare.rs::fill_list_gaps` classifies the source text (`SourceGap`) or the snapshot geometry between items, and stamps the items' base edges at trivia strength (`set_gap_edge`). The delimiter flanks reach the render as `SourceFlank`.
- **Depth at read.** `DEPTH_REGIONS` gives the assignment, per kind, the token anchors of the stretch a template indents, for indentation depth. It stays as it is.
- **The inferred layer** (`options.rs::InferredOptions`) holds the indentation unit and the root's two edge arms, each only where the source differs from the engine's options.

## The baseline: what the options render, from the writer

The seam the options write at a gap is not one site's arm. The writer coalesces several marks there: the left kind's after edge, the template's site or fixed seam, a depth move, the right kind's before edge, a seat or a flank, all under the seam law. So the baseline is a render, never a table the read would have to merge again.

**The recording render.** The engine renders a region of the tree from its templates under the read-time options (the inferred layer over the engine's options, fixed at parse), in a recording mode of the spacing writer (`baseline::Recorder`).
- **Trivia:** the render includes the region's non-layout trivia, comments and `ERROR` entries with their `$before`/`$after`, because a line comment forces a break that would otherwise show as a false deviation. It leaves out layout entries, which are what is being derived, and every write.
- **What it records:** the line breaks written between each two texts, anchored to the source as described under Keying.

### Regions

**A region is one node's own gaps.** Every gap a side takes has an owner, the smallest node holding the tokens on both sides of it (`Assigned::Layout::owner`). The gap's region is the nearest node at or above its owner that renders in a frame of its own: a node with a transport. Hidden nodes and unit kinds render inside their parent's frame, so their gaps are their parent's. Every gap therefore lies in exactly one region.

**Which node is a run's region.** The nearest node at or above the run's owner that renders in a frame of its own and writes something on both sides of the run. A node whose span starts or ends at the run's edge with nothing written on that side (python's block, which begins at the line break before its first statement) is the item beside the run in the region around it, so the walk goes on to its parent.

**Computing a region.** The engine reads the region's node at least two levels down, its transport children as coordinates below that, and renders it. It reads deeper where the run needs it: every node between the region and the run whose span starts or ends inside the run, or is empty there (typescript's automatic semicolon, which writes a line break), renders from its template, since a slice of such a node would write the run's source as its own text. Each child renders as a source slice that meets its neighbours as a rendered node does (`CoordinateEdges`), so the gaps between the node's own items are written exactly as the template writes them, and nothing inside a child is deep-read. A full-depth render of a subtree records every region in it at once. A snapshot and `reformat` render whole subtrees, so they compute their regions that way, one render per subtree.

**When a region is computed.** When the assignment's layout filter needs it: the first time a gap of that region renders from templates. That is a rebuilt node's own gaps (an edited node, and each rebuilt ancestor around it, whose gaps hold the edited node's edges), or a snapshotted or reformatted subtree. An untouched node renders as a source slice and computes nothing. A structure-only read computes nothing.

**The cache.** Each computed region's record is kept on the tree by its node's index, and no region is computed twice. Nothing invalidates it: the record is a function of the read-time tree and the read-time options, and an edit changes neither. An edit changes which gaps render from templates, never what the read-time options render at a source gap. A write to a side changes that side's entries, never the deviation stored at a gap the write did not touch.

**Wrappers that seat a child.** A generated wrapper kind that holds one content child seats that child as its content (`SEAT_WRAPPERS`, emitted per kind with the content field). A child read as a coordinate under such a wrapper meets its neighbours through the wrapper's seat, as it does when the wrapper renders from its template, so a region whose child is a wrapper records what the whole tree records.

**Gaps a zero-width token parts.** A zero-width token (an automatic semicolon, a dedent) writes no text, so the gaps on either side of it are one gap to a render. Among the runs of such a gap, the first that holds whitespace carries the layout written there, else the last (`LayoutRun::carries`); each other run reads no breaks.

**One region alone and inside its subtree agree.** A test over every corpus entry of the five grammars computes each region alone and again inside a full-depth render of the whole tree, and requires the two records to give every gap the same breaks.

### Keying

The trivia table addresses a run by its bytes (`Assigned::Layout { start, end }`). The recorder keys what it writes in two ways.
- **Anchors.** A node's frame (`open_frame`, its origin's span) and a slice of source text (a child coordinate, a comment) open at their start byte and close at their end byte. An opening resolves at the next text written: the breaks written after the text before it and before that text. A closing resolves the same way at the next text after it. A run from `start` to `end` reads the breaks written between what closes at `start` and what opens at `end`, either one standing in when only one is anchored. A trailing run the writer renders ahead of where it lands (`defer_trailing`) keeps its anchors local and places them where it is written.
- **Items.** A run beside text that no frame or slice holds has no anchor: a literal of the owner's template, a unit kind (`i32`, `True`), a presence keyword (`mut`), or a zero-width hidden token (an automatic semicolon, a python newline). Such a run reads its region's frame instead. The recorder keeps, for each frame, the items written directly in it, each with the breaks before it and by its end: each text by its text with whitespace removed, and each child frame or slice by its node's index. The engine lists the node's source items the same way: each rendered child by its index, each token with width by its text, and the children of any other child in its place. Extras and `ERROR`s are trivia and no item. The two lists are aligned in order. A child matches the next item of its index. A token matches the next text that it and the tokens right after it spell exactly, since a template literal can write several tokens at once (`()`, `not in`, `unique symbol`); the recorder keeps each text's spelling with whitespace removed, and the join takes exactly the tokens that spell it, with no cap. The writer cannot name the template element a text came from (a template writes its literals through plain `text` calls), so alignment is by spelling. An item that matches nothing was not written. The run reads the breaks between the items beside it, with the frame's open or close standing in where no item lies on a side.
- **The file's edges:** never keyed and never stored. They stay in the inferred layer.
- **A run neither way reaches:** the corpus test over the five grammars (every region computed) keeps the count of such runs at zero. At render, such a run, or one whose region's render was refused, stores its source class, so it renders as its source.

### The deviation test

A run deviates when its source line breaks differ from the baseline's breaks at its key. Indentation is measured as today: only an excess over the template's depth is stored, as depth members, in the inferred indentation unit (`DEPTH_REGIONS`). A deviating run is stored as `Assigned::Layout` of its source class (`classify_whitespace`), now including an in-line class (space, tab or tight) where the baseline breaks. A run that matches stores nothing. A list slot's separator gaps are measured per slot instead (below).

**Where.** `TriviaTable::assign` places every run except the file's edges, the in-line and empty ones included, as an `Assigned::Layout` naming its place among the table's runs (`TriviaTable::runs`); a run at a file edge keeps only its depth members. The filter runs where a side is read for a render (`ParsedTree::assigned_side`): each of the side's runs is compared with its region's record, computing the region on first need, and becomes its source class's member only when it deviates. A region's record reads the table's extras and `ERROR`s only (`WithoutLayout`), so the two never loop.

## List slots

**The slot entry.** A list-slot occurrence is a parsed node and one of its list slots (kind × slot, the owner's index and the slot's field). Its separator gaps each have two sides, before the separator and after it, each of one layout class: a line class (break, blank line) or an in-line class (space, tab, tight). For each side, the occurrence's class is the class most of its gaps have on that side. The occurrence stores one slot entry, `{ before, after, separator }`, holding only the sides whose class differs from the baseline's class at that slot's separator gaps, and the separator only where its choice differs from the slot's separator preference. A slot that matches stores nothing.

**No majority.** When two or more classes tie on a side, the slot takes the baseline's class if it is among them, else the class of the occurrence's first gap. So a tie never stores an entry the options already give, and the choice is fixed by the source.

**Outliers.** A gap whose class on a side differs from the slot's class on that side (its entry, else the baseline's) keeps a per-gap entry for that side, on the item after it, as any deviating gap does. A per-gap entry beats the slot entry. So a hand-made break in an otherwise one-line list keeps its break, and an insert next to it takes the slot's class.

**Mixed separators.** The same rule: the occurrence's separator is the one most of its gaps use, ties going to the slot's preference if it is among them, else to the first gap's. A gap whose separator differs keeps it as a per-gap choice on the item after it.

**Where it lives.** The slot entry is a fact of the trivia table, keyed by the owner's index and the slot's field, and reaches the render as the owner's layout does: a read node through its sides, a rebuilt node through `$_layout.sides` (the node it was rebuilt from). The render applies it to every separator gap of the slot, existing and inserted, at trivia strength. A per-gap entry on an item's side beats it there. An item moved into another list loses its per-gap entries at its changed edges (`changed`), so it takes the target slot's entry.

**The separator preference.** Codegen gives each list slot whose separator the grammar chooses per instance a preference key (kind × slot), its default the grammar's first arm, in the options tables beside the slot's other sites. The slot entry's separator overrides it for that occurrence.

## How the inferred layer and the deviations stay consistent

- **One baseline, computed first.** The inferred layer is computed at parse (`InferredOptions::infer`), before the trivia table, and the assignment measures against `inferred.over(engine options)`. A source whose indentation unit differs is captured once, in the layer, and depth deviations are counted in that unit.
- **No fact in two stores.** The root's edges stay in the inferred layer, and the assignment stores no entry at the file's edges. A gap's deviation is only in the trivia table.
- **Options change after read.** A deviation is measured once, against the read-time baseline. A later per-call option changes only the gaps with no entry; a stored deviation beats it. `reformat` drops every layout entry and the inferred layer's arms.

## The data shape

- **Trivia table:** `Assigned::Layout { run, start, end, depth, owner }` gains the run's place among the table's runs. It is placed for every run a side takes, and a side read turns it into a member only for a deviating gap, which may hold no line break. `engine.rs::assigned_side` turns it into a whitespace member as today (`from_layout`), extended to the in-line kinds: the grammar's `_space`/`_tab` members, and a tight deviation as the gap's zero-width member, if the grammar has one, else a stated refusal in codegen.
- **Slot entries:** `{ owner, field, before, after, separator }` per list-slot occurrence that differs (above), beside the side entries in the trivia table.
- **Retired:** `SourceGap` (`$_layout.gap`, `CoordinateWrites::gap`), `SourceFlank` (`$_layout.flank`), `fill_list_gaps`/`set_gap_edge`/`single_separator`/`geometry_list_gap`, and the list's "flanks spell its edges" assignment rule. A list's flanks become gaps of its owner's region like any other, and its separator gaps are measured per slot. JavaScript stops writing `gap` on rebuilt lists' items.
- **The writer:** the stored-gap flag goes. A deviation entry is trivia, which merges at `SEAM_TRIVIA` and beats the template's seam: an in-line entry beats a template break. A held line end stays a floor; the stored single break after a line comment holds against the template's blank line at trivia strength without a change to the floor rule. A trailing side on its owner's line that holds layout alone writes no text to defer, so it merges into the gap after its owner instead of riding a deferred run (`TransportTrivia::render_trailing`). The whitespace-token exemption is not needed. At a list slot's separator gap, the order is: a per-gap entry, else the slot entry's class for that side, else the options.
- **Snapshots and detached fixtures:** both carry the entries as trivia (`walkTrivia` keeps them), so a detached render fixture replays from its layout. A snapshot keeps every side's runs except its own node's outer ones, which face neighbours outside it (`SnapshotCtx::new`'s root). `selfContainedRenderInput` also keeps the facts a render still reads from `$_layout`, with no tree reference: today it drops `at`, `sides` and `span`. The plan checks, per kind, that a detached replay equals the tree render (the fixture gate does this for the whole corpus).

## Files

- `rust/crates/sittir-core/src/baseline.rs` (new): the recorder and a region's record.
- `rust/crates/sittir-core/src/trivia_table.rs`: every run placed (`runs`), the per-region layout filter, slot entries, the in-line class, the list rule retired.
- `rust/crates/sittir-core/src/classify.rs`: a run spelled exactly as an admitted arm is that arm before any other of its seam rank, so an in-line tab deviation is a tab, not a space.
- `rust/crates/sittir-core/src/options.rs`: one `classify_whitespace` use. `InferredOptions` gives the assignment its baseline.
- `rust/crates/sittir-core/src/engine.rs`: the region records and their cache, the item alignment; `assigned_side` takes the in-line kinds. The grammar hook that reads and renders a region (`EngineGrammar::render_read`), emitted by `packages/codegen/src/emitters/native-crate.ts`.
- `packages/codegen/src/emitters/render-options-rs.ts`: the separator preference key per list slot. Glossary: `docs/glossary/emitters.md`.
- `rust/crates/sittir-core/src/prepare.rs`, `slot.rs`, `layout.rs`: `fill_list_gaps` and the `gap`/`flank` facts retired.
- `rust/crates/sittir-core/src/spacing.rs`: the recording mode (`with_recording`, its anchors and items). The stored-gap work is dropped.
- `rust/crates/sittir-core/src/trivia.rs`: a same-line trailing side of layout alone merges into its gap. `read.rs`: a snapshot drops only its own node's outer runs.
- `packages/common/src/*`: JavaScript stops writing `$_layout.gap` and `flank`.
- `packages/tools/src/validate/read-render-parse.ts`: `selfContainedRenderInput`.
- Spec: § 1 Layout and ruling 11, restated as above.

## Tasks

1. **The region record**, red first. Tests through the native engine's diagnostic (`layoutBaseline`, each run with its baseline breaks): rust `fn f() {\n    x;\n}` (a break at each depth site), `fn f() { x; }` (the same breaks: the baseline is the options', not the source's), `fn f() {} // c\nfn g() {}` (the comment's line end and the seat's blank line), and an empty block's inner run. The corpus test: zero unkeyed runs in all five grammars. The consistency test: each region alone equals the same region inside the full-depth render. No region is computed for an untouched render or a structure-only read, and none twice.
2. **Deviations stored**, red first with the four cases: rust `fn f() { x; }` and `fn f() {} // c\nfn g() {}`, typescript `if (a) { b; }`, each in snapshot and template render, plus a built block keeping the template's breaks. Also: an enum or interface whose breaks equal the options stores nothing at its flanks and renders unchanged, and a per-call option changes a gap with no entry but not a deviating one.
3. **List slots**, in this PR, as their own commit series after task 2. The list gap and flank stamps retire, so line layout has one store when the PR lands. Red first, each in a snapshot and with an inserted item:
   - `[1,2,3]` where the options say `, `: one slot entry; an insert renders `[1,2,4,3]`.
   - `a,⏎b` against `a⏎, b`: the same break count on different sides of the separator, two different slot entries.
   - a list with one hand-made break among one-line gaps: the outlier keeps its break, the insert takes the slot's class.
   - a tie between two classes, with and without the baseline's class among them.
   - a typescript object type with `;` separators: the slot entry's separator, taken by an insert; one with mixed separators.
   - an item moved into another list takes the target's slot entry.
   Gate: no fixture moves in this task except those the slot entries bring to their source.
4. **Detached input.** Red first: a fixture's detached input replays to the tree render for the moved kinds.
5. **Gates:** fixtures, validation, the suite, cargo and clippy, and two rows over the corpora: a region's cost against its size (time and peak memory per region, by its node's byte length and item count, against a plain render of the same node), and the count of stored deviations and slot entries per grammar (expected small).

## Expected fixture movement

A gap whose source equals the read-time options renders as before, so no fixture that reproduces its source today can move. A moved fixture is one with a deviating gap that a side takes: it moves to its source.
- **Expected movers:** the 67 rust and 29 typescript fixtures that the stored-gap attempt brought to their source.
- **No regressions.** The enum, tuple, interface and argument-list flanks that the attempt broke equal the options, store nothing, and stay as master renders them.
- **Not affected:** a fixture whose deviation sits at a gap no side takes (between an owner's own tokens) does not move, because no entry is stored there.

The gate lists every moved fixture with its before and after, checks that each now equals its source, and checks that `leftOutByKind` does not grow.

## Review Focus

1. A layout run the baseline cannot key: held at zero by the corpus test; at render it keeps its source class.
2. A template literal that writes several tokens at once, or a token the template leaves out: the item alignment matches the rest and leaves only that item unwritten.
3. A source indented with a unit other than the engine's: depth deviations are counted in the inferred unit, and no gap stores a deviation for the unit alone.
4. A line comment beside a gap: the record includes it, so its forced break is not a deviation.
5. A line comment trailing a gap whose deviation is in-line: the comment's held line end still breaks the line.
6. A rebuilt list (moved, removed, inserted items): kept items keep their per-gap outliers, a changed edge drops them, and every other gap takes the slot entry.
7. A region computed alone and inside its subtree give the same breaks; the corpus test holds it.
8. A detached fixture of every moved kind replays to its tree render.
