//! A parsed tree's trivia, assigned once to the sides of its nodes.
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
use crate::types::{KindId, NodeIndex, RunId, Span};
use std::collections::BTreeMap;

mod place;
pub use place::{Lookup, PlacedSides, Placement, Source};

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

/// One token of the walk, by its bytes and the node it is (a leaf) or belongs
/// to (hidden text or a node edge, `own`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Token {
    pub start: u32,
    pub end: u32,
    pub node: NodeIndex,
    pub own: bool,
}

/// An entry the assignment gives a side: an extra or an `ERROR` by its
/// descendant index; a run of whitespace between two tokens or entries, with
/// or without a line break, by its place among the table's runs
/// (`TriviaTable::runs`), its bytes, the descendant index of its owner (the smallest node holding the tokens
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
    /// The depth members of `tree`, found by one walk over every node, the
    /// interiors of extras and `ERROR`s included; none where `kinds` has no
    /// depth member.
    #[must_use]
    pub fn of(tree: &tree_sitter::Tree, kinds: SurfaceKinds) -> Self {
        let mut members = Self::default();
        if !kinds.has_depth_members() {
            return members;
        }
        let mut cursor = tree.walk();
        let mut net = 0;
        loop {
            members.walked += 1;
            let kind = crate::read::grammar_id(&cursor.node());
            if kinds.is_depth_member(kind) {
                net += i32::from(kind == kinds.indent) - i32::from(kind == kinds.dedent);
                members.at.push(crate::read::index_of(&cursor));
                members.net.push(net);
            }
            if cursor.goto_first_child() {
                continue;
            }
            while !cursor.goto_next_sibling() {
                if !cursor.goto_parent() {
                    return members;
                }
            }
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

/// The nodes of a tree by descendant index, as far as the walk reads them.
struct Nodes {
    kind: Vec<KindId>,
    parent: Vec<u32>,
    depth: Vec<u32>,
    start: Vec<u32>,
    end: Vec<u32>,
    holder: Vec<bool>,
    holds: Vec<bool>,
    named: Vec<bool>,
    count: Vec<u32>,
    last: Vec<u32>,
    prev: Vec<u32>,
    steps: std::cell::Cell<u64>,
}

/// The children of one node, from either end: forward by each child's
/// descendant count, back by each child's previous sibling.
struct Children<'n> {
    nodes: &'n Nodes,
    ends: Option<(u32, u32)>,
}

impl<'n> Children<'n> {
    fn of(nodes: &'n Nodes, parent: u32) -> Self {
        let last = nodes.last[parent as usize];
        Children { nodes, ends: (last != NONE).then_some((parent + 1, last)) }
    }
}

impl Iterator for Children<'_> {
    type Item = u32;
    fn next(&mut self) -> Option<u32> {
        let (front, back) = self.ends?;
        self.ends = (front != back).then(|| (front + self.nodes.count[front as usize], back));
        Some(self.nodes.stepped(front))
    }
}

impl DoubleEndedIterator for Children<'_> {
    fn next_back(&mut self) -> Option<u32> {
        let (front, back) = self.ends?;
        self.ends = (front != back).then(|| (front, self.nodes.prev[back as usize]));
        Some(self.nodes.stepped(back))
    }
}

const NONE: u32 = u32::MAX;

/// The walk under one node: its tokens in source order, its entries by
/// descendant index in source order, and what the assignment reads of its
/// nodes, each kept by its index less the walk's start.
pub struct Walk {
    pub tokens: Vec<Token>,
    pub entries: Vec<NodeIndex>,
    /// The bounds the walk folded into the nodes it was inside (`Bounds`):
    /// one for each token it pushed inside a node and one for each node it
    /// left inside another.
    pub folds: u32,
    nodes: Nodes,
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
        let at = index.offset_from(self.base) as usize;
        (self.nodes.start[at], self.nodes.end[at])
    }

    /// Every stretch the depth regions `regions` indent in the walked tree,
    /// as the assignment measures them (`depth_stretches`): sorted by start,
    /// the outer of two that start together first.
    #[must_use]
    pub fn depth_stretches(&self, source: &str, regions: &'static [DepthRegion]) -> Vec<(u32, u32)> {
        depth_stretches(&self.nodes, self.base, source, regions, &self.tokens)
    }
}

fn is_entry(node: &tree_sitter::Node<'_>) -> bool {
    node.is_extra() || node.is_error()
}

