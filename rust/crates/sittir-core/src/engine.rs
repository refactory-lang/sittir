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
/// Created by [`Engine::parse`] or [`Engine::parse_and_read`]. Contains
/// all tree-dependent state that was previously inlined in `Engine`.
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
    /// Stamps `node_handle` on the returned root and pushes the root
    /// node into the node table for subsequent child navigation.
    pub fn read_root(&mut self) -> NodeData {
        // Read first (borrows tree + source immutably).
        let mut data = read_node(&self.tree, &self.source, None);
        // Push root into node table. We inline the push_node logic
        // here to avoid a self-borrow conflict (root_node() borrows
        // self.tree, but push_node needs &mut self).
        let handle = self.nodes.len() as u32;
        // SAFETY: root_node borrows from self.tree which outlives
        // self.nodes (nodes declared after tree → dropped first).
        let root: tree_sitter::Node<'static> =
            unsafe { std::mem::transmute(self.tree.root_node()) };
        self.nodes.push(StoredNode::Ts(root));
        data.node_handle = Some(handle);
        data
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
        let mut data = read_node(&self.tree, &self.source, Some(child_node));
        let new_handle = self.push_node(child_node);
        data.node_handle = Some(new_handle);
        serde_json::to_string(&data).map_err(|e| format!("serialize NodeData failed: {e}"))
    }

    /// Backward-compat bridge: read a specific node by tree-sitter
    /// `Node::id()`. Will be removed in Task 3 when grammar crates
    /// switch to handle-based navigation.
    #[allow(dead_code)]
    pub fn read_node_by_id(&self, node_id: u64) -> Result<String, String> {
        let root = self.tree.root_node();
        let found = find_by_id(root, node_id)
            .ok_or_else(|| format!("node id {node_id} not found in current tree"))?;
        let data = read_node(&self.tree, &self.source, Some(found));
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

    /// Render a deserialized `NodeData` with format application.
    pub fn render_node_data(&self, node: NodeData) -> Result<String, String> {
        let canonical = self
            .grammar
            .render(&node)
            .map_err(|e| format!("render_dispatch failed: {e}"))?;
        self.render_canonical_node(&node, canonical)
    }

    /// Apply format to a pre-rendered canonical string.
    pub fn render_canonical_node(
        &self,
        node: &NodeData,
        canonical: String,
    ) -> Result<String, String> {
        let effective_format =
            resolve_render_format(node, None, self.format.as_ref());
        Ok(match effective_format {
            Some(format) => apply_format(&canonical, format),
            None => canonical,
        })
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
///
/// For backward compatibility during the Task 1→3 migration, the engine
/// also retains a cached `ParsedTree` so that existing grammar-crate
/// wrappers (`parse_and_read` / `read_node` / `render` / `dispose`) keep
/// working without modification until Task 3 updates them.
pub struct Engine<G: EngineGrammar> {
    grammar: G,
    parser: tree_sitter::Parser,
    engine_format: Option<FormatRecord>,
    /// Cached parse result for backward-compat with grammar crate wrappers.
    /// Removed in Task 3 when grammar crates switch to `ParsedTree` directly.
    cached_tree: Option<ParsedTree<G>>,
}

/// Result wrapper for parse-and-read calls.
#[derive(serde::Serialize)]
struct ParseResult<'a> {
    #[serde(rename = "nodeData")]
    node_data: &'a NodeData,
    #[serde(skip_serializing_if = "Option::is_none")]
    format: Option<FormatRecord>,
}

impl<G: EngineGrammar> Engine<G> {
    pub fn new(grammar: G, engine_format: Option<FormatRecord>) -> Result<Self, String> {
        let mut parser = tree_sitter::Parser::new();
        grammar.configure_parser(&mut parser)?;
        Ok(Self {
            grammar,
            parser,
            engine_format,
            cached_tree: None,
        })
    }

    pub fn template_bundle_hash(&self) -> &'static str {
        self.grammar.template_bundle_hash()
    }

    /// Parse source and return an owned `ParsedTree`.
    ///
    /// This is the new primary API. Grammar crate wrappers will switch to
    /// this in Task 3.
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

    /// Parse + read root. Caches the tree for subsequent `read_node` /
    /// `render` calls. Backward-compat bridge; grammar crates will switch
    /// to `Engine::parse` + `ParsedTree` methods in Task 3.
    pub fn parse_and_read(&mut self, source: String) -> Result<String, String> {
        let mut parsed = self.parse(source)?;
        let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
            parsed.read_root()
        }));
        match result {
            Ok(data) => {
                let format = parsed.format.clone();
                self.cached_tree = Some(parsed);
                serde_json::to_string(&ParseResult {
                    node_data: &data,
                    format,
                })
                .map_err(|e| format!("serialize ParseResult failed: {e}"))
            }
            Err(panic_payload) => Err(panic_msg(panic_payload, "parse_and_read panicked")),
        }
    }

    /// Read a child node by handle + child_index from the cached tree.
    /// Backward-compat bridge for grammar crate napi wrappers.
    pub fn read_node(&mut self, handle: f64, child_index: f64) -> Result<String, String> {
        let cached = self
            .cached_tree
            .as_mut()
            .ok_or_else(|| "no tree cached — call parseAndRead first".to_string())?;
        let h = handle as u32;
        let ci = child_index as u16;
        cached.read_child(h, ci)
    }

    /// Render from JSON with engine-level format override. Backward-compat bridge.
    pub fn render(&self, node_json: String) -> Result<String, String> {
        let node: NodeData = serde_json::from_str(&node_json).map_err(|e| {
            let snippet: String = node_json.chars().take(80).collect();
            format!("parse NodeData JSON failed: {e} (json: {snippet:?})")
        })?;
        self.render_node_data(node)
    }

    /// Render a deserialized `NodeData`. Backward-compat bridge.
    pub fn render_node_data(&self, node: NodeData) -> Result<String, String> {
        let canonical = self
            .grammar
            .render(&node)
            .map_err(|e| format!("render_dispatch failed: {e}"))?;
        self.render_canonical_node(&node, canonical)
    }

    /// Apply engine-level + tree-level format to a pre-rendered canonical string.
    /// Backward-compat bridge used by grammar crate napi wrappers.
    pub fn render_canonical_node(
        &self,
        node: &NodeData,
        canonical: String,
    ) -> Result<String, String> {
        let tree_format = self
            .cached_tree
            .as_ref()
            .and_then(|pt| pt.format.as_ref());
        let effective_format = resolve_render_format(
            node,
            self.engine_format.as_ref(),
            tree_format,
        );
        Ok(match effective_format {
            Some(format) => apply_format(&canonical, format),
            None => canonical,
        })
    }

    pub fn apply_edits(&self, source: String, edits: Vec<Edit>) -> Result<String, String> {
        splice_apply_edits(&source, edits).map_err(|e| format!("{e}"))
    }

    pub fn dispose(&mut self) {
        self.cached_tree = None;
    }
}


