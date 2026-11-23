//! A parsed tree's trivia, assigned to the sides of its nodes one layout
//! owner at a time (`Placement`).
//!
//! The token walk yields a tree's tokens in order: its leaves, the text a
//! hidden token leaves between two children, zero-width leaves, and a
//! zero-width token at each node edge that reaches past the node's own first
//! or last token, which is where a hidden external token that is no node
//! (python's indent and dedent) bounds it. Extras and `ERROR` nodes are
//! entries, never tokens, and whitespace is never a token. Gap *k* lies
//! between token *k* and token *k + 1*; the gaps before the first token and
//! after the last are the file's edges.
//!
//! A gap's owner is the smallest node containing both its tokens, or the root
//! at the file's edges. Its entries go to the owner's named child beside the
//! gap, the same answer an arena parse gives (`owner`): an entry starting on
//! token *k*'s row trails the child ending at token *k*, the rest lead the
//! child starting at token *k + 1*. With no child on
//! one side, every entry goes to the child on the other; an owner with no
//! named child takes them as its `inner`; an owner whose named children are
//! not beside the gap gives an extra or an `ERROR` to the nearest of them,
//! leading the next or else trailing the previous, and takes none of its
//! layout (`unowned`). A zero-width node holds no side. The child is the owner's own
//! child, so the outermost node ending or starting at the token takes the
//! side. A list node (the grammar's list kinds) passes an extra or an
//! `ERROR` to the item ending or starting at the token, where one does and
//! the surface exposes it as a node (not a unit kind): the surface exposes a
//! list's items, not the list. Whitespace is no entry: a side read writes
//! a line-break member in each gap the side holds that the source breaks
//! (`with_line_breaks`), and the options write every other gap.

use crate::layout_kinds::LayoutKinds;
use crate::heap::HeapBytes;
use crate::nodes::{Kid, Nodes, Step, Visit};
use crate::types::{KindId, NodeIndex, Span};

mod place;
pub use place::{Placement, Source, Table};

/// A side of a node that holds trivia: before its first token, after its
/// last, or, for a node with no named child, between its own tokens.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum TriviaSide {
    Leading,
    Trailing,
    Inner,
}

impl HeapBytes for TriviaSide {
    fn heap_bytes(&self) -> usize {
        match self {
            Self::Leading | Self::Trailing | Self::Inner => 0,
        }
    }
}


/// An entry the assignment gives a side: an extra or an `ERROR` by its
/// descendant index, or an extra that is a layout member
/// (`SurfaceKinds::layout`) by its descendant index.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Assigned {
    Extra(NodeIndex),
    Error(NodeIndex),
    Member(NodeIndex),
}

impl Assigned {
    /// The descendant index of the entry.
    #[must_use]
    pub fn index(self) -> NodeIndex {
        match self {
            Self::Extra(at) | Self::Error(at) | Self::Member(at) => at,
        }
    }
}

impl HeapBytes for Assigned {
    fn heap_bytes(&self) -> usize {
        match self {
            Self::Extra(_) | Self::Error(_) | Self::Member(_) => 0,
        }
    }
}

/// A child of a node beside an extra or `ERROR` among the node's children,
/// as `owner` reads it: its bytes, whether it holds sides (`Kid::holder`),
/// whether it is an entry of a side itself (`Kid::entry`), and whether it
/// is a flag's keyword (`Route::is_flag`), which has no cell to keep a side
/// on. A child that is none of these is a token: anonymous, or named with
/// no width.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Sibling {
    pub span: Span,
    pub holder: bool,
    pub entry: bool,
    pub flag: bool,
}

/// The side an extra or `ERROR` goes to among its siblings: trailing the
/// one at `at` of the siblings before it; leading the one at `at` of the
/// siblings after it; or the `inner` side of the node holding them, which
/// has no child that holds sides.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Owner {
    Trailing { at: usize },
    Leading { at: usize },
    Inner,
}

