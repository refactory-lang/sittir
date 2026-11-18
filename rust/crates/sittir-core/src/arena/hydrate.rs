//! Direct hydration: a parsed node's record written from its tree as the
//! node's routing walk reaches each child, with no native node made first.
//! The derive writes each node type's walk (`HydrateNode`) beside its typed
//! read, through the same router; a slot's cells come from its stamps alone.
//!
//! A child with a record of its own is held by its record's address, its
//! record published as its own walk ends. A leaf, a unit and a captured
//! string have no record and are held whole. An extra no cell names: the walk that meets it among its node's
//! children writes it whole when the walk's reader reads it as a record, and
//! its tree holds the record. A walk writes only the nodes its holder's cell
//! names and those extras, and a holder's walk is the one walk that does, so
//! a tree holds one record per row.
//!
//! A record is written in place: its walk reserves its words in one chunk
//! when it starts, and writes each cell there as its slot closes. A list's
//! run is reserved when its slot closes, its length known then; a side
//! record is written when its record's walk ends. What a refused walk wrote before
//! it was refused stays written.

use super::side::{NodeFacts, RunEntry};
use super::{Address, ArenaError, Cell, CellShape, ListCell, RecordSpace, Row, SideRecord};
use crate::read::{Elided, ReadCtx, ReadError, ReadNode, ReadSlot, SlotSite};
use crate::record::{stored, Stored, HEADER_WORDS};
use crate::slot::SlotValue;
use crate::types::{KindId, NodeIndex, Span};
use crate::NonEmptyVec;
use crate::tree_sitter::TreeCursor;

/// What a refused hydration names: the read's refusal, or the arena's.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum HydrateError {
    Read(ReadError),
    Arena(ArenaError),
}

impl From<ReadError> for HydrateError {
    fn from(error: ReadError) -> Self {
        Self::Read(error)
    }
}

impl From<ArenaError> for HydrateError {
    fn from(error: ArenaError) -> Self {
        Self::Arena(error)
    }
}

impl HydrateError {
    /// The refusal in words, naming kinds by `kind_name`.
    #[must_use]
    pub fn describe(&self, kind_name: &dyn Fn(KindId) -> &'static str) -> String {
        match self {
            Self::Read(error) => error.describe(kind_name),
            Self::Arena(error) => error.to_string(),
        }
    }
}

/// What a parsed child is held as in its holder's record.
#[derive(Debug)]
pub enum Hydrated {
    /// A leaf: its stored kind, its row and its byte span.
    Leaf { kind: KindId, row: NodeIndex, span: Span },
    /// A node whose record its walk published: its stored kind and record.
    Record { kind: KindId, at: Address },
    /// A unit and the row it was read at; the blank arm has none.
    Unit { kind: KindId, row: Option<NodeIndex> },
    /// A captured string.
    Text { span: Span },
}

impl Hydrated {
    /// The blank arm.
    pub const BLANK: Hydrated = Hydrated::Unit { kind: KindId::BLANK, row: None };

    fn cell(&self) -> Cell {
        match *self {
            Hydrated::Leaf { kind, row, span } => Cell::ParsedLeaf { kind, span, row },
            Hydrated::Record { kind, at } => Cell::Child { kind, at, link: None, changed: crate::slot::ChangedEdges::default() },
            Hydrated::Unit { kind, row } => Cell::Unit { kind, row },
            Hydrated::Text { span } => Cell::ParsedText { span },
        }
    }
}

/// A record its walk writes in place: where its words are, reserved when
/// the walk started, and how many.
#[derive(Debug, Clone, Copy)]
pub struct Draft {
    at: Address,
    words: u32,
}

impl Draft {
    /// Where the `width` words from word `word` of the record lie.
    ///
    /// # Errors
    ///
    /// `ArenaError::Malformed` for words past the record's.
    fn place(self, word: u32, width: u32) -> Result<Address, ArenaError> {
        let malformed = ArenaError::Malformed { what: "cell word", word };
        if word.checked_add(width).is_none_or(|end| end > self.words) {
            return Err(malformed);
        }
        self.at.offset(word).ok_or(malformed)
    }
}

/// The walk of the extra a walk meets with the cursor on it (`kid`), as the
/// walk's reader reads it: whether it entered the extra, writing every row
/// under it.
type ExtraWalk = fn(&mut TreeCursor<'_>, &mut ReadCtx<'_>, &mut Hydration<'_>, &crate::nodes::Kid) -> Result<bool, HydrateError>;

/// Where a hydration writes: the tree's arena, and how its walks read the
/// extras they meet (`Hydration::extra`).
pub struct Hydration<'a> {
    tree: &'a mut dyn HydrateInto,
    extras: Option<ExtraWalk>,
    /// The records whose walks are open, outermost first, each with the
    /// run of its children as its walk has met them.
    open: Vec<OpenRun>,
    /// The node the last `meet` met.
    met: Option<NodeFacts>,
    /// The node and its descendant index the walk about to draft a record
    /// stands on (`Hydration::node`).
    entering: Option<(NodeIndex, NodeFacts)>,
    /// The descendant index of the node the last `meet` met.
    met_at: Option<NodeIndex>,
    /// The entry of the source the records are read from, which each names.
    source: Option<Address>,
    /// The grammar's depth members, when the walk stamps each record's
    /// depth move.
    kinds: Option<crate::trivia_table::SurfaceKinds>,
    /// The nodes the walk is under whose records the hydration writes
    /// itself, an `ERROR` or an extra no reader reads, outermost first,
    /// where the records outlive their tree: each one's record, the
    /// descendant index its subtree ends at, and its row.
    errors: Vec<(Draft, u32, Row)>,
    /// How the read stamps a coordinate's kind (`read::stamp`), where the
    /// records outlive their tree and each keeps its coordinate's.
    stamp: Option<Stamp>,
    /// Each extra a walk met, on the side of the node it is placed on
    /// (`OpenRun::placed`), in document order within a record.
    placed: Vec<Placed>,
    /// The source the walk reads.
    text: &'a str,
    /// Where each list item the source sets apart from the item before it
    /// with a blank line is kept (`Hydration::list`).
    apart: Vec<super::NodeSite>,
}

