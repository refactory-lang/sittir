//! `NodeTrivia` — the trivia a node carries, and where it renders.
//!
//! A side holds its owner's entries in source order (`trivia_table`): leading
//! entries render before the owner, trailing entries after it, and inner
//! entries at the inner site of an owner with no child. The side's layout
//! entries are its line layout: an entry with no breaking layout entry
//! between it and its owner shares the owner's line.

use crate::layout_kinds::LayoutKinds;
use crate::options::Side;
use crate::render::{Render, RenderResult, RenderSink};
use crate::types::KindId;
use crate::slot::SlotValue;

/// One trivia entry: the node, the coordinate of one, or a record of an
/// engine's built arena, which renders from that arena where the side that
/// holds it renders, as a coordinate renders from its tree.
#[derive(Debug, Clone, PartialEq)]
pub enum TriviaEntry<T> {
    Value(SlotValue<T>),
    #[cfg(feature = "arena")]
    Record(RecordEntry<T>),
}

impl<T> TriviaEntry<T> {
    pub fn new(value: SlotValue<T>) -> Self {
        Self::Value(value)
    }

    /// The node or coordinate the entry holds; `None` for a record.
    #[must_use]
    pub fn value(&self) -> Option<&SlotValue<T>> {
        match self {
            Self::Value(value) => Some(value),
            #[cfg(feature = "arena")]
            Self::Record(_) => None,
        }
    }

    #[cfg_attr(not(feature = "arena"), allow(clippy::unnecessary_wraps, reason = "an entry is a built record only in the arena build"))]
    fn value_mut(&mut self) -> Option<&mut SlotValue<T>> {
        match self {
            Self::Value(value) => Some(value),
            #[cfg(feature = "arena")]
            Self::Record(_) => None,
        }
    }
}

/// A record of an engine's built arena, by its kind and its address, that a
/// side write was given as an entry.
#[cfg(feature = "arena")]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct BuiltEntry {
    pub kind: KindId,
    pub at: crate::arena::Address,
}

/// A built record a side holds. Read from a store, it holds that store,
/// which holds the record's own sides and reaches the arena that wrote it.
#[cfg(feature = "arena")]
#[derive(Debug, Clone, PartialEq)]
pub struct RecordEntry<T> {
    pub record: BuiltEntry,
    pub store: Option<crate::trivia_store::TriviaStore<T>>,
}

impl<T: Render + 'static> Render for TriviaEntry<T> {
    fn render(&self, w: &mut dyn RenderSink) -> RenderResult {
        match self {
            Self::Value(value) => value.render(w),
            #[cfg(feature = "arena")]
            Self::Record(entry) => {
                let store = entry.store.as_ref().ok_or(crate::render::RenderError::Record(crate::arena::ArenaError::Unwritable("a record entry no store answered")))?;
                w.render_record_entry(entry.record, store.identity(), store)
            }
        }
    }
}

/// A trivia value that is whitespace answers its gap kind: it is merged into
/// the gap it sits in (`RenderSink::trivia_seam`), replacing that gap's
/// default, instead of being written as a line of its own. A line
/// continuation also answers the source text it was read with.
/// A depth member (`indent`, `dedent`) answers the change it makes to the
/// excess indentation (`RenderSink::layout_depth`) instead, and
/// `depth_member` is the member that makes the change `delta`'s sign names.
/// A value that holds sides of its own answers them (`sides`), and the side
/// holding it renders them as its neighbours there, splicing copies of the
/// value and its sides into its own run (`spliced`): every value is `Clone`,
/// and `'static`, so a coordinate's sides, which a sink answers type-erased,
/// read back as the side's own type.
pub trait TriviaSeam: Clone + crate::prepare::Prepare + 'static {
    fn seam_gap(&self) -> Option<(LayoutKinds, Option<&str>)> {
        None
    }

    fn depth(&self) -> i32 {
        0
    }

    #[must_use]
    fn depth_member(_delta: i32) -> Option<Self> {
        None
    }

    fn sides(&self) -> Option<&NodeTrivia<Self>> {
        None
    }

    fn sides_mut(&mut self) -> Option<&mut NodeTrivia<Self>> {
        None
    }
}

impl<T> TriviaEntry<T> {
    /// Whether the entry is a built record a store answered, whose own sides
    /// that store holds.
    #[cfg(feature = "arena")]
    fn held_record(&self) -> bool {
        matches!(self, Self::Record(RecordEntry { store: Some(_), .. }))
    }

    #[cfg(not(feature = "arena"))]
    #[allow(clippy::unused_self, reason = "an entry names a built record only in the arena build")]
    fn held_record(&self) -> bool {
        false
    }
}

impl<T: TriviaSeam> TriviaEntry<T> {
    /// Whether the entry holds a leading or trailing side of its own.
    fn has_sides(&self) -> bool {
        let held = |side: &Option<Vec<TriviaEntry<T>>>| side.as_ref().is_some_and(|entries| !entries.is_empty());
        match self.value() {
            Some(SlotValue::Node(value)) => value.sides().is_some_and(|sides| held(&sides.leading) || held(&sides.trailing)),
            Some(SlotValue::Coord(_)) | None => false,
        }
    }

    fn seam_gap(&self) -> Option<(LayoutKinds, Option<&str>)> {
        match self.value() {
            Some(SlotValue::Node(value)) => value.seam_gap(),
            Some(SlotValue::Coord(_)) | None => None,
        }
    }

    /// The change a depth member makes to the excess indentation; 0 for any
    /// other entry.
    pub fn depth(&self) -> i32 {
        match self.value() {
            Some(SlotValue::Node(value)) => value.depth(),
            Some(SlotValue::Coord(_)) | None => 0,
        }
    }

    /// Whether the entry is layout: a whitespace member, merged into its
    /// gap, or a depth member.
    pub fn is_layout(&self) -> bool {
        RunItem::is_layout(self)
    }
}

