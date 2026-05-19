// @generated from packages/python/node-model.json5 and packages/python/templates/*.jinja — do not hand-edit.
// Regenerate via: npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src
//
// Legacy direct NodeData render shim. Normal native package flow renders
// typed transport payloads through render_transport_dispatch; this module
// remains for compatibility with internal NodeData-based engine paths.

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

/// Legacy direct NodeData render entrypoint.
///
/// Normal native package flow uses typed transport plus
/// `render_transport_dispatch`; keep this only for compatibility
/// with internal NodeData-based engine paths.
pub fn render_dispatch(node: &NodeData) -> Result<String, ::askama::Error> {
    let mut buf = String::new();
    render_nodedata_into(node, &mut buf)?;
    Ok(buf)
}
