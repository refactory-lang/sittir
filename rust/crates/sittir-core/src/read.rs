//! The typed reader's runtime: what every `#[derive(Transport)]` expansion
//! calls. A read walks one `TreeCursor` created at the tree's root, so the
//! cursor's descendant index is a node's index in the whole tree. A node's
//! children are surveyed once, routed to slots, and then read in a second
//! pass. A child past the read's depth is a coordinate: its tree and index,
//! its span and its kind. A child no route takes refuses the read. A read
//! seats a node's sides only when its context looks them up in the tree's
//! trivia table (`ReadCtx::sides`), each node by its own index. No grammar
//! fact lives here: each one reaches the reader through a generated
//! attribute.

use crate::layout::TransportLayout;
use crate::slot::{ChangedEdges, NodeCoordinate, SlotValue};
use crate::trivia::{TransportTrivia, TriviaEntry};
use crate::trivia_table::TriviaSide;
use crate::types::{FieldId, KindId, Span};
use std::num::NonZeroU32;
use std::sync::OnceLock;
use tree_sitter::{Node, TreeCursor};

pub use regex::Captures;

/// The kind the parser shows `node` as: the alias target at an alias site,
/// else the grammar id. Every flag, edge and seat table is keyed on the
/// grammar id (`grammar_id()`), never on this one; the display id is for the
/// places that carry an alias envelope. The one call of `Node::kind_id`.
#[allow(clippy::disallowed_methods)]
pub fn display_id(node: &Node<'_>) -> KindId {
    KindId(node.kind_id())
}

/// How many levels a read expands below the node it starts at.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Depth {
    Levels(NonZeroU32),
    All,
}

impl Depth {
    /// One level: the node's own slots, each child with structure a coordinate.
    pub const ONE: Depth = Depth::Levels(NonZeroU32::MIN);

    /// The depth a child of a node read at `self` is read at, or `None` when
    /// the child is past the last level.
    pub fn below(self) -> Option<Depth> {
        match self {
            Depth::All => Some(Depth::All),
            Depth::Levels(levels) => NonZeroU32::new(levels.get() - 1).map(Depth::Levels),
        }
    }

    /// `self`, deepened to at least `levels`: a kind whose items arrive with it.
    pub fn at_least(self, levels: u32) -> Depth {
        match (self, NonZeroU32::new(levels)) {
            (Depth::Levels(own), Some(min)) if own < min => Depth::Levels(min),
            _ => self,
        }
    }
}

/// What every read of one tree shares: the source its spans index into, the
/// id its coordinates carry, and the display ids the grammar claims a node by
/// (`ReadTransport::shows` of its transports).
#[derive(Clone, Copy)]
pub struct ReadCtx<'s> {
    pub source: &'s str,
    pub tree_id: u32,
    pub shows: fn(KindId) -> bool,
    /// Whether a node with these grammar and display ids is a relaxed keyword:
    /// the grammar aliases the keyword token to its word rule, so the node
    /// reads as the word rule (`EngineGrammar::relaxes`).
    pub relaxes: fn(KindId, KindId) -> bool,
    /// Set on a snapshot read (`ReadCtx::snapshot`): each node it reads gets a
    /// span in place of a coordinate, and each trivia entry its text.
    pub snapshot: Option<&'s SnapshotCtx<'s>>,
    /// Where the read takes each node's sides (`ReadCtx::with_sides`): set on
    /// a render read and a snapshot read, absent on a read whose sides the
    /// client asks for itself.
    pub sides: Option<&'s dyn SideLookup>,
    /// The node, by index, whose neighbours changed on the edges given, so
    /// its sides there drop their layout runs (`trivia::without_edge_runs`).
    pub changed: Option<(u32, ChangedEdges)>,
    /// Set on a read whose client stores a unit variant as its bare kind
    /// (`ReadCtx::inline_units`): past the depth, a child with no named
    /// child is read inline although the read seats sides.
    pub inline_units: bool,
}

impl std::fmt::Debug for ReadCtx<'_> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("ReadCtx")
            .field("tree_id", &self.tree_id)
            .field("snapshot", &self.snapshot.is_some())
            .field("sides", &self.sides.is_some())
            .field("changed", &self.changed)
            .field("inline_units", &self.inline_units)
            .finish_non_exhaustive()
    }
}

/// One entry of a node's side as a read seats it, with where it came from.
#[derive(Debug, Clone, PartialEq)]
pub enum SideEntry<T> {
    /// An extra or an `ERROR` of the source: its kind, the bytes it spans and,
    /// for an `ERROR`, the in-line runs before and after it it carries.
    Source { entry: TriviaEntry<T>, kind: KindId, span: Span, adjacent: Option<(Span, Span)> },
    /// A layout run of the source.
    Layout(TriviaEntry<T>),
    /// An entry a write gave the side.
    Written(TriviaEntry<T>),
}

impl<T> SideEntry<T> {
    pub fn into_entry(self) -> TriviaEntry<T> {
        match self {
            SideEntry::Source { entry, .. } | SideEntry::Layout(entry) | SideEntry::Written(entry) => entry,
        }
    }
}

/// The sides of a tree's nodes: its trivia table and its writes
/// (`ParsedTree::trivia_side`).
pub trait SideLookup {
    /// The entries of `side` of the node at `index` as a
    /// `Vec<SideEntry<T>>` of the grammar's trivia type, without the layout
    /// runs at that edge when `edge_changed`.
    fn side(&self, index: u32, side: TriviaSide, edge_changed: bool) -> Box<dyn std::any::Any>;
    /// The stored layout of each list slot of the node at `index`
    /// (`layout::SlotLayout`); none where the lookup measures none.
    fn slots(&self, index: u32) -> Vec<crate::layout::SlotLayout> {
        let _ = index;
        Vec::new()
    }
    /// The separator before the node at `index` as an item of its parent's
    /// list slot, where it is not the one the slot renders.
    fn separator(&self, index: u32) -> Option<u16> {
        let _ = index;
        None
    }
}

/// What a snapshot read measures with: the source's lines, the descendant
/// index of the node it snapshots, and the start of the transport the read
/// is inside, from which each point it writes is measured. The holder moves as the read enters and leaves a transport
/// (`ReadCtx::hold`, `Placement::into_layout`), and the holders it replaced
/// wait here, so a recursive read frame holds no context of its own.
#[derive(Debug)]
pub struct SnapshotCtx<'s> {
    pub lines: &'s crate::points::LineTable,
    root: u32,
    holder: std::cell::Cell<crate::points::Point>,
    replaced: std::cell::RefCell<Vec<crate::points::Point>>,
}

impl<'s> SnapshotCtx<'s> {
    /// A snapshot of the node at `root`, measuring from the byte `holder`,
    /// or from the source's start when absent.
    pub fn new(lines: &'s crate::points::LineTable, holder: Option<u32>, root: u32) -> Self {
        let holder = holder.and_then(|byte| lines.point(byte as usize)).unwrap_or(crate::points::Point::ZERO);
        Self { lines, root, holder: std::cell::Cell::new(holder), replaced: std::cell::RefCell::default() }
    }

    /// `span`'s two ends as points measured from the holder's start.
    pub fn span_of(&self, span: Span) -> crate::points::PointSpan {
        let holder = self.holder.get();
        let point = |byte: u32| self.lines.point(byte as usize).expect("a node's bytes lie in its source").offset_from(holder);
        crate::points::PointSpan { start: point(span.start), end: point(span.end) }
    }
}

/// Where a read node came from: its coordinate in a live tree, or, in a
/// snapshot, its span measured from its holder's start.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Origin {
    Tree(NodeCoordinate),
    Snapshot(crate::points::PointSpan),
}

