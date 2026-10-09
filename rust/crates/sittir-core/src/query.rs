//! The native half of a node query: the `where` plan a query compiles to, and
//! the batch a descendant walk returns.

use crate::slot::NodeCoordinate;
use crate::types::Span;

/// One batch of [`crate::engine::ParsedTree::descendants`]: the coordinates of
/// the nodes found, each the coordinate a read of its parent hands out, the
/// path to resume after (`None` once the walk is done), and the walk's start
/// as its own handle, so the next batch names it without minting it again.
#[derive(serde::Serialize)]
pub struct DescendantBatch {
    pub coordinates: Vec<QueryCoordinate>,
    pub resume: Option<Vec<u32>>,
    pub origin: u64,
}

/// A node a walk found, as it crosses: `{ $treeHandle, $span, $type }`.
#[derive(serde::Serialize, Debug, Clone, Copy, PartialEq, Eq)]
pub struct QueryCoordinate {
    #[serde(rename = "$treeHandle")]
    pub handle: u64,
    #[serde(rename = "$span")]
    pub span: Span,
    #[serde(rename = "$type")]
    pub kind: u16,
}

impl From<NodeCoordinate> for QueryCoordinate {
    fn from(coord: NodeCoordinate) -> Self {
        QueryCoordinate { handle: coord.handle, span: coord.span, kind: coord.kind.map_or(0, |kind| kind.0) }
    }
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

/// A slot as the parser spells it: the fields its children arrive under, and
/// the kinds of its children that arrive under no field. The client compiles a
/// `where` condition's slots to these, so the evaluator knows no slot names.
#[derive(serde::Deserialize)]
pub struct Routes {
    pub fields: Vec<String>,
    pub kinds: Vec<String>,
}

impl Routes {
    fn admits(&self, field: Option<&str>, child: &tree_sitter::Node<'_>) -> bool {
        match field {
            Some(field) => self.fields.iter().any(|f| f == field),
            None => self.kinds.iter().any(|k| k == child.kind()),
        }
    }
}

/// A `where` condition over a node's slots, each slot given by its parser
/// routes.
#[derive(serde::Deserialize)]
#[serde(tag = "op", rename_all = "lowercase")]
pub enum PlanSpec {
    Eq {
        #[serde(flatten)]
        routes: Routes,
        text: String,
    },
    Match {
        #[serde(flatten)]
        routes: Routes,
        pattern: String,
    },
    Not { of: Box<PlanSpec> },
    And { of: Vec<PlanSpec> },
    Or { of: Vec<PlanSpec> },
}

/// A [`PlanSpec`] with its patterns compiled.
pub enum Plan {
    Eq { routes: Routes, text: String },
    Match { routes: Routes, pattern: regex::Regex },
    Not(Box<Plan>),
    And(Vec<Plan>),
    Or(Vec<Plan>),
}

impl Plan {
    /// Compile a recorded plan. A pattern the `regex` crate cannot compile (a
    /// back-reference, a look-around) is refused, never matched differently.
    pub fn compile(spec: PlanSpec) -> Result<Plan, String> {
        Ok(match spec {
            PlanSpec::Eq { routes, text } => Plan::Eq { routes, text },
            PlanSpec::Match { routes, pattern } => Plan::Match {
                routes,
                pattern: regex::Regex::new(&pattern).map_err(|e| e.to_string())?,
            },
            PlanSpec::Not { of } => Plan::Not(Box::new(Plan::compile(*of)?)),
            PlanSpec::And { of } => Plan::And(of.into_iter().map(Plan::compile).collect::<Result<_, _>>()?),
            PlanSpec::Or { of } => Plan::Or(of.into_iter().map(Plan::compile).collect::<Result<_, _>>()?),
        })
    }

    /// Whether `node` satisfies the condition: a comparison holds when some
    /// child the slot's routes admit has the text or matches.
    pub fn holds(&self, node: &tree_sitter::Node<'_>, source: &str) -> bool {
        match self {
            Plan::Eq { routes, text } => any_value(node, source, routes, |value| value == text),
            Plan::Match { routes, pattern } => any_value(node, source, routes, |value| pattern.is_match(value)),
            Plan::Not(of) => !of.holds(node, source),
            Plan::And(of) => of.iter().all(|p| p.holds(node, source)),
            Plan::Or(of) => of.iter().any(|p| p.holds(node, source)),
        }
    }
}

/// Whether some non-extra child of `node` that `routes` admit has source text
/// passing `test`.
fn any_value(node: &tree_sitter::Node<'_>, source: &str, routes: &Routes, test: impl Fn(&str) -> bool) -> bool {
    (0..node.child_count() as u32).any(|i| {
        node.child(i).is_some_and(|child| {
            !child.is_extra() && routes.admits(node.field_name_for_child(i), &child) && source.get(child.byte_range()).is_some_and(&test)
        })
    })
}
