//! The tree backer of the navigation interface (`TreeNodes`) answers each
//! node's facts, children and parent as the tree does, and its walk, byte
//! search and sibling steps as the interface's defaults built on those do,
//! moving its cursor from where it last stood: a preorder sweep never
//! descends from the root. Navigation of a region, moving a copy of that
//! cursor, answers every node as well, and a sweep of the region never
//! descends from the root either.

use sittir_core::engine::EngineGrammar;
use sittir_core::layout::LayoutWorkCounter;
use sittir_core::nodes::{Kid, Nodes, Step, TreeNodes, Visit};
use sittir_core::options::{ResolvedOptions, Side};
use sittir_core::read::{descendant_count, goto, index_of};
use sittir_core::tree_sitter;
use sittir_core::types::NodeIndex;
use sittir_parity_tests::{each_grammar, fixture_sources, parsed};
use std::sync::Arc;

/// The longest round-trip fixture source of `name`.
fn longest_fixture(name: &str) -> String {
    fixture_sources(name).into_iter().max_by_key(String::len).expect("a fixture source")
}

/// The node at `index` of `tree` and its children, each read from a cursor
/// created at the root.
fn walked(tree: &tree_sitter::Tree, index: NodeIndex) -> (Kid, Vec<Kid>) {
    let mut cursor = tree.walk();
    goto(&mut cursor, index);
    let node = Kid::at(&cursor);
    let mut kids = Vec::new();
    if cursor.goto_first_child() {
        loop {
            kids.push(Kid::at(&cursor));
            if !cursor.goto_next_sibling() {
                break;
            }
        }
    }
    (node, kids)
}

/// Every node of `tree`, in reverse preorder then in preorder, read through
/// `nodes` and from the tree, each pair asserted equal.
fn assert_reads_as_the_tree(name: &str, tree: &tree_sitter::Tree, nodes: &mut dyn Nodes<'_>) {
    let count = descendant_count(&tree.root_node());
    for index in (0..count).rev().chain(0..count) {
        let at = NodeIndex::new(index);
        let (node, kids) = walked(tree, at);
        assert_eq!(nodes.kid(at), node, "{name}: the node at {index}");
        assert_eq!(&*nodes.kids(at), kids.as_slice(), "{name}: the children of {index}");
        assert_eq!(nodes.edge(at, Side::Before), kids.first().copied(), "{name}: the first child of {index}");
        assert_eq!(nodes.edge(at, Side::After), kids.last().copied(), "{name}: the last child of {index}");
        let mut cursor = tree.walk();
        goto(&mut cursor, at);
        let parent = cursor.goto_parent().then(|| index_of(&cursor));
        assert_eq!(nodes.parent(at), parent, "{name}: the parent of {index}");
    }
}

/// Navigation that answers `kid`, `kids`, `edge` and `parent` through a
/// `TreeNodes` and takes the interface's defaults for the rest.
struct Plain<'n, 't>(&'n mut TreeNodes<'t>);

impl<'t> Nodes<'t> for Plain<'_, 't> {
    fn text(&self) -> &'t str {
        self.0.text()
    }

    fn kid(&mut self, index: NodeIndex) -> Kid {
        self.0.kid(index)
    }

    fn kids(&mut self, index: NodeIndex) -> Arc<[Kid]> {
        self.0.kids(index)
    }

    fn edge(&mut self, index: NodeIndex, side: Side) -> Option<Kid> {
        self.0.edge(index, side)
    }

    fn parent(&mut self, index: NodeIndex) -> Option<NodeIndex> {
        self.0.parent(index)
    }

    fn missing(&mut self, index: NodeIndex) -> bool {
        self.0.missing(index)
    }

    fn holds_error(&mut self, index: NodeIndex) -> bool {
        self.0.holds_error(index)
    }
}

/// The steps a walk of `nodes` from the root takes, entering the nodes
/// `enter` picks and stopping after `stop` meets.
fn steps(nodes: &mut dyn Nodes<'_>, enter: fn(&Kid) -> bool, stop: usize) -> Vec<(Step, NodeIndex)> {
    let mut steps = Vec::new();
    let mut met = 0;
    nodes.walk(NodeIndex::ROOT, &mut |step, kid| {
        steps.push((step, kid.index));
        if step == Step::Leave {
            return Visit::Pass;
        }
        met += 1;
        if met == stop {
            Visit::Stop
        } else if enter(kid) {
            Visit::Enter
        } else {
            Visit::Pass
        }
    });
    steps
}

/// What a navigation answers to every walk, byte search and sibling step
/// over a tree (`answers`).
struct Answers {
    walks: Vec<Vec<(Step, NodeIndex)>>,
    siblings: Vec<(Option<Kid>, Option<Kid>)>,
    searches: Vec<Option<Kid>>,
}

