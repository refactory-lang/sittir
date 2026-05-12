//! tree-sitter `Tree` → primitive `NodeData` traversal. Spec 012 T022.
//!
//! Produces the exact one-level-deep read shape defined by ADR-0018:
//! de-hoisted `_<slot>` storage at the boundary, child stubs carrying
//! parent handle + child index, and no recursive `$fields` payload.
//! **NO enrichment** happens here beyond the JS-parity anonymous-keyword
//! promotion used by `@sittir/core/readNode`.
//!
//! # Shape produced
//!
//! For every visited tree-sitter node, exactly these fields are set:
//!
//! - `$type`       — node kind (numeric `KindId`).
//! - `$source`     — always `"ts"` for this code path.
//! - `$named`      — `node.is_named()`.
//! - `_<slot>`     — top-level named-slot storage populated via
//!   `field_name_for_child()` and anonymous-keyword promotion. Multiple
//!   children on the same field name collapse into `FieldValue::Multiple`;
//!   single → `FieldValue::Single`.
//! - `$children`   — child stubs with NO field name (and not promoted to
//!   a keyword slot). Leaves skip this.
//! - `$text`       — full source text for leaves only.
//! - `$span`       — `{start, end}` from `node.byte_range()`.
//! - `$nodeHandle` — current node handle on the returned node; parent
//!   handle on child stubs.
//! - `$childIndex` — position within parent's children array on child
//!   stubs. `None` on the returned node itself.

use crate::types::{FieldValue, KindId, NodeData, Source, Span};
use std::collections::HashMap;

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

/// One-level read core — converts a tree-sitter `Node` into `NodeData`.
fn read_ts_node(node: tree_sitter::Node<'_>, source: &str, node_handle: Option<u32>) -> NodeData {
    // Phase B-inverse: use tree-sitter's numeric kind_id() directly instead
    // of the string kind() so NodeData.type_: KindId flows end-to-end without
    // a heap-allocated String per node.
    let kind = KindId(node.kind_id());

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

    // On leaves, drop the (possibly empty) `$children` entirely — the
    // shape gate in T025 enforces that leaves don't carry `$children`
    // even when empty, and tree-sitter leaves may still have
    // anonymous-token children (e.g. a `string_literal` with `"`
    // tokens) that we explicitly don't surface at MVP.
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
        // trivia_data is never set by readNode — only by $trivia() on
        // factory-constructed nodes.
        trivia_data: None,
    }
}

/// Walk a node's children once, partitioning by whether the child
/// occupies a field slot. Returns `(fields, children)` ready to drop
/// into `NodeData`.
///
/// Field-slot arity: multiple children on the same field name are
/// collapsed into `FieldValue::Multiple`; a lone child becomes
/// `FieldValue::Single`. Anonymous no-field tokens are promoted to
/// keyword slots keyed by their text when possible, matching the JS
/// `readNode` surface.
fn read_children(
    node: tree_sitter::Node<'_>,
    source: &str,
    node_handle: Option<u32>,
) -> (Option<HashMap<String, FieldValue>>, Option<Vec<NodeData>>) {
    let mut fields_acc: HashMap<String, Vec<NodeData>> = HashMap::new();
    let mut children_acc: Vec<NodeData> = Vec::new();
    let child_count = node.child_count() as u32;
    for i in 0..child_count {
        let child = match node.child(i) {
            Some(c) => c,
            None => continue,
        };
        let field_name = node.field_name_for_child(i);
        let data = read_child_stub(child, source, node_handle, i as u16);
        match field_name {
            Some(name) => assign_named_slot(&mut fields_acc, name, data),
            None if promote_anonymous_keyword(&mut fields_acc, &data) => {}
            None => children_acc.push(data),
        }
    }

    let fields = if fields_acc.is_empty() {
        None
    } else {
        let mut fields = HashMap::with_capacity(fields_acc.len());
        for (k, mut v) in fields_acc {
            let value = if v.len() == 1 {
                FieldValue::Single(Box::new(v.pop().expect("len==1")))
            } else {
                FieldValue::Multiple(v)
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
        type_: KindId(child.kind_id()),
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

fn assign_named_slot(
    fields_acc: &mut HashMap<String, Vec<NodeData>>,
    field_name: &str,
    data: NodeData,
) {
    let entry = fields_acc.entry(field_name.to_string()).or_default();
    if entry.len() == 1 && entry[0].named == false && data.named {
        entry[0] = data;
        return;
    }
    entry.push(data);
}

fn promote_anonymous_keyword(
    fields_acc: &mut HashMap<String, Vec<NodeData>>,
    data: &NodeData,
) -> bool {
    if data.named {
        return false;
    }
    let Some(text) = data.text.as_ref() else {
        return false;
    };
    if text.is_empty() || fields_acc.contains_key(text) {
        return false;
    }
    fields_acc.insert(text.clone(), vec![data.clone()]);
    true
}
