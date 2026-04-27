//! `@sittir/python-native` — napi binding for the Python grammar engine.
//!
//! Exact clone of `sittir-rust-napi` — only the grammar language +
//! render crate imports differ. See that crate's module docs for the
//! full contract notes, the `find_and_read` deferral rationale (ast-grep
//! version-conflict), and the delegation layering.
//!
//! Grammar binding: `tree_sitter_python::LANGUAGE`.
//! Render dispatcher: `sittir_python_render::render_dispatch`.

use napi::bindgen_prelude::*;
use napi_derive::napi;
use sittir_core::prepare::{build_template_context, RenderDispatch};
use sittir_core::splice::apply_edits as splice_apply_edits;
use sittir_core::types::{Edit, NodeData};
use sittir_python_render::{render_dispatch, PythonGrammarMeta, TEMPLATE_BUNDLE_HASH};

#[napi]
pub struct SittirEngine {
    parser: tree_sitter::Parser,
    source: Option<String>,
    tree: Option<tree_sitter::Tree>,
}

#[napi]
impl SittirEngine {
    #[napi(constructor)]
    pub fn new() -> Result<Self> {
        let mut parser = tree_sitter::Parser::new();
        let language: tree_sitter::Language = tree_sitter_python::LANGUAGE.into();
        parser
            .set_language(&language)
            .map_err(|e| Error::from_reason(format!("failed to set parser language: {e}")))?;
        Ok(SittirEngine {
            parser,
            source: None,
            tree: None,
        })
    }

    #[napi(getter)]
    pub fn template_bundle_hash(&self) -> &'static str {
        TEMPLATE_BUNDLE_HASH
    }

    #[napi]
    pub fn find_and_read(&mut self, _source: String, _pattern: String) -> Result<String> {
        Err(Error::from_reason(
            "find_and_read not yet implemented — ast-grep-core integration pending",
        ))
    }

    /// See sittir-rust-napi::parse_and_read for the full doc.
    #[napi]
    pub fn parse_and_read(&mut self, source: String) -> Result<String> {
        let tree = self
            .parser
            .parse(&source, None)
            .ok_or_else(|| Error::from_reason("parse failed"))?;
        self.source = Some(source.clone());
        self.tree = Some(tree.clone());
        let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
            sittir_core::read_node::read_node(
                self.tree.as_ref().unwrap(),
                self.source.as_ref().unwrap(),
                None,
            )
        }));
        match result {
            Ok(data) => serde_json::to_string(&data)
                .map_err(|e| Error::from_reason(format!("serialize NodeData failed: {e}"))),
            Err(panic_payload) => Err(Error::from_reason(panic_msg(panic_payload, "parse_and_read panicked"))),
        }
    }

    #[napi]
    pub fn read_node(&mut self, node_id: f64) -> Result<String> {
        let tree = self
            .tree
            .as_ref()
            .ok_or_else(|| Error::from_reason("no tree cached — call parseAndRead first"))?;
        let source = self
            .source
            .as_ref()
            .ok_or_else(|| Error::from_reason("no source cached — call parseAndRead first"))?;
        let id = sittir_core::boundary::coerce_node_id(node_id)
            .map_err(|msg| Error::from_reason(msg))?;
        let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
            sittir_core::read_node::read_node(tree, source, Some(id))
        }));
        match result {
            Ok(data) => serde_json::to_string(&data)
                .map_err(|e| Error::from_reason(format!("serialize NodeData failed: {e}"))),
            Err(panic_payload) => Err(Error::from_reason(panic_msg(panic_payload, &format!("node id {id} not found in current tree")))),
        }
    }

    #[napi]
    pub fn render(&self, node_json: String) -> Result<String> {
        let node: NodeData = serde_json::from_str(&node_json)
            .map_err(|e| Error::from_reason(format!("parse NodeData JSON failed: {e}")))?;
        let meta = PythonGrammarMeta;
        let dispatch: RenderDispatch = render_dispatch;
        let ctx = build_template_context(&node, &meta, dispatch)
            .map_err(|e| Error::from_reason(format!("build template context failed: {e}")))?;
        dispatch(&node.type_, &ctx)
            .map_err(|e| Error::from_reason(format!("render_dispatch failed: {e}")))
    }

    #[napi]
    pub fn apply_edits(&self, source: String, edits: Vec<Edit>) -> Result<String> {
        splice_apply_edits(&source, edits).map_err(|e| Error::from_reason(format!("{e}")))
    }
}

fn panic_msg(payload: Box<dyn std::any::Any + Send>, fallback: &str) -> String {
    if let Some(s) = payload.downcast_ref::<String>() {
        s.clone()
    } else if let Some(s) = payload.downcast_ref::<&str>() {
        s.to_string()
    } else {
        fallback.to_string()
    }
}