/// An extra or an `ERROR` placed on a side of a node: where the node is
/// kept, the side, the entry's record, and the record's kind and bytes.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Placed {
    pub site: super::NodeSite,
    pub side: crate::trivia_table::TriviaSide,
    pub extra: Address,
    pub kind: KindId,
    pub span: Span,
}

/// What placing reads of a child a walk met, beside its entry: whether it
/// is named, and for an extra or an `ERROR` its record's kind.
#[derive(Debug, Clone, Copy)]
struct Beside {
    kind: KindId,
    named: bool,
    /// Whether the node is an extra or an `ERROR`: an entry of a side, and
    /// no child a side is placed on.
    aside: bool,
    extra: Option<KindId>,
    span: Span,
}

/// The two answers `read::stamp` takes of a grammar: whether a display kind
/// shows, and whether a grammar kind relaxes to a display kind.
type Stamp = (fn(KindId) -> bool, fn(KindId, KindId) -> bool);

type Edges = (super::NodeSite, super::NodeSite);

/// What a hydration writes into: the space its records take.
pub trait HydrateInto: RecordSpace {}

impl HydrateInto for super::ReadWriter<'_> {}

/// A record whose walk is open: where it is, the node it is of, and the run
/// of its children so far. `rows` holds the rows still open, each by its
/// entry and the descendant index its subtree ends at; `last` the entry of
/// the child met last; `early` the records of children whose walks ended
/// before the walk met them; `met` each row's node with its entry, in the
/// order the walk met them.
struct OpenRun {
    at: Address,
    index: Option<NodeIndex>,
    facts: Option<NodeFacts>,
    entries: Vec<RunEntry>,
    rows: Vec<(usize, u32)>,
    last: Option<(NodeIndex, usize)>,
    early: Vec<(NodeIndex, Address, Option<Edges>)>,
    met: Vec<(NodeIndex, u32)>,
    /// What placing reads of each entry, entry for entry.
    beside: Vec<Beside>,
    /// For each child that is a list with a record of its own, by its
    /// entry: where the nodes an extra leading it and one trailing it are
    /// placed on are kept (`OpenRun::edges`).
    passes: Vec<(usize, Edges)>,
    /// The levels the node's own kind and the nodes met under it open net
    /// of those they close, and the node's own share of that.
    depth: i32,
    own: i32,
    /// Whether the node is an extra or an `ERROR`, or lies under one: an
    /// entry a side holds whole, under which nothing is placed.
    within: bool,
}

impl OpenRun {
    /// Closes each open row whose subtree ends at or before `index`: the
    /// entries after it so far are the ones inside it.
    fn close_to(&mut self, index: u32) {
        while let Some(&(entry, end)) = self.rows.last() {
            if end > index {
                break;
            }
            self.rows.pop();
            let inside = crate::types::narrow(self.entries.len() - entry - 1);
            if let RunEntry::Row { inner, .. } = &mut self.entries[entry] {
                *inner = inside;
            }
        }
    }

    /// Adds the node `kid` the walk met, with `facts`: the record its walk
    /// already wrote, else its row.
    fn meet(&mut self, kid: &crate::nodes::Kid, facts: NodeFacts, depth: i32, beside: Beside) {
        self.close_to(kid.index.get());
        if self.index == Some(kid.index) {
            return;
        }
        if let Some(found) = self.early.iter().position(|&(index, ..)| index == kid.index) {
            let (_, at, edges) = self.early.swap_remove(found);
            self.passes.extend(edges.map(|edges| (self.entries.len(), edges)));
            self.entries.push(RunEntry::Record { at, shared: false });
            self.beside.push(beside);
            return;
        }
        self.beside.push(beside);
        let entry = self.entries.len();
        self.entries.push(RunEntry::Row { facts, span: kid.span(), inner: 0 });
        self.rows.push((entry, kid.index.get() + kid.count));
        self.last = Some((kid.index, entry));
        self.met.push((kid.index, crate::types::narrow(entry)));
        self.depth += depth;
    }

    /// Names the record at `at` of the child at `index`, whose walk ended:
    /// in place of its row when the walk met it last, as a content of the
    /// record's own node when it is that node, else kept until the walk
    /// meets it.
    /// `depth` is the child's depth move and `own` its own kind's share,
    /// which this run counted already when it met the child or is the same
    /// node.
    fn name(&mut self, index: Option<NodeIndex>, at: Address, depth: i32, own: i32, edges: Option<Edges>) {
        match (index, self.last) {
            (Some(index), _) if self.index == Some(index) => {
                self.entries.push(RunEntry::Record { at, shared: true });
                self.beside.push(Beside { kind: KindId::BLANK, named: false, aside: true, extra: None, span: Span { start: 0, end: 0 } });
                self.depth += depth - own;
            }
            (Some(index), Some((last, entry))) if last == index && entry + 1 == self.entries.len() => {
                self.rows.pop_if(|&mut (open, _)| open == entry);
                self.entries[entry] = RunEntry::Record { at, shared: false };
                self.passes.extend(edges.map(|edges| (entry, edges)));
                self.depth += depth - own;
            }
            (Some(index), _) => {
                self.early.push((index, at, edges));
                self.depth += depth;
            }
            (None, _) => {}
        }
    }

