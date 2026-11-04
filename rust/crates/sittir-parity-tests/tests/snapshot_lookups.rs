//! A snapshot seats every node's sides through one lookup cursor, moved from
//! node to node, and answers as the tree's own lookup does when it seats
//! each side alone: a side whose baseline renders a region that holds sides
//! of its own seats both, the inner while the outer is being measured. Each
//! lookup moves the cursor from where the last one left it, so a deeper tree
//! costs its lookups no more climbing a level.

use sittir_core::engine::ParsedTree;
use sittir_core::layout::LayoutWork;
use sittir_core::read::{Depth, ReadNode, SnapshotCtx};
use sittir_core::types::NodeIndex;
use sittir_rust::render::AnyNode;
use sittir_parity_tests::{on_deep_stack, parsed_rust, probe_input, tuple_chain};
use sittir_rust::RustGrammar;

/// Lists inside lists, each with runs and comments beside its items.
const NESTED: &str = "fn f() {\n    let x = (\n        1, // one\n        (\n            2, /* two */\n            3,\n        ),\n    );\n}\n";

/// The snapshot of `tree`'s root, each side seated by a lookup of its own
/// (`ParsedTree::seating_ctx`).
fn seated_alone(tree: &ParsedTree<RustGrammar>) -> AnyNode {
    let mut ctx = tree.seating_ctx().snapshot(SnapshotCtx::new(tree.lines(), None, NodeIndex::ROOT));
    AnyNode::read(&mut tree.tree().walk(), &mut ctx, Depth::All).expect("a read")
}

#[test]
fn a_snapshot_seats_nested_sides_as_the_tree_seats_each_alone() {
    for (name, source) in [("nested", NESTED.to_owned()), ("spacing.rs", probe_input("spacing.rs")), ("engine.rs", probe_input("engine.rs"))] {
        let through_one = parsed_rust(&source).snapshot::<AnyNode>(NodeIndex::ROOT, None).expect("a snapshot");
        assert_eq!(through_one, seated_alone(&parsed_rust(&source)), "{name}");
    }
}

#[test]
fn a_region_s_render_finds_every_node_it_looks_up_inside_the_region() {
    for (name, source) in [("nested", NESTED.to_owned()), ("spacing.rs", probe_input("spacing.rs")), ("engine.rs", probe_input("engine.rs"))] {
        let tree = parsed_rust(&source);
        tree.snapshot::<AnyNode>(NodeIndex::ROOT, None).expect("a snapshot");
        assert_ne!(tree.records_rendered(), 0, "{name}: the snapshot renders regions");
        assert_eq!(tree.layout_work().region_fallbacks, 0, "{name}");
    }
}

/// The work a snapshot of a chain of `levels` does.
fn chain_work(levels: usize) -> LayoutWork {
    on_deep_stack(move || {
        let tree = parsed_rust(&tuple_chain(levels));
        tree.snapshot::<AnyNode>(NodeIndex::ROOT, None).expect("a snapshot");
        tree.layout_work()
    })
}

#[test]
fn a_snapshot_s_lookups_climb_the_same_levels_at_each_level_of_a_chain() {
    let [one, two, four] = [100, 200, 400].map(chain_work);
    assert_eq!(four.cursor_climbs - two.cursor_climbs, 2 * (two.cursor_climbs - one.cursor_climbs), "climbs at 100, 200 and 400 levels: {}, {}, {}", one.cursor_climbs, two.cursor_climbs, four.cursor_climbs);
    assert_eq!(four.region_fallbacks, 0);
}

#[test]
fn the_trivia_walk_of_a_chain_folds_the_same_bounds_at_each_level() {
    let folds = [100, 200, 400].map(|levels| {
        let tree = parsed_rust(&tuple_chain(levels));
        sittir_core::trivia_table::walk(tree.tree().root_node(), NodeIndex::ROOT, &tuple_chain(levels)).folds
    });
    let [one, two, four] = folds;
    assert_eq!(four - two, 2 * (two - one), "folds at 100, 200 and 400 levels: {one}, {two}, {four}");
}

#[test]
fn the_trivia_table_of_a_chain_steps_through_the_same_children_at_each_level() {
    let [one, two, four] = [100, 200, 400].map(|levels| parsed_rust(&tuple_chain(levels)).trivia_table().steps());
    assert_eq!(four - two, 2 * (two - one), "children stepped at 100, 200 and 400 levels: {one}, {two}, {four}");
}

#[test]
fn the_depth_moves_of_every_node_of_a_chain_walk_its_nodes_once() {
    use sittir_core::render::SourceTable;
    for levels in [100, 200, 400] {
        let tree = parsed_rust(&tuple_chain(levels));
        let nodes = sittir_core::read::descendant_count(&tree.tree().root_node());
        for index in (0..nodes).map(NodeIndex::new) {
            let node = sittir_core::engine::node_at_index(tree.tree(), index).expect("a node");
            let coord = sittir_core::slot::NodeCoordinate {
                tree: tree.tree_id(),
                index,
                end: index + sittir_core::read::descendant_count(&node),
                span: sittir_core::types::Span::of(&node),
                kind: None,
                edges: None,
                writes: None,
            };
            assert_eq!(tree.depth_move(&coord), 0, "{levels} levels: a chain of tuples opens no level");
        }
        assert_eq!(tree.layout_work().depth_nodes, nodes, "{levels} levels");
    }
}

#[test]
fn a_snapshot_renders_one_record_however_deep_its_tree() {
    for levels in [100, 200, 400] {
        let records = on_deep_stack(move || {
            let tree = parsed_rust(&tuple_chain(levels));
            tree.snapshot::<AnyNode>(NodeIndex::ROOT, None).expect("a snapshot");
            tree.records_rendered()
        });
        assert_eq!(records, 1, "{levels} levels");
    }
}
