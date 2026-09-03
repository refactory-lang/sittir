//! `SlotValue` — the single carrier every transport slot position holds.
//!
//! A slot's wire value is either a node the render pipeline rebuilds from
//! that node's own `_<slot>` storage, or text it reproduces byte-for-byte.
//! One generic carrier covers both, so every slot position — required,
//! optional, list element, boxed back-edge, per-slot enum — has the same
//! tolerance without a per-type verbatim variant.
//!
//! The verbatim case exists because the read layer expands one level per
//! read: a child it located but never expanded arrives as a stub carrying
//! `$text` and its tree coordinates but none of the storage a rebuild
//! needs. Reproducing that text is what keeps an untouched subtree's
//! original bytes intact while its rebuilt siblings render canonically.

use crate::types::RenderableTransport;

/// One slot position's value: a node, or the text to emit in its place.
///
/// `ADJACENT` mirrors the grammar's `immediate` stamp for this position:
/// when every scalar-capable source of the slot forbids preceding
/// whitespace, the verbatim write suppresses the seam space the spacing
/// writer would otherwise insert. It is a slot fact, not a wire fact, so
/// it rides on the type rather than the value.
#[derive(Debug, Clone)]
pub enum SlotValue<T, const ADJACENT: bool = false> {
    /// A node with its own storage — renders through its transport type.
    Node(T),
    /// Text emitted as-is: a bare string a factory wrote into the slot, or
    /// an unexpanded read stub's captured source.
    Verbatim(String),
}

impl<T, const ADJACENT: bool> SlotValue<T, ADJACENT> {
    /// The node this slot holds, or `None` when it holds verbatim text.
    pub fn node(&self) -> Option<&T> {
        match self {
            Self::Node(node) => Some(node),
            Self::Verbatim(_) => None,
        }
    }

    /// The node this slot holds, or `None` after writing its verbatim text
    /// to `dest`. For render paths that call a concrete `render_<kind>`
    /// function directly instead of going through `RenderableTransport`.
    pub fn node_or_write(
        &self,
        dest: &mut dyn std::fmt::Write,
    ) -> Result<Option<&T>, ::askama::Error> {
        match self {
            Self::Node(node) => Ok(Some(node)),
            Self::Verbatim(text) => {
                write_verbatim::<ADJACENT>(text, dest)?;
                Ok(None)
            }
        }
    }
}

/// The one derivation of "emit slot text", shared by `render_into` and
/// `node_or_write` so both honour the position's adjacency the same way.
fn write_verbatim<const ADJACENT: bool>(
    text: &str,
    dest: &mut dyn std::fmt::Write,
) -> Result<(), ::askama::Error> {
    if ADJACENT {
        crate::spacing::mark_adjacent(dest).map_err(::askama::Error::from)?;
    }
    dest.write_str(text).map_err(::askama::Error::from)
}

impl<T: RenderableTransport, const ADJACENT: bool> RenderableTransport for SlotValue<T, ADJACENT> {
    fn render_into(&self, dest: &mut dyn std::fmt::Write) -> Result<(), ::askama::Error> {
        match self {
            Self::Node(node) => node.render_into(dest),
            Self::Verbatim(text) => write_verbatim::<ADJACENT>(text, dest),
        }
    }
}

/// `napi_typeof` without the `type_of!` macro, which expands to a bare
/// `check_status!` that would have to be in scope at every call site.
///
/// # Safety
/// `napi_val` must be a live value in `env`.
#[cfg(feature = "napi-bindings")]
pub unsafe fn transport_value_type(
    env: ::napi::sys::napi_env,
    napi_val: ::napi::sys::napi_value,
) -> ::napi::Result<::napi::ValueType> {
    let mut value_type = 0;
    let status = unsafe { ::napi::sys::napi_typeof(env, napi_val, &mut value_type) };
    if status != ::napi::sys::Status::napi_ok {
        return Err(::napi::Error::new(
            ::napi::Status::from(status),
            "napi_typeof failed".to_owned(),
        ));
    }
    Ok(::napi::ValueType::from(value_type))
}

/// The object's own `$text`, when it has one.
///
/// # Safety
/// `napi_val` must be a live object value in `env`.
#[cfg(feature = "napi-bindings")]
unsafe fn captured_source_text(
    env: ::napi::sys::napi_env,
    napi_val: ::napi::sys::napi_value,
) -> ::napi::Result<Option<String>> {
    use ::napi::bindgen_prelude::{FromNapiValue, Object};
    let obj = unsafe { Object::from_napi_value(env, napi_val)? };
    obj.get::<String>("$text")
}

#[cfg(feature = "napi-bindings")]
impl<T: ::napi::bindgen_prelude::FromNapiValue, const ADJACENT: bool>
    ::napi::bindgen_prelude::FromNapiValue for SlotValue<T, ADJACENT>
{
    /// Offer the value to the slot's own type first, so every shape that
    /// already deserializes keeps its existing render path — leaf structs
    /// still read their bare strings, enums still validate membership.
    ///
    /// Verbatim is the fallback for what the slot type cannot rebuild but
    /// the wire can still reproduce: an unexpanded read stub, free text in
    /// a position that admits no text kind. The gate is the value's own
    /// captured `$text` — a node whose slots were replaced has had its now
    /// stale `$text` stripped before it crossed the boundary, so a genuine
    /// structural mismatch still surfaces as an error rather than silently
    /// echoing the pre-edit source.
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let value_type = unsafe { transport_value_type(env, napi_val)? };
        let attempt = unsafe { T::from_napi_value(env, napi_val) };
        let error = match attempt {
            Ok(node) => return Ok(Self::Node(node)),
            Err(error) => error,
        };
        match value_type {
            ::napi::ValueType::String => Ok(Self::Verbatim(unsafe {
                String::from_napi_value(env, napi_val)?
            })),
            ::napi::ValueType::Object => match unsafe { captured_source_text(env, napi_val)? } {
                Some(text) => Ok(Self::Verbatim(text)),
                None => Err(error),
            },
            _ => Err(error),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl<T, const ADJACENT: bool> ::napi::bindgen_prelude::ToNapiValue for SlotValue<T, ADJACENT> {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason(
            "SlotValue is receive-only".to_owned(),
        ))
    }
}

#[cfg(test)]
mod tests {
    use super::SlotValue;
    use crate::types::RenderableTransport;

    struct Word(&'static str);

    impl RenderableTransport for Word {
        fn render_into(&self, dest: &mut dyn std::fmt::Write) -> Result<(), ::askama::Error> {
            dest.write_str(self.0).map_err(::askama::Error::from)
        }
    }

    #[test]
    fn node_renders_through_its_transport() {
        let slot: SlotValue<Word> = SlotValue::Node(Word("fn"));
        assert_eq!(slot.render_to_string().unwrap(), "fn");
        assert!(slot.node().is_some());
    }

    #[test]
    fn verbatim_renders_its_text() {
        let slot: SlotValue<Word> = SlotValue::Verbatim("pub fn main() { }".to_owned());
        assert_eq!(slot.render_to_string().unwrap(), "pub fn main() { }");
        assert!(slot.node().is_none());
    }

    #[test]
    fn node_or_write_writes_only_the_verbatim_case() {
        let mut buf = String::new();
        let node: SlotValue<Word> = SlotValue::Node(Word("fn"));
        assert!(node.node_or_write(&mut buf).unwrap().is_some());
        assert_eq!(buf, "");

        let verbatim: SlotValue<Word> = SlotValue::Verbatim("raw".to_owned());
        assert!(verbatim.node_or_write(&mut buf).unwrap().is_none());
        assert_eq!(buf, "raw");
    }
}
