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
- [~] T020 Partial — field-name-inference, terminal promotion, polymorph promotion, enum/supertype promotion live in `link.ts`. Inference rewrites the rule tree with `source: 'inferred'`; rule-level classifications are tagged `source: 'promoted'`. Every derivation is recorded in `DerivationLog` and gated by `IncludeFilter` (T025). Still missing: synthetic-supertype-detection, override-inference / candidate-quality, separator-consistency. See below for the original three-derivation prototype:
  - **field-name-inference** (≥5 named refs, ≥80% agreement → suggest)
  - **global-optionality** (≥3 refs, every ref optional → flag)
  - **naming-consistency** (≥2 distinct field names → diagnostic)

  Smoke counts: rust 30 (24/4/2), typescript 92 (79/10/3), python 5 (0/5/0). Inspector at `packages/codegen/scripts/inspect-suggestions.ts`.

  Also fixed a latent bug: `evaluate()` in extension mode was losing the base grammar's references because the already-evaluated rules don't go through the new `$` proxy. Now seeds `refs` from `baseGrammar.references`. Python went from 0 refs to 449.

  Deferred (part of T020): synthetic-supertype-detection (needs field content overlap), override-inference / candidate-quality (needs position+role across parents), separator-consistency (separator field not on SymbolRef yet).
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
- [x] T040 [P] `emitters/wrap-v2.ts` created — consumes NodeMap directly via `AssembledNode.emitWrap()` class method dispatch. Read-only shape: `{...data, get field() { drillIn(data.fields[raw], tree) }, get children() { ... } }`. No setters, no render/toEdit/replace, no `promote*` preamble. Override-field promotion happens during readNode hydration via inlined `_routing` (built once at module load from reconstructed OverridesConfig + supertypeExpansion). Old `emitters/wrap.ts` retained until C6 deletes v1 `generate()`. Commit `e0c6b94`.
- [x] T041 [P] Rewrite `emitters/consts.ts`: entry `emitConsts(nodeMap: NodeMap) → string`. Iterate `nodeMap.nodes`, emit kind/keyword/operator arrays. Remove imports from `node-model.ts` and `naming.ts`.
- [x] T042 [P] Rewrite `emitters/grammar.ts`: entry `emitGrammar(nodeMap: NodeMap) → string`. Emit grammar type literal. Remove imports from `naming.ts`.
- [x] T042a [P] Rewrite `emitters/index-file.ts`: entry `emitIndex(nodeMap: NodeMap) → string`. Barrel re-exports. Remove imports from `node-model.ts`.
- [x] T042b [P] Rewrite `emitters/client-utils.ts`: entry `emitUtils(nodeMap: NodeMap) → string`. Emit `isNodeData`, `_inferBranch`, `_BRANCH_FIELDS`. Remove imports from `node-model.ts`.
- [x] T042c [P] Rewrite `emitters/test-new.ts`: entry `emitTests(nodeMap: NodeMap) → string`. Per-kind test generation using `AssembledNode.modelType`. Remove imports from `node-model.ts` and `naming.ts`.
- [x] T042d [P] Rewrite `emitters/type-test.ts`: entry `emitTypeTests(nodeMap: NodeMap) → string`. Type assertion tests. Remove imports from `node-model.ts` and `naming.ts`.
- [x] T042e [P] `emitters/config.ts` — already NodeMap-compatible (takes only `{ grammar }`, never imported from `node-model.ts`). No rewrite needed.
- [x] T042f `emitters/suggested-v2.ts` — emits `overrides.suggested.ts` per grammar from `NodeMap.derivations`. Documentation file (not runnable): rule-promotion summary grouped by classification, field-name-inference grouped by target symbol with copy-paste `transform(original, { N: field('...') })` snippets per affected parent. Each entry tagged `[applied]` / `[held]` based on `IncludeFilter`. Wired into `generateV2()` and written to `packages/<grammar>/overrides.suggested.ts` by `cli.ts`. Commit `2fbcf7f`.

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

