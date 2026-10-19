//! What a record's view reads through, and the slot and list views a node's
//! view hands out for its cells. A view renders after prepare, through shared
//! borrows of the arenas, the trees, the store of written sides and the
//! prepared overlay; every word it reads is bounds-checked, and a cell no
//! writer writes renders as a record refusal (`RenderError::Record`).

use super::{Address, Arena, ArenaError, Cell, ListCell, Prepared, StringRef, TreeArena};
use crate::render::{Render, RenderError, RenderResult, RenderSink, SourceTable};
use crate::slot::NodeCoordinate;
use crate::trivia_store::{Place, Site, TriviaStore};
use crate::types::{ItemIndex, KindId, NodeIndex, Span, TreeId};
use crate::view::{KindOf, KindTest, Slot};

/// The parsed trees' arenas a render reaches: the arena and row index of each
/// tree a record names.
pub trait RecordArenas {
    fn tree(&self, tree: TreeId) -> Option<&TreeArena>;
}

/// What a record's view reads through: the arena its record is in and, for
/// a parsed arena, its tree; the trees' arenas its links reach; the render's
/// trees, its store of written sides and its prepared overlay.
pub struct RecordCtx<'a, T> {
    arena: &'a Arena,
    tree: Option<TreeId>,
    arenas: &'a dyn RecordArenas,
    sources: &'a dyn SourceTable,
    store: &'a TriviaStore<T>,
    prepared: &'a Prepared<T>,
}

impl<T> Clone for RecordCtx<'_, T> {
    fn clone(&self) -> Self {
        *self
    }
}

impl<T> Copy for RecordCtx<'_, T> {}

fn malformed(what: &'static str, word: u32) -> ArenaError {
    ArenaError::Malformed { what, word }
}

impl<'a, T> RecordCtx<'a, T> {
    /// The context of the built arena.
    #[must_use]
    pub fn built(arena: &'a Arena, arenas: &'a dyn RecordArenas, sources: &'a dyn SourceTable, store: &'a TriviaStore<T>, prepared: &'a Prepared<T>) -> Self {
        Self { arena, tree: None, arenas, sources, store, prepared }
    }

    /// The context of `tree`'s arena.
    ///
    /// # Errors
    ///
    /// `ArenaError::Malformed` when the render reaches no arena of `tree`.
    pub fn parsed(tree: TreeId, arenas: &'a dyn RecordArenas, sources: &'a dyn SourceTable, store: &'a TriviaStore<T>, prepared: &'a Prepared<T>) -> Result<Self, ArenaError> {
        let arena = arenas.tree(tree).ok_or(malformed("record tree", tree.0))?.arena();
        Ok(Self { arena, tree: Some(tree), arenas, sources, store, prepared })
    }

    /// The context of `tree`'s arena, which a link from this one names.
    ///
    /// # Errors
    ///
    /// `ArenaError::Malformed` when the render reaches no arena of `tree`.
    pub fn linked(self, tree: TreeId) -> Result<Self, ArenaError> {
        Self::parsed(tree, self.arenas, self.sources, self.store, self.prepared)
    }

