---

description: "Task list for feature 012 — Rust Port of @sittir/core"
---

# Tasks: Rust Port of `@sittir/core`

**Input**: Design documents from `/specs/012-rust-core-port/`
**Prerequisites**: plan.md, spec.md (required); research.md, data-model.md, contracts/, quickstart.md (loaded)

**Tests**: INCLUDED. Driven by Constitution Principle IV (test-first, generated tests ship with generated code) and by FR-012 (shared parity fixture suite is the load-bearing correctness gate).

**MVP scope**: **User Story 1 only.** US2 (crate publication) and US3 (WASM) are deferred per clarify Q1 Approach A — they become separate future features and have **no tasks in this MVP task list**.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallelizable — different file, no dependency on an incomplete task above it
- **[US1]**: Belongs to the one in-scope user story (MVP)
- Every task names its exact file path

## Path Conventions

- **Rust workspace root**: `/rust/` (sibling of `/packages/`)
- **Hand-written Rust**: `rust/crates/{crate-name}/src/`
- **Generated Rust (per-grammar)**: `packages/{lang}/rust-render/src/` (pointed at from the workspace manifest)
- **TS runtime shim (per-grammar)**: `packages/{lang}/src/backend.ts`, `packages/{lang}/src/hash.ts`
- **Codegen emitters**: `packages/codegen/src/emitters/`
- **Parity harness**: `rust/tests/parity/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the Rust workspace, wire it into CI, and confirm the round-trip-ceilings-at-zero prereq (FR-014) before any engine work begins.

- [X] T001 Verify FR-014 prereq: confirm the corpus-validation pinning test (`pnpm -F @sittir/codegen test -- corpus-validation`) passes with FLOORS meeting the completion signal defined in [r1-ceilings-plan.md](./r1-ceilings-plan.md) §"Completion signal" — `factoryPass/fromPass ≥ legacy baseline` for each grammar, `factoryAstMatchPass ≥ factoryPass − 2`, `rtPass ≥ rtTotal − 10`, and no test-skip/expect-fail workarounds. If not met, execute the cluster-close loop in r1-ceilings-plan.md before proceeding to T002. Per FR-014, implementation MUST NOT begin until this gate passes.
- [X] T002 Create Rust workspace root at `/rust/Cargo.toml` with `[workspace]` `members = ["crates/sittir-core", "crates/sittir-rust-napi", "crates/sittir-typescript-napi", "crates/sittir-python-napi", "../packages/rust/rust-render", "../packages/typescript/rust-render", "../packages/python/rust-render"]` and `resolver = "2"`.
- [X] T003 Create hand-written `sittir-core` crate skeleton at `rust/crates/sittir-core/Cargo.toml` with deps `serde = { version = "1", features = ["derive"] }`, `serde_json = "1"`, `tree-sitter = "0.24"`, `ast-grep-core = "0.x"`, `sha2 = "0.10"`, `askama = "0.14"`. Include a `rust/crates/sittir-core/src/lib.rs` with empty module declarations (`types`, `read_node`, `prepare`, `splice`, `boundary`, `filters`).
- [X] T004 [P] Create three napi-binding crate skeletons at `rust/crates/sittir-rust-napi/`, `rust/crates/sittir-typescript-napi/`, `rust/crates/sittir-python-napi/`. Each has a `Cargo.toml` depending on `sittir-core` + `napi` + `napi-derive` + the matching `tree-sitter-{lang}` crate, plus a `src/lib.rs` stub and a `build.rs` using `napi-build`.
- [X] T005 [P] Create three generated render-crate stubs at `packages/rust/rust-render/Cargo.toml`, `packages/typescript/rust-render/Cargo.toml`, `packages/python/rust-render/Cargo.toml`. Each declares `[package]` metadata + `sittir-core` + `askama` deps + a `src/lib.rs` with placeholder `pub fn render_dispatch(_kind: &str, _ctx: &sittir_core::prepare::TemplateContext) -> Result<String, askama::Error> { unimplemented!() }` — codegen will overwrite `src/` later.
- [X] T006 [P] Add `@napi-rs/cli` as a devDependency to the workspace root `package.json` and create `packages/rust/package.json` optional peer dep entry for `@sittir/rust-native`. Repeat skeleton for `packages/typescript/package.json` and `packages/python/package.json`.
- [X] T007 [P] Add a Rust jobs stub to `.github/workflows/ci.yml`: a single `cargo check --workspace` job on `ubuntu-22.04` that runs after the existing TS jobs. Platform-matrix expansion comes in Phase 4.
- [X] T008 Verify the skeleton compiles: `cd rust && cargo check --workspace` exits 0. Creates a baseline that subsequent phases diff against.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types, boundary serde, shared filters, template-bundle hash mechanism, codegen-emitter scaffolding, and JS-side runtime-selection module. Every US1 task depends on these.

**⚠️ CRITICAL**: No US1 work can begin until Phase 2 is complete.

- [X] T009 Implement Rust primitive NodeData + FieldValue + Span + Source enums in `rust/crates/sittir-core/src/types.rs`. Matches data-model.md §1 exactly: 8 `$`-prefixed fields with serde renames; `FieldValue` untagged enum with `Single`/`Multiple`/`Text`; `Span` with `start`/`end` u32; `Source` as `rename_all = "lowercase"` enum (Ts/Sg/Factory).
- [X] T010 [P] Implement `Edit` type with `#[napi(object)]` derive in `rust/crates/sittir-core/src/types.rs`. Fields: `start_pos: u32`, `end_pos: u32`, `inserted_text: String`. Produces camelCase JS-side shape per contracts/napi-api.md.
- [X] T011 [P] Implement serde rename + elision invariants (test, not prod code — the attributes live on the structs in T009) in `rust/crates/sittir-core/tests/boundary_roundtrip.rs`. Round-trips a NodeData through `serde_json::to_string` → `from_str` and verifies absent optionals stay absent, present optionals survive, field order is deterministic (alphabetical after the required trio).
- [X] T012 [P] Implement shared filter module in `rust/crates/sittir-core/src/filters.rs` with functions `upper(s: &str) -> Result<String, askama::Error>`, `lower(s: &str) -> Result<String, askama::Error>`, and the load-bearing `joinby(xs: &[String], sep: &str, leading: bool, trailing: bool) -> Result<String, askama::Error>` that mirrors the TS `@sittir/core` joinby semantics (spec 011).
- [X] T013 [P] Write filter-parity unit tests in `rust/crates/sittir-core/tests/filters.rs` — table-driven test asserting `upper`/`lower` match TS `toUpperCase`/`toLowerCase`, and that `joinby` produces identical output to the TS implementation on a hand-curated set of inputs (leading/trailing/position-aware cases).
- [X] T014 Add SHA-256 template-bundle hash computation in `packages/codegen/src/emitters/template-hash.ts`. Takes the grammar's `.jinja` file list, sorts by filename, concatenates `{filename}\0{content_LF_normalized}\0` pairs, returns SHA-256 hex string. Pure function — testable standalone.
- [X] T015 [P] Unit-test the hash function in `packages/codegen/src/emitters/template-hash.test.ts` — asserts stability across file order perturbations, LF vs CRLF normalization, and that edits change the hash.
- [X] T016 Emit `hash.rs` + `hash.ts` from the render-crate emitter in `packages/codegen/src/emitters/rust-render.ts` (scaffold the file; T022 fills in the rest). For now, implement just the hash emission: `pub const TEMPLATE_BUNDLE_HASH: &str = "..."` into `packages/{lang}/rust-render/src/hash.rs` and `export const TEMPLATE_BUNDLE_HASH = "..."` into `packages/{lang}/src/hash.ts`. Depends on T014.
- [X] T017 [P] Add `--rust-render` CLI flag handling in `packages/codegen/src/cli.ts`. When set, invoke the rust-render emitter (T016 scaffold + subsequent Phase 3 fills) alongside the existing TS emitter.
- [X] T018 [P] Create the JS-side backend-selection module skeleton at `packages/rust/src/backend.ts` — exports `BackendName`, `BackendStatus`, `getActiveBackend()` with a placeholder body returning `{ name: "typescript", reason: "not yet implemented" }`. Module-local cache pattern from contracts/backend-selection.md. Freeze the returned object.
- [X] T019 [P] Propagate the backend-selection skeleton to `packages/typescript/src/backend.ts` and `packages/python/src/backend.ts` (exact copy-paste; differs only in package identity strings in log lines).
- [X] T020 [P] Re-export `getActiveBackend` and types from `packages/rust/src/index.ts`, `packages/typescript/src/index.ts`, `packages/python/src/index.ts`. Additive — does not break existing exports.
- [X] T021 Verify Phase 2 skeleton: `cd rust && cargo test -p sittir-core` passes all filter + boundary tests; `pnpm -r run type-check` passes with the new backend modules; `SITTIR_BACKEND_DEBUG=1 node -e "require('@sittir/rust').getActiveBackend()"` logs once to stderr with `backend = typescript, reason = not yet implemented`.

