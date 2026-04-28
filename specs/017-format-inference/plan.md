# Implementation Plan: Format Inference

**Branch**: `017-format-inference` | **Date**: 2026-04-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/017-format-inference/spec.md`

## Summary

Add a structured `$format` record to `AnyNodeData` in `@sittir/types` that captures residual source-text metadata — whitespace layout, optional-token choices, separator styles, and trivia (comments/blank lines) — that the grammar's template cannot reconstruct. Populate `$format` in a **single extraction code path** in `@sittir/core::readNode` (comparing the template-canonical render of a node against its source span); consume it in a **single application code path** in `@sittir/core::render` (when `$format` is present, apply its deltas; fall back to template-canonical when absent). The result is a `render(readNode(parse(source))) === source` byte-equal roundtrip guarantee across all three grammars (Rust, TypeScript, Python). The Rust/Askama native backend is a P2 follow-up on the same `$format` contract.

## Technical Context

**Language/Version**: TypeScript 6.0.2 (ESM, `.ts` extensions) + Rust 1.82+ (for future native path)  
**Primary Dependencies**: `@sittir/types` (add `$format` type), `@sittir/core` (extractor + TS applier), per-grammar napi crates (native applier, P2)  
**Storage**: N/A — pure in-memory transformation. `specs/017-format-inference/format-corpus.json` is the committed fixture manifest.  
**Testing**: Vitest (unit + acceptance corpus tests), `pnpm test` for the full suite  
**Target Platform**: Node.js (TS path), WASM/native (Rust path, P2)  
**Project Type**: Library / compiler toolchain  
**Performance Goals**: Format extraction must not meaningfully increase `readNode` overhead for nodes with no format delta (empty-`$format`-omission path is on the hot path)  
**Constraints**: Zero regressions in 016's TS-mode pass counts (SC-004). `$format` must be JSON-roundtrip safe (FR-011).  
**Scale/Scope**: Three grammar packages; acceptance corpus seeded from 016-deferred fixtures plus 017-measured additions.

## Constitution Check

*GATE: Passes before Phase 0. Re-checked after Phase 1.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Grammar Alignment | ✅ | `$format` uses tree-sitter terminology: `slots` per field/child, `trivia` for comments |
| II. Fewer Abstractions | ✅ | One `$format` record per node; no `FormatBuilder`/`FormatLog`/`FormatResult` wrapper types |
| III. Generated vs Hand-Written | ✅ | No hand-edits to generated files; all via `packages/codegen/src/*` or `overrides.ts` |
| VI. Deterministic | ✅ | Same source bytes + same grammar version → same `$format` record |
| IX. core is Rust-port surface | ✅ | Extractor + TS applier in `@sittir/core`; per-grammar narrowing in `utils.ts` only |
| X. Don't hand-roll types | ✅ | `$format` defined in `@sittir/types` only; all consumers import it |
| XI. DRY | ✅ | One extractor, one applier per backend; `assertNever` at every discriminated-union switch |

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
└── core-types.ts         # Add $format field + FormatRecord type to AnyNodeData

packages/core/src/
├── readNode.ts           # Add single-path format extractor (after tree read, before return)
├── render.ts             # Add single-path format applier (check $format before template render)
└── format.ts             # (new) extractFormat() + applyFormat() helpers, exported from core

tests/
└── format-roundtrip/     # (new) acceptance corpus tests — one fixture per format-corpus.json entry
    ├── rust.test.ts
    ├── typescript.test.ts
    └── python.test.ts
```

**Structure Decision**: Single-package extension. No new workspace package needed — `$format` types go in `@sittir/types`, extraction/application helpers in `@sittir/core`. Acceptance tests alongside existing corpus tests in `tests/`.

## Phase 0: Research

**All NEEDS CLARIFICATION resolved** — spec is implementation-ready.

Key decisions confirmed during research (see `research.md` for full rationale):

1. **`$format` is residual delta, not a source-text copy** — store only what the template-canonical render would lose. Deterministic absence when source matches canonical output.
2. **Extraction algorithm**: render the node template-canonically, diff character-by-character against the source span, classify deltas into boundary / slots / literals / trivia subfields.
3. **Extraction point**: in `readNode()` _after_ the existing fields/children accumulation loop, _before_ the return. Single conditional — if extraction produces an empty record, omit `$format`.
4. **Application point**: at the top of the `render()` dispatch, _before_ `pickTemplate`. If `node.$format` is non-nullish and opts-out mode is not active, call `applyFormat(node, prepared)` and return early.
5. **Opt-out**: `RenderContext` gains an optional `ignoreFormat?: boolean` flag. Default `false` (apply `$format` when present). This satisfies FR-010.
6. **Native backend (P2)**: deferred — native Askama crates not yet present in this worktree. The `$format` type contract and TS applier lay the foundation. The Rust applier is a follow-up task in this plan (T-native).
7. **JSON roundtrip safety**: `$format` record uses only `string | number | boolean | null | object | array` — no `Map`, `Set`, `Date`, or class instances. Satisfies FR-011 with no custom serialization.
8. **`format-corpus.json` seed**: check 016's `formatDeferredKinds`; if non-empty, seed from those. Add at least one fixture per format category per grammar (layout, separators, optional tokens, literal spelling, trivia).

See `research.md` for alternatives considered (e.g. storing full source-span as opaque string → rejected as FR-001 violation; storing format as parallel arrays → rejected as DRY violation; comment-attachment model → out of scope).

## Phase 1: Design & Contracts

### Data Model

See `data-model.md` for the complete `$format` record schema. Summary:

```ts
// @sittir/types/src/core-types.ts (addition)
export interface FormatBoundary {
  leading?: string;   // bytes before the canonical body (indent, blank lines)
  trailing?: string;  // bytes after the canonical body (trailing newline, blank lines)
}

export interface FormatSlot {
  sep?: string;                // separator override (e.g. ",\n  " vs ", ")
  trailingPresent?: boolean;   // trailing comma/separator present or absent
  absent?: boolean;            // optional token omitted from source
}

export interface FormatLiteral {
  raw: string;   // exact source spelling (overrides $text for rendering)
}

export interface FormatTrivia {
  offset: number;  // byte offset within the node's span
  text: string;    // comment or blank-line text verbatim
}

export interface FormatRecord {
  boundary?: FormatBoundary;
  slots?: Record<string, FormatSlot>;        // key = field name or child index string
  literals?: Record<string, FormatLiteral>;  // key = field name or "$text"
  trivia?: FormatTrivia[];
}

// AnyNodeData gains:
// $format?: FormatRecord;
```

### Contracts

See `contracts/` for:
- `format-record.contract.ts` — TypeScript contract file (importable type assertions)
- `format-corpus.schema.json` — JSON Schema for `format-corpus.json`

### Implementation Phases

#### T-types: Add `$format` to `@sittir/types`

Files: `packages/types/src/core-types.ts`

- Add `FormatBoundary`, `FormatSlot`, `FormatLiteral`, `FormatTrivia`, `FormatRecord` interfaces.
- Add `$format?: FormatRecord` to `AnyNodeData`.
- Export all new types from `packages/types/src/index.ts`.
- Re-export from `packages/core/src/types.ts`.

#### T-extract: Single-path format extractor in `readNode`

Files: `packages/core/src/readNode.ts`, `packages/core/src/format.ts` (new)

- `extractFormat(node, sourceText, canonicalRender): FormatRecord | undefined` in `format.ts`.
  - Receives the source span text and the template-canonical render string for the same node.
  - Classifies deltas into boundary / slots / literals / trivia.
  - Returns `undefined` when source equals canonical (no record allocated).
- `readNode` calls `extractFormat` once per node, after the loop, before the return. Requires a `sourceText: string` parameter (the full source) and a reference renderer (the grammar's bound render function).
- This introduces a `sourceText` parameter on `readNode` — callers that don't need format pass `undefined`; extraction is skipped.

#### T-apply: Single-path format applier in `render`

Files: `packages/core/src/render.ts`, `packages/core/src/format.ts`

- `applyFormat(node: AnyNodeData, format: FormatRecord, canonical: string): string` in `format.ts`.
  - Takes the canonical render output and mutates it according to `boundary` / `slots` / `literals` / `trivia`.
- At the top of `render()`, after `prepare()`, check `node.$format` and `ctx.ignoreFormat`. If format-applying, call `applyFormat` and return early.
- `RenderContext` (in `@sittir/types`) gains `ignoreFormat?: boolean` (default `false`).

#### T-corpus: Committed corpus manifest + acceptance tests

Files: `specs/017-format-inference/format-corpus.json`, `tests/format-roundtrip/*.test.ts`

- Populate `format-corpus.json` from 016's deferred set plus at least one fixture per format category per grammar.
- Acceptance tests: parse each fixture, run `render(readNode(parse(source), source), rules)`, assert byte-equal to source.

#### T-native (P2, deferred): Rust/Askama native format applier

Files: per-grammar napi crate `render.rs` (when native backend lands)

- Implement `apply_format` consuming `FormatRecord`-equivalent Rust types.
- Assert byte-equal with TS backend for every `expectedBackendCoverage: "both"` fixture.

## Complexity Tracking

No constitution violations. No extra abstraction layers.
