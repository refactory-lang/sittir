use sittir_core::read::{place, survey, Child, Entry, ReadCtx, Route, Sides};
use sittir_core::read_untyped_node::{read_untyped_node, NoMint, ReadDepth, ReadModel};
use sittir_core::types::{FieldValue, KindId, UntypedNode};
use std::collections::BTreeSet;

/// One extra's placement: its owner's span, its position (`leading`,
/// `trailing` or `inner:<key>`), its own span, `same_line`, `tokens_between`.
type Placed = BTreeSet<(u32, u32, String, u32, u32, bool, u16)>;

fn parse(language: &tree_sitter::Language, source: &str) -> tree_sitter::Tree {
    let mut parser = tree_sitter::Parser::new();
    parser.set_language(language).unwrap();
    parser.parse(source, None).unwrap()
}

/// Every extra's placement in today's deep read.
fn today(source: &str, language: &tree_sitter::Language, model: &dyn ReadModel) -> Placed {
    let tree = parse(language, source);
    let root = read_untyped_node(&tree, source, None, None, ReadDepth::Deep, model, &mut NoMint);
    let mut placed = Placed::new();
    fn visit(node: &UntypedNode, placed: &mut Placed) {
        let span = node.span.expect("a read node has a span");
        if let Some(trivia) = &node.trivia_data {
            let mut add = |position: String, entries: &[UntypedNode]| {
                for e in entries {
                    let s = e.span.expect("an extra has a span");
                    placed.insert((span.start, span.end, position.clone(), s.start, s.end, e.same_line, e.tokens_between));
                }
            };
            add("leading".into(), trivia.leading.as_deref().unwrap_or_default());
            add("trailing".into(), trivia.trailing.as_deref().unwrap_or_default());
            for (key, entries) in trivia.inner.iter().flatten() {
                add(format!("inner:{key}"), entries);
            }
        }
        for value in node.fields.iter().flat_map(|fields| fields.values()) {
            match value {
                FieldValue::Single(child) => visit(child, placed),
                FieldValue::Multiple(children) => children.iter().flatten().for_each(|child| visit(child, placed)),
                FieldValue::Text(_) | FieldValue::Bool(_) => {}
            }
        }
        for child in node.children.iter().flatten() {
            visit(child, placed);
        }
    }
    visit(&root, &mut placed);
    placed
}

/// The same placements from `place`, owners decided by today's model rows.
fn typed(source: &str, language: &tree_sitter::Language, model: &dyn ReadModel, gap: fn(u16) -> Option<&'static str>) -> Placed {
    let tree = parse(language, source);
    let ctx = ReadCtx::new(source, 0);
    let mut placed = Placed::new();
    walk(&mut tree.walk(), &ctx, language, model, gap, (0, source.len() as u32), Sides::root(), &mut placed);
    placed
}

// `place` takes a plain `fn` for the inner gaps and `inner_gap_key` needs the
// node's kind, so the driver sets the kind here before each `place` call.
thread_local!(static KIND: std::cell::Cell<KindId> = const { std::cell::Cell::new(KindId(0)) });

fn rust_gap(preceding: u16) -> Option<&'static str> {
    KIND.with(|k| sittir_rust::render::kind_ids::inner_gap_key(k.get(), preceding))
}

fn typescript_gap(preceding: u16) -> Option<&'static str> {
    KIND.with(|k| sittir_typescript::render::kind_ids::inner_gap_key(k.get(), preceding))
}

