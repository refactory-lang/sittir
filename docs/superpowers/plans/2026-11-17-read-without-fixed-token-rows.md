# A parsed read stores no row for a fixed token or a unit: stage one

> **Execution:** the prototype session executes this plan inline, task by task, with superpowers:executing-plans. This repository uses no subagents for code. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status:** written 2026-11-17, updated 2026-11-22. **It lands inside the hydrate-at-parse branch and its PR, and Task 10, the render's table, follows Task 9 there** (the maintainer, 2026-11-22: "2 and let's have prototype finish it in one shot"). Tasks 2–10 and 3a run straight through, by the rule in the arena plan's Task 6 status:
- Each commit runs its own targeted tests, red then green, and each piece is pushed so CI runs its suite.
- `validate:history`, the full suites, storage parity and the census run once, at Task 10's gates on the final head. A step below that names one of them is read that way. Task 3a's arena baseline still runs at Task 3a, since the final comparison reads it.
- The stop conditions below still stop the work.
- Public items are built without rows first, listed in the PR body, and judged at the merge question.

Where the work stands:
- **Task 1** is done. It ran ahead of the merge, by brainstorm's word (2026-11-17), on `test/read-census`, cut from the hydrate-at-parse head. It wrote no production code. That branch merges into the hydrate-at-parse branch before Task 2. Both of its stops are ruled (2026-11-17):
  - a parsed list's delimiter is its delimiter option, resolved by the generated read code by one logic for both storages (Task 4). This superseded the same day's "decided by kind" and "store nothing; the options decide";
  - named fixed tokens leave query results (Task 6).

  Task 4 is written from the delimiter audit (2026-11-17). `probe/delimiter-by-kind` and `probe/delimiter-options-decide` are kept. In arena storage a node is named by its `NodeId`, so wherever this plan says a coordinate or a node's index, read that node's `NodeId`. A unit is named by its holder's `NodeId` and its slot, which is what `NodeSite::Unit` means below. A flag's keyword has no cell, so it has no site, and no side is kept on it (the arena spec).
- **The same-line comment branch** (`fix/same-line-comment-after-separator`): a comment last on its row after an item's separator is leading of the next item, as on master. The maintainer, 2026-11-17: "Preserve master's behavior - let's not solve this one right now". Replacing that item loses the comment; that is a known gap, filed as an issue. Giving the comment to the item before was built and withdrawn, and nothing of its tokens-between fact remains.

  The branch still carries:
  - `trivia_table::owner`, the one placement that both the object read's placer and the arena parse walk call;
  - the same-row rule measured from the holder's end row in both storages;
  - the kept-side capacity fix (`RecordSink::kept`);
  - `headerOf`.

  It merges into the hydrate-at-parse branch.
