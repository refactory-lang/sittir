//! The record writer over the corpus: every round-trip fixture source of each
//! grammar the typed reader reads, and the large Rust probe inputs, read
//! whole and one level deep, write their parsed records with no refusal; the
//! root's record is indexed at its row, and a second read of the tree writes
//! nothing.
#![cfg(feature = "arena")]

use sittir_core::arena::{Cell, RecordSink, TreeArena, WriteCell};
use sittir_core::read::{Depth, ReadCtx, ReadNode, ReadRoot};
use sittir_core::types::{NodeIndex, TreeId};
use sittir_parity_tests::{load_fixtures, ParityFixture};

const TREE: TreeId = TreeId(1);

/// The words every chunk of `arena` holds, to tell that a write added none.
fn written(arena: &TreeArena) -> Vec<usize> {
    (0..).map_while(|chunk| arena.arena().chunk(chunk).map(<[u32]>::len)).collect()
}

/// Writes the records of `source`'s tree read to `depth`, twice.
fn write<Root: ReadRoot + WriteCell<Trivia>, Trivia: Clone>(language: &tree_sitter::Language, source: &str, depth: Depth, shows: fn(sittir_core::types::KindId) -> bool) -> Result<(), String> {
    let mut parser = tree_sitter::Parser::new();
    parser.set_language(language).map_err(|e| e.to_string())?;
    let tree = parser.parse(source, None).ok_or("no parse")?;
    let mut ctx = ReadCtx::new(source, TREE, shows);
    let Ok(root) = Root::read_root(&mut tree.walk(), &mut ctx, depth) else { return Ok(()) };
    let mut arena = TreeArena::new();
    let cell = root.write_cell(&mut RecordSink::<Trivia>::parsed(TREE, &mut arena)).map_err(|e| format!("write: {e}"))?;
    if let Cell::Child { at, .. } = cell {
        if arena.record(NodeIndex::ROOT) != Some(at) {
            return Err(format!("the root's record {at:?} is not its row's"));
        }
    }
    let before = written(&arena);
    let again = root.write_cell(&mut RecordSink::<Trivia>::parsed(TREE, &mut arena)).map_err(|e| format!("rewrite: {e}"))?;
    if again != cell || written(&arena) != before {
        return Err("a second read of the tree wrote records".to_owned());
    }
    if let Ok(whole) = Root::read_root(&mut tree.walk(), &mut ctx, Depth::All) {
        whole.hydrate_records(&mut RecordSink::<Trivia>::parsed(TREE, &mut arena)).map_err(|e| format!("hydrate: {e}"))?;
        let mut expected = TreeArena::new();
        whole.write_cell(&mut RecordSink::<Trivia>::parsed(TREE, &mut expected)).map_err(|e| format!("whole write: {e}"))?;
        for row in (0..sittir_core::read::descendant_count(&tree.root_node())).map(NodeIndex::new) {
            if arena.record(row).is_some() != expected.record(row).is_some() {
                return Err(format!("native hydration disagrees with a whole read at row {row:?}"));
            }
        }
        let hydrated = written(&arena);
        whole.hydrate_records(&mut RecordSink::<Trivia>::parsed(TREE, &mut arena)).map_err(|e| format!("rehydrate: {e}"))?;
        if written(&arena) != hydrated {
            return Err("a repeated native hydration appended records or list runs".to_owned());
        }
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
    ($test:ident, $grammar:literal, $krate:ident, $extra:expr) => {
        #[test]
        fn $test() {
            let mut sources = sources($grammar);
            sources.extend($extra);
            assert!(!sources.is_empty(), "{} has round-trip fixtures", $grammar);
            let refused: Vec<String> = sources
                .iter()
                .enumerate()
                .flat_map(|(i, source)| {
                    [Depth::All, Depth::ONE].into_iter().filter_map(move |depth| {
                        write::<$krate::render::RenderRoot, $krate::render::node::TriviaNode>(&$krate::language(), source, depth, <$krate::render::AnyNode as ReadNode>::shows)
                            .err()
                            .map(|e| format!("{} source {i} at {depth:?}: {e}", $grammar))
                    })
                })
                .collect();
            assert!(refused.is_empty(), "{} of {} sources refused:\n{}", refused.len(), sources.len(), refused.join("\n"));
        }
    };
}

corpus!(every_rust_source_writes_its_records, "rust", sittir_rust, ["engine.rs", "spacing.rs"].map(probe_input));
corpus!(every_typescript_source_writes_its_records, "typescript", sittir_typescript, []);
corpus!(every_python_source_writes_its_records, "python", sittir_python, []);
