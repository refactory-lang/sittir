# `packages/codegen/src/validate` — Function Glossary

Per-function reference for `packages/codegen/src/validate/`, mechanically relocated from source
JSDoc by `scripts/wave5-relocate-jsdoc.mts` (wave 5 comment-cleanup, pass 1 —
unedited, unverified). Pass 2 reformats/verifies these entries and decides
what merges into docs/compiler-phase-glossary.md's phase narrative.

See [AGENTS.md § Wave-style decomposition before commits](../../AGENTS.md).

---

### `validateRenderableFromNodeMap` (`packages/codegen/src/validate/renderable.ts:50`)

```text
/**
 * C12: NodeMap-sourced variant. Skips the templates directory round-trip
 * entirely — renderability is a structural property, and the
 * shared `buildRuleLookup()` answers it directly from NodeMap.
 * Prefer this when you already have a NodeMap in hand (generate
 * returns one).
 *
 * Pure-leaf fallback: if an entry has no fields and no children in
 * node-types.json, `render()` returns `node.$text` directly via its
 * text fast-path — no template lookup needed. This covers:
 *   - Cluster A: visible STRING-rule kinds (`token`/`keyword` modelType)
 *     whose NodeMap path is `"none"` because `classify()` maps those
 *     to `"none"`.
 *   - Cluster B: visible alias targets absent from NodeMap entirely
 *     (e.g. `impl_item_semi`). `node-types.json` lists them as pure
 *     leaves; `readNode` captures `$text` and the fast-path renders.
 */
```

### `isPureLeafEntry` (`packages/codegen/src/validate/renderable.ts:97`)

```text
/**
 * Return `true` when a node-types.json entry is a pure leaf: no fields,
 * no children, and not a supertype. These kinds render via `render()`'s
 * text fast-path (`node.$text` present, no `$fields`/`$children` needed).
 *
 * @param entry A raw node-types.json entry.
 */
```

### `buildRuleLookup` (`packages/codegen/src/validate/rule-lookup.ts:42`)

```text
/**
 * Build a rule inventory from a NodeMap. Cheap — no YAML parsing,
 * no file I/O.
 */
```
