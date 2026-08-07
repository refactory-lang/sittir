// @generated from packages/typescript/templates/*.jinja — do not hand-edit.
// Regenerate via: pnpm exec tsx packages/cli/src/cli.ts gen --grammar typescript --all --output packages/typescript/src
//
// Companion to rust/crates/sittir-typescript/src/render/hash.rs; the two must
// agree byte-for-byte at runtime for the native backend to be picked
// (FR-020). Mismatch is caught by packages/typescript/src/backend.ts and
// falls through to the TS engine silently.

export const TEMPLATE_BUNDLE_HASH = 'f4f81ea33c55b215a4498c077619435b347bbc232f95e8f8b66c4f9a59aaa5d2';
