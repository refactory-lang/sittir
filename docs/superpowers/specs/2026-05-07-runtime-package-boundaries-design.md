# Runtime Package Boundaries — Design

## Problem

The current JS/TS runtime packaging blurs three different concerns:

1. **pure type surface** — `@sittir/types`
2. **shared runtime contracts/primitives** — `readNode`, `TreeHandle`, edit and
   format primitives, native-read contract helpers, engine interfaces
3. **JS backend implementation** — `web-tree-sitter` parse/read, JS render,
   template loading, JS engine construction

Today, `@sittir/core` effectively contains both (2) and (3). The package already
has an `./engine` subpath, but the underlying responsibility split is still
muddy:

- low-level runtime primitives and engine wiring live side-by-side
- grammar packages depend on `@sittir/core` as if it were both "shared runtime"
  and "the JS backend"
- it is not obvious from the package graph which pieces should be always-loaded
  versus selected at backend construction time

The current native read-contract bug made this harder to reason about. A clean
boundary should make it obvious that parse/read/render behavior belongs to the
chosen backend, not to an ambient shared package.

## Decision

Adopt a three-layer runtime split on the JS/TS side:

- **`@sittir/types`** — pure types only, zero runtime
- **`@sittir/common`** — internal/shared runtime contracts and primitives only
- **`@sittir/core`** — JS backend implementation only

Grammar packages remain the public surface. Users continue to import language
packs directly (for example `@sittir/rust`, `@sittir/python`,
`@sittir/typescript`), not `@sittir/common`.

## Package responsibilities

### `@sittir/types`

`@sittir/types` remains unchanged in role:

- pure TypeScript type surface
- zero runtime code
- canonical definitions for runtime-facing shapes (`AnyNodeData`, config/tree
  projections, edit types, render context types)

### `@sittir/common`

`@sittir/common` is an **internal/shared runtime package**. It is intentionally
boring and always-loaded.

It owns backend-neutral runtime pieces only:

- `readNode` contract and `TreeHandle`
- edit / format / CST primitives
- native-read contract helpers and assertions
- engine interface types and backend-neutral engine wiring contracts
- other runtime utilities that must be shared by both native and JS backends

It does **not** own:

- JS renderer implementation
- template loading
- `web-tree-sitter` parser ownership
- backend-selection policy
- dynamic import orchestration for the JS backend

### `@sittir/core`

`@sittir/core` becomes the **JS backend package**.

It owns the entire JS implementation path:

- `web-tree-sitter` parse/read
- JS render/template execution
- JS engine construction
- any JS-backend-only helpers required to make that engine work

Its semantics become simple: if JS is the selected backend, this package is the
implementation that gets loaded.

## Public API and engine selection

Grammar packages continue to expose a single engine entrypoint:

```ts
createEngine({ backend? })
```

Selection policy:

1. if the caller passes `backend`, that wins
2. otherwise fall back to the environment variable
3. otherwise use the package's default backend-selection policy

Backend ownership rule:

- if **native** is selected, the grammar package uses the native grammar-owned
  backend
- if **js** is selected, the grammar package dynamically loads `@sittir/core`
  and constructs the JS backend from there

This keeps the user-facing API stable while making backend ownership explicit in
the implementation.

## Dynamic loading

`@sittir/core` should be loaded **only when the JS backend is actually chosen**.

That means:

- grammar packages depend on `@sittir/common` as their always-loaded runtime
  base
- grammar packages do **not** need to eagerly load the JS backend package during
  normal native execution
- the JS backend becomes an implementation detail behind backend resolution,
  rather than an ambient part of every runtime path

This is the key reason not to place dispatch/backend selection logic in
`@sittir/common`: the shared package should describe backend-neutral contracts,
not smuggle in JS-backend implementation decisions.

## Why `common`, not `core`

The new `@sittir/common` package should stay internal/shared, much like how
tree-sitter users import the language package rather than a low-level internal
runtime helper package directly.

