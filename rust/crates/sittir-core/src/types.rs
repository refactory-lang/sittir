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

/// Primitive NodeData — the wire shape. Exactly nine `$`-prefixed
/// top-level fields. Enrichment (`$variant`, etc.) is TS-side only.
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
}

/// Where a `NodeData` originated. `Ts` = `readNode` over a tree-sitter
/// tree; `Sg` = ast-grep path; `Factory` = constructed on the TS side.
///
/// Serialized as `"ts"` / `"sg"` / `"factory"` (rename_all = lowercase).
/// `#[napi(string_enum)]` (gated on napi-bindings feature) adds
/// `FromNapiValue` / `ToNapiValue` via napi-rs string enum mapping.
/// The feature gate prevents napi C-symbol leakage into sittir-core
/// test binaries that build without Node.js.
#[cfg_attr(feature = "napi-bindings", napi(string_enum))]
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Source {
    Ts,
    Sg,
    Factory,
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
