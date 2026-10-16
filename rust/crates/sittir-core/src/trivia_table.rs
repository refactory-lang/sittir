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
//! not beside the gap gives an extra or an `ERROR` to the nearest of them,
//! leading the next or else trailing the previous, and takes none of its
//! layout (`unowned`). A zero-width node holds no side. The child is the owner's own
//! child, so the outermost node ending or starting at the token takes the
//! side. A list node (the grammar's list kinds) passes an extra or an
//! `ERROR` to the item ending or starting at the token, where one does and
//! the surface exposes it as a node (not a unit kind): the surface exposes a
//! list's items, not the list. A layout run stays on the list, whose own
//! sides spell its edges. A run of whitespace is a layout entry, placed as an
//! entry ending on its last row is: it leads the child after it, or trails
//! the child before it when none follows. A side read turns it into a member
//! only where it deviates from what the read-time options write there, or,
//! in a gap of a list slot, from the class the slot stores
//! (`ParsedTree::deviation`, `list_slots`).

use crate::types::KindId;
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
/// descendant index; a run of whitespace between two tokens or entries, with
/// or without a line break, by its place among the table's runs
/// (`TriviaTable::runs`), its bytes, the descendant index of its owner (the smallest node holding the tokens
/// on both sides of the run's gap, or the node itself for its `inner` side)
/// and the signed number of depth members it carries (`depth`); an extra
/// that is a layout member (`SurfaceKinds::layout`) by its descendant index;
/// or depth members alone: those that restore an owner's excess at its end,
/// or those of a run at the file's edge, which stores no layout (`Depth`). A run after an entry placed on a node's leading side is on
/// that side too: it spells the gap from the entry to its owner.
///
/// A run's excess is how far its last line's indentation reaches past the
/// structural indentation at the token after it, in whole levels of the
/// indentation unit (floored, a tab counting as one level; negative where
/// it falls short). The structural indentation is that of the innermost
/// stretch a template indents there (`DepthRegion`): the indentation of the
/// line its first token starts, or one level past the stretch around it
/// where that token shares a line with what precedes it or it holds none. A run carries the
/// change in excess from the line before it. The excess the runs of an owner change is
/// restored where the owner ends, inside its span: on the trailing side of
/// its last child that holds trivia, or its `inner` side when no child does.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Assigned {
    Extra(u32),
    Error(u32),
    Layout { run: u32, start: u32, end: u32, owner: u32, depth: i32 },
    Member(u32),
    Depth(i32),
}

/// Where a template indents a node's children: after a literal child (the
/// first of the node's anonymous children with one of the texts) or from
/// the node's start, until before a literal child (the last with one of
/// the texts) or the node's end.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DepthAnchor {
    Start,
    End,
    After(&'static [&'static str]),
    Before(&'static [&'static str]),
}

/// One level of structural indentation a kind's template opens over a
/// stretch of its children.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct DepthRegion {
    pub kind: KindId,
    pub open: DepthAnchor,
    pub close: DepthAnchor,
}

/// The kinds of a grammar the assignment reads from its surface: the list
/// kinds, whose items the surface exposes in the list's place, the unit
/// kinds, which it exposes as a kind id rather than a node, the extra kinds
/// that are layout members, which it assigns as layout, the depth members
/// (`indent`, `dedent`, 0 where the grammar has none) and the kinds'
/// structural indentation (`depth`).
#[derive(Debug, Clone, Copy, Default)]
pub struct SurfaceKinds {
    pub lists: &'static [KindId],
    pub units: &'static [KindId],
    pub layout: &'static [KindId],
    pub indent: KindId,
    pub dedent: KindId,
    pub depth: &'static [DepthRegion],
}

