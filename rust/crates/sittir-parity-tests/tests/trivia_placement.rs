//! A side read alone, in either order, holds on its first read what placing
//! every layout owner gives it, and so do the edge items and the adjacencies
//! of its entries; one table holds each side. Runs are compared by their
//! bytes and sides rather than by id, over each grammar's fixtures. The
//! depth changes where layout owners meet are pinned.

use sittir_core::engine::EngineGrammar;
use sittir_core::nodes::TreeNodes;
use sittir_core::points::LineTable;
use sittir_core::trivia_table::{Adjacency, Assigned, Placement, Source, Table, TriviaSide};
use sittir_core::types::NodeIndex;
use sittir_parity_tests::{each_grammar, fixture_sources, parsed, probe_input};

const SIDES: [TriviaSide; 3] = [TriviaSide::Leading, TriviaSide::Trailing, TriviaSide::Inner];

/// An assigned entry with its run's content in place of its id, and an
/// `ERROR`'s or a layout member's adjacency.
#[derive(Debug, PartialEq, Eq)]
enum Entry {
    Assigned(Assigned),
    Fixed { entry: Assigned, adjacency: Option<Adjacency> },
    Layout { run: sittir_core::trivia_table::LayoutRun, from: u32, owner: NodeIndex, depth: i32 },
}

