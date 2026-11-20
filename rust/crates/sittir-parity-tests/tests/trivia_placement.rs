//! A side read alone, in either order, holds on its first read what placing
//! every owner gives it, and so do the edge items; one table holds each
//! side, over each grammar's fixtures.

use sittir_core::engine::EngineGrammar;
use sittir_core::trivia_table::{Assigned, Placement, Source, Table, TriviaSide};
use sittir_core::types::NodeIndex;
use sittir_parity_tests::{each_grammar, fixture_sources, parsed, probe_input};

const SIDES: [TriviaSide; 3] = [TriviaSide::Leading, TriviaSide::Trailing, TriviaSide::Inner];

/// The entries `table` gives `side` of the node at `index`.
fn entries(table: Option<&Table>, index: NodeIndex, side: TriviaSide) -> Vec<Assigned> {
    table.map_or_else(Vec::new, |table| table.side(index, side).to_vec())
}

/// A side, by its node and which side it is.
type Side = (NodeIndex, TriviaSide);

/// Every side the tables of `placement` hold, and each side more than one
/// of them holds.
fn published(placement: &Placement) -> (Vec<Side>, Vec<Side>) {
    let mut sides: Vec<Side> = placement.tables().flat_map(|table| table.sides().map(|(key, _)| key).collect::<Vec<_>>()).collect();
    sides.sort_unstable();
    let twice = sides.windows(2).filter(|pair| pair[0] == pair[1]).map(|pair| pair[0]).collect();
    sides.dedup();
    (sides, twice)
}

/// The differences among the placements of `source`, each named.
fn differences<G: EngineGrammar>(grammar: G, options: sittir_core::options::ResolvedOptions, source: &str) -> Vec<String> {
    let parsed = parsed(grammar, options, source);
    let tree = parsed.tree();
    let kinds = grammar.surface_kinds();
    let mut nodes = parsed.nodes();
    let count = sittir_core::read::descendant_count(&tree.root_node());
    let whole = Placement::new(kinds);
    whole.place_all(Source { nodes: &mut nodes });
    let (placed, twice) = published(&whole);
    let mut found = Vec::new();
    if !twice.is_empty() {
        found.push(format!("sides two tables hold placing every owner: {twice:?}"));
    }
    for (order, indices) in [("in reverse preorder", (0..count).rev().map(NodeIndex::new).collect::<Vec<_>>()), ("in preorder", (0..count).map(NodeIndex::new).collect())] {
        let alone = Placement::new(kinds);
        for &index in &indices {
            for side in SIDES {
                let got = entries(alone.cover(Source { nodes: &mut nodes }, index, side), index, side);
                let want = entries(whole.cover(Source { nodes: &mut nodes }, index, side), index, side);
                if got != want {
                    found.push(format!("side {index} {side:?} read alone {order}: {got:?}, placed with every owner: {want:?}"));
                }
                if side != TriviaSide::Inner {
                    let (got, want) = (alone.edge_item(Source { nodes: &mut nodes }, index, side), whole.edge_item(Source { nodes: &mut nodes }, index, side));
                    if got != want {
                        found.push(format!("edge item {index} {side:?} read alone {order}: {got:?}, placed with every owner: {want:?}"));
                    }
                }
            }
        }
        let (read, twice) = published(&alone);
        if read != placed {
            found.push(format!("the sides read alone {order} are not those placed with every owner"));
        }
        if !twice.is_empty() {
            found.push(format!("sides two tables hold reading alone {order}: {twice:?}"));
        }
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
        found.extend(differences(grammar, options(), source).into_iter().take(3).map(|difference| format!("{difference} in {:?}", &source[..source.len().min(80)])));
    }
    (sources.len(), found)
}

#[test]
fn a_side_read_alone_in_either_order_holds_what_placing_every_layout_owner_gives_it() {
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
fn a_side_read_alone_holds_what_placing_every_layout_owner_gives_it_over_a_corpus() {
    let list = std::env::var("SITTIR_PLACEMENT_FILES").expect("SITTIR_PLACEMENT_FILES names a file list");
    let paths: Vec<String> = std::fs::read_to_string(list).expect("the list").lines().filter(|line| !line.is_empty()).map(str::to_owned).collect();
    let mut found = Vec::new();
    for path in &paths {
        let source = std::fs::read_to_string(path).expect("a source");
        found.extend(differences(sittir_typescript::TypeScriptGrammar, sittir_typescript::render::options::defaults(), &source).into_iter().take(3).map(|difference| format!("{path}: {difference}")));
    }
    eprintln!("{} files, {} differences", paths.len(), found.len());
    assert!(found.is_empty(), "{} differences:\n{}", found.len(), found.iter().take(40).cloned().collect::<Vec<_>>().join("\n"));
}