- **The scanner change Task 4 relies on** (no automatic semicolon in a list's trailing spot) is merged into the hydrate-at-parse branch (`cb0515444`), after the spec's before-and-after tree checks. It adds no case to the known gap: the comment in `a: string // c⏎  b: number` trails `a`, because placement passes over the empty semicolon, so replacing `b` keeps it. A same-line comment after a statement's automatic semicolon now trails the statement, as it does after an explicit `;`.
- **The storage audit** (2026-11-18): its table is `docs/superpowers/specs/2026-11-18-one-read-rule-per-fact-design.md`, "The four facts" and "Left unread by the audit". Its baseline is three numbers, measured on the validation corpus of the five grammars (440 sources, 15,024 nodes), comparing object and arena storage:
  - 0 root snapshots differ;
  - 0 untouched node renders differ;
  - 0 of 13,880 layout runs are apart.

  Of the six facts it left unread, three are still to read: a list slot's separator kind, MISSING, and an `ERROR` as a side entry against its own record. The other three are read and go to brainstorm with them.

  That spec is an enhancement, not stage-one work.
- **Task 3a** is added: the spec's gate "The stored-layout row answers for an arena tree" (accepted by the maintainer, 2026-11-18). It runs before Task 4, whose gate is the first to compare layout rows in arena storage.

How this line is kept:
- Each finished task is ticked, and this line names the task in progress.
- A stop condition replaces this line with the stop and its cases until it is ruled. The stop conditions are:
  - Task 4: a `validate history` row that moves, or a list whose stored delimiter or separators differ between object and arena storage;
  - Task 6: a dropped named fixed token that is not one of the pairs in the spec's "What navigation lists";
  - Task 8: a placement change that is not beside a named fixed token;
  - Task 9: a failed gate.

**Goal:** A parsed read writes no run row for a fixed token or a unit, every reader answers as it does today on every fixture, and a render keeps no table of the nodes it visits.

**Architecture:**
- The hydration walk keeps every token in its working list, for seating, and writes only slot content and trivia to the run.
- What readers took from the dropped rows comes from three places:
  - the holder kind's render body, as facts generated per kind;
  - facts the walk stamps where it meets the tokens;
  - the record's cells.
- Until the last task, a read can still write every row (`ReadRows::All`). A parity test parses each fixture both ways and compares each reader's answer on the old tree with the new reader's answer on the new tree.

**Tech Stack:** Rust (`sittir-core`, `sittir-node-macros`, the generated grammar crates), TypeScript codegen (`packages/codegen`), vitest, cargo.

**Spec:** `docs/superpowers/specs/2026-11-17-read-without-fixed-token-rows-design.md`. It is the authority; the plan argues from it.

## Global Constraints

- "A parse writes a row only for slot content that is text the source carries (a variable-text leaf, or a node with no record holding one), and for what lies under trivia. It writes no row for a fixed token. It writes none for a unit either."
- "A fixed token's text comes from its kind. … No byte offset of a fixed token is stored."
- "A record's own coordinate (`AT`: kind, start, end) stays, and so does every offset of text the source carries."
- A list writes one separator in every gap: the slot's stored separator, else the options' (the maintainer, 2026-11-21: an item owns no separator). The single-element rule (`AssembledList::singleElementNeedsTrailing`) is unchanged. A list carries a delimiter option, as a built list given one does; the generated read resolves its value from the tree once, and that resolution is the same code whichever storage holds the result.
- No new storage form: no bit beside the run, and no new field in `SideSlot`.
- A unit's place among its holder's children is where the kind's render body writes its slot.
- Named fixed tokens leave navigation. A comment beside one is seated as a built node seats it.
- Facts are stamped where they are made and never re-derived from text at run time (working standard 3). Generated outputs are regenerated, never hand-edited (standard 6).
- Ratchets only tighten: the `deep_read_words` pins and the lock-free census ceilings.
- No comments in `packages/codegen/src/`; glossary entries carry the why. No spec, plan, PR or task numbers in code, docs or comments.
- Once a parse has written its records, a fixed token is no child and has no site and no `NodeId`. Its holder's template writes it (the maintainer, 2026-11-22: "Fixed tokens NEVER get a site", "It's in the template").
- Release of parsed records stays as the branch built it (2026-11-20: "A: release like built"). A row holds no reference, so removing rows changes no count.

## Review Focus

1. **A list rebuilt from a parsed list whose last item was replaced.** The option its read resolved stays with it, so rust `f(a, b,)` with `b` replaced renders `a, a,`. Cleared, it takes the options' value. Task 4 pins it: `a_cleared_delimiter_takes_the_options`.
2. **A comment beside a flag or a unit.** A flag has no site, so in `& /* c */ mut T` the comment leads `T`, as it does today. A side on a unit that a cell holds is keyed by the unit's site and renders where it did. Task 8 pins both: `a_comment_beside_a_flag_stays_on_its_neighbour` and `a_comment_beside_a_unit_keeps_its_side_through_the_units_site`.
3. **A zero-width fixed token at a record's edge:** python's `newline` from a `tokenSeam`, `indent` and `dedent`, and typescript's automatic semicolon in a separator gap. Edge levels and depth moves answer as today. Task 5 pins it: `edge_levels_at_a_zero_width_fixed_token_agree`.
4. **A MISSING fixed token inside a list**, for example rust `fn f( {` and typescript `if (a {`. The list's stamps and its edge levels match the old tree, and the holder keeps `HOLDS_ERROR`. Tasks 4 and 5 cover it through `with_errors`, which the parity fixtures include.
5. **A variable-text leaf that ends in `\r\n`, followed at once by a fixed token.** The line-start bit is set on it, as the `\n` test today counts it. Task 7 pins it: `a_crlf_leaf_followed_by_a_fixed_token_keeps_its_line_start`.

## Public surfaces this stage changes

These rows are from the spec's § Public surfaces, approved by the maintainer. The rows marked *new* come from the 2026-11-17 rulings and are listed in the PR body with the rest, for the merge question.

| surface | change | task |
|---|---|---|
| addon `siblings` | a unit sibling has no span; a named fixed token is no sibling | 6 |
| addon `descendants` / `readDescendants`, `$children`, `$descendants` | a named fixed token of a pair in the spec's "What navigation lists" is no longer yielded (29,447 items across the census corpora); every other item is unchanged; resume paths renumber | 6, 9 |
| *new:* `$query()` views (`$children`, `$descendants`, `ofType`, `where`, `find` and the rest) | a query for such a token's kind finds none of them; a query for the holder's kind finds each, as for a built node: `ofType(kinds.SelfParameter)` matches `&self`, and `ofType(kinds.Self)` finds nothing inside it | 6, 9 |
| `$text`, `lineStartsInsideTokens`, the parse's error list | unchanged | 1, 7 |
| `$snapshot` | lists no fixed token (Task 1's test) | 1 |

Internal, not public: `arena::side::FIELD_BITS` goes from 10 to 9 (Task 7), still guarded by `Engine::with_store` and `record_nodes.rs::field_fits`. `NodeSite` gains `Unit`, `RecordShape` gains `order` and `edges`, and `SourceTable::last_list_child_kind` and `engine::last_list_child` go, as second derivations of a list's delimiter.

## File map

- `rust/crates/sittir-core/src/arena/hydrate.rs`: the walk. It keeps a working list, numbers the written entries, and stamps the separator choices and the line-start bit.
- `rust/crates/sittir-core/src/arena/side.rs`: `NodeFacts::abuts_next`, `FIELD_BITS`.
- `rust/crates/sittir-core/src/arena/admit.rs`: `RecordShape::{order, edges}`, `EdgePart`.
- `rust/crates/sittir-core/src/arena/run_nodes.rs`: navigation lists units from cells and names `NodeSite::Unit`.
- `rust/crates/sittir-core/src/engine.rs`: the readers (`Lookups::edge_levels`, `depth_move`, `node_slots`, `line_starts_inside_tokens`) and `parse_records_with`.
- `rust/crates/sittir-core/src/prepare.rs`, `render.rs`, `napi_engine.rs`: `source_trailing_delimiter` and `SourceTable::last_list_child_kind` go.
- `rust/crates/sittir-node-macros/src/{attrs,hydrate,expand}.rs`: the `order` and `edges` attributes, roles at meet, separator stamps.
- `packages/codegen/src/emitters/render-body.ts` and `render-module.ts`: `bodySlotOrder`, `bodyEdgeParts`, the depth-kind check; a list's prepare fills an unset delimiter from the options, and `sourceTrailingSeparator` goes.
- `rust/crates/sittir-parity-tests/src/lib.rs`: `read_fixtures`, moved out of `record_nodes.rs`, plus `out_of_order_units`.
- `rust/crates/sittir-parity-tests/tests/stage_one_parity.rs`: new; every parity test below.
- `rust/crates/sittir-parity-tests/tests/read_census.rs`: new; the census probe, kept.

**Commands.** `PARITY` stands for `cargo test -p sittir-parity-tests --no-default-features --features arena --test stage_one_parity`, run from the repository root. `CENSUS` stands for one run per grammar and corpus, with absolute paths, since the test runs in its crate's directory: `SITTIR_CENSUS_GRAMMAR=<lang> SITTIR_CENSUS_CORPUS=<label> SITTIR_CENSUS_SOURCES=<file | list:<file of paths> | json:<paired-run corpus>> SITTIR_CENSUS_OUT=<dir>/out.jsonl cargo test -p sittir-parity-tests --no-default-features --features arena --test read_census -- --ignored`. The runs append to one file. Then run `node docs/superpowers/probes/2026-11-17-read-coordinate-census/analyze.mjs <dir>`, which reads `<dir>/out.jsonl` and the role models in `<dir>/models/` (each grammar's `node-model.json5`, `render-bodies.json` and its `grammar.json` externals).

---

### Task 1: Probe

**Files:**
- Create `rust/crates/sittir-parity-tests/tests/read_census.rs`, from the census probe (`coordinate_census.rs`), `#[ignore]`, run as `CENSUS` describes.
- Modify `docs/superpowers/probes/2026-11-17-read-coordinate-census/{README.md,analyze.mjs}`.
- Test: `packages/rust/tests/snapshot-fixed-tokens.test.ts`.

**Interfaces:** Produces counts only; no production code.

- [x] **Step 1: Run the census unchanged and check the reconciliation.** Run it on the paired corpora, the two `deep_read_words` fixtures, matter.js and next.js (fetching corpora is approved). Command: `CENSUS` for each corpus, then the analyzer. Expected: `engine.rs` has 62,092 words and `create-engine.ts` 35,611, as the README reconciles.
- [x] **Step 2: Add the tallies the later tasks need.**
  - `abutting_leaves`: variable-text leaves whose text ends in `\n` and whose next token in the token walk starts at their end, that token being a fixed token or a unit.
  - `choice_lists`: parsed lists of a kind with more than one separator candidate and at least one gap.
  - `choice_outliers`: gaps whose kind is not their list's majority.
  - `delimiter_disagreements`: parsed flanked lists whose kind leaves the trailing flank optional and whose stamped `TRAILING` differs from the kind rule (a child routed `Route::Separator` for the list's slot follows its last item), by direction and list kind (`delimiter_to_trailing`, `delimiter_to_none`). The first sweep compared the stamp with `engine::last_list_child`; that comparison went with the ruling.
  - `named_fixed_query_items`: named nodes that `ParsedTree::descendants` yields whose stage-one fate is dropped, with the role their holder's route gives them (the spec's navigation table). Every one the census found is a `QueryItem::Unit`.

  Rerun Step 1's command. Expected: the five tallies are printed per corpus.
- [x] **Step 3: Check the error list.** Run `find_all_references` on `engine.rs::error_regions` and confirm every caller passes `TreeNodes` before the tree is dropped. If any caller reads records, stop and report.
- [x] **Step 4: Write the `$snapshot` test.**

  The test parses rust `fn f(a: u8, b: u8) {}`, takes the function item's `$snapshot()`, and collects every `$type` in it recursively, with a test-local helper. It asserts the set holds neither the kind id of `(` nor that of `,` (from `packages/rust/src/kinds.ts`).

  Run `pnpm exec vitest run --config vitest.config.ts packages/rust/tests/snapshot-fixed-tokens.test.ts`. Expected: PASS. A FAIL is not fixed here: it goes to brainstorm as the `$snapshot` row.
- [x] **Step 5: Record and report.**
  - Add the counts to the README under "Stage-one counts".
  - Send brainstorm the five tallies and the two checks.
  - A non-zero `delimiter_disagreements` or `named_fixed_query_items` stops the plan. Report it to brainstorm with every case (source, node kind, span and both answers) and set the Status line to the stop; brainstorm takes it to the maintainer.
  - Commit: landed as `fe7115ea4` on `test/read-census`, and the kind-rule tally as `9eeca19fb`.

### Task 2: Body facts generated per kind

**Files:**
- Modify `packages/codegen/src/emitters/render-body.ts`, `render-module.ts`, `rust/crates/sittir-node-macros/src/{attrs,expand}.rs` and `rust/crates/sittir-core/src/arena/admit.rs`.
- Test: `packages/codegen/src/emitters/__tests__/render-body.test.ts` and `rust/crates/sittir-parity-tests/tests/stage_one_parity.rs`.

**Interfaces:** Produces:
- `RecordShape::order: &'static [BodySlot]`: every slot of the kind, in the order the render body writes them.
- `pub enum BodySlot { Cell(u8), Flag { word: u32, bit: u8, kind: KindId } }`. `Cell` indexes `cells`. A flag is a bit in the presence words and has no cell; its `kind` is the keyword's stored kind, or its display kind for `presence = display(...)`.
- `RecordShape::edges: [&'static [EdgePart]; 2]` for `Side::Before` and `Side::After`.
- `pub enum EdgePart { Token(KindId), Slot(BodySlot), Guarded { slot: BodySlot, token: KindId } }`.

- [ ] **Step 1: Write the failing codegen tests.**
  - `bodySlotOrder(rust reference_type)` equals `['lifetime', 'exclusive', 'type']`.
  - `bodySlotOrder(typescript subscript_expression)` equals `['object', 'optional_chain', 'index']`.
  - `bodyEdgeParts(rust let_declaration, 'before')` equals `[{ token: 'let' }]`.
  - `bodyEdgeParts(typescript function_declaration, 'before')` equals `[{ slot: 'async' }, { token: 'function' }]`.
  - `bodyEdgeParts(rust let_declaration, 'after')` equals `[{ token: ';' }]`.
  - A `text` part inside an `if` arm on slot `s` gives `{ guarded: 's', token }`.
  - A `seam` part gives nothing.
- [ ] **Step 2: Run the codegen tests.** Run `pnpm exec vitest run packages/codegen/src/emitters/__tests__/render-body.test.ts`. Expected: FAIL, `bodySlotOrder` is not defined.
- [ ] **Step 3: Implement the two functions.**
  - `bodySlotOrder(body: RenderPart[]): string[]` takes each slot at its first appearance across arms. Throw when two arms order two slots both ways: none does today, which the spec states.
  - `bodyEdgeParts(body: RenderPart[], side: 'before' | 'after'): EdgePartSpec[]` reads parts from that edge and stops at the first unconditional `Token` or required slot.
  - Token kinds resolve through the catalog's kind ids, never by text at run time.
  - `render-module.ts` stamps `#[node(order = [...], edges = ([...], [...]))]` on every struct with `words`.
  - It also fails generation when a kind whose body has an `indent` or `dedent` part has no `words`, with the diagnostic "`<kind>` writes a depth part but is read with no record".
- [ ] **Step 4: Add the derive attributes.** `attrs.rs` parses `order` and `edges`; `expand.rs` emits them in `RecordCells::shape`.
- [ ] **Step 5: Write the failing Rust test.** `record_shapes_order_cells_as_their_bodies_write_them` in `stage_one_parity.rs` asserts:
  - rust `reference_type`'s `order` is `lifetime`'s cell, `exclusive`'s flag, then `type`'s cell;
  - every record kind of the five grammars has one `order` entry for each cell and each flag.
- [ ] **Step 6: Regenerate and run.**
  - Regenerate each grammar: `pnpm exec tsx packages/cli/src/cli.ts gen --grammar <lang> --all --output packages/<lang>/src`.
  - Run `PARITY record_shapes`. Expected: PASS.
  - The codegen tests also pass.
  - `pnpm run validate:history` is unchanged per row.
- [ ] **Step 7: Commit:** `feat(codegen): each record kind's slot order and edge parts, from its render body`.

### Task 3: The walk's two modes

**Files:**
- Modify `rust/crates/sittir-core/src/arena/hydrate.rs`, `rust/crates/sittir-node-macros/src/hydrate.rs`, `rust/crates/sittir-core/src/engine.rs` and `rust/crates/sittir-core/src/arena/run_nodes.rs`.
- Test: `stage_one_parity.rs`.

**Interfaces:**
- Produces `pub enum ReadRows { All, SlotContent }` and `Engine::parse_records_with::<N>(source: &str, rows: ReadRows)`. `parse_records` calls it with `ReadRows::All` until Task 9.
- Produces `NodeSite::Unit(trivia_store::Site<Address>)`.
- Produces the derive call `records.role(route: &Route)`, made right after `records.meet(cursor)` in `routed`.

- [ ] **Step 1: Write the failing tests.**
  - `a_slot_content_read_writes_no_fixed_token_row`: typescript `f(a, b)` with `ReadRows::SlotContent` has an `arguments` run of exactly 2 rows (`a`, `b`), with cells naming rows 2 and 3. With `ReadRows::All` it has 5 rows, as the spec's figure shows.
  - `a_slot_content_read_holds_a_unit_by_its_kind`: rust `&mut T`'s `exclusive` and a typescript `expression_statement`'s automatic-semicolon terminator decode as `Cell::Unit { kind, row: None }`, the built form.
- [ ] **Step 2: Run them.** Run `PARITY slot_content`. Expected: FAIL, `parse_records_with` is not found.
- [ ] **Step 3: Implement the two modes.**
  - **Working list.** `OpenRun` keeps `entries` and `beside` as the working list, plus `kept: Vec<bool>`. An entry is kept when either:
    - its role is slot content held as a leaf or record, or trivia; or
    - it lies inside a kept row.

    The derive's `records.role(&__route)` sets the role: `Route::Slot` is slot content, `Route::Trivia` is trivia, anything else is a fixed token. A slot value that resolves to `Hydrated::Unit` un-keeps its entry. In `ReadRows::All` every entry is kept.
  - **Numbering.** `held` and `site` map a working-list entry to its written number, the count of kept entries before it, plus 2 for a cell's row.
  - **Writing.** `finish` writes only kept entries and recomputes each written row's `inner` over the kept entries.
  - **Units.** A unit cell is written with `row: None`.
  - **Seating.** `placed` reads the working list. A dropped fixed token counts as unnamed for seating. A dropped unit's site is `NodeSite::Unit` of its holder, slot word and item.
- [ ] **Step 4: Run.** Run Step 2's command. Expected: PASS. `cargo test --workspace --no-default-features` is unchanged, since `parse_records` is still `All`.
- [ ] **Step 5: Commit:** `feat(core): a read that writes slot content and trivia rows only, beside today's`.

### Task 3a: The stored-layout row answers for an arena tree

The spec's gate (accepted by the maintainer, 2026-11-18). It runs before Task 4, whose gate is the first to compare layout rows in arena storage. `layoutBaseline`, `layout-runs.ts` and `layout-baseline.test.ts` went with lazy placement, so `storedLayout` is the diagnostic left to move. `layoutWork` stays object-only: no validate row reads it, its two tests pin object storage, and an arena read has no tree to accumulate it on until the arena plan's Task 10 makes work the call's record.

**Files:**
- Modify `rust/crates/sittir-core/src/napi_engine.rs`, `packages/common/src/engine.ts` (`NativeEngineLike`) and `packages/tools/src/validate/stored-layout.ts`.
- Test: `packages/tools/tests/stored-layout.test.ts`.

**Interfaces:**
- Produces the addon function `readStoredLayout(engine, node)`, listed in the PR body. `runStoredLayout` reads the storage its lane names.

- [ ] **Step 1: Write the failing test.** `stored-layout.test.ts` runs under `nodeStorage: 'arena'` as well as object. For every validation-corpus source of the five grammars, the stored layout answers from the lane's own tree, not from a bare parse.
- [ ] **Step 2: Run it.** Run `pnpm exec vitest run --config vitest.config.ts packages/tools/tests/stored-layout.test.ts`. Expected: FAIL, since the arena lane has no tree id to pass.
- [ ] **Step 3: Implement** `readStoredLayout` and the lane's read.
- [ ] **Step 4: Run.**
  - Step 2's command. Expected: PASS.
  - `validate --node-storage arena`: the stored-layout row now describes arena trees. Each row that moves is listed and sent to brainstorm. Once accepted, it is the arena baseline that Task 4 compares against. Object storage's rows do not move.
- [ ] **Step 5: Commit:** `feat(tools): the stored-layout row answers for an arena tree`.

### Task 4: A list's delimiter and separators, resolved once in the read

The maintainer's rulings (2026-11-17, the spec's Decided list):
- A list carries a delimiter option. The generated read resolves its value from the tree once, by the same code for both storages.
- Where the storages differ, object storage's read is the reference.
- The automatic semicolon is not permitted in a list's trailing spot. The grammar cannot say it, because the scanner emits the token wherever a gap admits it. It is fixed in typescript's vendored scanner, which inserts the token before a same-line `//` comment as tree-sitter-javascript 0.25 does. That commit merges into this branch before this task, so the reader's test is unchanged.

