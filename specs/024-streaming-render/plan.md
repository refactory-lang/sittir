# Implementation Plan: Streaming Render Architecture

**Branch**: `024-streaming-render` | **Date**: 2026-05-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/024-streaming-render/spec.md`
**ADR**: [docs/adr/0019-streaming-render-architecture.md](../../docs/adr/0019-streaming-render-architecture.md)

## Summary

Migrate the native render engine from `template.render() → String` to `template.write_into(dest)` streaming, inline trivia writes, unify the two dispatch tables, and eliminate all Rust warnings from generated render crates. Four phases per ADR 0019.

## Technical Context

**Language/Version**: Rust 1.88+, Askama 0.15, TypeScript 6.0.2 (codegen emitter)
**Primary Dependencies**: `sittir-core` (engine), `sittir-{rust,typescript,python}` (per-grammar render), `@sittir/codegen` (render-module.ts emitter)
**Storage**: N/A — pure rendering pipeline
**Testing**: `cargo test` for Rust, vitest for TS, bench-render.ts for perf
**Target Platform**: Native (napi-rs 3) + Node.js fallback
**Project Type**: Compiler/codegen render pipeline optimization
**Performance Goals**: Reduce heap-per-render in native path (measured via bench-render.ts)
**Constraints**: Generated output byte-identical before/after for all corpus nodes

## Constitution Check

| Principle | Status | Notes |
|---|---|---|
| I. Grammar Alignment | PASS | No grammar changes |
| II. Three-Layer Architecture | PASS | Changes in core (engine) + codegen (emitter) |
| III. Generated-Output Hygiene | PASS | Fix the generator (render-module.ts), not generated output |
| XI. DRY | PASS | Unifying two dispatch tables into one eliminates duplication |

## Project Structure

### Source Code

```text
packages/codegen/src/emitters/
└── render-module.ts      # Emitter that generates per-grammar Rust render code
                          # ALL changes are here — generates streaming functions

rust/crates/sittir-core/src/
├── engine.rs             # ParsedTree::render_node_data — trivia inlining
└── types.rs              # NodeData, NodeTrivia (unchanged)

rust/crates/sittir-{lang}/src/render/
└── templates.rs          # Generated — per-kind render functions + dispatch table
                          # NOT hand-edited — regenerated from render-module.ts
```
