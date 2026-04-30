//! Shared native engine state for grammar-specific N-API bindings.
//!
//! Grammar crates provide a small [`EngineGrammar`] adapter for parser setup,
//! template hash lookup, and render dispatch. This module owns the generic
//! parse/read/render/edit state machine so `sittir-{lang}` crates stay
//! thin and grammar-owned.

use crate::format::{apply_format, extract_format};
use crate::read_node::read_node;
use crate::splice::apply_edits as splice_apply_edits;
use crate::types::{Edit, FormatRecord, NodeData, Source};

const MAX_SAFE_NODE_ID: u64 = 9_007_199_254_740_991;

/// Grammar-specific hooks used by the shared native engine.
pub trait EngineGrammar: Copy {
    fn configure_parser(self, parser: &mut tree_sitter::Parser) -> Result<(), String>;
    fn template_bundle_hash(self) -> &'static str;
    fn render(self, node: &NodeData) -> Result<String, String>;
}

/// Stateful native engine shared by the grammar-specific N-API wrappers.
pub struct Engine<G: EngineGrammar> {
    grammar: G,
    parser: tree_sitter::Parser,
    source: Option<String>,
    tree: Option<tree_sitter::Tree>,
    engine_format: Option<FormatRecord>,
    tree_format: Option<FormatRecord>,
}

/// Result wrapper for parse-and-read calls.
#[derive(serde::Serialize)]
struct ParseResult<'a> {
    #[serde(rename = "nodeData")]
    node_data: &'a NodeData,
    #[serde(skip_serializing_if = "Option::is_none")]
    format: Option<FormatRecord>,
}

impl<G: EngineGrammar> Engine<G> {
    pub fn new(grammar: G, engine_format: Option<FormatRecord>) -> Result<Self, String> {
        let mut parser = tree_sitter::Parser::new();
        grammar.configure_parser(&mut parser)?;
        Ok(Self {
            grammar,
            parser,
            source: None,
            tree: None,
            engine_format,
            tree_format: None,
        })
    }

    pub fn template_bundle_hash(&self) -> &'static str {
        self.grammar.template_bundle_hash()
    }

    pub fn find_and_read(&mut self, _source: String, _pattern: String) -> Result<String, String> {
        Err("find_and_read not yet implemented — ast-grep-core integration pending".to_string())
    }

    pub fn parse_and_read(&mut self, source: String) -> Result<String, String> {
        let tree = self.parser.parse(&source, None).ok_or_else(|| {
            let snippet: String = source.chars().take(80).collect();
            format!("parse failed (source: {snippet:?})")
        })?;
        self.source = Some(source.clone());
        self.tree = Some(tree.clone());
        let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
            read_node(
                self.tree.as_ref().unwrap(),
                self.source.as_ref().unwrap(),
                None,
            )
        }));
        match result {
            Ok(data) => {
                let format =
                    extract_format(self.source.as_ref().unwrap(), self.tree.as_ref().unwrap());
                self.tree_format = format.clone();
                serde_json::to_string(&ParseResult {
                    node_data: &data,
                    format,
                })
                .map_err(|e| format!("serialize ParseResult failed: {e}"))
            }
            Err(panic_payload) => Err(panic_msg(panic_payload, "parse_and_read panicked")),
        }
    }

    pub fn read_node(&mut self, node_id: f64) -> Result<String, String> {
        let id = validate_node_id(node_id)?;
        let tree = self
            .tree
            .as_ref()
            .ok_or_else(|| "no tree cached — call parseAndRead first".to_string())?;
        let source = self
            .source
            .as_ref()
            .ok_or_else(|| "no source cached — call parseAndRead first".to_string())?;
        let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
            read_node(tree, source, Some(id))
        }));
        match result {
            Ok(data) => {
                serde_json::to_string(&data).map_err(|e| format!("serialize NodeData failed: {e}"))
            }
            Err(panic_payload) => Err(panic_msg(
                panic_payload,
                &format!("node id {id} not found in current tree"),
            )),
        }
    }

    pub fn render(&self, node_json: String) -> Result<String, String> {
        let node: NodeData = serde_json::from_str(&node_json).map_err(|e| {
            let snippet: String = node_json.chars().take(80).collect();
            format!("parse NodeData JSON failed: {e} (json: {snippet:?})")
        })?;
        self.render_node_data(node)
    }

    pub fn render_node_data(&self, node: NodeData) -> Result<String, String> {
        let canonical = self
            .grammar
            .render(&node)
            .map_err(|e| format!("render_dispatch failed: {e}"))?;
        self.render_canonical_node(&node, canonical)
    }

    pub fn render_canonical_node(
        &self,
        node: &NodeData,
        canonical: String,
    ) -> Result<String, String> {
        let effective_format = resolve_render_format(
            &node,
            self.engine_format.as_ref(),
            self.tree_format.as_ref(),
        );
        Ok(match effective_format {
            Some(format) => apply_format(&canonical, format),
            None => canonical,
        })
    }

    pub fn apply_edits(&self, source: String, edits: Vec<Edit>) -> Result<String, String> {
        splice_apply_edits(&source, edits).map_err(|e| format!("{e}"))
    }

    pub fn dispose(&mut self) {
        self.source = None;
        self.tree = None;
        self.tree_format = None;
    }
}

