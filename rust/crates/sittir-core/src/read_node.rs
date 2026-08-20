//! tree-sitter `Tree` → primitive `NodeData` traversal. Spec 012 T022.
//!
//! Produces the exact one-level-deep read shape defined by ADR-0018:
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
//! - `$text`       — full source text for leaves only.
//! - `$span`       — `{start, end}` from `node.byte_range()`.
//! - `$nodeHandle` — current node handle on the returned node; parent
//!   handle on child stubs.
//! - `$childIndex` — position within parent's children array on child
//!   stubs. `None` on the returned node itself.

use crate::types::{FieldValue, KindId, NodeData, NodeTrivia, Source, Span};
use indexmap::IndexMap;

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
///
/// The caller supplies the `Node` directly (obtained via
/// `ParsedTree.nodes[handle]` + `parent.child(child_index)`), so no
/// DFS search is needed.
pub fn read_node(
    tree: &tree_sitter::Tree,
    source: &str,
    target: Option<tree_sitter::Node>,
    node_handle: Option<u32>,
) -> NodeData {
    let node = target.unwrap_or_else(|| tree.root_node());
    read_ts_node(node, source, node_handle)
}

/// The `$type` every read stamps: tree-sitter's pre-alias GRAMMAR symbol —
/// the production rule that actually parsed the node. For `alias($.X, $.Y)`
/// occurrences this recovers `X`, so aliased nodes arrive on the wire
/// already under their source identity and no per-field restamp is needed.
/// The alias/display symbol is presentation: a role the node plays at its
/// position, which the position (the consuming slot) already encodes —
/// acceptance sets and slot keying carry the source ids so no consumer
/// needs the display symbol as identity.
fn stamped_kind(node: &tree_sitter::Node<'_>) -> KindId {
    KindId(node.grammar_id())
}

/// One-level read core — converts a tree-sitter `Node` into `NodeData`.
fn read_ts_node(node: tree_sitter::Node<'_>, source: &str, node_handle: Option<u32>) -> NodeData {
    // Phase B-inverse: numeric ids directly instead of the string kind()
    // so NodeData.type_: KindId flows end-to-end without a heap-allocated
    // String per node; identity comes from the grammar symbol (see
    // `stamped_kind`).
    let kind = stamped_kind(&node);

    let named = node.is_named();
    let byte_range = node.byte_range();
    let span = Span {
        start: byte_range.start as u32,
        end: byte_range.end as u32,
    };

    let (fields, children) = read_children(node, source, node_handle);

    // Leaf heuristic: no named fields AND no (named) children. The
    // tree-sitter convention is that purely-anonymous terminals are
    // leaves with `is_named() == false`; named leaves (e.g.
    // `identifier`) have no substructure and get `$text` here.
    let is_leaf = fields.is_none()
        && children
            .as_ref()
            .is_none_or(|cs| cs.iter().all(|c| !c.named));
    // Always capture the verbatim source span so text-template nodes
    // (e.g. `raw_string_literal`) can render `{{ text }}` correctly even
    // when they have named-field children that would otherwise suppress
    // the leaf heuristic.  For structural nodes the extra `$text` is
    // unused but harmless.
    let text = source.get(byte_range.clone()).map(|s| s.to_string());

    // On leaves, drop the (possibly empty) `$other` entirely — the
    // shape gate in T025 enforces that leaves don't carry `$other`
    // even when empty, and purely-anonymous token structure is still
    // represented by `$text` for the native read surface.
    let children = if is_leaf { None } else { children };

    NodeData {
        type_: kind,
        source: Source::Ts,
        named,
        fields,
        children,
        text,
        span: Some(span),
        node_handle,
        child_index: None,
        trivia_data: compute_trivia(node, source),
    }
}

