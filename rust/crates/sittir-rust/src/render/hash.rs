// @generated from packages/rust/templates/*.jinja — do not hand-edit.
// Regenerate via: pnpm exec tsx packages/cli/src/cli.ts gen --grammar rust --all --output packages/rust/src
//
// This file carries the SHA-256 digest of the template bundle at codegen
// time. The grammar-owned `sittir-rust` native module exports it as
// `SittirEngine.templateBundleHash`; the JS backend shim
// (packages/rust/src/backend.ts) compares it against the TS-side
// hash to detect drift between the baked Rust binary and the TS
// templates, falling through to the TS engine on mismatch (FR-020).

pub const TEMPLATE_BUNDLE_HASH: &str = "1a83f42ee082f060125cb0fa36f4cd81bf41dda5309e244c7749ee43370ffd4d";
