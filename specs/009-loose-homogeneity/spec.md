# Spec 009 — Homogeneity-Aware `Loose` Projection

**Status**: Layer 1 landed on `009-loose-homogeneity` branch (2026-04-17).
**Depends on**: spec 008 (NamespaceMap, $-prefix metadata, US1/US7).

---

## Problem

Pre-009, `FromInputOf<T>` always required a `{ kind: K }` tag on multi-branch
union slots. Example — a field that accepts `HomoLeft | HomoRight`, both with
identical `{ x, y }` shape, still forced consumers to write:

```ts
loose.child = { kind: 'homo_left', x: 1, y: 2 };
// OR
loose.child = { kind: 'homo_right', x: 1, y: 2 };
```

At runtime, the factory dispatcher for `source='promoted'` polymorphs already
discriminates by field-presence. The `kind` tag is informational for the type
checker, not required at the call site.

## Insight

When every arm of a multi-branch union has a structurally identical `Loose`
projection, the tag is informational only. The type checker can drop the
`{ kind: K } &` wrapping and accept a bare bag. The runtime resolver picks
any arm (they produce the same node shape by assumption).

## Approach — Layer 1

Thread a `NsMap` type parameter through `FromInputOf` / `WidenValue` /
`WidenChildSlot` / `NodeNs`. Generated `<Kind>Ns extends NodeNs<T, Scalars,
Strings, NamespaceMap>` passes the per-grammar `NamespaceMap` so `WidenValue`
can short-circuit multi-branch recursions to `NsMap[K]['Loose']` lookups
instead of re-projecting `FromInputOf<U>` per arm.

Then `IsHomogeneous<T, NsMap>` checks:

```
[LooseOf<K, NsMap>] extends [UnionToIntersection<LooseOf<K, NsMap>>]
  && [UnionToIntersection<LooseOf<K, NsMap>>] extends [LooseOf<K, NsMap>]
```

— i.e. the union of Loose projections equals their intersection. When true,
drop the `{ kind }` tag and accept a bare bag.

## Acceptance

- **Homogeneous arm ({x, y} / {x, y})**: bare `{x, y}` assignable to the
  child slot — verified by `packages/types/tests/homogeneity.test.ts`.
- **Heterogeneous arm ({x, y} / {x, y, z})**: tag still required on the
  heterogeneous member — verified by the same test.
- **Generic fallback**: when `NsMap` defaults to `{}`, `IsHomogeneous`
  returns `false` and pre-009 behaviour is preserved.
- **Regression**: all 1249 pre-009 tests pass; +2 homogeneity tests land.
  Full `pnpm -r run type-check` stays under 1.5s (no recursion blowup).

## Tradeoffs

1. **Type-check cost**: TS evaluates `IsHomogeneous` at each multi-branch
   slot. `NsMap[K]['Loose']` is an indexed-access type — TS caches the
   result once per key. Still, two `extends` round-trips per slot add up.
   Measured on 008's branch baseline (1.2s) and post-009 (1.2s) — no
   noticeable regression on the three grammars.

2. **Depth truncation**: `FromInputOf` caps at depth 3 to prevent infinite
   expansion. Homogeneity is evaluated AT the depth-N projection, so two
   arms that diverge at depth N+4 are still reported homogeneous. Safe in
   practice — the runtime resolver's field-presence dispatch doesn't care
   about deep divergence anyway.

3. **Consumer-facing surface**: the `Loose` type shape can now differ
   across slots of the same kind union. E.g. `Expression` normally keeps
   tagged forms (binary/unary/...), but a hypothetical slot that only
   accepts two expression subtypes with identical loose shape would drop
   the tag. Documented via the test.

## Deferred / future work

- **Layer 2 (per-slot emission)**: emit the Loose shape as an explicit
  union of `NamespaceMap[K]['Loose']` references per-slot, bypassing
  `FromInputOf` recursion entirely.
- **Layer 3 (codegen-time check)**: compute homogeneity in codegen from
  `AssembledBranch.fields` and emit the Loose shape directly — fully
  sidesteps type-level computation. Simpler to reason about; a natural
  follow-up once Layer 1 proves the API change is stable.
