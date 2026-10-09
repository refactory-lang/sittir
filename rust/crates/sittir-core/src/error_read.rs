//! An `ERROR` node read on its own. The model has no transport for it, so it
//! crosses as the bytes it spans and its coordinate.

use crate::slot::NodeCoordinate;

#[derive(Debug, Clone, PartialEq)]
pub struct ErrorRead {
    pub text: String,
    pub at: NodeCoordinate,
}

/// `{ $type, $_layout: { at }, $text }`, the form of a read leaf, its `$type`
/// the coordinate's kind (the ERROR kind id).
#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for ErrorRead {
    unsafe fn to_napi_value(env: ::napi::sys::napi_env, val: Self) -> ::napi::Result<::napi::sys::napi_value> {
        use crate::boundary::{object_with, object_with_present, present};
        let kind = val.at.kind.map(|kind| u32::from(kind.0));
        unsafe {
            let layout = object_with(env, &[(c"at", crate::slot::coordinate_to_napi(env, val.at)?)])?;
            object_with_present(env, &[present(env, c"$type", kind)?, Some((c"$_layout", layout)), present(env, c"$text", Some(val.text))?])
        }
    }
}
