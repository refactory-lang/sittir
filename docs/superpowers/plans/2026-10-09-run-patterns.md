# Run Patterns and Statement-Gap Detection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or superpowers:subagent-driven-development when the user chooses it) to implement this plan task by task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A list's gap where the item kind changes takes a run option: `(K)/run/after` for the run that ends there and `(J)/run/before` for the one that starts. `engine.styleFrom(...sources)` detects a file's own statement-gap pattern and applies it once, as ordinary engine options. Parsed statement gaps are spelled from options, not from their source text.

**Architecture:** Run patterns are resolved when the list is prepared, like seats. A boundary gap belongs to the item before it, so `prepare` writes `coalesce(run/after of K, run/before of J)` onto that item's `after` edge, ahead of the seat fill. Nothing here needs the layout table, which serves width only. Detection is one native walk per tree. It returns raw votes; the client sums them across sources, folds them into an options object, lays the `createEngine` keys over it, and hands the result to the native engine, which replaces its options. The tree's format record and the per-gap source stamps of statement lists go.

**Tech Stack:** TypeScript (`@sittir/codegen` model and emitters, `@sittir/common` client, `@sittir/types`), Rust (`sittir-core`: `prepare`, `options`, `engine`, `napi_engine`, a new `detect` module), vitest and cargo.

**Spec:** `docs/superpowers/specs/2026-10-02-layout-table-design.md`: sections "Layout inference, kind runs and gap sets", "Statement runs", "Detection" and questions 16–20. Read them first. Where this plan differs from the spec, the plan holds: run patterns no longer need the table (ruled 2026-10-09).

## Rulings this plan carries

1. **Run options are resolved at write time, not on the table** (maintainer, 2026-10-09). A boundary is stored on the preceding item's `after` edge: a sibling gap has one owner, so no `before` seat exists. `(J)/run/before` is an address resolved onto that edge.
2. **No source stamps for statement lists, and no interim that keeps them** (maintainer, 2026-10-09). Detection ships in the same plan, so an unedited file renders as itself wherever it follows its own pattern, after `styleFrom`.
3. **"Same kind" is the parser kind** (Q17), with a non-seated wrapper answering for the node it wraps (the `SeatTarget` descent, maintainer, 2026-10-09). An attribute before its item is handled by `(attribute_item)/run/after`, not by a separate prefix concept (maintainer, 2026-10-09).
4. **Boundary precedence is the existing seam law** (Q16): strength, then rank.
5. **Option precedence.** It is decided per key: per-call options, then the `createEngine` keys, then detected options, then grammar defaults. Between different keys of one options object, the more specific address wins. `styleFrom` merges the detected options and the `createEngine` keys into one object, so a detected `(attribute_item)/run/after` beats an explicit `(_)/run/after`. A grammar default is a lower layer and does not.
6. **Detection thresholds** (Q20): the majority wins; a tie or no occurrence leaves the key absent. A kind-specific key needs at least three gaps of support and must differ from the list's `(_)` value. `(J)/run/before` is detected only where J's predecessors agree and their `after` doesn't already explain it.
7. **`styleFrom` shape** (ruled 2026-10-08): `engine.styleFrom(...sources: (Tree | SourcePath<G>)[])`, with an `isSourcePath` guard and no run-time extension check. It returns the applied options with each key marked `detected`, `defaulted` or `set`.

## What exists, and what this plan builds on

- **Seats.**
  - `SEATS_<LIST>` tables are emitted per list slot, indexed by kind id (`render-options-rs.ts::seatTablesOf`).
  - `prepare` calls `fill_seated_gaps`, which fills each present item's `after` edge from its seat with `get_or_insert`.
  - A wrapper that is not itself seated descends to the seated node it holds (`SeatTarget`, `render-module.ts::seatTargetStructImpl`).
- **Source stamps.** `fill_list_gaps` (`prepare.rs`) runs before seats. It classifies an adjacent source gap onto the two items' edges at `SEAM_TRIVIA` strength, so no option replaces it.
- **The seam law** (`spacing.rs`): strength (`SEAM_FALLBACK` < `SEAM_CASCADE` < `SEAM_DECLARED` < `SEAM_TRIVIA`), then rank (`seam_rank`: space 1, tight 2, newline 3, blank line 4, double 5).
- **Format record.** `Engine::parse` calls `format::extract_format`, and a tree's renders apply that record. Detection replaces it.
- **Engine options** are resolved once, in the constructor.
- **Addresses.** The preference-address surface gives `(source_file)/statements:/(_)/after` and `(K)/after`, with `(_)` as the wildcard and a strict subset winning.

