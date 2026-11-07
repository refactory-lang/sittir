//! The navigation interface: a node's facts by its descendant index
//! (`Kid`), its children in order and its parent, over a tree's source
//! text. Trivia placement reads a tree through it alone, so one placement
//! serves every backer.

use crate::types::{KindId, NodeIndex, Span};
use std::ops::Range;
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

/// Navigation over a tree-sitter tree: a cursor moved from where it last
/// stood, up to the lowest node that holds the next one and down from there
/// (`read::goto_from`). A reader lends the cursor it reads with, so
/// navigation starts where the reader stands; a node the lent cursor cannot
/// reach, or any node when none is lent, is found with a cursor of the
/// whole tree, made on the first such move.
pub struct TreeNodes<'t, 'c> {
    tree: &'t tree_sitter::Tree,
    text: &'t str,
    lent: Option<Lent<'t, 'c>>,
    own: Option<tree_sitter::TreeCursor<'t>>,
    climbs: u32,
    root_descents: u32,
}

/// A reader's cursor, created at the node at `nodes.start`, whose subtree
/// is `nodes`.
struct Lent<'t, 'c> {
    cursor: &'c mut tree_sitter::TreeCursor<'t>,
    nodes: Range<NodeIndex>,
}

impl<'t, 'c> TreeNodes<'t, 'c> {
    /// Navigation over `tree`, parsed from `text`, with no cursor lent.
    #[must_use]
    pub fn new(tree: &'t tree_sitter::Tree, text: &'t str) -> Self {
        Self { tree, text, lent: None, own: None, climbs: 0, root_descents: 0 }
    }

    /// Navigation over `tree`, parsed from `text`, that moves `cursor`,
    /// created at the node at `nodes.start` and standing anywhere in that
    /// node's subtree `nodes`, for every node of `nodes` but its first's
    /// parent.
    #[must_use]
    pub fn over(tree: &'t tree_sitter::Tree, text: &'t str, cursor: &'c mut tree_sitter::TreeCursor<'t>, nodes: Range<NodeIndex>) -> Self {
        Self { tree, text, lent: Some(Lent { cursor, nodes }), own: None, climbs: 0, root_descents: 0 }
    }

    /// The levels the cursors climbed to reach the nodes they moved to
    /// (`read::goto_from`), which bound the levels they descended but for
    /// the moves counted in `root_descents`.
    #[must_use]
    pub fn climbs(&self) -> u32 {
        self.climbs
    }

    /// The moves that started down from the node their cursor was created
    /// at to a node below its children: those whose target no node below
    /// that one on the cursor's path holds.
    #[must_use]
    pub fn root_descents(&self) -> u32 {
        self.root_descents
    }

    /// The cursor standing on the node at `index`, the lent one when it
    /// reaches the node and `lend` allows it, and the index of the node it
    /// was created at.
    fn goto(&mut self, index: NodeIndex, lend: bool) -> (&mut tree_sitter::TreeCursor<'t>, NodeIndex) {
        let tree = self.tree;
        let (cursor, top) = match &mut self.lent {
            Some(lent) if lend && lent.nodes.contains(&index) => (&mut *lent.cursor, lent.nodes.start),
            _ => (self.own.get_or_insert_with(|| tree.walk()), NodeIndex::ROOT),
        };
        let (climbed, from_top) = crate::read::goto_from_noting_top(cursor, top, index);
        self.climbs += climbed;
        if from_top && index != top {
            cursor.goto_parent();
            if crate::read::offset_of(cursor) != 0 {
                self.root_descents += 1;
            }
            crate::read::goto_from(cursor, top, index);
        }
        (cursor, top)
    }
}

impl<'t> Nodes<'t> for TreeNodes<'t, '_> {
    fn text(&self) -> &'t str {
        self.text
    }

    fn kid(&mut self, index: NodeIndex) -> Kid {
        Kid::of(&self.goto(index, true).0.node(), index)
    }

    fn kids(&mut self, index: NodeIndex) -> Arc<[Kid]> {
        let (cursor, top) = self.goto(index, true);
        let mut kids = Vec::new();
        if cursor.goto_first_child() {
            loop {
                kids.push(Kid::of(&cursor.node(), top + crate::read::offset_of(cursor)));
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
        let lend = self.lent.as_ref().is_none_or(|lent| lent.nodes.start != index);
        let (cursor, top) = self.goto(index, lend);
        cursor.goto_parent().then(|| top + crate::read::offset_of(cursor))
    }
}
