# `packages/codegen/src/validate` — Function Glossary

Per-function reference for `packages/codegen/src/validate/`, mechanically relocated from source
JSDoc by `scripts/relocate-jsdoc-to-glossary.mts` (mechanical pass —
unedited, unverified). A later pass reformats/verifies these entries and decides
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

### `renderable` (`packages/codegen/src/validate/renderable.ts:35`)

```text
/** Count of kinds that are renderable via one of the three paths. */
```

### `missing` (`packages/codegen/src/validate/renderable.ts:37`)

```text
/** Kinds that have NO viable path. */
```

### `RenderKindPath` (`packages/codegen/src/validate/rule-lookup.ts:16`)

```text
/**
 * Classification of how a kind reaches a rendered output string.
 *
 *   `template` — the kind has an entry in `templates directory` that
 *     render() substitutes into. Branches, containers, groups,
 *     polymorphs.
 *   `text`     — the kind is a pure leaf (string/pattern/keyword/
 *     enum), so `render(node)` just returns `node.text`.
 *   `dispatch` — the kind is a supertype; render dispatches to the
 *     concrete subtype's rule. Never addressed directly.
 *   `none`     — the kind is a hidden token or an unreachable
 *     rule that render() can't produce.
 */
```

### `kinds` (`packages/codegen/src/validate/rule-lookup.ts:32`)

```text
/** All kinds known to the NodeMap, keyed by string. */
```

### `renderable` (`packages/codegen/src/validate/rule-lookup.ts:34`)

```text
/** Kinds that reach a render path: template | text | dispatch. */
```

### `templated` (`packages/codegen/src/validate/rule-lookup.ts:36`)

```text
/** Kinds with a template.yaml rule entry (templates only). */
```

### `path` (`packages/codegen/src/validate/rule-lookup.ts:38`)

```text
/** Classification per kind. */
```

### `GRAMMAR_PATHS` (`packages/codegen/src/validate/node-types-loader.ts:43`)

```text
/**
 * Non-standard node-types.json locations. Most grammars follow the
 * `tree-sitter-{name}/src/node-types.json` convention; this table
 * lists the exceptions (typescript ships two grammars per package).
 */
```
