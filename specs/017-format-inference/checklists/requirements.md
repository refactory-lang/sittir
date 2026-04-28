# Specification Quality Checklist: Format Inference

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-04-25
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- Items marked incomplete require spec updates before `/speckit.clarify` or `/speckit.plan`.
- This is an internal-tooling feature; "user" in the user-stories sense is "a maintainer working on the codegen pipeline or a codemod author consuming Sittir's render path." The checklist's "non-technical stakeholders" item is interpreted as "non-codegen-internals-experts" — the spec uses domain terms (NodeData, render, parse, factory) that are unavoidable for this feature, but explains them in context.
- Implementation-shaped names (`$format`, `readNode`, `node.replace`, `node.toEdit`, `@sittir/core`, `@sittir/types`, `SITTIR_BACKEND`) appear in the spec as load-bearing identifiers — they are the existing public surface or established architectural terms 017 extends, not implementation details introduced by 017 itself. Removing them would force vague paraphrase ("the parse-time function", "the runtime layer") that obscures the contract. Same convention as 016's spec.
- "Format" is used throughout in the structural sense — the source-derived information that template-canonical rendering loses. It is NOT used in the formatter / pretty-printer sense (explicitly out of scope; called out in the Out of Scope section).
- Dependencies on spec 016 are explicit but no longer contradictory: if 016 finishes with format-deferred fixtures, 017 absorbs them into `format-corpus.json`; if 016 finishes with an empty deferred set (016's expected outcome), 017 seeds its own corpus from fresh measurement. Captured in the Assumptions section and SC-002.
- The previous 90%-threshold wording was removed because it left planning ambiguity. SC-001/SC-003 now bind 017 to 100% of a committed acceptance manifest (`format-corpus.json`), which is concrete enough for later planning while still allowing the plan to decide how that corpus is collected.
- No `[NEEDS CLARIFICATION]` markers required. The three areas where a clarification was considered:
  1. Exact `$format` record field names inside the four required substructures (`boundary`, `slots`, `literals`, `trivia`) — committed to in FR-001; finer schema design is plan-phase work, not a spec-level open question.
  2. Whether per-grammar `.jinja` templates need format hooks vs format applied "around" the template — deferred to the plan; the spec treats it as an implementation choice that doesn't change the user-visible contract.
  3. Comment-attachment semantics — explicitly out of scope (Out of Scope + Edge Cases). Stored as positional offsets only.
   None of these block planning; all are plan-phase commitments, not user-visible-contract decisions.
