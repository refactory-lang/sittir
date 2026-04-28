# Native Renderer Format Symmetry Design

## Problem

The current post-020 state is behaviorally split:

- JS rendering still supports engine-level and tree-level format state.
- Native rendering was simplified to canonical-only output unless callers apply format outside the engine.

That split violates the intended contract from the earlier format work. It also makes the public API drift: JS still behaves like a format-aware engine, while native behaves like a stateless canonical printer.

The user has explicitly rejected restoring native format support by reintroducing per-node `$format` on the native boundary. The fix must preserve a format-free native `NodeData` model.

## Decision

Adopt **strict public API symmetry** between JS and native engines, backed by **persistent engine state** on the native side.

In this terminology, an **engine** is the top-level object composed of a **reader** and a **renderer**. "Renderer" remains the render-specific subcomponent, not the whole public API object.

The key rules are:

1. native `NodeData` stays format-free; no per-node `$format` returns to the boundary
2. engine instances own reader + renderer state
3. parsed tree handles retain inferred tree-level format associated with the engine that created them
4. client-side render calls remain contextless; render resolves format from engine state, not from node payload
5. precedence is fixed and shared across backends: **engine config wins over inferred tree format**
6. engine-level format configuration is established when the engine is created and does not mutate afterward

This is an engine/handle design change, not a per-node data-model change.

## Goals

1. Restore format-aware engine symmetry between JS and native backends.
2. Keep `NodeData` free of per-node format state on the native side.
3. Make engine lifecycle and handle behavior match across JS and native.
4. Preserve the optimized native render pipeline direction from 020 rather than reintroducing payload-level format plumbing.
5. Make precedence and detached-node behavior explicit and testable.

## Non-Goals

- No return to per-node `$format` on native `NodeData`.
- No requirement that JS and native share identical internals.
- No broad redesign of format inference itself.
- No change in formatting semantics beyond restoring the missing native renderer behavior.
- No speculative stateful design beyond renderer-owned configuration and renderer-associated tree handles.

## Current Mismatch

Today there are effectively two contracts:

1. **JS contract**
   - engine creation can carry format config
   - render can honor engine-level and tree-level format context

2. **Native contract**
   - render is effectively canonical-only at the engine boundary
   - callers/tests must apply format after native render to recover parity

That mismatch is the real bug. The issue is not merely where formatting is applied, but that the two backends no longer present the same engine model.

## Proposed API Model

The canonical public model should be the same on both backends:

- `createEngine({ format? })`
- `engine.parseAndRead(...) -> treeHandle`
- `engine.render(input, options?) -> string`
- `engine.dispose()`
- `treeHandle.render(options?) -> string` or equivalent engine-mediated render entrypoint

The important part is not the exact method spelling but the **same object model and the same semantics** on both backends:

- engine instances hold engine-level defaults
- parsed handles remain associated with the engine that created them
- render can accept a parsed handle or detached/factory `NodeData`
- detached `NodeData` does not silently inherit inferred tree-level format because it has no tree-handle association

Existing convenience helpers may remain, but they should delegate to this shared engine/handle contract instead of preserving backend-specific behavior differences.

The important boundary distinction is:

- the **client-side** render call stays contextless in normal use
- the **engine-side** render surface may use internal options/format state to resolve the effective output behavior

## Engine State Model

### Engine-owned state

Each engine instance owns:

- optional engine-level default format configuration fixed at renderer creation
- any backend-specific runtime resources needed for parsing and rendering
- the association table for parsed tree handles and their inferred format

### Tree-handle-owned state

Each parsed tree handle owns:

- its engine association
- its parsed-tree/native-tree identity as needed by the backend
- any inferred tree-level format discovered during parse/read

The tree handle does **not** copy that format onto every node. The handle keeps the format at tree scope, where it belongs.

## Format Resolution Rules

Format resolution is the same on both backends:

1. engine-level config
2. inferred tree-level format from the parsed handle
3. no format