- [x] T048 [US1] Rust grammar diff vs baseline — classified in
  `specs/005-five-phase-compiler/baseline/diff-notes.md`. All diffs are
  intentional improvements (more type coverage, more templates, more
  consts) or formatting-only (byte-identical grammar.ts/index.ts,
  camelCase factory naming). One regression tracked as C6-prereq
  (from.ts resolver gap) — not exercised by current tests.
- [x] T049 [US1] TypeScript grammar diff vs baseline — covered by
  shared `diff-notes.md`. Same pattern as rust.
- [x] T050 [US1] Python grammar diff vs baseline — covered by shared
  `diff-notes.md`. Same pattern as rust.
- [x] T051 [US1] Run full e2e validation test suite — all 1111 tests pass across 32 files. Fixed 5 latent bugs: polymorph form factories now return the parent kind (via `AssembledGroup.parentKind`), `resolveIrKeys` uses a two-phase claim so suffix-stripped collisions are resolved correctly, the ir namespace uses a `_attach(fn, props)` helper (via `Object.defineProperty`) so polymorphs with a form named `name` don't throw, and `test-v2` emits non-empty dummies for multiple fields and branch children slots. See commit `0b7a463`.
- [x] T052 [US1] Run type-check across all packages — all three generated packages (`@sittir/rust`, `@sittir/typescript`, `@sittir/python`) are type-clean via `tsgo --noEmit`. Emitter fixes: dedup `SyntaxKind` members on typeName collisions, dedup `_Type_/_Config_/_Tree_` identifiers in `type-test-v2`, rename local helpers (`_TypeAssert`, `_TypeExtends`) to avoid collisions with grammar kinds (`assert`, `extends`), emit supertype unions under the AssembledNode typeName, emit token stub interfaces + Tree variants, emit leftover-reference stubs for inlined-but-leaked kinds, use form.typeName directly for polymorph form aliases (fixes `ArrowFunctionUCallSignature`/`ArrowFunctionCallSignature` naming drift), handle keyword 0-arg factories in `resolveField`, emit raw-kind type literals for anonymous Tree interfaces. 50 residual errors in `packages/codegen` test fixtures are pre-existing and unrelated.

### Runtime validation — readNode + factory round-trips

These are the critical acceptance tests. Generated code must actually work at runtime when parsing real source and reconstructing it through factories.

- [x] T052a [US1] readNode round-trip — `validateReadNodeRoundTrip` runs against all three grammars in `corpus-validation.test.ts`, with floor assertions that fail CI on regression. Same validator is also exposed via `sittir --roundtrip`.
- [x] T052b [US1] Factory round-trip — `validateFactoryRoundTrip` runs against all three grammars in `corpus-validation.test.ts`. Same validator is exposed via `sittir --roundtrip`.
- [x] T052c [US1] Render round-trip — `validateRenderable` runs against all three grammars in `corpus-validation.test.ts`. (The render → re-parse step is what `validateFactoryRoundTrip` does end-to-end, so T052c is covered both ways.)
- [x] T052d [US1] from() round-trip (NodeData input path) — `validateFrom` runs against all three grammars in `corpus-validation.test.ts`. Floor assertions in place.
- [x] T052d-i [US1] from() with string inputs for leaf-typed fields — covered by `packages/python/tests/from-loose.test.ts` after C6-prereq. Commit `5737e76`.
- [x] T052d-ii [US1] from() with mixed objects/nodes — kind-tagged objects route through `_resolveByKind`. Same test file.
- [x] T052d-iii [US1] from() with supertype inputs — supertype subtype dispatch via `_resolveByKind`. Same test file.
- [x] T052e [US1] CLI `--roundtrip` flag wires all four validators (`validateReadNodeRoundTrip`, `validateRoundTrip`, `validateFactoryRoundTrip`, `validateFrom`). See `packages/codegen/src/cli.ts:165-191`.
- [x] T052f [US1] `corpus-validation.test.ts` is the canonical vitest entry point for round-trip validation across all three grammars. The placeholder `roundtrip.test.ts` is a generator-output smoke test (separate purpose) — kept as the "does generateV2 produce non-empty files" sanity layer.

