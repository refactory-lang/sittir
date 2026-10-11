//! A parsed tree's trivia, assigned once to the sides of its nodes.
//!
//! The token walk yields a tree's tokens in order: its leaves, the text a
//! hidden token leaves between two children, zero-width leaves, and a
//! zero-width token at each node edge that reaches past the node's own first
//! or last token, which is where a hidden external token that is no node
//! (python's indent and dedent) bounds it. Extras and `ERROR` nodes are
//! entries, never tokens, and whitespace is never a token. Gap *k* lies
//! between token *k* and token *k + 1*; the gaps before the first token and
//! after the last are the file's edges.
//!
//! A gap's owner is the smallest node containing both its tokens, or the root
//! at the file's edges. Its entries go to the owner's named child beside the
//! gap: an entry starting on token *k*'s row trails the child ending at token
//! *k*, the rest lead the child starting at token *k + 1*. With no child on
//! one side, every entry goes to the child on the other; an owner with no
//! named child takes them as its `inner`; an owner whose named children are
//! not beside the gap takes none (`unowned`). The child is the owner's own
//! child, so the outermost node ending or starting at the token takes the
//! side. A run of whitespace holding a line break is a layout entry, placed
//! as an entry ending on its last row is: it leads the child after it, or
//! trails the child before it when none follows. A run on one line is no
//! entry.

use std::collections::BTreeMap;

/// A side of a node that holds trivia: before its first token, after its
/// last, or, for a node with no named child, between its own tokens.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum TriviaSide {
    Leading,
    Trailing,
    Inner,
}

/// One token of the walk, by its bytes and the node it is (a leaf) or belongs
/// to (hidden text or a node edge, `own`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Token {
    pub start: u32,
    pub end: u32,
    pub node: u32,
    pub own: bool,
}

/// An entry the assignment gives a side: an extra or an `ERROR` by its
/// descendant index, or a run of whitespace holding a line break by its bytes.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Assigned {
    Extra(u32),
    Error(u32),
    Layout { start: u32, end: u32 },
}

/// The nodes of a tree by descendant index, as far as the walk reads them.
struct Nodes {
    parent: Vec<u32>,
    depth: Vec<u32>,
    start: Vec<u32>,
    end: Vec<u32>,
    holder: Vec<bool>,
    holds: Vec<bool>,
}

const NONE: u32 = u32::MAX;

/// The walk under one node: its tokens in source order, its entries by
/// descendant index in source order, and what the assignment reads of its
/// nodes, each kept by its index less the walk's start.
pub struct Walk {
    pub tokens: Vec<Token>,
    pub entries: Vec<u32>,
    nodes: Nodes,
    base: u32,
}

impl Walk {
    /// The bytes of the node at descendant `index`, which lies under the walk's start.
    pub fn span(&self, index: u32) -> (u32, u32) {
        let at = (index - self.base) as usize;
        (self.nodes.start[at], self.nodes.end[at])
    }
}

fn is_entry(node: &tree_sitter::Node<'_>) -> bool {
    node.is_extra() || node.is_error()
}

