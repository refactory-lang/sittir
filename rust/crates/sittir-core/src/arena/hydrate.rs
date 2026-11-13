//! Direct hydration: a parsed node's record written from its tree as the
//! node's routing walk reaches each child, with no native node made first.
//! The derive writes each node type's walk (`HydrateNode`) beside its typed
//! read, through the same router; a slot's cells come from its stamps alone.
//!
//! A child with a record of its own is held by its record's address within
//! the read's depth, its record published as its own walk ends, and past it
//! by its coordinate, until the first read through that cell writes the
//! record and rewrites the cell to name it. A bounded child, whose slot
//! stamps an embedded capacity, is written into its holder's record at any
//! depth. A leaf, a unit and a captured string have no record and are held
//! whole. An extra no cell names: the walk that meets it among its node's
//! children writes it whole when the walk's reader reads it as a record, and
//! its tree holds the record. A walk writes only the nodes its holder's cell
//! names and those extras, and a holder's walk is the one walk that does, so
//! a tree holds one record per row.
//!
//! A record is written in place: its walk reserves its words in one chunk
//! when it starts, and writes each cell there as its slot closes. A list's
//! run is reserved when its slot closes, its length known then; a bounded
//! child's walk writes its record into its holder's cell; a side record is
//! written when its record's walk ends. A refused walk leaves the arena as
//! it found it (`hydrate_at`), the records its children's walks wrote
//! included.

use super::side::{NodeFacts, RunEntry};
use super::{Address, ArenaError, Cell, CellShape, ListCell, RecordSpace, Row, SideRecord, TreeArena};
use crate::read::{Depth, Elided, ReadCtx, ReadError, ReadNode, ReadSlot, SlotSite};
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
    /// A node with a record, by its coordinate, or a leaf (`leaf`): its
    /// stored kind, its row and its byte span.
    Node { kind: KindId, row: NodeIndex, span: Span, leaf: bool },
    /// A node whose record its walk published: its stored kind and record.
    Record { kind: KindId, at: Address },
    /// A unit and the row it was read at; the blank arm has none.
    Unit { kind: KindId, row: Option<NodeIndex> },
    /// A captured string.
    Text { span: Span },
    /// A bounded child's record, which its walk wrote into its holder's
    /// cell.
    Embedded,
}

impl Hydrated {
    /// The blank arm.
    pub const BLANK: Hydrated = Hydrated::Unit { kind: KindId::BLANK, row: None };

    fn cell(&self) -> Result<Cell, ArenaError> {
        Ok(match *self {
            Hydrated::Node { kind, row, span, leaf: false } => Cell::Coordinate { kind, index: row, span },
            Hydrated::Node { kind, row, span, leaf: true } => Cell::ParsedLeaf { kind, span, row },
            Hydrated::Record { kind, at } => Cell::Child { kind, at, link: None, changed: crate::slot::ChangedEdges::default() },
            Hydrated::Unit { kind, row } => Cell::Unit { kind, row },
            Hydrated::Text { span } => Cell::ParsedText { span },
            Hydrated::Embedded => return Err(ArenaError::Unwritable("an embedded record outside its holder's cell")),
        })
    }
}

/// A record its walk writes in place: where its words are, reserved when
/// the walk started or in its holder's cell, and how many.
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

/// Where a bounded child's walk writes its record: the payload of its
/// holder's cell, and the words it holds.
#[derive(Debug, Clone, Copy)]
pub struct Embed {
    at: Address,
    words: u32,
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
    /// The `ERROR` nodes the walk is under, outermost first, where the
    /// records outlive their tree: each one's record, the descendant index
    /// its subtree ends at, and its row.
    errors: Vec<(Draft, u32, Row)>,
    /// How the read stamps a coordinate's kind (`read::stamp`), where the
    /// records outlive their tree and each keeps its coordinate's.
    stamp: Option<Stamp>,
}

