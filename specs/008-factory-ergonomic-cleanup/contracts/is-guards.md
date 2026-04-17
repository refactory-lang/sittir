# Contract: `is`, `isTree`, `isNode`, `assert`

**Location**: `packages/<grammar>/src/is.ts` (new generated file, one per grammar)
**Visibility**: Public — consumer-facing type-guard API.

## Signatures

### `is` namespace

```ts
export const is: IsGuards;

type IsGuards = {
    // Per-kind (camelCase keys)
    [K in keyof NamespaceMap as CamelCase<K & string>]:
        <T extends { readonly type: string }>(v: T)
            => v is T & { readonly type: NamespaceMap[K]['Kind'] & string };
} & {
    // Generic inverse
    kind<K extends keyof NamespaceMap>(
        v: { readonly type: string },
        kind: K,
    ): v is { readonly type: NamespaceMap[K]['Kind'] & string };

    // Per-supertype (one entry per supertype declared in the grammar)
    expression: (v: { readonly type: string }) => v is Expression;
    pattern:    (v: { readonly type: string }) => v is Pattern;
    // ... etc. Emitted based on grammar's supertype declarations.
};
```

### Shape guards

```ts
// Kind already narrowed: resolves through NamespaceMap to the concrete Tree/Node type
export function isTree<T extends { readonly type: K }, K extends keyof NamespaceMap & string>(
    v: T,
): v is T & NamespaceMap[K]['Tree'];
// Kind unknown: falls back to generic AnyTreeNode
export function isTree(v: { readonly type: string }): v is AnyTreeNode;

export function isNode<T extends { readonly type: K }, K extends keyof NamespaceMap & string>(
    v: T,
): v is T & NamespaceMap[K]['Node'];
export function isNode(v: { readonly type: string }): v is AnyNodeData;
```

### `assert` namespace

```ts
export const assert: AssertGuards;

type AssertGuards = {
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

## Preconditions

- Target runs on a TypeScript version supporting assertion-function signatures (`asserts v is T` — TS 3.7+). Sittir's declared minimum exceeds this.
- `NamespaceMap` is in scope (imported from the grammar's own `types.ts`).

## Postconditions

### `is` narrowing

- `if (is.functionItem(v)) { ... }` narrows `v.type` inside the block to `'function_item'`.
- `if (is.kind(v, 'function_item')) { ... }` narrows identically — `is.kind` is the generic inverse.
- `if (is.expression(v)) { ... }` narrows `v.type` to the union of `Expression` supertype members.

### Shape guard narrowing

- `if (isTree(v)) { ... }` narrows to `AnyTreeNode` when `v.type` is not already a known kind.
- `if (isTree(v)) { ... }` narrows to `NamespaceMap[K]['Tree']` when `v.type` has already been narrowed to a specific `K`.

### Composition (the key use case)

- `if (is.functionItem(v) && isTree(v)) { ... }` narrows `v` inside the block to `NamespaceMap['function_item']['Tree']` = `FunctionItem.Tree`.
- `if (is.expression(v) && isNode(v)) { ... }` narrows to the intersection of the `Expression` supertype union and `AnyNodeData` shape.

### `assert` behavior

- `assert.functionItem(v)` — if `v.type === 'function_item'`, narrows `v` for the remainder of the scope; otherwise throws `TypeError` with message identifying expected and actual kind.
- Error message format (stable contract):
  ```
  assert.<guardName>: expected type '<expected>', got '<actual>'
  ```
  Where `<guardName>` is the camelCase per-kind / supertype / `kind` key; `<expected>` is the kind or supertype name; `<actual>` is `v.type` or `'(none)'` if missing.

## Invariants

- `is.*` runtime is pure O(1) per call: kind entries are `v.type === k`; supertype entries are `Set.has(v.type)`.
- `assert.*` runtime wraps `is.*` — no duplicate kind-string literals.
- `isTree` / `isNode` predicates use shape detection (`typeof v.range === 'function'`, `typeof v.fields === 'object' || typeof v.text === 'string'`). They do NOT inspect `v.type`.
- Adding a new kind to `NamespaceMap` automatically yields a working `is.newKind` AND correct `isTree` / `isNode` narrowing for that kind — no hand-edits (FR-016).

## Failure modes

- Calling `is.someKind(v)` where `v.type !== 'some_kind'` returns `false` (no throw).
- Calling `assert.someKind(v)` where `v.type !== 'some_kind'` throws `TypeError` with the documented message format.
- CamelCase collision between `is.someKind` and an established method (`is.kind`, `is.expression`, etc.) → codegen ERROR at emit time (FR-017).

## Relationship to `@babel/types`

The API mirrors Babel's `@babel/types`:

| Sittir | Babel |
|---|---|
| `is.functionItem(v)` | `t.isFunctionDeclaration(v)` |
| `is.kind(v, 'function_item')` | n/a (Babel doesn't expose a generic inverse) |
| `is.expression(v)` | `t.isExpression(v)` |
| `assert.functionItem(v)` | `t.assertFunctionDeclaration(v)` |

Divergences: sittir's camelCase keys match kind-string camelCasing (`is.functionItem`); Babel's are PascalCase (`t.isFunctionDeclaration`). Sittir's supertype guards use the supertype name (`is.expression`); Babel uses the same convention (`t.isExpression`). Sittir adds the composition-with-shape axis (`isTree` / `isNode`); Babel doesn't split this way because Babel nodes carry their methods and data in one shape.

## Version contract

- Introduced: this spec (008).
- `IsGuards` and `AssertGuards` are structural types; new kinds extend them automatically. No breaking change on grammar evolution.
- Adding a new supertype guard or the generic `kind` method post-008 is a MINOR bump on the grammar package; removing one is MAJOR.
