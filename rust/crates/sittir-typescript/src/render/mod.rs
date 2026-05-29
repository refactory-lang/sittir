// @generated from packages/typescript/node-model.json5 — do not hand-edit.
// Regenerate via: pnpm exec tsx packages/cli/src/cli.ts gen --grammar typescript --all --output packages/typescript/src

pub mod bridge;
pub mod dispatch;
pub mod hash;
pub mod kind_ids;
pub mod templates;
pub mod transport;

#[deprecated(note = "legacy direct NodeData render bridge; normal native flow uses render_transport_dispatch via typed transport")]
pub use bridge::render_nodedata_into;
#[deprecated(note = "legacy direct NodeData render entrypoint; normal native flow uses render_transport_dispatch via typed transport")]
pub use dispatch::render_dispatch;
pub use transport::{render_transport, render_transport_dispatch, render_transport_parts, AnyTransport};
pub use hash::TEMPLATE_BUNDLE_HASH;
pub use kind_ids::*;
