# Implementation Plan: Override-Compiled Parser with Nested-Alias Polymorphs

**Branch**: `007-override-compiled-parser` | **Date**: 2026-04-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-override-compiled-parser/spec.md`
**Depends on**: PR #9 (`006-override-dsl-enrich`) must merge first.

## Summary

Switch the sittir pipeline from heuristic field promotion (inferFieldNames, promotePolymorph in Link + readNode promotion) to consuming override-compiled parse trees where all field labels are natively embedded by tree-sitter. Fix bare keyword-prefix promotion in enrich to cover the fields that inferFieldNames currently infers. Convert polymorphic rules to nested-alias form via transform() patches. Add lazy parser compilation with mtime-based caching. Delete Link's mutating heuristic passes, preserving their analysis as suggestion-only output.

## Technical Context

**Language/Version**: TypeScript (ESM, `.ts` extensions in imports), TypeScript 6.0.2
**Primary Dependencies**: tree-sitter-cli ^0.26.7, web-tree-sitter ^0.26.7, esbuild (transpile bridge from spec 006), Emscripten (emsdk, for WASM compilation)
**Storage**: File system — `.sittir/` directory per grammar for transpiled grammar.js, compiled parser WASM, parser.c, node-types.json
**Testing**: Vitest — corpus-validation (fidelity ceilings), roundtrip, factory-roundtrip, readNode-roundtrip, unit tests
**Target Platform**: macOS (dev), Linux (CI) — native parser binaries are platform-specific
**Project Type**: Compiler / codegen tool (library-first per constitution)
**Performance Goals**: Warm cache codegen <1s overhead (SC-004); cold compile <30s per grammar (SC-005)
**Constraints**: Zero runtime dependencies in generated packages; ast-grep rule compatibility preserved; fidelity ceilings must not regress
**Scale/Scope**: 3 grammars (rust, typescript, python); ~1,627 lines in link.ts; estimated <20 polymorph rules per grammar

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Grammar Alignment | ✓ PASS | Uses tree-sitter terminology throughout (kind, field, named, alias, supertype) |
| II. Fewer Abstractions | ✓ PASS | Net reduction — deleting inferFieldNames mutation, promotePolymorph, readNode promotion heuristics. No new abstraction layers added |
| III. Generated vs Hand-Written | ✓ PASS | Override files are hand-authored; generated output remains codegen-owned. Parser cache is a build artifact, not generated code |
| IV. Test-First | ✓ PASS | Fidelity ceilings are the primary quality gate. New parse-tree field validation tests for override-compiled parser |
| V. Library-First | ✓ PASS | No CLI changes beyond existing `--grammar` flag. Parser compilation is internal to codegen |
| VI. Deterministic Output | ✓ PASS | Same overrides.ts + same grammar version → same generated output. Parser binary is cached but not part of generated output |
| VII. Grammar-Agnostic Pipeline | ✓ PASS | All language-specific knowledge flows through override files. Parser compilation is grammar-parameterized, not language-conditional |
| VIII. Non-lossy Transformations | ✓ PASS | Nested-alias preserves parent kind name (no information loss). inferFieldNames analysis preserved as suggestion-only |

**Gate result**: All 8 principles pass. No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/007-override-compiled-parser/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── parser-loading.md
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
packages/codegen/
├── src/
│   ├── compiler/
│   │   ├── link.ts              # MODIFY: delete inferFieldNames mutation, promotePolymorph, promoteOptionalKeywordFields; preserve analysis as suggestion-only
│   │   ├── evaluate.ts          # MINOR: no changes expected
│   │   ├── generate.ts          # MODIFY: integrate parser compilation step
│   │   ├── optimize.ts          # NO CHANGE
│   │   ├── assemble.ts          # NO CHANGE
│   │   └── rule.ts              # NO CHANGE
│   ├── dsl/
│   │   ├── enrich.ts            # MODIFY: add bare keyword-prefix pass (leading seq position only)
│   │   ├── transform.ts         # NO CHANGE (nested-alias uses existing transform API)
│   │   └── ...                  # NO CHANGE
│   ├── transpile/
│   │   ├── transpile-overrides.ts  # MODIFY: add parser compilation + caching logic
│   │   └── compile-parser.ts       # NEW: lazy compile to WASM with mtime cache
│   ├── emitters/
│   │   ├── suggested.ts         # MODIFY: consume suggestion-only inferFieldNames output
│   │   ├── wrap.ts              # MODIFY: delete field-promotion heuristics in readNode
│   │   └── from.ts              # MINOR: may simplify if readNode handles all fields
│   └── validators/
│       └── common.ts            # MODIFY: load override-compiled parser instead of base WASM
├── __tests__/
│   ├── corpus-validation.test.ts  # MODIFY: update fidelity ceilings
│   └── compile-parser.test.ts     # NEW: parser compilation + cache tests

packages/python/
├── overrides.ts                   # MODIFY: add bare keyword-prefix coverage, nested-alias polymorphs
└── .sittir/
    ├── grammar.js                 # EXISTS (from spec 006 transpile)
    ├── src/parser.c               # NEW (generated by tree-sitter generate)
    ├── node-types.json            # NEW (generated by tree-sitter generate, override field labels)
    └── parser.wasm                # NEW (compiled by tree-sitter build --wasm, cached)

packages/rust/
├── overrides.ts                   # MODIFY: add nested-alias polymorphs
└── .sittir/                       # Same structure as python

packages/typescript/
├── overrides.ts                   # MODIFY: add nested-alias polymorphs
└── .sittir/                       # Same structure as python
```

