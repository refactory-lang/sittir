# Wrap Diagnostic Location Design

## Problem

Generated `wrap.ts` helpers currently throw errors that identify the slot and node kind, but not where in the source tree the bad value came from. For failures like:

`singular slot "expression" on "list_splat" requires one value; got undefined`

the message is missing the most useful debugging context: the source location and a short source excerpt.

## Goal

Improve generated wrap diagnostics for all grammars so every emitted wrap-helper throw path can report:

- node kind
- slot name, when relevant
- line and column
- a short source snippet

The improvement must be emitted from codegen, not hand-edited in generated `wrap.ts` files.

## Scope

In scope:

- shared emitted helper logic in `packages/codegen/src/emitters/wrap.ts`
- all generated grammar `wrap.ts` files through regeneration
- all throw paths that currently route through emitted wrap helper violations

Out of scope:

- changing wrap/model behavior
- changing parser, override, or slot derivation logic
- changing validator formatting outside wrap-layer exceptions

## Design

### Recommended approach

Centralize the improvement in the emitted shared wrap helpers.

Codegen should emit a small diagnostic-context formatter that uses existing runtime data already available to wrap:

- `tree.source` for source text
- node `$span` for byte offsets
- current node kind / slot name from the helper call site

Each emitted helper that can throw should pass enough context for the formatter to produce a better message. When source or span is unavailable, the formatter should gracefully fall back to the current message shape.

### Diagnostic shape

For wrap violations, the emitted message should include:

1. the existing semantic error (`singular slot "expression" on "list_splat" requires one value`)
2. source location in `line:column` form
3. a short source snippet covering the best available span

If no source-backed context exists, keep the current message body without introducing a second failure in diagnostic formatting.

### Throwing helper coverage

This should apply to all emitted helper paths that currently funnel through `handleWrapViolation(...)`, including:

- singular-slot normalization
- repeated-slot normalization
- any future emitted wrap helper that uses the same violation path

The coverage rule is helper-based, not Python-specific.

## Implementation seam

Primary source of truth:

- `packages/codegen/src/emitters/wrap.ts`

Likely emitted-runtime touchpoints:

- `handleWrapViolation(...)`
- `normalizeSingularWrapSlot(...)`
- `normalizeRepeatedWrapSlot(...)`

The generated per-kind wrap functions already have access to both `data` and `tree`, so they are the right place to thread contextual information into the shared helper layer.

## Trade-offs

### Chosen

Centralized helper-based diagnostics:

- **Pros:** one implementation for all grammars, no generated drift, consistent output
- **Cons:** requires threading context through emitted helper calls

### Rejected

Per-wrap-function custom messages:

- more bespoke, but duplicates logic across generated code and is harder to maintain

Debug-mode-only detail:

- lower default verbosity, but weaker for the main debugging workflow that prompted this change

## Validation

Success looks like:

- generated wrap diagnostics include `line:column` and snippet when source-backed context exists
- all grammars receive the same diagnostic behavior after regeneration
- trees without `tree.source` continue to throw safely with a fallback message

## Files expected to change later

- `packages/codegen/src/emitters/wrap.ts`
- generated `packages/{python,rust,typescript}/src/wrap.ts` after regeneration
- targeted wrap-emitter tests under `packages/codegen/src/__tests__/`
