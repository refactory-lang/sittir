# Tree Holders Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task by task. This repo's rule is no subagents for code. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** a parsed tree is freed when its last holder drops it. In object storage the holder is a `Tree` object the garbage collector tracks. In arena storage it's a counted slot in the engine's arena. A coordinate reaches its tree through its holder, never by looking up its id. The live-tree table, the tree tokens and the native render's tree argument go away.

**Architecture:**
- Each tree lives in a `TreeCell` behind an `Arc`. The cell carries its own non-blocking borrow.
- Object storage: `napi_engine!` expands a per-grammar `Tree` class that wraps the `Arc`, and coordinates hold the `Tree` object.
- Arena storage: no `Tree` object. The engine's arena holds each tree in a held-tree table slot, counted once by the parse root and once by each link record. A read handle names its tree by slot and tree id, as an uncounted borrow.
- The native render finds its sources and options layer from the node.

**Tech stack:** Rust (sittir-core, napi-rs 3.15 at `napi10`), the TypeScript engine in `packages/common`, the wrap emitter in `packages/codegen`, and the tools' validators.

**Spec:** `docs/superpowers/specs/2026-10-23-engine-dylib-migration-design.md`, sections "Tree holders" and "A coordinate carries its tree" (amended on 2026-11-06, most recently for the per-storage holders). Read them first.

**Facts this plan starts from:** engine-api's audit at f06a0922.
- `LIVE_TREES` is in core `napi_engine.rs:65-71`, with writes through `with_live_tree`/`change_trees` (:114-125, `engine.rs:2183-2185`) and renders through `with_live_trees` (:146-160).
- The arena LINK record is in `arena/built_image.rs:102-105`, with its JavaScript twin at `built-arena.ts:829-845`, and `BuiltArena.#trees` at `built-arena.ts:206-210`.
- Release: `treeDisposalRegistry` at `engine.ts:478-497`, and `dispose_tree` at `napi_engine.rs:82-109`.
- The tokens are in `tree-token.ts` and `node-data.ts:101-147, 904-946`.
- The generated `[TREE]` stamps: python 354, typescript 480, rust 482, regex 60 and scm 48 sites.
- The native render's tree id is at `napi_engine.rs:612-660, 945, 974`, and `renderTreeOf` at `engine.ts:70-73`.

**Executor:** sittir-engine-api. **Reviewer:** sittir-brainstorm, at the end of every task. **Base:** master after the shared-library plan (`2026-11-06-engine-dylib-library.md`) merges.

## Global Constraints

- **Worktree and branch:** engine-api's existing worktree, on a new branch `feat/trees-as-objects` from `origin/master`. No new worktrees. Pathspec commits. No force, stash, amend, rebase, revert or abort. Push by literal sha. Merge master in whenever it moves.
- **No napi or V8 call runs off the JavaScript thread.** Parallel output stays byte-identical, and render stays a recursive descent.
- **A borrow never blocks.** A borrow that's already held is refused, by a message naming the tree and the operation.
- **No tree dispose API is added.** A tree is freed only when its last holder goes. In object storage a node's `[Symbol.dispose]` stays a no-op. In arena storage the parse root's existing `[Symbol.dispose]` and `engine.release(node)` drop its count, and releasing any other read handle still does nothing.
- **The arena link record stays 8 words.**
- **Generated outputs are never hand-edited.** The `[TREE]` stamps come from the wrap emitter. Regenerate every grammar, and commit the manifests through the pre-commit check.
- **Three-way verification** before every commit that can change what the pipeline reads, renders, parses or validates: targeted probes of the wrap and render layers, `validate:history` compared with numbers, and the full suite. Also `cargo test --workspace` in plain and arena builds, and clippy in the four CI configurations.
- **Comments:**
  - Hand-written source in `packages/{codegen,common,tools,types}/src` carries no explanatory comments. Public engine API declarations carry JSDoc.
  - Comments and docs carry no spec, plan, PR or task numbers.
