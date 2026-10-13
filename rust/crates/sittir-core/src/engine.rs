//! Shared native engine state for grammar-specific N-API bindings.
//!
//! Grammar crates provide a small [`EngineGrammar`] adapter for parser setup,
//! template hash lookup, and render dispatch. This module owns the generic
//! parse/read/render/edit state machine so `sittir-{lang}` crates stay
//! thin and grammar-owned.
//!
//! ## Engine / ParsedTree split
//!
//! `Engine<G>` is stateless (parser + grammar config). Parsing returns a
//! `ParsedTree<G>` that owns the tree, its source and what the source infers. A handle names a
//! node by its tree's id and its descendant index, re-resolved through a
//! cursor on each access — no lifetime-erasure needed.

use crate::options::ResolvedOptions;
use crate::query::{Address, DescendantBatch, Plan, QueryCoordinate};
use crate::read::{display_id, SideEntry};
use crate::types::Span;
use crate::render::SourceTable;
use crate::slot::{NodeCoordinate, SlotValue};
use crate::trivia::{FromTriviaText, TriviaEntry, TriviaText};
use crate::trivia_table::{Assigned, TriviaSide, TriviaTable};
use crate::types::KindId;
use std::collections::HashMap;
use std::sync::Arc;

/// Grammar-specific hooks used by the shared native engine.
pub trait EngineGrammar: Copy {
    fn configure_parser(self, parser: &mut tree_sitter::Parser) -> Result<(), String>;
    fn render_module_hash(self) -> &'static str;
    /// The name of a kind of this grammar, for messages that name one.
    fn kind_name(self, kind: KindId) -> &'static str;
    /// The display ids this grammar claims a node by (`ReadTransport::shows`
    /// of its transports), which a coordinate stamps in place of the grammar id.
    fn shows(self) -> fn(KindId) -> bool;
    /// Whether a node with a grammar id and a display id is a keyword the
    /// grammar relaxes into its word rule (`ReadCtx::relaxes`). A grammar that
    /// relaxes no keyword claims none.
    fn relaxes(self) -> fn(KindId, KindId) -> bool {
        |_, _| false
    }
    /// The grammar's trivia type: what a side of a parsed node holds.
    type Trivia: crate::trivia::FromTriviaText + crate::trivia::TriviaItem;
    /// The grammar's whitespace table, and its layout kinds (the table's domain).
    fn whitespace(self) -> (&'static crate::render::WhitespaceTable, &'static [u16]);
    /// The grammar's surface kinds the trivia table's assignment reads
    /// (`TriviaTable::assign`).
    fn surface_kinds(self) -> crate::trivia_table::SurfaceKinds;
    /// The grammar's option tables: each site's arms and the address an
    /// options object names it by.
    fn option_tables(self) -> &'static crate::options::OptionTables;
    /// The sides of the unit children of the node at `index` of `tree`, by
    /// slot and item: the node read one level down by `ctx`
    /// (`TransportLayout::units`). None for a grammar with no transports.
    fn read_units(self, tree: &tree_sitter::Tree, ctx: &crate::read::ReadCtx<'_>, index: u32) -> Vec<crate::layout::UnitSides<Self::Trivia>> {
        let _ = (tree, ctx, index);
        Vec::new()
    }
}

/// The node at descendant `index` of `tree`, or `None` past its last node.
pub fn node_at_index(tree: &tree_sitter::Tree, index: u32) -> Option<tree_sitter::Node<'_>> {
    if index as usize >= tree.root_node().descendant_count() {
        return None;
    }
    let mut cursor = tree.walk();
    cursor.goto_descendant(index as usize);
    Some(cursor.node())
}

/// The byte offsets in `source` of the lines under the node at `index` that
/// begin inside a token spanning lines (a multi-line string or comment), or
/// right after a token ending in a line break with the next token starting at
/// that very offset (a string's content continuing past an interpolation):
/// shifting such a line changes the token's content, so anything that
/// re-indents text leaves it where it is. The tokens are the token walk's
/// (`trivia_table::walk`) and its entries, each an extra or an `ERROR` taken
/// whole. In source order, each offset once.
pub fn line_starts_inside_tokens(node: tree_sitter::Node<'_>, index: u32, source: &str) -> Vec<usize> {
    let walk = crate::trivia_table::walk(node, index, source);
    let mut spans: Vec<(u32, u32)> = walk.tokens.iter().map(|token| (token.start, token.end)).collect();
    spans.extend(walk.entries.iter().map(|&entry| walk.span(entry)));
    spans.sort_unstable();
    let mut starts = Vec::new();
    let mut previous_end: Option<u32> = None;
    for (start, end) in spans {
        if previous_end == Some(start) {
            starts.push(start as usize);
        }
        let mut at = start as usize;
        while let Some(found) = source.get(at..end as usize).and_then(|text| text.find('\n')) {
            let line = at + found + 1;
            if line >= end as usize {
                break;
            }
            starts.push(line);
            at = line;
        }
        if end > start {
            previous_end = source.as_bytes().get(end as usize - 1).filter(|byte| **byte == b'\n').map(|_| end);
        }
    }
    starts.dedup();
    starts
}

/// The descendant index of child `position` of the node at `index`: its own
/// index, one for the node, and every earlier child's descendant count.
pub fn child_index_of(node: tree_sitter::Node<'_>, index: u32, position: u32) -> u32 {
    (0..position).fold(index + 1, |at, i| at + node.child(i).map_or(0, |child| child.descendant_count() as u32))
}

/// The siblings that hold sides beside a node (`trivia_table::holds_sides`)
/// in its own slot (the same field, or both in none), taken at the outermost
/// node spanning exactly its bytes (a list item's wrapper holds the item's
/// neighbours, not the item): the item before it in its list, or none when it
/// is the first, and the one after it, or none when it is the last. A child
/// of another slot past the list's closer is not its neighbour.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, serde::Serialize)]
pub struct Siblings {
    pub previous: Option<Sibling>,
    pub next: Option<Sibling>,
}

/// A sibling's span and grammar kind id. The kind is what names a unit
/// sibling, which a rebuilt list holds as its bare kind, with no span.
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize)]
pub struct Sibling {
    pub start: u32,
    pub end: u32,
    pub kind: u16,
}

/// What kind of region of a source did not parse: an ERROR node error
/// recovery wrapped source in, or a MISSING node it inserted.
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "lowercase")]
pub enum ErrorRegionKind {
    Error,
    Missing,
}

/// One region of a source that did not parse, with its byte span. A MISSING
/// region is empty: it marks where the parser inserted a token.
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize)]
pub struct ErrorRegion {
    pub kind: ErrorRegionKind,
    pub span: Span,
}

/// The in-line runs an `ERROR` entry carries before and after its own bytes,
/// up to the tokens beside it on its line, since a seam cannot be trusted
/// beside what did not parse. A run that touches a line break stays layout,
/// and the run between two `ERROR`s is the earlier one's. An empty span is
/// no run.
fn error_adjacency(node: &tree_sitter::Node<'_>, source: &str) -> (Span, Span) {
    let bytes = source.as_bytes();
    let in_line = |byte: u8| byte == b' ' || byte == b'\t';
    let (mut start, mut end) = (node.start_byte(), node.end_byte());
    let mut after = end;
    while after < bytes.len() && in_line(bytes[after]) {
        after += 1;
    }
    if after > end && after < bytes.len() && !matches!(bytes[after], b'\n' | b'\r') {
        end = after;
    }
    let mut before = start;
    while before > 0 && in_line(bytes[before - 1]) {
        before -= 1;
    }
    let taken = node.prev_sibling().is_some_and(|prev| prev.is_error() && prev.end_byte() == before);
    if before < start && before > 0 && !matches!(bytes[before - 1], b'\n' | b'\r') && !taken {
        start = before;
    }
    let own = (node.start_byte(), node.end_byte());
    (Span { start: start as u32, end: own.0 as u32 }, Span { start: own.1 as u32, end: end as u32 })
}

/// Every ERROR and MISSING region of `tree`, in source order. The walk enters
/// only nodes that hold an error, and never an ERROR node: a region nested in
/// another is part of it.
pub fn error_regions(tree: &tree_sitter::Tree) -> Vec<ErrorRegion> {
    let mut regions = Vec::new();
    if !tree.root_node().has_error() {
        return regions;
    }
    let mut cursor = tree.walk();
    loop {
        let node = cursor.node();
        let kind = if node.is_error() {
            Some(ErrorRegionKind::Error)
        } else if node.is_missing() {
            Some(ErrorRegionKind::Missing)
        } else {
            None
        };
        if let Some(kind) = kind {
            let range = node.byte_range();
            regions.push(ErrorRegion {
                kind,
                span: Span { start: range.start as u32, end: range.end as u32 },
            });
        }
        if kind.is_none() && node.has_error() && cursor.goto_first_child() {
            continue;
        }
        while !cursor.goto_next_sibling() {
            if !cursor.goto_parent() {
                return regions;
            }
        }
    }
}