**Checkpoint**: Foundation ready. Rust core crate compiles standalone (FR-004 established); hash mechanism wired end-to-end; JS backend module plumbed though always falling through. Phase 3 can now begin.

---

## Phase 3: User Story 1 — Codemod author runs a large codemod in Node without behavior change (Priority: P1) 🎯 MVP

**Goal**: a Node.js codemod script using the existing sittir TS API transparently uses the Rust engine when native is available, produces output byte-identical (render) or semantically equivalent (round-trip) to the TS baseline, and finishes in less wall-clock time.

**Independent Test**: Run an existing sittir codemod suite against a fixed corpus twice — once with native enabled, once `SITTIR_BACKEND=typescript` forced — verify (a) parity bars per FR-002a/b and (b) strictly-lower wall-clock on the native run.

### Rust core implementation (US1)

- [X] T022 [US1] Implement `readNode` tree traversal in `rust/crates/sittir-core/src/read_node.rs` — produces a primitive `NodeData` with exactly the 8 `$`-prefixed fields enumerated in FR-005a (no others; verified by the SC-007 shape gate in T062) from a `tree_sitter::Tree` + source string. Sets `$source: "ts"`, preserves `$named`, populates `$fields` via `field_name_for_child()`, populates `$children` for non-field children, sets `$text` on leaves, `$span` from `node.byte_range()`, assigns `$nodeId` from the engine's `next_node_id` counter (per data-model.md §4: reset per `find_and_read`, per-engine monotonic). NO enrichment (no `$variant`, no keyword promotion, no supertype inference — those stay in TS).
- [X] T023 [P] [US1] Implement `prepare::build_template_context<M: GrammarMeta>(node: &NodeData, meta: &M) -> TemplateContext` in `rust/crates/sittir-core/src/prepare.rs`. `GrammarMeta` is defined in data-model.md §2 as a trait on `sittir-core::prepare` with methods `separator_for`, `variant_for`, `is_list_container`; the per-grammar render crate emits a unit struct implementing it. The function walks the NodeData, recursively renders each field/child via `render_dispatch` (forward-declared; wired in T027), consults `meta.separator_for(parent_kind)` for list-container separator, consults `meta.variant_for(parent_kind, child_kind)` for FR-011 exception-rule variant labels, and populates all TemplateContext fields per contracts/template-context.md.
- [X] T024 [P] [US1] Implement `splice::apply_edits(source: &str, edits: Vec<Edit>) -> Result<String>` in `rust/crates/sittir-core/src/splice.rs`. Sorts edits by `start_pos` descending, applies each as a byte-level splice on a `String`, returns the modified source. Validates `start_pos <= end_pos <= source.len()`; does NOT detect overlap (documented consumer responsibility per contracts/napi-api.md).
- [X] T025 [P] [US1] Write readNode unit tests in `rust/crates/sittir-core/tests/read_node.rs` — parse a hand-written small source per grammar, read each top-level node, assert the emitted NodeData has exactly the 8 allowed fields and no others (SC-007 shape gate).
- [X] T026 [P] [US1] Write splice unit tests in `rust/crates/sittir-core/tests/splice.rs` — table-driven cases for single edit, multiple non-overlapping edits, edge cases (start==end insert, end==source.len append, whole-source replace).

