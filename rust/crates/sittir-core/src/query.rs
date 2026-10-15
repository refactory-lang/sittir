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

/// A node a walk found, as it crosses: `{ $treeHandle, $end, $span, $type }`, its
/// `$type` stamped as every coordinate's is (`ReadCtx::stamped_kind`).
#[derive(serde::Serialize, Debug, Clone, Copy, PartialEq, Eq)]
pub struct QueryCoordinate {
    #[serde(rename = "$treeHandle")]
    pub handle: u64,
    #[serde(rename = "$end")]
    pub end: u32,
    #[serde(rename = "$span")]
    pub span: Span,
    #[serde(rename = "$type")]
    pub kind: u16,
}

impl From<NodeCoordinate> for QueryCoordinate {
    fn from(coord: NodeCoordinate) -> Self {
        QueryCoordinate { handle: coord.handle(), end: coord.end, span: coord.span, kind: coord.kind.map_or(0, |kind| kind.0) }
    }
}

/// A parsed node as a query names it: its own handle, as the line-gap query
/// spells it, or a parent's handle and a child's position under it.
#[derive(serde::Deserialize, Clone, Copy, Debug)]
#[serde(untagged)]
pub enum Address {
    Own { handle: u64 },
    Child { parent: u64, index: u32 },
}

impl Address {
    /// A handle tagged with the tree the address names.
    pub fn tree_handle(&self) -> u64 {
        match *self {
            Address::Own { handle } => handle,
            Address::Child { parent, .. } => parent,
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
    Present {
        #[serde(flatten)]
        routes: Routes,
    },
    Is {
        #[serde(flatten)]
        routes: Routes,
        types: Vec<u16>,
    },
    Child {
        #[serde(flatten)]
        routes: Routes,
        #[serde(default)]
        anchor: Option<Anchor>,
        of: Box<PlanSpec>,
    },
    Not { of: Box<PlanSpec> },
    And { of: Vec<PlanSpec> },
    Or { of: Vec<PlanSpec> },
}

/// Which of the children a child step's routes admit it tests: the first, the
/// last, or the one child when exactly one is admitted.
#[derive(serde::Deserialize, Clone, Copy, Debug, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Anchor {
    First,
    Last,
    Only,
}

/// A [`PlanSpec`] with its patterns compiled.
pub enum Plan {
    Eq { routes: Routes, text: String },
    Match { routes: Routes, pattern: regex::Regex },
    Present { routes: Routes },
    Is { routes: Routes, types: Vec<u16> },
    Child { routes: Routes, anchor: Option<Anchor>, of: Box<Plan> },
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
            PlanSpec::Present { routes } => Plan::Present { routes },
            PlanSpec::Is { routes, types } => Plan::Is { routes, types },
            PlanSpec::Child { routes, anchor, of } => Plan::Child { routes, anchor, of: Box::new(Plan::compile(*of)?) },
            PlanSpec::Not { of } => Plan::Not(Box::new(Plan::compile(*of)?)),
            PlanSpec::And { of } => Plan::And(of.into_iter().map(Plan::compile).collect::<Result<_, _>>()?),
            PlanSpec::Or { of } => Plan::Or(of.into_iter().map(Plan::compile).collect::<Result<_, _>>()?),
        })
    }

    /// Whether `node` satisfies the condition: a comparison holds when some
    /// child the slot's routes admit has the text or matches, a presence leaf
    /// when some child the slot's routes admit exists, an `is` leaf when such
    /// a child's kind, as `stamp` reads it, is one of the types, and a child
    /// step when its condition holds on one of the admitted children its
    /// anchor keeps. `stamp` is the kind a coordinate of the node carries.
    pub fn holds(&self, node: &tree_sitter::Node<'_>, source: &str, stamp: &dyn Fn(&tree_sitter::Node<'_>) -> u16) -> bool {
        match self {
            Plan::Eq { routes, text } => any_value(node, source, routes, |value| value == text),
            Plan::Match { routes, pattern } => any_value(node, source, routes, |value| pattern.is_match(value)),
            Plan::Present { routes } => any_value(node, source, routes, |_| true),
            Plan::Is { routes, types } => admitted_children(node, routes).any(|child| types.contains(&stamp(&child))),
            Plan::Child { routes, anchor, of } => {
                let admitted: Vec<_> = admitted_children(node, routes).collect();
                let tested = match anchor {
                    None => &admitted[..],
                    Some(Anchor::First) => &admitted[..admitted.len().min(1)],
                    Some(Anchor::Last) => &admitted[admitted.len().saturating_sub(1)..],
                    Some(Anchor::Only) if admitted.len() == 1 => &admitted[..],
                    Some(Anchor::Only) => &[],
                };
                tested.iter().any(|child| of.holds(child, source, stamp))
            }
            Plan::Not(of) => !of.holds(node, source, stamp),
            Plan::And(of) => of.iter().all(|p| p.holds(node, source, stamp)),
            Plan::Or(of) => of.iter().any(|p| p.holds(node, source, stamp)),
        }
    }
}

/// Whether some non-extra child of `node` that `routes` admit has source text
/// passing `test`.
fn admitted_children<'a, 'tree>(node: &'a tree_sitter::Node<'tree>, routes: &'a Routes) -> impl Iterator<Item = tree_sitter::Node<'tree>> + 'a {
    (0..node.child_count() as u32)
        .filter_map(move |i| node.child(i).filter(|child| !child.is_extra() && routes.admits(node.field_name_for_child(i), child)))
}

fn any_value(node: &tree_sitter::Node<'_>, source: &str, routes: &Routes, test: impl Fn(&str) -> bool) -> bool {
    admitted_children(node, routes).any(|child| source.get(child.byte_range()).is_some_and(&test))
}

