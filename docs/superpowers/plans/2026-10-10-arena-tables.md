# Arena Tables Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trivia leaves the reader's seating, the wrappers and the transports for native storage keyed by node and side, a parsed tree's table first and then built nodes' records, and the wire becomes arena records: the shared arena's step 3.

**Architecture:** Two stages on their own feature branch, `feat/arena`, after `feat/typed-reader` lands. 3a puts a parsed tree's trivia in one native table on `ParsedTree`, keyed by (node, side) and assigned by one walk at read, and the render reads a parsed tree's trivia from it and from nowhere else. 3b replaces the napi object wire with arena records, past a measured gate, and keeps each built node's trivia in its record, so the render reads trivia from native storage only.

**Tech Stack:** Rust 1.99.0 workspace, pinned in `rust-toolchain.toml` (tree-sitter 0.26, napi-rs 3); TypeScript in `packages/common`, `packages/codegen` and `packages/tools`; vitest; the `sittir-parity-tests` integration crate.

**Specs:** `docs/superpowers/specs/2026-10-09-trivia-table-design.md` (§ 1–5, rulings in § 7) and `docs/superpowers/specs/2026-10-01-shared-arena-design.md` (§ The wire, § Trivia, ruling 6.3). A bare § in 3a is the trivia-table spec's. A gap's default spacing is the seam defaults' (`docs/superpowers/specs/2026-09-14-token-seam-defaults-design.md`, over the sites of `docs/superpowers/specs/2026-09-06-punctuation-seam-spacing-design.md`); this plan derives it from them and declares none of its own.

## Scope and sequencing

`feat/typed-reader` carries the shared arena's steps 1 and 2: the typed reader (`docs/superpowers/plans/2026-10-05-typed-reader.md`, 1a to 1c-ii) and relative coordinates (`docs/superpowers/plans/2026-10-06-relative-coordinates.md`). This plan is step 3 with both trivia tables, a feature of its own on `feat/arena` that starts after that one lands. Its stages are detailed against the code when each starts: 3a below, 3b still an outline.

| PR, on `feat/arena` | Lands | Gate |
| --- | --- | --- |
| **3a** | the parsed-tree trivia table: one token walk that assigns each gap's entries to a node's side, and a native table by (node, side) on `ParsedTree`; a parsed node's `$trivia` reads and writes the table, and the render prints parsed trivia from it; snapshots take their sides from it; the reader's placement, trivia on parsed wrappers, the line-gap query, the client edited set, the query-write refusal and the ir validator lane's trivia carriers go | untouched renders and validation rows unchanged in every task, the trivia-placement census recorded; every corpus extra's owner is its tree-sitter parent, and every extra lands in one side or is counted as in none; an edited render's bytes move only where a ruling moves them |
| **3b** | the record wire: records in both directions, a parsed node's literal over its record, the derive's object codec and the napi impls gone; built nodes' trivia in their records | records match or beat napi objects on read time, one node per call and every match in one call, and on retained heap per node, and beat them on render decode, with the object wire's numbers re-taken beside the records'; then rendered bytes and validation rows unchanged |

## Global Constraints

The typed-reader plan's Global Constraints hold here too.

---

## 3a, the parsed-tree trivia table

Detailed against `feat/typed-reader` at `5604cd7c0` (the first snapshot step merged; master `e5898a5e7`). A parsed tree's trivia leaves the reader's seating, the wrappers and the transports for one native table on `ParsedTree`, keyed by (node, side), and the render reads a parsed tree's trivia from that table and from nowhere else. The design is `docs/superpowers/specs/2026-10-09-trivia-table-design.md` (§ 1–5, rulings in § 7); the shared-arena spec's § Trivia places the tables in that design.

**Branch.** `feat/arena`, cut from `feat/typed-reader` once the first snapshot step (Tasks 1, 9, 10 and 11a of the relative-coordinates plan) has merged into it. Each task is a commit series on `feat/arena`, and the stage is one PR into `feat/typed-reader`. `feat/typed-reader` is merged in when it moves, never rebased.

