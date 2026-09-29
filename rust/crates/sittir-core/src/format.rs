//! Format extractor — `extract_format` produces a consensus `FormatRecord`
//! from a source string and its tree-sitter parse tree.
//!
//! This is a single-pass extractor: one tree walk produces all style samples;
//! the samples are reduced to consensus values; `None` is returned when the
//! source is already template-canonical.

use crate::types::{FormatBoundary, FormatRecord, FormatTrivia};

/// Walk `tree` over `source` and return a consensus `FormatRecord`, or
/// `None` when the source is already template-canonical (its dominant
/// indentation is `canonical_indent`, or there is none).
///
/// Determinism guarantee: identical `source` + identical grammar version →
/// identical result.
pub fn extract_format(
    source: &str,
    tree: &tree_sitter::Tree,
    canonical_indent: &str,
) -> Option<FormatRecord> {
    // Touch the root node so the tree parameter is exercised.  Phase 2 will
    // use the cursor to collect per-kind separator and trivia samples.
    let _root = tree.root_node();

    let indent = detect_indent(source, canonical_indent)?;

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

/// Infer `source`'s indentation unit from its indent steps and compare it
/// with `canonical_indent`, the grammar's declared unit.
///
/// A step is the leading whitespace a non-blank line adds on top of the
/// previous non-blank line's (when it extends it). The most frequent step is
/// the unit, so nesting depth never votes: a two-space file nested four deep
/// still steps by two spaces. Returns `None` when the unit is the declared
/// one, when the source never indents, or when two steps tie; otherwise the
/// inferred unit, whatever whitespace it is made of.
fn detect_indent(source: &str, canonical_indent: &str) -> Option<String> {
    let mut steps: Vec<(&str, usize)> = Vec::new();
    let mut previous = "";
    for line in source.lines() {
        let body = line.trim_start_matches([' ', '\t']);
        if body.is_empty() {
            continue;
        }
        let leading = &line[..line.len() - body.len()];
        if leading.len() > previous.len() && leading.starts_with(previous) {
            let step = &leading[previous.len()..];
            match steps.iter_mut().find(|(s, _)| *s == step) {
                Some((_, count)) => *count += 1,
                None => steps.push((step, 1)),
            }
        }
        previous = leading;
    }
    let top = steps.iter().map(|(_, count)| *count).max()?;
    let mut leaders = steps.iter().filter(|(_, count)| *count == top);
    let (unit, _) = leaders.next()?;
    if leaders.next().is_some() {
        return None;
    }
    (*unit != canonical_indent).then(|| unit.to_string())
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

        let result = extract_format(source, &tree, "  ");
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

        let result = extract_format(source, &tree, "  ");
        assert!(
            result.is_none(),
            "2-space indent source should return None (already canonical)"
        );
    }

    #[test]
    fn extract_format_four_space_returns_some() {
        let source = "fn main() {\n    println!(\"hello\");\n    let x = 1;\n}\n";
        let tree = parse_rust(source);

        let result = extract_format(source, &tree, "  ");
        assert!(
            result.is_some(),
            "4-space indent source should return Some(FormatRecord)"
        );
        let record = result.unwrap();
        let boundary = record.boundary.unwrap();
        assert_eq!(boundary.leading, Some("    ".to_string()));
    }

    #[test]
    fn extract_format_declared_unit_is_canonical() {
        let source = "fn main() {\n    println!(\"hello\");\n    let x = 1;\n}\n";
        let tree = parse_rust(source);

        assert!(extract_format(source, &tree, "    ").is_none());
    }

    #[test]
    fn nesting_depth_never_votes_for_a_wider_unit() {
        let source = "fn a() {\n  if x {\n    b();\n    c();\n    d();\n  }\n}\n";
        let tree = parse_rust(source);

        assert!(extract_format(source, &tree, "  ").is_none());
        let record = extract_format(source, &tree, "    ").expect("a two-space source under a four-space unit");
        assert_eq!(record.boundary.unwrap().leading, Some("  ".to_string()));
    }

    #[test]
    fn a_nested_four_space_source_is_canonical_under_a_four_space_unit() {
        let source = "fn a() {\n    if x {\n        b();\n        c();\n    }\n}\n";
        let tree = parse_rust(source);

        assert!(extract_format(source, &tree, "    ").is_none());
    }

    #[test]
    fn any_declared_unit_is_recognised() {
        let source = "fn a() {\n   b();\n   c();\n}\n";
        let tree = parse_rust(source);

        assert!(extract_format(source, &tree, "   ").is_none());
        let record = extract_format(source, &tree, "  ").expect("a three-space source under a two-space unit");
        assert_eq!(record.boundary.unwrap().leading, Some("   ".to_string()));
    }

    #[test]
    fn an_unindented_source_is_canonical() {
        let source = "fn a() {}\nfn b() {}\n";
        let tree = parse_rust(source);

        assert!(extract_format(source, &tree, "  ").is_none());
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
