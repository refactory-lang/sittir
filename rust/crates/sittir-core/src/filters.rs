//! The render-time views and the presence check the generated bodies
//! gate on. `Joined` is the one writer for every list slot:
//! it composes the separator from three parts — the whitespace before the
//! token, the token, the whitespace after — and owns the flank rule, so a
//! leading flank never carries a preceding space and a trailing flank never
//! a following one. Templates never name a separator; the view carries it.

use std::fmt;

/// Closed renderable family. Per-grammar generated render crates extend this
/// via newtype wrappers; sittir-core itself only carries the grammar-agnostic
/// variants. Keep the family closed and explicit (no trait objects at the
/// public boundary).
#[derive(Clone, Copy)]
pub enum Renderable<'a> {
    /// Final, render-ready text.
    Text(&'a str),
    /// Streaming join over a borrowed slice of `Renderable`s.
    Joined(Joined<'a>),
    /// Heterogeneous slot value — streams via `RenderableTransport::render_into`
    /// without an intermediate `String` allocation.
    Transport(&'a dyn crate::types::RenderableTransport),
}

impl std::fmt::Debug for Renderable<'_> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Text(s) => f.debug_tuple("Text").field(s).finish(),
            Self::Joined(j) => f.debug_tuple("Joined").field(j).finish(),
            Self::Transport(_) => f
                .debug_tuple("Transport")
                .field(&"<dyn RenderableTransport>")
                .finish(),
        }
    }
}

impl std::fmt::Display for Renderable<'_> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Text(s) => f.write_str(s),
            Self::Joined(j) => std::fmt::Display::fmt(j, f),
            Self::Transport(t) => t.render_into(f).map_err(|_| std::fmt::Error),
        }
    }
}

impl Renderable<'_> {
    /// Stream this renderable into `dest`: text as one write, a join
    /// through [`Joined::render_into`], a transport through its own
    /// `RenderableTransport::render_into`.
    pub fn render_into(&self, dest: &mut dyn std::fmt::Write) -> std::fmt::Result {
        match self {
            Self::Text(s) => dest.write_str(s),
            Self::Joined(j) => j.render_into(dest),
            Self::Transport(t) => t.render_into(dest),
        }
    }
}

/// Streaming join wrapper. Borrows a slice of [`Renderable`]s and the three
/// separator parts, and streams them into any [`fmt::Write`] target without
/// allocating an intermediate `String`.
#[derive(Debug, Clone, Copy)]
pub struct Joined<'a> {
    pub items: &'a [Renderable<'a>],
    /// Whitespace written before the separator token.
    pub before: &'a str,
    /// The separator token itself; empty for an unseparated repeat.
    pub token: &'a str,
    /// Whitespace written after the separator token.
    pub after: &'a str,
    pub leading: bool,
    pub trailing: bool,
    /// Whitespace written before the first item and after the last, only
    /// when there are items: an array's flanks.
    pub head: &'a str,
    pub tail: &'a str,
}

impl<'a> Joined<'a> {
    pub fn new(
        items: &'a [Renderable<'a>],
        before: &'a str,
        token: &'a str,
        after: &'a str,
        leading: bool,
        trailing: bool,
    ) -> Self {
        Self {
            items,
            before,
            token,
            after,
            leading,
            trailing,
            head: "",
            tail: "",
        }
    }

    /// One writer for both output paths. Between items every part is
    /// written; a leading flank writes the token and what follows it, a
    /// trailing flank what precedes it and the token, so the list's outer
    /// edges never carry whitespace the surrounding template did not ask for.
    fn write_parts<W: ?Sized, E>(
        &self,
        dest: &mut W,
        mut write: impl FnMut(&mut W, &str) -> Result<(), E>,
        mut item: impl FnMut(&mut W, &Renderable<'a>) -> Result<(), E>,
    ) -> Result<(), E> {
        if self.items.is_empty() {
            return Ok(());
        }
        write(dest, self.head)?;
        if self.leading {
            write(dest, self.token)?;
            write(dest, self.after)?;
        }
        for (i, it) in self.items.iter().enumerate() {
            if i > 0 {
                write(dest, self.before)?;
                write(dest, self.token)?;
                write(dest, self.after)?;
            }
            item(dest, it)?;
        }
        if self.trailing {
            write(dest, self.before)?;
            write(dest, self.token)?;
        }
        write(dest, self.tail)?;
        Ok(())
    }
}

impl<'a> Joined<'a> {
    /// Stream the items and their separators into `dest`.
    pub fn render_into(&self, dest: &mut dyn std::fmt::Write) -> std::fmt::Result {
        self.write_parts(dest, |d, s| d.write_str(s), |d, it| it.render_into(d))
    }
}

impl std::fmt::Display for Joined<'_> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        self.write_parts(f, |f, s| f.write_str(s), |f, it| std::fmt::Display::fmt(it, f))
    }
}

#[derive(Debug, Clone, Copy)]
pub struct ListNonterminalView<'a> {
    pub items: &'a [Renderable<'a>],
    pub before: &'a str,
    pub token: &'a str,
    pub after: &'a str,
    pub leading: bool,
    pub trailing: bool,
    pub head: &'a str,
    pub tail: &'a str,
}

impl<'a> ListNonterminalView<'a> {
    pub fn is_empty(&self) -> bool {
        self.items.is_empty()
    }

