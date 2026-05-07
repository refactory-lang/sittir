//! Primitive `NodeData` + `FieldValue` + `Span` + `Source` + `Edit` +
//! `KindId` — the 9-`$`-field boundary shape that crosses JS↔Rust, plus
//! the numeric kind discriminant for the KindID runtime migration. See
//! data-model.md §1 for the authoritative contract.
//!
//! Spec 012 tasks T009 + T010. Serde rename + skip-if-none invariants
//! tested in `tests/boundary_roundtrip.rs` (T011).
//! `KindId` serde/conversion tests in `tests/kind_id.rs`.
//!
//! Invariants (enforced by struct + serde attributes):
//! - `$type`, `$source`, `$named` are required on the wire.
//! - `$fields`, `$children`, `$text`, `$span`, `$nodeHandle`,
//!   `$childIndex` are elided when `None`
//!   (serde `skip_serializing_if = "Option::is_none"`).
//! - No other top-level `$`-prefixed keys are emitted — enrichment
//!   fields (`$variant`, `$raw`, supertype labels) live on the TS side.
//! - `$text` appears only on leaves (no children, no named fields).
//! - Field values in `$fields`:
//!   - `Single` for 1-arity fields,
//!   - `Multiple` for repeat fields,
//!   - `Text` for inline literal positions (anonymous tokens captured
//!     as field values).
//!
//! `Span` is intentionally narrow (`{start, end}` bytes) rather than
//! re-using `tree_sitter::Range` — row/column info never crosses the
//! boundary and would be serialized dead weight on every hop
//! (Constitution Principle X exception, documented in data-model.md §1).

#[cfg(feature = "napi-bindings")]
use napi_derive::napi;
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
#[derive(
    Debug, Clone, Copy, PartialEq, Eq, Hash,
    ::serde::Serialize, ::serde::Deserialize,
)]
#[serde(transparent)]
#[repr(transparent)]
pub struct KindId(pub u16);

impl KindId {
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

/// Leading / trailing trivia (comments) for a `NodeData`. Attached by
/// `$trivia()` on the TS side; carried across the wire for native
/// render support. Mirrors `NodeTrivia` in `@sittir/types`.
///
/// Each entry is a fully-formed `NodeData` (e.g. a `line_comment` or
/// `block_comment` factory node) that renders independently via its own
/// template.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct NodeTrivia {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub leading: Option<Vec<NodeData>>,

    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub trailing: Option<Vec<NodeData>>,
}

/// Trivia data for transport — carries only the text strings.
/// The JS side sends `$triviaData: { leading: [{$text: "..."},…], trailing: [{$text: "..."},…] }`.
/// `TransportTrivia` extracts just the `$text` from each entry, avoiding the need for
/// full `NodeData` deserialization (and `serde_json::Value`) in the transport layer.
///
/// The bridge function converts `TransportTrivia` → `NodeTrivia` by wrapping
/// each text string in a minimal `NodeData { text: Some(text), type_: KindId(0), … }`.
#[derive(Debug, Clone, Default)]
pub struct TransportTrivia {
    pub leading: Option<Vec<String>>,
    pub trailing: Option<Vec<String>>,
}

impl TransportTrivia {
    /// Convert to `NodeTrivia` by wrapping each text string in a minimal
    /// `NodeData` with `type_: KindId(0)` (trivia items render as raw text).
    fn trivia_texts_to_nodes(texts: Vec<String>) -> Vec<NodeData> {
        texts.into_iter().map(|text| NodeData {
            type_: KindId(0),
            source: Source::Factory,
            named: false,
            fields: None,
            children: None,
            text: Some(text),
            span: None,
            node_handle: None,
            child_index: None,
            trivia_data: None,
        }).collect()
    }

    /// Convert this transport trivia into the engine's `NodeTrivia` type.
    pub fn into_node_trivia(self) -> NodeTrivia {
        NodeTrivia {
            leading: self.leading.map(Self::trivia_texts_to_nodes),
            trailing: self.trailing.map(Self::trivia_texts_to_nodes),
        }
    }
}

