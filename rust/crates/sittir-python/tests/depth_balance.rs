//! A block must close the indent its parent opened, whether its body is
//! empty or it renders as its source inside a parent its template renders:
//! `finish` asserts the depth returned to zero, and that assertion only runs
//! in a debug build.

use sittir_core::engine::{claim_tree_id, Engine};
use sittir_core::prepare::RenderContext;
use sittir_core::read::{read_at, Depth};
use sittir_core::render::SourceTable;
use sittir_core::types::{KindId, NodeIndex};
use std::sync::Arc;

use sittir_python::render::options;
use sittir_python::render::node::{
    render_node_parts, AnyNode, BlockNode, RenderRoot, SuiteBlockNode,
};

struct NoSources;
impl SourceTable for NoSources {
    fn source_of(&self, _tree_id: sittir_core::types::TreeId) -> Option<&Arc<str>> {
        None
    }
}

#[test]
fn an_empty_suite_block_closes_the_indent_it_opened() {
    let options = options::defaults();
    let ctx = RenderContext { options: &options, sources: &NoSources };
    let block = BlockNode {
        layout: None,
        statements: Vec::new(),
        statements_separator_space: None,
    };
    let suite = SuiteBlockNode {
        layout: None,
        block: ::sittir_core::SlotValue::Node(block),
    };
    let root: RenderRoot = ::sittir_core::SlotValue::Node(AnyNode::SuiteBlock(suite));
    let (_, rendered) = render_node_parts(root, &ctx, None).expect("render");
    assert!(!rendered.contains('\u{FDD0}'));
}

/// `source` read `depth` levels down seating its sides and rendered, after a
/// `# written` comment is written before the `nth` node of kind `kind`, when
/// `write` names one.
fn rendered_with(source: &str, depth: Depth, write: Option<(KindId, usize)>) -> String {
    use sittir_python::render::node::TriviaNode;
    let mut engine = Engine::new(sittir_python::PythonGrammar, options::defaults()).expect("an engine");
    let tree = engine.parse(source, claim_tree_id().expect("a tree id")).expect("a parse");
    if let Some((kind, nth)) = write {
        let index = (0..sittir_core::read::descendant_count(&tree.tree().root_node()))
            .map(NodeIndex::new)
            .filter(|&index| sittir_core::engine::node_at_index(tree.tree(), index).is_some_and(|node| sittir_core::read::grammar_id(&node) == kind))
            .nth(nth)
            .expect("the node the write names");
        let comment = sittir_core::trivia::TriviaText { kind: sittir_python::render::kind_ids::COMMENT, text: "# written".to_owned(), span: None, before: None, after: None };
        let entries = [TriviaNode::Text(comment), TriviaNode::Newline].into_iter().map(|entry| sittir_core::trivia::TriviaEntry::new(::sittir_core::SlotValue::Node(entry))).collect();
        tree.write_trivia_side(index, sittir_core::trivia_table::TriviaSide::Leading, entries);
    }
    let root: AnyNode = read_at(&mut tree.tree().walk(), &mut tree.seating_ctx(), NodeIndex::ROOT, depth).expect("a root");
    let options = engine.options().clone();
    let ctx = RenderContext { options: &options, sources: &tree };
    render_node_parts(::sittir_core::SlotValue::Node(root), &ctx, None).expect("a render").1
}

/// `source` read `depth` levels down seating its sides and rendered.
fn rendered(source: &str, depth: Depth) -> String {
    rendered_with(source, depth, None)
}

const IF_ELSE: &str = "if a:\n    b\nelse:\n    c\nd\n";

#[test]
fn a_block_rendered_as_its_source_closes_the_indent_its_parent_opened() {
    assert_eq!(rendered("if a:\n  b\n", Depth::ONE), "if a:\n  b\n");
    assert_eq!(rendered("if a:\n  b\n", Depth::All), "if a:\n    b\n");
    assert_eq!(rendered(IF_ELSE, Depth::All), IF_ELSE);
    for depth in [Depth::ONE, Depth::All] {
        assert_eq!(rendered_with(IF_ELSE, depth, Some((sittir_python::render::kind_ids::EXPRESSION_STATEMENT, 1))), "if a:\n    b\nelse:\n    # written\n    c\nd\n", "read {depth:?}");
    }
}

const EMPTY_BLOCKS: &str = "\n# These are not actually valid python; blocks\n# must contain at least one statement. But we\n# allow them because error recovery for empty\n# blocks doesn't work very well otherwise.\ndef a(b, c):\n\nif d:\n  print e\n  while f():\n";

const COMMENT_ONLY_LINES: &str = "\nif a:\n  b\n  # one\n  # two\n\nif c:\n  d\n    # three\n      # four\n\ndef a():\n    if b:\n        b # comment\n    b # comment\n\n# five\n";

#[test]
fn blocks_ending_in_empty_bodies_or_comment_lines_close_their_indents() {
    assert_eq!(rendered(EMPTY_BLOCKS, Depth::ONE), EMPTY_BLOCKS);
    assert_eq!(rendered(EMPTY_BLOCKS, Depth::All), EMPTY_BLOCKS[1..].replace("\n  ", "\n    "));
    assert_eq!(rendered(COMMENT_ONLY_LINES, Depth::ONE), COMMENT_ONLY_LINES);
    assert_eq!(
        rendered(COMMENT_ONLY_LINES, Depth::All),
        "if a:\n    b\n    # one\n    # two\n\nif c:\n    d\n        # three\n            # four\n\ndef a():\n    if b:\n        b # comment\n    b # comment\n\n# five\n"
    );
}
