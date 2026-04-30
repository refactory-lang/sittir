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
//! see. On the Rust side the generated render crate already surfaces
//! typed boolean flank fields on each Askama struct, so a single
//! `joinby` filter with boolean arguments covers every variant.
//! Templates will call:
//!
//! ```jinja
//! {{ children_list | joinby(", ", leading_sep, trailing_sep) }}
//! ```
//!
//! …and the per-kind codegen wires the bool arguments through.

use std::fmt;

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

/// Closed renderable family. Per-grammar generated render crates extend this
/// via newtype wrappers; sittir-core itself only carries the grammar-agnostic
/// variants. Keep the family closed and explicit (no trait objects at the
/// public boundary).
#[derive(Debug, Clone, Copy)]
pub enum Renderable<'a> {
    /// Final, render-ready text.
    Text(&'a str),
    /// Streaming join over a borrowed slice of `Renderable`s.
    Joined(Joined<'a>),
}

impl std::fmt::Display for Renderable<'_> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Text(s) => f.write_str(s),
            Self::Joined(j) => std::fmt::Display::fmt(j, f),
        }
    }
}

impl ::askama::FastWritable for Renderable<'_> {
    fn write_into<W: std::fmt::Write + ?Sized>(
        &self,
        dest: &mut W,
        values: &dyn ::askama::Values,
    ) -> Result<(), ::askama::Error> {
        match self {
            Self::Text(s) => dest.write_str(s).map_err(::askama::Error::from),
            Self::Joined(j) => j.write_into(dest, values),
        }
    }
}

/// Streaming join wrapper. Borrows a slice of [`Renderable`]s and a separator,
/// and streams them into any [`fmt::Write`] target without allocating an
/// intermediate `String`. Returned (inside `askama::filters::Safe`) by
/// `joinby` and the `joinWith*` filter family.
#[derive(Debug, Clone, Copy)]
pub struct Joined<'a> {
    pub items: &'a [Renderable<'a>],
    pub separator: &'a str,
    pub leading: bool,
    pub trailing: bool,
}

impl<'a> Joined<'a> {
    pub fn new(
        items: &'a [Renderable<'a>],
        separator: &'a str,
        leading: bool,
        trailing: bool,
    ) -> Self {
        Self { items, separator, leading, trailing }
    }
}

impl std::fmt::Display for Joined<'_> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        if self.items.is_empty() {
            return Ok(());
        }
        if self.leading {
            f.write_str(self.separator)?;
        }
        let mut first = true;
        for item in self.items {
            if !first {
                f.write_str(self.separator)?;
            }
            std::fmt::Display::fmt(item, f)?;
            first = false;
        }
        if self.trailing {
            f.write_str(self.separator)?;
        }
        Ok(())
    }
}

impl ::askama::FastWritable for Joined<'_> {
    fn write_into<W: std::fmt::Write + ?Sized>(
        &self,
        dest: &mut W,
        values: &dyn ::askama::Values,
    ) -> Result<(), ::askama::Error> {
        if self.items.is_empty() {
            return Ok(());
        }
        if self.leading {
            dest.write_str(self.separator).map_err(::askama::Error::from)?;
        }
        let mut first = true;
        for item in self.items {
            if !first {
                dest.write_str(self.separator).map_err(::askama::Error::from)?;
            }
            item.write_into(dest, values)?;
            first = false;
        }
        if self.trailing {
            dest.write_str(self.separator).map_err(::askama::Error::from)?;
        }
        Ok(())
    }
}

#[derive(Debug, Clone, Copy)]
pub struct ListView<'a> {
    pub items: &'a [Renderable<'a>],
    pub separator: &'a str,
    pub leading: bool,
    pub trailing: bool,
}

impl<'a> ListView<'a> {
    pub fn is_empty(&self) -> bool {
        self.items.is_empty()
    }

    pub fn as_joined(&self) -> Joined<'a> {
        Joined {
            items: self.items,
            separator: self.separator,
            leading: self.leading,
            trailing: self.trailing,
        }
    }
}

impl fmt::Display for ListView<'_> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        fmt::Display::fmt(&self.as_joined(), f)
    }
}

impl ::askama::FastWritable for ListView<'_> {
    fn write_into<W: std::fmt::Write + ?Sized>(
        &self,
        dest: &mut W,
        values: &dyn ::askama::Values,
    ) -> Result<(), ::askama::Error> {
        self.as_joined().write_into(dest, values)
    }
}

pub struct ListViewIter<'a> {
    inner: std::slice::Iter<'a, Renderable<'a>>,
}

