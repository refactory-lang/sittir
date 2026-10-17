# Utils Common Split — Design

## Problem

Generated grammar `utils.ts` files currently mix two different responsibilities:

1. **Grammar-agnostic runtime behavior** — helpers such as `withMethods`, `isNodeData`, `isTreeNode`, `hasKind`, and the storage coercion helpers.
2. **Grammar-specific typing** — `NamespaceMap`-based overloads, trivia unions, and kind-bound narrowing helpers like `isNodeOfKind` and `hasKindOf`.

Now that `@sittir/common` exists, that mixed ownership is the wrong boundary. The runtime part of `utils.ts` should live in `@sittir/common`, while grammar packages should remain responsible only for projecting package-specific types onto that shared runtime surface.

There is also a boundary defect worth fixing as part of the split: `withMethods` currently inlines its own render/toEdit wiring instead of taking the runtime callbacks explicitly. The stable target is now `withMethods(node, engine)`, where `engine` is a small callback-based surface rather than a full grammar engine object.

## Goals

1. Move the runtime implementation of generated `utils.ts` into `@sittir/common`.
2. Add a dedicated `@sittir/common/utils` subpath for those shared runtime helpers.
3. Keep grammar-specific typing local to each generated grammar package.
4. Make the stable runtime contract explicitly `withMethods(node, engine)`.
5. Keep `engine` narrow: it provides `render(node)` and `toEdit(node, startOrRange, endPos?)`, while `$replace()` is derived and `$trivia()` stays local.
6. Preserve useful attached-method typing instead of widening the caller away.

## Non-Goals

- changing the public `@sittir/<lang>/utils` import path
- moving grammar-specific type computation into `@sittir/common`
- exposing a full grammar engine object through `withMethods`
- hiding the engine dependency behind a grammar-local one-arg wrapper
- using this split as a pretext for unrelated refactors in factories, from, wrap, or render-module

## Design

### 1. Package boundary

Add a dedicated `@sittir/common/utils` subpath that owns the runtime implementation currently emitted into generated `utils.ts`.

This shared runtime surface will contain the grammar-agnostic implementations of:

- `withMethods`
- `isNodeData`
- `isTreeNode`
- `hasKind`
- `coerceBooleanKeywordStorage`
- `coerceBitflagStorage`
- shared internal helpers such as `extractNodeText` and `isRecord`

`withMethods` is defined as:

```ts
withMethods(node, engine)
```

where `engine` is a small callback surface:

```ts
{
  render(node): string;
  toEdit(node, startOrRange, endPos?): Edit;
}
```

`@sittir/common/utils` owns the runtime attachment logic for `$render()` and `$toEdit()`, derives `$replace()` from `toEdit(target.range())`, and keeps `$trivia()` as local node mutation.

The governing rule is:

> **Runtime behavior lives in `@sittir/common/utils`; grammar packages only project local types onto that behavior.**

### 2. Generated grammar surface

Each generated grammar package keeps a `utils` module, but that module stops owning substantive runtime logic.

Instead:

- `utils.ts` becomes a minimal runtime facade over `@sittir/common/utils`
- the generated declaration surface for `utils.ts` remains the type-owning surface for the grammar package
- generated `wrap.ts` and any other generated call sites pass the engine explicitly via the grammar-local callback object

This preserves the existing consumer path:

```ts
import { withMethods, isNodeOfKind } from '@sittir/rust/utils';
```

without leaving duplicated runtime logic in every generated package.

### 3. Declaration projection

Each generated grammar `utils` type surface projects grammar-local typing onto the shared runtime exports from `@sittir/common/utils`.

That type surface owns the grammar-specific overloads and narrowing behavior, including:

- `isNodeData<K extends keyof NamespaceMap>(...)`
- `isTreeNode<K extends keyof NamespaceMap>(...)`
- `isNodeOfKind<K extends keyof NamespaceMap>(v, kind)`
- `hasKindOf<K extends keyof NamespaceMap>(v, kind)`
- trivia-aware `$trivia(...)` typing on `withMethods(node, engine)`

`@sittir/common/utils` remains grammar-agnostic and works only in terms of broad shared runtime types such as `AnyNodeData`, plain records, arrays, and generic object extension.

### 4. `withMethods` typing fix

The split must improve the `withMethods(node, engine)` boundary rather than preserve the current erosion.

Required outcome:

- the shared runtime implementation attaches `$render` and `$toEdit` through the passed `engine`
- `$replace()` is derived in shared runtime code from `toEdit(target.range())`
- `$trivia()` remains local node mutation and does not require engine callbacks
- the generated grammar type surface projects those attached methods back onto grammar-specific node/trivia types without widening away the caller’s concrete node type

This means the work is not only a package move. It is also a typing-correctness cleanup at the `utils` boundary.

### 5. Data flow after the split

1. `@sittir/common/utils` provides the runtime helper implementations, including `withMethods(node, engine)`.
2. Generated grammar `utils.ts` imports that shared runtime helper, keeps grammar-local guards/coercers/types, and exposes the same public `withMethods(node, engine)` signature.
3. Generated grammar `wrap.ts` and other generated call sites use the grammar-local engine object explicitly when attaching methods.
4. The generated declaration output for `utils.ts` overlays package-local typing on that shared runtime surface.
5. Consumer imports continue to come from `@sittir/<lang>/utils`.

## Acceptance Criteria

1. `@sittir/common/utils` exists and owns the runtime implementation currently duplicated in generated `utils.ts`.
2. The stable helper signature is `withMethods(node, engine)` in both common and grammar package surfaces.
3. Generated grammar `utils.ts` no longer owns the shared runtime body for `withMethods`.
4. Generated grammar call sites such as `wrap.ts` pass the explicit engine object.
5. `isNodeData`, `isTreeNode`, `isNodeOfKind`, and `hasKindOf` still narrow correctly for package-local types.
6. `withMethods(node, engine)` preserves useful attached-method typing instead of erasing it.
7. The public grammar import path remains `@sittir/<lang>/utils`.

## Testing

Validation must cover:

1. `@sittir/common/utils` runtime exports and `withMethods(node, engine)` behavior
2. codegen emission proving grammar `utils.ts` no longer owns the shared runtime body
3. regenerated grammar call sites proving `withMethods(..., engine)` is wired through generated code
4. grammar-local type projection for guards and trivia-aware attached methods
5. at least one generated grammar package proving the `utils` surface still works from consumer code
