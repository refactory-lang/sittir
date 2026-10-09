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
//! `ParsedTree<G>` that owns the tree, source and format. A handle names a
//! node by its tree's id and its descendant index, re-resolved through a
//! cursor on each access — no lifetime-erasure needed.

use crate::format::{apply_format, extract_format};
use crate::options::ResolvedOptions;
use crate::query::{Address, DescendantBatch, Plan, QueryCoordinate};
use crate::read::{display_id, survey, Child, ReadCtx, ReadError, Sides};
use crate::types::Span;
use crate::render::SourceTable;
use crate::slot::NodeCoordinate;
use crate::types::{FormatRecord, KindId, Source};
use std::collections::HashMap;
use std::sync::Arc;

/// Grammar-specific hooks used by the shared native engine.
pub trait EngineGrammar: Copy {
    fn configure_parser(self, parser: &mut tree_sitter::Parser) -> Result<(), String>;
    fn render_module_hash(self) -> &'static str;
    /// The name of a kind of this grammar, for messages that name one.
    fn kind_name(self, kind: KindId) -> &'static str;
    /// The sides the placement of the node the cursor is on gives its child
    /// at descendant `index` (`ReadTransport::sides_of` of the grammar's
    /// transports, dispatched by the node's kind).
    fn sides_at(self, cursor: &mut tree_sitter::TreeCursor<'_>, ctx: &ReadCtx<'_>, index: u32) -> Result<Sides, ReadError>;
    /// The display ids this grammar claims a node by (`ReadTransport::shows`
    /// of its transports), which a coordinate stamps in place of the grammar id.
    fn shows(self) -> fn(KindId) -> bool;
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

/// The descendant index of child `position` of the node at `index`: its own
/// index, one for the node, and every earlier child's descendant count.
pub fn child_index_of(node: tree_sitter::Node<'_>, index: u32, position: u32) -> u32 {
    (0..position).fold(index + 1, |at, i| at + node.child(i).map_or(0, |child| child.descendant_count() as u32))
}

/// One line-break run of a node's leading or closing gap: the whitespace
/// member it reads as and the byte its run starts at.
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize)]
pub struct LineGap {
    pub kind: u16,
    pub start: usize,
}

