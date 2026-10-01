//! Serde round-trip + elision + determinism tests for the boundary
//! shape defined in `sittir_core::types`. Spec 012 T011 — enforces
//! the invariants in data-model.md §1.

use indexmap::IndexMap;
use sittir_core::types::{Edit, FieldValue, KindId, UntypedNode, NodeHandle, Source, Span};

// KindId fixtures — values match the Rust grammar's parser.c symbol ids.
const K_IDENTIFIER: KindId = KindId(1);
const K_FUNCTION_ITEM: KindId = KindId(188);

/// Parse `s` to `serde_json::Value` so we can inspect the literal wire
/// keys (not just the strong-typed round trip).
fn wire(s: &str) -> serde_json::Value {
    serde_json::from_str(s).expect("valid JSON")
}

/// Build a leaf UntypedNode (like an `identifier`) with every optional
/// field present except `children` + `fields` (leaves have no kids).
fn sample_leaf() -> UntypedNode {
    UntypedNode {
        type_: K_IDENTIFIER,
        display_type: None,
        source: Source::Ts,
        named: true,
        fields: None,
        children: None,
        text: Some("foo".to_string()),
        span: Some(Span { start: 42, end: 45 }),
        handle: Some(NodeHandle::Own(7)),
        child_index: None,
        trivia_data: None,
        slot_order: None,
        same_line: false,
        tokens_between: 0,
        text_only: false,
    }
}

fn sample_slot_leaf() -> UntypedNode {
    UntypedNode {
        handle: None,
        child_index: None,
        ..sample_leaf()
    }
}

/// Build a branch UntypedNode with one field (single) + one children
/// entry + no span/nodeId/text — exercises both elision modes.
fn sample_branch() -> UntypedNode {
    let mut fields = IndexMap::new();
    fields.insert(
        "name".to_string(),
        FieldValue::Single(Box::new(sample_slot_leaf())),
    );
    UntypedNode {
        type_: K_FUNCTION_ITEM,
        display_type: None,
        source: Source::Ts,
        named: true,
        fields: Some(fields),
        children: Some(vec![sample_leaf()]),
        text: None,
        span: None,
        handle: None,
        child_index: None,
        trivia_data: None,
        slot_order: None,
        same_line: false,
        tokens_between: 0,
        text_only: false,
    }
}

#[test]
fn roundtrip_leaf_preserves_all_present_fields() {
    let original = sample_leaf();
    let json = serde_json::to_string(&original).unwrap();
    let parsed: UntypedNode = serde_json::from_str(&json).unwrap();
    assert_eq!(original, parsed, "leaf round trip must be identity");
}

#[test]
fn roundtrip_branch_normalizes_leaf_field_slots() {
    let json = serde_json::to_string(&sample_branch()).unwrap();
    let parsed: UntypedNode = serde_json::from_str(&json).unwrap();
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
        !["$handle", "$parentHandle", "$treeHandle"].iter().any(|k| obj.contains_key(*k)),
        "an absent handle must be elided"
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
    assert_eq!(obj.get("$handle").and_then(|x| x.as_u64()), Some(7));
}

#[test]
fn each_handle_travels_under_the_key_that_names_what_it_is() {
    for (handle, key) in [
        (NodeHandle::Own(7), "$handle"),
        (NodeHandle::Parent(7), "$parentHandle"),
        (NodeHandle::Tree(7), "$treeHandle"),
    ] {
        let child_index = matches!(handle, NodeHandle::Parent(_)).then_some(0);
        let node = UntypedNode { handle: Some(handle), child_index, ..sample_leaf() };
        let v = serde_json::to_value(&node).unwrap();
        let keys: Vec<_> = ["$handle", "$parentHandle", "$treeHandle"]
            .into_iter()
            .filter(|k| v.get(k).is_some())
            .collect();
        assert_eq!(keys, vec![key]);
        assert_eq!(v[key].as_u64(), Some(7));
        let back: UntypedNode = serde_json::from_value(v).unwrap();
        assert_eq!(back.handle, Some(handle));
    }
}

#[test]
fn deserialization_refuses_a_parent_handle_without_its_child_index() {
    let lone = r#"{"$type":1,"$source":0,"$named":true,"$parentHandle":2}"#;
    let err = serde_json::from_str::<UntypedNode>(lone).unwrap_err();
    assert!(err.to_string().contains("$parentHandle without $childIndex"), "{err}");
}

