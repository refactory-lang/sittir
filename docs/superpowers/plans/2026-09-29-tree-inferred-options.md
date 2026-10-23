# Tree-Inferred Options Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or superpowers:subagent-driven-development when the user chooses it) to implement this plan task by task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A parsed tree's layer of the render options also carries its lists' observed spacing. A built node made from one tree's nodes renders with that tree's layer. `styleFrom` infers a language's `render` options from files, with no engine created. There is no public method that returns a tree's layer: the native inference feeds the render and `styleFrom`.

**Architecture:** The tree layer exists (`options.rs::InferredOptions`): a parse reads the indentation unit and the arms of the root's edges off its source, and a render of the tree's nodes resolves over it. This plan adds one more entry type, list spacing per site. The read already classifies each list slot's gaps for its stored layout (`engine.rs::ParsedTree::node_slots`). The layer folds the same per-list classes over the whole tree, each list one vote for its site. The fold is kept as raw votes first, so `styleFrom` can add several files' votes before taking the majority, and it shares one projection from site ids to option keys with the parse result.

**Tech Stack:** Rust (`sittir-core`: `options`, `engine`, `list_slots`, `classify`, `napi_engine`), the emitted grammar crates, TypeScript (`@sittir/common`, `@sittir/types`), `@sittir/codegen` emitters, vitest and cargo.

**Spec:** `docs/superpowers/specs/2026-09-04-render-options-design.md` ("Read side", "Precedence", "Engine and boundary API"). The engine surface this plan extends is the one `packages/types/src/engine-api.ts` declares. Read both first.

## What landed, and what this plan builds on

- **The tree layer.** `InferredOptions { indent, edges }` is computed when a tree is parsed (`Engine::parse` in `engine.rs` calls `InferredOptions::infer`), holding only what the source sets apart from the engine's options:
  - the indentation unit, by the most frequent step between line starts (`options.rs::indent_unit`);
  - the arm of each root edge, classified from the file's leading and trailing whitespace.

  The parse result carries it as JSON (`inferred_options`), and a tree's lists are read against it over the engine's options (`read_options`).
- **Render names its tree.** `render(node, tree_id, options)` resolves over `tree.inferred().over(engine.options())` (`napi_engine.rs`). The JS side passes the tree of the node's own source handle (`engine.ts::renderNativeNode`, `sourceHandleOf`). A built node passes none. The newest-parse fallback and the format record (`extract_format`) are gone, so indentation has one source.
- **Cross-engine renders.** Live trees sit in one per-thread table, and a render runs on the calling engine with that engine's options as the base. No reader engine's options overlay the caller's.
- **File types.** `Language<API>` carries `fileTypes: readonly string[]`, a stamped model fact, and the descriptor already delegates `createEngine` (`emitters/index-file.ts`).
- **Lists.** A parsed list slot's gaps are measured on first use (`list_slots::slot_gaps`), each side classified (`classify::classify_whitespace`), and the majority class is stored only where it differs from the class the read options write (`SlotLayout.before`/`after`). The prepare walk fills a rebuilt list's gaps from that stored layout at slot strength (`prepare::fill_slot_gaps`), so an item added to a parsed list takes its spacing.
- **Root edges** are option sites on master (`ResolvedOptions::edge_sites`), stamped in prepare by `root_flanks` and `fill_edges`.

## Global Constraints

- Branch `feat/tree-inferred-options` from `origin/master`, in `scratchpad/wt-tree-inferred`. Commits use pathspecs.
- Generated outputs are never hand-edited: change the emitter and regenerate.
- Hand-written source under `packages/{codegen,common,tools,types}/src` carries no explanatory comments. The why of a non-obvious decision goes in the commit message, and the docs peer writes the glossary entries after the PR merges. `styleFrom`, `styleFromSource` and the descriptor's members are public API and carry their usage contract as JSDoc.
- No plan, task, PR or issue numbers in comments or docs.
- DRY:
  - one gap classification feeds a list's stored layout and the tree's fold;
  - one site table maps a list slot's sides to option sites, for the prepare code and the fold;
  - one projection from site ids to option keys serves the parse result and `styleFrom`.
- Stamped facts: a site's id is resolved by the emitter. The fold never derives one by name.
- A failed gate stops the work for review; never revert or stash it away.
- Rendered bytes under default options do not move. Stored layouts may shrink (Task 1), and the row diff goes to review before push.

## Review Focus

