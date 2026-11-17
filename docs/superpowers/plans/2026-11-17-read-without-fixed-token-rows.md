# A parsed read stores no row for a fixed token or a unit: stage one

> **Execution:** the engine-api session executes this plan inline, task by task, with superpowers:executing-plans. This repository uses no subagents for code. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status:** written 2026-11-17. Tasks 2–9 start when the hydrate-at-parse branch has merged to master; the branch is cut from that merge. Task 1 ran ahead of the merge, by brainstorm's word (2026-11-17), on `test/read-census`, cut from the hydrate-at-parse head. It wrote no production code, and that branch is merged into the stage-one branch when the stage-one branch is cut. Task 1 is done, and both of its stops are ruled (2026-11-17): a list's `DELIMITER` is decided by kind (Task 4), and named fixed tokens leave query results (Task 6). Waiting for the hydrate-at-parse merge. **Stopped before Task 4** by its own stop condition, measured ahead of code. Under the kind rule, typescript's validation rows move +159 in both storages: a stored `TRAILING` renders the list's separator where the source's trailing separator is the zero-width automatic semicolon (census README, "Delimiter by kind"). It is with brainstorm for a ruling on the trailing separator's kind. That branch replaces `NodeCoordinate` with the node's name, so this plan's `&NodeCoordinate` signatures (Task 4's `source_trailing`, Task 6's `$treeHandle` row) are re-anchored to it when the stage-one branch is cut.

How this line is kept:
- Each finished task is ticked, and this line names the task in progress.
- A stop condition replaces this line with the stop and its cases until it is ruled. The stop conditions are:
  - Task 4: a non-zero `delimiter_disagreements` in `CENSUS` after the stamp changes, where the stamp and the kind rule must agree on every corpus, or a `validate history` row that moves other than as the census README's "Delimiter by kind" records;
  - Task 6: a dropped named fixed token that is not one of the pairs in the spec's "What navigation lists";
  - Task 8: a placement change that is not beside a named fixed token;
  - Task 9: a failed gate.

**Goal:** A parsed read writes no run row for a fixed token or a unit, and every reader answers as it does today on every fixture.

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
- A list's delimiter and separator choices render exactly as shipped. That includes `separator_kind` and `tokens` on mixed `object_type_content` lists, and the single-element rule (`AssembledList::singleElementNeedsTrailing`).
- No new storage form: no bit beside the run, and no new place in `SideSlot::tokens`.
- A unit's place among its holder's children is where the kind's render body writes its slot.
- Named fixed tokens leave navigation. A comment beside one is seated as a built node seats it.
- Facts are stamped where they are made and never re-derived from text at run time (working standard 3). Generated outputs are regenerated, never hand-edited (standard 6).
- Ratchets only tighten: the `deep_read_words` pins and the lock-free census ceilings.
- No comments in `packages/codegen/src/`; glossary entries carry the why. No spec, plan, PR or task numbers in code, docs or comments.
- No release of parsed records. That stays held until this stage has landed and been measured.

## Review Focus

1. **A list rebuilt from a source list whose last item was replaced.** It takes its source's trailing flag, as the spec says and as today: rust `f(a, b,)` with `b` replaced renders `a, a,`, whether the rebuilt list keeps its own delimiter or has it cleared. Task 4 pins it: `a_rebuilt_list_takes_its_sources_trailing_flag_whatever_its_items` and `a_list_with_its_delimiter_cleared_reads_its_sources_stamp`.
2. **A comment between a unit and its neighbour**, such as `& /* c */ mut T` and `a /* c */ ?.[0]`. The side is keyed by the unit's site and renders where it did. Task 8 pins it: `a_comment_beside_a_unit_keeps_its_side_through_the_units_site`.
3. **A zero-width fixed token at a record's edge:** python's `newline` from a `tokenSeam`, `indent` and `dedent`, and typescript's automatic semicolon in a separator gap. Edge levels and depth moves answer as today. Task 5 pins it: `edge_levels_at_a_zero_width_fixed_token_agree`.
4. **A MISSING fixed token inside a list**, for example rust `fn f( {` and typescript `if (a {`. The list's stamps and its edge levels match the old tree, and the holder keeps `HOLDS_ERROR`. Tasks 4 and 5 cover it through `with_errors`, which the parity fixtures include.
5. **A variable-text leaf that ends in `\r\n`, followed at once by a fixed token.** The line-start bit is set on it, as the `\n` test today counts it. Task 7 pins it: `a_crlf_leaf_followed_by_a_fixed_token_keeps_its_line_start`.

