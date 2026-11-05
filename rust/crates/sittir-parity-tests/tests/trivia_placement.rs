//! A side read alone, in either order, holds on its first read what placing
//! every region gives it, and so do the edge items and adjacencies read
//! beside it; each side is handed over once. The placement a region at a
//! time gives every side, edge item, adjacency and run the whole-tree
//! assignment gives. Runs are compared by their bytes and sides rather than
//! by id, over each grammar's fixtures.

use sittir_core::engine::EngineGrammar;
use sittir_core::points::LineTable;
use sittir_core::trivia_table::{Assigned, PlacedSides, Placement, Source, TriviaSide, TriviaTable};
use sittir_core::types::{NodeIndex, RunId};
use sittir_parity_tests::{each_grammar, fixture_sources, parsed, probe_input};

const SIDES: [TriviaSide; 3] = [TriviaSide::Leading, TriviaSide::Trailing, TriviaSide::Inner];

/// An assigned entry with its run's content in place of its id.
#[derive(Debug, PartialEq, Eq)]
enum Entry {
    Assigned(Assigned),
    Layout { run: sittir_core::trivia_table::LayoutRun, from: u32, owner: NodeIndex, depth: i32 },
}

/// The sides a placement handed over, by node and side, and each side it
/// handed over more than once.
#[derive(Default)]
struct Filled {
    sides: PlacedSides,
    twice: Vec<(NodeIndex, TriviaSide)>,
}

impl Filled {
    fn fill(&mut self, placed: PlacedSides) {
        for (key, entries) in placed {
            if self.sides.insert(key, entries).is_some() {
                self.twice.push(key);
            }
        }
    }

    /// The entries of `side` of the node at `index`, each run as its
    /// content in `placement`.
    fn entries(&self, placement: &Placement, index: NodeIndex, side: TriviaSide) -> Vec<Entry> {
        self.sides
            .get(&(index, side))
            .map(Vec::as_slice)
            .unwrap_or_default()
            .iter()
            .map(|&entry| match entry {
                Assigned::Layout { run, owner, depth, .. } => Entry::Layout { run: placement.run(run), from: placement.run_from(run), owner, depth },
                other => Entry::Assigned(other),
            })
            .collect()
    }
}

fn eager_from(table: &TriviaTable, source: &str, id: RunId) -> u32 {
    let run = table.run(id);
    let floor = id.get().checked_sub(1).map_or(0, |before| table.run(RunId(before)).end.min(run.start));
    sittir_core::types::narrow(source[..run.start as usize].trim_end().len()).max(floor)
}

/// The differences among the placements of `source`, each named.
fn differences<G: EngineGrammar>(grammar: G, options: sittir_core::options::ResolvedOptions, source: &str, unit: u32) -> Vec<String> {
    let parsed = parsed(grammar, options, source);
    let tree = parsed.tree();
    let kinds = grammar.surface_kinds();
    let lines = LineTable::new(source);
    let at = Source { tree, source, lines: &lines };
    let mut from_root = |index: NodeIndex| sittir_core::engine::node_at_index(tree, index);
    let count = sittir_core::read::descendant_count(&tree.root_node());
    let whole = Placement::new(kinds, unit);
    let mut placed = Filled::default();
    whole.place_all(at, |sides| placed.fill(sides));
    let mut found = Vec::new();
    if !placed.twice.is_empty() {
        found.push(format!("sides handed over twice placing every region: {:?}", placed.twice));
    }
    for (order, indices) in [("in reverse preorder", (0..count).rev().map(NodeIndex::new).collect::<Vec<_>>()), ("in preorder", (0..count).map(NodeIndex::new).collect())] {
        let alone = Placement::new(kinds, unit);
        let mut read = Filled::default();
        for &index in &indices {
            for side in SIDES {
                alone.cover(at, &mut from_root, index, side, |sides| read.fill(sides));
                let (got, want) = (read.entries(&alone, index, side), placed.entries(&whole, index, side));
                if got != want {
                    found.push(format!("side {index} {side:?} read alone {order}: {got:?}, placed with every region: {want:?}"));
                }
                if side != TriviaSide::Inner {
                    let (got, want) = (alone.edge_item(at, &mut from_root, index, side), whole.edge_item(at, &mut from_root, index, side));
                    if got != want {
                        found.push(format!("edge item {index} {side:?} read alone {order}: {got:?}, placed with every region: {want:?}"));
                    }
                }
            }
            let (got, want) = (alone.adjacency(at, &mut from_root, index), whole.adjacency(at, &mut from_root, index));
            if got != want {
                found.push(format!("adjacency {index} read alone {order}: {got:?}, placed with every region: {want:?}"));
            }
        }
        if read.sides.keys().ne(placed.sides.keys()) {
            found.push(format!("the sides read alone {order} are not those placed with every region"));
        }
        if !read.twice.is_empty() {
            found.push(format!("sides handed over twice reading alone {order}: {:?}", read.twice));
        }
    }
    let eager = TriviaTable::assign(tree, source, kinds, unit);
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
            let got = placed.entries(&whole, index, side);
            if want != got {
                found.push(format!("side {index} {side:?}: eager {want:?}, lazy {got:?}"));
            }
            if side != TriviaSide::Inner {
                let (want, got) = (eager.edge_item(index, side), whole.edge_item(at, &mut from_root, index, side));
                if want != got {
                    found.push(format!("edge item {index} {side:?}: eager {want:?}, lazy {got:?}"));
                }
            }
        }
        let (want, got) = (eager.adjacency(index), whole.adjacency(at, &mut from_root, index));
        if want != got {
            found.push(format!("adjacency {index}: eager {want:?}, lazy {got:?}"));
        }
    }
    if eager.unowned() != whole.unowned().as_slice() {
        found.push(format!("unowned: eager {:?}, lazy {:?}", eager.unowned(), whole.unowned()));
    }
    let lazy_runs: Vec<_> = whole.runs().into_iter().map(|(_, run)| run).collect();
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
/// line, placed every way.
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