/// `entries` without the layout runs at the edge toward a neighbour that
/// changed: on the leading side the runs before the first entry that is not
/// layout, on the trailing side those after the last. Those runs spelled the
/// gap to the old neighbour; the new seam takes its default. An inner side
/// has no such edge.
pub fn without_edge_runs<E>(entries: &mut Vec<E>, side: crate::trivia_table::TriviaSide, is_layout: impl Fn(&E) -> bool) {
    use crate::trivia_table::TriviaSide;
    match side {
        TriviaSide::Leading => {
            let first = entries.iter().position(|entry| !is_layout(entry)).unwrap_or(entries.len());
            entries.drain(..first);
        }
        TriviaSide::Trailing => {
            let last = entries.iter().rposition(|entry| !is_layout(entry)).map_or(0, |at| at + 1);
            entries.truncate(last);
        }
        TriviaSide::Inner => {}
    }
}

/// `entries` of a side whose neighbour changed: without its edge runs
/// (`without_edge_runs`), and closed by `member`'s depth members that undo
/// what the runs it keeps still change the excess. Those changes counted
/// against the node's excess in the source, not where the side now renders:
/// the side's lines keep their level against its new neighbour, and what
/// follows the side (the node after a leading side, the next sibling after a
/// trailing one) starts at the level the side started on.
pub fn on_changed_edge<E>(
    entries: &mut Vec<E>,
    side: crate::trivia_table::TriviaSide,
    is_layout: impl Fn(&E) -> bool,
    depth: impl Fn(&E) -> i32,
    member: impl Fn(i32) -> Option<E>,
) {
    use crate::trivia_table::TriviaSide;
    without_edge_runs(entries, side, is_layout);
    let net: i32 = entries.iter().map(&depth).sum();
    if side != TriviaSide::Inner {
        entries.extend((0..net.unsigned_abs()).filter_map(|_| member(-net.signum())));
    }
}

impl<T: crate::prepare::Prepare> crate::prepare::Prepare for NodeTrivia<T> {
    /// Every entry is prepared like a slot value: a coordinate entry takes its
    /// kind's edges, as a coordinate in a slot does.
    fn prepare(&mut self, ctx: &crate::prepare::RenderContext<'_>) -> Result<(), crate::render::CoordinateError> {
        let sides = self.leading.iter_mut().chain(self.trailing.iter_mut());
        for value in sides.chain(self.inner.iter_mut()).flatten().filter_map(TriviaEntry::value_mut) {
            value.prepare(ctx)?;
        }
        Ok(())
    }
}

/// Trivia read from source and detached from its tree: the text the reader
/// captured, with the kind the reader stamped on it. It writes that kind's
/// edges around the text, as a rendered node of the kind does.
#[derive(Debug, Clone, PartialEq)]
pub struct TriviaText {
    pub kind: KindId,
    pub text: String,
    /// In a snapshot, where the entry lies: its span measured from the start
    /// of its owner's holder.
    pub span: Option<crate::points::PointSpan>,
    /// The in-line adjacency of an entry the source fixes in place (an
    /// `ERROR` region, a line continuation): the source's whitespace right
    /// before and right after it, up to the tokens beside it on its line.
    /// The entry writes it verbatim around itself, in place of any seam. A
    /// comment has none.
    pub before: Option<String>,
    pub after: Option<String>,
}

impl TriviaText {
    /// The entry of `kind` with `text` and nothing else: no place in a
    /// snapshot and no adjacency.
    #[must_use]
    pub fn of(kind: KindId, text: &str) -> Self {
        Self { kind, text: text.to_owned(), span: None, before: None, after: None }
    }

    /// Whether the entry writes itself verbatim with its adjacency, in place
    /// of any seam: an `ERROR` always, any other entry when it carries an
    /// adjacency.
    #[must_use]
    pub fn verbatim(&self) -> bool {
        self.kind == KindId::ERROR || self.before.is_some() || self.after.is_some()
    }

    /// The entry of `kind` spanning `span` of `source`, with the in-line runs
    /// `adjacent` names before and after it (an `ERROR`'s), and `at` where a
    /// snapshot places it.
    #[must_use]
    pub fn of_source(kind: KindId, source: &str, span: crate::types::Span, adjacent: Option<(crate::types::Span, crate::types::Span)>, at: Option<crate::points::PointSpan>) -> Self {
        let slice = |run: crate::types::Span| (run.start < run.end).then(|| source[run.range()].to_owned());
        let (before, after) = adjacent.map_or((None, None), |(before, after)| (slice(before), slice(after)));
        Self { kind, text: source[span.range()].to_owned(), span: at, before, after }
    }
}

impl Render for TriviaText {
    fn render(&self, w: &mut dyn RenderSink) -> RenderResult {
        if self.verbatim() {
            let before = self.before.as_deref().unwrap_or_default();
            let after = self.after.as_deref().unwrap_or_default();
            return w.verbatim(before, &self.text, after);
        }
        w.edge(self.kind, Side::Before, None);
        w.text(&self.text)?;
        w.edge(self.kind, Side::After, None);
        w.end_line_after(self.kind);
        Ok(())
    }
}

impl crate::prepare::Prepare for TriviaText {
    fn prepare(&mut self, _ctx: &crate::prepare::RenderContext<'_>) -> Result<(), crate::render::CoordinateError> {
        Ok(())
    }

    fn snapshot_edge(&self) -> Option<crate::prepare::SnapshotEdge> {
        let bare = crate::prepare::TriviaReach::Bare;
        self.span.map(|span| crate::prepare::SnapshotEdge { span, leading: bare, trailing: bare })
    }
}

/// The trivia one node owns. Mirrors `NodeTrivia` in `@sittir/types`.
#[derive(Debug, Clone, PartialEq)]
pub struct NodeTrivia<T> {
    pub leading: Option<Vec<TriviaEntry<T>>>,
    pub trailing: Option<Vec<TriviaEntry<T>>>,
    pub inner: Option<Vec<TriviaEntry<T>>>,
}

