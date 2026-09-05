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
//! `ParsedTree<G>` that owns the tree, source, format, and a node coordinate
//! table for drill-in navigation. Coordinates are stable child-index paths
//! from the root, re-resolved on each access — no lifetime-erasure needed.

use std::marker::PhantomData;
use crate::options::ResolvedOptions;
use crate::format::{apply_format, extract_format};
use crate::read_node::{read_node, ReadDepth};
use crate::splice::apply_edits as splice_apply_edits;
use crate::types::{Edit, FormatRecord, NodeData, Source};

/// Grammar-specific hooks used by the shared native engine.
pub trait EngineGrammar: Copy {
    fn configure_parser(self, parser: &mut tree_sitter::Parser) -> Result<(), String>;
    fn template_bundle_hash(self) -> &'static str;
}

// ─── NodeCoord ────────────────────────────────────────────────────────────────────────────

/// O(1) coordinate for a node: a back-link to its parent handle plus the
/// child index taken from that parent.
///
/// This replaces the earlier `Vec<u32>` root-relative path. Storing a full
/// path meant every `read_child` cloned the parent's O(depth) `Vec` to append
/// one index — O(depth) alloc+copy per node-handle creation. A parent-link
/// pair is `Copy`, so pushing a coordinate is O(1) with zero allocation; the
/// node table itself encodes the tree spine, and resolution re-walks parent
/// links.
///
/// Like the path representation it supersedes, this caches **no** live `Node`
/// — it only records *how* to reach one. Re-resolution (via
/// [`ParsedTree::resolve_handle`]) is sound because `tree_sitter::Tree` owns
/// its internal data and `Node` values are cheap lightweight cursors over it;
/// no `unsafe transmute` or lifetime-erasure is required. This preserves the
/// b4778bb5 invariant ("re-resolve, never cache a lifetime-erased Node") while
/// removing the per-step path clone.
#[derive(Clone, Copy)]
struct NodeCoord {
    /// Handle of the parent node in `ParsedTree.nodes`, or `None` for the root.
    parent: Option<u32>,
    /// Child index taken from `parent` to reach this node. Unused for the root.
    child_index: u32,
}

impl NodeCoord {
    fn root() -> Self {
        NodeCoord {
            parent: None,
            child_index: 0,
        }
    }
}

// ─── ParsedTree ────────────────────────────────────────────────────────────────────────────

/// Owned parse result — tree + source + format + node coordinate table.
///
/// Created by [`Engine::parse`]. Contains all tree-dependent state.
/// Grammar crate napi wrappers own the `ParsedTree` directly.
///
/// # Design
///
/// Instead of storing lifetime-erased `Node<'static>` references
/// (which is UB-adjacent in debug builds due to transmute + re-borrow),
/// `nodes` stores [`NodeCoord`] — an O(1) `(parent_handle, child_index)`
/// back-link per node. Each access re-resolves the live `Node` from
/// `self.tree` by walking parent links to the root (see
/// [`ParsedTree::resolve_handle`]). Tree-sitter `Node` values are cheap
/// cursor structs over the tree's immutable internal representation, so
/// re-resolution is fast and fully sound — and pushing a coordinate no
/// longer clones an O(depth) `Vec`.
pub struct ParsedTree<G: EngineGrammar> {
    _grammar: PhantomData<G>,
    /// The parsed tree-sitter tree.
    tree: tree_sitter::Tree,
    source: String,
    format: Option<FormatRecord>,
    /// Identity this tree stamps into every handle it mints. Distinct per
    /// parse, so a handle names the tree it belongs to and cannot be spent
    /// against another one.
    tree_id: u32,
    /// Node coordinate table for drill-in navigation. Each entry back-links
    /// to its parent handle; the root entry has `parent: None`.
    nodes: Vec<NodeCoord>,
}

/// Bits of a handle given over to the node index; the rest carry the tree id.
///
/// Handles cross into JavaScript as JSON numbers and come back as doubles, so
/// the two fields together must stay inside the 53-bit range where a double
/// still counts integers exactly. 32 bits of index (4B nodes in one tree) and
/// 21 of tree id (2M parses on one engine) spends that budget exactly.
const HANDLE_INDEX_BITS: u32 = 32;
const HANDLE_INDEX_MASK: u64 = (1u64 << HANDLE_INDEX_BITS) - 1;
/// Largest tree id that still fits beside an index in an exact double.
pub const MAX_TREE_ID: u32 = (1u32 << (53 - HANDLE_INDEX_BITS)) - 1;

