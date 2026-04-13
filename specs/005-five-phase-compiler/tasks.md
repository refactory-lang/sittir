# Tasks: Five-Phase Grammar Compiler

**Input**: Design documents from `specs/005-five-phase-compiler/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing. This is a big bang rewrite — all phases are built in sequence within a single branch.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Capture baseline, create directory structure, define shared types

- [x] T001 Capture golden file snapshots of current output for all three grammars into `specs/005-five-phase-compiler/baseline/{rust,typescript,python}/`
- [x] T002 Create `packages/codegen/src/compiler/` directory for phase modules
- [x] T003 Create `packages/codegen/src/__tests__/` directory for phase unit tests
- [x] T004 Define shared Rule IR type union and SymbolRef interface in `packages/codegen/src/compiler/rule.ts` — all 20 Rule variants as specified in the design doc

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build the five phases in dependency order. Each phase depends on the previous phase's contract.

**⚠ CRITICAL**: No user story work can begin until all five phases produce correct output for all three grammars.

### Phase 2a: Evaluate

- [x] T005 Implement grammar.js DSL functions (`seq`, `choice`, `optional`, `repeat`, `repeat1`, `field`, `token`, `prec`, `normalize`) in `packages/codegen/src/compiler/evaluate.ts`
- [x] T006 Implement `$` proxy with reference tracking (`createProxy`) and SymbolRef enrichment (fieldName, optional, repeated) in `packages/codegen/src/compiler/evaluate.ts`
- [x] T007 Implement pattern detection in `choice()` (enum from choice-of-strings, BLANK absorption) and `repeat()` (separator detection from seq pattern) in `packages/codegen/src/compiler/evaluate.ts`
- [x] T008 Implement override DSL primitives (`transform`, `insert`, `replace`) that operate on tree-sitter's `original` rule parameter — hybrid addressing (numeric index + field name), added to globalThis alongside existing DSL functions in `packages/codegen/src/compiler/evaluate.ts`
- [x] T009 Implement grammar extension execution: `evaluate(entryPath)` accepts either grammar.js directly or overrides.ts (which imports grammar.js as base). Tree-sitter's `grammar(base, { rules })` handles merge — each rule fn receives `($, original)`. No custom two-pass. See reference: `specs/005-five-phase-compiler/reference/tree-sitter-dsl.js` lines 246-331. Implement in `packages/codegen/src/compiler/evaluate.ts`
- [x] T010 Implement `RawGrammar` contract assembly (rules, extras, externals, supertypes, inline, conflicts, word, references) with provenance tracking — rules from overrides carry `source: 'override'` in `packages/codegen/src/compiler/evaluate.ts`
- [x] T011 Convert existing `packages/rust/overrides.json` to `packages/rust/overrides.ts` grammar extension format — base grammar at `node_modules/.pnpm/tree-sitter-rust@0.24.0/node_modules/tree-sitter-rust/grammar.js`. Each field override becomes a `transform(original, { position: field(name, content) })` call.
- [x] T012 [P] Convert existing `packages/typescript/overrides.json` to `packages/typescript/overrides.ts` grammar extension format — base grammar at `node_modules/.pnpm/tree-sitter-typescript@0.23.2/node_modules/tree-sitter-typescript/typescript/grammar.js`
- [x] T013 [P] Convert existing `packages/python/overrides.json` to `packages/python/overrides.ts` grammar extension format — base grammar at `node_modules/.pnpm/tree-sitter-python@0.25.0/node_modules/tree-sitter-python/grammar.js`
- [x] T014 Write unit tests for Evaluate phase: proxy reference capture, pattern detection, override application via native grammar(base) extension in `packages/codegen/src/__tests__/evaluate.test.ts`
- [x] T014a [P] Write tests verifying override semantics: (1) `insert` wraps a position without removing original content, (2) `replace` substitutes content entirely, (3) `replace` with no content suppresses the position in `packages/codegen/src/__tests__/evaluate.test.ts`
- [x] T009a [P] Write error-path tests: (1) grammar.js that throws during evaluation, (2) grammar.js with undefined symbol references, (3) grammar.js with no rules — verify clear error messages, no silent failures in `packages/codegen/src/__tests__/evaluate.test.ts`
- [x] T008a [P] Write test for `transform(original, { 99: field('x') })` where position 99 doesn't exist — verify clear error message in `packages/codegen/src/__tests__/evaluate.test.ts`
- [x] T008b [P] Write test for two transforms targeting the same position — verify either last-wins semantics or explicit error in `packages/codegen/src/__tests__/evaluate.test.ts`
- [x] T010a [P] Write test for grammar with all hidden rules and zero visible named rules — verify pipeline produces empty output or clear diagnostic in `packages/codegen/src/__tests__/evaluate.test.ts`

**Checkpoint**: `evaluate()` produces a `RawGrammar` from grammar.js + overrides.ts for all three grammars

### Phase 2b: Link

- [x] T015 Implement reference resolution (removes symbol, alias, token, repeat1): `resolveRule`, `inlineHiddenRule`, `resolveHiddenChoice`, `resolveHiddenSeq`, `resolveExternal`, `resolveAlias`, `flattenToken`, `normalizeRepeat1`, `normalizeRepeatPattern` in `packages/codegen/src/compiler/link.ts`
- [x] T016 Implement hidden rule classification: choice-of-symbols → supertype (grammar or promoted based on parent ref count), choice-of-strings → enum, seq-with-fields → group, other → inline in `packages/codegen/src/compiler/link.ts`
- [x] T017 Implement field annotation with provenance (`source`, `nameFrom`) and clause detection (`detectClause`) in `packages/codegen/src/compiler/link.ts`
- [x] T018 Implement reference graph enrichment: `enrichPositions` (walk SEQ to assign position), `computeParentSets` in `packages/codegen/src/compiler/link.ts`
- [x] T019 Implement core derivations (active): inline confidence, supertype candidate detection, dead rule detection, cycle detection in `packages/codegen/src/compiler/link.ts`
- [ ] T020 Implement diagnostic derivations (suggested overrides): field name inference, synthetic supertype detection, override inference, naming consistency, global optionality, separator consistency, override candidate quality in `packages/codegen/src/compiler/link.ts`
- [ ] T021 Implement node-types.json validation (`validateAgainstNodeTypes`) as optional validation-only check in `packages/codegen/src/compiler/link.ts`
- [x] T022 Write unit tests for Link phase: reference resolution, hidden rule classification, field provenance, clause detection, diagnostic derivations in `packages/codegen/src/__tests__/link.test.ts`
- [x] T019a [P] Write test for self-referential hidden rule (cycle) — verify cycle is detected and flagged without crashing in `packages/codegen/src/__tests__/link.test.ts`
- [x] T016a [P] Write test for hidden choice-of-symbols with 3 parent refs (gray zone) — verify it is inlined (not promoted) and appears in suggestedOverrides in `packages/codegen/src/__tests__/link.test.ts`

**Checkpoint**: `link()` produces a `LinkedGrammar` with zero unresolved references for all three grammars

### Phase 2c: Optimize

- [x] T023 Implement choice fan-out: `fanOutChoices`, `fanOutChoice`, `factorSeqChoice`, `findCommonPrefix`, `findCommonSuffix`, `flattenToSeq`, `rulesEqual` in `packages/codegen/src/compiler/optimize.ts`
- [x] T024 Implement variant construction: `wrapVariants`, `deduplicateVariants`, `nameVariant`, `tokenToName` in `packages/codegen/src/compiler/optimize.ts`
- [x] T025 Implement spacing: `needsSpace`, `buildWordBoundary` in `packages/codegen/src/compiler/optimize.ts`
- [x] T026 Write unit tests for Optimize phase: choice fan-out, prefix/suffix factoring, variant wrapping, deduplication, non-lossy invariants in `packages/codegen/src/__tests__/optimize.test.ts`

**Checkpoint**: `optimize()` produces an `OptimizedGrammar` for all three grammars. Named content unchanged.

### Phase 2d: Assemble

- [x] T027 Implement model type classification: `classifyNode` (structural simplification + visibility), `simplifyRule` (transient, strip anon tokens, collapse trivial seq/choice) in `packages/codegen/src/compiler/assemble.ts`
- [x] T028 Implement field/child/form extraction: `extractFields`, `extractChildren`, `extractForms` with derived metadata (`deriveRequired`, `deriveMultiple`, `deriveContentTypes`, `deriveDetectToken`) in `packages/codegen/src/compiler/assemble.ts`
- [x] T029 Implement form collapse: `collapseForms` (same-field-set forms → merge, union contentTypes, preserve mergedRules) in `packages/codegen/src/compiler/assemble.ts`
- [x] T030 Implement naming: `nameNode` (kind → typeName, factoryName, irKey), `nameField` (field name → propertyName, paramName) in `packages/codegen/src/compiler/assemble.ts`
- [x] T031 Implement signatures and projections: `computeSignatures`, `collapseKinds`, `buildProjections`, `projectKinds` in `packages/codegen/src/compiler/assemble.ts`
- [x] T032 Write unit tests for Assemble phase: model type classification (all 9 types), field derivation, form extraction/collapse, naming in `packages/codegen/src/__tests__/assemble.test.ts`
- [x] T027a [P] Write test for rule that simplifies to empty seq after stripping anonymous tokens — verify `classifyNode` handles gracefully in `packages/codegen/src/__tests__/assemble.test.ts`
- [x] T027b [P] Write test for visible rule that simplifies to non-alphanumeric string (`->`, `::`) — verify classification as `token` model type in `packages/codegen/src/__tests__/assemble.test.ts`
- [x] T029a [P] Write test for polymorph where two forms share the same detect token — verify forms are collapsed or diagnostic emitted in `packages/codegen/src/__tests__/assemble.test.ts`

**Checkpoint**: `assemble()` produces a `NodeMap` with correctly classified nodes for all three grammars

### Phase 2e: NodeMap Adapter

Per the design doc: **all emitters consume `NodeMap` exclusively**. Current emitters consume `HydratedNodeModel[]` + `naming.ts` helpers + `node-model.ts` utilities (`isTupleChildren`, `eachChildSlot`). An adapter bridges `NodeMap` → old emitter interfaces so existing output logic works immediately. Then each emitter is incrementally rewritten to consume `AssembledNode` directly.

- [x] T033 Create `packages/codegen/src/compiler/adapter.ts` — maps `NodeMap` → `HydratedNodeModel[]` for backward compatibility with existing emitters. Maps each `AssembledNode` model type to the corresponding `HydratedNodeModel` shape (branch→structural, container→structural, polymorph→structural+variants, leaf→terminal, keyword→terminal, enum→hidden, supertype→hidden, group→hidden).
- [x] T033a Re-export naming helpers from adapter: `toTypeName` → `nameNode().typeName`, `toFactoryName` → `nameNode().factoryName`, `toFieldName` → `nameField().propertyName`, `toParamName` → `nameField().paramName`. These delegate to `assemble.ts` functions so naming logic stays in one place.
- [x] T033b Re-export model utilities from adapter: `isTupleChildren` (derive from `AssembledChild[]` structure), `eachChildSlot` (iterate `AssembledChild[]`). These compute from `AssembledNode` fields, not old model types.
- [x] T033c Write adapter tests in `packages/codegen/src/__tests__/adapter.test.ts` — verify each `AssembledNode` model type maps to the expected `HydratedNodeModel` shape.

**Checkpoint**: Adapter produces `HydratedNodeModel[]` from `NodeMap`. Existing emitters can consume it.

### Phase 2f: Eliminate functions that moved to earlier phases

Per the design doc's "Eliminated from Emit" table, these functions must be removed from emitters because their logic now lives in compiler phases:

- [x] T034 Remove `tryClause()` from `emitters/rules.ts` — now `detectClause()` in `compiler/link.ts`
- [x] T034a Remove `topLevelChoice()` from emitters — now `classifyNode()` in `compiler/assemble.ts` produces `polymorph`
- [x] T034b Remove `ruleReferencesExternal()` from `emitters/rules.ts` — now `detectIndentField()` in `compiler/link.ts`
- [x] T034c Remove `needsSpace()` and `buildWordBoundary()` from `emitters/rules.ts` — now in `compiler/optimize.ts`
- [x] T034d Remove `variantFieldSetsFromModel()` from emitters — now `extractForms()` in `compiler/assemble.ts`
- [x] T034e Remove `computeVariantFieldSets()` — eliminated entirely, variant Rules from Optimize + forms in Assemble
- [x] T034f Remove `walkWithInlining()` from emitters — hidden rules already inlined by `compiler/link.ts`
- [x] T034g Remove `buildJoinBy()` and `detectRecursiveSeparator()` from `emitters/rules.ts` — separator captured on Rule by `compiler/evaluate.ts`
- [x] T034h Remove `appendMissingFields()` — eliminated, Assemble provides complete field set per form

**Checkpoint**: No emitter contains logic that belongs in compiler phases.

### Phase 2g: Rewrite emitters to consume NodeMap directly

Per the design doc's derivation chains:
```
NodeMap ──→ types.ts      (interfaces, unions, Config, FromInput)
       ├──→ factories.ts  (constructors, per-form for polymorphs)
       ├──→ templates.ts  (render strings, clauses, joinBy)
       │    factory sig ↓
       ├──→ from.ts       (sugar over factory: resolve fields, call factory)
       └──→ ir.ts         (re-exports factories + from with form accessors)
