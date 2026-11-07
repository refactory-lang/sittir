//! A hydration walk that refuses leaves its cursor on the node it started on,
//! however far below that node the refusal came, and `hydrate_at` leaves the
//! arena as it found it. The nodes are declared here with records so a walk
//! of a real tree can refuse partway: a block that holds one statement meets
//! a second one after the first's whole walk.
#![cfg(feature = "arena")]

use sittir_core::arena::{hydrate_at, HydrateError, Hydration, TreeArena};
use sittir_core::read::{descendant_count, index_of, Depth, ReadCtx, ReadError};
use sittir_core::record::PARSED_KIND_BITS;
use sittir_core::types::{NodeIndex, TreeId};
use sittir_core::{Node, SlotValue};
use sittir_rust::render::{field_ids as field, kind_ids as kind};

mod no_trivia;

use no_trivia::NoTrivia;

sittir_core::grammar_nodes!(NoTrivia; NoTrivia, Ident, Params, Block, Function);

type Layout = Option<Box<sittir_core::layout::NodeLayout<NoTrivia>>>;

#[derive(Debug, Clone, PartialEq, Node)]
#[node(kind = kind::IDENTIFIER, text, words = 2, built_words = 2)]
struct Ident {
    #[wire(key = "$_layout")]
    #[layout]
    layout: Layout,
    #[wire(key = "$text")]
    #[text]
    text: String,
}

#[derive(Debug, Clone, PartialEq, Node)]
#[node(kind = kind::PARAMETERS, layout = [kind::LPAREN, kind::RPAREN], words = 2, built_words = 2)]
struct Params {
    #[wire(key = "$_layout")]
    #[layout]
    layout: Layout,
}

/// A block that holds one statement.
#[derive(Debug, Clone, PartialEq, Node)]
#[node(kind = kind::BLOCK, layout = [kind::LBRACE, kind::RBRACE], words = 5, built_words = 3)]
struct Block {
    #[wire(key = "$_layout")]
    #[layout]
    layout: Layout,
    #[height]
    height: u16,
    #[wire(key = "_statement")]
    #[slot(field = field::STATEMENTS, word = 2, width = 3, forms = 1, built = 2)]
    statement: Option<SlotValue<Box<Function>>>,
}

#[derive(Debug, Clone, PartialEq, Node)]
#[node(kind = kind::FUNCTION_ITEM, layout = [kind::FN_KEYWORD], words = 11, built_words = 5)]
struct Function {
    #[wire(key = "$_layout")]
    #[layout]
    layout: Layout,
    #[height]
    height: u16,
    #[wire(key = "_name")]
    #[slot(field = field::NAME, word = 2, width = 3, forms = 1, built = 2)]
    name: SlotValue<Ident>,
    #[wire(key = "_parameters")]
    #[slot(field = field::PARAMETERS, word = 5, width = 3, forms = 1, built = 3)]
    parameters: SlotValue<Params>,
    #[wire(key = "_body")]
    #[slot(field = field::BODY, word = 8, width = 3, forms = 1, built = 4)]
    body: SlotValue<Box<Block>>,
}

/// The first function of `source` hydrated to every depth: what the walk
/// answers, the row the cursor ends on and the row it started from, and
/// whether the arena stands where it stood before the walk.
fn hydrate_first_function(source: &str) -> (Result<(), HydrateError>, NodeIndex, NodeIndex, bool) {
    let mut parser = tree_sitter::Parser::new();
    parser.set_language(&sittir_rust::language()).expect("the rust grammar");
    let tree = parser.parse(source, None).expect("a parse");
    assert!(!tree.root_node().has_error(), "{source:?} parses without an ERROR");
    let mut cursor = tree.walk();
    assert!(cursor.goto_first_child());
    let function = index_of(&cursor);
    let mut ctx = ReadCtx::new(source, TreeId(1), |_| false);
    let mut arena = TreeArena::new(PARSED_KIND_BITS, descendant_count(&tree.root_node()));
    let before = arena.arena().mark();
    let walked = hydrate_at::<Function>(&mut cursor, &mut ctx, function, None, Depth::All, &mut Hydration::new(&mut arena)).map(|_| ());
    (walked, index_of(&cursor), function, arena.arena().mark() == before)
}

#[test]
fn a_walk_that_stands_ends_on_the_node_it_started_on() {
    let (walked, ended, started, unwritten) = hydrate_first_function("fn a() { fn b() {} }\n");
    walked.expect("a block with one statement");
    assert_eq!(ended, started);
    assert!(!unwritten, "the walk wrote its records");
}

#[test]
fn a_walk_refused_two_levels_down_ends_on_the_node_it_started_on_with_the_arena_as_it_was() {
    let (walked, ended, started, unwritten) = hydrate_first_function("fn a() { fn b() {} fn c() {} }\n");
    assert!(matches!(walked, Err(HydrateError::Read(ReadError::Overfull { .. }))), "{walked:?}");
    assert_eq!(ended, started, "the cursor ends where the walk started");
    assert!(unwritten, "no word written past where the walk started");
}
