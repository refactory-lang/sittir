//! Spec 012 T058 — micro-benchmark for the render hot path.
//!
//! Measures `sittir_core::prepare::render` over a moderately-deep
//! synthetic NodeData with a stub `RenderDispatch` + `GrammarMeta`.
//! The goal is intra-Rust regression detection — comparing the Rust
//! engine to the TS engine is the parity harness's job (T047/T049).
//!
//! `sittir-core` cannot depend on the per-grammar render crates (they
//! depend on it), so the bench builds the NodeData by hand and uses a
//! pass-through dispatcher that returns each node's `$text` (or the
//! pre-rendered children string for branches). That covers the
//! template-context construction + recursion code paths without
//! pulling in askama's per-kind structs — exactly the surface this
//! bench is here to track.

use std::collections::HashMap;

use criterion::{black_box, criterion_group, criterion_main, Criterion};
use sittir_core::prepare::{render, GrammarMeta, RenderDispatch, TemplateContext};
use sittir_core::types::{FieldValue, NodeData, Source};

/// Stub `GrammarMeta` — every kind is a non-list scalar, no separators,
/// no variant labels. Matches what a fully-anonymous grammar would
/// look like; sufficient for benching the recursion code path.
struct StubMeta;

impl GrammarMeta for StubMeta {
    fn separator_for(&self, _kind: &str) -> Option<&str> {
        None
    }
    fn variant_for(&self, _parent_kind: &str, _child_kind: &str) -> Option<&str> {
        None
    }
    fn is_list_container(&self, _kind: &str) -> bool {
        false
    }
}

/// Stub dispatcher: returns the children string concatenated with the
/// node's text. Skips askama entirely — the bench's purpose is to
/// measure the `build_template_context` walk, not template rendering.
fn stub_dispatch(_kind: &str, ctx: &TemplateContext) -> Result<String, askama::Error> {
    let mut out = String::with_capacity(64);
    out.push_str(&ctx.text);
    out.push_str(&ctx.children);
    Ok(out)
}

/// Build a synthetic NodeData of the requested depth. Each level has
/// one named field (`name` → leaf identifier) plus `breadth` named
/// children that recursively expand. The total node count grows like
/// `breadth^depth` — keep both small for a steady micro-bench.
fn build_node(depth: u32, breadth: u32) -> NodeData {
    if depth == 0 {
        return NodeData {
            type_: "identifier".to_string(),
            source: Source::Factory,
            named: true,
            fields: None,
            children: None,
            text: Some("x".to_string()),
            span: None,
            node_id: None,
        };
    }
    let mut fields = HashMap::new();
    fields.insert(
        "name".to_string(),
        FieldValue::Single(Box::new(NodeData {
            type_: "identifier".to_string(),
            source: Source::Factory,
            named: true,
            fields: None,
            children: None,
            text: Some(format!("n{depth}")),
            span: None,
            node_id: None,
        })),
    );
    let mut children = Vec::with_capacity(breadth as usize);
    for _ in 0..breadth {
        children.push(build_node(depth - 1, breadth));
    }
    NodeData {
        type_: "branch".to_string(),
        source: Source::Factory,
        named: true,
        fields: Some(fields),
        children: Some(children),
        text: None,
        span: None,
        node_id: None,
    }
}

fn bench_render(c: &mut Criterion) {
    let dispatch: RenderDispatch = stub_dispatch;
    let meta = StubMeta;

    // Three sizes — track scaling alongside the absolute timing.
    for (depth, breadth, label) in
        [(2u32, 3u32, "shallow"), (3u32, 3u32, "medium"), (4u32, 3u32, "deep")]
    {
        let node = build_node(depth, breadth);
        c.bench_function(&format!("render-{label}"), |b| {
            b.iter(|| {
                let _ = render(black_box(&node), &meta, dispatch).unwrap();
            });
        });
    }
}

criterion_group!(benches, bench_render);
criterion_main!(benches);