impl<'s> ReadCtx<'s> {
    pub fn new(source: &'s str, tree_id: u32, shows: fn(KindId) -> bool) -> Self {
        Self { source, tree_id, shows, relaxes: |_, _| false, snapshot: None, sides: None, changed: None, inline_units: false }
    }

    /// This context, reading a relaxed keyword as the word rule it displays.
    pub fn with_relaxes(self, relaxes: fn(KindId, KindId) -> bool) -> Self {
        Self { relaxes, ..self }
    }

    /// This context, reading a snapshot measured as `snapshot` measures.
    pub fn snapshot(self, snapshot: &'s SnapshotCtx<'s>) -> Self {
        Self { snapshot: Some(snapshot), ..self }
    }

    /// This context, seating each node's sides from `sides`.
    pub fn with_sides(self, sides: &'s dyn SideLookup) -> Self {
        Self { sides: Some(sides), ..self }
    }

    /// This context, reading a unit variant inline past the depth, as a
    /// client that stores it as its bare kind holds it.
    pub fn inline_units(self) -> Self {
        Self { inline_units: true, ..self }
    }

    /// Whether a child with no named child, read at `depth` under a node,
    /// is read inline (its transport, a unit variant's bare kind) rather than
    /// kept a coordinate: within the depth, on a read that seats no sides,
    /// and on one that reads units inline. A coordinate frames itself with
    /// its sides; an inline unit has no layout, so its holder frames it.
    pub fn reads_leaf_inline(&self, depth: Depth) -> bool {
        depth.below().is_some() || self.sides.is_none() || self.inline_units
    }

    /// This context, with the neighbours of the node at `index` changed on
    /// the edges `changed` gives.
    pub fn with_changed(self, index: u32, changed: ChangedEdges) -> Self {
        Self { changed: Some((index, changed)), ..self }
    }

    /// The entries of `side` of the node at `index`, as this context seats
    /// them: on a live read as they are; in a snapshot an extra or an `ERROR`
    /// as its text measured from the holder, and the layout runs as they
    /// are, but on the snapshot's own node, whose outer edges face
    /// neighbours outside it, without the runs at those edges. `None` when
    /// the context looks up no sides or the side is empty.
    fn side<T: crate::trivia::FromTriviaText + 'static>(&self, index: u32, side: TriviaSide) -> Option<Vec<TriviaEntry<T>>> {
        let lookup = self.sides?;
        let edge_changed = self.changed.is_some_and(|(at, changed)| at == index && changed.on(side));
        let entries = *lookup.side(index, side, edge_changed).downcast::<Vec<SideEntry<T>>>().ok()?;
        let seated: Vec<TriviaEntry<T>> = match self.snapshot {
            None => entries.into_iter().map(SideEntry::into_entry).collect(),
            Some(snapshot) => {
                let mut entries = entries;
                if index == snapshot.root && side != TriviaSide::Inner {
                    crate::trivia::without_edge_runs(&mut entries, side, |entry| matches!(entry, SideEntry::Layout(_)));
                }
                entries.into_iter().map(|side| self.snapshot_entry(snapshot, side)).collect()
            }
        };
        (!seated.is_empty()).then_some(seated)
    }

    /// A seated entry in a snapshot: an extra as its text, an `ERROR` with
    /// its span, both measured from the holder; a layout run or a written
    /// entry as it is.
    fn snapshot_entry<T: crate::trivia::FromTriviaText>(&self, snapshot: &SnapshotCtx<'_>, side: SideEntry<T>) -> TriviaEntry<T> {
        match side {
            SideEntry::Source { kind, span, adjacent, .. } => {
                let text = crate::trivia::TriviaText::of_source(kind, self.source, span, adjacent, Some(snapshot.span_of(span)));
                TriviaEntry::new(SlotValue::Transport(T::from_text(text)))
            }
            SideEntry::Layout(entry) | SideEntry::Written(entry) => entry,
        }
    }

    /// The layout of the node at `index`, read from `at`: its sides as this
    /// context seats them, and where it came from. A node whose read held
    /// the context (`ReadCtx::hold`) measures its inner side from its own
    /// start and its leading and trailing sides from the holder its hold
    /// replaced, which it restores.
    pub fn layout<T: crate::trivia::FromTriviaText + 'static>(&self, index: u32, at: Origin, held: bool) -> Box<TransportLayout<T>> {
        let inner = self.side(index, TriviaSide::Inner);
        if held {
            self.release();
        }
        let leading = self.side(index, TriviaSide::Leading);
        let trailing = self.side(index, TriviaSide::Trailing);
        let seated = leading.is_some() || trailing.is_some() || inner.is_some();
        Box::new(TransportLayout {
            trivia: seated.then_some(TransportTrivia { leading, trailing, inner }),
            slots: self.sides.map_or_else(Vec::new, |lookup| lookup.slots(index)),
            separator: self.sides.and_then(|lookup| lookup.separator(index)),
            ..placed_at(at)
        })
    }

    /// `layout`, holding the sides of the node's unit children (`units`).
    pub fn layout_with_units<T: crate::trivia::FromTriviaText + 'static>(
        &self,
        index: u32,
        at: Origin,
        held: bool,
        units: Vec<crate::layout::UnitSides<T>>,
    ) -> Box<TransportLayout<T>> {
        let mut layout = self.layout(index, at, held);
        layout.units = units;
        layout
    }

    /// The sides of the unit child at `index`, read at `depth` under its
    /// holder, which its slot stores as a bare kind, as this context seats
    /// them: `None` when the context seats none, when the read keeps the unit
    /// a coordinate (`reads_leaf_inline`), or when the unit has none.
    pub fn unit_sides<T: crate::trivia::FromTriviaText + 'static>(&self, index: u32, depth: Depth) -> Option<TransportTrivia<T>> {
        if !self.reads_leaf_inline(depth) {
            return None;
        }
        let leading = self.side(index, TriviaSide::Leading);
        let trailing = self.side(index, TriviaSide::Trailing);
        let inner = self.side(index, TriviaSide::Inner);
        (leading.is_some() || trailing.is_some() || inner.is_some()).then_some(TransportTrivia { leading, trailing, inner })
    }

    /// In a snapshot, makes the start of the transport the cursor is on the
    /// holder its slots are measured from, keeping the holder it replaces for
    /// the transport's layout to restore (`Placement::into_layout`).
    /// Elsewhere nothing moves. A read that fails leaves the holder where it
    /// was moved: the snapshot is not read further.
    pub fn hold(&self, cursor: &TreeCursor<'_>) {
        if let Some(snapshot) = self.snapshot {
            self.hold_in(snapshot, cursor);
        }
    }

    /// `hold` in a snapshot, kept out of line so that a read frame, which
    /// recurses, does not carry its temporaries.
    #[inline(never)]
    fn hold_in(&self, snapshot: &SnapshotCtx<'_>, cursor: &TreeCursor<'_>) {
        let start = self.coordinate(&cursor.node(), index_of(cursor)).span.start;
        let own = snapshot.lines.point(start as usize).expect("a node's start lies in its source");
        snapshot.replaced.borrow_mut().push(snapshot.holder.replace(own));
    }

    /// Restores the holder the last `hold` replaced.
    fn release(&self) {
        if let Some(snapshot) = self.snapshot {
            let outer = snapshot.replaced.borrow_mut().pop().expect("a release follows its hold");
            snapshot.holder.set(outer);
        }
    }

    /// The kind every coordinate of a node stamps as its `$type`, on every
    /// route: the display id where the grammar claims the node by it (an alias
    /// envelope) or where the node is a relaxed keyword read as its word rule,
    /// the grammar id everywhere else.
    pub fn stamped_kind(&self, grammar: KindId, display: KindId) -> KindId {
        if display != grammar && ((self.shows)(display) || (self.relaxes)(grammar, display)) { display } else { grammar }
    }

    /// [`Self::stamped_kind`] of a parsed node.
    pub fn node_kind(&self, node: &tree_sitter::Node<'_>) -> KindId {
        self.stamped_kind(KindId(node.grammar_id()), display_id(node))
    }

    /// Where the node the cursor is on came from: each transport's own
    /// (`TransportLayout::at`, or `::span` in a snapshot).
    pub fn at_of(&self, cursor: &TreeCursor<'_>) -> Origin {
        self.origin(&cursor.node(), index_of(cursor))
    }

    /// Where the node at `index` came from: its coordinate, or in a snapshot
    /// its span from this context's holder.
    pub fn origin(&self, node: &Node<'_>, index: u32) -> Origin {
        let at = self.coordinate(node, index);
        match self.snapshot {
            None => Origin::Tree(at),
            Some(snapshot) => Origin::Snapshot(snapshot.span_of(at.span)),
        }
    }

    /// The coordinate of a surveyed child: its tree and index, its span and its
    /// stamped kind (`ReadCtx::stamped_kind`).
    pub fn coordinate_of(&self, child: &Child) -> NodeCoordinate {
        NodeCoordinate {
            kind: Some(self.stamped_kind(child.grammar, child.display)),
            ..NodeCoordinate::new(self.tree_id, child.index, child.index + child.descendants, Span { start: child.start, end: child.end })
        }
    }

    /// The coordinate of the node at `index`. The root (index 0) spans the
    /// whole source: tree-sitter's root starts at the first token, and the
    /// root stands for the file, whose leading and trailing bytes its
    /// coordinate render must keep.
    pub fn coordinate(&self, node: &Node<'_>, index: u32) -> NodeCoordinate {
        let range = node.byte_range();
        let span = if index == 0 {
            Span { start: 0, end: self.source.len() as u32 }
        } else {
            Span { start: range.start as u32, end: range.end as u32 }
        };
        NodeCoordinate {
            kind: Some(self.node_kind(node)),
            ..NodeCoordinate::new(self.tree_id, index, index + node.descendant_count() as u32, span)
        }
    }

    /// The source text a node spans.
    pub fn text(&self, node: &Node<'_>) -> &'s str {
        &self.source[node.byte_range()]
    }
}

