//! tree-sitter `Tree` → primitive `NodeData` traversal.
//!
//! Produces the exact one-level-deep read shape that crosses the boundary:
//! de-hoisted `_<slot>` storage at the boundary, child stubs carrying
//! parent handle + child index, and no recursive `$fields` payload.
//! **NO enrichment or anonymous-token promotion** happens here. Named
//! slots come only from tree-sitter / enrich-authored
//! `field_name_for_child()` output.
//!
//! # Shape produced
//!
//! For every visited tree-sitter node, exactly these fields are set:
//!
//! - `$type`       — node kind (numeric `KindId`).
//! - `$source`     — always `"ts"` for this code path.
//! - `$named`      — `node.is_named()`.
//! - `_<slot>`     — top-level named-slot storage populated via
//!   `field_name_for_child()`. Multiple children on the same field name
//!   collapse into `FieldValue::Multiple`; single → `FieldValue::Single`.
//! - `$other`   — child entries with NO field name. Materialized leaf
//!   children are scalarized on the wire only for anonymous/token leaves;
//!   named leaves and branch children remain objects.
//! - `$text`       — non-empty source text for anonymous tokens, error nodes
//!   and childless nodes; a node with children is addressed by its span.
//! - `$span`       — `{start, end}` from `node.byte_range()`.
//! - `$handle`       — the returned node's own handle.
//! - `$parentHandle` — the parent's handle, on every child at a bounded
//!   read's last level (stubs and leaves alike): with `$childIndex` it is
//!   the coordinate the child is expanded at.
//! - `$treeHandle`   — the tree's tag, on a deep read's leaves and on every
//!   trivia entry: nothing re-reads them, so it names only the tree their
//!   span slices.
//! - A child expanded inside a read carries none of the three.
//! - `$childIndex` — position within parent's children array on every
//!   child a bounded read returns and a deep read's expanded children.
//!   `None` on the returned node itself and on a deep read's leaves.

use crate::types::{FieldValue, KindId, NodeData, NodeHandle, NodeTrivia, Source, Span};
use indexmap::IndexMap;
use std::collections::BTreeMap;
use std::num::NonZeroU32;

/// How far one read expands.
///
/// `Levels(n)` expands the children within `n - 1` levels below the node
/// read and leaves every child with substructure at level `n` as a stub
/// carrying its parent handle and child index, which a later `read_child`
/// expands on demand. [`ReadDepth::SHALLOW`] (one level) is the default and
/// the lazy path. `Deep` expands everything in one pass instead.
///
/// A child expanded above the last level gets a handle minted for it, so the
/// stubs under it can be re-read, but carries no handle of its own: a stub
/// is the only node that names a coordinate to re-read, and one on an
/// expanded node would make the wrap layer's expansion read it again.
///
/// A deep descendant keeps its `$childIndex` but gets no handle: nothing
/// needs to re-read it. A deep read's leaf carries only `$treeHandle`, which
/// names its tree and no coordinate to re-read.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ReadDepth {
    Levels(NonZeroU32),
    Deep,
}

impl ReadDepth {
    /// One level: every child with substructure comes back as a stub.
    pub const SHALLOW: ReadDepth = ReadDepth::Levels(NonZeroU32::MIN);

    /// The depth a child of a node read at `self` is read at, or `None` when
    /// the child is at the last level and comes back as a stub.
    fn below(self) -> Option<ReadDepth> {
        match self {
            ReadDepth::Deep => Some(ReadDepth::Deep),
            ReadDepth::Levels(levels) => NonZeroU32::new(levels.get() - 1).map(ReadDepth::Levels),
        }
    }
}

impl Default for ReadDepth {
    fn default() -> Self {
        ReadDepth::SHALLOW
    }
}

/// Mints the handle a bounded read gives a child it expands, so the stubs
/// under that child name a coordinate that can be re-read.
pub trait HandleMint {
    fn mint(&mut self, parent: u64, child_index: u16) -> Option<u64>;
}