That yields a clear layering story:

- users import the language pack
- the language pack depends on shared runtime contracts from `@sittir/common`
- the language pack selects native or JS backend
- if JS is selected, it loads `@sittir/core`

This is a better fit than keeping shared primitives inside `@sittir/core`, which
would continue to overload "core" as both shared runtime and JS implementation.

## Relationship to the Rust side

The Rust side is already structurally closer to this split:

- a shared runtime crate exists
- grammar-specific crates are comparatively thin

So this design is primarily a JS/TS package-boundary clarification. It does not
require a full Rust crate rename or a repo-wide naming-symmetry project in the
same wave.

## Validator package follow-on

After the runtime package boundaries are clarified, add a dedicated internal
validator package:

- **`packages/validator`** — canonical validation facade and history owner

Recommended role:

- own the single canonical validator/counts entrypoint
- own explicit backend propagation to all validator calls
- own append/write policy for the durable validation history
- own summary/report formatting
- own the durable append-only log at
  `packages/validator/validation-history.jsonl`

The first version should be a **facade over existing validator
implementations**, not a forced full extraction. That means validator logic may
continue to live in `packages/codegen` initially, while `packages/validator`
becomes the single place developers invoke.

### Validation history

The durable validation artifact should be:

- **append-only JSONL**
- **checked into git**
- owned by `packages/validator`

This replaces hand-maintained floor assertions as the main historical record.

### Why this comes after the runtime split

The validator package should be designed against the clarified
`types/common/core` layering from day one:

- `@sittir/types` provides the pure type surface
- `@sittir/common` provides backend-neutral runtime contracts
- `@sittir/core` provides the JS backend implementation

If `packages/validator` lands before that split, it would need another boundary
migration immediately afterward.

## Migration plan

Recommended order:

1. **Finish the current native read-contract repair**
   - make native parse/read output match the JS `readNode` surface
   - restore native factory / from / RT counts toward the saved baseline
   - make validator outputs trustworthy again
2. **Create `@sittir/common`**
   - move backend-neutral runtime pieces out of `@sittir/core`
   - keep exports intentionally narrow and internal/shared
3. **Shrink `@sittir/core` to JS backend only**
   - move JS parse/read/render implementation there
   - make grammar packages dynamically load it only when JS is selected
4. **Update grammar packages**
   - depend on `@sittir/common` for shared runtime pieces
   - keep the public engine API at the grammar-package layer
5. **Create `packages/validator`**
   - make it the canonical validation facade
   - add the append-only durable JSONL history
   - retire or demote ad hoc probe/count wrappers
6. **Leave Rust/package naming symmetry as a later cleanup decision**

## Non-Goals

- changing user-facing imports away from grammar packages
- making `@sittir/common` a documented public user entrypoint
- renaming Rust crates purely for naming symmetry
- replacing the current backend-selection API shape
- using this package split or validator-package work as a substitute for the
  still-open emitter refactor

The emitter work still remains after the native-read repair. This package split
and validator cleanup clarify runtime/backend boundaries and measurement
workflow; they do not eliminate the need to finish taxonomy-driven emitter
cleanup.

## Success criteria

- grammar packages remain the public import surface
- `@sittir/types` stays zero-runtime
- `@sittir/common` contains only backend-neutral shared runtime pieces
- `@sittir/core` contains the JS backend implementation, including
  `web-tree-sitter` parse/read and JS render/template loading
- `createEngine({ backend? })` keeps explicit-parameter-over-env selection
- JS backend code is loaded only when JS is actually selected
- the current native read-contract fix is completed before the package split is
  relied on to explain runtime behavior
- `packages/validator` becomes the single canonical validation entrypoint
- validation history is recorded in
  `packages/validator/validation-history.jsonl` as an append-only checked-in
  JSONL artifact
- emitter refactor work can continue independently after the native-read repair
