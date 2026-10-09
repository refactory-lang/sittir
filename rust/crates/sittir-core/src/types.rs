//! The values every crate shares: the numeric kind discriminant (`KindId`)
//! and parser field id, a node's provenance (`Source`), its byte span, and
//! the format record a parse detects.
//!
//! `Span` is intentionally narrow (`{start, end}` bytes) rather than
//! re-using `tree_sitter::Range` — row/column info never crosses the
//! boundary and would be serialized dead weight on every hop.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Numeric runtime kind discriminant. The wire shape (`$type` on
/// `AnyTransport` JSON) uses this directly. Per the KindID runtime
/// migration design (2026-04-30): u16 is wide enough for any
/// tree-sitter grammar's parser symbol space (rust grammar ≈ 411
/// symbols, well under u16 max = 65535).
///
/// `KindId` is a transparent newtype so `serde` decodes JSON numeric
/// `$type` directly into it without an enum variant table — per-
/// grammar `AnyTransport` enums dispatch on the inner u16.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, ::serde::Serialize, ::serde::Deserialize)]
#[serde(transparent)]
#[repr(transparent)]
pub struct KindId(pub u16);

impl KindId {
    /// tree-sitter's builtin ERROR symbol (`ts_builtin_sym_error`): the kind
    /// of the node error recovery wraps unparsable source in. It is issued by
    /// tree-sitter itself, not by any grammar, so every grammar shares it.
    pub const ERROR: KindId = KindId(u16::MAX);

    pub const fn new(id: u16) -> Self {
        Self(id)
    }
    pub const fn get(self) -> u16 {
        self.0
    }
}

impl ::std::fmt::Display for KindId {
    fn fmt(&self, f: &mut ::std::fmt::Formatter<'_>) -> ::std::fmt::Result {
        ::std::fmt::Display::fmt(&self.0, f)
    }
}

impl From<u16> for KindId {
    fn from(id: u16) -> Self {
        Self(id)
    }
}

impl From<KindId> for u16 {
    fn from(id: KindId) -> u16 {
        id.0
    }
}

/// A parser field id: the index of a field name in `parser.c`'s field table,
/// the value `TreeCursor::field_id` returns for a child tagged with it.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct FieldId(pub u16);

/// Where a node originated. `Ts` = read from a tree-sitter tree; `Sg` =
/// ast-grep path; `Factory` = constructed on the TS side.
///
/// Wire shape is a numeric u8: 0 = Ts, 1 = Sg, 2 = Factory.
/// Eliminates the napi string_enum PascalCase casing mismatch that caused
/// `value "ts" does not match any variant of enum Source` errors.
///
/// napi `FromNapiValue`/`ToNapiValue` impls (gated on napi-bindings
/// feature) read/write a JS number. The feature gate prevents napi
/// C-symbol leakage into sittir-core test binaries.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
pub enum Source {
    Ts = 0,
    Sg = 1,
    Factory = 2,
}

impl Serialize for Source {
    fn serialize<S: serde::Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        s.serialize_u8(*self as u8)
    }
}

