//! A parsed read with no row for a fixed token or a unit answers every
//! reader as a read that writes them all does.
#![cfg(feature = "arena")]

use std::collections::BTreeMap;

use sittir_core::arena::side::{RunEntry, SideRecord};
use sittir_core::arena::{header_of, Address, ArenaRead, BodySlot, Cell, CellWord, EdgePart, HydrateNode, ListCell, NodeSite, Placed, ReadRows, RecordCells, RecordGrammar, RecordShape};
use sittir_core::engine::{Backing, Descendant, Engine, EngineGrammar, Records};
use sittir_core::layout::SlotLayout;
use sittir_core::options::ResolvedOptions;
use sittir_core::nodes::Nodes as _;
use sittir_core::render::SourceTable as _;
use sittir_core::slot::{ChangedEdges, NodeIdOrCoordinate};
use sittir_core::trivia_table::TriviaSide;
use sittir_core::types::{Delimiter, KindId, NodeId, NodeIndex, Span};
use sittir_parity_tests::{edge_chains, edge_sources, fixture_sources, named_fixed_pairs, out_of_order_units, parsed, read_fixtures, read_kids, with_layout, MIXED_LISTS};

type ShapeFn = fn(KindId) -> Option<RecordShape>;

fn read<G: RecordGrammar + Copy, N: HydrateNode + RecordCells, R>(grammar: G, options: fn() -> ResolvedOptions, source: &str, rows: ReadRows, answer: impl FnOnce(&dyn ArenaRead, Address) -> R) -> R {
    let mut engine = Engine::new(grammar, options()).expect("an engine");
    let parsed = engine.parse_records_with::<N>(source, rows).expect("a read");
    let built = engine.written().built();
    answer(&*built, parsed.root.expect("a root record"))
}

fn side_of(arena: &dyn ArenaRead, at: Address) -> SideRecord {
    SideRecord::read(arena, Address(arena.words(at, 2).expect("a header")[1])).expect("a side record")
}

fn record_of(arena: &dyn ArenaRead, root: Address, kind: KindId) -> Address {
    let mut pending = vec![root];
    while let Some(at) = pending.pop() {
        if header_of(arena.words(at, 1).expect("a header")[0], sittir_core::record::PARSED_KIND_BITS).0 == kind {
            return at;
        }
        pending.extend(side_of(arena, at).run.iter().filter_map(|entry| if let RunEntry::Record { at, .. } = *entry { Some(at) } else { None }));
    }
    panic!("no record of kind {kind:?}");
}

fn cells_of<G: RecordGrammar, N: RecordCells>(arena: &dyn ArenaRead, at: Address) -> Vec<Cell> {
    let kind = header_of(arena.words(at, 1).expect("a header")[0], sittir_core::record::PARSED_KIND_BITS).0;
    let shape = N::shape(kind).expect("a record shape");
    let words = arena.words(at, shape.words).expect("a record");
    let mut cells = Vec::new();
    for cell in shape.cells {
        let held = &words[cell.word as usize..(cell.word + cell.width) as usize];
        match cell.run {
            None => cells.push(Cell::decode_parsed(held, *cell, G::KIND_BITS).expect("a cell")),
            Some(width) if held[0] != 0 => {
                for item in ListCell::of_word(CellWord(held[0]), arena).expect("a list").items(arena, width).expect("its items") {
                    cells.push(Cell::decode_parsed(item, *cell, G::KIND_BITS).expect("an item"));
                }
            }
            Some(_) => {}
        }
    }
    cells
}

#[test]
fn a_slot_content_read_writes_no_fixed_token_row() {
    use sittir_typescript::render::{kind_ids as kind, options, AnyNode};
    use sittir_typescript::TypeScriptGrammar as Grammar;
    let arguments = |rows| {
        read::<Grammar, AnyNode, _>(Grammar, options::defaults, "f(a, b)\n", rows, |arena, root| {
            let at = record_of(arena, root, kind::ARGUMENTS);
            let named: Vec<u32> = cells_of::<Grammar, AnyNode>(arena, at).iter().filter_map(|cell| if let Cell::ParsedLeaf { row, .. } = cell { Some(row.0) } else { None }).collect();
            (side_of(arena, at).run.len(), named)
        })
    };
    assert_eq!(arguments(ReadRows::SlotContent), (2, vec![2, 3]));
    assert_eq!(arguments(ReadRows::All).0, 5);
}

