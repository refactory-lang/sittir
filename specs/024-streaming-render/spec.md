# Feature Specification: Render Pipeline Cleanup & Streaming

**Feature Branch**: `024-streaming-render`
**Created**: 2026-05-06
**Status**: Draft
**Input**: ADR 0019 — streaming render, code smell elimination, file organization.

## User Scenarios & Testing

### User Story 1 — Transport render streams directly (Priority: P1)

Transport render functions write to `dest` instead of allocating and returning `String`. Minimal surgery: change signature + swap `template.render()` → `template.write_into(dest)`.

**Acceptance Scenarios**:

1. **Given** any transport render function, **When** rendering, **Then** it takes `dest: &mut dyn fmt::Write` and calls `template.write_into(dest)`.
2. **Given** `RenderableTransport::render_into`, **When** called, **Then** it passes `dest` through to the transport function (no intermediate String).
3. **Given** rendered output, **When** compared to pre-migration, **Then** byte-identical.

---

### User Story 2 — File split: templates.rs → 4 files (Priority: P1)

Split the ~40K-line `templates.rs` monolith per grammar into focused files.

**Acceptance Scenarios**:

1. **Given** each grammar crate, **When** the render module is inspected, **Then** it has `dispatch.rs`, `transport.rs`, `templates.rs`, `bridge.rs`.
2. **Given** the split, **When** built, **Then** no behavioral change — same rendered output.

---

### User Story 3 — Module-level `use` imports (Priority: P1)

Replace 2000+ fully-qualified `::sittir_core::filters::` paths with module-level `use` imports.

**Acceptance Scenarios**:

1. **Given** generated render files, **When** inspected, **Then** `use sittir_core::{filters, types}` imports appear at the top.
2. **Given** inline code, **When** referencing core types, **Then** short names like `Renderable::Transport(...)` are used.

---

### User Story 4 — Remove redundant trait object casts (Priority: P2)

Drop `as &dyn RenderableTransport` where Rust auto-coercion works.

**Acceptance Scenarios**:

1. **Given** transport field references in template construction, **When** the concrete type implements `RenderableTransport`, **Then** no explicit `as &dyn` cast is emitted.

---

### User Story 5 — Zero warnings on Rust build (Priority: P1)

Deduplicate match arms for alias-collapsed kinds. Eliminate dead render functions.

**Acceptance Scenarios**:

1. **Given** `cargo build --release`, **When** run on all three grammar crates, **Then** zero warnings.
2. **Given** alias-collapsed kinds sharing KindId, **When** dispatch emitted, **Then** one arm with comment listing both names.

---

### User Story 6 — Trivia transport without serde_json (Priority: P1)

Replace `Option<serde_json::Value>` on transport structs with `TransportTrivia { leading: Option<Vec<String>>, trailing: Option<Vec<String>> }`.

**Acceptance Scenarios**:

1. **Given** transport structs, **When** inspected, **Then** no `serde_json` dependency for trivia.
2. **Given** trivia attached via `$trivia()`, **When** rendered through native transport, **Then** trivia text appears correctly.

---

### User Story 7 — Inline trivia writes (Priority: P2)

Trivia render writes `$text` directly to dest — no `render_trivia_items`, no `Vec<String>`, no `format!`.

**Acceptance Scenarios**:

1. **Given** a node with leading trivia, **When** rendered, **Then** each trivia item's text is written directly via `dest.write_str()`.

---

### User Story 8 — DRY: consolidate buffer emission (Priority: P2)

Merge `emitSingleChildBuffer` and `emitListSlotBuffer` in the emitter — they emit near-identical patterns.

**Acceptance Scenarios**:

1. **Given** the emitter, **When** inspected, **Then** one shared helper generates the `.map(|t| Renderable::Transport(t)).collect()` pattern.

---

### User Story 9 — Decompose oversized emitter functions (Priority: P3)

Break `renderDirectSupport` (512 lines), `renderTypedDispatch` (146 lines) into focused sub-functions.

---

### User Story 10 — Shared transport metadata via macro (Priority: P1)

The 7 metadata fields (`$source`, `$named`, `$text`, `$span`, `$nodeHandle`, `$childIndex`, `$triviaData`) repeated on every transport struct (700+) are extracted into a `transport_metadata_fields!()` macro in `sittir-core`.

**Acceptance Scenarios**:

1. **Given** any transport struct, **When** inspected, **Then** it calls `transport_metadata_fields!()` instead of listing 7 fields inline.
2. **Given** the macro, **When** defined, **Then** it lives in `sittir-core` (not generated).
3. **Given** a new metadata field added in the future, **When** added to the macro, **Then** all 700+ structs pick it up automatically.

---

### Edge Cases

- Zero alias-collapsed kinds → deduplication is a no-op.
- `write_into` failure mid-render → error propagates via `Result`.
- Grammar with no transport structs → file split still works (empty transport.rs).

## Requirements

### Functional Requirements

- **FR-001**: Transport render functions MUST write via `template.write_into(dest)` instead of `template.render()`.
- **FR-002**: Generated render modules MUST be split into `dispatch.rs`, `transport.rs`, `templates.rs`, `bridge.rs`.
- **FR-003**: Generated code MUST use module-level `use` imports for `sittir_core` types.
- **FR-004**: Redundant `as &dyn RenderableTransport` casts MUST be eliminated.
- **FR-005**: `cargo build --release` MUST produce zero warnings for all grammar crates.
- **FR-006**: Trivia transport MUST use `TransportTrivia { leading: Option<Vec<String>>, trailing: Option<Vec<String>> }` — no `serde_json`.
- **FR-007**: Trivia rendering MUST write text directly to dest — no intermediate allocation.
- **FR-008**: Duplicate buffer emission logic MUST be consolidated into one helper.
- **FR-009**: Rendered output MUST be byte-identical before/after for all corpus nodes.
- **FR-010**: ALL changes MUST be in the emitter (`render-module.ts`) — no hand-editing generated Rust.

## Success Criteria

### Measurable Outcomes

- **SC-001**: `cargo build --release` produces zero warnings across all three grammar crates.
- **SC-002**: Rendered output is byte-identical for all corpus nodes.
- **SC-003**: No `serde_json::Value` appears in transport struct definitions.
- **SC-004**: No `as &dyn RenderableTransport` casts in generated code.
- **SC-005**: No `::sittir_core::filters::` fully-qualified paths in generated code (use imports instead).
- **SC-006**: `templates.rs` per grammar is under 25K lines (split into 4 files).
- **SC-007**: All existing validator counts hold.
