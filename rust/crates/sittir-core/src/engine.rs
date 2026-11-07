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

use crate::heap::HeapBytes;
use crate::nodes::{Kid, Nodes, Step, TreeNodes, Visit};
use crate::options::ResolvedOptions;
use crate::query::{Address, DescendantBatch, Plan, QueryCoordinate, QueryItem};
use crate::read::SideEntry;
use crate::types::Span;
use crate::render::SourceTable;
use crate::slot::{NodeCoordinate, SlotValue};
use crate::trivia::{FromTriviaText, TriviaEntry, TriviaText};
use crate::trivia_store::TriviaStore;
use crate::trivia_table::{Assigned, Placement, TriviaSide};
use crate::types::{ChildPosition, KindId, NodeIndex, RunId, TreeHandle, TreeId};
use std::collections::HashMap;
use std::sync::Arc;

/// Grammar-specific hooks used by the shared native engine.
pub trait EngineGrammar: Copy {
    /// The bits a packed kind field takes: the least that holds every kind
    /// id of the grammar below all-ones, which is `ERROR`.
    const KIND_BITS: u32;
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
    /// The grammar's surface kinds the trivia placement reads
    /// (`Placement`).
    fn surface_kinds(self) -> crate::trivia_table::SurfaceKinds;
    /// The grammar's option tables: each site's arms and the address an
    /// options object names it by.
    fn option_tables(self) -> &'static crate::options::OptionTables;
    /// The sides of the unit children of the node the cursor is on, by slot
    /// and item: the node read one level down by `ctx`
    /// (`NodeLayout::units`). None for a grammar with no nodes. The cursor
    /// was created at the tree's root.
    fn read_units(self, cursor: &mut tree_sitter::TreeCursor<'_>, ctx: &mut crate::read::ReadCtx<'_>) -> Vec<crate::layout::UnitSides<Self::Trivia>> {
        let _ = (cursor, ctx);
        Vec::new()
    }
    /// Renders the node the cursor is on, read by `ctx` `depth` levels
    /// down, from its templates under `render`, recording what it writes
    /// into `baseline` (`Lookups::recorded`); a recording render writes no
    /// text (`SpacingWriter::with_recording`). Refuses a read the model has
    /// no route for, naming it, and a render that fails. A grammar with no
    /// nodes renders nothing. The cursor was created at the tree's root, and
    /// a read that succeeds leaves it where it started (`ReadNode::read`).
    fn render_read(
        self,
        cursor: &mut tree_sitter::TreeCursor<'_>,
        depth: crate::read::Depth,
        ctx: &mut crate::read::ReadCtx<'_>,
        render: &crate::prepare::RenderContext<'_>,
        baseline: &mut crate::baseline::Baseline,
    ) -> Result<(), String> {
        let _ = (cursor, depth, ctx, render, baseline);
        Ok(())
    }
    /// The children of the node the cursor is on as its read routes them
    /// (`ReadNode::routes`); none for a node read without routes, or a
    /// grammar with no nodes. The cursor was created at the tree's root and
    /// ends where it started.
    fn slot_routes(self, cursor: &mut tree_sitter::TreeCursor<'_>) -> Option<crate::read::Routed> {
        let _ = cursor;
        None
    }
    /// How a node with these ids finds its slots, as its read does
    /// (`ReadNode::router`); none for a node read without slots, or a
    /// grammar with no nodes.
    fn router(self, grammar: KindId, display: KindId) -> Option<crate::read::Router> {
        let _ = (grammar, display);
        None
    }
    /// The id the read stores for the node the cursor is on when it stores
    /// the node as a unit (`ReadNode::unit_id`: an enum kind's member, a
    /// choice's unit variant); none for a node it stores as a node, or a
    /// grammar with no nodes. The cursor ends where it started.
    fn unit_id(self, cursor: &mut tree_sitter::TreeCursor<'_>) -> Option<KindId> {
        let _ = cursor;
        None
    }
    /// The delimiter flags the read stamps on the list the cursor is on
    /// (`ReadNode::delimiter`); none for a node that is no list with an
    /// optional flank, or a grammar with no nodes. The cursor ends where it
    /// started.
    fn delimiter(self, cursor: &mut tree_sitter::TreeCursor<'_>) -> Option<crate::types::Delimiter> {
        let _ = cursor;
        None
    }
}

/// Whether descendant `index` names a node of `tree`.
#[must_use]
pub fn names_node(tree: &tree_sitter::Tree, index: NodeIndex) -> bool {
    index.index() < crate::read::descendant_count(&tree.root_node()) as usize
}

/// The node at descendant `index` of `tree`, or `None` past its last node,
/// found from the root: a test's lookup of a node as tree-sitter gives it.
#[must_use]
pub fn node_at_index(tree: &tree_sitter::Tree, index: NodeIndex) -> Option<tree_sitter::Node<'_>> {
    if !names_node(tree, index) {
        return None;
    }
    let mut cursor = tree.walk();
    crate::read::goto(&mut cursor, index);
    Some(cursor.node())
}

/// The node at `index` that `nodes` navigates, `None` past the tree's last
/// node.
fn node(nodes: &mut dyn Nodes<'_>, index: NodeIndex) -> Option<Kid> {
    (index.index() < nodes.kid(NodeIndex::ROOT).count as usize).then(|| nodes.kid(index))
}

