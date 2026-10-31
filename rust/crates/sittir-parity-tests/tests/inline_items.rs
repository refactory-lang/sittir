//! A read for JavaScript (`ParsedTree::read_node`) brings a list's items with
//! the node that holds the list, each the node its own read at that depth
//! answers, and brings a wrapper item with its own slots read too. The plain
//! read leaves them coordinates past its depth.

use sittir_core::engine::{claim_tree_id, Engine, NodeRead, ParsedTree};
use sittir_core::read::Depth;
use sittir_core::types::NodeIndex;
use sittir_rust::render::node::{ArgumentsNode, AttributedArgumentNode, FieldInitializerListElementsItemNodeSlot, FieldInitializerListNode};
use sittir_rust::RustGrammar;

fn first_of_kind(tree: &tree_sitter::Tree, kind: &str) -> NodeIndex {
    let mut cursor = tree.walk();
    loop {
        if cursor.node().kind() == kind {
            return sittir_core::read::index_of(&cursor);
        }
        if cursor.goto_first_child() {
            continue;
        }
        while !cursor.goto_next_sibling() {
            assert!(cursor.goto_parent(), "no {kind}");
        }
    }
}

fn parsed(source: &str) -> ParsedTree<RustGrammar> {
    let mut engine = Engine::new(sittir_rust::RustGrammar, sittir_rust::render::options::defaults()).expect("an engine");
    engine.parse(source, claim_tree_id().expect("a tree id")).expect("a parse")
}

fn node<T: sittir_core::read::ReadNode>(tree: &ParsedTree<RustGrammar>, index: NodeIndex, depth: Depth) -> T {
    let Some(Ok(NodeRead::Node(node))) = tree.read_node::<T>(index, depth) else { panic!("a read of {index:?}") };
    node
}

#[test]
fn a_list_s_items_arrive_read_with_the_node_that_holds_it() {
    let tree = parsed("fn f() { S { a: 1, b: g(2) }; }\n");
    let list = first_of_kind(tree.tree(), "field_initializer_list");
    let plain = tree.read::<FieldInitializerListNode>(list, Depth::ONE).expect("a read");
    let plain = &plain.initializers.as_ref().and_then(|list| list.node()).expect("the list arrives with its owner").item;
    assert!(plain.iter().all(|item| item.coord().is_some()), "the plain read leaves items with structure past its depth");
    let inline = node::<FieldInitializerListNode>(&tree, list, Depth::ONE);
    let inline = &inline.initializers.as_ref().and_then(|list| list.node()).expect("the list arrives with its owner").item;
    assert_eq!(inline.len(), 2);
    for (item, coord) in inline.iter().zip(plain.iter()) {
        let index = coord.coord().expect("a coordinate").index;
        assert_eq!(item.node(), Some(&node::<FieldInitializerListElementsItemNodeSlot>(&tree, index, Depth::ONE)), "item {index:?} reads as its own read does");
    }
}

#[test]
fn a_wrapper_item_arrives_with_its_own_slots_read() {
    let tree = parsed("fn f() { g(a + 1, #[x] h(b)); }\n");
    let arguments = first_of_kind(tree.tree(), "arguments");
    let plain = tree.read::<ArgumentsNode>(arguments, Depth::ONE).expect("a read");
    let plain = &plain.elements.as_ref().and_then(|list| list.node()).expect("the list arrives with its owner").item;
    assert!(plain.iter().all(|item| item.coord().is_some()), "the plain read leaves items with structure past its depth");
    let inline = node::<ArgumentsNode>(&tree, arguments, Depth::ONE);
    let inline = &inline.elements.as_ref().and_then(|list| list.node()).expect("the list arrives with its owner").item;
    assert_eq!(inline.len(), 2);
    let two = Depth::ONE.above();
    for (item, coord) in inline.iter().zip(plain.iter()) {
        let index = coord.coord().expect("a coordinate").index;
        let wrapper = item.node().expect("a wrapper arrives read");
        assert_eq!(wrapper, &node::<AttributedArgumentNode>(&tree, index, two), "wrapper {index:?} reads as its own read a level deeper does");
        assert!(wrapper.expression.node().is_some(), "wrapper {index:?} holds its content read");
        assert!(wrapper.attribute_item.iter().all(|attribute| attribute.node().is_some()), "wrapper {index:?} holds its decorations read");
    }
}
