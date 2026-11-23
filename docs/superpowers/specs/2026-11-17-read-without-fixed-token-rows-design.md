# A parsed read stores no row for a fixed token or a unit

**Status:** approved by the maintainer, 2026-11-17, with every open question ruled (§ Decided by the maintainer). Written by the engine-api session from the coordinate census (`docs/superpowers/probes/2026-11-17-read-coordinate-census/`) and the code on the hydrate-at-parse branch at `1f0170702`. Entries marked "to verify" are checked by a probe or parity test before they are built. It lands inside the hydrate-at-parse branch (§ Decided by the maintainer).

## Decided by the maintainer

- **"Fixed token rows removed entirely"** (2026-11-17), with **"Since we are no longer preserving white space that really needs to go"** (2026-11-17, read beside the census). Removal is the requirement; this spec says how.
- **"Automatic semicolons aren't fixed tokens! They are in a choice block and that should be encoded by kindId"** (2026-11-17).
- **"fixed token is what isn't a slot or trivia or a leaf"** (2026-11-17): the census classes tokens by role, not by token class.
- **"Yes, unit rows go too"** (2026-11-17, open question 1): a unit in a slot is held by its cell's kind id alone and has no row, so a parsed unit cell is the built unit cell. The addon's `siblings` gives a unit sibling no span, and a side placed on a unit is keyed by its site.
- **A unit is listed from its cell** ("From its cell, as a built record does", 2026-11-17, open question 2): navigation yields a unit where its slot's cell sits, with its kind and no span. No run entry is kept for it. Re-reviewed the same day, with the order made explicit: "From its cell, ordered as the render body writes its slots". A record's cells are in the layout's slot order, which need not be document order, so a unit's place among its holder's children is the place the kind's render body writes its slot. The order of `$children`, `$descendants` and `siblings()` is the same as before on every fixture, which the parity test proves; whether a built record already orders its units this way is checked first, and where it doesn't, both are made to.
- **A list's trailing separator is its `delimiter` preference, held as every declared preference is** (2026-11-17, open question 3, re-reviewed). First ruled as one bit beside the list's run. Asked again whether a bit or the side slot's token list should hold it, the maintainer answered "That's an option like any other", and then "This is something we already adjudicated in the past". The earlier adjudications, which this spec follows and adds nothing to:
  - `docs/superpowers/specs/2026-09-07-choice-separator-spacing-design.md`: every separated-list kind has `_separator` and `_delimiter` options; the grammar declares each as a preference under the list's slot (`preference('separator', 'semi')`, `preference('delimiter', 'Delimiter.Trailing')`), typed by kind id; "a parsed node keeps its token and a built one takes the resolved" default, through the same option fill.
  - `docs/python-grammar-sittir-glossary.md` § `tuple`: where a trailing separator carries meaning it is the grammar's rule, not an option. Python's `tuple` is re-authored with `_tuple_elements`, whose first element carries a required comma, so "a built `tuple(x)` renders `(x,)`".
  - So removing the separator's row adds no new form. The list's delimiter and separator choices are read where the declared preference is already read and stamped, and the body of this spec is to be reconciled with that: no bit beside the run and no new field in `SideSlot` are introduced. An earlier line of this entry read the answer as "stored nowhere"; that was brainstorm's misreading.
