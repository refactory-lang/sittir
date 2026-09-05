//! Thin N-API binding for the Rust grammar.

// Every transport slot position wraps its value in `SlotValue`, which adds a
// layer to an already deeply nested generated type graph. Auto-trait
// resolution (`Unpin` on the innermost `Vec`) exceeds the default limit on
// the larger grammars.
#![recursion_limit = "256"]

pub mod render;

use tree_sitter_language::LanguageFn;

unsafe extern "C" {
    fn tree_sitter_rust() -> *const ();
}

/// The generated `.sittir` Rust parser.
pub const LANGUAGE: LanguageFn = unsafe { LanguageFn::from_raw(tree_sitter_rust) };

pub fn language() -> tree_sitter::Language {
    LANGUAGE.into()
}

#[cfg(feature = "napi-bindings")]
use sittir_core::engine::EngineGrammar;

#[cfg(feature = "napi-bindings")]
use render::{render_transport_parts, RenderRoot, TEMPLATE_BUNDLE_HASH};

#[cfg(feature = "napi-bindings")]
const NATIVE_RENDER_TRANSPORT_ABI: u32 = 2;

#[cfg(feature = "napi-bindings")]
#[derive(Clone, Copy, Default)]
struct RustGrammar;

#[cfg(feature = "napi-bindings")]
impl EngineGrammar for RustGrammar {
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

// The engine class itself — parse, read, render, edits, and the live-tree
// table — is defined once in `sittir_core::napi_engine`.
#[cfg(feature = "napi-bindings")]
sittir_core::napi_engine!(
    RustGrammar,
    RenderRoot,
    render_transport_parts,
    NATIVE_RENDER_TRANSPORT_ABI,
    render::options::defaults,
    render::options::resolve
);
