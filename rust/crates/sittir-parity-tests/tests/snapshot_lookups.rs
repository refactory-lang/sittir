//! A snapshot seats every node's sides through one lookup cursor, moved from
//! node to node, and answers as the tree's own lookup does when it seats
//! each side alone: a side whose baseline renders a region that holds sides
//! of its own seats both, the inner while the outer is being measured. Each
//! lookup moves the cursor from where the last one left it, so a deeper tree
//! costs its lookups no more climbing a level.

use sittir_core::engine::{claim_tree_id, Engine, ParsedTree};
use sittir_core::layout::LayoutWork;
use sittir_core::read::{Depth, ReadNode, SnapshotCtx};
use sittir_core::types::NodeIndex;
use sittir_rust::render::AnyNode;
use sittir_rust::RustGrammar;

/// Lists inside lists, each with runs and comments beside its items.
const NESTED: &str = "fn f() {\n    let x = (\n        1, // one\n        (\n            2, /* two */\n            3,\n        ),\n    );\n}\n";

fn probe_input(name: &str) -> String {
    let path = format!("{}/../../../docs/superpowers/probes/2026-10-01-shared-arena/transport/inputs/{name}", env!("CARGO_MANIFEST_DIR"));
    std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("{path}: {e}"))
}

/// A fresh parse of `source`, so no cache one read fills answers another.
fn parsed(source: &str) -> ParsedTree<RustGrammar> {
    let mut engine = Engine::new(RustGrammar, sittir_rust::render::options::defaults()).expect("an engine");
    engine.parse(source, claim_tree_id().expect("a tree id")).expect("a parse")
}

/// The snapshot of `tree`'s root, each side seated by a lookup of its own
/// (`ParsedTree::seating_ctx`).
fn seated_alone(tree: &ParsedTree<RustGrammar>) -> AnyNode {
    let mut ctx = tree.seating_ctx().snapshot(SnapshotCtx::new(tree.lines(), None, NodeIndex::ROOT));
    AnyNode::read(&mut tree.tree().walk(), &mut ctx, Depth::All).expect("a read")
}

#[test]
fn a_snapshot_seats_nested_sides_as_the_tree_seats_each_alone() {
    for (name, source) in [("nested", NESTED.to_owned()), ("spacing.rs", probe_input("spacing.rs")), ("engine.rs", probe_input("engine.rs"))] {
        let through_one = parsed(&source).snapshot::<AnyNode>(NodeIndex::ROOT, None).expect("a snapshot");
        assert_eq!(through_one, seated_alone(&parsed(&source)), "{name}");
    }
}

#[test]
fn a_region_s_render_finds_every_node_it_looks_up_inside_the_region() {
    for (name, source) in [("nested", NESTED.to_owned()), ("spacing.rs", probe_input("spacing.rs")), ("engine.rs", probe_input("engine.rs"))] {
        let tree = parsed(&source);
        tree.snapshot::<AnyNode>(NodeIndex::ROOT, None).expect("a snapshot");
        assert_ne!(tree.records_rendered(), 0, "{name}: the snapshot renders regions");
        assert_eq!(tree.layout_work().region_fallbacks, 0, "{name}");
    }
}

/// `levels` tuple types, each holding the one before it: `((u8,),)`.
fn chain(levels: usize) -> String {
    format!("type T = {}u8{};\n", "(".repeat(levels), ",)".repeat(levels))
}

/// The work a snapshot of `chain(levels)` does, on a thread whose stack the
/// read fits on at every level.
fn chain_work(levels: usize) -> LayoutWork {
    let snapshot = move || {
        let tree = parsed(&chain(levels));
        tree.snapshot::<AnyNode>(NodeIndex::ROOT, None).expect("a snapshot");
        tree.layout_work()
    };
    std::thread::Builder::new().stack_size(64 * 1024 * 1024).spawn(snapshot).expect("a thread").join().expect("no panic")
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
        let tree = parsed(&chain(levels));
        sittir_core::trivia_table::walk(tree.tree().root_node(), NodeIndex::ROOT, &chain(levels)).folds
    });
    let [one, two, four] = folds;
    assert_eq!(four - two, 2 * (two - one), "folds at 100, 200 and 400 levels: {one}, {two}, {four}");
}

#[test]
fn a_snapshot_s_depth_moves_walk_each_node_of_a_chain_once() {
    for levels in [100, 200, 400] {
        let nodes = sittir_core::read::descendant_count(&parsed(&chain(levels)).tree().root_node());
        assert_eq!(chain_work(levels).depth_nodes, nodes, "{levels} levels");
    }
}
