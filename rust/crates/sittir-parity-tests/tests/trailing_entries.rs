//! An entry, a comment or an `ERROR`, that trails a list's last item takes
//! that item's trailing side, and a line continuation before it goes with
//! it: the members of one side render in source order, with a line break
//! before or between them where the source has one. The gap after the
//! side's last entry is the list's, which the options write, and each line
//! the rebuilt parent writes is indented at its depth. Each source renders
//! as given with every node edited in place, and so does its snapshot
//! (`packages/tools/tests/snapshot-one-rule.test.ts`). The members after an
//! entry that leads a list's first item go with that entry likewise.

use sittir_core::engine::Backing as _;
use sittir_core::read::SideEntry;
use sittir_core::trivia_table::TriviaSide;
use sittir_core::types::NodeIndex;
use sittir_parity_tests::renders_as_read;

#[test]
fn an_entry_trailing_a_list_s_last_item_keeps_the_line_break_before_it() {
    renders_as_read!(
        sittir_rust,
        sittir_rust::RustGrammar,
        "fn f() {\n    let p = P { a: 1\n        /* c */ };\n}\n" => "fn f() {\n    let p = P { a: 1\n    /* c */ };\n}\n",
        "fn f() {\n    let p = P { a: 1\n        $ };\n}\n" => "fn f() {\n    let p = P { a: 1\n    $ };\n}\n",
        "fn f() {\n    g(a\n        \\ );\n}\n" => "fn f() {\n    g(a\n    \\);\n}\n",
        "fn f() {\n    let v = [1\n        /* c */ ];\n}\n" => "fn f() {\n    let v = [1\n    /* c */];\n}\n",
        "struct S {\n    a: u8\n    $ }\n" => "struct S {\n    a: u8\n    $\n}\n",
        "enum E {\n    A\n    /* c */ }\n" => "enum E {\n    A\n    /* c */\n}\n",
        "fn f(a: u8\n    /* c */ ) {}\n" => "fn f(a: u8\n/* c */) {}\n",
        "use a::{b\n    $ };\n" => "use a::{b\n$};\n",
    );
    renders_as_read!(
        sittir_python,
        sittir_python::PythonGrammar,
        "x = [1\n    # c\n]\n" => "x = [1\n# c\n]\n",
        "f(a\n    # c\n)\n" => "f(a\n# c\n)\n",
        "x = {1: 2\n    # c\n}\n" => "x = {1: 2\n# c\n}\n",
        "def f(a\n    # c\n):\n    pass\n" => "def f(a\n# c\n):\n    pass\n",
    );
    renders_as_read!(
        sittir_typescript,
        sittir_typescript::TypeScriptGrammar,
        "function f(a\n  /* c */ ) {}\n" => "function f(a\n/* c */) {}\n",
        "enum E {\n  A\n  # }\n" => "enum E {\n  A\n  #\n}\n",
        "interface I {\n  a: 1\n  \\ }\n" => "interface I {\n  a: 1\n  \\\n}\n",
        "import { a\n  /* c */ } from 'm';\n" => "import { a\n/* c */ } from 'm';\n",
    );
    renders_as_read!(sittir_typescript, sittir_typescript::TypeScriptGrammar, "type T = { a: 1\n  /* c */ };\n" => "type T = {\n  a: 1\n  /* c */\n};\n");
}