/// A read with no node table to mint into. The stubs under a child it
/// expands carry no handle.
pub struct NoHandles;

impl HandleMint for NoHandles {
    fn mint(&mut self, _parent: u64, _child_index: u16) -> Option<u64> {
        None
    }
}

/// What the reader needs to know about the grammar it is reading. The
/// reader is otherwise grammar-agnostic; every fact here is generated from
/// the model and stamped, never re-derived from a node's shape.
pub trait ReadModel {
    /// The model slot a child of a `parent` node is stored under, when its
    /// name differs from the key the parser gives the child: a field-tagged
    /// child by its field, a named child without a field by its kind name.
    /// `None` keeps the parser's key: the slot is named for it, or the model
    /// has no slot for the child.
    fn wire_slot(&self, parent: KindId, field: Option<&str>, child: &str) -> Option<&'static str> {
        let _ = (parent, field, child);
        None
    }

    /// The gap an extra inside a node of this kind occupies when the node
    /// has no named child to own it, named by the model slot whose position
    /// the gap holds, given the count of anonymous tokens before the extra.
    /// `None` when the model has no slot at that gap.
    fn inner_gap_key(&self, kind: KindId, preceding_tokens: u16) -> Option<&'static str> {
        let _ = (kind, preceding_tokens);
        None
    }

    /// Whether the model stores a `child` of a `parent` node, reached under
    /// the parser field `field`, as a scalar: a presence flag or a kind id.
    /// Such a child keeps no trivia, so it never owns an extra.
    fn stores_scalar(&self, parent: KindId, field: Option<&str>, child: KindId) -> bool {
        let _ = (parent, field, child);
        false
    }
}

/// Read a tree-sitter node (or the whole tree's root) into a primitive
/// `NodeData`. See module docs for the shape contract.
///
/// # Arguments
///
/// * `tree`   — the parsed tree. Borrowed; not mutated.
/// * `source` — the source string the tree was parsed from. Used for
///   extracting leaf `$text` via byte-range slicing.
/// * `target` — the tree-sitter `Node` to read. `None` reads the root.
/// * `node_handle` — handle assigned by `ParsedTree` for the returned node.
/// * `depth` — whether children with substructure come back as stubs
///   (`Shallow`) or fully expanded (`Deep`).
/// * `model` — the grammar's read facts: which kinds are captured as text.
///
/// The caller supplies the `Node` directly (obtained via
/// `ParsedTree.nodes[handle]` + `parent.child(child_index)`), so no
/// DFS search is needed.
pub fn read_node(
    tree: &tree_sitter::Tree,
    source: &str,
    target: Option<tree_sitter::Node>,
    node_handle: Option<u64>,
    depth: ReadDepth,
    model: &dyn ReadModel,
    mint: &mut dyn HandleMint,
) -> NodeData {
    match target {
        Some(node) => read_ts_node(node, source, node_handle, node_handle, depth, model, mint),
        None => {
            let mut root = read_ts_node(
                tree.root_node(),
                source,
                node_handle,
                node_handle,
                depth,
                model,
                mint,
            );
            widen_to_whole_source(&mut root, source);
            root
        }
    }
}

/// Stretch the root's span to cover the entire source.
///
/// tree-sitter's root node starts at the first token, so a leading blank
/// line or indentation falls outside its byte range — and for a source with
/// no tokens at all the range collapses to the end of the file. The root
/// stands for the whole file, and its span is what the coordinate render
/// slices, so anything outside that range would be dropped on the way back
/// out.
fn widen_to_whole_source(root: &mut NodeData, source: &str) {
    root.span = Some(Span {
        start: 0,
        end: source.len() as u32,
    });
}

