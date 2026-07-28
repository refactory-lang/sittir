# `packages/codegen/src/grammar-shapes` — Function Glossary

Per-function reference for `packages/codegen/src/grammar-shapes/`, mechanically relocated from source
JSDoc by `scripts/wave5-relocate-jsdoc.mts` (wave 5 comment-cleanup, pass 1 —
unedited, unverified). Pass 2 reformats/verifies these entries and decides
what merges into docs/compiler-phase-glossary.md's phase narrative.

See [AGENTS.md § Wave-style decomposition before commits](../../AGENTS.md).

---

### `RustSupertypes` (`packages/codegen/src/grammar-shapes/enrich-type.ts:68`)

```text
/** tree-sitter-rust declared supertypes (from grammar.json `supertypes`). */
```

### `RewrapPrec` (`packages/codegen/src/grammar-shapes/enrich-type.ts:83`)

```text
/** Wrap `Inner` back in the prec rule `P`'s shape (preserve value+type). */
```

### `OptionalInner` (`packages/codegen/src/grammar-shapes/enrich-type.ts:92`)

```text
/** If `C` is `CHOICE(X, BLANK)`, yields `X`; else `never`. */
```

### `BaseFieldName` (`packages/codegen/src/grammar-shapes/enrich-type.ts:117`)

```text
/** Base field name for a symbol name (supertype prefix stripped). */
```

### `Shape3Symbol` (`packages/codegen/src/grammar-shapes/enrich-type.ts:126`)

```text
/** Shape 3: SEQ whose members are exactly one SYMBOL + anon (STRING/PATTERN). */
```

### `MemberWrapName` (`packages/codegen/src/grammar-shapes/enrich-type.ts:148`)

```text
/**
 * The symbol NAME a member would wrap (eligibility), or `never`.
 * `_`-prefixed names: only Shape 1 + supertype (else never).
 */
```

### `FieldNameFor` (`packages/codegen/src/grammar-shapes/enrich-type.ts:198`)

```text
/** Field name to emit: base name if unique among siblings, else `string`. */
```

### `ReplaceOptionalMembers` (`packages/codegen/src/grammar-shapes/enrich-type.ts:212`)

```text
/**
 * Rebuild a CHOICE(X,BLANK) members tuple with the non-BLANK member replaced
 * by NewX. Maps over a CLEAN tuple param `M` (not an intersection's indexed
 * access) so classic TS keeps tuple-ness — an intersection-sourced
 * `[K in keyof (C & ChoiceRule)['members']]` collapses to a numeric-keyed
 * object under tsserver/vue-tsc (the engine editors run) and breaks the
 * downstream constraints, cascading every EnrichRule<> result to `never`.
 */
```

### `WrapShape3Members` (`packages/codegen/src/grammar-shapes/enrich-type.ts:224`)

```text
/** Rebuild a Shape-3 SEQ members tuple with its lone SYMBOL FIELD-wrapped. */
```

### `EnrichMember` (`packages/codegen/src/grammar-shapes/enrich-type.ts:229`)

```text
/**
 * Rewrite a single seq member, inserting a FIELD if it is a wrap target.
 * `AllMembers` is the sibling tuple (for the uniqueness/name decision).
 */
```

### `EnrichSeqMembers` (`packages/codegen/src/grammar-shapes/enrich-type.ts:270`)

```text
/** Map every member of a top-level seq through EnrichMember. */
```

### `SymbolRule` (`packages/codegen/src/grammar-shapes/grammar-json.ts:63`)

```text
/** SYMBOL leaf — structurally mirrors tree-sitter's ambient `SymbolRule<Name>`
 *  (`{ type: 'SYMBOL'; name: Name }`). Defined as sittir's OWN interface,
 *  not an alias of the ambient type: this module renames its authoring
 *  shapes to the `<X>Rule` form (decision 5), so a local `SymbolRule` alias
 *  would shadow — and self-reference — the ambient `SymbolRule` it used to
 *  point to. Kept byte-identical in shape; only the definition strategy
 *  changed. */
```

