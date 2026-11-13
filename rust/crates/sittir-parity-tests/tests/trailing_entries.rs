//! An entry, a comment or an `ERROR`, that trails a list's last item takes
//! that item's trailing side, and every member of its gap before it, a run
//! or a line continuation, goes with it: the members of one side render in
//! source order. The lines after the gap keep their levels, since the
//! excess the moved runs change is restored at the end of the item's side.
//! Each source renders as it reads with every node edited in place, and so
//! does its snapshot (`packages/tools/tests/snapshot-one-rule.test.ts`). The members after an entry that leads a list's first
//! item go with that entry likewise.

use sittir_core::read::SideEntry;
use sittir_core::trivia_table::TriviaSide;
use sittir_core::types::NodeIndex;
use sittir_parity_tests::renders_as_read;

#[test]
fn a_run_before_an_entry_trailing_a_list_s_last_item_renders_before_it() {
    renders_as_read!(
        sittir_rust,
        sittir_rust::RustGrammar,
        "fn f() {\n    let p = P { a: 1\n        /* c */ };\n}\n",
        "fn f() {\n    let p = P { a: 1\n        $ };\n}\n",
        "fn f() {\n    g(a\n        \\ );\n}\n",
        "fn f() {\n    let v = [1\n        /* c */ ];\n}\n",
        "struct S {\n    a: u8\n    $ }\n",
        "enum E {\n    A\n    /* c */ }\n",
        "fn f(a: u8\n    /* c */ ) {}\n",
        "use a::{b\n    $ };\n",
    );
    renders_as_read!(sittir_python, sittir_python::PythonGrammar, "x = [1\n    # c\n]\n", "f(a\n    # c\n)\n", "x = {1: 2\n    # c\n}\n", "def f(a\n    # c\n):\n    pass\n");
    renders_as_read!(
        sittir_typescript,
        sittir_typescript::TypeScriptGrammar,
        "type T = { a: 1\n  /* c */ };\n",
        "function f(a\n  /* c */ ) {}\n",
        "enum E {\n  A\n  # }\n",
        "interface I {\n  a: 1\n  \\ }\n",
        "import { a\n  /* c */ } from 'm';\n",
    );
}

#[test]
fn the_line_after_an_entry_trailing_a_list_s_last_item_keeps_its_level() {
    renders_as_read!(
        sittir_rust,
        sittir_rust::RustGrammar,
        "fn f() {\n    let p = P { a: 1\n        /* c */\n    };\n}\n",
        "fn f() {\n    let p = P { a: 1\n        $\n    };\n}\n",
        "fn f() {\n    g(a\n        // c\n    );\n}\n",
        "fn f() {\n    let t = (1, 2\n        \\\n    );\n}\n",
        "fn f() {\n    let p = P { a: 1\n        /* c */\n        };\n}\n",
        "struct S {\n    a: u8\n    // c\n}\n",
    );
    renders_as_read!(sittir_python, sittir_python::PythonGrammar, "x = [\n    1\n        # c\n    ]\n", "x = (1, 2\n    # c\n)\n");
    renders_as_read!(sittir_typescript, sittir_typescript::TypeScriptGrammar, "type T = { a: 1\n  // c\n};\n", "enum E {\n  A\n  #\n}\n", "import { a\n  /* c */\n} from 'm';\n");
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
    renders_as_read!(sittir_python, sittir_python::PythonGrammar, "x = [1 \\\n    # c\n]\n", "x = [1 \\\n    $ ]\n", "f(a \\\n    # c\n)\n", "f(a \\\n    $\n)\n");
}

#[test]
fn the_line_after_a_line_continuation_in_brackets_keeps_its_level() {
    renders_as_read!(
        sittir_python,
        sittir_python::PythonGrammar,
        "x = [1\n    \\\n    # c ]\n",
        "x = [1\n    \\\n    # c\n]\n",
        "x = [1\n    \\\n    $ ]\n",
        "x = [1\n    \\\n    $\n]\n",
        "f(a\n    \\\n    # c )\n",
        "f(a\n    \\\n    # c\n)\n",
        "f(a\n    \\\n    $ )\n",
        "f(a\n    \\\n    $\n)\n",
        "x = [ # c\n    \\\n    1]\n",
        "f( # c\n    \\\n    a)\n",
        "x = [\n    # c\n    \\\n    1]\n",
    );
}
