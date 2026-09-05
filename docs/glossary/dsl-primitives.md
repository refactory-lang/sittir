# `packages/codegen/src/dsl/primitives` — Function Glossary

Per-function reference for `packages/codegen/src/dsl/primitives/`, mechanically relocated from source
comments by `scripts/relocate-comments-to-glossary.mts` (mechanical pass —
unedited, unverified). A later pass reformats/verifies these entries and decides
what merges into docs/compiler-phase-glossary.md's phase narrative.

See [AGENTS.md § Wave-style decomposition before commits](../../AGENTS.md).

---


### `packages/codegen/src/dsl/primitives/field.ts::maybeKeywordSymbol`

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

#### body

```text
/* Tree-sitter's FIELD(OPTIONAL(SYMBOL)) survives; FIELD(OPTIONAL(STRING))
	   may not. */
```

#### body

```text
/* CHOICE(STRING, BLANK) is tree-sitter's normalized form for
	   `optional(STRING)`. */
```

### `packages/codegen/src/dsl/primitives/field.ts::synthesizeKwSymbol`

```text
/**
 * Create the `_kw_<fieldName>` hidden rule, register it for wire-managed
 * `inline:`, and return a SYMBOL reference to it.
 */
```

### `packages/codegen/src/dsl/primitives/field.ts::descendOptional`

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

### `packages/codegen/src/dsl/primitives/field.ts::field`

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

### `packages/codegen/src/dsl/primitives/field.ts::buildTwoArgFieldResult`

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

### `packages/codegen/src/dsl/primitives/refine.ts::refine`

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

### `packages/codegen/src/dsl/primitives/role.ts::withRoleScope`

```text
/**
 * Run `fn` with a fresh role accumulator in scope. Returns the
 * accumulated bindings AND `fn`'s result. Save/restore guarantees
 * nested `grammar(...)` calls stay isolated even on exception paths.
 *
 * Called by `grammarFn` in evaluate.ts — not by override authors.
 */
```

### `packages/codegen/src/dsl/primitives/field.ts::FieldPlaceholder`

```text
/** Marker emitted by `field('name')` — a placeholder for transform patches. */
```

### `packages/codegen/src/dsl/primitives/refine.ts::FormMap`

```text
/** `{ formName → { path → branchIndex | literal } }`. */
```

### `packages/codegen/src/dsl/primitives/role.ts::VALID_ROLE_NAMES`

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

### `packages/codegen/src/dsl/primitives/role.ts::currentRoles`

```text
/**
 * Module-local accumulator. Null when no `grammar(...)` call is on
 * the stack — calling `role()` in that state is an error because we
 * have no scope to attach the binding to.
 */
```

### `packages/codegen/src/dsl/primitives/field.ts::module`

```text
/**
 * dsl/field.ts — sittir field shadow with one-arg placeholder form.
 *
 * Tree-sitter's baseline `field()` takes two args: `field(name, content)`.
 * Sittir's transform() patches need a one-arg form so authors can write:
 *
 *     transform(original, { 0: field('expression') })
 *
 * Two-arg calls delegate to whichever `field` is provided as a global
 * by the runtime — sittir's grammarFn-injected field (`{type:'FIELD'}`)
 * in sittir's pipeline, or tree-sitter's native field (same shape) when
 * the transpiled grammar.js is loaded by tree-sitter's CLI. This keeps
 * the same call site valid for both consumers.
 *
 * One-arg calls return a sittir-only placeholder marker that
 * `transform()`'s resolvePatch swaps out before the result reaches
 * the runtime's grammar() processing. The marker never escapes into
 * a final grammar tree.
 *
 * Import explicitly when you want the one-arg form:
 *
 *     import { field } from '@sittir/codegen/dsl'
 */
```

### `packages/codegen/src/dsl/primitives/alias.ts::module`