/// The node a coordinate names: of the nodes spanning exactly `start..end`,
/// the outermost the read stamped `kind`, either the grammar symbol that
/// parsed it or the kind the parser shows it as (`identity`), since a node
/// read as an alias envelope is addressed by the kind it shows.
///
/// The search descends from the root by byte: at each level the cursor steps
/// to the child at `start` (`goto_first_child_for_byte`) without visiting the
/// children before it. A span of at least one byte can only sit in that
/// child, since siblings never overlap; a zero-width span can also sit at the
/// end of a sibling ending at `start` or in a zero-width sibling there, so the
/// walk first steps back over the siblings ending at `start`, then tries each
/// child forward, in source order, while it starts at or before `start`.
pub fn node_at_span<'t>(tree: &'t tree_sitter::Tree, start: usize, end: usize, kind: u16) -> Option<tree_sitter::Node<'t>> {
    fn search<'t>(node: tree_sitter::Node<'t>, start: usize, end: usize, kind: u16) -> Option<tree_sitter::Node<'t>> {
        if node.start_byte() == start && node.end_byte() == end && (node.grammar_id() == kind || crate::read::display_id(&node).0 == kind) {
            return Some(node);
        }
        let mut walker = node.walk();
        if walker.goto_first_child_for_byte(start).is_none() && !walker.goto_last_child() {
            return None;
        }
        if start == end {
            loop {
                let mut back = walker.clone();
                if !back.goto_previous_sibling() || back.node().end_byte() < start {
                    break;
                }
                walker = back;
            }
        }
        loop {
            let child = walker.node();
            if child.start_byte() > start {
                return None;
            }
            if end <= child.end_byte() {
                if let Some(found) = search(child, start, end, kind) {
                    return Some(found);
                }
            }
            if !walker.goto_next_sibling() {
                return None;
            }
        }
    }
    search(tree.root_node(), start, end, kind)
}

/// The last child that is not an extra of the list spanning `start..end`: of
/// the node the read stamped `kind` at that span (`node_at_span`), or, for a
/// list the tree holds no node of its own for, of the node holding the list's
/// children, among the children that lie within the span. That node is the
/// one strictly around the span, above any node spanning exactly the span.
pub fn last_list_child(tree: &tree_sitter::Tree, start: usize, end: usize, kind: u16) -> Option<tree_sitter::Node<'_>> {
    let holder = match node_at_span(tree, start, end, kind) {
        Some(list) => list,
        None => {
            let inner = outermost_same_span(tree.root_node().descendant_for_byte_range(start, end)?);
            if inner.start_byte() == start && inner.end_byte() == end {
                inner.parent()?
            } else {
                inner
            }
        }
    };
    let mut cursor = holder.walk();
    let last = holder
        .children(&mut cursor)
        .filter(|child| !child.is_extra() && child.start_byte() >= start && child.end_byte() <= end)
        .last();
    last
}