**Order.** `feat/typed-reader` holds the refusal of a write through a query (the typed-reader plan's Ruling 13) and the snapshot step's `$snapshot()`, which carries the reader's placed trivia. 3a replaces both. 3b, which puts built nodes' trivia in their records, lands after it; until then a built node keeps its trivia on the node, and `$trivia` reads the same on parsed and built nodes. Within 3a: **Task 1 → Task 2 → Task 3 → Task 4 → Task 5.** Each task names what it retires; together they retire what the trivia-table spec's § 5 lists. The relative-coordinates plan's Tasks 11b, 11c and 12 follow 3a and read from its table.

### Prior art reused

Each prototype and measurement the arena steps already hold, and what 3a takes from it.

1. **The uncommitted revision of the shared-arena spec's "The transport declaration"** (`scratchpad/wt-arena-transport`, 44 lines added and 28 removed against `26d0bface`). **Superseded; retire the worktree.** Master's spec already carries its contract, from `dd77bcb62` and `42ab277c7` on:
   - per-choice transport enums;
   - the slot's type stating admission and storage (a unit variant a fixed literal stored as its kind id, a variant with a transport a node);
   - no `store = …` or `members = […]`.

   Master goes further: a presence slot is `Option<bool>` with `presence = kind::…`, where the revision has an `Option` of a one-literal choice, and blank arms are added. The derive matches master: slots carry `field = …` only, and the presence slots are `Option<bool>` (rust 30, typescript 41, python 9).

   One clause of master's spec is not implemented yet: "a choice is declared once for its content". The generated crates declare 38 choices twice or more by content: rust 3, typescript 32 (four identical `…TerminatorTransportSlot` enums among them), python 3. That is codegen's to fix, not 3a's. It is recorded for the record step (3b), where a record's layout is stamped per choice and a duplicate would stamp twice.
2. **`docs/superpowers/probes/2026-10-01-shared-arena/` and `docs/superpowers/probes/2026-10-02-layout-table/`.**
   - **Reused by 3a:**
     - `transport/inputs/` is Task 1's and Task 5's input set.
     - `transport/measure-heap.mts` is Task 5's heap probe.
     - `timing/idle.sh` gates every timed run in Task 5.
     - `transport/layout-rounds.sh` and `layout-report.py` run Task 5's like-for-like rounds.
     - From the layout-table probe, `statement-runs.mts` (blank lines within and between statement runs) is the method Task 1's blank-line count follows.
   - **For 3b, not 3a:**
     - the `2026-10-01/arena-proto` tree-image prototype, with its view and encoder;
     - `transport/proto/`, the transport-macro probe;
     - the boundary measurements;
     - the construction and node-member probes;
     - `codec/`, which 1b's derive codec already replaced;
     - `stack/`, which is the typed reader's settled gate.
   - **Not trivia at all:** the layout table proper (line breaking at a width). It does not apply to 3a.
3. **`scratchpad/arena-baseline/`** holds the original measurement tools: kept, never promoted. Its scripts are the originals of the committed `2026-10-01/` copies, which differ only in their paths. Its two issue drafts are settled: the live-tree table (closed) and node members. 3a uses the committed copies.
4. **The parked `feat/relative-spans`** (`scratchpad/wt-relspan-impl`, 19 commits ahead of master).
   - **Already used** by the snapshot step: `cf34dc2f4` (geometry for detached lists, root edges and trivia joins), `b9ea951f6` and `db61f58ce` (`$cst()` through the handle).
   - **Reused by 3a:**
     - `b22fede4c`'s render reads same-line from rows (an entry's span against its owner's) in place of `$sameLine` and `$tokensBetween`. This is the method by which Task 4 renders table sides with no stamps.
     - Its `trivia-sources.ts` and `trivia-probes.test.ts` cases join Task 4's tests.
   - **Superseded:**
     - `b22fede4c`'s closing gap and `9784c3a67`'s `closingGap` stamp. Ruling 9 gives the comment in `[a, b, // c⏎]` no side.
     - `81f33bd6a`'s per-node handles. The typed reader names a node by (tree, index), and the table is keyed by that index.
     - `4e78426b9`'s `$detach()`, which `$snapshot()` replaces.
   - **Not ported:** `bed56e9db`'s `trace-rt` tool, which replays a named corpus entry. It is ported only if Task 4's debugging needs it.
5. **Standing record-step context.**
   - **Ruling 3's gate stands for 3b.** Records must match or beat napi objects on read time and retained heap, and win on render decode. Like for like, records lost the read (4.8/5.0 µs against 4.5/4.3) and held about 1.9 KB more per node.
   - **The maintainer's eager-built-records option** is to be measured against ruling 5. So nothing in 3a requires document order or contiguous subtree ranges of built records:
     - the table, its written sides and its edited test are a parsed tree's, keyed by descendant index within that tree;
     - a built node's trivia stays on the node until 3b;
     - the render asks a coordinate's tree for its sides, never a built holder.

### Corrections found while detailing

- `refuseUnheld` (`packages/common/src/utils.ts`) tests `reachedByAccessors`; no `heldBySlot` exists. Task 4 retires `reachedByAccessors`'s use in it.
- **The snapshot step added reads of the placed trivia that Task 4 moves to the table:**
  - `snapshotIn` (`packages/common/src/snapshot.ts`) asks `editedWithin`;
  - `ReadCtx::entry` (`read.rs`) copies `same_line` and `tokens_between` onto snapshot entries;
  - `Layout::snapshot_edge`, `Layout::snapshot_inner` and `prepare::outermost` read the spans of a node's entries.

  The last three stay as they are, reading the spans of the table's entries.
- The toolchain is pinned to 1.99.0 (`rust-toolchain.toml`).
- The live render drops the line break a line comment holds at the end of a render in two shapes: rust `\n//! doc` (a root's inner comment after a break) and python `x = 1 # c` (a same-line trailing comment). It writes the break in rust `//! doc`, `fn main() {}\n// end`, `fn main() {} // end` and python `# c`, `x = 1\n# c`. Ruling 10 settles it: the render reproduces each source, writing no break at the end of a document whose source has none. Task 4's tests pin all seven shapes, each in each grammar where the probe shows it.
- **The snapshot census's whitespace remainder** (classified in `docs/superpowers/probes/2026-10-09-relative-coordinates/census-classes/`) is in-line spacing, layout inside a template, and layout beside a comment. The last two are this plan's.
  - Task 1 counts one case the outline did not: a break the seam default writes that the source omits (`async { let x = 10; }` on one line). Under ruling 11 it needs no entry: a parsed tree's table stores the source's line layout, and a seam with no entry stays on one line.
  - Task 2's census counts the gaps no side takes (ruling 9), which a snapshot renders with the seam defaults.

- **The trailing-separator comment has no side in typescript only.** In rust and python the elements and their trailing separator are one list node (`arguments_elements`, `collection_elements`), so in `[a, b, // c⏎]` the comment trails that node and renders after the separator. Ruling 9's example holds for typescript's `array`, whose elements are its own children.

### Interfaces

Shared by Tasks 2–4. `TriviaSide` is new, in `sittir-core/src/trivia_table.rs`:

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum TriviaSide { Leading, Trailing, Inner }

/// One token of the walk, by its bytes and the node it is (a leaf) or belongs
/// to (hidden text or a node edge, `own`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Token { pub start: u32, pub end: u32, pub node: u32, pub own: bool }

/// An entry the assignment gives a side: an extra or an `ERROR` by its
/// descendant index, or a run of whitespace holding a line break by its bytes.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Assigned { Extra(u32), Error(u32), Layout { start: u32, end: u32 } }

pub struct TriviaTable {
    sides: std::collections::BTreeMap<(u32, TriviaSide), Vec<Assigned>>,
    /// The extras no side takes (ruling 9), by descendant index.
    unowned: Vec<u32>,
}

/// The walk under one node: its tokens and its entries, in source order.
pub struct Walk { pub tokens: Vec<Token>, pub entries: Vec<u32>, /* … */ }
impl Walk { pub fn span(&self, index: u32) -> (u32, u32); }

pub fn walk(node: tree_sitter::Node<'_>, index: u32, source: &str) -> Walk;
pub fn tokens(tree: &tree_sitter::Tree, source: &str, index: u32) -> Vec<Token>;

impl TriviaTable {
    pub fn assign(tree: &tree_sitter::Tree, source: &str) -> Self;
    pub fn side(&self, index: u32, side: TriviaSide) -> &[Assigned];
    pub fn unowned(&self) -> &[u32];
}
```

A layout entry keeps its bytes, and the read of a side classifies it into its whitespace member (`ParsedTree::layout_kind`, the grammar's layout kinds that hold a break, by seam rank). The grammar's trivia type builds it: `FromTriviaText` gains `fn from_layout(kind: KindId) -> Option<Self>`, which codegen emits beside `TriviaSeam` from the same whitespace members.

`ParsedTree<G>` holds the table and the written sides. `EngineGrammar` gains `type Trivia` (the grammar's `TriviaTransport`) and `fn whitespace(self) -> (&'static WhitespaceTable, &'static [u16])`, so the engine macro takes neither the whitespace table nor the layout kinds:

```rust
trivia: std::sync::OnceLock<TriviaTable>,
written: std::collections::BTreeMap<(u32, TriviaSide), Vec<TriviaEntry<G::Trivia>>>,

pub fn trivia_table(&self) -> &TriviaTable;                                    // built on first need
pub fn trivia_side(&self, index: u32, side: TriviaSide) -> Vec<TriviaEntry<G::Trivia>>; // written, else assigned
pub fn write_trivia_side(&mut self, index: u32, side: TriviaSide, entries: Vec<TriviaEntry<G::Trivia>>);
pub fn edited_within(&self, index: u32, own_sides: bool) -> bool;            // a written key in the node's range
pub fn layout_kind(&self, run: &str) -> Option<u16>;
```

`edited_within` looks for a written key with an index in `[index, index + descendant_count]`. A key at `index` itself counts only for `Inner`, unless `own_sides` is set. It is a range query over `written`'s keys, which is why `written` is a `BTreeMap`. Napi exposes each operation by tree id: `triviaSide(treeId, index, side)`, `writeTriviaSide(treeId, index, side, entries)` and `editedWithin(treeId, index, ownSides)`. The engine macro reads the grammar's trivia type from `EngineGrammar`. In `packages/common`, `TreeHandle` gains `triviaSide`, `writeTriviaSide` and `editedWithin`.

The render reaches the table through `SourceTable`:

```rust
fn sides(&self, coord: &NodeCoordinate) -> Option<Box<dyn FramedTrivia>>;   // the node's leading, trailing and inner
fn edited_within(&self, coord: &NodeCoordinate) -> bool;
fn read_ctx(&self, tree: u32) -> Option<(&tree_sitter::Tree, ReadCtx<'_>)>;
```

`Prepare` gains `fn read_coordinate(tree: &tree_sitter::Tree, ctx: &ReadCtx<'_>, index: u32) -> Option<Result<Self, ReadError>> where Self: Sized` (default `None`). The derive implements it for every transport it implements `ReadTransport` for, as a read of depth 1.

### Rulings (the maintainer, 2026-10-09 and 2026-10-10)

1. **A gap's owner is tree-sitter's** (spec § 1): the smallest node containing tokens on both sides of it, and the root at the file's edges. The owner is derived from the gap and the tree, never stored.
2. **A comment is a value** (§ 1). Comments are still built with the grammar's comment builders (`ir.lineComment`, `ir.blockComment`, `ir.comment.*`), with their factories, coercion and sibling-lead refusals. A write stores the built node's value, and two reads of a side return equal nodes, not the same object.
3. **A built node keeps its own trivia** (§ 7.1), by side, in its record, and it travels with the node. 3b builds that; until then a built node keeps its trivia on the node.
4. **After a reparse, the assignment decides** a comment's side, not the call that wrote it (§ 7.2).
5. **Whitespace is layout only** (§ 7.3). Trivia stores line breaks, blank lines and indentation; spaces between tokens on a line derive from the seam defaults, and an in-line run is never stored. A parsed tree stores the source's line layout (ruling 11), and built and written content takes the seam defaults. Task 1 measures the stored size.
6. **Trivia is assigned at read** (§ 1, § 2). A gap's entries go to its owner's two children beside it: those on the left token's line are the left child's `trailing`, the rest the right child's `leading`. With no left child every entry leads the right one, with no right child every entry trails the left one, and an owner with no children takes them as its `inner`. One native walk stamps the assignment, and the table is keyed by (node, side). A write replaces one node's side, so a writer that keeps a side's entries reads them and writes them back with its addition. This is not the old placement: that seated trivia on transports and the client carried it on wrappers, while here the assignment is a native fact keyed by node (§ 1).
7. **A node's trivia travels with it** (§ 3). A `$with` draft and a moved node carry their children's sides. In `{ s1(); // a⏎ // b⏎ s2(); }` with `s2` replaced, `// a` stays as `s1`'s trailing and `// b` goes with `s2`'s leading, as today.
8. **An `ERROR` node is an entry** (§ 1): a value of its kind and source text, rendered verbatim and never rebuilt by a builder. The reader treats `ERROR` as trivia today (the typed-reader plan's Global Constraints).
9. **No side is named from a parent by index** (§ 2). A node with no children (`()`, `{}`) has `inner`, the only side a parent addresses. `innerAt`, `INNER_GAPS` and the named inner gaps leave the surface. A gap whose owner has children but none beside it lies between two of the owner's own tokens (`for /*c*/ (`, `[a, b, // c⏎]`). No side takes it, and it has no guarantee: its entries render while the owner copies its source bytes, and when the owner renders from its template, the template's tokens and the seam defaults decide, so they may go.
10. **The held break protects following text; at the document's end there is none** (the maintainer, 2026-10-10). The stored line layout (ruling 11) wins at the end of a document, so no held break is written after an entry that ends the document, a trailing line comment included. The rule is the held break's (`LineHold::Terminated`), not a case for line comments: it holds a break for the text after it, and none follows. A source with no final break renders with none. A source that ends in a break keeps it as its stored layout.
11. **A parsed tree's table stores the source's line layout** (the maintainer, 2026-10-10). Every gap whose source run holds a break stores its breaks, blank lines and indentation, whether or not they equal the seam's default. An in-line run is never stored. For a parsed node rendered from its template, a seam with no entry stays on one line. The seam defaults apply only to built and written content. Whether a run equals its seam's default is known only to a template render, while the source's line layout is known at read. Task 1 records the cost: per set, the entries and bytes this stores against storing only the gaps whose layout differs from their seam default.

**Terms.** Token *k* is the *k*-th token of the tree's token walk (Task 2). Gap *k* is the seam between token *k* and token *k + 1*; the gaps before the first token and after the last are the file's edges. A node's sides are its `leading`, its `trailing` and, with no children, its `inner`. A written side is edited.

**Gates for every task.**
- Untouched renders are unchanged: every render fixture, dogfood render and byte-exact read case.
- Validation rows are unchanged, compared by number (`validate:history`). The trivia-placement census measures placement, so Task 4 makes it report the table instead, and its numbers are recorded.
- A byte that moves in an edited render stops the task for review, with its sites (old, new, where). A move that a ruling makes is recorded with the ruling and does not stop the task: a comment in a gap no side takes, dropped when its owner renders from its template (ruling 9).
- `cargo test --workspace --no-default-features`, clippy (`--workspace --no-default-features --all-targets -D warnings`), the full vitest suite, type-check, lint and `scripts/comment-slop-check.sh --working`.

**Review Focus (3a).**
1. **A write beside a sibling's trivia** (`s1(); // x⏎s2();`, no separator between them). `// x` is on `s1`'s line, so it is `s1`'s trailing, and `s2.$trivia.leading(c)` replaces `s2`'s leading only: `// x` stays on `s1`. Test: Task 4.
2. **The layout a written entry renders with.** Where a write gives no whitespace, the side it was written through sets the layout, so a write through each side renders the bytes it renders today. Every existing `$trivia` write test keeps its bytes. Test: Task 4, one write per side in each of python, rust and typescript.
3. **Tokens with no node or no width.** Python's `_newline` text is a token and never an entry. A comment before typescript's automatic semicolon, or beside python's zero-width `_indent` or `_dedent`, lies in the gap the tree's order gives it and goes to the side the assignment gives that gap. Test: Task 2.
4. **A file of comments only.** The root has no children, so every entry is the root's `inner`, and the render reproduces the source. Test: Task 2 and Task 4.
5. **A write through a node a query reached.** It renders as a write through accessors does, and it survives dropping every wrapper and collecting: the registry is an identity cache, and the write is the table's. Test: Task 4.
6. **A gap no side takes.** In `for /*c*/ (…)` the comment lies between two of the `for` statement's own tokens, and in typescript's `[a, b, // c⏎]` between the trailing separator and the closer. Each is kept while its owner copies its source, and an edit that makes the owner render from its template may drop it (ruling 9). The comment after the trailing separator does not trail `b`: `b` would print it straight after its last token, before the template's `,`, as `b // c⏎, ]`, and keeping it after the separator would take special handling in rendering (spec § 7.4). In `{ /*c*/ }`, a node with no children, the comment is `inner`'s, read and written through it. Test: Task 2 (the assignment) and Task 4 (the renders).
7. **The outer node takes the side.** In `s1(); // x`, `// x` trails the statement, not the call inside it. In rust `// c⏎pub fn f() {}`, `// c` leads the function, not its visibility modifier. A write to an inner node's side leaves the outer one's. Test: Task 2 and Task 4.

### Task 1: Whitespace confirmed layout only

**Files:**
- Create: `docs/superpowers/probes/2026-10-09-trivia-table/whitespace.mts`, `README.md`.

**The probe.** For every corpus entry of the five grammars, and for the three arena inputs (`docs/superpowers/probes/2026-10-01-shared-arena/transport/inputs/{engine.rs,spacing.rs,create-engine.ts}`), it lines up the source's tokens with those of a **default render**. The default render is the entry's snapshot with every `span` removed (`snapshotOf`, then a copy without `span` keys), so every gap renders with its seam default. Both texts are parsed, and their token walks are compared gap by gap. A default render that does not reparse to the same token sequence is counted and skipped.

**Per gap**, the probe compares the source's whitespace with the default's:
- line breaks;
- blank lines;
- indentation, as the last line's leading run;
- the in-line run where neither text breaks.

Each gap that differs is classed:
- (a) a break the source has and the default does not;
- (b) a break the default has and the source does not: the case the census found;
- (c) a different count of blank lines;
- (d) a different indentation;
- (e) an in-line run only.

**Report.** Per grammar:
- gaps, and the gaps of each class;
- entries and entry bytes with every run that holds a break stored, one layout entry each (ruling 11), and class (e) derived;
- beside it, the same with only classes (a)–(d) stored, the gaps whose layout differs from their seam default, and with every whitespace run stored;
- empty gaps under each.

The README says what a `$trivia` read returns under the rule (comments and stored line layout, no in-line spaces) against what it returns today.

Under ruling 11 the table stores every run that holds a break, and class (b) needs no entry: a seam with none stays on one line. **Stops the plan:** a gap whose source layout the stored entries cannot reproduce. It goes to the maintainer before Task 2 stores whitespace.

**Results** (at `feat/arena` `4f075c84b`, `docs/superpowers/probes/2026-10-09-trivia-table/README.md`). Every source aligned. Entries and bytes stored:

| set | gaps | the differing gaps only (classes (a)–(d)): entries | bytes | ruling 11 (the source's line layout): entries | bytes | every run stored: entries | bytes |
|---|---|---|---|---|---|---|---|
| rust corpus | 4862 | 410 | 794 | 873 | 1724 | 2464 | 3316 |
| typescript corpus | 3980 | 362 | 802 | 679 | 1373 | 2327 | 3022 |
| python corpus | 3700 | 297 | 688 | 763 | 1962 | 1744 | 2954 |
| scm corpus | 780 | 90 | 212 | 130 | 252 | 311 | 433 |
| regex corpus | 473 | 21 | 21 | 21 | 21 | 21 | 21 |
| `engine.rs` | 2944 | 198 | 2101 | 436 | 3633 | 1216 | 4572 |
| `spacing.rs` | 8840 | 385 | 4465 | 1177 | 11536 | 2970 | 13572 |
| `create-engine.ts` | 2160 | 202 | 593 | 227 | 628 | 917 | 1318 |

Ruling 11 stores about twice the differing gaps alone, in one gap in five to eight, and well under every run.

**Retires:** nothing.

### Task 2: The trivia table on `ParsedTree`

**Files:**
- Create: `rust/crates/sittir-core/src/trivia_table.rs` (`tokens`, `TriviaTable`, `TriviaSide`, `Assigned`); `rust/crates/sittir-parity-tests/tests/trivia_table.rs`; `docs/superpowers/probes/2026-10-09-trivia-table/table-census.mts`.
- Modify:
  - `rust/crates/sittir-core/src/lib.rs` (`pub mod trivia_table;`);
  - `engine.rs`: `ParsedTree` gains the table, `written`, `trivia_side`, `write_trivia_side` and `edited_within`. `line_starts_inside_tokens` takes its tokens from `tokens`.
  - `napi_engine.rs`: the three methods, and the macro's trivia type.
  - the engine macro's invocation in `packages/codegen/src/emitters/` (the emitter that writes each grammar crate's `napi_engine!` call), plus its glossary entry.

**Step 1: the census, first.** `table-census.mts` runs on every corpus entry, through a probe-only napi call `tableCensus(treeId)` that returns the token walk, each extra's gap, its owner and its side. It records:
- whether the smallest node containing tokens on both sides of each extra's gap is the extra's tree-sitter parent;
- the side the assignment gives each extra (ruling 6).

Per grammar it counts:
- hidden-token text between children;
- zero-width tokens;
- `ERROR` extras;
- extras whose side differs from the reader's placement;
- extras no side takes, named by owner kind.

An extra whose owner is not its tree-sitter parent stops the task for review, named by grammar, kind and row.

**Step 2: the failing tests** in `trivia_table.rs`. Each test parses through a grammar crate and asserts the assignment by descendant index. Name, then expectation:
- `a_comment_before_the_first_item_leads_it_and_one_after_the_last_trails_it` (rust `// a⏎fn f() {}⏎// b⏎`);
- `a_source_of_comments_only_is_the_roots_inner` (rust `\n\n// only\n\n`, python `\n# only\n`);
- `a_comment_before_a_separator_trails_the_item_before_it` (`[a /* x */, b]`) and `…_after_a_separator_leads_the_item_after_it` (`[a, /* y */ b]`);
- `a_comment_between_a_trailing_separator_and_the_closer_is_unowned` (typescript `x = [a, b, // c⏎];`);
- `a_comment_after_a_trailing_separator_trails_the_list_node_holding_the_separator` (rust `[a, b, // c⏎]`, python `[a, b, # c⏎]`: the element list node ends with the trailing separator, so the comment trails it);
- `a_comment_on_a_statements_line_trails_the_statement_not_the_call` (`s1(); // x⏎s2();`), with the next line's comment leading `s2`;
- `python_newline_text_is_layout_and_never_an_entry` (`x = 1  # c⏎y = 2`);
- `a_comment_after_a_blocks_last_statement_trails_it` (python `if a:⏎    b⏎    # c⏎d`: `# c` trails `b`, not the block's `inner`);
- `a_comment_before_an_automatic_semicolon_trails_the_expression` (typescript `a // c⏎b`: the automatic semicolon is inserted at the line break, after the comment, so the comment trails `a` inside its statement);
- `a_childless_nodes_comment_is_its_inner` (`{ /* c */ }`);
- `a_comment_between_two_of_a_for_statements_own_tokens_is_unowned` (typescript `for /* c */ (;;) {}`: `for` and `(` are both the statement's own tokens; in rust `for /* c */ x in y {}` the pattern `x` is a child beside the gap, and the comment leads it);
- `a_line_break_run_is_layout_on_the_side_its_gap_goes_to`: rust `fn f() {}⏎⏎fn g() {}` gives `g`'s leading one `Layout` of the blank-line member;
- `a_one_line_block_stores_no_layout` (rust `fn f() { a(); b(); }`): no side under the block holds a `Layout` entry;
- `line_starts_inside_tokens_is_unchanged`: the existing tests of `line_starts_inside_tokens` pass on the token walk;
- `every_extra_of_the_probe_inputs_lands_in_one_side_or_is_unowned` (`engine.rs`, `spacing.rs`); over every corpus entry, the census checks it.

Run `cargo test -p sittir-parity-tests --no-default-features --test trivia_table`. Expected: FAIL, since `sittir_core::trivia_table` does not resolve.

**Step 3: the token walk.** `tokens` yields in tree order:
- every leaf (a node with no children that is not an extra or an `ERROR`);
- every stretch of non-whitespace text between two children that no child covers (hidden-token text). Whitespace between children is never a token: whitespace is layout only, so python's `_newline` is a gap's line break, not a token;
- every zero-width leaf (`MISSING`, typescript's automatic semicolon);
- a zero-width token at each node edge that reaches past the node's own first or last token. This is how the walk reads a hidden external token that is no node (python's `_indent` and `_dedent`): tree-sitter extends the node it bounds over the extras up to it. The fact is the tree's geometry (a node's span past its own tokens), not a kind name, so the walk keeps tree-sitter's ownership: without it, nine python comments at a block's edge have an owner other than their tree-sitter parent (Step 1's census).

`line_starts_inside_tokens` keeps its contract and reads these tokens.

**Step 4: the assignment.** One walk over the tokens and extras in source order. Each gap's entries are its extras, and the layout runs between them that hold a break (ruling 11), each classified by `layout` into the whitespace member it reads as. An in-line run is no entry. The owner of gap *k* is the smallest node containing tokens *k* and *k + 1*, and at the file's edges the root. Within the owner, the child ending at token *k* is the left child and the child starting at token *k + 1* the right child. The entries go by ruling 6:
- an entry on token *k*'s row goes to the left child's `trailing`;
- the rest go to the right child's `leading`;
- with no left child, all lead the right; with no right child, all trail the left. A comment on its own line after a block's last statement, before the block's dedent, has the statement as its left child and no right child (the right token is the block's own edge token), so it trails the statement and renders inside the block at its indent. The owner's `inner` takes entries only when the owner has no children. The census counts five such python entries;
- an owner with no children takes them as its `inner`;
- an owner with children but none beside the gap takes none, and the extra goes to `unowned`.

The outer node takes the side (Review Focus 7): when several nodes end at token *k*, the left child is the outermost of them below the owner, and likewise on the right. It is the owner's child on the token's chain of parents, ending (or starting) where the token does.

**Step 5: on `ParsedTree`.** The table is built on the first `trivia_side` or `edited_within`, in a `OnceLock` like `lines`.
- `trivia_side` returns the written entries when the side is written. Otherwise it returns the assigned ones as values:
  - an extra read into `G::Trivia` through its transport;
  - an `ERROR` as its kind and source text (ruling 8);
  - a layout run as its member's unit variant.
- `write_trivia_side` replaces the side in `written`.

Run the tests: PASS. The workspace gates are unchanged, since nothing reads the table yet.

**Step 6: napi and the client handle.** Add `triviaSide`, `writeTriviaSide` and `editedWithin` to the engine macro, and to `TreeHandle` in `packages/common/src/read.ts` and `engine.ts`. Then `packages/common/tests/trivia-table.test.ts`:
- a parsed tree's `triviaSide(index, 'leading')` returns the comment entry the Rust test expects;
- `writeTriviaSide` makes `editedWithin(parentIndex, false)` true and `editedWithin(siblingIndex, false)` false.

Run vitest on that file: FAIL first, then PASS.

**Commit:** `feat(core): the trivia table assigns each gap's entries to a node's side`, plus the census probe's commit.

**Retires:** `line_starts_inside_tokens`'s own walk. Nothing else reads the table yet.

### Task 3: The ir validator lane spells comments from the table

**Files:**
- Modify:
  - `packages/tools/src/validate/common.ts`: `buildWithFactory`, `nodeToConfig`'s element path; `carryTrivia` and `carryElementTrivia` go.
  - `packages/tools/src/emit/factory-source.ts`: `seatLineGaps` goes, and `triviaSuffix` reads sides.
  - their glossary entries in `docs/glossary/packages-tools-src-*.md`.
- Test: `packages/tools/src/validate/__tests__/ir-lane-trivia.test.ts`.

**Today:**
- `carryTrivia` copies a source node's `$_layout.trivia` onto the node built from it;
- `carryElementTrivia` does the same for a seated element;
- `seatLineGaps` seats line-gap whitespace for the source emitter through `lineGapsOf`;
- the hosts branch's edge-carrier rule, which moves a seated group's trivia onto its first and last built child, is not on `feat/typed-reader`. If the hosts branch lands first, Task 3 retires that rule with the others.

**Step 1: failing test.** For each of rust, typescript and python, a source with a comment on each side the assignment gives goes through the lane (`buildWithFactory`), and the built tree renders back to the source bytes. The sides covered are an edge, either side of a separator, between statements, and a node's `inner`. A comment no side takes is outside the lane's guarantee and is counted, not asserted. Expected: FAIL. Before Task 4, the lane reads `$_layout.trivia`, which the reader still seats. So the test is written against the table's reader, `sideOf(source, side)`, which does not exist yet.

**Step 2:** `sideOf` reads a source node's side through its tree handle (`triviaSide`). The lane writes each side onto the node built from it through that node's `$trivia`, with comment nodes built by the grammar's builders (`ir.lineComment(…)`, `ir.comment.lineComment.docOuter(…)`). The assignment is the table's, so the lane moves no trivia between nodes. Delete `carryTrivia`, `carryElementTrivia` and `seatLineGaps`.

**Step 3:** the test passes, and the lane's rows are unchanged in all five grammars, compared by number.

**Retires:** `carryTrivia`, `carryElementTrivia` (and the edge-carrier rule if present); `seatLineGaps` and its line-gap query.

### Task 4: A parsed node's trivia is the table's

**Files:**
- Modify (Rust):
  - `read.rs`: `place()`, `Placement`, `Entry`'s `same_line` and `tokens_between`, and `ReadCtx::entry`'s copies go. A read seats nothing.
  - `trivia.rs`: `TriviaEntry` loses `same_line` and `tokens_between`, and its napi codec loses `$sameLine` and `$tokensBetween`. `render_trailing` and `owner_join` read rows from spans (prior art 4).
  - `slot.rs`: `FramedTrivia` in `SlotValue::Coord`, `outside_trivia_from_napi`, and `write_coordinate`'s framing go. A coordinate's sides come from `SourceTable::sides`.
  - `prepare.rs`: `SlotValue::prepare` reads a coordinate whose range holds an edited side into its transport (`read_coordinate`).
  - `engine.rs`: `line_gaps`, `line_gaps_at` and `SourceTable` for the tree table.
  - `napi_engine.rs`: `line_gaps_of` goes.
  - the derive (`sittir-transport-macros`): `read_coordinate`, and no placement in `sides_of`.
- Modify (TS):
  - `packages/common/src/utils.ts`: `triviaWriter`, `readTrivia`, `readDerivedSides`, `lineGapsRead`, `writtenSides`, `readLineGaps`, `composedTrivia`, `markEditedNode`, `refuseUnheld`, `triviaInnerAt`, `setTriviaData` for parsed nodes;
  - `identity.ts`: `markIndexEdited` and `editedWithin` go;
  - `transport-data.ts`: `carryPlacement`, `ENTRY_PLACEMENT_KEYS`, `foldedCoordinate`'s edited test, `unreadCoordinate` and `hasOutsideTrivia` go;
  - `snapshot.ts`: `snapshotIn` asks `tree.editedWithin`;
  - `engine.ts`, `create-engine.ts`, `engine-scope.ts`: `lineGapsOf` goes.
- Modify (codegen):
  - `node-members.ts`, `types.ts`, `consts.ts` (`emitInnerGaps`), `client-utils.ts`;
  - `compiler/model/trivia.ts`: `innerGapsKeyed`, and the `innerGaps` fact for the surface;
  - `packages/types/src/engine-api.ts`: `GrammarInnerTriviaAt`;
  - `packages/tools/src/validate/common.ts` and `read-render-parse.ts`: `triviaViewOf`, `innerGapsKeyed`, and the placement copy;
  - `packages/tools/src/emit/factory-source.ts`: the `innerAt` output.

  Each changed function's glossary entry changes with it.
- Test: `packages/{python,rust,typescript}/tests/trivia-table.test.ts`.

**Step 1: the failing tests**, in python, rust and typescript each unless named:
- the typed-reader plan's Ruling 12 defect on every route, the query route included: `# four` survives a leading write on the block;
- after a write, the whole tree pinned exactly, and reparsed with no `ERROR`;
- a comment between two untouched children of an edited parent;
- a comment before a parent and its first child is the parent's leading, and a write to the child's leading leaves it;
- each side read and written through its node, and a childless node's entries through `inner`;
- Review Focus 1, 2, 4, 5, 6 and 7;
- ruling 7: in `{ s1(); // a⏎ // b⏎ s2(); }`, replacing `s2` in a `$with` keeps `// a` with `s1` and drops `// b` with `s2`;
- ruling 8: an `ERROR` entry renders verbatim when its owner renders from its template;
- a rust doc comment carried with its item to a new holder, with the comments in the item's body;
- ruling 4: a comment written to one node's side that the assignment gives to another is that other node's after a reparse;
- two reads of a side are equal and are not the same object;
- a write through a parsed holder renders through a built holder that stores the same range as a coordinate it never read;
- ruling 11: a parsed one-line block (`fn f() { a(); b(); }`) written through elsewhere in its tree renders on one line, since no entry breaks it; a statement written into a parsed block (its new seams have no source) renders with the seam defaults; a node moved into another tree carries its sides' layout entries with it, and renders with them there;
- ruling 10: rust `\n//! doc`, `//! doc`, `fn main() {}\n// end` and `fn main() {} // end`, and python `# c`, `x = 1\n# c` and `x = 1 # c`, each with and without a final line break, render as their source: no held break is written at the document's end, and a final break the source has is kept;
- a snapshot of an edited tree takes its sides from the table, with no `$sameLine` or `$tokensBetween` in its data.

Expected: FAIL. A write through a query is refused today, and the defect test drops `# four`.

**Step 2: reads.** `$trivia.leading()`, `trailing()` and, on a childless node, `inner()` are one `triviaSide` call each. The client builds each comment entry with the grammar's builders, and a layout entry reads as its member's kind id, as today. The wrapper keeps nothing.

**Step 3: writes.** One `writeTriviaSide` call replaces the side. Entries are comment nodes built by the grammar's builders, crossing through the trivia type's napi codec. Where a write gives no whitespace, the written side sets the layout the entry renders with (Review Focus 2): a `leading` write is followed by a line break, and a `trailing` write is preceded by a space on the owner's line. Today's write tests keep their bytes.

**Step 4: render.** A parsed node always crosses as its coordinate. In `prepare`, a coordinate for which `edited_within` holds is read into its transport (`read_coordinate`, depth 1), and its children stay coordinates until their own ranges hold an edit. A coordinate with no edit renders as its source slice. Its holder prints the coordinate's sides from `SourceTable::sides` around it: a written side as written, an assigned one as assigned, with in-line spacing from the seam defaults (spec § 4). The folded slice's re-indent stays as 1c-ii leaves it.

**Step 5: the reader** seats nothing: `sides_of` and `place()` go, and an extra is skipped as a layout token is. Snapshots read each node's sides from the table: a snapshot read asks `trivia_side` for each node and writes each entry with its span from the holder (`SnapshotCtx`), with no stamps. The parity fixtures, which are snapshots, are rewritten through it.

**Step 6: drafts and built holders.** A `$with` draft carries its children's sides, and so does a parsed node placed in a new holder (ruling 7): its coordinate names its tree, and the render asks that tree. Until 3b, a built holder's own trivia stays on the node.

**Step 7:** every test passes, and the gates hold. Record the trivia-placement census as the table's assignment, with the extras that moved from placement's side listed. Per grammar, rerun the snapshot census and its classes: the layout classes should fall, and what remains is recorded with its class.

**Retires:**
- the reader's placement: `place()` and `Placement`, `TriviaEntry`'s `same_line` and `tokens_between`, and the `$sameLine` and `$tokensBetween` stamps with their copies (`carryPlacement` and `ENTRY_PLACEMENT_KEYS` in `transport-data.ts`, the copy in `read-render-parse.ts`, and `ReadCtx::entry`'s), snapshot data included;
- trivia on parsed wrappers: `$_layout.trivia` on a parsed node, `writtenSides`, `composedTrivia`, `readLineGaps`, `readTrivia`'s derivation, `readDerivedSides` and `lineGapsRead`;
- the line-gap query: `lineGapsOf` on the engine with its scope and its types, napi `line_gaps_of`, and `ParsedTree::line_gaps_at` with `line_gaps`;
- the client edited set: `markIndexEdited`, `editedWithin` and `markEditedNode` (the typed-reader plan's Ruling 10 hook). An in-place verb that lands later writes native data the render reads, as a trivia write does;
- the client fold check: `foldedCoordinate`'s edited test, and `hasOutsideTrivia`;
- the refusal of a write through a query: `refuseUnheld`, and its use of `reachedByAccessors`;
- sides named from a parent (ruling 9): `innerAt` (`GrammarInnerTriviaAt` in `packages/types`, `triviaInnerAt` in `packages/common`, and the member the node-members emitter writes), `INNER_GAPS` with `emitInnerGaps`, the `innerGaps` fact, `innerGapsKeyed`, and the source emitter's `innerAt` output, which writes each comment to the side the assignment gives it. `inner` stays, on a childless node;
- the refusal of a coordinate a holder never read whose range holds a write (`unreadCoordinate`): the write is the table's, so the coordinate renders it;
- the outside trivia a folded coordinate carries: `FramedTrivia` in `SlotValue::Coord`, `outside_trivia_from_napi`, and `write_coordinate`'s framing;
- `triviaViewOf` in the validators, which now read the table.

### Task 5: Measurements and the 3a gates

**Files:**
- Create: in `docs/superpowers/probes/2026-10-09-trivia-table/`, `measure.mts` and the README's results.

**Measurements.** Against the `feat/typed-reader` commit 3a is cut from, like for like: the same inputs, counts and scripts at both commits, run in copies outside any watched tree, each run gated by `timing/idle.sh`.
- the table's native memory and build time on the three arena inputs, against the placement read;
- the fold's timing after one leading write on the deepest statement (1c-ii's `fold-timing.mts`);
- the heap of an untouched whole-tree read (`transport/measure-heap.mts`);
- the rebuilt render's per-slot time (`transport/layout-rounds.sh`).

**Whole-branch gates.** The typed-reader plan's 1c-ii gates hold, and:
- `packages/common/src` holds no `lineGapsOf`, `markIndexEdited`, `editedWithin` (the client's), `refuseUnheld`, `unreadCoordinate`, `carryPlacement` or `hasOutsideTrivia`;
- `rust/crates/sittir-core/src` holds no `place(`, `line_gaps` or `FramedTrivia`, and `TriviaEntry` carries no `same_line` or `tokens_between`;
- `packages/tools/src` holds no `carryTrivia`, `carryElementTrivia` or `seatLineGaps`;
- no source under `packages/*/src` holds `innerAt` or `INNER_GAPS`, the grammar packages' generated sources included.

Commit the probes and the README. Open the PR into `feat/typed-reader` with its owner's `Owner:` line first in its body, and ask brainstorm for the whole-branch review.

---

## Outline: 3b, the record wire and built nodes' trivia

Detailed against master after 3a lands.

**The record wire** (shared-arena ruling 6.3). 3b is detailed only past the gate on the record step: records must match or beat napi objects on read time, both one node per call and every match in one call, and on retained heap per node, as well as beating them on render decode. The object wire's numbers are re-taken in the engine beside the records'. The first thing the step attacks is the view's construction. In the like-for-like re-take a node over a record holds about 1.9 KB more than an object. Every form carries the same member closures, so the gap follows how V8 builds the view's literal, not the closures as such (the shared-arena spec's § The wire). At that step the derive's object codec gives way to records, and a parsed node's literal holds a reference to its record (the shared-arena spec's ruling 4).
**Decisions the record step settles, beside the gate.**
- **The name of the typed model.** The structs are now the native typed model of a node: the read's target and the render's input, with the wire codec a detail. "Transport" names only the wire. The name is decided once, at the record step, when it is settled whether the structs stay structs or become views over arena records (then `…Record`, `…Data` or another name). Nothing is renamed before then. The blast radius:
  - the `#[transport]` attribute, `ReadTransport`, `TransportLayout` and the `sittir-transport-macros` crate;
  - the codegen emitters, every generated `…Transport`, and the glossary and specs.
- **One source for a record's layout.** Codegen computes the layout once from the model: each slot's word offset and width, and each kind's word count. It stamps them into the Rust struct's attributes (`words = …`, `word = …`, as the shared-arena spec draws them) and into the generated TypeScript accessors as literal offsets. The derive expands the record's read and write code from the stamped attributes, and checks rather than derives: a field whose type does not fit its stamped words is a compile error. There is no runtime layout table and no second derivation in TypeScript.
- **A choice declared once for its content** (the shared-arena spec's transport declaration) is not implemented yet. The generated crates declare 38 choices more than once (rust 3, typescript 32, python 3), and a layout stamped per choice would stamp each duplicate. Codegen declares each choice once before the layout is stamped.
- **String storage.** An outline item for the record-step design to settle; it is not a ruling on the mechanics.
  - Parsed leaf text has no pool. A record stores the span, and reading the text slices it from the source the engine already holds, as an untouched node renders today.
  - Built or edited leaf text goes in a per-arena string table, append-only and deduplicated, that records reference by index. A record stays fixed-size, and a repeated name (`self`, `x`) is stored once.
  - JS-side interning of `$text` strings only if the record step's gate measurements (read time, retained heap) show that napi string creation is the cost.
- **Built nodes' trivia.** A built node's trivia moves from the node into its record, by side, as the trivia-table spec's § 7.1 rules, and travels with it when it is placed. A write to a built node's side lands in its record whether or not it has a holder. A built holder keeps nothing for its children, and a parsed node placed in a built holder keeps its sides in its tree's table. The render then reads trivia from native storage only.
  - **Retires:** built-node trivia on the node (`$_layout.trivia`, `setTriviaData`, the trivia writer's client store), and `TransportLayout::trivia`, `TransportTrivia` and `TriviaEntry` with their napi decode: the render prints each side from the record or the table.
