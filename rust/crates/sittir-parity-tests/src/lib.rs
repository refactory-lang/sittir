//! Shared helpers for the parity-test integration tests. The actual
//! assertions live in `tests/parity.rs` — cargo's convention for
//! integration tests means each `tests/*.rs` is compiled as its own
//! binary. Helpers that multiple test files would share go here.
//!
//! Keeping `lib.rs` minimal so `cargo check -p sittir-parity-tests` on
//! its own compiles fast; the per-grammar test cases pull the heavy
//! dependencies (`sittir-{lang}`, `tree-sitter-{lang}`) only
//! when the integration-test binary builds.

use sittir_core::tree_sitter;
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
pub fn edit_in_place<G: sittir_core::engine::EngineGrammar>(tree: &mut sittir_core::engine::ParsedTree<G>, index: sittir_core::types::NodeIndex) {
    let inner = sittir_core::trivia_table::TriviaSide::Inner;
    tree.write_trivia_side(index, inner, tree.trivia_side(index, inner)).expect("the node's own side writes back");
}

/// `tree` read whole into plain data that names no tree: each node with its
/// span measured from the source's start, and each side's extras and
/// `ERROR`s as their text.
///
/// # Errors
///
/// A node the read refuses.
pub fn plain_read<G: sittir_core::engine::EngineGrammar, N: sittir_core::read::ReadNode>(tree: &sittir_core::engine::ParsedTree<G>) -> Result<N, sittir_core::read::ReadError> {
    let seating = tree.seating();
    let mut ctx = seating.ctx().snapshot(sittir_core::read::SnapshotCtx::new(tree.lines(), Some(0), sittir_core::types::NodeIndex::ROOT));
    sittir_core::read::read_at::<N>(&mut seating.cursor(sittir_core::types::NodeIndex::ROOT), &mut ctx, sittir_core::types::NodeIndex::ROOT, sittir_core::read::Depth::All)
}

/// `$source` parsed by `$krate`'s `$grammar` under its default options with
/// every node's inner side written back (`edit_in_place`), so every node
/// renders from its template, read whole seating its sides, and rendered.
#[macro_export]
macro_rules! edited_rendered {
    ($krate:ident, $grammar:expr, $source:expr) => {{
        let mut engine = ::sittir_core::engine::Engine::new($grammar, $krate::render::options::defaults()).expect("an engine");
        let mut tree = engine.parse($source, ::sittir_core::engine::claim_tree_id().expect("a tree id")).expect("a parse");
        (0..::sittir_core::read::descendant_count(&tree.tree().root_node())).map(::sittir_core::types::NodeIndex::new).for_each(|index| $crate::edit_in_place(&mut tree, index));
        let seating = tree.seating();
        let root: $krate::render::AnyNode = ::sittir_core::read::read_at(&mut seating.cursor(::sittir_core::types::NodeIndex::ROOT), &mut seating.ctx(), ::sittir_core::types::NodeIndex::ROOT, ::sittir_core::read::Depth::All).expect("a root");
        let options = engine.options().clone();
        let ctx = ::sittir_core::prepare::RenderContext::new(&options, &seating);
        $krate::render::render_node_parts(::sittir_core::SlotValue::Node(root), &ctx, None).expect("a render").1
    }};
}