/// The outermost node spanning exactly the bytes `node` spans: the node
/// itself unless a wrapper holds it alone.
pub(crate) fn outermost_same_span(node: tree_sitter::Node<'_>) -> tree_sitter::Node<'_> {
    let mut outer = node;
    while let Some(up) = outer.parent() {
        if up.start_byte() != node.start_byte() || up.end_byte() != node.end_byte() {
            break;
        }
        outer = up;
    }
    outer
}

/// The siblings beside the node at descendant `index` (`Siblings`).
pub fn siblings(tree: &tree_sitter::Tree, index: u32) -> Siblings {
    let Some(node) = node_at_index(tree, index) else { return Siblings::default() };
    let outer = outermost_same_span(node);
    let Some(parent) = outer.parent() else { return Siblings::default() };
    let sibling = |node: &tree_sitter::Node<'_>| Sibling { start: node.start_byte() as u32, end: node.end_byte() as u32, kind: node.grammar_id() };
    let mut children = Vec::new();
    let mut cursor = parent.walk();
    if cursor.goto_first_child() {
        loop {
            children.push((cursor.node(), cursor.field_id()));
            if !cursor.goto_next_sibling() {
                break;
            }
        }
    }
    let at = children.iter().position(|(child, _)| child.id() == outer.id()).unwrap_or(0);
    let field = children.get(at).and_then(|&(_, field)| field);
    let item = |(child, of): &&(tree_sitter::Node<'_>, Option<std::num::NonZeroU16>)| *of == field && crate::trivia_table::holds_sides(child);
    Siblings {
        previous: (parent.start_byte() != node.start_byte()).then(|| children[..at].iter().rev().find(item).map(|(child, _)| sibling(child))).flatten(),
        next: (parent.end_byte() != node.end_byte()).then(|| children[at + 1..].iter().find(item).map(|(child, _)| sibling(child))).flatten(),
    }
}

// ─── ParsedTree ────────────────────────────────────────────────────────────────────────────

/// Owned parse result — tree + source + format.
///
/// Created by [`Engine::parse`]. Contains all tree-dependent state.
/// Grammar crate napi wrappers own the `ParsedTree` directly.
///
/// # Design
///
/// A handle names a node by its tree's id and its descendant index, and
/// resolves through a cursor (`node_at_index`).
pub struct ParsedTree<G: EngineGrammar> {
    /// The grammar's read facts, consulted by every read of this tree.
    grammar: G,
    /// The parsed tree-sitter tree.
    tree: tree_sitter::Tree,
    source: Arc<str>,
    /// What the parse read off the source's layout: the tree's layer of the
    /// render options (`InferredOptions`).
    inferred: crate::options::InferredOptions,
    /// The spaces one indentation level spans in the source: the unit's,
    /// else the engine unit's when the source indents by tabs.
    level_width: u32,
    /// Identity this tree stamps into every handle it mints. Distinct per
    /// parse, so a handle names the tree it belongs to and cannot be spent
    /// against another one.
    tree_id: u32,
    /// The source's row starts, built on the first snapshot and shared by
    /// every later one.
    lines: std::sync::OnceLock<crate::points::LineTable>,
    /// The tree's trivia, assigned on the first read of a side.
    trivia: std::sync::OnceLock<TriviaTable>,
    /// The sides a write replaced, by node and side.
    written: std::collections::BTreeMap<(u32, TriviaSide), Vec<crate::trivia::TriviaEntry<G::Trivia>>>,
}

/// Bits of a handle given over to the node index; the rest carry the tree id.
///
/// Handles cross into JavaScript as JSON numbers and come back as doubles, so
/// the two fields together must stay inside the 53-bit range where a double
/// still counts integers exactly. 32 bits of index (4B nodes in one tree) and
/// 21 of tree id (2M parses in one process) spends that budget exactly.
const HANDLE_INDEX_BITS: u32 = 32;
const HANDLE_INDEX_MASK: u64 = (1u64 << HANDLE_INDEX_BITS) - 1;
/// Largest tree id that still fits beside an index in an exact double.
pub const MAX_TREE_ID: u32 = (1u32 << (53 - HANDLE_INDEX_BITS)) - 1;

static NEXT_TREE_ID: std::sync::atomic::AtomicU32 = std::sync::atomic::AtomicU32::new(0);

/// Mint the next tree id from this linked image's counter. One counter
/// serves every engine the image holds, so no two of them ever hold a tree
/// under the same id: a coordinate names its tree unambiguously, and an
/// engine handed another engine's coordinate finds no such tree and refuses
/// it rather than slicing whatever tree sits at that index in its own table.
/// Ids are never reused — a stale handle must not come back to life under a
/// later tree — so once `MAX_TREE_ID` is claimed every later claim gets
/// `None` and the counter stays put. Each grammar's addon is its own image
/// with its own copy of this counter; the napi engine therefore claims from
/// the JavaScript process instead (`claim_tree_id_from`), and this counter
/// serves engines built in Rust alone.
pub fn claim_tree_id() -> Option<u32> {
    claim_tree_id_from_counter(&NEXT_TREE_ID)
}

fn claim_tree_id_from_counter(counter: &std::sync::atomic::AtomicU32) -> Option<u32> {
    use std::sync::atomic::Ordering::Relaxed;

    // try_update requires Rust 1.95; this bounded CAS preserves the 1.88 minimum.
    let mut next = counter.load(Relaxed);
    while next <= MAX_TREE_ID {
        match counter.compare_exchange_weak(next, next + 1, Relaxed, Relaxed) {
            Ok(id) => return Some(id),
            Err(observed) => next = observed,
        }
    }
    None
}

/// Mint the next tree id from a counter shared by every image in the
/// process. `next` is the last value the owner recorded (none on the first
/// claim); the id and the value to record come back together, or nothing
/// once `MAX_TREE_ID` has been claimed — the owner then records nothing, so
/// the counter stays put and no id is ever reused.
pub fn claim_tree_id_from(next: Option<f64>) -> Option<(u32, f64)> {
    let next = next.unwrap_or(0.0);
    if !(0.0..=MAX_TREE_ID as f64).contains(&next) || next.fract() != 0.0 {
        return None;
    }
    let id = next as u32;
    Some((id, f64::from(id) + 1.0))
}

/// Pack a tree id and a node index into one self-identifying handle.
pub fn encode_handle(tree_id: u32, index: u32) -> u64 {
    ((tree_id as u64) << HANDLE_INDEX_BITS) | index as u64
}

/// Split a handle back into the tree that minted it and the index within it.
pub fn decode_handle(handle: u64) -> (u32, u32) {
    (
        (handle >> HANDLE_INDEX_BITS) as u32,
        (handle & HANDLE_INDEX_MASK) as u32,
    )
}

impl<G: EngineGrammar> ParsedTree<G> {
    /// This tree's identity — the tag carried by every handle it mints.
    pub fn tree_id(&self) -> u32 {
        self.tree_id
    }

    /// The parsed tree-sitter tree.
    pub fn tree(&self) -> &tree_sitter::Tree {
        &self.tree
    }

    /// The node at `index` read into `T`, `depth` levels down, seating no
    /// sides; index 0 is the root.
    pub fn read<T: crate::read::ReadTransport>(&self, index: u32, depth: crate::read::Depth) -> Result<T, crate::read::ReadError> {
        crate::read::read_at::<T>(&mut self.tree.walk(), &self.read_ctx(), index, depth)
    }

    /// The sides of the unit children of the node at `index`, by slot and
    /// item, as a render read seats them for a client that stores each unit
    /// as its bare kind (`EngineGrammar::read_units`, `ReadCtx::inline_units`).
    pub fn unit_sides(&self, index: u32) -> Vec<crate::layout::UnitSides<G::Trivia>> {
        self.grammar.read_units(&self.tree, &self.seating_ctx().inline_units(), index)
    }

    /// The `ERROR` node at `index` read as the bytes its coordinate spans, or
    /// `None` when the node there is not an `ERROR`.
    pub fn read_error(&self, index: u32) -> Option<crate::ErrorRead> {
        self.error_under(index, &self.read_ctx())
    }

    /// The `ERROR` node at `index` as `snapshot` reads one: its bytes and its
    /// span from the byte `holder`, or `None` when the node there is not an
    /// `ERROR`.
    pub fn snapshot_error(&self, index: u32, holder: Option<u32>) -> Option<crate::ErrorRead> {
        let measure = self.snapshot_measure(index, holder);
        self.error_under(index, &self.read_ctx().snapshot(&measure))
    }

    fn error_under(&self, index: u32, ctx: &crate::read::ReadCtx<'_>) -> Option<crate::ErrorRead> {
        let node = node_at_index(&self.tree, index).filter(|node| node.is_error())?;
        let at = ctx.coordinate(&node, index);
        let text = self.source[at.span.start as usize..at.span.end as usize].to_owned();
        Some(crate::ErrorRead { text, kind: at.kind, at: ctx.origin(&node, index) })
    }

    fn read_ctx(&self) -> crate::read::ReadCtx<'_> {
        crate::read::ReadCtx::new(&self.source, self.tree_id, self.grammar.shows()).with_relaxes(self.grammar.relaxes())
    }

    /// The context of a read that seats each node's sides from this tree's
    /// table and writes: a render read and a snapshot read.
    pub fn seating_ctx(&self) -> crate::read::ReadCtx<'_> {
        self.read_ctx().with_sides(self)
    }

    /// The source's row starts (`LineTable`), built on first use.
    pub fn lines(&self) -> &crate::points::LineTable {
        self.lines.get_or_init(|| crate::points::LineTable::new(&self.source))
    }

    /// What a snapshot of the node at `index` measures with: from the byte
    /// `holder`, or from the node's own start when it has none. The root has
    /// no holder and starts the source.
    fn snapshot_measure(&self, index: u32, holder: Option<u32>) -> crate::read::SnapshotCtx<'_> {
        let own = || node_at_index(&self.tree, index).filter(|_| index != 0).map(|node| node.start_byte() as u32);
        crate::read::SnapshotCtx::new(self.lines(), holder.or_else(own))
    }

    /// A snapshot of the node at `index`, read at every depth: each node with
    /// its span from the transport that holds it, each extra and `ERROR` of
    /// its sides with its text, and the node itself measured from the byte
    /// `holder`, or from its own start when absent.
    pub fn snapshot<T: crate::read::ReadTransport>(&self, index: u32, holder: Option<u32>) -> Result<T, crate::read::ReadError> {
        let measure = self.snapshot_measure(index, holder);
        crate::read::read_at::<T>(&mut self.tree.walk(), &self.seating_ctx().snapshot(&measure), index, crate::read::Depth::All)
    }

    /// Reject a handle minted by a different tree.
    ///
    /// Indexes are dense and restart at 0 every parse, so without this an
    /// out-of-tree handle lands in range and resolves to whatever node happens
    /// to sit at that index — an unrelated node returned as though it were the
    /// one asked for. The tag turns that into a refusal.
    fn local_index(&self, handle: u64) -> Result<u32, String> {
        let (tree_id, index) = decode_handle(handle);
        if tree_id != self.tree_id {
            return Err(format!(
                "handle {handle} belongs to tree {tree_id}, not tree {}",
                self.tree_id
            ));
        }
        Ok(index)
    }

    /// Whether this tree minted `handle`.
    pub fn owns_handle(&self, handle: u64) -> bool {
        decode_handle(handle).0 == self.tree_id
    }

    /// The node `address` names, without minting a handle; `None` when it
    /// names no node of this tree.
    pub fn node_at(&self, address: Address) -> Result<Option<tree_sitter::Node<'_>>, String> {
        Ok(match address {
            Address::Own { handle } => node_at_index(&self.tree, self.local_index(handle)?),
            Address::Child { parent, index } => node_at_index(&self.tree, self.local_index(parent)?).and_then(|node| node.child(index)),
        })
    }

    /// Whether each node `addresses` names satisfies `plan`, in order. An
    /// address that names no node of this tree is refused.
    pub fn plan_holds(&self, addresses: &[Address], plan: &Plan) -> Result<Vec<bool>, String> {
        addresses
            .iter()
            .map(|&address| {
                let node = self.node_at(address)?.ok_or_else(|| format!("{address:?} names no node of tree {}", self.tree_id))?;
                Ok(plan.holds(&node, &self.source))
            })
            .collect()
    }

    /// The descendant index of the node `address` names.
    fn index_of(&self, address: Address) -> Result<u32, String> {
        let missing = || format!("{address:?} names no node of tree {}", self.tree_id);
        match address {
            Address::Own { handle } => self.local_index(handle),
            Address::Child { parent, index } => {
                let parent_index = self.local_index(parent)?;
                let parent_node = node_at_index(&self.tree, parent_index).ok_or_else(missing)?;
                parent_node.child(index).ok_or_else(missing)?;
                Ok(child_index_of(parent_node, parent_index, index))
            }
        }
    }

    /// Walk the subtree under `from` in pre-order and return the coordinates
    /// of up to `limit` named, non-extra descendants whose grammar symbol is
    /// in `kinds` (every one when `kinds` is empty) and that satisfy `plan`,
    /// each the coordinate a read hands out for it. `resume` is the path of
    /// child indices, from the node at `handle`, of the last node an earlier
    /// batch visited; the walk continues after it. `depth` bounds the levels
    /// walked below `from` (every level when absent). An extra is trivia: the
    /// walk neither returns nor enters it. A depth member the parser issues
    /// (`SurfaceKinds::indent`, `dedent`) is the op that opens or closes a
    /// level, not structure: the walk does not return it.
    pub fn descendants(
        &self,
        from: Address,
        kinds: &[u16],
        plan: Option<&Plan>,
        resume: Option<&[u32]>,
        limit: u32,
        depth: Option<u32>,
    ) -> Result<DescendantBatch, String> {
        let depth = depth.map_or(usize::MAX, |levels| levels as usize);
        let index = self.index_of(from)?;
        let origin = encode_handle(self.tree_id, index);
        let start = node_at_index(&self.tree, index).ok_or_else(|| format!("{from:?} names no node of tree {}", self.tree_id))?;
        let mut cursor = start.walk();
        // indexes[k]: the descendant index of the node at depth k below
        // `start`. path[k - 1]: that node's child index within its parent.
        let mut indexes: Vec<u32> = vec![index];
        let mut path: Vec<u32> = Vec::new();
        let mut coordinates = Vec::new();
        let ctx = crate::read::ReadCtx::new(&self.source, self.tree_id, self.grammar.shows()).with_relaxes(self.grammar.relaxes());
        let surface = self.grammar.surface_kinds();
        let depth_member = |node: &tree_sitter::Node<'_>| node.grammar_id() != 0 && [surface.indent, surface.dedent].contains(&node.grammar_id());
        if let Some(resume) = resume {
            for &child in resume {
                if !cursor.goto_first_child() {
                    return Err("resume path leaves the tree".to_string());
                }
                for _ in 0..child {
                    if !cursor.goto_next_sibling() {
                        return Err("resume path leaves the tree".to_string());
                    }
                }
                indexes.push(index + cursor.descendant_index() as u32);
                path.push(child);
            }
        }
        while Self::advance(&mut cursor, index, &mut indexes, &mut path, depth) {
            let node = cursor.node();
            if node.is_named()
                && !node.is_extra()
                && !depth_member(&node)
                && (kinds.is_empty() || kinds.contains(&ctx.stamped_kind(KindId(node.grammar_id()), display_id(&node)).0))
                && plan.is_none_or(|plan| plan.holds(&node, &self.source))
            {
                coordinates.push(QueryCoordinate::from(ctx.coordinate(&node, indexes[indexes.len() - 1])));
                if coordinates.len() as u32 >= limit {
                    return Ok(DescendantBatch { coordinates, resume: Some(path), origin });
                }
            }
        }
        Ok(DescendantBatch { coordinates, resume: None, origin })
    }

    /// Step `cursor` to the next node in pre-order below the walk's start, at
    /// most `depth` levels down and never into an extra, keeping `indexes`
    /// and `path` in step; `false` once the walk is done. The cursor numbers
    /// from the start, whose own index is `start`.
    fn advance(cursor: &mut tree_sitter::TreeCursor<'_>, start: u32, indexes: &mut Vec<u32>, path: &mut Vec<u32>, depth: usize) -> bool {
        if indexes.len() <= depth && !cursor.node().is_extra() && cursor.goto_first_child() {
            indexes.push(start + cursor.descendant_index() as u32);
            path.push(0);
            return true;
        }
        loop {
            if indexes.len() == 1 {
                return false;
            }
            if cursor.goto_next_sibling() {
                if let Some(last) = path.last_mut() {
                    *last += 1;
                }
                *indexes.last_mut().expect("an index below the start") = start + cursor.descendant_index() as u32;
                return true;
            }
            cursor.goto_parent();
            indexes.pop();
            path.pop();
        }
    }

    /// Every ERROR and MISSING region of the parse (`error_regions`).
    pub fn error_regions(&self) -> Vec<ErrorRegion> {
        error_regions(&self.tree)
    }

    /// The tree's layer of the render options: what its source sets apart
    /// from the engine's (`InferredOptions`).
    pub fn inferred(&self) -> &crate::options::InferredOptions {
        &self.inferred
    }

    /// The tree's layer as the options object a render takes.
    pub fn inferred_options(&self) -> serde_json::Value {
        self.inferred.to_json(self.grammar.option_tables())
    }

    /// Access the source string.
    pub fn source(&self) -> &str {
        &self.source
    }

    /// The siblings beside the node at `index` (`siblings`).
    pub fn siblings(&self, index: u32) -> Siblings {
        siblings(&self.tree, index)
    }

    /// The whitespace member a run holding a line break reads as: among the
    /// grammar's layout kinds whose text holds a break, the one of its seam
    /// rank (`classify_whitespace`).
    pub fn layout_kind(&self, run: &str) -> Option<u16> {
        let (table, kinds) = self.grammar.whitespace();
        let breaking: Vec<u16> = kinds.iter().copied().filter(|&kind| (table.text_of)(kind).contains('\n')).collect();
        crate::classify::classify_whitespace(run, &breaking, table)
    }

    /// The tree's trivia table, assigned on first use.
    pub fn trivia_table(&self) -> &TriviaTable {
        self.trivia.get_or_init(|| TriviaTable::assign(&self.tree, &self.source, self.grammar.surface_kinds(), self.level_width))
    }

    /// The entries of `side` of the node at `index`: the ones a write gave it,
    /// else the assigned ones, each as a value. An extra is its coordinate, an
    /// `ERROR` its kind and source text, and a layout run its whitespace
    /// member.
    pub fn trivia_side(&self, index: u32, side: TriviaSide) -> Vec<TriviaEntry<G::Trivia>> {
        self.side_entries(index, side, false).into_iter().map(SideEntry::into_entry).collect()
    }

    /// `trivia_side` with where each entry came from, and when `edge_changed`
    /// as a changed edge keeps it (`trivia::on_changed_edge`).
    pub fn side_entries(&self, index: u32, side: TriviaSide, edge_changed: bool) -> Vec<SideEntry<G::Trivia>> {
        let mut entries: Vec<SideEntry<G::Trivia>> = match self.written.get(&(index, side)) {
            Some(written) => written.iter().cloned().map(SideEntry::Written).collect(),
            None => self.assigned_side(index, side),
        };
        if edge_changed {
            crate::trivia::on_changed_edge(
                &mut entries,
                side,
                |entry| match entry {
                    SideEntry::Layout(_) => true,
                    SideEntry::Written(entry) => entry.is_layout(),
                    SideEntry::Source { .. } => false,
                },
                |entry| match entry {
                    SideEntry::Layout(entry) | SideEntry::Written(entry) => entry.depth(),
                    SideEntry::Source { .. } => 0,
                },
                Self::depth_member,
            );
        }
        entries
    }

    fn depth_member(delta: i32) -> Option<SideEntry<G::Trivia>> {
        <G::Trivia as crate::trivia::TriviaSeam>::depth_member(delta).map(|member| SideEntry::Layout(TriviaEntry::new(SlotValue::Transport(member))))
    }

    fn assigned_side(&self, index: u32, side: TriviaSide) -> Vec<SideEntry<G::Trivia>> {
        let assigned = self.trivia_table().side(index, side);
        if assigned.is_empty() {
            return Vec::new();
        }
        let ctx = self.read_ctx();
        let entry = TriviaEntry::new;
        let depth = |count: i32| (0..count.unsigned_abs()).filter_map(move |_| Self::depth_member(count));
        assigned
            .iter()
            .flat_map(|assigned| -> Vec<SideEntry<G::Trivia>> {
                match *assigned {
                    Assigned::Extra(at) => node_at_index(&self.tree, at)
                        .and_then(|node| {
                            let coord = ctx.coordinate(&node, at);
                            let (kind, span) = (coord.kind?, coord.span);
                            Some(SideEntry::Source { entry: entry(SlotValue::Coord(coord)), kind, span, adjacent: None })
                        })
                        .into_iter()
                        .collect(),
                    Assigned::Error(at) => node_at_index(&self.tree, at)
                        .map(|node| {
                            let span = Span { start: node.start_byte() as u32, end: node.end_byte() as u32 };
                            let kind = KindId(node.grammar_id());
                            let adjacent = Some(error_adjacency(&node, &self.source));
                            let text = TriviaText::of_source(kind, &self.source, span, adjacent, None);
                            SideEntry::Source { entry: entry(SlotValue::Transport(G::Trivia::from_text(text))), kind, span, adjacent }
                        })
                        .into_iter()
                        .collect(),
                    Assigned::Layout { start, end, depth: count, .. } => {
                        let run = &self.source[start as usize..end as usize];
                        let breaks = self
                            .layout_kind(run)
                            .and_then(|kind| G::Trivia::from_layout(KindId(kind), run))
                            .map(|member| SideEntry::Layout(entry(SlotValue::Transport(member))));
                        breaks.into_iter().chain(depth(count)).collect()
                    }
                    Assigned::Member(at) => node_at_index(&self.tree, at)
                        .and_then(|node| G::Trivia::from_layout(KindId(node.grammar_id()), &self.source[node.start_byte()..node.end_byte()]))
                        .map(|member| SideEntry::Layout(entry(SlotValue::Transport(member))))
                        .into_iter()
                        .collect(),
                    Assigned::Depth(count) => depth(count).collect(),
                }
            })
            .collect()
    }

    /// Whether the node at `index` is empty (`trivia_table::is_empty`): no
    /// child of it has width, so its trivia is its `inner`.
    pub fn is_empty(&self, index: u32) -> bool {
        node_at_index(&self.tree, index).is_some_and(|node| crate::trivia_table::is_empty(&node))
    }

    /// Replace `side` of the node at `index` with `entries`.
    pub fn write_trivia_side(&mut self, index: u32, side: TriviaSide, entries: Vec<TriviaEntry<G::Trivia>>) {
        self.written.insert((index, side), entries);
    }

    /// Whether a write replaced a side of a node under the node at `index`:
    /// of a descendant, or of the node's own `inner`, and of its own leading
    /// and trailing too when `own_sides` is set.
    pub fn edited_within(&self, index: u32, own_sides: bool) -> bool {
        let Some(node) = node_at_index(&self.tree, index) else { return false };
        let end = index + node.descendant_count() as u32;
        self.written
            .range((index, TriviaSide::Leading)..(end, TriviaSide::Leading))
            .any(|(&(at, side), _)| at != index || own_sides || side == TriviaSide::Inner)
    }
}