/// Depth-first search for the tree-sitter node whose canonical
/// `Node::id()` matches `target`. Backward-compat helper for
/// `read_node_by_id`; will be removed in Task 3.
#[allow(dead_code)]
fn find_by_id<'a>(node: tree_sitter::Node<'a>, target: u64) -> Option<tree_sitter::Node<'a>> {
    if node.id() as u64 == target {
        return Some(node);
    }
    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        if let Some(found) = find_by_id(child, target) {
            return Some(found);
        }
    }
    None
}

fn resolve_render_format<'a>(
    node: &NodeData,
    engine_format: Option<&'a FormatRecord>,
    tree_format: Option<&'a FormatRecord>,
) -> Option<&'a FormatRecord> {
    if let Some(format) = engine_format {
        return Some(format);
    }
    if !matches!(node.source, Source::Factory) {
        return tree_format;
    }
    None
}

fn panic_msg(payload: Box<dyn std::any::Any + Send>, fallback: &str) -> String {
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
        }
    }

    #[test]
    fn render_node_data_preserves_engine_format() {
        let engine = Engine::new(TestGrammar, Some(format_record("<<", ">>"))).unwrap();

        let rendered = engine.render_node_data(node(Source::Factory)).unwrap();

        // KindId(1) Display → "1"; the TestGrammar render fn formats the KindId.
        assert_eq!(rendered, "<<rendered:1>>");
    }

    #[test]
    fn render_canonical_node_preserves_tree_format_for_tree_nodes() {
        let mut engine = Engine::new(TestGrammar, None).unwrap();
        // Inject a cached ParsedTree with a format record to simulate
        // the tree_format that parse_and_read would populate.
        engine.cached_tree = Some(ParsedTree {
            grammar: TestGrammar,
            tree: make_tree(),
            source: String::new(),
            format: Some(format_record("[", "]")),
            nodes: Vec::new(),
        });

        let rendered = engine
            .render_canonical_node(&node(Source::Ts), "canonical".to_string())
            .unwrap();

        assert_eq!(rendered, "[canonical]");
    }

    #[test]
    fn render_canonical_node_does_not_apply_tree_format_to_factory_nodes() {
        let mut engine = Engine::new(TestGrammar, None).unwrap();
        engine.cached_tree = Some(ParsedTree {
            grammar: TestGrammar,
            tree: make_tree(),
            source: String::new(),
            format: Some(format_record("[", "]")),
            nodes: Vec::new(),
        });

        let rendered = engine
            .render_canonical_node(&node(Source::Factory), "canonical".to_string())
            .unwrap();

        assert_eq!(rendered, "canonical");
    }

    /// Create a minimal tree for test ParsedTree construction.
    fn make_tree() -> tree_sitter::Tree {
        let mut parser = tree_sitter::Parser::new();
        let language: tree_sitter::Language = tree_sitter_rust::LANGUAGE.into();
        parser.set_language(&language).unwrap();
        parser.parse("fn x(){}", None).unwrap()
    }
}
