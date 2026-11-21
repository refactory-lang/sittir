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

**Follow-up, the lent arena's second read:** `render_built_with` holds the built store's read for the whole render, and `ArenaSources::render_record_entry` takes that read again on the same thread, which deadlocks once a writer queues between the two. One JS thread never queues one, so it can't fail today. The fix is ported in place in `napi_engine`, inside Task 6's PR (the maintainer, 2026-11-12: "Fold into Task 6's PR"; until Task 6 an arena render still reads a linked node's source through the live-tree table, so the tree-free signature isn't possible sooner), with no failing test first (the maintainer, 2026-11-12: "Port without a test"). The lone-leaf render moves onto `render_at`'s path, which reads the built arena once and references no tree (the maintainer, 2026-11-12: "Yes but it can't reference the tree"), and `render_built_with` is deleted. The code is napi-only and can't be tested where it sits.

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

**Status:** merged as #1193 (25f2ac1ed), 2026-11-12.

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

- [x] **Step 1: Failing tests:**
  - `a_parsed_snapshot_takes_no_tree`: an arena snapshot makes 0 tree reads, and so does `$query()` on an arena record view;
  - snapshots equal master's, for every node of the fixtures and both corpora, in both storages and all three grammars;
  - a snapshot of a node holding an ERROR side or a MISSING token equals master's, and an unmeasurable holder is still refused as `unmeasured`;
  - `an_alias_content_snapshots_as_itself`: a parsed alias content's snapshot carries the content's own `$type` and text, not its envelope's, though the two share a row. A snapshot is the node as read, detached. This is the one place output differs from master's, and the PR lists it.
- [x] **Step 2:** Run them. They fail.
- [x] **Step 3: Implement.**
- [x] **Step 4: Run the three-way verification** in both storages. Object storage's snapshot speed is not a gate. Its output is.
- [x] **Step 5: Commit:** `feat(snapshot): one snapshot rule for built and parsed nodes in both storages`.

### Task 6: Hydrate at parse and drop the tree inside the read call

**Status:** open as #1227 (the codec stage and the tree dropped inside the read call; #1183 is superseded and was closed 2026-11-17 on the maintainer's word, its branch kept). Its landing gate, set 2026-11-14, is measured on CI: render and edit against master's arena, parse plus whole read against object storage. Its gates, Task 6b's speed gate included, are measured on the arm runner only (the maintainer, 2026-11-20: "No need for x64"). On `6664f9dbe` (paired run, Rust 1.100.0): parse plus whole read is ×0.63–0.70 of object, so that gate holds; render is ×1.31–1.46 of master's arena, so that gate does not. The render gap is placement-time navigation, which Task 6c's steps 3 and 4 delete. **Ruled 2026-11-16: "Keep the gate; fold placement into #1227".** Task 6c is built on this branch and the two land as one PR when render and edit meet the gate. Head `3cc483b10`. The order left, all inside #1227 (2026-11-18): the `NodeId` newtype's naming part (one `NodeId` names any arena node, a leaf included; `NodeName` and `Cell::Child`'s tree link go); then the paired run; then Task 6c's steps 3 and 4, with the newtype's render part inside them or right after (the arena builds no `NodeCoordinate`, and the source table and the render's writer take `NodeIdOrCoordinate`), since rewriting the placement-time reads that steps 3 and 4 delete would be wasted work. While steps 3 and 4 are built, the coordinate methods of the source table a render still needs after them are listed, and that list is the render part's scope. **The rest runs straight through** (the maintainer, 2026-11-20: "Can it do the rest in one shot?", then "Once at the end"): Task 6d's proposal goes to the maintainer first; then Task 6c's step 4 remainder, the two parse fixes (hydration's vectors reserved from the tree's node count, and the render options' defaults built once per grammar), Task 6e and Task 6b run without a stop for review. Each commit runs its own targeted tests, red then green, and each piece is pushed so CI runs its suite; the three-way verification, storage parity and the corpus probe run once, on the final head, and a failure there is found by stepping back through the commits. The stop rules are unchanged. One paired run on the arm runner then measures each piece's last commit as a candidate.

This is tree lifetime only, as the spec's Tree lifetime section rules. It adds no per-tree owner, slot, table or count, and it designs no node release.

