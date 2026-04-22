---
description: "Task list for Jinja template migration"
---

# Tasks: Jinja Template Migration (Askama-Style)

**Input**: Design documents from `specs/011-jinja-template-migration/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Test tasks are included because the spec's validation criteria (byte-identical round-trip, cross-render parity, translator unit tests) require tests as gates. Tests are written TDD-style — failing test first, then implementation.

**Organization**: Tasks are grouped by user story for independent implementation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 (TS Nunjucks), US2 (Rust askama), US3 (authoring ergonomics)
- File paths are absolute from repo root

## Path Conventions

- Codegen source: `packages/codegen/src/`
- Core runtime: `packages/core/src/`
- Generated grammar packages: `packages/{rust,typescript,python}/`
- Templates (new): `packages/{rust,typescript,python}/templates/`
- Phase B crate: `crates/sittir-render/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install Nunjucks, create template directory structure, add `.gitignore` entries for any transient build artifacts.

- [x] T001 Add `nunjucks` to `packages/core/package.json` dependencies; run `pnpm install` to refresh lockfile
- [x] T002 [P] Add `@types/nunjucks` to `packages/core/package.json` devDependencies
- [x] T003 [P] Create empty directory `packages/rust/templates/` with a placeholder `.gitkeep` file so the directory exists before codegen emits into it
- [x] T004 [P] Create empty directory `packages/typescript/templates/` with a `.gitkeep` file
- [x] T005 [P] Create empty directory `packages/python/templates/` with a `.gitkeep` file
- [x] T006 Add `packages/*/templates/*.jinja` to each package's `files` array in `packages/{rust,typescript,python}/package.json` so the generated templates ship in the published artifact

**Checkpoint**: `pnpm install` completes cleanly; `nunjucks` is available to import from `@sittir/core`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Formalize the `TemplateContext` contract in `@sittir/core`, prepare the codegen emitter scaffolding, and verify ADR-0013 prerequisites are present.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T007 Verify ADR-0013 tasks 1, 2, 3 are present on master: grep for `prepare`, `createRendererFromConfig`, and the variant-collapse logic in `packages/codegen/src/compiler/node-map.ts`. Abort if any is missing.
- [x] T008 Formalize `TemplateContext` interface in `packages/core/src/render.ts` exactly as specified in `specs/011-jinja-template-migration/contracts/template-context.md`. Export it alongside the existing `PreparedRender` type.
- [x] T009 Extend `prepare()` in `packages/core/src/render.ts` to populate a `TemplateContext` object (snake_case field keys, `children`, `children_list`, `variant`, `text`, `trailing_sep`, `leading_sep`) in addition to its current `Substitution[]` output. Both outputs coexist during the migration.
- [x] T010 [P] Write a vitest case in `packages/core/tests/template-context.test.ts` asserting the context shape matches the contract on three representative corpus node fixtures (one branch, one container, one polymorph).
- [x] T011 Create skeleton file `packages/codegen/src/emitters/jinja-translator.ts` exporting a `translateToJinja(node: AssembledNode, rules: Record<string, Rule>, wordMatcher: RegExp): string` function that throws `"translateToJinja: not implemented"` for now.
- [x] T012 [P] Create skeleton test file `packages/codegen/src/__tests__/jinja-translator.test.ts` with one `it.todo()` per mapping rule from `contracts/translator-mapping.md` (Rule 1 single-template, Rule 2 clause-bearing, Rule 3 variant-branching, Rule 4 leaf, Rule 5 keyword/token, Rule 6 supertype).

**Checkpoint**: `TemplateContext` exported from `@sittir/core`; translator skeleton exists; all ADR-0013 preconditions confirmed.

---

## Phase 3: User Story 1 — TypeScript Nunjucks Renderer with Per-Rule `.jinja` Files (Priority: P1) 🎯 MVP

**Goal**: Retire `templates.yaml` on all three grammars; replace the hand-rolled substitutor with Nunjucks rendering per-rule `.jinja` files. Round-trip corpus byte-identical.

**Independent Test**: Run `pnpm test` after the cutover; every corpus node renders byte-identical to the pre-migration baseline. `packages/*/templates.yaml` no longer exists. Single-file `git diff` when editing one rule's template.

### Implementation tasks — translator (TDD order)

