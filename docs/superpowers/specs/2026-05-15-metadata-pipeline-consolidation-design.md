# Metadata Pipeline Consolidation — Architectural Design

**Date:** 2026-05-15
**Status:** Draft (scoping)
**Branch context:** post-024 cleanup; not in scope for the current 024 cleanup pass

This design proposes consolidating sittir's per-kind metadata generation along two distinct axes that today are conflated. It captures findings from the sittir-8 session's exploration of `node-model.json5`, `factory-map.json5`, and `consts.ts`.

## 1. Problem

Per-kind grammar metadata is fragmented across multiple generated artifacts:

- **`packages/<grammar>/src/node-model.json5`** (~408KB for rust) — comprehensive structural metadata: `kind`, `modelType`, `typeName`, `factoryName`, `irKey`, `hidden`, `source`, `polymorphSource`, `variantChildKinds`, `forms[]`, `fields[]`, `subtypes`, `separator`, `pattern`, etc.
- **`packages/<grammar>/factory-map.json5`** (~109KB) — denormalized dispatch indexes: `factoryShapes`, `fieldAliasMap`, `factoryFields`, `factorySlots`, `polymorphVariants`.
- **`packages/<grammar>/src/consts.ts`** (~2215 lines for rust) — runtime tables: `NODE_KINDS`, `LEAF_KINDS`, `KEYWORDS`, `OPERATORS`, `TREE_SITTER_KIND_ID_BY_KIND`, `TREE_SITTER_KIND_BY_KIND_ID`, `TSFieldId` enum.
- **`packages/<grammar>/.sittir/src/node-types.json`** — upstream tree-sitter shape (input from override grammar compilation, not codegen output).

The fragmentation has two distinct sources, requiring two distinct fixes.

## 2. Two distinct optimization axes

These are independent. Either can land without the other.

### 2.1 Axis 1 — External-consumer file consolidation

**Today:** `pnpm validate:native` is an out-of-process invocation. The in-memory `NodeMap` from the prior codegen run is gone. Validate must read serialized artifacts from disk and currently navigates three files:

- `node-model.json5` for structural metadata
- `factory-map.json5` for `factoryShapes`, `factorySlots`, `polymorphVariants`, `fieldAliasMap`
- Generated grammar package `src/*.ts` (via tsx import) for runtime helpers

Same applies to `pnpm probe:validate`, `pnpm probe:kind`, and any external runtime consumer of a `@sittir/<grammar>` package.

**Goal:** make `node-model.json5` the comprehensive single-on-disk-source-of-truth. Per-node entry gains:

```json5
{
  "kind": "mod_item",
  // existing structural metadata (unchanged)
  "modelType": "polymorph",
  "typeName": "ModItem",
  "factoryName": "modItem",
  "fields": [...],
  "forms": [...],
  // NEW promoted metadata
  "kindId": 173,                                          // from consts.ts
  "kindCategory": "branch",                               // "branch" | "leaf" | "keyword" | "operator" | "polymorph" | "supertype"
  "factoryShape": "config",                               // from factory-map.factoryShapes
  "polymorphDispatch": {                                  // from factory-map.polymorphVariants
    "source": "override",
    "childKind": { "mod_item_external": "external", ... },
    "helperKind": "...",
    "helperChildKind": "..."
  }
}
```

`fieldAliasMap` is the trickiest item — it's cross-cutting (a single alias can affect multiple kinds). Either go on each affected node or stay as a top-level `aliases: {...}` in node-model.

**Deletables once Axis 1 lands:**
- `factory-map.json5` either removed entirely or kept as a thin denormalized cache (auto-generated indexes for O(1) lookup convenience).
- `consts.ts` shrinks dramatically — kind-ID tables become derivable from `nodes[k].kindId`. KEYWORDS / OPERATORS / NODE_KINDS / LEAF_KINDS become filter expressions over `nodeModel.nodes` keyed by `kindCategory`.

**Validate-side change (outside scope of this design but enabled by it):** add `loadNodeModel(grammar): NodeModel` helper in `validate/common.ts` returning indexed views (`byKind: Map`, `byKindId: Map`, `bySupertype: Map`). Replace existing `factory-map.json5` reads with `nodeModel.byKind.get(kind).factoryShape`.

### 2.2 Axis 2 — Codegen-internal emitter walk centralization

**Today:** Inside the codegen process, multiple emitters independently walk `NodeMap` to derive the same facts:

- `emitters/render-module.ts` derives slot model via `renderSlotModelOf(node)`
- `emitters/factory-map.ts` derives slot arity via its own walk
- `emitters/types.ts` derives type-level slot info via its own walk
- `emitters/wrap.ts` derives wrap accessors via its own walk
- `emitters/from.ts`, `emitters/factories.ts` similarly

**Risk:** these walks can drift. The same fact (e.g. "is `mod_item.body` required?") gets computed by 4+ different functions. If one updates its derivation logic and another doesn't, they emit conflicting facts about the same kind.

**Goal:** ONE shared helper computes the slot model. Every emitter calls it. Same answer everywhere by construction.

