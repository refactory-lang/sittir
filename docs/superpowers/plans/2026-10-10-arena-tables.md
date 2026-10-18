# Arena Tables Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trivia leaves the reader's seating, the wrappers and the native nodes for native storage keyed by node and side, a parsed tree's table first and then built nodes' records, and the wire becomes arena records: the shared arena's step 3.

**Architecture:** Two stages on their own feature branch, `feat/arena`, after `feat/typed-reader` lands. 3a puts a parsed tree's trivia in one native table on `ParsedTree`, keyed by (node, side) and assigned by one walk at read, and the render reads a parsed tree's trivia from it and from nowhere else. 3b replaces the napi object wire with arena records, past a measured gate, and keeps each built node's trivia in its record, so the render reads trivia from native storage only.

**Tech Stack:** Rust 1.99.0 workspace, pinned in `rust-toolchain.toml` (tree-sitter 0.26, napi-rs 3); TypeScript in `packages/common`, `packages/codegen` and `packages/tools`; vitest; the `sittir-parity-tests` integration crate.

**Specs:** `docs/superpowers/specs/2026-10-09-trivia-table-design.md` (§ 1–5, rulings in § 7) and `docs/superpowers/specs/2026-10-01-shared-arena-design.md` (§ The wire, § Trivia, ruling 6.3). A bare § in 3a is the trivia-table spec's. A gap's default spacing is the seam defaults' (`docs/superpowers/specs/2026-09-14-token-seam-defaults-design.md`, over the sites of `docs/superpowers/specs/2026-09-06-punctuation-seam-spacing-design.md`); this plan derives it from them and declares none of its own.

## Definitive-format decision and revised execution gate (2026-10-16)

This plan implements the **canonical grammar-generated packed immutable AST** specified in `2026-10-01-shared-arena-design.md` (§ Packed AST is definitive). The object codec remains a temporary baseline/fallback while record implementation is optimized and validated; it is not a permanent alternative format. The original measurement results, hypotheses and tasks are retained for traceability.

**Stage 3b-i is a measurement and correctness milestone, not an architectural referendum.** Complete Tasks 6–10 and publish all results even when a record variant loses. A failing performance row creates an optimization follow-up with the measured workload, regression size and suspected cost; it does not cancel 3b-ii or restore the object wire as the target. An incorrect or unsafe implementation must not ship, and a performance regression blocks cutover only when the maintainer rules it blocking on Task 10's numbers; resolve a blocking problem before cutover, keeping the existing node meanwhile.

**Stage 3b-ii implements the definitive format.** Detail it against the measured branch, then switch constructed nodes to eager immutable, kind-specific packed records, preserving structural sharing on `$with`. The five-word generic cell in Task 7 is an initial codec/measurement vehicle, not a final requirement: assess direct per-kind inline scalar/bit/ID fields, inline fixed-size child references, list runs and UTF-8 offsets. Generated Rust attributes and TypeScript offsets remain derived from one layout pass. Parsed nodes are projected directly from Tree-sitter lazily; unchanged parsed subtrees can remain coordinates. No intermediate JS AST is needed to populate records.

**Required measurement extensions:** report native allocator calls/allocated bytes, occupied record bytes versus chunk capacity/slack, JS `heapUsed`, external buffers, native retained memory and RSS; compare object/record storage with equivalent wrapper forms to isolate prototype/closure effects; include parse → inspect → edit → render, native rebuilt render, single and batch read, repeated member access, small trees, deep recursion, shared children, 10,000 builds, snapshot retention, disposal and chunk growth. An external `ArrayBuffer` is zero-copy exposure, not concurrent shared-memory semantics. Check native backing lifetimes under disposal and garbage collection.

**Deliverable boundaries:** distinguish (a) the packed in-process AST representation, which is definitive, from (b) a future stable persisted/interchange file format, which is not promised by this step. Do not describe immutable arena records as stack-resident; fixed-size fields are inline within heap-backed arena chunks. Keep the existing 3a trivia ownership decisions unchanged.

## Scope and sequencing

`feat/typed-reader` carries the shared arena's steps 1 and 2: the typed reader (`docs/superpowers/plans/2026-10-05-typed-reader.md`, 1a to 1c-ii) and relative coordinates (`docs/superpowers/plans/2026-10-06-relative-coordinates.md`). This plan is step 3 with both trivia tables, a feature of its own on `feat/arena` that starts after that one lands. Its stages are detailed against the code when each starts: 3a and 3b's measured implementation stage (3b-i) below, followed by the definitive-format cutover (3b-ii), still an outline.

| PR, on `feat/arena` | Lands | Gate |
| --- | --- | --- |
| **3a** | the parsed-tree trivia table: one token walk that assigns each gap's entries to a node's side, and a native table by (node, side) on `ParsedTree`; a parsed node's `$trivia` reads and writes the table, and the render prints parsed trivia from it; snapshots take their sides from it; the reader's placement, trivia on parsed wrappers, the line-gap query, the client edited set, the query-write refusal and the ir validator lane's trivia carriers go | untouched renders and validation rows unchanged in every task, the trivia-placement census recorded; every corpus extra's owner is its tree-sitter parent, and every extra lands in one side or is counted as in none; an edited render's bytes move only where a ruling moves them |
| **3b** | the definitive packed AST record wire: records in both directions, a parsed node's literal over its record, the derive's object codec and the napi impls gone; built nodes' trivia in their own native table | record and object native node measured like-for-like, optimization regressions recorded and addressed before cutover as warranted; rendered bytes, validation rows, ownership and memory safety unchanged |

## Global Constraints

The typed-reader plan's Global Constraints hold here too.

**Reader attributes and diagnostics (the maintainer, 2026-10-14).** Field types supply arity,
payload shape and kind admission. Attributes add parser routing and shared record layout facts,
without repeating type shape: `content = field` alone selects an envelope, and `item = field`
alone selects a list. Keep the layout-token allowlist for the core's default-off
`read-debug-checks` diagnostic. Normal reads skip leftovers after typed routing; required-slot,
cardinality and kind-admission checks remain active. This supersedes unconditional refusal of
unrouted children in the inherited typed-reader constraints, per shared-arena ruling 7.

---

## 3a, the parsed-tree trivia table

Detailed against `feat/typed-reader` at `5604cd7c0` (the first snapshot step merged; master `e5898a5e7`). A parsed tree's trivia leaves the reader's seating, the wrappers and the native nodes for one native table on `ParsedTree`, keyed by (node, side), and the render reads a parsed tree's trivia from that table and from nowhere else. The design is `docs/superpowers/specs/2026-10-09-trivia-table-design.md` (§ 1–5, rulings in § 7); the shared-arena spec's § Trivia places the tables in that design.

**Branch.** `feat/arena`, cut from `feat/typed-reader` once the first snapshot step (Tasks 1, 9, 10 and 11a of the relative-coordinates plan) has merged into it. Each task is a commit series on `feat/arena`, and the stage is one PR into `feat/typed-reader`. `feat/typed-reader` is merged in when it moves, never rebased.