/// The outermost `ERROR` that is or holds the node at `index`, or `None`
/// when none does. A tree whose root holds no error answers at once;
/// otherwise the node's ancestors are climbed, so the cost follows the
/// node's depth, not how many siblings precede it.
fn error_holding(nodes: &mut dyn Nodes<'_>, index: NodeIndex) -> Option<Kid> {
    if !nodes.kid(NodeIndex::ROOT).has_error {
        return None;
    }
    let mut outermost = None;
    let mut at = Some(index);
    while let Some(here) = at {
        let kid = nodes.kid(here);
        if kid.error {
            outermost = Some(kid);
        }
        at = nodes.parent(here);
    }
    outermost
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
pub fn line_starts_inside_tokens(nodes: &mut dyn Nodes<'_>, index: NodeIndex, source: &str) -> Vec<u32> {
    let walk = crate::trivia_table::walk(nodes, index, source);
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

/// Every ERROR and MISSING region of the tree `nodes` navigates, in source
/// order. The walk enters only nodes that hold an error, and never an ERROR
/// node: a region nested in another is part of it.
#[must_use]
pub fn error_regions(nodes: &mut dyn Nodes<'_>) -> Vec<ErrorRegion> {
    let mut regions = Vec::new();
    nodes.walk(NodeIndex::ROOT, &mut |step, kid| {
        if step == Step::Leave {
            return Visit::Pass;
        }
        let kind = if kid.error {
            Some(ErrorRegionKind::Error)
        } else if kid.missing {
            Some(ErrorRegionKind::Missing)
        } else {
            None
        };
        if let Some(kind) = kind {
            regions.push(ErrorRegion { kind, span: kid.span() });
        }
        if kind.is_none() && kid.has_error { Visit::Enter } else { Visit::Pass }
    });
    regions
}

/// The node a coordinate names: of the nodes spanning exactly `start..end`,
/// the outermost the read stamped `kind`, either the grammar symbol that
/// parsed it or the kind the parser shows it as (`identity`), since a node
/// read as an alias envelope is addressed by the kind it shows.
///
/// The search descends from the root by byte: at each level it steps to the
/// child at `start` (`Nodes::child_past`) without visiting the children
/// before it. A span of at least one byte can only sit in that child, since
/// siblings never overlap; a zero-width span can also sit at the end of a
/// sibling ending at `start` or in a zero-width sibling there, so the search
/// first steps back over the siblings ending at `start`, then tries each
/// child forward, in source order, while it starts at or before `start`.
#[must_use]
pub fn node_at_span(nodes: &mut dyn Nodes<'_>, span: Span, kind: KindId) -> Option<Kid> {
    fn search(nodes: &mut dyn Nodes<'_>, node: Kid, span: Span, kind: KindId) -> Option<Kid> {
        if node.span() == span && (node.grammar == kind || node.display == kind) {
            return Some(node);
        }
        let mut child = match nodes.child_past(node.index, span.start) {
            Some(child) => child,
            None => *nodes.kids(node.index).last()?,
        };
        if span.start == span.end {
            while let Some(back) = nodes.previous(child.index).filter(|back| back.end >= span.start) {
                child = back;
            }
        }
        loop {
            if child.start > span.start {
                return None;
            }
            if span.end <= child.end {
                if let Some(found) = search(nodes, child, span, kind) {
                    return Some(found);
                }
            }
            child = nodes.next(child.index)?;
        }
    }
    let root = nodes.kid(NodeIndex::ROOT);
    search(nodes, root, span, kind)
}

/// The smallest node whose bytes hold `span`, as tree-sitter finds it
/// (`Node::descendant_for_byte_range`): at each level, the first child that
/// reaches the span's end and passes its start (or, empty, reaches its
/// start), when it starts at or before the span does. `None` for a span that
/// ends before it starts.
fn descendant_for(nodes: &mut dyn Nodes<'_>, span: Span) -> Option<NodeIndex> {
    if span.start > span.end {
        return None;
    }
    let reaches = |child: &Kid| child.end >= span.end && if child.width() == 0 { child.end >= span.start } else { child.end > span.start };
    let mut node = NodeIndex::ROOT;
    loop {
        let child = if span.start == span.end { nodes.kids(node).iter().copied().find(|child| reaches(child)) } else { nodes.child_past(node, span.start).filter(|child| reaches(child)) };
        match child.filter(|child| child.start <= span.start) {
            Some(child) => node = child.index,
            None => return Some(node),
        }
    }
}

/// The last child that is neither an extra nor a zero-width token (which spells no
/// delimiter) of the list spanning `start..end`: of
/// the node the read stamped `kind` at that span (`node_at_span`), or, for a
/// list the tree holds no node of its own for, of the node holding the list's
/// children, among the children that lie within the span. That node is the
/// one strictly around the span, above any node spanning exactly the span.
#[must_use]
pub fn last_list_child(nodes: &mut dyn Nodes<'_>, span: Span, kind: KindId) -> Option<Kid> {
    let holder = if let Some(list) = node_at_span(nodes, span, kind) { list.index } else {
        let found = descendant_for(nodes, span)?;
        let inner = outermost_same_span(nodes, found);
        if nodes.kid(inner).span() == span {
            nodes.parent(inner)?
        } else {
            inner
        }
    };
    nodes.kids(holder).iter().rev().find(|child| !child.extra && child.width() > 0 && child.start >= span.start && child.end <= span.end).copied()
}

/// The nearest node whose span reaches past the node at `index` on both
/// sides, the root where none does: it holds every gap beside the node, and
/// so every run, extra and `ERROR` of its sides.
fn enclosing(nodes: &mut dyn Nodes<'_>, index: NodeIndex) -> Kid {
    let mut at = nodes.kid(index);
    let span = at.span();
    loop {
        if at.start != span.start && at.end != span.end {
            return at;
        }
        match nodes.parent(at.index) {
            Some(up) => at = nodes.kid(up),
            None => return at,
        }
    }
}

/// The outermost node spanning exactly the bytes the node at `index` spans:
/// the node itself unless a wrapper holds it alone.
pub(crate) fn outermost_same_span(nodes: &mut dyn Nodes<'_>, index: NodeIndex) -> NodeIndex {
    let span = nodes.kid(index).span();
    let mut outer = index;
    while let Some(up) = nodes.parent(outer) {
        if nodes.kid(up).span() != span {
            break;
        }
        outer = up;
    }
    outer
}

/// The siblings beside the node at descendant `index` (`Siblings`).
#[must_use]
pub fn siblings(nodes: &mut dyn Nodes<'_>, index: crate::types::NodeIndex) -> Siblings {
    siblings_counting(nodes, index, |_| ())
}

/// [`siblings`], reporting how many children of the parent it visited to `visited`.
fn siblings_counting(nodes: &mut dyn Nodes<'_>, index: crate::types::NodeIndex, visited: impl Fn(usize)) -> Siblings {
    let node = nodes.kid(index);
    let outer = outermost_same_span(nodes, index);
    let Some(parent) = nodes.parent(outer) else { return Siblings::default() };
    let around = nodes.kid(parent).span();
    let children = nodes.kids(parent);
    visited(children.len());
    let at = children.iter().position(|child| child.index == outer).unwrap_or(0);
    let field = children.get(at).and_then(|child| child.field);
    let item = |child: &&Kid| child.field == field && child.holder();
    let sibling = |child: &Kid| Sibling { start: child.start, end: child.end, kind: child.grammar };
    Siblings {
        previous: (around.start != node.start).then(|| children[..at].iter().rev().find(item).map(sibling)).flatten(),
        next: (around.end != node.end).then(|| children[at + 1..].iter().find(item).map(sibling)).flatten(),
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
/// resolves through the tree's navigation (`ParsedTree::nodes`).
pub struct ParsedTree<G: EngineGrammar> {
    /// The grammar's read facts, consulted by every read of this tree.
    grammar: G,
    /// The parsed tree-sitter tree.
    tree: tree_sitter::Tree,
    source: Arc<str>,
    /// What the parse read off the source's layout: the tree's layer of the
    /// render options (`InferredOptions`).
    inferred: crate::options::InferredOptions,
    /// Whether the source spells every line break `\n`, holding no `\r`
    /// (`SourceTable::breaks_spelled_lf`).
    breaks_lf: bool,
    /// Identity this tree stamps into every handle it mints. Distinct per
    /// parse, so a handle names the tree it belongs to and cannot be spent
    /// against another one.
    tree_id: TreeId,
    /// The source's row starts, built on the first snapshot and shared by
    /// every later one.
    lines: std::sync::OnceLock<crate::points::LineTable>,
    /// The tree's trivia, placed one layout owner at a time on the first read
    /// of a side the layout owner holds, each layout owner's sides published
    /// as a table a read of them reaches without a lock (`cover_side`).
    trivia: Placement,
    /// The tree's depth members, found on its first depth move
    /// (`Lookups::depth_move`).
    depth_members: std::sync::OnceLock<crate::trivia_table::DepthMembers>,
    /// The options in effect when the tree was read: its inferred layer over
    /// the engine's. What its regions record under.
    read_options: ResolvedOptions,
    /// Each record of the tree, by its node's index and the depth it was
    /// read to (`recorded`).
    records: std::sync::Mutex<crate::heap::CountedMap<(NodeIndex, crate::read::Depth), Record>>,
    /// Each node's list slots, by its index, measured on first use
    /// (`node_slots`).
    slots: std::sync::Mutex<crate::heap::CountedMap<NodeIndex, Arc<NodeSlots>>>,
    /// Each node's routed children, by its index, measured on first use
    /// (`slot_items`).
    items: std::sync::Mutex<crate::heap::CountedMap<NodeIndex, Arc<Option<SlotItems>>>>,
    /// The heap the values of `records`, `slots` and `items` hold, added as
    /// each is inserted (`count_cached`).
    cached: std::sync::atomic::AtomicUsize,
    /// Whether a table the tree counts grew since the last `take_grown`;
    /// its arena keeps its own.
    grown: std::sync::atomic::AtomicBool,
    /// The work its layout reads have done (`layout_work`).
    work: crate::layout::LayoutWorkCounter,
    /// The store of the engine that parsed the tree: the built arena the
    /// records its written sides name come from.
    store: TriviaStore<G::Trivia>,
    /// The sides writes set, by row: the tree's own, written through
    /// `&mut self` alone (`write_trivia_side`), so no read of them ever
    /// meets a write and none takes a lock.
    sides: crate::trivia_store::SideRows<NodeIndex, G::Trivia>,
    /// The tree's records, each written on its node's first read, and those
    /// no cell names, which it holds by row (`tree_arena`): made on the
    /// first call that reaches them.
    #[cfg(feature = "arena")]
    arena: std::sync::OnceLock<std::sync::Mutex<crate::arena::TreeArena>>,
}

impl<G: EngineGrammar> Drop for ParsedTree<G> {
    /// Drops the tree's sides (`release_sides`).
    fn drop(&mut self) {
        let _ = self.release_sides();
    }
}

/// A record of a tree (`ParsedTree::recorded`), shared by every run it
/// answers, or the error its read or render refused with.
type Record = Arc<Result<crate::baseline::Baseline, String>>;

/// What `mutex` holds, reached through sole access without a lock,
/// whether or not a holder panicked.
fn owned<T>(mutex: &mut std::sync::Mutex<T>) -> &mut T {
    mutex.get_mut().unwrap_or_else(std::sync::PoisonError::into_inner)
}

/// What a read of a node by its index answers (`ParsedTree::read_node`):
/// the node, or, when an `ERROR` holds it, that `ERROR`.
#[derive(Debug, Clone, PartialEq)]
pub enum NodeRead<T> {
    Node(T),
    Error(crate::ErrorRead),
}

/// A node's list slots as its tree measures them (`ParsedTree::node_slots`):
/// each slot's stored layout, and the slot and side of each run that lies in
/// one of its gaps, by the run's place among the table's runs.
#[derive(Debug, Default)]
struct NodeSlots {
    layouts: Vec<crate::layout::SlotLayout>,
    runs: crate::heap::CountedMap<RunId, (usize, crate::list_slots::SlotSide)>,
    /// The separator before each item whose gap holds another than its
    /// slot's, by the item's index.
    separators: crate::heap::CountedMap<NodeIndex, KindId>,
}

/// A node's children as its read routes them (`read::Routed`), with each
/// child's place among them by its descendant index.
#[derive(Debug)]
struct SlotItems {
    routed: crate::read::Routed,
    at: crate::heap::CountedMap<NodeIndex, usize>,
}

impl HeapBytes for NodeSlots {
    fn heap_bytes(&self) -> usize {
        let Self { layouts, runs, separators } = self;
        layouts.heap_bytes() + runs.heap_bytes() + separators.heap_bytes()
    }
}

impl HeapBytes for SlotItems {
    fn heap_bytes(&self) -> usize {
        let Self { routed, at } = self;
        routed.heap_bytes() + at.heap_bytes()
    }
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
#[must_use]
pub fn claim_tree_id() -> Option<TreeClaim> {
    claim_tree_id_from_counter(&NEXT_TREE_ID).map(|id| TreeClaim(TreeId(id)))
}

/// The one claim on a tree id a parse consumes (`Engine::parse`): minted only
/// by `claim_tree_id` and `claim_tree_id_from`, and neither copied nor
/// cloned, so each tree a counter serves holds an id its own claim minted.
#[derive(Debug, PartialEq, Eq)]
pub struct TreeClaim(TreeId);

impl TreeClaim {
    /// The id this claim is on.
    #[must_use]
    pub fn id(&self) -> TreeId {
        self.0
    }

    /// The id, the claim spent on it.
    fn into_id(self) -> TreeId {
        self.0
    }
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
/// claim); the claim and the value to record come back together, or nothing
/// once `MAX_TREE_ID` has been claimed — the owner then records nothing, so
/// the counter stays put and no id is ever reused.
#[must_use]
pub fn claim_tree_id_from(next: Option<f64>) -> Option<(TreeClaim, f64)> {
    let id = crate::types::exact_whole(next.unwrap_or(0.0)).ok().and_then(|whole| u32::try_from(whole).ok()).filter(|&id| id <= MAX_TREE_ID)?;
    Some((TreeClaim(TreeId(id)), f64::from(id) + 1.0))
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

    /// The grammar the tree was parsed with.
    pub fn grammar(&self) -> G {
        self.grammar
    }

    /// Whether a table the tree counts grew since the last call, and so
    /// holds other than its last report (`native_bytes`). A new tree has
    /// grown.
    pub fn take_grown(&mut self) -> bool {
        let own = std::mem::take(self.grown.get_mut()) | self.trivia.take_grown();
        #[cfg(feature = "arena")]
        let own = self.arena.get_mut().is_some_and(|arena| owned(arena).take_grown()) | own;
        own
    }

    /// Marks a table the tree counts grown (`take_grown`).
    fn grew(&self) {
        self.grown.store(true, std::sync::atomic::Ordering::Relaxed);
    }

    /// The bytes the tree holds natively: its own size and every table's
    /// heap, each counted by its capacity. tree-sitter's tree is left out,
    /// and so is a B-tree's node slack (`heap`).
    ///
    /// The count takes the tree mutably, so it reads every table without a
    /// lock, and nothing can hold one of them while it counts. A count is
    /// refused while anything borrows the tree:
    ///
    /// ```compile_fail,E0502
    /// fn count<G: sittir_core::engine::EngineGrammar>(tree: &mut sittir_core::ParsedTree<G>) -> usize {
    ///     let source = tree.source();
    ///     let bytes = tree.native_bytes();
    ///     source.len() + bytes
    /// }
    /// ```
    #[must_use]
    pub fn native_bytes(&mut self) -> usize {
        let Self {
            grammar: _,
            tree: _,
            source,
            inferred,
            breaks_lf: _,
            tree_id: _,
            lines,
            trivia,
            depth_members,
            read_options,
            records,
            slots,
            items,
            cached,
            grown: _,
            work: _,
            store: _,
            sides,
            #[cfg(feature = "arena")]
            arena,
        } = self;
        let tables = owned(records).allocation() + owned(slots).allocation() + owned(items).allocation();
        #[cfg(feature = "arena")]
        let arena = arena.get_mut().map_or(0, |arena| owned(arena).heap_bytes());
        #[cfg(not(feature = "arena"))]
        let arena = 0;
        std::mem::size_of::<Self>()
            + source.heap_bytes()
            + inferred.heap_bytes()
            + lines.get().map_or(0, HeapBytes::heap_bytes)
            + trivia.heap_bytes()
            + depth_members.get().map_or(0, HeapBytes::heap_bytes)
            + read_options.heap_bytes()
            + tables
            + cached.load(std::sync::atomic::Ordering::Relaxed)
            + sides.bytes()
            + arena
    }

    /// What a walk of the read caches finds their values hold: the count
    /// `count_cached` keeps.
    #[cfg(test)]
    fn cached_by_walk(&mut self) -> usize {
        owned(&mut self.records).values().map(HeapBytes::heap_bytes).sum::<usize>()
            + owned(&mut self.slots).values().map(HeapBytes::heap_bytes).sum::<usize>()
            + owned(&mut self.items).values().map(HeapBytes::heap_bytes).sum::<usize>()
    }

    /// Adds the heap of `value`, inserted into a read cache, to the tree's
    /// count, less what the value it replaced held, and marks the tree grown.
    fn count_cached<V: HeapBytes>(&self, value: &V, replaced: Option<&V>) {
        use std::sync::atomic::Ordering::Relaxed;
        self.cached.fetch_add(value.heap_bytes(), Relaxed);
        if let Some(replaced) = replaced {
            self.cached.fetch_sub(replaced.heap_bytes(), Relaxed);
        }
        self.grew();
    }

    /// The tree's records, held while the guard lives, the arena made on the
    /// first call: every route that reads a node reaches or writes its
    /// record here.
    #[cfg(feature = "arena")]
    pub fn tree_arena(&self) -> std::sync::MutexGuard<'_, crate::arena::TreeArena> {
        self.arena
            .get_or_init(|| std::sync::Mutex::new(crate::arena::TreeArena::new(G::KIND_BITS, crate::read::descendant_count(&self.tree.root_node()))))
            .lock()
            .unwrap_or_else(std::sync::PoisonError::into_inner)
    }

    /// Whether a call made the tree's arena (`tree_arena`).
    #[cfg(feature = "arena")]
    #[must_use]
    pub fn made_arena(&self) -> bool {
        self.arena.get().is_some()
    }

    /// Drops the tree's written sides, releasing the built records those
    /// held (`TriviaStore::release_rows`), and answers whether one did.
    /// Dropping the tree releases them too; once released, a release finds
    /// none.
    #[must_use]
    pub fn release_sides(&mut self) -> bool {
        self.store.release_rows(&self.sides.take())
    }

    /// The parsed tree-sitter tree.
    pub fn tree(&self) -> &tree_sitter::Tree {
        &self.tree
    }

    /// Navigation of the tree for one call, its moves counted in the tree's
    /// layout work (`TreeNodes`).
    #[must_use]
    pub fn nodes(&self) -> TreeNodes<'_> {
        TreeNodes::new(&self.tree, &self.source, &self.work)
    }

    /// The node at `index` read into `T`, `depth` levels down, seating no
    /// sides; index 0 is the root.
    pub fn read<T: crate::read::ReadNode>(&self, index: crate::types::NodeIndex, depth: crate::read::Depth) -> Result<T, crate::read::ReadError> {
        crate::read::read_from::<T>(self.nodes().reader(index), &mut self.read_ctx(), depth)
    }

    /// The sides of the unit children of the node at `index`, by slot and
    /// item, as a render read seats them for a client that stores each unit
    /// as its bare kind (`EngineGrammar::read_units`, `ReadCtx::inline_units`).
    pub fn unit_sides(&self, index: crate::types::NodeIndex) -> Vec<crate::layout::UnitSides<G::Trivia>> {
        let seating = self.seating();
        let mut cursor = seating.cursor(index);
        self.grammar.read_units(&mut cursor, &mut seating.ctx().inline_units().units_only())
    }

    /// The `ERROR` holding the node at `index`, read as the bytes its
    /// coordinate spans, or `None` when no `ERROR` holds it. An `ERROR`'s
    /// interior is trivia of its tree, so a node in it is no typed node: it
    /// reads as the outermost `ERROR` it lies in, itself included.
    pub fn read_error(&self, index: crate::types::NodeIndex) -> Option<crate::ErrorRead> {
        let mut nodes = self.nodes();
        node(&mut nodes, index)?;
        let error = error_holding(&mut nodes, index)?;
        Some(self.error_at(&error, &self.read_ctx()))
    }

    /// The `ERROR` holding the node at `index` (`read_error`) as `snapshot`
    /// reads one: its bytes and its span from the byte `holder`, or `None`
    /// when no `ERROR` holds it. Refuses a holder after the `ERROR`'s start
    /// (`ReadError::Unmeasured`).
    pub fn snapshot_error(&self, index: crate::types::NodeIndex, holder: Option<u32>) -> Option<Result<crate::ErrorRead, crate::read::ReadError>> {
        let mut nodes = self.nodes();
        node(&mut nodes, index)?;
        let error = error_holding(&mut nodes, index)?;
        Some(self.snapshot_error_at(&error, holder))
    }

    /// The node at `index` read into `T`, `depth` levels down, seating no
    /// sides and reading a list's items with it (`ReadCtx::inline_items`),
    /// or, when an `ERROR` holds it, that `ERROR` as `read_error` reads it:
    /// one navigation answers both. `None` past the tree's last node.
    pub fn read_node<T: crate::read::ReadNode>(&self, index: crate::types::NodeIndex, depth: crate::read::Depth) -> Option<Result<NodeRead<T>, crate::read::ReadError>> {
        let mut nodes = self.nodes();
        node(&mut nodes, index)?;
        let mut cursor = nodes.reader(index).clone();
        let mut ctx = self.read_ctx().inline_items();
        if let Some(error) = error_holding(&mut nodes, index) {
            return Some(Ok(NodeRead::Error(self.error_at(&error, &ctx))));
        }
        Some(T::read(&mut cursor, &mut ctx, depth).map(NodeRead::Node))
    }

    /// A snapshot of the node at `index` (`snapshot`), or, when an `ERROR`
    /// holds it, that `ERROR` as `snapshot_error` reads it: one navigation
    /// answers both. `None` past the tree's last node.
    pub fn snapshot_node<T: crate::read::ReadNode>(&self, index: crate::types::NodeIndex, holder: Option<u32>) -> Option<Result<NodeRead<T>, crate::read::ReadError>> {
        let mut nodes = self.nodes();
        node(&mut nodes, index)?;
        if let Some(error) = error_holding(&mut nodes, index) {
            return Some(self.snapshot_error_at(&error, holder).map(NodeRead::Error));
        }
        Some(self.snapshot_in(nodes, index, holder).map(NodeRead::Node))
    }

    /// The `ERROR` `error` as a snapshot reads it, measured from the byte
    /// `holder` or its own start: an `ERROR`'s snapshot measures its own span
    /// alone.
    fn snapshot_error_at(&self, error: &Kid, holder: Option<u32>) -> Result<crate::ErrorRead, crate::read::ReadError> {
        let ctx = self.read_ctx().snapshot(self.snapshot_measure(error.index, error.start, holder)?);
        let read = self.error_at(error, &ctx);
        ctx.unmeasured().map_or(Ok(read), |byte| Err(crate::read::ReadError::Unmeasured { index: error.index, byte }))
    }

    fn error_at(&self, error: &Kid, ctx: &crate::read::ReadCtx<'_>) -> crate::ErrorRead {
        let at = ctx.coordinate_of(error);
        let text = self.source[at.span.range()].to_owned();
        crate::ErrorRead { text, kind: at.kind, at: ctx.origin_of(at) }
    }

    pub(crate) fn read_ctx(&self) -> crate::read::ReadCtx<'_> {
        crate::read::ReadCtx::new(&self.source, self.tree_id, self.grammar.shows()).with_relaxes(self.grammar.relaxes())
    }

    /// The coordinate a read of this tree names the node at `index` by
    /// (`ReadCtx::coordinate_of`); `None` past its last node.
    #[must_use]
    pub fn row_coordinate(&self, index: crate::types::NodeIndex) -> Option<crate::slot::NodeCoordinate> {
        self.lookups().coordinate(index)
    }

    /// The bytes the node at `index` renders between as its source: its span
    /// widened by the extras and `ERROR`s its frames hold
    /// (`SourceTable::framed_span`). A diagnostic; `None` past the last node.
    #[must_use]
    pub fn framed_span_at(&self, index: crate::types::NodeIndex) -> Option<Span> {
        let seating = self.seating();
        let coord = seating.lookups.borrow_mut().coordinate(index)?;
        Some(SourceTable::framed_span(&seating, &coord))
    }

    /// The source's row starts (`LineTable`), built on first use.
    pub fn lines(&self) -> &crate::points::LineTable {
        self.lines.get_or_init(|| {
            self.grew();
            crate::points::LineTable::new(&self.source)
        })
    }

    /// What a snapshot of the node at `index` measures with: from the byte
    /// `holder`, or, when it has none, from `from`, the first byte the
    /// snapshot measures. The root has no holder and starts the source.
    /// Refuses a holder after `from`, which no offset could measure from
    /// (`ReadError::Unmeasured`).
    fn snapshot_measure(&self, index: crate::types::NodeIndex, from: u32, holder: Option<u32>) -> Result<crate::read::SnapshotCtx<'_>, crate::read::ReadError> {
        if holder.is_some_and(|byte| byte > from) {
            return Err(crate::read::ReadError::Unmeasured { index, byte: from });
        }
        let own = (index != NodeIndex::ROOT).then_some(from);
        Ok(crate::read::SnapshotCtx::new(self.lines(), holder.or(own), index))
    }

    /// A snapshot of the node at `index`, read at every depth: each node with
    /// its span from the node that holds it, each extra and `ERROR` of
    /// its sides with its text, and the node itself measured from the byte
    /// `holder`, or, when absent, from where it or its leading side begins,
    /// whichever is first. Refuses a holder after that byte, and any point a
    /// holder would measure from after it (`ReadError::Unmeasured`).
    pub fn snapshot<T: crate::read::ReadNode>(&self, index: crate::types::NodeIndex, holder: Option<u32>) -> Result<T, crate::read::ReadError> {
        self.snapshot_in(self.nodes(), index, holder)
    }

    /// `snapshot`, its sides found and its node read through `nodes`.
    fn snapshot_in<'t, T: crate::read::ReadNode>(&'t self, nodes: TreeNodes<'t>, index: crate::types::NodeIndex, holder: Option<u32>) -> Result<T, crate::read::ReadError> {
        let mut lookups = self.lookups_over(nodes);
        lookups.record = Some(lookups.enclosing(index));
        let start = lookups.nodes.kid(index).start;
        let from = lookups.leading_start(index).map_or(start, |leading| leading.min(start));
        let mut cursor = lookups.nodes.reader(index).clone();
        let seating = Seating::with_layout(lookups);
        let mut ctx = self.read_ctx().with_sides(&seating).snapshot(self.snapshot_measure(index, from, holder)?);
        let read = T::read(&mut cursor, &mut ctx, crate::read::Depth::All)?;
        ctx.unmeasured().map_or(Ok(read), |byte| Err(crate::read::ReadError::Unmeasured { index, byte }))
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

    /// Whether each node `addresses` names satisfies `plan`, in order. An
    /// address that names no node of this tree is refused.
    pub fn plan_holds(&self, addresses: &[Address], plan: &Plan) -> Result<Vec<bool>, String> {
        let ctx = self.read_ctx();
        let stamp = |node: &tree_sitter::Node<'_>| ctx.node_kind(node);
        let router = |node: &tree_sitter::Node<'_>| self.grammar.router(crate::read::grammar_id(node), crate::read::display_id(node));
        let delimiter = |cursor: &mut tree_sitter::TreeCursor<'_>| self.grammar.delimiter(cursor);
        let query = crate::query::QueryCtx { source: &self.source, stamp: &stamp, router: &router, delimiter: &delimiter };
        let mut nodes = self.nodes();
        addresses
            .iter()
            .map(|&address| {
                let index = self.index_in(&mut nodes, address)?;
                Ok(plan.holds(nodes.reader(index), &query))
            })
            .collect()
    }

    /// The descendant index of the node `address` names, found through
    /// `nodes`.
    fn index_in(&self, nodes: &mut TreeNodes<'_>, address: Address) -> Result<NodeIndex, String> {
        let missing = || format!("{address:?} names no node of tree {}", self.tree_id);
        let mut resolve = |handle: TreeHandle| -> Result<NodeIndex, String> { node(nodes, self.local_index(handle)?).map(|kid| kid.index).ok_or_else(missing) };
        match address {
            Address::Own { handle } => resolve(handle),
            Address::Child { parent, index } => {
                let parent = resolve(parent)?;
                nodes.kids(parent).get(index.get() as usize).map(|kid| kid.index).ok_or_else(missing)
            }
        }
    }

    /// Walk the subtree under `from` in pre-order and return up to `limit`
    /// named, non-extra descendants whose stored id is in `kinds` (every one
    /// when `kinds` is empty) and that satisfy `plan`, each as the item a
    /// read hands out for it (`QueryItem`). A node's stored id is the id its
    /// read stores: its unit id when the read stores it as a unit
    /// (`EngineGrammar::unit_id`), which the walk yields in place of a
    /// coordinate, and otherwise its stamp. `resume` is the path of
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
        let mut nodes = self.nodes();
        let index = self.index_in(&mut nodes, from)?;
        let origin = encode_handle(self.tree_id, index);
        let start = nodes.kid(index);
        let mut levels: Vec<(Arc<[Kid]>, usize)> = Vec::new();
        let mut items = Vec::new();
        let ctx = self.read_ctx();
        let stamp = |node: &tree_sitter::Node<'_>| ctx.node_kind(node);
        let router = |node: &tree_sitter::Node<'_>| self.grammar.router(crate::read::grammar_id(node), crate::read::display_id(node));
        let delimiter = |cursor: &mut tree_sitter::TreeCursor<'_>| self.grammar.delimiter(cursor);
        let query = crate::query::QueryCtx { source: &self.source, stamp: &stamp, router: &router, delimiter: &delimiter };
        let surface = self.grammar.surface_kinds();
        for &child in resume.unwrap_or_default() {
            let parent = levels.last().map_or(start, |(kids, at)| kids[*at]);
            let kids = nodes.kids(parent.index);
            let at = child.get() as usize;
            if at >= kids.len() {
                return Err("resume path leaves the tree".to_string());
            }
            levels.push((kids, at));
        }
        let path = |levels: &[(Arc<[Kid]>, usize)]| levels.iter().map(|&(_, at)| ChildPosition(crate::types::narrow(at))).collect();
        while let Some(kid) = Self::advance(&mut nodes, start, &mut levels, depth) {
            if !kid.named || kid.extra || surface.is_depth_member(kid.grammar) {
                continue;
            }
            let unit = self.grammar.unit_id(nodes.reader(kid.index));
            if (kinds.is_empty() || kinds.contains(&unit.unwrap_or_else(|| ctx.stamped_kind(kid.grammar, kid.display)))) && plan.is_none_or(|plan| plan.holds(nodes.reader(kid.index), &query)) {
                items.push(unit.map_or_else(|| QueryItem::Node(QueryCoordinate::from(ctx.coordinate_of(&kid))), QueryItem::Unit));
                if crate::types::narrow(items.len()) >= limit {
                    return Ok(DescendantBatch { items, resume: Some(path(&levels)), origin });
                }
            }
        }
        Ok(DescendantBatch { items, resume: None, origin })
    }

    /// The node after the walk's last in pre-order below `start`, at most
    /// `depth` levels down and never into an extra, `levels` holding the
    /// children of each node the walk is inside and where it is among them;
    /// `None` once the walk is done.
    fn advance(nodes: &mut TreeNodes<'_>, start: Kid, levels: &mut Vec<(Arc<[Kid]>, usize)>, depth: usize) -> Option<Kid> {
        let current = levels.last().map_or(start, |(kids, at)| kids[*at]);
        if levels.len() < depth && !current.extra && current.count > 1 {
            let kids = nodes.kids(current.index);
            let first = kids[0];
            levels.push((kids, 0));
            return Some(first);
        }
        loop {
            let (kids, at) = levels.last_mut()?;
            if let Some(&next) = kids.get(*at + 1) {
                *at += 1;
                return Some(next);
            }
            levels.pop();
        }
    }

    /// The lines under the node at `index` that begin inside a token
    /// (`line_starts_inside_tokens`); `None` past the tree's last node.
    #[must_use]
    pub fn line_starts_inside_tokens(&self, index: NodeIndex) -> Option<Vec<u32>> {
        self.lookups().line_starts(index)
    }

    /// Every ERROR and MISSING region of the parse (`error_regions`).
    pub fn error_regions(&self) -> Vec<ErrorRegion> {
        error_regions(&mut self.nodes())
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

    /// The text `span` covers in the source, or `None` when it is not a
    /// span of the source: past its end, reversed, or splitting a character.
    #[must_use]
    pub fn text(&self, span: crate::types::Span) -> Option<&str> {
        self.source.get(span.range())
    }

    /// The siblings beside each node at `indexes` (`Siblings`), found
    /// through one navigation: the items routed to its slot beside it where
    /// its parent's read routes its children, else `siblings`.
    pub fn siblings(&self, indexes: &[crate::types::NodeIndex]) -> Vec<Siblings> {
        let mut nodes = self.nodes();
        indexes.iter().map(|&index| self.slot_siblings(&mut nodes, index).unwrap_or_else(|| siblings_counting(&mut nodes, index, |n| self.work.sibling_items(n)))).collect()
    }

    /// The work the tree's layout reads have done so far, with the records
    /// rendered (`records_rendered`).
    pub fn layout_work(&self) -> crate::layout::LayoutWork {
        self.work.counts(crate::types::narrow(self.records_rendered()))
    }

    /// The children of the node the cursor is on as its read routes them,
    /// measured on first use and kept; `None` where its read routes none.
    /// The cursor was created at the tree's root and ends where it started.
    fn slot_items(&self, cursor: &mut tree_sitter::TreeCursor<'_>) -> Arc<Option<SlotItems>> {
        let index = crate::read::index_of(cursor);
        if let Some(items) = self.items.lock().unwrap_or_else(std::sync::PoisonError::into_inner).get(&index) {
            return Arc::clone(items);
        }
        let items = Arc::new(self.grammar.slot_routes(cursor).map(|routed| {
            self.work.sibling_items(routed.children.len());
            let at = routed.children.iter().enumerate().map(|(at, child)| (child.index, at)).collect();
            SlotItems { routed, at }
        }));
        let replaced = self.items.lock().unwrap_or_else(std::sync::PoisonError::into_inner).insert(index, Arc::clone(&items));
        self.count_cached(&items, replaced.as_ref());
        items
    }

    /// The items routed to the slot of the node at `index` beside it, taken
    /// at the outermost node spanning exactly its bytes; `None` where its
    /// parent's read routes no children, or routes it to no slot.
    fn slot_siblings(&self, nodes: &mut TreeNodes<'_>, index: crate::types::NodeIndex) -> Option<Siblings> {
        let outer = outermost_same_span(nodes, index);
        let parent = nodes.parent(outer)?;
        let items = self.slot_items(nodes.reader(parent));
        let SlotItems { routed, at } = items.as_ref().as_ref()?;
        let at = *at.get(&outer)?;
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

    /// One call's lookups in this tree (`Lookups`).
    fn lookups(&self) -> Lookups<'_, G> {
        self.lookups_over(self.nodes())
    }

    /// The lookups that find this tree's nodes through `nodes`.
    fn lookups_over<'t>(&'t self, nodes: TreeNodes<'t>) -> Lookups<'t, G> {
        Lookups { tree: self, nodes, record: None, aligned: HashMap::default() }
    }

    /// This tree's sides and source table for one call (`Seating`).
    #[must_use]
    pub fn seating(&self) -> Seating<'_, G> {
        Seating::with_layout(self.lookups())
    }

    /// The source of the run at `at` among the table's runs, measured as
    /// its baseline is: from the last text before it that is not whitespace,
    /// back to the run before it at most.
    fn run_text(&self, at: RunId) -> &str {
        &self.source[self.trivia.run_from(at) as usize..self.trivia.run(at).end as usize]
    }

    /// The separator before the node at `index` as an item of its parent's
    /// list slot, where its gap holds another than the one the slot renders
    /// (`Lookups::node_slots`): the item after an outlier separator stores
    /// it.
    pub fn separator_before(&self, index: crate::types::NodeIndex) -> Option<KindId> {
        self.lookups().separator_before(index)
    }

    /// The separator the list at `index` writes between its items: the one
    /// its slot stores where its source's gaps differ from what the read-time
    /// options render, else the one those options render, which is also the
    /// answer for a list of no gap. None for a node that is no list.
    pub fn slot_separator(&self, index: crate::types::NodeIndex) -> Option<KindId> {
        self.lookups().slot_separator(index)
    }

    /// The stored layout of each list slot of the node at `index` that
    /// stores any (`Lookups::node_slots`).
    pub fn slot_layouts(&self, index: crate::types::NodeIndex) -> Vec<crate::layout::SlotLayout> {
        self.lookups().slot_layouts(index)
    }

    /// How many records of the tree have been rendered.
    pub fn records_rendered(&self) -> usize {
        self.records.lock().unwrap_or_else(std::sync::PoisonError::into_inner).len()
    }

    /// The bytes of text the tree's records tallied a character at a time
    /// (`baseline::Baseline::scanned`), over every record rendered; a
    /// record whose render refused holds none.
    pub fn records_scanned(&self) -> u64 {
        self.records.lock().unwrap_or_else(std::sync::PoisonError::into_inner).values().filter_map(|record| record.as_ref().as_ref().ok()).map(crate::baseline::Baseline::scanned).sum()
    }

    /// The whitespace the read-time options write at `run`, read from its
    /// region's record, or from the record of the whole tree when `whole`.
    /// The region is the nearest node at or above the run's owner that
    /// renders in a frame of its own and writes something on both sides of
    /// the run, read as deep as the run needs (`Lookups::region_depth`). In
    /// the record, the run reads the breaks between what the
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
        self.lookups().baseline_gap(run, whole)
    }

    /// Every run of whitespace a side takes (`Placement::runs`), each with
    /// what the read-time options write there (`baseline_gap`).
    pub fn baseline_runs(&self, whole: bool) -> Result<Vec<(crate::trivia_table::LayoutRun, Option<crate::baseline::Tally>)>, String> {
        let mut lookups = self.lookups();
        self.placed_trivia().runs().into_iter().map(|(_, run)| Ok((run, lookups.baseline_gap(run, whole)?))).collect()
    }

    /// How much of its layout the tree stores apart from its read-time
    /// options: each run a side stores as a member (`Lookups::deviation`),
    /// each list slot storing a layout (`slot_layouts`) and each item storing
    /// its own separator (`separator_before`), over every node.
    pub fn stored_layout(&self) -> crate::layout::StoredLayout {
        let count = |n: usize| u32::try_from(n).unwrap_or(u32::MAX);
        let mut lookups = self.lookups();
        let nodes = (0..lookups.nodes.kid(NodeIndex::ROOT).count).map(NodeIndex::new);
        let slots = nodes.map(|index| lookups.node_slots(index)).fold((0, 0), |(layouts, separators), slots| {
            (layouts + slots.layouts.iter().filter(|layout| !layout.is_empty()).count(), separators + slots.separators.len())
        });
        crate::layout::StoredLayout {
            deviations: count(self.placed_trivia().runs().into_iter().filter(|&(at, _)| lookups.deviation(at).is_some()).count()),
            slots: count(slots.0),
            separators: count(slots.1),
        }
    }

    /// The tree's depth members, found through `nodes` on first use.
    fn depth_members(&self, nodes: &mut TreeNodes<'_>) -> &crate::trivia_table::DepthMembers {
        self.depth_members.get_or_init(|| {
            self.grew();
            let members = crate::trivia_table::DepthMembers::of(nodes, self.grammar.surface_kinds());
            self.work.depth_nodes(members.walked());
            members
        })
    }

    /// What `f` answers given the tree's nodes as trivia placement reads
    /// them, through `nodes`, with their text's row starts.
    fn with_trivia_source<'t, R>(&'t self, nodes: &mut TreeNodes<'t>, f: impl FnOnce(crate::trivia_table::Source<'t, '_>) -> R) -> R {
        f(crate::trivia_table::Source { nodes, lines: self.lines() })
    }

    /// The tree's trivia with every layout owner placed.
    pub fn placed_trivia(&self) -> &Placement {
        self.with_trivia_source(&mut self.nodes(), |source| self.trivia.place_all(source));
        &self.trivia
    }

    /// The table of the layout owner that holds `side` of the node at
    /// `index`, placed on its first read through `nodes`
    /// (`Placement::cover`).
    fn cover_side<'t>(&'t self, nodes: &mut TreeNodes<'t>, index: crate::types::NodeIndex, side: TriviaSide) -> Option<&'t crate::trivia_table::Table> {
        self.with_trivia_source(nodes, |source| self.trivia.cover(source, index, side))
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
        self.lookups().side_entries(index, side, edge_changed)
    }

    fn depth_member(delta: i32) -> Option<SideEntry<G::Trivia>> {
        <G::Trivia as crate::trivia::TriviaSeam>::depth_member(delta).map(|member| SideEntry::Layout(TriviaEntry::new(SlotValue::Node(member))))
    }

    /// Whether the node at `index` is empty (`trivia_table::is_empty`): no
    /// child of it has width, so its trivia is its `inner`.
    pub fn is_empty(&self, index: crate::types::NodeIndex) -> bool {
        let mut nodes = self.nodes();
        node(&mut nodes, index).is_some() && crate::trivia_table::is_empty(&mut nodes, index)
    }

    /// The store of the engine that parsed the tree: the built arena the
    /// records its written sides name come from, and what answers them.
    pub fn store(&self) -> &TriviaStore<G::Trivia> {
        &self.store
    }

    /// Replace `side` of the node at `index` with `entries`, holding the
    /// built records among them (`TriviaStore::hold`) and releasing those the
    /// side held, and mark the tree grown: its rows count in its native
    /// bytes. The tree is marked even when the release is refused, since it
    /// comes after the side is written.
    ///
    /// # Errors
    ///
    /// What holding or releasing a built record refuses, before the side is
    /// written when a new entry's record is refused.
    #[cfg(feature = "arena")]
    pub fn write_trivia_side(&mut self, index: crate::types::NodeIndex, side: TriviaSide, entries: Vec<TriviaEntry<G::Trivia>>) -> Result<(), String> {
        let entries = crate::trivia_store::kept(entries);
        self.store.hold(&entries).map_err(|e| e.to_string())?;
        let replaced = self.sides.insert(index, side, entries);
        self.grew();
        self.store.release_entries(replaced.as_deref().unwrap_or_default()).map_err(|e| e.to_string())
    }

    /// Replace `side` of the node at `index` with `entries`, and mark the
    /// tree grown: its rows count in its native bytes.
    ///
    /// # Errors
    ///
    /// None: no entry names a built record.
    #[cfg(not(feature = "arena"))]
    pub fn write_trivia_side(&mut self, index: crate::types::NodeIndex, side: TriviaSide, entries: Vec<TriviaEntry<G::Trivia>>) -> Result<(), String> {
        self.sides.insert(index, side, crate::trivia_store::kept(entries));
        self.grew();
        Ok(())
    }

    /// Whether a write replaced a side of a node under the node at `index`:
    /// of a descendant, or of the node's own `inner`, and of its own leading
    /// and trailing too when `own_sides` is set. It walks the written rows
    /// alone (`TriviaStore::edit_walks`).
    pub fn edited_within(&self, index: crate::types::NodeIndex, own_sides: bool) -> bool {
        let Some(kid) = node(&mut self.nodes(), index) else { return false };
        self.edited_in(index, index + kid.count, own_sides)
    }

    /// Whether a write replaced a side of a node among those at `start..end`
    /// (`edited_within`).
    fn edited_in(&self, start: NodeIndex, end: NodeIndex, own_sides: bool) -> bool {
        let (edited, walked) = self.sides.edited_within(start, end, own_sides);
        self.store.walked(walked);
        edited
    }
}

