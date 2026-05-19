# Slot Debt Cleanup Design

Date: 2026-05-12
Branch: `023-native-read-parity`

## Problem

The codegen pipeline still treats the single unnamed child slot as a special case in too many places. That has accumulated slot debt: separate child-specific abstractions, validators, and generated helpers that diverge from the named-slot path even when the underlying semantics are the same.

The current branch has already landed the native read switch:

- native read no longer invents anonymous `_<text>` fields
- field-backed leaf slots scalarize on the wire
- anonymous leaf `$children` scalarize on the wire
- read-render-parse remains the practical regression gate

The next step is to remove slot debt without redesigning the external contract.

## Goals

- Normalize codegen abstractions so named slots and the unnamed child slot follow one model.
- Keep the native transport contract and factory storage aligned by design.
- Preserve the current layering:
  - native read handles grammar-agnostic normalization
  - wrap handles grammar-specific normalization plus methods
- Remove child-specific pipeline paths where they exist only because the unnamed slot had its own abstraction path.

## Non-Goals

- Redesign the transport contract.
- Reintroduce fake anonymous fields.
- Add a new transport normalization shim in `@sittir/common` or `toNativeRenderTransport(...)`.
- Optimize `fromPass` first at the expense of the shared slot model.

## Approaches Considered

### 1. Contract-first transport cleanup

Treat the transport contract as the center of gravity and refactor consumers and codegen stages to honor it directly.

Pros:

- aligns with the current native-read direction
- avoids introducing a second source of truth

Cons:

- requires touching several pipeline stages before all debt disappears

### 2. Normalizer-first transport cleanup

Add a canonicalization pass that reshapes values before downstream consumers see them.

Pros:

- can reduce short-term friction

Cons:

- creates another abstraction layer
- hides debt instead of removing it

### 3. Validator-first compatibility cleanup

Leave transport as-is and first teach validators and `from()` paths to understand the current slot shapes.

Pros:

- low immediate risk

Cons:

- delays the real abstraction cleanup
- preserves child-specific logic longer

### Recommendation

Use the contract-first direction, but treat the work as an internal abstraction cleanup rather than a contract redesign.

## Design

### 1. Transport contract

The target shape is the native transport contract, and factory storage should align to it by design.

- Native read applies grammar-agnostic transformations that move parsed data toward the native transport / factory storage shape.
- Wrap applies the remaining grammar-specific transformations, then adds getters, setters, and utility methods.
- `toNativeRenderTransport(...)` should not be used.
- Native boundary validation remains validation-only.

### 2. Canonical slot model

The existing named-slot path becomes the canonical slot path for the pipeline.

The unnamed child slot should be represented through that same model, with only the minimal residual distinction required by storage-key naming:

- named slots store as `_<name>`
- the unnamed slot stores as `$children`

Arity belongs to the slot model itself, not to whether the slot is named or unnamed. The unnamed slot may be singular or repeated depending on the rule, but it should still be modeled as just another slot.

The likely end state is that child-specific additions to contracts and generated code largely disappear because the pipeline no longer needs a separate abstraction path for unnamed children.

### 3. Refactor shape

1. Inventory child-only branches in assemble, link, emit, and validate.
2. Define the minimal shared slot representation those stages should use.
3. Migrate stages onto the shared slot model.
4. Remove child-specific helpers and branches that become redundant.
5. Leave only the small storage-key distinction that cannot disappear.

## Validation Strategy

- Use `read-render-parse` as the primary regression gate.
- Rebuild fully before trusting numbers.
- Prefer small batches around shared slot abstractions rather than broad rewrites.
- Use targeted probes to explain behavior, not to define the architecture.

## Expected Outcome

- Less field-vs-children branching in the codegen pipeline
- Cleaner alignment between native transport, factory storage, read, and wrap
- A single slot model that makes future transport changes land in one path instead of two
