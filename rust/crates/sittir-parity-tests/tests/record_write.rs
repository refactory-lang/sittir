//! Native hydration over the corpus: every round-trip fixture source of each
//! grammar the typed reader reads, and the large Rust probe inputs, read
//! whole and one level deep, hydrate their parsed records with no refusal;
//! the root's record is the one every later read reaches, a second read of
//! the tree writes nothing, and a shallow read deepened by hydration holds a
//! record at the rows a whole read does.
#![cfg(feature = "arena")]

use sittir_core::arena::{HydrateNode, RecordCells};
use sittir_core::engine::{claim_tree_id, Engine, EngineGrammar, ParsedTree};
use sittir_core::read::Depth;
use sittir_core::types::NodeIndex;
use sittir_parity_tests::{load_fixtures, ParityFixture};

/// The words every chunk of `tree`'s arena holds, to tell that a read added
/// none.
fn written<G: EngineGrammar>(tree: &ParsedTree<G>) -> Vec<usize> {
    (0..).map_while(|chunk| tree.record_chunk(chunk).map(|words| words.len())).collect()
}

/// The rows of `tree` that hold a record.
fn rows<G: EngineGrammar, N: HydrateNode + RecordCells>(tree: &ParsedTree<G>) -> Vec<NodeIndex> {
    (0..sittir_core::read::descendant_count(&tree.tree().root_node())).map(NodeIndex::new).filter(|&row| tree.written_record::<N>(row).is_some()).collect()
}

/// Hydrates the records of `source`'s tree read to `depth`, twice, then
/// deepens them to the whole tree, twice.
fn write<G: EngineGrammar, N: HydrateNode + RecordCells>(engine: &mut Engine<G>, source: &str, depth: Depth) -> Result<(), String> {
    let mut parse = || engine.parse(source, claim_tree_id().ok_or("no tree id left")?);
    let tree = parse()?;
    let Some(root) = tree.read_record::<N>(NodeIndex::ROOT, depth).map_err(|e| format!("read: {e}"))? else { return Ok(()) };
    if tree.written_record::<N>(NodeIndex::ROOT) != Some(root) {
        return Err(format!("the root's record {root:?} is not the one a later read reaches"));
    }
    let before = written(&tree);
    if tree.read_record::<N>(NodeIndex::ROOT, depth).map_err(|e| format!("reread: {e}"))? != Some(root) || written(&tree) != before {
        return Err("a second read of the tree wrote records".to_owned());
    }
    tree.hydrate_record::<N>(NodeIndex::ROOT, Depth::All).map_err(|e| format!("hydrate: {e}"))?;
    let whole = parse()?;
    whole.read_record::<N>(NodeIndex::ROOT, Depth::All).map_err(|e| format!("whole read: {e}"))?;
    if rows::<G, N>(&tree) != rows::<G, N>(&whole) {
        return Err("a shallow read deepened by hydration holds records at other rows than a whole read".to_owned());
    }
    let hydrated = written(&tree);
    tree.hydrate_record::<N>(NodeIndex::ROOT, Depth::All).map_err(|e| format!("rehydrate: {e}"))?;
    if written(&tree) != hydrated {
        return Err("a repeated hydration appended records or list runs".to_owned());
    }
    Ok(())
}

fn sources(grammar: &str) -> Vec<String> {
    load_fixtures(grammar)
        .into_iter()
        .filter_map(|fixture| match fixture {
            ParityFixture::RoundTrip(fixture) => Some(fixture.source_in),
            ParityFixture::Render { .. } => None,
        })
        .collect()
}

fn probe_input(name: &str) -> String {
    let path = format!("{}/../../../docs/superpowers/probes/2026-10-01-shared-arena/transport/inputs/{name}", env!("CARGO_MANIFEST_DIR"));
    std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("{path}: {e}"))
}

macro_rules! corpus {
    ($test:ident, $grammar:literal, $krate:ident, $engine:ident, $extra:expr) => {
        #[test]
        fn $test() {
            let mut sources = sources($grammar);
            sources.extend($extra);
            assert!(!sources.is_empty(), "{} has round-trip fixtures", $grammar);
            let mut engine = Engine::new($krate::$engine, $krate::render::options::defaults()).expect("an engine");
            let refused: Vec<String> = sources
                .iter()
                .enumerate()
                .flat_map(|(i, source)| [Depth::All, Depth::ONE].map(|depth| (i, source, depth)))
                .filter_map(|(i, source, depth)| write::<_, $krate::render::AnyNode>(&mut engine, source, depth).err().map(|e| format!("{} source {i} at {depth:?}: {e}", $grammar)))
                .collect();
            assert!(refused.is_empty(), "{} of {} sources refused:\n{}", refused.len(), sources.len(), refused.join("\n"));
        }
    };
}

corpus!(every_rust_source_hydrates_its_records, "rust", sittir_rust, RustGrammar, ["engine.rs", "spacing.rs"].map(probe_input));
corpus!(every_typescript_source_hydrates_its_records, "typescript", sittir_typescript, TypeScriptGrammar, []);
corpus!(every_python_source_hydrates_its_records, "python", sittir_python, PythonGrammar, []);
