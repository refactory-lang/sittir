//! `@sittir/rust-native` — napi binding for the Rust grammar engine.
//!
//! Thin boundary shim. All heavy lifting delegates to `sittir-core` +
//! `sittir-rust-render`. Mirrors contracts/napi-api.md § "Exported class:
//! SittirEngine" and data-model.md §4.
//!
//! Grammar is implicit in crate identity — no runtime language field.
//! The parser is constructed with `tree_sitter_rust::LANGUAGE` in
//! `new()`; the render dispatcher is bound to
//! `sittir_rust_render::render_dispatch`.
//!
//! # Scope caveat (T033)
//!
//! `find_and_read(source, pattern)` is currently stubbed because
//! `ast-grep-core` is deferred (see `sittir-core/Cargo.toml` comments:
//! every `ast-grep-core` release ≥0.40 pulls `tree-sitter = ^0.26.3`
//! which conflicts with the three grammar crates we ship). The stub
//! returns `Error("find_and_read not yet implemented — ast-grep-core integration pending")`
//! so consumers that accidentally reach the native backend before
//! Phase 3 search support lands fall back cleanly (FR-020 / backend
//! selection shim emits the TS fallback path).
//!
//! Everything else on the contract surface is fully wired:
//!
//! - `templateBundleHash` — getter over `TEMPLATE_BUNDLE_HASH` from the
//!   render crate (T014-T017).
//! - `read_node(nodeId)` — delegates to `sittir_core::read_node::read_node`.
//!   Requires a prior `find_and_read` to have populated the internal
//!   tree; we keep that stub-guarded too.
//! - `render(nodeJson)` — `serde_json` → `NodeData` → `build_template_context`
//!   → `render_dispatch`. Stateless.
//! - `apply_edits(source, edits)` — delegates to `sittir_core::splice`.
//!   Stateless.

use napi::bindgen_prelude::*;
use napi_derive::napi;
use sittir_core::prepare::{build_template_context, RenderDispatch};
use sittir_core::splice::apply_edits as splice_apply_edits;
use sittir_core::types::{Edit, NodeData};
use sittir_rust_render::{render_dispatch, RustGrammarMeta, TEMPLATE_BUNDLE_HASH};

/// napi-bound stateful facade per contracts/napi-api.md.
///
/// Each JS worker thread that uses the engine constructs its own
/// instance — `tree_sitter::Parser` / `tree_sitter::Tree` are not
/// thread-safe and this struct is therefore `!Send` + `!Sync`.
#[napi]
pub struct SittirEngine {
    parser: tree_sitter::Parser,
    source: Option<String>,
    tree: Option<tree_sitter::Tree>,
    /// Per-instance monotonic counter for `$nodeId`. Reset by each
    /// `find_and_read` (stale IDs from older parses are no longer
    /// valid against the fresh tree). See data-model.md §4.
    next_node_id: u32,
}

#[napi]
impl SittirEngine {
    /// Construct a new engine. Sets the parser language from
    /// `tree_sitter_rust::LANGUAGE`. Infallible at the contract level —
    /// `set_language` can technically fail on an ABI mismatch, but that
    /// would be a build-time defect so we surface it as a napi error
    /// here and let backend selection fall through to the TS engine
    /// rather than panic.
    #[napi(constructor)]
    pub fn new() -> Result<Self> {
        let mut parser = tree_sitter::Parser::new();
        let language: tree_sitter::Language = tree_sitter_rust::LANGUAGE.into();
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

    /// The SHA-256 of the template bundle baked into this binary at
    /// `cargo build` time. JS-side compares against `TEMPLATE_BUNDLE_HASH`
    /// from `./hash.ts` for FR-020 drift detection.
    #[napi(getter)]
    pub fn template_bundle_hash(&self) -> &'static str {
        TEMPLATE_BUNDLE_HASH
    }

    /// Parse `source`, run an ast-grep pattern match, return the matched
    /// `NodeData`s as a JSON array string.
    ///
    /// **Deferred (T033):** ast-grep-core integration is blocked on a
    /// version conflict with our pinned tree-sitter crate (see module
    /// docs). This stub returns an error so callers fall through the
    /// backend-selection shim to the TS engine.
    #[napi]
    pub fn find_and_read(&mut self, _source: String, _pattern: String) -> Result<String> {
        Err(Error::from_reason(
            "find_and_read not yet implemented — ast-grep-core integration pending",
        ))
    }

    /// Drill into a previously-returned node by its `$nodeId`. Returns
    /// the primitive `NodeData` JSON.
    ///
    /// Errors if no `find_and_read` call has populated the internal
    /// tree yet, or if `node_id` does not match any node in the
    /// currently-cached tree.
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
        // `sittir_core::read_node::read_node` panics with the contract-
        // defined message when `node_id` is absent from the tree; catch
        // that and translate to a napi Error per contracts/napi-api.md.
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

    /// Render a NodeData (passed as JSON string; TS does `JSON.stringify`)
    /// to source. Stateless — does not touch `self.tree` / `self.source`.
    #[napi]
    pub fn render(&self, node_json: String) -> Result<String> {
        let node: NodeData = serde_json::from_str(&node_json)
            .map_err(|e| Error::from_reason(format!("parse NodeData JSON failed: {e}")))?;
        let meta = RustGrammarMeta;
        let dispatch: RenderDispatch = render_dispatch;
        let ctx = build_template_context(&node, &meta, dispatch)
            .map_err(|e| Error::from_reason(format!("build template context failed: {e}")))?;
        dispatch(&node.type_, &ctx)
            .map_err(|e| Error::from_reason(format!("render_dispatch failed: {e}")))
    }

    /// Apply a batch of edits to `source`. Delegates to
    /// `sittir_core::splice::apply_edits`; errors are mapped to
    /// `Error::from_reason` via the `SpliceError`'s `Display` impl.
    #[napi]
    pub fn apply_edits(&self, source: String, edits: Vec<Edit>) -> Result<String> {
        splice_apply_edits(&source, edits).map_err(|e| Error::from_reason(format!("{e}")))
    }
}
