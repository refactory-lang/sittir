//! A built record's render entry point. Its words were written outside the
//! native writer, so they are admitted as they cross in (`admit`), and the
//! parsed trees its cells link are held for the render.


use super::{admit, Address, ArenaError, ArenaRead, Cell, CellAt, CellWord, HeldArenas, RecordGrammar};
use crate::engine::{encode_handle, Engine, EngineGrammar, ReadTrees};
use crate::prepare::RenderContext;
use crate::render::{CoordinateError, RenderError, RenderResult, RenderSink};
use crate::slot::ChangedEdges;
use crate::trivia::{BuiltEntry, NodeTrivia, TriviaEntry};
use crate::trivia_store::{Place, Site, TriviaStore};
use crate::trivia_table::TriviaSide;
use crate::types::{KindId, NodeIndex};

impl<G: EngineGrammar> Engine<G> {
    /// The entries of `side` of the record at `at`. For a built record, the
    /// ones a write gave it, or `None` when no write did, so the side is the
    /// one of the node it was rebuilt from. For a record a read left, the
    /// ones a write gave it, else the ones its source assigns it.
    ///
    /// # Errors
    ///
    /// `ArenaError::Malformed` for address 0, which names no record, and
    /// what reading a read's record refuses.
    pub fn built_trivia_side(&self, at: Address, side: TriviaSide) -> Result<Option<Vec<TriviaEntry<G::Trivia>>>, ArenaError> {
        let at = at.record()?;
        match self.read_node(at, |tree, index| tree.trivia_side(index, side))? {
            Some(entries) => Ok(Some(entries)),
            None => Ok(self.written().side(Place::Record(at), side)),
        }
    }

    /// Replace `side` of the record at `at`, a built one or one a read left,
    /// with `entries`, which its render then writes (`render_built`).
    ///
    /// # Errors
    ///
    /// As `built_trivia_side`.
    pub fn write_built_trivia_side(&self, at: Address, side: TriviaSide, entries: Vec<TriviaEntry<G::Trivia>>) -> Result<(), ArenaError> {
        let at = at.record()?;
        if self.written().built().read_record(at) {
            return self.write_read_side(super::NodeSite::Record(at).name(), side, entries);
        }
        self.written().write_held_side(Place::Record(at), side, entries)
    }

    /// Replace `side` of the node a read left that `name` names with
    /// `entries`, which its render then writes.
    ///
    /// # Errors
    ///
    /// `ArenaError::Malformed` for a name whose record is address 0 or names
    /// no source.
    pub fn write_read_side(&self, name: crate::types::NodeName, side: TriviaSide, entries: Vec<TriviaEntry<G::Trivia>>) -> Result<(), ArenaError> {
        let record = Address(name.node.0).record()?;
        let tree = crate::types::TreeId(super::RunNodes::source_of(self.written().built().readable()?, record)?.0);
        self.written().write_held_side(Place::Read { tree, site: super::NodeSite::named(name) }, side, entries)
    }

