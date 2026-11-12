# Arena Trees From Records Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task by task. This repo's rule is no subagents for code. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** an arena parse hydrates the whole tree at parse and drops tree-sitter's tree. Render, query and edit answer every question from records, token spans and node rows, through one navigation interface that object storage serves from its tree.

**Architecture:**
- A navigation interface gives a node's facts (`Kid`), its children in order and its parent.
- The tree backer reads tree-sitter's tree with one cursor that moves locally. The record backer reads records, token spans and node rows.
- Trivia placement, the `SourceTable` methods and the engine's tree functions run once, over the interface, in both storages.
- In arena storage, a parsed tree lives only inside the read call. Afterwards, only the nodes and the source text remain.

**Tech stack:** Rust (`sittir-core`, `sittir-node-macros`), the TypeScript engine in `packages/common`, and the tools' validators and benchmarks.

**Spec:** `docs/superpowers/specs/2026-11-06-arena-trees-from-records-design.md`. Read it first. It replaces Task 4 of `docs/superpowers/plans/2026-11-06-trees-as-objects.md`. Tasks 8–13 implement `docs/superpowers/specs/2026-11-08-lock-free-tree-state-design.md`, the lock-free arena state with no `Rc` or `Arc`; read that spec before Task 6.

**Facts this plan starts from:**
- Trivia placement (`trivia_table/place.rs`) reaches the tree only through `Placer::node`, `kid`, `kids`, `path` and `parent`. A `Kid` carries index, start, end, descendant count, kind, named, entry, leaf and holder.
- The `SourceTable` trait is in `render.rs:122`. It's implemented by `ParsedTree` and `ReadTrees` (`engine.rs`), `WithoutLayout` (`engine.rs`), `ArenaSources` (`napi_engine.rs`) and `ListTrees` (`prepare.rs`).
- Root-down moves: `engine::cursor_at` (`engine.rs:123`), `read::goto`, `Lookups::baseline_gap` (`engine.rs:1762`) and `edge_child` (`engine.rs:2402`).
- Arena entry points to the tree: `arena/view.rs::source_root`, `RecordCtx::row_coordinate`, `arena/prep.rs::edited_record` and `RecordPrep::row_coordinate`.
- A parse's records live in its `TreeArena` (`arena/rows.rs`), which maps a row to its record.
- Prototype's spike is in its scratch git (ae1035a over a 2948b9f1c export). It has token spans, hydrate at parse and the record-coverage check. Use it as reference, not as a base.

**Executor:** sittir-prototype. **Reviewer:** sittir-brainstorm, at the end of every task. **Base:** each task is its own PR from `origin/master`, once the one before it has merged. Merges wait for the user's word.

## Global Constraints

