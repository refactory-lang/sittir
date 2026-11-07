//! The navigation interface: a node's facts by its descendant index
//! (`Kid`), its children in order and its parent, over a tree's source
//! text. Trivia placement reads a tree through it alone, so one placement
//! serves every backer.

use crate::types::{KindId, NodeIndex, Span};
use std::sync::Arc;

/// What navigation reads of a node: its descendant index, its bytes, the
/// nodes under it counting itself, its grammar kind, whether it is named,
/// whether it is an entry (an extra or an `ERROR`), a leaf (no entry, no
/// children) or a holder of sides (`trivia_table::holds_sides`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Kid {
    pub index: NodeIndex,
    pub start: u32,
    pub end: u32,
    pub count: u32,
    pub kind: KindId,
    pub named: bool,
    pub entry: bool,
    pub leaf: bool,
    pub holder: bool,
}

impl Kid {
    /// What navigation reads of the tree-sitter node `node` at `index`.
    #[must_use]
    pub fn of(node: &tree_sitter::Node<'_>, index: NodeIndex) -> Self {
        let Span { start, end } = Span::of(node);
        let entry = crate::trivia_table::is_entry(node);
        Self {
            index,
            start,
            end,
            count: crate::read::descendant_count(node),
            kind: crate::read::grammar_id(node),
            named: node.is_named(),
            entry,
            leaf: !entry && node.child_count() == 0,
            holder: crate::trivia_table::holds_sides(node),
        }
    }

    /// Whether the node's bytes hold the byte at `byte`.
    #[must_use]
    pub fn holds(&self, byte: u32) -> bool {
        self.start <= byte && byte < self.end
    }
}

/// How navigation finds the nodes of one parse: each node by its descendant
/// index, the root's being `NodeIndex::ROOT`, and the text their bytes index.
pub trait Nodes<'t> {
    /// The source text the nodes' bytes index.
    fn text(&self) -> &'t str;
    /// The node at `index`.
    fn kid(&mut self, index: NodeIndex) -> Kid;
    /// The children of the node at `index`, in order.
    fn kids(&mut self, index: NodeIndex) -> Arc<[Kid]>;
    /// The parent of the node at `index`, `None` for the root.
    fn parent(&mut self, index: NodeIndex) -> Option<NodeIndex>;
}

/// Navigation over a tree-sitter tree: one cursor, made on the first move,
/// that moves from where it last stood, up to the lowest node that holds the
/// next one and down from there (`read::goto_from`).
pub struct TreeNodes<'t> {
    tree: &'t tree_sitter::Tree,
    text: &'t str,
    cursor: Option<tree_sitter::TreeCursor<'t>>,
    root_descents: u32,
}

impl<'t> TreeNodes<'t> {
    /// Navigation over `tree`, parsed from `text`.
    #[must_use]
    pub fn new(tree: &'t tree_sitter::Tree, text: &'t str) -> Self {
        Self { tree, text, cursor: None, root_descents: 0 }
    }

    /// The moves that started down from the root to a node below the
    /// root's children: those whose target no node below the root on the
    /// cursor's path holds.
    #[must_use]
    pub fn root_descents(&self) -> u32 {
        self.root_descents
    }

    fn goto(&mut self, index: NodeIndex) -> &mut tree_sitter::TreeCursor<'t> {
        let tree = self.tree;
        let cursor = self.cursor.get_or_insert_with(|| tree.walk());
        let (_, from_root) = crate::read::goto_from_noting_top(cursor, NodeIndex::ROOT, index);
        if from_root && index != NodeIndex::ROOT {
            cursor.goto_parent();
            if crate::read::index_of(cursor) != NodeIndex::ROOT {
                self.root_descents += 1;
            }
            crate::read::goto_from(cursor, NodeIndex::ROOT, index);
        }
        cursor
    }
}

impl<'t> Nodes<'t> for TreeNodes<'t> {
    fn text(&self) -> &'t str {
        self.text
    }

    fn kid(&mut self, index: NodeIndex) -> Kid {
        Kid::of(&self.goto(index).node(), index)
    }

    fn kids(&mut self, index: NodeIndex) -> Arc<[Kid]> {
        let cursor = self.goto(index);
        let mut kids = Vec::new();
        if cursor.goto_first_child() {
            loop {
                kids.push(Kid::of(&cursor.node(), crate::read::index_of(cursor)));
                if !cursor.goto_next_sibling() {
                    break;
                }
            }
            cursor.goto_parent();
        }
        kids.into()
    }

    fn parent(&mut self, index: NodeIndex) -> Option<NodeIndex> {
        let cursor = self.goto(index);
        cursor.goto_parent().then(|| crate::read::index_of(cursor))
    }
}