### Codegen emitter for render dispatch (US1)

- [X] T027 [US1] Implement the per-kind askama-struct emitter in `packages/codegen/src/emitters/rust-render.ts`. For each kind in `node-model.json5`, emit a `#[derive(Template)] #[template(path = "{kind}.jinja", escape = "none")]` struct with typed fields matching the grammar's field names plus shared positional fields (`children: String`, `children_list: Vec<String>`, `variant: String`, `text: String`, `trailing_sep: bool`, `leading_sep: bool`). Write to `packages/{lang}/rust-render/src/templates.rs`. **Prepend the standard generated-file header comment** (Constitution Principle III): `// @generated from packages/{lang}/node-model.json5 and packages/{lang}/templates/*.jinja — do not hand-edit. Regenerate via: npx tsx packages/codegen/src/cli.ts --grammar {lang} --all --rust-render`. Also emit the per-grammar `GrammarMeta` unit struct + `impl GrammarMeta` block (separator_for / variant_for / is_list_container tables) sourced from the same node-model metadata.
- [X] T028 [US1] Emit the `render_dispatch(kind: &str, ctx: &TemplateContext) -> Result<String, askama::Error>` function in `packages/{lang}/rust-render/src/templates.rs` — one `match kind` arm per kind that constructs the per-kind struct from `TemplateContext` and calls `.render()`. Depends on T027.
- [X] T029 [US1] Emit custom-filter references alongside the templates emission: generated templates.rs imports `sittir_core::filters::{upper, lower, joinby}` and annotates each per-kind struct with `#[template(…)]` attribute referencing the filter module per askama conventions.
- [X] T030 [US1] Add `.jinja` file copying to the render-crate emitter: `packages/{lang}/templates/*.jinja` is copied into `packages/{lang}/rust-render/templates/` at each codegen run so askama's build-time `#[template(path = ...)]` can resolve them. Template authorship remains in `packages/{lang}/templates/` (single source of truth per FR-003).
- [X] T031 [US1] Emit the render-crate `Cargo.toml` with full deps (askama, sittir-core, serde) from the emitter. Overwrite the T005 stub.
- [X] T032 [US1] Regenerate all three grammars: `pnpm -r exec npx tsx packages/codegen/src/cli.ts --grammar $G --all --rust-render` for G ∈ {rust, typescript, python}. Run `cd rust && cargo build --workspace` and expect clean compile — any askama error here is a codegen bug (template references a variable not on the struct).