impl<'a> Iterator for ListViewIter<'a> {
    type Item = &'a Renderable<'a>;
    fn next(&mut self) -> Option<Self::Item> {
        self.inner.next()
    }
}

impl<'a> IntoIterator for &'a ListView<'a> {
    type Item = &'a Renderable<'a>;
    type IntoIter = ListViewIter<'a>;
    fn into_iter(self) -> Self::IntoIter {
        ListViewIter { inner: self.items.iter() }
    }
}

#[derive(Debug, Clone, Copy)]
pub enum FieldView<'a> {
    Missing,
    One(Renderable<'a>),
    Many(ListView<'a>),
}

impl fmt::Display for FieldView<'_> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Missing => Ok(()),
            Self::One(r) => fmt::Display::fmt(r, f),
            Self::Many(view) => fmt::Display::fmt(view, f),
        }
    }
}

impl ::askama::FastWritable for FieldView<'_> {
    fn write_into<W: std::fmt::Write + ?Sized>(
        &self,
        dest: &mut W,
        values: &dyn ::askama::Values,
    ) -> Result<(), ::askama::Error> {
        match self {
            Self::Missing => Ok(()),
            Self::One(r) => r.write_into(dest, values),
            Self::Many(v) => v.write_into(dest, values),
        }
    }
}

pub trait JoinSource {
    fn len(&self) -> usize;
    fn item(&self, index: usize) -> &str;

    fn leading_sep_for(&self, _sep: &str) -> bool {
        false
    }

    fn trailing_sep_for(&self, _sep: &str) -> bool {
        false
    }
}

impl<S: AsRef<str>> JoinSource for [S] {
    fn len(&self) -> usize {
        <[S]>::len(self)
    }

    fn item(&self, index: usize) -> &str {
        self[index].as_ref()
    }
}

impl<S: AsRef<str>> JoinSource for Vec<S> {
    fn len(&self) -> usize {
        self.as_slice().len()
    }

    fn item(&self, index: usize) -> &str {
        self.as_slice()[index].as_ref()
    }
}

impl<S: AsRef<str>, const N: usize> JoinSource for [S; N] {
    fn len(&self) -> usize {
        self.as_slice().len()
    }

    fn item(&self, index: usize) -> &str {
        self.as_slice()[index].as_ref()
    }
}

// TEMPORARY — Task 3 replaces JoinSource wholesale with a Renderable-based
// trait; these stubs exist only to make Task 2 compile. Delete in Task 3.
impl JoinSource for ListView<'_> {
    fn len(&self) -> usize {
        self.items.len()
    }

    fn item(&self, _index: usize) -> &str {
        unimplemented!("removed in Task 3 — JoinSource::item not valid on Renderable-backed ListView")
    }

    fn leading_sep_for(&self, sep: &str) -> bool {
        self.separator == sep && self.leading
    }

    fn trailing_sep_for(&self, sep: &str) -> bool {
        self.separator == sep && self.trailing
    }
}

// TEMPORARY — Task 3 replaces JoinSource wholesale with a Renderable-based
// trait; these stubs exist only to make Task 2 compile. Delete in Task 3.
impl JoinSource for FieldView<'_> {
    fn len(&self) -> usize {
        match self {
            Self::Missing => 0,
            Self::One(_) => 1,
            Self::Many(view) => view.len(),
        }
    }

    fn item(&self, _index: usize) -> &str {
        unimplemented!("removed in Task 3 — JoinSource::item not valid on Renderable-backed FieldView")
    }

    fn leading_sep_for(&self, sep: &str) -> bool {
        matches!(self, Self::Many(view) if view.leading_sep_for(sep))
    }

    fn trailing_sep_for(&self, sep: &str) -> bool {
        matches!(self, Self::Many(view) if view.trailing_sep_for(sep))
    }
}