- **A parsed list's delimiter is its delimiter option, resolved by the generated read code, by one logic for both storages** (2026-11-17, on seeing the measurement of "store nothing": "It's not a delimiter slot, it's a delimiter option? And the generated parse code can resolve what we apply (just like it does in object storage) - in fact maybe our problem is that … object storage and arena storage are interpreting the values from tree-sitter differently - apart from the laziness, they should share the logic - it should simply be a matter of which storage is being used."). A list carries a delimiter option, as a built list given one does, and the read resolves its value from the tree-sitter tree once. That resolution is the same code whichever storage holds the result; a second reader of the same fact (the span test in `read::delimiter`, the width test in `last_list_child`) is a second derivation and goes. This supersedes the same day's "By kind" (measured +159 typescript rows, kept on `probe/delimiter-by-kind`) and "Store nothing from the source; the options decide" (measured +502 rows, with one-item lists changing meaning: rust `let (a,) = t`, python `a[1,]`, `print a,`; kept on `probe/delimiter-options-decide`). Where the two differ, object storage's read is the reference ("object storage for the most part is the 'mature' reader in this sense"): the shared logic starts from what it resolves, and a case where arena's answer is the right one is shown by example before it is taken. Before code: an audit of every place that derives a list's delimiter or separator from the tree, per storage, showing where the two storages or two readers differ, and the one rule they unify on with validation under it.
- **The automatic semicolon is not permitted in a list's trailing spot** (2026-11-17: "Can the grammar be adjusted so that automatic semicolon is not permitted in the trailing spot"). The one case where two readers of a list's delimiter disagree is typescript `type T = {\n  a: string // c\n}`: the zero-width automatic semicolon lands after the comment as the list's last child, so the list's span runs past its last member, the read resolves trailing, and a rebuild writes a stray `;`. The fix is in the grammar, not in a reader's test: the member list's separator choice admits the automatic arm between members and not after the last one, so the parse never has a zero-width trailing separator and the delimiter option resolves to none there. The grammar alone cannot say it: the external scanner emits the token, declines when the next character is `/`, and is called again after the comment, and dropping the arm from the trailing choice makes the parser insert a MISSING member in every line-separated list (measured). So the fix is in the vendored scanner ("Patch the vendored scanner as tree-sitter-javascript 0.25 does"): it scans a same-line `//` comment before deciding, as tree-sitter-javascript 0.25.0's does, and places the token at the member's end, where it already sits when no comment follows. The list's span then ends at its last member and the read resolves no trailing delimiter. No node is added. Before it lands: the trees of the commented, the plain, the explicit-`;`, the explicit-`,`, the interface and the one-member list before and after, the same check for every other site the scanner's automatic semicolon serves (statements, class members), and validation.
- **The row removal lands inside the hydrate-at-parse branch, and the render's table goes after it there** (2026-11-22, choosing that order: "2 and let's have prototype finish it in one shot").
- **Named fixed tokens leave navigation** ("Accept", 2026-11-17, open question 4): a polymorph form's named fixed text (`self`, `mutable_specifier`, a getter's `formal_parameters`, `this`, doc-comment markers, python's `newline`, `indent` and `dedent`) has no row and is not listed; a comment beside one is seated as a built node seats it. The parity test lists every placement that changes.
- **Two stages, rows first** (2026-11-17, open question 5): the rows go, measured; then the one-word parsed cell, measured.
- **The public surface rows are approved** (2026-11-17, open question 6) as § Public surfaces has them. The two marked "to verify" (the parse's error list, `$snapshot`) are checked before code, and a `$snapshot` that lists a fixed token today comes back as its own row.
- These standing rulings bind every choice below:
  - **A parsed node does not behave differently from a built node** (2026-11-15).
  - **"it would be whatever matches built nodes"** (2026-11-16): where a form is open, the form a built node already uses decides it.
  - **"there should be no 'parse' side channel of data not captured within the materialized nodes"** (2026-11-12).

## Terms

Every term here is used as `docs/superpowers/probes/2026-11-17-read-coordinate-census/README.md` § Roles defines it. A parse's token has one of three roles, depending on its parent kind:

- **Slot content.** What a slot of the parent holds, in a cell of the parent's record. That's a child node, a variable-text leaf (`pattern` or `lexedPattern` in `node-model.json5`), or a unit whose kind id is the slot's value.
- **Trivia.** An extra: a comment, `ERROR` or a line continuation.
- **Fixed token.** The rule's own literal text that no slot holds and the render template writes. That's a `text`, `tokenSeam`, `indent` or `dedent` part of the kind's body in `render-bodies.json`, or a separator a list writes between its items.

A **row** is a run entry for a node with no record: `RunEntry::Row { facts, span, inner }` in `rust/crates/sittir-core/src/arena/side.rs`. It takes 4 words, or 5 when the node is shown as an alias. A **record entry** is `RunEntry::Record { at, shared }`, 2 words. A **unit** is as `docs/superpowers/specs/2026-10-01-shared-arena-design.md` § Units defines it: "a kind with one fixed text and nothing else to hold".

## The end state

- A parse writes a row only for slot content that is text the source carries (a variable-text leaf, or a node with no record holding one), and for what lies under trivia. It writes no row for a fixed token. It writes none for a unit either, unless the unit is `MISSING`, or an extra, `ERROR` or `MISSING` token lies under a unit of several tokens (§ Slots held by a kind id alone).
- A fixed token's text comes from its kind. Where it sits comes from its holder's render body and the record's cells, the way a built node's template answers it. No byte offset of a fixed token is stored.
- A slot whose content is a choice among units is held by its cell's kind id alone, parsed and built alike.
- A record's own coordinate (`AT`: kind, start, end) stays, and so does every offset of text the source carries.
- No reader of a parsed tree asks a fixed token's or a unit's offset. Each of the four readers that do today asks a position, an order or a small fact stored at parse instead.

## What a parsed record holds

The layout today, from `record.rs` and `side.rs` on the branch, for typescript `f(a, b)`. The record of `arguments` holds a list cell; each item is a leaf cell naming its row. A cell's row is 1 for the holder's own node, else the entry's index in the holder's run plus 2.

```mermaid
flowchart LR
  subgraph today["arguments today"]
    direction LR
    H["header: kind, side address"] --> L["list cell: its run"]
    L --> A["item a: kind | row 3, start, end"]
    L --> B["item b: kind | row 5, start, end"]
    H --> S["side record: AT, NODE, PARENT, SOURCE, DEPTH, RUN"]
    S --> R["run: row '(' · row a · row ',' · row b · row ')'"]
  end
```

```mermaid
flowchart LR
  subgraph after["arguments without fixed-token rows"]
    direction LR
    H2["header: kind, side address"] --> L2["list cell: its run"]
    L2 --> A2["item a: kind | row 2, start, end"]
    L2 --> B2["item b: kind | row 3, start, end"]
    H2 --> S2["side record: AT, NODE, PARENT, SOURCE, DEPTH, RUN"]
    S2 --> R2["run: row a · row b"]
  end
```

The run, word by word:

```mermaid
flowchart LR
  subgraph run_today["run today: 20 words"]
    direction LR
    r1["'(' facts · start · end · 0"] --> r2["a facts · start · end · 0"] --> r3["',' facts · start · end · 0"] --> r4["b facts · start · end · 0"] --> r5["')' facts · start · end · 0"]
  end
  subgraph run_after["run after: 8 words"]
    direction LR
    q2["a facts · start · end · 0"] --> q4["b facts · start · end · 0"]
  end
```

Rows' entry numbers change. A cell names its row by the written entry, so the walk numbers entries as it writes them (see § Comment seating at parse).

## Slots held by a kind id alone

Every slot whose content is a choice among units is encoded by the cell's kind id. A unit's text is its kind's. The shared-arena spec says so for every unit: "Its text is its kind's, which the render writes." A unit's identity is its place: "A unit's identity is its site: its holder, its slot's word and its item in that slot" (same section). So a unit needs no row to say what it is or which one it is. A row adds only the unit's byte offsets, and no reader needs those once the four readers below change.

| class (node model) | what the cell holds | why no row |
|---|---|---|
| keyword unit (`keyword`), including a boolean slot's keyword (`"storage":"boolean"`) | the keyword's kind id; for a boolean slot, the slot's flag | the text is the kind's, the place is the site |
| punctuation or enum unit (`punctuation`, `enum`), including an enum member that a node with no record holds (`string` in `predefined_type`) | the member's kind id, which is the unit variant `EngineGrammar::unit_id` names | the enum kind is the slot's type; the member's text is its kind's |
| external-scanner unit (a unit in `.sittir/src/grammar.json` `externals`, such as typescript's `_automatic_semicolon`) | its kind id | zero-width: the source holds no text for it, and its render writes only the seam it stands for (`ResolvedOptions::token_seam`). Between two tokens that seam is required. At a render's end it is a gap and is dropped, parsed and built alike; only whitespace inside a lexed token's own bytes (`SeamToken::Lexeme`, rust's shebang) is always written, and a file's final newline comes from the root's edge (the maintainer, 2026-11-23: "i'm good with the solution") |
| `MISSING` unit | its zero-width row, the one unit that keeps a row of its own | the source holds no text for it, and its kind alone would write text the parser only assumed; its holder's `HOLDS_ERROR` fact stays (see § ERROR, header-only records, zero width and MISSING) |

An automatic semicolon that a slot holds is read by the cell's kind, not by a row's width: whether a token has width is a fact of its kind.

A parsed unit cell then holds the kind alone. That is the cell a built record already writes for a unit ("A builder takes a unit as its kind id ... and stores the kind in the holder's cell"). Parsed and built unit cells become one form. Whether a query lists a unit is a fact of its holder, slot and kind: `any` in `x as any` is listed and `const` in `x as const` is not, in one slot. Each slot's `CellShape` answers it: a member of a visible enum the slot holds is listed, as is a token the grammar aliases to a visible kind (regex `class_range`'s `-`, which codegen stamps). A member of a hidden enum is not, and the parser's named fact answers for every other unit. The shape also holds the slot's `field`, and nothing is stored per node.

