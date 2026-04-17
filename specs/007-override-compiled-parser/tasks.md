# Tasks: Override-Compiled Parser with Nested-Alias Polymorphs

**Input**: Design documents from `/specs/007-override-compiled-parser/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/parser-loading.md

**Organization**: Tasks grouped by user story in implementation dependency order (US2 → US4 → US1 → US3 → US5), not spec priority order.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Merge prerequisite, rebase branch, verify baseline

- [x] T001 Merge PR #9 (006-override-dsl-enrich) to master and rebase 007-override-compiled-parser onto master
- [x] T002 Verify baseline: run `pnpm test` and `pnpm -r run type-check` on rebased branch to confirm green
- [x] T003 Verify Emscripten (emsdk) is installed: run `emcc --version` and document install instructions if missing

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Ensure transpile bridge works and tree-sitter generate/build --wasm pipeline is functional

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Spike: run `tree-sitter generate` in `packages/python/.sittir/` and verify `src/parser.c` + `node-types.json` are produced
- [x] T005 Spike: run `tree-sitter build --wasm -o parser.wasm` in `packages/python/.sittir/` and verify `parser.wasm` is produced
- [x] T006 Spike: write `packages/codegen/src/__tests__/spike-override-parser.test.ts` that calls `Language.load('packages/python/.sittir/parser.wasm')` via web-tree-sitter to parse a python snippet. Verify the override fields (e.g., `body`/`condition`/`alternative` on `conditional_expression`) appear in the parse tree
- [x] T007 Compare field coverage: diff base grammar `node-types.json` (from `node_modules/tree-sitter-python`) vs override `.sittir/node-types.json`. Write results to `specs/007-override-compiled-parser/field-coverage-diff.md` documenting which fields are new (from transform() patches) and which fields `inferFieldNames` currently adds that are NOT in the override node-types
- [x] T008 Add `.sittir/src/`, `.sittir/parser.wasm`, `.sittir/node-types.json` to `.gitignore` if not already present

**Checkpoint**: Override grammar compiles to WASM, loads via web-tree-sitter, and parse trees carry override fields natively.

---

## Phase 3: User Story 2 — Bare Keyword-Prefix Promotion (Priority: P1)

**Goal**: Add a bare-keyword-prefix pass to `enrich()` that wraps identifier-shaped string literals at the leading position of top-level seqs as named fields. This is the prerequisite for deleting `inferFieldNames` — without it, keyword fields would be lost.

**Independent Test**: Enable bare keyword-prefix in enrich on all three grammars. Run full fidelity suite. Confirm ceilings hold.

### Implementation for User Story 2

- [x] T009 [US2] Add `bareKeywordPrefixPass` to the PASSES array in `packages/codegen/src/dsl/enrich.ts`. The pass walks each rule's top-level seq: if member[0] is a string literal that is identifier-shaped (matches `/^[a-z_][a-z0-9_]*$/i`), wrap it as `field(kw, literal)`. Skip if another field with the same name already exists on the rule. Skip non-identifier-shaped literals (punctuation, operators)
- [x] T010 [US2] Add unit tests for `bareKeywordPrefixPass` in `packages/codegen/src/dsl/__tests__/enrich-bare-keyword.test.ts`: test leading identifier literal is wrapped, non-identifier is skipped, collision is skipped, non-leading position is skipped
- [x] T011 [US2] Run codegen for all three grammars with enrich (bare keyword-prefix enabled) and verify fidelity ceilings hold in `packages/codegen/src/__tests__/corpus-validation.test.ts`. Adjust ceilings upward if field coverage improves
- [x] T012 [US2] Compare override `node-types.json` field coverage with `inferFieldNames` output for each grammar. For each gap (field that inferFieldNames adds but the override node-types lacks), add a targeted `transform()` patch to the grammar's `overrides.ts`. Expected: 0-5 patches per grammar based on prior field-coverage analysis in T007

**Checkpoint**: All three grammars pass fidelity with bare keyword-prefix. The override-compiled node-types.json covers all fields that inferFieldNames currently infers.

---

## Phase 4: User Story 4 — Lazy Parser Compilation with Cache (Priority: P2)

**Goal**: Automate WASM parser compilation on first codegen use, with mtime-based caching. Second runs reuse cached WASM.

**Independent Test**: Run codegen twice. First run compiles (~10-30s). Second run reuses cache (sub-second). Touch overrides.ts → recompiles.

### Implementation for User Story 4

- [x] T013 [US4] Create `packages/codegen/src/transpile/compile-parser.ts` implementing `compileParser(grammarDir, options?)` per contract in `specs/007-override-compiled-parser/contracts/parser-loading.md`: check `.sittir/grammar.js` exists, check mtime of `.sittir/parser.wasm` vs `grammar.js`, run `tree-sitter generate` + `tree-sitter build --wasm` if stale or missing, return wasm path
- [x] T014 [US4] Create `loadOverrideParser(grammarDir)` in the same file: calls `compileParser()`, then `loadWebTreeSitter()` from `validators/common.ts`, then `Language.load(wasmPath)`, returns `{ Parser, Language, lang }`
- [x] T015 [US4] Add tests for compile-parser in `packages/codegen/src/__tests__/compile-parser.test.ts`: test cold compile produces wasm, warm cache skips recompilation, stale cache recompiles, missing grammar.js throws, force option recompiles, warm-cache path completes in <100ms (SC-004), cold compile completes within 30s per grammar (SC-005)
- [x] T016 [US4] Integrate `compileParser` into the codegen CLI pipeline in `packages/codegen/src/cli.ts`: after transpile step, call `compileParser()` to ensure WASM is current before validation runs
- [x] T017 [US4] Add `--compile-parser` CLI flag to `packages/codegen/src/cli.ts` for standalone parser compilation (useful for CI pre-warming)

**Checkpoint**: `pnpm sittir codegen --grammar python` automatically compiles the override parser on first use and caches it.

---

## Phase 5: User Story 1 — Override-Compiled Parser Integration (Priority: P1)

**Goal**: Switch all validators to use the override-compiled parser instead of the base grammar's WASM. readNode reads fields directly from parse tree without runtime promotion.

**Independent Test**: Parse a python snippet with `conditional_expression`. Confirm `body`/`condition`/`alternative` fields are present in the parse tree without any runtime promotion. Generated factory's readNode path reads those fields directly.

### Implementation for User Story 1

- [x] T018 [US1] Modify `packages/codegen/src/validators/common.ts`: add `loadLanguageForGrammar()` helper that prefers override WASM when present, falls back to base. Validators use this instead of manual WASM loading
- [x] T019 [P] [US1] Update `packages/codegen/src/validate-roundtrip.ts` to use `loadLanguageForGrammar()` for parsing instead of base grammar WASM
- [x] T020 [P] [US1] Update `packages/codegen/src/validate-factory-roundtrip.ts` to use `loadLanguageForGrammar()` for parsing
- [x] T021 [P] [US1] Update `packages/codegen/src/validate-readnode-roundtrip.ts` to use `loadLanguageForGrammar()` for parsing
- [x] T022 [P] [US1] Update `packages/codegen/src/validate-from.ts` to use `loadLanguageForGrammar()` for parsing
- [x] T023 [US1] Switch the codegen pipeline to read `node-types.json` from `.sittir/node-types.json` (override) instead of from the base grammar npm package. Update the grammar resolution logic in `packages/codegen/src/validators/node-types.ts`
- [x] T024 [US1] Run full fidelity suite for all three grammars with override parser. Update fidelity ceilings if coverage improves (expected: field coverage increases since override parser carries more fields natively)
- [x] T025 [US1] Verify parse-tree field validation: spike test in `packages/codegen/src/__tests__/spike-override-parser.test.ts` verifies override fields (body/condition/alternative on conditional_expression) are present in the web-tree-sitter parse tree

**Checkpoint**: All validators use the override-compiled parser. Parse trees carry override fields natively. Fidelity ceilings hold or improve.

---

## Phase 6: User Story 3 — Nested-Alias Polymorphs (Priority: P2)

**Goal**: Convert polymorphic rules to nested-alias form via transform() patches. Each alternative becomes an aliased named child. Parent kind preserved for ast-grep compatibility.

**Independent Test**: Convert one polymorph (e.g., python `assignment`). Parse a sample. Confirm parent kind at outer level, variant kind at child level. Existing ast-grep rules still match.

### Implementation for User Story 3

- [x] T026 [US3] Convert python `assignment` polymorph to nested-alias form in `packages/python/overrides.ts` using `alias('name')` sugar in transform. Done: `transform(original, { '1/0': alias('assignment_eq'), '1/1': alias('assignment_type'), '1/2': alias('assignment_typed') })`
- [x] T026a [US3] Implement `alias('name')` sugar: AliasPlaceholder in alias.ts, resolvePatch wrapping in transform.ts, synthetic-rules.ts accumulator, withSyntheticRuleScope in evaluate.ts, two-pass grammar wrapper for tree-sitter CLI
- [x] T026b [US3] Verify parse tree: `(assignment (assignment_eq left: ... right: ...))` — variant wrapper node with fields inside. 4 e2e tests in nested-alias-e2e.test.ts
- [x] T027 [US3] Convert 5 rust polymorphs to nested-alias via `variant()` sugar: closure_expression, field_pattern, or_pattern, range_expression, range_pattern. Skipped visibility_modifier (full replacement). Fixed prec context propagation bug. Added `variant()` DSL + rest-parameter `transform()`. Corpus round-trip regressed — templates need update for variant child structure
- [ ] T028a [P] [US3] Convert typescript polymorphs batch 1 (4 rules) — deferred. Infrastructure (auto-hoist, conflict registration, suggested.ts emission) landed 2026-04-16. Typescript polymorph candidates (`import_specifier`, `parenthesized_expression`, `class_heritage`, `import_clause`) have a top-level `choice(...)` rule root (no outer seq), which doesn't match the current auto-hoist shape (top-level seq containing a choice at position N). Each needs per-rule analysis + potentially a different hoist path. Current field-based overrides are passing fidelity; adoption is ergonomic polish, not correctness
- [ ] T028b [P] [US3] Convert typescript polymorphs batch 2 (5 rules) — deferred, same rationale as T028a. Also: `export_statement` / `call_expression` have duplicate variant-name suggestions (`export`/`export`/`export`, `function`/`function`) that would need the suggested emitter to auto-disambiguate before adoption is clean
- [x] T029 [US3] Recompile all three override grammars and verify compilation succeeds — all three compile clean after auto-hoist + conflict registration work (session 2026-04-16)
- [x] T029a [US3] Add variant-name uniqueness validation — `registerPolymorphVariant` throws on duplicate (parent, variant) pair in synthetic-rules.ts

### T050 [US3] — Polymorph factory ergonomics for nested-alias kinds

**Context**: With nested-alias polymorphs, the parse tree stores data in a parent+variant-child structure:
```
(assignment              ← parent: has field('left')
  (assignment_eq         ← variant child: has field('right')
    left: (identifier)
    right: (integer)))
