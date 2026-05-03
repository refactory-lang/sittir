# Tasks: De-hoisted NodeData Surface (Spec 022)

**Input**: Design documents from `/specs/022-binding-simplify-assemble/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/
**Source of truth**: `docs/adr/0018-dehoist-nodedata-surface.md`

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story (US0=Taxonomy, US1=Storage, US2=Accessors, US3=Frozen+$with, US4=$-methods, US5=Unified, US6=napi-direct, US7=Pipeline)

**Test discipline**: Tests are NOT optional in this codebase per Constitution
Principle IV. Native RT (3 modes), type-check, and `cargo build` are mandatory
gates after every phase. Each phase ends in a verification task that runs them.

---

## Phase 0: Setup

**Purpose**: Capture baseline, prepare diagnostic tooling. Numbered Phase 0 so
the implementation phases below align 1-to-1 with the spec/plan phase numbering.

- [ ] T001 Capture pre-Phase-1 baseline: run `pnpm test` and save `pnpm test 2>&1 | tee specs/022-binding-simplify-assemble/baselines/pre-phase-1.txt`
- [ ] T002 Capture pre-Phase-1 generated output snapshot: `git ls-files packages/{rust,typescript,python}/src | xargs git hash-object > specs/022-binding-simplify-assemble/baselines/pre-phase-1-hashes.txt`
- [ ] T003 [P] Verify probe-kind tooling works: `npx tsx packages/codegen/src/scripts/probe-kind.ts rust function_item` produces output

---

## Foundational (Blocking Prerequisites)

**Purpose**: None required — the existing 5-phase compiler pipeline is the
foundation. Spec 021 RuleId/classification work is already merged. ADR-0017
($nodeHandle + $childIndex, ParsedTree split) is already merged.

This section intentionally has no tasks. Skip to Phase 1.

---

## Phase 1: User Story 0 — Assembled Model Taxonomy Collapse (Priority: P1) 🎯 MVP

**Goal**: Collapse `AssembledField`+`AssembledChild`+`AssembledMulti` into
`AssembledNonterminal`; absorb `AssembledGroup` into `AssembledPolymorph`;
introduce `AssembledLeaf` base with `Pattern`/`Keyword`/`Token`/`Enum` subtypes.
Generated output MUST be byte-identical.

**Independent Test**: After phase commits, regenerate all three grammar packages.
`git diff packages/{rust,typescript,python}/src` is empty. All RT modes pass at
identical counts. Grep finds zero references to `AssembledField`,
`AssembledChild`, `AssembledMulti`, `AssembledGroup` in `packages/codegen/src/`.

### Type definitions

- [ ] T004 [US0] Define `AssembledLeaf` abstract base class in `packages/codegen/src/compiler/node-map.ts`
- [ ] T005 [US0] Define `AssembledPattern extends AssembledLeaf` (with `pattern?: string`) in `packages/codegen/src/compiler/node-map.ts`
- [ ] T006 [US0] Convert existing `AssembledKeyword`, `AssembledToken`, `AssembledEnum` to extend `AssembledLeaf` in `packages/codegen/src/compiler/node-map.ts`
- [ ] T007 [US0] Define `AssembledNonterminal` interface (`edgeName?: string`, `values: readonly NodeOrTerminal[]`) in `packages/codegen/src/compiler/node-map.ts`
- [ ] T008 [US0] Update `AssembledBranch` to use `slots: readonly AssembledNonterminal[]` in `packages/codegen/src/compiler/node-map.ts`
- [ ] T009 [US0] Add helper functions `isRequired(slot)` and `isMultiple(slot)` in `packages/codegen/src/compiler/node-map.ts`
- [ ] T010 [US0] Add `forms: readonly PolymorphForm[]` to `AssembledPolymorph` (absorbs `AssembledGroup`) in `packages/codegen/src/compiler/node-map.ts`

### Assembler updates

- [ ] T011 [US0] Update `assembleField` to produce `AssembledNonterminal` (with `edgeName` set) in `packages/codegen/src/compiler/assemble.ts`
- [ ] T012 [US0] Update `assembleChild` to produce `AssembledNonterminal` (without `edgeName`) in `packages/codegen/src/compiler/assemble.ts`
- [ ] T013 [US0] Remove `AssembledMulti` materialization — fold into slot `values[].multiplicity` in `packages/codegen/src/compiler/assemble.ts`
- [ ] T014 [US0] Update existing `AssembledLeaf` (current open-text type) materialization to produce `AssembledPattern` in `packages/codegen/src/compiler/assemble.ts`
- [ ] T015 [US0] Update `AssembledGroup` materialization — emit forms onto `AssembledPolymorph.forms` in `packages/codegen/src/compiler/assemble.ts`

### Reader updates (every consumer of the assembled model)

- [ ] T016 [P] [US0] Update `packages/codegen/src/emitters/factories.ts` to read `AssembledNonterminal`/`AssembledPattern`/etc.
- [ ] T017 [P] [US0] Update `packages/codegen/src/emitters/wrap.ts` to read new types
- [ ] T018 [P] [US0] Update `packages/codegen/src/emitters/types.ts` to read new types
- [ ] T019 [P] [US0] Update `packages/codegen/src/emitters/from.ts` to read new types
- [ ] T020 [P] [US0] Update `packages/codegen/src/emitters/client-utils.ts` to read new types
- [ ] T021 [P] [US0] Update `packages/codegen/src/emitters/render-module.ts` to read new types
- [ ] T022 [P] [US0] Update `packages/codegen/src/compiler/template-walker.ts` (template walker that produces Jinja-renderable structures) and `packages/codegen/src/emitters/templates.ts` (template file emitter) to read new assembled types
- [ ] T023 [P] [US0] Update validators (`packages/codegen/src/validate/*.ts`) to read new types
- [ ] T024 [US0] Audit every `switch` over assembled-model union — ensure each ends in `assertNever(x)` per Constitution XI; grep `packages/codegen/src/` for switches lacking it. Also assert no `AssembledBranch.slots` has more than one element with `slot.edgeName === undefined` (R-T05 unnamed-slot constraint) — fail codegen if violated

### Verification

- [ ] T025 [US0] Regenerate grammar packages: `npx tsx packages/codegen/src/cli.ts --grammar rust --all --skip-ts-chain --no-build-native --output packages/rust/src` (and typescript, python)
- [ ] T026 [US0] Verify byte-identity: `git diff packages/{rust,typescript,python}/src` produces zero changed lines
- [ ] T027 [US0] Verify zero stale references: `rg 'AssembledField|AssembledChild|AssembledMulti|AssembledGroup' packages/codegen/src/` returns empty
- [ ] T028 [US0] Run native RT (3 modes) + type-check + `cargo build`. All gates pass at identical counts to baseline.
- [ ] T029 [US0] Commit Phase 1: "022(taxonomy): collapse Field/Child/Multi into Nonterminal; AssembledLeaf base"

**Checkpoint**: Phase 1 complete. New taxonomy in place. Generated output unchanged.

---

## Phase 2: User Story 1+2+3 — Surface Reshape (Priority: P1)

**Goal**: De-hoist `$fields` to `_`-storage (US1), add non-enumerable function
accessors with cursor/value duality (US2), freeze nodes at construction with
`$with` updaters (US3). These three stories land together — they're three
faces of one emitter rewrite and can't be tested in isolation without a broken
intermediate state.

**Independent Test**: Given any factory or wrap node:
- `node.$fields` is `undefined`
- `node._<field>` returns the stored value
- `typeof node.<field> === 'function'` and is non-enumerable
- `node.<field>()` returns the stored value
- `Object.isFrozen(node) === true`
- `node.$with.<field>(v)` returns a new frozen node with the update

### ⚠ Execution Order (TDD per Constitution Principle IV)

Tasks are listed in logical (types → impl → tests → verify) order for
documentation clarity, but **execute in this sequence** so RED-before-GREEN
is enforced:

1. **Foundation types** (T030-T034) — needed before tests can compile
2. **Tests RED** (T050, T051, T052, T052a, T043a-test-portion) — write tests, run them, observe failure
3. **Implementation GREEN** (T035-T049, T043) — implement until tests pass
4. **Verification** (T053-T056, T056b) — regenerate + RT gate + commit

### Foundation types

- [ ] T030 [P] [US1] Define `NodeMemberValue = AnyNodeData | string | number` in `packages/types/src/node-member-value.ts`
- [ ] T031 [P] [US1] Update `AnyNodeData = NodeBase | NodeWithChild | NodeWithChildren` in `packages/types/src/core-types.ts` — drop `$fields` from `NodeBase`
- [ ] T032 [P] [US3] Add `withMethods(node, ...)` shared helper to `packages/core/src/nodeData.ts` (new file)
- [ ] T033 [P] [US3] Add `freezeNodeData(node)` helper to `packages/core/src/nodeData.ts` — freezes top-level + nested arrays in `_`-storage
- [ ] T034 [P] [US3] Add `buildWithNamespace(config, factory, slotKeys)` helper to `packages/core/src/nodeData.ts` — produces non-enumerable `$with` namespace

### Factory emitter (US1 + US2 + US3 surface)

- [ ] T035 [US1] Update `packages/codegen/src/emitters/factories.ts` — emit named members as `_<name>` storage keys (was `$fields.<name>`)
- [ ] T036 [US2] Update `packages/codegen/src/emitters/factories.ts` — emit non-enumerable accessor function `<name>(): NodeMemberValue` per storage slot via `Object.defineProperty`
- [ ] T037 [US3] Update `packages/codegen/src/emitters/factories.ts` — emit `Object.freeze(node)` as final step of every factory; freeze nested arrays in `_`-storage
- [ ] T038 [US3] Update `packages/codegen/src/emitters/factories.ts` — emit `$with` namespace via `buildWithNamespace`; include `$with.$child(v)` / `$with.$children(vs)` for unnamed slots
- [ ] T039 [US1] Update `packages/codegen/src/emitters/factories.ts` — remove per-field fluent setter method emission (target ~-1,500 lines per grammar)
- [ ] T040 [US1] Update `packages/codegen/src/emitters/factories.ts` — emit `$child` / `$children` keys (without `$fields` wrapping) for unnamed slots

### Wrap emitter (US1 + US2 + US3 surface — must match factory output)

- [ ] T041 [US1] Update `packages/codegen/src/emitters/wrap.ts` — store `_<name>` per slot (factory: value; wrap: stub or value depending on shallow/recursive)
- [ ] T042 [US2] Update `packages/codegen/src/emitters/wrap.ts` — emit accessor functions that call `materializeStub(this._<name>)` if stub, else return value directly
- [ ] T043 [US2] Add `materializeStub(stub)` helper in `packages/core/src/readNode.ts` (or `nodeData.ts`) — calls `readNode(tree, stub.$nodeHandle, stub.$childIndex)`
- [ ] T043a [US2] Add error handling in `materializeStub(stub, tree)` in `packages/core/src/readNode.ts` — when `tree` is undefined or disposed, throw `Error("NodeData stub cannot be materialized: parse tree no longer available (handle=N, childIndex=N)")`. Add test in `nodedata-shape.test.ts` asserting the specific error message format and that it includes `stub.$nodeHandle` and `stub.$childIndex`. Covers spec.md edge case E3.
- [ ] T044 [US3] Update `packages/codegen/src/emitters/wrap.ts` — emit `Object.freeze(node)` as final step
- [ ] T045 [US3] Update `packages/codegen/src/emitters/wrap.ts` — emit `$with` namespace identical to factory (calls factory with materialized values)

### Type emitter (drop $fields wrapper)

- [ ] T046 [US1] Update `packages/codegen/src/emitters/types.ts` — drop `$fields` from generated interfaces; emit `_<name>` storage keys + accessor function signatures + `$with` typed namespace
- [ ] T047 [US2] Update `packages/codegen/src/emitters/types.ts` — emit accessor function types (`<name>(): T`) on the interface
- [ ] T048 [US3] Update `packages/codegen/src/emitters/types.ts` — emit `$with` typed namespace (`$with: { <name>(v: T): NodeData }`)

### Method emitter (US4 setup — see Phase 5 for full $-prefix pass)

- [ ] T049 [US3] Refactor `factorySuffix` in `packages/codegen/src/emitters/factories.ts` to call `withMethods` shared helper instead of inlining method emissions per factory

### Tests

- [ ] T050 [P] [US1] Add `nodedata-shape.test.ts` in `packages/codegen/src/__tests__/` — assert `node.$fields === undefined`, `node._name` returns value
- [ ] T051 [P] [US2] Add tests in same file — assert `typeof node.name === 'function'`, accessor non-enumerable (`Object.keys` excludes), `node.name()` returns value. **Strict key check** (covers SC-004): `Object.keys(node).every(k => k.startsWith('$') || k.startsWith('_'))` — every enumerable key is either `$`-metadata or `_`-storage, no other shape leaks
- [ ] T052 [P] [US3] Add tests in same file — assert `Object.isFrozen(node)`, frozen array in `_`-storage, `$with.name(v)` returns new frozen node, chain `$with.a(x).$with.b(y)` works. **Also assert** (R-009): `Object.keys(node).includes('$with') === false` (`$with` is non-enumerable). **Also assert** (R-006/E2): for an unnamed-singular kind, `'$child' in node && node.$children === undefined`; for an unnamed-array kind, `'$children' in node && node.$child === undefined`; for an all-named kind (e.g. `identifier_pattern`), `node.$child === undefined && node.$children === undefined`. **Also assert** (E5): a leaf node (e.g. keyword `fn`) has `$type`, `$source`, `$named`, `$text` and no `_`-storage keys
- [ ] T052a [P] [US3] Add to `nodedata-shape.test.ts` — for a representative factory node and a wrap node: assert `JSON.parse(JSON.stringify(node))` round-trips to an object whose keys are exactly `Object.keys(node)`, contains no function artifacts, and matches the union of `$`-metadata + `_`-storage keys. Assert `'$with'`, `'$render'`, accessor function names do NOT appear in the parsed JSON. Covers spec.md SC-007 and edge case E6.

### Verification

- [ ] T053 [US1] Regenerate all three grammar packages
- [ ] T054 [US1] Run native RT (3 modes) + type-check + `cargo build`. RT floors hold (python ≥114, rust ≥124, typescript ≥108).
- [ ] T055 [US1] Verify line-count reduction: `wc -l packages/{rust,typescript,python}/src/factories.ts` shows ~-1,500 lines per grammar vs baseline
- [ ] T056 [US1] Verify zero `$fields` references in generated output: `rg '\$fields' packages/{rust,typescript,python}/src` returns empty. Covers SC-001.
- [ ] T056b [US1] Commit Phase 2: "022(surface): de-hoist $fields, accessor fns, freeze, $with namespace"

**Checkpoint**: Phase 2 (Surface) core complete. Consumer-visible surface change landed. Factory and wrap produce structurally-identical objects. Phase 2 continues in the next two sections (US4, US5) which are smaller follow-ons that share the surface phase.

---

## Phase 2 (continued): User Story 4 — `$`-prefixed sittir methods (Priority: P2)

**Goal**: All sittir-owned methods use `$`-prefix: `$render()`, `$toEdit()`,
`$replace()`, `$trivia()`. Eliminates collisions with grammar field names.

**Independent Test**: `node.$render()` works and produces source text;
`node.render` is undefined OR is a grammar field accessor (depending on whether
the grammar has a `render` field).

- [ ] T057 [US4] Update `withMethods` helper in `packages/core/src/nodeData.ts` — attach `$render`, `$toEdit`, `$replace`, `$trivia` (non-enumerable)
- [ ] T058 [US4] Remove unprefixed method emission from `packages/codegen/src/emitters/factories.ts` and `packages/codegen/src/emitters/wrap.ts`
- [ ] T059 [US4] Update `packages/codegen/src/emitters/types.ts` — emit `$render(): string`, `$toEdit(range): Edit`, `$replace(target): Edit`, `$trivia(...): NodeData`
- [ ] T060 [P] [US4] Update consumer call sites: search for `.render()` / `.toEdit(` / `.replace(` / `.trivia(` in `packages/{core,codegen}/src/__tests__/` and rename to `$`-prefix
- [ ] T061 [P] [US4] Add test in `nodedata-shape.test.ts` — `typeof node.$render === 'function'`, non-enumerable
- [ ] T062 [US4] Regenerate grammar packages, run gates (RT + type-check + cargo)
- [ ] T063 [US4] Commit Phase 2 continuation: "022(surface): $-prefix sittir methods, withMethods shared helper"

---

## Phase 2 (continued): User Story 5 — Unified factory and wrap surface (Priority: P2)

**Goal**: Verify factory and wrap produce identical NodeData shape (same keys,
same accessor signatures, same `$with` namespace). The only behavioral
difference is wrap accessors do drill-in on stubs.

**Independent Test**: For any kind, `Object.keys(factoryNode)` ===
`Object.keys(wrapNode)` (after wrap drill-in materializes); accessor function
names match; `$with` namespace shape matches.

- [ ] T064 [US5] Add `unified-surface.test.ts` in `packages/codegen/src/__tests__/` — for each kind in corpus, assert factory output keys match wrap output keys
- [ ] T065 [US5] Same test — assert accessor function names and arity match
- [ ] T066 [US5] Same test — assert `Object.keys(factoryNode.$with)` === `Object.keys(wrapNode.$with)`
- [ ] T067 [US5] Run unified-surface test; fix any divergences in factory/wrap emitters
- [ ] T068 [US5] Commit Phase 2 continuation: "022(surface): verified unified factory/wrap surface"

---

## Phase 3: User Story 6 — napi direct property access (Priority: P2)

**Goal**: Cross the napi boundary via `FromNapiValue`/`ToNapiValue` reading JS
object properties directly. No `serde_json::to_string` then `JSON.parse`.

**Independent Test**: Profile/inspect native render call path — no JSON
serialization appears. Render path reads `_<name>` properties via
`Object::get_named_property` directly.

- [ ] T069 [US6] Implement `FromNapiValue for NodeData` in `rust/crates/sittir-core/src/types.rs` — read `$type`, `$source`, `$named`, `$text`, `$child`/`$children` via `get_named_property`
- [ ] T070 [US6] Implement direct field reading via storage-name lookup in `rust/crates/sittir-core/src/types.rs` — accept a per-kind `&[&str]` slice of `_`-prefixed storage keys
- [ ] T071 [US6] Remove `serde_json::to_string` / `serde_json::from_str` calls from native render entry in `rust/crates/sittir-core/src/engine.rs`
- [ ] T072 [P] [US6] Update `packages/codegen/src/emitters/render-module.ts` — emit per-kind storage-key arrays for napi direct lookup
- [ ] T073 [P] [US6] Update `packages/codegen/src/emitters/client-utils.ts` — terminal slot identity projection (no NodeData→string runtime conversion)
- [ ] T074 [P] [US6] Add `napi-direct.test.ts` in `packages/codegen/src/__tests__/` — assert `JSON.stringify` is not called in the render hot path (test instruments via spy or static analysis of the loaded module). **Also assert** (R-016): the generated transport struct in `rust/crates/sittir-{rust,typescript,python}-napi/src/lib.rs` has no `$with` field accessor and no `$render`/`$toEdit`/`$replace`/`$trivia` field — JS-only methods do not cross napi. Verify by inspecting the generated transport definitions.
- [ ] T075 [US6] Regenerate grammar packages, rebuild napi crates: `cargo build -p sittir-{rust,typescript,python}-napi`
- [ ] T076 [US6] Run native RT (3 modes); verify factory ceilings drop toward zero (ideal: 0)
- [ ] T077 [US6] Commit Phase 3: "022(transport): napi direct property access, no JSON in render path"

**Checkpoint**: Phase 3 complete. Transport boundary aligned with storage shape. Factory ceilings reduced.

---

## Phase 4: User Story 7 — Internal pipeline rewrite (Priority: P3)

**Goal**: Binding + Simplify produce the new taxonomy from scratch (instead of
current Assemble reaching it through compatibility shims). Drop any compatibility
shims introduced in earlier phases.

**Independent Test**: After phase, Binding/Simplify outputs are consumed
end-to-end by Assemble; native RT floors hold; factory ceilings remain at zero.

### ⚠ Execution Order (TDD per Constitution Principle IV)

Execute in this sequence:

1. **Tests RED** (T086a — provenance test) — write provenance assertions for the
   new pipeline output, run them against the current Assemble (which already
   produces RuleId lineage); observe whether the assertions hold today
2. **Implementation GREEN** (T078-T088) — write Binding + Simplify; rewrite
   Assemble; ensure provenance assertions still pass
3. **Verification** (T089-T093) — wire pipeline, RT gate, commit

### Binding

- [ ] T078 [US7] Create `packages/codegen/src/compiler/binding.ts` with `bindRule(kind, rule, rules)` returning `BindingResult`
- [ ] T079 [US7] Implement terminal-to-nonterminal attachment in `binding.ts`
- [ ] T080 [US7] Implement field-edge naming from `field(name, content)` wrappers in `binding.ts`
- [ ] T081 [US7] Implement alias-forced nonterminal classification in `binding.ts`

### Simplify

- [ ] T082 [US7] Create `packages/codegen/src/compiler/simplify.ts` consuming `BindingResult` and producing normalized constituent rules
- [ ] T083 [US7] Push `seq` ordering down to constituents in `simplify.ts`
- [ ] T084 [US7] Push `optional` / `repeat` / `repeat1` multiplicity down to constituent values in `simplify.ts`
- [ ] T085 [US7] Resolve `choice(...)` by frontier outcome in `simplify.ts` — synthesize normalized constituent form when needed
- [ ] T086 [US7] Strip `prec*` (parse metadata only) from constituents in `simplify.ts`
- [ ] T086a [P] [US7] Add `provenance.test.ts` in `packages/codegen/src/__tests__/` — for every assembled kind across all three grammars, assert each `AssembledNonterminal.values[]` entry carries a non-empty `ruleIds: readonly RuleId[]` lineage that resolves to an originating rule in the spec 021 RuleId catalog. Run after Phase 8 changes. Covers FR-021 (RuleId provenance preserved).

### Assemble rewrite

- [ ] T087 [US7] Update `packages/codegen/src/compiler/assemble.ts` — consume normalized constituents, materialize `AssembledNonterminal`/`AssembledLeaf`/etc directly
- [ ] T088 [US7] Drop any compatibility shims (e.g., `assembleField`/`assembleChild` legacy paths) in `assemble.ts`
- [ ] T089 [US7] Wire `bindRule` and `simplify` into pipeline in `packages/codegen/src/compiler/generate.ts`

### Verification

- [ ] T090 [US7] Regenerate grammar packages
- [ ] T091 [US7] Run native RT (3 modes); floors hold (python ≥114, rust ≥124, typescript ≥108)
- [ ] T092 [US7] Verify factory ceilings remain at zero
- [ ] T093 [US7] Commit Phase 4: "022(internals): Binding + Simplify pipeline rewrite"

---

## Phase 5: Polish & Cross-Cutting Concerns

- [ ] T094 [P] Update `CLAUDE.md` to document the new NodeData surface and `$with` namespace
- [ ] T095 [P] Update memory entry `project_022_surface_design.md` — mark spec/plan/tasks landed
- [ ] T096 [P] Run quickstart.md validation end-to-end on a fresh checkout
- [ ] T097 Final regression check: full `pnpm test` + `pnpm -r run type-check` + `cargo test --workspace` clean
- [ ] T098 Update PR description with before/after metrics: line counts, RT pass rates, factory ceilings, render perf delta

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 0 (Setup)**: No dependencies
- **Foundational**: Empty — skip
- **Phase 1 (US0 Taxonomy)**: After Setup. Pure rename — must land before any emitter behavior change.
- **Phase 2 (US1+US2+US3 Surface)**: After Phase 1. Three stories grouped because they are inseparable faces of one emitter rewrite.
- **Phase 2 cont. (US4 $-methods)**: After core Phase 2. Standalone refactor; same surface phase.
- **Phase 2 cont. (US5 Unified)**: After core Phase 2 (and ideally US4). Verification phase.
- **Phase 3 (US6 napi direct)**: After Phase 2. Requires `_`-storage to read.
- **Phase 4 (US7 Pipeline)**: After Phase 3. Last — produces the model the earlier phases consume.
- **Phase 5 (Polish)**: After Phase 4.

### Why US1/US2/US3 are grouped

After Phase 4 begins, intermediate states are temporarily broken:
- US1 alone (drop `$fields`, no accessor): consumers can't read fields
- US2 alone (add accessor, keep `$fields`): accessor reads via `this.$fields.<name>` — pointless intermediate
- US3 alone (freeze, `$with`): can't `$with` if no `_`-storage exists

They land in one focused phase with one commit at the end. Each task is small;
the *phase* is the increment, not each story individually.

### Within Each Phase

- Type definitions before emitters (emitters consume types)
- Foundation helpers (`@sittir/core/nodeData.ts`) before emitter changes that use them
- **Tests written first** within each phase — observe RED before implementation, observe GREEN after. In Phase 4: write T050-T052 + T052a + T043a BEFORE T035-T049 implementation tasks. In Phase 8: write T086a BEFORE T078-T088. The task ordering in this document is logical (types → helpers → impl → tests → verify); the *execution* ordering should hoist the tests.
- Emitters before regenerate (regenerate is a verification step)

### Parallel Opportunities

- T016-T023 (US0 reader updates): different files, no dependencies between them — run in parallel
- T030-T034 (US1+ foundation types and helpers): different files, parallel
- T050-T052, T052a (US1/US2/US3 tests): different test groupings in same file — write together, RED before T035-T049 implementation tasks
- T060 (US4 consumer rename): orthogonal to T057-T059 emitter changes
- T072-T074 (US6 emitter + test work): different files, parallel
- T086a (US7 provenance test): orthogonal to T078-T088 implementation; can be written first to drive the rewrite

---

## Parallel Example: Phase 1 (US0 Reader Updates)

```bash
# After T004-T015 (types + assembler) complete, run the reader updates in parallel:
Task: "Update packages/codegen/src/emitters/factories.ts to read AssembledNonterminal/Pattern/etc."
Task: "Update packages/codegen/src/emitters/wrap.ts to read new types"
Task: "Update packages/codegen/src/emitters/types.ts to read new types"
Task: "Update packages/codegen/src/emitters/from.ts to read new types"
Task: "Update packages/codegen/src/emitters/client-utils.ts to read new types"
Task: "Update packages/codegen/src/emitters/render-module.ts to read new types"
Task: "Update packages/codegen/src/emitters/jinja-walker.ts to read new types"
Task: "Update validators (packages/codegen/src/validate/*.ts) to read new types"
```

---

## Implementation Strategy

### MVP First (Phase 1 — Taxonomy Collapse)

1. Complete Phase 0 (Setup baselines)
2. Complete Phase 1 (US0 Taxonomy)
3. **STOP and VALIDATE**: byte-identical regenerated output proves the rename is non-lossy
4. Commit; this alone is a meaningful, shippable refactor

### Incremental Delivery

1. Phase 0 baselines → Phase 1 taxonomy → ship
2. Phase 2 surface reshape (US1+US2+US3) → ship (consumer-visible improvement)
3. Phase 2 cont. ($-methods + unified) → ship
4. Phase 3 napi direct → ship (transport efficiency win)
5. Phase 4 pipeline rewrite → ship (internal cleanup; invisible to consumers)

Each phase ships an independently valuable increment. Phases 1 and 3 are the
biggest user-visible wins; Phase 4 is internal hygiene.

### RT Gate at Every Phase

Native RT (shallow + deep + factory) + type-check + `cargo build` must pass at
the END of every phase. Phase 1 has the strongest gate: byte-identical
regenerated output.

---

## Notes

- `[P]` tasks = different files, no dependencies on incomplete tasks in this phase
- `[Story]` label maps task to user story for traceability with spec.md FRs
- Each phase ends in a verification + commit task — don't skip them
- Grouping US1+US2+US3 in one phase is intentional; documented above
- Constitution Principle XI (DRY) requires `assertNever(x)` on every union switch — T024 audits this
- All file paths are repository-absolute relative to `/Users/pmouli/GitHub.nosync/refactory-lang/sittir/`