/// Whether no line break lies between the bytes `a` and `b` of `source`.
fn same_row(source: &str, a: u32, b: u32) -> bool {
    let (low, high) = (a.min(b) as usize, a.max(b) as usize);
    !source.as_bytes()[low..high].contains(&b'\n')
}

/// Where the bytes of an entry start against the token before them.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Before {
    /// On a row of their own, after the run of line breaks between as
    /// the layout kind it is (`GeometryGap::kind`).
    OwnRow(LayoutKinds),
    /// First in the source: no token lies before them.
    First,
    /// On that token's row, with whitespace between.
    Spaced,
    /// Against that token, with nothing between.
    Touching,
}

/// Where the bytes `span` of `source`, an entry of `kind`, start against
/// the token before them (`same_row` decides the row; on a row of their
/// own, the run before them, one line break for an `ERROR`, whose gaps the
/// options write), and the gap between them and the token
/// after them as the layout kind it is (`GeometryGap::kind`), counting a
/// line break the bytes end with as one of the gap's; none where no token
/// follows them.
#[must_use]
pub fn line_breaks_beside(source: &str, span: Span, kind: crate::types::KindId) -> (Before, Option<LayoutKinds>) {
    let bytes = source.as_bytes();
    let (start, end) = ((span.start as usize).min(bytes.len()), (span.end as usize).min(bytes.len()));
    let before = match bytes[..start].iter().rposition(|byte| !byte.is_ascii_whitespace()).map(|at| at + 1) {
        Some(token_end) if same_row(source, crate::types::narrow(token_end), span.start) => {
            if token_end == start { Before::Touching } else { Before::Spaced }
        }
        Some(token_end) => {
            let breaks = if kind == crate::types::KindId::ERROR { 1 } else { source[token_end..start].matches('\n').count() };
            Before::OwnRow(crate::classify::GeometryGap { breaks: crate::types::narrow(breaks), spaces: 0 }.kind())
        }
        None => Before::First,
    };
    let gap = &source[end..][..bytes[end..].iter().take_while(|byte| byte.is_ascii_whitespace()).count()];
    if end + gap.len() == bytes.len() {
        return (before, None);
    }
    let own = usize::from(end > start && bytes[end - 1] == b'\n');
    let newlines = gap.matches('\n').count();
    let kind = crate::classify::GeometryGap { breaks: crate::types::narrow(own + newlines), spaces: crate::types::narrow(gap.len() - newlines) }.kind();
    (before, Some(kind))
}

/// The gap after an entry beyond the entry's own line break when it ends
/// its line (`ResolvedOptions::ends_line`): a single line break is the
/// entry's own, so none is left; a wider gap stays as it is.
#[must_use]
pub fn beyond_own_break(after: Option<LayoutKinds>, ends_line: bool) -> Option<LayoutKinds> {
    if ends_line && after == Some(LayoutKinds::NEWLINE) { Some(LayoutKinds::TIGHT) } else { after }
}

