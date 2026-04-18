# Contract: `.from()` resolver dispatch

**Location**: `packages/<grammar>/src/from.ts` (generated)
**Visibility**: Public — consumer-facing convenience API for constructing fluent nodes from loose bags.

## Signature template

For every non-leaf kind `X`:

```ts
export function <xCamel>From(
    input: T.<X> | T.<X>.Loose,
): T.<X>.Fluent {
    if (isNodeData(input)) return input as T.<X>.Fluent;

    return F.<xCamel>({
        // For each field: single-access read from input.<camelCase>,
        // passed through the appropriate resolver.
        <camelField>: _resolveOne<ConcreteType>(input.<camelField>, <kindArgs>),
        <camelField>: _resolveOneBranch<ConcreteType>(input.<camelField>, <kindArg>),
        <camelField>: _resolveMany<ConcreteType>(input.<camelField>, <kindArgs>),
        // ...
    });
}
```

Where:

- `<X>` is the PascalCase kind name.
- `<xCamel>` is the camelCase kind name.
- `T` is the namespace import `import type * as T from './types.js'`.
- `F` is the namespace import `import * as F from './factories.js'`.
- `ConcreteType` is the concrete union of kinds derived from `AssembledField.contentTypes` — NEVER a computed Config path.
- `<kindArgs>`, `<kindArg>` are the resolver's additional arguments (kind-string literals, leaf kind refs `_K0`, etc.) unchanged from current emission.

## Dispatch semantics

Exactly two branches per resolver:

### Branch 1: `isNodeData(input) === true`

- **Runtime behavior**: Return `input` unchanged. The return value IS the input (same JavaScript reference — `===` holds).
- **Rationale**: NodeData is already resolved. Factory outputs and wrap outputs (the two expected NodeData sources at this boundary) both carry their full fluent surface.
- **Type-level**: Input is narrowed by `isNodeData` to `AnyNodeData`; the cast `as T.<X>.Fluent` asserts it's the specific kind's fluent type. Safe on the factory/wrap paths.

### Branch 2: `isNodeData(input) === false`

- **Runtime behavior**: `input` is a loose camelCase bag. Every field is read single-access via `input.<camelField>`. Values pass through the existing `_resolveOne*` helpers and are handed to the factory.
- **Type-level**: `input` narrows to `T.<X>.Loose`. All field types are concrete unions. Factory return type is `T.<X>.Fluent`.

## Preconditions

- `isNodeData` is imported from `@sittir/core`.
- `T.<X>.Fluent` and `T.<X>.Loose` are defined (depends on US1 — NamespaceMap landing).
- Concrete content type names are exported from `./types.js` and discoverable via `AssembledField.contentTypes` in the emitter.

## Postconditions

- `functionItemFrom(ir.functionItem({...}))` returns the factory output identity (`===` comparison holds — SC-005c).
- `functionItemFrom({ name: 'foo', body: <block node> })` resolves each field and returns a newly-constructed fluent node.
- `grep -l '.fields?.[' packages/*/src/from.ts` returns zero matches (SC-005a).
- `sg --pattern '(input as $T).$P' --lang typescript packages/*/src/from.ts` returns zero matches (SC-005a).
- `sg --pattern 'if (isNodeData(input)) return input as $$$' --lang typescript packages/*/src/from.ts` matches every non-leaf resolver (SC-005b).

## Invariants

- Exactly zero `.fields[...]` accesses in the resolver body.
- Exactly zero `??` fallback expressions in the resolver body.
- Exactly zero `as unknown as` or dual-cast expressions in the resolver body.
- Exactly one `isNodeData(input)` check per resolver, always at the first line.
- Factory import is a namespace import (`import * as F from './factories.js'`), not a per-factory wall.
- Type import is a namespace type import (`import type * as T from './types.js'`).

## Failure modes

### Bare `readNode()` NodeData (unsupported)

A consumer who calls `readNode(tree, nodeId)` directly (bypassing `wrap()` / `readTreeNode()`) and feeds the result to `.from()` will receive the bare NodeData back — which lacks the fluent method surface. Calling `.render()` on the return will throw.

This is documented as an unsupported path in:

- The edge case section of spec.md.
- A comment in the generated `ir.ts` preamble.
- The spec's assumption block.

Consumers wanting a fluent node from a parse tree must go through `readTreeNode(tree, nodeId)` or through the factory directly.

### Empty loose bag

`functionItemFrom({})` — every field resolves to `undefined` → factory receives a config of all-undefined fields. Existing factory behavior handles this (emits a node with no fields set). No special handling in the resolver.

### Unknown extra fields on bag

`functionItemFrom({ name: 'foo', notARealField: 42 })` — the extra field is ignored (not read by the resolver). TypeScript will flag it at the call site if strict-object-literal checking catches it. No runtime issue.

## Why not a `_f(input, snake, camel)` helper

(Documented in research.md R-003.) The quick-return on NodeData eliminates the need entirely: no field in the resolver body reads via `.fields[snake]`. The helper would be solving a problem that doesn't exist under this dispatch semantics.

## Version contract

- Introduced: this spec (008, User Story 3).
- Changing the dispatch (e.g., adding a third branch or rewriting the quick-return semantic) is a breaking change to every generated `from.ts` and requires a new spec.
