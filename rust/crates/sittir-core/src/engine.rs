//! Shared native engine state for grammar-specific N-API bindings.
//!
//! Grammar crates provide a small [`EngineGrammar`] adapter for parser setup,
//! template hash lookup, and render dispatch. This module owns the generic
//! parse/read/render/edit state machine so `sittir-{lang}` crates stay
//! thin and grammar-owned.
//!
//! ## Engine / ParsedTree split
//!
//! `Engine<G>` is stateless (parser + grammar config). Parsing returns a
//! `ParsedTree<G>` that owns the tree, source, format, and a node coordinate
//! table for hydration navigation. Coordinates are stable child-index paths
//! from the root, re-resolved on each access — no lifetime-erasure needed.

use crate::format::{apply_format, extract_format};
use crate::options::ResolvedOptions;
use crate::query::{Address, DescendantBatch, Plan};
use crate::read_untyped_node::{error_regions, read_untyped_node, stub_of, ErrorRegion, HandleMint, ReadDepth, ReadModel};
use crate::render::SourceTable;
use crate::slot::NodeCoordinate;
use crate::types::{FormatRecord, KindId, UntypedNode, Source};
use std::collections::HashMap;
use std::sync::Arc;

/// Grammar-specific hooks used by the shared native engine.
pub trait EngineGrammar: Copy + ReadModel {
    fn configure_parser(self, parser: &mut tree_sitter::Parser) -> Result<(), String>;
    fn render_module_hash(self) -> &'static str;
}

// ─── NodeCoord ────────────────────────────────────────────────────────────────────────────

/// O(1) coordinate for a node: a back-link to its parent handle plus the
/// child index taken from that parent.
///
/// This replaces the earlier `Vec<u32>` root-relative path. Storing a full
/// path meant every `read_at` cloned the parent's O(depth) `Vec` to append
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

/// Mints into a tree's node table the handle a bounded read gives a child it
/// expands. A parent from another tree mints nothing.
struct TreeMint<'a> {
    nodes: &'a mut Vec<NodeCoord>,
    tree_id: u32,
}

impl HandleMint for TreeMint<'_> {
    fn mint(&mut self, parent: u64, child_index: u16) -> Option<u64> {
        let (tree_id, index) = decode_handle(parent);
        if tree_id != self.tree_id {
            return None;
        }
        let new_index = self.nodes.len() as u32;
        self.nodes.push(NodeCoord {
            parent: Some(index),
            child_index: child_index as u32,
        });
        Some(encode_handle(self.tree_id, new_index))
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
    /// The grammar's read facts, consulted by every read of this tree.
    grammar: G,
    /// The parsed tree-sitter tree.
    tree: tree_sitter::Tree,
    source: Arc<str>,
    format: Option<FormatRecord>,
    /// Identity this tree stamps into every handle it mints. Distinct per
    /// parse, so a handle names the tree it belongs to and cannot be spent
    /// against another one.
    tree_id: u32,
    /// Node coordinate table for hydration navigation. Each entry back-links
    /// to its parent handle; the root entry has `parent: None`.
    nodes: Vec<NodeCoord>,
}

/// Bits of a handle given over to the node index; the rest carry the tree id.
///
/// Handles cross into JavaScript as JSON numbers and come back as doubles, so
/// the two fields together must stay inside the 53-bit range where a double
/// still counts integers exactly. 32 bits of index (4B nodes in one tree) and
/// 21 of tree id (2M parses in one process) spends that budget exactly.
const HANDLE_INDEX_BITS: u32 = 32;
const HANDLE_INDEX_MASK: u64 = (1u64 << HANDLE_INDEX_BITS) - 1;
/// Largest tree id that still fits beside an index in an exact double.
pub const MAX_TREE_ID: u32 = (1u32 << (53 - HANDLE_INDEX_BITS)) - 1;

static NEXT_TREE_ID: std::sync::atomic::AtomicU32 = std::sync::atomic::AtomicU32::new(0);

