//! A block whose body is empty must still close the indent its parent
//! opened: `finish` asserts the depth returned to zero, and that assertion
//! only runs in a debug build.

use sittir_core::prepare::RenderContext;
use sittir_core::render::SourceTable;
use std::sync::Arc;

use sittir_python::render::options;
use sittir_python::render::transport::{
    render_transport_parts, AnyTransport, BlockTransport, RenderRoot, SuiteBlockTransport,
};

struct NoSources;
impl SourceTable for NoSources {
    fn source_of(&self, _tree_id: u32) -> Option<&Arc<str>> {
        None
    }
}

#[test]
fn an_empty_suite_block_closes_the_indent_it_opened() {
    let options = options::defaults();
    let ctx = RenderContext { options: &options, sources: &NoSources };
    let block = BlockTransport {
        transport_trivia_data: None,
        statements: None,
        statements_separator_space: None,
        edges: None,
    };
    let suite = SuiteBlockTransport {
        transport_trivia_data: None,
        block: ::sittir_core::SlotValue::Transport(block),
        edges: None,
    };
    let root: RenderRoot = ::sittir_core::SlotValue::Transport(AnyTransport::SuiteBlock(suite));
    let (_, rendered) = render_transport_parts(root, &ctx).expect("render");
    assert!(!rendered.contains('\u{FDD0}'));
}
