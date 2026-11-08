//! A parsed tree's trivia placed one layout owner's gaps at a time, on the
//! first read of a side the layout owner holds: each gap read from the
//! nodes around it, never from a walk of the whole tree.
//!
//! Every node but the root begins and ends on a token of the walk, its edge
//! tokens included, so a gap's owner, the smallest node holding both its
//! tokens, finds the gap between two of its segments: a child's tokens, a
//! leaf, its hidden text or an edge token (`Shape`). A layout owner is a
//! node that is no list, or the root. Its gaps are its own and those of
//! every list below it through lists: they write only the leading and
//! trailing sides of those nodes' children and those nodes' own `inner`
//! sides, the sides the layout owner holds, and every write of those sides
//! comes from them (`Placer::layout_owner_of`).
//!
//! An owner's runs measure their excess from where the gap before its first
//! token left it, and nothing below the owner moves it between two of the
//! owner's gaps: each owner below ends, restoring its excess, before the
//! next one. A layout owner's writes go in the order a walk of the whole
//! tree would make them: by the byte their gap starts at, the restores of
//! the owners ending there first, innermost first, then each gap by its
//! left token.
//!
//! A placement finds the nodes it reads through the reader that asks it,
//! from the nodes it has read before: each node of a shape it builds knows
//! its parent, so a read of a side next to one already placed costs the
//! nodes around it, not the path from the root.
//!
//! A layout owner is placed once: its gaps are placed under the placement's
//! lock, and the sides they write published as a table that never changes
//! (`Table`), its slots stored after it (`Published`). A read of a side
//! whose layout owner is placed loads its node's slot and reads the table,
//! taking no lock. What the placement keeps to place further layout owners
//! stays under the lock.

use super::{Adjacency, Assigned, DepthAnchor, LayoutRun, Place, SurfaceKinds, TriviaSide};
use crate::nodes::{Kid, Nodes};
use crate::heap::{btree_allocation, CountedMap, HeapBytes, IndexState, ARC_COUNTS};
use crate::points::LineTable;
use crate::types::{narrow, NodeIndex, RunId, Span};
use crate::baseline::Tally;
use std::collections::{BTreeMap, HashMap};
use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::sync::{Arc, Mutex, OnceLock, PoisonError};

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
        self.segments.get(at)?.kid.map(|kid| self.kids[kid]).filter(|kid| !kid.leaf())
    }

    fn holders(&self) -> impl DoubleEndedIterator<Item = &Kid> + '_ {
        self.kids.iter().filter(|kid| kid.holder())
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

/// Values set once each, at their index, and read without a lock: chunk
/// `k` holds `2^k` of them and is made by the first value set in it, so a
/// value set never moves.
#[derive(Debug)]
struct Chunks<T> {
    chunks: Box<[OnceLock<Chunk<T>>]>,
}

type Chunk<T> = Box<[OnceLock<T>]>;

impl<T> Chunks<T> {
    /// Room for `capacity` values.
    fn new(capacity: usize) -> Self {
        Self { chunks: (0..usize::BITS - capacity.leading_zeros()).map(|_| OnceLock::new()).collect() }
    }

    /// The chunk the value at `index` falls in, and its place there.
    fn locate(index: usize) -> (usize, usize) {
        let at = index + 1;
        let chunk = (usize::BITS - 1 - at.leading_zeros()) as usize;
        (chunk, at - (1 << chunk))
    }

    fn get(&self, index: usize) -> Option<&T> {
        let (chunk, at) = Self::locate(index);
        self.chunks.get(chunk)?.get()?.get(at)?.get()
    }

    /// Sets the value at `index`, which none holds, answering the heap a
    /// chunk made for it takes.
    fn set(&self, index: usize, value: T) -> usize {
        let (chunk, at) = Self::locate(index);
        let mut made = 0;
        let values = self.chunks[chunk].get_or_init(|| {
            made = std::mem::size_of::<OnceLock<T>>() << chunk;
            (0..1usize << chunk).map(|_| OnceLock::new()).collect()
        });
        let set = values[at].set(value);
        debug_assert!(set.is_ok(), "a value is set once");
        made
    }

