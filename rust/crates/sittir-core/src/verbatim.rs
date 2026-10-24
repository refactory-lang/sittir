//! Text that is a slot's content with no kind of its own: a bare string in a
//! slot whose members all render from their own text, where the variant tag
//! is render-invisible and picking one would be a guess, or an `ERROR` node,
//! which renders as its text and keeps its kind.

use crate::render::{Render, RenderResult, RenderSink};

#[derive(Debug, Clone, PartialEq)]
pub struct VerbatimNode {
    pub text: String,
    /// `KindId::ERROR` for an `ERROR` node, `KindId::BLANK` for bare text.
    pub kind: crate::types::KindId,
}

impl Render for VerbatimNode {
    fn render(&self, w: &mut dyn RenderSink) -> RenderResult {
        w.text(&self.text)
    }
}

impl crate::prepare::Prepare for VerbatimNode {
    fn prepare(&mut self, _ctx: &crate::prepare::RenderContext<'_>) -> Result<(), crate::render::CoordinateError> {
        Ok(())
    }
}

/// A string, as bare text, or an object carrying `$text`, as an `ERROR` node:
/// the form one crosses in.
#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for VerbatimNode {
    unsafe fn from_napi_value(env: ::napi::sys::napi_env, napi_val: ::napi::sys::napi_value) -> ::napi::Result<Self> {
        // SAFETY: napi calls `from_napi_value` with `napi_val` live in `env`.
        if unsafe { crate::slot::node_value_type(env, napi_val)? } == ::napi::ValueType::String {
            // SAFETY: napi calls `from_napi_value` with `napi_val` live in `env`.
            return Ok(Self { text: unsafe { String::from_napi_value(env, napi_val)? }, kind: crate::types::KindId::BLANK });
        }
        // SAFETY: napi calls `from_napi_value` with `napi_val` live in `env`.
        let text = unsafe { crate::boundary::property::<String>(env, napi_val, c"$text")? }
            .ok_or_else(|| ::napi::Error::from_reason("verbatim text arrives as a string, or as an object carrying $text"))?;
        Ok(Self { text, kind: crate::types::KindId::ERROR })
    }
}

/// The string.
#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for VerbatimNode {
    unsafe fn to_napi_value(env: ::napi::sys::napi_env, val: Self) -> ::napi::Result<::napi::sys::napi_value> {
        // SAFETY: napi calls `to_napi_value` with a live `env`, and every value encoded here is created in it.
        unsafe { <String as ::napi::bindgen_prelude::ToNapiValue>::to_napi_value(env, val.text) }
    }
}