/// The index of the node the cursor is on: its descendant index from the
/// tree's root, which `TreeCursor::goto_descendant` reaches again.
pub fn index_of(cursor: &TreeCursor<'_>) -> u32 {
    cursor.descendant_index() as u32
}

/// What the first pass learns about one child.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Child {
    pub index: u32,
    pub grammar: KindId,
    pub display: KindId,
    pub field: Option<FieldId>,
    pub named: bool,
    /// An extra, or an `ERROR` wherever the parser left it: trivia.
    pub trivia: bool,
    pub start: u32,
    pub end: u32,
    /// The child's descendant count: its subtree is the indexes
    /// `[index, index + descendants)`.
    pub descendants: u32,
}

impl Child {
    pub fn width(&self) -> u32 {
        self.end - self.start
    }
}

/// Whether a node's children tile its span `start..end`: none at all, or
/// non-trivia children each starting where the one before ends, from the
/// node's start to its end. A text leaf whose children tile it reads the text
/// it spans.
pub fn tiles(children: &[Child], start: u32, end: u32) -> bool {
    let mut at = start;
    for child in children {
        if child.trivia || child.start != at {
            return false;
        }
        at = child.end;
    }
    children.is_empty() || at == end
}

/// The one id every spelling token of a node displays: its children apart
/// from trivia, each an anonymous token with no field, when there is at
/// least one and all of them display the same id. A multi-token enum member
/// is an alias over its tokens, so each token displays the member's id, and
/// a node whose tokens display different ids spells none of them.
pub fn spelled_id(children: &[Child]) -> Option<KindId> {
    let mut tokens = children.iter().filter(|child| !child.trivia);
    let first = tokens.next()?;
    let spells = |child: &Child| !child.named && child.field.is_none() && child.display == first.display;
    (spells(first) && tokens.all(spells)).then_some(first.display)
}

/// Survey the children of the node the cursor is on. The cursor ends where
/// it started.
pub fn survey(cursor: &mut TreeCursor<'_>) -> Vec<Child> {
    let mut children = Vec::new();
    if cursor.goto_first_child() {
        loop {
            let node = cursor.node();
            children.push(Child {
                index: index_of(cursor),
                grammar: KindId(node.grammar_id()),
                display: display_id(&node),
                field: cursor.field_id().map(|field| FieldId(field.get())),
                named: node.is_named(),
                trivia: node.is_extra() || node.is_error(),
                descendants: node.descendant_count() as u32,
                start: node.start_byte() as u32,
                end: node.end_byte() as u32,
            });
            if !cursor.goto_next_sibling() {
                break;
            }
        }
        cursor.goto_parent();
    }
    children
}

/// Where an expansion sends a child.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Route {
    /// An extra or an `ERROR`: trivia, skipped by the read.
    Trivia,
    /// Stored in slot `slot`. `scalar` when the slot stores it as a unit
    /// variant.
    Slot { slot: u16, scalar: bool },
    /// A separator of slot `slot`, stored nowhere. `tagged` when it carries
    /// the slot's own field: only those mark an elided slot's holes.
    Separator { slot: u16, tagged: bool },
    /// A token the kind's own template writes: skipped.
    Layout,
}

/// Why a read failed. Each names the node's kind and its index.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ReadError {
    /// A child the kind's model has no route for: a model gap, not data.
    Unrouted { kind: KindId, child: KindId, index: u32 },
    /// A required slot no child filled.
    Missing { kind: KindId, slot: &'static str, index: u32 },
    /// A second child for a slot that holds one.
    Overfull { kind: KindId, slot: &'static str, index: u32 },
    /// A node whose kind no member of the type it was read into takes.
    Unadmitted { kind: KindId, index: u32 },
    /// A token whose text does not match its kind's interior.
    Interior { kind: KindId, index: u32 },
    /// An enum kind whose spelling tokens display none of its members' ids.
    Unspelled { kind: KindId, index: u32 },
}

impl ReadError {
    /// The error as a sentence, kinds named by `name`.
    pub fn describe(&self, name: &dyn Fn(KindId) -> &'static str) -> String {
        match *self {
            ReadError::Unrouted { kind, child, index } => format!(
                "{} (kind {}) has no route for its child {} (kind {}) at index {index}",
                name(kind),
                kind.0,
                name(child),
                child.0
            ),
            ReadError::Missing { kind, slot, index } => {
                format!("{} (kind {}) at index {index} has no child for its required slot `{slot}`", name(kind), kind.0)
            }
            ReadError::Overfull { kind, slot, index } => {
                format!("{} (kind {}) at index {index} has a second child for its slot `{slot}`", name(kind), kind.0)
            }
            ReadError::Unadmitted { kind, index } => {
                format!("{} (kind {}) at index {index} is no member of the type it was read into", name(kind), kind.0)
            }
            ReadError::Interior { kind, index } => {
                format!("{} (kind {}) at index {index} does not match its token interior", name(kind), kind.0)
            }
            ReadError::Unspelled { kind, index } => {
                format!("{} (kind {}) at index {index}: its tokens display none of its members' ids", name(kind), kind.0)
            }
        }
    }
}

/// Where a slot sits, for the errors its read raises.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SlotSite {
    pub kind: KindId,
    pub slot: &'static str,
    pub index: u32,
}

