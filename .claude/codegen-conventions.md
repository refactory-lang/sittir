# TypeScript and codegen conventions

Read the [working standards](coding-standards.md) first. These rules apply to compiler, DSL, and emitter work.

## Types and canonical model facts

- Use ESM with `.ts` extensions for local imports.
- Use honest types and guarded boundaries. Do not silence disagreements with `as any`, `as unknown`, `@ts-ignore`, `@ts-nocheck`, or lint suppression. The exceptions are `as const`, intentional `@ts-nocheck` on `grammar.sittir.ts`, and narrow `as unknown as Foo` bridges inside `packages/codegen/src/dsl/` guarded by `types/runtime-shapes.ts` with a one-line reason.
- Avoid `AnyUntypedNode` in factory/wrap/from code except in genuinely generic shared infrastructure. Preserve the per-kind type and caller generics; do not replace them with `object` or `Record<string, unknown>` bridges.
- A `NodeRef`'s `parseKind`, `parseKindId`, and `storageKindId` are the authoritative alias-aware facts for that reference occurrence. The referenced node's isolated identity cannot replace them. Use model projections such as `acceptedIdPairsByKindOf` when accepting parser and storage IDs.
- Prefer canonical predicates and facts on the model over emitter-local regexes, walkers, or name heuristics. Keep one source and one derivation.

## Generated outputs and node members

- Fix `packages/codegen/src/` or the owning `packages/<grammar>/grammar.sittir.ts`, then regenerate; never patch a generated output directly.
- This covers generated TypeScript, parser artifacts, native render/transport Rust modules, node-model snapshots, and generated suggestions across Rust, TypeScript, Python, Regex, and SCM.
- Emit node accessors, update members, and methods directly on object literals using the existing node-member emitter. Do not attach them afterward with `Object.defineProperty`, a shared method-object spread, or a method-binding wrapper.
- Keep grammar-owned helpers in their generated package's `utils.ts`; shared runtime operations belong in `@sittir/common`.
- A refactor claiming no behavior change must preserve generated output byte for byte. An unexpected change is a finding to diagnose.

## Rule discrimination

The Rule union is defined in `packages/codegen/src/types/rule.ts`.

1. Prefer `switch (rule.type)` with `assertNever(rule)` for exhaustive handling.
2. Use exported variant guards in `.find`, `.filter`, `.some`, and similar predicates.
3. A simple inline discriminant check is fine; enum/const indirection for rule-type strings is not.

The DSL also encounters tree-sitter's uppercase shapes. Use the dual-case predicates in `packages/codegen/src/types/runtime-shapes.ts`; do not add parallel lowercase/uppercase ladders.

## Structural edits and function documentation

Prefer `sg`/ast-grep for structural multi-site edits rather than serial text replacements. Use Infigraph to discover the relevant symbols and references first.

When a function body has a 3+ line inline comment explaining the next chunk, extract that chunk into a named private helper. Keep the body linear and scannable. Read and update the owning [function glossary](../docs/glossary/README.md); do not add internal function JSDoc to replace the extracted comment. Source keeps only a short explanation of a non-obvious live constraint.

Follow the engine-surface [public API JSDoc exception](../CLAUDE.md#universal-rules). Keep longer rationale in the glossary without duplication, and grammar rationale in the per-grammar authoring glossaries.

## Test layout

Unit tests live under the owning module's `__tests__/` directory. Cross-module integration tests belong under `src/__tests__/`. Do not co-locate `*.test.ts` beside implementation files.

## `@forFutureUse` tag format

Use this JSDoc tag for a symbol deliberately retained despite having no current caller. Include a one-line reason naming the deferred surface, followed by its present limitation when useful. Describe the contract directly; do not cite a planning document or number.

```ts
/**
 * @forFutureUse Incremental query invalidation after source edits.
 * Retained until query views can refresh against an updated parsed tree.
 */
```

Before deleting an exported symbol with zero or test-only callers, check for this tag. Confirm with the surface's owner whether the contract is still active; zero callers alone does not authorize retiring it.
