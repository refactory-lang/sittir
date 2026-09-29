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

A node's coordinates are its offset from its parent. Only the root is placed
in a buffer: its coordinates start at 0 in the bytes it was read from.

### What a coordinate holds

- **Bytes:** `$span` `{ start, end }`, both relative to the parent's start
  byte.
- **Lines:** the start and end row, relative to the parent's start row, and
  the column of each. A column is only read next to a row change: it is where
  a line starts.
- **Parent** means the node whose bytes contain the child: the storage
  parent for a slot or `$other` child (a hoisted or inlined slot's children
  are stored on an ancestor, whose bytes contain them), and the owner's parent
  for trivia. Tree-sitter makes extras siblings of their owner, so trivia is
  measured from the same base as the node it is attached to.
- **Offsets are never negative.** Every child lies inside its parent's bytes
  and the root starts at 0, so `Span` stays two `u32`s.

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
  - adjacency: a gap of width 0 is tight;
  - a line break: the two neighbours' rows differ;
  - blank lines: the row difference beyond one;
  - indentation: the column where the next line starts.
  What geometry cannot give (comment text, the spelling of whitespace) falls
  to options and defaults.

### No stamped coordinate facts

Every fact coordinates can give is derived, never stamped:

- `$sameLine` is gone: it is a row comparison between two coordinates, for
  source-backed and detached nodes alike.
- `$tokensBetween` is gone: a source-backed node reads the gap bytes, and a
  detached node has no tokens to report.
- Anonymous tokens are not stored for gaps: two siblings' own coordinates
  bound the gap between them.

### Detaching

- **When:** a node detaches when its source goes away (its tree is freed) or
  on an explicit `$detach()`. Seating an untouched node into another tree is
  not a detach: it stays source-backed through its handle while its source
  tree lives.
- **What changes:** the handle is dropped, and each leaf's text becomes data,
  since text is content and can no longer come from bytes. Coordinates are
  kept unchanged; being relative, they need no rebasing.
- **Edits are unchanged:** an edited node drops its coordinates and renders
  from its data. A gap next to an edited sibling is left to the options and
  defaults, as today.

### Serialized source-backed data

Data that travels with its source (a parity fixture) is not detached. It
carries its buffer, and its root carries a buffer-backed id in place of a
tree handle, so it renders exactly as the parsed tree does, root edges
included.

### Absolute positions

Nothing in sittir holds an absolute position. Tree-sitter knows each live
node's byte range, so a tree-bound node's absolute position is read through
its handle; for an editor, a diagnostic or a range edit it can also be summed
from its ancestors' starts. A detached or serialized node has none.

### The native side

- **The wire and `NodeData` carry relative coordinates.** `read_node` emits
  each stored child's byte and row offsets from its parent, and its columns,
  with the root at 0 after `widen_to_whole_source`.
- **The renderer slices relatively.** The prepare walk is top-down, so it
  holds each parent's bytes when it reaches a child. A child's bytes are
  `parent_bytes[start..end]`, and the gap between two siblings is
  `parent_bytes[a.end..b.start]`. `NodeCoordinate` carries a relative span,
  and resolution composes down the walk instead of indexing a whole source.
- **Anchors find their own bytes.** Only the node that starts a slicing chain
  resolves on its own:
  - the render root, from its tree's source or its buffer;
  - a subtree seated into another tree, through its handle: tree-sitter's
    node gives the byte range to slice from its tree's source;
  - a serialized root, through its buffer-backed id.
- **Detached gaps** are classified from geometry by the same classifier
  entry, with the gap's width, row difference and column in place of its
  bytes.

## Census of coordinate consumers

Each moves to relative coordinates or to the derived absolute position.

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
  start is 0" and "the element's end is the container's length".
- **Tools:** the validators (`read-render-parse`, `factory-render-parse`,
  `from`, `common`), trivia placement, `probe kind`'s span search, and
  `exercise/roundtrip`. `selfContainedRenderInput` becomes the serialized
  source-backed form: it keeps coordinates and the buffer and copies nothing.
- **Stamps removed:** `$sameLine` and `$tokensBetween` on trivia entries, and
  the self-contained `$text` copies.

## Open decisions

1. **The public name** for a tree-bound node's absolute position.
2. **The key** for a serialized node's buffer and its buffer-backed id.
   `$source` is taken (it is the node's provenance).
3. **The key** for the line part of a coordinate: extend `$span` with rows
   and columns, or a sibling key.

## Verification

- **Parity fixtures** carry relative coordinates and the buffer, and render
  the same as the parsed tree. rust's left-out fixtures return to their
  pre-root-edge count: the two sources starting with a line break render
  again.
- **Detached layout:** for every corpus file, detaching the root and
  rendering keeps each untouched gap's adjacency, line breaks, blank lines
  and indentation.
- **Seating across trees:** an untouched node seated into another tree
  renders its original bytes while its source tree lives; once that tree is
  freed, it renders as detached.
- **Validate rows** are identical across the three grammars.
- **No coordinate stamp remains:** `$sameLine` and `$tokensBetween` are gone
  from the wire.
