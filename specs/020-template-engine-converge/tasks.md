# Tasks: Render Pipeline Optimization (020)

**Branch**: `020-render-pipeline-optimization`
**Input**: `specs/020-template-engine-converge/plan.md`, `spec.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/render-pipeline-compatibility.md`

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[US1]**: Native Askama rendering stops cloning field values at the context boundary (P1)
- **[US2]**: Native rendering can resolve fields directly from `NodeData` (P1)
- **[US3]**: Optimization rollout remains reversible and parity-gated (P1)
- **[US4]**: Contributors can explain both the retained baseline and the new optimization stages (P2)

---

## Phase 1: Setup

**Purpose**: Create the shared verification scaffolding used by all stories.

- [x] T001 Create `packages/codegen/src/__tests__/render-pipeline-optimization.test.ts` to hold baseline-convergence, Level 1, Level 3, fallback, public-surface, and cleanup guard assertions for feature 020
- [x] T002 Extend `tests/format-roundtrip/rust.test.ts`, `tests/format-roundtrip/typescript.test.ts`, and `tests/format-roundtrip/python.test.ts` with shared 020 helper coverage for borrowed-view parity and direct-render parity probes

---

## Phase 2: Foundational — Retained Baseline Convergence

**Purpose**: Finish the shared baseline convergence work that blocks every user story.

**⚠️ CRITICAL**: No user story work should begin until the standard regenerate workflow, canonical template ownership, centralized native crate layout, and zero-ceiling parity gate are aligned.

- [x] T003 Finish the single `--all` native artifact refresh path in `packages/codegen/src/cli.ts` and `packages/codegen/src/emitters/rust-render.ts` so TS and native artifacts regenerate from one workflow
- [x] T004 [P] Remove remaining grammar-local native crate and duplicate template path assumptions in `packages/codegen/src/emitters/templates.ts`, `packages/codegen/src/emitters/template-hash.ts`, and `packages/codegen/src/emitters/rust-render.ts`
- [x] T005 [P] Write failing baseline convergence assertions in `packages/codegen/src/__tests__/emit-jinja-templates.test.ts` and `packages/codegen/src/__tests__/render-pipeline-optimization.test.ts` for canonical template directories and centralized `rust/crates/sittir-render-{lang}` outputs
- [x] T006 Make the retained baseline convergence assertions pass and verify the aligned regenerate/template/crate layout with `packages/codegen/src/__tests__/collect-baseline.test.ts` and `packages/codegen/src/__tests__/emit-jinja-templates.test.ts`
- [ ] T007 Record the prerequisite zero-ceiling parity result with `packages/codegen/src/__tests__/collect-baseline.test.ts` and `tests/format-roundtrip/{rust,typescript,python}.test.ts`; block Level 1 work until both backends are clean for all supported grammars

**Checkpoint**: Baseline convergence is complete, the shared verification harness is ready, and parity debt is confirmed to be zero before optimization begins.

---

## Phase 3: User Story 1 - Native Askama rendering stops cloning field values at the context boundary (Priority: P1) 🎯 MVP

**Goal**: Remove the step-2→3 clone boundary by emitting borrowed Askama views from the existing `TemplateContext`.

**Independent Test**: Regenerate all three grammars, confirm generated Askama structs/dispatchers no longer clone template-backed scalar/list values, and re-run parity on both backends with unchanged canonical templates.

### Validation for User Story 1

- [x] T008 [P] [US1] Write failing Level 1 borrowed-view expectations in `packages/codegen/src/__tests__/render-pipeline-optimization.test.ts` for scalar, list, children, `variant`, and `text` field emission
- [x] T009 [P] [US1] Write failing Level 1 parity assertions in `tests/format-roundtrip/rust.test.ts`, `tests/format-roundtrip/typescript.test.ts`, and `tests/format-roundtrip/python.test.ts`

### Implementation for User Story 1

