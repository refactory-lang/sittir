//! Serde round-trip + elision + determinism tests for the boundary
//! shape defined in `sittir_core::types`. Spec 012 T011 — enforces
//! the invariants in data-model.md §1.

use sittir_core::types::{Edit, FieldValue, KindId, NodeData, Source, Span};
use indexmap::IndexMap;

// KindId fixtures — values match the Rust grammar's parser.c symbol ids.
const K_IDENTIFIER: KindId = KindId(1);
const K_FUNCTION_ITEM: KindId = KindId(188);

/// Parse `s` to `serde_json::Value` so we can inspect the literal wire
/// keys (not just the strong-typed round trip).
fn wire(s: &str) -> serde_json::Value {
    serde_json::from_str(s).expect("valid JSON")
}

/// Build a leaf NodeData (like an `identifier`) with every optional
/// field present except `children` + `fields` (leaves have no kids).
fn sample_leaf() -> NodeData {
    NodeData {
        type_: K_IDENTIFIER,
        source: Source::Ts,
        named: true,
        fields: None,
        children: None,
        text: Some("foo".to_string()),
        span: Some(Span { start: 42, end: 45 }),
        node_handle: Some(7),
        child_index: None,
        trivia_data: None,
    }
}

fn sample_slot_leaf() -> NodeData {
    NodeData {
        node_handle: None,
        child_index: None,
        ..sample_leaf()
    }
}

/// Build a branch NodeData with one field (single) + one children
/// entry + no span/nodeId/text — exercises both elision modes.
fn sample_branch() -> NodeData {
    let mut fields = IndexMap::new();
    fields.insert(
        "name".to_string(),
        FieldValue::Single(Box::new(sample_slot_leaf())),
    );
    NodeData {
        type_: K_FUNCTION_ITEM,
        source: Source::Ts,
        named: true,
        fields: Some(fields),
        children: Some(vec![sample_leaf()]),
        text: None,
        span: None,
        node_handle: None,
        child_index: None,
        trivia_data: None,
    }
}

#[test]
fn roundtrip_leaf_preserves_all_present_fields() {
    let original = sample_leaf();
    let json = serde_json::to_string(&original).unwrap();
    let parsed: NodeData = serde_json::from_str(&json).unwrap();
    assert_eq!(original, parsed, "leaf round trip must be identity");
}

#[test]
fn roundtrip_branch_normalizes_leaf_field_slots() {
    let json = serde_json::to_string(&sample_branch()).unwrap();
    let parsed: NodeData = serde_json::from_str(&json).unwrap();
    let field = parsed
        .fields
        .as_ref()
        .and_then(|fields| fields.get("name"))
        .expect("name field");
    assert!(matches!(field, FieldValue::Text(text) if text == "foo"));
}

#[test]
fn absent_optionals_stay_absent_on_the_wire() {
    // Branch has no $text, $span, $nodeId — must not appear as keys.
    let json = serde_json::to_string(&sample_branch()).unwrap();
    let v = wire(&json);
    let obj = v.as_object().expect("object");
    assert!(!obj.contains_key("$text"), "absent $text must be elided");
    assert!(!obj.contains_key("$span"), "absent $span must be elided");
    assert!(
        !obj.contains_key("$nodeHandle"),
        "absent $nodeHandle must be elided"
    );
    assert!(
        !obj.contains_key("$childIndex"),
        "absent $childIndex must be elided"
    );
    // Required trio still present.
    assert!(obj.contains_key("$type"));
    assert!(obj.contains_key("$source"));
    assert!(obj.contains_key("$named"));
}

#[test]
fn present_optionals_appear_on_the_wire() {
    let json = serde_json::to_string(&sample_leaf()).unwrap();
    let v = wire(&json);
    let obj = v.as_object().expect("object");
    assert_eq!(obj.get("$text").and_then(|x| x.as_str()), Some("foo"));
    let span = obj.get("$span").expect("$span");
    assert_eq!(span["start"].as_u64(), Some(42));
    assert_eq!(span["end"].as_u64(), Some(45));
    assert_eq!(obj.get("$nodeHandle").and_then(|x| x.as_u64()), Some(7));
}

#[test]
fn no_unexpected_top_level_keys() {
    let json = serde_json::to_string(&sample_branch()).unwrap();
    let v = wire(&json);
    for key in v.as_object().expect("object").keys() {
        assert!(
            is_allowed_node_key(key),
            "unexpected top-level key on the wire: {key}"
        );
    }
    assert!(
        v.get("_name").is_some(),
        "named slots serialize as top-level _<slot> keys"
    );
    assert!(
        v.get("$fields").is_none(),
        "legacy $fields wrapper must not serialize"
    );
}

