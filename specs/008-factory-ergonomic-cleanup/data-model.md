# Data Model — Factory & Ergonomic Surface Cleanup

**Phase**: 1
**Scope**: Type-level entities — this feature has no runtime persistence. All "models" below are TypeScript types and the small runtime predicates/helpers they reference.

---

## Entity 1: `NodeNs<T>` (hand-written, in `@sittir/types`)

**Purpose**: Computed base interface that derives the full type family for a data interface `T`. One declaration covers all five per-kind types.

**Shape:**

```ts
export interface NodeNs<T extends { readonly type: string }> {
    readonly Node: T;
    readonly Config: ConfigOf<T>;
    readonly Fluent: FluentNodeOf<T>;
    readonly Loose: FromInputOf<T, LeafScalarMap, LeafStringMap>;
    readonly Tree: TreeNodeOf<T>;
    readonly Kind: T extends { readonly type: infer K } ? K : never;
}
```

**Depends on**: `ConfigOf<T>`, `FluentNodeOf<T>`, `FromInputOf<T, ...>`, `TreeNodeOf<T>` (all existing in `@sittir/types`), `LeafScalarMap` / `LeafStringMap` (existing per-grammar generated types — injected at the call site via `NamespaceMap` extension, not here).

**Lifecycle**: Stable. Hand-written; changes to `NodeNs` require a coordinated update across all emitters that reference `NamespaceMap[K]['...']`.

**Invariants:**

- `NodeNs<T>['Kind']` is always the literal `T['type']`.
- `NodeNs<T>['Node']` is `T` itself (identity).
- `Config`, `Fluent`, `Loose`, `Tree` are all computed from `T` via type transforms that exist today.

---

## Entity 2: Per-kind namespace interface (generated, in `packages/<grammar>/src/types.ts`)

**Purpose**: Bind `NodeNs<T>` to a concrete data interface — one one-line declaration per kind.

**Shape:**

```ts
export interface FunctionItemNs extends NodeNs<FunctionItem> {}
export interface BlockNs extends NodeNs<Block> {}
export interface IdentifierNs extends NodeNs<Identifier> {}
// ... one per kind
```

**Emitted by**: `emitters/types.ts` (modified — see FR-001).

**Invariants:**

- Every kind with a generated data interface has a `<Kind>Ns` companion.
- `<Kind>Ns` has no body — it's `extends NodeNs<Kind>` only. TypeScript resolves the members once at declaration.

---

## Entity 3: `NamespaceMap` (generated, in `packages/<grammar>/src/types.ts`)

**Purpose**: Single source of truth mapping kind strings to per-kind namespaces. Replaces `KindMap`, `ConfigMap`, `LooseMap`.

**Shape:**

```ts
export interface NamespaceMap {
    readonly 'function_item': FunctionItemNs;
    readonly 'block': BlockNs;
    readonly 'identifier': IdentifierNs;
    // ... one per kind
}
```

**Derived types:**

```ts
export type ConfigFor<K extends keyof NamespaceMap> = NamespaceMap[K]['Config'];
export type FluentFor<K extends keyof NamespaceMap> = NamespaceMap[K]['Fluent'];
export type LooseFor<K extends keyof NamespaceMap> = NamespaceMap[K]['Loose'];
export type TreeFor<K extends keyof NamespaceMap> = NamespaceMap[K]['Tree'];

export type KindMap = { [K in keyof NamespaceMap]: NamespaceMap[K]['Node'] };
```

**Emitted by**: `emitters/types.ts` (modified).

**Invariants:**

- Iteration order is kind-declaration order from `NodeMap` (deterministic, per Principle VI).
- No kind appears in `NamespaceMap` without a corresponding `<Kind>Ns` interface declaration.

---

## Entity 4: Namespace sugar block (generated, in `packages/<grammar>/src/types.ts`)

**Purpose**: Declaration-merged namespace alongside each data interface. Lets consumers write `FunctionItem.Config` naturally.