/// The answers `nodes` gives to every walk, byte search and sibling step
/// over `tree`: walks entering every node, the named ones, and stopping
/// early; for each node, the next and previous sibling; and for each node
/// with children, the first child ending past each child's first and last
/// byte and past the node's own end.
fn answers(tree: &tree_sitter::Tree, nodes: &mut dyn Nodes<'_>) -> Answers {
    let count = descendant_count(&tree.root_node());
    let walks = vec![steps(nodes, |_| true, usize::MAX), steps(nodes, |kid| kid.named, usize::MAX), steps(nodes, |_| true, 50)];
    let indexes = (0..count).map(NodeIndex::new);
    let siblings = indexes.clone().map(|at| (nodes.next(at), nodes.previous(at))).collect();
    let mut searches = Vec::new();
    for at in indexes {
        let (node, kids) = walked(tree, at);
        for byte in kids.iter().flat_map(|kid| [kid.start, kid.end.saturating_sub(1)]).chain([node.end]) {
            searches.push(nodes.child_past(at, byte));
        }
    }
    Answers { walks, siblings, searches }
}

/// The child of the root of `tree` with the most nodes under it.
fn largest_top(tree: &tree_sitter::Tree) -> Kid {
    walked(tree, NodeIndex::ROOT).1.into_iter().max_by_key(|kid| kid.count).expect("a child of the root")
}

/// Every node of `name`'s longest fixture read through a `TreeNodes` of its
/// own and through navigation of the region of the root's largest child,
/// and every walk, search and step through it as through the defaults: the
/// tree's count and that region's.
fn nodes_match_the_tree<G: EngineGrammar + Copy>(name: &str, grammar: G, options: fn() -> ResolvedOptions) -> (u32, u32) {
    let source = longest_fixture(name);
    let parsed = parsed(grammar, options(), &source);
    let tree = parsed.tree();
    let work = LayoutWorkCounter::default();
    let mut nodes = TreeNodes::new(tree, &source, &work);
    assert_eq!(nodes.text(), source);
    assert_reads_as_the_tree(name, tree, &mut nodes);
    let Answers { walks, siblings, searches } = answers(tree, &mut nodes);
    let plain = answers(tree, &mut Plain(&mut TreeNodes::new(tree, &source, &work)));
    let (plain_walks, plain_siblings, plain_searches) = (plain.walks, plain.siblings, plain.searches);
    for (at, (walk, plain)) in walks.iter().zip(&plain_walks).enumerate() {
        let apart = walk.iter().zip(plain).position(|(step, plain)| step != plain);
        assert!(apart.is_none() && walk.len() == plain.len(), "{name}: walk {at} parts from the defaults' at step {apart:?}: {:?} against {:?}", apart.map(|i| &walk[i.saturating_sub(2)..(i + 2).min(walk.len())]), apart.map(|i| &plain[i.saturating_sub(2)..(i + 2).min(plain.len())]));
    }
    for (index, (steps, plain)) in siblings.iter().zip(&plain_siblings).enumerate() {
        assert_eq!(steps, plain, "{name}: the siblings of {index}");
    }
    for (at, (search, plain)) in searches.iter().zip(&plain_searches).enumerate() {
        assert_eq!(search, plain, "{name}: search {at}");
    }
    let top = largest_top(tree);
    let mut region = nodes.region(top.index..top.index + top.count);
    assert_reads_as_the_tree(name, tree, &mut region);
    (descendant_count(&tree.root_node()), top.count)
}

#[test]
fn tree_nodes_match_the_tree() {
    let counts = each_grammar!(nodes_match_the_tree);
    eprintln!("nodes read (tree, region): {counts:?}");
    assert!(counts.iter().all(|(_, (count, region))| *count > 1 && *region > 1), "{counts:?}");
}

/// The nodes a preorder sweep of `kids` from the node at `from` visits.
fn sweep(nodes: &mut dyn Nodes<'_>, from: NodeIndex) -> u32 {
    let mut pending = vec![from];
    let mut visited = 0;
    while let Some(at) = pending.pop() {
        visited += 1;
        pending.extend(nodes.kids(at).iter().rev().map(|kid| kid.index));
    }
    visited
}

