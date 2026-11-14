//! A snapshot seats every node's sides through one lookup cursor, moved from
//! node to node, and answers as the tree's own lookup does when it seats
//! each side alone: a side whose baseline renders a region that holds sides
//! of its own seats both, the inner while the outer is being measured. Each
//! lookup moves the cursor from where the last one left it, so a deeper tree
//! costs its lookups no more climbing a level, and the trivia placement a
//! lookup starts moves that cursor too, so it descends from the root no
//! more often in a deeper tree.

use sittir_core::engine::ParsedTree;
use sittir_core::layout::LayoutWork;
use sittir_core::read::SideLookup;
use sittir_core::trivia_table::TriviaSide;
use sittir_core::types::NodeIndex;
use sittir_parity_tests::{block_chain, indented_block_line, on_deep_stack, parsed_rust, probe_input, tuple_chain, unary_chain, wide_unit_blocks};
use sittir_rust::RustGrammar;

/// Lists inside lists, each with runs and comments beside its items.
const NESTED: &str = "fn f() {\n    let x = (\n        1, // one\n        (\n            2, /* two */\n            3,\n        ),\n    );\n}\n";

/// Each side of a tree seated by lookups of its own (`ParsedTree::seating`).
struct Alone<'t>(&'t ParsedTree<RustGrammar>);

impl SideLookup for Alone<'_> {
    fn side(&self, index: NodeIndex, side: TriviaSide, edge_changed: bool) -> Box<dyn std::any::Any> {
        self.0.seating().side(index, side, edge_changed)
    }

    fn slots(&self, index: NodeIndex) -> Vec<sittir_core::layout::SlotLayout> {
        self.0.seating().slots(index)
    }

    fn end_children(&self, index: NodeIndex) -> Option<[sittir_core::nodes::Kid; 2]> {
        self.0.seating().end_children(index)
    }

    fn separator(&self, index: NodeIndex) -> Option<sittir_core::KindId> {
        self.0.seating().separator(index)
    }

    fn leading_start(&self, index: NodeIndex) -> Option<u32> {
        self.0.seating().leading_start(index)
    }
}

/// The snapshot layouts of `tree`'s root, each side seated by lookups of its
/// own (`Alone`).
fn seated_alone(tree: &ParsedTree<RustGrammar>) -> sittir_core::layout::SnapshotLayouts<<RustGrammar as sittir_core::engine::EngineGrammar>::Trivia> {
    tree.snapshot_layouts_seated(NodeIndex::ROOT, None, &Alone(tree)).expect("a root").expect("a snapshot")
}

#[test]
fn a_snapshot_seats_nested_sides_as_the_tree_seats_each_alone() {
    for (name, source) in [("nested", NESTED.to_owned()), ("spacing.rs", probe_input("spacing.rs")), ("engine.rs", probe_input("engine.rs"))] {
        let through_one = parsed_rust(&source).snapshot_layouts(NodeIndex::ROOT, None).expect("a root").expect("a snapshot");
        assert_eq!(through_one, seated_alone(&parsed_rust(&source)), "{name}");
    }
}

#[test]
fn a_region_s_render_finds_every_node_it_looks_up_inside_the_region() {
    for (name, source) in [("nested", NESTED.to_owned()), ("spacing.rs", probe_input("spacing.rs")), ("engine.rs", probe_input("engine.rs"))] {
        let tree = parsed_rust(&source);
        tree.snapshot_layouts(NodeIndex::ROOT, None).expect("a root").expect("a snapshot");
        assert_ne!(tree.records_rendered(), 0, "{name}: the snapshot renders regions");
        assert_eq!(tree.layout_work().region_fallbacks, 0, "{name}");
    }
}

/// The work a snapshot of `chain`'s chain of `levels` does.
fn chain_work(chain: fn(usize) -> String, levels: usize) -> LayoutWork {
    on_deep_stack(move || {
        let tree = parsed_rust(&chain(levels));
        tree.snapshot_layouts(NodeIndex::ROOT, None).expect("a root").expect("a snapshot");
        tree.layout_work()
    })
}

#[test]
fn a_snapshot_s_lookups_climb_the_same_levels_at_each_level_of_a_chain() {
    let [one, two, four] = [100, 200, 400].map(|levels| chain_work(tuple_chain, levels));
    assert_eq!(four.cursor_climbs - two.cursor_climbs, 2 * (two.cursor_climbs - one.cursor_climbs), "climbs at 100, 200 and 400 levels: {}, {}, {}", one.cursor_climbs, two.cursor_climbs, four.cursor_climbs);
    assert_eq!(four.region_fallbacks, 0);
}

