//! sittir-core — Rust port of the `@sittir/core` hot-path engine.
//!
//! Contract surface (filled in by spec 012 Phase 2 and Phase 3):
//!
//! - [`types`]    — primitive `NodeData` + wire-boundary serde attributes (T009).
//! - [`read_node`] — `tree_sitter::Tree` → `NodeData` traversal (T022).
//! - [`splice`]   — byte-level `apply_edits` on a source string (T024).
//! - [`boundary`] — (reserved) cross-FFI shape helpers; serde attrs live
//!   alongside the structs in `types` per T011.
//! - [`filters`]  — the render-time views (`Renderable`, `Joined`, the
//!   slot views) and the presence check the generated bodies gate on.

pub mod boundary;
pub mod engine;
pub mod filters;
pub mod format;
pub mod macros;
#[cfg(feature = "napi-bindings")]
pub mod napi_engine;
pub mod options;
pub mod read_node;
pub mod slot;
pub mod spacing;
pub mod splice;
pub mod types;

// Flat re-export for the runtime kind discriminant — per the KindID
// runtime migration design, callers reach this as `sittir_core::KindId`
// rather than the longer `sittir_core::types::KindId`.
pub use types::KindId;
// Flat re-export for the streaming render trait — callers reach this as
// `sittir_core::RenderableTransport`.
pub use types::RenderableTransport;
// Flat re-export for the transport slot carrier — generated transport
// structs name it at every slot position.
pub use slot::SlotValue;
// Flat re-export for the read-expansion selector — grammar crates thread
// it from the napi surface into `ParsedTree`.
pub use read_node::ReadDepth;
// ADR-0017: ParsedTree is the owned parse result; ParseResult is the JSON
// envelope for parse_and_read. NodeCoords is an internal implementation detail.
pub use engine::{apply_render_format, decode_handle, panic_msg, ParseResult, ParsedTree};
