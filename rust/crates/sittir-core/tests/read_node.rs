//! readNode shape-gate tests. Spec 012 T025.
//!
//! For each of the three in-scope grammars (rust / typescript / python),
//! we parse a small source and assert the emitted `NodeData` has the
//! fixed allowed `$`-metadata keys plus de-hoisted `_<slot>` storage and
//! no others — SC-007 shape gate. Walks the entire read payload to check
//! every emitted NodeData (not just the root), so enrichment fields that
//! might slip in on leaves vs branches are both covered.
//!
//! Also sanity-checks that `$source` is always `"ts"` from this code
//! path, that child stubs carry parent-handle + `$childIndex`, and that
//! recursive `$fields` payloads no longer appear on native reads.

use serde_json::Value;
use sittir_core::read_node::{read_node, ReadDepth, ReadModel};
use sittir_core::types::{KindId, NodeData, Source};

/// Every kind is a text kind: the pre-gate behaviour, for the cases that
/// assert on it.
struct AllText;
impl ReadModel for AllText {
    fn is_text_kind(&self, _kind: KindId) -> bool {
        true
    }
}

/// Only the kinds named here are text kinds.
struct TextKinds(Vec<u16>);
impl ReadModel for TextKinds {
    fn is_text_kind(&self, kind: KindId) -> bool {
        self.0.contains(&kind.0)
    }
}

/// No text kinds; the kinds named here keep their anonymous children.
struct KeepsAnonymous(Vec<u16>);
impl ReadModel for KeepsAnonymous {
    fn is_text_kind(&self, _kind: KindId) -> bool {
        false
    }
    fn keeps_anonymous_children(&self, kind: KindId) -> bool {
        self.0.contains(&kind.0)
    }
}

/// Recursively assert that every object-shaped JSON node in `value`
/// (matching the NodeData wire shape) has only keys in
/// the de-hoisted NodeData contract. Descends into `_<slot>` values and
/// `$other` array entries.
fn assert_shape(value: &Value, path: &str) {
    match value {
        Value::Object(map) => {
            // If the object has "$type", it's a NodeData — gate the keys.
            // Otherwise (e.g. `$span` = {start, end}), just recurse.
            if map.contains_key("$type") {
                for key in map.keys() {
                    assert!(
                        is_allowed_node_key(key),
                        "unexpected top-level key at {path}: {key}"
                    );
                }
                assert!(
                    !map.contains_key("$fields"),
                    "legacy $fields wrapper leaked into read payload at {path}"
                );
                for (key, value) in map {
                    if key.starts_with('_') {
                        assert_shape(value, &format!("{path}.{key}"));
                    }
                }
                // Recurse into $other.
                if let Some(Value::Array(arr)) = map.get("$other") {
                    for (i, child) in arr.iter().enumerate() {
                        assert_shape(child, &format!("{path}.$other[{i}]"));
                    }
                }
            }
        }
        Value::Array(arr) => {
            // FieldValue::Multiple surfaces as an array of NodeData.
            for (i, v) in arr.iter().enumerate() {
                assert_shape(v, &format!("{path}[{i}]"));
            }
        }
        _ => {}
    }
}

/// Parse `source` with `language` and return the root NodeData.
fn parse_and_read(language: tree_sitter::Language, source: &str) -> NodeData {
    let mut parser = tree_sitter::Parser::new();
    parser.set_language(&language).expect("set language");
    let tree = parser.parse(source, None).expect("parse succeeds");
    read_node(&tree, source, None, Some(0), ReadDepth::Shallow, &AllText)
}

fn parse_tree(language: tree_sitter::Language, source: &str) -> tree_sitter::Tree {
    let mut parser = tree_sitter::Parser::new();
    parser.set_language(&language).expect("set language");
    parser.parse(source, None).expect("parse succeeds")
}

#[test]
fn rust_top_level_node_has_allowed_keys_only() {
    let lang: tree_sitter::Language = tree_sitter_rust::LANGUAGE.into();
    let source = "fn main() { let x = 1; }";
    let node = parse_and_read(lang, source);
    let json = serde_json::to_value(&node).expect("serialize");
    assert_shape(&json, "rust.root");
    assert_eq!(node.source, Source::Ts, "source must be ts");
    assert_eq!(
        node.node_handle,
        Some(0),
        "root carries its reserved handle"
    );
    assert!(node.child_index.is_none(), "root has no child_index");
    assert!(node.span.is_some(), "span populated");
}

