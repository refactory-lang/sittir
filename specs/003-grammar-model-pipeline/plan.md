# Implementation Plan: Grammar Model Pipeline Refactoring

**Branch**: `003-grammar-model-pipeline` | **Date**: 2026-03-28 | **Spec**: `specs/003-grammar-model-pipeline/spec.md`
**Input**: Feature specification + methods.md + heuristics.md

## Summary

Replace the monolithic `grammar-reader.ts` + `grammar-model.ts` pipeline with a clean 13-step pipeline composed of single-responsibility domain files. The new pipeline independently analyzes grammar.json and node-types.json, reconciles them, and produces `HydratedNodeModel` (frozen, fully-resolved) for emitters. Single cutover validated by generated output diff test.

## Technical Context

**Language/Version**: TypeScript ESM (`.ts` extensions in imports)
**Primary Dependencies**: None (zero runtime deps for generated packages). Build-time: tree-sitter grammar packages, Vitest, oxlint, oxfmt.
**Storage**: N/A (file-based codegen, reads JSON, writes `.ts`)
**Testing**: Vitest. Generated output diff test is the primary gate.
**Target Platform**: Node.js (build-time tool)
**Project Type**: Library / codegen tool
**Performance Goals**: N/A (build-time, runs once per grammar)
**Constraints**: Deterministic output (Constitution VI). Zero diff against current generated output.
**Scale/Scope**: ~1100 lines in grammar-reader.ts + ~1000 lines in grammar-model.ts → 8 new domain files + build-model.ts orchestrator.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Grammar Alignment | PASS | All terminology (kind, field, named, anonymous, supertype, children) preserved. NodeModel uses tree-sitter terms. |
| II. Fewer Abstractions | PASS | 7 model types are 1:1 with unique field sets — no optional field overloading. `Hydrate<T>` is a single type transformation, not a class hierarchy. Replaces `FieldTypeClass` (which was an abstraction) with plain `kinds: string[]`. |
| III. Generated vs Hand-Written | PASS | This changes hand-written codegen infrastructure only. Generated output MUST NOT change (validated by diff test). |
| IV. Test-First | PASS | Existing generated test suites remain the quality gate. Diff test validates zero regression. |
| V. Library-First | PASS | No CLI/formatting/linting changes. |
| VI. Deterministic Output | PASS | Pipeline is deterministic. Same grammar → same model → same output. Diff test enforces this. |

## Project Structure

### Documentation (this feature)

```text
specs/003-grammar-model-pipeline/
├── spec.md              # Feature specification
├── heuristics.md        # Heuristic catalog by pipeline step
├── methods.md           # File organization with method signatures
├── plan.md              # This file
├── research.md          # Phase 0 output (no unknowns — minimal)
├── data-model.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
packages/codegen/src/
  # NEW — domain files (13-step pipeline)
  grammar.ts                 # Layer 1: loadGrammar, getRule
  node-types.ts              # Layer 3: loadNodeTypes
  enriched-grammar.ts        # Layer 2: classifyRules + private extractors
  node-model.ts              # Layer 4: types, guards, initialize, reconcile, members, refine
  naming.ts                  # Step 10: typeName, factoryName, propertyName (REPLACES existing naming.ts)
  hydration.ts               # Step 12: kinds string[] → NodeModel[] references
  optimization.ts            # Step 11: signatures, dedup, kind utilities
  semantic-aliases.ts        # Steps 8–9: v1 character-to-name table
  build-model.ts             # Orchestrator: 13-step pipeline → GrammarModel

  # MODIFIED — emitters updated to consume HydratedNodeModel
  emitters/
    utils.ts                 # Replace filter functions with type guard based
    types.ts                 # Use HydratedNodeModel, type guards
    factories.ts             # Use HydratedNodeModel, type guards
    rules.ts                 # Use HydratedNodeModel
    from.ts                  # Use HydratedNodeModel, type guards
    assign.ts                # Use HydratedNodeModel, type guards
    ir-namespace.ts          # Use HydratedNodeModel
    consts.ts                # Use HydratedNodeModel
    client-utils.ts          # Use HydratedNodeModel
    joinby.ts                # Use HydratedNodeModel
    test-new.ts              # Use HydratedNodeModel
    type-test.ts             # Use HydratedNodeModel
    grammar.ts               # Minor: receive GrammarModel
    index-file.ts            # Minor
    config.ts                # Unchanged

  # MODIFIED — orchestrator
  index.ts                   # Call buildModel() instead of buildGrammarModel()
  cli.ts                     # Unchanged (delegates to index.ts)

  # DELETED (after diff test passes)
  grammar-reader.ts          # Replaced by grammar.ts + node-types.ts + enriched-grammar.ts
  grammar-model.ts           # Replaced by node-model.ts + build-model.ts + optimization.ts
```