/// The two answers `read::stamp` takes of a grammar: whether a display kind
/// shows, and whether a grammar kind relaxes to a display kind.
type Stamp = (fn(KindId) -> bool, fn(KindId, KindId) -> bool);

/// What a hydration writes into: the space its records take, and, for a
/// tree that keeps them, each node's row and the records no cell names by
/// their rows.
pub trait HydrateInto: RecordSpace {
    /// Writes the row of `kid`, `missing` as its tree answers.
    ///
    /// # Errors
    ///
    /// What the rows refuse.
    fn write_row(&mut self, _kid: &crate::nodes::Kid, _missing: bool) -> Result<(), ArenaError> {
        Ok(())
    }

    /// Holds the record at `at` for the node at `row`, which no cell names.
    ///
    /// # Errors
    ///
    /// What the holder refuses.
    fn hold(&mut self, _row: NodeIndex, _at: Address) -> Result<(), ArenaError> {
        Ok(())
    }

    /// The record held for the node at `row`.
    fn held(&self, _row: NodeIndex) -> Option<Address> {
        None
    }

    /// Notes the record written at `at`.
    fn keep_record(&mut self, _at: Address) {}

    /// Whether a leaf's or a unit's cell names its node by its holder's
    /// run, as records that outlive their tree do: 1 for the holder's own
    /// node, else two past the node's entry there, since a cell packs no
    /// row 0. A tree's arena names it by its descendant index.
    fn rows_by_run(&self) -> bool {
        false
    }
}

impl HydrateInto for super::ReadWriter<'_> {
    fn rows_by_run(&self) -> bool {
        true
    }
}

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
    early: Vec<(NodeIndex, Address)>,
    met: Vec<(NodeIndex, u32)>,
    /// The levels the node's own kind and the nodes met under it open net
    /// of those they close, and the node's own share of that.
    depth: i32,
    own: i32,
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
    fn meet(&mut self, kid: &crate::nodes::Kid, facts: NodeFacts, depth: i32) {
        self.close_to(kid.index.get());
        if self.index == Some(kid.index) {
            return;
        }
        if let Some(found) = self.early.iter().position(|&(index, _)| index == kid.index) {
            let (_, at) = self.early.swap_remove(found);
            self.entries.push(RunEntry::Record { at, shared: false });
            return;
        }
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
    fn name(&mut self, index: Option<NodeIndex>, at: Address, depth: i32, own: i32) {
        match (index, self.last) {
            (Some(index), _) if self.index == Some(index) => {
                self.entries.push(RunEntry::Record { at, shared: true });
                self.depth += depth - own;
            }
            (Some(index), Some((last, entry))) if last == index && entry + 1 == self.entries.len() => {
                self.rows.pop_if(|&mut (open, _)| open == entry);
                self.entries[entry] = RunEntry::Record { at, shared: false };
                self.depth += depth - own;
            }
            (Some(index), _) => {
                self.early.push((index, at));
                self.depth += depth;
            }
            (None, _) => {}
        }
    }
}

/// The extra the cursor stands on (`kid`) walked whole into `N` when `N`
/// reads it as a record (`ReadNode::router`), its record held by its tree.
fn extra_walk<N: HydrateNode>(cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, records: &mut Hydration<'_>, kid: &crate::nodes::Kid) -> Result<bool, HydrateError> {
    if N::router(kid.grammar, kid.display).is_none() {
        return Ok(false);
    }
    if let Hydrated::Record { at, .. } = crate::stack::grown(|| N::hydrate(cursor, ctx, Some(Depth::All), records, None))? {
        records.tree.hold(kid.index, at)?;
    }
    Ok(true)
}

/// What a walk does for a node with a record of its own.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Walk {
    /// Nothing: its holder holds its coordinate.
    Skip,
    /// Writes its record.
    Write,
}

