// @generated from packages/rust/node-model.json5 and packages/rust/templates/*.jinja — do not hand-edit.
// Regenerate via: npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src
//
// render_dispatch match table — routes KindId to per-kind render functions
// in the sibling templates module.

#![allow(dead_code, unused_imports, non_snake_case, non_camel_case_types, unused_mut, unused_variables)]

use ::sittir_core::filters::{
    SingleNonterminalView, ListNonterminalView,
    OptionalNonterminalView,
};
use ::sittir_core::types::{
    NodeData, FieldValue, OneOrMany, RenderableTransport, Source, Span, NodeTrivia, TransportTrivia,
};

#[cfg(feature = "napi-bindings")]
use ::napi_derive::napi;

use super::bridge::render_nodedata_into;

pub fn render_dispatch(node: &NodeData) -> Result<String, ::askama::Error> {
    let mut buf = String::new();
    render_nodedata_into(node, &mut buf)?;
    Ok(buf)
}
