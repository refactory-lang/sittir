# Arena Tables Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trivia leaves the reader, the wrappers and the transports for native tables keyed by gap, a parsed tree's first and then built nodes' beside their records, and the wire becomes arena records: the shared arena's step 3.

**Architecture:** Two stages on their own feature branch, `feat/arena`, after `feat/typed-reader` lands. 3a puts a parsed tree's trivia in one native table on `ParsedTree`, keyed by gap, and the render reads a parsed tree's trivia from it and from nowhere else. 3b replaces the napi object wire with arena records, past a measured gate, and gives built nodes their tables beside their records, so the render reads trivia from tables only.

**Tech Stack:** Rust 1.88 workspace (tree-sitter 0.26, napi-rs 3); TypeScript in `packages/common`, `packages/codegen` and `packages/tools`; vitest; the `sittir-parity-tests` integration crate.

**Specs:** `docs/superpowers/specs/2026-10-09-trivia-table-design.md` (§ 1–5, rulings in § 7) and `docs/superpowers/specs/2026-10-01-shared-arena-design.md` (§ The wire, § Trivia, ruling 6.3). A bare § in 3a is the trivia-table spec's. A gap's default spacing is the seam defaults' (`docs/superpowers/specs/2026-09-14-token-seam-defaults-design.md`, over the sites of `docs/superpowers/specs/2026-09-06-punctuation-seam-spacing-design.md`); this plan derives it from them and declares none of its own.

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

