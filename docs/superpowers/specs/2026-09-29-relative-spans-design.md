# Relative coordinates

## Problem

A node's coordinates are absolute byte offsets into its tree's source, so they
only mean something while that tree is at hand.

- **Self-contained data loses them.** Data made self-contained (a parity
  fixture, a node outlived by its tree) drops `$nodeHandle`, `$span` and
  `$childIndex`. Every fact the render derives from coordinates then has to
  be copied into the data first: `$text`, `$sameLine`, `$tokensBetween`. Each
  new coordinate fact needs its own copy, and the one that was missed, the
  root's leading and trailing bytes, makes a self-contained file render
  differently from the parsed one.
- **Two derivations of each fact.** A tree-bound render derives these facts
  from coordinates, and a self-contained render reads the copies. The two
  can disagree.

## Design

A node's coordinates are its offset from its parent. The root starts at
(0, 0).

This is tree-sitter's own `Length` algebra (a subtree stores its padding and
size, never its position), measured from the parent's start instead of
chained from the previous sibling, so any child is placed from its parent
alone.

### What a coordinate holds

- **`$span` is two points:** `{ start: { row, column }, end: { row, column } }`,
  both relative to the parent's start point. A column counts bytes within its
  line, as tree-sitter's does.
- **The column rule:** a point with row offset 0 is on the parent's start row,
  and its column is added to the parent's column. A point with a row offset
  above 0 is on a later line, and its column is measured from that line's
  start. This is tree-sitter's `length_add`.