/// Compute `node`'s own leading/trailing trivia by walking its
/// tree-sitter siblings directly. Self-contained -- depends only on
/// `node`'s position in the tree, not on how it was reached -- because
/// this crate's handle+child-index re-resolution can read `node` directly
/// (bypassing its parent's `read_children` pass entirely), and any
/// trivia attached only as a side effect of that pass would silently
/// vanish on such a direct read.
///
/// Extras (tree-sitter's grammar-`extras`-matched nodes -- comments, line
/// continuations, etc.) never carry a field name, so `read_children`
/// simply skips them; they are recovered here instead. A run of extras
/// attaches as LEADING trivia to the next named non-extra sibling
/// (anonymous non-extra siblings, e.g. `,`, are transparent -- skipped
/// without breaking the run). A run attaches as TRAILING trivia only
/// when `node` is the last named sibling -- i.e. no named sibling follows
/// before the end of the parent's children -- otherwise that run belongs
/// to the following named sibling's leading trivia instead, computed
/// independently when that sibling is read. An extra with no named
/// sibling in either direction (a construct whose only children are
/// extras, e.g. `{ // only a comment }`) has nowhere to attach --
/// `NodeTrivia` is leading/trailing OF a sibling, not an interior-content
/// slot on the parent itself -- so such extras are dropped. This is a
/// known, documented round-trip fidelity floor, not a silent bug;
/// recovering it would need a different mechanism (a parent-interior
/// content slot).
///
/// Trivia entries are fully materialized (recursively read via
/// `read_ts_node`, not shallow stubs) since they are not independently
/// addressable through the normal `_<slot>`/`$other` handle+child-index
/// navigation -- nothing would ever drill in to hydrate a stub left here.
fn compute_trivia(node: tree_sitter::Node<'_>, source: &str) -> Option<NodeTrivia> {
    // An extra never carries its own trivia -- it IS trivia.
    if node.is_extra() {
        return None;
    }

    let mut leading: Vec<NodeData> = Vec::new();
    let mut cursor = node.prev_sibling();
    while let Some(sib) = cursor {
        if sib.is_extra() {
            leading.push(read_ts_node(sib, source, None));
            cursor = sib.prev_sibling();
        } else if sib.is_named() {
            break;
        } else {
            cursor = sib.prev_sibling();
        }
    }
    leading.reverse();

    let mut trailing: Vec<NodeData> = Vec::new();
    let mut is_last_named = true;
    let mut cursor = node.next_sibling();
    while let Some(sib) = cursor {
        if sib.is_extra() {
            trailing.push(read_ts_node(sib, source, None));
            cursor = sib.next_sibling();
        } else if sib.is_named() {
            is_last_named = false;
            break;
        } else {
            cursor = sib.next_sibling();
        }
    }
    if !is_last_named {
        trailing.clear();
    }

    if leading.is_empty() && trailing.is_empty() {
        None
    } else {
        Some(NodeTrivia {
            leading: if leading.is_empty() { None } else { Some(leading) },
            trailing: if trailing.is_empty() { None } else { Some(trailing) },
        })
    }
}

/// Walk a node's children once, partitioning by whether the child
/// occupies a field slot. Returns `(fields, children)` ready to drop
/// into `NodeData`.
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
/// here; `compute_trivia` recovers them as leading/trailing trivia on
/// the adjacent named sibling instead.
fn read_children(
    node: tree_sitter::Node<'_>,
    source: &str,
    node_handle: Option<u32>,
) -> (Option<IndexMap<String, FieldValue>>, Option<Vec<NodeData>>) {
    let mut fields_acc: IndexMap<String, Vec<NodeData>> = IndexMap::new();
    let mut children_acc: Vec<NodeData> = Vec::new();

    let child_count = node.child_count() as u32;
    for i in 0..child_count {
        let child = match node.child(i) {
            Some(c) => c,
            None => continue,
        };
        if child.is_extra() {
            continue;
        }
        let field_name = node.field_name_for_child(i).map(|s| s.to_string());
        let data = if child.child_count() == 0 {
            read_materialized_leaf(child, source)
        } else {
            read_child_stub(child, source, node_handle, i as u16)
        };
        match field_name {
            Some(name) => assign_named_slot(&mut fields_acc, &name, data),
            None => {
                if child.is_named() {
                    // Named child without a field tag — route by kind to a `_<kind>` slot.
                    // This produces a kind-named storage entry in the serialized NodeData,
                    // uniform with field-tagged slots (spec 2026-05-17 kind-named slots).
                    assign_named_slot(&mut fields_acc, child.kind(), data);
                } else {
                    // Anonymous literal token — stays in the legacy children bucket
                    // (numeric kind IDs only after the slot model unification).
                    children_acc.push(data);
                }
            }
        }
    }

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
    (fields, children)
}

fn read_child_stub(
    child: tree_sitter::Node<'_>,
    source: &str,
    parent_handle: Option<u32>,
    child_index: u16,
) -> NodeData {
    let byte_range = child.byte_range();
    NodeData {
        type_: stamped_kind(&child),
        source: Source::Ts,
        named: child.is_named(),
        fields: None,
        children: None,
        text: source.get(byte_range.clone()).map(|s| s.to_string()),
        span: Some(Span {
            start: byte_range.start as u32,
            end: byte_range.end as u32,
        }),
        node_handle: parent_handle,
        child_index: Some(child_index),
        trivia_data: None,
    }
}

fn read_materialized_leaf(child: tree_sitter::Node<'_>, source: &str) -> NodeData {
    let byte_range = child.byte_range();
    NodeData {
        type_: stamped_kind(&child),
        source: Source::Ts,
        named: child.is_named(),
        fields: None,
        children: None,
        text: source.get(byte_range.clone()).map(|s| s.to_string()),
        span: Some(Span {
            start: byte_range.start as u32,
            end: byte_range.end as u32,
        }),
        node_handle: None,
        child_index: None,
        trivia_data: None,
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
