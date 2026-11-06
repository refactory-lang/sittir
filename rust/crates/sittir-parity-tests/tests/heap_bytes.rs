//! The heap a generated node counts (`sittir_core::heap::HeapBytes`), which
//! the `Node` derive expands from the node's fields: what a written side
//! holding the node adds to its tree's count.

use sittir_core::heap::HeapBytes;
use sittir_core::layout::NodeLayout;
use sittir_core::trivia::TriviaText;
use sittir_python::render::kind_ids as kind;
use sittir_python::render::node::{CommentNode, TriviaNode};

#[test]
fn a_comment_counts_its_content_and_its_layout() {
    let content = || String::with_capacity(24) + "# note";
    let bare = TriviaNode::Comment(CommentNode { layout: None, verbatim: None, content: content() });
    assert_eq!(bare.heap_bytes(), 24, "the content's capacity");
    let layout = NodeLayout { slots: Vec::with_capacity(2), ..NodeLayout::default() };
    let laid = TriviaNode::Comment(CommentNode { layout: Some(Box::new(layout)), verbatim: None, content: content() });
    let slots = 2 * std::mem::size_of::<sittir_core::layout::SlotLayout>();
    assert_eq!(laid.heap_bytes(), 24 + std::mem::size_of::<NodeLayout<TriviaNode>>() + slots, "the boxed layout and its slot table beside the content");
}

#[test]
fn a_text_entry_counts_each_string_it_holds() {
    let text = TriviaText { kind: kind::COMMENT, text: String::with_capacity(10), span: None, before: Some(String::with_capacity(3)), after: None, bytes: None };
    assert_eq!(TriviaNode::Text(text).heap_bytes(), 13);
    assert_eq!(TriviaNode::Newline.heap_bytes(), 0, "a unit holds nothing");
}
