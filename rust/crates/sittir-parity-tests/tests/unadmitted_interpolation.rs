//! A string read from source whose content holds an interpolation its opener's
//! prefix does not admit (tree-sitter's error recovery makes one, `'b {c}")`
//! after `f"a"`) is opaque, as a string under an unknown prefix is: its
//! delimiters are its source's. An untouched read renders as its source in
//! object storage, and the whole tree's record renders from its templates in
//! the arena's, neither refusing the string.

use sittir_parity_tests::{edited_rendered, parsed};

const SOURCES: [&str; 2] = ["print(f\"a\"'b {c}\")\n", "print(f\"Sorry, I couldn\"'t understand {command!r}\")\n"];

#[test]
fn an_object_storage_read_renders_as_its_source() {
    for source in SOURCES {
        assert_eq!(edited_rendered!(sittir_python, sittir_python::PythonGrammar, source), source);
    }
}

#[test]
fn the_whole_tree_s_record_renders_from_its_templates() {
    for source in SOURCES {
        let tree = parsed(sittir_python::PythonGrammar, sittir_python::render::options::defaults(), source);
        let runs = tree.baseline_runs(true);
        assert!(runs.is_ok(), "{source:?}: {runs:?}");
    }
}

#[test]
fn a_string_whose_prefix_admits_its_interpolation_renders_as_before() {
    let source = "print(f\"a {c}\")\n";
    let tree = parsed(sittir_python::PythonGrammar, sittir_python::render::options::defaults(), source);
    assert!(tree.baseline_runs(true).is_ok());
}
