# ADR-0017: Child-Index Navigation — Design Spec

**Date:** 2026-05-02
**Status:** Proposed
**ADR:** docs/adr/0017-child-index-navigation.md

## Goal

Replace the current `$nodeId` (tree-sitter internal pointer with no
public lookup API, O(n) tree walk) with O(1) handle-table + child-index
navigation for lazy drill-in. Independent of spec 022.

## Architecture

### Two-part navigation

1. **Node handle table** — `Vec<TSNode>` on the native engine, gives
   O(1) access to a parent `TSNode` by index.
2. **Child index** — `$childIndex: u16` on each child stub, used with
   `parent.child(i)` for the final hop.

Drill-in: `nodes[parentHandle].child(childIndex)` → child `TSNode` →
`readNode` from that child. O(1) + O(1).

### Storage: `Vec<TSNode>` on the native engine handle

The native engine struct gains a `nodes: Vec<TSNode>` field, initialized
empty (`Vec::new()` — zero allocation until first use).

When `readNode` visits a node (root read or drill-in), it pushes the
`TSNode` (Copy, 40 bytes) into the vec and records the index. The
`NodeData` carries `$nodeHandle: u32` — the push index.

The vec is append-only. No borrowing, no cleanup of individual entries.
`TSNode` is Copy with no destructor — the values contain raw pointers to
the tree's internal structures but do not own them. They do not extend
the tree's lifetime or prevent GC.

### Drill-in flow

**Today:**
```
wrap getter → drillIn(entry, tree)
  → tree.read(entry.$nodeId)
    → native: walk tree to find node by pointer id (O(n))
    → readNode from found node
```

**New:**
```
wrap getter → drillIn(entry, tree)
  → tree.read(entry.$nodeHandle, entry.$childIndex)
    → native: nodes[handle].child(childIndex) (O(1))
    → readNode from child node
    → push child TSNode into vec, return new handle
```

The `readNode` call on the drilled-into node pushes ITS children into
the same vec, returning new handles. The vec grows as you drill deeper —
each level adds only the children you visit.

### Lifetime

The vec lives on the same engine struct that owns the `TSTree`. Both are
dropped together when the JS `TreeHandle` is garbage collected via
napi-rs `Drop`. No new lifetime coupling introduced.

`TSNode` values contain raw pointers (`*const TSTree`,
`*const Subtree`) but these are non-owning — no destructor, no prevent-
drop effect. When the tree is dropped, the pointers dangle but the vec
is dropped in the same `Drop` impl. No UB path.

On re-parse (new tree), the engine clears the vec. Stale handles from
the old tree become invalid — same as today.

### JS/WASM side

Same pattern: `SyntaxNode[]` on the TreeHandle, starts empty. web-tree-
sitter's `SyntaxNode` objects are already allocated by the bindings;
we just hold references. `parent.child(i)` is O(1) in web-tree-sitter.

### Wire shape

| Field | Before | After |
|-------|--------|-------|
| Handle | `$nodeId: u64` (branded `NodeId`) | `$nodeHandle: u32` |
| Child pos | *(none)* | `$childIndex: u16` |
| Lookup | O(n) tree walk | O(1) vec + O(1) child |
| Per-node wire | 8 bytes | 6 bytes |

### Type changes

- `NodeId` branded type in `@sittir/types` → removed
- `AnyNodeData.$nodeId?: NodeId` → `$nodeHandle?: number` +
  `$childIndex?: number`
- `TreeHandle.nodeById(id: NodeId)` → removed
- `TreeHandle.read(handle?: number, childIndex?: number)` → updated
  signature
- Rust `NodeData.node_id: Option<u64>` → `node_handle: Option<u32>` +
  `child_index: Option<u16>`

### Wrap layer

`drillIn` passes both handle and child index:

```typescript
function drillIn(entry: unknown, tree: TreeHandle): unknown {
  const e = entry as _NodeData;
  if (e.$nodeHandle != null && e.$childIndex != null)
    return readTreeNode(tree, e.$nodeHandle, e.$childIndex);
  return entry;
}
```

### Surfaces to change

1. **Rust engine handle** — add `nodes: Vec<TSNode>` field
2. **Rust `readNode`** — push `TSNode` into vec, set `node_handle` +
   `child_index` on child stubs
3. **Rust `read` napi method** — accept `(handle, childIndex)`, lookup
   via `nodes[handle].child(childIndex)`
4. **`@sittir/types`** — `$nodeHandle` + `$childIndex` replace
   `$nodeId`, remove `NodeId` type
5. **JS `readNode`** — push `SyntaxNode` into handle array, set
   `$nodeHandle` + `$childIndex` on child stubs
6. **JS `TreeHandle`** — `SyntaxNode[]` field, remove `nodeById` method,
   update `read` signature
7. **wrap.ts emitter** — `drillIn`/`drillAs` reference both fields
8. **native-boundary.ts** — validation checks new fields
9. **Tests** — update mock handles and assertions

### Memory safety verification

The implementation MUST include a test that verifies no inadvertent
memory leaks on the JS side:

1. Parse a file, wrap the root, access a few fields (trigger drill-in)
2. Release all references to wrapped nodes
3. Force GC (`--expose-gc` + `global.gc()`)
4. Verify the engine/tree/vec are collected (weak ref check or
   `process.memoryUsage()` delta)

The vec + handle approach must be **equal or better** in memory profile
compared to the current `$nodeId` approach. If holding a `SyntaxNode[]`
on the JS side prevents GC of nodes that tree-sitter would otherwise
release, the design is wrong.

### What doesn't change

- Wrap closure structure (still closes over `tree`)
- Lazy drill-in semantics (still on-demand)
- Factory-built nodes (no handle — `$nodeHandle` absent)
- Render path (doesn't use node handles)
- Template engine (doesn't touch node handles)
