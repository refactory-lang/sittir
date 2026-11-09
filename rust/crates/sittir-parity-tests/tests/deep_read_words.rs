//! The deep read's records, word for word. A fixture tree per grammar is read
//! to every depth through the deep read's entry point (`ParsedTree::read_record`
//! at the root, `Depth::All`), and every word of every chunk of its arena
//! hashes to the value recorded here. How a walk moves through the tree leaves
//! these words as they are; a change to what a record holds changes them, and
//! the values with it.
#![cfg(feature = "arena")]

use sittir_core::arena::{HydrateNode, RecordCells};
use sittir_core::engine::{claim_tree_id, Engine, EngineGrammar};
use sittir_core::options::ResolvedOptions;
use sittir_core::read::Depth;
use sittir_core::types::NodeIndex;

/// A tree's arena after its deep read: its chunks, their words, and the
/// FNV-1a hash of those words' little-endian bytes in chunk order.
#[derive(Debug, PartialEq, Eq)]
struct ArenaWords {
    chunks: u32,
    words: usize,
    hash: u64,
}

fn deep_read<G: EngineGrammar, N: HydrateNode + RecordCells>(grammar: G, options: ResolvedOptions, source: &str) -> ArenaWords {
    let mut engine = Engine::new(grammar, options).expect("an engine");
    let tree = engine.parse(source, claim_tree_id().expect("a tree id")).expect("a parse");
    assert!(!tree.tree().root_node().has_error(), "the fixture parses without an ERROR");
    tree.read_record::<N>(NodeIndex::ROOT, Depth::All).expect("a whole read").expect("a root record");
    let mut words = ArenaWords { chunks: 0, words: 0, hash: 0xcbf2_9ce4_8422_2325 };
    while let Some(chunk) = tree.record_chunk(words.chunks) {
        for byte in chunk.iter().flat_map(|word| word.to_le_bytes()) {
            words.hash = (words.hash ^ u64::from(byte)).wrapping_mul(0x0100_0000_01b3);
        }
        words.words += chunk.len();
        words.chunks += 1;
    }
    words
}

fn probe_input(name: &str) -> String {
    let path = format!("{}/../../../docs/superpowers/probes/2026-10-01-shared-arena/transport/inputs/{name}", env!("CARGO_MANIFEST_DIR"));
    std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("{path}: {e}"))
}

const PYTHON: &str = r#""""A module."""
from __future__ import annotations
import os, sys as system
from collections import defaultdict  # a comment


@decorator(arg=1)
class Thing(Base, metaclass=Meta):
    """A class."""

    count: int = 0

    def __init__(self, *args, key=None, **kwargs) -> None:
        super().__init__()
        self.items = [x * 2 for x in args if x > 0]
        self.table = {k: v for k, v in kwargs.items()}

    async def run(self, value: int | None = None):
        async with lock as held, other():
            try:
                result = await self.fetch(value) or default
            except (KeyError, ValueError) as error:
                raise RuntimeError("bad") from error
            finally:
                pass
        return lambda y, *z: (y, z)


def gen(n):
    while n:
        n -= 1
        yield n
    else:
        del n
    match command:
        case [first, *rest] if first:
            print(f"{first!r:>10}", rest)
        case {"key": value, **others}:
            pass
        case Point(x=0) | None:
            flag = not True
    assert n == 0, "message"
    x = a if b else c
    s = items[1:2, ::3]
"#;

const REGEX: &str = r"^(?<year>\d{4})-(?:0[1-9]|1[0-2])\b[a-z\s\-]*?(foo|bar)+\k<year>(?=x)(?!y)\u{1F600}.$";

const SCM: &str = r#"; a comment
(function_declaration
  name: (identifier) @name
  parameters: (formal_parameters (_)* @params)
  body: (_)? @body) @function

[
  (string)
  (template_string)
] @string

((identifier) @constant
 (#match? @constant "^[A-Z][A-Z_]+$")
 (#set! priority 100))

(call_expression
  function: (member_expression
    object: (identifier) @object
    property: (property_identifier) @method)
  arguments: (arguments . (_) @first (_)+ .))

(comment)+ @comments
(_ !body) @no_body
"keyword" @keyword
"#;

#[test]
fn the_rust_fixture_tree_reads_to_the_same_words() {
    let words = deep_read::<_, sittir_rust::render::AnyNode>(sittir_rust::RustGrammar, sittir_rust::render::options::defaults(), &probe_input("engine.rs"));
    assert_eq!(words, ArenaWords { chunks: 6, words: 32093, hash: 3_788_005_338_864_555_816 });
}

#[test]
fn the_typescript_fixture_tree_reads_to_the_same_words() {
    let words = deep_read::<_, sittir_typescript::render::AnyNode>(sittir_typescript::TypeScriptGrammar, sittir_typescript::render::options::defaults(), &probe_input("create-engine.ts"));
    assert_eq!(words, ArenaWords { chunks: 5, words: 20268, hash: 12_647_129_669_050_208_885 });
}

#[test]
fn the_python_fixture_tree_reads_to_the_same_words() {
    let words = deep_read::<_, sittir_python::render::AnyNode>(sittir_python::PythonGrammar, sittir_python::render::options::defaults(), PYTHON);
    assert_eq!(words, ArenaWords { chunks: 3, words: 3188, hash: 9_061_050_001_377_134_087 });
}

#[test]
fn the_regex_fixture_tree_reads_to_the_same_words() {
    let words = deep_read::<_, sittir_regex::render::AnyNode>(sittir_regex::RegexGrammar, sittir_regex::render::options::defaults(), REGEX);
    assert_eq!(words, ArenaWords { chunks: 2, words: 1510, hash: 10_787_959_137_074_837_586 });
}

#[test]
fn the_scm_fixture_tree_reads_to_the_same_words() {
    let words = deep_read::<_, sittir_scm::render::AnyNode>(sittir_scm::ScmGrammar, sittir_scm::render::options::defaults(), SCM);
    assert_eq!(words, ArenaWords { chunks: 1, words: 872, hash: 1_790_475_019_828_342_815 });
}
