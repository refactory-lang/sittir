//! The render-time views. A view is what a `{placeholder}` in a generated
//! kind template names: the slot value with the literal text the render rule
//! puts around it, written only when the slot is present. `View` covers every
//! scalar slot shape; `ListView` covers a repeated slot and owns the separator
//! parts, the head and tail spacing, and the list's own surrounding text.
//!
//! A view template's `{}` is the slot; `{{` and `}}` are literal braces. A
//! template with no `{}` is written whole when the slot is present, which is
//! how a boolean primitive renders its keyword.

use crate::render::{Render, RenderResult, RenderSink};
use crate::slot::SlotValue;
use crate::types::KindId;

/// What a node answers when a body asks whether its value is one of a
/// set of kinds: a generated struct answers for its own kind, a generated
/// enum for the variant it holds.
pub trait KindOf {
    fn kind_in(&self, kinds: &[KindId]) -> bool;
}

impl<T: KindOf + ?Sized> KindOf for Box<T> {
    fn kind_in(&self, kinds: &[KindId]) -> bool {
        (**self).kind_in(kinds)
    }
}

/// A slot position asked whether the value it holds is one of a set of
/// kinds. A literal a render rule puts beside a slot in only some arms of a
/// choice is written under this test: the arm's kinds are the gate. A
/// coordinate asks the sink's tree table; an absent position is no kind.
pub trait KindTest {
    fn kind_in(&self, w: &dyn RenderSink, kinds: &[KindId]) -> bool;
}

impl<T: KindOf, const ADJACENT: bool> KindTest for SlotValue<T, ADJACENT> {
    fn kind_in(&self, w: &dyn RenderSink, kinds: &[KindId]) -> bool {
        match self {
            SlotValue::Coord(coord) => w.kind_of(coord).is_some_and(|kind| kinds.contains(&kind)),
            SlotValue::Node(t) => t.kind_in(kinds),
        }
    }
}

impl<S: KindTest + ?Sized> KindTest for &S {
    fn kind_in(&self, w: &dyn RenderSink, kinds: &[KindId]) -> bool {
        (**self).kind_in(w, kinds)
    }
}

impl<S: KindTest + ?Sized> KindTest for Box<S> {
    fn kind_in(&self, w: &dyn RenderSink, kinds: &[KindId]) -> bool {
        (**self).kind_in(w, kinds)
    }
}

impl<S: KindTest> KindTest for Option<S> {
    fn kind_in(&self, w: &dyn RenderSink, kinds: &[KindId]) -> bool {
        self.as_ref().is_some_and(|slot| slot.kind_in(w, kinds))
    }
}

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

/// A presence slot whose keyword is a kind of its own: present when the flag
/// is set, and written through that kind's `Render`, so the keyword renders
/// as its kind does anywhere else.
#[derive(Debug, Clone, Copy)]
pub struct Presence<T> {
    present: bool,
    kind: T,
}

impl<T> Presence<T> {
    pub fn new(present: bool, kind: T) -> Self {
        Self { present, kind }
    }
}

impl<T: Render> Slot for Presence<T> {
    fn write_slot(&self, prefix: &str, suffix: &str, w: &mut dyn RenderSink) -> RenderResult {
        if !self.present {
            return Ok(());
        }
        write_literal(prefix, w)?;
        self.kind.render(w)?;
        write_literal(suffix, w)
    }

    fn is_present(&self) -> bool {
        self.present
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
pub(crate) fn write_literal(text: &str, w: &mut dyn RenderSink) -> RenderResult {
    let mut rest = text;
    while let Some(at) = rest.find(['{', '}']) {
        w.text(&rest[..at])?;
        let brace = &rest[at..=at];
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

impl<S: Slot + KindTest> KindTest for View<'_, S> {
    fn kind_in(&self, w: &dyn RenderSink, kinds: &[KindId]) -> bool {
        self.slot.kind_in(w, kinds)
    }
}

impl<S: Slot> Render for View<'_, S> {
    fn render(&self, w: &mut dyn RenderSink) -> RenderResult {
        self.slot.write_slot(self.prefix, self.suffix, w)
    }
}

/// The items of a list slot named in a template but absent from the node.
pub const NO_ITEMS: &[&str] = &[];

/// The text of a list's separator kind (`ListView::separators`).
pub type SeparatorText = fn(crate::types::KindId) -> &'static str;

/// A repeated slot with everything its rendering needs. Between items every
/// separator part is written; a leading flank writes the token and what
/// follows it, a trailing flank what precedes it and the token, so the
/// list's edges never carry whitespace the surrounding template did not ask
/// for. `head` and `tail` (spacing) sit inside the template's text and, like
/// it, are written only when there are items. `before`/`after` are whitespace
/// arms (`KindId::BLANK` = none) the list carries; `head`/`tail` are spacing sites the
/// writer reads from its resolved options.
#[derive(Debug, Clone, Copy)]
pub struct ListView<'a, L: SlotItems> {
    pub items: L,
    /// The list's surrounding text, `{}` standing for the joined items.
    pub template: &'a str,
    /// Whitespace site written before the separator token.
    pub before: crate::types::KindId,
    /// The separator token itself; empty for an unseparated repeat.
    pub token: &'a str,
    /// Each item's own separator by its place, where its source spells
    /// another than `token` (`layout::slot_tokens`), with the text of each
    /// separator kind; `None` for a list whose separator is not chosen per
    /// instance.
    pub separators: Option<(&'a [Option<crate::types::KindId>], SeparatorText)>,
    /// Whitespace site written after the separator token.
    pub after: crate::types::KindId,
    pub leading: bool,
    pub trailing: bool,
    /// Spacing site read from the resolved options inside the template, before the first item.
    pub head: Option<crate::types::SiteId>,
    /// Spacing site read from the resolved options inside the template, after the last item.
    pub tail: Option<crate::types::SiteId>,
    /// The list's slot (its wire key) and the layout holding its unit
    /// items' sides, each item framed by them (`UnitFrames`).
    pub units: Option<(&'a str, &'a dyn UnitFrames)>,
}

/// The items of a list slot, each handed out as a slot: a borrowed slice of
/// a node's items, or a record's run viewing one item cell at a time.
pub trait SlotItems: Copy {
    type Item: Slot;
    fn count(&self) -> usize;
    /// The item at `index`, `None` past the last.
    fn item(&self, index: usize) -> Option<Self::Item>;
}

impl<'s, E: Slot> SlotItems for &'s [E] {
    type Item = &'s E;
    fn count(&self) -> usize {
        self.len()
    }
    fn item(&self, index: usize) -> Option<&'s E> {
        self.get(index)
    }
}

impl<'s, E: Slot, const N: usize> SlotItems for &'s [E; N] {
    type Item = &'s E;
    fn count(&self) -> usize {
        N
    }
    fn item(&self, index: usize) -> Option<&'s E> {
        self.get(index)
    }
}