**Audited** on the hydrate-at-parse head (`36e7493cf`), in both storages, over the spec's fixed sources and the 1,251 flanked lists of the paired corpora:
- The storages already share the delimiter's resolution. `read::delimiter` is called by the derive at parse, by `list_inits` for object and by `hydrate::routed` for arena, over the same tree-sitter children. The two agree on every list.
- What duplicates is the readers. One fact has three derivations:
  1. **The parse's:** `read::delimiter`, a span test, or a count test when the end item is a scalar unit.
  2. **The query's:** on every `Plan::Delimiter` evaluation, the generated `ReadNode::delimiter` re-runs `routes` and `read::delimiter` over `ParsedTree::nodes()`. In arena storage that navigation is the run rows, which Task 9 strips of separators. Python's portable `trailingComma` flag goes through this reader.
  3. **The render's fallback:** `prepare::source_trailing_delimiter` → `SourceTable::last_list_child_kind` → `engine::last_list_child`, a width-and-kind test. It is reached by a list with a source and no delimiter: a list after `$with.delimiter(undefined)`, and a built list seated where a parsed list was.
- A list's separator has no resolution at read. `Lookups::node_slots` derives it at render from the majority of the tree's gaps, cached per tree. An item keeps none.

**What changes:**
- **The delimiter at parse:** unchanged.
- **The query:** `EngineGrammar::delimiter` answers from the stored option where the backing holds records: arena reads the list record's side `DELIMITER`. A backing that holds tree-sitter's tree is object storage, whose read results live in the JavaScript nodes. It answers by the same `read::delimiter` call over the tree's children, at query time. The two differ only in when they run, which is the one difference between storages the maintainer allows (brainstorm, 2026-11-17).
- **The render fallback's second reader goes.** A list rebuilt from a source list takes the trailing flag of that source's resolved delimiter, through the query above, and the leading flag from the options. A list with no source takes the options' value: its generated prepare fills `ctx.options.delimiter_at(site)`.
- **The list's separator at parse:**
  - One function resolves a separated slot's separator from its gaps: the kind most of them take, a tie going to the arm of the options the tree was read with, kept only where it differs from that arm. A render call's options never enter it.
  - The arena walk calls it while it holds the children and stamps `SideSlot::separator`, and `Records` reads the stamp. Object storage calls it over the tree's children at lookup (`Lookups::node_slots`), since its tree still answers. As with the delimiter, the two differ only in when they run, and no object row or wire shape changes.
  - Every gap of a rebuilt list writes the slot's separator, else the options'.