#[test]
fn typescript_top_level_node_has_allowed_keys_only() {
    let lang: tree_sitter::Language = tree_sitter_typescript::LANGUAGE_TYPESCRIPT.into();
    let source = "const x: number = 42;";
    let node = parse_and_read(lang, source);
    let json = serde_json::to_value(&node).expect("serialize");
    assert_shape(&json, "typescript.root");
    assert_eq!(node.source, Source::Ts);
}

#[test]
fn python_top_level_node_has_allowed_keys_only() {
    let lang: tree_sitter::Language = tree_sitter_python::LANGUAGE.into();
    let source = "def foo(x):\n    return x + 1\n";
    let node = parse_and_read(lang, source);
    let json = serde_json::to_value(&node).expect("serialize");
    assert_shape(&json, "python.root");
    assert_eq!(node.source, Source::Ts);
}

#[test]
fn no_enrichment_fields_on_any_node() {
    // $variant, $raw, promoted-keyword flags — none may appear anywhere.
    let lang: tree_sitter::Language = tree_sitter_rust::LANGUAGE.into();
    let source = "pub fn hello() -> &'static str { \"hi\" }";
    let node = parse_and_read(lang, source);
    let json = serde_json::to_value(&node).expect("serialize");
    let s = serde_json::to_string(&json).expect("stringify");
    // A cheap keyword-scan catches the obvious violations in the whole
    // subtree without writing a full walker.
    for forbidden in &["$variant", "$raw", "$promoted"] {
        assert!(
            !s.contains(forbidden),
            "enrichment field {forbidden} leaked into Rust read path"
        );
    }
}

#[test]
fn child_index_set_on_non_root_nodes() {
    // Every child stub carries the parent handle + `$childIndex`.
    // Root has no child_index.
    let lang: tree_sitter::Language = tree_sitter_python::LANGUAGE.into();
    let source = "x = 1\ny = 2\n";
    let node = parse_and_read(lang, source);
    let json = serde_json::to_value(&node).expect("serialize");
    let mut child_meta: Vec<(u16, u32)> = Vec::new();
    collect_child_meta(&json, &mut child_meta, false);
    assert!(
        !child_meta.is_empty(),
        "should see child stubs in read payload"
    );
    assert!(child_meta.iter().all(|(_, handle)| *handle == 0));
    // Root must NOT have a child_index.
    assert!(
        node.child_index.is_none(),
        "root must not have a childIndex"
    );
    assert_eq!(node.node_handle, Some(0));
}

#[test]
fn anonymous_leaf_children_do_not_invent_fields() {
    let lang: tree_sitter::Language = tree_sitter_rust::LANGUAGE.into();
    let source = "fn f() { let _ = async move || async move {}; }";
    let tree = parse_tree(lang, source);
    let params = find_first_ts_node_by_kind(tree.root_node(), "closure_parameters")
        .expect("closure_parameters cst node");
    let node = read_node(
        &tree,
        source,
        Some(params),
        Some(0),
        ReadDepth::Shallow,
        &TextKinds(vec![]),
    );
    let json = serde_json::to_value(&node).expect("serialize");
    let params = json.as_object().expect("closure_parameters object");
    assert!(
        !params.contains_key("_|"),
        "native read must not invent _<text> fields for anonymous children"
    );
    assert!(
        params.get("$other").is_none(),
        "anonymous-only leaf nodes should still collapse to text"
    );
    assert!(params.get("$text").is_none());
    assert_eq!(
        params
            .get("$span")
            .and_then(|s| s.get("end"))
            .and_then(Value::as_u64),
        params
            .get("$span")
            .and_then(|s| s.get("start"))
            .and_then(Value::as_u64)
            .map(|start| start + 2)
    );
}

