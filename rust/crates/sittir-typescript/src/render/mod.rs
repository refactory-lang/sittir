// @generated from packages/typescript/node-model.json5 — do not hand-edit.
// Regenerate via: npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src

pub mod bridge;
pub mod dispatch;
pub mod hash;
pub mod kind_ids;
pub mod templates;
pub mod transport;

pub use dispatch::render_dispatch;
pub use transport::{render_transport, render_transport_dispatch, render_transport_parts, AnyTransport};
pub use hash::TEMPLATE_BUNDLE_HASH;
pub use kind_ids::*;
