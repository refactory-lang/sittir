# ADR 0017 — Child-Index Navigation (Replace $nodeId)

**Status**: Proposed
**Date**: 2026-05-02
**Related**: specs/022-binding-simplify-assemble/nodeId-index-refactor.md

## Context

Every NodeData child stub carries `$nodeId` — tree-sitter's internal
node id — for lazy drill-in. But tree-sitter exposes no
`tree.nodeForId(id)` API. The current drill-in path must walk the tree
to find the node, making `$nodeId` an O(n) lookup key masquerading as
an O(1) handle.

Meanwhile, tree-sitter provides two O(1) child access APIs that we
already have the inputs for:

- `parent.child(index)` — positional access
- `parent.childForFieldName(name)` — named field access

At drill-in time we always have the parent node (from the enclosing
readNode/wrap context) and the child's position. The global id is
never needed as a navigation key.

## Forcing Constraint

tree-sitter has no `nodeForId` API. The id is an internal pointer with
no public lookup path. Every drill-in today is a tree walk.

## Alternatives Considered

- **Global node table (Map/Array indexed by id)** — O(1) lookup but
  requires populating and holding references to every visited node for
  the handle's lifetime. Extra allocation proportional to tree size.
  Rejected: unnecessary when parent-relative navigation is O(1).

- **Byte-range navigation (`descendantForIndex(start, end)`)** —
  O(log n), standard API, uses `$span` already stored on stubs.
  Rejected: ambiguous when two nodes share the same span (wrapper +
  child). Requires post-navigation `$type` disambiguation. Slower than
  `child(i)`.

- **Keep `$nodeId` + tree walk** — status quo. Rejected: O(n) per
  drill-in, no public API backing it.

## Decision

Replace `$nodeId` with `$childIndex: number` on child stubs. Drill-in
navigates via `parentNode.child(childIndex)`. For named fields, the
field name is already known from the parent's schema, so
`parentNode.childForFieldName(name)` is available as a secondary path.

The `id` property from tree-sitter remains available at parse time and
can be stored for identity/dedup purposes (e.g. cycle detection during
recursive reads), but it is not used for navigation.

readNode populates `$childIndex` from the loop counter during child
iteration — zero extra cost.

## Principles Applied

- One source, one derivation (DRY) — the child's position in the
  parent is the single source of navigation identity; `$nodeId` was a
  second, redundant (and broken) source.
- Prefer what tree-sitter guarantees — `child(i)` is a stable public
  API; `nodeForId` doesn't exist.

## Consequences

- **Enables**: O(1) drill-in on both JS and Rust sides. Removes the
  tree-walk navigation path entirely.
- **Costs**: drill-in now requires the parent `SyntaxNode`, not just
  the tree. Callers that only have a `TreeHandle` + `$nodeId` need
  refactoring to carry parent context. wrap.ts lazy getters already
  have parent context (they close over the readNode call site).
- **Follow-ups**: Remove `nodeById` from `TreeHandle` interface.
  Update `@sittir/types` `NodeId` type (or remove it). Update native
  `tree.read(nodeId)` path to accept `(parentId, childIndex)` or
  equivalent.

## Verification

If drill-in latency increases after this change, or if any call site
needs global-id-based navigation that can't be refactored to carry
parent context, this decision was wrong. Signal: a new `nodeForId`
requirement appearing in the render or edit path.