1. **Precedence:** the occurrence's stamp > per-call options > the tree's layer > engine options > grammar default. One test per adjacent pair, each with the list sites the tree layer now holds.
2. **One vote per list:** a long list does not outweigh a short one; a tie takes the declared default; a site no list carries is absent from the layer.
3. **Round trip:** a list that spells the tree's majority stores nothing and still renders as read; a list that differs keeps its own spacing.
4. **Tree naming:** a render takes the tree of the node's own handle, or the one tree all its parsed descendants share. Several trees, or none, means no tree layer. No render depends on which tree was parsed last.
5. **`styleFrom` sums raw votes:** with several files the votes are added before the fold, never a majority of per-file majorities. It creates no engine, and its temporary native instance is disposed even when a file is refused or fails to parse.
6. **The descriptor delegates:** `rust.styleFrom` and `rust.styleFromSource` are one-line delegates to the one implementation in `@sittir/common`; importing the descriptor loads neither the language nor the native engine.

## Delivery

One PR from master. Behaviour changes, each stated in the PR body:
- a tree's layer holds its lists' majority spacing, and a list that agrees with it stores nothing (the stored-layout counts fall; rendered bytes stay);
- a built node made from one tree's nodes follows that tree's style, where it followed the engine's options before;
- the descriptor gains `styleFrom` (where the grammar has file types) and `styleFromSource`, and `fileTypes` becomes a literal tuple; the free forms sit beside `createEngine(language, ...)`.

Commit order: Task 0, 1, 2, 3, 4.

---

### Task 0: Worktree and baselines

- [ ] **Step 1:**

```bash
cd ~/GitHub.nosync/refactory-lang/sittir && git fetch origin
git worktree add -b feat/tree-inferred-options scratchpad/wt-tree-inferred origin/master
cd scratchpad/wt-tree-inferred && pnpm install
```

- [ ] **Step 2: Baselines,** saved to `scratchpad/wt-tree-inferred/scratchpad/baseline/`:
  - `validate:native` rows, and the stored-layout counts over the corpus (`storedLayout` per tree);
  - `pnpm exec vitest run`, as its own call;
  - `type-check` and `lint`;
  - `cargo test --workspace --no-default-features`.

---

### Task 1: List spacing joins the tree layer

