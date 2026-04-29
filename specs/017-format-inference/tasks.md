# Tasks: Format Inference (017)

**Branch**: `017-format-inference`
**Input**: `specs/017-format-inference/plan.md`, `spec.md`, `data-model.md`, `research.md`

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[US1]**: Parse-then-render reproduces source byte-for-byte (P1)
- **[US2]**: Edits preserve format outside the edited subtree (P1)
- **[US3]**: Native render path applies format identically to TS (P2)

---

## Phase 1: Setup

**Purpose**: Create test and fixture scaffolding needed by all user stories.

- [ ] T001 Create `tests/format-roundtrip/` directory with a `.gitkeep`; create `tests/format-roundtrip/fixtures/` with one placeholder fixture sub-directory per grammar (`rust/`, `typescript/`, `python/`)

---

## Phase 2: Foundational — Shared Types

**Purpose**: Define the `FormatRecord` type family in `@sittir/types`. All user stories depend on these types being in place before any implementation starts.

> **Naming conflict**: `RenderContext.format` is currently typed as `(source: string) => string | Promise<string>` (an external post-processing hook). The 017 design adds `format?: FormatRecord` to `RenderContext`. T004 renames the existing hook to `postFormatter?` to free the name.

- [ ] T002 Add `FormatBoundary`, `FormatSlot`, `FormatLiteral`, `FormatTrivia`, and `FormatRecord` interfaces (with `kinds?: Record<string, FormatRecord>`) to `packages/types/src/core-types.ts`; add `$format?: FormatRecord` to `AnyNodeData` (FR-001, FR-008)
- [ ] T003 [P] Export all new format types from `packages/types/src/index.ts`; add re-export to `packages/core/src/types.ts`
- [ ] T004 In `packages/types/src/core-types.ts`: rename existing `RenderContext.format?: (source: string) => string | Promise<string>` to `postFormatter?`; add `format?: FormatRecord` and `ignoreFormat?: boolean` (FR-003, FR-010)
- [ ] T005 Add `format?: FormatRecord` to `TreeHandle` in `packages/core/src/readNode.ts` — one record per parsed tree, populated only by the Rust extractor (FR-002)
- [ ] T006 Run `pnpm -r run type-check` to confirm zero type errors after foundational type additions; fix any type breakage from the `postFormatter` rename in `packages/core/src/render.ts` (the `ctx.format` hook call site)

---

## Phase 3: US1 — Parse-then-render byte-equal roundtrip (P1)

**Story goal**: `render(nativeReadNode(parse(source))) === source` byte-for-byte.

**Independent test**: Pick one non-canonical fixture per grammar, parse via native reader, render with JS engine, assert byte-equal to source.

### JS Applier

- [ ] T007 [US1] Create `packages/core/src/format.ts` — implement `applyFormat(canonical: string, format: FormatRecord): string`; handle `boundary`, `slots`, `literals`, `trivia` subfields; export from `packages/core/src/index.ts`
- [ ] T008 [US1] Wire format resolution into `render()` in `packages/core/src/render.ts` — after `prepare()`, before template selection; lookup order: `ctx.ignoreFormat ? undefined : node.$format ?? ctx.format?.kinds?.[node.$type] ?? ctx.format`; when a `FormatRecord` is found, call `applyFormat(canonicalRender, record)` and return early (FR-003, FR-007)

### Rust Types

- [ ] T009 [P] [US1] Add Rust mirror of `FormatRecord` and sub-structs (`FormatBoundary`, `FormatSlot`, `FormatLiteral`, `FormatTrivia`) with `serde::{Serialize, Deserialize}` + `kinds: Option<HashMap<String, FormatRecord>>` to `rust/crates/sittir-core/src/types.rs`; keep in sync with `@sittir/types` shape (FR-008)

### Rust Extractor

- [ ] T010 [US1] Create `rust/crates/sittir-core/src/format.rs` — implement `extract_format(source: &str, tree: &tree_sitter::Tree) -> Option<FormatRecord>`; single tree-walk producing a consensus `FormatRecord`; return `None` when source is already template-canonical (FR-002, FR-007, SC-005)
- [ ] T011 [US1] Declare `pub mod format;` in `rust/crates/sittir-core/src/lib.rs`; ensure `extract_format` is pub-exported from the crate
- [ ] T012 [US1] Wire `extract_format` into `parse_and_read` in `rust/crates/sittir-rust-napi/src/lib.rs` — after the tree-sitter parse, call `sittir_core::format::extract_format(&source, &tree)`, serialise the result alongside `NodeData`; update the napi method return type to carry `format: Option<FormatRecord>` alongside the root `NodeData`
- [ ] T013 [P] [US1] Apply the same `extract_format` wiring to `rust/crates/sittir-typescript-napi/src/lib.rs` (mirrors T012 for the TypeScript grammar)
- [ ] T014 [P] [US1] Apply the same `extract_format` wiring to `rust/crates/sittir-python-napi/src/lib.rs` (mirrors T012 for the Python grammar)

