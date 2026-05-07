# Implementation Plan: NodeData-Free Render Path

**Branch**: `025-nodedata-free-render` | **Date**: 2026-05-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/025-nodedata-free-render/spec.md`
**ADRs**: [0020](../../docs/adr/0020-render-pipeline-consolidation.md), [0021](../../docs/adr/0021-eliminate-nodedata-from-transport-render.md)

## Summary

Eliminate `NodeData` construction from the transport render path entirely. Trivia applied from `TransportTrivia` directly, format applied from `KindId` + `Span` scalars, `render_dispatch` and per-kind NodeData render functions removed, `node_data_from_transport` deleted.

## Technical Context

**Language/Version**: Rust 1.88+, Askama 0.15, TypeScript 6.0.2 (codegen emitter)
**Primary Dependencies**: `sittir-core` (engine, types), per-grammar render crates, `@sittir/codegen` (render-module.ts)
**Storage**: N/A
**Testing**: `cargo test`, vitest, bench-render.ts
**Target Platform**: Native (napi-rs 3) + Node.js fallback
**Project Type**: Render pipeline refactor
**Performance Goals**: Reduce heap-per-render by eliminating NodeData allocation
**Constraints**: Byte-identical rendered output, zero Rust warnings

## Constitution Check

| Principle | Status | Notes |
|---|---|---|
| I. Grammar Alignment | PASS | No grammar changes |
| II. Three-Layer Architecture | PASS | Changes in core (engine) + codegen (emitter) |
| III. Generated-Output Hygiene | PASS | Fix the generator, not generated output |
| XI. DRY | PASS | Two render paths → one |

## Project Structure

### Source Code

```text
packages/codegen/src/emitters/
└── render-module.ts          # Emitter — removes render_dispatch + NodeData fns,
                              # updates render_transport_parts, adds kind_id/span
                              # accessor emission on AnyTransport

rust/crates/sittir-core/src/
├── engine.rs                 # render_canonical_node → apply_render_format(kind_id, span, ...)
│                             # render_node_data trivia uses grammar.render() (stays)
└── types.rs                  # TransportTrivia (already exists)

rust/crates/sittir-{lang}/src/render/
├── dispatch.rs               # DELETED — render_dispatch removed
├── templates.rs              # Per-kind render functions REMOVED, only struct defs remain
├── transport.rs              # render_transport_parts loses node_data_from_transport
└── bridge.rs                 # node_data_from_transport REMOVED, field helpers stay
```
