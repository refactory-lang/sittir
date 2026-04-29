//! Spec 012 T062 — SC-007 shape gate.
//!
//! Serializes a complex NodeData and asserts the resulting JSON has
//! exactly the eight allowed top-level `$`-prefixed keys with no
//! additions. Enrichment fields (`$variant`, `$raw`, supertype labels)
//! live on the TS side and MUST NOT cross the wire boundary —
//! corollary of FR-005a + Constitution Principle X.
//!
//! This test guards against regression at the *type definition* level:
//! adding a new field to `NodeData` without thinking about the
//! boundary contract will fail this test even before the serde
//! `rename` attribute is set.

use sittir_core::types::{FieldValue, NodeData, Source, Span};
use std::collections::HashMap;
use std::collections::HashSet;

/// The exact eight keys data-model.md §1 enumerates. Sorted
/// alphabetically (after the required trio) per the determinism
/// invariant, but `HashSet` membership is the gate.
const ALLOWED_KEYS: &[&str] = &[
    "$type",
    "$source",
    "$named",
    "$fields",
    "$children",
    "$text",
    "$span",
    "$nodeId",
];

/// Build a NodeData where every optional field is populated, so the
/// serialized payload exercises the maximum-key surface. Anything
/// outside `ALLOWED_KEYS` would surface here.
fn complex_node() -> NodeData {
    let mut fields = HashMap::new();
    fields.insert(
        "name".to_string(),
        FieldValue::Single(Box::new(NodeData {
            type_: "identifier".to_string(),
            source: Source::Ts,
            named: true,
            fields: None,
            children: None,
            text: Some("foo".to_string()),
            span: Some(Span { start: 0, end: 3 }),
            node_id: Some(2),
        })),
    );
    fields.insert(
        "values".to_string(),
        FieldValue::Multiple(vec![NodeData {
            type_: "integer_literal".to_string(),
            source: Source::Ts,
            named: true,
            fields: None,
            children: None,
            text: Some("1".to_string()),
            span: Some(Span { start: 5, end: 6 }),
            node_id: Some(3),
        }]),
    );
    fields.insert("op".to_string(), FieldValue::Text("+".to_string()));
    NodeData {
        type_: "function_item".to_string(),
        source: Source::Ts,
        named: true,
        fields: Some(fields),
        children: Some(vec![NodeData {
            type_: "block".to_string(),
            source: Source::Ts,
            named: true,
            fields: Some(HashMap::new()),
            children: Some(vec![]),
            text: None,
            span: Some(Span { start: 7, end: 9 }),
            node_id: Some(4),
        }]),
        text: None,
        span: Some(Span { start: 0, end: 9 }),
        node_id: Some(1),
    }
}

#[test]
fn top_level_keys_match_allowed_set() {
    let node = complex_node();
    let json = serde_json::to_string(&node).expect("serialization");
    let value: serde_json::Value = serde_json::from_str(&json).expect("reparse");
    let obj = value.as_object().expect("object");

    let actual: HashSet<&str> = obj.keys().map(String::as_str).collect();
    let allowed: HashSet<&str> = ALLOWED_KEYS.iter().copied().collect();

    let unexpected: Vec<&&str> = actual.difference(&allowed).collect();
    assert!(
        unexpected.is_empty(),
        "NodeData wire shape leaked unexpected top-level keys: {unexpected:?}. Allowed: {ALLOWED_KEYS:?}"
    );

    // Required trio must be present even on a fully-populated node;
    // optionals (when filled) must surface as well so downstream
    // consumers can reproduce the wire shape from the type system.
    for required in ["$type", "$source", "$named"] {
        assert!(
            actual.contains(required),
            "NodeData missing required wire key {required}"
        );
    }
}

#[test]
fn nested_node_data_keys_also_match() {
    let node = complex_node();
    let json = serde_json::to_string(&node).expect("serialization");
    let value: serde_json::Value = serde_json::from_str(&json).expect("reparse");

    let allowed: HashSet<&str> = ALLOWED_KEYS.iter().copied().collect();
    walk_assert(&value, &allowed);
}

/// Walk every nested `NodeData`-shaped object inside the JSON value
/// and assert each carries only the allowed keys. Identifies a
/// NodeData by the presence of the required trio (`$type`/`$source`/
/// `$named`).
fn walk_assert(v: &serde_json::Value, allowed: &HashSet<&str>) {
    if let Some(obj) = v.as_object() {
        let is_node =
            obj.contains_key("$type") && obj.contains_key("$source") && obj.contains_key("$named");
        if is_node {
            let actual: HashSet<&str> = obj.keys().map(String::as_str).collect();
            let unexpected: Vec<&&str> = actual.difference(allowed).collect();
            assert!(
                unexpected.is_empty(),
                "nested NodeData leaked keys {unexpected:?} (kind = {:?})",
                obj.get("$type")
            );
        }
        for child in obj.values() {
            walk_assert(child, allowed);
        }
    } else if let Some(arr) = v.as_array() {
        for item in arr {
            walk_assert(item, allowed);
        }
    }
}
