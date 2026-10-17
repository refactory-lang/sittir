//! Shared native engine state for grammar-specific N-API bindings.
//!
//! Grammar crates provide a small [`EngineGrammar`] adapter for parser setup,
//! template hash lookup, and render dispatch. This module owns the generic
//! parse/read/render/edit state machine so `sittir-{lang}` crates stay
//! thin and grammar-owned.
//!
//! ## Engine / `ParsedTree` split
//!
//! `Engine<G>` is stateless (parser + grammar config). Parsing returns a
//! `ParsedTree<G>` that owns the tree, its source and what the source infers. A handle names a
//! node by its tree's id and its descendant index, re-resolved through a
//! cursor on each access — no lifetime-erasure needed.

use crate::options::ResolvedOptions;
use crate::query::{Address, DescendantBatch, Plan, QueryCoordinate};
use crate::read::SideEntry;
use crate::types::Span;
use crate::render::SourceTable;
use crate::slot::{NodeCoordinate, SlotValue};
use crate::trivia::{FromTriviaText, TriviaEntry, TriviaText};
use crate::trivia_table::{Assigned, TriviaSide, TriviaTable};
use crate::types::{ChildPosition, KindId, NodeIndex, RunId, TreeHandle, TreeId};
use std::collections::HashMap;
use std::sync::Arc;

/// Grammar-specific hooks used by the shared native engine.
pub trait EngineGrammar: Copy {
    fn configure_parser(self, parser: &mut tree_sitter::Parser) -> Result<(), String>;
    fn render_module_hash(self) -> &'static str;
    /// The name of a kind of this grammar, for messages that name one.
    fn kind_name(self, kind: KindId) -> &'static str;
    /// The display ids this grammar claims a node by (`ReadNode::shows`
    /// of its nodes), which a coordinate stamps in place of the grammar id.
    fn shows(self) -> fn(KindId) -> bool;
    /// Whether a node with a grammar id and a display id is a keyword the
    /// grammar relaxes into its word rule (`ReadCtx::relaxes`). A grammar that
    /// relaxes no keyword claims none.
    fn relaxes(self) -> fn(KindId, KindId) -> bool {
        |_, _| false
    }
    /// The grammar's trivia type: what a side of a parsed node holds.
    type Trivia: crate::trivia::FromTriviaText + crate::trivia::TriviaItem;
    /// The grammar's whitespace table, and its layout kinds (the table's domain).
    fn whitespace(self) -> (&'static crate::render::WhitespaceTable, &'static [KindId]);
    /// The grammar's surface kinds the trivia table's assignment reads
    /// (`TriviaTable::assign`).
    fn surface_kinds(self) -> crate::trivia_table::SurfaceKinds;
    /// The grammar's option tables: each site's arms and the address an
    /// options object names it by.
    fn option_tables(self) -> &'static crate::options::OptionTables;
    /// The sides of the unit children of the node at `index` of `tree`, by
    /// slot and item: the node read one level down by `ctx`
    /// (`NodeLayout::units`). None for a grammar with no nodes.
    fn read_units(self, tree: &tree_sitter::Tree, ctx: &crate::read::ReadCtx<'_>, index: crate::types::NodeIndex) -> Vec<crate::layout::UnitSides<Self::Trivia>> {
        let _ = (tree, ctx, index);
        Vec::new()
    }
    /// Renders the node at descendant `index` of `tree`, read by `ctx`
    /// `depth` levels down, from its templates under `render`
    /// (`ParsedTree::recorded`), and answers the text. Refuses a read the
    /// model has no route for, naming it, and a render that fails. A grammar
    /// with no nodes renders nothing.
    fn render_read(self, tree: &tree_sitter::Tree, index: crate::types::NodeIndex, depth: crate::read::Depth, ctx: &crate::read::ReadCtx<'_>, render: &crate::prepare::RenderContext<'_>) -> Result<String, String> {
        let _ = (tree, index, depth, ctx, render);
        Ok(String::new())
    }
    /// The children of the node at `index` of `tree` as its read routes
    /// them (`ReadNode::routes`); none for a node read without routes,
    /// or a grammar with no nodes.
    fn slot_routes(self, tree: &tree_sitter::Tree, index: crate::types::NodeIndex) -> Option<crate::read::Routed> {
        let _ = (tree, index);
        None
    }
    /// How a node with these ids finds its slots, as its read does
    /// (`ReadNode::router`); none for a node read without slots, or a
    /// grammar with no nodes.
    fn router(self, grammar: KindId, display: KindId) -> Option<crate::read::Router> {
        let _ = (grammar, display);
        None
    }
}

/// The node at descendant `index` of `tree`, or `None` past its last node.
#[must_use]
pub fn node_at_index(tree: &tree_sitter::Tree, index: NodeIndex) -> Option<tree_sitter::Node<'_>> {
    if index.index() >= crate::read::descendant_count(&tree.root_node()) as usize {
        return None;
    }
    let mut cursor = tree.walk();
    crate::read::goto(&mut cursor, index);
    Some(cursor.node())
}

/// The byte offsets in `source` of the lines under the node at `index` that
/// begin inside a token spanning lines (a multi-line string or comment), or
/// right after a token ending in a line break with the next token starting at
/// that very offset (a string's content continuing past an interpolation):
/// shifting such a line changes the token's content, so anything that
/// re-indents text leaves it where it is. The tokens are the token walk's
/// (`trivia_table::walk`) and its entries, each an extra or an `ERROR` taken
/// whole. In source order, each offset once.
#[must_use]
pub fn line_starts_inside_tokens(node: tree_sitter::Node<'_>, index: NodeIndex, source: &str) -> Vec<u32> {
    let walk = crate::trivia_table::walk(node, index, source);
    let mut spans: Vec<(u32, u32)> = walk.tokens.iter().map(|token| (token.start, token.end)).collect();
    spans.extend(walk.entries.iter().map(|&entry| walk.span(entry)));
    spans.sort_unstable();
    let mut starts = Vec::new();
    let mut previous_end: Option<u32> = None;
    for (start, end) in spans {
        if previous_end == Some(start) {
            starts.push(start);
        }
        let mut at = start;
        while let Some(found) = source.get(Span { start: at, end }.range()).and_then(|text| text.find('\n')) {
            let line = at + crate::types::narrow(found) + 1;
            if line >= end {
                break;
            }
            starts.push(line);
            at = line;
        }
        if end > start {
            previous_end = source.as_bytes().get(end as usize - 1).filter(|byte| **byte == b'\n').map(|_| end);
        }
    }
    starts.dedup();
    starts
}

/// The descendant index of child `position` of the node at `index`: its own
/// index, one for the node, and every earlier child's descendant count.
#[must_use]
pub fn child_index_of(node: tree_sitter::Node<'_>, index: NodeIndex, position: ChildPosition) -> NodeIndex {
    (0..position.get()).fold(index + 1, |at, i| at + node.child(i).map_or(0, |child| crate::read::descendant_count(&child)))
}

/// The siblings beside a node in its own slot, taken at the outermost node
/// spanning exactly its bytes (a list item's wrapper holds the item's
/// neighbours, not the item): the item before it in its list, or none when it
/// is the first, and the one after it, or none when it is the last. Where the
/// parent's read routes its children (`ParsedTree::siblings`), the items are
/// the children routed to the node's slot, a bare token among them;
/// elsewhere they are the children that hold sides
/// (`trivia_table::holds_sides`) in the same field, or both in none. A child
/// of another slot past the list's closer is not its neighbour.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, serde::Serialize)]
pub struct Siblings {
    pub previous: Option<Sibling>,
    pub next: Option<Sibling>,
}

/// A sibling's span and grammar kind id. The kind is what names a unit
/// sibling, which a rebuilt list holds as its bare kind, with no span.
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize)]
pub struct Sibling {
    pub start: u32,
    pub end: u32,
    pub kind: KindId,
}

/// What kind of region of a source did not parse: an ERROR node error
/// recovery wrapped source in, or a MISSING node it inserted.
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "lowercase")]
pub enum ErrorRegionKind {
    Error,
    Missing,
}

/// One region of a source that did not parse, with its byte span. A MISSING
/// region is empty: it marks where the parser inserted a token.
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize)]
pub struct ErrorRegion {
    pub kind: ErrorRegionKind,
    pub span: Span,
}

/// The in-line runs an entry the source fixes in place carries before and
/// after its own bytes, up to the tokens beside it on its line: an `ERROR`'s,
/// since a seam cannot be trusted beside what did not parse, and a line
/// continuation's, whose line ends inside it. A run that touches a line break stays layout,
/// and the run between two `ERROR`s is the earlier one's. An empty span is
/// no run.
fn error_adjacency(node: &tree_sitter::Node<'_>, source: &str) -> (Span, Span) {
    let bytes = source.as_bytes();
    let in_line = |byte: u8| byte == b' ' || byte == b'\t';
    let own = Span::of(node);
    let std::ops::Range { mut start, mut end } = own.range();
    let mut after = end;
    while after < bytes.len() && in_line(bytes[after]) {
        after += 1;
    }
    if after > end && after < bytes.len() && !matches!(bytes[after], b'\n' | b'\r') {
        end = after;
    }
    let mut before = start;
    while before > 0 && in_line(bytes[before - 1]) {
        before -= 1;
    }
    let taken = node.prev_sibling().is_some_and(|prev| prev.is_error() && Span::of(&prev).range().end == before);
    if before < start && before > 0 && !matches!(bytes[before - 1], b'\n' | b'\r') && !taken {
        start = before;
    }
    (Span { start: crate::types::narrow(start), end: own.start }, Span { start: own.end, end: crate::types::narrow(end) })
}

/// Every ERROR and MISSING region of `tree`, in source order. The walk enters
/// only nodes that hold an error, and never an ERROR node: a region nested in
/// another is part of it.
#[must_use]
pub fn error_regions(tree: &tree_sitter::Tree) -> Vec<ErrorRegion> {
    let mut regions = Vec::new();
    if !tree.root_node().has_error() {
        return regions;
    }
    let mut cursor = tree.walk();
    loop {
        let node = cursor.node();
        let kind = if node.is_error() {
            Some(ErrorRegionKind::Error)
        } else if node.is_missing() {
            Some(ErrorRegionKind::Missing)
        } else {
            None
        };
        if let Some(kind) = kind {
            regions.push(ErrorRegion { kind, span: Span::of(&node) });
        }
        if kind.is_none() && node.has_error() && cursor.goto_first_child() {
            continue;
        }
        while !cursor.goto_next_sibling() {
            if !cursor.goto_parent() {
                return regions;
            }
        }
    }
}

/// The node a coordinate names: of the nodes spanning exactly `start..end`,
/// the outermost the read stamped `kind`, either the grammar symbol that
/// parsed it or the kind the parser shows it as (`identity`), since a node
/// read as an alias envelope is addressed by the kind it shows.
///
/// The search descends from the root by byte: at each level the cursor steps
/// to the child at `start` (`goto_first_child_for_byte`) without visiting the
/// children before it. A span of at least one byte can only sit in that
/// child, since siblings never overlap; a zero-width span can also sit at the
/// end of a sibling ending at `start` or in a zero-width sibling there, so the
/// walk first steps back over the siblings ending at `start`, then tries each
/// child forward, in source order, while it starts at or before `start`.
#[must_use]
pub fn node_at_span(tree: &tree_sitter::Tree, span: Span, kind: KindId) -> Option<tree_sitter::Node<'_>> {
    fn search(node: tree_sitter::Node<'_>, span: Span, kind: KindId) -> Option<tree_sitter::Node<'_>> {
        if Span::of(&node) == span && (crate::read::grammar_id(&node) == kind || crate::read::display_id(&node) == kind) {
            return Some(node);
        }
        let mut walker = node.walk();
        if walker.goto_first_child_for_byte(span.range().start).is_none() && !walker.goto_last_child() {
            return None;
        }
        if span.start == span.end {
            loop {
                let mut back = walker.clone();
                if !back.goto_previous_sibling() || Span::of(&back.node()).end < span.start {
                    break;
                }
                walker = back;
            }
        }
        loop {
            let child = walker.node();
            let own = Span::of(&child);
            if own.start > span.start {
                return None;
            }
            if span.end <= own.end {
                if let Some(found) = search(child, span, kind) {
                    return Some(found);
                }
            }
            if !walker.goto_next_sibling() {
                return None;
            }
        }
    }
    search(tree.root_node(), span, kind)
}

/// The last child that is not an extra of the list spanning `start..end`: of
/// the node the read stamped `kind` at that span (`node_at_span`), or, for a
/// list the tree holds no node of its own for, of the node holding the list's
/// children, among the children that lie within the span. That node is the
/// one strictly around the span, above any node spanning exactly the span.
#[must_use]
pub fn last_list_child(tree: &tree_sitter::Tree, span: Span, kind: KindId) -> Option<tree_sitter::Node<'_>> {
    let holder = if let Some(list) = node_at_span(tree, span, kind) { list } else {
        let inner = outermost_same_span(tree.root_node().descendant_for_byte_range(span.range().start, span.range().end)?);
        if Span::of(&inner) == span {
            inner.parent()?
        } else {
            inner
        }
    };
    let mut cursor = holder.walk();
    let last = holder
        .children(&mut cursor)
        .filter(|child| !child.is_extra() && Span::of(child).start >= span.start && Span::of(child).end <= span.end)
        .last();
    last
}