#[test]
fn structural_nodes_carry_a_span_and_no_text_while_text_kinds_keep_theirs() {
    let lang: tree_sitter::Language = tree_sitter_rust::LANGUAGE.into();
    let source = "fn main() { let x = 1; }";
    let tree = parse_tree(lang, source);
    let identifier = tree.language().id_for_node_kind("identifier", true);
    let model = TextKinds(vec![identifier]);
    let root = read_node(&tree, source, None, Some(0), ReadDepth::Deep, &model);
    let json = serde_json::to_value(&root).expect("serialize");

    fn walk(v: &Value, seen: &mut Vec<(u16, bool, bool)>) {
        if let Some(map) = v.as_object() {
            if let Some(t) = map.get("$type").and_then(Value::as_u64) {
                seen.push((
                    t as u16,
                    map.contains_key("$text"),
                    map.contains_key("$span"),
                ));
            }
            for (k, child) in map {
                if k.starts_with('_') || k == "$other" {
                    walk(child, seen);
                }
            }
        } else if let Some(arr) = v.as_array() {
            for c in arr {
                walk(c, seen);
            }
        }
    }
    let mut seen = Vec::new();
    walk(&json, &mut seen);

    let named_structural: Vec<_> = seen
        .iter()
        .filter(|(t, _, _)| *t != identifier && tree.language().node_kind_is_named(*t))
        .collect();
    assert!(!named_structural.is_empty());
    assert!(
        named_structural
            .iter()
            .all(|(_, has_text, has_span)| !has_text && *has_span),
        "{seen:?}"
    );
    assert!(seen
        .iter()
        .filter(|(t, _, _)| *t == identifier)
        .all(|(_, has_text, _)| *has_text));
    // Anonymous tokens are never gated: their text is their content.
    let anonymous: Vec<_> = seen
        .iter()
        .filter(|(t, _, _)| !tree.language().node_kind_is_named(*t))
        .collect();
    assert!(
        anonymous.iter().all(|(_, has_text, _)| *has_text),
        "{seen:?}"
    );
}

#[test]
fn an_aliased_node_keeps_its_text_when_either_identity_is_a_text_kind() {
    // rust's `type_identifier` is `alias($.identifier, $.type_identifier)`:
    // the node parses as `identifier` and is shown as `type_identifier`.
    let lang: tree_sitter::Language = tree_sitter_rust::LANGUAGE.into();
    let source = "struct Foo;";
    let tree = parse_tree(lang, source);
    let name = find_first_ts_node_by_kind(tree.root_node(), "type_identifier")
        .expect("type_identifier node");
    let identifier = tree.language().id_for_node_kind("identifier", true);
    let type_identifier = tree.language().id_for_node_kind("type_identifier", true);
    let text_under = |model: &dyn ReadModel| {
        read_node(&tree, source, Some(name), Some(0), ReadDepth::Shallow, model).text
    };
    assert_eq!(text_under(&TextKinds(vec![identifier])).as_deref(), Some("Foo"));
    assert_eq!(
        text_under(&TextKinds(vec![type_identifier])).as_deref(),
        Some("Foo")
    );
    assert_eq!(text_under(&TextKinds(vec![])), None);
}

#[test]
fn the_root_covers_the_whole_file_by_span_and_carries_no_text() {
    let lang: tree_sitter::Language = tree_sitter_rust::LANGUAGE.into();
    let source = "\n\n// only a comment\n";
    let tree = parse_tree(lang, source);
    let root = read_node(
        &tree,
        source,
        None,
        Some(0),
        ReadDepth::Shallow,
        &TextKinds(vec![]),
    );
    assert_eq!(
        root.span.map(|s| (s.start, s.end)),
        Some((0, source.len() as u32))
    );
    assert!(root.text.is_none());
}

#[test]
fn raw_native_children_payload_stays_array_shaped() {
    let lang: tree_sitter::Language = tree_sitter_rust::LANGUAGE.into();
    let source = "fn f() { g(x); }";
    let tree = parse_tree(lang, source);
    let args = find_first_ts_node_by_kind(tree.root_node(), "arguments").expect("arguments node");
    let node = read_node(&tree, source, Some(args), Some(0), ReadDepth::Shallow, &AllText);
    let json = serde_json::to_value(&node).expect("serialize");

    assert!(
        json.get("$other").is_some_and(Value::is_array),
        "raw native read payload must stay realized-shape for children"
    );
}

/// Pre-order walk over the JSON NodeData tree, collecting child stub
/// `(childIndex, nodeHandle)` pairs. Recurses through `_<slot>` values
/// and `$other`.
fn collect_child_meta(value: &Value, out: &mut Vec<(u16, u32)>, is_child: bool) {
    match value {
        Value::Object(map) => {
            if is_child {
                if let (Some(Value::Number(idx)), Some(Value::Number(handle))) =
                    (map.get("$childIndex"), map.get("$nodeHandle"))
                {
                    if let (Some(idx), Some(handle)) = (idx.as_u64(), handle.as_u64()) {
                        out.push((idx as u16, handle as u32));
                    }
                }
            }
            for (key, value) in map {
                if key.starts_with('_') {
                    collect_child_meta(value, out, true);
                }
            }
            if let Some(Value::Array(arr)) = map.get("$other") {
                for c in arr {
                    collect_child_meta(c, out, true);
                }
            }
        }
        Value::Array(arr) => {
            for v in arr {
                collect_child_meta(v, out, true);
            }
        }
        _ => {}
    }
}

