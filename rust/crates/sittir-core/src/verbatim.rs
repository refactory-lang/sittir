//! Text that is a slot's content with no kind of its own: a bare string in a
//! slot whose members all render from their own text, where the variant tag
//! is render-invisible and picking one would be a guess.

use crate::render::{Render, RenderResult, RenderSink};

#[derive(Debug, Clone, PartialEq)]
pub struct VerbatimTransport {
    pub text: String,
}

impl Render for VerbatimTransport {
    fn render(&self, w: &mut dyn RenderSink) -> RenderResult {
        w.text(&self.text)
    }
}

impl crate::prepare::Prepare for VerbatimTransport {
    fn prepare(&mut self, _ctx: &crate::prepare::RenderContext<'_>) -> Result<(), crate::render::CoordinateError> {
        Ok(())
    }
}

/// A string, or an object carrying `$text` (the form an `ERROR` node crosses in).
#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for VerbatimTransport {
    unsafe fn from_napi_value(env: ::napi::sys::napi_env, napi_val: ::napi::sys::napi_value) -> ::napi::Result<Self> {
        if unsafe { crate::slot::transport_value_type(env, napi_val)? } == ::napi::ValueType::String {
            return Ok(Self { text: unsafe { String::from_napi_value(env, napi_val)? } });
        }
        let text = unsafe { crate::boundary::property::<String>(env, napi_val, c"$text")? }
            .ok_or_else(|| ::napi::Error::from_reason("verbatim text arrives as a string, or as an object carrying $text"))?;
        Ok(Self { text })
    }
}

/// The string.
#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for VerbatimTransport {
    unsafe fn to_napi_value(env: ::napi::sys::napi_env, val: Self) -> ::napi::Result<::napi::sys::napi_value> {
        unsafe { <String as ::napi::bindgen_prelude::ToNapiValue>::to_napi_value(env, val.text) }
    }
}