/// Whether `node` holds trivia sides: a child holds sides when it is named,
/// not an extra or `ERROR`, and has width. Width is read from the tree here;
/// a built node's child has the width of its rendered text, so a stored
/// automatic semicolon, which renders `"\n"`, has width there.
#[must_use]
pub fn holds_sides(node: &tree_sitter::Node<'_>) -> bool {
    let span = Span::of(node);
    node.is_named() && !is_entry(node) && span.end > span.start
}

/// Whether `node` is empty: no child of it holds sides (`holds_sides`), so
/// the assignment gives it the trivia between its own tokens as `inner`.
#[must_use]
pub fn is_empty(node: &tree_sitter::Node<'_>) -> bool {
    let mut cursor = node.walk();
    let holds = node.children(&mut cursor).any(|child| holds_sides(&child));
    !holds
}

/// The walk under `node`, the node at descendant `index` of its tree. The
/// walk's start has no edge tokens of its own: they would lie at its bounds.
#[must_use]
pub fn walk(node: tree_sitter::Node<'_>, index: NodeIndex, source: &str) -> Walk {
    struct Frame {
        at_index: u32,
        at: u32,
        bounds: Bounds,
    }
    let count = crate::read::descendant_count(&node) as usize;
    let mut nodes = Nodes {
        kind: vec![KindId::BLANK; count],
        parent: vec![NONE; count],
        depth: vec![0; count],
        start: vec![0; count],
        end: vec![0; count],
        holder: vec![false; count],
        holds: vec![false; count],
        named: vec![false; count],
        count: vec![0; count],
        last: vec![NONE; count],
        prev: vec![NONE; count],
        steps: std::cell::Cell::new(0),
    };
    let mut tokens: Vec<Token> = Vec::new();
    let mut entries: Vec<NodeIndex> = Vec::new();
    let mut frames: Vec<Frame> = Vec::new();
    let mut folds = 0;
    let hidden = |owner: u32, from: u32, to: u32| {
        let text = source.get(from as usize..to as usize)?;
        let trimmed = text.trim();
        if trimmed.is_empty() {
            return None;
        }
        let start = from + crate::types::narrow(text.len() - text.trim_start().len());
        Some(Token { start, end: start + crate::types::narrow(trimmed.len()), node: index + owner, own: true })
    };
    let push = |tokens: &mut Vec<Token>, bounds: Option<&mut Bounds>, folds: &mut u32, token: Token| {
        if let Some(bounds) = bounds {
            bounds.widen(token.start, token.end, folds);
        }
        tokens.push(token);
    };
    let mut cursor = node.walk();
    loop {
        let node = cursor.node();
        let local = crate::read::offset_of(&cursor);
        let Span { start, end } = Span::of(&node);
        let i = local as usize;
        nodes.kind[i] = crate::read::grammar_id(&node);
        nodes.start[i] = start;
        nodes.end[i] = end;
        nodes.count[i] = crate::read::descendant_count(&node);
        nodes.named[i] = node.is_named();
        let depth = crate::types::narrow(frames.len());
        if let Some(frame) = frames.last_mut() {
            nodes.parent[i] = frame.at_index;
            nodes.depth[i] = depth;
            nodes.prev[i] = nodes.last[frame.at_index as usize];
            nodes.last[frame.at_index as usize] = local;
            if let Some(token) = hidden(frame.at_index, frame.at, start) {
                push(&mut tokens, Some(&mut frame.bounds), &mut folds, token);
            }
        }
        let entry = is_entry(&node);
        nodes.holder[i] = holds_sides(&node);
        if nodes.holder[i] && nodes.parent[i] != NONE {
            nodes.holds[nodes.parent[i] as usize] = true;
        }
        if entry {
            entries.push(index + local);
        } else if node.child_count() == 0 {
            push(&mut tokens, frames.last_mut().map(|frame| &mut frame.bounds), &mut folds, Token { start, end, node: index + local, own: false });
        } else {
            frames.push(Frame { at_index: local, at: start, bounds: Bounds::default() });
            cursor.goto_first_child();
            continue;
        }
        if let Some(frame) = frames.last_mut() {
            frame.at = end;
        }
        loop {
            if !frames.is_empty() && cursor.goto_next_sibling() {
                break;
            }
            let Some(mut frame) = frames.pop() else {
                tokens.sort_by_key(|token| (token.start, token.end));
                return Walk { tokens, entries, folds, nodes, base: index };
            };
            cursor.goto_parent();
            let (start, end) = (nodes.start[frame.at_index as usize], nodes.end[frame.at_index as usize]);
            if let Some(token) = hidden(frame.at_index, frame.at, end) {
                push(&mut tokens, Some(&mut frame.bounds), &mut folds, token);
            }
            if frame.at_index != 0 {
                if let Some((first, last)) = frame.bounds.0 {
                    if start < first {
                        push(&mut tokens, Some(&mut frame.bounds), &mut folds, Token { start, end: start, node: index + frame.at_index, own: true });
                    }
                    if end > last {
                        push(&mut tokens, Some(&mut frame.bounds), &mut folds, Token { start: end, end, node: index + frame.at_index, own: true });
                    }
                }
            }
            if let Some(parent) = frames.last_mut() {
                parent.at = end;
                if let Some((first, last)) = frame.bounds.0 {
                    parent.bounds.widen(first, last, &mut folds);
                }
            }
        }
    }
}