/// The `$type` every read stamps: tree-sitter's pre-alias GRAMMAR symbol —
/// the production rule that actually parsed the node. For `alias($.X, $.Y)`
/// occurrences this recovers `X`, so aliased nodes arrive on the wire
/// already under their source identity and no per-field restamp is needed.
/// The alias/display symbol is presentation: a role the node plays at its
/// position, which the position (the consuming slot) already encodes —
/// acceptance sets and slot keying carry the source ids so no consumer
/// needs the display symbol as identity — a transport accepts every
/// identity the parser can show as one of its members, the display kind
/// of an anonymous token included.
fn stamped_kind(node: &tree_sitter::Node<'_>) -> KindId {
    KindId(node.grammar_id())
}

/// The `($type, $displayType)` pair a read stamps: the grammar symbol that
/// parsed the node, and the kind the parser shows it as when that differs.
fn identity(node: &tree_sitter::Node<'_>) -> (KindId, Option<KindId>) {
    let grammar = stamped_kind(node);
    let display = KindId(node.kind_id());
    (grammar, (display != grammar).then_some(display))
}

/// Read core — converts a tree-sitter `Node` into `NodeData`.
///
/// `tree_handle` is any handle this tree minted — the tag a trivia entry's
/// coordinate carries, since a comment is never addressed on its own and so
/// never gets a handle of its own. `node_handle` is this node's own handle
/// when it has one, stamped as `$handle` and passed to its children as their
/// `$parentHandle`.
fn read_ts_node(
    node: tree_sitter::Node<'_>,
    source: &str,
    node_handle: Option<u64>,
    tree_handle: Option<u64>,
    depth: ReadDepth,
    model: &dyn ReadModel,
    mint: &mut dyn HandleMint,
) -> NodeData {
    // Phase B-inverse: numeric ids directly instead of the string kind()
    // so NodeData.type_: KindId flows end-to-end without a heap-allocated
    // String per node; identity comes from the grammar symbol (see
    // `stamped_kind`).
    let (kind, display_type) = identity(&node);

    let named = node.is_named();
    let byte_range = node.byte_range();
    let span = Span {
        start: byte_range.start as u32,
        end: byte_range.end as u32,
    };

    let (fields, children, slot_order) = if node.is_error() {
        (None, None, None)
    } else {
        read_children(node, source, node_handle, tree_handle, depth, model, mint)
    };

    let text = node_text(node, source);

    NodeData {
        type_: kind,
        display_type,
        source: Source::Ts,
        named,
        fields,
        children,
        text,
        span: Some(span),
        handle: node_handle.map(NodeHandle::Own),
        child_index: None,
        trivia_data: node_trivia(node, source, tree_handle, model),
        slot_order,
        same_line: false,
        tokens_between: 0,
        text_only: false,
    }
}

