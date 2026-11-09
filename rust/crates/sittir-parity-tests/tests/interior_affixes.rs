use std::collections::{BTreeMap, HashMap};

use sittir_core::read::{display_id, grammar_id, Interior, ReadNode, Router};
use sittir_core::tree_sitter;
use sittir_parity_tests::fixture_sources;

/// Per kind: tokens read by their affixes, and how many of those the
/// interior's pattern does not match (read verbatim).
#[derive(Default, Debug)]
struct Tally {
    read: usize,
    verbatim: usize,
    scanned: bool,
}

fn groups(found: Option<sittir_core::read::InteriorCaptures<'_>>, names: &[&str]) -> Option<Vec<Option<(usize, usize, String)>>> {
    found.map(|captures| names.iter().map(|name| captures.name(name).map(|group| (group.start(), group.end(), group.as_str().to_owned()))).collect())
}

fn parse(language: &tree_sitter::Language, source: &str) -> tree_sitter::Tree {
    let mut parser = tree_sitter::Parser::new();
    parser.set_language(language).expect("the grammar's language");
    parser.parse(source, None).expect("a parse")
}

fn visit<'tree>(tree: &'tree tree_sitter::Tree, mut each: impl FnMut(tree_sitter::Node<'tree>)) {
    let mut cursor = tree.walk();
    let mut descending = true;
    loop {
        if descending {
            each(cursor.node());
        }
        if descending && cursor.goto_first_child() {
            continue;
        }
        if cursor.goto_next_sibling() {
            descending = true;
            continue;
        }
        if !cursor.goto_parent() {
            break;
        }
        descending = false;
    }
}

fn interior<N: ReadNode>(node: &tree_sitter::Node<'_>) -> Option<(&'static Interior, &'static [&'static str])> {
    match N::router(grammar_id(node), display_id(node)) {
        Some(Router::Interior(interior, names)) => Some((interior, names)),
        _ => None,
    }
}

fn affixed_tokens<N: ReadNode>(grammar: &str, language: &tree_sitter::Language, extra: &[&str]) -> BTreeMap<String, Tally> {
    let mut by_pattern: HashMap<&'static str, Interior> = HashMap::new();
    let mut tallies: BTreeMap<String, Tally> = BTreeMap::new();
    let sources = fixture_sources(grammar).into_iter().chain(extra.iter().map(|source| (*source).to_owned()));
    for source in sources {
        let tree = parse(language, &source);
        visit(&tree, |node| {
            let Some((interior, names)) = interior::<N>(&node) else { return };
            let Some((_, _, checked)) = interior.affixes() else { return };
            let text = &source[sittir_core::types::Span::of(&node).range()];
            let reference = by_pattern.entry(interior.pattern()).or_insert_with(|| Interior::new(interior.pattern()));
            let expected = groups(reference.captures(text), names);
            assert_eq!(groups(interior.captures(text), names), expected, "{grammar} {} {text:?}", node.kind());
            let tally = tallies.entry(node.kind().to_owned()).or_default();
            tally.read += 1;
            tally.verbatim += usize::from(expected.is_none());
            tally.scanned = checked;
        });
    }
    tallies
}

#[test]
fn every_token_read_by_its_affixes_reads_as_its_interior_s_pattern_reads_it() {
    let all = [
        ("rust", affixed_tokens::<sittir_rust::render::AnyNode>("rust", &sittir_rust::language(), &[])),
        (
            "typescript",
            affixed_tokens::<sittir_typescript::render::AnyNode>(
                "typescript",
                &sittir_typescript::language(),
                &[
                    "#!/usr/bin/env node\n/**/ /***/ /****/\n/** doc\n * more\n */\nlet a = 0x1fn, b = 0b1n, c = 0o7n, d = 10n; // end\n",
                    "let s = '\\x1 \\u12 \\8 \\u{12345} \\q \\\n';\nlet t = `\\x1 \\u{zz} ${s}`;\n",
                    "let r = '\\x41\\u0041\\u{41}\\101\\n\\\\';\n",
                ],
            ),
        ),
        ("python", affixed_tokens::<sittir_python::render::AnyNode>("python", &sittir_python::language(), &[])),
        ("scm", affixed_tokens::<sittir_scm::render::AnyNode>("scm", &sittir_scm::language(), &[])),
        ("regex", affixed_tokens::<sittir_regex::render::AnyNode>("regex", &sittir_regex::language(), &[])),
    ];
    for (grammar, tallies) in &all {
        eprintln!("{grammar}: {tallies:?}");
        assert!(!tallies.is_empty(), "{grammar} reads some token by its affixes");
    }
    let scanned: Vec<&str> = all.iter().flat_map(|(_, tallies)| tallies.iter().filter(|(_, tally)| tally.scanned).map(|(kind, _)| kind.as_str())).collect();
    assert!(scanned.contains(&"escape_sequence") && scanned.contains(&"comment"), "typescript's escape sequences and python's comments are scanned: {scanned:?}");
}

#[test]
fn an_escape_sequence_its_scanner_lexes_is_read_verbatim_when_its_interior_refuses_it() {
    let tree = parse(&sittir_typescript::language(), "let s = '\\x41';\n");
    let mut found = None;
    visit(&tree, |node| {
        if node.kind() == "escape_sequence" {
            found = interior::<sittir_typescript::render::AnyNode>(&node);
        }
    });
    let (escape, names) = found.expect("an escape sequence read by its interior");
    assert_eq!(escape.affixes(), Some(("\\", "", true)), "an escape sequence is scanned, so its interior checks its pattern");
    assert!(escape.captures("\\x41").is_some());
    for refused in ["\\x1", "\\u12", "\\u{zz}", "\\"] {
        assert_eq!(groups(escape.captures(refused), names), None, "{refused:?} is read verbatim");
        assert_eq!(groups(Interior::new(escape.pattern()).captures(refused), names), None, "its pattern refuses {refused:?}");
    }
}
