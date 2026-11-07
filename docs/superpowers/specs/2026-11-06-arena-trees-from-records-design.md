# Arena trees from records: design

**Status:** draft for the maintainer's approval, 2026-11-06.
**Scope:** arena storage's parse, read, render, query and edit paths in `sittir-core`, the engine's tree functions, and the arena tree holder. Object storage keeps its representation.
**Evidence:** prototype's spike (single cursor pass, token spans, hydrate at parse, tree dropped) and its render profile, both on master 2948b9f1c, release build, local. The spike's machine was loaded, so its timings compare with each other, not as absolutes.

## Why

- **Memory.** Tree-sitter's tree costs about 100 bytes per node, and it lives as long as any node of its parse. All of matter.js (2.91M nodes), fully hydrated in arena storage, holds 424 MB today. With the tree dropped it holds 166 MB, 61% less.
- **Render speed.** 40–57% of a rebuilt or edited render moves tree-sitter cursors down from the root (`cursor_at`, `read::goto`) to ask about rows the records already describe. Another ~10% measures baseline gaps through the tree on every render. Templates are under 1%.
- One change answers both. Once arena storage reads everything from what its records hold, it no longer needs the tree.

## Goals

1. An arena parse hydrates the whole tree within the parse call, in one cursor pass, and drops tree-sitter's tree before it returns.
2. Every question that render, query and edit ask of a parsed arena tree is answered from what the parse keeps: records, token spans, node rows, the source buffer and placed sides.
3. Each rule is written once and runs in both storages: trivia placement, edge levels, frames, list layouts, separators, seats, depth moves, line starts and descendant walks.
4. A fact fixed at parse is stamped once, not measured per render. This covers baseline gaps.
5. Renders stay byte-identical and records stay word-identical, in both storages.

## Non-goals

- Object storage keeps reading lazily over tree-sitter's tree. Rows for object storage stay parked.
- Incremental parsing and tree-sitter queries.
- Per-call reformat and styleFrom, which are parked.
- Threading, which gets its own spec. Nothing here moves a napi or V8 call off the JavaScript thread.

## Anti-goals

- A second copy of a placement or layout rule for arena storage. Two backers of one navigation interface are fine. Two copies of one rule are not.
- Any copy of the source on the JavaScript heap, or bulk source crossing to JavaScript. A tree's bytes and strings stay native.
- A render, read or query result that differs between the storages.

## Decided

The maintainer decided these on 2026-11-06:
- Arena storage only: hydrate eagerly at parse, drop tree-sitter's tree, and keep the source buffer whole (one pooled string, read by byte offsets).
- No walk into rows for arena storage. The single cursor pass hydrates directly.
- Each anonymous token's span is kept with its record, so trivia stays lazy and is placed from records.
- The arena tree holder (tree holders, Task 4) is held for this design.
- The single cursor pass ships first, as its own change, and the untouched-render fixes ride alongside.

## What an arena parse keeps

- **Records** for every node, from the single cursor pass. Leaves stay coordinates inside their holder's record.
- **Token spans**, beside the arena chunks and keyed by record. Each child the records don't otherwise name gets one entry of 3 words: its index, start and end. These children are anonymous tokens, extras, named units and flags, and named children a template writes (such as `constructor`, or an empty `()`). The spike's check found that records plus these spans locate every byte trivia placement needs: 0 uncovered bytes and 0 overlaps over all of matter.js and next.js.
- **Node rows:** each node's descendant index, span, subtree end and kind, as the side records hold them today. `NodeIndex` stays tree-sitter's descendant index, so indexes, written sides and coordinates mean the same thing in both storages.
- **Baseline gaps**, each measured once when its layout run is first placed, and kept with the run.
- **The source buffer** and **placed sides**, as today.

The spike's cost: records take about 33.8 bytes per node, and spans add 7.8 bytes per node in words (11.2 counting vector capacity).

## One navigation interface, two backers

