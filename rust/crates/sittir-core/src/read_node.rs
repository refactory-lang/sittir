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
//! - `$nodeId`   — monotonic counter assigned from `next_node_id`, shared
//!   across the whole traversal pass (per data-model.md §4).
//!
//! # nodeId invariant
//!
//! `next_node_id` is a `&mut u32` owned by the caller (the engine
//! resets it per `find_and_read` call). Every call site that recursively
//! reads children threads the same counter so IDs are unique within one
//! pass. The counter increments **pre-order** (parent before children).

use crate::types::{FieldValue, NodeData, Source, Span};
use std::collections::HashMap;

/// Read a tree-sitter node (or the whole tree's root) into a primitive
/// `NodeData`. See module docs for the shape contract.
///
/// # Arguments
///
/// * `tree`         — the parsed tree. Borrowed; not mutated.
/// * `source`       — the source string the tree was parsed from. Used
///   for extracting leaf `$text` via byte-range slicing.
/// * `node_id`      — which node to start reading from, addressed by
///   the pass-unique `$nodeId` that was assigned during a previous
///   traversal. `None` reads the root node and assigns IDs starting
///   from the current `*next_node_id`.
/// * `next_node_id` — monotonic counter, mutated during traversal.
///   The engine resets this to 0 before each `find_and_read`.
///
/// # Panics
///
/// Panics if `node_id` is `Some(id)` but no node with that ID exists
/// after a fresh traversal. The napi wrapper (T033+) translates this
/// into the `"node id N not found in current tree"` error surface.
pub fn read_node(
    tree: &tree_sitter::Tree,
    source: &str,
    node_id: Option<u32>,
    next_node_id: &mut u32,
) -> NodeData {
    let root = tree.root_node();
    match node_id {
        None => read_ts_node(root, source, next_node_id),
        Some(target) => {
            // To find a node by ID, we re-walk the tree counting with a
            // fresh local counter — the stored `next_node_id` is not
            // consulted because the engine already used it once in the
            // initial `find_and_read` pass. We rebuild the NodeData for
            // the subtree rooted at the targeted node.
            let mut counter: u32 = 0;
            match find_by_id(root, target, &mut counter) {
                Some(found) => read_ts_node(found, source, next_node_id),
                None => panic!("node id {target} not found in current tree"),
            }
        }
    }
}

/// Depth-first search for the tree-sitter node whose pre-order position
/// matches `target`. Uses `counter` as a running pre-order index.
fn find_by_id<'a>(
    node: tree_sitter::Node<'a>,
    target: u32,
    counter: &mut u32,
) -> Option<tree_sitter::Node<'a>> {
    let here = *counter;
    *counter += 1;
    if here == target {
        return Some(node);
    }
    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        if let Some(found) = find_by_id(child, target, counter) {
            return Some(found);
        }
    }
    None
}

/// Recursive core — converts a tree-sitter `Node` into `NodeData`.
///
/// Pre-order nodeId assignment: the current node claims `*next_node_id`
/// first (by post-increment), then children recurse.
fn read_ts_node(
    node: tree_sitter::Node<'_>,
    source: &str,
    next_node_id: &mut u32,
) -> NodeData {
    let assigned_id = *next_node_id;
    *next_node_id += 1;

    let kind = node.kind().to_string();
    let named = node.is_named();
    let byte_range = node.byte_range();
    let span = Span {
        start: byte_range.start as u32,
        end: byte_range.end as u32,
    };

    let (fields, children) = read_children(node, source, next_node_id);

    // Leaf heuristic: no named fields AND no (named) children. The
    // tree-sitter convention is that purely-anonymous terminals are
    // leaves with `is_named() == false`; named leaves (e.g.
    // `identifier`) have no substructure and get `$text` here.
    let is_leaf = fields.is_none()
        && children
            .as_ref()
            .is_none_or(|cs| cs.iter().all(|c| !c.named));
    let text = if is_leaf {
        source
            .get(byte_range.clone())
            .map(|s| s.to_string())
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
    next_node_id: &mut u32,
) -> (Option<HashMap<String, FieldValue>>, Option<Vec<NodeData>>) {
    let mut fields_acc: HashMap<String, Vec<NodeData>> = HashMap::new();
    let mut children_acc: Vec<NodeData> = Vec::new();
    let mut cursor = node.walk();
    // Iterate children by index so we can query `field_name_for_child`
    // — `children(&mut cursor)` doesn't expose the child index.
    let child_count = node.child_count();
    for i in 0..child_count {
        let child = match node.child(i) {
            Some(c) => c,
            None => continue,
        };
        let field_name = node.field_name_for_child(i as u32);
        let data = read_ts_node(child, source, next_node_id);
        match field_name {
            Some(name) => fields_acc.entry(name.to_string()).or_default().push(data),
            None => children_acc.push(data),
        }
    }
    // Silence the unused-mut lint on `cursor` — kept to match the
    // tree-sitter idiom even though the index-based loop above doesn't
    // use it directly. Used for the future switch to `children(&mut cursor)`.
    let _ = &mut cursor;

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
