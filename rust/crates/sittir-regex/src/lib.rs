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
const NATIVE_RENDER_TRANSPORT_ABI: u32 = 21;

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

    fn sides_at(
        self,
        cursor: &mut tree_sitter::TreeCursor<'_>,
        ctx: &sittir_core::read::ReadCtx<'_>,
        index: u32,
    ) -> std::result::Result<sittir_core::read::Sides, sittir_core::read::ReadError> {
        <AnyTransport as sittir_core::read::ReadTransport>::sides_of(cursor, ctx, index)
    }

    fn read_kind(self, node: &tree_sitter::Node<'_>) -> Option<sittir_core::types::KindId> {
        AnyTransport::read_kind(sittir_core::types::KindId(node.grammar_id()), sittir_core::read::display_id(node))
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
    render::options::defaults,
    render::options::WHITESPACE,
    render::options::LAYOUT_KINDS
);
