# ADR 0004 — Transforms run in a pre-evaluate phase

**Status**: Accepted
**Date**: 2026-04-15
**Related**: specs/006-override-dsl-enrich/, ADR-0001

## Context

Transform calls (`transform`, `insert`, `replace`, and the indexed/path-addressed patch variants) modify the structure of tree-sitter rules. Earlier drafts interleaved transform application with the Evaluate phase that walks the grammar to build sittir's internal model. That meant the post-transform grammar existed only as a sittir intermediate value — it was never a standalone tree-sitter grammar object.

ADR-0001 requires that the override file be runnable by tree-sitter. That requirement extends to the post-transform output: if transforms run as part of Evaluate, tree-sitter has no way to see what the grammar looks like after they apply.

## Forcing Constraint

> "thinking perhaps we isolate transforms to a pre-evaluate step, so we can ensure we obtain a grammar that is actually equally readable to tree-sitter as it is to sittir"

## Alternatives Considered

- **Interleaved with Evaluate**: simpler pipeline, but produces no artifact tree-sitter can consume. Rejected by ADR-0001.
- **Post-evaluate rewrite**: Evaluate builds the sittir model from the base grammar, then transforms patch the sittir model. Same problem — tree-sitter never sees the transformed shape.
- **Two runs of Evaluate**: once to get a transformable shape, once to produce the final sittir model. Rejected — doubles the work and the transformable shape is a temporary internal form.

## Decision

Transform evaluation is isolated to a pre-Evaluate phase. The phase runs entirely on tree-sitter grammar objects, applies every transform call, and produces a new tree-sitter grammar as output. Evaluate then consumes that grammar the same way it would consume a base grammar with no transforms. The post-transform artifact is the thing tree-sitter's parser generator validates in CI (FR-022).

## Principles Applied

- **P-001 (External contract first)** — the post-transform grammar is a tree-sitter grammar because tree-sitter needs to read it.
- **P-008 (Composition over configuration)** — no flags to enable transform handling; the phase either runs or doesn't based on whether the file contains transform calls.

## Consequences

- **Enables**: Running `tree-sitter generate` against post-transform output as a CI check. Transform bugs surface against tree-sitter's own schema, not sittir's interpretation of it.
- **Costs**: A new phase boundary to maintain. Transforms cannot reach into sittir-level metadata (by construction) — this is the intended limit, not a bug.
- **Follow-ups**: Per FR-022, CI runs `tree-sitter generate` on the post-transform output for each supported grammar.

## Verification

If we find ourselves wanting a transform to touch sittir-level metadata, the transform belongs in a different layer (Link or beyond) and should not be called `transform`. If the pre-evaluate phase starts needing access to sittir's internal model, something is wrong with the phase boundary.