fn is_allowed_node_key(key: &str) -> bool {
    matches!(
        key,
        "$type"
            | "$source"
            | "$named"
            | "$other"
            | "$text"
            | "$span"
            | "$nodeHandle"
            | "$childIndex"
            | "$_trivia"
            | "$slotOrder"
            | "$sameLine"
            | "$tokensBetween"
    ) || key.starts_with('_')
}

fn find_first_ts_node_by_kind<'a>(
    node: tree_sitter::Node<'a>,
    kind: &str,
) -> Option<tree_sitter::Node<'a>> {
    if node.kind() == kind {
        return Some(node);
    }
    for i in 0..node.child_count() {
        let child = node.child(i as u32)?;
        if let Some(found) = find_first_ts_node_by_kind(child, kind) {
            return Some(found);
        }
    }
    None
}

#[test]
fn a_kind_that_keeps_anonymous_children_reads_its_only_anonymous_child_as_other() {
    let lang: tree_sitter::Language = tree_sitter_rust::LANGUAGE.into();
    let source = "fn f() { let _ = async move || async move {}; }";
    let tree = parse_tree(lang, source);
    let params = find_first_ts_node_by_kind(tree.root_node(), "closure_parameters")
        .expect("closure_parameters cst node");
    let closure_parameters = tree.language().id_for_node_kind("closure_parameters", true);
    let pipe = tree.language().id_for_node_kind("|", false);
    let node = read_node(
        &tree,
        source,
        Some(params),
        Some(0),
        ReadDepth::Shallow,
        &KeepsAnonymous(vec![closure_parameters]),
    );
    let json = serde_json::to_value(&node).expect("serialize");
    assert_shape(&json, "closure_parameters");
    let other = json
        .get("$other")
        .and_then(Value::as_array)
        .expect("the anonymous children stay as $other");
    let kinds: Vec<u64> = other
        .iter()
        .filter_map(|child| child.get("$type").and_then(Value::as_u64))
        .collect();
    assert_eq!(kinds, vec![u64::from(pipe), u64::from(pipe)]);
    assert!(json.get("$text").is_none());
}

/// No text kinds; a `block` keys the gap after its `{` to `statements`.
struct BlockGap(u16);
impl ReadModel for BlockGap {
    fn is_text_kind(&self, _kind: KindId) -> bool {
        false
    }
    fn inner_gap_key(&self, kind: KindId, preceding_tokens: u16) -> Option<&'static str> {
        (kind.0 == self.0 && preceding_tokens == 1).then_some("statements")
    }
}

/// Every node of `kind` in `source`, each read on its own by its tree node.
fn read_rust_kind(source: &str, kind: &str) -> Vec<NodeData> {
    let tree = parse_tree(tree_sitter_rust::LANGUAGE.into(), source);
    let block = tree.language().id_for_node_kind("block", true);
    let mut found = Vec::new();
    let mut stack = vec![tree.root_node()];
    while let Some(node) = stack.pop() {
        if node.kind() == kind {
            found.push(node);
        }
        let mut cursor = node.walk();
        stack.extend(node.children(&mut cursor));
    }
    found.sort_by_key(|node| node.start_byte());
    found
        .into_iter()
        .map(|node| {
            read_node(
                &tree,
                source,
                Some(node),
                Some(0),
                ReadDepth::Shallow,
                &BlockGap(block),
            )
        })
        .collect()
}

#[test]
fn a_same_line_comment_trails_the_previous_sibling() {
    let statements = read_rust_kind("fn g() { a; // note\n b; }", "expression_statement");
    let trailing = statements[0]
        .trivia_data
        .as_ref()
        .and_then(|trivia| trivia.trailing.as_ref())
        .expect("the comment trails a;");
    assert_eq!(trailing.len(), 1);
    assert!(trailing[0].same_line);
    assert!(statements[1].trivia_data.is_none());
    assert_shape(
        &serde_json::to_value(&statements[0]).expect("serialize"),
        "a;",
    );
}

#[test]
fn an_own_line_comment_leads_the_next_sibling_and_the_last_one_trails() {
    let statements = read_rust_kind(
        "fn g() {\n a;\n // lead\n b;\n // tail\n}",
        "expression_statement",
    );
    let first = statements[0].trivia_data.as_ref();
    assert!(
        first.is_none(),
        "an own-line comment with a next sibling is not trailing"
    );
    let second = statements[1]
        .trivia_data
        .as_ref()
        .expect("b; owns both comments");
    let leading = second.leading.as_ref().expect("leading");
    let trailing = second.trailing.as_ref().expect("trailing");
    assert_eq!((leading.len(), trailing.len()), (1, 1));
    assert!(!leading[0].same_line && !trailing[0].same_line);
}

