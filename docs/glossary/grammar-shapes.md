# `packages/codegen/src/grammar-shapes` — Function Glossary

Per-function reference for `packages/codegen/src/grammar-shapes/`, mechanically relocated from source
comments by `scripts/relocate-comments-to-glossary.mts` (mechanical pass —
unedited, unverified). A later pass reformats/verifies these entries and decides
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

```text
// ---------------------------------------------------------------------------
// Per-member symbol target detection (mirrors detectSymbolTarget).
// Returns the wrapped symbol NAME (string) eligible for fielding, or never.
// Applies the `_`-prefix gate: `_`-names only via Shape 1 + supertype.
// ---------------------------------------------------------------------------
```

### `MemberWrapName` (`packages/codegen/src/grammar-shapes/enrich-type.ts:148`)

```text
/**
 * The symbol NAME a member would wrap (eligibility), or `never`.
 * `_`-prefixed names: only Shape 1 + supertype (else never).
 */
```

```text
// Shape 1 (bare symbol): `_`-names only if supertype.
```

```text
// Shape 2 (optional symbol): `_`-names NEVER (gate).
```

```text
// Shape 3 (optional seq with lone symbol): `_`-names NEVER.
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

```text
/* never-guard FIRST: a non-wrap member yields `WName = never`, and a
		     bare `WName extends string` DISTRIBUTES over never -> never (the
		     `: N` fallback is unreachable), collapsing every non-wrapped member.
		     `[never] extends [string]` is `true`, so the never test must precede. */
```

```text
// not a wrap target -> unchanged
```

```text
// Shape 1
```

```text
// Shape 3
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
 * `field`/…) accept and compose in `grammar.sittir.ts`. A superset of the recursive
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

### Parameterized rule shapes (`packages/codegen/src/grammar-shapes/grammar-json.ts`)

`SeqRule` / `ChoiceRule` / … mirror tree-sitter's own discriminants, refined
over content: containers are bound over `readonly GrammarRule[]`, and leaves
mirror tree-sitter's `SymbolRule` shape structurally. `Rule` is the ambient
tree-sitter union.

`PrecRuleUnion` and `SingleContentWrapper` are the discriminant guards used by
the purely type-level `Enrich<>` and path types.

### `MutableDeep` (`packages/codegen/src/grammar-shapes/grammar-json.ts`)

The readonly→mutable bridge, used ONLY to PROVE the subtyping ladder
`GrammarJson ⊑ GrammarSchema<string>` (modulo readonly). It recursively strips
`readonly` so containers become `members: GrammarRule[]` (mutable), which IS
assignable to tree-sitter's `Rule`. It is not used at any runtime or navigation
site — it exists purely as an assertion aid.

### `PeelPrec` / `TopLevelKeys` (`packages/codegen/src/grammar-shapes/path-type.ts`)

`PeelPrec` resolves a single positional index against a rule's children after
transparently peeling PREC wrappers.

`TopLevelKeys` is the first-segment autocomplete layer — the cheap, perf-safe
one. It is the union of valid top-level index segments for a rule (after the
PREC peel), and editors offer these as completions for the first path segment.

### `PathKey` (`packages/codegen/src/grammar-shapes/path-type.ts`)

The type a transform patch-object KEY should have for rule `N`.

Shallow-precise, deep-permissive. The FIRST segment autocompletes to the rule's
real top-level INDICES (`TopLevelKeys`, bounds-checked), but `parsePath`
(`dsl/transform/transform-path.ts`) also admits non-numeric first segments the
type model cannot bounds-check: wildcard `_`, kind-match `(name)`,
field-traversal `name:`, and reverse index `-N`. Those are accepted permissively
so authored paths like `'(_expression)'`, `'_'`, and `'-1'` don't false-reject.
Deeper segments degrade to free-form via the `/${string}` tail — the soundness
rule is never to REJECT a deep path that can't be proven invalid.

CRUCIAL: the precise numeric `TopLevelKeys` arm must be preserved. The
permissive arms must NOT widen the whole union to `string`, or out-of-bounds
numeric keys — `'7'` on a 2-arm choice — would be silently accepted. That
out-of-bounds rejection is guarded by a negative-controlled
`@ts-expect-error` in `intellisense-demo.test-d.ts`.

### `TransformPatchMap` / `FastKeys` (`packages/codegen/src/grammar-shapes/path-type.ts`)

`TransformPatchMap<R>` keys each patch entry by `PathKey<R>`
(segment-1-precise) and values by the patch-value union. `TransformsFor<S>`
maps EVERY rule kind in a schema to its `original`-shape's patch-map. That
mapped type spans the whole rule set and is the standing type-checker PERF
risk, so it is parameterized over `KeyOf<R>` — the key strategy can be swapped
without touching the value/mapping machinery:

