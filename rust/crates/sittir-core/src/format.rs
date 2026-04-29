//! Format extractor — `extract_format` produces a consensus `FormatRecord`
//! from a source string and its tree-sitter parse tree.
//!
//! This is a single-pass extractor: one tree walk produces all style samples;
//! the samples are reduced to consensus values; `None` is returned when the
//! source is already template-canonical (FR-002, FR-007, SC-005).

use crate::types::{FormatBoundary, FormatRecord, FormatTrivia};

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

    if tab_count > four_space_count && tab_count > two_space_count {
        Some("\t".to_string())
    } else if four_space_count > two_space_count && four_space_count > tab_count {
        Some("    ".to_string())
    } else {
        // 2-space or no indentation — already canonical.
        None
    }
}

/// Apply a [`FormatRecord`] to a canonical render string.
///
/// Mirrors `applyFormat` in `packages/core/src/format.ts` (Phase 1):
/// 1. Insert `trivia` items at their byte offsets (right-to-left so
///    earlier offsets are not invalidated). Offsets are canonical-relative,
///    so trivia must be applied before boundary.
/// 2. Prepend `boundary.leading` and append `boundary.trailing`.
/// 3. `slots` and `literals` are reserved for future phases; ignored here.
///
/// # Arguments
/// * `canonical` - Template-canonical rendered string.
/// * `format`    - The [`FormatRecord`] to apply.
pub fn apply_format(canonical: &str, format: &FormatRecord) -> String {
    let with_trivia = apply_trivia(canonical, format);
    apply_boundary(&with_trivia, format)
}

fn apply_boundary(s: &str, format: &FormatRecord) -> String {
    match &format.boundary {
        None => s.to_string(),
        Some(b) => {
            let leading = b.leading.as_deref().unwrap_or("");
            let trailing = b.trailing.as_deref().unwrap_or("");
            format!("{leading}{s}{trailing}")
        }
    }
}

fn apply_trivia(s: &str, format: &FormatRecord) -> String {
    let trivia = match &format.trivia {
        None => return s.to_string(),
        Some(v) if v.is_empty() => return s.to_string(),
        Some(v) => v,
    };
    // Sort descending by offset so earlier positions are not invalidated.
    let mut sorted: Vec<&FormatTrivia> = trivia.iter().collect();
    sorted.sort_by(|a, b| b.offset.cmp(&a.offset));

    let mut result = s.to_string();
    for item in sorted {
        let offset = (item.offset as usize).min(result.len());
        result.insert_str(offset, &item.text);
    }
    result
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
        assert!(
            result.is_some(),
            "tab-indented source should return Some(FormatRecord)"
        );
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
        assert!(
            result.is_none(),
            "2-space indent source should return None (already canonical)"
        );
    }

    #[test]
    fn extract_format_four_space_returns_some() {
        let source = "fn main() {\n    println!(\"hello\");\n    let x = 1;\n}\n";
        let tree = parse_rust(source);

        let result = extract_format(source, &tree);
        assert!(
            result.is_some(),
            "4-space indent source should return Some(FormatRecord)"
        );
        let record = result.unwrap();
        let boundary = record.boundary.unwrap();
        assert_eq!(boundary.leading, Some("    ".to_string()));
    }

    // --- apply_format tests ---

    fn make_record(
        leading: Option<&str>,
        trailing: Option<&str>,
        trivia: Option<Vec<(u32, &str)>>,
    ) -> FormatRecord {
        use crate::types::{FormatBoundary, FormatTrivia};
        FormatRecord {
            boundary: if leading.is_some() || trailing.is_some() {
                Some(FormatBoundary {
                    leading: leading.map(str::to_string),
                    trailing: trailing.map(str::to_string),
                })
            } else {
                None
            },
            slots: None,
            literals: None,
            trivia: trivia.map(|v| {
                v.into_iter()
                    .map(|(offset, text)| FormatTrivia {
                        offset,
                        text: text.to_string(),
                    })
                    .collect()
            }),
            kinds: None,
        }
    }

    #[test]
    fn apply_format_no_boundary_returns_unchanged() {
        let fmt = make_record(None, None, None);
        assert_eq!(apply_format("hello", &fmt), "hello");
    }

    #[test]
    fn apply_format_leading_trailing_boundary() {
        let fmt = make_record(Some("<<"), Some(">>"), None);
        assert_eq!(apply_format("hello", &fmt), "<<hello>>");
    }

    #[test]
    fn apply_format_trivia_inserted_at_offsets() {
        // canonical = "ab"; trivia: insert "1" at offset 1, "2" at offset 2.
        // Applied right-to-left: "2" at offset 2 → "ab2", then "1" at offset 1 → "a1b2".
        let fmt = make_record(None, None, Some(vec![(1, "1"), (2, "2")]));
        assert_eq!(apply_format("ab", &fmt), "a1b2");
    }

    #[test]
    fn apply_format_empty_trivia_returns_unchanged() {
        let fmt = make_record(None, None, Some(vec![]));
        assert_eq!(apply_format("hello", &fmt), "hello");
    }

    #[test]
    fn apply_format_combined_boundary_and_trivia() {
        // boundary: leading="[", trailing="]"; trivia: insert "+" at offset 1.
        // canonical "ab" → with trivia (offset 1 → "a+b") → with boundary "[a+b]"
        let fmt = make_record(Some("["), Some("]"), Some(vec![(1, "+")]));
        assert_eq!(apply_format("ab", &fmt), "[a+b]");
    }
}