**A unit of several tokens.** Eight kinds carry the `unit` stamp and are more than one token in the grammar: rust `unit_type` and `unit_expression`; typescript `using_declaration_arm`, `meta_property_new_target`, `meta_property_import_meta` and `_formal_parameters_get_accessor_signature`; python `_not_in` and `_is_not`. Whitespace between its tokens isn't kept, so `( )` written from its holder's template is `()`, as a built one is. An extra, an `ERROR` or a `MISSING` token under one is source the kind's text doesn't hold, so that one node keeps its row and what lies under it, and renders as its source: `(/* c */)` stays `(/* c */)`. The walk reads this from the tree, and no kind is named in code.

**A bare `'` in a rust token tree** is written through the `_token_keywords` sites, which are tight: `a!('lifetime);`. A space there is a lexical error (`rustc` E0762, unterminated character literal).

Unit rows are slot content, not fixed tokens; the maintainer ruled that they go too, in the same stage. The numbers list them apart.

## What navigation lists

Navigation (`Nodes` over `RunNodes`, `rust/crates/sittir-core/src/arena/run_nodes.rs`) lists a parsed node's children from its run. After the change it lists:

- every record (child nodes with a record, trivia records);
- every row: a variable-text leaf, a node with no record, and what lies under trivia;
- each unit from its cell or, for a boolean slot, its flag, with its kind and no span (`QueryItem::Unit`), at the place its holder kind's render body writes the unit's slot. No run entry is kept for it.

The render body is the only source of that order:

- **No built record to copy.** A built record answers no navigation: a query facet refuses a node with no parsed tree (`query.ts::queryFacet`), and `siblings` answers parsed trees only.
- **Cells are not in document order.** `recordLayoutOf` puts every boolean slot as a bit in the presence words, ahead of all cells.
  - Word cells follow the render body in all five grammars, and every body writes its slots in one order on every arm.
  - A boolean slot written after a word cell puts a kind's cells out of document order. That is 28 kinds: rust 4, typescript 20, python 1, regex 2, scm 1.
  - Two examples: rust `reference_type` `&'a mut T` stores `mutable_specifier` before the lifetime, and typescript `subscript_expression` `a?.[0]` stores `optional_chain` before the object.

It lists no fixed token. Named fixed tokens leave navigation too: these are polymorph forms whose kind fixes a named node. The census counts them, as rows the render body writes that tree-sitter names:

| holder > token | rows |
|---|---|
| typescript `object_type_content` > `automatic_semicolon` (a separator choice, see below) | 25,288 on next.js |
| `method_definition_getter` > `formal_parameters` (a getter's `()`) | 647 on matter.js, 125 on next.js |
| `type_query_call_expression` > `import` | 528 on next.js |
| python `_simple_statements` > `newline`, and `indent` and `dedent` under the blocks | 442, and 165 each, on paired python |
| `receiver_parameter_declaration` > `this` | 80 on matter.js, 79 on next.js |
| rust `self_parameter` > `self`; `*_mut` forms > `mutable_specifier`; doc-comment markers | at most 151 a corpus |

They leave query results too ("Yes, they leave queries too", 2026-11-17). Today a query returns them: the stage-one probe counts 29,447 such results across its corpora (`named_fixed_query_items`, census README). After the change a query matches the holder's kind instead, as it must for a built node, which has no such child: `(self_parameter)` rather than `(self)` inside `&self`, the getter kind rather than its `(formal_parameters)`. The ruling takes every pair the probe found, the table's and these: `abstract_method_signature_getter` and `method_signature_getter` > `formal_parameters`; python `block_statement` and `decorator` > `newline`; rust `extern_crate_declaration` > `crate`, `mut_pattern` > `mutable_specifier`, `receiver_parameter_declaration` > `self`. A test pins, per pair, that the query for the token finds none and the query for the holder finds each.

## The four readers

Every reader takes a fixed token's offsets through navigation's `Kid`, which `RunNodes::kids_of` builds from a row. The placer, `Lookups::assigned`, `Lookups::region_depth`, `Lookups::baseline_gap` and `source_items` are deleted with placement (parsed-comments spec, steps 3 and 4). These four survive.

### Spacing boundaries: `Lookups::edge_levels`

- **Today.** `nodes::for_each_edge_child` walks from a node to the child at its edge, level by level, while each starts (or ends) where its holder does. The writer then places, at that edge of a slice, what each level's template writes there (`RenderSink::boundary`). The chain often ends in a fixed token: the `(` of `arguments`, the `}` of a block.
- **After.**
  - The positional test stays for records and rows: their spans are stored.
  - Where the chain reaches a node whose edge is a fixed token or a unit, the token's kind comes from the node kind's render body: its first (last) part, read against the record's cells when that part is a slot, so the edge is the one the record's own render would write.
  - A fixed token is fixed for its kind, or for the polymorph form that is the record's kind. A choice among literal texts is a slot (a `kindEnum` or `mixedEnum` slot), so its edge is the cell's kind.
  - The per-kind leading and trailing fixed token is generated with the crate from `render-bodies.json`, the source of fixed tokens, as one fact per kind. It is never derived from text at run time.
  - A list's separator at a record's edge follows the same rule, and nothing new is stored for it. The list's `delimiter` says whether a separator sits at that edge. Its kind is the list's resolved separator: `SideSlot::separator`, else the arm of the options the tree was read with. A zero-width automatic semicolon is no trailing delimiter, so that edge goes on to the last item.
- **Identity.** `edge_levels` finds the coordinate's node by its index and measures the edge from the coordinate's span, so no test compares the two spans. A root's coordinate spans its whole source on both storages, so a root with leading whitespace has no child at that edge. Only a source's root can hold an extra or `ERROR` as its first or last child, because a reduction leaves them outside the node it builds, so the walk reads that edge by position there.
- **Proof.** A parity test compares the levels on every fixture, for each parsed node and side, before and after. A chain that ends in a list's separator can differ where the source's token there is not the list's resolved separator. Those chains are listed, and their proof is the render: every fixture's rendered bytes are unchanged on both storages.

### Depth moves: `Lookups::depth_move`

- **Today.**
  - A record's move is its side record's `DEPTH` stamp.
  - A row's move is counted over the rows inside it, by kind (`SurfaceKinds::indent`, `dedent`), plus the records inside it (`Walk::depth_move`).
  - `Lookups::depth_move` finds the node by `kid.span() == coord.span`.
- **What the census found.** Every `indent` and `dedent` row in the python corpus lies directly in a record's run: 165 of each, under `suite_block`, `block_statement`, `match_block`, `block_class_declaration` and `suite_block_class_declaration`. The hydration walk already counts the move of each child it meets from the cursor (`OpenRun::meet`), not from stored rows, and stamps the record.
- **After.**
  - A record's move is its `DEPTH` stamp, unchanged.
  - A row's move is the sum of the records inside it.
  - Generation fails if a kind whose render body holds an `indent` or `dedent` part is not read as a record. The fact is stamped where it's made and never re-derived.
  - The node is found by its index, not its span.

### A list's delimiter and separator: `last_list_child` and `Lookups::node_slots`

- **Today.** A list's trailing separator and its separator choice are its `delimiter` and `separator` preferences (§ Decided by the maintainer, question 3): a parsed list keeps its source's, and a built one takes the declared default through the same fill.
  - **The delimiter is already stamped at parse.**
    - The hydration stamps `DELIMITER` on the record of every list whose kind has an optional flank, which is every list whose trailing separator is optional. The derive's `record_end` passes `read::delimiter`, both flags, to `parsed_side`.
    - That covers 19 list kinds in rust, 8 in typescript and 23 in python, the same lists as `DELIMITER_SITES`.
    - The render takes the stamp as the parsed list's own setting.
    - A row is read for it only by a list rebuilt from a source list (its `sides`). `prepare::source_trailing_delimiter` takes the trailing flag from the source list's last kid and the leading flag from the options. The last kid is `SourceTable::last_list_child_kind`, that is `engine::last_list_child`: the last child that is not an extra and has width.
  - **The separators are not stamped.**
    - A parsed record's slot layouts come from `SourceTable::slot_layouts` (`LayoutAt::stored_slots`). That is `Lookups::node_slots` over the kids: `list_slots::slot_gaps`, then `majority`, which prefers a separator written over the list's first gap (`written_separator`).
    - It gives the slot separator: `slot_separator`, and `separator_kind` where the list's separator is a choice.
- **After.**
  - **The delimiter takes no new stamp.** `last_list_child_kind` reads the trailing flag of the `DELIMITER` the source list's record already holds, and `last_list_child` goes with the rows. Superseded (Decided: a parsed list's delimiter is its option, resolved once by the generated read code for both storages): the read resolves the option once, `last_list_child` and its `SourceTable` method go as a second derivation, and no parity step compares two readers.
  - **The list's separator is stamped by the walk**, while its working list still holds the separator tokens, into the side record's existing slot entry. `SideSlot::separator` holds the kind most of the list's gaps take, a tie going to the options' arm, and only where it differs from that arm.

    An item owns no separator (the maintainer, 2026-11-21; [the node query spec](2026-10-02-node-query-traversal-modification-api-design.md), "The separator"). A parsed record's `stored_slots` reads the stamp as it reads a built record's, and every gap of a rebuilt list writes the slot's separator, else the options'. Object storage resolves the separator by the same function at lookup, over its tree's children. Both compare against the options the tree was read with, never a render call's. An untouched list is its source slice, so its own gaps still render as written.
  - **Only a list whose separator is a choice is stamped**, which today is typescript's `object_type_content`. A list with one separator gives every gap that one, its kind's own, so a stamp there would hold nothing a reader lacks. The parity step checks this: `slot_separator` answers the same for every fixed-separator list from its kind as from its kids.
  - No new form is added: no bit beside the run, and no new field in `SideSlot`.
