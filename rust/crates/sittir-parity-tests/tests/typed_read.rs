use sittir_core::read::{Depth, ReadCtx, ReadError, ReadTransport, SideEntry, SideLookup, DEBUG_READ_CHECKS};
use sittir_core::types::KindId;

fn parse(language: &tree_sitter::Language, source: &str) -> tree_sitter::Tree {
    let mut parser = tree_sitter::Parser::new();
    parser.set_language(language).unwrap();
    parser.parse(source, None).unwrap()
}
use sittir_core::{SlotValue, Transport};
use sittir_rust::render::{field_ids as field, kind_ids as kind};
use sittir_typescript::render::kind_ids as ts;

type Layout = Option<Box<sittir_core::layout::TransportLayout<()>>>;

#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(kind = kind::IDENTIFIER, text)]
struct Ident {
    #[wire(key = "$_layout")]
    layout: Option<Box<sittir_core::layout::TransportLayout<()>>>,
    #[wire(key = "$text")]
    text: String,
}

#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(kind = kind::PARAMETERS, layout = [kind::LPAREN, kind::RPAREN])]
struct Params {
    #[wire(key = "$_layout")]
    layout: Option<Box<sittir_core::layout::TransportLayout<()>>>,
}

#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(kind = kind::BLOCK, layout = [kind::LBRACE, kind::RBRACE])]
struct Block {
    #[wire(key = "$_layout")]
    layout: Option<Box<sittir_core::layout::TransportLayout<()>>>,
    #[wire(key = "_statements")]
    #[slot(field = field::STATEMENTS)]
    statements: Vec<SlotValue<Function>>,
}

#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(kind = kind::FUNCTION_ITEM, layout = [kind::FN_KEYWORD])]
struct Function {
    #[wire(key = "$_layout")]
    layout: Option<Box<sittir_core::layout::TransportLayout<()>>>,
    #[wire(key = "_name")]
    #[slot(field = field::NAME)]
    name: SlotValue<Ident>,
    #[wire(key = "_parameters")]
    #[slot(field = field::PARAMETERS)]
    parameters: SlotValue<Params>,
    #[wire(key = "_body")]
    #[slot(field = field::BODY)]
    body: SlotValue<Box<Block>>,
}

/// `Function` with no route for its body: debug routing diagnoses the gap.
#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(kind = kind::FUNCTION_ITEM, layout = [kind::FN_KEYWORD])]
struct FunctionWithoutBody {
    #[wire(key = "$_layout")]
    layout: Option<Box<sittir_core::layout::TransportLayout<()>>>,
    #[wire(key = "_name")]
    #[slot(field = field::NAME)]
    name: SlotValue<Ident>,
    #[wire(key = "_parameters")]
    #[slot(field = field::PARAMETERS)]
    parameters: SlotValue<Params>,
}

#[derive(Debug, Transport)]
#[transport(kind = kind::PARAMETERS)]
struct ParamsWithoutTokenList {
    #[wire(key = "$_layout")]
    layout: Option<Box<sittir_core::layout::TransportLayout<()>>>,
}

#[derive(Debug, Transport)]
#[transport(kind = kind::SOURCE_FILE)]
struct OneFunction {
    #[wire(key = "$_layout")]
    layout: Option<Box<sittir_core::layout::TransportLayout<()>>>,
    #[wire(key = "_statement")]
    #[slot(field = field::STATEMENTS)]
    statement: SlotValue<Function>,
}

#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(kind = kind::SOURCE_FILE)]
struct File {
    #[wire(key = "$_layout")]
    layout: Option<Box<sittir_core::layout::TransportLayout<()>>>,
    #[wire(key = "_statements")]
    #[slot(field = field::STATEMENTS)]
    statements: Vec<SlotValue<Function>>,
}

/// A zero-width node read as a text leaf: its span is empty, so it reads as its fixed text.
#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(kind = ts::_AUTOMATIC_SEMICOLON, text = ";")]
struct Inserted {
    #[wire(key = "$_layout")]
    layout: Option<Box<sittir_core::layout::TransportLayout<()>>>,
    #[wire(key = "$text")]
    text: String,
}

fn parse_rust(source: &str) -> tree_sitter::Tree {
    parse(&sittir_rust::language(), source)
}

/// Read the tree's root into `T`, as tree 7, seating no sides.
fn read<T: ReadTransport>(tree: &tree_sitter::Tree, source: &str, depth: Depth) -> Result<T, ReadError> {
    T::read(&mut tree.walk(), &ReadCtx::new(source, 7, T::shows), depth)
}

