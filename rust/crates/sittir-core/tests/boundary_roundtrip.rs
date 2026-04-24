//! Serde round-trip + elision + determinism tests for the boundary
//! shape defined in `sittir_core::types`. Spec 012 T011 — enforces
//! the invariants in data-model.md §1.

use sittir_core::types::{Edit, FieldValue, NodeData, Source, Span};
use std::collections::HashMap;

/// Parse `s` to `serde_json::Value` so we can inspect the literal wire
/// keys (not just the strong-typed round trip).
fn wire(s: &str) -> serde_json::Value {
    serde_json::from_str(s).expect("valid JSON")
}

/// Build a leaf NodeData (like an `identifier`) with every optional
/// field present except `children` + `fields` (leaves have no kids).
fn sample_leaf() -> NodeData {
    NodeData {
        type_: "identifier".to_string(),
        source: Source::Ts,
        named: true,
        fields: None,
        children: None,
        text: Some("foo".to_string()),
        span: Some(Span { start: 42, end: 45 }),
        node_id: Some(7),
    }
}

/// Build a branch NodeData with one field (single) + one children
/// entry + no span/nodeId/text — exercises both elision modes.
fn sample_branch() -> NodeData {
    let mut fields = HashMap::new();
    fields.insert(
        "name".to_string(),
        FieldValue::Single(Box::new(sample_leaf())),
    );
    NodeData {
        type_: "function_item".to_string(),
        source: Source::Ts,
        named: true,
        fields: Some(fields),
        children: Some(vec![sample_leaf()]),
        text: None,
        span: None,
        node_id: None,
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
fn roundtrip_branch_preserves_all_present_fields() {
    let original = sample_branch();
    let json = serde_json::to_string(&original).unwrap();
    let parsed: NodeData = serde_json::from_str(&json).unwrap();
    assert_eq!(original, parsed, "branch round trip must be identity");
}

#[test]
fn absent_optionals_stay_absent_on_the_wire() {
    // Branch has no $text, $span, $nodeId — must not appear as keys.
    let json = serde_json::to_string(&sample_branch()).unwrap();
    let v = wire(&json);
    let obj = v.as_object().expect("object");
    assert!(!obj.contains_key("$text"), "absent $text must be elided");
    assert!(!obj.contains_key("$span"), "absent $span must be elided");
    assert!(!obj.contains_key("$nodeId"), "absent $nodeId must be elided");
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
    assert_eq!(obj.get("$nodeId").and_then(|x| x.as_u64()), Some(7));
}

#[test]
fn no_unexpected_top_level_keys() {
    // Enumerate the 8 allowed top-level keys per data-model.md §1.
    // Any other top-level `$`-key is a contract violation.
    const ALLOWED: &[&str] = &[
        "$type", "$source", "$named",
        "$fields", "$children", "$text", "$span", "$nodeId",
    ];
    let json = serde_json::to_string(&sample_branch()).unwrap();
    let v = wire(&json);
    for key in v.as_object().expect("object").keys() {
        assert!(
            ALLOWED.contains(&key.as_str()),
            "unexpected top-level key on the wire: {key}"
        );
    }
}

#[test]
fn source_enum_serializes_as_lowercase() {
    assert_eq!(serde_json::to_string(&Source::Ts).unwrap(), "\"ts\"");
    assert_eq!(serde_json::to_string(&Source::Sg).unwrap(), "\"sg\"");
    assert_eq!(
        serde_json::to_string(&Source::Factory).unwrap(),
        "\"factory\""
    );
}

#[test]
fn field_value_untagged_shape() {
    // Single → object, Multiple → array, Text → string. No discriminator
    // wrapper on the wire (untagged enum).
    let single = FieldValue::Single(Box::new(sample_leaf()));
    let multiple = FieldValue::Multiple(vec![sample_leaf()]);
    let text = FieldValue::Text("unsafe".to_string());

    assert!(serde_json::to_value(&single).unwrap().is_object());
    assert!(serde_json::to_value(&multiple).unwrap().is_array());
    assert!(serde_json::to_value(&text).unwrap().is_string());
}

#[test]
fn field_value_deserializes_from_each_variant() {
    let obj_json = serde_json::to_string(&sample_leaf()).unwrap();
    let single: FieldValue = serde_json::from_str(&obj_json).unwrap();
    assert!(matches!(single, FieldValue::Single(_)));

    let arr_json =
        serde_json::to_string(&vec![sample_leaf(), sample_leaf()]).unwrap();
    let multi: FieldValue = serde_json::from_str(&arr_json).unwrap();
    assert!(matches!(multi, FieldValue::Multiple(ref v) if v.len() == 2));

    let text: FieldValue = serde_json::from_str("\"kw\"").unwrap();
    assert!(matches!(text, FieldValue::Text(ref s) if s == "kw"));
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
    let minimal = r#"{"$type":"identifier","$source":"ts","$named":true}"#;
    let parsed: NodeData = serde_json::from_str(minimal).unwrap();
    assert_eq!(parsed.type_, "identifier");
    assert_eq!(parsed.source, Source::Ts);
    assert!(parsed.named);
    assert!(parsed.fields.is_none());
    assert!(parsed.children.is_none());
    assert!(parsed.text.is_none());
    assert!(parsed.span.is_none());
    assert!(parsed.node_id.is_none());
}
