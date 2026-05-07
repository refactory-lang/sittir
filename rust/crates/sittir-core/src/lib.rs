//! sittir-core — Rust port of the `@sittir/core` hot-path engine.
//!
//! Contract surface (filled in by spec 012 Phase 2 and Phase 3):
//!
//! - [`types`]    — primitive `NodeData` + wire-boundary serde attributes (T009).
//! - [`read_node`] — `tree_sitter::Tree` → `NodeData` traversal (T022).
//! - [`splice`]   — byte-level `apply_edits` on a source string (T024).
//! - [`boundary`] — (reserved) cross-FFI shape helpers; serde attrs live
//!   alongside the structs in `types` per T011.
//! - [`filters`]  — shared askama custom filters (`upper`, `lower`,
//!   `joinby`) plus flank-value helpers matching TS `@sittir/core`
//!   semantics (T012 / feature 020 cleanup).

pub mod boundary;
pub mod engine;
pub mod filters;
pub mod format;
pub mod macros;
pub mod read_node;
pub mod splice;
pub mod types;

// Flat re-export for the runtime kind discriminant — per the KindID
// runtime migration design, callers reach this as `sittir_core::KindId`
// rather than the longer `sittir_core::types::KindId`.
pub use types::KindId;
// Flat re-export for the streaming render trait — callers reach this as
// `sittir_core::RenderableTransport`.
pub use types::RenderableTransport;
// ADR-0017: ParsedTree is the owned parse result; StoredNode is the
// node handle enum. ParseResult is the JSON envelope for parse_and_read.
pub use engine::{panic_msg, ParseResult, ParsedTree, StoredNode};
