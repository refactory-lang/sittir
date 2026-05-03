# Tasks: Binding/Simplify/Assemble + De-hoisted NodeData

**Input**: Design documents from `/specs/022-binding-simplify-assemble/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1=Binding, US2=Simplify, US3=Assemble, US4=De-hoist, US5=$with)

---

## Phase 1: Setup

- [ ] T001 Define `BoundMember` and `BindingResult` types in `packages/codegen/src/compiler/types.ts`
- [ ] T002 Define `AssembledMember` shape classification (`A`/`B`/`C`) on `AssembledNode` in `packages/codegen/src/compiler/node-map.ts`
- [ ] T003 [P] Define `NodeMemberValue` type alias in `packages/types/src/core-types.ts` (keep `NodeFieldValue`/`NodeChildValue` as deprecated aliases)
- [ ] T004 [P] Define `MemberValue` enum in `rust/crates/sittir-core/src/types.rs`

## Phase 2: Foundational

- [ ] T005 Add `shape: 'A' | 'B' | 'C'` property to `AssembledNode` base class in `packages/codegen/src/compiler/node-map.ts`
- [ ] T006 Add `terminality: 'terminal' | 'nonterminal'` to `AssembledField` and `AssembledChild` in `packages/codegen/src/compiler/node-map.ts`
- [ ] T007 [P] Add `isTerminalConstituent(node)` predicate to `packages/codegen/src/compiler/node-map.ts`

## Phase 3: US1 — Binding (P1)

**Goal**: Attach terminals to nonterminal constituents.
**Test**: `function_item`, `let_declaration`, `if_expression` produce correct terminal-nonterminal associations.

- [ ] T008 [US1] Create `packages/codegen/src/compiler/bind.ts` with `bindRule(kind, rule, rules)` producing `BindingResult`
- [ ] T009 [US1] Implement terminal attachment in `packages/codegen/src/compiler/bind.ts`
- [ ] T010 [US1] Implement field-edge naming from `field(name, content)` wrappers in `packages/codegen/src/compiler/bind.ts`
- [ ] T011 [US1] Implement alias-forced nonterminal classification in `packages/codegen/src/compiler/bind.ts`
- [ ] T012 [US1] Wire `bindRule` into generate pipeline in `packages/codegen/src/compiler/generate.ts`
- [ ] T013 [US1] Verify: native RT (shallow + deep + factory) passes, type-check 0 errors

## Phase 4: US2 — Simplify (P1)

**Goal**: Push wrapper behavior (seq/choice/optional/repeat/prec) down onto constituents.
**Test**: Representative shapes produce constituents with optional/repeated/order metadata, no surviving wrappers.

- [ ] T014 [US2] Extend `packages/codegen/src/compiler/simplify.ts` to consume `BindingResult` and produce constituents with metadata
- [ ] T015 [US2] Handle `seq(...)`: assign ordering to constituents in `packages/codegen/src/compiler/simplify.ts`
- [ ] T016 [US2] Handle `optional` / `repeat` / `repeat1`: set flags on constituents in `packages/codegen/src/compiler/simplify.ts`
- [ ] T017 [US2] Handle `choice(...)`: resolve by frontier result in `packages/codegen/src/compiler/simplify.ts`
- [ ] T018 [US2] Handle `prec*`: strip as parse metadata in `packages/codegen/src/compiler/simplify.ts`
- [ ] T019 [US2] Preserve `RuleId` provenance through Simplify in `packages/codegen/src/compiler/simplify.ts`
- [ ] T020 [US2] Verify: native RT (shallow + deep + factory) passes

## Phase 5: US3 — Assemble from Constituents (P2)

**Goal**: Materialize kinds from normalized constituents with shape classification (A/B/C).
**Test**: `function_item` -> Shape A, `block` -> Shape B, `expression_statement` -> Shape C.

- [ ] T021 [US3] Update `packages/codegen/src/compiler/assemble.ts` to consume Simplify output
- [ ] T022 [US3] Implement shape classification (A/B/C) at assemble time in `packages/codegen/src/compiler/assemble.ts`
- [ ] T023 [US3] Store shape and constituent list on `AssembledNode` in `packages/codegen/src/compiler/node-map.ts`
- [ ] T024 [US3] Emit compatibility `$fields`/`$children` views derived from constituent model in `packages/codegen/src/compiler/assemble.ts`
- [ ] T025 [US3] Verify: native RT (shallow + deep + factory) passes, factory RT ceilings unchanged, type-check 0 errors. Assert RuleId provenance survives from Binding through Assemble for representative kinds.
- [ ] T025a [US3] Verify edge cases: mixed choice frontier, field-wrapped literals, named alias over terminal content, anonymous alias — all produce correct constituent classifications

## Phase 6: US4 — De-hoist NodeData (P2)

**Goal**: Remove `$fields`. Named members top-level. Terminal values as plain strings.
**Test**: `$fields` grep returns 0. Factory `fn.name` is direct access. readNode assigns top-level.

- [ ] T026 [US4] Update `AnyNodeData` union in `packages/types/src/core-types.ts` to `NodeBase | NodeWithChildren | NodeWithChild`
- [ ] T027 [US4] [P] Update types emitter: emit Shape A/B/C interfaces with top-level fields in `packages/codegen/src/emitters/types.ts`
- [ ] T028 [US4] Update factory emitter: assign named members top-level in `packages/codegen/src/emitters/factories.ts`
- [ ] T029 [US4] [P] Update readNode: assign field values top-level in `packages/core/src/readNode.ts`
- [ ] T030 [US4] [P] Update Rust `NodeData`: `#[serde(flatten)]` members in `rust/crates/sittir-core/src/types.rs`
- [ ] T031 [US4] [P] Update Rust `read_node.rs`: top-level member assignment
- [ ] T032 [US4] Update render: read from top-level keys in `packages/core/src/render.ts`
- [ ] T033 [US4] Terminal hoisting in factory emitter: store terminal values as strings in `packages/codegen/src/emitters/factories.ts`
- [ ] T034 [US4] Terminal hoisting in readNode: store terminal children as `$text` strings in `packages/core/src/readNode.ts`
- [ ] T035 [US4] Regenerate all grammars, verify: native RT (shallow + deep + factory) passes, type-check 0, `$fields` grep = 0
- [ ] T036 [US4] Verify factory RT ceilings drop toward zero

