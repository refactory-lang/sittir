//! An `ERROR` keeps its text and none of the whitespace beside it: an
//! in-line gap on either side of it is the options', and a line break
//! beside it is a member of its side where the source has one. A leading
//! or inner side whose first entry sits on the row of the token before it
//! keeps that row, and an inner side whose last entry sits on the row of
//! the closing token keeps it too. The gap after a leading or trailing
//! side's last entry is its parent's, so the templates or a list slot
//! write it. A line
//! continuation keeps no in-line whitespace either. Each source renders as
//! given with every node edited in place, and so does its snapshot
//! (`packages/tools/tests/snapshot-one-rule.test.ts`).

use sittir_core::engine::Backing as _;
use sittir_parity_tests::renders_as_read;

#[test]
fn a_python_error_between_brackets_keeps_the_break_after_it() {
    renders_as_read!(sittir_python, sittir_python::PythonGrammar, "f(\n    $\n)\n", "x = [\n    $\n]\n");
}

#[test]
fn a_rust_error_alone_in_a_block_takes_the_gap_after_the_brace_from_the_options() {
    renders_as_read!(sittir_rust, sittir_rust::RustGrammar, "fn f() {\n\n    $\n}\n" => "fn f() {\n    $\n}\n");
}

#[test]
fn the_templates_write_the_gap_after_a_rust_error_that_ends_a_side() {
    renders_as_read!(
        sittir_rust,
        sittir_rust::RustGrammar,
        "fn f() {\n    let a = 1; $ let b = 2;\n}\n" => "fn f() {\n    let a = 1; $\n    let b = 2;\n}\n",
        "fn f() {\n    let a = 1; \\ let b = 2;\n}\n" => "fn f() {\n    let a = 1; \\\n    let b = 2;\n}\n",
        "fn f() {\n    let a = 1; $ }\n" => "fn f() {\n    let a = 1; $\n}\n",
        "fn f() {\n    let a = 1;\n    $ }\n" => "fn f() {\n    let a = 1;\n    $\n}\n",
        "fn f() {\n    match x {\n        1 => 2, $ _ => 3,\n    }\n}\n" => "fn f() {\n    match x {\n        1 => 2, $\n        _ => 3,\n    }\n}\n",
    );
    renders_as_read!(sittir_rust, sittir_rust::RustGrammar, "fn f() { $ }\n", "struct S { $ }\n");
}

#[test]
fn the_templates_write_the_gap_after_a_typescript_error_that_ends_a_side() {
    renders_as_read!(
        sittir_typescript,
        sittir_typescript::TypeScriptGrammar,
        "function f() {\n  let a = 1; # let b = 2;\n}\n" => "function f() {\n  let a = 1; #\n  let b = 2;\n}\n",
        "function f() {\n  let a = 1;\n  # }\n" => "function f() {\n  let a = 1;\n  #\n}\n",
        "class C {\n  a = 1; # b = 2;\n}\n" => "class C {\n  a = 1; #\n  b = 2;\n}\n",
    );
    renders_as_read!(sittir_typescript, sittir_typescript::TypeScriptGrammar, "class C { # }\n");
}

#[test]
fn a_list_slot_writes_the_separator_gap_beside_an_error() {
    renders_as_read!(sittir_rust, sittir_rust::RustGrammar, "fn f() {\n    let x = [\n        1,\n        2, $ 3,\n        4,\n    ];\n}\n" => "fn f() {\n    let x = [1, 2, $ 3, 4,];\n}\n");
    renders_as_read!(sittir_typescript, sittir_typescript::TypeScriptGrammar, "type T = {\n  a: 1;\n  b: 2; # c: 3;\n  d: 4;\n};\n");
}

#[test]
fn a_line_continuation_keeps_no_in_line_whitespace_beside_it() {
    renders_as_read!(sittir_python, sittir_python::PythonGrammar, "x = [1 $ \\\n]\n", "x = [1, $ \\\n]\n", "f(a $ \\\n)\n", "x = (1 $ \\\n)\n");
    renders_as_read!(
        sittir_python,
        sittir_python::PythonGrammar,
        "x = [1 \\\n \\\n]\n" => "x = [1 \\\n\\\n]\n",
        "x = [1 \\\n    \\\n]\n" => "x = [1 \\\n\\\n]\n",
    );
}
