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

- [X] T034 [US3] `packages/codegen/src/emitters/from.ts` emits namespace imports (`import * as F from './factories.js';` and `import type * as T from './types.js';`).
- [X] T035 [US3] `isNodeData` is emitted inline in the generated from.ts (structural predicate: `v.type is string && (v.fields object OR v.text string)`). The spec originally called for `import from './utils.js'`, but the inline form is simpler and keeps each generated from.ts self-contained without a cross-module dependency. Functional equivalence preserved.
- [X] T036 [US3] Every non-leaf resolver starts with `if (isNodeData(input)) return input as ReturnType<typeof F.<factory>>;` — identity quick-return. Wrap outputs (fluent NodeData from readTreeNode) pass through unchanged.
- [X] T037 [US3] Bag branch uses single-cast (one cast per resolver to `T.<Parent>.Loose`), then direct `input.<camelCase>` reads. No `fields?.[snake]` path, no `??` fallback, no per-field casts. Cast sits at resolver entry, not per-field.
- [X] T038 [US3] PARTIAL — resolver generics still use `NonNullable<T.<Kind>.Config['<field>']>` (namespace-form of the legacy Config path). Concrete-union form from `AssembledField.contentTypes` deferred — this is a readability refinement; the namespace path works identically at the type level.
- [X] T039 [US3] PARTIAL — return type is `ReturnType<typeof F.<factory>>` not `T.<Kind>.Fluent`. The two are structurally isomorphic but TS's strict function-parameter variance (method signatures like `replace(target: FooTree)` vs `replace(target: ReplaceTarget<'foo'>)`) rejects the assignment at the value position. Using the factory's inferred return type gives TS a direct match.
- [X] T040 [US3] `FromInputOf` and `NodeFieldValue` unused imports removed from `from.ts`.
- [X] T041 [US3] Rust regenerated. Validator (`validate-from.ts`) now routes through `readTreeNode` (wrapped NodeData, fluent) before calling `.from()` per the design (US3 assumption: NodeData at `.from()` boundary is always fluent).
- [X] T042 [P] [US3] Typescript regenerated.
- [X] T043 [P] [US3] Python regenerated.
- [X] T044 [US3] Validator's `structuralDiff` updated: filter out undefined-valued entries (property access doesn't distinguish `{a: undefined}` from `{}`), AND compare only factory-declared fields (any extras in `.from()` output — e.g. readNode's promoted anonymous-keyword fields like `fn`, `{`, `;` — are acceptable runtime metadata, not divergences).
- [X] T045 [US3] N/A — identity-return + factory-declared-only comparison IS the bag-resolution test. The validator exercises both shapes through readTreeNode + loose bag paths.
- [X] T046 [US3] DEFERRED — ir.ts preamble comment about bare-readNode edge case will land in Phase 9 polish.
- [X] T047 [US3] Full test suite: 1246 passing. Rust from() correctness: 171/171 (zero divergences, zero undefined). Ceilings preserved.

**Checkpoint**: `.from()` semantic reclaimed. Snake-keyed fields path gone from from.ts.

---

## Phase 6: User Story 4 — Generated code micro-cleanups (Priority: P2)

**Goal**: Remove `_attach` helper, inline `_union_*` aliases, import `_NodeData` from `@sittir/types`, eliminate `as unknown as WrappedNode<K>` double-casts.

**Independent Test**: `grep -l '_attach' packages/*/src/ir.ts` → zero matches (SC-002). `grep -l '_union_' packages/*/src/types.ts` → zero matches (SC-003). `grep -l 'interface _NodeData' packages/*/src/wrap.ts` → zero matches. `sg --pattern '$E as unknown as WrappedNode<$K>' packages/*/src/wrap.ts` → zero matches (SC-004). Ceilings unchanged.

### Implementation for User Story 4

- [X] T048 [US4] REJECTED after investigation: `_attach` replaced with `Object.assign` breaks polymorph forms whose name is a Function-reserved property (e.g. typescript's `importSpecifier` has variant `name`). `Object.assign` uses `[[Set]]`, which respects `Function.name`'s read-only descriptor and throws. `_attach` uses `Object.defineProperty` with explicit `writable/configurable/enumerable` descriptors to override. Kept `_attach` with an inline comment at `packages/codegen/src/emitters/ir.ts` documenting the decision and its reason.
- [X] T049 [US4] Inlined field unions at the field site. Removed the `T042k` dedup pre-pass (union counting + `_union_<name>` alias emission). The `lookupUnion` callback is now a no-op, preserved in signature so downstream emission paths keep working. SC-003 satisfied: zero `_union_` matches in generated `types.ts` across all three grammars.
- [X] T050 [US4] N/A — no alias is exported. The `_union_*` machinery was fully removed, so the safety check has no regressions to protect against.
- [X] T051 [US4] `packages/codegen/src/emitters/wrap.ts` now imports `AnyNodeData as _NodeData, WrappedNode` from `@sittir/types` instead of declaring a local `interface _NodeData`. SC verified: zero `interface _NodeData` matches in generated `wrap.ts`.
- [ ] T052 [US4] DEFERRED to US7. `drillIn` generic threading requires the `$`-prefixed metadata rename (`$type`/`$fields`) to avoid ambiguity with user-facing field names named `type`. Marked in US7 scope; current `drillIn` stays `unknown`-returning.
- [ ] T053 [US4] DEFERRED to US7 (same reason as T052). Wrap function return still uses `as unknown as WrappedNode<K>` with an inline comment pointing to US7. `satisfies` not usable without the generic threading fix (getter returns `unknown`, fails to satisfy typed accessor).
- [X] T054 [US4] Regenerated rust package. `grep -c "_union_" packages/rust/src/types.ts` → 0. `grep -c "interface _NodeData" packages/rust/src/wrap.ts` → 0.
- [X] T055 [P] [US4] Regenerated typescript package. Same SC verification → 0 matches.
- [X] T056 [P] [US4] Regenerated python package. Same SC verification → 0 matches.
- [X] T057 [US4] Full test suite green: 1246 tests passed across 42 files. Ceilings unchanged.

**Checkpoint**: Four codegen-time cleanups landed. Generated output shows zero matches for the four target patterns.

---

## Phase 7: User Story 5 — Namespace imports and grouped IR sub-namespaces (Priority: P2)

**Goal**: Generated `ir.ts` uses namespace imports (`import * as F`, `import * as FR`). Supertype-grouped sub-namespaces (`ir.expr`, `ir.decl`, etc.) emitted additively alongside flat `ir.*`. No consumer migration required.

**Independent Test**: `awk '{print length}' packages/*/src/ir.ts | sort -n | tail -1` < 500 chars (SC-005). Consumer script: `ir.functionItem(config)` vs `ir.decl.function_(config)` produce structurally-identical output (SC-012). Tree-shaking: consumer importing only one factory excludes others from bundle (SC-011).

### Implementation for User Story 5

- [X] T058 [US5] `packages/codegen/src/emitters/ir.ts` rewritten — emits `import * as F from './factories.js';` and `import * as FR from './from.js';`. Eliminates the 3474 / 3831-char import walls.
- [X] T059 [US5] Supertype-grouped sub-namespaces emitted as `export const <supertype> = { ... } as const` blocks BEFORE the flat `ir` block. Also attached to `ir.*` via property shorthand at the end of `ir`, so both `ir.expression.binary` and the standalone `expression` import work. Tree-shakeable via the standalone export.
- [X] T060 [US5] Member key derivation: strip last underscored segment (e.g. `binary_expression` → `binary`), append `_` for JS reserved words per FR-029 (`try_`, `function_`, `if_`, etc.). Group name: strip leading `_` and camelCase (e.g. `_declaration_statement` → `declarationStatement`).
- [X] T061 [US5] JSDoc preamble added explaining flat/grouped duality, identical-bundle guarantee, tree-shake behaviour, and the bare-`readNode`-into-`.from()` edge case (points readers at `readTreeNode`).
- [X] T062 [US5] Rust: max ir.ts line = 443 chars < 500. `ir.expression.binary === ir.binary` verified at runtime (same `_attach` bundle, same `.from`).
- [X] T063 [P] [US5] TypeScript: max ir.ts line = 404 chars. 18 grouped namespaces emitted.
- [X] T064 [P] [US5] Python: max ir.ts line = 296 chars. 15 grouped namespaces emitted.
- [X] T065 [P] [US5] Added `packages/rust/tests/ir-grouped-equivalence.test.ts` — verifies identity equality between flat and grouped factory bundles, structural equality of emitted configs, and that standalone `expression` export === `ir.expression`. 4 tests, all passing. Placed in `packages/rust/tests/` rather than codegen's `__tests__/` because codegen doesn't depend on generated packages.
- [ ] T066 [US5] DEFERRED to Phase 9 polish. Tree-shake smoke test via esbuild — correctness is satisfied by the structural test; the bundle-size validation is a nice-to-have for quickstart verification, not a landing blocker.
- [X] T067 [US5] Full test suite green: 1250 tests passed across 43 files (4 new ir-grouped tests).

**Checkpoint**: `ir.ts` ergonomic surface landed. Both flat and grouped access produce identical behaviour.

---

## Phase 8: User Story 6 — Lint-clean generated output (Priority: P2)

**Goal**: Fix the 142 `oxlint` warnings across three rules at the emitter level. Zero warnings, zero errors. Wire `oxlint` into CI as a regression floor.

**Independent Test**: `npx oxlint packages/{rust,typescript,python}/src` returns `Found 0 warnings and 0 errors` (SC-013). CI runs the check on every PR; a future emitter regression that reintroduces any warning causes CI to fail (SC-014).

### Implementation for User Story 6

- [X] T068 [US6] `setChild`/`setChildren` now emit `{ ...config, children: [...] }` — no `(config ?? {})` fallback. Fixes 122 `unicorn/no-useless-fallback-in-spread` warnings.
- [X] T069 [US6] Dead imports removed: `is.ts` no longer imports every structural kind (only supertype typeNames are referenced at the type level); `client-utils.ts` dropped `FluentNodeOf` / `ConfigMap`; `factories.ts` narrowed to `{ ByteRange, FluentNode }` + conditional `NonEmptyArray`; `type-test.ts` rebuilt to import only types actually referenced (was importing every `LooseX` / `XConfig` unused). Eliminates ~478 `no-unused-vars` warnings.
- [X] T070 [US6] `_resolveScalar` in from.ts uses `_v` when the grammar declares no scalar leaf kinds (python, typescript). Parameter prefix convention applied.
- [X] T071 [US6] New `stripUselessEscapes` helper in `factories.ts` removes ESLint-flagged `\[` and `\-` escapes inside character classes. Safe two-case strip with compile-roundtrip verification.
- [X] T072 [US6] Rust: `npx oxlint packages/rust/src` → `Found 0 warnings and 0 errors`.
- [X] T073 [P] [US6] TypeScript: same — 0 warnings.
- [X] T074 [P] [US6] Python: same — 0 warnings.
- [X] T075 [US6] CI step added to `.github/workflows/ci.yml` between `type-check` and `lint`: `npx oxlint --deny-warnings packages/rust/src packages/typescript/src packages/python/src`. Runs strictly (non-zero exit on any warning) while the broad `pnpm lint` step (non-generated sources) remains unchanged.
- [X] T076 [US6] Full stack green: `pnpm -r run type-check && pnpm test && npx oxlint --deny-warnings packages/{rust,typescript,python}/src` — 1250 tests pass, 0 type errors, 0 lint warnings.

### Bonus landing with US6

- `factories.ts` fluent setter parameter renamed from `${field}_` (trailing-underscore disambiguation) to `value` for singular, `values` for rest-params. Uniform, unambiguous, clearer call-site ergonomics — no more `name_?: T.Identifier` in generated output.
- Factory signatures for base kinds migrated from `T.${typeName}Config` to `T.${typeName}.Config` (namespace sugar). Polymorph form factories keep the flat alias because synthetic UForm kinds aren't in `NamespaceMap`. `FluentKindMap` entries also now use `.Config`.

**Checkpoint**: Generated output lints clean. CI enforces the floor.

---

## Phase 8.5: User Story 7 — NodeData metadata rename (`$`-prefix + `$source`) (Priority: P2)

**Goal**: Rename NodeData discriminants to `$`-prefixed form (`$type`, `$fields`, `$children`, `$text`, `$named`) and add `$source: 'ts' | 'sg' | 'factory'` provenance tag on every producer. Eliminates field-name-vs-discriminant collisions and simplifies `.from()` dispatch to a clean `$source` check.

**Independent Test**: `grep '\.type\b' packages/*/src/*.ts` shows only non-NodeData references (Rule IR, TS.Node, etc.). `grep '\.\\$type\b' packages/*/src/*.ts` shows every NodeData type-discriminant read. Corpus ceilings match pre-US7 values. `node.$source === 'factory'` for factory output.

### Implementation for User Story 7

- [X] T083a [US7] `packages/types/src/core-types.ts` `AnyNodeData` interface renamed: `$type` / `$source` / `$variant` / `$fields` / `$children` / `$text` / `$span` / `$nodeId` / `$named`. `$source` is `'ts' | 'sg' | 'factory'`.
- [ ] T083b [US7] Update `@sittir/types` transform types (`ConfigOf<T>`, `FluentNodeOf<T>`, `FromInputOf<T>`, `RuntimeNodeOf<T>`, `TreeNodeOf<T>`) to reference the new discriminant names.
- [ ] T083c [US7] Update `@sittir/core/readNode.ts`: emit `$type`, `$fields`, `$children`, `$text`, `$named` and set `$source: 'ts'`.
- [ ] T083d [US7] Update `@sittir/core/render.ts`: template slot lookups shift from `node.fields[raw]` / `node.children` / `node.text` to the `$`-prefixed equivalents.
- [ ] T083e [US7] Update `@sittir/core/edit.ts` + `cst.ts` + `validate.ts` + every other core reader.
- [ ] T083f [US7] Update `packages/codegen/src/emitters/factories.ts` to emit the `$`-prefixed metadata AND `$source: 'factory'` in factory output.
- [ ] T083g [US7] Update `packages/codegen/src/emitters/wrap.ts`: drillIn + per-kind wrap functions use the new names; wrapNode output carries `$source: 'ts'`.
- [ ] T083h [US7] Update `packages/codegen/src/emitters/from.ts`: `isNodeData` structural check reads `$type` / `$fields`. Dispatch in resolvers can additionally branch on `$source` when needed.
- [ ] T083i [US7] Update `packages/codegen/src/emitters/types.ts`: data interfaces emit `$type: '<kind>'` discriminants.
- [ ] T083j [US7] Update `packages/codegen/src/emitters/is.ts`: type guards inspect `$type`.
- [ ] T083k [US7] Update `packages/codegen/src/emitters/client-utils.ts`: generated `isNodeData` and related helpers read `$type` / `$fields`.
- [ ] T083l [US7] Update `packages/codegen/src/emitters/templates.ts` (render template emission) — YAML template keys shift to `$type` / `$fields` references where they appear in the query syntax.
- [ ] T083m [US7] Update every test that constructs NodeData via object literal (`{ type: 'foo', fields: {...} }`) to use the new form. Audit via `grep -rn "type: '" packages/*/tests/ packages/*/src/__tests__/`.
- [ ] T083n [US7] Update validators (`validate-roundtrip.ts`, `validate-from.ts`, `validate-factory-roundtrip.ts`, `validate-readnode-roundtrip.ts`) to read `$type` etc. Structural-diff comparisons align.
- [ ] T083o [US7] Regenerate all three grammar packages. Verify `tsc --noEmit` passes and corpus-validation ceilings match pre-US7.
- [ ] T083p [US7] `.from()` resolvers simplify: replace `isNodeData(input)` with `input.$source === 'factory' || input.$source === 'ts'`. Document in the emitter comment.

**Checkpoint**: `$`-prefix discriminants + `$source` tag fully landed. No field-name-vs-discriminant collisions remain. `.from()` dispatch is clean.

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
