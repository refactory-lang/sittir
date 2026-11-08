//! The navigation interface: a node's facts by its descendant index
//! (`Kid`), its children in order and its parent, over a tree's source
//! text. Trivia placement, the source table and the engine's tree functions
//! read a tree through it, so each of their rules serves every backer. The
//! reader alone reads tree-sitter's tree itself, on a cursor the tree backer
//! lends it (`TreeNodes::reader`).

use crate::layout::LayoutWorkCounter;
use crate::types::{FieldId, KindId, NodeIndex, Span};
use std::ops::Range;
use std::sync::Arc;

/// What navigation reads of a node: its descendant index, numbered from the
/// tree's root; its bytes; the nodes under it, counting itself; the kind it
/// has in the grammar and the kind the parser shows it as; the field it
/// fills in its parent; and whether it is named or an extra. Whether it is
/// an `ERROR` follows from the kind it is shown as (`Kid::error`). A read
/// takes these of every node it visits; whether a node is `MISSING` or
/// holds an error only an error search asks (`Nodes::missing`,
/// `Nodes::holds_error`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Kid {
    pub index: NodeIndex,
    pub start: u32,
    pub end: u32,
    pub count: u32,
    pub grammar: KindId,
    pub display: KindId,
    pub field: Option<FieldId>,
    pub named: bool,
    pub extra: bool,
}

impl Kid {
    /// The node `cursor`, created at the tree's root, stands on.
    #[must_use]
    pub fn at(cursor: &tree_sitter::TreeCursor<'_>) -> Self {
        Self::of(&cursor.node(), crate::read::index_of(cursor), crate::read::field_id(cursor))
    }

    /// `node`, at `index` and filling `field` in its parent.
    pub(crate) fn of(node: &tree_sitter::Node<'_>, index: NodeIndex, field: Option<FieldId>) -> Self {
        let Span { start, end } = Span::of(node);
        Self {
            index,
            start,
            end,
            count: crate::read::descendant_count(node),
            grammar: crate::read::grammar_id(node),
            display: crate::read::display_id(node),
            field,
            named: node.is_named(),
            extra: node.is_extra(),
        }
    }

    /// Whether the node is an `ERROR` (`shown_as_error`).
    #[must_use]
    pub fn error(&self) -> bool {
        shown_as_error(self.display)
    }

    /// Whether the node is an entry of a side: an extra, or an `ERROR`
    /// wherever the parser left it. Trivia, which no slot reads.
    #[must_use]
    pub fn entry(&self) -> bool {
        self.extra || self.error()
    }

    /// Whether the node is a leaf: no entry, and no node under it.
    #[must_use]
    pub fn leaf(&self) -> bool {
        !self.entry() && self.count == 1
    }

    /// Whether the node holds trivia sides: named, no entry, and with width.
    /// Width is read from the tree here; a built node's child has the width
    /// of its rendered text, so a stored automatic semicolon, which renders
    /// `"\n"`, has width there.
    #[must_use]
    pub fn holder(&self) -> bool {
        self.named && !self.entry() && self.end > self.start
    }

    /// The node's bytes.
    #[must_use]
    pub fn span(&self) -> Span {
        Span { start: self.start, end: self.end }
    }

    /// How many bytes the node spans.
    #[must_use]
    pub fn width(&self) -> u32 {
        self.end - self.start
    }

    /// Whether the node's bytes hold the byte at `byte`.
    #[must_use]
    pub fn holds(&self, byte: u32) -> bool {
        self.start <= byte && byte < self.end
    }
}

/// Where a walk is (`Nodes::walk`): at a node it meets, or leaving a node
/// it entered, once that node's children are walked.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Step {
    Meet,
    Leave,
}

/// What a walk does next (`Nodes::walk`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Visit {
    /// At a node it meets: walks the node's children, then leaves it.
    Enter,
    /// At a node it meets: passes over the node's children. Leaving a node:
    /// goes on.
    Pass,
    /// Ends the walk.
    Stop,
}

/// Whether a node the parser shows as `display` is an `ERROR`, as
/// `Node::is_error` compares: the one test of it, on the kind the node is
/// shown as.
#[must_use]
pub fn shown_as_error(display: KindId) -> bool {
    display == KindId::ERROR
}

