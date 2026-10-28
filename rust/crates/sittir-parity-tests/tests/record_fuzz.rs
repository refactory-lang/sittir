//! Malformed words read as records: a whole source's tree, written as built
//! records, with one word at a time replaced by an arbitrary one, is refused
//! when it is admitted (`arena::admit`) or renders, and no admitted record
//! panics, reads outside the arena or recurses without end; a child cell
//! that names a record holding it is refused at admission.
#![cfg(feature = "arena")]

use sittir_core::arena::{Address, ArenaError, ArenaRead, BuiltChunks, Cell, CellAt, CellWord, HeldArenas, Linked, RecordCells, RecordGrammar, RecordSink, WriteCell};
use sittir_core::engine::{claim_tree_id, Engine, ParsedTree};
use sittir_core::options::ResolvedOptions;
use sittir_core::prepare::RenderContext;
use sittir_core::read::ReadNode;
use sittir_core::render::RenderError;
use sittir_core::trivia_store::TriviaStore;
use sittir_core::types::NodeIndex;
use sittir_parity_tests::{load_fixtures, ParityFixture};

/// A seeded generator of words, so a failure reproduces.
struct Words(u64);

impl Words {
    fn next(&mut self) -> u32 {
        self.0 ^= self.0 << 13;
        self.0 ^= self.0 >> 7;
        self.0 ^= self.0 << 17;
        (self.0 >> 32) as u32
    }

    fn below(&mut self, n: u32) -> u32 {
        self.next() % n
    }
}

/// The sources tried of each grammar, and the words replaced in each.
const SOURCES: usize = 24;
const MUTATIONS: u32 = 400;

/// A built arena's chunks, copied so a test can replace any word.
struct Image {
    words: Vec<Option<Vec<u32>>>,
    bytes: Vec<Option<Vec<u8>>>,
}

impl Image {
    fn of(arena: &BuiltChunks) -> Self {
        let (mut words, mut bytes) = (vec![None], vec![None]);
        for n in 1.. {
            let (chunk, string) = (arena.chunk(n), arena.string_chunk(n));
            if chunk.is_none() && string.is_none() {
                break;
            }
            words.push(chunk.map(<[u32]>::to_vec));
            bytes.push(string.map(<[u8]>::to_vec));
        }
        Self { words, bytes }
    }

    fn word_mut(&mut self, at: Address) -> &mut u32 {
        &mut self.words[at.chunk() as usize].as_mut().expect("a words chunk")[at.word() as usize]
    }
}

impl ArenaRead for Image {
    fn chunk(&self, n: u32) -> Option<&[u32]> {
        self.words.get(n as usize)?.as_deref()
    }

    fn string_chunk(&self, n: u32) -> Option<&[u8]> {
        self.bytes.get(n as usize)?.as_deref()
    }
}

/// A source's tree, read whole as plain data and written as built records.
struct Built<T> {
    image: Image,
    bits: u32,
    store: TriviaStore<T>,
    root: CellAt,
}

impl<T: Clone> Built<T> {
    fn of<G: RecordGrammar<Trivia = T>, N: ReadNode + WriteCell<T>>(tree: &ParsedTree<G>) -> Option<Self> {
        let node: N = tree.snapshot(NodeIndex::ROOT, None).ok()?;
        let mut arena = BuiltChunks::new(G::KIND_BITS, G::shape);
        let store = TriviaStore::new();
        let mut link = |_: &sittir_core::slot::NodeCoordinate| -> Result<Linked, sittir_core::arena::ArenaError> { Err(sittir_core::arena::ArenaError::Unwritable("a coordinate in a snapshot")) };
        let word = node.write_cell(&mut RecordSink::built(&mut arena, &store, &mut link)).ok()?;
        let cell = Cell::decode_built(word, &arena, G::KIND_BITS).ok()?;
        matches!(cell, Cell::Child { .. }).then(|| Self { image: Image::of(&arena), bits: G::KIND_BITS, store, root: CellAt { cell, tree: None, site: None } })
    }

    /// The address of every word of each words chunk up to the word after
    /// its last written one, but the arena's reserved first one.
    fn addresses(&self) -> Vec<Address> {
        self.image
            .words
            .iter()
            .enumerate()
            .filter_map(|(chunk, words)| Some((u32::try_from(chunk).ok()?, words.as_ref()?)))
            .flat_map(|(chunk, words)| {
                let written = words.iter().rposition(|&word| word != 0).map_or(0, |last| (last + 2).min(words.len()));
                (0..written).filter_map(move |word| Address::new(chunk, u32::try_from(word).ok()?))
            })
            .filter(|&at| at != Address::NONE)
            .collect()
    }

    /// The root's records admitted as words written outside the native
    /// writer (`arena::admit`).
    fn admit<N: RecordCells>(&self) -> Result<(), ArenaError> {
        let Cell::Child { at, .. } = self.root.cell else { unreachable!("a built root is a child cell") };
        sittir_core::arena::admit(&self.image, at, N::shape, self.bits).map(drop)
    }

    /// `G`'s render of the root, its panic caught.
    fn render<G: RecordGrammar<Trivia = T>>(&self, tree: &ParsedTree<G>, ctx: &RenderContext<'_>) -> std::thread::Result<Result<String, RenderError>> {
        let mut arenas = HeldArenas::of([(tree.tree_id(), tree.tree_arena())]);
        std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| tree.grammar().render_record(self.root, &mut arenas, &self.image, &self.store, ctx)))
    }
}

fn sources(grammar: &str) -> impl Iterator<Item = String> {
    load_fixtures(grammar).into_iter().filter_map(|fixture| match fixture {
        ParityFixture::RoundTrip(fixture) => Some(fixture.source_in),
        ParityFixture::Render { .. } => None,
    })
}