- **Speed numbers come from CI only.** #924's bar holds: pipeline feature/base ≤ ×1.10 per grammar, in object and arena storage, judged on per-CPU medians.

## Review Focus

1. **A node held alone, object storage.** A node read from a tree is stored in a long-lived structure, and every other reference to that tree is dropped. Expected: the tree stays alive, and the node renders and reads. Once the node is dropped and collected, the tree is freed. Owned by Task 3.
2. **A write during a render of the same tree,** for example from a callback the render reaches. Expected: refused by name, with no deadlock. A write to another tree in the same call succeeds. Owned by Tasks 1 and 5.
3. **A parsed node from another grammar's tree placed in a built node.** Expected: refused by name, as the interim admission rule does today. Never a cast across type tags. Owned by Task 3.
4. **Arena slots: reuse and stale read handles.** Expected: a slot is reused only after its count reaches 0, meaning its root is released and its last link is gone. A read handle kept past that point is refused by name through the slot's tree-id check. It never reads the tree that a reused slot now holds. Owned by Task 4.
5. **A `Tree` object or a node posted to another worker.** Expected: refused by name, never a crash. Owned by Task 3.

---

### Task 1: The tree cell and its per-tree borrow

**Files:**
- Modify: `rust/crates/sittir-core/src/engine.rs` (`ParsedTree`, and a new `TreeCell`).
- Modify: `rust/crates/sittir-core/src/napi_engine.rs`. `LIVE_TREES` holds `Arc<TreeCell>` per tree. `with_live_tree`, `change_trees` and `with_live_trees` borrow per tree.
- Test: `rust/crates/sittir-core/tests/tree_cell.rs`.

**Interfaces:**
- Produces:
  - `pub struct TreeCell`, holding the `ParsedTree` and its borrow;
  - `impl TreeCell { pub fn read(&self) -> Result<TreeRead<'_>, TreeBusy>; pub fn write(&self) -> Result<TreeWrite<'_>, TreeBusy> }`, never blocking;
  - `pub type TreeRef = std::sync::Arc<TreeCell>`;
  - `TreeBusy`'s message names the tree's id and the borrow that's already held;
  - a compile-time assertion that `ParsedTree` and `TreeCell` are `Send + Sync`.

- [ ] **Step 1: Failing tests:**
  - a `write` while a `read` of the same cell is live returns `TreeBusy`, and its message names the tree;
  - a `write` to cell B while cell A is read succeeds;
  - a second `read` alongside the first succeeds;
  - the compile-time assertion is present.
- [ ] **Step 2:** Run `cargo test -p sittir-core --test tree_cell`. It fails.
- [ ] **Step 3: Implement.** Writes to the sides go through `TreeWrite`. Placed sides keep their lock-free `&self` path (`trivia_table/place.rs`).
- [ ] **Step 4:** Run the tests, then the three-way verification. A render with a write to another tree in it is now allowed, so the engine test that pinned "any write during any render is refused" changes. The commit message names that change and why.
- [ ] **Step 5: Commit:** `refactor(core): each parsed tree carries its own non-blocking borrow`.

### Task 2: The `Tree` class, and JavaScript holds tree objects

**Files:**
- Modify: `napi_engine.rs`. `napi_engine!` expands `#[napi] pub struct Tree(TreeRef)`. `parse` returns a `Tree`. `LIVE_TREES` becomes an index of `Weak<TreeCell>`, kept until Task 5. `dispose_tree` goes.
- Modify: `packages/common/src/engine.ts` and `tree-token.ts`. The tree token *is* the `Tree` object. `treeDisposalRegistry`, `registerTree` and `disposeTree` go.
- Modify: `packages/tools/src/validate/layout-runs.ts:45` and `packages/tools/src/profile/native-hydration.ts:44`. They drop their holds and, where a loop needs it, call `gc()` under `--expose-gc`.
- Test: `packages/common/tests/tree-objects.test.ts`.

**Interfaces:**
- Consumes: Task 1's `TreeRef`.
- Produces: the JavaScript engine gets a `Tree` object from every parse, and the existing token helpers carry it unchanged. In arena storage this is interim: Task 4 replaces the `Tree` object with a counted slot, so each task stays green on its own.