impl<'a> Hydration<'a> {
    /// A hydration of `tree`'s rows whose walks hold no extra: `hydrate_at`
    /// makes the one a walk writes records through.
    pub(crate) fn new(tree: &'a mut dyn HydrateInto) -> Self {
        Self { tree, extras: None, open: Vec::new(), met: None, entering: None, met_at: None, source: None, kinds: None, errors: Vec::new(), stamp: None }
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
    /// walks hold none, whose rows the walk writes itself.
    ///
    /// # Errors
    ///
    /// What the extra's hydration and the arena refuse.
    pub fn extra(&mut self, cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, kid: &crate::nodes::Kid) -> Result<bool, HydrateError> {
        let Some(walk) = self.extras else { return Ok(false) };
        if !kid.extra || kid.error() || self.tree.held(kid.index).is_some() {
            return Ok(false);
        }
        walk(cursor, ctx, self, kid)
    }

    /// Whether the walk of a node with a record, read at `depth` (`None` past
    /// the read's depth), embedded in its holder's cell at `inline`, writes
    /// its record.
    #[must_use]
    pub fn walk(&self, depth: Option<Depth>, inline: Option<Embed>) -> Walk {
        if inline.is_some() || depth.is_some() { Walk::Write } else { Walk::Skip }
    }

    /// Where the bounded child the slot of shape `shape` of `holder` holds
    /// writes its record: its cell's payload, `None` for a slot that embeds
    /// no record.
    ///
    /// # Errors
    ///
    /// What `Cell::inline_payload` refuses, and a cell past its holder's
    /// words.
    pub fn embed(&self, holder: Draft, shape: CellShape) -> Result<Option<Embed>, HydrateError> {
        if shape.forms & crate::record::form::INLINE == 0 {
            return Ok(None);
        }
        let cell = holder.place(shape.word, shape.width)?;
        let payload = Cell::inline_payload(self.tree.words(cell, shape.width)?, shape)?;
        let at = cell.offset(u32::try_from(payload.start).map_err(|_| ArenaError::Full)?).ok_or(ArenaError::Malformed { what: "inline record address", word: shape.word })?;
        Ok(Some(Embed { at, words: shape.inline }))
    }

    /// The record of `kind`, `words` words, its header written: reserved in
    /// one chunk, or in its holder's cell at `inline`.
    ///
    /// # Errors
    ///
    /// `ArenaError::Malformed` for a record narrower than its header, wider
    /// than the cell it is embedded in, or of a kind its arena's kind field
    /// cannot hold; and what the arena refuses.
    pub fn draft(&mut self, kind: KindId, words: u32, inline: Option<Embed>) -> Result<Draft, HydrateError> {
        if kind == KindId::ERROR {
            return Err(ArenaError::Malformed { what: "record header", word: u32::from(kind.0) }.into());
        }
        self.open_record(kind, words, inline)
    }

    /// `draft`, for any kind a header holds: an `ERROR`'s record is the
    /// hydration's own to write.
    fn open_record(&mut self, kind: KindId, words: u32, inline: Option<Embed>) -> Result<Draft, HydrateError> {
        if words < HEADER_WORDS || kind == KindId::BLANK {
            return Err(ArenaError::Malformed { what: "record header", word: u32::from(kind.0) }.into());
        }
        let header = super::with_kind(kind, self.tree.kind_bits())?;
        let at = match inline {
            Some(embed) if words > embed.words => return Err(ArenaError::Malformed { what: "inline cell width", word: embed.words }.into()),
            Some(embed) => embed.at,
            None => self.tree.alloc(words)?,
        };
        self.tree.words_mut(at, 1)?[0] = header;
        let entering = self.entering.take().or_else(|| self.met_at.zip(self.met));
        let own = entering.map_or(0, |(_, facts)| self.depth_of(facts.kind));
        self.open.push(OpenRun { at, index: entering.map(|(index, _)| index), facts: entering.map(|(_, facts)| facts), entries: Vec::new(), rows: Vec::new(), last: None, early: Vec::new(), met: Vec::new(), depth: own, own });
        Ok(Draft { at, words })
    }

    /// `value` as the record `draft` holds it: a leaf or a unit named by
    /// the record's run where the records outlive their tree
    /// (`HydrateInto::rows_by_run`).
    ///
    /// # Errors
    ///
    /// `ArenaError::Malformed` for a node the record's walk did not meet,
    /// and `ArenaError::Unwritable` for a coordinate, which names a row of
    /// a tree.
    fn held(&self, draft: Draft, value: Hydrated) -> Result<Hydrated, ArenaError> {
        if !self.tree.rows_by_run() {
            return Ok(value);
        }
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
            Hydrated::Node { kind, row, span, leaf: true } => Hydrated::Node { kind, row: in_run(row)?, span, leaf: true },
            Hydrated::Node { leaf: false, .. } => return Err(ArenaError::Unwritable("a coordinate in records that outlive their tree")),
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
        match value {
            Some(Hydrated::Embedded) => Cell::inline_tag(out, shape)?,
            value => value.map_or(Ok(Cell::Absent), |value| value.cell())?.encode_parsed(out, shape, bits)?,
        }
        Ok(())
    }

    /// Writes the list of the slot of shape `shape` of `draft`, its items
    /// `items`, a `None` item absent: their run, reserved now its length is
    /// known, and the one word naming it.
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
        let run = self.tree.alloc(words)?;
        let out = self.tree.words_mut(run, words)?;
        out[0] = len;
        for (item, out) in items.into_iter().zip(out[1..].chunks_exact_mut(width as usize)) {
            item.map_or(Ok(Cell::Absent), |item| item.cell())?.encode_parsed(out, shape, bits)?;
        }
        self.tree.words_mut(cell, 1)?[0] = ListCell::word(run)?.0;
        Ok(())
    }

