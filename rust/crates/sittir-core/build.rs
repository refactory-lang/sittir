//! sittir-core exposes `#[napi]` boundary types (`Edit`, `Span`, transport
//! structs) whose type definitions must land in the DEPENDENT napi crates'
//! generated `index.d.ts`. napi-derive only writes those type defs into the
//! CLI's per-build `NAPI_TYPE_DEF_TMP_FOLDER` while this crate's proc-macros
//! actually expand — i.e. only when cargo recompiles sittir-core.
//!
//! The napi CLI's self-healing mechanism (`NAPI_FORCE_BUILD_SITTIR_CORE`,
//! set whenever the per-crate type-def file is missing from the dts cache)
//! and its per-grammar-build folder switch only dirty a crate that emits
//! `cargo::rerun-if-env-changed` markers for them — normally done by
//! `napi_build::setup()` from a build script. Without this build script,
//! a warm cargo cache (local, or CI's Swatinem/rust-cache) skips
//! sittir-core recompilation, its type defs never reach the current build's
//! tmp folder, and `Edit`/`Span` silently vanish from
//! `rust/crates/sittir-{rust,typescript,python}/index.d.ts` —
//! nondeterministically, per whichever grammar build lost the race.
//! `assertGeneratedManifestsClean` then fails CI with
//! `MODIFIED: rust/crates/sittir-<grammar>/index.d.ts`.
//!
//! Emitting the two markers directly (rather than pulling in the full
//! `napi-build` crate) avoids `setup()`'s cdylib linker flags, which don't
//! apply to this rlib. Gated on the `napi-bindings` feature to mirror the
//! crate's napi surface gating.

fn main() {
    if std::env::var_os("CARGO_FEATURE_NAPI_BINDINGS").is_some() {
        println!("cargo::rerun-if-env-changed=NAPI_TYPE_DEF_TMP_FOLDER");
        println!("cargo::rerun-if-env-changed=NAPI_FORCE_BUILD_SITTIR_CORE");
    }
}
