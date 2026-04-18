# Specification Quality Checklist: Factory & Ergonomic Surface Cleanup

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-04-17
**Feature**: [spec.md](../spec.md)

## Content Quality

- [X] No implementation details (languages, frameworks, APIs)
- [X] Focused on user value and business needs
- [X] Written for non-technical stakeholders
- [X] All mandatory sections completed

## Requirement Completeness

- [X] No [NEEDS CLARIFICATION] markers remain
- [X] Requirements are testable and unambiguous
- [X] Success criteria are measurable
- [X] Success criteria are technology-agnostic (no implementation details)
- [X] All acceptance scenarios are defined
- [X] Edge cases are identified
- [X] Scope is clearly bounded
- [X] Dependencies and assumptions identified

## Feature Readiness

- [X] All functional requirements have clear acceptance criteria
- [X] User scenarios cover primary flows
- [X] Feature meets measurable outcomes defined in Success Criteria
- [X] No implementation details leak into specification

## Notes

- Stakeholders on this spec are sittir contributors and consumers of the generated packages. "Non-technical" here means framework-agnostic, not syntax-agnostic — the spec describes TypeScript constructs (type guards, declaration merging, namespace sugar) because the feature exists at that level.
- Success criteria SC-002, SC-003, SC-004, SC-005, SC-005a, SC-005b are measurable via grep against generated output — directly verifiable without implementation.
- User feedback from design review, incorporated through multiple rounds:
  1. Initial proposal: extract 297 inline dual-access casts into a `_f(input, snake, camel)` helper.
  2. Rejection round 1: helper hides intent at callsite. Proposal: keep inline, add negative requirement.
  3. Rejection round 2 (user): even generic typing of `_f` wouldn't solve it, because the deeper question is *why* `.from()` reads snake-keyed fields at all. `.from()`'s actual semantic is "translate loose bag to fluent." On NodeData input, it's identity — nothing to resolve.
  4. Final: `.from()` branches on `isNodeData(input)` — quick-return identity on NodeData (which is always fluent in practice, per assumption), single-access camelCase reads on bag. Snake-keyed `.fields[...]` path eliminated entirely.
- Grouped sub-namespaces confirmed in-scope with User Story 5 priority promoted from P3 → P2 (per user feedback).
- Open follow-up acknowledged: fluent setters for raw TreeNodes / plain `readNode` NodeData. Out of scope here; called out in Assumptions and Out of Scope so the premise is explicit.
- **US6 (lint-clean generated output) added post-initial-spec** after user pointed out that generated code had never been linted. Pre-triage run surfaced 142 warnings across three rules — all emitter-level fixes, no Category B/C (suppression/accept). Added as P2 with FR-035..FR-039 and SC-013..SC-014. Landing order placed last so the zero-warnings floor is established against the final emitter state (see research.md R-011 updated rationale).
