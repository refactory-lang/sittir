//! sittir-core — Rust port of the `@sittir/core` hot-path engine.
//!
//! Contract surface:
//!
//! - [`types`]    — primitive `NodeData` + wire-boundary serde attributes.
//! - [`read_node`] — `tree_sitter::Tree` → `NodeData` traversal.
//! - [`splice`]   — byte-level `apply_edits` on a source string.
//! - [`boundary`] — (reserved) cross-FFI shape helpers; serde attrs live
//!   alongside the structs in `types`.
//! - [`view`]     — the render-time views (`View`, `ListView`) the generated
//!   kind templates interpolate.

pub mod boundary;
pub mod engine;
pub mod format;
pub mod macros;
#[cfg(feature = "napi-bindings")]
pub mod napi_engine;
pub mod options;
pub mod read_node;
pub mod render;
pub mod slot;
pub mod spacing;
pub mod splice;
pub mod types;
pub mod view;

// Flat re-export for the runtime kind discriminant — per the KindID
// runtime migration design, callers reach this as `sittir_core::KindId`
// rather than the longer `sittir_core::types::KindId`.
pub use types::KindId;
// Flat re-export for the typed render sink — every generated render
// function and the `Render` impls it calls reach these here.
pub use render::{Render, RenderError, RenderResult, RenderSink, WhitespaceTable};
// Flat re-export for the transport slot carrier — generated transport
// structs name it at every slot position.
pub use slot::SlotValue;
// Flat re-export for the read-expansion selector — grammar crates thread
// it from the napi surface into `ParsedTree`.
pub use read_node::ReadDepth;
// ParsedTree is the owned parse result; ParseResult is the JSON
// envelope for parse_and_read. NodeCoords is an internal implementation detail.
pub use engine::{apply_render_format, decode_handle, panic_msg, ParseResult, ParsedTree};
