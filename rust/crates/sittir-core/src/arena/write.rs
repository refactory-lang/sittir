//! The record writer: a native node's records, children before parents, in a
//! parsed tree's arena on the node's first read or in the engine's built
//! arena, with the side record of each node's layout and its print settings.
//!
//! The derive writes each node type's `WriteCell` through these helpers, so a
//! parsed and a built write differ only in the sink they write to.

use super::{Address, Arena, ArenaError, Cell, ListCell, SideRecord, SideSlot, Sides, TreeArena};
use crate::layout::{NodeLayout, UnitSides};
use crate::record::HEADER_WORDS;
use crate::slot::{ChangedEdges, NodeCoordinate, SlotValue};
use crate::trivia::NodeTrivia;
use crate::trivia_store::{Place, Site, TriviaStore};
use crate::trivia_table::TriviaSide;
use crate::types::{ItemIndex, KindId, NodeIndex, Span, TreeId};
use crate::verbatim::VerbatimNode;

/// What a built record's link to an untouched parsed node finds.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Linked {
    /// The node's record in its tree's arena: the one its first read wrote,
    /// written now when it had none.
    Record(Address),
    /// A parsed leaf, which has no record: its text, which the built record
    /// copies.
    Leaf(String),
}

/// The link a built write resolves an untouched parsed node by.
pub type Link<'a> = dyn FnMut(&NodeCoordinate) -> Result<Linked, ArenaError> + 'a;

/// Where a record writer writes.
pub struct RecordSink<'a, T> {
    to: Target<'a, T>,
    /// The row of the parsed record whose cells are being written: a child
    /// read from the same row is its envelope's content.
    holder: Option<NodeIndex>,
    /// Whether a record's cells are being written, so a record written now
    /// is a child, whose changed edges are its holder's cell's.
    nested: bool,
}

enum Target<'a, T> {
    /// A node's first read: a child its tree holds stays a tree cell, and no
    /// trivia is written, since the tree's trivia table holds it.
    Parsed { tree: TreeId, arena: &'a mut TreeArena },
    /// A built node: an untouched parsed child is linked (`Link`), and the
    /// node's trivia moves into the store of written sides.
    Built { arena: &'a mut Arena, store: &'a TriviaStore<T>, link: &'a mut Link<'a> },
}

impl<'a, T: Clone> RecordSink<'a, T> {
    /// A first read's sink: `arena` is `tree`'s.
    pub fn parsed(tree: TreeId, arena: &'a mut TreeArena) -> Self {
        Self { to: Target::Parsed { tree, arena }, holder: None, nested: false }
    }

    /// A built write's sink, its trivia kept in `store`.
    pub fn built(arena: &'a mut Arena, store: &'a TriviaStore<T>, link: &'a mut Link<'a>) -> Self {
        Self { to: Target::Built { arena, store, link }, holder: None, nested: false }
    }

    fn arena(&mut self) -> &mut Arena {
        match &mut self.to {
            Target::Parsed { arena, .. } => arena.arena_mut(),
            Target::Built { arena, .. } => arena,
        }
    }

    /// The tree of a first read's sink; `None` for a built write.
    fn tree(&self) -> Option<TreeId> {
        match self.to {
            Target::Parsed { tree, .. } => Some(tree),
            Target::Built { .. } => None,
        }
    }

    /// The record an earlier read of `row` wrote, in a first read's sink.
    fn recorded(&self, row: NodeIndex) -> Option<Address> {
        match &self.to {
            Target::Parsed { arena, .. } => arena.record(row),
            Target::Built { .. } => None,
        }
    }

    /// The row a parsed record or leaf is written for: its layout's `at`, in
    /// this sink's tree.
    fn row(tree: TreeId, layout: Option<&NodeLayout<T>>, what: &'static str) -> Result<NodeIndex, ArenaError> {
        let at = layout.and_then(|layout| layout.at.as_ref()).ok_or(ArenaError::Unwritable(what))?;
        if at.tree == tree { Ok(at.index) } else { Err(ArenaError::Unwritable("a node of another tree in a parsed record")) }
    }

    /// A header-only record: `kind` and the side record `side`.
    fn header(&mut self, kind: KindId, side: &SideRecord) -> Result<Address, ArenaError> {
        let side = if side.is_empty() { Address::NONE } else { side.write(self.arena())? };
        self.arena().push(&[u32::from(kind.0), side.0])
    }

    /// Moves a built record's trivia and its units' into the store, at the
    /// record's place and at each unit's, by the unit slot's stamped word.
    fn keep_sides(&self, at: Address, trivia: Option<&NodeTrivia<T>>, units: &[(u32, &UnitSides<T>)]) {
        let Target::Built { store, .. } = &self.to else { return };
        let keep = |place: Place, trivia: &NodeTrivia<T>| {
            for (side, entries) in [(TriviaSide::Leading, &trivia.leading), (TriviaSide::Trailing, &trivia.trailing), (TriviaSide::Inner, &trivia.inner)] {
                if let Some(entries) = entries {
                    store.write_side(place, side, entries.clone());
                }
            }
        };
        if let Some(trivia) = trivia {
            keep(Place::Record(at), trivia);
        }
        for &(word, unit) in units {
            keep(Place::Unit(Site { holder: at, word, item: unit.item }), &unit.trivia);
        }
    }
}

/// A node's layout field, and the trivia its layout holds: the trivia type
/// a node's record writer writes with.
pub trait LayoutField {
    type Trivia;
    fn layout(&self) -> Option<&NodeLayout<Self::Trivia>>;
}

impl<T> LayoutField for Option<Box<NodeLayout<T>>> {
    type Trivia = T;
    fn layout(&self) -> Option<&NodeLayout<T>> {
        self.as_deref()
    }
}