**Files:**
- Modify `rust/crates/sittir-node-macros/src/expand.rs` (`routed_body`, `flank_delimiter`, `list_inits`) and `hydrate.rs` (`routed`, `record_end`).
- Modify `rust/crates/sittir-core/src/read.rs`: add the list's separator resolution; `delimiter` is unchanged.
- Modify `rust/crates/sittir-core/src/engine.rs`: `EngineGrammar::delimiter`, plus `Lookups::node_slots` and `slot_separator`.
- Modify `arena/hydrate.rs` and `arena/prep.rs`.
- Modify `packages/codegen/src/emitters/native-crate.ts` (the generated `EngineGrammar::delimiter`) and `render-module.ts` (`prepareStructImpl`: the options' delimiter). Update `emitters/__tests__/render-module-emit.test.ts`.
- `prepare::source_trailing_delimiter` reads the source list's resolved delimiter. Delete `engine::last_list_child`.
- Delete every `SourceTable::last_list_child_kind`: `render.rs` twice, `engine.rs` three times, and `napi_engine.rs::ArenaSources`.
- Delete `render-module.ts::sourceTrailingSeparator` and its glossary entry.
- Delete five tests in `rust/crates/sittir-core/tests/engine_tree.rs`: `last_list_child_of`, `a_list_the_tree_holds_no_node_for_ends_in_its_holder_child_within_its_span`, `a_comment_in_a_list_span_is_not_its_last_child`, `a_single_item_list_spanning_its_item_ends_in_that_item` and `a_list_the_tree_holds_a_node_for_ends_in_that_node_child`.
- Test: `stage_one_parity.rs`, `packages/rust/tests/rebuilt-list-trailing.test.ts`, `packages/typescript/tests/edited-object-type.test.ts`, `packages/tools/tests/portable/delimiter-parity.test.ts`.

**Interfaces:**
- Consumes Task 3's `parse_records_with`.
- Produces the walk's stamp of a list's separator in `SideSlot::separator`.
- `EngineGrammar::delimiter(self, nodes, at)` keeps its signature.
- Drops `SourceTable::last_list_child_kind`, `engine::last_list_child` and codegen's `sourceTrailingSeparator`.

- [ ] **Step 1: Write the failing tests.**
  - `the_query_reads_the_stored_delimiter`, arena, over `read_fixtures(name)` for the five grammars: for every flanked list, `Plan::Delimiter` holds iff the list's side `DELIMITER` has the flag, on the `SlotContent` tree.
  - `parsed_lists_answer_their_separators_from_stamps`, both storages, over `read_fixtures(name)` for the five grammars. For every parsed list, the `ReadRows::All` tree's answers equal the `SlotContent` tree's: `slot_separator`; `slot_layouts`. Nodes are matched by (grammar, display, span) in pre-order.
  - `the_separator_is_resolved_against_the_options_a_tree_was_read_with`: a list whose majority is the read-time arm and one whose majority differs, each rebuilt and rendered with a render call's own separator option, render the same in object and arena.
  - `a_mixed_object_type_writes_the_lists_separator`, both storages, each with `b` edited through `$with`: typescript `type T = { a: string, b: number; c: boolean; d: string }` writes `;` in every gap, and the tied `type T = { a: string; b: number, c: boolean }` writes the options' arm in every gap.
  - `a_rebuilt_list_keeps_its_sources_trailing_delimiter`, in `rebuilt-list-trailing.test.ts`, both storages. The `arguments_elements` of rust `fn main() { f(a, b,); }`:
    - rebuilt through `$with.items` with its own items, renders `a, b,`;
    - after `$with.delimiter(undefined)` and the same rebuild, renders `a, b,`;
    - a built list seated in its place through the holder's `$with` renders `a, b,`;
    - the same three over `f(a, b)`, under an engine whose `delimiter` option at that site is trailing, render `a, b`.
  - `delimiter-parity.test.ts` runs under `nodeStorage: 'arena'` as well as object.
- [ ] **Step 2: Run them.** Run `PARITY the_query_reads`, `PARITY parsed_lists`, `pnpm exec vitest run --config vitest.config.ts packages/rust/tests/rebuilt-list-trailing.test.ts packages/typescript/tests/edited-object-type.test.ts packages/tools/tests/portable/delimiter-parity.test.ts`. Expected:
  - `the_query_reads…` FAILs: the `SlotContent` tree has no separator rows to count.
  - `parsed_lists…` FAILs on the `SlotContent` tree.
  - `a_rebuilt_list_keeps…` PASSes: it pins today's behaviour through the change.
- [ ] **Step 3: Implement** what "What changes" says. `ReadRows::All` trees keep their rows until Task 9.
- [ ] **Step 4: Run.**
  - Step 2's commands. Expected: PASS.
  - `validate:history` per row, both storages. Expected: no row moves.
  - The full unit suite.
- [ ] **Step 5: Commit:** `feat(core): a list's delimiter and separators are resolved once in the read, and its readers take the resolved option`.

### Task 5: Edge levels from body facts

**Files:**
- Modify `engine.rs` (`Lookups::edge_levels`) and `nodes.rs`.
- Test: `stage_one_parity.rs`.

**Interfaces:**
- Consumes `RecordShape::edges` (Task 2) and the cells.
- Produces `nodes::for_each_edge_part(nodes, holder, side, shape_of, visit)`. It walks `EdgePart`s at a record level and positions at a row level.
- `edge_levels` identifies the coordinate's node by its index, not `kid.span() != coord.span`.

- [ ] **Step 1: Write the failing tests.**
  - `edge_levels_agree_from_render_bodies`: for every parsed node and side in `read_fixtures`, the `EdgeLevel` sequence of the `All` tree equals the `SlotContent` tree's, except a chain that ends in a list's separator whose source token is not the list's resolved separator. The test lists those chains by grammar and counts them.
  - `edge_levels_at_a_zero_width_fixed_token_agree`: python `with_layout` and typescript `with_layout`, same assertion.
  - `a_listed_edge_chain_renders_the_same_bytes`: for every fixture holding a listed chain, the rendered bytes equal the `All` tree's, on both storages.
- [ ] **Step 2: Run them.** Run `PARITY edge_levels`. Expected: FAIL, the `SlotContent` tree stops at a slot child.
- [ ] **Step 3: Implement the record-level walk.** At a record level the walk reads `shape.edges[side]` in order:
  - `Token(kind)` yields a level of that kind with field `None`, and the walk stops;
  - `Slot(Cell(i))` that is present descends into it (a record, a row, or a unit, which yields its kind and stops), `Slot(Flag { .. })` that is set yields its `kind` and stops, and an absent one goes to the next part;
  - `Guarded { slot, token }` yields `token` when `slot` is present;
  - a list whose `delimiter` holds this side's flag yields its resolved separator, `SideSlot::separator` or else the arm of the options the tree was read with, and the walk stops. Without the flag the walk goes on to the list's edge item. No new field is stored.

  At a row level the walk stays positional.
- [ ] **Step 4: Run.** Run Step 2's command. Expected: PASS. `validate:history` is unchanged. If any rendered byte moves, stop and report the case with its source: it goes to the maintainer.
- [ ] **Step 5: Commit:** `feat(core): a record's edge levels come from its body's edge parts`.

### Task 6: Navigation lists units from cells

**Files:**
- Modify `arena/run_nodes.rs` (`Walk::kids_of`) and `arena/built.rs` (`siblings_of`).
- Modify `rust/crates/sittir-parity-tests/src/lib.rs` to add `read_fixtures` and `out_of_order_units`.
- Test: `stage_one_parity.rs`.

**Interfaces:**
- Consumes `RecordShape::order`.
- Produces `named_fixed_pairs(name) -> &'static [NamedFixedPair]`, with `NamedFixedPair { holder: &'static str, token: &'static str, source: &'static str }`: one source for each pair in the spec's "What navigation lists", taken from the census cases. That is 16 pairs: rust 7, typescript 6, python 3. Python's `block_statement` is the display of `block`.
- Produces `out_of_order_units(name) -> Vec<&'static str>`: one source for each of the 20 kinds whose cells are out of document order. Examples are `&'a mut T`, `a?.[0]` and `fn f(&'a mut self) {}`, and the corpus gives the other 17. A kind that `fixture_sources` already covers needs no added source.

- [ ] **Step 1: Write the failing test.** `queries_list_units_in_render_body_order`. For every node of `read_fixtures(name)` plus `out_of_order_units(name)`, `$children` and `$descendants` as (stamped kind, span or none) sequences are equal between the trees, with two exceptions:
  - units compare by kind only;
  - the `All` side drops the named fixed tokens Task 1 counted, and the test prints each one it drops.

  And `a_named_fixed_token_leaves_query_results`: for each pair of `named_fixed_pairs(name)`, on the `SlotContent` tree, `ParsedTree::descendants` from the root yields no item of the token's kind, and yields one item of the holder's kind for each that the `All` tree yields (the maintainer, 2026-11-17: "Yes, they leave queries too").
- [ ] **Step 2: Run them.** Run `PARITY queries_list_units` and `PARITY a_named_fixed_token_leaves_query_results`. Expected: FAIL. The `SlotContent` tree lists no units, and the token's kind is yielded.
- [ ] **Step 3: Implement the merge in `kids_of`.** For a record, walk its slots in `order`:
  - a cell naming a run entry emits the run's entries up to and including that one, in run order, so trivia keeps its place;
  - a unit cell or a set flag emits a unit kid with its kind and no span.

  The rest of the run follows. `siblings_of` gives a unit sibling no span.
- [ ] **Step 4: Run.** Run Step 2's commands. Expected: PASS, and the dropped list equals Task 1's count. A dropped token outside the pairs stops the plan.
- [ ] **Step 5: Commit:** `feat(core): navigation lists a unit from its cell, where its body writes it`.

### Task 7: Depth moves and line starts

**Files:**
- Modify `run_nodes.rs` (`Walk::depth_move`), `engine.rs` (`Lookups::depth_move`, `line_starts_inside_tokens`), `arena/side.rs` and `arena/hydrate.rs`.
- Test: `stage_one_parity.rs`.

**Interfaces:**
- Produces `NodeFacts::abuts_next: bool`, packed at bit 25, with `FIELD_BITS` 9. The walk sets it on a variable-text leaf whose text ends in `\n` when the next token it meets starts at the leaf's end.
- `depth_move` finds the node by index.

- [ ] **Step 1: Write the failing tests.**
  - `depth_moves_agree_without_depth_member_rows`: every parsed node's `depth_move` is equal between the trees on `read_fixtures`.
  - `line_starts_agree_from_the_stamped_bit`: every parsed node's `line_starts_inside_tokens` is equal between the trees.
  - `a_crlf_leaf_followed_by_a_fixed_token_keeps_its_line_start`: typescript `` `a\r\n${b}` `` and python `f"""a\r\n{b}"""`, same assertion.
- [ ] **Step 2: Run them.** Run `PARITY -- depth_moves line_starts`. Expected: FAIL.
- [ ] **Step 3: Implement both readers.**
  - A row's move is the sum of the `DEPTH` of the records inside it.
  - `line_starts_inside_tokens` pushes a leaf's end when its `abuts_next` is set.
  - `record_nodes.rs::field_fits` stays green at 9 bits (max field id 92).
- [ ] **Step 4: Run.** Run Step 2's command. Expected: PASS.
- [ ] **Step 5: Commit:** `feat(core): depth moves and line starts read no fixed-token row`.

### Task 8: Placed sides

**Files:**
- Modify `stage_one_parity.rs`.
- Modify `arena/hydrate.rs`, only if the test finds an unexpected change.

**Interfaces:** Consumes Task 3's seating.

- [ ] **Step 1: Write the failing tests.**
  - `placements_differ_only_beside_named_fixed_tokens`: on `read_fixtures`, each placed side is compared as (holder kind, span, side, extra kind, extra span). They are equal between the trees, except where the old tree's target is a named fixed token. Each exception is printed.
  - `a_comment_beside_a_flag_stays_on_its_neighbour`: rust `fn f(x: & /* c */ mut T) {}` renders identically from both trees, the comment leads `T`, and no side is keyed to the flag.
  - `a_comment_beside_a_unit_keeps_its_side_through_the_units_site`: a source whose comment the parse places on a named unit a cell holds renders identically from both trees, and its side's key is `NodeSite::Unit`. Rust `fn f(x: /* c */ u8) {}` is the first candidate (not checked: that the parse places this comment on `u8`).
- [ ] **Step 2: Run them.** Run `PARITY -- placements comment_beside_a_unit`. Expected: PASS, or an exception that is not beside a named fixed token. Such an exception stops the plan, and the list goes to brainstorm.
- [ ] **Step 3: Record and commit.**
  - Put the printed list in the ledger and send it to brainstorm: these are the spec's "expected cases".
  - Commit: `test(parity): placed sides beside a named fixed token are the only ones that move`.

### Task 9: Rows go

**Status (2026-11-23):** in progress, nothing committed; local head `c87d2d4e0`, pushed head `f689b1893`. With the read on slot content, 25 of the 38 retaken tests still fail. The from-templates render follows the spec's § Slots held by a kind id alone: a zero-width unit writes its seam, a unit's sides come through its site, a `MISSING` unit keeps its zero-width row, and a unit of several tokens keeps a row only where a `MISSING` token lies under it. The parity test names three byte changes from object storage: whitespace, comments and `ERROR` inside a unit of several tokens, `predefined_type`'s `unique symbol` among them; a comment beside a named fixed token, which arena seats as if the token were unnamed; and a bare `'` in a rust token tree, where object storage writes `a!(' lifetime);`, which `rustc` rejects. Object storage's space is fixed in a PR of its own right after this branch, and that PR removes the second exception. A built whitespace seam at a render's end still writes where the spec now drops it: that moves built bytes, so it also takes a PR of its own after this branch. Still to attribute: the 12 tests that compare records with the tree.

**Files:**
- Modify `engine.rs` (`parse_records`), every `ReadRows::All` branch from Tasks 3–7, `record_nodes.rs` (`backers_agree`), `arena/parsed.rs` (`runs_agree`), `stage_one_parity.rs` and `deep_read_words.rs`.
- Test: `packages/{rust,typescript,python}/tests/named-fixed-query.test.ts`.

**Interfaces:**
- Consumes Task 6's `named_fixed_pairs`.
- `ReadRows` is deleted, and `parse_records` writes slot content and trivia rows only.

- [ ] **Step 1: Show the row-pinning tests pin rows (working standard 4).**
  - Run `backers_agree` and `runs_agree` with `parse_records` switched to `SlotContent`. Expected: FAIL on a fixed-token row.
  - Record the first failing node in the ledger.
  - Write `named-fixed-query.test.ts` in the three packages, both storages: for each pair's source, `root.$query().$descendants.ofType(kinds.<Token>)` holds no item, and `ofType(kinds.<Holder>)` holds one item for each holder in the source. Run them before the switch. Expected: FAIL, the token query finds each.
- [ ] **Step 2: Retake them.** Both compare against the tree with fixed tokens and units filtered by role (`slot_routes`: not `Route::Slot` and not `Route::Trivia`, or a unit). Expected: PASS.
- [ ] **Step 3: Delete the old paths.**
  - Delete `ReadRows` and the `All` branches.
  - Rerun `named-fixed-query.test.ts`. Expected: PASS.
  - The stage-one parity tests become checks of the new tree against the tree-sitter tree, filtered the same way.
- [ ] **Step 4: Tighten the pins.**
  - Rerun `deep_read_words` and set its two pins to the new word counts, which must be lower than 62,092 and 35,611.
  - Rerun the census.

  Expected: read words at or below the spec's "stage one" column on every corpus, less the choice-list slot entries Task 1 counted.
- [ ] **Step 5: Commit:** `feat(core): a parsed read stores no row for a fixed token or a unit`.

### Task 10: A render keeps no table of the nodes it visits

The arena spec's "A render keeps no table of the nodes it visits" (the maintainer, 2026-11-22). After Task 9 a render needs no row per node: a fixed token is written by its holder's template, an edge comes from the body facts, and a list's separators, depth moves and line starts come from stamps.

**Files:**
- Modify `rust/crates/sittir-core/src/arena/run_nodes.rs` (`RunTable`, `Table`, `Met`), `arena/site.rs` (`row_sites`), `trivia_table.rs` (`Spans::Met`), `engine.rs` (`Records`, `Lookups`), `nodes.rs` and `arena.rs`.
- Test: `stage_one_parity.rs`.

**Interfaces:**
- Consumes Task 2's `RecordShape`, Task 5's edge walk and Task 7's stamps.
- The render walk names a node by its `NodeId`, its holder and the slot that holds it.
- `Spans::Met` and `row_sites` go. On the render path `RunTable`, `Table` and `Met` hold at most one `Nodes` answer and are emptied before the next, so they keep no entry across a render. A navigation outside a render keeps only what it uses, for that navigation alone.
- No public item changes.

- [ ] **Step 1: Write the failing tests.**
  - `a_render_keeps_no_row_per_node`: at a fixed depth, a plain render's peak heap above its output does not grow with the number of nodes it visits. A template render's growth is the prepare pass's overlay alone, which stays parked (arena plan, "Costed and parked"), and a ceiling that only falls pins it.
  - `a_wide_list_renders_in_linear_run_decodes`: rendering a parsed list of `n` items decodes each run entry at most once.
- [ ] **Step 2: Run them.** Run `PARITY -- a_render_keeps a_wide_list`. Expected: FAIL while the render builds its table.
- [ ] **Step 3: Implement.** The walk follows a record's cells and reads a parsed node by its record's address. `Records` holds no row per node for a render, and release builds neither a tree nor a table.
- [ ] **Step 4: Run and commit.** Run Step 2's command and the stage-one parity tests. Expected: PASS. Commit: `feat(core): a render keeps no table of the nodes it visits`.
- [ ] **Step 5: Run the gates.** These are the spec's § Gates, run once on the final head, with each result reported as numbers.
  - **The three-way verification** (working standard 5):
    1. targeted probes of the cases this stage changes, wrap and render layers: the named tests of Tasks 4–8 and Task 10, rerun on the final tree;
    2. `pnpm run validate:native`, then `pnpm run validate:history` against master's recorded baseline. Every row of all three grammars is compared. Each row is unchanged, except as Task 4 records;
    3. the full unit suites, with any new failure isolated by reapplying the stage's diff in reverse and rebuilding before it is accepted as already present:
       - `cargo test --workspace --no-default-features`;
       - `cargo clippy` in the three configurations;
       - the `packages/*` vitest suites, `packages/common` from the root config;
       - `pnpm type-check`;
       - `pnpm run lint`.
  - **Read words:** `CENSUS` rerun on every census corpus. Report each corpus's read words as a share of today, beside the spec's "stage one" column, with each row's lowest in bold.
  - **Ratchets:** the `deep_read_words` pins from Step 4, and the lock-free census at or under its ceilings.
  - **Timings:** CI's paired run on the arm runner against master's arena, parse and render per grammar, which is also the branch's landing gate (arena plan Task 6). Report the ratio per grammar and phase, with each row's winner in bold.
  - Any failure stops the task and is reported with its numbers; nothing is reverted to pass a gate.
- [ ] **Step 6: Mark the plan.** Tick this plan's tasks and set its Status line.
