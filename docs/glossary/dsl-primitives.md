# `packages/codegen/src/dsl/primitives` — Function Glossary

Per-function reference for `packages/codegen/src/dsl/primitives/`, mechanically relocated from source
JSDoc by `scripts/wave5-relocate-jsdoc.mts` (wave 5 comment-cleanup, pass 1 —
unedited, unverified). Pass 2 reformats/verifies these entries and decides
what merges into docs/compiler-phase-glossary.md's phase narrative.

See [AGENTS.md § Wave-style decomposition before commits](../../AGENTS.md).

---

### `maybeKeywordSymbol` (`packages/codegen/src/dsl/primitives/field.ts:32`)

```text
/**
 * Shared `FIELD(name, <shape-containing-STRING>)` →
 * `FIELD(name, <shape with STRING replaced by SYMBOL(_kw_<name>)>)`
 * transformation. Synthesizes a hidden `_kw_<name>: 'kw'` rule via
 * registerSyntheticRule, marks it for wire-managed `inline:`, and rewrites the content so
 * tree-sitter's normalizer preserves the FIELD wrapper.
 *
 * Tree-sitter strips FIELD wrappers around bare STRING nodes at grammar-
 * normalization time. To keep the field label, we indirect every
 * contained STRING through a hidden SYMBOL rule.
 *
 * Shapes handled:
 *
 *   - **Bare STRING** — direct `field('x', 'literal')` case. The STRING
 *     is replaced by a SYMBOL reference to `_kw_<x>` (body: `'literal'`).
 *
 *   - **OPTIONAL(STRING)** — grammar like `seq(optional('&'), ...)`
 *     with an override `0: field('lifetime')` wraps position 0 as
 *     `field('lifetime', optional('&'))`. Tree-sitter would strip the
 *     FIELD if the inner were bare STRING reachable through the
 *     optional; routing through a SYMBOL preserves the label. Both
 *     the `OPTIONAL` shape and tree-sitter's `CHOICE(STRING, BLANK)`
 *     representation of optional are handled.
 *
 * Used by:
 *   - transform.ts resolvePatch (one-arg field() placeholder path)
 *   - the two-arg field(name, 'literal') path below
 *
 * Optional `wrapSyntheticBody` lets callers apply an extra wrap
 * (e.g., transform's accumulated prec stack) around the synthetic
 * rule's body before registration. Returns the content unchanged
 * when no STRING is reachable through the recognized shapes.
 */
```

### `synthesizeKwSymbol` (`packages/codegen/src/dsl/primitives/field.ts:102`)

```text
/**
 * Create the `_kw_<fieldName>` hidden rule, register it for wire-managed
 * `inline:`, and return a SYMBOL reference to it.
 */
```

### `descendOptional` (`packages/codegen/src/dsl/primitives/field.ts:126`)

```text
/**
 * Recurse into an optional-shaped wrapper's content. If the inner is a
 * bare STRING that `maybeKeywordSymbol` would symbolize, rebuild the
 * wrapper around the new SYMBOL ref so the original optional semantics
 * are preserved while the inner STRING is routed through a hidden rule.
 *
 * `wrapperKind`:
 *   - `'optional'` — `{ type: 'OPTIONAL', content }` (both runtimes
 *     agree on this shape).
 *   - `'choice-blank'` — tree-sitter's `CHOICE` of `[content, BLANK]`
 *     normalized form of `optional(content)`.
 *
 * Returns the content unchanged if the inner isn't a symbolizable STRING.
 */
```

### `field` (`packages/codegen/src/dsl/primitives/field.ts:182`)

