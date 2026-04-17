# Contract: `NodeNs<T>` base interface

**Location**: `@sittir/types/src/index.ts` (new export)
**Visibility**: Public (consumed by generated `types.ts`; also available to consumer code for advanced generic work)

## Signature

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

## Preconditions

- `T` is a branch or leaf data interface with a literal `type` discriminant (existing shape for all sittir-generated data types).
- `LeafScalarMap` and `LeafStringMap` are provided by the consuming grammar package's existing `@sittir/types` extension mechanism (unchanged by this feature).

## Postconditions

- `NodeNs<T>['Node']` is exactly `T`.
- `NodeNs<T>['Kind']` is the literal `T['type']`.
- `NodeNs<T>['Config']`, `['Fluent']`, `['Loose']`, `['Tree']` are the same types produced by `ConfigOf<T>`, `FluentNodeOf<T>`, `FromInputOf<T, ...>`, `TreeNodeOf<T>` respectively (transitively, not approximately).

## Invariants

- `NodeNs` has exactly six members. Adding or removing a member is a breaking change requiring a coordinated emitter update and version bump on `@sittir/types`.
- Member resolution is computed — consumers who write `NodeNs<X>['Config']` see the fully-expanded `ConfigOf<X>` result, not a deferred alias.

## Failure modes

- `T` without a `type: string` discriminant → TypeScript rejects at the generic constraint `T extends { readonly type: string }`. Surfaces as a type error at the `NodeNs<T>` usage site, not at a distance.
- Missing `LeafScalarMap` / `LeafStringMap` in the consumer's extension context → existing `FromInputOf` error path unchanged.

## Version contract

- Introduced: this spec (008).
- Removal: requires a separate spec. Any change to its shape (add/remove/rename member) is a breaking change to every generated `types.ts` and the associated deprecation path.
