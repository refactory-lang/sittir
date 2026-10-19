//! Thin N-API binding for the Python grammar.

// Every node slot position wraps its value in `SlotValue`, which adds a
// layer to an already deeply nested generated type graph. Auto-trait
// resolution (`Unpin` on the innermost `Vec`) exceeds the default limit on
// the larger grammars.
#![recursion_limit = "256"]

pub mod render;

use tree_sitter_language::LanguageFn;

unsafe extern "C" {
    fn tree_sitter_python() -> *const ();
}

/// The generated `.sittir` Python parser.
// SAFETY: `tree_sitter_python` is the generated parser's entry point, compiled
// and linked by build.rs; it returns the parser's static `TSLanguage`, which is
// the pointer `LanguageFn::from_raw` expects.
pub const LANGUAGE: LanguageFn = unsafe { LanguageFn::from_raw(tree_sitter_python) };

#[must_use]
pub fn language() -> tree_sitter::Language {
    LANGUAGE.into()
}

use sittir_core::engine::EngineGrammar;

use render::{render_node_parts, AnyNode, RENDER_MODULE_HASH};

#[cfg(feature = "napi-bindings")]
use render::RenderRoot;

#[cfg(feature = "napi-bindings")]
const NATIVE_RENDER_NODE_ABI: u32 = 25;

#[derive(Clone, Copy, Default)]
pub struct PythonGrammar;

impl EngineGrammar for PythonGrammar {
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
        <AnyNode as sittir_core::read::ReadNode>::shows
    }

    fn relaxes(self) -> fn(sittir_core::types::KindId, sittir_core::types::KindId) -> bool {
        render::kind_ids::relaxes
    }

    type Trivia = render::node::TriviaNode;

    fn whitespace(self) -> (&'static sittir_core::render::WhitespaceTable, &'static [sittir_core::types::KindId]) {
        (&render::options::WHITESPACE, render::options::LAYOUT_KINDS)
    }

    fn surface_kinds(self) -> sittir_core::trivia_table::SurfaceKinds {
        render::kind_ids::SURFACE_KINDS
    }

    fn option_tables(self) -> &'static sittir_core::options::OptionTables {
        &<render::options::Sites as sittir_core::options::OptionSites>::TABLES
    }

    fn read_units(self, tree: &tree_sitter::Tree, ctx: &mut sittir_core::read::ReadCtx<'_>, index: sittir_core::types::NodeIndex) -> Vec<sittir_core::layout::UnitSides<Self::Trivia>> {
        sittir_core::read::read_at::<AnyNode>(&mut tree.walk(), ctx, index, sittir_core::read::Depth::ONE)
            .ok()
            .and_then(|mut any| sittir_core::read::HasLayout::<Option<Box<sittir_core::layout::NodeLayout<Self::Trivia>>>>::take_layout(&mut any))
            .map_or_else(Vec::new, |layout| layout.units)
    }

    fn render_read(self, tree: &tree_sitter::Tree, index: sittir_core::types::NodeIndex, depth: sittir_core::read::Depth, ctx: &mut sittir_core::read::ReadCtx<'_>, render: &sittir_core::prepare::RenderContext<'_>, baseline: &mut sittir_core::baseline::Baseline) -> std::result::Result<String, String> {
        let node = sittir_core::read::read_at::<AnyNode>(&mut tree.walk(), ctx, index, depth)
            .map_err(|refusal| refusal.describe(&|kind| self.kind_name(kind)))?;
        render_node_parts(sittir_core::SlotValue::Node(node), render, Some(baseline)).map(|(_, text)| text).map_err(|error| error.to_string())
    }

    fn slot_routes(self, tree: &tree_sitter::Tree, index: sittir_core::types::NodeIndex) -> Option<sittir_core::read::Routed> {
        sittir_core::read::routes_at::<AnyNode>(&mut tree.walk(), index)
    }

    fn router(self, grammar: sittir_core::types::KindId, display: sittir_core::types::KindId) -> Option<sittir_core::read::Router> {
        <AnyNode as sittir_core::read::ReadNode>::router(grammar, display)
    }
}

sittir_core::records_codec! {
    impl sittir_core::arena::RecordGrammar for PythonGrammar {
        fn render_record(
            self,
            root: sittir_core::arena::CellAt,
            trees: &mut dyn sittir_core::arena::RecordTrees,
            built: &sittir_core::arena::Arena,
            store: &sittir_core::trivia_store::TriviaStore<Self::Trivia>,
            ctx: &sittir_core::prepare::RenderContext<'_>,
        ) -> std::result::Result<String, sittir_core::render::RenderError> {
            render::node::render_record(root, trees, built, store, ctx)
        }
    }
}

// The engine class itself — parse, read, render, edits, and the live-tree
// table — is defined once in `sittir_core::napi_engine`.
#[cfg(feature = "napi-bindings")]
sittir_core::napi_engine!(
    PythonGrammar,
    RenderRoot,
    AnyNode,
    render::options::Options,
    render_node_parts,
    NATIVE_RENDER_NODE_ABI,
    render::options::defaults
);
