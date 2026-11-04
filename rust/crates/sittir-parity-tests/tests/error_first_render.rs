//! A render whose first text is an `ERROR`, written verbatim, keeps every
//! seam its templates write after it: the root's edge ends with the first
//! text however that text is written.

use sittir_core::engine::{claim_tree_id, Engine};
use sittir_core::prepare::RenderContext;
use sittir_core::read::{read_at, Depth};
use sittir_core::types::NodeIndex;
use sittir_parity_tests::edit_in_place;

/// `$source` parsed with every node's inner side written back
/// (`edit_in_place`), so every node renders from its template, read whole
/// seating its sides, and rendered.
macro_rules! rendered {
    ($krate:ident, $grammar:expr, $source:expr) => {{
        let mut engine = Engine::new($grammar, $krate::render::options::defaults()).expect("an engine");
        let tree = engine.parse($source, claim_tree_id().expect("a tree id")).expect("a parse");
        (0..sittir_core::read::descendant_count(&tree.tree().root_node())).map(NodeIndex::new).for_each(|index| edit_in_place(&tree, index));
        let root: $krate::render::AnyNode = read_at(&mut tree.tree().walk(), &mut tree.seating_ctx(), NodeIndex::ROOT, Depth::All).expect("a root");
        let options = engine.options().clone();
        let ctx = RenderContext { options: &options, sources: &tree };
        $krate::render::render_node_parts(sittir_core::SlotValue::Node(root), &ctx, None).expect("a render").1
    }};
}

#[test]
fn a_python_tree_led_by_an_error_renders_its_templates_spaced() {
    for source in [", \"b\", \"c\"\n", ". x = 1, 2\n"] {
        assert_eq!(rendered!(sittir_python, sittir_python::PythonGrammar, source), source);
    }
}

#[test]
fn a_typescript_tree_led_by_an_error_renders_its_templates_spaced() {
    for source in ["\"\" extends C ? \"\" : \".\"\n", ") x = 1 + 2;\n"] {
        assert_eq!(rendered!(sittir_typescript, sittir_typescript::TypeScriptGrammar, source), source);
    }
}

#[test]
fn an_scm_tree_led_by_an_error_renders_its_templates_spaced() {
    for source in [". name: (identifier)\n", ") (a b: (c))\n"] {
        assert_eq!(rendered!(sittir_scm, sittir_scm::ScmGrammar, source), source);
    }
}

#[test]
fn a_rust_tree_led_by_an_error_renders_its_templates_spaced() {
    let source = "} fn f(a: u8, b: u8) {}\n";
    assert_eq!(rendered!(sittir_rust, sittir_rust::RustGrammar, source), source);
}
