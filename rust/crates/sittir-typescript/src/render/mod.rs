// @generated from packages/typescript/node-model.json5 — do not hand-edit.
// Regenerate via: pnpm exec tsx packages/cli/src/cli.ts gen --grammar typescript --all --output packages/typescript/src

pub mod hash;
pub mod kind_ids;
pub mod templates;
pub mod transport;

pub use transport::{render_transport_dispatch, render_transport_parts, AnyTransport};
pub use hash::TEMPLATE_BUNDLE_HASH;
pub use kind_ids::*;