/// The outermost node spanning exactly the bytes `node` spans: the node
/// itself unless a wrapper holds it alone.
pub(crate) fn outermost_same_span(node: tree_sitter::Node<'_>) -> tree_sitter::Node<'_> {
    let mut outer = node;
    while let Some(up) = outer.parent() {
        if Span::of(&up) != Span::of(&node) {
            break;
        }
        outer = up;
    }
    outer
}

/// The siblings beside the node at descendant `index` (`Siblings`).
#[must_use]
pub fn siblings(tree: &tree_sitter::Tree, index: crate::types::NodeIndex) -> Siblings {
    siblings_counting(tree, index, |_| ())
}

/// [`siblings`], reporting how many children of the parent it visited to `visited`.
fn siblings_counting(tree: &tree_sitter::Tree, index: crate::types::NodeIndex, visited: impl Fn(usize)) -> Siblings {
    let Some(node) = node_at_index(tree, index) else { return Siblings::default() };
    let outer = outermost_same_span(node);
    let Some(parent) = outer.parent() else { return Siblings::default() };
    let sibling = |node: &tree_sitter::Node<'_>| {
        let Span { start, end } = Span::of(node);
        Sibling { start, end, kind: crate::read::grammar_id(node) }
    };
    let mut children = Vec::new();
    let mut cursor = parent.walk();
    if cursor.goto_first_child() {
        loop {
            children.push((cursor.node(), crate::read::field_id(&cursor)));
            if !cursor.goto_next_sibling() {
                break;
            }
        }
    }
    visited(children.len());
    let at = children.iter().position(|(child, _)| child.id() == outer.id()).unwrap_or(0);
    let field = children.get(at).and_then(|&(_, field)| field);
    let item = |(child, of): &&(tree_sitter::Node<'_>, Option<crate::types::FieldId>)| *of == field && crate::trivia_table::holds_sides(child);
    Siblings {
        previous: (Span::of(&parent).start != Span::of(&node).start).then(|| children[..at].iter().rev().find(item).map(|(child, _)| sibling(child))).flatten(),
        next: (Span::of(&parent).end != Span::of(&node).end).then(|| children[at + 1..].iter().find(item).map(|(child, _)| sibling(child))).flatten(),
    }
}

// ─── ParsedTree ────────────────────────────────────────────────────────────────────────────

/// Owned parse result — tree + source + format.
///
/// Created by [`Engine::parse`]. Contains all tree-dependent state.
/// Grammar crate napi wrappers own the `ParsedTree` directly.
///
/// # Design
///
/// A handle names a node by its tree's id and its descendant index, and
/// resolves through a cursor (`node_at_index`).
pub struct ParsedTree<G: EngineGrammar> {
    /// The grammar's read facts, consulted by every read of this tree.
    grammar: G,
    /// The parsed tree-sitter tree.
    tree: tree_sitter::Tree,
    source: Arc<str>,
    /// What the parse read off the source's layout: the tree's layer of the
    /// render options (`InferredOptions`).
    inferred: crate::options::InferredOptions,
    /// The spaces one indentation level spans in the source: the unit's,
    /// else the engine unit's when the source indents by tabs.
    level_width: u32,
    /// Identity this tree stamps into every handle it mints. Distinct per
    /// parse, so a handle names the tree it belongs to and cannot be spent
    /// against another one.
    tree_id: TreeId,
    /// The source's row starts, built on the first snapshot and shared by
    /// every later one.
    lines: std::sync::OnceLock<crate::points::LineTable>,
    /// The tree's trivia, assigned on the first read of a side.
    trivia: std::sync::OnceLock<TriviaTable>,
    /// The options in effect when the tree was read: its inferred layer over
    /// the engine's. What its regions record under.
    read_options: ResolvedOptions,
    /// Each record of the tree, by its node's index and the depth it was
    /// read to (`recorded`).
    records: std::sync::Mutex<HashMap<(NodeIndex, crate::read::Depth), Record>>,
    /// Each node's list slots, by its index, measured on first use
    /// (`node_slots`).
    slots: std::sync::Mutex<HashMap<NodeIndex, Arc<NodeSlots>>>,
    /// Each node's routed children, by its index, measured on first use
    /// (`slot_items`).
    items: std::sync::Mutex<HashMap<NodeIndex, Arc<Option<SlotItems>>>>,
    /// The work its layout reads have done (`layout_work`).
    work: crate::layout::LayoutWorkCounter,
    /// The sides a write replaced, by node and side.
    written: std::collections::BTreeMap<(NodeIndex, TriviaSide), Vec<crate::trivia::TriviaEntry<G::Trivia>>>,
}

/// A record of a tree (`ParsedTree::recorded`), shared by every run it
/// answers, or the error its read or render refused with.
type Record = Arc<Result<crate::baseline::Baseline, String>>;

/// A node's list slots as its tree measures them (`ParsedTree::node_slots`):
/// each slot's stored layout, and the slot and side of each run that lies in
/// one of its gaps, by the run's place among the table's runs.
#[derive(Debug, Default)]
struct NodeSlots {
    layouts: Vec<crate::layout::SlotLayout>,
    runs: HashMap<RunId, (usize, crate::list_slots::SlotSide)>,
    /// The separator before each item whose gap holds another than its
    /// slot's, by the item's index.
    separators: HashMap<NodeIndex, KindId>,
}

/// A node's children as its read routes them (`read::Routed`), with each
/// child's place among them by its descendant index.
#[derive(Debug)]
struct SlotItems {
    routed: crate::read::Routed,
    at: HashMap<NodeIndex, usize>,
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
pub fn claim_tree_id() -> Option<TreeId> {
    claim_tree_id_from_counter(&NEXT_TREE_ID).map(TreeId)
}

fn claim_tree_id_from_counter(counter: &std::sync::atomic::AtomicU32) -> Option<u32> {
    use std::sync::atomic::Ordering::Relaxed;

    // try_update requires Rust 1.95; this bounded CAS preserves the 1.88 minimum.
    let mut next = counter.load(Relaxed);
    while next <= MAX_TREE_ID {
        match counter.compare_exchange_weak(next, next + 1, Relaxed, Relaxed) {
            Ok(id) => return Some(id),
            Err(observed) => next = observed,
        }
    }
    None
}

/// Mint the next tree id from a counter shared by every image in the
/// process. `next` is the last value the owner recorded (none on the first
/// claim); the id and the value to record come back together, or nothing
/// once `MAX_TREE_ID` has been claimed — the owner then records nothing, so
/// the counter stays put and no id is ever reused.
#[must_use]
pub fn claim_tree_id_from(next: Option<f64>) -> Option<(TreeId, f64)> {
    let id = crate::types::exact_whole(next.unwrap_or(0.0)).ok().and_then(|whole| u32::try_from(whole).ok()).filter(|&id| id <= MAX_TREE_ID)?;
    Some((TreeId(id), f64::from(id) + 1.0))
}

/// Pack a tree id and a node index into one self-identifying handle.
#[must_use]
pub fn encode_handle(tree_id: TreeId, index: NodeIndex) -> TreeHandle {
    TreeHandle((u64::from(tree_id.get()) << HANDLE_INDEX_BITS) | u64::from(index.get()))
}

/// Split a handle back into the tree that minted it and the index within it.
#[must_use]
pub fn decode_handle(handle: TreeHandle) -> (TreeId, NodeIndex) {
    let handle = handle.get();
    (
        TreeId((handle >> HANDLE_INDEX_BITS) as u32),
        NodeIndex((handle & HANDLE_INDEX_MASK) as u32),
    )
}

impl<G: EngineGrammar> ParsedTree<G> {
    /// This tree's identity — the tag carried by every handle it mints.
    pub fn tree_id(&self) -> TreeId {
        self.tree_id
    }

    /// The parsed tree-sitter tree.
    pub fn tree(&self) -> &tree_sitter::Tree {
        &self.tree
    }

    /// The node at `index` read into `T`, `depth` levels down, seating no
    /// sides; index 0 is the root.
    pub fn read<T: crate::read::ReadNode>(&self, index: crate::types::NodeIndex, depth: crate::read::Depth) -> Result<T, crate::read::ReadError> {
        crate::read::read_at::<T>(&mut self.tree.walk(), &self.read_ctx(), index, depth)
    }

    /// The sides of the unit children of the node at `index`, by slot and
    /// item, as a render read seats them for a client that stores each unit
    /// as its bare kind (`EngineGrammar::read_units`, `ReadCtx::inline_units`).
    pub fn unit_sides(&self, index: crate::types::NodeIndex) -> Vec<crate::layout::UnitSides<G::Trivia>> {
        self.grammar.read_units(&self.tree, &self.seating_ctx().inline_units(), index)
    }

    /// The `ERROR` node at `index` read as the bytes its coordinate spans, or
    /// `None` when the node there is not an `ERROR`.
    pub fn read_error(&self, index: crate::types::NodeIndex) -> Option<crate::ErrorRead> {
        self.error_under(index, &self.read_ctx())
    }

    /// The `ERROR` node at `index` as `snapshot` reads one: its bytes and its
    /// span from the byte `holder`, or `None` when the node there is not an
    /// `ERROR`.
    pub fn snapshot_error(&self, index: crate::types::NodeIndex, holder: Option<u32>) -> Option<crate::ErrorRead> {
        let measure = self.snapshot_measure(index, holder);
        self.error_under(index, &self.read_ctx().snapshot(&measure))
    }

    fn error_under(&self, index: crate::types::NodeIndex, ctx: &crate::read::ReadCtx<'_>) -> Option<crate::ErrorRead> {
        let node = node_at_index(&self.tree, index).filter(tree_sitter::Node::is_error)?;
        let at = ctx.coordinate(&node, index);
        let text = self.source[at.span.range()].to_owned();
        Some(crate::ErrorRead { text, kind: at.kind, at: ctx.origin(&node, index) })
    }

    fn read_ctx(&self) -> crate::read::ReadCtx<'_> {
        crate::read::ReadCtx::new(&self.source, self.tree_id, self.grammar.shows()).with_relaxes(self.grammar.relaxes())
    }

    /// The context of a read that seats each node's sides from this tree's
    /// table and writes: a render read and a snapshot read.
    pub fn seating_ctx(&self) -> crate::read::ReadCtx<'_> {
        self.read_ctx().with_sides(self)
    }

    /// The source's row starts (`LineTable`), built on first use.
    pub fn lines(&self) -> &crate::points::LineTable {
        self.lines.get_or_init(|| crate::points::LineTable::new(&self.source))
    }

    /// What a snapshot of the node at `index` measures with: from the byte
    /// `holder`, or from the node's own start when it has none. The root has
    /// no holder and starts the source.
    fn snapshot_measure(&self, index: crate::types::NodeIndex, holder: Option<u32>) -> crate::read::SnapshotCtx<'_> {
        let own = || node_at_index(&self.tree, index).filter(|_| index != NodeIndex::ROOT).map(|node| Span::of(&node).start);
        crate::read::SnapshotCtx::new(self.lines(), holder.or_else(own), index)
    }

    /// A snapshot of the node at `index`, read at every depth: each node with
    /// its span from the node that holds it, each extra and `ERROR` of
    /// its sides with its text, and the node itself measured from the byte
    /// `holder`, or from its own start when absent.
    pub fn snapshot<T: crate::read::ReadNode>(&self, index: crate::types::NodeIndex, holder: Option<u32>) -> Result<T, crate::read::ReadError> {
        let measure = self.snapshot_measure(index, holder);
        crate::read::read_at::<T>(&mut self.tree.walk(), &self.seating_ctx().snapshot(&measure), index, crate::read::Depth::All)
    }

    /// Reject a handle minted by a different tree.
    ///
    /// Indexes are dense and restart at 0 every parse, so without this an
    /// out-of-tree handle lands in range and resolves to whatever node happens
    /// to sit at that index — an unrelated node returned as though it were the
    /// one asked for. The tag turns that into a refusal.
    fn local_index(&self, handle: TreeHandle) -> Result<NodeIndex, String> {
        let (tree_id, index) = decode_handle(handle);
        if tree_id != self.tree_id {
            return Err(format!(
                "handle {handle} belongs to tree {tree_id}, not tree {}",
                self.tree_id
            ));
        }
        Ok(index)
    }

    /// Whether this tree minted `handle`.
    pub fn owns_handle(&self, handle: TreeHandle) -> bool {
        decode_handle(handle).0 == self.tree_id
    }

    /// The node `address` names, without minting a handle; `None` when it
    /// names no node of this tree.
    pub fn node_at(&self, address: Address) -> Result<Option<tree_sitter::Node<'_>>, String> {
        Ok(match address {
            Address::Own { handle } => node_at_index(&self.tree, self.local_index(handle)?),
            Address::Child { parent, index } => node_at_index(&self.tree, self.local_index(parent)?).and_then(|node| node.child(index.get())),
        })
    }

    /// Whether each node `addresses` names satisfies `plan`, in order. An
    /// address that names no node of this tree is refused.
    pub fn plan_holds(&self, addresses: &[Address], plan: &Plan) -> Result<Vec<bool>, String> {
        let ctx = self.read_ctx();
        let stamp = |node: &tree_sitter::Node<'_>| ctx.node_kind(node);
        let router = |node: &tree_sitter::Node<'_>| self.grammar.router(crate::read::grammar_id(node), crate::read::display_id(node));
        let query = crate::query::QueryCtx { source: &self.source, stamp: &stamp, router: &router };
        let mut cursor = self.tree.walk();
        addresses
            .iter()
            .map(|&address| {
                crate::read::goto(&mut cursor, self.index_of(address)?);
                Ok(plan.holds(&mut cursor, &query))
            })
            .collect()
    }

    /// The descendant index of the node `address` names.
    fn index_of(&self, address: Address) -> Result<NodeIndex, String> {
        let missing = || format!("{address:?} names no node of tree {}", self.tree_id);
        let resolve = |handle: TreeHandle| {
            let at = self.local_index(handle)?;
            node_at_index(&self.tree, at).map(|node| (at, node)).ok_or_else(missing)
        };
        match address {
            Address::Own { handle } => Ok(resolve(handle)?.0),
            Address::Child { parent, index } => {
                let (parent_index, parent_node) = resolve(parent)?;
                parent_node.child(index.get()).ok_or_else(missing)?;
                Ok(child_index_of(parent_node, parent_index, index))
            }
        }
    }

    /// Walk the subtree under `from` in pre-order and return the coordinates
    /// of up to `limit` named, non-extra descendants whose grammar symbol is
    /// in `kinds` (every one when `kinds` is empty) and that satisfy `plan`,
    /// each the coordinate a read hands out for it. `resume` is the path of
    /// child indices, from the node at `handle`, of the last node an earlier
    /// batch visited; the walk continues after it. `depth` bounds the levels
    /// walked below `from` (every level when absent). An extra is trivia: the
    /// walk neither returns nor enters it. A depth member the parser issues
    /// (`SurfaceKinds::indent`, `dedent`) is the op that opens or closes a
    /// level, not structure: the walk does not return it.
    pub fn descendants(
        &self,
        from: Address,
        kinds: &[KindId],
        plan: Option<&Plan>,
        resume: Option<&[ChildPosition]>,
        limit: u32,
        depth: Option<u32>,
    ) -> Result<DescendantBatch, String> {
        let depth = depth.map_or(usize::MAX, |levels| levels as usize);
        let index = self.index_of(from)?;
        let origin = encode_handle(self.tree_id, index);
        let start = node_at_index(&self.tree, index).ok_or_else(|| format!("{from:?} names no node of tree {}", self.tree_id))?;
        let mut cursor = start.walk();
        // indexes[k]: the descendant index of the node at depth k below
        // `start`. path[k - 1]: that node's child index within its parent.
        let mut indexes: Vec<NodeIndex> = vec![index];
        let mut path: Vec<ChildPosition> = Vec::new();
        let mut coordinates = Vec::new();
        let ctx = self.read_ctx();
        let stamp = |node: &tree_sitter::Node<'_>| ctx.node_kind(node);
        let router = |node: &tree_sitter::Node<'_>| self.grammar.router(crate::read::grammar_id(node), crate::read::display_id(node));
        let query = crate::query::QueryCtx { source: &self.source, stamp: &stamp, router: &router };
        let mut at = self.tree.walk();
        let surface = self.grammar.surface_kinds();
        let depth_member = |node: &tree_sitter::Node<'_>| { let kind = crate::read::grammar_id(node); kind != KindId::BLANK && [surface.indent, surface.dedent].contains(&kind) };
        if let Some(resume) = resume {
            for &child in resume {
                if !cursor.goto_first_child() {
                    return Err("resume path leaves the tree".to_string());
                }
                for _ in 0..child.get() {
                    if !cursor.goto_next_sibling() {
                        return Err("resume path leaves the tree".to_string());
                    }
                }
                indexes.push(index + crate::read::offset_of(&cursor));
                path.push(child);
            }
        }
        while Self::advance(&mut cursor, index, &mut indexes, &mut path, depth) {
            let node = cursor.node();
            if node.is_named()
                && !node.is_extra()
                && !depth_member(&node)
                && (kinds.is_empty() || kinds.contains(&stamp(&node)))
                && plan.is_none_or(|plan| {
                    crate::read::goto(&mut at, indexes[indexes.len() - 1]);
                    plan.holds(&mut at, &query)
                })
            {
                coordinates.push(QueryCoordinate::from(ctx.coordinate(&node, indexes[indexes.len() - 1])));
                if crate::types::narrow(coordinates.len()) >= limit {
                    return Ok(DescendantBatch { coordinates, resume: Some(path), origin });
                }
            }
        }
        Ok(DescendantBatch { coordinates, resume: None, origin })
    }

    /// Step `cursor` to the next node in pre-order below the walk's start, at
    /// most `depth` levels down and never into an extra, keeping `indexes`
    /// and `path` in step; `false` once the walk is done. The cursor numbers
    /// from the start, whose own index is `start`.
    fn advance(cursor: &mut tree_sitter::TreeCursor<'_>, start: NodeIndex, indexes: &mut Vec<NodeIndex>, path: &mut Vec<ChildPosition>, depth: usize) -> bool {
        if indexes.len() <= depth && !cursor.node().is_extra() && cursor.goto_first_child() {
            indexes.push(start + crate::read::offset_of(cursor));
            path.push(ChildPosition(0));
            return true;
        }
        loop {
            if indexes.len() == 1 {
                return false;
            }
            if cursor.goto_next_sibling() {
                if let Some(last) = path.last_mut() {
                    *last = ChildPosition(last.get() + 1);
                }
                *indexes.last_mut().expect("an index below the start") = start + crate::read::offset_of(cursor);
                return true;
            }
            cursor.goto_parent();
            indexes.pop();
            path.pop();
        }
    }

    /// Every ERROR and MISSING region of the parse (`error_regions`).
    pub fn error_regions(&self) -> Vec<ErrorRegion> {
        error_regions(&self.tree)
    }

    /// The tree's layer of the render options: what its source sets apart
    /// from the engine's (`InferredOptions`).
    pub fn inferred(&self) -> &crate::options::InferredOptions {
        &self.inferred
    }

    /// The tree's layer as the options object a render takes.
    pub fn inferred_options(&self) -> serde_json::Value {
        self.inferred.to_json(self.grammar.option_tables())
    }

    /// Access the source string.
    pub fn source(&self) -> &str {
        &self.source
    }

    /// The siblings beside the node at `index` (`Siblings`): the items
    /// routed to its slot beside it where its parent's read routes its
    /// children, else `siblings`.
    pub fn siblings(&self, index: crate::types::NodeIndex) -> Siblings {
        self.slot_siblings(index).unwrap_or_else(|| siblings_counting(&self.tree, index, |n| self.work.sibling_items(n)))
    }

    /// The work the tree's layout reads have done so far.
    pub fn layout_work(&self) -> crate::layout::LayoutWork {
        self.work.counts()
    }

    /// The children of the node at `index` as its read routes them, measured
    /// on first use and kept; `None` where its read routes none.
    fn slot_items(&self, index: crate::types::NodeIndex) -> Arc<Option<SlotItems>> {
        if let Some(items) = self.items.lock().unwrap_or_else(std::sync::PoisonError::into_inner).get(&index) {
            return Arc::clone(items);
        }
        let items = Arc::new(self.grammar.slot_routes(&self.tree, index).map(|routed| {
            self.work.sibling_items(routed.children.len());
            let at = routed.children.iter().enumerate().map(|(at, child)| (child.index, at)).collect();
            SlotItems { routed, at }
        }));
        self.items.lock().unwrap_or_else(std::sync::PoisonError::into_inner).insert(index, Arc::clone(&items));
        items
    }

    /// The items routed to the slot of the node at `index` beside it, taken
    /// at the outermost node spanning exactly its bytes; `None` where its
    /// parent's read routes no children, or routes it to no slot.
    fn slot_siblings(&self, index: crate::types::NodeIndex) -> Option<Siblings> {
        let outer = outermost_same_span(node_at_index(&self.tree, index)?);
        let mut cursor = self.tree.walk();
        crate::read::goto(&mut cursor, index);
        while cursor.node().id() != outer.id() {
            cursor.goto_parent();
        }
        let item_index = crate::read::index_of(&cursor);
        if !cursor.goto_parent() {
            return None;
        }
        let items = self.slot_items(crate::read::index_of(&cursor));
        let SlotItems { routed, at } = items.as_ref().as_ref()?;
        let at = *at.get(&item_index)?;
        let crate::read::Route::Slot { slot, .. } = routed.routes[at] else { return None };
        let item = |at: usize| {
            self.work.sibling_items(1);
            let child = &routed.children[at];
            matches!(routed.routes[at], crate::read::Route::Slot { slot: other, .. } if other == slot).then(|| Sibling { start: child.start, end: child.end, kind: child.grammar })
        };
        Some(Siblings { previous: (0..at).rev().find_map(item), next: (at + 1..routed.children.len()).find_map(item) })
    }

    /// The whitespace member a run reads as: among the grammar's layout kinds
    /// whose text holds a line break when the run holds one, and none when it
    /// does not, the one of its seam rank (`classify_whitespace`).
    pub fn layout_kind(&self, run: &str) -> Option<KindId> {
        let (table, kinds) = self.grammar.whitespace();
        let breaks = run.contains('\n');
        let class: Vec<KindId> = kinds.iter().copied().filter(|&kind| (table.text_of)(kind).contains('\n') == breaks).collect();
        crate::classify::classify_whitespace(run, &class, table)
    }

    /// The whitespace member the run at `at` among the table's runs stores:
    /// its source class (`layout_kind`), line break or in-line alike, when
    /// it differs from the class the read-time options write there
    /// (`baseline_class`), or no baseline reaches it; none when they agree.
    /// Its source is measured, as the baseline is, from the last text that
    /// is not whitespace: the trailing whitespace of the token before it (a
    /// shebang's line end) counts, back to the run before it at most.
    ///
    /// A run in a gap of a list slot (`node_slots`) measures against the
    /// class the slot stores on its side instead, where it stores one.
    fn deviation(&self, at: RunId) -> Option<G::Trivia> {
        let text = self.run_text(at);
        let kind = self.layout_kind(text)?;
        let class = self.slot_class(at).unwrap_or_else(|| self.baseline_class(at));
        (class != Some(kind)).then(|| G::Trivia::from_layout(TriviaText::of(kind, text))).flatten()
    }

    /// The source of the run at `at` among the table's runs, measured as
    /// its baseline is: from the last text before it that is not whitespace,
    /// back to the run before it at most.
    fn run_text(&self, at: RunId) -> &str {
        let table = self.trivia_table();
        let run = table.run(at);
        let floor = at.get().checked_sub(1).map_or(0, |before| table.run(RunId(before)).end.min(run.start)) as usize;
        let from = self.source[..run.start as usize].trim_end().len().max(floor);
        &self.source[from..run.end as usize]
    }

    /// The class the read-time options write at the run at `at`: its
    /// baseline's whitespace as a layout class reads it (`Tally::spelling`).
    fn baseline_class(&self, at: RunId) -> Option<KindId> {
        let gap = self.baseline_gap(self.trivia_table().run(at), false).ok().flatten()?;
        self.layout_kind(&gap.spelling())
    }

    /// The class the run at `at` takes as a side of a list slot's gap: the
    /// slot's stored class on that side, else the run's baseline class
    /// (`None` where no baseline reaches it). `None` outside a slot's gaps,
    /// and for a run that does not carry the layout around it.
    #[allow(clippy::option_option, reason = "`None` outside a slot's gaps; `Some(None)` inside one that no baseline reaches")]
    fn slot_class(&self, at: RunId) -> Option<Option<KindId>> {
        use crate::list_slots::SlotSide;
        let run = self.trivia_table().run(at);
        if !run.carries {
            return None;
        }
        let slots = self.node_slots(run.owner);
        let &(slot, side) = slots.runs.get(&at)?;
        let layout = &slots.layouts[slot];
        let stored = match side {
            SlotSide::Before => layout.before,
            SlotSide::After => layout.after,
        };
        Some(stored.or_else(|| self.baseline_class(at)))
    }

    /// The list slots of the node at `index`, measured on first use and
    /// kept (`list_slots::slot_gaps`). Each side of a slot's gaps takes the
    /// class most of its runs' sources have, a tie going to the class the
    /// first gap's baseline writes when it is among the tied, else to the
    /// first gap's; the slot stores it only where it differs from that
    /// baseline class. Its separator is the one most of its gaps hold, a tie
    /// going to the one the region's record writes there, stored only where
    /// it differs from that one, or where the record names none.
    fn node_slots(&self, index: crate::types::NodeIndex) -> Arc<NodeSlots> {
        use crate::list_slots::{majority, SlotGap, SlotGaps, SlotSide};
        if let Some(slots) = self.slots.lock().unwrap_or_else(std::sync::PoisonError::into_inner).get(&index) {
            return Arc::clone(slots);
        }
        let table = self.trivia_table();
        let runs = table.runs();
        let run_at = |start: u32, end: u32| {
            let from = runs.partition_point(|run| run.start < start);
            runs[from..].iter().take_while(|run| run.start == start).position(|run| run.end == end).map(|at| RunId(crate::types::narrow(from + at)))
        };
        let slots = self.grammar.slot_routes(&self.tree, index).map_or_else(Vec::new, |routed| crate::list_slots::slot_gaps(&routed, run_at));
        let mut measured = NodeSlots::default();
        for (slot, SlotGaps { key, gaps }) in slots.iter().enumerate() {
            let mut side = |side: SlotSide, of: fn(&SlotGap) -> Option<RunId>| {
                let carried: Vec<RunId> = gaps.iter().filter_map(of).filter(|&at| table.run(at).carries).collect();
                measured.runs.extend(carried.iter().map(|&at| (at, (slot, side))));
                let classes: Vec<(KindId, KindId)> = carried.iter().filter_map(|&at| Some((self.layout_kind(self.run_text(at))?, self.baseline_class(at)?))).collect();
                let baseline = classes.first()?.1;
                let sources: Vec<KindId> = classes.iter().map(|&(source, _)| source).collect();
                majority(&sources, Some(baseline)).filter(|&class| class != baseline)
            };
            let before = side(SlotSide::Before, |gap| gap.before);
            let after = side(SlotSide::After, |gap| gap.after);
            let separators: Vec<crate::list_slots::Separator> = gaps.iter().map(|gap| gap.separator).collect();
            let text = |separator: &crate::list_slots::Separator| &self.source[separator.start as usize..separator.end as usize];
            let written = gaps.first().and_then(|gap| self.written_separator(index, gap.items));
            let preferred = separators.iter().find(|separator| Some(text(separator)) == written.as_deref()).map(|separator| separator.kind);
            let kinds: Vec<KindId> = separators.iter().map(|separator| separator.kind).collect();
            let effective = majority(&kinds, preferred);
            let separator = effective.filter(|&kind| Some(kind) != preferred || written.is_none());
            measured.separators.extend(gaps.iter().filter(|gap| Some(gap.separator.kind) != effective).map(|gap| (gap.items.1, gap.separator.kind)));
            measured.layouts.push(crate::layout::SlotLayout { slot: (*key).to_string(), before, after, separator, tokens: Vec::new() });
        }
        let measured = Arc::new(measured);
        self.slots.lock().unwrap_or_else(std::sync::PoisonError::into_inner).insert(index, Arc::clone(&measured));
        measured
    }

    /// The text the read-time options write between the items at `items`
    /// in the record of the region of the node at `index`: the texts its
    /// frame writes after the first and before the second.
    fn written_separator(&self, index: NodeIndex, items: (NodeIndex, NodeIndex)) -> Option<String> {
        use crate::baseline::Written;
        let record = self.recorded(index, REGION_DEPTH);
        let frame = record.as_ref().as_ref().ok()?.frame(index)?;
        let first = frame.items.iter().position(|item| item.what == Written::Node(items.0))?;
        let last = frame.items[first..].iter().position(|item| item.what == Written::Node(items.1))? + first;
        Some(
            frame.items[first + 1..last]
                .iter()
                .filter_map(|item| match &item.what {
                    Written::Text(text) => Some(&**text),
                    Written::Node(_) => None,
                })
                .collect(),
        )
    }

    /// The separator before the node at `index` as an item of its parent's
    /// list slot, where its gap holds another than the one the slot renders
    /// (`node_slots`): the item after an outlier separator stores it.
    pub fn separator_before(&self, index: crate::types::NodeIndex) -> Option<KindId> {
        let mut cursor = self.tree.walk();
        if index.index() >= crate::read::descendant_count(&self.tree.root_node()) as usize {
            return None;
        }
        crate::read::goto(&mut cursor, index);
        if !cursor.goto_parent() {
            return None;
        }
        let parent = crate::read::index_of(&cursor);
        self.node_slots(parent).separators.get(&index).copied()
    }

    /// The stored layout of each list slot of the node at `index` that
    /// stores any (`node_slots`).
    pub fn slot_layouts(&self, index: crate::types::NodeIndex) -> Vec<crate::layout::SlotLayout> {
        self.node_slots(index).layouts.iter().filter(|layout| !layout.is_empty()).cloned().collect()
    }

    /// What the options in effect at read time render at the gaps under the
    /// node at descendant `index`, recorded on first use and kept: the node
    /// read `depth` levels down and rendered from its templates, with its
    /// extras and `ERROR`s but none of its layout runs or writes
    /// (`baseline::Baseline`). Read `REGION_DEPTH` levels down, it records
    /// the node's own region; read at every depth, every region of its
    /// subtree. The error the read or render refused with, when one did.
    fn recorded(&self, index: crate::types::NodeIndex, depth: crate::read::Depth) -> Record {
        let records = &self.records;
        if let Some(record) = records.lock().unwrap_or_else(std::sync::PoisonError::into_inner).get(&(index, depth)) {
            return Arc::clone(record);
        }
        let recorded = std::cell::RefCell::new(crate::baseline::Baseline::default());
        let sides = WithoutLayout(self);
        let ctx = self.read_ctx().with_sides(&sides);
        let render = crate::prepare::RenderContext { options: &self.read_options, sources: &sides, recording: Some(&recorded) };
        let record = Arc::new(self.grammar.render_read(&self.tree, index, depth, &ctx, &render).map(|_| recorded.into_inner()));
        records.lock().unwrap_or_else(std::sync::PoisonError::into_inner).insert((index, depth), Arc::clone(&record));
        record
    }

    /// How many records of the tree have been rendered.
    pub fn records_rendered(&self) -> usize {
        self.records.lock().unwrap_or_else(std::sync::PoisonError::into_inner).len()
    }

    /// How far the region of the node `region` is read for `run`: deep enough
    /// that every node between it and the run whose span starts or ends
    /// inside the run or at its edges renders from its template, and at least
    /// `REGION_DEPTH`. That reaches a node beginning at the line break before
    /// it (python's block), one empty there (typescript's automatic
    /// semicolon, which writes a line break), and the tokens on either side
    /// of the run, whose edges set what the options write in it. A slice of
    /// such a node would write the run's source as part of its own text, or
    /// leave the run's edges unknown.
    /// The walk enters only the children that touch the run, found by byte,
    /// so a run in a long list costs the region's depth, not its width.
    fn region_depth(&self, region: tree_sitter::Node<'_>, run: crate::trivia_table::LayoutRun) -> crate::read::Depth {
        let inside = |node: &tree_sitter::Node<'_>| {
            let Span { start, end } = Span::of(node);
            (run.start..=run.end).contains(&start) || (run.start..=run.end).contains(&end)
        };
        let touches = |node: &tree_sitter::Node<'_>| Span::of(node).start <= run.end && Span::of(node).end >= run.start;
        let mut deepest = 0;
        let mut stack = vec![(region, 0usize)];
        while let Some((node, depth)) = stack.pop() {
            self.work.region_nodes(1);
            if depth > 0 && inside(&node) {
                deepest = deepest.max(depth);
            }
            if !touches(&node) {
                continue;
            }
            let mut cursor = node.walk();
            let entered = match run.start.checked_sub(1) {
                Some(before) => cursor.goto_first_child_for_byte(before as usize).is_some(),
                None => cursor.goto_first_child(),
            };
            while entered && Span::of(&cursor.node()).start <= run.end {
                stack.push((cursor.node(), depth + 1));
                if !cursor.goto_next_sibling() {
                    break;
                }
            }
        }
        match REGION_DEPTH {
            crate::read::Depth::Levels(least) => std::num::NonZeroU32::new(crate::types::narrow(deepest) + 1).map_or(REGION_DEPTH, |levels| crate::read::Depth::Levels(levels.max(least))),
            crate::read::Depth::All => REGION_DEPTH,
        }
    }

    /// The whitespace the read-time options write at `run`, read from its
    /// region's record, or from the record of the whole tree when `whole`.
    /// The region is the nearest node at or above the run's owner that
    /// renders in a frame of its own and writes something on both sides of
    /// the run, read as deep as the run needs (`region_depth`). In the record, the run reads the breaks between what the
    /// render wrote around it (`Baseline::between`), else between the two
    /// items beside it in the region's frame: the last that starts before
    /// the run and the first that ends after it, its texts matched to the
    /// node's tokens by their text and its framed or sliced nodes to the
    /// node's children by index, the frame's open or close standing in where
    /// the node has no item on a side but its span reaches past the run. A
    /// node whose span starts or ends at a run's edge with no item on that
    /// side (python's block, before its indent) is the item beside it there,
    /// in the region around it. A run that does not carry the layout around
    /// it (`LayoutRun::carries`) reads none. `None` when no region holds an
    /// item on both sides of the run, or an item beside it was not written.
    pub fn baseline_gap(&self, run: crate::trivia_table::LayoutRun, whole: bool) -> Result<Option<crate::baseline::Tally>, String> {
        if !run.carries {
            return Ok(Some(crate::baseline::Tally::default()));
        }
        let mut cursor = self.tree.walk();
        crate::read::goto(&mut cursor, run.owner);
        loop {
            let at = crate::read::index_of(&cursor);
            let record = if whole { self.recorded(NodeIndex::ROOT, crate::read::Depth::All) } else { self.recorded(at, self.region_depth(cursor.node(), run)) };
            let baseline = record.as_ref().as_ref().map_err(String::clone)?;
            if let Some(frame) = baseline.frame(at) {
                if let Some(gap) = baseline.between(run.start, run.end) {
                    return Ok(Some(gap));
                }
                let mut source = Vec::new();
                source_items(&mut cursor, &self.source, baseline, frame, &mut source);
                let left = source.iter().rposition(|item| item.start < run.start || (item.start == run.start && item.end <= run.start));
                let right = source.iter().position(|item| item.end > run.end || (item.end == run.end && item.start >= run.end));
                let node = cursor.node();
                let inside = Span::of(&node).start < run.start || left.is_some();
                let ends_after = Span::of(&node).end > run.end || right.is_some();
                if inside && ends_after {
                    let matched = align(&source, &frame.items);
                    let from = match left {
                        Some(left) => matched[left].map(|left| frame.items[left].after),
                        None => Some(frame.open),
                    };
                    let to = match right {
                        Some(right) => matched[right].map(|right| frame.items[right].before),
                        None => Some(frame.close),
                    };
                    return Ok(from.zip(to).map(|(from, to)| to.since(from)));
                }
            }
            if !cursor.goto_parent() {
                return Ok(None);
            }
        }
    }

    /// Every run of whitespace a side takes (`TriviaTable::runs`), each with
    /// what the read-time options write there (`baseline_gap`).
    pub fn baseline_runs(&self, whole: bool) -> Result<Vec<(crate::trivia_table::LayoutRun, Option<crate::baseline::Tally>)>, String> {
        self.trivia_table().runs().iter().map(|&run| Ok((run, self.baseline_gap(run, whole)?))).collect()
    }

    /// How much of its layout the tree stores apart from its read-time
    /// options: each run a side stores as a member (`deviation`), each list
    /// slot storing a layout (`slot_layouts`) and each item storing its own
    /// separator (`separator_before`), over every node.
    pub fn stored_layout(&self) -> crate::layout::StoredLayout {
        let count = |n: usize| u32::try_from(n).unwrap_or(u32::MAX);
        let nodes = (0..crate::read::descendant_count(&self.tree.root_node())).map(NodeIndex::new);
        let slots = nodes.map(|index| self.node_slots(index)).fold((0, 0), |(layouts, separators), slots| {
            (layouts + slots.layouts.iter().filter(|layout| !layout.is_empty()).count(), separators + slots.separators.len())
        });
        crate::layout::StoredLayout {
            deviations: count(self.trivia_table().run_ids().filter(|&at| self.deviation(at).is_some()).count()),
            slots: count(slots.0),
            separators: count(slots.1),
        }
    }

    /// The tree's trivia table, assigned on first use.
    pub fn trivia_table(&self) -> &TriviaTable {
        self.trivia.get_or_init(|| TriviaTable::assign(&self.tree, &self.source, self.grammar.surface_kinds(), self.level_width))
    }

    /// The entries of `side` of the node at `index`: the ones a write gave it,
    /// else the assigned ones, each as a value. An extra is its coordinate, an
    /// `ERROR` its kind and source text, and a layout run its whitespace
    /// member.
    pub fn trivia_side(&self, index: crate::types::NodeIndex, side: TriviaSide) -> Vec<TriviaEntry<G::Trivia>> {
        self.side_entries(index, side, false).into_iter().map(SideEntry::into_entry).collect()
    }

    /// `trivia_side` with where each entry came from, and when `edge_changed`
    /// as a changed edge keeps it (`trivia::on_changed_edge`).
    pub fn side_entries(&self, index: crate::types::NodeIndex, side: TriviaSide, edge_changed: bool) -> Vec<SideEntry<G::Trivia>> {
        let mut entries: Vec<SideEntry<G::Trivia>> = match self.written.get(&(index, side)) {
            Some(written) => written.iter().cloned().map(SideEntry::Written).collect(),
            None => self.assigned_side(index, side, true),
        };
        if edge_changed {
            crate::trivia::on_changed_edge(
                &mut entries,
                side,
                |entry| match entry {
                    SideEntry::Layout(_) => true,
                    SideEntry::Written(entry) => entry.is_layout(),
                    SideEntry::Source { .. } => false,
                },
                |entry| match entry {
                    SideEntry::Layout(entry) | SideEntry::Written(entry) => entry.depth(),
                    SideEntry::Source { .. } => 0,
                },
                Self::depth_member,
            );
        }
        entries
    }

    fn depth_member(delta: i32) -> Option<SideEntry<G::Trivia>> {
        <G::Trivia as crate::trivia::TriviaSeam>::depth_member(delta).map(|member| SideEntry::Layout(TriviaEntry::new(SlotValue::Node(member))))
    }

    /// The entries the assignment gives `side` of the node at `index`, and
    /// its layout when `layout`: each run that deviates from the read-time
    /// options as its member (`deviation`), the layout members, and the
    /// depth members. A member the source fixes in place with its adjacency
    /// (a line continuation with whitespace beside it, `error_adjacency`) is
    /// no layout: it is an entry of the source, as an `ERROR` is.
    fn assigned_side(&self, index: crate::types::NodeIndex, side: TriviaSide, layout: bool) -> Vec<SideEntry<G::Trivia>> {
        let assigned = self.trivia_table().side(index, side);
        if assigned.is_empty() {
            return Vec::new();
        }
        let ctx = self.read_ctx();
        let entry = TriviaEntry::new;
        let depth = |count: i32| (0..count.unsigned_abs()).filter_map(move |_| Self::depth_member(count));
        assigned
            .iter()
            .filter(|assigned| layout || matches!(assigned, Assigned::Extra(_) | Assigned::Error(_) | Assigned::Member(_)))
            .flat_map(|assigned| -> Vec<SideEntry<G::Trivia>> {
                match *assigned {
                    Assigned::Extra(at) => node_at_index(&self.tree, at)
                        .and_then(|node| {
                            let coord = ctx.coordinate(&node, at);
                            let (kind, span) = (coord.kind?, coord.span);
                            Some(SideEntry::Source { entry: entry(SlotValue::Coord(coord)), kind, span, adjacent: None })
                        })
                        .into_iter()
                        .collect(),
                    Assigned::Error(at) => node_at_index(&self.tree, at)
                        .map(|node| {
                            let span = Span::of(&node);
                            let kind = crate::read::grammar_id(&node);
                            let adjacent = Some(error_adjacency(&node, &self.source));
                            let text = TriviaText::of_source(kind, &self.source, span, adjacent, None);
                            SideEntry::Source { entry: entry(SlotValue::Node(G::Trivia::from_text(text))), kind, span, adjacent }
                        })
                        .into_iter()
                        .collect(),
                    Assigned::Layout { run, depth: count, .. } => {
                        let deviation = self.deviation(run);
                        deviation.map(|member| SideEntry::Layout(entry(SlotValue::Node(member)))).into_iter().chain(depth(count)).collect()
                    }
                    Assigned::Member(at) => node_at_index(&self.tree, at)
                        .and_then(|node| {
                            let span = Span::of(&node);
                            let kind = crate::read::grammar_id(&node);
                            let adjacent = Some(error_adjacency(&node, &self.source));
                            let member = entry(SlotValue::Node(G::Trivia::from_layout(TriviaText::of_source(kind, &self.source, span, adjacent, None))?));
                            Some(if member.is_layout() { SideEntry::Layout(member) } else { SideEntry::Source { entry: member, kind, span, adjacent } })
                        })
                        .into_iter()
                        .collect(),
                    Assigned::Depth(count) => depth(count).collect(),
                }
            })
            .filter(|entry| layout || !matches!(entry, SideEntry::Layout(_)))
            .collect()
    }

    /// Whether the node at `index` is empty (`trivia_table::is_empty`): no
    /// child of it has width, so its trivia is its `inner`.
    pub fn is_empty(&self, index: crate::types::NodeIndex) -> bool {
        node_at_index(&self.tree, index).is_some_and(|node| crate::trivia_table::is_empty(&node))
    }

    /// Replace `side` of the node at `index` with `entries`.
    pub fn write_trivia_side(&mut self, index: crate::types::NodeIndex, side: TriviaSide, entries: Vec<TriviaEntry<G::Trivia>>) {
        self.written.insert((index, side), entries);
    }

    /// Whether a write replaced a side of a node under the node at `index`:
    /// of a descendant, or of the node's own `inner`, and of its own leading
    /// and trailing too when `own_sides` is set.
    pub fn edited_within(&self, index: crate::types::NodeIndex, own_sides: bool) -> bool {
        let Some(node) = node_at_index(&self.tree, index) else { return false };
        let end = index + crate::read::descendant_count(&node);
        self.written
            .range((index, TriviaSide::Leading)..(end, TriviaSide::Leading))
            .any(|(&(at, side), _)| at != index || own_sides || side == TriviaSide::Inner)
    }
}