/// The node at descendant `index` of `tree` read one level into `T`: its own
/// slots, each child past them a coordinate.
pub fn read_coordinate<T: ReadTransport>(tree: &tree_sitter::Tree, ctx: &ReadCtx<'_>, index: u32) -> Result<T, ReadError> {
    let mut cursor = tree.walk();
    cursor.goto_descendant(index as usize);
    T::read(&mut cursor, ctx, Depth::ONE)
}

/// A transport a node is read into: a kind's struct, a choice over kinds, or
/// an enum kind's members.
pub trait ReadTransport: Sized {
    /// Whether a node with these ids reads into this transport.
    fn admits(grammar: KindId, display: KindId) -> bool;
    /// Whether a child tagged with a slot's field is this slot's: a struct
    /// takes any named child, a choice or an enum its members.
    fn takes_tagged(grammar: KindId, display: KindId, named: bool) -> bool;
    /// Whether a node with these ids is stored as a unit variant.
    fn scalar(grammar: KindId, display: KindId) -> bool {
        let _ = (grammar, display);
        false
    }
    /// Whether this transport claims a node by its display id: an alias
    /// envelope, or another alias kind the grammar models.
    fn shows(display: KindId) -> bool {
        let _ = display;
        false
    }
    /// What an optional slot of this type holds when no child came: the
    /// blank arm of a choice that has one, as a parsed node keeps its blank.
    fn blank() -> Option<Self> {
        None
    }
    /// Read the node the cursor is on. The cursor was created at the tree's
    /// root and ends where it started.
    fn read(cursor: &mut TreeCursor<'_>, ctx: &ReadCtx<'_>, depth: Depth) -> Result<Self, ReadError>;
    /// [`read`](Self::read) into a fresh box. A transport that owns a large
    /// value overrides it to build the value in the box, so the read keeps
    /// no second copy of it on the stack while its children are read.
    fn read_boxed(cursor: &mut TreeCursor<'_>, ctx: &ReadCtx<'_>, depth: Depth) -> Result<Box<Self>, ReadError> {
        Self::read(cursor, ctx, depth).map(Box::new)
    }
    /// The children of the node the cursor is on as its read routes them
    /// (`Routed`); `None` for a node this transport reads without routing
    /// its children, or one it does not admit. The cursor ends where it
    /// started.
    fn routes(cursor: &mut TreeCursor<'_>) -> Option<Routed> {
        let _ = cursor;
        None
    }
}

/// A node's children as its read routes them: each child (`survey`), the
/// route it takes (`Route`), and the wire key of each slot by its number.
#[derive(Debug, Clone)]
pub struct Routed {
    pub children: Vec<Child>,
    pub routes: Vec<Route>,
    pub keys: &'static [&'static str],
}

/// The routes of the node at `index` read as `T` (`ReadTransport::routes`).
/// The cursor was created at the tree's root.
pub fn routes_at<T: ReadTransport>(cursor: &mut TreeCursor<'_>, index: u32) -> Option<Routed> {
    cursor.goto_descendant(index as usize);
    T::routes(cursor)
}

impl<T: ReadTransport> ReadTransport for Box<T> {
    fn admits(grammar: KindId, display: KindId) -> bool {
        T::admits(grammar, display)
    }
    fn takes_tagged(grammar: KindId, display: KindId, named: bool) -> bool {
        T::takes_tagged(grammar, display, named)
    }
    fn scalar(grammar: KindId, display: KindId) -> bool {
        T::scalar(grammar, display)
    }
    fn blank() -> Option<Self> {
        T::blank().map(Box::new)
    }
    fn read(cursor: &mut TreeCursor<'_>, ctx: &ReadCtx<'_>, depth: Depth) -> Result<Self, ReadError> {
        T::read_boxed(cursor, ctx, depth)
    }
    fn routes(cursor: &mut TreeCursor<'_>) -> Option<Routed> {
        T::routes(cursor)
    }
}

/// A transport an envelope takes the layout of: the layout its content was
/// read with, all but the coordinate, which names the content's own node and
/// stays on it. A struct holds it in its layout field, a choice takes it from
/// the variant it holds, and a transport with no layout (a unit variant, an
/// enum kind's member) gives the default.
pub trait HasLayout<L> {
    fn take_layout(&mut self) -> L;
}

/// A layout holding only where its node came from: `at` for a node read
/// from a live tree, `span` for a snapshot node.
pub fn placed_at<T>(at: Origin) -> TransportLayout<T> {
    match at {
        Origin::Tree(coord) => TransportLayout { at: Some(coord), ..TransportLayout::default() },
        Origin::Snapshot(span) => TransportLayout { span: Some(span), ..TransportLayout::default() },
    }
}

/// Where the layout's node came from, when the layout records it.
fn origin_of<T>(layout: &TransportLayout<T>) -> Option<Origin> {
    layout.at.clone().map(Origin::Tree).or(layout.span.map(Origin::Snapshot))
}

/// A struct's layout taken for its envelope: the whole layout, with where
/// the struct came from left behind on it when the layout records that.
pub fn take_layout_keeping_at<T>(layout: &mut Option<Box<TransportLayout<T>>>) -> Option<Box<TransportLayout<T>>> {
    let taken = layout.take();
    if let Some(at) = taken.as_deref().and_then(origin_of) {
        *layout = Some(Box::new(placed_at(at)));
    }
    taken
}

impl<L, T: HasLayout<L>> HasLayout<L> for Box<T> {
    fn take_layout(&mut self) -> L {
        (**self).take_layout()
    }
}

/// An envelope's layout: the trivia its content was read with, which is the
/// envelope's when the content names the envelope's own node, else the sides
/// of the envelope's own node (at `index`), naming the envelope's node either
/// way (`at`, or `span` in a snapshot, taken where the envelope stands, since
/// a content read through a hidden child names that child). An envelope reads
/// its content under the context it was read under, so its content's trivia
/// is measured from the envelope's holder.
pub fn envelope_layout<T: crate::trivia::FromTriviaText + 'static>(
    taken: Option<Box<TransportLayout<T>>>,
    index: u32,
    at: Origin,
    ctx: &ReadCtx<'_>,
) -> Box<TransportLayout<T>> {
    match taken {
        Some(mut layout) if layout.trivia.is_some() => {
            let placed = placed_at::<T>(at);
            layout.at = placed.at;
            layout.span = placed.span;
            layout
        }
        _ => ctx.layout(index, at, false),
    }
}

/// The value of the child at the cursor in a slot: read into its transport
/// within the depth, else its coordinate. Past the depth, a child with no
/// named child (a leaf, a unit variant) is read inline where the context
/// reads leaves inline (`ReadCtx::reads_leaf_inline`), and is otherwise a
/// coordinate that frames itself with its sides.
pub fn read_value<T: ReadTransport, const A: bool>(
    cursor: &mut TreeCursor<'_>,
    ctx: &ReadCtx<'_>,
    depth: Depth,
) -> Result<SlotValue<T, A>, ReadError> {
    match depth.below() {
        Some(below) => Ok(SlotValue::Transport(T::read(cursor, ctx, below)?)),
        None if ctx.reads_leaf_inline(depth) && cursor.node().named_child_count() == 0 => Ok(SlotValue::Transport(T::read(cursor, ctx, Depth::ONE)?)),
        None => Ok(SlotValue::Coord(ctx.coordinate(&cursor.node(), index_of(cursor)))),
    }
}

