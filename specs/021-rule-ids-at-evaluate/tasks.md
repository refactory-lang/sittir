# Tasks: Rule IDs and Rule Classification

**Input**: Design documents from `/Users/pmouli/GitHub.nosync/refactory-lang/sittir/specs/021-rule-ids-at-evaluate/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/evaluate-rule-identity.md](./contracts/evaluate-rule-identity.md), [quickstart.md](./quickstart.md)
**Tests**: Required by the feature spec and constitution. Story test tasks must be written first and must fail before implementation.
**Generated output boundary**: Do not hand-edit generated grammar package output under `packages/{rust,python,typescript}/src/` or `packages/{rust,python,typescript}/templates/`.

## Phase 1: Setup (Shared Test Scaffolding)

**Purpose**: Add local test fixtures/helpers needed by the story tests without changing compiler behavior yet.

- [X] T001 Add rule-catalog assertion helpers in `packages/codegen/src/__tests__/helpers/rule-catalog.ts`
- [X] T002 [P] Add a focused grammar fixture covering duplicate shapes, fields, aliases, and wrappers in `packages/codegen/src/__tests__/fixtures/rule-identity-grammar.js`
- [X] T003 [P] Add an override fixture covering replaced and introduced rule roots in `packages/codegen/src/__tests__/fixtures/rule-identity-override.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared compiler contracts and traversal infrastructure before story-specific behavior lands.

**Critical**: No user story implementation can begin until this phase is complete.

- [X] T004 Define `RuleId`, rule provenance, catalog, classification, and generated-metadata types in `packages/codegen/src/compiler/types.ts`
- [X] T005 Extend evaluated rule and `SymbolRef` contracts for inline identity joins in `packages/codegen/src/compiler/rule.ts`
- [X] T006 Create exhaustive rule traversal and deterministic path utilities in `packages/codegen/src/compiler/rule-catalog.ts`
- [X] T007 Update `RawGrammar` to expose `ruleCatalog` without introducing a `node-types.json` dependency in `packages/codegen/src/compiler/types.ts`
- [X] T008 Update existing manual `RawGrammar` test builders to satisfy the new contract in `packages/codegen/src/__tests__/link.test.ts`
- [X] T009 [P] Update existing manual `RawGrammar` test builders to satisfy the new contract in `packages/codegen/src/__tests__/refine-emit.test.ts`
- [X] T010 Update the allowed Evaluate sidecar set for `ruleCatalog` in `packages/codegen/src/__tests__/post-evaluate-invariant.test.ts`

**Checkpoint**: Compiler contracts compile, but story tests are still expected to fail until implementation tasks run.

---

## Phase 3: User Story 1 - Evaluate Gives Every Rule Occurrence a Stable Identity (Priority: P1) MVP

**Goal**: Every evaluated rule occurrence carries one deterministic inline `RuleId`, and the Evaluate output includes one authoritative catalog entry for each occurrence.

**Independent Test**: Run `pnpm vitest run packages/codegen/src/__tests__/evaluate.test.ts packages/codegen/src/__tests__/post-evaluate-invariant.test.ts` and verify the US1 identity/catalog tests pass without relying on downstream Binding/Simplify/Assemble behavior.

### Tests for User Story 1

- [X] T011 [P] [US1] Add failing tests for inline `RuleId` coverage and exactly-one catalog entries in `packages/codegen/src/__tests__/evaluate.test.ts`
- [X] T012 [P] [US1] Add failing tests for positional identity when identical subtrees appear in different branches in `packages/codegen/src/__tests__/evaluate.test.ts`
- [X] T013 [P] [US1] Add failing tests for deterministic re-evaluation of unchanged grammar output in `packages/codegen/src/__tests__/evaluate.test.ts`
- [X] T014 [P] [US1] Add failing tests for grammar-authored, override-authored/replaced, and evaluate-synthesized provenance roots in `packages/codegen/src/__tests__/evaluate.test.ts`
- [X] T015 [P] [US1] Add failing cross-grammar catalog completeness invariants for Rust, TypeScript, and Python in `packages/codegen/src/__tests__/post-evaluate-invariant.test.ts`

### Implementation for User Story 1

- [X] T016 [US1] Implement deterministic path-derived `RuleId` construction in `packages/codegen/src/compiler/rule-catalog.ts`
- [X] T017 [US1] Implement authoritative `RuleCatalog.byId`, `rootsByKind`, parent paths, and direct child IDs in `packages/codegen/src/compiler/rule-catalog.ts`
- [X] T018 [US1] Stamp inline IDs onto all evaluated rule occurrences before `grammarFn` returns in `packages/codegen/src/compiler/evaluate.ts`
- [X] T019 [US1] Mark evaluate-synthesized rules from inline alias and wire deposits with provenance inputs in `packages/codegen/src/compiler/evaluate.ts`
- [X] T020 [US1] Anchor outbound `SymbolRef` records to `fromRuleId` after catalog construction in `packages/codegen/src/compiler/evaluate.ts`
- [X] T021 [US1] Preserve downstream compatibility with ID-bearing rules in `packages/codegen/src/compiler/link.ts`
- [X] T022 [US1] Preserve tracing and generation compatibility with ID-bearing rules in `packages/codegen/src/compiler/generate.ts`

