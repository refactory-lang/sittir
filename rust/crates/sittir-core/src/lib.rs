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
pub mod read_node;
pub mod splice;
pub mod types;