#[test]
fn a_snapshot_s_trivia_placement_descends_from_the_root_as_often_at_any_depth() {
    for (name, chain) in [("tuple types", tuple_chain as fn(usize) -> String), ("blocks", block_chain), ("`!` operators", unary_chain)] {
        let descents = [100, 200, 400].map(|levels| chain_work(chain, levels).root_descents);
        assert!(descents.iter().all(|&count| count == descents[0]), "{name}: root descents at 100, 200 and 400 levels: {descents:?}");
    }
}

#[test]
fn the_trivia_walk_of_a_chain_folds_the_same_bounds_at_each_level() {
    let folds = [100, 200, 400].map(|levels| {
        let tree = parsed_rust(&tuple_chain(levels));
        let folds = sittir_core::trivia_table::walk(&mut tree.nodes(), NodeIndex::ROOT, &tuple_chain(levels)).folds;
        folds
    });
    let [one, two, four] = folds;
    assert_eq!(four - two, 2 * (two - one), "folds at 100, 200 and 400 levels: {one}, {two}, {four}");
}

#[test]
fn the_trivia_table_of_a_chain_steps_through_the_same_children_at_each_level() {
    let [one, two, four] = [100, 200, 400].map(|levels| parsed_rust(&tuple_chain(levels)).placed_trivia().steps());
    assert_eq!(four - two, 2 * (two - one), "children stepped at 100, 200 and 400 levels: {one}, {two}, {four}");
}

#[test]
fn the_trivia_table_of_a_chain_of_blocks_opens_and_closes_each_depth_stretch_once() {
    let [one, two, four] = [100, 200, 400].map(|levels| parsed_rust(&block_chain(levels)).placed_trivia().stretch_steps());
    assert_ne!(one, 0, "every block is a stretch");
    assert_eq!(four - two, 2 * (two - one), "stretch steps at 100, 200 and 400 levels: {one}, {two}, {four}");
}

#[test]
fn the_trivia_table_of_blocks_opened_on_one_indented_line_reads_its_indentation_once() {
    let [one, two, four] = [100, 200, 400].map(|levels| parsed_rust(&indented_block_line(levels)).placed_trivia().stretch_steps());
    assert_eq!(four - two, 2 * (two - one), "stretch steps at 100, 200 and 400 levels: {one}, {two}, {four}");
}

#[test]
fn the_record_of_a_chain_of_blocks_tallies_the_same_text_at_each_level() {
    let [one, two, four] = [100, 200, 400].map(|levels| {
        on_deep_stack(move || {
            let tree = parsed_rust(&block_chain(levels));
            tree.snapshot_layouts(NodeIndex::ROOT, None).expect("a root").expect("a snapshot");
            tree.records_scanned()
        })
    });
    assert_ne!(one, 0, "the snapshot renders a record");
    assert_eq!(four - two, 2 * (two - one), "bytes tallied at 100, 200 and 400 levels: {one}, {two}, {four}");
}

#[test]
fn the_record_of_blocks_under_a_wide_indentation_unit_tallies_the_unit_once() {
    let [one, two, four] = [100, 200, 400].map(|levels| {
        on_deep_stack(move || {
            let tree = parsed_rust(&wide_unit_blocks(levels));
            assert_eq!(tree.inferred().indent.as_ref().map(String::len), Some(levels), "the unit is the line's indentation");
            tree.snapshot_layouts(NodeIndex::ROOT, None).expect("a root").expect("a snapshot");
            tree.records_scanned()
        })
    });
    assert_eq!(four - two, 2 * (two - one), "bytes tallied at 100, 200 and 400 levels: {one}, {two}, {four}");
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
                carried: None,
            };
            assert_eq!(tree.seating().depth_move(&coord), 0, "{levels} levels: a chain of tuples opens no level");
        }
        assert_eq!(tree.layout_work().depth_nodes, nodes, "{levels} levels");
    }
}

#[test]
fn a_snapshot_renders_one_record_however_deep_its_tree() {
    for levels in [100, 200, 400] {
        let records = on_deep_stack(move || {
            let tree = parsed_rust(&tuple_chain(levels));
            tree.snapshot_layouts(NodeIndex::ROOT, None).expect("a root").expect("a snapshot");
            tree.records_rendered()
        });
        assert_eq!(records, 1, "{levels} levels");
    }
}