**Files:**
- Modify: `napi_engine.rs` and `engine.rs`. In arena storage, `parse` hydrates the whole tree in the same call, then drops the `tree_sitter::Tree`, the placement scratch and the read caches before it returns. Only the nodes and the source text remain.
- Modify: `arena/built_image.rs`. The LINK record names a node, not a tree, and stays 8 words.
- The shape, as the spec's Tree lifetime section rules it (2026-11-12): a read hydrates into the engine's built chunks; a node is named by `types::NodeId`, its record's address; a built `Child` cell names a parsed record directly; a named leaf or fixed token is its holder's `NodeId` plus its site; a comment or `ERROR` gets a record; the source is one pooled string, named by a string reference, small sources sharing a chunk; a parsed record carries the rows of its recordless children; `TreeArena` and its `held` and `records` tables go. LINK remains only for a recordless target, as `[header, 0, holder, word, item, 0, start, end]`.
- Modify: `nodes.rs` (the record backer of `Nodes`, over the run; its key is opaque, a record's address or a row's address) and `trivia_table/place.rs` (`Key` and `Order` take `Placer::rank`'s enter and exit numbers for a zero-width token, its rank among the nodes touching its byte, where they took the index and the subtree end; a token with width needs only its bytes). `NodeRows`, reach-by-row and the by-index calls in `parsed.rs` go. No count word, no derived index.
- The read allocates its own chunks and leaves the builders' open chunk alone (`BuiltChunks::alloc_words` seals it today). A parsed entry is placed with a count of 1 and isn't released before dispose. The PR body states the 2^16-chunk cap in corpora.
- Approved 2026-11-13: a recordless node's coordinate is `{ $node, $site, $span, $type }`; no root word on a source's entry; a built record's link to a recordless leaf names holder and cell row; a side record names its rebuilt-from node by record; `builtMemory.live` excludes read records; the addon gains `parseRecords`, `readWords`, `readText`, `readDescendants`, `readPlanHolds`, and `renderBuilt`/`renderBuiltToFile` take a record address; `engine::AdmitEntry` and `entries` on `Engine::render_at`. `stored_layout` passes over `ERROR` and extra subtrees in both storages. Validator tools decode a coordinate against the rendering engine's own arena, same engine only.
- Query results, both storages (approved 2026-11-13): a walk started on an `ERROR` yields nothing (3 rust fixtures go from 36 items to 0), and a named child routed to no slot isn't yielded (typescript's `constructor` name). No `$row` or `$grammar` coordinate field exists. A recordless node's link is holder + word + item, the coordinate's own form. Validator copies of an arena parse are materialized whole.
- Tooling kept (the maintainer, 2026-11-13: "Keep both as tooling"): the validators' diagnostic calls may make a tree in an arena engine and read objects off it, so the no-tree test covers `parse`; `backerParity` takes a source and compares the tree's navigation with the navigation over the read's records. `profile/native-hydration.ts` times parse, render and pipeline, and its `hydrate` and `afterShallow` phases end.
- The codec, in this task: a parsed record embeds no child record (the emitter's inline form, the derive's envelope and the JavaScript decode of an embedded cell go), and the root's record keeps the whole source as its span. Removed as dead with the tree arena (approved by the maintainer, 2026-11-13): `Cell::Coordinate`, the hydrate walks' `depth` and `inline` parameters, and `RecordArenas`, `RecordTrees`, `HeldArenas` and `ReadArenas`, whose callers and the generated `render_record` functions take `reads: Option<&dyn ArenaRead>`. Also removed, approved 2026-11-14: `HydrateNode::hydrate_stamped`, `HydrateInto::rows_by_run`, `write_row` and `held`, and the leaf bit on a parsed node cell's span end, which every such cell set. A side record's row is three words. A built render reads no table of trees; a coordinate of a diagnostic tree that reaches one is refused by name.
- Record-word goldens are retaken once in this task. Render, query and snapshot output stays byte-identical.
- Modify: `napi_engine.rs`, the lent arena's second read (see Task 5's follow-up and the spec's Tree lifetime section). `renderBuiltLeaf` goes through `Engine::render_built_leaf(built, kind, entry, sides, changed, options, entries)` (`arena/built.rs`) on `render_at`'s path, as `renderBuilt` already does, and `render_built_with` is deleted, so no render takes `store.built()` twice. No failing test first, on the maintainer's word.
- Remove the branches Task 5 keeps for trees read part-way: `edited_record`'s coordinate branch and the baseline measured through the tree. Every arena tree is now read whole at parse.
- Modify: `packages/common/src/{read,record-view,handle,engine,create-engine,built-arena}.ts`. An arena root holds no `Tree` object and no reference to a tree. The arena's `#trees` and its `holdTree` calls go.
- Modify: `packages/tools/src/validate/layout-runs.ts` and `packages/tools/src/profile/native-hydration.ts`, which release their roots.
- Test: `rust/crates/sittir-parity-tests/tests/arena_tree_lifetime.rs` and `packages/common/tests/arena-tree-lifetime.test.ts`.

