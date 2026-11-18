//! An arena render reads whether a list item is set apart from what its
//! parse stamped: an item with a record from its record's header, any other
//! item from the leading side its parse placed. It never scans its source
//! for blank rows.
#![cfg(feature = "arena")]

use sittir_core::engine::Engine;
use sittir_core::points::blank_row_scans;
use sittir_core::slot::ChangedEdges;

/// The rust `source` read into records and rendered from its root's record,
/// from its templates when `templates`, with the blank-row scans the render
/// made.
fn rendered(source: &str, templates: bool) -> (String, u64) {
    let mut engine = Engine::new(sittir_rust::RustGrammar, sittir_rust::render::options::defaults()).expect("an engine");
    let options = engine.options().clone();
    let root = engine.parse_records::<sittir_rust::render::node::AnyNode>(source).expect("a parse").root.expect("a root");
    let built = engine.written().built();
    let before = blank_row_scans();
    let text = engine.render_at(&built, root, ChangedEdges::default(), &options, templates, |_| Ok(())).expect("a render");
    (text, blank_row_scans() - before)
}

#[test]
fn a_render_of_records_set_apart_scans_no_blank_rows() {
    let source = "fn f() {\n    a;\n\n    b;\n}\n";
    assert_eq!(rendered(source, false), (source.to_owned(), 0), "an untouched render");
    assert_eq!(rendered(source, true), (source.to_owned(), 0), "statements are records: each reads whether it is set apart from itself");
}

#[test]
fn a_render_that_looks_up_leaf_items_set_apart_scans_no_blank_rows() {
    let source = "use a::{\n    b,\n\n    c,\n};\n";
    let (text, scans) = rendered(source, true);
    assert!(text.contains("b,\n\n"), "the leaf item keeps its blank line: {text:?}");
    assert_eq!(scans, 0, "a use list's names are leaves: each reads the leading side its parse placed");
}
