# Tree-Inferred Options Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or superpowers:subagent-driven-development when the user chooses it) to implement this plan task by task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A parsed tree carries an inferred options table, the observed formatting of that tree, and every render that involves the tree reads it. `engine.fromNode(node)` returns an engine whose options are the parent's under the tree's; its `.options` is how a caller reads the inferred result. There is no public `inferOptions`.

**Architecture:** The inference walk is the read-side twin of the render prepare walk. The prepare walk classifies the bytes between the coordinates of one transport's list (`classify_list_gaps`) and stamps the result on that transport; the inference walk classifies the same lists over the parsed tree and folds them into one table per tree. Both are driven by one emitted per-kind list-site record, so the sites, tokens and allowed arms have one derivation. The table is one more base layer of the option resolution, under the per-call options and the occurrence stamps and over the engine's options, so the prepare walk and the writer do not change. The render call names its tree, so the layer is read from the right table. One helper applies the rule that names a node's tree, and both the render and `fromNode` call it.

**Tech Stack:** Rust (`sittir-core`: `classify`, `prepare`, `napi_engine`, `engine`), the emitted grammar crates, TypeScript (`@sittir/common`, `@sittir/types`), `@sittir/codegen` emitters, vitest and cargo.

**Spec:** `docs/superpowers/specs/2026-09-04-render-options-design.md` (the precedence chain and the tree's inferred table) and `docs/superpowers/specs/2026-09-28-engine-api-design.md` (the engine surface). Read both first.

## What exists, and what this plan builds on

- **Occurrence stamps.** The emitted `prepare` of a typed transport calls `classify_list_gaps(&coords, ctx.sources, token, allowed_before, allowed_after, &WHITESPACE)` for each multiple field (`listGapClassification` in `emitters/render-module.ts`), and fills the field's site field when it is unset. The root's leading and trailing edges are stamped the same way from the first and last coordinate items (`rootEdgeStamp`, which calls `prepare::root_flanks` then `fill_edges`).
- **Options.** `ResolvedOptions { spacing, delimiter, indent, edges, edge_rows, sites, kind_flags }`; `spacing` and `delimiter` are indexed by generated site. `render(transport, tree_id, options)` resolves the per-call JSON over `engine.options()`. The spec's chain is: per-call options with `reformat` > the occurrence's stamp > per-call options > the tree's inferred table > engine options > grammar default; without `reformat`, per-call options fill only unstamped sites.
- **Trees.** `ParsedTree` holds its `tree_id`, source, tree and coordinates; `napi_engine` keeps `trees: HashMap<u32, ParsedTree>` and `last_tree_id`. A handle carries its tree id in the bits above the index. The JS `render` passes no tree id, so an unnamed render takes `last_tree_id`, the newest parse, for its format.
- **Format.** `extract_format` records only indentation (`FormatRecord.boundary.leading`, by line-start consensus).
- **Bound nodes.** A node reaches its engine through `$engine()`; `render` finds the one engine that parsed a node's parsed descendants (`collectReaders`) and renders there with the calling engine's options as per-call options.

The root edges (`<root>_before`/`<root>_after`; `source_file_*` in rust, `program_*` in typescript and scm, `module_*` in python, `pattern_*` in regex) are option sites owned by the render-coordinate work. This plan starts once that work is on master and takes them as the first keys.

## Global Constraints

- Branch `feat/tree-inferred-options` from `origin/master`, in `scratchpad/wt-tree-inferred`. Commits use pathspecs.
- Generated outputs are never hand-edited: change the emitter and regenerate.
- No comments in `packages/codegen/src/`; new declarations get `docs/glossary/` entries. No plan, task, PR or issue numbers in comments or glossary text.
- DRY: one list-site derivation feeds both the prepare walk and the inference walk; one key table maps option keys to sites for both resolving and projecting; one root-edge classifier (`root_flanks`) for the stamp and the inference.
- Stamped facts: a site's key and index are resolved by the emitter. The walk never derives one by name or by pattern.
- A failed gate stops the work for review; never revert or stash it away.
- Byte-identical output under default options is the gate for Tasks 1 to 3; only Tasks 4 and 6 may move rows, and they must move them the stated way.

## Review Focus

1. **Precedence:** per-call options with `reformat` > occurrence stamp > per-call options > tree table > engine options > grammar default, pinned by one test per adjacent pair (the `reformat` pair and the stamp-over-per-call pair included), with the same site set at each level.
2. **The walk votes like the prepare walk:** for every list the prepare walk classifies, the inference walk classifies the same items with the same token and allowed arms; a tree with one uniform list yields the arm the prepare walk stamps on a transport read from it.
3. **Absent keys:** a key the tree has no occurrence of is absent from the table and falls through to the engine. A tie takes the declared default.
4. **Tree naming:** a render names its tree from the node's own coordinate, or from the one tree its parsed descendants share. Several trees, or none, means no tree layer. No render depends on which tree was parsed last.
5. **Edits:** the table belongs to the tree entry, is computed lazily and dropped when the entry's source changes; a node never caches it. The tree id stays stable.
6. **`fromNode` is a new engine:** the parent is untouched, its `.options` are the parent's with the tree's inferred ones on top, and a node it builds renders through the cross-engine rule. It finds the tree by the same helper a render uses.

## Delivery

One PR, stacked on master after the render-coordinate work. Behaviour changes, each stated in the PR body:
- an unnamed render no longer takes the newest parse's indentation (the `last_tree_id` fallback is removed);
- a render of built code that contains parsed nodes follows that tree's observed style, where it followed engine options before;
- the calling engine's options in a cross-engine render become that engine's level, below the reading tree's table, instead of per-call options (Task 5). This closes the issue about native options that cannot be unset, and the PR body says so;
- indentation is one fact: the table's `indent` replaces the tree-derived format record (Task 7).

Validation rows are expected to stay identical or to move only where the tree table supplies a root edge or list style the transport stamp could not (the two parity fixtures dropped for this reason come back). The row diff goes to review before push.

Commit order: Task 0, then 1 and 2 (byte-identical), 3, 4, 5, 6, 7, 8. Implementation starts once the root-edge work is on master.

---

### Task 0: Worktree, baselines, and the spike

- [ ] **Step 1:**

```bash
cd ~/GitHub.nosync/refactory-lang/sittir && git fetch origin
git worktree add -b feat/tree-inferred-options scratchpad/wt-tree-inferred origin/master
cd scratchpad/wt-tree-inferred && pnpm install
```

- [ ] **Step 2: Baselines** (saved to `scratchpad/wt-tree-inferred/scratchpad/baseline/`): `validate:native` rows; `pnpm exec vitest run` as its own call; `type-check`, `lint`; `cargo test --workspace --no-default-features`; the parity crate's fixture counts per kind (the two dropped fixtures and `source_file` left-out 6).
- [ ] **Step 3: Spike, no commit.** Confirm three seams and write the answers into the task notes:
  1. **Slot placement.** Where `read_node.rs` places a tree-sitter child into a slot (`ReadModel::wire_slot(parent, field, child)`) and whether the list of a slot's child coordinates can be had for a parsed node without reading it into a transport. If not, the smallest extraction is a function both the reader and the walk call.
  2. **List-site record.** What `listGapSitesOf(plan, node, field)` and `SpacingSite` already carry (`constName`, `fieldIdent`, the token, allowed arms) and what an emitted `INFER_LISTS` row still needs.
  3. **Root edges.** The names and site indices of the root edges on master, and the root's first and last coordinate in a parsed tree.

---

### Task 1: The table type and the layered base

**Files:**
- Create: `rust/crates/sittir-core/src/inferred.rs`
- Modify: `rust/crates/sittir-core/src/options.rs` (`ResolvedOptions::layered`)
- Test: `rust/crates/sittir-core/tests/inferred.rs`

**Behaviour:**
- `InferredTable { spacing: Vec<Option<SeamArm>>, delimiter: Vec<Option<u8>>, indent: Option<String> }`, indexed like `ResolvedOptions`. Every entry starts absent.
- `ResolvedOptions::layered(&self, &InferredTable) -> ResolvedOptions`: a present entry replaces the engine's value; an absent one keeps it. Lengths must match the resolved options, or the call fails with a diagnostic naming both.
- The per-call resolve is unchanged and runs over the layered result, so the order is the spec's: per-call with `reformat` > stamp (the writer reads the stamp first) > per-call without `reformat` (unstamped sites only) > table > engine > default.

- [ ] **Step 1:** Tests: one per adjacent pair of the chain (table over engine; engine over default; per-call over table; a set stamp over per-call without `reformat`; per-call with `reformat` over the stamp; an unset stamp falls to per-call, then the table); a length mismatch fails.
- [ ] **Step 2:** Implement.
- [ ] **Step 3:** Glossary entries; `cargo test --workspace --no-default-features`.

---

### Task 2: One derivation of the list sites

**Files:**
- Modify: `packages/codegen/src/emitters/render-module.ts` (`listGapClassification`, its site helpers)
- Modify: `rust/crates/sittir-core/src/classify.rs` (a `ListSite` row type both walks read)
- Test: `packages/codegen/src/emitters/__tests__/render-module.test.ts`

**Behaviour:** Factor the per-field derivation into one record per multiple field: the wire slot, the separator token, the gap, before and after sites, and their allowed arms. `listGapClassification` renders the prepare code from these records unchanged; a new emitter output, `INFER_LISTS`, lists the same records per kind for the inference walk. The two outputs cannot disagree because they read one record.

- [ ] **Step 1:** Prove the prepare output is byte-identical: regenerate all five grammars before and after and diff.
- [ ] **Step 2:** Emit `INFER_LISTS` (a static table per grammar crate, keyed by kind id) and the root-edge site indices.
- [ ] **Step 3:** Emitter test that every list the prepare code classifies has a row, and no row exists without one.
- [ ] **Step 4:** Glossary entries for the record and the table.

---

### Task 3: The inference walk

**Files:**
- Create: `rust/crates/sittir-core/src/infer.rs`
- Modify: `rust/crates/sittir-core/src/engine.rs` (`ParsedTree` holds a lazily computed table)
- Modify: `rust/crates/sittir-core/src/read_node.rs` (only if Task 0 finds the slot placement needs extracting)
- Test: `rust/crates/sittir-core/tests/infer.rs`

**Behaviour:**
- `infer_table(tree: &ParsedTree<G>, grammar: &G) -> InferredTable` visits the tree's nodes. For a node whose kind has `INFER_LISTS` rows, it collects each row's child coordinates in source order and calls `classify_list_gaps` with the row's token and allowed arms, then votes the result for the row's sites.
- The root: the first and last child coordinates of the root go through `root_flanks`, the same function the occurrence stamp uses, and vote for the root edge sites.
- Fold: the majority of a site's votes wins; a tie takes the site's declared default (`SiteSpec`); a site with no vote stays absent. `majority` and `split_gap` are the ones `classify.rs` already has.
- The table lives on the tree entry, computed on first use. It is dropped when the entry's source is replaced.
- Indentation: the table's `indent` (Task 7).

- [ ] **Step 1:** Tests over small sources: a uniform list, a mixed list (majority), a tie (default), a tree with no list of a site (absent), a root with leading and trailing blank lines and with none, and nested lists voting into the same site.
- [ ] **Step 2:** Agreement test: for a source read into a transport, the arm the prepare walk stamps on a list equals the arm the table holds when the tree has only that list.
- [ ] **Step 3:** Implement; cache on the tree entry; test that a source replacement drops the table and keeps the tree id.

---

### Task 4: Render calls name their tree

**Files:**
- Modify: `rust/crates/sittir-core/src/napi_engine.rs` (`render`, `render_to_file`, a new `infer_options`)
- Modify: `packages/common/src/create-engine.ts`, `packages/common/src/engine.ts` (`NativeLanguageEngine.render`, the tree id)
- Modify: `packages/types/src/engine-api.ts`
- Test: `packages/common/tests/engine-nodes.test.ts`, a rust napi-level test in the tools tests

**Behaviour:**
- One helper, `treeOf(node)`, names a node's tree: the tree of its own handle when it is a parsed node; else the one tree its parsed descendants share; else none. A render treats several trees, or none, as no tree layer, so the engine's options apply; `fromNode` refuses both, naming `engine.parse`. `collectReaders` already walks the parsed descendants; it also collects their tree ids, so one walk answers both the reader and the tree.
- `render(transport, tree_id, options)` takes `tree_id` from the JS call. The `last_tree_id` field and its fallback are removed, and so is its reset in `dispose_tree` and on dispose. The base of the resolve is `engine.options()` overlaid with the named tree's table (Task 1); a tree id the engine does not hold is refused with the existing unknown-tree diagnostic.
- The tree's format record stops being read by `last_tree_id`; it is read by the named tree, and only until Task 7 removes it.

- [ ] **Step 1:** Tests: a render of a parsed node uses its own tree's table when two trees with different styles are parsed, in either order; a built node holding parsed children of one tree follows that tree; children of two trees fall to the engine options; rendering after `dispose` of a tree is refused.
- [ ] **Step 2:** Implement; regenerate; the rows are compared before push.

---

### Task 5: The calling engine's options are engine-level

**Files:**
- Modify: `rust/crates/sittir-core/src/napi_engine.rs` (`render` takes an optional base options)
- Modify: `packages/common/src/create-engine.ts` (the cross-engine branch)
- Test: `packages/common/tests/engine-nodes.test.ts`, the rust bound-nodes tests

**Behaviour:** When an engine renders a node whose parsed parts another engine of the language holds, the calling engine's options are the base of the resolve, not per-call options over the reader's options. A key the caller leaves unset falls to the grammar default, not to the reader's value. The order is per-call > stamp > tree table > calling engine's options > default. This removes the overlay the engine spec calls out as the one place the calling engine's options do not apply fully, and it needs no way to say "unset".

- [ ] **Step 1:** Tests: a caller with no `indent` renders through a reader configured with tabs and gets the default indent; a caller with `indent` set gets its own; the reading tree's table still wins over the caller's engine options; per-call options win over all.
- [ ] **Step 2:** Implement; update the engine spec's sentence and the `assembleEngine` glossary entry.

---

### Task 6: `engine.fromNode`

**Files:**
- Modify: `rust/crates/sittir-core/src/napi_engine.rs` (`infer_options` returns the table; internal, not exported past the language engine)
- Modify: `packages/common/src/create-engine.ts`, `packages/common/src/engine.ts`
- Modify: `packages/types/src/engine-api.ts`
- Modify: the per-grammar option key table emitter, so the key table maps keys to sites in both directions from one table
- Test: `packages/common/tests/from-node.test.ts`, `packages/rust/tests/from-node.test.ts`

**Behaviour:**
- `engine.fromNode(node)` is `createEngine(language, { ...engineOptions, render: { ...parentRender, ...inferred } })`, where `inferred` is the tree's table projected to the language's `Options`: `{ key: arm }` for spacing sites, delimiter bits for flank sites, only for present entries. The projection inverts the key table the resolver uses; no second key list exists. It is async like `createEngine`, returns a new engine, and leaves the parent as it was. The new engine's `.options` is the effective result, so `engine.fromNode(node).options` is how a caller reads what a tree evidences; nothing else exposes the table.
- The tree is found by `treeOf` (Task 4), the helper a render uses: the node's own tree, else the one tree its parsed descendants share. No tree, or several, is refused with a message naming `engine.parse`. A node of another language is refused.
- A node the new engine builds and renders together with the parsed one follows the file's style, including its root edges.

- [ ] **Step 1:** Tests: `fromNode(...).options` holds the parent's options with the tree's on top and only the present keys; those options, used as render options, render a built list the way the source spells it; `fromNode` of a file without a trailing newline builds code that ends without one; the parent engine renders as before; a node from no tree or from several trees is refused; `treeOf` gives the render and `fromNode` the same answer for the same node.
- [ ] **Step 2:** Type-level tests in `engine-api.test-d.ts`: `fromNode` returns `Promise<Engine<API>>` and `.options` is the language's `Options`.
- [ ] **Step 3:** Implement; glossary; README snippets, gated by the README run gate.

---

### Task 7: Indentation is one fact

**Files:** `rust/crates/sittir-core/src/format.rs`, `infer.rs`, `inferred.rs`, `napi_engine.rs`, `packages/common/src/engine.ts`, `packages/types/src/engine-api.ts`.

**Behaviour:** `extract_format` derived indentation by line-start consensus into `FormatRecord.boundary.leading`; the table's `indent` is the same fact. The table's `indent` is computed by that consensus and replaces the tree-derived format record, so a render reads one indentation source. A caller-supplied format (`EngineOptions.format`) stays as an engine-level input: it feeds the base of the resolve, under the tree's table. `extract_format` and the per-tree format lookup in `render` go away with their tests moved onto the table.

- [ ] **Step 1:** Tests: the tab, four-space and canonical cases of `extract_format` become table tests (canonical source leaves `indent` absent); a caller-supplied format is the engine-level value and a tree with a different indentation overrides it; a tree with no indented line leaves the engine's value.
- [ ] **Step 2:** Byte-identical gate: the format-roundtrip suites and the validation rows under default options are unchanged.
- [ ] **Step 3:** Remove the dead format-record path; glossary.

---

### Task 8: Parity fixtures, docs, final gates

- [ ] **Step 1: Fixtures.** The two parity fixtures dropped when the root edges became options come back, with the tree's inferred table as their options. This adds an options field to the fixture schema; agree the field with the render-coordinate owner first, since the fixtures and the parity crate are theirs. `source_file` left-out goes from 6 to 4.
- [ ] **Step 2: Docs.** Glossary entries for every new declaration; the render-options spec's tree-table section describes what landed; the engine spec gains `fromNode`, and the spec's `tree.inferOptions()` mentions become `engine.fromNode(node).options` (edited with this plan); root README and the language READMEs gain a `fromNode` snippet, run by the README gate.
- [ ] **Step 3: Gates, three ways.** Targeted probes (wrap and render layers); `sittir validate history` across the three grammars with the numbers compared and the row diff sent for review before push; the full suite as its own call; `type-check`, both example checks, `lint`; `cargo test --workspace --no-default-features`; the tsc instantiation counts against the baseline.

## Edit lifecycle (out of scope, must not conflict)

The edit work (`$save()` and the like) is a separate design. This plan keeps to three rules so it can follow: a node keeps its tree handle, and nothing here stores a table on a node; the table belongs to the tree entry, is computed lazily and is dropped when the entry's source changes, so an edit commit has one place to invalidate; a tree id is never reused, so a render naming a replaced tree either finds the new entry or is refused, never a stale one. Spans translating lazily after an edit does not affect the inference walk, which reads the entry's current source and tree.

## Open questions

1. **Fixture schema.** The options field for parity fixtures is owned by the render-coordinate work; agree it with them before Task 8.
