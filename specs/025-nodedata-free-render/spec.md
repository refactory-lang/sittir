# Feature Specification: NodeData-Free Render Path

**Feature Branch**: `025-nodedata-free-render`
**Created**: 2026-05-06
**Status**: Draft
**Input**: ADR 0020 follow-up A + ADR 0021 — eliminate NodeData from transport render, unify to one render path.

## User Scenarios & Testing

### User Story 1 — Trivia applied without NodeData construction (Priority: P1)

When a factory node with `$trivia` attached is rendered through the native engine, the leading/trailing comment text is applied by reading `TransportTrivia` directly from the napi input — no `NodeData` is constructed for trivia handling.

**Why this priority**: `node_data_from_transport` is the most expensive operation in the render path. Trivia is just `Vec<String>` text — constructing a full NodeData (HashMap fields, Vec children, string clones) to read it is wasteful.

**Independent Test**: Render a factory node with trivia through the native engine. Verify trivia appears in output. Verify no `NodeData` allocation occurred for trivia (benchmark: heap-per-render decreases).

**Acceptance Scenarios**:

1. **Given** a factory node with `$triviaData` attached, **When** rendered via native engine, **Then** leading/trailing text appears in correct positions.
2. **Given** the render path, **When** trivia is applied, **Then** `node_data_from_transport` is NOT called for trivia — trivia text is read directly from the transport struct.

---

### User Story 2 — Format applied without NodeData construction (Priority: P1)

When the native engine applies indentation/whitespace formatting to a rendered node, it reads `KindId` and `Span` directly from the transport — not from a constructed `NodeData`.

**Why this priority**: Format application is the other reason `node_data_from_transport` is called. Extracting two scalars (kind_id + span) doesn't require building the full object.

**Independent Test**: Render a node with format active (indentation). Verify formatting is correct. Verify `node_data_from_transport` is not called.

**Acceptance Scenarios**:

1. **Given** an engine with format configuration, **When** a transport node is rendered, **Then** format (indentation) is applied correctly.
2. **Given** the format application code, **When** inspected, **Then** it takes `kind_id: KindId` and `span: Option<Span>` directly — not `&NodeData`.

---

### User Story 3 — Eliminate render_dispatch + templates.rs render functions (Priority: P1)

The NodeData render path (`render_dispatch` → per-kind `render_xxx(node: &NodeData)` functions in `templates.rs`) is removed entirely. All rendering goes through the transport path (`render_transport_dispatch` → per-kind transport render functions).

**Why this priority**: Two parallel render paths = duplicated logic, duplicated maintenance, divergence risk (the separator bug was one such divergence). One path eliminates the entire class of parity issues.

**Independent Test**: After removing `render_dispatch` and templates.rs render functions, verify all existing tests and validators still pass. The engine's `EngineGrammar::render` trait method now routes through transport dispatch.

**Acceptance Scenarios**:

1. **Given** the render module, **When** inspected, **Then** no `render_dispatch` function exists.
2. **Given** `templates.rs`, **When** inspected, **Then** it contains only Askama template struct definitions (no `render_xxx` functions).
3. **Given** a `NodeData` input to the engine, **When** rendered, **Then** it is converted to template fields inline and rendered via `write_into(dest)` — same path as transport.
4. **Given** all validators and tests, **When** run, **Then** results are identical to pre-migration.

---

### User Story 4 — Remove node_data_from_transport (Priority: P2)

The `node_data_from_transport` bridge function is deleted. No render code path constructs `NodeData` from transport structs.

**Why this priority**: Dead code after US1-US3 land. Cleanup.

**Acceptance Scenarios**:

1. **Given** the codebase, **When** searched, **Then** `node_data_from_transport` does not exist.
2. **Given** `bridge.rs`, **When** inspected, **Then** it contains only field resolution helpers needed by the unified render path.

---

### User Story 5 — Nested trivia via render_with_trivia! macro (Priority: P1)

