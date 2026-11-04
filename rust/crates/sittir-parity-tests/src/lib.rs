//! Shared helpers for the parity-test integration tests. The actual
//! assertions live in `tests/parity.rs` — cargo's convention for
//! integration tests means each `tests/*.rs` is compiled as its own
//! binary. Helpers that multiple test files would share go here.
//!
//! Keeping `lib.rs` minimal so `cargo check -p sittir-parity-tests` on
//! its own compiles fast; the per-grammar test cases pull the heavy
//! dependencies (`sittir-{lang}`, `tree-sitter-{lang}`) only
//! when the integration-test binary builds.

use serde::Deserialize;

/// One entry in a grammar's `test-fixtures.json`. Discriminated by the
/// `kind` tag (`"render"` / `"roundtrip"`) — matches the shape emitted
/// by `packages/codegen/src/emitters/parity-fixtures.ts`.
#[derive(Debug, Deserialize)]
#[serde(tag = "kind")]
pub enum ParityFixture {
    #[serde(rename = "render")]
    Render {
        grammar: String,
        /// Kept opaque: the harness asserts round-trip fixtures only, so a
        /// render input is carried through without being read as a node.
        input: serde_json::Value,
        #[serde(rename = "expectedOutput")]
        expected_output: String,
    },

    #[serde(rename = "roundtrip")]
    RoundTrip(RoundTripFixture),
}

/// A round-trip entry: a source, the kind it is read as, and the reparse
/// the render must come back to.
#[derive(Debug, Deserialize)]
pub struct RoundTripFixture {
    pub grammar: String,
    #[serde(rename = "sourceIn")]
    pub source_in: String,
    pub pattern: String,
    pub edits: Vec<serde_json::Value>,
    #[serde(rename = "expectedSourceOut")]
    pub expected_source_out: String,
    #[serde(rename = "expectedReparseTree")]
    pub expected_reparse_tree: String,
    /// Rendered fragment wrapped in a supertype/direct-kind reparse
    /// context so tree-sitter can parse it standalone. Produced by
    /// the TS validator's `wrapForReparse` at capture time. The
    /// parity harness parses THIS text, not the bare rendered
    /// fragment (bare fragments like `"pub"` alone fail parse).
    #[serde(rename = "wrappedText", default)]
    pub wrapped_text: String,
    /// Byte offset within `wrapped_text` where the rendered
    /// fragment was spliced. The harness locates the subtree at
    /// this offset to compare against `expected_reparse_tree`.
    #[serde(rename = "wrappedOffset", default)]
    pub wrapped_offset: u32,
}

/// Load the fixture corpus for a grammar from disk. Path is relative
/// to the workspace root so `cargo test -p sittir-parity-tests` finds
/// it regardless of the caller's cwd.
///
/// # Panics
///
/// If the grammar's `test-fixtures.json` is missing or malformed; codegen
/// writes it.
#[must_use]
pub fn load_fixtures(grammar: &str) -> Vec<ParityFixture> {
    let path = format!(
        "{}/../sittir-{}/test-fixtures.json",
        env!("CARGO_MANIFEST_DIR"),
        grammar,
    );
    let json = std::fs::read_to_string(&path).unwrap_or_else(|e| {
        panic!("failed to read {path}: {e}. Run `npx tsx packages/codegen/src/cli.ts --grammar {grammar} --all --output packages/{grammar}/src` to regenerate.")
    });
    serde_json::from_str(&json)
        .unwrap_or_else(|e| panic!("failed to parse fixtures for {grammar}: {e}"))
}

/// Writes the node at `index` its own inner side back, unchanged: a write in
/// its range, so its render is its template's, with no text changed. A test
/// harness only; no engine path writes a side to force a template.
///
/// # Panics
///
/// When the store refuses the write.
pub fn edit_in_place<G: sittir_core::engine::EngineGrammar>(tree: &sittir_core::engine::ParsedTree<G>, index: sittir_core::types::NodeIndex) {
    let inner = sittir_core::trivia_table::TriviaSide::Inner;
    tree.write_trivia_side(index, inner, tree.trivia_side(index, inner)).expect("the node's own side writes back");
}

/// A fresh parse of `source` by an engine of its own, so no cache one read
/// fills answers another.
///
/// # Panics
///
/// When the engine cannot be built or the source does not parse.
#[must_use]
pub fn parsed<G: sittir_core::engine::EngineGrammar>(grammar: G, options: sittir_core::options::ResolvedOptions, source: &str) -> sittir_core::engine::ParsedTree<G> {
    let mut engine = sittir_core::engine::Engine::new(grammar, options).expect("an engine");
    engine.parse(source, sittir_core::engine::claim_tree_id().expect("a tree id")).expect("a parse")
}

/// A fresh parse of the rust `source` under the default options (`parsed`).
///
/// # Panics
///
/// When the engine cannot be built or the source does not parse.
#[must_use]
pub fn parsed_rust(source: &str) -> sittir_core::engine::ParsedTree<sittir_rust::RustGrammar> {
    parsed(sittir_rust::RustGrammar, sittir_rust::render::options::defaults(), source)
}

/// `levels` rust tuple types, each holding the one before it: `((u8,),)`.
#[must_use]
pub fn tuple_chain(levels: usize) -> String {
    format!("type T = {}u8{};\n", "(".repeat(levels), ",)".repeat(levels))
}

/// What `f` answers, run on a thread whose 64 MiB stack every read these
/// tests make of a deep tree fits on, a 64,000-level chain included.
///
/// # Panics
///
/// When the thread cannot be spawned, or `f` panics.
pub fn on_deep_stack<T: Send + 'static>(f: impl FnOnce() -> T + Send + 'static) -> T {
    std::thread::Builder::new().stack_size(64 * 1024 * 1024).spawn(f).expect("a thread").join().expect("no panic")
}

/// A source of the shared-arena transport probe's inputs, by file name.
///
/// # Panics
///
/// When the input cannot be read.
#[must_use]
pub fn probe_input(name: &str) -> String {
    let path = format!("{}/../../../docs/superpowers/probes/2026-10-01-shared-arena/transport/inputs/{name}", env!("CARGO_MANIFEST_DIR"));
    std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("{path}: {e}"))
}
