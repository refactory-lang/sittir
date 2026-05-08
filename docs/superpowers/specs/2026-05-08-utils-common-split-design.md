# Utils Common Split — Design

## Problem

Generated grammar `utils.ts` files currently mix two different responsibilities:

1. **Grammar-agnostic runtime behavior** — helpers such as `withMethods`, `isNodeData`, `isTreeNode`, `hasKind`, and the storage coercion helpers.
2. **Grammar-specific typing** — `NamespaceMap`-based overloads, trivia unions, and kind-bound narrowing helpers like `isNodeOfKind` and `hasKindOf`.

Now that `@sittir/common` exists, that mixed ownership is the wrong boundary. The runtime part of `utils.ts` should live in `@sittir/common`, while grammar packages should remain responsible only for projecting package-specific types onto that shared runtime surface.

There is also a typing defect worth fixing as part of the split: `withMethods` currently erases useful attached-method typing instead of preserving the concrete node type cleanly.

## Goals

1. Move the runtime implementation of generated `utils.ts` into `@sittir/common`.
2. Add a dedicated `@sittir/common/utils` subpath for those shared runtime helpers.
3. Keep grammar-specific typing local to each generated grammar package.
4. Generate `utils.d.ts` so each grammar package projects its own `NamespaceMap`, trivia unions, and kind-based narrowing onto the shared runtime surface.
5. Fix `withMethods` typing so attached methods preserve the caller’s concrete type instead of widening it away.

## Non-Goals

- changing the public `@sittir/<lang>/utils` import path
- moving grammar-specific type computation into `@sittir/common`
- changing the semantics of the runtime helpers themselves unless required to preserve correct typing
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

The governing rule is:

> **Runtime behavior lives in `@sittir/common/utils`; grammar packages only project local types onto that behavior.**

### 2. Generated grammar surface

Each generated grammar package keeps a `utils` module, but that module stops owning substantive runtime logic.

Instead:

- `utils.ts` becomes a minimal runtime facade over `@sittir/common/utils`
- `utils.d.ts` becomes the type-owning surface for the grammar package

This preserves the existing consumer path:

```ts
import { withMethods, isNodeOfKind } from '@sittir/rust/utils';
```

without leaving duplicated runtime logic in every generated package.

### 3. Declaration projection

Each generated `utils.d.ts` projects grammar-local typing onto the shared runtime exports from `@sittir/common/utils`.

That declaration file owns the grammar-specific overloads and narrowing behavior, including:

- `isNodeData<K extends keyof NamespaceMap>(...)`
- `isTreeNode<K extends keyof NamespaceMap>(...)`
- `isNodeOfKind<K extends keyof NamespaceMap>(v, kind)`
- `hasKindOf<K extends keyof NamespaceMap>(v, kind)`
- trivia-aware `$trivia(...)` typing on `withMethods`

`@sittir/common/utils` remains grammar-agnostic and works only in terms of broad shared runtime types such as `AnyNodeData`, plain records, arrays, and generic object extension.

### 4. `withMethods` typing fix

The split must improve `withMethods` typing rather than preserve the current erosion.

Required outcome:

- the shared runtime implementation attaches `$render`, `$toEdit`, `$replace`, and `$trivia` without widening away the caller’s concrete node type
- the generated `utils.d.ts` projects those attached methods back onto grammar-specific node/trivia types

This means the work is not only a package move. It is also a typing-correctness cleanup at the `utils` boundary.

### 5. Data flow after the split

1. `@sittir/common/utils` provides the runtime helper implementations.
2. Generated grammar `utils.ts` re-exports the runtime implementation surface needed at execution time.
3. Generated grammar `utils.d.ts` overlays package-local typing on that shared runtime surface.
4. Consumer imports continue to come from `@sittir/<lang>/utils`.

## Acceptance Criteria

1. `@sittir/common/utils` exists and owns the runtime implementation currently duplicated in generated `utils.ts`.
2. Generated grammar `utils.ts` is reduced to a minimal runtime facade.
3. Generated grammar `utils.d.ts` exists and owns grammar-specific typing projection.
4. `isNodeData`, `isTreeNode`, `isNodeOfKind`, and `hasKindOf` still narrow correctly for package-local types.
5. `withMethods` preserves useful attached-method typing instead of erasing it.
6. The public grammar import path remains `@sittir/<lang>/utils`.

## Testing

Validation must cover:

1. `@sittir/common/utils` runtime exports
2. generated `utils.d.ts` projection shape
3. `withMethods` preserving grammar-specific typing
4. at least one generated grammar package proving the `utils` surface still works from consumer code
