//! A `where` plan compiled to a tree-sitter query (scm), for the probe that
//! compares it with the native evaluator.
//!
//! A slot's routes come from the kind's own router, enumerated over every
//! (field, symbol) a child can carry, so the query names the children the
//! read routes to the slot. A plan becomes one pattern per conjunct of its
//! disjunctive normal form; where scm cannot say what the plan says, the
//! compile either refuses (`Err`) or records the difference (`notes`).

use std::collections::{BTreeMap, BTreeSet};
use std::fmt::Write as _;

use tree_sitter::{Language, Node, Query, QueryCursor, QueryPredicateArg, StreamingIterator};

use crate::query::{Dialect, Matcher, PlanSpec, Slots};
use crate::read::{Child, Route, Router};
use crate::types::{FieldId, KindId, NodeIndex, SlotId};

/// A compiled scm query, the patterns' ECMAScript predicates compiled beside
/// it, and the notes the compile recorded.
pub struct ScmQuery {
    pub query: Query,
    pub source: String,
    pub notes: Vec<String>,
    node_capture: u32,
    es: Vec<Vec<EsPredicate>>,
}

struct EsPredicate {
    capture: u32,
    matcher: Matcher,
    positive: bool,
}

/// One child pattern a slot can match: a field (or none) and the symbols.
#[derive(Default)]
struct SlotRoutes {
    by_field: BTreeMap<Option<u16>, BTreeSet<u16>>,
}

/// What compiling needs from the grammar: the language and each kind's
/// router.
pub struct ScmGrammar<'a> {
    pub language: &'a Language,
    pub router: &'a dyn Fn(KindId, KindId) -> Option<Router>,
}

