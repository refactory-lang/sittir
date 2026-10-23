//! A shared engine with napi linked into it, the way sittir-core's napi
//! bindings would bring napi along: a non-generic function that builds a
//! napi error.
pub fn refusal(reason: &str) -> napi::Error {
    napi::Error::from_reason(reason.to_owned())
}