```text
/**
 * dsl/alias.ts — sittir alias shadow with placeholder form.
 *
 * Two authoring modes:
 *
 *   1. **Two-arg** — `alias(rule, $.name)` or `alias(rule, 'name')`:
 *      delegates directly to the runtime's native `alias()`.
 *
 *   2. **One-arg placeholder** — `alias('assignment_eq')`:
 *      returns an `AliasPlaceholder` that `transform()`'s
 *      `resolvePatch` fills in with the original content at the
 *      patch target. Same pattern as `field('name')`.
 *
 *      In the override file:
 *        transform(original, { '1/0': alias('assignment_eq') })
 *
 *      resolvePatch produces:
 *        alias(original_content_at_1_0, { type: 'SYMBOL', name: 'assignment_eq' })
 *
 * Import explicitly when you want the placeholder form:
 *
 *     import { alias } from '@sittir/codegen/dsl'
 */
```

### `packages/codegen/src/dsl/primitives/refine.ts::module`

```text
/**
 * dsl/primitives/refine.ts — declare correlated choice selections
 * across non-adjacent positions as named forms.
 *
 * Authoring-only primitive: produces codegen metadata via the active
 * wire context; the rule tree is unchanged. Tree-sitter parses using
 * the original shape.
 *
 * Use case: a rule whose choice positions are correlated — picking one
 * alternative in position A implies picking a specific alternative in
 * position B. TypeScript's `interface_body` is the motivating example:
 *
 *     interface_body: ($, original) => refine(original, {
 *         curly: { 'opening:': '{',  'closing:': '}'  },
 *         flow:  { 'opening:': '{|', 'closing:': '|}' },
 *     }),
 *
 * Read as: "`curly` form selects `{` at the `opening` field and `}` at
 * the `closing` field; `flow` form selects `{|` and `|}`." Each outer
 * key names a form; each inner key is a path to a choice node; each
 * inner value picks one branch (numeric index or literal-matching
 * string).
 *
 * Codegen emits per-form namespace-keyed factories — `ir.interfaceBody
 * .curly(config)`, `ir.interfaceBody.flow(config)` — with narrowed
 * Config types for the refined positions. The auto-stamp rule
 * then collapses the now-single-literal fields to absent Config keys,
 * so callers don't restate the literals that were implied by the form.
 *
 * The bare call `ir.interfaceBody(config)` routes to the
 * **first-declared** form. Authors order entries so the common case
 * comes first.
 *
 * Round-trip: readNode output and refine-factory output produce
 * identical NodeData shapes — no `$variant` tag, no discriminator.
 * Consumers that need "which form is this?" inspect
 * `$fields.opening` (or any refined position) directly.
 *
 * @see packages/codegen/src/dsl/wire/wire.ts — WireContext.refineForms
 */
```

### `packages/codegen/src/dsl/primitives/role.ts::module`

```text
/**
 * dsl/role.ts — structural-whitespace role primitive for override files.
 *
 * Sittir-specific DSL addition. Indent-sensitive grammars annotate
 * external tokens with their structural role (`indent` / `dedent` /
 * `newline`) inline in the externals callback:
 *
 *     externals: ($, prev) => [
 *         ...prev,
 *         role($._indent,  'indent'),
 *         role($._dedent,  'dedent'),
 *         role($._newline, 'newline'),
 *     ],
 *
 * `role()` returns the symbol reference UNCHANGED so the externals
 * array still receives a valid token reference. As a side effect it
 * pushes the binding onto a per-grammar accumulator that
 * `evaluate.ts`'s `grammarFn` consumes and attaches to the resulting
 * grammar as `externalRoles`. Link reads it from `raw.externalRoles`
 * to drive its symbol-resolution behavior.
 *
 * The accumulator is scoped to the enclosing `grammar(...)` call via
 * a save/restore pattern (see `withRoleScope`), so nested
 * `grammar(enrich(base), {...})` evaluations don't leak roles between
 * scopes.
 *
 * Import explicitly:
 *
 *     import { role } from '@sittir/codegen/dsl'
 */
```

### `packages/codegen/src/dsl/primitives/role.ts::role`

#### body

```text
// Runtime validation — the TS type parameter doesn't flow through
// override files' @ts-nocheck imports, so a typo like 'indet' would
// otherwise silently store a wrong binding.
```

### `packages/codegen/src/dsl/primitives/arm.ts::arm`

The `arm` namespace exists so the placeholder can be spelled `default`, which
is a reserved word and therefore illegal as a function name but legal as a
property. `arm.default` is a value, not a call — it carries no per-site data.