impl ScmGrammar<'_> {
    fn name(&self, symbol: u16) -> String {
        let name = self.language.node_kind_for_id(symbol).unwrap_or("ERROR");
        if self.language.node_kind_is_named(symbol) { format!("({name})") } else { format!("\"{}\"", escape(name)) }
    }

    fn visible(&self) -> impl Iterator<Item = u16> + '_ {
        (1..u16::try_from(self.language.node_kind_count()).unwrap_or(u16::MAX)).filter(|&s| self.language.node_kind_is_visible(s))
    }

    fn label(&self, kind: KindId) -> String {
        self.language.node_kind_for_id(kind.get()).unwrap_or("?").to_string()
    }

    fn field_prefix(&self, field: Option<u16>) -> String {
        field.map(|f| format!("{}: ", self.language.field_name_for_id(f).unwrap_or("?"))).unwrap_or_default()
    }

    /// Whether tree-sitter's analysis admits `pattern` at all: an impossible
    /// pattern (a child in a field or an order the grammar never produces)
    /// is refused when the query compiles.
    fn possible(&self, pattern: &str) -> bool {
        Query::new(self.language, pattern).is_ok()
    }

    /// The children a node of `kind` routes to `slot`, by field, each
    /// alternative one tree-sitter admits there.
    fn routes(&self, kind: KindId, slot: SlotId, notes: &mut Vec<String>) -> Result<SlotRoutes, String> {
        let route = match (self.router)(kind, kind) {
            Some(Router::Children(route, _)) => route,
            Some(Router::Interior(..)) => return Err(format!("{}: an interior slot is a group of a token's text, not a node", self.label(kind))),
            Some(Router::Envelope { .. }) => return Err(format!("{}: an envelope's slot is the node itself or its hidden child", self.label(kind))),
            None => return Err(format!("{}: no router", self.label(kind))),
        };
        let symbols: Vec<u16> = self.visible().collect();
        let fields: Vec<u16> = (1..=u16::try_from(self.language.field_count()).unwrap_or(0)).collect();
        let routed = |field: Option<u16>, symbol: u16| -> Option<SlotId> {
            let child = Child {
                index: NodeIndex(0),
                grammar: KindId(symbol),
                display: KindId(symbol),
                field: field.map(FieldId),
                named: self.language.node_kind_is_named(symbol),
                trivia: false,
                start: 0,
                end: 0,
                descendants: 1,
            };
            match route(&child) {
                Ok(Route::Slot { slot, .. }) => Some(slot),
                _ => None,
            }
        };
        let untagged: Vec<(u16, Option<SlotId>)> = symbols.iter().map(|&s| (s, routed(None, s))).collect();
        // A field matters to the kind where it routes some child differently
        // from the same child unfielded.
        let own_fields: Vec<u16> = fields.iter().copied().filter(|&f| untagged.iter().any(|&(s, plain)| routed(Some(f), s) != plain)).collect();
        let root = self.name(kind.get());
        let root = &root[1..root.len() - 1];
        let mut routes = SlotRoutes::default();
        for &f in &own_fields {
            let prefix = self.field_prefix(Some(f));
            if !self.possible(&format!("({root} {prefix}_)")) {
                continue;
            }
            for &s in &symbols {
                if routed(Some(f), s) == Some(slot) {
                    routes.by_field.entry(Some(f)).or_default().insert(s);
                }
            }
        }
        for &(s, plain) in &untagged {
            if plain == Some(slot) && self.possible(&format!("({root} {})", self.name(s))) {
                // An unfielded scm child matches a fielded child too: exact only
                // where no field of the kind routes this symbol elsewhere.
                if own_fields.iter().any(|&f| routed(Some(f), s) != Some(slot) && self.possible(&format!("({root} {}{})", self.field_prefix(Some(f)), self.name(s)))) {
                    notes.push(format!(
                        "{} slot {}: an unfielded `{}` child pattern also matches it under a field that routes it elsewhere",
                        self.label(kind),
                        slot.get(),
                        self.name(s)
                    ));
                }
                routes.by_field.entry(None).or_default().insert(s);
            }
        }
        if routes.by_field.is_empty() {
            return Err(format!("{} slot {}: no child tree-sitter admits routes there", self.label(kind), slot.get()));
        }
        Ok(routes)
    }

    /// One field's alternatives as scm: `_` or `(_)` where the field admits
    /// every symbol or every named one, a supertype where it admits all its
    /// subtypes, else each symbol, every alternative one tree-sitter admits.
    fn alternatives(&self, kind: KindId, field: Option<u16>, admitted: &BTreeSet<u16>) -> Vec<String> {
        let root = self.name(kind.get());
        let root = &root[1..root.len() - 1];
        let prefix = self.field_prefix(field);
        let named: BTreeSet<u16> = self.visible().filter(|&s| self.language.node_kind_is_named(s)).collect();
        let anonymous: BTreeSet<u16> = self.visible().filter(|&s| !self.language.node_kind_is_named(s)).collect();
        if named.is_subset(admitted) && anonymous.is_subset(admitted) {
            return vec!["_".to_string()];
        }
        let mut out = Vec::new();
        let mut rest: BTreeSet<u16> = admitted.clone();
        if named.is_subset(admitted) {
            out.push("(_)".to_string());
            rest.retain(|s| !named.contains(s));
        }
        let mut supertypes: Vec<u16> = self.language.supertypes().to_vec();
        supertypes.sort_by_key(|&st| std::cmp::Reverse(self.language.subtypes_for_supertype(st).len()));
        for st in supertypes {
            let subtypes: BTreeSet<u16> = self.language.subtypes_for_supertype(st).iter().copied().collect();
            if !subtypes.is_empty() && subtypes.is_subset(&rest) {
                let name = format!("({})", self.language.node_kind_for_id(st).unwrap_or("?"));
                if self.possible(&format!("({root} {prefix}{name})")) {
                    out.push(name);
                    rest.retain(|s| !subtypes.contains(s));
                }
            }
        }
        for s in rest {
            let name = self.name(s);
            if self.possible(&format!("({root} {prefix}{name})")) {
                out.push(name);
            }
        }
        out
    }

    /// The child pattern for `routes`, its symbols narrowed to `types` when
    /// given; `None` when no child can hold.
    fn child_pattern(&self, kind: KindId, routes: &SlotRoutes, types: Option<&[KindId]>, capture: &str) -> Option<String> {
        let mut alternatives = Vec::new();
        for (field, symbols) in &routes.by_field {
            let admitted: BTreeSet<u16> = symbols.iter().copied().filter(|&s| types.is_none_or(|types| types.contains(&KindId(s)))).collect();
            let mut kept = self.alternatives(kind, *field, &admitted);
            if kept.is_empty() {
                continue;
            }
            let body = if kept.len() == 1 { kept.remove(0) } else { format!("[{}]", kept.join(" ")) };
            alternatives.push(format!("{}{body}", self.field_prefix(*field)));
        }
        match alternatives.len() {
            0 => None,
            1 => Some(format!("{} @{capture}", alternatives.remove(0))),
            _ => Some(format!("[{}] @{capture}", alternatives.join(" "))),
        }
    }
}