## Global Constraints

- Branch `feat/run-patterns` from `origin/master` **after the typed reader's 1c-i has merged**, in `scratchpad/wt-run-patterns`. `prepare.rs` and `engine.rs` change there. Commit with pathspecs.
- Generated outputs are never hand-edited. No comments in `packages/codegen/src/`; every new declaration gets a `docs/glossary/` entry. No PR or issue numbers in code, glossary or commits.
- DRY:
  - one coalesce function (the seam law), called by the writer and by `prepare`;
  - one source for which lists have runs: the options block's run declarations (Task 1), read by the run tables, the stamping and detection;
  - one kind-of-item answer, reusing the wrapper descent `SeatTarget` already has.
- **Byte-identical gate for Tasks 1–2:** with no run option set, every generated render and every validation row is unchanged.
- A failed gate stops the work for review. Never revert or stash the failing state.

## Review Focus

1. A run boundary is the preceding item's `after` edge only, so no `before` seat is introduced.
2. An unset run option marks nothing, so today's seat applies.
3. An unedited file renders byte-for-byte after `styleFrom(tree)` wherever it follows its own pattern (acceptance tests, Task 8).
4. Rust attributes stay directly above their items under detection, and under `(attribute_item)/run/after` when it is set explicitly.
5. With no `styleFrom` call, a parsed file's statement gaps are spelled from defaults. That is the ruled behaviour change, named in the PR body.

---

### Task 1: Run declarations in the options block

**Files:** `packages/{rust,typescript,python}/grammar.sittir.ts` (`options` blocks), the options-declaration resolver (`compiler/model/site-preferences.ts` and its address tables), the glossary.

A site exists only where the grammar's `options` block names it, directly or through a label. That's the existing scope rule (maintainer, 2026-10-09). A list has runs because its grammar declares them, not because a fact is derived:

- Each grammar declares the run addresses of its statement lists: rust `source_file`, `declaration_list` and `block`; typescript `program`, `statement_block` and `class_body`; python `module` and `block`. For example, `'(source_file)/statements:/(_)/run/after'` and `…/run/before`. They take **no default** (Global Constraints: unset marks nothing).
- Declaring a list's wildcard run addresses mints that list's per-kind run sites, `(K)/run/after|before` for every kind its items admit, the way seated `(K)/after` sites are minted for a seated list.
- Rust also declares `'(source_file)/statements:/(attribute_item)/run/after': newline` (and the same for the other two lists) as a declared default.
- How a declaration with no default is spelled is the resolver's call. Keep it to one spelling and add it to the options glossary.

- [ ] The declarations, the resolver change, and a test that each declared list's run sites resolve and an undeclared list has none.
- [ ] Gate: generated output byte-identical apart from the new site entries, which are unused until Task 2.

### Task 2: Run sites and boundary fill

**Files:** `packages/codegen/src/compiler/model/site-preferences.ts` (or wherever list sites are minted), `emitters/render-options-rs.ts`, `emitters/options.ts` (address type), `emitters/render-module.ts` (`prepare` emission), `rust/crates/sittir-core/src/prepare.rs`, `spacing.rs` (export the coalesce), tests per grammar.

- **Sites** come from Task 1's declarations. The address type prints them under the list slot as the seated `(K)/after` keys are printed. A run site with no declared default resolves to nothing when unset.
- **Tables.** `RUNS_<LIST>_AFTER` and `RUNS_<LIST>_BEFORE`, dense by kind id like the seat tables, plus the list's wildcard site ids.
- **Fill.** `fill_run_gaps(items, after_table, before_table, ctx)` runs after `fill_list_gaps` and before `fill_seated_gaps`. For each adjacent pair of present items, take K and J as the kinds `SeatTarget`'s descent answers (the wrapped node for a non-seated wrapper). If K ≠ J:

  ```
  a = run_after[K] ?? run_after[_]      // resolved option, or none
  b = run_before[J] ?? run_before[_]
  prev.after.get_or_insert(coalesce(a, b))   // only when a or b is set
  ```

  `coalesce` is the seam law: strength first, then rank. It is the writer's own function, exported, not a copy.
- [ ] Failing tests per grammar: with `(_)/run/after: blankline`, a built `[use, use, fn]` renders a blank line only before `fn`. Add `(fn_item)/run/before: double_blankline` and it gets two, by rank. With `(attribute_item)/run/after: newline` also set, `#[derive]` stays directly above `struct`. With nothing set, output is byte-identical.
- [ ] Gate: no run option set means byte-identical generated output (besides the new tables) and identical rows. Run the full suite as its own call.