/// How a slot's field stores the children routed to it. Presence and text
/// slots route by their attributes, so their `admits` and `takes_tagged`
/// are never asked.
pub trait ReadSlot: Sized {
    type Acc;
    fn start() -> Self::Acc;
    fn admits(grammar: KindId, display: KindId) -> bool;
    fn takes_tagged(grammar: KindId, display: KindId, named: bool) -> bool;
    fn scalar(grammar: KindId, display: KindId) -> bool;
    fn take(
        acc: &mut Self::Acc,
        cursor: &mut TreeCursor<'_>,
        ctx: &ReadCtx<'_>,
        depth: Depth,
        at: SlotSite,
    ) -> Result<(), ReadError>;
    /// A separator between the slot's children.
    fn separator(acc: &mut Self::Acc, tagged: bool) {
        let _ = (acc, tagged);
    }
    /// Where the next child taken arrives, `taken` children having been
    /// taken: its item in the finished slot unless `position` moves it.
    fn arrival(acc: &Self::Acc, taken: u32) -> u32 {
        let _ = acc;
        taken
    }
    /// The item in the finished slot of the child that arrived at
    /// `arrival`; `None` when finishing drops it.
    fn position(acc: &Self::Acc, arrival: u32) -> Option<u32> {
        let _ = acc;
        Some(arrival)
    }
    fn finish(acc: Self::Acc, at: SlotSite) -> Result<Self, ReadError>;
}

fn take_one<V>(acc: &mut Option<V>, at: SlotSite, value: impl FnOnce() -> Result<V, ReadError>) -> Result<(), ReadError> {
    if acc.is_some() {
        return Err(ReadError::Overfull { kind: at.kind, slot: at.slot, index: at.index });
    }
    *acc = Some(value()?);
    Ok(())
}

fn missing(at: SlotSite) -> ReadError {
    ReadError::Missing { kind: at.kind, slot: at.slot, index: at.index }
}

macro_rules! slot_value_kinds {
    () => {
        fn admits(grammar: KindId, display: KindId) -> bool {
            T::admits(grammar, display)
        }
        fn takes_tagged(grammar: KindId, display: KindId, named: bool) -> bool {
            T::takes_tagged(grammar, display, named)
        }
        fn scalar(grammar: KindId, display: KindId) -> bool {
            T::scalar(grammar, display)
        }
    };
}

impl<T: ReadTransport, const A: bool> ReadSlot for SlotValue<T, A> {
    type Acc = Option<SlotValue<T, A>>;
    fn start() -> Self::Acc {
        None
    }
    slot_value_kinds!();
    fn take(acc: &mut Self::Acc, cursor: &mut TreeCursor<'_>, ctx: &ReadCtx<'_>, depth: Depth, at: SlotSite) -> Result<(), ReadError> {
        take_one(acc, at, || read_value(cursor, ctx, depth))
    }
    fn finish(acc: Self::Acc, at: SlotSite) -> Result<Self, ReadError> {
        acc.ok_or_else(|| missing(at))
    }
}

impl<T: ReadTransport, const A: bool> ReadSlot for Option<SlotValue<T, A>> {
    type Acc = Option<SlotValue<T, A>>;
    fn start() -> Self::Acc {
        None
    }
    slot_value_kinds!();
    fn take(acc: &mut Self::Acc, cursor: &mut TreeCursor<'_>, ctx: &ReadCtx<'_>, depth: Depth, at: SlotSite) -> Result<(), ReadError> {
        take_one(acc, at, || read_value(cursor, ctx, depth))
    }
    /// With no child, the type's blank arm if it has one, else absent.
    fn finish(acc: Self::Acc, _at: SlotSite) -> Result<Self, ReadError> {
        Ok(acc.or_else(|| T::blank().map(SlotValue::Transport)))
    }
}

impl<T: ReadTransport, const A: bool> ReadSlot for Vec<SlotValue<T, A>> {
    type Acc = Vec<SlotValue<T, A>>;
    fn start() -> Self::Acc {
        Vec::new()
    }
    slot_value_kinds!();
    fn take(acc: &mut Self::Acc, cursor: &mut TreeCursor<'_>, ctx: &ReadCtx<'_>, depth: Depth, _at: SlotSite) -> Result<(), ReadError> {
        acc.push(read_value(cursor, ctx, depth)?);
        Ok(())
    }
    /// An empty list is `[]`.
    fn finish(acc: Self::Acc, _at: SlotSite) -> Result<Self, ReadError> {
        Ok(acc)
    }
}

/// A `repeat1` list: `Vec`'s read, with an empty one refused as missing.
impl<T: ReadTransport, const A: bool> ReadSlot for crate::NonEmptyVec<SlotValue<T, A>> {
    type Acc = Vec<SlotValue<T, A>>;
    fn start() -> Self::Acc {
        Vec::new()
    }
    slot_value_kinds!();
    fn take(acc: &mut Self::Acc, cursor: &mut TreeCursor<'_>, ctx: &ReadCtx<'_>, depth: Depth, at: SlotSite) -> Result<(), ReadError> {
        <Vec<SlotValue<T, A>> as ReadSlot>::take(acc, cursor, ctx, depth, at)
    }
    fn finish(acc: Self::Acc, at: SlotSite) -> Result<Self, ReadError> {
        Self::try_from(acc).map_err(|crate::non_empty::EmptyList| missing(at))
    }
}

/// An elided slot's children, in arrival order with its tagged separators.
/// With no separator every item is its own position; with separators each
/// separated segment is one position, its first item or a hole.
#[derive(Debug)]
pub struct Elided<V> {
    items: Vec<Option<V>>,
}

impl<V> Default for Elided<V> {
    fn default() -> Self {
        Self { items: Vec::new() }
    }
}

impl<V> Elided<V> {
    pub fn push(&mut self, value: V) {
        self.items.push(Some(value));
    }
    pub fn separator(&mut self, tagged: bool) {
        if tagged {
            self.items.push(None);
        }
    }
    /// Where the next item pushed arrives: after every item and hole so far.
    pub fn arrival(&self) -> u32 {
        self.items.len() as u32
    }

    /// The position in `positions` of the item that arrived at `arrival`:
    /// its own index when no separator made a hole, else its segment's,
    /// when it is the segment's first item; `None` for a later one.
    pub fn position(&self, arrival: u32) -> Option<u32> {
        if self.items.iter().all(Option::is_some) {
            return Some(arrival);
        }
        let before = self.items.get(..arrival as usize)?;
        let segment = before.iter().filter(|item| item.is_none()).count() as u32;
        let first = before.last().is_none_or(Option::is_none);
        first.then_some(segment)
    }

    pub fn positions(self) -> Vec<Option<V>> {
        if self.items.iter().all(Option::is_some) {
            return self.items;
        }
        let mut positions = Vec::new();
        let mut segment: Option<V> = None;
        for item in self.items {
            match item {
                Some(value) => {
                    if segment.is_none() {
                        segment = Some(value);
                    }
                }
                None => positions.push(segment.take()),
            }
        }
        positions.push(segment);
        positions
    }
}

impl<T: ReadTransport, const A: bool> ReadSlot for Vec<Option<SlotValue<T, A>>> {
    type Acc = Elided<SlotValue<T, A>>;
    fn start() -> Self::Acc {
        Elided::default()
    }
    slot_value_kinds!();
    fn take(acc: &mut Self::Acc, cursor: &mut TreeCursor<'_>, ctx: &ReadCtx<'_>, depth: Depth, _at: SlotSite) -> Result<(), ReadError> {
        acc.push(read_value(cursor, ctx, depth)?);
        Ok(())
    }
    fn separator(acc: &mut Self::Acc, tagged: bool) {
        acc.separator(tagged);
    }
    fn arrival(acc: &Self::Acc, _: u32) -> u32 {
        acc.arrival()
    }
    fn position(acc: &Self::Acc, arrival: u32) -> Option<u32> {
        acc.position(arrival)
    }
    /// An empty list is `[]`.
    fn finish(acc: Self::Acc, _at: SlotSite) -> Result<Self, ReadError> {
        Ok(acc.positions())
    }
}

