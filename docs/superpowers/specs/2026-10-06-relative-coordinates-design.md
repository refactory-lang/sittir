# Relative coordinates and node identity

**Status:** Design spec, written 2026-10-06 against master `0ca8e9e28`. It replaces
`2026-09-29-relative-spans-design.md`, re-based on the typed reader's tree-and-index coordinates
as the shared-arena spec's ruling 6.2 asks. Every choice below was ruled by the maintainer in the
2026-10-06 design discussion.

## Problem

A parsed node's coordinates are absolute byte offsets into its tree's source, and its identity is
a handle the engine mints into a node table.

- **Self-contained data loses its layout.** Data made self-contained (a parity fixture) drops its
  handle and span, so every fact the render derives from coordinates is copied into the data
  first: `$text`, `$sameLine`, `$tokensBetween`. Each new fact needs its own copy; the one that was
  missed, the root's leading and trailing bytes, makes a fixture render differently from its
  parsed source.
- **Two derivations of each layout fact.** A tree-bound render derives the facts from coordinates;
  a self-contained render reads the copies. The two can disagree.
- **Stamped placement facts.** The reader stamps `$sameLine` and `$tokensBetween` on every trivia
  entry so the render can seat a comment on the right side of a token. They are facts the
  coordinates already hold.
- **Query results are second objects.** A query hands out a wrapper of its own, not the node its
  parent's slot holds, so a `$trivia` write through it never reaches the parent's render.

## Rulings (2026-10-06)

1. **Relative points exist only in snapshot data.** A read's coordinate is its tree and index;
   points relative to the parent are computed when a snapshot is taken, while the tree is loaded.
2. **Identity is the tree and the index.** One registry per tree maps an index to its wrapper, and
   queries and accessors share it.
3. **The tree's descendant index is named `index`.** Points keep tree-sitter's `{ row, column }`.
4. **The method is `$snapshot()`**, and the two coordinate forms are **tree-backed** and
   **snapshot**. `$detach`, `$unbind`, `$pop` and `$pluck` were rejected: the engine's `attach`
   crosses a node to an engine, and "bound to this engine" is engine vocabulary.
5. **No render cache.** An untouched node already renders as a slice of its source; the edited-index
   set (§ Edits and folding) removes the walk that proves it untouched.
6. **Arena storage holds both kinds of node.** Built nodes write their records eagerly, and every
   member reads and writes the records directly; the object encoder is retired (§ The record wire).

## Design

### Coordinates: tree-backed and snapshot

| form | holds | made by |
| --- | --- | --- |
| **tree-backed** | the tree, `index`, `end` (`index + descendant_count()`), the byte range, the kind | the typed reader, on every read |
| **snapshot** | `span: { start: { row, column }, end: { row, column } }`, relative to its holder's start; the kind; each leaf's text | `$snapshot()` and serialization only |

A tree-backed coordinate holds no points; a snapshot holds no tree, index or bytes.

A tree is released only when nothing names it: every parsed object holds its tree's token, and the
tree is dropped when the token is collected (`treeDisposalRegistry`). A tree-backed node therefore
always has its tree, and data stops being tree-backed only through `$snapshot()`.

### The index

The index is tree-sitter's descendant index: a node's position in a pre-order walk that counts
every visible node, named or anonymous.

| call (Rust / C) | gives | cost |
| --- | --- | --- |
| `TreeCursor::descendant_index()` / `ts_tree_cursor_current_descendant_index` | the index of the cursor's node | constant |
| `TreeCursor::goto_descendant(i)` / `ts_tree_cursor_goto_descendant` | moves to node `i` | climbs to the lowest ancestor holding `i`, then descends, skipping sibling subtrees by their stored counts |
| `Node::descendant_count()` / `ts_node_descendant_count` | the node and all its descendants | constant |

- **Ranges.** A node's descendants are exactly `[index, end)`.
- **Offsets from a start node.** A cursor numbers from the node it was created on, which is 0. A
  walk started at a node whose index is `s` reports `d` for a node whose index is `s + d`: both
  numberings add the same visible-descendant counts below the start node. The native query walks
  from its start node and adds `s`.
- **Stability.** An index is stable for the life of its tree version. A tree version never changes:
  an edit produces a draft, and `$commit()` a new version with its own indexes.

### Identity: the index registry