    pub fn as_joined(&self) -> Joined<'a> {
        Joined {
            items: self.items,
            before: self.before,
            token: self.token,
            after: self.after,
            leading: self.leading,
            trailing: self.trailing,
            head: self.head,
            tail: self.tail,
        }
    }
}

impl fmt::Display for ListNonterminalView<'_> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        fmt::Display::fmt(&self.as_joined(), f)
    }
}

impl ListNonterminalView<'_> {
    /// Stream the list into `dest` through its join.
    pub fn render_into(&self, dest: &mut dyn std::fmt::Write) -> std::fmt::Result {
        self.as_joined().render_into(dest)
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
        ListNonterminalViewIter {
            inner: self.items.iter(),
        }
    }
}

/// Required-cardinality nonterminal slot — always one occurrence.
/// Generated when the codegen knows at emission time that the slot is
/// non-optional and non-list (e.g. a tree-sitter `field('name', $.x)`
/// where the rule shape forbids absence and repetition).
#[derive(Debug, Clone, Copy)]
pub struct SingleNonterminalView<'a>(pub Renderable<'a>);

impl<'a> SingleNonterminalView<'a> {
    pub fn new(r: Renderable<'a>) -> Self {
        Self(r)
    }
}

impl fmt::Display for SingleNonterminalView<'_> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        fmt::Display::fmt(&self.0, f)
    }
}

impl SingleNonterminalView<'_> {
    /// Stream the slot's renderable into `dest`.
    pub fn render_into(&self, dest: &mut dyn std::fmt::Write) -> std::fmt::Result {
        self.0.render_into(dest)
    }
}

impl<'a> IntoIterator for &'a SingleNonterminalView<'a> {
    type Item = &'a Renderable<'a>;
    type IntoIter = std::option::IntoIter<&'a Renderable<'a>>;
    fn into_iter(self) -> Self::IntoIter {
        Some(&self.0).into_iter()
    }
}

/// Optional-cardinality nonterminal slot — zero or one occurrence.
/// Generated when the codegen knows at emission time that the slot is
/// optional and non-list. `Present` carries a renderable; `Missing`
/// emits nothing under Display / render_into, distinguishing it from
/// `Present(Renderable::Text(""))`.
#[derive(Debug, Clone, Copy)]
pub enum OptionalNonterminalView<'a> {
    Missing,
    Present(Renderable<'a>),
}

impl fmt::Display for OptionalNonterminalView<'_> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Missing => Ok(()),
            Self::Present(r) => fmt::Display::fmt(r, f),
        }
    }
}

impl OptionalNonterminalView<'_> {
    /// Stream the slot's renderable into `dest`; a missing slot writes nothing.
    pub fn render_into(&self, dest: &mut dyn std::fmt::Write) -> std::fmt::Result {
        match self {
            Self::Missing => Ok(()),
            Self::Present(r) => r.render_into(dest),
        }
    }
}

impl<'a> IntoIterator for &'a OptionalNonterminalView<'a> {
    type Item = &'a Renderable<'a>;
    type IntoIter = std::option::IntoIter<&'a Renderable<'a>>;
    fn into_iter(self) -> Self::IntoIter {
        match self {
            OptionalNonterminalView::Missing => None.into_iter(),
            OptionalNonterminalView::Present(r) => Some(r).into_iter(),
        }
    }
}

/// Cardinality-ambiguous nonterminal slot — escape hatch for cases
/// where codegen genuinely cannot determine slot cardinality at
/// emission time (today: polymorph forms that disagree on whether a
/// slot is single or list — see `node-map.ts:3091`). Should be rare;
/// prefer `SingleNonterminalView` / `OptionalNonterminalView` /
/// `ListNonterminalView` whenever cardinality is known.
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

impl NonterminalView<'_> {
    /// Stream whatever the slot holds into `dest`; a missing slot writes nothing.
    pub fn render_into(&self, dest: &mut dyn std::fmt::Write) -> std::fmt::Result {
        match self {
            Self::Missing => Ok(()),
            Self::One(r) => r.render_into(dest),
            Self::Many(v) => v.render_into(dest),
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
    fn before(&self) -> &'a str;
    fn token(&self) -> &'a str;
    fn after(&self) -> &'a str;
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
    fn before(&self) -> &'a str {
        self.before
    }
    fn token(&self) -> &'a str {
        self.token
    }
    fn after(&self) -> &'a str {
        self.after
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
    fn before(&self) -> &'a str {
        match self {
            Self::Many(view) => view.before,
            _ => "",
        }
    }
    fn token(&self) -> &'a str {
        match self {
            Self::Many(view) => view.token,
            _ => "",
        }
    }
    fn after(&self) -> &'a str {
        match self {
            Self::Many(view) => view.after,
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

/// Presence test for a gated view: a scalar is present when it has
/// non-whitespace text, a list when it is non-empty, an optional slot when
/// it holds a value. The generated body functions call
/// `is_present_check` where the render rule gates on a slot.
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

impl PresenceCheck for SingleNonterminalView<'_> {
    fn is_present_check(&self) -> bool {
        // A required-cardinality slot is by definition always present.
        // We still check for empty rendered text so templates that gate
        // on `{% if foo | isPresent %}` behave consistently with the
        // umbrella case for empty text leaves.
        true
    }
}

impl PresenceCheck for OptionalNonterminalView<'_> {
    fn is_present_check(&self) -> bool {
        matches!(self, Self::Present(_))
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