impl<T> Default for NodeTrivia<T> {
    fn default() -> Self {
        Self {
            leading: None,
            trailing: None,
            inner: None,
        }
    }
}

/// The trivia type of the grammar a node belongs to: what a coordinate
/// of it carries as outside trivia. Codegen states it once per grammar
/// (`grammar_trivia!`).
pub trait HasTrivia {
    type Trivia: TriviaItem + HasTrivia<Trivia = Self::Trivia>;
}

impl<T: HasTrivia> HasTrivia for Box<T> {
    type Trivia = T::Trivia;
}

/// A grammar's trivia type built from what a read finds: an extra's text and
/// kind (the variant that takes a `TriviaText`), or a layout member by its
/// kind and the text it spans (its variant). Codegen implements it once per
/// grammar.
pub trait FromTriviaText: Sized {
    fn from_text(text: TriviaText) -> Self;
    /// The layout member `text` reads as, by its kind, or `None` when its
    /// kind is none of the grammar's layout members. A whitespace member is
    /// a unit, whatever its text; a member that carries text (a line
    /// continuation) keeps it, with its adjacency.
    fn from_layout(text: TriviaText) -> Option<Self>;
}

/// A node family that keeps no trivia drops what a read finds.
impl FromTriviaText for () {
    fn from_text(_: TriviaText) -> Self {}

    fn from_layout(_: TriviaText) -> Option<Self> {
        Some(())
    }
}

/// Text holds no whitespace member.
impl FromTriviaText for TriviaText {
    fn from_text(text: TriviaText) -> Self {
        text
    }

    fn from_layout(_: TriviaText) -> Option<Self> {
        None
    }
}

impl<T: FromTriviaText> FromTriviaText for Box<T> {
    fn from_text(text: TriviaText) -> Self {
        Box::new(T::from_text(text))
    }

    fn from_layout(text: TriviaText) -> Option<Self> {
        T::from_layout(text).map(Box::new)
    }
}

/// What a grammar's trivia type provides to frame a coordinate: its render,
/// its prepare walk and, with the bindings, its wire decode.
#[cfg(not(feature = "napi-bindings"))]
pub trait TriviaItem: Render + TriviaSeam + crate::prepare::Prepare + Clone + PartialEq + std::fmt::Debug + 'static {}

#[cfg(not(feature = "napi-bindings"))]
impl<T: Render + TriviaSeam + crate::prepare::Prepare + Clone + PartialEq + std::fmt::Debug + 'static> TriviaItem for T {}

#[cfg(feature = "napi-bindings")]
pub trait TriviaItem:
    Render + TriviaSeam + crate::prepare::Prepare + Clone + PartialEq + std::fmt::Debug + 'static + ::napi::bindgen_prelude::FromNapiValue
{
}

#[cfg(feature = "napi-bindings")]
impl<T: Render + TriviaSeam + crate::prepare::Prepare + Clone + PartialEq + std::fmt::Debug + 'static + ::napi::bindgen_prelude::FromNapiValue> TriviaItem
    for T
{
}

/// A test's trivia type, which never crosses the boundary: decoding one from
/// JavaScript or encoding one to it refuses. Expands to nothing when this
/// crate is built without napi bindings, like a derived node's codec
/// (`napi_codec!`).
#[doc(hidden)]
#[macro_export]
macro_rules! refuse_napi_codec {
    ($trivia:ty) => {
        $crate::napi_codec! {
            impl $crate::__napi::bindgen_prelude::FromNapiValue for $trivia {
                unsafe fn from_napi_value(_: $crate::__napi::sys::napi_env, _: $crate::__napi::sys::napi_value) -> $crate::__napi::Result<Self> {
                    Err($crate::__napi::Error::from_reason(concat!(stringify!($trivia), " does not cross the boundary")))
                }
            }
            impl $crate::__napi::bindgen_prelude::ToNapiValue for $trivia {
                unsafe fn to_napi_value(_: $crate::__napi::sys::napi_env, _: Self) -> $crate::__napi::Result<$crate::__napi::sys::napi_value> {
                    Err($crate::__napi::Error::from_reason(concat!(stringify!($trivia), " does not cross the boundary")))
                }
            }
        }
    };
}

/// Trivia that frames what a node renders: its leading entries before, its
/// trailing entries after.
pub trait Framing {
    fn frame_leading(&self, w: &mut dyn RenderSink) -> RenderResult;
    fn frame_trailing(&self, w: &mut dyn RenderSink) -> RenderResult;
}

impl<T: Render + TriviaSeam> Framing for NodeTrivia<T> {
    fn frame_leading(&self, w: &mut dyn RenderSink) -> RenderResult {
        self.render_leading(w)
    }

    fn frame_trailing(&self, w: &mut dyn RenderSink) -> RenderResult {
        self.render_trailing(w)
    }
}

/// The outside trivia a folded coordinate renders between, with its
/// grammar's trivia type erased, so a coordinate carries it whatever its
/// slot's node type.
pub trait FramedTrivia: Framing + std::fmt::Debug {
    fn prepare(&mut self, ctx: &crate::prepare::RenderContext<'_>) -> Result<(), crate::render::CoordinateError>;
    fn boxed_clone(&self) -> Box<dyn FramedTrivia>;
    fn as_any(&self) -> &dyn std::any::Any;
    fn into_any(self: Box<Self>) -> Box<dyn std::any::Any>;
    fn same_as(&self, other: &dyn FramedTrivia) -> bool;
}

/// The sides a coordinate's bytes render between: its node's own, when it
/// holds any, and then those of each item inside its bytes that holds trivia
/// at its edges for it, outermost first.
#[derive(Debug, Default)]
pub struct Frames {
    pub own: Option<Box<dyn FramedTrivia>>,
    pub items: Vec<Box<dyn FramedTrivia>>,
}

impl Frames {
    /// Every frame, outermost first.
    #[must_use]
    pub fn into_vec(self) -> Vec<Box<dyn FramedTrivia>> {
        self.own.into_iter().chain(self.items).collect()
    }

