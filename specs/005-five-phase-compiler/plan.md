# Implementation Plan: Five-Phase Grammar Compiler

**Branch**: `005-five-phase-compiler` | **Date**: 2026-04-11 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/005-five-phase-compiler/spec.md`
**Design Document**: `specs/sittir-grammar-compiler-spec.md` (authoritative reference for types, function signatures, migration mappings)

## Summary

Rewrite the `@sittir/codegen` pipeline from its current ad-hoc architecture (~36 files, module-level caches, interleaved concerns) into a five-phase compiler: Evaluate → Link → Optimize → Assemble → Emit. Each phase is a stateless pure function with a typed contract. grammar.js is the sole input (no grammar.json). Overrides are grammar extensions using tree-sitter's native `grammar(base, { rules })` mechanism — each rule function receives `($, original)` where `original` is the base rule. New DSL primitives (`transform`/`insert`/`replace`) operate on `original` for surgical modifications. No custom two-pass system — tree-sitter's `grammar()` handles the merge. Link generates a suggested overrides file from reference graph analysis. Big bang rewrite — single branch, full replacement.

Reference implementation of tree-sitter's DSL saved at `specs/005-five-phase-compiler/reference/tree-sitter-dsl.js`.

## Technical Context

**Language/Version**: TypeScript 6.0.2 (ESM, `.ts` extensions in imports)
**Primary Dependencies**: None at runtime (zero-dep). Dev: vitest, oxlint, oxfmt, tsgo
**Storage**: File system (grammar.js input, overrides.ts, generated .ts/.yaml output)
**Testing**: Vitest — existing e2e validation tests as correctness contract, plus new per-phase unit tests
**Target Platform**: Node.js (codegen CLI tool)
**Project Type**: Compiler / code generator
**Performance Goals**: Process any supported grammar in under 5 seconds
**Constraints**: Deterministic output (byte-identical for same input). Zero language-specific conditionals.
**Scale/Scope**: 3 supported grammars (Rust, TypeScript, Python), ~250 grammar rules each, ~36 current source files → ~8-10 new source files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Grammar Alignment | PASS | All terminology aligns with tree-sitter: kind, field, named, anonymous, supertype, children. Design doc uses these consistently. |
| II. Fewer Abstractions | PASS | Consolidates ~36 files into ~8-10. Eliminates scattered helpers, intermediate model types, wrapper layers. Nine model types is the minimum needed (each has distinct emitter behavior). |
| III. Generated vs Hand-Written | PASS | Compiler code is hand-written. Generated output (types.ts, factories.ts, etc.) unchanged in structure. Clear separation maintained. |
| IV. Test-First | PASS | E2e validation tests are the correctness contract. Per-phase unit tests added. Golden file snapshots for investigation. |
| V. Library-First | PASS | Codegen remains a CLI tool; generated packages remain libraries. No new runtime concerns. |
| VI. Deterministic Output | PASS | All phases are pure functions with deterministic output. Module-level caches eliminated. No order-dependent iteration. |
| VII. Grammar-Agnostic Pipeline | PASS with caveat | Design eliminates language-specific conditionals. Known existing violation: `emitters/types.ts:63-65` (integer_literal/float_literal/boolean_literal checks) must be removed in this rewrite. |
| VIII. Non-lossy Transformations | PASS | Optimize preserves all named content. Form collapse preserves mergedRules. Design doc explicitly tracks what Optimize can/cannot change. |

**Gate result: PASS** — no violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/005-five-phase-compiler/
├── spec.md              # Feature specification (done)
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (phase contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
packages/codegen/src/
├── compiler/
│   ├── rule.ts          # Shared Rule IR type (defined once)
│   ├── evaluate.ts      # Phase 1: grammar.js → RawGrammar (two-pass with overrides)
│   ├── link.ts          # Phase 2: RawGrammar → LinkedGrammar (+ suggested overrides)
│   ├── optimize.ts      # Phase 3: LinkedGrammar → OptimizedGrammar
│   └── assemble.ts      # Phase 4: OptimizedGrammar → NodeMap
├── emitters/
│   ├── types.ts         # Phase 5: NodeMap → types.ts
│   ├── factories.ts     # Phase 5: NodeMap → factories.ts
│   ├── templates.ts     # Phase 5: NodeMap → templates.yaml
│   ├── from.ts          # Phase 5: NodeMap → from.ts (derives from factory signatures)
│   ├── ir.ts            # Phase 5: NodeMap → ir.ts (derives from factory exports)
│   ├── wrap.ts          # Phase 5: NodeMap → wrap.ts
│   ├── consts.ts        # Phase 5: NodeMap → consts.ts
│   ├── grammar.ts       # Phase 5: NodeMap → grammar.ts
│   ├── index-file.ts    # Phase 5: NodeMap → index.ts
│   ├── test-new.ts      # Phase 5: NodeMap → test files
│   ├── type-test.ts     # Phase 5: NodeMap → type tests
│   ├── config.ts        # Phase 5: NodeMap → config
│   ├── client-utils.ts  # Phase 5: NodeMap → utils.ts
│   └── suggested.ts     # Phase 5: LinkedGrammar → overrides.suggested.ts
├── cli.ts               # CLI entry point (calls evaluate → link → optimize → assemble → emit)
└── index.ts             # Public API exports

packages/codegen/src/__tests__/
├── evaluate.test.ts     # Phase 1 unit tests
├── link.test.ts         # Phase 2 unit tests
├── optimize.test.ts     # Phase 3 unit tests
├── assemble.test.ts     # Phase 4 unit tests
└── baseline/            # Golden file snapshots for diff investigation
```

