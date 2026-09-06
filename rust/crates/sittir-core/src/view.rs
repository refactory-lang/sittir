//! The render-time views. A view is what a `{placeholder}` in a generated
//! kind template names: the slot value with the literal text the render rule
//! puts around it, written only when the slot is present. `View` covers every
//! scalar slot shape; `ListView` covers a repeated slot and owns the separator
//! parts, the head and tail spacing, and the list's own surrounding text.
//!
//! A view template uses the `write!` vocabulary: `{}` is the slot, `{{` and
//! `}}` are literal braces. A template with no `{}` is written whole when the
//! slot is present, which is how a boolean primitive renders its keyword.

use std::fmt::{self, Display, Formatter};

use crate::slot::SlotValue;

/// A slot position as a view sees it: it writes itself between `prefix` and
/// `suffix`, or writes nothing at all when it holds no value.
pub trait Slot {
    fn write_slot(&self, prefix: &str, suffix: &str, f: &mut Formatter<'_>) -> fmt::Result;

    /// Whether the position holds a value the template's text should
    /// surround. The generated bodies test this where a render rule still
    /// branches on more than one slot.
    fn is_present(&self) -> bool;
}

impl<T: Display, const ADJACENT: bool> Slot for SlotValue<T, ADJACENT> {
    fn write_slot(&self, prefix: &str, suffix: &str, f: &mut Formatter<'_>) -> fmt::Result {
        write_literal(prefix, f)?;
        Display::fmt(self, f)?;
        write_literal(suffix, f)
    }

    fn is_present(&self) -> bool {
        true
    }
}

impl<S: Slot + ?Sized> Slot for &S {
    fn write_slot(&self, prefix: &str, suffix: &str, f: &mut Formatter<'_>) -> fmt::Result {
        (**self).write_slot(prefix, suffix, f)
    }

    fn is_present(&self) -> bool {
        (**self).is_present()
    }
}

impl<S: Slot + ?Sized> Slot for Box<S> {
    fn write_slot(&self, prefix: &str, suffix: &str, f: &mut Formatter<'_>) -> fmt::Result {
        (**self).write_slot(prefix, suffix, f)
    }

    fn is_present(&self) -> bool {
        (**self).is_present()
    }
}

impl<S: Slot> Slot for Option<S> {
    fn write_slot(&self, prefix: &str, suffix: &str, f: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Some(slot) => slot.write_slot(prefix, suffix, f),
            None => Ok(()),
        }
    }

    fn is_present(&self) -> bool {
        self.as_ref().is_some_and(Slot::is_present)
    }
}

impl Slot for str {
    fn write_slot(&self, prefix: &str, suffix: &str, f: &mut Formatter<'_>) -> fmt::Result {
        write_literal(prefix, f)?;
        f.write_str(self)?;
        write_literal(suffix, f)
    }

    fn is_present(&self) -> bool {
        true
    }
}

impl Slot for String {
    fn write_slot(&self, prefix: &str, suffix: &str, f: &mut Formatter<'_>) -> fmt::Result {
        self.as_str().write_slot(prefix, suffix, f)
    }

    fn is_present(&self) -> bool {
        true
    }
}

impl Slot for bool {
    fn write_slot(&self, prefix: &str, suffix: &str, f: &mut Formatter<'_>) -> fmt::Result {
        if !*self {
            return Ok(());
        }
        write_literal(prefix, f)?;
        write_literal(suffix, f)
    }

    fn is_present(&self) -> bool {
        *self
    }
}

/// The template's halves: the text before the first `{}` and the text after
/// it, both still carrying their `{{` / `}}` escapes. A template without
/// `{}` is all prefix.
fn split_template(template: &str) -> (&str, &str) {
    let bytes = template.as_bytes();
    let mut i = 0;
    while i + 1 < bytes.len() {
        match (bytes[i], bytes[i + 1]) {
            (b'{', b'}') => return (&template[..i], &template[i + 2..]),
            (b'{', b'{') | (b'}', b'}') => i += 2,
            _ => i += 1,
        }
    }
    (template, "")
}

/// Writes template text with `{{` and `}}` unescaped. Any other brace is a
/// malformed template, which only the emitter can produce.
fn write_literal(text: &str, f: &mut Formatter<'_>) -> fmt::Result {
    let mut rest = text;
    while let Some(at) = rest.find(['{', '}']) {
        f.write_str(&rest[..at])?;
        let brace = &rest[at..at + 1];
        debug_assert!(
            rest[at + 1..].starts_with(brace),
            "unescaped brace in view template {text:?}"
        );
        f.write_str(brace)?;
        rest = &rest[at + 2..];
    }
    f.write_str(rest)
}

/// A scalar slot with its template: `View::new(&node.return_type, "->{}")`.
#[derive(Debug, Clone, Copy)]
pub struct View<'t, S: Slot> {
    slot: S,
    prefix: &'t str,
    suffix: &'t str,
}

impl<'t, S: Slot> View<'t, S> {
    pub fn new(slot: S, template: &'t str) -> Self {
        let (prefix, suffix) = split_template(template);
        Self {
            slot,
            prefix,
            suffix,
        }
    }

    pub fn is_present(&self) -> bool {
        self.slot.is_present()
    }
}

impl<S: Slot> Display for View<'_, S> {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        self.slot.write_slot(self.prefix, self.suffix, f)
    }
}

/// The items of a list slot named in a template but absent from the transport.
pub const NO_ITEMS: &[&str] = &[];

/// A repeated slot with everything its rendering needs. Between items every
/// separator part is written; a leading flank writes the token and what
/// follows it, a trailing flank what precedes it and the token, so the
/// list's edges never carry whitespace the surrounding template did not ask
/// for. `head` and `tail` (spacing) sit inside the template's text and, like
/// it, are written only when there are items.
#[derive(Debug, Clone, Copy)]
pub struct ListView<'a, E: Slot> {
    pub items: &'a [E],
    /// The list's surrounding text, `{}` standing for the joined items.
    pub template: &'a str,
    /// Whitespace written before the separator token.
    pub before: &'a str,
    /// The separator token itself; empty for an unseparated repeat.
    pub token: &'a str,
    /// Whitespace written after the separator token.
    pub after: &'a str,
    pub leading: bool,
    pub trailing: bool,
    pub head: &'a str,
    pub tail: &'a str,
}

impl<E: Slot> ListView<'_, E> {
    pub fn is_present(&self) -> bool {
        !self.items.is_empty()
    }
}

impl<E: Slot> Display for ListView<'_, E> {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        if self.items.is_empty() {
            return Ok(());
        }
        let (prefix, suffix) = split_template(self.template);
        write_literal(prefix, f)?;
        f.write_str(self.head)?;
        if self.leading {
            f.write_str(self.token)?;
            f.write_str(self.after)?;
        }
        for (i, item) in self.items.iter().enumerate() {
            if i > 0 {
                f.write_str(self.before)?;
                f.write_str(self.token)?;
                f.write_str(self.after)?;
            }
            item.write_slot("", "", f)?;
        }
        if self.trailing {
            f.write_str(self.before)?;
            f.write_str(self.token)?;
        }
        f.write_str(self.tail)?;
        write_literal(suffix, f)
    }
}
