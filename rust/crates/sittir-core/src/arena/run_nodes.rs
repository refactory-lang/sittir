//! Navigation over parsed records alone (`Nodes`): a node's facts from its
//! record's side record or its row in its holder's run, its children from
//! that run, in document order, and its parent from its record's parent
//! word. No table of the tree's nodes is kept: a node is known to one
//! navigation by the id the navigation gives it when it first meets it, and
//! the ids go with the navigation. The source's root is id 0; an id says
//! nothing of where its node lies among the others.

use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;
use std::sync::Arc;

use super::side::{NodeFacts, RunEntry};
use super::{Address, ArenaError, ArenaRead, SideRecord};
use crate::nodes::{Kid, Nodes};
use crate::options::Side;
use crate::types::{NodeIndex, Span};

/// Where a node is kept: its own record, or the entry of its row in the run
/// of the record `holder`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum NodeSite {
    Record(Address),
    Row { holder: Address, entry: u32 },
}

/// A node's parent as a navigation knows it: not looked up yet, none (a
/// source's root), or the node.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Parent {
    Unknown,
    Root,
    Node(NodeIndex),
}

struct Met {
    site: NodeSite,
    kid: Kid,
    facts: NodeFacts,
    parent: Parent,
    kids: Option<Arc<[Kid]>>,
}

#[derive(Default)]
struct Table {
    met: Vec<Met>,
    ids: HashMap<NodeSite, NodeIndex, crate::heap::IndexState>,
    sides: HashMap<Address, Rc<SideRecord>, crate::heap::IndexState>,
    refused: Option<ArenaError>,
}

/// Navigation over the parsed records of one source, in `arena`.
#[derive(Clone)]
pub struct RunNodes<'t> {
    arena: &'t dyn ArenaRead,
    text: &'t str,
    table: Rc<RefCell<Table>>,
}

fn malformed(what: &'static str, at: Address) -> ArenaError {
    ArenaError::Malformed { what, word: at.0 }
}

impl<'t> RunNodes<'t> {
    /// Navigation of the source whose root's record is at `root`, its bytes
    /// indexing `text`.
    ///
    /// # Errors
    ///
    /// What reading the root's record refuses.
    pub fn new(arena: &'t dyn ArenaRead, text: &'t str, root: Address) -> Result<Self, ArenaError> {
        let nodes = Self { arena, text, table: Rc::default() };
        nodes.record(root, Parent::Root)?;
        Ok(nodes)
    }

    /// The record of the source's root above the record at `at`, by its
    /// parent words.
    ///
    /// # Errors
    ///
    /// What reading a record on the way refuses.
    pub fn root_of(arena: &dyn ArenaRead, mut at: Address) -> Result<Address, ArenaError> {
        loop {
            let header = arena.words(at, crate::record::HEADER_WORDS)?;
            match SideRecord::read(arena, Address(header[1]))?.parent {
                Some(parent) => at = parent,
                None => return Ok(at),
            }
        }
    }

    /// What a read of the records refused, when one did: the nodes it was
    /// answering for read as leaves.
    #[must_use]
    pub fn refused(&self) -> Option<ArenaError> {
        self.table.borrow().refused.clone()
    }

    /// Where the node `index` names is kept.
    #[must_use]
    pub fn site(&self, index: NodeIndex) -> Option<NodeSite> {
        self.table.borrow().met.get(index.0 as usize).map(|met| met.site)
    }

    /// The id of the node whose record is at `at`.
    ///
    /// # Errors
    ///
    /// What reading the record refuses.
    pub fn index_of(&self, at: Address) -> Result<NodeIndex, ArenaError> {
        self.record(at, Parent::Unknown)
    }

    fn side(&self, at: Address) -> Result<Rc<SideRecord>, ArenaError> {
        if let Some(side) = self.table.borrow().sides.get(&at) {
            return Ok(Rc::clone(side));
        }
        let header = self.arena.words(at, crate::record::HEADER_WORDS)?;
        let side = Rc::new(SideRecord::read(self.arena, Address(header[1]))?);
        self.table.borrow_mut().sides.insert(at, Rc::clone(&side));
        Ok(side)
    }

    /// The record that is the node of the record at `at`: itself, or, for a
    /// content read from its envelope's own node, its envelope's.
    fn node_record(&self, mut at: Address) -> Result<Address, ArenaError> {
        loop {
            let side = self.side(at)?;
            let Some(parent) = side.parent else { return Ok(at) };
            let shared = self.side(parent)?.run.contains(&RunEntry::Record { at, shared: true });
            if !shared {
                return Ok(at);
            }
            at = parent;
        }
    }

    fn meet(&self, site: NodeSite, facts: NodeFacts, span: Span, childless: bool, parent: Parent) -> NodeIndex {
        let mut table = self.table.borrow_mut();
        if let Some(&index) = table.ids.get(&site) {
            if table.met[index.0 as usize].parent == Parent::Unknown {
                table.met[index.0 as usize].parent = parent;
            }
            return index;
        }
        let index = NodeIndex(crate::types::narrow(table.met.len()));
        let kid = Kid { index, start: span.start, end: span.end, count: if childless { 1 } else { 2 }, grammar: facts.kind, display: facts.display(), field: facts.field, named: facts.named, extra: facts.extra };
        table.met.push(Met { site, kid, facts, parent, kids: None });
        table.ids.insert(site, index);
        index
    }

    fn record(&self, at: Address, parent: Parent) -> Result<NodeIndex, ArenaError> {
        let at = self.node_record(at)?;
        let side = self.side(at)?;
        let facts = side.node.ok_or(malformed("parsed record facts", at))?;
        let span = side.at.ok_or(malformed("parsed record row", at))?.span;
        let childless = self.entries(at)?.is_empty();
        Ok(self.meet(NodeSite::Record(at), facts, span, childless, parent))
    }

