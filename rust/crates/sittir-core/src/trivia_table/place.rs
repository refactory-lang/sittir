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
//! A layout owner's writes go in the order a walk of the whole tree would
//! make them: by the byte their gap starts at, then each gap by its left
//! token.
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

use super::{owner, Assigned, Owner, Place, Sibling, SurfaceKinds, TriviaSide};
use crate::nodes::{Kid, Nodes};
use crate::read::Routed;
use crate::heap::{btree_allocation, CountedMap, HeapBytes, IndexState, ARC_COUNTS};
use crate::types::{narrow, NodeIndex, Span};
use std::collections::{BTreeMap, HashMap};
use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::sync::{Arc, Mutex, OnceLock, PoisonError};

/// Where a token falls in the walk's order: by its bytes, then, for the
/// tokens with no width, which alone can share their bytes, by their nodes'
/// ranks at that byte (`Rank`), so they keep the walk's order: a leaf goes
/// as the walk enters it, and a node's edge as the walk leaves the node,
/// the inner of two nodes it leaves at once first. Hidden text has width,
/// so its bytes are its own.
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
    /// A leaf's token: `rank` its node's at its byte when it has no width.
    fn leaf(start: u32, end: u32, rank: Option<Rank>) -> Self {
        Self { start, end, visit: rank.map_or(0, |rank| rank.enter), leaf: true, leave: 0, edge: 0 }
    }

    /// Hidden text before a child.
    fn before(start: u32, end: u32) -> Self {
        Self { start, end, visit: 0, leaf: false, leave: u32::MAX, edge: 0 }
    }

    /// Hidden text after a node's last child.
    fn after(start: u32, end: u32) -> Self {
        Self { start, end, visit: 0, leaf: false, leave: 0, edge: 0 }
    }

    /// The edge `edge` of a node at `at`, `rank` its node's there.
    fn edge(at: u32, rank: Rank, edge: u8) -> Self {
        Self { start: at, end: at, visit: rank.exit, leaf: false, leave: u32::MAX - rank.enter, edge }
    }
}

/// Where a node falls among the nodes that touch one byte, in document
/// order: `enter` counts the nodes touching the byte the walk enters before
/// it, and `exit` those it has entered when it leaves the node. A node
/// after another's subtree enters at or past that one's `exit`; of two
/// nodes that leave at once, the inner entered later.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct Rank {
    enter: u32,
    exit: u32,
}

/// A token of the walk, by its bytes and its place in the walk's order.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct Tok {
    start: u32,
    end: u32,
    key: Key,
}

impl Tok {

