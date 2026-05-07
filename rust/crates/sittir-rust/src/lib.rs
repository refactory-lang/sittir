//! Thin N-API binding for the Rust grammar.

pub mod render;
#[cfg(feature = "napi-bindings")]
use std::fs;

#[cfg(feature = "napi-bindings")]
use napi::bindgen_prelude::*;
#[cfg(feature = "napi-bindings")]
use napi_derive::napi;
#[cfg(feature = "napi-bindings")]
use sittir_core::engine::{Engine, EngineGrammar};
#[cfg(feature = "napi-bindings")]
use sittir_core::types::{Edit, FormatRecord, NodeData};
#[cfg(feature = "napi-bindings")]
use sittir_core::{apply_render_format, panic_msg, ParseResult, ParsedTree};

#[cfg(feature = "napi-bindings")]
use render::{render_nodedata_into, render_transport_parts, AnyTransport, TEMPLATE_BUNDLE_HASH};

#[cfg(feature = "napi-bindings")]
const NATIVE_RENDER_TRANSPORT_ABI: u32 = 1;

#[cfg(feature = "napi-bindings")]
#[derive(Clone, Copy)]
struct RustGrammar;

#[cfg(feature = "napi-bindings")]
impl EngineGrammar for RustGrammar {
    fn configure_parser(self, parser: &mut tree_sitter::Parser) -> std::result::Result<(), String> {
        let language: tree_sitter::Language = tree_sitter_rust::LANGUAGE.into();
        parser
            .set_language(&language)
            .map_err(|e| format!("failed to set parser language: {e}"))
    }

    fn template_bundle_hash(self) -> &'static str {
        TEMPLATE_BUNDLE_HASH
    }

    fn render(self, node: &NodeData) -> std::result::Result<String, String> {
        let mut buf = String::new();
        render_nodedata_into(node, &mut buf).map_err(|e| e.to_string())?;
        Ok(buf)
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
    engine: Engine<RustGrammar>,
    parsed: Option<ParsedTree<RustGrammar>>,
}

#[cfg(feature = "napi-bindings")]
#[napi]
impl SittirEngine {
    #[napi(constructor)]
    pub fn new(options: Option<EngineOptions>) -> Result<Self> {
        let format = parse_format(options)?;
        Ok(Self {
            engine: Engine::new(RustGrammar, format).map_err(Error::from_reason)?,
            parsed: None,
        })
    }

    #[napi(getter)]
    pub fn template_bundle_hash(&self) -> &'static str {
        self.engine.template_bundle_hash()
    }

    #[napi(getter)]
    pub fn native_render_transport_abi(&self) -> u32 {
        NATIVE_RENDER_TRANSPORT_ABI
    }

    #[napi]
    pub fn find_and_read(&mut self, source: String, pattern: String) -> Result<String> {
        self.engine
            .find_and_read(source, pattern)
            .map_err(Error::from_reason)
    }

    #[napi]
    pub fn parse_and_read(&mut self, source: String) -> Result<String> {
        let mut parsed = self.engine.parse(source).map_err(Error::from_reason)?;
        let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
            parsed.read_root()
        }));
        match result {
            Ok(data) => {
                let format = parsed.format().cloned();
                self.parsed = Some(parsed);
                serde_json::to_string(&ParseResult {
                    node_data: &data,
                    format,
                })
                .map_err(|e| Error::from_reason(format!("serialize ParseResult failed: {e}")))
            }
            Err(payload) => Err(Error::from_reason(panic_msg(payload, "parse_and_read panicked"))),
        }
    }

    #[napi]
    pub fn read_node(&mut self, handle: f64, child_index: f64) -> Result<String> {
        let parsed = self
            .parsed
            .as_mut()
            .ok_or_else(|| Error::from_reason("no tree parsed — call parseAndRead first".to_string()))?;
        parsed
            .read_child(handle as u32, child_index as u16)
            .map_err(Error::from_reason)
    }

    /// Render a typed transport object (napi-native, numeric `$type`).
    #[napi]
    pub fn render(&self, transport: AnyTransport) -> Result<String> {
        let (source, canonical) = render_transport_parts(transport)
            .map_err(|e| Error::from_reason(format!("render_transport failed: {e}")))?;
        let tree_format = self.parsed.as_ref().and_then(|pt| pt.format());
        Ok(apply_render_format(
            source,
            canonical,
            self.engine.engine_format(),
            tree_format,
        ))
    }

    #[napi]
    pub fn render_to_file(&self, transport: AnyTransport, path: String) -> Result<()> {
        let rendered = self.render(transport)?;
        fs::write(&path, rendered)
            .map_err(|e| Error::from_reason(format!("render_to_file failed for {path}: {e}")))
    }

    #[napi]
    pub fn apply_edits(&self, source: String, edits: Vec<Edit>) -> Result<String> {
        self.engine
            .apply_edits(source, edits)
            .map_err(Error::from_reason)
    }

    #[napi]
    pub fn dispose(&mut self) {
        self.parsed = None;
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