/// A tree's trivia table as a read's side lookup, each entry as a parsed
/// tree gives it with `()` for the trivia type: an extra or an `ERROR` as its
/// coordinate, a layout run as `()`.
struct Table<'t> {
    tree: &'t tree_sitter::Tree,
    source: &'t str,
    table: sittir_core::trivia_table::TriviaTable,
}

impl<'t> Table<'t> {
    /// The table of a rust `tree`.
    fn of(tree: &'t tree_sitter::Tree, source: &'t str) -> Self {
        Table { tree, source, table: sittir_core::trivia_table::TriviaTable::assign(tree, source, kind::SURFACE_KINDS, 4) }
    }
}

impl SideLookup for Table<'_> {
    fn side(&self, index: u32, side: sittir_core::trivia_table::TriviaSide, edge_changed: bool) -> Box<dyn std::any::Any> {
        use sittir_core::trivia_table::Assigned;
        let ctx = ReadCtx::new(self.source, 7, |_| false);
        let source = |at: u32| {
            let node = sittir_core::engine::node_at_index(self.tree, at)?;
            let coord = ctx.coordinate(&node, at);
            Some(SideEntry::Source { kind: coord.kind?, span: coord.span, adjacent: None, entry: sittir_core::trivia::TriviaEntry::new(SlotValue::Coord(coord)) })
        };
        let mut entries: Vec<SideEntry<()>> = self
            .table
            .side(index, side)
            .iter()
            .filter_map(|assigned| match *assigned {
                Assigned::Extra(at) | Assigned::Error(at) => source(at),
                Assigned::Layout { start, end, .. } if !self.source[start as usize..end as usize].contains('\n') => None,
                Assigned::Layout { .. } | Assigned::Member(_) | Assigned::Depth(_) => Some(SideEntry::Layout(sittir_core::trivia::TriviaEntry::new(SlotValue::Transport(())))),
            })
            .collect();
        if edge_changed {
            sittir_core::trivia::without_edge_runs(&mut entries, side, |entry| matches!(entry, SideEntry::Layout(_)));
        }
        Box::new(entries)
    }
}

/// Read the `nth` node of kind `kind` into `T`, as tree 7, seating its sides from the tree's table.
fn read_seated<T: ReadTransport>(source: &str, kind: KindId, nth: usize, depth: Depth) -> Result<T, ReadError> {
    let tree = parse(&sittir_rust::language(), source);
    let table = Table::of(&tree, source);
    let read = T::read(&mut find(&tree, kind, nth), &ReadCtx::new(source, 7, T::shows).with_sides(&table), depth);
    read
}