/// The entries `table` gives `side` of the node at `index`, each run as
/// its content in `placement`.
fn entries(placement: &Placement, table: Option<&Table>, index: NodeIndex, side: TriviaSide) -> Vec<Entry> {
    let Some(table) = table else { return Vec::new() };
    table
        .side(index, side)
        .iter()
        .map(|&entry| match entry {
            Assigned::Layout { run, owner, depth, .. } => Entry::Layout { run: placement.run(run), from: placement.run_from(run), owner, depth },
            Assigned::Error(at) | Assigned::Member(at) => Entry::Fixed { entry, adjacency: table.adjacency(at) },
            other => Entry::Assigned(other),
        })
        .collect()
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
fn differences<G: EngineGrammar>(grammar: G, options: sittir_core::options::ResolvedOptions, source: &str, unit: u32) -> Vec<String> {
    let parsed = parsed(grammar, options, source);
    let tree = parsed.tree();
    let kinds = grammar.surface_kinds();
    let lines = LineTable::new(source);
    let mut nodes = TreeNodes::new(tree, source);
    let count = sittir_core::read::descendant_count(&tree.root_node());
    let whole = Placement::new(kinds, unit);
    whole.place_all(Source { nodes: &mut nodes, lines: &lines });
    let (placed, twice) = published(&whole);
    let mut found = Vec::new();
    if !twice.is_empty() {
        found.push(format!("sides two tables hold placing every layout owner: {twice:?}"));
    }
    for (order, indices) in [("in reverse preorder", (0..count).rev().map(NodeIndex::new).collect::<Vec<_>>()), ("in preorder", (0..count).map(NodeIndex::new).collect())] {
        let alone = Placement::new(kinds, unit);
        for &index in &indices {
            for side in SIDES {
                let got = entries(&alone, alone.cover(Source { nodes: &mut nodes, lines: &lines }, index, side), index, side);
                let want = entries(&whole, whole.cover(Source { nodes: &mut nodes, lines: &lines }, index, side), index, side);
                if got != want {
                    found.push(format!("side {index} {side:?} read alone {order}: {got:?}, placed with every layout owner: {want:?}"));
                }
                if side != TriviaSide::Inner {
                    let (got, want) = (alone.edge_item(Source { nodes: &mut nodes, lines: &lines }, index, side), whole.edge_item(Source { nodes: &mut nodes, lines: &lines }, index, side));
                    if got != want {
                        found.push(format!("edge item {index} {side:?} read alone {order}: {got:?}, placed with every layout owner: {want:?}"));
                    }
                }
            }
        }
        let (read, twice) = published(&alone);
        if read != placed {
            found.push(format!("the sides read alone {order} are not those placed with every layout owner"));
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
        for unit in [2, 4] {
            found.extend(differences(grammar, options(), source, unit).into_iter().take(3).map(|difference| format!("{difference} in {:?}", &source[..source.len().min(80)])));
        }
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

/// A side's depth changes: a line break run's depth and each restore, in
/// order, by its node's kind and its number among the nodes of that kind.
type Depths = Vec<(String, usize, TriviaSide, Vec<i32>)>;

fn changes(entries: &[Assigned]) -> Vec<i32> {
    entries
        .iter()
        .filter_map(|entry| match *entry {
            Assigned::Layout { depth, .. } | Assigned::Depth(depth) if depth != 0 => Some(depth),
            _ => None,
        })
        .collect()
}

/// Every node of `tree` with its kind and its number among the nodes of
/// that kind, in preorder.
fn numbered(tree: &tree_sitter::Tree) -> Vec<(NodeIndex, String, usize)> {
    let mut seen: std::collections::HashMap<String, usize> = std::collections::HashMap::new();
    (0..sittir_core::read::descendant_count(&tree.root_node()))
        .map(NodeIndex::new)
        .map(|index| {
            let kind = sittir_core::engine::node_at_index(tree, index).expect("a node").kind().to_owned();
            let nth = seen.entry(kind.clone()).or_default();
            *nth += 1;
            (index, kind, *nth - 1)
        })
        .collect()
}

fn depths(tree: &tree_sitter::Tree, mut side_of: impl FnMut(NodeIndex, TriviaSide) -> Vec<Assigned>) -> Depths {
    numbered(tree)
        .into_iter()
        .flat_map(|(index, kind, nth)| SIDES.map(|side| (kind.clone(), nth, side, changes(&side_of(index, side)))))
        .filter(|(_, _, _, changes)| !changes.is_empty())
        .collect()
}

fn listed(depths: &Depths) -> String {
    depths.iter().map(|(kind, nth, side, changes)| format!("(\"{kind}\", {nth}, {side:?}, &{changes:?}),")).collect::<Vec<_>>().join("\n")
}

/// The differences between the depth changes `want` pins in `source` and
/// those the placements give: placing every layout owner, and each pinned
/// side read alone on a placement that has read nothing else.
fn pinned<G: EngineGrammar>(grammar: G, options: sittir_core::options::ResolvedOptions, source: &str, unit: u32, want: &[(&str, usize, TriviaSide, &[i32])]) -> Vec<String> {
    let parsed = parsed(grammar, options, source);
    let tree = parsed.tree();
    let kinds = grammar.surface_kinds();
    let lines = LineTable::new(source);
    let mut nodes = TreeNodes::new(tree, source);
    let want: Depths = want.iter().map(|&(kind, nth, side, changes)| (kind.to_owned(), nth, side, changes.to_vec())).collect();
    let mut found = Vec::new();
    let whole = Placement::new(kinds, unit);
    whole.place_all(Source { nodes: &mut nodes, lines: &lines });
    let got = depths(tree, |index, side| whole.cover(Source { nodes: &mut nodes, lines: &lines }, index, side).map_or_else(Vec::new, |table| table.side(index, side).to_vec()));
    if got != want {
        found.push(format!("placed with every layout owner:\n{}", listed(&got)));
    }
    let numbered = numbered(tree);
    for (kind, nth, side, changes) in &want {
        let Some(&(index, _, _)) = numbered.iter().find(|(_, k, n)| k == kind && n == nth) else {
            found.push(format!("no {kind} number {nth}"));
            continue;
        };
        let alone = Placement::new(kinds, unit);
        let got = self::changes(alone.cover(Source { nodes: &mut nodes, lines: &lines }, index, *side).map_or(&[][..], |table| table.side(index, *side)));
        if got != *changes {
            found.push(format!("{kind} {nth} {side:?} read alone: {got:?}, pinned {changes:?}"));
        }
    }
    found
}

use TriviaSide::{Leading, Trailing};

const PYTHON: &str = "class A:\n    def f(self):\n        if x:\n            y = [\n                1,\n                  2,\n            ]\n            z = (a +\n                    b)\n              # deeper than the if's body\n        # held at the if's depth\n      # between the def's depths\n    # a dedent comment\n    def g(self):\n        w = (a +\n                [b,\n                    c])\n        v = (a +\n                g(b,\n                    c))\nz = 1\n";
const TYPESCRIPT: &str = "function f() {\n  if (a) {\n    let x = 1\n    x++\n    foo\n        .bar()\n        .baz()\n    const xs = [\n      1,\n        2,\n    ]\n  }\n    // deeper than the block\n  // after the block\n  const y = a +\n      [b,\n          c]\n  const z = a +\n      g(b,\n          c)\n  return x\n}\ng()\n";
const RUST: &str = "fn f() {\n    let v = vec![\n        1,\n            2,\n    ];\n    {\n        // inside\n        g()\n            .h();\n          // deeper than the block\n    }\n      // between depths\n    // after\n    let w = a +\n        g(b,\n            c);\n}\n";

#[test]
fn a_layout_owner_placed_alone_holds_the_depth_changes_pinned_where_layout_owners_meet() {
    let python: &[(&str, usize, TriviaSide, &[i32])] = &[
        ("collection_elements", 0, Leading, &[1]),
        ("collection_elements", 0, Trailing, &[-1]),
        ("identifier", 7, Leading, &[2]),
        ("identifier", 7, Trailing, &[-2]),
        ("list", 1, Leading, &[2]),
        ("list", 1, Trailing, &[-2]),
        ("identifier", 13, Leading, &[1]),
        ("identifier", 13, Trailing, &[-1]),
        ("call", 0, Leading, &[2]),
        ("call", 0, Trailing, &[-2]),
        ("identifier", 18, Leading, &[1]),
        ("identifier", 18, Trailing, &[-1]),
    ];
    let typescript: &[(&str, usize, TriviaSide, &[i32])] = &[
        ("call_expression_call", 1, Trailing, &[2]),
        ("identifier", 4, Trailing, &[2]),
        ("property_identifier", 0, Trailing, &[-2]),
        ("property_identifier", 1, Trailing, &[-2]),
        ("number_decimal", 1, Leading, &[1]),
        ("number_decimal", 2, Leading, &[1]),
        ("lexical_declaration", 2, Leading, &[1, -1]),
        ("array", 1, Leading, &[2]),
        ("array", 1, Trailing, &[-2]),
        ("identifier", 9, Leading, &[2]),
        ("identifier", 9, Trailing, &[-2]),
        ("call_expression_call", 2, Leading, &[2]),
        ("call_expression_call", 2, Trailing, &[-2]),
        ("identifier", 14, Leading, &[2]),
        ("identifier", 14, Trailing, &[-2]),
    ];
    let rust: &[(&str, usize, TriviaSide, &[i32])] = &[
        ("non_special_token", 0, Leading, &[1]),
        ("non_special_token", 2, Leading, &[1]),
        ("non_special_token", 3, Trailing, &[-2]),
        ("call_expression", 1, Trailing, &[1]),
        ("field_identifier", 0, Trailing, &[-1]),
        ("call_expression", 2, Leading, &[1]),
        ("call_expression", 2, Trailing, &[-1]),
        ("argument", 1, Leading, &[1]),
        ("argument", 1, Trailing, &[-1]),
    ];
    let mut found = Vec::new();
    found.extend(pinned(sittir_python::PythonGrammar, sittir_python::render::options::defaults(), PYTHON, 4, python).into_iter().map(|difference| format!("python: {difference}")));
    found.extend(pinned(sittir_typescript::TypeScriptGrammar, sittir_typescript::render::options::defaults(), TYPESCRIPT, 2, typescript).into_iter().map(|difference| format!("typescript: {difference}")));
    found.extend(pinned(sittir_rust::RustGrammar, sittir_rust::render::options::defaults(), RUST, 4, rust).into_iter().map(|difference| format!("rust: {difference}")));
    for (name, want) in [("python", python), ("typescript", typescript), ("rust", rust)] {
        if want.is_empty() {
            found.push(format!("{name}: no depth change pinned"));
        }
    }
    assert!(found.is_empty(), "{}", found.join("\n"));
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
        for unit in [2, 4] {
            found.extend(differences(sittir_typescript::TypeScriptGrammar, sittir_typescript::render::options::defaults(), &source, unit).into_iter().take(3).map(|difference| format!("{path}: {difference}")));
        }
    }
    eprintln!("{} files, {} differences", paths.len(), found.len());
    assert!(found.is_empty(), "{} differences:\n{}", found.len(), found.iter().take(40).cloned().collect::<Vec<_>>().join("\n"));
}
