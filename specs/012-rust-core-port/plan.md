# Implementation Plan: Rust Port of `@sittir/core`

**Branch**: `012-rust-core-port` | **Date**: 2026-04-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/012-rust-core-port/spec.md`

## Summary

Port the hot-path read/render/splice engine of `@sittir/core` from TypeScript to Rust, shipped as a napi-rs native backend (7-platform prebuilt matrix) with the existing TypeScript/Nunjucks engine as a transparent fallback. WASM and crates.io publication are deferred to follow-up releases. The Rust `readNode` emits primitive NodeData (8 `$`-prefixed fields) across the JS↔Rust boundary; the existing TypeScript enrichment pipeline (`wrap.ts`, `readTreeNode`, `_wrapTable`, factories) runs over the primitive output to yield the consumer-facing shape. Render parity with the TS engine is byte-identical on a dedicated partition of fixtures; full-pipeline parity (parse → read → splice → re-parse) is semantic. Template-bundle version skew is detected at napi load time via a SHA-256 hash baked into both the Rust binary and the TS package; mismatches fall through to TS silently. Backend selection is silent by default and programmatically inspectable via exported `getActiveBackend()` plus `SITTIR_BACKEND_DEBUG=1`.

## Technical Context

**Language/Version**:

- Rust 1.82+ (stable). Minimum supported version (MSRV) pinned at first release; target is "current stable" per napi-rs ecosystem norms.
- TypeScript 6.0.2 (existing; unchanged).

**Primary Dependencies**:

- Rust: `tree-sitter` (parser runtime), `ast-grep-core` (pattern search), `serde` + `serde_json` (boundary format), `napi` + `napi-derive` (Node addon bindings), `sha2` (template-bundle hashing), `askama` (compile-time Jinja engine — selected in Phase 0 R1 to satisfy FR-008's cargo-build-time validation mandate).
- TypeScript: existing deps unchanged; the runtime-selection shim in each `@sittir/{lang}` package will gain an optional peer dep on the corresponding `@sittir/{lang}-native` npm package.

**Storage**: N/A — the engine is a pure transformation over in-memory strings and parse trees. No persistence layer.

**Testing**:

- Rust: `cargo test` for unit + integration; `cargo criterion` (optional) for benchmarks.
- TypeScript: `vitest` (existing).
- Shared: JSON fixture corpus auto-extracted from the existing round-trip validator (per FR-012); both engines run the corpus in CI and diff.

**Target Platform**:

- Per FR-017, the native backend ships prebuilts for: macOS arm64, macOS x64, Linux x64 (glibc), Linux x64 (musl), Linux arm64 (glibc), Linux arm64 (musl), Windows x64. All other platforms use the JS fallback transparently (FR-009).
- TypeScript fallback continues to run on any Node.js-capable platform.

**Project Type**: Compiler-adjacent library (tree transformation engine). Multi-crate Rust workspace added alongside the existing pnpm TypeScript monorepo.

**Performance Goals**:

- Wall-clock reduction vs. TS-only baseline on existing benchmark corpus — magnitude deferred to benchmark phase per spec Assumptions (a regression is the failure mode).
- Zero per-field FFI crossings inside the read path (per FR-005) — single primitive-NodeData crossing per match.
- `cargo build` time for the full workspace: target < 60s on the CI runner (standard napi-rs envelope); longer is acceptable if dependency graph justifies.

**Constraints**:

- No custom proc macros, `macro_rules` templating, or bespoke template grammars (FR-013).
- No new runtime-loaded codegen artifacts (FR-019) — dispatch table and filter aliases are generated as Rust source at codegen time.
- Render output byte-identical to TS on the render-parity partition (FR-002a); full round-trip semantically equivalent (FR-002b).
- The Rust `sittir-core` crate builds without Node.js/npm (FR-004) — workspace-internal only in MVP.
- No Rust port work begins until the round-trip ceilings-at-zero gate (FR-014) is cleared on the TypeScript backend.

**Scale/Scope**:

- 3 grammars in scope: Rust, TypeScript, Python. ~164 / ~177 / ~107 per-rule `.jinja` templates respectively.
- Per-grammar generated Rust `templates.rs` ships one `#[derive(Template)]` struct per rule kind (~450 structs total across grammars).
- Per-grammar `NamespaceMap` shape (TS side) exposes the same ~450 kinds — unchanged by this feature.
- Expected MVP codemod workload: thousands of matches per run against repositories of 10k–50k files.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-evaluated after Phase 1 design._