**Order.** `feat/typed-reader` holds the refusal of a write through a query (the typed-reader plan's Ruling 13) and the snapshot step's `$snapshot()`, which carries the reader's placed trivia. 3a replaces both. 3b, which puts built nodes' trivia in their records, lands after it; until then a built node keeps its trivia on the node, and `$trivia` reads the same on parsed and built nodes. Within 3a: **Task 1 → Task 2 → Task 4 (Task 3 folded in) → Task 5.** Each task names what it retires; together they retire what the trivia-table spec's § 5 lists. The relative-coordinates plan's Tasks 11b, 11c and 12 follow 3a and read from its table.

### Prior art reused

Each prototype and measurement the arena steps already hold, and what 3a takes from it.

1. **The uncommitted revision of the shared-arena spec's "The node declaration"** (`scratchpad/wt-arena-node`, 44 lines added and 28 removed against `26d0bface`). **Superseded; retire the worktree.** Master's spec already carries its contract, from `dd77bcb62` and `42ab277c7` on:
   - per-choice node enums;
   - the slot's type stating admission and storage (a unit variant a fixed literal stored as its kind id, a variant with a native node a node);
   - no `store = …` or `members = […]`.

   Master goes further: a presence slot is `Option<bool>` with `presence = kind::…`, where the revision has an `Option` of a one-literal choice, and blank arms are added. The derive matches master: slots carry `field = …` only, and the presence slots are `Option<bool>` (rust 30, typescript 41, python 9).

   One clause of master's spec is not implemented yet: "a choice is declared once for its content". The generated crates declare 38 choices twice or more by content: rust 3, typescript 32 (four identical `…TerminatorNodeSlot` enums among them), python 3. That is codegen's to fix, not 3a's. It is recorded for the record step (3b), where a record's layout is stamped per choice and a duplicate would stamp twice.
2. **`docs/superpowers/probes/2026-10-01-shared-arena/` and `docs/superpowers/probes/2026-10-02-layout-table/`.**
   - **Reused by 3a:**
     - `transport/inputs/` is Task 1's and Task 5's input set.
     - `transport/measure-heap.mts` is Task 5's heap probe.
     - `timing/idle.sh` gates every timed run in Task 5.
     - `transport/layout-rounds.sh` and `layout-report.py` run Task 5's like-for-like rounds.
     - From the layout-table probe, `statement-runs.mts` (blank lines within and between statement runs) is the method Task 1's blank-line count follows.
   - **For 3b, not 3a:**
     - the `2026-10-01/arena-proto` tree-image prototype, with its view and encoder;
     - `transport/proto/`, the node-macro probe;
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
   - **Historical ruling 3 measurements inform 3b.** The initial records lost single-node reads (4.8/5.0 µs versus 4.5/4.3) and held about 1.9 KB more per node. These figures motivate optimization, not an adoption veto; correctness and safety still govern cutover.
   - **Direct eager immutable built records are the definitive 3b target,** compared with original ruling 5's transitional encoding at render. Nothing in 3a requires document order or contiguous subtree ranges of built records:
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

`ParsedTree<G>` holds the table and the written sides. `EngineGrammar` gains `type Trivia` (the grammar's `TriviaNode`) and `fn whitespace(self) -> (&'static WhitespaceTable, &'static [u16])`, so the engine macro takes neither the whitespace table nor the layout kinds:

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

`Prepare` gains `fn read_coordinate(tree: &tree_sitter::Tree, ctx: &ReadCtx<'_>, index: u32) -> Option<Result<Self, ReadError>> where Self: Sized` (default `None`). The derive implements it for every node it implements `ReadNode` for, as a read of depth 1.

### Rulings (the maintainer, 2026-10-09 and 2026-10-10)

1. **A gap's owner is tree-sitter's** (spec § 1): the smallest node containing tokens on both sides of it, and the root at the file's edges. The owner is derived from the gap and the tree, never stored.
2. **A comment is a value** (§ 1). Comments are still built with the grammar's comment builders (`ir.lineComment`, `ir.blockComment`, `ir.comment.*`), with their factories, coercion and sibling-lead refusals. A write stores the built node's value, and two reads of a side return equal nodes, not the same object.
3. **A built node keeps its own trivia** (§ 7.1), by side, in its record, and it travels with the node. 3b builds that; until then a built node keeps its trivia on the node.
4. **After a reparse, the assignment decides** a comment's side, not the call that wrote it (§ 7.2).
5. **Whitespace is layout only** (§ 7.3). Trivia stores line breaks, blank lines and indentation, and a gap's in-line class (a space, a tab or tight) where it differs from what the options render; otherwise the spaces between tokens on a line derive from the seam defaults. A parsed tree stores where its source's layout differs from the options (ruling 11), and a gap with no entry renders as the options say, built and written content alike. Task 1 measures the stored size.
6. **Trivia is assigned at read** (§ 1, § 2). A gap's entries go to its owner's two children beside it: those on the left token's line are the left child's `trailing`, the rest the right child's `leading`. With no left child every entry leads the right one, with no right child every entry trails the left one, and an owner with no children takes them as its `inner`. One native walk stamps the assignment, and the table is keyed by (node, side). A write replaces one node's side, so a writer that keeps a side's entries reads them and writes them back with its addition. This is not the old placement: that seated trivia on native nodes and the client carried it on wrappers, while here the assignment is a native fact keyed by node (§ 1).
7. **A node's trivia travels with it** (§ 3). A `$with` draft and a moved node carry their children's sides. In `{ s1(); // a⏎ // b⏎ s2(); }` with `s2` replaced, `// a` stays as `s1`'s trailing and `// b` goes with `s2`'s leading, as today.
8. **An `ERROR` node is an entry** (§ 1): a value of its kind and source text, rendered verbatim and never rebuilt by a builder. The reader treats `ERROR` as trivia today (the typed-reader plan's Global Constraints).
9. **No side is named from a parent by index** (§ 2). A node with no children (`()`, `{}`) has `inner`, the only side a parent addresses. `innerAt`, `INNER_GAPS` and the named inner gaps leave the surface. A gap whose owner has children but none beside it lies between two of the owner's own tokens (`for /*c*/ (`, `[a, b, // c⏎]`). No side takes it, and it has no guarantee: its entries render while the owner copies its source bytes, and when the owner renders from its template, the template's tokens and the seam defaults decide, so they may go.
10. **The held break protects following text; at the document's end there is none** (the maintainer, 2026-10-10). The source's end, which the inferred layer holds (spec § 1), wins at the end of a document, so no held break is written after an entry that ends the document, a trailing line comment included. The rule is the held break's (`LineHold::Terminated`), not a case for line comments: it holds a break for the text after it, and none follows. A source with no final break renders with none. A source that ends in a break keeps it as its stored layout.
11. **A parsed tree's table stores where the source's layout differs from the options** (the maintainer, 2026-10-10; restated 2026-10-12). A gap whose source layout equals what the options render there stores nothing. A gap that differs stores its source's class: its breaks, its blank lines and its indentation beyond the template's depth, or, where the source keeps the gap on one line and the options break it or space it otherwise, its in-line class, a space, a tab or tight. An in-line run is a layout difference as a break is. A gap with no entry renders as the options say, parsed, built or written alike, and what the options render at a gap is the writer's answer. The whitespace probe records the cost per set (`docs/superpowers/probes/2026-10-09-trivia-table/`).

12. **Superseded by ruling 15.** **A stored layout run carries the source's indentation as a step** (the maintainer, 2026-10-10). On a parsed side, every run that holds a break carries its last line's indentation as a step relative to its enclosing line's indentation (`"  "`, say). The writer writes the enclosing line's actual indentation in the output, then the step, so a moved node keeps the source's indentation style and follows its new nesting. Built and written content keeps the writer's depth tracking.
    - **The enclosing line** is the first row of the gap's owner: the line its first token is on. Its indentation is that line's leading whitespace in the source.
    - **The step** is the run's indentation with the enclosing indentation removed, when the enclosing indentation is a byte prefix of it (the same tabs and spaces, then more). Where it is not, because the two lines mix tabs and spaces differently (enclosing `"\t"`, run `"        "`), the step is measured in columns, a tab advancing to the next multiple of the render's tab width, and spelled in the run's own last indentation character. A run indented less than its enclosing line has an empty step. Task 5 counts both cases per grammar.
    - **Where it lives.** The table keeps each run's bytes. The side read returns the run's whitespace member with its step, the text a seam entry already carries (`TriviaSeam`).

13. **A node is empty when it has no child with width** (the maintainer, 2026-10-10). A zero-width child (typescript's automatic semicolon) counts as no child, so `inner` is accepted on a typescript block whose only child is its automatic semicolon, and `engine.isEmptyNode` follows the same rule. A unit-stored child with text (a real `;`) still counts. It is the table's rule that a zero-width node holds no side.

14. **A unit child's sides ride on its parent** (the maintainer, 2026-10-11; a piece of 3b pulled forward). A child its slot stores as a bare kind (`this`, `True`, `self`) holds sides like any other child (the one-owner rule stands), and its parent's layout carries them by the child's position: its slot's wire key and its item in that slot (`NodeLayout::units`, `$_layout.units`). The derive's read fills them wherever a read seats sides, the render frames each unit by them, and a node rebuilt from a parsed one takes them from its source at prepare. In 3b the parent's record carries them at the slot positions codegen stamps and the macro checks. So `x = (/* c */ this);` renders its comment beside `this` built and detached alike.

15. **A layout run is layout kinds, not indentation text** (the maintainer, 2026-10-11; supersedes ruling 12). A run holds `Newline` and blank-line members and, past them, `indent` and `dedent` members: only the change in excess indentation from the line before it, over what its structure opens. An ordinary block line is a bare `Newline`; a continuation opens with `Newline, indent`, its later lines are bare `Newline`, and the level closes with `dedent`.
    - **One kind pair.** `indent` and `dedent` mean a lasting depth change, as the template's depth ops do, and are each grammar's own depth pair: the members whitespace enrichment mints, or python's scanner tokens. They are found by role or depth text, never by spelling (`depthMembersOf`), and are trivia kinds.
    - **Structure.** Each kind's structural indentation is stamped from its render rule (`depthRegionsOf`): a default-`indent`/`dedent` seam or flank and a depth mark, anchored at the literal before or after it or at the node's edge, emitted as `DEPTH_REGIONS` into the surface kinds.
    - **Excess.** A run's excess is how far its last line reaches past the structural indentation at the token after it, in whole units, floored (a tab is one unit, negative where it falls short). The structural indentation is that of the innermost enclosing stretch: the indentation of the line its first token starts, or one unit past the stretch around it when that token shares a line or the stretch holds none. So a body indented by any width is structural, and a paren-aligned continuation normalizes to whole levels.
    - **Balance.** A run's members belong to its owner, the smallest node holding the tokens on both sides of its gap. The excess an owner's runs change is restored at the owner's end, inside its span: on the trailing side of its last child that holds trivia, or its `inner` side. The writer also restores the excess when each frame closes, whatever the data holds, so a moved or copied node never leaks depth into its new parent or leaves its old owner unbalanced.
    - **Unit.** One per document, inferred at parse (`format::indent_unit`). A render's unit is its explicit `layout.indent` option, else its root's document's, else the grammar default; a detached copy names it as a render option. A parsed tree's format record no longer applies at render: the document unit and the trivia spell its layout.

**Terms.** Token *k* is the *k*-th token of the tree's token walk (Task 2). Gap *k* is the seam between token *k* and token *k + 1*; the gaps before the first token and after the last are the file's edges. A node's sides are its `leading`, its `trailing` and, with no children, its `inner`. A written side is edited.

**Gates for every task.**
- Untouched renders are unchanged: every render fixture, dogfood render and byte-exact read case.
- Validation rows are unchanged, compared by number (`validate:history`). The trivia-placement census measures placement, so Task 4 makes it report the table instead, and its numbers are recorded.
- A byte that moves in an edited render stops the task for review, with its sites (old, new, where). A move that a ruling makes is recorded with the ruling and does not stop the task: a comment in a gap no side takes, dropped when its owner renders from its template (ruling 9).
- `cargo test --workspace --no-default-features`, clippy (`--workspace --no-default-features --all-targets -D warnings`), the full vitest suite, type-check, lint and `scripts/comment-slop-check.sh --working`.

**Review Focus (3a).**
1. **A write beside a sibling's trivia** (`s1(); // x⏎s2();`, no separator between them). `// x` is on `s1`'s line, so it is `s1`'s trailing, and `s2.$trivia.leading(c)` replaces `s2`'s leading only: `// x` stays on `s1`. Test: Task 4.
2. **The layout a written entry renders with.** Where a write gives no whitespace, the entry renders on its owner's line, as a read entry with no layout run beside it does; a line comment still breaks after itself. A write gives a line break to put an entry on its own line. Test: Task 4, one write per side in each of python, rust and typescript.
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
- an owner with children but none beside the gap takes none, and the extra goes to `unowned`;
- a zero-width node (typescript's automatic semicolon, a `MISSING` leaf) holds no side, as a read gives it no trivia: a comment in a typescript block whose only named child is its automatic semicolon is the block's `inner`.

The outer node takes the side (Review Focus 7): when several nodes end at token *k*, the left child is the outermost of them below the owner, and likewise on the right. It is the owner's child on the token's chain of parents, ending (or starting) where the token does.

**Step 5: on `ParsedTree`.** The table is built on the first `trivia_side` or `edited_within`, in a `OnceLock` like `lines`.
- `trivia_side` returns the written entries when the side is written. Otherwise it returns the assigned ones as values:
  - an extra read into `G::Trivia` through its node;
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

### Task 3: folded into Task 4

The ir lane's change lands with Task 4 (brainstorm, 2026-10-10). The storage lanes build from detached copies (`rebuildChildren` in `factory-storage.ts` keeps `$_layout.trivia` and drops the tree), so a lane can read the table only where the copy step takes each node's sides, and that step changes in Task 4, once the reader seats nothing. Done alone, the lane lost comments the copies carried as data (built-render-parse: python 1284 to 1276 AST matches, rust 1878 to 1864, typescript 1798 to 1796, and 10 rust S6 entries). Its files, tests and retirements are Task 4's.

### Task 4: A parsed node's trivia is the table's

**Files:**
- Modify (Rust):
  - `read.rs`: `place()`, `Placement`, `Entry`'s `same_line` and `tokens_between`, and `ReadCtx::entry`'s copies go. A read seats nothing.
  - `trivia.rs`: `TriviaEntry` loses `same_line` and `tokens_between`, and its napi codec loses `$sameLine` and `$tokensBetween`. `render_trailing` and `owner_join` read rows from spans (prior art 4).
  - `slot.rs`: `FramedTrivia` in `SlotValue::Coord`, `outside_trivia_from_napi`, and `write_coordinate`'s framing go. A coordinate's sides come from `SourceTable::sides`.
  - `prepare.rs`: `SlotValue::prepare` reads a coordinate whose range holds an edited side into its node (`read_coordinate`).
  - `engine.rs`: `line_gaps`, `line_gaps_at` and `SourceTable` for the tree table.
  - `napi_engine.rs`: `line_gaps_of` goes.
  - the derive (`sittir-node-macros`): `read_coordinate`, and no placement in `sides_of`.
- Modify (tools, the ir lane):
  - `packages/tools/src/validate/common.ts`: `sideOf` reads a source node's side through its tree (`triviaSide`), `tableSides` gives its extras and `ERROR`s as trivia data with comments built from their reads, and `writeSides` copies them onto the node built from it as data (a copy, not an edit, so the writers' refusals do not apply; a written side's layout is the render's); `carryTrivia` and `carryElementTrivia` go;
  - `packages/tools/src/validate/factory-storage.ts`: `rebuildChildren` takes each node's sides from the table while the node still holds its tree, so the detached copy carries them;
  - `packages/tools/src/emit/factory-source.ts`: `seatLineGaps` goes, and `triviaSuffix` reads sides;
  - their glossary entries in `docs/glossary/packages-tools-src-*.md`.
- Modify (TS):
  - `packages/common/src/utils.ts`: `isEmptyNode` (ruling 13), `triviaWriter`, `readTrivia`, `readDerivedSides`, `lineGapsRead`, `writtenSides`, `readLineGaps`, `composedTrivia`, `markEditedNode`, `refuseUnheld`, `triviaInnerAt`, `setTriviaData` for parsed nodes;
  - `identity.ts`: `markIndexEdited` and `editedWithin` go;
  - `node-data.ts`: `carryPlacement`, `ENTRY_PLACEMENT_KEYS`, `foldedCoordinate`'s edited test, `unreadCoordinate` and `hasOutsideTrivia` go;
  - `snapshot.ts`: `snapshotIn` asks `tree.editedWithin`;
  - `engine.ts`, `create-engine.ts`, `engine-scope.ts`: `lineGapsOf` goes.
- Modify (codegen):
  - `node-members.ts`, `types.ts`, `consts.ts` (`emitInnerGaps`), `client-utils.ts`;
  - `compiler/model/trivia.ts`: `innerGapsKeyed`, and the `innerGaps` fact for the surface;
  - `packages/types/src/engine-api.ts`: `GrammarInnerTriviaAt`;
  - `packages/tools/src/validate/common.ts` and `read-render-parse.ts`: `triviaViewOf`, `innerGapsKeyed`, and the placement copy;
  - `packages/tools/src/emit/factory-source.ts`: the `innerAt` output.

  Each changed function's glossary entry changes with it.
- Test: `packages/{python,rust,typescript}/tests/trivia-table.test.ts`, `packages/tools/src/validate/__tests__/ir-lane-trivia.test.ts`, `packages/common/tests/empty-node.test.ts`.

**One owner rule.** A child holds sides when it is named, not an extra or `ERROR`, and has width, whatever its storage (`holds_sides`). The assignment passes over a node the surface flattens (python's `simple_statements` elements wrapper): its comments go to the node the surface exposes, read from the model's flattening stamp, not from a list of kind names. So `a()  # t` gives `# t` to the `expression_statement`. Width is read from the tree for a parsed node, so a zero-width child (typescript's automatic semicolon, a `MISSING` leaf) holds none, and from the rendered text for a built one (a stored automatic semicolon renders `"\n"`, so it has width). The table applies it (Task 2), `isEmptyNode` applies it (ruling 13), and the reader's per-route exclusion of children stored as unit variants retires with the reader's placement.

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
- a write through a parsed holder renders through a built holder that stores the same range as a coordinate it never read. A `$with` draft is that holder: it stores the parsed node's other slots as the coordinates it copied, unread;
- ruling 11: a parsed one-line block (`fn f() { a(); b(); }`) written through elsewhere in its tree renders on one line, since no entry breaks it; a statement written into a parsed block (its new seams have no source) renders with the seam defaults; a node moved into another tree carries its sides' layout entries with it, and renders with them there;
- ruling 12: a typescript block indented two spaces (`function f() {⏎  a();⏎}`), rendered in place from its template after an edit elsewhere in it, keeps two spaces; the same block moved one level deeper (into another function's body) renders its statements at the new enclosing line's indentation plus two spaces; a continuation line aligned under a paren (`foo(a,⏎    b);`) keeps its four-column step, in place and moved one level deeper; a built statement written into the block takes the writer's depth;
- ruling 10: rust `\n//! doc`, `//! doc`, `fn main() {}\n// end` and `fn main() {} // end`, and python `# c`, `x = 1\n# c` and `x = 1 # c`, each with and without a final line break, render as their source: no held break is written at the document's end, and a final break the source has is kept;
- a snapshot of an edited tree takes its sides from the table, with no `$sameLine` or `$tokensBetween` in its data;
- the ir lane (`ir-lane-trivia.test.ts`): `sideOf` reads a source node's side from its table; a built tree renders each own-line comment back to the source bytes (a file's edges, between statements, a childless node's `inner`), and keeps each same-line comment on its side of its owner and of a separator. The comments the lane lost when Task 3 landed alone are rows: a python comment at a block's end (corpus "Comments at the ends of indented blocks"), a rust macro token tree's comments (`ok! {⏎  // one⏎  /* two */⏎}`), a python line continuation (corpus "Escaped newline"), and typescript comments between a function's signature and its body (corpus "Ambiguity between function signature and function declaration: comments and newlines");
- ruling 13: `isEmptyNode` is true for a typescript `statement_block` whose only child is its automatic semicolon, and `inner` is accepted on it; it is false for a node whose only child is a unit-stored kind with text (a real `;`);
- a parsed typescript `interface Bar {⏎  }` holds its line break as `object_type`'s `inner` layout run, though the kind has no named inner gap (ruling 9 retires them). A `$with` draft of the interface, and the body moved into another tree, carry the run through their coordinate and render it between `{` and `}`. The draft's rewritten edge (the new name against the parsed body) takes the seam default, a space, with or without members; a built `interface Baz {}` already has it. The validator lanes' detached copy, which carries extras and `ERROR`s only, is not on this path.

Expected: FAIL. A write through a query is refused today, and the defect test drops `# four`.

**Step 2: reads.** `$trivia.leading()`, `trailing()` and, on a childless node, `inner()` are one `triviaSide` call each. A read item of a rebuilt list takes its sides from `triviaSide` and its adjacency from a narrow native `siblings(index)` (named, not extras), so `lineGapsOf` has no reader left. The client builds each comment entry with the grammar's builders, and a layout entry reads as its member's kind id, as today. The wrapper keeps nothing.

**Step 3: writes.** One `writeTriviaSide` call replaces the side. Entries are comment nodes built by the grammar's builders, crossing through the trivia type's napi codec. Where a write gives no whitespace, the entry renders as a read entry with no layout run beside it does: on its owner's line, after a space, a `leading` write before the owner (`/* x */ function f() {}`) and a `trailing` write after it (`x; // x`), so a write, a render and a reparse read it back on the same side. A line comment still ends with its held break (`// x⏎function f() {}`), except at the document's end (ruling 10). A write that wants its own line gives the line break (`'\n'`). The write tests that pin a written comment on its own line with no line break given (`x;⏎// x⏎`, `/* x */⏎function f() {}`) pinned the behaviour this replaces and change with it.

**Step 4: render.** A parsed node always crosses as its coordinate. In `prepare`, a coordinate for which `edited_within` holds is read into its native node (`read_coordinate`, depth 1), and its children stay coordinates until their own ranges hold an edit. A coordinate with no edit renders as its source slice. Its holder prints the coordinate's sides from `SourceTable::sides` around it: a written side as written, an assigned one as assigned, with in-line spacing from the seam defaults (spec § 4). The folded slice's re-indent stays as 1c-ii leaves it.

**Step 5: the reader** seats nothing: `sides_of` and `place()` go, and an extra is skipped as a layout token is. Snapshots read each node's sides from the table: a snapshot read asks `trivia_side` for each node and writes each entry with its span from the holder (`SnapshotCtx`), with no stamps. The parity fixtures, which are snapshots, are rewritten through it.

**Step 6: drafts and built holders.** A `$with` draft carries its children's sides, and so does a parsed node placed in a new holder (ruling 7): its coordinate names its tree, and the render asks that tree. Ruling 11's move row reads: an edge whose neighbour changed drops its layout runs, since they spelled the gap to the old neighbour, and the new seam is written, so it takes the default. Runs inside the node and at unchanged edges carry, and a node placed whole keeps its inside runs. Until 3b, a built holder's own trivia stays on the node.

**Step 7:** every test passes, and the gates hold. Built-render-parse returns to its numbers before Task 3 was tried alone, or better: python 1284/1284 (AST 1284), rust 1878/1878 (AST 1878), typescript 1798/1798 (AST 1798), with S6 at or under its ceiling. Record the trivia-placement census as the table's assignment, with the extras that moved from placement's side listed. Per grammar, rerun the snapshot census and its classes: the layout classes should fall, and what remains is recorded with its class.

**Retires:**
- the reader's placement: `place()` and `Placement`, `TriviaEntry`'s `same_line` and `tokens_between`, and the `$sameLine` and `$tokensBetween` stamps with their copies (`carryPlacement` and `ENTRY_PLACEMENT_KEYS` in `node-data.ts`, the copy in `read-render-parse.ts`, and `ReadCtx::entry`'s), snapshot data included;
- trivia on parsed wrappers: `$_layout.trivia` on a parsed node, `writtenSides`, `composedTrivia`, `readLineGaps`, `readTrivia`'s derivation, `readDerivedSides` and `lineGapsRead`;
- the line-gap query: `lineGapsOf` on the engine with its scope and its types, napi `line_gaps_of`, and `ParsedTree::line_gaps_at` with `line_gaps`;
- the client edited set: `markIndexEdited`, `editedWithin` and `markEditedNode` (the typed-reader plan's Ruling 10 hook). An in-place verb that lands later writes native data the render reads, as a trivia write does;
- the client fold check: `foldedCoordinate`'s edited test, and `hasOutsideTrivia`;
- the refusal of a write through a query: `refuseUnheld`, and its use of `reachedByAccessors`;
- sides named from a parent (ruling 9): `innerAt` (`GrammarInnerTriviaAt` in `packages/types`, `triviaInnerAt` in `packages/common`, and the member the node-members emitter writes), `INNER_GAPS` with `emitInnerGaps`, the `innerGaps` fact, `innerGapsKeyed`, and the source emitter's `innerAt` output, which writes each comment to the side the assignment gives it. `inner` stays, on a childless node;
- the refusal of a coordinate a holder never read whose range holds a write (`unreadCoordinate`): the write is the table's, so the coordinate renders it;
- the outside trivia a folded coordinate carries: `FramedTrivia` in `SlotValue::Coord`, `outside_trivia_from_napi`, and `write_coordinate`'s framing;
- `sittir_core::trivia::has_inner` over the native node trivia: an optional slot's padding gate asks the table's inner side of the slot's node instead (the predicate the render reads sides by), and its rows hold (`S { /* c */ }` keeps its pad, `S {}` is tight);
- `triviaViewOf` in the validators, which now read the table;
- the ir lane's carriers: `carryTrivia`, `carryElementTrivia` (and the hosts branch's edge-carrier rule, if it has landed), and `seatLineGaps` with its line-gap query;
- the reader's per-route exclusion of unit-stored children from owning trivia (one owner rule).

### Task 5: Measurements and the 3a gates

**Files:**
- Create: in `docs/superpowers/probes/2026-10-09-trivia-table/`, `measure.mts` and the README's results.

**Measurements.** Against the `feat/typed-reader` commit 3a is cut from, like for like: the same inputs, counts and scripts at both commits, run in copies outside any watched tree, each run gated by `timing/idle.sh`.
- the table's native memory and build time on the three arena inputs, against the placement read;
- the fold's timing after one leading write on the deepest statement (1c-ii's `fold-timing.mts`);
- the heap of an untouched whole-tree read (`transport/measure-heap.mts`);
- the rebuilt render's per-slot time (`transport/layout-rounds.sh`);
- per grammar, the layout runs whose step is measured in columns (the enclosing indentation not a byte prefix of the run's) and those with an empty step because the run is indented less than its enclosing line (ruling 12).

**Whole-branch gates.** The typed-reader plan's 1c-ii gates hold, and:
- `packages/common/src` holds no `lineGapsOf`, `markIndexEdited`, `editedWithin` (the client's), `refuseUnheld`, `unreadCoordinate`, `carryPlacement` or `hasOutsideTrivia`;
- `rust/crates/sittir-core/src` holds no `place(`, `line_gaps` or `FramedTrivia`, and `TriviaEntry` carries no `same_line` or `tokens_between`;
- `packages/tools/src` holds no `carryTrivia`, `carryElementTrivia` or `seatLineGaps`;
- no source under `packages/*/src` holds `innerAt` or `INNER_GAPS`, the grammar packages' generated sources included.

Commit the probes and the README. Open the PR into `feat/typed-reader` with its owner's `Owner:` line first in its body, and ask brainstorm for the whole-branch review.

---

## 3b, the record wire and built nodes' trivia

Detailed against master `591b07885`, where 3a has merged (the trivia table, depth members, inferred options, the format record retired). 3b has two halves separated by a measurement and readiness milestone:

- **3b-i, measurement and parity.** Tasks 6–10 implement the record representation beside the temporary object node, check equivalence, and report comparative performance. Numbers select optimizations, not whether packed AST is adopted.
- **3b-ii, definitive-format cutover.** Detail this against the measured implementation: direct immutable built records, parsed records and removal of the object codec. Correctness, source fidelity, lifetime and memory safety must pass before cutover.

**Branch.** `feat/records`, cut from master. Every task is a commit series. The 3b-i PR reports regressions and optimization actions. A performance miss creates an investigation and retest, not an automatic stop or request to reconsider the architecture. Correctness or safety defects block the affected implementation until fixed. Master is merged in when it moves, never rebased.

**Order.** Keyword presence as a plain `bool` lands in master first, as its own PR, and `feat/records` is cut after it, because Task 7 stamps each presence slot as one bit. Then Task 6 → Task 7 → Task 8 → Task 9 → Task 10. Task 6 selects and profiles a viable wrapper form; even if its numbers trail objects, proceed with the layout, codec and engine comparisons while investigating the regression.

**Selecting node storage (the maintainer, 2026-10-16).** Until the cutover, arena storage is opt-in beside the object wire, and both derive from the one stamped layout.

1. **The cargo feature `arena` is additive.** It adds the record codec and its napi entry points (Interfaces) beside the object codec, and never removes or switches the object wire, since cargo features unify across the workspace. The derive's record items expand inside a `records_codec!` wrapper, which keeps them only when `sittir-core` is built with the feature, as `napi_codec!` does for the object codec.
2. **One runtime switch: the engine option `nodeStorage: 'object' | 'arena'`,** default `'object'`. `rust.createEngine({ nodeStorage: 'arena' })` gives an engine whose reads and renders cross as records. The engine reads which storage the addon supports, and asking for `'arena'` from an addon built without the feature throws, naming it: "arena node storage needs an addon built with the `arena` feature".
3. **`@sittir/<lang>/arena` is shorthand for it.** Its descriptor is the default descriptor whose `createEngine` sets `nodeStorage: 'arena'`. The descriptor codegen is shared; `is`, `kinds` and the types are the same objects. There is one mechanism, and the export only sets a default.
4. **One addon.** Published prebuilds are built with `arena`, so one binary per platform carries both codecs. The feature still gates local and CI builds.
5. **Both readers are emitted** from the one layout: `records.ts` with the record-backed wrap, and the wrap's object path. The engine picks by `nodeStorage`.
6. **CI runs the parity job under both settings,** with identical validation rows, while the option lives.
7. **At the cutover** (3b-ii), `'arena'` becomes the default. `nodeStorage` and `/arena` are deprecated, then removed with the object codec and the feature.

### Prior art reused

Each record prototype and measuring tool the arena steps already hold, with its disposition for 3b. 3a's own uses are listed under 3a.

1. **The Rust arena-record prototype**, `docs/superpowers/probes/2026-10-01-shared-arena/2026-10-01/arena-proto/` (`src/main.rs`), with `encode-proto.mts` and the V8 construction probes beside it (`literal-members.mjs`, `all-in-literal.mjs`, `view-proto.mjs`, `const-vs-proto.mjs`, `with-methods.mjs`).
   - **Superseded:** its read side, a whole-tree image written at parse. The shared-arena spec withdrew the image, and the typed reader reads lazily into nodes.
   - **Measured against:** its generic encoder (`encode-proto.mts`, 51 / 45 / 56 ns a slot value over the parity fixtures). This is the "fields encoded at render" form that Task 10 times beside eager built records (item 5).
   - **Reused by Task 6:** the construction probes' method (one literal form against another, the same members, heap and time per node).
2. **The typed-node and derive prototype**, `…/transport/proto/` (`probe/`, `slot-derive/`, `synthetic/`).
   - **Reused as a prototype:** the record cell (`rt.rs`: five words for tag, kind and payload) provides a measurement and correctness baseline. The canonical immutable layout need not allocate five words per scalar, choice or reference; Task 7 derives kind-specific inline layouts.
   - **Superseded:** the probe's macro (`slot-derive`). The real derive (`sittir-node-macros`) already expands the reader, the opt-in debug diagnostic and the object codec from the generated declarations, and Task 8 adds the record codec to it.
   - **Measured against:** the probe's numbers, the spec's § The wire table. Task 10 re-takes them in the engine.
   - **Reused unchanged:** `synthetic/` and `time-synthetic.sh`, the compile-cost probe re-run for Verification 12 at the cutover.
3. **The measuring tools**, re-taken unchanged so the numbers compare like for like:
   - `…/transport/measure-heap.mts` (fixed populations);
   - `measure-proto.mts` (the three forms, checked before timing);
   - `measure-layout.mts` with `layout-rounds.sh` and `layout-report.py` (rounds rotating checkouts, paired per round);
   - `function-item-heap.mts` and `measure-rebuilt.mts`;
   - `timing/idle.sh`, which gates every timed run.

   A script that needs a new mode gets it as a flag, so the old mode still runs unchanged at the old commit. The inputs are `transport/inputs/` (`engine.rs`, `spacing.rs`, `create-engine.ts`).
4. **The uncommitted shared-arena spec revision** from the retired `wt-arena-node` worktree, kept at `scratchpad/backup/wt-arena-node-spec.patch`. **Superseded.** Master's spec already says what the revision added:
   - each choice declared once for its content;
   - a unit variant as a fixed literal stored as its kind id;
   - the attributes stating only what the types cannot, with the macro computing none;
   - the kind-enum and scalar-trivia rows of the projection-facts table.

   It differs from master in two places, and both are superseded. A keyword's presence is a plain `bool` (the maintainer, 2026-10-12, which replaces master's `Option<bool>` before 3b starts), not an `Option` of the one-literal choice. Inner gaps are no longer an attribute: 3a's ruling 9 removed the named inner gaps, and `inner` is a childless node's side. Nothing in the patch is folded into the spec.
5. **The record-layout ruling** (the maintainer, 2026-10-10). Codegen is the single source of each slot's word offset and width, stamped into the Rust attributes (`words = …`, `word = …`) and into the generated TypeScript accessors as literal offsets. The derive checks fit and derives nothing, and there is no runtime layout table. This is Task 7.
6. **Direct eager immutable built records are the target** (the relative-coordinates spec's ruling 6 and the 2026-10-16 definitive-format decision). Builders write records as they construct nodes; accessors read their immutable storage and `$with` produces new records with structural sharing. The object encoder is retired at cutover. Task 10 compares this against transitional object fields encoded at render (item 1):
   - build cost per node and heap per built node;
   - render decode;
   - buffer growth, and whether compaction is needed;
   - reclaiming records nothing names.

   3b-ii's outline holds the semantics the maintainer then rules on.
7. **The typed model's name is `…Node`**: the generated structs, the `#[node]` attribute, `derive(Node)`, `ReadNode`, `NodeLayout` and the `sittir-node-macros` crate. A record's view is `…Record<'a>`, beside its kind's `…Node`.
8. **The review probes of 3a's last rounds** (`scratchpad/backup/wt-arena.scratch-r15.tgz` and `wt-arena-base.scratch-r15.tgz`).
   - **Kept:** one is a measuring tool, now `docs/superpowers/probes/2026-10-11-unit-alignment/reversal-cost.mts`: a rebuilt list's unit alignment, time and heap against list length.
   - **Dropped:** the other sixteen are behavior repros, each now pinned by a committed test (`trivia-ownership.test.ts`, `unit-edges.test.ts`, `written-trivia.test.ts`, `root-edges.test.ts`).

### Corrections found while detailing

- **The duplicate choices moved.** The census (`transport-types-census.py`) on master counts choices whose variant sets repeat another's:
  - rust: 250 choices over 239 variant sets;
  - typescript: 302 over 265;
  - python: 169 over 159.

  That is 11, 37 and 10 duplicates, against the outline's 3, 32 and 3. No two generated bodies are identical once names are normalized, so the duplicates differ in a name or an attribute. Task 7 states which differences are facts (a blank arm, a `display` claim) and which are naming. It declares each content once before stamping a layout.
- **No duplicate choice folds (Task 7, step 1).** On feat/records, the per-slot choices (`*NodeSlot`) whose variant sets repeat another's number 3 in rust, 25 in typescript and 1 in python, in 12 groups. `shareIdenticalChoices` already declares each identical choice once, so every remaining duplicate differs in a fact:
  - 10 groups in the owner's seam sites a literal arm writes;
  - 1 in a variant's claimed ids (rust `if_expression.condition` against `let_chain.left`);
  - 1 in arm order only (typescript `assignment_expression.left` against `for_header.left`, whose claims are disjoint). Folding it would take a canonical variant order in every choice, a reorder of every generated node for one declaration, so the grammar's order stays.

  The glossary entry for `shareIdenticalChoices` lists the three facts.
- **Match-all in the engine is not one call.** `$descendants` returns a JSON batch of coordinates (`engine.descendants`), and each match is then read by its own `engine.read` (`packages/common/src/engine.ts`, `tree.query.descendants` and `readAt`). The probe's "every match in one call" has no engine counterpart on the object wire. Task 8 adds one for both wires (ruling 2).
- **A native node's `$_layout` is wire too.** `NodeLayout` crosses with every node: `edges`, `gap`, `flank`, `at`, `span`, `sides`, `changed`, `units`, and, on built nodes, `trivia`. The probe had none of it. The record layout must place it, which Task 7 does as a side record.
- **Built-node trivia today** is written by `setTriviaData` (`packages/common/src/utils.ts`, from `rebuilt` and the trivia writer `write`). It crosses as `NodeLayout::trivia` (`NodeTrivia`, `TriviaEntry`). Under arena storage it is in the built nodes' native trivia table (Task 8); the object wire keeps crossing it until the cutover.
- **The shared-arena spec's § What the JavaScript wrap keeps** now defines eager immutable built records after cutover. Fields encoded at render are strictly transitional object-wire behavior, not a pending option.

### Rulings (the maintainer, 2026-10-12; ruling 1.1 revised the same day)

1. **String storage.** A record stays fixed-size, so text lives outside it.
   1. **Parsed leaf text: decoded from the tree's one copy of the source** (revised from UTF-16 offsets, which relied on a second copy of the source in JavaScript).
      - There is one copy of the source: the tree's native UTF-8 bytes. They cross to JavaScript as an external `ArrayBuffer` over native memory, finalized with the tree, so no copy is made.
      - The buffer is created lazily, on the first `$text` or source-bytes access, never at parse. A caller who reads only structure (kinds, slots, queries, edits, render) never makes it.
      - The record stores the leaf's byte span only: no UTF-16 words and no non-ASCII index. The native render slices the span as it does today, and `$text` decodes it with `TextDecoder` on access.
      - Whether a wrapper caches the decoded string is a Task 10 row (decode time against retained heap), not a default.
      - `TreeHandle.source`, the JavaScript copy, goes (§ The source copy, below). A kept `$text` then holds only its own characters, never the whole file behind a sliced string.
   2. **Built and edited leaf text: a per-arena string table.** UTF-8 is written once into the arena's byte buffer (`TextEncoder.encodeInto`), deduplicated by a `Map` from string to offset. Records reference it by offset and length, and the native render reads it in place. A built node's `$text` stays the builder's string.
   3. **No JavaScript-side interning of `$text`.** Ruling 1.1 creates no napi strings, so there is nothing to intern unless Task 10's numbers show otherwise.

   Task 10 still times the alternatives as reference rows: for parsed text, UTF-16 offsets slicing a JavaScript copy of the source, and a native call on first access cached on the wrapper; for built text, a JavaScript array of strings that records index, crossing at each render. The designs are the ones above.
2. **The match-all row: both wires get a batch read** (`read_many(tree, indexes, depth, wire)`). The object wire returns an array of nodes, and the record wire one buffer range. The measurement row compares those, as the probe did, and today's path (coordinates, then a read each) is timed beside them.
3. **Built-node storage: both implementations are benchmarked, one is the destination.** A generated eager immutable record builder for rust `function_item` and its slot kinds is compared with today's transitional built objects encoded at render by the 2026-10-01 encoder (prior art 1). Compare build cost, retained memory, native render and sharing; benchmark failure drives optimization, not continued object storage.
4. **A failed performance row is documented and optimized,** not treated as an adoption veto. Correctness, lifetime and memory-safety failures block the affected implementation/cutover until resolved. Keep the record of all measurements.

### The source copy

Ruling 1.1 removes the tree handle's JavaScript copy of the source. A census on master (the property renamed and the workspace type-checked, then a text search for untyped reads) finds one writer and one reader:

| site | use | where it moves |
| --- | --- | --- |
| `packages/common/src/engine.ts`, `parseAndRead`'s tree handle | writes `source` | drops it, and adds `bytes()` and `text(span)` over the tree's native bytes (Interfaces) |
| `packages/tools/src/validate/common.ts`, `readNodeText` | slices `tree.source` by a node's span when the node has no `$text` | reads `tree.text(span)` |

Nothing else reads it. The span helpers (`sourceSpans`, `spanSlicer`, `sliceSpan` in `packages/common/src/span.ts`) and their callers slice a string the caller holds itself: a corpus entry's source in the validators (`from.ts`, `factory-storage.ts`, `read-render-parse.ts`, `gap-census.ts`), an inventory file (`inventory/bindings.ts`) or a probe's input (`probe/kind.ts`). The same goes for the host-template reparse (`reparse.ts`), which reparses rendered text. None of these is the tree's copy, so they stay. The removal is small enough for Task 9.

### Interfaces

Shared by Tasks 7 to 10. These are proposals that Task 7 fixes as codegen facts. Each width is stamped, never computed by the derive.

- **The arena.** One per tree, for parsed records, plus one per engine, for built records (ruling 3).
  - An arena is a list of fixed-size chunks of `u32` words. No record straddles a chunk, and a chunk never moves, so a view held across a later read still reads its record.
  - Each chunk crosses to JavaScript once, as an external `ArrayBuffer` over native memory, finalized with its arena.
  - A record's address is (chunk, word): one `f64`-safe number, `chunk * 2^20 + word`.
- **The source bytes** (ruling 1.1). A tree's UTF-8 source, held natively, crosses to JavaScript as one external `ArrayBuffer` over that memory, finalized with the tree. It is made on the first `$text` or source-bytes access (`TreeHandle.bytes()`), never at parse, and never copied. `TreeHandle.text(span)` decodes a byte span from it.
- **A record.** Word 0 is the kind's grammar id and word 1 the side record's address (0 for none). Next come the kind's presence words, if it has presence slots, and then each other slot's cell at its stamped `word`.
  - A parsed record's side record carries `at` (tree, index, end) and the layout facts the reader stamps. A built record's carries `edges`, `gap`, `flank`, `sides`, `changed` and `units`. A built node's trivia is not in its records: it is in the built nodes' native trivia table (Task 8).
  - The record names its tree once, on the arena, so a parsed cell names no tree.
- **A cell.** Its width is stamped per slot by codegen, from the widest form the slot admits: five for a coordinate, as the probe's cell (tag, kind, index, start, end), and four for a parsed leaf (tag, kind, byte start and end, by ruling 1.1) or a built leaf. Tags:
  - 0, absent;
  - 1, a coordinate (kind, index, start, end);
  - 2, a parsed leaf (kind, byte span);
  - 3, a child record (kind, address);
  - 4, a unit (kind);
  - 5, a built leaf (kind, string-table offset and length, by ruling 1.2).

  A presence slot has no cell. Under the maintainer's 2026-10-12 ruling, a keyword presence is a plain `bool`, false when absent. So it is one bit, at a stamped `bit` in one of the record's presence words: set when the keyword is present, clear otherwise. Presence has no absent state to encode.

  A list cell is (offset, length) into a run of cells in the same chunk, or in a continuation chunk named by the run's first word.
- **The derive.** It gains a record writer and a record reader per declaration, from the stamped attributes. Both check fit: a field whose type does not fit its stamped words is a compile error naming the field and the widths. The object codec stays until 3b-ii.
- **The napi surface, beside today's.**
  - `read_record(tree, index, depth) -> address`;
  - `read_many(tree, indexes, depth, wire)` (ruling 2);
  - `render_record(address, tree, options) -> string`;
  - `chunk(arena, n) -> ArrayBuffer`.

  The existing `read` and `render` are unchanged. The new methods exist only under the `arena` feature (§ Selecting node storage).

**Terms.** A *record* is a kind's fixed words in an arena. A *cell* is one slot's words within it. A *view* is the parsed node's literal over a record: its members, and the record's address in place of the native node's fields. The *object wire* is today's napi objects.

**Gates for every task.**
- Untouched renders and every render fixture, dogfood render and byte-exact read case are unchanged. The object wire stays the default (`nodeStorage: 'object'`) until 3b-ii, and every gate below holds under both settings.
- Validation rows are unchanged, compared by number (`validate:history`).
- `cargo test --workspace --no-default-features`, clippy (`--workspace --all-targets --no-default-features -D warnings`), the full vitest suite, type-check, lint and `scripts/comment-slop-check.sh --working`.

**Review Focus (3b-i).**
1. **Malformed words** (the shared-arena spec's Verification 10). Arbitrary words in a chunk are refused or rendered, and none reads outside its chunk or aborts. Test: Task 8, a fuzzed decode over every kind.
2. **A view held across arena growth.** A node read before a later read adds a chunk still reads its own record, and two views of one record read the same cells. Test: Task 9.
3. **Text offsets in a non-ASCII or CRLF source.** A leaf after a multi-byte character, and one after a `\r\n`, reads the same `$text` on both wires. Test: Task 9, in python, rust and typescript.
4. **A disposed tree.** A view whose tree was disposed is refused with the tree named, never read as stale words (Verification 6). Test: Task 9.
5. **Read parity.** For every corpus node, the record read decodes to the native node the object wire reads: units, blank arms (id 0), presence bits (an absent keyword reads `false`), alias envelopes, token interiors and list owners included. Test: Task 8, over every corpus entry of the five grammars.

### Task 6: The view's construction, in the probe

**Files:** in `docs/superpowers/probes/2026-10-01-shared-arena/transport/`, a `--views` mode on `measure-proto.mts`, and its README's results.

The heap row is the gate's hardest: a view over a record held 6 871 B a node against the objects' 4 949 B with the same members. With fewer members, as first committed, it held 3 702 B. Members are closures in the node's literal (the standing rulings: no class or prototype), so the forms differ only in how the literal is built. The probe gets the engine's member set from master's generated wrap:
- an accessor per slot;
- a `$with` object with a setter per slot;
- `$render`;
- `$trivia` with `leading` and `trailing`;
- `$query`, `$snapshot` and `$engine`.

It measures each form on both inputs, three rounds alternating, idle-gated. Each form gets the heap per node and the one-node-per-call and batch read times. The forms:
- the view as the probe has it now;
- accessors as methods instead of getters (a getter in a literal allocates an accessor pair per property per instance);
- the record's address as one number in place of a buffer and offset;
- `$with` and `$trivia` built with the node's literal, against built on first access by a method that caches them on the node (the closures stay in a literal, as the rulings require);
- keys in one fixed order across kinds, so views of one kind share a hidden class.

**Done when:** candidate forms are checked for equivalent semantics, heap and read times are recorded, and the selected wrapper plus regressions are documented. If none beats objects, proceed to evaluate the layout and codec while tracking wrapper optimizations; this is not an architecture stop.

**Result (done; the maintainer, 2026-10-12).** The view's extra heap came from accessors written as arrows that closed over its buffers. The view is V2: accessors as methods over one own number, the record's address. It holds less than the object form (5 185 / 5 174 B against 5 637 / 5 578 B a node), reads faster in both rows, and keeps every node in fast mode. It needs no ruling or API change.

Building `$with` and `$trivia` lazily is revisited later. The measurements are the reference, in the node README's "The view's construction" and "One form per process":
- getters per node (V3) leave every node in dictionary mode;
- methods (V4, an API change) hold 2 046 – 2 057 B untouched;
- getters on one prototype per kind (V5, which the rulings exclude today) hold 1 918 – 1 929 B and keep fast mode.

### Task 7: One source for a record's layout

**Files:**
- Modify: `packages/codegen/src/emitters/render-module.ts` (the node declarations' attributes) and `packages/codegen/src/emitters/node-projection.ts`, plus a new model pass beside them for the layout.
- Generated: `rust/crates/sittir-*/src/render/node.rs`, and a per-grammar `records.ts` of accessor offsets in `packages/<lang>/src/`.

**Steps.**
1. Each choice is declared once for its content (Corrections). A duplicate that differs only in its name becomes one declaration. One that differs in a fact keeps its own and is listed in the glossary entry with the fact.
2. A model pass computes once, per kind, each slot's `word` and cell width, each presence slot's `bit` and the kind's `words`. Per list slot, it computes the run's cell width.
3. The emitters stamp the results: `words = …` on `#[node]`, `word = …` on `#[slot]` (`bit = …` on a presence slot), and the same numbers as literal offsets in `records.ts`.
   `width` and list-item `run` describe this shared layout and are checked against Rust type
   requirements; they do not supply routing or arity. Do not add separate envelope/list mode
   booleans beside the valued `content`/`item` attributes.
4. The derive parses the attributes and checks them: each slot's type fits its width, a presence slot is a `bool` with a `bit`, no two slots share a word or a bit, and the last slot ends within `words`. Each check is a compile error naming the field. The derive emits nothing else from them yet.

**Gate:** generated outputs change only in the new attributes, the deduplicated choices and the new `records.ts`. Every render, fixture and validation row is unchanged. A test proves the derive's fit check refuses a field one word short.

**Attribute/reader follow-up gate (2026-10-14):** regenerate all five grammars after consolidating
mode attributes; slot contents, wire keys and rendered bytes stay unchanged. Run typed-reader
tests with and without `read-debug-checks`: punctuation or a deliberately omitted child route is
skipped normally and diagnosed in debug mode; missing and overfull slots fail in both. Retain
raw-string routing metadata where the type alone cannot express its parser behavior.

### Task 8: The record codec in the derive, beside the object codec

**Files:**
- Modify: `rust/crates/sittir-node-macros/src/{codec.rs,expand.rs,attrs.rs}`; in `rust/crates/sittir-core/src/`, a new `arena.rs` and the napi methods in `napi_engine.rs`.
- Test: macro tests, `rust/crates/sittir-core/tests/`, and `sittir-parity-tests`.

**Steps.**
1. Write `arena.rs` (Interfaces): chunks, addresses, the side record, the string table of ruling 1.2, and the tree's lazily made source buffer of ruling 1.1. A run longer than a shared chunk gets a chunk of its own, sized to fit, so it still never straddles chunks; a chunk holding one oversize run is addressed at its word 0, inside the `chunk << 20 | word` packing.
1a. **The built nodes' native trivia table** (the maintainer, 2026-10-16: moved here from 3b-ii, so `render_record` parity holds on every fixture and nothing is written to be thrown away). One table per engine, beside its built-record arena, keyed by record address and side (leading, trailing, inner), holding each side's entries and the unit sides. It is outside the record: writing a side updates the table, never the immutable record or a record that shares it. A parsed node placed in a built holder keeps its sides in its tree's table. The record writer moves a built native node's `$_layout.trivia` and `units` into it; the record views and `render_record` read them from it.

**No record is decoded back into a native node** (the maintainer, 2026-10-16). The record codec's one direction is writing: native code writes records from tree-sitter (the read) and from builders. `render_record` reads records in place through views the derive generates over each record, the cutover's render design from the start, and JavaScript reads them in place over the external `ArrayBuffer` (Task 9), so nothing is marshaled per node at the boundary. The one decode is `$text`'s lazy UTF-8 to JavaScript string on access (ruling 1.1).

2. The derive expands, per declaration, inside `records_codec!`:
   - a **record writer** (node → records, children before parents), and the cell writer per choice. A read writes its records through the typed reader's native nodes; writing records straight from the tree, with no native node between, is a Task 10 optimization row, since the slot routing must stay in the one reader;
   - a **fields trait**: one accessor per slot and the layout facts the render reads, with generic associated types for each slot's value. The node struct implements it over its fields, and a **record view** (`…Record<'a>`, the arena and the record's address) implements it over the record's cells, bounds-checking every word it reads and refusing any malformed cell.
3. Codegen's render bodies (`render-module.ts`) are generic over the fields trait, so one body renders a native node and a record. Prepare over a record resolves into side arrays keyed by record address, never into the record.
4. Add the napi methods beside today's (Interfaces). `read_many` takes a `wire` argument (ruling 2).

**Checks the writer runs** (the maintainer, 2026-10-17). The record writer encodes native nodes their builder or the typed reader already checked, so it runs no `verifyStructure` check of its own. The views' bounds and malformed-cell refusals always run: they are memory safety, not type-proved facts. At the cutover, whoever appends a built record runs the type-proved checks once, as the builder does today.

**Encoding (ruled 2026-10-17).** The Interfaces fix the header, the presence words and the cell tags. These are the parts they leave open, each in its ruled form:

1. **A leaf in a child cell.** A parsed leaf is tag 2 (kind, byte start, byte end, descendant index): the fifth word is the leaf's row, so its `at` and its sides in the tree's trivia table come from the cell, and a parsed leaf has no record. A built leaf is tag 5 (kind, string-table offset, length, record address): the fifth word names the leaf's own record, the header alone, which is the key its sides take in the built trivia table. A captured interior string (a four-word cell) is tag 2 or 5 with kind 0 and no fifth word. The alternative, a record for every leaf named by a tag-3 cell, costs two or more words and an indirection for every parsed leaf.
2. **A list cell** is (run address, length): a packed address, not an offset within the record's chunk, so a run longer than a chunk takes a chunk of its own and two records can share one run.
3. **A side record** is variable-length. Word 0 is a mask of the fields present; the fields follow in a fixed order:
   - `at` (index, end), on a parsed node: the tree is the arena's;
   - `edges` (each side's arm kind and strength, the strength stored plus one so 0 is none);
   - `span` (start and end points, row and column each);
   - `sides` (tree, index, end, byte start, byte end);
   - `changed`, as two bits of the mask;
   - `separator` (a kind);
   - `slots`, a count, then per slot its cell's stamped `word` (in place of the wire key), `before`, `after`, `separator`, and its `tokens` as a run (address, length).

   It holds no trivia and no unit sides. A parsed node's are in its tree's table; a built node's are in the built trivia table, a unit's keyed by (record address, slot word, item).
4. **A view names its children's view types through the native type**, not by a name derived from another: the derive implements `HasRecord` for every native node type, struct and choice, with `type Record<'a>`. A struct's view is `<Ident>Record<'a>`, a choice's is an enum over its variants' views selected by the cell's kind, and a cell's accessor yields `<T as HasRecord>::Record<'a>`.
5. **A blank arm** (id 0) is tag 4 with kind 0, distinct from tag 0, absent.
6. **A coordinate in a built record** (ruled 2026-10-17). A tag-1 cell names no tree, since a parsed arena names its tree once. A built record's untouched parsed child is therefore a tag-3 child naming a parsed record in that tree's own arena, written when a builder takes the child. Every width stays stamped and independent of the arena, and a parsed node stays identified by (tree, row). The alternatives were a sixth word in built arenas only (a width that depends on the arena) and a six-word tag for every child slot.
7. **A print setting is a side-record field** (decided by the split in the glossary entry `record-layout.ts::recordLayoutOf`): a field that states how to print takes no record cell and is present by a mask bit. Three kinds of setting are on native nodes today, every one an optional value a builder may set and prepare otherwise fills:
   - a list slot's separator spacing, `<slot>_separator_space`, `_before` and `_after` (209 fields): two more words in the slot's entry under `slots` (8 words an entry in place of 6), keyed by the slot's stamped word. The cost is entries for present slots only: a slot with no stored layout and no setting has no entry. Each field carries `#[space(slot = <word>, side = before|after, site = <site>)]`, stamped from the field's spacing site (`SpacingSite`: its slot, its side and its site constant, the one prepare fills the field's default from), never parsed from the field's name. The bare form, a list with no separator token, stamps the side its render reads;
   - a list's delimiters, `delimiter` (48 fields, a `Delimiter` set): a mask bit and one word with a set bit, so an explicit empty set differs from none;
   - a list's chosen separator, `separator_kind` (1 field): a mask bit and one word, unless it is one fact with the slot's stored `separator`, in which case a record stores only that one. It is not the side record's `separator`, which is the separator before the node as an item of its holder's list.

At the cutover, a parsed leaf is identified by (tree, row) and a parsed unit by its record.

5. Tests:
   - each kind's macro expansion;
   - read parity over every corpus entry of the five grammars: `render_record(read_record(i))` equals `render(read(i))`, and every view accessor answers what the node's field holds (kind, presence, coordinate, text span), compared through the fields trait;
   - the fuzzed view (Review Focus 1): arbitrary words are refused or rendered, and none reads outside its chunk or aborts;
   - a render of `render_record` equal to `render` for every parity fixture, built trivia included.

### Task 9: JavaScript over records

**Files:**
- Modify: `packages/codegen/src/emitters/wrap.ts`, which emits a record-backed wrap per kind beside today's, in Task 6's form, V2 (accessors as methods over the record's address).
- Modify: `packages/common/src/engine.ts`: the `nodeStorage` option (§ Selecting node storage), which picks the wire, and the tree handle's source bytes (`bytes()`, `text(span)`) in place of `source`; and the descriptor emitter (`packages/codegen/src/emitters/index-file.ts`) for the `/arena` export.
- Modify: `packages/common/src/read.ts` (`TreeHandle`) and `packages/tools/src/validate/common.ts` (`readNodeText`).
- Generated: `packages/<lang>/src/wrap.ts`.

**Steps.**
1. Each accessor reads its cell through the stamped offsets in `records.ts` and hydrates a coordinate cell as today's accessor does. The wrap's node members (`$render`, `toString`, `toJSON`, `$trivia`, …) come from `nodeMemberLines`, the emitter today's wraps and builders share.
2. `$text` decodes the record's byte span from the tree's source bytes (ruling 1.1). A built leaf keeps the builder's string.
3. The source copy goes (§ The source copy): `TreeHandle.source` is removed, `bytes()` and `text(span)` are added, and its one reader moves to them.
4. The record-backed wraps are tested against today's: every corpus node's accessors, kinds and `$text` are equal on both wires (Review Focus 3). A view held across arena growth (Review Focus 2) and a disposed tree's view (Review Focus 4) are pinned.
5. For ruling 3, a generated eager builder for rust `function_item` and its slot kinds writes records as it builds. It is measurement code, in the probe folder, not in the grammar package.

### Task 10: Record-wire measurement and cutover-readiness evidence

**Files:** create `docs/superpowers/probes/2026-10-12-record-wire/` with its `README.md`, and flags on the node scripts (prior art 3).

**The like-for-like set.** Both wires are in one build and measured in one sitting, rounds alternating, each run gated by `timing/idle.sh`, in copies outside any watched tree. The inputs are `transport/inputs/`. Rows:
- **read, one node per call,** crossing and members: rust `function_item` on `engine.rs` and `spacing.rs`, plus typescript's statements on `create-engine.ts`;
- **read, every match in one call:** the same matches through `read_many`, with today's coordinates-then-reads path beside them (ruling 2);
- **retained heap per node,** members attached (`function-item-heap.mts`'s population, both wires);
- **render decode per node:** native decode of a native node from napi objects (`FromNapiValue`) against from records, timed natively in a measure-only build feature that the published build never enables;
- **the rebuilt render's native call per slot value** over the parity fixtures (`measure-rebuilt.mts`, `layout-rounds.sh`);
- **`$text` by the ruled design, with the alternatives as reference rows** (ruling 1): time per access, and heap per leaf over a whole-tree walk, with and without a decoded string cached on the wrapper;
- **heap per tree with and without a text access:** a parse read for structure only (no `$text`, so no source buffer) against the same parse after one `$text`, beside today's tree with its JavaScript source copy;
- **built nodes, eager immutable records against transitional encode-at-render objects** (ruling 3): build time and full retained memory per node, decode, chunk growth over 10 000 builds, and an immutable `$with` of a child two parents share: verify that neither parent changes when the child is updated through the other.

**The evidence.** Report each object/record comparison, absolute values and deltas. Separate performance misses (optimize and retest) from source-fidelity, correctness, ownership and memory-safety failures (block cutover). Include allocation counts, record capacity/slack, native/external memory and RSS. The PR records findings without reopening the packed-format decision.

## Outline: 3b-ii, definitive packed AST cutover

Detail against the measured implementation after Task 10 and the resulting optimization work. The definitive-format decision is settled; implementation choices and safe cutover readiness remain.

- **The cutover.** Records become the only wire.
  - A parsed node's literal holds its record's address (the shared-arena spec's ruling 4).
  - The render functions read through a view over the record, expanded by the derive from the same declaration, and no record is decoded into a struct. Prepare resolves into side arrays keyed by record address, never into records.
  - The derive's object codec, the `#[napi(object)]` attributes and every `FromNapiValue` and `ToNapiValue` impl go, along with `toNodeData` and the napi decode of `SlotValue`.
  - Verification 12 (each crate's compile time, peak memory, binary size and `node.rs` lines) and Verification 13 (type-check time) are re-taken before and after.
- **Eager immutable built records are required.** Builders append kind-specific packed records; accessors read them, and updates publish new records. `$with` reuses unchanged child addresses, including shared children, without mutating the original record. There is no in-place node setter option. Reclaim unreferenced records/chunks only while preserving the lifetime of all live snapshots and views.
- **Parsed units are records.** A parsed unit (a variant with no fields, such as `;`) reads as a reference to its record, not a bare kind-id number, so it has identity: alignment matches units by record as it matches read nodes, and the `is` guards classify them.
- **Built nodes' trivia, native only.** The table lands in Task 8 (the trivia-table spec's § 7.1). At the cutover the render reads trivia from native storage only, and a built holder keeps nothing for its children.
  - **Retires:** `$_layout.trivia`, `setTriviaData` and the trivia writer's client store; `NodeLayout::trivia`, `NodeTrivia` and `TriviaEntry` with their napi decode.
- **A native file-based parse** (the maintainer, 2026-10-12). `parseFile(path)`, only for grammars that declare file types: native code reads the file, JavaScript gets records, and text decodes lazily from the shared source bytes, so the source never exists as a JavaScript string. Its API shape (the name, options, errors for an unreadable file, and encoding and BOM handling) is designed here and goes to the maintainer before code.