/// Join a pre-rendered sequence with a separator, with optional leading +
/// trailing separator flanks.
pub fn joinby<T: JoinSource + ?Sized>(
    xs: &T,
    sep: &str,
    leading: bool,
    trailing: bool,
) -> Result<String, askama::Error> {
    if xs.len() == 0 {
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
fn join_with_line_comment_fix<T: JoinSource + ?Sized>(xs: &T, sep: &str) -> String {
    if xs.len() == 0 {
        return String::new();
    }
    if xs.len() == 1 {
        return xs.item(0).to_string();
    }
    let mut out = String::new();
    for i in 0..xs.len() {
        let s = xs.item(i);
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

/// Minimal askama values bridge for flank-aware filters.
///
/// The direct-render path no longer builds a shared `TemplateContext`,
/// but `joinWithTrailing` / `joinWithLeading` / `joinWithFlanks` still
/// need a `Values` bag to read the optional anonymous flank tokens.
/// Generated render crates pass Askama's internal values object during
/// normal rendering; tests can construct this helper directly.
#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub struct FlankValues {
    pub leading_anon: Option<String>,
    pub trailing_anon: Option<String>,
}

impl askama::Values for FlankValues {
    fn get_value<'a>(&'a self, key: &str) -> Option<&'a dyn std::any::Any> {
        match key {
            "trailing_anon" => Some(&self.trailing_anon),
            "leading_anon" => Some(&self.leading_anon),
            _ => None,
        }
    }
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
pub trait PresenceCheck {
    fn is_present_check(&self) -> bool;
}

impl PresenceCheck for str {
    fn is_present_check(&self) -> bool {
        !self.trim().is_empty()
    }
}

impl PresenceCheck for &str {
    fn is_present_check(&self) -> bool {
        !self.trim().is_empty()
    }
}

impl PresenceCheck for String {
    fn is_present_check(&self) -> bool {
        !self.trim().is_empty()
    }
}

impl PresenceCheck for &String {
    fn is_present_check(&self) -> bool {
        !self.trim().is_empty()
    }
}

impl PresenceCheck for ListView<'_> {
    fn is_present_check(&self) -> bool {
        !self.items.is_empty()
    }
}

impl PresenceCheck for FieldView<'_> {
    fn is_present_check(&self) -> bool {
        match self {
            Self::Missing => false,
            Self::One(_) => true,
            Self::Many(view) => view.is_present_check(),
        }
    }
}

impl<S> PresenceCheck for Vec<S> {
    fn is_present_check(&self) -> bool {
        !self.is_empty()
    }
}

impl<S> PresenceCheck for [S] {
    fn is_present_check(&self) -> bool {
        !self.is_empty()
    }
}

impl<S> PresenceCheck for &[S] {
    fn is_present_check(&self) -> bool {
        !self.is_empty()
    }
}

impl<T: PresenceCheck> PresenceCheck for Option<T> {
    fn is_present_check(&self) -> bool {
        self.as_ref().is_some_and(PresenceCheck::is_present_check)
    }
}

/// Presence test's inverse — blank means "not present".
#[askama::filter_fn]
#[allow(non_snake_case, private_bounds)]
pub fn isBlank<T: PresenceCheck + ?Sized>(
    s: &T,
    _values: &dyn askama::Values,
) -> Result<bool, askama::Error> {
    Ok(!s.is_present_check())
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
#[askama::filter_fn]
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
/// `key` is `"trailing_anon"` or `"leading_anon"`. Generated render
/// crates surface those names through Askama's `Values` bag; this
/// helper does the downcast + match in one place so the per-filter
/// wrappers stay one-liners.
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
/// token whose text matches `sep`. Source: the generated render
/// crate's Askama values bag under key `"trailing_anon"`.
///
/// On a context with no flank metadata the filter degrades to plain
/// `join` — matches TS engine behavior when the children array has no
/// `_trailing_anon` property.
#[askama::filter_fn]
#[allow(non_snake_case)]
pub fn joinWithTrailing<T: JoinSource + ?Sized>(
    xs: &T,
    values: &dyn askama::Values,
    sep: &str,
) -> Result<String, askama::Error> {
    let trailing = xs.trailing_sep_for(sep) || flank_match(values, "trailing_anon", sep);
    joinby(xs, sep, false, trailing)
}

/// Askama filter — `{{ children | joinWithLeading(",") }}`. Symmetric to
/// `joinWithTrailing`: emits a leading `sep` iff the children list
/// captured a leading anonymous token whose text matches `sep`.
#[askama::filter_fn]
#[allow(non_snake_case)]
pub fn joinWithLeading<T: JoinSource + ?Sized>(
    xs: &T,
    values: &dyn askama::Values,
    sep: &str,
) -> Result<String, askama::Error> {
    let leading = xs.leading_sep_for(sep) || flank_match(values, "leading_anon", sep);
    joinby(xs, sep, leading, false)
}

/// Askama filter — `{{ children | joinWithFlanks(",") }}`. Both
/// directions; emits each flank independently iff its captured anon
/// text matches `sep`.
#[askama::filter_fn]
#[allow(non_snake_case)]
pub fn joinWithFlanks<T: JoinSource + ?Sized>(
    xs: &T,
    values: &dyn askama::Values,
    sep: &str,
) -> Result<String, askama::Error> {
    let leading = xs.leading_sep_for(sep) || flank_match(values, "leading_anon", sep);
    let trailing = xs.trailing_sep_for(sep) || flank_match(values, "trailing_anon", sep);
    joinby(xs, sep, leading, trailing)
}
