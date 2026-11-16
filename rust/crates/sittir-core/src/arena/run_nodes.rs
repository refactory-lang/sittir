//! Navigation over parsed records alone (`Nodes`): a node's facts from its
//! record's side record or its row in its holder's run, its children from
//! that run, in document order, and its parent from its record's parent
//! word. No table of the tree's nodes is kept: a navigation holds the nodes
//! it has met. A node's id is its place in a preorder walk of its source's
//! tree, the root's 0, as its record's side record stamps it
//! (`side::Order`) or, for a node with no record, as its holder's run
//! places it (`Walk::placed`).

use std::collections::HashMap;

use super::side::{NodeFacts, Order, RunEntry};
use super::{Address, ArenaError, ArenaRead, SideRecord};
use crate::nodes::{Kid, Kids, Nodes};
use crate::options::Side;
use crate::types::{NodeIndex, Span};

/// Where a node is kept: its own record, or the entry of its row in the run
/// of the record `holder`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum NodeSite {
    Record(Address),
    Row { holder: Address, entry: u32 },
}

/// A node's parent as a navigation knows it: not looked up yet, none (a
/// source's root), or the node.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Parent {
    Unknown,
    Root,
    Node(NodeIndex),
}

struct Met {
    site: NodeSite,
    kid: Kid,
    facts: NodeFacts,
    parent: Parent,
    kids: Option<Kids>,
}

/// A record's side record as a navigation has read it: where the record
/// is, its facts, where its run lies, whether the run's entries are read
/// into it yet and with them the contents it shares its node with, each
/// entry's place in the walk once the run is placed (`Walk::placed`), and
/// where the table keeps the record that is its node, once found
/// (`Walk::node_of`).
struct Read {
    at: Address,
    side: SideRecord,
    run: Option<super::side::RunAt>,
    listed: bool,
    shared: Vec<Address>,
    places: Option<Vec<Order>>,
    node: Option<usize>,
}

const PAGE: usize = 64;

/// The nodes a navigation has met, each at its id: pages made as a node of
/// theirs is first met, so a call that reads part of a source holds that
/// part.
#[derive(Default)]
struct Pages(Vec<Option<Box<[Option<Met>; PAGE]>>>);

impl Pages {
    fn get(&self, index: NodeIndex) -> Option<&Met> {
        self.0.get(index.0 as usize / PAGE)?.as_ref()?[index.0 as usize % PAGE].as_ref()
    }

    fn get_mut(&mut self, index: NodeIndex) -> Option<&mut Met> {
        self.0.get_mut(index.0 as usize / PAGE)?.as_mut()?[index.0 as usize % PAGE].as_mut()
    }

    fn slot(&mut self, index: NodeIndex) -> &mut Option<Met> {
        let page = index.0 as usize / PAGE;
        if self.0.len() <= page {
            self.0.resize_with(page + 1, || None);
        }
        &mut self.0[page].get_or_insert_with(|| Box::new(std::array::from_fn(|_| None)))[index.0 as usize % PAGE]
    }
}

#[derive(Default)]
struct Table {
    met: Pages,
    sides: HashMap<Address, usize, crate::heap::IndexState>,
    read: Vec<Read>,
    refused: Option<ArenaError>,
}

/// The nodes the navigations of one call have met in one source, by the
/// ids they gave them: every navigation over the table names a node alike.
#[derive(Default)]
pub struct RunTable(crate::engine::PerCall<Table>);

impl RunTable {
    /// Where the node `index` names is kept; none for an id no navigation
    /// gave.
    #[must_use]
    pub fn site(&self, index: NodeIndex) -> Option<NodeSite> {
        self.0.with(|table| table.met.get(index).map(|met| met.site))
    }
}

/// Navigation over the parsed records of one source, in `arena`, naming
/// each node by its id in `table`.
#[derive(Clone, Copy)]
pub struct RunNodes<'t> {
    arena: &'t dyn ArenaRead,
    text: &'t str,
    table: &'t RunTable,
}

/// One answer's read of the records, with the table held for it.
struct Walk<'a> {
    arena: &'a dyn ArenaRead,
    table: &'a mut Table,
}

fn malformed(what: &'static str, at: Address) -> ArenaError {
    ArenaError::Malformed { what, word: at.0 }
}

