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
pub struct ListNonterminalView<'a> {
    pub items: &'a [Renderable<'a>],
    pub separator: &'a str,
    pub leading: bool,
    pub trailing: bool,
}

impl<'a> ListNonterminalView<'a> {
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

impl fmt::Display for ListNonterminalView<'_> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        fmt::Display::fmt(&self.as_joined(), f)
    }
}

impl ::askama::FastWritable for ListNonterminalView<'_> {
    fn write_into<W: std::fmt::Write + ?Sized>(
        &self,
        dest: &mut W,
        values: &dyn ::askama::Values,
    ) -> Result<(), ::askama::Error> {
        self.as_joined().write_into(dest, values)
    }
}

pub struct ListNonterminalViewIter<'a> {
    inner: std::slice::Iter<'a, Renderable<'a>>,
}

impl<'a> Iterator for ListNonterminalViewIter<'a> {
    type Item = &'a Renderable<'a>;
    fn next(&mut self) -> Option<Self::Item> {
        self.inner.next()
    }
}

impl<'a> IntoIterator for &'a ListNonterminalView<'a> {
    type Item = &'a Renderable<'a>;
    type IntoIter = ListNonterminalViewIter<'a>;
    fn into_iter(self) -> Self::IntoIter {
        ListNonterminalViewIter { inner: self.items.iter() }
    }
}

#[derive(Debug, Clone, Copy)]
pub enum NonterminalView<'a> {
    Missing,
    One(Renderable<'a>),
    Many(ListNonterminalView<'a>),
}

impl fmt::Display for NonterminalView<'_> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Missing => Ok(()),
            Self::One(r) => fmt::Display::fmt(r, f),
            Self::Many(view) => fmt::Display::fmt(view, f),
        }
    }
}

impl ::askama::FastWritable for NonterminalView<'_> {
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

/// Iterator over the `Renderable`s a `NonterminalView` exposes. `Missing` yields
/// none, `One(r)` yields a single reference, `Many(view)` defers to the
/// `ListNonterminalView` iterator.
pub enum NonterminalViewIter<'a> {
    Missing,
    One(std::option::IntoIter<&'a Renderable<'a>>),
    Many(ListNonterminalViewIter<'a>),
}

impl<'a> Iterator for NonterminalViewIter<'a> {
    type Item = &'a Renderable<'a>;
    fn next(&mut self) -> Option<Self::Item> {
        match self {
            Self::Missing => None,
            Self::One(inner) => inner.next(),
            Self::Many(inner) => inner.next(),
        }
    }
}

impl<'a> IntoIterator for &'a NonterminalView<'a> {
    type Item = &'a Renderable<'a>;
    type IntoIter = NonterminalViewIter<'a>;
    fn into_iter(self) -> Self::IntoIter {
        match self {
            NonterminalView::Missing => NonterminalViewIter::Missing,
            NonterminalView::One(r) => NonterminalViewIter::One(Some(r).into_iter()),
            NonterminalView::Many(view) => NonterminalViewIter::Many(view.into_iter()),
        }
    }
}

/// Trait for types that can supply a slice of [`Renderable`]s for joining.
///
/// Replaces the string-based `JoinSource` from Task 2 scaffolding.
/// `ListNonterminalView` and `NonterminalView` are the primary implementors; the old
/// string-slice impls (`[S]`, `Vec<S>`, `[S; N]`) are removed because
/// the join filters now operate exclusively on `Renderable`-backed views.
pub trait JoinSource<'a> {
    fn renderables(&self) -> &'a [Renderable<'a>];
    fn separator(&self) -> &'a str;
    fn leading(&self) -> bool {
        false
    }
    fn trailing(&self) -> bool {
        false
    }
}

impl<'a> JoinSource<'a> for ListNonterminalView<'a> {
    fn renderables(&self) -> &'a [Renderable<'a>] {
        self.items
    }
    fn separator(&self) -> &'a str {
        self.separator
    }
    fn leading(&self) -> bool {
        self.leading
    }
    fn trailing(&self) -> bool {
        self.trailing
    }
}