impl<G: EngineGrammar> crate::read::SideLookup for ParsedTree<G> {
    fn side(&self, index: crate::types::NodeIndex, side: TriviaSide, edge_changed: bool) -> Box<dyn std::any::Any> {
        Box::new(self.side_entries(index, side, edge_changed))
    }

    fn slots(&self, index: crate::types::NodeIndex) -> Vec<crate::layout::SlotLayout> {
        self.slot_layouts(index)
    }

    fn separator(&self, index: crate::types::NodeIndex) -> Option<KindId> {
        self.separator_before(index)
    }
}

/// A tree's sides as its source has them, without their layout runs or any
/// write: what its baseline renders.
struct WithoutLayout<'t, G: EngineGrammar>(&'t ParsedTree<G>);

impl<G: EngineGrammar> WithoutLayout<'_, G> {
    fn entries(&self, index: crate::types::NodeIndex, side: TriviaSide) -> Vec<SideEntry<G::Trivia>> {
        self.0.assigned_side(index, side, false)
    }
}

impl<G: EngineGrammar> crate::read::SideLookup for WithoutLayout<'_, G> {
    fn side(&self, index: crate::types::NodeIndex, side: TriviaSide, _edge_changed: bool) -> Box<dyn std::any::Any> {
        Box::new(self.entries(index, side))
    }
}

