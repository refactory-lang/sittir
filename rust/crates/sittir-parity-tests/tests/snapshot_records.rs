//! A snapshot measures every run in one full-depth record, the one of the
//! node enclosing its own, and so seats each node's sides as the tree's own
//! lookup seats each alone, each run measured in its region: a region alone
//! and inside the subtrees around it agree.

use sittir_core::engine::{EngineGrammar, NodeRead};
use sittir_core::options::ResolvedOptions;
use sittir_core::read::{read_at, Depth, ReadNode, SnapshotCtx};
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

/// How many nodes of `grammar`'s fixture sources snapshot as their sides
/// seated alone read, each measured from the source's start, each side of
/// a fresh parse, so no cache one measure fills answers the other. Nodes an
/// `ERROR` holds, and those no type reads alone, are passed over.
fn agree<G: EngineGrammar, T: ReadNode + PartialEq + std::fmt::Debug>(name: &str, grammar: G, options: fn() -> ResolvedOptions) -> usize {
    let parse = |source: &str| parsed(grammar, options(), source);
    let mut agreed = 0;
    for source in sources(name) {
        let count = sittir_core::read::descendant_count(&parse(&source).tree().root_node());
        for index in (0..count).map(NodeIndex::new) {
            let Some(Ok(NodeRead::Node(snapped))) = parse(&source).snapshot_node::<T>(index, Some(0)) else {
                continue;
            };
            let tree = parse(&source);
            let seating = tree.seating();
            let mut ctx = seating.ctx().snapshot(SnapshotCtx::new(tree.lines(), Some(0), index));
            let alone = read_at::<T>(&mut tree.tree().walk(), &mut ctx, index, Depth::All).expect("the node reads with its sides seated alone");
            assert_eq!(snapped, alone, "{name} {source:?} at {index:?}");
            agreed += 1;
        }
    }
    agreed
}

#[test]
fn every_python_node_snapshots_as_its_sides_seated_alone() {
    assert_ne!(on_deep_stack(|| agree::<_, sittir_python::render::AnyNode>("python", sittir_python::PythonGrammar, sittir_python::render::options::defaults)), 0);
}

#[test]
fn every_regex_node_snapshots_as_its_sides_seated_alone() {
    assert_ne!(on_deep_stack(|| agree::<_, sittir_regex::render::AnyNode>("regex", sittir_regex::RegexGrammar, sittir_regex::render::options::defaults)), 0);
}

#[test]
fn every_rust_node_snapshots_as_its_sides_seated_alone() {
    assert_ne!(on_deep_stack(|| agree::<_, sittir_rust::render::AnyNode>("rust", sittir_rust::RustGrammar, sittir_rust::render::options::defaults)), 0);
}

#[test]
fn every_scm_node_snapshots_as_its_sides_seated_alone() {
    assert_ne!(on_deep_stack(|| agree::<_, sittir_scm::render::AnyNode>("scm", sittir_scm::ScmGrammar, sittir_scm::render::options::defaults)), 0);
}

#[test]
fn every_typescript_node_snapshots_as_its_sides_seated_alone() {
    assert_ne!(on_deep_stack(|| agree::<_, sittir_typescript::render::AnyNode>("typescript", sittir_typescript::TypeScriptGrammar, sittir_typescript::render::options::defaults)), 0);
}

/// A snapshot whose enclosing record refuses measures each run in its
/// region. A typescript function type that error recovery leaves without
/// its return type reads with its required `return_type` empty, so the
/// whole tree's record refuses: the statement after it, enclosed by the
/// root, snapshots as its sides seated alone read, and the statement
/// holding the function type refuses as it does alone.
#[test]
fn a_snapshot_whose_record_refuses_measures_each_run_in_its_region() {
    use sittir_typescript::render::AnyNode;
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
            let mut ctx = seating.ctx().snapshot(SnapshotCtx::new(tree.lines(), Some(0), index));
        let read = read_at::<AnyNode>(&mut tree.tree().walk(), &mut ctx, index, Depth::All);
        read
    };
    assert!(parse().baseline_runs(true).is_err(), "the whole tree's record refuses");
    let (refusing, after) = (statement("let p"), statement("let q"));
    let Some(Ok(NodeRead::Node(snapped))) = parse().snapshot_node::<AnyNode>(after, Some(0)) else {
        panic!("the statement after the refusing one snapshots");
    };
    assert_eq!(snapped, alone(after).expect("it reads alone"));
    let Some(Err(refused)) = parse().snapshot_node::<AnyNode>(refusing, Some(0)) else {
        panic!("the statement holding the function type refuses");
    };
    assert_eq!(Err(refused), alone(refusing));
}