    pub fn iter_mut(&mut self) -> impl Iterator<Item = &mut Box<dyn FramedTrivia>> {
        self.own.iter_mut().chain(self.items.iter_mut())
    }
}

impl<T: TriviaItem> FramedTrivia for NodeTrivia<T> {
    fn prepare(&mut self, ctx: &crate::prepare::RenderContext<'_>) -> Result<(), crate::render::CoordinateError> {
        crate::prepare::Prepare::prepare(self, ctx)
    }

    fn boxed_clone(&self) -> Box<dyn FramedTrivia> {
        Box::new(self.clone())
    }

    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn into_any(self: Box<Self>) -> Box<dyn std::any::Any> {
        self
    }

    fn same_as(&self, other: &dyn FramedTrivia) -> bool {
        other.as_any().downcast_ref::<Self>() == Some(self)
    }
}

impl Clone for Box<dyn FramedTrivia> {
    fn clone(&self) -> Self {
        self.boxed_clone()
    }
}

/// A join written between trivia entries, or between an entry and its owner.
/// It is a fact of the source layout, so it holds its gap at trivia strength,
/// but it never takes away a line break the entry before it left pending: a
/// line-terminated entry's after edge breaks the line, and whatever follows
/// a line comment on its row would be swallowed by it. Where the output
/// already stands at a line start (an entry whose span includes its
/// terminator), the join is already made.
fn join(gap: LayoutKinds, w: &mut dyn RenderSink) {
    if !w.ends_line() {
        whitespace(gap, None, true, w);
    }
}

/// A whitespace entry's text, which replaces the seam at its gap. Right
/// after an entry (`after_entry`) it is kept to at least the line break that
/// entry left pending; anywhere else it replaces the gap's seam outright.
fn whitespace(gap: LayoutKinds, text: Option<&str>, after_entry: bool, w: &mut dyn RenderSink) {
    let keeps_break = after_entry && w.pending_break() && !gap.breaks();
    if keeps_break {
        w.trivia_seam(LayoutKinds::NEWLINE, None);
    } else {
        w.trivia_seam(gap, text);
    }
}

/// An entry of a side's run, as the side's render lays the run out: a
/// layout entry takes the place of a join, any other renders between joins.
trait RunItem {
    fn depth(&self) -> i32;

    fn seam_gap(&self) -> Option<(LayoutKinds, Option<&str>)>;

    /// Whether the item is layout: a whitespace member, merged into its gap,
    /// or a depth member.
    fn is_layout(&self) -> bool {
        self.seam_gap().is_some() || self.depth() != 0
    }

    /// Whether the item is layout that breaks the line.
    fn breaks(&self) -> bool {
        self.seam_gap().is_some_and(|(gap, _)| gap.breaks())
    }
}

impl<T: TriviaSeam> RunItem for TriviaEntry<T> {
    fn depth(&self) -> i32 {
        TriviaEntry::depth(self)
    }

    fn seam_gap(&self) -> Option<(LayoutKinds, Option<&str>)> {
        TriviaEntry::seam_gap(self)
    }
}

/// An item of a side's run once each entry's own sides are spliced in
/// (`spliced`): an entry, or the coordinate of a parsed node whose own
/// sides the run holds as its neighbours. A coordinate is a trivia entry's,
/// which no position holds adjacent, and it writes its bytes between its
/// items' frames (`Frames::items`), as a coordinate with no sides of its own
/// does.
enum Spliced<T> {
    Entry(TriviaEntry<T>),
    Bare(crate::slot::NodeCoordinate, Vec<Box<dyn FramedTrivia>>),
}

impl<T: TriviaSeam> RunItem for Spliced<T> {
    fn depth(&self) -> i32 {
        match self {
            Spliced::Entry(entry) => entry.depth(),
            Spliced::Bare(..) => 0,
        }
    }

    fn seam_gap(&self) -> Option<(LayoutKinds, Option<&str>)> {
        match self {
            Spliced::Entry(entry) => entry.seam_gap(),
            Spliced::Bare(..) => None,
        }
    }
}

impl<T: Render + 'static> Render for Spliced<T> {
    fn render(&self, w: &mut dyn RenderSink) -> RenderResult {
        match self {
            Spliced::Entry(entry) => entry.render(w),
            Spliced::Bare(coord, frames) => crate::slot::write_framed(frames, Some(coord), coord, false, w),
        }
    }
}

/// Render `entries` joined by `between`, a whitespace entry taking the
/// place of the join at its gap. Each entry's own edges write what follows
/// it; only the joins are written here.
fn render_joined<I: RunItem + Render>(entries: &[I], between: LayoutKinds, w: &mut dyn RenderSink) -> RenderResult {
    let mut after_entry = false;
    for entry in entries {
        if entry.depth() != 0 {
            w.layout_depth(entry.depth());
            continue;
        }
        if let Some((gap, text)) = entry.seam_gap() {
            whitespace(gap, text, after_entry, w);
            after_entry = false;
            continue;
        }
        if after_entry {
            join(between, w);
        }
        entry.render(w)?;
        after_entry = true;
    }
    Ok(())
}

/// Hold a run of same-line trailing entries in the sink, joined as
/// `render_joined` joins them.
fn defer_run<I: RunItem + Render>(run: &[I], w: &mut dyn RenderSink) -> RenderResult {
    w.defer_trailing(&mut |w| render_joined(run, LayoutKinds::SPACE, w))
}