    /// The facts of the node `cursor` stands on (`Kid::at`), its row
    /// written unless the tree has one for it.
    ///
    /// # Errors
    ///
    /// What writing the row refuses.
    pub fn meet(&mut self, cursor: &TreeCursor<'_>) -> Result<crate::nodes::Kid, HydrateError> {
        let node = cursor.node();
        let kid = crate::nodes::Kid::of(&node, crate::read::index_of(cursor), crate::read::field_id(cursor));
        self.leave_errors(kid.index.get())?;
        self.tree.write_row(&kid, node.is_missing())?;
        let facts = facts_of(&kid, &node);
        let depth = self.depth_of(kid.grammar);
        if let Some(open) = self.open.last_mut() {
            open.meet(&kid, facts, depth);
        }
        self.met = Some(facts);
        self.met_at = Some(kid.index);
        if kid.error() && self.tree.rows_by_run() {
            self.entering = Some((kid.index, facts));
            let draft = self.open_record(KindId::ERROR, HEADER_WORDS, None)?;
            self.errors.push((draft, kid.index.get() + kid.count, Row { index: kid.index, end: kid.index + kid.count, span: kid.span() }));
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
            self.finish(draft, &parsed_side(row, None), KindId::ERROR, None)?;
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
    /// `side`, and answers what its holder holds, the record, or, written in
    /// its holder's cell at `inline`, that cell's embedded record.
    ///
    /// # Errors
    ///
    /// What the arena refuses.
    pub fn finish(&mut self, draft: Draft, side: &SideRecord, kind: KindId, inline: Option<Embed>) -> Result<Hydrated, HydrateError> {
        let opened = |open: &[OpenRun], at: Address| open.iter().rposition(|open| open.at == at);
        while let Some(&(error, _, row)) = self.errors.last() {
            if opened(&self.open, error.at) <= opened(&self.open, draft.at) {
                break;
            }
            self.errors.pop();
            self.finish(error, &parsed_side(row, None), KindId::ERROR, None)?;
        }
        let run = self.open.iter().rposition(|open| open.at == draft.at).and_then(|found| {
            self.open.truncate(found + 1);
            self.open.pop()
        });
        let side = match run {
            Some(mut run) => {
                run.close_to(u32::MAX);
                let holder = self.open.last_mut();
                let parent = holder.as_ref().map(|holder| holder.at);
                if let Some(holder) = holder {
                    holder.name(run.index, draft.at, run.depth, run.own);
                }
                let at = match (side.at, run.facts) {
                    (Some(row), Some(facts)) if self.tree.rows_by_run() => {
                        let kind = self.stamp.map_or(facts.kind, |(shows, relaxes)| crate::read::stamp(facts.kind, facts.display(), shows, relaxes));
                        Some(Row::named(kind, row.span))
                    }
                    (at, _) => at,
                };
                &SideRecord { at, parent, node: run.facts, source: self.source.map(|source| source.0), depth: run.depth, run: run.entries, ..side.clone() }
            }
            None => side,
        };
        let side = side.write_in(&mut *self.tree)?;
        if side != Address::NONE {
            self.tree.words_mut(draft.place(1, 1)?, 1)?[0] = side.0;
        }
        self.tree.keep_record(draft.at);
        Ok(if inline.is_some() { Hydrated::Embedded } else { Hydrated::Record { kind, at: draft.at } })
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

/// The row the child `at` was read at, with its subtree's end and its span:
/// the whole source for the root, as a read's coordinate names it.
#[must_use]
pub fn row_of(at: &crate::read::Kid, ctx: &ReadCtx<'_>) -> Row {
    let span = if at.index == NodeIndex::ROOT { Span::whole(ctx.source) } else { Span { start: at.start, end: at.end } };
    Row { index: at.index, end: at.index + at.count, span }
}

/// A node type's direct hydration: what the node the cursor is on is held as
/// in its holder's record, its own record written as its walk goes when it
/// has one. `depth` is the levels the read reaches from the node, `None` past
/// them; `inline` is where in its holder's cell its record is written. The
/// derive writes every impl. The cursor ends where it started, whether the
/// walk stands or is refused.
pub trait HydrateNode: ReadNode + Stored {
    /// # Errors
    ///
    /// What the node's read refuses, by the same router, and what the arena
    /// refuses.
    fn hydrate(cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, depth: Option<Depth>, records: &mut Hydration<'_>, inline: Option<Embed>) -> Result<Hydrated, HydrateError>;

    /// The walk of the node the cursor is on, as the kind its parent's cell
    /// stamped: an enum picks the member that claims `stamped`, and the
    /// node's grammar id only chooses among that member's own claims; a
    /// struct has the one kind.
    ///
    /// # Errors
    ///
    /// What `hydrate` refuses, and `ReadError::Unadmitted` for a stamped kind
    /// no member claims.
    fn hydrate_stamped(stamped: KindId, cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, depth: Option<Depth>, records: &mut Hydration<'_>, inline: Option<Embed>) -> Result<Hydrated, HydrateError> {
        let _ = stamped;
        Self::hydrate(cursor, ctx, depth, records, inline)
    }
}

impl<T: HydrateNode> HydrateNode for Box<T> {
    fn hydrate(cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, depth: Option<Depth>, records: &mut Hydration<'_>, inline: Option<Embed>) -> Result<Hydrated, HydrateError> {
        T::hydrate(cursor, ctx, depth, records, inline)
    }

    fn hydrate_stamped(stamped: KindId, cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, depth: Option<Depth>, records: &mut Hydration<'_>, inline: Option<Embed>) -> Result<Hydrated, HydrateError> {
        T::hydrate_stamped(stamped, cursor, ctx, depth, records, inline)
    }
}

/// The child the cursor is on, as the slot of shape `shape` of `holder`
/// holds it, within a holder read at `depth`.
fn hydrate_value<T: HydrateNode>(cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, depth: Option<Depth>, records: &mut Hydration<'_>, shape: CellShape, holder: Draft) -> Result<Hydrated, HydrateError> {
    let inline = records.embed(holder, shape)?;
    crate::stack::grown(|| T::hydrate(cursor, ctx, depth.and_then(Depth::below), records, inline))
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
    /// Takes the child the cursor is on into `held`, for the slot of shape
    /// `shape` of the record `holder`.
    ///
    /// # Errors
    ///
    /// A second child of a single slot, and what the child's hydration
    /// refuses.
    #[allow(clippy::too_many_arguments, reason = "the walk's state, the slot and its holder, each passed once")]
    fn take_held(held: &mut Self::Held, cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, depth: Option<Depth>, at: SlotSite, records: &mut Hydration<'_>, shape: CellShape, holder: Draft) -> Result<(), HydrateError>;
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
    fn take_held(held: &mut Self::Held, cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, depth: Option<Depth>, at: SlotSite, records: &mut Hydration<'_>, shape: CellShape, holder: Draft) -> Result<(), HydrateError> {
        one(held, at, || hydrate_value::<T>(cursor, ctx, depth, records, shape, holder))
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
    fn take_held(held: &mut Self::Held, cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, depth: Option<Depth>, at: SlotSite, records: &mut Hydration<'_>, shape: CellShape, holder: Draft) -> Result<(), HydrateError> {
        one(held, at, || hydrate_value::<T>(cursor, ctx, depth, records, shape, holder))
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
    fn take_held(held: &mut Self::Held, cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, depth: Option<Depth>, _: SlotSite, records: &mut Hydration<'_>, shape: CellShape, holder: Draft) -> Result<(), HydrateError> {
        held.push(hydrate_value::<T>(cursor, ctx, depth, records, shape, holder)?);
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
    fn take_held(held: &mut Self::Held, cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, depth: Option<Depth>, at: SlotSite, records: &mut Hydration<'_>, shape: CellShape, holder: Draft) -> Result<(), HydrateError> {
        <Vec<SlotValue<T, A>> as HydrateSlot>::take_held(held, cursor, ctx, depth, at, records, shape, holder)
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
    fn take_held(held: &mut Self::Held, cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, depth: Option<Depth>, _: SlotSite, records: &mut Hydration<'_>, shape: CellShape, holder: Draft) -> Result<(), HydrateError> {
        held.push(hydrate_value::<T>(cursor, ctx, depth, records, shape, holder)?);
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
    fn take_held(held: &mut Self::Held, cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, depth: Option<Depth>, at: SlotSite, records: &mut Hydration<'_>, shape: CellShape, holder: Draft) -> Result<(), HydrateError> {
        <Vec<Option<SlotValue<T, A>>> as HydrateSlot>::take_held(held, cursor, ctx, depth, at, records, shape, holder)
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

/// The record of the node at `index` of `cursor`'s tree, which has none yet,
/// read `depth` levels down into `N` as its walk writes it into `tree`:
/// `None` for a node with no record, a leaf or a unit. Each extra the walk
/// meets among a node's children that `N` reads as a record is written whole
/// and held there (`Hydration::extra`). A refused walk leaves the tree's
/// arena as it found it: the words, chunks, record starts and held rows it
/// and its children's walks wrote are dropped. The rows of the nodes it met
/// stay, since a row is a fact of the tree (`TreeArena::write_row`). The
/// walk is a read of its own: the node at `index` is where it starts
/// (`ReadCtx::begin_read`).
///
/// # Errors
///
/// What the hydration refuses.
pub fn hydrate_at<N: HydrateNode>(cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, index: NodeIndex, stamped: Option<KindId>, depth: Depth, tree: &mut TreeArena) -> Result<Option<Address>, HydrateError> {
    let mark = tree.mark();
    let walked = hydrate_into::<N>(cursor, ctx, index, stamped, depth, (None, None), tree);
    if walked.is_err() {
        tree.rewind(mark);
    }
    walked
}

/// The whole tree `cursor` walks, read as `N`, its records written into
/// `into` in one walk, each naming the entry `source` of the source they
/// are read from and stamped with its depth move, by the depth members of
/// `kinds`: the root's record, `None` when it has none.
///
/// # Errors
///
/// What the hydration refuses; what it wrote before stays written.
pub fn hydrate_whole<N: HydrateNode>(cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, source: Option<Address>, kinds: crate::trivia_table::SurfaceKinds, into: &mut dyn HydrateInto) -> Result<Option<Address>, HydrateError> {
    hydrate_into::<N>(cursor, ctx, NodeIndex::ROOT, None, Depth::All, (source, Some(kinds)), into)
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

fn hydrate_into<N: HydrateNode>(cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, index: NodeIndex, stamped: Option<KindId>, depth: Depth, (source, kinds): (Option<Address>, Option<crate::trivia_table::SurfaceKinds>), into: &mut dyn HydrateInto) -> Result<Option<Address>, HydrateError> {
    let records = &mut Hydration { extras: Some(extra_walk::<N>), source, kinds, stamp: Some((ctx.shows, ctx.relaxes)), ..Hydration::new(into) };
    crate::read::goto(cursor, index);
    records.meet(cursor)?;
    ctx.begin_read();
    ctx.at = None;
    let walked = match stamped {
        Some(kind) => N::hydrate_stamped(kind, cursor, ctx, Some(depth), records, None),
        None => N::hydrate(cursor, ctx, Some(depth), records, None),
    };
    Ok(match walked? {
        Hydrated::Record { at, .. } => Some(at),
        _ => None,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::read::{grammar_id, index_of};
    use crate::record::{form, PARSED_KIND_BITS};
    use crate::tree_sitter;
    use crate::types::TreeId;

    const fn shape(word: u32, width: u32, run: Option<u32>, inline: u32, forms: u8) -> CellShape {
        CellShape { word, width, run, inline, forms, built: 0, key: "" }
    }

    /// An identifier, its record written in its holder's cell.
    struct Name;
    /// A function item: its name's record in its first cell, and its
    /// parameters and body by coordinate in a list.
    struct Item;
    /// A source file: a list of its items' records, refused once they are
    /// all written when `REFUSE`.
    struct File<const REFUSE: bool>;

    macro_rules! toys {
        ($([$($generic:tt)*] $ty:ty),*) => {$(
            impl<$($generic)*> ReadNode for $ty {
                fn admits(_: KindId, _: KindId) -> bool {
                    true
                }
                fn takes_tagged(_: KindId, _: KindId, _: bool) -> bool {
                    true
                }
                fn read(cursor: &mut TreeCursor<'_>, _: &mut ReadCtx<'_>, _: Depth) -> Result<Self, ReadError> {
                    Err(ReadError::Unadmitted { kind: grammar_id(&cursor.node()), index: index_of(cursor) })
                }
            }
            impl<$($generic)*> Stored for $ty {
                const STORED: u8 = stored::RECORD;
            }
        )*};
    }

    toys!([] Name, [] Item, [const REFUSE: bool] File<REFUSE>);

    const NAME: CellShape = shape(2, 2, None, 2, form::INLINE);
    const PARTS: CellShape = shape(4, 1, Some(3), 0, form::NODE);
    const ITEMS: CellShape = shape(2, 1, Some(3), 0, form::NODE);

    impl HydrateNode for Name {
        fn hydrate(cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, _: Option<Depth>, records: &mut Hydration<'_>, inline: Option<Embed>) -> Result<Hydrated, HydrateError> {
            let (row, kind) = (row_of(&ctx.current(cursor), ctx), grammar_id(&cursor.node()));
            let draft = records.draft(kind, 2, inline)?;
            records.finish(draft, &parsed_side(row, None), kind, inline)
        }
    }

    impl HydrateNode for Item {
        fn hydrate(cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, _: Option<Depth>, records: &mut Hydration<'_>, inline: Option<Embed>) -> Result<Hydrated, HydrateError> {
            let (row, kind) = (row_of(&ctx.current(cursor), ctx), grammar_id(&cursor.node()));
            let draft = records.draft(kind, 5, inline)?;
            let (mut name, mut parts) = (None, Vec::new());
            cursor.goto_first_child();
            loop {
                let node = cursor.node();
                match node.kind() {
                    "identifier" => {
                        let embed = records.embed(draft, NAME)?;
                        name = Some(Name::hydrate(cursor, ctx, None, records, embed)?);
                    }
                    "parameters" | "block" => parts.push(Some(Hydrated::Node { kind: grammar_id(&node), row: index_of(cursor), span: Span::of(&node), leaf: false })),
                    _ => {}
                }
                if !cursor.goto_next_sibling() {
                    break;
                }
            }
            cursor.goto_parent();
            records.cell(draft, NAME, name)?;
            records.list(draft, PARTS, parts.into_iter())?;
            records.finish(draft, &parsed_side(row, None), kind, inline)
        }
    }

    impl<const REFUSE: bool> HydrateNode for File<REFUSE> {
        fn hydrate(cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, depth: Option<Depth>, records: &mut Hydration<'_>, inline: Option<Embed>) -> Result<Hydrated, HydrateError> {
            let (row, kind) = (row_of(&ctx.current(cursor), ctx), grammar_id(&cursor.node()));
            let draft = records.draft(kind, 3, inline)?;
            let mut items = Vec::new();
            cursor.goto_first_child();
            loop {
                items.push(Some(Item::hydrate(cursor, ctx, depth, records, None)?));
                if !cursor.goto_next_sibling() {
                    break;
                }
            }
            cursor.goto_parent();
            records.list(draft, ITEMS, items.into_iter())?;
            if REFUSE {
                return Err(ReadError::Overfull { kind, slot: "items", index: row.index }.into());
            }
            records.finish(draft, &parsed_side(row, None), kind, inline)
        }
    }

    #[test]
    fn a_refused_walk_leaves_the_arena_as_it_found_it_its_children_s_records_included() {
        let source = "fn a() {}\nfn b(x: u8) {}\n";
        let mut parser = tree_sitter::Parser::new();
        parser.set_language(&tree_sitter_rust::LANGUAGE.into()).expect("the rust grammar");
        let tree = parser.parse(source, None).expect("a parse");
        let rows = crate::read::descendant_count(&tree.root_node());
        let mut ctx = ReadCtx::new(source, TreeId(1), |_| false);
        let mut cursor = tree.walk();
        cursor.goto_first_child();
        let item = index_of(&cursor);

        let mut whole = TreeArena::new(PARSED_KIND_BITS, rows);
        let file = hydrate_at::<File<false>>(&mut tree.walk(), &mut ctx, NodeIndex::ROOT, None, Depth::All, &mut whole).expect("a walk").expect("a record");
        let starts = whole.snapshot().records;
        assert_eq!(starts.len(), 5, "the file's record, each item's, and each name's in its item's cell");
        assert!(starts.contains(&file));

        let mut arena = TreeArena::new(PARSED_KIND_BITS, rows);
        let kept = hydrate_at::<Item>(&mut tree.walk(), &mut ctx, item, None, Depth::ONE, &mut arena).expect("a walk").expect("a record");
        arena.hold(item, kept).expect("the row had none");
        let before = arena.snapshot();
        let refused = hydrate_at::<File<true>>(&mut tree.walk(), &mut ctx, NodeIndex::ROOT, None, Depth::All, &mut arena);
        assert!(matches!(refused, Err(HydrateError::Read(ReadError::Overfull { .. }))), "{refused:?}");
        assert_eq!(arena.snapshot(), before, "no word, chunk, record start or held row past where the walk started");
        assert_eq!(arena.held(item), Some(kept), "the walk that stood keeps its record");
        assert!(hydrate_at::<File<false>>(&mut tree.walk(), &mut ctx, NodeIndex::ROOT, None, Depth::All, &mut arena).expect("a walk").is_some());
    }
}