/// A cursor on the `nth` node of grammar kind `kind`, in pre-order.
fn find(tree: &tree_sitter::Tree, kind: KindId, nth: usize) -> tree_sitter::TreeCursor<'_> {
    let mut cursor = tree.walk();
    let mut seen = 0;
    for index in 0..tree.root_node().descendant_count() {
        cursor.goto_descendant(index);
        if sittir_core::read::grammar_id(&cursor.node()) == kind {
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
    T::read(&mut find(tree, kind, nth), &ReadCtx::new(source, 7, T::shows), depth)
}

/// What the read placed on a node beside its own coordinate, which every read
/// node names: `None` when it placed nothing.
fn placed(layout: &Layout) -> Option<sittir_core::layout::TransportLayout<()>> {
    let mut layout = (**layout.as_ref().expect("a read node names itself")).clone();
    assert!(layout.at.take().is_some(), "a read node names itself");
    (layout != sittir_core::layout::TransportLayout::default()).then_some(layout)
}

fn function(file: &File, i: usize) -> &Function {
    file.statements[i].transport().expect("read within the depth")
}

/// The spans of a side's extras and `ERROR`s, which a seated read gives as coordinates; its layout runs are left out.
fn trivia_spans(layout: &Layout, side: &str) -> Vec<(u32, u32)> {
    let trivia = layout.as_ref().and_then(|l| l.trivia.as_ref());
    let entries = match side {
        "leading" => trivia.and_then(|t| t.leading.clone()),
        "trailing" => trivia.and_then(|t| t.trailing.clone()),
        "inner" => trivia.and_then(|t| t.inner.clone()),
        other => panic!("{other} is not a trivia side"),
    };
    entries
        .unwrap_or_default()
        .iter()
        .filter_map(|e| e.value.coord().map(|c| (c.span.start, c.span.end)))
        .collect()
}

#[test]
fn a_function_reads_into_its_slots_with_its_layout_tokens_skipped() {
    let source = "fn f() {}";
    let file: File = read(&parse_rust(source), source, Depth::All).unwrap();
    let f = function(&file, 0);
    assert_eq!(f.name.transport().unwrap().text, "f");
    assert_eq!(f.body.transport().unwrap().statements, vec![]);
    assert_eq!((placed(&f.layout), placed(&file.layout)), (None, None));
}

#[test]
fn a_block_doc_comment_reads_whole_with_its_named_marker_skipped_as_layout() {
    for source in ["/** x */\nfn f() {}\n", "/*! x */\n"] {
        let tree = parse_rust(source);
        let comment = read_nth::<sittir_rust::render::transport::BlockCommentTransport>(&tree, source, kind::BLOCK_COMMENT, 0, Depth::All);
        assert!(comment.is_ok(), "{source:?}: {comment:?}");
    }
}

#[test]
fn a_child_no_route_takes_is_refused_only_with_debug_checks() {
    let source = "fn f() {}";
    let tree = parse_rust(source);
    let result = read_nth::<FunctionWithoutBody>(&tree, source, kind::FUNCTION_ITEM, 0, Depth::All);
    let mut cursor = tree.walk();
    assert!(cursor.goto_first_child());
    let routes = FunctionWithoutBody::routes(&mut cursor);
    if DEBUG_READ_CHECKS {
        let refused = result.unwrap_err();
        let ReadError::Unrouted { kind: parent, child, index } = refused else { panic!("{refused:?}") };
        assert_eq!((parent, child), (kind::FUNCTION_ITEM, kind::BLOCK));
        let mut at = tree.walk();
        at.goto_descendant(index as usize);
        assert_eq!(sittir_core::read::grammar_id(&at.node()), kind::BLOCK);
        assert!(routes.is_none());
    } else {
        let value = result.unwrap();
        assert_eq!(value.name.transport().unwrap().text, "f");
        assert!(value.parameters.transport().is_some());
        let routes = routes.unwrap();
        let body = routes.children.iter().position(|child| child.grammar == kind::BLOCK).unwrap();
        assert!(matches!(routes.routes[body], sittir_core::read::Route::Layout));
    }
}

#[test]
fn punctuation_without_token_metadata_is_checked_only_in_debug() {
    let source = "fn f() {}";
    let tree = parse_rust(source);
    let result = read_nth::<ParamsWithoutTokenList>(&tree, source, kind::PARAMETERS, 0, Depth::All);
    if DEBUG_READ_CHECKS {
        assert!(matches!(result, Err(ReadError::Unrouted { kind: parent, child, .. }) if parent == kind::PARAMETERS && child == kind::LPAREN));
    } else {
        result.unwrap();
    }
}

#[test]
fn a_missing_required_slot_is_refused_in_both_read_modes() {
    let source = "";
    let result = read_nth::<OneFunction>(&parse_rust(source), source, kind::SOURCE_FILE, 0, Depth::All);
    assert!(matches!(result, Err(ReadError::Missing { kind: parent, slot: "statement", .. }) if parent == kind::SOURCE_FILE));
}

#[test]
fn an_overfull_slot_is_refused_in_both_read_modes() {
    let source = "fn f() {} fn g() {}";
    let result = read_nth::<OneFunction>(&parse_rust(source), source, kind::SOURCE_FILE, 0, Depth::All);
    assert!(matches!(result, Err(ReadError::Overfull { kind: parent, slot: "statement", .. }) if parent == kind::SOURCE_FILE));
}

#[test]
fn a_required_slot_with_one_child_reads_in_both_modes() {
    let source = "fn f() {}";
    let value = read_nth::<OneFunction>(&parse_rust(source), source, kind::SOURCE_FILE, 0, Depth::All).unwrap();
    assert_eq!(value.statement.transport().unwrap().name.transport().unwrap().text, "f");
}

#[test]
fn past_the_depth_a_child_with_structure_is_its_coordinate() {
    let source = "fn f() { fn g() {} }";
    let tree = parse_rust(source);
    let shallow: File = read(&tree, source, Depth::ONE).unwrap();
    let coord = shallow.statements[0].coord().expect("a coordinate at depth one");
    assert_eq!((coord.span.start, coord.span.end, coord.kind), (0, 20, Some(kind::FUNCTION_ITEM)));
    assert_eq!(coord.tree, 7);
    let two: File = read(&tree, source, Depth::Levels(std::num::NonZeroU32::new(2).unwrap())).unwrap();
    let f = function(&two, 0);
    assert_eq!(f.name.transport().unwrap().text, "f", "a leaf is inline");
    assert!(f.body.coord().is_some(), "a block holding a function is past the depth");
}

#[test]
fn a_read_with_no_side_lookup_seats_nothing() {
    let source = "// a\nfn f() {} // b\n";
    let file: File = read(&parse_rust(source), source, Depth::All).unwrap();
    assert_eq!((placed(&function(&file, 0).layout), placed(&file.layout)), (None, None));
}

#[test]
fn a_seated_read_gives_each_node_the_sides_its_tree_assigns_it() {
    // rust's line_comment ends before its newline: `// a` is 0..4, `// b` is 15..19
    let source = "// a\nfn f() {} // b\n";
    let file: File = read_seated(source, kind::SOURCE_FILE, 0, Depth::All).unwrap();
    let f = function(&file, 0);
    assert_eq!(trivia_spans(&f.layout, "leading"), vec![(0, 4)]);
    assert_eq!(trivia_spans(&f.layout, "trailing"), vec![(15, 19)]);
}

#[test]
fn a_seated_read_gives_a_comment_in_an_empty_block_to_the_blocks_inner_side() {
    let source = "fn f() { /* c */ }";
    let file: File = read_seated(source, kind::SOURCE_FILE, 0, Depth::All).unwrap();
    let block = function(&file, 0).body.transport().unwrap();
    assert_eq!(trivia_spans(&block.layout, "inner"), vec![(9, 16)]);
}

#[test]
fn a_seated_read_gives_a_file_of_comments_to_its_inner_side() {
    let source = "// only\n";
    let file: File = read_seated(source, kind::SOURCE_FILE, 0, Depth::All).unwrap();
    assert_eq!(file.statements, vec![]);
    assert_eq!(trivia_spans(&file.layout, "inner"), vec![(0, 7)]);
}

#[test]
fn an_error_inside_a_node_is_trivia() {
    let source = "fn f() { @ }";
    let file: File = read_seated(source, kind::SOURCE_FILE, 0, Depth::All).unwrap();
    let block = function(&file, 0).body.transport().unwrap();
    let inner = block.layout.as_ref().unwrap().trivia.as_ref().unwrap().inner.as_ref().unwrap();
    assert_eq!(inner[0].value.coord().unwrap().kind, Some(kind::ERROR));
}

#[test]
fn a_missing_token_routes_as_its_kind() {
    // the parser closes the parameters with a zero-width MISSING `)`, one of their layout tokens
    let source = "fn f( {}";
    let tree = parse_rust(source);
    assert!(find(&tree, kind::RPAREN, 0).node().is_missing());
    let file: File = read(&tree, source, Depth::All).unwrap();
    assert_eq!(placed(&function(&file, 0).parameters.transport().unwrap().layout), None);
}

#[test]
fn a_text_leaf_that_spans_nothing_reads_as_its_fixed_text() {
    let source = "let x = 1\n";
    let tree = parse(&sittir_typescript::language(), source);
    let inserted: Inserted = read_nth(&tree, source, ts::_AUTOMATIC_SEMICOLON, 0, Depth::ONE).unwrap();
    assert_eq!(inserted.text, ";");
}

use sittir_python::render::kind_ids as py;
use sittir_typescript::render::field_ids as ts_field;

#[derive(Debug, Clone, Copy, PartialEq, Transport)]
#[transport(kind = kind::_PRIMITIVE_TYPE, spelled)]
enum Primitive {
    #[kind(kind::U8_KEYWORD)]
    U8,
    #[kind(kind::BOOL_KEYWORD)]
    Bool,
}

#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(choice)]
enum Type {
    #[kind(kind::NEVER_TYPE)]
    Never,
    #[kind(kind::_PRIMITIVE_TYPE, kind::U8_KEYWORD, kind::BOOL_KEYWORD)]
    Primitive(Primitive),
}

#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(kind = kind::FUNCTION_ITEM, layout = [kind::FN_KEYWORD, kind::DASH_GT])]
struct Typed {
    #[wire(key = "$_layout")]
    layout: Option<Box<sittir_core::layout::TransportLayout<()>>>,
    #[wire(key = "_name")]
    #[slot(field = field::NAME)]
    name: SlotValue<Ident>,
    #[wire(key = "_parameters")]
    #[slot(field = field::PARAMETERS)]
    parameters: SlotValue<Params>,
    #[wire(key = "_return_type")]
    #[slot(field = field::RETURN_TYPE)]
    return_type: Option<SlotValue<Type>>,
    #[wire(key = "_body")]
    #[slot(field = field::BODY)]
    body: SlotValue<Box<Block>>,
}

fn typed_function(source: &str) -> Result<Typed, ReadError> {
    read_nth(&parse_rust(source), source, kind::FUNCTION_ITEM, 0, Depth::All)
}

#[test]
fn a_unit_variant_stores_its_kind_and_an_enum_kind_reads_the_member_its_token_is() {
    assert_eq!(typed_function("fn f() -> ! {}").unwrap().return_type, Some(SlotValue::Transport(Type::Never)));
    assert_eq!(typed_function("fn f() -> u8 {}").unwrap().return_type, Some(SlotValue::Transport(Type::Primitive(Primitive::U8))));
    assert_eq!(typed_function("fn f() -> bool {}").unwrap().return_type, Some(SlotValue::Transport(Type::Primitive(Primitive::Bool))));
}

#[test]
fn an_enum_kind_whose_token_is_none_of_its_members_is_refused() {
    let err = typed_function("fn f() -> u16 {}").unwrap_err();
    assert!(matches!(err, ReadError::Unspelled { kind: refused, .. } if refused == kind::_PRIMITIVE_TYPE), "{err:?}");
}

#[derive(Debug, Clone, Copy, PartialEq, Transport)]
#[transport(kind = ts::PREDEFINED_TYPE, spelled)]
enum Predefined {
    #[kind(ts::SYMBOL_KEYWORD)]
    Symbol,
    #[kind(ts::UNIQUE)]
    UniqueSymbol,
}

#[test]
fn a_member_spelled_by_two_tokens_reads_as_the_id_both_display() {
    for (source, member) in [("declare const x: unique symbol;", Predefined::UniqueSymbol), ("declare const x: symbol;", Predefined::Symbol)] {
        let tree = parse(&sittir_typescript::language(), source);
        assert_eq!(read_nth::<Predefined>(&tree, source, ts::PREDEFINED_TYPE, 0, Depth::All).unwrap(), member, "{source}");
    }
}

/// Members `is` and `not` but not `is not`, whose node holds one token of each.
#[derive(Debug, Clone, Copy, PartialEq, Transport)]
#[transport(kind = py::_IS_NOT, spelled)]
enum IsOrNot {
    #[kind(py::IS_KEYWORD)]
    Is,
    #[kind(py::NOT_KEYWORD)]
    Not,
}

#[test]
fn a_node_whose_tokens_display_different_ids_is_none_of_its_members() {
    // read by its first token, `is not` would be `is`
    let source = "a is not b\n";
    let tree = parse(&sittir_python::language(), source);
    let err = read_nth::<IsOrNot>(&tree, source, py::_IS_NOT, 0, Depth::All).unwrap_err();
    assert!(matches!(err, ReadError::Unspelled { kind: refused, .. } if refused == py::_IS_NOT), "{err:?}");
}

#[test]
fn a_seated_read_keeps_a_unit_stored_child_past_its_depth_a_coordinate_whose_holder_frames_its_sides() {
    // `!` is stored as a unit and holds the comment on its line: a unit variant has no layout to carry it
    let source = "fn f() -> ! /* c */ {}";
    let tree = parse_rust(source);
    let table = Table::of(&tree, source);
    let never = find(&tree, kind::NEVER_TYPE, 0).descendant_index() as u32;
    let trailing = table.side(never, sittir_core::trivia_table::TriviaSide::Trailing, false).downcast::<Vec<SideEntry<()>>>().unwrap();
    assert!(matches!(trailing.as_slice(), [SideEntry::Source { span, .. }] if (span.start, span.end) == (12, 19)), "{trailing:?}");
    let f: Typed = read_seated(source, kind::FUNCTION_ITEM, 0, Depth::ONE).unwrap();
    assert!(f.return_type.as_ref().and_then(SlotValue::coord).is_some_and(|coord| coord.index == never));
    let parameters = find(&tree, kind::PARAMETERS, 0).descendant_index() as u32;
    let before = table.side(parameters, sittir_core::trivia_table::TriviaSide::Trailing, false).downcast::<Vec<SideEntry<()>>>().unwrap();
    assert!(before.is_empty(), "the comment does not trail the parameters: {before:?}");
}

#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(kind = ts::IDENTIFIER, text)]
struct TsIdent {
    #[wire(key = "$_layout")]
    layout: Option<Box<sittir_core::layout::TransportLayout<()>>>,
    #[wire(key = "$text")]
    text: String,
}

#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(kind = ts::NUMBER_DECIMAL, text)]
struct TsNumber {
    #[wire(key = "$_layout")]
    layout: Option<Box<sittir_core::layout::TransportLayout<()>>>,
    #[wire(key = "$text")]
    text: String,
}

#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(kind = ts::VARIABLE_DECLARATOR_PLAIN, layout = [ts::EQ])]
struct Declarator {
    #[wire(key = "$_layout")]
    layout: Option<Box<sittir_core::layout::TransportLayout<()>>>,
    #[wire(key = "_name")]
    #[slot(field = ts_field::NAME)]
    name: SlotValue<TsIdent>,
    #[wire(key = "_value")]
    #[slot(field = ts_field::VALUE)]
    value: Option<SlotValue<TsNumber>>,
}

#[derive(Debug, Clone, Copy, PartialEq, Transport)]
#[transport(choice)]
enum DeclarationKind {
    #[kind(ts::LET_KEYWORD)]
    Let,
    #[kind(ts::CONST_KEYWORD)]
    Const,
}

#[derive(Debug, Clone, Copy, PartialEq, Transport)]
#[transport(choice)]
enum Terminator {
    #[kind(ts::_AUTOMATIC_SEMICOLON)]
    Inserted,
    #[kind(ts::SEMI)]
    Semi,
}

#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(kind = ts::LEXICAL_DECLARATION)]
struct Declaration {
    #[wire(key = "$_layout")]
    layout: Option<Box<sittir_core::layout::TransportLayout<()>>>,
    #[wire(key = "_kind")]
    #[slot(field = ts_field::KIND)]
    kind: SlotValue<DeclarationKind>,
    #[wire(key = "_declarators")]
    #[slot(field = ts_field::DECLARATORS)]
    declarators: Vec<SlotValue<Declarator>>,
    #[wire(key = "_terminator")]
    #[slot(field = ts_field::TERMINATOR)]
    terminator: Option<SlotValue<Terminator>>,
}

#[test]
fn a_zero_width_terminator_is_a_unit_and_owns_nothing() {
    // the comment sits before the zero-width terminator, inside the declaration
    let source = "let x = 1 // c\nlet y = 2;";
    let tree = parse(&sittir_typescript::language(), source);
    let first: Declaration = read_nth(&tree, source, ts::LEXICAL_DECLARATION, 0, Depth::All).unwrap();
    let second: Declaration = read_nth(&tree, source, ts::LEXICAL_DECLARATION, 1, Depth::All).unwrap();
    assert_eq!(first.terminator, Some(SlotValue::Transport(Terminator::Inserted)));
    assert_eq!(second.terminator, Some(SlotValue::Transport(Terminator::Semi)));
    let declarator = first.declarators[0].transport().unwrap();
    assert_eq!(placed(&declarator.layout), None, "a read with no side lookup seats nothing");
}

#[derive(Debug, Clone, Copy, PartialEq, Transport)]
#[transport(choice)]
enum BlockTerminator {
    #[kind(ts::_AUTOMATIC_SEMICOLON)]
    Inserted,
    #[transport(blank)]
    Blank,
}

#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(kind = ts::STATEMENT_BLOCK, layout = [ts::LBRACE, ts::RBRACE])]
struct StatementBlock {
    #[wire(key = "$_layout")]
    layout: Option<Box<sittir_core::layout::TransportLayout<()>>>,
    #[wire(key = "_terminator")]
    #[slot(field = ts_field::TERMINATOR)]
    terminator: Option<SlotValue<BlockTerminator>>,
}

#[test]
fn an_absent_slot_with_a_blank_arm_reads_as_its_blank() {
    // the parser inserts no terminator after the `if` block, and one after the `else` block
    let source = "if (a) { } else { }";
    let tree = parse(&sittir_typescript::language(), source);
    let consequence: StatementBlock = read_nth(&tree, source, ts::STATEMENT_BLOCK, 0, Depth::All).unwrap();
    let alternative: StatementBlock = read_nth(&tree, source, ts::STATEMENT_BLOCK, 1, Depth::All).unwrap();
    assert_eq!(consequence.terminator, Some(SlotValue::Transport(BlockTerminator::Blank)));
    assert_eq!(alternative.terminator, Some(SlotValue::Transport(BlockTerminator::Inserted)));
}

#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(
    kind = kind::INTEGER_LITERAL_DECIMAL,
    interior = "^(?<content>(?:[0-9][0-9_]*))(?<suffix>isize|usize|u128|i128|u16|i16|u32|i32|u64|i64|f32|f64|u8|i8)?$"
)]
struct Decimal {
    #[wire(key = "$_layout")]
    layout: Option<Box<sittir_core::layout::TransportLayout<()>>>,
    #[wire(key = "_content")]
    #[slot(capture = "content")]
    content: String,
    #[wire(key = "_suffix")]
    #[slot(capture = "suffix")]
    suffix: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(kind = kind::_TYPE_IDENTIFIER, display, content = content)]