/// The walk under `node`, the node at descendant `index` of its tree. The
/// walk's start has no edge tokens of its own: they would lie at its bounds.
pub fn walk(node: tree_sitter::Node<'_>, index: u32, source: &str) -> Walk {
    let count = node.descendant_count();
    let mut nodes = Nodes {
        parent: vec![NONE; count],
        depth: vec![0; count],
        start: vec![0; count],
        end: vec![0; count],
        holder: vec![false; count],
        holds: vec![false; count],
    };
    let mut tokens: Vec<Token> = Vec::new();
    let mut entries: Vec<u32> = Vec::new();
    struct Frame {
        at_index: u32,
        before: usize,
        at: u32,
    }
    let mut frames: Vec<Frame> = Vec::new();
    let hidden = |tokens: &mut Vec<Token>, owner: u32, from: u32, to: u32| {
        let Some(text) = source.get(from as usize..to as usize) else { return };
        let trimmed = text.trim();
        if trimmed.is_empty() {
            return;
        }
        let start = from + (text.len() - text.trim_start().len()) as u32;
        tokens.push(Token { start, end: start + trimmed.len() as u32, node: owner + index, own: true });
    };
    let mut cursor = node.walk();
    loop {
        let node = cursor.node();
        let local = cursor.descendant_index() as u32;
        let (start, end) = (node.start_byte() as u32, node.end_byte() as u32);
        let i = local as usize;
        nodes.start[i] = start;
        nodes.end[i] = end;
        let depth = frames.len() as u32;
        if let Some(frame) = frames.last() {
            nodes.parent[i] = frame.at_index;
            nodes.depth[i] = depth;
            hidden(&mut tokens, frame.at_index, frame.at, start);
        }
        let entry = is_entry(&node);
        nodes.holder[i] = node.is_named() && !entry;
        if nodes.holder[i] && nodes.parent[i] != NONE {
            nodes.holds[nodes.parent[i] as usize] = true;
        }
        if entry {
            entries.push(local + index);
        } else if node.child_count() == 0 {
            tokens.push(Token { start, end, node: local + index, own: false });
        } else {
            frames.push(Frame { at_index: local, before: tokens.len(), at: start });
            cursor.goto_first_child();
            continue;
        }
        if let Some(frame) = frames.last_mut() {
            frame.at = end;
        }
        loop {
            if !frames.is_empty() && cursor.goto_next_sibling() {
                break;
            }
            let Some(frame) = frames.pop() else {
                tokens.sort_by_key(|token| (token.start, token.end));
                return Walk { tokens, entries, nodes, base: index };
            };
            cursor.goto_parent();
            let (start, end) = (nodes.start[frame.at_index as usize], nodes.end[frame.at_index as usize]);
            hidden(&mut tokens, frame.at_index, frame.at, end);
            if frame.at_index != 0 {
                let own = &tokens[frame.before..];
                let first = own.iter().map(|token| token.start).min();
                let last = own.iter().map(|token| token.end).max();
                if first.is_some_and(|first| start < first) {
                    tokens.push(Token { start, end: start, node: frame.at_index + index, own: true });
                }
                if last.is_some_and(|last| end > last) {
                    tokens.push(Token { start: end, end, node: frame.at_index + index, own: true });
                }
            }
            if let Some(parent) = frames.last_mut() {
                parent.at = end;
            }
        }
    }
}

/// The tokens under the node at `index` of `tree`, in source order
/// (`TriviaTable`'s walk, from that node).
pub fn tokens(tree: &tree_sitter::Tree, source: &str, index: u32) -> Vec<Token> {
    let mut cursor = tree.walk();
    cursor.goto_descendant(index as usize);
    walk(cursor.node(), index, source).tokens
}

impl Nodes {
    fn common(&self, mut a: u32, mut b: u32) -> u32 {
        while self.depth[a as usize] > self.depth[b as usize] {
            a = self.parent[a as usize];
        }
        while self.depth[b as usize] > self.depth[a as usize] {
            b = self.parent[b as usize];
        }
        while a != b {
            a = self.parent[a as usize];
            b = self.parent[b as usize];
        }
        a
    }

    /// The child of `owner` on `node`'s chain of parents, when it holds trivia.
    fn holder_below(&self, owner: u32, node: u32) -> Option<u32> {
        let mut at = node;
        while at != NONE {
            let up = self.parent[at as usize];
            if up == owner {
                return self.holder[at as usize].then_some(at);
            }
            at = up;
        }
        None
    }
}

/// Where the assignment puts an entry of a gap.
enum Place {
    Side(u32, TriviaSide),
    Unowned,
}