    #[must_use]
    pub fn arena(self) -> &'a Arena {
        self.arena
    }

    /// The tree of a parsed arena; `None` for the built arena.
    #[must_use]
    pub fn tree(self) -> Option<TreeId> {
        self.tree
    }

    #[must_use]
    pub fn sources(self) -> &'a dyn SourceTable {
        self.sources
    }

    #[must_use]
    pub fn store(self) -> &'a TriviaStore<T> {
        self.store
    }

    #[must_use]
    pub fn prepared(self) -> &'a Prepared<T> {
        self.prepared
    }

    /// The `len` words of the record at `at`.
    ///
    /// # Errors
    ///
    /// `ArenaError::OutOfBounds` for words the arena never wrote.
    pub fn words(self, at: Address, len: u32) -> Result<&'a [u32], ArenaError> {
        self.arena.words(at, len)
    }

    /// The string a built cell names in the string table.
    ///
    /// # Errors
    ///
    /// `ArenaError::BadString` for bytes the table never wrote as a string.
    pub fn string(self, at: StringRef) -> Result<&'a str, ArenaError> {
        self.arena.text(at)
    }

    /// The text a parsed cell's span names in its tree's source.
    ///
    /// # Errors
    ///
    /// `ArenaError::Malformed` for a built arena, a tree the render holds no
    /// source of, or a span that is no character range of it.
    pub fn source_text(self, span: Span) -> Result<&'a str, ArenaError> {
        let tree = self.tree.ok_or(malformed("parsed span in a built record", span.start))?;
        let source: &'a str = self.sources.source_of(tree).ok_or(malformed("record tree", tree.0))?;
        source.get(span.range()).ok_or(malformed("cell span end", span.end))
    }

    /// The text a leaf's or a captured string's cell names.
    ///
    /// # Errors
    ///
    /// `ArenaError::Malformed` for a cell that names no text, else what
    /// reading it refuses.
    pub fn cell_text(self, cell: Cell) -> Result<&'a str, ArenaError> {
        match cell {
            Cell::ParsedLeaf { span, .. } | Cell::ParsedText { span } => self.source_text(span),
            Cell::BuiltLeaf { text, .. } | Cell::BuiltText { text } => self.string(text),
            _ => Err(malformed("text cell", 0)),
        }
    }

    /// The row after a parsed node's subtree, from its tree: its row plus its
    /// descendant count.
    ///
    /// # Errors
    ///
    /// `ArenaError::Malformed` when the render holds no tree of the arena or
    /// the tree has no node at `row`.
    pub fn row_end(self, row: NodeIndex) -> Result<NodeIndex, ArenaError> {
        let tree = self.tree.ok_or(malformed("parsed row in a built record", row.0))?;
        let (live, _) = self.sources.read_ctx(tree).ok_or(malformed("record tree", tree.0))?;
        let node = crate::engine::node_at_index(live, row).ok_or(malformed("record row", row.0))?;
        row.0.checked_add(crate::read::descendant_count(&node)).map(NodeIndex).ok_or(malformed("record row", row.0))
    }

    /// The record of a parsed row its first read wrote.
    #[must_use]
    pub fn row_record(self, row: NodeIndex) -> Option<Address> {
        self.arenas.tree(self.tree?)?.record(row)
    }
}

/// A view built from the cell that names its value in a holder's record.
pub trait RecordView<'a, T>: Sized {
    /// The view of the value `cell` names, at `site` in its holder.
    ///
    /// # Errors
    ///
    /// `ArenaError` for a cell this view's type is never written as, or a
    /// record of it that no writer writes.
    fn from_cell(ctx: RecordCtx<'a, T>, cell: Cell, site: Site<Place>) -> Result<Self, ArenaError>;
}

/// What one slot's cell holds, as its view reads it.
enum SlotCell<V> {
    Absent,
    /// An untouched node of the arena's tree.
    Coordinate { kind: KindId, index: NodeIndex, span: Span },
    View(V),
    Refused(ArenaError),
}

/// One slot position of a record, as a view hands it out: what its cell holds,
/// decoded when it is read. `ADJACENT` is the slot's own, as on `SlotValue`.
pub struct RecordSlot<'a, T, V, const ADJACENT: bool = false> {
    ctx: RecordCtx<'a, T>,
    site: Site<Place>,
    cell: SlotCell<V>,
}

