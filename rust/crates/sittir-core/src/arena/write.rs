//! The native record writer: a native node's records, children before
//! parents, in a built arena, with the side record of each node's layout and
//! its print settings, and its trivia moved into the store of written sides.
//! A parsed tree's records are written by direct hydration (`hydrate`); this
//! writer writes built records from native nodes, as the record fuzz and the
//! render parity tests build them, in the form the engine's builders write:
//! one word a cell (`Cell::decode_built`).
//!
//! The derive writes each node type's `WriteCell` through these helpers.

use crate::heap::HeapBytes;
use super::{Address, ArenaError, BuiltChunks, BuiltWriter, Cell, CellWord, SideRecord, SideSlot, Sides};
use crate::layout::{NodeLayout, UnitSides};
use crate::record::HEADER_WORDS;
use crate::slot::{ChangedEdges, NodeCoordinate, SlotValue};
use crate::trivia::{NodeTrivia, TriviaEntry, TriviaText};
use crate::trivia_store::{CompactEntry, Place, Site, TriviaStore};
use crate::trivia_table::TriviaSide;
use crate::types::{ItemIndex, KindId};
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

/// Where a record writer writes: a built arena, the store its trivia moves
/// into, and the link it resolves an untouched parsed node by.
pub struct RecordSink<'a, T> {
    writer: BuiltWriter<'a>,
    store: &'a TriviaStore<T>,
    link: &'a mut Link<'a>,
    /// The cell a trivia value is written as (`WriteCell` of the trivia
    /// type), by which its side is kept (`kept`).
    trivia: fn(&T, &mut RecordSink<'_, T>) -> Result<CellWord, ArenaError>,
    /// Whether a record's cells are being written, so a record written now
    /// is a child, whose changed edges are its holder's cell's.
    nested: bool,
    /// The trivia of the built leaf whose cell was written last, which its
    /// holder keeps at the leaf's site (`unit_cell`).
    leaf: Option<NodeTrivia<T>>,
    /// The sides of the built leaves the record being written holds, by
    /// slot and item, kept at their sites once it has its address.
    leaves: Vec<(String, ItemIndex, NodeTrivia<T>)>,
}

impl<'a, T: Clone + HeapBytes> RecordSink<'a, T> {
    /// A built write's sink into `chunks`, its trivia kept in `store`.
    pub fn built(chunks: &'a mut BuiltChunks, store: &'a TriviaStore<T>, link: &'a mut Link<'a>) -> Self
    where
        T: WriteCell<T>,
    {
        Self { writer: BuiltWriter::new(chunks), store, link, trivia: <T as WriteCell<T>>::write_cell, nested: false, leaf: None, leaves: Vec::new() }
    }

    /// `entries` as the engine's store keeps them (`CompactEntry`): a built
    /// record by its kind and address, a coordinate naming a node a read
    /// left a record of as that record, and a value by the cell it is
    /// written as, which the side holds as a holder holds its child's: a
    /// unit as a layout member, a leaf entry as text and a record as a
    /// record.
    ///
    /// # Errors
    ///
    /// `ArenaError::Unwritable` for a coordinate naming no read's record,
    /// before any entry is written, and for a value written as a cell of any
    /// other form; else what writing a value refuses.
    pub fn kept(&mut self, entries: &[TriviaEntry<T>]) -> Result<Vec<CompactEntry>, ArenaError> {
        if entries.iter().any(|entry| matches!(entry, TriviaEntry::Value(SlotValue::Coord(coordinate)) if self.read_record(coordinate).is_none())) {
            return Err(ArenaError::Unwritable("a coordinate in a side naming no record a read left"));
        }
        let nested = std::mem::replace(&mut self.nested, true);
        let mut kept = Vec::with_capacity(entries.len());
        let written = entries.iter().try_for_each(|entry| {
            kept.push(self.kept_entry(entry)?);
            Ok(())
        });
        self.nested = nested;
        written.map(|()| kept)
    }

