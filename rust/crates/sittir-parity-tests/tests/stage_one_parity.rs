//! A parsed read with no row for a fixed token or a unit answers every
//! reader as a read that writes them all does.
#![cfg(feature = "arena")]

use sittir_core::arena::side::{RunEntry, SideRecord};
use sittir_core::arena::{header_of, Address, ArenaRead, BodySlot, Cell, CellWord, EdgePart, HydrateNode, ListCell, ReadRows, RecordCells, RecordGrammar, RecordShape};
use sittir_core::engine::Engine;
use sittir_core::options::ResolvedOptions;
use sittir_core::types::KindId;

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