- [x] T010 [US1] Make the borrowed-view emission tests pass by updating Askama struct generation in `packages/codegen/src/emitters/rust-render.ts` so generated template structs borrow from `TemplateContext`
- [x] T011 [US1] Make the dispatcher assertions pass by updating borrowed dispatcher construction in `packages/codegen/src/emitters/rust-render.ts` to replace per-field clone extraction with borrowed accessors and slices
- [x] T012 [US1] Regenerate native render crates for all grammars via `packages/codegen/src/cli.ts` so `rust/crates/sittir-render-rust/src/templates.rs`, `rust/crates/sittir-render-typescript/src/templates.rs`, and `rust/crates/sittir-render-python/src/templates.rs` reflect borrowed Askama views
- [x] T013 [US1] Make the Level 1 codegen and parity suites pass across all three grammars with `packages/codegen/src/__tests__/render-pipeline-optimization.test.ts` and `tests/format-roundtrip/{rust,typescript,python}.test.ts`

**Checkpoint**: Level 1 is fully functional and testable across `rust`, `typescript`, and `python`.

---

## Phase 4: User Story 2 - Native rendering can resolve fields directly from `NodeData` (Priority: P1)

**Goal**: Replace the `TemplateContext`-driven render hot path with generated direct-render functions driven by model data.

**Independent Test**: Regenerate all three grammars with the direct-render path active, then prove parity for leaf fields, structured fields, repeated fields, scalar/list dual-use fields, unknown/non-template fallback behavior, variant routing, format-aware behavior, and child/flank behavior without relying on runtime `TemplateContext` maps.

### Validation for User Story 2

- [x] T014 [P] [US2] Write failing direct-render emission assertions in `packages/codegen/src/__tests__/render-pipeline-optimization.test.ts` for leaf, optional, repeated, children, variant, mixed-borrow, and safe fallback strategies
- [x] T015 [P] [US2] Write failing Level 3 parity probes in `tests/format-roundtrip/rust.test.ts`, `tests/format-roundtrip/typescript.test.ts`, and `tests/format-roundtrip/python.test.ts` for leaf fields, structured fields, scalar/list dual-use behavior, unknown-kind fallback, child/flank behavior, variant routing, and format-aware rendering

### Implementation for User Story 2

- [x] T016 [US2] Make the helper assertions pass by emitting shared Level 3 resolve helpers in `packages/codegen/src/emitters/rust-render.ts` for leaf, optional, required, repeated, child, and variant resolution
- [x] T017 [US2] Make the mixed-borrow and fallback assertions pass by emitting per-kind `render_<kind>` functions with stack-owned structured renders, borrowed leaf text, and safe non-template fallback branches in `packages/codegen/src/emitters/rust-render.ts`
- [x] T018 [US2] Inline separator, leaf-kind, and variant routing metadata in `packages/codegen/src/emitters/rust-render.ts` so direct render dispatch no longer depends on runtime `GrammarMeta` lookups
- [x] T019 [US2] Switch generated native dispatch to the direct-render functions in `packages/codegen/src/emitters/rust-render.ts` and `packages/codegen/src/cli.ts` for all supported grammars
- [x] T020 [US2] Regenerate `rust/crates/sittir-render-rust/src/{lib.rs,templates.rs}`, `rust/crates/sittir-render-typescript/src/{lib.rs,templates.rs}`, and `rust/crates/sittir-render-python/src/{lib.rs,templates.rs}` via `packages/codegen/src/cli.ts` to materialize the direct-render path
- [x] T021 [US2] Make the pre-cleanup Level 3 codegen and parity suites pass with `packages/codegen/src/__tests__/render-pipeline-optimization.test.ts` and `tests/format-roundtrip/{rust,typescript,python}.test.ts`

**Checkpoint**: The direct-render path is active and parity-clean before any cleanup removes the legacy preparation layer.

---

## Phase 5: User Story 3 - Optimization rollout remains reversible and parity-gated (Priority: P1)

**Goal**: Keep the rollout reversible until parity proof is complete, then remove the legacy preparation/filter bridge safely.

**Independent Test**: Show that cleanup cannot happen without all-grammar parity evidence, retain the legacy path while proving the direct path, preserve the unchanged `render(node_json) -> String` surface, and only then remove obsolete preparation-only runtime code.

### Validation for User Story 3

- [x] T022 [P] [US3] Write failing staged-rollout guard assertions in `packages/codegen/src/__tests__/render-pipeline-optimization.test.ts` and `packages/codegen/src/__tests__/collect-baseline.test.ts` so cleanup requires all-grammar parity evidence and recorded verification artifacts
- [x] T023 [P] [US3] Write failing compatibility assertions in `packages/codegen/src/__tests__/render-pipeline-optimization.test.ts` for unchanged Askama/`.jinja` ownership, centralized native crate outputs, and the existing native `render(node_json) -> String` boundary

