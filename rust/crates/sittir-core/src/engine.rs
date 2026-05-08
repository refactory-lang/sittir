//! Shared native engine state for grammar-specific N-API bindings.
//!
//! Grammar crates provide a small [`EngineGrammar`] adapter for parser setup,
//! template hash lookup, and render dispatch. This module owns the generic
//! parse/read/render/edit state machine so `sittir-{lang}` crates stay
//! thin and grammar-owned.
//!
//! ## ADR-0017 split
//!
//! `Engine<G>` is stateless (parser + grammar config). Parsing returns a
//! `ParsedTree<G>` that owns the tree, source, format, and (in Task 2) a
//! node vec for O(1) child-index navigation. The split enables the node
//! vec to coexist with the owned tree using the ast-grep `PinnedNodeData`
//! pattern for lifetime safety.

use crate::format::{apply_format, extract_format};
use crate::read_node::read_node;
use crate::splice::apply_edits as splice_apply_edits;
use crate::types::{Edit, FormatRecord, NodeData, Source};

/// Grammar-specific hooks used by the shared native engine.
pub trait EngineGrammar: Copy {
    fn configure_parser(self, parser: &mut tree_sitter::Parser) -> Result<(), String>;
    fn template_bundle_hash(self) -> &'static str;
    fn render(self, node: &NodeData) -> Result<String, String>;
}

// ─── StoredNode ──────────────────────────────────────────────────────────────

/// Node handle — generic over the tree-sitter backend.
///
/// Each entry holds a lifetime-erased tree-sitter `Node`. The safety
/// invariant is that `StoredNode` values only exist inside a
/// `ParsedTree` whose `tree` field outlives the `nodes` vec (Rust
/// struct field drop order: last declared → first dropped).
pub enum StoredNode {
    Ts(tree_sitter::Node<'static>),
    // Sg(ast_grep_core::Node<'static>),  // future
}

// ─── ParsedTree ──────────────────────────────────────────────────────────────

/// Owned parse result — tree + source + format + node vec.
///
/// Created by [`Engine::parse`]. Contains all tree-dependent state.
/// Grammar crate napi wrappers own the `ParsedTree` directly.
///
/// # Field ordering invariant
///
/// `nodes` is declared AFTER `tree`. Rust drops struct fields in
/// declaration order, so `nodes` (which holds lifetime-erased borrows
/// from `tree`) is dropped first. This is the same safety pattern used
/// by ast-grep's `PinnedNodeData`.
pub struct ParsedTree<G: EngineGrammar> {
    grammar: G,
    /// The parsed tree-sitter tree. Must outlive `nodes`.
    tree: tree_sitter::Tree,
    source: String,
    format: Option<FormatRecord>,
    /// Node table for O(1) drill-in. Lazily populated (Task 2).
    nodes: Vec<StoredNode>,
}

impl<G: EngineGrammar> ParsedTree<G> {
    /// Push a tree-sitter node into the node table, returning its handle
    /// (index). The node must borrow from `self.tree`.
    ///
    /// # Safety
    ///
    /// The transmute erases the borrow lifetime. This is safe because:
    /// - The node borrows from `self.tree`.
    /// - `self.nodes` is dropped before `self.tree` (field declaration order).
    /// - Same pattern as ast-grep's `PinnedNodeData`.
    fn push_node(&mut self, node: tree_sitter::Node<'_>) -> u32 {
        let handle = self.nodes.len() as u32;
        // SAFETY: node borrows from self.tree which outlives self.nodes
        // (nodes declared after tree → dropped first per Rust field order).
        // Same pattern as ast-grep's PinnedNodeData.
        let static_node: tree_sitter::Node<'static> = unsafe { std::mem::transmute(node) };
        self.nodes.push(StoredNode::Ts(static_node));
        handle
    }