/// Pushes `entries`, the entries of `side` of a node in source order, each
/// with what `line_breaks_beside` answers for it, onto `out` as the side
/// holds them: each entry, with the layout member (`member`) of the gap's
/// kind in each gap the side holds that breaks the line, and nothing in one
/// that does not. The gaps a side holds are those between two of its
/// entries and the one between its entries and its owner: after a leading
/// side's last entry, before a trailing side's first. A leading or inner
/// side whose first entry starts on the row of the token before it with
/// whitespace between (`Before::Spaced`) holds a space member ahead of it,
/// and a trailing or inner side whose first entry starts on a row of its
/// own the member of the run before it (`Before::OwnRow`). An inner side holds a space member after its
/// last entry where whitespace on its row lies before the token after it,
/// and a line-break member where a line break does. The rest are the gaps
/// a parent writes, which the options write.
pub fn with_line_breaks<E>(side: TriviaSide, entries: impl IntoIterator<Item = (E, (Before, Option<LayoutKinds>))>, member: impl Fn(LayoutKinds) -> Option<E>, out: &mut Vec<E>) {
    let between = |after: Option<LayoutKinds>, out: &mut Vec<E>| {
        if let Some(kind) = after.filter(|kind| kind.breaks()) {
            out.extend(member(kind));
        }
    };
    let mut last: Option<Option<LayoutKinds>> = None;
    for (entry, (before, after)) in entries {
        match last {
            None => match before {
                Before::Spaced if side != TriviaSide::Trailing => out.extend(member(LayoutKinds::SPACE)),
                Before::OwnRow(kind) if side != TriviaSide::Leading => out.extend(member(kind)),
                _ => {}
            },
            Some(after) => between(after, out),
        }
        out.push(entry);
        last = Some(after);
    }
    match (side, last) {
        (TriviaSide::Leading, Some(after)) => between(after, out),
        (TriviaSide::Inner, Some(Some(LayoutKinds::SPACE))) => out.extend(member(LayoutKinds::SPACE)),
        (TriviaSide::Inner, Some(Some(kind))) if kind.breaks() => out.extend(member(LayoutKinds::NEWLINE)),
        _ => {}
    }
}

/// Where the extra or `ERROR` spanning `entry` goes, `before` and `after`
/// its siblings in source order, the first answer that holds:
/// 1. trailing the holder before it with only entries between, when it
///    starts on the row that holder ends on;
/// 2. leading the holder after it with only entries between;
/// 3. trailing the holder before it with only entries between;
/// 4. leading the nearest holder after it, else trailing the nearest before
///    it, else the `inner` side of the node holding them.
///
/// A sibling with an empty span that holds nothing is passed over as an
/// entry is: an automatic semicolon placed before a same-line comment has no
/// text, so the comment still trails the holder before it. A flag's
/// keyword holds no side: it passes an extra or `ERROR` before it forward,
/// to the slot it qualifies, so in `let mut /* c */ x` and in
/// `static /* c */ mut X` the comment leads the slot after the keyword. It
/// passes nothing backward: behind an extra or `ERROR` it stops the search
/// as a token does.
#[must_use]
pub fn owner(before: &[Sibling], entry: Span, after: &[Sibling], source: &str) -> Owner {
    let holds = |sibling: &Sibling| sibling.holder && !sibling.flag;
    let passed = |sibling: &Sibling| sibling.entry || (!sibling.holder && sibling.span.start == sibling.span.end);
    let beside_before = before.iter().rposition(|sibling| !passed(sibling)).filter(|&at| holds(&before[at]));
    let beside_after = after.iter().position(|sibling| !passed(sibling) && !sibling.flag).filter(|&at| holds(&after[at]));
    if let Some(at) = beside_before.filter(|&at| same_row(source, before[at].span.end, entry.start)) {
        return Owner::Trailing { at };
    }
    match (beside_after, beside_before) {
        (Some(at), _) => Owner::Leading { at },
        (None, Some(at)) => Owner::Trailing { at },
        (None, None) => match (after.iter().position(holds), before.iter().rposition(holds)) {
            (Some(at), _) => Owner::Leading { at },
            (None, Some(at)) => Owner::Trailing { at },
            (None, None) => Owner::Inner,
        },
    }
}

/// The item `list` passes the extras and `ERROR`s of its `side` to: its
/// first (leading) or last (trailing) holder child among `kids`, the
/// list's children, when that child lies at the list's edge and is not a
/// unit kind; none for a node the surface does not expose in its place
/// (`SurfaceKinds::exposes_in_place`), and then `kids` is never asked.
pub fn edge_item(nodes: &mut dyn Nodes<'_>, list: &Kid, kinds: SurfaceKinds, side: TriviaSide) -> Option<Kid> {
    edge_item_from(list, kinds, side, || {
        let leading = side == TriviaSide::Leading;
        let mut item = nodes.edge(list.index, if leading { crate::options::Side::Before } else { crate::options::Side::After })?;
        while !item.holder() {
            item = if leading { nodes.next(item.index) } else { nodes.previous(item.index) }?;
        }
        Some(item)
    })
}