/// Mint the next tree id from this linked image's counter. One counter
/// serves every engine the image holds, so no two of them ever hold a tree
/// under the same id: a coordinate names its tree unambiguously, and an
/// engine handed another engine's coordinate finds no such tree and refuses
/// it rather than slicing whatever tree sits at that index in its own table.
/// Ids are never reused — a stale handle must not come back to life under a
/// later tree — so once `MAX_TREE_ID` is claimed every later claim gets
/// `None` and the counter stays put. Each grammar's addon is its own image
/// with its own copy of this counter; the napi engine therefore claims from
/// the JavaScript process instead (`claim_tree_id_from`), and this counter
/// serves engines built in Rust alone.
pub fn claim_tree_id() -> Option<u32> {
    NEXT_TREE_ID
        .fetch_update(
            std::sync::atomic::Ordering::Relaxed,
            std::sync::atomic::Ordering::Relaxed,
            |next| (next <= MAX_TREE_ID).then_some(next + 1),
        )
        .ok()
}

/// Mint the next tree id from a counter shared by every image in the
/// process. `next` is the last value the owner recorded (none on the first
/// claim); the id and the value to record come back together, or nothing
/// once `MAX_TREE_ID` has been claimed — the owner then records nothing, so
/// the counter stays put and no id is ever reused.
pub fn claim_tree_id_from(next: Option<f64>) -> Option<(u32, f64)> {
    let next = next.unwrap_or(0.0);
    if !(0.0..=MAX_TREE_ID as f64).contains(&next) || next.fract() != 0.0 {
        return None;
    }
    let id = next as u32;
    Some((id, f64::from(id) + 1.0))
}