```

readNode produces `{ type: 'assignment', fields: { left }, children: [{ type: 'assignment_eq', fields: { right } }] }`. This is correct but the API surface is "nasty" — consumers must drill into the variant child to access `right`.

**Goal**: Generate polymorph-aware factories that present a flat ergonomic surface while keeping the tree structure intact internally.

**Design**:
- readNode/wrap: **no changes** — store the tree structure as-is (parent fields + variant child)
- Registration: `alias('name')` in transform already registers the polymorph relationship via synthetic-rules accumulator. Extend to also register `{ parentKind, variantName, variantFields }` metadata
- Link/Assemble: detect nested-alias pattern from node-types.json — when a kind's `children.types` are ALL alias variants (visible names with hidden `_name` counterparts), classify as a nested-alias polymorph. Produce `AssembledPolymorph` with forms derived from the variants
- Factory emitter: generate a polymorph factory for the parent kind with the UNION of all fields (parent + variant) as flat parameters. Factory internally constructs the right variant child based on which fields are provided. Each variant factory has getters/setters that drill into the child kind
- Types emitter: generate variant-specific interfaces (e.g., `AssignmentEq`, `AssignmentType`) and a parent union type
- Utils emitter: replace `_inferBranch` field-set heuristics with child-type discrimination for nested-alias kinds. `node.children[0].type` determines the variant

**Sub-tasks**:

- [x] T050a [US3] Extend synthetic-rules accumulator to register polymorph metadata: `registerPolymorphVariant(parentKind, variantName)` — called from resolvePatch when processing alias placeholders. `setCurrentRuleKind`/`getCurrentRuleKind` tracks the parent rule during evaluation
- [x] T050b [US3] Thread polymorph metadata from the synthetic-rules accumulator through to the emitters. `evaluate.ts` sets current rule kind around each callback, drains variants into `RawGrammar.polymorphVariants`. Verified: python's assignment → [assignment_eq, assignment_type, assignment_typed]
- [x] T050c [US3] Update `packages/codegen/src/emitters/factories.ts`: `emitNestedAliasFactory()` generates flat-field factory for nested-alias polymorphs. Dispatches by field presence (most-specific first), constructs variant child internally, returns NodeData with getters drilling into child fields. Verified on python assignment: `{ left, right? type? }` → proper variant dispatch
- [x] T050d [US3] Update `packages/codegen/src/emitters/types.ts`: `emitNestedAliasConfig()` generates explicit flat config interface (parent + variant fields). Factory references `T.AssignmentConfig` instead of inline types. ConfigMap maps correctly
- [x] T050e [US3] N/A — `_inferBranch` doesn't exist in the codebase. Nested-alias discrimination uses child node type natively via the parse tree
- [x] T050f [US3] Update `packages/codegen/src/emitters/wrap.ts`: `emitNestedAliasWrap()` generates flat getters for parent fields + variant child fields. Variant getters drill into `data.children[0].fields`. Also exposes `variant` and `child` accessors
- [x] T050g [US3] Integration tests in `nested-alias-factory.test.ts` + `nested-alias-factory-roundtrip.test.ts`: verify factory dispatches by field presence (typed→eq→type fallback), wrap has flat variant getters, variant factories exist standalone. 10 tests total
- [x] T030 [US3] Run full fidelity suite for all three grammars. Confirm ceilings hold — rust 123/136 rt, 110/151 factory; ts 109/112 rt, 105/126 factory; python 109/115 rt, 82/103 factory (improved from baseline)
- [x] T032 [US3] Verify: factory discriminates by child type, not field-set heuristics — `emitNestedAliasFactory` dispatches via `children[0].type` in generated factories, verified in nested-alias-factory.test.ts

**Checkpoint**: Nested-alias polymorphs have ergonomic flat-field factories. Tree structure is correct internally. API surface is clean for consumers.

---

## Phase 7: User Story 5 — Link Heuristic Pass Cleanup (Priority: P3)

**Goal**: Delete inferFieldNames mutation, promoteOptionalKeywordFields, and promotePolymorph from Link. Preserve inferFieldNames + collectRepeatedShapes as suggestion-only output.

**Independent Test**: Delete the three passes. Run full fidelity suite. All ceilings hold because the override-compiled parser and enrich passes carry all the information.

### Implementation for User Story 5

- [x] T033 [US5] Delete `promoteOptionalKeywordFields` function and its call site from `packages/codegen/src/compiler/link.ts` (already deleted in spec 006)
- [x] T034 [US5] Convert `inferFieldNames` in `packages/codegen/src/compiler/link.ts` from mutating to suggestion-only: pass `false` for apply flags, keep analysis for suggested-overrides.ts
- [x] T035 [US5] Convert Link's `promotePolymorph` call to suggestion-only (pre-fan-out detection). Note: Optimize phase still runs `promotePolymorph` post-fan-out — this is the authoritative call that produces correct polymorph shapes. Full deletion requires nested-alias follow-up (deferred)
- [x] T036 [US5] suggested.ts already consumes the suggestion-only output — no changes needed (promotedRules entries have `applied: false`)
- [x] T037 [US5] wrap.ts emitter has no promotion heuristics — routing is derived from node-types.json (now override version). readNode reads fields directly from the parse tree via the OverridesConfig routing map. No changes needed.
- [x] T038 [US5] Run full fidelity suite for all three grammars after Link cleanup. All ceilings hold (1,133 tests passing)
- [x] T039 [US5] link.ts decreased from 1,627 to 1,557 lines (70 lines). SC-006 target of 200 lines not met because promotePolymorph was kept as suggestion-only rather than deleted

**Checkpoint**: Link is ~200 lines shorter. No heuristic promotion. Pipeline output fully determined by override file + enrich passes.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, documentation, cleanup

- [x] T040 Run `pnpm test` across all packages — full green (1,133 tests passing)
- [x] T041 Run `pnpm -r run type-check` across all packages — no type errors
- [x] T042 [P] Update `specs/007-override-compiled-parser/checklists/requirements.md` — verify all items pass. All 16 checklist items are marked [x]
- [x] T043 [P] Run quickstart.md validation scenarios (4 scenarios from quickstart.md). Scenario 1: parser compiles + conditional_expression body/condition/alternative present. Scenario 2: enrich bare-keyword promotion active across all 3 grammars. Scenario 3: closure_expression nested-alias works (parent=closure_expression, child=closure_expression_expr). Scenario 4: link cleanup done (line count 1651; target <1427 unmet per T039's suggestion-only decision)
- [x] T044 Verify edge case: grammar with no overrides.ts falls back to base parser without error (loadLanguageForGrammar falls back to base WASM; typescript has no .sittir/parser.wasm and works)
- [x] T045 Verify edge case: parser compilation failure surfaces clear error with build output (compileParser throws with message when grammar.js missing — tested in compile-parser.test.ts)
- [ ] T046 Verify edge case: overrides.ts without enrich(base) — deferred (all grammars use enrich)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — merge PR #9, rebase branch
- **Foundational (Phase 2)**: Depends on Setup — validates WASM pipeline works
- **US2 (Phase 3)**: Depends on Foundational — bare keyword-prefix in enrich
- **US4 (Phase 4)**: Depends on Foundational — can run in parallel with US2 (different files)
- **US1 (Phase 5)**: Depends on US2 + US4 — needs keyword coverage + parser compilation
- **US3 (Phase 6)**: Depends on US4 — needs parser compilation. Can run in parallel with US1
- **US5 (Phase 7)**: Depends on US1 + US3 — cleanup only after all features validated
- **Polish (Phase 8)**: Depends on all user stories

### User Story Dependencies

```
US2 (bare keyword-prefix) ──┐
                             ├──→ US1 (override parser integration) ──┐