impl<'de> Deserialize<'de> for Source {
    fn deserialize<D: serde::Deserializer<'de>>(d: D) -> Result<Self, D::Error> {
        let v = u8::deserialize(d)?;
        match v {
            0 => Ok(Source::Ts),
            1 => Ok(Source::Sg),
            2 => Ok(Source::Factory),
            _ => Err(serde::de::Error::custom(format!("invalid source: {v}"))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl napi::bindgen_prelude::FromNapiValue for Source {
    unsafe fn from_napi_value(
        env: napi::sys::napi_env,
        val: napi::sys::napi_value,
    ) -> napi::Result<Self> {
        let n = u32::from_napi_value(env, val)?;
        match n {
            0 => Ok(Source::Ts),
            1 => Ok(Source::Sg),
            2 => Ok(Source::Factory),
            _ => Err(napi::Error::from_reason(format!("invalid source: {n}"))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl napi::bindgen_prelude::ToNapiValue for Source {
    unsafe fn to_napi_value(
        env: napi::sys::napi_env,
        val: Self,
    ) -> napi::Result<napi::sys::napi_value> {
        u32::to_napi_value(env, val as u32)
    }
}

#[cfg(feature = "napi-bindings")]
impl napi::bindgen_prelude::ValidateNapiValue for Source {}

#[cfg(feature = "napi-bindings")]
impl napi::bindgen_prelude::TypeName for Source {
    fn type_name() -> &'static str {
        "Source"
    }
    fn value_type() -> napi::ValueType {
        napi::ValueType::Number
    }
}

/// Byte-range for a node within its source string. `start`/`end`
/// are UTF-8 byte offsets (ast-grep / tree-sitter convention). It crosses
/// the boundary as `{ start, end }`, read and written by the codec below,
/// which every coordinate and gap uses.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub struct Span {
    pub start: u32,
    pub end: u32,
}

#[cfg(feature = "napi-bindings")]
impl napi::bindgen_prelude::FromNapiValue for Span {
    unsafe fn from_napi_value(env: napi::sys::napi_env, napi_val: napi::sys::napi_value) -> napi::Result<Self> {
        let obj = unsafe { crate::boundary::object(env, napi_val)? };
        Ok(Self {
            start: unsafe { crate::boundary::required(env, obj, c"start", "Span")? },
            end: unsafe { crate::boundary::required(env, obj, c"end", "Span")? },
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl napi::bindgen_prelude::ToNapiValue for Span {
    unsafe fn to_napi_value(env: napi::sys::napi_env, val: Self) -> napi::Result<napi::sys::napi_value> {
        unsafe {
            crate::boundary::object_with(env, &[
                (c"start", u32::to_napi_value(env, val.start)?),
                (c"end", u32::to_napi_value(env, val.end)?),
            ])
        }
    }
}

/// Leading / trailing delimiters for a format region. Mirrors
/// `FormatBoundary` in `@sittir/types`.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FormatBoundary {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub leading: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub trailing: Option<String>,
}

/// Per-slot separator / trailing-comma / absence hints. Mirrors
/// `FormatSlot` in `@sittir/types`. `rename_all = "camelCase"`
/// maps `trailing_present` → `trailingPresent` on the wire.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct FormatSlot {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sep: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub trailing_present: Option<bool>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub absent: Option<bool>,
}

/// A fixed literal token value override. Mirrors `FormatLiteral` in
/// `@sittir/types`.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FormatLiteral {
    pub raw: String,
}

/// A trivia (whitespace / comment) insertion at a byte offset. Mirrors
/// `FormatTrivia` in `@sittir/types`.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FormatTrivia {
    pub offset: u32,
    pub text: String,
}

/// Complete format record for a node kind. `kinds` enables per-kind
/// overrides nested inside a parent record. Mirrors `FormatRecord` in
/// `@sittir/types`.
///
/// The recursive `kinds` field is fine in Rust because `HashMap` is
/// heap-allocated, so the struct size is statically bounded.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FormatRecord {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub boundary: Option<FormatBoundary>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub slots: Option<HashMap<String, FormatSlot>>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub literals: Option<HashMap<String, FormatLiteral>>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub trivia: Option<Vec<FormatTrivia>>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub kinds: Option<HashMap<String, FormatRecord>>,
}

#[cfg(test)]
mod format_tests {
    use super::*;

    #[test]
    fn format_record_json_roundtrip() {
        let record = FormatRecord {
            boundary: Some(FormatBoundary {
                leading: Some("    ".to_string()),
                trailing: Some("\n".to_string()),
            }),
            slots: None,
            literals: None,
            trivia: None,
            kinds: None,
        };
        let json = serde_json::to_string(&record).unwrap();
        let back: FormatRecord = serde_json::from_str(&json).unwrap();
        assert_eq!(record, back);
    }

    #[test]
    fn format_record_skip_none_fields() {
        let record = FormatRecord {
            boundary: None,
            slots: None,
            literals: None,
            trivia: None,
            kinds: None,
        };
        let json = serde_json::to_string(&record).unwrap();
        assert_eq!(json, "{}");
    }
}