**Concretely:** promote `renderSlotModelOf` (or equivalent) from `render-module.ts` to a shared `compiler/slot-model.ts` module. Update factory-map emitter, types emitter, wrap emitter, from emitter, factories emitter to call it.

This is a refactor of the codegen-internal organization. **No on-disk format change**. The emitted output should be byte-identical (or at least semantically equivalent) before and after — the Axis 2 win is correctness-by-construction, not output change.

## 3. The two axes are independent

| | Axis 1 (external file consolidation) | Axis 2 (internal emitter walk centralization) |
|---|---|---|
| What changes | On-disk format(s) | In-process emitter organization |
| Who benefits | External consumers (validate, probes, runtime) | Codegen maintainers (drift prevention) |
| Output diff | New fields in node-model.json5; factory-map.json5 deleted/shrunk | Byte-identical (or semantically equivalent) output |
| Risk profile | Validate-side migration needed | Pure internal refactor |
| Test surface | All external consumers must be re-tested against new node-model | Output-byte comparison via regen + diff |

You can do them independently. Axis 1 has more user-visible impact. Axis 2 has more correctness impact.

## 4. The mental model worth preserving

- **NodeMap is the in-process truth** during codegen. Emitters MUST read from it directly — no round-trip through serialized files.
- **node-model.json5 is the comprehensive cross-process truth**. External consumers read from it (or derived projections of it).
- **The goal is NOT "merge in-memory and on-disk"**. The goal is:
  1. *Inside codegen*: emitters share derivation helpers off NodeMap so projections don't drift (Axis 2)
  2. *Outside codegen*: consumers read ONE file (node-model.json5) instead of juggling three (Axis 1)

This was a key clarification during the sittir-8 session — earlier framings of "make node-model.json5 the source of truth" were ambiguous about which side of the process boundary it referred to.

## 5. Recommended sequencing (relative to in-flight 024 cleanup)

The current 024 cleanup pass has separate priorities. This work should land AFTER 024 closeout to avoid concurrent edits to overlapping files.

1. **024 cleanup completes** (universal per-slot enums + legacy `render_dispatch` deletion + wrap-side mod_item fix + Phase C per-failing-entry probe + fix loop)
2. **Axis 2 — emitter walk centralization** lands first (no on-disk format change, lowest risk)
3. **Axis 1, Spike 1 — promote `kindId`, `factoryShape`, `polymorphDispatch` into node-model entries**; keep factory-map.json5 emitting for back-compat, mark deprecated
4. **Axis 1, Spike 2 — delete `factoryFields` and `factorySlots` from factory-map** (now derivable from node-model); update validate-side loader
5. **Axis 1, Spike 3 — shrink consts.ts**; emit derivable maps from node-model at codegen time, or eliminate the file if no runtime consumers need it
6. **Axis 1, Spike 4 (optional)** — add `ruleId` provenance per node entry (which grammar rule each kind came from); enables source-mapping diagnostics

## 6. Risks and open questions

- **node-model.json5 grows** from ~408KB to maybe 600-800KB. Trivial for codegen-time parse. Doesn't ship to runtime consumers (it's a `src/` artifact, not in `dist/`). Tier-1 acceptable.
- **Manifest churn** — every change to factory metadata now touches node-model.json5. Mitigated by tsconfig paths (no rebuild needed for tsx workflow).
- **Coordination with the in-flight universal-per-slot-enums work** — that refactor edits `render-module.ts` which reads slot metadata. If we also lift slot data into shared helpers (Axis 2), the two refactors could collide. Sequenced to avoid this.
- **`fieldAliasMap` placement** — cross-cutting; needs a design choice (per-node vs top-level). Open question.
- **`kindCategory` vocabulary** — the categories overlap with `modelType` (which is "branch" / "leaf" / "polymorph" / "supertype" / "multi" / "container"). Need to decide whether to extend `modelType` or add a parallel `kindCategory` axis. Open question.
- **Runtime consumers of grammar packages** — `consts.ts` shrinking changes the public surface of `@sittir/<grammar>` packages. Major-version bump if any external consumer imports `KEYWORDS` etc. directly. Audit needed before Spike 3.

## 7. Out of scope

- Changes to the `NodeMap` interface itself (the in-memory shape stays the same; this design is about projection, not redesign).
- Changes to upstream tree-sitter integration (`.sittir/src/node-types.json` flow unchanged).
- Runtime performance optimization (this is about codegen-time correctness; runtime perf is a separate concern).
- Wrap-layer or render-layer behavior changes (those are part of 024 cleanup).

## 8. Expected outcome

- One on-disk metadata file per grammar (`node-model.json5`) carrying everything external consumers need.
- One shared slot-model helper inside codegen, with no parallel walks across emitters.
- `factory-map.json5` deleted or thin cache only.
- `consts.ts` shrunk to whatever runtime invariants must be JS-loadable (probably just the `TSFieldId` enum and a few literal tables).
- Future external consumers (e.g. a "compare grammar versions" tool, a "what kinds use this token?" debugger) read one file instead of cross-referencing three.
- Future codegen maintainers add new metadata facts in ONE place (NodeMap field + one emitter walk) instead of remembering to update factory-map / consts / node-model in lockstep.