    /// What `f` answers of the node a read left a record of at `at`: the
    /// tree over its source's records, made for this call, and the id the
    /// call gives the node. `None` for an address no read wrote.
    ///
    /// # Errors
    ///
    /// What making the tree refuses.
    pub fn read_node<R>(&self, at: Address, f: impl FnOnce(&crate::engine::ParsedTree<G, crate::engine::Records<'_>>, NodeIndex) -> R) -> Result<Option<R>, ArenaError> {
        self.read_named(super::NodeSite::Record(at).name(), f)
    }

    /// What `f` answers of the node a read left that `name` names: the tree
    /// over its source's records, made for this call, and the id the call
    /// gives the node. `None` for a name whose record no read wrote.
    ///
    /// # Errors
    ///
    /// What making the tree refuses, and `ArenaError::Malformed` for a name
    /// its source's records hold no node of.
    /// The siblings that hold sides beside each node `names` names
    /// (`ParsedTree::siblings`), in order, each from the read that left it;
    /// the nodes of one source share one walk of its records.
    ///
    /// # Errors
    ///
    /// `ARENA_RELEASED` once released, what reading a record refuses, and
    /// `ArenaError::Malformed` for a name no read's record holds.
    pub fn siblings_of(&self, names: &[crate::types::NodeName]) -> Result<Vec<crate::engine::Siblings>, ArenaError> {
        let chunks = self.written().built();
        let built = chunks.readable()?;
        let mut trees: Vec<(Address, crate::engine::ParsedTree<G, crate::engine::Records<'_>>)> = Vec::new();
        let mut siblings = Vec::with_capacity(names.len());
        for &name in names {
            let record = Address(name.node.0);
            let source = super::RunNodes::source_of(built, record)?;
            let at = if let Some(at) = trees.iter().position(|(known, _)| *known == source) {
                at
            } else {
                trees.push((source, crate::engine::ParsedTree::over_records(self, &chunks, record)?));
                trees.len() - 1
            };
            let tree = &trees[at].1;
            let index = tree.index_at(super::NodeSite::named(name)).ok_or(ArenaError::Malformed { what: "node name", word: record.0 })?;
            siblings.extend(tree.siblings(&[index]));
        }
        Ok(siblings)
    }

    /// The entry of the source each node `names` names was read from.
    ///
    /// # Errors
    ///
    /// `ARENA_RELEASED` once released, and what reading a record refuses.
    pub fn sources_of(&self, names: &[crate::types::NodeName]) -> Result<Vec<Address>, ArenaError> {
        let chunks = self.written().built();
        let built = chunks.readable()?;
        names.iter().map(|name| super::RunNodes::source_of(built, Address(name.node.0))).collect()
    }

    pub fn read_named<R>(&self, name: crate::types::NodeName, f: impl FnOnce(&crate::engine::ParsedTree<G, crate::engine::Records<'_>>, NodeIndex) -> R) -> Result<Option<R>, ArenaError> {
        let built = self.written().built();
        built.readable()?;
        let record = Address(name.node.0);
        if !built.read_record(record) {
            return Ok(None);
        }
        let tree = crate::engine::ParsedTree::over_records(self, &built, record)?;
        let index = tree.index_at(super::NodeSite::named(name)).ok_or(ArenaError::Malformed { what: "node name", word: record.0 })?;
        Ok(Some(f(&tree, index)))
    }

    /// The entries a write gave `side` of the built leaf at `site`, or `None`
    /// when no write did.
    ///
    /// # Errors
    ///
    /// `ArenaError::Malformed` for a site whose holder is address 0.
    pub fn built_leaf_side(&self, site: Site<Address>, side: TriviaSide) -> Result<Option<Vec<TriviaEntry<G::Trivia>>>, ArenaError> {
        site.holder.record()?;
        Ok(self.written().side(Place::Leaf(site), side))
    }

    /// The sides of every unit and leaf site of the built record at `from`,
    /// written at the same site of the record at `to`, except a site at a
    /// word `skip` names.
    ///
    /// # Errors
    ///
    /// `ArenaError::Malformed` for address 0 as either record, before any
    /// side is copied.
    pub fn copy_built_sites(&self, from: Address, to: Address, skip: &[u32]) -> Result<(), ArenaError> {
        from.record()?;
        to.record()?;
        self.written().copy_sites(from, to, skip)
    }

    /// Replace `side` of the built leaf at each of `sites` with `entries`,
    /// which a render of its holder then writes.
    ///
    /// # Errors
    ///
    /// `ArenaError::Malformed` for a site whose holder is address 0, before
    /// any site is written.
    pub fn write_built_leaf_side(&self, sites: &[Site<Address>], side: TriviaSide, entries: &[TriviaEntry<G::Trivia>]) -> Result<(), ArenaError> {
        for site in sites {
            site.holder.record()?;
        }
        sites.iter().try_for_each(|&site| self.written().write_held_side(Place::Leaf(site), side, entries.to_vec()))
    }
}

impl<G: RecordGrammar> Engine<G> {
    /// The sides writes gave each unit the built record at `at` in `arena`
    /// holds: by the unit's slot and its item there.
    ///
    /// # Errors
    ///
    /// What `ArenaRead::header_kind` refuses, and `ArenaError::Malformed` for
    /// a unit at a word the record's kind holds no slot at.
    pub fn built_unit_sides(&self, arena: &impl ArenaRead, at: Address) -> Result<Vec<crate::layout::UnitSides<G::Trivia>>, ArenaError> {
        let kind = arena.header_kind(at, G::KIND_BITS)?;
        let units = self.written().units(at);
        units
            .into_iter()
            .map(|(word, item, trivia)| {
                let slot = G::slot_key(kind, word).ok_or(ArenaError::Malformed { what: "unit slot word", word })?;
                Ok(crate::layout::UnitSides { slot: slot.to_owned(), item, trivia })
            })
            .collect()
    }

    /// The units the built record at `at` holds have the sides `units`
    /// gives, in place of every unit side it had; its render then writes
    /// them.
    ///
    /// # Errors
    ///
    /// What `ArenaRead::header_kind` and `TriviaStore::write_units` refuse,
    /// and `ArenaError::UnknownSlot` for a slot the record's kind has no
    /// cell for.
    pub fn write_built_unit_sides(&self, at: Address, units: Vec<crate::layout::UnitSides<G::Trivia>>) -> Result<(), ArenaError> {
        let kind = self.written().built().readable()?.header_kind(at, G::KIND_BITS)?;
        let units = units
            .into_iter()
            .map(|unit| {
                let word = G::slot_word(kind, &unit.slot).ok_or_else(|| ArenaError::UnknownSlot(unit.slot.clone().into_boxed_str()))?;
                Ok((word, unit.item, unit.trivia))
            })
            .collect::<Result<Vec<_>, ArenaError>>()?;
        self.written().write_units(at, units)
    }

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
        use crate::query::{NamedBatch, NamedCoordinate, NamedItem, QueryItem};
        let built = self.written().built();
        built.readable().map_err(|e| e.to_string())?;
        let tree = crate::engine::ParsedTree::over_records(self, &built, Address(from.name().node.0)).map_err(|e| e.to_string())?;
        let batch = tree.descendants(local_address(&tree, from)?, kinds, plan, resume, limit, depth)?;
        let named = |handle: crate::types::TreeHandle| {
            let index = crate::engine::decode_handle(handle).1;
            tree.name_at(index).ok_or_else(|| format!("the walk found node {}, which its records do not name", index.0))
        };
        let items = batch
            .items
            .into_iter()
            .map(|item| match item {
                QueryItem::Node(at) => Ok(NamedItem::Node(NamedCoordinate { name: named(at.handle)?, span: at.span, kind: at.kind })),
                QueryItem::Unit(kind) => Ok(NamedItem::Unit(kind)),
            })
            .collect::<Result<_, String>>()?;
        Ok(NamedBatch { items, resume: batch.resume, origin: named(batch.origin)? })
    }

    /// Whether each node `addresses` names among the records reads left in
    /// the engine's built arena, all of one source, satisfies `plan`, in
    /// order (`ParsedTree::plan_holds`).
    ///
    /// # Errors
    ///
    /// A name no read's record holds.
    pub fn plan_holds_of(&self, addresses: &[crate::query::NamedAddress], plan: &crate::query::Plan) -> Result<Vec<bool>, String> {
        let Some(first) = addresses.first() else { return Ok(Vec::new()) };
        let built = self.written().built();
        built.readable().map_err(|e| e.to_string())?;
        let tree = crate::engine::ParsedTree::over_records(self, &built, Address(first.name().node.0)).map_err(|e| e.to_string())?;
        let local = addresses.iter().map(|&address| local_address(&tree, address)).collect::<Result<Vec<_>, String>>()?;
        tree.plan_holds(&local, plan)
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
        trees: &ReadTrees<'_, G>,
        ctx: &RenderContext<'_>,
    ) -> Result<String, RenderError> {
        let (root, mut held) = admitted_root::<G>(arena, at, changed, trees)?;
        G::render_record(self.grammar(), root, &mut held, arena, self.written(), ctx, None)
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
        let (root, mut held) = root_at::<G>(built, at, changed)?;
        let trees = crate::engine::SourceTrees::new(self, built, entries);
        let read = ReadTrees::over(&trees);
        let through = crate::render::ThroughTemplates(&read);
        let sources: &dyn crate::render::SourceTable = if templates { &through } else { &read };
        G::render_record(self.grammar(), root, &mut held, built, self.written(), &RenderContext::new(options, sources), None)
    }

    /// The lone built leaf of `kind` whose leaf entry is at `entry` in
    /// `arena`, rendered as a render root whose `changed` edges have no neighbour,
    /// with the sides `sides`: a root has no site, so its sides come with the
    /// call (`Place::ROOT_LEAF`).
    ///
    /// # Errors
    ///
    /// `RenderError::Record` for a kind no node of the grammar is written as
    /// and for an entry of another kind or outside the arena's strings, else
    /// what the leaf's render refuses.
    pub fn render_built_leaf(
        &self,
        arena: &dyn ArenaRead,
        kind: KindId,
        entry: Address,
        sides: Option<NodeTrivia<G::Trivia>>,
        changed: ChangedEdges,
        ctx: &RenderContext<'_>,
    ) -> Result<String, RenderError> {
        let cell = admitted_leaf::<G>(arena, kind, entry, changed).map_err(RenderError::Record)?;
        let store = self.written().root_leaf(sides);
        let mut held = HeldArenas::of([]);
        G::render_record(self.grammar(), CellAt { cell, tree: None, site: None }, &mut held, arena, &store, ctx, None)
    }
}

/// The cell of a built leaf of `kind` whose leaf entry is at `entry` in
/// `arena`, as admission admits it: by what it holds, an entry of that kind,
/// a kind the grammar writes, and text inside the arena's strings.
fn admitted_leaf<G: RecordGrammar>(arena: &dyn ArenaRead, kind: KindId, entry: Address, changed: ChangedEdges) -> Result<Cell, ArenaError> {
    G::shape(kind).ok_or(ArenaError::Malformed { what: "built leaf kind", word: u32::from(kind.0) })?;
    let word = entry.0.checked_mul(4).filter(|_| entry.0 < 1 << 30).ok_or(ArenaError::Malformed { what: "leaf entry address", word: entry.0 })?;
    match Cell::decode_built(CellWord(word), arena, G::KIND_BITS)? {
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
    trees: &ReadTrees<'_, G>,
    ctx: &RenderContext<'_>,
    w: &mut dyn RenderSink,
) -> RenderResult {
    if arena.header_kind(record.at, G::KIND_BITS).map_err(RenderError::Record)? != record.kind {
        return Err(RenderError::Record(ArenaError::Malformed { what: "trivia entry kind", word: u32::from(record.kind.0) }));
    }
    let (root, mut held) = admitted_root::<G>(arena, record.at, ChangedEdges::default(), trees)?;
    G::render_entry(grammar, root, &mut held, arena, store, ctx, w)
}

/// `address` as `tree`, made for one call over a source's records, names
/// it: each name by the id the call gives its node.
fn local_address<G: RecordGrammar>(tree: &crate::engine::ParsedTree<G, crate::engine::Records<'_>>, address: crate::query::NamedAddress) -> Result<crate::query::Address, String> {
    use crate::query::{Address as Local, NamedAddress};
    let handle = |name: crate::types::NodeName| {
        tree.index_at(super::NodeSite::named(name)).map(|index| encode_handle(tree.tree_id(), index)).ok_or_else(|| format!("{name:?} names no node its source's records hold"))
    };
    Ok(match address {
        NamedAddress::Own(name) => Local::Own { handle: handle(name)? },
        NamedAddress::Child { parent, index } => Local::Child { parent: handle(parent)?, index },
    })
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
    let (root, mut held) = root_at::<G>(built, record.at, ChangedEdges::default())?;
    if root.cell != (Cell::Child { kind: record.kind, at: record.at, link: None, changed: ChangedEdges::default() }) {
        return Err(RenderError::Record(ArenaError::Malformed { what: "trivia entry kind", word: u32::from(record.kind.0) }));
    }
    G::render_entry(grammar, root, &mut held, built, store, ctx, w)
}

/// The record at `at` of the engine's built arena `built` as a render root
/// whose `changed` edges have no neighbour, with the reads' records it
/// reaches held: a record a read left names its source, and a built one is
/// admitted.
fn root_at<G: RecordGrammar>(built: &super::BuiltChunks, at: Address, changed: ChangedEdges) -> Result<(CellAt, HeldArenas<'_>), RenderError> {
    let kind = built.header_kind(at, G::KIND_BITS).map_err(RenderError::Record)?;
    let tree = if built.read_record(at) {
        Some(crate::types::TreeId(super::RunNodes::source_of(built, at).map_err(RenderError::Record)?.0))
    } else {
        admit(built, at, G::shape, G::KIND_BITS).map_err(RenderError::Record)?;
        None
    };
    Ok((CellAt { cell: Cell::Child { kind, at, link: None, changed }, tree, site: None }, HeldArenas::of([]).with_reads(built)))
}

fn admitted_root<'t, G: RecordGrammar>(
    arena: &dyn ArenaRead,
    at: Address,
    changed: ChangedEdges,
    trees: &ReadTrees<'t, G>,
) -> Result<(CellAt, HeldArenas<'t>), RenderError> {
    let kind = arena.header_kind(at, G::KIND_BITS).map_err(RenderError::Record)?;
    let linked = admit(arena, at, G::shape, G::KIND_BITS).map_err(RenderError::Record)?;
    let held = linked
        .into_iter()
        .map(|tree| {
            let parsed = trees.get(tree).ok_or(CoordinateError::UnknownTree { handle: encode_handle(tree, NodeIndex::ROOT), tree_id: tree })?;
            Ok((tree, parsed.tree_arena()))
        })
        .collect::<Result<Vec<_>, CoordinateError>>()?;
    Ok((CellAt { cell: Cell::Child { kind, at, link: None, changed }, tree: None, site: None }, HeldArenas::of(held)))
}
