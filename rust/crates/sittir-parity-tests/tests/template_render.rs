//! A render from templates renders a parsed node and every node under it
//! that has a record from its template, and each leaf and unit from its
//! source bytes (`ThroughTemplates`). For every round-trip source of each
//! grammar, the root renders alike from its templates in both storages: as
//! its coordinate (object) and as its record read one level down (arena),
//! which the render reads through, writing every record a whole read writes
//! but trivia's. A recording of the object render frames the root and slices
//! no node with a record but trivia.
#![cfg(feature = "arena")]

use sittir_core::arena::{HydrateNode, RecordCells, RecordGrammar};
use sittir_core::baseline::{Baseline, Written};
use sittir_core::engine::{claim_tree_id, Engine, EngineGrammar, ParsedTree};
use sittir_core::options::ResolvedOptions;
use sittir_core::prepare::RenderContext;
use sittir_core::read::{display_id, grammar_id, Depth, ReadNode};
use sittir_core::render::{RenderError, SourceTable, ThroughTemplates};
use sittir_core::slot::ChangedEdges;
use sittir_core::types::NodeIndex;
use sittir_core::SlotValue;
use sittir_parity_tests::{load_fixtures, ParityFixture};

/// A grammar's native render of a root (`render_node_parts`).
type NativeRender<N> = fn(SlotValue<N>, &RenderContext<'_>, Option<&mut Baseline>) -> Result<(sittir_core::types::Source, String), RenderError>;

struct Renders<G, N> {
    grammar: G,
    options: fn() -> ResolvedOptions,
    native: NativeRender<N>,
}

/// The nodes with a record (`ReadNode::router`), trivia aside, that a
/// recording of a render from templates sliced, and the root when it framed
/// none.
fn sliced_records<G: EngineGrammar, N: ReadNode>(tree: &ParsedTree<G>, baseline: &Baseline) -> Vec<String> {
    let count = sittir_core::read::descendant_count(&tree.tree().root_node());
    let mut sliced = Vec::new();
    if baseline.frame(NodeIndex::ROOT).is_none() {
        sliced.push("the root".to_owned());
    }
    for frame in (0..count).filter_map(|index| baseline.frame(NodeIndex::new(index))) {
        for item in &frame.items {
            let &Written::Node(index) = &item.what else { continue };
            if baseline.frame(index).is_some() {
                continue;
            }
            let node = sittir_core::engine::node_at_index(tree.tree(), index).expect("a node at every index");
            if N::router(grammar_id(&node), display_id(&node)).is_some() && !node.is_extra() {
                sliced.push(format!("node {} ({} {:?})", index.0, node.kind(), &tree.source()[sittir_core::types::Span::of(&node).range()]));
            }
        }
    }
    sliced
}

/// What `render` answers, or the message it panics with.
fn caught<R>(render: impl FnOnce() -> R) -> Result<R, String> {
    std::panic::catch_unwind(std::panic::AssertUnwindSafe(render)).map_err(|panic| {
        panic.downcast_ref::<String>().cloned().or_else(|| panic.downcast_ref::<&str>().map(|message| (*message).to_owned())).unwrap_or_default()
    })
}

impl<G: RecordGrammar, N: ReadNode + HydrateNode + RecordCells> Renders<G, N> {
    fn parse(&self, source: &str) -> (ParsedTree<G>, ResolvedOptions) {
        let mut engine = Engine::new(self.grammar, (self.options)()).expect("an engine");
        let options = engine.options().clone();
        (engine.parse(source, claim_tree_id().expect("a tree id")).expect("a parse"), options)
    }

    /// The root of `tree` rendered as its coordinate through `sources`,
    /// recording into `baseline` when one is given.
    fn coordinate(&self, tree: &ParsedTree<G>, sources: &dyn SourceTable, options: &ResolvedOptions, baseline: Option<&mut Baseline>) -> Result<String, String> {
        let root = sources.row_coordinate(tree.tree_id(), NodeIndex::ROOT).ok_or("no root coordinate")?;
        (self.native)(SlotValue::Coord(root), &RenderContext::new(options, sources), baseline).map(|(_, text)| text).map_err(|e| e.to_string())
    }

    /// The root's coordinate rendered from its templates, checked to slice
    /// no node with a record but trivia.
    fn object(&self, source: &str) -> Result<String, String> {
        let (tree, options) = self.parse(source);
        let seating = tree.seating();
        let through = self.coordinate(&tree, &ThroughTemplates(&seating), &options, None)?;
        let mut baseline = Baseline::default();
        self.coordinate(&tree, &ThroughTemplates(&seating), &options, Some(&mut baseline))?;
        let sliced = sliced_records::<G, N>(&tree, &baseline);
        if !sliced.is_empty() {
            return Err(format!("object: a render from templates sliced {}", sliced.join(", ")));
        }
        Ok(through)
    }

    /// The nodes of `tree` a read has written a record of, trivia aside,
    /// which a render writes from its source.
    fn written(tree: &ParsedTree<G>) -> Vec<bool> {
        let count = sittir_core::read::descendant_count(&tree.tree().root_node());
        (0..count)
            .map(NodeIndex::new)
            .map(|index| !sittir_core::engine::node_at_index(tree.tree(), index).is_some_and(|node| node.is_extra()) && tree.written_record::<N>(index).is_some())
            .collect()
    }

    /// The root's record, read one level down, rendered from its templates,
    /// checked to have written every record a whole read writes; `None`
    /// when the parser rejects the source whole, so the model reads no root.
    fn arena(&self, source: &str) -> Result<Option<String>, String> {
        let (tree, options) = self.parse(source);
        let Some(at) = tree.read_record::<N>(NodeIndex::ROOT, Depth::ONE)? else {
            return if tree.tree().root_node().is_error() { Ok(None) } else { Err("arena: the model reads no root of a source the parser accepts".to_owned()) };
        };
        let through = tree.render_record(at, ChangedEdges::default(), &options, &ThroughTemplates(&tree.seating())).map_err(|e| e.to_string())?;
        let (whole, _) = self.parse(source);
        whole.hydrate_record::<N>(NodeIndex::ROOT, Depth::All)?;
        let (rendered, read) = (Self::written(&tree), Self::written(&whole));
        let apart: Vec<String> = rendered
            .iter()
            .zip(&read)
            .enumerate()
            .filter(|(_, (rendered, read))| rendered != read)
            .map(|(index, (rendered, _))| (index, *rendered))
            .map(|(index, rendered)| {
                let node = sittir_core::engine::node_at_index(tree.tree(), NodeIndex::new(u32::try_from(index).expect("an index"))).expect("a node at every index");
                let parent = node.parent().map_or("none", |parent| parent.kind());
                format!("{index} {} under {parent}{} ({})", node.kind(), if node.is_extra() { " extra" } else { "" }, if rendered { "render only" } else { "whole read only" })
            })
            .collect();
        if !apart.is_empty() {
            return Err(format!("arena: a render from templates wrote other records than a whole read: {}", apart.join(", ")));
        }
        Ok(Some(through))
    }

    /// Whether `source` renders alike from its templates in both storages.
    fn alike(&self, source: &str) -> Result<Outcome, String> {
        match (caught(|| self.object(source)), caught(|| self.arena(source))) {
            (Err(object), Err(arena)) if object == arena => Ok(Outcome::Panicking(object)),
            (Err(object), Err(arena)) => Ok(Outcome::Panicking(format!("object: {object}; arena: {arena}"))),
            (Err(object), Ok(_)) => Err(format!("the object render from templates panics ({object}), and the arena one does not")),
            (Ok(_), Err(arena)) => Err(format!("the arena render from templates panics ({arena}), and the object one does not")),
            (Ok(Ok(_)), Ok(Ok(None))) => Ok(Outcome::Unread),
            (Ok(object), Ok(arena)) => {
                let (object, arena) = (object?, arena?.expect("a root"));
                if object != arena {
                    return Err(format!("\n object {object:?}\n arena  {arena:?}"));
                }
                Ok(if object == source { Outcome::AsSource } else { Outcome::Rendered })
            }
        }
    }
}

/// How one source renders from its templates.
#[derive(Debug, Clone, PartialEq, Eq)]
enum Outcome {
    /// Alike in both storages, and as its source spells it.
    AsSource,
    /// Alike in both storages, and apart from its source's spelling.
    Rendered,
    /// Both renders panic, with this message.
    Panicking(String),
    /// The parser rejects the source whole (an ERROR root), so the model
    /// reads no root of it.
    Unread,
}

/// How many of a grammar's sources render from its templates in neither
/// storage. Each is an exact count: a count above its pin is a regression,
/// and a pin only goes down.
#[derive(Debug, Clone, Copy)]
struct Pins {
    /// Sources whose render panics in both storages.
    panicking: usize,
    /// Sources the parser rejects whole.
    unread: usize,
}

/// Why `found` (each source with what it shows) differs from its pin, if it does.
fn against_pin(name: &str, what: &str, found: &[String], pin: usize) -> Option<String> {
    match found.len().cmp(&pin) {
        std::cmp::Ordering::Equal => None,
        std::cmp::Ordering::Greater => Some(format!("{name}: {} sources {what}, over its pin of {pin}:\n  {}", found.len(), found.join("\n  "))),
        std::cmp::Ordering::Less => Some(format!("{name}: {} sources {what}, under its pin of {pin}; lower its pin to {}", found.len(), found.len())),
    }
}

fn corpus<G: RecordGrammar, N: ReadNode + HydrateNode + RecordCells>(name: &str, grammar: &Renders<G, N>, pins: Pins) {
    let sources: Vec<String> = load_fixtures(name)
        .into_iter()
        .filter_map(|fixture| match fixture {
            ParityFixture::RoundTrip(fixture) => Some(fixture.source_in),
            ParityFixture::Render { .. } => None,
        })
        .collect();
    assert!(!sources.is_empty(), "{name} has round-trip fixtures");
    let mut differ = Vec::new();
    let (mut panicking, mut unread, mut rendered) = (Vec::new(), Vec::new(), 0);
    for (i, source) in sources.iter().enumerate() {
        let named = format!("source {i} ({:?})", source.lines().next().unwrap_or_default());
        match grammar.alike(source) {
            Ok(Outcome::AsSource | Outcome::Rendered) => rendered += 1,
            Ok(Outcome::Panicking(message)) => panicking.push(format!("{named}: {message}")),
            Ok(Outcome::Unread) => unread.push(named),
            Err(e) => differ.push(format!("{name} {named}: {e}")),
        }
    }
    eprintln!("{name}: {rendered} rendered, {} panicking, {} unread, {} apart of {} sources", panicking.len(), unread.len(), differ.len(), sources.len());
    differ.extend(against_pin(name, "panic in both storages", &panicking, pins.panicking));
    differ.extend(against_pin(name, "parse to an ERROR root", &unread, pins.unread));
    assert!(differ.is_empty(), "{} of {} sources render apart from their pins or between the two storages:\n{}", differ.len(), sources.len(), differ.join("\n"));
}

#[test]
fn every_rust_source_renders_alike_from_its_templates() {
    corpus("rust", &Renders { grammar: sittir_rust::RustGrammar, options: sittir_rust::render::options::defaults, native: sittir_rust::render::render_node_parts }, Pins { panicking: 0, unread: 3 });
}

#[test]
fn every_typescript_source_renders_alike_from_its_templates() {
    corpus("typescript", &Renders { grammar: sittir_typescript::TypeScriptGrammar, options: sittir_typescript::render::options::defaults, native: sittir_typescript::render::render_node_parts }, Pins { panicking: 0, unread: 0 });
}

#[test]
fn every_python_source_renders_alike_from_its_templates() {
    corpus("python", &Renders { grammar: sittir_python::PythonGrammar, options: sittir_python::render::options::defaults, native: sittir_python::render::render_node_parts }, Pins { panicking: 0, unread: 0 });
}

#[test]
fn every_regex_source_renders_alike_from_its_templates() {
    corpus("regex", &Renders { grammar: sittir_regex::RegexGrammar, options: sittir_regex::render::options::defaults, native: sittir_regex::render::render_node_parts }, Pins { panicking: 0, unread: 10 });
}

#[test]
fn every_scm_source_renders_alike_from_its_templates() {
    corpus("scm", &Renders { grammar: sittir_scm::ScmGrammar, options: sittir_scm::render::options::defaults, native: sittir_scm::render::render_node_parts }, Pins { panicking: 0, unread: 0 });
}