    /// Read the root node of the parsed tree into a `NodeData`.
    /// Reserves the root handle first so the returned payload and its
    /// child stubs share the same parent-handle contract as the JS
    /// reader, then stores the root node for subsequent child reads.
    pub fn read_root(&mut self) -> NodeData {
        let handle = self.nodes.len() as u32;
        // SAFETY: root_node borrows from self.tree which outlives
        // self.nodes (nodes declared after tree → dropped first).
        let root: tree_sitter::Node<'static> =
            unsafe { std::mem::transmute(self.tree.root_node()) };
        self.nodes.push(StoredNode::Ts(root));
        read_node(&self.tree, &self.source, None, Some(handle))
    }

    /// Read a child node by handle + child_index.
    ///
    /// Looks up the parent node from the node table at `handle`, then
    /// calls `parent.child(child_index)` to get the target node, reads
    /// it into a `NodeData`, pushes the result into the node table, and
    /// stamps `node_handle`.
    pub fn read_child(&mut self, handle: u32, child_index: u16) -> Result<String, String> {
        let parent_node = match self.nodes.get(handle as usize) {
            Some(StoredNode::Ts(n)) => *n,
            None => return Err(format!("handle {handle} not found in node table")),
        };
        let child_node = parent_node.child(child_index as u32).ok_or_else(|| {
            format!(
                "child_index {child_index} out of bounds for handle {handle} (child_count={})",
                parent_node.child_count()
            )
        })?;
        let new_handle = self.push_node(child_node);
        let data = read_node(&self.tree, &self.source, Some(child_node), Some(new_handle));
        serde_json::to_string(&data).map_err(|e| format!("serialize NodeData failed: {e}"))
    }

/// Render a `NodeData` from JSON using the grammar's render dispatch.
    pub fn render(&self, node_json: String) -> Result<String, String> {
        let node: NodeData = serde_json::from_str(&node_json).map_err(|e| {
            let snippet: String = node_json.chars().take(80).collect();
            format!("parse NodeData JSON failed: {e} (json: {snippet:?})")
        })?;
        self.render_node_data(node)
    }

    /// Render a deserialized `NodeData` with format application and
    /// trivia wrapping. Mirrors the TS `boundRender` + trivia-wrapping
    /// logic in `packages/core/src/render.ts` (spec 023 T017).
    ///
    /// Trivia items are inlined directly: each item's `$text` is written
    /// into the output buffer without an intermediate `Vec<String>` or
    /// `format!()` join. Leading trivia is prepended (each item followed
    /// by `\n`), trailing trivia is appended (each item preceded by `\n`).
    pub fn render_node_data(&self, node: NodeData) -> Result<String, String> {
        let canonical = self
            .grammar
            .render(&node)
            .map_err(|e| format!("render_dispatch failed: {e}"))?;
        let mut result = self.render_canonical_node(&node, canonical)?;

        if let Some(ref trivia) = node.trivia_data {
            if let Some(ref leading) = trivia.leading {
                if !leading.is_empty() {
                    let mut buf = String::new();
                    for item in leading {
                        if let Some(ref text) = item.text {
                            buf.push_str(text);
                        } else {
                            let rendered = self.grammar.render(item)
                                .unwrap_or_default();
                            buf.push_str(&rendered);
                        }
                        buf.push('\n');
                    }
                    buf.push_str(&result);
                    result = buf;
                }
            }
            if let Some(ref trailing) = trivia.trailing {
                if !trailing.is_empty() {
                    for item in trailing {
                        result.push('\n');
                        if let Some(ref text) = item.text {
                            result.push_str(text);
                        } else {
                            let rendered = self.grammar.render(item)
                                .unwrap_or_default();
                            result.push_str(&rendered);
                        }
                    }
                }
            }
        }

        Ok(result)
    }

    /// Apply format to a pre-rendered canonical string.
    pub fn render_canonical_node(
        &self,
        node: &NodeData,
        canonical: String,
    ) -> Result<String, String> {
        Ok(apply_render_format(
            node.source,
            canonical,
            None,
            self.format.as_ref(),
        ))
    }

