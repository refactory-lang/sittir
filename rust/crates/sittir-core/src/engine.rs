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

use crate::tree_sitter;
use crate::heap::HeapBytes;
use crate::nodes::{Kid, Navigation, Nodes, Step, TreeNodes, Visit};
use crate::options::ResolvedOptions;
use crate::query::{Address, DescendantBatch, Plan, QueryCoordinate, QueryItem};
use crate::read::SideEntry;
use crate::types::Span;
use crate::render::SourceTable;
use crate::slot::{NodeCoordinate, SlotValue};
use crate::trivia::{FromTriviaText, TriviaEntry, TriviaText};
use crate::trivia_store::TriviaStore;
use crate::trivia_table::{Placement, TriviaSide};
use crate::types::{ChildPosition, KindId, NodeIndex, TreeHandle, TreeId};
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
    fn kind_name(kind: KindId) -> &'static str;
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
    /// The record a node of `kind` is written as (`RecordCells::shape` of
    /// the grammar's node); none for a kind that has no record, and for a
    /// grammar with no records.
    #[cfg(feature = "arena")]
    #[must_use]
    fn shape(kind: KindId) -> Option<crate::arena::RecordShape> {
        let _ = kind;
        None
    }
    /// Whether `kind` is a named kind of this grammar; none is for a grammar
    /// with no records.
    #[cfg(feature = "arena")]
    #[must_use]
    fn named_kind(kind: KindId) -> bool {
        let _ = kind;
        false
    }
    /// What navigation over this grammar's records reads of it.
    #[cfg(feature = "arena")]
    #[must_use]
    fn read_shape() -> crate::arena::ReadShape {
        (Self::shape, Self::KIND_BITS, Self::named_kind)
    }
    /// The children of the node `at`, found through `nodes`, as its read
    /// routes them (`ReadNode::routes`); none for a node read without
    /// routes, or a grammar with no nodes.
    fn slot_routes(self, nodes: &mut dyn Nodes<'_>, at: &Kid) -> Option<crate::read::Routed> {
        let _ = (nodes, at);
        None
    }
    /// How a node with these ids finds its slots, as its read does
    /// (`ReadNode::router`); none for a node read without slots, or a
    /// grammar with no nodes.
    fn router(self, grammar: KindId, display: KindId) -> Option<crate::read::Router> {
        let _ = (grammar, display);
        None
    }
    /// Whether the read takes a node with these ids (`ReadNode::admits`);
    /// every node for a grammar with no nodes.
    fn admits(self, grammar: KindId, display: KindId) -> bool {
        let _ = (grammar, display);
        true
    }
    /// The id the read stores for the node `at`, found through `nodes`,
    /// when it stores the node as a unit (`ReadNode::unit_id`: an enum
    /// kind's member, a choice's unit variant); none for a node it stores as
    /// a node, or a grammar with no nodes.
    fn unit_id(self, nodes: &mut dyn Nodes<'_>, at: &Kid) -> Option<KindId> {
        let _ = (nodes, at);
        None
    }
    /// The delimiter flags the read stamps on the list `at`, found through
    /// `nodes` (`ReadNode::delimiter`); none for a node that is no list with
    /// an optional flank, or a grammar with no nodes.
    fn delimiter(self, nodes: &mut dyn Nodes<'_>, at: &Kid) -> Option<crate::types::Delimiter> {
        let _ = (nodes, at);
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
    nodes.names(index).then(|| nodes.kid(index))
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

/// What kind of region of a source did not parse: an ERROR node error
/// recovery wrapped source in, or a MISSING node it inserted, with the node it
/// was inserted into.
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize)]
#[serde(tag = "kind", rename_all = "lowercase")]
pub enum ErrorRegionKind {
    Error,
    Missing { holder: ErrorHolder },
}

/// The node a MISSING token was inserted into: its span and the kind the
/// grammar parsed it as (`read::grammar_id`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize)]
pub struct ErrorHolder {
    pub span: Span,
    pub kind: KindId,
}

/// One region of a source that did not parse, with its byte span. A MISSING
/// region is empty: it marks where the parser inserted a token.
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize)]
pub struct ErrorRegion {
    #[serde(flatten)]
    pub kind: ErrorRegionKind,
    pub span: Span,
}

/// Every ERROR and MISSING region of the tree `nodes` navigates, in source
/// order. The search goes into the children only of nodes that hold an
/// error, and never of an ERROR node: a region nested in another is part of
/// it.
#[must_use]
pub fn error_regions(nodes: &mut dyn Nodes<'_>) -> Vec<ErrorRegion> {
    let mut regions = Vec::new();
    let mut pending: Vec<(Kid, Option<Kid>)> = vec![(nodes.kid(NodeIndex::ROOT), None)];
    while let Some((kid, parent)) = pending.pop() {
        if kid.error() {
            regions.push(ErrorRegion { kind: ErrorRegionKind::Error, span: kid.span() });
        } else if nodes.missing(kid.index) {
            if let Some(parent) = parent {
                regions.push(ErrorRegion { kind: ErrorRegionKind::Missing { holder: ErrorHolder { span: parent.span(), kind: parent.grammar } }, span: kid.span() });
            }
        } else if nodes.holds_error(kid.index) {
            pending.extend(nodes.kids(kid.index).iter().rev().map(|&child| (child, Some(kid))));
        }
    }
    regions
}