- **The leading flag is unchanged.** A parsed list's `DELIMITER` holds its source's flags, as today. A rebuilt list takes the trailing flag from its source and the leading flag from the options, as today.
  - No grammar declares a delimiter default with `LEADING`.
  - Typescript's `object_type_content` allows `LEADING`, so a render option can set it.
- **A trailing separator that carries meaning is the kind's rule**, not a stamp or an option. A list whose single element needs its trailing separator renders it at one element, built or parsed (`AssembledList::singleElementNeedsTrailing`, pinned by `packages/{rust,python}/tests/single-element-list.test.ts`). These lists are python's `tuple_elements`, `tuple_pattern_elements`, `expression_list`, `pattern_list` and `case_pattern_list`, and rust's `tuple_expression_elements`.
- **What it costs.**
  - The delimiter costs nothing new. The trailing separators' rows go with the other fixed-token rows: the census counts 19,250 lists with a fixed separator that end with one on matter.js and 17,950 on next.js, each a 4-word row today.
  - The separator stamp costs one slot entry (`SideSlot`, 6 words) on each parsed `object_type_content` whose separator differs from the options' arm.
  - `object_type_content`'s separator rows go: 3,088 on matter.js and 26,692 on next.js, 25,288 of them automatic semicolons.
  - The first step measures the slot entries.

### Re-indenting inside multi-line tokens: `line_starts_inside_tokens`

- **Today.** The re-indent in `SpacingWriter` must not indent a line that starts inside a token. Two cases:
  - a line break inside a token's span: a variable-text leaf such as a template string or a block comment. Those spans are kept;
  - a token ending in a line break, with the next token starting at that offset, such as a string's content followed by its closing quote. Here the next token is often a fixed token.
