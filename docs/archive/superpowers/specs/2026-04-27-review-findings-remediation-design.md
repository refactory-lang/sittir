# Review Findings Remediation Design

## Problem

The 016 review surfaced a cluster of correctness gaps that all point to the same root issue: parts of the native boundary and supporting scripts are more permissive than the runtime contract they are supposed to enforce. Today the branch can silently downgrade native execution, misclassify native render failures as parity mismatches, accept payload shapes that the Rust wire layer cannot deserialize, and advertise a one-flag regeneration workflow that is not yet implemented end-to-end.

These are not independent polish items. They are contract drift across four connected surfaces:

1. backend selection and execution
2. JS-to-Rust wire typing
3. baseline / perf scripts
4. codegen regeneration workflow and comments

The remediation should fix the reviewed defects without widening scope into unrelated architectural cleanup.

## Goals

1. Make native execution failures visible once native has been selected.
2. Align TS-side native payload types with the Rust wire contract.
3. Make baseline and perf scripts report failures honestly instead of accepting malformed or fallback-shaped inputs.
4. Make `--all` the single supported regeneration path for TS and native render artifacts.
5. Remove stale comments and docs called out by review where they would otherwise continue to mislead contributors.

## Non-goals

1. Rework the broader backend architecture beyond the reviewed defects.
2. Fold in the separate JS-backend rename work.
3. Fold in the render-module crate relocation work.
4. Redesign the general `AnyNodeData` developer-facing API outside the native boundary.

## Design

### 1. Selection stays soft; execution becomes strict

Backend selection continues to support the current default behavior: if the native package is unavailable, fails to load, or its template-bundle hash does not match, selection may choose the JS/TS renderer with an explicit fallback reason.

What changes is the execution contract. Once the active backend is native, boundary operations must not silently retry on JS/TS. Specifically:

- native engine construction failures in the boundary surface as errors
- native `render()` failures surface as errors
- native `applyEdits()` failures surface as errors

This preserves graceful selection while eliminating silent execution downgrade. The only place that may choose JS/TS after a native problem is the selector itself.

### 2. Backend status becomes a discriminated union

The current `BackendStatus` bag under-expresses the runtime invariants. It will be replaced with a discriminated union that encodes the actual legal states:

- native active
- JS/TS active because native is unavailable
- JS/TS active because native init failed
- JS/TS active because template hashes mismatched
- JS/TS active because the user forced the non-native backend

This makes relations like `name === "native" -> native module exists` and `hashMatch === true -> native active` explicit in the type system, so boundary code no longer has to infer them from optional properties.

### 3. Native wire payloads get an explicit strict type

The native boundary must not accept the full permissive `AnyNodeData` shape as if it were guaranteed to deserialize on the Rust side. A new strict TS-side native payload type will model the actual wire contract:

- `$source` required
- `$named` required
- `$fields` values restricted to `NodeData | NodeData[] | string`
- no primitive child entries that the Rust wire model cannot deserialize

Boundary render will validate or narrow to this stricter type before crossing the JS→Rust boundary. This keeps the broad developer-facing node shape intact for the rest of the TS surface while making native dispatch honest about what it can serialize.

### 4. `read_node` validates ids instead of coercing them

All N-API `read_node` entry points currently accept `f64` and cast directly to `u64`. That will be replaced with explicit validation:

- finite
- non-negative
- integer-valued

Invalid ids will return a boundary error immediately. Valid ids will then be converted to `u64` and used for lookup. This matches the real runtime invariant instead of silently changing the caller's input.

### 5. Baseline and perf scripts become strict about failure shape

`collect-baseline.ts` will stop converting render exceptions into `actual = null`. A thrown render during parity collection is a render failure, not a normal mismatch. The collector should preserve the distinction and fail loudly enough that native crashes and boundary errors are visible in the output.

`check-perf-baseline.ts` will stop re-declaring a looser metrics shape. It should consume the canonical metrics contract and require a native-shaped metrics file for the native perf gate. A TS metrics file, or a metrics file with no `ffi` block, must not be accepted as a passing native run.

### 6. The one-flag regeneration contract becomes real

The branch already has tests asserting the one-flag workflow. The implementation will be brought into alignment by making `--all` the only supported path for generating TS and native render artifacts.

That means updating all of the following together:

- CLI option parsing and help text
- render-module emitter headers
- CI regeneration commands
- tests that describe the supported workflow

After remediation, contributors should see a single documented command for full regeneration, and that command should be the one actually exercised by the branch.

### 7. Reviewed comment drift is fixed in place

The stale comments called out by review should be corrected as part of this pass, limited to the reviewed files:

- `packages/codegen/src/compiler/link.ts`
- `packages/codegen/src/compiler/node-map.ts`
- `packages/codegen/src/dsl/enrich.ts`

The goal is not comment polish in general; it is to eliminate comments that currently describe behavior that no longer exists.

## Testing

The remediation is complete only when the following coverage exists:

1. acceptance coverage for forced-native hard-fail semantics
2. coverage proving validator/baseline native paths actually execute through native dispatch
3. tests for invalid `read_node` ids
4. tests that parity render failures are surfaced as failures, not downgraded to mismatches
5. tests that native perf checking rejects TS-shaped or FFI-less metrics input
6. tests that the supported regeneration contract is `--all` end-to-end

## Expected outcome

After this remediation:

- native failures are visible instead of silently retried on JS/TS
- the TS type surface no longer claims the native boundary accepts shapes it cannot deserialize
- perf and parity tooling distinguish bad runs from ordinary mismatches
- regeneration instructions, emitted files, and CI all agree on a single workflow
- the reviewed stale comments stop sending contributors toward obsolete behavior