/// A literal of a conjunct: an atom of the plan, or its negation.
#[derive(Clone)]
enum Atom<'p> {
    Text { slots: &'p Slots, test: TextTest<'p> },
    Present { slots: &'p Slots },
    IsSlot { slots: &'p Slots, types: &'p [KindId] },
    IsOwn { types: &'p [KindId] },
    Child { slots: &'p Slots, anchor: bool, of: &'p PlanSpec },
}

#[derive(Clone, Copy)]
enum TextTest<'p> {
    Eq(&'p str),
    Match(&'p str),
}

#[derive(Clone)]
struct Literal<'p> {
    positive: bool,
    atom: Atom<'p>,
}

/// The plan in disjunctive normal form: conjuncts of literals.
fn dnf<'p>(plan: &'p PlanSpec, positive: bool) -> Result<Vec<Vec<Literal<'p>>>, String> {
    let atom = |atom: Atom<'p>| Ok(vec![vec![Literal { positive, atom }]]);
    match plan {
        PlanSpec::Eq { slots, text } => atom(Atom::Text { slots, test: TextTest::Eq(text) }),
        PlanSpec::Match { slots, pattern } => atom(Atom::Text { slots, test: TextTest::Match(pattern) }),
        PlanSpec::Present { slots } => atom(Atom::Present { slots }),
        PlanSpec::Is { own: Some(true), types, .. } => atom(Atom::IsOwn { types }),
        PlanSpec::Is { slots: Some(slots), types, .. } => atom(Atom::IsSlot { slots, types }),
        PlanSpec::Is { .. } => Err("an is leaf names a slot or the node itself".to_string()),
        PlanSpec::Child { slots, anchor, of } => atom(Atom::Child { slots, anchor: anchor.is_some(), of }),
        PlanSpec::Not { of } => dnf(of, !positive),
        PlanSpec::And { of } | PlanSpec::Or { of } => {
            let conjunctive = matches!(plan, PlanSpec::And { .. }) == positive;
            let parts = of.iter().map(|p| dnf(p, positive)).collect::<Result<Vec<_>, _>>()?;
            if conjunctive {
                let mut product: Vec<Vec<Literal<'p>>> = vec![Vec::new()];
                for part in parts {
                    product = product.iter().flat_map(|left| part.iter().map(move |right| left.iter().chain(right).cloned().collect())).collect();
                }
                Ok(product)
            } else {
                Ok(parts.into_iter().flatten().collect())
            }
        }
    }
}

fn slot_of(slots: &Slots, kind: KindId) -> Option<SlotId> {
    slots.slots.get(&kind).copied()
}

fn escape(text: &str) -> String {
    text.replace('\\', "\\\\").replace('"', "\\\"").replace('\n', "\\n")
}

struct Compiler<'g, 'a> {
    grammar: &'g ScmGrammar<'a>,
    dialect: Dialect,
    notes: Vec<String>,
    captures: usize,
}

/// One pattern of a conjunct: its node with the children it requires, and
/// the predicates, which bind to the whole pattern wherever they are written.
struct Pattern {
    body: String,
    predicates: Vec<String>,
}

enum SlotShape {
    Present { child: String, predicates: Vec<String> },
    Absent(String),
}

impl Compiler<'_, '_> {
    fn capture(&mut self) -> String {
        self.captures += 1;
        format!("c{}", self.captures)
    }

    fn predicate(&self, test: TextTest<'_>, positive: bool, capture: &str) -> String {
        let not = if positive { "" } else { "not-" };
        match test {
            TextTest::Eq(text) => format!("(#{not}eq? @{capture} \"{}\")", escape(text)),
            TextTest::Match(pattern) => {
                let es = if self.dialect == Dialect::Es { "es-" } else { "" };
                format!("(#{es}{not}match? @{capture} \"{}\")", escape(pattern))
            }
        }
    }

