# Implementation Plan: Binding, Simplify, Assemble + De-hoisted NodeData

**Branch**: `022-binding-simplify-assemble` | **Date**: 2026-05-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/022-binding-simplify-assemble/spec.md`

## Summary

Re-architect the codegen compiler pipeline into three clear phases
(Binding → Simplify → Assemble) that produce a constituent-oriented
model. Then apply that model to the consumer surface: remove `$fields`,
de-hoist named members to top-level, replace fluent methods with `$with`
namespace, `$`-prefix all sittir methods, and unify factory/wrap
surfaces. Terminal values stored as plain strings; nonterminal values
stored as NodeData stubs with drill-in.

## Technical Context

**Language/Version**: TypeScript 6.0.2 (ESM), Rust 1.88+
**Primary Dependencies**: `@sittir/core`, `@sittir/types`, `@sittir/codegen`, tree-sitter, napi-rs 3, Askama 0.15
**Storage**: File system (generated TS/Rust per grammar)
**Testing**: Vitest (TS), cargo test (Rust), native RT validator (Askama), factory round-trip
**Target Platform**: Node.js (ESM), Rust (napi + wasm)
**Project Type**: Code generation library / compiler pipeline
**Performance Goals**: Native RT ≥114/124/108 (python/rust/typescript). Factory RT failures → 0.
**Constraints**: Zero runtime dependencies in generated packages. Incremental migration — each commit passes tests.
**Scale/Scope**: 3 grammars (rust/typescript/python), ~15K lines generated per grammar, ~2700 lines in render-module emitter.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Grammar Alignment | ✅ Pass | `$child`/`$children` align with tree-sitter conventions. Named members use raw grammar field names. |
| II. Fewer Abstractions | ✅ Pass | Removes `$fields` wrapper, `NodeFieldValue`/`NodeChildValue` split, per-field fluent methods. Net -1500 lines. |
| III. Generated vs Hand-Written | ✅ Pass | Changes are in emitters (codegen) and core runtime. Generated output regenerated, never hand-edited. |
| IV. Test-First | ✅ Pass | Each phase validated by native RT (≥114/124/108) + factory RT (→0). |
| V. Library-First | ✅ Pass | `$with` is the consumer API. No CLI/formatting concerns. |
| VI. Deterministic Output | ✅ Pass | Same grammar → same output. No new sources of nondeterminism. |
| VII. Grammar-Agnostic Pipeline | ✅ Pass | Binding/Simplify/Assemble are grammar-agnostic. Terminal classification derives from the rule tree. |
| VIII. Non-lossy Transformations | ✅ Pass | Constituent model preserves all rule-tree information. `RuleId` provenance carried forward. |
| IX. Core is Rust-port surface | ✅ Pass | `withMethods` is JS-side generated code, not core. `readNode` changes are minimal. Rust `NodeData` uses `#[serde(flatten)]`. |
| X. Don't hand-roll types | ✅ Pass | `NodeMemberValue` unifies existing types, doesn't create new abstractions. |
| XI. DRY | ✅ Pass | Central goal: one constituent model → one derivation for all emitters. Eliminates the `$fields`/`$children` dual-ontology. |

No violations. No Complexity Tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/022-binding-simplify-assemble/
├── spec.md              # Feature specification (amended)
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── rt-failure-inventory.md  # RT numbers + failure analysis
├── rt-failure-details.md    # Per-kind failure breakdown
└── rt-failure-details-adr017.md  # ADR-0017 branch details
```

### Source Code (repository root)

```text
packages/types/src/
├── core-types.ts        # AnyNodeData, NodeMemberValue, NodeBase, NodeWithChildren, NodeWithChild
└── index.ts             # Re-exports

packages/core/src/
├── readNode.ts          # Top-level field assignment (de-hoist)
├── render.ts            # Top-level field reading (de-hoist)
└── engine.ts            # $source numeric, readNode dispatch

packages/codegen/src/
├── compiler/
│   ├── bind.ts          # NEW: Binding phase
│   ├── simplify.ts      # MODIFY: Simplify phase (constituent model)
│   ├── assemble.ts      # MODIFY: Assemble from constituents
│   ├── node-map.ts      # MODIFY: AssembledNode — constituent-based
│   └── types.ts         # MODIFY: BindingResult, constituent types
├── emitters/
│   ├── types.ts         # MODIFY: Shape A/B/C interfaces, $with types
│   ├── factories.ts     # MODIFY: De-hoist, $with namespace, withMethods
│   ├── wrap.ts          # MODIFY: drillIn getters + $with
│   ├── client-utils.ts  # MODIFY: Transport projection (identity for terminals)
│   └── render-module.ts # MODIFY: Rust transport — flatten + MemberValue
└── validate/
    └── roundtrip.ts     # Native render path (already done)

rust/crates/sittir-core/src/
├── types.rs             # NodeData flatten + MemberValue enum
└── read_node.rs         # Top-level field assignment

packages/{rust,typescript,python}/src/
├── types.ts             # Regenerated: Shape A/B/C interfaces
├── factories.ts         # Regenerated: $with + withMethods
├── wrap.ts              # Regenerated: drillIn + $with
└── utils.ts             # Regenerated: transport projection
```

**Structure Decision**: Existing workspace structure. No new packages or directories beyond `compiler/bind.ts`.