    /// The values set, by index, up to the first index none holds.
    fn values(&self) -> impl Iterator<Item = &T> + '_ {
        self.chunks.iter().map_while(OnceLock::get).flat_map(|values| values.iter()).map_while(OnceLock::get)
    }

    /// The heap the directory and the chunks made take.
    fn allocation(&self) -> usize {
        std::mem::size_of_val::<[OnceLock<Chunk<T>>]>(&self.chunks) + self.chunks.iter().filter_map(OnceLock::get).map(|values| std::mem::size_of_val::<[OnceLock<T>]>(values)).sum::<usize>()
    }
}

/// The sides placing one layout owner wrote, published once and read
/// without a lock: each side's entries in source order, the adjacency of
/// each `ERROR` and line continuation among them, and the item each list
/// below the layout owner passes the extras and `ERROR`s of an edge to.
#[derive(Debug, Default)]
pub struct Table {
    sides: Box<[(NodeIndex, TriviaSide, u32)]>,
    entries: Box<[Assigned]>,
    adjacency: Box<[(NodeIndex, Adjacency)]>,
    edges: Box<[(NodeIndex, TriviaSide, NodeIndex)]>,
}

impl Table {
    /// The entries placing the layout owner gave `side` of the node at
    /// `index`, in source order.
    #[must_use]
    pub fn side(&self, index: NodeIndex, side: TriviaSide) -> &[Assigned] {
        let Ok(at) = self.sides.binary_search_by_key(&(index, side), |&(node, side, _)| (node, side)) else { return &[] };
        &self.entries[self.start(at)..self.sides[at].2 as usize]
    }

    fn start(&self, at: usize) -> usize {
        at.checked_sub(1).map_or(0, |before| self.sides[before].2 as usize)
    }

    /// Every side placing the layout owner wrote, by node and side, with its
    /// entries.
    pub fn sides(&self) -> impl Iterator<Item = ((NodeIndex, TriviaSide), &[Assigned])> + '_ {
        self.sides.iter().enumerate().map(|(at, &(node, side, end))| ((node, side), &self.entries[self.start(at)..end as usize]))
    }

    /// The adjacency of the entry at `index`, an `ERROR` or a layout member
    /// a side of the table holds, where the source fixes it in place
    /// (`Adjacency`): an `ERROR`'s always, a line continuation's when
    /// whitespace lies beside it.
    #[must_use]
    pub fn adjacency(&self, index: NodeIndex) -> Option<Adjacency> {
        self.adjacency.binary_search_by_key(&index, |&(at, _)| at).ok().map(|at| self.adjacency[at].1)
    }

    fn edge_item(&self, index: NodeIndex, side: TriviaSide) -> Option<NodeIndex> {
        self.edges.binary_search_by_key(&(index, side), |&(list, side, _)| (list, side)).ok().map(|at| self.edges[at].2)
    }
}

impl HeapBytes for Table {
    fn heap_bytes(&self) -> usize {
        let Self { sides, entries, adjacency, edges } = self;
        std::mem::size_of_val::<[(NodeIndex, TriviaSide, u32)]>(sides) + std::mem::size_of_val::<[Assigned]>(entries) + std::mem::size_of_val::<[(NodeIndex, Adjacency)]>(adjacency) + std::mem::size_of_val::<[(NodeIndex, TriviaSide, NodeIndex)]>(edges)
    }
}

/// A node's slot before its side's layout owner is placed.
const UNPLACED: u32 = 0;
/// A node's slot once its side's layout owner is placed and published no
/// table: placing it wrote nothing, or no layout owner holds the side.
const EMPTY: u32 = u32::MAX;

/// What a placement publishes as it places its layout owners, read without
/// a lock. Each node has two slots, its leading and trailing sides' and its
/// inner's, naming the table of the layout owner that holds them by its id
/// plus one, `UNPLACED` or `EMPTY`. A layout owner's runs and table are set
/// before its slots are stored, with release ordering, so a read that loads
/// a slot with acquire ordering finds them.
#[derive(Debug)]
struct Published {
    slots: Box<[AtomicU32]>,
    tables: Chunks<Table>,
    runs: Chunks<Placed>,
}

impl Published {
    /// The slots of a tree of `nodes` nodes, all unplaced.
    fn new(nodes: u32) -> Self {
        Self { slots: (0..2 * nodes).map(|_| AtomicU32::new(UNPLACED)).collect(), tables: Chunks::new(nodes as usize), runs: Chunks::new(u32::MAX as usize) }
    }

