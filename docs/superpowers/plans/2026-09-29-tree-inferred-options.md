# Tree-Inferred Options Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or superpowers:subagent-driven-development when the user chooses it) to implement this plan task by task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `styleFrom` infers a language's `render` options from files, list spacing included, with no engine created, and the caller passes the result as engine or per-call options. Nothing infers list spacing automatically: with no options supplied, a list renders with the grammar's defaults. There is no public method that returns a tree's layer: the native inference feeds the render and `styleFrom`.

**Architecture:** The tree layer exists (`options.rs::InferredOptions`): a parse reads the indentation unit and the arms of the root's edges off its source, and a render of the tree's nodes resolves over it. List spacing is not added to it: it reaches a render only through options. `styleFrom` adds list votes to its fold. The read already classifies each list slot's gaps for its stored layout (`engine.rs::ParsedTree::node_slots`), and the fold takes the same per-list classes, each list one vote for its site, beside the indentation and root-edge votes. The fold is kept as raw votes first, so `styleFrom` can add several files' votes before taking the majority, and it shares one projection from site ids to option keys with the parse result.

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
  - one gap classification feeds a list's stored layout and `styleFrom`'s fold;
  - one site table maps a list slot's sides to option sites, for the prepare code and the fold;
  - one projection from site ids to option keys serves the parse result and `styleFrom`.
- Stamped facts: a site's id is resolved by the emitter. The fold never derives one by name.
- No automatic list inference: list spacing reaches a render only through options, engine or per-call, and with none supplied a list renders with the grammar's defaults. Nothing folds a tree's lists at parse or at render.
- A failed gate stops the work for review; never revert or stash it away.
- Rendered bytes and stored layouts under default options do not move: nothing here changes what a list is measured against. The row diff goes to review before push.

## Review Focus

1. **Precedence:** the occurrence's stamp > per-call options > the tree's layer > engine options > grammar default. One test per adjacent pair. The tree's layer holds indentation and root edges only, so a list site goes from per-call options to engine options to the grammar default.
2. **One vote per list:** in `styleFrom`'s fold, a long list does not outweigh a short one; a tie takes the declared default; a site no list carries is absent from the result.
3. **Round trip:** a parsed list is measured against the engine's options, which may themselves come from `styleFrom`. A list that agrees stores nothing, a list that differs keeps its own spacing, and both render as read. With no options supplied, the same holds against the grammar's defaults.
4. **`styleFrom` sums raw votes:** with several files the votes are added before the fold, never a majority of per-file majorities. Its result is options: passed to `createEngine` they are engine options, passed to `render` per-call options. It creates no engine, and its temporary native instance is disposed even when a file is refused or fails to parse.
5. **The descriptor delegates:** `rust.styleFrom` and `rust.styleFromSource` are one-line delegates to the one implementation in `@sittir/common`; importing the descriptor loads neither the language nor the native engine.

## Delivery

One PR from master. Behaviour changes, each stated in the PR body:
- list spacing comes only from options, which `styleFrom` infers from files on request; nothing infers it automatically, so stored layouts and rendered bytes under default options do not move;
- the descriptor gains `styleFrom` (where the grammar has file types) and `styleFromSource`, and `fileTypes` becomes a literal tuple; the free forms sit beside `createEngine(language, ...)`.

Commit order: Task 0, 1, 2, 3.

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

### Task 1: List votes join the fold

**Files:**
- Modify: `rust/crates/sittir-core/src/options.rs` (`InferredVotes` and the fold; what a parse holds in `InferredOptions` is unchanged)
- Modify: `rust/crates/sittir-core/src/engine.rs` (a tree's list votes, read on request; `node_slots` reads its per-list class from the same function)
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
- **Representation.** The fold's result keeps `InferredOptions`' representation: only entries that differ from the options it was inferred over.
- **Votes from lists.** Each list slot of the tree votes once per side: the class its gaps take by majority, the same class the stored layout compares against the baseline. The site comes from the emitted table (kind, slot, side) → `SiteId`.
- **No baseline change.** A parse does not fold its lists. `read_options`, the baseline a list is measured against, stays the tree's layer over the engine's options, so its list sites come from the engine's options alone. Engine options that came from `styleFrom` are ordinary engine options: a list that agrees with them stores nothing, a list that differs stores its own class, and both render as read.
- [ ] **Step 1: Tests** over small sources:
  - a uniform list;
  - two lists of one site that disagree, two against one (majority);
  - a tie (absent);
  - a site with no list (absent);
  - a long list and a short one (one vote each);
  - nested lists of one site;
  - two sources' votes added before the fold, where a majority of majorities would differ;
  - a parse changes no option: a list site resolves to the engine's option before and after it, or to the grammar default when none is set.
- [ ] **Step 2: Round-trip tests:**
  - with engine options from the fold over the same source, a list spelled as they say stores no `before`/`after` and renders byte for byte;
  - a list spelled otherwise keeps its stored class;
  - with no options supplied, a list spelled as the grammar default stores nothing, one spelled otherwise keeps its stored class, and a built list renders with the grammar default;
  - renders of the corpus under default options are byte-identical.
- [ ] **Step 3:** Implement; regenerate; compare rows. The stored-layout counts and the render rows stay.

---

### Task 2: `styleFrom` and `styleFromSource`

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
- **What the summed votes become.** Options. Passed to `createEngine` they are engine options; passed to `render`, per-call options. They are the only way inferred list spacing reaches a render.
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
  - the result, passed to `createEngine`, renders a built list the way the files spell it, and a parsed list that spells it stores nothing;
  - a file with no trailing newline yields the root-edge arm that spells none.
- [ ] **Step 2: Type-level tests** in `descriptor.test-d.ts`:
  - `rust.styleFrom(...)` returns `Promise<RustAPI['options']>`;
  - `regex.styleFrom` does not exist, and `styleFrom(regex, ...)` is a type error;
  - `regex.styleFromSource(...)` and `styleFromSource(regex, ...)` type-check.
- [ ] **Step 3:** Implement, with JSDoc on the public declarations; the root README and the language READMEs gain `rust.styleFrom` snippets, run by the README gate.

---

### Task 3: Final gates

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

1. **Parse-time cost.** Resolved by the user's ruling: nothing folds a tree's lists at parse or at render. List spacing reaches a render only through options, which `styleFrom` infers on request, so a parse costs what it does today and a tree's lists are still measured on first use.
2. **A built node holding one tree's nodes.** Resolved by the user's ruling: it renders with engine options, then the grammar's defaults; only a render of a parsed tree's own nodes fills unset indentation and root edges from that tree's layer.