/// Pack a tree id and a node index into one self-identifying handle.
fn encode_handle(tree_id: u32, index: u32) -> u64 {
    ((tree_id as u64) << HANDLE_INDEX_BITS) | index as u64
}

/// Split a handle back into the tree that minted it and the index within it.
pub fn decode_handle(handle: u64) -> (u32, u32) {
    (
        (handle >> HANDLE_INDEX_BITS) as u32,
        (handle & HANDLE_INDEX_MASK) as u32,
    )
}

impl<G: EngineGrammar> ParsedTree<G> {
    /// This tree's identity — the tag carried by every handle it mints.
    pub fn tree_id(&self) -> u32 {
        self.tree_id
    }

    /// Push a node coordinate into the node table, returning its tagged handle.
    ///
    /// `NodeCoord` is `Copy`, so this is O(1) with zero allocation — no
    /// O(depth) path `Vec` is cloned per node.
    fn push_coord(&mut self, coord: NodeCoord) -> u64 {
        let index = self.nodes.len() as u32;
        self.nodes.push(coord);
        encode_handle(self.tree_id, index)
    }

    /// Reject a handle minted by a different tree.
    ///
    /// Indices are dense and restart at 0 every parse, so without this an
    /// out-of-tree handle lands in range and resolves to whatever node happens
    /// to sit at that index — an unrelated node returned as though it were the
    /// one asked for. The tag turns that into a refusal.
    fn local_index(&self, handle: u64) -> Result<u32, String> {
        let (tree_id, index) = decode_handle(handle);
        if tree_id != self.tree_id {
            return Err(format!(
                "handle {handle} belongs to tree {tree_id}, not tree {}",
                self.tree_id
            ));
        }
        Ok(index)
    }

    /// Re-resolve the live `Node` for a handle by walking parent back-links to
    /// the root, then descending the same child indices.
    ///
    /// Free-function form (takes `nodes` + `tree` separately) so the returned
    /// `Node<'tree>` borrows only `tree`, not the `nodes` slice — letting the
    /// caller keep a resolved node alive across a `&mut self.nodes` push of a
    /// disjoint field. Recursion depth equals tree depth; source ASTs never
    /// approach the stack limit. No allocation, no lifetime-erasure: this
    /// honors the b4778bb5 invariant of never caching a `Node<'static>`.
    fn resolve_handle<'tree>(
        nodes: &[NodeCoord],
        tree: &'tree tree_sitter::Tree,
        index: u32,
    ) -> Option<tree_sitter::Node<'tree>> {
        let coord = *nodes.get(index as usize)?;
        match coord.parent {
            None => Some(tree.root_node()),
            Some(parent_index) => {
                let parent_node = Self::resolve_handle(nodes, tree, parent_index)?;
                parent_node.child(coord.child_index)
            }
        }
    }

    /// Read the root node of the parsed tree into a `NodeData`.
    pub fn read_root(&mut self, depth: ReadDepth) -> NodeData {
        let handle = self.push_coord(NodeCoord::root());
        read_node(&self.tree, &self.source, None, Some(handle), depth)
    }

    /// Whether this tree minted `handle`.
    pub fn owns_handle(&self, handle: u64) -> bool {
        decode_handle(handle).0 == self.tree_id
    }

    /// Read a child node by handle + child_index.
    ///
    /// Re-resolves the parent `Node` from `self.tree` (walking parent
    /// back-links), takes `parent.child(child_index)` to confirm the child
    /// exists, records an O(1) `(handle, child_index)` coordinate, and reads
    /// the (already resolved) child into a `NodeData`.
    pub fn read_child(
        &mut self,
        handle: u64,
        child_index: u16,
        depth: ReadDepth,
    ) -> Result<String, String> {
        let index = self.local_index(handle)?;
        // Resolve parent and child while only borrowing `self.nodes` + `self.tree`.
        // The returned `child_node` borrows `self.tree` (not `self.nodes`), so it
        // stays valid across the disjoint `&mut self.nodes` push below — no second
        // re-resolution needed.
        let parent_node = Self::resolve_handle(&self.nodes, &self.tree, index).ok_or_else(|| {
            if (index as usize) >= self.nodes.len() {
                format!("handle {handle} not found in node table")
            } else {
                format!("handle {handle}: coordinate path could not be resolved")
            }
        })?;
        let child_node = parent_node.child(child_index as u32).ok_or_else(|| {
            format!(
                "child_index {child_index} out of bounds for handle {handle} (child_count={})",
                parent_node.child_count()
            )
        })?;
        // O(1) push of the back-link coordinate (no path clone). Push directly
        // to the `nodes` field rather than via `&mut self`: `child_node` borrows
        // only `self.tree`, so mutating the disjoint `self.nodes` field while it
        // is alive is sound — and avoids a redundant O(depth) re-resolution.
        let new_index = self.nodes.len() as u32;
        self.nodes.push(NodeCoord {
            parent: Some(index),
            child_index: child_index as u32,
        });
        let data = read_node(
            &self.tree,
            &self.source,
            Some(child_node),
            Some(encode_handle(self.tree_id, new_index)),
            depth,
        );
        serde_json::to_string(&data).map_err(|e| format!("serialize NodeData failed: {e}"))
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
    /// The render options resolved once at construction; a render call may
    /// resolve another table over this one.
    options: ResolvedOptions,
}