- **After.** The second case is a fact the parse knows. For a leaf ending in a line break, the hydration walk asks the tree for the next token, because a record's side is written before the walk meets that token. The answer is stamped as one bit on the leaf's facts, `NodeFacts::abuts_next`: "the next token starts where this one ends".
  - Testing the source byte after the leaf is not used: it would re-derive with a character class what the parse knew (working standard 3).
  - The census did not count these leaves; the first step counts them.
- **Proof.** A parity test compares the line starts of every parsed node on every fixture.

## Comment seating at parse

The rule is the parsed-comments spec's and does not change.

- **Seating.** The hydration walk seats each extra by its siblings, in document order: `OpenRun::placed` in `hydrate.rs`.
  - The walk reads its siblings from its working list (`OpenRun::entries` and `beside`), which holds every token the cursor met, fixed tokens included.
  - A fixed token still counts as the "child before it" in the first rule. For example, in `a, // c` the `,` is the child before the comment.
- **What changes.** The walk keeps every token in its working list and drops the fixed tokens when it writes the run. It numbers the written entries, and a cell's row and a placed side's key name the written entry.
- **No side is placed on a fixed token.** `placed` seats a side only on a named child, and an anonymous fixed token is never named.
  - **Named fixed tokens.** For the named ones listed under navigation, a comment beside one is seated as if it were unnamed, as a built node seats it (the built form has no such child).
  - **Expected cases.** These are the only placements expected to change. The parity test lists each one: node, side, kind and span, before and after.
- **Sides on a unit** are keyed by the unit's site (holder, slot word, item). The shared-arena spec gives that key ("Sides by site"), and a built unit's sides already use it (`trivia_store::Site`). Parsed sides are keyed by row today ("each parsed tree's by row", `trivia_store.rs`). A flag's keyword has no cell, so it has no site, and no side is kept on it (the arena spec, "A side on a node that its holder keeps as a fixed token or a flag is not kept").

## ERROR, header-only records, zero width and MISSING

- **Under trivia nothing changes.** An `ERROR` or an extra has no render body, so no token under it is a fixed token. Its run's rows stay as they are: 7 rows on matter.js and 6,417 on next.js. An `ERROR` renders as its source text (parsed-comments spec).
- **A header-only record** (a record with no cells, the term `admit.rs` uses): 4 on matter.js, 54 on next.js. It keeps `AT` and `SOURCE`; its text is its source slice.
- **A zero-width record** (4 on matter.js, 11 on next.js) keeps `AT`.
- **A zero-width fixed token** has no row: python's `newline` from a `tokenSeam` part, and `indent` and `dedent` from their parts (777 rows on paired python).
- **The automatic semicolon** is a cell's kind where a slot holds it: 17,627 on matter.js, 224,938 on next.js. In a separator choice it's the gap's kind id, as above.
- **MISSING.**
  - A MISSING fixed token has no row (2 on next.js).
  - A MISSING unit keeps its zero-width row (4 on next.js), so a render adds no text the source doesn't have.
  - A MISSING variable-text leaf keeps its zero-width row (1 on next.js).
  - Its holder's `HOLDS_ERROR` fact stays: `NodeFacts::of` stamps it from the tree at parse (`hydrate.rs::facts_of`).
  - The parse's error list (`error_regions`, `engine.rs`) reports MISSING regions with their holder's span. To verify on the branch: it runs over the tree's navigation, before the tree is dropped, so it does not read records.

## Public surfaces

Approved by the maintainer, 2026-11-17. The two rows marked "to verify" are checked before code; a `$snapshot` that lists a fixed token today comes back as its own row. "Unchanged" means the value is unchanged and a parity test proves it on every fixture.