    fn slot(&self, index: NodeIndex, side: TriviaSide) -> Option<&AtomicU32> {
        self.slots.get(2 * index.get() as usize + usize::from(side == TriviaSide::Inner))
    }

    /// The slot of `side` of the node at `index`; `EMPTY` for a node the
    /// tree does not hold.
    fn load(&self, index: NodeIndex, side: TriviaSide) -> u32 {
        self.slot(index, side).map_or(EMPTY, |slot| slot.load(Ordering::Acquire))
    }

    fn table(&self, slot: u32) -> Option<&Table> {
        (slot != EMPTY && slot != UNPLACED).then(|| self.tables.get(slot as usize - 1)).flatten()
    }

    fn placed(&self, id: RunId) -> Placed {
        *self.runs.get(id.index()).expect("a placed side holds the run")
    }

    /// The heap the slots and the directories take, and the chunks made.
    fn allocation(&self) -> usize {
        std::mem::size_of_val::<[AtomicU32]>(&self.slots) + self.tables.allocation() + self.runs.allocation()
    }
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
    /// Each run's baseline gap, by its id, kept on its first measure
    /// (`Placement::keep_gap`).
    gaps: CountedMap<RunId, Option<Tally>>,
    unowned: BTreeMap<Order, NodeIndex>,
    order: BTreeMap<(u32, u32, Order), RunId>,
    runs: u32,
    tables: u32,
    /// The heap the values of `shapes`, `sims` and `stretches` hold, added
    /// as each is inserted (`hold`): what a count reads instead of walking
    /// them.
    held: usize,
    /// The heap what the placement published takes (`Published`): its
    /// slots and directories, each chunk made, and each table's heap.
    published: usize,
    steps: u64,
    stretch_steps: u64,
}

/// Holds `value` for `key` in `map`, a map whose values hold heap, keeping
/// `held` the heap they hold.
fn hold<K: Eq + std::hash::Hash, V: HeapBytes>(held: &mut usize, map: &mut CountedMap<K, V>, key: K, value: V) {
    *held += value.heap_bytes();
    if let Some(replaced) = map.insert(key, value) {
        *held -= replaced.heap_bytes();
    }
}

/// A parsed tree's trivia, placed one layout owner at a time on first read.
/// A layout owner is placed under the placement's lock, once, and published
/// (`Published`); a read of a side whose layout owner is placed takes no
/// lock.
#[derive(Debug, Default)]
pub struct Placement {
    kinds: SurfaceKinds,
    unit: u32,
    state: Mutex<State>,
    published: OnceLock<Published>,
    grown: AtomicBool,
}

/// The tree a placement reads: its nodes, through the navigation
/// interface, and the row starts of their text.
pub struct Source<'t, 'n> {
    pub nodes: &'n mut dyn Nodes<'t>,
    pub lines: &'t LineTable,
}

/// The sides placing one layout owner wrote, by node and side, each side's
/// entries in source order.
type PlacedSides = BTreeMap<(NodeIndex, TriviaSide), Vec<Assigned>>;

impl Placement {
    /// The placement of a tree whose grammar's surface kinds are `kinds`
    /// and whose indentation level is `unit` spaces wide.
    #[must_use]
    pub fn new(kinds: SurfaceKinds, unit: u32) -> Self {
        Self { kinds, unit, ..Self::default() }
    }