/// The tree as the source table of its own record: a sliced child's sides
/// come without their layout runs or writes, as a read child's do.
impl<G: EngineGrammar> SourceTable for WithoutLayout<'_, G> {
    fn source_of(&self, tree_id: crate::types::TreeId) -> Option<&Arc<str>> {
        self.0.source_of(tree_id)
    }

    fn kind_of(&self, coord: &NodeCoordinate) -> Option<KindId> {
        self.0.kind_of(coord)
    }

    fn line_starts_inside_tokens(&self, coord: &NodeCoordinate) -> Vec<u32> {
        self.0.line_starts_inside_tokens(coord)
    }

    fn last_list_child_kind(&self, tree: crate::types::TreeId, span: crate::types::Span, kind: KindId) -> Option<KindId> {
        self.0.last_list_child_kind(tree, span, kind)
    }

    fn sides(&self, coord: &NodeCoordinate) -> Option<Box<dyn crate::trivia::FramedTrivia>> {
        self.0.own(coord.tree)?;
        let side = |side: TriviaSide| {
            let entries: Vec<_> = self.entries(coord.index, side).into_iter().map(SideEntry::into_entry).collect();
            (!entries.is_empty()).then_some(entries)
        };
        let trivia = crate::trivia::NodeTrivia { leading: side(TriviaSide::Leading), trailing: side(TriviaSide::Trailing), inner: side(TriviaSide::Inner) };
        (trivia.leading.is_some() || trivia.trailing.is_some() || trivia.inner.is_some()).then(|| Box::new(trivia) as Box<dyn crate::trivia::FramedTrivia>)
    }

    fn framed_span(&self, coord: &NodeCoordinate) -> Span {
        self.0.framed_span(coord)
    }

    fn seat_through(&self, coord: &NodeCoordinate, wrappers: &[Option<crate::options::SeatPath>], seat: &dyn Fn(KindId) -> Option<crate::types::SiteId>) -> Option<crate::types::SiteId> {
        self.0.seat_through(coord, wrappers, seat)
    }

    fn read_ctx(&self, tree: crate::types::TreeId) -> Option<(&tree_sitter::Tree, crate::read::ReadCtx<'_>)> {
        let tree = self.0.own(tree)?;
        Some((&tree.tree, tree.read_ctx().with_sides(self)))
    }

    fn for_each_kind_ending_with(&self, coord: &NodeCoordinate, f: &mut dyn FnMut(KindId)) {
        self.0.for_each_kind_ending_with(coord, f);
    }
}

