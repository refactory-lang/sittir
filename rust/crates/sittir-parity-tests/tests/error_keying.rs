//! A run beside an `ERROR` is measured from the `ERROR`'s edge: its text is
//! anchored as a comment's slice is, so a run with a literal on its far
//! side reads the gap it spans, not the frame's stretch across the
//! `ERROR`. Each source renders as it reads, from its snapshot and with
//! every node edited in place.

use sittir_core::engine::{claim_tree_id, Engine};
use sittir_core::prepare::RenderContext;
use sittir_core::read::{read_at, Depth};
use sittir_core::render::SourceTable;
use sittir_core::types::NodeIndex;
use sittir_parity_tests::edit_in_place;
use std::sync::Arc;

struct NoSources;

impl SourceTable for NoSources {
    fn source_of(&self, _tree_id: sittir_core::types::TreeId) -> Option<&Arc<str>> {
        None
    }
}

/// `$source`'s root snapshot rendered, and `$source` rendered with every
/// node's inner side written back (`edit_in_place`).
macro_rules! renders {
    ($krate:ident, $grammar:expr, $source:expr) => {{
        let parse = || {
            let mut engine = Engine::new($grammar, $krate::render::options::defaults()).expect("an engine");
            let tree = engine.parse($source, claim_tree_id().expect("a tree id")).expect("a parse");
            (engine, tree)
        };
        let (engine, tree) = parse();
        let options = engine.options().clone();
        let root: $krate::render::AnyNode = tree.snapshot(NodeIndex::ROOT, None).expect("a snapshot");
        let snapped = $krate::render::render_node_parts(sittir_core::SlotValue::Node(root), &RenderContext { options: &options, sources: &NoSources }, None).expect("a render").1;
        let (engine, tree) = parse();
        (0..sittir_core::read::descendant_count(&tree.tree().root_node())).map(NodeIndex::new).for_each(|index| edit_in_place(&tree, index));
        let root: $krate::render::AnyNode = read_at(&mut tree.tree().walk(), &mut tree.seating_ctx(), NodeIndex::ROOT, Depth::All).expect("a root");
        let options = engine.options().clone();
        let edited = $krate::render::render_node_parts(sittir_core::SlotValue::Node(root), &RenderContext { options: &options, sources: &tree }, None).expect("a render").1;
        (snapped, edited)
    }};
}

#[test]
fn a_python_error_between_brackets_keeps_the_break_after_it() {
    for source in ["f(\n    $\n)\n", "x = [\n    $\n]\n"] {
        let (snapped, edited) = renders!(sittir_python, sittir_python::PythonGrammar, source);
        assert_eq!((snapped.as_str(), edited.as_str()), (source, source));
    }
}

#[test]
fn a_rust_error_alone_in_a_block_keeps_the_blank_line_before_it() {
    let source = "fn f() {\n\n    $\n}\n";
    let (snapped, edited) = renders!(sittir_rust, sittir_rust::RustGrammar, source);
    assert_eq!((snapped.as_str(), edited.as_str()), (source, source));
}