impl<'a> JoinSource<'a> for NonterminalView<'a> {
    fn renderables(&self) -> &'a [Renderable<'a>] {
        match self {
            Self::Missing | Self::One(_) => &[],
            Self::Many(view) => view.items,
        }
    }
    fn separator(&self) -> &'a str {
        match self {
            Self::Many(view) => view.separator,
            _ => "",
        }
    }
    fn leading(&self) -> bool {
        matches!(self, Self::Many(v) if v.leading)
    }
    fn trailing(&self) -> bool {
        matches!(self, Self::Many(v) if v.trailing)
    }
}

/// Join a `Renderable`-backed sequence with a separator, with optional
/// leading + trailing separator flanks.
///
/// Returns `Safe<Joined<'a>>` so Askama can stream the result into its
/// output buffer without an intermediate `String` allocation. The
/// `join_with_line_comment_fix` and `ends_line_comment` helpers from the
/// string-backed era are removed here; Task 4's `from_transport` bridge
/// must surface line-comment-ending leaves with their trailing `\n`
/// already inside `Renderable::Text(...)` so the separator is never
/// emitted after them.
pub fn joinby<'a, T: JoinSource<'a> + ?Sized>(
    xs: &'a T,
    sep: &'a str,
    leading: bool,
    trailing: bool,
) -> Result<askama::filters::Safe<Joined<'a>>, askama::Error> {
    Ok(askama::filters::Safe(Joined {
        items: xs.renderables(),
        separator: sep,
        leading,
        trailing,
    }))
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

impl PresenceCheck for ListNonterminalView<'_> {
    fn is_present_check(&self) -> bool {
        !self.items.is_empty()
    }
}

impl PresenceCheck for NonterminalView<'_> {
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

/// Plain Rust implementation for `joinWithTrailing` — callable from both
/// Rust tests and via the per-grammar `#[askama::filter_fn]` wrapper in
/// generated render crates.
///
/// Emits a trailing `sep` iff the children list captured a trailing anonymous
/// token whose text matches `sep`. Source: the generated render crate's
/// Askama values bag under key `"trailing_anon"`.
///
/// On a context with no flank metadata the filter degrades to plain
/// `join` — matches TS engine behavior when the children array has no
/// `_trailing_anon` property.
#[allow(non_snake_case)]
pub fn joinWithTrailing<'a, T: JoinSource<'a> + ?Sized>(
    xs: &'a T,
    values: &dyn askama::Values,
    sep: &'a str,
) -> Result<askama::filters::Safe<Joined<'a>>, askama::Error> {
    let trailing = xs.trailing() || flank_match(values, "trailing_anon", sep);
    joinby(xs, sep, false, trailing)
}

/// Plain Rust implementation for `joinWithLeading`. Symmetric to
/// `joinWithTrailing`: emits a leading `sep` iff the children list
/// captured a leading anonymous token whose text matches `sep`.
#[allow(non_snake_case)]
pub fn joinWithLeading<'a, T: JoinSource<'a> + ?Sized>(
    xs: &'a T,
    values: &dyn askama::Values,
    sep: &'a str,
) -> Result<askama::filters::Safe<Joined<'a>>, askama::Error> {
    let leading = xs.leading() || flank_match(values, "leading_anon", sep);
    joinby(xs, sep, leading, false)
}

/// Plain Rust implementation for `joinWithFlanks`. Both directions;
/// emits each flank independently iff its captured anon text matches `sep`.
#[allow(non_snake_case)]
pub fn joinWithFlanks<'a, T: JoinSource<'a> + ?Sized>(
    xs: &'a T,
    values: &dyn askama::Values,
    sep: &'a str,
) -> Result<askama::filters::Safe<Joined<'a>>, askama::Error> {
    let leading = xs.leading() || flank_match(values, "leading_anon", sep);
    let trailing = xs.trailing() || flank_match(values, "trailing_anon", sep);
    joinby(xs, sep, leading, trailing)
}
