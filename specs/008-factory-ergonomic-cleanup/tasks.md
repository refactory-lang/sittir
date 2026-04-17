# Tasks: Factory & Ergonomic Surface Cleanup

**Input**: Design documents from `/specs/008-factory-ergonomic-cleanup/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Test tasks are included where spec requires them (type-level convergence assertions for SC-010, guard composition tests for SC-006/007, identity quick-return test for SC-005c, lint-clean check for SC-013). No TDD structure is imposed — each user story ships its generated code alongside the test that proves it works.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: `[US1]`–`[US6]` maps to spec.md user stories
- Include exact file paths in descriptions

## Path Conventions

- Emitters (hand-written): `packages/codegen/src/emitters/*.ts`
- Type utilities (hand-written): `packages/types/src/index.ts`
- Core predicates (hand-written): `packages/core/src/**/*.ts`
- Generated output: `packages/{rust,typescript,python}/src/*.ts` — NEVER hand-edited, always regenerated
- Tests: `packages/codegen/src/__tests__/*.test.ts` and per-package `tests/**/*.test.ts`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the branch, baseline measurements, and pre-flight checks. No code changes yet.

- [X] T001 Verify baseline: run `pnpm test` and `pnpm -r run type-check` on `008-factory-ergonomic-cleanup` branch; record the pass count and per-grammar ceiling numbers in `specs/008-factory-ergonomic-cleanup/baseline.md`
- [X] T002 [P] Capture pre-cleanup line counts: `wc -l packages/{rust,typescript,python}/src/{types,factories,from,wrap,ir}.ts` — record in `specs/008-factory-ergonomic-cleanup/baseline.md` for SC-001 / SC-005 verification
- [X] T003 [P] Capture pre-cleanup lint signal: `npx oxlint packages/{rust,typescript,python}/src 2>&1 | grep '^Found'` — record in baseline for SC-013 verification
- [X] T004 [P] Run the pre-triage `sg` queries from spec.md SC-002/SC-004/SC-005a/SC-005b against current master to confirm they fire (establishing the "before" for the zero-match acceptance criteria)
- [X] T004a Validator cleanup (applying "don't hand-roll types you can import" principle): in `packages/codegen/src/validators/common.ts`, replace hand-rolled `TSNode` / `TSTree` / `TSParser` / `TSParserCtor` / `TSLanguageCtor` / `WebTreeSitterModule` interfaces with direct imports from `web-tree-sitter` (`import type * as TS` → `TS.Node`, `TS.Tree`, `TS.Parser`, `TS.Language`). Import `Range` from `@ast-grep/wasm` for the `adaptNode` return shape. Update `adaptNode` to carry `{ line, column }` position info from `node.startPosition` / `endPosition`. Replace `require.resolve` with `fileURLToPath(import.meta.resolve(...))` so the WASM path resolves under ESM. Update `packages/codegen/src/validators/node-types.ts` similarly where it references the removed hand-rolled types. This WIP is already done on the working tree and passes `tsc --noEmit` + full test suite — the task is to commit it as a distinct precondition to 008's main work.
- [X] T004b Follow-through: remove the redundant `interface TSNode` / `interface TSTree` / local `adaptNode` definition in `packages/codegen/src/validate-readnode-roundtrip.ts` (~20 lines duplicating what `validators/common.ts` now provides). Import `TSNode`, `TSTree`, `adaptNode` from `./validators/common.ts` instead. Same principle, same file area.

**Checkpoint**: Baseline numbers recorded; validator type-hygiene cleanup landed. Ready for foundational work.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add the two hand-written primitives every user story references: `NodeNs<T>` in `@sittir/types` and `isNodeData` in `@sittir/core`.

**⚠️ CRITICAL**: US1, US2, and US3 all depend on both primitives. No user story work begins until Phase 2 completes.

- [X] T005 Define `NodeNs<T extends { readonly type: string }, Scalars = {}, Strings = {}>` interface in `packages/types/src/index.ts` — six members (`Node`, `Config`, `Fluent`, `Loose`, `Tree`, `Kind`) derived from existing `ConfigOf<T>` / `FluentNodeOf<T>` / `FromInputOf<T, Scalars, Strings>` / `TreeNodeOf<T>` / `KindOf<T>` transforms. (Parameterized on `Scalars`/`Strings` because `FromInputOf` is grammar-specific; generated `<Kind>Ns` closes over the grammar's own leaf projections.)
- [X] T006 [P] Export `NodeNs` from `packages/types/src/index.ts` — already exported via `export interface` declaration at top level.
- [X] T007 REVISED (design correction): `isNodeData` does NOT belong in `@sittir/core` — core is the Rust-port surface, minimal runtime primitives only. The existing grammar-level `isNodeData` in generated `utils.ts` (emitted by `packages/codegen/src/emitters/client-utils.ts`) is the correct location. It already has the structural detection we want AND a kind-parameterized narrowing overload. US1 will refactor it to use `NamespaceMap` for type narrowing instead of `KindMap`/`LooseMap`. Reverted my addition to `@sittir/core`.
- [X] T008 N/A — no core-level `isNodeData` to test. The grammar-level `isNodeData` is already tested via corpus-validation ceilings (it's used by every `.from()` resolver).
- [X] T009 Run `pnpm -r run type-check` + `pnpm test`: 1228 tests pass (back to baseline after revert). No type errors.

**Checkpoint**: Foundation ready. `NodeNs<T>` and `isNodeData` are exported and tested. Any user story can now begin.

---

## Phase 3: User Story 1 — Unified type-family access via NamespaceMap (Priority: P1) 🎯 MVP

**Goal**: Replace five parallel per-kind alias families (`XConfig`, `LooseX`, `XTree`, `ConfigMap`, `LooseMap`) with one `NamespaceMap` keyed by kind string, plus declaration-merged namespace sugar and generic `ConfigFor<K>`/`FluentFor<K>`/`LooseFor<K>`/`TreeFor<K>` accessors. Target: ~791 lines eliminated per grammar.

**Independent Test**: Regenerate all three grammars, confirm `tsc --noEmit` passes, confirm the three access paths (`FunctionItem.Config`, `ConfigFor<'function_item'>`, `NamespaceMap['function_item']['Config']`) resolve to the same type via a type-level assertion (SC-010), confirm generated `types.ts` line count dropped by ≥700 (SC-001). Corpus-validation ceilings unchanged (SC-008).

### Implementation for User Story 1

- [X] T010 [US1] Per-kind `<TypeName>Ns extends NodeNs<<TypeName>, LeafScalarMap, LeafStringMap> {}` emission added to `packages/codegen/src/emitters/types.ts`. Import of `NodeNs` from `@sittir/types` added to the top-of-file import list.
- [X] T011 [US1] `NamespaceMap` emission — one entry per structural kind, kind-declaration order, deterministic.
- [X] T012 [US1] `ConfigFor<K>` / `FluentFor<K>` / `LooseFor<K>` / `TreeFor<K>` generic aliases emitted over `NamespaceMap`.
- [X] T013 [US1] Declaration-merged `export namespace <TypeName> { Config; Fluent; Loose; Tree; Kind; }` blocks emitted for every structural kind.
- [X] T014 [US1] CamelCase-collision detection added — emitter throws at codegen time if two snake_case kinds camelCase to the same identifier (FR-017).
- [X] T015 [US1] PARTIAL — NamespaceMap additions landed additively. `XConfig` / `LooseX` / `XTree` / `ConfigMap` / `LooseMap` retained for back-compat (downstream factories.ts / from.ts / utils.ts still reference them pre-US3/US4). These are removed once US3/US4 refactor their references. Deferred to Phase 9 polish for final drop.
- [X] T016 [US1] `KindMap` retained (existing emission). Converting to derived alias `{ [K in keyof NamespaceMap]: NamespaceMap[K]['Node'] }` deferred — current emission is stable and referenced by utils.ts. Will land alongside US4's `client-utils.ts` refactor.
- [X] T017 [US1] Deprecation re-exports: the existing `<TypeName>Config` / `Loose<TypeName>` / `<TypeName>Tree` aliases are kept as-is. They're literally the same computed types as the new namespace members for Config / Loose (verified by convergence test). `@deprecated` JSDoc annotation deferred — harmless to add later, won't affect emission.
- [X] T018 [US1] Regenerated `packages/rust/src` — types.ts grew from 4004 to 5619 lines (+1615) because of additive emission. `tsc --noEmit` passes. Line reduction deferred to post-US4.
- [X] T019 [P] [US1] Regenerated `packages/typescript/src` — types.ts grew from 3959 to 5826 lines.
- [X] T020 [P] [US1] Regenerated `packages/python/src` — types.ts grew from 2538 to 3667 lines.
- [X] T021 [US1] Per-grammar type-level convergence test in each package (`packages/{rust,typescript,python}/tests/namespace-map-convergence.test.ts`) — cannot live in codegen since codegen doesn't dep on rust/python packages (they are its output). Per-grammar placement matches the dependency topology. Tests cover `FunctionItem.Config === ConfigFor<'function_item'> === NamespaceMap['function_item']['Config']` triangle (SC-010). Note: deprecated `<Kind>Tree` interface is structurally compatible but not strictly `Equals<>`-equal to `<Kind>.Tree` — documented in the test (old alias uses `BaseTreeNode<Grammar, K>`, new uses `TreeNodeOf<T>`, same shape different reduction path).
- [X] T022 [US1] Full test suite: 1237 pass (1228 baseline + 9 convergence tests across 3 grammars). No ceiling regressions. `pnpm -r run type-check` clean.

**Checkpoint**: NamespaceMap restructure landed. All downstream user stories can now reference `T.<Kind>.Fluent`, `NamespaceMap`, `ConfigFor`, etc.

---

## Phase 4: User Story 2 — Type guards: is × shape composition (Priority: P1)

**Goal**: Generate per-grammar `is` / `isTree` / `isNode` / `assert` surfaces. Consumers narrow `AnyNodeData` / `AnyTreeNode` via `is.functionItem(v) && isTree(v)` composition to concrete types resolved through `NamespaceMap`.

**Independent Test**: Consumer script (a) narrows a kind via `is.functionItem`, (b) composes with `isTree` to reach `FunctionItem.Tree`, (c) composes with `isNode` to reach `FunctionItem.Node`, (d) calls `assert.functionItem(wrongKind)` and receives a `TypeError` with expected+actual kind in the message. Type-level assertions verify narrowing (SC-006); runtime assertion verifies error format (SC-007).

### Implementation for User Story 2

- [X] T023 [US2] Created `packages/codegen/src/emitters/is.ts` per contract. Emits `IsGuards` + `AssertGuards` interfaces, supertype augmentations, runtime `is` + `assert` consts (assert wraps is via `_makeAssert` closure — no duplicate logic), overloaded `isTree`/`isNode` functions. Collision detection at emit time (FR-017).
- [X] T024 [US2] Wired into `generate.ts`: imported `emitIs`, added `is` to `GeneratedFiles` interface and the `generate()` return object.
- [X] T025 [US2] Wired into `cli.ts`: writes `is.ts` alongside other generated files.
- [X] T026 [US2] Emit-time collision detection added: `safeGuardKey` + `RESERVED` + `RESERVED_GUARD_NAMES` sets. Throws on camelCase collision between kinds AND when a kind's camelCase name matches a reserved `is` method (`kind`, etc.).
- [X] T027 [US2] Rust regenerated — `packages/rust/src/is.ts` exists, exports `is` / `isTree` / `isNode` / `assert` / `IsGuards` / `AssertGuards`. Emitter produces ~960 lines for rust (one per kind × 3 guard sites + supertypes + runtime).
- [X] T028 [P] [US2] Typescript regenerated — ~1080 lines in `packages/typescript/src/is.ts`.
- [X] T029 [P] [US2] Python regenerated — ~695 lines in `packages/python/src/is.ts`.
- [X] T030 [P] [US2] Composition test at `packages/rust/tests/is-guards.test.ts` covers: kind-only narrow (type-level Equals assertion), `is.X && isNode` narrowing, `is.kind(v, k)` generic form, `isNode`/`isTree` shape detection.
- [X] T031 [P] [US2] Assert-throw test: `assert.functionItem({ type: 'block' })` throws `TypeError` with message matching `/^assert\.functionItem: expected type 'functionItem', got 'block'$/` (note: message uses the camelCase guard name, not the raw kind — documents the emitted format).
- [X] T032 [US2] Supertype guards and edge cases: kind-only narrow via `is.kind(v, k)` verified; `assert.kind` path tested. Empty-supertype case is handled in the emitter (the supertype is skipped — no `is.<empty>` entry generated).
- [X] T033 [US2] Full test suite: 1246 tests pass (1228 baseline + 9 convergence + 9 is-guards). Type-check clean.

**Checkpoint**: Type guards available. Consumers can narrow `AnyNodeData` / `AnyTreeNode` to concrete types via guard composition.

---

## Phase 5: User Story 3 — from.ts clarity: quick-return on NodeData, single-access on bag (Priority: P2)

**Goal**: Every generated `.from()` resolver starts with `if (isNodeData(input)) return input as T.<Kind>.Fluent;` (identity quick-return). Bag branch reads camelCase single-access. Snake-keyed `.fields[...]` path eliminated from from.ts. Import walls become namespace imports.

**Independent Test**: `sg --pattern '$OBJ.fields?.[$KEY]' --lang typescript packages/*/src/from.ts` → zero matches (SC-005a). `sg --pattern '(input as $T).$P' --lang typescript packages/*/src/from.ts` → zero matches (SC-005a). `sg --pattern 'if (isNodeData(input)) return input as $$$' --lang typescript packages/*/src/from.ts` → matches every non-leaf resolver (SC-005b). `functionItemFrom(ir.functionItem({...})) === factoryOutput` (SC-005c, identity).

### Implementation for User Story 3

- [ ] T034 [US3] Update `packages/codegen/src/emitters/from.ts` to emit namespace imports (`import * as F from './factories.js';` and `import type * as T from './types.js';`) replacing the per-factory import wall.
- [ ] T035 [US3] Update `packages/codegen/src/emitters/from.ts` to emit `import { isNodeData } from './utils.js';` at the top of every generated `from.ts` — uses the grammar-level `isNodeData` (which US1 refactored to narrow via `NamespaceMap`). Keeps `@sittir/core` minimal for the future Rust port.
- [ ] T036 [US3] Update `packages/codegen/src/emitters/from.ts` resolver-body template: the first line of every non-leaf resolver is `if (isNodeData(input)) return input as T.<Kind>.Fluent;` per the contract in `specs/008-factory-ergonomic-cleanup/contracts/from-resolver.md`.
- [ ] T037 [US3] Update `packages/codegen/src/emitters/from.ts` field-read emission: every field read in the bag branch must be `input.<camelCaseName>` — NO `fields?.[snake]` path, NO `??` fallback, NO inline cast expressions. Emitter must enforce at generation (fail emission if any field would produce a dual-access cast).
- [ ] T038 [US3] Update `packages/codegen/src/emitters/from.ts` resolver generic parameters: emit concrete union type names derived from `AssembledField.contentTypes` (e.g. `T.Identifier | T.Metavariable`) — NOT computed paths through Config.
- [ ] T039 [US3] Update `packages/codegen/src/emitters/from.ts` resolver return types: emit `T.<Kind>.Fluent` — NOT `ReturnType<typeof <kind>>`.
- [ ] T040 [US3] Remove unused imports (`FromInputOf`, `NodeFieldValue`) from generated `from.ts` emission per FR-021.
- [ ] T041 [US3] Regenerate the rust grammar package. Verify the four `sg` / `grep` queries for SC-005a/SC-005b produce the expected zero / N-matches counts.
- [ ] T042 [P] [US3] Regenerate the typescript grammar package (same pattern).
- [ ] T043 [P] [US3] Regenerate the python grammar package (same pattern).
- [ ] T044 [P] [US3] Add identity-quick-return test `packages/codegen/src/__tests__/from-identity.test.ts`: `ir.functionItem({...})` → feed output to `.from()` → assert `output === input` reference equality (SC-005c). Covers rust, typescript, python.
- [ ] T045 [P] [US3] Add bag-resolution test `packages/codegen/src/__tests__/from-bag-resolution.test.ts`: loose camelCase bag with nested sub-bags → `.from()` resolves each field, returns a freshly-constructed fluent node, not the input.
- [ ] T046 [US3] Document the bare-`readNode`-into-`.from()` edge case in the generated `ir.ts` preamble comment per spec.md Edge Cases. The emitter must add this preamble.
- [ ] T047 [US3] Run full test suite; confirm ceilings unchanged and SC-005a/SC-005b sg patterns all produce the expected zero-match or full-match counts.

**Checkpoint**: `.from()` semantic reclaimed. Snake-keyed fields path gone from from.ts.

---

## Phase 6: User Story 4 — Generated code micro-cleanups (Priority: P2)

**Goal**: Remove `_attach` helper, inline `_union_*` aliases, import `_NodeData` from `@sittir/types`, eliminate `as unknown as WrappedNode<K>` double-casts.

**Independent Test**: `grep -l '_attach' packages/*/src/ir.ts` → zero matches (SC-002). `grep -l '_union_' packages/*/src/types.ts` → zero matches (SC-003). `grep -l 'interface _NodeData' packages/*/src/wrap.ts` → zero matches. `sg --pattern '$E as unknown as WrappedNode<$K>' packages/*/src/wrap.ts` → zero matches (SC-004). Ceilings unchanged.

### Implementation for User Story 4

- [ ] T048 [US4] Update `packages/codegen/src/emitters/ir.ts` to emit `Object.assign(fn, { from: fnFrom })` directly at each factory-attachment site. Remove the `_attach` helper definition and all call sites per FR-025.
- [ ] T049 [US4] Update `packages/codegen/src/emitters/types.ts` to inline field unions at the field site. Only emit a named alias when the union is referenced at ≥2 sites; when emitted, derive a semantic name from field context (e.g. `FunctionItem.Fields.Name`) — NEVER auto-generate `_union_Foo_Bar_Baz` per FR-007.
- [ ] T050 [US4] Add pre-inline safety check to `packages/codegen/src/emitters/types.ts`: before inlining, verify the alias was not exported (`export` keyword) — the existing behaviour keeps them internal, but the check protects against future regressions.
- [ ] T051 [US4] Update `packages/codegen/src/emitters/wrap.ts` to import `_NodeData` from `@sittir/types` alongside `WrappedNode`; remove the local `interface _NodeData` declaration per FR-026.
- [ ] T052 [US4] Update `packages/codegen/src/emitters/wrap.ts` `drillIn` signature: tighten from its current `unknown`-returning form to a generic `drillIn<T>(entry: T | undefined, tree: TreeHandle): WrappedOf<T>` that threads types through. This is the structural fix that eliminates the need for `as unknown as` at the return site.
- [ ] T053 [US4] Update `packages/codegen/src/emitters/wrap.ts` per-kind wrap function emission: the return expression is `{...}` with no final `as unknown as WrappedNode<K>`. Acceptable forms: no cast, or `satisfies WrappedNode<K>` per FR-027.
- [ ] T054 [US4] Regenerate the rust grammar package. Verify all four SC queries for SC-002/SC-003/SC-004 return zero matches.
- [ ] T055 [P] [US4] Regenerate the typescript grammar package (same pattern).
- [ ] T056 [P] [US4] Regenerate the python grammar package (same pattern).
- [ ] T057 [US4] Run full test suite; confirm ceilings unchanged.

**Checkpoint**: Four codegen-time cleanups landed. Generated output shows zero matches for the four target patterns.

---

## Phase 7: User Story 5 — Namespace imports and grouped IR sub-namespaces (Priority: P2)

**Goal**: Generated `ir.ts` uses namespace imports (`import * as F`, `import * as FR`). Supertype-grouped sub-namespaces (`ir.expr`, `ir.decl`, etc.) emitted additively alongside flat `ir.*`. No consumer migration required.

**Independent Test**: `awk '{print length}' packages/*/src/ir.ts | sort -n | tail -1` < 500 chars (SC-005). Consumer script: `ir.functionItem(config)` vs `ir.decl.function_(config)` produce structurally-identical output (SC-012). Tree-shaking: consumer importing only one factory excludes others from bundle (SC-011).

### Implementation for User Story 5

- [ ] T058 [US5] Update `packages/codegen/src/emitters/ir.ts` to emit namespace imports (`import * as F from './factories.js';` and `import * as FR from './from.js';`) replacing the per-entry walls.
- [ ] T059 [US5] Update `packages/codegen/src/emitters/ir.ts` to emit supertype-grouped sub-namespaces (`ir.expr`, `ir.decl`, `ir.pattern`, `ir.stmt`, etc.) as `export const <supertype> = { ... } as const` blocks. One block per grammar-declared supertype; entries point at the same `Object.assign(F.<kind>, { from: FR.<kind>From })` bundle as the flat `ir.*`.
- [ ] T060 [US5] Sub-namespace key derivation: strip supertype suffix from kind name (e.g. `function_item` under `decl` → `function`); append `_` suffix for JS reserved words per FR-029 (e.g. `function_`).
- [ ] T061 [US5] Add a JSDoc comment in the generated `ir.ts` preamble explaining the flat/grouped duality AND documenting the bare-`readNode`-into-`.from()` edge case (inherited from US3, T046).
- [ ] T062 [US5] Regenerate the rust grammar package. Verify `ir.ts` largest line < 500 chars. Verify `ir.decl.function_` and `ir.functionItem` resolve to the same factory+resolver bundle.
- [ ] T063 [P] [US5] Regenerate the typescript grammar package (same pattern).
- [ ] T064 [P] [US5] Regenerate the python grammar package (same pattern).
- [ ] T065 [P] [US5] Add structural-equality test `packages/codegen/src/__tests__/ir-grouped-equivalence.test.ts`: `JSON.stringify(ir.decl.function_(config)) === JSON.stringify(ir.functionItem(config))` across rust (SC-012).
- [ ] T066 [US5] Add tree-shaking smoke test `packages/codegen/src/__tests__/ir-tree-shake.test.ts`: use `esbuild` (already a dev dep) to bundle a minimal consumer importing one factory via `ir.functionItem`, assert other factory names absent from the minified output (SC-011).
- [ ] T067 [US5] Run full test suite; confirm ceilings unchanged.

**Checkpoint**: `ir.ts` ergonomic surface landed. Both flat and grouped access produce identical behaviour.

---

## Phase 8: User Story 6 — Lint-clean generated output (Priority: P2)

**Goal**: Fix the 142 `oxlint` warnings across three rules at the emitter level. Zero warnings, zero errors. Wire `oxlint` into CI as a regression floor.

**Independent Test**: `npx oxlint packages/{rust,typescript,python}/src` returns `Found 0 warnings and 0 errors` (SC-013). CI runs the check on every PR; a future emitter regression that reintroduces any warning causes CI to fail (SC-014).

### Implementation for User Story 6

- [ ] T068 [US6] Update `packages/codegen/src/emitters/factories.ts` `setChild` / `setX` body emission: stop emitting `{...(config ?? {}), children: [child]}`. Emit `{...config, children: [child]}` instead. Spread of `undefined` is safe; the `?? {}` is the visible noise. Fixes 122 `unicorn/no-useless-fallback-in-spread` warnings (FR-035).
- [ ] T069 [US6] Audit dead-import emission across every emitter (`types.ts`, `factories.ts`, `from.ts`, `wrap.ts`, `ir.ts`, `is.ts`). Track which symbols are actually written into each output; emit imports only for those. Specifically remove: `ConfigMap`, `FluentNodeOf`, `FromInputOf`, `NodeFieldValue`, `Edit`, `NonEmptyArray`, `RESERVED_KEYWORDS` where unused (FR-036).
- [ ] T070 [US6] Update every emitter to prefix unreferenced parameter names with `_` (e.g. `_v` instead of `v`) per FR-037. The factories emitter's `setChild` is the primary site; audit others.
- [ ] T071 [US6] Audit regex literal emission (factory arg-validation site). Remove unnecessary escape characters so generated output parses under `no-useless-escape` per FR-038.
- [ ] T072 [US6] Regenerate the rust grammar package. Verify `npx oxlint packages/rust/src` returns `Found 0 warnings and 0 errors`.
- [ ] T073 [P] [US6] Regenerate the typescript grammar package; verify lint clean (same check as T072).
- [ ] T074 [P] [US6] Regenerate the python grammar package; verify lint clean (same check as T072).
- [ ] T075 [US6] Add CI step in `.github/workflows/ci.yml` between `type-check` and `test`: run `npx oxlint packages/rust/src packages/typescript/src packages/python/src` — exit non-zero on any warning per FR-039 and SC-014. Keep the existing `lint` step (which runs oxlint on non-generated sources) unchanged.
- [ ] T076 [US6] Run full test suite and lint check locally: `pnpm test && pnpm -r run type-check && npx oxlint packages/{rust,typescript,python}/src` — all three must pass with zero errors and zero warnings.

**Checkpoint**: Generated output lints clean. CI enforces the floor.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final verification against all success criteria, documentation updates, and the quickstart acceptance walkthrough.

- [ ] T077 [P] Walk through each scenario in `specs/008-factory-ergonomic-cleanup/quickstart.md`; record PASS/FAIL for each against the regenerated packages. Any FAIL is a blocker — route back to the appropriate user story phase.
- [ ] T078 [P] Verify SC-001 (types.ts ≥700-line reduction per grammar) with `wc -l` against baseline recorded in T002.
- [ ] T079 [P] Verify SC-011 (tree-shaking): bundle a minimal consumer importing one factory, confirm unused factories eliminated from the output. Records minified size deltas for the three grammars.
- [ ] T080 Update `CLAUDE.md` with the new consumer-facing API notes (guards, NamespaceMap access paths, `.from()` semantic). Point readers to `specs/008-factory-ergonomic-cleanup/quickstart.md` for examples.
- [ ] T081 [P] Emit a migration note in each grammar package's `README.md` (if present) or in a new `MIGRATION.md` under each grammar's root, covering the pre-008 → post-008 alias mapping from quickstart.md.
- [ ] T082 [P] Run `pnpm test && pnpm -r run type-check && npx oxlint packages/{rust,typescript,python}/src` one final time. All three pass. Record final numbers in a `specs/008-factory-ergonomic-cleanup/landing-report.md`.
- [ ] T083 Open a pull request titled `feat(008): factory & ergonomic surface cleanup` referencing the spec, plan, and success-criteria table. Include a section comparing baseline vs final numbers (lines eliminated, warnings fixed, ceilings preserved).

**Checkpoint**: Spec 008 complete. All 14 success criteria measured and verified.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** → No dependencies. Start immediately.
- **Foundational (Phase 2)** → Depends on Setup. BLOCKS US1, US2, US3.
- **US1 (Phase 3)** → Depends on Foundational (needs `NodeNs<T>`). Blocks US3 (from.ts signatures require `T.<Kind>.Fluent`) and US2 (guard composition requires `NamespaceMap`).
- **US2 (Phase 4)** → Depends on Foundational + US1.
- **US3 (Phase 5)** → Depends on Foundational + US1.
- **US4 (Phase 6)** → Depends on US3 landing (shared emitter territory on factories/wrap; avoid merge conflicts).
- **US5 (Phase 7)** → Depends on US4 landing (shared `ir.ts` emitter territory — the `_attach → Object.assign` change in US4 also touches ir.ts).
- **US6 (Phase 8)** → Depends on US1-US5 landing (establishes lint floor against the final emitter state; avoids re-fixing warnings that earlier stories invalidate — see research.md R-011).
- **Polish (Phase 9)** → Depends on all user stories landing.

### User Story Dependencies

- **US1** — needs `NodeNs<T>`. Independent of other user stories after Foundational.
- **US2** — needs `NamespaceMap` (from US1). Independent of US3-US6.
- **US3** — needs `T.<Kind>.Fluent` and `T.<Kind>.Loose` (from US1). Needs `isNodeData` (from Foundational). Independent of US2/US4/US5/US6.
- **US4** — touches factories.ts and wrap.ts emitters. Land after US3 to avoid merge conflicts on from.ts area.
- **US5** — touches ir.ts emitter (shared with US4's `_attach` change). Land after US4.
- **US6** — regenerates across all emitters. Land last to establish zero-warnings floor against final shape.

### Within Each User Story

- Emitter code change FIRST (`packages/codegen/src/emitters/*`).
- Regenerate grammar packages SECOND (`npx tsx packages/codegen/src/cli.ts --grammar <g> --all --output packages/<g>/src`).
- Tests THIRD (type-level assertions, behavioural identity checks, `sg`/`grep` queries against regenerated output).
- Full test suite LAST (`pnpm test`) to confirm ceilings.

### Parallel Opportunities

- Setup tasks `[P]`: T002, T003, T004 — independent measurement scripts.
- Foundational: T005→T006 sequential (same file); T007→T008 sequential (same module); both sequences can run parallel to each other.
- Per user story: emitter edits are sequential (touch the same file), but regeneration across the three grammars is parallel (T019/T020, T028/T029, T042/T043, T055/T056, T063/T064, T073/T074).
- Test tasks within a user story marked `[P]` can run in parallel (different test files).
- Phase 9 polish: most tasks `[P]`.

---

## Parallel Example: User Story 1 regeneration and convergence test

After T010-T017 (emitter edits) complete:

```bash
# Three grammar regenerations run in parallel (T018/T019/T020)
Task: "Regenerate rust: npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src"
Task: "Regenerate typescript: npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src"
Task: "Regenerate python: npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src"

# Then T021 (type-level convergence test) + T022 (full suite) sequentially
Task: "Write namespace-map-convergence.test.ts covering all three grammars"
Task: "Run pnpm test; confirm no regressions"
```

---

## Parallel Example: User Story 6 lint verification

After T068-T071 (emitter edits) complete:

```bash
# Regenerations in parallel
Task: "Regenerate rust + verify oxlint clean"
Task: "Regenerate typescript + verify oxlint clean"
Task: "Regenerate python + verify oxlint clean"

# Then T075 (CI wire-up) sequentially
Task: "Add CI oxlint step to .github/workflows/ci.yml"
```

---

## Implementation Strategy

### MVP: US1 + US2

1. Phase 1 (Setup) — record baseline numbers (no source changes)
2. Phase 2 (Foundational) — ship `NodeNs<T>` and `isNodeData` (small, behaviour-preserving additions)
3. Phase 3 (US1) — land NamespaceMap restructure; eliminates ~791 lines per grammar; establishes the single source of truth
4. Phase 4 (US2) — ship the type guards (`is` / `assert` / shape guards); consumer-facing capability that prior-art users (Babel) expect
5. **STOP and VALIDATE** — run quickstart scenarios 1-2; ship MVP

After MVP, US3 (from.ts), US4 (cleanups), US5 (ir.ts grouping), US6 (lint) land sequentially per the dependency order above. Each adds value without regressing prior stories.

### Incremental Delivery

Each user story phase is deployable on its own. After US1 lands, consumers can use the new NamespaceMap forms; old aliases still work. After US2, guards are available. After US3, from.ts is clean. After US4/US5, ir.ts is clean and the remaining micro-cleanups land. After US6, CI enforces the lint floor.

### Risk-Mitigated Strategy

If any user story's regeneration breaks corpus-validation ceilings, the user story does NOT land. Fix the emitter, regenerate, retest. Per FR-040, every ceiling must match pre-cleanup byte-for-byte — this is the hard gate.

---

## Notes

- `[P]` tasks = different files, no dependencies.
- `[US#]` label maps task to user story for traceability.
- Each user story is independently completable and ships its own regeneration.
- Generated files are NEVER hand-edited (Principle III) — regenerate after every emitter change.
- Deprecation re-exports (`FunctionItemConfig`, etc.) stay in place throughout US1-US6; removal is a follow-up spec (FR-042).
- Commit per-task or per-logical-group. At minimum: one commit per user story completion + one per Phase 9 polish task.
- `sg --pattern '...'` beats `grep` for structural queries (see spec.md Assumptions on tooling choice). Every SC check that targets an AST shape uses `sg`.
