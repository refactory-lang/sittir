//! Primitive `NodeData` + `FieldValue` + `Span` + `Source` + `Edit` —
//! the 8-`$`-field boundary shape that crosses JS↔Rust. See
//! data-model.md §1 for the authoritative contract.
//!
//! Spec 012 tasks T009 + T010. Serde rename + skip-if-none invariants
//! tested in `tests/boundary_roundtrip.rs` (T011).
//!
//! Invariants (enforced by struct + serde attributes):
//! - `$type`, `$source`, `$named` are required on the wire.
//! - `$fields`, `$children`, `$text`, `$span`, `$nodeId` are elided
//!   when `None` (serde `skip_serializing_if = "Option::is_none"`).
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

use napi_derive::napi;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Primitive NodeData — the wire shape. Exactly eight `$`-prefixed
/// top-level fields. Enrichment (`$variant`, etc.) is TS-side only.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct NodeData {
    #[serde(rename = "$type")]
    pub type_: String,

    #[serde(rename = "$source")]
    pub source: Source,

    #[serde(rename = "$named")]
    pub named: bool,

    #[serde(
        rename = "$fields",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub fields: Option<HashMap<String, FieldValue>>,

    #[serde(
        rename = "$children",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub children: Option<Vec<NodeData>>,

    #[serde(
        rename = "$text",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub text: Option<String>,

    #[serde(
        rename = "$span",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub span: Option<Span>,

    #[serde(
        rename = "$nodeId",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub node_id: Option<u32>,
}

/// Where a `NodeData` originated. `Ts` = `readNode` over a tree-sitter
/// tree; `Sg` = ast-grep path; `Factory` = constructed on the TS side.
///
/// Serialized as `"ts"` / `"sg"` / `"factory"` (rename_all = lowercase).
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
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub struct Span {
    pub start: u32,
    pub end: u32,
}

/// A single replacement against a source string. Napi boundary type.
///
/// `#[napi(object)]` auto-generates the N-API mapping with camelCase
/// field renaming — TS side sees `{ startPos, endPos, insertedText }`
/// per contracts/napi-api.md. `serde` mirrors that with camelCase so
/// `apply_edits` can accept JSON payloads in the TS-forced-backend
/// round-trip path.
#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Edit {
    pub start_pos: u32,
    pub end_pos: u32,
    pub inserted_text: String,
}
