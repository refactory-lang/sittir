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

/// Every distinct round-trip fixture source of the grammar `grammar`.
///
/// # Panics
///
/// If the grammar's fixtures cannot be loaded (`load_fixtures`).
#[must_use]
pub fn fixture_sources(grammar: &str) -> Vec<String> {
    let mut sources: Vec<String> = load_fixtures(grammar)
        .into_iter()
        .filter_map(|fixture| match fixture {
            ParityFixture::RoundTrip(fixture) => Some(fixture.source_in),
            ParityFixture::Render { .. } => None,
        })
        .collect();
    sources.sort_unstable();
    sources.dedup();
    sources
}

/// What `$check` answers for each of the five grammars, by name: called
/// with the grammar's name, the grammar, and its default options.
#[macro_export]
macro_rules! each_grammar {
    ($check:ident) => {
        [
            ("python", $check("python", ::sittir_python::PythonGrammar, ::sittir_python::render::options::defaults)),
            ("regex", $check("regex", ::sittir_regex::RegexGrammar, ::sittir_regex::render::options::defaults)),
            ("rust", $check("rust", ::sittir_rust::RustGrammar, ::sittir_rust::render::options::defaults)),
            ("scm", $check("scm", ::sittir_scm::ScmGrammar, ::sittir_scm::render::options::defaults)),
            ("typescript", $check("typescript", ::sittir_typescript::TypeScriptGrammar, ::sittir_typescript::render::options::defaults)),
        ]
    };
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

/// A source table that holds no tree, so a node renders from what it holds
/// alone, as a snapshot does.
pub struct NoSources;

impl sittir_core::render::SourceTable for NoSources {
    fn source_of(&self, _tree_id: sittir_core::types::TreeId) -> Option<&std::sync::Arc<str>> {
        None
    }
}

/// `$source` parsed by `$krate`'s `$grammar` under its default options, its
/// root snapshot rendered.
#[macro_export]
macro_rules! snapshot_rendered {
    ($krate:ident, $grammar:expr, $source:expr) => {{
        let mut engine = ::sittir_core::engine::Engine::new($grammar, $krate::render::options::defaults()).expect("an engine");
        let tree = engine.parse($source, ::sittir_core::engine::claim_tree_id().expect("a tree id")).expect("a parse");
        let options = engine.options().clone();
        let root: $krate::render::AnyNode = tree.snapshot(::sittir_core::types::NodeIndex::ROOT, None).expect("a snapshot");
        let ctx = ::sittir_core::prepare::RenderContext { options: &options, sources: &$crate::NoSources };
        $krate::render::render_node_parts(::sittir_core::SlotValue::Node(root), &ctx, None).expect("a render").1
    }};
}

/// `$source` parsed by `$krate`'s `$grammar` under its default options with
/// every node's inner side written back (`edit_in_place`), so every node
/// renders from its template, read whole seating its sides, and rendered.
#[macro_export]
macro_rules! edited_rendered {
    ($krate:ident, $grammar:expr, $source:expr) => {{
        let mut engine = ::sittir_core::engine::Engine::new($grammar, $krate::render::options::defaults()).expect("an engine");
        let tree = engine.parse($source, ::sittir_core::engine::claim_tree_id().expect("a tree id")).expect("a parse");
        (0..::sittir_core::read::descendant_count(&tree.tree().root_node())).map(::sittir_core::types::NodeIndex::new).for_each(|index| $crate::edit_in_place(&tree, index));
        let root: $krate::render::AnyNode = ::sittir_core::read::read_at(&mut tree.tree().walk(), &mut tree.seating_ctx(), ::sittir_core::types::NodeIndex::ROOT, ::sittir_core::read::Depth::All).expect("a root");
        let options = engine.options().clone();
        let ctx = ::sittir_core::prepare::RenderContext { options: &options, sources: &tree };
        $krate::render::render_node_parts(::sittir_core::SlotValue::Node(root), &ctx, None).expect("a render").1
    }};
}

/// Each `$source` renders as it reads, from its root snapshot
/// (`snapshot_rendered`) and with every node edited (`edited_rendered`).
#[macro_export]
macro_rules! renders_as_read {
    ($krate:ident, $grammar:expr, $($source:expr),+ $(,)?) => {
        for source in [$($source),+] {
            let rendered = ($crate::snapshot_rendered!($krate, $grammar, source), $crate::edited_rendered!($krate, $grammar, source));
            assert_eq!((rendered.0.as_str(), rendered.1.as_str()), (source, source));
        }
    };
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

/// `tuple_chain`'s chain with each token on a line of its own, so every
/// level's gaps break the line.
#[must_use]
pub fn multiline_tuple_chain(levels: usize) -> String {
    format!("type T = {}u8{};\n", "(\n".repeat(levels), ",\n)".repeat(levels))
}

/// `levels` rust blocks, each holding the one before it, each brace on a
/// line of its own: every level is a stretch its template indents.
#[must_use]
pub fn block_chain(levels: usize) -> String {
    format!("fn f() {}{}\n", "{\n".repeat(levels), "}\n".repeat(levels))
}

/// `levels` rust blocks, each holding the one before it, all opened on one
/// line indented `levels` spaces, after two functions indented two spaces
/// so the source's unit stays two spaces: every block's first token lies
/// on that line.
#[must_use]
pub fn indented_block_line(levels: usize) -> String {
    format!("fn a() {{\n  a;\n}}\nfn b() {{\n  b;\n}}\nfn f() {{\n{}{}\n{}\n}}\n", " ".repeat(levels), "{".repeat(levels), "}".repeat(levels))
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