/// Place the extras among the children of the node the cursor is on, record
/// them under `span`, and recurse into each non-trivia child with its sides.
#[allow(clippy::too_many_arguments)]
fn walk(
    cursor: &mut tree_sitter::TreeCursor<'_>,
    ctx: &ReadCtx<'_>,
    language: &tree_sitter::Language,
    model: &dyn ReadModel,
    gap: fn(u16) -> Option<&'static str>,
    span: (u32, u32),
    sides: Sides,
    placed: &mut Placed,
) {
    let kind = KindId(cursor.node().grammar_id());
    let children = survey(cursor);
    let routes: Vec<Route> = children
        .iter()
        .map(|c: &Child| {
            if c.trivia {
                Route::Trivia
            } else if c.named {
                let field = c.field.and_then(|f| language.field_name_for_id(f.0));
                Route::Slot { slot: 0, scalar: model.stores_scalar(kind, field, c.grammar) }
            } else {
                Route::Layout
            }
        })
        .collect();
    KIND.with(|k| k.set(kind));
    let mut placement = place(ctx, &children, &routes, sides.owner, gap);
    let mut record = |position: &str, entries: &[Entry]| {
        for e in entries {
            placed.insert((span.0, span.1, position.to_string(), e.coord.span.start, e.coord.span.end, e.same_line, e.tokens_between));
        }
    };
    record("leading", &sides.leading);
    record("trailing", &sides.trailing);
    record("leading", &placement.own_leading);
    record("trailing", &placement.own_trailing);
    for (key, entries) in &placement.inner {
        record(&format!("inner:{key}"), entries);
    }
    if cursor.goto_first_child() {
        let mut i = 0;
        loop {
            if !children[i].trivia {
                let child_span = (children[i].start, children[i].end);
                walk(cursor, ctx, language, model, gap, child_span, placement.take(i), placed);
            }
            i += 1;
            if !cursor.goto_next_sibling() {
                break;
            }
        }
        cursor.goto_parent();
    }
}

fn probe_input(name: &str) -> String {
    let path = format!(
        "{}/../../../docs/superpowers/probes/2026-10-01-shared-arena/transport/inputs/{name}",
        env!("CARGO_MANIFEST_DIR")
    );
    std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("{path}: {e}"))
}

/// Every placement only one side made, all of them, with their counts.
fn assert_same_placement(typed: &Placed, today: &Placed, input: &str) {
    let only_typed: Vec<_> = typed.difference(today).collect();
    let only_today: Vec<_> = today.difference(typed).collect();
    assert!(
        only_typed.is_empty() && only_today.is_empty(),
        "{input}: {} placed only by the reader {only_typed:?}; {} only by today's read {only_today:?}",
        only_typed.len(),
        only_today.len()
    );
}

#[test]
fn placement_matches_todays_read_on_the_rust_probe_inputs() {
    let language = sittir_rust::language();
    let model = sittir_rust::RustGrammar;
    for name in ["engine.rs", "spacing.rs"] {
        let source = probe_input(name);
        assert_same_placement(&typed(&source, &language, &model, rust_gap), &today(&source, &language, &model), name);
    }
}

#[test]
fn placement_matches_todays_read_on_the_typescript_probe_input() {
    let language = sittir_typescript::language();
    let model = sittir_typescript::TypeScriptGrammar;
    let source = probe_input("create-engine.ts");
    assert_same_placement(&typed(&source, &language, &model, typescript_gap), &today(&source, &language, &model), "create-engine.ts");
}

use sittir_core::read::{Depth, ReadError, ReadTransport};
use sittir_core::{SlotValue, Transport};
use sittir_rust::render::{field_ids as field, kind_ids as kind};
use sittir_typescript::render::kind_ids as ts;

type Layout = Option<sittir_core::layout::TransportLayout<()>>;

#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(kind = kind::IDENTIFIER, text)]
struct Ident {
    layout: Option<sittir_core::layout::TransportLayout<()>>,
    text: String,
}

#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(kind = kind::PARAMETERS, layout = [kind::LPAREN, kind::RPAREN])]
struct Params {
    layout: Option<sittir_core::layout::TransportLayout<()>>,
}

#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(kind = kind::BLOCK, layout = [kind::LBRACE, kind::RBRACE], gap(1) = statements)]
struct Block {
    layout: Option<sittir_core::layout::TransportLayout<()>>,
    #[slot(field = field::STATEMENTS)]
    statements: Option<Vec<SlotValue<Function>>>,
}

#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(kind = kind::FUNCTION_ITEM, layout = [kind::FN_KEYWORD])]
struct Function {
    layout: Option<sittir_core::layout::TransportLayout<()>>,
    #[slot(field = field::NAME)]
    name: SlotValue<Ident>,
    #[slot(field = field::PARAMETERS)]
    parameters: SlotValue<Params>,
    #[slot(field = field::BODY)]
    body: SlotValue<Box<Block>>,
}