struct TypeIdent {
    #[wire(key = "$_layout")]
    layout: Option<Box<sittir_core::layout::TransportLayout<()>>>,
    #[wire(key = "_content")]
    content: SlotValue<Ident>,
}

#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(choice)]
enum NamedType {
    #[kind(kind::_TYPE_IDENTIFIER, display)]
    TypeIdentifier(Box<TypeIdent>),
    #[kind(kind::NEVER_TYPE)]
    Never,
}

#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(kind = kind::FUNCTION_ITEM, layout = [kind::FN_KEYWORD, kind::DASH_GT])]
struct Named {
    #[wire(key = "$_layout")]
    layout: Option<Box<sittir_core::layout::TransportLayout<()>>>,
    #[wire(key = "_name")]
    #[slot(field = field::NAME)]
    name: SlotValue<Ident>,
    #[wire(key = "_parameters")]
    #[slot(field = field::PARAMETERS)]
    parameters: SlotValue<Params>,
    #[wire(key = "_return_type")]
    #[slot(field = field::RETURN_TYPE)]
    return_type: Option<SlotValue<NamedType>>,
    #[wire(key = "_body")]
    #[slot(field = field::BODY)]
    body: SlotValue<Box<Block>>,
}

#[test]
fn a_token_interior_reads_its_slots_from_its_text() {
    let source = "const X: u8 = 1_000u8;";
    let tree = parse_rust(source);
    let decimal: Decimal = read_nth(&tree, source, kind::INTEGER_LITERAL_DECIMAL, 0, Depth::ONE).unwrap();
    assert_eq!((decimal.content.as_str(), decimal.suffix.as_deref()), ("1_000", Some("u8")));
}

