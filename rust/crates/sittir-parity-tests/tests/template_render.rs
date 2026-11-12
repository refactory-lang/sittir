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

/// What `render` answers, or `None` when it panics.
fn caught<R>(render: impl FnOnce() -> R) -> Option<R> {
    std::panic::catch_unwind(std::panic::AssertUnwindSafe(render)).ok()
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
    /// when the model reads no root.
    fn arena(&self, source: &str) -> Result<Option<String>, String> {
        let (tree, options) = self.parse(source);
        let Some(at) = tree.read_record::<N>(NodeIndex::ROOT, Depth::ONE)? else { return Ok(None) };
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
            (None, None) => Ok(Outcome::Panicking),
            (None, Some(_)) => Err("the object render from templates panics, and the arena one does not".to_owned()),
            (Some(_), None) => Err("the arena render from templates panics, and the object one does not".to_owned()),
            (Some(_), Some(Ok(None))) => Ok(Outcome::Unread),
            (Some(object), Some(arena)) => {
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
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Outcome {
    /// Alike in both storages, and as its source spells it.
    AsSource,
    /// Alike in both storages, and apart from its source's spelling.
    Rendered,
    /// Both renders panic.
    Panicking,
    /// The model reads no root of the source.
    Unread,
}

fn corpus<G: RecordGrammar, N: ReadNode + HydrateNode + RecordCells>(name: &str, grammar: &Renders<G, N>) {
    let sources: Vec<String> = load_fixtures(name)
        .into_iter()
        .filter_map(|fixture| match fixture {
            ParityFixture::RoundTrip(fixture) => Some(fixture.source_in),
            ParityFixture::Render { .. } => None,
        })
        .collect();
    assert!(!sources.is_empty(), "{name} has round-trip fixtures");
    let mut differ = Vec::new();
    let mut counts = std::collections::BTreeMap::<String, usize>::new();
    for (i, source) in sources.iter().enumerate() {
        match grammar.alike(source) {
            Ok(outcome) => *counts.entry(format!("{outcome:?}")).or_default() += 1,
            Err(e) => differ.push(format!("{name} source {i}: {e}")),
        }
    }
    eprintln!("{name}: {counts:?} of {} sources", sources.len());
    assert!(differ.is_empty(), "{} of {} sources render apart from their templates in the two storages:\n{}", differ.len(), sources.len(), differ.join("\n"));
}

#[test]
fn every_rust_source_renders_alike_from_its_templates() {
    corpus("rust", &Renders { grammar: sittir_rust::RustGrammar, options: sittir_rust::render::options::defaults, native: sittir_rust::render::render_node_parts });
}

#[test]
fn every_typescript_source_renders_alike_from_its_templates() {
    corpus("typescript", &Renders { grammar: sittir_typescript::TypeScriptGrammar, options: sittir_typescript::render::options::defaults, native: sittir_typescript::render::render_node_parts });
}

#[test]
fn every_python_source_renders_alike_from_its_templates() {
    corpus("python", &Renders { grammar: sittir_python::PythonGrammar, options: sittir_python::render::options::defaults, native: sittir_python::render::render_node_parts });
}

#[test]
fn every_regex_source_renders_alike_from_its_templates() {
    corpus("regex", &Renders { grammar: sittir_regex::RegexGrammar, options: sittir_regex::render::options::defaults, native: sittir_regex::render::render_node_parts });
}

#[test]
fn every_scm_source_renders_alike_from_its_templates() {
    corpus("scm", &Renders { grammar: sittir_scm::ScmGrammar, options: sittir_scm::render::options::defaults, native: sittir_scm::render::render_node_parts });
}
