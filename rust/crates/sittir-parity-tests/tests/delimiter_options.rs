//! Probe, ignored: each parsed list's stored delimiter, by list kind, source
//! trailing flag, leading flag and whether it holds one item. Run one grammar
//! and corpus at a time:
//!
//! `SITTIR_DELIM_GRAMMAR=<lang> SITTIR_DELIM_CORPUS=<label>
//! SITTIR_DELIM_SOURCES=<file | list:<file of paths> | json:<paired-run corpus>>
//! SITTIR_DELIM_OUT=<jsonl> cargo test -p sittir-parity-tests --no-default-features
//! --features arena --test delimiter_options -- --ignored`
#![cfg(feature = "arena")]

use std::collections::BTreeMap;
use std::io::Write as _;

use sittir_core::arena::side::SideRecord;
use sittir_core::arena::{Address, ArenaRead, HydrateNode, RecordCells, RecordGrammar};
use sittir_core::engine::{Engine, EngineGrammar};
use sittir_core::nodes::{Kid, Nodes, Step, Visit};
use sittir_core::options::ResolvedOptions;
use sittir_core::read::Route;
use sittir_core::types::Delimiter;

#[derive(Default, serde::Serialize)]
struct Tally {
    grammar: String,
    corpus: String,
    sources: u64,
    lists: BTreeMap<String, u64>,
    cases: Vec<String>,
}

fn tally<G: RecordGrammar + Copy, N: HydrateNode + RecordCells>(grammar: G, options: fn() -> ResolvedOptions, name: &str, corpus: &str, sources: &[(String, String)]) -> Tally {
    let mut out = Tally { grammar: name.to_string(), corpus: corpus.to_string(), ..Tally::default() };
    for (label, source) in sources {
        out.sources += 1;
        let mut engine = Engine::new(grammar, options()).expect("an engine");
        let parsed = engine.parse_records::<N>(source).expect("a read");
        let Some(root) = parsed.root else { continue };
        engine
            .read_node(root, |tree, at| {
                let mut nodes = tree.nodes();
                let mut met: Vec<Kid> = Vec::new();
                nodes.walk(at, &mut |step, kid| {
                    if matches!(step, Step::Meet) {
                        met.push(*kid);
                    }
                    Visit::Enter
                });
                let arena = tree.records_arena();
                for kid in met {
                    let Some(named) = tree.name_at(kid.index) else { continue };
                    if named.site.is_some() {
                        continue;
                    }
                    let record = Address(named.node.0);
                    let side_at = Address(arena.words(record, 2).expect("a header")[1]);
                    let Some(delimiter) = SideRecord::read(arena, side_at).expect("a side record").delimiter else { continue };
                    let items = grammar.slot_routes(&mut nodes, &kid).map_or(0, |routed| routed.routes.iter().filter(|route| matches!(route, Route::Slot { .. })).count());
                    let trailing = delimiter.has(Delimiter::TRAILING);
                    let leading = delimiter.has(Delimiter::LEADING);
                    let list = grammar.kind_name(kid.grammar);
                    let key = format!("{}\t{list}\ttrailing={trailing}\tleading={leading}\tone_item={}", kid.grammar.0, items == 1);
                    *out.lists.entry(key).or_default() += 1;
                    if trailing && out.cases.len() < 400 {
                        let text = &source[kid.start as usize..kid.end as usize];
                        let tail: String = text.chars().rev().take(40).collect::<Vec<_>>().into_iter().rev().collect();
                        out.cases.push(format!("{label}\t{list}\t{}..{}\t…{}", kid.start, kid.end, tail.replace('\n', "\\n")));
                    }
                }
            })
            .expect("the records read")
            .expect("a read wrote the root's record");
    }
    out
}

fn sources_of(spec: &str) -> Vec<(String, String)> {
    let read = |path: &str| std::fs::read_to_string(path).unwrap_or_else(|e| panic!("{path}: {e}"));
    if let Some(list) = spec.strip_prefix("list:") {
        read(list).lines().filter(|line| !line.is_empty()).map(|path| (path.to_string(), read(path))).collect()
    } else if let Some(json) = spec.strip_prefix("json:") {
        let entries: Vec<serde_json::Value> = serde_json::from_str(&read(json)).expect("corpus json");
        entries.iter().enumerate().map(|(n, entry)| (format!("{json}#{n}"), entry["source"].as_str().expect("a source").to_string())).collect()
    } else {
        vec![(spec.to_string(), read(spec))]
    }
}

#[test]
#[ignore = "a probe over corpora named by the environment, run by hand"]
fn delimiter_options() {
    let grammar = std::env::var("SITTIR_DELIM_GRAMMAR").expect("SITTIR_DELIM_GRAMMAR");
    let corpus = std::env::var("SITTIR_DELIM_CORPUS").expect("SITTIR_DELIM_CORPUS");
    let sources = sources_of(&std::env::var("SITTIR_DELIM_SOURCES").expect("SITTIR_DELIM_SOURCES"));
    let out = match grammar.as_str() {
        "rust" => tally::<_, sittir_rust::render::AnyNode>(sittir_rust::RustGrammar, sittir_rust::render::options::defaults, &grammar, &corpus, &sources),
        "typescript" => tally::<_, sittir_typescript::render::AnyNode>(sittir_typescript::TypeScriptGrammar, sittir_typescript::render::options::defaults, &grammar, &corpus, &sources),
        "python" => tally::<_, sittir_python::render::AnyNode>(sittir_python::PythonGrammar, sittir_python::render::options::defaults, &grammar, &corpus, &sources),
        other => panic!("no grammar {other}"),
    };
    let mut line = serde_json::to_string(&out).expect("json");
    line.push('\n');
    std::fs::OpenOptions::new().create(true).append(true).open(std::env::var("SITTIR_DELIM_OUT").expect("SITTIR_DELIM_OUT")).expect("out").write_all(line.as_bytes()).expect("write");
}