/// The layout an envelope's content keeps: the coordinate the envelope holds, which names the content's node, and nothing else.
fn coordinate_only<T>(envelope: &Option<Box<sittir_core::layout::TransportLayout<T>>>) -> Option<Box<sittir_core::layout::TransportLayout<T>>> {
    let at = envelope.as_ref().and_then(|layout| layout.at.clone());
    assert!(at.is_some(), "the envelope holds the content's coordinate");
    Some(Box::new(sittir_core::layout::TransportLayout { at, ..sittir_core::layout::TransportLayout::default() }))
}

#[test]
fn an_envelope_holds_its_content_and_the_trivia_its_content_was_given() {
    let source = "fn f() -> T /* c */ {}";
    let tree = parse_rust(source);
    let _ = tree;
    let f: Named = read_seated(source, kind::FUNCTION_ITEM, 0, Depth::All).unwrap();
    let Some(SlotValue::Transport(NamedType::TypeIdentifier(envelope))) = &f.return_type else { panic!("{:?}", f.return_type) };
    assert_eq!(envelope.content.transport().unwrap().text, "T");
    assert_eq!(envelope.content.transport().unwrap().layout, coordinate_only(&envelope.layout));
    assert_eq!(trivia_spans(&envelope.layout, "trailing"), vec![(12, 19)]);
}

