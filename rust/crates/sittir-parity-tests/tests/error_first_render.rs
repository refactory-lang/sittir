//! A render whose first text is an `ERROR`, written verbatim, keeps every
//! seam its templates write after it: the root's edge ends with the first
//! text however that text is written.

use sittir_parity_tests::edited_rendered;

#[test]
fn a_python_tree_led_by_an_error_renders_its_templates_spaced() {
    for source in [", \"b\", \"c\"\n", ". x = 1, 2\n"] {
        assert_eq!(edited_rendered!(sittir_python, sittir_python::PythonGrammar, source), source);
    }
}

#[test]
fn a_typescript_tree_led_by_an_error_renders_its_templates_spaced() {
    for source in ["\"\" extends C ? \"\" : \".\"\n", ") x = 1 + 2;\n"] {
        assert_eq!(edited_rendered!(sittir_typescript, sittir_typescript::TypeScriptGrammar, source), source);
    }
}

#[test]
fn an_scm_tree_led_by_an_error_renders_its_templates_spaced() {
    for source in [". name: (identifier)\n", ") (a b: (c))\n"] {
        assert_eq!(edited_rendered!(sittir_scm, sittir_scm::ScmGrammar, source), source);
    }
}

#[test]
fn a_rust_tree_led_by_an_error_renders_its_templates_spaced() {
    let source = "} fn f(a: u8, b: u8) {}\n";
    assert_eq!(edited_rendered!(sittir_rust, sittir_rust::RustGrammar, source), source);
}