/// The tokens under the node at `index` of `tree`, in source order
/// (`TriviaTable`'s walk, from that node).
#[must_use]
pub fn tokens(tree: &tree_sitter::Tree, source: &str, index: NodeIndex) -> Vec<Token> {
    let mut cursor = tree.walk();
    crate::read::goto(&mut cursor, index);
    walk(cursor.node(), index, source).tokens
}

impl Nodes {
    fn stepped(&self, child: u32) -> u32 {
        self.steps.set(self.steps.get() + 1);
        child
    }

    fn common(&self, mut a: u32, mut b: u32) -> u32 {
        while self.depth[a as usize] > self.depth[b as usize] {
            a = self.parent[a as usize];
        }
        while self.depth[b as usize] > self.depth[a as usize] {
            b = self.parent[b as usize];
        }
        while a != b {
            a = self.parent[a as usize];
            b = self.parent[b as usize];
        }
        a
    }

    /// The node beside a gap that takes its side, below `owner` on `node`'s
    /// chain of parents: the holder child at the gap's edge (`at_edge`), on
    /// its `side`, or, when `kinds` passes through lists, the item each list
    /// from it passes that side to (`edge_item`).
    fn side_holder(&self, owner: u32, node: u32, kinds: Option<SurfaceKinds>, side: TriviaSide, at_edge: impl Fn(u32) -> bool) -> Option<u32> {
        let mut child = self.holder_below(owner, node).filter(|&child| at_edge(child))?;
        if let Some(kinds) = kinds {
            while let Some(inner) = self.edge_item(child, side, kinds) {
                child = inner;
            }
        }
        Some(child)
    }

    /// The item a list node passes the extras and `ERROR`s of its `side` to:
    /// its first (leading) or last (trailing) holder child, when that child
    /// lies at the list's edge and is not a unit kind; `None` for any other
    /// node.
    fn edge_item(&self, list: u32, side: TriviaSide, kinds: SurfaceKinds) -> Option<u32> {
        if !kinds.lists.contains(&self.kind[list as usize]) {
            return None;
        }
        let mut items = self.holders(list);
        let item = if side == TriviaSide::Leading { items.next() } else { items.next_back() }?;
        let at_edge = if side == TriviaSide::Leading { self.start[item as usize] == self.start[list as usize] } else { self.end[item as usize] == self.end[list as usize] };
        (at_edge && !kinds.units.contains(&self.kind[item as usize])).then_some(item)
    }

    /// Where the excess `owner`'s runs change is restored: the trailing side
    /// of its last child that holds trivia, passing through list children
    /// as `side_holder` does, or its `inner` side when no child holds any.
    fn restore_side(&self, owner: u32, kinds: SurfaceKinds) -> (u32, TriviaSide) {
        match self.holders(owner).next_back() {
            Some(child) => (self.through_lists(child, TriviaSide::Trailing, kinds), TriviaSide::Trailing),
            None => (owner, TriviaSide::Inner),
        }
    }

    /// Where an entry goes when no holder child of `owner` is beside its gap,
    /// from byte `from` to byte `to`: the leading side of the first holder
    /// child after the gap, else the trailing side of the last before it,
    /// passing through list children as `restore_side` does; the owner's
    /// `inner` side when it has no holder child.
    fn nearest_side(&self, owner: u32, from: u32, to: u32, kinds: SurfaceKinds) -> (u32, TriviaSide) {
        let after = self.holders(owner).find(|&child| self.start[child as usize] >= to);
        let before = || self.holders(owner).rev().find(|&child| self.end[child as usize] <= from);
        match after.map(|child| (child, TriviaSide::Leading)).or_else(|| before().map(|child| (child, TriviaSide::Trailing))) {
            Some((child, side)) => (self.through_lists(child, side, kinds), side),
            None => (owner, TriviaSide::Inner),
        }
    }