### napi binding per grammar (US1)

- [X] T033 [P] [US1] Implement `SittirEngine` in `rust/crates/sittir-rust-napi/src/lib.rs` per data-model.md §4 and contracts/napi-api.md: `#[napi]` struct holding `tree_sitter::Parser`, `Option<String>` source, `Option<tree_sitter::Tree>`. Methods: `new()`, `template_bundle_hash` getter, `find_and_read(source, pattern)`, `read_node(node_id)`, `render(node_json)`, `apply_edits(source, edits)`. Delegates all heavy lifting to `sittir_core` + `sittir_rust_render`.
- [X] T034 [P] [US1] Implement `SittirEngine` in `rust/crates/sittir-typescript-napi/src/lib.rs` (exact clone of T033, differs only in imports: `tree_sitter_typescript::LANGUAGE_TYPESCRIPT` + `sittir_typescript_render::render_dispatch`).
- [X] T035 [P] [US1] Implement `SittirEngine` in `rust/crates/sittir-python-napi/src/lib.rs` (exact clone, Python grammar).
- [X] T036 [P] [US1] Add napi `.node` build + package.json scaffolding for `@sittir/rust-native` at `rust/crates/sittir-rust-napi/package.json` + `build.rs` — `napi-build::setup()`. Creates the npm package shell.
- [X] T037 [P] [US1] Repeat the `@sittir/typescript-native` package shell at `rust/crates/sittir-typescript-napi/package.json`.
- [X] T038 [P] [US1] Repeat the `@sittir/python-native` package shell at `rust/crates/sittir-python-napi/package.json`.

### JS-side runtime selection wiring (US1)

- [X] T039 [US1] Implement the real runtime-selection algorithm in `packages/rust/src/backend.ts` per contracts/backend-selection.md: try `require('@sittir/rust-native')`; on success, compare `engine.templateBundleHash` vs. imported `TEMPLATE_BUNDLE_HASH` from `./hash.ts`; set status; `SITTIR_BACKEND_DEBUG` env-var nudge emits one stderr line; cache the singleton. Overwrites T018 stub.
- [X] T040 [US1] Propagate the real selection algorithm to `packages/typescript/src/backend.ts` and `packages/python/src/backend.ts` — same logic, different package IDs in log messages and require paths.
- [X] T041 [US1] Route `findMatches`, `readNode`, `render`, and splice paths through the backend shim in `packages/rust/src/index.ts` — each export checks `getActiveBackend().name` and dispatches to the native engine (via the boundary shim) or the TS engine. Consumer-facing signatures unchanged (FR-006).
- [X] T042 [US1] Propagate the index.ts routing changes to `packages/typescript/src/index.ts` and `packages/python/src/index.ts`.
- [X] T043 [P] [US1] Add `SITTIR_BACKEND` forced-selection env-var handling (documented as non-normative in contracts/backend-selection.md) in `packages/rust/src/backend.ts`: `typescript` skips the native load, `native` disables the fallback and throws loudly. Useful for CI parity diffing in Phase 4.
- [X] T044 [US1] Propagate `SITTIR_BACKEND` override to the other two grammar packages.