    /// The entries of the children of the node whose record is at `at`,
    /// each with the record whose run holds it and its place there: its
    /// own run's, a shared content's in place of the content.
    fn entries(&self, at: Address) -> Result<Vec<(Address, u32, RunEntry)>, ArenaError> {
        let mut out = Vec::new();
        self.entries_into(at, &mut out)?;
        Ok(out)
    }

    fn entries_into(&self, at: Address, out: &mut Vec<(Address, u32, RunEntry)>) -> Result<(), ArenaError> {
        let side = self.side(at)?;
        let mut entry = 0;
        while let Some(&found) = side.run.get(entry) {
            match found {
                RunEntry::Record { at: content, shared: true } => self.entries_into(content, out)?,
                found => out.push((at, crate::types::narrow(entry), found)),
            }
            entry += 1 + match found {
                RunEntry::Row { inner, .. } => inner as usize,
                RunEntry::Record { .. } => 0,
            };
        }
        Ok(())
    }

    /// The entries inside the row at `entry` of the run of `holder`, one
    /// level down.
    fn inside(&self, holder: Address, entry: u32) -> Result<Vec<(Address, u32, RunEntry)>, ArenaError> {
        let side = self.side(holder)?;
        let Some(&RunEntry::Row { inner, .. }) = side.run.get(entry as usize) else { return Err(malformed("run row", holder)) };
        let (mut at, end) = (entry as usize + 1, entry as usize + 1 + inner as usize);
        let mut out = Vec::new();
        while at < end {
            let found = *side.run.get(at).ok_or(malformed("run row entries", holder))?;
            out.push((holder, crate::types::narrow(at), found));
            at += 1 + match found {
                RunEntry::Row { inner, .. } => inner as usize,
                RunEntry::Record { .. } => 0,
            };
        }
        Ok(out)
    }

    fn kids_of(&self, index: NodeIndex) -> Result<Arc<[Kid]>, ArenaError> {
        let site = self.site(index).ok_or(ArenaError::Malformed { what: "node id", word: index.0 })?;
        let entries = match site {
            NodeSite::Record(at) => self.entries(at)?,
            NodeSite::Row { holder, entry } => self.inside(holder, entry)?,
        };
        let mut kids = Vec::with_capacity(entries.len());
        for (holder, entry, found) in entries {
            let kid = match found {
                RunEntry::Record { at, .. } => self.record(at, Parent::Node(index))?,
                RunEntry::Row { facts, span, inner } => self.meet(NodeSite::Row { holder, entry }, facts, span, inner == 0, Parent::Node(index)),
            };
            kids.push(self.table.borrow().met[kid.0 as usize].kid);
        }
        Ok(kids.into())
    }

    fn parent_of(&self, index: NodeIndex) -> Result<Option<NodeIndex>, ArenaError> {
        let (site, known) = {
            let table = self.table.borrow();
            let met = table.met.get(index.0 as usize).ok_or(ArenaError::Malformed { what: "node id", word: index.0 })?;
            (met.site, met.parent)
        };
        match known {
            Parent::Root => return Ok(None),
            Parent::Node(parent) => return Ok(Some(parent)),
            Parent::Unknown => {}
        }
        let NodeSite::Record(at) = site else { return Err(ArenaError::Malformed { what: "row parent", word: index.0 }) };
        let parent = match self.side(at)?.parent {
            Some(parent) => Some(self.record(parent, Parent::Unknown)?),
            None => None,
        };
        self.table.borrow_mut().met[index.0 as usize].parent = parent.map_or(Parent::Root, Parent::Node);
        Ok(parent)
    }

    fn answer<T>(&self, answered: Result<T, ArenaError>, otherwise: T) -> T {
        answered.unwrap_or_else(|refusal| {
            self.table.borrow_mut().refused.get_or_insert(refusal);
            otherwise
        })
    }

    fn facts(&self, index: NodeIndex) -> Option<NodeFacts> {
        self.table.borrow().met.get(index.0 as usize).map(|met| met.facts)
    }
}

impl<'t> Nodes<'t> for RunNodes<'t> {
    fn text(&self) -> &'t str {
        self.text
    }

    fn kid(&mut self, index: NodeIndex) -> Kid {
        let known = self.table.borrow().met.get(index.0 as usize).map(|met| met.kid);
        let unknown = Kid { index, start: 0, end: 0, count: 1, grammar: crate::types::KindId::ERROR, display: crate::types::KindId::ERROR, field: None, named: false, extra: false };
        self.answer(known.ok_or(ArenaError::Malformed { what: "node id", word: index.0 }), unknown)
    }

    fn kids(&mut self, index: NodeIndex) -> Arc<[Kid]> {
        if let Some(kids) = self.table.borrow().met.get(index.0 as usize).and_then(|met| met.kids.clone()) {
            return kids;
        }
        let kids = self.answer(self.kids_of(index), Arc::from([]));
        if let Some(met) = self.table.borrow_mut().met.get_mut(index.0 as usize) {
            met.kids = Some(Arc::clone(&kids));
        }
        kids
    }

    fn edge(&mut self, index: NodeIndex, side: Side) -> Option<Kid> {
        let kids = self.kids(index);
        match side {
            Side::Before => kids.first().copied(),
            Side::After => kids.last().copied(),
        }
    }

    fn parent(&mut self, index: NodeIndex) -> Option<NodeIndex> {
        self.answer(self.parent_of(index), None)
    }

    fn missing(&mut self, index: NodeIndex) -> bool {
        self.facts(index).is_some_and(|facts| facts.missing)
    }

    fn holds_error(&mut self, index: NodeIndex) -> bool {
        self.facts(index).is_some_and(|facts| facts.holds_error)
    }
}
