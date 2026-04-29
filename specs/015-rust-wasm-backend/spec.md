# Feature Specification: WASM backend for browser / edge runtimes (US3)

**Status**: deferred — placeholder for the Release 3 user story split
out of [012-rust-core-port](../012-rust-core-port/spec.md) per the
clarification Approach A decision (Q1 in `012-rust-core-port/spec.md`
§ Clarifications).

## Summary

Spec 012 ships the Rust port of `@sittir/core` exclusively through
the napi bindings, with a silent fallback to the TypeScript engine
when napi fails (FR-001). Browser and edge-runtime consumers do not
have access to napi, so they currently always run the TS engine.
This follow-up feature adds a WASM backend:

- Compile `sittir-core` to a `wasm32-unknown-unknown` artifact via
  `wasm-bindgen` (or equivalent), shipped as `@sittir/<grammar>-wasm`
  packages.
- Re-introduce the three-tier fallback chain noted in 012's deferred-
  work entry: native → WASM → TS. The selection algorithm in
  `packages/<grammar>/src/backend.ts` extends the existing two-tier
  algorithm; the contract from 012's `contracts/backend-selection.md`
  is the starting point.
- Validate that the WASM build produces byte-identical render output
  to the napi build (parity gate on top of 012's TS-vs-Rust gate).

See [`specs/012-rust-core-port/spec.md` § Deferred / Future Work →
"Release 3 (indicative)"](../012-rust-core-port/spec.md#deferred--future-work-informational-not-mvp-scope)
for the original framing. This file exists to anchor the speckit
directory; full spec authoring (User Scenarios, Requirements,
Success Criteria, etc.) lands when the work is scheduled.
