//! `TransportTrivia` — the trivia a transport carries, and where it renders.
//!
//! A read gives every extra one owner (`read::place`): leading
//! entries render before the owner, trailing entries after it, and inner
//! entries at the gap they occupy inside an owner with no named child. A
//! trailing entry on its owner's last row renders after the anonymous tokens
//! that follow the owner on that row, so the sink holds it until the next
//! owner, coordinate or line break (`RenderSink::defer_trailing`).

use crate::layout_kinds::LayoutKinds;
use crate::options::Side;
use crate::render::{Render, RenderResult, RenderSink};
use crate::types::KindId;
use crate::slot::SlotValue;
use std::collections::BTreeMap;

/// One trivia entry: the node (or the coordinate of one), whether it shares
/// a row with its owner, and on a same-line trailing entry the anonymous
/// tokens between the owner and it.
#[derive(Debug, Clone, PartialEq)]
pub struct TriviaEntry<T> {
    pub value: SlotValue<T>,
    pub same_line: bool,
    pub tokens_between: u16,
}

impl<T: Render> Render for TriviaEntry<T> {
    fn render(&self, w: &mut dyn RenderSink) -> RenderResult {
        self.value.render(w)
    }
}

/// A trivia value that is whitespace answers its gap kind: it is merged into
/// the gap it sits in (`RenderSink::trivia_seam`), replacing that gap's
/// default, instead of being written as a line of its own. A line
/// continuation also answers the source text it was read with.
pub trait TriviaSeam {
    fn seam_gap(&self) -> Option<(LayoutKinds, Option<&str>)> {
        None
    }
}

impl<T: Render + TriviaSeam> TriviaEntry<T> {
    fn seam_gap(&self) -> Option<(LayoutKinds, Option<&str>)> {
        match &self.value {
            SlotValue::Transport(value) => value.seam_gap(),
            SlotValue::Coord(_) => None,
        }
    }
}

impl<T: crate::prepare::Prepare> crate::prepare::Prepare for TransportTrivia<T> {
    /// Every entry is prepared like a slot value: a coordinate entry takes its
    /// kind's edges, as a coordinate in a slot does.
    fn prepare(&mut self, ctx: &crate::prepare::RenderContext<'_>) -> Result<(), crate::render::CoordinateError> {
        let sides = self.leading.iter_mut().chain(self.trailing.iter_mut());
        let inner = self.inner.iter_mut().flat_map(|gaps| gaps.values_mut());
        for entry in sides.chain(inner).flatten() {
            entry.value.prepare(ctx)?;
        }
        Ok(())
    }
}

/// Trivia read from source and detached from its tree: the text the reader
/// captured, with the kind the reader stamped on it. It writes that kind's
/// edges around the text, as a rendered node of the kind does.
#[derive(Debug, Clone, PartialEq)]
pub struct TriviaText {
    pub kind: KindId,
    pub text: String,
}

impl Render for TriviaText {
    fn render(&self, w: &mut dyn RenderSink) -> RenderResult {
        w.edge(self.kind, Side::Before, None);
        w.text(&self.text)?;
        w.edge(self.kind, Side::After, None);
        w.end_line_after(self.kind);
        Ok(())
    }
}

impl crate::prepare::Prepare for TriviaText {
    fn prepare(&mut self, _ctx: &crate::prepare::RenderContext<'_>) -> Result<(), crate::render::CoordinateError> {
        Ok(())
    }
}

/// The trivia one transport owns. Mirrors `NodeTrivia` in `@sittir/types`.
#[derive(Debug, Clone, PartialEq)]
pub struct TransportTrivia<T> {
    pub leading: Option<Vec<TriviaEntry<T>>>,
    pub trailing: Option<Vec<TriviaEntry<T>>>,
    pub inner: Option<BTreeMap<String, Vec<TriviaEntry<T>>>>,
}

impl<T> Default for TransportTrivia<T> {
    fn default() -> Self {
        Self {
            leading: None,
            trailing: None,
            inner: None,
        }
    }
}