// ─── Lookups ─────────────────────────────────────────────────────────────────

/// The lookups by descendant index one call makes in a tree, each through
/// the call's one navigation (`TreeNodes`), which moves its cursor from
/// where the last left it: a pass that looks up nodes near one another, as a
/// read in order does, costs the path between them, not the path from the
/// root. A lookup that reads or renders a node lends the cursor to that
/// read.
struct Lookups<'t, G: EngineGrammar> {
    tree: &'t ParsedTree<G>,
    nodes: TreeNodes<'t>,
    /// The node whose full-depth record measures every run, when one record
    /// does, as a snapshot's: the nearest node around the snapshot's own
    /// (`enclosing`), so the record holds the runs at the snapshot's edges.
    /// A region measures a run that record holds no frame for or cannot
    /// render (`measured_record`).
    record: Option<NodeIndex>,
    /// Each frame a gap no anchor measures was read from, by its record and
    /// its node, with the record it is a frame of (`aligned`).
    aligned: HashMap<(usize, NodeIndex), (Record, std::rc::Rc<Aligned>), crate::heap::IndexState>,
}

impl<G: EngineGrammar> Lookups<'_, G> {
    /// The node at `index`, `None` past the tree's last node.
    fn kid(&mut self, index: NodeIndex) -> Option<Kid> {
        node(&mut self.nodes, index)
    }

    /// The coordinate a read of the tree names the node at `index` by
    /// (`ReadCtx::coordinate_of`); `None` past its last node.
    fn coordinate(&mut self, index: NodeIndex) -> Option<NodeCoordinate> {
        let kid = self.kid(index)?;
        Some(self.tree.read_ctx().coordinate_of(&kid))
    }

    /// The entries `ParsedTree::side_entries` answers.
    fn side_entries(&mut self, index: NodeIndex, side: TriviaSide, edge_changed: bool) -> Vec<SideEntry<G::Trivia>> {
        let mut entries = self.seated(index, side, true);
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
                ParsedTree::<G>::depth_member,
            );
        }
        entries
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
    /// class the slot stores on its side instead, where it stores one. A run
    /// an entry's adjacency spells (`LayoutRun::spelled`) stores none: the
    /// adjacency is its one carrier.
    fn deviation(&mut self, at: RunId) -> Option<G::Trivia> {
        let tree = self.tree;
        if tree.trivia.run(at).spelled {
            return None;
        }
        let text = tree.run_text(at);
        let kind = tree.layout_kind(text)?;
        let class = self.slot_class(at).unwrap_or_else(|| self.baseline_class(at));
        (class != Some(kind)).then(|| G::Trivia::from_layout(TriviaText::of(kind, text))).flatten()
    }

    /// The class the read-time options write at the run at `at`: its
    /// baseline's whitespace as a layout class reads it (`Tally::spelling`).
    fn baseline_class(&mut self, at: RunId) -> Option<KindId> {
        let tree = self.tree;
        let gap = self.baseline_gap(tree.trivia.run(at), false).ok().flatten()?;
        tree.layout_kind(&gap.spelling())
    }

    /// The class the run at `at` takes as a side of a list slot's gap: the
    /// slot's stored class on that side, else the run's baseline class
    /// (`None` where no baseline reaches it). `None` outside a slot's gaps,
    /// and for a run that does not carry the layout around it.
    #[allow(clippy::option_option, reason = "`None` outside a slot's gaps; `Some(None)` inside one that no baseline reaches")]
    fn slot_class(&mut self, at: RunId) -> Option<Option<KindId>> {
        use crate::list_slots::SlotSide;
        let run = self.tree.trivia.run(at);
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
    /// class most of its runs' sources have, a run an entry's adjacency
    /// spells (`LayoutRun::spelled`) not among them, a tie going to the class the
    /// first gap's baseline writes when it is among the tied, else to the
    /// first gap's; the slot stores it only where it differs from that
    /// baseline class. Its separator is the one most of its gaps hold, a tie
    /// going to the one the region's record writes there, stored only where
    /// it differs from that one, or where the record names none.
    fn node_slots(&mut self, index: crate::types::NodeIndex) -> Arc<NodeSlots> {
        use crate::list_slots::{majority, SlotGap, SlotGaps, SlotSide};
        let tree = self.tree;
        if let Some(slots) = tree.slots.lock().unwrap_or_else(std::sync::PoisonError::into_inner).get(&index) {
            return Arc::clone(slots);
        }
        tree.cover_side(&mut self.nodes, index, TriviaSide::Inner);
        let table = &tree.trivia;
        let run_at = |start: u32, end: u32| table.run_at(start, end);
        let slots = tree.grammar.slot_routes(self.nodes.reader(index)).map_or_else(Vec::new, |routed| crate::list_slots::slot_gaps(&routed, run_at));
        let mut measured = NodeSlots::default();
        for (slot, SlotGaps { key, gaps }) in slots.iter().enumerate() {
            let mut side = |side: SlotSide, of: fn(&SlotGap) -> Option<RunId>| {
                let carried: Vec<RunId> = gaps.iter().filter_map(of).filter(|&at| {
                    let run = table.run(at);
                    run.carries && !run.spelled
                }).collect();
                measured.runs.extend(carried.iter().map(|&at| (at, (slot, side))));
                let classes: Vec<(KindId, KindId)> = carried.iter().filter_map(|&at| Some((tree.layout_kind(tree.run_text(at))?, self.baseline_class(at)?))).collect();
                let baseline = classes.first()?.1;
                let sources: Vec<KindId> = classes.iter().map(|&(source, _)| source).collect();
                majority(&sources, Some(baseline)).filter(|&class| class != baseline)
            };
            let before = side(SlotSide::Before, |gap| gap.before);
            let after = side(SlotSide::After, |gap| gap.after);
            let separators: Vec<crate::list_slots::Separator> = gaps.iter().map(|gap| gap.separator).collect();
            let text = |separator: &crate::list_slots::Separator| &tree.source[separator.start as usize..separator.end as usize];
            let written = gaps.first().and_then(|gap| self.written_separator(index, gap.items));
            let preferred = separators.iter().find(|separator| Some(text(separator)) == written.as_deref()).map(|separator| separator.kind);
            let kinds: Vec<KindId> = separators.iter().map(|separator| separator.kind).collect();
            let effective = majority(&kinds, preferred);
            let separator = effective.filter(|&kind| Some(kind) != preferred || written.is_none());
            measured.separators.extend(gaps.iter().filter(|gap| Some(gap.separator.kind) != effective).map(|gap| (gap.items.1, gap.separator.kind)));
            measured.layouts.push(crate::layout::SlotLayout { slot: (*key).to_string(), before, after, separator, tokens: Vec::new() });
        }
        let measured = Arc::new(measured);
        let replaced = tree.slots.lock().unwrap_or_else(std::sync::PoisonError::into_inner).insert(index, Arc::clone(&measured));
        tree.count_cached(&measured, replaced.as_ref());
        measured
    }

    /// The text the read-time options write between the items at `items`
    /// in the record of the region of the node at `index`: the texts its
    /// frame writes after the first and before the second.
    fn written_separator(&mut self, index: NodeIndex, items: (NodeIndex, NodeIndex)) -> Option<String> {
        use crate::baseline::Written;
        let record = match self.measured_record(index) {
            Some(record) => record,
            None => self.recorded(index, REGION_DEPTH),
        };
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

    /// What `ParsedTree::separator_before` answers.
    fn separator_before(&mut self, index: NodeIndex) -> Option<KindId> {
        self.kid(index)?;
        let parent = self.nodes.parent(index)?;
        self.node_slots(parent).separators.get(&index).copied()
    }

    /// What `ParsedTree::slot_separator` answers.
    fn slot_separator(&mut self, index: NodeIndex) -> Option<KindId> {
        let stored = self.node_slots(index).layouts.iter().find_map(|layout| layout.separator);
        stored.or_else(|| self.tree.read_options.separator_of(self.kid(index)?.grammar))
    }

    /// What `ParsedTree::slot_layouts` answers.
    fn slot_layouts(&mut self, index: NodeIndex) -> Vec<crate::layout::SlotLayout> {
        self.node_slots(index).layouts.iter().filter(|layout| !layout.is_empty()).cloned().collect()
    }

    /// The full-depth record of `record`, when these lookups measure in one,
    /// it renders and it holds a frame for the node at `at`.
    fn measured_record(&mut self, at: NodeIndex) -> Option<Record> {
        let root = self.record?;
        let record = self.recorded(root, crate::read::Depth::All);
        record.as_ref().as_ref().is_ok_and(|baseline| baseline.frame(at).is_some()).then_some(record)
    }

    /// What the options in effect at read time render at the gaps under the
    /// node at descendant `index`, recorded on first use and kept: the node
    /// read `depth` levels down and rendered from its templates, with its
    /// extras and `ERROR`s but none of its layout runs or writes
    /// (`baseline::Baseline`), each node the render looks up found in the
    /// region around it (`around`). Read `REGION_DEPTH` levels down, it
    /// records the node's own region; read at every depth, every region of
    /// its subtree. The error the read or render refused with, when one did.
    fn recorded(&mut self, index: NodeIndex, depth: crate::read::Depth) -> Record {
        let tree = self.tree;
        if let Some(record) = tree.records.lock().unwrap_or_else(std::sync::PoisonError::into_inner).get(&(index, depth)) {
            return Arc::clone(record);
        }
        let sides = Seating::without_layout(self.around(index));
        let mut recorded = crate::baseline::Baseline::default();
        let mut ctx = tree.read_ctx().with_sides(&sides);
        let render = crate::prepare::RenderContext { options: &tree.read_options, sources: &sides };
        let rendered = tree.grammar.render_read(self.nodes.reader(index), depth, &mut ctx, &render, &mut recorded);
        tree.work.record_nodes(recorded.entered());
        let record = Arc::new(rendered.map(|()| recorded));
        let replaced = tree.records.lock().unwrap_or_else(std::sync::PoisonError::into_inner).insert((index, depth), Arc::clone(&record));
        tree.count_cached(&record, replaced.as_ref());
        record
    }

    /// The lookups of the region around the node at `index`: the subtree of
    /// the node `enclosing` it, navigated from a copy of this navigation's
    /// cursor (`TreeNodes::region`).
    fn around(&mut self, index: NodeIndex) -> Self {
        let region = enclosing(&mut self.nodes.copy(), index);
        Self { tree: self.tree, nodes: self.nodes.region(region.index..region.index + region.count), record: None, aligned: HashMap::default() }
    }

    /// The node `enclosing` the node at `index`, found on a copy of the
    /// cursor, so the lookups' own stays near the node.
    fn enclosing(&mut self, index: NodeIndex) -> NodeIndex {
        enclosing(&mut self.nodes.copy(), index).index
    }

    /// How far the region of the node at `region` is read for `run`: deep
    /// enough that every node between it and the run whose span starts or
    /// ends inside the run or at its edges renders from its template, and at
    /// least `REGION_DEPTH`. That reaches a node beginning at the line break
    /// before it (python's block), one empty there (typescript's automatic
    /// semicolon, which writes a line break), and the tokens on either side
    /// of the run, whose edges set what the options write in it. A slice of
    /// such a node would write the run's source as part of its own text, or
    /// leave the run's edges unknown.
    /// The walk enters only the children that touch the run, found by byte,
    /// so a run in a long list costs the region's depth, not its width.
    fn region_depth(&mut self, region: NodeIndex, run: crate::trivia_table::LayoutRun) -> crate::read::Depth {
        let inside = |kid: &Kid| (run.start..=run.end).contains(&kid.start) || (run.start..=run.end).contains(&kid.end);
        let touches = |kid: &Kid| kid.start <= run.end && kid.end >= run.start;
        let mut deepest = 0;
        let mut stack = vec![(self.nodes.kid(region), 0usize)];
        while let Some((kid, depth)) = stack.pop() {
            self.tree.work.region_nodes(1);
            if depth > 0 && inside(&kid) {
                deepest = deepest.max(depth);
            }
            if !touches(&kid) {
                continue;
            }
            let mut child = match run.start.checked_sub(1) {
                Some(before) => self.nodes.child_past(kid.index, before),
                None => self.nodes.kids(kid.index).first().copied(),
            };
            while let Some(entered) = child.filter(|child| child.start <= run.end) {
                stack.push((entered, depth + 1));
                child = self.nodes.next(entered.index);
            }
        }
        match REGION_DEPTH {
            crate::read::Depth::Levels(least) => std::num::NonZeroU32::new(crate::types::narrow(deepest) + 1).map_or(REGION_DEPTH, |levels| crate::read::Depth::Levels(levels.max(least))),
            crate::read::Depth::All => REGION_DEPTH,
        }
    }

    /// What `ParsedTree::baseline_gap` answers.
    fn baseline_gap(&mut self, run: crate::trivia_table::LayoutRun, whole: bool) -> Result<Option<crate::baseline::Tally>, String> {
        if !run.carries {
            return Ok(Some(crate::baseline::Tally::default()));
        }
        let tree = self.tree;
        let mut at = run.owner;
        loop {
            let record = if whole {
                self.recorded(NodeIndex::ROOT, crate::read::Depth::All)
            } else if let Some(record) = self.measured_record(at) {
                record
            } else {
                let depth = self.region_depth(at, run);
                self.recorded(at, depth)
            };
            let baseline = record.as_ref().as_ref().map_err(String::clone)?;
            if let Some(frame) = baseline.frame(at) {
                if let Some(gap) = baseline.between(run.start, run.end) {
                    return Ok(Some(gap));
                }
                let aligned = self.aligned(&record, at, baseline, frame);
                tree.work.gap_items(1);
                let source = &aligned.source;
                let left = source.partition_point(|item| item.start < run.start || (item.start == run.start && item.end <= run.start)).checked_sub(1);
                let right = Some(source.partition_point(|item| item.end < run.end || (item.end == run.end && item.start < run.end))).filter(|&right| right < source.len());
                let node = self.nodes.kid(at);
                let inside = node.start < run.start || left.is_some();
                let ends_after = node.end > run.end || right.is_some();
                if inside && ends_after {
                    let matched = &aligned.matched;
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
            match self.nodes.parent(at) {
                Some(up) => at = up,
                None => return Ok(None),
            }
        }
    }

    /// The source items of the frame `record` holds for the node at `at`,
    /// and where each meets what the frame wrote (`source_items`, `align`):
    /// built once, for every gap that reads the frame.
    fn aligned(&mut self, record: &Record, at: NodeIndex, baseline: &crate::baseline::Baseline, frame: &crate::baseline::FrameItems) -> std::rc::Rc<Aligned> {
        let key = (Arc::as_ptr(record) as usize, at);
        if let Some((_, aligned)) = self.aligned.get(&key).filter(|(held, _)| Arc::ptr_eq(held, record)) {
            return std::rc::Rc::clone(aligned);
        }
        let framed = frame.items.iter().filter_map(|item| item.what.node()).collect();
        let mut steps = 0;
        let mut source = Vec::new();
        source_items(&mut self.nodes, at, &self.tree.source, baseline, &framed, &mut source, &mut steps);
        debug_assert!(source.windows(2).all(|pair| pair[0].end <= pair[1].start), "a frame's source items lie apart, in source order");
        let matched = align(&source, &frame.items, &mut steps);
        self.tree.work.gap_items(steps);
        let aligned = std::rc::Rc::new(Aligned { source, matched });
        self.aligned.insert(key, (Arc::clone(record), std::rc::Rc::clone(&aligned)));
        aligned
    }

    /// The entries of `side` of the node at `index`: the ones a write gave
    /// it, else the ones the assignment gives it (`assigned`, with its
    /// layout when `layout`).
    fn seated(&mut self, index: NodeIndex, side: TriviaSide, layout: bool) -> Vec<SideEntry<G::Trivia>> {
        let tree = self.tree;
        match tree.sides.get(index, side) {
            Some(written) => tree.store.answered(written).into_iter().map(SideEntry::Written).collect(),
            None => self.assigned(index, side, layout),
        }
    }

    /// The entries the assignment gives `side` of the node at `index`: each
    /// extra, `ERROR` and member, and when `layout` its layout: each run
    /// that deviates from the read-time options as its member
    /// (`deviation`), the layout members, and the depth members. A member
    /// the source fixes in place with its adjacency (a line continuation
    /// with whitespace beside it, `Table::adjacency`) is no layout: it is an
    /// entry of the source, as an `ERROR` is.
    fn assigned(&mut self, index: NodeIndex, side: TriviaSide, layout: bool) -> Vec<SideEntry<G::Trivia>> {
        let tree = self.tree;
        let Some(table) = tree.cover_side(&mut self.nodes, index, side) else { return Vec::new() };
        let assigned = table.side(index, side);
        if assigned.is_empty() {
            return Vec::new();
        }
        let ctx = tree.read_ctx();
        let entry = TriviaEntry::new;
        let depth = |count: i32| (0..count.unsigned_abs()).filter_map(move |_| ParsedTree::<G>::depth_member(count));
        assigned
            .iter()
            .filter(|assigned| layout || matches!(assigned, Assigned::Extra(_) | Assigned::Error(_) | Assigned::Member(_)))
            .flat_map(|assigned| -> Vec<SideEntry<G::Trivia>> {
                match *assigned {
                    Assigned::Extra(at) => self
                        .kid(at)
                        .and_then(|kid| {
                            let coord = ctx.coordinate_of(&kid);
                            let (kind, span) = (coord.kind?, coord.span);
                            Some(SideEntry::Source { entry: entry(SlotValue::Coord(coord)), kind, span, adjacent: None })
                        })
                        .into_iter()
                        .collect(),
                    Assigned::Error(at) => self
                        .kid(at)
                        .map(|kid| {
                            let adjacent = table.adjacency(at);
                            let text = TriviaText::of_source(kid.grammar, &tree.source, kid.span(), adjacent, None);
                            SideEntry::Source { entry: entry(SlotValue::Node(G::Trivia::from_text(text))), kind: kid.grammar, span: kid.span(), adjacent }
                        })
                        .into_iter()
                        .collect(),
                    Assigned::Layout { run, depth: count, .. } => {
                        let deviation = if layout { self.deviation(run) } else { None };
                        deviation.map(|member| SideEntry::Layout(entry(SlotValue::Node(member)))).into_iter().chain(depth(count)).collect()
                    }
                    Assigned::Member(at) => self
                        .kid(at)
                        .and_then(|kid| {
                            let adjacent = table.adjacency(at);
                            let member = entry(SlotValue::Node(G::Trivia::from_layout(TriviaText::of_source(kid.grammar, &tree.source, kid.span(), adjacent, None))?));
                            Some(if member.is_layout() { SideEntry::Layout(member) } else { SideEntry::Source { entry: member, kind: kid.grammar, span: kid.span(), adjacent } })
                        })
                        .into_iter()
                        .collect(),
                    Assigned::Depth(count) => depth(count).collect(),
                }
            })
            .filter(|entry| layout || !matches!(entry, SideEntry::Layout(_)))
            .collect()
    }

    /// What `SideLookup::leading_start` answers: the first byte of the source
    /// extras and `ERROR`s seated on the leading side of the node at `index`,
    /// the side's layout left unmeasured; none on a side a write gave it,
    /// whose entries a snapshot does not measure.
    fn leading_start(&mut self, index: NodeIndex) -> Option<u32> {
        self.seated(index, TriviaSide::Leading, false)
            .iter()
            .filter_map(|entry| match entry {
                SideEntry::Source { span, .. } => Some(span.start),
                SideEntry::Layout(_) | SideEntry::Written(_) => None,
            })
            .min()
    }

    /// The first and last child of the node at `index`, extras and `ERROR`s
    /// included (`SideLookup::end_children`).
    fn end_children(&mut self, index: NodeIndex) -> Option<[Kid; 2]> {
        self.kid(index)?;
        let children = self.nodes.kids(index);
        Some([*children.first()?, *children.last()?])
    }

    /// The sides a coordinate of the node at `index` renders between, as
    /// `entries` gives each node's, outermost first, each frame's leading,
    /// trailing and inner sides: the node's own, then a frame for each item
    /// a list at its start or its end passes the extras and `ERROR`s of that
    /// edge to (`Placement::edge_item`), holding that one side, as the item
    /// frames itself where the list is read as a node. The coordinate's bytes
    /// hold each item's.
    fn frame_levels(&mut self, index: NodeIndex, mut entries: impl FnMut(&mut Self, NodeIndex, TriviaSide) -> Vec<SideEntry<G::Trivia>>) -> Vec<[Vec<SideEntry<G::Trivia>>; 3]> {
        let mut levels = vec![[entries(self, index, TriviaSide::Leading), entries(self, index, TriviaSide::Trailing), entries(self, index, TriviaSide::Inner)]];
        for side in [TriviaSide::Leading, TriviaSide::Trailing] {
            let mut item = self.edge_item(index, side);
            while let Some(at) = item {
                let held = entries(self, at, side);
                levels.push(if side == TriviaSide::Leading { [held, Vec::new(), Vec::new()] } else { [Vec::new(), held, Vec::new()] });
                item = self.edge_item(at, side);
            }
        }
        levels
    }

    /// The item of a list at the node at `index`'s edge on `side` that the
    /// edge's extras and `ERROR`s pass to (`Placement::edge_item`).
    fn edge_item(&mut self, index: NodeIndex, side: TriviaSide) -> Option<NodeIndex> {
        let tree = self.tree;
        tree.with_trivia_source(&mut self.nodes, |source| tree.trivia.edge_item(source, index, side))
    }

    /// The sides a coordinate renders between, as the tree's table and
    /// writes give each node's (`frame_levels`, `side_entries`).
    fn side_levels(&mut self, coord: &NodeCoordinate) -> Vec<[Vec<SideEntry<G::Trivia>>; 3]> {
        let changed = coord.changed();
        self.frame_levels(coord.index, |lookups, at, side| lookups.side_entries(at, side, changed.on(side)))
    }

    /// The sides a coordinate renders between as the source has them,
    /// without their layout runs or any write (`frame_levels`, `assigned`).
    fn source_levels(&mut self, coord: &NodeCoordinate) -> Vec<[Vec<SideEntry<G::Trivia>>; 3]> {
        self.frame_levels(coord.index, |lookups, at, side| lookups.assigned(at, side, false))
    }

    /// What `SourceTable::framed_span` answers for a coordinate of the tree.
    fn framed_span(&mut self, coord: &NodeCoordinate) -> Span {
        let levels = self.side_levels(coord);
        let spans = |side: usize| {
            levels.iter().flat_map(move |level| &level[side]).filter_map(|entry| match entry {
                SideEntry::Source { span, .. } => Some(*span),
                SideEntry::Layout(_) | SideEntry::Written(_) => None,
            })
        };
        Span {
            start: spans(0).map(|span| span.start).min().map_or(coord.span.start, |start| start.min(coord.span.start)),
            end: spans(1).map(|span| span.end).max().map_or(coord.span.end, |end| end.max(coord.span.end)),
        }
    }

    /// Whether a write replaced a side of a node under the node at `index`
    /// or of its own `inner` (`ParsedTree::edited_within`).
    fn edited_within(&mut self, index: NodeIndex) -> bool {
        self.kid(index).is_some_and(|kid| self.tree.edited_in(index, index + kid.count, false))
    }

    /// What `SourceTable::kind_of` answers for a coordinate of the tree.
    fn kind_of(&mut self, coord: &NodeCoordinate) -> Option<KindId> {
        self.kid(coord.index).map(|kid| kid.grammar)
    }

    /// What `SourceTable::for_each_descendant` answers for a coordinate of
    /// the tree: each node of its subtree in preorder, below a node `visit`
    /// refuses none.
    fn for_each_descendant(&mut self, coord: &NodeCoordinate, visit: &mut dyn FnMut(KindId, &str) -> bool) {
        if self.kid(coord.index).is_none() {
            return;
        }
        let source = &self.tree.source;
        self.nodes.walk(coord.index, &mut |step, kid| {
            if step == Step::Leave {
                return Visit::Pass;
            }
            if visit(kid.grammar, source.get(kid.span().range()).unwrap_or("")) {
                Visit::Enter
            } else {
                Visit::Pass
            }
        });
    }

    /// The lines under the node at `index` that begin inside a token
    /// (`line_starts_inside_tokens`); `None` past the tree's last node.
    fn line_starts(&mut self, index: NodeIndex) -> Option<Vec<u32>> {
        self.kid(index)?;
        Some(line_starts_inside_tokens(&mut self.nodes, index, &self.tree.source))
    }

    /// What `SourceTable::last_list_child_kind` answers in the tree.
    fn last_list_child_kind(&mut self, span: Span, kind: KindId) -> Option<KindId> {
        last_list_child(&mut self.nodes, span, kind).map(|kid| kid.grammar)
    }

    /// Visits the levels at the edge on `side` of the node a coordinate of
    /// the tree names (`SourceTable::for_each_edge_level`).
    fn edge_levels(&mut self, coord: &NodeCoordinate, side: crate::options::Side, f: &mut dyn FnMut(crate::render::EdgeLevel)) {
        let Some(kid) = self.kid(coord.index) else { return };
        f(crate::render::EdgeLevel { stamp: coord.kind.unwrap_or(kid.grammar), grammar: kid.grammar, display: kid.display, field: None });
        if kid.span() != coord.span {
            return;
        }
        let ctx = self.tree.read_ctx();
        let mut holder = kid;
        while let Some(child) = edge_child(&mut self.nodes, &holder, side) {
            f(crate::render::EdgeLevel { stamp: ctx.stamped_kind(child.grammar, child.display), grammar: child.grammar, display: child.display, field: child.field });
            holder = child;
        }
    }

    /// The levels the node a coordinate of the tree names opens net of those
    /// it closes (`SourceTable::depth_move`), its node found only when the
    /// grammar has depth members.
    fn depth_move(&mut self, coord: &NodeCoordinate) -> i32 {
        let tree = self.tree;
        if !tree.grammar.surface_kinds().has_depth_members() {
            return 0;
        }
        let Some(kid) = self.kid(coord.index).filter(|kid| kid.span() == coord.span) else {
            return 0;
        };
        tree.depth_members(&mut self.nodes).between(coord.index, coord.index + kid.count)
    }

    /// The seat of the node a coordinate of the tree names through the
    /// wrappers it is (`SourceTable::seat_through`).
    fn seat_through(&mut self, coord: &NodeCoordinate, wrappers: &[Option<crate::options::SeatPath>], seat: &dyn Fn(KindId) -> Option<crate::types::SiteId>) -> Option<crate::types::SiteId> {
        let mut at = self.kid(coord.index)?;
        loop {
            let kids = self.nodes.kids(at.index);
            at = match (*wrappers.get(at.grammar.index())?)? {
                crate::options::SeatPath::Content => kids.iter().copied().find(|child| child.named && !child.extra)?,
                crate::options::SeatPath::Field(field) => kids.iter().copied().find(|child| child.field == Some(field))?,
            };
            if let Some(site) = seat(at.grammar) {
                return Some(site);
            }
        }
    }
}

/// One call's lookups in a tree as its sides and its source table: with its
/// layout (its layout runs, the layout its list slots store, and its
/// writes), or without it: the sides as its source has them, which a record
/// renders (`Lookups::recorded`). A lookup borrows the cell only while it
/// runs, and none runs inside another, so the cell is never borrowed twice;
/// a read it hands a cursor reads a copy of it, so the read's sides move
/// the lookups' own.
pub struct Seating<'t, G: EngineGrammar> {
    lookups: std::cell::RefCell<Lookups<'t, G>>,
    layout: bool,
}

impl<'t, G: EngineGrammar> Seating<'t, G> {
    /// The sides of `lookups`' tree with their layout and writes.
    fn with_layout(lookups: Lookups<'t, G>) -> Self {
        Self { lookups: std::cell::RefCell::new(lookups), layout: true }
    }

    /// The sides of `lookups`' tree as its source has them, without their
    /// layout or any write.
    fn without_layout(lookups: Lookups<'t, G>) -> Self {
        Self { lookups: std::cell::RefCell::new(lookups), layout: false }
    }

    /// The tree these lookups are in.
    fn tree(&self) -> &'t ParsedTree<G> {
        self.lookups.borrow().tree
    }

    /// The lookups, when their tree is tree `tree`.
    fn own(&self, tree: TreeId) -> Option<std::cell::RefMut<'_, Lookups<'t, G>>> {
        let lookups = self.lookups.borrow_mut();
        (lookups.tree.tree_id == tree).then_some(lookups)
    }

    /// The context a read of the tree seats each node's sides with from
    /// these lookups.
    #[must_use]
    pub fn ctx(&self) -> crate::read::ReadCtx<'_> {
        self.tree().read_ctx().with_sides(self)
    }

    /// A cursor on the node at `index`, created at the tree's root: a copy
    /// of the lookups' own, moved there from where it stood.
    #[must_use]
    pub fn cursor(&self, index: NodeIndex) -> tree_sitter::TreeCursor<'t> {
        self.lookups.borrow_mut().nodes.reader(index).clone()
    }
}

