//! Thin N-API binding for the TypeScript grammar.

pub mod render;

use tree_sitter_language::LanguageFn;

unsafe extern "C" {
    fn tree_sitter_typescript() -> *const ();
}

/// The generated `.sittir` TypeScript parser.
pub const LANGUAGE: LanguageFn = unsafe { LanguageFn::from_raw(tree_sitter_typescript) };

pub fn language() -> tree_sitter::Language {
    LANGUAGE.into()
}

#[cfg(feature = "napi-bindings")]
use napi::bindgen_prelude::*;
#[cfg(feature = "napi-bindings")]
use napi_derive::napi;
#[cfg(feature = "napi-bindings")]
use sittir_core::engine::{Engine, EngineGrammar};
#[cfg(feature = "napi-bindings")]
use sittir_core::types::{Edit, FormatRecord};
#[cfg(feature = "napi-bindings")]
use sittir_core::{apply_render_format, panic_msg, ParseResult, ParsedTree};

#[cfg(feature = "napi-bindings")]
use render::{render_transport_parts, AnyTransport, TEMPLATE_BUNDLE_HASH};

#[cfg(feature = "napi-bindings")]
const NATIVE_RENDER_TRANSPORT_ABI: u32 = 1;

#[cfg(feature = "napi-bindings")]
#[derive(Clone, Copy)]
struct TypeScriptGrammar;

#[cfg(feature = "napi-bindings")]
impl EngineGrammar for TypeScriptGrammar {
    fn configure_parser(self, parser: &mut tree_sitter::Parser) -> std::result::Result<(), String> {
        let language = crate::language();
        parser
            .set_language(&language)
            .map_err(|e| format!("failed to set parser language: {e}"))
    }

    fn template_bundle_hash(self) -> &'static str {
        TEMPLATE_BUNDLE_HASH
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
    engine: Engine<TypeScriptGrammar>,
    parsed: Option<ParsedTree<TypeScriptGrammar>>,
}

#[cfg(feature = "napi-bindings")]
#[napi]
impl SittirEngine {
    #[napi(constructor)]
    pub fn new(options: Option<EngineOptions>) -> Result<Self> {
        let format = parse_format(options)?;
        Ok(Self {
            engine: Engine::new(TypeScriptGrammar, format).map_err(Error::from_reason)?,
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

    /// Compile profile baked into this binary — `"debug"` or `"release"`.
    /// Validators refuse debug binaries (known segfault class) unless
    /// `SITTIR_ALLOW_DEBUG_VALIDATE=1`; the binary self-reporting makes the
    /// gate immune to stale env assumptions.
    #[napi(getter)]
    pub fn build_profile(&self) -> &'static str {
        if cfg!(debug_assertions) {
            "debug"
        } else {
            "release"
        }
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
        let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| parsed.read_root()));
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
            Err(payload) => Err(Error::from_reason(panic_msg(
                payload,
                "parse_and_read panicked",
            ))),
        }
    }

    #[napi]
    pub fn read_node(&mut self, handle: f64, child_index: f64) -> Result<String> {
        let parsed = self.parsed.as_mut().ok_or_else(|| {
            Error::from_reason("no tree parsed — call parseAndRead first".to_string())
        })?;
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
        std::fs::write(&path, rendered)
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