    fn edge(at: u32, rank: Rank, edge: u8) -> Self {
        Self { start: at, end: at, key: Key::edge(at, rank, edge) }
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
/// children that hold no token, in the walk's order, each with the gap its
/// place among the node's children puts it in (`entry_gaps`).
#[derive(Debug)]
struct Shape {
    node: Kid,
    root: bool,
    kids: Arc<[Kid]>,
    holds: bool,
    segments: Vec<Segment>,
    entries: Vec<Kid>,
    entry_gaps: Vec<u32>,
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

}

/// The entries of one gap, in source order, each with the place the
/// assignment gives it.
#[derive(Debug, Clone)]
struct Plan {
    from: u32,
    left: Option<Tok>,
    entries: Vec<(Place, Assigned)>,
}

/// A gap by its owner and the segment after it.
type Gap = (NodeIndex, usize);

/// The order of the assignment's writes: the byte the gap starts at, then
/// the gap's left token and the entry's place in the gap.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
struct Order {
    from: u32,
    left: Option<Key>,
    step: u32,
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
        let mut held = Some(value);
        let (_, made) = self.get_or_set(index, || held.take().expect("a value to set"));
        debug_assert!(held.is_none(), "a value is set once");
        made
    }

    /// The value at `index`, set to `value` when none holds it, and the
    /// heap a chunk made for it takes.
    fn get_or_set(&self, index: usize, value: impl FnOnce() -> T) -> (&T, usize) {
        let (chunk, at) = Self::locate(index);
        let mut made = 0;
        let values = self.chunks[chunk].get_or_init(|| {
            made = std::mem::size_of::<OnceLock<T>>() << chunk;
            (0..1usize << chunk).map(|_| OnceLock::new()).collect()
        });
        (values[at].get_or_init(value), made)
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

    fn edge_item(&self, index: NodeIndex, side: TriviaSide) -> Option<NodeIndex> {
        self.edges.binary_search_by_key(&(index, side), |&(list, side, _)| (list, side)).ok().map(|at| self.edges[at].2)
    }
}

impl HeapBytes for Table {
    fn heap_bytes(&self) -> usize {
        let Self { sides, entries, edges } = self;
        std::mem::size_of_val::<[(NodeIndex, TriviaSide, u32)]>(sides) + std::mem::size_of_val::<[Assigned]>(entries) + std::mem::size_of_val::<[(NodeIndex, TriviaSide, NodeIndex)]>(edges)
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
/// plus one, `UNPLACED` or `EMPTY`. A layout owner's table is set before its
/// slots are stored, with release ordering, so a read that loads
/// a slot with acquire ordering finds them.
#[derive(Debug)]
struct Published {
    slots: Slots,
    tables: Chunks<Table>,
}

/// Each node's two slots: one for every node of a tree whose nodes are
/// counted, or made as a node's is first stored, for nodes met as they are
/// read (`Nodes::bound`), which one call reads and no other thread.
#[derive(Debug)]
enum Slots {
    Counted(Box<[AtomicU32]>),
    Met(Chunks<std::cell::Cell<u32>>),
}

impl Published {
    /// The slots of a tree of `nodes` nodes, all unplaced; of any node, for
    /// a tree that counts none.
    fn new(nodes: Option<u32>) -> Self {
        let most = u32::MAX as usize;
        let slots = match nodes {
            Some(nodes) => Slots::Counted((0..2 * nodes).map(|_| AtomicU32::new(UNPLACED)).collect()),
            None => Slots::Met(Chunks::new(2 * most + 1)),
        };
        Self { slots, tables: Chunks::new(nodes.map_or(most, |nodes| nodes as usize)) }
    }

    fn at(index: NodeIndex, side: TriviaSide) -> usize {
        2 * index.get() as usize + usize::from(side == TriviaSide::Inner)
    }

    /// Stores `slot` as the slot of `side` of the node at `index`,
    /// answering the slot it held; none for a node the tree does not hold.
    fn store(&self, index: NodeIndex, side: TriviaSide, slot: u32) -> Option<u32> {
        match &self.slots {
            Slots::Counted(slots) => slots.get(Self::at(index, side)).map(|held| held.swap(slot, Ordering::Release)),
            Slots::Met(slots) => Some(slots.get_or_set(Self::at(index, side), || std::cell::Cell::new(UNPLACED)).0.replace(slot)),
        }
    }

    /// The slot of `side` of the node at `index`; `EMPTY` for a node the
    /// tree does not hold.
    fn load(&self, index: NodeIndex, side: TriviaSide) -> u32 {
        match &self.slots {
            Slots::Counted(slots) => slots.get(Self::at(index, side)).map_or(EMPTY, |slot| slot.load(Ordering::Acquire)),
            Slots::Met(slots) => slots.get(Self::at(index, side)).map_or(UNPLACED, std::cell::Cell::get),
        }
    }

    fn table(&self, slot: u32) -> Option<&Table> {
        (slot != EMPTY && slot != UNPLACED).then(|| self.tables.get(slot as usize - 1)).flatten()
    }

    /// The heap the slots and the directories take, and the chunks made.
    fn allocation(&self) -> usize {
        let slots = match &self.slots {
            Slots::Counted(slots) => std::mem::size_of_val::<[AtomicU32]>(slots),
            Slots::Met(slots) => slots.allocation(),
        };
        slots + self.tables.allocation()
    }
}

#[derive(Debug, Default)]
struct State {
    shapes: CountedMap<NodeIndex, Arc<Shape>>,
    parent: CountedMap<NodeIndex, NodeIndex>,
    firsts: CountedMap<NodeIndex, Option<Tok>>,
    lasts: CountedMap<NodeIndex, Option<Tok>>,
    unowned: BTreeMap<Order, NodeIndex>,
    tables: u32,
    /// The heap the values of `shapes` hold, added as each is inserted
    /// (`hold`): what a count reads instead of walking them.
    held: usize,
    /// The heap what the placement published takes (`Published`): its
    /// slots and directories, each chunk made, and each table's heap.
    published: usize,
    steps: u64,
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
    state: Mutex<State>,
    published: OnceLock<Published>,
    grown: AtomicBool,
}

/// The tree a placement reads: its nodes, through the navigation
/// interface, and its grammar's routes of a node's children
/// (`EngineGrammar::slot_routes`), which name the children a holder keeps
/// as fixed tokens or flags.
pub struct Source<'t, 'n> {
    pub nodes: &'n mut dyn Nodes<'t>,
    pub routes: &'n dyn Fn(&mut dyn Nodes<'t>, &Kid) -> Option<Routed>,
}

/// The sides placing one layout owner wrote, by node and side, each side's
/// entries in source order.
type PlacedSides = BTreeMap<(NodeIndex, TriviaSide), Vec<Assigned>>;

impl Placement {
    /// The placement of a tree whose grammar's surface kinds are `kinds`.
    #[must_use]
    pub fn new(kinds: SurfaceKinds) -> Self {
        Self { kinds, ..Self::default() }
    }

    fn with<'t, R>(&self, source: Source<'t, '_>, f: impl FnOnce(&mut Placer<'t, '_, '_>) -> R) -> R {
        let Source { nodes, routes } = source;
        let mut state = self.state.lock().unwrap_or_else(PoisonError::into_inner);
        self.grown.store(true, Ordering::Relaxed);
        let published = self.published.get_or_init(|| {
            let published = Published::new(nodes.bound());
            state.published += published.allocation();
            published
        });
        let counted = nodes.bound().is_some();
        let mut placer = Placer { nodes, routes, kinds: self.kinds, state: &mut state, published, kids: HashMap::default(), plans: HashMap::default(), placed: PlacedSides::new(), ranks: HashMap::default(), counted };
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

}

struct Placer<'t, 's, 'n> {
    nodes: &'n mut dyn Nodes<'t>,
    routes: &'n dyn Fn(&mut dyn Nodes<'t>, &Kid) -> Option<Routed>,
    kinds: SurfaceKinds,
    state: &'s mut State,
    published: &'s Published,
    kids: HashMap<NodeIndex, Arc<[Kid]>, IndexState>,
    plans: HashMap<Gap, Arc<Plan>, IndexState>,
    placed: PlacedSides,
    /// Each node's rank at a byte, for the bytes a token with no width was
    /// asked at.
    ranks: HashMap<u32, HashMap<NodeIndex, Rank, IndexState>, IndexState>,
    /// Whether the tree numbers its nodes in walk order and counts each
    /// one's (`Nodes::bound`), so a node's rank is its index and count.
    counted: bool,
}