### Parity fixture extraction + harness (US1, FR-012)

- [X] T045 [US1] Implement the parity-fixture extractor in `packages/codegen/src/emitters/parity-fixtures.ts`. Hooks into the existing round-trip validator corpus — **first step is to inspect the current validator implementation** (`packages/codegen/src/` round-trip validator) to determine whether it persists an emittable corpus or runs entirely in-memory. If in-memory, instrument the validator to expose its input/output pairs as a stream or returned collection (see T045a). Once accessible: for each validator input/output pair, emit a `RenderFixture` record (NodeData + expected rendered string) and a `RoundTripFixture` record (source + pattern + edits + expected source + expected re-parse tree serialized as `Tree.rootNode.toString()` s-expression per data-model.md §6) to `packages/{lang}/rust-render/test-fixtures.json`. **Assert that the emitted corpus contains at least one fixture each for the three FR-011 exception kinds** per their matching grammar — `rust/visibility_modifier` in the rust corpus, `typescript/export_statement` and `typescript/call_expression` in the typescript corpus — and fail the build if absent.
- [X] T045a [US1] IF T045 inspection finds the round-trip validator is in-memory-only (likely), add a validator-instrumentation commit that exposes its input/output pairs via a public API in the validator module. This is the "validator promotion" sub-task flagged by analysis finding U4. Executed only if needed; skip otherwise.
- [X] T046 [US1] Wire fixture extraction into the `--rust-render` codegen flow from T017. Each codegen run regenerates fixtures; fixture regen is NOT optional.
- [X] T047 [P] [US1] Implement the Rust-side parity harness in `rust/tests/parity/main.rs`. Loads each grammar's `test-fixtures.json`, runs the Rust engine over `RenderFixture.input` (SC-001a byte-identical) and `RoundTripFixture` full pipeline (SC-001b semantic), diffs outputs, fails the test on any divergence with the fixture ID + expected/actual diff.
- [X] T048 [P] [US1] Implement the TS-side parity sanity check at `packages/rust/tests/parity.test.ts`, `packages/typescript/tests/parity.test.ts`, `packages/python/tests/parity.test.ts`. Loads the same fixture JSON, runs the TS engine, confirms it reproduces the `expectedOutput` / `expectedSourceOut` — catches fixture-generator bugs without involving Rust.
- [X] T049 [US1] Add a CI job `cargo test -p sittir-parity-tests` that runs T047. Configured to fail the build on any fixture divergence. SC-001a and SC-001b are gated here.

### End-to-end acceptance (US1)

- [X] T050 [US1] Write an acceptance integration test at `tests/acceptance/us1-codemod.test.ts` that models an existing sittir codemod: loads a 50-file sample corpus, pattern-matches, constructs edits via factories, writes modified files. Asserts `getActiveBackend().name === "native"` (assuming platform is in the matrix) and that output files match a baseline captured with `SITTIR_BACKEND=typescript`. Corresponds to US1 Acceptance Scenario 1.
- [X] T051 [US1] Add a second acceptance test variant forcing `SITTIR_BACKEND=typescript` — asserts the codemod produces **identical** output files (byte-identical at the file level — stronger than the render-only parity bar because TS is the reference on both sides of this comparison). Corresponds to US1 Acceptance Scenario 2 (silent fallback path).
- [X] T052 [US1] Verify the template-hash-mismatch fallback path: write a test that intentionally modifies the baked Rust hash (or the TS-side exported hash), reloads the module, asserts `getActiveBackend().name === "typescript"` with `reason` containing "hash mismatch" and `hashMatch === false`.