**Structure Decision**: Flat domain files under `packages/codegen/src/`. No `pipeline/` subdirectory — each file is a domain, not a pipeline step. The orchestrator (`build-model.ts`) is the only file that knows step ordering.

## Phase 0: Research

No NEEDS CLARIFICATION items — all technical decisions resolved during spec clarification session. Recording decisions for reference:

| Decision | Rationale | Alternatives Rejected |
|----------|-----------|----------------------|
| Mutable in-place pipeline | Pipeline owns models, `readonly` protects emitters. Avoids copy overhead for 500+ models × 13 steps. | Immutable copies (unnecessary complexity), Builder pattern (overengineered) |
| Hydrate<T> type transformation | Single mapped type replaces kinds + freezes. Consistent across all 7 model subtypes. | Generic parameter (complex), runtime-only (no type safety), manual Hydrated* interfaces (verbose) |
| Semantic aliases v1: char-to-name | Unblocks naming step for non-alphanumeric tokens. Nx[Name] convention. | Full context inference (deferred), hardcoded maps (not scalable) |
| Single cutover | Diff test is definitive. Parallel code paths add drift risk. | Incremental migration (complexity, drift) |
| Separate EnrichedRule types | Grammar-only introspection, classified discriminated union. Does not touch node-types.json. | Annotated tree (current approach — conflates grammar + NT data) |

## Phase 1: Design

### Data Model

See `data-model.md` for complete entity definitions. Summary of key changes from current:

| Current | New | Change |
|---------|-----|--------|
| `NodeModel` (6 variants) | `NodeModel` (7 variants) | +EnumModel (split from LeafModel), LeafWithChildrenModel → ContainerModel |
| `FieldTypeClass` (6 arrays) | `kinds: string[]` | Replaced by plain kind array, projections computed on-demand |
| `ChildModel` (single) | `SingleChildModel \| ListChildModel` | Discriminated by `multiple` |
| `FieldModel` (flat) | `SingleFieldModel \| ListFieldModel` | Discriminated by `multiple`, separator only on List |
| `NodeElement` | `NodeMember` | Renamed element → member |
| `EnrichedRule` (annotated tree) | `EnrichedRule` (classified DU) | 6-variant discriminated union instead of annotated tree |
| `buildGrammarModel()` | `buildModel()` → `GrammarModel` | 13-step pipeline, returns `HydratedNodeModel` |

### Interface Contracts

This is an internal pipeline refactoring — no external API changes. The contract is:

**Input contract** (unchanged):
- `grammar.json` from tree-sitter grammar packages
- `node-types.json` from tree-sitter grammar packages

**Output contract** (unchanged):
- `GeneratedFiles` from `generate()` — all emitters produce identical output

**Internal contract** (new):
- `buildModel(grammarName) → GrammarModel` replaces `buildGrammarModel(grammar)`
- Emitters receive `HydratedNodeModel[]` (frozen, resolved) instead of `NodeModel[]` (mutable, string-based kinds)
- Type guards (`isBranch`, `isLeaf`, etc.) replace filter functions (`branchModels()`, `leafModels()`)

### Migration Boundary

The cutover point is `index.ts`:

```typescript
// BEFORE
const { model, serialized } = buildGrammarModel(cfg.grammar);
const allNodes = Object.values(model.nodes);

// AFTER
const grammarModel = buildModel(cfg.grammar);
const allNodes = [...grammarModel.models.values()];
```

All emitters are updated to accept `HydratedNodeModel[]` instead of `NodeModel[]`. The emitters' public signatures change, but the generated output MUST NOT change.

## Complexity Tracking

No constitution violations. No complexity exceptions needed.

| Aspect | Assessment |
|--------|-----------|
| New types | 7 NodeModel variants (1:1 with unique fields — Principle II) |
| Hydrate<T> | Single mapped type, not a class hierarchy |
| 13 pipeline steps | Each is a pure function with clear I/O. Orchestrator is ~30 lines. |
| File count | +9 new, -2 deleted, ~15 modified = net +7 files. Each is a focused domain. |
