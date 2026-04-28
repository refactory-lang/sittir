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
//! `ast-grep-core` integration is deferred to Phase 3 (T022+). The dep
//! version conflict that previously blocked it is resolved (see
//! `Cargo.toml` root for rationale). The stub returns
//! `Error("find_and_read not yet implemented — ast-grep-core integration pending")`
//! so consumers fall back cleanly to the TS engine before Phase 3
//! search support lands (FR-020 / backend selection shim).
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
use sittir_core::types::{Edit, FormatRecord, NodeData};
use sittir_rust_render::{render_dispatch, RustGrammarMeta, TEMPLATE_BUNDLE_HASH};

/// Result wrapper for parse_and_read: NodeData + optional FormatRecord.
#[derive(serde::Serialize)]
struct ParseResult<'a> {
    #[serde(rename = "nodeData")]
    node_data: &'a NodeData,
    #[serde(skip_serializing_if = "Option::is_none")]
    format: Option<FormatRecord>,
}

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
    /// **Deferred (T033):** ast-grep-core integration is Phase 3 work
    /// (see module docs). This stub returns an error so callers fall
    /// through the backend-selection shim to the TS engine.
    #[napi]
    pub fn find_and_read(&mut self, _source: String, _pattern: String) -> Result<String> {
        Err(Error::from_reason(
            "find_and_read not yet implemented — ast-grep-core integration pending",
        ))
    }

    /// Parse `source` with the embedded tree-sitter parser, cache the
    /// resulting tree + source on this engine instance, then run
    /// `sittir_core::read_node::read_node` on the root and return the
    /// resulting whole-tree `NodeData` as a JSON string.
    ///
    /// Distinct from `find_and_read` (which is ast-grep-pattern-based and
    /// currently stubbed) — this is the plain "parse and read" path
    /// every probe / parity / e2e harness wants. After the call, the
    /// instance's cached tree is populated, so subsequent `read_node`
    /// drill-ins by `$nodeId` work as documented.
    ///
    /// Caller drills to a specific node by re-calling `readNode($nodeId)`
    /// — `$nodeId` is tree-sitter's canonical `Node::id()`, identical
    /// across this engine and the JS `TreeHandle.nodeById` path.
    ///
    /// Errors:
    ///   - "parse failed": tree-sitter returned None.
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
            Ok(data) => {
                let format = sittir_core::format::extract_format(
                    self.source.as_ref().unwrap(),
                    self.tree.as_ref().unwrap(),
                );
                serde_json::to_string(&ParseResult { node_data: &data, format })
                    .map_err(|e| Error::from_reason(format!("serialize ParseResult failed: {e}")))
            }
            Err(panic_payload) => Err(Error::from_reason(panic_msg(panic_payload, "parse_and_read panicked"))),
        }
    }

    /// Drill into a previously-returned node by its `$nodeId` (tree-
    /// sitter's `Node::id()`). Returns the primitive `NodeData` JSON.
    /// Errors if no parse-and-read has populated the cached tree, or
    /// if `node_id` does not exist in that tree.
    ///
    /// `node_id` is `f64` on the napi boundary because JS numbers are
    /// the natural carrier — the underlying value is a pointer-derived
    /// `u64` that fits in 53 bits on every platform we target.
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
        let id = node_id as u64;
        let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
            sittir_core::read_node::read_node(tree, source, Some(id))
        }));
        match result {
            Ok(data) => serde_json::to_string(&data)
                .map_err(|e| Error::from_reason(format!("serialize NodeData failed: {e}"))),
            Err(panic_payload) => Err(Error::from_reason(panic_msg(panic_payload, &format!("node id {id} not found in current tree")))),
        }
    }

    /// Render a NodeData (passed as JSON string; TS does `JSON.stringify`)
    /// to source. Stateless — does not touch `self.tree` / `self.source`.
    #[napi]
    pub fn render(&self, node_json: String) -> Result<String> {
        let node: NodeData = serde_json::from_str(&node_json)
            .map_err(|e| Error::from_reason(format!("parse NodeData JSON failed: {e}")))?;
        let format = node.format.clone();
        let meta = RustGrammarMeta;
        let dispatch: RenderDispatch = render_dispatch;
        let ctx = build_template_context(&node, &meta, dispatch)
            .map_err(|e| Error::from_reason(format!("build template context failed: {e}")))?;
        let canonical = dispatch(&node.type_, &ctx)
            .map_err(|e| Error::from_reason(format!("render_dispatch failed: {e}")))?;
        Ok(match format {
            Some(fmt) => sittir_core::format::apply_format(&canonical, &fmt),
            None => canonical,
        })
    }

    /// Apply a batch of edits to `source`. Delegates to
    /// `sittir_core::splice::apply_edits`; errors are mapped to
    /// `Error::from_reason` via the `SpliceError`'s `Display` impl.
    #[napi]
    pub fn apply_edits(&self, source: String, edits: Vec<Edit>) -> Result<String> {
        splice_apply_edits(&source, edits).map_err(|e| Error::from_reason(format!("{e}")))
    }
}

/// Extract a panic payload's message (best-effort) and fall back to a
/// supplied default. Used by parse_and_read / read_node to translate
/// `sittir_core::read_node::read_node`'s panic-on-missing-id into a
/// napi-readable Error.
fn panic_msg(payload: Box<dyn std::any::Any + Send>, fallback: &str) -> String {
    if let Some(s) = payload.downcast_ref::<String>() {
        s.clone()
    } else if let Some(s) = payload.downcast_ref::<&str>() {
        s.to_string()
    } else {
        fallback.to_string()
    }
}

