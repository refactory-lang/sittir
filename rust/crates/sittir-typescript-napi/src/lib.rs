//! `@sittir/typescript-native` — napi binding for the TypeScript grammar engine.
//!
//! Exact clone of `sittir-rust-napi` — only the grammar language +
//! render crate imports differ. See that crate's module docs for the
//! full contract notes, the `find_and_read` deferral rationale (ast-grep
//! version-conflict), and the delegation layering.
//!
//! Grammar binding: `tree_sitter_typescript::LANGUAGE_TYPESCRIPT`
//! (not `LANGUAGE_TSX`; TSX is a separate grammar + separate
//! `@sittir/tsx-native` crate should it ever be needed).
//! Render dispatcher: `sittir_typescript_render::render_dispatch`.

use napi::bindgen_prelude::*;
use napi_derive::napi;
use sittir_core::prepare::{build_template_context, RenderDispatch};
use sittir_core::splice::apply_edits as splice_apply_edits;
use sittir_core::types::{Edit, NodeData};
use sittir_typescript_render::{render_dispatch, TypescriptGrammarMeta, TEMPLATE_BUNDLE_HASH};

#[napi]
pub struct SittirEngine {
    parser: tree_sitter::Parser,
    source: Option<String>,
    tree: Option<tree_sitter::Tree>,
    next_node_id: u32,
}

#[napi]
impl SittirEngine {
    #[napi(constructor)]
    pub fn new() -> Result<Self> {
        let mut parser = tree_sitter::Parser::new();
        let language: tree_sitter::Language = tree_sitter_typescript::LANGUAGE_TYPESCRIPT.into();
        parser
            .set_language(&language)
            .map_err(|e| Error::from_reason(format!("failed to set parser language: {e}")))?;
        Ok(SittirEngine {
            parser,
            source: None,
            tree: None,
            next_node_id: 0,
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

    #[napi]
    pub fn read_node(&mut self, node_id: u32) -> Result<String> {
        let tree = self
            .tree
            .as_ref()
            .ok_or_else(|| Error::from_reason("no tree cached — call findAndRead first"))?;
        let source = self
            .source
            .as_ref()
            .ok_or_else(|| Error::from_reason("no source cached — call findAndRead first"))?;
        let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
            let mut local_counter: u32 = self.next_node_id;
            let data = sittir_core::read_node::read_node(
                tree,
                source,
                Some(node_id),
                &mut local_counter,
            );
            (data, local_counter)
        }));
        match result {
            Ok((data, advanced)) => {
                self.next_node_id = advanced;
                serde_json::to_string(&data)
                    .map_err(|e| Error::from_reason(format!("serialize NodeData failed: {e}")))
            }
            Err(panic_payload) => {
                let msg = if let Some(s) = panic_payload.downcast_ref::<String>() {
                    s.clone()
                } else if let Some(s) = panic_payload.downcast_ref::<&str>() {
                    s.to_string()
                } else {
                    format!("node id {node_id} not found in current tree")
                };
                Err(Error::from_reason(msg))
            }
        }
    }

    #[napi]
    pub fn render(&self, node_json: String) -> Result<String> {
        let node: NodeData = serde_json::from_str(&node_json)
            .map_err(|e| Error::from_reason(format!("parse NodeData JSON failed: {e}")))?;
        let meta = TypescriptGrammarMeta;
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