/// The node a coordinate names: of the nodes spanning exactly `start..end`,
/// the outermost the read stamped `kind`, either the grammar symbol that
/// parsed it or the kind the parser shows it as (`identity`), since a node
/// read as an alias envelope is addressed by the kind it shows.
///
/// The search descends from the node at `from` by byte: at each level it steps to the
/// child at `start` (`Nodes::child_past`) without visiting the children
/// before it. A span of at least one byte can only sit in that child, since
/// siblings never overlap; a zero-width span can also sit at the end of a
/// sibling ending at `start` or in a zero-width sibling there, so the search
/// first steps back over the siblings ending at `start`, then tries each
/// child forward, in source order, while it starts at or before `start`.
#[must_use]
pub fn node_at_span(nodes: &mut dyn Nodes<'_>, from: NodeIndex, span: Span, kind: KindId) -> Option<Kid> {
    fn search(nodes: &mut dyn Nodes<'_>, node: Kid, span: Span, kind: KindId) -> Option<Kid> {
        if node.span() == span && (node.grammar == kind || node.display == kind) {
            return Some(node);
        }
        let mut child = match nodes.child_past(node.index, span.start) {
            Some(child) => child,
            None => nodes.edge(node.index, crate::options::Side::After)?,
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
    let from = nodes.kid(from);
    search(nodes, from, span, kind)
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
    tree: tree_sitter::Tree,
    source: Arc<str>,
    /// Whether the source spells every line break `\n`, holding no `\r`
    /// (`SourceTable::breaks_spelled_lf`).
    breaks_lf: bool,
    /// How many nodes the tree holds, stamped at parse: the descendant
    /// indexes that name one (`names`).
    nodes: u32,
    /// Identity this tree stamps into every handle it mints. Distinct per
    /// parse, so a handle names the tree it belongs to and cannot be spent
    /// against another one.
    tree_id: TreeId,
    /// What its reads keep once measured.
    caches: ReadCaches,
    /// The tree's trivia, placed one layout owner at a time on the first read
    /// of a side the layout owner holds, each layout owner's sides published
    /// as a table a read of them reaches without a lock (`cover_side`).
    trivia: Placement,
    /// The tree's depth members, found on its first depth move
    /// (`Lookups::depth_move`).
    depth_members: std::sync::OnceLock<crate::trivia_table::DepthMembers>,
    /// Whether the tree can hold an extra or `ERROR` on a side: its grammar
    /// has trivia that isn't whitespace (`SurfaceKinds::named_extras`) or
    /// its root holds an `ERROR`. Stamped when the tree is made.
    entries: bool,
    /// The engine's options when the tree was read: what its regions record
    /// under.
    options: ResolvedOptions,
    /// The heap the values of `caches`' `slots` and `items` hold, added as
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
    sides: crate::trivia_store::SideRows<NodeIndex, TriviaEntry<G::Trivia>>,
}

/// What a backer's reads of its source keep once measured.
#[derive(Default)]
pub struct ReadCaches {
    /// The source's row starts, built on the first snapshot and shared by
    /// every later one.
    lines: std::sync::OnceLock<crate::points::LineTable>,
    /// Each node's list slots, by its index (`Lookups::node_slots`).
    slots: std::sync::Mutex<crate::heap::CountedMap<NodeIndex, Arc<NodeSlots>>>,
    /// Each node's routed children, by its index (`Backing::routed`).
    items: std::sync::Mutex<crate::heap::CountedMap<NodeIndex, Arc<Option<crate::read::Routed>>>>,
}

/// What a call reads a parsed node through: a parsed tree in object
/// storage, the records a read left of one source in arena storage. Every
/// rule of reading a node is written once here, over what a backer answers.
pub trait Backing<G: EngineGrammar>: Sized {
    /// Whether this backer keeps its source's blank rows with its row starts
    /// (`LineTable::with_blank_rows`), which spare its lookups the routing
    /// of a list's holder whose bytes hold none (`Lookups::list_item_trailing`):
    /// a backer whose parse stamps the items it sets apart (`set_apart`)
    /// routes no holder and keeps none.
    const KEEPS_BLANK_ROWS: bool;

    /// Whether every extra and `ERROR` was placed by the parse, on the side
    /// the engine's store keeps for the node it went to: a node the store
    /// keeps no side of, a fixed token, a flag's keyword or a token, holds
    /// none, and no placement runs.
    const PLACED_AT_PARSE: bool;

    /// Whether this backer reads records, whose nodes are named by the call
    /// rather than rooted at their source's root (`ReadCtx::over_records`).
    const OVER_RECORDS: bool;

    /// The grammar the source was parsed with.
    fn grammar(&self) -> G;

    /// The source text.
    fn source(&self) -> &str;

    /// Whether the source spells every line break `\n`, holding no `\r`
    /// (`SourceTable::breaks_spelled_lf`).
    fn breaks_lf(&self) -> bool;

    /// The id a read of this backer stamps into the handles it mints; none
    /// for a backer over records, whose nodes are named by their ids.
    fn handle_tree(&self) -> Option<TreeId>;

    /// The engine's options when the source was read.
    fn options(&self) -> &ResolvedOptions;

    /// The store of the engine that parsed the source: the built arena the
    /// records its written sides name come from, and what answers them.
    fn store(&self) -> &TriviaStore<G::Trivia>;

    /// The work this backer's layout reads have done.
    fn work(&self) -> &crate::layout::LayoutWorkCounter;

    /// What this backer's reads keep once measured.
    fn caches(&self) -> &ReadCaches;

    /// Whether the node at `index` can hold an extra or `ERROR` on a side.
    fn holds_entries(&self, nodes: &mut dyn Nodes<'_>, index: NodeIndex) -> bool;

    /// The list slots the parse stamped on the node at `index`, of `kind`;
    /// none for a node whose slots are measured from its children.
    fn stamped_slots(&self, _index: NodeIndex, _kind: KindId) -> Option<Vec<crate::layout::SlotLayout>> {
        None
    }

    /// Counts the heap of `value`, inserted into a read cache, less what the
    /// value it replaced held, where this backer keeps a count.
    fn count_cached<V: HeapBytes>(&self, value: &V, replaced: Option<&V>);

    /// Marks a table this backer counts grown, where it keeps a count.
    fn grew(&self);

    /// Navigation of this backer's nodes for one call.
    fn nodes(&self) -> Navigation<'_>;

    /// The index `nodes` gives the node `at` names; none for a node this
    /// backer does not hold.
    fn node_index(&self, nodes: &mut Navigation<'_>, at: crate::slot::NodeIdOrCoordinate<'_>) -> Option<NodeIndex>;

    /// Whether this backer holds the source of the node `at` names.
    fn holds(&self, at: crate::slot::NodeIdOrCoordinate<'_>) -> bool;

    /// Whether `at` names this backer's source's root
    /// (`SourceTable::is_source_root`).
    fn is_source_root(&self, nodes: &mut Navigation<'_>, at: crate::slot::NodeIdOrCoordinate<'_>) -> bool;

    /// Forgets the nodes the last answer of a render met; true where this
    /// backing's indexes last only as long as that answer.
    fn forget_met(&self) -> bool {
        false
    }

    /// Where an `ERROR` read on its own came from (`ErrorRead::at`); none
    /// for a node nothing past the call can name.
    fn error_origin(&self, error: &Kid, ctx: &crate::read::ReadCtx<'_>) -> Option<crate::read::Origin>;

    /// A cursor of tree-sitter's tree on the node at `index`, for a reader
    /// of it: `nodes`' own, moved there, or one of the tree's; none for a
    /// backer that holds no tree.
    fn reader_at<'t>(&'t self, nodes: &mut Navigation<'t>, index: NodeIndex) -> Option<tree_sitter::TreeCursor<'t>>;

    /// The arenas that hold this backer's records.
    #[cfg(feature = "arena")]
    fn reads(&self) -> Option<&dyn crate::arena::ArenaRead>;

    /// The entry of the source this backer's records were read from, in the
    /// arena `reads` answers; none for a backer over no records.
    #[cfg(feature = "arena")]
    fn source_entry(&self) -> Option<crate::arena::Address>;

    /// Where the engine's store keeps the written sides of the node at
    /// `index`; none for a backer that keeps its written sides itself.
    fn place(&self, index: NodeIndex) -> Option<crate::trivia_store::Place>;

    /// The entries a write gave `side` of the node at `index`, where this
    /// backer keeps its written sides itself.
    fn written_side(&self, index: NodeIndex, side: TriviaSide) -> Option<Vec<TriviaEntry<G::Trivia>>>;

    /// Whether a write lies on the node at `index`, on a side `own_sides`
    /// counts, or under it, and how many written sides that walked.
    fn edited_in(&self, nodes: &mut dyn Nodes<'_>, index: NodeIndex, own_sides: bool) -> (bool, u64);

    /// The blank-line kind the parse set the list item after the node at
    /// `index` apart from it with, as the parse stamped it on the node
    /// (`Hydration::list`), `LayoutKinds::NONE` where it set it apart with
    /// none; none for a backer whose parse stamps no item.
    fn set_apart(&self, index: NodeIndex) -> Option<crate::layout_kinds::LayoutKinds> {
        let _ = index;
        None
    }

    /// The names this backer's nodes keep past a call; none for a tree whose
    /// nodes are named by its id and their indexes.
    fn node_names(&self) -> Option<&dyn crate::read::NodeNames>;

    /// The text a unit of `kind` writes, for a backer whose units hold no
    /// bytes of the source; none for any other.
    fn unit_text(&self, kind: KindId) -> Option<String> {
        let _ = kind;
        None
    }

    /// `answer` of the offsets, sorted, within which this backer's nodes
    /// hold a side with an entry, each within the node whose side it is;
    /// `answer` of none for a backer that keeps no account of them.
    fn entry_starts<R>(&self, answer: impl FnOnce(Option<&[u32]>) -> R) -> R {
        answer(None)
    }

    /// Whether a node within `span`, both ends included, can hold a side
    /// with an entry (`entry_starts`): a frame over `span` reads no side
    /// where none can. True for a backer that keeps no account of them.
    fn entries_within(&self, span: Span) -> bool {
        self.entry_starts(|starts| starts.is_none_or(|starts| EntryCursor::default().within(starts, span)))
    }

    /// Where the node `name` names is kept in this backer's records; none
    /// for a backer whose nodes have no names, or a name its records hold no
    /// node of.
    #[cfg(feature = "arena")]
    fn named(&self, name: crate::types::NodeId) -> Option<crate::arena::NodeSite> {
        let _ = name;
        None
    }

    /// The table of the layout owner that holds `side` of the node at
    /// `index`, placed on its first read through `nodes` (`Placement::cover`);
    /// none for a backer its parse placed.
    fn cover_side<'t>(&'t self, nodes: &mut Navigation<'t>, index: NodeIndex, side: TriviaSide) -> Option<&'t crate::trivia_table::Table>;

    /// The tree's depth members, found through `nodes` on first use; none
    /// for a backer whose records stamp each node's depth move.
    fn depth_members(&self, nodes: &mut Navigation<'_>) -> Option<&crate::trivia_table::DepthMembers>;

    /// The source's row starts (`LineTable`), built on first use, with its
    /// blank rows where the backer keeps them (`KEEPS_BLANK_ROWS`).
    fn lines(&self) -> &crate::points::LineTable {
        self.caches().lines.get_or_init(|| {
            self.grew();
            if Self::KEEPS_BLANK_ROWS { crate::points::LineTable::with_blank_rows(self.source()) } else { crate::points::LineTable::new(self.source()) }
        })
    }

    /// The sides of the unit children of the node at `index`, by slot and
    /// item, as a render read seats them for a client that stores each unit
    /// as its bare kind (`read::units_of`, `ReadCtx::inline_units`), found
    /// through the tree's navigation.
    fn unit_sides(&self, index: crate::types::NodeIndex) -> Vec<crate::layout::UnitSides<G::Trivia>> {
        let seating = self.seating();
        let routed = seating.routed(index);
        let Some(routed) = routed.as_ref() else { return Vec::new() };
        crate::read::units_of(routed, &seating.ctx().inline_units().units_only())
    }

    /// The `ERROR` holding the node at `index`, read as the bytes its
    /// coordinate spans, or `None` when no `ERROR` holds it. An `ERROR`'s
    /// interior is trivia of its tree, so a node in it is no typed node: it
    /// reads as the outermost `ERROR` it lies in, itself included.
    fn read_error(&self, index: crate::types::NodeIndex) -> Option<crate::ErrorRead> {
        let mut nodes = self.nodes();
        node(&mut nodes, index)?;
        let error = nodes.error_holding(index)?;
        self.error_at(&error, &self.read_ctx())
    }

    fn error_at(&self, error: &Kid, ctx: &crate::read::ReadCtx<'_>) -> Option<crate::ErrorRead> {
        let span = ctx.span_at(error.index, error.span());
        let text = self.source()[span.range()].to_owned();
        Some(crate::ErrorRead { text, kind: Some(ctx.stamped_kind(error.grammar, error.display)), at: self.error_origin(error, ctx)? })
    }

    fn read_ctx(&self) -> crate::read::ReadCtx<'_> {
        crate::read::ReadCtx::new(self.source(), self.handle_tree(), self.grammar().shows()).with_relaxes(self.grammar().relaxes()).with_names(self.node_names()).over_records(Self::OVER_RECORDS)
    }

    /// The bytes the node at `index` renders between as its source: its span
    /// widened by the extras and `ERROR`s its frames hold
    /// (`SourceTable::framed_span`). A diagnostic; `None` past the last node.
    #[must_use]
    fn framed_span_at(&self, index: crate::types::NodeIndex) -> Option<Span> {
        let mut lookups = lookups(self);
        let kid = lookups.kid(index)?;
        let span = self.read_ctx().span_at(index, kid.span());
        Some(lookups.framed_span(Named { index, span, stamp: None, changed: crate::slot::ChangedEdges::default() }))
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
        let own = (Self::OVER_RECORDS || index != NodeIndex::ROOT).then_some(from);
        Ok(crate::read::SnapshotCtx::new(self.lines(), holder.or(own), index))
    }

    /// A snapshot's layout of the node at `root` and of each node under it
    /// that a read gives a layout of its own, each by its row, in preorder:
    /// its span from the node that holds it (`ReadCtx::hold`), its sides with
    /// each extra and `ERROR` as its text measured from there and the runs at
    /// the root's own outer edges dropped, its unit children's sides, and the
    /// root's flanks. An alias envelope and its content share the envelope's
    /// row, and a content an envelope reads through a hidden child keeps its
    /// span alone. The root is measured from the byte `holder`, or, when
    /// absent, from where it or its leading side begins, whichever is first.
    /// When an `ERROR` holds the root, the one row is that `ERROR`'s, its span
    /// measured from `holder` or its own start. `None` past the tree's last
    /// node. Refuses a holder after the first byte the snapshot measures
    /// (`ReadError::Unmeasured`), and a node the read refuses.
    fn snapshot_layouts(&self, root: NodeIndex, holder: Option<u32>) -> Option<Result<crate::layout::SnapshotLayouts<G::Trivia>, crate::read::ReadError>> {
        self.snapshot_rows(root, holder, None)
    }

    /// `snapshot_layouts`, each node's sides seated from `sides` instead of
    /// the tree's own lookups.
    fn snapshot_layouts_seated(&self, root: NodeIndex, holder: Option<u32>, sides: &dyn crate::read::SideLookup) -> Option<Result<crate::layout::SnapshotLayouts<G::Trivia>, crate::read::ReadError>> {
        self.snapshot_rows(root, holder, Some(sides))
    }

    /// `snapshot_layouts`, each node's sides seated from `sides`, or from the
    /// tree's own lookups when absent.
    fn snapshot_rows(&self, root: NodeIndex, holder: Option<u32>, sides: Option<&dyn crate::read::SideLookup>) -> Option<Result<crate::layout::SnapshotLayouts<G::Trivia>, crate::read::ReadError>> {
        let mut nodes = self.nodes();
        node(&mut nodes, root)?;
        if let Some(error) = nodes.error_holding(root) {
            return Some(self.error_row(&error, holder));
        }
        let mut lookups = lookups_over(self, nodes);
        let at = lookups.nodes.kid(root);
        let from = lookups.leading_start(root).map_or(at.start, |leading| leading.min(at.start));
        Some(self.snapshot_from(&Seating::new(lookups), sides, at, from, holder))
    }

    /// The rows of a snapshot of the node `at`, measured from the byte
    /// `from`, or from `holder` when given, each node's sides seated from
    /// `sides`, or from `seating` when absent.
    fn snapshot_from(&self, seating: &Seating<'_, G, Self>, sides: Option<&dyn crate::read::SideLookup>, at: Kid, from: u32, holder: Option<u32>) -> Result<crate::layout::SnapshotLayouts<G::Trivia>, crate::read::ReadError> {
        let measure = self.snapshot_measure(at.index, from, holder)?;
        if !self.grammar().admits(at.grammar, at.display) {
            return Err(crate::read::ReadError::Unadmitted { kind: at.grammar, index: at.index });
        }
        let mut ctx = self.read_ctx().inline_units().with_sides(sides.unwrap_or(seating)).snapshot(measure);
        let mut rows = Vec::new();
        self.snapshot_row(seating, &mut ctx, at, self.grammar().router(at.grammar, at.display), &mut rows)?;
        ctx.unmeasured().map_or(Ok(rows), |byte| Err(crate::read::ReadError::Unmeasured { index: at.index, byte }))
    }

    /// The one row of a snapshot of a node the `ERROR` `error` holds: the
    /// `ERROR`'s, with its span alone, measured from the byte `holder` or its
    /// own start.
    fn error_row(&self, error: &Kid, holder: Option<u32>) -> Result<crate::layout::SnapshotLayouts<G::Trivia>, crate::read::ReadError> {
        let ctx = self.read_ctx().snapshot(self.snapshot_measure(error.index, error.start, holder)?);
        let layout = Box::new(crate::read::placed_at(ctx.origin_of_kid(error)));
        ctx.unmeasured().map_or(Ok(vec![(error.index, layout)]), |byte| Err(crate::read::ReadError::Unmeasured { index: error.index, byte }))
    }

    /// Pushes onto `rows` the snapshot layout of the node `at`, read as
    /// `router` reads it, and then those of the nodes under it.
    fn snapshot_row(&self, seating: &Seating<'_, G, Self>, ctx: &mut crate::read::ReadCtx<'_>, at: Kid, router: Option<crate::read::Router>, rows: &mut crate::layout::SnapshotLayouts<G::Trivia>) -> Result<(), crate::read::ReadError> {
        let row = rows.len();
        rows.push((at.index, Box::default()));
        rows[row].1 = self.snapshot_layout(seating, ctx, at, router, rows)?;
        Ok(())
    }

    /// The snapshot layout of the node `at`, read as `router` reads it,
    /// pushing those of the nodes under it onto `rows`. A routed node, a
    /// token interior and a text leaf hold the context while their children
    /// are measured; an envelope holds nothing, and takes its content's
    /// layout (`envelope_layout`).
    fn snapshot_layout(&self, seating: &Seating<'_, G, Self>, ctx: &mut crate::read::ReadCtx<'_>, at: Kid, router: Option<crate::read::Router>, rows: &mut crate::layout::SnapshotLayouts<G::Trivia>) -> Result<Box<crate::layout::NodeLayout<G::Trivia>>, crate::read::ReadError> {
        use crate::read::{ReadError, Route, Router};
        let origin = ctx.origin_of_kid(&at);
        match router {
            Some(Router::Children(route, _, routes)) => {
                let Some(routed) = seating.navigated(|nodes| routes(nodes, &at)) else {
                    return Err(seating.navigated(|nodes| nodes.kids(at.index)).iter().find_map(|child| route(child).err()).unwrap_or(ReadError::Unadmitted { kind: at.grammar, index: at.index }));
                };
                ctx.hold(&at, &routed.children);
                for (child, route) in routed.children.iter().zip(&routed.routes) {
                    if matches!(route, Route::Slot { scalar: false, .. }) && self.grammar().admits(child.grammar, child.display) {
                        crate::stack::grown(|| self.snapshot_row(seating, ctx, *child, self.grammar().router(child.grammar, child.display), rows))?;
                    }
                }
                let units = crate::read::units_of(&routed, ctx);
                let mut layout = ctx.layout(at.index, origin, true);
                layout.units = units;
                Ok(layout)
            }
            Some(Router::Envelope { wraps_hidden, unit, inner }) => {
                let content = if wraps_hidden {
                    seating.navigated(|nodes| nodes.kids(at.index)).iter().find(|child| !child.entry()).copied().ok_or(ReadError::Unadmitted { kind: at.grammar, index: at.index })?
                } else {
                    at
                };
                let taken = if seating.navigated(|nodes| unit(nodes, &content)).is_some() {
                    None
                } else {
                    let own = (content.index != at.index).then(|| {
                        rows.push((content.index, Box::default()));
                        rows.len() - 1
                    });
                    let mut layout = Some(crate::stack::grown(|| self.snapshot_layout(seating, ctx, content, inner(content.grammar, content.display), rows))?);
                    let taken = crate::read::take_layout_keeping_at(&mut layout);
                    if let Some(row) = own {
                        rows[row].1 = layout.unwrap_or_default();
                    }
                    taken
                };
                Ok(crate::read::envelope_layout(taken, at.index, origin, None, ctx))
            }
            Some(Router::Interior(..)) | None => {
                ctx.hold(&at, &seating.navigated(|nodes| nodes.kids(at.index)));
                Ok(ctx.layout(at.index, origin, true))
            }
        }
    }

    /// Whether each of `addresses`, found through `index`, satisfies `plan`,
    /// in order. An address `index` refuses is refused.
    fn plan_holds_over<A: Copy>(&self, addresses: &[A], index: impl Fn(&mut Navigation<'_>, A) -> Result<NodeIndex, String>, plan: &Plan) -> Result<Vec<bool>, String> {
        let ctx = self.read_ctx();
        let stamp = |at: &Kid| ctx.stamped_kind(at.grammar, at.display);
        let router = |at: &Kid| self.grammar().router(at.grammar, at.display);
        let delimiter = |nodes: &mut dyn Nodes<'_>, at: &Kid| self.grammar().delimiter(nodes, at);
        let unit_text = |kind: KindId| self.unit_text(kind);
        let query = crate::query::QueryCtx { source: self.source(), stamp: &stamp, router: &router, delimiter: &delimiter, unit_text: &unit_text };
        let mut nodes = self.nodes();
        addresses
            .iter()
            .map(|&address| {
                let index = index(&mut nodes, address)?;
                let at = nodes.kid(index);
                Ok(plan.holds(&mut nodes, &at, &query))
            })
            .collect()
    }

    /// Walk the subtree under the node at `index` in pre-order and return up
    /// to `limit` named, non-extra descendants whose stored id is in `kinds`
    /// (every one when `kinds` is empty) and that satisfy `plan`, and the
    /// path to resume after the last, when the walk stopped at `limit`. A
    /// node's stored id is the id its read stores: its unit id when the read
    /// stores it as a unit (`EngineGrammar::unit_id`), which the walk yields
    /// in place of the node, and otherwise its stamp. `resume` is the path of
    /// child indices, from the node at `index`, of the last node an earlier
    /// batch visited; the walk continues after it. `depth` bounds the levels
    /// walked below it (every level when absent). An extra is trivia: the
    /// walk neither returns nor enters it. A depth member the parser issues
    /// (`SurfaceKinds::indent`, `dedent`) is the op that opens or closes a
    /// level, not structure: the walk does not return it. Nor does it return
    /// a node the read does not take (`EngineGrammar::admits`), such as a
    /// capture inside a token, which is part of its token; an `ERROR` it does.
    /// It returns a child of a kind whose read routes its children as a
    /// coordinate only when that read stores the child in a slot: a child
    /// the kind's own template writes is no node of its surface, and is
    /// returned only as the unit it is read as. A walk from an `ERROR` returns
    /// nothing: what an `ERROR` holds was read as no node.
    #[allow(clippy::too_many_arguments, reason = "the walk's start, then its filters, then where it stops")]
    fn descendants_under(
        &self,
        nodes: &mut Navigation<'_>,
        index: NodeIndex,
        kinds: &[KindId],
        plan: Option<&Plan>,
        resume: Option<&[ChildPosition]>,
        limit: u32,
        depth: Option<u32>,
    ) -> Result<(Vec<Descendant>, Option<Vec<ChildPosition>>), String> {
        let depth = depth.map_or(usize::MAX, |levels| levels as usize);
        let start = nodes.kid(index);
        let mut levels: Vec<(crate::nodes::Kids, usize)> = Vec::new();
        let mut items = Vec::new();
        let ctx = self.read_ctx();
        let stamp = |at: &Kid| ctx.stamped_kind(at.grammar, at.display);
        let router = |at: &Kid| self.grammar().router(at.grammar, at.display);
        let delimiter = |nodes: &mut dyn Nodes<'_>, at: &Kid| self.grammar().delimiter(nodes, at);
        let unit_text = |kind: KindId| self.unit_text(kind);
        let query = crate::query::QueryCtx { source: self.source(), stamp: &stamp, router: &router, delimiter: &delimiter, unit_text: &unit_text };
        let surface = self.grammar().surface_kinds();
        for &child in resume.unwrap_or_default() {
            let parent = levels.last().map_or(start, |(kids, at)| kids[*at]);
            let kids = nodes.kids(parent.index);
            let at = child.get() as usize;
            if at >= kids.len() {
                return Err("resume path leaves the tree".to_string());
            }
            levels.push((kids, at));
        }
        let path = |levels: &[(crate::nodes::Kids, usize)]| levels.iter().map(|&(_, at)| ChildPosition(crate::types::narrow(at))).collect();
        if start.error() {
            return Ok((items, None));
        }
        while let Some(kid) = Self::advance(nodes, start, &mut levels, depth) {
            let held_unit = nodes.is_unit(kid.index);
            if !kid.named || kid.extra || surface.is_depth_member(kid.grammar) || !(held_unit || kid.error() || self.grammar().admits(kid.grammar, kid.display)) {
                continue;
            }
            let unit = if held_unit { Some(kid.grammar) } else { self.grammar().unit_id(nodes, &kid) };
            let holder = levels.len().checked_sub(2).map_or(start, |above| levels[above].0[levels[above].1]);
            if let (false, Some(crate::read::Router::Children(route, ..))) = (held_unit, router(&holder)) {
                let routed = route(&kid);
                let written_by_holder = if unit.is_some() { matches!(routed, Ok(crate::read::Route::Layout | crate::read::Route::Separator { .. })) } else { !kid.error() && !matches!(routed, Ok(crate::read::Route::Slot { .. })) };
                if written_by_holder {
                    continue;
                }
            }
            if (kinds.is_empty() || kinds.contains(&unit.unwrap_or_else(|| ctx.stamped_kind(kid.grammar, kid.display)))) && plan.is_none_or(|plan| plan.holds(nodes, &kid, &query)) {
                items.push(unit.map_or(Descendant::Node(kid), Descendant::Unit));
                if crate::types::narrow(items.len()) >= limit {
                    return Ok((items, Some(path(&levels))));
                }
            }
        }
        Ok((items, None))
    }

    /// The node after the walk's last in pre-order below `start`, at most
    /// `depth` levels down and never into an extra, `levels` holding the
    /// children of each node the walk is inside and where it is among them;
    /// `None` once the walk is done.
    fn advance(nodes: &mut Navigation<'_>, start: Kid, levels: &mut Vec<(crate::nodes::Kids, usize)>, depth: usize) -> Option<Kid> {
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
    fn line_starts_inside_tokens(&self, index: NodeIndex) -> Option<Vec<u32>> {
        lookups(self).line_starts(index)
    }

    /// Every ERROR and MISSING region of the parse (`error_regions`).
    fn error_regions(&self) -> Vec<ErrorRegion> {
        error_regions(&mut self.nodes())
    }

    /// The text `span` covers in the source, or `None` when it is not a
    /// span of the source: past its end, reversed, or splitting a character.
    #[must_use]
    fn text(&self, span: crate::types::Span) -> Option<&str> {
        self.source().get(span.range())
    }

    /// The work the tree's layout reads have done so far.
    fn layout_work(&self) -> crate::layout::LayoutWork {
        self.work().counts()
    }

    /// The children of the node at `index`, found through `nodes`, as its
    /// read routes them (`EngineGrammar::slot_routes`), measured on first
    /// use and kept; `None` where its read routes none.
    fn routed(&self, nodes: &mut Navigation<'_>, index: crate::types::NodeIndex) -> Arc<Option<crate::read::Routed>> {
        if let Some(routed) = self.caches().items.lock().unwrap_or_else(std::sync::PoisonError::into_inner).get(&index) {
            return Arc::clone(routed);
        }
        let at = nodes.kid(index);
        let routed = Arc::new(self.grammar().slot_routes(nodes, &at));
        let replaced = self.caches().items.lock().unwrap_or_else(std::sync::PoisonError::into_inner).insert(index, Arc::clone(&routed));
        self.count_cached(&routed, replaced.as_ref());
        routed
    }

    /// The grammar's whitespace member of the gap kind `gap`, with its own
    /// text; none when the grammar has no member of that kind.
    fn layout_member(&self, gap: crate::layout_kinds::LayoutKinds) -> Option<G::Trivia> {
        let (table, _) = self.grammar().whitespace();
        let kind = table.gap_kind(gap)?;
        G::Trivia::from_layout(TriviaText::of(kind, (table.text_of)(kind)))
    }

    /// The whitespace member a run reads as: among the grammar's layout kinds
    /// whose text holds a line break when the run holds one, and none when it
    /// does not, the one of its seam rank (`classify_whitespace`).
    fn layout_kind(&self, run: &str) -> Option<KindId> {
        let (table, kinds) = self.grammar().whitespace();
        let breaks = run.contains('\n');
        let class: Vec<KindId> = kinds.iter().copied().filter(|&kind| (table.text_of)(kind).contains('\n') == breaks).collect();
        crate::classify::classify_whitespace(run, &class, table)
    }

    /// This tree's sides and source table for one call (`Seating`).
    #[must_use]
    fn seating(&self) -> Seating<'_, G, Self> {
        Seating::new(lookups(self))
    }

    /// The separator the list at `index` writes between its items: the one
    /// its slot stores where its source's gaps differ from what the read-time
    /// options render, else the one those options render, which is also the
    /// answer for a list of no gap. None for a node that is no list.
    fn slot_separator(&self, index: crate::types::NodeIndex) -> Option<KindId> {
        lookups(self).slot_separator(index)
    }

    /// The stored layout of each list slot of the node at `index` that
    /// stores any (`Lookups::node_slots`).
    fn slot_layouts(&self, index: crate::types::NodeIndex) -> Vec<crate::layout::SlotLayout> {
        lookups(self).slot_layouts(index)
    }

    /// How much of its layout the tree stores apart from its read-time
    /// options: each list slot storing a layout (`slot_layouts`), over every
    /// node no `ERROR` or extra holds: what one of those holds was read as no
    /// slot.
    fn stored_layout(&self) -> crate::layout::StoredLayout {
        let count = |n: usize| u32::try_from(n).unwrap_or(u32::MAX);
        let mut lookups = lookups(self);
        let mut nodes = Vec::new();
        lookups.nodes.walk(NodeIndex::ROOT, &mut |step, kid| {
            if kid.entry() {
                return Visit::Pass;
            }
            if step == Step::Meet {
                nodes.push(kid.index);
            }
            Visit::Enter
        });
        let slots = nodes.into_iter().map(|index| lookups.node_slots(index)).map(|slots| slots.layouts.iter().filter(|layout| !layout.is_empty()).count()).sum();
        crate::layout::StoredLayout { slots: count(slots) }
    }

    /// The entries of `side` of the node at `index`: the ones a write gave it,
    /// else the assigned ones, each as a value. An extra is its coordinate, an
    /// `ERROR` its kind and source text, and a layout run its whitespace
    /// member.
    fn trivia_side(&self, index: crate::types::NodeIndex, side: TriviaSide) -> Vec<TriviaEntry<G::Trivia>> {
        self.side_entries(index, side, false).into_iter().map(SideEntry::into_entry).collect()
    }

    /// `trivia_side` with where each entry came from, and when `edge_changed`
    /// as a changed edge keeps it (`trivia::on_changed_edge`).
    fn side_entries(&self, index: crate::types::NodeIndex, side: TriviaSide, edge_changed: bool) -> Vec<SideEntry<G::Trivia>> {
        lookups(self).side_entries(index, side, edge_changed)
    }

    /// Whether the node at `index` is empty (`trivia_table::is_empty`): no
    /// child of it has width, so its trivia is its `inner`.
    fn is_empty(&self, index: crate::types::NodeIndex) -> bool {
        let mut nodes = self.nodes();
        node(&mut nodes, index).is_some() && crate::trivia_table::is_empty(&mut nodes, index, &|kind| self.options().token_seam(kind).is_some())
    }

    /// Whether a write replaced a side of a node under the node at `index`:
    /// of a descendant, or of the node's own `inner`, and of its own leading
    /// and trailing too when `own_sides` is set. It walks the written rows
    /// alone (`TriviaStore::edit_walks`).
    fn edited_within(&self, index: NodeIndex, own_sides: bool) -> bool {
        edited_under(self, &mut self.nodes(), index, own_sides)
    }
}

/// `Backing::edited_within`, through `nodes`, the walk counted in the
/// engine's store.
fn edited_under<G: EngineGrammar, B: Backing<G>>(tree: &B, nodes: &mut dyn Nodes<'_>, index: NodeIndex, own_sides: bool) -> bool {
    let (edited, walked) = tree.edited_in(nodes, index, own_sides);
    tree.store().walked(walked);
    edited
}

/// What a walk of a node's descendants found (`Backing::descendants_under`).
#[derive(Debug, Clone, Copy)]
pub enum Descendant {
    Node(Kid),
    Unit(KindId),
}

/// One call's lookups in `tree` (`Lookups`).
fn lookups<G: EngineGrammar, B: Backing<G>>(tree: &B) -> Lookups<'_, G, B> {
    lookups_over(tree, tree.nodes())
}

fn lookups_over<'t, G: EngineGrammar, B: Backing<G>>(tree: &'t B, nodes: Navigation<'t>) -> Lookups<'t, G, B> {
    Lookups { tree, nodes, apart: HashMap::default(), ids: HashMap::default(), entries: EntryCursor::default(), answers_alone: false, grammar: std::marker::PhantomData }
}

impl<G: EngineGrammar> Backing<G> for ParsedTree<G> {
    const KEEPS_BLANK_ROWS: bool = true;
    const PLACED_AT_PARSE: bool = false;
    const OVER_RECORDS: bool = false;

    fn grammar(&self) -> G {
        self.grammar
    }

    fn source(&self) -> &str {
        &self.source
    }

    fn breaks_lf(&self) -> bool {
        self.breaks_lf
    }

    fn handle_tree(&self) -> Option<TreeId> {
        Some(self.tree_id)
    }

    fn options(&self) -> &ResolvedOptions {
        &self.options
    }

    fn store(&self) -> &TriviaStore<G::Trivia> {
        &self.store
    }

    fn work(&self) -> &crate::layout::LayoutWorkCounter {
        &self.work
    }

    fn caches(&self) -> &ReadCaches {
        &self.caches
    }

    fn holds_entries(&self, _: &mut dyn Nodes<'_>, _: NodeIndex) -> bool {
        self.entries
    }

    fn count_cached<V: HeapBytes>(&self, value: &V, replaced: Option<&V>) {
        use std::sync::atomic::Ordering::Relaxed;
        self.cached.fetch_add(value.heap_bytes(), Relaxed);
        if let Some(replaced) = replaced {
            self.cached.fetch_sub(replaced.heap_bytes(), Relaxed);
        }
        self.grew();
    }

    fn grew(&self) {
        self.grown.store(true, std::sync::atomic::Ordering::Relaxed);
    }

    fn nodes(&self) -> Navigation<'_> {
        Navigation::Tree(self.tree_nodes())
    }

    fn node_index(&self, _: &mut Navigation<'_>, at: crate::slot::NodeIdOrCoordinate<'_>) -> Option<NodeIndex> {
        match at {
            crate::slot::NodeIdOrCoordinate::Coordinate(coord) if coord.tree == self.tree_id => Some(coord.index),
            _ => None,
        }
    }

    fn holds(&self, at: crate::slot::NodeIdOrCoordinate<'_>) -> bool {
        at.tree() == Some(self.tree_id)
    }

    fn is_source_root(&self, _: &mut Navigation<'_>, at: crate::slot::NodeIdOrCoordinate<'_>) -> bool {
        matches!(at, crate::slot::NodeIdOrCoordinate::Coordinate(coord) if coord.index == NodeIndex::ROOT)
    }

    fn error_origin(&self, error: &Kid, ctx: &crate::read::ReadCtx<'_>) -> Option<crate::read::Origin> {
        Some(ctx.origin_of(ctx.coordinate_of(error)))
    }

    fn reader_at<'t>(&'t self, nodes: &mut Navigation<'t>, index: NodeIndex) -> Option<tree_sitter::TreeCursor<'t>> {
        Some(match nodes.reader(index) {
            Some(cursor) => cursor.clone(),
            None => self.tree_nodes().reader(index).clone(),
        })
    }

    #[cfg(feature = "arena")]
    fn reads(&self) -> Option<&dyn crate::arena::ArenaRead> {
        None
    }

    #[cfg(feature = "arena")]
    fn source_entry(&self) -> Option<crate::arena::Address> {
        None
    }

    fn place(&self, _: NodeIndex) -> Option<crate::trivia_store::Place> {
        None
    }

    fn written_side(&self, index: NodeIndex, side: TriviaSide) -> Option<Vec<TriviaEntry<G::Trivia>>> {
        self.sides.get(index, side).map(|written| self.store.answered(written))
    }

    fn edited_in(&self, nodes: &mut dyn Nodes<'_>, index: NodeIndex, own_sides: bool) -> (bool, u64) {
        node(nodes, index).map_or((false, 0), |kid| self.sides.edited_within(index, index + kid.count, own_sides))
    }

    fn node_names(&self) -> Option<&dyn crate::read::NodeNames> {
        None
    }

    fn cover_side<'t>(&'t self, nodes: &mut Navigation<'t>, index: NodeIndex, side: TriviaSide) -> Option<&'t crate::trivia_table::Table> {
        let grammar = self.grammar;
        self.trivia.cover(crate::trivia_table::Source { nodes, routes: &|nodes: &mut dyn Nodes<'_>, at: &Kid| grammar.slot_routes(nodes, at) }, index, side)
    }

    fn depth_members(&self, nodes: &mut Navigation<'_>) -> Option<&crate::trivia_table::DepthMembers> {
        Some(self.depth_members.get_or_init(|| {
            self.grew();
            let members = crate::trivia_table::DepthMembers::of(nodes, self.grammar.surface_kinds());
            self.work.depth_nodes(members.walked());
            members
        }))
    }
}

/// The records a read left of one source, in an engine's built arena, as one
/// call reads them: made once for that source and dropped with the call. It
/// holds what the call needs of the source, and the nodes the call's
/// navigations have met, by the ids they gave them.
#[cfg(feature = "arena")]
pub struct Records<'a, G: EngineGrammar> {
    grammar: G,
    built: &'a dyn crate::arena::ArenaRead,
    table: crate::arena::RunTable,
    /// How the grammar lays a record of each kind out, and its kind bits:
    /// what finds a slot's site from its node's row and back.
    shape: crate::arena::ReadShape,
    /// The node the answer running was asked about, by its index, with the
    /// name it was asked by: what names a row with no read of its holder's
    /// cells.
    asked: PerCall<Option<(NodeIndex, crate::types::NodeId)>>,
    /// The source's entry starts, read on the call's first frame
    /// (`Backing::entry_starts`); none where they could not be read.
    entry_starts: PerCall<std::cell::OnceCell<Option<std::borrow::Cow<'a, [u32]>>>>,
    /// The entry of the source the records were read from, which names its
    /// read's entry starts.
    source: crate::arena::Address,
    text: &'a str,
    breaks_lf: bool,
    caches: ReadCaches,
    options: &'a ResolvedOptions,
    store: TriviaStore<G::Trivia>,
    work: crate::layout::LayoutWorkCounter,
    /// Renders a unit of a kind on its own.
    render_unit: fn(&Self, KindId) -> Option<String>,
    /// The text of each unit kind the call asked about.
    unit_texts: PerCall<HashMap<KindId, Option<String>, crate::heap::IndexState>>,
}

#[cfg(feature = "arena")]
impl<'a, G: EngineGrammar> Records<'a, G> {
    fn read_starts(&self) -> Option<std::borrow::Cow<'a, [u32]>> {
        let stored = crate::arena::read_entry_starts(self.built, self.source).ok()??;
        let written = self.written_sites()?;
        if written.is_empty() {
            return Some(std::borrow::Cow::Borrowed(stored));
        }
        let mut starts = stored.to_vec();
        let mut runs = crate::arena::RunNodes::over(self.built, self.text, &self.table, self.shape);
        for (site, _) in written {
            let held = if let crate::arena::NodeSite::Unit(unit) = site { crate::arena::NodeSite::Record(unit.holder) } else { site };
            if let Some(index) = runs.index_at(held) {
                starts.push(runs.kid(index).start);
            }
        }
        starts.sort_unstable();
        starts.dedup();
        Some(std::borrow::Cow::Owned(starts))
    }

    /// Where each side a write gave a node of the source is kept, the inside
    /// of a record as that record's `inner`.
    fn written_sites(&self) -> Option<Vec<(crate::arena::NodeSite, TriviaSide)>> {
        let spans = crate::arena::read_spans(self.built, self.source).ok()?;
        let (shape, bits, _) = self.shape;
        let site_of = |name: crate::types::NodeId, side: TriviaSide| match name.inside_of() {
            Some(record) if side == TriviaSide::Leading => Some((crate::arena::NodeSite::Record(crate::arena::Address(record.address())), TriviaSide::Inner)),
            _ => Some((crate::arena::site::node_site(self.built, shape, bits, name).ok()?, side)),
        };
        Some(self.store.written(&spans).into_iter().filter_map(|(name, side)| site_of(name, side)).collect())
    }
}

#[cfg(feature = "arena")]
impl<G: EngineGrammar> Backing<G> for Records<'_, G> {
    const KEEPS_BLANK_ROWS: bool = false;
    const PLACED_AT_PARSE: bool = true;
    const OVER_RECORDS: bool = true;

    fn grammar(&self) -> G {
        self.grammar
    }

    fn source(&self) -> &str {
        self.text
    }

    fn breaks_lf(&self) -> bool {
        self.breaks_lf
    }

    fn handle_tree(&self) -> Option<TreeId> {
        None
    }

    fn options(&self) -> &ResolvedOptions {
        self.options
    }

    fn store(&self) -> &TriviaStore<G::Trivia> {
        &self.store
    }

    fn work(&self) -> &crate::layout::LayoutWorkCounter {
        &self.work
    }

    fn caches(&self) -> &ReadCaches {
        &self.caches
    }

    /// A source's root that is an `ERROR` is placed on no side, so the entry
    /// starts don't show it: the node's own error fact does.
    fn holds_entries(&self, nodes: &mut dyn Nodes<'_>, index: NodeIndex) -> bool {
        self.grammar.surface_kinds().named_extras || nodes.holds_error(index) || self.entry_starts(|starts| starts.is_none_or(|starts| !starts.is_empty()))
    }

    /// A record holds its list's separator, in its side record's slot entry,
    /// where it differs from the arm of the options it was read with; a kind
    /// with no separator site holds none.
    fn stamped_slots(&self, index: NodeIndex, kind: KindId) -> Option<Vec<crate::layout::SlotLayout>> {
        if self.options.separator_of(kind).is_none() {
            return Some(Vec::new());
        }
        let crate::arena::NodeSite::Record(at) = self.table.site(index)? else { return None };
        let (shape, bits, _) = self.shape;
        let record = shape(crate::arena::ArenaRead::header_kind(self.built, at, bits).ok()?)?;
        let side = crate::arena::SideRecord::read_slots(self.built, crate::arena::side_of(self.built, at).ok()?).ok()?;
        Some(side.slots.iter().filter(|slot| slot.separator.is_some()).filter_map(|slot| Some(crate::layout::SlotLayout { slot: record.cells.iter().find(|cell| cell.word == slot.word)?.key.to_string(), separator: slot.separator, ..crate::layout::SlotLayout::default() })).collect())
    }

    /// A record's units are named by their sites, which keep their items
    /// around a list's holes where no separator is left to count them.
    fn unit_sides(&self, index: NodeIndex) -> Vec<crate::layout::UnitSides<G::Trivia>> {
        let Some(crate::arena::NodeSite::Record(at)) = self.table.site(index) else { return Vec::new() };
        let (shape, bits, _) = self.shape;
        let Some(record) = crate::arena::ArenaRead::header_kind(self.built, at, bits).ok().and_then(shape) else { return Vec::new() };
        let units = self.store.units(at, self.built).unwrap_or_default();
        units.into_iter().filter_map(|(word, item, trivia)| Some(crate::layout::UnitSides { slot: record.cells.iter().find(|cell| cell.word == word)?.key.to_owned(), item, trivia })).collect()
    }

    fn count_cached<V: HeapBytes>(&self, _: &V, _: Option<&V>) {}

    fn grew(&self) {}

    fn forget_met(&self) -> bool {
        self.table.begin_answer();
        self.asked.with(|asked| *asked = None);
        self.caches.slots.lock().unwrap_or_else(std::sync::PoisonError::into_inner).empty();
        self.caches.items.lock().unwrap_or_else(std::sync::PoisonError::into_inner).empty();
        true
    }

    fn nodes(&self) -> Navigation<'_> {
        Navigation::Runs(crate::arena::RunNodes::over(self.built, self.text, &self.table, self.shape))
    }

    fn node_index(&self, nodes: &mut Navigation<'_>, at: crate::slot::NodeIdOrCoordinate<'_>) -> Option<NodeIndex> {
        let crate::slot::NodeIdOrCoordinate::NodeId { id, .. } = at else { return None };
        let site = self.named(id)?;
        let index = match nodes {
            Navigation::Runs(runs) => runs.index_at(site),
            Navigation::Tree(_) => None,
        }?;
        if matches!(site, crate::arena::NodeSite::Row { .. }) {
            self.asked.with(|asked| *asked = Some((index, id)));
        }
        Some(index)
    }

    fn holds(&self, at: crate::slot::NodeIdOrCoordinate<'_>) -> bool {
        matches!(at, crate::slot::NodeIdOrCoordinate::NodeId { id, .. } if crate::arena::RunNodes::source_of(self.built, crate::arena::Address(id.address())).is_ok_and(|source| source == self.source))
    }

    fn is_source_root(&self, nodes: &mut Navigation<'_>, at: crate::slot::NodeIdOrCoordinate<'_>) -> bool {
        let crate::slot::NodeIdOrCoordinate::NodeId { id, .. } = at else { return false };
        match (self.named(id), nodes) {
            (Some(site), Navigation::Runs(runs)) => runs.is_source_root(site),
            _ => false,
        }
    }

    fn error_origin(&self, error: &Kid, ctx: &crate::read::ReadCtx<'_>) -> Option<crate::read::Origin> {
        let name = crate::read::NodeNames::name(self, error.index)?;
        Some(crate::read::Origin::Node(crate::query::NamedCoordinate { name, span: error.span(), kind: ctx.stamped_kind(error.grammar, error.display) }))
    }

    fn reader_at<'t>(&'t self, _: &mut Navigation<'t>, _: NodeIndex) -> Option<tree_sitter::TreeCursor<'t>> {
        None
    }

    fn reads(&self) -> Option<&dyn crate::arena::ArenaRead> {
        Some(self.built)
    }

    fn source_entry(&self) -> Option<crate::arena::Address> {
        Some(self.source)
    }

    fn place(&self, index: NodeIndex) -> Option<crate::trivia_store::Place> {
        crate::read::NodeNames::name(self, index).map(crate::trivia_store::Place::Node)
    }

    fn written_side(&self, _: NodeIndex, _: TriviaSide) -> Option<Vec<TriviaEntry<G::Trivia>>> {
        None
    }

    fn edited_in(&self, _: &mut dyn Nodes<'_>, index: NodeIndex, own_sides: bool) -> (bool, u64) {
        let Some(written) = self.written_sites() else { return (false, 0) };
        let mut runs = crate::arena::RunNodes::over(self.built, self.text, &self.table, self.shape);
        let mut walked = 0;
        let edited = written.into_iter().any(|(site, side)| {
            walked += 1;
            if runs.keeps(index, site) {
                return own_sides || side == TriviaSide::Inner;
            }
            runs.under(index, site)
        });
        (edited, walked)
    }

    fn set_apart(&self, index: NodeIndex) -> Option<crate::layout_kinds::LayoutKinds> {
        use crate::layout_kinds::LayoutKinds;
        let blank = [LayoutKinds::BLANKLINE, LayoutKinds::DOUBLE_BLANKLINE];
        let gaps = self.grammar.whitespace().0;
        Some(match self.place(index) {
            Some(place @ crate::trivia_store::Place::Node(_)) => blank.into_iter().find(|&gap| gaps.gap_kind(gap).is_some_and(|kind| self.store.ends_with_layout(place, TriviaSide::Trailing, kind, self.built).unwrap_or(false))).unwrap_or(LayoutKinds::NONE),
            _ => LayoutKinds::NONE,
        })
    }

    fn node_names(&self) -> Option<&dyn crate::read::NodeNames> {
        Some(self)
    }

    fn unit_text(&self, kind: KindId) -> Option<String> {
        self.unit_texts.with(|texts| texts.entry(kind).or_insert_with(|| (self.render_unit)(self, kind)).clone())
    }

    /// The starts the parse of the source's read kept in the side record its
    /// entry names (`read_entry_starts`), and those of the nodes a write gave
    /// a side since (`written_sites`), read once a call.
    fn entry_starts<R>(&self, answer: impl FnOnce(Option<&[u32]>) -> R) -> R {
        self.entry_starts.with(|starts| answer(starts.get_or_init(|| self.read_starts()).as_deref()))
    }

    fn named(&self, name: crate::types::NodeId) -> Option<crate::arena::NodeSite> {
        let (shape, bits, _) = self.shape;
        crate::arena::site::node_site(self.built, shape, bits, name).ok().filter(|site| !matches!(site, crate::arena::NodeSite::Unit(_)))
    }

    fn cover_side<'t>(&'t self, _: &mut Navigation<'t>, _: NodeIndex, _: TriviaSide) -> Option<&'t crate::trivia_table::Table> {
        None
    }

    fn depth_members(&self, _: &mut Navigation<'_>) -> Option<&crate::trivia_table::DepthMembers> {
        None
    }
}

#[cfg(feature = "arena")]
impl<G: EngineGrammar> crate::read::NodeNames for Records<'_, G> {
    fn name(&self, index: NodeIndex) -> Option<crate::types::NodeId> {
        let site = self.table.site(index)?;
        if let Some((_, name)) = self.asked.with(|asked| *asked).filter(|&(at, _)| at == index && matches!(site, crate::arena::NodeSite::Row { .. })) {
            return Some(name);
        }
        let (shape, bits, _) = self.shape;
        crate::arena::site::site_name_in_place(self.built, shape, bits, site).ok().flatten()
    }
}

#[cfg(feature = "arena")]
impl<'a, G: crate::arena::RecordGrammar> Records<'a, G> {
    /// The records a read left in `built` of the source the record at
    /// `record` was read from, as one call reads them through `engine`, the
    /// node of `record` the first the call names (`NodeIndex::ROOT`).
    ///
    /// # Errors
    ///
    /// What reading the record or its source's entry refuses,
    /// `ArenaError::Malformed` for a record that names no source and for a
    /// record an `ERROR` holds.
    pub fn over(engine: &'a Engine<G>, built: &'a crate::arena::BuiltChunks, record: crate::arena::Address) -> Result<Self, crate::arena::ArenaError> {
        let records = Self::of_source(engine, built, crate::arena::RunNodes::source_of(built, record)?)?;
        crate::arena::RunNodes::holding(built, records.text, record, &records.table, records.shape)?;
        Ok(records)
    }

    /// The records a read left in `built` of the source whose entry is at
    /// `source`, as one call reads them through `engine`, no node named yet.
    ///
    /// # Errors
    ///
    /// What reading the source's entry refuses.
    pub fn of_source(engine: &'a Engine<G>, built: &'a crate::arena::BuiltChunks, source: crate::arena::Address) -> Result<Self, crate::arena::ArenaError> {
        let crate::arena::source::Source { text, breaks_lf } = crate::arena::source::Source::read(built, source)?;
        Ok(Self {
            grammar: engine.grammar,
            built,
            table: crate::arena::RunTable::default(),
            shape: G::read_shape(),
            asked: PerCall::default(),
            entry_starts: PerCall::default(),
            source,
            text,
            breaks_lf,
            caches: ReadCaches::default(),
            options: &engine.options,
            store: engine.written.clone(),
            work: crate::layout::LayoutWorkCounter::default(),
            render_unit: Self::rendered_unit,
            unit_texts: PerCall::default(),
        })
    }

    /// A unit of `kind` rendered on its own: its kind's text.
    fn rendered_unit(&self, kind: KindId) -> Option<String> {
        struct NoSources;
        impl SourceTable for NoSources {
            fn source_of(&self, _: crate::slot::NodeIdOrCoordinate<'_>) -> Option<&str> {
                None
            }
        }
        let root = crate::arena::CellAt { cell: crate::arena::Cell::Unit { kind, row: None }, node: None, site: None };
        G::render_record(self.grammar, root, None, self.built, &self.store, &crate::prepare::RenderContext::new(self.options, &NoSources)).ok()
    }

    /// The index the call gives the node `address` names.
    ///
    /// # Errors
    ///
    /// A name of another source, whose bytes this call's text does not hold,
    /// a name no record of the source holds a node of, and a child past its
    /// parent's last.
    pub fn address_index(&self, nodes: &mut Navigation<'_>, address: crate::query::NamedAddress) -> Result<NodeIndex, String> {
        use crate::query::NamedAddress;
        let index = |name: crate::types::NodeId| {
            if crate::arena::RunNodes::source_of(self.built, crate::arena::Address(name.address())).map_err(|e| e.to_string())? != self.source {
                return Err(format!("{name:?} names a node of another source than the one this call reads"));
            }
            self.index_named(name).ok_or_else(|| format!("{name:?} names no node its source's records hold"))
        };
        match address {
            NamedAddress::Own(name) => index(name),
            NamedAddress::Child { parent, index: child } => {
                let parent = index(parent)?;
                nodes.kids(parent).get(child.get() as usize).map(|kid| kid.index).ok_or_else(|| format!("{address:?} names no node its source's records hold"))
            }
        }
    }

    /// The arena the records lie in.
    #[must_use]
    pub fn records_arena(&self) -> &'a dyn crate::arena::ArenaRead {
        self.built
    }

    /// The name the node this call knows by `index` keeps past it; none
    /// for an index the call gave no node, and for a node with no record
    /// of its own that no slot of its holder holds.
    #[must_use]
    pub fn name_at(&self, index: NodeIndex) -> Option<crate::types::NodeId> {
        crate::read::NodeNames::name(self, index)
    }

    /// The id this call gives the node `name` names; none for a name no
    /// record of the source holds a node of.
    #[must_use]
    pub fn index_named(&self, name: crate::types::NodeId) -> Option<NodeIndex> {
        self.index_at(self.named(name)?)
    }

    /// The id this call gives the node kept at `site`; none for a site no
    /// record of the source holds.
    #[must_use]
    pub fn index_at(&self, site: crate::arena::NodeSite) -> Option<NodeIndex> {
        crate::arena::RunNodes::over(self.built, self.text, &self.table, self.shape).index_at(site)
    }
}

impl<G: EngineGrammar> Drop for ParsedTree<G> {
    /// Drops the tree's sides (`release_sides`).
    fn drop(&mut self) {
        let _ = self.release_sides();
    }
}

/// A value the lookups of one call share and each changes in turn, for the
/// length of one answer: none holds it across another's.
#[derive(Default)]
pub struct PerCall<T>(std::cell::RefCell<T>);

impl<T> PerCall<T> {
    /// What `f` answers given the value to change.
    pub fn with<R>(&self, f: impl FnOnce(&mut T) -> R) -> R {
        f(&mut self.0.borrow_mut())
    }
}

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
/// each slot's stored separator.
#[derive(Debug, Default)]
pub struct NodeSlots {
    layouts: Vec<crate::layout::SlotLayout>,
}

impl HeapBytes for NodeSlots {
    fn heap_bytes(&self) -> usize {
        let Self { layouts } = self;
        layouts.heap_bytes()
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

/// Mint the next tree id from the process's one counter, which the engine
/// library holds (`sittir_engine::claim_tree_id`). Every engine of every
/// grammar claims from it, so no two of them ever hold a tree under the same
/// id: a coordinate names its tree unambiguously, and an engine handed
/// another engine's coordinate finds no such tree and refuses it rather than
/// slicing whatever tree sits at that index in its own table. Ids are never
/// reused — a stale handle must not come back to life under a later tree —
/// and a handle carries only ids up to `MAX_TREE_ID`, so every claim past it
/// gets `None`.
#[must_use]
pub fn claim_tree_id() -> Option<TreeClaim> {
    claim_on(sittir_engine::claim_tree_id())
}

fn claim_on(id: Option<u32>) -> Option<TreeClaim> {
    id.filter(|&id| id <= MAX_TREE_ID).map(|id| TreeClaim(TreeId(id)))
}

/// The one claim on a tree id a parse consumes (`Engine::parse`): minted only
/// by `claim_tree_id`, and neither copied nor cloned, so each tree holds an
/// id its own claim minted.
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

    /// The coordinate a read of this tree names the node at `index` by
    /// (`ReadCtx::coordinate_of`); `None` past its last node.
    #[must_use]
    pub fn row_coordinate(&self, index: NodeIndex) -> Option<NodeCoordinate> {
        lookups(self).coordinate(index)
    }

    /// Reject a handle minted by a different tree.
    ///
    /// Indexes are dense and restart at 0 every parse, so without this an
    /// out-of-tree handle lands in range and resolves to whatever node happens
    /// to sit at that index — an unrelated node returned as though it were the
    /// one asked for. The tag turns that into a refusal.
    ///
    /// # Errors
    ///
    /// A handle another tree minted.
    pub fn local_index(&self, handle: TreeHandle) -> Result<NodeIndex, String> {
        let (tree_id, index) = decode_handle(handle);
        if tree_id != self.tree_id {
            return Err(format!("handle {handle} belongs to tree {tree_id}, not tree {}", self.tree_id));
        }
        Ok(index)
    }

    /// Whether this tree minted `handle`.
    #[must_use]
    pub fn owns_handle(&self, handle: TreeHandle) -> bool {
        decode_handle(handle).0 == self.tree_id
    }

    /// Whether each node `addresses` names satisfies `plan`, in order. An
    /// address that names no node of this tree is refused.
    ///
    /// # Errors
    ///
    /// An address that names no node of this tree.
    pub fn plan_holds(&self, addresses: &[Address], plan: &Plan) -> Result<Vec<bool>, String> {
        self.plan_holds_over(addresses, |nodes, address| self.index_in(nodes, address), plan)
    }

    /// The descendant index of the node `address` names, found through
    /// `nodes`.
    fn index_in(&self, nodes: &mut Navigation<'_>, address: Address) -> Result<NodeIndex, String> {
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

    /// One batch of the walk under the node `from` names
    /// (`Backing::descendants_under`), each node it finds as the item a read
    /// hands out for it (`QueryItem`).
    ///
    /// # Errors
    ///
    /// An address that names no node of this tree, and a resume path that
    /// leaves it.
    pub fn descendants(&self, from: Address, kinds: &[KindId], plan: Option<&Plan>, resume: Option<&[ChildPosition]>, limit: u32, depth: Option<u32>) -> Result<DescendantBatch, String> {
        let mut nodes = Backing::nodes(self);
        let index = self.index_in(&mut nodes, from)?;
        let (found, resume) = self.descendants_under(&mut nodes, index, kinds, plan, resume, limit, depth)?;
        let ctx = self.read_ctx();
        let items = found
            .into_iter()
            .map(|item| match item {
                Descendant::Node(kid) => QueryItem::Node(QueryCoordinate::from(ctx.coordinate_of(&kid))),
                Descendant::Unit(kind) => QueryItem::Unit(kind),
            })
            .collect();
        Ok(DescendantBatch { items, resume, origin: encode_handle(self.tree_id, index) })
    }

    /// Whether a table the tree counts grew since the last call, and so
    /// holds other than its last report (`native_bytes`). A new tree has
    /// grown.
    pub fn take_grown(&mut self) -> bool {
        std::mem::take(self.grown.get_mut()) | self.trivia.take_grown()
    }

    /// What a walk of the read caches finds their values hold: the count
    /// `count_cached` keeps.
    #[cfg(test)]
    fn cached_by_walk(&mut self) -> usize {
        owned(&mut self.caches.slots).values().map(HeapBytes::heap_bytes).sum::<usize>()
            + owned(&mut self.caches.items).values().map(HeapBytes::heap_bytes).sum::<usize>()
    }

    /// Drops the tree's written sides, releasing the built records those
    /// held (`TriviaStore::release_rows`), and answers whether one did.
    /// Dropping the tree releases them too; once released, a release finds
    /// none.
    #[must_use]
    pub fn release_sides(&mut self) -> bool {
        self.store.release_rows(&self.sides.take())
    }

    /// Whether descendant `index` names a node of the tree.
    #[must_use]
    pub fn names(&self, index: NodeIndex) -> bool {
        index.index() < self.nodes as usize
    }

    /// How many steps the tree's placement has taken so far
    /// (`Placement::steps`), placing nothing.
    #[must_use]
    pub fn placement_steps(&self) -> u64 {
        self.trivia.steps()
    }

    /// The tree's trivia with every layout owner placed.
    pub fn placed_trivia(&self) -> &Placement {
        let grammar = self.grammar;
        self.trivia.place_all(crate::trivia_table::Source { nodes: &mut self.nodes(), routes: &|nodes: &mut dyn Nodes<'_>, at: &Kid| grammar.slot_routes(nodes, at) });
        &self.trivia
    }
}

impl<G: EngineGrammar> ParsedTree<G> {
    /// The bytes the tree holds natively: its own size and every table's
    /// heap, each counted by its capacity. tree-sitter's tree is left out,
    /// and so is a B-tree's node slack (`heap`).
    ///
    /// The count takes the tree mutably, so it reads every table without a
    /// lock, and nothing can hold one of them while it counts. A count is
    /// refused while anything borrows the tree:
    ///
    /// ```compile_fail,E0502
    /// use sittir_core::engine::Backing as _;
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
            breaks_lf: _,
            nodes: _,
            tree_id: _,
            caches: ReadCaches { lines, slots, items },
            trivia,
            depth_members,
            entries: _,
            options,
            cached,
            grown: _,
            work: _,
            store: _,
            sides,
        } = self;
        let tables = owned(slots).allocation() + owned(items).allocation();
        std::mem::size_of::<Self>()
            + source.heap_bytes()
            + lines.get().map_or(0, HeapBytes::heap_bytes)
            + trivia.heap_bytes()
            + depth_members.get().map_or(0, HeapBytes::heap_bytes)
            + options.heap_bytes()
            + tables
            + cached.load(std::sync::atomic::Ordering::Relaxed)
            + sides.bytes()
    }
}


impl<G: EngineGrammar> ParsedTree<G> {
    /// The parsed tree-sitter tree, each call counted in the tree's layout
    /// work (`LayoutWork::tree_reads`): every path to the tree passes here.
    pub fn tree(&self) -> &tree_sitter::Tree {
        self.work.tree_reads(1);
        &self.tree
    }
}


impl<G: EngineGrammar> ParsedTree<G> {
    /// Navigation of tree-sitter's tree for one call, its moves counted in
    /// the tree's layout work: what a reader of the tree's nodes reads
    /// through.
    #[must_use]
    pub fn tree_nodes(&self) -> TreeNodes<'_> {
        TreeNodes::new(self.tree(), &self.source, &self.work)
    }
}


impl<G: EngineGrammar> ParsedTree<G> {
    /// The node at `index` read into `T`, `depth` levels down, seating no
    /// sides; index 0 is the root.
    pub fn read<T: crate::read::ReadNode>(&self, index: crate::types::NodeIndex, depth: crate::read::Depth) -> Result<T, crate::read::ReadError> {
        crate::read::read_from::<T>(self.tree_nodes().reader(index), &mut self.read_ctx(), depth)
    }
}


impl<G: EngineGrammar> ParsedTree<G> {
    /// The node at `index` read into `T`, `depth` levels down, seating no
    /// sides and reading a list's items with it (`ReadCtx::inline_items`),
    /// or, when an `ERROR` holds it, that `ERROR` as `read_error` reads it:
    /// one navigation answers both. `None` past the tree's last node.
    pub fn read_node<T: crate::read::ReadNode>(&self, index: crate::types::NodeIndex, depth: crate::read::Depth) -> Option<Result<NodeRead<T>, crate::read::ReadError>> {
        let mut nodes = self.nodes();
        node(&mut nodes, index)?;
        let mut ctx = self.read_ctx().inline_items();
        if let Some(error) = nodes.error_holding(index) {
            return Some(Ok(NodeRead::Error(self.error_at(&error, &ctx)?)));
        }
        let mut cursor = self.reader_at(&mut nodes, index)?;
        Some(T::read(&mut cursor, &mut ctx, depth).map(NodeRead::Node))
    }
}


impl<G: EngineGrammar> ParsedTree<G> {
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
        self.store.adopt(&entries).map_err(|e| e.to_string())?;
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
}


// ─── Lookups ─────────────────────────────────────────────────────────────────

/// The lookups by descendant index one call makes in a tree, each through
/// the call's one navigation (`Navigation`), which moves its cursor from
/// where the last left it: a pass that looks up nodes near one another, as a
/// read in order does, costs the path between them, not the path from the
/// root. A lookup that reads or renders a node lends the cursor to that
/// read.
struct Lookups<'t, G: EngineGrammar, B: Backing<G>> {
    tree: &'t B,
    grammar: std::marker::PhantomData<fn() -> G>,
    nodes: Navigation<'t>,
    /// Each child of a node one of whose children's leading side was asked,
    /// by its index: for an item of a list slot, the blank-line kind the
    /// source sets it apart with (`list_slots::list_items`); none for any
    /// other child, for an item set apart with none, and for every child of
    /// a node whose bytes hold no blank line (`LineTable::holds_blank_line`),
    /// whose children are not routed.
    apart: HashMap<NodeIndex, Option<crate::layout_kinds::LayoutKinds>, crate::heap::IndexState>,
    /// The index the call gave each node it was asked about by its id.
    ids: HashMap<crate::types::NodeId, NodeIndex, crate::heap::IndexState>,
    /// Where the call's frames stand in the tree's entry starts.
    entries: EntryCursor,
    /// Whether these are a render's: each answer forgets the nodes the one
    /// before it met (`Backing::forget_met`).
    answers_alone: bool,
}

/// The node a source-table call names, as its lookups read it: its index
/// here, the bytes it is named over, the kind a read stamped on it, and the
/// edges whose neighbour its holder changed.
#[derive(Debug, Clone, Copy)]
struct Named {
    index: NodeIndex,
    span: Span,
    stamp: Option<KindId>,
    changed: crate::slot::ChangedEdges,
}

/// Where a walk stands in a sorted list of entry starts: the first start
/// not before the last span it asked about, and that span's start. A walk
/// that keeps to source order steps through the starts once and, past the
/// last, asks nothing; a span before the last one asked about, and the
/// first, seeks.
#[derive(Debug, Default, Clone, Copy)]
struct EntryCursor {
    at: Option<(usize, u32)>,
}

impl EntryCursor {
    /// Whether one of `starts` lies within `span`, both ends included.
    fn within(&mut self, starts: &[u32], span: Span) -> bool {
        let at = match self.at {
            Some((at, last)) if span.start >= last => {
                if at == starts.len() {
                    return false;
                }
                at + starts[at..].iter().take_while(|&&start| start < span.start).count()
            }
            _ => starts.partition_point(|&start| start < span.start),
        };
        self.at = Some((at, span.start));
        starts.get(at).is_some_and(|&start| start <= span.end)
    }
}

impl<G: EngineGrammar, B: Backing<G>> Lookups<'_, G, B> {
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

    /// Starts an answer of a render: where the backing names nodes by the
    /// ids its navigations give them, what the last answer met is forgotten.
    fn begin_answer(&mut self) {
        if self.answers_alone && self.tree.forget_met() {
            crate::heap::emptied(&mut self.ids);
            crate::heap::emptied(&mut self.apart);
        }
    }

    /// The index of the node `at` names, an id's kept for the call.
    fn index_of(&mut self, at: crate::slot::NodeIdOrCoordinate<'_>) -> Option<NodeIndex> {
        let id = match at {
            crate::slot::NodeIdOrCoordinate::NodeId { id, .. } => Some(id),
            crate::slot::NodeIdOrCoordinate::Coordinate(_) => None,
        };
        if let Some(index) = id.and_then(|id| self.ids.get(&id).copied()) {
            return Some(index);
        }
        let tree = self.tree;
        let index = tree.node_index(&mut self.nodes, at)?;
        if let Some(id) = id {
            self.ids.insert(id, index);
        }
        Some(index)
    }

    /// The node `at` names, a coordinate's facts its own and an id's read
    /// from its record through the id.
    fn named(&mut self, at: crate::slot::NodeIdOrCoordinate<'_>) -> Option<Named> {
        let index = self.index_of(at)?;
        Some(match at {
            crate::slot::NodeIdOrCoordinate::Coordinate(coord) => Named { index, span: coord.span, stamp: coord.kind, changed: coord.changed() },
            crate::slot::NodeIdOrCoordinate::NodeId { changed, .. } => {
                let kid = self.kid(index)?;
                Named { index, span: kid.span(), stamp: Some(self.tree.read_ctx().stamped_kind(kid.grammar, kid.display)), changed }
            }
        })
    }

    /// The entries `ParsedTree::side_entries` answers.
    fn side_entries(&mut self, index: NodeIndex, side: TriviaSide, edge_changed: bool) -> Vec<SideEntry<G::Trivia>> {
        let mut entries = self.seated(index, side, true);
        if edge_changed {
            crate::trivia::without_edge_runs(&mut entries, side, |entry| match entry {
                SideEntry::Layout(_) => true,
                SideEntry::Written(entry) => entry.is_layout(),
                SideEntry::Source { .. } => false,
            });
        }
        entries
    }


    /// The list slots of the node at `index`, measured on first use and
    /// kept (`list_slots::slot_gaps`). A slot's separator is the one most of
    /// its gaps hold, a tie going to the one the options write there
    /// (`ResolvedOptions::separator_of`), stored only where the options hold
    /// a separator site and it differs from that site's arm: a list with no
    /// site has the one separator its template writes.
    fn node_slots(&mut self, index: crate::types::NodeIndex) -> Arc<NodeSlots> {
        use crate::list_slots::{stored_separator, SlotGaps};
        let tree = self.tree;
        if let Some(slots) = tree.caches().slots.lock().unwrap_or_else(std::sync::PoisonError::into_inner).get(&index) {
            return Arc::clone(slots);
        }
        let at = self.nodes.kid(index);
        let mut measured = NodeSlots::default();
        if let Some(stamped) = tree.stamped_slots(index, at.grammar) {
            measured.layouts = stamped;
        } else {
            let slots = tree.grammar().slot_routes(&mut self.nodes, &at).map_or_else(Vec::new, |routed| crate::list_slots::slot_gaps(&routed));
            let preferred = tree.options().separator_of(at.grammar);
            for SlotGaps { key, gaps } in &slots {
                let kinds: Vec<KindId> = gaps.iter().map(|gap| gap.separator.kind).collect();
                let separator = stored_separator(&kinds, preferred);
                measured.layouts.push(crate::layout::SlotLayout { slot: (*key).to_string(), separator, ..crate::layout::SlotLayout::default() });
            }
        }
        let measured = Arc::new(measured);
        let replaced = tree.caches().slots.lock().unwrap_or_else(std::sync::PoisonError::into_inner).insert(index, Arc::clone(&measured));
        tree.count_cached(&measured, replaced.as_ref());
        measured
    }

    /// What `ParsedTree::slot_separator` answers.
    fn slot_separator(&mut self, index: NodeIndex) -> Option<KindId> {
        let stored = self.node_slots(index).layouts.iter().find_map(|layout| layout.separator);
        stored.or_else(|| self.tree.options().separator_of(self.kid(index)?.grammar))
    }

    /// What `ParsedTree::slot_layouts` answers.
    fn slot_layouts(&mut self, index: NodeIndex) -> Vec<crate::layout::SlotLayout> {
        self.node_slots(index).layouts.iter().filter(|layout| !layout.is_empty()).cloned().collect()
    }

    /// The entries of `side` of the node at `index`. A node the engine's
    /// store keeps the sides of has the ones its store holds, each record a
    /// read left as its node's coordinate while that node renders as its
    /// source (`parse_placed`, `read_entry`): those a write gave it, as
    /// written, else those its parse placed, as the assignment gives them.
    /// Any other node
    /// has the ones a write gave it, else, in a tree its parse did not place
    /// (`Backing::PLACED_AT_PARSE`), the ones the assignment gives it
    /// (`assigned`, with its layout when `layout`).
    fn seated(&mut self, index: NodeIndex, side: TriviaSide, layout: bool) -> Vec<SideEntry<G::Trivia>> {
        let tree = self.tree;
        let stored = match tree.place(index) {
            #[cfg(feature = "arena")]
            Some(place) => {
                let stored = tree.reads().and_then(|arena| tree.store().side(place, side, arena).ok().flatten()).unwrap_or_default();
                let placed = stored.into_iter().filter_map(|entry| self.parse_placed(entry, layout || tree.store().edited(place, side)));
                if !tree.store().edited(place, side) {
                    return placed.collect();
                }
                return placed.map(|entry| SideEntry::Written(entry.into_entry())).collect();
            }
            #[cfg(not(feature = "arena"))]
            Some(_) => Vec::new(),
            None => match tree.written_side(index, side) {
                Some(written) => written,
                None if B::PLACED_AT_PARSE => Vec::new(),
                None => return self.assigned(index, side, layout),
            },
        };
        stored.into_iter().map(SideEntry::Written).collect()
    }

    /// The index of the node this tree's read left `entry`'s record for,
    /// while that node renders as its source (`renders_as_source`). A record
    /// another read left keeps its own source.
    #[cfg(feature = "arena")]
    fn read_index(&mut self, entry: &TriviaEntry<G::Trivia>) -> Option<NodeIndex> {
        let TriviaEntry::Record(record) = entry else { return None };
        let tree = self.tree;
        let ours = tree.reads().and_then(|arena| crate::arena::RunNodes::source_of(arena, record.record.at).ok()).is_some_and(|source| tree.source_entry() == Some(source));
        if !ours {
            return None;
        }
        let index = match &mut self.nodes {
            Navigation::Runs(runs) => runs.index_of(record.record.at).ok(),
            Navigation::Tree(_) => None,
        }?;
        self.renders_as_source(index).then_some(index)
    }

    /// An entry of a side its parse placed, as the assignment gives it
    /// (`placement_side`): a read's record that renders as its source
    /// (`read_index`) as that, an `ERROR` as its text, which holds no sides,
    /// and a whitespace member as layout, kept only when `layout`.
    #[cfg(feature = "arena")]
    fn parse_placed(&mut self, entry: TriviaEntry<G::Trivia>, layout: bool) -> Option<SideEntry<G::Trivia>> {
        let Some(kid) = self.read_index(&entry).and_then(|index| self.kid(index)) else {
            return if entry.is_layout() { layout.then_some(SideEntry::Layout(entry)) } else { Some(SideEntry::Written(entry)) };
        };
        let (kind, span) = (self.tree.read_ctx().stamped_kind(kid.grammar, kid.display), kid.span());
        if kind == KindId::ERROR {
            let text = TriviaText::of_source(KindId::ERROR, self.tree.source(), span, None);
            return Some(SideEntry::Source { kind, span, entry: TriviaEntry::new(SlotValue::Node(G::Trivia::from_text(text))) });
        }
        let TriviaEntry::Record(mut record) = entry else { return None };
        record.as_source = Some(crate::trivia::SourceEntry { span, source: self.tree.source_entry()?, edges: None });
        Some(SideEntry::Source { kind, span, entry: TriviaEntry::Record(record) })
    }

    /// The entries the assignment gives `side` of the node at `index`: each
    /// extra, `ERROR` and member, and when `layout` the line-break members of
    /// the gaps the side holds and a list item's blank line, as a parse
    /// places them in arena storage. Every other gap takes the options.
    fn assigned(&mut self, index: NodeIndex, side: TriviaSide, layout: bool) -> Vec<SideEntry<G::Trivia>> {
        let mut entries = self.placement_side(index, side, layout);
        if side == TriviaSide::Trailing && layout {
            self.list_item_trailing(index, &mut entries);
        }
        entries
    }

    /// The trailing side of the node at `index` as a rebuilt list writes it
    /// when the node is an item of a list slot the source sets apart from
    /// the item after it (`list_slots::list_items`): the member of the
    /// blank-line kind it sets it apart with last.
    fn list_item_trailing(&mut self, index: NodeIndex, entries: &mut Vec<SideEntry<G::Trivia>>) {
        let apart = match self.tree.set_apart(index) {
            Some(apart) => Some(apart).filter(|&kind| kind != crate::layout_kinds::LayoutKinds::NONE),
            None => self.routed_apart(index),
        };
        let Some(kind) = apart else { return };
        let blank = self.tree.layout_member(kind);
        entries.extend(blank.map(|member| SideEntry::Layout(TriviaEntry::new(SlotValue::Node(member)))));
    }

    /// The blank-line kind the source sets the item after the node at
    /// `index` apart from it with, the node an item of a list slot
    /// (`list_slots::list_items`) or the element at the trailing edge of the
    /// wrapper that item is (`SurfaceKinds::exposes_in_place`), its holder routed
    /// once for all its children, and none when the holder's bytes hold no
    /// blank line (`LineTable::holds_blank_line`).
    fn routed_apart(&mut self, index: NodeIndex) -> Option<crate::layout_kinds::LayoutKinds> {
        if !self.apart.contains_key(&index) {
            let wrappers = self.tree.grammar().surface_kinds().wrappers;
            let mut item = index;
            let parent = loop {
                let parent = self.nodes.parent(item)?;
                if !wrappers.contains(&self.nodes.kid(parent).grammar) || self.edge_item(parent, TriviaSide::Trailing) != Some(item) {
                    break parent;
                }
                item = parent;
            };
            let tree = self.tree;
            let at = self.nodes.kid(parent);
            let routed = if tree.lines().holds_blank_line(at.span()) == Some(false) { None } else { tree.grammar().slot_routes(&mut self.nodes, &at) };
            if let Some(routed) = routed {
                self.apart.extend(routed.children.iter().map(|child| (child.index, None)));
                for (item, kind) in crate::list_slots::list_items(&routed, tree.source()) {
                    let mut at = item;
                    while let Some(inner) = self.edge_item(at, TriviaSide::Trailing) {
                        self.apart.entry(at).or_insert(None);
                        at = inner;
                    }
                    self.apart.insert(at, kind);
                }
            } else {
                let kids = self.nodes.kids(parent);
                self.apart.extend(kids.iter().map(|kid| (kid.index, None)));
            }
            self.apart.entry(index).or_insert(None);
        }
        self.apart[&index]
    }

    /// The entries the placement gives `side` of the node at `index`
    /// (`assigned`), before a list writes its item's leading side: each
    /// extra, `ERROR` and member in source order, and when `layout` the
    /// layout members of the gaps the side holds
    /// (`trivia_table::with_line_breaks`), but none for the single line
    /// break after an entry that ends its line (`ResolvedOptions::ends_line`),
    /// which is its own (`After::beyond_own_break`); none inside a node that
    /// has no inside
    /// (`SurfaceKinds::has_inside`).
    fn placement_side(&mut self, index: NodeIndex, side: TriviaSide, layout: bool) -> Vec<SideEntry<G::Trivia>> {
        let tree = self.tree;
        if side == TriviaSide::Inner && self.kid(index).is_some_and(|kid| !tree.grammar().surface_kinds().has_inside(kid.grammar)) {
            return Vec::new();
        }
        let Some(table) = tree.cover_side(&mut self.nodes, index, side) else { return Vec::new() };
        let assigned = table.side(index, side);
        if assigned.is_empty() {
            return Vec::new();
        }
        let ctx = tree.read_ctx();
        let entry = TriviaEntry::new;
        let entries: Vec<_> = assigned
            .iter()
            .filter_map(|&assigned| {
                let kid = self.kid(assigned.index())?;
                let (before, after) = crate::trivia_table::line_breaks_beside(tree.source(), kid.span(), kid.grammar);
                let breaks = (before, crate::trivia_table::beyond_own_break(after, tree.options().ends_line(kid.grammar)));
                if let crate::trivia_table::Assigned::Error(_) = assigned {
                    let text = TriviaText::of_source(kid.grammar, tree.source(), kid.span(), None);
                    return Some((SideEntry::Source { kind: kid.grammar, span: kid.span(), entry: entry(SlotValue::Node(G::Trivia::from_text(text))) }, breaks));
                }
                let coord = ctx.coordinate_of(&kid);
                Some((SideEntry::Source { kind: coord.kind?, span: coord.span, entry: entry(SlotValue::Coord(coord)) }, breaks))
            })
            .collect();
        let mut seated = Vec::with_capacity(2 * entries.len());
        if layout {
            let layout_of = |gap| tree.layout_member(gap).map(|member| SideEntry::Layout(entry(SlotValue::Node(member))));
            crate::trivia_table::with_line_breaks(side, entries, layout_of, &mut seated);
        } else {
            seated.extend(entries.into_iter().map(|(entry, _)| entry));
        }
        seated
    }

    /// What `SideLookup::leading_start` answers: the first byte of the source
    /// extras and `ERROR`s seated on the leading side of the node at `index`
    /// and of each edge item it passes that side to (`edge_item`), as its
    /// render frames them (`frame_levels`), the sides' layout left
    /// unmeasured; none on a side a write gave it, whose entries a snapshot
    /// does not measure.
    fn leading_start(&mut self, index: NodeIndex) -> Option<u32> {
        let (mut at, mut first): (Option<NodeIndex>, Option<u32>) = (Some(index), None);
        while let Some(node) = at {
            let own = self.seated(node, TriviaSide::Leading, false).iter().filter_map(|entry| match entry {
                SideEntry::Source { span, .. } => Some(span.start),
                SideEntry::Layout(_) | SideEntry::Written(_) => None,
            }).min();
            first = match (first, own) {
                (Some(first), Some(own)) => Some(first.min(own)),
                (first, own) => first.or(own),
            };
            at = self.edge_item(node, TriviaSide::Leading);
        }
        first
    }

    /// The first and last child of the node at `index`, extras and `ERROR`s
    /// included, a fixed token or unit its render body writes at an edge
    /// standing at that edge of its bytes (`SideLookup::end_children`).
    fn end_children(&mut self, index: NodeIndex) -> Option<[Kid; 2]> {
        let holder = self.kid(index)?;
        let options = self.tree.options();
        let mut at = |side: crate::options::Side| {
            if self.nodes.edge_token(&holder, side, &|kind| options.separator_of(kind)).is_none() {
                return self.nodes.edge(index, side);
            }
            let edge = if side == crate::options::Side::Before { holder.start } else { holder.end };
            Some(Kid { start: edge, end: edge, count: 1, extra: false, ..holder })
        };
        Some([at(crate::options::Side::Before)?, at(crate::options::Side::After)?])
    }

    /// The sides a coordinate of the node at `index` renders between, as
    /// `entries` gives each node's, outermost first, each frame's leading,
    /// trailing and inner sides: the node's own, then a frame for each item
    /// a list at its start or its end passes the extras and `ERROR`s of that
    /// edge to (`trivia_table::edge_item`), holding that one side, as the item
    /// frames itself where the list is read as a node. The coordinate's bytes
    /// hold each item's. A node no entry can be within reads no side
    /// (`Backing::entry_starts`, through the call's cursor): its one frame
    /// is empty.
    fn frame_levels(&mut self, index: NodeIndex, mut entries: impl FnMut(&mut Self, NodeIndex, TriviaSide) -> Vec<SideEntry<G::Trivia>>) -> Vec<[Vec<SideEntry<G::Trivia>>; 3]> {
        if let Some(span) = self.kid(index).map(|kid| kid.span()) {
            let cursor = &mut self.entries;
            if !self.tree.entry_starts(|starts| starts.is_none_or(|starts| cursor.within(starts, span))) {
                return vec![[Vec::new(), Vec::new(), Vec::new()]];
            }
        }
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
    /// edge's extras and `ERROR`s pass to (`trivia_table::edge_item`).
    fn edge_item(&mut self, index: NodeIndex, side: TriviaSide) -> Option<NodeIndex> {
        let tree = self.tree;
        if !tree.holds_entries(&mut self.nodes, index) {
            return None;
        }
        let list = self.kid(index)?;
        let kinds = self.tree.grammar().surface_kinds();
        crate::trivia_table::edge_item(&mut self.nodes, &list, kinds, side).map(|item| item.index)
    }

    /// The sides `at` renders between, as the tree's table and writes give
    /// each node's (`frame_levels`, `side_entries`).
    fn side_levels(&mut self, at: Named) -> Vec<[Vec<SideEntry<G::Trivia>>; 3]> {
        let changed = at.changed;
        self.frame_levels(at.index, |lookups, node, side| lookups.side_entries(node, side, changed.on(side)))
    }

    /// What `SourceTable::framed_span` answers for `at`: the extras and
    /// `ERROR`s of its sides as `side_levels` seats them, which their layout
    /// does not move.
    fn framed_span(&mut self, at: Named) -> Span {
        let levels = self.frame_levels(at.index, |lookups, node, side| lookups.seated(node, side, false));
        let spans = |side: usize| {
            levels.iter().flat_map(move |level| &level[side]).filter_map(|entry| match entry {
                SideEntry::Source { span, .. } => Some(*span),
                SideEntry::Layout(_) | SideEntry::Written(_) => None,
            })
        };
        Span {
            start: spans(0).map(|span| span.start).min().map_or(at.span.start, |start| start.min(at.span.start)),
            end: spans(1).map(|span| span.end).max().map_or(at.span.end, |end| end.max(at.span.end)),
        }
    }

    /// Whether a write replaced a side of a node under the node at `index`
    /// or of its own `inner` (`ParsedTree::edited_within`).
    fn edited_within(&mut self, index: NodeIndex) -> bool {
        edited_under(self.tree, &mut self.nodes, index, false)
    }

    /// Whether the node at `index` still renders as its source: no write
    /// lies in it (`edited_within`). The one test a render's root
    /// (`arena::source_root`), a record's prepared sides
    /// (`SourceTable::renders_as_source`) and a side its parse placed
    /// (`parse_placed`) apply to a read's node.
    fn renders_as_source(&mut self, index: NodeIndex) -> bool {
        !self.edited_within(index)
    }

    /// What `SourceTable::for_each_descendant` answers for the node at
    /// `index`: each node of its subtree in preorder, below a node `visit`
    /// refuses none.
    fn for_each_descendant(&mut self, index: NodeIndex, visit: &mut dyn FnMut(KindId, &str) -> bool) {
        if self.kid(index).is_none() {
            return;
        }
        let source = self.tree.source();
        self.nodes.walk(index, &mut |step, kid| {
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
        #[cfg(feature = "arena")]
        if let Navigation::Runs(runs) = &mut self.nodes {
            return runs.line_starts(index, self.tree.source()).ok();
        }
        Some(line_starts_inside_tokens(&mut self.nodes, index, self.tree.source()))
    }

    /// What `SourceTable::list_delimiter` answers: the delimiter of the node
    /// of `kind` at the span `at` names, going down from it.
    fn list_delimiter(&mut self, at: Named, kind: KindId) -> Option<crate::types::Delimiter> {
        let list = node_at_span(&mut self.nodes, at.index, at.span, kind)?;
        self.tree.grammar().delimiter(&mut self.nodes, &list)
    }

    /// Visits the levels at the edge on `side` of `at`
    /// (`SourceTable::for_each_edge_level`).
    fn edge_levels(&mut self, at: Named, side: crate::options::Side, f: &mut dyn FnMut(crate::render::EdgeLevel)) {
        let Some(kid) = self.kid(at.index) else { return };
        f(crate::render::EdgeLevel { stamp: at.stamp.unwrap_or(kid.grammar), grammar: kid.grammar, display: kid.display, field: None });
        let (ctx, options) = (self.tree.read_ctx(), self.tree.options());
        let holder = Kid { start: at.span.start, end: at.span.end, ..kid };
        crate::nodes::for_each_edge_part(&mut self.nodes, &holder, side, &|grammar, display| ctx.stamped_kind(grammar, display), &|kind| options.separator_of(kind), f);
    }

    fn spelled_end_kind(&mut self, at: Named) -> Option<KindId> {
        let kid = self.kid(at.index).filter(|kid| kid.span() == at.span)?;
        let end = crate::nodes::spelled_end(&mut self.nodes, &kid);
        (end.index != kid.index).then_some(end.grammar)
    }

    /// The levels `at` opens net of those it closes
    /// (`SourceTable::depth_move`), its node found only when the grammar has
    /// depth members.
    fn depth_move(&mut self, at: Named) -> i32 {
        let tree = self.tree;
        if !tree.grammar().surface_kinds().has_depth_members() {
            return 0;
        }
        let Some(kid) = self.kid(at.index).filter(|kid| kid.span() == at.span) else {
            return 0;
        };
        #[cfg(feature = "arena")]
        if let Navigation::Runs(runs) = &mut self.nodes {
            return runs.depth_move(at.index, tree.grammar().surface_kinds()).unwrap_or(0);
        }
        tree.depth_members(&mut self.nodes).map_or(0, |members| members.between(at.index, at.index + kid.count))
    }

    /// The seat of the node at `index` through the wrappers it is
    /// (`SourceTable::seat_through`).
    fn seat_through(&mut self, index: NodeIndex, wrappers: &[Option<crate::options::SeatPath>], seat: &dyn Fn(KindId) -> Option<crate::types::SiteId>) -> Option<crate::types::SiteId> {
        let mut at = self.kid(index)?;
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
pub struct Seating<'t, G: EngineGrammar, B: Backing<G> = ParsedTree<G>> {
    lookups: std::cell::RefCell<Lookups<'t, G, B>>,
}

impl<'t, G: EngineGrammar, B: Backing<G>> Seating<'t, G, B> {
    /// The sides of `lookups`' tree with their layout and writes.
    fn new(lookups: Lookups<'t, G, B>) -> Self {
        Self { lookups: std::cell::RefCell::new(lookups) }
    }

    /// The tree these lookups are in.
    fn tree(&self) -> &'t B {
        self.lookups.borrow().tree
    }

    /// These lookups as a render's: each answer holds its nodes alone.
    fn answering_alone(self) -> Self {
        self.lookups.borrow_mut().answers_alone = true;
        self
    }

    /// The lookups and the node `at` names, when their tree holds it.
    fn own(&self, at: crate::slot::NodeIdOrCoordinate<'_>) -> Option<(std::cell::RefMut<'_, Lookups<'t, G, B>>, Named)> {
        let mut lookups = self.lookups.borrow_mut();
        lookups.begin_answer();
        let named = lookups.named(at)?;
        Some((lookups, named))
    }

    /// The context a read of the tree seats each node's sides with from
    /// these lookups.
    #[must_use]
    pub fn ctx(&self) -> crate::read::ReadCtx<'_> {
        self.tree().read_ctx().with_sides(self)
    }

    /// The routed children of the node at `index` (`ParsedTree::routed`),
    /// found through the lookups' own navigation.
    fn routed(&self, index: NodeIndex) -> Arc<Option<crate::read::Routed>> {
        let mut lookups = self.lookups.borrow_mut();
        let tree = lookups.tree;
        tree.routed(&mut lookups.nodes, index)
    }

    /// `f` of the lookups' own navigation.
    fn navigated<R>(&self, f: impl FnOnce(&mut dyn Nodes<'t>) -> R) -> R {
        f(&mut self.lookups.borrow_mut().nodes)
    }

}

impl<'t, G: EngineGrammar> Seating<'t, G> {
    /// A cursor on the node at `index`, created at the tree's root: a copy
    /// of the lookups' own, moved there from where it stood.
    #[must_use]
    pub fn cursor(&self, index: NodeIndex) -> tree_sitter::TreeCursor<'t> {
        let mut lookups = self.lookups.borrow_mut();
        let tree = lookups.tree;
        match lookups.nodes.reader(index) {
            Some(cursor) => cursor.clone(),
            None => tree.tree_nodes().reader(index).clone(),
        }
    }
}

impl<G: EngineGrammar, B: Backing<G>> crate::read::SideLookup for Seating<'_, G, B> {
    fn side(&self, index: NodeIndex, side: TriviaSide, edge_changed: bool) -> Box<dyn std::any::Any> {
        let mut lookups = self.lookups.borrow_mut();
        Box::new(lookups.side_entries(index, side, edge_changed))
    }

    fn slots(&self, index: NodeIndex) -> Vec<crate::layout::SlotLayout> {
        self.lookups.borrow_mut().slot_layouts(index)
    }

    fn end_children(&self, index: NodeIndex) -> Option<[Kid; 2]> {
        self.lookups.borrow_mut().end_children(index)
    }

    fn leading_start(&self, index: NodeIndex) -> Option<u32> {
        self.lookups.borrow_mut().leading_start(index)
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

/// One source as a render's source table: the nodes it holds resolve, any
/// other's do not.
impl<G: EngineGrammar, B: Backing<G>> SourceTable for Seating<'_, G, B> {
    fn source_of(&self, at: crate::slot::NodeIdOrCoordinate<'_>) -> Option<&str> {
        let tree = self.tree();
        tree.holds(at).then_some(tree.source())
    }

    fn breaks_spelled_lf(&self, at: crate::slot::NodeIdOrCoordinate<'_>) -> bool {
        let tree = self.tree();
        tree.holds(at) && tree.breaks_lf()
    }

    fn kind_of(&self, at: crate::slot::NodeIdOrCoordinate<'_>) -> Option<KindId> {
        let (mut lookups, named) = self.own(at)?;
        lookups.kid(named.index).map(|kid| kid.grammar)
    }

    fn for_each_descendant(&self, at: crate::slot::NodeIdOrCoordinate<'_>, visit: &mut dyn FnMut(KindId, &str) -> bool) {
        if let Some((mut lookups, named)) = self.own(at) {
            lookups.for_each_descendant(named.index, visit);
        }
    }

    fn line_starts_inside_tokens(&self, at: crate::slot::NodeIdOrCoordinate<'_>) -> Vec<u32> {
        self.own(at).and_then(|(mut lookups, named)| lookups.line_starts(named.index)).unwrap_or_default()
    }

    fn slot_layouts(&self, at: crate::slot::NodeIdOrCoordinate<'_>) -> Vec<crate::layout::SlotLayout> {
        self.own(at).map_or_else(Vec::new, |(mut lookups, named)| lookups.slot_layouts(named.index))
    }

    fn sides(&self, at: crate::slot::NodeIdOrCoordinate<'_>) -> Option<Box<dyn crate::trivia::FramedTrivia>> {
        let (mut lookups, named) = self.own(at)?;
        let levels = lookups.side_levels(named);
        framed(levels.into_iter().take(1)).pop()
    }

    fn frames(&self, at: crate::slot::NodeIdOrCoordinate<'_>) -> crate::trivia::Frames {
        self.own(at).map_or_else(crate::trivia::Frames::default, |(mut lookups, named)| frames_of(lookups.side_levels(named)))
    }

    fn framed_span(&self, at: crate::slot::NodeIdOrCoordinate<'_>) -> Option<Span> {
        match self.own(at) {
            Some((mut lookups, named)) => Some(lookups.framed_span(named)),
            None => match at {
                crate::slot::NodeIdOrCoordinate::Coordinate(coord) => Some(coord.span),
                crate::slot::NodeIdOrCoordinate::NodeId { .. } => None,
            },
        }
    }

    fn edited_within(&self, at: crate::slot::NodeIdOrCoordinate<'_>) -> bool {
        self.own(at).is_some_and(|(mut lookups, named)| lookups.edited_within(named.index))
    }

    fn renders_as_source(&self, at: crate::slot::NodeIdOrCoordinate<'_>) -> bool {
        self.own(at).is_some_and(|(mut lookups, named)| lookups.renders_as_source(named.index))
    }

    fn seat_through(&self, at: crate::slot::NodeIdOrCoordinate<'_>, wrappers: &[Option<crate::options::SeatPath>], seat: &dyn Fn(KindId) -> Option<crate::types::SiteId>) -> Option<crate::types::SiteId> {
        let (mut lookups, named) = self.own(at)?;
        lookups.seat_through(named.index, wrappers, seat)
    }

    fn read_node(&self, coord: &NodeCoordinate, read: &mut dyn FnMut(&mut tree_sitter::TreeCursor<'_>, &mut crate::read::ReadCtx<'_>)) -> bool {
        let cursor = self.own(coord.into()).and_then(|(mut lookups, named)| {
            lookups.kid(named.index)?;
            let tree = lookups.tree;
            tree.reader_at(&mut lookups.nodes, named.index)
        });
        let Some(mut cursor) = cursor else { return false };
        read(&mut cursor, &mut self.ctx());
        true
    }

    fn list_delimiter(&self, at: crate::slot::NodeIdOrCoordinate<'_>, kind: KindId) -> Option<crate::types::Delimiter> {
        let (mut lookups, named) = self.own(at)?;
        lookups.list_delimiter(named, kind)
    }

    fn for_each_edge_level(&self, at: crate::slot::NodeIdOrCoordinate<'_>, side: crate::options::Side, f: &mut dyn FnMut(crate::render::EdgeLevel)) {
        if let Some((mut lookups, named)) = self.own(at) {
            lookups.edge_levels(named, side, f);
        }
    }

    fn spelled_end_kind(&self, at: crate::slot::NodeIdOrCoordinate<'_>) -> Option<KindId> {
        let (mut lookups, named) = self.own(at)?;
        lookups.spelled_end_kind(named)
    }

    fn depth_move(&self, at: crate::slot::NodeIdOrCoordinate<'_>) -> i32 {
        self.own(at).map_or(0, |(mut lookups, named)| lookups.depth_move(named))
    }

    fn span_of(&self, at: crate::slot::NodeIdOrCoordinate<'_>) -> Option<Span> {
        self.own(at).map(|(_, named)| named.span)
    }

    fn stamp_of(&self, at: crate::slot::NodeIdOrCoordinate<'_>) -> Option<KindId> {
        self.own(at).and_then(|(_, named)| named.stamp)
    }

    fn same_node(&self, one: crate::types::NodeId, other: crate::types::NodeId) -> bool {
        one == other || self.own(crate::slot::NodeIdOrCoordinate::of(one)).is_some_and(|(mut lookups, named)| lookups.index_of(crate::slot::NodeIdOrCoordinate::of(other)) == Some(named.index))
    }

    fn is_source_root(&self, at: crate::slot::NodeIdOrCoordinate<'_>) -> bool {
        let mut lookups = self.lookups.borrow_mut();
        lookups.begin_answer();
        let tree = lookups.tree;
        tree.is_source_root(&mut lookups.nodes, at)
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
    /// The render options: resolved at construction, replaced by
    /// `set_options`; a render call may resolve another table over them.
    options: ResolvedOptions,
    /// The sides a write set on any node this engine renders, shared with
    /// every tree it parses.
    written: TriviaStore<G::Trivia>,
}

impl<G: EngineGrammar> Engine<G> {
    pub fn new(grammar: G, options: ResolvedOptions) -> Result<Self, String> {
        #[cfg(feature = "arena")]
        let written = TriviaStore::for_records(G::KIND_BITS, G::shape).with_whitespace(grammar.whitespace().0);
        #[cfg(not(feature = "arena"))]
        let written = TriviaStore::with_kind_bits(G::KIND_BITS);
        Self::with_store(grammar, options, written)
    }

    /// An engine whose store of written sides, and the built arena it
    /// holds, is `written`.
    ///
    /// # Errors
    ///
    /// What the grammar's parser configuration refuses, and, with arena
    /// storage, a grammar with more field ids than a node's packed facts hold
    /// (`arena::side::FIELD_BITS`).
    pub fn with_store(grammar: G, options: ResolvedOptions, written: TriviaStore<G::Trivia>) -> Result<Self, String> {
        let mut parser = tree_sitter::Parser::new();
        grammar.configure_parser(&mut parser)?;
        #[cfg(feature = "arena")]
        if let Some(fields) = parser.language().map(|language| language.field_count()).filter(|&fields| fields >> crate::arena::side::FIELD_BITS != 0) {
            return Err(format!("the grammar has {fields} field ids, more than a node's {} field bits hold", crate::arena::side::FIELD_BITS));
        }
        Ok(Self {
            grammar,
            parser,
            options,
            written,
        })
    }

    pub fn options(&self) -> &ResolvedOptions {
        &self.options
    }

    /// Replace the engine's render options with `table`. Trees parsed
    /// earlier read their nodes under the options they were read with; a
    /// render takes the engine's options as they stand when it runs.
    pub fn set_options(&mut self, table: ResolvedOptions) {
        self.options = table;
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
    /// on (`claim_tree_id`).
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
        let nodes = crate::read::descendant_count(&tree.root_node());
        Ok(self.tree_of(tree, Arc::from(source), !source.contains('\r'), nodes, tree_id))
    }

    /// A tree of this engine over `tree` and its `source`, read under the
    /// engine's options.
    fn tree_of(&self, tree: tree_sitter::Tree, source: Arc<str>, breaks_lf: bool, nodes: u32, tree_id: TreeId) -> ParsedTree<G> {
        let mut parsed = ParsedTree {
            grammar: self.grammar,
            nodes,
            tree,
            source,
            breaks_lf,
            tree_id,
            caches: ReadCaches::default(),
            trivia: Placement::new(self.grammar.surface_kinds()),
            depth_members: std::sync::OnceLock::new(),
            entries: true,
            options: self.options.clone(),
            cached: std::sync::atomic::AtomicUsize::new(0),
            grown: std::sync::atomic::AtomicBool::new(true),
            work: crate::layout::LayoutWorkCounter::default(),
            store: self.written.clone(),
            sides: crate::trivia_store::SideRows::default(),
        };
        parsed.entries = self.grammar.surface_kinds().named_extras || parsed.nodes().holds_error(NodeIndex::ROOT);
        parsed
    }

    #[cfg(feature = "arena")]
    /// Writes each side a parse placed its source's extras and `ERROR`s on,
    /// as a caller writes a built node's: its entries in document order,
    /// each the record it names, with the layout members of the gaps the
    /// side holds as the source spaces them (`trivia_table::with_line_breaks`),
    /// save the single line break after an entry that ends its line
    /// (`trivia_table::beyond_own_break`). The rest are the gaps a parent
    /// writes. On the trailing side of each list item the parse set apart
    /// from the item after it (`apart`, or a record's header) the member of
    /// the blank-line kind it set it apart with comes last.
    fn place_extras(&self, placed: Vec<crate::arena::Placed>, apart: Vec<(crate::arena::NodeSite, crate::layout_kinds::LayoutKinds)>) -> Result<(), crate::arena::ArenaError> {
        use crate::layout_kinds::LayoutKinds;
        use crate::trivia_store::CompactEntry;
        let gaps = self.grammar.whitespace().0;
        let member = |gap| gaps.gap_kind(gap).map(|kind| CompactEntry::Layout { kind });
        let mut met: Vec<((crate::arena::NodeSite, TriviaSide), Result<crate::arena::Placed, LayoutKinds>)> = Vec::with_capacity(placed.len() + apart.len());
        met.extend(apart.into_iter().map(|(site, kind)| ((site, TriviaSide::Trailing), Err(kind))));
        met.extend(placed.into_iter().map(|extra| ((extra.site, extra.side), Ok(extra))));
        met.sort_by_key(|&(key, _)| key);
        let mut chunks = self.written.built_mut();
        let mut known = crate::arena::site::RowSites::default();
        for run in met.chunk_by(|(one, _), (other, _)| one == other) {
            let ((site, side), _) = run[0];
            let mut kept = Vec::with_capacity(2 * run.len());
            let header_apart = match (site, side) {
                (crate::arena::NodeSite::Record(at), TriviaSide::Trailing) => Some(crate::arena::cell::HeaderLayout::of(crate::arena::ArenaRead::word(&*chunks, at)?, G::KIND_BITS)?.trailing).filter(|kind| [LayoutKinds::BLANKLINE, LayoutKinds::DOUBLE_BLANKLINE].contains(kind)),
                _ => None,
            };
            let extras = run.iter().filter_map(|&(_, met)| met.ok()).map(|extra| (CompactEntry::Record { kind: extra.kind, at: extra.extra }, (extra.before, crate::trivia_table::beyond_own_break(extra.after, self.options.ends_line(extra.kind)))));
            crate::trivia_table::with_line_breaks(side, extras, member, &mut kept);
            if let Some(kind) = header_apart.or_else(|| run.iter().find_map(|(_, met)| met.err())) {
                kept.extend(member(kind));
            }
            self.written.write_placed(&mut chunks, site, side, kept, &mut known)?;
        }
        Ok(())
    }

    #[cfg(feature = "arena")]
    pub fn parse_records<N: crate::arena::HydrateNode>(&mut self, source: &str) -> Result<ParsedRecords, String> {
        self.read_records::<N>(source, None)
    }

    /// A read's `refusal`, naming what giving back what the read placed
    /// refused when `released` did.
    #[cfg(feature = "arena")]
    fn given_back(refusal: String, released: Result<(), crate::arena::ArenaError>) -> String {
        match released {
            Ok(()) => refusal,
            Err(release) => format!("{refusal}; giving back what the read placed refused: {release}"),
        }
    }

    /// `parse_records`, and each side the read placed. A diagnostic.
    ///
    /// # Errors
    ///
    /// The parser's failure, and what the read refuses.
    #[cfg(feature = "arena")]
    pub fn parse_placed<N: crate::arena::HydrateNode>(&mut self, source: &str) -> Result<(ParsedRecords, Vec<crate::arena::Placed>), String> {
        let mut kept = Vec::new();
        let parsed = self.read_records::<N>(source, Some(&mut kept))?;
        Ok((parsed, kept))
    }

    #[cfg(feature = "arena")]
    fn read_records<N: crate::arena::HydrateNode>(&mut self, source: &str, kept: Option<&mut Vec<crate::arena::Placed>>) -> Result<ParsedRecords, String> {
        let tree = self.parser.parse(source, None).ok_or_else(|| {
            let snippet: String = source.chars().take(80).collect();
            format!("parse failed (source: {snippet:?})")
        })?;
        let root = tree.root_node();
        let work = crate::layout::LayoutWorkCounter::default();
        let errors = error_regions(&mut TreeNodes::new(&tree, source, &work));
        let grammar = self.grammar;
        let mut built = self.written.built_mut();
        let entry = built.write_source(&crate::arena::source::Source { text: source, breaks_lf: !source.contains('\r') }).map_err(|refusal| refusal.to_string())?;
        let mut writer = crate::arena::ReadWriter::new(&mut built);
        let refused = |writer: crate::arena::ReadWriter<'_>, refusal: crate::arena::HydrateError| Self::given_back(refusal.describe(&G::kind_name), writer.abandon(entry));
        let root = if root.is_error() {
            let root = match crate::arena::hydrate_error(&mut tree.walk(), source, Some(entry), grammar.surface_kinds(), &mut writer) {
                Ok(root) => root,
                Err(refusal) => return Err(refused(writer, refusal)),
            };
            writer.finish(entry, root).map_err(|refusal| refusal.to_string())?;
            root
        } else {
            let mut ctx = crate::read::ReadCtx::new(source, crate::types::TreeId(0), grammar.shows()).with_relaxes(grammar.relaxes()).with_read_options(&self.options);
            let (mut placed, mut apart) = (Vec::new(), Vec::new());
            let root = match crate::arena::hydrate_whole::<N>(&mut tree.walk(), &mut ctx, Some(entry), grammar.surface_kinds(), &mut writer, &mut placed, &mut apart) {
                Ok(root) => root,
                Err(refusal) => return Err(refused(writer, refusal)),
            };
            writer.finish(entry, root).map_err(|refusal| refusal.to_string())?;
            drop(built);
            if let Some(kept) = kept {
                kept.extend_from_slice(&placed);
            }
            if let Err(refusal) = self.place_extras(placed, apart) {
                return Err(Self::given_back(refusal.to_string(), root.map_or(Ok(()), |root| self.written.release(crate::arena::count::Held::Record(root), true))));
            }
            root
        };
        Ok(ParsedRecords { root, source: entry, errors })
    }

    /// Parses `source` twice, as a tree and as the records a read of it
    /// leaves (`parse_records`), and compares each node of the tree with the
    /// node the records answer in its place (`arena::runs_agree`); with it,
    /// the records' layout baseline, its runs naming nodes by their indexes
    /// in the tree. The read's records stay in the engine's arena, as any
    /// read's do. A source whose root has no record compares no node. A
    /// diagnostic.
    ///
    /// # Errors
    ///
    /// The parser's failure, and what the read or the comparison refuses.
    #[cfg(feature = "arena")]
    pub fn backer_parity<N>(&mut self, source: &str) -> Result<crate::arena::BackerParity, String>
    where
        G: crate::arena::RecordGrammar,
        N: crate::arena::HydrateNode + crate::arena::RecordCells,
    {
        let tree = self.parser.parse(source, None).ok_or("parse failed")?;
        let root = self.parse_records::<N>(source)?.root;
        let work = crate::layout::LayoutWorkCounter::default();
        let kinds = self.grammar.surface_kinds();
        let answer = match root {
            Some(root) => self
                .read_node(root, |parsed, at| crate::arena::runs_agree::<G, N>(parsed, at, &mut TreeNodes::new(&tree, source, &work), kinds))
                .map_err(|refusal| refusal.to_string())?
                .ok_or("the read left no record at its root")?,
            None => Ok(crate::arena::BackerParity::default()),
        };
        answer
    }

    pub fn find_and_read(&mut self, _source: String, _pattern: String) -> Result<String, String> {
        Err("find_and_read not yet implemented — ast-grep-core integration pending".to_string())
    }

}

/// What an arena parse leaves: the root's record, none for a root its
/// reader writes none for, the source's entry, and the parse's `ERROR` and
/// `MISSING` regions.
#[cfg(feature = "arena")]
#[derive(Debug)]
pub struct ParsedRecords {
    pub root: Option<crate::arena::Address>,
    pub source: crate::arena::Address,
    pub errors: Vec<ErrorRegion>,
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

/// What a call's lookups read a node's source through.
pub trait Trees<G: EngineGrammar, B: Backing<G> = ParsedTree<G>> {
    /// The tree `id` names; none for an id that names none, and for sources
    /// whose nodes are named by their ids.
    fn tree(&self, id: TreeId) -> Option<&B>;

    /// What holds the source of the node `at` names.
    fn holding(&self, at: crate::slot::NodeIdOrCoordinate<'_>) -> Option<&B> {
        self.tree(at.tree()?)
    }

    /// Renders the built record `record`, which the store `held` answered,
    /// into `w` as a trivia entry, under `options` over `table`, from the
    /// arena these trees are read from. Trees that reach no arena refuse.
    ///
    /// # Errors
    ///
    /// What the record's render refuses, and `RenderError::Record` when no
    /// arena is reachable from here.
    #[cfg(feature = "arena")]
    fn render_record_entry(&self, record: crate::trivia::BuiltEntry, held: &dyn std::any::Any, options: &crate::options::ResolvedOptions, table: &dyn SourceTable, w: &mut dyn crate::render::RenderSink) -> crate::render::RenderResult {
        let _ = (record, held, options, table, w);
        Err(crate::render::RenderError::Record(crate::render::NO_ARENA))
    }
}

impl<G: EngineGrammar, H: std::hash::BuildHasher> Trees<G, ParsedTree<G>> for HashMap<TreeId, ParsedTree<G>, H> {
    fn tree(&self, id: TreeId) -> Option<&ParsedTree<G>> {
        self.get(&id)
    }
}

/// Whether a side may hold a built record of a kind: `Ok` for a kind the
/// grammar's trivia type names, else the refusal a render of the entry
/// answers with.
#[cfg(feature = "arena")]
pub type AdmitEntry = fn(crate::types::KindId) -> Result<(), crate::arena::ArenaError>;

/// How many chunks of `Made` a call can fill: the last holds half of what a
/// `usize` counts.
const MADE_CHUNKS: usize = usize::BITS as usize;

/// The chunks of a `Made`, each of doubling size, made on first use.
type MadeChunks<T> = [std::cell::OnceCell<Box<[std::cell::OnceCell<T>]>>; MADE_CHUNKS];

/// What a call made, each value where it was put: in chunks of doubling
/// size, so a value keeps its place as the list grows. A call that makes
/// nothing holds no chunk table.
struct Made<T> {
    chunks: std::cell::OnceCell<Box<MadeChunks<T>>>,
    len: std::cell::Cell<usize>,
}

impl<T> Made<T> {
    fn new() -> Self {
        Self { chunks: std::cell::OnceCell::new(), len: std::cell::Cell::new(0) }
    }

    /// The chunk the value at `at` lies in, and its place there.
    fn place(at: usize) -> (usize, usize) {
        let chunk = (at + 1).ilog2() as usize;
        (chunk, at + 1 - (1 << chunk))
    }

    fn get(&self, at: usize) -> Option<&T> {
        let (chunk, place) = Self::place(at);
        self.chunks.get()?[chunk].get()?.get(place)?.get()
    }

    /// Each value, in the order put.
    fn iter(&self) -> impl Iterator<Item = &T> {
        (0..self.len.get()).filter_map(|at| self.get(at))
    }

    /// Puts `value` last and answers where.
    fn push(&self, value: T) -> usize {
        let at = self.len.get();
        let (chunk, place) = Self::place(at);
        let chunks = self.chunks.get_or_init(|| Box::new(std::array::from_fn(|_| std::cell::OnceCell::new())));
        let held = chunks[chunk].get_or_init(|| (0..1_usize << chunk).map(|_| std::cell::OnceCell::new()).collect());
        held[place].get_or_init(|| value);
        self.len.set(at + 1);
        at
    }
}

/// The records reads left in an engine's built arena, as one call reads
/// them: each source's made once, when the call first names a node of it,
/// and dropped with the call.
#[cfg(feature = "arena")]
pub struct SourceRecords<'a, G: EngineGrammar> {
    engine: &'a Engine<G>,
    built: &'a crate::arena::BuiltChunks,
    admit: AdmitEntry,
    made: Made<Records<'a, G>>,
    at: std::cell::RefCell<HashMap<crate::arena::Address, usize, crate::heap::IndexState>>,
    /// The record the call last asked about, and where its source's records
    /// are: a render asks about one node many times in a row.
    last: std::cell::Cell<Option<(u32, usize)>>,
}

#[cfg(feature = "arena")]
impl<'a, G: EngineGrammar> SourceRecords<'a, G> {
    /// The records in `built`, read through `engine`, whose renders hold in
    /// a side only the built records `admit` passes; none made yet.
    #[must_use]
    pub fn new(engine: &'a Engine<G>, built: &'a crate::arena::BuiltChunks, admit: AdmitEntry) -> Self {
        Self { engine, built, admit, made: Made::new(), at: std::cell::RefCell::default(), last: std::cell::Cell::new(None) }
    }
}

#[cfg(feature = "arena")]
impl<'a, G: crate::arena::RecordGrammar> Trees<G, Records<'a, G>> for SourceRecords<'a, G> {
    fn render_record_entry(&self, record: crate::trivia::BuiltEntry, held: &dyn std::any::Any, options: &crate::options::ResolvedOptions, table: &dyn SourceTable, w: &mut dyn crate::render::RenderSink) -> crate::render::RenderResult {
        use crate::arena::ArenaRead;
        if self.built.read_record(record.at) && G::shape(record.kind).is_none() {
            let unread = || -> Result<&str, crate::arena::ArenaError> {
                let span = crate::arena::SideRecord::read_slots(self.built, crate::arena::side_of(self.built, record.at)?)?.at.ok_or(crate::arena::ArenaError::Malformed { what: "parsed record row", word: record.at.0 })?.span;
                let source = crate::arena::source::Source::read(self.built, crate::arena::RunNodes::source_of(self.built, record.at)?)?;
                source.text.get(span.range()).ok_or(crate::arena::ArenaError::Malformed { what: "cell span end", word: span.end })
            };
            let text = unread().map_err(crate::render::RenderError::Record)?;
            return crate::trivia::TriviaText::write(record.kind, text, w);
        }
        (self.admit)(record.kind).map_err(crate::render::RenderError::Record)?;
        let store = held
            .downcast_ref::<crate::trivia_store::TriviaStore<G::Trivia>>()
            .ok_or(crate::render::RenderError::Record(crate::arena::ArenaError::Unwritable("a trivia entry's store is another grammar's")))?;
        crate::arena::render_entry_at(self.engine.grammar(), self.built, record, store, &crate::prepare::RenderContext::new(options, table), w)
    }

    fn tree(&self, _: TreeId) -> Option<&Records<'a, G>> {
        None
    }

    fn holding(&self, at: crate::slot::NodeIdOrCoordinate<'_>) -> Option<&Records<'a, G>> {
        let crate::slot::NodeIdOrCoordinate::NodeId { id, .. } = at else { return None };
        let record = id.address();
        if let Some((known, place)) = self.last.get() {
            if known == record {
                return self.made.get(place);
            }
        }
        let source = crate::arena::RunNodes::source_of(self.built, crate::arena::Address(record)).ok()?;
        let found = self.at.borrow().get(&source).copied();
        let place = if let Some(place) = found {
            place
        } else {
            let place = self.made.push(Records::of_source(self.engine, self.built, source).ok()?);
            self.at.borrow_mut().insert(source, place);
            place
        };
        self.last.set(Some((record, place)));
        self.made.get(place)
    }
}

/// The sources one call renders through, each a lookup hands out noted, so
/// the call can report the trees it read (`ReadSources::read`): a tree grows
/// during a render only through a lookup of it. Each source read keeps one
/// `Seating` for the call, so its lookups move one cursor.
pub struct ReadSources<'t, G: EngineGrammar, B: Backing<G> = ParsedTree<G>> {
    trees: &'t dyn Trees<G, B>,
    read: Made<Seating<'t, G, B>>,
    at: std::cell::RefCell<HashMap<usize, usize, crate::heap::IndexState>>,
}

impl<'t, G: EngineGrammar> ReadSources<'t, G> {
    /// The live `trees`, none read yet.
    #[must_use]
    pub fn new<H: std::hash::BuildHasher>(trees: &'t HashMap<crate::types::TreeId, ParsedTree<G>, H>) -> Self {
        Self::over(trees)
    }

    /// Each live tree a lookup handed out, once, in the order first read.
    #[must_use]
    pub fn read(self) -> Vec<crate::types::TreeId> {
        self.read.iter().map(|seating| seating.tree().tree_id()).collect()
    }
}

impl<'t, G: EngineGrammar, B: Backing<G>> ReadSources<'t, G, B> {
    /// The sources `trees` finds, none read yet.
    #[must_use]
    pub fn over(trees: &'t dyn Trees<G, B>) -> Self {
        Self { trees, read: Made::new(), at: std::cell::RefCell::default() }
    }

    /// The live tree `tree`, noted as read, or `None` when it is not live.
    #[must_use]
    pub fn get(&self, tree: crate::types::TreeId) -> Option<&'t B> {
        let tree = self.trees.tree(tree)?;
        self.seated(tree)?;
        Some(tree)
    }

    /// What holds the source of the node `at` names, noted as read.
    #[must_use]
    pub fn holding(&self, at: crate::slot::NodeIdOrCoordinate<'_>) -> Option<&'t B> {
        let tree = self.trees.holding(at)?;
        self.seated(tree)?;
        Some(tree)
    }

    /// The call's lookups in `tree`, made on its first read and noted.
    fn seated(&self, tree: &'t B) -> Option<&Seating<'t, G, B>> {
        let key = std::ptr::from_ref(tree).addr();
        let known = self.at.borrow().get(&key).copied();
        let at = known.unwrap_or_else(|| {
            let at = self.read.push(tree.seating().answering_alone());
            self.at.borrow_mut().insert(key, at);
            at
        });
        self.read.get(at)
    }

    /// The call's lookups in the source of the node `at` names.
    fn seating(&self, at: crate::slot::NodeIdOrCoordinate<'_>) -> Option<&Seating<'t, G, B>> {
        self.seated(self.trees.holding(at)?)
    }
}

/// The sources as the render context's source table: what a node is named by
/// finds its source, which owns the text its spans index into.
impl<G: EngineGrammar, B: Backing<G>> SourceTable for ReadSources<'_, G, B> {
    #[cfg(feature = "arena")]
    fn render_record_entry(&self, record: crate::trivia::BuiltEntry, held: &dyn std::any::Any, options: &crate::options::ResolvedOptions, w: &mut dyn crate::render::RenderSink) -> crate::render::RenderResult {
        self.trees.render_record_entry(record, held, options, self, w)
    }

    fn source_of(&self, at: crate::slot::NodeIdOrCoordinate<'_>) -> Option<&str> {
        Some(self.holding(at)?.source())
    }

    fn breaks_spelled_lf(&self, at: crate::slot::NodeIdOrCoordinate<'_>) -> bool {
        self.holding(at).is_some_and(B::breaks_lf)
    }

    fn kind_of(&self, at: crate::slot::NodeIdOrCoordinate<'_>) -> Option<KindId> {
        self.seating(at)?.kind_of(at)
    }

    fn for_each_descendant(&self, at: crate::slot::NodeIdOrCoordinate<'_>, visit: &mut dyn FnMut(KindId, &str) -> bool) {
        if let Some(seating) = self.seating(at) {
            seating.for_each_descendant(at, visit);
        }
    }

    fn line_starts_inside_tokens(&self, at: crate::slot::NodeIdOrCoordinate<'_>) -> Vec<u32> {
        self.seating(at).map_or_else(Vec::new, |seating| seating.line_starts_inside_tokens(at))
    }

    fn sides(&self, at: crate::slot::NodeIdOrCoordinate<'_>) -> Option<Box<dyn crate::trivia::FramedTrivia>> {
        self.seating(at)?.sides(at)
    }

    fn frames(&self, at: crate::slot::NodeIdOrCoordinate<'_>) -> crate::trivia::Frames {
        self.seating(at).map_or_else(crate::trivia::Frames::default, |seating| seating.frames(at))
    }

    fn slot_layouts(&self, at: crate::slot::NodeIdOrCoordinate<'_>) -> Vec<crate::layout::SlotLayout> {
        self.seating(at).map_or_else(Vec::new, |seating| seating.slot_layouts(at))
    }

    fn framed_span(&self, at: crate::slot::NodeIdOrCoordinate<'_>) -> Option<Span> {
        match self.seating(at) {
            Some(seating) => seating.framed_span(at),
            None => match at {
                crate::slot::NodeIdOrCoordinate::Coordinate(coord) => Some(coord.span),
                crate::slot::NodeIdOrCoordinate::NodeId { .. } => None,
            },
        }
    }

    fn edited_within(&self, at: crate::slot::NodeIdOrCoordinate<'_>) -> bool {
        self.seating(at).is_some_and(|seating| seating.edited_within(at))
    }

    fn renders_as_source(&self, at: crate::slot::NodeIdOrCoordinate<'_>) -> bool {
        self.seating(at).is_some_and(|seating| seating.renders_as_source(at))
    }

    fn seat_through(&self, at: crate::slot::NodeIdOrCoordinate<'_>, wrappers: &[Option<crate::options::SeatPath>], seat: &dyn Fn(KindId) -> Option<crate::types::SiteId>) -> Option<crate::types::SiteId> {
        self.seating(at)?.seat_through(at, wrappers, seat)
    }

    fn read_node(&self, coord: &NodeCoordinate, read: &mut dyn FnMut(&mut tree_sitter::TreeCursor<'_>, &mut crate::read::ReadCtx<'_>)) -> bool {
        self.seating(coord.into()).is_some_and(|seating| seating.read_node(coord, read))
    }

    fn list_delimiter(&self, at: crate::slot::NodeIdOrCoordinate<'_>, kind: KindId) -> Option<crate::types::Delimiter> {
        self.seating(at)?.list_delimiter(at, kind)
    }

    fn for_each_edge_level(&self, at: crate::slot::NodeIdOrCoordinate<'_>, side: crate::options::Side, f: &mut dyn FnMut(crate::render::EdgeLevel)) {
        if let Some(seating) = self.seating(at) {
            seating.for_each_edge_level(at, side, f);
        }
    }

    fn spelled_end_kind(&self, at: crate::slot::NodeIdOrCoordinate<'_>) -> Option<KindId> {
        self.seating(at)?.spelled_end_kind(at)
    }

    fn depth_move(&self, at: crate::slot::NodeIdOrCoordinate<'_>) -> i32 {
        self.seating(at).map_or(0, |seating| seating.depth_move(at))
    }

    fn span_of(&self, at: crate::slot::NodeIdOrCoordinate<'_>) -> Option<Span> {
        self.seating(at)?.span_of(at)
    }

    fn stamp_of(&self, at: crate::slot::NodeIdOrCoordinate<'_>) -> Option<KindId> {
        self.seating(at)?.stamp_of(at)
    }

    fn same_node(&self, one: crate::types::NodeId, other: crate::types::NodeId) -> bool {
        one == other || self.seating(crate::slot::NodeIdOrCoordinate::of(one)).is_some_and(|seating| seating.same_node(one, other))
    }

    fn is_source_root(&self, at: crate::slot::NodeIdOrCoordinate<'_>) -> bool {
        self.seating(at).is_some_and(|seating| seating.is_source_root(at))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_walk_s_cursor_answers_as_a_seek_does_in_order_out_of_order_and_past_the_last_start() {
        let starts = [3, 10, 20];
        let spans = [(0, 2), (0, 30), (3, 3), (4, 9), (9, 10), (11, 19), (5, 6), (20, 20), (21, 40), (25, 26), (0, 3)];
        let mut cursor = EntryCursor::default();
        for (start, end) in spans {
            let span = Span { start, end };
            let sought = EntryCursor::default().within(&starts, span);
            assert_eq!(sought, starts.iter().any(|&at| start <= at && at <= end), "{span:?}: a seek");
            assert_eq!(cursor.within(&starts, span), sought, "{span:?}: the walk's cursor");
        }
    }

    #[test]
    fn an_id_past_the_handle_range_is_refused() {
        assert_eq!(claim_on(Some(MAX_TREE_ID)), Some(TreeClaim(TreeId(MAX_TREE_ID))));
        assert_eq!(claim_on(Some(MAX_TREE_ID + 1)), None);
        assert_eq!(claim_on(None), None);
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
            Some("parameters") => crate::read::Route::Slot { slot: crate::types::SlotId(2), scalar: false },
            Some("body") => crate::read::Route::Slot { slot: crate::types::SlotId(3), scalar: false },
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

        fn kind_name(_kind: KindId) -> &'static str {
            "test"
        }

        fn router(self, grammar: KindId, _display: KindId) -> Option<crate::read::Router> {
            let language: tree_sitter::Language = tree_sitter_rust::LANGUAGE.into();
            match crate::read::kind_name(&language, grammar)? {
                "function_item" => Some(crate::read::Router::Children(function_item_route, |_, _, _| None, |_, _| None)),
                "declaration_list" | "block" => Some(crate::read::Router::Children(item_route, |_, _, _| None, |_, _| None)),
                _ => None,
            }
        }

        fn unit_id(self, _nodes: &mut dyn Nodes<'_>, at: &Kid) -> Option<KindId> {
            let language: tree_sitter::Language = tree_sitter_rust::LANGUAGE.into();
            (crate::read::kind_name(&language, at.display) == Some("primitive_type")).then(|| crate::read::kind_named(&language, "u8", false))
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

    #[cfg(feature = "napi-bindings")]
    mod nodeless {
        use super::TestTrivia;
        use crate::codec::{Codec, Steps};
        use crate::trivia::TriviaText;

        fn no_decode_wait(wait: <TriviaText as Codec<TestTrivia>>::DecodeWait) -> ! {
            match wait {}
        }

        fn no_encode_wait(wait: <TriviaText as Codec<TestTrivia>>::EncodeWait) -> ! {
            match wait {}
        }

        fn no_decoding(frame: <TestTrivia as Steps<TestTrivia>>::Decoding) -> ! {
            match frame {}
        }

        fn no_encoding(frame: <TestTrivia as Steps<TestTrivia>>::Encoding) -> ! {
            match frame {}
        }

        #[test]
        fn a_nodeless_value_waits_on_and_frames_nothing() {
            let _ = (no_decode_wait, no_encode_wait, no_decoding, no_encoding);
        }
    }

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
        fn seam_gap(&self) -> Option<crate::layout_kinds::LayoutKinds> {
            matches!(self, TestTrivia::Newline).then_some(crate::layout_kinds::LayoutKinds::NEWLINE)
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
        crate::render::WhitespaceTable { text_of: test_spacing_text, indent: KindId(0), dedent: KindId(0), leaf_edges: &[], gaps: &[(crate::layout_kinds::LayoutKinds::SPACE.0, KindId(1)), (crate::layout_kinds::LayoutKinds::NEWLINE.0, KindId(2))] };

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

    /// A claim on the next id of the process's counter.
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
        assert_eq!(tree.snapshot_layouts(inside, None), tree.snapshot_layouts(index, None), "a node an ERROR holds snapshots as its ERROR");
        let snapped = tree.snapshot_layouts(index, None).expect("an ERROR snapshots").expect("from its own start");
        let span = crate::points::PointSpan { start: crate::points::Point::ZERO, end: crate::points::Point { row: 0, column: 2 } };
        assert_eq!(snapped, [(index, Box::new(crate::read::placed_at(crate::read::Origin::Snapshot(span))))], "the ERROR's one row, its span alone");
        assert_eq!(tree.snapshot_layouts(index, Some(11)), Some(Err(crate::read::ReadError::Unmeasured { index, byte: 10 })), "a holder after the ERROR is refused");
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
                let found = tree.nodes().error_holding(index);
                assert!(found.is_none_or(|error| error.error()), "{source:?} at {index:?}: an ERROR");
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
    fn a_same_line_trailing_comment_has_no_line_break_before_it() {
        let (tree, _) = parsed("fn f() {} // c\nfn g() {}\n");
        let f = index_of_kind(&tree, "function_item", 0);
        let trailing = tree.trivia_side(f, TriviaSide::Trailing);
        assert!(matches!(trailing.first().and_then(TriviaEntry::value), Some(SlotValue::Coord(_))), "{trailing:?}");
    }

    #[test]
    fn a_changed_edge_keeps_the_line_breaks_between_a_side_s_entries_and_its_owner() {
        let (tree, _) = parsed("mod m {\n    // c\n    fn f() {}\n    // d\n}\n");
        let f = index_of_kind(&tree, "function_item", 0);
        let entries = |side, changed| tree.side_entries(f, side, changed).into_iter().map(|entry| SideEntry::into_entry(entry).value().cloned()).collect::<Vec<_>>();
        let newline = Some(SlotValue::Node(TestTrivia::Newline));
        for side in [TriviaSide::Leading, TriviaSide::Trailing] {
            assert_eq!(entries(side, true), entries(side, false), "{side:?}");
        }
        assert_eq!(entries(TriviaSide::Leading, false)[1..], *std::slice::from_ref(&newline));
        assert_eq!(entries(TriviaSide::Trailing, false)[..1], [newline]);
    }

    #[test]
    fn an_error_in_a_side_reads_as_its_kind_and_source_text_alone() {
        let (tree, _) = parsed("fn f() {} @@ fn g() {}");
        let sides = (0..crate::read::descendant_count(&tree.tree().root_node()))
            .map(NodeIndex::new)
            .flat_map(|at| [TriviaSide::Leading, TriviaSide::Trailing, TriviaSide::Inner].map(|side| tree.trivia_side(at, side)))
            .flatten()
            .collect::<Vec<_>>();
        let text = TriviaText { kind: KindId(u16::MAX), text: "@@".to_owned(), span: None, before: None, after: None };
        assert_eq!(sides, [TriviaEntry::new(SlotValue::Node(TestTrivia::Text(text)))]);
    }

    #[test]
    fn a_written_side_replaces_the_assigned_one_and_marks_its_ancestors_edited() {
        let (mut tree, _) = parsed("fn f() { a(); }\nfn g() {}\n");
        let f = index_of_kind(&tree, "function_item", 0);
        let g = index_of_kind(&tree, "function_item", 1);
        let a = index_of_kind(&tree, "expression_statement", 0);
        let written = vec![TriviaEntry::new(SlotValue::Node(TestTrivia::Text(TriviaText { kind: KindId(1), text: "// w".to_owned(), span: None, before: None, after: None })))];
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
            let source: Vec<TriviaEntry<TestTrivia>> = lookups(&tree).assigned(f, TriviaSide::Leading, false).into_iter().map(SideEntry::into_entry).collect();
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
        let sources = ReadSources::new(&trees);
        for at in &coordinates {
            assert!(sources.renders_as_source(at.into()), "nothing was written under {at:?}");
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
    fn a_tree_answers_that_its_sides_held_a_built_record() {
        let mut engine = Engine::new(TestGrammar, ResolvedOptions::default()).expect("engine");
        let mut tree = engine.parse("fn f() {}\n", claim()).expect("parse");
        assert!(!tree.release_sides(), "a tree with no sides");
        let record = crate::trivia::RecordEntry { record: crate::trivia::BuiltEntry { kind: KindId(1), at: crate::arena::Address(5) }, store: None, as_source: None };
        tree.sides.insert(NodeIndex::ROOT, TriviaSide::Leading, vec![TriviaEntry::Record(record)]);
        assert!(tree.release_sides(), "its side held a built record");
        assert!(!tree.release_sides(), "once released, none is left");
    }

    #[cfg(feature = "arena")]
    #[test]
    fn a_side_write_refused_after_its_row_changed_still_marks_its_tree_grown() {
        let mut engine = Engine::new(TestGrammar, ResolvedOptions::default()).expect("engine");
        let mut tree = engine.parse("fn f() {}\n", claim()).expect("parse");
        let record = crate::trivia::RecordEntry { record: crate::trivia::BuiltEntry { kind: KindId(1), at: crate::arena::Address(5) }, store: None, as_source: None };
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
        let sources = ReadSources::new(&trees);
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
        let sources = ReadSources::new(&trees);
        let sides = sources.sides((&f).into()).expect("the function has sides");
        let sides = sides.as_any().downcast_ref::<crate::trivia::NodeTrivia<TestTrivia>>().expect("the grammar's trivia");
        let held = |entries: &[TriviaEntry<TestTrivia>]| (!entries.is_empty()).then(|| entries.to_vec());
        assert_eq!((sides.leading.clone(), sides.trailing.clone(), sides.inner.clone()), (held(&leading), held(&trailing), None));
    }

    #[test]
    fn a_coordinate_with_no_side_has_no_frame() {
        let (tree, _) = parsed("fn f() { a(); }\n");
        let a = coordinate(&tree, index_of_kind(&tree, "call_expression", 0));
        assert!(ReadSources::new(&table(tree)).sides((&a).into()).is_none());
    }

    #[test]
    fn a_change_to_the_live_trees_while_a_read_holds_them_is_refused_as_an_error() {
        let (tree, _) = parsed("fn f() {}\n");
        let f = index_of_kind(&tree, "function_item", 0);
        let trees = std::cell::RefCell::new(table(tree));
        let read = trees.borrow();
        let reading = ReadSources::new(&read);
        let refused = change_trees(&trees).map(|_| ()).expect_err("a write while the trees are being read");
        assert!(refused.contains("being read"), "refused by name: {refused}");
        assert!(!reading.edited_within((&coordinate(&read[&read.keys().next().copied().expect("a tree")], f)).into()), "the read saw no write");
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
        let sources = ReadSources::new(&trees);
        assert!(sources.edited_within((&f).into()));
        assert!(!sources.edited_within((&g).into()));
    }

    fn at(tree: TreeId, index: NodeIndex) -> NodeCoordinate {
        NodeCoordinate::new(tree, index, index + 1, Span { start: 0, end: 0 })
    }

    #[test]
    fn the_tree_table_hands_out_a_cursor_on_a_node_and_its_read_context() {
        let (tree, _) = parsed("fn f() {}\n");
        let id = tree.tree_id();
        let past = NodeIndex(crate::read::descendant_count(&tree.tree().root_node()));
        let trees = table(tree);
        let sources = ReadSources::new(&trees);
        let mut read = None;
        assert!(sources.read_node(&at(id, NodeIndex::ROOT), &mut |cursor, ctx| read = Some(format!("{}: {}", cursor.node().kind(), ctx.text(&cursor.node())))));
        assert_eq!(read.as_deref(), Some("source_file: fn f() {}\n"));
        assert!(!sources.read_node(&at(TreeId(id.0 + 1), NodeIndex::ROOT), &mut |_, _| {}), "no tree");
        assert!(!sources.read_node(&at(id, past), &mut |_, _| {}), "no node");
    }

    #[test]
    fn the_tree_table_notes_each_live_tree_a_lookup_hands_out_once() {
        let (first, _) = parsed("fn f() {}\n");
        let (second, _) = parsed("fn g() {}\n");
        let (a, b) = (first.tree_id(), second.tree_id());
        let trees = HashMap::from([(a, first), (b, second)]);
        let sources = ReadSources::new(&trees);
        assert!(!sources.read_node(&at(TreeId(a.0.max(b.0) + 1), NodeIndex::ROOT), &mut |_, _| {}));
        assert!(sources.read_node(&at(b, NodeIndex::ROOT), &mut |_, _| {}));
        assert!(sources.source_of((&at(a, NodeIndex::ROOT)).into()).is_some());
        assert!(sources.source_of((&at(b, NodeIndex::ROOT)).into()).is_some());
        assert_eq!(sources.read(), vec![b, a], "each once, in the order first read, and none that is not live");
    }

    #[test]
    fn a_value_with_no_read_reads_no_coordinate() {
        let (tree, _) = parsed("fn f() {}\n");
        let id = tree.tree_id();
        let trees = table(tree);
        let sources = ReadSources::new(&trees);
        assert!(sources.read_node(&at(id, NodeIndex::ROOT), &mut |cursor, ctx| assert!(<TestTrivia as crate::prepare::Prepare>::read_coordinate(cursor, ctx).is_none())));
    }
}