- PRECISE keys — `PathKey<EnrichRule<R>>`, which instantiates `EnrichRule` per
  rule. This is the cost driver.
- FAST keys — `PathKey<R>` on the RAW rule. Top-level member count is
  enrich-INVARIANT (enrich wraps in place and never adds or removes a top-level
  member), so segment-1 autocomplete is identical without instantiating
  `EnrichRule`. This is the perf fallback if PRECISE degrades check time.

The type-only imports of the DSL primitive return interfaces keep the value
axis DRY and introduce no runtime cycle — the primitives don't import
`grammar-shapes`.

### `grammar-shapes/path-type.ts` (module)

```text
/**
 * path-type.ts — type-level FIRST-SEGMENT addressing for transform PATH
 * keys over a (post-Enrich) rule shape.
 *
 * Only the first path segment is resolved precisely (`TopLevelKeys`), after
 * transparently peeling PREC wrappers (PREC does not consume a segment):
 *
 *   - SEQ / CHOICE  : the segment must be a valid `members` index.
 *   - single-content wrappers (FIELD/ALIAS/REPEAT/REPEAT1/TOKEN/
 *     IMMEDIATE_TOKEN) : the only valid segment is `'0'`.
 *   - leaves (SYMBOL/STRING/PATTERN/BLANK) : no valid segment (`never`).
 *
 * Everything past the first segment (`PathKey`'s `/${string}` tail) is
 * free-form and unchecked — deep paths are accepted permissively rather
 * than walked and bounds-checked (soundness: never REJECT a deep path we
 * can't prove invalid). The full recursive path-to-rule resolver this
 * module used to expose (`RuleAtPath`) was deleted as dead code (Track 1
 * sweep, commit `662fde555`); this module now only powers segment-1
 * autocomplete/validation, not full path resolution.
 *
 * Paths are `/`-joined segments, e.g. `'4/0'`, `'1/0'`. We model numeric
 * segments only (the dominant authoring form). Wildcard `_`, kind-match
 * `(name)`, and field-traversal `name:` are accepted by the runtime but are
 * left as `string`-typed escape hatches here (see PathKey below) — typing
 * them precisely is future work and degrading to `string` is sound.
 *
 * PERF (the stated risk): First-segment autocomplete (`TopLevelKeys`) is a
 * cheap hand-rolled union over the top-level members tuple, NOT a full path
 * walk over all paths (no `type-fest` `Paths` over the 182-rule registry,
 * which would blow up). SYMBOL stays a lazy name-tagged leaf: we do NOT
 * follow symbols cross-rule (authored paths address within one rule's
 * inline nesting).
 */
```

### `grammar-shapes/enrich-type.ts` (module)

