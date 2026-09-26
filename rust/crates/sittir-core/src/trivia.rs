//! `TransportTrivia` — the trivia a transport carries, and where it renders.
//!
//! A read gives every extra one owner (`read_node::node_trivia`): leading
//! entries render before the owner, trailing entries after it, and inner
//! entries at the gap they occupy inside an owner with no named child. A
//! trailing entry on its owner's last row renders after the anonymous tokens
//! that follow the owner on that row, so the sink holds it until the next
//! owner, coordinate or line break (`RenderSink::defer_trailing`).

use crate::render::{Render, RenderResult, RenderSink};
use crate::slot::SlotValue;
use std::collections::BTreeMap;

/// One trivia entry: the node (or the coordinate of one), whether it shares
/// a row with its owner, and on a same-line trailing entry the anonymous
/// tokens between the owner and it.
#[derive(Debug, Clone)]
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

/// The trivia one transport owns. Mirrors `NodeTrivia` in `@sittir/types`.
#[derive(Debug, Clone)]
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

/// Render `entries` one per line: each ends the line it is on, since a line
/// comment swallows whatever follows it on its line. An entry whose own text
/// already ends the line (a grammar may include the terminator in the
/// comment's span) needs no extra break.
fn render_lines<T: Render>(entries: &[TriviaEntry<T>], w: &mut dyn RenderSink) -> RenderResult {
    for entry in entries {
        entry.render(w)?;
        if !w.ends_line() {
            w.text("\n")?;
        }
    }
    Ok(())
}

/// Hold a run of same-line trailing entries in the sink.
fn defer_run<T: Render>(run: &[TriviaEntry<T>], w: &mut dyn RenderSink) -> RenderResult {
    w.defer_trailing(&mut |w| {
        for entry in run {
            entry.render(w)?;
        }
        Ok(())
    })
}

impl<T: Render> TransportTrivia<T> {
    /// Leading entries, before the owner renders.
    pub fn render_leading(&self, w: &mut dyn RenderSink) -> RenderResult {
        render_lines(self.leading.as_deref().unwrap_or(&[]), w)
    }

    /// Trailing entries, after the owner renders, in source order. A
    /// same-line entry with no tokens between it and its owner is seated
    /// right after the owner; one after tokens is held past the tokens that
    /// follow the owner. Own-line entries seat the held ones first, then each
    /// renders on its own line.
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
            for entry in own_line {
                w.text("\n")?;
                entry.render(w)?;
            }
            if !w.ends_line() {
                w.text("\n")?;
            }
        }
        Ok(())
    }

    /// The inner entries at the gap `key`, where the owner renders that gap's
    /// slot.
    pub fn render_inner(&self, key: &str, w: &mut dyn RenderSink) -> RenderResult {
        match self.inner.as_ref().and_then(|inner| inner.get(key)) {
            Some(entries) => render_lines(entries, w),
            None => Ok(()),
        }
    }
}

/// The inner entries at gap `key` of a transport's trivia, if it has any.
pub fn render_inner<T: Render>(
    trivia: &Option<TransportTrivia<T>>,
    key: &str,
    w: &mut dyn RenderSink,
) -> RenderResult {
    match trivia {
        Some(trivia) => trivia.render_inner(key, w),
        None => Ok(()),
    }
}

#[cfg(feature = "napi-bindings")]
impl<T: ::napi::bindgen_prelude::FromNapiValue> ::napi::bindgen_prelude::FromNapiValue
    for TriviaEntry<T>
{
    /// A trivia entry is a slot value that may carry `$sameLine`: a node, a
    /// coordinate, or bare text. Text that shares its owner's row arrives as
    /// `{ $text, $sameLine }`, since a bare string has nowhere to carry the
    /// flag; it renders as the same bare text.
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
        let obj = unsafe { ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)? };
        let same_line = obj.get::<bool>("$sameLine")?.unwrap_or(false);
        let tokens_between = obj.get::<u32>("$tokensBetween")?.unwrap_or(0) as u16;
        let value = match (obj.get::<u32>("$type")?, obj.get::<String>("$text")?) {
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
impl<T: ::napi::bindgen_prelude::FromNapiValue> ::napi::bindgen_prelude::FromNapiValue
    for TransportTrivia<T>
{
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = unsafe { ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)? };
        let inner = match obj.get::<::napi::bindgen_prelude::Object>("inner")? {
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
            leading: obj.get("leading")?,
            trailing: obj.get("trailing")?,
            inner,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl<T> ::napi::bindgen_prelude::ToNapiValue for TransportTrivia<T> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        unsafe { ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ()) }
    }
}

#[cfg(feature = "napi-bindings")]
impl<T> ::napi::bindgen_prelude::TypeName for TransportTrivia<T> {
    fn type_name() -> &'static str {
        "TransportTrivia"
    }
    fn value_type() -> ::napi::ValueType {
        ::napi::ValueType::Object
    }
}

#[cfg(feature = "napi-bindings")]
impl<T> ::napi::bindgen_prelude::ValidateNapiValue for TransportTrivia<T> {}