/// The trivia `node` owns, placed by its own position in the tree. Self-
/// contained -- it depends only on `node`'s siblings and children, not on
/// how `node` was reached -- because this crate's handle+child-index
/// re-resolution can read `node` directly (bypassing its parent's
/// `read_children` pass entirely), and trivia attached only as a side
/// effect of that pass would silently vanish on such a direct read.
///
/// Extras (tree-sitter's grammar-`extras`-matched nodes -- comments, line
/// continuations, etc.) never carry a field name, so `read_children` skips
/// them; they are recovered here. Only a named non-extra node -- an owner --
/// holds trivia, and every extra has exactly one owner, the first rule that
/// applies among the owners around it (anonymous non-extra siblings, e.g.
/// `,`, are transparent):
///
/// 1. the previous owner ends on the row the extra starts: trailing of the
///    previous owner, on its line, after the anonymous tokens between them;
/// 2. a next owner exists: leading of the next owner, on its line when the
///    extra ends on the row the owner starts;
/// 3. a previous owner exists: trailing of the previous owner;
/// 4. otherwise the parent has no owner child: inner of the parent, keyed by
///    the gap the model names for the count of anonymous tokens before the
///    extra. An extra in a gap the model cannot key is dropped.
///
/// Each owner computes its side of rules 1-3 from its own siblings and its
/// rule-4 entries from its own children, so both ends of a rule agree
/// without either read seeing the other.
///
/// Trivia entries are fully materialized (recursively read via
/// `read_ts_node`, not shallow stubs) since they are not independently
/// addressable through the normal `_<slot>`/`$other` handle+child-index
/// navigation -- nothing would ever drill in to hydrate a stub left here.
/// Each entry still carries a coordinate — the tree's tag in `$treeHandle`
/// and its own `$span` — so an untouched comment renders as the bytes it
/// spans, whatever its kind's transport would otherwise need.
/// An entry read with no fields and no children (rust's regular `/* a */`,
/// whose content is not a node) carries its bytes as `$text`, so its text is a
/// read fact rather than something only the span can recover.
fn node_trivia(
    node: tree_sitter::Node<'_>,
    source: &str,
    tree_handle: Option<u64>,
    model: &dyn ReadModel,
) -> Option<NodeTrivia> {
    if is_trivia(&node) {
        return None;
    }
    let entry = |extra: tree_sitter::Node<'_>, same_line: bool, tokens_between: u16| {
        let data = NodeData {
            handle: tree_handle.map(NodeHandle::Tree),
            ..read_ts_node(extra, source, None, tree_handle, ReadDepth::Deep, model, &mut NoHandles)
        };
        let childless = data.fields.is_none()
            && data
                .children
                .as_ref()
                .is_none_or(|children| children.iter().all(|child| !child.named));
        let text = data.text.or_else(|| {
            childless
                .then(|| source.get(extra.byte_range()).map(str::to_string))
                .flatten()
        });
        NodeData {
            same_line,
            tokens_between,
            text,
            ..data
        }
    };

    let mut leading = Vec::new();
    let mut trailing = Vec::new();
    let owner = is_owner(&node, model);
    if owner {
        let (before, prev) = extras_run(node, |n| n.prev_sibling(), model);
        for (extra, _) in before.into_iter().rev() {
            let trails_prev = prev.is_some_and(|p| end_row(&p) == extra.start_position().row);
            if !trails_prev {
                leading.push(entry(
                    extra,
                    end_row(&extra) == node.start_position().row,
                    0,
                ));
            }
        }
        let (after, next) = extras_run(node, |n| n.next_sibling(), model);
        for (extra, tokens) in after {
            let same_line = end_row(&node) == extra.start_position().row;
            if same_line {
                trailing.push(entry(extra, true, tokens));
            } else if next.is_none() {
                trailing.push(entry(extra, false, 0));
            }
        }
    }

    let mut inner: BTreeMap<String, Vec<NodeData>> = BTreeMap::new();
    let mut cursor = node.walk();
    let children: Vec<_> = node.children(&mut cursor).collect();
    if !children.iter().any(|child| is_owner(child, model)) {
        let mut preceding_tokens: u16 = 0;
        let mut named_before = false;
        for child in children {
            if !is_trivia(&child) {
                preceding_tokens += 1;
                named_before |= child.is_named();
            } else if let Some(key) = model.inner_gap_key(stamped_kind(&node), preceding_tokens) {
                inner
                    .entry(key.to_string())
                    .or_default()
                    .push(entry(child, false, 0));
            } else if owner {
                if named_before {
                    trailing.push(entry(child, true, 0));
                } else {
                    leading.push(entry(child, true, 0));
                }
            }
        }
    }

    let some = |entries: Vec<NodeData>| (!entries.is_empty()).then_some(entries);
    let inner = (!inner.is_empty()).then_some(inner);
    if leading.is_empty() && trailing.is_empty() && inner.is_none() {
        return None;
    }
    Some(NodeTrivia {
        leading: some(leading),
        trailing: some(trailing),
        inner,
    })
}

