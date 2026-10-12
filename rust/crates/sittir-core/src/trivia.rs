//! `TransportTrivia` — the trivia a transport carries, and where it renders.
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
pub trait TriviaSeam {
    fn seam_gap(&self) -> Option<(LayoutKinds, Option<&str>)> {
        None
    }

    fn depth(&self) -> i32 {
        0
    }

    fn depth_member(_delta: i32) -> Option<Self>
    where
        Self: Sized,
    {
        None
    }
}

impl<T: TriviaSeam> TriviaEntry<T> {
    fn seam_gap(&self) -> Option<(LayoutKinds, Option<&str>)> {
        match &self.value {
            SlotValue::Transport(value) => value.seam_gap(),
            SlotValue::Coord(_) => None,
        }
    }

    /// The change a depth member makes to the excess indentation; 0 for any
    /// other entry.
    pub fn depth(&self) -> i32 {
        match &self.value {
            SlotValue::Transport(value) => value.depth(),
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

impl<T: crate::prepare::Prepare> crate::prepare::Prepare for TransportTrivia<T> {
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
    /// An `ERROR` region's in-line adjacency: the source's whitespace right
    /// before and right after it, up to the tokens beside it on its line.
    /// The region writes it verbatim around itself, in place of any seam. A
    /// comment has none.
    pub before: Option<String>,
    pub after: Option<String>,
}

impl TriviaText {
    /// The entry of `kind` spanning `span` of `source`, with the in-line runs
    /// `adjacent` names before and after it (an `ERROR`'s), and `at` where a
    /// snapshot places it.
    pub fn of_source(kind: KindId, source: &str, span: crate::types::Span, adjacent: Option<(crate::types::Span, crate::types::Span)>, at: Option<crate::points::PointSpan>) -> Self {
        let slice = |run: crate::types::Span| (run.start < run.end).then(|| source[run.start as usize..run.end as usize].to_owned());
        let (before, after) = adjacent.map_or((None, None), |(before, after)| (slice(before), slice(after)));
        Self { kind, text: source[span.start as usize..span.end as usize].to_owned(), span: at, before, after }
    }
}

impl Render for TriviaText {
    fn render(&self, w: &mut dyn RenderSink) -> RenderResult {
        if self.kind == KindId::ERROR {
            let before = self.before.as_deref().unwrap_or_default();
            let after = self.after.as_deref().unwrap_or_default();
            return w.verbatim(&[before, self.text.as_str(), after].concat());
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

/// The trivia one transport owns. Mirrors `NodeTrivia` in `@sittir/types`.
#[derive(Debug, Clone, PartialEq)]
pub struct TransportTrivia<T> {
    pub leading: Option<Vec<TriviaEntry<T>>>,
    pub trailing: Option<Vec<TriviaEntry<T>>>,
    pub inner: Option<Vec<TriviaEntry<T>>>,
}

impl<T> Default for TransportTrivia<T> {
    fn default() -> Self {
        Self {
            leading: None,
            trailing: None,
            inner: None,
        }
    }
}

/// The trivia type of the grammar a transport belongs to: what a coordinate
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
/// kind id and the text it spans (its variant). Codegen implements it once
/// per grammar.
pub trait FromTriviaText: Sized {
    fn from_text(text: TriviaText) -> Self;
    /// The layout member of `kind` spanning `text`, or `None` when `kind` is
    /// none of the grammar's layout members. A whitespace member is a unit,
    /// whatever its text; a member that carries text keeps it.
    fn from_layout(kind: KindId, text: &str) -> Option<Self>;
}

/// A transport family that keeps no trivia drops what a read finds.
impl FromTriviaText for () {
    fn from_text(_: TriviaText) -> Self {}

    fn from_layout(_: KindId, _: &str) -> Option<Self> {
        Some(())
    }
}

/// Text holds no whitespace member.
impl FromTriviaText for TriviaText {
    fn from_text(text: TriviaText) -> Self {
        text
    }

    fn from_layout(_: KindId, _: &str) -> Option<Self> {
        None
    }
}

impl<T: FromTriviaText> FromTriviaText for Box<T> {
    fn from_text(text: TriviaText) -> Self {
        Box::new(T::from_text(text))
    }

    fn from_layout(kind: KindId, text: &str) -> Option<Self> {
        T::from_layout(kind, text).map(Box::new)
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

/// Trivia that frames what a node renders: its leading entries before, its
/// trailing entries after.
pub trait Framing {
    fn frame_leading(&self, w: &mut dyn RenderSink) -> RenderResult;
    fn frame_trailing(&self, w: &mut dyn RenderSink) -> RenderResult;
}

impl<T: Render + TriviaSeam> Framing for TransportTrivia<T> {
    fn frame_leading(&self, w: &mut dyn RenderSink) -> RenderResult {
        self.render_leading(w)
    }

    fn frame_trailing(&self, w: &mut dyn RenderSink) -> RenderResult {
        self.render_trailing(w)
    }
}

/// The outside trivia a folded coordinate renders between, with its
/// grammar's trivia type erased, so a coordinate carries it whatever its
/// slot's transport type.
pub trait FramedTrivia: Framing + std::fmt::Debug {
    fn prepare(&mut self, ctx: &crate::prepare::RenderContext<'_>) -> Result<(), crate::render::CoordinateError>;
    fn boxed_clone(&self) -> Box<dyn FramedTrivia>;
    fn as_any(&self) -> &dyn std::any::Any;
    fn into_any(self: Box<Self>) -> Box<dyn std::any::Any>;
    fn same_as(&self, other: &dyn FramedTrivia) -> bool;
}

impl<T: TriviaItem> FramedTrivia for TransportTrivia<T> {
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

impl<T: Render + TriviaSeam> TransportTrivia<T> {
    /// Leading entries, before the owner renders. Each layout entry takes the
    /// place of the join at its gap; where none stands, an entry joins the
    /// next entry, or the owner, on its line.
    pub fn render_leading(&self, w: &mut dyn RenderSink) -> RenderResult {
        let leading = self.leading.as_deref().unwrap_or(&[]);
        render_joined(leading, LayoutKinds::SPACE, w)?;
        if leading.last().is_some_and(|entry| !entry.is_layout()) {
            join(LayoutKinds::SPACE, w);
        }
        Ok(())
    }

    /// Trailing entries, after the owner renders, in source order. The run
    /// before the first breaking layout entry shares the owner's line and is
    /// seated right after the owner. The rest render after it, each layout
    /// entry taking the place of the join at its gap and an entry with none
    /// joining the one before it on its line; the seam the owner left (its
    /// after edge) is written after them.
    pub fn render_trailing(&self, w: &mut dyn RenderSink) -> RenderResult {
        let trailing = self.trailing.as_deref().unwrap_or(&[]);
        let own = trailing.iter().position(TriviaEntry::breaks).unwrap_or(trailing.len());
        let (same_line, own_line) = trailing.split_at(own);
        if !same_line.is_empty() {
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
        render_joined(entries, between, w)
    }
}

/// Whether a transport's trivia holds inner entries.
pub fn has_inner<T: Render + TriviaSeam>(trivia: Option<&TransportTrivia<T>>) -> bool {
    trivia.is_some_and(|trivia| trivia.inner.as_ref().is_some_and(|entries| !entries.is_empty()))
}

/// The inner entries of a transport's trivia, if it has any.
pub fn render_inner<T: Render + TriviaSeam>(trivia: Option<&TransportTrivia<T>>, w: &mut dyn RenderSink) -> RenderResult {
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
        Ok(Self::new(unsafe { SlotValue::from_napi_value(env, napi_val)? }))
    }
}

#[cfg(feature = "napi-bindings")]
impl<T: ::napi::bindgen_prelude::FromNapiValue + crate::trivia::HasTrivia> ::napi::bindgen_prelude::FromNapiValue
    for TransportTrivia<T>
{
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        use crate::boundary::property;
        Ok(Self {
            leading: unsafe { property(env, napi_val, c"leading")? },
            trailing: unsafe { property(env, napi_val, c"trailing")? },
            inner: unsafe { property(env, napi_val, c"inner")? },
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl<T: ::napi::bindgen_prelude::ToNapiValue> ::napi::bindgen_prelude::ToNapiValue for TransportTrivia<T> {
    /// `{ leading?, trailing?, inner? }`, each only when present.
    unsafe fn to_napi_value(env: ::napi::sys::napi_env, val: Self) -> ::napi::Result<::napi::sys::napi_value> {
        use crate::boundary::{object_with_present, present};
        let leading = unsafe { present(env, c"leading", val.leading)? };
        let trailing = unsafe { present(env, c"trailing", val.trailing)? };
        let inner = unsafe { present(env, c"inner", val.inner)? };
        unsafe { object_with_present(env, &[leading, trailing, inner]) }
    }
}

#[cfg(feature = "napi-bindings")]
impl<T: ::napi::bindgen_prelude::ToNapiValue> ::napi::bindgen_prelude::ToNapiValue for TriviaEntry<T> {
    /// The value's own form.
    unsafe fn to_napi_value(env: ::napi::sys::napi_env, val: Self) -> ::napi::Result<::napi::sys::napi_value> {
        unsafe { SlotValue::to_napi_value(env, val.value) }
    }
}

/// `{ $type, $text, span? }`, the type and the text required.
#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for TriviaText {
    unsafe fn from_napi_value(env: ::napi::sys::napi_env, napi_val: ::napi::sys::napi_value) -> ::napi::Result<Self> {
        let obj = unsafe { crate::boundary::object(env, napi_val)? };
        let kind: u16 = unsafe { crate::boundary::required(env, obj, c"$type", "TriviaText")? };
        Ok(Self {
            kind: KindId(kind),
            text: unsafe { crate::boundary::required(env, obj, c"$text", "TriviaText")? },
            span: unsafe { crate::boundary::property(env, obj, c"span")? },
            before: unsafe { crate::boundary::property(env, obj, c"$before")? },
            after: unsafe { crate::boundary::property(env, obj, c"$after")? },
        })
    }
}

/// `{ $type, $text, span?, $before?, $after? }`.
#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for TriviaText {
    unsafe fn to_napi_value(env: ::napi::sys::napi_env, val: Self) -> ::napi::Result<::napi::sys::napi_value> {
        use crate::boundary::{object_with_present, present};
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
}
