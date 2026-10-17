# ADR 0017 — Node Handle Table + Child-Index Navigation (Replace $nodeId)

**Status**: Proposed
**Date**: 2026-05-02
**Related**: docs/superpowers/specs/2026-05-02-child-index-navigation-design.md

## Context

Every NodeData child stub carries `$nodeId` — tree-sitter's internal
node id (a raw pointer cast to `usize`) — for lazy drill-in. But
tree-sitter exposes no `nodeForId` API. The current drill-in path must
walk the tree to find the node, making `$nodeId` an O(n) lookup key
masquerading as an O(1) handle.

## Forcing Constraint

tree-sitter has no `nodeForId` API. The `TSNode.id` is a raw pointer
into internal storage with no public reconstruction path. Meanwhile,
`parent.child(i)` is O(1) and a stable public API — but drill-in
across the napi boundary requires the parent `TSNode`, which the
client side doesn't hold.

## Alternatives Considered

- **Byte-range navigation (`descendantForIndex(start, end)`)** —
  O(log n), standard API, uses `$span` already on stubs. Rejected:
  ambiguous when two nodes share the same span (wrapper + only child).

- **Raw pointer storage** — store `TSNode.id` (the `*const Subtree`
  pointer) and reconstruct the full `TSNode` at drill-in. Rejected:
  requires reaching into tree-sitter's internal `Subtree` struct to
  recompute the `context[4]` array. Fragile across versions.

- **Keep `$nodeId` + tree walk** — status quo. Rejected: O(n) per
  drill-in, no public API backing it.

## Decision

Two-part navigation: a node handle table for parent lookup, and child
index for the final hop.

**Node handle table:** The native engine handle gains a `Vec<TSNode>`,
initialized empty (zero allocation until first use). When `readNode`
visits a node, it pushes the `TSNode` (Copy, 40 bytes, no destructor)
into the vec and stores the index as `$nodeHandle: u32` on the
`NodeData`. This gives the native side O(1) access to the parent
`TSNode` when drill-in is requested.

**Child-index navigation:** Each child stub carries `$childIndex: u16`
— its position in the parent's child array. Drill-in:
`self.nodes[parentHandle].child(childIndex)` → child `TSNode` →
`readNode`. O(1) lookup + O(1) child access.

The vec is append-only, non-owning. `TSNode` contains raw pointers to
the tree's internal structures but has no destructor — it does not
extend the tree's lifetime. When the engine is GC'd, the tree and vec
drop together.

On the JS/WASM side: `SyntaxNode[]` on the `TreeHandle`, same indexing.
`parent.child(i)` is available via web-tree-sitter's public API.

**Wire shape:**
- `$nodeId: u64` → `$nodeHandle: u32` (parent's vec index)
- New: `$childIndex: u16` (position in parent's children)

## Principles Applied

- Prefer what tree-sitter guarantees — `child(i)` is stable public API.
- Same lifetime, no extension — vec is non-owning, lives on the same
  struct that owns the tree.
- One source — the child's position in the parent is the navigation
  identity; no second redundant source.

## Consequences

- **Enables**: O(1) drill-in end-to-end. Removes tree-walk navigation.
- **Costs**: ~40 bytes per visited node in a lazily-grown vec. A 500-node
  subtree costs 20KB.
- **Follow-ups**: Remove `NodeId` branded type. Remove `nodeById` from
  `TreeHandle`. Update wrap emitter (`$nodeHandle`/`$childIndex` instead
  of `$nodeId`).

## Verification

If the vec's memory cost becomes significant (thousands of large trees
held simultaneously), or if a use case requires node identity across
re-parses (vec is cleared), this decision needs revisiting.