fn validate_node_id(node_id: f64) -> Result<u64, String> {
    if !node_id.is_finite() {
        return Err(format!(
            "invalid node id {node_id}: expected a finite non-negative safe integer"
        ));
    }
    if node_id < 0.0 {
        return Err(format!(
            "invalid node id {node_id}: expected a non-negative safe integer"
        ));
    }
    if node_id.fract() != 0.0 {
        return Err(format!("invalid node id {node_id}: expected an integer"));
    }
    if node_id > MAX_SAFE_NODE_ID as f64 {
        return Err(format!(
            "invalid node id {node_id}: exceeds Number.MAX_SAFE_INTEGER"
        ));
    }
    Ok(node_id as u64)
}

fn resolve_render_format<'a>(
    node: &NodeData,
    engine_format: Option<&'a FormatRecord>,
    tree_format: Option<&'a FormatRecord>,
) -> Option<&'a FormatRecord> {
    if let Some(format) = engine_format {
        return Some(format);
    }
    if !matches!(node.source, Source::Factory) {
        return tree_format;
    }
    None
}

fn panic_msg(payload: Box<dyn std::any::Any + Send>, fallback: &str) -> String {
    if let Some(s) = payload.downcast_ref::<String>() {
        s.clone()
    } else if let Some(s) = payload.downcast_ref::<&str>() {
        s.to_string()
    } else {
        fallback.to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{FormatBoundary, FormatRecord};

    #[derive(Clone, Copy)]
    struct TestGrammar;

    impl EngineGrammar for TestGrammar {
        fn configure_parser(
            self,
            parser: &mut tree_sitter::Parser,
        ) -> std::result::Result<(), String> {
            let language: tree_sitter::Language = tree_sitter_rust::LANGUAGE.into();
            parser
                .set_language(&language)
                .map_err(|e| format!("failed to set parser language: {e}"))
        }

        fn template_bundle_hash(self) -> &'static str {
            "test"
        }

        fn render(self, node: &NodeData) -> std::result::Result<String, String> {
            Ok(format!("rendered:{}", node.type_))
        }
    }

    fn format_record(prefix: &str, suffix: &str) -> FormatRecord {
        FormatRecord {
            boundary: Some(FormatBoundary {
                leading: Some(prefix.to_string()),
                trailing: Some(suffix.to_string()),
            }),
            slots: None,
            literals: None,
            trivia: None,
            kinds: None,
        }
    }

    fn node(source: Source) -> NodeData {
        NodeData {
            type_: "identifier".to_string(),
            source,
            named: true,
            fields: None,
            children: None,
            text: Some("x".to_string()),
            span: None,
            node_id: None,
        }
    }

    #[test]
    fn render_node_data_preserves_engine_format() {
        let engine = Engine::new(TestGrammar, Some(format_record("<<", ">>"))).unwrap();

        let rendered = engine.render_node_data(node(Source::Factory)).unwrap();

        assert_eq!(rendered, "<<rendered:identifier>>");
    }

    #[test]
    fn render_canonical_node_preserves_tree_format_for_tree_nodes() {
        let mut engine = Engine::new(TestGrammar, None).unwrap();
        engine.tree_format = Some(format_record("[", "]"));

        let rendered = engine
            .render_canonical_node(&node(Source::Ts), "canonical".to_string())
            .unwrap();

        assert_eq!(rendered, "[canonical]");
    }

    #[test]
    fn render_canonical_node_does_not_apply_tree_format_to_factory_nodes() {
        let mut engine = Engine::new(TestGrammar, None).unwrap();
        engine.tree_format = Some(format_record("[", "]"));

        let rendered = engine
            .render_canonical_node(&node(Source::Factory), "canonical".to_string())
            .unwrap();

        assert_eq!(rendered, "canonical");
    }
}
