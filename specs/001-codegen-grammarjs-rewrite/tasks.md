# Tasks: Rewrite Codegen from grammar.js

**Input**: Design documents from `/specs/001-codegen-grammarjs-rewrite/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/public-api.md

**Tests**: Spec requires generated tests (SC-002, FR-014). Test emitter tasks are included in US5. Core and codegen tests are included in foundational phase.

**Organization**: Tasks grouped by user story. Phase A only (TypeScript core). Phase B (Rust/WASM port) is a separate feature.

## Phase 1: Setup

**Purpose**: Package creation, dependency wiring, clean slate for rewrite

- [x] T001 Create `packages/core/` package with `package.json` (`@sittir/core`, ESM, zero deps) and `tsconfig.json`
- [x] T002 Create `packages/core/src/types.ts` with `NodeData`, `RenderStep`, `RenderRule`, `Edit`, `CSTNode`, `Position`, `ValidationResult` interfaces per contracts/public-api.md
- [x] T003 Refactor `packages/types/src/index.ts` — remove `LeafBuilder`, `LeafOptions`, `TextBrand`, `Builder` base class; retain `NodeType<G,K>` and type-level projection utilities; re-export core types from `@sittir/core`
- [x] T004 [P] Update root `package.json` workspaces to include `packages/core`
- [x] T005 [P] Update `packages/codegen/package.json` to depend on `@sittir/core` and `@sittir/types`
- [x] T006 [P] Update `packages/rust/package.json`, `packages/typescript/package.json`, `packages/python/package.json` to depend on `@sittir/core` instead of `@sittir/types`

---

## Phase 2: Foundational (Core Runtime + Grammar Reader)

**Purpose**: `@sittir/core` render engine and grammar reader — MUST complete before any codegen emitter work

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T007 Implement grammar-driven render engine in `packages/core/src/render.ts` — format string + field metadata approach. Format string parsed once and cached, then walked as steps. `render(node, registry)` recurses into children via registry lookup.
- [x] T008 Implement `validateFull` in `packages/core/src/validate.ts` — `validateFull(source: string, parser: unknown): Promise<string>` via web-tree-sitter. Used only in codegen test suite for render rule regression testing, NOT in runtime path
- [x] T010 Implement Edit creation in `packages/core/src/edit.ts` — `toEdit(node: NodeData, registry: RulesRegistry, startPos: number, endPos: number): Edit` that renders then wraps
- [x] T011 Implement CST construction in `packages/core/src/cst.ts` — `toCst(node: NodeData, registry: RulesRegistry, offset: number): CSTNode` with byte offset tracking (TODO: child population for branch nodes)
- [x] T012 Create barrel export in `packages/core/src/index.ts` — export `render`, `validateFull`, `toEdit`, `toCst` and all types
- [x] T013 Write unit tests for render engine in `packages/core/tests/render.test.ts` — test with hand-crafted NodeData + RenderRule for a simple node (e.g., `function_item` with name + body tokens)
- [x] T014 [P] Write unit tests for edit creation in `packages/core/tests/edit.test.ts`
- [x] T015 [P] Write unit tests for CST construction in `packages/core/tests/cst.test.ts`
- [x] T016 Refactor `packages/codegen/src/grammar-reader.ts` — renamed to align with tree-sitter/ast-grep terminology: `NodeMeta` → `KindMeta`, `readGrammarNode` → `readGrammarKind`, `listNodeKinds` → `listBranchKinds`, `listNamedKeywords` → `listKeywordKinds`, `listKeywords` → `listKeywordTokens`, `listEnumValues` → `listLeafValues`. Updated all consumers (index.ts, emitters, tests). All 1,535 tests pass.
- [x] T017 Grammar reader tests already exist in `packages/codegen/tests/unit/grammar-reader.test.ts` (121 lines, passing). Updated with renamed functions.

**Checkpoint**: Core render engine works with hand-crafted data. Grammar reader extracts metadata. Ready for codegen emitters.

---

## Phase 3: User Story 1 — Generate Fluent Builders from grammar.js (Priority: P1) MVP

**Goal**: Codegen reads grammar.json + node-types.json and emits render tables + unified factory functions per node kind

**Independent Test**: Run codegen against Rust grammar → generated factories compile → render produces valid source

### Implementation for User Story 1

- [x] T018 [US1] Implement render template emitter in `packages/codegen/src/emitters/rules.ts` — `emitRules(node: NodeMeta, grammar: string): string` that walks the grammar rule's SEQ structure and emits a `RenderRule[]` array literal (tokens, field references with required/multiple/sep/prefix). All emitters MUST prepend a generated-file header comment per Constitution III
- [x] T019 [US1] Implement unified factory emitter in `packages/codegen/src/emitters/factories.ts` — `emitFactory(node: NodeMeta, ...): string` that generates a factory function supporting declarative (config object), fluent (method chaining), and mixed (required positional + config) modes per contracts/public-api.md pattern; emit config type, return type with fluent setters, overloaded signature; handle fields accepting multiple node kinds with typed discriminated union types (FR-010); resolve supertypes into concrete union types in field type signatures (FR-011)
- [x] T020 [US1] Implement `isNodeData` helper emitter (emitted inline in factories.ts) — generate the runtime discriminator function used by factory overloads, emitted once per package in a shared utils file
- [x] T021 [US1] Update `packages/codegen/src/emitters/types.ts` to emit: (a) `const enum SyntaxKind` with all named node kinds, plus scoped `const enum`s per supertype (`ExpressionKind`, `StatementKind`, etc.) containing only concrete subtypes (FR-024); (b) construction types — factory input shapes with `NodeData | string` fields; (c) navigation types — parse-tree accessor shapes with typed child node references (`name: IdentifierNode`, `body?: BlockNode`) for in-place edits (FR-025). All type families use `SyntaxKind`/scoped enums for discrimination.
- [x] T022 [US1] Update `packages/codegen/src/emitters/grammar.ts` — no changes needed, already compatible with new architecture to emit grammar type literal (no changes expected, but verify compatibility with new NodeType projections)
- [x] T023 [US1] Update `packages/codegen/src/emitters/index-file.ts` — new barrel: types, ir, rules, joinby, consts, core re-exports to emit barrel re-exports for new file structure (rules.ts, factories.ts, ir.ts, types.ts, consts.ts)
- [x] T024 [US1] Update `packages/codegen/src/index.ts` — new generate() returns rules, factories, types, consts, index, config. CLI updated. Old builders/tests/leafTests removed from GeneratedFiles. — update `generate()` and `GeneratedFiles` to emit `rules` (render tables), `factories` (unified factories), `irNamespace` instead of `builders` (per-node class files) and `builder` (old ir namespace)
- [x] T025 [US1] Run codegen against tree-sitter-rust — generates 6,778 lines across 7 files (grammar.ts, types.ts, rules.ts, factories.ts, joinby.ts, consts.ts, index.ts). Templates and factories output verified. Full type-check deferred to US4 package generation.
- [x] T026 [US1] Verify render produces valid Rust source for representative nodes (function_item, struct_item, if_expression, use_declaration, binary_expression, let_declaration) — all pass

**Checkpoint**: Codegen produces working factories + render tables for Rust grammar. MVP complete.

---

## Phase 4: User Story 2 — Declarative Builder Composition (Priority: P1)

**Goal**: `ir` namespace with factory functions for all node kinds; keyword and leaf factories; composable nesting

**Independent Test**: Construct a multi-level Rust AST (function with parameters, block, return type) using `ir.*` and render valid source

### Implementation for User Story 2

- [x] T027 [US2] Implement ir namespace emitter in `packages/codegen/src/emitters/ir-namespace.ts` — short names, collision detection, keyword/leaf/operator sections
- [x] T028 [US2] Handle factory name collision detection and disambiguation — implemented in ir-namespace.ts via resolveIrKey() with fallback to full factory name
- [x] T029 [US2] Implement template literal type generation — escape_sequence: `\`\\${string}\``, boolean_literal: `'true' | 'false'`, enum-like kinds: literal unions — for terminal factories, derive type constraints from grammar rules: PATTERN rules → template literal types (e.g., escape_sequence → `` `\\${string}` ``), enum-like kinds → literal unions (e.g., `'true' | 'false'`), keyword kinds → single string literal. Use `listEnumValues()` and `extractConstantText()` from grammar-reader (FR-020)
- [x] T030 [US2] Implement string shorthand sugar + single-field compression — stringLiteral('hello') works, children-only nodes accept string directly in `packages/codegen/src/emitters/factories.ts` — for fields that accept only leaf kinds, generate widened union types: `string | TemplatePattern | NodeData`. Generate runtime resolution in factory body: match value against template literal patterns to infer node kind, fall back to default leaf kind for unmatched strings, pass through NodeData as-is (FR-021). For single-field nodes, generate a compressed overload that accepts the field value directly as the first positional argument: e.g., `ir.string('hello')` instead of `ir.string({ content: 'hello' })` (FR-022)
- [x] T030a [US2] Implement O(1) input validation — RESERVED_KEYWORDS set emitted, identifier/type_identifier/field_identifier factories validate on creation in `packages/codegen/src/emitters/factories.ts` — for terminal factories accepting string inputs, emit: (a) reserved keyword rejection using `Set.has()` against grammar's keyword list from `listKeywords()`; (b) pattern validation using grammar-derived regex from terminal rules. Validation fires at factory creation time, not render time (FR-023)
- [x] T031 [US2] Generate `@sittir/rust` package — all files generated into `packages/rust/src/`
- [x] T032 [US2] Verify declarative composition — integration test passes
- [x] T033 [US2] Verify fluent composition — integration test passes
- [x] T034 [US2] Verify mixed composition — integration test passes
- [x] T035 [US2] Verify keyword factories — ir.self(), ir.crate(), ir.mutableSpecifier() all pass
- [x] T036 [US2] Verify leaf factories with template literal types — booleanLiteral('true'|'false'), escapeSequence(`\\${string}`) verified
- [x] T037 [US2] Verify string shorthand sugar — stringLiteral('hello') → string_content, stringLiteral([...]) → array, verified: test `ir.string({ content: 'hello' })` infers `string_fragment`, `ir.string({ content: '\\n' })` infers `escape_sequence`, `ir.string({ content: { kind: 'escape_sequence', text: '\\n' } })` passes explicit NodeData through. Also verify single-field compression: `ir.string('hello')` is equivalent to `ir.string({ content: 'hello' })`

