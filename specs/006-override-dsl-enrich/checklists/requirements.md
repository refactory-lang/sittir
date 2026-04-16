# Specification Quality Checklist: Override DSL with enrich(base)

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-04-15
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

- The authoring-audience for this spec is unusual: the "users" are grammar maintainers (developers), so some technical vocabulary (tree-sitter, DSL, grammar rules) is unavoidable. The spec treats the sittir pipeline and tree-sitter toolchain as external systems and describes behavior in terms of what maintainers author and observe, not in terms of code structure.
- No `[NEEDS CLARIFICATION]` markers. All gaps were filled with assumptions documented in the Assumptions section.

## Implementation status (verified 2026-04-15)

All requirements met by branch `006-override-dsl-enrich` (commits 073b881..HEAD).

- ✅ FR-001..003 — overrides.ts is dual-tool readable; explicit DSL imports; mechanical TS→CJS transpile to `.sittir/grammar.js` for tree-sitter CLI
- ✅ FR-004..010a — `enrich(base)` ships with kind-to-name pass + skip reporting; opt-in; pure
- ✅ FR-011..014 — `role()` per-grammar accumulator with save/restore; tree-sitter-compat (no-op outside scope); Link reads via `raw.externalRoles`
- ✅ FR-015..018 — transform path addressing, wildcards, prec-transparent descent, `alias($.name)` shorthand
- ✅ FR-019..019c — pre-evaluate phase semantics; spread-merge for supertypes/externals/extras with name-dedupe; scalar replacement for word
- ✅ FR-020..021 — enrich operates pre-Evaluate (FR-020 reframed); fidelity ceilings hold
- ✅ FR-022 — tree-sitter generate validated end-to-end for python/rust/typescript
- ✅ FR-023 — existing fidelity-ceiling CI gate preserved
- ✅ Pre-evaluate invariant test (Phase 8) passing — 9/9 covers known rule types, no leaked sittir placeholders, RawGrammar shape constrained to documented sidecar set
- ✅ Workspace: 1107/1107 tests pass, type-check clean across all packages, lint 0 errors

Deferred to follow-up specs:
- Re-enable keyword-prefix promotion in enrich after rust/python regression root cause
- Remove `promoteOptionalKeywordFields` from Link once enrich subsumes it
- Major architectural cleanup: switch sittir's pipeline to consume override-compiled parse trees, deleting Link's `inferFieldNames`/`promotePolymorph`/`promoteOptionalKeywordFields` and wrap.ts/readNode promotion heuristics (the `node-types.json` from override-compiled python confirms field labels survive into the parse tree natively)
- CI workflow update to run `tree-sitter generate` per grammar (transpile infrastructure exists; CI step is the missing piece)
