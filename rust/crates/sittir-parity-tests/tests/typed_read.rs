use sittir_core::read::{place, survey, Child, Entry, ReadCtx, Route, Sides};
use sittir_core::read_untyped_node::{read_untyped_node, NoMint, ReadDepth, ReadModel};
use sittir_core::types::{FieldValue, KindId, UntypedNode};
use std::collections::BTreeSet;

/// One extra's placement: its owner's span, its position (`leading`,
/// `trailing` or `inner:<key>`), its own span, `same_line`, `tokens_between`.
type Placed = BTreeSet<(u32, u32, String, u32, u32, bool, u16)>;

fn parse(language: &tree_sitter::Language, source: &str) -> tree_sitter::Tree {
    let mut parser = tree_sitter::Parser::new();
    parser.set_language(language).unwrap();
    parser.parse(source, None).unwrap()
}

/// Every extra's placement in today's deep read.
fn today(source: &str, language: &tree_sitter::Language, model: &dyn ReadModel) -> Placed {
    let tree = parse(language, source);
    let root = read_untyped_node(&tree, source, None, None, ReadDepth::Deep, model, &mut NoMint);
    let mut placed = Placed::new();
    fn visit(node: &UntypedNode, placed: &mut Placed) {
        let span = node.span.expect("a read node has a span");
        if let Some(trivia) = &node.trivia_data {
            let mut add = |position: String, entries: &[UntypedNode]| {
                for e in entries {
                    let s = e.span.expect("an extra has a span");
                    placed.insert((span.start, span.end, position.clone(), s.start, s.end, e.same_line, e.tokens_between));
                }
            };
            add("leading".into(), trivia.leading.as_deref().unwrap_or_default());
            add("trailing".into(), trivia.trailing.as_deref().unwrap_or_default());
            for (key, entries) in trivia.inner.iter().flatten() {
                add(format!("inner:{key}"), entries);
            }
        }
        for value in node.fields.iter().flat_map(|fields| fields.values()) {
            match value {
                FieldValue::Single(child) => visit(child, placed),
                FieldValue::Multiple(children) => children.iter().flatten().for_each(|child| visit(child, placed)),
                FieldValue::Text(_) | FieldValue::Bool(_) => {}
            }
        }
        for child in node.children.iter().flatten() {
            visit(child, placed);
        }
    }
    visit(&root, &mut placed);
    placed
}

/// The same placements from `place`, owners decided by today's model rows.
fn typed(source: &str, language: &tree_sitter::Language, model: &dyn ReadModel, gap: fn(u16) -> Option<&'static str>) -> Placed {
    let tree = parse(language, source);
    let ctx = ReadCtx::new(source, 0);
    let mut placed = Placed::new();
    walk(&mut tree.walk(), &ctx, language, model, gap, (0, source.len() as u32), Sides::root(), &mut placed);
    placed
}

// `place` takes a plain `fn` for the inner gaps and `inner_gap_key` needs the
// node's kind, so the driver sets the kind here before each `place` call.
thread_local!(static KIND: std::cell::Cell<KindId> = const { std::cell::Cell::new(KindId(0)) });

fn rust_gap(preceding: u16) -> Option<&'static str> {
    KIND.with(|k| sittir_rust::render::kind_ids::inner_gap_key(k.get(), preceding))
}

fn typescript_gap(preceding: u16) -> Option<&'static str> {
    KIND.with(|k| sittir_typescript::render::kind_ids::inner_gap_key(k.get(), preceding))
}

/// Place the extras among the children of the node the cursor is on, record
/// them under `span`, and recurse into each non-trivia child with its sides.
#[allow(clippy::too_many_arguments)]
fn walk(
    cursor: &mut tree_sitter::TreeCursor<'_>,
    ctx: &ReadCtx<'_>,
    language: &tree_sitter::Language,
    model: &dyn ReadModel,
    gap: fn(u16) -> Option<&'static str>,
    span: (u32, u32),
    sides: Sides,
    placed: &mut Placed,
) {
    let kind = KindId(cursor.node().grammar_id());
    let children = survey(cursor);
    let routes: Vec<Route> = children
        .iter()
        .map(|c: &Child| {
            if c.trivia {
                Route::Trivia
            } else if c.named {
                let field = c.field.and_then(|f| language.field_name_for_id(f.0));
                Route::Slot { slot: 0, scalar: model.stores_scalar(kind, field, c.grammar) }
            } else {
                Route::Layout
            }
        })
        .collect();
    KIND.with(|k| k.set(kind));
    let mut placement = place(ctx, &children, &routes, sides.owner, gap);
    let mut record = |position: &str, entries: &[Entry]| {
        for e in entries {
            placed.insert((span.0, span.1, position.to_string(), e.coord.span.start, e.coord.span.end, e.same_line, e.tokens_between));
        }
    };
    record("leading", &sides.leading);
    record("trailing", &sides.trailing);
    record("leading", &placement.own_leading);
    record("trailing", &placement.own_trailing);
    for (key, entries) in &placement.inner {
        record(&format!("inner:{key}"), entries);
    }
    if cursor.goto_first_child() {
        let mut i = 0;
        loop {
            if !children[i].trivia {
                let child_span = (children[i].start, children[i].end);
                walk(cursor, ctx, language, model, gap, child_span, placement.take(i), placed);
            }
            i += 1;
            if !cursor.goto_next_sibling() {
                break;
            }
        }
        cursor.goto_parent();
    }
}

fn probe_input(name: &str) -> String {
    let path = format!(
        "{}/../../../docs/superpowers/probes/2026-10-01-shared-arena/transport/inputs/{name}",
        env!("CARGO_MANIFEST_DIR")
    );
    std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("{path}: {e}"))
}

/// Every placement only one side made, all of them, with their counts.
fn assert_same_placement(typed: &Placed, today: &Placed, input: &str) {
    let only_typed: Vec<_> = typed.difference(today).collect();
    let only_today: Vec<_> = today.difference(typed).collect();
    assert!(
        only_typed.is_empty() && only_today.is_empty(),
        "{input}: {} placed only by the reader {only_typed:?}; {} only by today's read {only_today:?}",
        only_typed.len(),
        only_today.len()
    );
}

#[test]
fn placement_matches_todays_read_on_the_rust_probe_inputs() {
    let language = sittir_rust::language();
    let model = sittir_rust::RustGrammar;
    for name in ["engine.rs", "spacing.rs"] {
        let source = probe_input(name);
        assert_same_placement(&typed(&source, &language, &model, rust_gap), &today(&source, &language, &model), name);
    }
}

#[test]
fn placement_matches_todays_read_on_the_typescript_probe_input() {
    let language = sittir_typescript::language();
    let model = sittir_typescript::TypeScriptGrammar;
    let source = probe_input("create-engine.ts");
    assert_same_placement(&typed(&source, &language, &model, typescript_gap), &today(&source, &language, &model), "create-engine.ts");
}