    /// Where the entry at `entry` is kept: its record, else its row here.
    fn site(&self, entry: usize) -> super::NodeSite {
        match self.entries[entry] {
            RunEntry::Record { at, .. } => super::NodeSite::Record(at),
            RunEntry::Row { .. } => super::NodeSite::Row { holder: self.at, entry: crate::types::narrow(entry) },
        }
    }

    /// The entries directly under the row at `holder`, or under the
    /// record's node for none, that a side is placed on: no extra, no
    /// `ERROR`, and no content the node shares.
    fn children(&self, holder: Option<usize>) -> Vec<usize> {
        let (mut at, end) = match holder {
            None => (0, self.entries.len()),
            Some(holder) => match self.entries[holder] {
                RunEntry::Row { inner, .. } => (holder + 1, holder + 1 + inner as usize),
                RunEntry::Record { .. } => (0, 0),
            },
        };
        let mut found = Vec::new();
        while at < end {
            if !self.beside[at].aside {
                found.push(at);
            }
            at += 1 + match self.entries[at] {
                RunEntry::Row { inner, .. } => inner as usize,
                RunEntry::Record { .. } => 0,
            };
        }
        found
    }

    /// The item a list of `kind` spanning `span` passes an extra on `side`
    /// to: its first or last child among `children`, when that begins or
    /// ends where the list does and the surface exposes it as a node.
    fn passed(&self, kind: KindId, span: Span, children: &[usize], leading: bool, kinds: crate::trivia_table::SurfaceKinds) -> Option<usize> {
        if !kinds.lists.contains(&kind) {
            return None;
        }
        let item = *if leading { children.first() } else { children.last() }?;
        let beside = &self.beside[item];
        let touches = if leading { beside.span.start == span.start } else { beside.span.end == span.end };
        (touches && beside.named && !kinds.units.contains(&beside.kind)).then_some(item)
    }

    /// Where the node an extra on a side of the entry at `entry` is placed
    /// on is kept: the entry's own node, or the item its list passes the
    /// extra to.
    fn target(&self, entry: usize, leading: bool, kinds: Option<crate::trivia_table::SurfaceKinds>) -> super::NodeSite {
        if let Some(&(_, (lead, trail))) = self.passes.iter().find(|&&(passing, _)| passing == entry) {
            return if leading { lead } else { trail };
        }
        if let RunEntry::Record { at, .. } = self.entries[entry] {
            return super::NodeSite::Record(at);
        }
        let beside = &self.beside[entry];
        match kinds.and_then(|kinds| self.passed(beside.kind, beside.span, &self.children(Some(entry)), leading, kinds)) {
            Some(item) => self.target(item, leading, kinds),
            None => self.site(entry),
        }
    }

    /// Where the nodes an extra leading the record's node and one trailing
    /// it are placed on are kept, for a list; none for any other node, which
    /// takes them itself.
    fn edges(&self, span: Option<Span>, kinds: Option<crate::trivia_table::SurfaceKinds>) -> Option<Edges> {
        let (facts, span, kinds) = (self.facts?, span?, kinds?);
        if !kinds.lists.contains(&facts.kind) {
            return None;
        }
        let own = super::NodeSite::Record(self.at);
        let children = self.children(None);
        let edge = |leading: bool| self.passed(facts.kind, span, &children, leading, kinds).map_or(own, |item| self.target(item, leading, Some(kinds)));
        Some((edge(true), edge(false)))
    }

    /// Each extra among the children of the record's node and of the rows
    /// under it, on the side of the child it is placed on
    /// (`trivia_table::owner`, its siblings the children around it), the
    /// node that side is kept on its `target`, or the `inner` of the node
    /// that holds it.
    fn placed(&self, kinds: Option<crate::trivia_table::SurfaceKinds>, text: &str, out: &mut Vec<Placed>) {
        use crate::trivia_table::{owner, Owner, Sibling, TriviaSide};
        if self.within || self.beside.iter().all(|beside| beside.extra.is_none()) {
            return;
        }
        let mut open: Vec<(Option<usize>, usize, Vec<usize>)> = vec![(None, self.entries.len(), Vec::new())];
        let close = |holder: Option<usize>, children: &[usize], out: &mut Vec<Placed>| {
            let siblings: Vec<Sibling> = children
                .iter()
                .map(|&child| {
                    let beside = &self.beside[child];
                    Sibling { span: beside.span, holder: beside.named && !beside.aside, entry: beside.aside }
                })
                .collect();
            for (position, &child) in children.iter().enumerate() {
                let (Some(kind), RunEntry::Record { at: extra, .. }) = (self.beside[child].extra, self.entries[child]) else { continue };
                let span = self.beside[child].span;
                let (site, side) = match owner(&siblings[..position], span, &siblings[position + 1..], text) {
                    Owner::Trailing { at } => (self.target(children[at], false, kinds), TriviaSide::Trailing),
                    Owner::Leading { at } => (self.target(children[position + 1 + at], true, kinds), TriviaSide::Leading),
                    Owner::Inner => (holder.map_or(super::NodeSite::Record(self.at), |holder| self.site(holder)), TriviaSide::Inner),
                };
                out.push(Placed { site, side, extra, kind, span });
            }
        };
        for (at, entry) in self.entries.iter().enumerate() {
            while open.len() > 1 && open.last().is_some_and(|&(_, end, _)| end <= at) {
                if let Some((holder, _, children)) = open.pop() {
                    close(holder, &children, out);
                }
            }
            if let Some((_, _, children)) = open.last_mut() {
                children.push(at);
            }
            if let RunEntry::Row { inner, .. } = *entry {
                if inner > 0 {
                    open.push((Some(at), at + 1 + inner as usize, Vec::new()));
                }
            }
        }
        while let Some((holder, _, children)) = open.pop() {
            close(holder, &children, out);
        }
    }
}

