//! A tree's depth members, found once (`DepthMembers::of`), count the
//! levels any subtree opens net of those it closes as a walk of that
//! subtree counts them, the interiors of `ERROR`s and extras included.

use sittir_core::tree_sitter;
use sittir_core::trivia_table::{DepthMembers, SurfaceKinds};
use sittir_core::types::NodeIndex;

fn walked(node: tree_sitter::Node<'_>, kinds: SurfaceKinds) -> i32 {
    let mut cursor = node.walk();
    let mut net = 0;
    loop {
        let kind = sittir_core::read::grammar_id(&cursor.node());
        if kinds.is_depth_member(kind) {
            net += i32::from(kind == kinds.indent) - i32::from(kind == kinds.dedent);
        }
        if cursor.goto_first_child() {
            continue;
        }
        while !cursor.goto_next_sibling() {
            if !cursor.goto_parent() {
                return net;
            }
        }
    }
}

#[test]
fn the_members_of_every_subtree_count_as_a_walk_of_it() {
    let kinds = sittir_python::render::kind_ids::SURFACE_KINDS;
    let sources = [
        "def f(a):\n    if a:\n        return 1\n    return 2\n",
        "class C:\n    def f(self):\n        pass\n\n    def g(self):\n        # c\n        return [\n            1,\n        ]\n",
        "def f(:\n    if a\n        return 1\n  x = 2\n",
        "",
    ];
    let mut opened = 0;
    for source in sources {
        let mut parser = tree_sitter::Parser::new();
        parser.set_language(&sittir_python::language()).expect("the language");
        let tree = parser.parse(source, None).expect("a parse");
        let members = DepthMembers::of(&tree, kinds);
        let count = sittir_core::read::descendant_count(&tree.root_node());
        assert_eq!(members.walked(), count, "{source:?}: the walk visits every node once");
        for index in 0..count {
            let at = NodeIndex::new(index);
            let node = sittir_core::engine::node_at_index(&tree, at).expect("a node");
            let net = walked(node, kinds);
            assert_eq!(members.between(at, at + sittir_core::read::descendant_count(&node)), net, "{source:?} at {index}");
            opened += u32::from(net != 0);
        }
    }
    assert_ne!(opened, 0, "some subtree opens a level");
}

#[test]
fn a_tree_counts_its_depth_members_from_its_first_depth_move() {
    use sittir_core::heap::HeapBytes;
    use sittir_core::render::SourceTable;
    let mut tree = sittir_parity_tests::parsed(sittir_python::PythonGrammar, sittir_python::render::options::defaults(), "def f(a):\n    if a:\n        return 1\n");
    let _ = tree.take_grown();
    let parsed = tree.native_bytes();
    let root = tree.tree().root_node();
    let coord = sittir_core::slot::NodeCoordinate {
        tree: tree.tree_id(),
        index: NodeIndex::ROOT,
        end: NodeIndex::new(sittir_core::read::descendant_count(&root)),
        span: sittir_core::types::Span::of(&root),
        kind: None,
        edges: None,
        writes: None,
    };
    let table = DepthMembers::of(tree.tree(), sittir_python::render::kind_ids::SURFACE_KINDS).heap_bytes();
    assert_ne!(table, 0, "the source has depth members");
    assert!(!tree.take_grown(), "nothing grew before a depth move");
    assert_eq!(tree.depth_move(&coord), 0, "the whole tree opens as many levels as it closes");
    assert!(tree.take_grown(), "the first depth move grows the tree");
    assert_eq!(tree.native_bytes(), parsed + table, "by its depth members");
    assert_eq!(tree.depth_move(&coord), 0);
    assert!(!tree.take_grown(), "a later move finds them made");
    assert_eq!(tree.native_bytes(), parsed + table);
}