/// The trivia type of the grammar a transport belongs to: what a coordinate
/// of it carries as outside trivia. Codegen states it once per grammar
/// (`grammar_trivia!`).
pub trait HasTrivia {
    type Trivia: TriviaItem + HasTrivia<Trivia = Self::Trivia>;
}

impl<T: HasTrivia> HasTrivia for Box<T> {
    type Trivia = T::Trivia;
}

/// What a grammar's trivia type provides to frame a coordinate: its render,
/// its prepare walk and, with the bindings, its wire decode.
#[cfg(not(feature = "napi-bindings"))]
pub trait TriviaItem: Render + TriviaSeam + crate::prepare::Prepare + Clone + PartialEq + std::fmt::Debug + 'static {}

#[cfg(not(feature = "napi-bindings"))]
impl<T: Render + TriviaSeam + crate::prepare::Prepare + Clone + PartialEq + std::fmt::Debug + 'static> TriviaItem for T {}

#[cfg(feature = "napi-bindings")]
pub trait TriviaItem:
    Render + TriviaSeam + crate::prepare::Prepare + Clone + PartialEq + std::fmt::Debug + 'static + ::napi::bindgen_prelude::FromNapiValue
{
}

#[cfg(feature = "napi-bindings")]
impl<T: Render + TriviaSeam + crate::prepare::Prepare + Clone + PartialEq + std::fmt::Debug + 'static + ::napi::bindgen_prelude::FromNapiValue> TriviaItem
    for T
{
}

/// Trivia that frames what a node renders: its leading entries before, its
/// trailing entries after.
pub trait Framing {
    fn frame_leading(&self, w: &mut dyn RenderSink) -> RenderResult;
    fn frame_trailing(&self, w: &mut dyn RenderSink) -> RenderResult;
}

impl<T: Render + TriviaSeam> Framing for TransportTrivia<T> {
    fn frame_leading(&self, w: &mut dyn RenderSink) -> RenderResult {
        self.render_leading(w)
    }

    fn frame_trailing(&self, w: &mut dyn RenderSink) -> RenderResult {
        self.render_trailing(w)
    }
}

/// The outside trivia a folded coordinate renders between, with its
/// grammar's trivia type erased, so a coordinate carries it whatever its
/// slot's transport type.
pub trait FramedTrivia: Framing + std::fmt::Debug {
    fn prepare(&mut self, ctx: &crate::prepare::RenderContext<'_>) -> Result<(), crate::render::CoordinateError>;
    fn boxed_clone(&self) -> Box<dyn FramedTrivia>;
    fn as_any(&self) -> &dyn std::any::Any;
    fn same_as(&self, other: &dyn FramedTrivia) -> bool;
}

impl<T: TriviaItem> FramedTrivia for TransportTrivia<T> {
    fn prepare(&mut self, ctx: &crate::prepare::RenderContext<'_>) -> Result<(), crate::render::CoordinateError> {
        crate::prepare::Prepare::prepare(self, ctx)
    }