#[test]
fn a_slot_content_read_holds_a_unit_by_its_kind() {
    fn units<G: RecordGrammar + Copy, N: HydrateNode + RecordCells>(grammar: G, options: fn() -> ResolvedOptions, source: &str, holder: KindId, rows: ReadRows) -> Vec<Option<u32>> {
        read::<G, N, _>(grammar, options, source, rows, |arena, root| {
            cells_of::<G, N>(arena, record_of(arena, root, holder)).iter().filter_map(|cell| if let Cell::Unit { row, .. } = cell { Some(row.map(|row| row.0)) } else { None }).collect()
        })
    }
    let rust = |rows| units::<_, sittir_rust::render::AnyNode>(sittir_rust::RustGrammar, sittir_rust::render::options::defaults, "fn f(x: u8) {}\n", sittir_rust::render::kind_ids::PARAMETER, rows);
    assert_eq!(rust(ReadRows::SlotContent), [None]);
    assert!(rust(ReadRows::All)[0].is_some());
    let typescript = |rows| units::<_, sittir_typescript::render::AnyNode>(sittir_typescript::TypeScriptGrammar, sittir_typescript::render::options::defaults, "f()\n", sittir_typescript::render::kind_ids::EXPRESSION_STATEMENT, rows);
    assert_eq!(typescript(ReadRows::SlotContent), [None]);
    assert!(typescript(ReadRows::All)[0].is_some());
}

const GRAMMARS: [(&str, ShapeFn); 5] = [
    ("rust", <sittir_rust::render::AnyNode as RecordCells>::shape),
    ("typescript", <sittir_typescript::render::AnyNode as RecordCells>::shape),
    ("python", <sittir_python::render::AnyNode as RecordCells>::shape),
    ("regex", <sittir_regex::render::AnyNode as RecordCells>::shape),
    ("scm", <sittir_scm::render::AnyNode as RecordCells>::shape),
];

const KINDS: u16 = 2048;

#[test]
fn record_shapes_order_cells_as_their_bodies_write_them() {
    use sittir_rust::render::kind_ids as rust;
    let reference = <sittir_rust::render::AnyNode as RecordCells>::shape(rust::REFERENCE_TYPE).expect("a record");
    let written: Vec<String> = reference
        .order
        .iter()
        .map(|slot| match *slot {
            BodySlot::Cell(at) => reference.cells[usize::from(at)].key.to_owned(),
            BodySlot::Flag { kind, .. } => {
                assert_eq!(kind, rust::MUTABLE_SPECIFIER);
                "flag".to_owned()
            }
        })
        .collect();
    assert_eq!(written, ["_lifetime", "flag", "_type"]);

    for (grammar, shape) in GRAMMARS {
        for id in 0..KINDS {
            let Some(record) = shape(KindId(id)) else { continue };
            let mut cells: Vec<usize> = record.order.iter().filter_map(|slot| if let BodySlot::Cell(at) = slot { Some(usize::from(*at)) } else { None }).collect();
            cells.sort_unstable();
            assert_eq!(cells, (0..record.cells.len()).collect::<Vec<_>>(), "{grammar} kind {id}: one order entry per cell");
            let flags: Vec<_> = record.order.iter().filter(|slot| matches!(slot, BodySlot::Flag { .. })).collect();
            assert!(flags.iter().enumerate().all(|(at, flag)| !flags[..at].contains(flag)), "{grammar} kind {id}: one order entry per flag");
        }
    }
}

#[test]
fn record_shapes_hold_the_tokens_their_bodies_write_at_each_edge() {
    use sittir_python::render::kind_ids as python;
    let suite = <sittir_python::render::AnyNode as RecordCells>::shape(python::SUITE_BLOCK).expect("a record");
    assert_eq!(suite.edges[0], [EdgePart::Token(python::_INDENT)]);
    let simple = <sittir_python::render::AnyNode as RecordCells>::shape(python::_SIMPLE_STATEMENTS).expect("a record");
    assert_eq!(simple.edges[1], [EdgePart::Token(python::_NEWLINE)]);
}

