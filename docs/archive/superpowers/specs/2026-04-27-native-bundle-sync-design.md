# Native Bundle Sync Design

## Problem

Native parity is currently untrustworthy because `SITTIR_BACKEND=native` fails closed on a template-bundle hash mismatch for all three grammars (`python`, `rust`, `typescript`). The validator path and the parity-fixture path are therefore reporting against different realities: TS mode still runs, while native parity throws before rendering and is counted as fixture failure.

The fix must restore the intended invariant without weakening safety checks:

- TS bundle hash and native bundle hash must be generated from the same template state.
- Native parity baselines must only be refreshed after hash equality is restored.
- The repo should fail loudly if those artifacts drift again.

## Goals

1. Restore hash equality for `python`, `rust`, and `typescript`.
2. Make native parity rendering execute real renders instead of failing at backend selection.
3. Preserve the strict `SITTIR_BACKEND=native` mismatch guard.
4. Add a recurrence guard so TS/native bundle drift is caught during generation or validation.

## Non-Goals

- Do not weaken the native hash-mismatch error into a warning.
- Do not change renderer semantics unless sync restoration proves insufficient.
- Do not redesign perf tracking or baseline schema as part of this fix.

## Current Behavior

### TS path

- TS parity uses the generated TS template bundle directly.
- TS perf tracking records per-kind timing and heap deltas.

### Native path

- Native backend selection loads the napi engine and compares `engine.templateBundleHash` with the generated TS-side `TEMPLATE_BUNDLE_HASH`.
- With `SITTIR_BACKEND=native`, mismatch throws immediately.
- `collect-baseline.ts` catches parity render exceptions, records `actual = null`, and counts the fixture as failed.

This behavior is correct as a safety contract, but the current artifacts are out of sync.

## Proposed Approach

### 1. Keep the strict hash gate

`packages/{python,rust,typescript}/src/backend.ts` remains unchanged in principle:

- forced TS stays opt-in
- forced native continues to throw on mismatch
- unforced mode may still fall back to TS

The gate is not the bug. It is the mechanism that exposed drift.

### 2. Re-establish a single regeneration path

The generation flow must ensure that a normal regen updates both sides together:

- TS-side generated templates and hash artifact (`src/hash.ts`)
- native render-module crate templates and hash artifact (`render-module/src/hash.rs`)

The likely implementation surface is:

- `packages/codegen/src/cli.ts`
- `packages/codegen/src/emitters/render-module.ts`

The fix should make it difficult for `--all` output to move forward while native bundle artifacts remain stale.

### 3. Add a recurrence guard

After regeneration, the repo should validate that each grammar has matching TS and native hashes.

Acceptable guard locations:

- existing validation/check script, or
- CI step, or
- codegen/build flow immediately after generation

The guard should be explicit and fail with grammar-specific mismatch details.

### 4. Refresh native trust only after sync

Once hash equality is restored:

1. rebuild native artifacts
2. rerun native parity collection
3. refresh the committed native baseline only if parity now represents actual render output instead of boundary failure

If parity still differs after sync restoration, that is a real renderer/template issue and should be investigated separately.

## Data Flow

1. Codegen emits TS template artifacts and native render-module artifacts.
2. Hash artifacts are derived from the same emitted template bundle.
3. Backend selection compares native runtime hash to generated TS hash.
4. Native parity collection calls boundary `render()`.
5. Successful parity collection means native actually rendered fixture input.

The critical invariant is step 2: there must be exactly one derivation path for the bundle hash inputs.

## Error Handling

- Hash mismatch remains a hard error for forced native mode.
- Build/regeneration guard failures should stop the workflow before baseline refresh.
- If native engine loads but parity still differs after sync, treat that as a real backend divergence, not a tooling issue.

## Verification Plan

1. Reproduce current mismatch for all three grammars.
2. Fix generation/build sync so TS and native hashes align.
3. Rebuild native artifacts.
4. Confirm no hash mismatch for `python`, `rust`, or `typescript`.
5. Re-run native parity collection and verify render fixtures no longer fail due to thrown boundary errors.
6. Re-run relevant tests.
7. Compare refreshed TS/native parity and perf metrics side-by-side.

## Success Criteria

- `SITTIR_BACKEND=native` no longer throws a template-bundle mismatch for any grammar.
- Native parity collector performs real renders for all grammars.
- Native baseline is regenerated from a trustworthy run.
- A repo-level guard exists so this drift cannot recur silently.

## Risks

### Hidden dual-source generation

If TS and native hashes are derived by separate code paths or partially separate template sources, a superficial sync may hide the real duplication. The implementation should favor one source and one derivation.

### Over-fixing

It is easy to start changing renderer logic once parity numbers look bad. This design explicitly separates:

- sync/tooling failure
- true native render divergence

Only the first is in scope for this fix.

## Recommendation

Implement the sync restoration and recurrence guard first, keep the hash gate strict, and only investigate renderer semantics if parity still diverges after the hash invariant is restored.
