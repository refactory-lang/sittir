# `packages/codegen/src/grammar-shapes` — Function Glossary

Per-function reference for `packages/codegen/src/grammar-shapes/`, mechanically relocated from source
comments by `scripts/relocate-comments-to-glossary.mts` (mechanical pass —
unedited, unverified). A later pass reformats/verifies these entries and decides
what merges into docs/compiler-phase-glossary.md's phase narrative.

See [AGENTS.md § Wave-style decomposition before commits](../../AGENTS.md).

---


### `packages/codegen/src/grammar-shapes/enrich-type.ts::RustSupertypes`

```text
/** tree-sitter-rust declared supertypes (from grammar.json `supertypes`). */
```

### `packages/codegen/src/grammar-shapes/enrich-type.ts::RewrapPrec`

```text
/** Wrap `Inner` back in the prec rule `P`'s shape (preserve value+type). */
```

### `packages/codegen/src/grammar-shapes/enrich-type.ts::OptionalInner`

```text
/** If `C` is `CHOICE(X, BLANK)`, yields `X`; else `never`. */
```

### `packages/codegen/src/grammar-shapes/enrich-type.ts::BaseFieldName`

```text
/** Base field name for a symbol name (supertype prefix stripped). */
```

### `packages/codegen/src/grammar-shapes/enrich-type.ts::Shape3Symbol`

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

### `packages/codegen/src/grammar-shapes/enrich-type.ts::MemberWrapName`

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

### `packages/codegen/src/grammar-shapes/enrich-type.ts::FieldNameFor`

```text
/** Field name to emit: base name if unique among siblings, else `string`. */
```

### `packages/codegen/src/grammar-shapes/enrich-type.ts::ReplaceOptionalMembers`

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

### `packages/codegen/src/grammar-shapes/enrich-type.ts::WrapShape3Members`

```text
/** Rebuild a Shape-3 SEQ members tuple with its lone SYMBOL FIELD-wrapped. */
```

### `packages/codegen/src/grammar-shapes/enrich-type.ts::EnrichMember`

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

### `packages/codegen/src/grammar-shapes/enrich-type.ts::EnrichSeqMembers`

```text
/** Map every member of a top-level seq through EnrichMember. */
```

### `packages/codegen/src/grammar-shapes/grammar-json.ts::SymbolRule`

```text
/** SYMBOL leaf — structurally mirrors tree-sitter's ambient `SymbolRule<Name>`
 *  (`{ type: 'SYMBOL'; name: Name }`). Defined as sittir's OWN interface,
 *  not an alias of the ambient type: this module renames its authoring
 *  shapes to the `<X>Rule` form (decision 5), so a local `SymbolRule` alias
 *  would shadow — and self-reference — the ambient `SymbolRule` it used to
 *  point to. Kept byte-identical in shape; only the definition strategy
 *  changed. */
```

### `packages/codegen/src/grammar-shapes/grammar-json.ts::GrammarRule`

```text
/** Union of every compiled-grammar.json rule shape (loose any-rule alias). */
```

### `packages/codegen/src/grammar-shapes/grammar-json.ts::AuthoringRule`

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

### `packages/codegen/src/grammar-shapes/grammar-json.ts::GrammarJson`

```text
/** Top-level compiled grammar.json shape (the subset we type off). */
```

### `packages/codegen/src/grammar-shapes/grammar-json.ts::supertypeNames`

```text
/** Compiled supertype-name array. Named `supertypeNames` (not
	 *  `supertypes`) to avoid colliding with tree-sitter's authoring callback
	 *  of the same name — see the file header. */
```

### `packages/codegen/src/grammar-shapes/grammar-json.ts::PrecRuleUnion`

```text
/** PREC wrappers are transparent to path addressing (skip a segment). */
```

### `packages/codegen/src/grammar-shapes/grammar-json.ts::SingleContentWrapper`

```text
/** Single-content wrappers that CONSUME a path segment (index 0 / -1). */
```

### `packages/codegen/src/grammar-shapes/path-type.ts::module`

Type-level twin of `applyPath` (`dsl/transform/transform-path.ts`): decides,
for one written path and one rule shape, whether the walker would accept it.
It validates the keys an author wrote rather than enumerating every key a rule
admits — enumeration multiplies the alternative spellings of each node (`_`,
`-k`, `name:`) along a path, which is exponential in depth and stalled the
compiler on `grammar-shape.rust.ts`; validation costs one segment step per
written key and needs no depth cap.