/// `entries` with each entry's own sides as its neighbours: its leading
/// entries before it and its trailing entries after it, theirs in turn. A
/// side renders an entry's sides as entries of its own run, so they take part
/// in its joins and its line layout. A node answers its sides itself; a
/// coordinate's are its node's own frame's, as its tree holds them
/// (`RenderSink::frames`); a built record's are the ones the store it was
/// read from holds for it (`record_sides`).
/// `None` when no entry is a coordinate, a built record or holds sides: the
/// side renders as it is.
fn spliced<T: TriviaSeam>(entries: &[TriviaEntry<T>], w: &dyn RenderSink) -> Result<Option<Vec<Spliced<T>>>, crate::render::CoordinateError> {
    if !entries.iter().any(|entry| entry.has_sides() || entry.held_record() || matches!(entry.value(), Some(SlotValue::Coord(_)))) {
        return Ok(None);
    }
    let (mut run, mut within) = (Vec::with_capacity(entries.len()), Within::default());
    for entry in entries {
        splice_into(entry.clone(), w, &mut run, &mut within)?;
    }
    Ok(Some(run))
}

/// The built records a splice is inside, by the store that answered each and
/// its address: one already among them refuses.
#[cfg(feature = "arena")]
type Within = Vec<(usize, crate::arena::Address)>;

#[cfg(not(feature = "arena"))]
type Within = ();

/// The refusal of a built record that a side reaches from its own sides.
#[cfg(feature = "arena")]
pub(crate) const SIDE_CYCLE: crate::arena::ArenaError = crate::arena::ArenaError::Unwritable("a side that reaches its own record");

/// A side's leading and trailing entries, as `NodeTrivia` holds them.
type Outer<T> = (Option<Vec<TriviaEntry<T>>>, Option<Vec<TriviaEntry<T>>>);

/// The own sides of the built record `entry` holds, as the store that
/// answered it holds them, prepared as the sink prepares a coordinate's
/// frames.
#[cfg(feature = "arena")]
fn record_sides<T: TriviaSeam>(entry: &RecordEntry<T>, w: &dyn RenderSink) -> Result<Outer<T>, crate::render::CoordinateError> {
    let Some(mut sides) = entry.store.as_ref().and_then(|store| store.sides(crate::trivia_store::Place::Record(entry.record.at))) else { return Ok((None, None)) };
    if let Some(ctx) = w.render_context() {
        crate::prepare::Prepare::prepare(&mut sides, &ctx)?;
    }
    Ok((sides.leading, sides.trailing))
}

#[cfg_attr(not(feature = "arena"), allow(clippy::infallible_destructuring_match, reason = "an entry is a built record only in the arena build"))]
fn splice_into<T: TriviaSeam>(mut entry: TriviaEntry<T>, w: &dyn RenderSink, run: &mut Vec<Spliced<T>>, within: &mut Within) -> Result<(), crate::render::CoordinateError> {
    let value = match &mut entry {
        TriviaEntry::Value(value) => value,
        #[cfg(feature = "arena")]
        TriviaEntry::Record(record) => {
            let key = record.store.as_ref().map(|store| (store.identity(), record.record.at));
            if key.is_some_and(|key| within.contains(&key)) {
                return Err(crate::render::CoordinateError::Record(SIDE_CYCLE));
            }
            let outer = record_sides(record, w)?;
            let Some(key) = key else { return splice_around(outer, Spliced::Entry(entry), w, run, within) };
            within.push(key);
            let spliced = splice_around(outer, Spliced::Entry(entry), w, run, within);
            within.pop();
            return spliced;
        }
    };
    let (outer, item) = match value {
        SlotValue::Node(value) => {
            let outer = value.sides_mut().map_or((None, None), |sides| (sides.leading.take(), sides.trailing.take()));
            (outer, Spliced::Entry(entry))
        }
        SlotValue::Coord(coord) => {
            let frames = w.frames(coord)?;
            match frames.own.as_deref().map(|own| own.as_any().downcast_ref::<NodeTrivia<T>>()) {
                None => ((None, None), Spliced::Bare(coord.clone(), frames.items)),
                Some(Some(sides)) => ((sides.leading.clone(), sides.trailing.clone()), Spliced::Bare(coord.clone(), frames.items)),
                Some(None) => ((None, None), Spliced::Entry(entry)),
            }
        }
    };
    splice_around(outer, item, w, run, within)
}

/// `item` in the run between its own leading and trailing entries, each
/// spliced in turn.
fn splice_around<T: TriviaSeam>((leading, trailing): Outer<T>, item: Spliced<T>, w: &dyn RenderSink, run: &mut Vec<Spliced<T>>, within: &mut Within) -> Result<(), crate::render::CoordinateError> {
    for side in leading.into_iter().flatten() {
        splice_into(side, w, run, within)?;
    }
    run.push(item);
    for side in trailing.into_iter().flatten() {
        splice_into(side, w, run, within)?;
    }
    Ok(())
}

fn leading_run<I: RunItem + Render>(leading: &[I], w: &mut dyn RenderSink) -> RenderResult {
    render_joined(leading, LayoutKinds::SPACE, w)?;
    if leading.last().is_some_and(|entry| !entry.is_layout()) {
        join(LayoutKinds::SPACE, w);
    }
    Ok(())
}

fn trailing_run<I: RunItem + Render>(trailing: &[I], w: &mut dyn RenderSink) -> RenderResult {
    let own = trailing.iter().position(RunItem::breaks).unwrap_or(trailing.len());
    let (same_line, own_line) = trailing.split_at(own);
    if same_line.iter().all(RunItem::is_layout) {
        render_joined(same_line, LayoutKinds::SPACE, w)?;
    } else {
        defer_run(same_line, w)?;
        w.seat_trailing()?;
    }
    if !own_line.is_empty() {
        w.seat_trailing()?;
        let owner_seam = w.take_seam();
        render_joined(own_line, LayoutKinds::SPACE, w)?;
        if let Some(seam) = owner_seam {
            w.restore_seam(seam);
        }
    }
    Ok(())
}