    fn with<'t, R>(&self, source: Source<'t, '_>, f: impl FnOnce(&mut Placer<'t, '_, '_>) -> R) -> R {
        let Source { nodes, lines } = source;
        let mut state = self.state.lock().unwrap_or_else(PoisonError::into_inner);
        self.grown.store(true, Ordering::Relaxed);
        let published = self.published.get_or_init(|| {
            let published = Published::new(nodes.kid(NodeIndex::ROOT).count);
            state.published += published.allocation();
            published
        });
        let mut placer = Placer { nodes, lines, kinds: self.kinds, unit: self.unit.max(1), state: &mut state, published, kids: HashMap::default(), plans: HashMap::default(), placed: PlacedSides::new() };
        f(&mut placer)
    }

    /// The slot of `side` of the node at `index`, `UNPLACED` before the
    /// placement published any.
    fn slot(&self, index: NodeIndex, side: TriviaSide) -> u32 {
        self.published.get().map_or(UNPLACED, |published| published.load(index, side))
    }

    /// The layout owner that holds `side` of the node at `index`, placed on
    /// the first read of a side it holds, each node it reads found through
    /// `nodes`: the table it published, `None` where placing it wrote
    /// nothing or no layout owner holds the side. Once the layout owner is
    /// placed, a read takes no lock.
    pub fn cover(&self, source: Source<'_, '_>, index: NodeIndex, side: TriviaSide) -> Option<&Table> {
        let slot = match self.slot(index, side) {
            UNPLACED => self.with(source, |placer| {
                placer.cover(index, side);
                placer.settle(index, side)
            }),
            slot => slot,
        };
        self.published.get()?.table(slot)
    }

    /// The item the list node at `index` passes the extras and `ERROR`s of
    /// its `side` to, so a coordinate of the list frames with that item's
    /// side too, read from the table of the list's layout owner (`cover`);
    /// `None` for a node that is no list or passes none.
    pub fn edge_item(&self, source: Source<'_, '_>, index: NodeIndex, side: TriviaSide) -> Option<NodeIndex> {
        self.cover(source, index, TriviaSide::Inner)?.edge_item(index, side)
    }

    /// The baseline gap kept for the run `id` (`keep_gap`): `None` before one
    /// is kept, `Some(None)` where no baseline reaches the run.
    #[must_use]
    #[allow(clippy::option_option, reason = "`None` before a gap is kept; `Some(None)` for a run no baseline reaches")]
    pub fn gap(&self, id: RunId) -> Option<Option<Tally>> {
        self.state.lock().unwrap_or_else(PoisonError::into_inner).gaps.get(&id).copied()
    }

    /// Keeps `gap` as the baseline gap of the run `id`, which a placed side
    /// holds, so it is measured once.
    pub fn keep_gap(&self, id: RunId, gap: Option<Tally>) {
        self.state.lock().unwrap_or_else(PoisonError::into_inner).gaps.insert(id, gap);
        self.grown.store(true, Ordering::Relaxed);
    }

    /// The run `id` names, which a placed side holds, read without a lock.
    ///
    /// # Panics
    ///
    /// When no placed side holds `id`.
    #[must_use]
    pub fn run(&self, id: RunId) -> LayoutRun {
        self.placed(id).run
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
        self.placed(id).from
    }

    fn placed(&self, id: RunId) -> Placed {
        self.published.get().expect("a placed side holds the run").placed(id)
    }

    /// Place every layout owner of the tree.
    #[allow(clippy::redundant_closure_for_method_calls, reason = "the method's path fixes the placer's lifetimes, which `with` takes for any")]
    pub fn place_all(&self, source: Source<'_, '_>) {
        self.with(source, |placer| placer.place_all());
    }

    /// Every table published so far, in the order the layout owners were
    /// placed.
    pub fn tables(&self) -> impl Iterator<Item = &Table> + '_ {
        self.published.get().into_iter().flat_map(|published| published.tables.values())
    }

    /// Whether the placement placed or read anything under its lock since
    /// the last call, and so may hold more than at the last count.
    pub fn take_grown(&mut self) -> bool {
        std::mem::take(self.grown.get_mut())
    }

    /// Every depth stretch the templates of the tree's nodes open, sorted
    /// by where it opens, the outer of two that open together first: the
    /// stretches structural indentation is measured from. It places no
    /// layout owner.
    #[must_use]
    pub fn depth_stretches(&self, source: Source<'_, '_>) -> Vec<(u32, u32)> {
        self.with(source, |placer| {
            placer.measure_stretches();
            placer.stretches()
        })
    }

    /// Every run placed so far, in source order.
    #[must_use]
    pub fn runs(&self) -> Vec<(RunId, LayoutRun)> {
        let state = self.state.lock().unwrap_or_else(PoisonError::into_inner);
        state.order.values().map(|&id| (id, self.run(id))).collect()
    }

    /// The first placed run, in source order, spanning `start..end`.
    #[must_use]
    pub fn run_at(&self, start: u32, end: u32) -> Option<RunId> {
        let state = self.state.lock().unwrap_or_else(PoisonError::into_inner);
        state.order.range((start, end, Order { from: 0, gap: false, left: None, step: 0 })..).next().filter(|((at, until, _), _)| *at == start && *until == end).map(|(_, &id)| id)
    }

    /// The entries no side takes, among the layout owners placed so far, in
    /// source order.
    #[must_use]
    pub fn unowned(&self) -> Vec<NodeIndex> {
        self.state.lock().unwrap_or_else(PoisonError::into_inner).unowned.values().copied().collect()
    }

    /// What the placement holds, found by walking every value it holds:
    /// what `heap_bytes` counts as it goes.
    #[cfg(test)]
    pub(crate) fn walked_bytes(&self) -> usize {
        let state = self.state.lock().unwrap_or_else(PoisonError::into_inner);
        state.walked() + self.published.get().map_or(0, |published| published.allocation() + published.tables.values().map(HeapBytes::heap_bytes).sum::<usize>())
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

struct Placer<'t, 's, 'n> {
    nodes: &'n mut dyn Nodes<'t>,
    lines: &'t LineTable,
    kinds: SurfaceKinds,
    unit: u32,
    state: &'s mut State,
    published: &'s Published,
    kids: HashMap<NodeIndex, Arc<[Kid]>, IndexState>,
    plans: HashMap<Gap, Arc<Plan>, IndexState>,
    placed: PlacedSides,
}