/// `edge_item`, the holder nearest the edge on `side` among `kids`, which a
/// caller already holds listed.
pub(crate) fn edge_item_of(kids: &[Kid], list: &Kid, kinds: SurfaceKinds, side: TriviaSide) -> Option<Kid> {
    edge_item_from(list, kinds, side, || {
        let mut holders = kids.iter().filter(|kid| kid.holder());
        (if side == TriviaSide::Leading { holders.next() } else { holders.next_back() }).copied()
    })
}

fn edge_item_from(list: &Kid, kinds: SurfaceKinds, side: TriviaSide, holder: impl FnOnce() -> Option<Kid>) -> Option<Kid> {
    if list.leaf() || list.entry() || !kinds.exposes_in_place(list.grammar) {
        return None;
    }
    let item = holder()?;
    kinds.takes_edge(item.grammar, item.span(), list.span(), side).then_some(item)
}

/// The kinds of a grammar the assignment reads from its surface: the list
/// kinds, whose items the surface exposes in the list's place, the wrappers
/// a list seats around each of its elements, which expose the element in
/// their place as a list does its items, the unit
/// kinds, which it exposes as a kind id rather than a node, the extra kinds
/// that are layout members, which it assigns as layout, the depth
/// members (`indent`, `dedent`, 0 where the grammar has none), the kinds
/// whose template renders an inner side, and whether the grammar has trivia
/// that isn't whitespace: an extra with a kind of
/// its own, such as a comment. Work that exists only for a placed entry
/// (placing extras, a list's edge item) runs only where `named_extras`
/// holds or the tree holds an `ERROR`.
#[derive(Debug, Clone, Copy, Default)]
pub struct SurfaceKinds {
    pub lists: &'static [KindId],
    pub wrappers: &'static [KindId],
    pub units: &'static [KindId],
    pub layout: &'static [KindId],
    pub indent: KindId,
    pub dedent: KindId,
    pub inner: &'static [KindId],
    pub named_extras: bool,
}

impl SurfaceKinds {
    /// Whether the surface exposes what a node of `kind` holds in its
    /// place: a list its items, a wrapper its element. Such a node holds
    /// no sides at its edges; its edge items do.
    #[must_use]
    pub fn exposes_in_place(&self, kind: KindId) -> bool {
        self.lists.contains(&kind) || self.wrappers.contains(&kind)
    }

    /// Whether a list's first or last holder child, of `kind` and spanning
    /// `item`, takes the list's `side`: it lies at that edge of `list` and is
    /// not a unit kind.
    #[must_use]
    pub fn takes_edge(&self, kind: KindId, item: Span, list: Span, side: TriviaSide) -> bool {
        let at_edge = if side == TriviaSide::Leading { item.start == list.start } else { item.end == list.end };
        at_edge && !self.units.contains(&kind)
    }

    /// Whether the grammar has a depth member at all.
    #[must_use]
    pub fn has_depth_members(&self) -> bool {
        self.indent != KindId::BLANK || self.dedent != KindId::BLANK
    }

    /// Whether a node of `kind` has an inside, a side its extras and
    /// `ERROR`s are kept on: a unit has none, and renders as its source.
    #[must_use]
    pub fn has_inside(&self, kind: KindId) -> bool {
        !self.units.contains(&kind)
    }

    /// Whether a node of `kind` has an inside: its template renders an inner
    /// side, where an empty node of the kind holds its trivia.
    #[must_use]
    pub fn holds_inner(&self, kind: KindId) -> bool {
        self.inner.contains(&kind)
    }

    /// Whether `kind` is one of the grammar's depth members.
    #[must_use]
    pub fn is_depth_member(&self, kind: KindId) -> bool {
        kind != KindId::BLANK && (kind == self.indent || kind == self.dedent)
    }
}

