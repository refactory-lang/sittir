# `packages/codegen/src/types` — Function Glossary

Per-function reference for `packages/codegen/src/types/`, mechanically relocated from source
JSDoc by `scripts/wave5-relocate-jsdoc.mts` (wave 5 comment-cleanup, pass 1 —
unedited, unverified). Pass 2 reformats/verifies these entries and decides
what merges into docs/compiler-phase-glossary.md's phase narrative.

See [AGENTS.md § Wave-style decomposition before commits](../../AGENTS.md).

---

### `fail` (`packages/codegen/src/types/diagnostics.ts:80`)

```text
/** Emit a blocking (fail) diagnostic. `canProceed` is forced to `false` —
	 *  a `'fail'` is blocking by definition, so the caller cannot supply it. */
```

### `all` (`packages/codegen/src/types/diagnostics.ts:94`)

```text
/** Returns a shallow copy — callers cannot mutate the sink's backing array. */
```

### `hasBlocking` (`packages/codegen/src/types/diagnostics.ts:99`)

```text
/** Returns true iff at least one item has severity === 'fail'. */
```

### `kindKey` (`packages/codegen/src/types/parsekind-collisions.ts:55`)

```text
/**
 * Bucket / distinctness key for a kind: the stamped parser id when the
 * value carries one (collision-free identity), the name otherwise. The
 * two key spaces are prefixed so a numeric id can never be spelled by a
 * kind name.
 */
```

### `isEnumChoiceRule` (`packages/codegen/src/types/rule.ts:470`)

```text
/**
 * Predicate: rule is an enum-shaped ChoiceRule (flat, all-STRING members,
 * at least 2 members). Matches the pre-link form; post-link use literalTextOf.
 *
 * This is the canonical replacement for `rule.type === ENUM`.
 *
 * @remarks
 * The guard type is `Extract<R, {type: CHOICE}> & {readonly __enumShaped?:
 * never}` rather than plain `Extract<R, {type: CHOICE}>`. Without the brand,
 * TS treats a `false` result as "not CHOICE at all" (since the predicate
 * type is structurally indistinguishable from a plain `rule.type === CHOICE`
 * check), which wrongly excludes non-enum CHOICE rules from the false
 * branch — including collapsing it to `never` when `R` was already narrowed
 * to a CHOICE-only type (e.g. inside `switch (rule.type) case CHOICE:`). The
 * phantom brand makes the true-branch type a distinct (enum-shaped) subtype
 * of CHOICE, so the false branch correctly keeps every non-enum-shaped
 * member of `R`, CHOICE included.
 */
```

### `collectFieldNames` (`packages/codegen/src/types/rule.ts:678`)

```text
/**
 * Collect the set of field names referenced anywhere in a rule tree.
 * Returns names only — cheap one-pass walker with no AssembledField
 * allocation. Pre-assembly phases (classifier) that only need field-set equality call this
 * instead of constructing full AssembledField objects just to extract
 * names.
 */
```

### `replaceAtPath` (`packages/codegen/src/types/rule.ts:737`)

```text
/**
 * Return a new rule tree with the sub-rule at `path` replaced by
 * `replacement`. Pure — no mutation of input. Path segments index into:
 *   - seq.members[i] / choice.members[i]
 *   - wrapper.content (path '0' for optional/repeat/repeat1/field/
 *     token/alias/variant/clause/group)
 *
 * Throws if any segment fails to address.
 */
```

### `sym` (`packages/codegen/src/types/rule.ts:778`)

```text
/**
 * Symbol reference constructor — baseline DSL shadow used by metadata
 * helpers that need a real runtime symbol without fabricating the object.
 */
```

### `extractSymbolName` (`packages/codegen/src/types/runtime-shapes.ts:91`)

```text
/**
 * Extract the symbol name from a value that might be a symbol reference
 * in any runtime shape. Tree-sitter CLI wraps `$` references as
 * nested objects; this unwraps to the name string if possible.
 */
```

### `isEnrichShapedFieldWrapper` (`packages/codegen/src/types/runtime-shapes.ts:114`)

```text
/**
 * True for a FIELD wrapper whose SHAPE matches what `dsl/enrich.ts`'s
 * mechanical passes produce — independent of the `source` provenance tag.
 * Per the 2026-07-02 user decision (lingering-debt-inventory-research.md
 * §3.1, "DESIGN QUESTION — RESOLVED"): a user-authored wrapper that is
 * shape-identical to enrich's output IS patch-transparent — structural
 * semantics win unconditionally, provenance is not required. This predicate
 * is `transform.ts`'s structural replacement for the former
 * `inner.source === 'inferred' || inner.source === 'enriched'` checks.
 *
 * Covers the two FIELD(SYMBOL) shapes enrich actually emits
 * (`dsl/enrich.ts` passes 1 and 2 — see that file's header comment; the
 * "bare leading-keyword" pass is disabled and never fires):
 *
 *   1. Symbol-to-field promotion (`applySymbolToField` and its
 *      repeat-seq variants) — `field(NAME, SYMBOL(SYM))` where NAME is
 *      derived from SYM's name: `NAME === SYM`, the supertype-stripped
 *      form `NAME === SYM.replace(/^_/, '')` (e.g. `field('expression',
 *      $._expression)`), or either of those with a 1-based numbered
 *      suffix for duplicate-kind positions (`NAME === base + N`, e.g.
 *      `field('expression1', $.expression)` / `field('expression2',
 *      $.expression)` — see `enrich.test.ts` "numbers duplicate
 *      references").
 *   2. Optional keyword-prefix promotion (`tryPromoteInnerKeyword`) —
 *      `field(*, SYMBOL(_kw_*))`: the referenced symbol's reserved
 *      `_kw_` prefix is itself the signal (the field's own name follows
 *      the `<token>_marker` convention but that's not load-bearing here —
 *      the hidden-symbol prefix is enrich's exclusive namespace, so any
 *      FIELD wrapping a `_kw_*` SYMBOL is enrich-shaped).
 */
```

### `isContainerType` (`packages/codegen/src/types/runtime-shapes.ts:163`)

```text
/**
 * True for `SEQ` / `CHOICE` — rules with a `members: Rule[]` payload.
 */
```

### `isWrapperType` (`packages/codegen/src/types/runtime-shapes.ts:170`)

```text
/**
 * True for single-content wrapper types — `OPTIONAL`, `REPEAT`,
 * `REPEAT1`, `FIELD`, plus the token-wrapper variants tree-sitter
 * uses internally.
 */
```

### `isPrecWrapper` (`packages/codegen/src/types/runtime-shapes.ts:187`)

```text
/**
 * True for precedence wrappers — `PREC`, `PREC_LEFT`, `PREC_RIGHT`,
 * `PREC_DYNAMIC`. Sittir's runtime strips these (see
 * `evaluate.ts::prec`); tree-sitter preserves them. Path addressing
 * treats them as transparent.
 */
```

### `typeEq` (`packages/codegen/src/types/runtime-shapes.ts:207`)

```text
/** True if `t` equals `upper` (both runtimes now agree on the discriminant case). */
```
