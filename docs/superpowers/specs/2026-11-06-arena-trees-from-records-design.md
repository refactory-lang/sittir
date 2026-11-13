# Arena trees from records: design

**Status:** approved by the maintainer, 2026-11-06. Tree lifetime settled 2026-11-12 (see Decided).
**Scope:** arena storage's parse, read, render, query and edit paths in `sittir-core`, the engine's tree functions, and the arena tree holder. Object storage keeps its representation.
**Evidence:** prototype's spike (single cursor pass, token spans, hydrate at parse, tree dropped) and its render profile, both on master 2948b9f1c, release build, local. The spike's machine was loaded, so its timings compare with each other, not as absolutes.

## Why

- **Memory.** Tree-sitter's tree costs about 100 bytes per node, and it lives as long as any node of its parse. All of matter.js (2.91M nodes), fully hydrated in arena storage, holds 424 MB today. With the tree dropped it holds 166 MB, 61% less.
- **Render speed.** 40–57% of a rebuilt or edited render moves tree-sitter cursors down from the root (`cursor_at`, `read::goto`) to ask about rows the records already describe. Another ~10% measures baseline gaps through the tree on every render. Templates are under 1%.
- One change answers both. Once arena storage reads everything from what its records hold, it no longer needs the tree.

## Goals

1. An arena parse hydrates the whole tree within the parse call, in one cursor pass, and drops tree-sitter's tree before it returns.
2. Every question that render, query and edit ask of a parsed arena tree is answered from its nodes (records, node rows and placed sides) and its source text.
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

The maintainer settled tree lifetime on 2026-11-10 and 2026-11-12. A proposal starts from these and doesn't reopen them:
- **The tree's scope is the read call.** Tree-sitter's parser and tree are made and dropped inside the parse call and never passed elsewhere: no drop thread, no deferred-drop queue. Whatever the drop costs is paid inside the call, so make the drop cheaper.
- **"The only thing that lives after parse is the source text."** Besides the nodes themselves, nothing outlives the read call.
- **No parse side channel:** "there should be no 'parse' side channel of data not captured within the materialized nodes".
- **"The root shouldn't have a reference to the tree."** No per-tree owner, slot, table or count exists for a root, a link or a side entry to name or count.
- **"Cross node reuse is not unique to the parsed nodes."** A built node linking a parsed node is the same relation as a built node linking a built node, or a side entry naming a record from elsewhere. One node-level mechanism covers every case, and it is node work, not this design's.
- **Node memory is out of scope:** "We don't need to free our nodes - we just need to get rid of the tree." For when nodes come up, the recorded direction is that released node buffers are reused and memory returns at the engine's dispose.
- **A link to another engine's nodes is refused** in arena storage, as a cross-engine side entry is.
- **A snapshot is canonical** (2026-11-12: "Canonical: renders `ur"a"`"). A detached snapshot holds a spelled slot's canonical member and no source spelling, so a snapshot of python `UR"a"` renders `ur"a"`. Both storages read the canonical member, per the 2026-11-09 ruling that spelling is its own channel, so object storage's read of a spelled slot follows it too.

## What lives after an arena parse call

- **Records** for every node, from the single cursor pass. Leaves stay coordinates inside their holder's record.
- **Node rows:** one dense row per node, records included, of 4 words: start, end, subtree end, and a packed word (grammar kind, field, and named, extra, `ERROR`, `MISSING`, holds-an-error and aliased flags). A sparse map holds each aliased node's display kind.
  - The row at a node's descendant index is its row. `NodeIndex` stays tree-sitter's descendant index, so indexes, written sides and coordinates mean the same thing in both storages.
  - Rows give every node a token span. That covers anonymous tokens, extras, named units and flags, named children a template writes (such as `constructor` or an empty `()`), and nodes inside subtrees the hydrate pass doesn't enter. The spike's check found that records plus spans locate every byte trivia placement needs: 0 uncovered bytes and 0 overlaps over all of matter.js and next.js.
  - A 3-word span per child the records don't name can't answer backer parity. A token, extra, unit or flag has no record holding its kind, field or flags, and a kind isn't read from text. So rows are dense.
- **Baseline gaps**, each measured once when its layout run is first placed, and kept with the run.
- **Placed sides**, which are node data.
- **The source text**, the one thing besides the nodes.

The spike's cost: records take about 33.8 bytes per node, and spans added 7.8 bytes per node in words (11.2 counting vector capacity). Dense rows cost 16 bytes per node instead. That puts matter.js at an estimated 190 MB, not the spike's 166 MB, still about 55% under today's 424 MB. Task 7 measures it.

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

## Tree lifetime

