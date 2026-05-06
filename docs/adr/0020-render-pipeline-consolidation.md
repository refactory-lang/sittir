# ADR 0020 — Render Pipeline Consolidation

**Status**: Accepted (partially shipped on branch 024-streaming-render)
**Date**: 2026-05-06
**Related**: ADR 0019, specs/024-streaming-render/

## Context

The native render pipeline accumulated architectural debt over specs
012–023. A comprehensive audit (spec 024) revealed:

- **109K-line monolith** — each grammar's `templates.rs` was 23K–44K lines
- **Dual render paths** — `render_dispatch` (NodeData → String) and
  `render_transport_dispatch` (Transport → streaming) coexisted with
  duplicated per-kind logic
- **Transport separator bug** — 138 kinds rendered without separators
  through the transport path (missing `,` in parameter lists, field
  declarations, etc.)
- **82 Rust warnings** — unreachable match arms from alias-collapsed kinds
- **2000+ fully-qualified paths** — `::sittir_core::filters::Renderable`
  repeated thousands of times
- **700+ redundant casts** — `as &dyn RenderableTransport` where auto-coercion works
- **`serde_json::Value` on transport** — heavyweight JSON dependency for
  trivia (just `Vec<String>`)
- **Repeated metadata fields** — 7 identical fields × 700 transport structs
- **Circular `render_into` impls** — `render_into` called `render_xxx_transport`
  which allocated String then wrote it to dest

## Decisions

### 1. Streaming transport render (shipped)

Transport render functions take `dest: &mut dyn fmt::Write` and call
`template.render_into(dest)` directly. Eliminates one `String` allocation
per node in the transport render path.

**Before**: `let s = render_xxx_transport(self)?; dest.write_str(&s)`
**After**: `render_xxx_transport(self, dest)`

### 2. File split (shipped)

Split `templates.rs` per grammar into 4 focused files:

| File | Responsibility | Lines (rust) |
|---|---|---|
| `templates.rs` | Askama template structs + NodeData render fns | 4.7K |
| `transport.rs` | AnyTransport enum + napi + transport render | 35K |
| `dispatch.rs` | `render_dispatch` match table | 217 |
| `bridge.rs` | Field/child resolution helpers | 443 |

### 3. Module-level use imports (shipped)

Replaced 2000+ `::sittir_core::filters::Renderable` paths with
module-level `use` imports. Exception: `Renderable` stays qualified
in the transport path because a local enum of the same name exists
in the NodeData path.

### 4. Zero warnings (shipped)

Deduplicated match arms for alias-collapsed kinds sharing the same
KindId. From 82 warnings to 0 across all three grammar crates.

### 5. TransportTrivia without serde_json (shipped)

`TransportTrivia { leading: Option<Vec<String>>, trailing: Option<Vec<String>> }`
replaces `Option<serde_json::Value>`. Manual `FromNapiValue` reads `$text`
from each trivia item. No JSON dependency in the transport layer.

### 6. Transport separator fix (shipped)

`collectMetaData` widened to derive separators from ALL `AssembledBranch`
nodes via `findRepeatSeparator(simplifiedRule)`, not just container-shaped
ones. Separator entries: rust 11→25, typescript grew to 20, python to 36.
138 → 118 empty separators (remaining are genuinely non-list kinds).

### 7. Native backend for RT validation (shipped)

RT validator switched from JS Nunjucks render to native `render_dispatch`.
Results strictly improved: rust +3, typescript +9, python +7 rtPass.
The native NodeData render path is more correct than the JS template path.

### 8. Trivia inlining (shipped)

Replaced `render_trivia_items` (collects `Vec<String>`, joins with `\n`,
`format!()` concatenation) with direct `push_str` to a String buffer.
Zero intermediate allocations for trivia.

### 9. Emitter DRY (shipped)

- Consolidated `emitSingleChildBuffer` / `emitListSlotBuffer` into shared
  `emitIterCollectBuffer` helper
- Decomposed `renderDirectSupport` (512 lines) into 4 focused functions

## Follow-up work (not yet shipped)

### A. Eliminate NodeData render path entirely

The NodeData path (`render_dispatch` → per-kind `render_xxx` in
`templates.rs`) duplicates the transport path. Both construct the same
Askama template structs. Unification:

- `render_dispatch(node: &NodeData) → String` becomes a thin wrapper:
  `let mut buf = String::new(); render_dispatch_into(node, &mut buf)?;`
- `render_dispatch_into` constructs the template from NodeData fields
  and calls `write_into(dest)` — same streaming as transport
- Per-kind `render_xxx` functions in `templates.rs` are deleted
- Template struct definitions move to transport.rs (or a shared
  struct-only file)
- `templates.rs` is eliminated entirely

### B. Per-field separators

Currently separators are per-kind (`separator_for(kind_id)`). Kinds with
multiple list fields that have different separators (e.g., one field
comma-separated, another semicolon-separated) use the same separator for
all fields. The correct model: per-field separator metadata, looked up by
`(kind_id, field_name)`.

### C. Remaining 118 empty separators

Audit whether any of the 118 `separator: ""` transport entries are bugs
vs genuinely non-list kinds. The `findRepeatSeparator` heuristic may miss
separators in complex rule shapes (nested choices, optional wrappers).

### D. Transport struct metadata macro

`macro_rules!` expansion inside `#[napi(object)]` structs doesn't work
(proc macros run before macro expansion). The emitter-level deduplication
via `TRANSPORT_METADATA_FIELDS` constant is the current solution. If napi
adds support for helper attributes or field includes, revisit.

## Consequences

- **Native render is now the correctness baseline** — JS Nunjucks path
  is secondary/fallback
- **Transport path streams** — zero per-node String allocation for transport
  renders
- **Zero warnings** — `cargo build --release` is clean
- **File split enables independent work** — dispatch, transport, templates,
  bridge can be modified independently
- **Transport separator bug partially fixed** — 20 kinds corrected, 118
  remaining (most correct, some may need per-field separators)