**Files:**
- Modify: `rust/crates/sittir-core/src/options.rs` (`InferredOptions` gains `spacing`, built from votes)
- Modify: `rust/crates/sittir-core/src/engine.rs` (the parse folds the tree's lists; `node_slots` reads its per-list class from the same function)
- Modify: `rust/crates/sittir-core/src/list_slots.rs` (the per-side class a list takes, shared)
- Modify: `packages/codegen/src/emitters/render-options-rs.ts` (the site table, keyed by kind and slot, emitted from the spacing sites the options emitter already names, `SpacingSite`)
- Create (test): `rust/crates/sittir-core/tests/inferred.rs`

**Behaviour:**
- **Votes.** `InferredVotes` holds raw counts:
  - per spacing site and arm;
  - per indentation step;
  - per root-edge arm.

  Votes add, so several sources sum before any fold.
- **The fold.** It takes, per site, the arm most votes name. A tie takes the site's declared default, which leaves the entry absent, and a site with no vote is absent.
- **Representation.** `InferredOptions` keeps its representation: only entries that differ from the options it was inferred over.
- **Votes from lists.** Each list slot of the tree votes once per side: the class its gaps take by majority, the same class the stored layout compares against the baseline. The site comes from the emitted table (kind, slot, side) → `SiteId`.
- **Baseline.** The layer is computed when the tree is parsed, so `read_options` (the baseline a list is measured against) includes it. A list that agrees with the tree's majority stores nothing, and renders as read because the render resolves over the same layer.
- [ ] **Step 1: Tests** over small sources:
  - a uniform list;
  - two lists of one site that disagree, two against one (majority);
  - a tie (absent);
  - a site with no list (absent);
  - a long list and a short one (one vote each);
  - nested lists of one site;
  - two sources' votes added before the fold, where a majority of majorities would differ.
- [ ] **Step 2: Round-trip tests:**
  - a list spelled as the tree's majority stores no `before`/`after` and renders byte for byte;
  - a list spelled otherwise keeps its stored class;
  - renders of the corpus under default options are byte-identical.
- [ ] **Step 3:** Implement; regenerate; compare rows. The stored-layout counts fall and the render rows stay.

---

### Task 2: A built node renders with its parsed nodes' tree

**Files:**
- Modify: `packages/common/src/engine.ts` (`renderNativeNode`'s tree choice)
- Test: `packages/common/tests/engine-nodes.test.ts`

**Behaviour:**
- A render takes the tree of the node's own source handle. Failing that, it takes the one tree every parsed descendant shares.
- Several trees, or none, means no tree id, so the engine's options apply.
- The descendants are walked once, by the same walk that already projects the node to native data. The helper is not `tree-token.ts::treeOf`, which answers a node's own tree only.

- [ ] **Step 1: Tests:**
  - a built list holding parsed items of one tree renders with that tree's list spacing, with two trees of different styles parsed in either order;
  - parsed items of two trees fall to the engine's options;
  - a render after the tree is disposed is refused with the existing not-live diagnostic.
- [ ] **Step 2:** Implement; compare rows.

---

### Task 3: `styleFrom` and `styleFromSource`

**Files:**
- Modify: `rust/crates/sittir-core/src/napi_engine.rs` (`infer_style(sources) -> options JSON`: one temporary parse per source, votes summed, folded, projected by the parse result's projection)
- Create: `packages/common/src/style-from.ts` (the one implementation; the free `styleFrom` and `styleFromSource`)
- Modify: `packages/common/src/create-engine.ts` (`loadLanguage` is shared and stays cached)
- Modify: `packages/types/src/engine-api.ts` (`Language<API>` gains `styleFrom` and `styleFromSource`; `fileTypes` becomes the literal tuple type)
- Modify: `packages/codegen/src/emitters/index-file.ts` (`fileTypes` emitted as a literal tuple; the delegates beside `createEngine`)
- Test: `packages/common/tests/style-from.test.ts`, `packages/rust/tests/style-from.test.ts`, `packages/rust/tests/descriptor.test-d.ts`

**Behaviour:**
- **The two calls.**
  - `styleFrom(language, ...paths)` and `rust.styleFrom(...paths)` are async and return that language's `API['options']`, holding only the keys the files show.
  - `styleFromSource(language, text, ...more)` and `rust.styleFromSource(text, ...more)` do the same over source text, and every grammar has them.
  - The methods are generated one-line delegates to the free forms; there is one implementation.
- **Loading.** The language loads through the cached `loadLanguage` that `createEngine` uses, so importing the descriptor stays cheap. A call creates one temporary native instance, parses every source with it, and disposes it, on failure too. No `Engine` is created.
- **The fold.** All sources' votes are summed before the fold of Task 1. A tie takes the declared default, and a key no source evidences is absent. The result can be passed as `render` options as it stands.
- **File types.** A path whose extension is not in the descriptor's `fileTypes` is refused at run time, naming the extension and the accepted ones.
- **The file-based gate.**
  - The descriptor's `fileTypes` is a literal tuple (`readonly ['rs']`, `readonly []`), so its type knows emptiness.
  - One conditional type adds every file-based member (`styleFrom` today) only when `fileTypes` is non-empty, and the emitter leaves the same members off such a descriptor at run time.
  - The free `styleFrom(language, ...paths)` is typed through the same conditional.
- [ ] **Step 1: Tests:**
  - one file yields its keys and only those;
  - two files sum votes (a case where the sum and the majority of majorities differ);
  - a tie takes the default;
  - a wrong extension is refused with the accepted list;
  - a file that fails to parse still disposes the temporary instance (spy on `createNative` and `dispose`), and each call makes exactly one `createNative`;
  - the result, passed as `render` options, renders a built list the way the file spells it;
  - a file with no trailing newline yields the root-edge arm that spells none.
- [ ] **Step 2: Type-level tests** in `descriptor.test-d.ts`:
  - `rust.styleFrom(...)` returns `Promise<RustAPI['options']>`;
  - `regex.styleFrom` does not exist, and `styleFrom(regex, ...)` is a type error;
  - `regex.styleFromSource(...)` and `styleFromSource(regex, ...)` type-check.
- [ ] **Step 3:** Implement, with JSDoc on the public declarations; the root README and the language READMEs gain `rust.styleFrom` snippets, run by the README gate.

---

### Task 4: Final gates

- [ ] **Step 1: Three-way gates.**
  - Targeted probes, at the wrap and render layers.
  - `sittir validate history` across the three grammars, with the numbers compared and the row diff sent for review before push.
  - The full suite as its own call.
  - `type-check`, both example checks and `lint`.
  - `cargo test --workspace --no-default-features`.
  - The tsc instantiation counts against the baseline.
- [ ] **Step 2:** The PR body states each behaviour change under Delivery, and each commit message carries the why of its non-obvious decisions.

## Edit lifecycle (out of scope, must not conflict)

The edit work is a separate design. This plan keeps to three rules so it can follow:
- a node keeps its tree handle, and nothing here stores a layer on a node;
- the layer belongs to the tree entry and is replaced with it when the entry's source changes, so an edit has one place to recompute it;
- a tree id is never reused, so a render naming a replaced tree either finds the new entry or is refused, never a stale one.

## Open questions

1. **Parse-time cost.** Folding the lists at parse measures every list slot of the tree when it is parsed, where today each node's slots are measured on first use. The alternative keeps the list part out of the read baseline and computes it lazily for renders and `styleFrom`. But a list that spelled the old baseline would then store nothing and render with the layer's majority, which breaks the round trip unless parsed lists are re-measured against the layer. The plan takes the parse-time fold. It needs the parse benchmark before and after, and the user's yes to the cost.