/// A word to put where a record holds another: a unit's cell, a kind, a
/// cell naming an address in the arena (the root's among them), or anything.
fn mutation(words: &mut Words, addresses: &[Address]) -> u32 {
    match words.below(8) {
        0 | 1 => words.below(8),
        2 => words.below(1 << 11),
        3..=5 => addresses[words.below(u32::try_from(addresses.len()).expect("a count")) as usize].0 << 2,
        6 => 0,
        _ => words.next(),
    }
}

fn fuzz<G: RecordGrammar + Default, N: ReadNode + WriteCell<G::Trivia> + RecordCells>(grammar: &str, defaults: fn() -> ResolvedOptions) {
    let mut engine = Engine::new(G::default(), defaults()).expect("an engine");
    let options = engine.options().clone();
    let mut words = Words(0x9e37_79b9_7f4a_7c15);
    let (mut fuzzed, mut admitted, mut rendered, mut panicked) = (0, 0, 0, Vec::new());
    for (i, source) in sources(grammar).take(SOURCES).enumerate() {
        let tree = engine.parse(&source, claim_tree_id().expect("a tree id")).expect("a parse");
        let ctx = RenderContext { options: &options, sources: &tree };
        let Some(mut built) = Built::<G::Trivia>::of::<G, N>(&tree) else { continue };
        if built.admit::<N>().is_err() || !matches!(built.render(&tree, &ctx), Ok(Ok(_))) {
            continue;
        }
        fuzzed += 1;
        let addresses = built.addresses();
        for _ in 0..MUTATIONS {
            let at = addresses[words.below(u32::try_from(addresses.len()).expect("a count")) as usize];
            let word = mutation(&mut words, &addresses);
            let kept = std::mem::replace(built.image.word_mut(at), word);
            if built.admit::<N>().is_ok() {
                admitted += 1;
                match built.render(&tree, &ctx) {
                    Ok(Ok(_)) => rendered += 1,
                    Ok(Err(_)) => {}
                    Err(_) => panicked.push(format!("source {i}: word {at:?} = {word}")),
                }
            }
            *built.image.word_mut(at) = kept;
        }
    }
    eprintln!("{grammar}: {fuzzed} sources fuzzed, {admitted} of their mutations admitted, {rendered} of those rendered, the rest refused");
    assert!(fuzzed > 0, "{grammar} has sources to fuzz");
    assert!(panicked.is_empty(), "{} {grammar} reads panicked:\n{}", panicked.len(), panicked.join("\n"));
}

#[test]
fn malformed_rust_records_are_refused_or_rendered() {
    fuzz::<sittir_rust::RustGrammar, sittir_rust::render::AnyNode>("rust", sittir_rust::render::options::defaults);
}

#[test]
fn malformed_typescript_records_are_refused_or_rendered() {
    fuzz::<sittir_typescript::TypeScriptGrammar, sittir_typescript::render::AnyNode>("typescript", sittir_typescript::render::options::defaults);
}

#[test]
fn malformed_python_records_are_refused_or_rendered() {
    fuzz::<sittir_python::PythonGrammar, sittir_python::render::AnyNode>("python", sittir_python::render::options::defaults);
}

#[test]
fn malformed_regex_records_are_refused_or_rendered() {
    fuzz::<sittir_regex::RegexGrammar, sittir_regex::render::AnyNode>("regex", sittir_regex::render::options::defaults);
}

#[test]
fn malformed_scm_records_are_refused_or_rendered() {
    fuzz::<sittir_scm::ScmGrammar, sittir_scm::render::AnyNode>("scm", sittir_scm::render::options::defaults);
}

/// A child cell that names a record holding it makes a cycle a render would
/// follow without end: the innermost of nested calls named as the outermost.
/// It is refused.
#[test]
fn a_child_cell_naming_a_record_that_holds_it_is_refused() {
    use sittir_rust::render::kind_ids::CALL_EXPRESSION;
    let mut engine = Engine::new(sittir_rust::RustGrammar, sittir_rust::render::options::defaults()).expect("an engine");
    let options = engine.options().clone();
    let tree = engine.parse("fn f() {\n    a(b(c(d())));\n}\n", claim_tree_id().expect("a tree id")).expect("a parse");
    let ctx = RenderContext { options: &options, sources: &tree };
    let mut built = Built::of::<_, sittir_rust::render::AnyNode>(&tree).expect("a built tree");
    assert_eq!(built.admit::<sittir_rust::render::AnyNode>(), Ok(()), "the tree is admitted before the cycle");
    assert!(matches!(built.render(&tree, &ctx), Ok(Ok(_))), "and renders");
    let calls: Vec<(Address, Address)> = built
        .addresses()
        .into_iter()
        .filter_map(|cell| match built.image.word(cell).ok().map(|word| Cell::decode_built(CellWord(word), &built.image, built.bits)) {
            Some(Ok(Cell::Child { kind: CALL_EXPRESSION, at, link: None, .. })) => Some((cell, at)),
            _ => None,
        })
        .collect();
    let &(innermost, _) = calls.iter().min_by_key(|(_, at)| *at).expect("a call cell");
    let &(_, outermost) = calls.iter().max_by_key(|(_, at)| *at).expect("a call cell");
    *built.image.word_mut(innermost) = outermost.0 << 2;
    assert_eq!(built.admit::<sittir_rust::render::AnyNode>(), Err(ArenaError::Malformed { what: "child record address", word: outermost.0 }), "the cycle is refused when it is admitted, never followed");
}