/// The extra the cursor stands on (`kid`) walked whole into `N` when `N`
/// reads it as a record (`ReadNode::router`).
fn extra_walk<N: HydrateNode>(cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, records: &mut Hydration<'_>, kid: &crate::nodes::Kid) -> Result<bool, HydrateError> {
    if N::router(kid.grammar, kid.display).is_none() {
        return Ok(false);
    }
    crate::stack::grown(|| N::hydrate(cursor, ctx, records))?;
    Ok(true)
}

impl<'a> Hydration<'a> {
    /// A hydration into `tree` whose walks hold no extra: `hydrate_into`
    /// makes the one a walk writes records through.
    pub(crate) fn new(tree: &'a mut dyn HydrateInto) -> Self {
        Self { tree, extras: None, open: Vec::new(), met: None, entering: None, met_at: None, source: None, kinds: None, errors: Vec::new(), stamp: None, placed: Vec::new(), text: "", apart: Vec::new() }
    }

    /// The levels a node of `kind` opens (1), closes (-1) or neither, as
    /// the grammar's depth members go; 0 for a walk that stamps none.
    fn depth_of(&self, kind: KindId) -> i32 {
        self.kinds.map_or(0, |kinds| i32::from(kind == kinds.indent && kinds.is_depth_member(kind)) - i32::from(kind == kinds.dedent && kinds.is_depth_member(kind)))
    }

    /// Tells the hydration the node `at` the walk about to draft a record
    /// stands on, `node`.
    pub fn node(&mut self, at: &crate::nodes::Kid, node: &crate::tree_sitter::Node<'_>) {
        self.entering = Some((at.index, facts_of(at, node)));
    }

    /// Writes the record of the extra `kid` the cursor stands on, read whole
    /// as the walk's reader reads it, when the reader reads it as a record:
    /// no cell names an extra, so its tree holds the record. Whether the walk
    /// entered the extra, writing every row under it; not for a leaf extra,
    /// an `ERROR`, an extra its tree already holds, or a hydration whose
    /// walks hold none, whose rows the walk writes itself. Where the
    /// records outlive their tree, an extra no reader reads as a record
    /// gets one the hydration writes itself, as an `ERROR` does: a header of
    /// its kind, and the rows under it as its run, so a side's node is
    /// always a record.
    ///
    /// # Errors
    ///
    /// What the extra's hydration and the arena refuse.
    pub fn extra(&mut self, cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, kid: &crate::nodes::Kid) -> Result<bool, HydrateError> {
        let Some(walk) = self.extras else { return Ok(false) };
        if !kid.extra || kid.error() {
            return Ok(false);
        }
        let read = walk(cursor, ctx, self, kid)?;
        if !read && self.met_at == Some(kid.index) {
            self.entering = self.met.map(|facts| (kid.index, facts));
            let kind = ctx.stamped_kind(kid.grammar, kid.display);
            let draft = self.open_record(kind, HEADER_WORDS)?;
            self.errors.push((draft, kid.index.get() + kid.count, Row { kind, span: kid.span() }));
        }
        Ok(read)
    }

    /// The record of `kind`, `words` words, its header written: reserved in
    /// one chunk.
    ///
    /// # Errors
    ///
    /// `ArenaError::Malformed` for a record narrower than its header, or of
    /// a kind its arena's kind field cannot hold; and what the arena refuses.
    pub fn draft(&mut self, kind: KindId, words: u32) -> Result<Draft, HydrateError> {
        if kind == KindId::ERROR {
            return Err(ArenaError::Malformed { what: "record header", word: u32::from(kind.0) }.into());
        }
        self.open_record(kind, words)
    }

    /// `draft`, for any kind a header holds: an `ERROR`'s record is the
    /// hydration's own to write.
    fn open_record(&mut self, kind: KindId, words: u32) -> Result<Draft, HydrateError> {
        if words < HEADER_WORDS || kind == KindId::BLANK {
            return Err(ArenaError::Malformed { what: "record header", word: u32::from(kind.0) }.into());
        }
        let header = super::with_kind(kind, self.tree.kind_bits())?;
        let at = self.tree.alloc(words)?;
        self.tree.words_mut(at, 1)?[0] = header;
        let entering = self.entering.take().or_else(|| self.met_at.zip(self.met));
        let own = entering.map_or(0, |(_, facts)| self.depth_of(facts.kind));
        let within = self.open.last().is_some_and(|open| open.within) || entering.is_some_and(|(_, facts)| facts.extra || facts.kind == KindId::ERROR);
        self.open.push(OpenRun { at, index: entering.map(|(index, _)| index), facts: entering.map(|(_, facts)| facts), entries: Vec::new(), rows: Vec::new(), last: None, early: Vec::new(), beside: Vec::new(), passes: Vec::new(), met: Vec::new(), depth: own, own, within });
        Ok(Draft { at, words })
    }