- **One wrapper per node.** Each tree keeps, on the JavaScript side, a map from index to a weak
  reference to the node's wrapper. An accessor that hydrates a coordinate, an index read and a
  query all look there first and register what they wrap. A node reached through a query is the node its
  parent's accessor returns.
- **Per surface.** The registry is per tree and per surface. Attaching a parsed node to another
  engine's surface wraps it again from its index there; no identity is promised across surfaces.
- **No ancestor hydration.** A query returns indexes and hydrates only its matches.
- **A match stored as a scalar** is the stored value its accessor returns: a fixed-text leaf is its
  kind id, and an enum member its member id. Such a match is plain data, not wrapped.

### Edits and folding

- **The edited set.** Each tree keeps a sorted set of edited indexes. An in-place trivia write adds
  its node's index. A draft is a new node and adds nothing.
- **The fold check.** A tree-backed node renders as its source bytes when no edited index lies in
  `[index, end)`: one binary search. This replaces the projection walk (`canFold`,
  `isUntouchedBelow`) that decides today whether a subtree may cross as one coordinate.
- **Where it lives.** The set is JavaScript-side only. Native code receives a coordinate when the
  range is clean and data otherwise.

### Lines for tree-backed nodes

Each source gets a table of line-start byte offsets, built on first need and shared by every render
of that source. A byte offset's row and column are a binary search. Whether two tree-backed
neighbours share a line, and a node's indentation, come from their bytes through the table; the
reader stamps neither.

### Snapshots

`$snapshot()` is a member of parsed nodes only. It returns a new graph of plain values with geometry,
not registered and not `===` the original.

- **A clean range** (no edited index in `[index, end)`) is one native call: the subtree is read from
  its index at full depth into snapshot data, each node with its relative span and each leaf with
  its text.
- **An edited parsed node** contributes its own data, takes its span from its index, and its slots
  are snapshotted in turn. It keeps its geometry, so a same-line trailing comment stays on its line.
- **A built node or draft** seated inside contributes its data with no span; it renders from options.

**What a point is measured from:** the start of the transport whose bytes contain it.

- a child's, from the transport that holds it;
- a trivia entry's, from its owner's holder, since a leading entry lies before its owner;
- an inner-gap entry's, from the node that holds the gap.

The snapshot computes every point from tree-sitter's absolute positions while the tree is loaded, so
no layer composes offsets through hoisted or flattened nodes. Offsets are never negative; each field
is a `u32`.

