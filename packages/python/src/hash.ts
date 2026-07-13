// @generated from packages/python/templates/*.jinja — do not hand-edit.
// Regenerate via: pnpm exec tsx packages/cli/src/cli.ts gen --grammar python --all --output packages/python/src
//
// Companion to rust/crates/sittir-python/src/render/hash.rs; the two must
// agree byte-for-byte at runtime for the native backend to be picked
// (FR-020). Mismatch is caught by packages/python/src/backend.ts and
// falls through to the TS engine silently.

export const TEMPLATE_BUNDLE_HASH = 'fcb5d972d6067c02c2959b0e45ccfb81c829881642e8fbcc8cf223affed6b48f'
