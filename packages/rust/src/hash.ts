// @generated from packages/rust/templates/*.jinja — do not hand-edit.
// Regenerate via: pnpm exec tsx packages/cli/src/cli.ts gen --grammar rust --all --output packages/rust/src
//
// Companion to rust/crates/sittir-rust/src/render/hash.rs; the two must
// agree byte-for-byte at runtime for the native backend to be picked
// (FR-020). Mismatch is caught by packages/rust/src/backend.ts and
// falls through to the TS engine silently.

export const TEMPLATE_BUNDLE_HASH = '2e03a57055a721f6307d40f40d5c314501b79df0b2e156d61c6ffc6b6e0150db';