    /// The patterns of one conjunct on a node of `kind`: one child per slot
    /// it tests, every literal on a slot sharing that slot's capture, the
    /// fields it must lack, and the predicates. Several patterns when a child
    /// step's condition differs by the child's kind, or a negated slot may
    /// also be absent; none when the conjunct cannot hold on the kind.
    fn conjunct(&mut self, kind: KindId, literals: &[Literal<'_>]) -> Result<Vec<Pattern>, String> {
        if !self.grammar.language.node_kind_is_visible(kind.get()) {
            return Err(format!("{}: a hidden kind is never a node of the tree", self.grammar.label(kind)));
        }
        let mut by_slot: BTreeMap<u16, Vec<&Literal<'_>>> = BTreeMap::new();
        for literal in literals {
            match &literal.atom {
                Atom::IsOwn { types } => {
                    if types.contains(&kind) != literal.positive {
                        return Ok(Vec::new());
                    }
                }
                Atom::Text { slots, .. } | Atom::Present { slots } | Atom::IsSlot { slots, .. } | Atom::Child { slots, .. } => {
                    let Some(slot) = slot_of(slots, kind) else {
                        // The kind holds nothing in the slot: a positive literal
                        // fails, a negative one holds.
                        if literal.positive {
                            return Ok(Vec::new());
                        }
                        continue;
                    };
                    by_slot.entry(slot.get()).or_default().push(literal);
                }
            }
        }
        let mut slot_shapes: Vec<Vec<SlotShape>> = Vec::new();
        for (slot, literals) in &by_slot {
            let slot = SlotId(*slot);
            let label = format!("{} slot {}", self.grammar.label(kind), slot.get());
            let routes = self.grammar.routes(kind, slot, &mut self.notes)?;
            let capture = self.capture();
            let any_positive = literals.iter().any(|l| l.positive);
            let only_absence = literals.iter().all(|l| !l.positive && matches!(l.atom, Atom::Present { .. }));
            if literals.len() > 1 && any_positive {
                self.notes.push(format!("{label}: {} literals on one slot share its capture, so they test one value together; the native plan tests each against any value (exact where the slot holds one value)", literals.len()));
            }
            let mut types: Option<Vec<KindId>> = None;
            let mut predicates = Vec::new();
            let mut nested: Option<&PlanSpec> = None;
            for literal in literals {
                match &literal.atom {
                    Atom::Text { test, .. } => {
                        if !literal.positive && !any_positive {
                            self.notes.push(format!("{label}: a negated test holds natively when no value passes, absent included; scm tests each captured value on its own (exact where the slot holds at most one value) and a negated field covers absence"));
                        }
                        predicates.push(self.predicate(*test, literal.positive, &capture));
                    }
                    Atom::Present { .. } => {
                        if !literal.positive && !only_absence {
                            return Err(format!("{label}: absence together with a test of the same slot"));
                        }
                    }
                    Atom::IsSlot { types: t, .. } => {
                        if !literal.positive {
                            return Err(format!("{label}: a negated is leaf tests every value's kind; scm has no negated child pattern"));
                        }
                        types = Some(types.map_or_else(|| t.to_vec(), |prior: Vec<KindId>| prior.into_iter().filter(|k| t.contains(k)).collect()));
                    }
                    Atom::Child { anchor, of, .. } => {
                        if *anchor {
                            return Err(format!("{label}: an anchored child step (first, last, only) counts the slot's values; scm's `.` anchors to the parent's named children"));
                        }
                        if !literal.positive {
                            return Err(format!("{label}: a negated child step"));
                        }
                        nested = Some(of);
                    }
                    Atom::IsOwn { .. } => unreachable!("tested above"),
                }
            }
            let mut shapes = Vec::new();
            if !only_absence {
                if let Some(of) = nested {
                    // A child step: one shape per child kind its condition can
                    // hold on, the condition's predicates lifted to the pattern.
                    let conjuncts = dnf(of, true)?;
                    for (field, symbols) in &routes.by_field {
                        for &s in symbols {
                            if types.as_ref().is_some_and(|t| !t.contains(&KindId(s))) || !self.grammar.language.node_kind_is_named(s) {
                                continue;
                            }
                            for conjunct in &conjuncts {
                                for inner in self.conjunct(KindId(s), conjunct)? {
                                    shapes.push(SlotShape::Present {
                                        child: format!("{}{} @{capture}", self.grammar.field_prefix(*field), inner.body),
                                        predicates: predicates.iter().cloned().chain(inner.predicates).collect(),
                                    });
                                }
                            }
                        }
                    }
                } else if let Some(child) = self.grammar.child_pattern(kind, &routes, types.as_deref(), &capture) {
                    shapes.push(SlotShape::Present { child, predicates: predicates.clone() });
                }
                if shapes.is_empty() && any_positive {
                    return Ok(Vec::new());
                }
            }
            if !any_positive {
                match routes.by_field.keys().collect::<Vec<_>>().as_slice() {
                    [Some(f)] => shapes.push(SlotShape::Absent(format!("!{}", self.grammar.language.field_name_for_id(*f).unwrap_or("?")))),
                    _ => return Err(format!("{label}: absence of a slot routed by kind or by several fields; scm negates only a field")),
                }
            }
            slot_shapes.push(shapes);
        }
        // Every choice of one shape per slot, and every order of the present
        // children (scm matches a pattern's children in order).
        let mut choices: Vec<Vec<&SlotShape>> = vec![Vec::new()];
        for shapes in &slot_shapes {
            choices = choices.iter().flat_map(|chosen| shapes.iter().map(move |shape| chosen.iter().copied().chain([shape]).collect())).collect();
        }
        let root = self.grammar.name(kind.get());
        let root_name = &root[1..root.len() - 1];
        let mut patterns = Vec::new();
        for chosen in choices {
            let children: Vec<(&String, &Vec<String>)> = chosen.iter().filter_map(|s| if let SlotShape::Present { child, predicates } = s { Some((child, predicates)) } else { None }).collect();
            if children.len() > 4 {
                return Err("more than four slots in one conjunct".to_string());
            }
            let absent: Vec<&String> = chosen.iter().filter_map(|s| if let SlotShape::Absent(a) = s { Some(a) } else { None }).collect();
            let predicates: Vec<String> = children.iter().flat_map(|(_, p)| p.iter().cloned()).collect();
            for order in permutations(children.len()) {
                let mut body = String::new();
                for name in &absent {
                    let _ = write!(body, " {name}");
                }
                for &i in &order {
                    let _ = write!(body, " {}", children[i].0);
                }
                let body = format!("({root_name}{body})");
                // Keep only the orders the grammar can produce.
                if order.len() < 2 || self.grammar.possible(&body) {
                    patterns.push(Pattern { body, predicates: predicates.clone() });
                }
            }
        }
        Ok(patterns)
    }
}

fn permutations(n: usize) -> Vec<Vec<usize>> {
    if n == 0 {
        return vec![Vec::new()];
    }
    let mut out = Vec::new();
    for rest in permutations(n - 1) {
        for at in 0..=rest.len() {
            let mut order = rest.clone();
            order.insert(at, n - 1);
            out.push(order);
        }
    }
    out
}

/// Compile `plan` over nodes of `kinds` to scm text and the notes on where it
/// differs from the native plan's meaning.
pub fn scm_of(grammar: &ScmGrammar<'_>, kinds: &[KindId], plan: Option<&PlanSpec>, dialect: Dialect) -> Result<(String, Vec<String>), String> {
    let conjuncts = match plan {
        Some(plan) => dnf(plan, true)?,
        None => vec![Vec::new()],
    };
    let mut compiler = Compiler { grammar, dialect, notes: Vec::new(), captures: 0 };
    let mut patterns = Vec::new();
    for &kind in kinds {
        for conjunct in &conjuncts {
            for pattern in compiler.conjunct(kind, conjunct)? {
                // A predicate belongs to the pattern only inside its parentheses.
                patterns.push(if pattern.predicates.is_empty() {
                    format!("{} @node", pattern.body)
                } else {
                    format!("({} @node {})", pattern.body, pattern.predicates.join(" "))
                });
            }
        }
    }
    if patterns.is_empty() {
        return Err("no pattern can hold".to_string());
    }
    let mut notes = compiler.notes;
    notes.sort();
    notes.dedup();
    Ok((patterns.join("\n"), notes))
}

impl ScmQuery {
    /// Build the query from its scm text, compiling its ECMAScript predicates.
    pub fn new(language: &Language, source: String, notes: Vec<String>) -> Result<ScmQuery, String> {
        let query = Query::new(language, &source).map_err(|e| format!("{e}\n{source}"))?;
        let node_capture = query.capture_index_for_name("node").ok_or("the query has no @node capture")?;
        let mut es = Vec::new();
        for pattern in 0..query.pattern_count() {
            let mut predicates = Vec::new();
            for predicate in query.general_predicates(pattern) {
                let positive = match &*predicate.operator {
                    "es-match?" => true,
                    "es-not-match?" => false,
                    other => return Err(format!("unknown predicate #{other}")),
                };
                let [QueryPredicateArg::Capture(capture), QueryPredicateArg::String(text)] = &*predicate.args else {
                    return Err("#es-match? takes a capture and a pattern".to_string());
                };
                predicates.push(EsPredicate { capture: *capture, matcher: Matcher::new(text, Dialect::Es)?, positive });
            }
            es.push(predicates);
        }
        Ok(ScmQuery { query, source, notes, node_capture, es })
    }

