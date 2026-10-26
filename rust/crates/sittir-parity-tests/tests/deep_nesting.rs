//! A node tree nests as deep as its source. Preparing, rendering and
//! dropping one far deeper than a thread's stack could hold one level per
//! frame finishes, on a thread whose stack is small.

use std::sync::Arc;

use sittir_core::prepare::RenderContext;
use sittir_core::render::SourceTable;
use sittir_core::types::TreeId;
use sittir_core::SlotValue;
use sittir_rust::render::node::{ExpressionNode, IdentifierNode, ParenthesizedExpressionNode};
use sittir_rust::render::{options, render_node_parts, AnyNode};

struct NoTrees;

impl SourceTable for NoTrees {
    fn source_of(&self, _: TreeId) -> Option<&Arc<str>> {
        None
    }
}

fn parenthesized(expression: ExpressionNode) -> ParenthesizedExpressionNode {
    ParenthesizedExpressionNode { layout: None, expression: SlotValue::Node(Box::new(expression)) }
}

fn nested(depth: usize) -> SlotValue<AnyNode> {
    let mut expression = ExpressionNode::Identifier(IdentifierNode { layout: None, text: "x".into() });
    for _ in 1..depth {
        expression = ExpressionNode::ParenthesizedExpression(parenthesized(expression));
    }
    SlotValue::Node(AnyNode::ParenthesizedExpression(parenthesized(expression)))
}

fn on_small_stack<R: Send + 'static>(run: impl FnOnce() -> R + Send + 'static) -> R {
    std::thread::Builder::new().stack_size(256 * 1024).spawn(run).expect("a thread").join().expect("the thread finishes")
}

#[test]
fn a_deep_tree_prepares_renders_and_drops_on_a_small_stack() {
    const DEPTH: usize = 50_000;
    let rendered = on_small_stack(|| {
        let options = options::defaults();
        let ctx = RenderContext { options: &options, sources: &NoTrees, recording: None };
        render_node_parts(nested(DEPTH), &ctx).map(|(_, text)| text).map_err(|error| error.to_string())
    });
    assert_eq!(rendered, Ok(format!("{}x{}", "(".repeat(DEPTH), ")".repeat(DEPTH))));
}

#[test]
fn a_deep_tree_drops_on_a_small_stack() {
    on_small_stack(|| drop(nested(200_000)));
}
