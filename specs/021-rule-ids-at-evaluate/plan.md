# Implementation Plan: Rule IDs and Rule Classification

**Branch**: `021-rule-ids-at-evaluate` | **Date**: 2026-04-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/Users/pmouli/GitHub.nosync/refactory-lang/sittir/specs/021-rule-ids-at-evaluate/spec.md`

## Summary

Add a single Evaluate-stage occurrence identity model to the codegen compiler. Every evaluated `Rule` occurrence will carry an inline deterministic `RuleId`, and Evaluate will emit an authoritative `RuleCatalog` keyed by that ID. The catalog records owner kind, parent/child relationships, deterministic path, provenance, and rule classification. Terminal/nonterminal classification remains a rule-level fact, separate from parent-edge names and tree-sitter named/anonymous CST surface metadata. Tree-sitter generated KindID/FieldID metadata remains a late enrichment layer and is emitted into generated grammar packages as parser-scoped numeric ID enums/maps.

## Technical Context

**Language/Version**: TypeScript 6.0.3, workspace ESM with `.ts` imports  
**Primary Dependencies**: `@sittir/codegen`, tree-sitter grammar packages, `tree-sitter-cli`/`web-tree-sitter` for generated metadata validation  
**Storage**: In-memory compiler data plus generated spec artifacts only; no runtime persistence  
**Testing**: Vitest for compiler unit/integration tests; workspace `pnpm -r run type-check`; optional root `pnpm test` for broader regression confidence  
**Target Platform**: Node.js >=20 library/compiler pipeline  
**Project Type**: Compiler/codegen library  
**Performance Goals**: Evaluate remains deterministic and linear in rule-tree size for catalog/classification construction; no per-consumer re-walk is introduced for identity metadata  
**Constraints**: DRY one source/one derivation; no generated-output hand edits; no `node-types.json` fallback for identity/classification; exhaustive `Rule["type"]` handling; no global counter dependence for deterministic IDs  
**Scale/Scope**: Evaluate-stage rule identity and classification for Rust, TypeScript, and Python grammar inputs; Binding/Simplify/Assemble re-architecture remains in spec 022

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **I. Grammar Alignment**: PASS. Uses tree-sitter terms (`Rule`, kind, field, named, anonymous, node-types) and keeps parent-edge naming separate from CST surface behavior.
- **II. Fewer Abstractions**: PASS. Adds only the minimum identity/catalog/classification records required to remove duplicate occurrence discovery. The generated numeric ID enums expose existing tree-sitter artifact IDs rather than inventing a new semantic identity layer.
- **III. Generated vs Hand-Written**: PASS. Work is in `packages/codegen/src/compiler/*` and compiler tests. Generated grammar package output is not edited by hand.
- **IV. Test-First**: PASS. Plan requires Evaluate/catalog/classification tests before downstream consumers migrate.
- **V. Library-First**: PASS. No CLI/product UX changes; the feature is internal compiler library architecture.
- **VI. Deterministic Output**: PASS. Rule IDs are deterministic for unchanged evaluated grammar output and cannot depend on object insertion accidents or process-global counters.
- **VII. Grammar-Agnostic Pipeline**: PASS. The catalog/classification algorithm must operate on generic `Rule` shapes and all configured grammars, with grammar-specific behavior still expressed through overrides.
- **VIII. Non-lossy Transformations**: PASS. The catalog preserves rule occurrence identity, parent/child relationships, path, provenance, and classification.
- **IX. @sittir/core is the Rust-port surface**: PASS. This feature is codegen compiler-only and does not expand `@sittir/core`.
- **X. Don't hand-roll types you can import**: PASS. The plan extends existing `Rule`/compiler contracts instead of duplicating external tree-sitter types.
- **XI. DRY - One Source, One Derivation**: PASS. Evaluate becomes the single derivation point for rule occurrence identity and classification.

## Project Structure

### Documentation (this feature)

```text
/Users/pmouli/GitHub.nosync/refactory-lang/sittir/specs/021-rule-ids-at-evaluate/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── evaluate-rule-identity.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
/Users/pmouli/GitHub.nosync/refactory-lang/sittir/packages/codegen/src/compiler/
├── rule.ts            # Rule union, per-variant guards, RuleId-bearing rule contract
├── evaluate.ts        # Evaluate DSL output and catalog construction entry point
├── types.ts           # RawGrammar and catalog/classification sidecar contracts
└── common.ts          # Shared exhaustive rule traversal helpers if needed by multiple phases

/Users/pmouli/GitHub.nosync/refactory-lang/sittir/packages/codegen/src/__tests__/
├── evaluate.test.ts   # Rule ID/catalog/classification unit coverage
└── post-evaluate-invariant.test.ts # Cross-grammar determinism/invariant coverage
```

**Structure Decision**: Keep the feature inside `@sittir/codegen` compiler internals. `RuleId` and catalog types belong with the compiler `Rule`/`RawGrammar` contracts, while the construction logic belongs in Evaluate because it is the first phase with a complete normalized rule tree.

## Phase 0 Research

Research output is captured in [research.md](./research.md). The decisions resolve:

- inline `RuleId` placement plus authoritative catalog sidecar
- deterministic path-derived ID stability boundary
- per-occurrence-root provenance semantics
- terminal/nonterminal classification, including wrapper aggregation
- late KindID/FieldID enrichment boundaries

## Phase 1 Design

Design outputs:

- [data-model.md](./data-model.md)
- [contracts/evaluate-rule-identity.md](./contracts/evaluate-rule-identity.md)
- [quickstart.md](./quickstart.md)

The design keeps catalog construction and classification as one Evaluate-owned derivation. Downstream phases may consume inline IDs and catalog metadata but must not create a competing identity system.

## Post-Design Constitution Check

- **I. Grammar Alignment**: PASS. The contract uses tree-sitter rule forms and preserves CST terminology.
- **II. Fewer Abstractions**: PASS. The sidecar records are bounded to identity/classification and avoid slot projections owned by spec 022.
- **III. Generated vs Hand-Written**: PASS. Generated files remain untouched.
- **IV. Test-First**: PASS. Quickstart and contract define the minimum tests before implementation completion.
- **V. Library-First**: PASS. No CLI/product ownership is added.
- **VI. Deterministic Output**: PASS. Determinism is explicit in FR/SC and quickstart validation.
- **VII. Grammar-Agnostic Pipeline**: PASS. All decisions are generic over the `Rule` union.
- **VIII. Non-lossy Transformations**: PASS. Parent/child/path/provenance/classification metadata is preserved.
- **IX. @sittir/core is the Rust-port surface**: PASS. No `@sittir/core` change.
- **X. Don't hand-roll types you can import**: PASS. Existing compiler contracts are extended in place.
- **XI. DRY - One Source, One Derivation**: PASS. Identity/classification are derived once at Evaluate.

## Complexity Tracking

No constitution violations require justification.
