# ADR 0001 — Override files must be runnable by tree-sitter

**Status**: Accepted
**Date**: 2026-04-15
**Related**: specs/006-override-dsl-enrich/

## Context

`packages/<lang>/overrides.ts` extends a base tree-sitter grammar with sittir-specific field mappings and metadata. Earlier drafts treated the file as a sittir-only artifact: sittir's pipeline read it, but tree-sitter's own toolchain was never pointed at it. That left no way to detect when an override produced a grammar tree-sitter itself would reject, and the two tools' views of the grammar could silently diverge.

## Forcing Constraint

> "we need tree-sitter to run overrides.ts itself — it is effectively a grammar file"

## Alternatives Considered

- **Two separate files**: one for sittir metadata, one for the tree-sitter grammar. Rejected — two sources of truth, drift guaranteed.
- **Sittir-only file, validated indirectly**: parse corpus after codegen and hope divergence surfaces. Rejected — round-trip can mask grammar-shape problems; no early signal.
- **Sittir DSL that returns sittir-specific IR**: clean types but the file can never be fed to tree-sitter. Rejected — violates the forcing constraint.

## Decision

`overrides.ts` is a grammar file first and a sittir artifact second. Every sittir DSL primitive used inside it must return a value tree-sitter accepts in the position where it appears. Sittir-specific metadata lives in sidecar fields tree-sitter ignores, or is captured via side-effect accumulators (see ADR-0003). A mechanical TypeScript→JavaScript transpile to `.sittir/grammar.js` is the bridge to tree-sitter's toolchain; CI runs `tree-sitter generate` against the transpiled output.

## Principles Applied

- **P-005 (Single source of truth)** — one file both tools read.
- **P-001 (External contract first)** — tree-sitter's schema is a hard boundary we conform to, not a concern we defer.

## Consequences

- **Enables**: CI gate that catches grammar-shape regressions before they reach the corpus validator; grammar maintainers can run `tree-sitter generate` locally to debug.
- **Costs**: Every DSL extension now has a dual-compatibility requirement. Accumulator plumbing (ADR-0003) exists to satisfy this.
- **Follow-ups**: Dual CJS+ESM build of `@sittir/codegen` so `overrides.ts` can import DSL primitives; `tree-sitter.json` per package pointing at `.sittir/`.

## Verification

If we find ourselves adding a sittir DSL primitive whose only path forward is returning a sentinel tree-sitter rejects, the constraint is under pressure — revisit whether tree-sitter compatibility is still tractable or whether we need a pre-pass that strips sittir calls before tree-sitter sees the file.