    /// The ids of the nodes under `root` (itself included) the query holds
    /// on, each once, and only where a pattern starts at most `max_depth`
    /// levels down.
    pub fn matching(&self, root: Node<'_>, source: &[u8], max_depth: Option<u32>) -> BTreeSet<usize> {
        let mut cursor = QueryCursor::new();
        cursor.set_max_start_depth(max_depth);
        let mut found = BTreeSet::new();
        let mut matches = cursor.matches(&self.query, root, source);
        while let Some(m) = matches.next() {
            let passes = self.es[m.pattern_index].iter().all(|p| {
                let mut nodes = m.captures().iter().filter(|c| c.index == p.capture).map(|c| &source[c.node.byte_range()]);
                // As the binding's own #match?: every captured node must pass,
                // and a capture that holds none passes.
                nodes.all(|text| std::str::from_utf8(text).is_ok_and(|text| p.matcher.is_match(text) == p.positive))
            });
            if passes {
                found.extend(m.captures().iter().filter(|c| c.index == self.node_capture).map(|c| c.node.id()));
            }
        }
        found
    }
}

#[cfg(test)]
mod tests {
    use tree_sitter::{Language, Parser, Query, QueryCursor, StreamingIterator};

    fn python() -> Language {
        tree_sitter_python::LANGUAGE.into()
    }