Placed on a choice arm in `patches`, it stamps `annotations.default` on that
arm, and `resolvePatch` rejects a path whose parent is not a choice. The fact
then rides the slot's value bag beside `variant`/`variantOf`, which is what
carries it through an ALIAS collapse; the from emitter reads it as the
tie-break when several arms admit the same bare value.

    patches: { impl_item: { '3/0/0/0': arm.default } }

### `packages/codegen/src/dsl/primitives/variant.ts::VariantPlaceholder`

```text
/**
 * dsl/variant.ts — nested-alias polymorph sugar.
 *
 * `variant('block')` inside a rule callback for `closure_expression` mints a
 * kind name for that anonymous choice arm — equivalent to an author writing
 * an explicit `alias('closure_expression_block')` — and registers the hidden
 * rule plus a GLR conflict group so the arms remain distinguishable. It
 * carries NO classification metadata: the `WireContext` has no
 * `polymorphVariants`-style channel (deleted in the V2 wire-channel-deletion
 * work; see `dsl/wire/wire.ts`'s `WireContext`, which has only `deposits` /
 * `syntheticInline` / `conflictGroups` / `refineForms` / `groups`), per
 * `docs/superpowers/specs/2026-07-02-rule-type-model-ssot-research.md`
 * decision 7.
 *
 * Usage in grammar.sittir.ts:
 *
 *     closure_expression: ($, original) => transform(original,
 *         { 0: field('static'), 1: field('async'), 2: field('move') },
 *         { '4/0': variant('block'), '4/1': variant('expr') },
 *     ),
 */
```

### `packages/codegen/src/dsl/primitives/spacing.ts::SPACING_ARMS`

```text
// The whitespace kinds every spacing preference chooses between. `tight`
// renders nothing; each is a never-scanned external so it has a kind id.
```

### `packages/codegen/src/dsl/primitives/spacing.ts::spacingLabel`

```text
/** The preference label of a separator gap: `<token>_separator_space_<side>`
 *  for a token, `empty_separator_space` for an unseparated repeat. It is a
 *  top-level key of the grammar's `Options` type and of its `defaults`. */
```

### `packages/codegen/src/dsl/primitives/spacing.ts::RenderDefaults`

```text
/**
 * A grammar's declared render defaults: `labels` maps a separator spacing
 * label to its default arm; `sites[kind][address]` holds a site's default
 * and, where the grammar named it, its label — the address being a slot
 * site key or the flank side `start` / `end`. Wire derives it from the
 * `preference()` declarations in `patches:` (renderDefaultsOf); evaluate
 * carries it to RawGrammar.renderDefaults and `spaceRenderRules` consumes it.
 */
```

### `packages/codegen/src/dsl/primitives/spacing.ts::parseSpacingLabel`

```text
/** Recognises a spacing label — a token with a side, or the empty gap
 *  without one — so wire reads a `patches:` key of that name as a
 *  separator spacing default rather than a rule to patch. */
```

### `packages/codegen/src/dsl/primitives/spacing.ts::siteKey`

```text
/** The kind × slot option key of one site, the same string on the Options
 *  type, the grammar's defaults, the transport field and the wire:
 *  `<slot>_<label>` for a declared preference; for separator spacing the
 *  token is the slot's own and is dropped, `<slot>_separator_space` for the
 *  empty gap and `<slot>_separator_space_before` / `_after` for a token. */
```

### `packages/codegen/src/dsl/primitives/spacing.ts::FLANK_START_ARMS`

```text
// The arms of an array's start flank: the whitespace kinds and `indent`,
// which is one level deeper then a newline. `FLANK_END_ARMS` swaps `indent`
// for `dedent`; `WHITESPACE_ARMS` is the union the writer knows.
```

### `packages/codegen/src/dsl/primitives/spacing.ts::flankAddress`

```text
/** The kind-level address of an array flank, `<kind>_start` / `<kind>_end`:
 *  the key it is declared under in `patches:`, the key it takes in `Options`
 *  and the key the native resolver matches. `parseFlankAddress` reads one
 *  back; wire treats such a key as a flank default only when no rule is
 *  spelled that way. */
```

### `packages/codegen/src/dsl/primitives/spacing.ts::SiteDefault`

```text
/** One declared site default: the arm, and the label the grammar gave the
 *  site when it declared one. */
```