**Checkpoint**: User Story 1 is complete when every Evaluate rule occurrence has a stable inline ID and exactly one catalog entry.

---

## Phase 4: User Story 2 - Rules Carry Stable Terminal/Nonterminal Classification (Priority: P1)

**Goal**: The catalog classifies every rule occurrence as terminal or nonterminal while keeping parent-edge names and CST named/anonymous surface metadata separate.

**Independent Test**: Run `pnpm vitest run packages/codegen/src/__tests__/evaluate.test.ts packages/codegen/src/__tests__/post-evaluate-invariant.test.ts` and verify the US2 classification tests pass independently of tree-sitter generated metadata.

### Tests for User Story 2

- [X] T023 [P] [US2] Add failing classification matrix tests for `symbol`, `string`, `pattern`, `token`, named alias, anonymous alias, and `field` in `packages/codegen/src/__tests__/evaluate.test.ts`
- [X] T024 [P] [US2] Add failing tests proving field and named-alias forcing applies only to the immediately wrapped occurrence in `packages/codegen/src/__tests__/evaluate.test.ts`
- [X] T025 [P] [US2] Add failing tests for all-terminal, all-nonterminal, and mixed-descendant wrapper aggregation in `packages/codegen/src/__tests__/evaluate.test.ts`
- [X] T026 [P] [US2] Add failing cross-grammar invariant that every cataloged rule ID has exactly one classification in `packages/codegen/src/__tests__/post-evaluate-invariant.test.ts`

### Implementation for User Story 2

- [X] T027 [US2] Implement intrinsic terminal/nonterminal classification for leaves and references in `packages/codegen/src/compiler/rule-catalog.ts`
- [X] T028 [US2] Implement `field(name, rule)` parent-edge metadata and immediate nonterminal forcing in `packages/codegen/src/compiler/rule-catalog.ts`
- [X] T029 [US2] Implement named-alias immediate nonterminal forcing and anonymous-alias CST surface metadata in `packages/codegen/src/compiler/rule-catalog.ts`
- [X] T030 [US2] Implement deterministic aggregate classification for structural wrappers in `packages/codegen/src/compiler/rule-catalog.ts`
- [X] T031 [US2] Add exhaustive `assertNever` coverage for every child-bearing `Rule["type"]` switch in `packages/codegen/src/compiler/rule-catalog.ts`
- [X] T032 [US2] Populate `RuleCatalog.classificationById` during Evaluate catalog construction in `packages/codegen/src/compiler/evaluate.ts`

**Checkpoint**: User Story 2 is complete when every rule occurrence is classified and field/alias semantics do not leak into descendant classifications.

---

## Phase 5: User Story 3 - Tree-Sitter-Generated IDs Attach as Late Metadata (Priority: P2)

**Goal**: KindID and FieldID-style data can be derived from generated tree-sitter artifacts after generation without becoming foundational identity.

**Independent Test**: Run `pnpm vitest run packages/codegen/src/__tests__/generated-metadata.test.ts` and verify derived metadata can be traced back to kind or parent-edge concepts while `RuleId` remains the primary identity.

### Tests for User Story 3

- [X] T033 [P] [US3] Add failing generated-metadata derivation tests in `packages/codegen/src/__tests__/generated-metadata.test.ts`
- [X] T034 [P] [US3] Add failing assertions that generated metadata derivation does not read `node-types.json` for rule identity or classification in `packages/codegen/src/__tests__/generated-metadata.test.ts`

### Implementation for User Story 3

- [X] T035 [US3] Implement a late generated-metadata derivation helper in `packages/codegen/src/compiler/generated-metadata.ts`
- [X] T036 [US3] Trace derived KindID metadata back to top-level kind names without mutating `RuleId` values in `packages/codegen/src/compiler/generated-metadata.ts`
- [X] T037 [US3] Trace derived FieldID metadata back to parent-edge names without redefining rule identity in `packages/codegen/src/compiler/generated-metadata.ts`
- [X] T038 [US3] Load generated KindID and FieldID tables from compiled `parser.wasm` language metadata via `web-tree-sitter` in `packages/codegen/src/compiler/generated-metadata.ts`
- [X] T039 [US3] Emit parser-scoped `TreeSitterKindId` and `TreeSitterFieldId` const enums plus forward/reverse maps in `packages/codegen/src/emitters/consts.ts`
- [X] T040 [US3] Regenerate Rust, TypeScript, and Python grammar package constants from the codegen CLI so generated outputs expose the ID enums
- [X] T041 [US3] Document generated metadata as a derived layer in `specs/021-rule-ids-at-evaluate/contracts/evaluate-rule-identity.md`

**Checkpoint**: User Story 3 is complete when generated IDs can be attached after tree-sitter generation and remain secondary to rule identity/classification.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate the completed slice and keep generated-output boundaries clean.