#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(kind = kind::_ATTRIBUTED_PARAMETER)]
struct Param {
    #[wire(key = "$_layout")]
    layout: Option<Box<sittir_core::layout::TransportLayout<()>>>,
}

#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(kind = kind::PARAMETERS_ELEMENTS, item = item)]
struct List {
    #[wire(key = "$_layout")]
    layout: Option<Box<sittir_core::layout::TransportLayout<()>>>,
    #[wire(key = "_item")]
    #[slot(field = field::ITEM, separator = kind::COMMA)]
    item: Vec<SlotValue<Param>>,
    #[wire(key = "_delimiter")]
    #[flank(trailing = 0)]
    delimiter: Option<u8>,
}

#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(kind = kind::PARAMETERS, layout = [kind::LPAREN, kind::RPAREN], min_depth = 2)]
struct Owner {
    #[wire(key = "$_layout")]
    layout: Option<Box<sittir_core::layout::TransportLayout<()>>>,
    #[wire(key = "_elements")]
    #[slot(field = field::ELEMENTS)]
    elements: Option<SlotValue<List>>,
}

fn owner(source: &str) -> Owner {
    read_nth(&parse_rust(source), source, kind::PARAMETERS, 0, Depth::ONE).unwrap()
}

#[test]
fn a_list_owner_brings_its_list_and_the_list_knows_its_trailing_separator() {
    let plain = owner("fn f(a: u8, b: u8) {}");
    let list = plain.elements.as_ref().unwrap().transport().expect("min_depth reads the list");
    assert_eq!(list.item.len(), 2);
    assert!(list.item.iter().all(|item| item.coord().is_some()), "the items have structure: past the depth");
    assert_eq!(list.delimiter, Some(0));
    let trailing = owner("fn f(a: u8, b: u8,) {}");
    assert_eq!(trailing.elements.unwrap().transport().unwrap().delimiter, Some(sittir_core::read::TRAILING));
}