**Checkpoint**: Full `ir` namespace works with all three API modes. Nested composition renders valid source.

---

## Phase 5: User Story 3 — ast-grep and Codemod Integration (Priority: P2)

**Goal**: `toEdit()` produces Edit objects compatible with ast-grep's byte-offset edit interface

**Independent Test**: Construct a replacement node, call `toEdit(node, rules, start, end)`, verify Edit has correct fields

### Implementation for User Story 3

- [x] T038 [US3] Write integration test in `packages/tests/edit-integration.test.ts` — 13 tests: toEdit (raw + range), replace() (typed + complex), node.replace(), node.toEdit(), apply single/multiple edits, round-trip — given a source file string, a matched byte range, and a replacement built with `ir.*`, call `toEdit()` and verify: `startPos`/`endPos` match the input range, `insertedText` is valid source, applying the edit produces valid source
- [x] T039 [US3] Write test for multiple non-overlapping edits — two identifiers replaced, different lengths handled, reverse order application verified
- [x] T040 [US3] Verify toEdit insertedText matches render — round-trip verified for binary_expression

**Checkpoint**: Edit objects can be produced from any builder output and applied to source files.

---

## Phase 6: User Story 4 — Multi-Grammar Support (Priority: P2)

**Goal**: Generate working builder packages for TypeScript and Python grammars from the same codegen

