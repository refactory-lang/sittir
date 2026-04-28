# Implementation Plan: Render Pipeline Optimization

**Branch**: `020-render-pipeline-optimization` | **Date**: 2026-04-28 | **Spec**: [`specs/020-template-engine-converge/spec.md`](./spec.md)
**Input**: Feature specification from `/specs/020-template-engine-converge/spec.md`

## Summary

Finish any remaining baseline convergence owned by 020, then optimize the native render pipeline in two staged rollouts across `rust`, `typescript`, and `python`. Level 1 is a generator-driven change that rewrites generated Askama structs and dispatchers to borrow from `TemplateContext` instead of cloning. Level 3 is an architectural refactor that emits direct `NodeData` render functions, inlines render metadata, removes the legacy preparation bridge after byte-identical parity is proven, and leaves `sittir-core::filters` as the shared Askama-filter surface.

## Technical Context

**Language/Version**: TypeScript 6.0.2 (workspace ESM) and Rust 1.82+  
**Primary Dependencies**: `@sittir/codegen`, `@sittir/core`, `@sittir/types`, Askama 0.14, napi-rs 3, `web-tree-sitter`, centralized native render crates under `rust/crates/sittir-render-{lang}`  
**Storage**: File system only (generated templates, generated native crates, spec artifacts, parity baselines); no runtime persistence  
**Testing**: `pnpm test`, `pnpm -r run type-check`, feature 016 parity baselines, native crate build/test coverage where touched  
**Target Platform**: Node.js codegen environment plus Rust native-render workspace in local development and CI  
**Project Type**: Library + code generator + generated native render crates  
**Performance Goals**: remove step-2→3 scalar/list clones in Level 1; remove per-render field/field-list map allocations in Level 3; preserve byte-identical output on both backends  
**Constraints**: canonical `.jinja` templates stay shared; Askama and N-API surfaces stay unchanged; generated files are never hand-edited; both levels complete across all three grammars together; parity ceilings must be zero before optimization begins  
**Scale/Scope**: 3 grammars, 2 optimization levels, centralized native render crates, shared runtime cleanup in `sittir-core`, docs/regeneration/parity validation updates

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle | Pre-Research Status | Design Notes |
| --- | --- | --- |
| I. Grammar Alignment | PASS | All field/kind/separator decisions continue to flow from grammar-derived model data rather than renamed abstractions. |
| II. Fewer Abstractions | PASS | Level 1 removes clones without adding a second transport; Level 3 replaces `TemplateContext` instead of layering another IR over it. |
| III. Generated vs Hand-Written | PASS | Changes land in codegen emitters and hand-written runtime helpers; generated `templates.rs` and grammar outputs remain regeneration-only. |
| IV. Test-First | PASS | Existing parity suites and generated tests remain the gating evidence before cleanup removes the legacy path. |
| V. Library-First | PASS | No new CLI/runtime formatting ownership; Askama and N-API render entrypoints remain library surfaces only. |
| VI. Deterministic Output | PASS | One canonical template source and one regenerate workflow remain intact; no benchmark-only toggles become correctness dependencies. |
| VII. Grammar-Agnostic Pipeline | PASS | Render metadata selection is model-driven and shared across grammars; any unavoidable exceptions stay in one declared table. |
| VIII. Non-lossy Transformations | PASS | Direct-render helpers must preserve leaf/text/children/format semantics exactly; no cleanup happens before parity proof. |
| IX. `@sittir/core` is the Rust-port surface | PASS | The plan reduces runtime weight in `sittir-core` rather than adding new TypeScript-only concepts there. |
| X. Don't hand-roll types you can import | PASS | Direct-render helpers consume existing `NodeData` and grammar metadata shapes rather than redeclaring parallel transport types. |
| XI. DRY — One Source, One Derivation | PASS | The plan preserves one canonical template source and moves render metadata toward single-source model derivation rather than duplicate walkers. |

**Gate Result (pre-research)**: PASS

**Post-Design Re-check**: PASS — the Phase 1 artifacts keep generator ownership, grammar-derived metadata, and parity-gated cleanup intact. No constitution violation needs a complexity waiver.

## Project Structure

### Documentation (this feature)

```text
specs/020-template-engine-converge/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── render-pipeline-compatibility.md
└── tasks.md
```

### Source Code (repository root)

```text
packages/codegen/src/
├── cli.ts
├── emitters/
│   ├── templates.ts
│   ├── rust-render.ts
│   └── template-hash.ts
└── __tests__/

packages/rust/templates/
packages/typescript/templates/
packages/python/templates/

rust/crates/sittir-core/src/
├── lib.rs
├── filters.rs
├── read_node.rs
├── splice.rs
└── types.rs

rust/crates/sittir-render-rust/src/
rust/crates/sittir-render-typescript/src/
rust/crates/sittir-render-python/src/

specs/016-parity-regressions/baselines/
tests/format-roundtrip/
```

**Structure Decision**: Keep the feature generator-centric. Codegen emitter changes live under `packages/codegen/src/`; shared runtime cleanup stays constrained to `rust/crates/sittir-core/src/`; generated per-grammar native render crates remain under `rust/crates/sittir-render-{lang}` and are regenerated, never hand-edited.

## Phase 0: Research

**All NEEDS CLARIFICATION resolved** — the clarifications and research lock in the architectural rollout.

Key decisions (see [`research.md`](./research.md) for full rationale):

- 020 owns any unfinished baseline convergence work rather than assuming a separate prerequisite feature.
- Level 1 stays codegen-only and changes the generated Askama view, not authored templates or public APIs.
- Level 3 emits direct-render helpers/functions from model data and removes the preparation layer only after parity proof.
- Render metadata stays model-driven and inlined rather than re-derived in a second runtime metadata layer.
- Each optimization level is only complete when all three supported grammars have landed it.
- Verification remains parity-first: structural optimization targets plus regenerate/test/parity gates, not a new benchmark harness.

## Phase 1: Design & Contracts

### Data Model

[`data-model.md`](./data-model.md) defines the runtime/codegen entities that evolve across baseline, Level 1, and Level 3:

- canonical template bundle
- centralized native render crate
- legacy `TemplateContext`
- borrowed Askama view
- direct render function
- resolve helper set

### Contracts

[`contracts/render-pipeline-compatibility.md`](./contracts/render-pipeline-compatibility.md) captures the stable compatibility surface for:

- canonical template ownership
- centralized native crate location
- standard regenerate workflow
- unchanged N-API/render entrypoints
- Level 1 borrowed-view invariants
- Level 3 direct-render cleanup gate

### Quickstart

[`quickstart.md`](./quickstart.md) provides the implementation/verification sequence for:

1. confirming retained baseline convergence
2. regenerating all three grammars from the standard workflow
3. implementing Level 1 across all grammars
4. staging Level 3 until parity is proven
5. validating final cleanup before merge

### Post-Design Constitution Re-check

The design artifacts keep generator ownership, grammar-derived metadata, and parity-gated cleanup intact. No constitution violation emerged during Phase 1, so `Complexity Tracking` remains empty.

## Complexity Tracking

No constitution exception currently requires a waiver.