    /// The children of `parent` that hold trivia, in source order.
    fn holders(&self, parent: u32) -> impl DoubleEndedIterator<Item = u32> + '_ {
        Children::of(self, parent).filter(move |&at| self.holder[at as usize])
    }

    /// `child`, or, while it is a list node, its first (for a `Leading`
    /// side) or last item that holds trivia and is not a unit kind.
    fn through_lists(&self, mut child: u32, side: TriviaSide, kinds: SurfaceKinds) -> u32 {
        while kinds.lists.contains(&self.kind[child as usize]) {
            let mut items = self.holders(child).filter(|&at| !kinds.units.contains(&self.kind[at as usize]));
            let item = if side == TriviaSide::Leading { items.next() } else { items.next_back() };
            match item {
                Some(inner) => child = inner,
                None => break,
            }
        }
        child
    }

    /// The child of `owner` on `node`'s chain of parents, when it holds trivia.
    fn holder_below(&self, owner: u32, node: u32) -> Option<u32> {
        let mut at = node;
        while at != NONE {
            let up = self.parent[at as usize];
            if up == owner {
                return self.holder[at as usize].then_some(at);
            }
            at = up;
        }
        None
    }
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
/// spells it (`TriviaTable::adjacency`). The file's two edges are none.
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

/// The trivia of a parsed tree, assigned once to its nodes' sides.
#[derive(Debug, Default)]
pub struct TriviaTable {
    sides: BTreeMap<(NodeIndex, TriviaSide), Vec<Assigned>>,
    edge_items: BTreeMap<(NodeIndex, TriviaSide), NodeIndex>,
    unowned: Vec<NodeIndex>,
    runs: Vec<LayoutRun>,
    adjacency: BTreeMap<NodeIndex, Adjacency>,
    /// The heap the table holds, walked once it is assigned: an assigned
    /// table never changes.
    heap: usize,
    steps: u64,
    stretch_steps: u64,
}

impl TriviaTable {
    fn walked(&self) -> usize {
        let Self { sides, edge_items, unowned, runs, adjacency, heap: _, steps: _, stretch_steps: _ } = self;
        sides.heap_bytes() + edge_items.heap_bytes() + unowned.heap_bytes() + runs.heap_bytes() + adjacency.heap_bytes()
    }
}

impl HeapBytes for TriviaTable {
    fn heap_bytes(&self) -> usize {
        self.heap
    }
}

