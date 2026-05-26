# Generated-code cleanup — follow-ups from PR #39 review

> **Status:** follow-up spec (not blocking). Surfaced by the PR #39 review
> (slot-grouping diagnostic + `type_arguments`/`type_parameters` visible groups).
> All items below are **latent** — verified non-regressing on `029`
> (factory-render-parse held 726, AstMatch 617→619; read-render-parse 182/134/126).
> The slot model is *correct* (a visible group makes its parent slot a **non-empty
> list of the group kind**); these are emitters that don't yet handle that shape.

## Root cause (shared)

When a repeated unit is promoted to a **visible group** (e.g. `type_argument`
in `type_arguments` / `type_parameters`), the parent's slot becomes a
**non-empty list of the group kind** (`_type_argument`, multiplicity
`nonEmptyArray`). Three emitters still assume the pre-group shape and mishandle
the new one. None are exercised by the corpus today, so they're latent — but
they're real generated-code defects worth a focused pass. Relates to
[[project_wrap_emitter_children_typing_followup]] and the emitted-code-shrink
scope in [[project_post_024_pipeline_optimization_specs]].

## Items

### 1. `wrap.ts` — `$with` for a non-empty-list slot emits `never` (Copilot, `wrap.ts:3653`)

`wrapTypeArguments` exposes `$with.$children` as `(...vs: readonly [never])`,
which is **uncallable** — there's no way to update the `typeArguments` list via
`$with`. The `$with` emitter should, for a `nonEmptyArray`-of-group slot, emit a
signature accepting a non-empty list of the group type and update the backing
`_type_argument` key:

```ts
$with: { typeArgument: (...vs: readonly [T.TypeArgument, ...T.TypeArgument[]]) =>
           wrapTypeArguments({ ...data, _type_argument: vs }, tree) }
```

**Fix location:** the `$with` generation in the wrap emitter (`emitters/wrap.ts`)
— branch on slot multiplicity (`array`/`nonEmptyArray` → variadic-of-element,
not `[never]`), keyed by the slot's storage name, not `$children`.

### 2. `from.ts` — empty fallback throws on a non-empty-list slot (Copilot, `from.ts:2050`)

`typeArgumentsFrom` reads `_type_argument`; when missing it falls back to
`children = []` and calls `F.typeArguments(...)`, which asserts non-empty
(throws in debug). For a `nonEmptyArray` slot the `from` emitter should either
(a) error explicitly when the required slot is missing/empty, or (b) return the
input node unchanged if it's already a valid `TypeArguments`. Silent `[]`
fallback for a required-non-empty slot is wrong.

**Fix location:** the `from` emitter's reconstruction for `nonEmptyArray`
group-backed slots (`emitters/from.ts`).

### 3. `bridge.rs` — deprecated render collapses the two-slot group (Copilot, `bridge.rs:1035`)

The `_type_argument` path resolves only `children` and uses
`children.as_scalar()` for **both** `content` and `trait_bounds`, collapsing the
two-slot unit (element + optional bounds) into one scalar (bounds unrenderable),
and computes `children_renderables` but never uses it. **`bridge.rs` is
`#[deprecated]`** (`render/mod.rs`; production uses `render_transport_dispatch`
via typed transport — which renders this correctly, per the +1 AstMatch). So the
cleanup choice is: **stop generating the deprecated bridge path entirely**
(preferred — it's dead code), or fix its multi-slot group handling. Recommend
deletion as part of the bridge.rs sunset.

### 4. (Low) `nodes.test.ts` generated test for non-empty slots (Copilot, `nodes.test.ts:1782`)

Copilot flagged that the generated `typeArguments` test could throw on empty
input. **It does not** today (the 11 nodes.test.ts failures are pre-existing
`binary_expression`/kind-enum issues at lines 78/83/137, unrelated). But the
generated-test emitter should construct a **valid non-empty** child for
`nonEmptyArray` slots so the generated tests stay correct as more groups land.

## Verification gate

Pure generated-code shape fixes — **native counts must hold-or-improve**
(rust 182/134/126, python 107/96/74, ts 174/82/75; factory-render-parse ≥ 726).
Real napi build per crate first (reject 0.0s cached); `SITTIR_INTERNAL_CODEGEN_RUN=1`
for the count CLI. Items 1–2 also want a unit test that round-trips a
multi-element `type_arguments` through `$with` / `from`.

## Pointers

- Surfaced by PR #39 (branch `029-slot-grouping-diagnostic`).
- Group mechanism: `packages/rust/overrides.ts` `type_argument` group; render path `transport.rs` (live) vs `bridge.rs` (deprecated).
- Related: [[project_slot_grouping_diagnostic]], [[project_wrap_emitter_children_typing_followup]], the visible-kind-rendering handoff `docs/superpowers/handoffs/2026-05-26-029-visible-kind-rendering-foldin.md`.
