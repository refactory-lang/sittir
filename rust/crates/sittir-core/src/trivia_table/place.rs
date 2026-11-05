//! A parsed tree's trivia placed a region at a time, on the first read of a
//! side the region holds: the assignment `TriviaTable::assign` makes, read
//! from the nodes around each gap instead of from a walk of the whole tree.
//!
//! Every node but the root begins and ends on a token of the walk, its edge
//! tokens included, so a gap's owner, the smallest node holding both its
//! tokens, finds the gap between two of its segments: a child's tokens, a
//! leaf, its hidden text or an edge token (`Shape`). A region is a node that
//! is no list, or the root, with every list below it through lists: its
//! owners' gaps write only the leading and trailing sides of its owners'
//! children and its owners' own `inner` sides, and every write of those
//! sides comes from them (`Placer::top_of`).
//!
//! An owner's runs measure their excess from where the gap before its first
//! token left it, and nothing below the owner moves it between two of the
//! owner's gaps: each owner below ends, restoring its excess, before the
//! next one. A region's writes go in the order the whole-tree assignment
//! makes them: by the byte their gap starts at, the restores of the owners
//! ending there first, innermost first, then each gap by its left token.
//!
//! A placement finds the nodes it reads through the reader that asks it,
//! from the nodes it has read before: each node of a shape it builds knows
//! its parent, so a read of a side next to one already placed costs the
//! nodes around it, not the path from the root.

use super::{holds_sides, is_entry, Adjacency, Assigned, DepthAnchor, LayoutRun, Place, SurfaceKinds, TriviaSide};
use crate::heap::{CountedMap, HeapBytes, ARC_COUNTS};
use crate::points::LineTable;
use crate::types::{narrow, KindId, NodeIndex, RunId, Span};
use std::collections::{BTreeMap, HashMap};
use std::sync::{Arc, Mutex, PoisonError};

/// Where a token falls in the walk's order: by its bytes, then as the walk
/// pushes it, so the tokens at one byte keep the walk's order. A leaf goes
/// as the walk visits it, hidden text as it visits the child after it, and
/// a node's edge tokens and last hidden text as it leaves the node, the
/// inner of two nodes it leaves at once first.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
struct Key {
    start: u32,
    end: u32,
    visit: u32,
    leaf: bool,
    leave: u32,
    edge: u8,
}

impl Key {
    fn leaf(start: u32, end: u32, index: NodeIndex) -> Self {
        Self { start, end, visit: index.get(), leaf: true, leave: 0, edge: 0 }
    }

    fn before(start: u32, end: u32, kid: NodeIndex) -> Self {
        Self { start, end, visit: kid.get(), leaf: false, leave: u32::MAX, edge: 0 }
    }

    fn leave(start: u32, end: u32, node: &Kid, edge: u8) -> Self {
        Self { start, end, visit: node.index.get() + node.count, leaf: false, leave: u32::MAX - node.index.get(), edge }
    }
}

/// A token of the walk, by its bytes and its place in the walk's order.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct Tok {
    start: u32,
    end: u32,
    key: Key,
}

impl Tok {
    fn zero(self) -> bool {
        self.start == self.end
    }

    fn leaf(kid: &Kid) -> Self {
        Self { start: kid.start, end: kid.end, key: Key::leaf(kid.start, kid.end, kid.index) }
    }

    fn start_edge(kid: &Kid) -> Self {
        Self { start: kid.start, end: kid.start, key: Key::leave(kid.start, kid.start, kid, 1) }
    }

    fn end_edge(kid: &Kid) -> Self {
        Self { start: kid.end, end: kid.end, key: Key::leave(kid.end, kid.end, kid, 2) }
    }
}

/// What the placement reads of a node.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct Kid {
    index: NodeIndex,
    start: u32,
    end: u32,
    count: u32,
    kind: KindId,
    named: bool,
    entry: bool,
    leaf: bool,
    holder: bool,
}

impl Kid {
    fn of(node: &tree_sitter::Node<'_>, index: NodeIndex) -> Self {
        let Span { start, end } = Span::of(node);
        let entry = is_entry(node);
        Self {
            index,
            start,
            end,
            count: crate::read::descendant_count(node),
            kind: crate::read::grammar_id(node),
            named: node.is_named(),
            entry,
            leaf: !entry && node.child_count() == 0,
            holder: holds_sides(node),
        }
    }

    fn holds(&self, byte: u32) -> bool {
        self.start <= byte && byte < self.end
    }
}

/// The text the walk leaves between `from` and `to` when it holds any but
/// whitespace: a hidden token, trimmed.
fn hidden(source: &str, from: u32, to: u32, key: impl FnOnce(u32, u32) -> Key) -> Option<Tok> {
    let text = source.get(from as usize..to as usize)?;
    let trimmed = text.trim();
    if trimmed.is_empty() {
        return None;
    }
    let start = from + narrow(text.len() - text.trim_start().len());
    let end = start + narrow(trimmed.len());
    Some(Tok { start, end, key: key(start, end) })
}

/// A run of a node's tokens no gap of the node parts: a child's tokens, a
/// leaf child, or a token of the node's own, by the kid it is, if any.
#[derive(Debug, Clone, Copy)]
struct Segment {
    first: Tok,
    last: Tok,
    kid: Option<usize>,
}

/// A node as the owner of its gaps: its children, its segments, and the
/// entries that lie between its segments, its own and those of its
/// children that hold no token, in the walk's order.
#[derive(Debug)]
struct Shape {
    node: Kid,
    root: bool,
    kids: Arc<[Kid]>,
    holds: bool,
    segments: Vec<Segment>,
    entries: Vec<Kid>,
}

impl Shape {
    /// The node's gaps, each by the segment after it: the root's include
    /// the file's two edges.
    fn gaps(&self) -> std::ops::Range<usize> {
        if self.root {
            0..self.segments.len() + 1
        } else {
            1..self.segments.len().max(1)
        }
    }

    fn left(&self, gap: usize) -> Option<Tok> {
        gap.checked_sub(1).map(|at| self.segments[at].last)
    }

    fn right(&self, gap: usize) -> Option<Tok> {
        self.segments.get(gap).map(|segment| segment.first)
    }

    /// The child the segment at `at` is when that child holds tokens of its
    /// own below it.
    fn block(&self, at: usize) -> Option<Kid> {
        self.segments.get(at)?.kid.map(|kid| self.kids[kid]).filter(|kid| !kid.leaf)
    }

    fn holders(&self) -> impl DoubleEndedIterator<Item = &Kid> + '_ {
        self.kids.iter().filter(|kid| kid.holder)
    }
}

/// One step of a gap, as the assignment takes them: a run of whitespace up
/// to an entry or the gap's end, an entry, or the reset of the excess after
/// the last entry a side before the gap trails.
#[derive(Debug, Clone, Copy)]
enum Step {
    Run { at: u32, until: u32, place: Place, depth: i32 },
    Entry { place: Place, entry: Assigned },
    Reset { place: Place, depth: i32 },
}

/// The steps of one gap.
#[derive(Debug, Clone)]
struct Plan {
    from: u32,
    to: u32,
    left: Option<Tok>,
    steps: Vec<Step>,
}

/// A gap by its owner and the segment after it.
type Gap = (NodeIndex, usize);

/// The order of the assignment's writes: the byte the gap starts at, the
/// restores at it before the gaps, then the gap's left token and the step.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
struct Order {
    from: u32,
    gap: bool,
    left: Option<Key>,
    step: u32,
}

/// A run the placement pushed: its gap and step, and its bytes.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct Pushed {
    gap: Gap,
    step: usize,
    at: u32,
    until: u32,
}

/// One level of structural indentation a stretch opens, and its width.
#[derive(Debug, Clone, Copy)]
struct Stretch {
    open: u32,
    close: u32,
    width: i64,
}

