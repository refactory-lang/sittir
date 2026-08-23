// @generated from packages/python/templates/*.jinja — do not hand-edit.
// Regenerate via: pnpm exec tsx packages/cli/src/cli.ts gen --grammar python --all --output packages/python/src
//
// Companion to rust/crates/sittir-python/src/render/hash.rs; the two must
// agree byte-for-byte at runtime for the native backend to be picked
// (FR-020). Mismatch is caught by packages/python/src/backend.ts and
// falls through to the TS engine silently.

export const TEMPLATE_BUNDLE_HASH = '363fac73d3acc086d50e85eba9a4d63b6f3de9a2dddc0bc18fe421f0662e5f1a';
