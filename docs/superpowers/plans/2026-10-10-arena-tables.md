# Arena Tables Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trivia leaves the reader's seating, the wrappers and the transports for native storage keyed by node and side, a parsed tree's table first and then built nodes' records, and the wire becomes arena records: the shared arena's step 3.

**Architecture:** Two stages on their own feature branch, `feat/arena`, after `feat/typed-reader` lands. 3a puts a parsed tree's trivia in one native table on `ParsedTree`, keyed by (node, side) and assigned by one walk at read, and the render reads a parsed tree's trivia from it and from nowhere else. 3b replaces the napi object wire with arena records, past a measured gate, and keeps each built node's trivia in its record, so the render reads trivia from native storage only.

**Tech Stack:** Rust 1.88 workspace (tree-sitter 0.26, napi-rs 3); TypeScript in `packages/common`, `packages/codegen` and `packages/tools`; vitest; the `sittir-parity-tests` integration crate.

**Specs:** `docs/superpowers/specs/2026-10-09-trivia-table-design.md` (§ 1–5, rulings in § 7) and `docs/superpowers/specs/2026-10-01-shared-arena-design.md` (§ The wire, § Trivia, ruling 6.3). A bare § in 3a is the trivia-table spec's. A gap's default spacing is the seam defaults' (`docs/superpowers/specs/2026-09-14-token-seam-defaults-design.md`, over the sites of `docs/superpowers/specs/2026-09-06-punctuation-seam-spacing-design.md`); this plan derives it from them and declares none of its own.

## Scope and sequencing

`feat/typed-reader` carries the shared arena's steps 1 and 2: the typed reader (`docs/superpowers/plans/2026-10-05-typed-reader.md`, 1a to 1c-ii) and relative coordinates (`docs/superpowers/plans/2026-10-06-relative-coordinates.md`). This plan is step 3 with both trivia tables, a feature of its own on `feat/arena` that starts after that one lands. Its stages are outlined here and detailed against master when each starts.

| PR, on `feat/arena` | Lands | Gate |
| --- | --- | --- |
| **3a** | the parsed-tree trivia table: one token walk that assigns each gap's entries to a node's side, and a native table by (node, side) on `ParsedTree`; a parsed node's `$trivia` reads and writes the table, and the render prints parsed trivia from it; snapshots take their sides from it; the reader's placement, trivia on parsed wrappers, the line-gap query, the client edited set, the query-write refusal and the ir validator lane's trivia carriers go | untouched renders and validation rows unchanged in every task, the trivia-placement census recorded; every corpus extra's owner is its tree-sitter parent, and every extra lands in one side or is counted as in none; an edited render's bytes move only where a ruling moves them |
| **3b** | the record wire: records in both directions, a parsed node's literal over its record, the derive's object codec and the napi impls gone; built nodes' trivia in their records | records match or beat napi objects on read time, one node per call and every match in one call, and on retained heap per node, and beat them on render decode, with the object wire's numbers re-taken beside the records'; then rendered bytes and validation rows unchanged |

## Global Constraints

The typed-reader plan's Global Constraints hold here too.

---

## Outline: 3a, the parsed-tree trivia table

Detailed against master after `feat/typed-reader` lands. A parsed tree's trivia leaves the reader's seating, the wrappers and the transports for one native table on `ParsedTree`, keyed by (node, side), and the render reads a parsed tree's trivia from that table and from nowhere else. The design is `docs/superpowers/specs/2026-10-09-trivia-table-design.md` (§ 1–5, rulings in § 7); the shared-arena spec's § Trivia places the tables in that design.

