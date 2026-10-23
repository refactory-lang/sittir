//! The library every grammar addon shares at run time.
//!
//! Each grammar package ships its own copy of this library beside its
//! addon, and the loader maps the first copy it meets and binds every later
//! addon to that same image by name. So the process holds one tree-sitter
//! runtime and one of each static here, whichever grammar asks: the tree-id
//! counter in particular. sittir-core and napi stay in each addon, because
//! napi-rs keeps its export registry in statics of its own crate, one
//! registry per addon.

pub use tree_sitter;

mod stamp;
mod tree_ids;

pub use stamp::{check_stamp, loaded_from, BUILT, LOADED};
pub use tree_ids::claim_tree_id;