impl TriviaTable {
    /// The table of `tree`, parsed from `source`, whose grammar's surface
    /// kinds are `kinds` and whose indentation level is `unit` spaces wide.
    #[must_use]
    pub fn assign(tree: &tree_sitter::Tree, source: &str, kinds: SurfaceKinds, unit: u32) -> Self {
        let Walk { tokens, entries, folds: _, nodes, base } = walk(tree.root_node(), NodeIndex::ROOT, source);
        let local = |index: NodeIndex| index.offset_from(base);
        let global = |at: u32| base + at;
        let lines = crate::points::LineTable::new(source);
        let row = |byte: u32| lines.point(byte).map_or(0, |point| point.row);
        let mut table = TriviaTable::default();
        for list in (0..crate::types::narrow(nodes.kind.len())).filter(|&at| nodes.holder[at as usize]) {
            for side in [TriviaSide::Leading, TriviaSide::Trailing] {
                if let Some(item) = nodes.edge_item(list, side, kinds) {
                    table.edge_items.insert((global(list), side), global(item));
                }
            }
        }
        let mut taken: Option<Span> = None;
        for &index in &entries {
            let at = local(index) as usize;
            let span = Span { start: nodes.start[at], end: nodes.end[at] };
            let carried = taken.take().filter(|run| run.end == span.start);
            let spelled = Adjacency::of(source, span);
            let adjacency = Adjacency { before: carried.or(spelled.before), ..spelled };
            if nodes.kind[at] == KindId::ERROR || (kinds.layout.contains(&nodes.kind[at]) && adjacency.holds_whitespace()) {
                taken = adjacency.after;
                table.adjacency.insert(index, if carried.is_some() { Adjacency { before: None, ..adjacency } } else { adjacency });
            }
        }
        let mut spelled: Vec<Span> = table.adjacency.values().flat_map(|adjacency| [adjacency.before, adjacency.after]).flatten().collect();
        spelled.sort_unstable_by_key(|run| (run.start, run.end));
        let spelled = |start: u32, end: u32| spelled[..spelled.partition_point(|run| run.start <= start)].iter().rev().take(2).any(|run| end <= run.end);
        let mut structure = Structure::new(&nodes, base, source, kinds.depth, &tokens, &lines, unit);
        let mut excess = Excess::default();
        let owner_of = |left: Option<&Token>, right: Option<&Token>| match (left, right) {
            (Some(left), Some(right)) => nodes.common(local(left.node), local(right.node)),
            _ => 0,
        };
        let place = |left: Option<&Token>, right: Option<&Token>, starts_on_left_row: bool, through: Option<SurfaceKinds>| -> Place {
            let owner = owner_of(left, right);
            if !nodes.holds[owner as usize] {
                return Place::Side(global(owner), TriviaSide::Inner);
            }
            let before = left.and_then(|left| nodes.side_holder(owner, local(left.node), through, TriviaSide::Trailing, |child| nodes.end[child as usize] == left.end));
            let after = right.and_then(|right| nodes.side_holder(owner, local(right.node), through, TriviaSide::Leading, |child| nodes.start[child as usize] == right.start));
            match (before, after) {
                (None, None) => match through {
                    Some(kinds) => {
                        let (node, side) = nodes.nearest_side(owner, left.map_or(0, |left| left.end), right.map_or(u32::MAX, |right| right.start), kinds);
                        Place::Side(global(node), side)
                    }
                    None => Place::Unowned,
                },
                (Some(before), None) => Place::Side(global(before), TriviaSide::Trailing),
                (None, Some(after)) => Place::Side(global(after), TriviaSide::Leading),
                (Some(before), Some(after)) => {
                    if starts_on_left_row {
                        Place::Side(global(before), TriviaSide::Trailing)
                    } else {
                        Place::Side(global(after), TriviaSide::Leading)
                    }
                }
            }
        };
        let mut next = entries.iter().peekable();
        let mut parted = Parted::default();
        for k in 0..=tokens.len() {
            let left = k.checked_sub(1).map(|k| &tokens[k]);
            let right = tokens.get(k);
            let from = left.map_or(0, |token| token.end);
            let to = right.map_or(crate::types::narrow(source.len()), |token| token.start);
            let left_row = left.map(|token| row(token.end));
            excess.close_until(from, &mut table);
            let mut at = from;
            let mut run = |at: u32, until: u32, beside: Option<Place>, table: &mut TriviaTable, excess: &mut Excess| {
                let Some(text) = source.get(at as usize..until as usize) else { return };
                let place = beside.unwrap_or_else(|| place(left, right, false, None));
                let owner = match place {
                    Place::Side(node, TriviaSide::Inner) => local(node),
                    Place::Side(_, _) | Place::Unowned => owner_of(left, right),
                };
                let edge = at == 0 || until as usize == source.len();
                let depth = if text.contains('\n') {
                    let reach = structure.excess(until, text.rsplit('\n').next().unwrap_or_default());
                    excess.change(owner, nodes.end[owner as usize], reach, || {
                        let (node, side) = nodes.restore_side(owner, kinds);
                        (global(node), side)
                    })
                } else {
                    0
                };
                match place {
                    Place::Side(node, side) if !edge => {
                        let joined = at == from && left.is_some_and(|left| left.start == left.end) && table.runs.last().is_some_and(|run| run.end == at);
                        let run = RunId(crate::types::narrow(table.runs.len()));
                        table.runs.push(LayoutRun { start: at, end: until, node, side, owner: global(owner), carries: true, spelled: spelled(at, until) });
                        parted.placed(&mut table.runs, joined);
                        table.push(place, Assigned::Layout { run, start: at, end: until, owner: global(owner), depth });
                    }
                    _ if depth != 0 => table.push(place, Assigned::Depth(depth)),
                    _ => {}
                }
            };
            let mut gap = Vec::new();
            while let Some(&&index) = next.peek() {
                let (start, end) = (nodes.start[local(index) as usize], nodes.end[local(index) as usize]);
                if start >= to && !(start == to && right.is_some_and(|right| right.start == right.end && right.start == start && start < end)) {
                    break;
                }
                next.next();
                let placed = (!kinds.layout.contains(&nodes.kind[local(index) as usize])).then(|| place(left, right, left_row == Some(row(start)), Some(kinds)));
                gap.push((index, start, end, placed));
            }
            let trailed = gap.iter().rposition(|&(.., placed)| matches!(placed, Some(Place::Side(_, TriviaSide::Trailing))));
            let moved = trailed.and_then(|last| gap[last].3).filter(|&side| side != place(left, right, false, None));
            let held = excess.current;
            let mut led = None;
            for (i, &(index, start, end, placed)) in gap.iter().enumerate() {
                let beside = trailed.filter(|&last| i <= last).map_or(led, |last| gap[last].3);
                run(at, start, beside, &mut table, &mut excess);
                match placed {
                    None => table.push(beside.unwrap_or_else(|| place(left, right, false, None)), Assigned::Member(index)),
                    Some(placed) => {
                        let entry = if nodes.kind[local(index) as usize] == KindId::ERROR { Assigned::Error(index) } else { Assigned::Extra(index) };
                        led = matches!(placed, Place::Side(_, TriviaSide::Leading)).then_some(placed);
                        table.push(placed, entry);
                    }
                }
                if let Some(side) = moved.filter(|_| trailed == Some(i)) {
                    let depth = excess.reset(held);
                    if depth != 0 {
                        table.push(side, Assigned::Depth(depth));
                    }
                }
                at = end;
            }
            run(at, to, led, &mut table, &mut excess);
        }
        parted.finish(&mut table.runs);
        excess.close_until(u32::MAX, &mut table);
        table.heap = table.walked();
        table.steps = nodes.steps.get();
        table.stretch_steps = structure.steps;
        table
    }