**Structure Decision**: The `compiler/` directory contains the four pre-Emit phases plus the shared Rule IR. Emitters stay in `emitters/` but consume `NodeMap` exclusively. Current files (`enriched-grammar.ts`, `node-model.ts`, `build-model.ts`, `factoring.ts`, `hydration.ts`, `naming.ts`, `optimization.ts`, `classify.ts`, `grammar-reader.ts`, `grammar.ts`, `overrides.ts`, `semantic-aliases.ts`, `token-attachment.ts`, `token-names.ts`, `grammar-model.ts`, `node-types.ts`) are all deleted — their logic is absorbed into the appropriate phase. The design doc's "Current code → New function" tables provide the complete migration mapping.

### Files Deleted (absorbed into phases)

| Current file | Absorbed into |
|---|---|
| `enriched-grammar.ts` | `link.ts` (classification, field extraction), `assemble.ts` (field/child derivation) |
| `node-model.ts` | `assemble.ts` (node creation, model type classification) |
| `build-model.ts` | `evaluate.ts` (grammar building), `assemble.ts` (node assembly) |
| `factoring.ts` | `optimize.ts` (choice fan-out, variant construction, prefix/suffix factoring) |
| `hydration.ts` | `assemble.ts` (field/child extraction from rules) |
| `naming.ts` | `assemble.ts` (nameNode, nameField) |
| `optimization.ts` | `assemble.ts` (computeSignatures, collapseKinds) |
| `classify.ts` | `assemble.ts` (classifyNode, simplifyRule) |
| `grammar-reader.ts` | `evaluate.ts` (grammar loading) |
| `grammar.ts` | `evaluate.ts` (grammar parsing) |
| `overrides.ts` | `evaluate.ts` (grammar extension processing) |
| `semantic-aliases.ts` | `link.ts` (absorbed into resolution) |
| `token-attachment.ts` | `link.ts` or `assemble.ts` |
| `token-names.ts` | `optimize.ts` (tokenToName) |
| `grammar-model.ts` | Eliminated (model types on AssembledNode) |
| `node-types.ts` | `link.ts` (validation only) |
| `kind-projections.ts` | `assemble.ts` (buildProjections, projectKinds) |
| `emitters/rules.ts` | `emitters/templates.ts` |

## Complexity Tracking

> No constitution violations — no entries needed.

## Migration Strategy

**Approach**: Big bang rewrite. All current codegen source files are replaced in a single branch. No incremental migration, no parallel pipeline, no adapter shims.

**Validation**:
1. **Before starting**: Capture golden file snapshots of current output for all three grammars
2. **During development**: Run e2e validation tests after each phase is completed
3. **Before merge**: Full diff of golden snapshots for investigation; all e2e tests must pass

**Override migration**: Existing `overrides.json` files for Rust/TypeScript/Python must be manually converted to `overrides.ts` grammar extensions. This is part of the implementation, not a separate migration tool.