/// `Function` with no route for its body: every function is refused.
#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(kind = kind::FUNCTION_ITEM, layout = [kind::FN_KEYWORD])]
struct FunctionWithoutBody {
    layout: Option<sittir_core::layout::TransportLayout<()>>,
    #[slot(field = field::NAME)]
    name: SlotValue<Ident>,
    #[slot(field = field::PARAMETERS)]
    parameters: SlotValue<Params>,
}

#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(kind = kind::SOURCE_FILE, gap(0) = statements)]
struct File {
    layout: Option<sittir_core::layout::TransportLayout<()>>,
    #[slot(field = field::STATEMENTS)]
    statements: Option<Vec<SlotValue<Function>>>,
}

/// A zero-width node read as a text leaf: its span is empty, so it reads as its fixed text.
#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(kind = ts::_AUTOMATIC_SEMICOLON, text = ";")]
struct Inserted {
    layout: Option<sittir_core::layout::TransportLayout<()>>,
    text: String,
}

fn parse_rust(source: &str) -> tree_sitter::Tree {
    parse(&sittir_rust::language(), source)
}

/// Read the tree's root into `T`, as tree 7.
fn read<T: ReadTransport>(tree: &tree_sitter::Tree, source: &str, depth: Depth) -> Result<T, ReadError> {
    T::read(&mut tree.walk(), &ReadCtx::new(source, 7), depth, Sides::root())
}

/// A cursor on the `nth` node of grammar kind `kind`, in pre-order.
fn find(tree: &tree_sitter::Tree, kind: KindId, nth: usize) -> tree_sitter::TreeCursor<'_> {
    let mut cursor = tree.walk();
    let mut seen = 0;
    for row in 0..tree.root_node().descendant_count() {
        cursor.goto_descendant(row);
        if cursor.node().grammar_id() == kind.0 {
            if seen == nth {
                return cursor;
            }
            seen += 1;
        }
    }
    panic!("no node {nth} of kind {kind:?}");
}

/// Read the `nth` node of kind `kind` into `T`, as tree 7, as an owner no parent placed trivia on.
fn read_nth<T: ReadTransport>(
    tree: &tree_sitter::Tree,
    source: &str,
    kind: KindId,
    nth: usize,
    depth: Depth,
) -> Result<T, ReadError> {
    T::read(&mut find(tree, kind, nth), &ReadCtx::new(source, 7), depth, Sides::root())
}

fn function(file: &File, i: usize) -> &Function {
    file.statements.as_ref().unwrap()[i].transport().expect("read within the depth")
}

/// One side's entries, or one inner gap's, as (start, end, same_line, tokens_between).
fn trivia_spans(layout: &Layout, side: &str) -> Vec<(u32, u32, bool, u16)> {
    let trivia = layout.as_ref().and_then(|l| l.trivia.as_ref());
    let entries = match side {
        "leading" => trivia.and_then(|t| t.leading.clone()),
        "trailing" => trivia.and_then(|t| t.trailing.clone()),
        key => trivia.and_then(|t| t.inner.as_ref()?.get(key).cloned()),
    };
    entries
        .unwrap_or_default()
        .iter()
        .map(|e| {
            let c = e.value.coord().expect("trivia is a coordinate");
            (c.span.start, c.span.end, e.same_line, e.tokens_between)
        })
        .collect()
}

#[test]
fn a_function_reads_into_its_slots_with_its_layout_tokens_skipped() {
    let source = "fn f() {}";
    let file: File = read(&parse_rust(source), source, Depth::All).unwrap();
    let f = function(&file, 0);
    assert_eq!(f.name.transport().unwrap().text, "f");
    assert_eq!(f.body.transport().unwrap().statements, Some(vec![]));
    assert_eq!((&f.layout, &file.layout), (&None, &None));
}