// ─── Engine ──────────────────────────────────────────────────────────────────

/// Stateless native engine — parser + grammar config + render options.
///
/// The engine owns the parser (which is mutable for `parse` calls) and its
/// resolved render options. Parsing returns a [`ParsedTree`] that owns all
/// tree-dependent state.
pub struct Engine<G: EngineGrammar> {
    grammar: G,
    parser: tree_sitter::Parser,
    /// The render options resolved once at construction; a render call may
    /// resolve another table over this one.
    options: ResolvedOptions,
}

impl<G: EngineGrammar> Engine<G> {
    pub fn new(grammar: G, options: ResolvedOptions) -> Result<Self, String> {
        let mut parser = tree_sitter::Parser::new();
        grammar.configure_parser(&mut parser)?;
        Ok(Self {
            grammar,
            parser,
            options,
        })
    }

    pub fn options(&self) -> &ResolvedOptions {
        &self.options
    }

    pub fn render_module_hash(&self) -> &'static str {
        self.grammar.render_module_hash()
    }

    /// Parse source and return an owned `ParsedTree` tagged with `tree_id`.
    ///
    /// The caller owns id assignment because it owns the set of live trees;
    /// ids must be distinct across every tree a caller can still reach, or
    /// handles stop being unambiguous.
    pub fn parse(&mut self, source: &str, tree_id: TreeId) -> Result<ParsedTree<G>, String> {
        let tree = self.parser.parse(source, None).ok_or_else(|| {
            let snippet: String = source.chars().take(80).collect();
            format!("parse failed (source: {snippet:?})")
        })?;
        let (whitespace, _) = self.grammar.whitespace();
        let root = crate::read::grammar_id(&tree.root_node());
        let inferred = crate::options::InferredOptions::infer(source, root, &self.options, self.grammar.option_tables(), whitespace);
        let indent = inferred.indent.as_deref().unwrap_or(&self.options.indent);
        let spaces = |unit: &str| crate::types::narrow(unit.chars().filter(|&c| c == ' ').count());
        let level_width = [spaces(indent), spaces(&self.options.indent), 1].into_iter().find(|&width| width > 0).unwrap_or(1);
        let read_options = inferred.over(&self.options);
        Ok(ParsedTree {
            grammar: self.grammar,
            tree,
            source: Arc::from(source),
            inferred,
            level_width,
            tree_id,
            lines: std::sync::OnceLock::new(),
            trivia: std::sync::OnceLock::new(),
            read_options,
            records: std::sync::Mutex::new(HashMap::new()),
            slots: std::sync::Mutex::new(HashMap::new()),
            items: std::sync::Mutex::new(HashMap::new()),
            work: crate::layout::LayoutWorkCounter::default(),
            written: std::collections::BTreeMap::new(),
        })
    }

    pub fn find_and_read(&mut self, _source: String, _pattern: String) -> Result<String, String> {
        Err("find_and_read not yet implemented — ast-grep-core integration pending".to_string())
    }

}

#[must_use]
pub fn panic_msg(payload: &(dyn std::any::Any + Send), fallback: &str) -> String {
    if let Some(s) = payload.downcast_ref::<String>() {
        s.clone()
    } else if let Some(s) = payload.downcast_ref::<&str>() {
        s.to_string()
    } else {
        fallback.to_string()
    }
}

/// How far a region's node is read: its children render from their
/// templates, so each gap between its items and at its children's edges is
/// written as the template writes it, and its grandchildren render as
/// slices of their source, so nothing below is deep-read.
const REGION_DEPTH: crate::read::Depth = crate::read::Depth::Levels(match std::num::NonZeroU32::new(2) {
    Some(levels) => levels,
    None => unreachable!(),
});

/// A token or rendered child of a node, by what its frame would write for
/// it (`baseline::Written`), with its bytes.
struct SourceItem {
    what: crate::baseline::Written,
    start: u32,
    end: u32,
}