- **Worktree and branches:** prototype's one worktree, `scratchpad/wt-2c-census`, with a new branch per task from `origin/master`. No other worktrees. Pathspec commits (`git commit -- <paths>`). No force, stash, amend, rebase, revert or abort. Push by literal sha.
- **Tree lifetime is settled** (the spec's Decided and Tree lifetime sections). The tree's scope is the read call. Only the source text and the nodes outlive it. The root holds no reference to a tree, and node memory is out of scope. A proposal starts from these rulings and doesn't reopen them.
- **The tree-holders plan's object half is deferred** (the maintainer, 2026-11-08). Arena parses leave the live-tree table, and no held-parse table replaces it. No `TreeCell` or interim `Tree` object comes first.
- **Native threads, when added,** are scoped threads that borrow immutable published data: rows, the source and written records. Each returns its scratch to the borrow's owner. Nothing is reference-counted to cross a thread.
- **Object storage's speed is not a gate** (the maintainer: "as long as it doesn't affect arenas and the public api"). Its correctness is a gate: rows, renders and records. So is the public API.
- **No napi or V8 call runs off the JavaScript thread, or on a grown stack segment.** Render stays a recursive descent.
- **A tree's bytes and strings stay native.** No source copy on the JavaScript heap, and no bulk source crossing.
- **Object storage keeps its representation.** Only its tree backer's cursor movement changes.
- **After parse, an arena tree's records, rows and source are its AST** (the maintainer, 2026-11-08: "we never needed to re-parse, because we have the ast"). The typed reader runs once, at hydration. Every later read consumes what it stamped. Nothing re-parses, and no reader runs again over rows. A fact a later read needs and hydration didn't stamp is stamped at hydration or read through `Nodes`, never by a second copy of the reader's logic.
- **Output:** renders stay byte-identical and records word-identical, in both storages, after every task.
- **Three-way verification** before every commit that can change what the pipeline reads, renders, parses or validates: targeted probes of the wrap and render layers, `validate:history` compared with numbers, and the full suite. Also `cargo test --workspace` in plain and arena builds, and clippy in the four CI configurations.
- **Ratchets only tighten.**
- **Comments:** hand-written TypeScript in `packages/{codegen,common,tools,types}/src` carries none. Rust comments state live constraints. Neither names a spec, plan, PR or task.
- **Speed numbers come from CI only,** on per-CPU medians, held to the ×1.10 bar per grammar.

## Review Focus

1. **A source with parse errors.** ERROR nodes and MISSING zero-width tokens get the same children, spans and sides from both backers, and render byte-identical. Owned by Task 4.
2. **Zero-width tokens:** python's indent and dedent, typescript's automatic semicolons. They keep their index, appear in children, and count in `depth_move` the same in both backers. Owned by Task 4.
3. **Multi-byte UTF-8 sources and multi-line tokens.** Spans stay byte offsets, `line_starts_inside_tokens` gives the same lines, and columns come from the line table, not from byte counts. Owned by Tasks 3 and 4.
4. **A deeply nested source hydrated at parse.** 10,000 levels hydrate without overflow, with no napi call on a grown segment. Owned by Task 6.
5. **A built node that links parsed nodes, rendered after the parsed root is released.** Expected: it renders byte-identical to its render before the release. Owned by Task 6.
6. **A second call into the same engine while one is running,** for example from a finalizer or a callback that reaches the engine. Expected: refused by name, with no deadlock and no aliasing `&mut`. Owned by Task 9.
7. **A JavaScript view of a built chunk kept past the chunk's free.** Expected: the view is detached (`byteLength` 0) before the memory goes, never a read of freed memory. Owned by Task 12.

---

### Task 1: The single cursor pass

**Status:** merged as #1123 (3fd7db513), 2026-11-07. Goldens from master, then the pass, with records word-identical.

### Task 2: The navigation interface, its tree backer, and the placer on it

**Status:** merged as #1135 (16114e186), 2026-11-07.

**Files:**
- Create: `rust/crates/sittir-core/src/nodes.rs` (the interface, `Kid`, and the tree backer).
- Modify: `rust/crates/sittir-core/src/trivia_table/place.rs`. `Kid` moves out. `Placer` reads through the interface. `Placer::nodes`, `Lookup` and the tree inside `Source` go.
- Modify: every caller that builds a `Source` or a `Lookup` (`engine.rs`, `read.rs`).
- Test: `rust/crates/sittir-core/tests/nodes.rs`.

**Interfaces:**
- Produces:
  - `pub(crate) struct Kid { index: NodeIndex, start: u32, end: u32, count: u32, kind: KindId, named: bool, entry: bool, leaf: bool, holder: bool }`;
  - `pub(crate) trait Nodes<'t> { fn text(&self) -> &'t str; fn kid(&mut self, index: NodeIndex) -> Kid; fn kids(&mut self, index: NodeIndex) -> Arc<[Kid]>; fn parent(&mut self, index: NodeIndex) -> Option<NodeIndex>; }`;
  - `pub(crate) struct TreeNodes<'t>`, built from `&'t tree_sitter::Tree` and the source, which holds one cursor.

- [x] **Step 1: Failing tests:**
  - `tree_nodes_match_the_tree`: for every node of one fixture tree per grammar, `kid` and `kids` equal what `Kid::of` and a fresh child walk give today, and `parent` equals the cursor's parent;
  - `tree_nodes_never_descend_from_the_root_in_a_sweep`: a preorder sweep of `kids` over a fixture makes 0 root-down moves, through a test-only counter.
- [x] **Step 2:** Run them. They fail (no `nodes` module).
- [x] **Step 3: Implement.** The tree backer moves its cursor from where it last stood: to a child, a sibling, or up to a common ancestor. It descends from the root only when the target isn't under its current path.
- [x] **Step 4: Run the three-way verification** in both storages. Placement parity, lazy against eager, stays 0 on every grammar and on matter.js.
- [x] **Step 5: Commit:** `refactor(core): trivia placement reads its tree through a navigation interface`.

### Task 3: The `SourceTable` methods and the engine's tree functions on the interface

**Status:** merged as #1137 (b140d66e2), 2026-11-08.

**Files:**
- Modify: `engine.rs`. The `SourceTable` implementations for `ParsedTree`, `ReadTrees` and `WithoutLayout`, plus `cursor_at`, `row_coordinate`, `line_starts_inside_tokens`, `last_list_child`, `edge_child`, `frame_levels` and `Lookups::baseline_gap`. Each reads through a `TreeNodes`.
- Modify: `trivia_table.rs`. `DepthMembers::of` reads through the interface. In object storage it's still one walk per tree, on first use.
- Modify: `napi_engine.rs`, the engine's tree functions (`descendants`, `siblings`, `planHolds`, `snapshot`, `text`, `coordinate`, the layout baseline, stored layout, `slotLayouts`, `separatorBefore` and `framedSpan`), plus `ArenaSources`.
- Modify: `engine.rs` (`error_regions`), which searches through the interface and still goes into only nodes that hold an error.
- Modify: `nodes.rs`, `read.rs` (`Child`, `survey`) and the node macros (`sittir-node-macros/src/hydrate.rs`, `expand.rs`). `read::Child` folds into `Kid`, so one struct holds a node's facts and one constructor reads them from tree-sitter.
- Test: `rust/crates/sittir-core/tests/nodes.rs`.

**Interfaces:**
- Consumes: Task 2's `Nodes` and `TreeNodes`.
- Produces:
  - `Kid` carries the facts a read takes of every node it visits: index, span, descendant count, grammar kind, display kind, field, and whether it is named, an extra or an `ERROR`. Its `index` has one meaning, numbered from the tree's root. So the hydrate pass reads exactly what `read::Child` read.
  - Whether a node is `MISSING` and whether it holds an error are `Nodes` queries, `missing(index)` and `holds_error(index)`, asked only by `error_regions` and `error_holding`. The tree backer reads them from the node.
  - Facts that follow from others are methods, not stored: an entry (an extra or an `ERROR`), a leaf (no entry, descendant count 1) and a holder of sides (named, no entry, nonzero width). `trivia_table::holds_sides` is that method.
  - One `TreeNodes` per tree per render call lives in `ReadTrees`, and `Lookups` moves its cursor. Each engine tree function makes one per call.
  - After this task, no function outside `nodes.rs` moves a tree-sitter cursor except the reader, on a cursor `TreeNodes` lends (`over`). The reader is the hydrate pass, the generated reads, `survey` and `read_units`.

- [x] **Step 1: Failing tests:**
  - `a_codemod_render_descends_from_the_root_as_often_over_80_functions_as_over_20`: rendering the codemod case (one rename, one argument set, one statement inserted, as prototype's render profile) makes the same number of root-down moves at either size, through the Task 2 counter, and no more than the count this task lands at. That count is a ceiling that only goes down. On master it grows with the root's width (29 at 20 functions, 89 at 80). The moves left are one per engine call JavaScript makes during `$render()`, plus one per native render pass that restarts at the file's start;
  - `line_starts_inside_a_multiline_token_hold`: a typescript template string and a python triple-quoted string spanning lines, with a multi-byte character before each, give the same line starts as today (Review Focus 3).
- [x] **Step 2:** Run them. They fail.
- [x] **Step 3: Implement.** Logic is unchanged. Only the way each function reaches a node changes.
- [x] **Step 4: Run the three-way verification** in both storages, and rerun prototype's render profile cases 2 and 3 locally to confirm the cursor share drops. Run Task 1's deep-read bench before and after: the fold must not slow the hydrate pass beyond noise. CI numbers come in Task 7.
- [x] **Step 5: Commit:** `refactor(core): the source table and tree functions read through the navigation interface`.

### Task 4: Token spans and node rows in arena records, and the record backer

**Status:** merged as #1138 (2dac82347), 2026-11-08.

**Files:**
- Modify: the hydrate derive (`sittir-node-macros/src/hydrate.rs`) and `arena/hydrate.rs`. Every node of the tree gets a row, records included. That covers anonymous tokens, extras, named units and flags, named children a template writes, and the nodes inside a subtree the hydrate pass doesn't enter: a leaf's interior, an `ERROR`'s children, an extra's children. Such a subtree is walked once for its rows while the tree is still held.
- Modify: `arena/rows.rs`. A `TreeArena` keeps one dense row per node, 4 words:
  - start;
  - end;
  - subtree end;
  - a packed word: grammar kind (16 bits), field (10 bits), and named, extra, `ERROR`, `MISSING`, holds-an-error and aliased flags.
  
  A sparse map holds the display kind of each aliased node. A field id that doesn't fit in 10 bits is refused by name when the arena is built. The arena also keeps the tree's depth members (`SurfaceKinds::indent` and `dedent` with their running net), recorded as the hydrate pass meets them. The record backer answers `depth_move` from these, so arena storage never walks the tree for them. A first render spent 71% of its time in that walk.
- Modify: `nodes.rs`, adding the record backer.
- Create: `packages/tools/src/validate/backer-parity.ts`, registered as `sittir tool backer-parity`. It's driven by prototype's corpus harness and reads `.ts` files only, never building or running anything from a corpus.
- Test: `rust/crates/sittir-core/tests/nodes.rs` and `packages/tools/tests/backer-parity.test.ts`.

**Interfaces:**
- Consumes: Task 2's `Nodes` and `Kid`.
- Produces: `pub struct RecordNodes<'t>`, built from a `TreeArena`'s rows and the source. It's public because the five-grammar parity test lives in `sittir-parity-tests`. Its `parent` is found from the rows' subtree ends, never with a cursor. It answers every fact of Task 3's `Kid`, and its `missing` and `holds_error` queries, from rows alone.
  - The rows are navigation's one source of node facts.
  - A record node's row repeats the bytes its side record also holds. Both are written once, by the hydrate pass, and never change.
  - Records stay word-identical.

- [x] **Step 1: Failing tests:**
  - `record_nodes_match_tree_nodes`: for every node of each fixture tree in all five grammars, the two backers give equal `kid`, `kids` and `parent`. The fixtures include:
    - (Review Focus 1) a file with an ERROR node and a MISSING token per grammar;
    - (Review Focus 2) python nested blocks, which have indent and dedent, and typescript statements ending by automatic semicolon;
    - (Review Focus 3) non-ASCII identifiers and strings;
  - `records_and_spans_cover_every_byte`: the spike's coverage check as a test. No uncovered byte, no overlap, no token-text mismatch;
  - `record_words_are_unchanged`: Task 1's goldens still pass, because spans and rows sit beside the records;
  - `depth_members_match_the_walk`: for every subtree of the fixtures, the recorded members give the same `between` as `DepthMembers::of`.
- [x] **Step 2:** Run them. They fail.
- [x] **Step 3: Implement.** Spans and rows are written during the hydrate pass. The tree is still kept.
- [x] **Step 4: Run `sittir tool backer-parity`** on matter.js 2078d664893d and next.js 4e5335a00314. 0 differing nodes. Then run the three-way verification in both storages.
- [x] **Step 5: Commit:** `feat(arena): records keep token spans and node rows, read through a record backer`.

### Task 5: Arena render, queries and edits read records; baseline gaps are stamped

**Status:** merged as #1141 (f44d193b2), 2026-11-08. #1142 (e6ea02d86, 2026-11-09) fixed the render slowdown it caused (`Nodes::edge`).

**Files:**
- Modify: `napi_engine.rs` (`ArenaSources`), `arena/view.rs` (`source_root`, `RecordCtx::row_coordinate`) and `arena/prep.rs` (`edited_record`, `RecordPrep::row_coordinate`). In arena storage these read `RecordNodes`. `edited_record` takes the node's existing record and stops re-hydrating.
- Modify: `trivia_table/place.rs` and `engine.rs` (`Lookups::baseline_gap`). A layout run's baseline gap is measured once, when the run is first placed, and kept with it.
- Modify: the `SourceTable` methods that measure (`slot_layouts`, `separator_before`, `sides`, `frames`) take the arenas their caller holds. A render lends the arenas it holds. A napi call made outside a render (`slotLayouts`, `layoutBaseline`) locks its tree's arena and lends it to the same method. In a tree read whole (its rows published), a baseline renders the region's record from its templates over the lent arenas, read-only, with the same Baseline recorder and seating as the reader render. A tree read part-way measures through the tree as before.
- Modify: the consumers Task 3 left on a lent cursor. In arena storage they read `RecordNodes`:
  - `render_read` (baselines);
  - `slot_routes` (slot layouts, separators, siblings);
  - `unit_id`, `delimiter` and `Plan::holds` (descendants, `planHolds`);
  - `read_units`.
  The generated routers take `RecordNodes::kids` as they take `survey`'s children. Snapshot and `readNode` read the node's existing record.
- Test: `rust/crates/sittir-parity-tests/tests/arena_from_records.rs`, since `sittir-core` can't render a grammar's records.

**Interfaces:**
- Consumes: Task 4's `RecordNodes`.
- Produces: in arena storage, `SourceTable::read_ctx` answers `None` after a full hydration, and nothing on the render, query or edit paths asks for the tree.

- [x] **Step 1: Failing tests:**
  - `arena_render_reads_no_tree`: after a full hydration, rendering the untouched, rebuilt and codemod cases in arena storage makes 0 tree accesses, counted by `LayoutWork::tree_reads` in the one function that hands out a `ParsedTree`'s tree;
  - baseline parity: for every layout run of the fixtures and both corpora, the gap measured from the record equals the gap measured through the tree;
  - `a_baseline_gap_is_measured_once`: rendering one tree twice measures each layout run's baseline once;
  - `an_edit_does_not_rehydrate`: an edited render in arena storage writes no record into the `TreeArena`.
- [x] **Step 2:** Run them. They fail.
- [x] **Step 3: Implement.**
- [x] **Step 4: Run the three-way verification** in both storages, then a byte-identical render over all of matter.js and next.js in arena storage, through the validators' corpus mode.
- [x] **Step 5: Commit:** `feat(arena): render, queries and edits read records, not the tree`.

**Follow-up, the lent arena's second read:** `render_built_with` holds the built store's read for the whole render, and `ArenaSources::render_record_entry` takes that read again on the same thread, which deadlocks once a writer queues between the two. One JS thread never queues one, so it can't fail today. The fix is ported in place in `napi_engine`, on its own PR, with no failing test first and no new items (the maintainer, 2026-11-12: "Port without a test"). The code is napi-only and can't be tested where it sits.

### Task 5b: Leaf, ERROR and unit reads take no tree

**Status:** merged as #1164 (3c2f22bee), 2026-11-10.

Task 5 planned these reads on records, but its no-tree test covered render, queries and edits only. Three arena calls still run the typed reader over a tree cursor: `$snapshot()` (Task 5c), the unit sides edits carry, and the object read of a node with no record (a parsed leaf, or ERROR).

**Files:**
- Modify: `engine.rs` (`ParsedTree::read_node`). The ERROR check runs before any cursor is made. `error_at` already answers from rows and the source.
- Modify: `engine.rs` and `napi_engine.rs`. A leaf asked by index (a query item) is answered from its holder's record. The rows' parent gives the holder, and one native call returns the cell naming the leaf's row. Modify `packages/common/src/engine.ts` (`readObjectAt`) to decode that cell with the decoder record views already use. Nothing new is stamped. Number-part interiors already have records, with `ParsedText` captures.
- Modify: `read.rs`. A list item's number (holes counted) becomes one function over `Routed`, called by the list read and the units walk.
- Modify: the units walk runs over `Nodes` in both storages. It takes `slot_routes`' `Route::Slot { slot, scalar }` children, and the sides come from the seating. The Rust emitter stops emitting each grammar's `read_units`, then regenerate.
- Test: `rust/crates/sittir-parity-tests/tests/arena_from_records.rs`.

**Interfaces:**
- Consumes: Task 4's `RecordNodes`; Task 5's `LayoutWork::tree_reads`.
- Produces:
  - `ParsedTree::read_leaf::<N>(&self, index: NodeIndex)`, returning the leaf's stamped kind and span, or `None`. The native walk decodes the holder's cell through `written::<N>`. A unit's span is its row's, because a unit cell holds no span. Over napi it's `readLeaf(treeId, index)`, returning `[kind, start, end]` or `null`. JS `RecordReader.leaf(index)` builds the leaf with record-view's `leafData`, and `readAt` tries the stub, then the leaf, then the native read;
  - `read::slot_items(routes, elided)` and `Routed::slot_items()`, yielding `(child, slot, item)`. They expose the list-item numbering once. `Routed` carries `elided`, from a `ReadSlot::ELIDED` const that replaces the per-type arrival and position overrides;
  - `read::units_of(routed, ctx)`, over `Nodes` for both storages, with sides taken from the seating's `unit_sides`. It replaces `EngineGrammar::read_units` and its generated bodies;
  - `backer_parity` also checks each node's unit sides and leaf read against the stamped coordinate, so `sittir tool backer-parity` covers the corpora;
  - the no-tree count is the existing `LayoutWork::tree_reads`, because every path to the tree passes `ParsedTree::tree()`.

- [x] **Step 1: Failing tests:**
  - `leaf_error_and_unit_reads_take_no_tree`: after a full hydration in arena storage, these make 0 tree reads:
    - `readNode` on an ERROR;
    - `readObjectAt` on an identifier query item and a number literal with parts;
    - the unit sides of a codemod edit;
  - parity, over every node of the fixtures and both corpora in all three grammars: arena leaf reads and unit sides equal object storage's;
  - `a_list_item_is_numbered_once`: a list with a hole gives each unit the same item number from the list read and the units walk.
- [x] **Step 2:** Run them. They fail.
- [x] **Step 3: Implement.**
- [x] **Step 4: Run the three-way verification** in both storages. Records stay word-identical.
- [x] **Step 5: Commit:** `feat(arena): leaf, ERROR and unit reads consume records, not the tree`.

### Task 5c: One snapshot rule for every storage

**Files:**
- Modify: `packages/common/src/snapshot.ts`. A parsed node's snapshot is the node-surface walk (`copyStep`) that built nodes already take, in both storages.
- Modify: `engine.rs` (`SnapshotCtx::span_of`) and `napi_engine.rs`. One native call measures, over `Nodes`, each node's span in a subtree from its holder, with today's `unmeasured` refusal. The walk attaches those spans. A side entry's text and span come through `Nodes`.
- Remove: the typed read inside `ParsedTree::snapshot_node` and `snapshot_in`.
- Modify: the generated `$handleQuery` and `$handleSnapshot` both read a record view's row through `rowOf` → `readObjectAt`, which is a typed read over the cursor. Both move off it in this task, so `$query()` on an arena record view also makes 0 tree reads.
- If the object node surface can't feed the walk a field the native snapshot emits, the PR names the field and stops for review. It never keeps a second snapshot rule.
- Test: `packages/common/tests/snapshot.test.ts` and the snapshot census.

**Interfaces:**
- Consumes: Task 5b's `read::units_of`, for unit sides inside a snapshot (the native walk), and `ParsedTree::read_leaf` through `RecordReader.leaf`, for a bare coordinate the JS walk hydrates.
- Produces: `ParsedTree::snapshot_layouts(&self, root: NodeIndex, holder: Option<u32>)`, which returns each row's snapshot layout as `(row, layout)` pairs in preorder, plus the root's flanks word. It walks rows over `Nodes` with no typed read, holding at `Children` and `Interior` routers, and reuses master's snapshot-mode layout code. Over napi, `snapshotLayouts(treeId, index, holderByte)` replaces `snapshot` (maintainer, 2026-11-12, "Approve"). A layout is needed, not only a span, because a side's ERROR entry reaches JavaScript with no row and the root's edge runs are dropped natively.
- Output change (maintainer, 2026-11-12, "Canonical: renders `ur"a"`"): a snapshot holds a spelled slot's canonical member, so python `UR"a"` snapshots render `ur"a"`. Object storage's read of a spelled slot moves to the canonical member as well, so both storages give the same snapshot. Both changes go in the PR as API rows.
- Object storage's canonical read: `storedSlotValues` on an object node applies its kind's spellings from its `querySlots` row. `QuerySlotEntry` gains an optional seventh element, `spellings?: Readonly<Record<string, string>>`, beside `blank` (the maintainer, 2026-11-12, "Approve both"). It is emitted from `spelledReadOf`, the derivation record views' accessors already pass to `viewSlot(…, spellings)`. The rows are read only when a node stores a string under a storage key. Object data keeps the source spelling, so `$with` and render keep it ("set to the same value keeps the spelling").
- Census (maintainer, 2026-11-12, "Grant 46 → 48"): the python snapshot census gains two entries, "Strings" (`UR'bye'` snapshots as `ur'bye'`) and "Template Strings" (`tr"…"` as `rt"…"`), and (maintainer, 2026-11-12, "Grant Raw strings") a third, "Raw strings" (`fr"…"` as `rf"…"`). All three follow from the canonical ruling. The rewrite also drops the 16 entries that render fixes since the census was last written (2026-10-11) left matching. Against master's own snapshots, which give 29 entries, the pin lands at 32. The other grammars' censuses aren't rewritten.
- API rows (maintainer, 2026-11-12, "Approve all 6"):
  - `Router::Children` carries its kind's routes (`KindRoutes`), and `Router::Envelope` its content's router;
  - `ParsedTree::snapshot_layouts_seated` is public, for tests;
  - `ReadCtx::hold(&Kid, &[Kid])` replaces `hold(&TreeCursor)`, so the typed read no longer holds;
  - `ParsedTree::snapshot`, `snapshot_node` and `snapshot_error` are removed;
  - in `@sittir/common/utils`, `handleQuery` becomes a method record views call on themselves, and `handleSnapshot` is new;
  - `napi_engine::answered` is public, shared by read and `snapshotLayouts`.

- [ ] **Step 1: Failing tests:**
  - `a_parsed_snapshot_takes_no_tree`: an arena snapshot makes 0 tree reads, and so does `$query()` on an arena record view;
  - snapshots equal master's, for every node of the fixtures and both corpora, in both storages and all three grammars;
  - a snapshot of a node holding an ERROR side or a MISSING token equals master's, and an unmeasurable holder is still refused as `unmeasured`;
  - `an_alias_content_snapshots_as_itself`: a parsed alias content's snapshot carries the content's own `$type` and text, not its envelope's, though the two share a row. A snapshot is the node as read, detached. This is the one place output differs from master's, and the PR lists it.
- [ ] **Step 2:** Run them. They fail.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run the three-way verification** in both storages. Object storage's snapshot speed is not a gate. Its output is.
- [ ] **Step 5: Commit:** `feat(snapshot): one snapshot rule for built and parsed nodes in both storages`.

### Task 6: Hydrate at parse and drop the tree inside the read call

**Status:** open as #1183, which builds the held-parse slots this task no longer has. It is reworked to this task's shape, census first.

This is tree lifetime only, as the spec's Tree lifetime section rules. It adds no per-tree owner, slot, table or count, and it designs no node release.

**Files:**
- Modify: `napi_engine.rs` and `engine.rs`. In arena storage, `parse` hydrates the whole tree in the same call, then drops the `tree_sitter::Tree`, the placement scratch and the read caches before it returns. Only the nodes and the source text remain.
- Modify: `arena/built_image.rs`. The LINK record names a node, not a tree, and stays 8 words.
- Remove the branches Task 5 keeps for trees read part-way: `edited_record`'s coordinate branch and the baseline measured through the tree. Every arena tree is now read whole at parse.
- Modify: `packages/common/src/{read,record-view,handle,engine,create-engine,built-arena}.ts`. An arena root holds no `Tree` object and no reference to a tree. The arena's `#trees` and its `holdTree` calls go.
- Modify: `packages/tools/src/validate/layout-runs.ts` and `packages/tools/src/profile/native-hydration.ts`, which release their roots.
- Test: `rust/crates/sittir-core/tests/arena_tree_lifetime.rs` and `packages/common/tests/arena-tree-lifetime.test.ts`.

**Interfaces:**
- Consumes: Tasks 5, 5b and 5c. Arena parses leave the live-tree table here.
- Produces: the census below, as the PR body's first table. Its placement of each field fixes the names later tasks use.

- [ ] **Step 1: The census, before code.** List every field of `ParsedTree` (`engine.rs`) and `TreeArena` (`arena/rows.rs`). Place each in one bin: node data; source text; recomputed from those on demand (with its cost and its readers); or dropped inside the read call. A field that isn't per-tree moves to the engine (grammar, the built-arena `store`) or to the call (the work counters, per Task 10). Say what lazy trivia placement reads after the call. A field that fits none of these goes to brainstorm, which takes it to the maintainer, before any code is written.
- [ ] **Step 2: Failing tests:**
  - a parse in arena storage leaves no live `tree_sitter::Tree` after `parse` returns, through a test-only count;
  - after `parse` returns, arena storage holds no per-tree value besides the nodes' data and the source text, through the same test-only accounting;
  - (Review Focus 5) a built node linking a parsed node renders byte-identical after the parsed root's release;
  - (Review Focus 4) a 10,000-level nested source in each grammar hydrates at parse with no overflow, and the parse call makes no napi call on a grown segment;
  - the LINK record is still 8 words, asserted on `size_of` and in the JavaScript twin;
  - no `Tree` instance is made in arena storage.
- [ ] **Step 3:** Run them. They fail.
- [ ] **Step 4: Implement.**
- [ ] **Step 5: Run the three-way verification** in arena storage, plus Task 4's parity on the corpora and Task 5's corpus render with the tree dropped.
- [ ] **Step 6: Commit:** `feat(arena): an arena parse hydrates at parse and drops its tree inside the read call`.

### Task 7: The measurements

Run on Task 6's branch before its PR is opened. Tasks 2–5 carry the standard CI runs on their own PRs.

- [ ] **Step 1: CI.** Run the paired-refs benchmark and the `oxc-reference` mode against the merge base, in both storages. Report:
  - parse, deep read, and the three render cases;
  - retained memory on matter.js and next.js;
  - each against the ×1.10 bar.
  Anything over the bar is reported before the PR, with its cause.
- [ ] **Step 2: Open Task 6's PR to master.** The body carries the table and checks the spec's memory claim against it. Merge waits for the user's word.

### Task 8: The lock-free census

**Status:** merged as #1174 (3e825bf8f), 2026-11-10.

A ratchet that every later task lowers. Each of Tasks 9–12 starts by lowering its files' ceilings, so its first test fails.

**Files:**
- Create: `rust/crates/sittir-core/tests/lock_free_census.rs`.

**Interfaces:**
- Produces: `const CEILINGS: &[(&str, u32)]`. This holds each `src/` file's count of uses of `Mutex`, `RwLock`, `OnceLock`, `LazyLock`, `Arc`, `Weak`, `Rc`, `RefCell` and `std::sync::atomic`, keyed by its path under `rust/crates/sittir-core/src/`. It lists every file whose count isn't 0.

- [x] **Step 1: Write `lock_free_census_matches_its_ceilings`.** It scans `src/**/*.rs`, skipping comments, `#[cfg(test)]` modules and string literals, and compares each file's count with its ceiling.
  - A file over its ceiling fails, naming the file, its count and the uses found.
  - A file under its ceiling also fails, asking for the ceiling to be lowered. The ceiling equals the count; it never exceeds it.
  - A file missing from `CEILINGS` has a ceiling of 0.
- [x] **Step 2:** Fill in `CEILINGS` from the run at the task's base. Run `cargo test -p sittir-core --test lock_free_census`. It passes.
- [x] **Step 3: Commit:** `test(core): a census of locks, atomics and shared owners, ratcheted per file`.

### Task 9: The engine owns its state; one borrow per call

**Files:**
- Modify: `napi_engine.rs`. `napi_engine!`'s `EngineCell` goes from `Rc<RefCell<Engine<G>>>` to a `RefCell<Engine<G>>` the napi class owns. Every holder of an `Rc` clone today takes the engine per call instead. Any holder that can't is listed in the PR for the maintainer.
- Modify: `engine.rs` (`Engine`).
- Test: `rust/crates/sittir-core/tests/engine_borrow.rs`.

**Interfaces:**
- Produces:
  - `pub fn engine_mut<'a, G: EngineGrammar>(cell: &'a std::cell::RefCell<Engine<G>>, operation: &'static str) -> napi::Result<std::cell::RefMut<'a, Engine<G>>>`, which every `#[napi]` method calls once;
  - the refusal message: `sittir: {operation} was called while this engine is already in a call`.

- [ ] **Step 1: Lower `napi_engine.rs`'s ceiling by the `Rc` uses it removes.** Write `a_second_borrow_of_an_engine_in_one_call_is_refused_by_name`: it holds `engine_mut(&cell, "render")` and asserts `engine_mut(&cell, "parse")` errs with `sittir: parse was called while this engine is already in a call`.
- [ ] **Step 2:** Run `cargo test -p sittir-core --test engine_borrow --test lock_free_census`. Both fail.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run the three-way verification** in both storages, then the census. Both pass.
- [ ] **Step 5: Commit:** `refactor(core): the engine is owned by its object and borrowed once per call`.

### Task 10: Work counters belong to the call, and `kids` fills the caller's buffer

**Files:**
- Modify: `layout.rs`. `LayoutWorkCounter` and its nine atomics, plus Task 5's `tree_reads`, become `LayoutWork`, a plain record.
- Modify: `nodes.rs`. `Nodes::kids` stops returning `Arc<[Kid]>`. `TreeNodes`, `RecordNodes`, `nodes::walk`, `engine.rs`'s `descendants`/`advance`, and `Placer::kids` in `trivia_table/place.rs` follow.
- Test: `rust/crates/sittir-parity-tests/tests/arena_from_records.rs`.

**Interfaces:**
- Produces:
  - `#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)] pub struct LayoutWork { pub region_nodes: u64, pub sibling_items: u64, pub region_fallbacks: u64, pub cursor_climbs: u64, pub sibling_steps: u64, pub root_descents: u64, pub depth_nodes: u64, pub record_nodes: u64, pub gap_items: u64, pub tree_reads: u64, pub kids_listed: u64 }`. It's owned by the call and incremented through `&mut`. The napi `layoutWork` result reports the last call's record.
  - `fn kids(&mut self, index: NodeIndex, out: &mut Vec<Kid>)` on `Nodes`. It clears `out`, then fills it in child order. A walk keeps one reusable `Vec<Kid>` per depth.

- [ ] **Step 1: Lower the ceilings of `layout.rs`, `nodes.rs` and `engine.rs`.** Write two tests:
  - `each_call_reports_only_its_own_layout_work`: it renders one arena tree twice, and the second call's `LayoutWork` equals the first's rather than their sum.
  - `a_first_render_lists_kids_within_its_ceiling`: `LayoutWork` gains `kids_listed`, and on a first arena render of a statement list it stays within a pinned ceiling per visible node, in the descent-ceiling style.
  - A child list that carries a field id nobody reads drops it here, the field-id cost #1137's diagnosis measured.
- [ ] **Step 2:** Run it and the census. Both fail.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run the three-way verification,** backer parity on both corpora, the descent-ceiling tests (unchanged) and the census.
- [ ] **Step 5: Commit:** `refactor(core): layout work is the call's record, and kids fill the caller's buffer`.

### Task 11: The placement and the trivia store are plain data

**Files:**
- Modify: `trivia_table/place.rs`.
  - `Placement` loses `Mutex<State>`, `OnceLock<Published>`, `AtomicBool` and the `AtomicU32` published slots.
  - `Chunks` loses its `OnceLock`s.
  - `Arc<Shape>`, `Arc<Sim>`, `Arc<Plan>` and `Arc<[Kid]>` become values the placement owns, named by index.
- Modify: `trivia_store.rs`.
  - The per-tree parts follow the same rule: sides and edit walks.
  - For each per-engine part (built chunks, buffers), the PR lists whether it is confined to one JavaScript thread. A confined part becomes plain. One shared across threads stays as it is and is named for the maintainer.
- Modify: `engine.rs` and `napi_engine.rs`. Object storage's live-tree table is its one coarse holder.
  - A render borrows the live trees mutably for the call. That's engine-api's note: `ReadTrees` holds each tree's borrow for the call, with references bound to it.
  - Object storage's locks stay outside the shared types.
- Test: `rust/crates/sittir-core/tests/placement_plain.rs`.

**Interfaces:**
- Produces:
  - `Placement::place(&mut self, …)` places sides, and `Placement::side(&self, …)` reads published sides. Neither takes a lock.
  - `struct ShapeId(u32)` and `struct PlanId(u32)` name owned shapes and plans.

- [ ] **Step 1: Lower the ceilings of `trivia_table/place.rs` and `trivia_store.rs`.** Write `a_tree_places_its_sides_through_one_mutable_borrow`. It places every side of a matter.js file through `&mut Placement` and asserts the published sides equal `master`'s, read from the corpus golden.
- [ ] **Step 2:** Run it and the census. Both fail.
- [ ] **Step 3: Implement.** `a_change_to_the_live_trees_while_a_read_holds_them_is_refused_as_an_error` (`engine.rs`) stays green.
- [ ] **Step 4: Run the three-way verification** in both storages, the byte-identical corpus render in arena storage, and the census.
- [ ] **Step 5: Commit:** `refactor(core): placement and the trivia store hold plain data under one borrow`.

### Task 12: Arena state is plain, and chunk memory has one owner

**Files:**
- Modify: `engine.rs`, `arena.rs`, `arena/*.rs` and `napi_engine.rs`.
  - Arena storage's records, slots, items and gaps, its arena, lines and depth members: no `Mutex`, `OnceLock` or atomic. Lazily built values are `Option` fields.
  - Task 5's rows `Arc`: the rows are node data the engine owns, and `RecordNodes` borrows them.
  - The source: owned as `Box<str>`, read as `&str`. `SourceTable::source_of` returns `Option<&str>`.
  - Cached `Arc` values (`Record`, `NodeSlots`, `SlotItems`) become owned values that lookups borrow.
- Modify: `arena.rs`, `arena/memory.rs`, `arena/count.rs` and `napi_engine.rs` (`external_view`, `release_share`, `Buffers`).
  - Chunk memory becomes the engine's alone if every path that frees a chunk detaches its views in the same call first. The external buffer's finalizer then frees nothing.
  - A path that can't is listed for the maintainer, and that structure stays as it is.
- Test: `rust/crates/sittir-parity-tests/tests/arena_from_records.rs` and `packages/common/tests/built-chunk-views.test.ts`.

- [ ] **Step 1: Lower the arena files' ceilings.** Write `freeing_a_chunk_detaches_every_view_first`: it keeps a JavaScript view of a built chunk, releases the node that frees it, and asserts the view's `byteLength` is 0 and that the engine reports the chunk's bytes as freed.
- [ ] **Step 2:** Run it and the census. The census fails, and the view test passes or fails as the code stands. Record which.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run the three-way verification,** the arena corpus render and parity, and the census.
- [ ] **Step 5: Commit:** `refactor(arena): arena state has one owner and no lock`.

### Task 13: The type guard and the measurements

**Files:**
- Create: `rust/crates/sittir-core/clippy.toml`, with `disallowed-types` listing `std::sync::{Mutex, RwLock, OnceLock, LazyLock, Arc, Weak}`, `std::rc::{Rc, Weak}`, `std::cell::RefCell` and the `std::sync::atomic` types.
- Modify: each remaining site gets `#[allow(clippy::disallowed_types)]`:
  - the process-wide init-once statics;
  - the engine cell;
  - object storage's live-tree table;
  - every structure Tasks 11 and 12 listed.
  `CEILINGS` then equals that allowlist.

- [ ] **Step 1:** Run clippy in the four CI configurations. Every remaining use outside the allowlist fails it. Fix or list each one.
- [ ] **Step 2: CI.** The paired-refs benchmark and `oxc-reference`, against the base this task's branch starts from, in both storages:
  - arena storage: parse, deep read, the three render cases and peak RSS, held to "no regression past noise, except planned trade-offs stated with numbers";
  - object storage: correctness gates only.
- [ ] **Step 3: Commit and open the PR:** `chore(core): sittir-core denies locks, atomics and shared owners outside its allowlist`. The body carries the measurements and the list of structures left for the maintainer. Merge waits for the user's word.