**The column rule** (tree-sitter's `length_add`): a point with row offset 0 is on its base's start
row, and its column is added to the base's column. A point with a row offset above 0 is on a later
line, and its column is measured from that line's start.

### Rendering snapshot data

The seams between untouched neighbours come from geometry:

- adjacency: the two points are equal;
- a line break: the rows differ;
- blank lines: the row difference beyond one;
- indentation: the next neighbour's start column, when its row differs.

Comments keep their text, since trivia are nodes and a leaf's text is data. What geometry cannot
give (tabs, trailing spaces, line endings) falls to options and defaults. Gaps are classified by
the same classifier entry as source gaps, with the gap's two points in place of its bytes.

### Serialized data

Serialized data (a parity fixture) is a snapshot written as JSON, with no source buffer. The root's
edges come from geometry: its first child's start row gives the leading line breaks, and its last
child's end against the root's end gives the trailing ones. A check that needs exact bytes keeps
the source and parses it again, so byte fidelity has one mechanism: the tree.

### Trivia ownership

Superseded on 2026-10-09: an extra's address is the gap between two tokens, and its owner follows
tree-sitter's convention for extras, so no side of a token is recorded
(`2026-10-09-trivia-table-design.md`, § 1).

A comment's owner decides which side of the surrounding tokens it renders on, so no count of tokens
is recorded. The reader applies the rule in its placement (`sittir_core::read::place`):

- **Trailing the previous sibling** when no token lies between that sibling and the extra:
  `a /* x */, b` trails `a` and renders before the `,`.
- **Leading the next sibling** when a token lies between: `a, /* x */ b` and `a, // x⏎ b` lead `b`
  and render after the `,`.
- **The parent's closing gap** when a token lies between and no next sibling exists:
  `[a, b, // c⏎]` is inner trivia of the list, after its last element's tokens and before its closer.

### The closing gap

Superseded on 2026-10-09: an extra before a closer lies in the gap between the last element's
tokens and the closer, which the compound owns, so no closing gap is derived or stamped
(`2026-10-09-trivia-table-design.md`, § 1).

A compound whose render rule ends in an unconditional token after its last slot has a closing gap:
an inner gap after its last element and before that token. It is derived from the render rule by
the walk that gives empty forms their inner gaps (`innerGaps`), never declared, and codegen stamps
it on the kind beside the other gap facts. A compound with no closing token has none: an extra after
its last token lies outside its bytes, and tree-sitter gives it to an ancestor, where the same rule
applies. A kind with a closing gap carries `inner` trivia on its type even when it has no empty-form
inner gap.

### Factory nodes

A built node has no geometry. Its author chooses the side, and each side renders in a fixed place
relative to the parent's tokens:

- `trailing` on `a`: after `a`, before the parent's next token;
- `leading` on `b`: after that token, before `b`;
- `inner` at the closing gap: after the last element, before the closer.

The reader's ownership rule is the inverse: it assigns a parsed comment to the owner and side that
render it where it is. A built node never takes an index of its own: it is built before its parent,
so its position is unknown, and one object may sit in several places. Its identity is its JavaScript
object.

### Joins resolved at prepare

Superseded on 2026-10-09: the trivia table holds a gap's line breaks beside its comments, so
whether an entry joins its neighbour's line is read from the gap, and a write stores the
whitespace it renders with (`2026-10-09-trivia-table-design.md`, § 1, § 2 and § 7.3).

Whether a trivia entry joins its neighbour on the same line is resolved once, at prepare, and the
render reads only the resolved join:

| node | from |
| --- | --- |
| tree-backed | the line table over its bytes |
| snapshot | the rows of its points |
| built | an explicit whitespace entry (`space`, `newline`, `blankline`) before the entry, or the defaults |

The defaults: a leading entry ends its line; a trailing entry starts a new line at the owner's
indentation; a line comment's after-edge is `newline`. A whitespace entry replaces the spacing
default at its position, so `a; // x` stays on one line when the author puts a `space` entry before
the comment.

### `$cst()`

`$cst()` is a member of parsed nodes only. It returns tree-sitter's facts for the node it was read
from: its kind name, byte range, start and end points, and text. One native call seeks the index and
reads `start_byte`, `end_byte`, `start_position`, `end_position` and the kind; the text is a slice
of the source. Nothing is cached and no tree-sitter object crosses the boundary. An edited parsed
node's `$cst()` describes the node as parsed, since its tree version is unchanged. sittir's own
diagnostics read a parsed node's location the same way. Snapshots and built nodes have no `$cst()`,
and their types do not declare it.

### The record wire

Arena storage holds both kinds of node (ruling 6 above), so the record layout fixed after this design
must allow:

- **Children by record address.** A record names each child by its record's address; a shared child
  is one record named twice.
- **Tree facts on parsed records.** A parsed node's record carries its tree, index and end, so
  identity and the fold check read the record.
- **Build order for built records.** Builders append records as they build, children before
  parents, and every member reads and writes the record directly; `$with` appends a record that
  names the unchanged children. Built records need not lie in document order, and a built subtree
  need not be contiguous.
- **Render in place.** The render functions, still emitted by codegen, read through a view over the
  record, expanded by the derive from the same declaration; no record is decoded into a struct.
- **Prepare beside the records.** What prepare resolves per render (edges, spacing, list-gap
  classes, trivia joins) goes into side arrays keyed by record address, never into the records.

The record step settles two semantics of eager built records: whether a setter writes in place or
appends (one child record may sit under two parents), and how records nothing names are reclaimed.

## Sequencing

| step | lands |
| --- | --- |
| **one reader** (the typed reader's last step) | the index replaces handles (`row` becomes `index`); the registry and the edited set replace the query path walk, `adoptChild` and `detachAncestors`; the fold check by range replaces `canFold`; the native query returns indexes from the root |
| **trivia** | superseded on 2026-10-09 by the trivia table (`2026-10-09-trivia-table-design.md`), which the typed-reader plan lands as 1d. Planned here: the ownership rule by token side; the closing gap; the line table; joins resolved at prepare; the `$sameLine` and `$tokensBetween` stamps go |
| **snapshots** | `$snapshot()` with relative points; snapshot seams from geometry; fixtures as snapshots; `$cst()` by index |
| **record wire** | arena storage for both kinds of node, as § The record wire states |

The trivia step comes apart from the snapshot step because it can move validation rows: a moved row
then has one cause. Snapshots need the trivia step's joins.

Superseded on 2026-10-09 with the trivia row: the line table lands with the snapshot step, and that
step is re-planned against the trivia table, which holds each gap's line breaks.

## What is removed

- `$sameLine` and `$tokensBetween`, on the wire, the types and the fixtures;
  `TransportTrivia::render_trailing`'s held entries;
- the self-contained `$text` copies and `selfContainedRenderInput`, which `$snapshot()` replaces;
- `adoptChild`, the parent links and `detachAncestors`; the projection walk `canFold` and
  `isUntouchedBelow`;
- `$handle`, `$parentHandle`, `$treeHandle`, `$childIndex`, the node table and `HandleMint`, as the
  typed reader already plans.

## Relationship to other designs

- **Shared arena.** This is its ruling 6.2. Its § Relationship to other designs points here, and its
  record step builds § The record wire.
- **Typed reader.** Its one-reader step takes the index, the registry and the fold check; its query
  item changes from a path walk to the registry.
- **Trivia ownership.** Its render rules for built and detached trees are kept; `$sameLine` becomes a
  resolved join.
- **Binding generator.** `attach` re-wraps a parsed node from its index; its "row" is this design's
  `index`.
- **Edit model.** A node's identity across `$commit()` is the edit model's question. Tree-sitter's
  `Node::id()` survives an incremental reparse for reused nodes, best effort, and is the natural input
  to an old-to-new index map. Nothing here stores it.

## Verification

**One reader:**

1. A node reached through a query and through its parent's accessors is the same object, and the same
   `$trivia` write through each renders byte-identical output.
2. A `$descendants` query makes no native read for an ancestor: reads equal the matches not already
   registered.
3. For every corpus node `S` and every node under it, `S`'s index plus the offset from `S`'s cursor
   equals the root cursor's index.
4. A trivia write on a deep node makes its ancestors render from data, while untouched siblings and
   cousins render as source bytes.
5. The render of an untouched root read whole is timed against today's projection walk, like for like.
6. The registry's heap per wrapper is measured on the untouched whole-tree read and the query-heavy
   population.

**Trivia:**

Superseded on 2026-10-09 with the trivia step: the typed-reader plan's 1d verifies the trivia table.

7. `f(a /* x */, b)`, `f(a, /* x */ b)`, `f(a, // x⏎ b)`, `a + /* x */ b` and `[a, b, // c⏎]` keep each
   comment on its side of the token, built with the matching sides and, after the snapshot step, as
   snapshots.
8. A built trailing comment after a `space` entry stays on its line; without one, the defaults apply.
9. For every corpus node, the line table's row and column equal tree-sitter's start point.
10. `$sameLine` and `$tokensBetween` are gone from the wire, the types and the fixtures.
11. The `trivia-placement` census and the validation rows are compared before and after; a moved row
    is a finding for the maintainer.

**Snapshots:**

12. The parity fixtures are snapshots and render with the parsed layout, root edges included; rust's
    left-out fixtures return to their count before the root-edge change.
13. For every corpus file, a snapshot of the root keeps each untouched gap's adjacency, line breaks,
    blank lines and indentation.
14. A snapshot of a node with an edited descendant keeps the edit, and the edited node its geometry.
15. No offset is negative, and composing points from the root gives tree-sitter's position, through
    `$cst()`, for every corpus node.
16. A tree-backed node seated inside a built parent renders its source bytes.
17. `$cst()` equals tree-sitter's facts; snapshots and built nodes have none (a type test).
18. Validation rows are identical across the grammars.

## The parked branch

`feat/relative-spans` (parked 2026-09-30) is not rebased or merged. It stays as a reference until the
snapshot step lands, then is deleted.

| kept as design, rewritten | superseded |
| --- | --- |
| the point algebra (`points.rs`); relative points, now computed at snapshot; the closing gap's model side; ownership by token side; detached seams from geometry; `$cst()`'s API and tests; `$detach()`, now `$snapshot()` | tree-only handles and the anchor lookup; one handle mint site; a handle for every deep-read node; the prepare walk's frames and anchors; `$anchor` on transports; the wrap's flanks from relative spans; `$edited` marking |

Its two tool commits (a named corpus entry for `trace-rt`; parity-fixture coverage read from the model's member kinds) are
checked against master and, where still useful, landed on their own.