impl<T: Render + TriviaSeam> NodeTrivia<T> {
    /// Leading entries, before the owner renders. Each layout entry takes the
    /// place of the join at its gap; where none stands, an entry joins the
    /// next entry, or the owner, on its line. Each entry's own sides are its
    /// neighbours in the run (`spliced`).
    pub fn render_leading(&self, w: &mut dyn RenderSink) -> RenderResult {
        let leading = self.leading.as_deref().unwrap_or(&[]);
        match spliced(leading, w)? {
            Some(run) => leading_run(&run, w),
            None => leading_run(leading, w),
        }
    }

    /// Trailing entries, after the owner renders, in source order. The run
    /// before the first breaking layout entry shares the owner's line and is
    /// seated right after the owner; when it is layout alone it writes no
    /// text to seat, and merges into the gap after the owner. The rest render after it, each layout
    /// entry taking the place of the join at its gap and an entry with none
    /// joining the one before it on its line; the seam the owner left (its
    /// after edge) is written after them. Each entry's own sides are its
    /// neighbours in the run (`spliced`).
    pub fn render_trailing(&self, w: &mut dyn RenderSink) -> RenderResult {
        let trailing = self.trailing.as_deref().unwrap_or(&[]);
        match spliced(trailing, w)? {
            Some(run) => trailing_run(&run, w),
            None => trailing_run(trailing, w),
        }
    }

    /// The inner entries, where the owner renders its inner site: one per
    /// line when the site starts a line (the start of a block body, which the
    /// body's own indent and dedent frame, or output standing at a line
    /// start, as at the grammar root), and joined by spaces anywhere else.
    /// Each entry's own sides are its neighbours in the run (`spliced`).
    pub fn render_inner(&self, w: &mut dyn RenderSink) -> RenderResult {
        let Some(entries) = self.inner.as_ref() else {
            return Ok(());
        };
        let between = if w.at_body_start() || w.ends_line() { LayoutKinds::NEWLINE } else { LayoutKinds::SPACE };
        match spliced(entries, w)? {
            Some(run) => render_joined(&run, between, w),
            None => render_joined(entries, between, w),
        }
    }
}

impl<T: TriviaSeam> NodeTrivia<T> {
    /// The node's sides once its neighbour changed on `changed`'s edges:
    /// each such side without its edge runs (`on_changed_edge`), and none
    /// where nothing is left.
    pub fn trim_changed(&mut self, changed: crate::slot::ChangedEdges) {
        use crate::trivia_table::TriviaSide;
        for (side, entries) in [(TriviaSide::Leading, &mut self.leading), (TriviaSide::Trailing, &mut self.trailing)] {
            if let Some(list) = entries.as_mut().filter(|_| changed.on(side)) {
                on_changed_edge(list, side, TriviaEntry::is_layout, TriviaEntry::depth, |delta| T::depth_member(delta).map(|member| TriviaEntry::new(SlotValue::Node(member))));
                if list.is_empty() {
                    *entries = None;
                }
            }
        }
    }
}

/// Whether a node's trivia holds inner entries.
#[must_use]
pub fn has_inner<T: Render + TriviaSeam>(trivia: Option<&NodeTrivia<T>>) -> bool {
    trivia.is_some_and(|trivia| trivia.inner.as_ref().is_some_and(|entries| !entries.is_empty()))
}

/// The inner entries of a node's trivia, if it has any.
pub fn render_inner<T: Render + TriviaSeam>(trivia: Option<&NodeTrivia<T>>, w: &mut dyn RenderSink) -> RenderResult {
    match trivia {
        Some(trivia) => trivia.render_inner(w),
        None => Ok(()),
    }
}

#[cfg(feature = "napi-bindings")]
impl<T: ::napi::bindgen_prelude::FromNapiValue + crate::trivia::HasTrivia> ::napi::bindgen_prelude::FromNapiValue
    for TriviaEntry<T>
{
    /// A built record is `{ $type, $record }`, its kind and its address.
    /// Any other entry is a slot value: a node, a coordinate, bare text, a
    /// whitespace member's kind id, or text with its stamped kind (`{ $type,
    /// $text }`, which the entry type decodes).
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        #[cfg(feature = "arena")]
        // SAFETY: napi calls `from_napi_value` with `napi_val` live in `env`.
        if unsafe { crate::slot::node_value_type(env, napi_val)? } == ::napi::ValueType::Object {
            // SAFETY: `napi_val` is a live object in `env`.
            if let Some(at) = unsafe { crate::boundary::property_whole::<u32>(env, napi_val, c"$record", "TriviaEntry")? } {
                // SAFETY: `napi_val` is a live object in `env`.
                let kind = unsafe { crate::boundary::required(env, napi_val, c"$type", "TriviaEntry")? };
                return Ok(Self::Record(RecordEntry { record: BuiltEntry { kind, at: crate::arena::Address(at) }, store: None }));
            }
        }
        // SAFETY: napi calls `from_napi_value` with `napi_val` live in `env`.
        Ok(Self::new(unsafe { SlotValue::from_napi_value(env, napi_val)? }))
    }
}