    fn boxed_clone(&self) -> Box<dyn FramedTrivia> {
        Box::new(self.clone())
    }

    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn same_as(&self, other: &dyn FramedTrivia) -> bool {
        other.as_any().downcast_ref::<Self>() == Some(self)
    }
}

/// A folded coordinate's outside trivia, with its grammar's trivia type
/// erased; it rides in the coordinate's `CoordinateWrites`.
#[derive(Debug, Clone)]
pub struct OutsideTrivia(pub Box<dyn FramedTrivia>);

impl PartialEq for OutsideTrivia {
    fn eq(&self, other: &Self) -> bool {
        self.0.same_as(other.0.as_ref())
    }
}

impl Eq for OutsideTrivia {}

impl Clone for Box<dyn FramedTrivia> {
    fn clone(&self) -> Self {
        self.boxed_clone()
    }
}

/// A join written between trivia entries, or between an entry and its owner.
/// It is a fact of the source layout, so it holds its gap at trivia strength,
/// but it never takes away a line break the entry before it left pending: a
/// line-terminated entry's after edge breaks the line, and whatever follows
/// a line comment on its row would be swallowed by it. Where the output
/// already stands at a line start (an entry whose span includes its
/// terminator), the join is already made.
fn join(gap: LayoutKinds, w: &mut dyn RenderSink) {
    if !w.ends_line() {
        whitespace(gap, None, true, w);
    }
}

/// A whitespace entry's text, which replaces the seam at its gap. Right
/// after an entry (`after_entry`) it is kept to at least the line break that
/// entry left pending; anywhere else it replaces the gap's seam outright.
fn whitespace(gap: LayoutKinds, text: Option<&str>, after_entry: bool, w: &mut dyn RenderSink) {
    let keeps_break = after_entry && w.pending_break() && !gap.breaks();
    if keeps_break {
        w.trivia_seam(LayoutKinds::NEWLINE, None);
    } else {
        w.trivia_seam(gap, text);
    }
}

/// Render `entries` separated by `between`, a whitespace entry taking the
/// place of the join at its gap. Each entry's own edges write what follows
/// it; only the joins are written here.
fn render_joined<T: Render + TriviaSeam>(
    entries: &[TriviaEntry<T>],
    between: &dyn Fn(&TriviaEntry<T>) -> LayoutKinds,
    w: &mut dyn RenderSink,
) -> RenderResult {
    let mut previous: Option<&TriviaEntry<T>> = None;
    for entry in entries {
        if let Some((gap, text)) = entry.seam_gap() {
            whitespace(gap, text, previous.is_some(), w);
            previous = None;
            continue;
        }
        if let Some(previous) = previous {
            join(between(previous), w);
        }
        entry.render(w)?;
        previous = Some(entry);
    }
    Ok(())
}

/// Hold a run of same-line trailing entries in the sink.
fn defer_run<T: Render + TriviaSeam>(run: &[TriviaEntry<T>], w: &mut dyn RenderSink) -> RenderResult {
    w.defer_trailing(&mut |w| {
        for entry in run {
            entry.render(w)?;
        }
        Ok(())
    })
}

impl<T: Render + TriviaSeam> TransportTrivia<T> {
    /// Leading entries, before the owner renders: an entry that shares the
    /// owner's row joins it with a space, any other ends its line.
    pub fn render_leading(&self, w: &mut dyn RenderSink) -> RenderResult {
        let leading = self.leading.as_deref().unwrap_or(&[]);
        let owner_join = |entry: &TriviaEntry<T>| if entry.same_line { LayoutKinds::SPACE } else { LayoutKinds::NEWLINE };
        render_joined(leading, &owner_join, w)?;
        if let Some(last) = leading.last().filter(|entry| entry.seam_gap().is_none()) {
            join(owner_join(last), w);
        }
        Ok(())
    }

    /// Trailing entries, after the owner renders, in source order. A
    /// same-line entry with no tokens between it and its owner is seated
    /// right after the owner; one after tokens is held past the tokens that
    /// follow the owner. Own-line entries seat the held ones first, then each
    /// renders on its own line, and the seam the owner left (its after edge)
    /// is written after them.
    pub fn render_trailing(&self, w: &mut dyn RenderSink) -> RenderResult {
        let trailing = self.trailing.as_deref().unwrap_or(&[]);
        let own = trailing
            .iter()
            .position(|entry| !entry.same_line)
            .unwrap_or(trailing.len());
        let held = trailing[..own]
            .iter()
            .position(|entry| entry.tokens_between > 0)
            .unwrap_or(own);
        let (adjacent, rest) = trailing.split_at(held);
        let (after_tokens, own_line) = rest.split_at(own - held);
        if !adjacent.is_empty() {
            defer_run(adjacent, w)?;
            w.seat_trailing()?;
        }
        if !after_tokens.is_empty() {
            defer_run(after_tokens, w)?;
        }
        if !own_line.is_empty() {
            w.seat_trailing()?;
            let owner_seam = w.take_seam();
            let mut gap_set = false;
            let mut after_entry = false;
            for entry in own_line {
                if let Some((gap, text)) = entry.seam_gap() {
                    whitespace(gap, text, std::mem::replace(&mut after_entry, false), w);
                    gap_set = true;
                    continue;
                }
                if !std::mem::replace(&mut gap_set, false) {
                    join(LayoutKinds::NEWLINE, w);
                }
                entry.render(w)?;
                after_entry = true;
            }
            if let Some(seam) = owner_seam {
                w.restore_seam(seam);
            }
        }
        Ok(())
    }