/// A tree's depth members (`SurfaceKinds::indent`, `dedent`) by descendant
/// index, each with the levels the members up to it open net of those they
/// close, so the members of any subtree are counted by two searches
/// (`between`).
#[derive(Debug, Default)]
pub struct DepthMembers {
    at: Vec<NodeIndex>,
    net: Vec<i32>,
    walked: u32,
}

impl DepthMembers {
    /// The depth members of the tree `nodes` navigates, found by one walk
    /// over every node, the interiors of extras and `ERROR`s included; none
    /// where `kinds` has no depth member.
    #[must_use]
    pub fn of(nodes: &mut dyn Nodes<'_>, kinds: SurfaceKinds) -> Self {
        let mut members = Self::default();
        if !kinds.has_depth_members() {
            return members;
        }
        nodes.walk(NodeIndex::ROOT, &mut |step, kid| {
            if step == Step::Meet {
                members.walked += 1;
                members.meet(kid, kinds);
            }
            Visit::Enter
        });
        members
    }

    /// The depth members among `kids`, every node of a tree in preorder,
    /// found by a scan of them with no walk; none where `kinds` has no
    /// depth member.
    #[must_use]
    pub fn scanned(kids: impl IntoIterator<Item = Kid>, kinds: SurfaceKinds) -> Self {
        let mut members = Self::default();
        if kinds.has_depth_members() {
            for kid in kids {
                members.meet(&kid, kinds);
            }
        }
        members
    }

    /// Counts `kid`, the next node in preorder, when it is a depth member.
    fn meet(&mut self, kid: &Kid, kinds: SurfaceKinds) {
        if kinds.is_depth_member(kid.grammar) {
            let net = self.net.last().copied().unwrap_or(0) + i32::from(kid.grammar == kinds.indent) - i32::from(kid.grammar == kinds.dedent);
            self.at.push(kid.index);
            self.net.push(net);
        }
    }

    /// The levels the members at the descendant indexes `from..to` open net
    /// of those they close.
    #[must_use]
    pub fn between(&self, from: NodeIndex, to: NodeIndex) -> i32 {
        self.before(to) - self.before(from)
    }

    fn before(&self, index: NodeIndex) -> i32 {
        self.at.partition_point(|&at| at < index).checked_sub(1).map_or(0, |last| self.net[last])
    }

    /// The nodes the walk that found the members visited.
    #[must_use]
    pub fn walked(&self) -> u32 {
        self.walked
    }
}

impl HeapBytes for DepthMembers {
    fn heap_bytes(&self) -> usize {
        let Self { at, net, walked: _ } = self;
        at.heap_bytes() + net.heap_bytes()
    }
}

/// The walk under one node: its tokens in source order, its entries by
/// index in source order, and the bytes of each node under it.
pub struct Walk {
    pub tokens: Vec<Span>,
    pub entries: Vec<NodeIndex>,
    /// The bounds the walk folded into the nodes it was inside (`Bounds`):
    /// one for each token it pushed inside a node and one for each node it
    /// left inside another.
    pub folds: u32,
    spans: Spans,
}

/// The bytes of each node under a walk's start, by its index less the
/// start's: a tree's subtree's indexes run on from its root's.
struct Spans {
    base: NodeIndex,
    spans: Vec<(u32, u32)>,
}

impl Spans {
    fn set(&mut self, index: NodeIndex, span: (u32, u32)) {
        self.spans[index.offset_from(self.base) as usize] = span;
    }

    fn get(&self, index: NodeIndex) -> (u32, u32) {
        self.spans[index.offset_from(self.base) as usize]
    }
}

/// The first start and last end of the tokens pushed inside a node, its
/// descendants' included, kept as the walk pushes them, so a node's own
/// tokens need no second look when the walk leaves it.
#[derive(Default)]
struct Bounds(Option<(u32, u32)>);

impl Bounds {
    fn widen(&mut self, start: u32, end: u32, folds: &mut u32) {
        *folds += 1;
        self.0 = Some(self.0.map_or((start, end), |(first, last)| (first.min(start), last.max(end))));
    }
}

