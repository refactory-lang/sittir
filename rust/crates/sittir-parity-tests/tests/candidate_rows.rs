//! A parsed tree's record candidates name each node as a read of its row
//! does: a record's from the row its record stamps, a leaf's or a header-only
//! record's from its node, which one cursor reaches by moving forward in
//! preorder. A forward move enters each node at most once and steps over
//! each at most once, so reaching every node of a tree costs at most two
//! moves a node, however wide its lists.
#![cfg(feature = "arena")]

use sittir_core::read::{goto_forward, index_of, Depth};
use sittir_core::types::NodeIndex;
use sittir_parity_tests::{fixture_sources, on_deep_stack, parsed_rust};
use sittir_rust::render::AnyNode;

fn identifier_list(members: usize) -> String {
    format!("fn f() {{ let a = [{}]; }}\n", (0..members).map(|i| format!("x{i}")).collect::<Vec<_>>().join(", "))
}

#[test]
fn each_candidate_is_the_coordinate_a_read_of_its_row_names() {
    on_deep_stack(|| {
        let mut sources = fixture_sources("rust");
        sources.push(identifier_list(2000));
        let mut checked = 0;
        for source in sources {
            let tree = parsed_rust(&source);
            if tree.hydrate_record::<AnyNode>(NodeIndex::ROOT, Depth::All).is_err() {
                continue;
            }
            let Ok(candidates) = tree.record_candidates::<AnyNode>(NodeIndex::ROOT) else { continue };
            for candidate in candidates {
                let read = tree.row_coordinate(candidate.index).expect("a candidate names a node");
                assert_eq!((candidate.tree, candidate.index, candidate.end), (read.tree, read.index, read.end), "{source:?}");
                checked += 1;
            }
        }
        assert!(checked > 10_000, "the sources hold candidates: {checked}");
    });
}

#[test]
fn a_forward_move_to_every_index_enters_each_node_once() {
    on_deep_stack(|| {
        for members in [4000, 8000] {
            let tree = parsed_rust(&identifier_list(members));
            let nodes = sittir_core::read::descendant_count(&tree.tree().root_node());
            let mut cursor = tree.tree().walk();
            let mut moves = 0u64;
            for index in 0..nodes {
                moves += u64::from(goto_forward(&mut cursor, NodeIndex(index)));
                assert_eq!(index_of(&cursor), NodeIndex(index), "a {members}-member list lands on node {index}");
            }
            assert!(moves <= 2 * u64::from(nodes), "{moves} moves to reach {nodes} nodes of a {members}-member list");
        }
    });
}
