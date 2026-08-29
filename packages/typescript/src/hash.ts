// @generated from packages/typescript/templates/*.jinja — do not hand-edit.
// Regenerate via: pnpm exec tsx packages/cli/src/cli.ts gen --grammar typescript --all --output packages/typescript/src
//
// Companion to rust/crates/sittir-typescript/src/render/hash.rs; the two must
// agree byte-for-byte at runtime for the native backend to be picked
// (FR-020). Mismatch is caught by packages/typescript/src/backend.ts and
// falls through to the TS engine silently.

export const TEMPLATE_BUNDLE_HASH = 'e198971a164825c23288a47b984efd9485c0cf27955aaa1cb8f8cefa45ba950e';
