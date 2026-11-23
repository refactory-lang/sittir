//! Navigation over parsed records alone (`Nodes`): a node's facts from its
//! record's side record or its row in its holder's run, its children from
//! that run, in document order, and its parent from its record's parent
//! word. No table of the tree's nodes is kept: a node is known to one
//! navigation by the id the navigation gives it when it first meets it, and
//! the ids go with the navigation. The source's root is id 0; an id says
//! nothing of where its node lies among the others.

use std::collections::HashMap;

use super::side::{NodeFacts, RunEntries, RunEntry};
use super::{Address, ArenaError, ArenaRead, BodySlot, Cell, CellShape, CellWord, EdgePart, ListCell, RecordShape, SideRecord};
use crate::nodes::{Kid, Kids, Nodes};
use crate::options::Side;
use crate::types::{FieldId, KindId, NodeIndex, Span};

/// Where a node is kept: its own record, the entry of its row in the run of
/// the record `holder`, for a unit with no row its site in its holder, or,
/// for a flag's keyword, which has no site, the bit of `holder` that sets it.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum NodeSite {
    Record(Address),
    Row { holder: Address, entry: u32 },
    Unit(crate::trivia_store::Site<Address>),
    Flag { holder: Address, word: u32, bit: u8 },
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

/// A record's side record as a navigation has read it: its facts and where
/// its run lies.
struct Read {
    side: SideRecord,
    run: Option<super::side::RunAt>,
}

/// Where a read of a run last stood: the entry numbered `entry` of the run
/// of `holder` starts at its word `word`.
#[derive(Clone, Copy)]
struct RunPlace {
    holder: Address,
    entry: u32,
    word: u32,
}

/// The row a read last decoded: a render asks about one node many times in
/// a row. `after` is the word of the run past it.
#[derive(Clone, Copy)]
struct LastRow {
    holder: Address,
    entry: u32,
    facts: NodeFacts,
    span: Span,
    inner: u32,
    after: u32,
}

#[derive(Default)]
struct Table {
    met: Vec<Met>,
    ids: HashMap<NodeSite, NodeIndex, crate::heap::IndexState>,
    sides: HashMap<Address, usize, crate::heap::IndexState>,
    read: Vec<Read>,
    place: Option<RunPlace>,
    last_row: Option<LastRow>,
    refused: Option<ArenaError>,
    spans: Option<Vec<std::ops::Range<Address>>>,
    bound: Option<Bound>,
}

/// A place in a read's records: a span of the read's (`read_spans`) and an
/// address in it.
type SpanPlace = (usize, u32);

/// The records under the node kept at `of`, as its read drafted them, in
/// order: from the first to the last on its rightmost path; none for a row
/// that holds no record.
struct Bound {
    of: NodeSite,
    places: Option<(SpanPlace, SpanPlace)>,
}

/// The nodes the navigations of one call have met under one root record
/// (`RunNodes::holding`), by the ids they gave them: every navigation over
/// the table names a node alike.
#[derive(Default)]
pub struct RunTable(crate::engine::PerCall<Table>);

impl RunTable {
    /// Where the node `index` names is kept; none for an id no navigation
    /// gave.
    #[must_use]
    pub fn site(&self, index: NodeIndex) -> Option<NodeSite> {
        self.0.with(|table| table.met.get(index.0 as usize).map(|met| met.site))
    }

    /// Forgets what the last answer met, so a render's table holds one
    /// answer: the root alone keeps its id, and no other id outlives it.
    pub(crate) fn begin_answer(&self) {
        self.0.with(|table| {
            table.met.truncate(1);
            if table.met.capacity() > 64 {
                table.met.shrink_to(1);
            }
            let root = table.met.first_mut().map(|root| {
                root.kids = None;
                root.site
            });
            crate::heap::emptied(&mut table.ids);
            table.ids.extend(root.map(|site| (site, NodeIndex::ROOT)));
            crate::heap::emptied(&mut table.sides);
            table.read.clear();
            if table.read.capacity() > 64 {
                table.read.shrink_to(0);
            }
        });
    }
}

/// Navigation over the parsed records of one source, in `arena`, naming
/// each node by its id in `table`.
#[derive(Clone, Copy)]
pub struct RunNodes<'t> {
    arena: &'t dyn ArenaRead,
    text: &'t str,
    table: &'t RunTable,
    shape: super::ReadShape,
}

/// What a slot of a record's render body holds at one of the record's edges.
enum SlotEdge {
    Absent,
    /// A child the record's run holds.
    Content,
    /// A unit or a set flag: its kind.
    Unit(KindId),
    /// The content record that shares the record's own node.
    Shared(Address),
}

/// One answer's read of the records, with the table held for it.
struct Walk<'a> {
    arena: &'a dyn ArenaRead,
    table: &'a mut Table,
    shape: super::ReadShape,
}

/// A child as its holder's body lists it: an entry of a run, with the
/// record whose run holds it and its place there, or a unit or flag with no
/// row, by its site and kind.
#[derive(Clone, Copy)]
enum Listed {
    Entry(Address, u32, RunEntry),
    Unit { site: NodeSite, kind: KindId, alias: Option<KindId>, field: Option<FieldId>, listed: bool },
}

fn malformed(what: &'static str, at: Address) -> ArenaError {
    ArenaError::Malformed { what, word: at.0 }
}

impl<'t> RunNodes<'t> {
    /// Navigation of the node the record at `record` was read as and the
    /// nodes under it, its bytes indexing `text`, the source it was read
    /// from, over `table`, which holds those nodes alone, `shape` laying out
    /// each record and giving its kind field's bits: that node is its
    /// root, with no parent, as a built node is, so nothing above it is
    /// read and it answers whether or not the records above it are still
    /// held.
    ///
    /// # Errors
    ///
    /// What reading the record refuses, and `ArenaError::Malformed` for a
    /// record an `ERROR` holds, whose interior no view names
    /// (`SideRecord::held_by_error`).
    pub fn holding(arena: &'t dyn ArenaRead, text: &'t str, record: Address, table: &'t RunTable, shape: super::ReadShape) -> Result<Self, ArenaError> {
        let nodes = Self { arena, text, table, shape };
        nodes.answering(|walk| {
            if walk.side(record)?.held_by_error {
                return Err(ArenaError::Malformed { what: "record an ERROR holds", word: record.0 });
            }
            walk.record(record, Parent::Root)
        })?;
        Ok(nodes)
    }

