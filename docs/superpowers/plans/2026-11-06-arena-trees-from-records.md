# Arena Trees From Records Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task by task. This repo's rule is no subagents for code. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** an arena parse hydrates the whole tree at parse and drops tree-sitter's tree. Render, query and edit answer every question from records, token spans and node rows, through one navigation interface that object storage serves from its tree.

**Architecture:**
- A navigation interface gives a node's facts (`Kid`), its children in order and its parent.
- The tree backer reads tree-sitter's tree with one cursor that moves locally. The record backer reads records, token spans and node rows.
- Trivia placement, the `SourceTable` methods and the engine's tree functions run once, over the interface, in both storages.
- The arena holds each parse in a counted held-parse slot.

**Tech stack:** Rust (`sittir-core`, `sittir-node-macros`), the TypeScript engine in `packages/common`, and the tools' validators and benchmarks.

**Spec:** `docs/superpowers/specs/2026-11-06-arena-trees-from-records-design.md`. Read it first. It replaces Task 4 of `docs/superpowers/plans/2026-11-06-trees-as-objects.md`.

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
- **File overlap with engine-api's plans:** before starting a task, compare its files with engine-api's open branch. A task that overlaps waits until that branch merges. Task 6 starts only after the tree-holders plan's Tasks 1–3 and 5 have merged.
- **No napi or V8 call runs off the JavaScript thread, or on a grown stack segment.** Render stays a recursive descent.
- **A tree's bytes and strings stay native.** No source copy on the JavaScript heap, and no bulk source crossing.
- **Object storage keeps its representation.** Only its tree backer's cursor movement changes.
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
5. **A built node that links parsed nodes from a released parse root.** The parse stays held until the link goes, and a stale read handle is refused by name, never reading a reused slot. Owned by Task 6.

---

### Task 1: The single cursor pass

In flight as its own PR (prototype). Goldens from master, then the pass, with records word-identical. This plan starts after it merges.

### Task 2: The navigation interface, its tree backer, and the placer on it

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

- [ ] **Step 1: Failing tests:**
  - `tree_nodes_match_the_tree`: for every node of one fixture tree per grammar, `kid` and `kids` equal what `Kid::of` and a fresh child walk give today, and `parent` equals the cursor's parent;
  - `tree_nodes_never_descend_from_the_root_in_a_sweep`: a preorder sweep of `kids` over a fixture makes 0 root-down moves, through a test-only counter.
- [ ] **Step 2:** Run them. They fail (no `nodes` module).
- [ ] **Step 3: Implement.** The tree backer moves its cursor from where it last stood: to a child, a sibling, or up to a common ancestor. It descends from the root only when the target isn't under its current path.
- [ ] **Step 4: Run the three-way verification** in both storages. Placement parity, lazy against eager, stays 0 on every grammar and on matter.js.
- [ ] **Step 5: Commit:** `refactor(core): trivia placement reads its tree through a navigation interface`.

### Task 3: The `SourceTable` methods and the engine's tree functions on the interface

**Files:**
- Modify: `engine.rs`. The `SourceTable` implementations for `ParsedTree`, `ReadTrees` and `WithoutLayout`, plus `cursor_at`, `row_coordinate`, `line_starts_inside_tokens`, `last_list_child`, `edge_child`, `frame_levels` and `Lookups::baseline_gap`. Each reads through a `TreeNodes`.
- Modify: `napi_engine.rs`, the engine's tree functions (`descendants`, `siblings`, `planHolds`, `snapshot`, `text`, `coordinate`, the layout baseline, stored layout, `slotLayouts`, `separatorBefore` and `framedSpan`), plus `ArenaSources`.
- Modify: `prepare.rs` (`ListTrees`) where it reads a tree.
- Test: `rust/crates/sittir-core/tests/nodes.rs`.

**Interfaces:**
- Consumes: Task 2's `Nodes` and `TreeNodes`.
- Produces: nothing new. After this task, no function outside `nodes.rs` moves a tree-sitter cursor except the reader's hydrate pass.

