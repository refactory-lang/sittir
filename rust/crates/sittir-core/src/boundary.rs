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

/// A required field, read as napi's object derive reads one: `undefined` is
/// napi's missing-field error, and a value the field's type refuses is that
/// type's error decorated with `owner` and the key.
///
/// # Safety
/// `obj` must be a live object in `env`.
#[cfg(feature = "napi-bindings")]
pub unsafe fn required<V: ::napi::bindgen_prelude::FromNapiValue>(
    env: ::napi::sys::napi_env,
    obj: ::napi::sys::napi_value,
    key: &'static ::std::ffi::CStr,
    owner: &'static str,
) -> ::napi::Result<V> {
    let raw = unsafe { ::napi::bindgen_prelude::get_named_property_raw(env, obj, key.as_ptr())? };
    unsafe { ::napi::bindgen_prelude::from_raw_required_field(env, raw, owner, key_name(key)) }
}

/// An optional field, read as napi's object derive reads one: `undefined` is
/// absent, and every other value goes to the field's type, `null` included.
///
/// # Safety
/// `obj` must be a live object in `env`.
#[cfg(feature = "napi-bindings")]
pub unsafe fn optional<V: ::napi::bindgen_prelude::FromNapiValue>(
    env: ::napi::sys::napi_env,
    obj: ::napi::sys::napi_value,
    key: &'static ::std::ffi::CStr,
    owner: &'static str,
) -> ::napi::Result<Option<V>> {
    let raw = unsafe { ::napi::bindgen_prelude::get_named_property_raw(env, obj, key.as_ptr())? };
    unsafe { ::napi::bindgen_prelude::from_raw_optional_field(env, raw, owner, key_name(key)) }
}

/// The object a struct decodes from, taken as napi's object derive takes it.
///
/// # Safety
/// `value` must be a live value in `env`.
#[cfg(feature = "napi-bindings")]
pub unsafe fn object(env: ::napi::sys::napi_env, value: ::napi::sys::napi_value) -> ::napi::Result<::napi::sys::napi_value> {
    let obj = unsafe { <::napi::bindgen_prelude::Object as ::napi::bindgen_prelude::FromNapiValue>::from_napi_value(env, value)? };
    Ok(::napi::JsValue::raw(&obj))
}

/// A new object holding `fields`, defined in one call.
///
/// # Safety
/// Every value must be live in `env`.
#[cfg(feature = "napi-bindings")]
pub unsafe fn object_with(
    env: ::napi::sys::napi_env,
    fields: &[(&::std::ffi::CStr, ::napi::sys::napi_value)],
) -> ::napi::Result<::napi::sys::napi_value> {
    use ::napi::bindgen_prelude::sys::{napi_property_descriptor, PropertyAttributes};
    let descriptors: Vec<napi_property_descriptor> = fields
        .iter()
        .map(|&(key, value)| napi_property_descriptor {
            utf8name: key.as_ptr(),
            name: ::std::ptr::null_mut(),
            method: None,
            getter: None,
            setter: None,
            value,
            attributes: PropertyAttributes::writable | PropertyAttributes::enumerable | PropertyAttributes::configurable,
            data: ::std::ptr::null_mut(),
        })
        .collect();
    unsafe { ::napi::bindgen_prelude::create_object_with_properties(env, &descriptors) }
}

/// Set `key` on the object `obj`.
///
/// # Safety
/// `obj` and `value` must be live in `env`.
#[cfg(feature = "napi-bindings")]
pub unsafe fn set(
    env: ::napi::sys::napi_env,
    obj: ::napi::sys::napi_value,
    key: &'static ::std::ffi::CStr,
    value: ::napi::sys::napi_value,
) -> ::napi::Result<()> {
    unsafe { ::napi::bindgen_prelude::set_named_property_raw(env, obj, key.as_ptr(), value) }
}

#[cfg(feature = "napi-bindings")]
fn key_name(key: &'static ::std::ffi::CStr) -> &'static str {
    key.to_str().unwrap_or("")
}