/// How navigation finds the nodes of one parse: each node by its descendant
/// index, the root's being `NodeIndex::ROOT`, and the text their bytes index.
/// `kid`, `kids` and `parent` answer every question of the tree's shape, and
/// `missing` and `holds_error` those of its errors; the others answer what
/// the first three would, and a backer gives them only to answer without
/// reading every child.
pub trait Nodes<'t> {
    /// The source text the nodes' bytes index.
    fn text(&self) -> &'t str;
    /// The node at `index`.
    fn kid(&mut self, index: NodeIndex) -> Kid;
    /// The children of the node at `index`, in order.
    fn kids(&mut self, index: NodeIndex) -> Arc<[Kid]>;
    /// The parent of the node at `index`, `None` for the root.
    fn parent(&mut self, index: NodeIndex) -> Option<NodeIndex>;
    /// Whether the node at `index` is `MISSING`: a token the parser
    /// inserted, with no bytes.
    fn missing(&mut self, index: NodeIndex) -> bool;
    /// Whether the node at `index` holds an error in its subtree, itself
    /// included: an `ERROR` or a `MISSING` node holds one, a lone `ERROR`
    /// token too.
    fn holds_error(&mut self, index: NodeIndex) -> bool;

    /// Walks the subtree of the node at `from` in preorder, telling `visit`
    /// each node it meets and each node it leaves.
    fn walk(&mut self, from: NodeIndex, visit: &mut dyn FnMut(Step, &Kid) -> Visit) {
        let mut entered: Vec<(Kid, Arc<[Kid]>, usize)> = Vec::new();
        let mut next = Some(self.kid(from));
        loop {
            if let Some(kid) = next.take() {
                match visit(Step::Meet, &kid) {
                    Visit::Stop => return,
                    Visit::Enter => {
                        let kids = self.kids(kid.index);
                        entered.push((kid, kids, 0));
                    }
                    Visit::Pass => {}
                }
            }
            let Some((_, kids, at)) = entered.last_mut() else { return };
            if let Some(&kid) = kids.get(*at) {
                *at += 1;
                next = Some(kid);
            } else if let Some((kid, ..)) = entered.pop() {
                if visit(Step::Leave, &kid) == Visit::Stop {
                    return;
                }
            }
        }
    }

    /// The first child of the node at `index` that ends past `byte`.
    fn child_past(&mut self, index: NodeIndex, byte: u32) -> Option<Kid> {
        self.kids(index).iter().find(|kid| kid.end > byte).copied()
    }

    /// The node after the node at `index` among its parent's children.
    fn next(&mut self, index: NodeIndex) -> Option<Kid> {
        let parent = self.parent(index)?;
        let kids = self.kids(parent);
        let at = kids.iter().position(|kid| kid.index == index)?;
        kids.get(at + 1).copied()
    }

    /// The node before the node at `index` among its parent's children.
    fn previous(&mut self, index: NodeIndex) -> Option<Kid> {
        let parent = self.parent(index)?;
        let kids = self.kids(parent);
        let at = kids.iter().position(|kid| kid.index == index)?;
        at.checked_sub(1).map(|before| kids[before])
    }
}

/// Navigation over a tree-sitter tree: one cursor, created at the tree's
/// root, moved from where it last stood (`read::goto_from`). The root's
/// facts are read without a move. Its moves count in the
/// tree's layout work: the levels climbed (`LayoutWork::cursor_climbs`), the
/// moves down from the root to below its children
/// (`LayoutWork::root_descents`), and, for navigation of a region, the moves
/// to a node outside it (`LayoutWork::region_fallbacks`).
pub struct TreeNodes<'t> {
    tree: &'t tree_sitter::Tree,
    text: &'t str,
    work: &'t LayoutWorkCounter,
    cursor: Option<tree_sitter::TreeCursor<'t>>,
    region: Option<Range<NodeIndex>>,
}

impl<'t> TreeNodes<'t> {
    /// Navigation over `tree`, parsed from `text`, its cursor made on its
    /// first move, its moves counted in `work`.
    #[must_use]
    pub fn new(tree: &'t tree_sitter::Tree, text: &'t str, work: &'t LayoutWorkCounter) -> Self {
        Self { tree, text, work, cursor: None, region: None }
    }

    /// Navigation of the region `nodes`, a node's subtree, that moves a copy
    /// of this navigation's cursor from where it stands.
    #[must_use]
    pub fn region(&mut self, nodes: Range<NodeIndex>) -> Self {
        Self { region: Some(nodes), ..self.copy() }
    }

    /// Navigation of what this one navigates that moves a copy of its
    /// cursor from where it stands, leaving its own where it is.
    #[must_use]
    pub fn copy(&mut self) -> Self {
        let tree = self.tree;
        let cursor = self.cursor.get_or_insert_with(|| tree.walk()).clone();
        Self { tree, text: self.text, work: self.work, cursor: Some(cursor), region: self.region.clone() }
    }

