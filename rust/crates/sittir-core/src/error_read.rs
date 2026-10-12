//! An `ERROR` node read on its own. The model has no transport for it, so it
//! crosses as the bytes it spans, its kind and where it came from.

use crate::read::Origin;
use crate::types::KindId;

#[derive(Debug, Clone, PartialEq)]
pub struct ErrorRead {
    pub text: String,
    pub kind: Option<KindId>,
    pub at: Origin,
}

/// `{ $type, $_layout: { at } or { span }, $text }`, the form of a read leaf,
/// its `$type` the ERROR kind id.
#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for ErrorRead {
    unsafe fn to_napi_value(env: ::napi::sys::napi_env, val: Self) -> ::napi::Result<::napi::sys::napi_value> {
        use crate::boundary::{object_with, object_with_present, present};
        let kind = val.kind.map(|kind| u32::from(kind.0));
        unsafe {
            let layout = match val.at {
                Origin::Tree(at) => object_with(env, &[(c"at", crate::slot::coordinate_to_napi(env, at)?)])?,
                Origin::Snapshot(span) => object_with(env, &[(c"span", crate::points::PointSpan::to_napi_value(env, span)?)])?,
            };
            object_with_present(env, &[present(env, c"$type", kind)?, Some((c"$_layout", layout)), present(env, c"$text", Some(val.text))?])
        }
    }
}
