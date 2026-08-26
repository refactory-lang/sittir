# The Node Surface Is Immutable; Setters Are Layered On

**Status:** Designed (not realized)

## Problem

`$with` is emitted twice, by two emitters that cannot see the same things, and
the two results are different public APIs for the same operation.

A factory-built node gets its setters from `factories.ts`:

```ts
name(value: T.Identifier | T.Metavariable): FunctionItemBuilt;
```

A parsed node gets its setters from `wrap.ts`:

```ts
name: (v: T.FunctionItem.LooseConfig['name']) => …
```

Same field, same kind, same conceptual operation — set `name` and give me the
node back — and a caller has to know which shape of node it is holding to know
what that setter accepts. Nothing in the API says so.

The split is not an oversight. The generated packages are strictly layered and
a lint rule holds them that way ("the generated grammar packages are acyclic
and must stay that way"):

```
factories.ts → types, utils          ← bottom
from.ts      → factories, types, utils
wrap.ts      → from, types, utils
ir.ts        → factories, from, utils
```

A coercing setter needs two things: the **resolver** that widens the input, and
the **factory** that rebuilds the node. `from.ts` has both, so wrap's setters
coerce. `factories.ts` sits below the resolvers and cannot reach them, so its
setters do not. Each emitter wrote the best setter it could see, and the
surface diverged along the seam between them.

Scale, per grammar: `factories.ts` carries 419 / 429 / 289 `$with` mentions,
`wrap.ts` another 209 / 213 / 144. Two independent authorings of one surface.

There is already a vestige of the intended design. `buildWithNamespace` in
`packages/common/src/nodeData.ts` is a shared `$with` builder, tagged
`@forFutureUse`, exported, and called by nothing — the shape of this idea,
written down and never wired.

## Design

**A node's own surface is immutable.** `factories.ts`, `from.ts` and `wrap.ts`
emit the node as data plus the things that only read it: `$type`, the
`_<slot>` storage, the accessors, `$render`, `$toEdit`, `$replace`, `$trivia`.
Nothing on that surface produces a new node, so nothing on it needs to know how
to build one.

**Setters are layered on where both halves are visible.** `ir.ts` already
imports `factories` and `from` and already composes them 140 times over —
`attachProps(FR.coerceToX, { strict: F.buildX })` is the callable-plus-strict
bundle this repo hands users for construction. The same composition supplies
setters: the resolver widens, the factory rebuilds, and both are in scope.

**One shape everywhere, mirroring `ir.*`.** A setter is the coercing form with
the strict one attached:

```ts
$with: {
  name: ((v: LooseConfig['name']) => Built) & { strict: (v: T.Identifier | T.Metavariable) => Built };
}
```

Because there is exactly one construction of `$with`, built, wrapped and
coerced nodes cannot disagree about it. The convergence is structural rather
than maintained. (`$source` and the other provenance stamps still differ by
node origin — that is a fact about where a node came from, not about what its
setters accept.)

### Why `ir.ts` and not a shared helper called from both

A helper does not fix the layering; it relocates it. `factories.ts` still could
not call a helper that needs resolvers, because the helper would need them
imported somewhere reachable from the bottom layer. What makes `ir.ts` the
right home is that it is the first layer that legitimately sees both halves,
and it already exists as the place where the two are married for construction.

### How the wiring is expressed

`ir.ts` already composes each kind out of parts:

```ts
const _b$expressionStatement = attachProps(FR.coerceToExpressionStatement, {
	strict: F.buildExpressionStatement,
	withSemi: FR.coerceToExpressionStatement.withSemi
});
```

Setters are one more stage in that pipeline, not a new mechanism:

```ts
const _b$expressionStatement = addNamespace(
	makeMutable(FR.coerceToExpressionStatement, F.buildExpressionStatement, {
		content: FR.resolveExpressionStatement_content
	}),
	{ strict: F.buildExpressionStatement, withSemi: … }
);
```

`addNamespace` is today's `attachProps` under a name that says what it does.
`makeMutable` is the only new part: it takes the coercing factory, the strict
one, and the kind's per-field resolvers, and returns a factory whose nodes
carry `$with`. One implementation, applied per kind, with the kind's own
resolvers named at the call site rather than looked up in a table at runtime.

**Runtime is a loop; the types come from the call site.** This is not a new
trick — it is how the node's accessors are already attached:

```ts
export function withAccessors<T extends object, A extends Record<string, unknown>>(node: T, accessors: A): T & A {
	for (const key of Object.keys(accessors)) {
		Object.defineProperty(node, key, { value: accessors[key], enumerable: false, … });
	}
	return node as T & A;
}
```

One loop over `Object.keys`, and every accessor's type comes from the record
literal the caller passed, inferred through `A`. `makeMutable` binds setters
the same way: iterate the kind's resolver record, bind each to the factory,
define the property. The generated per-kind call site supplies both halves at
once — the runtime functions and, by inference, their types.

So no projection over `NamespaceMap` is needed for `$with` at all. The earlier
worry that a table walked at runtime would erase per-field types applies to a
GLOBAL table keyed by kind, not to a per-kind record literal: the literal is
the type. Prefer that, and reach for an explicit mapped type only if inference
through `A` proves too weak in practice.

The reason this matters beyond convenience: a type inferred from a literal
indexes what is already there and expands nothing. That is the shape the
`SimplifyDeep` removal in `ConfigOf` established as cheap, and the one the
`_TreeOf` attempt violated — the latter did not merely slow the checker, it
failed to terminate. The gate is the same either way: the type-check count must
not move.

### Freeing the resolvers is a separate, smaller move

There is a second route to the same convergence: put the resolvers *below*
`factories.ts` so its setters can coerce directly. Measured, that is nearly
possible already — **0 of 275** resolvers reference `F.` at all, and they call
only `_resolveOne` / `_resolveOneBranch` / `_resolveOneLeaf` / `_resolveMany`
plus `coerceKindEnumStorage`. Exactly one of those, `_resolveOneBranch`, pulls
factories in, through `_wrapWithChildren` — the `kind → F.buildX` dispatch that
lets a bare array auto-wrap into its container. Late-binding that one table
would free all 275.

This spec does not take that route, because it fixes the layering without
fixing the duplication: `factories.ts` and `wrap.ts` would still author `$with`
twice, and would still be free to drift. Recorded because it is the cheaper
change if convergence is wanted before the restructure, and because
`_wrapWithChildren` being the sole factory dependency of the resolver layer is
worth knowing regardless.

### End state

- Node surfaces carry no `$with`. `factories.ts` and `wrap.ts` stop emitting
  setters; `<Kind>Built` and the wrap return describe an immutable node.
- `ir.ts` attaches setters, in one construction, shaped
  `callable & { strict }`.
- `buildWithNamespace` and `freezeNodeData` are either the runtime helper this
  uses or are deleted — they cannot stay `@forFutureUse` through the work that
  was their future.
- The `@ts-expect-error` in
  `packages/rust/tests/loose-with-on-tree-nodes.test.ts` asserting that a
  factory-built setter rejects a bare string is DELETED. It pins the
  divergence as intent, and it stops being true.

## Gates

1. A built node and a parsed node of the same kind accept the same setter
   input — asserted per shape, not by inspection.
2. `$with.<field>.strict` rejects what the coercing form accepts, pinned with
   an inverted-and-restored `@ts-expect-error` on each form.
3. The generated packages stay acyclic; `import/no-cycle` remains off only
   because the graph does not need it.
4. Whole-repo type-check no worse than its baseline, and the examples gate at
   0. `$with`'s type should come from the per-kind record literal, as
   `withAccessors` already does; if the count moves, something is expanding
   that should have been inferred or indexed.
5. Full unit suite, and `validate history` compared numerically across all
   three grammars.

## Out of scope

- The wrap functions' missing return types. A drilled node still loses its
  surface in types until `XTree` is declared rather than inferred; that is its
  own item and blocks reaching these setters below the root either way.
- `$source` and provenance stamps, which legitimately differ by node origin.
