//! Thin N-API binding for the Regex grammar.

// Every transport slot position wraps its value in `SlotValue`, which adds a
// layer to an already deeply nested generated type graph. Auto-trait
// resolution (`Unpin` on the innermost `Vec`) exceeds the default limit on
// the larger grammars.
#![recursion_limit = "256"]

pub mod render;

use tree_sitter_language::LanguageFn;

unsafe extern "C" {
    fn tree_sitter_regex() -> *const ();
}

/// The generated `.sittir` Regex parser.
pub const LANGUAGE: LanguageFn = unsafe { LanguageFn::from_raw(tree_sitter_regex) };

pub fn language() -> tree_sitter::Language {
    LANGUAGE.into()
}

#[cfg(feature = "napi-bindings")]
use sittir_core::engine::EngineGrammar;

#[cfg(feature = "napi-bindings")]
use render::{render_transport_parts, AnyTransport, RenderRoot, RENDER_MODULE_HASH};

#[cfg(feature = "napi-bindings")]
const NATIVE_RENDER_TRANSPORT_ABI: u32 = 25;

#[derive(Clone, Copy, Default)]
pub struct RegexGrammar;

#[cfg(feature = "napi-bindings")]
impl EngineGrammar for RegexGrammar {
    fn configure_parser(self, parser: &mut tree_sitter::Parser) -> std::result::Result<(), String> {
        let language = crate::language();
        parser
            .set_language(&language)
            .map_err(|e| format!("failed to set parser language: {e}"))
    }

    fn render_module_hash(self) -> &'static str {
        RENDER_MODULE_HASH
    }

    fn kind_name(self, kind: sittir_core::types::KindId) -> &'static str {
        render::kind_ids::kind_name_from_id(kind)
    }

    fn shows(self) -> fn(sittir_core::types::KindId) -> bool {
        <AnyTransport as sittir_core::read::ReadTransport>::shows
    }

    type Trivia = render::transport::TriviaTransport;

    fn whitespace(self) -> (&'static sittir_core::render::WhitespaceTable, &'static [u16]) {
        (&render::options::WHITESPACE, render::options::LAYOUT_KINDS)
    }

    fn surface_kinds(self) -> sittir_core::trivia_table::SurfaceKinds {
        render::kind_ids::SURFACE_KINDS
    }

    fn read_units(self, tree: &tree_sitter::Tree, ctx: &sittir_core::read::ReadCtx<'_>, index: u32) -> Vec<sittir_core::layout::UnitSides<Self::Trivia>> {
        sittir_core::read::read_at::<AnyTransport>(&mut tree.walk(), ctx, index, sittir_core::read::Depth::ONE)
            .ok()
            .and_then(|mut any| sittir_core::read::HasLayout::<Option<Box<sittir_core::layout::TransportLayout<Self::Trivia>>>>::take_layout(&mut any))
            .map_or_else(Vec::new, |layout| layout.units)
    }
}

// The engine class itself — parse, read, render, edits, and the live-tree
// table — is defined once in `sittir_core::napi_engine`.
#[cfg(feature = "napi-bindings")]
sittir_core::napi_engine!(
    RegexGrammar,
    RenderRoot,
    AnyTransport,
    render::options::Options,
    render_transport_parts,
    NATIVE_RENDER_TRANSPORT_ABI,
    render::options::defaults
);