#[test]
fn a_child_no_route_takes_refuses_the_read_naming_kind_child_and_row() {
    let source = "fn f() {}";
    let tree = parse_rust(source);
    let refused = read_nth::<FunctionWithoutBody>(&tree, source, kind::FUNCTION_ITEM, 0, Depth::All).unwrap_err();
    let ReadError::Unrouted { kind: parent, child, row } = refused else { panic!("{refused:?}") };
    assert_eq!((parent, child), (kind::FUNCTION_ITEM, kind::BLOCK));
    let mut at = tree.walk();
    at.goto_descendant(row as usize);
    assert_eq!(at.node().grammar_id(), kind::BLOCK.0);
}

#[test]
fn past_the_depth_a_child_with_structure_is_its_coordinate() {
    let source = "fn f() { fn g() {} }";
    let tree = parse_rust(source);
    let shallow: File = read(&tree, source, Depth::ONE).unwrap();
    let coord = shallow.statements.as_ref().unwrap()[0].coord().expect("a coordinate at depth one");
    assert_eq!((coord.span.start, coord.span.end, coord.kind), (0, 20, Some(kind::FUNCTION_ITEM)));
    assert_eq!(coord.tree_id(), 7);
    let two: File = read(&tree, source, Depth::Levels(std::num::NonZeroU32::new(2).unwrap())).unwrap();
    let f = function(&two, 0);
    assert_eq!(f.name.transport().unwrap().text, "f", "a leaf is inline");
    assert!(f.body.coord().is_some(), "a block holding a function is past the depth");
}

#[test]
fn comments_take_their_owners_by_the_placement_rule() {
    // rust's line_comment ends before its newline: `// a` is 0..4, `// b` is 15..19
    let source = "// a\nfn f() {} // b\n";
    let file: File = read(&parse_rust(source), source, Depth::All).unwrap();
    let f = function(&file, 0);
    assert_eq!(trivia_spans(&f.layout, "leading"), vec![(0, 4, false, 0)]);
    assert_eq!(trivia_spans(&f.layout, "trailing"), vec![(15, 19, true, 0)]);
}

#[test]
fn a_comment_in_an_empty_block_takes_the_blocks_inner_gap() {
    let source = "fn f() { /* c */ }";
    let file: File = read(&parse_rust(source), source, Depth::All).unwrap();
    let block = function(&file, 0).body.transport().unwrap();
    assert_eq!(trivia_spans(&block.layout, "statements"), vec![(9, 16, false, 0)]);
}

#[test]
fn a_file_of_comments_keeps_them_in_its_own_gap() {
    let source = "// only\n";
    let file: File = read(&parse_rust(source), source, Depth::All).unwrap();
    assert_eq!(file.statements, Some(vec![]));
    assert_eq!(trivia_spans(&file.layout, "statements"), vec![(0, 7, false, 0)]);
}

#[test]
fn an_error_inside_a_node_is_trivia() {
    let source = "fn f() { @ }";
    let file: File = read(&parse_rust(source), source, Depth::All).unwrap();
    let block = function(&file, 0).body.transport().unwrap();
    let inner = block.layout.as_ref().unwrap().trivia.as_ref().unwrap().inner.as_ref().unwrap();
    assert_eq!(inner["statements"][0].value.coord().unwrap().kind, Some(kind::ERROR));
}

#[test]
fn a_missing_token_routes_as_its_kind() {
    // the parser closes the parameters with a zero-width MISSING `)`, one of their layout tokens
    let source = "fn f( {}";
    let tree = parse_rust(source);
    assert!(find(&tree, kind::RPAREN, 0).node().is_missing());
    let file: File = read(&tree, source, Depth::All).unwrap();
    assert_eq!(function(&file, 0).parameters.transport().unwrap().layout, None);
}

#[test]
fn a_text_leaf_that_spans_nothing_reads_as_its_fixed_text() {
    let source = "let x = 1\n";
    let tree = parse(&sittir_typescript::language(), source);
    let inserted: Inserted = read_nth(&tree, source, ts::_AUTOMATIC_SEMICOLON, 0, Depth::ONE).unwrap();
    assert_eq!(inserted.text, ";");
}