type ListAnswer = (KindId, KindId, u32, u32, KindId, Vec<SlotLayout>);

fn list_answers<G: EngineGrammar, B: Backing<G>>(tree: &B) -> Vec<ListAnswer> {
    read_kids::<G, B>(tree).into_iter().filter_map(|kid| Some((kid.grammar, kid.display, kid.start, kid.end, tree.slot_separator(kid.index)?, tree.slot_layouts(kid.index)))).collect()
}

fn delimiters<G: EngineGrammar + Copy, B: Backing<G>>(grammar: G, tree: &B) -> Vec<(KindId, u32, u32, Delimiter)> {
    let kids = read_kids::<G, B>(tree);
    let mut nodes = tree.nodes();
    kids.iter().filter_map(|kid| Some((kid.grammar, kid.start, kid.end, grammar.delimiter(&mut nodes, kid)?))).collect()
}

fn each_slot_content_read<G: RecordGrammar + Copy, N: HydrateNode>(name: &str, grammar: G, options: fn() -> ResolvedOptions, mut check: impl FnMut(&str, &sittir_core::engine::ParsedTree<G>, &Records<'_, G>)) {
    let extra = if name == "typescript" { MIXED_LISTS.as_slice() } else { &[] };
    for source in fixture_sources(name).iter().map(String::as_str).chain(extra.iter().copied()) {
        let tree = parsed(grammar, options(), source);
        let mut engine = Engine::new(grammar, options()).expect("an engine");
        let Some(root) = engine.parse_records_with::<N>(source, ReadRows::SlotContent).expect("a read").root else { continue };
        let built = engine.written().built();
        let Ok(records) = Records::over(&engine, &built, root) else { continue };
        check(source, &tree, &records);
    }
}

macro_rules! each_grammar {
    ($check:ident) => {
        $check::<_, sittir_rust::render::AnyNode>("rust", sittir_rust::RustGrammar, sittir_rust::render::options::defaults);
        $check::<_, sittir_typescript::render::AnyNode>("typescript", sittir_typescript::TypeScriptGrammar, sittir_typescript::render::options::defaults);
        $check::<_, sittir_python::render::AnyNode>("python", sittir_python::PythonGrammar, sittir_python::render::options::defaults);
        $check::<_, sittir_regex::render::AnyNode>("regex", sittir_regex::RegexGrammar, sittir_regex::render::options::defaults);
        $check::<_, sittir_scm::render::AnyNode>("scm", sittir_scm::ScmGrammar, sittir_scm::render::options::defaults);
    };
}

#[test]
fn edge_levels_agree_from_render_bodies() {
    fn check<G: RecordGrammar + Copy, N: HydrateNode>(name: &str, grammar: G, options: fn() -> ResolvedOptions) {
        let chains = edge_chains::<G, N>(name, grammar, options, &edge_sources(name));
        assert!(!chains.compared.is_empty(), "{name}: some edge level compared");
        eprintln!("{name}: {} edge levels equal, {} chains place the same, {} chains listed", chains.compared.len(), chains.same_placed, chains.listed.len());
    }
    each_grammar!(check);
}

#[test]
fn edge_levels_at_a_zero_width_fixed_token_agree() {
    fn check<G: RecordGrammar + Copy, N: HydrateNode>(name: &str, grammar: G, options: fn() -> ResolvedOptions, token: KindId) {
        let source = with_layout(name).expect("a layout file").to_owned();
        let chains = edge_chains::<G, N>(name, grammar, options, &[source]);
        assert!(chains.compared.iter().any(|level| level.grammar == token), "{name}: the zero-width token is an edge level");
    }
    check::<_, sittir_python::render::AnyNode>("python", sittir_python::PythonGrammar, sittir_python::render::options::defaults, sittir_python::render::kind_ids::_NEWLINE);
    check::<_, sittir_typescript::render::AnyNode>("typescript", sittir_typescript::TypeScriptGrammar, sittir_typescript::render::options::defaults, sittir_typescript::render::kind_ids::_AUTOMATIC_SEMICOLON);
}

#[test]
fn an_edge_chain_at_a_root_after_leading_whitespace_is_read_from_the_whole_source() {
    use sittir_core::engine::Backing as _;
    use sittir_core::nodes::Nodes as _;
    use sittir_core::options::Side;
    use sittir_core::render::SourceTable as _;
    use sittir_core::slot::NodeIdOrCoordinate;
    use sittir_core::types::NodeIndex;
    use sittir_rust::render::{kind_ids as kind, options, AnyNode};
    use sittir_rust::RustGrammar as Grammar;
    let levels = |source: &str, side: Side| {
        let tree = parsed(Grammar, options::defaults(), source);
        let coordinate = tree.read_ctx().coordinate_of(&tree.nodes().kid(NodeIndex::ROOT));
        let mut object = Vec::new();
        tree.seating().for_each_edge_level((&coordinate).into(), side, &mut |level| object.push(level.grammar));
        let mut engine = Engine::new(Grammar, options::defaults()).expect("an engine");
        let root = engine.parse_records_with::<AnyNode>(source, sittir_core::arena::ReadRows::SlotContent).expect("a read").root.expect("a root");
        let built = engine.written().built();
        let records = Records::over(&engine, &built, root).expect("the records");
        let name = records.node_names().and_then(|names| names.name(NodeIndex::ROOT)).expect("the root's name");
        let mut arena = Vec::new();
        records.seating().for_each_edge_level(NodeIdOrCoordinate::of(name), side, &mut |level| arena.push(level.grammar));
        assert_eq!(arena, object, "{source:?} {side:?}");
        object
    };
    assert_eq!(levels("\n\nfn f() {}", Side::Before), [kind::SOURCE_FILE]);
    assert!(levels("\n\nfn f() {}", Side::After).len() > 1, "the last item ends where the source does");
    assert_eq!(levels("\n\nfn f() {}\n", Side::After), [kind::SOURCE_FILE]);
    assert!(levels("fn f() {}", Side::Before).len() > 1, "the first item starts where the source does");
}

#[test]
fn parsed_lists_answer_their_separators_from_stamps() {
    fn check<G: RecordGrammar + Copy, N: HydrateNode>(name: &str, grammar: G, options: fn() -> ResolvedOptions) {
        each_slot_content_read::<G, N>(name, grammar, options, |source, tree, records| {
            assert_eq!(list_answers::<G, _>(records), list_answers::<G, _>(tree), "{name} {source:?}");
        });
    }
    each_grammar!(check);
}

#[test]
fn the_query_reads_the_stored_delimiter() {
    fn check<G: RecordGrammar + Copy, N: HydrateNode>(name: &str, grammar: G, options: fn() -> ResolvedOptions) {
        each_slot_content_read::<G, N>(name, grammar, options, |source, tree, records| {
            assert_eq!(delimiters(grammar, records), delimiters(grammar, tree), "{name} {source:?}");
        });
    }
    each_grammar!(check);
}

fn over_both_reads<G: RecordGrammar + Copy, N: HydrateNode>(grammar: G, options: fn() -> ResolvedOptions, source: &str, answer: impl FnOnce(&Records<'_, G>, &Records<'_, G>)) {
    let (mut whole, mut content) = (Engine::new(grammar, options()).expect("an engine"), Engine::new(grammar, options()).expect("an engine"));
    let whole_root = whole.parse_records_with::<N>(source, ReadRows::All).expect("a read").root;
    let content_root = content.parse_records_with::<N>(source, ReadRows::SlotContent).expect("a read").root;
    let (Some(whole_root), Some(content_root)) = (whole_root, content_root) else { return };
    let (whole_built, content_built) = (whole.written().built(), content.written().built());
    let (Ok(all), Ok(records)) = (Records::over(&whole, &whole_built, whole_root), Records::over(&content, &content_built, content_root)) else { return };
    answer(&all, &records);
}

/// A query's item: its stamped kind, its span (none for a unit), and the
/// id of its node (none for a unit).
type Listed = (KindId, Option<Span>, Option<NodeIndex>);

fn listed<G: EngineGrammar, B: Backing<G>>(tree: &B, index: NodeIndex, depth: Option<u32>) -> Vec<Listed> {
    let mut nodes = tree.nodes();
    let (found, _) = tree.descendants_under(&mut nodes, index, &[], None, None, u32::MAX, depth).expect("a walk");
    let ctx = tree.read_ctx();
    found
        .into_iter()
        .map(|item| match item {
            Descendant::Node(kid) => (ctx.stamped_kind(kid.grammar, kid.display), Some(kid.span()), Some(kid.index)),
            Descendant::Unit(kind) => (kind, None, None),
        })
        .collect()
}

/// The nodes `all` and `content` list alike, by their ids in each. An item
/// only `all` lists goes to `dropped`.
fn aligned(context: &str, all: &[Listed], content: &[Listed], dropped: &mut dyn FnMut(KindId)) -> Vec<(NodeIndex, NodeIndex)> {
    let (mut rest, mut same) = (content.iter().peekable(), Vec::new());
    for one in all {
        match rest.peek() {
            Some(other) if (other.0, other.1) == (one.0, one.1) => {
                if let (Some(whole), Some(held)) = (one.2, other.2) {
                    same.push((whole, held));
                }
                rest.next();
            }
            _ => dropped(one.0),
        }
    }
    assert!(rest.next().is_none(), "{context}: the read without rows lists more:\n  all {all:?}\n  content {content:?}");
    same
}

#[test]
fn queries_list_units_in_render_body_order() {
    fn check<G: RecordGrammar + Copy, N: HydrateNode>(name: &str, grammar: G, options: fn() -> ResolvedOptions) {
        let pairs = named_fixed_pairs(name);
        let mut left: BTreeMap<(&'static str, &'static str), u32> = BTreeMap::new();
        let mut sources = read_fixtures(name);
        sources.extend(out_of_order_units(name).into_iter().map(str::to_owned));
        for source in &sources {
            over_both_reads::<G, N>(grammar, options, source, |all, records| {
                let context = format!("{name} {source:?}");
                let token = |kind: KindId| pairs.iter().any(|pair| pair.token == G::kind_name(kind));
                let whole = aligned(&context, &listed::<G, _>(all, NodeIndex::ROOT, None), &listed::<G, _>(records, NodeIndex::ROOT, None), &mut |kind| assert!(token(kind), "{context}: dropped {}, in no pair", G::kind_name(kind)));
                for (at, held) in std::iter::once((NodeIndex::ROOT, NodeIndex::ROOT)).chain(whole) {
                    let holder = all.nodes().kid(at);
                    let names = [G::kind_name(holder.grammar), G::kind_name(holder.display)];
                    aligned(&context, &listed::<G, _>(all, at, Some(1)), &listed::<G, _>(records, held, Some(1)), &mut |kind| {
                        let pair = pairs.iter().find(|pair| pair.token == G::kind_name(kind) && names.contains(&pair.holder));
                        let pair = pair.unwrap_or_else(|| panic!("{context}: {names:?} dropped {}, in no pair", G::kind_name(kind)));
                        *left.entry((pair.holder, pair.token)).or_default() += 1;
                    });
                    aligned(&context, &listed::<G, _>(all, at, None), &listed::<G, _>(records, held, None), &mut |kind| assert!(token(kind), "{context}: dropped {}, in no pair", G::kind_name(kind)));
                }
            });
        }
        eprintln!("{name}: named fixed tokens dropped: {left:?}");
    }
    each_grammar!(check);
}

#[test]
fn a_named_fixed_token_leaves_query_results() {
    fn check<G: RecordGrammar + Copy, N: HydrateNode>(name: &str, grammar: G, options: fn() -> ResolvedOptions) {
        for pair in named_fixed_pairs(name) {
            over_both_reads::<G, N>(grammar, options, pair.source, |all, records| {
                let count = |items: &[Listed], of: &str| items.iter().filter(|item| G::kind_name(item.0) == of).count();
                let (whole, held) = (listed::<G, _>(all, NodeIndex::ROOT, None), listed::<G, _>(records, NodeIndex::ROOT, None));
                assert!(count(&whole, pair.token) > 0, "{name} {pair:?}: the source holds the token");
                assert_eq!(count(&held, pair.token), 0, "{name} {pair:?}: the token leaves the query");
                assert_eq!(count(&held, pair.holder), count(&whole, pair.holder), "{name} {pair:?}: the holder is found as often");
            });
        }
    }
    each_grammar!(check);
}

/// Each node with a place in the source that both reads list, by its name
/// in each.
fn same_named_nodes<G: RecordGrammar + Copy>(all: &Records<'_, G>, records: &Records<'_, G>) -> Vec<(NodeId, NodeId)> {
    let mut of_all = read_kids::<G, _>(all).into_iter();
    read_kids::<G, _>(records)
        .into_iter()
        .filter_map(|kid| {
            let same = of_all.by_ref().find(|other| (other.grammar, other.display, other.start, other.end) == (kid.grammar, kid.display, kid.start, kid.end)).expect("the whole read holds the node");
            Some((all.node_names()?.name(same.index)?, records.node_names()?.name(kid.index)?))
        })
        .collect()
}

fn line_starts_agree<G: RecordGrammar + Copy, N: HydrateNode>(name: &str, grammar: G, options: fn() -> ResolvedOptions, source: &str) -> usize {
    let mut compared = 0;
    over_both_reads::<G, N>(grammar, options, source, |all, records| {
        let (whole, held) = (all.seating(), records.seating());
        let mut nodes = all.nodes();
        let mut of_whole = read_kids::<G, _>(all).into_iter();
        for kid in read_kids::<G, _>(records) {
            let same = of_whole.by_ref().find(|other| (other.grammar, other.display, other.start, other.end) == (kid.grammar, kid.display, kid.start, kid.end)).expect("the whole read holds the node");
            let (Some(of_all), Some(of_records)) = (all.node_names().and_then(|names| names.name(same.index)), records.node_names().and_then(|names| names.name(kid.index))) else { continue };
            let by_position = sittir_core::engine::line_starts_inside_tokens(&mut nodes, same.index, source);
            assert_eq!(by_position, whole.line_starts_inside_tokens(NodeIdOrCoordinate::of(of_all)), "{name} {source:?}: the whole read at {kid:?}");
            assert_eq!(by_position, held.line_starts_inside_tokens(NodeIdOrCoordinate::of(of_records)), "{name} {source:?}: the read without rows at {kid:?}");
            compared += 1;
        }
    });
    compared
}

#[test]
fn depth_moves_agree_without_depth_member_rows() {
    fn check<G: RecordGrammar + Copy, N: HydrateNode>(name: &str, grammar: G, options: fn() -> ResolvedOptions) {
        let (mut compared, mut moved) = (0, 0);
        for source in read_fixtures(name) {
            over_both_reads::<G, N>(grammar, options, &source, |all, records| {
                let (whole, held) = (all.seating(), records.seating());
                for (of_all, of_records) in same_named_nodes(all, records) {
                    let depth = whole.depth_move(NodeIdOrCoordinate::of(of_all));
                    assert_eq!(depth, held.depth_move(NodeIdOrCoordinate::of(of_records)), "{name} {source:?}");
                    compared += 1;
                    moved += usize::from(depth != 0);
                }
            });
        }
        eprintln!("{name}: {compared} depth moves equal, {moved} of them nonzero");
    }
    each_grammar!(check);
}

#[test]
fn line_starts_agree_from_the_stamped_bit() {
    fn check<G: RecordGrammar + Copy, N: HydrateNode>(name: &str, grammar: G, options: fn() -> ResolvedOptions) {
        let compared: usize = read_fixtures(name).iter().map(|source| line_starts_agree::<G, N>(name, grammar, options, source)).sum();
        eprintln!("{name}: {compared} nodes' line starts equal");
    }
    each_grammar!(check);
}

#[test]
fn a_crlf_leaf_followed_by_a_fixed_token_keeps_its_line_start() {
    fn check<G: RecordGrammar + Copy, N: HydrateNode>(name: &str, grammar: G, options: fn() -> ResolvedOptions) {
        let source = match name {
            "typescript" => "`a\r\n${b}`;\n",
            "python" => "f\"\"\"a\r\n{b}\"\"\"\n",
            _ => return,
        };
        assert!(line_starts_agree::<G, N>(name, grammar, options, source) > 0, "{name}: the source holds nodes");
    }
    each_grammar!(check);
}

#[test]
fn a_token_read_by_its_interior_keeps_the_lines_inside_it() {
    fn check<G: RecordGrammar + Copy, N: HydrateNode>(name: &str, grammar: G, options: fn() -> ResolvedOptions) {
        let source = match name {
            "rust" => "fn f() { let c = '\n'; }\n",
            _ => return,
        };
        assert!(line_starts_agree::<G, N>(name, grammar, options, source) > 0, "{name}: the source holds nodes");
        over_both_reads::<G, N>(grammar, options, source, |all, _| {
            let nodes = &mut all.nodes();
            assert!(!sittir_core::engine::line_starts_inside_tokens(nodes, NodeIndex::ROOT, source).is_empty(), "{name}: a line starts inside the token");
        });
    }
    each_grammar!(check);
}

/// What holds a placed side: its kind and span, none for a unit, which a
/// read without rows knows by its cell alone.
fn holder_of<G: RecordGrammar, N: RecordCells>(arena: &dyn ArenaRead, site: NodeSite) -> (KindId, Option<Span>) {
    match site {
        NodeSite::Record(at) => {
            let side = side_of(arena, at);
            (side.node.expect("a parsed record's facts").kind, side.at.map(|row| row.span))
        }
        NodeSite::Row { holder, entry } => match side_of(arena, holder).run[entry as usize] {
            RunEntry::Row { facts, span, .. } => (facts.kind, Some(span)),
            RunEntry::Record { at, .. } => holder_of::<G, N>(arena, NodeSite::Record(at)),
        },
        NodeSite::Unit(site) => {
            let kind = header_of(arena.words(site.holder, 1).expect("a header")[0], sittir_core::record::PARSED_KIND_BITS).0;
            let shape = N::shape(kind).expect("a record shape");
            let words = arena.words(site.holder, shape.words).expect("a record");
            let cell = *shape.cells.iter().find(|cell| cell.word == site.word).expect("the unit's cell");
            let held = &words[cell.word as usize..(cell.word + cell.width) as usize];
            let value = match cell.run {
                None => Cell::decode_parsed(held, cell, G::KIND_BITS),
                Some(width) => Cell::decode_parsed(ListCell::of_word(CellWord(held[0]), arena).expect("a list").items(arena, width).expect("its items").nth(site.item.0 as usize).expect("the unit's item"), cell, G::KIND_BITS),
            };
            (value.expect("a cell").kind().expect("a unit's kind"), None)
        }
        NodeSite::Flag { .. } => panic!("a side is placed on a flag"),
    }
}

/// The token a row holds as its one child: the member an enum kind's row
/// spells, which a read without rows holds as the unit, under the kind the
/// grammar folds that raw token into, of the same name.
fn spelled_by(arena: &dyn ArenaRead, site: NodeSite) -> Option<KindId> {
    let NodeSite::Row { holder, entry } = site else { return None };
    let run = side_of(arena, holder).run;
    match (run.get(entry as usize)?, run.get(entry as usize + 1)) {
        (RunEntry::Row { inner: 1, .. }, Some(RunEntry::Row { facts, .. })) => Some(facts.kind),
        _ => None,
    }
}

/// A placed side: its holder's kind and span, the side, the extra's kind and
/// span, and the token its holder spells.
type PlacedSide = (KindId, Option<Span>, TriviaSide, KindId, Span, Option<KindId>);

fn placed_sides<G: RecordGrammar + Copy, N: HydrateNode + RecordCells>(grammar: G, options: fn() -> ResolvedOptions, source: &str, rows: ReadRows) -> (Vec<PlacedSide>, Vec<Placed>) {
    let mut engine = Engine::new(grammar, options()).expect("an engine");
    let (_, placed) = engine.parse_placed_with::<N>(source, rows).expect("a read");
    let built = engine.written().built();
    let sides = placed
        .iter()
        .map(|one| {
            let (kind, span) = holder_of::<G, N>(&*built, one.site);
            (kind, span, one.side, one.kind, one.span, spelled_by(&*built, one.site))
        })
        .collect();
    (sides, placed)
}

fn rendered<G: RecordGrammar + Copy, N: HydrateNode>(grammar: G, options: fn() -> ResolvedOptions, source: &str, rows: ReadRows) -> String {
    let mut engine = Engine::new(grammar, options()).expect("an engine");
    let root = engine.parse_records_with::<N>(source, rows).expect("a read").root.expect("a root record");
    let (built, options) = (engine.written().built(), engine.options().clone());
    engine.render_at(&built, root, ChangedEdges::default(), &options, false, |_| Ok(())).expect("a render")
}

#[test]
fn placements_differ_only_beside_named_fixed_tokens() {
    fn check<G: RecordGrammar + Copy, N: HydrateNode + RecordCells>(name: &str, grammar: G, options: fn() -> ResolvedOptions) {
        let pairs = named_fixed_pairs(name);
        let (mut same, mut moved) = (0, Vec::new());
        for source in read_fixtures(name) {
            let (whole, _) = placed_sides::<G, N>(grammar, options, &source, ReadRows::All);
            let (mut held, _) = placed_sides::<G, N>(grammar, options, &source, ReadRows::SlotContent);
            for one in whole {
                let found = held.iter().position(|other| (other.3, other.4) == (one.3, one.4));
                let now = found.map(|at| held.swap_remove(at));
                if now.is_some_and(|other| other.2 == one.2 && if other.1.is_none() { other.0 == one.0 || one.5.is_some_and(|spelled| G::kind_name(spelled) == G::kind_name(other.0)) } else { (other.0, other.1) == (one.0, one.1) }) {
                    same += 1;
                    continue;
                }
                assert!(pairs.iter().any(|pair| pair.token == G::kind_name(one.0)), "{name} {source:?}: {one:?} moved to {now:?}, beside no named fixed token");
                moved.push(format!("{} {:?} {:?} -> {:?}", G::kind_name(one.0), one.2, one.4, now.map(|other| (G::kind_name(other.0), other.2))));
            }
            assert!(held.is_empty(), "{name} {source:?}: the read without rows places more: {held:?}");
        }
        eprintln!("{name}: {same} placed sides equal, {} beside a named fixed token", moved.len());
        for one in moved {
            eprintln!("  {name}: {one}");
        }
    }
    each_grammar!(check);
}

#[test]
fn a_comment_beside_a_flag_stays_on_its_neighbour() {
    type N = sittir_rust::render::AnyNode;
    let (grammar, options) = (sittir_rust::RustGrammar, sittir_rust::render::options::defaults as fn() -> ResolvedOptions);
    let source = "fn f(x: & /* c */ mut T) {}";
    assert_eq!(rendered::<_, N>(grammar, options, source, ReadRows::All), rendered::<_, N>(grammar, options, source, ReadRows::SlotContent));
    let (sides, placed) = placed_sides::<_, N>(grammar, options, source, ReadRows::SlotContent);
    assert!(!placed.iter().any(|one| matches!(one.site, NodeSite::Flag { .. })), "no side is keyed to the flag");
    let at = u32::try_from(source.find('T').expect("the type")).expect("an offset");
    assert!(sides.iter().any(|side| side.1 == Some(Span { start: at, end: at + 1 }) && side.2 == TriviaSide::Leading), "the comment leads `T`: {sides:?}");
}

#[test]
fn a_comment_beside_a_unit_keeps_its_side_through_the_units_site() {
    type N = sittir_rust::render::AnyNode;
    let (grammar, options) = (sittir_rust::RustGrammar, sittir_rust::render::options::defaults as fn() -> ResolvedOptions);
    let source = "fn f(x: /* c */ u8) {}";
    assert_eq!(rendered::<_, N>(grammar, options, source, ReadRows::All), rendered::<_, N>(grammar, options, source, ReadRows::SlotContent));
    let (_, placed) = placed_sides::<_, N>(grammar, options, source, ReadRows::SlotContent);
    assert!(placed.iter().any(|one| matches!(one.site, NodeSite::Unit(_))), "a side is keyed to the unit's site: {placed:?}");
}