    fn kept_entry(&mut self, entry: &TriviaEntry<T>) -> Result<CompactEntry, ArenaError> {
        let value = match entry {
            TriviaEntry::Record(record) => return Ok(CompactEntry::Record { kind: record.record.kind, at: record.record.at }),
            TriviaEntry::Value(SlotValue::Node(value)) => value,
            TriviaEntry::Value(SlotValue::Coord(coordinate)) => return self.read_record(coordinate).ok_or(ArenaError::Unwritable("a coordinate in a side naming no record a read left")),
        };
        let write = self.trivia;
        let cell = write(value, self)?;
        match Cell::decode_built(cell, &self.writer, self.writer.kind_bits())? {
            Cell::Unit { kind, .. } if kind != KindId::BLANK => Ok(CompactEntry::Layout { kind }),
            Cell::Child { kind, at, link: None, .. } => Ok(CompactEntry::Record { kind, at }),
            Cell::BuiltLeaf { kind, .. } => Ok(CompactEntry::Text { kind, at: cell.address() }),
            Cell::BuiltText { .. } => Ok(CompactEntry::Text { kind: KindId::BLANK, at: cell.address() }),
            _ => Err(ArenaError::Unwritable("a trivia value written as no record, layout member or leaf entry")),
        }
    }

    /// The record a read left of the node `coordinate` names by its own
    /// record, as an entry; none for a node it names by a site in its
    /// holder's record, or by no record.
    fn read_record(&self, coordinate: &NodeCoordinate) -> Option<CompactEntry> {
        let kind = coordinate.kind?;
        match coordinate.name()? {
            crate::types::NodeName { node, site: None } if super::ArenaRead::read_entry(&self.writer, Address(node.0)) => Some(CompactEntry::Record { kind, at: Address(node.0) }),
            _ => None,
        }
    }

    /// Moves a built record's trivia, its units' and its leaves' into the
    /// store, at the record's place and at each unit's and leaf's site, by
    /// the slot's stamped word, each side kept as the store keeps it
    /// (`kept`).
    fn keep_sides(&mut self, at: Address, trivia: Option<&NodeTrivia<T>>, units: &[(u32, &UnitSides<T>)], leaves: &[(u32, ItemIndex, NodeTrivia<T>)]) -> Result<(), ArenaError> {
        if let Some(trivia) = trivia {
            self.keep(Place::record(at), trivia)?;
        }
        for &(word, unit) in units {
            self.keep(Place::site(Site { holder: at, word, item: unit.item }), &unit.trivia)?;
        }
        for (word, item, trivia) in leaves {
            self.keep(Place::site(Site { holder: at, word: *word, item: *item }), trivia)?;
        }
        Ok(())
    }

