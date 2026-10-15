# TypeScript and codegen conventions

Read the [working standards](coding-standards.md) first. Use these conventions for compiler, DSL, and emitter work.

## Types and model facts

- Use ESM with `.ts` extensions for local imports.
- Use honest types and guarded boundaries. Do not silence disagreements with `as any`, `as unknown`, `@ts-ignore`, `@ts-nocheck`, or lint suppression. Allowed exceptions are `as const`, intentional `@ts-nocheck` on grammar entries, and guarded cross-runtime bridges in the DSL with a short reason.
- A reference site's parser/storage identity is not necessarily the referenced rule's isolated identity. Consume its stamped alias-aware facts rather than re-resolving the name or reading a shared node's identity alone.
- Prefer canonical predicates and facts on the model over emitter-local regexes, walkers, or name heuristics.

## Rule discrimination

The rule union is defined in `packages/codegen/src/types/rule.ts`.

1. Prefer `switch (rule.type)` with `assertNever(rule)`.
2. Use exported variant guards in `.find`, `.filter`, `.some`, and similar predicates.
3. A simple inline discriminant check is fine; enum/const indirection for rule type strings is not.

The DSL also encounters tree-sitter's uppercase shapes. Use the dual-case predicates in `packages/codegen/src/types/runtime-shapes.ts`; do not add parallel lowercase/uppercase ladders.

## Generated surfaces

- Derive outputs from the canonical model. Avoid a second classification in an emitter.
- Preserve the caller's types in shared helpers; do not replace a specific generic with `object` or an untyped record bridge.
- Keep grammar-owned helpers in their generated package and shared runtime behavior in the common runtime.
- Keep methods inline on generated node literals using the existing method-binding mechanism; do not add `Object.defineProperty` or spread a shared method object into every literal.
- A refactor claiming no behavior change must preserve generated output byte for byte. An unexpected change is a finding to diagnose.

## Function structure and documentation

A long inline comment explaining the next chunk of a TypeScript function is a signal to extract a named helper. Keep the body linear and scannable. Internal codegen functions are documented in their [function glossary](../docs/glossary/README.md), not with a new JSDoc block above the implementation. Keep a short source comment only for a non-obvious live constraint.

Handwritten public API declarations are the exception: source JSDoc states their usage contract. Longer rationale belongs in documentation. Grammar rationale belongs in the per-grammar authoring glossaries.

## Tests and deferred code

Unit tests live under the owning module's `__tests__/` directory. Cross-module integration tests belong under `src/__tests__/`.

Before deleting an apparently unused export, check whether it carries an intentional `@forFutureUse` contract. Establish whether that contract is still active; zero callers alone does not settle its disposition. Deferred code must name the intended surface, not just an old task number.