### Task 3: Statement lists drop source stamps

**Files:** `emitters/render-module.ts` (`listGapClassification`), `prepare.rs` if the call shape changes.

- [ ] `fill_list_gaps` is no longer emitted for lists that declare runs (Task 1); other lists keep it.
- [ ] Gate:
  - read-render-parse rows unchanged, since an AST compare is neutral to whitespace;
  - name every byte fixture that moves (dogfood render bytes and similar), and stop there. Task 8 re-baselines them through `styleFrom`, so nothing is edited by hand.

### Task 4: Native detection

**Files:** create `rust/crates/sittir-core/src/detect.rs`; `engine.rs`; tests.

`detect(tree) -> StyleVotes`. For every list in the tree that declares runs, classify each gap between adjacent items with `classify_whitespace` against the list's admitted arms:

- **inside a run:** a vote for `(_)/after` and for `(K)/after`;
- **at a K→J boundary:** a vote for `(K)/run/after`. The vote for `(J)/run/before` is kept per predecessor, so the uniformity test in ruling 6 can run after the sum.

Also count the indent unit (the line-start consensus that `extract_format` uses today, moved here) and the line ending (the majority of logical breaks, once the line-endings plan has landed; until then it isn't counted). Gaps holding a comment are skipped. The votes are raw counts keyed by address, so they sum across trees.

- [ ] Unit tests on small sources per grammar: pure runs, a boundary, a tie, an attribute run.

### Task 5: The engine replaces its options

**Files:** `engine.rs`, `napi_engine.rs`, `packages/types` engine API.

- [ ] A native `replaceOptions(options)` resolves an options object exactly as the constructor does and swaps it in. Trees already parsed are untouched, since they hold no options.
- [ ] Remove the tree format record: `extract_format` at parse and the per-tree apply go, and indentation is one fact, the engine's `layout.indent`. Name in the commit message every test whose expectation moves, and verify each against this ruling (standard 4).

### Task 6: `engine.styleFrom`

**Files:** `packages/common/src` (engine surface), `packages/types/src/engine-api.ts`, the engine emitter for `SourcePath<G>`, tests.

- [ ] `SourcePath<G>` is `` `${string}.${FileType}` `` from the descriptor's `fileTypes`, and `never` when there are none. Add `engine.isSourcePath(p): p is SourcePath<G>`.
- [ ] `styleFrom(...sources)`:
  1. read each path with `fs.readFile` and parse it with the engine;
  2. call native `detect` on every tree;
  3. sum the votes and fold them by ruling 6 into an options object;
  4. lay the `createEngine` keys over it;
  5. call `replaceOptions`;
  6. dispose the trees parsed from paths (in `finally`; trees passed in are left alone);
  7. return the applied options, each key marked `detected`, `defaulted` or `set`.

  The call is `async` because of the file reads.
- [ ] Public API JSDoc on `styleFrom` and `isSourcePath` (the createEngine-reachable surface rule); the rationale goes in the glossary.

### Task 7: Remove what detection replaces

- [ ] Any engine-less `styleFrom(language, …)`, `rust.styleFrom(...)` or `styleFromSource` still present goes. Source text is parsed with `engine.parse` and passed as a tree.

### Task 8: Acceptance

**Files:** `packages/{rust,typescript,python}/tests/run-patterns.test.ts`.

For each grammar, over the corpus files listed in the gap census's statement-runs probe:

- [ ] After `styleFrom(tree)`, an unedited render equals the source wherever its statement gaps follow the file's pattern. Report every file that differs, with the departing gaps; those are the "evened out" gaps the spec accepts.
- [ ] A statement inserted mid-run takes the run's within gap; one inserted at a boundary takes the boundary gap.
- [ ] An explicit per-call option wins over a detected one.
- [ ] Python: imports followed by a class come out with two blank lines when a detected `(import_statement)/run/after` of one meets a `(class_definition)/run/before` of two.
- [ ] Re-baseline the byte fixtures Task 3 named, through `styleFrom`, with a row diff first.

### Final gates

`validate:native` rows compared with `validate history` (read-render-parse unchanged), the full vitest suite, workspace type-check, lint, and `cargo test --workspace --no-default-features`.

## Delivery

One PR. Its body names the behaviour change: without `styleFrom`, a parsed file's statement gaps and indentation come from the engine's options, not from the source. `styleFrom` is the way to keep a file's own style.
