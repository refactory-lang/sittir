//! The values every crate shares: the numeric kind discriminant (`KindId`)
//! and parser field id, a node's provenance (`Source`), and its byte span.
//!
//! `Span` is intentionally narrow (`{start, end}` bytes) rather than
//! re-using `tree_sitter::Range` — row/column info never crosses the
//! boundary and would be serialized dead weight on every hop.

use serde::{Deserialize, Serialize};

/// Declares a numeric id of one domain: a transparent newtype over its
/// width, so ids of two domains never pass for each other. It crosses serde
/// and the napi boundary as a plain number, and `index` is the one widening
/// to `usize` for a table the id keys.
macro_rules! id_newtype {
    ($(#[$meta:meta])* $name:ident($repr:ty)) => {
        $(#[$meta])*
        #[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, ::serde::Serialize, ::serde::Deserialize)]
        #[serde(transparent)]
        #[repr(transparent)]
        pub struct $name(pub $repr);

        impl $name {
            pub const fn new(id: $repr) -> Self {
                Self(id)
            }
            pub const fn get(self) -> $repr {
                self.0
            }
            /// The id as an index into a table it keys.
            pub const fn index(self) -> usize {
                self.0 as usize
            }
        }

        impl ::std::fmt::Display for $name {
            fn fmt(&self, f: &mut ::std::fmt::Formatter<'_>) -> ::std::fmt::Result {
                ::std::fmt::Display::fmt(&self.0, f)
            }
        }

        impl From<$repr> for $name {
            fn from(id: $repr) -> Self {
                Self(id)
            }
        }

        impl From<$name> for $repr {
            fn from(id: $name) -> $repr {
                id.0
            }
        }

        #[cfg(feature = "napi-bindings")]
        impl napi::bindgen_prelude::FromNapiValue for $name {
            unsafe fn from_napi_value(env: napi::sys::napi_env, val: napi::sys::napi_value) -> napi::Result<Self> {
                unsafe { <$repr as napi::bindgen_prelude::FromNapiValue>::from_napi_value(env, val) }.map(Self)
            }
        }

        #[cfg(feature = "napi-bindings")]
        impl napi::bindgen_prelude::ToNapiValue for $name {
            unsafe fn to_napi_value(env: napi::sys::napi_env, val: Self) -> napi::Result<napi::sys::napi_value> {
                unsafe { <$repr as napi::bindgen_prelude::ToNapiValue>::to_napi_value(env, val.0) }
            }
        }

        #[cfg(feature = "napi-bindings")]
        impl napi::bindgen_prelude::ValidateNapiValue for $name {}

        #[cfg(feature = "napi-bindings")]
        impl napi::bindgen_prelude::TypeName for $name {
            fn type_name() -> &'static str {
                "number"
            }
            fn value_type() -> napi::ValueType {
                napi::ValueType::Number
            }
        }
    };
}

id_newtype! {
    /// A kind id: the parser's symbol for a node or token kind, the `$type`
    /// a transport carries. u16 is tree-sitter's own `TSSymbol` width.
    KindId(u16)
}

impl KindId {
    /// tree-sitter's builtin ERROR symbol (`ts_builtin_sym_error`): the kind
    /// of the node error recovery wraps unparsable source in. It is issued by
    /// tree-sitter itself, not by any grammar, so every grammar shares it.
    pub const ERROR: KindId = KindId(u16::MAX);

    /// The blank kind: no node. An optional choice site's empty arm, and the
    /// arm a spacing site writes nothing for.
    pub const BLANK: KindId = KindId(0);
}

impl Default for KindId {
    fn default() -> Self {
        Self::BLANK
    }
}

id_newtype! {
    /// A parser field id: the index of a field name in `parser.c`'s field
    /// table, the value `TreeCursor::field_id` returns for a child tagged with it.
    FieldId(u16)
}

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
