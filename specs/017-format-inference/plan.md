# Implementation Plan: Format Inference

**Branch**: `017-format-inference` | **Date**: 2026-04-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/017-format-inference/spec.md`

## Summary

Add a structured `$format` record to `AnyNodeData` in `@sittir/types` that captures residual source-text metadata — whitespace layout, optional-token choices, separator styles, and trivia (comments/blank lines) — that the grammar's template cannot reconstruct.

**Architecture (revised 2026-04-27)**:

- **Extraction is Rust-only.** Format is inferred exclusively by the native Rust reader as a single `FormatRecord` for the entire parse result — one style record per file, stored on `treeHandle.format`. Per-kind style variations are expressed as `FormatRecord.kinds` child entries (e.g. `kinds["function_item"]` overrides the tree-level defaults for that kind). No per-node map; no `$format` from inference.
- **Rendering is backend-agnostic.** Both the JS (`@sittir/core` Nunjucks) and native (Rust Askama) render engines read `ctx.format` to apply a tree-level style. `RenderContext` accepts `format?: FormatRecord`. Nodes rendered under the same context share the same format record. If absent, template-canonical output is used.
- **`$format` on `AnyNodeData` is for user-supplied inline format only.** Inferred format never sets `node.$format`. The render path checks `ctx.format` (tree-level, from inference or user config) first, then `node.$format` (per-node inline override), then falls back to canonical.
- **User-configured format is backend-agnostic.** A caller may supply a hand-crafted `FormatRecord` as `ctx.format` (e.g. a house-style config) to either render backend.

The result: `render(nativeReadNode(parse(source))) === source` byte-equal roundtrip (native path). The JS render path gains the ability to _apply_ user-supplied `$format` without gaining the ability to _infer_ it.

## Technical Context

**Language/Version**: TypeScript 6.0.2 (ESM, `.ts` extensions) + Rust 1.82+ (required for extraction)  
**Primary Dependencies**: `@sittir/types` (`FormatRecord` + `FormatCache` types, shared between both tiers), native Rust napi crate (extractor + native applier), `@sittir/core` (JS applier only, reads from `RenderContext.formatCache`)  
**Storage**: N/A — pure in-memory. `specs/017-format-inference/format-corpus.json` is the committed fixture manifest.  
**Testing**: Vitest (acceptance corpus tests driven by native-produced `NodeData`), `pnpm test`  
**Target Platform**: Node.js via napi-rs N-API (native reader); Node.js (JS renderer)  
**Project Type**: Library / compiler toolchain  
**Performance Goals**: Extraction overhead is Rust-side only; JS render path is unchanged for nodes without `$format`. Zero allocation on the JS applier hot path when `$format` is absent.  
**Constraints**: Zero regressions in 016's TS-mode pass counts (SC-004). `$format` must be JSON-roundtrip safe (FR-011). JS `readNode` signature and behaviour unchanged.  
**Scale/Scope**: Three grammar packages; acceptance corpus seeded from 016-deferred fixtures plus 017-measured additions.

## Constitution Check

*GATE: Passes before Phase 0. Re-checked after Phase 1.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Grammar Alignment | ✅ | `$format` uses tree-sitter terminology: `slots` per field/child, `trivia` for comments |
| II. Fewer Abstractions | ✅ | One `$format` record per node; no `FormatBuilder`/`FormatLog`/`FormatResult` wrapper types |
| III. Generated vs Hand-Written | ✅ | No hand-edits to generated files; all via `packages/codegen/src/*` or `overrides.ts` |
| VI. Deterministic | ✅ | Same source bytes + same grammar version → same `$format` record (Rust extractor) |
| IX. core is Rust-port surface | ✅ | Extractor lives in native Rust crate; JS applier in `@sittir/core`; type contract in `@sittir/types` |
| X. Don't hand-roll types | ✅ | `$format` defined in `@sittir/types` only; imported by native crate and JS core |
| XI. DRY | ✅ | One Rust extractor; one applier per backend (JS + Rust); `assertNever` at every union switch |

No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/017-format-inference/
├── plan.md               # This file
├── research.md           # Phase 0 output
├── data-model.md         # Phase 1 output — $format record schema + extractor/applier contracts
├── quickstart.md         # Phase 1 output — developer guide
├── contracts/            # Phase 1 output — type contract + corpus manifest schema
├── format-corpus.json    # Committed fixture manifest (FR-012)
└── tasks.md              # Phase 2 output (speckit.tasks)
```

### Source Code (repository root)

```text
packages/types/src/
└── core-types.ts         # Add FormatRecord types + $format field to AnyNodeData

packages/core/src/
├── render.ts             # Add single-path JS format applier (check $format before template render)
└── format.ts             # (new) applyFormat() helper — JS backend only, exported from core
                          # NOTE: NO extractFormat() here — extraction is Rust-only

rust/                     # (native tier — to be created as part of 017)
└── sittir-core/
    └── src/
        └── format.rs     # extract_format() + apply_format() — single Rust extractor

packages/{rust,typescript,python}/
└── napi/src/
    ├── read.rs           # native readNode equivalent — calls extract_format, populates $format
    └── render.rs         # native render — calls apply_format when $format present

tests/
└── format-roundtrip/     # acceptance corpus tests — driven by native-produced NodeData
    ├── rust.test.ts
    ├── typescript.test.ts
    └── python.test.ts
```

**Structure Decision**: Extraction belongs exclusively to the native Rust tier. The JS `@sittir/core` gains only `applyFormat` (applier). The `$format` type contract lives in `@sittir/types` and is consumed by both tiers. Acceptance tests exercise the full native-read → JS-render path, confirming that `$format`-bearing `NodeData` from the native reader renders correctly in the JS engine.

## Phase 0: Research

**All NEEDS CLARIFICATION resolved** — spec architecture updated per user direction (2026-04-27).

Key decisions (see `research.md` for full rationale):

1. **`$format` is residual delta, not a source-text copy** — store only what template-canonical render would lose.
2. **Extraction is Rust-only** — `extractFormat` lives in `rust/sittir-core/src/format.rs`. The JS `readNode` is unchanged and never emits `$format`.
3. **Rendering is backend-agnostic** — both JS (Nunjucks, `@sittir/core`) and native (Askama, napi crates) consume `$format` via their respective `applyFormat` implementations.
4. **User-configured format** — a caller may supply a hand-crafted `FormatRecord` on any `NodeData` (e.g. a house-style config) and both render backends apply it. Format _inference_ (extraction from source) is Rust-only; format _application_ is universal.
5. **Application point**: at the top of `render()`, before `pickTemplate`. `node.$format` + `ctx.ignoreFormat` guard the call. `RenderContext.ignoreFormat` satisfies FR-010.
6. **JSON roundtrip safety**: `$format` record uses only primitives and plain objects/arrays.
7. **`format-corpus.json` seed**: 016's deferred set + at least one fixture per format category per grammar.

## Phase 1: Design & Contracts

### Data Model

See `data-model.md` for the complete schema. Summary:

```ts
// @sittir/types/src/core-types.ts (addition)
export interface FormatBoundary {
  leading?: string;
  trailing?: string;
}
export interface FormatSlot {
  sep?: string;
  trailingPresent?: boolean;
  absent?: boolean;
}
export interface FormatLiteral { raw: string; }
export interface FormatTrivia { offset: number; text: string; }
export interface FormatRecord {
  boundary?: FormatBoundary;
  slots?: Record<string, FormatSlot>;
  literals?: Record<string, FormatLiteral>;
  trivia?: FormatTrivia[];
}
// AnyNodeData gains: $format?: FormatRecord
```

The Rust equivalent types in `sittir-core` mirror this schema exactly (no extra fields, no divergence).

### Contracts

See `contracts/` for:
- `format-corpus.schema.json` — JSON Schema for `format-corpus.json`

### Implementation Tasks

#### T-types: Add `$format` to `@sittir/types`

Files: `packages/types/src/core-types.ts`, `packages/types/src/index.ts`, `packages/core/src/types.ts`

- Add `FormatBoundary`, `FormatSlot`, `FormatLiteral`, `FormatTrivia`, `FormatRecord` interfaces.
- Add `$format?: FormatRecord` to `AnyNodeData`.
- Export all new types from both packages.

#### T-js-apply: Single-path JS format applier in `@sittir/core`

Files: `packages/core/src/render.ts`, `packages/core/src/format.ts` (new)

- `applyFormat(canonical: string, format: FormatRecord): string` in `format.ts`.
- Check `node.$format` at the top of `render()` (after `prepare()`); delegate to `applyFormat`; return early.
- `RenderContext` gains `ignoreFormat?: boolean`. Export it from `@sittir/types`.

#### T-rust-extract: Rust format extractor + applier

Files: `rust/sittir-core/src/format.rs` (new), napi crate `read.rs` per grammar

- `extract_format(source: &str, span: Span, canonical: &str, node: &TreeNode) -> Option<FormatRecord>`
  — single code path; returns `None` when `source[span] == canonical`.
- `apply_format(canonical: &str, format: &FormatRecord) -> String` — mirrors JS applier exactly.
- Wire into native `read_node`: call `extract_format` after the field/child loop, before return.
- Wire into native render: check `$format` at the top of the render dispatch.

#### T-corpus: Committed corpus manifest + acceptance tests

Files: `specs/017-format-inference/format-corpus.json`, `tests/format-roundtrip/*.test.ts`

- Populate `format-corpus.json` from 016's deferred set + at least one fixture per category per grammar.
- Acceptance tests: obtain `NodeData` via native reader (which populates `$format`), render with JS engine, assert byte-equal to source.
- Also run with native render on `expectedBackendCoverage: "both"` fixtures; assert TS/native outputs are byte-equal.

## Complexity Tracking

No constitution violations. No extra abstraction layers.
