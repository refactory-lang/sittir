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
