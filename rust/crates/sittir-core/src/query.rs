//! The native half of a node query: the `where` plan a query compiles to, and
//! the batch a descendant walk returns.

use crate::read_untyped_node::{child_slot, stamped_kind, ReadModel};
use crate::types::UntypedNode;

/// One batch of [`crate::engine::ParsedTree::descendants`]: the stubs found,
/// each carrying the coordinate it is hydrated at, the path to resume after
/// (`None` once the walk is done), and the walk's start as its own handle, so
/// the next batch names it without minting it again.
#[derive(serde::Serialize)]
pub struct DescendantBatch {
    pub stubs: Vec<UntypedNode>,
    pub resume: Option<Vec<u32>>,
    pub origin: u64,
}

/// A parsed node as a query names it: its own handle, the parent handle and
/// child index a stub carries, or, for a node a deep read left without a
/// handle, its tree's tag, its span and its stamped kind. The handle and span
/// forms are spelled as the line-gap query spells them.
#[derive(serde::Deserialize, Clone, Copy, Debug)]
#[serde(untagged)]
pub enum Address {
    Own { handle: u64 },
    Child { parent: u64, index: u32 },
    Span {
        #[serde(rename = "treeHandle")]
        tree: u64,
        span: crate::types::Span,
        kind: u16,
    },
}

impl Address {
    /// A handle tagged with the tree the address names.
    pub fn tree_handle(&self) -> u64 {
        match *self {
            Address::Own { handle } => handle,
            Address::Child { parent, .. } => parent,
            Address::Span { tree, .. } => tree,
        }
    }
}

/// A `where` condition over a node's model slots, as the portable layer
/// records it. A slot is found through the same routing the reader stores
/// children by (`child_slot`), so the plan names model slots and nothing maps
/// them to parser fields a second time.
#[derive(serde::Deserialize)]
#[serde(tag = "op", rename_all = "lowercase")]
pub enum PlanSpec {
    Eq { slot: String, text: String },
    Match { slot: String, pattern: String },
    Not { of: Box<PlanSpec> },
    And { of: Vec<PlanSpec> },
    Or { of: Vec<PlanSpec> },
}

/// A [`PlanSpec`] with its patterns compiled.
pub enum Plan {
    Eq { slot: String, text: String },
    Match { slot: String, pattern: regex::Regex },
    Not(Box<Plan>),
    And(Vec<Plan>),
    Or(Vec<Plan>),
}

impl Plan {
    /// Compile a recorded plan. A pattern the `regex` crate cannot compile (a
    /// back-reference, a look-around) is refused, never matched differently.
    pub fn compile(spec: PlanSpec) -> Result<Plan, String> {
        Ok(match spec {
            PlanSpec::Eq { slot, text } => Plan::Eq { slot, text },
            PlanSpec::Match { slot, pattern } => Plan::Match {
                slot,
                pattern: regex::Regex::new(&pattern).map_err(|e| e.to_string())?,
            },
            PlanSpec::Not { of } => Plan::Not(Box::new(Plan::compile(*of)?)),
            PlanSpec::And { of } => Plan::And(of.into_iter().map(Plan::compile).collect::<Result<_, _>>()?),
            PlanSpec::Or { of } => Plan::Or(of.into_iter().map(Plan::compile).collect::<Result<_, _>>()?),
        })
    }

    /// Whether `node` satisfies the condition: a comparison holds when some
    /// value in the slot has the text or matches.
    pub fn holds(&self, node: &tree_sitter::Node<'_>, source: &str, model: &dyn ReadModel) -> bool {
        match self {
            Plan::Eq { slot, text } => any_value(node, source, model, slot, |value| value == text),
            Plan::Match { slot, pattern } => any_value(node, source, model, slot, |value| pattern.is_match(value)),
            Plan::Not(of) => !of.holds(node, source, model),
            Plan::And(of) => of.iter().all(|p| p.holds(node, source, model)),
            Plan::Or(of) => of.iter().any(|p| p.holds(node, source, model)),
        }
    }
}

/// Whether some child of `node` the reader stores under `slot` has source
/// text passing `test`.
fn any_value(node: &tree_sitter::Node<'_>, source: &str, model: &dyn ReadModel, slot: &str, test: impl Fn(&str) -> bool) -> bool {
    let parent_kind = stamped_kind(node);
    (0..node.child_count() as u32).any(|i| {
        node.child(i).is_some_and(|child| {
            !child.is_extra()
                && child_slot(model, parent_kind, node.field_name_for_child(i), &child) == Some(slot)
                && source.get(child.byte_range()).is_some_and(&test)
        })
    })
}