**Interfaces:**
- Consumes: Tasks 5, 5b and 5c. Arena parses leave the live-tree table here.
- Produces: `types::NodeId` and the rows that follow from it (the public `NodeCoordinate`, the side record's fields, `Cell::Child`/`Cell::LinkedLeaf`, the `SourceTable` methods and the addon calls). Each row needs the maintainer's approval before code. **Ruled 2026-11-17 ("Prototype, inside #1227"):** the rows not yet produced (the Rust `NodeCoordinate` type, which still holds `tree`, `index` and `end`; the `SourceTable` signatures; `Cell::Child`/`Cell::LinkedLeaf`) are prototype's, and they are built inside Task 6's PR, evaluated at the end with the PR's other public rows.
- Produces: the census below, as the PR body's first table. Its placement of each field fixes the names later tasks use.
- Produces: `Engine::render_built_leaf(built, kind, entry, sides, changed, options, entries)` (`arena/built.rs`), arena only, internal pub, referencing no tree (approved by the maintainer, 2026-11-14, in place of the `entry_sources_holding` row of 2026-11-12, which is not added).

- [x] **Step 1: The census, before code.** List every field of `ParsedTree` (`engine.rs`) and `TreeArena` (`arena/rows.rs`). Place each in one bin: node data; source text; recomputed from those on demand (with its cost and its readers); or dropped inside the read call. A field that isn't per-tree moves to the engine (grammar, the built-arena `store`) or to the call (the work counters, per Task 10). Say what lazy trivia placement reads after the call. A field that fits none of these goes to brainstorm, which takes it to the maintainer, before any code is written.
- [x] **Step 2: Failing tests:**
  - a parse in arena storage leaves no live `tree_sitter::Tree` after `parse` returns, through a test-only count;
  - after `parse` returns, arena storage holds no per-tree value besides the nodes' data and the source text, through the same test-only accounting;
  - (Review Focus 5) a built node linking a parsed node renders byte-identical after the parsed root's release;
  - (Review Focus 4) a 10,000-level nested source in each grammar hydrates at parse with no overflow, and the parse call makes no napi call on a grown segment;
  - the LINK record is still 8 words, asserted on `size_of` and in the JavaScript twin;
  - no `Tree` instance is made in arena storage.
- [x] **Step 3:** Run them. They fail.
- [x] **Step 4: Implement.**
- [ ] **Step 5: Run the three-way verification** in arena storage, plus Task 4's parity on the corpora and Task 5's corpus render with the tree dropped.
- [ ] **Step 6: Commit:** `feat(arena): an arena parse hydrates at parse and drops its tree inside the read call`.

**Public rows inside Task 6's PR are evaluated at the end** (the maintainer, 2026-11-17: "it can just code - it doesn't have to keep checking with you", then "Across all of 1227 - we can evaluate at the end"). Work on this PR's branch and on branches cut from it does not send a public row for approval before code. Each piece follows the specs' rulings, and the PR body lists every public item added, changed or removed, with a before and after, for the maintainer to evaluate with the merge question. A question the specs do not answer still goes to the maintainer.

**Gates while Task 6's PR is being assembled** (the maintainer, 2026-11-16: "can we bypass the full gates for now?"). Until the PR is ready for its paired run, a commit or a merge into its branch does not wait on the full local three-way verification:
- **Before each commit or merge into the branch:** the targeted tests of what changed, `cargo check` and clippy on the touched crates, and the type-check. Minutes, not the full suite.
- **The full gate is CI on each pushed head:** the test shards, cargo, generated-output drift and the validation rows in both storages. Work continues while it runs. A red check stops the work that caused it for review, with the failing state kept, as always.
- **Push each piece as its own head** (adoptStyle, each placement step, release, the readers, interning), so a red run names one piece.
- **The full local three-way verification runs once,** on the head that goes to the paired run, and again on any head after it. The landing gates themselves (render, edit, parse plus whole read, object rows) are unchanged.

### Task 6b: String-pool interning moves native

**Status:** Built on `feat/arena-text-position` and merged into Task 6's branch at 44fcf67dc: cf6bacfe0 (a string chunk's meta keeps the one written mark), 604bb9328 (built text goes at that mark, in chunks native sizes; `open_strings`, `builtBytes(engine, least)`), e8a1ac2dd (a text encoded in place is claimed where it was encoded). The many-names bench case is 631ac2a18.

The maintainer, 2026-11-12: "needs to be a task '6b'". It was to follow Task 6 as its own PR; the maintainer, 2026-11-16: "let's move 6b to the end, but yes", so **it lands inside Task 6's PR, as its last piece,** after Tasks 6c, 6d and 6e. Task 6 itself changes no interning: its read writes the source into the pool natively, and built text keeps its JavaScript path until this task.