Evaluation against constitution v1.3.0:

| Principle                                 | Relevance   | Status      | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------- | ----------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I. Grammar Alignment                      | High        | ✅ Pass     | Wire shape preserves tree-sitter vocabulary (`kind`, `named`, raw field names in `$fields`). No synonyms introduced.                                                                                                                                                                                                                                                                                                                                                                    |
| II. Fewer Abstractions                    | High        | ⚠ Justified | Four crates (core + render + napi; WASM deferred) is the minimum that preserves the FR-004 boundary and the napi↔engine split. Askama's per-kind struct emission (~450 structs across 3 grammars) is a real abstraction cost beyond what a runtime template engine would need — **documented + justified in Complexity Tracking below**; required to satisfy FR-008 literally. All other potential layers (no Render trait per-kind impls; no ast-grep wrapper type hierarchy) avoided. |
| III. Generated vs Hand-Written            | High        | ✅ Pass     | The Rust render module is codegen-emitted (`packages/{lang}/` gains a `render-module/` output alongside `src/`). All emitted files carry the standard generated-header comment. Templates (`.jinja`) remain generated per existing branch-011 work.                                                                                                                                                                                                                                        |
| IV. Test-First                            | High        | ✅ Pass     | Per FR-012, the parity fixture corpus is auto-extracted from the existing round-trip validator. Every new Rust factory/render path has a generated test because the fixtures and Rust source come from the same codegen pass.                                                                                                                                                                                                                                                           |
| V. Library-First                          | High        | ✅ Pass     | No CLI is introduced by this feature. The N-API binding is a library export, not a command-line tool. The existing `Edit` interface remains the integration boundary.                                                                                                                                                                                                                                                                                                                    |
| VI. Deterministic Output                  | High        | ✅ Pass     | Template-bundle SHA-256 hash (FR-020) is itself a deterministic-output check. Codegen regeneration produces byte-identical Rust source given the same grammar inputs. No timestamps, no iteration-order dependencies.                                                                                                                                                                                                                                                                   |
| VII. Grammar-Agnostic Pipeline            | High        | ✅ Pass     | The Rust render emitter consumes the same per-grammar overrides and `.jinja` inputs; no grammar-specific Rust code appears in the emitter. The three variant-branching exception rules (FR-011) are encoded in the templates themselves, not in the pipeline.                                                                                                                                                                                                                           |
| VIII. Non-lossy Transformations           | Medium      | ✅ Pass     | Primitive NodeData (FR-005a) does not drop any tree data; enrichment in TS is additive. The boundary serde layer elides absent optionals but never discards present data.                                                                                                                                                                                                                                                                                                               |
| IX. @sittir/core is the Rust-port surface | **Central** | ✅ Pass     | **This feature is the realization of Principle IX.** The `sittir-core` crate contains exactly the primitives the principle names: `render()`, `readNode()`, `Edit` helpers, tree-walking over structurally-compatible interfaces. TypeScript-only projections (`NamespaceMap`, `ConfigOf`, `FromInputOf`) stay in the generated per-grammar `utils.ts` and `types.ts` — out of core.                                                                                                    |
| X. Don't hand-roll types you can import   | Medium      | ✅ Pass     | Rust side imports `tree_sitter::Node/Tree/Parser/Language` directly; no paraphrased newtypes. Ast-grep's types are imported. `serde` + `serde_json` own the JSON boundary types.                                                                                                                                                                                                                                                                                                        |
| XI. DRY — one source, one derivation      | **Central** | ✅ Pass     | **Q4 Approach C is the DRY-satisfying choice.** Rust readNode does not re-implement TS enrichment semantics; TS enrichment has a single source. FR-019 forbids duplicating codegen outputs — Rust dispatch is generated from the same `.jinja` + `node-model.json5` that the TS engine already consumes. Template-bundle hash (FR-020) prevents drift between the native binary and the template source.                                                                                |

