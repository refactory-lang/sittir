//! Thin N-API binding for the TypeScript grammar.

pub mod render;

#[cfg(feature = "napi-bindings")]
use napi::bindgen_prelude::*;
#[cfg(feature = "napi-bindings")]
use napi_derive::napi;
#[cfg(feature = "napi-bindings")]
use sittir_core::engine::{Engine, EngineGrammar};
#[cfg(feature = "napi-bindings")]
use sittir_core::types::{Edit, FormatRecord, NodeData};

#[cfg(feature = "napi-bindings")]
use render::{render_dispatch, render_transport_parts, AnyTransport, TEMPLATE_BUNDLE_HASH};

#[cfg(feature = "napi-bindings")]
const NATIVE_RENDER_TRANSPORT_ABI: u32 = 1;

#[cfg(feature = "napi-bindings")]
#[derive(Clone, Copy)]
struct TypeScriptGrammar;

#[cfg(feature = "napi-bindings")]
impl EngineGrammar for TypeScriptGrammar {
    fn configure_parser(self, parser: &mut tree_sitter::Parser) -> std::result::Result<(), String> {
        let language: tree_sitter::Language = tree_sitter_typescript::LANGUAGE_TYPESCRIPT.into();
        parser
            .set_language(&language)
            .map_err(|e| format!("failed to set parser language: {e}"))
    }

    fn template_bundle_hash(self) -> &'static str {
        TEMPLATE_BUNDLE_HASH
    }

    fn render(self, node: &NodeData) -> std::result::Result<String, String> {
        render_dispatch(node).map_err(|e| e.to_string())
    }
}

#[cfg(feature = "napi-bindings")]
#[napi(object)]
pub struct EngineOptions {
    pub format: Option<String>,
}

#[cfg(feature = "napi-bindings")]
#[napi]
pub struct SittirEngine {
    inner: Engine<TypeScriptGrammar>,
}

#[cfg(feature = "napi-bindings")]
#[napi]
impl SittirEngine {
    #[napi(constructor)]
    pub fn new(options: Option<EngineOptions>) -> Result<Self> {
        let format = parse_format(options)?;
        Ok(Self {
            inner: Engine::new(TypeScriptGrammar, format).map_err(Error::from_reason)?,
        })
    }

    #[napi(getter)]
    pub fn template_bundle_hash(&self) -> &'static str {
        self.inner.template_bundle_hash()
    }

    #[napi(getter)]
    pub fn native_render_transport_abi(&self) -> u32 {
        NATIVE_RENDER_TRANSPORT_ABI
    }

    #[napi]
    pub fn find_and_read(&mut self, source: String, pattern: String) -> Result<String> {
        self.inner
            .find_and_read(source, pattern)
            .map_err(Error::from_reason)
    }

    #[napi]
    pub fn parse_and_read(&mut self, source: String) -> Result<String> {
        self.inner
            .parse_and_read(source)
            .map_err(Error::from_reason)
    }

    #[napi]
    pub fn read_node(&mut self, handle: f64, child_index: f64) -> Result<String> {
        self.inner.read_node(handle, child_index).map_err(Error::from_reason)
    }

    /// Render a typed transport object (napi-native, numeric `$type`).
    /// Phase B: `AnyTransport` is decoded by napi-rs directly from the JS
    /// object — no `serde_json::Value` intermediate.
    #[napi]
    pub fn render(&self, transport: AnyTransport) -> Result<String> {
        let (node, canonical) = render_transport_parts(transport)
            .map_err(|e| Error::from_reason(format!("render_transport failed: {e}")))?;
        self.inner
            .render_canonical_node(&node, canonical)
            .map_err(Error::from_reason)
    }

    #[napi]
    pub fn apply_edits(&self, source: String, edits: Vec<Edit>) -> Result<String> {
        self.inner
            .apply_edits(source, edits)
            .map_err(Error::from_reason)
    }

    #[napi]
    pub fn dispose(&mut self) {
        self.inner.dispose();
    }
}

#[cfg(feature = "napi-bindings")]
fn parse_format(options: Option<EngineOptions>) -> Result<Option<FormatRecord>> {
    options
        .and_then(|opts| opts.format)
        .map(|json| serde_json::from_str(&json))
        .transpose()
        .map_err(|e| Error::from_reason(format!("parse engine format failed: {e}")))
}