impl<'t> Placer<'t, '_, '_> {
    fn text(&self) -> &'t str {
        self.nodes.text()
    }

    fn len(&self) -> u32 {
        narrow(self.text().len())
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
        self.nodes.kid(index)
    }

    fn kids(&mut self, index: NodeIndex) -> Arc<[Kid]> {
        if let Some(shape) = self.state.shapes.get(&index) {
            return Arc::clone(&shape.kids);
        }
        if let Some(kids) = self.kids.get(&index) {
            return Arc::clone(kids);
        }
        let kids = self.nodes.kids(index);
        self.state.steps += kids.len() as u64;
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
        if kid.entry() {
            return None;
        }
        if kid.leaf() {
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
            if child.entry() {
                continue;
            }
            if child.leaf() {
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
        if kid.entry() {
            return None;
        }
        if kid.leaf() {
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
            if child.entry() {
                continue;
            }
            if child.leaf() {
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
            if child.entry() {
                entries.push(child);
            } else if !child.leaf() {
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
        let kids = if node.entry() { Arc::from([]) } else { self.kids(index) };
        let source = self.text();
        let (mut segments, mut entries, mut at) = (Vec::new(), Vec::new(), node.start);
        if node.entry() {
            entries.push(node);
        }
        for (position, kid) in kids.iter().enumerate() {
            self.state.parent.insert(kid.index, index);
            if let Some(token) = hidden(source, at, kid.start, |start, end| Key::before(start, end, kid.index)) {
                segments.push(Segment { first: token, last: token, kid: None });
            }
            at = kid.end;
            if kid.entry() {
                entries.push(*kid);
            } else if kid.leaf() {
                let token = Tok::leaf(kid);
                segments.push(Segment { first: token, last: token, kid: Some(position) });
            } else if let (Some(first), Some(last)) = (self.first(kid), self.last(kid)) {
                segments.push(Segment { first, last, kid: Some(position) });
            } else {
                self.entries_under(kid, &mut entries);
            }
        }
        if let Some(token) = hidden(source, at, node.end, |start, end| Key::leave(start, end, &node, 0)).filter(|_| !node.leaf() && !node.entry()) {
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
            if let Some(kid) = segment.kid.map(|kid| kids[kid]).filter(|kid| !kid.leaf()) {
                self.state.positions.insert(kid.index, position);
            }
        }
        let holds = kids.iter().any(Kid::holder);
        self.kids.remove(&index);
        let shape = Arc::new(Shape { node, root, kids, holds, segments, entries });
        hold(&mut self.state.held, &mut self.state.shapes, index, Arc::clone(&shape));
        shape
    }

    /// Whether the walk reads the node at `index`: no entry holds it.
    fn walked(&mut self, index: NodeIndex) -> bool {
        if index == NodeIndex::ROOT || self.state.parent.contains_key(&index) {
            return true;
        }
        let path = self.path(index);
        !path[..path.len() - 1].iter().any(|&at| self.kid(at).entry())
    }

    /// The nodes from the root down to the node at `index`, each one's shape
    /// above it built, so each knows its parent.
    fn path(&mut self, index: NodeIndex) -> Vec<NodeIndex> {
        let mut path = vec![index];
        while let Some(parent) = self.nodes.parent(path[path.len() - 1]) {
            path.push(parent);
        }
        path.reverse();
        for &at in &path[..path.len() - 1] {
            if self.kid(at).entry() {
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

    /// The layout owner of the node at `index`: the nearest node at or above
    /// it that is no list, or the root.
    fn layout_owner_of(&mut self, index: NodeIndex) -> NodeIndex {
        let mut at = index;
        while at != NodeIndex::ROOT && self.kinds.lists.contains(&self.kid(at).grammar) {
            match self.parent(at) {
                Some(parent) => at = parent,
                None => break,
            }
        }
        at
    }

    /// Place the layout owner that holds `side` of the node at `index`: the
    /// layout owner of the side's holder, the node's parent or, for its
    /// `inner`, the node itself. A node below an entry, and the root's
    /// leading and trailing, have none.
    fn cover(&mut self, index: NodeIndex, side: TriviaSide) {
        if self.published.load(index, side) != UNPLACED || !self.walked(index) {
            return;
        }
        let holder = match side {
            TriviaSide::Inner => Some(index),
            TriviaSide::Leading | TriviaSide::Trailing => self.parent(index),
        };
        let Some(holder) = holder else { return };
        let owner = self.layout_owner_of(holder);
        self.place_gaps_of(owner);
    }

    /// The slot of `side` of the node at `index` once `cover` placed its
    /// layout owner: `EMPTY` where no layout owner placed it.
    fn settle(&self, index: NodeIndex, side: TriviaSide) -> u32 {
        let Some(slot) = self.published.slot(index, side) else { return EMPTY };
        match slot.load(Ordering::Relaxed) {
            UNPLACED => {
                slot.store(EMPTY, Ordering::Release);
                EMPTY
            }
            slot => slot,
        }
    }

    /// Place every layout owner of the tree, from one walk of it, each after
    /// the layout owners above it.
    fn place_all(&mut self) {
        let mut owners = Vec::new();
        let mut pending = vec![self.kid(NodeIndex::ROOT)];
        while let Some(kid) = pending.pop() {
            if kid.index == NodeIndex::ROOT || (!kid.entry() && !kid.leaf() && !self.kinds.lists.contains(&kid.grammar)) {
                owners.push(kid.index);
            }
            if !kid.entry() && !kid.leaf() {
                pending.extend(self.kids(kid.index).iter().rev());
            }
        }
        for owner in owners {
            self.place_gaps_of(owner);
        }
    }

    /// The depth stretches of every node of the tree measured, from one
    /// walk of it, a parent's shape before its children's.
    fn measure_stretches(&mut self) {
        let mut pending = vec![self.kid(NodeIndex::ROOT)];
        while let Some(kid) = pending.pop() {
            let shape = (!kid.entry() && !kid.leaf()).then(|| self.shape(kid.index));
            self.level(kid.index);
            if let Some(shape) = shape {
                pending.extend(shape.kids.iter().rev());
            }
        }
    }

    /// The depth stretches measured so far (`Placement::depth_stretches`).
    fn stretches(&self) -> Vec<(u32, u32)> {
        let mut stretches: Vec<(u32, u32)> = self.state.stretches.values().flat_map(|level| level.own.iter().map(|stretch| (stretch.open, stretch.close))).collect();
        stretches.sort_by_key(|&(open, close)| (open, std::cmp::Reverse(close)));
        stretches
    }

    /// Place the gaps of the layout owner at `owner`, whose parent the
    /// placement knows: its own and those of the lists below it.
    fn place_gaps_of(&mut self, owner: NodeIndex) {
        if self.published.load(owner, TriviaSide::Inner) != UNPLACED {
            return;
        }
        let mut members = Vec::new();
        let mut stack = vec![owner];
        while let Some(at) = stack.pop() {
            members.push(at);
            let kids = Arc::clone(&self.shape(at).kids);
            stack.extend(kids.iter().rev().filter(|kid| !kid.entry() && !kid.leaf() && self.kinds.lists.contains(&kid.grammar)).map(|kid| kid.index));
        }
        let mut events: Vec<(Order, Event)> = Vec::new();
        for &member in &members {
            let shape = self.shape(member);
            let entry = self.entry_of(member);
            let (plans, after) = self.walk(&shape, entry);
            let last = after.last().copied().unwrap_or(entry);
            if !self.state.sims.contains_key(&member) {
                hold(&mut self.state.held, &mut self.state.sims, member, Arc::new(Sim { after }));
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
        self.publish(&members);
    }

    /// Publishes the sides placing a layout owner wrote, `members` being the
    /// owner and the lists below it: its table, set before the slots of its
    /// members' `inner` sides and of their children's leading and trailing
    /// sides name it. A layout owner whose gaps wrote no side and with no
    /// list passing an edge publishes none: its slots are `EMPTY`.
    fn publish(&mut self, members: &[NodeIndex]) {
        let placed = std::mem::take(&mut self.placed);
        let (mut sides, mut entries) = (Vec::with_capacity(placed.len()), Vec::new());
        for ((node, side), assigned) in placed {
            entries.extend(assigned);
            sides.push((node, side, narrow(entries.len())));
        }
        let mut adjacency = Vec::new();
        for &entry in &entries {
            if let Assigned::Error(at) | Assigned::Member(at) = entry {
                let kid = self.kid(at);
                if let Some(found) = self.adjacency(&kid) {
                    adjacency.push((at, found));
                }
            }
        }
        adjacency.sort_unstable_by_key(|&(at, _)| at);
        adjacency.dedup_by_key(|&mut (at, _)| at);
        let mut edges = Vec::new();
        for &member in members {
            let kid = self.kid(member);
            if kid.holder() && self.kinds.lists.contains(&kid.grammar) {
                for side in [TriviaSide::Leading, TriviaSide::Trailing] {
                    if let Some(item) = self.edge_item(&kid, side) {
                        edges.push((member, side, item.index));
                    }
                }
            }
        }
        edges.sort_unstable();
        let slot = if sides.is_empty() && edges.is_empty() {
            EMPTY
        } else {
            let id = self.state.tables;
            self.state.tables += 1;
            let table = Table { sides: sides.into(), entries: entries.into(), adjacency: adjacency.into(), edges: edges.into() };
            self.state.published += table.heap_bytes() + self.published.tables.set(id as usize, table);
            id + 1
        };
        let published = self.published;
        let store = |index: NodeIndex, side: TriviaSide| {
            if let Some(at) = published.slot(index, side) {
                let replaced = at.swap(slot, Ordering::Release);
                debug_assert_eq!(replaced, UNPLACED, "one layout owner holds a side: {index} {side:?}");
            }
        };
        for &member in members {
            store(member, TriviaSide::Inner);
            for kid in self.shape(member).kids.iter() {
                store(kid.index, TriviaSide::Leading);
            }
        }
        debug_assert!(published.table(slot).is_none_or(|table| table.sides().all(|((node, side), _)| published.load(node, side) == slot)), "every side a table holds names it");
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
                            let id = RunId(self.state.runs);
                            self.state.runs += 1;
                            let owner = gap.0;
                            self.state.published += self.published.runs.set(id.index(), Placed { run: LayoutRun { start: at, end: until, node, side, owner, carries, spelled }, from });
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
            Place::Side(node, side) => self.placed.entry((node, side)).or_default().push(entry),
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
            hold(&mut self.state.held, &mut self.state.sims, owner, Arc::new(Sim { after }));
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

    /// The structural indentation width at byte `at`: the innermost
    /// stretch's holding it among those from `level` up, none when no
    /// stretch does.
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
            placed.push(if self.kinds.layout.contains(&entry.grammar) {
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
                    let assigned = if entry.error() { Assigned::Error(entry.index) } else { Assigned::Extra(entry.index) };
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
            if kid.entry() {
                return Some(kid);
            }
            if kid.leaf() {
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
        if !kid.holder() || !at_edge {
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
    /// to: its first (leading) or last (trailing) holder child, when that
    /// child lies at the list's edge and is not a unit kind.
    fn edge_item(&mut self, list: &Kid, side: TriviaSide) -> Option<Kid> {
        if list.leaf() || list.entry() || !self.kinds.lists.contains(&list.grammar) {
            return None;
        }
        let kids = self.kids(list.index);
        let mut holders = kids.iter().filter(|kid| kid.holder());
        let item = if side == TriviaSide::Leading { holders.next() } else { holders.next_back() }?;
        let at_edge = if side == TriviaSide::Leading { item.start == list.start } else { item.end == list.end };
        (at_edge && !self.kinds.units.contains(&item.grammar)).then_some(*item)
    }

    /// `kid`, or, while it is a list node, its first (for a `Leading` side)
    /// or last item that holds trivia and is not a unit kind.
    fn through_lists(&mut self, kid: &Kid, side: TriviaSide) -> NodeIndex {
        let mut child = *kid;
        while !child.leaf() && self.kinds.lists.contains(&child.grammar) {
            let kids = self.kids(child.index);
            let mut items = kids.iter().filter(|kid| kid.holder() && !self.kinds.units.contains(&kid.grammar));
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
                hold(&mut self.state.held, &mut self.state.stretches, at, Level { own, up: level });
                level = Some(at);
            }
            self.state.levels.insert(at, level);
        }
        level
    }

    /// The stretches the template of the node at `index` opens, each with
    /// its width, inside those from `up` up.
    fn stretched(&mut self, index: NodeIndex, up: Option<NodeIndex>) -> Vec<Stretch> {
        let kind = self.kid(index).grammar;
        if !self.kinds.depth.iter().any(|region| region.kind == kind) {
            return Vec::new();
        }
        let shape = self.shape(index);
        let source = self.text();
        let literals: Vec<(u32, u32, &str)> = shape.kids.iter().filter(|kid| kid.leaf() && !kid.named).filter_map(|kid| Some((kid.start, kid.end, source.get(kid.start as usize..kid.end as usize)?))).collect();
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
    /// `index` inside one of width `around`: set by the line of its first
    /// token, or one unit past `around` when that token does not start its
    /// line or the stretch holds none.
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
        let start = self.lines.point(at).map_or(0, |point| at - point.column);
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
    /// (`Table::adjacency`): an entry carries the in-line run after the
    /// entry before it when that one is fixed too.
    fn adjacency(&mut self, entry: &Kid) -> Option<Adjacency> {
        let fixes = |kinds: &SurfaceKinds, kid: &Kid| kid.error() || kinds.layout.contains(&kid.grammar);
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
            let stored = (kid.error() || adjacency.holds_whitespace()).then(|| if carried.is_some() { Adjacency { before: None, ..adjacency } } else { adjacency });
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

/// One write of placing a layout owner: a step of one of its gaps, or the
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
            gaps,
            unowned,
            order,
            runs: _,
            tables: _,
            held,
            published,
            steps: _,
            stretch_steps: _,
        } = self;
        shapes.allocation()
            + parent.allocation()
            + positions.allocation()
            + firsts.allocation()
            + lasts.allocation()
            + befores.allocation()
            + afters.allocation()
            + first_gaps.allocation()
            + last_gaps.allocation()
            + sims.allocation()
            + levels.allocation()
            + stretches.allocation()
            + blanks.allocation()
            + wide.allocation()
            + ending.allocation()
            + adjacency.allocation()
            + gaps.allocation()
            + btree_allocation(unowned)
            + btree_allocation(order)
            + held
            + published
    }
}

#[cfg(test)]
impl State {
    /// What `heap_bytes` counts, found by walking every value.
    fn walked(&self) -> usize {
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
            gaps,
            unowned,
            order,
            runs: _,
            tables: _,
            held: _,
            published: _,
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
            + gaps.heap_bytes()
            + unowned.heap_bytes()
            + order.heap_bytes()
    }
}

/// What the placement holds of the layout owners placed so far, and what it
/// published of them.
impl HeapBytes for Placement {
    fn heap_bytes(&self) -> usize {
        let Self { kinds: _, unit: _, state, published: _, grown: _ } = self;
        state.lock().unwrap_or_else(PoisonError::into_inner).heap_bytes()
    }
}