    /// `value` as the record `draft` holds it: a leaf or a unit named by
    /// the record's run, 1 for the record's own node, else two past the
    /// node's entry there, since a cell packs no row 0.
    ///
    /// # Errors
    ///
    /// `ArenaError::Malformed` for a node the record's walk did not meet.
    fn held(&self, draft: Draft, value: Hydrated) -> Result<Hydrated, ArenaError> {
        let in_run = |row: NodeIndex| {
            let outside = ArenaError::Malformed { what: "cell row outside its holder's run", word: row.0 };
            let open = self.open.iter().rfind(|open| open.at == draft.at).ok_or(outside.clone())?;
            if open.index == Some(row) {
                return Ok(NodeIndex(1));
            }
            let found = open.met.binary_search_by_key(&row, |&(index, _)| index).map_err(|_| outside)?;
            Ok(NodeIndex(open.met[found].1 + 2))
        };
        Ok(match value {
            Hydrated::Leaf { kind, row, span } => Hydrated::Leaf { kind, row: in_run(row)?, span },
            Hydrated::Unit { kind, row: Some(row) } => Hydrated::Unit { kind, row: Some(in_run(row)?) },
            value => value,
        })
    }

    /// Writes the cell of the slot of shape `shape` of `draft`: `value`,
    /// `None` absent.
    ///
    /// # Errors
    ///
    /// What encoding the cell refuses, and a cell past the record's words.
    pub fn cell(&mut self, draft: Draft, shape: CellShape, value: Option<Hydrated>) -> Result<(), HydrateError> {
        let bits = self.tree.kind_bits();
        let value = value.map(|value| self.held(draft, value)).transpose()?;
        let out = self.tree.words_mut(draft.place(shape.word, shape.width)?, shape.width)?;
        value.map_or(Cell::Absent, |value| value.cell()).encode_parsed(out, shape, bits)?;
        Ok(())
    }

    /// Writes the list of the slot of shape `shape` of `draft`, its items
    /// `items`, a `None` item absent: their run, reserved now its length is
    /// known, and the one word naming it. Each item after the first the
    /// source sets apart from the one before is noted (`set_apart`).
    ///
    /// # Errors
    ///
    /// What encoding an item refuses, a cell past the record's words, and
    /// what the arena refuses.
    pub fn list(&mut self, draft: Draft, shape: CellShape, items: impl ExactSizeIterator<Item = Option<Hydrated>>) -> Result<(), HydrateError> {
        let len = u32::try_from(items.len()).map_err(|_| ArenaError::Full)?;
        if len == 0 {
            return Ok(());
        }
        let width = shape.run.ok_or(ArenaError::Malformed { what: "list run width", word: shape.word })?;
        let words = len.checked_mul(width).and_then(|cells| cells.checked_add(1)).ok_or(ArenaError::Full)?;
        let cell = draft.place(shape.word, 1)?;
        let bits = self.tree.kind_bits();
        let items = items.map(|item| item.map(|item| self.held(draft, item)).transpose()).collect::<Result<Vec<_>, _>>()?;
        if let Some(item) = (crate::types::NodeName::SITE_ITEMS..len).zip(&items[crate::types::NodeName::SITE_ITEMS.min(len) as usize..]).find_map(|(item, value)| matches!(value, Some(Hydrated::Leaf { .. })).then_some(item)) {
            return Err(ArenaError::LeafItemPastNames { item }.into());
        }
        self.set_apart(draft, &items)?;
        let run = self.tree.alloc(words)?;
        let out = self.tree.words_mut(run, words)?;
        out[0] = len;
        for (item, out) in items.into_iter().zip(out[1..].chunks_exact_mut(width as usize)) {
            item.map_or(Cell::Absent, |item| item.cell()).encode_parsed(out, shape, bits)?;
        }
        self.tree.words_mut(cell, 1)?[0] = ListCell::word(run)?.0;
        Ok(())
    }

    /// Marks each of `items`, the list of `draft` as its run holds them,
    /// that the source sets apart from the item before it with a blank line
    /// (`list_slots::sets_apart`), the extras and `ERROR`s between the two
    /// among the run's entries: an item with a record leads with a blank
    /// line in its header's layout (`HeaderLayout`), and any other item's
    /// site is noted for its side.
    ///
    /// # Errors
    ///
    /// What reading or writing an item record's header refuses.
    fn set_apart(&mut self, draft: Draft, items: &[Option<Hydrated>]) -> Result<(), ArenaError> {
        let Some(open) = self.open.iter().rfind(|open| open.at == draft.at) else { return Ok(()) };
        let mut apart = Vec::new();
        let mut unsearched = 0;
        let mut before: Option<usize> = None;
        for item in items.iter().flatten() {
            let entry = match *item {
                Hydrated::Record { at, .. } => open.entries[unsearched..].iter().position(|entry| matches!(*entry, RunEntry::Record { at: held, .. } if held == at)).map(|found| unsearched + found),
                Hydrated::Leaf { row, .. } | Hydrated::Unit { row: Some(row), .. } => row.get().checked_sub(2).map(|entry| entry as usize),
                Hydrated::Unit { row: None, .. } | Hydrated::Text { .. } => None,
            };
            let Some(entry) = entry else { continue };
            unsearched = unsearched.max(entry + 1);
            let Some(last) = before.replace(entry) else { continue };
            let extras = (last + 1..entry).filter(|&at| open.beside[at].aside).map(|at| open.beside[at].span);
            if crate::list_slots::sets_apart(self.text, open.beside[last].span.end, open.beside[entry].span.start, extras) {
                apart.push(open.site(entry));
            }
        }
        let bits = self.tree.kind_bits();
        for site in apart {
            let super::NodeSite::Record(at) = site else {
                self.apart.push(site);
                continue;
            };
            let header = &mut self.tree.words_mut(at, 1)?[0];
            let mut layout = super::cell::HeaderLayout::of(*header, bits)?;
            layout.leading[0] = crate::layout_kinds::LayoutKinds::BLANKLINE;
            *header = layout.onto(*header, bits)?;
        }
        Ok(())
    }

