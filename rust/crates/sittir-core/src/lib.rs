//! sittir-core — Rust port of the `@sittir/core` hot-path engine.
//!
//! Contract surface:
//!
//! - [`types`]    — primitive `UntypedNode` + wire-boundary serde attributes.
//! - [`read_untyped_node`] — `tree_sitter::Tree` → `UntypedNode` traversal.
//! - [`boundary`] — cross-FFI shape helpers: a wire object's properties,
//!   read by static keys; serde attrs live alongside the structs in `types`.
//! - [`view`]     — the render-time views (`View`, `ListView`) the generated
//!   kind templates interpolate.

pub mod boundary;
pub mod classify;
pub mod engine;
pub mod format;
pub mod layout;
pub mod layout_kinds;
#[cfg(feature = "napi-bindings")]
pub mod napi_engine;
pub mod options;
pub mod prepare;
pub mod query;
pub mod read;
pub mod read_untyped_node;
pub mod render;
pub mod slot;
pub mod spacing;
pub mod trivia;
pub mod types;
pub mod verbatim;
pub mod view;

// Flat re-export for the runtime kind discriminant — per the KindID
// runtime migration design, callers reach this as `sittir_core::KindId`
// rather than the longer `sittir_core::types::KindId`.
pub use types::KindId;
// The derive that expands a transport declaration into its typed reader.
pub use sittir_transport_macros::Transport;

#[cfg(feature = "napi-bindings")]
#[doc(hidden)]
pub use ::napi as __napi;

/// The items of a derived transport's wire codec, kept only when this crate
/// is built with napi bindings, so a crate that derives `Transport` needs no
/// napi dependency or feature of its own.
#[cfg(feature = "napi-bindings")]
#[doc(hidden)]
#[macro_export]
macro_rules! napi_codec {
    ($($item:item)*) => { $($item)* };
}

/// The items of a derived transport's wire codec, dropped: this crate is
/// built without napi bindings.
#[cfg(not(feature = "napi-bindings"))]
#[doc(hidden)]
#[macro_export]
macro_rules! napi_codec {
    ($($item:item)*) => {};
}

pub use verbatim::VerbatimTransport;
// Flat re-export for the typed render sink: the sink a render writes into,
// the trait a rendered value implements against it, and the one-writer
// one-render root call.
pub use render::{
    render_to_string, CoordinateError, Render, RenderError, RenderResult, RenderSink, SourceTable,
    WhitespaceTable,
};
// Flat re-export for the transport slot carrier — generated transport
// structs name it at every slot position.
pub use prepare::{Prepare, RenderContext};
pub use slot::{NodeCoordinate, SlotValue};
// Flat re-export for the read-expansion selector — grammar crates thread
// it from the napi surface into `ParsedTree`.
pub use read_untyped_node::{error_regions, ErrorRegion, ErrorRegionKind, HandleMint, NoMint, ReadDepth, ReadModel};
// ParsedTree is the owned parse result; ParseResult is the JSON
// envelope for parse_and_read. NodeCoords is an internal implementation detail.
pub use engine::{apply_render_format, decode_handle, panic_msg, ParseResult, ParsedTree};
