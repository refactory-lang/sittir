// @generated from packages/typescript/templates/*.jinja — do not hand-edit.
// Regenerate via: pnpm exec tsx packages/cli/src/cli.ts gen --grammar typescript --all --output packages/typescript/src
//
// Companion to rust/crates/sittir-typescript/src/render/hash.rs; the two must
// agree byte-for-byte at runtime for the native backend to be picked
// (FR-020). Mismatch is caught by packages/typescript/src/backend.ts and
// falls through to the TS engine silently.

export const TEMPLATE_BUNDLE_HASH = 'b65eee0bd0570d32e5f91f23079589150ebaae9e408dbc44997c14e1b6928df1';
