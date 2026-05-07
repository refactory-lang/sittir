# Tasks: Render Pipeline Cleanup & Streaming

**Input**: Design documents from `/specs/024-streaming-render/`
**Prerequisites**: plan.md, spec.md, research.md

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Streaming transport render (US1 + US6)

- [ ] T001 [US1] Change transport render function signatures in `packages/codegen/src/emitters/render-module.ts` — `fn render_xxx_transport(...) -> Result<String>` → `fn render_xxx_transport(..., dest: &mut dyn fmt::Write) -> Result<()>`. Swap `template.render()` → `template.write_into(dest)`. Leaf/enum variants: `dest.write_str(...)` instead of `Ok(string)`.
- [ ] T002 [US1] Update `RenderableTransport::render_into` impls in emitter — pass `dest` through to transport function instead of `let s = fn(self)?; dest.write_str(&s)`.
- [ ] T003 [US1] Update `render_transport_dispatch` in emitter — callers pass `dest` to transport functions instead of collecting String.
- [ ] T004 [US6] Replace `transport_trivia_data: Option<serde_json::Value>` with `TransportTrivia { leading: Option<Vec<String>>, trailing: Option<Vec<String>> }` in `rust/crates/sittir-core/src/types.rs`. Update napi FromNapiValue to read `$triviaData.leading[*].$text`.
- [ ] T005 Regen all grammars + `cargo check` — zero errors. `pnpm -r run type-check` clean. Counts hold.

---

## Phase 2: Transport metadata macro (US10)

- [ ] T006 [US10] Define `transport_metadata_fields!()` macro in `rust/crates/sittir-core/src/types.rs` — the 7 shared metadata fields (`$source`, `$named`, `$text`, `$span`, `$nodeHandle`, `$childIndex`, `$triviaData`).
- [ ] T007 [US10] Update emitter to call `transport_metadata_fields!()` per struct instead of emitting 7 fields inline — in `packages/codegen/src/emitters/render-module.ts`.
- [ ] T008 Regen all grammars + `cargo check` — zero errors.

---

## Phase 3: Module-level use imports + cast cleanup (US3 + US4)

- [ ] T009 [P] [US3] Emit `use sittir_core::{filters, types}` block at top of each generated render file in `packages/codegen/src/emitters/render-module.ts`. Replace all `::sittir_core::filters::Renderable` → `Renderable`, etc.
- [ ] T010 [P] [US4] Remove `as &dyn RenderableTransport` casts from transport field references in emitter — where concrete type already implements the trait.
- [ ] T011 Regen all grammars + `cargo check` — zero errors. Verify no `::sittir_core::filters::` in generated output.

---

## Phase 4: File split (US2)

- [ ] T012 [US2] Update `RustRenderModuleEmit` return type in emitter to produce 4 file strings instead of 1 — `dispatch`, `transport`, `templates`, `bridge`.
- [ ] T013 [US2] Split emitter output: `dispatch.rs` (render_dispatch match table), `transport.rs` (AnyTransport enum + FromNapiValue + transport dispatch), `templates.rs` (per-kind Template structs + render functions), `bridge.rs` (transport_node_data + field/child resolution helpers).
- [ ] T014 [US2] Update `mod.rs` emission to re-export from new files. Update CLI file-write logic to write 4 files per grammar.
- [ ] T015 Regen all grammars + `cargo check` + counts. Verify each file < 25K lines.

---

## Phase 5: Zero warnings (US5)

- [ ] T016 [US5] Deduplicate match arms in `render_dispatch` — when 2+ kinds share a KindId, emit one arm with comment listing both names.
- [ ] T017 [US5] Skip emission of dead render functions for alias-collapsed kinds that are never reachable from dispatch.
- [ ] T018 Regen all grammars + `cargo build --release` — zero warnings. `cargo build --release 2>&1 | grep warning | wc -l` = 0.

---

## Phase 6: Trivia inlining + DRY (US7 + US8)

- [ ] T019 [US7] Inline trivia writes in `rust/crates/sittir-core/src/engine.rs` — replace `render_trivia_items` with direct `dest.write_str(item.text)` loop. Remove `render_trivia_items` function.
- [ ] T020 [US8] Consolidate `emitSingleChildBuffer` and `emitListSlotBuffer` into one shared helper in emitter.
- [ ] T021 Regen + verify — trivia tests pass, counts hold.

---

## Phase 7: Polish (US9)

- [ ] T022 [US9] Decompose `renderDirectSupport` (512 lines) — extract `renderVariantDispatch`, `renderFieldResolution` sub-functions.
- [ ] T023 Remove stale "legacy" comment about string-tagged transport enums in render-module.ts.
- [ ] T024 Final verification — `cargo build --release` zero warnings, all counts hold, type-check clean, bench-render shows reduced heap-per-render.

---

## Dependencies

```
T001-T003 (streaming) → T005 (verify)
T004 (TransportTrivia) → T005 (verify)
T006-T007 (macro) → T008 (verify)
T009, T010 can run in parallel (use imports + cast cleanup)
T012-T014 (file split) depends on T009 (imports needed before split)
T016-T017 (warnings) independent of file split
T019-T020 (trivia + DRY) independent
T022-T024 (polish) last
```

## Implementation Strategy

**MVP**: Phases 1-3 (T001-T011). Streaming transport + serde_json removal + clean imports. ~200 emitter lines changed.

**Full**: Add Phases 4-7 (T012-T024). File split + zero warnings + trivia inline + decomposition.

**Suggested parallel execution**:
- T009 + T010 (imports + casts — different concerns in same file)
- T016 + T019 (warning dedup + trivia inline — different files)
