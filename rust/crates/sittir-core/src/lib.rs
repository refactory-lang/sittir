//! sittir-core — Rust port of the `@sittir/core` hot-path engine.
//!
//! Contract surface (filled in by spec 012 Phase 2 and Phase 3):
//!
//! - [`types`]    — primitive `NodeData` + wire-boundary serde attributes (T009).
//! - [`read_node`] — `tree_sitter::Tree` → `NodeData` traversal (T022).
//! - [`prepare`]  — `NodeData` → `TemplateContext` for the per-grammar
//!   render crate (T023); also hosts the `GrammarMeta` trait.
//! - [`splice`]   — byte-level `apply_edits` on a source string (T024).
//! - [`boundary`] — (reserved) cross-FFI shape helpers; serde attrs live
//!   alongside the structs in `types` per T011.
//! - [`filters`]  — shared askama custom filters (`upper`, `lower`,
//!   `joinby`) matching TS `@sittir/core` semantics (T012).
//!
//! Phase 1 ships *only* the skeleton — every module is empty. Each
//! follow-up Phase 2/3 task fills one module and adds its tests.

pub mod boundary;
pub mod filters;
pub mod format;
pub mod prepare;
pub mod read_node;
pub mod splice;
pub mod types;