### JS Bridge — populate TreeHandle.format

- [ ] T015 [US1] Update the JS native-engine bridge (wherever `SittirEngine.parse_and_read` result is deserialised into a `TreeHandle`) to read the `format` field from the napi response and set `treeHandle.format = result.format ?? undefined`; update the acceptance-test harness helper that constructs `TreeHandle` from native output

### Corpus Fixtures and Acceptance Tests

- [ ] T016 [P] [US1] Add at least one non-canonical Rust fixture to `tests/format-roundtrip/fixtures/rust/` — a `.rs` source file with tab-indentation and trailing commas in struct literals; add its entry to `specs/017-format-inference/format-corpus.json` (FR-012)
- [ ] T017 [P] [US1] Add at least one non-canonical TypeScript fixture to `tests/format-roundtrip/fixtures/typescript/` — a `.ts` source file with omitted semicolons on some statements; add its entry to `specs/017-format-inference/format-corpus.json`
- [ ] T018 [P] [US1] Add at least one non-canonical Python fixture to `tests/format-roundtrip/fixtures/python/` — a `.py` source file with leading `#` comments and blank-line-separated functions; add its entry to `specs/017-format-inference/format-corpus.json`
- [ ] T019 [US1] Populate `specs/017-format-inference/format-corpus.json` with the full fixture manifest (FR-012); each entry must carry: `grammar`, `fixture`, `formatCategory`, `seedSource` (`"017-measured"` or `"016-deferred"`), `expectedBackendCoverage` (`"typescript-only"` or `"both"`)
- [ ] T020 [P] [US1] Create `tests/format-roundtrip/rust.test.ts` — for each `grammar: "rust"` fixture in `format-corpus.json`: parse via native reader, set `treeHandle.format`, render with JS engine, assert result equals fixture source byte-for-byte (SC-001)
- [ ] T021 [P] [US1] Create `tests/format-roundtrip/typescript.test.ts` — same pattern as T020 for TypeScript grammar fixtures
- [ ] T022 [P] [US1] Create `tests/format-roundtrip/python.test.ts` — same pattern as T020 for Python grammar fixtures
- [ ] T023 [US1] Add a JSON roundtrip test for `FormatRecord` to an appropriate test file — `JSON.parse(JSON.stringify(record))` must produce a structurally identical record; no custom reviver (FR-011)
- [ ] T024 [US1] Run `pnpm test` and confirm SC-001 (100 % of corpus fixtures byte-equal under TS backend) and SC-004 (zero 016 regression) both pass; fix any failures before marking this phase done

---

## Phase 4: US2 — Edits preserve format outside the edited subtree (P1)

**Story goal**: After applying `Edit[]`, the rendered diff is isolated to the edited byte range; every byte outside that range is identical to the original source.

**Independent test**: Apply a single targeted edit to each US1 fixture; compute the byte diff; assert every hunk lies entirely inside the edited span.

- [ ] T025 [US2] Add `rebaseTrivia(format: FormatRecord, editStart: number, delta: number): FormatRecord` to `packages/core/src/format.ts` — shifts all `FormatTrivia.offset` values whose absolute positions cross `editStart` by `delta` bytes; leaves offsets below `editStart` untouched; returns a shallow-cloned record (FR-004)
- [ ] T026 [US2] Update the Edit application helper in `packages/core/src/edit.ts` (or wherever batched `Edit[]` are applied) to carry `treeHandle.format` to the post-edit result — call `rebaseTrivia` for each edit in the batch, accumulating the resulting `FormatRecord` on the new handle (FR-004)
- [ ] T027 [US2] Add US2 edit tests to each grammar's roundtrip test file (`tests/format-roundtrip/{rust,typescript,python}.test.ts`) — apply a single-identifier rename on one line, render, compute diff, assert diff hunks are within the edited span
- [ ] T028 [US2] Run `pnpm test` confirming all US2 assertions pass and no US1 tests regress

---

## Phase 5: US3 — Native render path applies format identically (P2)

**Story goal**: Under `SITTIR_BACKEND=native`, rendered output is byte-equal to the TS engine output for any fixture with `expectedBackendCoverage: "both"`.