The rules reach the tree through a few primitives. Trivia placement (`trivia_table/place.rs`) reads only `node`, `kid`, `kids` and `path`. Its `Kid` carries a node's index, span, descendant count, kind, and whether it is named, an entry, a leaf, or holds sides. The `SourceTable` methods use the same kinds of facts.

- **The interface** gives a node's facts (`Kid`), its children in order (named, anonymous and extras), and its parent. Naming is left to the builder.
- **The tree backer** serves object storage from tree-sitter's tree. It keeps one cursor and moves it from where it last stood, instead of descending from the root for each query. That removes the root-down `goto` that object storage pays today too.
- **The record backer** serves arena storage from records, token spans and node rows. It finds a parent from the rows' subtree ends, never with a cursor.
- **The consumers** move onto the interface with their logic unchanged:
  - the placer;
  - the `SourceTable` methods `kind_of`, `for_each_descendant`, `line_starts_inside_tokens`, `last_list_child_kind`, `for_each_edge_level`, `depth_move`, `sides`, `frames`, `slot_layouts`, `separator_before`, `framed_span` and `seat_through`;
  - the engine's tree functions: `descendants`, `siblings`, `planHolds`, `snapshot`, `text`, `coordinate`, the layout baseline and stored layout.
- In arena storage, `SourceTable::read_ctx` stops handing out a tree. `source_root` and `row_coordinate` answer from node rows, and `edited_record` stops re-hydrating, since every node already has a record.
- **Backer parity is the guard.** For every node of every fixture tree, and of the matter.js and next.js corpora, both backers give the same `Kid`, children and parent.

## Parse cost

These are the spike's numbers in ns/node (relative, loaded machine):

| | big file | matter.js |
|---|---|---|
| parse only, lazy (today) | 140 | 220 |
| parse plus deep read (today) | 308 | 400 |
| parse with hydration, tree dropped | 274 | 364 |

A caller that parses and reads deep saves 12–15% of the time and 61% of the memory. A caller that parses and only renders untouched pays about twice today's parse. Arena storage is meant for read-heavy work, so the design keeps the eager path the maintainer chose, and these numbers are here for anyone who revisits that choice.

## The arena holder

This replaces tree holders Task 4.
- What a parse keeps (buffer, token spans, node rows, placed sides) sits in one slot of the engine arena's held-parse table.
- The slot is counted once by the parse root and once by each link record that names it. The link record stays 8 words.
- The root's `[Symbol.dispose]` and `engine.release(node)` drop the root's count. Releasing any other read handle does nothing.
- A read handle is an uncounted borrow that names its slot and its parse's id. A handle whose slot no longer holds that id is refused by name, and it never reads another parse.
- The interim `Tree` object leaves arena storage. So does the arena's use of the weak tree index.

## Order of work

Each step lands on its own and stays green:
1. The single cursor pass (in flight).
2. The navigation interface and its tree backer, with every consumer moved onto it. The representation doesn't change, and output stays byte-identical in both storages. Object storage measures the local cursor.
3. Token spans and node rows in arena records, plus the record backer, with backer parity on the corpora. The tree is still kept.
4. Arena render, queries and edits read the record backer, and baseline gaps are stamped with their run.
5. Hydrate at parse and drop the tree. The held-parse slots replace the interim `Tree` object.
6. CI measurements.

## Verification

- `validate:native` rows identical in both storages after every step.
- Records word-identical to master's deep read, checked against goldens taken from master.
- Backer parity on the fixtures and both corpora.
- Renders byte-identical over all of matter.js and next.js, in arena storage with the tree dropped.
- Memory: retained bytes on matter.js and next.js, from CI.
- Speed: CI per-CPU medians for parse, deep read, and the three render cases (untouched, rebuilt, a codemod edit), in both storages, held to the ×1.10 bar per grammar.

## Left to the builder

- Names and module placement for the interface and backers.
- How node rows are stored.
- The token-span encoding, within its 3-word budget.
- How a parse's record chunks are freed today, and how they join the held-parse slot.