impl<'t> RunNodes<'t> {
    /// Navigation of the source the record at `record` was read from, its
    /// bytes indexing `text`, over `table`, which holds that source's nodes
    /// alone: the source's root, which the parents of `record` lead to, is
    /// its first.
    ///
    /// # Errors
    ///
    /// What reading the record or a record above it refuses.
    pub fn holding(arena: &'t dyn ArenaRead, text: &'t str, record: Address, table: &'t RunTable) -> Result<Self, ArenaError> {
        let nodes = Self { arena, text, table };
        nodes.answering(|walk| {
            let mut root = record;
            while let Some(parent) = walk.side(root)?.parent {
                root = parent;
            }
            walk.record(root, Parent::Root)
        })?;
        Ok(nodes)
    }

    /// Navigation over `table`, which a navigation of the source rooted
    /// (`holding`).
    #[must_use]
    pub fn over(arena: &'t dyn ArenaRead, text: &'t str, table: &'t RunTable) -> Self {
        Self { arena, text, table }
    }

    fn answering<R>(&self, f: impl FnOnce(&mut Walk<'_>) -> R) -> R {
        self.table.0.with(|table| f(&mut Walk { arena: self.arena, table }))
    }

    /// What a read of the records refused, when one did: the nodes it was
    /// answering for read as leaves.
    #[must_use]
    pub fn refused(&self) -> Option<ArenaError> {
        self.answering(|walk| walk.table.refused.clone())
    }

    /// Where the node `index` names is kept.
    #[must_use]
    pub fn site(&self, index: NodeIndex) -> Option<NodeSite> {
        self.table.site(index)
    }

    /// The id of the node whose record is at `at`.
    ///
    /// # Errors
    ///
    /// What reading the record refuses.
    pub fn index_of(&mut self, at: Address) -> Result<NodeIndex, ArenaError> {
        self.answering(|walk| walk.record(at, Parent::Unknown))
    }

    /// The id of the node a cell of the record at `holder` names by `row`:
    /// the holder's own node for 1, else the row two before `row` among the
    /// entries of its run.
    ///
    /// # Errors
    ///
    /// What reading the holder's record refuses, and
    /// `ArenaError::Malformed` for row 0 and for an entry that is no row.
    pub fn row_index(&mut self, holder: Address, row: u32) -> Result<NodeIndex, ArenaError> {
        self.answering(|walk| walk.row_index(holder, row))
    }

    /// The id of the node kept at `site`; none, with the refusal noted
    /// (`refused`), for a site no record of the arena holds.
    pub fn index_at(&mut self, site: NodeSite) -> Option<NodeIndex> {
        self.answering(|walk| {
            let met = match site {
                NodeSite::Record(at) => walk.record(at, Parent::Unknown),
                NodeSite::Row { holder, entry } => walk.row_index(holder, entry + 2),
            };
            walk.answer(met.map(Some), None)
        })
    }

    /// The levels the node at `index` opens net of those it closes, by the
    /// depth members of `kinds`: its record's stamp, or, for a node with no
    /// record, its own kind's, those of the rows inside it and the stamps of
    /// the records there.
    ///
    /// # Errors
    ///
    /// What reading its record or its holder's refuses.
    pub fn depth_move(&mut self, index: NodeIndex, kinds: crate::trivia_table::SurfaceKinds) -> Result<i32, ArenaError> {
        self.answering(|walk| walk.depth_move(index, kinds))
    }

    /// The entry of the source the record at `at` was read from.
    ///
    /// # Errors
    ///
    /// What reading the record refuses, and `ArenaError::Malformed` for a
    /// record that names no source.
    pub fn source_of(arena: &dyn ArenaRead, at: Address) -> Result<Address, ArenaError> {
        let header = arena.words(at, crate::record::HEADER_WORDS)?;
        SideRecord::read_facts(arena, Address(header[1]))?.0.source.map(Address).ok_or(malformed("parsed record source", at))
    }

}

impl Walk<'_> {
    fn site(&self, index: NodeIndex) -> Option<NodeSite> {
        self.table.met.get(index).map(|met| met.site)
    }

