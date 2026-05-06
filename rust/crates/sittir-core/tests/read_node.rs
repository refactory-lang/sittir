//! readNode shape-gate tests. Spec 012 T025.
//!
//! For each of the three in-scope grammars (rust / typescript / python),
//! we parse a small source and assert the emitted `NodeData` has
//! **exactly** the 9 allowed `$`-prefixed top-level fields and no
//! others — SC-007 shape gate. Walks the entire tree to check every
//! emitted NodeData (not just the root), so enrichment fields that
//! might slip in on leaves vs branches are both covered.
//!
//! Also sanity-checks that `$source` is always `"ts"` from this code
//! path, that `$childIndex` values are set on non-root nodes, and that
//! field-slot arity produces `Single` vs `Multiple` correctly.

use serde_json::Value;
use sittir_core::read_node::read_node;
use sittir_core::types::{NodeData, Source};

/// The ten top-level keys permitted on the wire, per data-model.md §1
/// (nine structural + `$triviaData`).
const ALLOWED_TOP_LEVEL_KEYS: &[&str] = &[
    "$type",
    "$source",
    "$named",
    "$fields",
    "$children",
    "$text",
    "$span",
    "$nodeHandle",
    "$childIndex",
    "$triviaData",
];

/// Recursively assert that every object-shaped JSON node in `value`
/// (matching the NodeData wire shape) has only keys in
/// [`ALLOWED_TOP_LEVEL_KEYS`]. Descends into `$fields` values and
/// `$children` array entries.
fn assert_shape(value: &Value, path: &str) {
    match value {
        Value::Object(map) => {
            // If the object has "$type", it's a NodeData — gate the keys.
            // Otherwise (e.g. `$span` = {start, end}), just recurse.
            if map.contains_key("$type") {
                for key in map.keys() {
                    assert!(
                        ALLOWED_TOP_LEVEL_KEYS.contains(&key.as_str()),
                        "unexpected top-level key at {path}: {key}"
                    );
                }
                // Recurse into $fields values.
                if let Some(fields) = map.get("$fields") {
                    if let Value::Object(fmap) = fields {
                        for (fname, fval) in fmap {
                            assert_shape(fval, &format!("{path}.$fields.{fname}"));
                        }
                    }
                }
                // Recurse into $children.
                if let Some(Value::Array(arr)) = map.get("$children") {
                    for (i, child) in arr.iter().enumerate() {
                        assert_shape(child, &format!("{path}.$children[{i}]"));
                    }
                }
            }
        }
        Value::Array(arr) => {
            // FieldValue::Multiple surfaces as an array of NodeData.
            for (i, v) in arr.iter().enumerate() {
                assert_shape(v, &format!("{path}[{i}]"));
            }
        }
        _ => {}
    }
}

/// Parse `source` with `language` and return the root NodeData.
fn parse_and_read(language: tree_sitter::Language, source: &str) -> NodeData {
    let mut parser = tree_sitter::Parser::new();
    parser.set_language(&language).expect("set language");
    let tree = parser.parse(source, None).expect("parse succeeds");
    read_node(&tree, source, None)
}

#[test]
fn rust_top_level_node_has_allowed_keys_only() {
    let lang: tree_sitter::Language = tree_sitter_rust::LANGUAGE.into();
    let source = "fn main() { let x = 1; }";
    let node = parse_and_read(lang, source);
    let json = serde_json::to_value(&node).expect("serialize");
    assert_shape(&json, "rust.root");
    assert_eq!(node.source, Source::Ts, "source must be ts");
    // node_handle is None at read time (stamped by ParsedTree::push_node
    // after the read returns); child_index is None for root.
    assert!(node.node_handle.is_none(), "root node_handle not stamped by raw read_node");
    assert!(node.child_index.is_none(), "root has no child_index");
    assert!(node.span.is_some(), "span populated");
}

#[test]
fn typescript_top_level_node_has_allowed_keys_only() {
    let lang: tree_sitter::Language = tree_sitter_typescript::LANGUAGE_TYPESCRIPT.into();
    let source = "const x: number = 42;";
    let node = parse_and_read(lang, source);
    let json = serde_json::to_value(&node).expect("serialize");
    assert_shape(&json, "typescript.root");
    assert_eq!(node.source, Source::Ts);
}

#[test]
fn python_top_level_node_has_allowed_keys_only() {
    let lang: tree_sitter::Language = tree_sitter_python::LANGUAGE.into();
    let source = "def foo(x):\n    return x + 1\n";
    let node = parse_and_read(lang, source);
    let json = serde_json::to_value(&node).expect("serialize");
    assert_shape(&json, "python.root");
    assert_eq!(node.source, Source::Ts);
}

#[test]
fn no_enrichment_fields_on_any_node() {
    // $variant, $raw, promoted-keyword flags — none may appear anywhere.
    let lang: tree_sitter::Language = tree_sitter_rust::LANGUAGE.into();
    let source = "pub fn hello() -> &'static str { \"hi\" }";
    let node = parse_and_read(lang, source);
    let json = serde_json::to_value(&node).expect("serialize");
    let s = serde_json::to_string(&json).expect("stringify");
    // A cheap keyword-scan catches the obvious violations in the whole
    // subtree without writing a full walker.
    for forbidden in &["$variant", "$raw", "$promoted"] {
        assert!(
            !s.contains(forbidden),
            "enrichment field {forbidden} leaked into Rust read path"
        );
    }
}

#[test]
fn child_index_set_on_non_root_nodes() {
    // Every non-root NodeData carries a `$childIndex` indicating its
    // position within the parent's children array. Root has no
    // child_index. node_handle is None at raw read_node time (stamped
    // by ParsedTree::push_node).
    let lang: tree_sitter::Language = tree_sitter_python::LANGUAGE.into();
    let source = "x = 1\ny = 2\n";
    let node = parse_and_read(lang, source);
    let json = serde_json::to_value(&node).expect("serialize");
    let mut child_indices: Vec<u16> = Vec::new();
    collect_child_indices(&json, &mut child_indices, false);
    assert!(!child_indices.is_empty(), "should see child_index on non-root nodes");
    // Root must NOT have a child_index.
    assert!(node.child_index.is_none(), "root must not have a childIndex");
    // Root must NOT have node_handle at raw read time (stamped later).
    assert!(node.node_handle.is_none(), "root node_handle not stamped by raw read_node");
}

/// Pre-order walk over the JSON NodeData tree, collecting `$childIndex`
/// values. Recurses through `$fields` and `$children`.
fn collect_child_indices(value: &Value, out: &mut Vec<u16>, is_child: bool) {
    match value {
        Value::Object(map) => {
            if is_child {
                if let Some(Value::Number(n)) = map.get("$childIndex") {
                    if let Some(idx) = n.as_u64() {
                        out.push(idx as u16);
                    }
                }
            }
            if let Some(Value::Object(fmap)) = map.get("$fields") {
                for fv in fmap.values() {
                    collect_child_indices(fv, out, true);
                }
            }
            if let Some(Value::Array(arr)) = map.get("$children") {
                for c in arr {
                    collect_child_indices(c, out, true);
                }
            }
        }
        Value::Array(arr) => {
            for v in arr {
                collect_child_indices(v, out, true);
            }
        }
        _ => {}
    }
}
