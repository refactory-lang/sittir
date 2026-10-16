//! The native half of a node query: the `where` plan a query compiles to, and
//! the batch a descendant walk returns.

use std::collections::HashMap;

use tree_sitter::{Node, TreeCursor};

use crate::read::{index_of, Child, Route, Router};
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
    pub kind: crate::types::KindId,
}

impl From<NodeCoordinate> for QueryCoordinate {
    fn from(coord: NodeCoordinate) -> Self {
        QueryCoordinate { handle: coord.handle(), end: coord.end, span: coord.span, kind: coord.kind.unwrap_or_default() }
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

/// A slot by its number in each kind that has it, keyed by the kind a
/// coordinate of the node carries (`ReadCtx::node_kind`). The number is the
/// slot field's position among the kind's transport slots, the numbering
/// `Route::Slot` uses. A node of a kind the map lacks holds nothing there.
#[derive(serde::Deserialize, Debug, Clone, Default)]
pub struct Slots {
    #[serde(deserialize_with = "numbered_by_kind")]
    pub slots: HashMap<crate::types::KindId, u16>,
}

/// A JSON object of slot numbers by kind id: its keys are the ids as text.
fn numbered_by_kind<'de, D: serde::Deserializer<'de>>(deserializer: D) -> Result<HashMap<crate::types::KindId, u16>, D::Error> {
    let by_text: HashMap<String, u16> = serde::Deserialize::deserialize(deserializer)?;
    by_text
        .into_iter()
        .map(|(kind, slot)| kind.parse().map(|kind| (crate::types::KindId(kind), slot)).map_err(|_| serde::de::Error::custom(format!("kind id {kind:?} is not a number"))))
        .collect()
}

/// A `where` condition over a node's slots, each slot given by its numbers.
#[derive(serde::Deserialize)]
#[serde(tag = "op", rename_all = "lowercase")]
pub enum PlanSpec {
    Eq {
        #[serde(flatten)]
        slots: Slots,
        text: String,
    },
    Match {
        #[serde(flatten)]
        slots: Slots,
        pattern: String,
    },
    Present {
        #[serde(flatten)]
        slots: Slots,
    },
    Is {
        #[serde(flatten)]
        slots: Slots,
        types: Vec<crate::types::KindId>,
    },
    Child {
        #[serde(flatten)]
        slots: Slots,
        #[serde(default)]
        anchor: Option<Anchor>,
        of: Box<PlanSpec>,
    },
    Not { of: Box<PlanSpec> },
    And { of: Vec<PlanSpec> },
    Or { of: Vec<PlanSpec> },
}

/// Which of the nodes a child step's slot holds it tests: the first, the
/// last, or the one node when the slot holds exactly one.
#[derive(serde::Deserialize, Clone, Copy, Debug, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Anchor {
    First,
    Last,
    Only,
}

/// A [`PlanSpec`] with its patterns compiled.
pub enum Plan {
    Eq { slots: Slots, text: String },
    Match { slots: Slots, pattern: regex::Regex },
    Present { slots: Slots },
    Is { slots: Slots, types: Vec<crate::types::KindId> },
    Child { slots: Slots, anchor: Option<Anchor>, of: Box<Plan> },
    Not(Box<Plan>),
    And(Vec<Plan>),
    Or(Vec<Plan>),
}

/// What a plan reads a node with: the source, the kind a coordinate of a
/// node carries (`ReadCtx::node_kind`), and how a node's kind finds its
/// slots (`ReadTransport::router`).
pub struct QueryCtx<'a> {
    pub source: &'a str,
    pub stamp: &'a dyn Fn(&Node<'_>) -> crate::types::KindId,
    pub router: &'a dyn Fn(&Node<'_>) -> Option<Router>,
}

/// One value a slot holds: its text, and the node that spells it, by its
/// descendant index and kind, unless it is a group of a token's text.
struct Hit<'s> {
    node: Option<(u32, crate::types::KindId)>,
    text: &'s str,
}

