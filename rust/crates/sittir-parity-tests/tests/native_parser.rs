use sittir_core::read_node::read_node;
use sittir_core::types::FieldValue;
use sittir_typescript::render::{CONST, LEXICAL_DECLARATION, SEMI};
use tree_sitter::Parser;

#[test]
fn typescript_lexical_declaration_reads_override_named_fields() {
    let source = "const bar = \"baz\";";
    let mut parser = Parser::new();
    parser
        .set_language(&sittir_typescript::language())
        .expect("set_language");
    let tree = parser.parse(source, None).expect("parse");
    let node = tree
        .root_node()
        .named_child(0)
        .expect("lexical_declaration child");

    assert_eq!(node.kind(), "lexical_declaration");

    let data = read_node(&tree, source, Some(node), Some(0));
    let fields = data.fields.expect("named fields");

    assert_eq!(data.type_, LEXICAL_DECLARATION);
    assert!(
        data.children.is_none(),
        "named lexical declaration fields should not spill into $other"
    );

    let kind = fields.get("kind").expect("kind field");
    let declarators = fields.get("declarators").expect("declarators field");
    let semicolon = fields.get("semicolon").expect("semicolon field");

    assert!(matches!(declarators, FieldValue::Single(_)));
    assert!(matches!(semicolon, FieldValue::Single(_)));

    match kind {
        FieldValue::Single(node) => assert_eq!(node.type_, CONST),
        other => panic!("expected single kind field, got {other:?}"),
    }

    match semicolon {
        FieldValue::Single(node) => assert_eq!(node.type_, SEMI),
        other => panic!("expected single semicolon field, got {other:?}"),
    }
}

/// A multi-bucket parent (member routes split across `name` and
/// `enum_assignment`) must stamp `$slotOrder` so the wrap layer can
/// interleave the per-route buckets back into document order — the
/// buckets alone cannot express cross-route order once leaf members
/// scalarize on the wire.
#[test]
fn typescript_enum_body_elements_stamps_slot_order() {
    let source = "enum T {\n    A,\n    'B',\n    'C' = 3,\n    D = 10,\n    E\n}";
    let mut parser = Parser::new();
    parser
        .set_language(&sittir_typescript::language())
        .expect("set_language");
    let tree = parser.parse(source, None).expect("parse");

    let mut elements = None;
    let mut stack = vec![tree.root_node()];
    while let Some(node) = stack.pop() {
        if node.kind() == "enum_body_elements" {
            elements = Some(node);
            break;
        }
        let mut cursor = node.walk();
        let children: Vec<_> = node.children(&mut cursor).collect();
        stack.extend(children);
    }
    let elements = elements.expect("enum_body_elements node");

    let data = read_node(&tree, source, Some(elements), Some(0));
    let fields = data.fields.as_ref().expect("named fields");
    assert!(fields.len() >= 2, "expected multi-bucket parent, got {fields:?}");

    let order = data.slot_order.as_ref().expect("$slotOrder on multi-bucket parent");
    assert_eq!(
        order,
        &["name", "name", "enum_assignment", "enum_assignment", "name"],
        "slot order must record member routes in document order"
    );

    // Single-bucket parents stay clean: the lexical_declaration read in the
    // test above has multiple DISTINCT singular fields — order still stamps
    // there. A leaf has no fields at all and must not carry the key.
    let leaf = read_node(
        &tree,
        source,
        Some(elements.child(0).expect("first member")),
        Some(0),
    );
    assert!(leaf.slot_order.is_none(), "leaf must not stamp $slotOrder");
}