impl<'a, T, V: RecordView<'a, T>, const ADJACENT: bool> RecordSlot<'a, T, V, ADJACENT> {
    /// The slot at `site` whose cell is `words`.
    pub fn of(ctx: RecordCtx<'a, T>, site: Site<Place>, words: &[u32]) -> Self {
        let cell = match Cell::decode(words) {
            Ok(Cell::Absent) => SlotCell::Absent,
            Ok(Cell::Coordinate { kind, index, span }) => SlotCell::Coordinate { kind, index, span },
            Ok(cell) => V::from_cell(ctx, cell, site).map_or_else(SlotCell::Refused, SlotCell::View),
            Err(refused) => SlotCell::Refused(refused),
        };
        Self { ctx, site, cell }
    }

    /// The coordinate a tag-1 cell names, its end row taken from the tree.
    fn coordinate(&self, kind: KindId, index: NodeIndex, span: Span) -> Result<NodeCoordinate, ArenaError> {
        let tree = self.ctx.tree.ok_or(malformed("coordinate in a built record", index.0))?;
        let coord = NodeCoordinate { kind: Some(kind), ..NodeCoordinate::new(tree, index, self.ctx.row_end(index)?, span) };
        Ok(NodeCoordinate { edges: self.ctx.prepared.coordinate_edges(self.site), ..coord })
    }
}

impl<'a, T, V: RecordView<'a, T> + Render, const ADJACENT: bool> Render for RecordSlot<'a, T, V, ADJACENT> {
    /// An untouched node renders as its source, unless a write set a side in
    /// its rows: then it renders through the record its prepare wrote.
    fn render(&self, w: &mut dyn RenderSink) -> RenderResult {
        match &self.cell {
            SlotCell::Absent => Err(RenderError::Record(malformed("required slot cell", 0))),
            SlotCell::View(view) => view.render(w),
            SlotCell::Refused(refused) => Err(RenderError::Record(refused.clone())),
            &SlotCell::Coordinate { kind, index, span } => {
                let coord = self.coordinate(kind, index, span).map_err(RenderError::Record)?;
                if !self.ctx.sources.edited_within(&coord) {
                    return crate::slot::write_coordinate(&coord, ADJACENT, w);
                }
                let at = self.ctx.row_record(index).ok_or(RenderError::Record(malformed("edited coordinate record", index.0)))?;
                V::from_cell(self.ctx, Cell::Child { kind, at, link: None }, self.site).map_err(RenderError::Record)?.render(w)
            }
        }
    }
}

impl<'a, T, V: RecordView<'a, T> + Render, const ADJACENT: bool> Slot for RecordSlot<'a, T, V, ADJACENT> {
    fn write_slot(&self, prefix: &str, suffix: &str, w: &mut dyn RenderSink) -> RenderResult {
        if matches!(self.cell, SlotCell::Absent) {
            return Ok(());
        }
        crate::view::write_literal(prefix, w)?;
        self.render(w)?;
        crate::view::write_literal(suffix, w)
    }

    fn is_present(&self) -> bool {
        !matches!(self.cell, SlotCell::Absent)
    }
}

impl<T, V: KindOf, const ADJACENT: bool> KindTest for RecordSlot<'_, T, V, ADJACENT> {
    fn kind_in(&self, _: &dyn RenderSink, kinds: &[KindId]) -> bool {
        match &self.cell {
            SlotCell::Coordinate { kind, .. } => kinds.contains(kind),
            SlotCell::View(view) => view.kind_in(kinds),
            SlotCell::Absent | SlotCell::Refused(_) => false,
        }
    }
}

/// A list slot of a record, as a view hands it out: its run of item cells,
/// each viewed as a slot when it is read. Its holder's view checked the run
/// lies inside the arena when it was built.
pub struct RecordItems<'a, T, V, const ADJACENT: bool = false> {
    ctx: RecordCtx<'a, T>,
    holder: Place,
    word: u32,
    run: u32,
    list: ListCell,
    view: std::marker::PhantomData<fn() -> V>,
}

impl<T, V, const ADJACENT: bool> Clone for RecordItems<'_, T, V, ADJACENT> {
    fn clone(&self) -> Self {
        *self
    }
}

impl<T, V, const ADJACENT: bool> Copy for RecordItems<'_, T, V, ADJACENT> {}

impl<'a, T, V, const ADJACENT: bool> RecordItems<'a, T, V, ADJACENT> {
    /// The list of `holder`'s slot at `word`, whose cell is `words` and
    /// whose items take `run` words each.
    ///
    /// # Errors
    ///
    /// What decoding the list's cell or reaching its run refuses.
    pub fn of(ctx: RecordCtx<'a, T>, holder: Place, word: u32, run: u32, words: &[u32]) -> Result<Self, ArenaError> {
        let list = ListCell::decode(words)?;
        let _run = list.items(ctx.arena, run)?;
        Ok(Self { ctx, holder, word, run, list, view: std::marker::PhantomData })
    }
}