impl<G: EngineGrammar> crate::read::SideLookup for ParsedTree<G> {
    fn side(&self, index: u32, side: TriviaSide, edge_changed: bool) -> Box<dyn std::any::Any> {
        Box::new(self.side_entries(index, side, edge_changed))
    }
}

// ─── Engine ──────────────────────────────────────────────────────────────────

/// Stateless native engine — parser + grammar config + render options.
///
/// The engine owns the parser (which is mutable for `parse` calls) and its
/// resolved render options. Parsing returns a [`ParsedTree`] that owns all
/// tree-dependent state.
pub struct Engine<G: EngineGrammar> {
    grammar: G,
    parser: tree_sitter::Parser,
    /// The render options resolved once at construction; a render call may
    /// resolve another table over this one.
    options: ResolvedOptions,
}

impl<G: EngineGrammar> Engine<G> {
    pub fn new(grammar: G, options: ResolvedOptions) -> Result<Self, String> {
        let mut parser = tree_sitter::Parser::new();
        grammar.configure_parser(&mut parser)?;
        Ok(Self {
            grammar,
            parser,
            options,
        })
    }

    pub fn options(&self) -> &ResolvedOptions {
        &self.options
    }

    pub fn render_module_hash(&self) -> &'static str {
        self.grammar.render_module_hash()
    }

    /// Parse source and return an owned `ParsedTree` tagged with `tree_id`.
    ///
    /// The caller owns id assignment because it owns the set of live trees;
    /// ids must be distinct across every tree a caller can still reach, or
    /// handles stop being unambiguous.
    pub fn parse(&mut self, source: String, tree_id: u32) -> Result<ParsedTree<G>, String> {
        let tree = self.parser.parse(&source, None).ok_or_else(|| {
            let snippet: String = source.chars().take(80).collect();
            format!("parse failed (source: {snippet:?})")
        })?;
        let (whitespace, _) = self.grammar.whitespace();
        let root = KindId(tree.root_node().grammar_id());
        let inferred = crate::options::InferredOptions::infer(&source, root, &self.options, self.grammar.option_tables(), whitespace);
        let indent = inferred.indent.as_deref().unwrap_or(&self.options.indent);
        let spaces = |unit: &str| unit.chars().filter(|&c| c == ' ').count() as u32;
        let level_width = [spaces(indent), spaces(&self.options.indent), 1].into_iter().find(|&width| width > 0).unwrap_or(1);
        Ok(ParsedTree {
            grammar: self.grammar,
            tree,
            source: Arc::from(source.as_str()),
            inferred,
            level_width,
            tree_id,
            lines: std::sync::OnceLock::new(),
            trivia: std::sync::OnceLock::new(),
            written: std::collections::BTreeMap::new(),
        })
    }

    pub fn find_and_read(&mut self, _source: String, _pattern: String) -> Result<String, String> {
        Err("find_and_read not yet implemented — ast-grep-core integration pending".to_string())
    }

}