    /// The facts of the node `cursor` stands on (`Kid::at`), met by the
    /// record open over it.
    ///
    /// # Errors
    ///
    /// What ending an `ERROR`'s record or opening one refuses.
    pub fn meet(&mut self, cursor: &TreeCursor<'_>) -> Result<crate::nodes::Kid, HydrateError> {
        let node = cursor.node();
        let kid = crate::nodes::Kid::of(&node, crate::read::index_of(cursor), crate::read::field_id(cursor));
        self.leave_errors(kid.index.get())?;
        let facts = facts_of(&kid, &node);
        let depth = self.depth_of(kid.grammar);
        let stamped = |stamp: Stamp| crate::read::stamp(facts.kind, facts.display(), stamp.0, stamp.1);
        let aside = kid.extra || kid.error();
        let kind = if kid.error() { KindId::ERROR } else { self.stamp.map_or(facts.kind, stamped) };
        let beside = Beside { kind: kid.grammar, named: kid.named && kid.start < kid.end, aside, extra: aside.then_some(kind), span: kid.span() };
        if let Some(open) = self.open.last_mut() {
            open.meet(&kid, facts, depth, beside);
        }
        self.met = Some(facts);
        self.met_at = Some(kid.index);
        if kid.error() {
            self.entering = Some((kid.index, facts));
            let draft = self.open_record(KindId::ERROR, HEADER_WORDS)?;
            let kind = self.stamp.map_or(facts.kind, |(shows, relaxes)| crate::read::stamp(facts.kind, facts.display(), shows, relaxes));
            self.errors.push((draft, kid.index.get() + kid.count, Row { kind, span: kid.span() }));
        }
        Ok(kid)
    }

    /// Ends the record of each `ERROR` whose subtree ends at or before the
    /// node at descendant `index`: the walk has left it, so its run holds
    /// every node under it.
    fn leave_errors(&mut self, index: u32) -> Result<(), HydrateError> {
        while let Some(&(draft, end, row)) = self.errors.last() {
            if end > index {
                break;
            }
            self.errors.pop();
            self.finish(draft, &parsed_side(row, None), KindId::ERROR)?;
        }
        Ok(())
    }

    /// Writes the row of every node under the one `cursor` stands on, which
    /// holds `count` nodes counting itself: a subtree the walk does not
    /// enter. The cursor ends where it started.
    ///
    /// # Errors
    ///
    /// What writing a row refuses.
    pub fn meet_under(&mut self, cursor: &mut TreeCursor<'_>, count: u32) -> Result<(), HydrateError> {
        if count <= 1 || !cursor.goto_first_child() {
            return Ok(());
        }
        let mut levels = 1;
        let met = loop {
            if let Err(refusal) = self.meet(cursor) {
                break Err(refusal);
            }
            if cursor.goto_first_child() {
                levels += 1;
                continue;
            }
            while !cursor.goto_next_sibling() {
                cursor.goto_parent();
                levels -= 1;
                if levels == 0 {
                    return Ok(());
                }
            }
        };
        for _ in 0..levels {
            cursor.goto_parent();
        }
        met
    }

    /// Writes the row of the node `cursor` stands on and of every node
    /// under it: a subtree no walk enters. The cursor ends where it started.
    ///
    /// # Errors
    ///
    /// What writing a row refuses.
    pub fn meet_whole(&mut self, cursor: &mut TreeCursor<'_>) -> Result<(), HydrateError> {
        let kid = self.meet(cursor)?;
        self.meet_under(cursor, kid.count)
    }

    /// Writes the row of every child of the node `cursor` stands on, and of
    /// every node under each child but `entered`, whose walk wrote its own.
    /// The cursor ends where it started.
    ///
    /// # Errors
    ///
    /// What writing a row refuses.
    pub fn meet_children_but(&mut self, cursor: &mut TreeCursor<'_>, entered: NodeIndex) -> Result<(), HydrateError> {
        if !cursor.goto_first_child() {
            return Ok(());
        }
        let met = loop {
            if let Err(refusal) = self.meet(cursor).and_then(|kid| if kid.index == entered { Ok(()) } else { self.meet_under(cursor, kid.count) }) {
                break Err(refusal);
            }
            if !cursor.goto_next_sibling() {
                break Ok(());
            }
        };
        cursor.goto_parent();
        met
    }

    /// Sets the presence bit `bit` of word `word` of `draft` when `present`.
    ///
    /// # Errors
    ///
    /// A word past the record's.
    pub fn flag(&mut self, draft: Draft, word: u32, bit: u32, present: bool) -> Result<(), HydrateError> {
        if present {
            self.tree.words_mut(draft.place(word, 1)?, 1)?[0] |= 1 << bit;
        }
        Ok(())
    }

    /// Ends the walk of the record `draft` of `kind`: writes its side record
    /// `side`, and answers what its holder holds, the record.
    ///
    /// # Errors
    ///
    /// What the arena refuses.
    pub fn finish(&mut self, draft: Draft, side: &SideRecord, kind: KindId) -> Result<Hydrated, HydrateError> {
        let opened = |open: &[OpenRun], at: Address| open.iter().rposition(|open| open.at == at);
        while let Some(&(error, _, row)) = self.errors.last() {
            if opened(&self.open, error.at) <= opened(&self.open, draft.at) {
                break;
            }
            self.errors.pop();
            self.finish(error, &parsed_side(row, None), KindId::ERROR)?;
        }
        let run = self.open.iter().rposition(|open| open.at == draft.at).and_then(|found| {
            self.open.truncate(found + 1);
            self.open.pop()
        });
        let side = match run {
            Some(mut run) => {
                run.close_to(u32::MAX);
                run.placed(self.kinds, self.text, &mut self.placed);
                let edges = run.edges(side.at.map(|row| row.span), self.kinds);
                let holder = self.open.last_mut();
                let parent = holder.as_ref().map(|holder| holder.at);
                if let Some(holder) = holder {
                    holder.name(run.index, draft.at, run.depth, run.own, edges);
                }
                &SideRecord { parent, node: run.facts, source: self.source.map(|source| source.0), depth: run.depth, run: run.entries, ..side.clone() }
            }
            None => side,
        };
        let side = side.write_in(&mut *self.tree)?;
        if side != Address::NONE {
            self.tree.words_mut(draft.place(1, 1)?, 1)?[0] = side.0;
        }
        Ok(Hydrated::Record { kind, at: draft.at })
    }
}