    /// The children the assignment stepped through to find the nodes beside
    /// each gap and at each list's edges that take trivia.
    #[must_use]
    pub fn steps(&self) -> u64 {
        self.steps
    }

    /// The steps the assignment took to measure the structural indentation
    /// of each line a run breaks to: each depth stretch it opened and
    /// closed, and each byte it read of the lines the stretches' first
    /// tokens lie on (`Structure::line_blanks`).
    #[must_use]
    pub fn stretch_steps(&self) -> u64 {
        self.stretch_steps
    }

    fn push(&mut self, place: Place, entry: Assigned) {
        match place {
            Place::Side(node, side) => self.sides.entry((node, side)).or_default().push(entry),
            Place::Unowned => {
                if let Assigned::Extra(index) | Assigned::Error(index) | Assigned::Member(index) = entry {
                    self.unowned.push(index);
                }
            }
        }
    }

    /// The item the list node at `index` passes the extras and `ERROR`s of
    /// its `side` to, so a coordinate of the list frames with that item's
    /// side too; `None` for a node that is no list or passes none.
    #[must_use]
    pub fn edge_item(&self, index: NodeIndex, side: TriviaSide) -> Option<NodeIndex> {
        self.edge_items.get(&(index, side)).copied()
    }

    /// The adjacency of the entry at `index` when the source fixes it in
    /// place (`Adjacency`): an `ERROR`'s always, a line continuation's when
    /// whitespace lies beside it.
    #[must_use]
    pub fn adjacency(&self, index: NodeIndex) -> Option<Adjacency> {
        self.adjacency.get(&index).copied()
    }

    /// The entries the assignment gives `side` of the node at `index`, in source order.
    pub fn side(&self, index: NodeIndex, side: TriviaSide) -> &[Assigned] {
        self.sides.get(&(index, side)).map_or(&[], Vec::as_slice)
    }

    /// The layout members no side takes: between two of their owner's own
    /// tokens, with no named child beside them.
    #[must_use]
    pub fn unowned(&self) -> &[NodeIndex] {
        &self.unowned
    }

    /// Every run of whitespace a side takes, in source order (`LayoutRun`).
    #[must_use]
    pub fn runs(&self) -> &[LayoutRun] {
        &self.runs
    }

    /// The run `id` names.
    #[must_use]
    pub fn run(&self, id: RunId) -> LayoutRun {
        self.runs[id.index()]
    }

    /// Every run's id, in source order.
    pub fn run_ids(&self) -> impl Iterator<Item = RunId> {
        (0..crate::types::narrow(self.runs.len())).map(RunId)
    }
}

/// The runs only zero-width tokens part from one another, as the
/// assignment places them (`LayoutRun::carries`): where the group so far
/// begins among the table's runs.
#[derive(Default)]
struct Parted {
    from: usize,
}

impl Parted {
    /// The run just placed, the last of `runs`, joins the group when only a
    /// zero-width token parts it from the run before it (`joined`), whatever
    /// follows it in its own gap; otherwise the group before it settles and
    /// it begins the next.
    fn placed(&mut self, runs: &mut [LayoutRun], joined: bool) {
        let last = runs.len() - 1;
        if !joined {
            Self::settle(&mut runs[self.from..last]);
            self.from = last;
        }
    }

    /// The last group settles.
    fn finish(&mut self, runs: &mut [LayoutRun]) {
        Self::settle(&mut runs[self.from..]);
    }

