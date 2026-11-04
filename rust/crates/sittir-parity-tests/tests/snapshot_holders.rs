//! A snapshot measures every point from a holder at or before it. A list
//! passes the extras at its edge to its first item, so the item's leading
//! side can begin before the list: the list's children are measured from
//! where that side begins. A node snapshotted with no holder is measured
//! from where it or its own leading side begins. A holder after the first
//! byte a snapshot measures is refused, never wrapped.

use sittir_core::engine::{claim_tree_id, node_at_index, Engine, NodeRead, ParsedTree};
use sittir_core::read::ReadError;
use sittir_core::types::{NodeIndex, Span};
use sittir_rust::render::AnyNode;
use sittir_rust::RustGrammar;

/// The first field, variant or parameter of each led by an extra its list
/// passes it.
const LED_FIRST_ITEMS: [&str; 7] = [
    "struct S {\n    /// a\n    x: u8,\n}\n",
    "struct S {\n    // a\n    x: u8,\n}\n",
    "struct S { /* a */ x: u8 }\n",
    "enum E {\n    /// a\n    A,\n}\n",
    "fn f(\n    // a\n    x: u8,\n) {}\n",
    "struct S {\n    /// a\n    pub x: u8,\n}\n",
    "struct S {\n    /// a\n    #[b]\n    x: u8,\n}\n",
];

fn parsed(source: &str) -> ParsedTree<RustGrammar> {
    let mut engine = Engine::new(RustGrammar, sittir_rust::render::options::defaults()).expect("an engine");
    engine.parse(source, claim_tree_id().expect("a tree id")).expect("a parse")
}

fn probe_input(name: &str) -> String {
    let path = format!("{}/../../../docs/superpowers/probes/2026-10-01-shared-arena/transport/inputs/{name}", env!("CARGO_MANIFEST_DIR"));
    std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("{path}: {e}"))
}

/// The index and start byte of the first node of `kind` in `tree`.
fn first_of_kind(tree: &ParsedTree<RustGrammar>, kind: &str) -> (NodeIndex, u32) {
    let count = sittir_core::read::descendant_count(&tree.tree().root_node());
    (0..count).map(NodeIndex::new).find_map(|index| node_at_index(tree.tree(), index).filter(|node| node.kind() == kind).map(|node| (index, Span::of(&node).start))).unwrap_or_else(|| panic!("a {kind}"))
}

#[test]
fn every_node_snapshots_measured_from_a_holder_at_or_before_each_point() {
    let inputs = LED_FIRST_ITEMS.map(|source| (source.to_owned(), source.to_owned())).into_iter().chain([("engine.rs".to_owned(), probe_input("engine.rs"))]);
    for (name, source) in inputs {
        let tree = parsed(&source);
        let count = sittir_core::read::descendant_count(&tree.tree().root_node());
        for index in (0..count).map(NodeIndex::new) {
            let snapped = tree.snapshot_node::<AnyNode>(index, None).expect("a node");
            assert!(snapped.is_ok(), "{name:?} at {index:?}: {snapped:?}");
        }
    }
}

#[test]
fn a_node_with_no_holder_is_measured_from_where_its_leading_side_begins() {
    let source = "struct S {\n    // a\n    x: u8,\n}\n";
    let tree = parsed(source);
    let (index, start) = first_of_kind(&tree, "attributed_field_declaration");
    let comment = u32::try_from(source.find("// a").expect("the comment")).expect("a u32 byte");
    let alone = tree.snapshot_node::<AnyNode>(index, None).expect("a node");
    assert!(matches!(alone, Ok(NodeRead::Node(_))), "{alone:?}");
    assert_eq!(alone, tree.snapshot_node::<AnyNode>(index, Some(comment)).expect("a node"));
    assert_eq!(tree.snapshot_node::<AnyNode>(index, Some(start)), Some(Err(ReadError::Unmeasured { index, byte: comment })));
}