## Public surfaces this stage changes

These rows are from the spec's § Public surfaces, approved by the maintainer. The rows marked *new* come from the 2026-11-17 rulings and go to the maintainer before Task 4.

| surface | change | task |
|---|---|---|
| addon `siblings` | a unit sibling has no span; a named fixed token is no sibling | 6 |
| addon `descendants` / `readDescendants`, `$children`, `$descendants` | a named fixed token of a pair in the spec's "What navigation lists" is no longer yielded (29,447 items across the census corpora); every other item is unchanged; resume paths renumber | 6, 9 |
| *new:* `$query()` views (`$children`, `$descendants`, `ofType`, `where`, `find` and the rest) | a query for such a token's kind finds none of them; a query for the holder's kind finds each, as for a built node: `ofType(kinds.SelfParameter)` matches `&self`, and `ofType(kinds.Self)` finds nothing inside it | 6, 9 |
| *new:* a parsed list's delimiter (`$snapshot`'s `_delimiter`, and the trailing flag a rebuilt list with its delimiter cleared takes from its source) | a list whose last item is followed by a zero-width separator (typescript's automatic semicolon) stores `TRAILING` where it stored none: 26 lists on paired typescript, 1 on `create-engine.ts`, 725 on matter.js, 5,466 on next.js, all `object_type_content`. The renders probed are unchanged; `validate history` moves as the census README's "Delimiter by kind" records | 4 |
| `NodeCoordinate.$treeHandle`, `$end` | values renumber | 6 |
| `$text`, `lineStartsInsideTokens`, the parse's error list | unchanged | 1, 7 |
| `$snapshot` | lists no fixed token (Task 1's test); its `_delimiter` changes as the delimiter row says | 1, 4 |

Internal, not public: `arena::side::FIELD_BITS` goes from 10 to 9 (Task 7), still guarded by `Engine::with_store` and `record_nodes.rs::field_fits`. `NodeSite` gains `Unit`, `RecordShape` gains `order` and `edges`, and `SourceTable::last_list_child_kind` becomes `SourceTable::source_trailing`.

## File map

- `rust/crates/sittir-core/src/arena/hydrate.rs`: the walk. It keeps a working list, numbers the written entries, and stamps the separator choices and the line-start bit.
- `rust/crates/sittir-core/src/arena/side.rs`: `NodeFacts::abuts_next`, `FIELD_BITS`.
- `rust/crates/sittir-core/src/arena/admit.rs`: `RecordShape::{order, edges}`, `EdgePart`.
- `rust/crates/sittir-core/src/arena/run_nodes.rs`: navigation lists units from cells and names `NodeSite::Unit`.
- `rust/crates/sittir-core/src/engine.rs`: the readers (`Lookups::edge_levels`, `depth_move`, `node_slots`, `separator_before`, `line_starts_inside_tokens`) and `parse_records_with`.
- `rust/crates/sittir-core/src/prepare.rs`, `render.rs`, `napi_engine.rs`: `source_trailing_delimiter` and `SourceTable::source_trailing`.
- `rust/crates/sittir-node-macros/src/{attrs,hydrate,expand}.rs`: the `order` and `edges` attributes, roles at meet, separator stamps.
- `packages/codegen/src/emitters/render-body.ts` and `render-module.ts`: `bodySlotOrder`, `bodyEdgeParts`, the depth-kind check.
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
- `RecordShape::order: &'static [u8]`: indexes into `cells`, in the order the render body writes their slots.
- `RecordShape::edges: [&'static [EdgePart]; 2]` for `Side::Before` and `Side::After`.
- `pub enum EdgePart { Token(KindId), Cell(u8), Guarded { cell: u8, token: KindId } }`.

- [ ] **Step 1: Write the failing codegen tests.**
  - `bodySlotOrder(rust reference_type)` equals `['lifetime', 'exclusive', 'type']`.
  - `bodySlotOrder(typescript subscript_expression)` equals `['object', 'optional_chain', 'index']`.
  - `bodyEdgeParts(rust let_declaration, 'before')` equals `[{ token: 'let' }]`.
  - `bodyEdgeParts(typescript function_declaration, 'before')` equals `[{ cell: 'async' }, { token: 'function' }]`.
  - `bodyEdgeParts(rust let_declaration, 'after')` equals `[{ token: ';' }]`.
  - A `text` part inside an `if` arm on slot `s` gives `{ guarded: 's', token }`.
  - A `seam` part gives nothing.
- [ ] **Step 2: Run the codegen tests.** Run `pnpm exec vitest run packages/codegen/src/emitters/__tests__/render-body.test.ts`. Expected: FAIL, `bodySlotOrder` is not defined.
- [ ] **Step 3: Implement the two functions.**
  - `bodySlotOrder(body: RenderPart[]): string[]` takes each slot at its first appearance across arms. Throw when two arms order two slots both ways: none does today, which the spec states.
  - `bodyEdgeParts(body: RenderPart[], side: 'before' | 'after'): EdgePartSpec[]` reads parts from that edge and stops at the first unconditional `Token` or required `Cell`.
  - Token kinds resolve through the catalog's kind ids, never by text at run time.
  - `render-module.ts` stamps `#[node(order = [...], edges = ([...], [...]))]` on every struct with `words`.
  - It also fails generation when a kind whose body has an `indent` or `dedent` part has no `words`, with the diagnostic "`<kind>` writes a depth part but is read with no record".
- [ ] **Step 4: Add the derive attributes.** `attrs.rs` parses `order` and `edges`; `expand.rs` emits them in `RecordCells::shape`.
- [ ] **Step 5: Write the failing Rust test.** `record_shapes_order_cells_as_their_bodies_write_them` in `stage_one_parity.rs` asserts:
  - rust `reference_type`'s `order` names `lifetime`, `exclusive`, `type` cells in that order;
  - every record kind of the five grammars has `order.len() == cells.len()`.
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

### Task 4: List facts from stamps

A list's `DELIMITER` is decided by kind (the maintainer, 2026-11-17: "By kind: a separator child follows the last item"): a parsed list ends with a separator when a child of a separator kind follows its last item, whatever its width. The stamp changes rule, and `last_list_child` retires against it.

**Files:**
- Modify `rust/crates/sittir-core/src/read.rs` (`read::delimiter`), `arena/hydrate.rs`, `rust/crates/sittir-node-macros/src/hydrate.rs`, `engine.rs`, `prepare.rs`, `render.rs`, `napi_engine.rs` and `arena/prep.rs`.
- Delete `engine::last_list_child`, every `last_list_child_kind`, and their tests in `rust/crates/sittir-core/tests/engine_tree.rs` (`last_list_child_of`, `a_comment_in_a_list_span_is_not_its_last_child`, `a_list_the_tree_holds_a_node_for_ends_in_that_node_child`).
- Test: `stage_one_parity.rs`, `packages/typescript/tests/edited-object-type.test.ts`, `packages/rust/tests/rebuilt-list-trailing.test.ts`.

**Interfaces:**
- Consumes Task 3's `parse_records_with`.
- Changes `read::delimiter`'s trailing flag, with its signature unchanged: `TRAILING` when a child routed `Route::Separator { slot: items, .. }` follows the last child routed `Route::Slot { slot: items, .. }`. A unit-variant last item keeps today's count of anonymous tokens. The leading flag is unchanged.
- Produces `read::separator_choices(children: &[Kid], routes: &[Route], items: SlotId, candidates: &[KindId]) -> Option<SideSlot>`. It holds the gaps' majority in `separator` and the outliers by item place in `tokens`.
- Produces `SourceTable::source_trailing(&self, coord: &NodeCoordinate) -> Option<bool>`, the source list's stamped trailing flag, replacing `last_list_child_kind`.

Which path reads `last_list_child` today: `prepare::source_trailing_delimiter`, reached only when `Setting::fill` finds no delimiter of the list's own. A rebuild through `$with` keeps the parsed list's stored `_delimiter`, so the source's last child is asked only after the delimiter is cleared, as `list.$with.delimiter(undefined)` does. Measured on the hydrate-at-parse head, both storages: rust `f(a, b,)` cleared renders `a, b,`, and with `b` replaced by `a`, `a, a,`. The source's flag holds whatever the items, as the spec's "a rebuilt list takes the trailing flag from its source" says.

- [ ] **Step 1: Write the failing tests.**
  - `a_parsed_lists_trailing_flag_is_decided_by_kind`, from both trees. Typescript `type T = {\n  a?: boolean\n  b?: string\n}\n` stores `TRAILING`, as does the same source with ` // note` after `b?: string` and `type T = {\n  a?: boolean;\n  b?: string; // note\n}\n`. Rust `f(a, b,)` stores `TRAILING` and `f(a, b)` none.
  - `parsed_lists_answer_their_delimiter_and_separators_from_stamps`. Over `read_fixtures(name)` for the five grammars, for every parsed list, the `ReadRows::All` tree's answers equal the `SlotContent` tree's:
    - the trailing flag (old: the kind rule over the `All` tree's routes; new: `source_trailing`);
    - `slot_separator`;
    - `slot_layouts`;
    - `separator_before` for every item.

    Nodes are matched by (grammar, display, span) in pre-order.
  - `a_mixed_object_type_keeps_each_gaps_separator`: typescript `type T = { a: string; b: number, c: boolean }`, with `b` edited through `$with`, renders `{ a: string; b: …, c: boolean }` from both trees.
  - `a_list_with_its_delimiter_cleared_reads_its_sources_stamp`, in `packages/rust/tests/rebuilt-list-trailing.test.ts`, both storages. The `arguments_elements` of rust `fn main() { f(a, b,); }`, rebuilt with `$with.delimiter(undefined)`, renders `a, b,`; rebuilt with items `(a, a)` and the delimiter cleared, `a, a,`. The same list of `f(a, b)` renders `a, b` and `a, a`.
  - `a_rebuilt_list_takes_its_sources_trailing_flag_whatever_its_items`, in the same file. The list of `f(a, b,)` rebuilt through `$with.items` renders `a, a,` with items `(a, a)` and `a,` with items `(a)`.
  - In `edited-object-type.test.ts`, both storages: `type T = {\n  a?: boolean\n  b?: string\n}\n` with its list's delimiter cleared renders, in its root, as its source.
- [ ] **Step 2: Run them.** Run `PARITY parsed_lists`, `PARITY a_parsed_lists_trailing_flag`, `pnpm exec vitest run --config vitest.config.ts packages/typescript/tests/edited-object-type.test.ts` and `pnpm exec vitest run --config vitest.config.ts packages/rust/tests/rebuilt-list-trailing.test.ts`. Expected: `a_parsed_lists_trailing_flag_is_decided_by_kind` FAILs on the first source, which stores none, and `parsed_lists_answer…` FAILs on the `SlotContent` tree, which has no separator rows. The two rust tests and the cleared typescript case pass already: they pin today's renders through the change.
- [ ] **Step 3: Implement the stamps and readers.**
  - **Delimiter.** `read::delimiter`'s trailing flag takes the kind rule above.
  - **Separators.** The derive's `record_end` passes `separator_choices` into `parsed_side`, which gains a `slots: Vec<SideSlot>` parameter. That happens only for a list struct with `#[separator_kind(candidates = …)]`, so other lists stamp nothing. `LayoutAt::stored_slots` reads a parsed record's own side record as it reads a built one's. It rebuilds every gap's kind from the majority and the outliers, then runs today's `majority(kinds, preferred)`, which keeps the render-time preference.
  - **Trailing.** `source_trailing` reads the source list's stamped `DELIMITER` through its `sides`. `source_trailing_delimiter` keeps the options' leading flag. `last_list_child` and `last_list_child_kind` are deleted.
  - **Old path.** `ReadRows::All` trees keep their rows until Task 9.
- [ ] **Step 4: Run.**
  - Step 2's commands. Expected: PASS.
  - `CENSUS` on every corpus. Expected: `delimiter_disagreements` is 0 on every one; a non-zero count stops the plan.
  - `validate:history` per row. Expected: the rows move as the census README's "Delimiter by kind" records, and no other row moves.
  - The blank line that a stored `TRAILING` adds after a list's trailing line comment (`b?: string // note\n\n}`) is prototype's fix, not this task's. A case that shows it is reported with that fix, not here.
- [ ] **Step 5: Commit:** `feat(core): a list's trailing flag is decided by kind, and a choice list's separators are stamped where the walk meets them`.

### Task 5: Edge levels from body facts

**Files:**
- Modify `engine.rs` (`Lookups::edge_levels`) and `nodes.rs`.
- Test: `stage_one_parity.rs`.

**Interfaces:**
- Consumes `RecordShape::edges` (Task 2) and the cells.
- Produces `nodes::for_each_edge_part(nodes, holder, side, shape_of, visit)`. It walks `EdgePart`s at a record level and positions at a row level.
- `edge_levels` identifies the coordinate's node by its index, not `kid.span() != coord.span`.

- [ ] **Step 1: Write the failing tests.**
  - `edge_levels_agree_from_render_bodies`: for every parsed node and side in `read_fixtures`, the `EdgeLevel` sequence of the `All` tree equals the `SlotContent` tree's.
  - `edge_levels_at_a_zero_width_fixed_token_agree`: python `with_layout` and typescript `with_layout`, same assertion.
- [ ] **Step 2: Run them.** Run `PARITY edge_levels`. Expected: FAIL, the `SlotContent` tree stops at a slot child.
- [ ] **Step 3: Implement the record-level walk.** At a record level the walk reads `shape.edges[side]` in order:
  - `Token(kind)` yields a level of that kind with field `None`, and the walk stops;
  - `Cell(i)` that is present descends into it (a record, a row, or a unit, which yields its kind and stops); an absent one goes to the next part;
  - `Guarded { cell, token }` yields `token` when `cell` is present.

  At a row level the walk stays positional.
- [ ] **Step 4: Run.** Run Step 2's command. Expected: PASS. `validate:history` is unchanged.
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
- [ ] **Step 3: Implement the merge in `kids_of`.** For a record, walk its cells in `order`:
  - a cell naming a run entry emits the run's entries up to and including that one, in run order, so trivia keeps its place;
  - a unit cell emits a unit kid with its kind and no span.

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
  - `a_comment_beside_a_unit_keeps_its_side_through_the_units_site`: rust `fn f(x: & /* c */ mut T) {}` renders identically from both trees, and its side's key is `NodeSite::Unit`.
- [ ] **Step 2: Run them.** Run `PARITY -- placements comment_beside_a_unit`. Expected: PASS, or an exception that is not beside a named fixed token. Such an exception stops the plan, and the list goes to brainstorm.
- [ ] **Step 3: Record and commit.**
  - Put the printed list in the ledger and send it to brainstorm: these are the spec's "expected cases".
  - Commit: `test(parity): placed sides beside a named fixed token are the only ones that move`.

### Task 9: Rows go

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
- [ ] **Step 5: Run the gates.** These are the spec's § Gates, with each result reported as numbers.
  - **The three-way verification** (working standard 5):
    1. targeted probes of the cases this stage changes, wrap and render layers: Tasks 4–8's named tests, rerun on the final tree;
    2. `pnpm run validate:native`, then `pnpm run validate:history` against master's recorded baseline. Every row of all three grammars is compared. Each row is unchanged, except as the census README's "Delimiter by kind" records;
    3. the full unit suites, with any new failure isolated by reapplying the stage's diff in reverse and rebuilding before it is accepted as already present:
       - `cargo test --workspace --no-default-features`;
       - `cargo clippy` in the three configurations;
       - the `packages/*` vitest suites, `packages/common` from the root config;
       - `pnpm type-check`;
       - `pnpm run lint`.
  - **Read words:** `CENSUS` rerun on every census corpus. Report each corpus's read words as a share of today, beside the spec's "stage one" column, with each row's lowest in bold.
  - **Ratchets:** the `deep_read_words` pins from Step 4, and the lock-free census at or under its ceilings.
  - **Timings:** CI's paired run against master's arena, parse and render per grammar. Report the ratio per grammar and phase, with each row's winner in bold.
  - Any failure stops the task and is reported with its numbers; nothing is reverted to pass a gate.
- [ ] **Step 6: Commit and mark the plan.**
  - Commit: `feat(core): a parsed read stores no row for a fixed token or a unit`.
  - Tick this plan's tasks and set its Status line.