pub fn panic_msg(payload: Box<dyn std::any::Any + Send>, fallback: &str) -> String {
    if let Some(s) = payload.downcast_ref::<String>() {
        s.clone()
    } else if let Some(s) = payload.downcast_ref::<&str>() {
        s.to_string()
    } else {
        fallback.to_string()
    }
}

/// The engine's live trees as the render context's source table: a handle's
/// tag names the tree, and the tree owns the source its spans index into.
impl<G: EngineGrammar> SourceTable for HashMap<u32, ParsedTree<G>> {
    fn source_of(&self, tree_id: u32) -> Option<&Arc<str>> {
        self.get(&tree_id).map(|tree| &tree.source)
    }

    fn kind_of(&self, coord: &NodeCoordinate) -> Option<KindId> {
        let tree = self.get(&coord.tree)?;
        node_at_index(&tree.tree, coord.index).map(|node| KindId(node.grammar_id()))
    }

    fn line_starts_inside_tokens(&self, coord: &NodeCoordinate) -> Vec<usize> {
        let Some(tree) = self.get(&coord.tree) else { return Vec::new() };
        node_at_index(&tree.tree, coord.index).map_or_else(Vec::new, |node| line_starts_inside_tokens(node, coord.index, &tree.source))
    }

    fn last_list_child_kind(&self, tree: u32, span: crate::types::Span, kind: KindId) -> Option<KindId> {
        let tree = self.get(&tree)?;
        last_list_child(&tree.tree, span.start as usize, span.end as usize, kind.0)
            .map(|child| KindId(child.grammar_id()))
    }

    fn sides(&self, coord: &NodeCoordinate) -> Option<Box<dyn crate::trivia::FramedTrivia>> {
        let tree = self.get(&coord.tree)?;
        let side = |side: TriviaSide| {
            let entries: Vec<_> = tree.side_entries(coord.index, side, coord.changed().on(side)).into_iter().map(SideEntry::into_entry).collect();
            (!entries.is_empty()).then_some(entries)
        };
        let trivia = crate::trivia::TransportTrivia { leading: side(TriviaSide::Leading), trailing: side(TriviaSide::Trailing), inner: side(TriviaSide::Inner) };
        (trivia.leading.is_some() || trivia.trailing.is_some() || trivia.inner.is_some()).then(|| Box::new(trivia) as Box<dyn crate::trivia::FramedTrivia>)
    }

    fn framed_span(&self, coord: &NodeCoordinate) -> Span {
        let Some(tree) = self.get(&coord.tree) else { return coord.span };
        let spans = |side: TriviaSide| {
            tree.side_entries(coord.index, side, coord.changed().on(side)).into_iter().filter_map(|entry| match entry {
                SideEntry::Source { span, .. } => Some(span),
                SideEntry::Layout(_) | SideEntry::Written(_) => None,
            })
        };
        Span {
            start: spans(TriviaSide::Leading).map(|span| span.start).min().map_or(coord.span.start, |start| start.min(coord.span.start)),
            end: spans(TriviaSide::Trailing).map(|span| span.end).max().map_or(coord.span.end, |end| end.max(coord.span.end)),
        }
    }

    fn edited_within(&self, coord: &NodeCoordinate) -> bool {
        self.get(&coord.tree).is_some_and(|tree| tree.edited_within(coord.index, false))
    }

    fn read_ctx(&self, tree: u32) -> Option<(&tree_sitter::Tree, crate::read::ReadCtx<'_>)> {
        let parsed = self.get(&tree)?;
        Some((&parsed.tree, parsed.seating_ctx()))
    }