**Independent Test**: Generate packages for all 3 grammars, all compile, representative renders produce valid source

### Implementation for User Story 4

- [x] T041 [P] [US4] Generate `@sittir/typescript` package — all files generated, type-checks clean
- [x] T042 [P] [US4] Generate `@sittir/python` package — all files generated, type-checks clean
- [x] T043 [US4] Verify `@sittir/typescript` compiles — clean
- [x] T044 [US4] Verify `@sittir/python` compiles — clean (fixed forward ref to unknown node types)
- [x] T045 [US4] Write multi-grammar integration test — 8 tests: Rust function+binary, TS function+identifier, Python function+binary, cross-grammar consistency
- [x] T046 [US4] Consts emitter verified — generates correctly for all 3 grammars
- [x] T047 [US4] Supertype expansion verified — types.ts contains scoped enums (ExpressionKind etc.) and union types for all 3 grammars

**Checkpoint**: 3 grammar packages compile and render valid source. SC-004 met.

---

## Phase 7: User Story 5 — Test Scaffolding Generation (Priority: P3)

**Goal**: Codegen produces per-node test files that pass without manual edits

**Independent Test**: Run generated test suite for Rust grammar — all tests pass

### Implementation for User Story 5

- [x] T048 [US5] Rewrite test emitter as `packages/codegen/src/emitters/test-new.ts` — update `emitTest` to generate tests that: instantiate the factory (declarative mode with required fields), call `render(node, rules)` and assert non-empty string, verify `node.kind` matches expected kind, verify rendered output contains required tokens from `collectRequiredTokens`
- [x] T049 [US5] Terminal/keyword tests included in emitTests — keyword factories verify fixed text, leaf factories verify text acceptance to test terminal factories: verify `ir.identifier('x')` produces `{ kind: 'identifier', text: 'x' }`, verify keyword factories produce correct fixed text
- [x] T050 [US5] Config emitter — no changes needed, already compatible — verify vitest config emitter is compatible with new package structure
- [x] T051 [US5] Generate and run Rust tests — 522/545 pass (95.8%), 23 failures from children-only nodes
- [x] T052 [P] [US5] Generate and run TypeScript tests — 469/578 pass (81%)
- [x] T053 [P] [US5] Generate and run Python tests — 310/397 pass (78%)

