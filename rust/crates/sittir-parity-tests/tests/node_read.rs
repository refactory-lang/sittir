//! A read of a node by its index answers what the error check and the read
//! answer apart: the `ERROR` holding the node, else the node, and nothing
//! past the tree's last node. A snapshot likewise: the `ERROR`'s row alone,
//! else the node's own row first.

use sittir_core::engine::NodeRead;
use sittir_core::read::{Depth, Origin};
use sittir_core::types::NodeIndex;
use sittir_parity_tests::parsed_rust;
use sittir_rust::render::AnyNode;

#[test]
fn a_node_read_answers_the_error_holding_it_or_its_read() {
    for source in ["fn f(a: u8) { g(a + 1); }\n", "fn f() { if @@ { while @@ { ] } } }", "@@ ( @@ [", ""] {
        let tree = parsed_rust(source);
        let count = sittir_core::read::descendant_count(&tree.tree().root_node());
        for index in (0..count).map(NodeIndex::new) {
            let apart = match tree.read_error(index) {
                Some(error) => Ok(NodeRead::Error(error)),
                None => tree.read::<AnyNode>(index, Depth::All).map(NodeRead::Node),
            };
            assert_eq!(tree.read_node::<AnyNode>(index, Depth::All), Some(apart), "{source:?} read at {index:?}");
            let first = tree.snapshot_layouts(index, None).expect("a node").map(|rows| rows.iter().map(|(row, _)| *row).collect::<Vec<_>>());
            match tree.read_error(index) {
                Some(error) => {
                    let Origin::Tree(at) = error.at else { panic!("a live read names the ERROR's coordinate") };
                    assert_eq!(first, Ok(vec![at.index]), "{source:?} snapshot at {index:?}: the ERROR holding it, alone");
                }
                None => {
                    if let Ok(rows) = first {
                        assert_eq!(rows.first(), Some(&index), "{source:?} snapshot at {index:?}: its own row first");
                    }
                }
            }
        }
        assert_eq!(tree.read_node::<AnyNode>(NodeIndex::new(count), Depth::All), None, "{source:?} past its last node");
        assert_eq!(tree.snapshot_layouts(NodeIndex::new(count), None), None, "{source:?} past its last node");
    }
}