**Shape:**

```ts
// Data interface (existing)
export interface FunctionItem { readonly type: 'function_item'; readonly fields: { ... } }

// Namespace sugar (new — declaration merges with the interface above)
export namespace FunctionItem {
    export type Config = ConfigFor<'function_item'>;
    export type Fluent = FluentFor<'function_item'>;
    export type Loose = LooseFor<'function_item'>;
    export type Tree = TreeFor<'function_item'>;
    export type Kind = 'function_item';
}
```

**Emitted by**: `emitters/types.ts` (modified).

**Invariants:**

- Every kind with a generated data interface has a matching namespace block.
- Namespace members resolve to `NamespaceMap[K]['...']` — same type as `ConfigFor<K>` etc.

---

## Entity 5: `is` namespace (generated, in `packages/<grammar>/src/is.ts`)

**Purpose**: Runtime object with per-kind, supertype, and generic kind guards. Narrows the `type` discriminant.

**Shape (type):**

```ts
export type IsGuards = {
    // Per-kind entries — camelCase keys
    [K in keyof NamespaceMap as CamelCase<K & string>]:
        <T extends { readonly type: string }>(v: T)
            => v is T & { readonly type: NamespaceMap[K]['Kind'] & string };
} & {
    // Generic inverse
    kind<K extends keyof NamespaceMap>(
        v: { readonly type: string }, kind: K,
    ): v is { readonly type: NamespaceMap[K]['Kind'] & string };

    // Supertype entries (one per supertype declared in the grammar)
    expression: (v: { readonly type: string }) => v is Expression;
    pattern:    (v: { readonly type: string }) => v is Pattern;
    type:       (v: { readonly type: string }) => v is _Type;
    statement:  (v: { readonly type: string }) => v is Statement;
};
```

**Shape (runtime):**

```ts
export const is = {
    ...Object.fromEntries(
        Object.keys(_kindMap).map(k => [
            k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()),
            (v: { type: string }) => v.type === k,
        ]),
    ),
    kind: (v: { type: string }, k: string) => v.type === k,
    expression: ((ks) => (v: { type: string }) => ks.has(v.type))(new Set([/* concrete kinds */])),
    // ... one per supertype
} as unknown as IsGuards;
```

**Emitted by**: `emitters/is.ts` (new — see FR-008).

**Invariants:**

- Runtime is O(kinds + supertypes) at module load. O(1) per guard call.
- Adding a new kind to `NamespaceMap` produces a working `is.newKind()` automatically (no separate hand-authored entry).
- CamelCase collisions across snake-case kinds are detected at codegen time (FR-017) and rejected.

---

## Entity 6: Shape guards `isTree` / `isNode` (generated, in `packages/<grammar>/src/is.ts`)

**Purpose**: Structural shape discriminators with overloaded signatures. Compose with `is.*` for kind × shape narrowing.

**Shape:**

```ts
export function isTree<T extends { readonly type: K }, K extends keyof NamespaceMap & string>(
    v: T,
): v is T & NamespaceMap[K]['Tree'];
export function isTree(v: { readonly type: string }): v is AnyTreeNode;
export function isTree(v: { readonly type: string }): boolean {
    return typeof (v as { range?: unknown }).range === 'function';
}

export function isNode<T extends { readonly type: K }, K extends keyof NamespaceMap & string>(
    v: T,
): v is T & NamespaceMap[K]['Node'];
export function isNode(v: { readonly type: string }): v is AnyNodeData;
export function isNode(v: { readonly type: string }): boolean {
    const o = v as { fields?: unknown; text?: unknown };
    return typeof o.fields === 'object' || typeof o.text === 'string';
}
```

**Emitted by**: `emitters/is.ts` (same file as `is` namespace).

**Invariants:**

