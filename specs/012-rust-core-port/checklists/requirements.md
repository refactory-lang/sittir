# Specification Quality Checklist: Rust Port of `@sittir/core`

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-04-22
**Last updated**: 2026-04-22 (post-clarify)
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)  *(see notes)*
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders  *(see notes)*
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)  *(see notes)*
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded  *(MVP boundary now explicit via FR-018 and Deferred/Future Work section)*
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification  *(see notes)*

## Clarification decisions absorbed (from `/speckit-superb-clarify`)

- **Q1 — Release shape:** Approach A (phased, P1 first). MVP is native addon + TS fallback. WASM and crates.io are named future releases. Captured in: `Input` paragraph, US2 + US3 status markers, FR-001, FR-004, FR-018, Deferred/Future Work section, SC-DEF-01/02.
- **Q2 — Correctness bar:** Approach C (byte-identical render; semantic round-trip). Captured in: FR-002a, FR-002b, edge-cases entries for render vs. splice drift, SC-001a, SC-001b.
- **Q3 — Platform matrix:** Approach B (standard napi-rs, 7 prebuilts). Captured in: FR-017, SC-006.
- **Q4 — readNode port scope:** Approach C (primitive in Rust; enrichment in TS). Captured in: `Input` paragraph, FR-005, FR-005a, FR-007, FR-011, Key Entities split into primitive vs. consumer-facing NodeData, SC-007.

## Notes

**On implementation-detail leak**: This feature is an engine port; the named artifacts (`sittir-core`, `.jinja` templates, napi-rs, tree-sitter, NodeData, TemplateContext) are intrinsic to *what* the feature is, not *how* it happens to be built. The spec names them as contract surfaces (what consumers see, what must round-trip parity-correctly, what must not appear as bespoke layers). Accepted as necessary specificity for a port spec; the subset that's genuinely implementation-leaky (specific crate names like askama) has been relaxed to "a compile-time Jinja template engine" where possible.

**On non-technical stakeholder readability**: User stories are framed around roles (codemod author, Rust consumer, browser/edge developer) and concrete outcomes. US2 and US3 retain their role framing but now carry explicit "Status: deferred" markers so the MVP boundary reads unambiguously.

**On clarifications**: Zero [NEEDS CLARIFICATION] markers. Four candidates (performance threshold, fallback diagnostic shape, fixture coverage floor, NodeData wire contract exact shape) are captured in the `Open Questions` section of the spec for `/speckit.clarify` or `/speckit.plan` to pick up. None are MVP-blocking — the load-bearing scope/correctness decisions are pinned.

**Remaining validation considerations for the `/speckit.clarify` phase**:

1. **Minimum NodeData wire contract** — exact field list the Rust side serializes (per FR-005a). Derivable from current `readNode.ts` output minus TS-computed derivations; can be pinned pre-implementation.
2. **Edit-path batching shape** — per-edit vs. batched render crossings; candidate FR-019.
3. **Engine-version / template-bundle compatibility check** — content hash vs. semver vs. generated-at timestamp.
4. **Parity fixture generation procedure** — auto-extract vs. hand-author.

None block the current validation — they are candidates for `/speckit.clarify` or `/speckit.plan` to refine.
