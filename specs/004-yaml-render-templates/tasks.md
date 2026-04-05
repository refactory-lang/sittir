# Tasks: YAML Render Templates

**Input**: Design documents from `specs/004-yaml-render-templates/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, design.md

**Tests**: Existing generated tests serve as the regression gate (constitution IV). New tests added only for wrap heuristic validation (T056) — override field promotion is new behavior not covered by existing factory→render tests.

**Organization**: Tasks grouped by user story. US2 (render engine) is foundational since all other stories depend on a working render engine.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Add dependencies and prepare the workspace

- [x] T001 Add `yaml` package as dependency to `packages/core/package.json`
- [x] T002 [P] Add `yaml` package as dependency to `packages/codegen/package.json`
- [x] T003 Run `pnpm install` to update lockfile

---

## Phase 2: Foundational — Types & Render Engine (US2, P1)

**Purpose**: Define new types and rewrite the render engine. This MUST complete before codegen (US1) can produce usable output.

**Goal**: Core can load a `RulesConfig` (from YAML or object), resolve `$VARIABLE` templates with clauses and per-rule `joinBy`, and produce correctly formatted source code.

**Independent Test**: Unit test `render()` with hand-crafted `RulesConfig` objects — verify `$NAME` resolution, `$$$NAME` joining, clause omission, literal formatting.

### Type definitions

- [x] T004 [P] Add `TemplateRule` type (string | object with template/clauses/joinBy) to `packages/types/src/core-types.ts`
- [x] T005 [P] Add `RulesConfig` type (language, extensions, expandoChar, metadata, rules) to `packages/types/src/core-types.ts`
- [x] T006 Remove `TemplateElement`, `ParsedTemplate`, `RenderTemplate`, `RenderRule` types from `packages/types/src/core-types.ts`
- [x] T007 Remove `RulesRegistry` and `JoinByMap` types from `packages/types/src/core-types.ts`
- [x] T008 Update type re-exports in `packages/types/src/index.ts` (add TemplateRule/RulesConfig, remove old types)

### Render engine rewrite

- [x] T009 Rewrite `packages/core/src/render.ts` — replace S-expression dispatch with `$` variable scanner: resolve all 5 variable types (`$NAME` single, `$$NAME` unnamed, `$$$NAME` multi with joinBy, `$_NAME` non-capturing wildcard, `$CLAUSE` clause sub-templates), support `expandoChar` substitution (when `RulesConfig.expandoChar` is non-null, use that character instead of `$` as the variable prefix), handle YAML `|` block scalar trailing newline trimming, literal concatenation (no `parts.join(' ')`)
- [x] T010 Add YAML loading to `packages/core/src/render.ts` — `createRenderer(yamlPath: string)` loads and parses YAML, closes over `RulesConfig`, returns bound `render`/`toEdit`
- [x] T011 Update `packages/core/src/types.ts` — re-export `TemplateRule`, `RulesConfig` from `@sittir/types`; remove re-exports of `RenderTemplate`, `RenderRule`, `TemplateElement`, `ParsedTemplate`, `RulesRegistry`, `JoinByMap`
- [x] T012 Update `packages/core/src/index.ts` — ensure new types and updated `createRenderer` are exported

### Post-clarification render engine update

- [x] T055 [US2] Update render engine in `packages/core/src/render.ts` for post-clarification requirements: (a) implement absent-field adjacent space absorption per FR-017, (b) verify no runtime kind-matching exists per FR-026 — only field lookup and clause resolution

**Checkpoint**: Core render engine works with hand-crafted RulesConfig. `createRenderer` accepts a YAML path. Old S-expr types removed.

---

## Phase 3: User Story 1 — Codegen Produces YAML Templates (P1)

**Goal**: The codegen walks `EnrichedRule` from `NodeModel` and emits `templates.yaml` per grammar with ast-grep `$VARIABLE` syntax, synthesized clauses, per-rule `joinBy`, and literal formatting.

**Independent Test**: Run `npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src` and verify `packages/rust/templates.yaml` is produced with valid structure.

### Codegen emitter

- [x] T013 [US1] Rewrite `packages/codegen/src/emitters/rules.ts` — walk `EnrichedRule` tree emitting YAML template strings instead of S-expressions: literal tokens with spacing, `$NAME`/`$$$NAME` for fields, clause synthesis for `CHOICE([SEQ(STRING, FIELD), BLANK])` patterns, per-rule `joinBy` from separator metadata, formatting signals from `IMMEDIATE_TOKEN`/delimiter pairs/block structure
- [x] T014 [US1] Add YAML serialization to `packages/codegen/src/emitters/rules.ts` — emit the full `RulesConfig` object (`language`, `extensions`, `expandoChar`, `metadata` with `grammarSha` only, `rules`) as `templates.yaml` using the `yaml` package
- [x] T015 [US1] Remove `packages/codegen/src/emitters/joinby.ts` — joinBy is now per-rule inside YAML rules
- [x] T016 [US1] Update `packages/codegen/src/emitters/index.ts` (or barrel) — remove joinby emitter export, update rules emitter export

### Factories emitter update

- [x] T017 [US1] Update factories emitter in `packages/codegen/src/emitters/factories.ts` — generated `factories.ts` calls `createRenderer(yamlPath)` with path to `templates.yaml` instead of importing `rules`/`joinBy` from separate files
- [x] T018 [US1] Update assign emitter in `packages/codegen/src/emitters/assign.ts` — use the bound renderer from `createRenderer(yamlPath)` instead of importing `rules`/`joinBy`

### CLI update

- [x] T019 [US1] Update `packages/codegen/src/cli.ts` — emit `templates.yaml` to the package root (resolve one level up from `--output` path, e.g., `--output packages/rust/src` → `packages/rust/templates.yaml`), remove `rules.ts` and `joinby.ts` from output file list

**Checkpoint**: Codegen CLI produces `templates.yaml` for a grammar. Generated `factories.ts` and `assign.ts` use `createRenderer(yamlPath)`.

---

## Phase 4: User Story 5 — Existing Tests Pass (P1)

**Goal**: Regenerate all grammar packages and verify 100% test regression pass.

**Independent Test**: `pnpm test` passes across all packages.

- [x] T020 [US5] Regenerate Rust package: `npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src`
- [x] T021 [P] [US5] Regenerate TypeScript package: `npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src`
- [x] T022 [P] [US5] Regenerate Python package: `npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src`
- [x] T023 [US5] Run `pnpm -r run type-check` — verify all packages type-check cleanly
- [x] T024 [US5] Run `pnpm test` — verify all existing tests pass

**Checkpoint**: All 3 grammars regenerated. Type-check and test suite green. Regression gate passed.

---

## Phase 5: User Story 3 — Remove Old Files (P2)

**Goal**: Delete S-expression parser, old generated files, and deprecated types.

**Independent Test**: Verify `sexpr.ts`, `rules.ts`, `joinby.ts` do not exist; deprecated type names are absent from codebase.

- [x] T025 [US3] Delete `packages/core/src/sexpr.ts`
- [x] T026 [P] [US3] Delete `packages/rust/src/rules.ts` and `packages/rust/src/joinby.ts`
- [x] T027 [P] [US3] Delete `packages/typescript/src/rules.ts` and `packages/typescript/src/joinby.ts`
- [x] T028 [P] [US3] Delete `packages/python/src/rules.ts` and `packages/python/src/joinby.ts`
- [x] T029 [US3] Update `packages/rust/package.json`, `packages/typescript/package.json`, and `packages/python/package.json` `generate` scripts — remove `rules.ts` and `joinby.ts` from the `rm -rf` list, add `templates.yaml` to output
- [x] T030 [US3] Run `pnpm test` — confirm tests still pass after file removal

**Checkpoint**: No S-expression parser, no old rules/joinby files, no deprecated types in codebase.

---

## Phase 6: User Story 4 — Multi-Language Validation (P2)

**Goal**: Verify all 3 grammars produce correct language-specific templates (brace vs. indent formatting, correct clauses, correct joinBy).

**Independent Test**: Inspect `templates.yaml` for each grammar and verify representative rules match expected output from design.md.

- [x] T031 [US4] Validate Rust `templates.yaml` — spot-check `function_item` (clauses, joinBy object), `parameters` (joinBy string), `block` (multiline with `\n`), `binary_expression` (simple string form)
- [x] T032 [P] [US4] Validate TypeScript `templates.yaml` — spot-check equivalent nodes for brace-delimited formatting, correct clauses
- [x] T033 [P] [US4] Validate Python `templates.yaml` — spot-check `function_definition` for colon+indent formatting, `return_type_clause` with leading space

**Checkpoint**: All 3 grammars produce correct, language-appropriate YAML templates.

---

## Phase 7: User Story 6 — Override Fields (`overrides.json`) (P2)

**Goal**: Create `overrides.json` files per grammar that provide supplemental field names for under-fielded nodes. Codegen merges overrides during enrichment and validates against grammar structure.

**Independent Test**: Run codegen for Rust with `overrides.json` and verify templates for `index_expression`, `unary_expression`, `range_expression` use `$FIELD_NAME` variables instead of positional `$$$CHILDREN`.

### Overrides infrastructure

- [x] T038 [US6] Add `overrides.json` schema and loading to codegen — merge override fields with node-types.json fields during enrichment in the NodeModel pipeline
- [x] T039 [US6] Add validation: overrides MUST NOT shadow existing tree-sitter FIELDs; entries MUST match grammar rule structure
- [x] T040 [US6] Add automatic detection logging: same-kind positional (`SEQ(X, X)`) logs "needs synthetic names"; discriminator tokens log "discriminator token at position N"

### Per-grammar overrides

- [x] T041 [P] [US6] Create `packages/rust/overrides.json` — ~10-15 entries including `index_expression` (value/index), `unary_expression` (operator/argument), `range_expression` (start/operator/end), `macro_definition` (delimiter)
- [x] T042 [P] [US6] Create `packages/typescript/overrides.json` — minimal or empty (TypeScript wraps operators in FIELDs)
- [x] T043 [P] [US6] Create `packages/python/overrides.json` — minimal or empty (Python wraps operators in FIELDs)

**Checkpoint**: Codegen loads and validates overrides.json for all 3 grammars. Override fields appear in enriched NodeModel.

---

## Phase 8: User Story 7 — wrap.ts Field Promotion Heuristics (P2)

**Goal**: Codegen generates per-kind wrap functions implementing 5 heuristics for field promotion. After wrapping, all named positions are in `fields`; `children` contains only truly unnamed remainder.

**Independent Test**: Create a `NodeData` for `index_expression` via assign, verify after wrapping that `fields.value` and `fields.index` are populated.

### Children classification

- [ ] T044 [US7] Implement children classification in codegen — simplify grammar rules (strip tokens from SEQs, unwrap single-member SEQs, leave CHOICEs intact) to determine template pattern per node kind

### Wrap emitter updates

- [ ] T045 [US7] Update wrap emitter to generate heuristic 2 (unique kind promotion) — move unnamed child with unique kind from `children` to `fields`
- [ ] T046 [US7] Update wrap emitter to generate heuristic 3 (anonymous token promotion) — promote anonymous token to `fields` using override name, match by text
- [ ] T047 [US7] Update wrap emitter to generate heuristic 4 (token-positional promotion) — split same-kind children at token boundary using override names
- [ ] T048 [US7] Update wrap emitter to generate heuristic 5 (CHOICE branch promotion) — use token position to determine field assignment in top-level CHOICE variants

### Integration

- [ ] T056 [US7] Add assign round-trip tests for wrap heuristic validation — create tests for `index_expression` (heuristic 4), `unary_expression` (heuristic 3), and `range_expression` (heuristic 5) verifying that after assign+wrap, `fields` contains promoted children
- [ ] T049 [US7] Regenerate all 3 grammar packages with override fields and updated wrap functions
- [ ] T050 [US7] Run `pnpm test` — verify all existing tests pass with updated wrap functions
- [ ] T051 [US7] Validate templates for override-field nodes use `$FIELD_NAME` variables (spot-check `index_expression`, `unary_expression`, `range_expression` in Rust)

**Checkpoint**: wrap.ts correctly promotes override fields. Templates reference named fields. All tests pass.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup and validation

- [x] T034 Verify open issues resolved: #1 (clause omission), #5 (per-rule joinBy), #7 (literal formatting), #8 (no sexpr parser), #9 (no sexpr parser)
- [x] T035 [P] Verify render engine line count is ~50 lines (SC-005)
- [x] T036 [P] Verify `templates.yaml` determinism — regenerate Rust twice, diff output, confirm byte-identical
- [x] T037 Verify `expandoChar` works end-to-end — create a manual test with a mock grammar where `expandoChar` is non-null (e.g., `%`), confirm variable scanner uses `%NAME` instead of `$NAME`
- [ ] T052 Verify SC-009: `overrides.json` for Rust provides field names for ~10-15 under-fielded nodes
- [ ] T053 [P] Verify SC-010: `wrap.ts` promotes override fields correctly for all 5 heuristic categories
- [ ] T054 [P] Verify SC-011: templates for override-field nodes use `$FIELD_NAME` variables instead of `$$$CHILDREN`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **US1 Codegen (Phase 3)**: Depends on Foundational (needs new types + render engine)
- **US5 Regression (Phase 4)**: Depends on US1 (needs regenerated packages)
- **US3 Cleanup (Phase 5)**: Depends on US5 passing (safe to delete after regression passes)
- **US4 Multi-lang (Phase 6)**: Depends on US5 (needs all 3 grammars regenerated)
- **US6 Overrides (Phase 7)**: Depends on US1 (needs codegen infrastructure to merge overrides)
- **US7 Wrap Heuristics (Phase 8)**: Depends on US6 (needs overrides.json to drive promotion)
- **Polish (Phase 9)**: Depends on all prior phases

### User Story Dependencies

- **US2 (Render Engine)**: Foundational — must complete first
- **US1 (Codegen)**: Depends on US2 (render engine must exist to validate templates)
- **US5 (Regression)**: Depends on US1 (needs regenerated packages)
- **US3 (Cleanup)**: Depends on US5 (safe to remove old files after tests pass)
- **US4 (Multi-lang)**: Depends on US5 (all grammars must be regenerated)
- **US6 (Overrides)**: Depends on US1 (codegen infrastructure needed to merge overrides into enrichment)
- **US7 (Wrap Heuristics)**: Depends on US6 (override field names drive wrap promotion logic)

### Within Each Phase

- Tasks marked [P] can run in parallel
- Sequential tasks must complete in listed order

### Parallel Opportunities

- T001 and T002 (add yaml deps) can run in parallel
- T004 and T005 (new types) can run in parallel
- T020, T021, T022 (regenerate grammars) — T020 first, T021/T022 in parallel after
- T026, T027, T028 (delete old files) can run in parallel
- T031, T032, T033 (validate templates) can run in parallel
- T041, T042, T043 (create per-grammar overrides.json) can run in parallel

---

## Parallel Example: Phase 2 (Foundational)

```bash
# Types can be added in parallel:
Task: T004 "Add TemplateRule type to packages/types/src/core-types.ts"
Task: T005 "Add RulesConfig type to packages/types/src/core-types.ts"

