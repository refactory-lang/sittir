//! Thin N-API binding for the Scm grammar.

// Every transport slot position wraps its value in `SlotValue`, which adds a
// layer to an already deeply nested generated type graph. Auto-trait
// resolution (`Unpin` on the innermost `Vec`) exceeds the default limit on
// the larger grammars.
#![recursion_limit = "256"]

pub mod render;

use tree_sitter_language::LanguageFn;

unsafe extern "C" {
    fn tree_sitter_scm() -> *const ();
}

/// The generated `.sittir` Scm parser.
pub const LANGUAGE: LanguageFn = unsafe { LanguageFn::from_raw(tree_sitter_scm) };

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
pub struct ScmGrammar;

#[cfg(feature = "napi-bindings")]
impl EngineGrammar for ScmGrammar {
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

    fn relaxes(self) -> fn(sittir_core::types::KindId, sittir_core::types::KindId) -> bool {
        render::kind_ids::relaxes
    }

    type Trivia = render::transport::TriviaTransport;

    fn whitespace(self) -> (&'static sittir_core::render::WhitespaceTable, &'static [sittir_core::types::KindId]) {
        (&render::options::WHITESPACE, render::options::LAYOUT_KINDS)
    }

    fn surface_kinds(self) -> sittir_core::trivia_table::SurfaceKinds {
        render::kind_ids::SURFACE_KINDS
    }

    fn option_tables(self) -> &'static sittir_core::options::OptionTables {
        &<render::options::Sites as sittir_core::options::OptionSites>::TABLES
    }

    fn read_units(self, tree: &tree_sitter::Tree, ctx: &sittir_core::read::ReadCtx<'_>, index: sittir_core::types::NodeIndex) -> Vec<sittir_core::layout::UnitSides<Self::Trivia>> {
        sittir_core::read::read_at::<AnyTransport>(&mut tree.walk(), ctx, index, sittir_core::read::Depth::ONE)
            .ok()
            .and_then(|mut any| sittir_core::read::HasLayout::<Option<Box<sittir_core::layout::TransportLayout<Self::Trivia>>>>::take_layout(&mut any))
            .map_or_else(Vec::new, |layout| layout.units)
    }

    fn render_read(self, tree: &tree_sitter::Tree, index: sittir_core::types::NodeIndex, depth: sittir_core::read::Depth, ctx: &sittir_core::read::ReadCtx<'_>, render: &sittir_core::prepare::RenderContext<'_>) -> std::result::Result<String, String> {
        let node = sittir_core::read::read_at::<AnyTransport>(&mut tree.walk(), ctx, index, depth)
            .map_err(|refusal| refusal.describe(&|kind| self.kind_name(kind)))?;
        render_transport_parts(sittir_core::SlotValue::Transport(node), render).map(|(_, text)| text).map_err(|error| error.to_string())
    }

    fn slot_routes(self, tree: &tree_sitter::Tree, index: sittir_core::types::NodeIndex) -> Option<sittir_core::read::Routed> {
        sittir_core::read::routes_at::<AnyTransport>(&mut tree.walk(), index)
    }

    fn router(self, grammar: sittir_core::types::KindId, display: sittir_core::types::KindId) -> Option<sittir_core::read::Router> {
        <AnyTransport as sittir_core::read::ReadTransport>::router(grammar, display)
    }
}

// The engine class itself — parse, read, render, edits, and the live-tree
// table — is defined once in `sittir_core::napi_engine`.
#[cfg(feature = "napi-bindings")]
sittir_core::napi_engine!(
    ScmGrammar,
    RenderRoot,
    AnyTransport,
    render::options::Options,
    render_transport_parts,
    NATIVE_RENDER_TRANSPORT_ABI,
    render::options::defaults
);