#[test]
fn source_enum_serializes_as_numeric() {
    assert_eq!(serde_json::to_string(&Source::Ts).unwrap(), "0");
    assert_eq!(serde_json::to_string(&Source::Sg).unwrap(), "1");
    assert_eq!(serde_json::to_string(&Source::Factory).unwrap(), "2");
}

#[test]
fn field_value_untagged_shape() {
    // Leaf-backed Single/Multiple collapse to scalar/string-or-number wire
    // values; branch-backed values stay object/array.
    let single = FieldValue::Single(Box::new(sample_slot_leaf()));
    let multiple = FieldValue::Multiple(vec![sample_slot_leaf()]);
    let text = FieldValue::Text("unsafe".to_string());

    assert!(serde_json::to_value(&single).unwrap().is_string());
    assert!(serde_json::to_value(&multiple).unwrap().is_array());
    assert!(serde_json::to_value(&text).unwrap().is_string());
}

#[test]
fn field_value_deserializes_from_each_variant() {
    let obj_json = serde_json::to_string(&sample_leaf()).unwrap();
    let single: FieldValue = serde_json::from_str(&obj_json).unwrap();
    assert!(matches!(single, FieldValue::Single(_)));

    let arr_json = serde_json::to_string(&vec![sample_leaf(), sample_leaf()]).unwrap();
    let multi: FieldValue = serde_json::from_str(&arr_json).unwrap();
    assert!(matches!(multi, FieldValue::Multiple(ref v) if v.len() == 2));

    let text: FieldValue = serde_json::from_str("\"kw\"").unwrap();
    assert!(matches!(text, FieldValue::Text(ref s) if s == "kw"));

    let kind: FieldValue = serde_json::from_str("85").unwrap();
    assert!(matches!(kind, FieldValue::Single(ref node) if node.type_ == KindId(85)));
}

#[test]
fn anonymous_leaf_children_scalarize_on_the_wire() {
    let node = NodeData {
        type_: K_FUNCTION_ITEM,
        source: Source::Ts,
        named: true,
        fields: None,
        children: Some(vec![NodeData {
            type_: KindId(55),
            source: Source::Ts,
            named: false,
            fields: None,
            children: None,
            text: Some("|".to_string()),
            span: Some(Span { start: 0, end: 1 }),
            node_handle: None,
            child_index: None,
            trivia_data: None,
        }]),
        text: None,
        span: None,
        node_handle: None,
        child_index: None,
        trivia_data: None,
    };
    let json = serde_json::to_string(&node).unwrap();
    let v = wire(&json);
    assert_eq!(v["$other"][0].as_u64(), Some(55));

    let parsed: NodeData = serde_json::from_str(&json).unwrap();
    let child = parsed
        .children
        .as_ref()
        .and_then(|items| items.first())
        .expect("child");
    assert_eq!(child.type_, KindId(55));
    assert_eq!(child.named, false);
}

#[test]
fn edit_uses_camelcase_on_the_wire() {
    let e = Edit {
        start_pos: 10,
        end_pos: 20,
        inserted_text: "x".to_string(),
    };
    let json = serde_json::to_string(&e).unwrap();
    let v = wire(&json);
    let obj = v.as_object().expect("object");
    assert!(obj.contains_key("startPos"));
    assert!(obj.contains_key("endPos"));
    assert!(obj.contains_key("insertedText"));
    assert!(!obj.contains_key("start_pos"));
}

#[test]
fn deserialization_accepts_missing_optionals() {
    // Minimal shape — required trio only, everything else defaulted.
    // $type is now a numeric KindId on the wire (Phase B-inverse).
    let minimal = r#"{"$type":1,"$source":0,"$named":true}"#;
    let parsed: NodeData = serde_json::from_str(minimal).unwrap();
    assert_eq!(parsed.type_, K_IDENTIFIER);
    assert_eq!(parsed.source, Source::Ts);
    assert!(parsed.named);
    assert!(parsed.fields.is_none());
    assert!(parsed.children.is_none());
    assert!(parsed.text.is_none());
    assert!(parsed.span.is_none());
    assert!(parsed.node_handle.is_none());
    assert!(parsed.child_index.is_none());
}

#[test]
fn deserialization_accepts_legacy_fields_wrapper_for_compatibility() {
    let legacy = r#"{"$type":188,"$source":0,"$named":true,"$fields":{"name":{"$type":1,"$source":0,"$named":true,"$text":"foo"}}}"#;
    let parsed: NodeData = serde_json::from_str(legacy).unwrap();
    assert!(parsed
        .fields
        .as_ref()
        .is_some_and(|fields| fields.contains_key("name")));
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