#[test]
fn a_row_read_equals_the_same_node_in_a_whole_read_trivia_included() {
    let source = "// lead\nfn f() { fn g() {} } // trail\n";
    let tree = parse_rust(source);
    let table = Table::of(&tree, source);
    let ctx = ReadCtx::new(source, 7, <File as ReadTransport>::shows).with_sides(&table);
    let whole: File = File::read(&mut tree.walk(), &ctx, Depth::All).unwrap();
    let shallow: File = File::read(&mut tree.walk(), &ctx, Depth::ONE).unwrap();
    let index = shallow.statements[0].coord().unwrap().index;
    let outer: Function = sittir_core::read::read_at::<Function>(&mut tree.walk(), &ctx, index, Depth::All).unwrap();
    assert_eq!(&outer, function(&whole, 0));
    assert_eq!(trivia_spans(&outer.layout, "leading"), vec![(0, 7)]);

    let inner_row = find(&tree, kind::FUNCTION_ITEM, 1).descendant_index() as u32;
    let inner: Function = sittir_core::read::read_at::<Function>(&mut tree.walk(), &ctx, inner_row, Depth::All).unwrap();
    let body = function(&whole, 0).body.transport().unwrap();
    assert_eq!(&inner, body.statements[0].transport().unwrap());
}

