# PR-K — `factory-map.json5` → `node-model.json5` consolidation

**Date:** 2026-06-08
**Branch:** `pr-k-node-model-registration` (stacks on `pr-i2-choice-slot-submethods-phase2`)
**Builds on:** `2026-05-15-metadata-pipeline-consolidation-design.md` (Axis 1), `2026-05-22-compiler-simplification-design.md` §6.

**Goal:** make `node-model.json5` the single on-disk metadata source. Fold `factory-map.json5`'s five sections into node-model, repoint the validators, delete `factory-map.json5` (×3) + its emit path. **Elevate/relabel surfacing is SPLIT to PR-K2** (not in this PR).

## Confirmed decisions

1. **Serialize, don't re-derive** — `node-model.ts` calls the EXISTING derivation fns (`classifyFactoryShape`, `resolveFactoryFieldNames`, the polymorph-dispatch builder) and writes their output into node-model. Validators just READ. One derivation (DRY logic). node-model grows ~50% (src-only artifact, never shipped — acceptable per 2026-05-15 §6).
2. **`polymorphVariants` = top-level section** in node-model (mirrors factory-map). Reuses `buildFactoryMap`'s logic verbatim; minimal validator change.
3. **Elevate/relabel surfacing → PR-K2.**

## Section inventory (factory-map → node-model)

| factory-map section | node-model status | PR-K action |
|---|---|---|
| `factoryShapes` (`kind → "text"\|"config"\|"direct"\|"spread"`) | derivable | **serialize per-node** as `factoryShape` |
| `factoryFields` (`kind → fieldName[]`) | derivable | **serialize per-node** as `factoryFields` |
| `factorySlots` (required/multiple/nonEmpty per field) | raw facts per-field, but the emitting-kind FILTER is `buildFactoryMap`'s | **serialize top-level** `factorySlots` |
| `fieldAliasMap` (`"parent.field" → {tgt:src}`) | raw facts per-field (`values[].parseKind`/`name`), but the alias-source PAIRING + filter are `buildFactoryMap`'s | **serialize top-level** `fieldAliasMap` |
| `polymorphVariants` (`parent → {source, childKind, fields}`) | not pre-computed | **serialize top-level** `polymorphVariants` |

**Why `factorySlots`/`fieldAliasMap` are serialized top-level (not rebuilt on load).** The raw facts (required/multiple/nonEmpty, parseKind/name) do live per-field, but the MAP shapes consumers want are produced by `buildFactoryMap` applying (a) the factory-emitting-kind filter — `collectAliasSourceKinds` + `collectOverridePolymorphHelperKinds` + the hidden/polymorph-form skips — and (b) the `aliasTargetToSourceMapOf` pairing. Those helpers are NOT serialized. A validator-side rebuild would have to re-implement that filtering/pairing — a SECOND derivation (violates DRY-on-logic, the #1 rule) and a count-drift risk against the byte-stable gate. Per confirmed decision #1 ("validators just READ — one derivation"), the finished maps are serialized from the single `buildFactoryMap` call and read verbatim. The on-disk overlap with per-field facts is one derivation projected twice (a cache/index), not a second source.

`kindCategory` is NOT added — `modelType` (branch/leaf/keyword/token/enum/supertype/group/multi) already covers it (resolves the other 2026-05-15 open question).

## Consumers (validator-only — zero runtime/generated)

- `validate/from.ts` (loads all 5; `nodeToConfig` dispatch)
- `validate/factory-render-parse.ts` (`loadFactoryMapData`; roundtrip + nodeToConfig)
- `validate/read-render-parse.ts` (`loadVariantAdoptedKinds` scans `polymorphVariants`)
- `validate/common.ts` (`normalizeAliasForField` reads `fieldAliasMap`; `inferPolymorphVariant` reads `polymorphVariants`)

## Build sequence

1. **node-model emit — fold all 5 sections.** In `emitters/node-model.ts`: `buildNodeModel` calls the shared `buildFactoryMap(nodeMap)` ONCE. `serializeNode` gains per-node `factoryShape` + `factoryFields`; `buildNodeModel` gains top-level `polymorphVariants` + `factorySlots` + `fieldAliasMap` (all read straight off the `buildFactoryMap` result — no logic duplication). Update the `SerializedNodeBase`/`SerializedNodeModel` types. Regen; node-model.json5 grows, factory-map.json5 still emits (parallel, for safe cutover).
2. **Validator loader.** Add `loadNodeModel(grammar)` in `validate/common.ts` returning the 5 maps the consumers expect: `factoryShapes` / `factoryFields` reindexed from the per-node records (pure reshape of serialized facts), `factorySlots` / `fieldAliasMap` / `polymorphVariants` read verbatim from their top-level sections. node-model.json5 is plain JSON (emitter uses `JSON.stringify`) so `JSON.parse` directly — no comment-stripping. Fail-soft to empty maps (mirrors legacy `loadFactoryMap`).
3. **Repoint consumers.** Replace each `factory-map.json5` read with the `loadNodeModel` view. Gate after each: `SITTIR_NATIVE_DEBUG=0 pnpm validate:native` must hold **rust 120 / ts 71 / py 74** (the PR-I-φ2 floor) — this is a pure metadata-plumbing change, counts MUST be byte-stable.
4. **Delete.** Remove `factory-map.json5` ×3, the `emitFactoryMap`/`buildFactoryMap` emit path in `emitters/factory-map.ts` (keep relocated shared derivations), and the factory-map gen-wiring in the CLI/run-codegen. Confirm no dangling readers (`rg factory-map`). Regen + final gate.

## Gate

`SITTIR_NATIVE_DEBUG=0 pnpm validate:native` — must hold **rust 120 / ts 71 / py 74** deep `readRenderParseAstMatchPass` at every step (PR-K is non-behavioral: same facts, one file instead of two). Not rust-emitting (no `.node` shape change), but regen rebuilds anyway.

## Out of scope

- Elevate/relabel surfacing (→ PR-K2).
- `consts.ts` shrink (2026-05-15 Axis 1 Spike 3 — separate).
- Axis 2 emitter-walk centralization (separate).
- Any `NodeMap` in-memory interface change.
