// @generated from packages/rust/node-model.json5 — do not hand-edit.
// Regenerate via: npx tsx packages/codegen/src/cli.ts --grammar rust --all --rust-render

pub mod hash;
pub mod templates;

pub use hash::TEMPLATE_BUNDLE_HASH;
pub use templates::{render_dispatch, RustGrammarMeta};
