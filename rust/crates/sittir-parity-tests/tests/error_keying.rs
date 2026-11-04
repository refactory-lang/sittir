//! A run beside an `ERROR` renders as the source spells it. It is measured
//! from the `ERROR`'s edge: the `ERROR`'s text is anchored as a comment's
//! slice is, so a run with a literal on its far side reads the gap it
//! spans, not the frame's stretch across the `ERROR`. And a run the
//! `ERROR`'s adjacency spells in-line is the adjacency's alone: it stores
//! no deviation, and no break the templates or a list slot write beside
//! the `ERROR` replaces it. Each source renders as it reads, from its
//! snapshot and with every node edited in place.

use sittir_parity_tests::renders_as_read;

#[test]
fn a_python_error_between_brackets_keeps_the_break_after_it() {
    renders_as_read!(sittir_python, sittir_python::PythonGrammar, "f(\n    $\n)\n", "x = [\n    $\n]\n");
}

#[test]
fn a_rust_error_alone_in_a_block_keeps_the_blank_line_before_it() {
    renders_as_read!(sittir_rust, sittir_rust::RustGrammar, "fn f() {\n\n    $\n}\n");
}

#[test]
fn a_rust_error_s_in_line_run_beats_the_break_the_templates_write_beside_it() {
    renders_as_read!(
        sittir_rust,
        sittir_rust::RustGrammar,
        "fn f() {\n    let a = 1; $ let b = 2;\n}\n",
        "fn f() {\n    let a = 1; \\ let b = 2;\n}\n",
        "fn f() {\n    let a = 1; $ }\n",
        "fn f() {\n    let a = 1;\n    $ }\n",
        "fn f() { $ }\n",
        "struct S { $ }\n",
        "fn f() {\n    match x {\n        1 => 2, $ _ => 3,\n    }\n}\n",
    );
}

#[test]
fn a_typescript_error_s_in_line_run_beats_the_break_the_templates_write_beside_it() {
    renders_as_read!(
        sittir_typescript,
        sittir_typescript::TypeScriptGrammar,
        "function f() {\n  let a = 1; # let b = 2;\n}\n",
        "function f() {\n  let a = 1;\n  # }\n",
        "class C {\n  a = 1; # b = 2;\n}\n",
        "class C { # }\n",
    );
}

#[test]
fn an_error_s_in_line_run_in_a_list_s_separator_gap_beats_the_slot_s_break() {
    renders_as_read!(sittir_rust, sittir_rust::RustGrammar, "fn f() {\n    let x = [\n        1,\n        2, $ 3,\n        4,\n    ];\n}\n");
    renders_as_read!(sittir_typescript, sittir_typescript::TypeScriptGrammar, "type T = {\n  a: 1;\n  b: 2; # c: 3;\n  d: 4;\n};\n");
}