/// The root descents a preorder sweep over `name`'s longest fixture makes,
/// those of a sweep of the region of the root's largest child, and those of
/// two reads deep in different subtrees of the root, the second's subtree
/// before the first's and then after it: the first read descends from the
/// root, the second too when its subtree comes before, while one after it
/// steps along the root's children.
fn root_descents<G: EngineGrammar + Copy>(name: &str, grammar: G, options: fn() -> ResolvedOptions) -> (u32, u32, u32, u32) {
    let source = longest_fixture(name);
    let parsed = parsed(grammar, options(), &source);
    let tree = parsed.tree();
    let descents = |work: &LayoutWorkCounter| work.counts(0).root_descents;
    let swept = LayoutWorkCounter::default();
    assert_eq!(sweep(&mut TreeNodes::new(tree, &source, &swept), NodeIndex::ROOT), descendant_count(&tree.root_node()), "{name}: the sweep visits every node");
    let top = largest_top(tree);
    let regional = LayoutWorkCounter::default();
    let mut region = TreeNodes::new(tree, &source, &regional).region(top.index..top.index + top.count);
    assert_eq!(sweep(&mut region, top.index), top.count, "{name}: the region's sweep visits every node of it");
    let grandchildren: Vec<NodeIndex> = walked(tree, NodeIndex::ROOT).1.iter().filter_map(|top| walked(tree, top.index).1.first().map(|kid| kid.index)).collect();
    let apart = |reads: [NodeIndex; 2]| {
        let work = LayoutWorkCounter::default();
        let mut nodes = TreeNodes::new(tree, &source, &work);
        for at in reads {
            nodes.kid(at);
        }
        descents(&work)
    };
    let (back, ahead) = match (grandchildren.first(), grandchildren.last()) {
        (Some(&first), Some(&last)) if grandchildren.len() > 1 => (apart([last, first]), apart([first, last])),
        _ => (2, 1),
    };
    (descents(&swept), descents(&regional), back, ahead)
}

/// The lines under the root of `source` that begin inside a token, as its
/// tree's source table gives them.
fn line_starts<G: EngineGrammar>(grammar: G, options: ResolvedOptions, source: &str) -> Vec<u32> {
    let parsed = parsed(grammar, options, source);
    let root = parsed.row_coordinate(NodeIndex::ROOT).expect("the root's coordinate");
    let starts = sittir_core::render::SourceTable::line_starts_inside_tokens(&parsed.seating(), &root);
    assert!(starts.iter().all(|&at| source.is_char_boundary(at as usize) && source.as_bytes()[at as usize - 1] == b'\n'), "{source:?}: {starts:?}");
    starts
}

#[test]
fn line_starts_inside_a_multiline_token_hold() {
    assert_eq!(line_starts(sittir_typescript::TypeScriptGrammar, sittir_typescript::render::options::defaults(), "const é = 1;\nconst t = `x\n  y\nz`;\n"), [27, 31]);
    assert_eq!(line_starts(sittir_python::PythonGrammar, sittir_python::render::options::defaults(), "é = 1\ns = '''a\nb\n'''\n"), [16, 18]);
}

/// The deepest node of `tree` spanning the bytes `start..end`.
fn spanning(tree: &tree_sitter::Tree, start: u32, end: u32) -> NodeIndex {
    (0..descendant_count(&tree.root_node()))
        .rev()
        .map(NodeIndex::new)
        .find(|&at| {
            let (node, _) = walked(tree, at);
            node.start == start && node.end == end
        })
        .expect("a node spanning the bytes")
}

/// The siblings stepped across and the levels climbed by a `TreeNodes` move
/// from the first call in a function of `calls` calls to the call in the
/// function after it.
fn out_of_a_wide_body(calls: usize) -> (u32, u32) {
    let source = format!("function f() {{\n{}}}\nfunction g() {{\n  b();\n}}\n", "  a();\n".repeat(calls));
    let parsed = parsed(sittir_typescript::TypeScriptGrammar, sittir_typescript::render::options::defaults(), &source);
    let tree = parsed.tree();
    let at = |text: &str| byte_of(&source, text);
    let (from, to) = (spanning(tree, at("a();"), at("a();") + 1), spanning(tree, at("b();"), at("b();") + 1));
    let work = LayoutWorkCounter::default();
    let mut nodes = TreeNodes::new(tree, &source, &work);
    nodes.kid(from);
    let before = work.counts(0);
    nodes.kid(to);
    let after = work.counts(0);
    (after.sibling_steps - before.sibling_steps, after.cursor_climbs - before.cursor_climbs)
}

/// The byte where `text` first occurs in `source`.
fn byte_of(source: &str, text: &str) -> u32 {
    u32::try_from(source.find(text).expect("the text in the source")).expect("a source under 4 GiB")
}

#[test]
fn a_move_out_of_a_wide_body_steps_across_none_of_its_children() {
    let moves = [out_of_a_wide_body(100), out_of_a_wide_body(1000)];
    eprintln!("siblings stepped and levels climbed out of 100 and 1000 calls: {moves:?}");
    assert_eq!(moves[0], moves[1]);
}

#[test]
fn tree_nodes_never_descend_from_the_root_in_a_sweep() {
    let descents = each_grammar!(root_descents);
    eprintln!("root descents (sweep, region sweep, apart back, apart ahead): {descents:?}");
    assert!(descents.iter().all(|(_, (swept, region, _, _))| *swept == 0 && *region == 0), "{descents:?}");
    assert!(descents.iter().all(|(_, (_, _, back, _))| *back == 2), "a read deep in an earlier subtree of the root descends from it: {descents:?}");
    assert!(descents.iter().all(|(_, (_, _, _, ahead))| *ahead == 1), "a read deep in a later subtree steps along the root's children: {descents:?}");
}