/// Read an array of JS objects, extracting the `$text` string from each.
/// Returns `None` if the array is absent or empty.
#[cfg(feature = "napi-bindings")]
fn read_trivia_texts(obj: &::napi::bindgen_prelude::Object, key: &str) -> ::napi::Result<Option<Vec<String>>> {
    let arr: Option<Vec<::napi::bindgen_prelude::Object>> = obj.get(key)?;
    match arr {
        None => Ok(None),
        Some(items) => {
            let mut texts = Vec::with_capacity(items.len());
            for item in &items {
                let text: Option<String> = item.get("$text")?;
                if let Some(t) = text {
                    texts.push(t);
                }
            }
            if texts.is_empty() {
                Ok(None)
            } else {
                Ok(Some(texts))
            }
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for TransportTrivia {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let leading = read_trivia_texts(&obj, "leading")?;
        let trailing = read_trivia_texts(&obj, "trailing")?;
        Ok(TransportTrivia { leading, trailing })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for TransportTrivia {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        // Transport is receive-only (JS→Rust); stub satisfies trait bounds.
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ValidateNapiValue for TransportTrivia {}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::TypeName for TransportTrivia {
    fn type_name() -> &'static str {
        "TransportTrivia"
    }
    fn value_type() -> ::napi::ValueType {
        ::napi::ValueType::Object
    }
}

/// Primitive NodeData — the wire shape. Ten `$`-prefixed top-level
/// fields (nine structural + `$triviaData`). Enrichment (`$variant`,
/// etc.) is TS-side only.
///
/// `type_` is a numeric `KindId` (parser.c-derived symbol ID) rather than
/// a string kind name. JSON wire shape is `{"$type": 42}` — `KindId` is
/// `#[serde(transparent)]` so serde handles the u16 ↔ JSON number mapping
/// without an explicit custom impl. Phase B-inverse of the KindID runtime
/// migration (2026-04-30).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct NodeData {
    #[serde(rename = "$type")]
    pub type_: KindId,

    #[serde(rename = "$source")]
    pub source: Source,

    #[serde(rename = "$named")]
    pub named: bool,

    #[serde(rename = "$fields", default, skip_serializing_if = "Option::is_none")]
    pub fields: Option<HashMap<String, FieldValue>>,

    #[serde(rename = "$children", default, skip_serializing_if = "Option::is_none")]
    pub children: Option<Vec<NodeData>>,

    #[serde(rename = "$text", default, skip_serializing_if = "Option::is_none")]
    pub text: Option<String>,

    #[serde(rename = "$span", default, skip_serializing_if = "Option::is_none")]
    pub span: Option<Span>,

    /// Index into the `ParsedTree.nodes` vec — O(1) lookup for the
    /// tree-sitter `Node` that produced this `NodeData`. Stamped by
    /// `ParsedTree::push_node` after `read_node` returns. `None` on
    /// factory-constructed nodes and on nodes that haven't been
    /// registered in a node table yet.
    #[serde(rename = "$nodeHandle", default, skip_serializing_if = "Option::is_none")]
    pub node_handle: Option<u32>,

    /// Position of this node within its parent's children array.
    /// Set during `read_children` traversal. Enables O(1) child-index
    /// navigation: `parent.child(child_index)` instead of DFS by id.
    /// `None` on root nodes and factory-constructed nodes.
    #[serde(rename = "$childIndex", default, skip_serializing_if = "Option::is_none")]
    pub child_index: Option<u16>,

    /// Leading / trailing trivia (comments) attached via `$trivia()`.
    /// Present only on factory-constructed nodes that have had trivia
    /// attached — `readNode` never sets this. Each trivia item is a
    /// fully-formed `NodeData` (e.g. a `line_comment` or `block_comment`
    /// factory node) that renders independently via its own template.
    ///
    /// Mirrors `NodeTrivia` in `@sittir/types` (spec 023 T016).
    #[serde(rename = "$triviaData", default, skip_serializing_if = "Option::is_none")]
    pub trivia_data: Option<NodeTrivia>,
}

/// Where a `NodeData` originated. `Ts` = `readNode` over a tree-sitter
/// tree; `Sg` = ast-grep path; `Factory` = constructed on the TS side.
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

/// Value stored in a `NodeData`'s `$fields` map. Untagged so the wire
/// shape is simply the value (object | array | string) per entry,
/// matching the TS engine's existing `$fields` layout.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(untagged)]
pub enum FieldValue {
    Single(Box<NodeData>),
    Multiple(Vec<NodeData>),
    Text(String),
}

/// Byte-range for a `NodeData` within its source string. `start`/`end`
/// are UTF-8 byte offsets (ast-grep / tree-sitter convention).
/// `#[napi(object)]` (gated on napi-bindings feature) adds
/// `FromNapiValue` / `ToNapiValue` so transport structs can include
/// `Option<Span>` fields. Feature gate prevents napi C-symbol leakage
/// into sittir-core test binaries.
#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub struct Span {
    pub start: u32,
    pub end: u32,
}

/// A single replacement against a source string. Napi boundary type.
///
/// `#[napi(object)]` (gated on napi-bindings feature) auto-generates
/// the N-API mapping with camelCase field renaming — TS side sees
/// `{ startPos, endPos, insertedText }` per contracts/napi-api.md.
/// `serde` mirrors that with camelCase so `apply_edits` can accept
/// JSON payloads in the TS-forced-backend round-trip path.
#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Edit {
    pub start_pos: u32,
    pub end_pos: u32,
    pub inserted_text: String,
}

/// Implemented by codegen on every transport struct and on `AnyTransport`.
/// Enables structured render directly into any `Write` target without an
/// intermediate `String`. The `render_to_string` provided default allocates
/// once (for the output) rather than pre-allocating per child.
///
/// Object-safe by design: `render_into` takes `&mut dyn std::fmt::Write`
/// rather than a generic `W`, so the trait can be used as `dyn
/// RenderableTransport` in heterogeneous template struct fields (the
/// `Renderable::Transport` variant in `sittir_core::filters`).
///
/// Codegen emits `impl RenderableTransport for <Kind>Transport` for every
/// kind, delegating to the per-kind `render_<kind>_transport` function. The
/// `AnyTransport` enum also implements this trait by delegating to
/// `render_transport_dispatch`, enabling zero-copy streaming through
/// `Renderable::Transport(&node.field as &dyn RenderableTransport)`.
pub trait RenderableTransport {
    /// Render this transport value into `dest`.
    fn render_into(
        &self,
        dest: &mut dyn std::fmt::Write,
    ) -> Result<(), ::askama::Error>;

    /// Convenience: render to a fresh `String`. Calls `render_into` once.
    fn render_to_string(&self) -> Result<String, ::askama::Error> {
        let mut s = String::new();
        self.render_into(&mut s)?;
        Ok(s)
    }
}

/// Leading / trailing delimiters for a format region. Mirrors
/// `FormatBoundary` in `@sittir/types` (FR-008).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FormatBoundary {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub leading: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub trailing: Option<String>,
}

/// Per-slot separator / trailing-comma / absence hints. Mirrors
/// `FormatSlot` in `@sittir/types` (FR-008). `rename_all = "camelCase"`
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
/// `@sittir/types` (FR-008).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FormatLiteral {
    pub raw: String,
}

/// A trivia (whitespace / comment) insertion at a byte offset. Mirrors
/// `FormatTrivia` in `@sittir/types` (FR-008).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FormatTrivia {
    pub offset: u32,
    pub text: String,
}

/// Complete format record for a node kind. `kinds` enables per-kind
/// overrides nested inside a parent record. Mirrors `FormatRecord` in
/// `@sittir/types` (FR-008).
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