| surface | today | after |
|---|---|---|
| addon `siblings(treeId, indexes)` → `Siblings { previous, next }` of `Sibling { start, end, kind }`; JavaScript reaches it through the parsed tree's `siblings` (`packages/common/src/engine.ts`) | a unit sibling carries its row's span; a named fixed token can be a sibling where its holder's read routes no slots (`siblings_counting`, `Kid::holder`) | a unit sibling has no span, as a rebuilt list's unit sibling already has none (`Sibling`'s doc); a named fixed token is no sibling |
| addon `descendants` and `readDescendants`; query facets `$children`, `$descendants` (`packages/common/src/query.ts`) | items: a node coordinate, or `QueryItem::Unit(kind)` with no span; a resume path of `ChildPosition`s indexes each level's kids | items unchanged (to verify per kind); a resume path's numbers change because a level lists fewer kids. A path is not kept across versions. |
| `NodeCoordinate.$treeHandle`, `$end` (`packages/types/src/core-types.ts`) | navigation indexes, minted as nodes are met (`Walk::meet`) | values renumber; same contract |
| `$text` | a record or leaf: its source slice; a query's unit: its kind's text | unchanged; no public surface names a fixed token, so none reads one's text |
| addon `lineStartsInsideTokens(treeId, index)` | line starts inside tokens of the node's subtree | unchanged; no caller in `packages/` |
| the parse's error list (`ErrorRegion`, `ErrorHolder`) | ERROR and MISSING regions with spans | unchanged (to verify: computed over the tree at parse) |
| `$snapshot` of a parsed node | detached plain data | to verify whether it lists a fixed token |

## What stays

- **A record's `AT`**: `[kind, start, end]`, 3 words in its side record, and its `SOURCE` word. Untouched nodes render as source slices from it ("An untouched parsed node is written as its source bytes, as today", parsed-comments spec). It is also what header-only and zero-width records hold.
- Leaf cells' spans, captured interior strings `[start + 1, end]`, and rows for variable-text leaves and nodes with no record.
- Every row under trivia.
- The read's other side-record fields.

## The one-word parsed cell

The census's other layout. Every parsed cell is one word:

- the tag word folds into the cell's word;
- a child cell `[kind, at, 0]` names its record, which gives the kind in its header;
- a leaf cell `[kind | row, start, end]` names its row, which holds the span;
- a unit cell is one word already;
- a slot that can hold a captured interior string keeps two words.

**Two stages** (ruled). The stages change different code and are measured apart:

- stage one, the row removal, changes the hydration walk, navigation and the four readers;
- stage two, the one-word cell, changes every parsed-cell decoder, in Rust (`Cell::decode_parsed`, the `CellWord` accessors) and in JavaScript (`record-cell.ts::decodeParsedCell`).

Neither needs the other. The row removal lands first.

Read words as a share of today, by corpus. Each row's lowest is in bold.

- **Fixed-token rows:** the fixed-token rows alone. Separators of a list kind with several candidates are left out of it: such a list's separator is stamped in `SideSlot::separator`, at a cost the first step measures.
- **Stage one:** the fixed-token rows and the unit rows: keyword, punctuation or enum, external-scanner and boolean-slot units. It is a lower bound: the census counts the token inside an enum node with no record (for example `string` in `predefined_type`) among "a token inside a slot-held node that has no record", and does not split it out.
- **One-word cell:** that change alone.
- **Fixed-token rows and one-word cell:** the two together, without the unit rows.
- **Stage two:** stage one and the one-word cell.

| corpus | fixed-token rows | stage one | one-word cell | fixed-token rows and one-word cell | stage two |
|---|---|---|---|---|---|
| paired rust | 86.6 | 86.0 | 82.3 | 68.9 | **68.2** |
| paired typescript | 87.5 | 83.8 | 83.7 | 71.2 | **67.5** |
| paired python | 89.2 | 88.6 | 85.1 | 74.3 | **73.8** |
| paired regex | 94.4 | 92.5 | 80.4 | 74.8 | **72.9** |
| paired scm | 82.6 | 81.6 | 85.8 | 68.4 | **67.4** |
| `engine.rs` | 87.3 | 86.5 | 83.2 | 70.5 | **69.8** |
| `create-engine.ts` | 87.2 | 83.6 | 82.6 | 69.8 | **66.1** |
| matter.js | 83.8 | 81.2 | 84.2 | 68.0 | **65.4** |
| next.js | 86.5 | 82.6 | 83.5 | 70.0 | **66.1** |

The fixed-token rows are 16.2% of a read's words on matter.js and 13.5% on next.js. Unit rows are another 2.6% and 4.0%.

## Release under this layout

Release was ruled 2026-11-20 ("A: release like built") and is built on the hydrate-at-parse branch. Its design is the arena plan's Task 6d, which stands wherever this section differs: a JavaScript view holds no count, so gap 2 below is dropped. This section shows what a parsed record holds under the layout above, and why removing rows changes no count.

**What a parsed record holds:**

| part | what it names | counted |
|---|---|---|
| header | its kind and its side record | the side record goes with the record |
| child cell | a child's record | yes: one count, placed at parse |
| list cell | its run of item cells | the run goes with the record (one holder) |
| leaf cell, captured string | offsets into the source | no; the source is held per record (below) |
| unit cell | a kind | nothing |
| side record `AT`, `SOURCE` | the record's span, and the source's string chunk | the source: one count per side record (gap 1) |
| side record run | record entries (trivia records, and contents read from the node), and rows | record entries: as child cells; rows hold nothing |
| side record `SLOTS` | separator choices; their token runs | the token runs go with the side record |
| placed sides | comment and ERROR records, in the held-sides store | dropped where a built record's sides are |

**Rows hold no reference.** A row is facts, span and inner count, with no address. Removing fixed-token rows, and unit rows, removes offsets, not holders. The release's rules are the same under both layouts. It walks fewer run entries and frees fewer words.

**The four gaps, restated against this layout,** as they were proposed (plan, "Four corrections found against the code").

1. **Who holds the source.** Every parsed side record holds it, one count per side record, added once at the end of the parse. Under this layout every stored offset still lies in some record: its `AT`, its leaf cells, captured strings and rows. Every record has `SOURCE`. Fixed tokens and units read no source at all, since their text is their kind's. So the holder set is unchanged.
   - Header-only and zero-width records hold only `AT`, and still need the count.
   - The arena-trees spec's sentence stands: "No per-tree owner, slot, table or count exists for a root, a link or a side entry to name or count."
2. **JavaScript counts a parsed record it names** through the count meta that the addon's `read(chunk)` reply carries. No layout change touches it.
3. **A link record holds its holder's record.**
   - A built cell names a parsed leaf by its holder and its row; that row is a variable-text leaf's and stays.
   - A unit is never linked: a builder stores its kind.
   - A fixed token cannot be named.
   - Under the one-word cell, the leaf cell names its row as the link does today.
4. **A parsed root's count is its handle's**, so a second release does nothing. No layout change touches it.

The cascade over a parsed record walks its parsed cells (child cells and list runs), its run's record entries that no cell names, its side record's token runs, and its placed sides. It skips rows. A record stays as the shared-arena spec has it: "records and their cells are immutable once written".

## Goals

- A parsed read stores no offset and no row for a fixed token or a unit.
- The four readers answer as today on every fixture, from positions, the render body and facts stamped at parse.
- A parsed unit cell is the built unit cell.
- Read words fall to the "stage one" column on every corpus, less the measured cost of the stamped separator choices.

## Non-goals

- Keeping source whitespace (already given up by the parsed-comments spec).
- Changing a record's `AT`, its source chunk, or the offsets of text the source carries.
- Changing built records, except that the unit cell is shared with them.
- A per-parse count, a clone on attach, or a span carried as a string-pool entry (all weighed and set aside in the plan's held-release notes).
- The one-word parsed cell, in the first stage.

## Gates

- **Read words**, as a share of today on every census corpus, by re-running the census probe, numbers compared per corpus. `deep_read_words`' two pinned fixtures (62,092 and 35,611 words today) fall, and the pin tightens.
- **Parity tests on every fixture**, before and after, with rows still written while both answers are compared:
  - edge levels, for each parsed node and side;
  - depth moves;
  - each parsed list's delimiter and slot separator, as `source_trailing_delimiter`, `slot_separator` and `slot_layouts` answer them;
  - line starts inside tokens;
  - placed sides: node, side, kind and span;
  - query results, units' order included: each node's `$children` and `$descendants` as (kind, span) sequences, on every fixture, and on a fixture for each of the 28 kinds whose cells are out of document order where the corpus has none.
- **Validation numbers** unchanged across all grammars (`sittir validate history`, compared per row). No render output is expected to change: an untouched node is its source slice, and a rebuilt one writes its template.
- **Tests that pin rows** change by design: `record_nodes.rs`'s `backers_agree`, and `arena/parsed.rs::runs_agree`, which compare the records' navigation with the tree's. They then compare against the tree with fixed tokens and units filtered out by role. Each one is listed and shown to pin rows before its expectation changes.
- **Parse and render timings** on CI's paired run against master's arena, per grammar. The walk does the same work and writes fewer words.
- **The stored-layout row answers for an arena tree** (accepted by the maintainer, 2026-11-18, for the three layout diagnostics of that day). `storedLayout` answers only for an object tree, because an arena parse has no tree id, so the validate row it feeds describes object trees under `--node-storage arena`. Stage one makes it read the lane's storage, so that row measures the storage it names before stage one's layout changes are gated on it. `layoutBaseline` and the layout-runs lane went with lazy placement. `layoutWork` stays object-only here (brainstorm's call, 2026-11-23): no validate row reads it, its two tests pin object storage, and an arena read has no tree to accumulate it on until the arena plan's Task 10 makes work the call's record.

## Order

1. **Probe.** Count the leaves that need the line-start bit, the parsed `object_type_content` lists with a gap, and the gaps that differ from their list's majority, on every census corpus. Check the two public rows marked "to verify": that the parse's error list is computed over the tree at parse, and whether `$snapshot` lists a fixed token (if it does, that comes back as its own row).
2. **Parity first.** The parity tests above, with the stored facts written beside today's rows and the readers answering both ways. No output change.
3. **Rows go** (stage one). The walk stops writing fixed-token and unit rows; unit cells take the built form, a unit is listed from its cell, and unit sides are keyed by site; the readers read the stored facts, and the tests that pin rows are retaken.
4. **The one-word parsed cell** (stage two), as its own change.

## Open questions for the maintainer

1. ~~Do unit rows go too?~~ Ruled 2026-11-17: yes (see Decided by the maintainer).
2–6. Ruled 2026-11-17 (see Decided by the maintainer): a unit is listed from its cell, in its render body's order; a list's trailing separator is its delimiter preference; named fixed tokens leave navigation; two stages, rows first; the public surface rows are approved.
7. **Release.** Ruled 2026-11-20: "A: release like built", which replaces 2026-11-17's "Keep holding". The hydrate-at-parse branch releases a parsed record as it does a built one.
