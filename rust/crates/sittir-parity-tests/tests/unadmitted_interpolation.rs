//! A string read from source whose content holds an interpolation its opener's
//! prefix does not admit (tree-sitter's error recovery makes one, `'b {c}")`
//! after `f"a"`) is opaque, as a string under an unknown prefix is: its
//! delimiters are its source's. A read with every node edited renders in
//! object storage with its gaps taken from the options, the in-line gaps
//! beside the `ERROR` recovery leaves inside the string included, and the
//! whole tree renders from its templates, neither refusing the string.

use sittir_parity_tests::{edited_rendered, parsed};

/// The root of `source` rendered from its templates (`ThroughTemplates`).
fn through_templates(source: &str) -> Result<String, sittir_core::render::RenderError> {
    let tree = parsed(sittir_python::PythonGrammar, sittir_python::render::options::defaults(), source);
    let seating = tree.seating();
    let sources = sittir_core::render::ThroughTemplates(&seating);
    let root = sittir_core::render::SourceTable::row_coordinate(&sources, tree.tree_id(), sittir_core::types::NodeIndex::ROOT).expect("a root coordinate");
    let options = sittir_python::render::options::defaults();
    sittir_python::render::render_node_parts(sittir_core::SlotValue::Coord(root), &sittir_core::prepare::RenderContext::new(&options, &sources)).map(|(_, text)| text)
}

const SOURCES: [&str; 2] = ["print(f\"a\"'b {c}\")\n", "print(f\"Sorry, I couldn\"'t understand {command!r}\")\n"];

#[test]
fn an_object_storage_read_renders_with_its_gaps_from_the_options() {
    let rendered = ["print (f\"a\" ' b{c} \")\n", "print (f\"Sorry, I couldn\" ' t understand{command!r} \")\n"];
    for (source, rendered) in SOURCES.into_iter().zip(rendered) {
        assert_eq!(edited_rendered!(sittir_python, sittir_python::PythonGrammar, source), rendered);
    }
}

#[test]
fn the_whole_tree_renders_from_its_templates() {
    for source in SOURCES {
        let rendered = through_templates(source);
        assert!(rendered.is_ok(), "{source:?}: {rendered:?}");
    }
}

#[test]
fn a_string_whose_prefix_admits_its_interpolation_renders_as_before() {
    assert!(through_templates("print(f\"a {c}\")\n").is_ok());
}
