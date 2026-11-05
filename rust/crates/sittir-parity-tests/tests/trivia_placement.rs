//! The placement a region at a time gives every side, edge item, adjacency
//! and run the whole-tree assignment gives, its runs compared by their bytes
//! and sides rather than by id, over each grammar's fixtures.

use sittir_core::engine::EngineGrammar;
use sittir_core::points::LineTable;
use sittir_core::trivia_table::{Assigned, Placement, Source, TriviaSide, TriviaTable};
use sittir_core::types::{NodeIndex, RunId};
use sittir_parity_tests::{each_grammar, fixture_sources, parsed, probe_input};

const SIDES: [TriviaSide; 3] = [TriviaSide::Leading, TriviaSide::Trailing, TriviaSide::Inner];

/// An assigned entry with its run's content in place of its id.
#[derive(Debug, PartialEq, Eq)]
enum Entry {
    Assigned(Assigned),
    Layout { run: sittir_core::trivia_table::LayoutRun, from: u32, owner: NodeIndex, depth: i32 },
}

fn eager_from(table: &TriviaTable, source: &str, id: RunId) -> u32 {
    let run = table.run(id);
    let floor = id.get().checked_sub(1).map_or(0, |before| table.run(RunId(before)).end.min(run.start));
    sittir_core::types::narrow(source[..run.start as usize].trim_end().len()).max(floor)
}

/// The differences between the two placements of `source`, each named.
fn differences<G: EngineGrammar>(grammar: G, options: sittir_core::options::ResolvedOptions, source: &str, unit: u32) -> Vec<String> {
    let parsed = parsed(grammar, options, source);
    let tree = parsed.tree();
    let kinds = grammar.surface_kinds();
    let eager = TriviaTable::assign(tree, source, kinds, unit);
    let lines = LineTable::new(source);
    let at = Source { tree, source, lines: &lines };
    let mut from_root = |index: NodeIndex| sittir_core::engine::node_at_index(tree, index);
    let lazy = Placement::new(kinds, unit);
    lazy.place_all(at);
    let sides = lazy.sides();
    let mut found = Vec::new();
    let count = sittir_core::read::descendant_count(&tree.root_node());
    let read = Placement::new(kinds, unit);
    for index in (0..count).rev().map(NodeIndex::new) {
        for side in SIDES {
            let as_read = read.side(at, &mut from_root, index, side);
            if sides.get(&(index, side)).map_or(0, Vec::len) != as_read.len() {
                found.push(format!("side {index} {side:?} read alone: {as_read:?}, placed with every region: {:?}", sides.get(&(index, side))));
            }
        }
    }
    if read.sides().keys().ne(sides.keys()) {
        found.push("the sides read alone are not those placed with every region".to_owned());
    }
    for index in (0..count).map(NodeIndex::new) {
        for side in SIDES {
            let want: Vec<Entry> = eager
                .side(index, side)
                .iter()
                .map(|&entry| match entry {
                    Assigned::Layout { run, owner, depth, .. } => Entry::Layout { run: eager.run(run), from: eager_from(&eager, source, run), owner, depth },
                    other => Entry::Assigned(other),
                })
                .collect();
            let got: Vec<Entry> = sides
                .get(&(index, side))
                .map(Vec::as_slice)
                .unwrap_or_default()
                .iter()
                .map(|&entry| match entry {
                    Assigned::Layout { run, owner, depth, .. } => Entry::Layout { run: lazy.run(run), from: lazy.run_from(run), owner, depth },
                    other => Entry::Assigned(other),
                })
                .collect();
            if want != got {
                found.push(format!("side {index} {side:?}: eager {want:?}, lazy {got:?}"));
            }
            if side != TriviaSide::Inner {
                let (want, got) = (eager.edge_item(index, side), lazy.edge_item(at, &mut from_root, index, side));
                if want != got {
                    found.push(format!("edge item {index} {side:?}: eager {want:?}, lazy {got:?}"));
                }
            }
        }
        let (want, got) = (eager.adjacency(index), lazy.adjacency(at, &mut from_root, index));
        if want != got {
            found.push(format!("adjacency {index}: eager {want:?}, lazy {got:?}"));
        }
    }
    if eager.unowned() != lazy.unowned().as_slice() {
        found.push(format!("unowned: eager {:?}, lazy {:?}", eager.unowned(), lazy.unowned()));
    }
    let lazy_runs: Vec<_> = lazy.runs().into_iter().map(|(_, run)| run).collect();
    if eager.runs() != lazy_runs.as_slice() {
        found.push(format!("runs: eager {}, lazy {}", eager.runs().len(), lazy_runs.len()));
    }
    found
}

fn check<G: EngineGrammar>(name: &str, grammar: G, options: fn() -> sittir_core::options::ResolvedOptions) -> (usize, Vec<String>) {
    let mut sources = fixture_sources(name);
    if name == "rust" {
        sources.extend(["spacing.rs", "engine.rs"].map(probe_input));
    }
    let mut found = Vec::new();
    for source in &sources {
        for unit in [2, 4] {
            found.extend(differences(grammar, options(), source, unit).into_iter().take(3).map(|difference| format!("{difference} in {:?}", &source[..source.len().min(80)])));
        }
    }
    (sources.len(), found)
}

#[test]
fn the_placement_a_region_at_a_time_matches_the_whole_tree_assignment() {
    let mut found = Vec::new();
    for (name, (sources, differences)) in each_grammar!(check) {
        eprintln!("{name}: {sources} sources, {} differences", differences.len());
        found.extend(differences.into_iter().map(|difference| format!("{name}: {difference}")));
    }
    assert!(found.is_empty(), "{} differences:\n{}", found.len(), found.iter().take(40).cloned().collect::<Vec<_>>().join("\n"));
}

/// The corpus at `SITTIR_PLACEMENT_FILES`, a file of typescript paths one a
/// line, placed both ways.
#[test]
#[ignore = "reads a corpus outside the repository"]
fn the_placement_matches_the_whole_tree_assignment_over_a_corpus() {
    let list = std::env::var("SITTIR_PLACEMENT_FILES").expect("SITTIR_PLACEMENT_FILES names a file list");
    let paths: Vec<String> = std::fs::read_to_string(list).expect("the list").lines().filter(|line| !line.is_empty()).map(str::to_owned).collect();
    let mut found = Vec::new();
    for path in &paths {
        let source = std::fs::read_to_string(path).expect("a source");
        for unit in [2, 4] {
            found.extend(differences(sittir_typescript::TypeScriptGrammar, sittir_typescript::render::options::defaults(), &source, unit).into_iter().take(3).map(|difference| format!("{path}: {difference}")));
        }
    }
    eprintln!("{} files, {} differences", paths.len(), found.len());
    assert!(found.is_empty(), "{} differences:\n{}", found.len(), found.iter().take(40).cloned().collect::<Vec<_>>().join("\n"));
}
