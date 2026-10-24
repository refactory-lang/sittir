//! `NodeTrivia` — the trivia a node carries, and where it renders.
//!
//! A side holds its owner's entries in source order (`trivia_table`): leading
//! entries render before the owner, trailing entries after it, and inner
//! entries at the inner site of an owner with no child. The side's layout
//! entries are its line layout: an entry with no breaking layout entry
//! between it and its owner shares the owner's line.

use std::borrow::Cow;

use crate::layout_kinds::LayoutKinds;
use crate::options::Side;
use crate::render::{Render, RenderResult, RenderSink};
use crate::types::KindId;
use crate::slot::SlotValue;

/// One trivia entry: the node, or the coordinate of one.
#[derive(Debug, Clone, PartialEq)]
pub struct TriviaEntry<T> {
    pub value: SlotValue<T>,
}

impl<T> TriviaEntry<T> {
    pub fn new(value: SlotValue<T>) -> Self {
        Self { value }
    }
}

impl<T: Render> Render for TriviaEntry<T> {
    fn render(&self, w: &mut dyn RenderSink) -> RenderResult {
        self.value.render(w)
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
/// value and its sides into its own run (`spliced`): every value is `Clone`.
pub trait TriviaSeam: Clone {
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

impl<T: TriviaSeam> TriviaEntry<T> {
    /// Whether the entry holds a leading or trailing side of its own.
    fn has_sides(&self) -> bool {
        let held = |side: &Option<Vec<TriviaEntry<T>>>| side.as_ref().is_some_and(|entries| !entries.is_empty());
        match &self.value {
            SlotValue::Node(value) => value.sides().is_some_and(|sides| held(&sides.leading) || held(&sides.trailing)),
            SlotValue::Coord(_) => false,
        }
    }

    fn seam_gap(&self) -> Option<(LayoutKinds, Option<&str>)> {
        match &self.value {
            SlotValue::Node(value) => value.seam_gap(),
            SlotValue::Coord(_) => None,
        }
    }

    /// The change a depth member makes to the excess indentation; 0 for any
    /// other entry.
    pub fn depth(&self) -> i32 {
        match &self.value {
            SlotValue::Node(value) => value.depth(),
            SlotValue::Coord(_) => 0,
        }
    }

    /// Whether the entry is layout: a whitespace member, merged into its
    /// gap, or a depth member.
    pub fn is_layout(&self) -> bool {
        self.seam_gap().is_some() || self.depth() != 0
    }

    /// Whether the entry is layout that breaks the line.
    fn breaks(&self) -> bool {
        self.seam_gap().is_some_and(|(gap, _)| gap.breaks())
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
        for entry in sides.chain(self.inner.iter_mut()).flatten() {
            entry.value.prepare(ctx)?;
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

/// Render `entries` joined by `between`, a whitespace entry taking the
/// place of the join at its gap. Each entry's own edges write what follows
/// it; only the joins are written here.
fn render_joined<T: Render + TriviaSeam>(entries: &[TriviaEntry<T>], between: LayoutKinds, w: &mut dyn RenderSink) -> RenderResult {
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
fn defer_run<T: Render + TriviaSeam>(run: &[TriviaEntry<T>], w: &mut dyn RenderSink) -> RenderResult {
    w.defer_trailing(&mut |w| render_joined(run, LayoutKinds::SPACE, w))
}

/// `entries` with each entry's own sides as its neighbours: its leading
/// entries before it and its trailing entries after it, theirs in turn. A
/// side renders an entry's sides as entries of its own run, so they take part
/// in its joins and its line layout. Borrowed when no entry holds sides.
fn spliced<T: TriviaSeam>(entries: &[TriviaEntry<T>]) -> Cow<'_, [TriviaEntry<T>]> {
    if !entries.iter().any(TriviaEntry::has_sides) {
        return Cow::Borrowed(entries);
    }
    let mut run = Vec::with_capacity(entries.len());
    for entry in entries {
        splice_into(entry.clone(), &mut run);
    }
    Cow::Owned(run)
}

fn splice_into<T: TriviaSeam>(mut entry: TriviaEntry<T>, run: &mut Vec<TriviaEntry<T>>) {
    let (leading, trailing) = match &mut entry.value {
        SlotValue::Node(value) => value.sides_mut().map_or((None, None), |sides| (sides.leading.take(), sides.trailing.take())),
        SlotValue::Coord(_) => (None, None),
    };
    for side in leading.into_iter().flatten() {
        splice_into(side, run);
    }
    run.push(entry);
    for side in trailing.into_iter().flatten() {
        splice_into(side, run);
    }
}

impl<T: Render + TriviaSeam> NodeTrivia<T> {
    /// Leading entries, before the owner renders. Each layout entry takes the
    /// place of the join at its gap; where none stands, an entry joins the
    /// next entry, or the owner, on its line.
    pub fn render_leading(&self, w: &mut dyn RenderSink) -> RenderResult {
        let leading = spliced(self.leading.as_deref().unwrap_or(&[]));
        let leading = &*leading;
        render_joined(leading, LayoutKinds::SPACE, w)?;
        if leading.last().is_some_and(|entry| !entry.is_layout()) {
            join(LayoutKinds::SPACE, w);
        }
        Ok(())
    }

    /// Trailing entries, after the owner renders, in source order. The run
    /// before the first breaking layout entry shares the owner's line and is
    /// seated right after the owner; when it is layout alone it writes no
    /// text to seat, and merges into the gap after the owner. The rest render after it, each layout
    /// entry taking the place of the join at its gap and an entry with none
    /// joining the one before it on its line; the seam the owner left (its
    /// after edge) is written after them.
    pub fn render_trailing(&self, w: &mut dyn RenderSink) -> RenderResult {
        let trailing = spliced(self.trailing.as_deref().unwrap_or(&[]));
        let trailing = &*trailing;
        let own = trailing.iter().position(TriviaEntry::breaks).unwrap_or(trailing.len());
        let (same_line, own_line) = trailing.split_at(own);
        if same_line.iter().all(TriviaEntry::is_layout) {
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

    /// The inner entries, where the owner renders its inner site: one per
    /// line when the site starts a line (the start of a block body, which the
    /// body's own indent and dedent frame, or output standing at a line
    /// start, as at the grammar root), and joined by spaces anywhere else.
    pub fn render_inner(&self, w: &mut dyn RenderSink) -> RenderResult {
        let Some(entries) = self.inner.as_ref() else {
            return Ok(());
        };
        let between = if w.at_body_start() || w.ends_line() { LayoutKinds::NEWLINE } else { LayoutKinds::SPACE };
        render_joined(&spliced(entries), between, w)
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
    /// A trivia entry is a slot value: a node, a coordinate, bare text, a
    /// whitespace member's kind id, or text with its stamped kind (`{ $type,
    /// $text }`, which the entry type decodes).
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
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
    /// The value's own form.
    unsafe fn to_napi_value(env: ::napi::sys::napi_env, val: Self) -> ::napi::Result<::napi::sys::napi_value> {
        // SAFETY: napi calls `to_napi_value` with a live `env`, and every value encoded here is created in it.
        unsafe { SlotValue::to_napi_value(env, val.value) }
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

    fn sided(name: char, leading: Vec<super::TriviaEntry<Sided>>, trailing: Vec<super::TriviaEntry<Sided>>) -> super::TriviaEntry<Sided> {
        super::TriviaEntry::new(crate::slot::SlotValue::Node(Sided(name, super::NodeTrivia { leading: Some(leading), trailing: Some(trailing), inner: None })))
    }

    fn names(entries: &[super::TriviaEntry<Sided>]) -> String {
        entries.iter().map(|entry| if let crate::slot::SlotValue::Node(Sided(name, _)) = &entry.value { *name } else { '?' }).collect()
    }

    #[test]
    fn a_side_holds_each_entry_s_own_sides_as_its_neighbours_at_every_depth() {
        let plain = vec![sided('a', vec![], vec![]), sided('b', vec![], vec![])];
        assert!(matches!(super::spliced(&plain), std::borrow::Cow::Borrowed(_)), "a side whose entries hold no sides renders as it is");
        let a = sided('a', vec![], vec![]);
        let e = sided('e', vec![], vec![]);
        let nested = vec![sided('c', vec![sided('b', vec![a], vec![])], vec![sided('d', vec![], vec![e])]), sided('f', vec![], vec![])];
        let run = super::spliced(&nested);
        assert_eq!(names(&run), "abcdef");
        assert!(run.iter().all(|entry| !entry.has_sides()), "each spliced entry renders without its own sides");
    }
}
