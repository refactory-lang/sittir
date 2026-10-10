# Arena Tables Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trivia leaves the reader, the wrappers and the transports for native tables keyed by gap, a parsed tree's first and then built nodes' beside their records, and the wire becomes arena records: the shared arena's step 3.

**Architecture:** Two stages on their own feature branch, `feat/arena`, after `feat/typed-reader` lands. 3a puts a parsed tree's trivia in one native table on `ParsedTree`, keyed by gap, and the render reads a parsed tree's trivia from it and from nowhere else. 3b replaces the napi object wire with arena records, past a measured gate, and gives built nodes their tables beside their records, so the render reads trivia from tables only.

**Tech Stack:** Rust 1.88 workspace (tree-sitter 0.26, napi-rs 3); TypeScript in `packages/common`, `packages/codegen` and `packages/tools`; vitest; the `sittir-parity-tests` integration crate.

**Specs:** `docs/superpowers/specs/2026-10-09-trivia-table-design.md` (§ 1–5, rulings in § 7) and `docs/superpowers/specs/2026-10-01-shared-arena-design.md` (§ The wire, § Trivia, ruling 6.3). A bare § in 3a is the trivia-table spec's.

## Scope and sequencing

`feat/typed-reader` carries the shared arena's steps 1 and 2: the typed reader (`docs/superpowers/plans/2026-10-05-typed-reader.md`, 1a to 1c-ii) and relative coordinates (`docs/superpowers/plans/2026-10-06-relative-coordinates.md`). This plan is step 3 with both trivia tables, a feature of its own on `feat/arena` that starts after that one lands. Its stages are outlined here and detailed against master when each starts.

| PR, on `feat/arena` | Lands | Gate |
| --- | --- | --- |
| **3a** | the parsed-tree gap table: one token walk and a native table of trivia by gap on `ParsedTree`; a parsed node's `$trivia` reads and writes the table, and the render prints parsed trivia from it; snapshots take their gaps from it; the reader's placement, trivia on parsed wrappers, the line-gap query, the client edited set, the query-write refusal and the ir validator lane's trivia carriers go | untouched renders and validation rows unchanged in every task, the trivia-placement census recorded; every corpus extra's owner is its tree-sitter parent; an edited render's bytes move only where a ruling moves them |
| **3b** | the record wire: records in both directions, a parsed node's literal over its record, the derive's object codec and the napi impls gone; built nodes' trivia tables beside their records | records match or beat napi objects on read time, one node per call and every match in one call, and on retained heap per node, and beat them on render decode, with the object wire's numbers re-taken beside the records'; then rendered bytes and validation rows unchanged |

## Global Constraints

The typed-reader plan's Global Constraints hold here too.

---

## Outline: 3a, the parsed-tree gap table

Detailed against master after `feat/typed-reader` lands. A parsed tree's trivia leaves the reader, the wrappers and the transports for one native table on `ParsedTree`, keyed by gap, and the render reads a parsed tree's trivia from that table and from nowhere else. The design is `docs/superpowers/specs/2026-10-09-trivia-table-design.md` (§ 1–5, rulings in § 7); the shared-arena spec's § Trivia places the tables in that design.

