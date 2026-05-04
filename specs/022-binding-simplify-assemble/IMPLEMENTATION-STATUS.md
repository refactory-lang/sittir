# Spec 022 — Implementation Status

> **Read this first** before consulting `spec.md`, `plan.md`,
> `data-model.md`, or `contracts/`. The design docs describe the
> *intent*; this file records what actually shipped and where current
> truth lives.

The Phase 1–3 implementation diverged from the original design in
several places. Subsequent ad-hoc renames (Phase 1d.i through 1d.xi)
landed without retroactively updating the design docs. This file is
the audit trail; the source of truth is `packages/codegen/src/compiler/node-map.ts`.

## Type-hierarchy mapping (planned → shipped)

| Design name (in spec/plan/contracts) | Shipped name | Notes |
|---|---|---|
| `AssembledContainer` | **merged into** `AssembledBranch` | Phase 1d.vii — repeat/repeat1 (`!hasAnyField(rule)`) folded into branch; discriminator is `branch.isContainerShape`. Commit `3cacc964`. |
| `AssembledMulti` | **survives** as its own class | The plan to fold into `AssembledBranch` did not land. `AssembledMulti` remains a distinct member of the `AssembledNode` union. |
| `AssembledGroup` | **survives** as its own class | The plan to fold into `AssembledPolymorph` did not land. `AssembledGroup` represents both hidden-group fragments AND polymorph forms. |
| `AssembledField` (with `edgeName`) | **renamed** to `AssembledNonterminal` (with `name` + `source` tag) | Phase 1d.ii. The `edgeName?: string` design was replaced with `source: 'grammar' \| 'override' \| 'inlined' \| 'enriched' \| 'inferred'`. `source === 'inferred'` is the equivalent of "no edgeName" (positional/unnamed). Commit `dd1ce297`. |
| `AssembledChild` (no `edgeName`) | **deleted** | Replaced by `AssembledNonterminal` with `source === 'inferred'`. Same atom, different filter. Commit `dd1ce297`. |
| `KindProjection` parallel cache | **deleted** | Phase 1d.i — was caching facts derivable from `slot.values`. DRY violation. Commit `e0a511bc`. |

## Storage shift (ADR-0018)

Per-NodeData metadata moved from a hoisted `$fields` envelope to
**per-field `_<name>` storage** with non-enumerable accessor functions.
Old: `data.$fields.name`. New: `data._name` (storage) + `data.name()`
(value via accessor) / `data.name` (cursor on the same object).

`@sittir/core/readNode.ts` emits `_<name>` directly (no shim).
SC-001 met: zero `$fields` references in generated output.

The `wrap.ts` shim mentioned in the design docs has been removed —
`readNode.ts` does the work directly. References to `wrap.ts` in the
design docs describe an intermediate state, not the shipped layout.

## Slot surface (Phase 1d.v–1d.xi)

Both `AssembledBranch` and `AssembledGroup` carry a unified slot store:

```ts
readonly slots: Readonly<Record<string, AssembledNonterminal>>;
```

`fields` and `children` are derived projections:

```ts
get fields():   readonly AssembledNonterminal[]  // source !== 'inferred'
get children(): readonly AssembledNonterminal[]  // source === 'inferred'
```

`AssembledPolymorph` has no `slots` of its own — it composes forms,
each of which is an `AssembledGroup` carrying its own `.slots`. The
dedup'd structural views live as getters on `AssembledPolymorph`:

```ts
get structuralFields(): readonly AssembledNonterminal[];  // dedup across forms
get structuralSlots():  readonly AssembledNonterminal[];  // dedup; fields + children
```

## Canonical helpers (single source of truth)

Six exports from `node-map.ts` cover every walk pattern:

```ts
structuralFieldsOf(node)    // dedup'd field-only view
structuralChildrenOf(node)  // dedup'd children-only view
allFormFieldsOf(node)       // raw cross-form flatten — fields only (transport literal collection)
allFormChildrenOf(node)     // raw cross-form flatten — children only
allSlotsOf(node)            // raw cross-form flatten — every slot (fields + children)
allStructuralSlotsOf(node)  // dedup'd union of every slot
```

When TS-emission shape differs by slot kind (factories, types,
render templates), use the field/children-split helpers. When the
consumer is graph-traversal-shaped (kind reachability, alias-source
collection, userFacing), use `allSlotsOf`.

## What landed vs what's queued

| Phase | Status | Notes |
|---|---|---|
| Phase 1: Taxonomy | ✅ Shipped (incl. Phase 1d.i–1d.xi cleanup) | See commits matching `022(taxonomy 1d.*)`. |
| Phase 2: Surface reshape (`_<name>` storage, `$with`, freeze) | ✅ Shipped | ADR-0018. |
| Phase 3: Transport / napi (direct property access, no JSON round-trip) | ✅ Shipped | SC-001 met. |
| Phase 4: Children-naming + factoryFields gate relaxation + Owner A migration | ⏳ Carved into a separate spec | See planned spec 023+ (TBD — provisional). |

## Out-of-scope-for-022 follow-ups

- The `factory-map.ts` orphan-promotion gate excludes 73 mixed-shape
  kinds. Conservative-by-design; relax as part of Phase 4 once
  consumer-side knows about children-vs-fields. See memory:
  `project_factory_map_orphan_gate`.
- TS rtAstMatch baseline = 93/112 (8 captured astMismatches + 9
  render errors + 4 skipped). All pre-existing template/formatter
  issues; no spec 022 attribution.
- Spec 022 doc DRY sweep itself: this file replaces line-by-line
  rewrites of the original design docs. Read this first; consult the
  others only for design rationale.

## How to read the original design docs

- `spec.md` / `plan.md` — design goals and phase decomposition. Sound
  as historical record; *names* (especially `AssembledContainer`,
  `AssembledChild`, `AssembledField`, `KindProjection`, `$fields`,
  `wrap.ts` shim) are stale per the table above.
- `data-model.md` / `contracts/` — described the intended API
  surface. The shape of each tier is correct *in spirit*; specific
  type names map per the table.
- `tasks.md` — task descriptions are *as-written-at-the-time*. Tasks
  that referenced renamed types should be considered "done if the
  code passes type-check"; the renames landed in subsequent
  taxonomy 1d.* commits.
- `quickstart.md` — code examples; some snippets reference
  `data.$fields` or pre-rename APIs. Treat as illustrative, not
  current.
- `research.md`, `handoff.md`, `rt-failure-*.md` — historical
  decision/investigation records. Snapshot in time; not maintained
  against current state.
