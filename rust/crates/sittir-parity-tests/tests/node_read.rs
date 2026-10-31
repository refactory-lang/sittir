//! A read of a node by its index answers what the error check and the read
//! answer apart: the `ERROR` holding the node, else the node, and nothing
//! past the tree's last node. A snapshot likewise.

use sittir_core::engine::{claim_tree_id, Engine, NodeRead};
use sittir_core::read::Depth;
use sittir_core::types::NodeIndex;
use sittir_rust::render::AnyNode;

#[test]
fn a_node_read_answers_the_error_holding_it_or_its_read() {
    for source in ["fn f(a: u8) { g(a + 1); }\n", "fn f() { if @@ { while @@ { ] } } }", "@@ ( @@ [", ""] {
        let mut engine = Engine::new(sittir_rust::RustGrammar, sittir_rust::render::options::defaults()).expect("an engine");
        let tree = engine.parse(source, claim_tree_id().expect("a tree id")).expect("a parse");
        let count = sittir_core::read::descendant_count(&tree.tree().root_node());
        for index in (0..count).map(NodeIndex::new) {
            let apart = match tree.read_error(index) {
                Some(error) => Ok(NodeRead::Error(error)),
                None => tree.read::<AnyNode>(index, Depth::All).map(NodeRead::Node),
            };
            assert_eq!(tree.read_node::<AnyNode>(index, Depth::All), Some(apart), "{source:?} read at {index:?}");
            let snapped = match tree.snapshot_error(index, None) {
                Some(error) => Ok(NodeRead::Error(error)),
                None => tree.snapshot::<AnyNode>(index, None).map(NodeRead::Node),
            };
            assert_eq!(tree.snapshot_node::<AnyNode>(index, None), Some(snapped), "{source:?} snapshot at {index:?}");
        }
        assert_eq!(tree.read_node::<AnyNode>(NodeIndex::new(count), Depth::All), None, "{source:?} past its last node");
        assert_eq!(tree.snapshot_node::<AnyNode>(NodeIndex::new(count), None), None, "{source:?} past its last node");
    }
}