    fn row_index(&mut self, holder: Address, row: u32) -> Result<NodeIndex, ArenaError> {
        if row == 1 {
            return self.record(holder, Parent::Unknown);
        }
        let entry = row.checked_sub(2).ok_or(malformed("cell row", holder))?;
        let Some(&RunEntry::Row { facts, span, .. }) = self.run(holder)?.get(entry as usize) else { return Err(malformed("cell row", holder)) };
        let order = self.placed(holder, entry)?;
        Ok(self.meet(NodeSite::Row { holder, entry }, order, facts, span, Parent::Unknown))
    }

    /// The node the row at `entry` of the run of `holder` lies under: the
    /// innermost row of the run that holds it, else the holder's node.
    fn above(&mut self, holder: Address, entry: u32) -> Result<NodeIndex, ArenaError> {
        let run = self.run(holder)?;
        let (mut at, mut inside) = (0, None);
        while at < entry as usize {
            match *run.get(at).ok_or(malformed("run row entries", holder))? {
                RunEntry::Row { facts, span, inner } if at + inner as usize >= entry as usize => {
                    inside = Some((at, facts, span));
                    at += 1;
                }
                RunEntry::Row { inner, .. } => at += 1 + inner as usize,
                RunEntry::Record { .. } => at += 1,
            }
        }
        match inside {
            Some((entry, facts, span)) => {
                let entry = crate::types::narrow(entry);
                let order = self.placed(holder, entry)?;
                Ok(self.meet(NodeSite::Row { holder, entry }, order, facts, span, Parent::Unknown))
            }
            None => self.record(holder, Parent::Unknown),
        }
    }

    /// Where the table keeps the side record of the record at `at`, its
    /// facts read once.
    fn read(&mut self, at: Address) -> Result<usize, ArenaError> {
        if let Some(&read) = self.table.sides.get(&at) {
            return Ok(read);
        }
        let header = self.arena.words(at, crate::record::HEADER_WORDS)?;
        let (side, run) = SideRecord::read_facts(self.arena, Address(header[1]))?;
        self.table.read.push(Read { at, side, run, listed: false, shared: Vec::new(), places: None, node: None });
        self.table.sides.insert(at, self.table.read.len() - 1);
        Ok(self.table.read.len() - 1)
    }

    /// The facts of the side record of the record at `at`: every field but
    /// its slots and its run.
    fn side(&mut self, at: Address) -> Result<&SideRecord, ArenaError> {
        let read = self.read(at)?;
        Ok(&self.table.read[read].side)
    }

    /// Reads the entries of the run of the record kept at `read`, on the
    /// first ask, and with them the contents the record shares its node
    /// with.
    fn list(&mut self, read: usize) -> Result<(), ArenaError> {
        let Read { side, run, listed, shared, .. } = &mut self.table.read[read];
        if !*listed {
            if let Some(run) = run {
                side.run = run.entries(self.arena)?;
            }
            shared.extend(side.run.iter().filter_map(|entry| match *entry {
                RunEntry::Record { at, shared: true } => Some(at),
                _ => None,
            }));
            *listed = true;
        }
        Ok(())
    }

    /// The run of the record at `at`, its entries read on the first ask.
    fn run(&mut self, at: Address) -> Result<&[RunEntry], ArenaError> {
        let read = self.read(at)?;
        self.list(read)?;
        Ok(&self.table.read[read].side.run)
    }

    /// Where the table keeps the record that is the node of the record
    /// kept at `read`: itself, or, for a content read from its envelope's
    /// own node, its envelope's.
    fn node_of(&mut self, read: usize) -> Result<usize, ArenaError> {
        if let Some(node) = self.table.read[read].node {
            return Ok(node);
        }
        let mut node = read;
        while let Some(parent) = self.table.read[node].side.parent {
            let parent = self.read(parent)?;
            self.list(parent)?;
            if !self.table.read[parent].shared.contains(&self.table.read[node].at) {
                break;
            }
            node = parent;
        }
        self.table.read[read].node = Some(node);
        Ok(node)
    }

    /// The place in the walk of the entry at `entry` of the run of the
    /// record at `holder` (`placed_at`).
    fn placed(&mut self, holder: Address, entry: u32) -> Result<Order, ArenaError> {
        let read = self.read(holder)?;
        self.placed_at(read, entry)
    }