    fn keep(&mut self, place: Place, trivia: &NodeTrivia<T>) -> Result<(), ArenaError> {
        for (side, entries) in [(TriviaSide::Leading, &trivia.leading), (TriviaSide::Trailing, &trivia.trailing), (TriviaSide::Inner, &trivia.inner)] {
            if let Some(entries) = entries {
                let kept = self.kept(entries)?;
                self.store.write_kept_in(self.writer.chunks_mut(), place, side, kept)?;
            }
        }
        Ok(())
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
    /// The built cell naming this value, writing first the entries it needs.
    ///
    /// # Errors
    ///
    /// What the arena refuses, or `ArenaError::Unwritable` for a value no
    /// record of the sink holds.
    fn write_cell(&self, sink: &mut RecordSink<'_, T>) -> Result<CellWord, ArenaError>;
}

impl<T, C: WriteCell<T>> WriteCell<T> for Option<C> {
    fn write_cell(&self, sink: &mut RecordSink<'_, T>) -> Result<CellWord, ArenaError> {
        self.as_ref().map_or(Ok(CellWord(0)), |value| value.write_cell(sink))
    }
}

impl<T, C: WriteCell<T> + ?Sized> WriteCell<T> for Box<C> {
    fn write_cell(&self, sink: &mut RecordSink<'_, T>) -> Result<CellWord, ArenaError> {
        (**self).write_cell(sink)
    }
}

impl<T: Clone + HeapBytes, C: WriteCell<T>, const ADJACENT: bool> WriteCell<T> for SlotValue<C, ADJACENT> {
    fn write_cell(&self, sink: &mut RecordSink<'_, T>) -> Result<CellWord, ArenaError> {
        match self {
            SlotValue::Coord(coord) => coordinate_cell(sink, coord),
            SlotValue::Node(node) => node.write_cell(sink),
        }
    }
}

/// Bare text is a captured string's cell, an entry of the blank kind. An
/// `ERROR` node keeps its kind, as a built leaf.
impl<T: Clone + HeapBytes> WriteCell<T> for VerbatimNode {
    fn write_cell(&self, sink: &mut RecordSink<'_, T>) -> Result<CellWord, ArenaError> {
        CellWord::of(sink.writer.entry(self.kind, &self.text)?, ChangedEdges::default())
    }
}

/// Detached trivia text is a leaf entry of its kind, as a verbatim node is:
/// its snapshot span and its adjacency are not kept.
impl<T: Clone + HeapBytes> WriteCell<T> for TriviaText {
    fn write_cell(&self, sink: &mut RecordSink<'_, T>) -> Result<CellWord, ArenaError> {
        CellWord::of(sink.writer.entry(self.kind, &self.text)?, ChangedEdges::default())
    }
}

/// The cell of an untouched node a coordinate names, with the edges whose
/// neighbour the holder changed: its record itself when a read left it in
/// the arena the sink writes, or, for a node with no record of its own
/// that the coordinate names past the call, a link record naming it.
///
/// # Errors
///
/// `ArenaError::Unwritable` for a coordinate with no stamped kind or naming
/// a parsed leaf, which only a builder links; else what the link refuses.
pub fn coordinate_cell<T: Clone + HeapBytes>(sink: &mut RecordSink<'_, T>, coord: &NodeCoordinate) -> Result<CellWord, ArenaError> {
    let kind = coord.kind.ok_or(ArenaError::Unwritable("a coordinate with no stamped kind"))?;
    let changed = coord.changed();
    match coord.name() {
        Some(name @ crate::types::NodeName { site: Some(_), .. }) => return CellWord::of(sink.writer.link(kind, name, coord.span)?, changed),
        Some(crate::types::NodeName { node, site: None }) if sink.writer.hold_read(Address(node.0))? => return CellWord::of(Address(node.0), changed),
        _ => {}
    }
    match (sink.link)(coord)? {
        Linked::Record(record) if sink.writer.hold_read(record)? => CellWord::of(record, changed),
        Linked::Record(_) => Err(ArenaError::Unwritable("a node of a tree in a built record: a built record names only nodes whose records outlive their tree")),
        Linked::Leaf(_) => Err(ArenaError::Unwritable("a parsed leaf in a built record, which a link record names and only a builder writes")),
    }
}

/// Whether a built leaf's layout holds nothing its cell and its site cannot
/// keep: nothing past its trivia, its changed edges and a snapshot's span. A
/// built leaf keeps no span: its gaps render from the options, as a
/// builder's leaf's do.
fn bare_leaf<T>(layout: &NodeLayout<T>) -> bool {
    layout.edges.is_none()
        && layout.sides.is_none()
        && layout.units.is_empty()
        && layout.slots.is_empty()
        && layout.separator.is_none()
        && layout.captures.is_empty()
        && layout.unit_rows.is_empty()
}

/// The cell of a built leaf of `kind` holding `text`: its leaf entry and its
/// changed edges; its trivia goes to its holder, which keeps it at the
/// leaf's site (`keep_leaf_site`).
///
/// # Errors
///
/// `ArenaError::Unwritable` for a leaf read from a tree, or one with a layout
/// fact its cell and its site cannot hold; else what the arena refuses.
pub fn leaf_cell<T: Clone + HeapBytes>(sink: &mut RecordSink<'_, T>, kind: KindId, text: &str, layout: Option<&NodeLayout<T>>) -> Result<CellWord, ArenaError> {
    let (changed, trivia) = match layout {
        None => (ChangedEdges::default(), None),
        Some(layout) if layout.at.is_some() => return Err(ArenaError::Unwritable("a node read from a tree in a built record")),
        Some(layout) if bare_leaf(layout) => (layout.changed, layout.trivia.clone()),
        Some(_) => return Err(ArenaError::Unwritable("a built leaf's layout past its trivia and changed edges")),
    };
    let at = sink.writer.entry(kind, text)?;
    sink.leaf = trivia;
    CellWord::of(at, changed)
}

/// Writes a node's record and answers the cell its holder names it by: its
/// header, then the cells `cells` writes into its `words` words, its built
/// width, which also adds the node's print settings to its side record.
/// `slot_word` gives a slot's stamped word by its wire key. A record written
/// as a child is held by its holder's cell; a root, by the cell answered.
///
/// The edges whose neighbour a holder changed are a fact of the holder's
/// site: a record written as a child leaves them out of its side record and
/// the answered cell holds them; a record written as a root, with no holder,
/// keeps them in its side record. The node's trivia and its units' move into
/// the store of written sides, keyed by its record.
///
/// # Errors
///
/// `ArenaError::Unwritable` for a node read from a tree;
/// `ArenaError::UnknownSlot` for a layout entry naming a slot with no
/// stamped word; else what `cells` or the arena refuses.
pub fn write_record<T: Clone + HeapBytes>(
    sink: &mut RecordSink<'_, T>,
    kind: KindId,
    words: u32,
    layout: Option<&NodeLayout<T>>,
    slot_word: impl Fn(&str) -> Option<u32>,
    cells: impl FnOnce(&mut RecordSink<'_, T>, &mut [u32], &mut SideRecord) -> Result<(), ArenaError>,
) -> Result<CellWord, ArenaError> {
    if words < HEADER_WORDS {
        return Err(ArenaError::Malformed { what: "record width", word: words });
    }
    if layout.is_some_and(|layout| layout.at.is_some()) {
        return Err(ArenaError::Unwritable("a node read from a tree in a built record"));
    }
    let mut side = SideRecord::of(layout, &slot_word)?;
    let site_changed = if sink.nested { std::mem::take(&mut side.changed) } else { ChangedEdges::default() };
    let units = layout
        .map_or(&[][..], |layout| layout.units.as_slice())
        .iter()
        .map(|unit| slot_word(&unit.slot).map(|word| (word, unit)).ok_or_else(|| ArenaError::UnknownSlot(unit.slot.as_str().into())))
        .collect::<Result<Vec<_>, _>>()?;
    let mut record = vec![0; words as usize];
    record[0] = sink.writer.header(kind, 0)?;
    let nested = std::mem::replace(&mut sink.nested, true);
    let outer_leaves = std::mem::take(&mut sink.leaves);
    let written = cells(sink, &mut record, &mut side);
    let leaves = std::mem::replace(&mut sink.leaves, outer_leaves);
    sink.nested = nested;
    written?;
    let leaves = leaves
        .into_iter()
        .map(|(slot, item, trivia)| slot_word(&slot).map(|word| (word, item, trivia)).ok_or_else(|| ArenaError::UnknownSlot(slot.into_boxed_str())))
        .collect::<Result<Vec<_>, _>>()?;
    if !side.is_empty() {
        record[1] = side.write(&mut |words| sink.writer.place(words, 1))?.0;
    }
    let at = sink.writer.record(&record, !nested)?;
    sink.keep_sides(at, layout.and_then(|layout| layout.trivia.as_ref()), &units, &leaves)?;
    CellWord::of(at, site_changed)
}

/// Writes the cell of the value a single slot holds, the slot `slot` of the
/// node whose layout is `layout` (`keep_leaf_site`).
///
/// # Errors
///
/// What the value's `write_cell` refuses.
pub fn write_slot<T: Clone + HeapBytes, C: WriteCell<T>>(sink: &mut RecordSink<'_, T>, value: &C, slot: &str) -> Result<CellWord, ArenaError> {
    let cell = value.write_cell(sink)?;
    keep_leaf_site(sink, slot, ItemIndex(0));
    Ok(cell)
}

/// Writes the list slot `slot`'s items as a run of one-word cells, after the
/// entries they need, and answers the list's cell (`keep_leaf_site`).
///
/// # Errors
///
/// What an item's `write_cell` or the arena refuses.
pub fn write_list<'i, T: Clone + HeapBytes, C: WriteCell<T> + 'i>(sink: &mut RecordSink<'_, T>, items: impl IntoIterator<Item = &'i C>, slot: &str) -> Result<CellWord, ArenaError> {
    let cells = items
        .into_iter()
        .enumerate()
        .map(|(item, value)| {
            let cell = value.write_cell(sink)?;
            keep_leaf_site(sink, slot, ItemIndex(u32::try_from(item).map_err(|_| ArenaError::Full)?));
            Ok(cell.0)
        })
        .collect::<Result<Vec<_>, ArenaError>>()?;
    let bits = sink.writer.kind_bits();
    for (item, &cell) in (crate::types::NodeName::SITE_ITEMS..).zip(cells.get(crate::types::NodeName::SITE_ITEMS as usize..).unwrap_or_default()) {
        if matches!(Cell::decode_built(CellWord(cell), &sink.writer, bits)?, Cell::BuiltLeaf { .. }) {
            return Err(ArenaError::LeafItemPastNames { item });
        }
    }
    sink.writer.run(&cells)
}

/// Keeps the trivia of the built leaf just written, the value at `item` of
/// the slot `slot`, for its holder to keep at this site.
fn keep_leaf_site<T: Clone + HeapBytes>(sink: &mut RecordSink<'_, T>, slot: &str, item: ItemIndex) {
    if let Some(trivia) = sink.leaf.take() {
        sink.leaves.push((slot.to_owned(), item, trivia));
    }
}

/// A captured interior string's cell: an entry of the blank kind.
///
/// # Errors
///
/// What the arena refuses.
pub fn captured_cell<T: Clone + HeapBytes>(sink: &mut RecordSink<'_, T>, text: &str) -> Result<CellWord, ArenaError> {
    CellWord::of(sink.writer.entry(KindId::BLANK, text)?, ChangedEdges::default())
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
            at: None,
            edges: layout.edges,
            span: layout.span,
            sides: layout.sides.as_ref().map(|from| from.name().map_or(Sides { tree: from.tree, index: from.index, end: from.end, span: from.span }, |name| Sides::named(name, from.span))),
            changed: layout.changed,
            separator: layout.separator,
            delimiter: None,
            separator_kind: None,
            flanks: layout.flanks,
            slots,
            ..SideRecord::default()
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
    use crate::arena::{ArenaRead, Cell, ListCell};
    use crate::layout::SlotLayout;
    use crate::options::{EdgeArm, Edges};
    use crate::trivia::{TriviaEntry, TriviaText};
    use crate::types::{NodeIndex, Span, TreeId};

    fn coordinate(index: u32, end: u32) -> NodeCoordinate {
        NodeCoordinate { tree: TreeId(3), index: NodeIndex(index), end: NodeIndex(end), span: Span { start: 4, end: 9 }, kind: Some(KindId(5)), edges: None, carried: None }
    }

    fn layout() -> NodeLayout<TriviaText> {
        NodeLayout {
            trivia: None,
            edges: Some(Edges { before: Some(EdgeArm { arm: KindId(2), strength: None }), after: None }),
            at: Some(coordinate(6, 11)),
            span: None,
            flanks: crate::layout_kinds::Flanks::default(),
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
        assert_eq!(record.at, None);
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
    const BITS: u32 = 9;

    type Layout = Option<Box<NodeLayout<TriviaText>>>;

    fn chunks() -> BuiltChunks {
        BuiltChunks::new(BITS, |_| None)
    }

    fn decode(chunks: &BuiltChunks, cell: CellWord) -> Cell {
        Cell::decode_built(cell, chunks, BITS).expect("a cell the writer writes")
    }

    /// A leaf, written as the derive writes a text node's cell.
    struct Name {
        layout: Layout,
        text: String,
    }

    impl WriteCell<TriviaText> for Name {
        fn write_cell(&self, sink: &mut RecordSink<'_, TriviaText>) -> Result<CellWord, ArenaError> {
            leaf_cell(sink, NAME, &self.text, self.layout.as_deref())
        }
    }

    /// A node with a presence bit at word 2 bit 0, a child slot at parsed
    /// word 3 built at word 3, a list slot at parsed word 6 built at word 4,
    /// and a spacing setting of the list, written as the derive writes a
    /// struct's record.
    struct Pair {
        layout: Layout,
        open: bool,
        left: SlotValue<Name>,
        items: Vec<SlotValue<Name>>,
        items_space: Option<KindId>,
    }

    impl WriteCell<TriviaText> for Pair {
        fn write_cell(&self, sink: &mut RecordSink<'_, TriviaText>) -> Result<CellWord, ArenaError> {
            let slot_word = |key: &str| match key {
                "_left" => Some(3),
                "_items" => Some(6),
                _ => None,
            };
            write_record(sink, PAIR, 5, self.layout.as_deref(), slot_word, |sink, words, side| {
                words[2] |= u32::from(self.open);
                words[3] = write_slot(sink, &self.left, "_left")?.0;
                words[4] = write_list(sink, &self.items, "_items")?.0;
                if let Some(space) = self.items_space {
                    side.slot_mut(6).space_after = Some(space);
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
        TriviaEntry::new(SlotValue::Node(TriviaText { kind: KindId(1), text: text.to_owned(), span: None, before: None, after: None, bytes: None }))
    }

    /// A pair's record: its header's kind and side record, its presence word,
    /// its child cell and its list's item cells.
    fn pair_record(chunks: &BuiltChunks, cell: CellWord) -> (KindId, SideRecord, u32, Cell, Vec<Cell>) {
        let held = decode(chunks, cell);
        let Cell::Child { at, .. } = held else { panic!("a pair is a child cell, not {held:?}") };
        let words = chunks.words(at, 5).expect("its words").to_vec();
        let side = if words[1] == 0 { SideRecord::default() } else { SideRecord::read(chunks, Address(words[1])).expect("its side record") };
        let items = ListCell::of_word(CellWord(words[4]), chunks).expect("a list").items(chunks, 1).expect("its run").map(|item| decode(chunks, CellWord(item[0]))).collect();
        (chunks.header_kind(at, BITS).expect("a kind"), side, words[2], decode(chunks, CellWord(words[3])), items)
    }

    fn unlinked(_: &NodeCoordinate) -> Result<Linked, ArenaError> {
        panic!("no coordinate is linked here")
    }

    #[test]
    fn a_built_sink_writes_a_child_as_a_child_cell_with_its_sides() {
        let trivia = Some(NodeTrivia { leading: Some(vec![entry("// child")]), trailing: None, inner: None });
        let child = pair(Some(Box::new(NodeLayout { trivia, ..NodeLayout::default() })), name("a", None), Vec::new());
        let (mut chunks, store) = (chunks(), TriviaStore::with_kind_bits(BITS));
        let cell = write_record(&mut RecordSink::built(&mut chunks, &store, &mut unlinked), KindId(7), 3, None, |_| Some(2), |sink, words, _| {
            words[2] = write_slot(sink, &child, "_child")?.0;
            Ok(())
        })
        .expect("a parent");
        let Cell::Child { at, .. } = decode(&chunks, cell) else { panic!("a parent") };
        let held = decode(&chunks, CellWord(chunks.words(at, 3).expect("its words")[2]));
        let Cell::Child { at: child, .. } = held else { panic!("a child cell, not {held:?}") };
        assert!(child < at, "the child is its own record, written before its holder");
        assert_eq!(store.side(Place::record(child), TriviaSide::Leading, &chunks).expect("read"), Some(vec![entry("// child")]));
    }

    /// An envelope: its content built at word 2, read from the same row.
    struct Envelope {
        layout: Layout,
        content: SlotValue<Pair>,
    }

    impl WriteCell<TriviaText> for Envelope {
        fn write_cell(&self, sink: &mut RecordSink<'_, TriviaText>) -> Result<CellWord, ArenaError> {
            write_record(sink, KindId(8), 3, self.layout.as_deref(), |_| None, |sink, words, _| {
                words[2] = self.content.write_cell(sink)?.0;
                Ok(())
            })
        }
    }

    #[test]
    fn a_built_write_moves_its_trivia_and_units_into_the_store() {
        let (mut chunks, store) = (chunks(), TriviaStore::with_kind_bits(BITS));
        let trivia = Some(NodeTrivia { leading: Some(vec![entry("// a")]), trailing: None, inner: None });
        let unit = UnitSides { slot: "_items".to_owned(), item: ItemIndex(1), trivia: NodeTrivia { leading: None, trailing: Some(Vec::new()), inner: None } };
        let layout = Some(Box::new(NodeLayout { trivia, units: vec![unit], ..NodeLayout::default() }));
        let leaf = Some(Box::new(NodeLayout { trivia: Some(NodeTrivia { leading: None, trailing: Some(vec![entry("// x")]), inner: None }), ..NodeLayout::default() }));
        let node = Pair { items_space: Some(KindId(2)), ..pair(layout, name("x", leaf), Vec::new()) };
        let cell = node.write_cell(&mut RecordSink::built(&mut chunks, &store, &mut unlinked)).expect("written");
        let Cell::Child { at: record, .. } = decode(&chunks, cell) else { panic!("a record") };
        assert_eq!(store.side(Place::record(record), TriviaSide::Leading, &chunks).expect("read"), Some(vec![entry("// a")]));
        assert_eq!(store.side(Place::record(record), TriviaSide::Trailing, &chunks).expect("read"), None, "a side no write set stays unwritten");
        assert_eq!(store.side(Place::site(Site { holder: record, word: 6, item: ItemIndex(1) }), TriviaSide::Trailing, &chunks).expect("read"), Some(Vec::new()));
        let (kind, side, open, left, items) = pair_record(&chunks, cell);
        assert_eq!((kind, open), (PAIR, 1));
        assert_eq!(side.slots, vec![SideSlot { word: 6, space_after: Some(KindId(2)), ..SideSlot::default() }], "the setting is in its slot's entry");
        let Cell::BuiltLeaf { kind: NAME, text, .. } = left else { panic!("a built leaf, not {left:?}") };
        assert_eq!(chunks.text(text), Ok("x"));
        assert_eq!(store.side(Place::site(Site { holder: record, word: 3, item: ItemIndex(0) }), TriviaSide::Trailing, &chunks).expect("read"), Some(vec![entry("// x")]), "a leaf has no record: its sides are kept at its site");
        assert_eq!(items, Vec::<Cell>::new());
    }

    #[test]
    fn a_kept_side_takes_the_room_of_its_entries() {
        let (mut chunks, store) = (chunks(), TriviaStore::with_kind_bits(BITS));
        let kept = RecordSink::built(&mut chunks, &store, &mut unlinked).kept(&[entry("// a")]).expect("kept");
        assert_eq!(kept.capacity(), 1);
    }

    #[test]
    fn a_built_unit_of_an_unstamped_slot_is_refused_before_any_side_is_kept() {
        let (mut chunks, store) = (chunks(), TriviaStore::with_kind_bits(BITS));
        let trivia = Some(NodeTrivia { leading: Some(vec![entry("// a")]), trailing: None, inner: None });
        let unit = UnitSides { slot: "_gone".to_owned(), item: ItemIndex(0), trivia: NodeTrivia::default() };
        let node = pair(Some(Box::new(NodeLayout { trivia, units: vec![unit], ..NodeLayout::default() })), name("x", None), Vec::new());
        assert_eq!(node.write_cell(&mut RecordSink::built(&mut chunks, &store, &mut unlinked)), Err(ArenaError::UnknownSlot("_gone".into())));
        assert_eq!(store.len(), 0);
    }

    #[test]
    fn a_built_record_links_a_node_named_by_its_site_and_refuses_a_node_of_a_tree() {
        let (mut chunks, store) = (chunks(), TriviaStore::with_kind_bits(BITS));
        let of_tree = Address::new(0, 1).expect("an address");
        let mut link = |coord: &NodeCoordinate| Ok(if coord.index == NodeIndex(5) { Linked::Record(of_tree) } else { Linked::Leaf("y".to_owned()) });
        let changed = ChangedEdges { leading: true, trailing: false };
        let moved = |index| at(index, index + 1).with_changed(changed);
        let name = crate::types::NodeName { node: crate::types::NodeId(4_000), site: Some([3, 2]) };
        let node = pair(None, SlotValue::Coord(moved(7).named(Some(name))), Vec::new());
        let cell = node.write_cell(&mut RecordSink::built(&mut chunks, &store, &mut link)).expect("written");
        let (_, _, _, left, _) = pair_record(&chunks, cell);
        assert!(matches!(left, Cell::ReadLeaf { kind: NAME, name: linked, changed: edges, .. } if linked == name && edges == changed), "{left:?}");
        for refused in [pair(None, SlotValue::Coord(moved(5)), Vec::new()), pair(None, SlotValue::Coord(moved(7).named(Some(name))), vec![SlotValue::Coord(moved(6))])] {
            assert!(matches!(refused.write_cell(&mut RecordSink::built(&mut chunks, &store, &mut link)), Err(ArenaError::Unwritable(_))));
        }
    }

    #[test]
    fn a_child_s_changed_edges_are_its_holder_s_cell_s_and_a_root_keeps_its_own() {
        let (mut chunks, store) = (chunks(), TriviaStore::with_kind_bits(BITS));
        let changed = |leading, trailing| ChangedEdges { leading, trailing };
        let moved = |edges| Some(Box::new(NodeLayout { changed: edges, ..NodeLayout::default() }));
        let content = pair(moved(changed(true, false)), name("x", moved(changed(false, true))), Vec::new());
        let envelope = Envelope { layout: moved(changed(true, true)), content: SlotValue::Node(content) };
        let root = envelope.write_cell(&mut RecordSink::built(&mut chunks, &store, &mut unlinked)).expect("written");
        let Cell::Child { at, changed: held, .. } = decode(&chunks, root) else { panic!("a record") };
        assert_eq!(held, ChangedEdges::default(), "a root has no holder's cell to hold them");
        let words = chunks.words(at, 3).expect("its words").to_vec();
        assert_eq!(SideRecord::read(&chunks, Address(words[1])).expect("its side record").changed, changed(true, true), "a root keeps its own");
        let inner = CellWord(words[2]);
        let Cell::Child { changed: held, .. } = decode(&chunks, inner) else { panic!("a record") };
        assert_eq!(held, changed(true, false), "a child's are its holder's cell's");
        let (_, side, _, left, _) = pair_record(&chunks, inner);
        assert_eq!(side.changed, ChangedEdges::default(), "and never its own record's");
        let Cell::BuiltLeaf { changed: held, .. } = left else { panic!("a built leaf, not {left:?}") };
        assert_eq!(held, changed(false, true), "a leaf's are its holder's cell's too");
    }

    #[test]
    fn a_built_leaf_keeps_no_snapshot_span_and_refuses_its_edges() {
        let span = crate::points::PointSpan { start: crate::points::Point::ZERO, end: crate::points::Point { row: 0, column: 1 } };
        let (mut chunks, store) = (chunks(), TriviaStore::with_kind_bits(BITS));
        let snapshot = Some(Box::new(NodeLayout { span: Some(span), ..NodeLayout::default() }));
        let cell = pair(None, name("x", snapshot), Vec::new()).write_cell(&mut RecordSink::built(&mut chunks, &store, &mut unlinked)).expect("written");
        let (_, _, _, left, _) = pair_record(&chunks, cell);
        assert!(matches!(left, Cell::BuiltLeaf { kind: NAME, changed, .. } if changed == ChangedEdges::default()), "{left:?}");
        let edged = Some(Box::new(NodeLayout { edges: Some(Edges::default()), ..NodeLayout::default() }));
        let refused = pair(None, name("x", edged), Vec::new()).write_cell(&mut RecordSink::built(&mut chunks, &store, &mut unlinked));
        assert_eq!(refused, Err(ArenaError::Unwritable("a built leaf's layout past its trivia and changed edges")));
    }

    #[test]
    fn a_built_write_refuses_a_node_read_from_a_tree() {
        let (mut chunks, store) = (chunks(), TriviaStore::with_kind_bits(BITS));
        let node = pair(Some(read_at(1, 2)), name("x", None), Vec::new());
        assert_eq!(node.write_cell(&mut RecordSink::built(&mut chunks, &store, &mut unlinked)), Err(ArenaError::Unwritable("a node read from a tree in a built record")));
    }

    #[test]
    fn verbatim_text_is_a_captured_string_and_an_error_keeps_its_kind() {
        let (mut chunks, store) = (chunks(), TriviaStore::<TriviaText>::new());
        let mut link = unlinked;
        let (bare, error) = {
            let mut sink = RecordSink::built(&mut chunks, &store, &mut link);
            let bare = VerbatimNode { text: "a b".to_owned(), kind: KindId::BLANK }.write_cell(&mut sink).expect("written");
            (bare, VerbatimNode { text: "@@".to_owned(), kind: KindId::ERROR }.write_cell(&mut sink).expect("written"))
        };
        let Cell::BuiltText { text } = decode(&chunks, bare) else { panic!("captured text") };
        assert_eq!(chunks.text(text), Ok("a b"));
        let Cell::BuiltLeaf { kind: KindId::ERROR, text, changed } = decode(&chunks, error) else { panic!("an ERROR leaf") };
        assert_eq!((chunks.text(text), changed), (Ok("@@"), ChangedEdges::default()));
    }

    #[test]
    fn a_built_list_is_refused_at_a_leaf_past_the_items_a_node_name_gives_and_takes_text_there() {
        let (mut chunks, store) = (chunks(), TriviaStore::<TriviaText>::new());
        let limit = crate::types::NodeName::SITE_ITEMS;
        let mut items: Vec<SlotValue<Name>> = (0..limit).map(|_| name("a", None)).collect();
        let list = write_list(&mut RecordSink::built(&mut chunks, &store, &mut unlinked), &items, "_items").expect("its last item is named");
        assert_eq!(ListCell::of_word(list, &chunks).expect("a list").items(&chunks, 1).expect("its run").count(), limit as usize);
        let text: Vec<VerbatimNode> = (0..=limit).map(|_| VerbatimNode { text: "a".to_owned(), kind: KindId::BLANK }).collect();
        assert!(write_list(&mut RecordSink::built(&mut chunks, &store, &mut unlinked), &text, "_items").is_ok(), "text has no node name");
        items.push(name("a", None));
        assert_eq!(write_list(&mut RecordSink::built(&mut chunks, &store, &mut unlinked), &items, "_items"), Err(ArenaError::LeafItemPastNames { item: limit }));
    }

    #[test]
    fn an_empty_list_has_no_run() {
        let (mut chunks, store) = (chunks(), TriviaStore::<TriviaText>::new());
        let none: [SlotValue<Name>; 0] = [];
        let list = write_list(&mut RecordSink::built(&mut chunks, &store, &mut unlinked), &none, "_items").expect("written");
        assert_eq!(list, CellWord(0));
        assert_eq!(ListCell::of_word(list, &chunks), Ok(ListCell::EMPTY));
    }
}
