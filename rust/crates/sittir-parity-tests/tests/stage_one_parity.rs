//! A parsed read with no row for a fixed token or a unit answers every
//! reader as a read that writes them all does.
#![cfg(feature = "arena")]

use sittir_core::arena::{BodySlot, EdgePart, RecordCells, RecordShape};
use sittir_core::types::KindId;

type ShapeFn = fn(KindId) -> Option<RecordShape>;

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