**Facts this task starts from** (measured on Task 5c's head, arena storage):
- `BuiltArena.entry(kind, text)` (`built-arena.ts`) interns built text in JavaScript: a `Map` lookup per call, and on a miss an encode, a `Chunks.alloc` and a copy into a chunk native handed out whole (`builtBytes`). The write position is JavaScript's.
- The bench is almost all hits: building or editing 2,000 functions makes 2,000 calls and 1 miss; a corpus codemod edit and a parse make none. No bench case builds many distinct names.
- Parsed text is not interned. A parsed leaf is a span into its source's one string.

**Files:**
- Modify: `packages/common/src/built-arena.ts` (`BuiltArena.entry`, `Chunks`) and `rust/crates/sittir-core/src/{arena.rs,napi_engine.rs}` (`Arena::intern`, the addon's intern call). The pool has one writer and one write position, native's.
- Test: a bench case that builds many distinct names, added before the change so the miss path has a base.

**Interfaces:**
- Consumes: Task 6's native source write.
- Produces: the addon's intern call and `BuiltArena.entry`'s new internals. Their API rows go to the maintainer before code.

- [x] **Step 1: The proposal, before code.** The shape that crosses less than once per `entry()` call, with the call and miss counts on the rebuilt, codemod and many-names cases, and its API rows.
  - **Counts on Task 6's branch** (arena storage; a miss is an entry not returned before): building 2,000 functions each with its own `x` node, 2,000 calls and 1 miss; editing each name to `g`, 2,000 and 1; building `x0`…`x1999`, 2,000 and 2,000; the corpus parse, render and same-value edit, none. Today's crossings for strings are whole-chunk fetches (`builtBytes`): 1 for the one-name build, 5 for 2,000 distinct names, 9 for 8,000.
  - **Ruled 2026-11-16, replacing a shape approved earlier the same day** (one addon call per miss, `writeBuiltEntry`, which would have made 2,000 crossings where today makes 5): "it shouldn't be a call into native, it should be a write into shared memory". A miss writes the entry into the pool's native memory through JavaScript's view of it, with no crossing; a crossing happens only when a chunk has to be opened. Arena storage already refuses a runtime without external array buffers (Electron's memory cage), so this needs no second path.
  - **Scope, ruled 2026-11-16: "One position for built text; sources keep their own chunks".**
    - Each string chunk's `used` is a word in its meta, beside the cell count JavaScript already views; the meta grows from 4 bytes to 8 (`count::CELLS_META_BYTES`). Every writer of built text appends at that word.
    - Which chunk each side appends to is not shared, and no store header is added (approved, then dropped as unneeded once sources were left out): the position is each chunk's `used` word, which both sides view, so two writers can't collide in a chunk. Native keeps its own pointer to its open chunk, and JavaScript its last one; when JavaScript's fills, `builtBytes` hands it native's open chunk if that has room. Native writes no built text in production, only on the test path.
    - The addon's `builtBytes(engine, least)`: native picks the size by its own growth rule and answers the open chunk when it still has `least` bytes of room. One crossing per chunk, as before. JavaScript's `FIRST_STRING_BYTES` goes; native's rule is the only one.
    - `BuiltChunks::alloc_bytes` is renamed `open_strings(least)`. The test-path writer's own position goes.
    - JavaScript encodes straight into the chunk at the position (`encodeInto`), one copy instead of two.
    - **Sources stay in chunks of their own.** Task 6's "the read leaves the builders' open chunk alone" stands, so a parsed source's bytes are never kept alive by an unrelated built entry.
    - **Expected effect, measured locally:** little on the many-names case (the single copy is the only gain); this is a cleanup from three write positions for built text to one. The entry format's writer stays in both languages; its constants are the encoding-constants issue's ground.
  - **Built in parallel** on a branch cut from Task 6's branch, merged into it last; one paired run on this task alone before that merge, so its effect is separable from placement's.
- [ ] **Step 2: Failing tests:** the pool's write position is native's alone; a built string interned twice has one entry; a build's text renders byte-identical. The write-position and render tests exist (`a_native_entry_lands_past_what_javascript_wrote_and_javascript_appends_past_it`, `the_open_string_chunk_is_answered_while_its_written_bytes_leave_room`, the three `built-arena.test.ts` cases, and `render-built.test.ts` 'answers the string chunk an entry was written into…'); no test yet pins that a built string interned twice has one entry.
- [ ] **Step 3:** Run them. They fail.
- [x] **Step 4: Implement.** cf6bacfe0, 604bb9328, e8a1ac2dd.
- [ ] **Step 5: Run the three-way verification** in arena storage, and the speed gate: arena is not slower on the arm runner on the rebuilt, codemod and many-names cases.
- [x] **Step 6: Commit:** `feat(arena): the string pool is interned natively`. Landed as the three commits above.

### Task 6c: A parse places comments; whitespace placement is deleted

**Status:** in progress on Task 6's branch `feat/arena-hydrate-at-parse`. Step 1 was built on `probe/comments-at-parse`, cut from it 2026-11-16, and is merged into it. Built since, both storages: gaps taken from the options, a layout run kept only beside an extra, `ERROR` or member (e7c1b959a) and only while that entry sits between its gap's own two tokens (f43e53dd4); the line end after a line-terminated extra a slice ends in (004aeda56). Step 2's compact entry, built by the engine-api session from Task 6's branch (114d52596), is merged into it (d6f72d468), and so is engine-api's rule that the options never write whitespace a grammar's `extras` do not admit (05e55dd2e, merged in 6cde4f4f7). Step 2's fact is built in the lookup both storages share (b09726a64): a rebuilt list writes one blank line before an item the source set apart, the larger of that and an options arm. Its arena parse half stores the entry first on the item's leading side for step 3 (4c541b8fb), and the step-1 parity test holds parse and lookup to the same items on every fixture. Its paired run against c5dd2d9f3 measured 2.6–5.9% on arena parse, which the maintainer did not accept. Profiled, the cost was the parse's bookkeeping around the scan and a classification of the blank-line text on every parse, not the scan; both are removed (b1a800ef7) and the scan stays. The paired run of that head (44161938027, ARM Neoverse-N2) does not confirm it: arena parse against c5dd2d9f3 is scm +7.0% and python, rust, typescript and regex within ±1.9%, while a parse allocates what c5dd2d9f3's does, so the parse cost is open for a native profile of the parse on the runner. The render's extra allocations were the lookup routing every holder whose child's leading side was asked; it now routes only a holder whose span holds a blank line, which the tree's line table finds once (e05b59430); a holder whose only blank line lies inside a child is routed and sets none of its own items apart (82309156d). Where the fact is held (on the node's record or in the store) is costed for the maintainer before step 3. An item whose neighbour changed drops the fact, as the edit spec rules for a changed edge, and in arena storage an item read through an element wrap is judged by its wrapped member, as in object storage (a5ef4848e). Approved by the maintainer 2026-11-15. **It lands inside Task 6's PR** (ruled 2026-11-16), not after it: its steps 3 and 4 are what bring Task 6's render under its gate. Step 3 is built, both storages, and is waiting on its paired run: a render reads the sides the parse placed; an edited arena side reads its entries as placed coordinates while its node still renders as source; the object placer places an entry by its place in the tree, as the arena does. A gap's run follows the source after a comment as between list items: two line breaks write a blank line and three or more a double blank line (the maintainer, through the brainstorm session: "Double_blankline is a layout kind", "Both follow the run"). A snapshot expands a written coordinate on the JavaScript side, in `detachedLayout`. Storage parity is 0 apart on every check, so D1 and D2 are closed: the accepted write-back differences are removed, and record_render's fourteen pinned sources render alike and are unpinned. The validation report is unchanged against the branch head, and the rust default-diff ceiling falls from 749 to 743.

**Object storage is deferred** (the maintainer, 2026-11-16, asked how object storage places comments once the placer is deleted: "Can we defer this? I don't want to invest too much time in object storage"). Steps 3 and 4 are done for arena storage only. Object storage keeps its placer and its lazy placement untouched; no walk is added to its parse and nothing of its path is rewritten. What that leaves open is already ruled, so no list is taken before step 3 (the maintainer, 2026-11-19): object storage is deferred (2026-11-16, above); both storages take gaps from the options (2026-11-16, below), so the deferral leaves no difference in output; both storages decide owners with the one `owner` function; and the fourteen sources below, in two groups, are D1 and D2, which the maintainer ruled known and intentional on 2026-11-18. Step 3 is checked by `sittir tool storage-parity` and the storage differential: a difference beyond D1 and D2 (write-backs above rust 6, python 1 and typescript 1, any list rebuild, any snapshot, render or layout-run difference) stops the work for review. Three ways to close it later were costed (a walk at object's parse, the shared rule run lazily, the placer kept for comments only); none is chosen. With the compact entry, fourteen edited sources of the record-render corpus render apart, in two groups: the in-line gap beside an `ERROR` or a line continuation, which the compact entry does not keep and the options write (typescript 143, 162 and 2792, rust 392, scm 403, python 1084 and 1091), and a root whose side holds comments alone, around which the two storages place the line break differently (rust 3487–3489, 3491, 3492 and 3495, scm 9); all fourteen are pinned in record_render's expected-divergence list.

**Both storages take gaps from options** (the maintainer, 2026-11-16: "Yes, both storages take gaps from options"), so the deferral leaves no difference in output. In the lookup both storages share, an unwritten side stops emitting the source's stored whitespace and keeps only its depth members, and list slots stop storing a source layout. Object storage still places its comments lazily through its placer. It is done before step 3's arena side, so both storages move together and the expectations are retaken once. Since step 2's fact (b09726a64), an edited parsed tree in either storage keeps one blank line before each list item the source set apart; other blank lines go, except a run kept beside a comment until step 3.

**Step 2's form** (2026-11-16): the entry form stays, on a compact entry built first ("One compact entry, inside #1227 before step 2").
- **Why:** a store entry is 112 bytes, the width of its widest arm (a typed trivia node holding text), and arena storage does store that arm: layout members and text entries JavaScript writes into a side decode to typed nodes. On a comment-heavy 199 KB rust file step 1's comment sides retain 137 KB.
- **The entry:** one ordered list per side, as a built node's `$trivia` is; a comment is its record pointer (a kind and an address, 8 bytes; the entry's store handle is already stripped on insert and put back on read), and a layout member is its one-byte kind (they carry no payload, and blank line and double blank line are already among them).
- **Where:** converted at the store's two boundaries, compact on write and expanded on read, so render and object storage's own side rows don't change.
- **Rejected:** two tables, one for layout and one for comments. The order has to be stored either way, a side holding both pays two lists and a merge on read, and it stops matching the built sequence.
- **By arithmetic from measured sizes:** that rust file's comment sides go from 137 KB to about 28 KB, of which 19.5 KB is the 48-byte row per side; step 2's blank lines cost at most 21 KB there in place of 60 KB.
- **Rows before code:** the store's new entry type, what a plain text entry does in arena storage (kept behind a pointer, or refused), a coordinate refused on insert, and whether object storage's built nodes write the same rows.

**Spec:** `docs/superpowers/specs/2026-11-15-parsed-comments-at-parse-design.md`. Its "Order" section is this task's step list, and each step is measured on a paired run against master's arena before the next.

- [x] **Step 1:** comments and ERRORs placed in the hydration walk, stored where no render reads them, with the parity test green on every fixture. No output change.
- [x] **Step 2:** the blank-line entry between list items. Ticked by the maintainer 2026-11-19 ("Tick it"), after the CI parse, render and retained-memory cells of paired run 44583539499. Where the entry and an options arm fall on one gap, the gap takes the larger (the maintainer, 2026-11-17: "The larger of the two"); its tests: the entry alone (1), the arm alone (2, the source had none), both (2), a run of 4 after a python class (2).
- [x] **Step 3:** a render reads the parse-placed sides; the baseline, deviations and runs are deleted; expectations retaken once. Ticked 2026-11-20 on the maintainer's word through the brainstorm session, after paired run 44810456624 (arm, Neoverse-N2): arena render is 0.74–0.97 of master's arena in python, rust, typescript and scm. Regex render and the arena parse beyond whole hydration stay open on the landing gate. A blank-line run before a comment on its own row is kept on every side (9e2cef813).
- [ ] **Step 4:** the placer and per-tree placement are deleted, from arena storage only; object storage keeps its lazy placer (the maintainer, 2026-11-20: "Keep object's"). Its parts, in order, each its own commit, then one paired run on the arm runner with the step's first commit as a candidate:
  - one rule gives a list's edge item, which arena's render asks and object's placer calls (774237b9d);
  - the id hasher spreads keys whose low bits are zero, which had made an arena render of a built list quadratic (c25ebbe80);
  - `owner` passes a leaf the model keeps as a fixed token or flag, as a built node holds no side there; built as the user's ruling narrowed it, a flag passes a comment forward to the slot it qualifies and a fixed token is as before (01584cd61);
  - no placement on a `Records` tree;
  - the render-side gate: the grammar's named-extras fact, and the read's sorted entry starts, a render's cursor into them and a range query for the readers outside its walk (the comments spec, "Comment work is gated…" and "A render stops looking…").
  - Costed and parked (the maintainer, 2026-11-20: "Park it"): a render that runs each node's prepare as it reaches it, carrying the facts in a frame, in place of the separate prepare pass and its overlay. Every fact in the overlay flows from a node to itself or from a holder down to a child or a descendant through wrappers, with one bit of lookahead, and only the render reads it; but the overlay is 0.1–0.2% of the corpus render on the arm runner (profile 44836365460), showing only on a 49,153-item built list. Taken up if a real workload shows the prepare pass.
- [x] **Step 5:** a census of what still reads the plain token rows. Taken 2026-11-17 by the engine-api session (`docs/superpowers/probes/2026-11-17-read-coordinate-census/`): fixed-token rows, classed by role (the rule's own text that no slot holds), are 16.3% of a read's words on matter.js and 13.5% on next.js, and four readers of a fixed token's offsets outlive steps 3 and 4 (spacing boundaries, depth moves, a list's trailing separator, re-indenting inside multi-line tokens). The maintainer, 2026-11-17: "Since we are no longer preserving white space that really needs to go". Removing the rows entirely is specified in `docs/superpowers/specs/2026-11-17-read-without-fixed-token-rows-design.md` and is the next task after this one.

### Task 6d: One release for parsed and built records

**Status:** ruled 2026-11-16; its proposal approved 2026-11-20 (the maintainer: "A: release like built"). **It lands inside Task 6's PR** (the maintainer, 2026-11-16: "all of 6 should be in 1227"). The spec's "Rulings since" section names the two sentences it replaces. The design is the 2026-11-16 table with three corrections: the source text takes one count per parsed side record and lives while any record naming an offset into it does; a link record (a built cell to a parsed leaf) holds a count on its holder's record, so a kept linked leaf still renders after its root's release; and `take_trees` and the trees list in the release reply go, since nothing reads them. Releasing a parsed root drops its count and cascades over its parsed cells, the run entries no cell names, its side record's token runs and its placed sides; a read chunk is freed by `BuiltChunks::release` when its last live entry dies, as a built chunk is. A node a built record still names keeps answering. JavaScript holds no record (the maintainer, 2026-11-20: "And js shouldn't hold any records", as the shared-arena spec's "A read handle holds nothing" already says): a node view is an uncounted borrow, so a parsed node named only by a view stops answering at its root's release with the released-arena message, as a released built node does, and the proposal's fourth correction (a count for a record JS holds, through a count meta in `read(chunk)`'s reply) is dropped. No per-parse count, no clone on attach. The new `pub` item (the cascade's parsed-cell walk) is listed in the PR's public changes.

**The proposal, approved 2026-11-16 ("Approve"):** releasing a parsed root behaves as releasing a built one. No parse cost is added, since every read record is already placed with a count at parse.

| what | before | after |
|---|---|---|
| releasing a parsed root (`engine.release(root)`, dispose) | not released; its records stay until the engine is disposed | drops the root's count and runs the same cascade as a built record: cells, runs, side record, store entries |
| a built cell naming a read record | takes a count that is never dropped | the count is dropped when the built record is released |
| `BuiltChunks::release` | returns at once for a read chunk | no early return |
| the cascade over a parsed record | none | walks the record's parsed cells, since a parsed record's layout differs from a built one's |
| a parsed node's placed sides | dropped with the arena | dropped where a built record's sides are |
| the source entry | held once, freed with the arena | held by the root and by each link record; freed when the last holder goes |
| read chunks | freed at dispose | freed when their last live entry dies, as built chunks are |

Example: parse a large file, keep one function rebuilt from it, release the root. Before, every read chunk stays until dispose; after, every chunk is freed except those holding the records the kept function names. `Engine.release`'s JSDoc changes with it. No new public item.

**Four corrections found against the code, proposed and not approved.** They were recorded here as approved on a misread reply; the maintainer's "yes" was to having the other model costed first (below), so these are held:
1. **The source's holders.** The table's "held by the root and by each link record" would free the text under a live record, since a built cell can name a parsed record directly with no link record. Every parsed side record holds the source instead, one count per side record added once at the end of the parse, so the source goes with the last parsed record, whoever held it.
2. **JavaScript counts a parsed record it names** by writing the count in shared memory: the addon's `read(chunk)` reply carries the chunk's count meta beside its words, as `builtWords` does. No call per hold.
3. **A link record holds its holder's record,** so a linked leaf still renders after its root is released. The `trees` list a released link record reported (`take_trees`, the release reply) is removed; nothing reads it.
4. **A parsed root's count is its handle's,** so a second release is a no-op as for a built root, and a builder that puts the root into a built record moves the count. `BuiltChunks::release`'s sides callback also receives a released parsed record's source, so its placed sides are dropped.

**What a build shares and what it copies.** A string argument, and the captured strings of a parsed record being edited, are copied and interned into the built pool. A parsed child record is named by its address and a parsed leaf by a link record; both keep reading spans of the source. **Being costed, not ruled:** the maintainer's model, in which only the parsed tree reads spans and a reference from elsewhere clones the text ("the moment another node wants to reference in, perhaps the gate being that it's attached to a different root, it clones the span"), so that "the lifetime of the source can match the lifetime of the root". Its benefit is a release with no walk over parsed records and no per-record count. What it has to answer: which root, since an edit's new root shares every untouched subtree of the original; where the clone gate can be seen when a build is bottom-up and has no root yet; and what a kept fragment costs without a detached copy. The engine-api session costs it from code before any more of this task is built.

**Held, 2026-11-17: "Hold 6d until the new spec is written".** The models weighed and what was found:
- **Clone on attachment or at render,** so a source's lifetime could match its root's: an edit makes one built record naming the parsed children and rebuilds nothing above it, a record can later sit under any number of roots, so the clone can't be decided when a record is built; made to work it needs a count per parse, a native deep copier (text is about 5% of what a read holds) and a cell rewritten in place.
- **No "parse" unit:** the maintainer, "a parse is no longer supposed to be a thing; it's supposed to be dropped, leaving only its source". Records are nodes, counted one at a time; the source is one entry in the string pool.
- **Counting the source per span** misses the readers that hold no text cell (header-only records, zero-width nodes, an untouched node's one slice); one count per parsed record covers all of them.
- **A span as a pool entry that carries its source** was measured by a census of every stored coordinate (`docs/superpowers/probes/2026-11-17-read-coordinate-census/`): it costs more words than the inline offsets it replaces, and the source lives as long under it as under one count per record. The census's winner is a different change, a read with one-word parsed cells and no row for a fixed-text token, which gets a spec of its own after this task.
- **Release is decided with that spec,** since both change what a parsed record holds. Until then a parsed record is released as it is on this branch (with the engine), and the four corrections above stay proposed. The spec is written (`docs/superpowers/specs/2026-11-17-read-without-fixed-token-rows-design.md`) and finds the release rules are the same under the new layout; asked then, the maintainer ruled "Keep holding" (2026-11-17), so release waits until the row removal has landed and been measured, and Task 6's PR lands without this task.
- **Already built and kept, independent of the model:** the built-cell walker, the reachability fix for a built record naming a parsed one, and the fix for a released side record's token runs.

**Who and where:** built on the branch cut from Task 6's for Tasks 6b and 6e, on Task 6e's `CellWord` accessors and `side_of`; `count.rs` is not touched by Task 6c's steps 3 and 4.

### Task 6e: One reader for each fact a record's words hold

**Status:** ruled 2026-11-16 ("let's fix the 14 functions"); outline accepted 2026-11-16. **It lands inside Task 6's PR** (the maintainer, 2026-11-16: "all of 6 should be in 1227"), which replaces the earlier "no code until Task 6 merges". It is built on Task 6's branch after Task 6c's steps 3 and 4, which delete some of the functions it lists; a reader in a file those steps don't touch may be added earlier. The list is re-taken on the branch as it stands when the work starts.
Readers 1–3 are built in files Task 6c's steps 3 and 4 don't touch: `side_of` (60d9da527), the `CellWord` accessors (bf2decf5f), and the walker in `cell.rs` (401673bba). `admit.rs` and `count.rs` read through them (5786f5879, 1183243da), and the test image writes through the cell codec (6cc9aa93b). Still to move after Task 6c's step 4: `run_nodes.rs`, `prep.rs`, `view.rs` and `built.rs`.

A census on Task 6's head (`b30da527d`) found 15 functions in 7 files that read a record's words by hand: a literal index, a shift or a mask, beside the function that already knows that fact. The count first reported from master, 14, was wrong in both directions; several of those read through the views already, or are writers.

None of the 15 can go through a typed, derived view: each walks a record by its kind's shape, not as a node type. What each can do is read a fact through the one function that owns it. Three shared untyped readers, plus the existing `parsed_cells`:

1. **`ArenaRead::side_of(at)`,** beside `header_kind` in `borrowed.rs`: the side record's address, header word 1. Replaces the literal `words[1]` or `header[1]` in `admit.rs` `admit`, `count.rs` `release_record`, `run_nodes.rs` `source_of` and `read`, `prep.rs` `SlotAt::of`, and `view.rs` `record_of` and `linked_leaf_place`.
2. **`CellWord` accessors in `cell.rs`** (`address()`, `edges()`, a constructor from an address or an entry): the built cell word's bits. Replaces `word >> 2`, `word & 3`, `at << 2` and `entry * 4` in `count.rs` `drop_cell`, `release`, `release_record` and `reaches`, and `built.rs` `admitted_leaf`.
3. **One walker over a built record's cells,** yielding each cell's shape, item and raw word, with decoding left to the caller: `admit.rs` `for_each_built_cell`, moved to `cell.rs` beside `CellWord` (2026-11-16: `view.rs` is held for Task 6c's steps 3 and 4, and Task 6d's cascade needs the walker before then; it may move beside `view.rs` `parsed_cells` after step 4). Admission decodes what it yields, since it validates bytes JavaScript wrote before a view may trust them. Release counts the raw words and decodes no text. `count.rs` `reaches` and `release_record` use it in place of their own walks.
4. **`parsed_cells`,** as it is, for `site.rs` `site_row` and `row_sites`; and `cell.rs` `linked` and `ListCell::items`, as they are, for `count.rs` `release_held`.

Any new `pub` item among these is a row for the maintainer before code.

- [x] **Step 1: The outline.** Accepted 2026-11-16.
- [ ] **Step 2:** the list re-taken on Task 6's branch after Task 6c's step 4.
- [ ] **Step 3: Implement,** one commit per reader, then one per file moved onto it, in the order above. Renders and record goldens stay byte-identical.
- [ ] **Step 4: A guard:** a source scan that fails on a shift or mask against a cell word, a literal index into a record's header, or a cell decode, anywhere outside `cell.rs`, `side.rs`, `borrowed.rs`, the two walkers and the derived views. Its list of exceptions is empty when the task ends.
- [ ] **Step 5: The three-way verification** and a paired run; a refactor with no behaviour change moves no row.

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