- **No byte offsets are stored.** Bytes are derived where a source exists (see
  [the native side](#the-native-side)); a detached node needs only rows and
  columns.
- **Parent** means the tree-sitter parent, which is where the reader stores
  every child. A layer that moves a child onto an ancestor (hoisting,
  flattening) composes the intermediate node's offset into the child's, by
  the column rule. Trivia is measured from its owner's parent: tree-sitter
  makes extras siblings of their owner, so an extra's own parent is that same
  node.
- **Offsets are never negative.** Every child lies inside its parent's bytes
  and the root starts at (0, 0), so each field is a `u32`.

### Source-backed and detached nodes

A node is **source-backed** while its bytes can be recovered from its
coordinates, and **detached** once they cannot.

- **Source-backed:** a tree-bound node, or a node seated into another tree
  while its own source tree lives. Its untouched parts render as sliced
  bytes: text, the gaps between untouched siblings (punctuation, whitespace
  and comments together), and a root's leading and trailing bytes.
- **Detached:** its coordinates remain, but nothing resolves them to bytes.
  It renders from its data, like an edited node, with one difference: the
  seams between its untouched children come from their gap geometry.
  - adjacency: the two points are equal;
  - a line break: the two neighbours' rows differ;
  - blank lines: the row difference beyond one;
  - indentation: the next neighbour's start column, when its row differs.
  Comments keep their text, since trivia are nodes and their leaf text is
  data. What geometry cannot give, the spelling of whitespace (tabs, trailing
  spaces, line endings), falls to options and defaults.

### No stamped coordinate facts

Every fact coordinates can give is derived, never stamped:

- `$sameLine` is gone: it is a row comparison between two coordinates, for
  source-backed and detached nodes alike.
- `$tokensBetween` is gone: which side of a token a comment sits on is
  carried by its owner (see [trivia ownership](#trivia-ownership)).
- Anonymous tokens are not stored for gaps: two siblings' own coordinates
  bound the gap between them.

### Trivia ownership

A comment's owner decides which side of the surrounding tokens it renders
on, so no count of tokens is recorded. The reader assigns each extra while
tree-sitter is at hand:

- **Trailing the previous sibling** when no token lies between that sibling
  and the extra: `a /* x */, b` trails `a`, and renders before the
  template's `,`.
- **Leading the next sibling** when a token lies between: `a, /* x */ b` and
  `a, // x⏎ b` lead `b`, and render after the `,`. Rows then give the
  line break, as for any leading entry.
- **The parent's closing gap** when a token lies between and no next sibling
  exists: `[a, b, // c⏎]` is inner trivia of the list, after its last
  element's tokens and before its closer.

A **closing gap** is an inner gap every compound gets when its render rule
ends in an unconditional token after its last slot. It is derived from the
render rule by the same walk as the existing inner gaps, never declared.
A compound with no closing token has none: an extra after its last token lies
outside its bytes, and tree-sitter gives it to an ancestor, where the same
rules apply.

### Detaching

- **When:** a node detaches when its source goes away (its tree is freed) or
  on an explicit `$detach()`. Seating an untouched node into another tree is
  not a detach: it stays source-backed through its handle while its source
  tree lives.
- **What changes:** the handle is dropped, and each leaf's text becomes data,
  since text is content and can no longer come from bytes. Coordinates are
  kept unchanged; being relative, they need no rebasing.
- **Edits:** an edit marks the node `$edited`: it renders from its data and
  never folds to a coordinate or slices. It keeps its handle and span as the
  record of where it was read, so its trivia keeps its rows (a same-line
  trailing comment stays on the line) and the walk can still place it. A
  gap next to an edited sibling is left to the options and defaults, as
  today.

### Serialized data

Serialized data (a parity fixture) is detached: it carries its coordinates
and leaf text, never a source buffer. The root's edges come from geometry
like any other gap: its first child's start row gives the leading line
breaks, and its last child's end against the root's end gives the trailing
ones. A consumer that needs exact bytes keeps the source text and re-parses
it, so byte fidelity has one mechanism: the tree handle.

### Absolute positions

No node carries an absolute position, and none is derived by sittir.
Rendering and editing need only relative coordinates. Tree-sitter owns
positions, so a tree-bound node exposes them from tree-sitter directly:

- **`$cst()`**, on tree-bound nodes only (like `$commit`), returns tree-sitter's
  facts for the node it was read from: its kind, byte range, start and end
  row and column, and text. The tree lives on the native side, so these are
  fetched through the node's handle when asked, not held as a live
  tree-sitter object.
- A detached node, serialized data included, has no `$cst()`.
- sittir's own diagnostics read a location the same way when a node is
  tree-bound.

### The native side

- **The wire and `NodeData` carry relative points.** `read_node` emits each
  stored child's start and end point relative to its parent's start point,
  with the root at (0, 0) after `widen_to_whole_source`.
- **Transports carry their points.** A node that renders from its data
  crosses with its `$span`, and with `$anchor` (its handle and child index)
  when it has a handle, edited or not.
- **The prepare walk threads a frame from the render root.** A frame is a
  parent's position and the tree it is in. The walk is top-down, so it holds
  the frame when it reaches a child, and a child's position is the frame's
  plus its offset, by the column rule; nothing stores it. A transport with an
  `$anchor` places itself through it (below); one without passes the frame
  on through its `$span`; a factory-built one, with neither, leaves the frame
  below it unknown. A transport's trivia is placed with the frame it
  received, since trivia is measured from the owner's parent.
- **Bytes come from the anchor's line-start table.** An anchor's source gets
  one table of line-start byte offsets, built once and shared for the render.
  A position `(row, column)` is byte `line_start[row] + column`, so a child's
  bytes and the gap between two siblings are slices of the anchor's source.
  `NodeCoordinate` carries a relative span; resolution composes down the walk
  instead of indexing a whole source by stored bytes.
- **A coordinate the frame cannot place anchors itself.** When the frame is
  unknown or from another tree, tree-sitter gives the point the coordinate's
  offsets are measured from, through its handle:
  - a stub carries its parent's handle and its child index, so its base is
    the start of the handle's node;
  - any other coordinate's handle names a node whose parent is its base: its
    own node for a read root or an expanded stub, and its owner for a trivia
    entry, whose parent is the trivia's parent too.
  The render root's frame is (0, 0) in its own tree. A deep read's
  descendants carry a tree-only handle (a reserved index), which names no
  node: they are placed by their root's frame, and the render refuses one
  outside it rather than anchoring it.
- **Detached gaps** are classified from geometry by the same classifier
  entry, with the gap's two points in place of its bytes.

## Census of coordinate consumers

Each moves to relative points, or to `$cst()` where it needs a tree-sitter
position.

- **Rust:** `read_node` (`read_ts_node`, `read_child_stub`,
  `read_materialized_leaf`, `node_trivia`, `extras_run`,
  `widen_to_whole_source`), the wire (`types.rs` serialize and deserialize,
  `slot.rs` `from_napi_value`), the prepare walk that builds
  `NodeCoordinate`s, and the gap classifier.
- **`@sittir/common`:** `transport-data.ts` (the coordinate fold,
  `asCoordinate`, `markEdited`, `projectValue`), `readNode.ts`,
  `native-boundary.ts`, `span.ts` slicing, and the coordinate types on node
  data.
- **Generated wrap:** `_hasSeparatorFlank` compares a container's span with
  its first and last element's. Relative spans make that "the element's
  start is (0, 0)" and "the element's end is the container's end".
- **Tools:** the validators (`read-render-parse`, `factory-render-parse`,
  `from`, `common`), trivia placement, `probe kind`'s span search, and
  `exercise/roundtrip`. `selfContainedRenderInput` becomes a detach: it keeps
  coordinates and leaf text and copies nothing else.
- **Stamps removed:** `$sameLine` and `$tokensBetween` on trivia entries, and
  the self-contained `$text` copies.
- **Handles:** a trivia entry carries its owner's handle instead of its
  tree's, when the owner has one.
- **Trivia ownership:** `node_trivia` and `extras_run` (owner assignment),
  `TransportTrivia::render_trailing` (no held entries), and the node map's
  `innerGaps` with the `inner_gap_key` and `INNER_GAPS` rows it feeds (the
  closing gap).

## Verification

- **Parity fixtures** are detached data and render with the parsed tree's
  layout, root edges included. rust's left-out fixtures return to their
  pre-root-edge count: the two sources starting with a line break render
  again. A check that needs exact bytes re-parses the fixture's source.
- **Detached layout:** for every corpus file, detaching the root and
  rendering keeps each untouched gap's adjacency, line breaks, blank lines
  and indentation.
- **Seating across trees:** an untouched node seated into another tree
  renders its original bytes while its source tree lives; once that tree is
  freed, it renders as detached.
- **Edited parents:** editing a node that has untouched multi-line children
  keeps those children's bytes and indentation.
- **Mixed trees:** a node from tree B seated inside an untouched subtree of
  tree A, itself seated into tree B, renders both its own and the subtree's
  original bytes.
- **Line-start resolution:** for every corpus file, each node's position
  threaded from the root equals tree-sitter's start point and byte through
  `$cst()`.
- **Validate rows** are identical across the three grammars.
- **No coordinate stamp remains:** `$sameLine` and `$tokensBetween` are gone
  from the wire.
- **Comments beside tokens:** detached renders of `f(a /* x */, b)`,
  `f(a, /* x */ b)`, `f(a, // x⏎ b)`, `a + /* x */ b` and `[a, b, // c⏎]`
  keep each comment on its side of the token.