**Order.** `feat/typed-reader` lands first, with the refusal of a write through a query in place (the typed-reader plan's Ruling 13) and with relative coordinates' snapshots carrying the reader's placed trivia. 3a follows, and 3b, which gives built nodes their tables, lands after it. Until 3b a built node keeps its trivia on the node, and `$trivia` reads the same on parsed and built nodes. Within 3a: **Task 1 → Task 2 → Task 3 → Task 4 → Task 5.** Each task names what it retires; together they retire what the trivia-table spec's § 5 lists.

**Rulings (the maintainer, 2026-10-09).**
1. **Ownership follows tree-sitter's convention for extras** (spec § 1). An extra belongs to the smallest node containing tokens on both sides of it, and to the root at the file's edges. The owner is derived from the gap and the tree, never stored.
2. **A comment is a value** (§ 1). Comments are still built with the grammar's comment builders (`ir.lineComment`, `ir.blockComment`, `ir.comment.*`), with their factories, coercion and sibling-lead refusals. A write stores the built node's value, and two reads of a gap return equal nodes, not the same object.
3. **A built node's gaps lie between its children, and its edges belong to its holder** (§ 7.1). 3b builds those tables; 3a builds none.
4. **After a reparse, the convention decides ownership**, not the call that wrote the comment (§ 7.2).
5. **Whitespace is measured first** (§ 7.3): every whitespace extra stored, against layout-bearing entries only. Task 1 measures, and the maintainer picks before Task 2 stores whitespace.

**Terms.** Token *k* is the *k*-th token of the tree's token walk (Task 2). Gap *k* lies between token *k* and token *k + 1*; the gaps before the first token and after the last are the file's edges. A node's leading gap is the gap before its first token, and its trailing gap the gap after its last. Its inner gaps are the gaps between its first and last token that it owns. A written gap is edited.

**Open before the detailing** (the maintainer's, through brainstorm):
- **O1. What a `$with` result carries.** Today a draft copies its base's own trivia (`rebuilt`, through `setTriviaData`) and refuses a base that holds inner comments. Each untouched child brings the comments placement gave it. Once the reader stops placing, the comments between a base's children sit in gaps the base owns, and a built node has no table until 3b. Take `{ s1(); // a⏎ // b⏎ s2(); }` with `s2` replaced: today `// a` stays (it trails `s1`) and `// b` goes (it leads `s2`). Two readings:
  - (a) The draft carries the gaps its base owns, numbered by child as § 7.1 numbers a built node's gaps, so both comments stay. Until 3b they sit on the draft, in a form 3b moves into its table.
  - (b) The draft prints a gap of its base only between two tokens still adjacent in it (the test `sourceAdjacent` applies to whitespace today), so both comments go.

  Recommendation: (a). The base owns those comments and the draft is the base edited, so they stay until their gap is written. 3b then moves their storage without changing what renders. One question 3b has anyway comes forward: on which side of a separator between two children a gap renders (`f(a /* x */, b)` against `f(a, /* x */ b)`, which today's `tokens_between` records).
- **O2. An `ERROR` node in the table.** The reader treats `ERROR` as trivia today (the typed-reader plan's Global Constraints). Reading: it is an entry of its gap, a value of its kind and source text, rendered verbatim and never rebuilt by a builder.
- **O3. `inner`'s names.** Reading: `$trivia.inner` and `innerAt` keep today's named gaps (`INNER_GAPS`, `gap(n)`), each an owned gap between two of the node's own tokens. An owned gap beside a child is that child's `leading` or `trailing`, read through either node (§ 2). The surface does not change.

**Gates for every task.**
- Untouched renders are unchanged: every render fixture, dogfood render and byte-exact read case.
- Validation rows are unchanged. The trivia-placement census measures placement, so Task 4 makes it report the table instead, and its numbers are recorded.
- A byte that moves in an edited render stops the task for review, with its sites (old, new, where). A move that a ruling makes is recorded with the ruling: Review Focus 1, any comment O1's ruling moves, and a rust doc comment that stays behind when its item moves.

**Review Focus (3a).**
1. **A write through a node whose leading gap is its previous sibling's trailing gap** (`s1(); // x⏎s2();`, no separator between them). The write replaces the one gap (§ 2), so `// x`, which placement gave `s1` as trailing, is replaced too. Test: Task 4.
2. **The layout a written entry renders with.** Where a write gives no whitespace, the side it was written through sets the layout, so a write through each side renders the bytes it renders today. Every existing `$trivia` write test keeps its bytes. Test: Task 4, one write per side in each of python, rust and typescript.
3. **Tokens with no node or no width.** Python's `_newline` text is a token and never an entry. A comment before typescript's automatic semicolon, or beside python's zero-width `_indent` or `_dedent`, lies in the gap the tree's order gives it. Test: Task 2.
4. **A file of comments only.** Every entry is in the leading edge, owned by the root, and the render reproduces the source. Test: Task 2 and Task 4.
5. **A write through a node a query reached.** It renders as a write through accessors does, and it survives dropping every wrapper and collecting: the registry is an identity cache, and the write is the table's. Test: Task 4.

The tasks:

- **Task 1: Whitespace measured first.**
  - A probe, `docs/superpowers/probes/2026-10-09-trivia-table/whitespace.mts`, with its README. It runs on every corpus entry of the five grammars and on the three arena inputs (`docs/superpowers/probes/2026-10-01-shared-arena/transport/inputs/{engine.rs,spacing.rs,create-engine.ts}`).
  - It sizes the table two ways, from the source and the tree alone: every whitespace extra stored; and layout-bearing entries only (line breaks, blank lines, indentation), with spaces between tokens on a line derived.
  - Per grammar it reports gaps, entries, entry bytes and empty gaps under each. Under layout-only it also counts the in-line runs that are not one space, which an edited range would re-space.
  - The README says what each pick makes a `$trivia` read return, against today's comments and line-break runs.
  - **Retires:** nothing. The maintainer picks, through brainstorm, before Task 2 stores whitespace.
- **Task 2: The gap table on `ParsedTree`.**
  - **First, the census** (`table-census.mts`, in the same probe). For every corpus entry it records the token walk's sequence, each extra's gap, and whether the smallest node containing tokens on both sides of that gap is the extra's tree-sitter parent. The convention is the parser's own, so an extra where the two differ stops the task for review, named by grammar, kind and row. Per grammar it also counts hidden-token text between children, zero-width tokens, `ERROR` extras, and the extras whose owner differs from placement's (recorded: Task 4 moves them).
  - **The token walk.** One native function yields a node's tokens in tree order, with their byte spans:
    - its visible leaves;
    - the text a hidden token leaves between two children (python's `_newline`);
    - zero-width tokens (`MISSING` nodes, python's `_indent` and `_dedent`, typescript's automatic semicolon).

    An extra is never a token. `line_starts_inside_tokens` (1c-ii's slice re-indent) takes its tokens from this walk, so the lines that start inside a token and the gaps between tokens are one derivation (spec § 4).
  - **The table.** `ParsedTree` builds it on first need, with one walk:
    - per gap, its entries in source order: values of the grammar's `TriviaTransport`, with whitespace as Task 1's pick says;
    - per node, its first and last token, so its leading, trailing and inner gaps are lookups.

    A gap's owner is derived as the smallest node containing both its tokens, never stored. The native API takes a tree and a gap: a gap's entries; replacing them, which marks the gap edited; whether an edited gap lies in a node's range; the gaps a node owns. Napi exposes each by tree id and gap.
  - **Tests**, in a grammar crate's tests, since `sittir-core` holds no grammar:
    - both edges, owned by the root, and a source of comments only;
    - `[a /* x */, b]` and `[a, /* y */ b]`: two gaps, both owned by the array;
    - `[a, b, // c⏎]`: the gap between `,` and `]`, owned by the array;
    - a parent and its first child: one leading gap, owned by neither;
    - python `x = 1  # c⏎y = 2`: `# c` lies in the gap before the `_newline` text, which is no entry;
    - typescript `a // c⏎b`: the comment lies in the gap after the automatic semicolon;
    - the census's owner check, as a test over every corpus extra.
  - **Retires:** `line_starts_inside_tokens`'s own walk. Nothing else reads the table yet.
- **Task 3: The ir validator lane spells comments from the table.**
  - **Today** the lane projects a parsed tree through the grammar's builders and carries trivia across:
    - `carryTrivia` (`validate/common.ts`) copies a source node's `$_layout.trivia` onto the node built from it;
    - `carryElementTrivia` does the same for a seated element;
    - the edge-carrier rule, on the hosts branch and not yet on master, moves a seated group's trivia onto its first and last built child;
    - `seatLineGaps` (`emit/factory-source.ts`) seats line-gap whitespace for the source emitter through `lineGapsOf`.
  - **After**, the lane reads the source table once, gap by gap. It writes each gap's comments into the built tree as comment nodes built by the grammar's builders (`ir.lineComment(…)`, `ir.comment.lineComment.docOuter(…)`), where O1's ruling puts a built gap. No trivia moves from node to node.
    - Under (a), they go into the built owner's gap by child. This task adds that on-node form, and Task 4's drafts use it too.
    - Under (b), they go onto the side of the built node beside the gap: the rule placement applies today, kept in the lane until 3b.
  - **Tests:** the lane's rows are unchanged in all five grammars. A source with a comment in each kind of gap (an edge, either side of a separator, between statements, before a closer) goes through the lane back to its bytes.
  - **Retires:** the ir validator lane's trivia carriers, `carryTrivia` and `carryElementTrivia` with the edge-carrier rule; `seatLineGaps`'s line-gap query, since it reads the table.
- **Task 4: A parsed node's trivia is the table's.**
  - **Reads:** `$trivia.leading`, `trailing`, `inner` and `innerAt` on a parsed node are one native call each, over its leading, trailing or named inner gap. The client builds each comment entry with the grammar's builders; a whitespace entry reads as its member's kind id, as today. The wrapper keeps nothing.
  - **Writes:** one native call replaces a gap's entries and marks the gap edited. A write through any node that shares the gap changes the one gap. Its side sets the layout of an entry written with no whitespace (Review Focus 2).
  - **Render:** a parsed node always crosses as its coordinate, since no write touches its storage.
    - A node with no edited gap between its first and last token renders as its source slice, and its owner prints its leading and trailing gaps around it.
    - A node with an edited gap inside renders from its children, read from the tree as needed, and each gap between them is printed from the table by its owner (spec § 4).
    - The folded slice's re-indent stays as 1c-ii leaves it.
  - **The reader** places nothing: it skips extras as it skips layout tokens.
  - **Drafts and built holders** follow O1's ruling. A parsed node placed in a new holder carries its inner gaps only (§ 3); its leading and trailing gaps stay in the old tree.
  - **Snapshots.** Relative coordinates' `$snapshot()` lands before this plan and carries the reader's placed trivia with its `$sameLine` and `$tokensBetween` stamps. It records its range's gaps from the table instead, and the parity fixtures, which are snapshots, are rewritten through it.
  - **Tests** (python, rust, typescript):
    - the typed-reader plan's Ruling 12 defect on every route, the query route included: `# four` survives a leading write on the block;
    - after a write, the whole tree pinned exactly, and reparsed with no `ERROR`;
    - a comment between two untouched children of an edited parent;
    - one gap read through a parent and through its first child, and a write through either changing it;
    - Review Focus 1, 2, 4 and 5;
    - a rust doc comment left in the old tree when its item moves to a new holder, and a comment in the item's body carried with it;
    - ruling 4: a comment written through one node, which the convention gives to another, is that other node's after a reparse;
    - two reads of a gap are equal and are not the same object;
    - a write through a parsed holder renders through a built holder that stores the same range as a coordinate it never read.
  - **Retires:**
    - the reader's placement: `place()` and `Placement`, `TriviaEntry`'s `same_line` and `tokens_between`, and the `$sameLine` and `$tokensBetween` stamps with their copies (`carryPlacement` and `ENTRY_PLACEMENT_KEYS` in `transport-data.ts`, and the copy in `read-render-parse.ts`), in snapshot data too;
    - trivia on parsed wrappers: `$_layout.trivia` on a parsed node, `writtenSides`, `composedTrivia`, `readLineGaps`, `readTrivia`'s derivation, `readDerivedSides` and `lineGapsRead`;
    - the line-gap query: `lineGapsOf` on the engine, its scope and its types, napi `line_gaps_of`, `ParsedTree::line_gaps_at` and `line_gaps`;
    - the client edited set: `markIndexEdited`, `editedWithin`, and `markEditedNode`, the typed-reader plan's Ruling 10 hook (an in-place verb that lands later writes native data the render reads, as a trivia write does);
    - the client fold check (`foldedCoordinate`'s edited test, `hasOutsideTrivia`);
    - the refusal of a write through a query (`refuseUnheld`, and its use of `heldBySlot`);
    - the refusal of a coordinate a holder never read whose range holds a write (`unreadCoordinate` in `transport-data.ts`): the write is the table's, so the coordinate renders it;
    - the outside trivia a folded coordinate carries: `FramedTrivia` in `SlotValue::Coord`, `outside_trivia_from_napi`, and the framing `write_coordinate` gives a coordinate;
    - `triviaViewOf` in the validators, which read the table.
- **Task 5: Measurements and the 3a gates.**
  - In `docs/superpowers/probes/2026-10-09-trivia-table/`, against the master commit 3a is cut from, like for like: the same inputs, counts and scripts at both commits, run in a copy outside any watched tree.
    - the table's native memory and build time on the three arena inputs, against the placement read;
    - the fold's timing after one leading write on the deepest statement (1c-ii's `fold-timing.mts`);
    - the heap of an untouched whole-tree read (`measure-heap.mts`).
  - The whole-branch gates are the typed-reader plan's 1c-ii gates, and:
    - `packages/common/src` holds no `lineGapsOf`, `markIndexEdited`, `editedWithin`, `refuseUnheld`, `unreadCoordinate`, `carryPlacement` or `hasOutsideTrivia`;
    - `rust/crates/sittir-core/src` holds no `place(`, `same_line`, `tokens_between`, `line_gaps` or `FramedTrivia`;
    - `packages/tools/src` holds no `carryTrivia` or `carryElementTrivia`.
  - Commit the probes and README. Open the PR with its owner's `Owner:` line first in its body, and ask brainstorm for the whole-branch review.

---

## Outline: 3b, the record wire and built nodes' tables

Detailed against master after 3a lands.

**The record wire** (shared-arena ruling 6.3). 3b is detailed only past the gate on the record step: records must match or beat napi objects on read time, both one node per call and every match in one call, and on retained heap per node, as well as beating them on render decode. The object wire's numbers are re-taken in the engine beside the records'. The first thing the step attacks is the view's construction. In the like-for-like re-take a node over a record holds about 1.9 KB more than an object. Every form carries the same member closures, so the gap follows how V8 builds the view's literal, not the closures as such (the shared-arena spec's § The wire). At that step the derive's object codec gives way to records, and a parsed node's literal holds a reference to its record (the shared-arena spec's ruling 4).
- **String storage.** An outline item for the record-step design to settle; it is not a ruling on the mechanics.
  - Parsed leaf text has no pool. A record stores the span, and reading the text slices it from the source the engine already holds, as an untouched node renders today.
  - Built or edited leaf text goes in a per-arena string table, append-only and deduplicated, that records reference by index. A record stays fixed-size, and a repeated name (`self`, `x`) is stored once.
  - JS-side interning of `$text` strings only if the record step's gate measurements (read time, retained heap) show that napi string creation is the cost.
- **Built-node gap tables.** A built node's trivia moves from the node into a native table beside its record, as the trivia-table spec's § 7.1 rules. Its gaps lie between its children and its edges belong to its holder. A parsed node placed in a built holder keeps its inner gaps in its tree's table, and the holder's table holds the gaps around it. The render then reads trivia from tables only.
  - **Retires:** built-node trivia on the node (`$_layout.trivia`, `setTriviaData`, the trivia writer's client store), `TransportLayout::trivia`, `TransportTrivia` and `TriviaEntry` with their napi decode, the side-based trivia render (`render_leading`, `render_trailing`), and 3a's interim for drafts and the ir lane (O1).
  - **Open for that step:** a template can write tokens between two children (a separator, a keyword), and § 7.1 numbers gaps by child. So a built gap needs the side of those tokens it renders on (`f(a /* x */, b)` against `f(a, /* x */ b)`), which today's `tokens_between` records. Also open: where a write to a built node's leading or trailing gap lives before the node has a holder.