The shape it walks is the post-enrich one (`EnrichRule`), because the runtime
walks the enriched rule. Where runtime enrich mints structure the type model
does not — exclusive field-choice distribution adds arms to a choice — the
model is a lower bound and the walk turns permissive rather than rejecting.

### `packages/codegen/src/grammar-shapes/path-type.ts::PeelPrec`

PREC wrappers consume no segment, as in `applyPath`.

### `packages/codegen/src/grammar-shapes/path-type.ts::Opaque`

A child the model cannot see below. Every further segment is accepted under
it. Produced for an index beyond a choice's modelled arity, since enrich may
have distributed more arms onto that choice at runtime.

### `packages/codegen/src/grammar-shapes/path-type.ts::Leaf`

A string member reached by a literal segment: nothing descends further.

### `packages/codegen/src/grammar-shapes/path-type.ts::Kinds`

The symbol names a `(kind)` segment can match from a node: symbols anywhere
below it, through PREC, containers and the single-content wrappers, but not
below a FIELD (the walker refuses a symbol inside a named field) and not
through an ALIAS (the walker does not enter one).

### `packages/codegen/src/grammar-shapes/path-type.ts::FromEnd`

Resolves a negative index against a member tuple: `-1` is the last member.

### `packages/codegen/src/grammar-shapes/path-type.ts::StepMembers`

One segment against a container's members: `_` is every member (the rest of
the path then has to hold for at least one of them, which the distributive
walk gives for free), an index or negative index is one member, a literal is
a string member. `Beyond` is what an out-of-range index yields — `Opaque` for
a choice, `never` for a sequence, whose arity enrich never changes.

### `packages/codegen/src/grammar-shapes/path-type.ts::Step`

One segment against one node, returning the child it lands on or `never`.
Mirrors the dispatch in `applyPath`: a FIELD takes `0`, `-1`, `_`, its own
`name:` and a literal of its content; ALIAS and the repeat/token wrappers take
`0`, `-1`, `_` and a literal; a `(kind)` match is terminal and lands on the
symbol itself. A `label:` segment on a non-field node is not a step (see `Walk`).

### `packages/codegen/src/grammar-shapes/path-type.ts::Segments`

Splits a path on `/`, keeping a quoted literal whole — rust's token-tree
punctuation includes `/` and `/=` as arms, so `"/="/after` is two segments.
Shared with `IsPreferencePath` (`dsl/primitives/preference-path.ts`), the way
`splitSegments` is shared by both runtime parsers.

### `packages/codegen/src/grammar-shapes/path-type.ts::Walk`

Steps every segment; `true` when all resolve. A union child (from `_`)
distributes, so a member on which the rest fails drops out as `never` and the
path holds if any member accepts it — the walker's skip-on-failure rule.
`Minted` is the union of field labels that earlier maps in the same patch list
introduced with `field(...)`. A `label:` segment that `Step` rejects on a node
that is not a FIELD stays on the same node only when its label is in `Minted`:
the earlier map wrapped that node in the field, and the fielded content is the
node itself. A FIELD with a different name still rejects, and a label no earlier
map minted rejects, in the first map as in any other.

### `packages/codegen/src/grammar-shapes/path-type.ts::IsPath`

`true` when `applyPath` would accept path `P` on rule `N`, `false` when it
would throw; `Minted` (default `never`) is the set of labels earlier maps in a
patch list minted, threaded by `PatchesCheck`. What `PatchesCheck` consults per written key.

### `packages/codegen/src/grammar-shapes/path-type.ts::TransformPatchValue`

A single patch value: a rule or literal (tree-sitter's or the grammar-json
`GrammarRule` the typed authoring builders return), or a `field` / `alias` /
`variant` / `arm.default` placeholder.

### `packages/codegen/src/grammar-shapes/path-type.ts::TransformPatchMap`

A patch map for one rule, path key to patch value. Keys are open here; their
validity is decided per written key by `PatchesCheck`, from the base the
grammar hands `wire()`.

