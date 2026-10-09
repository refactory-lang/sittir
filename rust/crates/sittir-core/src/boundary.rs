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
    unsafe { object_from(env, fields.iter().copied()) }
}

/// One entry of `object_with_present` or `define_present`: `key` with
/// `value` encoded, or `None` when `value` is absent.
///
/// # Safety
/// `env` must be live.
#[cfg(feature = "napi-bindings")]
pub unsafe fn present<V: ::napi::bindgen_prelude::ToNapiValue>(
    env: ::napi::sys::napi_env,
    key: &'static ::std::ffi::CStr,
    value: Option<V>,
) -> ::napi::Result<Option<(&'static ::std::ffi::CStr, ::napi::sys::napi_value)>> {
    present_with(key, value, |value| unsafe { V::to_napi_value(env, value) })
}

/// One entry of `object_with_present` or `define_present`: `key` with
/// `value` encoded by `encode`, or `None` when `value` is absent.
#[cfg(feature = "napi-bindings")]
pub fn present_with<V>(
    key: &'static ::std::ffi::CStr,
    value: Option<V>,
    encode: impl FnOnce(V) -> ::napi::Result<::napi::sys::napi_value>,
) -> ::napi::Result<Option<(&'static ::std::ffi::CStr, ::napi::sys::napi_value)>> {
    value.map(|value| Ok((key, encode(value)?))).transpose()
}

/// A new object holding the fields of `fields` that are present, in their
/// order, defined in one call: a struct's fields in declaration order, an
/// absent optional one left out.
///
/// # Safety
/// Every present value must be live in `env`.
#[cfg(feature = "napi-bindings")]
pub unsafe fn object_with_present(
    env: ::napi::sys::napi_env,
    fields: &[Option<(&::std::ffi::CStr, ::napi::sys::napi_value)>],
) -> ::napi::Result<::napi::sys::napi_value> {
    unsafe { object_from(env, fields.iter().flatten().copied()) }
}

/// Defines the fields of `fields` that are present on the existing object
/// `obj`, in their order, in one call.
///
/// # Safety
/// `obj` and every present value must be live in `env`.
#[cfg(feature = "napi-bindings")]
pub unsafe fn define_present(
    env: ::napi::sys::napi_env,
    obj: ::napi::sys::napi_value,
    fields: &[Option<(&::std::ffi::CStr, ::napi::sys::napi_value)>],
) -> ::napi::Result<()> {
    let descriptors = descriptors(fields.iter().flatten().copied());
    if descriptors.is_empty() {
        return Ok(());
    }
    ::napi::check_status!(
        unsafe { ::napi::sys::napi_define_properties(env, obj, descriptors.len(), descriptors.as_ptr()) },
        "failed to define the object's fields"
    )
}

#[cfg(feature = "napi-bindings")]
unsafe fn object_from<'k>(
    env: ::napi::sys::napi_env,
    fields: impl Iterator<Item = (&'k ::std::ffi::CStr, ::napi::sys::napi_value)>,
) -> ::napi::Result<::napi::sys::napi_value> {
    unsafe { ::napi::bindgen_prelude::create_object_with_properties(env, &descriptors(fields)) }
}

/// Each field as a plain data property: writable, enumerable and
/// configurable, the property an assignment creates.
#[cfg(feature = "napi-bindings")]
fn descriptors<'k>(
    fields: impl Iterator<Item = (&'k ::std::ffi::CStr, ::napi::sys::napi_value)>,
) -> Vec<::napi::sys::napi_property_descriptor> {
    use ::napi::bindgen_prelude::sys::{napi_property_descriptor, PropertyAttributes};
    fields
        .map(|(key, value)| napi_property_descriptor {
            utf8name: key.as_ptr(),
            name: ::std::ptr::null_mut(),
            method: None,
            getter: None,
            setter: None,
            value,
            attributes: PropertyAttributes::writable | PropertyAttributes::enumerable | PropertyAttributes::configurable,
            data: ::std::ptr::null_mut(),
        })
        .collect()
}

#[cfg(feature = "napi-bindings")]
fn key_name(key: &'static ::std::ffi::CStr) -> &'static str {
    key.to_str().unwrap_or("")
}