    /// The inner entries at the gap `key`, where the owner renders that gap's
    /// slot: one per line when the gap starts a line (the start of a block
    /// body, which the body's own indent and dedent frame, or output standing
    /// at a line start, as at the grammar root), and joined by spaces
    /// anywhere else.
    pub fn render_inner(&self, key: &str, w: &mut dyn RenderSink) -> RenderResult {
        let Some(entries) = self.inner.as_ref().and_then(|inner| inner.get(key)) else {
            return Ok(());
        };
        let between = if w.at_body_start() || w.ends_line() { LayoutKinds::NEWLINE } else { LayoutKinds::SPACE };
        render_joined(entries, &|_| between, w)
    }
}

/// The inner entries at gap `key` of a transport's trivia, if it has any.
pub fn render_inner<T: Render + TriviaSeam>(
    trivia: Option<&TransportTrivia<T>>,
    key: &str,
    w: &mut dyn RenderSink,
) -> RenderResult {
    match trivia {
        Some(trivia) => trivia.render_inner(key, w),
        None => Ok(()),
    }
}

#[cfg(feature = "napi-bindings")]
impl<T: ::napi::bindgen_prelude::FromNapiValue + crate::trivia::HasTrivia> ::napi::bindgen_prelude::FromNapiValue
    for TriviaEntry<T>
{
    /// A trivia entry is a slot value that may carry `$sameLine`: a node, a
    /// coordinate, bare text, or text with its stamped kind (`{ $type,
    /// $text }`, which the entry type decodes). Kindless text that shares its
    /// owner's row arrives as `{ $text, $sameLine }`, since a bare string has
    /// nowhere to carry the flag; it renders as the same bare text.
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        if unsafe { crate::slot::transport_value_type(env, napi_val)? } != ::napi::ValueType::Object
        {
            return Ok(Self {
                value: unsafe { SlotValue::from_napi_value(env, napi_val)? },
                same_line: false,
                tokens_between: 0,
            });
        }
        use crate::boundary::property;
        let same_line = unsafe { property::<bool>(env, napi_val, c"$sameLine")? }.unwrap_or(false);
        let tokens_between = unsafe { property::<u32>(env, napi_val, c"$tokensBetween")? }.unwrap_or(0) as u16;
        let kind = unsafe { property::<u32>(env, napi_val, c"$type")? };
        let text = unsafe { property::<String>(env, napi_val, c"$text")? };
        let value = match (kind, text) {
            (None, Some(text)) => unsafe {
                let text = ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, text)?;
                SlotValue::from_napi_value(env, text)?
            },
            _ => unsafe { SlotValue::from_napi_value(env, napi_val)? },
        };
        Ok(Self {
            value,
            same_line,
            tokens_between,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl<T: ::napi::bindgen_prelude::FromNapiValue + crate::trivia::HasTrivia> ::napi::bindgen_prelude::FromNapiValue
    for TransportTrivia<T>
{
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        use crate::boundary::property;
        let inner = match unsafe { property::<::napi::bindgen_prelude::Object>(env, napi_val, c"inner")? } {
            None => None,
            Some(gaps) => {
                let mut inner = BTreeMap::new();
                for key in ::napi::bindgen_prelude::Object::keys(&gaps)? {
                    if let Some(entries) = gaps.get::<Vec<TriviaEntry<T>>>(&key)? {
                        inner.insert(key, entries);
                    }
                }
                Some(inner)
            }
        };
        Ok(Self {
            leading: unsafe { property(env, napi_val, c"leading")? },
            trailing: unsafe { property(env, napi_val, c"trailing")? },
            inner,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl<T: ::napi::bindgen_prelude::ToNapiValue> ::napi::bindgen_prelude::ToNapiValue for TransportTrivia<T> {
    /// `{ leading?, trailing?, inner? }`, each only when present. An inner
    /// gap's name is data, so its key is too: the gaps object is defined, not
    /// assigned, so any name (`__proto__` included) stays an own property.
    unsafe fn to_napi_value(env: ::napi::sys::napi_env, val: Self) -> ::napi::Result<::napi::sys::napi_value> {
        use crate::boundary::{object_with, object_with_present, present, present_with};
        let leading = unsafe { present(env, c"leading", val.leading)? };
        let trailing = unsafe { present(env, c"trailing", val.trailing)? };
        let inner = present_with(c"inner", val.inner, |inner| {
            let mut fields = Vec::with_capacity(inner.len());
            for (name, entries) in inner {
                let name = ::std::ffi::CString::new(name).map_err(|e| ::napi::Error::from_reason(e.to_string()))?;
                fields.push((name, unsafe { Vec::to_napi_value(env, entries)? }));
            }
            let fields: Vec<_> = fields.iter().map(|(name, entries)| (name.as_c_str(), *entries)).collect();
            unsafe { object_with(env, &fields) }
        })?;
        unsafe { object_with_present(env, &[leading, trailing, inner]) }
    }
}

#[cfg(feature = "napi-bindings")]
impl<T: ::napi::bindgen_prelude::ToNapiValue> ::napi::bindgen_prelude::ToNapiValue for TriviaEntry<T> {
    /// The value's own form, carrying `$sameLine` and `$tokensBetween` when
    /// they are not their defaults; a value whose form is a string or a kind
    /// id carries them in `{ $text }` or `{ $type }`, the objects the decoder
    /// reads back.
    unsafe fn to_napi_value(env: ::napi::sys::napi_env, val: Self) -> ::napi::Result<::napi::sys::napi_value> {
        use crate::boundary::{define_present, object_with_present, present};
        let value = unsafe { SlotValue::to_napi_value(env, val.value)? };
        let same_line = unsafe { present(env, c"$sameLine", val.same_line.then_some(true))? };
        let tokens_between = unsafe { present(env, c"$tokensBetween", (val.tokens_between != 0).then(|| u32::from(val.tokens_between)))? };
        if same_line.is_none() && tokens_between.is_none() {
            return Ok(value);
        }
        match unsafe { crate::slot::transport_value_type(env, value)? } {
            ::napi::ValueType::Object => {
                unsafe { define_present(env, value, &[same_line, tokens_between])? };
                Ok(value)
            }
            ::napi::ValueType::String => unsafe { object_with_present(env, &[Some((c"$text", value)), same_line, tokens_between]) },
            _ => unsafe { object_with_present(env, &[Some((c"$type", value)), same_line, tokens_between]) },
        }
    }
}

/// `{ $type, $text }`, both required.
#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for TriviaText {
    unsafe fn from_napi_value(env: ::napi::sys::napi_env, napi_val: ::napi::sys::napi_value) -> ::napi::Result<Self> {
        let obj = unsafe { crate::boundary::object(env, napi_val)? };
        let kind: u16 = unsafe { crate::boundary::required(env, obj, c"$type", "TriviaText")? };
        Ok(Self { kind: KindId(kind), text: unsafe { crate::boundary::required(env, obj, c"$text", "TriviaText")? } })
    }
}

/// `{ $type, $text }`.
#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for TriviaText {
    unsafe fn to_napi_value(env: ::napi::sys::napi_env, val: Self) -> ::napi::Result<::napi::sys::napi_value> {
        unsafe {
            crate::boundary::object_with(env, &[
                (c"$type", u16::to_napi_value(env, val.kind.0)?),
                (c"$text", String::to_napi_value(env, val.text)?),
            ])
        }
    }
}
