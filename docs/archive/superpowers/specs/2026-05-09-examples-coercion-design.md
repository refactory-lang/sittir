# Examples and `.from()` Coercion Cleanup Design

## Problem

The checked-in examples no longer line up cleanly with the current public API. Some failures are legitimate `.from()` ergonomics gaps, especially around hoisted string inputs. Others are stale or malformed examples, examples using the wrong node kind, or places where the boundary between strict/factory usage and `.from()` shorthand has drifted.

The goal of this pass is to restore truthful, working examples without making `.from()` guessy or ambiguous across grammars.

## Goals

1. Make the checked-in examples work across Rust, TypeScript, and Python.
2. Broaden `.from()` only for coercions that are grammar-safe and mechanically unambiguous.
3. Limit boolean coercion to explicit presence/marker fields that already map to optional syntax markers.
4. Clarify the relationship between strict/factory usage and `.from()` usage in examples and in the `ir` namespace.
5. Use this pass to reconcile partially completed API migration from factory-first examples toward `.from()` ergonomics, where appropriate.

## Non-Goals

1. Do not turn `.from()` into a heuristic parser for arbitrary strings.
2. Do not add broad boolean coercion beyond existing marker/presence syntax.
3. Do not hand-edit generated package output; all behavior changes must come from codegen and regeneration.
4. Do not preserve current example syntax when it is stale, malformed, or semantically misleading.

## Recommended Approach

Use a **targeted hybrid** approach:

1. Add `.from()` coercion only for clearly grammar-safe hoisted string cases and explicit marker booleans.
2. Fix examples when the desired shorthand would be ambiguous, would hide the real node shape, or relies on the wrong abstraction layer.
3. Treat this as both an example-truthfulness pass and a small API-surface cleanup for strict/factory vs `.from()` usage.

This approach preserves ergonomics where the mapping is obvious while keeping `.from()` predictable and teachable.

## Scope and Boundaries

The work splits into two lanes.

### 1. `.from()` coercion lane

Only broaden coercion where the generated type surface already points to a single clear target:

- hoisted string inputs for unambiguous leaf-like fields such as names, visibility markers, simple type references, and similar single-target slots
- hoisted booleans only for explicit presence/marker syntax that already has a concrete generated representation

### 2. Example-correction lane

Fix examples when they are:

- syntactically stale or malformed
- using the wrong node kind for the intended construct
- depending on ambiguous coercion that would make `.from()` less predictable across grammars

## Implementation Shape

### A. Coercion audit matrix

For each failing example use-site, classify it as:

- **safe to coerce**
- **unsafe or ambiguous**
- **example is wrong**

This classification should be derived from the generator/type-definition surface, not from ad hoc example exceptions.

### B. Generator-owned `.from()` updates

Make behavior changes in `packages/codegen/src/*`, then regenerate the affected grammar packages.

Any new coercion must come from emitted `FromInput` types and resolver logic together. Generated packages under `packages/{rust,typescript,python}/src/*` remain derived output.

### C. Example repairs

Update the checked-in examples to the final intended public API. Prefer examples that demonstrate the simplest truthful shape, even if `.from()` technically supports a more permissive shorthand.

## Example Contract and API-Surface Cleanup

### All three grammars must be represented

The examples set should be maintained across Rust, TypeScript, and Python. This pass should not stop at Rust-only repairs.

### Show both surfaces only where they differ

For a construct with meaningfully different ergonomics, provide:

- a **strict/factory** example
- a **`.from()`** example

If both surfaces are effectively identical for a node such as `identifier`, collapse to the strict form and evaluate whether a distinct `.from()` surface should continue to be emitted there at all.

### Reconcile partial API migration

The current examples and namespace usage suggest a partially completed migration from factory-primary usage toward `.from()` shorthand. This pass should normalize:

- strict/factory vs `.from()` expectations
- variant usage in the `ir` namespace
- where shorthand belongs vs where explicit node construction should remain the norm

### Rust `string_literal` ergonomics are an explicit review item

Rust string-literal usage should be reviewed as a first-class ergonomics problem. If it currently requires awkward nesting, determine whether that is caused by:

- a `.from()` coercion gap
- a namespace or variant ergonomics issue
- or an example using the wrong abstraction layer

## Validation and Success Criteria

The pass is complete only if all of the following are true:

1. Every checked-in example compiles and is truthful about the intended public API.
2. Newly added coercions are mechanically describable and do not introduce guessy behavior.
3. Boolean coercion is still limited to explicit marker/presence syntax.
4. Any behavior change comes from codegen plus regeneration, not manual edits to generated output.
5. Strict/factory and `.from()` examples are checked against the same regenerated package surfaces.
6. Remaining failures, if any, are explicitly classified as generator issue vs example issue rather than patched blindly.

## Expected Deliverable

The deliverable is:

- working examples across all checked-in example files and all three grammars
- a clearer strict/factory vs `.from()` split
- targeted `.from()` ergonomic improvements for safe hoisted strings and explicit marker booleans
- better-aligned namespace and variant usage in the example surface