### `GrammarRule` (`packages/codegen/src/grammar-shapes/grammar-json.ts:134`)

```text
/** Union of every compiled-grammar.json rule shape (loose any-rule alias). */
```

### `AuthoringRule` (`packages/codegen/src/grammar-shapes/grammar-json.ts:153`)

```text
/**
 * Authoring-surface input: what the sittir-owned DSL primitives (`seq`/`choice`/
 * `field`/…) accept and compose in `overrides.ts`. A superset of the recursive
 * grammar-shape rules plus the bare literals tree-sitter allows. Deliberately
 * NOT tree-sitter's `RuleOrLiteral` (whose `Rule` members are MUTABLE, so our
 * readonly-tuple rule shapes aren't assignable to it — that mismatch is what
 * breaks `seq(choice(...))` composition). Our rules ARE `⊑ AuthoringRule`, so
 * they compose into each other.
 */
```

### `GrammarJson` (`packages/codegen/src/grammar-shapes/grammar-json.ts:179`)

```text
/** Top-level compiled grammar.json shape (the subset we type off). */
```

### `supertypeNames` (`packages/codegen/src/grammar-shapes/grammar-json.ts:183`)

```text
/** Compiled supertype-name array. Named `supertypeNames` (not
	 *  `supertypes`) to avoid colliding with tree-sitter's authoring callback
	 *  of the same name — see the file header. */
```

### `PrecRuleUnion` (`packages/codegen/src/grammar-shapes/grammar-json.ts:193`)

```text
/** PREC wrappers are transparent to path addressing (skip a segment). */
```

### `SingleContentWrapper` (`packages/codegen/src/grammar-shapes/grammar-json.ts:196`)

```text
/** Single-content wrappers that CONSUME a path segment (index 0 / -1). */
```

### `PeelPrec` (`packages/codegen/src/grammar-shapes/path-type.ts:48`)

```text
/** Peel all leading PREC wrappers (transparent) to the structural rule. */
```

### `TopLevelKeys` (`packages/codegen/src/grammar-shapes/path-type.ts:59`)

```text
/** Valid first-segment index strings for rule `N` (top-level). */
```

### `NonNumericFirstSegment` (`packages/codegen/src/grammar-shapes/path-type.ts:89`)

```text
/** Non-numeric first-segment forms from `parsePath` that the type model
 *  cannot bounds-check, accepted permissively. (`name:` also admits junk like
 *  `'5:'` — TS can't cheaply require a letter-initial; permissive is fine.) */
```

### `TransformPatchValue` (`packages/codegen/src/grammar-shapes/path-type.ts:119`)

```text
/** Patch values accepted in a transform patch-map: tree-sitter `RuleOrLiteral`
 *  (native rule objects + literals) plus sittir's DSL placeholder/result types.
 *  Sourced from the actual primitive return interfaces (DRY) via type-only
 *  imports — no runtime cycle (primitives don't import grammar-shapes).
 *
 *  `field('x')` returns `FieldPlaceholder`; `field('x', content)` returns
 *  `FieldLike`; `variant('y')` returns `VariantPlaceholder`. RESIDUAL:
 *  `alias()` is typed `=> unknown` (source-side, overloaded — fixing it needs
 *  overload signatures in dsl/primitives/alias.ts, outside this file set), so
 *  alias-valued transform entries are NOT cleared by enriching this union.
 *  `AliasPlaceholder` is included for the day `alias()` returns it; today it
 *  has no effect on the `unknown`-typed alias() expression. Reported as a
 *  residual — NOT papered with a `unknown`/`any` union (that would collapse
 *  the whole value type and accept anything). */
```

### `TransformPatchMap` (`packages/codegen/src/grammar-shapes/path-type.ts:135`)

```text
/** A single patch-map for one rule: path-key → patch value. */
```

### `FastKeys` (`packages/codegen/src/grammar-shapes/path-type.ts:138`)

```text
/** FAST key strategy: segment-1 keys from the RAW shape (enrich-invariant for
 *  top-level member count). */
```