impl<G: EngineGrammar> crate::read::SideLookup for Seating<'_, G> {
    fn side(&self, index: NodeIndex, side: TriviaSide, edge_changed: bool) -> Box<dyn std::any::Any> {
        let mut lookups = self.lookups.borrow_mut();
        Box::new(if self.layout { lookups.side_entries(index, side, edge_changed) } else { lookups.assigned(index, side, false) })
    }

    fn slots(&self, index: NodeIndex) -> Vec<crate::layout::SlotLayout> {
        if self.layout { self.lookups.borrow_mut().slot_layouts(index) } else { Vec::new() }
    }

    fn end_children(&self, index: NodeIndex) -> Option<[Kid; 2]> {
        self.layout.then(|| self.lookups.borrow_mut().end_children(index)).flatten()
    }

    fn separator(&self, index: NodeIndex) -> Option<KindId> {
        self.layout.then(|| self.lookups.borrow_mut().separator_before(index)).flatten()
    }

    fn leading_start(&self, index: NodeIndex) -> Option<u32> {
        self.layout.then(|| self.lookups.borrow_mut().leading_start(index)).flatten()
    }
}

/// The frames of `levels` that hold any side, outermost first.
fn framed<T: crate::trivia::TriviaItem>(levels: impl IntoIterator<Item = [Vec<SideEntry<T>>; 3]>) -> Vec<Box<dyn crate::trivia::FramedTrivia>> {
    levels
        .into_iter()
        .filter_map(|[leading, trailing, inner]| {
            let side = |entries: Vec<SideEntry<T>>| (!entries.is_empty()).then(|| entries.into_iter().map(SideEntry::into_entry).collect());
            let trivia = crate::trivia::NodeTrivia { leading: side(leading), trailing: side(trailing), inner: side(inner) };
            (trivia.leading.is_some() || trivia.trailing.is_some() || trivia.inner.is_some()).then(|| Box::new(trivia) as Box<dyn crate::trivia::FramedTrivia>)
        })
        .collect()
}