```text
/**
 * Two-arg form delegates to the runtime's native field. One-arg form
 * returns a placeholder for transform patches.
 *
 * When the two-arg form is called with a bare STRING literal content
 * (e.g. `field('async', 'async')`), the content is substituted with a
 * synthesized SYMBOL reference to a hidden `_kw_<name>` rule. This
 * mirrors transform.ts's placeholder path — tree-sitter's grammar
 * normalizer strips FIELD wrappers around bare STRING, so we indirect
 * through a SYMBOL to preserve the field in the parse tree.
 *
 * Return type is a discriminated union: the one-arg placeholder has
 * a readable `__sittirPlaceholder` brand; the two-arg result matches
 * whatever shape the runtime-injected `field()` produces (`type: 'FIELD'`
 * in both the sittir and tree-sitter-CLI runtimes).
 */
```

### `buildTwoArgFieldResult` (`packages/codegen/src/dsl/primitives/field.ts:214`)

```text
/**
 * Invoke the runtime-injected `field()` function, symbolize any bare STRING
 * content, and tag the result `metadata.fieldSource: 'override'`.
 *
 * @remarks
 * The native `field()` call normalizes `content` into a rule shape (plain
 * JS strings become STRING rules). If the normalized inner content is a bare
 * STRING, we swap it for a SYMBOL reference to a synthesized `_kw_<name>`
 * hidden rule so tree-sitter's grammar normalizer preserves the FIELD wrapper
 * around it (the normalizer strips FIELD wrappers around bare STRING nodes).
 * wire() later auto-inlines the helper back into the parse state machine so
 * the parser still sees the original bare token at the call site.
 * Tagging `metadata.fieldSource: 'override'` (debt PR-P1: was the top-level
 * `source: 'override'`, now the opaque metadata bag) records that a
 * user-authored `field()` call produced this rule, for diagnostics only.
 *
 * @param native - The runtime-injected `field(name, content)` function.
 * @param name - The field name to assign.
 * @param content - The raw content to place under the field.
 * @returns A FieldLike with `metadata.fieldSource: 'override'` stamped on it.
 */
```

### `refine` (`packages/codegen/src/dsl/primitives/refine.ts:49`)

```text
/**
 * Declare per-form choice selections for the current rule.
 *
 * Returns the rule unchanged structurally — the codegen metadata is
 * deposited into the active wire context. Validation (path resolves
 * to a choice, selection picks a valid arm) runs at codegen time, not
 * here: authoring-time paths may address positions that enrich or
 * transform will still modify before codegen reads them.
 *
 * @throws {Error} If called outside a wire() context.
 * @throws {Error} If a form name is duplicated within the same call.
 */
```

### `withRoleScope` (`packages/codegen/src/dsl/primitives/role.ts:77`)

```text
/**
 * Run `fn` with a fresh role accumulator in scope. Returns the
 * accumulated bindings AND `fn`'s result. Save/restore guarantees
 * nested `grammar(...)` calls stay isolated even on exception paths.
 *
 * Called by `grammarFn` in evaluate.ts — not by override authors.
 */
```

### `FieldPlaceholder` (`packages/codegen/src/dsl/primitives/field.ts:121`)

```text
/** Marker emitted by `field('name')` — a placeholder for transform patches. */
```

### `FormMap` (`packages/codegen/src/dsl/primitives/refine.ts:46`)

```text
/** `{ formName → { path → branchIndex | literal } }`. */
```

### `VALID_ROLE_NAMES` (`packages/codegen/src/dsl/primitives/role.ts:41`)

```text
/**
 * Mark an external token symbol with a structural-whitespace role.
 * Returns the symbol unchanged so the call site can be a transparent
 * member of the externals array.
 *
 * **Tree-sitter compatibility**: when `role()` is called outside any
 * sittir-managed scope (e.g. when tree-sitter's CLI loads the
 * transpiled `.sittir/grammar.js` and runs `grammar()` natively),
 * the binding is silently dropped and only the symbol passthrough
 * runs. Tree-sitter doesn't read role bindings — they only matter
 * to sittir's Link phase, which always evaluates the override file
 * inside a `withRoleScope` block. This keeps the same call site valid
 * for both consumers without runtime feature detection.
 */
```