- [ ] **Step 1: Failing tests, run under `--expose-gc`:**
  - 100 parses whose results are all dropped, then `gc()`, leave the native live count at 0, read through a test-only `liveTreeCount()`;
  - a held root keeps its tree, and it renders back the source;
  - another grammar's `Tree` passed to this engine's read is refused by its type tag, with no cast.
- [ ] **Step 2:** Run them. They fail.
- [ ] **Step 3: Implement.**
- [ ] **Step 4:** Run them, then the three-way verification in both storages.
- [ ] **Step 5: Commit:** `feat(core): a parsed tree is a JavaScript object, freed with its last holder`.

### Task 3: An object-storage coordinate holds its tree

**Files:**
- Modify: the wrap emitter in `packages/codegen/src/emitters/`, so the per-kind `[TREE]` stamp holds the `Tree` object. Regenerate every grammar.
- Modify: `packages/common/src/{node-data,read,record-view,utils,query,snapshot,native-boundary}.ts`. A coordinate is `{ $tree, $index, $end, $span, $type }`, and `$treeHandle` packs no tree id.
- Modify: core `slot.rs`, `codec.rs`, `query.rs` and `layout.rs`, which decode a coordinate's `$tree` through `FromNapiRef<Tree>`.
- Delete: `holdTree`, `holdReadTree`, `carryReadTree`, `detachCoordinates`, `detachCoordinate`, `dropTreeTokens` and the token helpers, plus the validators' detach-then-hold pairs (`tools/src/validate/common.ts:898-995`) and the `emit/output-spellings.ts:61` caller.
- Test: `packages/common/tests/coordinate-tree.test.ts`.

**Interfaces:**
- Consumes: Task 2's `Tree`.
- Produces: the coordinate shape `{ $tree: Tree, $index: number, $end: number, $span: Span, $type: number }`. `$tree` is the one way to reach a coordinate's source.

- [ ] **Step 1: Failing tests:**
  - **Review Focus 1:** a node at read depth past its root is kept alone, then the root and every other node are dropped and collected. The node still renders its source. After it's dropped and collected, the live count is 0.
  - **Review Focus 3:** a built node given a parsed node of another grammar is refused by name.
  - **Review Focus 5:** `structuredClone` of a node with a coordinate throws a named error.
  - A copy of a node copies its coordinates, and the copy renders after the original is dropped.
  - An edit that rebuilds a node drops that node's own hold. With every other reference to the tree dropped except one untouched descendant, the tree stays alive. Once that descendant is dropped and collected, the tree is freed.
  - A fully materialized node, with no coordinates left under it, still holds its tree and renders its source byte for byte.
  - No package entry point exports the `Tree` class.
- [ ] **Step 2:** Run them. They fail.
- [ ] **Step 3: Implement,** and regenerate every grammar.
- [ ] **Step 4: Run the three-way verification,** plus targeted probes on each grammar's wrap and render layers.
- [ ] **Step 5: Commit:** `feat(common): a coordinate holds its tree; tree tokens go`.

### Task 4: Arena storage holds its trees in counted slots