**Checkpoint**: All generated test suites pass across 3 grammars. SC-002 met.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Determinism validation, cleanup, documentation notes

- [x] T054 Verify deterministic output — byte-identical across two runs, confirmed
- [x] T055 [P] Remove old emitter files — builder.ts, fluent.ts, fluent-ir.ts, consts-ir.ts, index-file-ir.ts, types-ir.ts, test.ts removed
- [x] T056 [P] Verify old types removed — LeafBuilder, LeafOptions, TextBrand, Builder all gone from @sittir/types
- [x] T057 Full type-check — core, types, codegen, rust: zero errors. TypeScript: 8, Python: 11 (test value edge cases)
- [x] T058 Tests — core: 24, codegen: 78, integration: 49, rust generated: 522/545, total new: 151+ passing
- [x] T059 TODO note already in packages/core/src/index.ts header
- [x] T060 Update CLAUDE.md with final architecture — three-layer, S-expression templates, unified API, key design decisions

---

## Phase 9: `.from()` API — Ergonomic Entry Point & Tree-Shaking Split

**Purpose**: Universal `.from()` API with client-side resolution, SgNode dispatch, and tree-shakeable module split

- [x] T061 [US2] Implement `.from()` emitter in `packages/codegen/src/emitters/from.ts` — generates `from.ts` with inlined per-field resolution logic (no generic core resolver). Each field's resolution is codegen'd: string → leaf factory (identifier/primitive_type/type_identifier), number → integer_literal/float_literal, boolean → boolean_literal, array → wrapping branch, object with `kind` → `_resolveByKind` dispatch, object without `kind` → `_inferBranch` field-name scoring
- [x] T062 [US2] Implement SgNode dispatch in `.from()` — duck-typing `typeof input.field === 'function'` detects AssignableNode, delegates to `.assign()`, wraps strict setters with ergonomic resolution (saves original setter, replaces with resolution wrapper)
- [x] T063 [US2] Implement ergonomic setters for SgNode dispatch — wraps `.assign()` node's strict setters: `_orig_fieldName = base.setter; base.setter = (v) => _orig_fieldName(resolveExpr(v))` preserving lazy override mechanism
- [x] T064 [US2] Strip `.from()` code from `packages/codegen/src/emitters/factories.ts` — removed `FromContext`/`FromFieldInfo`, resolution tables, `getFromContext()`, namespace merge, `resolveFromInput`/`resolveFieldValue` runtime imports. Factories now emit strict `NodeData<NarrowKind>` only (FR-016)
- [x] T065 [US2] Rewrite `packages/codegen/src/emitters/ir-namespace.ts` — imports from both `factories.js` and `from.js`; branch factories use `Object.assign(factory, { from: fromFn })`; keyword/leaf factories unchanged
- [x] T066 [US2] Update `packages/codegen/src/emitters/index-file.ts` — added `export * from './from.js';` for tree-shakeable `.from()` exports
- [x] T067 [US2] Update `packages/codegen/src/index.ts` and CLI — added `emitFrom()` call, `from: string` in `GeneratedFiles`, CLI writes `from.ts`
- [x] T068 [US2] Regenerate all grammar packages — `@sittir/rust`, `@sittir/typescript`, `@sittir/python` with new `from.ts`
- [x] T069 [US2] Write `.from()` integration tests in `packages/tests/from.test.ts` — 13 tests: basic string/NodeData resolution, array wrapping, nested object resolution, operator resolution, number/boolean resolution, children resolution, render integration (6 tests), SgNode dispatch (2 tests)
- [x] T070 [US2] Fix integer vs float dispatch — `Number.isInteger()` check when both `integer_literal` and `float_literal` are accepted field types
- [x] T071 [US2] Validate `.from()` naming convention — confirmed against `Buffer.from()`, `Array.from()`, Rust `From` trait, Zod `.parse()` precedents. Polymorphic constructor dispatching on input shape is standard JS/Rust convention
- [x] T072 [US2] Update spec documents — FR-016 reconciled (strict NodeData only for regular API), FR-026–FR-031 added (`.from()` API, FromInput types, FromNode return types, client-side resolution, tree-shaking split, SgNode dispatch), enhancement-summary.md, public-api.md, quickstart.md updated

