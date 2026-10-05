//! Cross-FFI shape helpers that don't belong on the structs themselves.
//! Serde `rename` / `skip_if_none` attrs live alongside the structs in
//! `types`; reading a wire object's properties lives here.

/// Reads the property `key` of the wire object `obj`: `None` when it is
/// undefined, otherwise its value decoded as `V`. The key is a static C
/// string, which napi resolves to V8's interned string the way a derived
/// napi object reads its fields, so no key string is created per read.
///
/// # Safety
/// `obj` must be a live value in `env`.
#[cfg(feature = "napi-bindings")]
pub unsafe fn property<V: ::napi::bindgen_prelude::FromNapiValue>(
    env: ::napi::sys::napi_env,
    obj: ::napi::sys::napi_value,
    key: &'static ::std::ffi::CStr,
) -> ::napi::Result<Option<V>> {
    unsafe { ::napi::bindgen_prelude::get_named_property_raw(env, obj, key.as_ptr())? }
        .map(|value| unsafe { V::from_napi_value(env, value) })
        .transpose()
}