**Pre-research verdict**: all gates pass. No complexity justification required.

### Post-design re-check (after Phase 0 + Phase 1)

Re-evaluated 2026-04-22 after `research.md`, `data-model.md`, `contracts/*.md`, and `quickstart.md` were drafted. Changes made during design:

- **R1**: template engine is **askama** (matching the v3 input recommendation). An initial draft of research picked minijinja on Principle II grounds (fewer structs), but that draft overlooked FR-008's literal requirement that template defects fail `cargo build` — a runtime-parsing engine cannot satisfy that. The askama per-kind struct emission (~450 structs) is a real Principle II tension; **justified in Complexity Tracking below** because it's the mechanism FR-008 mandates.
- **R2**: workspace layout places generated render modules inside `rust/crates/sittir-{lang}/src/render/` — satisfies Principle III (generated vs. hand-written separation) cleanly.
- **R4**: the edit-path boundary shape remains hybrid (no consolidation). No constitutional pressure to change.
- **Data model**: `NodeData` wire shape enumerated exactly — no new fields discovered during Phase 1 that would require going back to clarification. Principle VIII (non-lossy) is satisfied: tree-sitter data that matters (field names, child order, spans, named/anonymous) is all carried on the wire.
- **Contracts**: four contract documents codify what the napi surface, wire format, TemplateContext, and backend-selection API look like. None introduce new concepts outside the spec.

**Verdict**: all eleven principles still pass. No new complexity-tracking entries. Ready for Phase 2 (`/speckit.tasks`).

## Project Structure

### Documentation (this feature)

```text
specs/012-rust-core-port/
├── plan.md                  # This file
├── research.md              # Phase 0 output — technology decisions
├── data-model.md            # Phase 1 output — type shapes + lifecycle
├── quickstart.md            # Phase 1 output — developer onboarding
├── contracts/               # Phase 1 output — engine interface contracts
│   ├── napi-api.md
│   ├── nodedata-wire-format.md
│   ├── template-context.md
│   └── backend-selection.md
├── checklists/
│   └── requirements.md      # Existing — from /speckit.specify
└── tasks.md                 # Phase 2 output (/speckit.tasks — not by this command)
```

### Source Code (repository root)

**Existing TypeScript monorepo** (unchanged scope; additive only):

```text
packages/
├── core/                    # @sittir/core — TS runtime (stays in MVP)
├── types/                   # @sittir/types — TS type projections
├── codegen/                 # @sittir/codegen — grammar → per-grammar output emitter
├── rust/                    # @sittir/rust — Rust grammar package (TS consumer + templates)
│   ├── src/                 # generated TypeScript (existing)
│   ├── templates/           # generated .jinja files (existing from branch 011)
│   └── render-module/         # NEW — generated Rust render module (see below)
├── js/              # @sittir/js — analogous
│   └── render-module/         # NEW
├── python/                  # @sittir/python — analogous
│   └── render-module/         # NEW
└── ...
```

**NEW — Rust workspace** (top-level, sibling to `packages/`):

