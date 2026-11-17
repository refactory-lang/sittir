//! A snapshot of a flat list whose members are unit kinds reads no gap's
//! baseline: the options decide every gap away from a comment, so the gap
//! steps it takes are none however long the list (`LayoutWork::gap_items`).

use sittir_core::engine::{EngineGrammar, ParsedTree};
use sittir_core::types::NodeIndex;
use sittir_parity_tests::{on_deep_stack, parsed};

/// The gap steps a snapshot of `tree`'s root took.
fn gap_items<G: EngineGrammar>(tree: &ParsedTree<G>) -> u32 {
    tree.snapshot_layouts(NodeIndex::ROOT, None).expect("a root").expect("a snapshot");
    tree.layout_work().gap_items
}

#[test]
fn a_snapshot_of_a_flat_list_of_unit_kinds_takes_no_gap_steps() {
    let python = [100, 200, 400].map(|members| {
        on_deep_stack(move || {
            let tree = parsed(sittir_python::PythonGrammar, sittir_python::render::options::defaults(), &format!("x = [{}]\n", vec!["True"; members].join(", ")));
            gap_items(&tree)
        })
    });
    let typescript = [100, 200, 400].map(|members| {
        on_deep_stack(move || {
            let tree = parsed(sittir_typescript::TypeScriptGrammar, sittir_typescript::render::options::defaults(), &format!("type T = [{}];\n", vec!["number"; members].join(", ")));
            gap_items(&tree)
        })
    });
    for (name, steps) in [("python [True, …]", python), ("typescript [number, …]", typescript)] {
        assert_eq!(steps, [0, 0, 0], "{name}: gap steps at 100, 200 and 400 members");
    }
}