```text
/**
 * enrich-type.ts — type-level mirror of `dsl/enrich.ts`'s STRUCTURAL field
 * insertion, for one rule body.
 *
 * WHY this is the linchpin: enrich is NOT path-transparent — it INSERTS
 * `FIELD(...)` rules into the rule tree. A transform path that crosses a
 * wrapped position gains a level. So `Enrich<>` must reproduce enrich's
 * insertion sites exactly, or every typed path is confidently wrong.
 *
 * EMPIRICAL CONTRACT (verified against runtime `enrich()` on all 182
 * tree-sitter-rust rules — see enrich-fidelity.test.ts):
 *
 *  - Structure is FULLY LOCALLY DECIDABLE on rust: there are ZERO
 *    structural skips. Every top-level seq member matching Shape 1/2/3
 *    (after the `_`-prefix + supertype gate) becomes a FIELD at the SAME
 *    index. No nested-repeat disqualification or claimed-name collision
 *    causes a structural divergence on rust. So `Enrich<>` needs NO
 *    cross-tuple counting for the STRUCTURE — only local shape checks.
 *
 *  - Insertion sites are SHALLOW: only direct top-level seq members (after
 *    peeling PREC), plus one `REPEAT(seq(...))` / `REPEAT1(seq(...))`
 *    level. enrich does NOT wrap symbols buried deeper in nested
 *    choices/seqs. Below an insertion site the structure equals raw.
 *
 *  - The three shapes (mirroring `detectSymbolTarget`):
 *      Shape 1: bare `SYMBOL`                          -> FIELD wraps it
 *      Shape 2: `CHOICE(SYMBOL, BLANK)` (= optional)   -> FIELD wraps inner SYMBOL
 *      Shape 3: `CHOICE(SEQ(SYMBOL, anon...), BLANK)`  -> FIELD wraps the SYMBOL in the seq
 *    (compiled grammar.json has NO OPTIONAL rule; optionals are
 *    CHOICE(_, BLANK).)
 *
 *  - The `_`-prefix gate (mirroring applySymbolToField): a symbol whose
 *    name starts with `_` only wraps when it is Shape 1 AND its name is a
 *    declared supertype; then the field name is the name with `_` stripped.
 *    `_`-prefixed Shape 2/3 are LEFT UNWRAPPED (e.g. break_expression's
 *    `optional($._expression)` stays raw; reference_type's
 *    `optional($.lifetime)` wraps because `lifetime` is non-`_`).
 *
 *  - The optional-keyword (`_marker`) pass does NOT fire on compiled
 *    grammar.json: `walkOptionalKeyword` matches CHOICE before peeling, so
 *    a compiled `CHOICE(STRING,BLANK)` is never seen as an optional. (The
 *    `*_marker` fields in the generated grammar are AUTHOR overrides, not
 *    enrich output.) So `Enrich<>` does NOT model it. NOTE: this is
 *    input-form-dependent — sittir's `{type:'OPTIONAL'}` form WOULD fire
 *    pass 3; correct here only because we type off compiled grammar.json.
 *
 * SOUNDNESS: field NAMES for numbered duplicates (e.g. index_expression's
 * `expression1`/`expression2`) need cross-tuple counting. Per the soundness
 * rule (degrade NAME, never STRUCTURE), when a wrapped symbol's name is not
 * provably unique among its siblings we widen the inserted FIELD's `name`
 * to `string` rather than guess. The FIELD still lands at the right index,
 * so PATHS stay correct; only the displayed name degrades. (On rust this
 * affects only `type_item` and `index_expression`.)
 */
```

### `IsPrec` (`packages/codegen/src/grammar-shapes/enrich-type.ts:21`)

```text
// ---------------------------------------------------------------------------
// PREC transparency — peel/rebuild a single layer at a time.
// ---------------------------------------------------------------------------
```

### `IsBlank` (`packages/codegen/src/grammar-shapes/enrich-type.ts:25`)

```text
// ---------------------------------------------------------------------------
// optional detection: CHOICE(X, BLANK) (order-insensitive, exactly 2 members)
// ---------------------------------------------------------------------------
```

### `StripUnderscore` (`packages/codegen/src/grammar-shapes/enrich-type.ts:39`)

```text
// ---------------------------------------------------------------------------
// Field-name decision for a wrapped symbol.
// ---------------------------------------------------------------------------
```

```text
/* Soundness: numbered-duplicate names need cross-tuple counting, which we do
   NOT attempt structurally. The base name is the symbol name (supertype:
   strip leading `_`). When the same base name occurs more than once among the
   seq's wrap-eligible members, the runtime numbers them — so we widen to
   `string` (degrade NAME, keep STRUCTURE). Uniqueness is decided by
   CountBaseName over the members tuple. */
```

### `ExtractLoneSymbol` (`packages/codegen/src/grammar-shapes/enrich-type.ts:45`)

```text
// >1 SYMBOL -> too complex
```

```text
// non-anon, non-symbol -> too complex
```

### `CountBase` (`packages/codegen/src/grammar-shapes/enrich-type.ts:91`)

```text
// Count how many members share a given base field name (for uniqueness).
```

### `WrapShape1` (`packages/codegen/src/grammar-shapes/enrich-type.ts:112`)

```text
// ---------------------------------------------------------------------------
// Member rewrite: insert FIELD at the wrap site, preserving structure.
// ---------------------------------------------------------------------------
```

### `EnrichMember.type` (`packages/codegen/src/grammar-shapes/enrich-type.ts:140`)

```text
// Shape 2
```

### `EnrichRepeatContent` (`packages/codegen/src/grammar-shapes/enrich-type.ts:164`)

```text
// ---------------------------------------------------------------------------
// Repeat(seq(...)) one-level descent (mirrors promoteInsideRepeatMembers /
// tryPromoteInRepeatSeq). We field-promote bare symbols inside a
// REPEAT/REPEAT1 whose content is a SEQ, at one level only.
// ---------------------------------------------------------------------------
```

### `EnrichRule` (`packages/codegen/src/grammar-shapes/enrich-type.ts:168`)