/// The items of the node at `cursor`, whose frame is `frame`, in source
/// order: each child that rendered in a frame of its own or as a slice of
/// `frame`'s by its index, each token by its text unless it is empty or
/// whitespace, which a render writes as layout, and the
/// children of any other child in its place. Extras and `ERROR`s are
/// trivia, no item. The cursor ends where it started.
fn source_items(cursor: &mut tree_sitter::TreeCursor<'_>, source: &str, baseline: &crate::baseline::Baseline, frame: &crate::baseline::FrameItems, out: &mut Vec<SourceItem>) {
    use crate::baseline::Written;
    if !cursor.goto_first_child() {
        return;
    }
    loop {
        let node = cursor.node();
        let index = crate::read::index_of(cursor);
        let span = Span::of(&node);
        let Span { start, end } = span;
        if node.is_extra() || node.is_error() {
        } else if baseline.frame(index).is_some() || frame.items.iter().any(|item| item.what == Written::Node(index)) {
            out.push(SourceItem { what: Written::Node(index), start, end });
        } else if node.child_count() == 0 {
            if !source[span.range()].trim().is_empty() {
                out.push(SourceItem { what: Written::text(&source[span.range()]), start, end });
            }
        } else {
            source_items(cursor, source, baseline, frame, out);
        }
        if !cursor.goto_next_sibling() {
            break;
        }
    }
    cursor.goto_parent();
}

/// Which written item each source item is, in order: a node matches the
/// next node of its index; a token matches the next text short of a node
/// that the token and the tokens right after it spell exactly, all of them
/// matching that text; an item matching none was not written. A written
/// node no source item names (a sliced comment) is passed over.
fn align(items: &[SourceItem], written: &[crate::baseline::Item]) -> Vec<Option<usize>> {
    use crate::baseline::Written;
    let named = |what: &Written| items.iter().any(|item| item.what == *what);
    let spelled = |tokens: &[SourceItem], text: &str| {
        let mut rest = text;
        for (count, token) in tokens.iter().enumerate() {
            let Written::Text(token) = &token.what else { return None };
            rest = rest.strip_prefix(&**token)?;
            if rest.is_empty() {
                return Some(count + 1);
            }
        }
        None
    };
    let mut matched = vec![None; items.len()];
    let (mut at, mut i) = (0, 0);
    while i < items.len() {
        let rest = written.get(at..).unwrap_or_default();
        let found = match items[i].what {
            Written::Node(_) => rest.iter().position(|w| w.what == items[i].what).map(|found| (found, 1)),
            Written::Text(_) => rest.iter().take_while(|w| matches!(w.what, Written::Text(_)) || !named(&w.what)).enumerate().find_map(|(found, w)| match &w.what {
                Written::Text(text) => spelled(&items[i..], text).map(|count| (found, count)),
                Written::Node(_) => None,
            }),
        };
        match found {
            Some((found, count)) => {
                matched[i..i + count].fill(Some(at + found));
                at += found + 1;
                i += count;
            }
            None => i += 1,
        }
    }
    matched
}

/// One tree as a render's source table: its own coordinates resolve, any
/// other tree's do not.
impl<G: EngineGrammar> SourceTable for ParsedTree<G> {
    fn source_of(&self, tree_id: crate::types::TreeId) -> Option<&Arc<str>> {
        (tree_id == self.tree_id).then_some(&self.source)
    }

    fn kind_of(&self, coord: &NodeCoordinate) -> Option<KindId> {
        node_at_index(&self.own(coord.tree)?.tree, coord.index).map(|node| crate::read::grammar_id(&node))
    }

    fn line_starts_inside_tokens(&self, coord: &NodeCoordinate) -> Vec<u32> {
        let Some(tree) = self.own(coord.tree) else { return Vec::new() };
        node_at_index(&tree.tree, coord.index).map_or_else(Vec::new, |node| line_starts_inside_tokens(node, coord.index, &tree.source))
    }

    fn last_list_child_kind(&self, tree: crate::types::TreeId, span: crate::types::Span, kind: KindId) -> Option<KindId> {
        last_list_child(&self.own(tree)?.tree, span, kind).map(|child| crate::read::grammar_id(&child))
    }

    fn slot_layouts(&self, coord: &NodeCoordinate) -> Vec<crate::layout::SlotLayout> {
        self.own(coord.tree).map_or_else(Vec::new, |tree| tree.slot_layouts(coord.index))
    }

    fn separator_before(&self, coord: &NodeCoordinate) -> Option<KindId> {
        self.own(coord.tree)?.separator_before(coord.index)
    }

    fn sides(&self, coord: &NodeCoordinate) -> Option<Box<dyn crate::trivia::FramedTrivia>> {
        let tree = self.own(coord.tree)?;
        let side = |side: TriviaSide| {
            let entries: Vec<_> = tree.side_entries(coord.index, side, coord.changed().on(side)).into_iter().map(SideEntry::into_entry).collect();
            (!entries.is_empty()).then_some(entries)
        };
        let trivia = crate::trivia::NodeTrivia { leading: side(TriviaSide::Leading), trailing: side(TriviaSide::Trailing), inner: side(TriviaSide::Inner) };
        (trivia.leading.is_some() || trivia.trailing.is_some() || trivia.inner.is_some()).then(|| Box::new(trivia) as Box<dyn crate::trivia::FramedTrivia>)
    }

    fn framed_span(&self, coord: &NodeCoordinate) -> Span {
        let Some(tree) = self.own(coord.tree) else { return coord.span };
        let spans = |side: TriviaSide| {
            tree.side_entries(coord.index, side, coord.changed().on(side)).into_iter().filter_map(|entry| match entry {
                SideEntry::Source { span, .. } => Some(span),
                SideEntry::Layout(_) | SideEntry::Written(_) => None,
            })
        };
        Span {
            start: spans(TriviaSide::Leading).map(|span| span.start).min().map_or(coord.span.start, |start| start.min(coord.span.start)),
            end: spans(TriviaSide::Trailing).map(|span| span.end).max().map_or(coord.span.end, |end| end.max(coord.span.end)),
        }
    }

    fn edited_within(&self, coord: &NodeCoordinate) -> bool {
        self.own(coord.tree).is_some_and(|tree| tree.edited_within(coord.index, false))
    }

    fn seat_through(&self, coord: &NodeCoordinate, wrappers: &[Option<crate::options::SeatPath>], seat: &dyn Fn(KindId) -> Option<crate::types::SiteId>) -> Option<crate::types::SiteId> {
        let mut node = node_at_index(&self.own(coord.tree)?.tree, coord.index)?;
        loop {
            node = match (*wrappers.get(crate::read::grammar_id(&node).index())?)? {
                crate::options::SeatPath::Content => {
                    let mut cursor = node.walk();
                    let held = node.named_children(&mut cursor).find(|child| !child.is_extra());
                    held?
                }
                crate::options::SeatPath::Field(field) => crate::read::child_by_field(&node, field)?,
            };
            if let Some(site) = seat(crate::read::grammar_id(&node)) {
                return Some(site);
            }
        }
    }

    fn read_ctx(&self, tree: crate::types::TreeId) -> Option<(&tree_sitter::Tree, crate::read::ReadCtx<'_>)> {
        let tree = self.own(tree)?;
        Some((&tree.tree, tree.seating_ctx()))
    }

    fn for_each_kind_ending_with(&self, coord: &NodeCoordinate, f: &mut dyn FnMut(KindId)) {
        let Some(tree) = self.own(coord.tree) else {
            return;
        };
        let mut node = node_at_index(&tree.tree, coord.index);
        let exact = node.is_some_and(|n| Span::of(&n) == coord.span);
        while let Some(current) = node {
            f(crate::read::grammar_id(&current));
            if !exact {
                return;
            }
            node = current
                .child_count()
                .checked_sub(1)
                .and_then(|last| current.child(last))
                .filter(|last| Span::of(last).end == Span::of(&current).end);
        }
    }
}

impl<G: EngineGrammar> ParsedTree<G> {
    /// This tree, when it is tree `tree`.
    fn own(&self, tree: crate::types::TreeId) -> Option<&Self> {
        (tree == self.tree_id).then_some(self)
    }
}

/// The engine's live trees as the render context's source table: a handle's
/// tag names the tree, and the tree owns the source its spans index into.
impl<G: EngineGrammar, H: std::hash::BuildHasher> SourceTable for HashMap<crate::types::TreeId, ParsedTree<G>, H> {
    fn source_of(&self, tree_id: crate::types::TreeId) -> Option<&Arc<str>> {
        self.get(&tree_id)?.source_of(tree_id)
    }

    fn kind_of(&self, coord: &NodeCoordinate) -> Option<KindId> {
        self.get(&coord.tree)?.kind_of(coord)
    }

    fn line_starts_inside_tokens(&self, coord: &NodeCoordinate) -> Vec<u32> {
        self.get(&coord.tree).map_or_else(Vec::new, |tree| tree.line_starts_inside_tokens(coord))
    }

    fn last_list_child_kind(&self, tree: crate::types::TreeId, span: crate::types::Span, kind: KindId) -> Option<KindId> {
        self.get(&tree)?.last_list_child_kind(tree, span, kind)
    }

    fn sides(&self, coord: &NodeCoordinate) -> Option<Box<dyn crate::trivia::FramedTrivia>> {
        self.get(&coord.tree)?.sides(coord)
    }

    fn slot_layouts(&self, coord: &NodeCoordinate) -> Vec<crate::layout::SlotLayout> {
        self.get(&coord.tree).map_or_else(Vec::new, |tree| SourceTable::slot_layouts(tree, coord))
    }

    fn separator_before(&self, coord: &NodeCoordinate) -> Option<KindId> {
        SourceTable::separator_before(self.get(&coord.tree)?, coord)
    }

    fn framed_span(&self, coord: &NodeCoordinate) -> Span {
        self.get(&coord.tree).map_or(coord.span, |tree| tree.framed_span(coord))
    }

    fn edited_within(&self, coord: &NodeCoordinate) -> bool {
        self.get(&coord.tree).is_some_and(|tree| SourceTable::edited_within(tree, coord))
    }

    fn seat_through(&self, coord: &NodeCoordinate, wrappers: &[Option<crate::options::SeatPath>], seat: &dyn Fn(KindId) -> Option<crate::types::SiteId>) -> Option<crate::types::SiteId> {
        self.get(&coord.tree)?.seat_through(coord, wrappers, seat)
    }

    fn read_ctx(&self, tree: crate::types::TreeId) -> Option<(&tree_sitter::Tree, crate::read::ReadCtx<'_>)> {
        SourceTable::read_ctx(self.get(&tree)?, tree)
    }

