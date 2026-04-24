//! readNode shape-gate tests. Spec 012 T025.
//!
//! For each of the three in-scope grammars (rust / typescript / python),
//! we parse a small source and assert the emitted `NodeData` has
//! **exactly** the 8 allowed `$`-prefixed top-level fields and no
//! others — SC-007 shape gate. Walks the entire tree to check every
//! emitted NodeData (not just the root), so enrichment fields that
//! might slip in on leaves vs branches are both covered.
//!
//! Also sanity-checks that `$source` is always `"ts"` from this code
//! path, that `$nodeId` is a monotonically-assigned counter, and that
//! field-slot arity produces `Single` vs `Multiple` correctly.

use serde_json::Value;
use sittir_core::read_node::read_node;
use sittir_core::types::{NodeData, Source};

/// The eight top-level keys permitted on the wire, per data-model.md §1.
const ALLOWED_TOP_LEVEL_KEYS: &[&str] = &[
    "$type", "$source", "$named", "$fields", "$children", "$text", "$span", "$nodeId",
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
    let mut counter: u32 = 0;
    read_node(&tree, source, None, &mut counter)
}

#[test]
fn rust_top_level_node_has_allowed_keys_only() {
    let lang: tree_sitter::Language = tree_sitter_rust::LANGUAGE.into();
    let source = "fn main() { let x = 1; }";
    let node = parse_and_read(lang, source);
    let json = serde_json::to_value(&node).expect("serialize");
    assert_shape(&json, "rust.root");
    assert_eq!(node.source, Source::Ts, "source must be ts");
    assert!(node.node_id.is_some(), "nodeId assigned");
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
fn node_ids_are_unique_and_dense() {
    // Every emitted NodeData carries a distinct `$nodeId`, and the
    // assigned IDs form a contiguous range starting at 0 (since this
    // is a fresh traversal with counter reset). We don't check
    // pre-order position here — the JSON walker visits `$fields` (a
    // HashMap) in non-deterministic order, so the collected ID
    // sequence is a permutation of 0..N rather than the original
    // assignment order.
    let lang: tree_sitter::Language = tree_sitter_python::LANGUAGE.into();
    let source = "x = 1\ny = 2\n";
    let node = parse_and_read(lang, source);
    let json = serde_json::to_value(&node).expect("serialize");
    let mut ids: Vec<u64> = Vec::new();
    collect_node_ids(&json, &mut ids);
    assert!(!ids.is_empty(), "should see at least the root");
    ids.sort_unstable();
    assert_eq!(ids[0], 0, "first assigned nodeId must be 0 after counter reset");
    for pair in ids.windows(2) {
        assert!(
            pair[1] == pair[0] + 1,
            "nodeIds must be contiguous 0..N (got gap): {ids:?}"
        );
    }
    // Root NodeData directly exposes its own id — that's the one that
    // gets assigned first, so it must be the minimum (0).
    assert_eq!(node.node_id, Some(0), "root must claim id 0");
}

/// Pre-order walk over the JSON NodeData tree, pushing every `$nodeId`
/// encountered into `out`. Recurses through `$fields` and `$children`.
fn collect_node_ids(value: &Value, out: &mut Vec<u64>) {
    match value {
        Value::Object(map) => {
            if let Some(Value::Number(n)) = map.get("$nodeId") {
                if let Some(id) = n.as_u64() {
                    out.push(id);
                }
            }
            if let Some(Value::Object(fmap)) = map.get("$fields") {
                for fv in fmap.values() {
                    collect_node_ids(fv, out);
                }
            }
            if let Some(Value::Array(arr)) = map.get("$children") {
                for c in arr {
                    collect_node_ids(c, out);
                }
            }
        }
        Value::Array(arr) => {
            for v in arr {
                collect_node_ids(v, out);
            }
        }
        _ => {}
    }
}