**Order.** `feat/typed-reader` lands first, with the refusal of a write through a query in place (the typed-reader plan's Ruling 13) and with relative coordinates' snapshots carrying the reader's placed trivia. 3a follows, and 3b, which puts built nodes' trivia in their records, lands after it. Until 3b a built node keeps its trivia on the node, and `$trivia` reads the same on parsed and built nodes. Within 3a: **Task 1 → Task 2 → Task 3 → Task 4 → Task 5.** Each task names what it retires; together they retire what the trivia-table spec's § 5 lists.

**Rulings (the maintainer, 2026-10-09 and 2026-10-10).**
1. **A gap's owner is tree-sitter's** (spec § 1): the smallest node containing tokens on both sides of it, and the root at the file's edges. The owner is derived from the gap and the tree, never stored.
2. **A comment is a value** (§ 1). Comments are still built with the grammar's comment builders (`ir.lineComment`, `ir.blockComment`, `ir.comment.*`), with their factories, coercion and sibling-lead refusals. A write stores the built node's value, and two reads of a side return equal nodes, not the same object.
3. **A built node keeps its own trivia** (§ 7.1), by side, in its record, and it travels with the node. 3b builds that; until then a built node keeps its trivia on the node.
4. **After a reparse, the assignment decides** a comment's side, not the call that wrote it (§ 7.2).
5. **Whitespace is layout only** (§ 7.3). Trivia stores line breaks, blank lines and indentation where they differ from their seam's default; spaces between tokens on a line derive from the seam defaults. Task 1 confirms the stored size under this rule.
6. **Trivia is assigned at read** (§ 1, § 2). A gap's entries go to its owner's two children beside it: those on the left token's line are the left child's `trailing`, the rest the right child's `leading`. With no left child every entry leads the right one, with no right child every entry trails the left one, and an owner with no children takes them as its `inner`. One native walk stamps the assignment, and the table is keyed by (node, side). A write replaces one node's side, so a writer that keeps a side's entries reads them and writes them back with its addition. This is not the old placement: that seated trivia on transports and the client carried it on wrappers, while here the assignment is a native fact keyed by node (§ 1).
7. **A node's trivia travels with it** (§ 3). A `$with` draft and a moved node carry their children's sides. In `{ s1(); // a⏎ // b⏎ s2(); }` with `s2` replaced, `// a` stays as `s1`'s trailing and `// b` goes with `s2`'s leading, as today.
8. **An `ERROR` node is an entry** (§ 1): a value of its kind and source text, rendered verbatim and never rebuilt by a builder. The reader treats `ERROR` as trivia today (the typed-reader plan's Global Constraints).
9. **No side is named from a parent by index** (§ 2). A node with no children (`()`, `{}`) has `inner`, the only side a parent addresses. `innerAt`, `INNER_GAPS` and the named inner gaps leave the surface. A gap whose owner has children but none beside it lies between two of the owner's own tokens (`for /*c*/ (`, `[a, b, // c⏎]`). No side takes it, and it has no guarantee: its entries render while the owner copies its source bytes, and when the owner renders from its template, the template's tokens and the seam defaults decide, so they may go.

**Terms.** Token *k* is the *k*-th token of the tree's token walk (Task 2). Gap *k* is the seam between token *k* and token *k + 1*; the gaps before the first token and after the last are the file's edges. A node's sides are its `leading`, its `trailing` and, with no children, its `inner`. A written side is edited.

**Gates for every task.**
- Untouched renders are unchanged: every render fixture, dogfood render and byte-exact read case.
- Validation rows are unchanged. The trivia-placement census measures placement, so Task 4 makes it report the table instead, and its numbers are recorded.
- A byte that moves in an edited render stops the task for review, with its sites (old, new, where). A move that a ruling makes is recorded with the ruling and does not stop the task: a comment in a gap no side takes, dropped when its owner renders from its template (ruling 9).

**Review Focus (3a).**
1. **A write beside a sibling's trivia** (`s1(); // x⏎s2();`, no separator between them). `// x` is on `s1`'s line, so it is `s1`'s trailing, and `s2.$trivia.leading(c)` replaces `s2`'s leading only: `// x` stays on `s1`. Test: Task 4.
2. **The layout a written entry renders with.** Where a write gives no whitespace, the side it was written through sets the layout, so a write through each side renders the bytes it renders today. Every existing `$trivia` write test keeps its bytes. Test: Task 4, one write per side in each of python, rust and typescript.
3. **Tokens with no node or no width.** Python's `_newline` text is a token and never an entry. A comment before typescript's automatic semicolon, or beside python's zero-width `_indent` or `_dedent`, lies in the gap the tree's order gives it and goes to the side the assignment gives that gap. Test: Task 2.
4. **A file of comments only.** The root has no children, so every entry is the root's `inner`, and the render reproduces the source. Test: Task 2 and Task 4.
5. **A write through a node a query reached.** It renders as a write through accessors does, and it survives dropping every wrapper and collecting: the registry is an identity cache, and the write is the table's. Test: Task 4.
6. **A gap no side takes.** In `for /*c*/ (…)` the comment lies between two of the `for` statement's own tokens, and in `[a, b, // c⏎]` between the trailing separator and the closer. Each is kept while its owner copies its source, and an edit that makes the owner render from its template may drop it (ruling 9). The comment after the trailing separator does not trail `b`: `b` would print it straight after its last token, before the template's `,`, as `b // c⏎, ]`, and keeping it after the separator would take special handling in rendering (spec § 7.4). In `{ /*c*/ }`, a node with no children, the comment is `inner`'s, read and written through it. Test: Task 2 (the assignment) and Task 4 (the renders).
7. **The outer node takes the side.** In `s1(); // x`, `// x` trails the statement, not the call inside it. In rust `// c⏎pub fn f() {}`, `// c` leads the function, not its visibility modifier. A write to an inner node's side leaves the outer one's. Test: Task 2 and Task 4.

The tasks:

- **Task 1: Whitespace confirmed layout only.**
  - A probe, `docs/superpowers/probes/2026-10-09-trivia-table/whitespace.mts`, with its README. It runs on every corpus entry of the five grammars and on the three arena inputs (`docs/superpowers/probes/2026-10-01-shared-arena/transport/inputs/{engine.rs,spacing.rs,create-engine.ts}`).
  - It sizes the table as ruling 5 has it, from the source, the tree and the seam defaults: per gap, the line breaks, blank lines and indentation that differ from its seam's default, with its in-line spaces derived from the seam defaults. Beside it, for the record, it sizes the table with every whitespace extra stored.
  - Each gap's default comes from the seam defaults (token-seam defaults § Decision): its two tokens' grammar-wide faces, overridden by its owner's seam preference.
  - Per grammar it reports gaps, entries, entry bytes and empty gaps under each. It also counts the in-line runs that differ from their seam's default, which an edited range re-spaces.
  - The README says what a `$trivia` read returns under the rule, against today's comments and line-break runs.
  - **Retires:** nothing. A result that contradicts the rule stops the plan for review before Task 2 stores whitespace.
- **Task 2: The trivia table on `ParsedTree`.**
  - **First, the census** (`table-census.mts`, in the same probe). For every corpus entry it records the token walk's sequence, each extra's gap, and whether the smallest node containing tokens on both sides of that gap is the extra's tree-sitter parent. The convention is the parser's own, so an extra where the two differ stops the task for review, named by grammar, kind and row. It also records the side the assignment gives each extra (ruling 6). Per grammar it counts hidden-token text between children, zero-width tokens, `ERROR` extras, the extras whose side differs from placement's (recorded: Task 4 moves them), and the extras no side takes (ruling 9), named by owner kind.
  - **The token walk.** One native function yields a node's tokens in tree order, with their byte spans:
    - its visible leaves;
    - the text a hidden token leaves between two children (python's `_newline`);
    - zero-width tokens (`MISSING` nodes, python's `_indent` and `_dedent`, typescript's automatic semicolon).

    An extra is never a token. `line_starts_inside_tokens` (1c-ii's slice re-indent) takes its tokens from this walk, so the lines that start inside a token and the gaps between tokens are one derivation (spec § 4).
  - **The table.** `ParsedTree` builds it on first need, with one walk that assigns each gap's entries (ruling 6):
    - per (node, side), its entries in source order: values of the grammar's `TriviaTransport`, an `ERROR` as its kind and source text (ruling 8), and whitespace layout only (ruling 5);
    - per node, its first and last token, so the gaps beside it and the owner's children beside a gap are lookups.

    A gap's owner is derived as the smallest node containing both its tokens, never stored. The native API takes a tree, a node and a side: the side's entries; replacing them, which marks the side edited; whether an edited side lies within a node's range. Napi exposes each by tree id, node and side.
  - **Tests**, in a grammar crate's tests, since `sittir-core` holds no grammar:
    - the file's edges: a comment before the first item leads it and one after the last trails it; a source of comments only is the root's `inner`;
    - `[a /* x */, b]`: `/* x */` trails `a`. `[a, /* y */ b]`: `/* y */` leads `b`;
    - `[a, b, // c⏎]`: between the trailing separator and the closer, no side takes `// c` (Review Focus 6);
    - `s1(); // x⏎s2();`: `// x` trails the statement, not the call; a comment on the next line leads `s2` (Review Focus 1 and 7);
    - python `x = 1  # c⏎y = 2`: `# c` trails `x = 1`, and the `_newline` text after it is no entry;
    - typescript `a // c⏎b`: the comment lies after the automatic semicolon, and trails `a`'s statement;
    - `{ /* c */ }`: the `inner` of a node with no children;
    - rust `for /* c */ x in y {}`: between two of the `for` expression's own tokens, no side takes it (Review Focus 6);
    - the census's checks, as a test over every corpus extra: its owner is its tree-sitter parent, and it lands in one side or in the counted none.
  - **Retires:** `line_starts_inside_tokens`'s own walk. Nothing else reads the table yet.
- **Task 3: The ir validator lane spells comments from the table.**
  - **Today** the lane projects a parsed tree through the grammar's builders and carries trivia across:
    - `carryTrivia` (`validate/common.ts`) copies a source node's `$_layout.trivia` onto the node built from it;
    - `carryElementTrivia` does the same for a seated element;
    - the edge-carrier rule, on the hosts branch and not yet on master, moves a seated group's trivia onto its first and last built child;
    - `seatLineGaps` (`emit/factory-source.ts`) seats line-gap whitespace for the source emitter through `lineGapsOf`.
  - **After**, the lane reads each source node's sides from the table and writes them onto the node built from it, as comment nodes built by the grammar's builders (`ir.lineComment(…)`, `ir.comment.lineComment.docOuter(…)`), through that node's `$trivia`. The assignment is the table's, so the lane moves no trivia between nodes.
  - **Tests:** the lane's rows are unchanged in all five grammars. A source with a comment on each side the assignment gives (an edge, either side of a separator, between statements, a node's `inner`) goes through the lane back to its bytes. A comment no side takes is outside the lane's guarantee (ruling 9) and is counted.
  - **Retires:** the ir validator lane's trivia carriers, `carryTrivia` and `carryElementTrivia` with the edge-carrier rule; `seatLineGaps`'s line-gap query, since it reads the table.
- **Task 4: A parsed node's trivia is the table's.**
  - **Reads:** `$trivia.leading`, `trailing` and, on a node with no children, `inner` are one native call each, over that node's side (ruling 6). The client builds each comment entry with the grammar's builders; a whitespace entry reads as its member's kind id, as today. The wrapper keeps nothing.
  - **Writes:** one native call replaces one node's side and marks it edited (ruling 6). Its side sets the layout of an entry written with no whitespace (Review Focus 2).
  - **Render:** a parsed node always crosses as its coordinate, since no write touches its storage.
    - A node with no edited side within its range renders as its source slice, and its holder prints its leading and trailing around it.
    - A node with an edited side within renders from its template and its children, read from the tree as needed. Each child's leading prints before its first token and its trailing after its last, between the template's tokens, with in-line spacing from the seam defaults (spec § 4).
    - The folded slice's re-indent stays as 1c-ii leaves it.
  - **The reader** seats nothing: it skips extras as it skips layout tokens, and the table's walk assigns them.
  - **Drafts and built holders.** A `$with` draft carries its children's sides, and a parsed node placed in a new holder carries its own and its descendants' (ruling 7). Until 3b a built holder renders a placed parsed node's sides from the node's tree.
  - **Snapshots.** Relative coordinates' `$snapshot()` lands before this plan and carries the reader's placed trivia with its `$sameLine` and `$tokensBetween` stamps. From this task each snapshot node carries its own sides from the table instead, with no stamps, and renders them with the seam defaults. The parity fixtures, which are snapshots, are rewritten through it.
  - **Tests** (python, rust, typescript):
    - the typed-reader plan's Ruling 12 defect on every route, the query route included: `# four` survives a leading write on the block;
    - after a write, the whole tree pinned exactly, and reparsed with no `ERROR`;
    - a comment between two untouched children of an edited parent;
    - a comment before a parent and its first child is the parent's leading; a write to the child's leading leaves it;
    - each side read and written through its node, and a node with no children's entries through `inner`;
    - Review Focus 1, 2, 4, 5, 6 and 7;
    - ruling 7: `{ s1(); // a⏎ // b⏎ s2(); }` with `s2` replaced in a `$with` keeps `// a` with `s1` and drops `// b` with `s2`, as today;
    - ruling 8: an `ERROR` entry renders verbatim when its owner renders from its template;
    - a rust doc comment carried with its item to a new holder, with the comments in the item's body;
    - ruling 4: a comment written to one node's side, which the assignment gives to another, is that other node's after a reparse;
    - two reads of a side are equal and are not the same object;
    - a write through a parsed holder renders through a built holder that stores the same range as a coordinate it never read.
  - **Retires:**
    - the reader's placement, which the table's walk replaces: `place()` and `Placement`, `TriviaEntry`'s `same_line` and `tokens_between`, and the `$sameLine` and `$tokensBetween` stamps with their copies (`carryPlacement` and `ENTRY_PLACEMENT_KEYS` in `transport-data.ts`, and the copy in `read-render-parse.ts`), in snapshot data too;
    - trivia on parsed wrappers: `$_layout.trivia` on a parsed node, `writtenSides`, `composedTrivia`, `readLineGaps`, `readTrivia`'s derivation, `readDerivedSides` and `lineGapsRead`;
    - the line-gap query: `lineGapsOf` on the engine, its scope and its types, napi `line_gaps_of`, `ParsedTree::line_gaps_at` and `line_gaps`;
    - the client edited set: `markIndexEdited`, `editedWithin`, and `markEditedNode`, the typed-reader plan's Ruling 10 hook (an in-place verb that lands later writes native data the render reads, as a trivia write does);
    - the client fold check (`foldedCoordinate`'s edited test, `hasOutsideTrivia`);
    - the refusal of a write through a query (`refuseUnheld`, and its use of `heldBySlot`);
    - sides named from a parent (ruling 9): `innerAt` (`GrammarInnerTriviaAt` in `packages/types`, `triviaInnerAt` in `packages/common`, the member the node-members emitter writes), `INNER_GAPS` with `emitInnerGaps`, the `innerGaps` fact and `innerGapsKeyed`, and the source emitter's `innerAt` output (`emit/factory-source.ts`), which writes each comment to the side the assignment gives it. `inner` stays, on a node with no children;
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
    - `rust/crates/sittir-core/src` holds no `place(`, `line_gaps` or `FramedTrivia`, and `TriviaEntry` carries no `same_line` or `tokens_between`;
    - `packages/tools/src` holds no `carryTrivia` or `carryElementTrivia`;
    - no source under `packages/*/src` holds `innerAt` or `INNER_GAPS`, the grammar packages' generated sources included.
  - Commit the probes and README. Open the PR with its owner's `Owner:` line first in its body, and ask brainstorm for the whole-branch review.

---

## Outline: 3b, the record wire and built nodes' trivia

Detailed against master after 3a lands.

**The record wire** (shared-arena ruling 6.3). 3b is detailed only past the gate on the record step: records must match or beat napi objects on read time, both one node per call and every match in one call, and on retained heap per node, as well as beating them on render decode. The object wire's numbers are re-taken in the engine beside the records'. The first thing the step attacks is the view's construction. In the like-for-like re-take a node over a record holds about 1.9 KB more than an object. Every form carries the same member closures, so the gap follows how V8 builds the view's literal, not the closures as such (the shared-arena spec's § The wire). At that step the derive's object codec gives way to records, and a parsed node's literal holds a reference to its record (the shared-arena spec's ruling 4).
- **String storage.** An outline item for the record-step design to settle; it is not a ruling on the mechanics.
  - Parsed leaf text has no pool. A record stores the span, and reading the text slices it from the source the engine already holds, as an untouched node renders today.
  - Built or edited leaf text goes in a per-arena string table, append-only and deduplicated, that records reference by index. A record stays fixed-size, and a repeated name (`self`, `x`) is stored once.
  - JS-side interning of `$text` strings only if the record step's gate measurements (read time, retained heap) show that napi string creation is the cost.
- **Built nodes' trivia.** A built node's trivia moves from the node into its record, by side, as the trivia-table spec's § 7.1 rules, and travels with it when it is placed. A write to a built node's side lands in its record whether or not it has a holder. A built holder keeps nothing for its children, and a parsed node placed in a built holder keeps its sides in its tree's table. The render then reads trivia from native storage only.
  - **Retires:** built-node trivia on the node (`$_layout.trivia`, `setTriviaData`, the trivia writer's client store), and `TransportLayout::trivia`, `TransportTrivia` and `TriviaEntry` with their napi decode: the render prints each side from the record or the table.