    fn for_each_kind_ending_with(&self, coord: &NodeCoordinate, f: &mut dyn FnMut(KindId)) {
        if let Some(tree) = self.get(&coord.tree) {
            tree.for_each_kind_ending_with(coord, f);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn counter_exhaustion_does_not_wrap_or_reuse_an_id() {
        use std::sync::atomic::{AtomicU32, Ordering::Relaxed};

        let counter = AtomicU32::new(MAX_TREE_ID - 1);
        assert_eq!(claim_tree_id_from_counter(&counter), Some(MAX_TREE_ID - 1));
        assert_eq!(claim_tree_id_from_counter(&counter), Some(MAX_TREE_ID));
        assert_eq!(claim_tree_id_from_counter(&counter), None);
        assert_eq!(claim_tree_id_from_counter(&counter), None);
        assert_eq!(counter.load(Relaxed), MAX_TREE_ID + 1);
    }

    #[test]
    fn concurrent_counter_claims_are_unique() {
        use std::sync::{atomic::AtomicU32, Arc, Barrier};

        let counter = Arc::new(AtomicU32::new(0));
        let barrier = Arc::new(Barrier::new(8));
        let threads: Vec<_> = (0..8)
            .map(|_| {
                let counter = Arc::clone(&counter);
                let barrier = Arc::clone(&barrier);
                std::thread::spawn(move || {
                    barrier.wait();
                    (0..256)
                        .map(|_| claim_tree_id_from_counter(&counter).unwrap())
                        .collect::<Vec<_>>()
                })
            })
            .collect();
        let mut ids: Vec<_> = threads
            .into_iter()
            .flat_map(|thread| thread.join().unwrap())
            .collect();
        ids.sort_unstable();
        assert_eq!(ids, (0..2048).collect::<Vec<_>>());
    }

    /// A test `function_item`'s slots: `name` 0, `return_type` 1.
    #[allow(clippy::unnecessary_wraps, reason = "a `Router::Children` route, whose type returns a `Result`")]
    fn function_item_route(child: &crate::read::Child) -> Result<crate::read::Route, crate::read::ReadError> {
        let language: tree_sitter::Language = tree_sitter_rust::LANGUAGE.into();
        let field = child.field.and_then(|field| crate::read::field_name(&language, field));
        Ok(match field {
            _ if child.trivia => crate::read::Route::Trivia,
            Some("name") => crate::read::Route::Slot { slot: crate::types::SlotId(0), scalar: false },
            Some("return_type") => crate::read::Route::Slot { slot: crate::types::SlotId(1), scalar: false },
            _ => crate::read::Route::Layout,
        })
    }

    /// A test block's or declaration list's one slot: each `function_item`.
    #[allow(clippy::unnecessary_wraps, reason = "a `Router::Children` route, whose type returns a `Result`")]
    fn item_route(child: &crate::read::Child) -> Result<crate::read::Route, crate::read::ReadError> {
        let language: tree_sitter::Language = tree_sitter_rust::LANGUAGE.into();
        Ok(match crate::read::kind_name(&language, child.grammar) {
            _ if child.trivia => crate::read::Route::Trivia,
            Some("function_item") => crate::read::Route::Slot { slot: crate::types::SlotId(0), scalar: false },
            _ => crate::read::Route::Layout,
        })
    }

    /// `slots` JSON for slot `n` of each kind.
    fn slots(of: &[(&str, u16)]) -> String {
        let pairs: Vec<String> = of.iter().map(|(kind, n)| format!(r#""{}":{n}"#, kind_id(kind))).collect();
        format!(r#""slots":{{{}}}"#, pairs.join(","))
    }

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

        fn render_module_hash(self) -> &'static str {
            "test"
        }

        fn kind_name(self, _kind: KindId) -> &'static str {
            "test"
        }

        fn router(self, grammar: KindId, _display: KindId) -> Option<crate::read::Router> {
            let language: tree_sitter::Language = tree_sitter_rust::LANGUAGE.into();
            match crate::read::kind_name(&language, grammar)? {
                "function_item" => Some(crate::read::Router::Children(function_item_route, |_, _| None)),
                "declaration_list" | "block" => Some(crate::read::Router::Children(item_route, |_, _| None)),
                _ => None,
            }
        }

        fn shows(self) -> fn(KindId) -> bool {
            |_| false
        }

        type Trivia = TestTrivia;

        fn whitespace(self) -> (&'static crate::render::WhitespaceTable, &'static [KindId]) {
            (&TEST_WHITESPACE, &[KindId(1), KindId(2)])
        }

        fn surface_kinds(self) -> crate::trivia_table::SurfaceKinds {
            crate::trivia_table::SurfaceKinds::default()
        }

        fn option_tables(self) -> &'static crate::options::OptionTables {
            &TEST_TABLES
        }
    }

    static TEST_TABLES: crate::options::OptionTables = crate::options::OptionTables {
        addresses: &[],
        allowed: |_| &[],
        delimiter_allowed: |_| crate::types::Delimiter::NONE,
        depth_sites: &[],
        indent: KindId(0),
        dedent: KindId(0),
        indent_chars: " \t",
        newline_arms: &["\n"],
    };

    /// A trivia type with text and one whitespace member, the break (kind 2).
    #[derive(Debug, Clone, PartialEq)]
    enum TestTrivia {
        Text(TriviaText),
        Newline,
    }

    crate::refuse_napi_codec!(TestTrivia);

    impl FromTriviaText for TestTrivia {
        fn from_text(text: TriviaText) -> Self {
            TestTrivia::Text(text)
        }

        fn from_layout(text: TriviaText) -> Option<Self> {
            (text.kind == KindId(2)).then_some(TestTrivia::Newline)
        }
    }

    impl crate::render::Render for TestTrivia {
        fn render(&self, w: &mut dyn crate::render::RenderSink) -> crate::render::RenderResult {
            match self {
                TestTrivia::Text(text) => w.text(&text.text),
                TestTrivia::Newline => Ok(()),
            }
        }
    }

    impl crate::trivia::TriviaSeam for TestTrivia {
        fn seam_gap(&self) -> Option<(crate::layout_kinds::LayoutKinds, Option<&str>)> {
            matches!(self, TestTrivia::Newline).then_some((crate::layout_kinds::LayoutKinds::NEWLINE, None))
        }
    }

    impl crate::prepare::Prepare for TestTrivia {
        fn prepare(&mut self, _: &crate::prepare::RenderContext<'_>) -> Result<(), crate::render::CoordinateError> {
            Ok(())
        }
    }

    fn test_spacing_text(kind: KindId) -> &'static str {
        match kind {
            KindId(1) => " ",
            KindId(2) => "\n",
            _ => "",
        }
    }

    const TEST_WHITESPACE: crate::render::WhitespaceTable =
        crate::render::WhitespaceTable { text_of: test_spacing_text, indent: KindId(0), dedent: KindId(0), leaf_edges: &[], gaps: &[] };

    fn rust_tree(source: &str) -> tree_sitter::Tree {
        let mut parser = tree_sitter::Parser::new();
        TestGrammar.configure_parser(&mut parser).unwrap();
        parser.parse(source, None).unwrap()
    }

    #[test]
    fn a_line_inside_a_string_or_block_comment_starts_inside_a_token() {
        let source = "fn f() {\n    let s = \"a\n  b\";\n    /* x\n  y\n*/\n    g();\n}\n";
        let tree = rust_tree(source);
        let b = source.find("  b").unwrap();
        let y = source.find("  y").unwrap();
        let close = source.find("*/").unwrap();
        assert_eq!(line_starts_inside_tokens(tree.root_node(), NodeIndex::ROOT, source), vec![crate::types::narrow(b), crate::types::narrow(y), crate::types::narrow(close)]);
    }

    #[test]
    fn lines_between_tokens_start_outside_every_token() {
        let source = "fn f() {\n    g();\n    // c\n    h();\n}\n// d\nfn i() {}\n";
        let tree = rust_tree(source);
        assert_eq!(line_starts_inside_tokens(tree.root_node(), NodeIndex::ROOT, source), Vec::<u32>::new());
    }

    const FNS: &str = "fn a() {}\nmod m { fn b() -> u8 { 0 } fn _c() {} }\nfn _d() { fn e() {} }\n";

    fn kind_id(name: &str) -> KindId {
        let language: tree_sitter::Language = tree_sitter_rust::LANGUAGE.into();
        crate::read::kind_named(&language, name, true)
    }

    fn parsed(source: &str) -> (ParsedTree<TestGrammar>, TreeHandle) {
        let mut engine = Engine::new(TestGrammar, ResolvedOptions::default()).expect("engine");
        let tree = engine.parse(source, crate::types::TreeId(1)).expect("parse");
        (tree, encode_handle(crate::types::TreeId(1), crate::types::NodeIndex(0)))
    }

    #[test]
    fn an_error_node_reads_as_the_bytes_its_coordinate_spans() {
        let (tree, _) = parsed("fn f() {} @@ fn g() {}");
        let index = (0..64).map(NodeIndex::new).find(|&i| node_at_index(tree.tree(), i).is_some_and(|node| node.is_error())).expect("the parse holds an ERROR");
        let error = tree.read_error(index).expect("an ERROR reads");
        let crate::read::Origin::Tree(at) = &error.at else { panic!("a live read names a coordinate") };
        assert_eq!((error.text.as_str(), at.span.start, at.span.end), ("@@", 10, 12));
        assert_eq!((error.kind, at.kind, at.tree), (Some(KindId(u16::MAX)), Some(KindId(u16::MAX)), TreeId(1)));
        assert_eq!(tree.read_error(NodeIndex::ROOT), None);
        let snapped = tree.snapshot_error(index, None).expect("an ERROR snapshots");
        let span = crate::points::PointSpan { start: crate::points::Point::ZERO, end: crate::points::Point { row: 0, column: 2 } };
        assert_eq!((snapped.text.as_str(), snapped.at), ("@@", crate::read::Origin::Snapshot(span)));
    }

    fn texts(tree: &ParsedTree<TestGrammar>, found: &[QueryCoordinate]) -> Vec<String> {
        found
            .iter()
            .map(|coord| tree.source()[coord.span.range()].lines().next().unwrap_or("").to_string())
            .collect()
    }

    fn walk(tree: &ParsedTree<TestGrammar>, root: TreeHandle, kinds: &[KindId], plan: Option<&Plan>, limit: u32) -> Vec<QueryCoordinate> {
        let mut found = Vec::new();
        let mut resume: Option<Vec<ChildPosition>> = None;
        loop {
            let batch = tree.descendants(crate::query::Address::Own { handle: root }, kinds, plan, resume.as_deref(), limit, None).expect("walk");
            assert!(crate::types::narrow(batch.coordinates.len()) <= limit);
            found.extend(batch.coordinates);
            match batch.resume {
                Some(path) => resume = Some(path),
                None => return found,
            }
        }
    }

    fn plan(json: &str) -> Plan {
        Plan::compile(serde_json::from_str(json).expect("plan json")).expect("plan compiles")
    }

    /// The descendant index of every node of `tree`, by its id.
    fn indexes(tree: &tree_sitter::Tree) -> std::collections::HashMap<usize, NodeIndex> {
        let mut out = std::collections::HashMap::new();
        let mut cursor = tree.walk();
        loop {
            out.insert(cursor.node().id(), crate::read::index_of(&cursor));
            if cursor.goto_first_child() {
                continue;
            }
            loop {
                if cursor.goto_next_sibling() {
                    break;
                }
                if !cursor.goto_parent() {
                    return out;
                }
            }
        }
    }

    #[test]
    fn each_coordinate_names_its_own_node_by_its_descendant_index() {
        let (tree, root) = parsed(FNS);
        let expected = indexes(&tree.tree);
        for coord in walk(&tree, root, &[], None, u32::MAX) {
            let index = decode_handle(coord.handle).1;
            let node = node_at_index(&tree.tree, index).expect("the coordinate names a node");
            assert_eq!(Some(&index), expected.get(&node.id()));
            assert_eq!((Span::of(&node), crate::read::grammar_id(&node)), (coord.span, coord.kind));
        }
    }

    #[test]
    fn a_nodes_siblings_are_those_beside_it_that_hold_sides() {
        let (tree, _) = parsed("fn f() {}\n// c\nfn g() {}\n");
        let f = index_of_kind(&tree, "function_item", 0);
        let g = index_of_kind(&tree, "function_item", 1);
        let item = crate::read::grammar_id(&node_at_index(&tree.tree, f).unwrap());
        let sibling = |start, end| Some(Sibling { start, end, kind: item });
        assert_eq!(tree.siblings(f), Siblings { previous: None, next: sibling(15, 24) });
        assert_eq!(tree.siblings(g), Siblings { previous: sibling(0, 9), next: None }, "the comment between them holds no sides");
        assert_eq!(tree.siblings(NodeIndex(crate::read::descendant_count(&tree.tree.root_node()))), Siblings::default());
    }

    #[test]
    fn a_walk_from_a_deep_start_hands_out_root_indexes() {
        let (tree, root) = parsed(FNS);
        let expected = indexes(&tree.tree);
        let module = tree.descendants(Address::Own { handle: root }, &[kind_id("mod_item")], None, None, 1, None).expect("walk");
        let start = Address::Own { handle: module.coordinates[0].handle };
        let inner = tree.descendants(start, &[kind_id("function_item")], None, None, 16, None).expect("walk");
        assert_eq!(inner.coordinates.len(), 2, "fn b and fn _c");
        for coord in &inner.coordinates {
            let node = node_at_index(&tree.tree, decode_handle(coord.handle).1).expect("the coordinate names a node");
            assert_eq!(Some(&decode_handle(coord.handle).1), expected.get(&node.id()));
            assert_eq!((Span::of(&node), crate::read::grammar_id(&node)), (coord.span, coord.kind));
        }
    }

    #[test]
    fn descendants_of_a_kind_come_in_pre_order() {
        let (tree, root) = parsed(FNS);
        let stubs = walk(&tree, root, &[kind_id("function_item")], None, u32::MAX);
        assert_eq!(texts(&tree, &stubs), ["fn a() {}", "fn b() -> u8 { 0 }", "fn _c() {}", "fn _d() { fn e() {} }", "fn e() {}"]);
    }

    #[test]
    fn every_batch_limit_yields_the_same_descendants() {
        let (tree, root) = parsed(FNS);
        let all = walk(&tree, root, &[], None, u32::MAX);
        for limit in [1, 2, 3, 4, 16] {
            let batched = walk(&tree, root, &[], None, limit);
            assert_eq!(texts(&tree, &batched), texts(&tree, &all), "limit {limit}");
        }
    }