/// Each `$source` renders as it reads with every node edited
/// (`edited_rendered`).
#[macro_export]
macro_rules! renders_as_read {
    ($krate:ident, $grammar:expr, $($source:expr),+ $(,)?) => {
        for source in [$($source),+] {
            assert_eq!($crate::edited_rendered!($krate, $grammar, source), source);
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

/// A tree's trivia with every layout owner placed (`Placement::place_all`), and
/// the sides its tables hold.
pub struct PlacedTrivia {
    pub placement: sittir_core::trivia_table::Placement,
    sides: std::collections::BTreeMap<(sittir_core::types::NodeIndex, sittir_core::trivia_table::TriviaSide), Vec<sittir_core::trivia_table::Assigned>>,
}

impl PlacedTrivia {
    /// The trivia of `tree`, parsed from `source`, whose grammar's surface
    /// kinds are `kinds` and whose indentation level is `unit` spaces wide.
    #[must_use]
    pub fn of(tree: &tree_sitter::Tree, source: &str, kinds: sittir_core::trivia_table::SurfaceKinds, unit: u32) -> Self {
        let lines = sittir_core::points::LineTable::new(source);
        let placement = sittir_core::trivia_table::Placement::new(kinds, unit);
        placement.place_all(sittir_core::trivia_table::Source { nodes: &mut sittir_core::nodes::TreeNodes::new(tree, source, &sittir_core::layout::LayoutWorkCounter::default()), lines: &lines });
        let sides = placement.tables().flat_map(|table| table.sides().map(|(key, entries)| (key, entries.to_vec())).collect::<Vec<_>>()).collect();
        Self { placement, sides }
    }

    /// The entries placing every layout owner gives `side` of the node at
    /// `index`, in source order.
    #[must_use]
    pub fn side(&self, index: sittir_core::types::NodeIndex, side: sittir_core::trivia_table::TriviaSide) -> &[sittir_core::trivia_table::Assigned] {
        self.sides.get(&(index, side)).map_or(&[], Vec::as_slice)
    }

    /// The entries no side takes, in source order.
    #[must_use]
    pub fn unowned(&self) -> Vec<sittir_core::types::NodeIndex> {
        self.placement.unowned()
    }

    /// Every run of whitespace a side takes, in source order.
    #[must_use]
    pub fn runs(&self) -> Vec<sittir_core::trivia_table::LayoutRun> {
        self.placement.runs().into_iter().map(|(_, run)| run).collect()
    }
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

/// `levels` rust blocks, each holding the one before it, all opened on one
/// line indented `levels` spaces, the source's one indentation step: its
/// unit is `levels` spaces wide, and every block's line in a render from
/// its templates is indented in it.
#[must_use]
pub fn wide_unit_blocks(levels: usize) -> String {
    format!("fn f(){{\n{}{}\nx\n{}\n}}\n", " ".repeat(levels), "{".repeat(levels), "}".repeat(levels))
}

/// `levels` blocks each opened with a multi-line comment on one line indented `levels` spaces, so the indentation unit is as wide as the chain is deep.
#[must_use]
pub fn wide_unit_comments(levels: usize) -> String {
    format!("fn f() {{\n{}{}{}\n}}\n", " ".repeat(levels), "{/* a\nb */".repeat(levels), "}".repeat(levels))
}

/// `levels` rust `!` operators, each applied to the one after it:
/// `!!true`. Every level is a layout owner of its own, so a snapshot places
/// each on its own read.
#[must_use]
pub fn unary_chain(levels: usize) -> String {
    format!("const X: bool = {}true;\n", "!".repeat(levels))
}

/// A rust tuple type of `members` `u8`s on one line: a flat list of unit
/// kinds, which a record writes with no anchor of its own.
#[must_use]
pub fn flat_tuple(members: usize) -> String {
    format!("type T = ({});\n", "u8, ".repeat(members))
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

/// An engine that read a tree's source and kept no tree, the record its
/// read left for the root, and the record it left for each of the tree's
/// nodes that has one, by the node's index in the tree.
#[cfg(feature = "arena")]
pub struct OverRead<G: sittir_core::arena::RecordGrammar> {
    pub engine: sittir_core::engine::Engine<G>,
    pub root: sittir_core::arena::Address,
    pub records: std::collections::HashMap<sittir_core::types::NodeIndex, sittir_core::arena::Address>,
}

#[cfg(feature = "arena")]
impl<G: sittir_core::arena::RecordGrammar> OverRead<G> {
    /// An engine of `grammar` under `options` that read `tree`'s source.
    ///
    /// # Panics
    ///
    /// When the read refuses, or leaves its root no record.
    pub fn of<N: sittir_core::read::ReadNode + sittir_core::arena::HydrateNode + sittir_core::arena::RecordCells>(grammar: G, options: &sittir_core::options::ResolvedOptions, tree: &sittir_core::engine::ParsedTree<G>) -> Self {
        use sittir_core::arena::NodeSite;
        use sittir_core::nodes::Nodes;
        use sittir_core::trivia_store::Place;
        use sittir_core::types::NodeIndex;
        let mut engine = sittir_core::engine::Engine::new(grammar, options.clone()).expect("an engine");
        let root = engine.parse_records::<N>(tree.source()).expect("a parse").root.expect("a root");
        let records = {
            let built = engine.written().built();
            let over = sittir_core::engine::ParsedTree::over_records(&engine, &built, root).expect("a tree over the records");
            let (mut ours, mut theirs) = (over.nodes(), tree.nodes());
            let mut records = std::collections::HashMap::new();
            let mut pending = vec![(NodeIndex::ROOT, NodeIndex::ROOT)];
            while let Some((run, row)) = pending.pop() {
                if let Some(Place::Read { site: NodeSite::Record(at), .. }) = over.place(run) {
                    records.insert(row, at);
                }
                let (met, kept) = (ours.kids(run), theirs.kids(row));
                pending.extend(met.iter().zip(kept.iter()).map(|(met, kept)| (met.index, kept.index)));
            }
            records
        };
        Self { engine, root, records }
    }

    /// The name of the record the read left the tree's node at `index`.
    #[must_use]
    pub fn name(&self, index: sittir_core::types::NodeIndex) -> Option<sittir_core::types::NodeName> {
        self.records.get(&index).map(|at| sittir_core::types::NodeName { node: sittir_core::types::NodeId(at.0), site: None })
    }

    /// `coord`, a node of the tree, named by the record the read left it.
    #[must_use]
    pub fn named(&self, coord: sittir_core::slot::NodeCoordinate) -> sittir_core::slot::NodeCoordinate {
        let name = self.name(coord.index);
        coord.named(name)
    }

    /// The record at `at` rendered as a render root whose `changed` edges
    /// have no neighbour, from the engine's arena alone, each record under
    /// it from its template when `templates`.
    ///
    /// # Errors
    ///
    /// What the render refuses.
    pub fn render_at(&self, at: sittir_core::arena::Address, changed: sittir_core::slot::ChangedEdges, options: &sittir_core::options::ResolvedOptions, templates: bool) -> Result<String, sittir_core::render::RenderError> {
        let built = self.engine.written().built();
        self.engine.render_at(&built, at, changed, options, templates, |_| Ok(()))
    }

    /// `node`, read from the tree, written into the engine's arena, its
    /// cells naming the records the read left, and rendered from that arena
    /// alone.
    ///
    /// # Panics
    ///
    /// When the write or the render refuses.
    pub fn render<N: sittir_core::arena::WriteCell<G::Trivia>>(&self, node: &N, options: &sittir_core::options::ResolvedOptions) -> String {
        use sittir_core::arena::{Cell, Linked, RecordSink};
        let at = {
            let mut link = |coord: &sittir_core::slot::NodeCoordinate| self.records.get(&coord.index).map(|&at| Linked::Record(at)).ok_or(sittir_core::arena::ArenaError::Unwritable("a child with no record"));
            let store = self.engine.written().clone();
            let mut built = self.engine.written().built_mut();
            let word = node.write_cell(&mut RecordSink::built(&mut built, &store, &mut link)).expect("a built record");
            match Cell::decode_built(word, &*built, G::KIND_BITS) {
                Ok(Cell::Child { at, .. }) => at,
                other => panic!("a built root: {other:?}"),
            }
        };
        self.render_at(at, sittir_core::slot::ChangedEdges::default(), options, false).expect("a record render")
    }

    /// Writes the inner side of the tree's node at `index` back to the
    /// record the read left it, as `edit_in_place` does to a tree: its
    /// render is its template's, with no text changed.
    ///
    /// # Panics
    ///
    /// When the node has no record, or the store refuses the write.
    pub fn edit_in_place(&self, index: sittir_core::types::NodeIndex) {
        let inner = sittir_core::trivia_table::TriviaSide::Inner;
        let name = self.name(index).expect("the edited node has a record");
        let entries = self.engine.read_named(name, |parsed, at| parsed.trivia_side(at, inner)).expect("the records read").expect("a read wrote the record");
        self.engine.write_read_side(name, inner, entries).expect("the node's own side writes back");
    }
}
