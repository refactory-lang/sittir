//! Shared askama custom filters — `upper`, `lower`, `joinby`. These
//! mirror the TS `@sittir/core` Nunjucks filters registered in
//! `packages/core/src/templates/nunjucks-env.ts` (spec 011), so the
//! two engines produce byte-identical output on the render-parity
//! corpus (FR-002a / SC-001a).
//!
//! Spec 012 T012. Parity with the TS engine is tested in
//! `tests/filters.rs` (T013).
//!
//! Shape choice for `joinby`: TS ships four separate filters (`join`,
//! `joinWithTrailing`, `joinWithLeading`, `joinWithFlanks`) because
//! the flank decision is driven by tree-sitter-attached metadata
//! (`_leading_anon` / `_trailing_anon`) that only the TS reader can
//! see. On the Rust side the per-grammar render crate has already
//! surfaced those as typed bools on `TemplateContext` (`leading_sep`
//! / `trailing_sep`), so a single `joinby` filter with boolean
//! arguments covers every variant. Templates will call:
//!
//! ```jinja
//! {{ children_list | joinby(", ", leading_sep, trailing_sep) }}
//! ```
//!
//! …and the per-kind codegen wires the bool arguments through.

/// Uppercase. Mirrors TS `String.prototype.toUpperCase()`.
///
/// Returns `Result<_, askama::Error>` per askama filter convention so
/// filter failures propagate through `#[derive(Template)]` render
/// output without panicking.
pub fn upper(s: &str) -> Result<String, askama::Error> {
    Ok(s.to_uppercase())
}

/// Lowercase. Mirrors TS `String.prototype.toLowerCase()`.
pub fn lower(s: &str) -> Result<String, askama::Error> {
    Ok(s.to_lowercase())
}

/// Join a slice of pre-rendered child strings with a separator, with
/// optional leading + trailing separator flanks.
///
/// # Arguments
///
/// * `xs` — pre-rendered children (one string per position). Typically
///   comes from `TemplateContext.children_list`.
/// * `sep` — the separator. Grammar-registered per spec-011 joinby
///   metadata; surfaced on the template as a literal or through the
///   `GrammarMeta::separator_for` lookup.
/// * `leading` — whether to emit `sep` at the start. Set from
///   `TemplateContext.leading_sep` — true when the parser observed a
///   leading anonymous separator on this list position.
/// * `trailing` — whether to emit `sep` at the end. Set from
///   `TemplateContext.trailing_sep`.
///
/// # Behavior
///
/// - Empty `xs` + `leading = trailing = false` → empty string.
/// - Empty `xs` + any flank flag → the flank flags are suppressed
///   (nothing to flank). Matches TS behavior: flanks only apply when
///   there's content.
/// - Populated `xs` → `prefix + xs.join(sep) + suffix` where prefix /
///   suffix are each `sep` iff the corresponding flag is set.
pub fn joinby<S: AsRef<str>>(
    xs: &[S],
    sep: &str,
    leading: bool,
    trailing: bool,
) -> Result<String, askama::Error> {
    if xs.is_empty() {
        return Ok(String::new());
    }
    let prefix = if leading { sep } else { "" };
    let suffix = if trailing { sep } else { "" };
    let joined = xs
        .iter()
        .map(|s| s.as_ref())
        .collect::<Vec<_>>()
        .join(sep);
    Ok(format!("{prefix}{joined}{suffix}"))
}

/// Presence test — true when a field is absent / empty / whitespace-only.
///
/// Mirrors the TS `isBlank` nunjucks filter registered in
/// `packages/core/src/templates/nunjucks-env.ts`. Templates use
/// `{% if foo | isBlank %}` (or the negated `{% if foo | isPresent %}`)
/// to conditionally emit optional-field content with uniform semantics
/// across both render engines.
///
/// The TS engine accepts undefined/null/""/whitespace as blank. Askama
/// template context fields are `String`-typed (absent fields are
/// empty strings), so the test reduces to `trim().is_empty()`.
pub fn isBlank(s: &str) -> Result<bool, askama::Error> {
    Ok(s.trim().is_empty())
}

/// Inverse of `isBlank` — true when a field has non-whitespace content.
/// Sugar for `{% if not (foo | isBlank) %}`; used as
/// `{% if foo | isPresent %}`.
pub fn isPresent(s: &str) -> Result<bool, askama::Error> {
    Ok(!s.trim().is_empty())
}
