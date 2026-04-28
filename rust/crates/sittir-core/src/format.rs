//! Format extractor — `extract_format` produces a consensus `FormatRecord`
//! from a source string and its tree-sitter parse tree.
//!
//! This is a single-pass extractor: one tree walk produces all style samples;
//! the samples are reduced to consensus values; `None` is returned when the
//! source is already template-canonical (FR-002, FR-007, SC-005).

use crate::types::{FormatBoundary, FormatRecord};

/// Walk `tree` over `source` and return a consensus `FormatRecord`, or
/// `None` when the source is already template-canonical (2-space or no
/// indentation detected).
///
/// Determinism guarantee: identical `source` + identical grammar version →
/// identical result.
pub fn extract_format(source: &str, tree: &tree_sitter::Tree) -> Option<FormatRecord> {
    // Touch the root node so the tree parameter is exercised.  Phase 2 will
    // use the cursor to collect per-kind separator and trivia samples.
    let _root = tree.root_node();

    let indent = detect_indent(source)?;

    Some(FormatRecord {
        boundary: Some(FormatBoundary {
            leading: Some(indent),
            trailing: None,
        }),
        slots: None,
        literals: None,
        trivia: None,
        kinds: None,
    })
}

/// Scan `source` for a dominant indentation pattern.
///
/// Returns `None` when 2-space indentation (the template-canonical style) or
/// no indentation at all is detected — callers treat that as "already
/// canonical".
///
/// Returns `Some("\t")` when tab indentation dominates, and
/// `Some("    ")` (four spaces) when 4-space indentation dominates over
/// 2-space.
fn detect_indent(source: &str) -> Option<String> {
    let mut tab_count = 0usize;
    let mut four_space_count = 0usize;
    let mut two_space_count = 0usize;

    for line in source.lines() {
        if line.starts_with('\t') {
            tab_count += 1;
        } else if line.starts_with("    ") {
            four_space_count += 1;
        } else if line.starts_with("  ") {
            two_space_count += 1;
        }
    }

    if tab_count > 0 && tab_count >= four_space_count {
        Some("\t".to_string())
    } else if four_space_count > two_space_count && four_space_count > 0 {
        Some("    ".to_string())
    } else {
        // 2-space or no indentation — already canonical.
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn parse_rust(source: &str) -> tree_sitter::Tree {
        let mut parser = tree_sitter::Parser::new();
        let language: tree_sitter::Language = tree_sitter_rust::LANGUAGE.into();
        parser.set_language(&language).unwrap();
        parser.parse(source, None).unwrap()
    }

    #[test]
    fn extract_format_tab_indent_returns_some() {
        let source = "fn main() {\n\tprintln!(\"hello\");\n}\n";
        let tree = parse_rust(source);

        let result = extract_format(source, &tree);
        assert!(result.is_some(), "tab-indented source should return Some(FormatRecord)");
        let record = result.unwrap();
        assert!(record.boundary.is_some());
        let boundary = record.boundary.unwrap();
        assert_eq!(boundary.leading, Some("\t".to_string()));
    }

    #[test]
    fn extract_format_canonical_returns_none() {
        let source = "fn main() {\n  println!(\"hello\");\n}\n";
        let tree = parse_rust(source);

        let result = extract_format(source, &tree);
        assert!(result.is_none(), "2-space indent source should return None (already canonical)");
    }

    #[test]
    fn extract_format_four_space_returns_some() {
        let source = "fn main() {\n    println!(\"hello\");\n    let x = 1;\n}\n";
        let tree = parse_rust(source);

        let result = extract_format(source, &tree);
        assert!(result.is_some(), "4-space indent source should return Some(FormatRecord)");
        let record = result.unwrap();
        let boundary = record.boundary.unwrap();
        assert_eq!(boundary.leading, Some("    ".to_string()));
    }
}