```text
rust/
├── Cargo.toml               # workspace manifest
├── crates/
│   ├── sittir-core/         # Hand-written — types, readNode, prepare, splice, hash check
│   │   ├── Cargo.toml
│   │   └── src/
│   │       ├── lib.rs
│   │       ├── types.rs         # NodeData (primitive), FieldValue, Edit, Span
│   │       ├── read_node.rs     # tree-sitter → NodeData (primitive)
│   │       ├── prepare.rs       # NodeData → TemplateContext (for the render module)
│   │       ├── splice.rs        # Edit batch application
│   │       ├── boundary.rs      # serde rename attrs, skip-if-none rules
│   │       └── filters.rs       # upper/lower aliases, shared template filter helpers
│   ├── sittir-rust/      # Generated (by packages/rust/codegen output)
│   │   ├── Cargo.toml
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   └── templates.rs     # #[derive(Template)] per kind + render_dispatch()
│   │   └── templates/           # symlink or copy of packages/rust/templates/
│   ├── sittir-typescript/src/render/
│   │   └── [same structure]
│   ├── sittir-python/
│   │   └── [same structure]
│   └── sittir-{lang}/      # One per grammar — N-API binding wrapping the render module
│       ├── Cargo.toml
│       ├── src/lib.rs           # SittirEngine struct, napi methods
│       └── build.rs             # napi-build integration
└── tests/
    ├── fixtures/                # Shared parity-fixture JSON (auto-extracted from TS validator)
    └── parity/                  # Cross-engine diff harness (cargo test + vitest bridge)
```

**Structure Decision**: a **top-level `rust/` workspace** sibling to `packages/` keeps the Rust build graph independent of pnpm and preserves FR-004 (core crate buildable without Node). Per-grammar `render-module` output lives inside the TypeScript grammar package (`rust/crates/sittir-rust/src/render/`) because that's where the codegen-emitted Rust source logically belongs — it's generated from that package's `node-model.json5` and `.jinja` files — but the Cargo workspace at `/rust/Cargo.toml` declares it as a workspace member via path. This avoids duplicating template files between the TS package and the Rust crate (symlink or copy at codegen time). The N-API binding crates live only under `rust/crates/` because they're platform-specific build artifacts, not grammar-semantic output.

## Complexity Tracking

> **Filled only if Constitution Check has violations that must be justified.**

| Violation                                                                                                                                                                                                                                                                          | Why Needed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Simpler Alternative Rejected Because                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Per-kind `#[derive(Template)]` struct (~450 across 3 grammars), all codegen-emitted as Rust source. Principle II tension: a runtime template engine would need a single `TemplateContext` struct + one dispatch function, versus askama's per-kind typed struct per template file. | FR-008 mandates `cargo build`-time template validation with filename + line diagnostics. The only way to achieve literal build-time validation is a compile-time template engine, which requires one compile unit per template — i.e. one struct per kind. Askama is the standard Rust implementation of this pattern.                                                                                                                                                                                                                                                                                                                                                                                                                                                           | **Runtime engines (minijinja, tera)** can't fail `cargo build` on template defects — only at first render or in the CI parity gate. This does not satisfy FR-008's "MUST fail `cargo build`" clause. If FR-008 were relaxed, minijinja would win on Principle II grounds; as written, askama is required. The ~450 structs are all codegen-emitted (not hand-written), so Principle III (generated vs. hand-written) separation remains clean.                      |
| **Principle IV interpretation**: parity fixture corpus (FR-012, tasks T045–T049) serves as the generated-test mechanism for per-kind render structs; no separate per-struct smoke test is emitted.                                                                                 | Principle IV's letter ("every generated factory MUST ship with a generated test") was written when the generated factory was a discrete unit with isolated behavior. The Rust render structs are not standalone units — their correctness is defined as byte-identical parity with the TS engine on the shared fixture corpus. A per-struct synthetic-input smoke test would at best re-assert what askama's build-time validation already enforces (the struct compiles + renders on valid inputs); it would NOT test correctness, because correctness is a cross-engine property. The parity harness tests every kind that's exercised in the round-trip corpus, and G3 (analysis finding) mandates that the three FR-011 exception rules be explicitly present in the corpus. | **Per-struct synthetic smoke tests** were considered and rejected: they re-test askama's compile-time guarantee and add ~450 generated test files with near-zero incremental signal. **Hand-written per-kind tests** were rejected on Principle III grounds (hand-editing generated-code-adjacent tests creates a drift surface). The parity harness is the honest test here; this note documents the interpretation so future reviewers don't flag it as a IV gap. |
