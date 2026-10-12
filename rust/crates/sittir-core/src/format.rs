//! The indentation unit a source steps by (`indent_unit`), and the engine's
//! format record applied to a render (`apply_format`).

use crate::types::{FormatRecord, FormatTrivia};

/// The indentation unit of `source`, from its indent steps.
///
/// A step is the leading whitespace a non-blank line adds on top of the
/// previous non-blank line's (when it extends it). The most frequent step is
/// the unit, so nesting depth never votes: a two-space file nested four deep
/// still steps by two spaces. `None` when the source never indents or when
/// two steps tie; otherwise the unit, whatever whitespace it is made of.
pub fn indent_unit(source: &str) -> Option<String> {
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
    Some(unit.to_string())
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
    sorted.sort_by_key(|item| std::cmp::Reverse(item.offset));

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

    #[test]
    fn the_unit_is_the_step_a_line_adds_whatever_whitespace_it_is() {
        assert_eq!(indent_unit("fn main() {\n\tprintln!(\"hello\");\n}\n").as_deref(), Some("\t"));
        assert_eq!(indent_unit("fn main() {\n  println!(\"hello\");\n}\n").as_deref(), Some("  "));
        assert_eq!(indent_unit("fn main() {\n    println!(\"hello\");\n    let x = 1;\n}\n").as_deref(), Some("    "));
        assert_eq!(indent_unit("fn a() {\n   b();\n   c();\n}\n").as_deref(), Some("   "));
    }

    #[test]
    fn nesting_depth_never_votes_for_a_wider_unit() {
        assert_eq!(indent_unit("fn a() {\n  if x {\n    b();\n    c();\n    d();\n  }\n}\n").as_deref(), Some("  "));
        assert_eq!(indent_unit("fn a() {\n    if x {\n        b();\n        c();\n    }\n}\n").as_deref(), Some("    "));
    }

    #[test]
    fn an_unindented_source_has_no_unit() {
        assert_eq!(indent_unit("fn a() {}\nfn b() {}\n"), None);
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