/// The nodes of a tree by descendant index, as far as the walk reads them.
struct Nodes {
    kind: Vec<KindId>,
    parent: Vec<u32>,
    depth: Vec<u32>,
    start: Vec<u32>,
    end: Vec<u32>,
    holder: Vec<bool>,
    holds: Vec<bool>,
    count: Vec<u32>,
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

/// Whether `node` holds trivia sides: a child holds sides when it is named,
/// not an extra or `ERROR`, and has width. Width is read from the tree here;
/// a built node's child has the width of its rendered text, so a stored
/// automatic semicolon, which renders `"\n"`, has width there.
pub fn holds_sides(node: &tree_sitter::Node<'_>) -> bool {
    node.is_named() && !is_entry(node) && node.end_byte() > node.start_byte()
}

/// Whether `node` is empty: no child of it holds sides (`holds_sides`), so
/// the assignment gives it the trivia between its own tokens as `inner`.
pub fn is_empty(node: &tree_sitter::Node<'_>) -> bool {
    let mut cursor = node.walk();
    let holds = node.children(&mut cursor).any(|child| holds_sides(&child));
    !holds
}

/// The walk under `node`, the node at descendant `index` of its tree. The
/// walk's start has no edge tokens of its own: they would lie at its bounds.
pub fn walk(node: tree_sitter::Node<'_>, index: u32, source: &str) -> Walk {
    let count = node.descendant_count();
    let mut nodes = Nodes {
        kind: vec![KindId::BLANK; count],
        parent: vec![NONE; count],
        depth: vec![0; count],
        start: vec![0; count],
        end: vec![0; count],
        holder: vec![false; count],
        holds: vec![false; count],
        count: vec![0; count],
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
        nodes.kind[i] = crate::read::grammar_id(&node);
        nodes.start[i] = start;
        nodes.end[i] = end;
        nodes.count[i] = node.descendant_count() as u32;
        let depth = frames.len() as u32;
        if let Some(frame) = frames.last() {
            nodes.parent[i] = frame.at_index;
            nodes.depth[i] = depth;
            hidden(&mut tokens, frame.at_index, frame.at, start);
        }
        let entry = is_entry(&node);
        nodes.holder[i] = holds_sides(&node);
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

    /// The node beside a gap that takes its side, below `owner` on `node`'s
    /// chain of parents: the holder child at the gap's edge (`at_edge`), or,
    /// when that child is a list node and `kinds` passes through lists, the
    /// holder below it at the same edge that is not a unit kind.
    fn side_holder(&self, owner: u32, node: u32, kinds: Option<SurfaceKinds>, at_edge: impl Fn(u32) -> bool) -> Option<u32> {
        let mut child = self.holder_below(owner, node).filter(|&child| at_edge(child))?;
        let Some(kinds) = kinds else { return Some(child) };
        while kinds.lists.contains(&self.kind[child as usize]) {
            match self.holder_below(child, node).filter(|&inner| at_edge(inner) && !kinds.units.contains(&self.kind[inner as usize])) {
                Some(inner) => child = inner,
                None => break,
            }
        }
        Some(child)
    }

    /// Where the excess `owner`'s runs change is restored: the trailing side
    /// of its last child that holds trivia, passing through list children
    /// as `side_holder` does, or its `inner` side when no child holds any.
    fn restore_side(&self, owner: u32, kinds: SurfaceKinds) -> (u32, TriviaSide) {
        match self.holders(owner).next_back() {
            Some(child) => (self.through_lists(child, TriviaSide::Trailing, kinds), TriviaSide::Trailing),
            None => (owner, TriviaSide::Inner),
        }
    }

    /// Where an entry goes when no holder child of `owner` is beside its gap,
    /// from byte `from` to byte `to`: the leading side of the first holder
    /// child after the gap, else the trailing side of the last before it,
    /// passing through list children as `restore_side` does; the owner's
    /// `inner` side when it has no holder child.
    fn nearest_side(&self, owner: u32, from: u32, to: u32, kinds: SurfaceKinds) -> (u32, TriviaSide) {
        let after = self.holders(owner).find(|&child| self.start[child as usize] >= to);
        let before = || self.holders(owner).rev().find(|&child| self.end[child as usize] <= from);
        match after.map(|child| (child, TriviaSide::Leading)).or_else(|| before().map(|child| (child, TriviaSide::Trailing))) {
            Some((child, side)) => (self.through_lists(child, side, kinds), side),
            None => (owner, TriviaSide::Inner),
        }
    }

    /// The children of `parent` that hold trivia, in source order.
    fn holders(&self, parent: u32) -> impl DoubleEndedIterator<Item = u32> + '_ {
        (parent + 1..parent + self.count[parent as usize]).filter(move |&at| self.parent[at as usize] == parent && self.holder[at as usize])
    }

    /// `child`, or, while it is a list node, its first (for a `Leading`
    /// side) or last item that holds trivia and is not a unit kind.
    fn through_lists(&self, mut child: u32, side: TriviaSide, kinds: SurfaceKinds) -> u32 {
        while kinds.lists.contains(&self.kind[child as usize]) {
            let mut items = self.holders(child).filter(|&at| !kinds.units.contains(&self.kind[at as usize]));
            let item = if side == TriviaSide::Leading { items.next() } else { items.next_back() };
            match item {
                Some(inner) => child = inner,
                None => break,
            }
        }
        child
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
#[derive(Clone, Copy)]
enum Place {
    Side(u32, TriviaSide),
    Unowned,
}

/// A run of whitespace between two tokens or entries that a side takes,
/// with or without a line break, and empty where they touch: its bytes, the
/// side, its owner (`Assigned::Layout`), and whether it carries the layout
/// written between the tokens around it. The file's two edges are none.
///
/// Gaps that only a zero-width token parts (an automatic semicolon, a
/// dedent) are one gap to a render, which writes nothing for the token: the
/// layout written there lands in one of their runs, the first that holds
/// whitespace, else the last, and each other run `carries` none.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct LayoutRun {
    pub start: u32,
    pub end: u32,
    pub node: u32,
    pub side: TriviaSide,
    pub owner: u32,
    pub carries: bool,
}

/// The trivia of a parsed tree, assigned once to its nodes' sides.
#[derive(Debug, Default)]
pub struct TriviaTable {
    sides: BTreeMap<(u32, TriviaSide), Vec<Assigned>>,
    unowned: Vec<u32>,
    runs: Vec<LayoutRun>,
}

impl TriviaTable {
    /// The table of `tree`, parsed from `source`, whose grammar's surface
    /// kinds are `kinds` and whose indentation level is `unit` spaces wide.
    pub fn assign(tree: &tree_sitter::Tree, source: &str, kinds: SurfaceKinds, unit: u32) -> Self {
        let Walk { tokens, entries, nodes, .. } = walk(tree.root_node(), 0, source);
        let lines = crate::points::LineTable::new(source);
        let row = |byte: u32| lines.point(byte as usize).map_or(0, |point| point.row);
        let mut table = TriviaTable::default();
        let mut structure = Structure::new(tree, source, kinds.depth, &tokens, unit);
        let mut excess = Excess::default();
        let owner_of = |left: Option<&Token>, right: Option<&Token>| match (left, right) {
            (Some(left), Some(right)) => nodes.common(left.node, right.node),
            _ => 0,
        };
        let place = |left: Option<&Token>, right: Option<&Token>, starts_on_left_row: bool, through: Option<SurfaceKinds>| -> Place {
            let owner = owner_of(left, right);
            if !nodes.holds[owner as usize] {
                return Place::Side(owner, TriviaSide::Inner);
            }
            let before = left.and_then(|left| nodes.side_holder(owner, left.node, through, |child| nodes.end[child as usize] == left.end));
            let after = right.and_then(|right| nodes.side_holder(owner, right.node, through, |child| nodes.start[child as usize] == right.start));
            match (before, after) {
                (None, None) => match through {
                    Some(kinds) => {
                        let (node, side) = nodes.nearest_side(owner, left.map_or(0, |left| left.end), right.map_or(u32::MAX, |right| right.start), kinds);
                        Place::Side(node, side)
                    }
                    None => Place::Unowned,
                },
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
        let mut next = entries.iter().peekable();
        let mut parted = Parted::default();
        for k in 0..=tokens.len() {
            let left = k.checked_sub(1).map(|k| &tokens[k]);
            let right = tokens.get(k);
            let from = left.map_or(0, |token| token.end);
            let to = right.map_or(source.len() as u32, |token| token.start);
            let left_row = left.map(|token| row(token.end));
            excess.close_until(from, &mut table);
            let mut at = from;
            let mut led = None;
            let mut run = |at: u32, until: u32, led: Option<u32>, table: &mut TriviaTable, excess: &mut Excess| {
                let Some(text) = source.get(at as usize..until as usize) else { return };
                let place = led.map_or_else(|| place(left, right, false, None), |node| Place::Side(node, TriviaSide::Leading));
                let owner = match place {
                    Place::Side(node, TriviaSide::Inner) => node,
                    Place::Side(_, _) | Place::Unowned => owner_of(left, right),
                };
                let edge = at == 0 || until as usize == source.len();
                let depth = if text.contains('\n') {
                    let reach = structure.excess(&nodes, right.map_or(0, |right| right.node), until, text.rsplit('\n').next().unwrap_or_default());
                    excess.change(owner, nodes.end[owner as usize], reach, || nodes.restore_side(owner, kinds))
                } else {
                    0
                };
                match place {
                    Place::Side(node, side) if !edge => {
                        let joined = at == from && left.is_some_and(|left| left.start == left.end) && table.runs.last().is_some_and(|run| run.end == at);
                        let run = table.runs.len() as u32;
                        table.runs.push(LayoutRun { start: at, end: until, node, side, owner, carries: true });
                        parted.placed(&mut table.runs, joined);
                        table.push(place, Assigned::Layout { run, start: at, end: until, owner, depth });
                    }
                    _ if depth != 0 => table.push(place, Assigned::Depth(depth)),
                    _ => {}
                }
            };
            while let Some(&&index) = next.peek() {
                let (start, end) = (nodes.start[index as usize], nodes.end[index as usize]);
                if start >= to && !(start == to && right.is_some_and(|right| right.start == right.end && right.start == start && start < end)) {
                    break;
                }
                next.next();
                run(at, start, led, &mut table, &mut excess);
                if kinds.layout.contains(&nodes.kind[index as usize]) {
                    table.push(place(left, right, false, None), Assigned::Member(index));
                } else {
                    let entry = if is_error_index(tree, index) { Assigned::Error(index) } else { Assigned::Extra(index) };
                    let placed = place(left, right, left_row == Some(row(start)), Some(kinds));
                    led = match placed {
                        Place::Side(node, TriviaSide::Leading) => Some(node),
                        _ => None,
                    };
                    table.push(placed, entry);
                }
                at = end;
            }
            run(at, to, led, &mut table, &mut excess);
        }
        parted.finish(&mut table.runs);
        excess.close_until(u32::MAX, &mut table);
        table
    }

    fn push(&mut self, place: Place, entry: Assigned) {
        match place {
            Place::Side(node, side) => self.sides.entry((node, side)).or_default().push(entry),
            Place::Unowned => {
                if let Assigned::Extra(index) | Assigned::Error(index) | Assigned::Member(index) = entry {
                    self.unowned.push(index);
                }
            }
        }
    }

    /// The entries the assignment gives `side` of the node at `index`, in source order.
    pub fn side(&self, index: u32, side: TriviaSide) -> &[Assigned] {
        self.sides.get(&(index, side)).map_or(&[], Vec::as_slice)
    }

    /// The layout members no side takes: between two of their owner's own
    /// tokens, with no named child beside them.
    pub fn unowned(&self) -> &[u32] {
        &self.unowned
    }

    /// Every run of whitespace a side takes, in source order (`LayoutRun`).
    pub fn runs(&self) -> &[LayoutRun] {
        &self.runs
    }
}

/// The runs only zero-width tokens part from one another, as the
/// assignment places them (`LayoutRun::carries`): where the group so far
/// begins among the table's runs.
#[derive(Default)]
struct Parted {
    from: usize,
}

impl Parted {
    /// The run just placed, the last of `runs`, joins the group when only a
    /// zero-width token parts it from the run before it (`joined`), whatever
    /// follows it in its own gap; otherwise the group before it settles and
    /// it begins the next.
    fn placed(&mut self, runs: &mut [LayoutRun], joined: bool) {
        let last = runs.len() - 1;
        if !joined {
            Self::settle(&mut runs[self.from..last]);
            self.from = last;
        }
    }

    /// The last group settles.
    fn finish(&mut self, runs: &mut [LayoutRun]) {
        Self::settle(&mut runs[self.from..]);
    }

    /// A group of more than one run settles: all but its first run holding
    /// whitespace, else its last, carry none.
    fn settle(group: &mut [LayoutRun]) {
        if group.len() < 2 {
            return;
        }
        let carrier = group.iter().position(|run| run.start < run.end).unwrap_or(group.len() - 1);
        for (at, run) in group.iter_mut().enumerate() {
            run.carries = at == carrier;
        }
    }
}

/// The structural indentation of a tree: per node, the stretches its kind's
/// template indents (`DepthRegion`), as byte ranges, resolved on first use.
struct Structure<'t> {
    tree: &'t tree_sitter::Tree,
    source: &'t str,
    regions: &'static [DepthRegion],
    tokens: &'t [Token],
    unit: u32,
    spans: std::collections::HashMap<u32, Vec<(u32, u32)>>,
}

impl<'t> Structure<'t> {
    fn new(tree: &'t tree_sitter::Tree, source: &'t str, regions: &'static [DepthRegion], tokens: &'t [Token], unit: u32) -> Self {
        Self { tree, source, regions, tokens, unit: unit.max(1), spans: std::collections::HashMap::new() }
    }

    /// The width of `indentation`: its spaces, and `unit` per tab.
    fn width(&self, indentation: &str) -> i64 {
        indentation.chars().map(|c| if c == '\t' { i64::from(self.unit) } else { i64::from(c == ' ') }).sum()
    }

    /// The excess of a line indented by `indentation` whose first token
    /// starts at byte `at`, held by the node at `index`.
    fn excess(&mut self, nodes: &Nodes, index: u32, at: u32, indentation: &str) -> i32 {
        let unit = i64::from(self.unit);
        let reach = self.width(indentation) - self.structural(nodes, index, at);
        i32::try_from(reach.div_euclid(unit)).unwrap_or(0)
    }

    /// The structural indentation width at byte `at`: the stretches holding
    /// it, outermost first, each set by the line of its first token, or one
    /// unit past the stretch around it when that token does not start a line
    /// or the stretch holds none.
    fn structural(&mut self, nodes: &Nodes, index: u32, at: u32) -> i64 {
        if self.regions.is_empty() {
            return 0;
        }
        let mut holding = Vec::new();
        let mut node = index;
        while node != NONE {
            if self.regions.iter().any(|region| region.kind == nodes.kind[node as usize]) {
                holding.extend(self.spans_of(node).iter().copied().filter(|&(open, close)| open <= at && at < close));
            }
            node = nodes.parent[node as usize];
        }
        holding.sort_unstable();
        holding.iter().fold(0, |around, &(open, close)| {
            let first = self.tokens.partition_point(|token| token.start < open);
            let Some(token) = self.tokens.get(first).filter(|token| token.start < close) else { return around + i64::from(self.unit) };
            let line_start = self.source[..token.start as usize].rfind('\n').map_or(0, |at| at + 1);
            let before = &self.source[line_start..token.start as usize];
            if before.chars().all(|c| c == ' ' || c == '\t') {
                self.width(before)
            } else {
                around + i64::from(self.unit)
            }
        })
    }

    /// The node's stretches: from after its `open` anchor (its start, or the
    /// end of the literal child) to before its `close` anchor (its end, or
    /// the start of the literal child). A region whose literal the node
    /// lacks indents nothing.
    fn spans_of(&mut self, index: u32) -> &[(u32, u32)] {
        let (tree, source, regions) = (self.tree, self.source, self.regions);
        self.spans.entry(index).or_insert_with(|| {
            let mut cursor = tree.walk();
            cursor.goto_descendant(index as usize);
            let node = cursor.node();
            let literals: Vec<(u32, u32, &str)> = {
                let mut children = node.walk();
                node.children(&mut children)
                    .filter(|child| !child.is_named())
                    .filter_map(|child| source.get(child.byte_range()).map(|text| (child.start_byte() as u32, child.end_byte() as u32, text)))
                    .collect()
            };
            let kind = crate::read::grammar_id(&node);
            regions
                .iter()
                .filter(|region| region.kind == kind)
                .filter_map(|region| {
                    let open = match region.open {
                        DepthAnchor::Start => node.start_byte() as u32 + 1,
                        DepthAnchor::After(texts) => literals.iter().find(|(_, _, text)| texts.contains(text))?.1,
                        DepthAnchor::End | DepthAnchor::Before(_) => return None,
                    };
                    let close = match region.close {
                        DepthAnchor::End => node.end_byte() as u32,
                        DepthAnchor::Before(texts) => literals.iter().rev().find(|(_, _, text)| texts.contains(text))?.0,
                        DepthAnchor::Start | DepthAnchor::After(_) => return None,
                    };
                    Some((open, close))
                })
                .collect()
        })
    }
}

/// The running excess of an assignment, in source order, and the owners
/// whose runs changed it, innermost last, each with where it ends, the
/// excess it restores there and the side that takes the restore.
#[derive(Default)]
struct Excess {
    current: i32,
    open: Vec<OpenOwner>,
}

struct OpenOwner {
    owner: u32,
    end: u32,
    restore: i32,
    side: (u32, TriviaSide),
}

impl Excess {
    /// A run of `owner` (ending at `end`) at `excess`: the change from the
    /// running excess, which the owner restores at its end.
    fn change(&mut self, owner: u32, end: u32, excess: i32, side: impl FnOnce() -> (u32, TriviaSide)) -> i32 {
        let depth = excess - self.current;
        if depth != 0 && self.open.last().is_none_or(|open| open.owner != owner) {
            self.open.push(OpenOwner { owner, end, restore: self.current, side: side() });
        }
        self.current = excess;
        depth
    }

    /// Restore the excess of each owner that ends by byte `at`.
    fn close_until(&mut self, at: u32, table: &mut TriviaTable) {
        while let Some(open) = self.open.pop_if(|open| open.end <= at) {
            let depth = open.restore - self.current;
            if depth != 0 {
                table.sides.entry(open.side).or_default().push(Assigned::Depth(depth));
            }
            self.current = open.restore;
        }
    }
}

fn is_error_index(tree: &tree_sitter::Tree, index: u32) -> bool {
    let mut cursor = tree.walk();
    cursor.goto_descendant(index as usize);
    cursor.node().is_error()
}