- Exactly one function per grammar per shape — overloaded signatures do the per-kind resolution via `NamespaceMap`.
- The runtime predicate is shape-based (structural), not kind-based. It never reads `v.type`.

---

## Entity 7: `assert` namespace (generated, in `packages/<grammar>/src/is.ts`)

**Purpose**: Mirror of `is` with assertion-function signatures. Throws `TypeError` on mismatch.

**Shape (type):**

```ts
export type AssertGuards = {
    [K in keyof NamespaceMap as CamelCase<K & string>]:
        (v: { readonly type: string })
            => asserts v is { readonly type: NamespaceMap[K]['Kind'] & string };

    kind<K extends keyof NamespaceMap>(
        v: { readonly type: string }, kind: K,
    ): asserts v is { readonly type: NamespaceMap[K]['Kind'] & string };
} & {
    expression: (v: { readonly type: string }) => asserts v is Expression;
    // ... one per supertype
};
```

**Shape (runtime):** Wraps `is` guards — no duplicate kind-check logic.

```ts
export const assert = Object.fromEntries(
    Object.entries(is).map(([k, guard]) => [
        k,
        (v: { type: string }, ...rest: unknown[]) => {
            if (!(guard as (v: unknown, ...rest: unknown[]) => boolean)(v, ...rest)) {
                throw new TypeError(
                    `assert.${k}: expected type '${k}', got '${(v as { type: string }).type}'`,
                );
            }
        },
    ]),
) as unknown as AssertGuards;
```

**Emitted by**: `emitters/is.ts`.

**Invariants:**

- `assert.*` reuses `is.*` runtime via closure — no duplicate kind-string literals.
- Error message format is stable across kinds and supertypes (see R-011 open questions).

---

## Entity 8: `isNodeData` predicate (hand-written, in `@sittir/core`)

**Purpose**: Structural guard. Returns true when input has the shape of a NodeData (has `type: string` and optionally `fields`/`children`/`text`).

**Shape:**

```ts
export function isNodeData(v: unknown): v is AnyNodeData {
    return (
        typeof v === 'object'
        && v !== null
        && typeof (v as { type?: unknown }).type === 'string'
        && (
            (v as { fields?: unknown }).fields !== undefined
            || (v as { children?: unknown }).children !== undefined
            || (v as { text?: unknown }).text !== undefined
        )
    );
}
```

**Lifecycle**: Stable. Exported from `@sittir/core` index. All generated `from.ts` files import this one predicate — no per-grammar copies.

**Invariants:**

- Returns `false` for plain loose bags (camelCase properties without `type`).
- Returns `true` for factory outputs, wrap outputs, and bare readNode outputs (all have `type` + `fields`/`children`/`text`).

---

## Entity 9: `.from()` resolver (generated, in `packages/<grammar>/src/from.ts`)

**Purpose**: Loose-bag-to-fluent translator. One resolver per non-leaf kind.

**Shape:**

```ts
export function functionItemFrom(
    input: T.FunctionItem | T.FunctionItem.Loose,
): T.FunctionItem.Fluent {
    if (isNodeData(input)) return input as T.FunctionItem.Fluent;

    return F.functionItem({
        visibilityModifier: _resolveOneBranch<T.VisibilityModifier>(input.visibilityModifier, "visibility_modifier"),
        name:               _resolveOne<T.Identifier | T.Metavariable>(input.name, _K11, _K0),
        body:               _resolveOneBranch<T.Block>(input.body, "block"),
        // ... every field single-access from input.camelCase
    });
}
```

**Emitted by**: `emitters/from.ts` (modified).

**State machine:**

```
input → isNodeData? ─ yes → return input (identity)
                     │
                     no → read each field as input.<camelCase>
                         → pass through _resolveOne / _resolveOneBranch / _resolveMany
                         → construct via F.<kind>({...})
                         → return the factory output
```

**Invariants:**