    /// The cursor, standing on the node at `index`, for a reader, which
    /// reads tree-sitter's tree itself and numbers nodes from the root.
    pub fn reader(&mut self, index: NodeIndex) -> &mut tree_sitter::TreeCursor<'t> {
        if self.region.as_ref().is_some_and(|region| !region.contains(&index)) {
            self.work.region_fallbacks(1);
        }
        let tree = self.tree;
        let cursor = self.cursor.get_or_insert_with(|| tree.walk());
        let moved = crate::read::goto_from_noting_top(cursor, NodeIndex::ROOT, index);
        self.work.cursor_climbs(moved.climbed);
        self.work.sibling_steps(moved.stepped);
        if moved.top && index != NodeIndex::ROOT {
            cursor.goto_parent();
            if crate::read::offset_of(cursor) != 0 {
                self.work.root_descents(1);
            }
            crate::read::goto_from(cursor, NodeIndex::ROOT, index);
        }
        cursor
    }

    /// The tree's node at `index`, the root's read without a move.
    fn node(&mut self, index: NodeIndex) -> tree_sitter::Node<'t> {
        if index == NodeIndex::ROOT {
            return self.tree.root_node();
        }
        self.reader(index).node()
    }
}

impl<'t> Nodes<'t> for TreeNodes<'t> {
    fn text(&self) -> &'t str {
        self.text
    }

    fn kid(&mut self, index: NodeIndex) -> Kid {
        if index == NodeIndex::ROOT {
            return Kid::of(&self.tree.root_node(), index, None);
        }
        Kid::at(self.reader(index))
    }

    fn missing(&mut self, index: NodeIndex) -> bool {
        self.node(index).is_missing()
    }

    fn holds_error(&mut self, index: NodeIndex) -> bool {
        let node = self.node(index);
        node.has_error() || shown_as_error(crate::read::display_id(&node))
    }

    fn kids(&mut self, index: NodeIndex) -> Arc<[Kid]> {
        let cursor = self.reader(index);
        let mut kids = Vec::new();
        if cursor.goto_first_child() {
            loop {
                kids.push(Kid::at(cursor));
                if !cursor.goto_next_sibling() {
                    break;
                }
            }
            cursor.goto_parent();
        }
        kids.into()
    }

    fn parent(&mut self, index: NodeIndex) -> Option<NodeIndex> {
        if index == NodeIndex::ROOT {
            return None;
        }
        let cursor = self.reader(index);
        cursor.goto_parent().then(|| crate::read::index_of(cursor))
    }

    fn walk(&mut self, from: NodeIndex, visit: &mut dyn FnMut(Step, &Kid) -> Visit) {
        let cursor = self.reader(from);
        let mut entered: Vec<Kid> = Vec::new();
        let mut kid = Kid::at(cursor);
        loop {
            match visit(Step::Meet, &kid) {
                Visit::Stop => return,
                Visit::Enter if cursor.goto_first_child() => {
                    entered.push(kid);
                    kid = Kid::at(cursor);
                    continue;
                }
                Visit::Enter => {
                    if visit(Step::Leave, &kid) == Visit::Stop {
                        return;
                    }
                }
                Visit::Pass => {}
            }
            loop {
                if entered.is_empty() {
                    return;
                }
                if cursor.goto_next_sibling() {
                    kid = Kid::at(cursor);
                    break;
                }
                cursor.goto_parent();
                if let Some(left) = entered.pop() {
                    if visit(Step::Leave, &left) == Visit::Stop {
                        return;
                    }
                }
            }
        }
    }

    fn child_past(&mut self, index: NodeIndex, byte: u32) -> Option<Kid> {
        let cursor = self.reader(index);
        cursor.goto_first_child_for_byte(byte as usize).map(|_| Kid::at(cursor))
    }

    fn next(&mut self, index: NodeIndex) -> Option<Kid> {
        let cursor = self.reader(index);
        cursor.goto_next_sibling().then(|| Kid::at(cursor))
    }
}

/// Navigation over the rows a parsed tree's arena keeps for its nodes
/// (`TreeArena::node_rows`), with no tree: each node's facts read from its
/// row, its children by stepping from one subtree end to the next, and its
/// parent from the rows' index of every node's parent.
#[cfg(feature = "arena")]
#[derive(Clone, Copy)]
pub struct RecordNodes<'t> {
    rows: &'t crate::arena::NodeRows,
    text: &'t str,
}

#[cfg(feature = "arena")]
impl<'t> RecordNodes<'t> {
    /// Navigation over the rows of `tree`'s nodes, whose bytes index `text`;
    /// `None` while some node of the tree has no row.
    #[must_use]
    pub fn new(tree: &'t crate::arena::TreeArena, text: &'t str) -> Option<Self> {
        tree.node_rows().map(|rows| Self::over(rows, text))
    }

    /// Navigation over `rows`, every node's, whose bytes index `text`.
    #[must_use]
    pub fn over(rows: &'t crate::arena::NodeRows, text: &'t str) -> Self {
        Self { rows, text }
    }