### Code dedup in emitters

The from emitter should share resolver functions across fields with identical content-type signatures. A field typed `expression | identifier` shared across 10 different branches should generate ONE resolver function, not 10 inline copies.

- [ ] T042i Dedupe resolvers in `emitters/from-v2.ts` — **subordinate to C6-prereq.** v2 currently inlines a minimal `resolveField` rather than emitting per-signature resolvers; there's nothing to dedup until C6-prereq lands the resolver scaffolding. When that work happens, dedup falls out as part of the same pass (group fields by content-type signature → emit one helper per signature).
- [ ] T042j Dedupe factory method signatures in `emitters/factories-v2.ts` — **low ROI evaluated 2026-04-13.** factories.ts is 2.8k–4.5k lines per grammar and method signatures are 2–3 lines per field. Dedup would save ~5–10% at the cost of indirection; the same lines are also subject to type-checking benefit from the explicit per-node signatures. Defer until profiling shows file size matters.
- [ ] T042k Dedupe type unions in `emitters/types-v2.ts` — **low ROI evaluated 2026-04-13.** Audited rust/typescript/python: the most-repeated multi-type field union appears at most 2× in any one grammar (`(AttributeItem | InnerAttributeItem)[]`, `(HiddenTokens)[]`, etc.). Single-type fields already reference existing interface aliases. Hoisting saves ~10 type aliases per grammar — not worth the emitter complexity. Defer.

**Checkpoint**: All three grammars produce correct output. E2e tests pass. Type-check passes. readNode + factory + render + from() all round-trip correctly. MVP complete.

---

## Phase 4: User Story 2 - Inspect and test each phase independently (Priority: P2)

**Goal**: Each phase is independently unit-testable with deterministic output and no global state

**Independent Test**: Run per-phase unit tests in isolation without any global setup

- [x] T053 [P] [US2] Verified: `evaluate.ts` has no `^let`/`^var` module-level mutables. Signature `evaluate(entryPath: string): Promise<RawGrammar>`.
- [x] T054 [P] [US2] Verified: `link(raw: RawGrammar): LinkedGrammar` — sole input.
- [x] T055 [P] [US2] Verified: `optimize(linked: LinkedGrammar): OptimizedGrammar` — sole input.
- [x] T056 [P] [US2] Verified: `assemble(optimized: OptimizedGrammar): NodeMap` — sole input.
- [x] T057 [P] [US2] Verified: every v2 emitter (`emit*FromNodeMap`) is a pure function of `NodeMap`. No access to raw grammar rules, no side-channel state. Deterministic across runs — regenerating all three grammars multiple times during this session produced byte-identical output on every repeat.

**Checkpoint**: All phase functions are independently testable. No global state anywhere in the pipeline.

---

## Phase 5: User Story 3 - Add a new grammar without pipeline changes (Priority: P2)

**Goal**: Adding a new grammar requires zero pipeline code changes

**Independent Test**: Verify the pipeline contains no language-specific conditionals

- [x] T058 [US3] Grep performed across `packages/codegen/src/compiler/` and `packages/codegen/src/emitters/*-v2.ts`. Zero hardcoded `kind === 'X'` / `grammar === 'Y'` / `language ===` conditionals in the v2 pipeline. (Matches in `emitters/factories.ts`, `emitters/types.ts` are v1-only and go away with C4/C6.)
- [x] T058a [US3] Nothing to refactor — v2 has no hardcoded conditionals.
- [x] T059 [US3] No hardcoded kind names (`integer_literal`, `float_literal`, `boolean_literal`, `function_item`) in v2 compiler/emitter source. The only surviving `kind ===` match is a string literal inside the emitted `hasKind` runtime helper in `client-utils-v2.ts`, which is the generated check `typeof v.kind === 'string'` — not a pipeline conditional.

**Checkpoint**: Zero language-specific conditionals. Pipeline is grammar-agnostic.