/// The depth stretches a node's template opens, sorted by start, the outer
/// of two that start together first, and the nearest node above it that
/// opens any.
#[derive(Debug)]
struct Level {
    own: Vec<Stretch>,
    up: Option<NodeIndex>,
}

/// The excess after each gap of an owner.
#[derive(Debug)]
struct Sim {
    after: Vec<i32>,
}

/// A run a side takes, with where its source text starts (`run_from`).
#[derive(Debug, Clone, Copy)]
struct Placed {
    run: LayoutRun,
    from: u32,
}

#[derive(Debug, Default)]
struct State {
    shapes: CountedMap<NodeIndex, Arc<Shape>>,
    parent: CountedMap<NodeIndex, NodeIndex>,
    positions: CountedMap<NodeIndex, usize>,
    firsts: CountedMap<NodeIndex, Option<Tok>>,
    lasts: CountedMap<NodeIndex, Option<Tok>>,
    befores: CountedMap<NodeIndex, Option<Gap>>,
    afters: CountedMap<NodeIndex, Option<Gap>>,
    first_gaps: CountedMap<NodeIndex, Option<Gap>>,
    last_gaps: CountedMap<NodeIndex, Option<Gap>>,
    sims: CountedMap<NodeIndex, Arc<Sim>>,
    levels: CountedMap<NodeIndex, Option<NodeIndex>>,
    stretches: CountedMap<NodeIndex, Level>,
    blanks: CountedMap<u32, u32>,
    wide: CountedMap<u32, Option<Kid>>,
    ending: CountedMap<u32, Option<Kid>>,
    adjacency: CountedMap<NodeIndex, Option<Adjacency>>,
    placed: CountedMap<NodeIndex>,
    members: CountedMap<NodeIndex>,
    framed: CountedMap<NodeIndex>,
    settled: CountedMap<(NodeIndex, TriviaSide)>,
    sides: BTreeMap<(NodeIndex, TriviaSide), Vec<Assigned>>,
    unowned: BTreeMap<Order, NodeIndex>,
    runs: Vec<Placed>,
    order: BTreeMap<(u32, u32, Order), RunId>,
    steps: u64,
    stretch_steps: u64,
}

/// A parsed tree's trivia, placed a region at a time on first read.
#[derive(Debug, Default)]
pub struct Placement {
    kinds: SurfaceKinds,
    unit: u32,
    state: Mutex<State>,
}

/// The tree a placement reads: its tree, source and row starts.
#[derive(Clone, Copy)]
pub struct Source<'t> {
    pub tree: &'t tree_sitter::Tree,
    pub source: &'t str,
    pub lines: &'t LineTable,
}

/// How a placement finds a node of its tree by its descendant index: the
/// reader's own lookup, which moves from where it last read.
pub type Lookup<'n, 't> = &'n mut dyn FnMut(NodeIndex) -> Option<tree_sitter::Node<'t>>;

impl Placement {
    /// The placement of a tree whose grammar's surface kinds are `kinds`
    /// and whose indentation level is `unit` spaces wide.
    #[must_use]
    pub fn new(kinds: SurfaceKinds, unit: u32) -> Self {
        Self { kinds, unit, state: Mutex::default() }
    }

    fn with<'t, R>(&self, source: Source<'t>, nodes: Option<Lookup<'_, 't>>, f: impl FnOnce(&mut Placer<'t, '_, '_>) -> R) -> R {
        let mut state = self.state.lock().unwrap_or_else(PoisonError::into_inner);
        let mut placer = Placer { source, kinds: self.kinds, unit: self.unit.max(1), state: &mut state, lookup: nodes, nodes: HashMap::new(), kids: HashMap::new(), plans: HashMap::new() };
        f(&mut placer)
    }

    /// The entries the assignment gives `side` of the node at `index`, in
    /// source order, its region placed first.
    #[must_use]
    pub fn side<'t>(&self, source: Source<'t>, nodes: Lookup<'_, 't>, index: NodeIndex, side: TriviaSide) -> Vec<Assigned> {
        self.with(source, Some(nodes), |placer| {
            placer.cover(index, side);
            placer.state.sides.get(&(index, side)).cloned().unwrap_or_default()
        })
    }

    /// The region that holds `side` of the node at `index`, placed.
    pub fn cover<'t>(&self, source: Source<'t>, nodes: Lookup<'_, 't>, index: NodeIndex, side: TriviaSide) {
        self.with(source, Some(nodes), |placer| placer.cover(index, side));
    }

    /// The item the list node at `index` passes the extras and `ERROR`s of
    /// its `side` to (`TriviaTable::edge_item`).
    #[must_use]
    pub fn edge_item<'t>(&self, source: Source<'t>, nodes: Lookup<'_, 't>, index: NodeIndex, side: TriviaSide) -> Option<NodeIndex> {
        self.with(source, Some(nodes), |placer| {
            let kid = placer.kid(index);
            if !kid.holder || !placer.kinds.lists.contains(&kid.kind) || !placer.walked(index) {
                return None;
            }
            placer.edge_item(&kid, side).map(|item| item.index)
        })
    }

    /// The adjacency of the entry at `index` when the source fixes it in
    /// place (`TriviaTable::adjacency`).
    #[must_use]
    pub fn adjacency<'t>(&self, source: Source<'t>, nodes: Lookup<'_, 't>, index: NodeIndex) -> Option<Adjacency> {
        self.with(source, Some(nodes), |placer| {
            let kid = placer.kid(index);
            if !kid.entry || !placer.walked(index) {
                return None;
            }
            placer.adjacency(&kid)
        })
    }

    /// The run `id` names, which a placed side holds.
    ///
    /// # Panics
    ///
    /// When no placed side holds `id`.
    #[must_use]
    pub fn run(&self, id: RunId) -> LayoutRun {
        self.state.lock().unwrap_or_else(PoisonError::into_inner).runs[id.index()].run
    }

    /// Where the source text of the run `id` starts as its baseline measures
    /// it: the last text before it that is not whitespace, back to the run
    /// before it at most.
    ///
    /// # Panics
    ///
    /// When no placed side holds `id`.
    #[must_use]
    pub fn run_from(&self, id: RunId) -> u32 {
        self.state.lock().unwrap_or_else(PoisonError::into_inner).runs[id.index()].from
    }

    /// Place every region of the tree.
    pub fn place_all(&self, source: Source<'_>) {
        self.with(source, None, |placer| {
            placer.place_all();
        });
    }

    /// Every run placed so far, in source order.
    #[must_use]
    pub fn runs(&self) -> Vec<(RunId, LayoutRun)> {
        let state = self.state.lock().unwrap_or_else(PoisonError::into_inner);
        state.order.values().map(|&id| (id, state.runs[id.index()].run)).collect()
    }

    /// The first placed run, in source order, spanning `start..end`.
    #[must_use]
    pub fn run_at(&self, start: u32, end: u32) -> Option<RunId> {
        let state = self.state.lock().unwrap_or_else(PoisonError::into_inner);
        state.order.range((start, end, Order { from: 0, gap: false, left: None, step: 0 })..).next().filter(|((at, until, _), _)| *at == start && *until == end).map(|(_, &id)| id)
    }

    /// The entries no side takes, among the regions placed so far, in
    /// source order.
    #[must_use]
    pub fn unowned(&self) -> Vec<NodeIndex> {
        self.state.lock().unwrap_or_else(PoisonError::into_inner).unowned.values().copied().collect()
    }

    /// Every side placed so far, by node and side.
    #[must_use]
    pub fn sides(&self) -> BTreeMap<(NodeIndex, TriviaSide), Vec<Assigned>> {
        self.state.lock().unwrap_or_else(PoisonError::into_inner).sides.clone()
    }

    /// The children the placement has stepped through.
    #[must_use]
    pub fn steps(&self) -> u64 {
        self.state.lock().unwrap_or_else(PoisonError::into_inner).steps
    }

    /// The steps the placement has taken to measure structural
    /// indentation: each depth stretch it opened and each byte it read of a
    /// stretch's first line.
    #[must_use]
    pub fn stretch_steps(&self) -> u64 {
        self.state.lock().unwrap_or_else(PoisonError::into_inner).stretch_steps
    }
}

