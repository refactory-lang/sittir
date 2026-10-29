# Paired Node Backends Implementation Plan

> Execute inline using `superpowers:executing-plans`; no subagents. Steps use checkbox syntax for tracking.

**Goal:** Support only object/object and arena/record, and verify object mode against pinned master.

**Architecture:** `nodeStorageOf` derives one resolved pair. Public types admit matching legacy construction assertions only. CLI/validation/profiling consume the same paired selection; historical benchmark data remains interpretable. A separate exported master supplies an independent object baseline.

**Tech Stack:** TypeScript runtime/types/codegen, Vitest/type tests, existing native bindings, Node benchmark workers, GitHub tracking.

**Spec:** `docs/superpowers/specs/2026-10-29-paired-node-backends-design.md`

## Global constraints

- Existing checkout and `chore/remove-eager-lane`; inline, no agents/branch/worktree/session changes.
- Master baseline is `7471447a24febcdae6f37b025cdb80a12a929209`, exported independently.
- Preserve both paired modes and the existing branch default. Matching legacy options are deprecated; explicit hybrids refuse.
- No generated hand edits, baseline increases, silent coercions or parity/acceptance waivers.
- Preserve the unrelated emit scratch directory and all prior evidence.

## Review focus

- Construction-only object requests must not become a silently different backend.
- Explicit object mode must keep the object builder path without loading record modules or allocating a built arena.
- CLI defaults must follow the selected storage, rather than accidentally requesting the retired hybrid.
- Profiling must label the actual construction of each arm; old hybrid reports stay historical.
- Master comparison must use its own compiled runtime/native bindings and the same inputs, compiler profile and timing protocol.

### Task 1: Pair the public options and engine resolution

**Files:** `packages/types/src/engine-api.ts`, `packages/common/src/engine-scope.ts`, new `packages/common/tests/node-storage-options.test.ts`, new `tests/types/paired-node-storage.test-d.ts`, existing `packages/rust/tests/record-construction.test.ts`.

**Interfaces:** `nodeStorageOf(options) -> ResolvedNodeStorage` remains the shared resolver. `NodeStorageOptions` admits arena/record or object/object only; matching explicit construction values are deprecated.

- [x] Add real resolution/integration/type cases for both modes, matching aliases, explicit hybrids and construction-only object input. Observe the expected RED on the current resolver/type union.
- [x] Implement paired derivation and public deprecation JSDoc. Preserve named refusal for object storage with records; provide an actionable refusal for the retired hybrid.
- [x] Run the new tests and existing construction/identity tests. Inspect the object path for unexpected record loading/allocation.

### Task 2: Align CLI, validators, benchmark workers and test fixtures

**Files:** `packages/tools/src/validate/common.ts`, `packages/tools/src/commands.ts`, `packages/cli/src/commands/validate/counts.ts`, `packages/cli/src/commands/tool/bench-storage.ts`, `packages/tools/src/profile/storage.ts`, `packages/tools/src/profile/validation-storage-worker.ts`, affected construction fixtures/tests, `.github/workflows/ci.yml`, `.github/workflows/benchmarks.yml`, `.github/workflows/benchmark-corpus.yml`.

**Interfaces:** storage selection determines construction; deprecated explicit flags validate consistency. New benchmark arena arms construct records; object arms construct objects. Historical report schemas are not rewritten.

- [x] Add a validator-switch regression catching a conflicting construction hint and observe RED; verify real CLI/worker refusal and paired metadata after implementation.
- [x] Update consumers and replace three-pair test loops with both supported pairs. Remove independent construction choices from new workflow runs and label the pair in results.
- [x] Run focused CLI/profile/construction tests, benchmark-report tests, and type checking. Fix any remaining active hybrid caller at its source.

### Task 3: Tracking, docs and generated consistency

**Files:** paired-backend design/plan; current arena design and builder plan; benchmark CI documentation; portable acceptance evidence under `docs/reviews/`.

- [x] Reframe the existing source-fidelity issue while preserving history; create the accepted paired-mode/master-baseline tracker.
- [x] Reconcile live docs and option examples with paired behavior; keep older measurements explicitly historical.
- [x] Regenerate all grammar outputs normally, rebuild native freshness inputs as required, and verify generated consistency without changing ratchets.

### Task 4: Object baseline, full verification and review

**Files:** independent exported master and raw evidence in the task's `paired-modes-2026-10-29/`; portable comparison/report artifacts under `docs/reviews/`.

- [x] Pin and export master; install locked dependencies without lifecycle scripts.
- [x] Build the exported master's own compiled/native runtime. Run identical parsed/built fixtures against both object modes and compare outputs, edits, refusal/identity/lifetime observations. Isolate any difference.
- [x] Run matching public-object construction and memory measurements, with warmup and paired/rotated samples; report uncertainty and any residual overhead rather than claiming blanket equivalence.
- [x] Run complete TypeScript checks, the full unit suite, required validation-history comparisons and appropriate lint/native checks on the new tree. Preserve failures; no automatic revert.
- [x] Review the complete diff inline, including the review-focus cases. Save results and update the existing PR only after the new scope is verified. No merge or release.

## Recorded limits

The implementation and planned verification are complete. Behavior/count comparisons match pinned master, while measured parsed-path overhead remains documented in the report and tracker; no performance-equivalence or migration-acceptance claim is adopted. The baseline used its independently built archive with an external read-only Git object view for manifest inspection. Full local artifacts are preserved under scratch/review-artifacts/2026-10-29 in the same checkout.
