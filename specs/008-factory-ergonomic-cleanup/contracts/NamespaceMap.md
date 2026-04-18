# Contract: `NamespaceMap` and derived accessors

**Location**: `packages/<grammar>/src/types.ts` (generated)
**Visibility**: Public — consumed by generated factories, from.ts, wrap.ts, is.ts AND by consumer code.

## Signature

```ts
// Generated — one interface declaration per kind
export interface FunctionItemNs extends NodeNs<FunctionItem> {}
// ... ~160 of these in rust, ~180 in ts, ~150 in python

// The single source-of-truth map
export interface NamespaceMap {
    readonly 'function_item': FunctionItemNs;
    readonly 'block': BlockNs;
    // ... one entry per kind
}

// Derived accessors
export type ConfigFor<K extends keyof NamespaceMap> = NamespaceMap[K]['Config'];
export type FluentFor<K extends keyof NamespaceMap> = NamespaceMap[K]['Fluent'];
export type LooseFor<K extends keyof NamespaceMap> = NamespaceMap[K]['Loose'];
export type TreeFor<K extends keyof NamespaceMap> = NamespaceMap[K]['Tree'];

// Derived — not emitted as separate maps anymore
export type KindMap = { [K in keyof NamespaceMap]: NamespaceMap[K]['Node'] };
```

## Preconditions

- Each `<Kind>Ns` interface has a matching generated data interface `<Kind>` with a literal `type` discriminant.
- Kind-declaration order is stable (deterministic iteration from `NodeMap`).

## Postconditions

- `NamespaceMap['function_item']['Config']` === `FunctionItem.Config` === `ConfigFor<'function_item'>` (all three paths resolve to the same type — SC-010).
- `keyof NamespaceMap` is the union of all kind string literals present in the grammar.

## Invariants

- No kind appears in `NamespaceMap` without a matching `<Kind>Ns` interface.
- No `<Kind>Ns` interface exists without a matching `NamespaceMap` entry.
- `KindMap` is a derived type alias; no separate emission.
- `ConfigMap` and `LooseMap` from prior versions are NOT emitted. Deprecated re-exports (if any) point consumers at `KindMap[K]['Config']` style accesses.

## Failure modes

- Kind with no data interface (e.g., pure anonymous token) → NOT emitted in `<Kind>Ns` or `NamespaceMap`. Only kinds with factory/types emission appear.
- CamelCase collision between two snake_case kinds → codegen ERROR at emitter time (FR-017), before output is written.

## Consumer usage paths (contract)

1. **Namespace sugar**: `FunctionItem.Config` — preferred for specific-kind code.
2. **Generic accessor**: `ConfigFor<K>` for `K extends keyof NamespaceMap` — preferred for code parametric over kinds.
3. **Direct map access**: `NamespaceMap['function_item']['Config']` — preferred for programmatic type utilities.

All three MUST resolve to the same concrete type. This is the cornerstone of FR-015 and SC-010; verified by a type-level assertion in the generated test suite.

## Version contract

- Introduced: this spec (008).
- Addition of a member to `NodeNs` propagates automatically to every `<Kind>Ns` and hence `NamespaceMap[K][...]`.
- Removal of a kind from the grammar removes both `<Kind>Ns` and `NamespaceMap` entry; associated namespace sugar block also removed. No orphan declarations.
