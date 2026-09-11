//! The render-time views. A view is what a `{placeholder}` in a generated
//! kind template names: the slot value with the literal text the render rule
//! puts around it, written only when the slot is present. `View` covers every
//! scalar slot shape; `ListView` covers a repeated slot and owns the separator
//! parts, the head and tail spacing, and the list's own surrounding text.
//!
//! A view template uses the `write!` vocabulary: `{}` is the slot, `{{` and
//! `}}` are literal braces. A template with no `{}` is written whole when the
//! slot is present, which is how a boolean primitive renders its keyword.

use crate::render::{Render, RenderResult, RenderSink};
use crate::slot::SlotValue;

/// A slot position as a view sees it: it writes itself between `prefix` and
/// `suffix`, or writes nothing at all when it holds no value.
pub trait Slot {
    fn write_slot(&self, prefix: &str, suffix: &str, w: &mut dyn RenderSink) -> RenderResult;

    /// Whether the position holds a value the template's text should
    /// surround. The generated bodies test this where a render rule still
    /// branches on more than one slot.
    fn is_present(&self) -> bool;
}

impl<T: Render, const ADJACENT: bool> Slot for SlotValue<T, ADJACENT> {
    fn write_slot(&self, prefix: &str, suffix: &str, w: &mut dyn RenderSink) -> RenderResult {
        write_literal(prefix, w)?;
        Render::render(self, w)?;
        write_literal(suffix, w)
    }

    fn is_present(&self) -> bool {
        true
    }
}

impl<S: Slot + ?Sized> Slot for &S {
    fn write_slot(&self, prefix: &str, suffix: &str, w: &mut dyn RenderSink) -> RenderResult {
        (**self).write_slot(prefix, suffix, w)
    }

    fn is_present(&self) -> bool {
        (**self).is_present()
    }
}

impl<S: Slot + ?Sized> Slot for Box<S> {
    fn write_slot(&self, prefix: &str, suffix: &str, w: &mut dyn RenderSink) -> RenderResult {
        (**self).write_slot(prefix, suffix, w)
    }

    fn is_present(&self) -> bool {
        (**self).is_present()
    }
}

impl<S: Slot> Slot for Option<S> {
    fn write_slot(&self, prefix: &str, suffix: &str, w: &mut dyn RenderSink) -> RenderResult {
        match self {
            Some(slot) => slot.write_slot(prefix, suffix, w),
            None => Ok(()),
        }
    }

    fn is_present(&self) -> bool {
        self.as_ref().is_some_and(Slot::is_present)
    }
}

impl Slot for str {
    fn write_slot(&self, prefix: &str, suffix: &str, w: &mut dyn RenderSink) -> RenderResult {
        write_literal(prefix, w)?;
        w.text(self)?;
        write_literal(suffix, w)
    }

    fn is_present(&self) -> bool {
        true
    }
}

impl Slot for String {
    fn write_slot(&self, prefix: &str, suffix: &str, w: &mut dyn RenderSink) -> RenderResult {
        self.as_str().write_slot(prefix, suffix, w)
    }

    fn is_present(&self) -> bool {
        true
    }
}

impl Slot for bool {
    fn write_slot(&self, prefix: &str, suffix: &str, w: &mut dyn RenderSink) -> RenderResult {
        if !*self {
            return Ok(());
        }
        write_literal(prefix, w)?;
        write_literal(suffix, w)
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
fn write_literal(text: &str, w: &mut dyn RenderSink) -> RenderResult {
    let mut rest = text;
    while let Some(at) = rest.find(['{', '}']) {
        w.text(&rest[..at])?;
        let brace = &rest[at..at + 1];
        debug_assert!(
            rest[at + 1..].starts_with(brace),
            "unescaped brace in view template {text:?}"
        );
        w.text(brace)?;
        rest = &rest[at + 2..];
    }
    w.text(rest)
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

impl<S: Slot> Render for View<'_, S> {
    fn render(&self, w: &mut dyn RenderSink) -> RenderResult {
        self.slot.write_slot(self.prefix, self.suffix, w)
    }
}

/// The items of a list slot named in a template but absent from the transport.
pub const NO_ITEMS: &[&str] = &[];

/// A repeated slot with everything its rendering needs. Between items every
/// separator part is written; a leading flank writes the token and what
/// follows it, a trailing flank what precedes it and the token, so the
/// list's edges never carry whitespace the surrounding template did not ask
/// for. `head` and `tail` (spacing) sit inside the template's text and, like
/// it, are written only when there are items. `before`/`after`/`head`/`tail`
/// are whitespace site ids (`0` = no site) resolved by the writer's
/// `WhitespaceTable`, not literal text.
#[derive(Debug, Clone, Copy)]
pub struct ListView<'a, E: Slot> {
    pub items: &'a [E],
    /// The list's surrounding text, `{}` standing for the joined items.
    pub template: &'a str,
    /// Whitespace site written before the separator token.
    pub before: u16,
    /// The separator token itself; empty for an unseparated repeat.
    pub token: &'a str,
    /// Whitespace site written after the separator token.
    pub after: u16,
    pub leading: bool,
    pub trailing: bool,
    pub head: u16,
    pub tail: u16,
}

impl<E: Slot> ListView<'_, E> {
    pub fn is_present(&self) -> bool {
        !self.items.is_empty()
    }
}

impl<E: Slot> Render for ListView<'_, E> {
    fn render(&self, w: &mut dyn RenderSink) -> RenderResult {
        if self.items.is_empty() {
            return Ok(());
        }
        let (prefix, suffix) = split_template(self.template);
        write_literal(prefix, w)?;
        w.site(self.head);
        if self.leading {
            w.text(self.token)?;
            w.site(self.after);
        }
        for (i, item) in self.items.iter().enumerate() {
            if i > 0 {
                w.site(self.before);
                w.text(self.token)?;
                w.site(self.after);
            }
            item.write_slot("", "", w)?;
        }
        if self.trailing {
            w.site(self.before);
            w.text(self.token)?;
        }
        w.site(self.tail);
        write_literal(suffix, w)
    }
}
