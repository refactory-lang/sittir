//! readNode shape-gate tests. Spec 012 T025.
//!
//! For each of the three in-scope grammars (rust / typescript / python),
//! we parse a small source and assert the emitted `NodeData` has the
//! fixed allowed `$`-metadata keys plus de-hoisted `_<slot>` storage and
//! no others — SC-007 shape gate. Walks the entire read payload to check
//! every emitted NodeData (not just the root), so enrichment fields that
//! might slip in on leaves vs branches are both covered.
//!
//! Also sanity-checks that `$source` is always `"ts"` from this code
//! path, that child stubs carry parent-handle + `$childIndex`, and that
//! recursive `$fields` payloads no longer appear on native reads.

use serde_json::Value;
use sittir_core::read_node::read_node;
use sittir_core::types::{NodeData, Source};

/// Recursively assert that every object-shaped JSON node in `value`
/// (matching the NodeData wire shape) has only keys in
/// the de-hoisted NodeData contract. Descends into `_<slot>` values and
/// `$other` array entries.
fn assert_shape(value: &Value, path: &str) {
    match value {
        Value::Object(map) => {
            // If the object has "$type", it's a NodeData — gate the keys.
            // Otherwise (e.g. `$span` = {start, end}), just recurse.
            if map.contains_key("$type") {
                for key in map.keys() {
                    assert!(
                        is_allowed_node_key(key),
                        "unexpected top-level key at {path}: {key}"
                    );
                }
                assert!(
                    !map.contains_key("$fields"),
                    "legacy $fields wrapper leaked into read payload at {path}"
                );
                for (key, value) in map {
                    if key.starts_with('_') {
                        assert_shape(value, &format!("{path}.{key}"));
                    }
                }
                // Recurse into $other.
                if let Some(Value::Array(arr)) = map.get("$other") {
                    for (i, child) in arr.iter().enumerate() {
                        assert_shape(child, &format!("{path}.$other[{i}]"));
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
    read_node(&tree, source, None, Some(0))
}

fn parse_tree(language: tree_sitter::Language, source: &str) -> tree_sitter::Tree {
    let mut parser = tree_sitter::Parser::new();
    parser.set_language(&language).expect("set language");
    parser.parse(source, None).expect("parse succeeds")
}

#[test]
fn rust_top_level_node_has_allowed_keys_only() {
    let lang: tree_sitter::Language = tree_sitter_rust::LANGUAGE.into();
    let source = "fn main() { let x = 1; }";
    let node = parse_and_read(lang, source);
    let json = serde_json::to_value(&node).expect("serialize");
    assert_shape(&json, "rust.root");
    assert_eq!(node.source, Source::Ts, "source must be ts");
    assert_eq!(
        node.node_handle,
        Some(0),
        "root carries its reserved handle"
    );
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
    // Every child stub carries the parent handle + `$childIndex`.
    // Root has no child_index.
    let lang: tree_sitter::Language = tree_sitter_python::LANGUAGE.into();
    let source = "x = 1\ny = 2\n";
    let node = parse_and_read(lang, source);
    let json = serde_json::to_value(&node).expect("serialize");
    let mut child_meta: Vec<(u16, u32)> = Vec::new();
    collect_child_meta(&json, &mut child_meta, false);
    assert!(
        !child_meta.is_empty(),
        "should see child stubs in read payload"
    );
    assert!(child_meta.iter().all(|(_, handle)| *handle == 0));
    // Root must NOT have a child_index.
    assert!(
        node.child_index.is_none(),
        "root must not have a childIndex"
    );
    assert_eq!(node.node_handle, Some(0));
}

#[test]
fn anonymous_leaf_children_do_not_invent_fields() {
    let lang: tree_sitter::Language = tree_sitter_rust::LANGUAGE.into();
    let source = "fn f() { let _ = async move || async move {}; }";
    let tree = parse_tree(lang, source);
    let params = find_first_ts_node_by_kind(tree.root_node(), "closure_parameters")
        .expect("closure_parameters cst node");
    let node = read_node(&tree, source, Some(params), Some(0));
    let json = serde_json::to_value(&node).expect("serialize");
    let params = json.as_object().expect("closure_parameters object");
    assert!(
        !params.contains_key("_|"),
        "native read must not invent _<text> fields for anonymous children"
    );
    assert!(params.get("$other").is_none(), "anonymous-only leaf nodes should still collapse to text");
    assert_eq!(params.get("$text").and_then(Value::as_str), Some("||"));
}

#[test]
fn raw_native_children_payload_stays_array_shaped() {
    let lang: tree_sitter::Language = tree_sitter_rust::LANGUAGE.into();
    let source = "fn f() { g(x); }";
    let tree = parse_tree(lang, source);
    let args = find_first_ts_node_by_kind(tree.root_node(), "arguments").expect("arguments node");
    let node = read_node(&tree, source, Some(args), Some(0));
    let json = serde_json::to_value(&node).expect("serialize");

    assert!(
        json.get("$other").is_some_and(Value::is_array),
        "raw native read payload must stay realized-shape for children"
    );
}

/// Pre-order walk over the JSON NodeData tree, collecting child stub
/// `(childIndex, nodeHandle)` pairs. Recurses through `_<slot>` values
/// and `$other`.
fn collect_child_meta(value: &Value, out: &mut Vec<(u16, u32)>, is_child: bool) {
    match value {
        Value::Object(map) => {
            if is_child {
                if let (Some(Value::Number(idx)), Some(Value::Number(handle))) =
                    (map.get("$childIndex"), map.get("$nodeHandle"))
                {
                    if let (Some(idx), Some(handle)) = (idx.as_u64(), handle.as_u64()) {
                        out.push((idx as u16, handle as u32));
                    }
                }
            }
            for (key, value) in map {
                if key.starts_with('_') {
                    collect_child_meta(value, out, true);
                }
            }
            if let Some(Value::Array(arr)) = map.get("$other") {
                for c in arr {
                    collect_child_meta(c, out, true);
                }
            }
        }
        Value::Array(arr) => {
            for v in arr {
                collect_child_meta(v, out, true);
            }
        }
        _ => {}
    }
}

fn is_allowed_node_key(key: &str) -> bool {
    matches!(
        key,
        "$type"
            | "$source"
            | "$named"
            | "$other"
            | "$text"
            | "$span"
            | "$nodeHandle"
            | "$childIndex"
            | "$triviaData"
    ) || key.starts_with('_')
}

fn find_first_ts_node_by_kind<'a>(
    node: tree_sitter::Node<'a>,
    kind: &str,
) -> Option<tree_sitter::Node<'a>> {
    if node.kind() == kind {
        return Some(node);
    }
    for i in 0..node.child_count() {
        let child = node.child(i as u32)?;
        if let Some(found) = find_first_ts_node_by_kind(child, kind) {
            return Some(found);
        }
    }
    None
}

#[test]
fn anonymous_separator_token_retains_span_and_text_through_wire_roundtrip() {
    // Reproduces the PR-T Task 2 bug: an anonymous separator token (the
    // `,` between call arguments) must survive the actual JSON
    // serialize/deserialize round-trip `parse_and_read` performs on the
    // NAPI boundary, not just the pre-serialization NodeData. Before the
    // fix, `scalar_child_value` scalarizes every anonymous leaf child
    // with no `child_index` down to a bare `KindId` number, discarding
    // `$span`/`$text`.
    let lang: tree_sitter::Language = tree_sitter_rust::LANGUAGE.into();
    let source = "fn f() { g(x, y); }";
    let tree = parse_tree(lang, source);
    let args = find_first_ts_node_by_kind(tree.root_node(), "arguments").expect("arguments node");
    let node = read_node(&tree, source, Some(args), Some(0));

    let wire = serde_json::to_string(&node).expect("serialize");
    let round_tripped: NodeData = serde_json::from_str(&wire).expect("deserialize");

    let other = round_tripped
        .children
        .as_ref()
        .expect("arguments has $other children");
    assert_eq!(
        other.len(),
        3,
        "expected '(' ',' ')' as the three anonymous children"
    );
    let comma = &other[1];
    assert_eq!(
        comma.text.as_deref(),
        Some(","),
        "comma token must retain its literal text through the wire round-trip"
    );
    assert!(
        comma.span.is_some(),
        "comma token must retain its span through the wire round-trip"
    );
}
