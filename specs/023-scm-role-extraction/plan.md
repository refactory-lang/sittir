# Implementation Plan: SCM Role Extraction & Trivia

**Branch**: `023-scm-role-extraction` | **Date**: 2026-05-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/023-scm-role-extraction/spec.md`

## Summary

Extract `@comment` captures from tree-sitter `highlights.scm` query files to discover trivia kinds per grammar, then make the existing `$trivia()` stub functional — attaching leading/trailing comments to NodeData and rendering them in both TS and Rust engines.

## Technical Context

**Language/Version**: TypeScript 6.0.2 (ESM), Rust 1.88+
**Primary Dependencies**: `@sittir/core`, `@sittir/types`, `@sittir/codegen`, napi-rs 3, Askama 0.15
**Storage**: File system — reads `highlights.scm` from grammar packages at codegen time
**Testing**: Vitest for unit tests, existing validator suite for regression
**Target Platform**: Node.js (codegen), Browser/Node.js (runtime TS), Native (Rust napi)
**Project Type**: Compiler/codegen pipeline extension
**Performance Goals**: N/A — codegen-time tool, no runtime perf concern
**Constraints**: SCM parser handles subset only (node patterns + captures; predicates skipped)
**Scale/Scope**: 3 grammars (rust, typescript, python), ~450 lines total

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle | Status | Notes |
|---|---|---|
| I. Grammar Alignment | PASS | Uses tree-sitter SCM query syntax, `@comment` captures |
| II. Three-Layer Architecture | PASS | SCM parser in `@sittir/codegen`, types in `@sittir/types`, render in `@sittir/core` |
| III. Generated-Output Hygiene | PASS | `$trivia` type emitted by codegen; per-grammar signature in generated `utils.ts` |
| XI. DRY | PASS | Trivia kinds discovered from ONE source (`highlights.scm`), not hand-annotated |

No violations. No complexity tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/023-scm-role-extraction/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
└── checklists/
    └── requirements.md  # Quality checklist
```

### Source Code (repository root)

```text
packages/codegen/src/
├── scm/
│   ├── parse.ts         # SCM query file parser (subset)
│   └── extract-roles.ts # @comment → trivia role mapping
├── emitters/
│   └── client-utils.ts  # withMethods $trivia() implementation
└── __tests__/
    └── scm-trivia.test.ts

packages/types/src/
└── core-types.ts        # NodeTrivia type, $trivia on AnyNodeData

packages/core/src/
└── render.ts            # Trivia wrapper (prepend leading, append trailing)

rust/crates/sittir-core/src/
└── types.rs             # NodeTrivia Rust type

rust/crates/sittir-{lang}/src/render/
└── templates.rs         # Trivia render support
```
