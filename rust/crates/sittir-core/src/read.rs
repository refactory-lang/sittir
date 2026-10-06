//! The typed reader's runtime: what every `#[derive(Transport)]` expansion
//! calls. A read walks one `TreeCursor` created at the tree's root, so the
//! cursor's descendant index is a node's row in the whole tree. A node's
//! children are surveyed once, routed to slots, placed as trivia, and then
//! read in a second pass, each with the sides the placement gave it. A child
//! past the read's depth is a coordinate: its tree and row, its span and its
//! kind. A child no route takes refuses the read. No grammar fact lives here:
//! each one reaches the reader through a generated attribute.

use crate::engine::encode_handle;
use crate::layout::TransportLayout;
use crate::slot::{NodeCoordinate, SlotValue};
use crate::trivia::{TransportTrivia, TriviaEntry};
use crate::types::{FieldId, KindId, Span};
use std::collections::BTreeMap;
use std::num::NonZeroU32;
use std::sync::OnceLock;
use tree_sitter::{Node, TreeCursor};

pub use regex::Captures;

/// How many levels a read expands below the node it starts at.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
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

/// What every read of one tree shares: the source its spans index into and
/// the id its coordinates carry.
#[derive(Debug, Clone, Copy)]
pub struct ReadCtx<'s> {
    pub source: &'s str,
    pub tree_id: u32,
}

impl<'s> ReadCtx<'s> {
    pub fn new(source: &'s str, tree_id: u32) -> Self {
        Self { source, tree_id }
    }

    /// The coordinate of a surveyed child: its tree and row, its span and its
    /// grammar kind.
    pub fn coordinate_of(&self, child: &Child) -> NodeCoordinate {
        NodeCoordinate {
            kind: Some(child.grammar),
            ..NodeCoordinate::new(encode_handle(self.tree_id, child.row), Span { start: child.start, end: child.end })
        }
    }

    /// The coordinate of the node at `row`.
    pub fn coordinate(&self, node: &Node<'_>, row: u32) -> NodeCoordinate {
        let range = node.byte_range();
        NodeCoordinate {
            kind: Some(KindId(node.grammar_id())),
            ..NodeCoordinate::new(
                encode_handle(self.tree_id, row),
                Span { start: range.start as u32, end: range.end as u32 },
            )
        }
    }

