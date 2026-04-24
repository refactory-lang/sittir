# Feature Specification: Promote `sittir-core` to a publishable crate (US2)

**Status**: deferred — placeholder for the Release 2 user story split
out of [012-rust-core-port](../012-rust-core-port/spec.md) per the
clarification Approach A decision (Q1 in `012-rust-core-port/spec.md`
§ Clarifications).

## Summary

Spec 012 ships the Rust port of `@sittir/core` as an internal engine
loaded only via the `@sittir/<grammar>-native` napi binding packages;
the Rust crate `sittir-core` is intentionally NOT published to
crates.io for the MVP (FR-018). This follow-up feature lifts that
restriction:

- Promote `sittir-core` to a public crate on crates.io with a stable
  versioning policy.
- Expose a Rust-native consumer API independent of the napi
  bindings, so downstream Rust applications can render / readNode /
  splice without going through Node.js.
- Address the prerequisite the deferral identified — full enrichment
  semantics or a data-driven manifest equivalent (a follow-on to
  FR-005a in 012's Requirements).

See [`specs/012-rust-core-port/spec.md` § Deferred / Future Work →
"Release 2 (indicative)"](../012-rust-core-port/spec.md#deferred--future-work-informational-not-mvp-scope)
for the original framing. This file exists to anchor the speckit
directory; full spec authoring (User Scenarios, Requirements,
Success Criteria, etc.) lands when the work is scheduled.