**Rulings (the maintainer, 2026-10-09 and 2026-10-10).**
1. **Ownership follows tree-sitter's convention for extras** (spec § 1). An extra belongs to the smallest node containing tokens on both sides of it, and to the root at the file's edges. The owner is derived from the gap and the tree, never stored.
2. **A comment is a value** (§ 1). Comments are still built with the grammar's comment builders (`ir.lineComment`, `ir.blockComment`, `ir.comment.*`), with their factories, coercion and sibling-lead refusals. A write stores the built node's value, and two reads of a gap return equal nodes, not the same object.
3. **A built node's gaps lie between its children, and its edges belong to its holder** (§ 7.1). 3b builds those tables; 3a builds none.
4. **After a reparse, the convention decides ownership**, not the call that wrote the comment (§ 7.2).
5. **Whitespace is layout only** (§ 7.3). A gap stores line breaks, blank lines and indentation where they differ from its seam's default; spaces between tokens on a line derive from the seam defaults. Task 1 confirms the table's size under this rule.
6. **Trivia are seams** (§ 1, § 2). A gap is the seam between two adjacent tokens, its owner is tree-sitter's, and it holds one value, its content. `leading` and `trailing` are a node's views of the gaps at its edges, not storage. A write through any view sets the gap's whole content, so a writer that keeps what is there reads the gap and writes it back with its addition.
7. **A `$with` draft carries the gaps its base owns** (§ 3), numbered by child as § 7.1 numbers a built node's gaps, until a write changes them. In `{ s1(); // a⏎ // b⏎ s2(); }` with `s2` replaced, both comments stay, where today `// b` goes with `s2`. Until 3b they sit on the draft, in a form 3b moves into its table without changing what renders. This brings forward a question 3b has anyway: on which side of a separator between two children a gap renders (`f(a /* x */, b)` against `f(a, /* x */ b)`, which today's `tokens_between` records).
8. **An `ERROR` node is an entry of its gap** (§ 1): a value of its kind and source text, rendered verbatim and never rebuilt by a builder. The reader treats `ERROR` as trivia today (the typed-reader plan's Global Constraints).
9. **No gap is named from a parent** (§ 2). Every gap that touches a child is reached through that child's `leading` or `trailing`. A node with no children (`()`, `{}`) has one interior gap, and `inner` is its view, the only gap a parent addresses. `innerAt`, `INNER_GAPS` and the named inner gaps leave the surface. A gap between two of a node's own template tokens with no child beside it (`for /*c*/ (`) has no view and no guarantee: its content renders while the node copies its source bytes, and when the node renders from its template, the template's tokens and the seam defaults decide, so the content may go.

**Terms.** Token *k* is the *k*-th token of the tree's token walk (Task 2). Gap *k* is the seam between token *k* and token *k + 1*; the gaps before the first token and after the last are the file's edges. A node's leading gap is the gap before its first token, and its trailing gap the gap after its last. The gaps it owns are those between its first and last token whose owner it is. A written gap is edited.

**Gates for every task.**
- Untouched renders are unchanged: every render fixture, dogfood render and byte-exact read case.
- Validation rows are unchanged. The trivia-placement census measures placement, so Task 4 makes it report the table instead, and its numbers are recorded.
- A byte that moves in an edited render stops the task for review, with its sites (old, new, where). A move that a ruling makes is recorded with the ruling and does not stop the task: Review Focus 1's replaced comment; a comment a `$with` draft keeps where today's render drops it (ruling 7); a comment in a gap between two of a node's own template tokens with no child beside it, dropped when the node renders from its template (ruling 9); and a rust doc comment that stays behind when its item moves.

**Review Focus (3a).**
1. **A write through a node whose leading gap is its previous sibling's trailing gap** (`s1(); // x⏎s2();`, no separator between them). The write replaces the one gap (§ 2), so `// x`, which placement gave `s1` as trailing, is replaced too. A writer that keeps `// x` reads the gap and writes it back with its addition. Test: Task 4.
2. **The layout a written entry renders with.** Where a write gives no whitespace, the side it was written through sets the layout, so a write through each side renders the bytes it renders today. Every existing `$trivia` write test keeps its bytes. Test: Task 4, one write per side in each of python, rust and typescript.
3. **Tokens with no node or no width.** Python's `_newline` text is a token and never an entry. A comment before typescript's automatic semicolon, or beside python's zero-width `_indent` or `_dedent`, lies in the gap the tree's order gives it. Test: Task 2.
4. **A file of comments only.** Every entry is in the leading edge, owned by the root, and the render reproduces the source. Test: Task 2 and Task 4.
5. **A write through a node a query reached.** It renders as a write through accessors does, and it survives dropping every wrapper and collecting: the registry is an identity cache, and the write is the table's. Test: Task 4.
6. **A gap no child touches.** In `for /*c*/ (…)` the comment lies between two of the `for` statement's own tokens. It renders while the statement copies its source, and an edit that makes the statement render from its template may drop it (ruling 9). In `{ /*c*/ }`, a node with no children, the comment is `inner`'s, read and written through it. Test: Task 2 (the gaps) and Task 4 (the renders).

The tasks:

- **Task 1: Whitespace confirmed layout only.**
  - A probe, `docs/superpowers/probes/2026-10-09-trivia-table/whitespace.mts`, with its README. It runs on every corpus entry of the five grammars and on the three arena inputs (`docs/superpowers/probes/2026-10-01-shared-arena/transport/inputs/{engine.rs,spacing.rs,create-engine.ts}`).
  - It sizes the table as ruling 5 has it, from the source, the tree and the seam defaults: a gap stores the line breaks, blank lines and indentation that differ from its seam's default, and its in-line spaces derive from the seam defaults. Beside it, for the record, it sizes the table with every whitespace extra stored.
  - Each gap's default comes from the seam defaults (token-seam defaults § Decision): its two tokens' grammar-wide faces, overridden by its owner's seam preference.
  - Per grammar it reports gaps, entries, entry bytes and empty gaps under each. It also counts the in-line runs that differ from their seam's default, which an edited range re-spaces.
  - The README says what a `$trivia` read returns under the rule, against today's comments and line-break runs.
  - **Retires:** nothing. A result that contradicts the rule stops the plan for review before Task 2 stores whitespace.
- **Task 2: The gap table on `ParsedTree`.**
  - **First, the census** (`table-census.mts`, in the same probe). For every corpus entry it records the token walk's sequence, each extra's gap, and whether the smallest node containing tokens on both sides of that gap is the extra's tree-sitter parent. The convention is the parser's own, so an extra where the two differ stops the task for review, named by grammar, kind and row. Per grammar it also counts hidden-token text between children, zero-width tokens, `ERROR` extras, and the extras whose owner differs from placement's (recorded: Task 4 moves them).
  - **The token walk.** One native function yields a node's tokens in tree order, with their byte spans:
    - its visible leaves;
    - the text a hidden token leaves between two children (python's `_newline`);
    - zero-width tokens (`MISSING` nodes, python's `_indent` and `_dedent`, typescript's automatic semicolon).

    An extra is never a token. `line_starts_inside_tokens` (1c-ii's slice re-indent) takes its tokens from this walk, so the lines that start inside a token and the gaps between tokens are one derivation (spec § 4).
  - **The table.** `ParsedTree` builds it on first need, with one walk:
    - per gap, its entries in source order: values of the grammar's `TriviaTransport`, an `ERROR` as its kind and source text (ruling 8), and whitespace layout only (ruling 5);
    - per node, its first and last token, so its leading and trailing gaps, the gaps it owns and, with no children, its one interior gap are lookups.

    A gap's owner is derived as the smallest node containing both its tokens, never stored. The native API takes a tree and a gap: a gap's entries; replacing them, which marks the gap edited; whether an edited gap lies in a node's range; the gaps a node owns. Napi exposes each by tree id and gap.
  - **Tests**, in a grammar crate's tests, since `sittir-core` holds no grammar:
    - both edges, owned by the root, and a source of comments only;
    - `[a /* x */, b]` and `[a, /* y */ b]`: two gaps, both owned by the array;
    - `[a, b, // c⏎]`: the gap between `,` and `]`, owned by the array;
    - a parent and its first child: one leading gap, owned by neither;
    - python `x = 1  # c⏎y = 2`: `# c` lies in the gap before the `_newline` text, which is no entry;
    - typescript `a // c⏎b`: the comment lies in the gap after the automatic semicolon;
    - `{ /* c */ }`: the one interior gap of a node with no children, owned by it;
    - rust `for /* c */ x in y {}`: a gap between two of the `for` expression's own tokens that no child touches, owned by it (Review Focus 6);
    - the census's owner check, as a test over every corpus extra.
  - **Retires:** `line_starts_inside_tokens`'s own walk. Nothing else reads the table yet.
- **Task 3: The ir validator lane spells comments from the table.**
  - **Today** the lane projects a parsed tree through the grammar's builders and carries trivia across:
    - `carryTrivia` (`validate/common.ts`) copies a source node's `$_layout.trivia` onto the node built from it;
    - `carryElementTrivia` does the same for a seated element;
    - the edge-carrier rule, on the hosts branch and not yet on master, moves a seated group's trivia onto its first and last built child;
    - `seatLineGaps` (`emit/factory-source.ts`) seats line-gap whitespace for the source emitter through `lineGapsOf`.
  - **After**, the lane reads the source table once, gap by gap. It writes each gap's comments into the built tree as comment nodes built by the grammar's builders (`ir.lineComment(…)`, `ir.comment.lineComment.docOuter(…)`), into the built owner's gap by child (ruling 7). No trivia moves from node to node. This task adds that on-node form, and Task 4's drafts use it too.
  - **Tests:** the lane's rows are unchanged in all five grammars. A source with a comment in each kind of gap (an edge, either side of a separator, between statements, before a closer) goes through the lane back to its bytes.
  - **Retires:** the ir validator lane's trivia carriers, `carryTrivia` and `carryElementTrivia` with the edge-carrier rule; `seatLineGaps`'s line-gap query, since it reads the table.
- **Task 4: A parsed node's trivia is the table's.**
  - **Reads:** `$trivia.leading`, `trailing` and, on a node with no children, `inner` are one native call each, over the gap the view names (ruling 9). The client builds each comment entry with the grammar's builders; a whitespace entry reads as its member's kind id, as today. The wrapper keeps nothing.
  - **Writes:** one native call sets a gap's whole content and marks the gap edited (ruling 6). A write through any view of the gap changes the one gap. Its side sets the layout of an entry written with no whitespace (Review Focus 2).
  - **Render:** a parsed node always crosses as its coordinate, since no write touches its storage.
    - A node with no edited gap between its first and last token renders as its source slice, and its owner prints its leading and trailing gaps around it.
    - A node with an edited gap inside renders from its children, read from the tree as needed, and each gap between them is printed from the table by its owner (spec § 4).
    - The folded slice's re-indent stays as 1c-ii leaves it.
  - **The reader** places nothing: it skips extras as it skips layout tokens.
  - **Drafts and built holders.** A `$with` draft carries the gaps its base owns, numbered by child, until a write changes them (ruling 7). A parsed node placed in a new holder carries only the gaps it owns (§ 3); its leading and trailing gaps stay in the old tree.
  - **Snapshots.** Relative coordinates' `$snapshot()` lands before this plan and carries the reader's placed trivia with its `$sameLine` and `$tokensBetween` stamps. It records its range's gaps from the table instead, and the parity fixtures, which are snapshots, are rewritten through it.
  - **Tests** (python, rust, typescript):
    - the typed-reader plan's Ruling 12 defect on every route, the query route included: `# four` survives a leading write on the block;
    - after a write, the whole tree pinned exactly, and reparsed with no `ERROR`;
    - a comment between two untouched children of an edited parent;
    - one gap read through a parent and through its first child, and a write through either changing it;
    - every gap that touches a child read and written through that child's `leading` or `trailing`, and a node with no children's one gap through `inner`;
    - Review Focus 1, 2, 4, 5 and 6;
    - ruling 7: `{ s1(); // a⏎ // b⏎ s2(); }` with `s2` replaced in a `$with` keeps both comments;
    - ruling 8: an `ERROR` in a gap renders verbatim when its owner renders from its children;
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
    - gaps named from a parent (ruling 9): `innerAt` (`GrammarInnerTriviaAt` in `packages/types`, `triviaInnerAt` in `packages/common`, the member the node-members emitter writes), `INNER_GAPS` with `emitInnerGaps`, the `innerGaps` fact and `innerGapsKeyed`, and the source emitter's `innerAt` output (`emit/factory-source.ts`), which spells such a gap through the child that touches it. `inner` stays, on a node with no children;
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
    - `packages/tools/src` holds no `carryTrivia` or `carryElementTrivia`;
    - no source under `packages/*/src` holds `innerAt` or `INNER_GAPS`, the grammar packages' generated sources included.
  - Commit the probes and README. Open the PR with its owner's `Owner:` line first in its body, and ask brainstorm for the whole-branch review.

---

## Outline: 3b, the record wire and built nodes' tables

Detailed against master after 3a lands.

**The record wire** (shared-arena ruling 6.3). 3b is detailed only past the gate on the record step: records must match or beat napi objects on read time, both one node per call and every match in one call, and on retained heap per node, as well as beating them on render decode. The object wire's numbers are re-taken in the engine beside the records'. The first thing the step attacks is the view's construction. In the like-for-like re-take a node over a record holds about 1.9 KB more than an object. Every form carries the same member closures, so the gap follows how V8 builds the view's literal, not the closures as such (the shared-arena spec's § The wire). At that step the derive's object codec gives way to records, and a parsed node's literal holds a reference to its record (the shared-arena spec's ruling 4).
- **String storage.** An outline item for the record-step design to settle; it is not a ruling on the mechanics.
  - Parsed leaf text has no pool. A record stores the span, and reading the text slices it from the source the engine already holds, as an untouched node renders today.
  - Built or edited leaf text goes in a per-arena string table, append-only and deduplicated, that records reference by index. A record stays fixed-size, and a repeated name (`self`, `x`) is stored once.
  - JS-side interning of `$text` strings only if the record step's gate measurements (read time, retained heap) show that napi string creation is the cost.
- **Built-node gap tables.** A built node's trivia moves from the node into a native table beside its record, as the trivia-table spec's § 7.1 rules. Its gaps lie between its children and its edges belong to its holder. A parsed node placed in a built holder keeps the gaps it owns in its tree's table, and the holder's table holds the gaps around it. The render then reads trivia from tables only.
  - **Retires:** built-node trivia on the node (`$_layout.trivia`, `setTriviaData`, the trivia writer's client store), `TransportLayout::trivia`, `TransportTrivia` and `TriviaEntry` with their napi decode, the side-based trivia render (`render_leading`, `render_trailing`), and 3a's interim for drafts and the ir lane (ruling 7).
  - **Open for that step:** a template can write tokens between two children (a separator, a keyword), so two gaps lie between them. Ruling 9 settles the writes: each is reached through the child it touches. What stays open is how § 7.1's numbering by child names the two, and which of them a draft's carried gap fills (`f(a /* x */, b)` against `f(a, /* x */ b)`), which today's `tokens_between` records. Also open: where a write to a built node's leading or trailing gap lives before the node has a holder.