    /// A group of more than one run settles: all but its first run holding
    /// whitespace, else its last, carry none.
    fn settle(group: &mut [LayoutRun]) {
        if group.len() < 2 {
            return;
        }
        let carrier = group.iter().position(|run| run.start < run.end).unwrap_or(group.len() - 1);
        for (at, run) in group.iter_mut().enumerate() {
            run.carries = at == carrier;
        }
    }
}

/// The structural indentation of a tree: the stretches its kinds' templates
/// indent (`depth_stretches`), and, measured in source order, the ones
/// holding the last byte measured, outermost first, each with its width;
/// and how far the line the last stretch's first token lies on is blank.
struct Structure<'t> {
    source: &'t str,
    tokens: &'t [Token],
    lines: &'t crate::points::LineTable,
    unit: u32,
    stretches: Vec<(u32, u32)>,
    next: usize,
    open: Vec<(u32, i64)>,
    measured: u32,
    line: Option<LineScan>,
    steps: u64,
}

/// How far a line is blank from its start (`Structure::line_blanks`): its
/// first byte, the first byte not yet read, the blanks' width up to it, and
/// whether that byte was read and is not blank.
#[derive(Clone, Copy)]
struct LineScan {
    start: u32,
    at: u32,
    width: i64,
    blocked: bool,
}

impl<'t> Structure<'t> {
    fn new(nodes: &Nodes, base: NodeIndex, source: &'t str, regions: &'static [DepthRegion], tokens: &'t [Token], lines: &'t crate::points::LineTable, unit: u32) -> Self {
        let stretches = depth_stretches(nodes, base, source, regions, tokens);
        Self { source, tokens, lines, unit: unit.max(1), stretches, next: 0, open: Vec::new(), measured: 0, line: None, steps: 0 }
    }

    /// The columns a blank byte indents by: a space's one, a tab's `unit`;
    /// none for any other byte.
    fn blank(&self, byte: u8) -> Option<i64> {
        match byte {
            b' ' => Some(1),
            b'\t' => Some(i64::from(self.unit)),
            _ => None,
        }
    }

    /// The width of `indentation`: its spaces, and `unit` per tab.
    fn width(&self, indentation: &str) -> i64 {
        indentation.bytes().filter_map(|byte| self.blank(byte)).sum()
    }

    /// The excess of a line indented by `indentation` whose first token
    /// starts at byte `at`, at or past the byte the last call measured.
    fn excess(&mut self, at: u32, indentation: &str) -> i32 {
        let unit = i64::from(self.unit);
        let reach = self.width(indentation) - self.structural(at);
        i32::try_from(reach.div_euclid(unit)).unwrap_or(0)
    }

    /// The structural indentation width at byte `at`: the innermost
    /// stretch's holding it, none when no stretch does. The stretches
    /// holding a byte nest, so those holding `at` are the ones the last
    /// byte measured left open that still hold it, then the ones that
    /// opened since; each is measured once, as it opens.
    fn structural(&mut self, at: u32) -> i64 {
        debug_assert!(at >= self.measured, "the structure is measured in source order: {at} after {}", self.measured);
        self.measured = at;
        while self.open.last().is_some_and(|&(close, _)| close <= at) {
            self.steps += 1;
            self.open.pop();
        }
        while let Some(&(open, close)) = self.stretches.get(self.next).filter(|&&(open, _)| open <= at) {
            self.steps += 1;
            self.next += 1;
            if close > at {
                debug_assert!(self.open.last().is_none_or(|&(outer, _)| close <= outer), "the depth stretch {open}..{close} crosses the end of the one holding it");
                let around = self.open.last().map_or(0, |&(_, width)| width);
                let width = self.opened(open, close, around);
                self.open.push((close, width));
            }
        }
        self.open.last().map_or(0, |&(_, width)| width)
    }

    /// The width of the stretch from `open` to `close` inside one of width
    /// `around`: set by the line of its first token, or one unit past
    /// `around` when that token does not start its line or the stretch
    /// holds none.
    fn opened(&mut self, open: u32, close: u32, around: i64) -> i64 {
        let first = self.tokens.partition_point(|token| token.start < open);
        let Some(start) = self.tokens.get(first).map(|token| token.start).filter(|&start| start < close) else { return around + i64::from(self.unit) };
        self.line_blanks(start).unwrap_or(around + i64::from(self.unit))
    }