### `packages/codegen/src/grammar-shapes/enrich-type.ts::module`

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
 *  - The optional-keyword pass does NOT fire on compiled
 *    grammar.json: `walkOptionalKeyword` matches CHOICE before peeling, so
 *    a compiled `CHOICE(STRING,BLANK)` is never seen as an optional. (The
 *    keyword-named fields in the generated grammar are AUTHOR overrides, not
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

### `packages/codegen/src/grammar-shapes/enrich-type.ts::IsPrec`

```text
// ---------------------------------------------------------------------------
// PREC transparency — peel/rebuild a single layer at a time.
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/grammar-shapes/enrich-type.ts::IsBlank`

```text
// ---------------------------------------------------------------------------
// optional detection: CHOICE(X, BLANK) (order-insensitive, exactly 2 members)
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/grammar-shapes/enrich-type.ts::StripUnderscore`

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

### `packages/codegen/src/grammar-shapes/enrich-type.ts::ExtractLoneSymbol`

```text
// >1 SYMBOL -> too complex
```

```text
// non-anon, non-symbol -> too complex
```

### `packages/codegen/src/grammar-shapes/enrich-type.ts::CountBase`

```text
// Count how many members share a given base field name (for uniqueness).
```

### `packages/codegen/src/grammar-shapes/enrich-type.ts::WrapShape1`

```text
// ---------------------------------------------------------------------------
// Member rewrite: insert FIELD at the wrap site, preserving structure.
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/grammar-shapes/enrich-type.ts::EnrichMember.type`

```text
// Shape 2
```

### `packages/codegen/src/grammar-shapes/enrich-type.ts::EnrichRepeatContent`

```text
// ---------------------------------------------------------------------------
// Repeat(seq(...)) one-level descent (mirrors promoteInsideRepeatMembers /
// tryPromoteInRepeatSeq). We field-promote bare symbols inside a
// REPEAT/REPEAT1 whose content is a SEQ, at one level only.
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/grammar-shapes/enrich-type.ts::EnrichRule`

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

### `packages/codegen/src/grammar-shapes/grammar-json.ts::SeqRule`

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

### `packages/codegen/src/grammar-shapes/grammar-shape.<grammar>.ts::module`

Generated, one per registered grammar: the upstream `src/grammar.json` reduced
to `{ name, rules, supertypeNames }` and emitted `as const satisfies
GrammarJson`, so every STRING stays a literal, every rule name a literal key
and every array a readonly tuple. A `resolveJsonModule` import would widen all
three and destroy the discriminants and tuple indices the type-level deriver
and `IsPath` depend on. `packages/<grammar>/base.ts` re-exports the upstream `grammar.js`, which
tsconfig `paths` types as this shape (see `emitUpstreamDeclarationSource`). Never hand-edited: `emit-grammar-shape.ts` rewrites
it and `grammar-shape-fresh.test.ts` fails when it is stale.

### `packages/codegen/src/grammar-shapes/emit-grammar-shape.ts::BASE_ENTRY`

The per-package file that names the upstream grammar (`base.ts`). It is the
one place a grammar's upstream package is written down: `grammar.sittir.ts`
imports the base from it, and the shape emitter reads its `import raw from
'<upstream grammar.js>'` line to find the matching `src/grammar.json`, so a
grammar's runtime base and its type-level shape cannot name different sources.
`base.ts` is loaded by Node type stripping (through tree-sitter's grammar
run), so it holds only erasable syntax.

### `packages/codegen/src/grammar-shapes/emit-grammar-shape.ts::upstreamDeclarationFile`

Where a grammar's declaration of its upstream module lives:
`grammar-shapes/upstream/<specifier minus the tree-sitter- prefix and .js>.d.ts`.
The specifier must be a `tree-sitter-<name>/…/grammar.js` package specifier so the
one `tree-sitter-*` entry in the root tsconfig `paths` maps every grammar to its
declaration; a base that names anything else fails at emit.

### `packages/codegen/src/grammar-shapes/emit-grammar-shape.ts::emitUpstreamDeclarationSource`

The declaration itself: the module's default export is the grammar's shape type.
tree-sitter ships no `.d.ts`, and a `@ts-expect-error` on the import would hide
every later import failure, so the untyped module is given its type at the
boundary instead. Node ignores `paths` and loads the real `grammar.js`.

### `packages/codegen/src/grammar-shapes/emit-grammar-shape.ts::grammarShapeFile`

Path of a grammar's generated shape file, keyed by the registry name.

### `packages/codegen/src/grammar-shapes/emit-grammar-shape.ts::upstreamGrammarJson`

Resolves the upstream `src/grammar.json` beside the `grammar.js` that a
package's `base.ts` imports, through the realpath so the pnpm-store entry that
production loads is the one that is read.

### `packages/codegen/src/grammar-shapes/emit-grammar-shape.ts::emitGrammarShapeSource`

The shape file's text for one grammar, formatted with the repo's oxfmt config.
Supertypes are emitted under `supertypeNames`: tree-sitter's ambient
`Grammar.supertypes` is an authoring callback, so the same key would keep
`GrammarJson` from matching its schema. Run the file directly to rewrite every
grammar's shape.