# Then sequentially: remove old types, update exports, rewrite render engine
```

## Parallel Example: Phase 5 (Cleanup)

```bash
# All grammar package deletions in parallel:
Task: T026 "Delete packages/rust/src/rules.ts and joinby.ts"
Task: T027 "Delete packages/typescript/src/rules.ts and joinby.ts"
Task: T028 "Delete packages/python/src/rules.ts and joinby.ts"
```

---

## Implementation Strategy

### MVP First (US2 + US1 + US5 for Rust only)

1. Complete Phase 1: Setup (add yaml deps)
2. Complete Phase 2: Types + render engine rewrite
3. Complete Phase 3: Codegen YAML emitter
4. Regenerate Rust only (T020) → run Rust tests
5. **STOP and VALIDATE**: Rust factory→render round-trips produce correct output

### Full Delivery

1. MVP above → Rust working
2. Regenerate TypeScript + Python (T021, T022)
3. Full test suite (T023, T024)
4. Cleanup old files (Phase 5)
5. Multi-language validation (Phase 6)
6. Override fields — create overrides.json per grammar (Phase 7)
7. Wrap heuristics — field promotion for override nodes (Phase 8)
8. Polish & cross-cutting verification (Phase 9)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US2 is placed in Foundational phase because the render engine must exist before any other story can be validated
- Existing generated tests are the primary regression gate (constitution IV); new tests added only for wrap heuristic validation (T056)
- Commit after each phase checkpoint
- Stop at any checkpoint to validate independently