    /// Navigation over `table`, which a navigation of the source rooted
    /// (`holding`).
    #[must_use]
    pub fn over(arena: &'t dyn ArenaRead, text: &'t str, table: &'t RunTable, shape: super::ReadShape) -> Self {
        Self { arena, text, table, shape }
    }

    fn answering<R>(&self, f: impl FnOnce(&mut Walk<'_>) -> R) -> R {
        self.table.0.with(|table| f(&mut Walk { arena: self.arena, table, shape: self.shape }))
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
        self.answering(|walk| walk.record(at, Parent::Root))
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
                NodeSite::Record(at) => walk.named_record(at),
                NodeSite::Row { holder, entry } => walk.row_index(holder, entry + 2),
                NodeSite::Unit(crate::trivia_store::Site { holder, .. }) | NodeSite::Flag { holder, .. } => Err(malformed("a unit's site, which names no row", holder)),
            };
            walk.answer(met.map(Some), None)
        })
    }

    /// Whether the node kept at `site` is its source's root: a record whose
    /// side record has no parent. A row never is.
    pub fn is_source_root(&mut self, site: NodeSite) -> bool {
        self.answering(|walk| {
            let root = match site {
                NodeSite::Record(at) => walk.node_record(at).and_then(|at| Ok(walk.side(at)?.parent.is_none())),
                NodeSite::Row { .. } | NodeSite::Unit(_) | NodeSite::Flag { .. } => Ok(false),
            };
            walk.answer(root, false)
        })
    }

    /// Whether the node at `index` is the one kept at `site`.
    pub fn keeps(&mut self, index: NodeIndex, site: NodeSite) -> bool {
        self.answering(|walk| {
            let kept = walk.kept_at(site).map(|site| walk.site(index) == Some(site));
            walk.answer(kept, false)
        })
    }

    /// Whether the node kept at `site` lies under the node at `index`, read
    /// from that node down: a row by its place in the run, a record by the
    /// bound of the records under the node (`Walk::bound_of`).
    pub fn under(&mut self, index: NodeIndex, site: NodeSite) -> bool {
        self.answering(|walk| {
            let under = walk.under(index, site);
            walk.answer(under, false)
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

    /// The offsets under the node at `index` where a line starts inside a
    /// token: past a line break within a token's span, and at the end of a
    /// token `NodeFacts::abuts_next` marks, when that end lies inside the node.
    ///
    /// # Errors
    ///
    /// `ArenaError` for a record or run that does not read.
    pub fn line_starts(&mut self, index: NodeIndex, source: &str) -> Result<Vec<u32>, ArenaError> {
        self.answering(|walk| walk.line_starts(index, source))
    }

    /// The entry of the source the record at `at` was read from.
    ///
    /// # Errors
    ///
    /// What reading the record refuses, and `ArenaError::Malformed` for a
    /// record that names no source.
    pub fn source_of(arena: &dyn ArenaRead, at: Address) -> Result<Address, ArenaError> {
        SideRecord::read_facts(arena, super::side_of(arena, at)?)?.0.source.map(Address).ok_or(malformed("parsed record source", at))
    }

}

/// The record that is the node of the record at `at`: itself, or, for a
/// content read from its envelope's own node (`SideRecord::content`), its
/// envelope's.
///
/// # Errors
///
/// What reading a side record refuses.
pub fn node_record(arena: &dyn ArenaRead, mut at: Address) -> Result<Address, ArenaError> {
    loop {
        let (side, _) = SideRecord::read_facts(arena, super::side_of(arena, at)?)?;
        let Some(parent) = side.parent.filter(|_| side.content) else { return Ok(at) };
        at = parent;
    }
}

/// The record a node kept at `site` lies in: its own, or its holder.
fn holder_of(site: NodeSite) -> Address {
    match site {
        NodeSite::Record(at) | NodeSite::Row { holder: at, .. } | NodeSite::Flag { holder: at, .. } => at,
        NodeSite::Unit(site) => site.holder,
    }
}

impl<'a> Walk<'a> {
    fn site(&self, index: NodeIndex) -> Option<NodeSite> {
        self.table.met.get(index.0 as usize).map(|met| met.site)
    }

    /// `site`, a record of a content read from its envelope's node as that
    /// envelope's: where the node it names is kept.
    fn kept_at(&mut self, site: NodeSite) -> Result<NodeSite, ArenaError> {
        Ok(match site {
            NodeSite::Record(at) => NodeSite::Record(self.node_record(at)?),
            held @ (NodeSite::Row { .. } | NodeSite::Unit(_) | NodeSite::Flag { .. }) => held,
        })
    }

    /// The last record on the rightmost path from the record at `at`.
    fn rightmost(&mut self, mut at: Address) -> Result<Address, ArenaError> {
        loop {
            let mut child = None;
            for entry in self.run_of(at)? {
                if let RunEntry::Record { at, .. } = entry? {
                    child = Some(at);
                }
            }
            let Some(child) = child else { return Ok(at) };
            at = child;
        }
    }

    /// The first and last record under the node kept at `of`, itself
    /// included for a record: a read drafted every record of a subtree in
    /// turn, from its root to the last on its rightmost path, so these bound
    /// them, and nothing above the node is read.
    fn records_under(&mut self, of: NodeSite) -> Result<Option<(Address, Address)>, ArenaError> {
        match of {
            NodeSite::Record(at) => Ok(Some((at, self.rightmost(at)?))),
            NodeSite::Row { holder, entry } => {
                let (_, _, inner, mut entries) = self.row_at(holder, entry, "run row")?;
                let (mut first, mut last) = (None, None);
                for _ in 0..inner {
                    if let RunEntry::Record { at, .. } = entries.next().ok_or(malformed("run row entries", holder))?? {
                        first = first.or(Some(at));
                        last = Some(at);
                    }
                }
                let (Some(first), Some(last)) = (first, last) else { return Ok(None) };
                Ok(Some((first, self.rightmost(last)?)))
            }
            NodeSite::Unit(_) | NodeSite::Flag { .. } => Ok(None),
        }
    }

    /// The bound of the records under the node kept at `of`, kept for the
    /// node last asked about, its read's spans kept for the call.
    fn bound_of(&mut self, of: NodeSite) -> Result<Option<(SpanPlace, SpanPlace)>, ArenaError> {
        if let Some(bound) = self.table.bound.as_ref().filter(|bound| bound.of == of) {
            return Ok(bound.places);
        }
        if self.table.spans.is_none() {
            let at = holder_of(of);
            let source = self.side(at)?.source.map(Address).ok_or(malformed("parsed record source", at))?;
            self.table.spans = Some(super::read_spans(self.arena, source)?);
        }
        let records = self.records_under(of)?;
        let spans = self.table.spans.as_deref().unwrap_or_default();
        let place = |at: Address| spans.iter().position(|span| span.contains(&at)).map(|span| (span, at.0)).ok_or(malformed("parsed record outside its read's spans", at));
        let places = records.map(|(first, last)| Ok::<_, ArenaError>((place(first)?, place(last)?))).transpose()?;
        self.table.bound = Some(Bound { of, places });
        Ok(places)
    }

    /// Whether the node kept at `site` lies under the node at `index`.
    fn under(&mut self, index: NodeIndex, site: NodeSite) -> Result<bool, ArenaError> {
        let of = self.site(index).ok_or(ArenaError::Malformed { what: "node id", word: index.0 })?;
        let site = self.kept_at(site)?;
        if let (NodeSite::Row { holder, entry }, NodeSite::Row { holder: at, entry: row }) = (of, site) {
            if holder == at {
                let (_, _, inner, _) = self.row_at(holder, entry, "run row")?;
                return Ok(entry < row && row <= entry + inner);
            }
        }
        let held = holder_of(site);
        let Some((first, last)) = self.bound_of(of)? else { return Ok(false) };
        let spans = self.table.spans.as_deref().unwrap_or_default();
        Ok(spans.iter().position(|span| span.contains(&held)).is_some_and(|span| (first..=last).contains(&(span, held.0))))
    }

    /// The id of the node of the record at `at`, named on its own: nothing
    /// above it is read. A record an `ERROR` holds names no node.
    fn named_record(&mut self, at: Address) -> Result<NodeIndex, ArenaError> {
        if self.side(at)?.held_by_error {
            return Err(malformed("record an ERROR holds", at));
        }
        self.record(at, Parent::Root)
    }

    fn row_index(&mut self, holder: Address, row: u32) -> Result<NodeIndex, ArenaError> {
        if row == 1 {
            return self.named_record(holder);
        }
        let entry = row.checked_sub(2).ok_or(malformed("cell row", holder))?;
        let (facts, span, inner, _) = self.row_at(holder, entry, "cell row")?;
        Ok(self.meet(NodeSite::Row { holder, entry }, facts, span, inner == 0, Parent::Unknown))
    }

    /// The node the row at `entry` of the run of `holder` lies under: the
    /// innermost row of the run that holds it, else the holder's node.
    fn above(&mut self, holder: Address, entry: u32) -> Result<NodeIndex, ArenaError> {
        let mut run = self.run_of(holder)?;
        let (mut at, mut inside) = (0, None);
        while at < entry as usize {
            match run.next().ok_or(malformed("run row entries", holder))?? {
                RunEntry::Row { facts, span, inner } if at + inner as usize >= entry as usize => {
                    inside = Some((at, facts, span));
                    at += 1;
                }
                RunEntry::Row { inner, .. } => {
                    for _ in 0..inner {
                        run.next().ok_or(malformed("run row entries", holder))??;
                    }
                    at += 1 + inner as usize;
                }
                RunEntry::Record { .. } => at += 1,
            }
        }
        match inside {
            Some((entry, facts, span)) => Ok(self.meet(NodeSite::Row { holder, entry: crate::types::narrow(entry) }, facts, span, false, Parent::Unknown)),
            None => self.record(holder, Parent::Root),
        }
    }

    /// Where the table keeps the side record of the record at `at`, its
    /// facts read once.
    fn read(&mut self, at: Address) -> Result<usize, ArenaError> {
        if let Some(&read) = self.table.sides.get(&at) {
            return Ok(read);
        }
        let (side, run) = SideRecord::read_facts(self.arena, super::side_of(self.arena, at)?)?;
        self.table.read.push(Read { side, run });
        self.table.sides.insert(at, self.table.read.len() - 1);
        Ok(self.table.read.len() - 1)
    }

    /// The facts of the side record of the record at `at`: every field but
    /// its slots and its run.
    fn side(&mut self, at: Address) -> Result<&SideRecord, ArenaError> {
        let read = self.read(at)?;
        Ok(&self.table.read[read].side)
    }

    /// The entries of the run of the record at `at`, read in place; none
    /// for a record with no run.
    fn run_of(&mut self, at: Address) -> Result<RunEntries<'a>, ArenaError> {
        let read = self.read(at)?;
        self.table.read[read].run.map_or(Ok(RunEntries::default()), |run| run.in_place(self.arena))
    }

    /// The entries of the run of `holder` from the one numbered `entry` on,
    /// reached from where the last read of that run stood when that lies
    /// before it. `what` names a run that ends first.
    fn entries_at(&mut self, holder: Address, entry: u32, what: &'static str) -> Result<RunEntries<'a>, ArenaError> {
        let mut entries = self.run_of(holder)?;
        let mut number = 0;
        if let Some(place) = self.table.place.filter(|place| place.holder == holder && place.entry <= entry) {
            entries = entries.at_word(place.word).ok_or(malformed(what, holder))?;
            number = place.entry;
        }
        while number < entry {
            entries.next().ok_or(malformed(what, holder))??;
            number += 1;
        }
        self.table.place = Some(RunPlace { holder, entry, word: entries.word() });
        Ok(entries)
    }

    /// The row numbered `entry` of the run of `holder`, and the entries after
    /// it; `what` names an entry that is no row.
    fn row_at(&mut self, holder: Address, entry: u32, what: &'static str) -> Result<(NodeFacts, Span, u32, RunEntries<'a>), ArenaError> {
        if let Some(row) = self.table.last_row.filter(|row| row.holder == holder && row.entry == entry) {
            let entries = self.run_of(holder)?.at_word(row.after).ok_or(malformed(what, holder))?;
            return Ok((row.facts, row.span, row.inner, entries));
        }
        let mut entries = self.entries_at(holder, entry, what)?;
        match entries.next().transpose()? {
            Some(RunEntry::Row { facts, span, inner }) => {
                self.table.last_row = Some(LastRow { holder, entry, facts, span, inner, after: entries.word() });
                Ok((facts, span, inner, entries))
            }
            _ => Err(malformed(what, holder)),
        }
    }

    /// The record that is the node of the record at `at`: itself, or, for a
    /// content read from its envelope's own node (`SideRecord::content`),
    /// its envelope's. Only a content's parent is read.
    fn node_record(&mut self, mut at: Address) -> Result<Address, ArenaError> {
        loop {
            let side = self.side(at)?;
            let Some(parent) = side.parent.filter(|_| side.content) else { return Ok(at) };
            at = parent;
        }
    }


    /// Whether the node whose record is at `at` has no children: its run
    /// holds none, nor does a content it shares its node with, and no cell
    /// or flag of its record names a unit.
    fn childless(&mut self, at: Address) -> Result<bool, ArenaError> {
        let read = self.read(at)?;
        match self.table.read[read].run {
            None => return Ok(!self.holds_unit(at)?),
            Some(run) if !run.starts_shared(self.arena)? => return Ok(false),
            Some(_) => {}
        }
        for entry in self.run_of(at)? {
            match entry? {
                RunEntry::Record { at: content, shared: true } if self.childless(content)? => {}
                _ => return Ok(false),
            }
        }
        Ok(!self.holds_unit(at)?)
    }

    /// Whether a cell or set flag of the record at `at` names a unit with no
    /// row, stopping at the first.
    fn holds_unit(&self, at: Address) -> Result<bool, ArenaError> {
        let (shape_of, bits, _) = self.shape;
        let arena = self.arena;
        let Some(shape) = shape_of(arena.header_kind(at, bits)?) else { return Ok(false) };
        let words = arena.words(at, shape.words)?;
        let names_unit = |held: Cell| matches!(held, Cell::Unit { kind, row: None } if kind != KindId::BLANK);
        for part in shape.order {
            let found = match *part {
                BodySlot::Flag { word, bit, .. } => words.get(word as usize).ok_or(malformed("flag word", at))? >> bit & 1 == 1,
                BodySlot::Cell(cell) => {
                    let cell = *shape.cells.get(usize::from(cell)).ok_or(malformed("body slot cell", at))?;
                    let held = words.get(cell.word as usize..(cell.word + cell.width) as usize).ok_or(malformed("cell word", at))?;
                    match cell.run {
                        None => names_unit(Cell::decode_parsed(held, cell, bits)?),
                        Some(_) if held[0] == 0 => false,
                        Some(width) => {
                            let mut found = false;
                            for value in ListCell::of_word(CellWord(held[0]), arena)?.items(arena, width)? {
                                if names_unit(Cell::decode_parsed(value, cell, bits)?) {
                                    found = true;
                                    break;
                                }
                            }
                            found
                        }
                    }
                }
            };
            if found {
                return Ok(true);
            }
        }
        Ok(false)
    }

    fn meet(&mut self, site: NodeSite, facts: NodeFacts, span: Span, childless: bool, parent: Parent) -> NodeIndex {
        let table = &mut *self.table;
        if let Some(&index) = table.ids.get(&site) {
            let known = &mut table.met[index.0 as usize].parent;
            if *known == Parent::Unknown || (*known == Parent::Root && matches!(parent, Parent::Node(_))) {
                *known = parent;
            }
            return index;
        }
        let index = NodeIndex(crate::types::narrow(table.met.len()));
        let kid = Kid { index, start: span.start, end: span.end, count: if childless { 1 } else { 2 }, grammar: facts.kind, display: facts.display(), field: facts.field, named: facts.named, extra: facts.extra };
        table.met.push(Met { site, kid, facts, parent, kids: None });
        table.ids.insert(site, index);
        index
    }

    fn record(&mut self, at: Address, parent: Parent) -> Result<NodeIndex, ArenaError> {
        let at = self.node_record(at)?;
        let side = self.side(at)?;
        let facts = side.node.ok_or(malformed("parsed record facts", at))?;
        let span = side.at.ok_or(malformed("parsed record row", at))?.span;
        let childless = self.childless(at)?;
        Ok(self.meet(NodeSite::Record(at), facts, span, childless, parent))
    }

    /// Tells `visit` each child of the node whose record is at `at`, in the
    /// order its render body writes them, until it answers false: each cell
    /// brings the run's entries up to the one it names, so trivia keeps its
    /// place, a unit or set flag with no row comes from its cell, and the
    /// rest of the run follows. A shared content lists its own in place of
    /// itself. False when `visit` ended it.
    fn listed_into(&mut self, at: Address, visit: &mut dyn FnMut(Listed) -> Result<bool, ArenaError>) -> Result<bool, ArenaError> {
        let (shape_of, bits, _) = self.shape;
        let arena = self.arena;
        let mut rest = (self.run_of(at)?, 0);
        if let Some(shape) = shape_of(arena.header_kind(at, bits)?) {
            let words = arena.words(at, shape.words)?;
            for part in shape.order {
                match *part {
                    BodySlot::Flag { word, bit, kind, tokens, field } => {
                        let held = *words.get(word as usize).ok_or(malformed("flag word", at))?;
                        if held >> bit & 1 == 1 {
                            let token = *tokens.first().ok_or(malformed("flag keyword", at))?;
                            if !visit(Listed::Unit { site: NodeSite::Flag { holder: at, word, bit }, kind: token, alias: (token != kind).then_some(kind), field, listed: false })? {
                                return Ok(false);
                            }
                        }
                    }
                    BodySlot::Cell(cell) => {
                        let cell = *shape.cells.get(usize::from(cell)).ok_or(malformed("body slot cell", at))?;
                        let held = words.get(cell.word as usize..(cell.word + cell.width) as usize).ok_or(malformed("cell word", at))?;
                        match cell.run {
                            None => {
                                if !self.list_cell(at, cell, 0, Cell::decode_parsed(held, cell, bits)?, &mut rest, visit)? {
                                    return Ok(false);
                                }
                            }
                            Some(_) if held[0] == 0 => {}
                            Some(width) => {
                                for (item, value) in ListCell::of_word(CellWord(held[0]), arena)?.items(arena, width)?.enumerate() {
                                    if !self.list_cell(at, cell, item, Cell::decode_parsed(value, cell, bits)?, &mut rest, visit)? {
                                        return Ok(false);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        self.list_through(at, usize::MAX, &mut rest, visit)
    }

    /// Lists what the cell value `held`, item `item` of the slot `cell` of
    /// the record at `at`, names; false when `visit` ended the listing.
    fn list_cell(&mut self, at: Address, cell: CellShape, item: usize, held: Cell, rest: &mut (RunEntries<'a>, usize), visit: &mut dyn FnMut(Listed) -> Result<bool, ArenaError>) -> Result<bool, ArenaError> {
        match held {
            Cell::Unit { kind, row: None } if kind != KindId::BLANK => {
                let site = crate::trivia_store::Site { holder: at, word: cell.word, item: crate::types::ItemIndex(crate::types::narrow(item)) };
                visit(Listed::Unit { site: NodeSite::Unit(site), kind, alias: None, field: cell.field, listed: (cell.listed)(kind, self.shape.2) })
            }
            Cell::Unit { row: Some(row), .. } | Cell::ParsedLeaf { row, .. } if row.0 >= 2 => self.list_through(at, row.0 as usize - 2, rest, visit),
            Cell::Child { at: child, .. } => {
                let (ahead, mut number) = rest.clone();
                for entry in ahead {
                    if matches!(entry?, RunEntry::Record { at, .. } if at == child) {
                        return self.list_through(at, number, rest, visit);
                    }
                    number += 1;
                }
                Ok(true)
            }
            _ => Ok(true),
        }
    }

    /// Lists the entries of the run of `at` from where `rest` stands through
    /// the entry numbered `last`, a row with what lies inside it; false when
    /// `visit` ended the listing.
    fn list_through(&mut self, at: Address, last: usize, rest: &mut (RunEntries<'a>, usize), visit: &mut dyn FnMut(Listed) -> Result<bool, ArenaError>) -> Result<bool, ArenaError> {
        while rest.1 <= last {
            let Some(found) = rest.0.next().transpose()? else { break };
            let (number, inner) = (rest.1, if let RunEntry::Row { inner, .. } = found { inner as usize } else { 0 });
            for _ in 0..inner {
                if rest.0.next().transpose()?.is_none() {
                    break;
                }
            }
            rest.1 += 1 + inner;
            let go_on = match found {
                RunEntry::Record { at: content, shared: true } => self.listed_into(content, visit)?,
                found => visit(Listed::Entry(at, crate::types::narrow(number), found))?,
            };
            if !go_on {
                return Ok(false);
            }
        }
        Ok(true)
    }

    /// Tells `visit` each entry directly inside the row at `entry` of the
    /// run of `holder`, until it answers false.
    fn row_into(&mut self, holder: Address, entry: u32, visit: &mut dyn FnMut(Listed) -> Result<bool, ArenaError>) -> Result<bool, ArenaError> {
        let (_, _, inner, mut entries) = self.row_at(holder, entry, "run row")?;
        let (mut at, end) = (entry as usize + 1, entry as usize + 1 + inner as usize);
        while at < end {
            let found = entries.next().ok_or(malformed("run row entries", holder))??;
            let nested = if let RunEntry::Row { inner, .. } = found { inner as usize } else { 0 };
            for _ in 0..nested {
                entries.next().ok_or(malformed("run row entries", holder))??;
            }
            if !visit(Listed::Entry(holder, crate::types::narrow(at), found))? {
                return Ok(false);
            }
            at += 1 + nested;
        }
        Ok(true)
    }

    /// Tells `visit` each child of the node kept at `site`, until it answers
    /// false.
    fn list(&mut self, site: NodeSite, visit: &mut dyn FnMut(Listed) -> Result<bool, ArenaError>) -> Result<bool, ArenaError> {
        match site {
            NodeSite::Record(at) => self.listed_into(at, visit),
            NodeSite::Row { holder, entry } => self.row_into(holder, entry, visit),
            NodeSite::Unit(_) | NodeSite::Flag { .. } => Ok(true),
        }
    }

    /// The child `one` of the node at `parent`, a unit placed at `at`, the
    /// end of the child before it.
    fn listed_kid(&mut self, parent: NodeIndex, one: Listed, at: u32) -> Result<Kid, ArenaError> {
        let named = self.shape.2;
        let kid = match one {
            Listed::Entry(_, _, RunEntry::Record { at, .. }) => self.record(at, Parent::Node(parent))?,
            Listed::Entry(holder, entry, RunEntry::Row { facts, span, inner }) => self.meet(NodeSite::Row { holder, entry }, facts, span, inner == 0, Parent::Node(parent)),
            Listed::Unit { site, kind, alias, field, listed } => {
                let facts = NodeFacts { kind, field, alias, named: listed || named(alias.unwrap_or(kind)), extra: false, missing: false, holds_error: false, abuts_next: false };
                self.meet(site, facts, Span { start: at, end: at }, true, Parent::Node(parent))
            }
        };
        Ok(self.table.met[kid.0 as usize].kid)
    }

    /// Where the child `one` ends, `at` being the end of the child before it.
    fn listed_end(arena: &dyn ArenaRead, one: Listed, at: u32) -> Result<u32, ArenaError> {
        match one {
            Listed::Entry(_, _, RunEntry::Record { at: record, .. }) => {
                let record = node_record(arena, record)?;
                Ok(SideRecord::read_facts(arena, super::side_of(arena, record)?)?.0.at.ok_or(malformed("parsed record row", record))?.span.end)
            }
            Listed::Entry(_, _, RunEntry::Row { span, .. }) => Ok(span.end),
            Listed::Unit { .. } => Ok(at),
        }
    }

    fn kids_of(&mut self, index: NodeIndex) -> Result<Kids, ArenaError> {
        let site = self.site(index).ok_or(ArenaError::Malformed { what: "node id", word: index.0 })?;
        let mut listed = Vec::new();
        self.list(site, &mut |one| {
            listed.push(one);
            Ok(true)
        })?;
        let mut at = self.table.met[index.0 as usize].kid.start;
        let mut kids = Vec::with_capacity(listed.len());
        for one in listed {
            let kid = self.listed_kid(index, one, at)?;
            at = kid.end;
            kids.push(kid);
        }
        Ok(kids.into())
    }

    /// The child of the node at `index` after (`Side::After`) or before
    /// (`Side::Before`) the node at `index`, read without listing its
    /// parent's children.
    fn sibling(&mut self, index: NodeIndex, side: Side) -> Result<Option<Kid>, ArenaError> {
        let Some(parent) = self.parent_of(index)? else { return Ok(None) };
        let unknown = ArenaError::Malformed { what: "node id", word: index.0 };
        let (target, holder) = (self.site(index).ok_or(unknown.clone())?, self.site(parent).ok_or(unknown)?);
        let arena = self.arena;
        let mut end = self.table.met[parent.0 as usize].kid.start;
        let (mut before, mut found, mut reached) = (None, None, false);
        self.list(holder, &mut |one| {
            if reached {
                found = Some((one, end));
                return Ok(false);
            }
            let site = match one {
                Listed::Entry(_, _, RunEntry::Record { at, .. }) => NodeSite::Record(node_record(arena, at)?),
                Listed::Entry(holder, entry, RunEntry::Row { .. }) => NodeSite::Row { holder, entry },
                Listed::Unit { site, .. } => site,
            };
            if site == target {
                reached = true;
                if side == Side::Before {
                    found = before;
                    return Ok(false);
                }
            } else {
                before = Some((one, end));
            }
            end = Self::listed_end(arena, one, end)?;
            Ok(true)
        })?;
        found.map(|(one, at)| self.listed_kid(parent, one, at)).transpose()
    }

    /// The first child of the node at `index` that ends past `byte`, read
    /// without listing its children.
    fn child_past(&mut self, index: NodeIndex, byte: u32) -> Result<Option<Kid>, ArenaError> {
        let site = self.site(index).ok_or(ArenaError::Malformed { what: "node id", word: index.0 })?;
        let arena = self.arena;
        let mut end = self.table.met[index.0 as usize].kid.start;
        let mut found = None;
        self.list(site, &mut |one| {
            let past = Self::listed_end(arena, one, end)?;
            if past > byte {
                found = Some((one, end));
                return Ok(false);
            }
            end = past;
            Ok(true)
        })?;
        found.map(|(one, at)| self.listed_kid(index, one, at)).transpose()
    }

    /// The first or last entry of the run of the record at `at` that is a
    /// child, a shared content's in place of itself, with the record whose
    /// run holds it and its number there.
    fn run_edge(&mut self, at: Address, side: Side) -> Result<Option<Listed>, ArenaError> {
        let (mut entries, mut number, mut last) = (self.run_of(at)?, 0_usize, None);
        while let Some(entry) = entries.next().transpose()? {
            let held = match entry {
                RunEntry::Record { at: content, shared: true } => self.run_edge(content, side)?,
                found => Some(Listed::Entry(at, crate::types::narrow(number), found)),
            };
            if held.is_some() {
                if side == Side::Before {
                    return Ok(held);
                }
                last = held;
            }
            let inner = if let RunEntry::Row { inner, .. } = entry { inner as usize } else { 0 };
            for _ in 0..inner {
                if entries.next().transpose()?.is_none() {
                    break;
                }
            }
            number += 1 + inner;
        }
        Ok(last)
    }

    /// The fixed token, unit or list separator the render body of the
    /// record of the node at `index` writes at its edge on `side`: its first
    /// part there that writes anything, through a content that shares its
    /// node. None for a node with no record, for a source's root with an
    /// extra or `ERROR` at that edge (the parser leaves one at no other
    /// node's edge), and where that part is a child of its run.
    fn edge_token(&mut self, holder: &Kid, side: Side, arm: &dyn Fn(KindId) -> Option<KindId>) -> Result<Option<KindId>, ArenaError> {
        let (shape_of, bits, _) = self.shape;
        let index = holder.index;
        let Some(NodeSite::Record(mut at)) = self.site(index) else { return Ok(None) };
        if self.side(at)?.parent.is_none() && self.edge(index, side).is_some_and(|kid| kid.entry() && if side == Side::Before { kid.start == holder.start } else { kid.end == holder.end }) {
            return Ok(None);
        }
        let flank = if side == Side::Before { crate::types::Delimiter::LEADING } else { crate::types::Delimiter::TRAILING };
        'record: loop {
            let kind = self.arena.header_kind(at, bits)?;
            let Some(shape) = shape_of(kind) else { return Ok(None) };
            for part in shape.edges[side as usize] {
                let (edge, guarded) = match *part {
                    EdgePart::Token(token) => return Ok(Some(token)),
                    EdgePart::Slot(slot) => (self.slot_edge(at, shape, slot, side, bits)?, None),
                    EdgePart::Guarded { slot, token } => (self.slot_edge(at, shape, slot, side, bits)?, Some(token)),
                    EdgePart::List { cell, separator } => {
                        let edge = self.slot_edge(at, shape, BodySlot::Cell(cell), side, bits)?;
                        if !matches!(edge, SlotEdge::Absent) && self.side(at)?.delimiter.is_some_and(|set| set.has(flank)) {
                            let word = shape.cells.get(usize::from(cell)).ok_or(malformed("body slot cell", at))?.word;
                            let held = SideRecord::read_slots(self.arena, super::side_of(self.arena, at)?)?;
                            let stamped = held.slots.iter().find(|slot| slot.word == word).and_then(|slot| slot.separator);
                            return Ok(Some(stamped.or_else(|| arm(kind)).unwrap_or(separator)));
                        }
                        (edge, None)
                    }
                };
                match (edge, guarded) {
                    (SlotEdge::Absent, _) => {}
                    (_, Some(token)) => return Ok(Some(token)),
                    (SlotEdge::Unit(kind), None) => return Ok(Some(kind)),
                    (SlotEdge::Content, None) => return Ok(None),
                    (SlotEdge::Shared(content), None) => {
                        at = content;
                        continue 'record;
                    }
                }
            }
            return Ok(None);
        }
    }

    /// What `slot` of the record at `at` holds at its edge on `side`: a
    /// list slot's item there.
    fn slot_edge(&mut self, at: Address, shape: RecordShape, slot: BodySlot, side: Side, bits: u32) -> Result<SlotEdge, ArenaError> {
        let arena = self.arena;
        let words = arena.words(at, shape.words)?;
        let cell = match slot {
            BodySlot::Flag { word, bit, kind, .. } => {
                let held = *words.get(word as usize).ok_or(malformed("flag word", at))?;
                return Ok(if held >> bit & 1 == 1 { SlotEdge::Unit(kind) } else { SlotEdge::Absent });
            }
            BodySlot::Cell(cell) => *shape.cells.get(usize::from(cell)).ok_or(malformed("body slot cell", at))?,
        };
        let held = words.get(cell.word as usize..(cell.word + cell.width) as usize).ok_or(malformed("cell word", at))?;
        let decoded = match cell.run {
            None => Cell::decode_parsed(held, cell, bits)?,
            Some(width) => {
                let mut items = ListCell::of_word(CellWord(held[0]), arena)?.items(arena, width)?;
                match if side == Side::Before { items.next() } else { items.next_back() } {
                    Some(item) => Cell::decode_parsed(item, cell, bits)?,
                    None => Cell::Absent,
                }
            }
        };
        Ok(match decoded {
            Cell::Absent => SlotEdge::Absent,
            Cell::Unit { kind, .. } if kind == KindId::BLANK => SlotEdge::Absent,
            Cell::Unit { kind, .. } => SlotEdge::Unit(kind),
            Cell::Child { at: child, .. } if self.side(child)?.content => SlotEdge::Shared(child),
            _ => SlotEdge::Content,
        })
    }

    fn parent_of(&mut self, index: NodeIndex) -> Result<Option<NodeIndex>, ArenaError> {
        let met = self.table.met.get(index.0 as usize).ok_or(ArenaError::Malformed { what: "node id", word: index.0 })?;
        let (site, known) = (met.site, met.parent);
        match known {
            Parent::Root => return Ok(None),
            Parent::Node(parent) => return Ok(Some(parent)),
            Parent::Unknown => {}
        }
        let parent = match site {
            NodeSite::Row { holder, entry } => Some(self.above(holder, entry)?),
            NodeSite::Record(_) | NodeSite::Unit(_) | NodeSite::Flag { .. } => None,
        };
        self.table.met[index.0 as usize].parent = parent.map_or(Parent::Root, Parent::Node);
        Ok(parent)
    }

    fn line_starts(&mut self, index: NodeIndex, source: &str) -> Result<Vec<u32>, ArenaError> {
        let (shape_of, bits, _) = self.shape;
        let arena = self.arena;
        let met = &self.table.met[index.0 as usize];
        let (site, root) = (met.site, met.kid);
        let end = root.end;
        let own_text = |at: Address| -> Result<bool, ArenaError> { Ok(shape_of(arena.header_kind(at, bits)?).is_some_and(|shape| shape.own_text)) };
        let mut starts = Vec::new();
        let lines = |span: Span, starts: &mut Vec<u32>| {
            let mut from = span.start;
            while let Some(found) = source.get(Span { start: from, end: span.end }.range()).and_then(|text| text.find('\n')) {
                let line = from + crate::types::narrow(found) + 1;
                if line >= span.end {
                    break;
                }
                starts.push(line);
                from = line;
            }
        };
        let mut frames: Vec<(RunEntries<'a>, usize)> = Vec::new();
        match site {
            NodeSite::Unit(_) | NodeSite::Flag { .. } => {}
            NodeSite::Record(at) => {
                if root.entry() || own_text(at)? {
                    lines(root.span(), &mut starts);
                } else {
                    frames.push((self.run_of(at)?, usize::MAX));
                }
            }
            NodeSite::Row { holder, entry } => {
                let (_, _, inner, entries) = self.row_at(holder, entry, "run row")?;
                if root.entry() || inner == 0 {
                    lines(root.span(), &mut starts);
                } else {
                    frames.push((entries, inner as usize));
                }
            }
        }
        while let Some((entries, left)) = frames.last_mut() {
            if *left == 0 {
                frames.pop();
                continue;
            }
            let Some(entry) = entries.next().transpose()? else {
                frames.pop();
                continue;
            };
            *left -= 1;
            match entry {
                RunEntry::Record { at, shared: true } => {
                    let run = self.run_of(at)?;
                    frames.push((run, usize::MAX));
                }
                RunEntry::Record { at, shared: false } => {
                    let (side, run) = SideRecord::read_facts(arena, super::side_of(arena, at)?)?;
                    let facts = side.node.ok_or(malformed("parsed record facts", at))?;
                    let span = side.at.ok_or(malformed("parsed record row", at))?.span;
                    if facts.abuts_next && span.end < end {
                        starts.push(span.end);
                    }
                    if facts.extra || crate::nodes::shown_as_error(facts.display()) || own_text(at)? {
                        lines(span, &mut starts);
                    } else if let Some(run) = run {
                        frames.push((run.in_place(arena)?, usize::MAX));
                    }
                }
                RunEntry::Row { facts, span, inner } => {
                    if facts.abuts_next && span.end < end {
                        starts.push(span.end);
                    }
                    if facts.extra || crate::nodes::shown_as_error(facts.display()) || inner == 0 {
                        lines(span, &mut starts);
                        for _ in 0..inner {
                            entries.next().ok_or(malformed("run row entries", holder_of(site)))??;
                        }
                        *left = left.saturating_sub(inner as usize);
                    }
                }
            }
        }
        starts.sort_unstable();
        starts.dedup();
        Ok(starts)
    }

    fn depth_move(&mut self, index: NodeIndex, kinds: crate::trivia_table::SurfaceKinds) -> Result<i32, ArenaError> {
        let of = |kind: crate::types::KindId| i32::from(kinds.is_depth_member(kind) && kind == kinds.indent) - i32::from(kinds.is_depth_member(kind) && kind == kinds.dedent);
        match self.site(index).ok_or(ArenaError::Malformed { what: "node id", word: index.0 })? {
            NodeSite::Record(at) => Ok(self.side(at)?.depth),
            NodeSite::Row { holder, entry } => {
                let (facts, _, inner, mut entries) = self.row_at(holder, entry, "run row")?;
                let mut moved = of(facts.kind);
                for _ in 0..inner {
                    moved += match entries.next().ok_or(malformed("run row entries", holder))?? {
                        RunEntry::Row { facts, .. } => of(facts.kind),
                        RunEntry::Record { at, .. } => self.side(at)?.depth,
                    };
                }
                Ok(moved)
            }
            NodeSite::Unit(_) | NodeSite::Flag { .. } => Ok(0),
        }
    }

    fn answer<T>(&mut self, answered: Result<T, ArenaError>, otherwise: T) -> T {
        answered.unwrap_or_else(|refusal| {
            self.table.refused.get_or_insert(refusal);
            otherwise
        })
    }

    fn facts(&self, index: NodeIndex) -> Option<NodeFacts> {
        self.table.met.get(index.0 as usize).map(|met| met.facts)
    }

    fn kid(&mut self, index: NodeIndex) -> Kid {
        let known = self.table.met.get(index.0 as usize).map(|met| met.kid);
        let unknown = Kid { index, start: 0, end: 0, count: 1, grammar: crate::types::KindId::ERROR, display: crate::types::KindId::ERROR, field: None, named: false, extra: false };
        self.answer(known.ok_or(ArenaError::Malformed { what: "node id", word: index.0 }), unknown)
    }

    fn kids(&mut self, index: NodeIndex) -> Kids {
        if let Some(kids) = self.table.met.get(index.0 as usize).and_then(|met| met.kids.clone()) {
            return kids;
        }
        let kids = self.kids_of(index);
        let kids = self.answer(kids, Kids::from([]));
        if let Some(met) = self.table.met.get_mut(index.0 as usize) {
            met.kids = Some(Kids::clone(&kids));
        }
        kids
    }

    /// The first or last child of the node at `index` with a place in the
    /// source: a unit its holder's cell or flag names has none.
    fn edge(&mut self, index: NodeIndex, side: Side) -> Option<Kid> {
        let found = self.edge_kid(index, side);
        self.answer(found, None)
    }

    fn edge_kid(&mut self, index: NodeIndex, side: Side) -> Result<Option<Kid>, ArenaError> {
        let found = match self.site(index).ok_or(ArenaError::Malformed { what: "node id", word: index.0 })? {
            NodeSite::Record(at) => self.run_edge(at, side)?,
            NodeSite::Row { holder, entry } => {
                let mut last = None;
                self.row_into(holder, entry, &mut |one| {
                    last = Some(one);
                    Ok(side == Side::After)
                })?;
                last
            }
            NodeSite::Unit(_) | NodeSite::Flag { .. } => None,
        };
        found.map(|one| self.listed_kid(index, one, 0)).transpose()
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

    fn edge_token(&mut self, holder: &Kid, side: Side, arm: &dyn Fn(KindId) -> Option<KindId>) -> Option<KindId> {
        self.answering(|walk| {
            let token = walk.edge_token(holder, side, arm);
            walk.answer(token, None)
        })
    }

    fn is_unit(&mut self, index: NodeIndex) -> bool {
        self.answering(|walk| matches!(walk.site(index), Some(NodeSite::Unit(_) | NodeSite::Flag { .. })))
    }

    fn child_past(&mut self, index: NodeIndex, byte: u32) -> Option<Kid> {
        self.answering(|walk| {
            let found = walk.child_past(index, byte);
            walk.answer(found, None)
        })
    }

    fn next(&mut self, index: NodeIndex) -> Option<Kid> {
        self.answering(|walk| {
            let found = walk.sibling(index, Side::After);
            walk.answer(found, None)
        })
    }

    fn previous(&mut self, index: NodeIndex) -> Option<Kid> {
        self.answering(|walk| {
            let found = walk.sibling(index, Side::Before);
            walk.answer(found, None)
        })
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

    /// A record's side holds its delimiter option; a row stores none, so a
    /// list read as one resolves it from its children.
    fn stored_delimiter(&mut self, at: &Kid) -> Option<Option<crate::types::Delimiter>> {
        self.answering(|walk| {
            let NodeSite::Record(record) = walk.site(at.index)? else { return None };
            let stored = walk.side(record).map(|side| side.delimiter);
            Some(walk.answer(stored, None))
        })
    }

    /// A record an `ERROR` holds names no node (`SideRecord::held_by_error`),
    /// so a node's own `ERROR` is the only one to find, and nothing above it
    /// is read.
    fn error_holding(&mut self, index: NodeIndex) -> Option<Kid> {
        let kid = self.kid(index);
        kid.error().then_some(kid)
    }

    fn bound(&mut self) -> Option<u32> {
        None
    }

    fn names(&mut self, index: NodeIndex) -> bool {
        self.site(index).is_some()
    }
}