    /// The place in the walk of the entry at `entry` of the run of the
    /// record kept at `read`. A run is placed whole on the first ask, from
    /// its record's own place: each entry follows the one before it, a row
    /// taking one index and then its inner entries, a child's record the
    /// count its side record stamps. A content sharing its envelope's node
    /// is placed by its envelope's run, where its entries lie.
    fn placed_at(&mut self, read: usize, entry: u32) -> Result<Order, ArenaError> {
        if self.table.read[read].places.is_none() {
            let node = self.node_of(read)?;
            let at = self.table.read[node].at;
            let Order { index, count } = self.table.read[node].side.order.ok_or(malformed("parsed record order", at))?;
            let mut next = index.0 + 1;
            self.place_run(node, &mut next)?;
            if next != index.0 + count {
                return Err(malformed("parsed record count", at));
            }
        }
        let Read { at, places, .. } = &self.table.read[read];
        places.as_ref().and_then(|places| places.get(entry as usize)).copied().ok_or(malformed("run entry", *at))
    }

    fn place_run(&mut self, read: usize, next: &mut u32) -> Result<(), ArenaError> {
        self.list(read)?;
        let run = std::mem::take(&mut self.table.read[read].side.run);
        let placed = self.place_entries(&run, next);
        let kept = &mut self.table.read[read];
        kept.side.run = run;
        kept.places = Some(placed?);
        Ok(())
    }

    fn place_entries(&mut self, run: &[RunEntry], next: &mut u32) -> Result<Vec<Order>, ArenaError> {
        let mut places = vec![Order { index: NodeIndex(0), count: 0 }; run.len()];
        let mut open: Vec<(usize, usize)> = Vec::new();
        let close = |places: &mut Vec<Order>, open: &mut Vec<(usize, usize)>, at: usize, next: u32| {
            while let Some(&(row, _)) = open.last().filter(|&&(_, end)| end <= at) {
                places[row].count = next - places[row].index.0;
                open.pop();
            }
        };
        for (at, entry) in run.iter().enumerate() {
            close(&mut places, &mut open, at, *next);
            match *entry {
                RunEntry::Row { inner, .. } => {
                    places[at].index = NodeIndex(*next);
                    *next += 1;
                    open.push((at, at + 1 + inner as usize));
                }
                RunEntry::Record { at: content, shared: true } => {
                    let content = self.read(content)?;
                    self.place_run(content, next)?;
                }
                RunEntry::Record { at: child, shared: false } => {
                    let order = self.side(child)?.order.ok_or(malformed("parsed record order", child))?;
                    if order.index.0 != *next {
                        return Err(malformed("parsed record index", child));
                    }
                    places[at] = order;
                    *next += order.count;
                }
            }
        }
        close(&mut places, &mut open, usize::MAX, *next);
        Ok(places)
    }

    fn meet(&mut self, site: NodeSite, order: Order, facts: NodeFacts, span: Span, parent: Parent) -> NodeIndex {
        let Order { index, count } = order;
        let slot = self.table.met.slot(index);
        if let Some(met) = slot {
            if met.parent == Parent::Unknown {
                met.parent = parent;
            }
        } else {
            let kid = Kid { index, start: span.start, end: span.end, count, grammar: facts.kind, display: facts.display(), field: facts.field, named: facts.named, extra: facts.extra };
            *slot = Some(Met { site, kid, facts, parent, kids: None });
        }
        index
    }

    /// The id of the node of the record at `at`.
    fn record(&mut self, at: Address, parent: Parent) -> Result<NodeIndex, ArenaError> {
        let read = self.read(at)?;
        let node = self.node_of(read)?;
        self.met_record(node, parent)
    }

    /// The id of the node the record kept at `read` is.
    fn met_record(&mut self, read: usize, parent: Parent) -> Result<NodeIndex, ArenaError> {
        let Read { at, side, .. } = &self.table.read[read];
        let facts = side.node.ok_or(malformed("parsed record facts", *at))?;
        let span = side.at.ok_or(malformed("parsed record row", *at))?.span;
        let order = side.order.ok_or(malformed("parsed record order", *at))?;
        Ok(self.meet(NodeSite::Record(*at), order, facts, span, parent))
    }