/// The trivia of a parsed tree, assigned once to its nodes' sides.
#[derive(Debug, Default)]
pub struct TriviaTable {
    sides: BTreeMap<(u32, TriviaSide), Vec<Assigned>>,
    unowned: Vec<u32>,
}

impl TriviaTable {
    /// The table of `tree`, parsed from `source`.
    pub fn assign(tree: &tree_sitter::Tree, source: &str) -> Self {
        let Walk { tokens, entries, nodes, .. } = walk(tree.root_node(), 0, source);
        let lines = crate::points::LineTable::new(source);
        let row = |byte: u32| lines.point(byte as usize).map_or(0, |point| point.row);
        let mut table = TriviaTable::default();
        let place = |left: Option<&Token>, right: Option<&Token>, starts_on_left_row: bool| -> Place {
            let owner = match (left, right) {
                (Some(left), Some(right)) => nodes.common(left.node, right.node),
                _ => 0,
            };
            if !nodes.holds[owner as usize] {
                return Place::Side(owner, TriviaSide::Inner);
            }
            let before = left.and_then(|left| nodes.holder_below(owner, left.node).filter(|&child| nodes.end[child as usize] == left.end));
            let after = right.and_then(|right| nodes.holder_below(owner, right.node).filter(|&child| nodes.start[child as usize] == right.start));
            match (before, after) {
                (None, None) => Place::Unowned,
                (Some(before), None) => Place::Side(before, TriviaSide::Trailing),
                (None, Some(after)) => Place::Side(after, TriviaSide::Leading),
                (Some(before), Some(after)) => {
                    if starts_on_left_row {
                        Place::Side(before, TriviaSide::Trailing)
                    } else {
                        Place::Side(after, TriviaSide::Leading)
                    }
                }
            }
        };
        let mut push = |place: Place, entry: Assigned| match place {
            Place::Side(node, side) => table.sides.entry((node, side)).or_default().push(entry),
            Place::Unowned => {
                if let Assigned::Extra(index) | Assigned::Error(index) = entry {
                    table.unowned.push(index);
                }
            }
        };
        let mut next = entries.iter().peekable();
        for k in 0..=tokens.len() {
            let left = k.checked_sub(1).map(|k| &tokens[k]);
            let right = tokens.get(k);
            let from = left.map_or(0, |token| token.end);
            let to = right.map_or(source.len() as u32, |token| token.start);
            let left_row = left.map(|token| row(token.end));
            let mut at = from;
            let run = |at: u32, until: u32, push: &mut dyn FnMut(Place, Assigned)| {
                if source.get(at as usize..until as usize).is_some_and(|text| text.contains('\n')) {
                    push(place(left, right, false), Assigned::Layout { start: at, end: until });
                }
            };
            while let Some(&&index) = next.peek() {
                let (start, end) = (nodes.start[index as usize], nodes.end[index as usize]);
                if start >= to && !(start == to && right.is_some_and(|right| right.start == right.end && right.start == start && start < end)) {
                    break;
                }
                next.next();
                run(at, start, &mut push);
                let entry = if is_error_index(tree, index) { Assigned::Error(index) } else { Assigned::Extra(index) };
                push(place(left, right, left_row == Some(row(start))), entry);
                at = end;
            }
            run(at, to, &mut push);
        }
        table
    }

    /// The entries the assignment gives `side` of the node at `index`, in source order.
    pub fn side(&self, index: u32, side: TriviaSide) -> &[Assigned] {
        self.sides.get(&(index, side)).map_or(&[], Vec::as_slice)
    }

    /// The extras and `ERROR`s no side takes: between two of their owner's own
    /// tokens, with no named child beside them.
    pub fn unowned(&self) -> &[u32] {
        &self.unowned
    }
}

fn is_error_index(tree: &tree_sitter::Tree, index: u32) -> bool {
    let mut cursor = tree.walk();
    cursor.goto_descendant(index as usize);
    cursor.node().is_error()
}
