//! A snapshot root's read stamps its flanks: the gap kind from its start to
//! where its first child's render begins and from where its last child's
//! ends to its end, measured from geometry as the render once measured them.

use sittir_core::engine::{claim_tree_id, Engine};
use sittir_core::layout_kinds::{Flanks, LayoutKinds};
use sittir_core::types::NodeIndex;
use sittir_rust::render::AnyNode;

fn flanks_of(source: &str) -> Flanks {
    let mut engine = Engine::new(sittir_rust::RustGrammar, sittir_rust::render::options::defaults()).expect("an engine");
    let tree = engine.parse(source, claim_tree_id().expect("a tree id")).expect("a parse");
    match tree.snapshot::<AnyNode>(NodeIndex::ROOT, None).expect("a snapshot") {
        AnyNode::SourceFile(root) => root.layout.map(|layout| layout.flanks).unwrap_or_default(),
        _ => panic!("{source:?} snapshots as a source file"),
    }
}

const fn flanks(before: LayoutKinds, after: LayoutKinds) -> Flanks {
    Flanks { before, after }
}

#[test]
fn a_snapshot_root_stamps_the_gaps_before_its_first_item_and_after_its_last() {
    assert_eq!(flanks_of("\n\nuse a;\n\nuse b;\n"), flanks(LayoutKinds::BLANKLINE, LayoutKinds::NEWLINE));
    assert_eq!(flanks_of("use a;"), flanks(LayoutKinds::TIGHT, LayoutKinds::TIGHT));
    assert_eq!(flanks_of("  use a;  "), flanks(LayoutKinds::SPACE, LayoutKinds::SPACE));
}

#[test]
fn a_snapshot_root_s_flank_reaches_past_the_trivia_of_its_end_items() {
    assert_eq!(flanks_of("\n/* a */ use a;\nuse b; /* b */\n\n"), flanks(LayoutKinds::NEWLINE, LayoutKinds::BLANKLINE));
}

#[test]
fn a_snapshot_root_with_no_items_stamps_the_gaps_around_its_inner_trivia() {
    assert_eq!(flanks_of("\n\n/* only */\n\n"), flanks(LayoutKinds::BLANKLINE, LayoutKinds::BLANKLINE));
}

#[test]
fn a_snapshot_root_with_no_children_stamps_none() {
    assert_eq!(flanks_of(""), Flanks::default());
}
