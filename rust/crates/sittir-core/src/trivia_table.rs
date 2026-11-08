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
//! gap: an entry starting on token *k*'s row trails the child ending at token
//! *k*, the rest lead the child starting at token *k + 1*. With no child on
//! one side, every entry goes to the child on the other; an owner with no
//! named child takes them as its `inner`; an owner whose named children are
//! not beside the gap gives an extra or an `ERROR` to the nearest of them,
//! leading the next or else trailing the previous, and takes none of its
//! layout (`unowned`). A zero-width node holds no side. The child is the owner's own
//! child, so the outermost node ending or starting at the token takes the
//! side. A list node (the grammar's list kinds) passes an extra or an
//! `ERROR` to the item ending or starting at the token, where one does and
//! the surface exposes it as a node (not a unit kind): the surface exposes a
//! list's items, not the list. A layout run stays on the list, whose own
//! sides spell its edges. A run of whitespace is a layout entry, placed as an
//! entry ending on its last row is: it leads the child after it, or trails
//! the child before it when none follows. A side read turns it into a member
//! only where it deviates from what the read-time options write there, or,
//! in a gap of a list slot, from the class the slot stores
//! (`ParsedTree::deviation`, `list_slots`).

use crate::heap::HeapBytes;
use crate::nodes::{Kid, Nodes, Step, Visit};
use crate::types::{KindId, NodeIndex, RunId, Span};

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
/// descendant index; a run of whitespace between two tokens or entries, with
/// or without a line break, by its place among the table's runs
/// (`Placement::run`), its bytes, the descendant index of its owner (the smallest node holding the tokens
/// on both sides of the run's gap, or the node itself for its `inner` side)
/// and the signed number of depth members it carries (`depth`); an extra
/// that is a layout member (`SurfaceKinds::layout`) by its descendant index;
/// or depth members alone: those that restore an owner's excess at its end,
/// or those of a run at the file's edge, which stores no layout (`Depth`). A run after an entry placed on a node's leading side is on
/// that side too: it spells the gap from the entry to its owner.
///
/// A run's excess is how far its last line's indentation reaches past the
/// structural indentation at the token after it, in whole levels of the
/// indentation unit (floored, a tab counting as one level; negative where
/// it falls short). The structural indentation is that of the innermost
/// stretch a template indents there (`DepthRegion`): the indentation of the
/// line its first token starts, or one level past the stretch around it
/// where that token shares a line with what precedes it or it holds none. A run carries the
/// change in excess from the line before it. The excess the runs of an owner change is
/// restored where the owner ends, inside its span: on the trailing side of
/// its last child that holds trivia, or its `inner` side when no child does.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Assigned {
    Extra(NodeIndex),
    Error(NodeIndex),
    Layout { run: RunId, start: u32, end: u32, owner: NodeIndex, depth: i32 },
    Member(NodeIndex),
    Depth(i32),
}

impl HeapBytes for Assigned {
    fn heap_bytes(&self) -> usize {
        match self {
            Self::Extra(_) | Self::Error(_) | Self::Member(_) | Self::Depth(_) | Self::Layout { run: _, start: _, end: _, owner: _, depth: _ } => 0,
        }
    }
}

/// Where a template indents a node's children: after a literal child (the
/// first of the node's anonymous children with one of the texts) or from
/// the node's start, until before a literal child (the last with one of
/// the texts) or the node's end.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DepthAnchor {
    Start,
    End,
    After(&'static [&'static str]),
    Before(&'static [&'static str]),
}

/// One level of structural indentation a kind's template opens over a
/// stretch of its children.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct DepthRegion {
    pub kind: KindId,
    pub open: DepthAnchor,
    pub close: DepthAnchor,
}

/// The kinds of a grammar the assignment reads from its surface: the list
/// kinds, whose items the surface exposes in the list's place, the unit
/// kinds, which it exposes as a kind id rather than a node, the extra kinds
/// that are layout members, which it assigns as layout, the depth members
/// (`indent`, `dedent`, 0 where the grammar has none) and the kinds'
/// structural indentation (`depth`).
#[derive(Debug, Clone, Copy, Default)]
pub struct SurfaceKinds {
    pub lists: &'static [KindId],
    pub units: &'static [KindId],
    pub layout: &'static [KindId],
    pub indent: KindId,
    pub dedent: KindId,
    pub depth: &'static [DepthRegion],
}