**Structure Decision**: Extends existing monorepo layout. New code lives in `packages/codegen/src/transpile/` (parser compilation) and `packages/codegen/src/compiler/` (Link cleanup). Override file changes are per-grammar in `packages/{lang}/overrides.ts`.

## Post-Design Constitution Re-Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Grammar Alignment | ✓ PASS | Uses tree-sitter terminology: alias, field, kind, named. Nested-alias is a tree-sitter concept |
| II. Fewer Abstractions | ✓ PASS | Net reduction: deleting 3 heuristic passes + readNode promotion. New: 1 module (compile-parser.ts) |
| III. Generated vs Hand-Written | ✓ PASS | Override files hand-authored. Parser WASM is a build artifact. Generated output codegen-owned |
| IV. Test-First | ✓ PASS | Fidelity ceilings validate field coverage. New compile-parser tests. Nested-alias verified via roundtrip |
| V. Library-First | ✓ PASS | Parser compilation internal to codegen CLI. No new external dependencies in generated packages |
| VI. Deterministic Output | ✓ PASS | Same overrides.ts → same WASM → same parse trees → same generated code |
| VII. Grammar-Agnostic Pipeline | ✓ PASS | Compilation parameterized by grammar name. No language-specific conditionals. Polymorph overrides live in per-grammar override files |
| VIII. Non-lossy Transformations | ✓ PASS | inferFieldNames analysis preserved as suggestion-only. Nested-alias preserves parent kind. No field coverage regression |

**Gate result**: All 8 principles pass post-design. No violations.

## Implementation Strategy

### Phase Ordering

The spec defines 5 user stories with explicit dependencies:

1. **US2 (P1) — Bare keyword-prefix**: Must come first. Without this, fields that inferFieldNames currently adds would be absent from the override-compiled parser.
2. **US4 (P2) — Lazy parser compilation**: Prerequisite for US1. Pipeline needs to compile and load the override parser before it can use it.
3. **US1 (P1) — Override-compiled parser integration**: Core value. Switches the pipeline to use the compiled parser for all parse operations.
4. **US3 (P2) — Nested-alias polymorphs**: Can proceed in parallel with US1 once the parser compilation infrastructure is in place.
5. **US5 (P3) — Link cleanup**: Final step. Only after US1-US4 are validated.

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| WASM compilation slow (Emscripten) | Mtime-based caching eliminates repeat builds. Cold compile measured at research time |
| Bare keyword-prefix regresses fidelity | Conservative: leading position of top-level seq only, collision-aware. Same approach that worked for optional variant |
| Nested-alias breaks ast-grep rules | Design: parent kind name preserved at outer level. Validate with existing ast-grep rule suite |
| Emscripten not installed on CI/dev | Document prerequisite. CI: add emsdk setup step. Dev: one-time install |
| Polymorph count exceeds estimate | Audited: 16 total (1 python, 6 rust, 9 typescript). Manageable |