```text
// ---------------------------------------------------------------------------
// Top-level entry: Enrich one rule body.
//   - PREC: peel transparently, enrich inner, rewrap.
//   - SEQ:  enrich each member.
//   - REPEAT/REPEAT1 of SEQ: enrich the inner seq members.
//   - anything else (bare CHOICE of symbols, single SYMBOL, token, etc.):
//     unchanged (enrich only wraps within a top-level SEQ context).
// ---------------------------------------------------------------------------
```

### `SeqRule` (`packages/codegen/src/grammar-shapes/grammar-json.ts:1`)

```text
/**
 * grammar-json.ts — tuple-precise REFINEMENT of tree-sitter's ambient `Rule`
 * vocabulary (from `tree-sitter-cli/dsl.d.ts`, in tsconfig `types`).
 *
 * tree-sitter's `Rule` is shapeless for our purpose: `SeqRule = { type:'SEQ';
 * members: Rule[] }` collapses every member to the `Rule` union, so there is
 * no positional information for path addressing. We ADD the recursion by
 * PARAMETERIZING each rule over its content:
 *
 *   SeqRule<M>       ChoiceRule<M>      — M extends readonly GrammarRule[] (tuple-precise)
 *   FieldRule<N,C>   RepeatRule<C> …    — C extends GrammarRule (single content slot)
 *   SymbolRule<N>    mirrors tree-sitter's ambient SymbolRule<N> shape (a leaf)
 *   StringRule<V>  PatternRule<V>  BlankRule — leaves
 *
 * SINGLE VOCABULARY: these are tree-sitter's discriminants, refined. Leaves
 * mirror tree-sitter's shapes structurally (`SymbolRule<N>`). The `as const`
 * grammar.json emit instantiates these with concrete READONLY tuples; the
 * deriver / Enrich<> / path types operate on that form.
 *
 * READONLY, by necessity (documented deviation from "rule MUST extend Rule"):
 * `as const` produces readonly tuples, and positional path indexing
 * (`members[0]`) + `EnrichRule<>`'s `N extends SeqRule<…>` matching both REQUIRE
 * readonly. But a readonly-membered container is NOT assignable to
 * tree-sitter's mutable `Rule` (`{ members: Rule[] }`) — empirically proven.
 * The two requirements (readonly-for-paths vs rule⊑Rule) are mutually
 * exclusive under one variance. Resolution:
 *   - bound containers over `readonly GrammarRule[]` (our union), NOT
 *     `readonly Rule[]` (which would demand GrammarRule ⊑ Rule → false).
 *   - the `$` proxy returns `SymbolRule<R>` (a leaf, IS RuleOrLiteral) so
 *     `$.r` still composes in seq()/choice(); it does NOT return the
 *     readonly recursive shape (which wouldn't compose, and isn't what
 *     tree-sitter returns at runtime anyway).
 *   - the `GrammarJson extends GrammarSchema<string>` ladder is proven via
 *     a `MutableDeep<>` bridge (below), not by making rules literally ⊑ Rule.
 *
 * NOTE: compiled grammar.json has NO `OPTIONAL` rule — tree-sitter lowers
 * `optional(x)` to `CHOICE(x, BLANK)`. The Enrich<> + path machinery match
 * on `CHOICE(_, BLANK)`, never a phantom OPTIONAL.
 *
 * `supertypes` rename: compiled grammar.json carries `supertypes: string[]`,
 * but tree-sitter's ambient `Grammar.supertypes` is an AUTHORING CALLBACK
 * (`($, prev) => RuleOrLiteral[]`). The two collide on the same key, blocking
 * `GrammarJson extends GrammarSchema<string>`. We emit the array under
 * `supertypeNames` instead. Nothing depends on the typed field (the runtime
 * cross-check reads the raw `require`; the type-level supertype set is the
 * hardcoded `RustSupertypes`).
 */
```

### `grammar-shapes/grammar-shape.rust.ts` (module)

```text
/**
 * grammar-shape.rust.ts — GENERATED literal+tuple-preserving emit of the
 * RAW upstream tree-sitter-rust grammar.json.
 *
 * Emitted with `as const` so every STRING value stays a string LITERAL,
 * every rule name stays a literal key, and every JSON array becomes a
 * readonly TUPLE (positional indexing survives). A plain
 * `resolveJsonModule` import would widen all of these to
 * `string` / `T[]` and destroy the discriminants + tuple indices the
 * recursive deriver and path-key `Get` depend on.
 *
 * DO NOT hand-edit. Regenerate via grammar-shapes/emit-grammar-shape.mjs.
 *
 * Source (realpath, same pnpm-store entry as the production base import):
 *   node_modules/.pnpm/tree-sitter-rust@0.24.0_tree-sitter@0.22.4/node_modules/tree-sitter-rust/src/grammar.json
 */
```
