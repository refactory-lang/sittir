//! tree-sitter `Tree` → primitive `NodeData` traversal. Spec 012 T022.
//!
//! Produces the exact wire shape defined in data-model.md §1.
//! **NO enrichment** happens here — no `$variant`, no keyword promotion,
//! no supertype inference. Those live on the TypeScript
//! `readTreeNode` / `_wrapTable` side (post-boundary). Rust ships the
//! primitive shape and only the primitive shape.
//!
//! # Shape produced
//!
//! For every visited tree-sitter node, exactly these fields are set:
//!
//! - `$type`       — node kind (numeric `KindId`).
//! - `$source`     — always `"ts"` for this code path.
//! - `$named`      — `node.is_named()`.
//! - `$fields`     — `HashMap<raw_field_name, FieldValue>` populated via
//!   `field_name_for_child()`. Multiple children on the same field name
//!   collapse into `FieldValue::Multiple`; single → `FieldValue::Single`.
//! - `$children`   — children with NO field name (or anonymous if the
//!   caller retains them). Leaves skip this.
//! - `$text`       — leaf text. Populated ONLY on leaves (no named children).
//! - `$span`       — `{start, end}` from `node.byte_range()`.
//! - `$nodeHandle` — `None` at read time; stamped by `ParsedTree::push_node`.
//! - `$childIndex` — position within parent's children array (set during
//!   `read_children`). `None` on the root node.

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
///
/// The caller supplies the `Node` directly (obtained via
/// `ParsedTree.nodes[handle]` + `parent.child(child_index)`), so no
/// DFS search is needed.
pub fn read_node(tree: &tree_sitter::Tree, source: &str, target: Option<tree_sitter::Node>) -> NodeData {
    let node = target.unwrap_or_else(|| tree.root_node());
    read_ts_node(node, source)
}

/// Recursive core — converts a tree-sitter `Node` into `NodeData`.
fn read_ts_node(node: tree_sitter::Node<'_>, source: &str) -> NodeData {
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
        // node_handle is stamped by ParsedTree::push_node after read
        // returns — not known at recursive traversal time.
        node_handle: None,
        // child_index is set by read_children on each child; the root
        // node has no parent, so it stays None.
        child_index: None,
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
        let mut data = read_ts_node(child, source);
        // Stamp the child's position within the parent's children array
        // so that ParsedTree can navigate back to it via parent.child(i).
        data.child_index = Some(i as u16);
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