- `isNodeData(input) === true` ⇒ the returned value IS `input` (same JS reference, verifiable via `===`).
- The bag branch never reads `input.fields?.[...]` — only `input.<camelCase>`.
- Every generic type parameter in `_resolveOne*` is a concrete union (e.g. `T.Identifier | T.Metavariable`), never a computed Config path.
- Return type is `T.<Kind>.Fluent`, never `ReturnType<typeof <kind>>`.

---

## Entity 10: Grouped `ir` sub-namespace (generated, in `packages/<grammar>/src/ir.ts`)

**Purpose**: Supertype-scoped object alongside the flat `ir.*` namespace. Keys are stripped-suffix kind names with reserved-word `_` suffix.

**Shape:**

```ts
// Flat namespace (existing, preserved)
export const ir = {
    functionItem: Object.assign(F.functionItem, { from: FR.functionItemFrom }),
    binaryExpression: Object.assign(F.binaryExpression, { from: FR.binaryExpressionFrom }),
    // ...
} as const;

// Supertype-grouped sub-namespaces (new)
export const expr = {
    binary: Object.assign(F.binaryExpression, { from: FR.binaryExpressionFrom }),
    call:   Object.assign(F.callExpression,   { from: FR.callExpressionFrom }),
    if_:    Object.assign(F.ifExpression,     { from: FR.ifExpressionFrom }),
    // ...
} as const;

export const decl = {
    function_: Object.assign(F.functionItem, { from: FR.functionItemFrom }),
    struct_:   Object.assign(F.structItem,   { from: FR.structItemFrom }),
    // ...
} as const;
```

**Emitted by**: `emitters/ir.ts` (modified).

**Invariants:**

- Each grouped entry points to the same `Object.assign(...)` bundle as the matching flat entry. Structural equality of output is guaranteed (SC-012).
- Keys are derived from kind names by stripping the supertype suffix (e.g. `function_item` under `decl` → `function`) then appending `_` for JS reserved words.
- Sub-namespace existence is additive — removing a sub-namespace's kind from `NamespaceMap` removes both the flat and grouped entry, not just one.

---

## Relationships

```text
@sittir/types::NodeNs<T>
    │
    │ extends
    ▼
packages/<g>/src/types.ts::<Kind>Ns
    │
    │ member of
    ▼
packages/<g>/src/types.ts::NamespaceMap
    │
    │ indexed by
    ▼
packages/<g>/src/types.ts::{ConfigFor, FluentFor, LooseFor, TreeFor}
        │
        │ aliased as
        ▼
packages/<g>/src/types.ts::namespace <Kind> { Config, Fluent, Loose, Tree, Kind }

@sittir/core::isNodeData
    │
    │ imported by
    ▼
packages/<g>/src/from.ts (every resolver's first line)

@sittir/core::AnyNodeData
    │
    │ consumed by
    ▼
packages/<g>/src/is.ts::{is, isTree, isNode, assert} (shape guards' fallback overload)

packages/<g>/src/types.ts::NamespaceMap
    │
    │ consumed by
    ▼
packages/<g>/src/is.ts::{is, isTree, isNode, assert} (kind-narrowed overloads)
```

---

## Validation rules (from requirements)

**From FR-016** (adding a new kind is O(1) hand-edits):

- A new entry in grammar → `NodeNs<NewKind>` wired via generated `<Kind>Ns` + new `NamespaceMap` entry + namespace sugar block.
- No separate hand-authored work. All guards, `.from()` resolver, factory, wrap function derive from these three generated entries.

**From FR-022/023**: every resolver body must match the template "quick-return then single-access camelCase body." Emitter must enforce at generation time.

**From FR-017**: codegen pipeline detects two collisions and errors:

- Two snake_case kinds camelCasing to the same identifier.
- A camelCased kind name matching a reserved `is` method (`kind`, `expression`, `pattern`, `type`, `statement`, ...).

**From FR-029**: sub-namespace keys must not collide with JS reserved words; append `_` suffix when they would.
