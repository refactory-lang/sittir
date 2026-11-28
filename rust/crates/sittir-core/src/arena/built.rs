//! A built record's render entry point. Its words were written outside the
//! native writer, so they are admitted as they cross in (`admit`), and the
//! parsed trees its cells link are held for the render.


use super::{admit, Address, ArenaError, ArenaRead, Cell, CellAt, CellWord, RecordGrammar};
use crate::engine::{Backing, Engine, ReadSources};
use crate::prepare::RenderContext;
use crate::render::{RenderError, RenderResult, RenderSink};
use crate::slot::ChangedEdges;
use crate::trivia::{BuiltEntry, TriviaEntry};
use crate::trivia_store::TriviaStore;
use crate::trivia_table::TriviaSide;
use crate::types::{KindId, NodeIndex};

impl<G: RecordGrammar> Engine<G> {
    /// Replace `side` of the node a read left that `name` names with
    /// `entries`, which its render then writes: an entry of its read's list
    /// of replaced ranges, at the offset where the side's bytes start. A
    /// leading or inner side starts where the first record its parse
    /// placed there starts, else where the node starts, and a trailing side
    /// where the node ends. A unit kept as its kind alone has no row to
    /// give its bytes, so a parse finds them (`unit_span`).
    ///
    /// # Errors
    ///
    /// `ArenaError::Malformed` for a name whose record is address 0 or names
    /// no source, `ArenaError::NotEmpty` for an inner side of a node that is
    /// not empty (`engine::refuses_inner`), and what finding a unit's bytes
    /// refuses.
    pub fn write_read_side(&self, name: crate::types::NodeId, side: TriviaSide, entries: &[TriviaEntry<G::Trivia>]) -> Result<(), ArenaError> {
        let record = Address(name.address()).record()?;
        let (placed, unit) = {
            let chunks = self.written().built();
            let built = chunks.readable()?;
            super::RunNodes::source_of(built, record)?;
            let site = super::site::node_site(built, G::shape, G::KIND_BITS, name)?;
            (self.written().placed_records(name, side, built)?, matches!(site, super::NodeSite::Unit(_)))
        };
        let spanned = if unit { crate::types::NodeId::record(record.0) } else { name };
        let offset = self
            .read_named(spanned, |tree, index| {
                use crate::nodes::Nodes as _;
                if let Some(kind) = (!unit).then(|| crate::engine::refuses_inner(tree, index, side)).flatten() {
                    return Err(ArenaError::NotEmpty { kind });
                }
                let mut nodes = tree.nodes();
                let node = nodes.kid(index);
                let span = if unit { self.unit_span(crate::engine::Backing::source(tree), node, name)? } else { node.span() };
                Ok::<_, ArenaError>(match (side, placed.first().and_then(|&at| tree.index_named(crate::types::NodeId::record(at.0)))) {
                    (TriviaSide::Trailing, _) => span.end,
                    (TriviaSide::Leading | TriviaSide::Inner, Some(first)) => nodes.kid(first).start,
                    _ => span.start,
                })
            })?
            .ok_or(ArenaError::Malformed { what: "read node", word: record.0 })??;
        self.written().write_read_held_side(name, side, entries, offset)
    }

    /// The bytes of the unit `name` names in `holder`, a node a read left
    /// over `source`. A parse of `source`, made for this call and dropped
    /// when it returns, finds the node with `holder`'s span and kinds, told
    /// from a node sharing its bytes by its kinds; its children are routed
    /// to slots as its read routes them (`Router::Children`), and the unit
    /// is the child the slot at the site's word (`RecordGrammar::slot_key`)
    /// holds at the site's item.
    ///
    /// # Errors
    ///
    /// `ArenaError::Malformed` for a source the parse finds no such node
    /// or unit in, or a kind that routes no children.
    fn unit_span(&self, source: &str, holder: crate::read::Kid, name: crate::types::NodeId) -> Result<crate::types::Span, ArenaError> {
        use crate::nodes::Nodes as _;
        let Some([word, item]) = name.site() else { return Ok(holder.span()) };
        let malformed = |what| ArenaError::Malformed { what, word: name.address() };
        let kind = self.written().built().readable()?.header_kind(Address(name.address()), G::KIND_BITS)?;
        let key = G::slot_key(kind, word).ok_or(malformed("unit slot word"))?;
        let Some(crate::read::Router::Children(_, _, routes)) = self.grammar().router(holder.grammar, holder.display) else { return Err(malformed("unit holder routes")) };
        let mut parser = crate::tree_sitter::Parser::new();
        self.grammar().configure_parser(&mut parser).map_err(|_| malformed("unit parser"))?;
        let tree = parser.parse(source, None).ok_or(malformed("unit parse"))?;
        let work = crate::layout::LayoutWorkCounter::default();
        let mut nodes = crate::nodes::TreeNodes::new(&tree, source, &work);
        let mut at = nodes.kid(NodeIndex::ROOT);
        while (at.span(), at.grammar, at.display) != (holder.span(), holder.grammar, holder.display) {
            at = nodes.kids(at.index).iter().copied().find(|kid| kid.start <= holder.start && holder.end <= kid.end && kid.end > kid.start).ok_or(malformed("unit holder"))?;
        }
        let routed = routes(&mut nodes, &at).ok_or(malformed("unit holder routes"))?;
        routed
            .children
            .iter()
            .zip(&routed.routes)
            .filter(|&(_, route)| matches!(route, crate::read::Route::Slot { slot, .. } if routed.keys.get(slot.index()) == Some(&key)))
            .nth(item as usize)
            .map(|(child, _)| child.span())
            .ok_or(malformed("unit site item"))
    }