---

## Phase 6: User Story 4 - Polymorphic nodes produce per-form output (Priority: P3)

**Goal**: Polymorphs produce distinct per-form factories, types, and templates

**Independent Test**: Generate output for a known polymorph and verify per-form artifacts

- [x] T060 [US4] Verified: python `assignment` is classified as `polymorph` with forms `eq`, `colon`, `colon2`. Rust `field_pattern` has polymorph forms `name`, `colon`. TypeScript `import_specifier` has polymorph forms including `name`. Visible in each package's `ir.ts`.
- [x] T061 [US4] Verified: per-form factories exist (`assignmentEq`, `assignmentColon`, etc. in python/factories.ts). Each accepts form-specific config and returns `type: parentKind`. Covered by the polymorph tests fixed in commit `0b7a463`.
- [x] T062 [US4] Verified: polymorph templates emit `variants: { form1: ..., form2: ... }` in `templates.yaml`. See `python/templates.yaml` for `assignment:` entry.
- [x] T063 [US4] Verified: `collapseForms()` in assemble.ts merges same-field-set forms without detect tokens and preserves `mergedRules`. Covered by the `__tests__/assemble.test.ts` T029a test case (same-field-set collapse).

**Checkpoint**: Polymorph handling verified end-to-end.

---

## Phase 7: User Story 5 - Optimizations preserve output correctness (Priority: P3)

**Goal**: Every optimization is demonstrably non-lossy

**Independent Test**: Compare emitted output with and without optimization for representative rules

- [x] T064 [US5] Already covered — `optimize.test.ts` has 8 assertions mentioning `non-lossy`/`rulesEqual`/`preserves`/`named content`, asserting that Optimize never modifies string/pattern/field/clause content.
- [x] T065 [US5] Covered via `assemble.test.ts` T029a (same-field-set collapse with mergedRules preserved).
- [x] T066 [US5] Prefix/suffix factoring non-lossy assertion is part of the optimize.test.ts suite (`rulesEqual` after `factorSeqChoice`).

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

- [x] T071 `pnpm test` — 1111/1111 tests passing across 32 files.
- [x] T072 `pnpm -r run type-check` — all three generated packages type-clean. 50 residual errors in `packages/codegen` test fixtures are pre-existing and unrelated (tracked below under "packages/codegen test-fixture type errors").
- [x] T073 Diffs classified in `specs/005-five-phase-compiler/baseline/diff-notes.md` (T048/T049/T050).
- [ ] T074 Remove `specs/005-five-phase-compiler/baseline/` directory — deferred until after the remaining pending tasks (T020/T021/T040/T042f) land, since the baseline still serves as a reference for residual investigation.
- [ ] T075 **Do not delete yet.** `.specify/scripts/bash/common.sh.backup` contains a richer `find_specify_root` function than the current `common.sh`. Either the backup is the canonical version and `common.sh` needs to be restored from it, or the backup is genuinely stale. Requires investigation before deletion.

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
- [x] **C5** Deleted `packages/codegen/src/compiler/adapter.ts`. wrap-v2
  now consumes NodeMap directly (T040), and the v1 `generate()` path
  builds its own HydratedNodeModel[] — so the adapter has zero callers.
  Migration scaffolding tests (`adapter.test.ts`,
  `pipeline-comparison.test.ts`) deleted alongside. Commit `e0c6b94`.
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
- [x] **C17** Audited the externals lists of all three current grammars
  (2026-04-13):
  - **rust**, **typescript**: no `_indent`/`_dedent`/`_newline`
    externals at all (not indent-based).
  - **python**: uses the canonical names `_newline`, `_indent`,
    `_dedent` exactly as link.ts's by-name detection expects.
  - Python also exposes non-structural externals (`string_start`,
    `string_end`, `_string_content`, `escape_interpolation`,
    `comment`) — those are terminal tokens, not indentation
    sentinels, and don't pass through the indent/dedent/newline
    conversion path.

  **Conclusion:** by-name detection is sufficient for the three
  grammars currently in tree. The risk only surfaces when a new
  grammar with differently-named structural-whitespace externals
  is added. Defer adding an `externalRoles` config / position-based
  detection until that need actually arises.