impl Plan {
    /// Compile a recorded plan. A pattern the `regex` crate cannot compile (a
    /// back-reference, a look-around) is refused, never matched differently.
    pub fn compile(spec: PlanSpec) -> Result<Plan, String> {
        Ok(match spec {
            PlanSpec::Eq { slots, text } => Plan::Eq { slots, text },
            PlanSpec::Match { slots, pattern } => Plan::Match {
                slots,
                pattern: regex::Regex::new(&pattern).map_err(|e| e.to_string())?,
            },
            PlanSpec::Present { slots } => Plan::Present { slots },
            PlanSpec::Is { slots, types } => Plan::Is { slots, types },
            PlanSpec::Child { slots, anchor, of } => Plan::Child { slots, anchor, of: Box::new(Plan::compile(*of)?) },
            PlanSpec::Not { of } => Plan::Not(Box::new(Plan::compile(*of)?)),
            PlanSpec::And { of } => Plan::And(of.into_iter().map(Plan::compile).collect::<Result<_, _>>()?),
            PlanSpec::Or { of } => Plan::Or(of.into_iter().map(Plan::compile).collect::<Result<_, _>>()?),
        })
    }

    /// Whether the node the cursor is on satisfies the condition: a
    /// comparison holds when some value its slot holds has the text or
    /// matches, a presence leaf when the slot holds a value, an `is` leaf
    /// when a node the slot holds has one of the types, and a child step
    /// when its condition holds on one of the slot's nodes its anchor keeps.
    /// The cursor was created at the tree's root and ends where it started.
    pub fn holds(&self, cursor: &mut TreeCursor<'_>, ctx: &QueryCtx<'_>) -> bool {
        match self {
            Plan::Eq { slots, text } => any_hit(cursor, ctx, slots, |hit| hit.text == text),
            Plan::Match { slots, pattern } => any_hit(cursor, ctx, slots, |hit| pattern.is_match(hit.text)),
            Plan::Present { slots } => any_hit(cursor, ctx, slots, |_| true),
            Plan::Is { slots, types } => any_hit(cursor, ctx, slots, |hit| hit.node.is_some_and(|(_, kind)| types.contains(&kind))),
            Plan::Child { slots, anchor, of } => {
                let mut held = Vec::new();
                if !slot_hits(cursor, ctx, slots, &mut |hit| held.extend(hit.node.map(|(index, _)| index))) {
                    return false;
                }
                let tested = match anchor {
                    None => &held[..],
                    Some(Anchor::First) => &held[..held.len().min(1)],
                    Some(Anchor::Last) => &held[held.len().saturating_sub(1)..],
                    Some(Anchor::Only) if held.len() == 1 => &held[..],
                    Some(Anchor::Only) => &[],
                };
                let own = index_of(cursor);
                let found = tested.iter().any(|&index| {
                    cursor.goto_descendant(index as usize);
                    of.holds(cursor, ctx)
                });
                cursor.goto_descendant(own as usize);
                found
            }
            Plan::Not(of) => !of.holds(cursor, ctx),
            Plan::And(of) => of.iter().all(|p| p.holds(cursor, ctx)),
            Plan::Or(of) => of.iter().any(|p| p.holds(cursor, ctx)),
        }
    }
}