/// A value a record holds in a cell of its holder's record.
pub trait WriteCell<T> {
    /// The cell naming this value, writing first the records it needs.
    ///
    /// # Errors
    ///
    /// What the arena refuses, or `ArenaError::Unwritable` for a value no
    /// record of the sink holds.
    fn write_cell(&self, sink: &mut RecordSink<'_, T>) -> Result<Cell, ArenaError>;
}

impl<T, C: WriteCell<T>> WriteCell<T> for Option<C> {
    fn write_cell(&self, sink: &mut RecordSink<'_, T>) -> Result<Cell, ArenaError> {
        self.as_ref().map_or(Ok(Cell::Absent), |value| value.write_cell(sink))
    }
}

impl<T, C: WriteCell<T> + ?Sized> WriteCell<T> for Box<C> {
    fn write_cell(&self, sink: &mut RecordSink<'_, T>) -> Result<Cell, ArenaError> {
        (**self).write_cell(sink)
    }
}

impl<T: Clone, C: WriteCell<T>, const ADJACENT: bool> WriteCell<T> for SlotValue<C, ADJACENT> {
    fn write_cell(&self, sink: &mut RecordSink<'_, T>) -> Result<Cell, ArenaError> {
        match self {
            SlotValue::Coord(coord) => coordinate_cell(sink, coord),
            SlotValue::Node(node) => node.write_cell(sink),
        }
    }
}

/// Bare text is a captured string's cell. An `ERROR` node keeps its kind, as
/// a built leaf with a header-only record; a parsed `ERROR` is trivia of its
/// tree, never a cell.
impl<T: Clone> WriteCell<T> for VerbatimNode {
    fn write_cell(&self, sink: &mut RecordSink<'_, T>) -> Result<Cell, ArenaError> {
        if self.kind != KindId::BLANK && sink.tree().is_some() {
            return Err(ArenaError::Unwritable("an ERROR node in a parsed record"));
        }
        let text = sink.arena().intern(&self.text)?;
        if self.kind == KindId::BLANK {
            return Ok(Cell::BuiltText { text });
        }
        let record = sink.header(self.kind, &SideRecord::default())?;
        Ok(Cell::BuiltLeaf { kind: self.kind, text, record })
    }
}

/// The cell of an untouched node a coordinate names. A parsed record names it
/// by its row (tag 1). A built record links its record in its tree's arena
/// (tag 3) with the edges whose neighbour the holder changed, or copies a
/// parsed leaf, which has no record, as a built leaf whose side record names
/// the parsed one (`sides`) and holds those edges, since its cell has no word
/// for them and its record has this one holder.
///
/// # Errors
///
/// `ArenaError::Unwritable` for a coordinate with no stamped kind, or one of
/// another tree in a parsed record; else what the link or the arena refuses.
pub fn coordinate_cell<T: Clone>(sink: &mut RecordSink<'_, T>, coord: &NodeCoordinate) -> Result<Cell, ArenaError> {
    let kind = coord.kind.ok_or(ArenaError::Unwritable("a coordinate with no stamped kind"))?;
    let linked = match &mut sink.to {
        Target::Parsed { tree, .. } if *tree == coord.tree => return Ok(Cell::Coordinate { kind, index: coord.index, span: coord.span }),
        Target::Parsed { .. } => return Err(ArenaError::Unwritable("a node of another tree in a parsed record")),
        Target::Built { link, .. } => link(coord)?,
    };
    let changed = coord.changed();
    match linked {
        Linked::Record(at) => Ok(Cell::Child { kind, at, link: Some(coord.tree), changed }),
        Linked::Leaf(text) => {
            let sides = Some(Sides { tree: coord.tree, index: coord.index, end: coord.end, span: coord.span });
            let record = sink.header(kind, &SideRecord { sides, changed, ..SideRecord::default() })?;
            Ok(Cell::BuiltLeaf { kind, text: sink.arena().intern(&text)?, record })
        }
    }
}

/// Whether a parsed leaf's layout holds nothing past its `at`, which is all
/// its cell keeps.
fn bare_past_at<T>(layout: &NodeLayout<T>) -> bool {
    layout.trivia.is_none()
        && layout.edges.is_none()
        && layout.span.is_none()
        && layout.sides.is_none()
        && layout.changed == ChangedEdges::default()
        && layout.units.is_empty()
        && layout.slots.is_empty()
        && layout.separator.is_none()
        && layout.captures.is_empty()
        && layout.unit_rows.is_empty()
}

/// The cell of a leaf of `kind` holding `text`. A parsed leaf has no record:
/// its cell names its span and its row (tag 2), so its layout holds nothing
/// past its `at`. A built leaf's text goes to the string table beside its
/// header-only record (tag 5), which holds its changed edges: its cell has no
/// word for them, and the record has this one holder.
///
/// # Errors
///
/// `ArenaError::Unwritable` for a parsed leaf with no row in the sink's tree
/// or with a layout fact its cell cannot hold, or what `write_record`
/// refuses for a built leaf.
pub fn leaf_cell<T: Clone>(sink: &mut RecordSink<'_, T>, kind: KindId, text: &str, layout: Option<&NodeLayout<T>>) -> Result<Cell, ArenaError> {
    let Some(tree) = sink.tree() else {
        let (record, _) = write_words(sink, kind, HEADER_WORDS, layout, |_| None, |_, _, _| Ok(()), Changed::Own)?;
        return Ok(Cell::BuiltLeaf { kind, text: sink.arena().intern(text)?, record });
    };
    let row = RecordSink::row(tree, layout, "a parsed leaf with no row")?;
    match layout.and_then(|layout| bare_past_at(layout).then_some(layout.at.as_ref()).flatten()) {
        Some(at) => Ok(Cell::ParsedLeaf { kind, span: at.span, row }),
        None => Err(ArenaError::Unwritable("a parsed leaf's layout past its row")),
    }
}

/// Writes a node's record and answers the cell its holder names it by: its
/// header, then the cells `cells` writes into its `words` words, which also
/// adds the node's print settings to its side record. `slot_word` gives a
/// slot's stamped word by its wire key.
///
/// The edges whose neighbour a holder changed are a fact of the holder's
/// site: a record written as a child leaves them out of its side record and
/// the answered cell holds them; a record written as a root, with no holder,
/// keeps them in its side record. A parsed record holds none.
///
/// A parsed node's record is written once, for its row (`layout.at`): a later
/// write of the row answers the record the first one wrote and writes
/// nothing. An envelope's content is read from its envelope's row, so a
/// record of its holder's row is written as part of the holder: the row's
/// record is the outermost one, and the content's is reached through its
/// cell. A built node's trivia and its units' move into the store of written
/// sides, keyed by its record.
///
/// # Errors
///
/// `ArenaError::Unwritable` for a parsed node with no row in the sink's tree,
/// with written trivia or with changed edges, and for a built node read from
/// a tree; `ArenaError::UnknownSlot` for a layout entry naming a slot with no
/// stamped word; else what `cells` or the arena refuses.
pub fn write_record<T: Clone>(
    sink: &mut RecordSink<'_, T>,
    kind: KindId,
    words: u32,
    layout: Option<&NodeLayout<T>>,
    slot_word: impl Fn(&str) -> Option<u32>,
    cells: impl FnOnce(&mut RecordSink<'_, T>, &mut [u32], &mut SideRecord) -> Result<(), ArenaError>,
) -> Result<Cell, ArenaError> {
    let (at, changed) = write_words(sink, kind, words, layout, slot_word, cells, Changed::Site)?;
    Ok(Cell::Child { kind, at, link: None, changed })
}

/// Where a record's changed edges go: to its holder's cell when it has one
/// (`Site`), or to its own side record always (`Own`), for a record whose
/// cell has no word for them.
#[derive(Clone, Copy, PartialEq, Eq)]
enum Changed {
    Site,
    Own,
}

/// `write_record`'s record and the changed edges its holder's cell holds.
fn write_words<T: Clone>(
    sink: &mut RecordSink<'_, T>,
    kind: KindId,
    words: u32,
    layout: Option<&NodeLayout<T>>,
    slot_word: impl Fn(&str) -> Option<u32>,
    cells: impl FnOnce(&mut RecordSink<'_, T>, &mut [u32], &mut SideRecord) -> Result<(), ArenaError>,
    changed: Changed,
) -> Result<(Address, ChangedEdges), ArenaError> {
    if words < HEADER_WORDS {
        return Err(ArenaError::Malformed { what: "record width", word: words });
    }
    let row = match sink.tree() {
        Some(tree) => {
            let row = RecordSink::row(tree, layout, "a parsed record with no row")?;
            if layout.is_some_and(|layout| layout.changed != ChangedEdges::default()) {
                return Err(ArenaError::Unwritable("changed edges in a parsed record"));
            }
            if sink.holder != Some(row) {
                if let Some(at) = sink.recorded(row) {
                    return Ok((at, ChangedEdges::default()));
                }
            }
            if layout.is_some_and(|layout| layout.trivia.is_some() || !layout.units.is_empty()) {
                return Err(ArenaError::Unwritable("written trivia in a parsed record"));
            }
            Some(row)
        }
        None if layout.is_some_and(|layout| layout.at.is_some()) => return Err(ArenaError::Unwritable("a node read from a tree in a built record")),
        None => None,
    };
    let mut side = SideRecord::of(layout, &slot_word)?;
    let site_changed = if sink.nested && changed == Changed::Site { std::mem::take(&mut side.changed) } else { ChangedEdges::default() };
    let units = layout
        .map_or(&[][..], |layout| layout.units.as_slice())
        .iter()
        .map(|unit| slot_word(&unit.slot).map(|word| (word, unit)).ok_or_else(|| ArenaError::UnknownSlot(unit.slot.as_str().into())))
        .collect::<Result<Vec<_>, _>>()?;
    let mut record = vec![0; words as usize];
    record[0] = u32::from(kind.0);
    let content = row.is_some() && sink.holder == row;
    let holder = std::mem::replace(&mut sink.holder, row);
    let nested = std::mem::replace(&mut sink.nested, true);
    let written = cells(sink, &mut record, &mut side);
    sink.holder = holder;
    sink.nested = nested;
    written?;
    if !side.is_empty() {
        record[1] = side.write(sink.arena())?.0;
    }
    let at = sink.arena().push(&record)?;
    match (row, &mut sink.to) {
        (Some(_), Target::Parsed { .. }) if content => {}
        (Some(row), Target::Parsed { arena, .. }) => arena.index(row, at)?,
        _ => sink.keep_sides(at, layout.and_then(|layout| layout.trivia.as_ref()), &units),
    }
    Ok((at, site_changed))
}

/// Writes the cell of the value a single slot holds, the slot `slot` of the
/// node whose layout is `layout` (`unit_cell`).
///
/// # Errors
///
/// What the value's `write_cell` or `unit_cell` refuses.
pub fn write_slot<T: Clone, C: WriteCell<T>>(sink: &mut RecordSink<'_, T>, value: &C, layout: Option<&NodeLayout<T>>, slot: &str) -> Result<Cell, ArenaError> {
    let cell = value.write_cell(sink)?;
    unit_cell(sink, cell, layout, slot, ItemIndex(0))
}

/// Writes the list slot `slot`'s items as a run of `run`-word cells, after
/// the records they need, and answers the list's cell (`unit_cell`).
///
/// # Errors
///
/// What an item's `write_cell`, `unit_cell` or the arena refuses.
pub fn write_list<'i, T: Clone, C: WriteCell<T> + 'i>(
    sink: &mut RecordSink<'_, T>,
    run: u32,
    items: impl IntoIterator<Item = &'i C>,
    layout: Option<&NodeLayout<T>>,
    slot: &str,
) -> Result<ListCell, ArenaError> {
    let cells = items
        .into_iter()
        .enumerate()
        .map(|(item, value)| {
            let cell = value.write_cell(sink)?;
            unit_cell(sink, cell, layout, slot, ItemIndex(u32::try_from(item).map_err(|_| ArenaError::Full)?))
        })
        .collect::<Result<Vec<_>, _>>()?;
    ListCell::write(sink.arena(), run, &cells)
}

/// The cell of the value at `item` of the slot `slot`: a parsed unit names
/// the row its read took it from (`NodeLayout::unit_rows`), so its sides key
/// by its row.
///
/// # Errors
///
/// `ArenaError::Unwritable` for a parsed unit its read gave no row.
fn unit_cell<T: Clone>(sink: &RecordSink<'_, T>, cell: Cell, layout: Option<&NodeLayout<T>>, slot: &str, item: ItemIndex) -> Result<Cell, ArenaError> {
    match cell {
        Cell::Unit { kind, row: None } if kind != KindId::BLANK && sink.tree().is_some() => {
            let row = layout.and_then(|layout| layout.unit_rows.iter().find(|unit| unit.slot == slot && unit.item == item)).ok_or(ArenaError::Unwritable("a parsed unit with no row"))?;
            Ok(Cell::Unit { kind, row: Some(row.row) })
        }
        cell => Ok(cell),
    }
}

/// The capture spans of a token interior's `count` captures: none for a
/// built node, else one per capture.
///
/// # Errors
///
/// `ArenaError::Unwritable` for a layout holding another number of spans.
pub fn capture_spans<T>(layout: Option<&NodeLayout<T>>, count: usize) -> Result<&[Option<Span>], ArenaError> {
    let spans = layout.map_or(&[][..], |layout| layout.captures.as_slice());
    if spans.is_empty() || spans.len() == count { Ok(spans) } else { Err(ArenaError::Unwritable("capture spans other than one per capture")) }
}

/// A captured interior string's cell: its span in a parsed record when the
/// read gave one, else its text in the string table.
///
/// # Errors
///
/// What the arena's string table refuses.
pub fn captured_cell<T: Clone>(sink: &mut RecordSink<'_, T>, text: &str, span: Option<Span>) -> Result<Cell, ArenaError> {
    match span {
        Some(span) if sink.tree().is_some() => Ok(Cell::ParsedText { span }),
        _ => Ok(Cell::BuiltText { text: sink.arena().intern(text)? }),
    }
}

impl SideRecord {
    /// The side record of a node's layout. `slot_word` gives the stamped
    /// word of the list slot a layout entry names by its wire key; the
    /// writer adds the node's print settings after (`slot_mut`).
    ///
    /// # Errors
    ///
    /// `ArenaError::UnknownSlot` for a layout entry whose slot has no stamped
    /// cell in the node's record.
    pub fn of<T>(layout: Option<&NodeLayout<T>>, slot_word: impl Fn(&str) -> Option<u32>) -> Result<SideRecord, ArenaError> {
        let Some(layout) = layout else { return Ok(SideRecord::default()) };
        let slots = layout
            .slots
            .iter()
            .map(|slot| {
                let word = slot_word(&slot.slot).ok_or_else(|| ArenaError::UnknownSlot(slot.slot.as_str().into()))?;
                Ok(SideSlot { word, before: slot.before, after: slot.after, separator: slot.separator, space_before: None, space_after: None, tokens: slot.tokens.clone() })
            })
            .collect::<Result<_, ArenaError>>()?;
        Ok(SideRecord {
            at: layout.at.as_ref().map(|at| (at.index, at.end)),
            edges: layout.edges,
            span: layout.span,
            sides: layout.sides.as_ref().map(|from| Sides { tree: from.tree, index: from.index, end: from.end, span: from.span }),
            changed: layout.changed,
            separator: layout.separator,
            delimiter: None,
            separator_kind: None,
            slots,
        })
    }

    /// The entry of the slot at `word`, added when the record has none.
    pub fn slot_mut(&mut self, word: u32) -> &mut SideSlot {
        super::entry_by_word(&mut self.slots, word, |slot| slot.word, || SideSlot { word, ..SideSlot::default() })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::layout::SlotLayout;
    use crate::options::{EdgeArm, Edges};
    use crate::slot::CoordinateWrites;
    use crate::trivia::{TriviaEntry, TriviaText};

    fn coordinate(index: u32, end: u32) -> NodeCoordinate {
        NodeCoordinate { tree: TreeId(3), index: NodeIndex(index), end: NodeIndex(end), span: Span { start: 4, end: 9 }, kind: Some(KindId(5)), edges: None, writes: None }
    }

    fn layout() -> NodeLayout<TriviaText> {
        NodeLayout {
            trivia: None,
            edges: Some(Edges { before: Some(EdgeArm { arm: KindId(2), strength: None }), after: None }),
            at: Some(coordinate(6, 11)),
            span: None,
            sides: Some(coordinate(1, 2)),
            changed: ChangedEdges { leading: false, trailing: true },
            units: Vec::new(),
            slots: vec![SlotLayout { slot: "_items".to_owned(), before: Some(KindId(7)), after: None, separator: Some(KindId(8)), tokens: vec![None, Some(KindId(8))] }],
            separator: Some(KindId(9)),
            captures: Vec::new(),
            unit_rows: Vec::new(),
        }
    }

    #[test]
    fn a_layout_s_facts_land_in_its_side_record_by_stamped_word() {
        let record = SideRecord::of(Some(&layout()), |key| (key == "_items").then_some(4)).expect("every slot is stamped");
        assert_eq!(record.at, Some((NodeIndex(6), NodeIndex(11))));
        assert_eq!(record.edges, layout().edges);
        assert_eq!(record.sides, Some(Sides { tree: TreeId(3), index: NodeIndex(1), end: NodeIndex(2), span: Span { start: 4, end: 9 } }));
        assert_eq!(record.changed, ChangedEdges { leading: false, trailing: true });
        assert_eq!(record.separator, Some(KindId(9)));
        assert_eq!(
            record.slots,
            vec![SideSlot { word: 4, before: Some(KindId(7)), after: None, separator: Some(KindId(8)), space_before: None, space_after: None, tokens: vec![None, Some(KindId(8))] }]
        );
        assert!(SideRecord::of::<TriviaText>(None, |_| None).expect("no layout").is_empty());
    }

    #[test]
    fn a_layout_slot_with_no_stamped_cell_is_refused_by_name() {
        assert_eq!(SideRecord::of(Some(&layout()), |_| None), Err(ArenaError::UnknownSlot("_items".into())));
    }

    #[test]
    fn a_setting_joins_its_slot_s_entry_or_adds_one() {
        let mut record = SideRecord::of(Some(&layout()), |_| Some(4)).expect("stamped");
        record.slot_mut(4).space_after = Some(KindId(1));
        record.slot_mut(6).space_before = Some(KindId::BLANK);
        let words: Vec<_> = record.slots.iter().map(|slot| (slot.word, slot.before, slot.space_before, slot.space_after)).collect();
        assert_eq!(words, vec![(4, Some(KindId(7)), None, Some(KindId(1))), (6, None, Some(KindId::BLANK), None)]);
    }

    const TREE: TreeId = TreeId(3);
    const NAME: KindId = KindId(5);
    const PAIR: KindId = KindId(6);

    type Layout = Option<Box<NodeLayout<TriviaText>>>;

    /// A leaf, written as the derive writes a text node's cell.
    struct Name {
        layout: Layout,
        text: String,
    }

    impl WriteCell<TriviaText> for Name {
        fn write_cell(&self, sink: &mut RecordSink<'_, TriviaText>) -> Result<Cell, ArenaError> {
            leaf_cell(sink, NAME, &self.text, self.layout.as_deref())
        }
    }

    /// A node with a presence bit at word 2 bit 0, a child cell at words
    /// 3..8, a list at words 8..10 and a spacing setting of the list, written
    /// as the derive writes a struct's record.
    struct Pair {
        layout: Layout,
        open: bool,
        left: SlotValue<Name>,
        items: Vec<SlotValue<Name>>,
        items_space: Option<KindId>,
    }

    impl WriteCell<TriviaText> for Pair {
        fn write_cell(&self, sink: &mut RecordSink<'_, TriviaText>) -> Result<Cell, ArenaError> {
            let slot_word = |key: &str| match key {
                "_left" => Some(3),
                "_items" => Some(8),
                _ => None,
            };
            write_record(sink, PAIR, 10, self.layout.as_deref(), slot_word, |sink, words, side| {
                words[2] |= u32::from(self.open);
                write_slot(sink, &self.left, self.layout.as_deref(), "_left")?.encode(&mut words[3..8])?;
                write_list(sink, 5, &self.items, self.layout.as_deref(), "_items")?.encode(&mut words[8..10])?;
                if let Some(space) = self.items_space {
                    side.slot_mut(8).space_after = Some(space);
                }
                Ok(())
            })
        }
    }

    fn at(index: u32, end: u32) -> NodeCoordinate {
        NodeCoordinate { kind: Some(NAME), ..NodeCoordinate::new(TREE, NodeIndex(index), NodeIndex(end), Span { start: index * 10, end: index * 10 + 3 }) }
    }

    fn read_at(index: u32, end: u32) -> Box<NodeLayout<TriviaText>> {
        Box::new(NodeLayout { at: Some(at(index, end)), ..NodeLayout::default() })
    }

    fn name(text: &str, layout: Layout) -> SlotValue<Name> {
        SlotValue::Node(Name { layout, text: text.to_owned() })
    }

    fn pair(layout: Layout, left: SlotValue<Name>, items: Vec<SlotValue<Name>>) -> Pair {
        Pair { layout, open: true, left, items, items_space: None }
    }

    fn entry(text: &str) -> TriviaEntry<TriviaText> {
        TriviaEntry::new(SlotValue::Node(TriviaText { kind: KindId(1), text: text.to_owned(), span: None, before: None, after: None }))
    }

    /// A pair's record: its header's kind and side record, its presence word,
    /// its child cell and its list's item cells.
    fn pair_record(arena: &Arena, cell: Cell) -> (KindId, SideRecord, u32, Cell, Vec<Cell>) {
        let Cell::Child { at, .. } = cell else { panic!("a pair is a child cell, not {cell:?}") };
        let words = arena.words(at, 10).expect("its words").to_vec();
        let side = if words[1] == 0 { SideRecord::default() } else { SideRecord::read(arena, Address(words[1])).expect("its side record") };
        let items = ListCell::decode(&words[8..10]).expect("a list").items(arena, 5).expect("its run").map(|item| Cell::decode(item).expect("an item")).collect();
        (KindId(u16::try_from(words[0]).expect("a kind")), side, words[2], Cell::decode(&words[3..8]).expect("a cell"), items)
    }

    fn unlinked(_: &NodeCoordinate) -> Result<Linked, ArenaError> {
        panic!("no coordinate is linked here")
    }

    #[test]
    fn a_first_read_writes_children_first_and_names_tree_children_by_row() {
        let mut tree = TreeArena::new();
        let node = pair(Some(read_at(1, 6)), name("a", Some(read_at(2, 3))), vec![SlotValue::Coord(at(3, 4)), name("b", Some(read_at(4, 5)))]);
        let cell = node.write_cell(&mut RecordSink::parsed(TREE, &mut tree)).expect("written");
        let Cell::Child { at: record, link: None, .. } = cell else { panic!("a record in the tree's own arena, not {cell:?}") };
        assert_eq!(tree.record(NodeIndex(1)), Some(record), "the row's first read indexed its record");
        let (kind, side, presence, left, items) = pair_record(tree.arena(), cell);
        assert_eq!((kind, presence), (PAIR, 1));
        assert_eq!(side.at, Some((NodeIndex(1), NodeIndex(6))));
        assert_eq!(left, Cell::ParsedLeaf { kind: NAME, span: Span { start: 20, end: 23 }, row: NodeIndex(2) });
        assert_eq!(
            items,
            vec![Cell::Coordinate { kind: NAME, index: NodeIndex(3), span: Span { start: 30, end: 33 } }, Cell::ParsedLeaf { kind: NAME, span: Span { start: 40, end: 43 }, row: NodeIndex(4) }]
        );
        for leaf in [2, 3, 4] {
            assert_eq!(tree.record(NodeIndex(leaf)), None, "row {leaf} has no record of its own");
        }
    }

    #[test]
    fn a_row_read_again_answers_its_first_record_and_writes_nothing() {
        let mut tree = TreeArena::new();
        let layout = Some(read_at(1, 2));
        let first = write_record(&mut RecordSink::parsed(TREE, &mut tree), PAIR, 3, layout.as_deref(), |_| None, |_, words, _| {
            words[2] = 7;
            Ok(())
        })
        .expect("written");
        let Cell::Child { at: first, .. } = first else { panic!("a record, not {first:?}") };
        let written = tree.arena().chunk(first.chunk()).expect("its chunk").len();
        let again = write_record(&mut RecordSink::parsed(TREE, &mut tree), PAIR, 3, layout.as_deref(), |_| None, |_, _, _| panic!("a row's record is written once"))
            .expect("the first record");
        assert_eq!(again, Cell::Child { kind: PAIR, at: first, link: None, changed: ChangedEdges::default() });
        assert_eq!(tree.arena().chunk(first.chunk()).expect("its chunk").len(), written);
    }

    /// An envelope: its content at words 2..7, read from the same row.
    struct Envelope {
        layout: Layout,
        content: SlotValue<Pair>,
    }

    impl WriteCell<TriviaText> for Envelope {
        fn write_cell(&self, sink: &mut RecordSink<'_, TriviaText>) -> Result<Cell, ArenaError> {
            write_record(sink, KindId(8), 7, self.layout.as_deref(), |_| None, |sink, words, _| self.content.write_cell(sink)?.encode(&mut words[2..7]))
        }
    }

    #[test]
    fn an_envelope_s_row_holds_the_envelope_and_its_content_is_reached_through_its_cell() {
        let mut tree = TreeArena::new();
        let content = pair(Some(read_at(1, 3)), name("a", Some(read_at(2, 3))), Vec::new());
        let envelope = Envelope { layout: Some(read_at(1, 3)), content: SlotValue::Node(content) };
        let cell = envelope.write_cell(&mut RecordSink::parsed(TREE, &mut tree)).expect("written");
        let Cell::Child { at, .. } = cell else { panic!("a record, not {cell:?}") };
        assert_eq!(tree.record(NodeIndex(1)), Some(at), "the row's record is the outermost");
        let inner = Cell::decode(&tree.arena().words(at, 7).expect("its words")[2..7]).expect("its content's cell");
        let (kind, side, ..) = pair_record(tree.arena(), inner);
        assert_eq!((kind, side.at), (PAIR, Some((NodeIndex(1), NodeIndex(3)))));
        let again = envelope.write_cell(&mut RecordSink::parsed(TREE, &mut tree)).expect("the first record");
        assert_eq!(again, cell);
    }

    #[test]
    fn a_first_read_refuses_what_its_cells_cannot_hold() {
        let refused = |node: &Pair| node.write_cell(&mut RecordSink::parsed(TREE, &mut TreeArena::new())).expect_err("refused");
        let trivia = Some(NodeTrivia { leading: Some(vec![entry("// a")]), trailing: None, inner: None });
        let seated = Some(Box::new(NodeLayout { trivia, at: Some(at(1, 4)), ..NodeLayout::default() }));
        assert_eq!(refused(&pair(seated, name("a", Some(read_at(2, 3))), Vec::new())), ArenaError::Unwritable("written trivia in a parsed record"));
        assert_eq!(refused(&pair(None, name("a", Some(read_at(2, 3))), Vec::new())), ArenaError::Unwritable("a parsed record with no row"));
        let elsewhere = NodeCoordinate { tree: TreeId(4), ..at(2, 3) };
        assert_eq!(refused(&pair(Some(read_at(1, 4)), SlotValue::Coord(elsewhere), Vec::new())), ArenaError::Unwritable("a node of another tree in a parsed record"));
        let kindless = NodeCoordinate { kind: None, ..at(2, 3) };
        assert_eq!(refused(&pair(Some(read_at(1, 4)), SlotValue::Coord(kindless), Vec::new())), ArenaError::Unwritable("a coordinate with no stamped kind"));
        let separated = Some(Box::new(NodeLayout { separator: Some(KindId(9)), at: Some(at(2, 3)), ..NodeLayout::default() }));
        assert_eq!(refused(&pair(Some(read_at(1, 4)), name("a", separated), Vec::new())), ArenaError::Unwritable("a parsed leaf's layout past its row"));
        assert_eq!(refused(&pair(Some(read_at(1, 4)), name("a", None), Vec::new())), ArenaError::Unwritable("a parsed leaf with no row"));
    }

    #[test]
    fn a_refused_first_read_leaves_its_row_without_a_record() {
        let mut tree = TreeArena::new();
        let node = pair(Some(read_at(1, 4)), SlotValue::Coord(NodeCoordinate { kind: None, ..at(2, 3) }), Vec::new());
        assert!(node.write_cell(&mut RecordSink::parsed(TREE, &mut tree)).is_err());
        assert_eq!(tree.record(NodeIndex(1)), None);
    }

    #[test]
    fn a_built_write_moves_its_trivia_and_units_into_the_store() {
        let (mut arena, store) = (Arena::new(), TriviaStore::new());
        let trivia = Some(NodeTrivia { leading: Some(vec![entry("// a")]), trailing: None, inner: None });
        let unit = UnitSides { slot: "_items".to_owned(), item: crate::types::ItemIndex(1), trivia: NodeTrivia { leading: None, trailing: None, inner: Some(Vec::new()) } };
        let layout = Some(Box::new(NodeLayout { trivia, units: vec![unit], ..NodeLayout::default() }));
        let node = Pair { items_space: Some(KindId(2)), ..pair(layout, name("x", None), Vec::new()) };
        let cell = node.write_cell(&mut RecordSink::built(&mut arena, &store, &mut unlinked)).expect("written");
        let Cell::Child { at: record, .. } = cell else { panic!("a record, not {cell:?}") };
        assert_eq!(store.side(Place::Record(record), TriviaSide::Leading), Some(vec![entry("// a")]));
        assert_eq!(store.side(Place::Record(record), TriviaSide::Trailing), None, "a side no write set stays unwritten");
        assert_eq!(store.side(Place::Unit(Site { holder: record, word: 8, item: crate::types::ItemIndex(1) }), TriviaSide::Inner), Some(Vec::new()));
        let (_, side, _, left, items) = pair_record(&arena, cell);
        assert_eq!(side.slots, vec![SideSlot { word: 8, space_after: Some(KindId(2)), ..SideSlot::default() }], "the setting is in its slot's entry");
        let Cell::BuiltLeaf { kind: NAME, text, record: leaf } = left else { panic!("a built leaf, not {left:?}") };
        assert_eq!(arena.text(text), Ok("x"));
        assert_eq!(arena.words(leaf, 2), Ok(&[u32::from(NAME.0), 0][..]), "a leaf's record is its header alone");
        assert_eq!(items, Vec::<Cell>::new());
    }

    #[test]
    fn a_built_unit_of_an_unstamped_slot_is_refused_before_any_side_is_kept() {
        let (mut arena, store) = (Arena::new(), TriviaStore::new());
        let trivia = Some(NodeTrivia { leading: Some(vec![entry("// a")]), trailing: None, inner: None });
        let unit = UnitSides { slot: "_gone".to_owned(), item: crate::types::ItemIndex(0), trivia: NodeTrivia::default() };
        let node = pair(Some(Box::new(NodeLayout { trivia, units: vec![unit], ..NodeLayout::default() })), name("x", None), Vec::new());
        assert_eq!(node.write_cell(&mut RecordSink::built(&mut arena, &store, &mut unlinked)), Err(ArenaError::UnknownSlot("_gone".into())));
        assert_eq!(store.len(), 0);
    }

    #[test]
    fn a_built_record_links_an_untouched_node_and_copies_an_untouched_leaf() {
        let (mut arena, store) = (Arena::new(), TriviaStore::new());
        let linked = Address::new(0, 1).expect("an address");
        let mut link = |coord: &NodeCoordinate| Ok(if coord.index == NodeIndex(5) { Linked::Record(linked) } else { Linked::Leaf("y".to_owned()) });
        let changed = ChangedEdges { leading: true, trailing: false };
        let moved = |index| NodeCoordinate { writes: Some(Box::new(CoordinateWrites { changed })), ..at(index, index + 1) };
        let node = pair(None, SlotValue::Coord(moved(5)), vec![SlotValue::Coord(moved(6))]);
        let cell = node.write_cell(&mut RecordSink::built(&mut arena, &store, &mut link)).expect("written");
        let (_, _, _, left, items) = pair_record(&arena, cell);
        assert_eq!(left, Cell::Child { kind: NAME, at: linked, link: Some(TREE), changed });
        let [Cell::BuiltLeaf { kind: NAME, text, record }] = items[..] else { panic!("a copied leaf, not {items:?}") };
        assert_eq!(arena.text(text), Ok("y"));
        let header = arena.words(record, 2).expect("its header");
        let side = SideRecord::read(&arena, Address(header[1])).expect("its side record");
        assert_eq!(side.sides, Some(Sides { tree: TREE, index: NodeIndex(6), end: NodeIndex(7), span: Span { start: 60, end: 63 } }));
        assert_eq!(side.changed, changed);
    }

    #[test]
    fn a_child_s_changed_edges_are_its_holder_s_cell_s_and_a_root_keeps_its_own() {
        let (mut arena, store) = (Arena::new(), TriviaStore::new());
        let changed = |leading, trailing| ChangedEdges { leading, trailing };
        let moved = |edges| Some(Box::new(NodeLayout { changed: edges, ..NodeLayout::default() }));
        let content = pair(moved(changed(true, false)), name("x", moved(changed(false, true))), Vec::new());
        let envelope = Envelope { layout: moved(changed(true, true)), content: SlotValue::Node(content) };
        let root = envelope.write_cell(&mut RecordSink::built(&mut arena, &store, &mut unlinked)).expect("written");
        let Cell::Child { at, changed: held, .. } = root else { panic!("a record, not {root:?}") };
        assert_eq!(held, ChangedEdges::default(), "a root has no holder's cell to hold them");
        let words = arena.words(at, 7).expect("its words").to_vec();
        assert_eq!(SideRecord::read(&arena, Address(words[1])).expect("its side record").changed, changed(true, true), "a root keeps its own");
        let inner = Cell::decode(&words[2..7]).expect("its content's cell");
        let Cell::Child { changed: held, .. } = inner else { panic!("a record, not {inner:?}") };
        assert_eq!(held, changed(true, false), "a child's are its holder's cell's");
        let (_, side, _, left, _) = pair_record(&arena, inner);
        assert_eq!(side.changed, ChangedEdges::default(), "and never its own record's");
        let Cell::BuiltLeaf { record, .. } = left else { panic!("a built leaf, not {left:?}") };
        let header = arena.words(record, 2).expect("its header");
        assert_eq!(SideRecord::read(&arena, Address(header[1])).expect("its side record").changed, changed(false, true), "a leaf's cell has no word for them, so its one-holder record keeps them");
    }

    #[test]
    fn a_parsed_record_holds_no_changed_edges() {
        let moved = Some(Box::new(NodeLayout { changed: ChangedEdges { leading: true, trailing: false }, ..*read_at(1, 4) }));
        let refused = pair(moved, name("a", Some(read_at(2, 3))), Vec::new()).write_cell(&mut RecordSink::parsed(TREE, &mut TreeArena::new()));
        assert_eq!(refused, Err(ArenaError::Unwritable("changed edges in a parsed record")));
    }

    #[test]
    fn a_built_write_refuses_a_node_read_from_a_tree() {
        let (mut arena, store) = (Arena::new(), TriviaStore::new());
        let node = pair(Some(read_at(1, 2)), name("x", None), Vec::new());
        assert_eq!(node.write_cell(&mut RecordSink::built(&mut arena, &store, &mut unlinked)), Err(ArenaError::Unwritable("a node read from a tree in a built record")));
    }

    #[test]
    fn verbatim_text_is_a_captured_string_and_an_error_keeps_its_kind() {
        let (mut arena, store) = (Arena::new(), TriviaStore::<TriviaText>::new());
        let mut link = unlinked;
        let (bare, error) = {
            let mut sink = RecordSink::built(&mut arena, &store, &mut link);
            let bare = VerbatimNode { text: "a b".to_owned(), kind: KindId::BLANK }.write_cell(&mut sink).expect("written");
            (bare, VerbatimNode { text: "@@".to_owned(), kind: KindId::ERROR }.write_cell(&mut sink).expect("written"))
        };
        let Cell::BuiltText { text } = bare else { panic!("captured text, not {bare:?}") };
        assert_eq!(arena.text(text), Ok("a b"));
        let Cell::BuiltLeaf { kind: KindId::ERROR, text, record } = error else { panic!("an ERROR leaf, not {error:?}") };
        assert_eq!((arena.text(text), arena.words(record, 2)), (Ok("@@"), Ok(&[u32::from(KindId::ERROR.0), 0][..])));
        let mut tree = TreeArena::new();
        let parsed = VerbatimNode { text: "@@".to_owned(), kind: KindId::ERROR }.write_cell(&mut RecordSink::<TriviaText>::parsed(TREE, &mut tree));
        assert_eq!(parsed, Err(ArenaError::Unwritable("an ERROR node in a parsed record")));
    }

    #[test]
    fn a_capture_keeps_its_span_in_a_parsed_record_and_its_text_in_a_built_one() {
        let spans = vec![Some(Span { start: 1, end: 2 }), None];
        let layout = NodeLayout::<TriviaText> { captures: spans.clone(), ..NodeLayout::default() };
        assert_eq!(capture_spans(Some(&layout), 2), Ok(&spans[..]));
        assert_eq!(capture_spans::<TriviaText>(None, 2), Ok(&[][..]), "a built node has none");
        assert_eq!(capture_spans(Some(&layout), 3), Err(ArenaError::Unwritable("capture spans other than one per capture")));
        let mut tree = TreeArena::new();
        let mut parsed = RecordSink::<TriviaText>::parsed(TREE, &mut tree);
        assert_eq!(captured_cell(&mut parsed, "ab", spans[0]), Ok(Cell::ParsedText { span: Span { start: 1, end: 2 } }));
        let unmatched = captured_cell(&mut parsed, "", None).expect("written");
        assert!(matches!(unmatched, Cell::BuiltText { .. }), "a group that did not match has no span: {unmatched:?}");
        let (mut arena, store) = (Arena::new(), TriviaStore::<TriviaText>::new());
        let built = captured_cell(&mut RecordSink::built(&mut arena, &store, &mut unlinked), "ab", spans[0]).expect("written");
        let Cell::BuiltText { text } = built else { panic!("captured text, not {built:?}") };
        assert_eq!(arena.text(text), Ok("ab"));
    }

    #[test]
    fn an_empty_list_has_no_run() {
        let (mut arena, store) = (Arena::new(), TriviaStore::<TriviaText>::new());
        let list = write_list::<_, SlotValue<Name>>(&mut RecordSink::built(&mut arena, &store, &mut unlinked), 5, &[], None, "_items").expect("written");
        assert_eq!(list, ListCell::EMPTY);
    }

    const MARK: KindId = KindId(30);

    /// A unit, as a choice's unit arm writes one: its kind alone.
    struct Mark;

    impl WriteCell<TriviaText> for Mark {
        fn write_cell(&self, _: &mut RecordSink<'_, TriviaText>) -> Result<Cell, ArenaError> {
            Ok(Cell::Unit { kind: MARK, row: None })
        }
    }

    #[test]
    fn a_parsed_unit_names_the_row_its_read_took_it_from_and_a_built_one_names_none() {
        let row = |item, row| crate::layout::UnitRow { slot: "_marks", item: ItemIndex(item), row: NodeIndex(row) };
        let layout = NodeLayout::<TriviaText> { unit_rows: vec![row(0, 7), row(1, 9)], ..NodeLayout::default() };
        let mut tree = TreeArena::new();
        let list = write_list(&mut RecordSink::parsed(TREE, &mut tree), 5, &[Mark, Mark], Some(&layout), "_marks").expect("written");
        let words = tree.arena().words(list.run, 10).expect("the run");
        assert_eq!(Cell::decode(&words[5..10]), Ok(Cell::Unit { kind: MARK, row: Some(NodeIndex(9)) }));
        assert_eq!(write_slot(&mut RecordSink::parsed(TREE, &mut tree), &Mark, Some(&layout), "_marks"), Ok(Cell::Unit { kind: MARK, row: Some(NodeIndex(7)) }));
        assert_eq!(write_slot(&mut RecordSink::parsed(TREE, &mut tree), &Mark, Some(&layout), "_other"), Err(ArenaError::Unwritable("a parsed unit with no row")));
        let (mut arena, store) = (Arena::new(), TriviaStore::<TriviaText>::new());
        assert_eq!(write_slot(&mut RecordSink::built(&mut arena, &store, &mut unlinked), &Mark, None, "_marks"), Ok(Cell::Unit { kind: MARK, row: None }));
    }
}
