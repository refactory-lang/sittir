use sittir_core::read_node::{read_node, ReadDepth};
use sittir_core::types::FieldValue;
use sittir_typescript::render::{CONST_KEYWORD, LEXICAL_DECLARATION, SEMI};
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

    let data = read_node(&tree, source, Some(node), Some(0), ReadDepth::Shallow, &sittir_typescript::TypeScriptGrammar);
    let fields = data.fields.expect("named fields");

    assert_eq!(data.type_, LEXICAL_DECLARATION);
    assert!(
        data.children.is_none(),
        "named lexical declaration fields should not spill into $other"
    );

    let kind = fields.get("kind").expect("kind field");
    let declarators = fields.get("declarators").expect("declarators field");
    let terminator = fields.get("terminator").expect("terminator field");

    assert!(matches!(declarators, FieldValue::Single(_)));
    assert!(matches!(terminator, FieldValue::Single(_)));

    match kind {
        FieldValue::Single(node) => assert_eq!(node.type_, CONST_KEYWORD),
        other => panic!("expected single kind field, got {other:?}"),
    }

    match terminator {
        FieldValue::Single(node) => assert_eq!(node.type_, SEMI),
        other => panic!("expected single terminator field, got {other:?}"),
    }
}

/// The reader keys every member by its model slot: the `name`-tagged members
/// and the untagged `enum_assignment` members all land in `content`, one
/// bucket in document order, so no `$slotOrder` is needed to interleave them.
#[test]
fn typescript_enum_body_elements_reads_members_into_one_slot() {
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

    let data = read_node(&tree, source, Some(elements), Some(0), ReadDepth::Shallow, &sittir_typescript::TypeScriptGrammar);
    let fields = data.fields.as_ref().expect("named fields");
    assert_eq!(fields.keys().collect::<Vec<_>>(), vec!["content"]);
    let members = match &fields["content"] {
        FieldValue::Multiple(members) => members,
        other => panic!("expected the members as one list, got {other:?}"),
    };
    let starts: Vec<_> = members
        .iter()
        .map(|m| m.as_ref().and_then(|m| m.span.as_ref()).map(|s| s.start))
        .collect();
    assert_eq!(starts, vec![Some(13), Some(20), Some(29), Some(42), Some(54)]);
    assert!(data.slot_order.is_none(), "a single-bucket parent must not stamp $slotOrder");

    // A leaf has no fields at all and must not carry the key.
    let leaf = read_node(
        &tree,
        source,
        Some(elements.child(0).expect("first member")),
        Some(0),
        ReadDepth::Shallow,
        &sittir_typescript::TypeScriptGrammar,
    );
    assert!(leaf.slot_order.is_none(), "leaf must not stamp $slotOrder");
}