/// Whether a node is seated as trivia rather than read as a child: an extra,
/// or an ERROR wherever the parser left it. Error recovery builds most ERRORs
/// as extras, but the one that wraps unparsable input at the end of a file is
/// not; seating every ERROR the same way keeps its bytes in the tree's
/// trivia, so no slot has to admit a kind the grammar never declares.
fn is_trivia(node: &tree_sitter::Node<'_>) -> bool {
    node.is_extra() || node.is_error()
}

/// The row a node ends on: the row of its last byte, so a span that ends
/// with its line break (a doc comment includes its newline) ends on the row
/// that break closes, not at column 0 of the next row.
fn end_row(node: &tree_sitter::Node<'_>) -> usize {
    let end = node.end_position();
    if end.column == 0 && node.end_byte() > node.start_byte() {
        end.row - 1
    } else {
        end.row
    }
}

/// A node that can own trivia: named, not itself an extra, spanning at
/// least one byte, and stored by its slot as a node. A zero-width node
/// (typescript's `automatic_semicolon`) is never written around, and a child
/// its slot stores as a scalar (a flag or a kind id) keeps no trivia, so an
/// entry either owned would have nowhere to render.
fn is_owner(node: &tree_sitter::Node<'_>, model: &dyn ReadModel) -> bool {
    node.is_named() && !is_trivia(node) && node.end_byte() > node.start_byte() && !stored_as_scalar(node, model)
}

fn stored_as_scalar(node: &tree_sitter::Node<'_>, model: &dyn ReadModel) -> bool {
    let Some(parent) = node.parent() else {
        return false;
    };
    model.stores_scalar(stamped_kind(&parent), field_in_parent(node, &parent), stamped_kind(node))
}

/// The parser field `parent` tags `node` with, if any.
fn field_in_parent(node: &tree_sitter::Node<'_>, parent: &tree_sitter::Node<'_>) -> Option<&'static str> {
    let mut cursor = parent.walk();
    if !cursor.goto_first_child() {
        return None;
    }
    loop {
        if cursor.node().id() == node.id() {
            return cursor.field_name();
        }
        if !cursor.goto_next_sibling() {
            return None;
        }
    }
}