    /// The entries of the children of the node whose record is kept at
    /// `read`, each with where the record whose run holds it is kept and
    /// its place there: its own run's, a shared content's in place of the
    /// content.
    fn entries(&mut self, read: usize) -> Result<Vec<(usize, u32, RunEntry)>, ArenaError> {
        let mut out = Vec::new();
        self.entries_into(read, &mut out)?;
        Ok(out)
    }

    fn entries_into(&mut self, read: usize, out: &mut Vec<(usize, u32, RunEntry)>) -> Result<(), ArenaError> {
        self.list(read)?;
        let run = std::mem::take(&mut self.table.read[read].side.run);
        let mut walked = Ok(());
        let mut entry = 0;
        while let Some(&found) = run.get(entry) {
            match found {
                RunEntry::Record { at: content, shared: true } => {
                    walked = self.read(content).and_then(|content| self.entries_into(content, out));
                    if walked.is_err() {
                        break;
                    }
                }
                found => out.push((read, crate::types::narrow(entry), found)),
            }
            entry += 1 + match found {
                RunEntry::Row { inner, .. } => inner as usize,
                RunEntry::Record { .. } => 0,
            };
        }
        self.table.read[read].side.run = run;
        walked
    }

    /// The entries inside the row at `entry` of the run of the record kept
    /// at `read`, one level down.
    fn inside(&mut self, read: usize, entry: u32) -> Result<Vec<(usize, u32, RunEntry)>, ArenaError> {
        self.list(read)?;
        let Read { at: holder, side, .. } = &self.table.read[read];
        let Some(&RunEntry::Row { inner, .. }) = side.run.get(entry as usize) else { return Err(malformed("run row", *holder)) };
        let (mut at, end) = (entry as usize + 1, entry as usize + 1 + inner as usize);
        let mut out = Vec::new();
        while at < end {
            let found = *side.run.get(at).ok_or(malformed("run row entries", *holder))?;
            out.push((read, crate::types::narrow(at), found));
            at += 1 + match found {
                RunEntry::Row { inner, .. } => inner as usize,
                RunEntry::Record { .. } => 0,
            };
        }
        Ok(out)
    }

    fn kids_of(&mut self, index: NodeIndex) -> Result<Kids, ArenaError> {
        let site = self.site(index).ok_or(ArenaError::Malformed { what: "node id", word: index.0 })?;
        let entries = match site {
            NodeSite::Record(at) => {
                let read = self.read(at)?;
                self.entries(read)?
            }
            NodeSite::Row { holder, entry } => {
                let read = self.read(holder)?;
                self.inside(read, entry)?
            }
        };
        let mut kids = Vec::with_capacity(entries.len());
        for (read, entry, found) in entries {
            let kid = match found {
                RunEntry::Record { at, .. } => {
                    let child = self.read(at)?;
                    self.table.read[child].node.get_or_insert(child);
                    self.met_record(child, Parent::Node(index))?
                }
                RunEntry::Row { facts, span, .. } => {
                    let order = self.placed_at(read, entry)?;
                    let holder = self.table.read[read].at;
                    self.meet(NodeSite::Row { holder, entry }, order, facts, span, Parent::Node(index))
                }
            };
            kids.extend(self.table.met.get(kid).map(|met| met.kid));
        }
        Ok(kids.into())
    }

    fn parent_of(&mut self, index: NodeIndex) -> Result<Option<NodeIndex>, ArenaError> {
        let met = self.table.met.get(index).ok_or(ArenaError::Malformed { what: "node id", word: index.0 })?;
        let (site, known) = (met.site, met.parent);
        match known {
            Parent::Root => return Ok(None),
            Parent::Node(parent) => return Ok(Some(parent)),
            Parent::Unknown => {}
        }
        let parent = match site {
            NodeSite::Row { holder, entry } => Some(self.above(holder, entry)?),
            NodeSite::Record(at) => match self.side(at)?.parent {
                Some(parent) => Some(self.record(parent, Parent::Unknown)?),
                None => None,
            },
        };
        if let Some(met) = self.table.met.get_mut(index) {
            met.parent = parent.map_or(Parent::Root, Parent::Node);
        }
        Ok(parent)
    }