/// A `repeat1` elided list: the elided read, with an empty one refused as missing.
impl<T: ReadTransport, const A: bool> ReadSlot for crate::NonEmptyVec<Option<SlotValue<T, A>>> {
    type Acc = Elided<SlotValue<T, A>>;
    fn start() -> Self::Acc {
        Elided::default()
    }
    slot_value_kinds!();
    fn take(acc: &mut Self::Acc, cursor: &mut TreeCursor<'_>, ctx: &ReadCtx<'_>, depth: Depth, at: SlotSite) -> Result<(), ReadError> {
        <Vec<Option<SlotValue<T, A>>> as ReadSlot>::take(acc, cursor, ctx, depth, at)
    }
    fn separator(acc: &mut Self::Acc, tagged: bool) {
        acc.separator(tagged);
    }
    fn arrival(acc: &Self::Acc, _: u32) -> u32 {
        acc.arrival()
    }
    fn position(acc: &Self::Acc, arrival: u32) -> Option<u32> {
        acc.position(arrival)
    }
    fn finish(acc: Self::Acc, at: SlotSite) -> Result<Self, ReadError> {
        Self::try_from(acc.positions()).map_err(|crate::non_empty::EmptyList| missing(at))
    }
}

/// A presence slot: `true` when its keyword is among the children, `false`
/// otherwise. The keyword stays an owner of trivia, as today's model indexes
/// have no entry for presence slots.
impl ReadSlot for bool {
    type Acc = bool;
    fn start() -> bool {
        false
    }
    fn admits(_: KindId, _: KindId) -> bool {
        false
    }
    fn takes_tagged(_: KindId, _: KindId, _: bool) -> bool {
        false
    }
    fn scalar(_: KindId, _: KindId) -> bool {
        false
    }
    fn take(acc: &mut bool, _: &mut TreeCursor<'_>, _: &ReadCtx<'_>, _: Depth, at: SlotSite) -> Result<(), ReadError> {
        if *acc {
            return Err(ReadError::Overfull { kind: at.kind, slot: at.slot, index: at.index });
        }
        *acc = true;
        Ok(())
    }
    fn finish(acc: bool, _: SlotSite) -> Result<Self, ReadError> {
        Ok(acc)
    }
}

macro_rules! text_slot {
    ($ty:ty, $finish:expr) => {
        impl ReadSlot for $ty {
            type Acc = Option<String>;
            fn start() -> Self::Acc {
                None
            }
            fn admits(_: KindId, _: KindId) -> bool {
                false
            }
            fn takes_tagged(_: KindId, _: KindId, _: bool) -> bool {
                false
            }
            fn scalar(_: KindId, _: KindId) -> bool {
                false
            }
            fn take(acc: &mut Self::Acc, cursor: &mut TreeCursor<'_>, ctx: &ReadCtx<'_>, _: Depth, at: SlotSite) -> Result<(), ReadError> {
                take_one(acc, at, || Ok(ctx.text(&cursor.node()).to_owned()))
            }
            fn finish(acc: Self::Acc, at: SlotSite) -> Result<Self, ReadError> {
                let finish: fn(Option<String>, SlotSite) -> Result<$ty, ReadError> = $finish;
                finish(acc, at)
            }
        }
    };
}

text_slot!(String, |acc, at| acc.ok_or_else(|| missing(at)));
text_slot!(Option<String>, |acc, _| Ok(acc));

/// The root of a whole-tree read inside the slot carrier a render root uses.
pub trait ReadRoot: Sized {
    fn read_root(cursor: &mut TreeCursor<'_>, ctx: &ReadCtx<'_>, depth: Depth) -> Result<Self, ReadError>;
}

impl<T: ReadTransport, const A: bool> ReadRoot for SlotValue<T, A> {
    fn read_root(cursor: &mut TreeCursor<'_>, ctx: &ReadCtx<'_>, depth: Depth) -> Result<Self, ReadError> {
        Ok(SlotValue::Transport(T::read(cursor, ctx, depth)?))
    }
}

/// A token interior's pattern, compiled once, on first use. The expansion
/// already compiled it, so a pattern that does not compile never reaches here.
pub struct Interior {
    pattern: &'static str,
    compiled: OnceLock<regex::Regex>,
}

impl Interior {
    pub const fn new(pattern: &'static str) -> Self {
        Self { pattern, compiled: OnceLock::new() }
    }
    pub fn captures<'t>(&self, text: &'t str) -> Option<Captures<'t>> {
        self.compiled
            .get_or_init(|| regex::Regex::new(self.pattern).expect("the expansion compiled this pattern"))
            .captures(text)
    }
}

/// How an interior slot's field stores its named capture.
pub trait FromCapture: Sized {
    fn from_capture(capture: Option<&str>, at: SlotSite) -> Result<Self, ReadError>;
}

impl FromCapture for String {
    fn from_capture(capture: Option<&str>, at: SlotSite) -> Result<Self, ReadError> {
        capture.map(str::to_owned).ok_or_else(|| missing(at))
    }
}

impl FromCapture for Option<String> {
    fn from_capture(capture: Option<&str>, _: SlotSite) -> Result<Self, ReadError> {
        Ok(capture.map(str::to_owned))
    }
}

/// A flag: `true` when its group matched.
impl FromCapture for bool {
    fn from_capture(capture: Option<&str>, _: SlotSite) -> Result<Self, ReadError> {
        Ok(capture.is_some())
    }
}

/// A capture slot's value.
pub fn capture<F: FromCapture>(captures: &Captures<'_>, name: &str, at: SlotSite) -> Result<F, ReadError> {
    F::from_capture(captures.name(name).map(|m| m.as_str()), at)
}

/// A delimiter flag's bit for a leading flank.
pub const LEADING: u8 = 1;
/// A delimiter flag's bit for a trailing flank.
pub const TRAILING: u8 = 2;

/// A list's delimiter flags, as today's `_hasSeparatorFlank` computes them.
/// `leading` and `trailing` are `Some(mandatory)` for each flank the kind
/// leaves optional, with the mandatory flank tokens on the other side. A
/// flank is present when the list spans past its first (last) item. Where
/// that item is a unit variant, the flank is present when the list holds
/// more anonymous unfielded tokens than the separators between its items and
/// the mandatory flank tokens account for.
pub fn delimiter(list: &Node<'_>, children: &[Child], routes: &[Route], items: u16, leading: Option<u16>, trailing: Option<u16>) -> u8 {
    let item_children: Vec<(&Child, bool)> = children
        .iter()
        .zip(routes)
        .filter_map(|(child, route)| match *route {
            Route::Slot { slot, scalar } if slot == items => Some((child, scalar)),
            _ => None,
        })
        .collect();
    let others = children
        .iter()
        .zip(routes)
        .filter(|(child, route)| !child.named && child.field.is_none() && !matches!(route, Route::Trivia | Route::Slot { .. }))
        .count();
    let flank = |anchor: Option<&(&Child, bool)>, mandatory: u16, past: &dyn Fn(&Child) -> bool| match anchor {
        Some((child, false)) => past(child),
        _ => others > item_children.len().saturating_sub(1) + mandatory as usize,
    };
    let (start, end) = (list.start_byte() as u32, list.end_byte() as u32);
    let mut bits = 0;
    if leading.is_some_and(|mandatory| flank(item_children.first(), mandatory, &|child| start < child.start)) {
        bits |= LEADING;
    }
    if trailing.is_some_and(|mandatory| flank(item_children.last(), mandatory, &|child| end > child.end)) {
        bits |= TRAILING;
    }
    bits
}