/// What navigation reads of `node`, `kid` its facts.
fn facts_of(kid: &crate::nodes::Kid, node: &crate::tree_sitter::Node<'_>) -> NodeFacts {
    NodeFacts::of(kid, node.is_missing(), node.has_error() || node.is_missing() || kid.error())
}

/// The side record of a parsed record read at `row`: where it came from,
/// and a list's delimiters.
#[must_use]
pub fn parsed_side(row: Row, delimiter: Option<crate::types::Delimiter>) -> SideRecord {
    SideRecord { at: Some(row), delimiter, ..SideRecord::default() }
}

/// What the coordinate of the child `at` names: its stamped kind and its
/// span, the whole source for the root, as a read's coordinate names it.
#[must_use]
pub fn row_of(at: &crate::read::Kid, ctx: &ReadCtx<'_>) -> Row {
    let span = if at.index == NodeIndex::ROOT { Span::whole(ctx.source) } else { Span { start: at.start, end: at.end } };
    Row { kind: ctx.stamped_kind(at.grammar, at.display), span }
}

/// A node type's direct hydration: what the node the cursor is on is held as
/// in its holder's record, its own record written as its walk goes when it
/// has one. The derive writes every impl. The cursor ends where it started, whether the
/// walk stands or is refused.
pub trait HydrateNode: ReadNode + Stored {
    /// # Errors
    ///
    /// What the node's read refuses, by the same router, and what the arena
    /// refuses.
    fn hydrate(cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, records: &mut Hydration<'_>) -> Result<Hydrated, HydrateError>;

}

impl<T: HydrateNode> HydrateNode for Box<T> {
    fn hydrate(cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, records: &mut Hydration<'_>) -> Result<Hydrated, HydrateError> {
        T::hydrate(cursor, ctx, records)
    }
}

/// The child the cursor is on, as its holder's slot holds it.
fn hydrate_value<T: HydrateNode>(cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, records: &mut Hydration<'_>) -> Result<Hydrated, HydrateError> {
    crate::stack::grown(|| T::hydrate(cursor, ctx, records))
}

fn one(acc: &mut Option<Hydrated>, at: SlotSite, value: impl FnOnce() -> Result<Hydrated, HydrateError>) -> Result<(), HydrateError> {
    if acc.is_some() {
        return Err(ReadError::Overfull { kind: at.kind, slot: at.slot, index: at.index }.into());
    }
    *acc = Some(value()?);
    Ok(())
}

fn missing(at: SlotSite) -> HydrateError {
    ReadError::Missing { kind: at.kind, slot: at.slot, index: at.index }.into()
}

/// How a slot's field type holds the children its walk routes to it in a
/// parsed record, as `ReadSlot` holds them in a native node.
pub trait HydrateSlot: ReadSlot {
    type Held;
    fn held() -> Self::Held;
    /// Takes the child the cursor is on into `held`.
    ///
    /// # Errors
    ///
    /// A second child of a single slot, and what the child's hydration
    /// refuses.
    fn take_held(held: &mut Self::Held, cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, at: SlotSite, records: &mut Hydration<'_>) -> Result<(), HydrateError>;
    fn separator_held(held: &mut Self::Held, tagged: bool) {
        let _ = (held, tagged);
    }
    /// Writes the cell of the slot of shape `shape` of the record `holder`
    /// from what `held` took.
    ///
    /// # Errors
    ///
    /// A required slot with no child, and what writing its cell refuses.
    fn finish_held(held: Self::Held, at: SlotSite, shape: CellShape, holder: Draft, records: &mut Hydration<'_>) -> Result<(), HydrateError>;
}

impl<T: HydrateNode, const A: bool> HydrateSlot for SlotValue<T, A> {
    type Held = Option<Hydrated>;
    fn held() -> Self::Held {
        None
    }
    fn take_held(held: &mut Self::Held, cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, at: SlotSite, records: &mut Hydration<'_>) -> Result<(), HydrateError> {
        one(held, at, || hydrate_value::<T>(cursor, ctx, records))
    }
    fn finish_held(held: Self::Held, at: SlotSite, shape: CellShape, holder: Draft, records: &mut Hydration<'_>) -> Result<(), HydrateError> {
        let value = held.ok_or_else(|| missing(at))?;
        records.cell(holder, shape, Some(value))
    }
}

/// With no child, the type's blank arm if it has one, as the typed read
/// takes it, else absent.
impl<T: HydrateNode, const A: bool> HydrateSlot for Option<SlotValue<T, A>> {
    type Held = Option<Hydrated>;
    fn held() -> Self::Held {
        None
    }
    fn take_held(held: &mut Self::Held, cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, at: SlotSite, records: &mut Hydration<'_>) -> Result<(), HydrateError> {
        one(held, at, || hydrate_value::<T>(cursor, ctx, records))
    }
    fn finish_held(held: Self::Held, _: SlotSite, shape: CellShape, holder: Draft, records: &mut Hydration<'_>) -> Result<(), HydrateError> {
        let value = held.or_else(|| (T::STORED & stored::BLANK != 0).then_some(Hydrated::BLANK));
        records.cell(holder, shape, value)
    }
}

impl<T: HydrateNode, const A: bool> HydrateSlot for Vec<SlotValue<T, A>> {
    type Held = Vec<Hydrated>;
    fn held() -> Self::Held {
        Vec::new()
    }
    fn take_held(held: &mut Self::Held, cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, _: SlotSite, records: &mut Hydration<'_>) -> Result<(), HydrateError> {
        held.push(hydrate_value::<T>(cursor, ctx, records)?);
        Ok(())
    }
    fn finish_held(held: Self::Held, _: SlotSite, shape: CellShape, holder: Draft, records: &mut Hydration<'_>) -> Result<(), HydrateError> {
        records.list(holder, shape, held.into_iter().map(Some))
    }
}

impl<T: HydrateNode, const A: bool> HydrateSlot for NonEmptyVec<SlotValue<T, A>> {
    type Held = Vec<Hydrated>;
    fn held() -> Self::Held {
        Vec::new()
    }
    fn take_held(held: &mut Self::Held, cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, at: SlotSite, records: &mut Hydration<'_>) -> Result<(), HydrateError> {
        <Vec<SlotValue<T, A>> as HydrateSlot>::take_held(held, cursor, ctx, at, records)
    }
    fn finish_held(held: Self::Held, at: SlotSite, shape: CellShape, holder: Draft, records: &mut Hydration<'_>) -> Result<(), HydrateError> {
        if held.is_empty() {
            return Err(missing(at));
        }
        records.list(holder, shape, held.into_iter().map(Some))
    }
}

impl<T: HydrateNode, const A: bool> HydrateSlot for Vec<Option<SlotValue<T, A>>> {
    type Held = Elided<Hydrated>;
    fn held() -> Self::Held {
        Elided::default()
    }
    fn take_held(held: &mut Self::Held, cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, _: SlotSite, records: &mut Hydration<'_>) -> Result<(), HydrateError> {
        held.push(hydrate_value::<T>(cursor, ctx, records)?);
        Ok(())
    }
    fn separator_held(held: &mut Self::Held, tagged: bool) {
        held.separator(tagged);
    }
    fn finish_held(held: Self::Held, _: SlotSite, shape: CellShape, holder: Draft, records: &mut Hydration<'_>) -> Result<(), HydrateError> {
        records.list(holder, shape, held.positions().into_iter())
    }
}

impl<T: HydrateNode, const A: bool> HydrateSlot for NonEmptyVec<Option<SlotValue<T, A>>> {
    type Held = Elided<Hydrated>;
    fn held() -> Self::Held {
        Elided::default()
    }
    fn take_held(held: &mut Self::Held, cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, at: SlotSite, records: &mut Hydration<'_>) -> Result<(), HydrateError> {
        <Vec<Option<SlotValue<T, A>>> as HydrateSlot>::take_held(held, cursor, ctx, at, records)
    }
    fn separator_held(held: &mut Self::Held, tagged: bool) {
        held.separator(tagged);
    }
    fn finish_held(held: Self::Held, at: SlotSite, shape: CellShape, holder: Draft, records: &mut Hydration<'_>) -> Result<(), HydrateError> {
        let positions = held.positions();
        if positions.is_empty() {
            return Err(missing(at));
        }
        records.list(holder, shape, positions.into_iter())
    }
}

/// The whole tree `cursor` walks, read as `N`, its records written into
/// `into` in one walk, each naming the entry `source` of the source they
/// are read from and stamped with its depth move, by the depth members of
/// `kinds`: the root's record, `None` when it has none. Each extra and
/// `ERROR` it places goes to `placed`, and where each list item the source
/// sets apart is kept to `apart`.
///
/// # Errors
///
/// What the hydration refuses; what it wrote before stays written.
pub fn hydrate_whole<N: HydrateNode>(cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, source: Option<Address>, kinds: crate::trivia_table::SurfaceKinds, into: &mut dyn HydrateInto, placed: &mut Vec<Placed>, apart: &mut Vec<super::NodeSite>) -> Result<Option<Address>, HydrateError> {
    let records = &mut Hydration { extras: Some(extra_walk::<N>), source, kinds: Some(kinds), stamp: Some((ctx.shows, ctx.relaxes)), text: ctx.source, ..Hydration::new(into) };
    crate::read::goto(cursor, NodeIndex::ROOT);
    records.meet(cursor)?;
    ctx.begin_read();
    ctx.at = None;
    let root = N::hydrate(cursor, ctx, records)?;
    placed.append(&mut records.placed);
    apart.append(&mut records.apart);
    Ok(match root {
        Hydrated::Record { at, .. } => Some(at),
        _ => None,
    })
}

/// The tree `cursor` walks, whose root is an `ERROR`, written into `into`
/// as the error's record, its run holding every node under it, each record
/// naming the entry `source`: the record, which no reader reads.
///
/// # Errors
///
/// What the hydration refuses; what it wrote before stays written.
pub fn hydrate_error(cursor: &mut TreeCursor<'_>, source: Option<Address>, kinds: crate::trivia_table::SurfaceKinds, into: &mut dyn HydrateInto) -> Result<Option<Address>, HydrateError> {
    let records = &mut Hydration { source, kinds: Some(kinds), ..Hydration::new(into) };
    crate::read::goto(cursor, NodeIndex::ROOT);
    records.meet_whole(cursor)?;
    let root = records.errors.first().map(|&(draft, ..)| draft.at);
    records.leave_errors(u32::MAX)?;
    Ok(root)
}