    /// The source text a node spans.
    pub fn text(&self, node: &Node<'_>) -> &'s str {
        &self.source[node.byte_range()]
    }
}

/// The row of the node the cursor is on: its descendant index from the
/// tree's root, which `TreeCursor::goto_descendant` reaches again.
pub fn row_of(cursor: &TreeCursor<'_>) -> u32 {
    cursor.descendant_index() as u32
}

/// What the first pass learns about one child.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Child {
    pub row: u32,
    pub grammar: KindId,
    pub display: KindId,
    pub field: Option<FieldId>,
    pub named: bool,
    /// An extra, or an `ERROR` wherever the parser left it: placed as trivia.
    pub trivia: bool,
    pub start: u32,
    pub end: u32,
    /// The source row the child starts on.
    pub start_row: usize,
    /// The source row of the child's last byte: a span that ends with its
    /// line break ends on the row that break closes.
    pub end_row: usize,
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
            let end = node.end_position();
            children.push(Child {
                row: row_of(cursor),
                grammar: KindId(node.grammar_id()),
                display: KindId(node.kind_id()),
                field: cursor.field_id().map(|field| FieldId(field.get())),
                named: node.is_named(),
                trivia: node.is_extra() || node.is_error(),
                start: node.start_byte() as u32,
                end: node.end_byte() as u32,
                start_row: node.start_position().row,
                end_row: if end.column == 0 && node.end_byte() > node.start_byte() { end.row - 1 } else { end.row },
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
    /// Placed as trivia by the placement rule.
    Trivia,
    /// Stored in slot `slot`. `scalar` when the slot stores it as a unit
    /// variant, so it owns no trivia.
    Slot { slot: u16, scalar: bool },
    /// A separator of slot `slot`, stored nowhere. `tagged` when it carries
    /// the slot's own field: only those mark an elided slot's holes.
    Separator { slot: u16, tagged: bool },
    /// A token the kind's own template writes: skipped.
    Layout,
}

/// Why a read failed. Each names the node's kind and its row.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ReadError {
    /// A child the kind's model has no route for: a model gap, not data.
    Unrouted { kind: KindId, child: KindId, row: u32 },
    /// A required slot no child filled.
    Missing { kind: KindId, slot: &'static str, row: u32 },
    /// A second child for a slot that holds one.
    Overfull { kind: KindId, slot: &'static str, row: u32 },
    /// A node whose kind no member of the type it was read into takes.
    Unadmitted { kind: KindId, row: u32 },
    /// A token whose text does not match its kind's interior.
    Interior { kind: KindId, row: u32 },
    /// An enum kind whose spelling tokens display none of its members' ids.
    Unspelled { kind: KindId, row: u32 },
}

impl ReadError {
    /// The error as a sentence, kinds named by `name`.
    pub fn describe(&self, name: &dyn Fn(KindId) -> &'static str) -> String {
        match *self {
            ReadError::Unrouted { kind, child, row } => format!(
                "{} (kind {}) has no route for its child {} (kind {}) at row {row}",
                name(kind),
                kind.0,
                name(child),
                child.0
            ),
            ReadError::Missing { kind, slot, row } => {
                format!("{} (kind {}) at row {row} has no child for its required slot `{slot}`", name(kind), kind.0)
            }
            ReadError::Overfull { kind, slot, row } => {
                format!("{} (kind {}) at row {row} has a second child for its slot `{slot}`", name(kind), kind.0)
            }
            ReadError::Unadmitted { kind, row } => {
                format!("{} (kind {}) at row {row} is no member of the type it was read into", name(kind), kind.0)
            }
            ReadError::Interior { kind, row } => {
                format!("{} (kind {}) at row {row} does not match its token interior", name(kind), kind.0)
            }
            ReadError::Unspelled { kind, row } => {
                format!("{} (kind {}) at row {row}: its tokens display none of its members' ids", name(kind), kind.0)
            }
        }
    }
}

/// Where a slot sits, for the errors its read raises.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SlotSite {
    pub kind: KindId,
    pub slot: &'static str,
    pub row: u32,
}

/// One extra the placement rule gave a node: its coordinate, whether it
/// shares a row with its owner, and on a same-row trailing entry the
/// anonymous tokens between the owner and it.
#[derive(Debug, Clone, PartialEq)]
pub struct Entry {
    pub coord: NodeCoordinate,
    pub same_line: bool,
    pub tokens_between: u16,
}

impl Entry {
    pub fn into_trivia<T>(self) -> TriviaEntry<T> {
        TriviaEntry {
            value: SlotValue::Coord(self.coord),
            same_line: self.same_line,
            tokens_between: self.tokens_between,
        }
    }
}

/// What a node's parent placed on it: whether it owns trivia at all (named,
/// not an extra, at least a byte wide, and not stored as a unit variant),
/// and the extras placed before and after it.
#[derive(Debug, Clone, Default, PartialEq)]
pub struct Sides {
    pub owner: bool,
    pub leading: Vec<Entry>,
    pub trailing: Vec<Entry>,
}

impl Sides {
    /// A tree's root: it owns trivia, and nothing outside it placed any.
    pub fn root() -> Sides {
        Sides { owner: true, ..Sides::default() }
    }

    /// The layout of a node that read none of its own: the extras its parent
    /// placed on it, or `None` when it placed none.
    pub fn into_layout<T>(self) -> Option<TransportLayout<T>> {
        Placement::default().into_layout(self)
    }
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
    /// What an optional slot of this type holds when no child came: the
    /// blank arm of a choice that has one, as a parsed node keeps its blank.
    fn blank() -> Option<Self> {
        None
    }
    /// Read the node the cursor is on. The cursor was created at the tree's
    /// root and ends where it started.
    fn read(cursor: &mut TreeCursor<'_>, ctx: &ReadCtx<'_>, depth: Depth, sides: Sides) -> Result<Self, ReadError>;
    /// The sides the placement rule gives the child at `row` among the
    /// children of the node the cursor is on.
    fn sides_of(cursor: &mut TreeCursor<'_>, ctx: &ReadCtx<'_>, row: u32) -> Result<Sides, ReadError>;
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
    fn read(cursor: &mut TreeCursor<'_>, ctx: &ReadCtx<'_>, depth: Depth, sides: Sides) -> Result<Self, ReadError> {
        T::read(cursor, ctx, depth, sides).map(Box::new)
    }
    fn sides_of(cursor: &mut TreeCursor<'_>, ctx: &ReadCtx<'_>, row: u32) -> Result<Sides, ReadError> {
        T::sides_of(cursor, ctx, row)
    }
}

/// A transport an envelope takes the layout of: the layout its content was
/// read with. A struct holds it in its layout field, a choice takes it from
/// the variant it holds, and a transport with no layout (a unit variant, an
/// enum kind's member) gives the default.
pub trait HasLayout<L> {
    fn take_layout(&mut self) -> L;
}

impl<L, T: HasLayout<L>> HasLayout<L> for Box<T> {
    fn take_layout(&mut self) -> L {
        (**self).take_layout()
    }
}

/// The value of the child at the cursor in a slot: read into its transport
/// within the depth, or, past it, inline when the child has no named child
/// (a leaf, a unit variant), else its coordinate.
pub fn read_value<T: ReadTransport, const A: bool>(
    cursor: &mut TreeCursor<'_>,
    ctx: &ReadCtx<'_>,
    depth: Depth,
    sides: Sides,
) -> Result<SlotValue<T, A>, ReadError> {
    match depth.below() {
        Some(below) => Ok(SlotValue::Transport(T::read(cursor, ctx, below, sides)?)),
        None if cursor.node().named_child_count() == 0 => Ok(SlotValue::Transport(T::read(cursor, ctx, Depth::ONE, sides)?)),
        None => Ok(SlotValue::Coord(ctx.coordinate(&cursor.node(), row_of(cursor)))),
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
        sides: Sides,
        at: SlotSite,
    ) -> Result<(), ReadError>;
    /// A separator between the slot's children.
    fn separator(acc: &mut Self::Acc, tagged: bool) {
        let _ = (acc, tagged);
    }
    fn finish(acc: Self::Acc, at: SlotSite) -> Result<Self, ReadError>;
}

fn take_one<V>(acc: &mut Option<V>, at: SlotSite, value: impl FnOnce() -> Result<V, ReadError>) -> Result<(), ReadError> {
    if acc.is_some() {
        return Err(ReadError::Overfull { kind: at.kind, slot: at.slot, row: at.row });
    }
    *acc = Some(value()?);
    Ok(())
}

fn missing(at: SlotSite) -> ReadError {
    ReadError::Missing { kind: at.kind, slot: at.slot, row: at.row }
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
    fn take(acc: &mut Self::Acc, cursor: &mut TreeCursor<'_>, ctx: &ReadCtx<'_>, depth: Depth, sides: Sides, at: SlotSite) -> Result<(), ReadError> {
        take_one(acc, at, || read_value(cursor, ctx, depth, sides))
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
    fn take(acc: &mut Self::Acc, cursor: &mut TreeCursor<'_>, ctx: &ReadCtx<'_>, depth: Depth, sides: Sides, at: SlotSite) -> Result<(), ReadError> {
        take_one(acc, at, || read_value(cursor, ctx, depth, sides))
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
    fn take(acc: &mut Self::Acc, cursor: &mut TreeCursor<'_>, ctx: &ReadCtx<'_>, depth: Depth, sides: Sides, _at: SlotSite) -> Result<(), ReadError> {
        acc.push(read_value(cursor, ctx, depth, sides)?);
        Ok(())
    }
    fn finish(acc: Self::Acc, at: SlotSite) -> Result<Self, ReadError> {
        if acc.is_empty() { Err(missing(at)) } else { Ok(acc) }
    }
}

impl<T: ReadTransport, const A: bool> ReadSlot for Option<Vec<SlotValue<T, A>>> {
    type Acc = Vec<SlotValue<T, A>>;
    fn start() -> Self::Acc {
        Vec::new()
    }
    slot_value_kinds!();
    fn take(acc: &mut Self::Acc, cursor: &mut TreeCursor<'_>, ctx: &ReadCtx<'_>, depth: Depth, sides: Sides, _at: SlotSite) -> Result<(), ReadError> {
        acc.push(read_value(cursor, ctx, depth, sides)?);
        Ok(())
    }
    /// Present even when empty: today's wrap stores an empty list.
    fn finish(acc: Self::Acc, _at: SlotSite) -> Result<Self, ReadError> {
        Ok(Some(acc))
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
    fn take(acc: &mut Self::Acc, cursor: &mut TreeCursor<'_>, ctx: &ReadCtx<'_>, depth: Depth, sides: Sides, _at: SlotSite) -> Result<(), ReadError> {
        acc.push(read_value(cursor, ctx, depth, sides)?);
        Ok(())
    }
    fn separator(acc: &mut Self::Acc, tagged: bool) {
        acc.separator(tagged);
    }
    fn finish(acc: Self::Acc, at: SlotSite) -> Result<Self, ReadError> {
        let positions = acc.positions();
        if positions.is_empty() { Err(missing(at)) } else { Ok(positions) }
    }
}

impl<T: ReadTransport, const A: bool> ReadSlot for Option<Vec<Option<SlotValue<T, A>>>> {
    type Acc = Elided<SlotValue<T, A>>;
    fn start() -> Self::Acc {
        Elided::default()
    }
    slot_value_kinds!();
    fn take(acc: &mut Self::Acc, cursor: &mut TreeCursor<'_>, ctx: &ReadCtx<'_>, depth: Depth, sides: Sides, _at: SlotSite) -> Result<(), ReadError> {
        acc.push(read_value(cursor, ctx, depth, sides)?);
        Ok(())
    }
    fn separator(acc: &mut Self::Acc, tagged: bool) {
        acc.separator(tagged);
    }
    fn finish(acc: Self::Acc, _at: SlotSite) -> Result<Self, ReadError> {
        Ok(Some(acc.positions()))
    }
}

/// A presence slot: `true` when its keyword is among the children, absent
/// otherwise. The keyword stays an owner of trivia, as today's model rows
/// have no entry for presence slots.
impl ReadSlot for Option<bool> {
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
    fn take(acc: &mut bool, _: &mut TreeCursor<'_>, _: &ReadCtx<'_>, _: Depth, _: Sides, at: SlotSite) -> Result<(), ReadError> {
        if *acc {
            return Err(ReadError::Overfull { kind: at.kind, slot: at.slot, row: at.row });
        }
        *acc = true;
        Ok(())
    }
    fn finish(acc: bool, _: SlotSite) -> Result<Self, ReadError> {
        Ok(acc.then_some(true))
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
            fn take(acc: &mut Self::Acc, cursor: &mut TreeCursor<'_>, ctx: &ReadCtx<'_>, _: Depth, _: Sides, at: SlotSite) -> Result<(), ReadError> {
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
        Ok(SlotValue::Transport(T::read(cursor, ctx, depth, Sides::root())?))
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

/// A flag: present when its group matched.
impl FromCapture for Option<bool> {
    fn from_capture(capture: Option<&str>, _: SlotSite) -> Result<Self, ReadError> {
        Ok(capture.map(|_| true))
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

/// A list's separator kind, as today's `_separatorKindOf` reads it: the first
/// anonymous unfielded child among `candidates`. A kind with a declared
/// default falls back to it at its call site.
pub fn separator_kind(children: &[Child], routes: &[Route], candidates: &[KindId]) -> Option<u16> {
    children
        .iter()
        .zip(routes)
        .find(|(child, route)| {
            !child.named && child.field.is_none() && !matches!(route, Route::Slot { .. }) && candidates.contains(&child.display)
        })
        .map(|(child, _)| child.display.0)
}

/// Read the node at `row` into `T`, with the sides its parent's placement
/// gives it. `P` reads the parent's routes. The cursor was created at the
/// tree's root.
pub fn read_at<T: ReadTransport, P: ReadTransport>(
    cursor: &mut TreeCursor<'_>,
    ctx: &ReadCtx<'_>,
    row: u32,
    depth: Depth,
) -> Result<T, ReadError> {
    cursor.goto_descendant(row as usize);
    let sides = if cursor.goto_parent() {
        let sides = P::sides_of(cursor, ctx, row)?;
        cursor.goto_descendant(row as usize);
        sides
    } else {
        Sides::root()
    };
    T::read(cursor, ctx, depth, sides)
}

/// Where the placement rule puts the extras among one node's children: the
/// sides each child receives, and the node's own entries when no child owns
/// any.
#[derive(Debug, Default)]
pub struct Placement {
    pub sides: Vec<Sides>,
    pub own_leading: Vec<Entry>,
    pub own_trailing: Vec<Entry>,
    pub inner: BTreeMap<String, Vec<Entry>>,
    rows: Vec<u32>,
}

impl Placement {
    /// The sides of child `i`, taken out.
    pub fn take(&mut self, i: usize) -> Sides {
        std::mem::take(&mut self.sides[i])
    }

    /// The sides of the child at `row`, taken out.
    pub fn take_row(&mut self, row: u32) -> Option<Sides> {
        let i = self.rows.iter().position(|&r| r == row)?;
        Some(self.take(i))
    }

    /// The node's layout: what its parent placed, then its own entries.
    /// `None` when it holds no entry, as today's read stores no trivia then.
    pub fn into_layout<T>(self, sides: Sides) -> Option<TransportLayout<T>> {
        let leading: Vec<TriviaEntry<T>> = sides.leading.into_iter().chain(self.own_leading).map(Entry::into_trivia).collect();
        let trailing: Vec<TriviaEntry<T>> = sides.trailing.into_iter().chain(self.own_trailing).map(Entry::into_trivia).collect();
        let inner: BTreeMap<String, Vec<TriviaEntry<T>>> = self
            .inner
            .into_iter()
            .map(|(key, entries)| (key, entries.into_iter().map(Entry::into_trivia).collect()))
            .collect();
        if leading.is_empty() && trailing.is_empty() && inner.is_empty() {
            return None;
        }
        let some = |entries: Vec<TriviaEntry<T>>| (!entries.is_empty()).then_some(entries);
        Some(TransportLayout {
            trivia: Some(TransportTrivia { leading: some(leading), trailing: some(trailing), inner: (!inner.is_empty()).then_some(inner) }),
            edges: None,
            gap: None,
            flank: None,
        })
    }
}

/// Place every extra among a node's children (see the rule at
/// `read_untyped_node::node_trivia`, which this reproduces). `owner_self` is
/// whether the node itself owns trivia; `gap` names the inner gap at a count
/// of preceding non-trivia children.
pub fn place(ctx: &ReadCtx<'_>, children: &[Child], routes: &[Route], owner_self: bool, gap: fn(u16) -> Option<&'static str>) -> Placement {
    let owner = |i: usize| {
        let child = &children[i];
        child.named && !child.trivia && child.width() > 0 && !matches!(routes[i], Route::Slot { scalar: true, .. })
    };
    let entry = |child: &Child, same_line: bool, tokens_between: u16| Entry { coord: ctx.coordinate_of(child), same_line, tokens_between };
    let mut placement = Placement {
        sides: (0..children.len()).map(|i| Sides { owner: owner(i), ..Sides::default() }).collect(),
        rows: children.iter().map(|child| child.row).collect(),
        ..Placement::default()
    };
    let owners: Vec<usize> = (0..children.len()).filter(|&i| owner(i)).collect();
    if owners.is_empty() {
        let mut preceding: u16 = 0;
        let mut named_before = false;
        for child in children {
            if !child.trivia {
                preceding += 1;
                named_before |= child.named;
            } else if let Some(key) = gap(preceding) {
                placement.inner.entry(key.to_string()).or_default().push(entry(child, false, 0));
            } else if owner_self {
                let side = if named_before { &mut placement.own_trailing } else { &mut placement.own_leading };
                side.push(entry(child, true, 0));
            }
        }
        return placement;
    }
    for (k, &o) in owners.iter().enumerate() {
        let previous = k.checked_sub(1).map(|j| owners[j]);
        let next = owners.get(k + 1).copied();
        for child in &children[previous.map_or(0, |p| p + 1)..o] {
            let trails_previous = previous.is_some_and(|p| children[p].end_row == child.start_row);
            if child.trivia && !trails_previous {
                placement.sides[o].leading.push(entry(child, child.end_row == children[o].start_row, 0));
            }
        }
        let mut tokens: u16 = 0;
        for child in &children[o + 1..next.unwrap_or(children.len())] {
            if !child.trivia {
                tokens += 1;
            } else if children[o].end_row == child.start_row {
                placement.sides[o].trailing.push(entry(child, true, tokens));
            } else if next.is_none() {
                placement.sides[o].trailing.push(entry(child, false, 0));
            }
        }
    }
    placement
}

#[cfg(test)]
mod tests {
    use super::*;

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
    fn a_refusal_names_the_kind_the_child_and_the_row() {
        let name = |k: KindId| if k.0 == 208 { "function_item" } else { "block" };
        let refusal = ReadError::Unrouted { kind: KindId(208), child: KindId(313), row: 451 };
        assert_eq!(
            refusal.describe(&name),
            "function_item (kind 208) has no route for its child block (kind 313) at row 451"
        );
    }

    fn site() -> SlotSite {
        SlotSite { kind: KindId(1), slot: "items", row: 0 }
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
        fn read(_: &mut TreeCursor<'_>, _: &ReadCtx<'_>, _: Depth, _: Sides) -> Result<Self, ReadError> {
            Ok(Probe)
        }
        fn sides_of(_: &mut TreeCursor<'_>, _: &ReadCtx<'_>, _: u32) -> Result<Sides, ReadError> {
            Ok(Sides::default())
        }
    }

    type Plain = Probe<false>;

    fn token(start: u32, end: u32, trivia: bool) -> Child {
        Child { row: 0, grammar: KindId(9), display: KindId(9), field: None, named: false, trivia, start, end, start_row: 0, end_row: 0 }
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
            Err(ReadError::Missing { kind: KindId(1), slot: "items", row: 0 })
        );
    }

    #[test]
    fn an_optional_list_reads_as_present_when_empty() {
        assert_eq!(<Option<Vec<SlotValue<Plain>>> as ReadSlot>::finish(Vec::new(), site()), Ok(Some(Vec::new())));
    }

    #[test]
    fn an_absent_optional_slot_reads_as_its_blank_arm_or_absent() {
        assert_eq!(<Option<SlotValue<Probe<true>>> as ReadSlot>::finish(None, site()), Ok(Some(SlotValue::Transport(Probe))));
        assert_eq!(<Option<SlotValue<Plain>> as ReadSlot>::finish(None, site()), Ok(None));
    }

    #[test]
    fn a_presence_slot_reads_true_or_absent() {
        assert_eq!(<Option<bool> as ReadSlot>::finish(true, site()), Ok(Some(true)));
        assert_eq!(<Option<bool> as ReadSlot>::finish(false, site()), Ok(None));
    }

    fn child(row: u32, named: bool, trivia: bool, (start_row, end_row): (usize, usize), (start, end): (u32, u32)) -> Child {
        Child { row, grammar: KindId(if trivia { 900 } else if named { 100 } else { 50 }), display: KindId(0), field: None, named, trivia, start, end, start_row, end_row }
    }
    fn owner_routes(children: &[Child]) -> Vec<Route> {
        children.iter().map(|c| if c.trivia { Route::Trivia } else if c.named { Route::Slot { slot: 0, scalar: false } } else { Route::Layout }).collect()
    }
    fn no_gap(_: u16) -> Option<&'static str> {
        None
    }
    fn spans(entries: &[Entry]) -> Vec<(u32, bool, u16)> {
        entries.iter().map(|e| (e.coord.span.start, e.same_line, e.tokens_between)).collect()
    }

    #[test]
    fn an_extra_on_an_owners_last_row_trails_it_past_the_tokens_between() {
        // `a, // c` then on the next row `b`
        let children = [
            child(1, true, false, (0, 0), (0, 1)),   // a
            child(2, false, false, (0, 0), (1, 2)),  // ,
            child(3, false, true, (0, 0), (3, 7)),   // // c
            child(4, true, false, (1, 1), (8, 9)),   // b
        ];
        let ctx = ReadCtx::new("", 0);
        let placement = place(&ctx, &children, &owner_routes(&children), true, no_gap);
        assert_eq!(spans(&placement.sides[0].trailing), vec![(3, true, 1)]);
        assert!(placement.sides[3].leading.is_empty());
    }

    #[test]
    fn an_extra_on_its_own_row_leads_the_next_owner() {
        // `a` / `// c` / `b`
        let children = [
            child(1, true, false, (0, 0), (0, 1)),
            child(2, false, true, (1, 1), (2, 6)),
            child(3, true, false, (2, 2), (7, 8)),
        ];
        let placement = place(&ReadCtx::new("", 0), &children, &owner_routes(&children), true, no_gap);
        assert!(placement.sides[0].trailing.is_empty());
        assert_eq!(spans(&placement.sides[2].leading), vec![(2, false, 0)]);
    }

    #[test]
    fn an_extra_after_the_last_owner_trails_it() {
        let children = [child(1, true, false, (0, 0), (0, 1)), child(2, false, true, (1, 1), (2, 6))];
        let placement = place(&ReadCtx::new("", 0), &children, &owner_routes(&children), true, no_gap);
        assert_eq!(spans(&placement.sides[0].trailing), vec![(2, false, 0)]);
    }

    #[test]
    fn a_unit_variant_a_token_and_a_zero_width_node_own_nothing() {
        // `x // c`: x stored as a unit variant, then a zero-width named node, then the extra
        let children = [
            child(1, true, false, (0, 0), (0, 1)),
            child(2, true, false, (0, 0), (1, 1)),
            child(3, false, true, (0, 0), (2, 6)),
        ];
        let routes = [Route::Slot { slot: 0, scalar: true }, Route::Slot { slot: 1, scalar: false }, Route::Trivia];
        let placement = place(&ReadCtx::new("", 0), &children, &routes, true, no_gap);
        assert!(!placement.sides[0].owner && !placement.sides[1].owner);
        // no owner child: rule 4, a named child precedes, so the node's own trailing
        assert_eq!(spans(&placement.own_trailing), vec![(2, true, 0)]);
    }

    #[test]
    fn with_no_owner_child_an_extra_takes_the_inner_gap_its_kind_names() {
        // `{ /* c */ }`: `{`, extra, `}`
        let children = [
            child(1, false, false, (0, 0), (0, 1)),
            child(2, false, true, (0, 0), (2, 9)),
            child(3, false, false, (0, 0), (10, 11)),
        ];
        fn gap(preceding: u16) -> Option<&'static str> {
            (preceding == 1).then_some("statements")
        }
        let placement = place(&ReadCtx::new("", 0), &children, &owner_routes(&children), true, gap);
        assert_eq!(spans(&placement.inner["statements"]), vec![(2, false, 0)]);
        assert!(placement.own_leading.is_empty() && placement.own_trailing.is_empty());
    }

    #[test]
    fn a_node_that_owns_nothing_keeps_no_extra_of_its_own() {
        let children = [child(1, false, true, (0, 0), (0, 4))];
        let placement = place(&ReadCtx::new("", 0), &children, &owner_routes(&children), false, no_gap);
        assert!(placement.own_leading.is_empty() && placement.own_trailing.is_empty() && placement.inner.is_empty());
    }

    #[test]
    fn an_error_child_is_placed_as_trivia() {
        // an ERROR is surveyed with `trivia: true`; it leads the next owner like an extra
        let children = [child(1, true, true, (0, 0), (0, 3)), child(2, true, false, (1, 1), (4, 5))];
        let placement = place(&ReadCtx::new("", 0), &children, &owner_routes(&children), true, no_gap);
        assert_eq!(spans(&placement.sides[1].leading), vec![(0, false, 0)]);
    }

    #[test]
    fn the_parents_entries_come_before_the_nodes_own() {
        let children = [child(1, true, false, (0, 0), (0, 1)), child(2, false, true, (0, 0), (2, 6))];
        let routes = [Route::Slot { slot: 0, scalar: true }, Route::Trivia];
        let placement = place(&ReadCtx::new("", 0), &children, &routes, true, no_gap);
        let parent = Sides {
            owner: true,
            leading: vec![],
            trailing: vec![Entry { coord: NodeCoordinate::new(0, Span { start: 40, end: 44 }), same_line: true, tokens_between: 0 }],
        };
        let layout = placement.into_layout::<()>(parent).expect("entries");
        let trailing = layout.trivia.unwrap().trailing.unwrap();
        assert_eq!(trailing.iter().map(|e| e.value.coord().unwrap().span.start).collect::<Vec<_>>(), vec![40, 2]);
    }
}