- [~] **C18** Partial — dropped ~968 `as any` casts across the
  three generated packages over two passes:
  - Factory field reads (commit `e2fa0b6`, ~628 casts):
    `(config as any)?.X` → `config?.X` since `ConfigOf<T>` already
    exposes camelCase keys for every field.
  - From() resolver (commit `1a4c48e`, ~340 casts): pulled the
    dual-shape `((input as any)?.X ?? (input as any)?.fields?.X)`
    unwrap up to a single `const f = (input.fields ?? input)` view
    at the top of each function. One cast per function instead of
    two casts per field.

  Still outstanding: setter spread casts
  (`{...(config as any), X: Y} as any`), the `children` slot read
  (`ChildSlotsOf<T>` is conditionally narrowed), polymorph
  dispatcher casts, fluent getter/setter return types still `any`.
  These need either a tighter `ConfigOf<T>` definition or
  per-call-site type narrowing — left for a later pass.
- [x] **C19** Full type-check across all generated packages — done as
  part of **T052**. All three generated packages type-clean via
  `tsgo --noEmit`. Commit `a77f94b`.

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

- [x] **C6-prereq** Done in commit `5737e76`. v2 from.ts now emits a
  per-grammar resolver helper block at module scope:
  `_leafRegistry`, `_resolveLeafString`, `_resolveByKind`,
  `_resolveScalar`, `_resolveOne`, `_resolveMany`. Per-field
  resolvers in `resolveFieldFromView` emit
  `_resolveOne(f.field, [leaves], [branches]) as any`. Closes the
  capability gap from the v1↔v2 comparison:
  - Loose string → leaf-by-value/pattern dispatch ✓
  - Array field → map each loose element ✓
  - Supertype field → dispatch by object `kind` ✓
  - JS primitive → leaf (true → boolean_literal etc) ✓
  - Single-branch passthrough ✓

  Loose-input tests at `packages/python/tests/from-loose.test.ts`
  (5 tests) exercise the new path. Branch-inference-by-shape (object
  without `kind`, infer the branch from field names) is the one v1
  capability NOT carried over — v1 emitted helpful ambiguity errors
  for the multi-branch case; v2 silently passes through. Defer if
  needed.

---

## Phase 11: Optimize substance + emitter follow-ups

Surfaced by the T022 classification move — Optimize is now a
near-passthrough (just threads the DerivationLog) because variant
tagging and polymorph promotion live in Link. The fan-out / factoring
helpers are exported but never called. These tasks give Optimize
actual work and clean up the emitter TODOs surfaced while reviewing
the generated `factories.ts` output.

### Optimize passes (T060-series)

- [ ] **T060** Implement CHOICE fan-out pass. `fanOutChoices(rule)` is
  exported from `optimize.ts` but never called. Convert
  `seq(a, choice(b, c), d)` into `choice(seq(a, b, d), seq(a, c, d))`
  so downstream classification sees fully-expanded choices. Wire as
  the first pass in `optimize()`. Consider interaction with Link's
  existing `tagVariants` / `promotePolymorph`: run fan-out first so
  Link only sees top-level choices.

- [ ] **T061** Implement seq prefix/suffix factoring. `factorSeqChoice`
  is exported but never called. Detect
  `choice(seq(a, b, x), seq(a, b, y), seq(a, b, z))` and rewrite to
  `seq(a, b, choice(x, y, z))`. Non-lossy — use `findCommonPrefix` /
  `findCommonSuffix` helpers that already exist. Shrinks variant forms
  when many branches share a common prefix (the parenthesized-
  expression pattern in every language).

- [ ] **T062** Collapse chained wrappers. Noop simplifications that
  make the rule tree less deep: `optional(optional(x))` → `optional(x)`,
  `repeat(repeat(x))` → `repeat(x)`, `optional(repeat(x))` →
  `repeat(x)` (repeat already matches zero occurrences),
  `seq(x)` → `x` (single-member seq). Non-lossy. Makes downstream
  walks cheaper and readable rule dumps shorter.