/// Pack a tree id and a node index into one self-identifying handle.
pub fn encode_handle(tree_id: u32, index: u32) -> u64 {
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

    /// Read the root node of the parsed tree into an `UntypedNode`.
    pub fn read_root(&mut self, depth: ReadDepth) -> UntypedNode {
        let handle = self.push_coord(NodeCoord::root());
        read_untyped_node(
            &self.tree,
            &self.source,
            None,
            Some(handle),
            depth,
            &self.grammar,
            &mut TreeMint {
                nodes: &mut self.nodes,
                tree_id: self.tree_id,
            },
        )
    }

    /// Whether this tree minted `handle`.
    pub fn owns_handle(&self, handle: u64) -> bool {
        decode_handle(handle).0 == self.tree_id
    }

    /// The node `address` names, without minting a handle; `None` when it
    /// names no node of this tree.
    pub fn node_at(&self, address: Address) -> Result<Option<tree_sitter::Node<'_>>, String> {
        Ok(match address {
            Address::Own { handle } => Self::resolve_handle(&self.nodes, &self.tree, self.local_index(handle)?),
            Address::Child { parent, index } => {
                Self::resolve_handle(&self.nodes, &self.tree, self.local_index(parent)?).and_then(|node| node.child(index))
            }
            Address::Span { tree, span, kind } => {
                self.local_index(tree)?;
                crate::read_untyped_node::node_at_span(&self.tree, span.start as usize, span.end as usize, kind)
            }
        })
    }

    /// Whether each node `addresses` names satisfies `plan`, in order. An
    /// address that names no node of this tree is refused.
    pub fn plan_holds(&self, addresses: &[Address], plan: &Plan) -> Result<Vec<bool>, String> {
        addresses
            .iter()
            .map(|&address| {
                let node = self.node_at(address)?.ok_or_else(|| format!("{address:?} names no node of tree {}", self.tree_id))?;
                Ok(plan.holds(&node, &self.source))
            })
            .collect()
    }

    /// The node-table index of the node `address` names, minting the
    /// coordinates that reach it when it has none.
    fn index_of(&mut self, address: Address) -> Result<u32, String> {
        match address {
            Address::Own { handle } => self.local_index(handle),
            Address::Child { parent, index } => {
                let parent_index = self.local_index(parent)?;
                Self::resolve_handle(&self.nodes, &self.tree, parent_index)
                    .and_then(|node| node.child(index))
                    .ok_or_else(|| format!("{address:?} names no node of tree {}", self.tree_id))?;
                Ok(self.mint(NodeCoord { parent: Some(parent_index), child_index: index }))
            }
            Address::Span { .. } => {
                let node = self.node_at(address)?.ok_or_else(|| format!("{address:?} names no node of tree {}", self.tree_id))?;
                let mut path = Vec::new();
                let mut current = node;
                while let Some(parent) = current.parent() {
                    let mut cursor = parent.walk();
                    let position = parent
                        .children(&mut cursor)
                        .position(|child| child.id() == current.id())
                        .ok_or("a node is not among its parent's children")?;
                    path.push(position as u32);
                    current = parent;
                }
                let mut index = self.mint(NodeCoord::root());
                for &child_index in path.iter().rev() {
                    index = self.mint(NodeCoord { parent: Some(index), child_index });
                }
                Ok(index)
            }
        }
    }

    fn mint(&mut self, coord: NodeCoord) -> u32 {
        let index = self.nodes.len() as u32;
        self.nodes.push(coord);
        index
    }

    /// Walk the subtree under `from` in pre-order and return up to `limit`
    /// stubs of the named, non-extra descendants whose grammar symbol is in
    /// `kinds` (every one when `kinds` is empty) and that satisfy `plan`, each
    /// carrying the coordinate it is hydrated at. `resume` is the path of
    /// child indices, from the node at `handle`, of the last node an earlier
    /// batch visited; the walk continues after it. `depth` bounds the levels
    /// walked below `from` (every level when absent). An extra is trivia: the
    /// walk neither returns nor enters it. A handle is minted only for the
    /// parent of a stub returned.
    pub fn descendants(
        &mut self,
        from: Address,
        kinds: &[u16],
        plan: Option<&Plan>,
        resume: Option<&[u32]>,
        limit: u32,
        depth: Option<u32>,
    ) -> Result<DescendantBatch, String> {
        let depth = depth.map_or(usize::MAX, |levels| levels as usize);
        let index = self.index_of(from)?;
        let origin = encode_handle(self.tree_id, index);
        let start = Self::resolve_handle(&self.nodes, &self.tree, index)
            .ok_or_else(|| format!("{from:?} not found in node table"))?;
        let mut cursor = start.walk();
        // frames[k]: the node-table index of the node at depth k below
        // `start`, minted only when a stub needs it as a parent. path[k - 1]:
        // that node's child index within its parent.
        let mut frames: Vec<Option<u32>> = vec![Some(index)];
        let mut path: Vec<u32> = Vec::new();
        let mut stubs = Vec::new();
        if let Some(resume) = resume {
            for &child in resume {
                if !cursor.goto_first_child() {
                    return Err("resume path leaves the tree".to_string());
                }
                for _ in 0..child {
                    if !cursor.goto_next_sibling() {
                        return Err("resume path leaves the tree".to_string());
                    }
                }
                frames.push(None);
                path.push(child);
            }
        }
        while Self::advance(&mut cursor, &mut frames, &mut path, depth) {
            let node = cursor.node();
            if node.is_named()
                && !node.is_extra()
                && (kinds.is_empty() || kinds.contains(&node.grammar_id()))
                && plan.map_or(true, |plan| plan.holds(&node, &self.source))
            {
                let depth = frames.len() - 1;
                let parent = Self::mint_frame(&mut self.nodes, &mut frames, &path, depth - 1);
                let child_index = path[depth - 1] as u16;
                stubs.push(stub_of(node, &self.source, Some(encode_handle(self.tree_id, parent)), child_index));
                if stubs.len() as u32 >= limit {
                    return Ok(DescendantBatch { stubs, resume: Some(path), origin });
                }
            }
        }
        Ok(DescendantBatch { stubs, resume: None, origin })
    }

    /// Step `cursor` to the next node in pre-order below the walk's start, at
    /// most `depth` levels down and never into an extra, keeping `frames` and
    /// `path` in step; `false` once the walk is done.
    fn advance(cursor: &mut tree_sitter::TreeCursor<'_>, frames: &mut Vec<Option<u32>>, path: &mut Vec<u32>, depth: usize) -> bool {
        if frames.len() <= depth && !cursor.node().is_extra() && cursor.goto_first_child() {
            frames.push(None);
            path.push(0);
            return true;
        }
        loop {
            if frames.len() == 1 {
                return false;
            }
            if cursor.goto_next_sibling() {
                if let Some(last) = path.last_mut() {
                    *last += 1;
                }
                *frames.last_mut().expect("a frame below the start") = None;
                return true;
            }
            cursor.goto_parent();
            frames.pop();
            path.pop();
        }
    }

    /// The node-table index of the frame at `depth`, minting it and every
    /// unminted frame above it.
    fn mint_frame(nodes: &mut Vec<NodeCoord>, frames: &mut [Option<u32>], path: &[u32], depth: usize) -> u32 {
        if let Some(index) = frames[depth] {
            return index;
        }
        let parent = Self::mint_frame(nodes, frames, path, depth - 1);
        let index = nodes.len() as u32;
        nodes.push(NodeCoord {
            parent: Some(parent),
            child_index: path[depth - 1],
        });
        frames[depth] = Some(index);
        index
    }

    /// Read a child node by handle + child_index.
    ///
    /// Re-resolves the parent `Node` from `self.tree` (walking parent
    /// back-links), takes `parent.child(child_index)` to confirm the child
    /// exists, records an O(1) `(handle, child_index)` coordinate, and reads
    /// the (already resolved) child into an `UntypedNode`.
    pub fn read_at(
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
        let parent_node =
            Self::resolve_handle(&self.nodes, &self.tree, index).ok_or_else(|| {
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
        let data = read_untyped_node(
            &self.tree,
            &self.source,
            Some(child_node),
            Some(encode_handle(self.tree_id, new_index)),
            depth,
            &self.grammar,
            &mut TreeMint {
                nodes: &mut self.nodes,
                tree_id: self.tree_id,
            },
        );
        serde_json::to_string(&data).map_err(|e| format!("serialize UntypedNode failed: {e}"))
    }

    /// Apply format to a pre-rendered canonical string.
    pub fn render_canonical_node(
        &self,
        node: &UntypedNode,
        canonical: String,
    ) -> Result<String, String> {
        Ok(apply_render_format(
            node.source,
            canonical,
            None,
            self.format.as_ref(),
        ))
    }

    /// Every ERROR and MISSING region of the parse (`error_regions`).
    pub fn error_regions(&self) -> Vec<ErrorRegion> {
        error_regions(&self.tree)
    }

    /// Access the detected format record (if any).
    pub fn format(&self) -> Option<&FormatRecord> {
        self.format.as_ref()
    }

    /// Access the source string.
    pub fn source(&self) -> &str {
        &self.source
    }

    /// The line-break runs the node named by `handle` owns as trivia
    /// (`read_untyped_node::line_gaps`), each classified by `classify`.
    pub fn line_gaps_at(
        &self,
        handle: u64,
        classify: &dyn Fn(&str) -> Option<u16>,
    ) -> Result<crate::read_untyped_node::LineGaps, String> {
        let index = self.local_index(handle)?;
        let node = Self::resolve_handle(&self.nodes, &self.tree, index)
            .ok_or_else(|| format!("handle {handle} not found in node table"))?;
        Ok(crate::read_untyped_node::line_gaps(node, &self.source, &self.grammar, classify))
    }

    /// `line_gaps_at` for a node named by its coordinate (the tree's tag, its
    /// span and its stamped kind), as a deep read leaves it.
    pub fn line_gaps_at_span(
        &self,
        tree_handle: u64,
        start: usize,
        end: usize,
        kind: u16,
        classify: &dyn Fn(&str) -> Option<u16>,
    ) -> Result<crate::read_untyped_node::LineGaps, String> {
        self.local_index(tree_handle)?;
        let node = crate::read_untyped_node::node_at_span(&self.tree, start, end, kind)
            .ok_or_else(|| format!("no {kind} node spans {start}..{end} in tree {}", self.tree_id))?;
        Ok(crate::read_untyped_node::line_gaps(node, &self.source, &self.grammar, classify))
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
    #[serde(rename = "untypedNode")]
    pub untyped_node: &'a UntypedNode,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub format: Option<FormatRecord>,
    /// Which tree this parse produced. Handles already carry it, but the
    /// boundary needs it on its own to dispose the tree once JavaScript
    /// drops the last node reading from it.
    #[serde(rename = "treeId")]
    pub tree_id: u32,
    /// The parse's ERROR and MISSING regions; empty for a clean parse.
    pub errors: Vec<ErrorRegion>,
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

    pub fn render_module_hash(&self) -> &'static str {
        self.grammar.render_module_hash()
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
        let format = extract_format(&source, &tree, &self.options.indent);
        Ok(ParsedTree {
            grammar: self.grammar,
            tree,
            source: Arc::from(source.as_str()),
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
        node: &UntypedNode,
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
}

/// Resolve the effective format from source provenance alone — no UntypedNode
/// required. Engine-level format takes priority; tree-level format applies
/// only to non-factory nodes (readUntypedNode output). Factory-constructed nodes
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
/// instead of `&UntypedNode`. This is the public standalone API for format
/// application — callers that have KindId + Source + Span from any source
/// (transport structs, readUntypedNode output, etc.) can apply format without
/// constructing a full `UntypedNode`.
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

    impl ReadModel for TestGrammar {}

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

        fn render_module_hash(self) -> &'static str {
            "test"
        }
    }

    const FNS: &str = "fn a() {}\nmod m { fn b() -> u8 { 0 } fn _c() {} }\nfn _d() { fn e() {} }\n";

    fn kind_id(name: &str) -> u16 {
        let language: tree_sitter::Language = tree_sitter_rust::LANGUAGE.into();
        language.id_for_node_kind(name, true)
    }

    fn parsed(source: &str) -> (ParsedTree<TestGrammar>, u64) {
        let mut engine = Engine::new(TestGrammar, None, ResolvedOptions::default()).expect("engine");
        let mut tree = engine.parse(source.to_string(), 1).expect("parse");
        let root = tree.read_root(ReadDepth::SHALLOW);
        let handle = match root.handle {
            Some(crate::types::NodeHandle::Own(handle)) => handle,
            other => panic!("root has no own handle: {other:?}"),
        };
        (tree, handle)
    }

    fn texts(tree: &ParsedTree<TestGrammar>, stubs: &[UntypedNode]) -> Vec<String> {
        stubs
            .iter()
            .map(|stub| {
                let span = stub.span.expect("a stub carries its span");
                tree.source()[span.start as usize..span.end as usize].lines().next().unwrap_or("").to_string()
            })
            .collect()
    }

    fn walk(tree: &mut ParsedTree<TestGrammar>, root: u64, kinds: &[u16], plan: Option<&Plan>, limit: u32) -> Vec<UntypedNode> {
        let mut stubs = Vec::new();
        let mut resume: Option<Vec<u32>> = None;
        loop {
            let batch = tree.descendants(crate::query::Address::Own { handle: root }, kinds, plan, resume.as_deref(), limit, None).expect("walk");
            assert!(batch.stubs.len() as u32 <= limit);
            stubs.extend(batch.stubs);
            match batch.resume {
                Some(path) => resume = Some(path),
                None => return stubs,
            }
        }
    }

    fn plan(json: &str) -> Plan {
        Plan::compile(serde_json::from_str(json).expect("plan json")).expect("plan compiles")
    }

    #[test]
    fn descendants_of_a_kind_come_in_pre_order() {
        let (mut tree, root) = parsed(FNS);
        let stubs = walk(&mut tree, root, &[kind_id("function_item")], None, u32::MAX);
        assert_eq!(texts(&tree, &stubs), ["fn a() {}", "fn b() -> u8 { 0 }", "fn _c() {}", "fn _d() { fn e() {} }", "fn e() {}"]);
    }

    #[test]
    fn every_batch_limit_yields_the_same_descendants() {
        let (mut tree, root) = parsed(FNS);
        let all = walk(&mut tree, root, &[], None, u32::MAX);
        for limit in [1, 2, 3, 4, 16] {
            let batched = walk(&mut tree, root, &[], None, limit);
            assert_eq!(texts(&tree, &batched), texts(&tree, &all), "limit {limit}");
        }
    }

    #[test]
    fn each_stub_hydrates_to_the_kind_and_span_it_reports() {
        let (mut tree, root) = parsed(FNS);
        for stub in walk(&mut tree, root, &[], None, 2) {
            let Some(crate::types::NodeHandle::Parent(parent)) = stub.handle else { panic!("a stub names its parent") };
            let json = tree.read_at(parent, stub.child_index.expect("a stub names its index"), ReadDepth::SHALLOW).expect("hydrate");
            let read: serde_json::Value = serde_json::from_str(&json).expect("read json");
            assert_eq!(read["$type"], serde_json::json!(stub.type_.0));
            let span = stub.span.expect("span");
            assert_eq!(read["$span"], serde_json::json!({ "start": span.start, "end": span.end }));
        }
    }

    #[test]
    fn a_where_plan_selects_by_a_slot_text() {
        let (mut tree, root) = parsed(FNS);
        let fns = [kind_id("function_item")];
        let eq = plan(r#"{ "op": "eq", "fields": ["name"], "kinds": [], "text": "b" }"#);
        let eq_stubs = walk(&mut tree, root, &fns, Some(&eq), 1);
        assert_eq!(texts(&tree, &eq_stubs), ["fn b() -> u8 { 0 }"]);
        let private = plan(r#"{ "op": "and", "of": [{ "op": "match", "fields": ["name"], "kinds": [], "pattern": "^_" }, { "op": "not", "of": { "op": "eq", "fields": ["name"], "kinds": [], "text": "_c" } }] }"#);
        let private_stubs = walk(&mut tree, root, &fns, Some(&private), 1);
        assert_eq!(texts(&tree, &private_stubs), ["fn _d() { fn e() {} }"]);
        let typed = plan(r#"{ "op": "or", "of": [{ "op": "eq", "fields": ["return_type"], "kinds": [], "text": "u8" }, { "op": "eq", "fields": ["name"], "kinds": [], "text": "e" }] }"#);
        let typed_stubs = walk(&mut tree, root, &fns, Some(&typed), 4);
        assert_eq!(texts(&tree, &typed_stubs), ["fn b() -> u8 { 0 }", "fn e() {}"]);
    }

    #[test]
    fn a_route_by_kind_admits_only_children_under_no_field() {
        let (mut tree, root) = parsed(FNS);
        let lists = [kind_id("declaration_list"), kind_id("block")];
        let by_kind = plan(r#"{ "op": "match", "fields": [], "kinds": ["function_item"], "pattern": "^fn e" }"#);
        let blocks = walk(&mut tree, root, &lists, Some(&by_kind), 4);
        assert_eq!(texts(&tree, &blocks), ["{ fn e() {} }"]);
        let named_not_kind = plan(r#"{ "op": "eq", "fields": [], "kinds": ["identifier"], "text": "b" }"#);
        assert!(walk(&mut tree, root, &[kind_id("function_item")], Some(&named_not_kind), 4).is_empty());
    }

    fn walk_from(tree: &mut ParsedTree<TestGrammar>, from: crate::query::Address, kinds: &[u16]) -> Vec<String> {
        let batch = tree.descendants(from, kinds, None, None, u32::MAX, None).expect("walk");
        texts(tree, &batch.stubs)
    }

    #[test]
    fn a_walk_starts_from_a_stub_or_a_span_address() {
        let (mut tree, root) = parsed(FNS);
        let fns = [kind_id("function_item")];
        let module = walk(&mut tree, root, &[kind_id("mod_item")], None, u32::MAX).remove(0);
        let Some(crate::types::NodeHandle::Parent(parent)) = module.handle else { panic!("a stub names its parent") };
        let child = crate::query::Address::Child { parent, index: module.child_index.expect("index") as u32 };
        assert_eq!(walk_from(&mut tree, child, &fns), ["fn b() -> u8 { 0 }", "fn _c() {}"]);
        let outer = walk(&mut tree, root, &fns, None, u32::MAX).remove(3);
        let span = outer.span.expect("span");
        let at = crate::query::Address::Span { tree: root, span, kind: outer.type_.0 };
        assert_eq!(walk_from(&mut tree, at, &fns), ["fn e() {}"]);
        let none = [u16::MAX];
        let before = tree.nodes.len();
        let first = tree.descendants(at, &none, None, None, 1, None).expect("walk");
        assert!(tree.nodes.len() > before, "a span address mints the coordinates that reach it");
        let minted = tree.nodes.len();
        tree.descendants(crate::query::Address::Own { handle: first.origin }, &none, None, None, 1, None).expect("walk");
        assert_eq!(tree.nodes.len(), minted, "a walk from the origin mints nothing for its start");
    }

    #[test]
    fn a_plan_holds_over_a_list_of_addresses_in_order() {
        let (mut tree, root) = parsed(FNS);
        let stubs = walk(&mut tree, root, &[kind_id("function_item")], None, u32::MAX);
        let addresses: Vec<crate::query::Address> = stubs
            .iter()
            .map(|stub| match stub.handle {
                Some(crate::types::NodeHandle::Parent(parent)) => crate::query::Address::Child { parent, index: stub.child_index.expect("index") as u32 },
                ref other => panic!("a stub names its parent, not {other:?}"),
            })
            .collect();
        let private = plan(r#"{ "op": "match", "fields": ["name"], "kinds": [], "pattern": "^_" }"#);
        assert_eq!(tree.plan_holds(&addresses, &private).expect("holds"), [false, false, true, true, false]);
        let elsewhere = crate::query::Address::Own { handle: encode_handle(9, 0) };
        assert!(tree.plan_holds(&[elsewhere], &private).is_err());
    }

    #[test]
    fn a_depth_limit_stops_the_walk_below_it() {
        let (mut tree, root) = parsed(FNS);
        let children = tree.descendants(crate::query::Address::Own { handle: root }, &[], None, None, u32::MAX, Some(1)).expect("walk");
        assert_eq!(texts(&tree, &children.stubs), ["fn a() {}", "mod m { fn b() -> u8 { 0 } fn _c() {} }", "fn _d() { fn e() {} }"]);
        let mut resumed = Vec::new();
        let mut resume: Option<Vec<u32>> = None;
        loop {
            let batch = tree.descendants(crate::query::Address::Own { handle: root }, &[], None, resume.as_deref(), 1, Some(1)).expect("walk");
            resumed.extend(batch.stubs);
            match batch.resume {
                Some(path) => resume = Some(path),
                None => break,
            }
        }
        assert_eq!(texts(&tree, &resumed), texts(&tree, &children.stubs));
    }

    #[test]
    fn an_extra_and_its_interior_are_never_descendants() {
        let (mut tree, root) = parsed("/// doc\nfn a() {}\n");
        let kinds: Vec<u16> = walk(&mut tree, root, &[], None, u32::MAX).iter().map(|stub| stub.type_.0).collect();
        for extra in ["line_comment", "doc_comment", "outer_doc_comment_marker"] {
            assert!(!kinds.contains(&kind_id(extra)), "{extra} walked");
        }
        assert!(kinds.contains(&kind_id("function_item")));
    }

    #[test]
    fn a_pattern_the_native_matcher_cannot_compile_is_refused() {
        let spec = serde_json::from_str(r#"{ "op": "match", "fields": ["name"], "kinds": [], "pattern": "(a)\\1" }"#).expect("plan json");
        assert!(Plan::compile(spec).is_err());
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

    fn node(source: Source) -> UntypedNode {
        // KindId(1) is the `identifier` symbol in the Rust grammar (see
        // kind_ids.rs); used for test assertions. The render fn below formats
        // the numeric id — tests assert on the number, not the name.
        UntypedNode {
            type_: crate::types::KindId(1),
            display_type: None,
            source,
            named: true,
            fields: None,
            children: None,
            text: Some("x".to_string()),
            span: None,
            handle: None,
            child_index: None,
            trivia_data: None,
            slot_order: None,
            same_line: false,
            tokens_between: 0,
            text_only: false,
        }
    }

    #[test]
    fn render_canonical_node_preserves_engine_format() {
        let engine = Engine::new(
            TestGrammar,
            Some(format_record("<<", ">>")),
            ResolvedOptions::default(),
        )
        .unwrap();

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

/// The engine's live trees as the render context's source table: a handle's
/// tag names the tree, and the tree owns the source its spans index into.
impl<G: EngineGrammar> SourceTable for HashMap<u32, ParsedTree<G>> {
    fn source_of(&self, tree_id: u32) -> Option<&Arc<str>> {
        self.get(&tree_id).map(|tree| &tree.source)
    }

    fn kind_of(&self, coord: &NodeCoordinate) -> Option<KindId> {
        let tree = self.get(&coord.tree_id())?;
        let index = tree.local_index(coord.handle).ok()?;
        ParsedTree::<G>::resolve_handle(&tree.nodes, &tree.tree, index).map(|node| KindId(node.kind_id()))
    }

    fn last_list_child_kind(&self, handle: u64, span: crate::types::Span, kind: KindId) -> Option<KindId> {
        let tree = self.get(&decode_handle(handle).0)?;
        crate::read_untyped_node::last_list_child(&tree.tree, span.start as usize, span.end as usize, kind.0)
            .map(|child| KindId(child.grammar_id()))
    }

    fn for_each_kind_ending_with(&self, coord: &NodeCoordinate, f: &mut dyn FnMut(KindId)) {
        let Some(tree) = self.get(&coord.tree_id()) else {
            return;
        };
        let Ok(index) = tree.local_index(coord.handle) else {
            return;
        };
        let mut node = ParsedTree::<G>::resolve_handle(&tree.nodes, &tree.tree, index);
        let exact = node.is_some_and(|n| {
            n.start_byte() == coord.span.start as usize && n.end_byte() == coord.span.end as usize
        });
        while let Some(current) = node {
            f(KindId(current.kind_id()));
            if !exact {
                return;
            }
            node = u32::try_from(current.child_count())
                .ok()
                .and_then(|count| count.checked_sub(1))
                .and_then(|last| current.child(last))
                .filter(|last| last.end_byte() == current.end_byte());
        }
    }
}