/// The frames of `levels`, the first the node's own (`framed`).
fn frames_of<T: crate::trivia::TriviaItem>(levels: Vec<[Vec<SideEntry<T>>; 3]>) -> crate::trivia::Frames {
    let mut levels = levels.into_iter();
    crate::trivia::Frames { own: framed(levels.next()).pop(), items: framed(levels) }
}

/// One tree as a render's source table: its own coordinates resolve, any
/// other tree's do not.
impl<G: EngineGrammar> SourceTable for Seating<'_, G> {
    fn source_of(&self, tree_id: TreeId) -> Option<&Arc<str>> {
        let tree = self.tree();
        (tree_id == tree.tree_id).then_some(&tree.source)
    }

    fn breaks_spelled_lf(&self, tree_id: TreeId) -> bool {
        let tree = self.tree();
        tree_id == tree.tree_id && tree.breaks_lf
    }

    fn kind_of(&self, coord: &NodeCoordinate) -> Option<KindId> {
        self.own(coord.tree)?.kind_of(coord)
    }

    fn for_each_descendant(&self, coord: &NodeCoordinate, visit: &mut dyn FnMut(KindId, &str) -> bool) {
        if let Some(mut lookups) = self.own(coord.tree) {
            lookups.for_each_descendant(coord, visit);
        }
    }

    fn line_starts_inside_tokens(&self, coord: &NodeCoordinate) -> Vec<u32> {
        self.own(coord.tree).and_then(|mut lookups| lookups.line_starts(coord.index)).unwrap_or_default()
    }

    fn last_list_child_kind(&self, tree: TreeId, span: Span, kind: KindId) -> Option<KindId> {
        self.own(tree)?.last_list_child_kind(span, kind)
    }

    fn slot_layouts(&self, coord: &NodeCoordinate) -> Vec<crate::layout::SlotLayout> {
        let lookups = self.own(coord.tree).filter(|_| self.layout);
        lookups.map_or_else(Vec::new, |mut lookups| lookups.slot_layouts(coord.index))
    }

    fn separator_before(&self, coord: &NodeCoordinate) -> Option<KindId> {
        self.own(coord.tree).filter(|_| self.layout)?.separator_before(coord.index)
    }

    fn sides(&self, coord: &NodeCoordinate) -> Option<Box<dyn crate::trivia::FramedTrivia>> {
        let mut lookups = self.own(coord.tree)?;
        let levels = if self.layout { lookups.side_levels(coord) } else { lookups.source_levels(coord) };
        framed(levels.into_iter().take(1)).pop()
    }

    fn frames(&self, coord: &NodeCoordinate) -> crate::trivia::Frames {
        self.own(coord.tree).map_or_else(crate::trivia::Frames::default, |mut lookups| frames_of(if self.layout { lookups.side_levels(coord) } else { lookups.source_levels(coord) }))
    }

    fn framed_span(&self, coord: &NodeCoordinate) -> Span {
        self.own(coord.tree).map_or(coord.span, |mut lookups| lookups.framed_span(coord))
    }

    fn edited_within(&self, coord: &NodeCoordinate) -> bool {
        self.layout && self.own(coord.tree).is_some_and(|mut lookups| lookups.edited_within(coord.index))
    }

    fn renders_as_source(&self, coord: &NodeCoordinate) -> bool {
        self.layout && self.own(coord.tree).is_some_and(|mut lookups| !lookups.edited_within(coord.index))
    }

    fn seat_through(&self, coord: &NodeCoordinate, wrappers: &[Option<crate::options::SeatPath>], seat: &dyn Fn(KindId) -> Option<crate::types::SiteId>) -> Option<crate::types::SiteId> {
        self.own(coord.tree)?.seat_through(coord, wrappers, seat)
    }

    fn read_node(&self, tree: TreeId, index: NodeIndex, read: &mut dyn FnMut(&mut tree_sitter::TreeCursor<'_>, &mut crate::read::ReadCtx<'_>)) -> bool {
        let cursor = self.own(tree).and_then(|mut lookups| {
            lookups.kid(index)?;
            Some(lookups.nodes.reader(index).clone())
        });
        let Some(mut cursor) = cursor else { return false };
        read(&mut cursor, &mut self.ctx());
        true
    }

    fn for_each_edge_level(&self, coord: &NodeCoordinate, side: crate::options::Side, f: &mut dyn FnMut(crate::render::EdgeLevel)) {
        if let Some(mut lookups) = self.own(coord.tree) {
            lookups.edge_levels(coord, side, f);
        }
    }

    fn depth_move(&self, coord: &NodeCoordinate) -> i32 {
        self.own(coord.tree).map_or(0, |mut lookups| lookups.depth_move(coord))
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
    /// The sides a write set on any node this engine renders, shared with
    /// every tree it parses.
    written: TriviaStore<G::Trivia>,
}