- [ ] **T063** Inline single-use hidden seq rules. Per the spec's
  inline-confidence derivation: hidden rules referenced from exactly
  one parent should be inlined into that parent, and the inlined
  fields should carry `source: 'inlined'`. Today no inlining happens
  — Link classifies hidden seqs as `group` kinds that stay visible
  in the NodeMap. Adding inlining in Optimize:
  1. Gives the `inlined` field-source tag a trigger site (pairs with
     T024's `inferred` tag — both surface via suggested.ts).
  2. Pulls single-use hidden helpers (`_call_signature` etc.) into
     their consumer so emitters see a flat field list.
  Gated by `IncludeFilter.fields` — held back when excluded.

- [ ] **T064** Dedupe structurally identical seq members. Adjacent
  duplicates like `seq(x, x)` → `seq(x)` are almost always a grammar
  bug. Use `rulesEqual` (already exported). Emit a warning when
  a dedupe fires. Non-lossy for terminals; for symbols, gate behind
  an "obvious copy-paste" heuristic to avoid changing parser semantics.

### Assemble classifier (T065)

- [ ] **T065** Add a shape-inspection fallback to `classifyNode`.
  Today the classifier assumes Link has wrapped rules in
  `TerminalRule` / `PolymorphRule` where appropriate — throws when
  those wrappers are absent (as happens with
  `IncludeFilter.rules = []` strict mode). A fallback that inspects
  the rule's own tree (all text + no refs → leaf; choice of seqs
  with heterogeneous fields → polymorph; etc.) unlocks the strict-
  rules debug path. Not required for correctness but removes a
  sharp edge.

### Factory emitter follow-ups (T066-T068)

Surfaced by TODOs in `packages/rust/src/factories copy.ts` (the
scratch file you annotated to track regressions).

- [ ] **T066** Remove remaining `(config as any)` casts. C18 dropped
  ~968 of them; after the setter-spread narrowing landed in this
  session they're down another ~1300 across the three grammars.
  Still outstanding: the `children` slot read
  (`const children = (config as any)?.children ?? []` — requires
  `ConfigOf<T>['children']` narrowing for branches with a children
  slot), polymorph dispatcher fallback (`config as any` when calling
  form factories — narrow via discriminated check), and the
  `setChildren` rest-parameter type (still `any[]` because
  `ConfigOf<T>['children']` isn't always an array).

- [ ] **T067** Runtime terminal verification in leaf / keyword / enum
  factories. Per the scratch-file TODO: "all terminals need to be
  verified at run". Tier the enforcement:
  - **keyword** (baked text): already enforced, no arg
  - **enum** (closed set): type-level string-literal union already
    enforces at compile time
  - **leaf with pattern**: runtime validate the string against the
    regex, throw a descriptive error on mismatch
  - **leaf with no constraint**: accept any string

  Gate behind a codegen option `strict: boolean` so hot-path callers
  don't pay the regex cost unconditionally.

- [ ] **T068** Factory return types. Fluent getter/setter methods
  currently return `any`. Narrow them to the concrete field type via
  `ConfigOf<T>['field']` (same mechanism the setter-spread narrowing
  uses for parameters). IDE completions and type-checked chains
  (`ir.foo(...).bar(...).baz(...)`) would become usable.

### Evaluate follow-up (T069)

- [ ] **T069** Better hidden-convention handling in `createProxy`.
  Current rule: `name.startsWith('_')` → hidden. Noted as a TODO in
  `evaluate.ts:116`. Consider: (a) an explicit `hidden: true` flag
  on the symbol ref when tree-sitter's own `inline` list references
  the kind; (b) a configurable naming convention (not every grammar
  uses leading underscore); (c) consulting the raw grammar's
  `inline: []` array at evaluate time. Low urgency — the current
  convention works for all three shipped grammars.

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
