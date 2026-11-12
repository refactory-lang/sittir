//! A snapshot measures every run in one full-depth record, the one of the
//! node enclosing its own, and so seats each node's sides as the tree's own
//! lookup seats each alone, each run measured in its region: a region alone
//! and inside the subtrees around it agree.

use sittir_core::engine::EngineGrammar;
use sittir_core::options::ResolvedOptions;
use sittir_core::types::NodeIndex;
use sittir_parity_tests::{load_fixtures, on_deep_stack, parsed, ParityFixture};

/// Each distinct source the grammar's round-trip fixtures read.
fn sources(grammar: &str) -> std::collections::BTreeSet<String> {
    load_fixtures(grammar)
        .into_iter()
        .filter_map(|fixture| match fixture {
            ParityFixture::RoundTrip(fixture) => Some(fixture.source_in),
            ParityFixture::Render { .. } => None,
        })
        .collect()
}

/// How many nodes of `grammar`'s fixture sources snapshot as with their
/// sides seated alone, by lookups of one fresh seating, each measured from
/// the source's start, each side of a fresh parse, so no cache one measure
/// fills answers the other. Nodes an `ERROR` holds, and those a snapshot
/// refuses, are passed over.
fn agree<G: EngineGrammar>(name: &str, grammar: G, options: fn() -> ResolvedOptions) -> usize {
    let parse = |source: &str| parsed(grammar, options(), source);
    let mut agreed = 0;
    for source in sources(name) {
        let count = sittir_core::read::descendant_count(&parse(&source).tree().root_node());
        for index in (0..count).map(NodeIndex::new) {
            let tree = parse(&source);
            if tree.read_error(index).is_some() {
                continue;
            }
            let Some(Ok(snapped)) = tree.snapshot_layouts(index, Some(0)) else {
                continue;
            };
            let tree = parse(&source);
            let seating = tree.seating();
            let alone = tree.snapshot_layouts_seated(index, Some(0), &seating).expect("a node").expect("the node snapshots with its sides seated alone");
            assert_eq!(snapped, alone, "{name} {source:?} at {index:?}");
            agreed += 1;
        }
    }
    agreed
}

#[test]
fn every_python_node_snapshots_as_its_sides_seated_alone() {
    assert_ne!(on_deep_stack(|| agree("python", sittir_python::PythonGrammar, sittir_python::render::options::defaults)), 0);
}

#[test]
fn every_regex_node_snapshots_as_its_sides_seated_alone() {
    assert_ne!(on_deep_stack(|| agree("regex", sittir_regex::RegexGrammar, sittir_regex::render::options::defaults)), 0);
}

#[test]
fn every_rust_node_snapshots_as_its_sides_seated_alone() {
    assert_ne!(on_deep_stack(|| agree("rust", sittir_rust::RustGrammar, sittir_rust::render::options::defaults)), 0);
}

#[test]
fn every_scm_node_snapshots_as_its_sides_seated_alone() {
    assert_ne!(on_deep_stack(|| agree("scm", sittir_scm::ScmGrammar, sittir_scm::render::options::defaults)), 0);
}

#[test]
fn every_typescript_node_snapshots_as_its_sides_seated_alone() {
    assert_ne!(on_deep_stack(|| agree("typescript", sittir_typescript::TypeScriptGrammar, sittir_typescript::render::options::defaults)), 0);
}

/// A snapshot whose enclosing record refuses measures each run in its
/// region. A typescript function type that error recovery leaves without
/// its return type reads with its required `return_type` empty, so the
/// whole tree's record refuses: the statement after it, enclosed by the
/// root, snapshots as with its sides seated alone, and so does the statement
/// holding the function type, since a snapshot reads no slot.
#[test]
fn a_snapshot_whose_record_refuses_measures_each_run_in_its_region() {
    let source = "let p: () => \nconst y: number = 2;\nlet q =\n    1;\nlet r = 2;\n";
    let parse = || parsed(sittir_typescript::TypeScriptGrammar, sittir_typescript::render::options::defaults(), source);
    let statement = |text: &str| {
        let tree = parse();
        let count = sittir_core::read::descendant_count(&tree.tree().root_node());
        (0..count)
            .map(NodeIndex::new)
            .find(|&index| sittir_core::engine::node_at_index(tree.tree(), index).is_some_and(|node| node.kind() == "lexical_declaration" && source[sittir_core::types::Span::of(&node).range()].starts_with(text)))
            .expect("the statement")
    };
    let alone = |index: NodeIndex| {
        let tree = parse();
        let seating = tree.seating();
        tree.snapshot_layouts_seated(index, Some(0), &seating).expect("a node")
    };
    assert!(parse().baseline_runs(true).is_err(), "the whole tree's record refuses");
    for index in [statement("let q"), statement("let p")] {
        let snapped = parse().snapshot_layouts(index, Some(0)).expect("a node");
        assert!(snapped.is_ok(), "{index:?} snapshots: {snapped:?}");
        assert_eq!(snapped, alone(index), "{index:?}");
    }
}
