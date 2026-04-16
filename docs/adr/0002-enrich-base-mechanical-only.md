# ADR 0002 — enrich(base) applies only mechanical transformations

**Status**: Accepted
**Date**: 2026-04-15
**Related**: specs/006-override-dsl-enrich/, ADR-0001

## Context

Several low-risk grammar improvements (promoting a leading keyword into a named field, wrapping a single-kind reference as a field, normalizing `seq(X, repeat(X))` to `repeat1(X)`) are currently being re-derived by hand in every grammar's `overrides.ts`, and some of them live invisibly inside sittir's Link phase. Maintainers cannot tell what transformations will be applied to a base grammar by reading the override file alone. We want these applied automatically.

We also discussed more ambitious auto-inference — "this field name is used in 60% of similar rules, let's apply it everywhere" — which would save more hand-authoring but requires thresholds, counts, and judgment calls.

## Forcing Constraint

> "for enrich base, let's do only auto-appliable transformations, e.g. kind to name, when there is no collision; not name inference based on 'high' usage, or even consistent usage, since that should be authored by hand"

## Alternatives Considered

- **Include heuristic inference in enrich**: would reduce hand-authored overrides further, but every heuristic introduces a "why did this happen?" mystery the maintainer can't debug without reading compiler source. Rejected.
- **Keep mechanical passes in Link (status quo)**: maintainers still can't see them by reading overrides.ts. Rejected.
- **Expose a lower-level `applyPass()` API**: maintainers opt into individual passes. Rejected as overkill for three well-defined mechanical rules.

## Decision

`enrich(base)` is a pure function that accepts a base tree-sitter grammar and returns an enriched one with exactly these passes applied: (1) keyword-prefix field promotion, (2) unambiguous kind-to-name field wrapping (skipped on any naming collision), (3) `seq(X, repeat(X))` → `repeat1(X)` normalization. No thresholds, no counts, no "this is common enough." Heuristic inference stays as hand-authored suggestions. Existing Link-phase mechanical passes move into enrich; Link stops performing them. Wrapping is opt-in: `grammar(enrich(base), {...})` vs `grammar(base, {...})` both work.

## Principles Applied

- **P-002 (Mechanical vs heuristic)** — the automation boundary is determinism, not cleverness.
- **P-003 (Reuse existing structure)** — enrich returns a tree-sitter grammar, not a sittir IR, so it composes with hand-authored rules in the same `grammar(...)` call.
- **P-007 (Cut speculative scope)** — deferred heuristic inference instead of designing a threshold-configuration system nobody has asked for yet.

## Consequences

- **Enables**: Maintainers read one file to understand what transforms will apply. Link becomes simpler (fewer phases). New grammars get the three mechanical passes for free by wrapping their base.
- **Costs**: More hand-authored overrides than a fully heuristic system would need. Worth it for auditability.
- **Follow-ups**: Port the mechanical passes currently in Link (FR-020). Fidelity ceilings (FR-021) must not regress.

## Verification

If maintainers start adding the same pattern to enrich-like wrappers over and over ("my grammar needs pass X every time"), the mechanical set is too narrow and we should expand it — but only if the new pass is still deterministic and collision-free. If we find ourselves wanting a configuration knob inside enrich, that's a signal we're smuggling heuristics back in.
