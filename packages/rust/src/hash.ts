// @generated from packages/rust/templates/*.jinja — do not hand-edit.
// Regenerate via: npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src
//
// Companion to rust/crates/sittir-rust/src/render/hash.rs; the two must
// agree byte-for-byte at runtime for the native backend to be picked
// (FR-020). Mismatch is caught by packages/rust/src/backend.ts and
// falls through to the TS engine silently.

export const TEMPLATE_BUNDLE_HASH = '8e6c41925c5aa91e73ac60009d819cdce3a47722428d2fb8cef3302f6b53682f'
