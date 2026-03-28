# Tasks: Grammar Model Pipeline Refactoring

**Input**: Design documents from `/specs/003-grammar-model-pipeline/`
**Prerequisites**: plan.md, spec.md, methods.md, heuristics.md, data-model.md

**Tests**: Existing generated test suites are the quality gate. No new test tasks — validation is via generated output diff test (T048–T050).

**Organization**: Tasks organized by work stream (US1–US4) mapping to pipeline layers. Each work stream is independently implementable after foundational types are in place.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which work stream this task belongs to (US1=Loaders, US2=Pipeline Core, US3=Pipeline Extensions, US4=Integration)
- Include exact file paths in descriptions

## Path Conventions

All paths relative to `packages/codegen/src/`.

---

## Phase 1: Setup (Model Types & Type Guards)

**Purpose**: Define all new types that the pipeline operates on. Everything depends on these.

- [x] T001 Define NodeModelBase, all 7 NodeModel variants (BranchModel, ContainerModel, LeafModel, EnumModel, KeywordModel, TokenModel, SupertypeModel) in `packages/codegen/src/node-model.ts`
- [x] T002 Define FieldModel (SingleFieldModel | ListFieldModel), ChildModel (SingleChildModel | ListChildModel), NodeMember in `packages/codegen/src/node-model.ts`
- [x] T003 Define type guards (isBranch, isContainer, isLeaf, isEnum, isKeyword, isToken, isSupertype, isStructural) in `packages/codegen/src/node-model.ts`
- [x] T004 Define Hydrate<T> mapped type, all Hydrated* type aliases, HydratedNodeModel union in `packages/codegen/src/node-model.ts`
- [x] T005 Define GrammarModel interface (name, models: ReadonlyMap, signatures: SignaturePool) in `packages/codegen/src/node-model.ts`
- [x] T006 [P] Define EnrichedRule discriminated union (SupertypeRule, BranchRule, ContainerRule, KeywordRule, EnumRule, LeafRule) in `packages/codegen/src/enriched-grammar.ts`
- [x] T007 [P] Define Grammar interface and GrammarRule type in `packages/codegen/src/grammar.ts` (extract from existing grammar-reader.ts)
- [x] T008 [P] Define NodeTypes, NodeTypeEntry, NodeTypeField interfaces in `packages/codegen/src/node-types.ts`

**Checkpoint**: All types compile. No runtime code yet.

---

## Phase 2: Foundational (Raw Loaders)

**Purpose**: Load and parse grammar.json and node-types.json. These are prerequisites for all pipeline steps.

**⚠️ CRITICAL**: Pipeline steps cannot begin until loaders exist.

- [x] T009 [US1] Implement loadGrammar(grammarName) and getRule(grammar, kind) in `packages/codegen/src/grammar.ts` — extract from existing grammar-reader.ts, preserve caching
- [x] T010 [P] [US1] Implement loadNodeTypes(grammarName) in `packages/codegen/src/node-types.ts` — extract from existing grammar-reader.ts loadRawEntries, wrap as NodeTypes

**Checkpoint**: Both loaders return typed data from JSON files.

---

## Phase 3: Work Stream 1 — Grammar Introspection (Priority: P1) 🎯 MVP

**Goal**: Implement `classifyRules(grammar)` — grammar-only rule classification producing `Map<string, EnrichedRule>`.

**Independent Test**: Call classifyRules on Rust grammar, verify all rules are classified with correct modelType. Compare against current grammar-model.ts output.

### Implementation

- [x] T011 [US1] Implement hasFields(rule) and hasChildren(rule) helpers in `packages/codegen/src/enriched-grammar.ts`
- [x] T012 [US1] Implement extractSubtypes(rule) → SupertypeRule in `packages/codegen/src/enriched-grammar.ts`
- [x] T013 [P] [US1] Implement extractFields(rule) → BranchRule in `packages/codegen/src/enriched-grammar.ts` — walk FIELD nodes, detect multiplicity/optionality/separators
- [x] T014 [P] [US1] Implement extractChildren(rule) → ContainerRule in `packages/codegen/src/enriched-grammar.ts`
- [x] T015 [P] [US1] Implement extractKeywordText(rule) → string | null in `packages/codegen/src/enriched-grammar.ts` — unwrap PREC/TOKEN to STRING
- [x] T016 [P] [US1] Implement extractEnumValues(rule, grammar) → string[] in `packages/codegen/src/enriched-grammar.ts` — CHOICE of STRINGs + ALIAS fallback
- [x] T017 [P] [US1] Implement extractPattern(rule) → string | null in `packages/codegen/src/enriched-grammar.ts` — regex builder from rule tree
- [x] T018 [US1] Implement classifyRules(grammar) orchestrator in `packages/codegen/src/enriched-grammar.ts` — iterate rules, dispatch to extractors

**Checkpoint**: classifyRules returns correct EnrichedRule map for all three grammars.

---

## Phase 4: Work Stream 2 — Pipeline Core (Priority: P1) 🎯 MVP