This means:

- engine defaults override inferred tree format when both exist
- parsed handles can still render with inferred format when no engine default is set
- detached/factory `NodeData` can only see engine defaults, never inferred tree format

That rule is deliberately simple and should live in one conceptual place in the implementation so JS and native cannot drift again.

## Native Behavior

### Why native needs persistent state

If native render is expected to be format-aware without putting format on every node, then the engine must retain state across parse/read/render calls. That state is what nodes and tree handles "borrow" from during render.

The native backend therefore needs a real engine instance rather than only a stateless `render(node_json)` surface.

### Fast path for parsed handles

Once native has persistent engine state, parsed-handle render can be cheaper and cleaner:

- render can use the engine's association to the parsed handle
- inferred tree format can be resolved without serializing it through node payloads
- native can avoid unnecessary round-trips for parsed-handle rendering when the underlying tree/runtime state is already available

This is both a symmetry improvement and a performance opportunity.

### Detached NodeData

Detached or factory-built `NodeData` remains supported, but its behavior is narrower by design:

- it may render with engine-level defaults from the engine
- it may not implicitly borrow inferred tree format from some unrelated parsed handle

That rule should be documented and enforced consistently on both backends.

## JS Behavior

JS does not need to become internally identical to native, but it does need to expose the same public contract:

- same engine creation surface
- same handle association model
- same precedence rules
- same detached-node behavior
- same lifecycle/error semantics

If JS currently has helper paths that bypass this shape, they should either be preserved only as wrappers or tightened so the shared engine/handle API becomes the canonical contract.

## Error Handling

The symmetric API should also align failure modes:

- rendering with a disposed engine is an explicit error
- rendering a stale/disposed tree handle is an explicit error
- rendering detached `NodeData` without available engine defaults is allowed and produces canonical output
- the backend must not silently invent tree-level format for detached data
- precedence conflicts are not errors; engine config simply wins

No silent fallback should hide renderer/handle misuse.

## Verification Plan

1. Add contract tests that exercise the same engine/handle API on JS and native.
2. Verify precedence on both backends:
   - engine config only
   - inferred tree format only
   - both present, engine wins
   - neither present
3. Verify detached/factory `NodeData` behavior on both backends:
   - engine default applies
   - inferred tree format does not leak in
4. Verify handle lifecycle failures:
   - stale handle
   - disposed renderer
5. Keep the existing format parity suites, but move them to assert the shared renderer contract rather than external post-processing on native output.

## Spec and Contract Impact

This design implies follow-up updates in the feature specs and native contract docs:

- feature 020 must no longer treat native formatting as externally applied-only behavior
- feature 017 expectations for both-backend format parity should be restored through engine behavior rather than test harness compensation
- the spec 012 native API contract will need to describe a stateful engine/handle model rather than only a stateless canonical render call

The boundary may still expose low-level primitives internally, but the supported public contract should be the symmetric engine API.

## Risks

### API tightening on JS

Strict symmetry may require light JS API cleanup, not just native changes. That is intentional, but the implementation should preserve ergonomic wrappers where they do not create semantic drift.

### Renderer/handle lifetime complexity

Adding persistent native state introduces disposal and stale-handle concerns that the current canonical-only path can mostly ignore. These must be surfaced explicitly in tests and error behavior.

### Partial symmetry

The biggest failure mode would be restoring native format support while leaving JS/native with subtly different handle rules or detached-node behavior. The implementation should treat symmetry as a contract, not a best-effort similarity.

## Recommendation

Implement the follow-up as a strict engine-contract alignment change:

1. define the canonical symmetric engine/handle API
2. preserve format-free native `NodeData`
3. add persistent native engine state and engine-associated tree handles
4. centralize precedence as engine config over inferred tree format
5. update parity and contract tests to assert shared behavior directly

This restores the intended feature behavior without undoing the data-model cleanup that removed per-node `$format` from native nodes.
