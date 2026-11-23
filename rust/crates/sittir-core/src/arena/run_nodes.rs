//! Navigation over parsed records alone (`Nodes`): a node's facts from its
//! record's side record or its row in its holder's run, its children from
//! that run, in document order, and its parent from its record's parent
//! word. No table of the tree's nodes is kept: a node is known to one
//! navigation by the id the navigation gives it when it first meets it, and
//! the ids go with the navigation. The source's root is id 0; an id says
//! nothing of where its node lies among the others.

use std::collections::HashMap;

use super::side::{NodeFacts, RunEntry};
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

/// A record's side record as a navigation has read it: its facts, where
/// its run lies, and whether the run's entries are read into it yet.
struct Read {
    side: SideRecord,
    run: Option<super::side::RunAt>,
    listed: bool,
}

#[derive(Default)]
struct Table {
    met: Vec<Met>,
    ids: HashMap<NodeSite, NodeIndex, crate::heap::IndexState>,
    sides: HashMap<Address, usize, crate::heap::IndexState>,
    read: Vec<Read>,
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

impl Walk<'_> {
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
        while let Some(child) = self.run(at)?.iter().rev().find_map(|entry| match *entry {
            RunEntry::Record { at, .. } => Some(at),
            RunEntry::Row { .. } => None,
        }) {
            at = child;
        }
        Ok(at)
    }

    /// The first and last record under the node kept at `of`, itself
    /// included for a record: a read drafted every record of a subtree in
    /// turn, from its root to the last on its rightmost path, so these bound
    /// them, and nothing above the node is read.
    fn records_under(&mut self, of: NodeSite) -> Result<Option<(Address, Address)>, ArenaError> {
        match of {
            NodeSite::Record(at) => Ok(Some((at, self.rightmost(at)?))),
            NodeSite::Row { holder, entry } => {
                let run = self.run(holder)?;
                let Some(&RunEntry::Row { inner, .. }) = run.get(entry as usize) else { return Err(malformed("run row", holder)) };
                let inside = run.get(entry as usize + 1..entry as usize + 1 + inner as usize).ok_or(malformed("run row entries", holder))?;
                let mut records = inside.iter().filter_map(|entry| match *entry {
                    RunEntry::Record { at, .. } => Some(at),
                    RunEntry::Row { .. } => None,
                });
                let Some(first) = records.next() else { return Ok(None) };
                let last = records.next_back().unwrap_or(first);
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
                let Some(&RunEntry::Row { inner, .. }) = self.run(holder)?.get(entry as usize) else { return Err(malformed("run row", holder)) };
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
        let Some(&RunEntry::Row { facts, span, inner }) = self.run(holder)?.get(entry as usize) else { return Err(malformed("cell row", holder)) };
        Ok(self.meet(NodeSite::Row { holder, entry }, facts, span, inner == 0, Parent::Unknown))
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
        self.table.read.push(Read { side, run, listed: false });
        self.table.sides.insert(at, self.table.read.len() - 1);
        Ok(self.table.read.len() - 1)
    }

    /// The facts of the side record of the record at `at`: every field but
    /// its slots and its run.
    fn side(&mut self, at: Address) -> Result<&SideRecord, ArenaError> {
        let read = self.read(at)?;
        Ok(&self.table.read[read].side)
    }

    /// The run of the record at `at`, its entries read on the first ask.
    fn run(&mut self, at: Address) -> Result<&[RunEntry], ArenaError> {
        let read = self.read(at)?;
        let Read { side, run, listed } = &mut self.table.read[read];
        if !*listed {
            if let Some(run) = run {
                side.run = run.entries(self.arena)?;
            }
            *listed = true;
        }
        Ok(&side.run)
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
        match self.table.read[read].run.map(|run| run.first(self.arena)).transpose()? {
            None => return Ok(!self.holds_unit(at)?),
            Some(RunEntry::Record { shared: true, .. }) => {}
            Some(_) => return Ok(false),
        }
        let mut entry = 0;
        loop {
            match self.run(at)?.get(entry).copied() {
                None => return Ok(!self.holds_unit(at)?),
                Some(RunEntry::Record { at: content, shared: true }) if self.childless(content)? => entry += 1,
                Some(_) => return Ok(false),
            }
        }
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

    /// The children of the node whose record is at `at`, in the order its
    /// render body writes them: each cell brings the run's entries up to the
    /// one it names, so trivia keeps its place, a unit or set flag with no
    /// row comes from its cell, and the rest of the run follows. A shared
    /// content lists its own in place of itself.
    fn listed_into(&mut self, at: Address, out: &mut Vec<Listed>) -> Result<(), ArenaError> {
        let (shape_of, bits, _) = self.shape;
        let arena = self.arena;
        let mut next = 0;
        if let Some(shape) = shape_of(arena.header_kind(at, bits)?) {
            let words = arena.words(at, shape.words)?;
            for part in shape.order {
                match *part {
                    BodySlot::Flag { word, bit, kind, tokens, field } => {
                        let held = *words.get(word as usize).ok_or(malformed("flag word", at))?;
                        if held >> bit & 1 == 1 && !self.flag_has_row(at, tokens, kind)? {
                            let token = *tokens.first().ok_or(malformed("flag keyword", at))?;
                            out.push(Listed::Unit { site: NodeSite::Flag { holder: at, word, bit }, kind: token, alias: (token != kind).then_some(kind), field, listed: false });
                        }
                    }
                    BodySlot::Cell(cell) => {
                        let cell = *shape.cells.get(usize::from(cell)).ok_or(malformed("body slot cell", at))?;
                        let held = words.get(cell.word as usize..(cell.word + cell.width) as usize).ok_or(malformed("cell word", at))?;
                        match cell.run {
                            None => self.list_cell(at, cell, 0, Cell::decode_parsed(held, cell, bits)?, &mut next, out)?,
                            Some(_) if held[0] == 0 => {}
                            Some(width) => {
                                for (item, value) in ListCell::of_word(CellWord(held[0]), arena)?.items(arena, width)?.enumerate() {
                                    self.list_cell(at, cell, item, Cell::decode_parsed(value, cell, bits)?, &mut next, out)?;
                                }
                            }
                        }
                    }
                }
            }
        }
        self.list_through(at, usize::MAX, &mut next, out)
    }

    /// Whether the run of the record at `at` holds its flag's keyword: a row
    /// of one of `tokens`, shown as `kind` or as itself, that no cell of the
    /// record names.
    fn flag_has_row(&mut self, at: Address, tokens: &[KindId], kind: KindId) -> Result<bool, ArenaError> {
        let (shape_of, bits, _) = self.shape;
        let mut named: Vec<u32> = super::view::parsed_cells(self.arena, at, shape_of, bits)?
            .into_iter()
            .filter_map(|(_, _, cell)| match cell {
                Cell::Unit { row: Some(row), .. } | Cell::ParsedLeaf { row, .. } if row.0 >= 2 => Some(row.0 - 2),
                _ => None,
            })
            .collect();
        named.sort_unstable();
        let run = self.run(at)?;
        let mut entry = 0;
        while let Some(&found) = run.get(entry) {
            let RunEntry::Row { facts, inner, .. } = found else {
                entry += 1;
                continue;
            };
            if tokens.contains(&facts.kind) && (facts.display() == kind || facts.display() == facts.kind) && named.binary_search(&crate::types::narrow(entry)).is_err() {
                return Ok(true);
            }
            entry += 1 + inner as usize;
        }
        Ok(false)
    }

    /// Lists what the cell value `held`, item `item` of the slot `cell` of
    /// the record at `at`, names.
    fn list_cell(&mut self, at: Address, cell: CellShape, item: usize, held: Cell, next: &mut usize, out: &mut Vec<Listed>) -> Result<(), ArenaError> {
        match held {
            Cell::Unit { kind, row: None } if kind != KindId::BLANK => {
                let site = crate::trivia_store::Site { holder: at, word: cell.word, item: crate::types::ItemIndex(crate::types::narrow(item)) };
                out.push(Listed::Unit { site: NodeSite::Unit(site), kind, alias: None, field: cell.field, listed: (cell.listed)(kind, self.shape.2) });
            }
            Cell::Unit { row: Some(row), .. } | Cell::ParsedLeaf { row, .. } if row.0 >= 2 => self.list_through(at, row.0 as usize - 2, next, out)?,
            Cell::Child { at: child, .. } => {
                let found = self.run(at)?.get(*next..).and_then(|rest| rest.iter().position(|entry| matches!(*entry, RunEntry::Record { at, .. } if at == child)));
                if let Some(found) = found {
                    self.list_through(at, *next + found, next, out)?;
                }
            }
            _ => {}
        }
        Ok(())
    }

    /// Lists the entries of the run of `at` from `next` through the entry
    /// numbered `last`, a row with what lies inside it.
    fn list_through(&mut self, at: Address, last: usize, next: &mut usize, out: &mut Vec<Listed>) -> Result<(), ArenaError> {
        while *next <= last {
            let Some(&found) = self.run(at)?.get(*next) else { break };
            match found {
                RunEntry::Record { at: content, shared: true } => self.listed_into(content, out)?,
                found => out.push(Listed::Entry(at, crate::types::narrow(*next), found)),
            }
            *next += 1 + match found {
                RunEntry::Row { inner, .. } => inner as usize,
                RunEntry::Record { .. } => 0,
            };
        }
        Ok(())
    }

    /// The entries inside the row at `entry` of the run of `holder`, one
    /// level down.
    fn inside(&mut self, holder: Address, entry: u32) -> Result<Vec<(Address, u32, RunEntry)>, ArenaError> {
        let run = self.run(holder)?;
        let Some(&RunEntry::Row { inner, .. }) = run.get(entry as usize) else { return Err(malformed("run row", holder)) };
        let (mut at, end) = (entry as usize + 1, entry as usize + 1 + inner as usize);
        let mut out = Vec::new();
        while at < end {
            let found = *run.get(at).ok_or(malformed("run row entries", holder))?;
            out.push((holder, crate::types::narrow(at), found));
            at += 1 + match found {
                RunEntry::Row { inner, .. } => inner as usize,
                RunEntry::Record { .. } => 0,
            };
        }
        Ok(out)
    }

    fn kids_of(&mut self, index: NodeIndex) -> Result<Kids, ArenaError> {
        let site = self.site(index).ok_or(ArenaError::Malformed { what: "node id", word: index.0 })?;
        let mut listed = Vec::new();
        match site {
            NodeSite::Record(at) => self.listed_into(at, &mut listed)?,
            NodeSite::Row { holder, entry } => listed.extend(self.inside(holder, entry)?.into_iter().map(|(holder, entry, found)| Listed::Entry(holder, entry, found))),
            NodeSite::Unit(_) | NodeSite::Flag { .. } => {}
        }
        let named = self.shape.2;
        let mut at = self.table.met[index.0 as usize].kid.start;
        let mut kids = Vec::with_capacity(listed.len());
        for one in listed {
            let kid = match one {
                Listed::Entry(_, _, RunEntry::Record { at, .. }) => self.record(at, Parent::Node(index))?,
                Listed::Entry(holder, entry, RunEntry::Row { facts, span, inner }) => self.meet(NodeSite::Row { holder, entry }, facts, span, inner == 0, Parent::Node(index)),
                Listed::Unit { site, kind, alias, field, listed } => {
                    let facts = NodeFacts { kind, field, alias, named: listed || named(alias.unwrap_or(kind)), extra: false, missing: false, holds_error: false, abuts_next: false };
                    self.meet(site, facts, Span { start: at, end: at }, true, Parent::Node(index))
                }
            };
            let kid = self.table.met[kid.0 as usize].kid;
            at = kid.end;
            kids.push(kid);
        }
        Ok(kids.into())
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
                            let held = SideRecord::read(self.arena, super::side_of(self.arena, at)?)?;
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
        let end = self.table.met[index.0 as usize].kid.end;
        let mut starts = Vec::new();
        let mut pending = vec![index];
        while let Some(at) = pending.pop() {
            let met = &self.table.met[at.0 as usize];
            let (site, kid, facts) = (met.site, met.kid, met.facts);
            let own_text = match site {
                NodeSite::Record(record) => shape_of(self.arena.header_kind(record, bits)?).is_some_and(|shape| shape.own_text),
                _ => false,
            };
            let token = match site {
                NodeSite::Unit(_) | NodeSite::Flag { .. } => false,
                _ if kid.entry() || own_text => true,
                NodeSite::Row { .. } if kid.count == 1 => true,
                _ => {
                    if kid.count > 1 {
                        pending.extend(self.kids(at).iter().map(|kid| kid.index));
                    }
                    false
                }
            };
            if facts.abuts_next && kid.end < end {
                starts.push(kid.end);
            }
            if !token {
                continue;
            }
            let mut from = kid.start;
            while let Some(found) = source.get(Span { start: from, end: kid.end }.range()).and_then(|text| text.find('\n')) {
                let line = from + crate::types::narrow(found) + 1;
                if line >= kid.end {
                    break;
                }
                starts.push(line);
                from = line;
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
        let kids = self.kids(index);
        let placed = |kid: &&Kid| !matches!(self.site(kid.index), Some(NodeSite::Unit(_) | NodeSite::Flag { .. }));
        match side {
            Side::Before => kids.iter().find(placed).copied(),
            Side::After => kids.iter().rev().find(placed).copied(),
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

    fn edge_token(&mut self, holder: &Kid, side: Side, arm: &dyn Fn(KindId) -> Option<KindId>) -> Option<KindId> {
        self.answering(|walk| {
            let token = walk.edge_token(holder, side, arm);
            walk.answer(token, None)
        })
    }

    fn is_unit(&mut self, index: NodeIndex) -> bool {
        self.answering(|walk| matches!(walk.site(index), Some(NodeSite::Unit(_) | NodeSite::Flag { .. })))
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
