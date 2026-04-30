// @generated from packages/rust/node-model.json5 — do not hand-edit.
// Regenerate via: npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src

pub mod hash;
pub mod templates;

pub use hash::TEMPLATE_BUNDLE_HASH;
pub use templates::{render_dispatch, render_transport, render_transport_parts, AnyTransport};