### Implementation for User Story 3

- [x] T024 [US3] Keep the legacy preparation path available during proof by updating `rust/crates/sittir-core/src/lib.rs` and `rust/crates/sittir-core/src/prepare.rs` to coexist with the direct-render path
- [x] T025 [US3] Record and verify Level 1 and Level 3 gate results in `specs/020-template-engine-converge/research.md` and `specs/020-template-engine-converge/quickstart.md` before final cleanup signoff
- [x] T026 [US3] Remove obsolete preparation/bridge code from `rust/crates/sittir-core/src/prepare.rs`, `rust/crates/sittir-core/src/filters.rs`, and `rust/crates/sittir-core/src/lib.rs` only after all three grammars pass the direct path
- [x] T027 [US3] Reconcile post-cleanup shared runtime types and helper exports in `rust/crates/sittir-core/src/types.rs` and `rust/crates/sittir-core/src/read_node.rs` with the direct-render design
- [x] T028 [US3] Make the rollback/parity closure and compatibility checks pass using `packages/codegen/src/__tests__/collect-baseline.test.ts`, `packages/codegen/src/__tests__/render-pipeline-optimization.test.ts`, `tests/format-roundtrip/{rust,typescript,python}.test.ts`, and spot checks of `rust/crates/sittir-{rust,typescript,python}-napi/src/lib.rs`

**Checkpoint**: Cleanup is complete, parity is re-proven, rollback-only scaffolding is gone, and the public native render boundary is unchanged.

---

## Phase 6: User Story 4 - Contributors can explain both the retained baseline and the new optimization stages (Priority: P2)

**Goal**: Make the final architecture easy to explain from docs and generator-facing guidance.

**Independent Test**: A contributor can answer where templates live, where native render crates live, why unknown/non-template kinds still fall back safely, and how Level 1 differs from Level 3 by reading the updated docs and generator comments alone.

### Implementation for User Story 4

- [x] T029 [P] [US4] Update contributor docs in `README.md` and `CLAUDE.md` for canonical template ownership, centralized native crate paths, direct-render fallback behavior, and the Level 1 vs Level 3 distinction
- [x] T030 [P] [US4] Update generator-facing docs/comments in `packages/codegen/src/emitters/templates.ts` and `packages/codegen/src/emitters/rust-render.ts` to explain shared template ownership, fallback expectations, and the direct-render stages
- [x] T031 [US4] Update feature guidance in `specs/020-template-engine-converge/spec.md`, `specs/020-template-engine-converge/plan.md`, and `specs/020-template-engine-converge/quickstart.md` with final implementation notes
- [x] T032 [US4] Validate the documentation and compatibility story by checking paths, commands, fallback notes, and the unchanged render boundary in `README.md`, `CLAUDE.md`, `specs/020-template-engine-converge/quickstart.md`, and `rust/crates/sittir-{rust,typescript,python}-napi/src/lib.rs`

**Checkpoint**: Documentation and generator guidance reflect the shipped architecture consistently.

---

## Final Phase: Polish & Cross-Cutting Concerns

- [x] T033 [P] Run `pnpm -r run type-check` and fix residual type issues in touched files under `packages/codegen/src/**` and `rust/crates/sittir-core/src/**`
- [x] T034 [P] Run `pnpm test` and fix regressions in `packages/codegen/src/__tests__/**` and `tests/format-roundtrip/**`
- [x] T035 Verify the standard regenerate workflow via `packages/codegen/src/cli.ts` and spot-check generated outputs in `rust/crates/sittir-render-{rust,typescript,python}/src/` before merge
- [x] T036 Create a checkpoint commit for the completed 020 implementation after validation passes and before requesting final review

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; start immediately
- **Foundational (Phase 2)**: Depends on Setup; blocks all user stories
- **US1 (Phase 3)**: Depends on Foundational completion
- **US2 (Phase 4)**: Depends on US1 completion because Level 1 lands before Level 3
- **US3 (Phase 5)**: Depends on US2 pre-cleanup direct-render proof
- **US4 (Phase 6)**: Depends on US3 so docs reflect the final shipped state
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### Task Dependency Graph

