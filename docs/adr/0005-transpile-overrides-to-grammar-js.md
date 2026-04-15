# ADR 0005 — Transpile `overrides.ts` to `.sittir/grammar.js`

**Status**: Accepted
**Date**: 2026-04-15
**Related**: specs/006-override-dsl-enrich/, ADR-0001

## Context

ADR-0001 requires tree-sitter's toolchain to run against `overrides.ts`. But tree-sitter's parser generator expects a JavaScript file (`grammar.js`), not a TypeScript one. The authoring environment uses TypeScript for type checking and editor support. These two facts are in tension: we cannot sacrifice TypeScript authoring, and we cannot sacrifice tree-sitter compatibility.

## Forcing Constraint

> "for overrides.ts we can always transpile first, right?"

## Alternatives Considered

- **Author in JavaScript directly**: loses TypeScript type checking and editor support. Rejected — the authoring experience is one of sittir's value propositions.
- **Ship a TypeScript-aware tree-sitter loader**: would require forking or patching tree-sitter's CLI. Rejected — out of scope and fragile.
- **Dual-file authoring**: write `.ts` for sittir and `.js` for tree-sitter. Rejected — two sources of truth, violates ADR-0001 in spirit.

## Decision

Sittir owns a mechanical transpile step that converts `packages/<lang>/overrides.ts` to `packages/<lang>/.sittir/grammar.js`. Each grammar package has a `tree-sitter.json` pointing at the `.sittir/` directory. CI runs the transpile + `tree-sitter generate` as one pipeline. The transpile is considered a build-step detail, not a change in authoring surface — maintainers only edit `.ts`.

## Principles Applied

- **P-001 (External contract first)** — tree-sitter's "grammar.js in a known location" contract is satisfied by generated output.
- **P-002 (Mechanical vs heuristic)** — transpile is a pure build step with no decisions, so it can live outside the authoring loop.

## Consequences

- **Enables**: TypeScript authoring with full type checking, and tree-sitter-validated output, from the same source. `.sittir/` is a build artifact — gitignored per package.
- **Costs**: One more build step in the pipeline. CI needs to run transpile before tree-sitter generate. Type errors in `overrides.ts` fail the build before tree-sitter ever runs (acceptable — catches problems earlier).
- **Follow-ups**: `@sittir/codegen` ships a dual CJS+ESM build so `overrides.ts` can import DSL primitives in whichever module system the transpile target uses.

## Verification

If the transpile step starts needing to make decisions (rewriting imports, selecting code paths based on grammar), it has stopped being mechanical and is effectively a second authoring layer — that would be a signal to reconsider the boundary.