When a parent node renders a child that has `$trivia` attached, the child's trivia is emitted correctly — not just top-level trivia. Every `RenderableTransport::render_into` impl wraps rendering with a `render_with_trivia!` macro that checks `transport_trivia_data`.

**Why this priority**: Without this, nested trivia is silently dropped — a data loss bug.

**Acceptance Scenarios**:

1. **Given** a function with a body that has trivia attached, **When** the function is rendered, **Then** the body's trivia appears in the correct position within the function output.
2. **Given** any `RenderableTransport::render_into` impl, **When** inspected, **Then** it calls `render_with_trivia!(self, dest, render_xxx(self, dest))`.
3. **Given** the `render_with_trivia!` macro, **When** defined, **Then** it lives in `sittir-core` (shared, not generated).

---

### Edge Cases

- `EngineGrammar::render(&NodeData)` trait is still needed for the `ParsedTree::render_node_data` path (readNode-derived data). That path constructs templates directly from NodeData fields — no transport conversion.
- If a grammar adds a new metadata field in the future, it goes into `TransportTrivia`/format scalars — not into NodeData.
- The `render_canonical_node` function in `engine.rs` may become just `apply_format` after this spec.
- Bool/enum transport variants (keyword presence) don't have `transport_trivia_data` — the macro handles this via `Option` (always `None` for these).

## Requirements

### Functional Requirements

- **FR-001**: The napi entry point MUST read `$triviaData` directly from the JS object and pass `TransportTrivia` to the render function — no NodeData construction for trivia.
- **FR-002**: Format application MUST accept `KindId` and `Option<Span>` as parameters — not `&NodeData`.
- **FR-003**: `render_dispatch` (NodeData → per-kind render function → String) MUST be eliminated.
- **FR-004**: Per-kind `render_xxx(node: &NodeData)` functions in `templates.ts` MUST be removed — only template struct definitions remain.
- **FR-005**: `EngineGrammar::render` trait method MUST be updated to render via streaming (construct template from NodeData fields inline, call `write_into`).
- **FR-006**: `node_data_from_transport` MUST be removed after all callers are eliminated.
- **FR-007**: Trivia wrapping MUST occur AFTER format application at the top level (correct order: render → format → trivia).
- **FR-011**: Nested trivia MUST be applied during child rendering via `render_with_trivia!` macro in every `RenderableTransport::render_into` impl.
- **FR-012**: The `render_with_trivia!` macro MUST live in `sittir-core` (not generated) and handle `Option<TransportTrivia>` gracefully (no-op when `None`).
- **FR-013**: Format (indentation/whitespace) MUST be applicable to nested nodes by threading the `FormatRecord` + node `Span` through the render chain. Each child's `render_into` applies format using its own span within the parent's format context.
- **FR-014**: The render context (format config + trivia) MUST be threadable through Askama's template rendering — either via thread-local state, a context parameter on `RenderableTransport::render_into`, or a wrapper that intercepts `FastWritable::write_into`.
- **FR-008**: All existing validator counts MUST hold or improve.
- **FR-009**: `cargo build --release` MUST produce zero warnings.
- **FR-010**: Rendered output MUST be byte-identical for all corpus nodes.

### Key Entities

- **TransportTrivia**: `{ leading: Option<Vec<String>>, trailing: Option<Vec<String>> }` — trivia text, no NodeData.
- **FormatParams**: `(kind_id: KindId, span: Option<Span>)` — the two scalars needed for format application.
- **AnyTransport**: The transport enum — the ONLY render input after unification.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Bench-render heap-per-render metric decreases (no NodeData allocation in transport path).
- **SC-002**: `node_data_from_transport` does not exist in the codebase.
- **SC-003**: `render_dispatch` does not exist in the codebase.
- **SC-004**: `templates.rs` contains only `#[derive(Template)]` struct definitions — no functions.
- **SC-005**: All validator counts hold (native backend).
- **SC-006**: Zero Rust warnings.
- **SC-007**: Trivia order is correct: render → format → trivia (matching TS renderer).