/// The line-break runs a node owns, in source order on each side, and the
/// owners beside it among its siblings, taken at the outermost node spanning
/// exactly its bytes (a list item's wrapper holds the item's neighbours, not
/// the item): the sibling owner before it, or none when that node is its
/// parent's first, and the sibling owner after it, or none when that node is
/// its parent's last.
#[derive(Debug, Clone, Default, PartialEq, Eq, serde::Serialize)]
pub struct LineGaps {
    pub leading: Vec<LineGap>,
    pub trailing: Vec<LineGap>,
    pub previous: Option<Span>,
    pub next: Option<Span>,
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

/// The whitespace the node at descendant `index` owns as trivia, classified
/// by `classify`, which answers the member a run of whitespace holding a line
/// break reads as. What the node owns is what its parent's placement gives it
/// (`sides_at`, asked with a cursor on the parent): a node that owns no
/// trivia owns no gap, and the extras its sides hold split the gaps.
///
/// The leading gap is the bytes between the node and the sibling before it
/// that is not trivia, unless the parent starts where the node does; an extra
/// there that the node's sides do not hold trails the sibling before it, so
/// the gap starts after it. The closing gap is the bytes between the node and
/// its parent's closing token when no owner follows the node, unless the
/// parent ends where the node does. `previous` and `next` are the sibling
/// owners around the outermost node spanning exactly the node's bytes (a list
/// item's wrapper holds the item's neighbours, not the item).
pub fn line_gaps(
    tree: &tree_sitter::Tree,
    index: u32,
    source: &str,
    sides_at: &dyn Fn(&mut tree_sitter::TreeCursor<'_>, u32) -> Result<Sides, ReadError>,
    classify: &dyn Fn(&str) -> Option<u16>,
) -> Result<LineGaps, ReadError> {
    let mut gaps = LineGaps::default();
    let mut cursor = tree.walk();
    cursor.goto_descendant(index as usize);
    let node = cursor.node();
    let mut at_parent = cursor.clone();
    if !at_parent.goto_parent() {
        return Ok(gaps);
    }
    let sides = sides_at(&mut at_parent.clone(), index)?;
    if !sides.owner {
        return Ok(gaps);
    }
    let push = |side: &mut Vec<LineGap>, start: usize, end: usize| {
        let Some(run) = source.get(start..end) else { return };
        if run.contains('\n') && run.chars().all(char::is_whitespace) {
            if let Some(kind) = classify(run) {
                side.push(LineGap { kind, start });
            }
        }
    };
    let span_of = |child: &Child| Span { start: child.start, end: child.end };
    let mut outer = cursor;
    loop {
        let mut up = outer.clone();
        if !up.goto_parent() || up.node().byte_range() != node.byte_range() {
            break;
        }
        outer = up;
    }
    let outer_index = outer.descendant_index() as u32;
    if outer.goto_parent() {
        let siblings = survey(&mut outer);
        let at = siblings.iter().position(|child| child.index == outer_index).unwrap_or(0);
        let up = outer.node();
        let owner = |child: &&Child| sides_at(&mut outer.clone(), child.index).map(|sides| sides.owner);
        if up.start_byte() != node.start_byte() {
            gaps.previous = nearest_owner(siblings[..at].iter().rev(), owner)?.map(span_of);
        }
        if up.end_byte() != node.end_byte() {
            gaps.next = nearest_owner(siblings[at + 1..].iter(), owner)?.map(span_of);
        }
    }
    let parent = at_parent.node();
    let children = survey(&mut at_parent);
    let at = children.iter().position(|child| child.index == index).unwrap_or(0);
    if parent.start_byte() != node.start_byte() {
        let bound = children[..at].iter().rev().find(|child| !child.trivia).map_or(parent.start_byte() as u32, |child| child.end);
        let held = |child: &Child| sides.leading.iter().any(|entry| entry.coord.span == span_of(child));
        let mut start = bound;
        for child in children[..at].iter().filter(|child| child.trivia && child.start >= bound) {
            if held(child) {
                push(&mut gaps.leading, start as usize, child.start as usize);
            }
            start = child.end;
        }
        push(&mut gaps.leading, start as usize, node.start_byte());
    }
    let owner = |child: &&Child| sides_at(&mut at_parent.clone(), child.index).map(|sides| sides.owner);
    if parent.end_byte() != node.end_byte() && nearest_owner(children[at + 1..].iter(), owner)?.is_none() {
        let end = children[at + 1..].iter().find(|child| !child.trivia).map_or(parent.end_byte() as u32, |child| child.start);
        let mut start = node.end_byte() as u32;
        for entry in sides.trailing.iter().filter(|entry| entry.coord.span.end <= end) {
            push(&mut gaps.trailing, start as usize, entry.coord.span.start as usize);
            start = entry.coord.span.end;
        }
        push(&mut gaps.trailing, start as usize, end as usize);
    }
    Ok(gaps)
}

/// The first of `children`, in the order given, that its parent's placement
/// makes an owner.
fn nearest_owner<'c>(
    mut children: impl Iterator<Item = &'c Child>,
    owner: impl Fn(&&'c Child) -> Result<bool, ReadError>,
) -> Result<Option<&'c Child>, ReadError> {
    children.try_fold(None, |found, child| match found {
        Some(_) => Ok(found),
        None => owner(&child).map(|is| is.then_some(child)),
    })
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
    format: Option<FormatRecord>,
    /// Identity this tree stamps into every handle it mints. Distinct per
    /// parse, so a handle names the tree it belongs to and cannot be spent
    /// against another one.
    tree_id: u32,
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

    /// The node at `index` read into `T`, `depth` levels down, with the sides
    /// its parent's placement gives it; index 0 is the root.
    pub fn read<T: crate::read::ReadTransport>(&self, index: u32, depth: crate::read::Depth) -> Result<T, crate::read::ReadError> {
        let ctx = crate::read::ReadCtx::new(&self.source, self.tree_id, self.grammar.shows());
        crate::read::read_at::<T, T>(&mut self.tree.walk(), &ctx, index, depth)
    }

    /// The `ERROR` node at `index` read as the bytes its coordinate spans, or
    /// `None` when the node there is not an `ERROR`.
    pub fn read_error(&self, index: u32) -> Option<crate::ErrorRead> {
        let node = node_at_index(&self.tree, index).filter(|node| node.is_error())?;
        let at = crate::read::ReadCtx::new(&self.source, self.tree_id, self.grammar.shows()).coordinate(&node, index);
        let text = self.source[at.span.start as usize..at.span.end as usize].to_owned();
        Some(crate::ErrorRead { text, at })
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
    /// walk neither returns nor enters it.
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
        let ctx = crate::read::ReadCtx::new(&self.source, self.tree_id, self.grammar.shows());
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

    /// Access the detected format record (if any).
    pub fn format(&self) -> Option<&FormatRecord> {
        self.format.as_ref()
    }

    /// Access the source string.
    pub fn source(&self) -> &str {
        &self.source
    }

    /// The line-break runs the node named by `handle` owns as trivia
    /// (`line_gaps`), each classified by `classify`.
    pub fn line_gaps_at(&self, handle: u64, classify: &dyn Fn(&str) -> Option<u16>) -> Result<LineGaps, String> {
        let index = self.local_index(handle)?;
        node_at_index(&self.tree, index).ok_or_else(|| format!("handle {handle} names no node of tree {}", self.tree_id))?;
        let ctx = ReadCtx::new(&self.source, self.tree_id, self.grammar.shows());
        let sides_at = |cursor: &mut tree_sitter::TreeCursor<'_>, child: u32| self.grammar.sides_at(cursor, &ctx, child);
        line_gaps(&self.tree, index, &self.source, &sides_at, classify).map_err(|refusal| refusal.describe(&|kind| self.grammar.kind_name(kind)))
    }
}

// ─── Engine ──────────────────────────────────────────────────────────────────

/// Stateless native engine — parser + grammar config + engine-level format.
///
/// The engine owns the parser (which is mutable for `parse` calls) and an
/// optional engine-wide format override. Parsing returns a [`ParsedTree`]
/// that owns all tree-dependent state.
pub struct Engine<G: EngineGrammar> {
    grammar: G,
    parser: tree_sitter::Parser,
    engine_format: Option<FormatRecord>,
    /// The render options resolved once at construction; a render call may
    /// resolve another table over this one.
    options: ResolvedOptions,
}

impl<G: EngineGrammar> Engine<G> {
    pub fn new(
        grammar: G,
        engine_format: Option<FormatRecord>,
        options: ResolvedOptions,
    ) -> Result<Self, String> {
        let mut parser = tree_sitter::Parser::new();
        grammar.configure_parser(&mut parser)?;
        Ok(Self {
            grammar,
            parser,
            engine_format,
            options,
        })
    }

    pub fn options(&self) -> &ResolvedOptions {
        &self.options
    }

    pub fn render_module_hash(&self) -> &'static str {
        self.grammar.render_module_hash()
    }

    /// Access the engine-level format override (if any).
    pub fn engine_format(&self) -> Option<&FormatRecord> {
        self.engine_format.as_ref()
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
        let format = extract_format(&source, &tree, &self.options.indent);
        Ok(ParsedTree {
            grammar: self.grammar,
            tree,
            source: Arc::from(source.as_str()),
            format,
            tree_id,
        })
    }

    pub fn find_and_read(&mut self, _source: String, _pattern: String) -> Result<String, String> {
        Err("find_and_read not yet implemented — ast-grep-core integration pending".to_string())
    }

}

/// Resolve the effective format from source provenance alone. Engine-level
/// format takes priority; tree-level format applies only to non-factory nodes
/// (read from a parse). Factory-constructed nodes get no tree format (they had
/// no original source to preserve).
fn resolve_render_format_from_source<'a>(
    source: Source,
    engine_format: Option<&'a FormatRecord>,
    tree_format: Option<&'a FormatRecord>,
) -> Option<&'a FormatRecord> {
    if let Some(format) = engine_format {
        return Some(format);
    }
    if !matches!(source, Source::Factory) {
        return tree_format;
    }
    None
}

