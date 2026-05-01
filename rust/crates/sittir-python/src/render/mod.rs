// @generated from packages/python/node-model.json5 — do not hand-edit.
// Regenerate via: npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src

pub mod hash;
pub mod kind_ids;
pub mod templates;

pub use hash::TEMPLATE_BUNDLE_HASH;
pub use kind_ids::*;
pub use templates::{render_dispatch, render_transport, render_transport_dispatch, render_transport_parts, AnyTransport};