impl<'t> Placer<'t, '_, '_> {
    fn text(&self) -> &'t str {
        self.nodes.text()
    }

    /// The rank at `byte` of `node`, which touches it. A counted tree's is
    /// its index and the index past its last node; elsewhere every node
    /// touching the byte is ranked on the first ask, in one walk from the
    /// root that enters only those, found among each node's children by
    /// their order in the source.
    fn rank(&mut self, byte: u32, node: &Kid) -> Rank {
        let index = node.index;
        if self.counted {
            return Rank { enter: index.get(), exit: index.get() + node.count };
        }
        if !self.ranks.contains_key(&byte) {
            let mut ranks: HashMap<NodeIndex, Rank, IndexState> = HashMap::default();
            let touching = |kids: &crate::nodes::Kids| kids.partition_point(|kid| kid.end < byte);
            let root = self.nodes.kids(NodeIndex::ROOT);
            let from = touching(&root);
            let mut entered: Vec<(NodeIndex, u32, crate::nodes::Kids, usize)> = vec![(NodeIndex::ROOT, 0, root, from)];
            let mut count = 1;
            while let Some((node, enter, kids, next)) = entered.last_mut() {
                if let Some(kid) = kids.get(*next).filter(|kid| kid.start <= byte) {
                    *next += 1;
                    let (kid, enter) = (kid.index, count);
                    count += 1;
                    let kids = self.nodes.kids(kid);
                    let from = touching(&kids);
                    entered.push((kid, enter, kids, from));
                } else {
                    ranks.insert(*node, Rank { enter: *enter, exit: count });
                    entered.pop();
                }
            }
            self.ranks.insert(byte, ranks);
        }
        let rank = self.ranks.get(&byte).and_then(|ranks| ranks.get(&index)).copied();
        debug_assert!(rank.is_some(), "a node ranked at a byte touches it");
        rank.unwrap_or(Rank { enter: 0, exit: 0 })
    }

    fn leaf_tok(&mut self, kid: &Kid) -> Tok {
        let rank = (kid.start == kid.end).then(|| self.rank(kid.start, kid));
        Tok { start: kid.start, end: kid.end, key: Key::leaf(kid.start, kid.end, rank) }
    }

    fn start_edge(&mut self, node: &Kid) -> Tok {
        Tok::edge(node.start, self.rank(node.start, node), 1)
    }

    fn end_edge(&mut self, node: &Kid) -> Tok {
        Tok::edge(node.end, self.rank(node.end, node), 2)
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
            return Some(self.leaf_tok(kid));
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
                let after = hidden(source, frame.at, node.end, Key::after);
                if after.is_some() {
                    break after;
                }
                frames.pop();
                self.state.firsts.insert(node.index, None);
                continue;
            };
            frame.next += 1;
            let before = hidden(source, frame.at, child.start, Key::before);
            frame.at = child.end;
            if before.is_some() {
                break before;
            }
            if child.entry() {
                continue;
            }
            if child.leaf() {
                break Some(self.leaf_tok(&child));
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
                found = self.start_edge(&frame.node);
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
            return Some(self.leaf_tok(kid));
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
                let before = hidden(source, node.start, frame.at, |start, end| if first.is_some() { Key::before(start, end) } else { Key::after(start, end) });
                if before.is_some() {
                    break before;
                }
                frames.pop();
                self.state.lasts.insert(node.index, None);
                continue;
            }
            let child = frame.kids[frame.left - 1];
            let next = frame.kids.get(frame.left).map(|kid| kid.index);
            let after = hidden(source, child.end, frame.at, |start, end| if next.is_some() { Key::before(start, end) } else { Key::after(start, end) });
            frame.left -= 1;
            frame.at = child.start;
            if after.is_some() {
                break after;
            }
            if child.entry() {
                continue;
            }
            if child.leaf() {
                break Some(self.leaf_tok(&child));
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
                found = self.end_edge(&frame.node);
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
        let (mut segments, mut entries, mut entry_gaps, mut at) = (Vec::new(), Vec::new(), Vec::new(), node.start);
        for (position, kid) in kids.iter().enumerate() {
            self.state.parent.insert(kid.index, index);
            if let Some(token) = hidden(source, at, kid.start, Key::before) {
                segments.push(Segment { first: token, last: token, kid: None });
            }
            at = kid.end;
            if kid.entry() {
                entries.push(*kid);
            } else if kid.leaf() {
                let token = self.leaf_tok(kid);
                segments.push(Segment { first: token, last: token, kid: Some(position) });
            } else if let (Some(first), Some(last)) = (self.first(kid), self.last(kid)) {
                segments.push(Segment { first, last, kid: Some(position) });
            } else {
                self.entries_under(kid, &mut entries);
            }
            entry_gaps.resize(entries.len(), narrow(segments.len()));
        }
        if let Some(token) = hidden(source, at, node.end, Key::after).filter(|_| !node.leaf() && !node.entry()) {
            segments.push(Segment { first: token, last: token, kid: None });
        }
        if !root {
            if let (Some(first), Some(last)) = (segments.first().map(|segment| segment.first), segments.last().map(|segment| segment.last)) {
                if node.start < first.start {
                    let edge = self.start_edge(&node);
                    segments.insert(0, Segment { first: edge, last: edge, kid: None });
                    for gap in &mut entry_gaps {
                        *gap += 1;
                    }
                }
                if node.end > last.end {
                    let edge = self.end_edge(&node);
                    segments.push(Segment { first: edge, last: edge, kid: None });
                }
            }
        }
        let holds = kids.iter().any(Kid::holder);
        self.kids.remove(&index);
        let shape = Arc::new(Shape { node, root, kids, holds, segments, entries, entry_gaps });
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

    /// The nodes down to the node at `index` from the nearest at or above it
    /// whose parent is known (or the root), each one's shape above it
    /// built, so each knows its parent. A known parent was shaped by a walk,
    /// which holds no entry above it.
    fn path(&mut self, index: NodeIndex) -> Vec<NodeIndex> {
        let mut path = vec![index];
        while !self.state.parent.contains_key(&path[path.len() - 1]) {
            let Some(parent) = self.nodes.parent(path[path.len() - 1]) else { break };
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

    /// The layout owner of the node at `index`: the nearest node at or above
    /// it that the surface does not expose in its place (no list or
    /// wrapper, `SurfaceKinds::exposes_in_place`), or the root.
    fn layout_owner_of(&mut self, index: NodeIndex) -> NodeIndex {
        let mut at = index;
        while at != NodeIndex::ROOT {
            let kind = self.kid(at).grammar;
            match self.parent(at).filter(|_| self.kinds.exposes_in_place(kind)) {
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
        match self.published.load(index, side) {
            UNPLACED => {
                self.published.store(index, side, EMPTY);
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
            if kid.index == NodeIndex::ROOT || (!kid.entry() && !kid.leaf() && !self.kinds.exposes_in_place(kid.grammar)) {
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
            stack.extend(kids.iter().rev().filter(|kid| !kid.entry() && !kid.leaf() && self.kinds.exposes_in_place(kid.grammar)).map(|kid| kid.index));
        }
        let mut events: Vec<(Order, Place, Assigned)> = Vec::new();
        for &member in &members {
            let shape = self.shape(member);
            for gap in shape.gaps() {
                let plan = self.plan(&shape, gap);
                let left = plan.left.map(|token| token.key);
                for (step, &(place, entry)) in plan.entries.iter().enumerate() {
                    events.push((Order { from: plan.from, left, step: narrow(step) }, place, entry));
                }
            }
        }
        events.sort_by_key(|&(order, ..)| order);
        for (order, place, entry) in events {
            self.push(place, entry, order);
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
        let mut edges = Vec::new();
        for &member in members {
            let kid = self.kid(member);
            if kid.holder() && self.kinds.exposes_in_place(kid.grammar) {
                for side in [TriviaSide::Leading, TriviaSide::Trailing] {
                    if let Some(item) = self.edge_item(&kid, side) {
                        edges.push((member, side, item.index));
                    }
                }
            }
        }
        let mut from = 0;
        for &(node, side, end) in &sides {
            let held = &entries[from..end as usize];
            from = end as usize;
            let spans = held.iter().map(|entry| {
                let kid = self.kid(entry.index());
                (kid.start, kid.end)
            });
            let reach = match side {
                TriviaSide::Leading => spans.map(|(start, _)| start).min(),
                TriviaSide::Trailing => spans.map(|(_, end)| end).max(),
                TriviaSide::Inner => None,
            };
            let Some(reach) = reach else { continue };
            let (mut child, mut at) = (node, self.parent(node));
            while let Some(holder) = at.filter(|holder| members.contains(holder)) {
                let kid = self.kid(holder);
                let past = if side == TriviaSide::Leading { reach < kid.start } else { reach > kid.end };
                if !past {
                    break;
                }
                if !edges.iter().any(|&(list, edge, _)| list == holder && edge == side) {
                    edges.push((holder, side, child));
                }
                child = holder;
                at = self.parent(holder);
            }
        }
        edges.sort_unstable();
        let slot = if sides.is_empty() && edges.is_empty() {
            EMPTY
        } else {
            let id = self.state.tables;
            self.state.tables += 1;
            let table = Table { sides: sides.into(), entries: entries.into(), edges: edges.into() };
            self.state.published += table.heap_bytes() + self.published.tables.set(id as usize, table);
            id + 1
        };
        let published = self.published;
        let store = |index: NodeIndex, side: TriviaSide| {
            if let Some(replaced) = published.store(index, side, slot) {
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

    fn push(&mut self, place: Place, entry: Assigned, order: Order) {
        match place {
            Place::Side(node, side) => self.placed.entry((node, side)).or_default().push(entry),
            Place::Unowned => {
                self.state.unowned.insert(order, entry.index());
            }
        }
    }

    fn plan(&mut self, shape: &Shape, gap: usize) -> Arc<Plan> {
        let key = (shape.node.index, gap);
        if let Some(plan) = self.plans.get(&key) {
            return Arc::clone(plan);
        }
        let left = shape.left(gap);
        let from = left.map_or(0, |token| token.end);
        let entries: Vec<Kid> = shape.entries.iter().zip(&shape.entry_gaps).filter(|&(_, &at)| at as usize == gap).map(|(&entry, _)| entry).collect();
        let default = self.place(shape, gap);
        let mut placed = Vec::with_capacity(entries.len());
        for entry in &entries {
            placed.push((!self.kinds.layout.contains(&entry.grammar)).then(|| self.owned(shape, gap, entry)));
        }
        let trailed = placed.iter().rposition(|placed| matches!(placed, Some(Place::Side(_, TriviaSide::Trailing))));
        let mut assigned = Vec::with_capacity(entries.len());
        let mut led = None;
        for (i, entry) in entries.iter().enumerate() {
            let beside = match trailed {
                Some(last) if i <= last => placed[last],
                _ => led,
            };
            match placed[i] {
                None => assigned.push((beside.unwrap_or(default), Assigned::Member(entry.index))),
                Some(place) => {
                    led = matches!(place, Place::Side(_, TriviaSide::Leading)).then_some(place);
                    assigned.push((place, if entry.error() { Assigned::Error(entry.index) } else { Assigned::Extra(entry.index) }));
                }
            }
        }
        let plan = Arc::new(Plan { from, left, entries: assigned });
        self.plans.insert(key, Arc::clone(&plan));
        plan
    }

    /// Where a layout member of the gap goes when no extra or `ERROR` beside
    /// it places it: leading the child after the gap, else trailing the one
    /// before it, each at its edge of the gap; the owner's `inner` when no
    /// child holds sides; else no side.
    fn place(&mut self, shape: &Shape, gap: usize) -> Place {
        let owner = shape.node.index;
        if !shape.holds {
            return Place::Side(owner, TriviaSide::Inner);
        }
        let after = shape.segments.get(gap).copied().and_then(|segment| self.side_holder(shape, segment.kid, false, TriviaSide::Leading, segment.first.start));
        let before = || gap.checked_sub(1).map(|at| shape.segments[at]);
        match after {
            Some(after) => Place::Side(after, TriviaSide::Leading),
            None => before().and_then(|segment| self.side_holder(shape, segment.kid, false, TriviaSide::Trailing, segment.last.end)).map_or(Place::Unowned, |before| Place::Side(before, TriviaSide::Trailing)),
        }
    }

    /// Where `entry`, an extra or `ERROR` of the gap, goes (`trivia_table::owner`),
    /// the segments before and after the gap its siblings. A child is a holder
    /// beside the gap only where its tokens reach the gap; one the answer
    /// reaches beside the gap passes the entry to a list's
    /// item at its edge (`side_holder`), and one it reaches across other
    /// children to a list's first or last item (`through_lists`).
    fn owned(&mut self, shape: &Shape, gap: usize, entry: &Kid) -> Place {
        if !shape.holds {
            return Place::Side(shape.node.index, TriviaSide::Inner);
        }
        let routed = (self.routes)(&mut *self.nodes, &shape.node);
        let sibling = |segment: &Segment, edge: fn(&Kid, &Segment) -> bool| Sibling {
            span: Span { start: segment.first.start, end: segment.last.end },
            holder: segment.kid.is_some_and(|kid| shape.kids[kid].holder() && edge(&shape.kids[kid], segment)),
            entry: false,
            flag: segment.kid.zip(routed.as_ref()).is_some_and(|(kid, routed)| routed.is_flag(shape.kids[kid].index)),
        };
        let before: Vec<Sibling> = shape.segments[..gap].iter().map(|segment| sibling(segment, |kid, segment| kid.end == segment.last.end)).collect();
        let after: Vec<Sibling> = shape.segments[gap..].iter().map(|segment| sibling(segment, |kid, segment| kid.start == segment.first.start)).collect();
        let kid = |at: usize| shape.segments[at].kid.map(|kid| shape.kids[kid]);
        match owner(&before, entry.span(), &after, self.text()) {
            Owner::Trailing { at } => {
                let segment = shape.segments[at];
                let node = if at + 1 == gap {
                    self.side_holder(shape, segment.kid, true, TriviaSide::Trailing, segment.last.end)
                } else {
                    kid(at).map(|kid| self.through_lists(&kid, TriviaSide::Trailing))
                };
                node.map_or(Place::Unowned, |node| Place::Side(node, TriviaSide::Trailing))
            }
            Owner::Leading { at } => {
                let segment = shape.segments[gap + at];
                let node = if at == 0 {
                    self.side_holder(shape, segment.kid, true, TriviaSide::Leading, segment.first.start)
                } else {
                    kid(gap + at).map(|kid| self.through_lists(&kid, TriviaSide::Leading))
                };
                node.map_or(Place::Unowned, |node| Place::Side(node, TriviaSide::Leading))
            }
            Owner::Inner => Place::Side(shape.node.index, TriviaSide::Inner),
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
    /// to (`trivia_table::edge_item`).
    fn edge_item(&mut self, list: &Kid, side: TriviaSide) -> Option<Kid> {
        super::edge_item(list, self.kinds, side, || self.kids(list.index))
    }

    /// `kid`, or, while it is a list or wrapper node
    /// (`SurfaceKinds::exposes_in_place`), its first (for a `Leading` side)
    /// or last item that holds trivia and is not a unit kind.
    fn through_lists(&mut self, kid: &Kid, side: TriviaSide) -> NodeIndex {
        let mut child = *kid;
        while !child.leaf() && self.kinds.exposes_in_place(child.grammar) {
            let kids = self.kids(child.index);
            let mut items = kids.iter().filter(|kid| kid.holder() && !self.kinds.units.contains(&kid.grammar));
            match if side == TriviaSide::Leading { items.next() } else { items.next_back() } {
                Some(&inner) => child = inner,
                None => break,
            }
        }
        child.index
    }

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

no_heap!(Key, Tok, Kid, Segment, Order);

impl HeapBytes for Shape {
    fn heap_bytes(&self) -> usize {
        let Self { node: _, root: _, kids, holds: _, segments, entries, entry_gaps } = self;
        ARC_COUNTS + std::mem::size_of_val::<[Kid]>(kids) + segments.heap_bytes() + entries.heap_bytes() + std::mem::size_of_val::<[u32]>(entry_gaps.as_slice())
    }
}

impl HeapBytes for State {
    fn heap_bytes(&self) -> usize {
        let Self {
            shapes,
            parent,
            firsts,
            lasts,
            unowned,
            tables: _,
            held,
            published,
            steps: _,
        } = self;
        shapes.allocation()
            + parent.allocation()
            + firsts.allocation()
            + lasts.allocation()
            + btree_allocation(unowned)
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
            firsts,
            lasts,
            unowned,
            tables: _,
            held: _,
            published: _,
            steps: _,
        } = self;
        shapes.heap_bytes()
            + parent.heap_bytes()
            + firsts.heap_bytes()
            + lasts.heap_bytes()
            + unowned.heap_bytes()
    }
}

/// What the placement holds of the layout owners placed so far, and what it
/// published of them.
impl HeapBytes for Placement {
    fn heap_bytes(&self) -> usize {
        let Self { kinds: _, state, published: _, grown: _ } = self;
        state.lock().unwrap_or_else(PoisonError::into_inner).heap_bytes()
    }
}