    /// Access the detected format record (if any).
    pub fn format(&self) -> Option<&FormatRecord> {
        self.format.as_ref()
    }

    /// Access the source string.
    pub fn source(&self) -> &str {
        &self.source
    }
}

// ─── Engine ──────────────────────────────────────────────────────────────────

/// Stateless native engine — parser + grammar config + engine-level format.
///
/// The engine owns the parser (which is mutable for `parse` calls) and an
/// optional engine-wide format override. Parsing returns a [`ParsedTree`]
/// that owns all tree-dependent state.
pub struct Engine<G: EngineGrammar> {
    grammar: G,
    parser: tree_sitter::Parser,
    engine_format: Option<FormatRecord>,
}

/// Result wrapper for parse-and-read calls.
#[derive(serde::Serialize)]
pub struct ParseResult<'a> {
    #[serde(rename = "nodeData")]
    pub node_data: &'a NodeData,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub format: Option<FormatRecord>,
}

impl<G: EngineGrammar> Engine<G> {
    pub fn new(grammar: G, engine_format: Option<FormatRecord>) -> Result<Self, String> {
        let mut parser = tree_sitter::Parser::new();
        grammar.configure_parser(&mut parser)?;
        Ok(Self {
            grammar,
            parser,
            engine_format,
        })
    }

    pub fn template_bundle_hash(&self) -> &'static str {
        self.grammar.template_bundle_hash()
    }

    /// Access the engine-level format override (if any).
    pub fn engine_format(&self) -> Option<&FormatRecord> {
        self.engine_format.as_ref()
    }

    /// Parse source and return an owned `ParsedTree`.
    pub fn parse(&mut self, source: String) -> Result<ParsedTree<G>, String> {
        let tree = self.parser.parse(&source, None).ok_or_else(|| {
            let snippet: String = source.chars().take(80).collect();
            format!("parse failed (source: {snippet:?})")
        })?;
        let format = extract_format(&source, &tree);
        Ok(ParsedTree {
            grammar: self.grammar,
            tree,
            source,
            format,
            nodes: Vec::new(),
        })
    }

    pub fn find_and_read(&mut self, _source: String, _pattern: String) -> Result<String, String> {
        Err("find_and_read not yet implemented — ast-grep-core integration pending".to_string())
    }

    /// Resolve the effective format for rendering, combining engine-level
    /// override with tree-level format.
    pub fn render_canonical_node(
        &self,
        node: &NodeData,
        canonical: String,
        tree_format: Option<&FormatRecord>,
    ) -> Result<String, String> {
        Ok(apply_render_format(
            node.source,
            canonical,
            self.engine_format.as_ref(),
            tree_format,
        ))
    }

    pub fn apply_edits(&self, source: String, edits: Vec<Edit>) -> Result<String, String> {
        splice_apply_edits(&source, edits).map_err(|e| format!("{e}"))
    }
}

/// Resolve the effective format from source provenance alone — no NodeData
/// required. Engine-level format takes priority; tree-level format applies
/// only to non-factory nodes (readNode output). Factory-constructed nodes
/// get no tree format (they had no original source to preserve).
fn resolve_render_format_from_source<'a>(
    source: Source,
    engine_format: Option<&'a FormatRecord>,
    tree_format: Option<&'a FormatRecord>,
) -> Option<&'a FormatRecord> {
    if let Some(format) = engine_format {
        return Some(format);
    }
    if !matches!(source, Source::Factory) {
        return tree_format;
    }
    None
}