impl<'s, E: Slot> SlotItems for &'s Vec<E> {
    type Item = &'s E;
    fn count(&self) -> usize {
        self.len()
    }
    fn item(&self, index: usize) -> Option<&'s E> {
        self.get(index)
    }
}

impl<'s, E: Slot> SlotItems for &'s crate::NonEmptyVec<E> {
    type Item = &'s E;
    fn count(&self) -> usize {
        self.len()
    }
    fn item(&self, index: usize) -> Option<&'s E> {
        self.get(index)
    }
}

/// What frames a node's unit children by their sides
/// (`layout::NodeLayout::units`).
pub trait UnitFrames: std::fmt::Debug {
    /// Writes `body`, the unit at item `item` of the slot `slot`, framed by
    /// the sides held for it, or bare when none are.
    fn frame_unit(&self, slot: &str, item: crate::types::ItemIndex, w: &mut dyn RenderSink, body: &mut dyn FnMut(&mut dyn RenderSink) -> RenderResult) -> RenderResult;
}

impl<L: SlotItems> ListView<'_, L> {
    #[must_use]
    pub fn is_present(&self) -> bool {
        self.items.count() > 0
    }
}

impl<L: SlotItems> Render for ListView<'_, L> {
    fn render(&self, w: &mut dyn RenderSink) -> RenderResult {
        if self.items.count() == 0 {
            return Ok(());
        }
        let (prefix, suffix) = split_template(self.template);
        write_literal(prefix, w)?;
        if let Some(head) = self.head {
            w.flank_at(head);
        }
        if self.leading {
            w.text(self.token)?;
            w.site(self.after);
        }
        for (i, item) in (0..self.items.count()).filter_map(|i| Some((i, self.items.item(i)?))) {
            if i > 0 {
                let own = self.separators.and_then(|(tokens, text)| Some(text(tokens.get(i).copied().flatten()?)));
                w.site(self.before);
                w.text(own.unwrap_or(self.token))?;
                w.site(self.after);
            }
            match self.units {
                Some((slot, units)) => units.frame_unit(slot, item_index(i)?, w, &mut |w| item.write_slot("", "", w))?,
                None => item.write_slot("", "", w)?,
            }
        }
        if self.trailing {
            w.site(self.before);
            w.text(self.token)?;
        }
        if let Some(tail) = self.tail {
            w.flank_at(tail);
        }
        write_literal(suffix, w)
    }
}

#[cfg(test)]
mod presence_tests {
    use super::{Presence, View};
    use crate::render::{Render, RenderResult, RenderSink};

    #[derive(Clone, Copy)]
    struct Keyword;

    impl Render for Keyword {
        fn render(&self, w: &mut dyn RenderSink) -> RenderResult {
            w.text("mut")
        }
    }

    fn rendered(flag: bool) -> String {
        let mut s = String::new();
        let mut w = crate::spacing::SpacingWriter::new(&mut s, crate::spacing::WordMatcher::default_ident());
        let view = View::new(Presence::new(flag, Keyword), "{}");
        view.render(&mut w).unwrap();
        w.finish().unwrap();
        s
    }

    #[test]
    fn a_set_flag_renders_the_kind() {
        assert_eq!(rendered(true), "mut");
    }

    #[test]
    fn a_false_flag_renders_nothing() {
        assert_eq!(rendered(false), "");
        assert!(!View::new(Presence::new(false, Keyword), "{}").is_present());
    }
}

/// The `ItemIndex` of a list's item at `at`. A built list is not bounded by
/// a parsed tree, so a position past `u32::MAX` is refused rather than
/// wrapped onto another item's trivia.
fn item_index(at: usize) -> Result<crate::types::ItemIndex, crate::render::RenderError> {
    u32::try_from(at).map(crate::types::ItemIndex).map_err(|_| crate::render::RenderError::ItemIndex(at))
}

#[cfg(test)]
mod item_index_tests {
    use super::item_index;

    #[test]
    fn a_position_past_u32_is_refused_not_wrapped() {
        assert_eq!(item_index(7).unwrap(), crate::types::ItemIndex(7));
        assert_eq!(item_index(u32::MAX as usize).unwrap(), crate::types::ItemIndex(u32::MAX));
        assert!(matches!(item_index(u32::MAX as usize + 1), Err(crate::render::RenderError::ItemIndex(at)) if at == u32::MAX as usize + 1));
    }
}