impl Walk {
    /// The bytes of the node at descendant `index`, which lies under the walk's start.
    #[must_use]
    pub fn span(&self, index: NodeIndex) -> (u32, u32) {
        self.spans.get(index)
    }
}

/// Whether the node at `index` is empty: no child of it holds sides
/// (`Kid::holder`), a named unit with no offsets holding them unless
/// `zero_width` says its kind has no text in a source, so the assignment
/// gives it the trivia between its own tokens as `inner`.
#[must_use]
pub fn is_empty(nodes: &mut dyn Nodes<'_>, index: NodeIndex, zero_width: &dyn Fn(KindId) -> bool) -> bool {
    let kids = nodes.kids(index);
    !kids.iter().any(|kid| kid.holder() || (kid.named && !kid.entry() && nodes.is_unit(kid.index) && !zero_width(kid.grammar)))
}

/// The walk under the node at descendant `index` of the tree `nodes`
/// navigates. The walk's start has no edge tokens of its own: they would lie
/// at its bounds.
#[must_use]
pub fn walk(nodes: &mut dyn Nodes<'_>, index: NodeIndex, source: &str) -> Walk {
    struct Frame {
        index: NodeIndex,
        at: u32,
        bounds: Bounds,
    }
    let mut spans = Spans { base: index, spans: vec![(0, 0); nodes.kid(index).count as usize] };
    let mut tokens: Vec<Span> = Vec::new();
    let mut entries: Vec<NodeIndex> = Vec::new();
    let mut frames: Vec<Frame> = Vec::new();
    let mut folds = 0;
    let hidden = |from: u32, to: u32| {
        let text = source.get(from as usize..to as usize)?;
        let trimmed = text.trim();
        if trimmed.is_empty() {
            return None;
        }
        let start = from + crate::types::narrow(text.len() - text.trim_start().len());
        Some(Span { start, end: start + crate::types::narrow(trimmed.len()) })
    };
    let push = |tokens: &mut Vec<Span>, bounds: Option<&mut Bounds>, folds: &mut u32, token: Span| {
        if let Some(bounds) = bounds {
            bounds.widen(token.start, token.end, folds);
        }
        tokens.push(token);
    };
    nodes.walk(index, &mut |step, kid| {
        if step == Step::Leave {
            let Some(mut frame) = frames.pop() else { return Visit::Pass };
            let (start, end) = spans.get(frame.index);
            if let Some(token) = hidden(frame.at, end) {
                push(&mut tokens, Some(&mut frame.bounds), &mut folds, token);
            }
            if frame.index != index {
                if let Some((first, last)) = frame.bounds.0 {
                    if start < first {
                        push(&mut tokens, Some(&mut frame.bounds), &mut folds, Span { start, end: start });
                    }
                    if end > last {
                        push(&mut tokens, Some(&mut frame.bounds), &mut folds, Span { start: end, end });
                    }
                }
            }
            if let Some(parent) = frames.last_mut() {
                parent.at = end;
                if let Some((first, last)) = frame.bounds.0 {
                    parent.bounds.widen(first, last, &mut folds);
                }
            }
            return Visit::Pass;
        }
        let Kid { start, end, .. } = *kid;
        spans.set(kid.index, (start, end));
        if let Some(frame) = frames.last_mut() {
            if let Some(token) = hidden(frame.at, start) {
                push(&mut tokens, Some(&mut frame.bounds), &mut folds, token);
            }
        }
        if kid.entry() {
            entries.push(kid.index);
        } else if kid.leaf() {
            push(&mut tokens, frames.last_mut().map(|frame| &mut frame.bounds), &mut folds, Span { start, end });
        } else {
            frames.push(Frame { index: kid.index, at: start, bounds: Bounds::default() });
            return Visit::Enter;
        }
        if let Some(frame) = frames.last_mut() {
            frame.at = end;
        }
        Visit::Pass
    });
    tokens.sort_by_key(|token| (token.start, token.end));
    Walk { tokens, entries, folds, spans }
}