    /// The width of the blanks from the start of the line holding byte `at`
    /// to `at`, or none when a byte that is not blank lies between. The
    /// stretches open in source order, so their first tokens are asked in
    /// order, and a line's bytes are read forward from where the last ask on
    /// it stopped, each at most once.
    fn line_blanks(&mut self, at: u32) -> Option<i64> {
        let start = self.lines.point(at).map_or(0, |point| at - point.column);
        let mut line = self.line.filter(|line| line.start == start).unwrap_or(LineScan { start, at: start, width: 0, blocked: false });
        debug_assert!(at >= line.at, "a line's blanks are read in source order: {at} after {}", line.at);
        while !line.blocked && line.at < at {
            self.steps += 1;
            match self.blank(self.source.as_bytes()[line.at as usize]) {
                Some(width) => {
                    line.width += width;
                    line.at += 1;
                }
                None => line.blocked = true,
            }
        }
        self.line = Some(line);
        (line.at == at).then_some(line.width)
    }
}

/// Every stretch the depth regions of a walked tree indent, sorted by its
/// start, the outer of two that start together first: per node of a
/// region's kind, from after its `open` anchor (its start, or the end of
/// its literal child) to before its `close` anchor (its end, or the start
/// of its literal child). A region whose literal the node lacks indents
/// nothing.
fn depth_stretches(nodes: &Nodes, base: NodeIndex, source: &str, regions: &'static [DepthRegion], tokens: &[Token]) -> Vec<(u32, u32)> {
    if regions.is_empty() {
        return Vec::new();
    }
    let indents = |at: usize| regions.iter().any(|region| region.kind == nodes.kind[at]);
    let mut literals: BTreeMap<u32, Vec<(u32, u32, &str)>> = BTreeMap::new();
    for token in tokens.iter().filter(|token| !token.own) {
        let leaf = token.node.offset_from(base) as usize;
        let parent = nodes.parent[leaf];
        if !nodes.named[leaf] && parent != NONE && indents(parent as usize) {
            if let Some(text) = source.get(token.start as usize..token.end as usize) {
                literals.entry(parent).or_default().push((token.start, token.end, text));
            }
        }
    }
    let mut stretches: Vec<(u32, u32)> = (0..crate::types::narrow(nodes.kind.len()))
        .filter(|&at| indents(at as usize))
        .flat_map(|at| {
            let literals = literals.get(&at).map_or(&[][..], Vec::as_slice);
            let (start, end, kind) = (nodes.start[at as usize], nodes.end[at as usize], nodes.kind[at as usize]);
            regions.iter().filter(move |region| region.kind == kind).filter_map(move |region| {
                let open = match region.open {
                    DepthAnchor::Start => start + 1,
                    DepthAnchor::After(texts) => literals.iter().find(|(_, _, text)| texts.contains(text))?.1,
                    DepthAnchor::End | DepthAnchor::Before(_) => return None,
                };
                let close = match region.close {
                    DepthAnchor::End => end,
                    DepthAnchor::Before(texts) => literals.iter().rev().find(|(_, _, text)| texts.contains(text))?.0,
                    DepthAnchor::Start | DepthAnchor::After(_) => return None,
                };
                Some((open, close))
            })
        })
        .collect();
    stretches.sort_unstable_by_key(|&(open, close)| (open, std::cmp::Reverse(close)));
    stretches
}

/// The running excess of an assignment, in source order, and the owners
/// whose runs changed it, innermost last, each with where it ends, the
/// excess it restores there and the side that takes the restore.
#[derive(Default)]
struct Excess {
    current: i32,
    open: Vec<OpenOwner>,
}

struct OpenOwner {
    owner: u32,
    end: u32,
    restore: i32,
    side: (NodeIndex, TriviaSide),
}

impl Excess {
    /// A run of `owner` (ending at `end`) at `excess`: the change from the
    /// running excess, which the owner restores at its end.
    fn change(&mut self, owner: u32, end: u32, excess: i32, side: impl FnOnce() -> (NodeIndex, TriviaSide)) -> i32 {
        let depth = excess - self.current;
        if depth != 0 && self.open.last().is_none_or(|open| open.owner != owner) {
            self.open.push(OpenOwner { owner, end, restore: self.current, side: side() });
        }
        self.current = excess;
        depth
    }

    /// The change from the running excess back to `excess`, which it
    /// becomes: what restores the excess at the end of a side whose frame
    /// closes before the rest of its gap renders.
    fn reset(&mut self, excess: i32) -> i32 {
        let depth = excess - self.current;
        self.current = excess;
        depth
    }

    /// Restore the excess of each owner that ends by byte `at`.
    fn close_until(&mut self, at: u32, table: &mut TriviaTable) {
        while let Some(open) = self.open.pop_if(|open| open.end <= at) {
            let depth = open.restore - self.current;
            if depth != 0 {
                table.sides.entry(open.side).or_default().push(Assigned::Depth(depth));
            }
            self.current = open.restore;
        }
    }
}