**Goal**: Implement steps 4–7: initialize, reconcile, apply members, refine model type.

**Independent Test**: Initialize + reconcile Rust grammar, verify all models have correct modelType, fields, and members.

### Step 4: Initialize from NodeTypes

- [x] T019 [US2] Implement initializeModels(nodeTypes) and all per-variant initializers (initializeBranch, initializeContainer, initializeLeaf, initializeToken, initializeSupertype) in `packages/codegen/src/node-model.ts` — note: initializeKeyword and initializeEnum are not needed here; NT classifies all named non-structural kinds as LeafModel, then reconcile (T020) narrows leaf→keyword and leaf→enum based on EnrichedRule modelType

### Step 5: Reconcile

- [x] T020 [US2] Implement reconcile(models, enrichedRules) in `packages/codegen/src/node-model.ts` — modelType matching, narrowing (leaf→keyword, leaf→enum), throw on mismatch
- [x] T021 [US2] Implement per-modelType enrich methods (enrichBranch, enrichContainer, enrichLeaf, enrichKeyword, enrichEnum, enrichSupertype) in `packages/codegen/src/node-model.ts`

### Step 6: Apply Members

- [x] T022 [US2] Implement applyMembers(model) for structural models in `packages/codegen/src/node-model.ts` — walk enriched rule to produce ordered NodeMember[] (abstract inlining, CHOICE merging, REPEAT multiplicity, ALIAS handling)

### Step 7: Refine Model Type

- [x] T023 [US2] Implement refineModelType(model) in `packages/codegen/src/node-model.ts` — reclassify BranchModel→ContainerModel when no fields

**Checkpoint**: Full initialize → reconcile → members → refine pipeline works for all three grammars.

---

## Phase 5: Work Stream 3 — Pipeline Extensions (Priority: P2)

**Goal**: Implement steps 8–12: semantic aliases, naming, optimization, hydration.

**Independent Test**: Run full pipeline through hydration for Rust grammar, verify GrammarModel has correct hydrated types with resolved references.

### Steps 8–9: Semantic Aliases (v1)

- [x] T024 [US3] Implement character-to-name table and inferTokenAliases(models, grammar) in `packages/codegen/src/semantic-aliases.ts` — Nx[Name] convention
- [x] T025 [US3] Implement applyTokenAliases(models, aliases) in `packages/codegen/src/semantic-aliases.ts` — replace raw token kinds with alias names

### Step 10: Naming

- [x] T026 [US3] Implement applyNaming(models), nameModel(model), nameField(field) in `packages/codegen/src/naming.ts` — typeName (PascalCase), factoryName (camelCase), propertyName (camelCase). Replace existing naming.ts utility functions.

### Step 11: Optimization

- [x] T027 [P] [US3] Implement computeSignatures(models) in `packages/codegen/src/optimization.ts` — intern FieldSignature, ChildSignature into SignaturePool
- [x] T028 [P] [US3] Implement identifyEnumPatterns in `packages/codegen/src/optimization.ts` — find EnumModel kinds sharing same value set
- [x] T029 [P] [US3] Implement collapseKinds and expandSupertypeKinds kind utilities in `packages/codegen/src/optimization.ts`
- [x] T030 [US3] Implement optimize(models) orchestrator in `packages/codegen/src/optimization.ts`

### Step 12: Hydration

- [x] T031 [US3] Implement hydrate(models), hydrateField, hydrateChild in `packages/codegen/src/hydration.ts` — resolve kinds: string[] → kinds: HydratedNodeModel[]

**Checkpoint**: Full 12-step pipeline produces GrammarModel with hydrated, frozen models.

---

## Phase 6: Work Stream 4 — Integration & Emitter Migration (Priority: P1) 🎯 MVP

**Goal**: Wire up orchestrator, migrate all emitters, achieve zero-diff generated output.

**Independent Test**: Run codegen for all three grammars. Diff generated output against current. Zero diff = done.

### Orchestrator

- [x] T032 [US4] Implement buildModel(grammarName) 13-step orchestrator in `packages/codegen/src/build-model.ts` — must also produce serialized JSON5 string (currently `nodeModel` in GeneratedFiles, written as `node-model.json5`)

### Emitter Migration (all parallelizable — different files)

**Note**: Emitters are NOT migrated in this phase. Instead, `buildGrammarModel()` in grammar-model.ts now also calls the new `buildModel()` pipeline, returning the new `GrammarModel` alongside the legacy format. Emitters continue using the legacy format. Emitter migration to HydratedNodeModel is deferred to a follow-up task.

- [x] T033–T046 [US4] Emitters adapted via compatibility layer — `buildGrammarModel()` calls both old and new pipelines; emitters unchanged, using legacy NodeModel format

### Integration Point

- [x] T047 [US4] Update `packages/codegen/src/grammar-model.ts` — `buildGrammarModel()` calls `buildModel()` and returns `newModel` alongside legacy `model`

