# `packages/codegen/src/validate` — Function Glossary

Per-function reference for `packages/codegen/src/validate/`, mechanically relocated from source
comments by `scripts/relocate-comments-to-glossary.mts` (mechanical pass —
unedited, unverified). A later pass reformats/verifies these entries and decides
what merges into docs/compiler-phase-glossary.md's phase narrative.

See [AGENTS.md § Wave-style decomposition before commits](../../AGENTS.md).

---


### `packages/codegen/src/validate/renderable.ts::validateRenderableFromNodeMap`

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

### `packages/codegen/src/validate/renderable.ts::isPureLeafEntry`

```text
/**
 * Return `true` when a node-types.json entry is a pure leaf: no fields,
 * no children, and not a supertype. These kinds render via `render()`'s
 * text fast-path (`node.$text` present, no `$fields`/`$children` needed).
 *
 * @param entry A raw node-types.json entry.
 */
```

### `packages/codegen/src/validate/rule-lookup.ts::buildRuleLookup`

```text
/**
 * Build a rule inventory from a NodeMap. Cheap — no YAML parsing,
 * no file I/O.
 */
```

#### body

```text
// Alias labels: a reference site may surface a kind under a different
// CST name (`alias($._import_list, $.names)`). node-types.json lists the
// LABEL, while storage, wrap, and render are all keyed by the source
// kind (wrap normalizes the label's raw key into the source's storage
// key), so a label is renderable exactly when its source kind is. Read
// the stamped per-reference pair (`parseKind` = label, `node` = storage)
// rather than re-deriving it from spelling — a label need not be the
// source's stripped name. A label that is itself a real kind keeps its
// own classification.
```

#### body

```text
// A bare (unaliased) reference carries no label — only a differing
// label records the source as labeled.
```

#### body

```text
// User-facing hidden kinds reached by no labeled reference — polymorph
// variant children (dispatched, never a slot value) and top-level alias
// bodies. Their CST name is the stripped hidden name by construction:
// enrich's mints register the hidden rule AS `_<visibleName>`, and a
// base-authored alias body surfaces under its own stripped name. A
// labeled reference, when one exists, takes precedence above.
```

### `packages/codegen/src/validate/renderable.ts::renderable`

```text
/** Count of kinds that are renderable via one of the three paths. */
```

### `packages/codegen/src/validate/renderable.ts::missing`

```text
/** Kinds that have NO viable path. */
```

### `packages/codegen/src/validate/rule-lookup.ts::RenderKindPath`

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

### `packages/codegen/src/validate/rule-lookup.ts::kinds`

```text
/** All kinds known to the NodeMap, keyed by string. */
```

### `packages/codegen/src/validate/rule-lookup.ts::renderable`

```text
/** Kinds that reach a render path: template | text | dispatch. */
```

### `packages/codegen/src/validate/rule-lookup.ts::templated`

```text
/** Kinds with a template.yaml rule entry (templates only). */
```

### `packages/codegen/src/validate/rule-lookup.ts::path`

```text
/** Classification per kind. */
```

### `packages/codegen/src/validate/node-types-loader.ts::GRAMMAR_PATHS`

```text
/**
 * Non-standard node-types.json locations. Most grammars follow the
 * `tree-sitter-{name}/src/node-types.json` convention; this table
 * lists the exceptions (typescript ships two grammars per package).
 */
```

### `packages/codegen/src/validate/renderable.ts::module`

```text
/**
 * validate-renderable — every named kind in tree-sitter's node-types.json
 * must be renderable by @sittir/legacy-core.
 *
 * A kind is renderable when one of these holds:
 *
 *   1. Supertype   — has `subtypes` in node-types.json. Supertypes are
 *                    abstract; `render()` dispatches to the concrete subtype,
 *                    so the supertype itself never reaches the rules lookup.
 *
 *   2. Pure leaf   — has no `fields` AND no `children` in node-types.json.
 *                    `render()` returns `node.text` directly without any
 *                    template lookup.
 *
 *   3. Has rule    — kind appears in the `rules` map of templates directory
 *                    (either as a top-level entry or as a variant target).
 *
 * Anything else is un-renderable: calling `render()` on an instance will
 * throw `No render rule for '<kind>'`. That's a codegen regression we
 * want surfaced as a first-class validation error.
 */
```

### `packages/codegen/src/validate/rule-lookup.ts::module`

```text
/**
 * validate/rule-lookup.ts — shared rule-kind inventory.
 *
 * `validate-renderable` needs to answer "which kinds have a rule emit
 * path?" This module builds the inventory from a NodeMap — the
 * authoritative output of Assemble — rather than walking the generated
 * YAML's `rules:` map directly: that view is lossy (variant subtypes,
 * supertypes, and leaves that render via `node.text` aren't in the YAML at
 * all) and would be circular, since the YAML itself is the thing under
 * test.
 */
```

### `packages/codegen/src/validate/rule-lookup.ts::classify`

#### body

```text
/* 'branch'/'envelope'/'polymorph'/'list' all render via a template — a
		   polymorph is an envelope whose sole slot is a union; 'supertype' is
		   its own model type and dispatches to the subtype's template.
		   'token' is 'text' only for `AssembledKeyword` (a named literal, word
		   or not) — `AssembledToken` (anonymous) has no rendered surface of its
		   own. */
```

### `packages/codegen/src/validate/node-types-loader.ts::module`

```text
/**
 * validate/node-types-loader.ts — thin loader for tree-sitter
 * node-types.json.
 *
 * Consumed by both validators and emitters (grammar.ts, types.ts),
 * so it lives at validate/ rather than under any one consumer's
 * directory. Takes a grammar name and returns the parsed raw entry
 * array from that grammar's `node-types.json` file (or a
 * `.sittir/src/node-types.json` override if present). No caches,
 * no mutable state (FR-022).
 *
 * If a consumer needs to point at a non-standard file (e.g. test
 * fixtures), they pass the resolved path directly via the
 * `explicitPath` argument — there is no module-level path registry.
 */
```

### `packages/codegen/src/validate/node-types-loader.ts::packagesDir`

```text
// `new URL(...).pathname` is not portable on Windows and leaks URL-encoded
// escape sequences; `fileURLToPath` produces a correct platform path.
```