#[test]
fn the_gap_after_an_entry_trailing_a_list_s_last_item_is_the_list_s() {
    renders_as_read!(sittir_rust, sittir_rust::RustGrammar, "struct S {\n    a: u8\n    // c\n}\n");
    renders_as_read!(
        sittir_rust,
        sittir_rust::RustGrammar,
        "fn f() {\n    let p = P { a: 1\n        /* c */\n    };\n}\n" => "fn f() {\n    let p = P { a: 1\n    /* c */ };\n}\n",
        "fn f() {\n    let p = P { a: 1\n        $\n    };\n}\n" => "fn f() {\n    let p = P { a: 1\n    $ };\n}\n",
        "fn f() {\n    g(a\n        // c\n    );\n}\n" => "fn f() {\n    g(a\n    // c\n    );\n}\n",
        "fn f() {\n    let t = (1, 2\n        \\\n    );\n}\n" => "fn f() {\n    let t = (1, 2\n    \\);\n}\n",
        "fn f() {\n    let p = P { a: 1\n        /* c */\n        };\n}\n" => "fn f() {\n    let p = P { a: 1\n    /* c */ };\n}\n",
    );
    renders_as_read!(sittir_python, sittir_python::PythonGrammar, "x = (1, 2\n    # c\n)\n" => "x = (1, 2\n# c\n)\n");
    renders_as_read!(sittir_python, sittir_python::PythonGrammar, "x = [\n    1\n        # c\n    ]\n" => "x = [1\n# c\n]\n");
    renders_as_read!(sittir_typescript, sittir_typescript::TypeScriptGrammar, "enum E {\n  A\n  #\n}\n");
    renders_as_read!(sittir_typescript, sittir_typescript::TypeScriptGrammar, "import { a\n  /* c */\n} from 'm';\n" => "import { a\n/* c */ } from 'm';\n");
    renders_as_read!(sittir_typescript, sittir_typescript::TypeScriptGrammar, "type T = { a: 1\n  // c\n};\n" => "type T = {\n  a: 1\n  // c\n};\n");
}

#[test]
fn a_line_continuation_after_an_entry_leading_a_list_s_first_item_takes_that_entry_s_side() {
    for source in ["x = [ # c\n    \\\n    1]\n", "x = [\n    # c\n    \\\n    1]\n", "f( # c\n    \\\n    a)\n"] {
        let tree = sittir_parity_tests::parsed(sittir_python::PythonGrammar, sittir_python::render::options::defaults(), source);
        let mut entries: Vec<_> = (0..sittir_core::read::descendant_count(&tree.tree().root_node()))
            .map(NodeIndex::new)
            .flat_map(|index| [TriviaSide::Leading, TriviaSide::Inner, TriviaSide::Trailing].map(|side| (index, side)))
            .flat_map(|(index, side)| tree.side_entries(index, side, false).into_iter().filter_map(move |entry| if let SideEntry::Source { span, .. } = entry { Some((span.start, index, side)) } else { None }))
            .collect();
        entries.sort_unstable_by_key(|&(start, ..)| start);
        let [(comment, at, side), (continuation, held, held_side)] = entries[..] else { panic!("{source:?}: a comment and a continuation, not {entries:?}") };
        assert_eq!((&source[comment as usize..=comment as usize], &source[continuation as usize..=continuation as usize]), ("#", "\\"), "{source:?}");
        assert_eq!((held, held_side), (at, side), "{source:?}: the continuation renders on the comment's side");
    }
}

#[test]
fn a_line_continuation_before_an_entry_trailing_a_list_s_last_item_renders_before_it() {
    renders_as_read!(
        sittir_python,
        sittir_python::PythonGrammar,
        "x = [1 \\\n    # c\n]\n" => "x = [1 \\\n# c\n]\n",
        "x = [1 \\\n    $ ]\n" => "x = [1 \\\n$]\n",
        "f(a \\\n    # c\n)\n" => "f(a \\\n# c\n)\n",
        "f(a \\\n    $\n)\n" => "f(a \\\n$)\n",
    );
}

#[test]
fn the_lines_after_a_line_continuation_in_brackets_take_the_writer_s_depth() {
    renders_as_read!(
        sittir_python,
        sittir_python::PythonGrammar,
        "x = [1\n    \\\n    # c ]\n" => "x = [1\n\\\n# c ]\n",
        "x = [1\n    \\\n    # c\n]\n" => "x = [1\n\\\n# c\n]\n",
        "x = [1\n    \\\n    $ ]\n" => "x = [1\n\\\n$]\n",
        "x = [1\n    \\\n    $\n]\n" => "x = [1\n\\\n$]\n",
        "f(a\n    \\\n    # c )\n" => "f(a\n\\\n# c )\n",
        "f(a\n    \\\n    # c\n)\n" => "f(a\n\\\n# c\n)\n",
        "f(a\n    \\\n    $ )\n" => "f(a\n\\\n$)\n",
        "f(a\n    \\\n    $\n)\n" => "f(a\n\\\n$)\n",
        "x = [ # c\n    \\\n    1]\n" => "x = [ # c\n\\\n1]\n",
        "f( # c\n    \\\n    a)\n" => "f( # c\n\\\na)\n",
        "x = [\n    # c\n    \\\n    1]\n" => "x = [# c\n\\\n1]\n",
    );
}