#[test]
fn a_comment_in_an_empty_block_is_inner_trivia_of_the_block() {
    let blocks = read_rust_kind("fn f() { // TODO\n}", "block");
    let inner = blocks[0]
        .trivia_data
        .as_ref()
        .and_then(|trivia| trivia.inner.as_ref())
        .expect("the block owns the comment");
    assert_eq!(inner.get("statements").map(Vec::len), Some(1));
    let json = serde_json::to_value(&blocks[0]).expect("serialize");
    assert_eq!(
        json["$_trivia"]["inner"]["statements"]
            .as_array()
            .map(Vec::len),
        Some(1)
    );
}

#[test]
fn a_block_comment_before_its_owner_on_the_same_row_is_same_line_leading() {
    let statements = read_rust_kind("fn f() { /* c */ a; }", "expression_statement");
    let leading = statements[0]
        .trivia_data
        .as_ref()
        .and_then(|trivia| trivia.leading.as_ref())
        .expect("the comment leads a;");
    assert!(leading[0].same_line);
    let json = serde_json::to_value(&leading[0]).expect("serialize");
    assert_eq!(json["$sameLine"], Value::Bool(true));
}

#[test]
fn a_comment_that_ends_with_its_line_break_ends_on_the_row_it_closes() {
    let items = read_rust_kind("///\nfn f(){}", "function_item");
    let leading = items[0]
        .trivia_data
        .as_ref()
        .and_then(|trivia| trivia.leading.as_ref())
        .expect("the doc comment leads fn f");
    assert!(!leading[0].same_line);
    let json = serde_json::to_value(&leading[0]).expect("serialize");
    assert!(json.get("$sameLine").is_none());

    let items = read_rust_kind("fn f(){} // x\n", "function_item");
    let trailing = items[0]
        .trivia_data
        .as_ref()
        .and_then(|trivia| trivia.trailing.as_ref())
        .expect("the comment trails fn f");
    assert!(trailing[0].same_line);
}

#[test]
fn a_same_line_trailing_entry_counts_the_tokens_before_it() {
    let arguments = read_rust_kind("fn f() { g(a, // c\n b); }", "identifier");
    let a = arguments
        .iter()
        .find(|node| node.trivia_data.is_some())
        .expect("a owns the comment");
    let trailing = a
        .trivia_data
        .as_ref()
        .and_then(|t| t.trailing.as_ref())
        .expect("trailing");
    assert!(trailing[0].same_line);
    assert_eq!(trailing[0].tokens_between, 1);
    let json = serde_json::to_value(&trailing[0]).expect("serialize");
    assert_eq!(json["$tokensBetween"], 1);
}

/// Every node in a read payload stamped with `kind`, trivia entries included.
fn nodes_of_kind<'v>(value: &'v Value, kind: KindId, found: &mut Vec<&'v Value>) {
    match value {
        Value::Object(map) => {
            if map.get("$type") == Some(&Value::from(kind.0)) {
                found.push(value);
            }
            for child in map.values() {
                nodes_of_kind(child, kind, found);
            }
        }
        Value::Array(items) => {
            for item in items {
                nodes_of_kind(item, kind, found);
            }
        }
        _ => {}
    }
}

fn read_python_errors(source: &str) -> Vec<Value> {
    let tree = parse_tree(tree_sitter_python::LANGUAGE.into(), source);
    let root = read_node(&tree, source, None, Some(0), ReadDepth::Deep, &TextKinds(vec![]));
    let json = serde_json::to_value(&root).expect("serialize");
    let mut found = Vec::new();
    nodes_of_kind(&json, KindId::ERROR, &mut found);
    found.into_iter().cloned().collect()
}

#[test]
fn an_error_is_a_trivia_leaf_holding_its_whole_span() {
    let errors = read_python_errors("x = 1 $ 2\n");
    assert_eq!(errors.len(), 1, "the nested ERROR inside it is not read");
    let error = errors[0].as_object().expect("error object");
    assert_eq!(error["$text"], "1 $");
    assert!(
        error.keys().all(|key| !key.starts_with('_') && key != "$other" && key != "$_trivia"),
        "an ERROR carries no slots, children or trivia: {error:?}"
    );
}

#[test]
fn an_error_filling_a_statement_gap_is_trivia_with_its_source_text() {
    let source = "from a import (  # c\n    *)\n";
    let errors = read_python_errors(source);
    assert_eq!(errors.len(), 1);
    assert_eq!(errors[0]["$text"], "from a import (  # c\n    *)");
}
