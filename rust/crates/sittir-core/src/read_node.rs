//! tree-sitter `Tree` → primitive `NodeData` traversal. Spec 012 T022.
//!
//! Produces the exact 8-`$`-field wire shape defined in data-model.md §1.
//! **NO enrichment** happens here — no `$variant`, no keyword promotion,
//! no supertype inference. Those live on the TypeScript
//! `readTreeNode` / `_wrapTable` side (post-boundary). Rust ships the
//! primitive shape and only the primitive shape.
//!
//! # Shape produced
//!
//! For every visited tree-sitter node, exactly these fields are set:
//!
//! - `$type`     — node kind (e.g. `function_item`).
//! - `$source`   — always `"ts"` for this code path.
//! - `$named`    — `node.is_named()`.
//! - `$fields`   — `HashMap<raw_field_name, FieldValue>` populated via
//!   `field_name_for_child()`. Multiple children on the same field name
//!   collapse into `FieldValue::Multiple`; single → `FieldValue::Single`.
//! - `$children` — children with NO field name (or anonymous if the
//!   caller retains them). Leaves skip this.
//! - `$text`     — leaf text. Populated ONLY on leaves (no named children).
//! - `$span`     — `{start, end}` from `node.byte_range()`.
//! - `$nodeId`   — tree-sitter's canonical `Node::id()` (a pointer-
//!   derived `usize`, surfaced as `u64` on the wire). Identical id-
//!   space on both engines so drill-in dispatch (`engine.readNode(id)`
//!   vs JS `tree.nodeById(id)`) is symmetric.

use crate::types::{FieldValue, KindId, NodeData, Source, Span};
use std::collections::HashMap;

/// Read a tree-sitter node (or the whole tree's root) into a primitive
/// `NodeData`. See module docs for the shape contract.
///
/// # Arguments
///
/// * `tree`    — the parsed tree. Borrowed; not mutated.
/// * `source`  — the source string the tree was parsed from. Used for
///   extracting leaf `$text` via byte-range slicing.
/// * `node_id` — which node to start reading from, addressed by
///   tree-sitter's `Node::id()`. `None` reads the root node.
///
/// # Panics
///
/// Panics if `node_id` is `Some(id)` but no node with that id exists
/// in the current tree. The napi wrapper translates this into the
/// `"node id N not found in current tree"` error surface.
pub fn read_node(tree: &tree_sitter::Tree, source: &str, node_id: Option<u64>) -> NodeData {
    let root = tree.root_node();
    match node_id {
        None => read_ts_node(root, source),
        Some(target) => match find_by_id(root, target) {
            Some(found) => read_ts_node(found, source),
            None => panic!("node id {target} not found in current tree"),
        },
    }
}

/// Depth-first search for the tree-sitter node whose canonical
/// `Node::id()` matches `target`.
fn find_by_id<'a>(node: tree_sitter::Node<'a>, target: u64) -> Option<tree_sitter::Node<'a>> {
    if node.id() as u64 == target {
        return Some(node);
    }
    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        if let Some(found) = find_by_id(child, target) {
            return Some(found);
        }
    }
    None
}

/// Recursive core — converts a tree-sitter `Node` into `NodeData`.
fn read_ts_node(node: tree_sitter::Node<'_>, source: &str) -> NodeData {
    let assigned_id = node.id() as u64;

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

    let (fields, children) = read_children(node, source);

    // Leaf heuristic: no named fields AND no (named) children. The
    // tree-sitter convention is that purely-anonymous terminals are
    // leaves with `is_named() == false`; named leaves (e.g.
    // `identifier`) have no substructure and get `$text` here.
    let is_leaf = fields.is_none()
        && children
            .as_ref()
            .is_none_or(|cs| cs.iter().all(|c| !c.named));
    let text = if is_leaf {
        source.get(byte_range.clone()).map(|s| s.to_string())
    } else {
        None
    };

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
        node_id: Some(assigned_id),
    }
}

/// Walk a node's children once, partitioning by whether the child
/// occupies a field slot. Returns `(fields, children)` ready to drop
/// into `NodeData`. Each tuple slot is `None` if the corresponding
/// collection is empty (keeps the wire shape minimal per §1 elision
/// invariants).
///
/// Field-slot arity: multiple children on the same field name are
/// collapsed into `FieldValue::Multiple`; a lone child becomes
/// `FieldValue::Single`. Text-only field values (anonymous-token
/// positions captured as field values) are not produced here — the
/// tree-sitter API routes anonymous tokens through `children`, not
/// `field_name_for_child`, so those surface via TS-side enrichment.
fn read_children(
    node: tree_sitter::Node<'_>,
    source: &str,
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
        let data = read_ts_node(child, source);
        match field_name {
            Some(name) => fields_acc.entry(name.to_string()).or_default().push(data),
            None => children_acc.push(data),
        }
    }

    let fields = if fields_acc.is_empty() {
        None
    } else {
        let mut out: HashMap<String, FieldValue> = HashMap::with_capacity(fields_acc.len());
        for (k, mut v) in fields_acc {
            let value = if v.len() == 1 {
                FieldValue::Single(Box::new(v.pop().expect("len==1")))
            } else {
                FieldValue::Multiple(v)
            };
            out.insert(k, value);
        }
        Some(out)
    };
    let children = if children_acc.is_empty() {
        None
    } else {
        Some(children_acc)
    };
    (fields, children)
}