/// Read the node at `index` into `T`. The cursor was created at the tree's
/// root.
pub fn read_at<T: ReadTransport>(cursor: &mut TreeCursor<'_>, ctx: &ReadCtx<'_>, index: u32, depth: Depth) -> Result<T, ReadError> {
    cursor.goto_descendant(index as usize);
    T::read(cursor, ctx, depth)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_relaxed_keyword_stamps_its_display_and_a_plain_token_stamps_its_grammar_id() {
        const WORD: u16 = 1;
        const RELAXED: u16 = 40;
        let ctx = ReadCtx::new("", 1, |_| false).with_relaxes(|grammar, display| display.0 == WORD && grammar.0 == RELAXED);
        assert_eq!(ctx.stamped_kind(KindId(RELAXED), KindId(WORD)), KindId(WORD), "the relaxed keyword reads as the word rule");
        assert_eq!(ctx.stamped_kind(KindId(RELAXED), KindId(RELAXED)), KindId(RELAXED), "the same token undisplayed reads as itself");
        assert_eq!(ctx.stamped_kind(KindId(41), KindId(WORD)), KindId(41), "another token displayed as the word rule is not relaxed");
    }

    #[test]
    fn a_snapshot_measures_each_child_from_its_holders_start() {
        use crate::points::{LineTable, Point, PointSpan};
        let source = "\n\nfn f() {\n    x\n}\n";
        let mut parser = tree_sitter::Parser::new();
        parser.set_language(&tree_sitter_rust::LANGUAGE.into()).unwrap();
        let tree = parser.parse(source, None).unwrap();
        let lines = LineTable::new(source);
        let measure = SnapshotCtx::new(&lines, None, 0);
        let ctx = ReadCtx::new(source, 1, |_| false).snapshot(&measure);
        let root = tree.walk();
        let item_span = Origin::Snapshot(PointSpan { start: Point { row: 2, column: 0 }, end: Point { row: 4, column: 1 } });
        assert_eq!(ctx.at_of(&root), Origin::Snapshot(PointSpan { start: Point::ZERO, end: lines.point(source.len()).unwrap() }));
        let mut item = tree.walk();
        item.goto_first_child();
        ctx.hold(&root);
        assert_eq!(ctx.at_of(&item), item_span);
        let mut name = tree.walk();
        name.goto_first_child();
        name.goto_first_child();
        name.goto_next_sibling();
        ctx.hold(&item);
        assert_eq!(ctx.at_of(&name), Origin::Snapshot(PointSpan { start: Point { row: 0, column: 3 }, end: Point { row: 0, column: 4 } }));
        ctx.release();
        assert_eq!(ctx.at_of(&item), item_span, "a released holder measures the next sibling from the shared holder");
        ctx.release();
        assert_eq!(ctx.at_of(&root), Origin::Snapshot(PointSpan { start: Point::ZERO, end: lines.point(source.len()).unwrap() }));
    }

    /// A lookup that gives every node one leading extra, one layout run and
    /// one written entry.
    struct OneOfEach;

    impl SideLookup for OneOfEach {
        fn side(&self, _: u32, side: TriviaSide, edge_changed: bool) -> Box<dyn std::any::Any> {
            let text = |text: &str| TriviaEntry::new(SlotValue::Transport(crate::trivia::TriviaText { kind: KindId(7), text: text.into(), span: None, before: None, after: None }));
            let entries: Vec<SideEntry<crate::trivia::TriviaText>> = match side {
                TriviaSide::Leading if !edge_changed => vec![
                    SideEntry::Source { entry: TriviaEntry::new(SlotValue::Coord(NodeCoordinate::new(1, 3, 4, Span { start: 4, end: 8 }))), kind: KindId(7), span: Span { start: 4, end: 8 }, adjacent: None },
                    SideEntry::Layout(text("\n")),
                    SideEntry::Written(text("// w")),
                ],
                _ => Vec::new(),
            };
            Box::new(entries)
        }
    }

    /// A lookup that gives every node a leading side of one layout run and
    /// one written entry: a run at the side's outer edge.
    struct EdgeRun;

    impl SideLookup for EdgeRun {
        fn side(&self, _: u32, side: TriviaSide, _: bool) -> Box<dyn std::any::Any> {
            let text = |text: &str| TriviaEntry::new(SlotValue::Transport(crate::trivia::TriviaText { kind: KindId(7), text: text.into(), span: None, before: None, after: None }));
            let entries: Vec<SideEntry<crate::trivia::TriviaText>> = match side {
                TriviaSide::Leading => vec![SideEntry::Layout(text(" ")), SideEntry::Written(text("// w"))],
                _ => Vec::new(),
            };
            Box::new(entries)
        }
    }

    #[test]
    fn a_snapshot_keeps_the_runs_at_a_sides_outer_edge_but_its_own_nodes() {
        use crate::points::{LineTable, Point, PointSpan};
        let source = "a b";
        let lines = LineTable::new(source);
        let at = Origin::Snapshot(PointSpan { start: Point::ZERO, end: Point::ZERO });
        let leading = |root: u32| {
            let measure = SnapshotCtx::new(&lines, None, root);
            let ctx = ReadCtx::new(source, 1, |_| false).snapshot(&measure).with_sides(&EdgeRun);
            let side = ctx.layout::<crate::trivia::TriviaText>(3, at.clone(), false).trivia.and_then(|trivia| trivia.leading).expect("a seated leading side");
            side.into_iter().map(|entry| entry.value.transport().map(|text| text.text.to_string()).expect("a snapshot entry is text")).collect::<Vec<_>>()
        };
        assert_eq!(leading(0), [" ", "// w"], "a node inside the snapshot keeps the run its neighbour faces");
        assert_eq!(leading(3), ["// w"], "the snapshot's own node drops the run toward a neighbour outside it");
    }

    #[test]
    fn a_snapshot_seats_an_extra_as_its_text_measured_from_the_context_holder_and_keeps_the_runs_inside_a_side() {
        use crate::points::{LineTable, Point, PointSpan};
        let source = "a\n  // x\nb";
        let lines = LineTable::new(source);
        let measure = SnapshotCtx::new(&lines, Some(2), 0);
        let ctx = ReadCtx::new(source, 1, |_| false).snapshot(&measure).with_sides(&OneOfEach);
        let at = Origin::Snapshot(PointSpan { start: Point::ZERO, end: Point::ZERO });
        let leading = ctx.layout::<crate::trivia::TriviaText>(3, at, false).trivia.and_then(|trivia| trivia.leading).expect("a seated leading side");
        let texts: Vec<_> = leading.into_iter().map(|entry| entry.value.transport().cloned().expect("a snapshot entry is text")).collect();
        assert_eq!(texts, [
            crate::trivia::TriviaText { kind: KindId(7), text: "// x".into(), span: Some(PointSpan { start: Point { row: 0, column: 2 }, end: Point { row: 0, column: 6 } }), before: None, after: None },
            crate::trivia::TriviaText { kind: KindId(7), text: "\n".into(), span: None, before: None, after: None },
            crate::trivia::TriviaText { kind: KindId(7), text: "// w".into(), span: None, before: None, after: None },
        ]);
    }

    #[test]
    fn a_live_read_seats_a_side_as_the_lookup_gives_it_and_drops_a_changed_edges_runs_through_it() {
        let ctx = ReadCtx::new("", 1, |_| false).with_sides(&OneOfEach);
        let at = || Origin::Tree(NodeCoordinate::new(1, 3, 4, Span { start: 0, end: 0 }));
        let leading = ctx.layout::<crate::trivia::TriviaText>(3, at(), false).trivia.and_then(|trivia| trivia.leading);
        assert_eq!(leading.map(|entries| entries.len()), Some(3));
        let changed = ctx.with_changed(3, ChangedEdges { leading: true, trailing: false });
        assert!(changed.layout::<crate::trivia::TriviaText>(3, at(), false).trivia.is_none(), "the lookup is asked for the changed edge");
        assert!(ReadCtx::new("", 1, |_| false).layout::<crate::trivia::TriviaText>(3, at(), false).trivia.is_none(), "a read with no lookup seats nothing");
    }

    #[test]
    fn a_coordinate_ends_past_its_last_descendant() {
        let source = "fn a() { let x = 1; }";
        let mut parser = tree_sitter::Parser::new();
        parser.set_language(&tree_sitter_rust::LANGUAGE.into()).unwrap();
        let tree = parser.parse(source, None).unwrap();
        let ctx = ReadCtx::new(source, 1, |_| false);
        let mut cursor = tree.walk();
        for index in 0..tree.root_node().descendant_count() {
            cursor.goto_descendant(index);
            let Origin::Tree(coordinate) = ctx.at_of(&cursor) else { panic!("a live read names a coordinate") };
            assert_eq!(coordinate.index as usize, index);
            assert_eq!(coordinate.end as usize, index + cursor.node().descendant_count());
        }
    }

    #[test]
    fn one_level_reads_the_node_and_leaves_its_children_as_coordinates() {
        assert_eq!(Depth::ONE.below(), None);
        assert_eq!(Depth::Levels(NonZeroU32::new(3).unwrap()).below(), Some(Depth::Levels(NonZeroU32::new(2).unwrap())));
        assert_eq!(Depth::All.below(), Some(Depth::All));
    }

    #[test]
    fn a_kinds_minimum_depth_deepens_a_shallower_read_only() {
        assert_eq!(Depth::ONE.at_least(2), Depth::Levels(NonZeroU32::new(2).unwrap()));
        assert_eq!(Depth::Levels(NonZeroU32::new(5).unwrap()).at_least(2), Depth::Levels(NonZeroU32::new(5).unwrap()));
        assert_eq!(Depth::All.at_least(2), Depth::All);
        assert_eq!(Depth::ONE.at_least(0), Depth::ONE);
    }

    #[test]
    fn a_refusal_names_the_kind_the_child_and_its_index() {
        let name = |k: KindId| if k.0 == 208 { "function_item" } else { "block" };
        let refusal = ReadError::Unrouted { kind: KindId(208), child: KindId(313), index: 451 };
        assert_eq!(
            refusal.describe(&name),
            "function_item (kind 208) has no route for its child block (kind 313) at index 451"
        );
    }

    fn site() -> SlotSite {
        SlotSite { kind: KindId(1), slot: "items", index: 0 }
    }

    /// A transport for the slot tests: kind 5, with a blank arm when `BLANK`.
    #[derive(Debug, Clone, PartialEq)]
    struct Probe<const BLANK: bool>;

    impl<const BLANK: bool> ReadTransport for Probe<BLANK> {
        fn admits(grammar: KindId, _: KindId) -> bool {
            grammar.0 == 5
        }
        fn takes_tagged(grammar: KindId, display: KindId, _: bool) -> bool {
            Self::admits(grammar, display)
        }
        fn blank() -> Option<Self> {
            BLANK.then_some(Probe)
        }
        fn read(_: &mut TreeCursor<'_>, _: &ReadCtx<'_>, _: Depth) -> Result<Self, ReadError> {
            Ok(Probe)
        }
    }

    type Plain = Probe<false>;

    fn token(start: u32, end: u32, trivia: bool) -> Child {
        Child { index: 0, grammar: KindId(9), display: KindId(9), field: None, named: false, trivia, start, end, descendants: 1 }
    }

    #[test]
    fn children_tile_a_span_when_contiguous_and_free_of_trivia() {
        assert!(tiles(&[], 0, 3));
        assert!(tiles(&[token(0, 1, false), token(1, 3, false)], 0, 3));
        assert!(!tiles(&[token(0, 1, false), token(2, 3, false)], 0, 3));
        assert!(!tiles(&[token(0, 1, false)], 0, 3));
        assert!(!tiles(&[token(0, 1, false), token(1, 3, true)], 0, 3));
    }

    #[test]
    fn a_node_is_spelled_by_the_one_id_all_its_tokens_display() {
        let shown = |display: u16| Child { display: KindId(display), ..token(0, 1, false) };
        assert_eq!(spelled_id(&[shown(143), shown(143)]), Some(KindId(143)));
        assert_eq!(spelled_id(&[shown(143), token(1, 2, true), shown(143)]), Some(KindId(143)));
        assert_eq!(spelled_id(&[shown(61), shown(51)]), None);
        assert_eq!(spelled_id(&[Child { named: true, ..shown(143) }]), None);
        assert_eq!(spelled_id(&[Child { field: Some(FieldId(1)), ..shown(143) }]), None);
        assert_eq!(spelled_id(&[token(0, 1, true)]), None);
        assert_eq!(spelled_id(&[]), None);
    }

    #[test]
    fn an_elided_slot_keeps_one_position_per_separated_segment() {
        // `[a, , b,]`: a, sep, sep, b, sep → a | (hole) | b | (hole)
        let mut acc = Elided::<u8>::default();
        acc.push(1);
        acc.separator(true);
        acc.separator(true);
        acc.push(2);
        acc.separator(true);
        assert_eq!(acc.positions(), vec![Some(1), None, Some(2), None]);
    }

    #[test]
    fn an_elided_slot_without_separators_keeps_every_item() {
        let mut acc = Elided::<u8>::default();
        acc.push(1);
        acc.push(2);
        assert_eq!(acc.positions(), vec![Some(1), Some(2)]);
        assert_eq!(Elided::<u8>::default().positions(), Vec::<Option<u8>>::new());
    }

    #[test]
    fn an_untagged_separator_makes_no_hole() {
        let mut acc = Elided::<u8>::default();
        acc.push(1);
        acc.separator(false);
        acc.push(2);
        assert_eq!(acc.positions(), vec![Some(1), Some(2)]);
    }

    #[test]
    fn a_required_slot_with_no_child_is_missing() {
        assert_eq!(
            <SlotValue<Plain> as ReadSlot>::finish(None, site()),
            Err(ReadError::Missing { kind: KindId(1), slot: "items", index: 0 })
        );
    }

    #[test]
    fn an_empty_list_reads_as_an_empty_vec() {
        assert_eq!(<Vec<SlotValue<Plain>> as ReadSlot>::finish(Vec::new(), site()), Ok(Vec::new()));
        assert_eq!(<Vec<Option<SlotValue<Plain>>> as ReadSlot>::finish(Elided::default(), site()), Ok(Vec::new()));
    }

    #[test]
    fn an_empty_repeat1_list_is_missing() {
        let missing = ReadError::Missing { kind: KindId(1), slot: "items", index: 0 };
        assert_eq!(<crate::NonEmptyVec<SlotValue<Plain>> as ReadSlot>::finish(Vec::new(), site()).err(), Some(missing.clone()));
        assert_eq!(<crate::NonEmptyVec<Option<SlotValue<Plain>>> as ReadSlot>::finish(Elided::default(), site()).err(), Some(missing));
    }

    #[test]
    fn an_absent_optional_slot_reads_as_its_blank_arm_or_absent() {
        assert_eq!(<Option<SlotValue<Probe<true>>> as ReadSlot>::finish(None, site()), Ok(Some(SlotValue::Transport(Probe))));
        assert_eq!(<Option<SlotValue<Plain>> as ReadSlot>::finish(None, site()), Ok(None));
    }

    #[test]
    fn a_presence_slot_reads_true_or_false() {
        assert_eq!(<bool as ReadSlot>::finish(true, site()), Ok(true));
        assert_eq!(<bool as ReadSlot>::finish(false, site()), Ok(false));
    }
}