```text
T001 -> T005, T008, T014, T022, T023
T002 -> T007, T009, T015

T003 -> T005, T012, T020, T035
T004 -> T005
T005 -> T006
T006 -> T007
T007 -> T008, T009, T010

T008 -> T013
T009 -> T013
T010 -> T011
T011 -> T012
T012 -> T013

T013 -> T014, T015, T016
T014 -> T021
T015 -> T021
T016 -> T017, T018
T017 -> T019
T018 -> T019
T019 -> T020
T020 -> T021

T021 -> T022, T023, T024, T025
T022 -> T026, T028
T023 -> T028, T032
T024 -> T026
T025 -> T026
T026 -> T027, T028
T027 -> T028

T028 -> T029, T030, T031, T033, T034
T029 -> T032
T030 -> T032
T031 -> T032

T032 -> T033, T034, T035
T033 -> T035, T036
T034 -> T035, T036
T035 -> T036
```

### User Story Dependencies

- **US1**: Starts after foundational convergence is complete and the zero-ceiling parity prerequisite is recorded
- **US2**: Starts after US1 because the feature requires Level 1 to land before Level 3
- **US3**: Starts after US2 because rollback/cleanup logic depends on the active direct-render path
- **US4**: Starts after US3 so documentation reflects the finalized implementation rather than an in-flight mixed state

### Within Each User Story

- Validation tasks are **failing-test-first** tasks and should be written before implementation changes begin
- Implementation tasks should make the new failing assertions pass before regeneration/final validation
- Generator emission changes happen before regeneration tasks
- Regeneration happens before parity validation
- Cleanup never happens before full-grammar parity proof and recorded gate evidence

---

## Parallel Execution Examples

### US1 — once foundational convergence is done

```bash
# Validation scaffolding can move in parallel:
Task: "T008 Write failing Level 1 borrowed-view expectations in packages/codegen/src/__tests__/render-pipeline-optimization.test.ts"
Task: "T009 Write failing Level 1 parity assertions in tests/format-roundtrip/{rust,typescript,python}.test.ts"
```

### US2 — once Level 1 is parity-clean

```bash
# Direct-render proof coverage can move in parallel:
Task: "T014 Write failing direct-render emission assertions in packages/codegen/src/__tests__/render-pipeline-optimization.test.ts"
Task: "T015 Write failing Level 3 parity probes in tests/format-roundtrip/{rust,typescript,python}.test.ts"
```

### US3 — while the direct path is being proven

```bash
# One contributor can prepare cleanup guards while another preserves compatibility checks:
Task: "T022 Write failing staged-rollout guard assertions in packages/codegen/src/__tests__/render-pipeline-optimization.test.ts and packages/codegen/src/__tests__/collect-baseline.test.ts"
Task: "T023 Write failing compatibility assertions in packages/codegen/src/__tests__/render-pipeline-optimization.test.ts"
```

### US4 — after cleanup is complete

```bash
# Documentation streams can run in parallel:
Task: "T029 Update contributor docs in README.md and CLAUDE.md"
Task: "T030 Update generator-facing docs/comments in packages/codegen/src/emitters/templates.ts and packages/codegen/src/emitters/rust-render.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational convergence + zero-ceiling parity gate
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: confirm borrowed Askama views and parity remain clean across all three grammars

### Incremental Delivery

1. Finish retained baseline convergence
2. Record the prerequisite parity-zero gate
3. Land Level 1 across all grammars (US1) and validate parity
4. Land direct-render emission and dispatch across all grammars (US2)
5. Prove rollback/cleanup gates, then remove the legacy preparation path (US3)
6. Update docs and contributor guidance last (US4)

### Suggested MVP Scope

**MVP**: T001–T013 (Setup + Foundational + US1). This delivers the first user-visible optimization win by removing the clone boundary while preserving canonical templates and existing public APIs.

---

## Notes

- `[P]` tasks touch different files or validation surfaces and can be parallelized safely
- All generated native render crate changes must flow through `packages/codegen/src/**`; do not hand-edit generated outputs
- The direct-render proof set explicitly covers unknown/non-template fallback behavior, scalar/list dual-use fields, mixed borrow lifetimes, variant routing, and format-aware parity
- Each story phase ends with an independent validation checkpoint before the next phase begins
- `pnpm test` and `pnpm -r run type-check` remain the global correctness gates for this feature