**Independent test**: Run corpus fixtures tagged `"both"` through native render; compare output to TS render; assert byte-equal.

- [ ] T029 [P] [US3] Implement `apply_format(canonical: &str, format: &FormatRecord) -> String` in `rust/crates/sittir-core/src/format.rs` — mirrors `packages/core/src/format.ts`'s `applyFormat`; handles `boundary`, `slots`, `literals`, `trivia` (FR-005, FR-007)
- [ ] T030 [US3] Wire `apply_format` into the Rust render path: in `render()` in `rust/crates/sittir-rust-napi/src/lib.rs` (or the grammar-agnostic render dispatch in `sittir-core/src/prepare.rs`), check for a `format` field on the incoming `NodeData` context and call `apply_format(canonical_render, format)` when present; skip when `ignoreFormat` is set (FR-005)
- [ ] T031 [P] [US3] Apply the same `apply_format` wiring to the TypeScript grammar napi render path at `rust/crates/sittir-typescript-napi/src/lib.rs`
- [ ] T032 [P] [US3] Apply the same `apply_format` wiring to the Python grammar napi render path at `rust/crates/sittir-python-napi/src/lib.rs`
- [ ] T033 [US3] Add backend parity assertions to `tests/format-roundtrip/{rust,typescript,python}.test.ts` — for every fixture with `expectedBackendCoverage: "both"`, run under `SITTIR_BACKEND=native` and assert output bytes equal the TS-engine output for the same fixture (SC-003)
- [ ] T034 [US3] Run `pnpm test` confirming SC-003 (TS/native byte-equal on "both" fixtures) and no regressions on SC-001, SC-004

---

## Final Phase: Polish & Cross-Cutting Concerns

- [ ] T035 [P] Fix stale API reference in `specs/017-format-inference/quickstart.md` — replace all uses of `readNode(tree.handle, undefined, source)` with the correct `treeHandle.format`-based usage pattern showing how a caller populates `ctx.format` from the native-produced `treeHandle.format`
- [ ] T036 [P] Fix missing `## Decision 6:` heading in `specs/017-format-inference/research.md` — add `## Decision 6: JS readNode signature — unchanged` before the existing rationale text
- [ ] T037 Run `pnpm -r run type-check` — zero type errors
- [ ] T038 Run `pnpm test` — confirm SC-001 (all corpus fixtures byte-equal, TS), SC-003 (TS/native parity on "both" fixtures), SC-004 (zero 016 regressions); fix any residual failures
- [ ] T039 Run `pnpm run lint` — zero new lint errors introduced by 017

---

## Dependencies

```
T002 → T003, T004, T005
T003 → T006
T004 → T006, T008
T005 → T015
T006 → T007, T008
T007 → T008
T007 → T025
T008 → T020, T021, T022, T023
T009 → T010, T029
T010 → T011
T011 → T012, T013, T014
T012 → T015
T013 → T015
T014 → T015
T015 → T020, T021, T022
T016 → T019
T017 → T019
T018 → T019
T019 → T020, T021, T022
T020 → T024
T021 → T024
T022 → T024
T023 → T024
T025 → T026
T026 → T027
T027 → T028
T029 → T030, T031, T032
T030 → T033
T031 → T033
T032 → T033
T033 → T034
T024 → T037, T038
T028 → T037, T038
T034 → T037, T038
```

## Parallel Execution Examples

### US1 — once T007 (JS applier) and T011 (Rust extractor exported) are done:

```
T009  ──────────────────────────────────────────────────── (Rust types)
T012  (rust napi) ─┐
T013  (ts napi)   ─┤──→ T015 (bridge) → T020, T021, T022
T014  (py napi)   ─┘
T016  (rust fixture) ─┐
T017  (ts fixture)   ─┤──→ T019 (corpus manifest)
T018  (py fixture)   ─┘
T020  (rust test) ─┐
T021  (ts test)   ─┤──→ T024 (verify)
T022  (py test)   ─┘
```

### US3 — once T029 (apply_format) is done:

```
T030  (rust render wiring)  ─┐
T031  (ts render wiring)    ─┤──→ T033 (parity assertion) → T034
T032  (py render wiring)    ─┘
```

## Implementation Strategy

**MVP scope (US1 only)**: T001–T006 (types), T007–T008 (JS applier), T009–T015 (Rust extractor + bridge), T016–T024 (one fixture per grammar + tests). Delivers parse-render byte-equal roundtrip on the native read path.

**US2** (edit preservation) is the second P1 story and blocks the codemod use case. Add after US1 passes.

**US3** (native render parity) is P2 — no new user capability, ensures backend consistency. Add last once US1+US2 are stable.
