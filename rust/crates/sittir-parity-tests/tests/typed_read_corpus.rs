use sittir_core::read::{read_at, Depth, ReadCtx, ReadError, ReadRoot};
use sittir_core::SlotValue;
use sittir_rust::render::kind_ids;
use sittir_rust::render::node::{ArgumentsNode, FunctionItemNode, ParametersElementsNodeSlot, ParametersNode, SourceFileNode, StatementNode};
use sittir_rust::render::{AnyNode, RenderRoot};

fn parse(source: &str) -> tree_sitter::Tree {
    let mut parser = tree_sitter::Parser::new();
    parser.set_language(&sittir_rust::language()).unwrap();
    parser.parse(source, None).unwrap()
}

fn probe_input(name: &str) -> String {
    let path = format!(
        "{}/../../../docs/superpowers/probes/2026-10-01-shared-arena/transport/inputs/{name}",
        env!("CARGO_MANIFEST_DIR")
    );
    std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("{path}: {e}"))
}

fn root(tree: &tree_sitter::Tree, source: &str, depth: Depth) -> SourceFileNode {
    let ctx = ReadCtx::new(source, sittir_core::types::TreeId(1), <sittir_rust::render::AnyNode as sittir_core::read::ReadNode>::shows);
    match RenderRoot::read_root(&mut tree.walk(), &ctx, depth).unwrap() {
        SlotValue::Node(AnyNode::SourceFile(file)) => file,
        other => panic!("not a source file: {other:?}"),
    }
}

#[test]
fn one_level_leaves_every_statement_with_structure_a_coordinate() {
    for name in ["engine.rs", "spacing.rs"] {
        let source = probe_input(name);
        let file = root(&parse(&source), &source, Depth::ONE);
        let statements = file.statements;
        assert!(!statements.is_empty());
        assert!(statements.iter().all(|s| s.coord().is_some()), "{name}: every statement is past one level");
    }
}

#[test]
fn every_statement_read_at_its_row_equals_the_statement_in_the_whole_read() {
    for name in ["engine.rs", "spacing.rs"] {
        let source = probe_input(name);
        let tree = parse(&source);
        let ctx = ReadCtx::new(&source, sittir_core::types::TreeId(1), <sittir_rust::render::AnyNode as sittir_core::read::ReadNode>::shows);
        let whole = root(&tree, &source, Depth::All).statements;
        let shallow = root(&tree, &source, Depth::ONE).statements;
        assert_eq!(whole.len(), shallow.len());
        for (i, (whole, shallow)) in whole.iter().zip(&shallow).enumerate() {
            let index = shallow.coord().unwrap().index;
            let at: StatementNode = read_at::<StatementNode>(&mut tree.walk(), &ctx, index, Depth::All).unwrap();
            assert_eq!(Some(&at), whole.node(), "{name}: statement {i} at index {index}");
        }
    }
}

#[test]
fn every_read_node_names_its_own_node() {
    for name in ["engine.rs", "spacing.rs"] {
        let source = probe_input(name);
        let tree = parse(&source);
        let ctx = ReadCtx::new(&source, sittir_core::types::TreeId(1), <sittir_rust::render::AnyNode as sittir_core::read::ReadNode>::shows);
        let file = root(&tree, &source, Depth::ONE);
        let at = file.layout.as_ref().and_then(|layout| layout.at.as_ref()).expect("the root names itself");
        assert_eq!((at.tree, at.index, at.span.start, at.span.end), (sittir_core::types::TreeId(1), sittir_core::types::NodeIndex::ROOT, 0, source.len() as u32));
        let functions = file.statements.into_iter().filter_map(|s| s.coord().cloned()).filter(|c| c.kind == Some(kind_ids::FUNCTION_ITEM));
        for coord in functions {
            let read: FunctionItemNode = read_at::<FunctionItemNode>(&mut tree.walk(), &ctx, coord.index, Depth::ONE).unwrap();
            let at = read.layout.as_ref().and_then(|layout| layout.at.as_ref()).expect("a read function names itself");
            assert_eq!((at.tree, at.index, at.span, at.kind), (coord.tree, coord.index, coord.span, coord.kind), "{name}");
        }
    }
}

#[test]
fn a_list_owner_read_at_one_level_brings_its_list() {
    let source = "fn f() { g(a, b); }";
    let tree = parse(source);
    let ctx = ReadCtx::new(source, sittir_core::types::TreeId(1), <sittir_rust::render::AnyNode as sittir_core::read::ReadNode>::shows);
    let index = first_of(&tree, kind_ids::ARGUMENTS);
    let arguments: ArgumentsNode = read_at::<_>(&mut tree.walk(), &ctx, index, Depth::ONE).unwrap();
    let list = arguments.elements.unwrap();
    let list = list.node().expect("min_depth reads the list");
    assert_eq!(list.item.len(), 2);
}

#[test]
fn a_parameter_branch_reads_its_ordinary_list_variant() {
    let source = "fn f(a: u8, b: u8) {}";
    let tree = parse(source);
    let ctx = ReadCtx::new(source, sittir_core::types::TreeId(1), <sittir_rust::render::AnyNode as sittir_core::read::ReadNode>::shows);
    let index = first_of(&tree, kind_ids::PARAMETERS);
    let parameters: ParametersNode = read_at::<_>(&mut tree.walk(), &ctx, index, Depth::All).unwrap();
    let list = parameters.elements.unwrap();
    let ParametersElementsNodeSlot::ParametersElements(list) = list.node().expect("the whole read brings the list").as_ref() else {
        panic!("expected the ordinary parameter list");
    };
    assert_eq!(list.item.len(), 2);
}

/// The index of the first node of kind `kind` in `tree`.
fn first_of(tree: &tree_sitter::Tree, kind: sittir_core::KindId) -> sittir_core::types::NodeIndex {
    let mut cursor = tree.walk();
    (0..tree.root_node().descendant_count() as u32)
        .map(sittir_core::types::NodeIndex::new)
        .find(|&i| {
            sittir_core::read::goto(&mut cursor, i);
            sittir_core::read::grammar_id(&cursor.node()) == kind
        })
        .unwrap()
}

#[test]
fn a_struct_refuses_a_node_its_kind_does_not_admit() {
    let source = "fn f(a: u8) {}";
    let tree = parse(source);
    let ctx = ReadCtx::new(source, sittir_core::types::TreeId(1), <sittir_rust::render::AnyNode as sittir_core::read::ReadNode>::shows);
    let index = first_of(&tree, kind_ids::FUNCTION_ITEM);
    let refusal = read_at::<ParametersNode>(&mut tree.walk(), &ctx, index, Depth::ONE).unwrap_err();
    assert_eq!(refusal, ReadError::Unadmitted { kind: kind_ids::FUNCTION_ITEM, index });
}

#[test]
fn sittir_core_holds_no_grammar_fact() {
    let dir = env!("CARGO_MANIFEST_DIR");
    let read = std::fs::read_to_string(format!("{dir}/../sittir-core/src/read.rs")).unwrap();
    let macros = std::fs::read_to_string(format!("{dir}/../sittir-node-macros/src/expand.rs")).unwrap();
    for (file, text) in [("read.rs", &read), ("expand.rs", &macros)] {
        assert!(!text.contains("kind_ids") && !text.contains("field_ids"), "{file} names a grammar's id tables");
        assert!(!text.contains("sittir_rust") && !text.contains("sittir_typescript") && !text.contains("sittir_python"), "{file} names a grammar crate");
    }
}