**Checkpoint**: US1 is functional. Native backend loads on at least one platform (whichever the developer's machine is). Parity suite passes with zero divergence. An existing codemod runs end-to-end on native and produces byte-identical-at-the-file-level output to a TS-baseline run.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Complete the MVP release: platform-matrix CI, benchmarks, documentation, and spec-success-criteria verification gates.

### CI platform matrix (per FR-017 + SC-006)

- [X] T053 [P] Add macOS arm64 + macOS x64 jobs to `.github/workflows/ci.yml` running `@napi-rs/cli build` + `cargo test --workspace` + the parity suite. Produces `.node` artifacts per grammar.
- [X] T054 [P] Add Linux x64 glibc + Linux x64 musl jobs (musl uses `napi-rs/setup-node-and-napi@v3` with `target: x86_64-unknown-linux-musl`).
- [X] T055 [P] Add Linux arm64 glibc + Linux arm64 musl jobs via cross-compilation (`aarch64-unknown-linux-gnu` / `aarch64-unknown-linux-musl`).
- [X] T056 [P] Add Windows x64 job on `windows-2022`.
- [X] T057 Wire release automation in `.github/workflows/release.yml` to run `@napi-rs/cli artifacts` + publish platform subpackages (`@sittir/rust-native-darwin-arm64`, etc.) per research R8.

### Benchmarks (per SC-003 + research R9)

- [X] T058 [P] Micro-benchmark at `rust/crates/sittir-core/benches/render.rs` using `criterion` — measures per-kind render time on synthetic NodeData across the largest-surface-area kinds per grammar. Baseline for intra-Rust regression detection.
- [X] T059 [P] Macro-benchmark script at `scripts/bench-codemod.sh` that runs a fixed codemod against a fixed corpus twice (once `SITTIR_BACKEND=native`, once `=typescript`) and reports wall-clock delta. Exit 0 only if native is strictly lower (SC-003 automation).

### Spec success-criteria verification gates

- [X] T060 [P] SC-001a + SC-001b gate: T049 already enforces; add a post-merge status check that surfaces parity counts in PR comments for visibility.
- [X] T061 [P] SC-006 gate (platform coverage): ensure every platform job in Phase 4 CI matrix runs the parity suite, not just cargo check. Failure on any platform blocks release.
- [X] T062 [P] SC-007 gate (primitive shape): add a test in `rust/crates/sittir-core/tests/wire_shape.rs` that serializes a complex NodeData and asserts the JSON has exactly the 8 allowed top-level `$`-prefixed keys — no `$variant`, no `$raw`, nothing else.
- [X] T063 [P] SC-008 gate (no breaking API changes): add an API-surface snapshot test at `packages/rust/tests/api-surface.test.ts` (and clones for TS/Python) that exports the list of top-level names + their signatures via a snapshot file; any change requires explicit baseline update.
- [X] T064 FR-018 + FR-019 + FR-013 enforcement: add a CI check script at `scripts/assert-scope-boundaries.sh` that fails if any of the following would produce: (a) a WASM artifact in the MVP release (`pnpm publish --dry-run` must not emit `.wasm` files), (b) `sittir-core` published to crates.io (no `cargo publish` in the MVP release workflow — FR-018), (c) any runtime-loaded generated artifact in `packages/{lang}/rust-render/` — the directory MUST contain only `.rs` files and the `templates/` copy (FR-019 enforcement: fail on any `.json`, `.yaml`, `.toml` other than `Cargo.toml`, `.txt`, or similar data file), (d) any derive-macro crate in the Rust workspace dependency graph other than `askama`, `napi-derive`, `serde_derive`, and `tree-sitter`-crate internals (`cargo tree -e normal --depth 2 | grep -E '(derive|proc-macro)'` allow-list — FR-013 enforcement). Run as a CI job before release.

### Documentation

- [ ] T065 [P] Update `CLAUDE.md` Active Technologies section with the Rust port entries (Rust 1.82+, `sittir-core`, `askama`, `napi-rs`, per-grammar render crate location). Additive only.
- [ ] T066 [P] Add a "Native backend" section to the root `README.md` explaining the runtime-selection model and the `SITTIR_BACKEND` / `SITTIR_BACKEND_DEBUG` env vars.
- [ ] T067 [P] Link `specs/012-rust-core-port/quickstart.md` from `CLAUDE.md § Commands` as the onboarding doc for new Rust contributors.

### Deferred-scope handover

- [ ] T068 Create stub spec files for the two deferred user stories at `specs/NNN-rust-crate-publish/spec.md` (US2) and `specs/NNN-rust-wasm-backend/spec.md` (US3), each a one-paragraph summary pointing back to this feature's "Deferred / Future Work" section. Do NOT implement; just establish the speckit directories for the future features so the task tracker understands they're scheduled but not-yet-work.

---

## Dependencies & Story Completion Order

```
Phase 1 (Setup: T001–T008)
  └─→ Phase 2 (Foundational: T009–T021)
        └─→ Phase 3 (US1: T022–T052)  🎯 MVP complete at end of Phase 3
              └─→ Phase 4 (Polish: T053–T068)

Within Phase 3 (after T021):
  Rust core (T022–T026) ┬─→ Codegen emitter (T027–T032)
                        │
                        └─→ Parity harness (T045–T049) [parallel with codegen emitter once T032 regen lands]

  Codegen emitter (T027–T032) ┬─→ napi binding (T033–T038)
                               │
                               └─→ JS routing (T039–T044) [parallel with napi binding]

  napi binding + JS routing ─→ Acceptance tests (T050–T052)

Phase 4 tasks are mostly [P] — can run in any order after Phase 3 checkpoint.
```

### Parallel execution examples

**Phase 2 parallel batch** (after T009 + T014 are done):
```
T010 [P]  Edit type + #[napi(object)]
T011 [P]  Boundary roundtrip tests
T012 [P]  Shared filters module
T013 [P]  Filter-parity tests
T015 [P]  Hash function unit tests
T017 [P]  --rust-render CLI flag
T018 [P]  backend.ts skeleton (rust)
T019 [P]  backend.ts skeleton (typescript, python)
T020 [P]  Re-export from index.ts
```

**Phase 3 napi-binding batch** (after T032 regen lands clean):
```
T033 [P] [US1]  sittir-rust-napi
T034 [P] [US1]  sittir-typescript-napi
T035 [P] [US1]  sittir-python-napi
T036 [P] [US1]  @sittir/rust-native package.json
T037 [P] [US1]  @sittir/typescript-native package.json
T038 [P] [US1]  @sittir/python-native package.json
```

**Phase 4 CI-matrix batch**:
```
T053 [P]  macOS jobs
T054 [P]  Linux x64 jobs
T055 [P]  Linux arm64 jobs
T056 [P]  Windows x64 job
T058 [P]  Micro-benchmark
T059 [P]  Macro-benchmark script
T060–T063 [P]  Success-criteria gates (each in a different file)
T065–T067 [P]  Documentation
```

---

## Independent Test Criteria

### US1 — Codemod author (MVP)

**Test sequence**: T050 + T051 + T052 together cover the US1 acceptance scenarios from spec.md.

- T050 proves the happy path: native backend, byte-identical file output vs. TS baseline, strictly-lower wall-clock.
- T051 proves the silent-fallback path: forced `SITTIR_BACKEND=typescript`, consumer code unchanged, file output unchanged.
- T052 proves the hash-mismatch-fallback path: tampered hash forces TS fallback with a visible `reason` field.

All three tests pass → US1 is delivered.

---

## Suggested MVP Scope

**Phase 1 + Phase 2 + Phase 3 (T001–T052).** Phase 4 can be deferred to a follow-up PR without affecting the US1 deliverable; most of Phase 4 is release-engineering + gating rather than user-visible functionality. A reasonable shipping order:

1. **PR 1 (Phases 1 + 2)**: Sets up workspace, proves `sittir-core` compiles standalone, wires backend-selection skeleton. Low-risk, pure scaffolding.
2. **PR 2 (Phase 3 Rust core + codegen emitter, T022–T032)**: Delivers the engine minus bindings. Parity fixture extraction exists but runs against the TS engine only.
3. **PR 3 (Phase 3 napi + JS routing + acceptance, T033–T052)**: Delivers the native backend end-to-end. At this PR's merge, US1 is functional on the developer's platform.
4. **PR 4 (Phase 4)**: Release pipeline, platform matrix, docs, deferred-scope gates.

---

## Format validation

All 68 tasks follow the required checklist format:

- Every task starts with `- [ ]`
- Every task has a sequential `T0##` ID
- Phase 3 tasks are labeled `[US1]`; Phase 1/2/4 tasks have no story label (Setup/Foundational/Polish)
- `[P]` markers are applied only where tasks target different files with no prior-task dependency
- Every task names at least one exact file path
- No sample/placeholder tasks remain from the template

Task counts: **Phase 1: 8 · Phase 2: 13 · Phase 3 (US1): 32 · Phase 4: 16 · Total: 69** (T045a added during `/speckit.analyze` remediation).