    /// What `f` answers of the node a read left a record of at `at`: the
    /// tree over its source's records, made for this call, and the id the
    /// call gives the node. `None` for an address no read wrote.
    ///
    /// # Errors
    ///
    /// What making the tree refuses.
    pub fn read_node<R>(&self, at: Address, f: impl FnOnce(&crate::engine::Records<'_, G>, NodeIndex) -> R) -> Result<Option<R>, ArenaError> {
        self.read_named(crate::types::NodeId::record(at.0), f)
    }

    /// What `f` answers of the node a read left that `name` names: the tree
    /// over its source's records, made for this call, and the id the call
    /// gives the node. `None` for a name whose record no read wrote.
    ///
    /// # Errors
    ///
    /// What making the tree refuses, and `ArenaError::Malformed` for a name
    /// its source's records hold no node of.
    pub fn read_named<R>(&self, name: crate::types::NodeId, f: impl FnOnce(&crate::engine::Records<'_, G>, NodeIndex) -> R) -> Result<Option<R>, ArenaError> {
        let built = self.written().built();
        built.readable()?;
        let record = Address(name.address());
        if !built.read_record(record) {
            return Ok(None);
        }
        let tree = crate::engine::Records::over(self, &built, record)?;
        let index = tree.index_named(name).ok_or(ArenaError::Malformed { what: "node name", word: record.0 })?;
        Ok(Some(f(&tree, index)))
    }
}

impl<G: RecordGrammar> Engine<G> {
    /// One batch of the walk `ParsedTree::descendants` makes under the node
    /// `from` names among the records reads left in the engine's built
    /// arena, each node it finds and its start named past the call.
    ///
    /// # Errors
    ///
    /// A name no read's record holds, and what the walk refuses.
    pub fn descendants_of(
        &self,
        from: crate::query::NamedAddress,
        kinds: &[KindId],
        plan: Option<&crate::query::Plan>,
        resume: Option<&[crate::types::ChildPosition]>,
        limit: u32,
        depth: Option<u32>,
    ) -> Result<crate::query::NamedBatch, String> {
        use crate::query::{NamedBatch, NamedCoordinate, NamedItem};
        let built = self.written().built();
        built.readable().map_err(|e| e.to_string())?;
        let tree = crate::engine::Records::over(self, &built, Address(from.name().address())).map_err(|e| e.to_string())?;
        let mut nodes = crate::engine::Backing::nodes(&tree);
        let index = tree.address_index(&mut nodes, from)?;
        let (found, resume) = crate::engine::Backing::descendants_under(&tree, &mut nodes, index, kinds, plan, resume, limit, depth)?;
        let named = |index: NodeIndex| tree.name_at(index).ok_or_else(|| format!("the walk found node {}, which its records do not name", index.0));
        let ctx = crate::engine::Backing::read_ctx(&tree);
        let items = found
            .into_iter()
            .map(|item| match item {
                crate::engine::Descendant::Node(kid) => Ok(NamedItem::Node(NamedCoordinate { name: named(kid.index)?, span: kid.span(), kind: ctx.stamped_kind(kid.grammar, kid.display) })),
                crate::engine::Descendant::Unit(kind) => Ok(NamedItem::Unit(kind)),
            })
            .collect::<Result<_, String>>()?;
        Ok(NamedBatch { items, resume, origin: named(index)? })
    }

    /// Whether each node `addresses` names among the records reads left in
    /// the engine's built arena, all of one source, satisfies `plan`, in
    /// order (`ParsedTree::plan_holds`).
    ///
    /// # Errors
    ///
    /// A name no read's record holds, and a name of another source than the
    /// first's (`Records::address_index`).
    pub fn plan_holds_of(&self, addresses: &[crate::query::NamedAddress], plan: &crate::query::Plan) -> Result<Vec<bool>, String> {
        let Some(first) = addresses.first() else { return Ok(Vec::new()) };
        let built = self.written().built();
        built.readable().map_err(|e| e.to_string())?;
        let tree = crate::engine::Records::over(self, &built, Address(first.name().address())).map_err(|e| e.to_string())?;
        crate::engine::Backing::plan_holds_over(&tree, addresses, |nodes, address| tree.address_index(nodes, address), plan)
    }

    /// The built record at `at`, of the built arena `arena`, rendered as a
    /// render root whose `changed` edges have no neighbour, under `ctx`, its
    /// line endings unspelled. The records it reaches are admitted first;
    /// each parsed tree a cell links is held from `trees` for the render,
    /// and every tree's source and every trivia entry's record are read
    /// through `ctx`'s table.
    ///
    /// # Errors
    ///
    /// `RenderError::Record` for an address naming no record and for words
    /// `admit` refuses, `RenderError::Coordinate` for a linked tree `trees`
    /// does not hold, else what the record's render refuses.
    pub fn render_built(
        &self,
        arena: &dyn ArenaRead,
        at: Address,
        changed: ChangedEdges,
        trees: &ReadSources<'_, G>,
        ctx: &RenderContext<'_>,
    ) -> Result<String, RenderError> {
        let root = admitted_root::<G>(arena, at, changed, trees)?;
        G::render_record(self.grammar(), root, None, arena, self.written(), ctx)
    }
    /// The record at `at` of the engine's built arena `built`, a built one
    /// or one a read left, rendered under `options` as a render root whose
    /// `changed` edges have no neighbour, its line endings unspelled, from
    /// the arena alone: a built
    /// record is admitted first, and the tree over each source the render
    /// reaches is made for the call; through the sources' templates when
    /// `templates`.
    ///
    /// # Errors
    ///
    /// `RenderError::Record` for an address naming no record and for words
    /// `admit` refuses, a side's built record `entries` refuses, else what
    /// the record's render refuses.
    pub fn render_at(&self, built: &super::BuiltChunks, at: Address, changed: ChangedEdges, options: &crate::options::ResolvedOptions, templates: bool, entries: crate::engine::AdmitEntry) -> Result<String, RenderError> {
        let root = root_at::<G>(built, at, changed)?;
        let trees = crate::engine::SourceRecords::new(self, built, entries);
        let read = ReadSources::over(&trees);
        let through = crate::render::ThroughTemplates(&read);
        let sources: &dyn crate::render::SourceTable = if templates { &through } else { &read };
        G::render_record(self.grammar(), root, Some(built), built, self.written(), &RenderContext::new(options, sources))
    }

    /// The lone built leaf of `kind` whose leaf entry is at `entry` in the
    /// engine's built arena `built`, rendered under `options` as a render
    /// root whose `changed` edges have no neighbour, its line endings
    /// unspelled, with the sides `store` holds for it: a root has no site,
    /// so its sides come with the call (`TriviaStore::root_leaf`). The tree
    /// over each source a side's entry reaches is made for the call.
    ///
    /// # Errors
    ///
    /// `RenderError::Record` for a kind no node of the grammar is written as
    /// and for an entry of another kind or outside the arena's strings, a
    /// side's built record `entries` refuses, else what the leaf's render
    /// refuses.
    #[allow(clippy::too_many_arguments, reason = "the leaf, its sides and its edges, then what the render reads through")]
    pub fn render_built_leaf(
        &self,
        built: &super::BuiltChunks,
        kind: KindId,
        entry: Address,
        store: &TriviaStore<G::Trivia>,
        changed: ChangedEdges,
        options: &crate::options::ResolvedOptions,
        entries: crate::engine::AdmitEntry,
    ) -> Result<String, RenderError> {
        let cell = admitted_leaf::<G>(built, kind, entry, changed).map_err(RenderError::Record)?;
        let trees = crate::engine::SourceRecords::new(self, built, entries);
        let read = ReadSources::over(&trees);
        G::render_record(self.grammar(), CellAt { cell, node: None, site: None }, Some(built), built, store, &RenderContext::new(options, &read))
    }
}

/// The cell of a built leaf of `kind` whose leaf entry is at `entry` in
/// `arena`, as admission admits it: by what it holds, an entry of that kind,
/// a kind the grammar writes, and text inside the arena's strings.
fn admitted_leaf<G: RecordGrammar>(arena: &dyn ArenaRead, kind: KindId, entry: Address, changed: ChangedEdges) -> Result<Cell, ArenaError> {
    G::shape(kind).ok_or(ArenaError::Malformed { what: "built leaf kind", word: u32::from(kind.0) })?;
    let word = CellWord::of(entry, ChangedEdges::default()).map_err(|_| ArenaError::Malformed { what: "leaf entry address", word: entry.0 })?;
    match Cell::decode_built(word, arena, G::KIND_BITS)? {
        Cell::BuiltLeaf { kind: found, text, .. } if found == kind => {
            arena.text(text)?;
            Ok(Cell::BuiltLeaf { kind, text, changed })
        }
        _ => Err(ArenaError::Malformed { what: "built leaf entry", word: entry.0 }),
    }
}

/// The built record `record` of `arena` written into `w` as a trivia entry
/// in the side that holds it, under `ctx`: admitted, the parsed trees it
/// links held from `trees`, and rendered as the record its grammar renders
/// as an entry (`RecordGrammar::render_entry`), its sides from `store`.
///
/// # Errors
///
/// `RenderError::Record` for a record whose header names a kind other than
/// its entry's and for words `admit` refuses, else what the render refuses.
pub fn render_record_entry<G: RecordGrammar>(
    grammar: G,
    arena: &dyn ArenaRead,
    record: BuiltEntry,
    store: &TriviaStore<G::Trivia>,
    trees: &ReadSources<'_, G>,
    ctx: &RenderContext<'_>,
    w: &mut dyn RenderSink,
) -> RenderResult {
    if arena.header_kind(record.at, G::KIND_BITS).map_err(RenderError::Record)? != record.kind {
        return Err(RenderError::Record(ArenaError::Malformed { what: "trivia entry kind", word: u32::from(record.kind.0) }));
    }
    let root = admitted_root::<G>(arena, record.at, ChangedEdges::default(), trees)?;
    G::render_entry(grammar, root, None, arena, store, ctx, w)
}

/// The record `record` of the engine's built arena `built`, a built one or
/// one a read left, written into `w` as a trivia entry in the side that
/// holds it, under `ctx`, from the arena alone (`root_at`), as the record
/// its grammar renders as an entry (`RecordGrammar::render_entry`), its
/// sides from `store`.
///
/// # Errors
///
/// `RenderError::Record` for a record whose header names a kind other than
/// its entry's and for words `admit` refuses, else what the render refuses.
pub fn render_entry_at<G: RecordGrammar>(grammar: G, built: &super::BuiltChunks, record: BuiltEntry, store: &TriviaStore<G::Trivia>, ctx: &RenderContext<'_>, w: &mut dyn RenderSink) -> RenderResult {
    let root = root_at::<G>(built, record.at, ChangedEdges::default())?;
    if root.cell != (Cell::Child { kind: record.kind, at: record.at, changed: ChangedEdges::default() }) {
        return Err(RenderError::Record(ArenaError::Malformed { what: "trivia entry kind", word: u32::from(record.kind.0) }));
    }
    G::render_entry(grammar, root, Some(built), built, store, ctx, w)
}

/// The record at `at` of the engine's built arena `built`, a node a read
/// left, written into `w` as a render writes a node whose own inner side a
/// write replaced, under `ctx`, from the arena alone (`root_at`): through its template, as the
/// record its grammar renders where `w` stands (`RecordGrammar::render_entry`),
/// its sides from `store`.
///
/// # Errors
///
/// `RenderError::Record` for an address naming no record, else what the
/// record's render refuses.
pub fn render_read_at<G: RecordGrammar>(grammar: G, built: &super::BuiltChunks, at: Address, store: &TriviaStore<G::Trivia>, ctx: &RenderContext<'_>, w: &mut dyn RenderSink) -> RenderResult {
    G::render_entry(grammar, root_at::<G>(built, at, ChangedEdges::default())?, Some(built), built, store, ctx, w)
}

/// The record at `at` of the engine's built arena `built` as a render root
/// whose `changed` edges have no neighbour: a record a read left names its
/// source, and a built one is admitted.
fn root_at<G: RecordGrammar>(built: &super::BuiltChunks, at: Address, changed: ChangedEdges) -> Result<CellAt, RenderError> {
    let kind = built.header_kind(at, G::KIND_BITS).map_err(RenderError::Record)?;
    let node = if built.read_record(at) {
        Some(crate::types::NodeId::record(at.0))
    } else {
        admit(built, at, G::shape, G::KIND_BITS).map_err(RenderError::Record)?;
        None
    };
    Ok(CellAt { cell: Cell::Child { kind, at, changed }, node, site: None })
}

fn admitted_root<G: RecordGrammar>(arena: &dyn ArenaRead, at: Address, changed: ChangedEdges, trees: &ReadSources<'_, G>) -> Result<CellAt, RenderError> {
    let kind = arena.header_kind(at, G::KIND_BITS).map_err(RenderError::Record)?;
    let linked = admit(arena, at, G::shape, G::KIND_BITS).map_err(RenderError::Record)?;
    for id in linked {
        let node = crate::slot::NodeIdOrCoordinate::of(id);
        trees.holding(node).ok_or_else(|| node.unknown())?;
    }
    Ok(CellAt { cell: Cell::Child { kind, at, changed }, node: None, site: None })
}
