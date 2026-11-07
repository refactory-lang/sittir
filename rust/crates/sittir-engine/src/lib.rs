//! The library every grammar addon shares at run time.
//!
//! Each grammar package ships its own copy beside its addon. The loader maps
//! the first copy it meets and binds every later addon to that image by name,
//! so a process holds one tree-sitter runtime and one of each static here,
//! whichever grammar asks. napi and sittir-core stay in each addon: napi-rs
//! keeps its export and class registries in statics of its own crate, one
//! registry per addon.

pub use tree_sitter;

mod stamp;
mod tree_ids;

pub use stamp::{stamp_mismatch, Stamp, BUILT};
pub use tree_ids::claim_tree_id;