    /// Every node of the tree, in preorder: the rows in index order.
    pub fn preorder(&self) -> impl Iterator<Item = Kid> + '_ {
        (0..self.rows.len()).map(|index| self.rows.kid(NodeIndex(index)))
    }
}

#[cfg(feature = "arena")]
impl<'t> Nodes<'t> for RecordNodes<'t> {
    fn text(&self) -> &'t str {
        self.text
    }

    fn kid(&mut self, index: NodeIndex) -> Kid {
        self.rows.kid(index)
    }

    fn kids(&mut self, index: NodeIndex) -> Arc<[Kid]> {
        let end = self.rows.subtree_end(index);
        let mut kids = Vec::new();
        let mut at = index + 1;
        while at < end {
            let kid = self.rows.kid(at);
            at = at + kid.count;
            kids.push(kid);
        }
        kids.into()
    }

    fn parent(&mut self, index: NodeIndex) -> Option<NodeIndex> {
        self.rows.parent(index)
    }

    fn missing(&mut self, index: NodeIndex) -> bool {
        self.rows.missing(index)
    }

    fn holds_error(&mut self, index: NodeIndex) -> bool {
        self.rows.holds_error(index)
    }

    fn next(&mut self, index: NodeIndex) -> Option<Kid> {
        let parent = self.rows.parent(index)?;
        let at = index + self.rows.kid(index).count;
        (at < self.rows.subtree_end(parent)).then(|| self.rows.kid(at))
    }
}

/// Navigation of one parse for one call: over its rows once every node has
/// one (`RecordNodes`), else over tree-sitter's tree (`TreeNodes`).
pub enum Navigation<'t> {
    Tree(TreeNodes<'t>),
    #[cfg(feature = "arena")]
    Records(RecordNodes<'t>),
}

impl<'t> Navigation<'t> {
    /// Navigation of the region `nodes`, a node's subtree
    /// (`TreeNodes::region`); rows navigate any region alike.
    #[must_use]
    pub fn region(&mut self, nodes: Range<NodeIndex>) -> Self {
        match self {
            Self::Tree(tree) => Self::Tree(tree.region(nodes)),
            #[cfg(feature = "arena")]
            Self::Records(records) => Self::Records(*records),
        }
    }

    /// Navigation of what this one navigates, leaving this one where it is
    /// (`TreeNodes::copy`).
    #[must_use]
    pub fn copy(&mut self) -> Self {
        match self {
            Self::Tree(tree) => Self::Tree(tree.copy()),
            #[cfg(feature = "arena")]
            Self::Records(records) => Self::Records(*records),
        }
    }

    /// The tree's cursor, standing on the node at `index`, for a reader
    /// (`TreeNodes::reader`); `None` for navigation over rows, which holds
    /// no tree.
    pub fn reader(&mut self, index: NodeIndex) -> Option<&mut tree_sitter::TreeCursor<'t>> {
        match self {
            Self::Tree(tree) => Some(tree.reader(index)),
            #[cfg(feature = "arena")]
            Self::Records(_) => None,
        }
    }

    fn nodes(&mut self) -> &mut dyn Nodes<'t> {
        match self {
            Self::Tree(tree) => tree,
            #[cfg(feature = "arena")]
            Self::Records(records) => records,
        }
    }
}

impl<'t> Nodes<'t> for Navigation<'t> {
    fn text(&self) -> &'t str {
        match self {
            Self::Tree(tree) => tree.text(),
            #[cfg(feature = "arena")]
            Self::Records(records) => records.text(),
        }
    }

    fn kid(&mut self, index: NodeIndex) -> Kid {
        self.nodes().kid(index)
    }

    fn kids(&mut self, index: NodeIndex) -> Arc<[Kid]> {
        self.nodes().kids(index)
    }

    fn parent(&mut self, index: NodeIndex) -> Option<NodeIndex> {
        self.nodes().parent(index)
    }

    fn missing(&mut self, index: NodeIndex) -> bool {
        self.nodes().missing(index)
    }

    fn holds_error(&mut self, index: NodeIndex) -> bool {
        self.nodes().holds_error(index)
    }

    fn walk(&mut self, from: NodeIndex, visit: &mut dyn FnMut(Step, &Kid) -> Visit) {
        self.nodes().walk(from, visit);
    }

    fn child_past(&mut self, index: NodeIndex, byte: u32) -> Option<Kid> {
        self.nodes().child_past(index, byte)
    }

    fn next(&mut self, index: NodeIndex) -> Option<Kid> {
        self.nodes().next(index)
    }

    fn previous(&mut self, index: NodeIndex) -> Option<Kid> {
        self.nodes().previous(index)
    }
}