impl<G: EngineGrammar> Engine<G> {
    pub fn new(grammar: G, options: ResolvedOptions) -> Result<Self, String> {
        Self::with_store(grammar, options, TriviaStore::with_kind_bits(G::KIND_BITS))
    }

    /// An engine whose store of written sides, and the built arena it
    /// holds, is `written`.
    ///
    /// # Errors
    ///
    /// What the grammar's parser configuration refuses.
    pub fn with_store(grammar: G, options: ResolvedOptions, written: TriviaStore<G::Trivia>) -> Result<Self, String> {
        let mut parser = tree_sitter::Parser::new();
        grammar.configure_parser(&mut parser)?;
        Ok(Self { grammar, parser, options, written })
    }

    pub fn options(&self) -> &ResolvedOptions {
        &self.options
    }

    /// The grammar the engine parses and renders with.
    pub fn grammar(&self) -> G {
        self.grammar
    }

    /// The store of the sides a write set, shared with every tree the
    /// engine parses.
    pub fn written(&self) -> &TriviaStore<G::Trivia> {
        &self.written
    }

    pub fn render_module_hash(&self) -> &'static str {
        self.grammar.render_module_hash()
    }

    /// Parse source and return an owned `ParsedTree` under the id `claim` is
    /// on (`claim_tree_id`, `claim_tree_id_from`).
    ///
    /// # Errors
    ///
    /// The parser's failure.
    pub fn parse(&mut self, source: &str, claim: TreeClaim) -> Result<ParsedTree<G>, String> {
        let tree_id = claim.into_id();
        let tree = self.parser.parse(source, None).ok_or_else(|| {
            let snippet: String = source.chars().take(80).collect();
            format!("parse failed (source: {snippet:?})")
        })?;
        let (whitespace, _) = self.grammar.whitespace();
        let root = crate::read::grammar_id(&tree.root_node());
        let inferred = crate::options::InferredOptions::infer(source, root, &self.options, self.grammar.option_tables(), whitespace);
        let indent = inferred.indent.as_deref().unwrap_or(&self.options.indent);
        let spaces = |unit: &str| u32::try_from(unit.chars().filter(|&c| c == ' ').count()).unwrap_or(u32::MAX);
        let level_width = [spaces(indent), spaces(&self.options.indent), 1].into_iter().find(|&width| width > 0).unwrap_or(1);
        let read_options = inferred.over(&self.options);
        Ok(ParsedTree {
            grammar: self.grammar,
            tree,
            source: Arc::from(source),
            inferred,
            breaks_lf: !source.contains('\r'),
            tree_id,
            lines: std::sync::OnceLock::new(),
            trivia: Placement::new(self.grammar.surface_kinds(), level_width),
            depth_members: std::sync::OnceLock::new(),
            read_options,
            records: std::sync::Mutex::default(),
            slots: std::sync::Mutex::default(),
            items: std::sync::Mutex::default(),
            cached: std::sync::atomic::AtomicUsize::new(0),
            grown: std::sync::atomic::AtomicBool::new(true),
            work: crate::layout::LayoutWorkCounter::default(),
            store: self.written.clone(),
            sides: crate::trivia_store::SideRows::default(),
            #[cfg(feature = "arena")]
            arena: std::sync::OnceLock::new(),
        })
    }

    pub fn find_and_read(&mut self, _source: String, _pattern: String) -> Result<String, String> {
        Err("find_and_read not yet implemented — ast-grep-core integration pending".to_string())
    }

}

/// `trees`, borrowed to change: refused by name while a read holds them,
/// so a call that changes a live tree inside a read of the live trees fails
/// as an error instead of meeting that read.
///
/// # Errors
///
/// While a read of `trees` is in progress.
pub fn change_trees<T>(trees: &std::cell::RefCell<T>) -> Result<std::cell::RefMut<'_, T>, String> {
    trees.try_borrow_mut().map_err(|_| "a live tree can't change while the live trees are being read".to_owned())
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

/// A frame's source items and, for each, the item of what the frame wrote
/// it meets (`Lookups::aligned`).
struct Aligned {
    source: Vec<SourceItem>,
    matched: Vec<Option<usize>>,
}

/// The items of the node at `index` in source order, for the frame a
/// render wrote for it: each child that rendered in a frame of its own or
/// as a slice of the frame by its index, each token by its text unless it
/// is empty or whitespace, which a render writes as layout, and the
/// children of any other child in its place. Extras and `ERROR`s are
/// trivia, no item.
fn source_items(nodes: &mut dyn Nodes<'_>, index: NodeIndex, source: &str, baseline: &crate::baseline::Baseline, framed: &std::collections::HashSet<NodeIndex, crate::heap::IndexState>, out: &mut Vec<SourceItem>, steps: &mut u64) {
    use crate::baseline::Written;
    nodes.walk(index, &mut |step, kid| {
        if step == Step::Leave || kid.index == index {
            return if step == Step::Leave { Visit::Pass } else { Visit::Enter };
        }
        *steps += 1;
        if kid.entry() {
            Visit::Pass
        } else if baseline.frame(kid.index).is_some() || framed.contains(&kid.index) {
            out.push(SourceItem { what: Written::Node(kid.index), start: kid.start, end: kid.end });
            Visit::Pass
        } else if kid.count == 1 {
            let text = &source[kid.span().range()];
            if !text.trim().is_empty() {
                out.push(SourceItem { what: Written::text(text), start: kid.start, end: kid.end });
            }
            Visit::Pass
        } else {
            Visit::Enter
        }
    });
}