    fn count(scm: &str, source: &str) -> usize {
        let mut parser = Parser::new();
        parser.set_language(&python()).unwrap();
        let tree = parser.parse(source, None).unwrap();
        let query = Query::new(&python(), scm).unwrap();
        let mut cursor = QueryCursor::new();
        let mut matches = cursor.matches(&query, tree.root_node(), source.as_bytes());
        let mut n = 0;
        while matches.next().is_some() {
            n += 1;
        }
        n
    }

    #[test]
    fn a_predicate_inside_the_patterns_parentheses_filters_its_matches() {
        let source = "x = f(1)\nself.g(2)\n";
        assert_eq!(count(r#"((call function: (_) @f) @node (#match? @f "^self\\."))"#, source), 1);
        assert_eq!(count(r#"((call function: [(identifier) (attribute)] @f) @node (#match? @f "^self\\."))"#, source), 1);
    }

    /// The nodes `scm` holds on (by the @node capture), each once.
    fn holding(scm: &str, source: &str) -> usize {
        let mut parser = Parser::new();
        parser.set_language(&python()).unwrap();
        let tree = parser.parse(source, None).unwrap();
        let query = Query::new(&python(), scm).unwrap();
        let node = query.capture_index_for_name("node").unwrap();
        let mut cursor = QueryCursor::new();
        let mut matches = cursor.matches(&query, tree.root_node(), source.as_bytes());
        let mut found = std::collections::BTreeSet::new();
        while let Some(m) = matches.next() {
            found.extend(m.captures().iter().filter(|c| c.index == node).map(|c| c.node.id()));
        }
        found.len()
    }

    #[test]
    fn a_quantified_capture_does_not_make_a_negated_test_universal() {
        // Natively, `not (name match ^os$)` holds on the second and third
        // statements only: no value of the slot matches there.
        let source = "from m import os, sys\nfrom m import sys\nfrom m import x\n";
        let single = r#"((import_from_statement name: (_) @c) @node (#not-match? @c "^os$"))"#;
        let quantified = r#"((import_from_statement name: (_)* @c) @node (#not-match? @c "^os$"))"#;
        // One capture per match: a statement holds when some value passes.
        assert_eq!(holding(single, source), 3);
        // A quantified capture yields matches over fewer values too, the
        // empty one among them, so every statement still holds.
        assert_eq!(holding(quantified, source), 3);
    }

    #[test]
    fn a_predicate_after_the_pattern_is_a_pattern_of_its_own() {
        let query = Query::new(&python(), r#"(call function: (_) @f) @node (#match? @f "^self\\.")"#).unwrap();
        assert_eq!(query.pattern_count(), 2);
    }
}