/// The extras between `node` and the nearest owner in one direction, nearest
/// first, each with the anonymous tokens between it and `node`, and that
/// owner.
fn extras_run<'t>(
    node: tree_sitter::Node<'t>,
    step: impl Fn(tree_sitter::Node<'t>) -> Option<tree_sitter::Node<'t>>,
    model: &dyn ReadModel,
) -> (
    Vec<(tree_sitter::Node<'t>, u16)>,
    Option<tree_sitter::Node<'t>>,
) {
    let mut extras = Vec::new();
    let mut tokens: u16 = 0;
    let mut cursor = step(node);
    while let Some(sibling) = cursor {
        if is_owner(&sibling, model) {
            return (extras, Some(sibling));
        }
        if is_trivia(&sibling) {
            extras.push((sibling, tokens));
        } else {
            tokens += 1;
        }
        cursor = step(sibling);
    }
    (extras, None)
}

/// Walk a node's children once, partitioning by whether the child
/// occupies a field slot. Returns `(fields, children, slot_order)` ready
/// to drop into `NodeData` — `slot_order` is the cross-bucket interleave
/// stamp (see `NodeData::slot_order`), present only on multi-bucket
/// parents.
///
/// Field-slot arity: multiple children on the same field name are
/// collapsed into `FieldValue::Multiple`; a lone child becomes
/// `FieldValue::Single`. No-field children stay in `$other`; this
/// native path does not invent `_<text>` fields for anonymous tokens.
///
/// Extras (tree-sitter's grammar-`extras`-matched nodes -- comments,
/// line continuations, etc.) never carry a field name and are always
/// named, so without special handling they'd fall into the kind-named
/// slot path below and collapse into an opaque, never-wrapped `_<kind>`
/// bucket. They are skipped entirely
/// here; `node_trivia` recovers them as trivia of the owner the
/// placement rules pick.
fn read_children(
    node: tree_sitter::Node<'_>,
    source: &str,
    node_handle: Option<u64>,
    tree_handle: Option<u64>,
    depth: ReadDepth,
    model: &dyn ReadModel,
    mint: &mut dyn HandleMint,
) -> (
    Option<IndexMap<String, FieldValue>>,
    Option<Vec<NodeData>>,
    Option<Vec<String>>,
) {
    let mut fields_acc: IndexMap<String, Vec<NodeData>> = IndexMap::new();
    let mut children_acc: Vec<NodeData> = Vec::new();
    let mut slot_order_acc: Vec<String> = Vec::new();
    let parent_kind = stamped_kind(&node);

    let child_count = node.child_count() as u32;
    for i in 0..child_count {
        let child = match node.child(i) {
            Some(c) => c,
            None => continue,
        };
        if is_trivia(&child) {
            continue;
        }
        let field_name = node.field_name_for_child(i).map(|s| s.to_string());
        let data = if is_leaf(&child) {
            // A leaf keeps a coordinate at either depth. Under a shallow read
            // it is a child like any stub — the parent's handle and its index,
            // which the wrap layer may re-read. Under a deep read nothing is
            // re-read, so it carries the tree's tag and no index, as a trivia
            // entry does: enough to fold and slice, never a stub's shape. The
            // same holds for its trivia: a shallow leaf's is read when the
            // wrap layer re-reads it, a deep leaf's is read here.
            let (handle, child_index, trivia_data) = match depth {
                ReadDepth::Levels(_) => (node_handle.map(NodeHandle::Parent), Some(i as u16), None),
                ReadDepth::Deep => (
                    tree_handle.map(NodeHandle::Tree),
                    None,
                    node_trivia(child, source, tree_handle, model),
                ),
            };
            NodeData {
                trivia_data,
                text_only: depth == ReadDepth::Deep,
                ..read_materialized_leaf(child, source, model, handle, child_index, tree_handle)
            }
        } else {
            match depth.below() {
                None => read_child_stub(child, source, node_handle, i as u16),
                Some(ReadDepth::Deep) => NodeData {
                    child_index: Some(i as u16),
                    ..read_ts_node(child, source, None, tree_handle, ReadDepth::Deep, model, mint)
                },
                Some(below) => {
                    let handle = node_handle.and_then(|parent| mint.mint(parent, i as u16));
                    NodeData {
                        handle: None,
                        child_index: Some(i as u16),
                        ..read_ts_node(child, source, handle, tree_handle, below, model, mint)
                    }
                }
            }
        };
        match field_name.as_deref() {
            Some(name) => {
                let slot = model
                    .wire_slot(parent_kind, Some(name), child.kind())
                    .unwrap_or(name);
                slot_order_acc.push(slot.to_string());
                assign_named_slot(&mut fields_acc, slot, data);
            }
            None => {
                if child.is_named() {
                    let slot = model
                        .wire_slot(parent_kind, None, child.kind())
                        .unwrap_or_else(|| child.kind());
                    slot_order_acc.push(slot.to_string());
                    assign_named_slot(&mut fields_acc, slot, data);
                } else {
                    // Anonymous literal token — stays in the legacy children bucket
                    // (numeric kind IDs only after the slot model unification).
                    children_acc.push(data);
                }
            }
        }
    }

    // The cross-bucket interleave stamp is only meaningful when there are
    // two or more buckets to interleave; single-bucket nodes already
    // preserve document order inside the bucket itself.
    let slot_order = if fields_acc.len() >= 2 {
        Some(slot_order_acc)
    } else {
        None
    };
    let fields = if fields_acc.is_empty() {
        None
    } else {
        let mut fields = IndexMap::with_capacity(fields_acc.len());
        for (k, mut v) in fields_acc {
            let value = if v.len() == 1 {
                FieldValue::Single(Box::new(v.pop().expect("len==1")))
            } else {
                FieldValue::Multiple(v.into_iter().map(Some).collect())
            };
            fields.insert(k, value);
        }
        Some(fields)
    };
    let children = if children_acc.is_empty() {
        None
    } else {
        Some(children_acc)
    };
    (fields, children, slot_order)
}

/// Whether a node's bytes are its content: an anonymous token, an error, or
/// a node with no children to address them.
fn carries_text(node: &tree_sitter::Node<'_>) -> bool {
    !node.is_named() || node.is_error() || node.child_count() == 0
}

/// The text a node carries: its bytes when `carries_text`, nothing otherwise.
/// An anonymous token spelled exactly as its kind name carries none: its kind
/// id already names the text. A zero-width node carries none: its span says
/// it is empty.
fn node_text(node: tree_sitter::Node<'_>, source: &str) -> Option<String> {
    if !carries_text(&node) {
        return None;
    }
    let text = source.get(node.byte_range())?;
    if text.is_empty() || (!node.is_named() && !node.is_error() && text == node.kind()) {
        return None;
    }
    Some(text.to_string())
}

fn read_child_stub(
    child: tree_sitter::Node<'_>,
    source: &str,
    parent_handle: Option<u64>,
    child_index: u16,
) -> NodeData {
    let byte_range = child.byte_range();
    let (type_, display_type) = identity(&child);
    NodeData {
        type_,
        display_type,
        source: Source::Ts,
        named: child.is_named(),
        fields: None,
        children: None,
        text: node_text(child, source),
        span: Some(Span {
            start: byte_range.start as u32,
            end: byte_range.end as u32,
        }),
        handle: parent_handle.map(NodeHandle::Parent),
        child_index: Some(child_index),
        trivia_data: None,
        slot_order: None,
        same_line: false,
        tokens_between: 0,
        text_only: false,
    }
}

/// Whether a node is read whole wherever it is reached: it has no named
/// child, so nothing in it is substructure a later read would expand. Its
/// anonymous tokens, if any, come with it.
fn is_leaf(node: &tree_sitter::Node<'_>) -> bool {
    node.named_child_count() == 0
}

fn read_materialized_leaf(
    child: tree_sitter::Node<'_>,
    source: &str,
    model: &dyn ReadModel,
    handle: Option<NodeHandle>,
    child_index: Option<u16>,
    tree_handle: Option<u64>,
) -> NodeData {
    let byte_range = child.byte_range();
    let (type_, display_type) = identity(&child);
    let (fields, children, slot_order) = if child.is_error() || child.child_count() == 0 {
        (None, None, None)
    } else {
        read_children(child, source, None, tree_handle, ReadDepth::Deep, model, &mut NoHandles)
    };
    NodeData {
        type_,
        display_type,
        source: Source::Ts,
        named: child.is_named(),
        fields,
        children,
        text: node_text(child, source),
        span: Some(Span {
            start: byte_range.start as u32,
            end: byte_range.end as u32,
        }),
        handle,
        child_index,
        trivia_data: None,
        slot_order,
        same_line: false,
        tokens_between: 0,
        text_only: false,
    }
}

fn assign_named_slot(
    fields_acc: &mut IndexMap<String, Vec<NodeData>>,
    field_name: &str,
    data: NodeData,
) {
    // Grammar-agnostic: always concatenate. The reader does not know slot
    // arity, so it must NOT resolve a named/unnamed disparity here. Previously
    // this overwrote a lone anonymous entry when a named value arrived on the
    // same field, which silently dropped genuine repeated-field members like
    // `function_modifiers.modifier` = [`unsafe`(anon), `extern_modifier`(named)].
    // The named-over-unnamed preference for *singular* slots is resolved
    // downstream in `normalizeSingularWrapSlot`, the per-kind layer that knows
    // the slot is singular.
    fields_acc
        .entry(field_name.to_string())
        .or_default()
        .push(data);
}