#[test]
fn deserialization_refuses_a_node_naming_two_handles() {
    let both = r#"{"$type":1,"$source":0,"$named":true,"$handle":1,"$parentHandle":2,"$childIndex":0}"#;
    let err = serde_json::from_str::<UntypedNode>(both).unwrap_err();
    assert!(err.to_string().contains("more than one of $handle, $parentHandle, $treeHandle"), "{err}");
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
    let multiple = FieldValue::Multiple(vec![Some(sample_slot_leaf())]);
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
fn slot_order_roundtrips_and_elides_when_absent() {
    // Multi-bucket parents stamp `$slotOrder` (cross-bucket interleave);
    // it must survive a wire roundtrip and stay absent everywhere else.
    let json = r#"{"$type":372,"$source":0,"$named":true,"_name":["A"],"_enum_assignment":["B"],"$slotOrder":["name","enum_assignment"]}"#;
    let node: UntypedNode = serde_json::from_str(json).unwrap();
    assert_eq!(
        node.slot_order.as_deref(),
        Some(&["name".to_string(), "enum_assignment".to_string()][..])
    );
    assert_eq!(serde_json::to_string(&node).unwrap(), json);

    assert!(!serde_json::to_string(&sample_leaf())
        .unwrap()
        .contains("$slotOrder"));
}

#[test]
fn field_value_array_holes_roundtrip() {
    // Sparse-array elisions (ts `[, a, ]`) store `null` holes in array slots.
    let arr: FieldValue = serde_json::from_str(r#"[null,"a",null]"#).unwrap();
    let FieldValue::Multiple(ref items) = arr else {
        panic!("expected Multiple")
    };
    assert!(items[0].is_none());
    assert!(matches!(items[1].as_ref(), Some(node) if node.text.as_deref() == Some("a")));
    assert!(items[2].is_none());
    assert_eq!(serde_json::to_string(&arr).unwrap(), r#"[null,"a",null]"#);
}

#[test]
fn field_value_boolean_slot_roundtrips() {
    // Separator-presence slots (e.g. `_trailing_sep`) store a bare boolean.
    let val: FieldValue = serde_json::from_str("false").unwrap();
    assert!(matches!(val, FieldValue::Bool(false)));
    assert_eq!(serde_json::to_string(&val).unwrap(), "false");

    let json = r#"{"$type":237,"$source":0,"$named":true,"_trailing_sep":false}"#;
    let node: UntypedNode = serde_json::from_str(json).unwrap();
    let field = node.fields.as_ref().unwrap().get("trailing_sep").unwrap();
    assert!(matches!(field, FieldValue::Bool(false)));
    assert_eq!(serde_json::to_string(&node).unwrap(), json);
}

#[test]
fn anonymous_leaf_children_scalarize_on_the_wire() {
    let node = UntypedNode {
        type_: K_FUNCTION_ITEM,
        display_type: None,
        source: Source::Ts,
        named: true,
        fields: None,
        children: Some(vec![UntypedNode {
            type_: KindId(55),
            display_type: None,
            source: Source::Ts,
            named: false,
            fields: None,
            children: None,
            text: Some("|".to_string()),
            span: Some(Span { start: 0, end: 1 }),
            handle: None,
            child_index: None,
            trivia_data: None,
            slot_order: None,
            same_line: false,
            tokens_between: 0,
            text_only: false,
        }]),
        text: None,
        span: None,
        handle: None,
        child_index: None,
        trivia_data: None,
        slot_order: None,
        same_line: false,
        tokens_between: 0,
        text_only: false,
    };
    let json = serde_json::to_string(&node).unwrap();
    let v = wire(&json);
    assert_eq!(v["$other"][0].as_u64(), Some(55));

    let parsed: UntypedNode = serde_json::from_str(&json).unwrap();
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
    let parsed: UntypedNode = serde_json::from_str(minimal).unwrap();
    assert_eq!(parsed.type_, K_IDENTIFIER);
    assert_eq!(parsed.source, Source::Ts);
    assert!(parsed.named);
    assert!(parsed.fields.is_none());
    assert!(parsed.children.is_none());
    assert!(parsed.text.is_none());
    assert!(parsed.span.is_none());
    assert!(parsed.handle.is_none());
    assert!(parsed.child_index.is_none());
}

#[test]
fn deserialization_accepts_legacy_fields_wrapper_for_compatibility() {
    let legacy = r#"{"$type":188,"$source":0,"$named":true,"$fields":{"name":{"$type":1,"$source":0,"$named":true,"$text":"foo"}}}"#;
    let parsed: UntypedNode = serde_json::from_str(legacy).unwrap();
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
            | "$handle"
            | "$parentHandle"
            | "$treeHandle"
            | "$childIndex"
            | "$_trivia"
            | "$slotOrder"
    ) || key.starts_with('_')
}