    #[test]
    fn a_where_plan_selects_by_a_slot_text() {
        let (tree, root) = parsed(FNS);
        let fns = [kind_id("function_item")];
        let name = slots(&[("function_item", 0)]);
        let eq = plan(&format!(r#"{{ "op": "eq", {name}, "text": "b" }}"#));
        let eq_stubs = walk(&tree, root, &fns, Some(&eq), 1);
        assert_eq!(texts(&tree, &eq_stubs), ["fn b() -> u8 { 0 }"]);
        let private = plan(&format!(r#"{{ "op": "and", "of": [{{ "op": "match", {name}, "pattern": "^_" }}, {{ "op": "not", "of": {{ "op": "eq", {name}, "text": "_c" }} }}] }}"#));
        let private_stubs = walk(&tree, root, &fns, Some(&private), 1);
        assert_eq!(texts(&tree, &private_stubs), ["fn _d() { fn e() {} }"]);
        let returns = slots(&[("function_item", 1)]);
        let typed = plan(&format!(r#"{{ "op": "or", "of": [{{ "op": "eq", {returns}, "text": "u8" }}, {{ "op": "eq", {name}, "text": "e" }}] }}"#));
        let typed_stubs = walk(&tree, root, &fns, Some(&typed), 4);
        assert_eq!(texts(&tree, &typed_stubs), ["fn b() -> u8 { 0 }", "fn e() {}"]);
    }

    #[test]
    fn a_slot_is_read_by_each_kind_through_its_own_number() {
        let (tree, root) = parsed(FNS);
        let lists = [kind_id("declaration_list"), kind_id("block")];
        let items = slots(&[("declaration_list", 0), ("block", 0)]);
        let by_item = plan(&format!(r#"{{ "op": "match", {items}, "pattern": "^fn e" }}"#));
        let blocks = walk(&tree, root, &lists, Some(&by_item), 4);
        assert_eq!(texts(&tree, &blocks), ["{ fn e() {} }"]);
        let unnumbered = plan(&format!(r#"{{ "op": "eq", {}, "text": "b" }}"#, slots(&[("block", 0)])));
        let found = walk(&tree, root, &[kind_id("function_item")], Some(&unnumbered), 4);
        assert!(found.is_empty(), "{found:?}");
    }

    fn walk_from(tree: &ParsedTree<TestGrammar>, from: crate::query::Address, kinds: &[KindId]) -> Vec<String> {
        let batch = tree.descendants(from, kinds, None, None, u32::MAX, None).expect("walk");
        texts(tree, &batch.coordinates)
    }

    #[test]
    fn a_walk_starts_from_a_coordinate_address() {
        let (tree, root) = parsed(FNS);
        let fns = [kind_id("function_item")];
        let module = walk(&tree, root, &[kind_id("mod_item")], None, u32::MAX).remove(0);
        assert_eq!(walk_from(&tree, crate::query::Address::Own { handle: module.handle }, &fns), ["fn b() -> u8 { 0 }", "fn _c() {}"]);
    }

    #[test]
    fn a_plan_holds_over_a_list_of_addresses_in_order() {
        let (tree, root) = parsed(FNS);
        let found = walk(&tree, root, &[kind_id("function_item")], None, u32::MAX);
        let addresses: Vec<crate::query::Address> = found.iter().map(|coord| crate::query::Address::Own { handle: coord.handle }).collect();
        let private = plan(&format!(r#"{{ "op": "match", {}, "pattern": "^_" }}"#, slots(&[("function_item", 0)])));
        assert_eq!(tree.plan_holds(&addresses, &private).expect("holds"), [false, false, true, true, false]);
        let elsewhere = crate::query::Address::Own { handle: encode_handle(crate::types::TreeId(9), crate::types::NodeIndex(0)) };
        assert!(tree.plan_holds(&[elsewhere], &private).is_err());
        let past_end = crate::query::Address::Own { handle: encode_handle(decode_handle(root).0, NodeIndex(u32::MAX >> 1)) };
        assert!(tree.plan_holds(&[past_end], &private).is_err());
        assert!(tree.plan_holds(&[addresses[0], past_end], &private).is_err());
    }

    #[test]
    fn a_depth_limit_stops_the_walk_below_it() {
        let (tree, root) = parsed(FNS);
        let children = tree.descendants(crate::query::Address::Own { handle: root }, &[], None, None, u32::MAX, Some(1)).expect("walk");
        assert_eq!(texts(&tree, &children.coordinates), ["fn a() {}", "mod m { fn b() -> u8 { 0 } fn _c() {} }", "fn _d() { fn e() {} }"]);
        let mut resumed = Vec::new();
        let mut resume: Option<Vec<ChildPosition>> = None;
        loop {
            let batch = tree.descendants(crate::query::Address::Own { handle: root }, &[], None, resume.as_deref(), 1, Some(1)).expect("walk");
            resumed.extend(batch.coordinates);
            match batch.resume {
                Some(path) => resume = Some(path),
                None => break,
            }
        }
        assert_eq!(texts(&tree, &resumed), texts(&tree, &children.coordinates));
    }

    #[test]
    fn an_extra_and_its_interior_are_never_descendants() {
        let (tree, root) = parsed("/// doc\nfn a() {}\n");
        let kinds: Vec<KindId> = walk(&tree, root, &[], None, u32::MAX).iter().map(|coord| coord.kind).collect();
        for extra in ["line_comment", "doc_comment", "outer_doc_comment_marker"] {
            assert!(!kinds.contains(&kind_id(extra)), "{extra} walked");
        }
        assert!(kinds.contains(&kind_id("function_item")));
    }

    #[test]
    fn a_pattern_the_native_matcher_cannot_compile_is_refused() {
        let spec = serde_json::from_str(r#"{ "op": "match", "slots": { "1": 0 }, "pattern": "(a)\\1" }"#).expect("plan json");
        assert!(Plan::compile(spec).is_err());
    }

    fn index_of_kind(tree: &ParsedTree<TestGrammar>, kind: &str, nth: usize) -> NodeIndex {
        (0..crate::read::descendant_count(&tree.tree().root_node()))
            .map(NodeIndex::new)
            .filter(|&at| node_at_index(tree.tree(), at).is_some_and(|node| node.kind() == kind))
            .nth(nth)
            .unwrap_or_else(|| panic!("no {kind} number {nth}"))
    }

    #[test]
    fn a_side_reads_an_extra_as_its_coordinate_and_a_layout_run_as_its_member() {
        let (tree, _) = parsed("// c\nfn f() {}\n");
        let f = index_of_kind(&tree, "function_item", 0);
        let comment = index_of_kind(&tree, "line_comment", 0);
        let leading = tree.trivia_side(f, TriviaSide::Leading);
        let SlotValue::Coord(coord) = &leading[0].value else { panic!("an extra reads as its coordinate: {leading:?}") };
        assert_eq!((coord.tree, coord.index, coord.span.start, coord.span.end), (TreeId(1), comment, 0, 4));
        let newline = TriviaEntry::new(SlotValue::Node(TestTrivia::Newline));
        assert_eq!(leading[1..], *std::slice::from_ref(&newline));
        assert_eq!(tree.trivia_side(f, TriviaSide::Trailing), []);
    }

    #[test]
    fn a_structure_only_read_records_no_region_and_a_side_read_records_its_runs_region() {
        let (tree, root) = parsed("fn f() {\n    x;\n}\nfn g() {}\n");
        tree.trivia_table();
        walk(&tree, root, &[], None, 8);
        assert_eq!(tree.records_rendered(), 0);
        tree.trivia_side(index_of_kind(&tree, "function_item", 1), TriviaSide::Leading);
        assert_eq!(tree.records_rendered(), 1);
    }

    #[test]
    fn a_same_line_trailing_comment_has_no_line_break_before_it() {
        let (tree, _) = parsed("fn f() {} // c\nfn g() {}\n");
        let f = index_of_kind(&tree, "function_item", 0);
        let trailing = tree.trivia_side(f, TriviaSide::Trailing);
        assert!(matches!(trailing.first().map(|entry| &entry.value), Some(SlotValue::Coord(_))), "{trailing:?}");
    }

    #[test]
    fn a_changed_edge_drops_the_layout_runs_between_the_side_and_its_neighbour() {
        let (tree, _) = parsed("mod m {\n    // c\n    fn f() {}\n}\n");
        let f = index_of_kind(&tree, "function_item", 0);
        let runs = |side, changed| tree.side_entries(f, side, changed).into_iter().map(|entry| SideEntry::into_entry(entry).value).collect::<Vec<_>>();
        assert_eq!(runs(TriviaSide::Leading, true), runs(TriviaSide::Leading, false)[1..], "the run between the comment and its owner stays");
        assert_eq!(runs(TriviaSide::Trailing, false).len(), 1);
        assert_eq!(runs(TriviaSide::Trailing, true), [], "the run after the owner spelled the gap to its old neighbour");
    }

    #[test]
    fn an_error_in_a_side_reads_as_its_kind_and_source_text_with_the_runs_beside_it_on_its_line() {
        let (tree, _) = parsed("fn f() {} @@ fn g() {}");
        let sides = (0..crate::read::descendant_count(&tree.tree().root_node()))
            .map(NodeIndex::new)
            .flat_map(|at| [TriviaSide::Leading, TriviaSide::Trailing, TriviaSide::Inner].map(|side| tree.trivia_side(at, side)))
            .flatten()
            .collect::<Vec<_>>();
        let text = TriviaText { kind: KindId(u16::MAX), text: "@@".to_owned(), span: None, before: Some(" ".to_owned()), after: Some(" ".to_owned()) };
        assert!(sides.contains(&TriviaEntry::new(SlotValue::Node(TestTrivia::Text(text)))), "{sides:?}");
    }

    #[test]
    fn a_written_side_replaces_the_assigned_one_and_marks_its_ancestors_edited() {
        let (mut tree, _) = parsed("fn f() { a(); }\nfn g() {}\n");
        let f = index_of_kind(&tree, "function_item", 0);
        let g = index_of_kind(&tree, "function_item", 1);
        let a = index_of_kind(&tree, "expression_statement", 0);
        let written = vec![TriviaEntry::new(SlotValue::Node(TestTrivia::Text(TriviaText { kind: KindId(1), text: "// w".to_owned(), span: None, before: None, after: None })))];
        tree.write_trivia_side(a, TriviaSide::Leading, written.clone());
        assert_eq!(tree.trivia_side(a, TriviaSide::Leading), written);
        assert!(tree.edited_within(NodeIndex::ROOT, false));
        assert!(tree.edited_within(f, false));
        assert!(!tree.edited_within(g, false));
        assert!(!tree.edited_within(a, false), "a node's own leading is not within it");
        assert!(tree.edited_within(a, true));
    }

    #[test]
    fn a_written_inner_side_is_within_its_own_node() {
        let (mut tree, _) = parsed("fn f() {}\n");
        let block = index_of_kind(&tree, "block", 0);
        tree.write_trivia_side(block, TriviaSide::Inner, Vec::new());
        assert!(tree.edited_within(block, false));
    }

    fn table(tree: ParsedTree<TestGrammar>) -> HashMap<crate::types::TreeId, ParsedTree<TestGrammar>> {
        HashMap::from([(crate::types::TreeId(1), tree)])
    }

    fn coordinate(tree: &ParsedTree<TestGrammar>, index: crate::types::NodeIndex) -> NodeCoordinate {
        let node = node_at_index(tree.tree(), index).expect("a node");
        NodeCoordinate::new(crate::types::TreeId(1), index, index + crate::read::descendant_count(&node), Span::of(&node))
    }

    #[test]
    fn the_tree_table_gives_a_coordinate_its_sides() {
        let (tree, _) = parsed("mod m {\n    // c\n    fn f() {}\n}\n");
        let f = coordinate(&tree, index_of_kind(&tree, "function_item", 0));
        let leading = tree.trivia_side(f.index, TriviaSide::Leading);
        let trailing = tree.trivia_side(f.index, TriviaSide::Trailing);
        let sources = table(tree);
        let sides = sources.sides(&f).expect("the function has sides");
        let sides = sides.as_any().downcast_ref::<crate::trivia::NodeTrivia<TestTrivia>>().expect("the grammar's trivia");
        assert_eq!((sides.leading.as_deref(), sides.trailing.as_deref(), sides.inner.as_deref()), (Some(&leading[..]), Some(&trailing[..]), None));
    }

    #[test]
    fn a_coordinate_with_no_side_has_no_frame() {
        let (tree, _) = parsed("fn f() { a(); }\n");
        let a = coordinate(&tree, index_of_kind(&tree, "call_expression", 0));
        assert!(table(tree).sides(&a).is_none());
    }

    #[test]
    fn the_tree_table_answers_whether_a_coordinates_range_holds_a_write() {
        let (mut tree, _) = parsed("fn f() { a(); }\nfn g() {}\n");
        let f = coordinate(&tree, index_of_kind(&tree, "function_item", 0));
        let g = coordinate(&tree, index_of_kind(&tree, "function_item", 1));
        tree.write_trivia_side(index_of_kind(&tree, "expression_statement", 0), TriviaSide::Leading, Vec::new());
        let sources = table(tree);
        assert!(sources.edited_within(&f));
        assert!(!sources.edited_within(&g));
    }

    #[test]
    fn the_tree_table_hands_out_a_tree_and_its_read_context() {
        let (tree, _) = parsed("fn f() {}\n");
        let sources = table(tree);
        let (tree, ctx) = sources.read_ctx(crate::types::TreeId(1)).expect("tree 1 is live");
        assert_eq!(tree.root_node().kind(), "source_file");
        assert_eq!(ctx.text(&tree.root_node()), "fn f() {}\n");
        assert!(sources.read_ctx(crate::types::TreeId(2)).is_none());
    }

    #[test]
    fn a_value_with_no_read_reads_no_coordinate() {
        let (tree, _) = parsed("fn f() {}\n");
        let sources = table(tree);
        let (tree, ctx) = sources.read_ctx(crate::types::TreeId(1)).expect("tree 1 is live");
        assert!(<TestTrivia as crate::prepare::Prepare>::read_coordinate(tree, &ctx, NodeIndex::ROOT).is_none());
    }
}
