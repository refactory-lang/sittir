# Tree-Inferred Options Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or superpowers:subagent-driven-development when the user chooses it) to implement this plan task by task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A parsed tree carries an inferred options table, the observed formatting of that tree, and every render that involves the tree reads it. `styleFrom` infers a language's `render` options from files, with no engine needed, and the descriptor gains `createEngine`. There is no public `inferOptions` and no `fromNode`: the native inference stays internal, feeding the render layer and `styleFrom`.

**Architecture:** The inference walk is the read-side twin of the render prepare walk. The prepare walk classifies the bytes between the coordinates of one transport's list (`classify_list_gaps`) and stamps the result on that transport; the inference walk classifies the same lists over the parsed tree and folds them into one table per tree. Both are driven by one emitted per-kind list-site record, so the sites, tokens and allowed arms have one derivation. The table is one more base layer of the option resolution, under the per-call options and the occurrence stamps and over the engine's options, so the prepare walk and the writer do not change. The render call names its tree, so the layer is read from the right table. One helper applies the rule that names a node's tree. The same inference walk, run over the files a caller names, is the whole of `styleFrom`.

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
6. **`styleFrom` sums raw votes:** with several files the votes are added before the fold, never a majority of per-file majorities; a tie takes the declared default; a key no file shows is absent from the result. It creates no engine, and the temporary native instance is disposed even when a file is refused or fails to parse.
7. **The descriptor delegates:** `rust.createEngine` and `rust.styleFrom` are one-line delegates to the one implementation in `@sittir/common`; importing the descriptor loads neither the language nor the native engine.

## Delivery

One PR, stacked on master after the render-coordinate work. Behaviour changes, each stated in the PR body:
- an unnamed render no longer takes the newest parse's indentation (the `last_tree_id` fallback is removed);
- a render of built code that contains parsed nodes follows that tree's observed style, where it followed engine options before;
- the calling engine's options in a cross-engine render become that engine's level, below the reading tree's table, instead of per-call options (Task 5). This closes the issue about native options that cannot be unset, and the PR body says so;
- the descriptor gains `createEngine`, `styleFrom` and `styleFromSource`, and `Language<API>` gains `fileTypes`; the free forms `styleFrom(language, ...)` sit beside `createEngine(language, ...)`;
- indentation is one fact: the table's `indent` replaces the tree-derived format record (Task 7).

Validation rows are expected to stay identical or to move only where the tree table supplies a root edge or list style the transport stamp could not (the two parity fixtures dropped for this reason come back). The row diff goes to review before push.

Commit order: Task 0, then 1 and 2 (byte-identical), 3, 4, 5, 7, 6, 8 (Task 7 comes before 6 so `styleFrom` reports indentation from the start). Implementation starts once the root-edge work is on master.

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
- `InferredVotes { spacing: Vec<[u32; ARMS]>, delimiter: Vec<[u32; FLAGS]>, indent: Vec<(String, u32)> }`: raw counts per site and arm, per delimiter flag set and per indentation unit, indexed like `ResolvedOptions`. Votes add, so files sum before any fold.
- `InferredTable { spacing: Vec<Option<SeamArm>>, delimiter: Vec<Option<u8>>, indent: Option<String> }`, indexed like `ResolvedOptions`; `fold(votes, defaults)` gives the majority per site, the site's declared default on a tie, and absent where a site has no vote.
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
- `infer_votes(tree: &ParsedTree<G>, grammar: &G) -> InferredVotes` visits the tree's nodes. For a node whose kind has `INFER_LISTS` rows, it collects each row's child coordinates in source order and calls `classify_list_gaps` with the row's token and allowed arms, then votes the result for the row's sites.
- The root: the first and last child coordinates of the root go through `root_flanks`, the same function the occurrence stamp uses, and vote for the root edge sites.
- The table is `fold(infer_votes(tree))`, the fold of Task 1 (`majority` and `split_gap` are the ones `classify.rs` already has). Each list is one vote for its site (the class `classify_list_gaps` gives it by majority over its gaps), so a long list does not outweigh a short one, and `styleFrom` inherits the same weighing.
- The table lives on the tree entry, computed on first use. It is dropped when the entry's source is replaced.
- Indentation: the table's `indent` (Task 7).

- [ ] **Step 1:** Tests over small sources: a uniform list, a mixed list (majority), a tie (default), a tree with no list of a site (absent), two trees' votes added before the fold (a majority of majorities would differ), a root with leading and trailing blank lines and with none, and nested lists voting into the same site.
- [ ] **Step 2:** Agreement test: for a source read into a transport, the arm the prepare walk stamps on a list equals the arm the table holds when the tree has only that list.
- [ ] **Step 3:** Implement; cache on the tree entry; test that a source replacement drops the table and keeps the tree id.

---

### Task 4: Render calls name their tree

**Files:**
- Modify: `rust/crates/sittir-core/src/napi_engine.rs` (`render`, `render_to_file`)
- Modify: `packages/common/src/create-engine.ts`, `packages/common/src/engine.ts` (`NativeLanguageEngine.render`, the tree id)
- Modify: `packages/types/src/engine-api.ts`
- Test: `packages/common/tests/engine-nodes.test.ts`, a rust napi-level test in the tools tests

