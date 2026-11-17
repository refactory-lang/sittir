# Read coordinate census

This census measures where a parsed read stores byte offsets: for each row a read keeps, it records which role the token plays.
- **Corpora:** the paired-run corpora, the `deep_read_words` fixtures, matter.js and next.js.
- **Roles:** slot content, trivia, or fixed token.
- **Costing:** the census costs removing the fixed-token rows, and one-word parsed cells, in words and as a share of the read.

Measured on `1f0170702`, the head of `feat/arena-hydrate-at-parse`.

## Roles

A token of a parse has one of three roles, depending on its parent kind:

- **Slot content.** What a slot of the parent holds, in a cell of the parent's record. That's one of:
  - a child node;
  - a variable-text leaf;
  - a unit whose kind id is the slot's value: a keyword flag, a punctuation or enum choice, or a token the external scanner issues, such as typescript's automatic semicolon.

  A kind's slots are listed in `packages/<lang>/.sittir/node-model.json5` (`nodes[].slots`, derived by `collectSlots`). How each value is stored is classed once by `classifyValueStorage` (`node`, `kindId` or `literal`). Its glossary entry is in `docs/glossary/emitters.md` under the heading `packages/codegen/src/emitters/shared.ts::classifyValueStorage`. For example, `expression_statement.terminator` is a `kindEnum` slot over `_automatic_semicolon` and `";"`, and a boolean slot (`"storage":"boolean"`) holds a keyword such as `async`.
