# Research: NodeData-Free Render Path

## R1: What render_canonical_node actually needs

**Decision**: Replace `render_canonical_node(&NodeData, String, Option<Format>)` with
`apply_render_format(kind_id: KindId, span: Option<Span>, canonical: String, format: Option<&Format>) → String`.

**Current callers**:
- `ParsedTree::render_node_data` — has `node.type_` and `node.span` from the NodeData it already holds
- `SittirEngine::render` (in lib.rs) — has transport, needs to extract kind_id + span

**What it reads from NodeData**:
- `node.type_` → KindId (for format rule lookup by kind)
- `node.span` → Option<Span> (for boundary/trivia offset detection)

Both are scalars available on the transport struct without NodeData construction.

## R2: How to get KindId from AnyTransport

**Decision**: Emit a `kind_id()` method on `AnyTransport` — one match arm per variant returning the compile-time KindId constant.

**Alternative**: Read `$type` from the JS object before constructing AnyTransport, pass as separate param. Simpler but doesn't leverage the type information already in the enum.

**Emitter impact**: New function in `renderTransportDispatchFn` that matches each variant → returns its KindId. ~700 match arms (generated, trivial).

## R3: How to get Span from AnyTransport

**Decision**: Emit a `span()` method on `AnyTransport` that extracts `transport_span` from each variant.

**Challenge**: Not all variants have the same shape — `bool` variants (keyword presence) and enum variants don't have `transport_span`. For these, return `None`.

**Alternative**: Read `$span` from JS object before constructing AnyTransport. Avoids the match but adds a param.

Recommended: read from JS object (simpler, no 700-arm match). The napi entry point reads `$span` and `$type` as separate scalars alongside the transport construction.

## R4: EngineGrammar::render trait — what changes?

**Decision**: Keep `EngineGrammar::render(&NodeData) → Result<String>` for the readNode path. The trait still exists. What changes is that the TRANSPORT render path no longer calls it.

**Current trait impl**:
```rust
impl EngineGrammar for RustGrammar {
    fn render(self, node: &NodeData) -> Result<String, String> {
        render_dispatch(node).map_err(|e| e.to_string())
    }
}
```

After removing `render_dispatch`, this becomes:
```rust
fn render(self, node: &NodeData) -> Result<String, String> {
    let mut buf = String::new();
    render_nodedata_into(node, &mut buf)?;
    Ok(buf)
}
```

Where `render_nodedata_into` constructs the template from NodeData fields inline and calls `write_into(dest)`. This is the NodeData path for readNode — it stays but uses streaming.

## R5: Trivia order (render → format → trivia)

**Decision**: Correct order is:
1. `render_transport_dispatch(&transport)` → canonical rendered text
2. `apply_render_format(kind_id, span, canonical, format)` → formatted text
3. Wrap with trivia (prepend leading, append trailing)

This matches the TS renderer behavior. The current `render_node_data` applies format BEFORE trivia — correct. The transport path must do the same.

## R6: What stays in bridge.rs after node_data_from_transport is removed?

**Decision**: `bridge.rs` keeps:
- `ResolvedField` struct + `resolve_field` / `resolve_children` — still needed by the NodeData render path (`render_nodedata_into`)
- `separator_for` — still needed by both paths
- `variant_for` — still needed

Only `node_data_from_transport` and `transport_node_data` (the constructors) are removed.