#[cfg(feature = "napi-bindings")]
impl<T: ::napi::bindgen_prelude::FromNapiValue + crate::trivia::HasTrivia> ::napi::bindgen_prelude::FromNapiValue
    for NodeTrivia<T>
{
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        use crate::boundary::property;
        Ok(Self {
            // SAFETY: napi calls `from_napi_value` with `napi_val` live in `env`.
            leading: unsafe { property(env, napi_val, c"leading")? },
            // SAFETY: napi calls `from_napi_value` with `napi_val` live in `env`.
            trailing: unsafe { property(env, napi_val, c"trailing")? },
            // SAFETY: napi calls `from_napi_value` with `napi_val` live in `env`.
            inner: unsafe { property(env, napi_val, c"inner")? },
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl<T: ::napi::bindgen_prelude::ToNapiValue> ::napi::bindgen_prelude::ToNapiValue for NodeTrivia<T> {
    /// `{ leading?, trailing?, inner? }`, each only when present.
    unsafe fn to_napi_value(env: ::napi::sys::napi_env, val: Self) -> ::napi::Result<::napi::sys::napi_value> {
        use crate::boundary::{object_with_present, present};
        // SAFETY: napi calls `to_napi_value` with a live `env`, and every value encoded here is created in it.
        let leading = unsafe { present(env, c"leading", val.leading)? };
        // SAFETY: napi calls `to_napi_value` with a live `env`, and every value encoded here is created in it.
        let trailing = unsafe { present(env, c"trailing", val.trailing)? };
        // SAFETY: napi calls `to_napi_value` with a live `env`, and every value encoded here is created in it.
        let inner = unsafe { present(env, c"inner", val.inner)? };
        // SAFETY: napi calls `to_napi_value` with a live `env`, and every value encoded here is created in it.
        unsafe { object_with_present(env, &[leading, trailing, inner]) }
    }
}

#[cfg(feature = "napi-bindings")]
impl<T: ::napi::bindgen_prelude::ToNapiValue> ::napi::bindgen_prelude::ToNapiValue for TriviaEntry<T> {
    /// The value's own form; a built record, its `{ $type, $record }`.
    unsafe fn to_napi_value(env: ::napi::sys::napi_env, val: Self) -> ::napi::Result<::napi::sys::napi_value> {
        match val {
            // SAFETY: napi calls `to_napi_value` with a live `env`, and every value encoded here is created in it.
            Self::Value(value) => unsafe { SlotValue::to_napi_value(env, value) },
            #[cfg(feature = "arena")]
            Self::Record(RecordEntry { record: BuiltEntry { kind, at }, .. }) => {
                use crate::boundary::{object_with_present, present};
                // SAFETY: napi calls `to_napi_value` with a live `env`, and every value encoded here is created in it.
                unsafe { object_with_present(env, &[present(env, c"$type", Some(kind.0))?, present(env, c"$record", Some(at.0))?]) }
            }
        }
    }
}

/// `{ $type, $text, span? }`, the type and the text required.
#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for TriviaText {
    unsafe fn from_napi_value(env: ::napi::sys::napi_env, napi_val: ::napi::sys::napi_value) -> ::napi::Result<Self> {
        // SAFETY: napi calls `from_napi_value` with `napi_val` live in `env`.
        let obj = unsafe { crate::boundary::object(env, napi_val)? };
        Ok(Self {
            // SAFETY: napi calls `from_napi_value` with `napi_val` live in `env`.
            kind: unsafe { crate::boundary::required(env, obj, c"$type", "TriviaText")? },
            // SAFETY: napi calls `from_napi_value` with `napi_val` live in `env`.
            text: unsafe { crate::boundary::required(env, obj, c"$text", "TriviaText")? },
            // SAFETY: napi calls `from_napi_value` with `napi_val` live in `env`.
            span: unsafe { crate::boundary::property(env, obj, c"span")? },
            // SAFETY: napi calls `from_napi_value` with `napi_val` live in `env`.
            before: unsafe { crate::boundary::property(env, obj, c"$before")? },
            // SAFETY: napi calls `from_napi_value` with `napi_val` live in `env`.
            after: unsafe { crate::boundary::property(env, obj, c"$after")? },
        })
    }
}

/// `{ $type, $text, span?, $before?, $after? }`.
#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for TriviaText {
    unsafe fn to_napi_value(env: ::napi::sys::napi_env, val: Self) -> ::napi::Result<::napi::sys::napi_value> {
        use crate::boundary::{object_with_present, present};
        // SAFETY: napi calls `to_napi_value` with a live `env`, and every value encoded here is created in it.
        unsafe {
            object_with_present(env, &[
                present(env, c"$type", Some(val.kind.0))?,
                present(env, c"$text", Some(val.text))?,
                present(env, c"span", val.span)?,
                present(env, c"$before", val.before)?,
                present(env, c"$after", val.after)?,
            ])
        }
    }
}

#[cfg(test)]
mod tests {
    use super::on_changed_edge;
    use crate::trivia_table::TriviaSide;

    /// `'\n'` a line break, `'+'`/`'-'` depth members, any other a comment.
    fn changed(side: TriviaSide, entries: &str) -> String {
        let mut entries: Vec<char> = entries.chars().collect();
        let depth = |entry: &char| match entry {
            '+' => 1,
            '-' => -1,
            _ => 0,
        };
        on_changed_edge(&mut entries, side, |entry| matches!(entry, '\n' | '+' | '-'), depth, |delta| Some(if delta > 0 { '+' } else { '-' }));
        entries.into_iter().collect()
    }

    #[test]
    fn a_changed_leading_edge_keeps_its_comments_against_the_new_neighbour_and_starts_the_node_at_its_level() {
        assert_eq!(changed(TriviaSide::Leading, "\n+a\n-b\n++c\n"), "a\n-b\n++c\n-");
        assert_eq!(changed(TriviaSide::Leading, "\n+a\n+"), "a\n+-");
    }

    #[test]
    fn a_changed_trailing_edge_leaves_the_next_sibling_at_the_level_the_node_ends_on() {
        assert_eq!(changed(TriviaSide::Trailing, "\n+a\n+"), "\n+a-");
        assert_eq!(changed(TriviaSide::Trailing, "a\n-b\n+"), "a\n-b+");
    }

    #[test]
    fn a_balanced_side_keeps_every_depth_member() {
        assert_eq!(changed(TriviaSide::Leading, "\na\n-b\n++c\n-"), "a\n-b\n++c\n-");
    }

    /// An entry by its name, with sides of its own.
    #[derive(Debug, Clone, PartialEq)]
    struct Sided(char, super::NodeTrivia<Sided>);

    impl super::TriviaSeam for Sided {
        fn sides(&self) -> Option<&super::NodeTrivia<Self>> {
            Some(&self.1)
        }

        fn sides_mut(&mut self) -> Option<&mut super::NodeTrivia<Self>> {
            Some(&mut self.1)
        }
    }

    impl crate::prepare::Prepare for Sided {
        fn prepare(&mut self, _: &crate::prepare::RenderContext<'_>) -> Result<(), crate::render::CoordinateError> {
            Ok(())
        }
    }

    fn sided(name: char, leading: Vec<super::TriviaEntry<Sided>>, trailing: Vec<super::TriviaEntry<Sided>>) -> super::TriviaEntry<Sided> {
        super::TriviaEntry::new(crate::slot::SlotValue::Node(Sided(name, super::NodeTrivia { leading: Some(leading), trailing: Some(trailing), inner: None })))
    }

    /// Each item's name, `'#'` for a built record, and whether it still
    /// holds sides of its own.
    fn names(run: &[super::Spliced<Sided>]) -> Vec<(char, bool)> {
        run.iter()
            .map(|item| match item {
                super::Spliced::Entry(entry @ super::TriviaEntry::Value(crate::slot::SlotValue::Node(Sided(name, _)))) => (*name, entry.has_sides()),
                #[cfg(feature = "arena")]
                super::Spliced::Entry(entry @ super::TriviaEntry::Record(_)) => ('#', entry.has_sides()),
                _ => ('?', false),
            })
            .collect()
    }

    #[test]
    fn a_side_holds_each_entry_s_own_sides_as_its_neighbours_at_every_depth() {
        let mut out = String::new();
        let w = crate::spacing::SpacingWriter::new(&mut out, crate::spacing::WordMatcher::default_ident());
        let plain = vec![sided('a', vec![], vec![]), sided('b', vec![], vec![])];
        assert!(matches!(super::spliced(&plain, &w), Ok(None)), "a side whose entries hold no sides renders as it is");
        let a = sided('a', vec![], vec![]);
        let e = sided('e', vec![], vec![]);
        let nested = vec![sided('c', vec![sided('b', vec![a], vec![])], vec![sided('d', vec![], vec![e])]), sided('f', vec![], vec![])];
        let run = super::spliced(&nested, &w).expect("a run").expect("spliced");
        let spliced: Vec<_> = "abcdef".chars().map(|name| (name, false)).collect();
        assert_eq!(names(&run), spliced, "each entry in order, none holding sides of its own");
    }

    #[cfg(feature = "arena")]
    #[test]
    fn a_built_record_s_own_sides_are_the_ones_the_store_it_was_read_from_holds() {
        use crate::trivia_store::{Place, TriviaStore};
        let mut out = String::new();
        let w = crate::spacing::SpacingWriter::new(&mut out, crate::spacing::WordMatcher::default_ident());
        let at = crate::arena::Address(5);
        let built = || super::TriviaEntry::Record(super::RecordEntry { record: super::BuiltEntry { kind: crate::types::KindId(1), at }, store: None });
        let store = TriviaStore::<Sided>::new();
        store.write_side(Place::Record(at), crate::trivia_table::TriviaSide::Leading, vec![sided('a', vec![], vec![])]);
        store.write_side(Place::Record(at), crate::trivia_table::TriviaSide::Trailing, vec![sided('c', vec![], vec![])]);
        let holder = Place::Row { tree: crate::types::TreeId(1), row: crate::types::NodeIndex::ROOT };
        store.write_side(holder, crate::trivia_table::TriviaSide::Leading, vec![built()]);
        let side = store.side(holder, crate::trivia_table::TriviaSide::Leading).expect("written");
        let run = super::spliced(&side, &w).expect("a run").expect("spliced");
        assert_eq!(names(&run), [('a', false), ('#', false), ('c', false)], "the record between the sides its store holds for it");
        assert!(matches!(super::spliced(&[built()], &w), Ok(None)), "a record no store answered holds no sides of its own");
    }

    #[cfg(feature = "arena")]
    #[test]
    fn a_built_record_its_own_sides_reach_refuses_by_name() {
        use crate::trivia_store::{Place, TriviaStore};
        let mut out = String::new();
        let w = crate::spacing::SpacingWriter::new(&mut out, crate::spacing::WordMatcher::default_ident());
        let record = |at| super::TriviaEntry::Record(super::RecordEntry { record: super::BuiltEntry { kind: crate::types::KindId(1), at: crate::arena::Address(at) }, store: None });
        let refused = |entries: &[super::TriviaEntry<Sided>]| matches!(super::spliced(entries, &w), Err(crate::render::CoordinateError::Record(refusal)) if refusal == super::SIDE_CYCLE);
        let store = TriviaStore::<Sided>::new();
        let holder = Place::Row { tree: crate::types::TreeId(1), row: crate::types::NodeIndex::ROOT };
        store.write_side(holder, crate::trivia_table::TriviaSide::Leading, vec![record(5)]);
        store.write_side(Place::Record(crate::arena::Address(5)), crate::trivia_table::TriviaSide::Leading, vec![record(5)]);
        assert!(refused(&store.side(holder, crate::trivia_table::TriviaSide::Leading).expect("written")), "a record in its own side");
        store.write_side(Place::Record(crate::arena::Address(5)), crate::trivia_table::TriviaSide::Leading, vec![record(6)]);
        store.write_side(Place::Record(crate::arena::Address(6)), crate::trivia_table::TriviaSide::Trailing, vec![sided('a', vec![], vec![]), record(5)]);
        assert!(refused(&store.side(holder, crate::trivia_table::TriviaSide::Leading).expect("written")), "two records in each other's sides");
        store.write_side(Place::Record(crate::arena::Address(6)), crate::trivia_table::TriviaSide::Trailing, vec![record(7), record(7)]);
        let run = super::spliced(&store.side(holder, crate::trivia_table::TriviaSide::Leading).expect("written"), &w).expect("a run").expect("spliced");
        assert_eq!(names(&run), [('#', false), ('#', false), ('#', false), ('#', false)], "a record twice in one side is no cycle");
    }
}
