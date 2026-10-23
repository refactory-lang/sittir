//! sittir-core — Rust port of the `@sittir/core` hot-path engine.
//!
//! Contract surface:
//!
//! - [`types`]    — the kind id, spans and provenance.
//! - [`read`]     — `tree_sitter::Tree` → the grammar's typed nodes.
//! - [`boundary`] — cross-FFI shape helpers: a wire object's properties,
//!   read by static keys; serde attrs live alongside the structs in `types`.
//! - [`view`]     — the render-time views (`View`, `ListView`) the generated
//!   kind templates interpolate.

pub mod baseline;
pub mod boundary;
pub mod classify;
pub mod engine;
pub mod error_read;
pub mod layout;
pub mod layout_kinds;
pub mod line_endings;
pub mod list_slots;
#[cfg(feature = "napi-bindings")]
pub mod napi_engine;
pub mod options;
pub mod points;
pub mod trivia_table;
pub mod prepare;
pub mod query;
pub mod query_scm;
pub mod non_empty;
pub use non_empty::NonEmptyVec;
pub mod read;
pub mod record;
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
// The derive that expands a node declaration into its typed reader.
pub use sittir_node_macros::Node;

/// States a grammar's trivia type once, for every node of the grammar:
/// each listed type's `HasTrivia::Trivia`, the trivia a coordinate of it
/// carries outside its span.
#[macro_export]
macro_rules! grammar_trivia {
    ($trivia:ty; $($node:ty),* $(,)?) => {
        $(impl $crate::trivia::HasTrivia for $node {
            type Trivia = $trivia;
        })*
    };
}

#[cfg(feature = "napi-bindings")]
#[doc(hidden)]
pub use ::napi as __napi;

/// The items of a derived node's wire codec, kept only when this crate
/// is built with napi bindings, so a crate that derives `Node` needs no
/// napi dependency or feature of its own.
#[cfg(feature = "napi-bindings")]
#[doc(hidden)]
#[macro_export]
macro_rules! napi_codec {
    ($($item:item)*) => { $($item)* };
}

/// The items of a derived node's wire codec, dropped: this crate is
/// built without napi bindings.
#[cfg(not(feature = "napi-bindings"))]
#[doc(hidden)]
#[macro_export]
macro_rules! napi_codec {
    ($($item:item)*) => {};
}

pub use verbatim::VerbatimNode;
pub use error_read::ErrorRead;
// Flat re-export for the typed render sink: the sink a render writes into,
// the trait a rendered value implements against it, and the one-writer
// one-render root call.
pub use render::{
    render_to_string, CoordinateError, Render, RenderError, RenderResult, RenderSink, SourceTable,
    WhitespaceTable,
};
// Flat re-export for the node slot carrier — generated node
// structs name it at every slot position.
pub use prepare::{Prepare, RenderContext};
pub use slot::{NodeCoordinate, SlotValue};
// ParsedTree is the owned parse result.
pub use engine::{decode_handle, error_regions, panic_msg, ErrorRegion, ErrorRegionKind, ParsedTree};