#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(choice)]
enum Name {
    #[kind(kind::IDENTIFIER)]
    Ident(Ident),
}

#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(kind = kind::_TYPE_IDENTIFIER, display, content = content)]
struct TypeIdentOfChoice {
    #[wire(key = "$_layout")]
    layout: Option<Box<sittir_core::layout::TransportLayout<()>>>,
    #[wire(key = "_content")]
    content: SlotValue<Name>,
}

#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(choice)]
enum NamedTypeOfChoice {
    #[kind(kind::_TYPE_IDENTIFIER, display)]
    TypeIdentifier(TypeIdentOfChoice),
}

#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(kind = kind::FUNCTION_ITEM, layout = [kind::FN_KEYWORD, kind::DASH_GT])]
struct NamedOfChoice {
    #[wire(key = "$_layout")]
    layout: Option<Box<sittir_core::layout::TransportLayout<()>>>,
    #[wire(key = "_name")]
    #[slot(field = field::NAME)]
    name: SlotValue<Ident>,
    #[wire(key = "_parameters")]
    #[slot(field = field::PARAMETERS)]
    parameters: SlotValue<Params>,
    #[wire(key = "_return_type")]
    #[slot(field = field::RETURN_TYPE)]
    return_type: Option<SlotValue<NamedTypeOfChoice>>,
    #[wire(key = "_body")]
    #[slot(field = field::BODY)]
    body: SlotValue<Box<Block>>,
}

#[test]
fn an_envelope_over_a_choice_holds_the_trivia_its_content_variant_was_given() {
    let source = "fn f() -> T /* c */ {}";
    let tree = parse_rust(source);
    let _ = tree;
    let f: NamedOfChoice = read_seated(source, kind::FUNCTION_ITEM, 0, Depth::All).unwrap();
    let Some(SlotValue::Transport(NamedTypeOfChoice::TypeIdentifier(envelope))) = &f.return_type else { panic!("{:?}", f.return_type) };
    let Some(Name::Ident(ident)) = envelope.content.transport() else { panic!("{:?}", envelope.content) };
    assert_eq!(ident.text, "T");
    assert_eq!(ident.layout, coordinate_only(&envelope.layout));
    assert_eq!(trivia_spans(&envelope.layout, "trailing"), vec![(12, 19)]);
}

#[test]
fn a_coordinate_reads_one_level_into_its_generated_transport() {
    use sittir_core::prepare::Prepare;
    use sittir_rust::render::transport::FunctionItemTransport;
    let source = "fn f() { g(); }\n";
    let tree = parse_rust(source);
    let index = find(&tree, kind::FUNCTION_ITEM, 0).descendant_index() as u32;
    let ctx = ReadCtx::new(source, 7, <FunctionItemTransport as ReadTransport>::shows);
    let read = FunctionItemTransport::read_coordinate(&tree, &ctx, index).expect("a generated transport reads a coordinate").unwrap();
    let direct = read_nth::<FunctionItemTransport>(&tree, source, kind::FUNCTION_ITEM, 0, Depth::ONE).unwrap();
    assert_eq!(read, direct);
}
