# Spec 010 — Stricter `AnyNodeData` via Discriminated Shape

**Status**: Design proposal. Not landed.
**Origin**: PR #11 review finding #7 (type-design-analyzer).

---

## Problem

`AnyNodeData` in `@sittir/types` post-US7:

```ts
interface AnyNodeData {
    $type: string;                                           // required
    $source?: 'ts' | 'sg' | 'factory';                        // optional
    $variant?: string;                                        // factory-only
    $fields?: { readonly [key: string]: NodeFieldValue };    // branch-only
    $children?: readonly NodeChildValue[];                    // branch-only
    $text?: string;                                           // leaf-only
    $span?: { start: number; end: number };                  // ts-only
    $nodeId?: number;                                         // ts-only
    $named?: boolean;                                         // all producers
}
```

All non-`$type` fields are optional, so:
- `{ $type: 'foo' }` type-checks even though render guards throw at runtime.
- `$variant` on a `'ts'`-source node is representable but semantically invalid.
- `$fields` AND `$text` together are representable (branch-or-leaf — invalid).

The compiler cannot currently enforce the invariants that `render.ts` and
`readNode.ts` hand-guard.

## Proposal — Two-tier type

**Tier 1 — loose boundary type** (unchanged): `AnyNodeData` stays as-is, for
network-boundary / deserialization / renderer-entry consumers who genuinely
accept a wide structural shape.

**Tier 2 — producer-strict type**: export a discriminated union keyed on
`$source`:

```ts
export type ProducedNodeData =
  | FactoryBranchData
  | FactoryLeafData
  | TreeSitterBranchData
  | TreeSitterLeafData
  | AstGrepData;

interface FactoryBranchData {
    $type: string;
    $source: 'factory';                                     // required
    $named: true;                                           // required
    $variant?: string;
    $fields: { readonly [key: string]: NodeFieldValue };    // required on branch
    $children?: readonly NodeChildValue[];
}

interface FactoryLeafData {
    $type: string;
    $source: 'factory';
    $named: true;
    $text: string;                                           // required on leaf
}

interface TreeSitterBranchData {
    $type: string;
    $source: 'ts';
    $span: { start: number; end: number };                   // required on ts
    $nodeId: number;                                         // required on ts
    $named: boolean;
    $fields?: { readonly [key: string]: NodeFieldValue };
    $children?: readonly NodeChildValue[];
    $text?: string;
}

interface TreeSitterLeafData {
    $type: string;
    $source: 'ts';
    $span: { start: number; end: number };
    $nodeId: number;
    $named: boolean;
    $text: string;
}
```

Factory emitters return `FactoryBranchData | FactoryLeafData` per kind.
`readNode` returns `TreeSitterBranchData | TreeSitterLeafData`. External
consumers reading the wider boundary still get `AnyNodeData`.

## Benefits

- `$variant` on a `'ts'` node is a type error.
- `$span`/`$nodeId` MUST be set on readNode output (currently enforced by
  code review only).
- Generated factory output types get stronger guarantees — a factory can't
  accidentally emit a branch without `$fields`.
- `.from()` dispatch can narrow on `$source === 'factory'` at the type
  level, not just at runtime.

## Costs

- Every factory emitter's return type changes from a structural blend to
  the strict variant. Generated code gets tighter but the emitter change
  is substantial.
- `readNode.ts` return type changes.
- Validators + corpus tests that read `NodeData` need to use `AnyNodeData`
  or narrow through the discriminant.
- Public API breaking change for any external consumer on `AnyNodeData`.
  (None today, but US7's memory note said "no external consumers yet" —
  that was the green light for US7 and is still true.)

## Implementation sketch

1. `@sittir/types/core-types.ts`: add `ProducedNodeData` union + the four
   variants. Keep `AnyNodeData` as the loose boundary type.
2. Factory emitter: emit `FactoryBranchData` / `FactoryLeafData` in the
   factory's return type annotation.
3. readNode: change return type to `TreeSitterBranchData | TreeSitterLeafData`.
4. Validators: read `AnyNodeData` (unchanged structural contract).
5. Migration note for consumers: if you want the strict guarantees, narrow
   through `$source`.

## Open questions

- Do we need `'sg'` as a fourth tier (ast-grep consumers)? Currently implicit
  but no emitter produces it — safe to leave as a placeholder in the union.
- Should `AnyNodeData` be an alias for `ProducedNodeData | LegacyAnyNodeData`
  (where LegacyAnyNodeData is the current all-optional shape), or stay a
  distinct widening? The former forces consumers to think about provenance;
  the latter keeps the existing boundary.

## Recommendation

**Defer to a focused PR.** The change is mechanical but wide (every emitter
touches), and the review evidence is "types should express invariants" —
valuable but not urgent. Land on its own branch so regressions attribute
cleanly.