This replaces tree holders Task 4.
- **Inside the parse call:** the parser, the tree, the cursor, placement scratch and every read cache are made and dropped.
- **After the call:** the nodes and the source text. There's no held-parse table, slot, tree table or `Tree` object, and no count that a root, link or side entry takes on a tree. The interim `Tree` object, the live-tree table and the arena's weak tree index leave arena storage.
- **Every field of today's `ParsedTree` and `TreeArena`** is node data, source text, recomputed from those on demand, or dropped inside the read call. A field that isn't per-tree at all belongs to the engine (its grammar, its built-arena store) or to the call (its work counters, per the lock-free spec). Lazy trivia placement after the call reads only nodes and source text.
- **A coordinate or link names a node,** not a tree. The link record stays 8 words.
- **A parsed node lives in the same storage as a built node** (the maintainer, 2026-11-12: "Same storage as built nodes"). A read hydrates its records into the engine's built chunks, in whole chunks of its own, so built and parsed records share one address space. No read store, per-read block, per-read row array or per-read id exists (the maintainer, on a block id standing where the tree id stood: "Don't we have relative coordinates for this reason?").
- **A node's name is `NodeId`,** a newtype over its record's address in arena storage (the maintainer, 2026-11-12: "we can make nodeId a newtype", "address is sufficient"). A built cell names a parsed record directly, as it names a built one. A named leaf or a fixed token has no record, and is named by its holder's `NodeId` and its site, as a built leaf is. A comment or `ERROR` gets a record of its own. Object storage keeps its tree and index inside its own `NodeId`, since its tree outlives the read.
- **The source text is in the string pool** (the maintainer, 2026-11-12), as one whole string, written natively inside the read call. A record names its source by a string reference, and its spans are bytes in that string. Small sources share a string chunk; a source too large for one takes a chunk of its own (the maintainer, 2026-11-12: "Share string chunks").
- **The cap.** Built storage holds 2^16 chunks, since a built cell keeps 16 bits for its chunk, and in this design no parsed record is released before the engine's dispose: each is placed with a count of 1, and releasing a parsed root is a no-op for its records. One engine therefore fits about 28 to 43 corpora the size of matter.js (2,410 files) before a read is refused with `ArenaError::Full`. Reusing released node buffers, the recorded direction for node memory, lifts it.
- **Anonymous and MISSING tokens stay with their record,** as Decided says of token spans: a parsed record carries the rows of the children it has no cell for, so trivia placement stays lazy. A node with no source span to measure, a built node, renders from the engine's render options, as it does today (the maintainer, 2026-11-12: "we default to engine render options").
- **Nothing in arena storage is keyed or ordered by a descendant index** (the maintainer, 2026-11-12: "Why do we need to order anything by index?"; "Navigation doesn't have to 'rekey' by node id because that's what we already use for built nodes"). A parsed node uses the built node's address-keyed paths where one exists: written sides, the render entry, cell and side-record reads, counts. What a built node never asks, because it has no source (placed sides, source-faithful list facts, spans), a parsed node answers from its own record, its run of children in document order, its parent word and its source, through the record backer, whose key is a record's address or a recordless node's row address. No count word is stored and no index is derived. Only tokens with no width can share their bytes (a dedent, a MISSING token, an automatic semicolon, a node's start or end edge), and trivia placement orders them by rank: among the nodes that touch that byte, the order a walk from the root enters and leaves them. The rank is a function of the tree alone, the same whichever walk asks, computed once per such byte inside the call and kept nowhere. The record backer may number the nodes one navigation meets, for that navigation only; that number carries no order and never crosses to JavaScript. The descendant index stays with object storage's tree.
- **The parsed side record changes** (it loses the descendant index and subtree end, and gains its parent, its flags and its source chunk), so record-word goldens are retaken once. Render, query and snapshot output stays byte-identical (the maintainer, 2026-11-12: "Retake, renders stay identical").
- **A built node linking parsed nodes** renders the same after the parsed root is released as before.
- **A render takes the built store's read once.** Today `render_built_with` holds that read for the whole render and `ArenaSources::render_record_entry` takes it again on the same thread, which deadlocks once a writer queues between the two (latent while one JS thread drives the engine). With the live-tree table gone, the render hands core the arena it already holds through `sittir_core::napi_engine::entry_sources_holding(grammar, store, built, f)`, an internal pub function that takes no tree (the maintainer, 2026-11-12: "Yes but it can't reference the tree"). The fix lands with the tree drop, in the same PR, and has no failing test first, since the code is napi-only and can't be tested where it sits (the maintainer, 2026-11-12: "Fold into Task 6's PR", "Port without a test").

## Order of work

Each step lands on its own and stays green:
1. The single cursor pass (in flight).
2. The navigation interface and its tree backer, with every consumer moved onto it. The representation doesn't change, and output stays byte-identical in both storages. Object storage measures the local cursor.
3. Token spans and node rows in arena records, plus the record backer, with backer parity on the corpora. The tree is still kept.
4. Arena render, queries and edits read the record backer, and baseline gaps are stamped with their run.
5. Hydrate at parse and drop the tree inside the read call. The interim `Tree` object and the live-tree table leave arena storage.
   - Then, as its own step (plan Task 6b; the maintainer, 2026-11-12): string-pool interning moves native, so the pool has one writer and one write position. Step 5 only writes each read's source into the pool natively and leaves built text's JavaScript interning as it is. Today a repeat intern is one JavaScript map lookup with no crossing, and the bench is almost all hits, so the move ships only in a shape that crosses less than once per intern call and leaves arena no slower on any CI CPU.
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
- Where each field of `ParsedTree` and `TreeArena` lands: one of Tree lifetime's four bins, or the engine or the call. A field that fits none of those goes to the maintainer before anything is designed around it.