struct Placer<'t, 's, 'l> {
    source: Source<'t>,
    kinds: SurfaceKinds,
    unit: u32,
    state: &'s mut State,
    lookup: Option<Lookup<'l, 't>>,
    nodes: HashMap<NodeIndex, tree_sitter::Node<'t>>,
    kids: HashMap<NodeIndex, Arc<[Kid]>>,
    plans: HashMap<Gap, Arc<Plan>>,
}

impl<'t> Placer<'t, '_, '_> {
    fn text(&self) -> &'t str {
        self.source.source
    }

    fn len(&self) -> u32 {
        narrow(self.source.source.len())
    }

    fn node(&mut self, index: NodeIndex) -> tree_sitter::Node<'t> {
        if let Some(&node) = self.nodes.get(&index) {
            return node;
        }
        let node = self.lookup.as_mut().and_then(|lookup| lookup(index)).unwrap_or_else(|| {
            let mut cursor = self.source.tree.walk();
            crate::read::goto(&mut cursor, index);
            cursor.node()
        });
        self.nodes.insert(index, node);
        node
    }

    /// What the placement reads of the node at `index`: from the shape of
    /// it or of its parent where one is built.
    fn kid(&mut self, index: NodeIndex) -> Kid {
        if let Some(shape) = self.state.shapes.get(&index) {
            return shape.node;
        }
        if let Some(shape) = self.state.parent.get(&index).and_then(|parent| self.state.shapes.get(parent)) {
            if let Ok(at) = shape.kids.binary_search_by_key(&index, |kid| kid.index) {
                return shape.kids[at];
            }
        }
        Kid::of(&self.node(index), index)
    }

    fn kids(&mut self, index: NodeIndex) -> Arc<[Kid]> {
        if let Some(shape) = self.state.shapes.get(&index) {
            return Arc::clone(&shape.kids);
        }
        if let Some(kids) = self.kids.get(&index) {
            return Arc::clone(kids);
        }
        let node = self.node(index);
        let mut cursor = node.walk();
        let mut kids = Vec::new();
        if cursor.goto_first_child() {
            loop {
                let child = cursor.node();
                let at = index + crate::read::offset_of(&cursor);
                self.nodes.insert(at, child);
                kids.push(Kid::of(&child, at));
                if !cursor.goto_next_sibling() {
                    break;
                }
            }
        }
        self.state.steps += kids.len() as u64;
        let kids: Arc<[Kid]> = kids.into();
        self.kids.insert(index, Arc::clone(&kids));
        kids
    }

    /// The first token of the walk under `kid`, which is no root.
    fn first(&mut self, kid: &Kid) -> Option<Tok> {
        struct Frame {
            node: Kid,
            kids: Arc<[Kid]>,
            next: usize,
            at: u32,
        }
        if kid.entry {
            return None;
        }
        if kid.leaf {
            return Some(Tok::leaf(kid));
        }
        if let Some(&known) = self.state.firsts.get(&kid.index) {
            return known;
        }
        let kids = self.kids(kid.index);
        let mut frames = vec![Frame { node: *kid, kids, next: 0, at: kid.start }];
        let source = self.text();
        let found = loop {
            let Some(frame) = frames.last_mut() else { break None };
            let Some(&child) = frame.kids.get(frame.next) else {
                let node = frame.node;
                let after = hidden(source, frame.at, node.end, |start, end| Key::leave(start, end, &node, 0));
                if after.is_some() {
                    break after;
                }
                frames.pop();
                self.state.firsts.insert(node.index, None);
                continue;
            };
            frame.next += 1;
            let before = hidden(source, frame.at, child.start, |start, end| Key::before(start, end, child.index));
            frame.at = child.end;
            if before.is_some() {
                break before;
            }
            if child.entry {
                continue;
            }
            if child.leaf {
                break Some(Tok::leaf(&child));
            }
            if let Some(&known) = self.state.firsts.get(&child.index) {
                if known.is_some() {
                    break known;
                }
                continue;
            }
            let kids = self.kids(child.index);
            frames.push(Frame { node: child, kids, next: 0, at: child.start });
        };
        let mut found = found?;
        for frame in frames.iter().rev() {
            if frame.node.start < found.start {
                found = Tok::start_edge(&frame.node);
            }
            self.state.firsts.insert(frame.node.index, Some(found));
        }
        Some(found)
    }

    /// The last token of the walk under `kid`, which is no root.
    fn last(&mut self, kid: &Kid) -> Option<Tok> {
        struct Frame {
            node: Kid,
            kids: Arc<[Kid]>,
            left: usize,
            at: u32,
        }
        if kid.entry {
            return None;
        }
        if kid.leaf {
            return Some(Tok::leaf(kid));
        }
        if let Some(&known) = self.state.lasts.get(&kid.index) {
            return known;
        }
        let kids = self.kids(kid.index);
        let left = kids.len();
        let mut frames = vec![Frame { node: *kid, kids, left, at: kid.end }];
        let source = self.text();
        let found = loop {
            let Some(frame) = frames.last_mut() else { break None };
            let node = frame.node;
            if frame.left == 0 {
                let first = frame.kids.first().map(|kid| kid.index);
                let before = hidden(source, node.start, frame.at, |start, end| first.map_or_else(|| Key::leave(start, end, &node, 0), |first| Key::before(start, end, first)));
                if before.is_some() {
                    break before;
                }
                frames.pop();
                self.state.lasts.insert(node.index, None);
                continue;
            }
            let child = frame.kids[frame.left - 1];
            let next = frame.kids.get(frame.left).map(|kid| kid.index);
            let after = hidden(source, child.end, frame.at, |start, end| next.map_or_else(|| Key::leave(start, end, &node, 0), |next| Key::before(start, end, next)));
            frame.left -= 1;
            frame.at = child.start;
            if after.is_some() {
                break after;
            }
            if child.entry {
                continue;
            }
            if child.leaf {
                break Some(Tok::leaf(&child));
            }
            if let Some(&known) = self.state.lasts.get(&child.index) {
                if known.is_some() {
                    break known;
                }
                continue;
            }
            let kids = self.kids(child.index);
            let left = kids.len();
            frames.push(Frame { node: child, kids, left, at: child.end });
        };
        let mut found = found?;
        for frame in frames.iter().rev() {
            if frame.node.end > found.end {
                found = Tok::end_edge(&frame.node);
            }
            self.state.lasts.insert(frame.node.index, Some(found));
        }
        Some(found)
    }

    /// Every entry under `kid`, a child that holds no token, in the walk's
    /// order, each known by its parent.
    fn entries_under(&mut self, kid: &Kid, entries: &mut Vec<Kid>) {
        let mut stack = vec![(kid.index, self.kids(kid.index), 0)];
        while let Some((parent, kids, next)) = stack.last_mut() {
            let parent = *parent;
            let Some(&child) = kids.get(*next) else {
                stack.pop();
                continue;
            };
            *next += 1;
            self.state.parent.insert(child.index, parent);
            if child.entry {
                entries.push(child);
            } else if !child.leaf {
                let kids = self.kids(child.index);
                stack.push((child.index, kids, 0));
            }
        }
    }

    fn shape(&mut self, index: NodeIndex) -> Arc<Shape> {
        if let Some(shape) = self.state.shapes.get(&index) {
            return Arc::clone(shape);
        }
        let node = self.kid(index);
        let root = index == NodeIndex::ROOT;
        let kids = if node.entry { Arc::from([]) } else { self.kids(index) };
        let source = self.text();
        let (mut segments, mut entries, mut at) = (Vec::new(), Vec::new(), node.start);
        if node.entry {
            entries.push(node);
        }
        for (position, kid) in kids.iter().enumerate() {
            self.state.parent.insert(kid.index, index);
            if let Some(token) = hidden(source, at, kid.start, |start, end| Key::before(start, end, kid.index)) {
                segments.push(Segment { first: token, last: token, kid: None });
            }
            at = kid.end;
            if kid.entry {
                entries.push(*kid);
            } else if kid.leaf {
                let token = Tok::leaf(kid);
                segments.push(Segment { first: token, last: token, kid: Some(position) });
            } else if let (Some(first), Some(last)) = (self.first(kid), self.last(kid)) {
                segments.push(Segment { first, last, kid: Some(position) });
            } else {
                self.entries_under(kid, &mut entries);
            }
        }
        if let Some(token) = hidden(source, at, node.end, |start, end| Key::leave(start, end, &node, 0)).filter(|_| !node.leaf && !node.entry) {
            segments.push(Segment { first: token, last: token, kid: None });
        }
        if !root {
            if let (Some(first), Some(last)) = (segments.first().map(|segment| segment.first), segments.last().map(|segment| segment.last)) {
                if node.start < first.start {
                    let edge = Tok::start_edge(&node);
                    segments.insert(0, Segment { first: edge, last: edge, kid: None });
                }
                if node.end > last.end {
                    let edge = Tok::end_edge(&node);
                    segments.push(Segment { first: edge, last: edge, kid: None });
                }
            }
        }
        for (position, segment) in segments.iter().enumerate() {
            if let Some(kid) = segment.kid.map(|kid| kids[kid]).filter(|kid| !kid.leaf) {
                self.state.positions.insert(kid.index, position);
            }
        }
        let holds = kids.iter().any(|kid| kid.holder);
        self.kids.remove(&index);
        let shape = Arc::new(Shape { node, root, kids, holds, segments, entries });
        self.state.shapes.insert(index, Arc::clone(&shape));
        shape
    }

    /// Whether the walk reads the node at `index`: no entry holds it.
    fn walked(&mut self, index: NodeIndex) -> bool {
        if index == NodeIndex::ROOT || self.state.parent.contains_key(&index) {
            return true;
        }
        let path = self.path(index);
        !path[..path.len() - 1].iter().any(|&at| is_entry(&self.node(at)))
    }

    /// The nodes from the root down to the node at `index`, each one's shape
    /// above it built, so each knows its parent.
    fn path(&mut self, index: NodeIndex) -> Vec<NodeIndex> {
        let mut cursor = self.source.tree.walk();
        crate::read::goto(&mut cursor, index);
        let mut path = Vec::new();
        loop {
            let at = crate::read::index_of(&cursor);
            self.nodes.entry(at).or_insert_with(|| cursor.node());
            path.push(at);
            if !cursor.goto_parent() {
                break;
            }
        }
        path.reverse();
        for &at in &path[..path.len() - 1] {
            if is_entry(&self.node(at)) {
                break;
            }
            self.shape(at);
        }
        path
    }

    /// The parent of the node at `index`, which the walk reads.
    fn parent(&mut self, index: NodeIndex) -> Option<NodeIndex> {
        if index == NodeIndex::ROOT {
            return None;
        }
        if let Some(&parent) = self.state.parent.get(&index) {
            return Some(parent);
        }
        self.path(index);
        self.state.parent.get(&index).copied()
    }

    /// The parent of the node at `index`, which holds tokens, and the
    /// position of its segment there.
    fn parent_of(&mut self, index: NodeIndex) -> Option<(NodeIndex, usize)> {
        let parent = self.parent(index)?;
        self.shape(parent);
        Some((parent, *self.state.positions.get(&index)?))
    }

    /// The node whose region holds the node at `index`: the nearest at or
    /// above it that is no list, or the root.
    fn top_of(&mut self, index: NodeIndex) -> NodeIndex {
        let mut at = index;
        while at != NodeIndex::ROOT && self.kinds.lists.contains(&self.kid(at).kind) {
            match self.parent(at) {
                Some(parent) => at = parent,
                None => break,
            }
        }
        at
    }

    /// Place the region that holds `side` of the node at `index`.
    fn cover(&mut self, index: NodeIndex, side: TriviaSide) {
        let held = match side {
            TriviaSide::Inner => self.state.members.contains_key(&index),
            TriviaSide::Leading | TriviaSide::Trailing => index == NodeIndex::ROOT || self.state.framed.contains_key(&index),
        };
        if held || self.state.settled.contains_key(&(index, side)) {
            return;
        }
        if !self.walked(index) {
            self.state.settled.insert((index, side), ());
            return;
        }
        let holder = match side {
            TriviaSide::Inner => Some(index),
            TriviaSide::Leading | TriviaSide::Trailing => self.parent(index),
        };
        let Some(holder) = holder else { return };
        let top = self.top_of(holder);
        self.place_region(top);
    }

    /// Place every region of the tree, from one walk of it, each after the
    /// regions above it.
    fn place_all(&mut self) {
        let mut cursor = self.source.tree.walk();
        let mut tops = Vec::new();
        loop {
            let node = cursor.node();
            let index = crate::read::index_of(&cursor);
            self.nodes.insert(index, node);
            let kid = Kid::of(&node, index);
            if index == NodeIndex::ROOT || (!kid.entry && !kid.leaf && !self.kinds.lists.contains(&kid.kind)) {
                tops.push(index);
            }
            if !kid.entry && cursor.goto_first_child() {
                continue;
            }
            loop {
                if cursor.goto_next_sibling() {
                    break;
                }
                if !cursor.goto_parent() {
                    for top in tops {
                        self.place_region(top);
                    }
                    return;
                }
            }
        }
    }

    /// The region of the node at `top`, which is no list or the root and
    /// whose parent the placement knows, placed.
    fn place_region(&mut self, top: NodeIndex) {
        if self.state.placed.insert(top, ()).is_some() {
            return;
        }
        let mut members = Vec::new();
        let mut stack = vec![top];
        while let Some(at) = stack.pop() {
            members.push(at);
            let kids = Arc::clone(&self.shape(at).kids);
            stack.extend(kids.iter().rev().filter(|kid| !kid.entry && !kid.leaf && self.kinds.lists.contains(&kid.kind)).map(|kid| kid.index));
        }
        let mut events: Vec<(Order, Event)> = Vec::new();
        for &member in &members {
            let shape = self.shape(member);
            self.state.members.insert(member, ());
            self.state.framed.extend(shape.kids.iter().map(|kid| (kid.index, ())));
            let entry = self.entry_of(member);
            let (plans, after) = self.walk(&shape, entry);
            let last = after.last().copied().unwrap_or(entry);
            if !self.state.sims.contains_key(&member) {
                self.state.sims.insert(member, Arc::new(Sim { after }));
            }
            for (gap, plan) in shape.gaps().zip(plans) {
                let left = plan.left.map(|token| token.key);
                for (step, &action) in plan.steps.iter().enumerate() {
                    events.push((Order { from: plan.from, gap: true, left, step: narrow(step) }, Event::Step { gap: (member, gap), step, action, plan: Arc::clone(&plan) }));
                }
            }
            if entry != last {
                let (node, side) = self.restore_side(&shape);
                events.push((Order { from: shape.node.end, gap: false, left: None, step: u32::MAX - member.get() }, Event::Restore { place: Place::Side(node, side), depth: entry - last }));
            }
        }
        events.sort_by_key(|(order, _)| *order);
        for (order, event) in events {
            self.apply(order, event);
        }
    }

    fn apply(&mut self, order: Order, event: Event) {
        match event {
            Event::Restore { place, depth } => self.push(place, Assigned::Depth(depth), order),
            Event::Step { gap, step, action, plan } => match action {
                Step::Run { at, until, place, depth } => {
                    let edge = at == 0 || until == self.len();
                    match place {
                        Place::Side(node, side) if !edge => {
                            let pushed = Pushed { gap, step, at, until };
                            let carries = self.carries(pushed);
                            let spelled = self.spelled(gap.0, &plan, at, until);
                            let from = self.text_from(pushed);
                            let id = RunId(narrow(self.state.runs.len()));
                            let owner = gap.0;
                            self.state.runs.push(Placed { run: LayoutRun { start: at, end: until, node, side, owner, carries, spelled }, from });
                            self.state.order.insert((at, until, order), id);
                            self.push(place, Assigned::Layout { run: id, start: at, end: until, owner, depth }, order);
                        }
                        _ if depth != 0 => self.push(place, Assigned::Depth(depth), order),
                        _ => {}
                    }
                }
                Step::Entry { place, entry } => self.push(place, entry, order),
                Step::Reset { place, depth } => {
                    if depth != 0 {
                        self.push(place, Assigned::Depth(depth), order);
                    }
                }
            },
        }
    }

    fn push(&mut self, place: Place, entry: Assigned, order: Order) {
        match place {
            Place::Side(node, side) => self.state.sides.entry((node, side)).or_default().push(entry),
            Place::Unowned => {
                if let Assigned::Extra(index) | Assigned::Error(index) | Assigned::Member(index) = entry {
                    self.state.unowned.insert(order, index);
                }
            }
        }
    }

    /// The gap before the first token of the node at `index`, which is no root.
    fn before_node(&mut self, index: NodeIndex) -> Option<Gap> {
        let mut climbed = Vec::new();
        let mut at = index;
        let found = loop {
            if let Some(&known) = self.state.befores.get(&at) {
                break known;
            }
            climbed.push(at);
            let Some((parent, position)) = self.parent_of(at) else { break None };
            if self.shape(parent).gaps().contains(&position) {
                break Some((parent, position));
            }
            at = parent;
        };
        for at in climbed {
            self.state.befores.insert(at, found);
        }
        found
    }

    /// The gap after the last token of the node at `index`.
    fn after_node(&mut self, index: NodeIndex) -> Option<Gap> {
        let mut climbed = Vec::new();
        let mut at = index;
        let found = loop {
            if let Some(&known) = self.state.afters.get(&at) {
                break known;
            }
            climbed.push(at);
            let Some((parent, position)) = self.parent_of(at) else { break None };
            if self.shape(parent).gaps().contains(&(position + 1)) {
                break Some((parent, position + 1));
            }
            at = parent;
        };
        for at in climbed {
            self.state.afters.insert(at, found);
        }
        found
    }

    /// The excess the first gap of the node at `index` starts at.
    fn entry_of(&mut self, index: NodeIndex) -> i32 {
        let mut pending = Vec::new();
        let mut at = index;
        let mut excess = loop {
            let Some((owner, gap)) = (at != NodeIndex::ROOT).then(|| self.before_node(at)).flatten() else { break 0 };
            if let Some(sim) = self.state.sims.get(&owner).map(Arc::clone) {
                let start = self.shape(owner).gaps().start;
                break sim.after[gap - start];
            }
            pending.push((owner, gap));
            at = owner;
        };
        while let Some((owner, gap)) = pending.pop() {
            let shape = self.shape(owner);
            let (_, after) = self.walk(&shape, excess);
            excess = after[gap - shape.gaps().start];
            self.state.sims.insert(owner, Arc::new(Sim { after }));
        }
        excess
    }

    /// Each gap of `shape` with the depth its runs and resets carry, from
    /// `entry`, and the excess after each gap.
    fn walk(&mut self, shape: &Shape, entry: i32) -> (Vec<Arc<Plan>>, Vec<i32>) {
        let level = self.level(shape.node.index);
        let source = self.text();
        let mut current = entry;
        let mut plans = Vec::new();
        let mut after = Vec::new();
        for gap in shape.gaps() {
            let structural = self.plan(shape, gap);
            let mut plan = (*structural).clone();
            let held = current;
            for step in &mut plan.steps {
                match step {
                    Step::Run { at, until, depth, .. } => {
                        let text = &source[*at as usize..*until as usize];
                        if text.contains('\n') {
                            let reach = self.excess(*until, text, level);
                            *depth = reach - current;
                            current = reach;
                        }
                    }
                    Step::Reset { depth, .. } => {
                        *depth = held - current;
                        current = held;
                    }
                    Step::Entry { .. } => {}
                }
            }
            after.push(current);
            plans.push(Arc::new(plan));
        }
        (plans, after)
    }

    fn excess(&self, until: u32, text: &str, level: Option<NodeIndex>) -> i32 {
        let unit = i64::from(self.unit);
        let line = text.rsplit('\n').next().unwrap_or_default();
        let width: i64 = line.bytes().filter_map(|byte| self.blank(byte)).sum();
        i32::try_from((width - self.structural(level, until)).div_euclid(unit)).unwrap_or(0)
    }

    fn blank(&self, byte: u8) -> Option<i64> {
        match byte {
            b' ' => Some(1),
            b'\t' => Some(i64::from(self.unit)),
            _ => None,
        }
    }

    /// The structural indentation width at byte `at` (`Structure::structural`):
    /// the innermost stretch's holding it among those from `level` up.
    fn structural(&self, mut level: Option<NodeIndex>, at: u32) -> i64 {
        while let Some(node) = level {
            let Some(stretches) = self.state.stretches.get(&node) else { break };
            if let Some(stretch) = stretches.own.iter().rev().find(|stretch| stretch.open <= at && at < stretch.close) {
                return stretch.width;
            }
            level = stretches.up;
        }
        0
    }

    /// The width of the innermost stretch holding `open..close` among those
    /// from `level` up.
    fn around(&self, mut level: Option<NodeIndex>, open: u32, close: u32) -> Option<i64> {
        while let Some(node) = level {
            let stretches = self.state.stretches.get(&node)?;
            if let Some(stretch) = stretches.own.iter().rev().find(|stretch| stretch.open <= open && close <= stretch.close) {
                return Some(stretch.width);
            }
            level = stretches.up;
        }
        None
    }

    /// The gap at `gap`'s steps, with no depth measured.
    fn plan_at(&mut self, gap: Gap) -> Arc<Plan> {
        let shape = self.shape(gap.0);
        self.plan(&shape, gap.1)
    }

    fn plan(&mut self, shape: &Shape, gap: usize) -> Arc<Plan> {
        let key = (shape.node.index, gap);
        if let Some(plan) = self.plans.get(&key) {
            return Arc::clone(plan);
        }
        let (left, right) = (shape.left(gap), shape.right(gap));
        let from = left.map_or(0, |token| token.end);
        let to = right.map_or(self.len(), |token| token.start);
        let entries = self.gap_entries(shape, left, right);
        let default = self.place(shape, gap, (from, to), false, false);
        let mut placed = Vec::with_capacity(entries.len());
        for entry in &entries {
            placed.push(if self.kinds.layout.contains(&entry.kind) {
                None
            } else {
                let on_left_row = left.is_some_and(|left| self.same_row(left.end, entry.start));
                Some(self.place(shape, gap, (from, to), on_left_row, true))
            });
        }
        let trailed = placed.iter().rposition(|placed| matches!(placed, Some(Place::Side(_, TriviaSide::Trailing))));
        let moved = trailed.and_then(|last| placed[last]).filter(|&side| side != default);
        let source = self.text();
        let mut steps = Vec::new();
        let run = |steps: &mut Vec<Step>, at: u32, until: u32, place: Place| {
            if source.get(at as usize..until as usize).is_some() {
                steps.push(Step::Run { at, until, place, depth: 0 });
            }
        };
        let mut at = from;
        let mut led = None;
        for (i, entry) in entries.iter().enumerate() {
            let beside = match trailed {
                Some(last) if i <= last => placed[last],
                _ => led,
            };
            run(&mut steps, at, entry.start, beside.unwrap_or(default));
            match placed[i] {
                None => steps.push(Step::Entry { place: beside.unwrap_or(default), entry: Assigned::Member(entry.index) }),
                Some(place) => {
                    led = matches!(place, Place::Side(_, TriviaSide::Leading)).then_some(place);
                    let assigned = if entry.kind == KindId::ERROR { Assigned::Error(entry.index) } else { Assigned::Extra(entry.index) };
                    steps.push(Step::Entry { place, entry: assigned });
                }
            }
            if let Some(place) = moved.filter(|_| trailed == Some(i)) {
                steps.push(Step::Reset { place, depth: 0 });
            }
            at = entry.end;
        }
        run(&mut steps, at, to, led.unwrap_or(default));
        let plan = Arc::new(Plan { from, to, left, steps });
        self.plans.insert(key, Arc::clone(&plan));
        plan
    }

    fn same_row(&self, a: u32, b: u32) -> bool {
        let (low, high) = (a.min(b) as usize, a.max(b) as usize);
        !self.text().as_bytes()[low..high].contains(&b'\n')
    }

    /// The entries of the gap between `left` and `right`: those of the
    /// owner's that lie between them, and the one with width that starts on
    /// a zero-width `right`, which the first gap ending at that byte takes.
    fn gap_entries(&mut self, shape: &Shape, left: Option<Tok>, right: Option<Tok>) -> Vec<Kid> {
        let to = right.map_or(self.len(), |token| token.start);
        let low = left.map_or(0, |token| token.start);
        let begin = shape.entries.partition_point(|entry| entry.start < low);
        let end = shape.entries.partition_point(|entry| entry.start < to).max(begin);
        let mut entries: Vec<Kid> = shape.entries[begin..end].iter().filter(|entry| left.is_none_or(|left| entry.start > left.start || !(left.zero() && entry.end > entry.start))).copied().collect();
        if let Some(right) = right.filter(|right| right.zero()) {
            if !left.is_some_and(|left| left.zero() && left.start == right.start) {
                if let Some(entry) = self.wide_at(right.start, shape.node.index) {
                    entries.push(entry);
                }
            }
        }
        entries
    }

    /// The entry with width that starts at `byte`, looked for from the node
    /// at `near` up.
    fn wide_at(&mut self, byte: u32, near: NodeIndex) -> Option<Kid> {
        if let Some(&known) = self.state.wide.get(&byte) {
            return known;
        }
        let found = self.holding(byte, near).filter(|entry| entry.start == byte);
        self.state.wide.insert(byte, found);
        found
    }

    /// The entry that ends at `byte`, looked for from the node at `near` up.
    fn ending_at(&mut self, byte: u32, near: NodeIndex) -> Option<Kid> {
        let before = byte.checked_sub(1)?;
        if let Some(&known) = self.state.ending.get(&byte) {
            return known;
        }
        let found = self.holding(before, near).filter(|entry| entry.end == byte);
        self.state.ending.insert(byte, found);
        found
    }

    /// The entry that holds `byte`: found down through the nodes holding
    /// it, from the nearest node at or above `near` that holds it.
    fn holding(&mut self, byte: u32, near: NodeIndex) -> Option<Kid> {
        let mut at = near;
        while at != NodeIndex::ROOT && !self.kid(at).holds(byte) {
            at = self.parent(at).unwrap_or(NodeIndex::ROOT);
        }
        loop {
            let kids = self.kids(at);
            let kid = kids.get(kids.partition_point(|kid| kid.end <= byte)).copied().filter(|kid| kid.start <= byte)?;
            self.state.parent.insert(kid.index, at);
            if kid.entry {
                return Some(kid);
            }
            if kid.leaf {
                return None;
            }
            at = kid.index;
        }
    }

    fn place(&mut self, shape: &Shape, gap: usize, (from, to): (u32, u32), on_left_row: bool, through: bool) -> Place {
        let owner = shape.node.index;
        if !shape.holds {
            return Place::Side(owner, TriviaSide::Inner);
        }
        let before = gap.checked_sub(1).map(|at| shape.segments[at]).and_then(|segment| self.side_holder(shape, segment.kid, through, TriviaSide::Trailing, segment.last.end));
        let after = shape.segments.get(gap).copied().and_then(|segment| self.side_holder(shape, segment.kid, through, TriviaSide::Leading, segment.first.start));
        match (before, after) {
            (None, None) => {
                if through {
                    let (node, side) = self.nearest_side(shape, from, to);
                    Place::Side(node, side)
                } else {
                    Place::Unowned
                }
            }
            (Some(before), None) => Place::Side(before, TriviaSide::Trailing),
            (None, Some(after)) => Place::Side(after, TriviaSide::Leading),
            (Some(before), Some(after)) => {
                if on_left_row {
                    Place::Side(before, TriviaSide::Trailing)
                } else {
                    Place::Side(after, TriviaSide::Leading)
                }
            }
        }
    }

    fn side_holder(&mut self, shape: &Shape, kid: Option<usize>, through: bool, side: TriviaSide, edge: u32) -> Option<NodeIndex> {
        let kid = shape.kids[kid?];
        let at_edge = if side == TriviaSide::Trailing { kid.end == edge } else { kid.start == edge };
        if !kid.holder || !at_edge {
            return None;
        }
        let mut child = kid;
        if through {
            while let Some(inner) = self.edge_item(&child, side) {
                child = inner;
            }
        }
        Some(child.index)
    }

    /// The item a list node passes the extras and `ERROR`s of its `side`
    /// to (`Nodes::edge_item`).
    fn edge_item(&mut self, list: &Kid, side: TriviaSide) -> Option<Kid> {
        if list.leaf || list.entry || !self.kinds.lists.contains(&list.kind) {
            return None;
        }
        let kids = self.kids(list.index);
        let mut holders = kids.iter().filter(|kid| kid.holder);
        let item = if side == TriviaSide::Leading { holders.next() } else { holders.next_back() }?;
        let at_edge = if side == TriviaSide::Leading { item.start == list.start } else { item.end == list.end };
        (at_edge && !self.kinds.units.contains(&item.kind)).then_some(*item)
    }

    /// `kid`, or, while it is a list node, its first (for a `Leading` side)
    /// or last item that holds trivia and is not a unit kind.
    fn through_lists(&mut self, kid: &Kid, side: TriviaSide) -> NodeIndex {
        let mut child = *kid;
        while !child.leaf && self.kinds.lists.contains(&child.kind) {
            let kids = self.kids(child.index);
            let mut items = kids.iter().filter(|kid| kid.holder && !self.kinds.units.contains(&kid.kind));
            match if side == TriviaSide::Leading { items.next() } else { items.next_back() } {
                Some(&inner) => child = inner,
                None => break,
            }
        }
        child.index
    }

    fn nearest_side(&mut self, shape: &Shape, from: u32, to: u32) -> (NodeIndex, TriviaSide) {
        let after = shape.holders().find(|kid| kid.start >= to).copied();
        let found = after.map(|kid| (kid, TriviaSide::Leading)).or_else(|| shape.holders().rev().find(|kid| kid.end <= from).map(|&kid| (kid, TriviaSide::Trailing)));
        match found {
            Some((kid, side)) => (self.through_lists(&kid, side), side),
            None => (shape.node.index, TriviaSide::Inner),
        }
    }

    fn restore_side(&mut self, shape: &Shape) -> (NodeIndex, TriviaSide) {
        match shape.holders().next_back().copied() {
            Some(kid) => (self.through_lists(&kid, TriviaSide::Trailing), TriviaSide::Trailing),
            None => (shape.node.index, TriviaSide::Inner),
        }
    }

    /// The nearest node at or above the node at `index` whose template
    /// opens a depth stretch, each such node's stretches measured.
    fn level(&mut self, index: NodeIndex) -> Option<NodeIndex> {
        let mut pending = Vec::new();
        let mut at = index;
        let mut level = loop {
            if let Some(&known) = self.state.levels.get(&at) {
                break known;
            }
            pending.push(at);
            match self.parent(at) {
                Some(parent) => at = parent,
                None => break None,
            }
        };
        while let Some(at) = pending.pop() {
            let own = self.stretched(at, level);
            if !own.is_empty() {
                self.state.stretches.insert(at, Level { own, up: level });
                level = Some(at);
            }
            self.state.levels.insert(at, level);
        }
        level
    }

    /// The stretches the template of the node at `index` opens, each with
    /// its width, inside those from `up` up.
    fn stretched(&mut self, index: NodeIndex, up: Option<NodeIndex>) -> Vec<Stretch> {
        let kind = self.kid(index).kind;
        if !self.kinds.depth.iter().any(|region| region.kind == kind) {
            return Vec::new();
        }
        let shape = self.shape(index);
        let source = self.text();
        let literals: Vec<(u32, u32, &str)> = shape.kids.iter().filter(|kid| kid.leaf && !kid.named).filter_map(|kid| Some((kid.start, kid.end, source.get(kid.start as usize..kid.end as usize)?))).collect();
        let (start, end) = (shape.node.start, shape.node.end);
        let mut spans: Vec<(u32, u32)> = self
            .kinds
            .depth
            .iter()
            .filter(|region| region.kind == kind)
            .filter_map(|region| {
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
            .collect();
        spans.sort_by_key(|&(open, close)| (open, std::cmp::Reverse(close)));
        let mut own: Vec<Stretch> = Vec::with_capacity(spans.len());
        for (open, close) in spans {
            self.state.stretch_steps += 1;
            let outer = own.iter().rev().find(|stretch| stretch.open <= open && close <= stretch.close).map(|stretch| stretch.width).or_else(|| self.around(up, open, close)).unwrap_or(0);
            let width = self.opened(index, open, close, outer);
            own.push(Stretch { open, close, width });
        }
        own
    }

    /// The width of the stretch from `open` to `close` of the node at
    /// `index` inside one of width `around` (`Structure::opened`).
    fn opened(&mut self, index: NodeIndex, open: u32, close: u32, around: i64) -> i64 {
        let unit = i64::from(self.unit);
        match self.first_from(index, open).filter(|&start| start < close) {
            Some(start) => self.line_blanks(start).unwrap_or(around + unit),
            None => around + unit,
        }
    }

    /// The first byte a token of the walk under the node at `index` starts
    /// at, at or past `open`.
    fn first_from(&mut self, index: NodeIndex, open: u32) -> Option<u32> {
        let mut at = index;
        loop {
            let shape = self.shape(at);
            let position = shape.segments.partition_point(|segment| segment.last.start < open);
            let segment = shape.segments.get(position)?;
            if segment.first.start >= open {
                return Some(segment.first.start);
            }
            at = shape.block(position)?.index;
        }
    }

    /// The width of the blanks from the start of the line holding byte `at`
    /// to `at`, or none when a byte that is not blank lies between.
    fn line_blanks(&mut self, at: u32) -> Option<i64> {
        let start = self.source.lines.point(at).map_or(0, |point| at - point.column);
        let bytes = self.text().as_bytes();
        let blank_end = if let Some(&end) = self.state.blanks.get(&start) {
            end
        } else {
            let mut end = start;
            while (end as usize) < bytes.len() && self.blank(bytes[end as usize]).is_some() {
                end += 1;
            }
            self.state.stretch_steps += u64::from(end - start) + 1;
            self.state.blanks.insert(start, end);
            end
        };
        (at <= blank_end).then(|| bytes[start as usize..at as usize].iter().filter_map(|&byte| self.blank(byte)).sum())
    }

    /// The adjacency of the entry `entry` when the source fixes it in place
    /// (`TriviaTable::adjacency`): an entry carries the in-line run after
    /// the entry before it when that one is fixed too.
    fn adjacency(&mut self, entry: &Kid) -> Option<Adjacency> {
        let fixes = |kinds: &SurfaceKinds, kid: &Kid| kid.kind == KindId::ERROR || kinds.layout.contains(&kid.kind);
        if !fixes(&self.kinds, entry) {
            return None;
        }
        if let Some(&known) = self.state.adjacency.get(&entry.index) {
            return known;
        }
        let bytes = self.text().as_bytes();
        let mut chain = vec![*entry];
        let mut taken = None;
        loop {
            let first = chain[chain.len() - 1];
            let mut at = first.start as usize;
            while at > 0 && matches!(bytes[at - 1], b' ' | b'\t') {
                at -= 1;
            }
            let near = self.parent(first.index).unwrap_or(NodeIndex::ROOT);
            let Some(before) = self.ending_at(narrow(at), near) else { break };
            if !fixes(&self.kinds, &before) {
                break;
            }
            if let Some(&known) = self.state.adjacency.get(&before.index) {
                taken = known.and_then(|adjacency| adjacency.after);
                break;
            }
            chain.push(before);
        }
        for kid in chain.iter().rev() {
            let span = Span { start: kid.start, end: kid.end };
            let carried = taken.take().filter(|run| run.end == span.start);
            let spelled = Adjacency::of(self.text(), span);
            let adjacency = Adjacency { before: carried.or(spelled.before), ..spelled };
            let stored = (kid.kind == KindId::ERROR || adjacency.holds_whitespace()).then(|| if carried.is_some() { Adjacency { before: None, ..adjacency } } else { adjacency });
            taken = stored.and_then(|adjacency| adjacency.after);
            self.state.adjacency.insert(kid.index, stored);
        }
        self.state.adjacency.get(&entry.index).copied().flatten()
    }

    /// Whether an entry's adjacency spells the run `at..until` of `plan`, a
    /// gap of the node at `owner` (`LayoutRun::spelled`): the run after the
    /// entry ending where the blanks before it start, or before the one
    /// starting where those after it end.
    fn spelled(&mut self, owner: NodeIndex, plan: &Plan, at: u32, until: u32) -> bool {
        let bytes = self.text().as_bytes();
        let blank = |byte: u8| byte == b' ' || byte == b'\t';
        let mut back = at as usize;
        while back > 0 && blank(bytes[back - 1]) {
            back -= 1;
        }
        let gap_entries: Vec<NodeIndex> = plan
            .steps
            .iter()
            .filter_map(|step| match step {
                Step::Entry { entry: Assigned::Extra(index) | Assigned::Error(index) | Assigned::Member(index), .. } => Some(*index),
                _ => None,
            })
            .collect();
        let find = |placer: &mut Self, matches: &dyn Fn(&Kid) -> bool| gap_entries.iter().map(|&index| placer.kid(index)).find(|kid| matches(kid));
        let back = narrow(back);
        let before = match find(self, &|kid| kid.end == back) {
            Some(kid) => Some(kid),
            None if back < plan.from || (at == plan.from && plan.left.is_some_and(Tok::zero)) => self.ending_at(back, owner),
            None => None,
        };
        if let Some(adjacency) = before.and_then(|kid| self.adjacency(&kid)) {
            if adjacency.after.is_some_and(|run| run.start <= at && run.end >= until) {
                return true;
            }
        }
        let mut forward = until as usize;
        while forward < bytes.len() && blank(bytes[forward]) {
            forward += 1;
        }
        let forward = narrow(forward);
        let after = match find(self, &|kid| kid.start == forward) {
            Some(kid) => Some(kid),
            None if forward > plan.to || until == plan.to => self.wide_at(forward, owner),
            None => None,
        };
        after.and_then(|kid| self.adjacency(&kid)).is_some_and(|adjacency| adjacency.before.is_some_and(|run| run.start <= at && run.end >= until))
    }

    fn is_pushed(&self, step: &Step) -> Option<(u32, u32)> {
        match *step {
            Step::Run { at, until, place: Place::Side(..), .. } if at != 0 && until != self.len() => Some((at, until)),
            _ => None,
        }
    }

    /// The pushed run before `run`, looked for back through the gaps that
    /// end at or past `stop`.
    fn pred(&mut self, run: Pushed, stop: u32) -> Option<Pushed> {
        let mut gap = run.gap;
        let mut before = run.step;
        loop {
            let plan = self.plan_at(gap);
            if let Some((step, (at, until))) = plan.steps[..before].iter().enumerate().rev().find_map(|(step, action)| self.is_pushed(action).map(|bytes| (step, bytes))) {
                return Some(Pushed { gap, step, at, until });
            }
            gap = self.prev_gap(gap)?;
            let plan = self.plan_at(gap);
            if plan.to < stop {
                return None;
            }
            before = plan.steps.len();
        }
    }

    /// The pushed run after `run`, looked for on through the gaps that
    /// start at or before `stop`.
    fn succ(&mut self, run: Pushed, stop: u32) -> Option<Pushed> {
        let mut gap = run.gap;
        let mut after = run.step + 1;
        loop {
            let plan = self.plan_at(gap);
            if let Some((step, (at, until))) = plan.steps.iter().enumerate().skip(after).find_map(|(step, action)| self.is_pushed(action).map(|bytes| (step, bytes))) {
                return Some(Pushed { gap, step, at, until });
            }
            gap = self.next_gap(gap)?;
            if self.plan_at(gap).from > stop {
                return None;
            }
            after = 0;
        }
    }

    fn joined(&mut self, run: Pushed) -> bool {
        let plan = self.plan_at(run.gap);
        run.at == plan.from && plan.left.is_some_and(Tok::zero) && self.pred(run, run.at).is_some_and(|before| before.until == run.at)
    }

    /// Whether `run` carries the layout written in its group of runs only
    /// zero-width tokens part (`LayoutRun::carries`).
    fn carries(&mut self, run: Pushed) -> bool {
        let mut group = vec![run];
        let mut back = run;
        while self.joined(back) {
            let Some(before) = self.pred(back, back.at) else { break };
            group.insert(0, before);
            back = before;
        }
        let mut forward = run;
        while let Some(next) = self.succ(forward, forward.until) {
            if !self.joined(next) {
                break;
            }
            group.push(next);
            forward = next;
        }
        if group.len() < 2 {
            return true;
        }
        let carrier = group.iter().position(|run| run.at < run.until).unwrap_or(group.len() - 1);
        group[carrier] == run
    }

    /// Where the source text of `run` starts (`Placement::run_from`).
    fn text_from(&mut self, run: Pushed) -> u32 {
        let trimmed = narrow(self.text()[..run.at as usize].trim_end().len());
        let floor = self.pred(run, trimmed).map_or(0, |before| before.until.min(run.at));
        trimmed.max(floor)
    }

    /// The gap before `gap`.
    fn prev_gap(&mut self, (owner, gap): Gap) -> Option<Gap> {
        let shape = self.shape(owner);
        let segment = gap.checked_sub(1)?;
        if let Some(block) = shape.block(segment) {
            if let Some(inner) = self.last_gap_in(block.index) {
                return Some(inner);
            }
        }
        if shape.gaps().contains(&segment) {
            return Some((owner, segment));
        }
        self.before_node(owner)
    }

    /// The gap after `gap`.
    fn next_gap(&mut self, (owner, gap): Gap) -> Option<Gap> {
        let shape = self.shape(owner);
        if gap >= shape.segments.len() {
            return None;
        }
        if let Some(block) = shape.block(gap) {
            if let Some(inner) = self.first_gap_in(block.index) {
                return Some(inner);
            }
        }
        if shape.gaps().contains(&(gap + 1)) {
            return Some((owner, gap + 1));
        }
        self.after_node(owner)
    }

    /// The last gap under the node at `index`.
    fn last_gap_in(&mut self, index: NodeIndex) -> Option<Gap> {
        let mut chain = Vec::new();
        let mut at = index;
        let mut found = loop {
            if let Some(&known) = self.state.last_gaps.get(&at) {
                break known;
            }
            let shape = self.shape(at);
            let segments = shape.segments.len();
            chain.push((at, segments));
            match shape.block(segments - 1) {
                Some(block) => at = block.index,
                None => break None,
            }
        };
        while let Some((at, segments)) = chain.pop() {
            found = found.or_else(|| (segments >= 2).then_some((at, segments - 1)));
            self.state.last_gaps.insert(at, found);
        }
        found
    }

    /// The first gap under the node at `index`.
    fn first_gap_in(&mut self, index: NodeIndex) -> Option<Gap> {
        let mut chain = Vec::new();
        let mut at = index;
        let mut found = loop {
            if let Some(&known) = self.state.first_gaps.get(&at) {
                break known;
            }
            let shape = self.shape(at);
            chain.push((at, shape.segments.len()));
            match shape.block(0) {
                Some(block) => at = block.index,
                None => break None,
            }
        };
        while let Some((at, segments)) = chain.pop() {
            found = found.or_else(|| (segments >= 2).then_some((at, 1)));
            self.state.first_gaps.insert(at, found);
        }
        found
    }
}

/// One write of a region's placement: a step of one of its gaps, or the
/// restore of an owner's excess where it ends.
#[derive(Debug)]
enum Event {
    Step { gap: Gap, step: usize, action: Step, plan: Arc<Plan> },
    Restore { place: Place, depth: i32 },
}

macro_rules! no_heap {
    ($($t:ty),* $(,)?) => {
        $(impl HeapBytes for $t {
            fn heap_bytes(&self) -> usize {
                0
            }
        })*
    };
}

no_heap!(Key, Tok, Kid, Segment, Stretch, Placed, Order);

impl HeapBytes for Shape {
    fn heap_bytes(&self) -> usize {
        let Self { node: _, root: _, kids, holds: _, segments, entries } = self;
        ARC_COUNTS + std::mem::size_of_val::<[Kid]>(kids) + segments.heap_bytes() + entries.heap_bytes()
    }
}

impl HeapBytes for Sim {
    fn heap_bytes(&self) -> usize {
        let Self { after } = self;
        after.heap_bytes()
    }
}

impl HeapBytes for Level {
    fn heap_bytes(&self) -> usize {
        let Self { own, up: _ } = self;
        own.heap_bytes()
    }
}

impl HeapBytes for State {
    fn heap_bytes(&self) -> usize {
        let Self {
            shapes,
            parent,
            positions,
            firsts,
            lasts,
            befores,
            afters,
            first_gaps,
            last_gaps,
            sims,
            levels,
            stretches,
            blanks,
            wide,
            ending,
            adjacency,
            placed,
            members,
            framed,
            settled,
            sides,
            unowned,
            runs,
            order,
            steps: _,
            stretch_steps: _,
        } = self;
        shapes.heap_bytes()
            + parent.heap_bytes()
            + positions.heap_bytes()
            + firsts.heap_bytes()
            + lasts.heap_bytes()
            + befores.heap_bytes()
            + afters.heap_bytes()
            + first_gaps.heap_bytes()
            + last_gaps.heap_bytes()
            + sims.heap_bytes()
            + levels.heap_bytes()
            + stretches.heap_bytes()
            + blanks.heap_bytes()
            + wide.heap_bytes()
            + ending.heap_bytes()
            + adjacency.heap_bytes()
            + placed.heap_bytes()
            + members.heap_bytes()
            + framed.heap_bytes()
            + settled.heap_bytes()
            + sides.heap_bytes()
            + unowned.heap_bytes()
            + runs.heap_bytes()
            + order.heap_bytes()
    }
}

/// What the placement holds of the regions placed so far.
impl HeapBytes for Placement {
    fn heap_bytes(&self) -> usize {
        let Self { kinds: _, unit: _, state } = self;
        state.lock().unwrap_or_else(PoisonError::into_inner).heap_bytes()
    }
}
