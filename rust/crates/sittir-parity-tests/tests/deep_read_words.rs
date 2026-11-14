//! A read's records, word for word. A fixture source per grammar is read
//! (`Engine::parse_records`), and every word of every chunk the read wrote
//! hashes to the value recorded here. How a walk moves through the tree
//! leaves these words as they are; a change to what a record holds changes
//! them, and the values with it.
#![cfg(feature = "arena")]

use sittir_core::arena::{ArenaRead, HydrateNode, RecordCells, MAX_CHUNKS};
use sittir_core::engine::{Engine, EngineGrammar};
use sittir_core::options::ResolvedOptions;

/// What a read wrote: its chunks, the words of each through its last
/// non-zero one, and the FNV-1a hash of every word's little-endian bytes in
/// chunk order.
#[derive(Debug, PartialEq, Eq)]
struct ArenaWords {
    chunks: u32,
    words: usize,
    hash: u64,
}

fn deep_read<G: EngineGrammar, N: HydrateNode + RecordCells>(grammar: G, options: ResolvedOptions, source: &str) -> ArenaWords {
    let mut engine = Engine::new(grammar, options).expect("an engine");
    let parsed = engine.parse_records::<N>(source).expect("a read");
    assert!(parsed.errors.is_empty(), "the fixture parses without an ERROR");
    parsed.root.expect("a root record");
    let built = engine.written().built();
    let mut words = ArenaWords { chunks: 0, words: 0, hash: 0xcbf2_9ce4_8422_2325 };
    for chunk in (1..MAX_CHUNKS).filter(|&n| built.read_chunk(n)).filter_map(|n| built.chunk(n)) {
        for byte in chunk.iter().flat_map(|word| word.to_le_bytes()) {
            words.hash = (words.hash ^ u64::from(byte)).wrapping_mul(0x0100_0000_01b3);
        }
        words.words += chunk.iter().rposition(|&word| word != 0).map_or(0, |last| last + 1);
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
    assert_eq!(words, ArenaWords { chunks: 4, words: 62092, hash: 13_531_523_186_096_033_608 });
}

#[test]
fn the_typescript_fixture_tree_reads_to_the_same_words() {
    let words = deep_read::<_, sittir_typescript::render::AnyNode>(sittir_typescript::TypeScriptGrammar, sittir_typescript::render::options::defaults(), &probe_input("create-engine.ts"));
    assert_eq!(words, ArenaWords { chunks: 3, words: 35611, hash: 13_214_903_945_338_385_849 });
}

#[test]
fn the_python_fixture_tree_reads_to_the_same_words() {
    let words = deep_read::<_, sittir_python::render::AnyNode>(sittir_python::PythonGrammar, sittir_python::render::options::defaults(), PYTHON);
    assert_eq!(words, ArenaWords { chunks: 1, words: 6050, hash: 14_170_386_775_326_102_481 });
}

#[test]
fn the_regex_fixture_tree_reads_to_the_same_words() {
    let words = deep_read::<_, sittir_regex::render::AnyNode>(sittir_regex::RegexGrammar, sittir_regex::render::options::defaults(), REGEX);
    assert_eq!(words, ArenaWords { chunks: 1, words: 1426, hash: 2_415_744_108_250_617_198 });
}

#[test]
fn the_scm_fixture_tree_reads_to_the_same_words() {
    let words = deep_read::<_, sittir_scm::render::AnyNode>(sittir_scm::ScmGrammar, sittir_scm::render::options::defaults(), SCM);
    assert_eq!(words, ArenaWords { chunks: 1, words: 1744, hash: 16_262_967_867_265_593_082 });
}