## Phase 7: US5 — `$with` Namespace + `$`-Prefixed Methods (P2)

**Goal**: Replace fluent methods with `$with`. `$`-prefix all sittir methods. Shared `withMethods`.
**Test**: `fn.$with.name(id)` works. `fn.$render()` works. Per-field emissions removed. Net ~-1500 lines.

- [ ] T037 [US5] Create `withMethods` helper emission in `packages/codegen/src/emitters/factories.ts`
- [ ] T038 [US5] Remove `_branchMethods` and `_leafMethods` (replaced by `withMethods`) in `packages/codegen/src/emitters/factories.ts`
- [ ] T039 [US5] Emit `$with` namespace per-kind in `packages/codegen/src/emitters/factories.ts`
- [ ] T040 [US5] Remove per-field fluent method emission and `_setField`/`_setFields` in `packages/codegen/src/emitters/factories.ts`
- [ ] T041 [US5] Update wrap emitter: `$with` namespace + drillIn getters in `packages/codegen/src/emitters/wrap.ts`
- [ ] T042 [US5] Attach `withMethods` to wrapped nodes in `packages/codegen/src/emitters/wrap.ts`
- [ ] T043 [US5] Regenerate and verify: type-check 0, native RT (shallow + deep + factory) passes
- [ ] T044 [US5] Verify: `wc -l packages/*/src/factories.ts` shows net ~-1500 lines

## Phase 8: Cleanup

- [ ] T045 Remove deprecated `NodeFieldValue`/`NodeChildValue` aliases from `packages/types/src/core-types.ts`
- [ ] T046 Remove `$fields` deprecated alias from `AnyNodeData` in `packages/types/src/core-types.ts`
- [ ] T047 [P] Remove `factorySuffix` from `packages/codegen/src/emitters/factories.ts`
- [ ] T048 [P] Remove `_setField`/`_setFields` emission from `packages/codegen/src/emitters/factories.ts`
- [ ] T049 Remove `nativeTransportTerminalFieldsByKind` workaround from `packages/codegen/src/emitters/client-utils.ts`
- [ ] T050 Verify SC-008: `rg '\$fields' packages/ --type ts` returns 0 (excluding tests/node_modules)
- [ ] T051 Verify SC-007: factory RT ceilings = 0 across all grammars
- [ ] T052 Final: `pnpm test`, `pnpm -r run type-check`, `cargo test`, `cargo build` all pass

---

## Dependencies

```
Phase 1 (Setup) -> Phase 2 (Foundational)
Phase 2 -> Phase 3 (US1: Binding) -> Phase 4 (US2: Simplify)
Phase 4 -> Phase 5 (US3: Assemble)
Phase 5 -> Phase 6 (US4: De-hoist)
Phase 6 -> Phase 7 (US5: $with)
Phase 7 -> Phase 8 (Cleanup)
```

## Parallel Opportunities

| Tasks | Why parallel |
|-------|-------------|
| T003 + T004 | TS types vs Rust types |
| T027 + T029 + T030 + T031 | Types emitter, readNode JS, types.rs, read_node.rs |
| T047 + T048 | Independent removals in same file |

## Implementation Strategy

**MVP (Phases 1-4)**: Binding + Simplify. Compiler-internal. No consumer changes. Validates constituent model for all grammars.

**Core delivery (Phases 5-6)**: Assemble + De-hoist. Consumer-visible. Terminal hoisting eliminates factory RT failures.

**API surface (Phase 7)**: `$with` + `$`-prefix. Removes ~1500 lines. Clean consumer API.

**Each phase**: merge-ready, passes native RT + type-check.
