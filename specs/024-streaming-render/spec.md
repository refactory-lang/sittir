# Feature Specification: Streaming Render Architecture

**Feature Branch**: `024-streaming-render`
**Created**: 2026-05-06
**Status**: Draft
**Input**: ADR 0019 — migrate to full streaming on render side, eliminate redundant dead Rust code.

## User Scenarios & Testing

### User Story 1 — Trivia renders without intermediate allocations (Priority: P1)

When a developer attaches trivia to a node via `$trivia()` and renders it, the leading/trailing comment text is written directly to the output buffer — no intermediate String collection, no `Vec<String>`, no `format!()` concatenation.

**Why this priority**: Trivia rendering is the newest code path and the simplest to fix. Establishes the streaming pattern for subsequent phases.

**Independent Test**: Render a node with trivia attached. Verify output is correct and the render path writes directly to the buffer (no `render_trivia_items` function call).

**Acceptance Scenarios**:

1. **Given** a node with leading trivia, **When** rendered via native engine, **Then** the trivia text is written directly to the output buffer before the node's rendered text.
2. **Given** a node with trailing trivia, **When** rendered, **Then** trailing text is appended directly after the node — no intermediate String allocation for trivia items.

---

### User Story 2 — Per-kind render functions stream to output buffer (Priority: P1)

Each generated per-kind render function writes its template output directly to a provided output buffer instead of allocating and returning a String. The render dispatch table passes the buffer through the call chain.

**Why this priority**: This is the core allocation elimination — every tree node currently allocates its own String. Streaming removes N allocations for an N-node tree.

**Independent Test**: Render a complex node (e.g., `function_item` with parameters, body, return type). Verify output matches the pre-migration output byte-for-byte. Benchmark confirms reduced allocation count.

**Acceptance Scenarios**:

1. **Given** a per-kind render function, **When** rendering a node, **Then** it calls `template.write_into(dest)` instead of `template.render()`.
2. **Given** the render dispatch table, **When** dispatching, **Then** it passes `dest: &mut dyn Write` to each per-kind function.
3. **Given** any rendered output, **When** compared to pre-migration output, **Then** results are byte-identical.

---

### User Story 3 — Unified dispatch table (Priority: P2)

The two separate dispatch tables (`render_dispatch` for `NodeData` and `render_transport_dispatch` for `AnyTransport`) are merged into one streaming path. Transport `FromNapiValue` produces `NodeData` and the single dispatch handles both.

**Why this priority**: Simplifies the render module emitter and removes duplicated per-kind match arms. But depends on US2 completing first.

**Independent Test**: Render via both the `NodeData` path and the napi transport path. Both produce identical output through the same dispatch table.

**Acceptance Scenarios**:

1. **Given** a `NodeData` input, **When** rendered, **Then** it goes through the unified `render_into(node, dest)` function.
2. **Given** a napi `AnyTransport` input, **When** rendered, **Then** it converts to `NodeData` and goes through the same unified function.
3. **Given** the generated render module, **When** inspected, **Then** only ONE dispatch table exists (not two).

---

### User Story 4 — Zero warnings on Rust build (Priority: P1)

All generated Rust render crates compile with zero warnings in release mode. Unreachable match arms, dead render functions, and unused transport fields are eliminated.

**Why this priority**: Warnings mask real issues and signal code quality problems. Zero-warning builds are a professional baseline.

**Independent Test**: Run `cargo build --release` across all three grammar crates. Exit code 0, zero lines containing "warning:".

**Acceptance Scenarios**:

1. **Given** all three grammar crates (rust, typescript, python), **When** built with `cargo build --release`, **Then** zero warnings are emitted.
2. **Given** alias-collapsed kinds that share numeric IDs, **When** the dispatch match is generated, **Then** duplicate arms are deduplicated or suppressed.
3. **Given** render functions for alias-collapsed kinds, **When** the function is never reachable, **Then** it is not emitted.

---

### Edge Cases

- What if a grammar has zero alias-collapsed kinds? The deduplication logic should be a no-op — no behavioral change.
- What if `write_into` fails mid-render (I/O error)? Errors propagate via `Result` — partial output may exist in the buffer. Callers using String buffers won't observe partial results (the error prevents returning the String).
- What about the `RenderableTransport::render_into` circular delegation? The impl currently calls `render_xxx_transport(self)` which returns String. After unification, it should call the streaming path directly.

## Requirements

### Functional Requirements

- **FR-001**: Per-kind render functions MUST write output via `write_into(dest)` instead of `template.render()` returning String.
- **FR-002**: The render dispatch function MUST accept `dest: &mut dyn Write` and pass it through to per-kind functions.
- **FR-003**: Trivia rendering MUST write directly to the output buffer — no intermediate String collection.
- **FR-004**: Callers that need a String MUST use a `String` buffer adapter (`let mut buf = String::new(); render_into(node, &mut buf)?;`).
- **FR-005**: Rendered output MUST be byte-identical before and after the migration for all corpus test cases.
- **FR-006**: The codegen emitter (render-module.ts) MUST generate the streaming render functions — no hand-editing of generated Rust.
- **FR-007**: `cargo build --release` MUST produce zero warnings for all three grammar crates.
- **FR-008**: Unreachable match arms from alias-collapsed kinds MUST be deduplicated or eliminated.
- **FR-009**: Dead render functions (never called from dispatch) MUST not be emitted.
- **FR-010**: The `render_dispatch` and `render_transport_dispatch` tables SHOULD be unified into one streaming function (P2 — may ship separately).

### Key Entities

- **RenderDispatch**: The match table routing `KindId` → per-kind render function.
- **PerKindRender**: A generated function that resolves template fields and writes output.
- **TransportDispatch**: The napi transport → render path (currently separate from RenderDispatch).

## Success Criteria

### Measurable Outcomes

- **SC-001**: Native render benchmark shows reduced memory allocation (heap-per-render metric in bench-render) compared to pre-migration baseline.
- **SC-002**: Rendered output is byte-identical for all corpus nodes across all three grammars.
- **SC-003**: `cargo build --release` produces zero warnings for sittir-rust, sittir-typescript, sittir-python.
- **SC-004**: The render module emitter change is one codegen commit — all per-kind functions are generated, not hand-edited.
- **SC-005**: All existing validator counts hold or improve.