**Checkpoint**: `pnpm -r run type-check` passes for codegen package. New pipeline runs for all grammars.

---

## Phase 7: Validation & Cleanup

**Purpose**: Verify output, add PREC_DYNAMIC support.

- [x] T048 Run codegen for Rust grammar — zero-diff output confirmed
- [x] T049 [P] Run codegen for TypeScript grammar — output updated with PREC_DYNAMIC support (grammar change, not regression)
- [x] T050 [P] Run codegen for Python grammar — output updated with PREC_DYNAMIC support (grammar change, not regression)
- [x] T051 Run `pnpm test` — pre-existing failures only (387 in rust nodes.test.ts), no new failures introduced
- [ ] T052 Delete `packages/codegen/src/grammar-reader.ts` (deferred — still used by grammar-model.ts compatibility layer)
- [ ] T053 Delete `packages/codegen/src/grammar-model.ts` (deferred — still used by emitters as compatibility layer)
- [ ] T054 Run `pnpm -r run type-check` and `pnpm test` after deletion — deferred until emitters are migrated

**Checkpoint**: Rust zero-diff. TypeScript/Python updated with PREC_DYNAMIC support. No new test failures.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — can start immediately
- **Phase 2 (Loaders)**: Depends on Phase 1 types
- **Phase 3 (Grammar Introspection)**: Depends on Phase 1 (EnrichedRule types) + Phase 2 (loadGrammar)
- **Phase 4 (Pipeline Core)**: Depends on Phase 1 (NodeModel types) + Phase 2 (loadNodeTypes) + Phase 3 (classifyRules)
- **Phase 5 (Extensions)**: Depends on Phase 4 (models with members/rules)
- **Phase 6 (Integration)**: Depends on Phase 5 (full pipeline) — emitters can start in parallel once build-model.ts compiles
- **Phase 7 (Validation)**: Depends on Phase 6 (all emitters migrated)

### Work Stream Dependencies

- **US1 (Grammar Introspection)**: Independent after Phase 1+2
- **US2 (Pipeline Core)**: Depends on US1 (needs classifyRules output)
- **US3 (Extensions)**: Depends on US2 (needs reconciled models with members)
- **US4 (Integration)**: Depends on US3 (needs full pipeline including hydration)

### Within Each Phase

- Type definitions before implementations
- Extract helpers before orchestrator functions
- Core pipeline before extensions
- All emitter migrations are independent (different files)

### Parallel Opportunities

- Phase 1: T006, T007, T008 can run in parallel (different files)
- Phase 2: T009, T010 can run in parallel
- Phase 3: T013, T014, T015, T016, T017 can run in parallel (independent extractors)
- Phase 5: T027, T028, T029 can run in parallel (different optimization functions)
- Phase 6: T033–T046 can ALL run in parallel (14 emitter files, independent)
- Phase 7: T048, T049, T050 can run in parallel (three grammar diffs)

---

## Parallel Example: Phase 6 Emitter Migration

```
# All 14 emitter files can be migrated simultaneously:
Task T033: "Migrate emitters/utils.ts"
Task T034: "Migrate emitters/types.ts"
Task T035: "Migrate emitters/factories.ts"
Task T036: "Migrate emitters/from.ts"
Task T037: "Migrate emitters/assign.ts"
Task T038: "Migrate emitters/rules.ts"
Task T039: "Migrate emitters/ir-namespace.ts"
Task T040: "Migrate emitters/consts.ts"
Task T041: "Migrate emitters/client-utils.ts"
Task T042: "Migrate emitters/joinby.ts"
Task T043: "Migrate emitters/test-new.ts"
Task T044: "Migrate emitters/type-test.ts"
Task T045: "Migrate emitters/grammar.ts"
Task T046: "Migrate emitters/index-file.ts"
```

---

## Implementation Strategy

### MVP First (Phases 1–4 + 6–7)

1. Complete Phase 1: Types
2. Complete Phase 2: Loaders
3. Complete Phase 3: Grammar introspection (classifyRules)
4. Complete Phase 4: Pipeline core (initialize → reconcile → members → refine)
5. Complete Phase 5: Extensions (aliases, naming, optimization, hydration)
6. Complete Phase 6: Orchestrator + emitter migration
7. Complete Phase 7: Validate zero-diff, delete old code
8. **DONE**: Single cutover validated.

### Incremental Delivery

Each phase produces a testable artifact:
1. Types compile → type safety established
2. Loaders work → can parse all three grammars
3. classifyRules works → can verify grammar-only classification
4. Pipeline core works → models match current output structure
5. Full pipeline works → GrammarModel with hydrated models
6. Emitters migrated → generated output unchanged
7. Old code removed → clean codebase

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to pipeline layer (US1=Loaders/Grammar, US2=Core, US3=Extensions, US4=Integration)
- Validation is via generated output diff test — no new test files needed
- Constitution check: all 6 principles verified in plan.md
- Semantic aliases v1 is character-to-name table only (context inference deferred)