/// Result wrapper for parse-and-read calls.
#[derive(serde::Serialize)]
pub struct ParseResult<'a> {
    #[serde(rename = "nodeData")]
    pub node_data: &'a NodeData,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub format: Option<FormatRecord>,
    /// Which tree this parse produced. Handles already carry it, but the
    /// boundary needs it on its own to dispose the tree once JavaScript
    /// drops the last node reading from it.
    #[serde(rename = "treeId")]
    pub tree_id: u32,
}

impl<G: EngineGrammar> Engine<G> {
    pub fn new(
        grammar: G,
        engine_format: Option<FormatRecord>,
        options: ResolvedOptions,
    ) -> Result<Self, String> {
        let mut parser = tree_sitter::Parser::new();
        grammar.configure_parser(&mut parser)?;
        Ok(Self {
            grammar,
            parser,
            engine_format,
            options,
        })
    }

    pub fn options(&self) -> &ResolvedOptions {
        &self.options
    }

    pub fn template_bundle_hash(&self) -> &'static str {
        self.grammar.template_bundle_hash()
    }

    /// Access the engine-level format override (if any).
    pub fn engine_format(&self) -> Option<&FormatRecord> {
        self.engine_format.as_ref()
    }

    /// Parse source and return an owned `ParsedTree` tagged with `tree_id`.
    ///
    /// The caller owns id assignment because it owns the set of live trees;
    /// ids must be distinct across every tree a caller can still reach, or
    /// handles stop being unambiguous.
    pub fn parse(&mut self, source: String, tree_id: u32) -> Result<ParsedTree<G>, String> {
        let tree = self.parser.parse(&source, None).ok_or_else(|| {
            let snippet: String = source.chars().take(80).collect();
            format!("parse failed (source: {snippet:?})")
        })?;
        let format = extract_format(&source, &tree);
        Ok(ParsedTree {
            _grammar: PhantomData,
            tree,
            source,
            format,
            tree_id,
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
            slot_order: None,
        }
    }

    #[test]
    fn render_canonical_node_preserves_engine_format() {
        let engine = Engine::new(TestGrammar, Some(format_record("<<", ">>")), ResolvedOptions::default()).unwrap();

        let rendered = engine
            .render_canonical_node(&node(Source::Factory), "rendered:1".to_string(), None)
            .unwrap();

        assert_eq!(rendered, "<<rendered:1>>");
    }

    #[test]
    fn render_canonical_node_preserves_tree_format_for_tree_nodes() {
        let engine = Engine::new(TestGrammar, None, ResolvedOptions::default()).unwrap();
        let tree_fmt = format_record("[", "]");

        let rendered = engine
            .render_canonical_node(&node(Source::Ts), "canonical".to_string(), Some(&tree_fmt))
            .unwrap();

        assert_eq!(rendered, "[canonical]");
    }

    #[test]
    fn render_canonical_node_does_not_apply_tree_format_to_factory_nodes() {
        let engine = Engine::new(TestGrammar, None, ResolvedOptions::default()).unwrap();
        let tree_fmt = format_record("[", "]");

        let rendered = engine
            .render_canonical_node(
                &node(Source::Factory),
                "canonical".to_string(),
                Some(&tree_fmt),
            )
            .unwrap();

        assert_eq!(rendered, "canonical");
    }

}
