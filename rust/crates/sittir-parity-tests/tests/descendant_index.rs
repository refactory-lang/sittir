//! A cursor numbers from the node it starts on. The native query walks from
//! its start node and adds that node's index; these tests hold that rule to
//! tree-sitter over whole sources.

use tree_sitter::{Language, Node, Parser, Tree};

fn parse(language: &Language, source: &str) -> Tree {
    let mut parser = Parser::new();
    parser.set_language(language).unwrap();
    parser.parse(source, None).unwrap()
}

/// Every node of `tree` in pre-order, with its root-cursor index.
fn indexed(tree: &Tree) -> Vec<(usize, Node<'_>)> {
    let mut out = Vec::new();
    let mut cursor = tree.walk();
    loop {
        out.push((cursor.descendant_index(), cursor.node()));
        if cursor.goto_first_child() {
            continue;
        }
        loop {
            if cursor.goto_next_sibling() {
                break;
            }
            if !cursor.goto_parent() {
                return out;
            }
        }
    }
}

fn check(language: &Language, source: &str) {
    let tree = parse(language, source);
    let nodes = indexed(&tree);
    for (i, (index, node)) in nodes.iter().enumerate() {
        assert_eq!(*index, i, "pre-order position");
        let end = index + node.descendant_count();
        let mut cursor = node.walk();
        for (d, (expected_index, expected)) in nodes[*index..end].iter().enumerate() {
            cursor.goto_descendant(d);
            assert_eq!(cursor.descendant_index(), d);
            assert_eq!(cursor.node(), *expected, "start {index}, offset {d}");
            assert_eq!(index + d, *expected_index);
        }
        let mut at = index + 1;
        for position in 0..node.child_count() as u32 {
            let child = node.child(position).unwrap();
            let (expected, _) = nodes.iter().find(|(_, n)| *n == child).unwrap();
            assert_eq!(at, *expected, "child {position} of {index}");
            at += child.descendant_count();
        }
        if let Some((_, after)) = nodes.get(end) {
            let mut ancestor = after.parent();
            while let Some(a) = ancestor {
                assert_ne!(a, *node, "the node after {index}'s range is not its descendant");
                ancestor = a.parent();
            }
        }
    }
}

#[test]
fn rust_offsets_from_every_start_node_are_root_indexes() {
    check(&sittir_rust::language(), "/// doc\nfn f(a: u8, /* x */ b: u8) -> u8 {\n    a + b // y\n}\n");
}

#[test]
fn typescript_offsets_from_every_start_node_are_root_indexes() {
    check(&sittir_typescript::language(), "const a = [1, , 2]; // c\nclass C { m(): void {} }\n");
}

#[test]
fn python_offsets_from_every_start_node_are_root_indexes() {
    check(&sittir_python::language(), "def f(a):\n    # c\n    return a\n");
}