- [x] T013 [US1] Implement `translateToJinja` for `modelType === 'branch'` (Rule 1 single-template) in `packages/codegen/src/emitters/jinja-translator.ts`. Replace `it.todo()` with a failing test in `packages/codegen/src/__tests__/jinja-translator.test.ts`, then implement, then pass.
- [x] T014 [US1] Implement `translateToJinja` for `modelType === 'container'` (pre-joined `$$$CHILDREN` + joinBy in `prepare()`) in `packages/codegen/src/emitters/jinja-translator.ts`. TDD: failing test → implement → pass.
- [x] T015 [US1] Implement clause-body inlining (Rule 2: `$X_CLAUSE` + `x_clause: body`) in `packages/codegen/src/emitters/jinja-translator.ts`. Emit `{%- if x %}<body>{% endif -%}`. TDD.
- [x] T016 [US1] Implement variant branching (Rule 3: polymorphs that retain `variants:` — the 5 genuine-branch rules) in `packages/codegen/src/emitters/jinja-translator.ts`. Emit `{%- if variant == "<form>" -%}...{%- elif... -%}...{%- endif -%}`. TDD across all 5 rules.
- [x] T017 [P] [US1] Implement "no-file" cases (Rules 4, 5, 6: leaf / keyword / token / supertype / enum / group / multi return `null`, emitter skips file emission) in `packages/codegen/src/emitters/jinja-translator.ts`. TDD.
- [x] T018 [US1] Implement loud-failure path: any unrecognized construct throws `Error(`translator: rule '${kind}' uses unsupported construct: ${detail}`)` in `packages/codegen/src/emitters/jinja-translator.ts`. Unit test with a synthetic bad node.
- [x] T019 [US1] Implement `$NEWLINE` → literal `\n`; `$INDENT` / `$DEDENT` → empty string. TDD with a python-style block-structured rule fixture.
- [x] T020 [US1] Implement whitespace-control insertion logic: place `{%-` / `-%}` around clause and variant constructs so absent clauses don't leave whitespace (matches YAML-era implicit absorption). TDD.
- [x] T020a [US1] Add translator fixture tests in `packages/codegen/src/__tests__/jinja-translator.test.ts` covering YAML block-scalar whitespace fidelity (spec R41 / edge case #1): feed the translator an `AssembledNode` whose template was a YAML `|`-literal with embedded newlines (e.g., python's `_match_block`). Assert the emitted `.jinja` preserves byte-exact whitespace including terminal newlines.

### Emitter rewrite

- [x] T021 [US1] Replace the body of `packages/codegen/src/emitters/templates.ts`'s `emitTemplates` function with per-file emission. For each node in `nodeMap.nodes`: call `translateToJinja(node, rules, wordMatcher)`; if non-null, write `packages/<grammar>/templates/<kind>.jinja` with the `@generated` header prepended.
- [x] T022 [US1] Add stale-file cleanup to `packages/codegen/src/emitters/templates.ts`: before emission, list current `.jinja` files in `packages/<grammar>/templates/`; after emission, delete any file whose kind is not in the emitted set. Preserve `.gitkeep`.
- [ ] T023 [US1] Retire `AssembledPolymorph.renderTemplate()` and related `renderParts()` / `renderTemplate()` class methods in `packages/codegen/src/compiler/node-map.ts`. Delete them. Keep `isTextTemplate` and any metadata helpers the translator needs.

### Nunjucks bridge in `@sittir/core`

- [x] T024 [US1] Create `packages/core/src/templates/nunjucks-env.ts` that builds a Nunjucks `Environment` configured for sittir's use: trim whitespace-controls, no autoescape (rendered output is source code, not HTML), template loading via a browser-safe loader. **Acceptance includes**: `grep 'node:' packages/core/src/templates/nunjucks-env.ts` returns 0 matches at module top level (preserves ADR-0013 Task 1 browser-safety guarantee). Any `node:fs`-dependent loader must live behind a lazy import or in `packages/core/src/loader.ts` instead.
- [x] T025 [US1] Modify `packages/core/src/render.ts`'s `createRendererFromConfig` to accept an optional `templatesDir: string` option. When set, load `.jinja` files from that directory and render via Nunjucks; when not set, keep the legacy path during transition.
- [x] T026 [US1] Modify `packages/core/src/loader.ts` so `createRenderer(yamlOrTemplatesDir: string)` detects whether the argument is a `.yaml` file (legacy) or a directory (`.jinja` files); dispatch accordingly during the cutover.
- [x] T027 [US1] Wire `applyTemplate` in `packages/core/src/render.ts` to feed `prepare()`'s `TemplateContext` output to the Nunjucks template lookup (`env.getTemplate(kind + '.jinja').render(ctx)`). Preserve column-aware re-indentation + space absorption post-render.
- [x] T027a [US1] Preserve token-shaped-kind fallback in `packages/core/src/render.ts` (spec R28 / FR-017): when a node's rule has no corresponding `.jinja` template, retain the existing `fieldsAllAnon && childrenAllAnon` → return `$text` path; throw otherwise. Add vitest cases in `packages/core/tests/fallback.test.ts` covering rust's `mod_item_external` and typescript's `empty_statement`. Fallback must not dispatch through Nunjucks.
- [x] T028 [US1] Add error handling: when Nunjucks throws "Unable to call template" or "undefined variable", rethrow with rule-kind and template-file context: `Error(`render: template '${kind}.jinja' referenced undefined variable '${varName}'`)`.

### Per-grammar cutover (bring up one at a time)

- [x] T029 [US1] Regenerate rust grammar: `npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src`. Inspect `packages/rust/templates/` — should contain ~160 files. Commit the emitted files.
- [x] T030 [US1] Update `packages/rust/src/factories.ts`'s `createRenderer` call site to pass the templates directory: `createRenderer(join(__dirname, '..', 'templates'))`.
- [x] T031 [US1] Run `pnpm --filter @sittir/rust test`. Iterate on translator bugs until 100% byte-identical to pre-migration baseline. Track fixes in translator unit tests.
- [x] T032 [US1] Delete `packages/rust/templates.yaml`.
- [x] T033 [US1] Repeat T029–T032 for typescript: regenerate, update `packages/typescript/src/factories.ts`, run `pnpm --filter @sittir/typescript test` until byte-identical, delete `packages/typescript/templates.yaml`.
- [x] T034 [US1] Repeat T029–T032 for python: regenerate, update `packages/python/src/factories.ts`, run `pnpm --filter @sittir/python test` until byte-identical, delete `packages/python/templates.yaml`. **Additionally** (spec R47 / edge case #7) verify python's `_match_block` rendered output on a representative corpus node has correct indent/newline/dedent behavior — this is the grammar's canonical whitespace-sensitive case and the highest-risk rule for whitespace-control translation.

### Integration tests + cleanup

- [ ] T035 [US1] Run full `pnpm test`. Assert only the pre-existing 1 `raw_string_literal` failure remains; no new regressions.
- [ ] T036 [US1] Run `pnpm -r run type-check`. Must pass.
- [ ] T037 [US1] Remove the legacy `.yaml` path from `packages/core/src/loader.ts` and `packages/core/src/render.ts`. `createRenderer` now accepts directory paths only. Update core tests accordingly.
- [ ] T038 [P] [US1] Add a regression test in `packages/core/tests/nunjucks-render.test.ts` asserting that a template referencing an undefined variable throws with the error format from T028.
- [ ] T039 [P] [US1] Add a regression test in `packages/codegen/src/__tests__/jinja-translator.test.ts` asserting stale-file deletion: pre-populate `packages/<grammar>/templates/` with a bogus `removed_rule.jinja`; run codegen; assert file is gone.

**Checkpoint (MVP)**: All three grammars render via Nunjucks from per-rule `.jinja` files. YAML deleted. `pnpm test` at pre-migration baseline. Single-file `git diff` when editing one template.

---

## Phase 4: User Story 2 — Rust Port with Askama Compile-Time Validation (Priority: P2)

**Goal**: Stand up `crates/sittir-render/` with per-rule askama structs; `.jinja` files are shared with Phase A's TS renderer. Cross-render parity across the corpus.

**Independent Test**: `cargo test -p sittir-render` passes; each corpus node renders byte-identical between TS (Nunjucks) and Rust (askama).

### Rust crate scaffolding

- [ ] T040 [US2] Create `crates/sittir-render/Cargo.toml` declaring `askama = "0.x"`, edition = "2024", and a `[package]` section naming the crate.
- [ ] T041 [US2] Create `crates/sittir-render/src/lib.rs` with module declarations for each grammar: `pub mod rust;`, `pub mod typescript;`, `pub mod python;`.
- [ ] T042 [P] [US2] Create `crates/sittir-render/templates/rust/`, `crates/sittir-render/templates/typescript/`, `crates/sittir-render/templates/python/` directories with `.gitkeep` files. These mirror the TS-side `packages/<grammar>/templates/` directories.
- [ ] T043 [US2] Add a `build.rs` to `crates/sittir-render/` that copies `packages/<grammar>/templates/*.jinja` into the crate's `templates/<grammar>/` directory at build time. Ensures the single source of truth remains the `packages/<grammar>/templates/` directory; the Rust crate consumes copies.
- [ ] T044 [US2] Register `crates/sittir-render/` in the workspace: add `crates/sittir-render` to a top-level `Cargo.toml`'s `[workspace].members` (create the workspace file if absent).

### Rust filter aliases

- [ ] T045 [US2] Create `crates/sittir-render/src/filters.rs` registering Nunjucks-compatible filter aliases: `upper` → `uppercase`, `lower` → `lowercase`, plus any others where askama's native name differs. Use askama's filter-registration mechanism.
- [ ] T046 [P] [US2] Add unit tests in `crates/sittir-render/src/filters.rs` verifying each alias renders identically to its askama-native counterpart.
- [ ] T046a [US2] Audit the six standardized filters (`join`, `length`, `default`, `trim`, `upper`, `lower`) for *semantic* divergence (not just name) between Nunjucks and askama (spec R42 / edge case #2). Produce `specs/011-jinja-template-migration/filter-semantic-audit.md` documenting each filter's behavior on edge inputs (empty string, null/None, whitespace-only, non-ASCII / Unicode). Any divergence found MUST either (a) be normalized on the TS or Rust side before the template sees the value, or (b) be added to the forbidden-construct list in `contracts/jinja-subset.md`. No silent semantic divergence may ship.

### Codegen: emit Rust askama structs

- [ ] T047 [US2] Create `packages/codegen/src/emitters/rust-source.ts` that, for each rule with a `.jinja` file, emits a Rust source file declaring a `#[derive(askama::Template)]` struct with `#[template(path = "<grammar>/<kind>.jinja")]` and fields matching the grammar-declared field set plus the shared `TemplateContext` slots.
- [ ] T048 [US2] Extend codegen's main CLI entry (`packages/codegen/src/cli.ts`) with a `--emit-rust-source` flag. When set, emit per-grammar Rust modules into `crates/sittir-render/src/<grammar>/mod.rs` (one file per rule or a consolidated module; decide during implementation).
- [ ] T049 [US2] Regenerate all three grammars' Rust source files: `npx tsx packages/codegen/src/cli.ts --grammar rust --emit-rust-source` (and equivalents for typescript, python).
- [ ] T050 [US2] Run `cargo build -p sittir-render`. Iterate on codegen emitter + filter aliases until `cargo build` succeeds with zero errors. Template variable mismatches must surface as build errors (SC-005).

### Cross-render parity test

- [ ] T051 [US2] Design a test protocol in `crates/sittir-render/tests/parity.rs` that loads the round-trip corpus (from the same fixtures the TS tests use), renders each node through the Rust implementation, and compares byte-for-byte against a reference snapshot produced by the TS (Nunjucks) renderer.
- [ ] T052 [US2] Create the reference snapshot: add a script `scripts/generate-parity-snapshot.ts` that runs the TS renderer over the full corpus and writes one file per node to `crates/sittir-render/tests/snapshots/`. Commit snapshots.
- [ ] T053 [US2] Run `cargo test -p sittir-render`. Iterate on any divergences; each divergence is a translator or filter-alias bug. Target: 100% of corpus byte-identical.
- [ ] T054 [P] [US2] Add a benchmark harness in `crates/sittir-render/benches/render.rs` measuring wall-clock per-node render time for Rust and documenting the Phase B perf target (SC-008 ≥ 2× TS).
- [ ] T055 [US2] Add a negative test in `crates/sittir-render/tests/build-errors.rs` (using `trybuild` or equivalent): intentionally introduce a `.jinja` file referencing an undefined variable; assert `cargo build` fails with an error containing the template filename and the variable name.

**Checkpoint**: Rust crate builds, parity test green, compile-time validation demonstrated.

---

## Phase 5: User Story 3 — Template Authoring Ergonomics (Priority: P3)

**Goal**: Template changes produce single-file `git diff`s; IDE Jinja tooling picks up `.jinja` files.

**Independent Test**: Edit one rule's template, regenerate, observe single-file diff. Open `.jinja` file in VSCode (or other IDE) with Jinja extension; verify syntax highlighting and undefined-variable warnings.

- [ ] T056 [US3] Add a `.vscode/extensions.json` entry recommending a Jinja syntax extension (e.g., `samuelcolvin.jinjahtml` or `wholroyd.jinja`) at the repo root. Low-friction discovery for contributors.
- [ ] T057 [P] [US3] Add a `.editorconfig` rule for `*.jinja` files (indent_style, indent_size matching the emitted files) if not already covered.
- [ ] T058 [US3] Document the authoring workflow in `packages/codegen/README.md`: how to edit templates (via codegen emitter, never by hand), how to regenerate, how to verify a per-file diff.
- [ ] T059 [US3] Add a CI lint step that fails when a `.jinja` file is hand-edited without a corresponding codegen emitter change: compute a hash of `translateToJinja`'s output for every node in the graph and compare to the on-disk file hash. Divergence = hand-edit detected. **Additionally** (R21 tightening) scan all `.jinja` files for forbidden constructs (`{% extends %}`, `{% macro %}`, `{% include %}`, `{% match %}`, `{% set %}`) and fail CI if any are found — catches hand-edits that attempt to use authoring-subset violations.
- [ ] T060 [P] [US3] Add an integration test in `packages/codegen/src/__tests__/single-file-diff.test.ts` that verifies: (a) editing one rule's metadata produces exactly one modified `.jinja` file on regeneration, (b) unrelated rules' files are byte-unchanged.

**Checkpoint**: Authoring experience matches SC-006.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, performance validation, migration tag.

- [ ] T061 [P] Update `CLAUDE.md` to reference the `.jinja` template surface under the Architecture section; remove references to `templates.yaml`.
- [ ] T061a Add a new-grammar smoke test in `packages/codegen/src/__tests__/new-grammar.test.ts` (spec R44 / edge case #4): register a synthetic minimal grammar via the codegen pipeline; assert it emits `.jinja` files (never YAML) under `packages/<synthetic>/templates/` and the renderer loads them correctly. Serves as a regression lock against reintroducing YAML paths when new grammars are added post-migration.
- [ ] T062 [P] Update `docs/adr/` with a new ADR-0014 marking the migration complete, linking ADR-0013 as the enabling prerequisite, and capturing the `@sittir/core` + Nunjucks + askama decision.
- [ ] T063 [P] Run a performance benchmark: wall-clock `pnpm test` pre- and post-migration; assert no regression > 10% (SC-007).
- [ ] T064 [P] Run the Phase B perf benchmark: wall-clock per-node render time in Rust vs TS; assert ≥ 2× (SC-008). Document results in `specs/011-jinja-template-migration/benchmarks.md`.
- [ ] T065 Tag a release milestone `011-jinja-migration-complete` on master after Phases 1–5 merge.

---

## Dependencies

```text
Phase 1 (Setup) ──┬─→ Phase 2 (Foundational) ──→ Phase 3 (US1 MVP) ──→ Phase 4 (US2 Rust) ──→ Phase 5 (US3 Ergonomics) ──→ Phase 6 (Polish)
                  └─ All Phase 1 tasks parallelizable to each other
                                               └─ Within Phase 3: T013–T020 (translator) → T021–T023 (emitter) → T024–T028 (core bridge) → T029–T034 (per-grammar, serial) → T035–T039 (integration)
                                                                                         └─ Within Phase 4: T040–T044 (crate scaffolding) → T045–T046 (filters) → T047–T050 (codegen emitter) → T051–T055 (parity)
```

**Critical path**: T007 → T008 → T009 → T011 → T013 → T014 → T015 → T016 → T021 → T024 → T025 → T029 → T031 → T033 → T034 → T035.

**US2 blocks on US1 landing**: Phase B needs Phase A's `.jinja` files to exist on disk. US2's first `cargo build` depends on US1's T029 (rust) completing.

**US3 is non-blocking**: Phases 5 tasks are nice-to-have; can land any time after Phase 3 completes.

---

## Parallel Execution Examples

**Within Phase 1 (setup)**:
```
T002 + T003 + T004 + T005  — all independent (different files/dirs)
```

**Within Phase 2 (foundational)**:
```
T010 (test) + T012 (test skeleton)  — both can land while T008/T009 happen serially on render.ts
```

**Within Phase 3 (US1)**:
```
T017 + T019 + T020  — different mapping rules in jinja-translator.ts, can parallelize authoring, need one integration pass to merge
T038 + T039  — independent test files
```

**Within Phase 4 (US2)**:
```
T042 + T046 + T054  — directory setup, filter tests, benchmark harness all independent
```

**Within Phase 5 (US3)**:
```
T057 + T060  — editorconfig + integration test, different files
```

**Within Phase 6 (polish)**:
```
T061 + T062 + T063 + T064  — all independent (docs, ADR, perf benchmarks)
```

---

## Implementation Strategy

**MVP scope**: **User Story 1 (Phase 3) alone is shippable**. It replaces the hand-rolled render engine with Nunjucks, eliminates `templates.yaml`, and preserves byte-identical output across 3 grammars. Every downstream benefit (Rust port, IDE support) builds on it.

**Incremental delivery order**:

1. **Phase 1 + 2 (Setup + Foundational)** — lands in one PR (~1 day). Low risk.
2. **Phase 3 US1 (TS Nunjucks MVP)** — lands in one PR, grammar-by-grammar commits inside (~3–5 days). Medium risk: translator bugs will surface as corpus divergences.
3. **Release / stabilize** — let US1 bake on master for a few days; gather any bug reports.
4. **Phase 4 US2 (Rust askama)** — lands in one PR (~5–7 days). Medium-high risk: first Rust code in the repo, cross-render parity is a new testing surface.
5. **Phase 5 US3 (Ergonomics)** — opportunistic; lands whenever.
6. **Phase 6 (Polish)** — housekeeping PR.

**Parallel opportunities**:

- Within US1, the translator mapping rules (T013–T020) can be distributed across multiple agents working on independent `translateToJinja` branches as long as they share a mocking fixture set.
- Per-grammar cutovers (T029–T034) are sequentially-dependent on the translator stabilizing but internally parallelizable once the translator is correct.
- US2's scaffolding (T040–T046) can happen in parallel with later US1 stabilization.

---

## Validation Checklist

Format check (every task):
- [x] All tasks start with `- [ ]`
- [x] Every task has a sequential ID (T001–T065 + T020a/T027a/T046a/T061a from coverage review)
- [x] Parallel tasks marked with `[P]` where applicable
- [x] User-story phase tasks carry `[US1]`, `[US2]`, or `[US3]` labels
- [x] Setup, Foundational, and Polish tasks have no story label
- [x] Every task description includes a concrete file path or command
- [x] No placeholder text (`[TBD]`, `implement later`, etc.)

Content check (per spec):
- [x] User Story 1 has complete implementation tasks (T013–T039 + T020a, T027a)
- [x] User Story 2 has complete implementation tasks (T040–T055 + T046a)
- [x] User Story 3 has complete implementation tasks (T056–T060)
- [x] Translator mapping rules from `contracts/translator-mapping.md` all covered
- [x] `TemplateContext` contract formalized (T008, T010)
- [x] Cross-render parity test included (T051–T053)
- [x] Compile-time validation demonstrated (T055)
- [x] Performance targets have tasks (T063, T064)
- [x] Token-shaped-kind fallback preserved (T027a)
- [x] YAML block-scalar whitespace fidelity (T020a)
- [x] Filter semantic-divergence audit (T046a)
- [x] New-grammar regression lock (T061a)
- [x] Dependencies section shows phase + task ordering
- [x] Parallel execution examples provided per phase

**Task count**: 69 total (65 original + 4 coverage-review additions). US1: 30, US2: 18, US3: 6. Setup: 6, Foundational: 6, Polish: 6 (incl. T061a). No phase-less tasks other than Setup/Foundational/Polish.