impl<'a, T, V: RecordView<'a, T> + Render, const ADJACENT: bool> crate::view::SlotItems for RecordItems<'a, T, V, ADJACENT> {
    type Item = RecordSlot<'a, T, V, ADJACENT>;

    fn count(&self) -> usize {
        self.list.len as usize
    }

    fn item(&self, index: usize) -> Option<Self::Item> {
        let item = u32::try_from(index).ok().filter(|&item| item < self.list.len)?;
        let at = self.list.run.offset(item.checked_mul(self.run)?)?;
        let site = Site { holder: self.holder, word: self.word, item: ItemIndex(item) };
        Some(match self.ctx.arena.words(at, self.run) {
            Ok(words) => RecordSlot::of(self.ctx, site, words),
            Err(refused) => RecordSlot { ctx: self.ctx, site, cell: SlotCell::Refused(refused) },
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::render::{render_to_string, WhitespaceTable};
    use crate::spacing::WordMatcher;
    use crate::trivia::TriviaText;
    use crate::view::SlotItems;
    use std::collections::HashMap;
    use std::sync::Arc;

    const WORD: KindId = KindId(7);

    /// A leaf's view, as the derive writes one: its text, from any text cell.
    #[derive(Clone, Copy)]
    struct Word<'a>(&'a str);

    impl<'a, T> RecordView<'a, T> for Word<'a> {
        fn from_cell(ctx: RecordCtx<'a, T>, cell: Cell, _: Site<Place>) -> Result<Self, ArenaError> {
            ctx.cell_text(cell).map(Word)
        }
    }

    impl Render for Word<'_> {
        fn render(&self, w: &mut dyn RenderSink) -> RenderResult {
            w.text(self.0)
        }
    }

    impl KindOf for Word<'_> {
        fn kind_in(&self, kinds: &[KindId]) -> bool {
            kinds.contains(&WORD)
        }
    }

    struct NoTrees;
    impl RecordArenas for NoTrees {
        fn tree(&self, _: TreeId) -> Option<&TreeArena> {
            None
        }
    }

    struct Sources(HashMap<TreeId, Arc<str>>);
    impl SourceTable for Sources {
        fn source_of(&self, tree: TreeId) -> Option<&Arc<str>> {
            self.0.get(&tree)
        }
    }

    fn text_of(_: KindId) -> &'static str {
        ""
    }
    const TABLE: WhitespaceTable = WhitespaceTable { text_of, indent: KindId(0), dedent: KindId(0), leaf_edges: &[], gaps: &[] };

    fn rendered(value: &dyn Render) -> Result<String, RenderError> {
        render_to_string(value, WordMatcher::default_ident(), &TABLE, "    ")
    }

    fn site(item: u32) -> Site<Place> {
        Site { holder: Place::Record(Address(1)), word: 2, item: ItemIndex(item) }
    }

    fn cell(cell: Cell) -> [u32; 5] {
        let mut words = [0; 5];
        cell.encode(&mut words).expect("it fits");
        words
    }

    struct Fixture {
        arena: Arena,
        sources: Sources,
        store: TriviaStore<TriviaText>,
        prepared: Prepared<TriviaText>,
    }

    impl Fixture {
        fn new() -> Self {
            Self { arena: Arena::new(), sources: Sources(HashMap::new()), store: TriviaStore::new(), prepared: Prepared::new() }
        }

        fn ctx(&self) -> RecordCtx<'_, TriviaText> {
            RecordCtx::built(&self.arena, &NoTrees, &self.sources, &self.store, &self.prepared)
        }
    }

    type WordSlot<'a> = RecordSlot<'a, TriviaText, Word<'a>>;

    #[test]
    fn a_slot_renders_its_cell_s_view_and_an_absent_one_writes_nothing() {
        let mut fixture = Fixture::new();
        let text = fixture.arena.intern("name").expect("room");
        let ctx = fixture.ctx();
        let present = WordSlot::of(ctx, site(0), &cell(Cell::BuiltText { text }));
        assert!(present.is_present());
        assert_eq!(rendered(&present).expect("rendered"), "name");
        let absent = WordSlot::of(ctx, site(0), &cell(Cell::Absent));
        assert!(!absent.is_present());
        let mut out = String::new();
        let mut w = crate::spacing::SpacingWriter::new(&mut out, WordMatcher::default_ident()).with_table(&TABLE);
        assert!(present.kind_in(&w, &[WORD]));
        assert!(!absent.kind_in(&w, &[WORD]));
        absent.write_slot("(", ")", &mut w).expect("nothing to write");
        w.finish().expect("finished");
        assert_eq!(out, "");
    }

    #[test]
    fn a_cell_no_writer_writes_and_a_required_slot_read_absent_refuse_to_render() {
        let fixture = Fixture::new();
        let ctx = fixture.ctx();
        let refused = WordSlot::of(ctx, site(0), &[99, 0, 0, 0, 0]);
        assert!(matches!(rendered(&refused), Err(RenderError::Record(ArenaError::Malformed { what: "cell tag", word: 99 }))));
        let absent = WordSlot::of(ctx, site(0), &cell(Cell::Absent));
        assert!(matches!(rendered(&absent), Err(RenderError::Record(ArenaError::Malformed { what: "required slot cell", .. }))));
        let coordinate = WordSlot::of(ctx, site(0), &cell(Cell::Coordinate { kind: WORD, index: NodeIndex(3), span: Span { start: 0, end: 1 } }));
        assert!(matches!(rendered(&coordinate), Err(RenderError::Record(ArenaError::Malformed { what: "coordinate in a built record", .. }))), "a built record names a parsed node by a link, never by its row");
    }

    #[test]
    fn a_list_hands_out_each_item_s_slot_at_its_site() {
        let mut fixture = Fixture::new();
        let cells = ["a", "b"].map(|text| Cell::BuiltText { text: fixture.arena.intern(text).expect("room") });
        let list = ListCell::write(&mut fixture.arena, 5, &cells).expect("written");
        let mut words = [0; 2];
        list.encode(&mut words).expect("it fits");
        let items = RecordItems::<TriviaText, Word<'_>>::of(fixture.ctx(), Place::Record(Address(1)), 2, 5, &words).expect("a list");
        assert_eq!(items.count(), 2);
        assert_eq!(rendered(&items.item(1).expect("an item")).expect("rendered"), "b");
        assert_eq!(items.item(1).expect("an item").site, site(1));
        assert!(items.item(2).is_none());
    }

    #[test]
    fn a_list_whose_run_the_arena_never_wrote_is_refused_with_its_holder() {
        let fixture = Fixture::new();
        let words = [Address::new(3, 0).expect("in range").0, 2];
        assert!(matches!(RecordItems::<TriviaText, Word<'_>>::of(fixture.ctx(), Place::Record(Address(1)), 2, 5, &words), Err(ArenaError::OutOfBounds { .. })));
    }

    #[test]
    fn a_parsed_span_reads_its_tree_s_source_and_a_built_arena_has_none() {
        let mut fixture = Fixture::new();
        fixture.sources.0.insert(TreeId(4), Arc::from("let x = 1;"));
        let ctx = fixture.ctx();
        assert!(matches!(ctx.source_text(Span { start: 4, end: 5 }), Err(ArenaError::Malformed { what: "parsed span in a built record", .. })));
        let parsed = RecordCtx { tree: Some(TreeId(4)), ..ctx };
        assert_eq!(parsed.cell_text(Cell::ParsedLeaf { kind: WORD, span: Span { start: 4, end: 5 }, row: NodeIndex(2) }), Ok("x"));
        assert!(matches!(parsed.source_text(Span { start: 4, end: 40 }), Err(ArenaError::Malformed { what: "cell span end", .. })));
    }
}
