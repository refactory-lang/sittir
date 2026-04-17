# Research: Override-Compiled Parser

**Feature**: 007-override-compiled-parser
**Date**: 2026-04-15

## R1: Parser Loading — WASM, not native .so/.dylib

### Decision
Compile override grammars to **WASM** via `tree-sitter build --wasm`, not native .so/.dylib. Load via existing `web-tree-sitter` `Language.load(wasmPath)` API.

### Rationale
- The project already uses `web-tree-sitter ^0.26.7` for all parsing in validators (roundtrip, factory-roundtrip, readNode-roundtrip, from).
- `Language.load()` accepts a path to a `.wasm` file — this is the existing parser loading mechanism.
- `@ast-grep/napi` is a dependency of `@sittir/core` but is NOT used for parsing in codegen. The `TreeHandle` interface in `readNode.ts` is structurally compatible with both, but validators exclusively use web-tree-sitter.
- `tree-sitter build --wasm` is a supported CLI flag (verified: `tree-sitter-cli ^0.26.7`).
- WASM is cross-platform — eliminates the spec's edge case about `.so` vs `.dylib` and cross-platform cache keys.

### Alternatives Considered
1. **Native .so/.dylib via @ast-grep/napi** — Rejected. ast-grep/napi doesn't expose a custom parser loading API. Would require Node.js FFI bindings to tree-sitter's C API.
2. **Native .so/.dylib via node-tree-sitter** — Rejected. Adding a new runtime dependency violates the existing architecture. Out of scope per spec.
3. **Emscripten WASM via tree-sitter build --wasm** — Selected. Zero new dependencies, aligns with existing validator infrastructure.

### Impact on Spec
- FR-003 (platform-specific cache) simplifies: WASM is platform-independent, single cache artifact.
- Edge case "Cross-platform parser cache" is eliminated — `.wasm` works everywhere.
- SC-005 (cold compile <30s) may be affected — WASM compilation via Emscripten is typically slower than native. Needs benchmarking.
- Requires Emscripten (emsdk) installed for WASM compilation. CI needs this too.

---

## R2: Polymorph Rule Inventory

### Decision
16 total polymorph rules across 3 grammars. All manageable for manual nested-alias conversion.

### Inventory

**Python (1)**:
- `assignment`

**Rust (6)**:
- `closure_expression`, `field_pattern`, `or_pattern`, `range_expression`, `range_pattern`, `visibility_modifier`

**TypeScript (9)**:
- `arrow_function`, `call_expression`, `class_heritage`, `export_statement`, `import_clause`, `import_specifier`, `index_signature`, `parenthesized_expression`, `statement`

### Rationale
`promotePolymorph` in link.ts (line 437) detects these by checking for top-level choices with heterogeneous field shapes across variants. All 16 are currently promoted and active (`applied: true`).

The current discrimination mechanism uses `_inferBranch` in generated `utils.ts` — field-set analysis at runtime to determine which variant a node represents. Nested-alias replaces this with parse-tree structural discrimination (child node type).

### Approach
Convert each rule to nested-alias form using `transform()` patches in the grammar's `overrides.ts`. Each choice alternative wraps in `alias($.variant_name)`, producing a named variant child node. Priority: rust first (6 rules, most complex), then typescript (9 rules, many may be simple), then python (1 rule).

---

## R3: Bare Keyword-Prefix Promotion

### Decision
Add a third pass to `enrich()` that wraps identifier-shaped string literals at the **leading position of a top-level seq** as `field(kw, literal)`. This is the "bare case" that was disabled in spec 006 due to regressions.

### Rationale
- Spec 006 implemented `optionalKeywordPrefixPass` (wraps `optional(stringLit)`) successfully.
- The bare case (`seq('async', ...)` → `seq(field('async', 'async'), ...)`) regressed fidelity when applied everywhere (99 failures on rust, 58 on python).
- The spec 007 approach is conservative: **leading position of top-level seq only**. This matches the subset that `inferFieldNames` currently infers for keywords.
- Collision-aware: skip when another field with the same name already exists on the rule.
- Non-identifier-shaped literals (`'('`, `'::'`, `'+='`) are excluded.

### Alternatives Considered
1. **All positions in seq** — Rejected. Caused the spec 006 regression.
2. **Leading position only** — Selected. Covers the common `seq('async', $.body)` pattern without touching nested contexts.
3. **Keep inferFieldNames for keywords** — Rejected. Defeats the purpose of spec 007 (delete heuristic passes).

---

## R4: Link Pass Cleanup Scope

### Decision
Delete 3 mutating passes from link.ts. Preserve 1 as suggestion-only. Keep 1 unchanged.

### Pass-by-Pass

| Pass | Current State | Action | Notes |
|------|---------------|--------|-------|
| `inferFieldNames` (L1264) | Mutating when `applyInferred=true` | **Delete mutation**, preserve analysis for `suggested-overrides.ts` | Analysis returns `symbol → {name, confidence}` map; suggestion surface stays |
| `promoteOptionalKeywordFields` (L1328) | Mutating when enabled | **Delete entirely** | Replaced by `enrich().optionalKeywordPrefixPass` in spec 006 |
| `promotePolymorph` (L437) | Mutating, promotes to PolymorphRule | **Delete** once nested-alias overrides are in place | All 16 rules need nested-alias transforms first |
| `collectRepeatedShapes` (L1508) | Non-mutating, suggestion-only | **Keep as-is** | Already the model for suggestion-only passes |

### Impact
- link.ts currently: 1,627 lines
- Expected reduction: ~200+ lines (SC-006 target)
- `suggested-overrides.ts` emitter continues to surface `inferredFields` and `repeatedShapes`

---

## R5: WASM Build Requirements — wasi-sdk, not Emscripten

### Decision
tree-sitter-cli 0.26+ uses **wasi-sdk** (auto-downloaded to `~/.cache/tree-sitter/wasi-sdk/`) for WASM builds. No Emscripten or Docker needed.

### Rationale
- Verified: `tree-sitter build --wasm` automatically downloads wasi-sdk on first use (~106MB, cached in `~/.cache/tree-sitter/`).
- No manual install required on dev machines or CI.
- First build: ~10s (wasi-sdk download + compile). Subsequent builds: sub-second (wasi-sdk cached).
- Python override parser WASM: 463KB.

### CI Impact
- No extra setup step needed — tree-sitter-cli handles wasi-sdk download automatically.
- WASM artifacts are platform-independent — simplifies cache strategy.
- Cold compile well within SC-005 (30s) budget.

---

## R6: node-types.json from Override Grammar

### Decision
`tree-sitter generate` against the bundled `.sittir/grammar.js` produces `node-types.json` with override field labels. This is the primary validation artifact for confirming field coverage.

### Rationale
- Already confirmed in spec 006 session: `node-types.json` from `tree-sitter generate` on python's grammar.js shows `body`/`condition`/`alternative` fields on `conditional_expression` — fields that exist only because of transform() patches.
- The pipeline currently reads `node-types.json` from the base grammar package. Switching to the override-generated `node-types.json` provides the field coverage that eliminates `inferFieldNames`.
- `tree-sitter generate` produces both `src/parser.c` and `node-types.json` in the grammar directory.

### Validation
After `tree-sitter generate` in `.sittir/`, compare field coverage between:
1. Base grammar's `node-types.json` (from npm package)
2. Override grammar's `.sittir/node-types.json` (from tree-sitter generate)

Every field currently added by `inferFieldNames` should appear in (2). Any gaps → add to override file.
