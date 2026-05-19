// @generated from packages/rust/templates/*.jinja — do not hand-edit.
// Regenerate via: npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src
//
// Companion to rust/crates/sittir-rust/src/render/hash.rs; the two must
// agree byte-for-byte at runtime for the native backend to be picked
// (FR-020). Mismatch is caught by packages/rust/src/backend.ts and
// falls through to the TS engine silently.

export const TEMPLATE_BUNDLE_HASH = '1ea3c8b3f96982d6532fc2ddfcaa9bf283bea2afcd75c56a9b49bcdfd0a4c6cd'
