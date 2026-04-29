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
    let joined = join_with_line_comment_fix(xs, sep);
    Ok(format!("{prefix}{joined}{suffix}"))
}

/// Detect whether a rendered child ends with a `//` or `#` line-terminated
/// comment. Mirrors the TS `endsLineComment` helper in
/// `packages/core/src/templates/nunjucks-env.ts` — used by the join helpers
/// to force a `\n` separator after a line-comment-ending child so the
/// following sibling doesn't get folded into the comment at reparse time.
fn ends_line_comment(s: &str) -> bool {
    let trimmed = s.trim_end_matches([' ', '\t']);
    if trimmed.ends_with('\n') {
        return false;
    }
    // Find the start of the last line (everything after the final `\n`).
    let last_line_start = trimmed.rfind('\n').map_or(0, |i| i + 1);
    let last_line = &trimmed[last_line_start..];
    let stripped = last_line.trim_start();
    stripped.starts_with("//") || stripped.starts_with('#')
}

/// Join `xs` with `sep`, but force `\n` instead of `sep` after any element
/// that ends with a line-terminated comment (`//` or `#`). Joining with
/// ` ` would otherwise fold the next sibling into the comment at reparse
/// time. Cluster J (016): mirrors the TS Nunjucks `join` filter so the
/// two engines stay byte-identical on fixtures containing `// comment`
/// followed by a statement (e.g. rust block round-trip).
fn join_with_line_comment_fix<S: AsRef<str>>(xs: &[S], sep: &str) -> String {
    if xs.is_empty() {
        return String::new();
    }
    if xs.len() == 1 {
        return xs[0].as_ref().to_string();
    }
    let mut out = String::new();
    for (i, item) in xs.iter().enumerate() {
        let s = item.as_ref();
        out.push_str(s);
        if i + 1 < xs.len() {
            if ends_line_comment(s) {
                out.push('\n');
            } else {
                out.push_str(sep);
            }
        }
    }
    out
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
#[allow(non_snake_case)]
pub fn isBlank(s: &str, _values: &dyn askama::Values) -> Result<bool, askama::Error> {
    Ok(s.trim().is_empty())
}

/// Private trait powering the generic `isPresent` filter.
///
/// Two implementations exist:
/// - `str` / `String` — non-whitespace text is "present".
/// - `Vec<S>` — a non-empty list is "present".
///
/// The `Vec` case arises when generated template structs expose the
/// `children` slot as `Vec<String>` and the `.jinja` template uses
/// `children | isPresent` to gate rendering (e.g. `jsx_expression`,
/// `named_imports`, `object`, `switch_body`, and their equivalents in
/// the python and rust grammars). The TS/Nunjucks engine treats any
/// non-empty array as present; this trait mirrors that semantic on the
/// Rust/askama side.
pub(crate) trait PresenceCheck {
    fn is_present_check(&self) -> bool;
}

impl PresenceCheck for str {
    fn is_present_check(&self) -> bool {
        !self.trim().is_empty()
    }
}

impl PresenceCheck for String {
    fn is_present_check(&self) -> bool {
        !self.trim().is_empty()
    }
}

impl<S> PresenceCheck for Vec<S> {
    fn is_present_check(&self) -> bool {
        !self.is_empty()
    }
}

/// Inverse of `isBlank` — true when a field has non-whitespace content
/// (for scalar fields) or is non-empty (for list fields).
///
/// Used as `{% if foo | isPresent %}` in Jinja templates. Works for:
/// - `String` / `str` fields — non-blank string is present.
/// - `Vec<String>` fields — non-empty list is present (e.g. the
///   `children` slot on nodes like `jsx_expression`, `named_imports`,
///   `object`, `switch_body`, `class_body` in generated template
///   structs for the typescript, python, and rust grammars).
///
/// Matches the TS engine's semantics where an empty string and an
/// empty array both render as "not present".
#[allow(non_snake_case, private_bounds)]
pub fn isPresent<T: PresenceCheck + ?Sized>(
    s: &T,
    _values: &dyn askama::Values,
) -> Result<bool, askama::Error> {
    Ok(s.is_present_check())
}

/// Probe `values` for a flank-anon text registered under `key`. Returns
/// the captured text iff it matches `sep` (the join filter's separator
/// argument), so the filter can emit `sep` at the flank position.
///
/// Mirrors the TS Nunjucks `flankJoin` semantics: the filter only emits
/// a flank when the parser observed an anonymous token there AND that
/// token's text equals the separator the template asked for. A `,`-anon
/// flanking a `;`-joined list contributes nothing — the separator
/// argument is the source of truth for what to emit.
///
/// `key` is `"trailing_anon"` or `"leading_anon"`. Codegen passes the
/// `Option<String>` from `TemplateContext` into `render_with_values`
/// under those keys; this helper does the downcast + match in one
/// place so the per-filter wrappers stay one-liners.
fn flank_match(values: &dyn askama::Values, key: &str, sep: &str) -> bool {
    match values.get_value(key) {
        Some(any) => {
            if let Some(opt) = any.downcast_ref::<Option<String>>() {
                return opt.as_deref() == Some(sep);
            }
            if let Some(s) = any.downcast_ref::<String>() {
                return s.as_str() == sep;
            }
            if let Some(s) = any.downcast_ref::<&str>() {
                return *s == sep;
            }
            false
        }
        None => false,
    }
}

/// Askama filter — `{{ children | joinWithTrailing(",") }}`. Emits a
/// trailing `sep` iff the children list captured a trailing anonymous
/// token whose text matches `sep`. Source: `TemplateContext.trailing_anon`,
/// passed through `render_with_values` under key `"trailing_anon"` by
/// the generated `render_dispatch`.
///
/// On a context with no flank metadata (`render()` instead of
/// `render_with_values()`, or values bag missing the key) the filter
/// degrades to plain `join` — matches TS engine behavior when the
/// children array has no `_trailing_anon` property.
#[allow(non_snake_case)]
pub fn joinWithTrailing<S: AsRef<str>>(
    xs: &[S],
    values: &dyn askama::Values,
    sep: &str,
) -> Result<String, askama::Error> {
    let trailing = flank_match(values, "trailing_anon", sep);
    joinby(xs, sep, false, trailing)
}

/// Askama filter — `{{ children | joinWithLeading(",") }}`. Symmetric to
/// `joinWithTrailing`: emits a leading `sep` iff the children list
/// captured a leading anonymous token whose text matches `sep`.
#[allow(non_snake_case)]
pub fn joinWithLeading<S: AsRef<str>>(
    xs: &[S],
    values: &dyn askama::Values,
    sep: &str,
) -> Result<String, askama::Error> {
    let leading = flank_match(values, "leading_anon", sep);
    joinby(xs, sep, leading, false)
}

/// Askama filter — `{{ children | joinWithFlanks(",") }}`. Both
/// directions; emits each flank independently iff its captured anon
/// text matches `sep`.
#[allow(non_snake_case)]
pub fn joinWithFlanks<S: AsRef<str>>(
    xs: &[S],
    values: &dyn askama::Values,
    sep: &str,
) -> Result<String, askama::Error> {
    let leading = flank_match(values, "leading_anon", sep);
    let trailing = flank_match(values, "trailing_anon", sep);
    joinby(xs, sep, leading, trailing)
}