/// Apply format to a pre-rendered canonical string. This is the public
/// standalone API for format application, for any caller that knows the
/// node's provenance.
///
/// Parameters:
/// - `source` — provenance of the node (Ts/Sg/Factory). Controls whether
///   tree-level format is applied.
/// - `canonical` — the template-rendered string to format.
/// - `engine_format` — engine-wide format override (highest priority).
/// - `tree_format` — tree-level format detected from parsed source.
pub fn apply_render_format(
    source: Source,
    canonical: String,
    engine_format: Option<&FormatRecord>,
    tree_format: Option<&FormatRecord>,
) -> String {
    let effective_format = resolve_render_format_from_source(source, engine_format, tree_format);
    match effective_format {
        Some(format) => apply_format(&canonical, format),
        None => canonical,
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

    fn last_list_child_kind(&self, tree: u32, span: crate::types::Span, kind: KindId) -> Option<KindId> {
        let tree = self.get(&tree)?;
        last_list_child(&tree.tree, span.start as usize, span.end as usize, kind.0)
            .map(|child| KindId(child.grammar_id()))
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
    use crate::types::{FormatBoundary, FormatRecord};

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

        fn sides_at(self, _: &mut tree_sitter::TreeCursor<'_>, _: &ReadCtx<'_>, _: u32) -> Result<Sides, ReadError> {
            Ok(Sides::default())
        }

        fn shows(self) -> fn(KindId) -> bool {
            |_| false
        }
    }

    const FNS: &str = "fn a() {}\nmod m { fn b() -> u8 { 0 } fn _c() {} }\nfn _d() { fn e() {} }\n";

    fn kind_id(name: &str) -> u16 {
        let language: tree_sitter::Language = tree_sitter_rust::LANGUAGE.into();
        language.id_for_node_kind(name, true)
    }

    fn parsed(source: &str) -> (ParsedTree<TestGrammar>, u64) {
        let mut engine = Engine::new(TestGrammar, None, ResolvedOptions::default()).expect("engine");
        let tree = engine.parse(source.to_string(), 1).expect("parse");
        (tree, encode_handle(1, 0))
    }

    #[test]
    fn an_error_node_reads_as_the_bytes_its_coordinate_spans() {
        let (tree, _) = parsed("fn f() {} @@ fn g() {}");
        let index = (0..64).find(|&i| node_at_index(tree.tree(), i).is_some_and(|node| node.is_error())).expect("the parse holds an ERROR");
        let error = tree.read_error(index).expect("an ERROR reads");
        assert_eq!((error.text.as_str(), error.at.span.start, error.at.span.end), ("@@", 10, 12));
        assert_eq!((error.at.kind, error.at.tree), (Some(KindId(u16::MAX)), 1));
        assert_eq!(tree.read_error(0), None);
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
    fn a_handle_past_the_last_node_is_refused() {
        let (tree, _) = parsed(FNS);
        let past = encode_handle(1, tree.tree.root_node().descendant_count() as u32);
        assert!(tree.line_gaps_at(past, &|_| None).unwrap_err().contains("names no node"));
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

    fn format_record(prefix: &str, suffix: &str) -> FormatRecord {
        FormatRecord {
            boundary: Some(FormatBoundary {
                leading: Some(prefix.to_string()),
                trailing: Some(suffix.to_string()),
            }),
            slots: None,
            literals: None,
            trivia: None,
            kinds: None,
        }
    }

    #[test]
    fn the_engine_format_wraps_any_render() {
        let engine_format = format_record("<<", ">>");
        assert_eq!(apply_render_format(Source::Factory, "rendered:1".to_string(), Some(&engine_format), None), "<<rendered:1>>");
    }

    #[test]
    fn the_tree_format_wraps_a_read_node() {
        let tree_format = format_record("[", "]");
        assert_eq!(apply_render_format(Source::Ts, "canonical".to_string(), None, Some(&tree_format)), "[canonical]");
    }

    #[test]
    fn the_tree_format_leaves_a_factory_node_alone() {
        let tree_format = format_record("[", "]");
        assert_eq!(apply_render_format(Source::Factory, "canonical".to_string(), None, Some(&tree_format)), "canonical");
    }
}