- [ ] **Step 1: Failing tests:**
  - `no_tree_query_descends_from_the_root_per_call`: rendering the codemod case (one rename, one argument set, one statement inserted, as prototype's render profile) makes at most one root-down move per render call, through the Task 2 counter;
  - `line_starts_inside_a_multiline_token_hold`: a typescript template string and a python triple-quoted string spanning lines, with a multi-byte character before each, give the same line starts as today (Review Focus 3).
- [ ] **Step 2:** Run them. They fail.
- [ ] **Step 3: Implement.** Logic is unchanged. Only the way each function reaches a node changes.
- [ ] **Step 4: Run the three-way verification** in both storages, and rerun prototype's render profile cases 2 and 3 locally to confirm the cursor share drops. CI numbers come in Task 7.
- [ ] **Step 5: Commit:** `refactor(core): the source table and tree functions read through the navigation interface`.

### Task 4: Token spans and node rows in arena records, and the record backer

**Files:**
- Modify: the hydrate derive (`sittir-node-macros/src/hydrate.rs`) and `arena/hydrate.rs`. Every child the records don't otherwise name gets a token span (index, start, end). These are anonymous tokens, extras, named units and flags, and named children a template writes.
- Modify: `arena/rows.rs`. A `TreeArena` keeps each node's row: index, span, subtree end and kind.
- Modify: `nodes.rs`, adding the record backer.
- Create: `packages/tools/src/validate/backer-parity.ts`, registered as `sittir tool backer-parity`. It's driven by prototype's corpus harness and reads `.ts` files only, never building or running anything from a corpus.
- Test: `rust/crates/sittir-core/tests/nodes.rs` and `packages/tools/tests/backer-parity.test.ts`.

**Interfaces:**
- Consumes: Task 2's `Nodes` and `Kid`.
- Produces: `pub(crate) struct RecordNodes<'t>`, built from a `TreeArena`, its token spans and the source. Its `parent` is found from the rows' subtree ends, never with a cursor.

- [ ] **Step 1: Failing tests:**
  - `record_nodes_match_tree_nodes`: for every node of each fixture tree in all five grammars, the two backers give equal `kid`, `kids` and `parent`. The fixtures include:
    - (Review Focus 1) a file with an ERROR node and a MISSING token per grammar;
    - (Review Focus 2) python nested blocks, which have indent and dedent, and typescript statements ending by automatic semicolon;
    - (Review Focus 3) non-ASCII identifiers and strings;
  - `records_and_spans_cover_every_byte`: the spike's coverage check as a test. No uncovered byte, no overlap, no token-text mismatch;
  - `record_words_are_unchanged`: Task 1's goldens still pass, because spans and rows sit beside the records.
- [ ] **Step 2:** Run them. They fail.
- [ ] **Step 3: Implement.** Spans and rows are written during the hydrate pass. The tree is still kept.
- [ ] **Step 4: Run `sittir tool backer-parity`** on matter.js 2078d664893d and next.js 4e5335a00314. 0 differing nodes. Then run the three-way verification in both storages.
- [ ] **Step 5: Commit:** `feat(arena): records keep token spans and node rows, read through a record backer`.

### Task 5: Arena render, queries and edits read records; baseline gaps are stamped

**Files:**
- Modify: `napi_engine.rs` (`ArenaSources`), `arena/view.rs` (`source_root`, `RecordCtx::row_coordinate`) and `arena/prep.rs` (`edited_record`, `RecordPrep::row_coordinate`). In arena storage these read `RecordNodes`. `edited_record` takes the node's existing record and stops re-hydrating.
- Modify: `trivia_table/place.rs` and `engine.rs` (`Lookups::baseline_gap`). A layout run's baseline gap is measured once, when the run is first placed, and kept with it.
- Test: `rust/crates/sittir-core/tests/arena_from_records.rs`.

**Interfaces:**
- Consumes: Task 4's `RecordNodes`.
- Produces: in arena storage, `SourceTable::read_ctx` answers `None` after a full hydration, and nothing on the render, query or edit paths asks for the tree.

- [ ] **Step 1: Failing tests:**
  - `arena_render_reads_no_tree`: after a full hydration, rendering the untouched, rebuilt and codemod cases in arena storage makes 0 tree accesses, through a test-only counter on `TreeNodes`;
  - `a_baseline_gap_is_measured_once`: rendering one tree twice measures each layout run's baseline once;
  - `an_edit_does_not_rehydrate`: an edited render in arena storage writes no record into the `TreeArena`.
- [ ] **Step 2:** Run them. They fail.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run the three-way verification** in both storages, then a byte-identical render over all of matter.js and next.js in arena storage, through the validators' corpus mode.
- [ ] **Step 5: Commit:** `feat(arena): render, queries and edits read records, not the tree`.

### Task 6: Hydrate at parse, drop the tree, and hold each parse in a counted slot

**Files:**
- Modify: `napi_engine.rs` and `engine.rs`. In arena storage, `parse` hydrates the whole tree in the same call, then drops the `tree_sitter::Tree`. The parse's `TreeArena`, token spans, rows, source buffer and placed sides go into the engine arena's held-parse table. Root release drops the root's count.
- Modify: `arena/built_image.rs`. The LINK record's tree word names a held-parse slot.
- Modify: `packages/common/src/{read,record-view,handle,engine,create-engine,built-arena}.ts`. An arena `TreeHandle` carries the slot and the parse id, and holds no `Tree` object. `handleDispose` on a parse root releases the root's count. The arena's `#trees` and its `holdTree` calls go.
- Modify: `packages/tools/src/validate/layout-runs.ts` and `packages/tools/src/profile/native-hydration.ts`, which release their roots.
- Test: `rust/crates/sittir-core/tests/arena_held_parses.rs` and `packages/common/tests/arena-held-parses.test.ts`.

**Interfaces:**
- Consumes: Task 5. The tree-holders plan's `TreeCell` and the interim `Tree` object, which this task removes from arena storage.
- Produces:
  - `HeldParses::hold(&mut self, parse: ParseRef) -> u32`;
  - `HeldParses::release(&mut self, slot: u32)`;
  - `HeldParses::get(&self, slot: u32) -> &ParseRef`, for a counted holder;
  - `HeldParses::borrowed(&self, slot: u32, parse: TreeId) -> Result<&ParseRef, ParseReleased>`, for every read-handle call. `ParseReleased` names the parse's id;
  - a slot is reused only when its count is 0.

- [ ] **Step 1: Failing tests:**
  - a parse in arena storage leaves no live `tree_sitter::Tree`, through a test-only count;
  - 100 parses, each released, leave the table empty. 100 never released are freed at the engine's dispose;
  - (Review Focus 5) a built node linking a parsed node keeps its parse after the root's release, and releasing the built node frees it. A read handle kept past its parse's release is refused by `ParseReleased`, and after a new parse reuses the slot it's still refused and never reads the new parse;
  - 10,000 hold/release cycles over 3 parses never leave a live link's slot at count 0, checked under the debug checks;
  - (Review Focus 4) a 10,000-level nested source in each grammar hydrates at parse with no overflow, and the parse call makes no napi call on a grown segment;
  - the LINK record is still 8 words, asserted on `size_of` and in the JavaScript twin;
  - no `Tree` instance is made in arena storage.
- [ ] **Step 2:** Run them. They fail.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run the three-way verification** in arena storage, plus Task 4's parity on the corpora and Task 5's corpus render with the tree dropped.
- [ ] **Step 5: Commit:** `feat(arena): an arena parse hydrates at parse, drops its tree, and is held in a counted slot`.

### Task 7: The measurements

Run on Task 6's branch before its PR is opened. Tasks 2–5 carry the standard CI runs on their own PRs.

- [ ] **Step 1: CI.** Run the paired-refs benchmark and the `oxc-reference` mode against the merge base, in both storages. Report:
  - parse, deep read, and the three render cases;
  - retained memory on matter.js and next.js;
  - each against the ×1.10 bar.
  Anything over the bar is reported before the PR, with its cause.
- [ ] **Step 2: Open Task 6's PR to master.** The body carries the table and checks the spec's memory claim against it. Merge waits for the user's word.
