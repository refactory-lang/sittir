//! A snapshot of a flat list whose members are unit kinds measures each gap
//! between them from the list's frame: a record writes a unit kind with no
//! anchor of its own, so no gap there reads its whitespace from the bytes
//! around it (`Baseline::between`). The frame's source items and their
//! alignment to what it wrote are built once and every gap reads them, so a
//! list twice as long takes twice the steps (`LayoutWork::gap_items`).

use sittir_core::engine::{EngineGrammar, ParsedTree};
use sittir_core::read::ReadNode;
use sittir_core::types::NodeIndex;
use sittir_parity_tests::{on_deep_stack, parsed};

/// The gap steps a snapshot of `tree`'s root took.
fn gap_items<G: EngineGrammar, N: ReadNode>(tree: &ParsedTree<G>) -> u32 {
    tree.snapshot::<N>(NodeIndex::ROOT, None).expect("a snapshot");
    tree.layout_work().gap_items
}

#[test]
fn a_snapshot_of_a_flat_list_of_unit_kinds_takes_the_same_gap_steps_for_each_member() {
    let python = [100, 200, 400].map(|members| {
        on_deep_stack(move || {
            let tree = parsed(sittir_python::PythonGrammar, sittir_python::render::options::defaults(), &format!("x = [{}]\n", vec!["True"; members].join(", ")));
            gap_items::<_, sittir_python::render::AnyNode>(&tree)
        })
    });
    let typescript = [100, 200, 400].map(|members| {
        on_deep_stack(move || {
            let tree = parsed(sittir_typescript::TypeScriptGrammar, sittir_typescript::render::options::defaults(), &format!("type T = [{}];\n", vec!["number"; members].join(", ")));
            gap_items::<_, sittir_typescript::render::AnyNode>(&tree)
        })
    });
    for (name, [one, two, four]) in [("python [True, …]", python), ("typescript [number, …]", typescript)] {
        assert_ne!(one, 0, "{name}: the gaps between unit kinds read their frame");
        assert_eq!(four - two, 2 * (two - one), "{name}: gap steps at 100, 200 and 400 members: {one}, {two}, {four}");
    }
}
