# ADR 0019 — Streaming Render Architecture

**Status**: Proposed
**Date**: 2026-05-06
**Related**: specs/023-scm-role-extraction/, spec 020 (render pipeline optimization)

## Context

The native render engine has two coexisting architectures:

1. **`render_dispatch(node) → Result<String>`** — per-kind functions call
   `template.render()` which allocates a `String`. Each nested node
   allocates its own String, passed up the call stack. Used by
   `render_node_data()`.

2. **`render_transport_dispatch(transport, dest: &mut dyn Write)`** —
   writes directly to an output buffer. Leaf transports write with zero
   allocation (`dest.write_str("async")`). Branch transports still
   render templates to String then `dest.write_str(&s)`.

The transport path is already partially streaming. The non-transport path
allocates at every level of the tree. Trivia rendering (spec 023) added
`render_trivia_items()` which collects into `Vec<String>` — consistent
with the non-transport path but suboptimal.

## Decision

Migrate the render engine to fully streaming `write_into(dest)` in three
phases:

### Phase 1: Trivia inlining (immediate)

Trivia items are always leaves with `$text`. The trivia render path
should inline the write — no function call, no allocation, no dispatch:

```rust
if let Some(ref trivia) = node.trivia_data {
    if let Some(ref leading) = trivia.leading {
        for item in leading {
            dest.write_str(item.text.as_deref().unwrap_or(""))?;
            dest.write_str("\n")?;
        }
    }
}
// ... render node to dest ...
if let Some(ref trivia) = node.trivia_data {
    if let Some(ref trailing) = trivia.trailing {
        for item in trailing {
            dest.write_str("\n")?;
            dest.write_str(item.text.as_deref().unwrap_or(""))?;
        }
    }
}
```

No `render_trivia_items()` function. No `Vec<String>`. No `format!()`.
Comments don't go through template dispatch — they're raw text writes.

### Phase 2: Template streaming

Change per-kind render functions from `template.render() → String` to
`template.write_into(dest) → Result<()>`:

```rust
// Before:
fn render_function_item(node: &NodeData) -> Result<String, Error> {
    let template = FunctionItemTemplate { ... };
    template.render()
}

// After:
fn render_function_item(node: &NodeData, dest: &mut dyn Write) -> Result<(), Error> {
    let template = FunctionItemTemplate { ... };
    template.write_into(dest)
}
```

This eliminates the String allocation at each tree level. Askama already
supports `write_into` — the templates don't change, only the call site.

### Phase 3: Unified dispatch

Merge `render_dispatch` and `render_transport_dispatch` into one
streaming path. The transport `FromNapiValue` produces the same
`NodeData` shape — no reason for separate dispatch tables.

```rust
pub fn render_into(node: &NodeData, dest: &mut dyn Write) -> Result<(), Error> {
    // trivia leading...
    // template write_into...
    // trivia trailing...
}
```

Callers needing a String: `let mut buf = String::new(); render_into(node, &mut buf)?;`

## Consequences

- **Phase 1**: Zero-allocation trivia. ~10 line change.
- **Phase 2**: Eliminates one `String` allocation per tree node in the
  render path. ~200 function signature changes per grammar (generated
  by codegen — one emitter change).
- **Phase 3**: One dispatch table instead of two. Simplifies the render
  module emitter.

## Migration order

Phase 1 lands with the trivia follow-up. Phases 2+3 are a separate
spec (render perf optimization) — they touch every per-kind render
function and the emitter that generates them.

## Alternatives considered

- **Keep `String` returns everywhere** — simpler API, but 6-7x more
  allocations than streaming. Already measured: native is 5-7x faster
  than JS despite the allocations, so this isn't blocking, but it's
  leaving performance on the table.
- **`Cow<'_, str>` returns** — partial: avoids clones for leaf text but
  still allocates for branch renders. Half-measure that adds complexity.
- **Arena allocator** — allocates from a bump arena per render call,
  freed in bulk. Good for throughput but adds lifetime complexity.
  Streaming is simpler and achieves similar reduction.