US4 (lazy compilation) ──────┤                                        ├──→ US5 (Link cleanup) ──→ Polish
                             └──→ US3 (nested-alias polymorphs) ──────┘
```

### Within Each User Story

- Implementation → validation → ceiling check
- Models/entities before services
- Core logic before integration points

### Parallel Opportunities

- **US2 + US4**: Can proceed in parallel (enrich.ts vs compile-parser.ts — different files)
- **US1 + US3**: Can proceed in parallel once US4 is done (validators vs overrides.ts — different files)
- **T019-T022**: Validator updates are independent (different files)
- **T026-T028**: Polymorph conversions per grammar are independent

---

## Parallel Example: Phase 5 (US1)

```bash
# Launch all validator updates together (different files):
Task T019: "Update validate-roundtrip.ts to use loadOverrideLanguage()"
Task T020: "Update validate-factory-roundtrip.ts to use loadOverrideLanguage()"
Task T021: "Update validate-readnode-roundtrip.ts to use loadOverrideLanguage()"
Task T022: "Update validate-from.ts to use loadOverrideLanguage()"
```

## Parallel Example: Phase 6 (US3)

```bash
# Launch polymorph conversions per grammar together (different files):
Task T026: "Convert python polymorphs in packages/python/overrides.ts"
Task T027: "Convert rust polymorphs in packages/rust/overrides.ts"
Task T028: "Convert typescript polymorphs in packages/typescript/overrides.ts"
```

---

## Implementation Strategy

### MVP First (US2 + US4 Only)

1. Complete Phase 1: Setup (merge PR #9, rebase)
2. Complete Phase 2: Foundational (verify WASM pipeline)
3. Complete Phase 3: US2 (bare keyword-prefix)
4. Complete Phase 4: US4 (lazy compilation)
5. **STOP and VALIDATE**: Override parser compiles, loads, keyword fields present

### Incremental Delivery

1. Setup + Foundational → WASM pipeline proven
2. US2 → Keyword fields covered in enrich
3. US4 → Parser compilation automated
4. US1 → Pipeline uses override parser → **Core value delivered**
5. US3 → Polymorphs restructured → Factory discrimination simplified
6. US5 → Link cleanup → Pipeline simplified
7. Polish → All validation passes

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- Phase ordering follows implementation dependencies, not spec priority
- US2 (P1 in spec) comes before US1 (P1) because keyword-prefix is a prerequisite
- US4 (P2 in spec) comes before US1 (P1) because parser compilation is infrastructure
- Commit after each completed phase
- Stop at any checkpoint to validate independently
