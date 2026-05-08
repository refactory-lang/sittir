# TypeScript and Codegen Conventions

Use this file for emitter changes, generated TypeScript work, or any task that edits codegen-adjacent TS.

## Core correctness rule

DRY is the main correctness rule for the pipeline:

> Every fact about the program has exactly one source, and exactly one derivation.

Apply it concretely:

- Do not store the same fact in parallel structures.
- Do not add ad hoc tree walkers that duplicate an existing derivation.
- Prefer object references over string re-resolution.
- End discriminated-union switches with `assertNever(...)`; no silent `default:` fallbacks.

## Fix the generator, not the generated output

Generated files are derived artifacts. If they are wrong, fix `packages/codegen/src/` or `packages/<lang>/overrides.ts`, then regenerate.

Never hand-edit:

- `packages/{rust,python,typescript}/src/*`
- `packages/{rust,python,typescript}/templates/*.jinja`
- `packages/{rust,python,typescript}/.sittir/*`
- `packages/{rust,python,typescript}/factory-map.json5`
- `packages/{rust,python,typescript}/overrides.suggested.ts`

## Generated-output hygiene

When touching emitters or generated-TS-facing helpers:

1. Do not emit `Object.defineProperty`; use inline object-literal methods/properties plus `withMethods<T>`.
2. Do not use `Record<string, unknown>` bridges when a typed property access or generic preserves the shape.
3. Grammar-specific shared helpers belong in per-grammar `utils.ts`, not `@sittir/core`.
4. Shared helpers must preserve caller types with generics; do not widen public helper inputs to `object`.
5. Avoid `AnyNodeData` in factory/wrap/from code except in genuinely generic shared infrastructure.
6. Do not spread shared method objects into factory literals; use `withMethods<T>(literal)` instead.

## TypeScript rules

- TypeScript is ESM and local imports use `.ts` extensions.
- Prefer `sg`/ast-grep for structural multi-site edits instead of serial text edits.
- Do not use type-escape hatches (`as any`, `as unknown`, `@ts-ignore`, `@ts-nocheck`, `eslint-disable`) as workaround fixes.
- Allowed exceptions:
  - `as const`
  - `@ts-nocheck` in `overrides.ts`
  - narrow `as unknown as Foo` bridges inside `packages/codegen/src/dsl/*` when guarded by `runtime-shapes.ts`, with a one-line reason

## Rule discrimination

For `packages/codegen/src/compiler/rule.ts`:

1. Prefer `switch (rule.type)` with `assertNever(rule)`.
2. Use exported type guards (`isSeq`, `isChoice`, `isField`, `isSymbol`, ...) in predicates such as `.find()` or `.filter()`.
3. Use inline `rule.type === 'seq'` checks only for simple one-off cases.

Do not introduce enum/const indirection for rule-type strings.

For DSL runtime-shape bridging, use the dual-case helpers in `packages/codegen/src/dsl/runtime-shapes.ts` instead of hand-written `'seq' || 'SEQ'` ladders.

## Function-structure rule

When a TS function body grows a 3+ line inline comment block explaining the next chunk, extract that chunk into a named private helper with JSDoc (`@param`, `@returns`, `@throws`, `@remarks`, `@see`) instead of keeping a long narrated body.
