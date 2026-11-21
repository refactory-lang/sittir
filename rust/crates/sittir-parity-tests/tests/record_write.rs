//! A read over the corpus: every round-trip fixture source of each grammar
//! the typed reader reads, and the large Rust probe inputs, reads to
//! records with no refusal, and a second read of the same source by the
//! same engine writes as many entries as the first.
#![cfg(feature = "arena")]

use sittir_core::arena::{Address, ArenaRead, HydrateNode, RecordCells, MAX_CHUNKS};
use sittir_core::engine::{Engine, EngineGrammar};
use sittir_parity_tests::{load_fixtures, ParityFixture};

/// The entries reads wrote in `engine`'s arena.
fn written<G: EngineGrammar>(engine: &Engine<G>) -> usize {
    let built = engine.written().built();
    (1..MAX_CHUNKS)
        .filter(|&n| built.read_chunk(n))
        .filter_map(|n| Some((n, u32::try_from(built.chunk(n)?.len()).ok()?)))
        .map(|(n, len)| (0..len).filter(|&word| Address::new(n, word).is_some_and(|at| built.read_entry(at))).count())
        .sum()
}

/// Reads `source` twice in a fresh engine of `grammar`.
fn write<G: EngineGrammar, N: HydrateNode + RecordCells>(grammar: G, options: sittir_core::options::ResolvedOptions, source: &str) -> Result<(), String> {
    let mut engine = Engine::new(grammar, options).expect("an engine");
    engine.parse_records::<N>(source).map_err(|e| format!("read: {e}"))?;
    let first = written(&engine);
    engine.parse_records::<N>(source).map_err(|e| format!("reread: {e}"))?;
    if written(&engine) != first * 2 {
        return Err(format!("a second read wrote {} entries where the first wrote {first}", written(&engine) - first));
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
            let refused: Vec<String> = sources
                .iter()
                .enumerate()
                .filter_map(|(i, source)| write::<_, $krate::render::AnyNode>($krate::$engine, $krate::render::options::defaults(), source).err().map(|e| format!("{} source {i}: {e}", $grammar)))
                .collect();
            assert!(refused.is_empty(), "{} of {} sources refused:\n{}", refused.len(), sources.len(), refused.join("\n"));
        }
    };
}

corpus!(every_rust_source_reads_to_records, "rust", sittir_rust, RustGrammar, ["engine.rs", "spacing.rs"].map(probe_input));
corpus!(every_typescript_source_reads_to_records, "typescript", sittir_typescript, TypeScriptGrammar, []);
corpus!(every_python_source_reads_to_records, "python", sittir_python, PythonGrammar, []);