- **Trivia.** An extra: a comment, `ERROR` or a line continuation.
- **Fixed token.** The rule's own literal text that no slot holds and the render template writes. These are the parts of a kind's render body in `packages/<lang>/.sittir/render-bodies.json`:
  - a `text` part (`(` in `arguments`, `if` in `if_statement`);
  - a `tokenSeam` part (python's `"\n"`);
  - an `indent` or `dedent` part;
  - a separator a list writes between its items. In the generated crate this is the slot's `separator` stamp, for example `#[slot(... separator = kind::PIPE ...)]` in `rust/crates/sittir-regex/src/render/node.rs`. A list kind whose separator is a choice lists its `separatorCandidates` in the node model; typescript's `object_type_content` lists `,`, `;` and `_automatic_semicolon`.

Today a read keeps a run row (`RunEntry::Row`: facts, start, end, inner) for every node that has no record, whatever its role. The fixed-token rows are the ones to remove.

## Method

The probe was a throwaway parity test on a `git archive` of `1f0170702`, outside every watched tree, and is not kept. For each source it calls `Engine::parse_records::<AnyNode>` and walks the read from its root record with the arena's public decoders:

- `header_of` reads the record's header;
- `RecordCells::shape` gives the record's shape;
- `Cell::decode_parsed` decodes each cell, at its stamped word and width;
- `ListCell::of_word` and `ListCell::items` read a list cell's run;
- `SideRecord::read` reads the side record, whose words are counted field by field from its mask.

### How a row's role is decided

The probe decides a row's role from its holder's cells first, then from the holder kind's render body. The first rule that applies sets the role:

1. **Slot content:** a cell of the holder names the row. A leaf or unit cell's row is the entry's index in the holder's run plus 2, and list items count.
   - A cell's kind matches the kind of the row it names for all but 1.5% of named rows on matter.js, 2.5% on next.js and 12.5% on paired rust.
   - Every mismatch in the eight most frequent pairs of each corpus is a unit cell that stores an enum member's kind id, or a choice's unit variant's, and names that node's row. `EngineGrammar::unit_id` documents this: "an enum kind's member, a choice's unit variant". Examples: `string` naming a `predefined_type` row, `i32` naming a `primitive_type` row, `,` naming a `token_tree_punctuation` row.
   - No cell names an entry that isn't a row.
2. **Trivia:** the row is an extra, or lies in the run of a comment or `ERROR` record.
3. **Slot content inside a slot-held node:** the row lies inside a row that a cell names, such as the `string` token inside `predefined_type`.
4. **List separator (fixed token):** the row lies between two items of one list cell. A row right after the last item also counts when its kind is one already seen between that list's items.
5. **Boolean slot token (slot content):** the token is the value of one of the holder kind's boolean slots.
6. **Fixed token:** the token's text is a `text` or `tokenSeam` part of the holder kind's render body, or the token is an `indent` or `dedent` part. The body is found under the kind's model name, through `shownAs`, and the bodies of its polymorph forms are included. A row under a node with no record is checked against that node's kind instead.
7. **Unexplained:** anything left, which is reported.

The slot-content class comes from the row kind's entry in the node model:

| class | node-model entry |
|---|---|
| variable-text leaf | `pattern` or `lexedPattern`; the glossary entry `compiler/model/node-map.ts::isPatternLeaf` describes these as "a leaf whose text the parse carries" |
| keyword unit | `keyword` |
| punctuation or enum unit | `punctuation` or `enum` |
| external-scanner unit | a unit whose kind is in the grammar's `externals` in `.sittir/src/grammar.json` |

An `alias` entry is resolved through its content slot's `parseKind`.

### Reconciliation

The read's words follow `deep_read_words`' convention: every read chunk, through its last non-zero word.

- **Fixtures:** on the two fixtures `deep_read_words` pins, the totals match exactly: `engine.rs` has 62,092 words in 4 chunks, and `create-engine.ts` 35,611 in 3.
- **Words by holder:** records + side records + list runs equal the total on every corpus, apart from zero words at chunk ends: 6 on `engine.rs`, 770 on matter.js and 1,293 on next.js.
- **Node count:** records plus rows on matter.js come to 2.925M nodes, against the 2.91M in `docs/superpowers/specs/2026-11-06-arena-trees-from-records-design.md`.
- **Source text:** not in a read chunk, so not counted.

## Corpora

| corpus | grammar | sources | bytes |
|---|---|---|---|
| paired-run `corpus-rust.json` | rust | 149 | 14,652 |
| paired-run `corpus-typescript.json` | typescript | 119 | 13,428 |
| paired-run `corpus-python.json` | python | 116 | 11,765 |
| paired-run `corpus-regex.json` | regex | 37 | 703 |
| paired-run `corpus-scm.json` | scm | 19 | 2,380 |
| `engine.rs` (`deep_read_words` fixture) | rust | 1 | 24,766 |
| `create-engine.ts` (`deep_read_words` fixture) | typescript | 1 | 8,947 |
| matter.js `2078d664` | typescript | 2,410 | 17,593,826 |
| next.js `4e5335a0` | typescript | 5,563 | 23,890,734 |

matter.js and next.js were fetched with `scripts/ci/paired-refs/reference/fetch-corpora.py`, which keeps `.ts`, `.mts` and `.cts` files.

## Rows by role

Each cell gives the number of rows, then the share of the read's words those rows take. A row is 4 words, or 5 when it's shown as an alias.

The groups in the table:

- **Fixed tokens:**
  - text, tokenSeam, indent and dedent parts;
  - fixed list separators;
  - separators of a list kind with several `separatorCandidates`.
- **Slot content:**
  - variable-text leaf;
  - keyword unit;
  - punctuation or enum unit;
  - external-scanner unit;
  - boolean slot token;
  - a node with no record, with the tokens inside it, plus a few rows whose model entry is a supertype, branch or envelope.
- **Trivia.**
- **Unexplained.**

| corpus | read words | fixed: body parts | fixed: list separators | fixed: separators, several candidates | slot: variable-text leaf | slot: keyword | slot: punctuation or enum | slot: external-scanner unit | slot: boolean | slot: node with no record and its tokens | trivia | unexplained |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| paired rust | 89,601 | 2,856 (12.8%) | 123 (0.5%) | 0 | 894 (4.0%) | 25 (0.1%) | 88 (0.4%) | 0 | 32 (0.1%) | 354 (1.6%) | 66 (0.3%) | 22 (0.1%) |
| paired typescript | 70,505 | 2,081 (11.9%) | 101 (0.6%) | 27 (0.2%) | 461 (2.7%) | 56 (0.3%) | 337 (1.9%) | 211 (1.2%) | 49 (0.3%) | 423 (2.4%) | 1 (0.0%) | 43 (0.2%) |
| paired python | 93,577 | 2,314 (9.9%) | 213 (0.9%) | 0 | 1,284 (5.5%) | 37 (0.2%) | 73 (0.3%) | 2 (0.0%) | 22 (0.1%) | 111 (0.5%) | 2 (0.0%) | 19 (0.1%) |
| paired regex | 10,253 | 138 (5.4%) | 6 (0.2%) | 0 | 204 (8.0%) | 0 | 41 (1.6%) | 0 | 7 (0.3%) | 40 (1.6%) | 0 | 7 (0.3%) |
| paired scm | 11,540 | 493 (17.4%) | 0 | 0 | 221 (8.0%) | 8 (0.3%) | 8 (0.3%) | 0 | 13 (0.5%) | 28 (1.0%) | 0 | 13 (0.5%) |
| engine.rs | 62,092 | 1,791 (11.6%) | 176 (1.1%) | 0 | 735 (4.7%) | 52 (0.3%) | 28 (0.2%) | 0 | 32 (0.2%) | 160 (1.0%) | 165 (1.1%) | 152 (1.2%) |
| create-engine.ts | 35,611 | 993 (11.3%) | 129 (1.4%) | 0 | 476 (5.5%) | 73 (0.8%) | 218 (2.4%) | 32 (0.4%) | 4 (0.0%) | 88 (1.0%) | 0 | 1 (0.0%) |
| matter.js | 29,448,605 | 958,062 (13.6%) | 195,224 (2.7%) | 3,088 (0.0%) | 320,068 (4.9%) | 18,818 (0.3%) | 149,363 (2.0%) | 18,339 (0.2%) | 4,671 (0.1%) | 52,521 (0.7%) | 7 (0.0%) | 4,369 (0.1%) |
| next.js | 58,143,558 | 1,761,384 (12.5%) | 148,461 (1.0%) | 26,692 (0.2%) | 677,901 (5.0%) | 75,000 (0.5%) | 233,289 (1.6%) | 228,608 (1.6%) | 38,222 (0.3%) | 121,665 (0.8%) | 6,417 (0.0%) | 12,711 (0.1%) |

- **Zero-width rows:**
  - typescript's automatic semicolon is slot content, an external-scanner unit, wherever a cell holds it: 17,627 rows on matter.js and 224,938 on next.js.
  - As a separator candidate of `object_type_content`, it's the arm a separator took: 21,225 plus 4,063 trailing on next.js.
  - Python's 777 zero-width rows are fixed tokens: `newline` from a `tokenSeam` part, and `indent` and `dedent` from their own parts.
- **Separators with several candidates:** the separator a gap took exists today only in its row. That's 26,692 rows on next.js and 3,088 on matter.js. Removing those rows requires storing the separator's kind id.
- **Unexplained:** at most 0.1% of the read on matter.js and next.js. The largest groups:
  - `,` in `object`, `arguments` or `array` where a list cell's items don't bracket the row, as with a trailing separator of a one-item list or an elision;
  - the automatic semicolon and `;` of a one-item `object_type_content`;
  - `?.` in `optional_chain`, and `this`, `import` and `override` inside a node with no record that no cell names;
  - the doc-comment markers `/` and `!` of rust's `outer_line_doc_comment_marker` and `inner_line_doc_comment_marker`: 151 rows on the `engine.rs` fixture.

## Other stored coordinates

| corpus | records (AT) | header-only records | zero-width AT | leaf cells | unit cells | captured strings | link records |
|---|---|---|---|---|---|---|---|
| paired rust | 3,873 | 1 | 0 | 1,276 | 291 | 224 | 0 |
| paired typescript | 3,023 | 1 | 0 | 1,061 | 825 | 14 | 0 |
| paired python | 4,273 | 5 | 2 | 1,291 | 178 | 606 | 0 |
| paired regex | 454 | 11 | 0 | 220 | 45 | 16 | 0 |
| paired scm | 453 | 0 | 0 | 221 | 30 | 7 | 0 |
| engine.rs | 2,711 | 0 | 0 | 1,084 | 160 | 16 | 0 |
| create-engine.ts | 1,446 | 0 | 0 | 693 | 388 | 0 | 0 |
| matter.js | 1,200,399 | 4 | 4 | 573,735 | 218,016 | 77,367 | 0 |
| next.js | 2,377,396 | 54 | 11 | 1,015,989 | 633,112 | 71,455 | 0 |

- **What each holds:**
  - **Record (`AT`):** `[kind, start, end]`, 3 words in its side record, and the side record has a `SOURCE` word.
  - **Leaf cell:** `[kind | row, start, end]`.
  - **Unit cell:** `[kind | row]`, with no span.
  - **Captured interior string:** `[start + 1, end]`.
- **Header-only record:** a record with no cells, the term `admit.rs` uses for an `ERROR` a built record holds.
- **Link records:** a read writes none.
- **Side records:** 65% of matter.js's read words (19.19M of 29.45M).

## Costed layouts

These labels belong to this table:

- **fixed-token rows removed:** the read writes no row for a fixed token, separators with several candidates excepted.
- **one-word parsed cell:** every parsed cell is one word.
  - The tag word folds into the cell's word.
  - A child cell names its record, which gives the kind in its header.
  - A leaf cell names its row, which holds the span.
  - A slot that can hold a captured interior string keeps two words.

Each column is a share of today's read words; lower is better. Each row's lowest is in bold.

| corpus | fixed-token rows removed | one-word parsed cell | both |
|---|---|---|---|
| paired rust | 86.6 | 82.3 | **68.9** |
| paired typescript | 87.5 | 83.7 | **71.2** |
| paired python | 89.2 | 85.1 | **74.3** |
| paired regex | 94.4 | 80.4 | **74.8** |
| paired scm | 82.6 | 85.8 | **68.4** |
| engine.rs | 87.3 | 83.2 | **70.5** |
| create-engine.ts | 87.2 | 82.6 | **69.8** |
| matter.js | 83.8 | 84.2 | **68.0** |
| next.js | 86.5 | 83.5 | **70.0** |

## Readers of a fixed token's offsets

Every reader takes a fixed token's offsets through navigation's `Kid`. A row's span becomes the `Kid` span in `RunNodes::kids_of` (`rust/crates/sittir-core/src/arena/run_nodes.rs`, through `meet`).

These readers are deleted with placement, in the steps of the parsed-comments spec (`docs/superpowers/specs/2026-11-15-parsed-comments-at-parse-design.md`):
- the placer;
- `Lookups::assigned`;
- `Lookups::region_depth` and `Lookups::baseline_gap`;
- `source_items`;
- placement's use of `trivia_table::walk`.

These readers survive:

| reader | what it asks of a fixed token |
|---|---|
| `Lookups::edge_levels`, through `nodes::for_each_edge_child` (spacing boundaries: `SpacingWriter::boundary`, `end_lines_after`) | whether the first (last) child starts (ends) where its holder does, and the child's kind; whether the coordinate's node is this node (`kid.span() != coord.span`) |
| `Lookups::depth_move` | finds the node by `kid.span() == coord.span`; the count reads facts only |
| `last_list_child` (`source_trailing_delimiter`) | the last child of a list that isn't an extra and has width; for a list with no node of its own, whether a child lies within the list's span |
| `line_starts_inside_tokens` (re-indent in `SpacingWriter`) | a token ending in a line break with the next token starting at that offset, such as a string's content followed by its closing quote |
| `Lookups::for_each_descendant` (`probe_slice`) and query `slot_hits` | a token's text |

## Files

- **`analyze.mjs`:** the role rule's model and render-body lookups and the cost arithmetic. It reads the probe's tallies (`out.jsonl`, not kept here: 401 KB) and `models/<lang>.*`, which are `node-model.json5`, `render-bodies.json` and `.sittir/src/grammar.json`'s `externals` at `1f0170702`.
- **`report.json`:** what `analyze.mjs` printed: rows by role for each corpus, with the unexplained rows by holder and kind.