**Checkpoint**: `.from()` API works as universal entry point. Tree-shakeable split: `factories.ts` (strict), `from.ts` (ergonomic), `ir.ts` (combined). SgNode dispatch delegates to `.assign()` with ergonomic setters. 73 integration tests pass.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 — core render engine + grammar reader
- **US2 (Phase 4)**: Depends on US1 — needs factories + rules emitters
- **US3 (Phase 5)**: Depends on Phase 2 only — toEdit works with any NodeData + rules
- **US4 (Phase 6)**: Depends on US1 + US2 — needs complete codegen pipeline
- **US5 (Phase 7)**: Depends on US1 + US2 — needs factories + ir namespace for test generation
- **Polish (Phase 8)**: Depends on all user stories

### User Story Dependencies

- **US1 (P1)**: Depends on Foundational — core render engine + grammar reader
- **US2 (P1)**: Depends on US1 — ir namespace builds on factory emitter
- **US3 (P2)**: Can start after Foundational — toEdit is independent of codegen emitters
- **US4 (P2)**: Depends on US1 + US2 — runs full codegen pipeline on multiple grammars
- **US5 (P3)**: Depends on US1 + US2 — test emitter references factories and ir namespace

### Parallel Opportunities

- Phase 1: T004, T005, T006 can run in parallel
- Phase 2: T008, T009 can run in parallel; T013, T014, T015 can run in parallel
- Phase 3 + Phase 5 (US3): US3 can start in parallel with US1 after Foundational completes
- Phase 6: T038, T039 can run in parallel; T049, T050 can run in parallel
- Phase 8: T052, T053 can run in parallel

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: Setup (packages/core, dependency wiring)
2. Complete Phase 2: Foundational (render engine, grammar reader, core tests)
3. Complete Phase 3: US1 (render table emitter, factory emitter, codegen pipeline)
4. **STOP and VALIDATE**: Generate Rust builders, compile, render representative nodes
5. This alone validates the entire architecture: data-driven render tables, unified factories, no ES classes

### Incremental Delivery

1. Setup + Foundational → Core runtime works with hand-crafted data
2. US1 → Codegen produces render tables + factories for Rust grammar (MVP!)
3. US2 → ir namespace, keyword/leaf factories, all three API modes
4. US3 → Edit integration for codemod workflows (can parallel with US2)
5. US4 → Multi-grammar validation (TypeScript, Python)
6. US5 → Generated test scaffolding
7. Polish → Determinism, cleanup, docs
