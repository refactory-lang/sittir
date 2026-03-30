# Research: Grammar Model Pipeline Refactoring

**Date**: 2026-03-28

## Summary

No unknowns required research. All technical decisions were resolved during the spec clarification session (2026-03-28). This document records the decisions for traceability.

## Decisions

### D1: Mutation Strategy

**Decision**: Pipeline steps mutate models in-place.
**Rationale**: Pipeline owns the objects. `readonly` on `Hydrate<T>` protects emitters. No copy overhead for 500+ models × 13 steps.
**Alternatives**: Immutable copies (unnecessary), Builder pattern (overengineered).

### D2: Hydration Type Boundary

**Decision**: `Hydrate<T>` mapped type — replaces `kinds: string[]` → `kinds: HydratedNodeModel[]`, makes all properties `readonly`.
**Rationale**: Single transformation, consistent across all 7 model subtypes. Type-safe boundary between pipeline (mutable) and emitters (frozen).
**Alternatives**: Generic parameter (complex), runtime-only (no type safety), manual interfaces (verbose).

### D3: Semantic Aliases v1 Scope

**Decision**: Character-to-name table only. `Nx[Name]` convention where `1x` omitted.
**Rationale**: Unblocks naming step for non-alphanumeric tokens. Context-aware inference deferred.
**Alternatives**: Full context inference (premature), hardcoded per-grammar maps (not scalable).

### D4: Migration Strategy

**Decision**: Single cutover. Replace pipeline, validate via diff test against all three grammars.
**Rationale**: Diff test is definitive. Parallel code paths add drift risk and maintenance burden.
**Alternatives**: Incremental (complexity, drift risk).

### D5: EnrichedRule Design

**Decision**: 6-variant discriminated union classified from grammar.json only. Does not touch node-types.json.
**Rationale**: Independent analysis of each source, then reconciliation. Maximizes information extraction from grammar before cross-referencing.
**Alternatives**: Annotated tree (current — conflates grammar + NT data), single merged pass (harder to test).