    fn depth_move(&mut self, index: NodeIndex, kinds: crate::trivia_table::SurfaceKinds) -> Result<i32, ArenaError> {
        let of = |kind: crate::types::KindId| i32::from(kinds.is_depth_member(kind) && kind == kinds.indent) - i32::from(kinds.is_depth_member(kind) && kind == kinds.dedent);
        match self.site(index).ok_or(ArenaError::Malformed { what: "node id", word: index.0 })? {
            NodeSite::Record(at) => Ok(self.side(at)?.depth),
            NodeSite::Row { holder, entry } => {
                let run = self.run(holder)?;
                let Some(&RunEntry::Row { facts, inner, .. }) = run.get(entry as usize) else { return Err(malformed("run row", holder)) };
                let inside = run.get(entry as usize + 1..entry as usize + 1 + inner as usize).ok_or(malformed("run row entries", holder))?;
                let (rows, records): (i32, Vec<Address>) = inside.iter().fold((of(facts.kind), Vec::new()), |(rows, mut records), entry| match *entry {
                    RunEntry::Row { facts, .. } => (rows + of(facts.kind), records),
                    RunEntry::Record { at, .. } => {
                        records.push(at);
                        (rows, records)
                    }
                });
                records.into_iter().try_fold(rows, |moved, at| Ok(moved + self.side(at)?.depth))
            }
        }
    }

    fn answer<T>(&mut self, answered: Result<T, ArenaError>, otherwise: T) -> T {
        answered.unwrap_or_else(|refusal| {
            self.table.refused.get_or_insert(refusal);
            otherwise
        })
    }

    fn facts(&self, index: NodeIndex) -> Option<NodeFacts> {
        self.table.met.get(index).map(|met| met.facts)
    }

    fn kid(&mut self, index: NodeIndex) -> Kid {
        let known = self.table.met.get(index).map(|met| met.kid);
        let unknown = Kid { index, start: 0, end: 0, count: 1, grammar: crate::types::KindId::ERROR, display: crate::types::KindId::ERROR, field: None, named: false, extra: false };
        self.answer(known.ok_or(ArenaError::Malformed { what: "node id", word: index.0 }), unknown)
    }

    fn kids(&mut self, index: NodeIndex) -> Kids {
        if let Some(kids) = self.table.met.get(index).and_then(|met| met.kids.clone()) {
            return kids;
        }
        let kids = self.kids_of(index);
        let kids = self.answer(kids, Kids::from([]));
        if let Some(met) = self.table.met.get_mut(index) {
            met.kids = Some(Kids::clone(&kids));
        }
        kids
    }

    fn edge(&mut self, index: NodeIndex, side: Side) -> Option<Kid> {
        let kids = self.kids(index);
        match side {
            Side::Before => kids.first().copied(),
            Side::After => kids.last().copied(),
        }
    }

    fn parent(&mut self, index: NodeIndex) -> Option<NodeIndex> {
        let parent = self.parent_of(index);
        self.answer(parent, None)
    }

}

impl<'t> Nodes<'t> for RunNodes<'t> {
    fn text(&self) -> &'t str {
        self.text
    }

    fn kid(&mut self, index: NodeIndex) -> Kid {
        self.answering(|walk| walk.kid(index))
    }

    fn kids(&mut self, index: NodeIndex) -> Kids {
        self.answering(|walk| walk.kids(index))
    }

    fn edge(&mut self, index: NodeIndex, side: Side) -> Option<Kid> {
        self.answering(|walk| walk.edge(index, side))
    }

    fn parent(&mut self, index: NodeIndex) -> Option<NodeIndex> {
        self.answering(|walk| walk.parent(index))
    }

    fn missing(&mut self, index: NodeIndex) -> bool {
        self.answering(|walk| walk.facts(index).is_some_and(|facts| facts.missing))
    }

    fn holds_error(&mut self, index: NodeIndex) -> bool {
        self.answering(|walk| walk.facts(index).is_some_and(|facts| facts.holds_error))
    }

    fn bound(&mut self) -> Option<u32> {
        None
    }

    fn ordered(&mut self) -> bool {
        true
    }

    fn names(&mut self, index: NodeIndex) -> bool {
        self.site(index).is_some()
    }
}