impl SurfaceKinds {
    /// Whether the grammar has a depth member at all.
    #[must_use]
    pub fn has_depth_members(&self) -> bool {
        self.indent != KindId::BLANK || self.dedent != KindId::BLANK
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
        let mut net = 0;
        nodes.walk(NodeIndex::ROOT, &mut |step, kid| {
            if step == Step::Meet {
                members.walked += 1;
                if kinds.is_depth_member(kid.grammar) {
                    net += i32::from(kid.grammar == kinds.indent) - i32::from(kid.grammar == kinds.dedent);
                    members.at.push(kid.index);
                    members.net.push(net);
                }
            }
            Visit::Enter
        });
        members
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
/// descendant index in source order, and the bytes of each node under it,
/// kept by its index less the walk's start.
pub struct Walk {
    pub tokens: Vec<Span>,
    pub entries: Vec<NodeIndex>,
    /// The bounds the walk folded into the nodes it was inside (`Bounds`):
    /// one for each token it pushed inside a node and one for each node it
    /// left inside another.
    pub folds: u32,
    spans: Vec<(u32, u32)>,
    base: NodeIndex,
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
        self.spans[index.offset_from(self.base) as usize]
    }
}

/// Whether the node at `index` is empty: no child of it holds sides
/// (`Kid::holder`), so the assignment gives it the trivia between its own
/// tokens as `inner`.
#[must_use]
pub fn is_empty(nodes: &mut dyn Nodes<'_>, index: NodeIndex) -> bool {
    !nodes.kids(index).iter().any(Kid::holder)
}

/// The walk under the node at descendant `index` of the tree `nodes`
/// navigates. The walk's start has no edge tokens of its own: they would lie
/// at its bounds.
#[must_use]
pub fn walk(nodes: &mut dyn Nodes<'_>, index: NodeIndex, source: &str) -> Walk {
    struct Frame {
        at_index: u32,
        at: u32,
        bounds: Bounds,
    }
    let mut spans = vec![(0, 0); nodes.kid(index).count as usize];
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
        let local = kid.index.offset_from(index);
        if step == Step::Leave {
            let Some(mut frame) = frames.pop() else { return Visit::Pass };
            let (start, end) = spans[frame.at_index as usize];
            if let Some(token) = hidden(frame.at, end) {
                push(&mut tokens, Some(&mut frame.bounds), &mut folds, token);
            }
            if frame.at_index != 0 {
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
        spans[local as usize] = (start, end);
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
            frames.push(Frame { at_index: local, at: start, bounds: Bounds::default() });
            return Visit::Enter;
        }
        if let Some(frame) = frames.last_mut() {
            frame.at = end;
        }
        Visit::Pass
    });
    tokens.sort_by_key(|token| (token.start, token.end));
    Walk { tokens, entries, folds, spans, base: index }
}

/// Where the assignment puts an entry of a gap.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Place {
    Side(NodeIndex, TriviaSide),
    Unowned,
}

/// A run of whitespace between two tokens or entries that a side takes,
/// with or without a line break, and empty where they touch: its bytes, the
/// side, its owner (`Assigned::Layout`), whether it carries the layout
/// written between the tokens around it, and whether an entry's adjacency
/// spells it (`Table::adjacency`). The file's two edges are none.
///
/// Gaps that only a zero-width token parts (an automatic semicolon, a
/// dedent) are one gap to a render, which writes nothing for the token: the
/// layout written there lands in one of their runs, the first that holds
/// whitespace, else the last, and each other run `carries` none.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct LayoutRun {
    pub start: u32,
    pub end: u32,
    pub node: NodeIndex,
    pub side: TriviaSide,
    pub owner: NodeIndex,
    pub carries: bool,
    pub spelled: bool,
}

impl HeapBytes for LayoutRun {
    fn heap_bytes(&self) -> usize {
        let Self { start: _, end: _, node: _, side: _, owner: _, carries: _, spelled: _ } = self;
        0
    }
}

/// The in-line runs an entry the source fixes in place carries before and
/// after its own bytes, up to the tokens beside it on its line: an
/// `ERROR`'s, since a seam cannot be trusted beside what did not parse, and
/// a line continuation's that has whitespace beside it, whose line ends
/// inside it. A side is empty where the entry touches the text beside it,
/// and `None` where a line break or the file's edge lies between them, or
/// where the run is that of an entry before it.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Adjacency {
    pub before: Option<Span>,
    pub after: Option<Span>,
}

impl Adjacency {
    /// The adjacency of the entry spanning `span` of `source`, as the source
    /// spells it.
    fn of(source: &str, span: Span) -> Self {
        let bytes = source.as_bytes();
        let in_line = |byte: u8| byte == b' ' || byte == b'\t';
        let breaks = |byte: u8| matches!(byte, b'\n' | b'\r');
        let std::ops::Range { start, end } = span.range();
        let mut after = end;
        while after < bytes.len() && in_line(bytes[after]) {
            after += 1;
        }
        let mut before = start;
        while before > 0 && in_line(bytes[before - 1]) {
            before -= 1;
        }
        Self {
            before: (before > 0 && !breaks(bytes[before - 1])).then(|| Span { start: crate::types::narrow(before), end: span.start }),
            after: (after < bytes.len() && !breaks(bytes[after])).then(|| Span { start: span.end, end: crate::types::narrow(after) }),
        }
    }

    /// Whether either side holds whitespace.
    fn holds_whitespace(self) -> bool {
        [self.before, self.after].into_iter().flatten().any(|run| run.start < run.end)
    }
}

impl HeapBytes for Adjacency {
    fn heap_bytes(&self) -> usize {
        let Self { before: _, after: _ } = self;
        0
    }
}