**Behaviour:**
- One helper, `treeOf(node)`, names a node's tree: the tree of its own handle when it is a parsed node; else the one tree its parsed descendants share; else none. A render treats several trees, or none, as no tree layer, so the engine's options apply. `collectReaders` already walks the parsed descendants; it also collects their tree ids, so one walk answers both the reader and the tree.
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

### Task 6: `styleFrom` and the descriptor's `createEngine`

**Files:**
- Modify: `rust/crates/sittir-core/src/napi_engine.rs` (`infer_style(sources) -> table`, internal to the language engine: one temporary parse per source, votes summed, folded)
- Create: `packages/common/src/style-from.ts` (the one implementation, and the free `styleFrom`, `styleFromSource`)
- Modify: `packages/common/src/create-engine.ts` (`loadLanguage` is shared by both entry points and stays cached)
- Modify: `packages/types/src/engine-api.ts` (`Language<API>` gains `fileTypes`, `createEngine`, `styleFrom`, `styleFromSource`)
- Modify: `packages/codegen/src/emitters/index-file.ts` (the emitted descriptor: `fileTypes` from the grammar's `tree-sitter.json`, and the delegates)
- Modify: the per-grammar option key table emitter, so the key table maps keys to sites in both directions from one table
- Test: `packages/common/tests/style-from.test.ts`, `packages/rust/tests/style-from.test.ts`, `packages/rust/tests/descriptor.test-d.ts`

**Behaviour:**
- `styleFrom(language, ...paths)` and `rust.styleFrom(...paths)` are async and return that language's `API['options']` with only the keys the files show. The method is a generated one-line delegate to the free form; there is one implementation.
- `styleFromSource(language, ...sources)` and `rust.styleFromSource(...sources)` do the same over source text, for in-memory use. (The name is proposed here for review.)
- The language loads lazily through the same cached `loadLanguage` that `createEngine` uses, so importing the descriptor stays cheap. The call creates one temporary native instance, parses every file with it, and disposes it, on failure too. No `Engine` is created.
- The votes of all files are summed before the fold. A tie takes the site's declared default. A key no file evidences is absent. The result is the language's `Options`, so it can be passed as `render` options as it stands. The projection inverts the key table the resolver uses; no second key list exists.
- A path whose extension is not in the descriptor's `fileTypes` is refused, naming the extension and the accepted ones. `fileTypes` is the union of the `file-types` of the grammar's `tree-sitter.json`, emitted onto the descriptor; a grammar with none (scm, regex) accepts no path, and its source-text form still works.
- The inference walk is the one Task 3 builds; `styleFrom` adds no second walk.
- `createEngine` on the descriptor: `rust.createEngine(options)` is a generated delegate to `createEngine(rust, options)` with the same `const R` and `RenderOptionsCheck` signature, so `rust.createEngine({ render: { indent: '\t' } })` type-checks exactly like the free form and rejects the same wrong options.
- Engine options stay immutable: the `render` block is resolved once at construction, as it is natively. A one-off style uses per-call `engine.render(node, options)`; parsed files already format themselves through the tree layer (Task 4).

- [ ] **Step 1:** Tests: one file yields its keys and only its keys; two files sum votes (a case where the sum and the majority of majorities differ); a tie takes the default; a file with the wrong extension is refused with the accepted list; a file that fails to parse still disposes the temporary instance (spy on `createNative` and `dispose`); no `Engine` is created (count `createNative` calls: exactly one per call); the result, passed as `render` options, renders a built list the way the file spells it; a file with no trailing newline yields the root-edge arm that spells none, and a file with one yields the arm that spells it.
- [ ] **Step 2:** Type-level tests in `descriptor.test-d.ts`: `rust.createEngine({ render: { indent: '\t' } })` type-checks and a wrong key or value fails the same way `createEngine(rust, ...)` does; `rust.styleFrom(...)` returns `Promise<RustAPI['options']>`.
- [ ] **Step 3:** Implement; glossary; the READMEs and the engine spec gain `rust.createEngine` and `rust.styleFrom` snippets, run by the README gate.

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
- [ ] **Step 2: Docs.** Glossary entries for every new declaration; the render-options spec's tree-table section describes what landed and names `styleFrom` where it named a public method; the engine spec gains `createEngine` and `styleFrom` on the descriptor; the root README and the language READMEs gain `rust.createEngine` and `rust.styleFrom` snippets, run by the README gate.
- [ ] **Step 3: Gates, three ways.** Targeted probes (wrap and render layers); `sittir validate history` across the three grammars with the numbers compared and the row diff sent for review before push; the full suite as its own call; `type-check`, both example checks, `lint`; `cargo test --workspace --no-default-features`; the tsc instantiation counts against the baseline.

## Edit lifecycle (out of scope, must not conflict)

The edit work (`$save()` and the like) is a separate design. This plan keeps to three rules so it can follow: a node keeps its tree handle, and nothing here stores a table on a node; the table belongs to the tree entry, is computed lazily and is dropped when the entry's source changes, so an edit commit has one place to invalidate; a tree id is never reused, so a render naming a replaced tree either finds the new entry or is refused, never a stale one. Spans translating lazily after an edit does not affect the inference walk, which reads the entry's current source and tree.

## Open questions

1. **Fixture schema.** The options field for parity fixtures is owned by the render-coordinate work; agree it with them before Task 8.
2. **Source-text name.** `styleFromSource` is proposed for the in-memory form.
3. **No `file-types`.** A grammar with none (scm, regex) accepts no path in `styleFrom`. Confirm, or name a fallback.