    fn for_each_kind_ending_with(&self, coord: &NodeCoordinate, f: &mut dyn FnMut(KindId)) {
        let Some(tree) = self.get(&coord.tree) else {
            return;
        };
        let mut node = node_at_index(&tree.tree, coord.index);
        let exact = node.is_some_and(|n| {
            n.start_byte() == coord.span.start as usize && n.end_byte() == coord.span.end as usize
        });
        while let Some(current) = node {
            f(KindId(current.grammar_id()));
            if !exact {
                return;
            }
            node = u32::try_from(current.child_count())
                .ok()
                .and_then(|count| count.checked_sub(1))
                .and_then(|last| current.child(last))
                .filter(|last| last.end_byte() == current.end_byte());
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn counter_exhaustion_does_not_wrap_or_reuse_an_id() {
        use std::sync::atomic::{AtomicU32, Ordering::Relaxed};

        let counter = AtomicU32::new(MAX_TREE_ID - 1);
        assert_eq!(claim_tree_id_from_counter(&counter), Some(MAX_TREE_ID - 1));
        assert_eq!(claim_tree_id_from_counter(&counter), Some(MAX_TREE_ID));
        assert_eq!(claim_tree_id_from_counter(&counter), None);
        assert_eq!(claim_tree_id_from_counter(&counter), None);
        assert_eq!(counter.load(Relaxed), MAX_TREE_ID + 1);
    }

    #[test]
    fn concurrent_counter_claims_are_unique() {
        use std::sync::{atomic::AtomicU32, Arc, Barrier};

        let counter = Arc::new(AtomicU32::new(0));
        let barrier = Arc::new(Barrier::new(8));
        let threads: Vec<_> = (0..8)
            .map(|_| {
                let counter = Arc::clone(&counter);
                let barrier = Arc::clone(&barrier);
                std::thread::spawn(move || {
                    barrier.wait();
                    (0..256)
                        .map(|_| claim_tree_id_from_counter(&counter).unwrap())
                        .collect::<Vec<_>>()
                })
            })
            .collect();
        let mut ids: Vec<_> = threads
            .into_iter()
            .flat_map(|thread| thread.join().unwrap())
            .collect();
        ids.sort_unstable();
        assert_eq!(ids, (0..2048).collect::<Vec<_>>());
    }

    #[derive(Clone, Copy)]
    struct TestGrammar;

    impl EngineGrammar for TestGrammar {
        fn configure_parser(
            self,
            parser: &mut tree_sitter::Parser,
        ) -> std::result::Result<(), String> {
            let language: tree_sitter::Language = tree_sitter_rust::LANGUAGE.into();
            parser
                .set_language(&language)
                .map_err(|e| format!("failed to set parser language: {e}"))
        }

        fn render_module_hash(self) -> &'static str {
            "test"
        }

        fn kind_name(self, _kind: KindId) -> &'static str {
            "test"
        }

        fn shows(self) -> fn(KindId) -> bool {
            |_| false
        }

        type Trivia = TestTrivia;

        fn whitespace(self) -> (&'static crate::render::WhitespaceTable, &'static [u16]) {
            (&TEST_WHITESPACE, &[1, 2])
        }

        fn surface_kinds(self) -> crate::trivia_table::SurfaceKinds {
            crate::trivia_table::SurfaceKinds::default()
        }

        fn option_tables(self) -> &'static crate::options::OptionTables {
            &TEST_TABLES
        }
    }

    static TEST_TABLES: crate::options::OptionTables = crate::options::OptionTables {
        addresses: &[],
        allowed: |_| &[],
        delimiter_allowed: |_| 0,
        depth_sites: &[],
        indent: 0,
        dedent: 0,
        indent_chars: " \t",
        newline_arms: &["\n"],
    };

    /// A trivia type with text and one whitespace member, the break (kind 2).
    #[derive(Debug, Clone, PartialEq)]
    enum TestTrivia {
        Text(TriviaText),
        Newline,
    }

    impl FromTriviaText for TestTrivia {
        fn from_text(text: TriviaText) -> Self {
            TestTrivia::Text(text)
        }

        fn from_layout(kind: KindId, _: &str) -> Option<Self> {
            (kind == KindId(2)).then_some(TestTrivia::Newline)
        }
    }

    impl crate::render::Render for TestTrivia {
        fn render(&self, w: &mut dyn crate::render::RenderSink) -> crate::render::RenderResult {
            match self {
                TestTrivia::Text(text) => w.text(&text.text),
                TestTrivia::Newline => Ok(()),
            }
        }
    }

    impl crate::trivia::TriviaSeam for TestTrivia {
        fn seam_gap(&self) -> Option<(crate::layout_kinds::LayoutKinds, Option<&str>)> {
            matches!(self, TestTrivia::Newline).then_some((crate::layout_kinds::LayoutKinds::NEWLINE, None))
        }
    }

    impl crate::prepare::Prepare for TestTrivia {
        fn prepare(&mut self, _: &crate::prepare::RenderContext<'_>) -> Result<(), crate::render::CoordinateError> {
            Ok(())
        }
    }

    fn test_spacing_text(kind: u16) -> &'static str {
        match kind {
            1 => " ",
            2 => "\n",
            _ => "",
        }
    }

    const TEST_WHITESPACE: crate::render::WhitespaceTable =
        crate::render::WhitespaceTable { text_of: test_spacing_text, indent: 0, dedent: 0, leaf_edges: &[], gaps: &[] };

    fn rust_tree(source: &str) -> tree_sitter::Tree {
        let mut parser = tree_sitter::Parser::new();
        TestGrammar.configure_parser(&mut parser).unwrap();
        parser.parse(source, None).unwrap()
    }

    #[test]
    fn a_line_inside_a_string_or_block_comment_starts_inside_a_token() {
        let source = "fn f() {\n    let s = \"a\n  b\";\n    /* x\n  y\n*/\n    g();\n}\n";
        let tree = rust_tree(source);
        let b = source.find("  b").unwrap();
        let y = source.find("  y").unwrap();
        let close = source.find("*/").unwrap();
        assert_eq!(line_starts_inside_tokens(tree.root_node(), 0, source), vec![b, y, close]);
    }

    #[test]
    fn lines_between_tokens_start_outside_every_token() {
        let source = "fn f() {\n    g();\n    // c\n    h();\n}\n// d\nfn i() {}\n";
        let tree = rust_tree(source);
        assert_eq!(line_starts_inside_tokens(tree.root_node(), 0, source), Vec::<usize>::new());
    }

    const FNS: &str = "fn a() {}\nmod m { fn b() -> u8 { 0 } fn _c() {} }\nfn _d() { fn e() {} }\n";

    fn kind_id(name: &str) -> u16 {
        let language: tree_sitter::Language = tree_sitter_rust::LANGUAGE.into();
        language.id_for_node_kind(name, true)
    }

    fn parsed(source: &str) -> (ParsedTree<TestGrammar>, u64) {
        let mut engine = Engine::new(TestGrammar, ResolvedOptions::default()).expect("engine");
        let tree = engine.parse(source.to_string(), 1).expect("parse");
        (tree, encode_handle(1, 0))
    }

    #[test]
    fn an_error_node_reads_as_the_bytes_its_coordinate_spans() {
        let (tree, _) = parsed("fn f() {} @@ fn g() {}");
        let index = (0..64).find(|&i| node_at_index(tree.tree(), i).is_some_and(|node| node.is_error())).expect("the parse holds an ERROR");
        let error = tree.read_error(index).expect("an ERROR reads");
        let crate::read::Origin::Tree(at) = &error.at else { panic!("a live read names a coordinate") };
        assert_eq!((error.text.as_str(), at.span.start, at.span.end), ("@@", 10, 12));
        assert_eq!((error.kind, at.kind, at.tree), (Some(KindId(u16::MAX)), Some(KindId(u16::MAX)), 1));
        assert_eq!(tree.read_error(0), None);
        let snapped = tree.snapshot_error(index, None).expect("an ERROR snapshots");
        let span = crate::points::PointSpan { start: crate::points::Point::ZERO, end: crate::points::Point { row: 0, column: 2 } };
        assert_eq!((snapped.text.as_str(), snapped.at), ("@@", crate::read::Origin::Snapshot(span)));
    }

    fn texts(tree: &ParsedTree<TestGrammar>, found: &[QueryCoordinate]) -> Vec<String> {
        found
            .iter()
            .map(|coord| tree.source()[coord.span.start as usize..coord.span.end as usize].lines().next().unwrap_or("").to_string())
            .collect()
    }

    fn walk(tree: &ParsedTree<TestGrammar>, root: u64, kinds: &[u16], plan: Option<&Plan>, limit: u32) -> Vec<QueryCoordinate> {
        let mut found = Vec::new();
        let mut resume: Option<Vec<u32>> = None;
        loop {
            let batch = tree.descendants(crate::query::Address::Own { handle: root }, kinds, plan, resume.as_deref(), limit, None).expect("walk");
            assert!(batch.coordinates.len() as u32 <= limit);
            found.extend(batch.coordinates);
            match batch.resume {
                Some(path) => resume = Some(path),
                None => return found,
            }
        }
    }

    fn plan(json: &str) -> Plan {
        Plan::compile(serde_json::from_str(json).expect("plan json")).expect("plan compiles")
    }

    /// The descendant index of every node of `tree`, by its id.
    fn indexes(tree: &tree_sitter::Tree) -> std::collections::HashMap<usize, u32> {
        let mut out = std::collections::HashMap::new();
        let mut cursor = tree.walk();
        loop {
            out.insert(cursor.node().id(), cursor.descendant_index() as u32);
            if cursor.goto_first_child() {
                continue;
            }
            loop {
                if cursor.goto_next_sibling() {
                    break;
                }
                if !cursor.goto_parent() {
                    return out;
                }
            }
        }
    }

    #[test]
    fn each_coordinate_names_its_own_node_by_its_descendant_index() {
        let (tree, root) = parsed(FNS);
        let expected = indexes(&tree.tree);
        for coord in walk(&tree, root, &[], None, u32::MAX) {
            let index = decode_handle(coord.handle).1;
            let node = node_at_index(&tree.tree, index).expect("the coordinate names a node");
            assert_eq!(Some(&index), expected.get(&node.id()));
            assert_eq!((node.start_byte() as u32, node.end_byte() as u32, node.grammar_id()), (coord.span.start, coord.span.end, coord.kind));
        }
    }

    #[test]
    fn a_nodes_siblings_are_those_beside_it_that_hold_sides() {
        let (tree, _) = parsed("fn f() {}\n// c\nfn g() {}\n");
        let f = index_of_kind(&tree, "function_item", 0);
        let g = index_of_kind(&tree, "function_item", 1);
        let item = node_at_index(&tree.tree, f).unwrap().grammar_id();
        let sibling = |start, end| Some(Sibling { start, end, kind: item });
        assert_eq!(tree.siblings(f), Siblings { previous: None, next: sibling(15, 24) });
        assert_eq!(tree.siblings(g), Siblings { previous: sibling(0, 9), next: None }, "the comment between them holds no sides");
        assert_eq!(tree.siblings(tree.tree.root_node().descendant_count() as u32), Siblings::default());
    }

    #[test]
    fn a_walk_from_a_deep_start_hands_out_root_indexes() {
        let (tree, root) = parsed(FNS);
        let expected = indexes(&tree.tree);
        let module = tree.descendants(Address::Own { handle: root }, &[kind_id("mod_item")], None, None, 1, None).expect("walk");
        let start = Address::Own { handle: module.coordinates[0].handle };
        let inner = tree.descendants(start, &[kind_id("function_item")], None, None, 16, None).expect("walk");
        assert_eq!(inner.coordinates.len(), 2, "fn b and fn _c");
        for coord in &inner.coordinates {
            let node = node_at_index(&tree.tree, decode_handle(coord.handle).1).expect("the coordinate names a node");
            assert_eq!(Some(&decode_handle(coord.handle).1), expected.get(&node.id()));
            assert_eq!((node.start_byte() as u32, node.end_byte() as u32, node.grammar_id()), (coord.span.start, coord.span.end, coord.kind));
        }
    }

    #[test]
    fn descendants_of_a_kind_come_in_pre_order() {
        let (tree, root) = parsed(FNS);
        let stubs = walk(&tree, root, &[kind_id("function_item")], None, u32::MAX);
        assert_eq!(texts(&tree, &stubs), ["fn a() {}", "fn b() -> u8 { 0 }", "fn _c() {}", "fn _d() { fn e() {} }", "fn e() {}"]);
    }

    #[test]
    fn every_batch_limit_yields_the_same_descendants() {
        let (tree, root) = parsed(FNS);
        let all = walk(&tree, root, &[], None, u32::MAX);
        for limit in [1, 2, 3, 4, 16] {
            let batched = walk(&tree, root, &[], None, limit);
            assert_eq!(texts(&tree, &batched), texts(&tree, &all), "limit {limit}");
        }
    }

    #[test]
    fn a_where_plan_selects_by_a_slot_text() {
        let (tree, root) = parsed(FNS);
        let fns = [kind_id("function_item")];
        let eq = plan(r#"{ "op": "eq", "fields": ["name"], "kinds": [], "text": "b" }"#);
        let eq_stubs = walk(&tree, root, &fns, Some(&eq), 1);
        assert_eq!(texts(&tree, &eq_stubs), ["fn b() -> u8 { 0 }"]);
        let private = plan(r#"{ "op": "and", "of": [{ "op": "match", "fields": ["name"], "kinds": [], "pattern": "^_" }, { "op": "not", "of": { "op": "eq", "fields": ["name"], "kinds": [], "text": "_c" } }] }"#);
        let private_stubs = walk(&tree, root, &fns, Some(&private), 1);
        assert_eq!(texts(&tree, &private_stubs), ["fn _d() { fn e() {} }"]);
        let typed = plan(r#"{ "op": "or", "of": [{ "op": "eq", "fields": ["return_type"], "kinds": [], "text": "u8" }, { "op": "eq", "fields": ["name"], "kinds": [], "text": "e" }] }"#);
        let typed_stubs = walk(&tree, root, &fns, Some(&typed), 4);
        assert_eq!(texts(&tree, &typed_stubs), ["fn b() -> u8 { 0 }", "fn e() {}"]);
    }

    #[test]
    fn a_route_by_kind_admits_only_children_under_no_field() {
        let (tree, root) = parsed(FNS);
        let lists = [kind_id("declaration_list"), kind_id("block")];
        let by_kind = plan(r#"{ "op": "match", "fields": [], "kinds": ["function_item"], "pattern": "^fn e" }"#);
        let blocks = walk(&tree, root, &lists, Some(&by_kind), 4);
        assert_eq!(texts(&tree, &blocks), ["{ fn e() {} }"]);
        let named_not_kind = plan(r#"{ "op": "eq", "fields": [], "kinds": ["identifier"], "text": "b" }"#);
        assert!(walk(&tree, root, &[kind_id("function_item")], Some(&named_not_kind), 4).is_empty());
    }

    fn walk_from(tree: &ParsedTree<TestGrammar>, from: crate::query::Address, kinds: &[u16]) -> Vec<String> {
        let batch = tree.descendants(from, kinds, None, None, u32::MAX, None).expect("walk");
        texts(tree, &batch.coordinates)
    }

    #[test]
    fn a_walk_starts_from_a_coordinate_address() {
        let (tree, root) = parsed(FNS);
        let fns = [kind_id("function_item")];
        let module = walk(&tree, root, &[kind_id("mod_item")], None, u32::MAX).remove(0);
        assert_eq!(walk_from(&tree, crate::query::Address::Own { handle: module.handle }, &fns), ["fn b() -> u8 { 0 }", "fn _c() {}"]);
    }

    #[test]
    fn a_plan_holds_over_a_list_of_addresses_in_order() {
        let (tree, root) = parsed(FNS);
        let found = walk(&tree, root, &[kind_id("function_item")], None, u32::MAX);
        let addresses: Vec<crate::query::Address> = found.iter().map(|coord| crate::query::Address::Own { handle: coord.handle }).collect();
        let private = plan(r#"{ "op": "match", "fields": ["name"], "kinds": [], "pattern": "^_" }"#);
        assert_eq!(tree.plan_holds(&addresses, &private).expect("holds"), [false, false, true, true, false]);
        let elsewhere = crate::query::Address::Own { handle: encode_handle(9, 0) };
        assert!(tree.plan_holds(&[elsewhere], &private).is_err());
    }

    #[test]
    fn a_depth_limit_stops_the_walk_below_it() {
        let (tree, root) = parsed(FNS);
        let children = tree.descendants(crate::query::Address::Own { handle: root }, &[], None, None, u32::MAX, Some(1)).expect("walk");
        assert_eq!(texts(&tree, &children.coordinates), ["fn a() {}", "mod m { fn b() -> u8 { 0 } fn _c() {} }", "fn _d() { fn e() {} }"]);
        let mut resumed = Vec::new();
        let mut resume: Option<Vec<u32>> = None;
        loop {
            let batch = tree.descendants(crate::query::Address::Own { handle: root }, &[], None, resume.as_deref(), 1, Some(1)).expect("walk");
            resumed.extend(batch.coordinates);
            match batch.resume {
                Some(path) => resume = Some(path),
                None => break,
            }
        }
        assert_eq!(texts(&tree, &resumed), texts(&tree, &children.coordinates));
    }

    #[test]
    fn an_extra_and_its_interior_are_never_descendants() {
        let (tree, root) = parsed("/// doc\nfn a() {}\n");
        let kinds: Vec<u16> = walk(&tree, root, &[], None, u32::MAX).iter().map(|coord| coord.kind).collect();
        for extra in ["line_comment", "doc_comment", "outer_doc_comment_marker"] {
            assert!(!kinds.contains(&kind_id(extra)), "{extra} walked");
        }
        assert!(kinds.contains(&kind_id("function_item")));
    }

    #[test]
    fn a_pattern_the_native_matcher_cannot_compile_is_refused() {
        let spec = serde_json::from_str(r#"{ "op": "match", "fields": ["name"], "kinds": [], "pattern": "(a)\\1" }"#).expect("plan json");
        assert!(Plan::compile(spec).is_err());
    }

    fn index_of_kind(tree: &ParsedTree<TestGrammar>, kind: &str, nth: usize) -> u32 {
        (0..tree.tree().root_node().descendant_count() as u32)
            .filter(|&at| node_at_index(tree.tree(), at).is_some_and(|node| node.kind() == kind))
            .nth(nth)
            .unwrap_or_else(|| panic!("no {kind} number {nth}"))
    }

    #[test]
    fn a_side_reads_an_extra_as_its_coordinate_and_a_layout_run_as_its_member() {
        let (tree, _) = parsed("// c\nfn f() {}\n");
        let f = index_of_kind(&tree, "function_item", 0);
        let comment = index_of_kind(&tree, "line_comment", 0);
        let leading = tree.trivia_side(f, TriviaSide::Leading);
        let SlotValue::Coord(coord) = &leading[0].value else { panic!("an extra reads as its coordinate: {leading:?}") };
        assert_eq!((coord.tree, coord.index, coord.span.start, coord.span.end), (1, comment, 0, 4));
        let newline = TriviaEntry::new(SlotValue::Transport(TestTrivia::Newline));
        assert_eq!(leading[1..], *std::slice::from_ref(&newline));
        assert_eq!(tree.trivia_side(f, TriviaSide::Trailing), [newline]);
    }

    #[test]
    fn a_same_line_trailing_comment_has_no_line_break_before_it() {
        let (tree, _) = parsed("fn f() {} // c\nfn g() {}\n");
        let f = index_of_kind(&tree, "function_item", 0);
        let trailing = tree.trivia_side(f, TriviaSide::Trailing);
        assert!(matches!(trailing.first().map(|entry| &entry.value), Some(SlotValue::Coord(_))), "{trailing:?}");
    }

    #[test]
    fn a_changed_edge_drops_the_layout_runs_between_the_side_and_its_neighbour() {
        let (tree, _) = parsed("// c\nfn f() {}\n");
        let f = index_of_kind(&tree, "function_item", 0);
        let runs = |side, changed| tree.side_entries(f, side, changed).into_iter().map(|entry| SideEntry::into_entry(entry).value).collect::<Vec<_>>();
        assert_eq!(runs(TriviaSide::Leading, true), runs(TriviaSide::Leading, false), "the run between the comment and its owner stays");
        assert_eq!(runs(TriviaSide::Trailing, false).len(), 1);
        assert_eq!(runs(TriviaSide::Trailing, true), [], "the run after the owner spelled the gap to its old neighbour");
    }

    #[test]
    fn an_error_in_a_side_reads_as_its_kind_and_source_text_with_the_runs_beside_it_on_its_line() {
        let (tree, _) = parsed("fn f() {} @@ fn g() {}");
        let sides = (0..tree.tree().root_node().descendant_count() as u32)
            .flat_map(|at| [TriviaSide::Leading, TriviaSide::Trailing, TriviaSide::Inner].map(|side| tree.trivia_side(at, side)))
            .flatten()
            .collect::<Vec<_>>();
        let text = TriviaText { kind: KindId(u16::MAX), text: "@@".to_owned(), span: None, before: Some(" ".to_owned()), after: Some(" ".to_owned()) };
        assert!(sides.contains(&TriviaEntry::new(SlotValue::Transport(TestTrivia::Text(text)))), "{sides:?}");
    }

    #[test]
    fn a_written_side_replaces_the_assigned_one_and_marks_its_ancestors_edited() {
        let (mut tree, _) = parsed("fn f() { a(); }\nfn g() {}\n");
        let f = index_of_kind(&tree, "function_item", 0);
        let g = index_of_kind(&tree, "function_item", 1);
        let a = index_of_kind(&tree, "expression_statement", 0);
        let written = vec![TriviaEntry::new(SlotValue::Transport(TestTrivia::Text(TriviaText { kind: KindId(1), text: "// w".to_owned(), span: None, before: None, after: None })))];
        tree.write_trivia_side(a, TriviaSide::Leading, written.clone());
        assert_eq!(tree.trivia_side(a, TriviaSide::Leading), written);
        assert!(tree.edited_within(0, false));
        assert!(tree.edited_within(f, false));
        assert!(!tree.edited_within(g, false));
        assert!(!tree.edited_within(a, false), "a node's own leading is not within it");
        assert!(tree.edited_within(a, true));
    }

    #[test]
    fn a_written_inner_side_is_within_its_own_node() {
        let (mut tree, _) = parsed("fn f() {}\n");
        let block = index_of_kind(&tree, "block", 0);
        tree.write_trivia_side(block, TriviaSide::Inner, Vec::new());
        assert!(tree.edited_within(block, false));
    }

    fn table(tree: ParsedTree<TestGrammar>) -> HashMap<u32, ParsedTree<TestGrammar>> {
        HashMap::from([(1, tree)])
    }

    fn coordinate(tree: &ParsedTree<TestGrammar>, index: u32) -> NodeCoordinate {
        let node = node_at_index(tree.tree(), index).expect("a node");
        NodeCoordinate::new(1, index, index + node.descendant_count() as u32, crate::types::Span { start: node.start_byte() as u32, end: node.end_byte() as u32 })
    }

    #[test]
    fn the_tree_table_gives_a_coordinate_its_sides() {
        let (tree, _) = parsed("// c\nfn f() {}\n");
        let f = coordinate(&tree, index_of_kind(&tree, "function_item", 0));
        let leading = tree.trivia_side(f.index, TriviaSide::Leading);
        let trailing = tree.trivia_side(f.index, TriviaSide::Trailing);
        let sources = table(tree);
        let sides = sources.sides(&f).expect("the function has sides");
        let sides = sides.as_any().downcast_ref::<crate::trivia::TransportTrivia<TestTrivia>>().expect("the grammar's trivia");
        assert_eq!((sides.leading.as_deref(), sides.trailing.as_deref(), sides.inner.as_deref()), (Some(&leading[..]), Some(&trailing[..]), None));
    }

    #[test]
    fn a_coordinate_with_no_side_has_no_frame() {
        let (tree, _) = parsed("fn f() { a(); }\n");
        let a = coordinate(&tree, index_of_kind(&tree, "call_expression", 0));
        assert!(table(tree).sides(&a).is_none());
    }

    #[test]
    fn the_tree_table_answers_whether_a_coordinates_range_holds_a_write() {
        let (mut tree, _) = parsed("fn f() { a(); }\nfn g() {}\n");
        let f = coordinate(&tree, index_of_kind(&tree, "function_item", 0));
        let g = coordinate(&tree, index_of_kind(&tree, "function_item", 1));
        tree.write_trivia_side(index_of_kind(&tree, "expression_statement", 0), TriviaSide::Leading, Vec::new());
        let sources = table(tree);
        assert!(sources.edited_within(&f));
        assert!(!sources.edited_within(&g));
    }

    #[test]
    fn the_tree_table_hands_out_a_tree_and_its_read_context() {
        let (tree, _) = parsed("fn f() {}\n");
        let sources = table(tree);
        let (tree, ctx) = sources.read_ctx(1).expect("tree 1 is live");
        assert_eq!(tree.root_node().kind(), "source_file");
        assert_eq!(ctx.text(&tree.root_node()), "fn f() {}\n");
        assert!(sources.read_ctx(2).is_none());
    }

    #[test]
    fn a_value_with_no_read_reads_no_coordinate() {
        let (tree, _) = parsed("fn f() {}\n");
        let sources = table(tree);
        let (tree, ctx) = sources.read_ctx(1).expect("tree 1 is live");
        assert!(<TestTrivia as crate::prepare::Prepare>::read_coordinate(tree, &ctx, 0).is_none());
    }
}