#[cfg(test)]
mod tests {
    use super::*;

    const KIND: fn(&tree_sitter::Node<'_>) -> u16 = |node| node.grammar_id();

    #[test]
    fn a_presence_leaf_holds_when_a_child_the_routes_admit_exists() {
        let language: tree_sitter::Language = tree_sitter_python::LANGUAGE.into();
        let mut parser = tree_sitter::Parser::new();
        parser.set_language(&language).unwrap();
        let source = "async def a():\n    pass\ndef b():\n    pass\n";
        let tree = parser.parse(source, None).unwrap();
        let defs: Vec<_> = (0..2).map(|i| tree.root_node().named_child(i).unwrap()).collect();
        let present: PlanSpec = serde_json::from_str(r#"{"op":"present","fields":[],"kinds":["async"]}"#).unwrap();
        let present = Plan::compile(present).unwrap();
        assert!(present.holds(&defs[0], source, &KIND));
        assert!(!present.holds(&defs[1], source, &KIND));
        let absent = Plan::Not(Box::new(present));
        assert!(absent.holds(&defs[1], source, &KIND));
    }

    fn rust_items(source: &str) -> tree_sitter::Tree {
        let language: tree_sitter::Language = tree_sitter_rust::LANGUAGE.into();
        let mut parser = tree_sitter::Parser::new();
        parser.set_language(&language).unwrap();
        parser.parse(source, None).unwrap()
    }

    fn plan(json: &str) -> Plan {
        Plan::compile(serde_json::from_str(json).unwrap()).unwrap()
    }

    #[test]
    fn a_child_step_holds_when_its_condition_holds_on_an_admitted_child() {
        let source = "async fn a() {}\nfn b() {}\nconst fn c() {}\n";
        let tree = rust_items(source);
        let items: Vec<_> = (0..3).map(|i| tree.root_node().named_child(i).unwrap()).collect();
        let is_async = plan(r#"{"op":"child","fields":[],"kinds":["function_modifiers"],"of":{"op":"present","fields":[],"kinds":["async"]}}"#);
        assert_eq!(items.iter().map(|item| is_async.holds(item, source, &KIND)).collect::<Vec<_>>(), [true, false, false]);
    }

    #[test]
    fn a_child_step_nests_and_skips_extras() {
        let source = "fn a(x: u8) {}\nfn b(/* c */ y: i32) {}\n";
        let tree = rust_items(source);
        let items: Vec<_> = (0..2).map(|i| tree.root_node().named_child(i).unwrap()).collect();
        let u8_param = plan(
            r#"{"op":"child","fields":["parameters"],"kinds":[],"of":{"op":"child","fields":[],"kinds":["parameter"],"of":{"op":"eq","fields":["type"],"kinds":[],"text":"u8"}}}"#,
        );
        assert_eq!(items.iter().map(|item| u8_param.holds(item, source, &KIND)).collect::<Vec<_>>(), [true, false]);
        let any_param = plan(r#"{"op":"child","fields":["parameters"],"kinds":[],"of":{"op":"child","fields":[],"kinds":["parameter"],"anchor":"only","of":{"op":"and","of":[]}}}"#);
        assert!(any_param.holds(&items[1], source, &KIND), "the comment before the parameter is not counted");
    }

    #[test]
    fn an_is_leaf_tests_the_stamped_kind_of_an_admitted_child() {
        let source = "fn a() {}\nfn b(&self) {}\n";
        let tree = rust_items(source);
        let language = tree.language();
        let id = |kind: &str| language.id_for_node_kind(kind, true);
        let items: Vec<_> = (0..2).map(|i| tree.root_node().named_child(i).unwrap()).collect();
        let receiver = plan(&format!(
            r#"{{"op":"child","fields":["parameters"],"kinds":[],"of":{{"op":"is","types":[{}],"fields":[],"kinds":["self_parameter","parameter"]}}}}"#,
            id("self_parameter")
        ));
        assert_eq!(items.iter().map(|item| receiver.holds(item, source, &KIND)).collect::<Vec<_>>(), [false, true]);
        let named = plan(&format!(r#"{{"op":"is","types":[{}],"fields":["name"],"kinds":[]}}"#, id("identifier")));
        assert!(named.holds(&items[0], source, &KIND));
        let elsewhere = plan(&format!(r#"{{"op":"is","types":[{}],"fields":["name"],"kinds":[]}}"#, id("self_parameter")));
        assert!(!elsewhere.holds(&items[0], source, &KIND));
    }

    #[test]
    fn an_anchor_narrows_the_admitted_children_first() {
        let source = "fn one(a: u8) {}\nfn two(a: u8, b: i32) {}\n";
        let tree = rust_items(source);
        let params: Vec<_> = (0..2).map(|i| tree.root_node().named_child(i).unwrap().child_by_field_name("parameters").unwrap()).collect();
        let typed = |anchor: &str, text: &str| {
            plan(&format!(r#"{{"op":"child","fields":[],"kinds":["parameter"],"anchor":"{anchor}","of":{{"op":"eq","fields":["type"],"kinds":[],"text":"{text}"}}}}"#))
        };
        assert!(typed("only", "u8").holds(&params[0], source, &KIND));
        assert!(!typed("only", "u8").holds(&params[1], source, &KIND), "only fails on two children");
        assert!(typed("first", "u8").holds(&params[1], source, &KIND));
        assert!(!typed("first", "i32").holds(&params[1], source, &KIND));
        assert!(typed("last", "i32").holds(&params[1], source, &KIND));
        assert!(!typed("last", "u8").holds(&params[1], source, &KIND));
    }
}