/// Whether some value the slot holds on the node the cursor is on passes
/// `test`, and the node's slot was read at all (`slot_hits`).
fn any_hit(cursor: &mut TreeCursor<'_>, ctx: &QueryCtx<'_>, slots: &Slots, mut test: impl FnMut(&Hit<'_>) -> bool) -> bool {
    let mut found = false;
    slot_hits(cursor, ctx, slots, &mut |hit| found |= test(&hit)) && found
}

/// Visit each value the slot holds on the node the cursor is on, as the
/// node's read finds it (`Router`), with no allocation. `false` when the node
/// holds nothing there: its kind has no number for the slot, no router, or
/// a child the read cannot route, so the query and the read agree. The
/// cursor was created at the tree's root and ends where it started.
fn slot_hits<'s>(cursor: &mut TreeCursor<'_>, ctx: &QueryCtx<'s>, slots: &Slots, visit: &mut dyn FnMut(Hit<'s>)) -> bool {
    let node = cursor.node();
    let (Some(&slot), Some(router)) = (slots.slots.get(&(ctx.stamp)(&node)), (ctx.router)(&node)) else {
        return false;
    };
    let text = |node: &Node<'_>| ctx.source.get(node.byte_range()).unwrap_or("");
    match router {
        Router::Children(route) => {
            let mut routed = true;
            if cursor.goto_first_child() {
                loop {
                    let child = Child::at(cursor);
                    match route(&child) {
                        Ok(Route::Slot { slot: at, .. }) if at == slot => {
                            let node = cursor.node();
                            visit(Hit { node: Some((child.index, (ctx.stamp)(&node))), text: text(&node) });
                        }
                        Ok(_) => {}
                        Err(_) => routed = false,
                    }
                    if !cursor.goto_next_sibling() {
                        break;
                    }
                }
                cursor.goto_parent();
            }
            routed
        }
        Router::Interior(interior, captures) => {
            let Some(groups) = interior.captures(text(&node)) else { return false };
            if let Some(group) = captures.get(slot as usize).and_then(|name| groups.name(name)) {
                visit(Hit { node: None, text: group.as_str() });
            }
            true
        }
        Router::Envelope { wraps_hidden } => {
            if slot != 0 {
                return false;
            }
            if !wraps_hidden {
                visit(Hit { node: Some((index_of(cursor), crate::read::grammar_id(&node))), text: text(&node) });
                return true;
            }
            let mut wrapped = None;
            if cursor.goto_first_child() {
                loop {
                    let child = Child::at(cursor);
                    if !child.trivia {
                        let node = cursor.node();
                        wrapped = Some(Hit { node: Some((child.index, (ctx.stamp)(&node))), text: text(&node) });
                        break;
                    }
                    if !cursor.goto_next_sibling() {
                        break;
                    }
                }
                cursor.goto_parent();
            }
            let Some(hit) = wrapped else { return false };
            visit(hit);
            true
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::read::{Interior, ReadError};
    use crate::types::KindId;
    use std::sync::OnceLock;

    fn language() -> &'static tree_sitter::Language {
        static LANGUAGE: OnceLock<tree_sitter::Language> = OnceLock::new();
        LANGUAGE.get_or_init(|| tree_sitter_rust::LANGUAGE.into())
    }

    enum Sel {
        Field(&'static str),
        Kind(&'static str),
    }

    /// Each test kind's slots in number order, and whether a named child
    /// none of them takes is a child the read cannot route.
    const TABLES: &[(&str, &[Sel], bool)] = &[
        ("function_item", &[Sel::Field("name"), Sel::Field("parameters"), Sel::Kind("function_modifiers")], false),
        ("parameters", &[Sel::Kind("parameter"), Sel::Kind("self_parameter")], false),
        ("parameter", &[Sel::Field("pattern"), Sel::Field("type")], false),
        ("function_modifiers", &[Sel::Kind("async"), Sel::Kind("const")], false),
        ("source_file", &[Sel::Kind("function_item")], true),
    ];

    fn route<const T: usize>(child: &Child) -> Result<Route, ReadError> {
        if child.trivia {
            return Ok(Route::Trivia);
        }
        let (_, slots, strict) = TABLES[T];
        let kind = language().node_kind_for_id(child.grammar.0).unwrap_or("");
        let field = child.field.and_then(|field| language().field_name_for_id(field.0));
        let slot = slots.iter().position(|sel| match sel {
            Sel::Field(name) => field == Some(*name),
            Sel::Kind(name) => field.is_none() && kind == *name,
        });
        match slot {
            Some(slot) => Ok(Route::Slot { slot: slot as u16, scalar: false }),
            None if strict && child.named => Err(ReadError::Unrouted { kind: KindId(0), child: child.grammar, index: child.index }),
            None => Ok(Route::Layout),
        }
    }

    const ROUTES: [crate::read::ChildRoute; 5] = [route::<0>, route::<1>, route::<2>, route::<3>, route::<4>];

    static INTEGER: Interior = Interior::new("^(?<digits>[0-9]+)(?<suffix>u8|i32)?$");

    fn router(node: &Node<'_>) -> Option<Router> {
        match node.kind() {
            "integer_literal" => Some(Router::Interior(&INTEGER, &["digits", "suffix"])),
            "type_identifier" => Some(Router::Envelope { wraps_hidden: false }),
            kind => TABLES.iter().position(|(name, ..)| *name == kind).map(|t| Router::Children(ROUTES[t])),
        }
    }

    fn id(kind: &str) -> u16 {
        language().id_for_node_kind(kind, true)
    }

    /// `slots` JSON for slot `n` of each kind.
    fn slots(of: &[(&str, u16)]) -> String {
        let pairs: Vec<String> = of.iter().map(|(kind, n)| format!(r#""{}":{n}"#, id(kind))).collect();
        format!(r#""slots":{{{}}}"#, pairs.join(","))
    }

    fn plan(json: &str) -> Plan {
        Plan::compile(serde_json::from_str(json).unwrap()).unwrap()
    }

    /// Whether `plan` holds on each node of `kind`, in pre-order, checking
    /// the cursor ends where it started.
    fn eval(plan: &Plan, source: &str, kind: &str) -> Vec<bool> {
        let mut parser = tree_sitter::Parser::new();
        parser.set_language(language()).unwrap();
        let tree = parser.parse(source, None).unwrap();
        let stamp = |node: &Node<'_>| crate::read::display_id(node);
        let ctx = QueryCtx { source, stamp: &stamp, router: &router };
        let mut cursor = tree.walk();
        let mut out = Vec::new();
        for index in 0..tree.root_node().descendant_count() {
            cursor.goto_descendant(index);
            if cursor.node().kind() == kind {
                out.push(plan.holds(&mut cursor, &ctx));
                assert_eq!(cursor.descendant_index(), index, "the cursor ends where it started");
            }
        }
        out
    }

    #[test]
    fn a_presence_leaf_holds_when_the_slot_holds_a_value() {
        let source = "async fn a() {}\nfn b() {}\nconst fn c() {}\n";
        let modifiers = format!(r#"{{"op":"child",{},"of":{{"op":"present",{}}}}}"#, slots(&[("function_item", 2)]), slots(&[("function_modifiers", 0)]));
        assert_eq!(eval(&plan(&modifiers), source, "function_item"), [true, false, false]);
        let absent = Plan::Not(Box::new(plan(&modifiers)));
        assert_eq!(eval(&absent, source, "function_item"), [false, true, true]);
    }

    #[test]
    fn a_child_step_nests_and_skips_trivia() {
        let source = "fn a(x: u8) {}\nfn b(/* c */ y: i32) {}\n";
        let u8_param = format!(
            r#"{{"op":"child",{},"of":{{"op":"child",{},"of":{{"op":"eq",{},"text":"u8"}}}}}}"#,
            slots(&[("function_item", 1)]),
            slots(&[("parameters", 0)]),
            slots(&[("parameter", 1)])
        );
        assert_eq!(eval(&plan(&u8_param), source, "function_item"), [true, false]);
        let one_param = format!(r#"{{"op":"child",{},"anchor":"only","of":{{"op":"and","of":[]}}}}"#, slots(&[("parameters", 0)]));
        assert_eq!(eval(&plan(&one_param), source, "parameters"), [true, true], "the comment before the parameter is not counted");
    }

    #[test]
    fn an_is_leaf_tests_the_stamped_kind_of_a_node_the_slot_holds() {
        let source = "fn a() {}\nfn b(&self) {}\n";
        let receiver = format!(
            r#"{{"op":"child",{},"of":{{"op":"is","types":[{}],{}}}}}"#,
            slots(&[("function_item", 1)]),
            id("self_parameter"),
            slots(&[("parameters", 1)])
        );
        assert_eq!(eval(&plan(&receiver), source, "function_item"), [false, true]);
        let named = format!(r#"{{"op":"is","types":[{}],{}}}"#, id("identifier"), slots(&[("function_item", 0)]));
        assert_eq!(eval(&plan(&named), source, "function_item"), [true, true]);
    }

    #[test]
    fn an_anchor_narrows_the_nodes_the_slot_holds_first() {
        let source = "fn one(a: u8) {}\nfn two(a: u8, b: i32) {}\n";
        let typed = |anchor: &str, text: &str| {
            plan(&format!(
                r#"{{"op":"child",{},"anchor":"{anchor}","of":{{"op":"eq",{},"text":"{text}"}}}}"#,
                slots(&[("parameters", 0)]),
                slots(&[("parameter", 1)])
            ))
        };
        assert_eq!(eval(&typed("only", "u8"), source, "parameters"), [true, false], "only fails on two nodes");
        assert_eq!(eval(&typed("first", "u8"), source, "parameters"), [true, true]);
        assert_eq!(eval(&typed("first", "i32"), source, "parameters"), [false, false]);
        assert_eq!(eval(&typed("last", "i32"), source, "parameters"), [false, true]);
    }

    #[test]
    fn a_node_holds_nothing_where_its_kind_has_no_number_or_a_child_does_not_route() {
        let source = "fn a() {}\nstruct S;\n";
        let unnumbered = format!(r#"{{"op":"present",{}}}"#, slots(&[("parameters", 0)]));
        assert_eq!(eval(&plan(&unnumbered), source, "function_item"), [false]);
        let items = format!(r#"{{"op":"present",{}}}"#, slots(&[("source_file", 0)]));
        assert_eq!(eval(&plan(&items), source, "source_file"), [false], "the struct is a child the read cannot route");
        assert_eq!(eval(&plan(&items), "fn a() {}\n", "source_file"), [true]);
    }

    #[test]
    fn an_interior_slot_is_the_group_its_read_captures() {
        let source = "const A: u8 = 1u8;\nconst B: i32 = 2;\n";
        let suffix = |text: &str| plan(&format!(r#"{{"op":"eq",{},"text":"{text}"}}"#, slots(&[("integer_literal", 1)])));
        assert_eq!(eval(&suffix("u8"), source, "integer_literal"), [true, false]);
        let unsuffixed = Plan::Not(Box::new(plan(&format!(r#"{{"op":"present",{}}}"#, slots(&[("integer_literal", 1)])))));
        assert_eq!(eval(&unsuffixed, source, "integer_literal"), [false, true]);
        let digits = plan(&format!(r#"{{"op":"match",{},"pattern":"^2$"}}"#, slots(&[("integer_literal", 0)])));
        assert_eq!(eval(&digits, source, "integer_literal"), [false, true]);
    }

    #[test]
    fn an_envelope_slot_is_the_node_itself() {
        let source = "struct Foo;\nstruct Bar;\n";
        let named = |text: &str| plan(&format!(r#"{{"op":"eq",{},"text":"{text}"}}"#, slots(&[("type_identifier", 0)])));
        assert_eq!(eval(&named("Bar"), source, "type_identifier"), [false, true]);
        let content = plan(&format!(r#"{{"op":"is","types":[{}],{}}}"#, id("identifier"), slots(&[("type_identifier", 0)])));
        assert_eq!(eval(&content, source, "type_identifier"), [true, true], "the content is read as its own kind");
        let beyond = plan(&format!(r#"{{"op":"present",{}}}"#, slots(&[("type_identifier", 1)])));
        assert_eq!(eval(&beyond, source, "type_identifier"), [false, false]);
    }
}