**Files:**
- Modify: core `arena/built_image.rs` (the LINK record's tree word becomes a slot) and the arena's store (a new held-tree table).
- Modify: `napi_engine.rs`. In arena storage, `parse` holds its tree in the engine arena's table and returns the slot and tree id, not a `Tree` object. Every call from a read handle passes both.
- Modify: `packages/common/src/built-arena.ts`. `#trees` and the `holdTree` calls in `link` and `rebuiltFrom` go, and the JavaScript LINK twin (`:829-845`) reads the slot.
- Modify: `packages/common/src/{read,record-view,handle,engine,create-engine}.ts`. An arena `TreeHandle` carries the slot and tree id, and holds no `Tree` object. `handleDispose` on a parse root releases the root's count.
- Modify: `packages/tools/src/validate/layout-runs.ts` and `packages/tools/src/profile/native-hydration.ts`, which release their roots in arena storage.
- Test: `rust/crates/sittir-core/tests/arena_held_trees.rs` and `packages/common/tests/arena-held-trees.test.ts`.

**Interfaces:**
- Consumes: Task 1's `TreeRef`, and Task 3's coordinate.
- Produces:
  - `HeldTrees::hold(&mut self, tree: &TreeRef) -> u32`, which adds an entry at count 1 or adds 1 to the tree's entry;
  - `HeldTrees::release(&mut self, slot: u32)`;
  - `HeldTrees::get(&self, slot: u32) -> &TreeRef`, for a counted holder (a link, or the root before its release);
  - `HeldTrees::borrowed(&self, slot: u32, tree: TreeId) -> Result<&TreeRef, TreeReleased>`, for every call from a read handle. `TreeReleased`'s message names the tree's id;
  - a slot is reused only when its count is 0.

- [ ] **Step 1: Failing tests:**
  - a parse root's release frees its tree when nothing links it. 100 parses, each released, leave the table empty;
  - 100 parses that are never released are freed at the engine's dispose;
  - a built node linking a parsed node keeps its tree alive after its root's release, and releasing the built node frees it;
  - releasing a read handle that isn't a root does nothing;
  - **Review Focus 4:** a read handle kept past its root's release, with nothing linking the tree, is refused by `TreeReleased` naming the tree's id. After a new parse reuses the slot, the stale handle is still refused, and never reads the new tree;
  - **Review Focus 4:** 10,000 hold/release cycles over 3 trees. Each step asserts, under the debug checks, that no live link's slot reaches a tree with count 0;
  - a parse in arena storage makes no `Tree` instance, counted through a test-only hook;
  - the LINK record is still 8 words, asserted on `size_of` and in the JavaScript twin.
- [ ] **Step 2:** Run them. They fail.
- [ ] **Step 3: Implement.** Task 2's interim `Tree` object leaves arena storage.
- [ ] **Step 4: Run the three-way verification** in arena storage, plus the record parity tests.
- [ ] **Step 5: Commit:** `feat(arena): arena storage holds its trees in counted slots, released with the parse root`.

### Task 5: The native render takes no tree, and the live-tree table goes

**Files:**
- Modify: `napi_engine.rs`. `render`, `render_to_file`, `render_record` and `render_built` lose their tree id. Their sources come from the node's coordinates (object: `$tree`; arena: held slots), and their options layer from those coordinates: one tree gives its layer, several or none give no tree layer. The `Weak` index and `ReadTrees` over every live tree go.
- Modify: `packages/common/src/engine.ts`. `renderTreeOf` and its argument go.
- Test: `packages/common/tests/render-from-node.test.ts`.

**Interfaces:**
- Consumes: Tasks 3 and 4.
- Produces: `render(engine, node, options)` natively, with nothing that looks a tree up by id.

- [ ] **Step 1: Failing tests:**
  - a built node holding nodes of two trees renders both sources with no tree layer;
  - one holding one tree's nodes renders over that tree's layer;
  - **Review Focus 2:** a render that reaches a write to its own tree gets a `TreeBusy` naming it, and a write to another tree during that render succeeds;
  - the native render functions take no tree argument, pinned by the typings.
- [ ] **Step 2:** Run them. They fail.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run the three-way verification** in both storages.
- [ ] **Step 5: Commit:** `feat(core): render finds its trees from the node`.

### Task 6: The standing gates and the measurements

- [ ] **Step 1: Standing gates:**
  - `validate:native` rows identical in both storages;
  - the full suite;
  - `cargo test --workspace` plain and arena;
  - clippy in the four configurations;
  - the workspace type-check and lint.
- [ ] **Step 2: CI.** Run the paired-refs benchmark against the merge base, in both storages. Report pipeline, edit and retained memory against #924's final table. Anything over the ×1.10 bar is reported before the PR, with its cause.
- [ ] **Step 3: Open the PR to master.** The body carries the measurement table and the deleted surfaces. Merge waits for the user's word.