/// Where the assignment puts an entry of a gap.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Place {
    Side(NodeIndex, TriviaSide),
    Unowned,
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sibling(start: u32, end: u32, holder: bool) -> Sibling {
        Sibling { span: Span { start, end }, holder, entry: false, flag: false }
    }

    #[test]
    fn owner_passes_an_entry_forward_over_a_flag_and_never_gives_a_flag_a_side() {
        let flag = |start, end| Sibling { flag: true, ..sibling(start, end, true) };
        let source = "let mut /* c */ x";
        assert_eq!(owner(&[sibling(0, 3, false), flag(4, 7)], Span { start: 8, end: 15 }, &[sibling(16, 17, true)], source), Owner::Leading { at: 0 });
        let source = "let mut // c\n    x";
        assert_eq!(owner(&[sibling(0, 3, false), flag(4, 7)], Span { start: 8, end: 12 }, &[sibling(17, 18, true)], source), Owner::Leading { at: 0 });
        let source = "static /* c */ mut X";
        assert_eq!(owner(&[sibling(0, 6, false)], Span { start: 7, end: 14 }, &[flag(15, 18), sibling(19, 20, true)], source), Owner::Leading { at: 1 });
        let source = "a?. /* c */ [0]";
        assert_eq!(owner(&[sibling(0, 1, true), flag(1, 3)], Span { start: 4, end: 11 }, &[sibling(12, 15, true)], source), Owner::Leading { at: 0 });
        assert_eq!(owner(&[flag(4, 7)], Span { start: 8, end: 15 }, &[], "let mut /* c */"), Owner::Inner);
    }

    #[test]
    fn owner_passes_over_an_empty_sibling_that_holds_nothing() {
        let source = "a: string // c\n  b: number";
        let (a, b) = (sibling(0, 9, true), sibling(17, 26, true));
        assert_eq!(owner(&[a, sibling(10, 10, false)], Span { start: 10, end: 14 }, &[b], source), Owner::Trailing { at: 0 });
        let source = "a\n// c\nb";
        assert_eq!(owner(&[sibling(0, 1, true)], Span { start: 2, end: 6 }, &[sibling(7, 7, false), sibling(7, 8, true)], source), Owner::Leading { at: 1 });
    }

    #[test]
    fn owner_stops_at_a_separator_and_at_an_empty_sibling_that_holds_sides() {
        let source = "a, // c\n  b";
        let (a, b) = (sibling(0, 1, true), sibling(10, 11, true));
        assert_eq!(owner(&[a, sibling(1, 2, false)], Span { start: 3, end: 7 }, &[b], source), Owner::Leading { at: 0 });
        let source = "a // c\n  b";
        assert_eq!(owner(&[sibling(0, 1, true), sibling(2, 2, true)], Span { start: 2, end: 6 }, &[sibling(9, 10, true)], source), Owner::Trailing { at: 1 });
    }

    /// A side's entries as `with_line_breaks` holds them: `s` a space
    /// member, `n` a line-break member, `b` a blank-line member, `d` a
    /// double blank-line member, `c` an entry.
    fn held(source: &str, side: TriviaSide, comments: &[&str]) -> String {
        let entries = comments.iter().map(|comment| {
            let start = crate::types::narrow(source.find(comment).expect("the comment"));
            ('c', line_breaks_beside(source, Span { start, end: start + crate::types::narrow(comment.len()) }, crate::types::KindId::BLANK))
        });
        let mut out = Vec::new();
        let member = |kind: LayoutKinds| match kind {
            LayoutKinds::SPACE => Some('s'),
            LayoutKinds::NEWLINE => Some('n'),
            LayoutKinds::BLANKLINE => Some('b'),
            LayoutKinds::DOUBLE_BLANKLINE => Some('d'),
            _ => None,
        };
        with_line_breaks(side, entries, member, &mut out);
        out.into_iter().collect()
    }

    #[test]
    fn a_leading_entry_on_the_row_of_the_token_before_it_holds_a_space_ahead_of_it() {
        assert_eq!(held("a: string, // c\n  b", TriviaSide::Leading, &["// c"]), "scn");
        assert_eq!(held("a, /* c */ b", TriviaSide::Leading, &["/* c */"]), "sc");
    }

    #[test]
    fn a_leading_entry_on_its_own_row_or_first_in_the_source_holds_no_space() {
        assert_eq!(held("a,\n  // c\n  b", TriviaSide::Leading, &["// c"]), "cn");
        assert_eq!(held("// c\nb", TriviaSide::Leading, &["// c"]), "cn");
        assert_eq!(held("  /* c */ b", TriviaSide::Leading, &["/* c */"]), "c");
    }

    #[test]
    fn a_leading_entry_touching_the_token_before_it_holds_no_space() {
        assert_eq!(held("for (/* c */ ;;)", TriviaSide::Leading, &["/* c */"]), "c");
        assert_eq!(held("[/* c */ x]", TriviaSide::Leading, &["/* c */"]), "c");
    }

    #[test]
    fn an_entry_with_a_blank_line_after_it_holds_a_blank_line_member() {
        assert_eq!(held("// c\n\nb", TriviaSide::Leading, &["// c"]), "cb");
        assert_eq!(held("/* a */\n\n/* b */\nc", TriviaSide::Leading, &["/* a */", "/* b */"]), "cbcn");
        assert_eq!(held("a /* x */\n\n/* y */\nb", TriviaSide::Trailing, &["/* x */", "/* y */"]), "cbc");
        assert_eq!(held("//! a\n//! b\n\nuse c;", TriviaSide::Leading, &["//! a\n", "//! b\n"]), "cncb");
        assert_eq!(held("// c\n\n\nb", TriviaSide::Leading, &["// c"]), "cd");
        assert_eq!(held("// c\n\n\n\n\nb", TriviaSide::Leading, &["// c"]), "cd");
    }

    #[test]
    fn an_inner_side_keeps_the_row_of_the_tokens_around_it() {
        assert_eq!(held("{ /* TODO */\n}", TriviaSide::Inner, &["/* TODO */"]), "scn");
        assert_eq!(held("{ /* empty */ }", TriviaSide::Inner, &["/* empty */"]), "scs");
        assert_eq!(held("{/* empty */}", TriviaSide::Inner, &["/* empty */"]), "c");
        assert_eq!(held("{\n  /* a */\n}", TriviaSide::Inner, &["/* a */"]), "ncn");
        assert_eq!(held("{\n  // a\n  /* b */\n}", TriviaSide::Inner, &["// a", "/* b */"]), "ncncn");
        assert_eq!(held("// only\n", TriviaSide::Inner, &["// only"]), "c");
        assert_eq!(held("/* a */\n/* b */\n", TriviaSide::Inner, &["/* a */", "/* b */"]), "cnc");
    }

    #[test]
    fn a_trailing_entry_takes_no_space_and_breaks_only_where_its_source_does() {
        assert_eq!(held("a // c\nb", TriviaSide::Trailing, &["// c"]), "c");
        assert_eq!(held("a\n  // c\nb", TriviaSide::Trailing, &["// c"]), "nc");
    }

    #[test]
    fn a_trailing_or_inner_entry_on_its_own_row_holds_the_run_before_it_as_its_kind() {
        assert_eq!(held("a\n\n// c\nb", TriviaSide::Trailing, &["// c"]), "bc");
        assert_eq!(held("a\n\n\n// c\nb", TriviaSide::Trailing, &["// c"]), "dc");
        assert_eq!(held("a\n\n\n\n\n// c\nb", TriviaSide::Trailing, &["// c"]), "dc");
        assert_eq!(held("{\n\n  /* a */\n}", TriviaSide::Inner, &["/* a */"]), "bcn");
        assert_eq!(held("a\n\n// c\nb", TriviaSide::Leading, &["// c"]), "cn");
    }
}
