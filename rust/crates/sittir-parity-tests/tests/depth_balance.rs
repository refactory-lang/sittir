//! A python block closes the indent its parent opened, whether it renders as
//! its source inside a parent its template renders, or from its template with
//! an empty body or a body ending in comment lines: `finish` asserts the depth
//! returned to zero, and that assertion only runs in a debug build. An
//! untouched block renders as its source however deeply it was read
//! (shared-arena design § Render; trivia-table design § 4, copying source
//! text); a block with a write in its range renders from its template
//! (trivia-table design § 4, edited ranges).

use sittir_core::engine::{claim_tree_id, Engine};
use sittir_core::prepare::RenderContext;
use sittir_core::read::{read_at, Depth};
use sittir_core::types::{KindId, NodeIndex};
use sittir_parity_tests::edit_in_place;
use sittir_python::render::kind_ids;
use sittir_python::render::node::{render_node_parts, AnyNode, TriviaNode};
use sittir_python::render::options;

/// What is written into a parsed tree before it is read and rendered.
#[derive(Clone, Copy)]
enum Write {
    /// Nothing: every node renders as its source.
    Nothing,
    /// A `# written` comment line before the `nth` node of the kind.
    Comment(KindId, usize),
    /// Every node's own inner side back (`edit_in_place`): every node renders
    /// from its template, with no text changed.
    EveryNode,
}

/// `source` parsed, written as `write` says, read `depth` levels down seating
/// its sides, and rendered.
fn rendered(source: &str, depth: Depth, write: Write) -> String {
    let mut engine = Engine::new(sittir_python::PythonGrammar, options::defaults()).expect("an engine");
    let tree = engine.parse(source, claim_tree_id().expect("a tree id")).expect("a parse");
    let indices = (0..sittir_core::read::descendant_count(&tree.tree().root_node())).map(NodeIndex::new);
    match write {
        Write::Nothing => {}
        Write::Comment(kind, nth) => {
            let index = indices
                .filter(|&index| sittir_core::engine::node_at_index(tree.tree(), index).is_some_and(|node| sittir_core::read::grammar_id(&node) == kind))
                .nth(nth)
                .expect("the node the write names");
            let comment = sittir_core::trivia::TriviaText { kind: kind_ids::COMMENT, text: "# written".to_owned(), span: None, before: None, after: None };
            let entries = [TriviaNode::Text(comment), TriviaNode::Newline].into_iter().map(|entry| sittir_core::trivia::TriviaEntry::new(sittir_core::SlotValue::Node(entry))).collect();
            tree.write_trivia_side(index, sittir_core::trivia_table::TriviaSide::Leading, entries);
        }
        Write::EveryNode => indices.for_each(|index| edit_in_place(&tree, index)),
    }
    let root: AnyNode = read_at(&mut tree.tree().walk(), &mut tree.seating_ctx(), NodeIndex::ROOT, depth).expect("a root");
    let options = engine.options().clone();
    let ctx = RenderContext { options: &options, sources: &tree };
    render_node_parts(sittir_core::SlotValue::Node(root), &ctx, None).expect("a render").1
}

/// `source` untouched renders as itself read one level down and read whole.
fn renders_as_its_source(source: &str) {
    for depth in [Depth::ONE, Depth::All] {
        assert_eq!(rendered(source, depth, Write::Nothing), source, "read {depth:?}");
    }
}

const IF_ELSE: &str = "if a:\n    b\nelse:\n    c\nd\n";

#[test]
fn a_block_rendered_as_its_source_closes_the_indent_its_parent_opened() {
    renders_as_its_source("if a:\n  b\n");
    assert_eq!(rendered("if a:\n  b\n", Depth::All, Write::EveryNode), "if a:\n    b\n");
    renders_as_its_source(IF_ELSE);
    for depth in [Depth::ONE, Depth::All] {
        assert_eq!(rendered(IF_ELSE, depth, Write::Comment(kind_ids::EXPRESSION_STATEMENT, 1)), "if a:\n    b\nelse:\n    # written\n    c\nd\n", "read {depth:?}");
    }
}

const EMPTY_BLOCKS: &str = "\n# These are not actually valid python; blocks\n# must contain at least one statement. But we\n# allow them because error recovery for empty\n# blocks doesn't work very well otherwise.\ndef a(b, c):\n\nif d:\n  print e\n  while f():\n";

const COMMENT_ONLY_LINES: &str = "\nif a:\n  b\n  # one\n  # two\n\nif c:\n  d\n    # three\n      # four\n\ndef a():\n    if b:\n        b # comment\n    b # comment\n\n# five\n";

#[test]
fn blocks_ending_in_empty_bodies_or_comment_lines_close_their_indents() {
    renders_as_its_source(EMPTY_BLOCKS);
    assert_eq!(rendered(EMPTY_BLOCKS, Depth::All, Write::EveryNode), EMPTY_BLOCKS[1..].replace("\n  ", "\n    "));
    renders_as_its_source(COMMENT_ONLY_LINES);
    assert_eq!(
        rendered(COMMENT_ONLY_LINES, Depth::All, Write::EveryNode),
        "if a:\n    b\n    # one\n    # two\n\nif c:\n    d\n        # three\n            # four\n\ndef a():\n    if b:\n        b # comment\n    b # comment\n\n# five\n"
    );
}