/// Which written item each source item is, in order: a node matches the
/// next node of its index; a token matches the next text short of a node
/// that the token and the tokens right after it spell exactly, all of them
/// matching that text; an item matching none was not written. A written
/// node no source item names (a sliced comment) is passed over.
fn align(items: &[SourceItem], written: &[crate::baseline::Item], steps: &mut u64) -> Vec<Option<usize>> {
    use crate::baseline::Written;
    let named: std::collections::HashSet<NodeIndex, crate::heap::IndexState> = items.iter().filter_map(|item| item.what.node()).collect();
    let mut positions: HashMap<NodeIndex, Vec<usize>, crate::heap::IndexState> = HashMap::default();
    for (at, item) in written.iter().enumerate() {
        if let Some(index) = item.what.node() {
            positions.entry(index).or_default().push(at);
        }
    }
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
        *steps += 1;
        let rest = written.get(at..).unwrap_or_default();
        let found = match items[i].what {
            Written::Node(index) => positions.get(&index).and_then(|found| found.get(found.partition_point(|&position| position < at))).map(|&found| (found - at, 1)),
            Written::Text(_) => rest.iter().inspect(|_| *steps += 1).take_while(|w| w.what.node().is_none_or(|index| !named.contains(&index))).enumerate().find_map(|(found, w)| match &w.what {
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

/// The next level of the edge chain at the node `holder`'s edge on `side`
/// (`SourceTable::for_each_edge_level`): its first child (before) or last
/// (after), when that child starts or ends where the node does.
fn edge_child(nodes: &mut dyn Nodes<'_>, holder: &Kid, side: crate::options::Side) -> Option<Kid> {
    let children = nodes.kids(holder.index);
    let child = match side {
        crate::options::Side::Before => children.first(),
        crate::options::Side::After => children.last(),
    };
    child.copied().filter(|child| match side {
        crate::options::Side::Before => child.start == holder.start,
        crate::options::Side::After => child.end == holder.end,
    })
}

/// The live trees one call renders through, each tree a lookup hands out
/// noted, so the call can report the trees it read (`ReadTrees::read`): a
/// tree grows during a render only through a lookup of it. Each tree read
/// keeps one `Seating` for the call, so its lookups move one cursor.
pub struct ReadTrees<'t, G: EngineGrammar, H = crate::heap::IndexState> {
    trees: &'t HashMap<crate::types::TreeId, ParsedTree<G>, H>,
    read: std::cell::RefCell<Vec<(TreeId, std::rc::Rc<Seating<'t, G>>)>>,
}

impl<'t, G: EngineGrammar, H: std::hash::BuildHasher> ReadTrees<'t, G, H> {
    /// The live `trees`, none read yet.
    #[must_use]
    pub fn new(trees: &'t HashMap<crate::types::TreeId, ParsedTree<G>, H>) -> Self {
        Self { trees, read: std::cell::RefCell::default() }
    }

    /// The live tree `tree`, noted as read, or `None` when it is not live.
    #[must_use]
    pub fn get(&self, tree: crate::types::TreeId) -> Option<&'t ParsedTree<G>> {
        self.seating(tree).map(|seating| seating.tree())
    }

    /// The call's lookups in the live tree `tree`, made on its first read
    /// and noted, or `None` when it is not live.
    fn seating(&self, tree: TreeId) -> Option<std::rc::Rc<Seating<'t, G>>> {
        let parsed = self.trees.get(&tree)?;
        let mut read = self.read.borrow_mut();
        if let Some((_, seating)) = read.iter().find(|(id, _)| *id == tree) {
            return Some(std::rc::Rc::clone(seating));
        }
        let seating = std::rc::Rc::new(parsed.seating());
        read.push((tree, std::rc::Rc::clone(&seating)));
        Some(seating)
    }

    /// Each live tree a lookup handed out, once, in the order first read.
    #[must_use]
    pub fn read(self) -> Vec<crate::types::TreeId> {
        self.read.into_inner().into_iter().map(|(tree, _)| tree).collect()
    }
}

/// The live trees as the render context's source table: a handle's tag names
/// the tree, and the tree owns the source its spans index into.
impl<G: EngineGrammar, H: std::hash::BuildHasher> SourceTable for ReadTrees<'_, G, H> {
    fn source_of(&self, tree_id: crate::types::TreeId) -> Option<&Arc<str>> {
        Some(&self.get(tree_id)?.source)
    }

    fn breaks_spelled_lf(&self, tree_id: crate::types::TreeId) -> bool {
        self.get(tree_id).is_some_and(|tree| tree.breaks_lf)
    }

    fn kind_of(&self, coord: &NodeCoordinate) -> Option<KindId> {
        self.seating(coord.tree)?.kind_of(coord)
    }

    fn for_each_descendant(&self, coord: &NodeCoordinate, visit: &mut dyn FnMut(KindId, &str) -> bool) {
        if let Some(seating) = self.seating(coord.tree) {
            seating.for_each_descendant(coord, visit);
        }
    }

    fn line_starts_inside_tokens(&self, coord: &NodeCoordinate) -> Vec<u32> {
        self.seating(coord.tree).map_or_else(Vec::new, |seating| seating.line_starts_inside_tokens(coord))
    }

    fn last_list_child_kind(&self, tree: crate::types::TreeId, span: crate::types::Span, kind: KindId) -> Option<KindId> {
        self.seating(tree)?.last_list_child_kind(tree, span, kind)
    }

    fn sides(&self, coord: &NodeCoordinate) -> Option<Box<dyn crate::trivia::FramedTrivia>> {
        self.seating(coord.tree)?.sides(coord)
    }

    fn frames(&self, coord: &NodeCoordinate) -> crate::trivia::Frames {
        self.seating(coord.tree).map_or_else(crate::trivia::Frames::default, |seating| seating.frames(coord))
    }

    fn slot_layouts(&self, coord: &NodeCoordinate) -> Vec<crate::layout::SlotLayout> {
        self.seating(coord.tree).map_or_else(Vec::new, |seating| seating.slot_layouts(coord))
    }

    fn separator_before(&self, coord: &NodeCoordinate) -> Option<KindId> {
        self.seating(coord.tree)?.separator_before(coord)
    }

    fn framed_span(&self, coord: &NodeCoordinate) -> Span {
        self.seating(coord.tree).map_or(coord.span, |seating| seating.framed_span(coord))
    }

    fn edited_within(&self, coord: &NodeCoordinate) -> bool {
        self.seating(coord.tree).is_some_and(|seating| seating.edited_within(coord))
    }

    fn renders_as_source(&self, coord: &NodeCoordinate) -> bool {
        self.seating(coord.tree).is_some_and(|seating| seating.renders_as_source(coord))
    }

    fn seat_through(&self, coord: &NodeCoordinate, wrappers: &[Option<crate::options::SeatPath>], seat: &dyn Fn(KindId) -> Option<crate::types::SiteId>) -> Option<crate::types::SiteId> {
        self.seating(coord.tree)?.seat_through(coord, wrappers, seat)
    }

    fn read_node(&self, tree: TreeId, index: NodeIndex, read: &mut dyn FnMut(&mut tree_sitter::TreeCursor<'_>, &mut crate::read::ReadCtx<'_>)) -> bool {
        self.seating(tree).is_some_and(|seating| seating.read_node(tree, index, read))
    }

    fn for_each_edge_level(&self, coord: &NodeCoordinate, side: crate::options::Side, f: &mut dyn FnMut(crate::render::EdgeLevel)) {
        if let Some(seating) = self.seating(coord.tree) {
            seating.for_each_edge_level(coord, side, f);
        }
    }

    fn depth_move(&self, coord: &NodeCoordinate) -> i32 {
        self.seating(coord.tree).map_or(0, |seating| seating.depth_move(coord))
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
    fn function_item_route(child: &crate::read::Kid) -> Result<crate::read::Route, crate::read::ReadError> {
        let language: tree_sitter::Language = tree_sitter_rust::LANGUAGE.into();
        let field = child.field.and_then(|field| crate::read::field_name(&language, field));
        Ok(match field {
            _ if child.entry() => crate::read::Route::Trivia,
            Some("name") => crate::read::Route::Slot { slot: crate::types::SlotId(0), scalar: false },
            Some("return_type") => crate::read::Route::Slot { slot: crate::types::SlotId(1), scalar: false },
            _ => crate::read::Route::Layout,
        })
    }

    /// A test block's or declaration list's one slot: each `function_item`.
    #[allow(clippy::unnecessary_wraps, reason = "a `Router::Children` route, whose type returns a `Result`")]
    fn item_route(child: &crate::read::Kid) -> Result<crate::read::Route, crate::read::ReadError> {
        let language: tree_sitter::Language = tree_sitter_rust::LANGUAGE.into();
        Ok(match crate::read::kind_name(&language, child.grammar) {
            _ if child.entry() => crate::read::Route::Trivia,
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
        const KIND_BITS: u32 = 9;

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

        fn unit_id(self, cursor: &mut tree_sitter::TreeCursor<'_>) -> Option<KindId> {
            let language: tree_sitter::Language = tree_sitter_rust::LANGUAGE.into();
            (cursor.node().kind() == "primitive_type").then(|| crate::read::kind_named(&language, "u8", false))
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
    crate::grammar_nodes!(TestTrivia; TestTrivia);

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

    impl HeapBytes for TestTrivia {
        fn heap_bytes(&self) -> usize {
            match self {
                TestTrivia::Text(text) => text.heap_bytes(),
                TestTrivia::Newline => 0,
            }
        }
    }

    impl crate::trivia::TriviaSeam for TestTrivia {
        fn seam_gap(&self) -> Option<(crate::layout_kinds::LayoutKinds, Option<&str>)> {
            matches!(self, TestTrivia::Newline).then_some((crate::layout_kinds::LayoutKinds::NEWLINE, None))
        }
    }

    impl crate::prepare::Prepare for TestTrivia {
        fn prepare(&mut self, _: &crate::prepare::RenderContext<'_>) -> Result<(), crate::render::RenderError> {
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
        let work = crate::layout::LayoutWorkCounter::default();
        assert_eq!(line_starts_inside_tokens(&mut TreeNodes::new(&tree, source, &work), NodeIndex::ROOT, source), vec![crate::types::narrow(b), crate::types::narrow(y), crate::types::narrow(close)]);
    }

    #[test]
    fn lines_between_tokens_start_outside_every_token() {
        let source = "fn f() {\n    g();\n    // c\n    h();\n}\n// d\nfn i() {}\n";
        let tree = rust_tree(source);
        let work = crate::layout::LayoutWorkCounter::default();
        assert_eq!(line_starts_inside_tokens(&mut TreeNodes::new(&tree, source, &work), NodeIndex::ROOT, source), Vec::<u32>::new());
    }

    const FNS: &str = "fn a() {}\nmod m { fn b() -> u8 { 0 } fn _c() {} }\nfn _d() { fn e() {} }\n";

    fn kind_id(name: &str) -> KindId {
        let language: tree_sitter::Language = tree_sitter_rust::LANGUAGE.into();
        crate::read::kind_named(&language, name, true)
    }

    /// A claim on the next id of the image's counter.
    fn claim() -> TreeClaim {
        claim_tree_id().expect("a claim")
    }

    fn parsed(source: &str) -> (ParsedTree<TestGrammar>, TreeHandle) {
        let mut engine = Engine::new(TestGrammar, ResolvedOptions::default()).expect("engine");
        let tree = engine.parse(source, claim()).expect("parse");
        let handle = encode_handle(tree.tree_id(), crate::types::NodeIndex(0));
        (tree, handle)
    }

    #[test]
    fn an_error_node_reads_as_the_bytes_its_coordinate_spans() {
        let (tree, _) = parsed("fn f() {} @@ fn g() {}");
        let index = (0..64).map(NodeIndex::new).find(|&i| node_at_index(tree.tree(), i).is_some_and(|node| node.is_error())).expect("the parse holds an ERROR");
        let error = tree.read_error(index).expect("an ERROR reads");
        let crate::read::Origin::Tree(at) = &error.at else { panic!("a live read names a coordinate") };
        assert_eq!((error.text.as_str(), at.span.start, at.span.end), ("@@", 10, 12));
        assert_eq!((error.kind, at.kind, at.tree), (Some(KindId(u16::MAX)), Some(KindId(u16::MAX)), tree.tree_id()));
        assert_eq!(tree.read_error(NodeIndex::ROOT), None);
        let inside = NodeIndex(index.0 + 1);
        assert!(node_at_index(tree.tree(), inside).is_some_and(|node| node.parent().is_some_and(|parent| parent.is_error())), "the ERROR holds a node");
        assert_eq!(tree.read_error(inside), Some(error.clone()), "a node an ERROR holds reads as its ERROR");
        assert_eq!(tree.snapshot_error(inside, None), tree.snapshot_error(index, None));
        let snapped = tree.snapshot_error(index, None).expect("an ERROR snapshots").expect("from its own start");
        let span = crate::points::PointSpan { start: crate::points::Point::ZERO, end: crate::points::Point { row: 0, column: 2 } };
        assert_eq!((snapped.text.as_str(), snapped.at), ("@@", crate::read::Origin::Snapshot(span)));
        assert_eq!(tree.snapshot_error(index, Some(11)), Some(Err(crate::read::ReadError::Unmeasured { index, byte: 10 })), "a holder after the ERROR is refused");
    }

    #[test]
    fn the_error_holding_a_node_is_the_outermost_error_among_its_ancestors() {
        for source in ["fn f() {} @@ fn g() {}", "fn f() { if @@ { while @@ { ] } } }", "@@ ( @@ [ @@ { @@", "@@ @@", "fn f() {}\nfn g() {}\n", ""] {
            let (tree, _) = parsed(source);
            for index in (0..crate::read::descendant_count(&tree.tree().root_node())).map(NodeIndex) {
                let mut outermost = None;
                let mut at = node_at_index(tree.tree(), index);
                while let Some(node) = at {
                    if node.is_error() {
                        outermost = Some(node.id());
                    }
                    at = node.parent();
                }
                let found = error_holding(&mut tree.nodes(), index);
                assert!(found.is_none_or(|error| error.error), "{source:?} at {index:?}: an ERROR");
                assert_eq!(found.and_then(|error| node_at_index(tree.tree(), error.index)).map(|node| node.id()), outermost, "{source:?} at {index:?}");
            }
        }
    }

    fn texts(tree: &ParsedTree<TestGrammar>, found: &[QueryItem]) -> Vec<String> {
        found
            .iter()
            .map(|item| match item {
                QueryItem::Node(coord) => tree.source()[coord.span.range()].lines().next().unwrap_or("").to_string(),
                QueryItem::Unit(kind) => format!("#{kind:?}"),
            })
            .collect()
    }

    /// The coordinates among a walk's items, its units left out.
    fn coordinates(found: &[QueryItem]) -> Vec<QueryCoordinate> {
        found.iter().filter_map(|item| if let QueryItem::Node(coord) = item { Some(*coord) } else { None }).collect()
    }

    fn walk(tree: &ParsedTree<TestGrammar>, root: TreeHandle, kinds: &[KindId], plan: Option<&Plan>, limit: u32) -> Vec<QueryItem> {
        let mut found = Vec::new();
        let mut resume: Option<Vec<ChildPosition>> = None;
        loop {
            let batch = tree.descendants(crate::query::Address::Own { handle: root }, kinds, plan, resume.as_deref(), limit, None).expect("walk");
            assert!(crate::types::narrow(batch.items.len()) <= limit);
            found.extend(batch.items);
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
        for coord in coordinates(&walk(&tree, root, &[], None, u32::MAX)) {
            let index = decode_handle(coord.handle).1;
            let node = node_at_index(&tree.tree, index).expect("the coordinate names a node");
            assert_eq!(Some(&index), expected.get(&node.id()));
            assert_eq!((Span::of(&node), crate::read::grammar_id(&node)), (coord.span, coord.kind));
        }
    }

    #[test]
    fn a_walk_selects_a_unit_node_by_the_id_its_read_stores() {
        let (tree, root) = parsed(FNS);
        let language: tree_sitter::Language = tree_sitter_rust::LANGUAGE.into();
        let member = crate::read::kind_named(&language, "u8", false);
        assert_eq!(walk(&tree, root, &[member], None, u32::MAX), [QueryItem::Unit(member)], "a unit is found as the id its read stores, as a slot read stores it");
        assert!(walk(&tree, root, &[], None, u32::MAX).contains(&QueryItem::Unit(member)), "an unfiltered walk yields the unit as its id too");
        assert!(walk(&tree, root, &[kind_id("primitive_type")], None, u32::MAX).is_empty(), "the read stores the member, not its enum kind");
    }

    #[test]
    fn a_nodes_siblings_are_those_beside_it_that_hold_sides() {
        let (tree, _) = parsed("fn f() {}\n// c\nfn g() {}\n");
        let f = index_of_kind(&tree, "function_item", 0);
        let g = index_of_kind(&tree, "function_item", 1);
        let item = crate::read::grammar_id(&node_at_index(&tree.tree, f).unwrap());
        let sibling = |start, end| Some(Sibling { start, end, kind: item });
        let past = NodeIndex(crate::read::descendant_count(&tree.tree.root_node()));
        assert_eq!(tree.siblings(&[f, g, past]), [Siblings { previous: None, next: sibling(15, 24) }, Siblings { previous: sibling(0, 9), next: None }, Siblings::default()], "the comment between f and g holds no sides");
    }

    #[test]
    fn a_walk_from_a_deep_start_hands_out_root_indexes() {
        let (tree, root) = parsed(FNS);
        let expected = indexes(&tree.tree);
        let module = tree.descendants(Address::Own { handle: root }, &[kind_id("mod_item")], None, None, 1, None).expect("walk");
        let start = Address::Own { handle: coordinates(&module.items)[0].handle };
        let inner = tree.descendants(start, &[kind_id("function_item")], None, None, 16, None).expect("walk");
        assert_eq!(inner.items.len(), 2, "fn b and fn _c");
        for coord in &coordinates(&inner.items) {
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
        texts(tree, &batch.items)
    }

    #[test]
    fn a_walk_starts_from_a_coordinate_address() {
        let (tree, root) = parsed(FNS);
        let fns = [kind_id("function_item")];
        let module = coordinates(&walk(&tree, root, &[kind_id("mod_item")], None, u32::MAX)).remove(0);
        assert_eq!(walk_from(&tree, crate::query::Address::Own { handle: module.handle }, &fns), ["fn b() -> u8 { 0 }", "fn _c() {}"]);
    }

    #[test]
    fn a_plan_holds_over_a_list_of_addresses_in_order() {
        let (tree, root) = parsed(FNS);
        let found = coordinates(&walk(&tree, root, &[kind_id("function_item")], None, u32::MAX));
        let addresses: Vec<crate::query::Address> = found.iter().map(|coord| crate::query::Address::Own { handle: coord.handle }).collect();
        let private = plan(&format!(r#"{{ "op": "match", {}, "pattern": "^_" }}"#, slots(&[("function_item", 0)])));
        assert_eq!(tree.plan_holds(&addresses, &private).expect("holds"), [false, false, true, true, false]);
        let elsewhere = crate::query::Address::Own { handle: encode_handle(crate::types::TreeId(tree.tree_id().0 + 1), crate::types::NodeIndex(0)) };
        assert!(tree.plan_holds(&[elsewhere], &private).is_err());
        let past_end = crate::query::Address::Own { handle: encode_handle(decode_handle(root).0, NodeIndex(u32::MAX >> 1)) };
        assert!(tree.plan_holds(&[past_end], &private).is_err());
        assert!(tree.plan_holds(&[addresses[0], past_end], &private).is_err());
    }

    #[test]
    fn a_depth_limit_stops_the_walk_below_it() {
        let (tree, root) = parsed(FNS);
        let children = tree.descendants(crate::query::Address::Own { handle: root }, &[], None, None, u32::MAX, Some(1)).expect("walk");
        assert_eq!(texts(&tree, &children.items), ["fn a() {}", "mod m { fn b() -> u8 { 0 } fn _c() {} }", "fn _d() { fn e() {} }"]);
        let mut resumed = Vec::new();
        let mut resume: Option<Vec<ChildPosition>> = None;
        loop {
            let batch = tree.descendants(crate::query::Address::Own { handle: root }, &[], None, resume.as_deref(), 1, Some(1)).expect("walk");
            resumed.extend(batch.items);
            match batch.resume {
                Some(path) => resume = Some(path),
                None => break,
            }
        }
        assert_eq!(texts(&tree, &resumed), texts(&tree, &children.items));
    }

    #[test]
    fn an_extra_and_its_interior_are_never_descendants() {
        let (tree, root) = parsed("/// doc\nfn a() {}\n");
        let kinds: Vec<KindId> = coordinates(&walk(&tree, root, &[], None, u32::MAX)).iter().map(|coord| coord.kind).collect();
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
        let Some(SlotValue::Coord(coord)) = leading[0].value() else { panic!("an extra reads as its coordinate: {leading:?}") };
        assert_eq!((coord.tree, coord.index, coord.span.start, coord.span.end), (tree.tree_id(), comment, 0, 4));
        let newline = TriviaEntry::new(SlotValue::Node(TestTrivia::Newline));
        assert_eq!(leading[1..], *std::slice::from_ref(&newline));
        assert_eq!(tree.trivia_side(f, TriviaSide::Trailing), []);
    }

    #[test]
    fn a_structure_only_read_records_no_region_and_a_side_read_records_its_runs_region() {
        let (tree, root) = parsed("fn f() {\n    x;\n}\nfn g() {}\n");
        tree.placed_trivia();
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
        assert!(matches!(trailing.first().and_then(TriviaEntry::value), Some(SlotValue::Coord(_))), "{trailing:?}");
    }

    #[test]
    fn a_changed_edge_drops_the_layout_runs_between_the_side_and_its_neighbour() {
        let (tree, _) = parsed("mod m {\n    // c\n    fn f() {}\n}\n");
        let f = index_of_kind(&tree, "function_item", 0);
        let runs = |side, changed| tree.side_entries(f, side, changed).into_iter().map(|entry| SideEntry::into_entry(entry).value().cloned()).collect::<Vec<_>>();
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
        let text = TriviaText { kind: KindId(u16::MAX), text: "@@".to_owned(), span: None, before: Some(" ".to_owned()), after: Some(" ".to_owned()), bytes: Some(crate::types::Span { start: 10, end: 12 }) };
        assert!(sides.contains(&TriviaEntry::new(SlotValue::Node(TestTrivia::Text(text)))), "{sides:?}");
    }

    #[test]
    fn a_written_side_replaces_the_assigned_one_and_marks_its_ancestors_edited() {
        let (mut tree, _) = parsed("fn f() { a(); }\nfn g() {}\n");
        let f = index_of_kind(&tree, "function_item", 0);
        let g = index_of_kind(&tree, "function_item", 1);
        let a = index_of_kind(&tree, "expression_statement", 0);
        let written = vec![TriviaEntry::new(SlotValue::Node(TestTrivia::Text(TriviaText { kind: KindId(1), text: "// w".to_owned(), span: None, before: None, after: None, bytes: None })))];
        tree.write_trivia_side(a, TriviaSide::Leading, written.clone()).expect("a side write");
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
        tree.write_trivia_side(block, TriviaSide::Inner, Vec::new()).expect("a side write");
        assert!(tree.edited_within(block, false));
    }

    #[test]
    fn a_written_side_shadows_the_assigned_one_and_the_source_s_own_view_still_reads_the_source() {
        for read_first in [true, false] {
            let (mut tree, _) = parsed("// c\nfn f() {}\n");
            let f = index_of_kind(&tree, "function_item", 0);
            let comment = index_of_kind(&tree, "line_comment", 0);
            if read_first {
                assert_eq!(tree.trivia_side(f, TriviaSide::Leading).len(), 2, "the comment and its line break");
            }
            let note = TriviaEntry::Value(SlotValue::Node(TestTrivia::Text(TriviaText::of(KindId(3), "// a note"))));
            tree.write_trivia_side(f, TriviaSide::Leading, vec![note.clone()]).expect("a side write");
            assert_eq!(tree.trivia_side(f, TriviaSide::Leading), [note], "the side reads the write alone");
            let source: Vec<TriviaEntry<TestTrivia>> = tree.lookups().assigned(f, TriviaSide::Leading, false).into_iter().map(SideEntry::into_entry).collect();
            let [entry] = source.as_slice() else { panic!("the source's own view reads the comment alone: {source:?}") };
            assert!(matches!(entry.value(), Some(SlotValue::Coord(coord)) if coord.index == comment), "the comment: {entry:?}");
        }
    }

    #[test]
    fn a_tree_s_trivia_placement_counts_what_a_walk_of_it_finds_as_its_layout_owners_are_placed() {
        let (tree, _) = parsed("// a\nfn f() {\n    let v = [\n        1,\n            2,\n    ];\n    g()\n        .h();\n}\nmod m { fn b() -> u8 { 0 } }\n");
        assert_eq!(tree.trivia.heap_bytes(), tree.trivia.walked_bytes(), "nothing placed");
        let _ = tree.trivia_side(index_of_kind(&tree, "function_item", 0), TriviaSide::Leading);
        let _ = tree.trivia_side(index_of_kind(&tree, "block", 0), TriviaSide::Inner);
        assert!(tree.trivia.walked_bytes() > 0, "the reads placed their layout owners");
        assert_eq!(tree.trivia.heap_bytes(), tree.trivia.walked_bytes(), "some layout owners placed");
        tree.placed_trivia();
        assert_eq!(tree.trivia.heap_bytes(), tree.trivia.walked_bytes(), "every layout owner placed");
    }

    #[test]
    fn an_unedited_tree_s_edit_checks_walk_none_of_the_sides_its_reads_placed() {
        let (tree, _) = parsed("mod m {\n    // c\n    fn f() { a(); }\n}\nfn g() {}\n");
        let count = crate::read::descendant_count(&tree.tree().root_node());
        for index in (0..count).map(NodeIndex::new) {
            for side in [TriviaSide::Leading, TriviaSide::Trailing, TriviaSide::Inner] {
                let _ = tree.trivia_side(index, side);
            }
        }
        let store = tree.store().clone();
        assert!(tree.trivia.tables().next().is_some(), "the reads placed the source's sides");
        let coordinates: Vec<NodeCoordinate> = (0..count).map(|at| coordinate(&tree, NodeIndex::new(at))).collect();
        let walked = store.edit_walks();
        let trees = table(tree);
        let sources = ReadTrees::new(&trees);
        for at in &coordinates {
            assert!(sources.renders_as_source(at), "nothing was written under {at:?}");
        }
        assert_eq!(store.edit_walks(), walked, "no check walked an assigned row");
    }

    #[test]
    fn each_tree_keeps_the_sides_written_to_it_and_takes_them_with_it() {
        let mut engine = Engine::new(TestGrammar, ResolvedOptions::default()).expect("engine");
        let mut first = engine.parse("fn f() {}\n", claim()).expect("parse");
        let mut second = engine.parse("fn f() {}\n", claim()).expect("parse");
        let f = index_of_kind(&first, "function_item", 0);
        first.write_trivia_side(f, TriviaSide::Leading, Vec::new()).expect("a side write");
        second.write_trivia_side(f, TriviaSide::Trailing, Vec::new()).expect("a side write");
        assert!(first.edited_within(NodeIndex::ROOT, false));
        assert_eq!(second.trivia_side(f, TriviaSide::Leading), first.trivia_side(f, TriviaSide::Trailing), "each tree reads its own writes");
        assert_eq!((first.sides.len(), second.sides.len(), engine.written.len()), (1, 1, 0), "each tree holds its own writes, and the engine's store none");
        drop(first);
        assert!(second.edited_within(NodeIndex::ROOT, false));
    }

    #[test]
    fn a_tree_counts_what_its_read_caches_and_its_written_rows_hold() {
        let mut engine = Engine::new(TestGrammar, ResolvedOptions::default()).expect("engine");
        let mut tree = engine.parse("fn f() {}\n", claim()).expect("parse");
        assert!(tree.take_grown(), "a new tree has grown");
        assert!(!tree.take_grown(), "until its growth is taken");
        let parsed = tree.native_bytes();
        assert!(parsed >= std::mem::size_of::<ParsedTree<TestGrammar>>() + "fn f() {}\n".len(), "the tree and its source");
        let f = index_of_kind(&tree, "function_item", 0);
        let _ = tree.slot_layouts(f);
        assert!(tree.take_grown(), "a read that fills a cache marks its tree grown");
        let read = tree.native_bytes();
        assert!(read > parsed, "the read's caches add to the count");
        assert_eq!(tree.cached.load(std::sync::atomic::Ordering::Relaxed), tree.cached_by_walk(), "the count kept at each insert is what a walk of the caches finds");
        let note = TriviaEntry::Value(SlotValue::Node(TestTrivia::Text(TriviaText::of(KindId(3), "// a note"))));
        tree.write_trivia_side(f, TriviaSide::Leading, vec![note]).expect("a side write");
        assert!(tree.take_grown(), "a write to a row marks its tree grown");
        let row = std::mem::size_of::<((NodeIndex, TriviaSide), Vec<TriviaEntry<TestTrivia>>)>();
        let entry = std::mem::size_of::<TriviaEntry<TestTrivia>>() + "// a note".len();
        assert_eq!(tree.native_bytes(), read + row + entry, "the row and its entry");
        tree.write_trivia_side(f, TriviaSide::Leading, Vec::new()).expect("a side write");
        assert_eq!(tree.native_bytes(), read + row, "a write replaces what the row held");
    }

    #[cfg(feature = "arena")]
    #[test]
    fn a_tree_that_never_made_its_arena_answers_that_its_sides_held_a_built_record() {
        let mut engine = Engine::new(TestGrammar, ResolvedOptions::default()).expect("engine");
        let mut tree = engine.parse("fn f() {}\n", claim()).expect("parse");
        assert!(!tree.release_sides(), "a tree with no sides");
        let record = crate::trivia::RecordEntry { record: crate::trivia::BuiltEntry { kind: KindId(1), at: crate::arena::Address(5) }, store: None };
        tree.sides.insert(NodeIndex::ROOT, TriviaSide::Leading, vec![TriviaEntry::Record(record)]);
        assert!(tree.release_sides(), "its side held a built record");
        assert!(!tree.made_arena(), "holding a record made no arena");
        assert!(!tree.release_sides(), "once released, none is left");
    }

    #[cfg(feature = "arena")]
    #[test]
    fn a_side_write_refused_after_its_row_changed_still_marks_its_tree_grown() {
        let mut engine = Engine::new(TestGrammar, ResolvedOptions::default()).expect("engine");
        let mut tree = engine.parse("fn f() {}\n", claim()).expect("parse");
        let record = crate::trivia::RecordEntry { record: crate::trivia::BuiltEntry { kind: KindId(1), at: crate::arena::Address(5) }, store: None };
        tree.sides.insert(NodeIndex::ROOT, TriviaSide::Leading, vec![TriviaEntry::Record(record)]);
        let _ = tree.take_grown();
        let note = TriviaEntry::Value(SlotValue::Node(TestTrivia::Text(TriviaText::of(KindId(3), "// a note"))));
        assert!(tree.write_trivia_side(NodeIndex::ROOT, TriviaSide::Leading, vec![note]).is_err(), "the record the side named holds no count to release");
        let written = tree.sides.get(NodeIndex::ROOT, TriviaSide::Leading).expect("a written side");
        assert!(matches!(written, [TriviaEntry::Value(_)]), "the new side was written before the release was refused");
        assert!(tree.take_grown(), "so its tree grew");
    }

    fn table(tree: ParsedTree<TestGrammar>) -> HashMap<crate::types::TreeId, ParsedTree<TestGrammar>> {
        HashMap::from([(tree.tree_id(), tree)])
    }

    fn coordinate(tree: &ParsedTree<TestGrammar>, index: crate::types::NodeIndex) -> NodeCoordinate {
        let node = node_at_index(tree.tree(), index).expect("a node");
        NodeCoordinate::new(tree.tree_id(), index, index + crate::read::descendant_count(&node), Span::of(&node))
    }

    /// The parsed root of `source` rendered through the live trees, and the
    /// texts `to_internal` scanned meanwhile.
    fn root_rendered(source: &str) -> (String, usize) {
        let (tree, _) = parsed(source);
        let root = coordinate(&tree, NodeIndex::ROOT);
        let trees = table(tree);
        let sources = ReadTrees::new(&trees);
        let scans = || crate::line_endings::SCANS.with(std::cell::Cell::get);
        let before = scans();
        let mut out = String::new();
        let mut w = crate::spacing::SpacingWriter::new(&mut out, crate::spacing::WordMatcher::default_ident()).with_sources(&sources);
        crate::render::Render::render(&SlotValue::<TestTrivia>::Coord(root), &mut w).expect("a render");
        w.finish().expect("a finished render");
        drop(w);
        (out, scans() - before)
    }

    #[test]
    fn a_source_with_no_carriage_return_enters_the_writer_unscanned_and_one_with_a_crlf_is_respelled() {
        let (lf, unscanned) = root_rendered("fn f() {}\nfn g() {}\nfn h() {}\n");
        assert_eq!(lf, "fn f() {}\nfn g() {}\nfn h() {}\n");
        assert_eq!(unscanned, 0, "a slice of a source its parse found holds no `\\r` is not scanned");
        let (mixed, scanned) = root_rendered("fn f() {}\nfn g() {}\r\nfn h() {}\n");
        assert!(scanned > 0, "a source holding a `\\r` is respelled");
        assert_eq!(mixed, lf, "its `\\r\\n` is written `\\n`");
    }

    #[test]
    fn the_tree_table_gives_a_coordinate_its_sides() {
        let (tree, _) = parsed("mod m {\n    // c\n    fn f() {}\n}\n");
        let f = coordinate(&tree, index_of_kind(&tree, "function_item", 0));
        let leading = tree.trivia_side(f.index, TriviaSide::Leading);
        let trailing = tree.trivia_side(f.index, TriviaSide::Trailing);
        let trees = table(tree);
        let sources = ReadTrees::new(&trees);
        let sides = sources.sides(&f).expect("the function has sides");
        let sides = sides.as_any().downcast_ref::<crate::trivia::NodeTrivia<TestTrivia>>().expect("the grammar's trivia");
        assert_eq!((sides.leading.as_deref(), sides.trailing.as_deref(), sides.inner.as_deref()), (Some(&leading[..]), Some(&trailing[..]), None));
    }

    #[test]
    fn a_coordinate_with_no_side_has_no_frame() {
        let (tree, _) = parsed("fn f() { a(); }\n");
        let a = coordinate(&tree, index_of_kind(&tree, "call_expression", 0));
        assert!(ReadTrees::new(&table(tree)).sides(&a).is_none());
    }

    #[test]
    fn a_change_to_the_live_trees_while_a_read_holds_them_is_refused_as_an_error() {
        let (tree, _) = parsed("fn f() {}\n");
        let f = index_of_kind(&tree, "function_item", 0);
        let trees = std::cell::RefCell::new(table(tree));
        let read = trees.borrow();
        let reading = ReadTrees::new(&read);
        let refused = change_trees(&trees).map(|_| ()).expect_err("a write while the trees are being read");
        assert!(refused.contains("being read"), "refused by name: {refused}");
        assert!(!reading.edited_within(&coordinate(&read[&read.keys().next().copied().expect("a tree")], f)), "the read saw no write");
        drop(reading);
        drop(read);
        let mut trees = change_trees(&trees).expect("a write once the read is over");
        let tree = trees.values_mut().next().expect("a tree");
        tree.write_trivia_side(f, TriviaSide::Leading, Vec::new()).expect("a side write");
        assert!(tree.edited_within(NodeIndex::ROOT, false));
    }

    #[test]
    fn the_tree_table_answers_whether_a_coordinates_range_holds_a_write() {
        let (mut tree, _) = parsed("fn f() { a(); }\nfn g() {}\n");
        let f = coordinate(&tree, index_of_kind(&tree, "function_item", 0));
        let g = coordinate(&tree, index_of_kind(&tree, "function_item", 1));
        tree.write_trivia_side(index_of_kind(&tree, "expression_statement", 0), TriviaSide::Leading, Vec::new()).expect("a side write");
        let trees = table(tree);
        let sources = ReadTrees::new(&trees);
        assert!(sources.edited_within(&f));
        assert!(!sources.edited_within(&g));
    }

    #[test]
    fn the_tree_table_hands_out_a_cursor_on_a_node_and_its_read_context() {
        let (tree, _) = parsed("fn f() {}\n");
        let id = tree.tree_id();
        let past = NodeIndex(crate::read::descendant_count(&tree.tree().root_node()));
        let trees = table(tree);
        let sources = ReadTrees::new(&trees);
        let mut read = None;
        assert!(sources.read_node(id, NodeIndex::ROOT, &mut |cursor, ctx| read = Some(format!("{}: {}", cursor.node().kind(), ctx.text(&cursor.node())))));
        assert_eq!(read.as_deref(), Some("source_file: fn f() {}\n"));
        assert!(!sources.read_node(TreeId(id.0 + 1), NodeIndex::ROOT, &mut |_, _| {}), "no tree");
        assert!(!sources.read_node(id, past, &mut |_, _| {}), "no node");
    }

    #[test]
    fn the_tree_table_notes_each_live_tree_a_lookup_hands_out_once() {
        let (first, _) = parsed("fn f() {}\n");
        let (second, _) = parsed("fn g() {}\n");
        let (a, b) = (first.tree_id(), second.tree_id());
        let trees = HashMap::from([(a, first), (b, second)]);
        let sources = ReadTrees::new(&trees);
        assert!(!sources.read_node(TreeId(a.0.max(b.0) + 1), NodeIndex::ROOT, &mut |_, _| {}));
        assert!(sources.read_node(b, NodeIndex::ROOT, &mut |_, _| {}));
        assert!(sources.source_of(a).is_some());
        assert!(sources.source_of(b).is_some());
        assert_eq!(sources.read(), vec![b, a], "each once, in the order first read, and none that is not live");
    }

    #[test]
    fn a_value_with_no_read_reads_no_coordinate() {
        let (tree, _) = parsed("fn f() {}\n");
        let id = tree.tree_id();
        let trees = table(tree);
        let sources = ReadTrees::new(&trees);
        assert!(sources.read_node(id, NodeIndex::ROOT, &mut |cursor, ctx| assert!(<TestTrivia as crate::prepare::Prepare>::read_coordinate(cursor, ctx).is_none())));
    }
}