- [X] T042 [P] Update implementation notes or changed validation commands in `specs/021-rule-ids-at-evaluate/quickstart.md`
- [X] T043 Run focused Evaluate tests with `pnpm vitest run packages/codegen/src/__tests__/evaluate.test.ts` and record the result in `specs/021-rule-ids-at-evaluate/quickstart.md`
- [X] T044 Run post-Evaluate invariant tests with `pnpm vitest run packages/codegen/src/__tests__/post-evaluate-invariant.test.ts` and record the result in `specs/021-rule-ids-at-evaluate/quickstart.md`
- [X] T045 Run generated metadata tests with `pnpm vitest run packages/codegen/src/__tests__/generated-metadata.test.ts` and record the result in `specs/021-rule-ids-at-evaluate/quickstart.md`
- [X] T046 Run workspace type checking with `pnpm -r run type-check` and record the result in `specs/021-rule-ids-at-evaluate/quickstart.md`
- [X] T047 Run the broader regression suite with `pnpm test` or document any known unrelated divergence in `specs/021-rule-ids-at-evaluate/quickstart.md`
- [X] T048 Audit generated-output edits under `packages/{rust,python,typescript}/src/` and `packages/{rust,python,typescript}/templates/` to confirm they were produced by the codegen CLI

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup**: No dependencies.
- **Phase 2 Foundational**: Depends on Phase 1 and blocks all user stories.
- **Phase 3 US1**: Depends on Phase 2.
- **Phase 4 US2**: Depends on Phase 2, but classification catalog population should integrate after the US1 catalog builder exists.
- **Phase 5 US3**: Depends on Phase 2 and can start after the rule identity model is stable enough to prove generated metadata remains secondary.
- **Phase 6 Polish**: Depends on all implemented stories included in the delivery slice.

### User Story Dependencies

- **US1 (P1)**: MVP. Provides the inline ID and catalog join key that every later story uses.
- **US2 (P1)**: Can write tests after Phase 2, but implementation depends on US1 catalog construction for `classificationById`.
- **US3 (P2)**: Depends on US1 identity stability and US2 classification boundaries to prove generated metadata is late and secondary.

### Within Each User Story

- Write story tests first and confirm they fail.
- Implement the smallest compiler changes needed for that story.
- Run the story's focused test command before moving to the next story.
- Do not reintroduce Binding/Simplify/Assemble re-architecture tasks; that scope belongs to spec 022.

---

## Parallel Opportunities

- T002 and T003 can run in parallel after T001 because they create independent fixture files.
- T009 can run in parallel with T008 because the manual test builders live in different test files.
- US1 test tasks T011-T015 can run in parallel after Phase 2.
- US2 test tasks T023-T026 can run in parallel after Phase 2.
- US3 test tasks T033-T034 can run in parallel after Phase 2.
- T042 can run in parallel with final validation commands if command outcomes are added after the commands finish.

---

## Parallel Example: User Story 1

```text
Task: "Add failing tests for inline RuleId coverage and exactly-one catalog entries in packages/codegen/src/__tests__/evaluate.test.ts"
Task: "Add failing tests for positional identity when identical subtrees appear in different branches in packages/codegen/src/__tests__/evaluate.test.ts"
Task: "Add failing cross-grammar catalog completeness invariants for Rust, TypeScript, and Python in packages/codegen/src/__tests__/post-evaluate-invariant.test.ts"
```

## Parallel Example: User Story 2

```text
Task: "Add failing classification matrix tests for symbol, string, pattern, token, named alias, anonymous alias, and field in packages/codegen/src/__tests__/evaluate.test.ts"
Task: "Add failing tests proving field and named-alias forcing applies only to the immediately wrapped occurrence in packages/codegen/src/__tests__/evaluate.test.ts"
Task: "Add failing cross-grammar invariant that every cataloged rule ID has exactly one classification in packages/codegen/src/__tests__/post-evaluate-invariant.test.ts"
```

## Parallel Example: User Story 3

```text
Task: "Add failing generated-metadata derivation tests in packages/codegen/src/__tests__/generated-metadata.test.ts"
Task: "Add failing assertions that generated metadata derivation does not read node-types.json for rule identity or classification in packages/codegen/src/__tests__/generated-metadata.test.ts"
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1 and Phase 2.
2. Write US1 tests T011-T015 and confirm they fail.
3. Implement T016-T022.
4. Run the US1 focused tests and stop at the checkpoint.

### Incremental Delivery

1. Deliver US1 for deterministic identity and authoritative catalog joins.
2. Deliver US2 for classification semantics on the same catalog.
3. Deliver US3 for late generated metadata derivation.
4. Run Phase 6 validation and document any unrelated pre-existing failures.

### Scope Guard

This task list intentionally does not migrate Binding, Simplify, Assemble, emitted package APIs, or generated grammar-package outputs. Those changes belong in `specs/022-binding-simplify-assemble/`.