/// Apply format to a pre-rendered canonical string using scalar parameters
/// instead of `&NodeData`. This is the public standalone API for format
/// application — callers that have KindId + Source + Span from any source
/// (transport structs, readNode output, etc.) can apply format without
/// constructing a full `NodeData`.
///
/// Parameters:
/// - `source` — provenance of the node (Ts/Sg/Factory). Controls whether
///   tree-level format is applied.
/// - `canonical` — the template-rendered string to format.
/// - `engine_format` — engine-wide format override (highest priority).
/// - `tree_format` — tree-level format detected from parsed source.
pub fn apply_render_format(
    source: Source,
    canonical: String,
    engine_format: Option<&FormatRecord>,
    tree_format: Option<&FormatRecord>,
) -> String {
    let effective_format = resolve_render_format_from_source(source, engine_format, tree_format);
    match effective_format {
        Some(format) => apply_format(&canonical, format),
        None => canonical,
    }
}

pub fn panic_msg(payload: Box<dyn std::any::Any + Send>, fallback: &str) -> String {
    if let Some(s) = payload.downcast_ref::<String>() {
        s.clone()
    } else if let Some(s) = payload.downcast_ref::<&str>() {
        s.to_string()
    } else {
        fallback.to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{FormatBoundary, FormatRecord};

    #[derive(Clone, Copy)]
    struct TestGrammar;

    impl EngineGrammar for TestGrammar {
        fn configure_parser(
            self,
            parser: &mut tree_sitter::Parser,
        ) -> std::result::Result<(), String> {
            let language: tree_sitter::Language = tree_sitter_rust::LANGUAGE.into();
            parser
                .set_language(&language)
                .map_err(|e| format!("failed to set parser language: {e}"))
        }

        fn template_bundle_hash(self) -> &'static str {
            "test"
        }

        fn render(self, node: &NodeData) -> std::result::Result<String, String> {
            Ok(format!("rendered:{}", node.type_))
        }
    }

    fn format_record(prefix: &str, suffix: &str) -> FormatRecord {
        FormatRecord {
            boundary: Some(FormatBoundary {
                leading: Some(prefix.to_string()),
                trailing: Some(suffix.to_string()),
            }),
            slots: None,
            literals: None,
            trivia: None,
            kinds: None,
        }
    }

    fn node(source: Source) -> NodeData {
        // KindId(1) is the `identifier` symbol in the Rust grammar (see
        // kind_ids.rs); used for test assertions. The render fn below formats
        // the numeric id — tests assert on the number, not the name.
        NodeData {
            type_: crate::types::KindId(1),
            source,
            named: true,
            fields: None,
            children: None,
            text: Some("x".to_string()),
            span: None,
            node_handle: None,
            child_index: None,
            trivia_data: None,
        }
    }

    #[test]
    fn render_canonical_node_preserves_engine_format() {
        let engine = Engine::new(TestGrammar, Some(format_record("<<", ">>"))).unwrap();

        let rendered = engine
            .render_canonical_node(&node(Source::Factory), "rendered:1".to_string(), None)
            .unwrap();

        assert_eq!(rendered, "<<rendered:1>>");
    }

    #[test]
    fn render_canonical_node_preserves_tree_format_for_tree_nodes() {
        let engine = Engine::new(TestGrammar, None).unwrap();
        let tree_fmt = format_record("[", "]");

        let rendered = engine
            .render_canonical_node(&node(Source::Ts), "canonical".to_string(), Some(&tree_fmt))
            .unwrap();

        assert_eq!(rendered, "[canonical]");
    }

    #[test]
    fn render_canonical_node_does_not_apply_tree_format_to_factory_nodes() {
        let engine = Engine::new(TestGrammar, None).unwrap();
        let tree_fmt = format_record("[", "]");

        let rendered = engine
            .render_canonical_node(&node(Source::Factory), "canonical".to_string(), Some(&tree_fmt))
            .unwrap();

        assert_eq!(rendered, "canonical");
    }

    // --- Trivia render tests (spec 023 T017) ---

    fn node_with_trivia(leading: Option<Vec<NodeData>>, trailing: Option<Vec<NodeData>>) -> NodeData {
        use crate::types::NodeTrivia;
        NodeData {
            type_: crate::types::KindId(1),
            source: Source::Factory,
            named: true,
            fields: None,
            children: None,
            text: Some("x".to_string()),
            span: None,
            node_handle: None,
            child_index: None,
            trivia_data: Some(NodeTrivia { leading, trailing }),
        }
    }

    fn comment_leaf(text: &str) -> NodeData {
        NodeData {
            type_: crate::types::KindId(318), // block_comment kind in rust grammar
            source: Source::Factory,
            named: true,
            fields: None,
            children: None,
            text: Some(text.to_string()),
            span: None,
            node_handle: None,
            child_index: None,
            trivia_data: None,
        }
    }

    #[test]
    fn render_node_data_prepends_leading_trivia() {
        let mut engine = Engine::new(TestGrammar, None).unwrap();
        let tree = engine.parse("fn main() {}".to_string()).unwrap();
        let n = node_with_trivia(
            Some(vec![comment_leaf("// hello")]),
            None,
        );
        let rendered = tree.render_node_data(n).unwrap();
        // The node renders as "rendered:1" (TestGrammar::render), and
        // leading trivia "// hello" is prepended with a newline separator.
        // Trivia items use the leaf fast-path (fields=None, children=None,
        // text=Some) so they return their $text directly.
        assert_eq!(rendered, "// hello\nrendered:1");
    }

    #[test]
    fn render_node_data_appends_trailing_trivia() {
        let mut engine = Engine::new(TestGrammar, None).unwrap();
        let tree = engine.parse("fn main() {}".to_string()).unwrap();
        let n = node_with_trivia(
            None,
            Some(vec![comment_leaf("// trailing")]),
        );
        let rendered = tree.render_node_data(n).unwrap();
        assert_eq!(rendered, "rendered:1\n// trailing");
    }

    #[test]
    fn render_node_data_wraps_with_both_trivia() {
        let mut engine = Engine::new(TestGrammar, None).unwrap();
        let tree = engine.parse("fn main() {}".to_string()).unwrap();
        let n = node_with_trivia(
            Some(vec![comment_leaf("// before")]),
            Some(vec![comment_leaf("// after")]),
        );
        let rendered = tree.render_node_data(n).unwrap();
        assert_eq!(rendered, "// before\nrendered:1\n// after");
    }

    #[test]
    fn render_node_data_multiple_trivia_items_joined_with_newlines() {
        let mut engine = Engine::new(TestGrammar, None).unwrap();
        let tree = engine.parse("fn main() {}".to_string()).unwrap();
        let n = node_with_trivia(
            Some(vec![comment_leaf("// line 1"), comment_leaf("// line 2")]),
            None,
        );
        let rendered = tree.render_node_data(n).unwrap();
        assert_eq!(rendered, "// line 1\n// line 2\nrendered:1");
    }

    #[test]
    fn render_node_data_no_trivia_unchanged() {
        let mut engine = Engine::new(TestGrammar, None).unwrap();
        let tree = engine.parse("fn main() {}".to_string()).unwrap();
        let n = node(Source::Factory);
        let rendered = tree.render_node_data(n).unwrap();
        // TestGrammar's render returns "rendered:<kind_id>", but the leaf
        // fast-path in render_dispatch applies: fields=None,
        // children=None, text=Some("x") → returns "x" directly.
        // Actually, render_node_data calls grammar.render() which is
        // TestGrammar::render → "rendered:1".
        assert_eq!(rendered, "rendered:1");
    }

    #[test]
    fn render_node_data_empty_trivia_arrays_unchanged() {
        let mut engine = Engine::new(TestGrammar, None).unwrap();
        let tree = engine.parse("fn main() {}".to_string()).unwrap();
        let n = node_with_trivia(Some(vec![]), Some(vec![]));
        let rendered = tree.render_node_data(n).unwrap();
        assert_eq!(rendered, "rendered:1");
    }

}