```

Each emitter's entry point changes from `emitX(config: { grammar, nodes: HydratedNodeModel[] })` to `emitX(nodeMap: NodeMap)`. Internal helpers switch from `HydratedNodeModel` to `AssembledNode` discriminated union with `switch (node.modelType)`.

- [x] T035 Rewrite `emitters/types.ts`: entry `emitTypes(nodeMap: NodeMap) → string`. Iterate `nodeMap.nodes`, switch on `modelType`. `emitInterface(node: AssembledBranch | AssembledContainer)` for branches/containers. `emitFormInterface(node: AssembledPolymorph, form: AssembledForm)` for polymorphs. `emitConfigType(node: AssembledNode)` for all types with factories. Remove kind-specific conditionals (`integer_literal`/`float_literal`/`boolean_literal`) — use override-driven classification instead. Remove imports from `node-model.ts` and `naming.ts`.
- [x] T036 Rewrite `emitters/factories.ts`: entry `emitFactories(nodeMap: NodeMap) → string`. `emitFactory(node: AssembledBranch | AssembledContainer)` for single-form nodes. `emitFormFactory(node: AssembledPolymorph, form: AssembledForm)` for per-form factories. Access fields via `node.fields` / `form.fields` (already have `propertyName`, `paramName`, `required`, `multiple`, `contentTypes`). Remove imports from `node-model.ts` and `naming.ts`.
- [x] T037 Rewrite `emitters/rules.ts` → new file `emitters/templates.ts`: entry `emitTemplatesYaml(nodeMap: NodeMap) → string`. `emitTemplate(node: AssembledBranch | AssembledContainer)` produces per-node template rule. `emitPolymorphTemplates(node: AssembledPolymorph)` produces per-form template rules. Separator comes from `AssembledContainer.separator` (no `detectRecursiveSeparator`). Clauses come from Rule tree (via `mergedRules` on collapsed forms). Remove all eliminated functions (tryClause, needsSpace, buildWordBoundary, etc.).
- [x] T038 Rewrite `emitters/from.ts`: entry `emitFrom(nodeMap: NodeMap) → string`. **Derives from factory signatures, not the node model.** `emitFromFunction(node: AssembledNode)` for each node with a factory. `emitFormFrom(node: AssembledPolymorph, form: AssembledForm)` for per-form from. `resolveFieldStrategy(field: AssembledField) → strategy` picks resolver based on `field.contentTypes`. `emitResolver(strategy) → string` emits resolver code. Remove imports from `node-model.ts` and `naming.ts`.
- [x] T039 Rewrite `emitters/ir-namespace.ts` → new file `emitters/ir.ts`: entry `emitIr(nodeMap: NodeMap) → string`. **Derives from factory exports, not the node model.** Thin namespace wrapper re-exporting factories + from with form accessors. Remove imports from `node-model.ts` and `naming.ts`.
- [ ] T040 [P] Rewrite `emitters/wrap.ts`: entry `emitWrap(nodeMap: NodeMap) → string`. Switch on `AssembledNode.modelType` for per-kind wrap functions. Access fields via `node.fields` with `propertyName`. Remove imports from `node-model.ts` and `naming.ts`.
- [x] T041 [P] Rewrite `emitters/consts.ts`: entry `emitConsts(nodeMap: NodeMap) → string`. Iterate `nodeMap.nodes`, emit kind/keyword/operator arrays. Remove imports from `node-model.ts` and `naming.ts`.
- [x] T042 [P] Rewrite `emitters/grammar.ts`: entry `emitGrammar(nodeMap: NodeMap) → string`. Emit grammar type literal. Remove imports from `naming.ts`.
- [x] T042a [P] Rewrite `emitters/index-file.ts`: entry `emitIndex(nodeMap: NodeMap) → string`. Barrel re-exports. Remove imports from `node-model.ts`.
- [x] T042b [P] Rewrite `emitters/client-utils.ts`: entry `emitUtils(nodeMap: NodeMap) → string`. Emit `isNodeData`, `_inferBranch`, `_BRANCH_FIELDS`. Remove imports from `node-model.ts`.
- [x] T042c [P] Rewrite `emitters/test-new.ts`: entry `emitTests(nodeMap: NodeMap) → string`. Per-kind test generation using `AssembledNode.modelType`. Remove imports from `node-model.ts` and `naming.ts`.
- [x] T042d [P] Rewrite `emitters/type-test.ts`: entry `emitTypeTests(nodeMap: NodeMap) → string`. Type assertion tests. Remove imports from `node-model.ts` and `naming.ts`.
- [x] T042e [P] `emitters/config.ts` — already NodeMap-compatible (takes only `{ grammar }`, never imported from `node-model.ts`). No rewrite needed.
- [ ] T042f Create `emitters/suggested.ts`: entry `emitSuggestedOverrides(linked: LinkedGrammar) → string`. Emit `overrides.suggested.ts` as a grammar extension from `linked.suggestedOverrides`. Each entry includes derivation source and confidence in comments.

### Phase 2g-verify: Emitter NodeMap-only enforcement

- [x] T042g Grep all files in `packages/codegen/src/emitters/` for imports from `node-model.ts`, `naming.ts`, `enriched-grammar.ts`, `hydration.ts`, `grammar-model.ts`, `factoring.ts` — verify zero matches. Every emitter must import only from `compiler/rule.ts` (for types) and `compiler/assemble.ts` (for naming helpers if needed).
- [x] T042h Grep all emitter function signatures for `HydratedNodeModel`, `HydratedFieldModel`, `HydratedChildrenModel`, `GrammarRule`, `StructuralNode`, `StructuralVariant` — verify zero matches. Every emitter parameter must be `NodeMap` or `AssembledNode` variants.

**Checkpoint**: All emitters consume `NodeMap` exclusively. No imports from old model modules. E2e validation tests pass.

### Phase 2h: CLI Integration

- [x] T043 Rewrite `packages/codegen/src/cli.ts` to compose phases: evaluate → link → optimize → assemble → emit. Remove all calls to old pipeline functions.
- [x] T044 Update `packages/codegen/src/index.ts` to export phase functions and types as public API

**Checkpoint**: `npx tsx packages/codegen/src/cli.ts --grammar rust --all` produces correct output via the new pipeline

### Phase 2i: Delete Old Code

- [ ] T045a [P] Delete grammar loading files absorbed into Evaluate: `packages/codegen/src/grammar-reader.ts`, `packages/codegen/src/grammar.ts`, `packages/codegen/src/overrides.ts`, `packages/codegen/src/grammar-model.ts`
- [ ] T045b [P] Delete classification/enrichment files absorbed into Link and Assemble: `packages/codegen/src/enriched-grammar.ts`, `packages/codegen/src/classify.ts`, `packages/codegen/src/semantic-aliases.ts`, `packages/codegen/src/node-types.ts`
- [ ] T045c [P] Delete model/optimization files absorbed into Assemble: `packages/codegen/src/node-model.ts`, `packages/codegen/src/build-model.ts`, `packages/codegen/src/hydration.ts`, `packages/codegen/src/naming.ts`, `packages/codegen/src/optimization.ts`, `packages/codegen/src/kind-projections.ts`
- [ ] T045d [P] Delete factoring/token files absorbed into Optimize: `packages/codegen/src/factoring.ts`, `packages/codegen/src/token-attachment.ts`, `packages/codegen/src/token-names.ts`
- [ ] T046 Delete `packages/codegen/src/emitters/rules.ts` (replaced by `emitters/templates.ts`)
- [ ] T047 Verify no remaining imports reference deleted files — run type-check across all packages

**Checkpoint**: Foundation complete — all phases working, old code deleted, type-check passes, e2e tests pass

---

## Phase 3: User Story 1 - Run codegen for any supported grammar (Priority: P1) 🎯 MVP

**Goal**: Verify the new pipeline produces functionally equivalent output for all three grammars

**Independent Test**: Run codegen for all three grammars, diff against golden snapshots, confirm e2e tests pass

- [ ] T048 [US1] Run codegen for Rust grammar via new pipeline, diff against golden snapshot in `specs/005-five-phase-compiler/baseline/rust/`. For each diff: classify as (a) intentional improvement, (b) formatting-only, or (c) regression. Fix all regressions. Document intentional changes in `specs/005-five-phase-compiler/baseline/rust-diff-notes.md`
- [ ] T049 [US1] Run codegen for TypeScript grammar via new pipeline, diff against golden snapshot in `specs/005-five-phase-compiler/baseline/typescript/`. For each diff: classify as (a) intentional improvement, (b) formatting-only, or (c) regression. Fix all regressions. Document intentional changes in `specs/005-five-phase-compiler/baseline/typescript-diff-notes.md`
- [ ] T050 [US1] Run codegen for Python grammar via new pipeline, diff against golden snapshot in `specs/005-five-phase-compiler/baseline/python/`. For each diff: classify as (a) intentional improvement, (b) formatting-only, or (c) regression. Fix all regressions. Document intentional changes in `specs/005-five-phase-compiler/baseline/python-diff-notes.md`
- [x] T051 [US1] Run full e2e validation test suite — all 1111 tests pass across 32 files. Fixed 5 latent bugs: polymorph form factories now return the parent kind (via `AssembledGroup.parentKind`), `resolveIrKeys` uses a two-phase claim so suffix-stripped collisions are resolved correctly, the ir namespace uses a `_attach(fn, props)` helper (via `Object.defineProperty`) so polymorphs with a form named `name` don't throw, and `test-v2` emits non-empty dummies for multiple fields and branch children slots. See commit `0b7a463`.
- [ ] T052 [US1] Run type-check across all packages (`pnpm -r run type-check`) and fix any errors

### Runtime validation — readNode + factory round-trips

These are the critical acceptance tests. Generated code must actually work at runtime when parsing real source and reconstructing it through factories.

- [ ] T052a [US1] readNode round-trip: corpus → tree-sitter parse → readNode → NodeData. Verify the NodeData has the expected `type`, `fields`, and `children` for each corpus entry. Uses `packages/codegen/fixtures/*.txt` as corpus.
- [ ] T052b [US1] Factory round-trip: corpus → parse → readNode → strip metadata → call factory with the stripped data → verify factory-produced NodeData matches readNode output structurally
- [ ] T052c [US1] Render round-trip: factory-produced NodeData → render → re-parse with tree-sitter → verify the kind and structure match the original
- [ ] T052d [US1] from() round-trip: corpus → parse → readNode → strip metadata → call `.from()` on loose input (string for leaves, object-with-kind for branches) → verify result matches factory output structurally
- [ ] T052d-i [US1] from() with string inputs for leaf-typed fields: verify `ir.branch.from({ name: 'x', ... })` produces the same NodeData as `ir.branch({ name: ir.identifier('x'), ... })`
- [ ] T052d-ii [US1] from() with mixed objects/nodes: verify objects with a `kind` discriminator resolve to the right factory
- [ ] T052d-iii [US1] from() with supertype inputs: verify loose input matching a supertype's subtype resolves correctly (e.g., an `expression` field accepting any expression subtype)
- [ ] T052e [US1] Wire `validate-factory-roundtrip.ts` and `validate-from.ts` into the v2 CLI: when `--roundtrip` flag is passed, run both factory and from() round-trips against the v2-generated output
- [ ] T052f [US1] Create vitest test file `packages/codegen/src/__tests__/roundtrip.test.ts` that runs BOTH factory and from() round-trip validators against the v2 pipeline output for all 3 grammars with representative corpus fixtures

### Code dedup in emitters

The from emitter should share resolver functions across fields with identical content-type signatures. A field typed `expression | identifier` shared across 10 different branches should generate ONE resolver function, not 10 inline copies.

- [ ] T042i Dedupe resolvers in `emitters/from-v2.ts`: group fields by canonical content-type signature, emit one resolver per signature, reference it from each field site
- [ ] T042j Dedupe factory method signatures in `emitters/factories-v2.ts`: children-only nodes with identical child-type signatures share their setter/getter method signatures
- [ ] T042k Dedupe type unions in `emitters/types-v2.ts`: if multiple fields have the same content-type union, hoist the union into a named type alias used by all referencing fields

**Checkpoint**: All three grammars produce correct output. E2e tests pass. Type-check passes. readNode + factory + render + from() all round-trip correctly. MVP complete.

---

## Phase 4: User Story 2 - Inspect and test each phase independently (Priority: P2)

**Goal**: Each phase is independently unit-testable with deterministic output and no global state

**Independent Test**: Run per-phase unit tests in isolation without any global setup

- [ ] T053 [P] [US2] Verify Evaluate unit tests run independently with no global state — assert no module-level mutable variables in `packages/codegen/src/compiler/evaluate.ts`
- [ ] T054 [P] [US2] Verify Link unit tests run independently — assert `link()` accepts `RawGrammar` as sole input (no overrides parameter)
- [ ] T055 [P] [US2] Verify Optimize unit tests run independently — assert `optimize()` accepts `LinkedGrammar` as sole input
- [ ] T056 [P] [US2] Verify Assemble unit tests run independently — assert `assemble()` accepts `OptimizedGrammar` as sole input
- [ ] T057 [P] [US2] Verify each emitter can be called with a NodeMap and produces deterministic output — no access to grammar rules or intermediate representations

**Checkpoint**: All phase functions are independently testable. No global state anywhere in the pipeline.

---

## Phase 5: User Story 3 - Add a new grammar without pipeline changes (Priority: P2)

**Goal**: Adding a new grammar requires zero pipeline code changes

**Independent Test**: Verify the pipeline contains no language-specific conditionals

- [ ] T058 [US3] Grep all compiler and emitter source files in `packages/codegen/src/compiler/` and `packages/codegen/src/emitters/` for language-specific patterns (`if (language ===`, `if (kind ===`, `if (grammar ===`). List all matches with file:line.
- [ ] T058a [US3] For each match from T058: refactor the conditional to use override-driven classification or structural pattern matching. Verify no hardcoded kind names remain.
- [ ] T059 [US3] Audit `packages/codegen/src/compiler/` and `packages/codegen/src/emitters/` for hardcoded kind names (e.g., `integer_literal`, `float_literal`, `boolean_literal`, `function_item`). Replace with override-driven or structurally-derived logic.

**Checkpoint**: Zero language-specific conditionals. Pipeline is grammar-agnostic.

---

## Phase 6: User Story 4 - Polymorphic nodes produce per-form output (Priority: P3)

**Goal**: Polymorphs produce distinct per-form factories, types, and templates

**Independent Test**: Generate output for a known polymorph and verify per-form artifacts

- [ ] T060 [US4] Verify polymorph classification in Assemble — check Rust `use_declaration` (or similar) is classified as `polymorph` with correct forms
- [ ] T061 [US4] Verify per-form factory generation — each form has its own factory function with form-specific parameters
- [ ] T062 [US4] Verify per-form template generation — each form has its own render template
- [ ] T063 [US4] Verify form collapse — forms with identical field sets and no detect token are collapsed with mergedRules preserved

**Checkpoint**: Polymorph handling verified end-to-end.

---

## Phase 7: User Story 5 - Optimizations preserve output correctness (Priority: P3)

**Goal**: Every optimization is demonstrably non-lossy

**Independent Test**: Compare emitted output with and without optimization for representative rules

- [ ] T064 [US5] Add test in `packages/codegen/src/__tests__/optimize.test.ts` verifying that Optimize never modifies named content (string values, pattern values, field metadata, clause/enum/supertype/group content, whitespace directives)
- [ ] T065 [US5] Add test verifying that collapsed polymorph forms retain all mergedRules for template generation
- [ ] T066 [US5] Add test verifying that prefix/suffix factoring produces templates with identical rendered output

**Checkpoint**: Non-lossy invariants verified with targeted tests.

---

## Phase 8: User Story 6 - Pipeline suggests overrides from reference graph analysis (Priority: P3)

**Goal**: Running codegen generates `overrides.suggested.ts` with actionable suggestions

**Independent Test**: Run codegen on a grammar with no overrides, verify suggested file is generated

- [ ] T067 [US6] Verify `overrides.suggested.ts` is generated for Rust grammar with field name inference entries (5/6 parent agreement → suggestion)
- [ ] T068 [US6] Verify `overrides.suggested.ts` contains supertype promotion candidates (hidden choice with 5+ parent refs)
- [ ] T069 [US6] Verify entries already in `overrides.ts` are omitted from `overrides.suggested.ts`
- [ ] T069a [US6] Verify when manual override at position X has field name 'a' and pipeline infers field name 'b' at same position, the suggestion is omitted (manual wins) with diagnostic note in `packages/codegen/src/__tests__/link.test.ts`
- [ ] T070 [US6] Verify `overrides.suggested.ts` is a valid grammar extension that can be loaded by the pipeline

**Checkpoint**: Suggested overrides generation works for all three grammars.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup and validation

- [ ] T071 Run `pnpm test` for full test suite verification
- [ ] T072 Run `pnpm -r run type-check` for full type-check verification
- [ ] T073 Diff all three grammar outputs against golden snapshots — document any intentional differences
- [ ] T074 Remove golden snapshot directory `specs/005-five-phase-compiler/baseline/` (investigation complete)
- [ ] T075 Delete `common.sh.backup` (functions restored to `common.sh`)

---

## Phase 10: Cleanup Backlog (merged from cleanup-backlog.md)

**Purpose**: Simplifications and debt pay-downs tracked during and after
the v1→v2 milestone. Not functional blockers — they pay down complexity
that accumulated while the pipeline was being landed incrementally.
Overarching theme: **lean on the AssembledNode class hierarchy**. Phase 4
produces real class instances, so emitters should consume them directly
rather than recomputing via free functions.

**Priority chain (all completed):** C1 → C3 → C9 → C10 → C11.

- [x] **C1** Collapse free-function naming helpers into `AssembledNode`.
  Moved `typeName`, `factoryName`, `irKey`, `rawFactoryName`,
  `treeTypeName`, `configTypeName`, `fromInputTypeName`,
  `fromFunctionName` onto the class as readonly fields / getters.
  `naming.ts` still exists but v2 emitters no longer import from it.
- [x] **C2** Unify ir-key resolution into `assemble.ts` → `resolveIrKeys()`
  post-pass. `buildIrKeyMap` in `emitters/ir-keys.ts` deleted; emitters
  read `node.irKey` directly.
- [x] **C3** Collapse per-emitter `toTypeName` / `toRawFactoryName` /
  `toShortName` copies. Folded into C1 — every v2 emitter now pulls
  names from the class.
- [ ] **C4** Delete v1 grammar-loading / model files absorbed into v2.
  Covered by **T045a-d** and **T046** above. Blocked by C6 (below).
  Files to delete: `grammar-reader.ts`, `grammar.ts`, `overrides.ts`,
  `grammar-model.ts`, `enriched-grammar.ts`, `classify.ts`,
  `semantic-aliases.ts`, `node-types.ts`, `node-model.ts`,
  `build-model.ts`, `hydration.ts`, `naming.ts`, `optimization.ts`,
  `kind-projections.ts`, `factoring.ts`, `token-attachment.ts`,
  `token-names.ts`, `emitters/rules.ts`. Keep `validate-templates.ts`.
- [ ] **C5** Delete the `NodeMap → HydratedNodeModel` adapter
  (`packages/codegen/src/compiler/adapter.ts`). Blocked by **T040**:
  `wrap.ts` currently consumes `HydratedNodeModel[]` via the adapter
  and must first be rewritten to dispatch on `AssembledNode.modelType`
  directly. Once T040 lands, delete `adapter.ts`.
- [ ] **C6** Delete the legacy `generate()` path in
  `packages/codegen/src/index.ts`. **Blocked by C6-prereq (from.ts
  resolver gap — see comparison findings below).** v2 is a functional
  superset of v1 for every file *except* `from.ts`, which has a real
  capability regression. Work order once unblocked: migrate
  `validate-all.test.ts` to `generateV2`, drop `RT_CEILINGS`, delete
  v1 `generate()`, then C4 and C16 follow.
- [x] **C7** Classifier: add `terminal` and `polymorph` to the spec
  doc. Updated `specs/sittir-grammar-compiler-spec.md` taxonomy table
  and rule-variant-presence table. Commit `c583646`.
- [ ] **C8** Move `hasAnyField` / `hasAnyChild` into class constructors.
  **Not applicable** — these predicates are called from `classifyNode`
  and `promotePolymorph` on raw `Rule` objects, *before* any
  `AssembledNode` exists. No simplification possible at call sites.
- [x] **C9** Templates walker: hoist into `AssembledNode.renderTemplate()`.
  `templates-v2.ts` shrunk from ~400 lines to 81 (preamble + dispatch
  loop + YAML serialisation). Walker helpers (`renderRule`, `joinParts`,
  `needsSpace`, `findRepeatSeparator`) live in `rule.ts`.
- [x] **C10** Factory emitter: hoist per-model emission into
  `AssembledNode.emitFactory()`. `factories-v2.ts` shrunk from 346
  lines to 108. Commit `f818b15`.
- [x] **C11** from-v2: collapse per-model `emitXxxFrom` into
  `AssembledNode.emitFromFunction(nodeMap)`. `from-v2.ts` shrunk from
  263 lines to 85. Commit `3063164`.
- [ ] **C12** `validate-templates` and `validate-renderable` should
  share a rule-lookup sourced from NodeMap instead of re-parsing the
  generated YAML. Substantial rework: also need to migrate
  `cli.ts`, `corpus-validation.test.ts`, `validate-all.test.ts` call
  sites. The YAML round-trip becomes an output check only.
- [x] **C13** Move `convert-overrides.ts` out of `src/compiler/` into
  `packages/codegen/scripts/` with a note explaining its historical
  one-shot role. Commit `6bc6bf3`.
- [x] **C14** Spec doc refresh. Added notes on `promoteTerminals`
  (Link) and `promotePolymorph` (Optimize); described the class
  hierarchy and pure-switch classification in the Phase 4 Assemble
  section. Commit `c583646`.
- [ ] **C15** Test infrastructure: consolidate the shared ~60% of
  `validate-roundtrip.ts`, `validate-factory-roundtrip.ts`, and
  `validate-from.ts` (tree-sitter adapter, corpus loading,
  wrap-for-reparse) into `packages/codegen/src/validators/common.ts`.
  Each validator keeps only its per-kind check.
- [ ] **C16** Delete `RT_CEILINGS` from
  `packages/codegen/tests/integration/validate-all.test.ts`.
  Blocked by C6 — the ceilings were calibrated against v1 factories
  on disk; `corpus-validation.test.ts` is the authoritative v2 guard.
- [ ] **C17** Audit node-types.json usage. Link converts
  `_indent`/`_dedent`/`_newline` external symbol refs via name
  matching, which breaks for grammars using differently-named
  externals. Make detection either explicit (`externalRoles` config)
  or position-based from the grammar's `externals` list.
- [ ] **C18** Remove `any` casts from field access in factory and
  from emitters. `(config as any)?.${propertyName}` can become typed
  access now that `ConfigOf<T>` is fully defined. Fluent getters/
  setters should return concrete field types.
- [ ] **C19** Full type-check across all generated packages. Tracked
  under **T052**. Residual errors: stale supertype Tree names, missing
  leaf interfaces for external tokens, kinds referenced in field type
  unions without emitted interfaces. Needs completion of `types-v2`
  stub interface emission.

### Apples-to-apples v1-vs-v2 comparison (recorded 2026-04-12)

Ran both pipelines on every grammar via
`packages/codegen/scripts/compare-v1-v2.ts` and diffed the emitted
files. Counts below are **after** the enum `factoryName` fix in
`assemble.ts` (commit `56b9f61`).

**Byte-identical output:** `grammar.ts`, `index.ts` (all three grammars).

**v2 strictly leaner:**
- `factories.ts` — v1 slightly larger due to snake_case + trailing-
  underscore naming (`abstract_type_` vs `abstractType`). Same
  semantic coverage after the enum fix.
- `utils.ts` — v1 78 → v2 50 lines (shared helper consolidation).

**v2 strictly broader (more coverage):**
- `types.ts` — v2 +145 rust / +179 ts / +97 python interfaces. v2
  emits stub interfaces for every kind a field union references.
- `templates.yaml` — v2 +67 rust / +197 ts / +82 python entries. v2's
  pure-switch classifier catches rules v1's heuristic path dropped.
- `wrap.ts`, `consts.ts`, `type-tests.ts`, `tests.test.ts` — all
  larger in v2, matching the broader node coverage.
- `from.ts` bindings — v1=163/167/**1** vs v2=174/217/138. Python v1
  effectively only emitted one from() binding — a v1 regex bug.

**v2 leaner-but-less-capable (real regression — see C6-prereq below):**
- `from.ts` — v1 4528/4738/2926 lines → v2 1555/1877/1203. v2's
  size drop is not purely dedup; it's missing substantial resolver
  logic v1 had.

### Findings worth acting on

1. **Enum factoryName drop (fixed, commit `56b9f61`).** `assemble.ts`
   case `'enum'` constructed `AssembledEnum` without passing
   `factoryName` / `irKey`, so visible enums (rust `boolean_literal`,
   `primitive_type`, `fragment_specifier`, etc.) emitted interfaces
   + SyntaxKind entries but no factories. One-line fix; rust gained
   4 factories, ts gained 1, python unchanged. All 507 tests still
   pass.

2. **`doc_comment` elimination (needs investigation).** v1 had a
   standalone `doc_comment` kind in rust. v2 only emits the
   `_line_doc_comment_marker` / `_block_doc_comment_marker` pair.
   Unclear whether v2's classification is correct (they may be the
   actual tree-sitter kinds and `doc_comment` a v1 invention) or
   whether Link is eagerly inlining something it shouldn't.

3. **Python from() coverage.** v1 emitted a single `from` function
   for all of python — a v1 regex/detection bug, not a v2 gap.

- [ ] **C6-prereq** **from.ts resolver emission (v1 parity + dedup).**
  v1 emits 258 private `_resolve*` / `_r*` helpers plus `_leafRegistry`,
  `_resolveByKind`, `_resolveScalar`, `_resolveLeafString` dispatch
  infrastructure. v2 emits zero private resolvers — `resolveField()`
  inlines a minimal passthrough.

  | Capability | v1 | v2 |
  |---|---|---|
  | Loose string → single-leaf wrap | ✓ | ✓ |
  | Loose string → leaf-by-value/pattern dispatch | ✓ | ✗ |
  | Array field → map each loose element | ✓ | ✗ (raw passthrough) |
  | Supertype field → dispatch by object `kind` | ✓ | ✗ |
  | Branch inference (object without kind) | ✓ (helpful error) | ✗ (silent passthrough) |
  | JS primitive → leaf (`true` → boolean_literal) | ✓ | ✗ |
  | Variadic container children | ✓ (array unwrap) | partial |

  Example — v1 `blockFrom` maps each child through a typed resolver;
  v2 `blockFrom` passes `input.children` straight through as-is.
  Corpus validators don't catch this because they feed materialized
  NodeData, not loose developer input. **Proposed work order:**
  (a) `_fromMap` runtime dispatch wiring — already done,
  (b) emit shared `_resolveByKind(kind, rest) → _fromMap[kind](rest)`,
  (c) teach `resolveField` to emit array map calls for `multiple`
  branch fields, (d) emit per-signature resolver helpers deduped
  by content-type signature (supersedes T042i), (e) emit
  `_resolveScalar` for primitive coercion. Unblocks C6.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup. Sub-phases are strictly sequential: Evaluate → Link → Optimize → Assemble → Emit → CLI → Delete
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - US1 (P1) must complete before US2-US6 (validates correctness)
  - US2, US3, US4, US5, US6 can proceed in parallel after US1

### Within Foundational Phase

```
T001-T004 (Setup)
    ↓
T005-T014, T014a, T009a, T008a, T008b, T010a (Evaluate + edge cases)
    ↓
T011-T013 (Override conversions — can run after Evaluate works)
    ↓
T015-T022, T019a, T016a (Link + edge cases)
    ↓
T023-T026 (Optimize)
    ↓
T027-T032, T027a, T027b, T029a (Assemble + edge cases)
    ↓
T033-T033c (NodeMap adapter + tests)
    ↓
T034-T034h (Eliminate functions that moved to compiler phases)
    ↓
T035-T042f (Rewrite emitters to consume NodeMap) — T040-T042e are [P]
    ↓
T042g-T042h (NodeMap-only enforcement verification)
    ↓
T043-T044 (CLI)
    ↓
T045a-T045d, T046-T047 (Delete old code) — all [P]
```

### Parallel Opportunities

- **T011, T012, T013**: Override conversion for three grammars (independent files)
- **T038, T039, T040, T041**: Emitter migrations that don't depend on each other
- **T053-T057**: US2 verification tasks (independent per phase)
- **T060-T063**: US4 polymorph verification (independent per artifact type)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T047) — the bulk of the work
3. Complete Phase 3: User Story 1 (T048-T052) — validate correctness
4. **STOP and VALIDATE**: All three grammars produce correct output
5. All remaining user stories are verification/refinement on top of the working pipeline

### Why This Order Works

The foundational phase IS the rewrite. User stories 2-6 are validation and verification — they test properties that the foundational work should already exhibit. If the foundation is built correctly:
- US2 (phase independence) should already pass
- US3 (grammar-agnostic) should already pass
- US4 (polymorphs) should already pass
- US5 (non-lossy) should already pass
- US6 (suggested overrides) requires T042 + T067-T070

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- This is a big bang rewrite: Phase 2 (Foundational) builds the entire new pipeline
- User stories 2-6 are primarily verification that Phase 2 was built correctly
- Override file conversion (T011-T013) must happen alongside Evaluate — the new pipeline can't read old overrides.json
- Delete old code (T045-T047) comes last in Foundational to allow reference during migration
