# Implementation Plan: Rewrite Codegen from grammar.js

**Branch**: `001-codegen-grammarjs-rewrite` | **Date**: 2026-03-24 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-codegen-grammarjs-rewrite/spec.md`

## Summary

Rewrite `@sittir/codegen` to use `grammar.json` (compiled from `grammar.js`) as the single source of truth for code generation, merged with `node-types.json` for field metadata. Introduce a three-layer architecture, delivered in two phases:

### Phase A: TypeScript Core (this feature)

1. **`@sittir/core`** — TypeScript. Grammar-driven render engine, validation, CST construction, Edit creation. A single `render()` function walks pre-compiled render tables (data, not code) to produce source text.
2. **`@sittir/types`** — Pure TypeScript type projections (zero runtime). `NodeType<G,K>`, grammar-derived field types, `NodeData`/`RenderRule` interfaces.
3. **`@sittir/codegen`** — TypeScript code generator. Reads grammar.json + node-types.json, emits: render tables (data), TypeScript factory functions with unified API, constants, tests.

Generated language packages (`@sittir/rust`, etc.) contain **types + render tables + unified factory functions** — near-zero runtime logic. All rendering is delegated to `@sittir/core`.

### Phase B: Rust/WASM Core (optional follow-up — driven by demand, not performance)

With input validation at factory creation time (O(1) per string input via reserved keyword sets + pattern matching), tree-sitter parsing is no longer in the runtime path — it's only used in the codegen test suite for regression testing render rules. This makes the TypeScript core production-ready without a Rust port.

Phase B remains an option for:
- **Native Rust `ir` module** — enables pure-Rust codemod authors (ast-grep plugin ecosystem) to use sittir without JS/WASM
- **Dogfooding** — validates `@refactory/typescript-to-rust` pipeline on a real codebase
- **Browser bundle size** — WASM binary may be smaller than equivalent JS for the render engine

Phase B is NOT needed for:
- Performance — input validation eliminates the parse bottleneck; render is string concatenation (fast in JS)
- Correctness — TypeScript types + input validation guarantee valid output by construction

**Unified API pattern**: Each generated factory supports three usage modes — declarative (config object), fluent (method chaining), and mixed (required field positional + config). All produce the same `NodeData` plain object. Fluent setters are field mutations on the data, not class methods. No ES classes in generated code.

Eliminate unnecessary abstractions (`LeafBuilder`, `LeafOptions`, `Builder` base class). Align all terminology with tree-sitter and ast-grep conventions.

## Technical Context

**Language/Version**: TypeScript (ESM, `.ts` extensions in imports)
**Primary Dependencies**: tree-sitter grammar packages (grammar.json + node-types.json), web-tree-sitter (for validation in Phase A), type-fest (type-level utilities)
**Storage**: N/A (codegen reads JSON files, emits TypeScript source + render tables)
**Testing**: Vitest
**Target Platform**: Node.js — library consumed by codemod scripts
**Project Type**: Library (TypeScript core + code generator + generated builder packages)
**Performance Goals**: Generate all builders for a full grammar (200+ node kinds) in under 5 seconds; O(1) input validation per string factory call (reserved keyword check + pattern match); no render-time validation overhead
**Constraints**: Zero third-party runtime dependencies in generated packages (only @sittir/core); deterministic output
**Validation Strategy**: Compile-time (TypeScript types) + factory-time (O(1) string input checks against grammar's reserved keywords and terminal patterns). Tree-sitter validation only in codegen test suite for render rule regression testing. No render-time validation.
**Future (Phase B, optional)**: Port core to Rust/WASM via @refactory/typescript-to-rust pipeline — driven by Rust codemod ecosystem demand, not performance
**Scale/Scope**: 3 grammar targets (Rust ~200 kinds, TypeScript ~180 kinds, Python ~150 kinds)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Grammar Alignment | PASS | All naming uses tree-sitter terms (kind, field, named, supertype) |
| II. Fewer Abstractions | PASS | Eliminating LeafBuilder, LeafOptions; generated code is data+types, not classes with renderImpl |
| III. Generated vs Hand-Written | PASS | Clear separation: codegen (TS, hand-written) → render tables + types (generated); core (Rust, hand-written) |
| IV. Test-First | PASS | Generated per-node tests + Rust unit tests for render engine |
| V. Library-First | PASS | No CLI/formatting ownership; Edit interface for codemod integration |
| VI. Deterministic Output | PASS | SC-007 requires byte-identical regeneration; Rust core is deterministic |

All gates pass.

## Complexity Tracking

No constitution violations. Phase A is pure TypeScript. Rust/WASM complexity deferred to Phase B.

## Project Structure

### Documentation (this feature)

```text
specs/001-codegen-grammarjs-rewrite/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── public-api.md    # Library public API contract
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
packages/
├── core/                              # @sittir/core — TypeScript (Phase A)
│   └── src/                           #   → Rust/WASM in Phase B via @refactory/typescript-to-rust
│       ├── index.ts                   # Public API: render, validate, toEdit, toCst
│       ├── render.ts                  # Grammar-driven render engine
│       │                              # Takes NodeData + RenderRule[] → source string
│       ├── validate.ts                # Validation (fast: bracket matching; full: web-tree-sitter)
│       ├── cst.ts                     # CST node construction with byte offsets
│       ├── edit.ts                    # Edit creation (startPos, endPos, insertedText)
│       └── types.ts                   # RenderRule, RenderStep, NodeData, Edit, CSTNode
│
├── types/                             # @sittir/types — pure TS type projections
│   └── src/
│       └── index.ts                   # NodeType<G,K>, DerivedNodeFields, NodeData,
│                                       # RenderRule, Edit, CSTNode (zero runtime)
│
├── codegen/                           # @sittir/codegen — TS code generator
│   └── src/
│       ├── index.ts                   # generate() entry point, CodegenConfig
│       ├── grammar-reader.ts          # Read grammar.json + node-types.json → NodeMeta
│       ├── naming.ts                  # kind → TypeScript name conventions
│       └── emitters/
│           ├── rules.ts               # Render table emitter (grammar rule → RenderRule[])
│           ├── factories.ts           # Unified factory emitter (declarative + fluent + mixed)
│           ├── ir-namespace.ts        # ir namespace emitter (re-exports all factories)
│           ├── consts.ts              # Constants/maps emitter
│           ├── types.ts               # Type projection emitter
│           ├── grammar.ts             # Grammar type literal emitter
│           ├── test.ts                # Per-node test emitter
│           ├── config.ts              # Vitest config emitter
│           └── index-file.ts          # Barrel re-export emitter
│
├── rust/                              # @sittir/rust — generated from tree-sitter-rust
│   └── src/
│       ├── rules.ts                   # Render tables (data, generated)
│       ├── factories.ts               # Unified factories: declarative + fluent + mixed
│       ├── ir.ts                      # ir namespace (re-exports factories, generated)
│       ├── types.ts                   # Type projections (generated)
│       ├── consts.ts                  # Constants (generated)
│       └── index.ts                   # Barrel (generated)
│
├── typescript/                        # @sittir/typescript — generated
│   └── src/                           # (same structure as rust/)
├── python/                            # @sittir/python — generated
│   └── src/                           # (same structure as rust/)
└── tests/                             # Cross-package integration tests
```

**Structure Decision**: Three-layer architecture. Core (`packages/core`) owns all runtime behavior — render engine, validation, CST, edits. TypeScript types (`packages/types`) are pure compile-time. Codegen (`packages/codegen`) reads grammars and emits data + types. Generated language packages contain render tables (data), unified factory functions (declarative + fluent + mixed), and type projections — near-zero runtime logic, delegating to core.

Phase A delivers everything in TypeScript. Phase B ports `packages/core` to Rust/WASM via `@refactory/typescript-to-rust`, adds Rust `ir` module, and adds a Rust emitter to codegen. Generated packages don't change — same API, same `NodeData`, backed by WASM instead of JS.

**Package dependency graph**:
```
@sittir/types         — zero runtime (pure types)
@sittir/core          — TypeScript runtime (Phase A) → Rust/WASM (Phase B)
@sittir/codegen       — depends on @sittir/types
@sittir/rust          — depends on @sittir/core
@sittir/typescript    — depends on @sittir/core
@sittir/python        — depends on @sittir/core
```

**Data flow (Phase A — all TypeScript)**:
```
grammar.json ──┐                    ┌── rules.ts (render tables)
               ├─→ codegen ────────→├── factories.ts (unified: declarative + fluent + mixed)
node-types.json┘                    ├── ir.ts (namespace re-exports)
                                    ├── types.ts (type projections)
                                    ├── consts.ts (discovery maps)
                                    └── *.test.ts (tests)

Runtime:
ir.functionItem(ir.identifier('main'), { body: ir.block() })
  → NodeData (plain object)
  → render(nodeData, rules) → @sittir/core (TypeScript) → source string

Phase B adds:
  → render(nodeData, rules) → @sittir/core (WASM) → source string  (same API)
  → Rust ir module for native consumers
  → Codegen emits ir.rs alongside ir.ts
```
