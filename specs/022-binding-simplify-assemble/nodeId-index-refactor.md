# NodeId → Index-Based Lookup Refactor

**Status:** Tracked (standalone, no 022 dependency)
**Date:** 2026-05-02

## Problem

`$nodeId` on NodeData stores tree-sitter's internal node id, but
tree-sitter has no `nodeById` API. Current drill-in must walk the tree
to find the node. The id is an opaque internal pointer with no public
lookup path.

## Proposed Design

Replace opaque `$nodeId` with an index into a per-handle node table.

**JS side:** `SyntaxNode[]` on the `TreeHandle`. readNode assigns each
child a monotonic index as it walks and pushes the `SyntaxNode` into
the array. Drill-in is `handle.nodes[index]` — O(1).

**Rust side:** `Vec<TSNode>` on the native handle. `TSNode` is Copy,
32 bytes. Same monotonic indexing.

**Wire shape:** `$nodeId: number` stays the same — semantics change
from "opaque tree-sitter id" to "index into handle's node table."

## Tradeoffs

- **O(1)** lookup vs current tree walk
- **No ambiguity** — direct reference, no same-span disambiguation
- **Memory:** proportional to visited nodes (bounded by tree size).
  Already allocating NodeData for each; the node table adds one
  reference per node.
- **Lifetime:** node table lives as long as the TreeHandle. Nodes
  are valid as long as the tree isn't re-parsed. Same lifetime
  semantics as today.

## Scope

Standalone refactor — touches readNode (JS + Rust), TreeHandle
interface, wrap.ts lazy getters. No dependency on 022's storage
model changes.
