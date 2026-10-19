//! A parsed tree's record entry points: a node's record, written on its
//! first read; a record rendered; and a chunk of the tree's arena, copied.
//! A record is named by its tree and its address together: the address
//! reads nothing once its tree is gone.

use super::{Address, Arena, Cell, CellAt, HeldArenas, RecordTrees, WriteCell};
use crate::engine::{EngineGrammar, ParsedTree};
use crate::options::ResolvedOptions;
use crate::prepare::RenderContext;
use crate::read::{Depth, ReadNode};
use crate::record::HEADER_WORDS;
use crate::render::RenderError;
use crate::slot::ChangedEdges;
use crate::trivia_store::TriviaStore;
use crate::types::{KindId, NodeIndex};

/// A grammar's render of a record: its generated `render_record`.
pub trait RecordGrammar: EngineGrammar {
    /// Renders the record `root` names, prepared into a fresh overlay over
    /// the parsed trees' arenas `trees`, the built arena `built` and the
    /// store of written sides `store`, and answers its text before its line
    /// endings are spelled.
    ///
    /// # Errors
    ///
    /// What the record's prepare or render refuses.
    fn render_record(self, root: CellAt, trees: &mut dyn RecordTrees, built: &Arena, store: &TriviaStore<Self::Trivia>, ctx: &RenderContext<'_>) -> Result<String, RenderError>;
}

impl<G: EngineGrammar> ParsedTree<G> {
    /// The record of the node at `index`: the one a read wrote, else the
    /// one its read `depth` levels down writes now. `None` for a node that
    /// has no record: a parsed leaf, which its holder's cell holds whole, and
    /// an `ERROR` node, which is trivia of its tree.
    ///
    /// # Errors
    ///
    /// The read's refusal, naming the kind, and what the record writer
    /// refuses.
    pub fn read_record<N: ReadNode + WriteCell<G::Trivia>>(&self, index: NodeIndex, depth: Depth) -> Result<Option<Address>, String> {
        if let Some(at) = self.tree_arena().record(index) {
            return Ok(Some(at));
        }
        if self.read_error(index).is_some() {
            return Ok(None);
        }
        let grammar = self.grammar();
        let node: N = self.read(index, depth).map_err(|refusal| refusal.describe(&|kind| grammar.kind_name(kind)))?;
        let cell = node.write_cell(&mut super::RecordSink::parsed(self.tree_id(), &mut self.tree_arena())).map_err(|refusal| refusal.to_string())?;
        Ok(match cell {
            Cell::Child { at, .. } => Some(at),
            _ => None,
        })
    }

    /// The words of chunk `n` of the tree's arena that records fill, copied:
    /// a later read that appends to the chunk leaves the copy as it was.
    #[must_use]
    pub fn record_chunk(&self, n: u32) -> Option<Vec<u32>> {
        self.tree_arena().arena().chunk(n).map(<[u32]>::to_vec)
    }
}

impl<G: RecordGrammar> ParsedTree<G> {
    /// The record at `at` of the tree's arena, rendered under `options`, its
    /// line endings unspelled.
    ///
    /// # Errors
    ///
    /// `RenderError::Record` for an address that names no record of the
    /// arena: none, past what it wrote, or a header naming no kind the
    /// grammar writes a record of; else what the record's render refuses.
    pub fn render_record(&self, at: Address, options: &ResolvedOptions) -> Result<String, RenderError> {
        let refused = |what| RenderError::Record(super::ArenaError::Malformed { what, word: at.0 });
        if at == Address::NONE {
            return Err(refused("record address"));
        }
        let kind = {
            let arena = self.tree_arena();
            let header = arena.arena().words(at, HEADER_WORDS).map_err(RenderError::Record)?;
            u16::try_from(header[0]).map(KindId).map_err(|_| refused("record kind"))?
        };
        let root = CellAt { cell: Cell::Child { kind, at, link: None, changed: ChangedEdges::default() }, tree: Some(self.tree_id()), site: None };
        let ctx = RenderContext { options, sources: self };
        let mut arenas = HeldArenas::of([(self.tree_id(), self.tree_arena())]);
        self.grammar().render_record(root, &mut arenas, &Arena::new(), self.written(), &ctx)
    }
}
