//! The tree backer of the navigation interface (`TreeNodes`) answers each
//! node's facts, children and parent as the tree does, moving its cursor
//! from where it last stood: a preorder sweep never descends from the root.
//! A cursor a reader lends, created at a node of the tree, serves every
//! node of that node's subtree, and the backer finds the rest of the tree
//! from the root.

use sittir_core::engine::{node_at_index, EngineGrammar};
use sittir_core::nodes::{Kid, Nodes, TreeNodes};
use sittir_core::options::ResolvedOptions;
use sittir_core::read::{descendant_count, goto, index_of, offset_of};
use sittir_core::types::NodeIndex;
use sittir_parity_tests::{each_grammar, fixture_sources, parsed};

/// The longest round-trip fixture source of `name`.
fn longest_fixture(name: &str) -> String {
    fixture_sources(name).into_iter().max_by_key(String::len).expect("a fixture source")
}

/// The children of `node` at `index`, each read from a walk of it.
fn walked_kids(node: tree_sitter::Node<'_>, index: NodeIndex) -> Vec<Kid> {
    let mut cursor = node.walk();
    let mut kids = Vec::new();
    if cursor.goto_first_child() {
        loop {
            kids.push(Kid::of(&cursor.node(), index + offset_of(&cursor)));
            if !cursor.goto_next_sibling() {
                break;
            }
        }
    }
    kids
}

/// Every node of `tree`, in reverse preorder then in preorder, read through
/// `nodes` and from the tree, each pair asserted equal.
fn assert_reads_as_the_tree(name: &str, tree: &tree_sitter::Tree, nodes: &mut dyn Nodes<'_>) {
    let count = descendant_count(&tree.root_node());
    for index in (0..count).rev().chain(0..count) {
        let at = NodeIndex::new(index);
        let node = node_at_index(tree, at).expect("a node");
        assert_eq!(nodes.kid(at), Kid::of(&node, at), "{name}: the node at {index}");
        assert_eq!(&*nodes.kids(at), walked_kids(node, at).as_slice(), "{name}: the children of {index}");
        let mut cursor = tree.walk();
        goto(&mut cursor, at);
        let parent = cursor.goto_parent().then(|| index_of(&cursor));
        assert_eq!(nodes.parent(at), parent, "{name}: the parent of {index}");
    }
}

/// The nodes a preorder sweep of `kids` from the node at `from` visits.
fn sweep(nodes: &mut dyn Nodes<'_>, from: NodeIndex) -> u32 {
    let mut pending = vec![from];
    let mut visited = 0;
    while let Some(at) = pending.pop() {
        visited += 1;
        pending.extend(nodes.kids(at).iter().rev().map(|kid| kid.index));
    }
    visited
}

/// The child of the root of `tree` with the most nodes under it.
fn largest_top(tree: &tree_sitter::Tree) -> Kid {
    walked_kids(tree.root_node(), NodeIndex::ROOT).into_iter().max_by_key(|kid| kid.count).expect("a child of the root")
}

/// Every node of `name`'s longest fixture read through a `TreeNodes` of its
/// own and through one moving a cursor lent from the subtree of the root's
/// largest child: the tree's count and that subtree's.
fn nodes_match_the_tree<G: EngineGrammar + Copy>(name: &str, grammar: G, options: fn() -> ResolvedOptions) -> (u32, u32) {
    let source = longest_fixture(name);
    let parsed = parsed(grammar, options(), &source);
    let tree = parsed.tree();
    let mut nodes = TreeNodes::new(tree, &source);
    assert_eq!(nodes.text(), source);
    assert_reads_as_the_tree(name, tree, &mut nodes);
    let top = largest_top(tree);
    let mut cursor = node_at_index(tree, top.index).expect("the root's child").walk();
    assert_reads_as_the_tree(name, tree, &mut TreeNodes::over(tree, &source, &mut cursor, top.index..top.index + top.count));
    (descendant_count(&tree.root_node()), top.count)
}

#[test]
fn tree_nodes_match_the_tree() {
    let counts = each_grammar!(nodes_match_the_tree);
    eprintln!("nodes read (tree, lent subtree): {counts:?}");
    assert!(counts.iter().all(|(_, (count, lent))| *count > 1 && *lent > 1), "{counts:?}");
}

/// The root descents a preorder sweep over `name`'s longest fixture makes,
/// that of a sweep of the root's largest child's subtree moving a cursor
/// lent from it, and those of two reads deep in different subtrees of the
/// root, which each descend from it.
fn root_descents<G: EngineGrammar + Copy>(name: &str, grammar: G, options: fn() -> ResolvedOptions) -> (u32, u32, u32) {
    let source = longest_fixture(name);
    let parsed = parsed(grammar, options(), &source);
    let tree = parsed.tree();
    let mut nodes = TreeNodes::new(tree, &source);
    assert_eq!(sweep(&mut nodes, NodeIndex::ROOT), descendant_count(&tree.root_node()), "{name}: the sweep visits every node");
    let top = largest_top(tree);
    let mut cursor = node_at_index(tree, top.index).expect("the root's child").walk();
    let mut lent = TreeNodes::over(tree, &source, &mut cursor, top.index..top.index + top.count);
    assert_eq!(sweep(&mut lent, top.index), top.count, "{name}: the lent sweep visits every node of the subtree");
    let grandchildren: Vec<NodeIndex> = walked_kids(tree.root_node(), NodeIndex::ROOT)
        .iter()
        .filter_map(|top| walked_kids(node_at_index(tree, top.index).expect("a child of the root"), top.index).first().map(|kid| kid.index))
        .collect();
    let mut apart = TreeNodes::new(tree, &source);
    if let (Some(&first), Some(&last)) = (grandchildren.first(), grandchildren.last()) {
        apart.kid(first);
        apart.kid(last);
    }
    (nodes.root_descents(), lent.root_descents(), if grandchildren.len() > 1 { apart.root_descents() } else { 2 })
}

#[test]
fn tree_nodes_never_descend_from_the_root_in_a_sweep() {
    let descents = each_grammar!(root_descents);
    eprintln!("root descents (sweep, lent sweep, apart): {descents:?}");
    assert!(descents.iter().all(|(_, (swept, lent, _))| *swept == 0 && *lent == 0), "{descents:?}");
    assert!(descents.iter().all(|(_, (_, _, apart))| *apart == 2), "two reads deep in different subtrees each descend from the root: {descents:?}");
}
