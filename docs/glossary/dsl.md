# `packages/codegen/src/dsl` — Function Glossary

Per-function reference for `packages/codegen/src/dsl/`, mechanically relocated from source
comments by `scripts/relocate-comments-to-glossary.mts` (mechanical pass —
unedited, unverified). A later pass reformats/verifies these entries and decides
what merges into docs/compiler-phase-glossary.md's phase narrative.

See [AGENTS.md § Wave-style decomposition before commits](../../AGENTS.md).

---



### `packages/codegen/src/dsl/enrich.ts::getEnrichRuleOrigins`

The rule-origin map `enrich()` attaches to its result under `ENRICH_RULE_ORIGINS_KEY`: every rule name enrich adds, keyed to its `EnrichMintKind`, plus each upstream hidden rule it exposes through an alias (`promoted-group`, carrying the visible name it is exposed as). Empty when the grammar was not enriched. Every other enrich-rule getter is a filtered view of this one map.

### `packages/codegen/src/dsl/enrich.ts::getEnrichTextTokens`

The text tokens enrich minted, each with the rules that reference it (the `text` origins).

### `packages/codegen/src/dsl/enrich.ts::TEXT_TOKENS_KEY`

The non-enumerable key under which `sittirGrammar` attaches the live text-token names to `result.grammar` (`attachTextTokens`), so they never reach grammar.json.

### `packages/codegen/src/dsl/enrich.ts::attachTextTokens`

Attaches the text-token names to a grammar under `TEXT_TOKENS_KEY`. `sittirGrammar` attaches the minted names that `blankDeadEnrichMints` did not blank.

### `packages/codegen/src/dsl/enrich.ts::getTextTokens`

The text-token names attached to a grammar; empty when none were attached. Evaluate reads them into `RawGrammar.textTokens`.

### `packages/codegen/src/dsl/enrich.ts::getEnrichMints`

The rules enrich adds: the names in the origin map whose origin is an `EnrichMintKind`, which leaves out `promoted-group`. The set equals the enriched grammar's rule names minus the base grammar's. An upstream rule is never a mint: not one exposed through an alias (`promoted-group`), and not one enrich rewrites in place (a `liftAliasedHiddenRuleBodies` rewrite, a field-wrap pass).

### `packages/codegen/src/dsl/enrich.ts::enrichRuleNamesOf`

The names in an enriched grammar's origin map whose origin passes `keep`; the one filter behind the enrich-rule getters.

### `packages/codegen/src/dsl/extras.ts::extrasClosure`

The extras of a grammar closed over supertypes, in both directions: each listed name; every member of a supertype in the set, transitively; and every supertype whose members are all in the set, to a fixpoint. The upward direction is what makes a supertype over extras an extra itself (rust's `comment` over `line_comment`/`block_comment`), since tree-sitter refuses a non-terminal supertype in the `extras` list. `subtypesOf` answers a name's members, or `undefined` when the name is not a supertype. The one rule both readings of "is this an extra" use: wire's `extraRuleNames` over the DSL rules and the compiler's `triviaKinds` over the node map.

### `packages/codegen/src/dsl/enrich.ts::getEnrichHiddenSubsequences`

The inline-safe clause-hoist groups (`_<parent>_optional<N>`): the names whose origin is `hidden-subsequence`. Wire adds them to the grammar's `inline:` list.

### `packages/codegen/src/dsl/enrich.ts::getEnrichFieldBackings`

The hidden rules enrich mints only to back a field: `keyword` mints (`_kw_<name>`) and `field-enum` mints (a field's choice of literals, e.g. typescript's `_kind`). They hold no structure of their own, so wire adds them to the grammar's `inline:` list: tree-sitter folds each body into its uses when it builds the tables, the LR shape stays the one upstream has (a separate nonterminal turns upstream's shift on `let` into a reduce/reduce choice), and the field wrapper still shows in the parse tree. `literal-alias-storage` mints are not included: they are the storage an alias points at.

### `packages/codegen/src/dsl/enrich.ts::getEnrichVisibleSubsequenceSources`

The names whose origin is `visible-subsequence` or `promoted-group`: the source rules behind visible-group mints, both the synthesized bodies and the promoted upstream hidden rules.

```text
/**
 * Wire filters these OUT of the grammar's final
 * `inline:` list before it reaches tree-sitter: an inlined source rule is
 * erased during tree-sitter's inline processing, which vaporizes the alias
 * (and the minted kind's parser identity) while sittir's IR still models
 * the kind — the phantom-kind divergence. Un-inlining the source keeps the
 * mint real on both sides.
 */
```

### `packages/codegen/src/dsl/enrich.ts::extractGrammarSymbolNames`

```text
The names a grammar lists under `supertypes`, `externals` or `inline`, whether the field is an array or a
`$ => [...]` function. A function is called with a symbol-shaped proxy so each entry yields its name.
```

### `packages/codegen/src/dsl/enrich.ts::extractWordName`

```text
/**
 * Resolve the grammar's `word` declaration to a rule NAME across both
 * runtimes. Under sittir's grammarFn it is already a string; in the emitted
 * `.sittir/grammar.js` (which runs enrich BEFORE tree-sitter's native
 * `grammar()`) it is still the raw `$ => $.identifier` callback — invoke it
 * with the same symbol-shaped proxy `extractGrammarSymbolNames` uses and take
 * the returned symbol's name. Returns null when absent/unresolvable (the
 * word matcher then falls back via matchesWordShape).
 */
```

### `packages/codegen/src/dsl/enrich.ts::harvestSupertypeNames`

```text
/**
 * @internal — extract supertype names from a result array. Accepts both
 * `[{name:'_expr'}, ...]` (SYMBOL-shaped) and `['_expr', ...]` (plain
 * strings). Returns names WITH the leading underscore so callers can
 * test membership and still strip the prefix when composing the field
 * name.
 */
```

### `packages/codegen/src/dsl/enrich.ts::nativeRuleFn`

```text
/** Fetch a runtime-injected DSL rule constructor from `globalThis`, or throw.
 *  enrich runs inside `grammar(enrich(base), …)`, which executes under an
 *  injected DSL runtime — sittir's lowercase constructors during evaluate.ts,
 *  tree-sitter's uppercase ones during CLI generation. Calling the injected fn
 *  directly produces a rule in the active runtime's case with no hand-rolled
 *  detection, and inherits the runtime's construction semantics (content
 *  normalization). A missing global means enrich
 *  was called outside any runtime — a unit test that forgot `installFakeDsl()`.
 *
 *  Accepts alternate names because the two runtimes don't agree on every
 *  constructor's name: the symbol constructor is `symbol` under sittir but
 *  `sym` under tree-sitter's CLI. The first name found wins.
 *
 *  Exported so other DSL-phase modules (e.g. `dsl/transform/transform.ts`'s
 *  polymorph alias-node mint sites) can route construction through the same
 *  runtime-injected constructors instead of hand-rolling rule literals — see
 *  `makeGroupLiftSymbol`/`makeVisibleGroupAlias` below for the canonical
 *  call pattern. */
```

```text
// ---------------------------------------------------------------------------
// Direct-mutation builders
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/dsl/enrich.ts::makeField`

```text
/** Wrap `content` in a FIELD via the injected `field()` constructor. The
 *  runtime fn normalizes the content and stamps `fieldName` on inner symbol
 *  refs (subsuming the former hand-rolled `propagateFieldName`); we add
 *  enrich's `fieldSource` marker (opaque `metadata` bag — debt) so
 *  downstream passes recognize the promotion as enrich-originated rather
 *  than author-written. */
```

### `packages/codegen/src/dsl/enrich.ts::registerKwRule`

A newly registered rule is recorded in `ruleOrigins` as a `keyword` mint.

```text
/**
 * Register a `_kw_<fieldName>` hidden rule whose body is
 * `prec.left(1, stringLiteral)`. Idempotent — multiple positions that
 * promote the same keyword register the same body once.
 *
 * Returns a SYMBOL reference (in the active runtime's case, via the injected
 * `symbol()` constructor) that the caller embeds inside the new FIELD wrapper.
 */
```

#### body

```text
// The name is a convention (`_kw_<kw>`), not a reservation — a base
// grammar can define its own rule at this exact name. Reuse it when it
// structurally IS this keyword (ruleKey covers type/named along with
// value, so an existing rule that displays the same text but visibly —
// e.g. a `named: true` ALIAS — correctly does NOT match); only decline
// on a genuine, unrelated collision.
```

### `packages/codegen/src/dsl/enrich.ts::collectFieldNamesRuntime`

```text
/** Collect field names that already exist on the top-level seq. */
```

```text
// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/dsl/rule-patterns.ts::isBlank`

True for every spelling of an empty rule: tree-sitter's `BLANK`, and the empty
`CHOICE` or `SEQ` sittir's `blank()` builds. The one blank test; nothing else
compares a rule type against `'BLANK'` or checks for zero members to mean
"empty".

### `packages/codegen/src/dsl/rule-patterns.ts::optionalContentOf`

The content of an optional rule in either representation: `OPTIONAL(x)`, or a
two-member `CHOICE` of `x` and a blank (either order). Returns `undefined` for
anything else, including a choice whose two members are both blank. Every
site that treats a rule as "optional x" reads through it, so an OPTIONAL and a
CHOICE-with-blank always take the same path.

### `packages/codegen/src/dsl/rule-patterns.ts::isArmChoice`

A `CHOICE` that is not optional-shaped (`optionalContentOf` finds no content).
A predicate that asks "is this a choice between arms" uses it, so
`CHOICE(x, BLANK)` from tree-sitter's `optional()` reads as the `OPTIONAL(x)`
sittir's builder produces, never as a two-arm choice.

### `packages/codegen/src/dsl/rule-patterns.ts::withOptionalContent`

Rebuilds an optional rule around new content in the representation it
already has: `OPTIONAL` gets a new `content`; a CHOICE-with-blank keeps its
blank member and replaces the other. The rebuild paired with
`optionalContentOf`.

### `packages/codegen/src/dsl/rule-patterns.ts::optionalSeqBodyOf`

The sequence an optional rule wraps, when its content (as `optionalContentOf`
reads it) is a `SEQ`; else `undefined`.

### `packages/codegen/src/dsl/rule-patterns.ts::isImmediateToken`

True for tree-sitter's `IMMEDIATE_TOKEN` node and for the compile-side
`TOKEN` with `immediate: true`. A `TOKEN` with `immediate` false or absent is
not immediate.

### `packages/codegen/src/dsl/enrich.ts::isBareShapeTarget`

```text
/**
 * @internal — true when `target` corresponds to Shape 1 (bare SYMBOL
 * at the seq position). Distinguishable by `target.symbolRule` being
 * `===` to the original `member`: bare-shape's wrap is identity, so the
 * detected symbol IS the seq-position rule itself. Used by the
 * supertype-prefixed guard in `applySymbolToField` —
 * see that function for the rationale.
 */
```

### `packages/codegen/src/dsl/enrich.ts::detectSymbolTarget`

```text
/** @internal — detect which of the three shapes (bare / optional /
 *  optional-seq) the seq member is, and return a SymbolTarget that
 *  knows how to rebuild it once the inner SYMBOL is FIELD-wrapped.
 *  Returns null for any other shape (including multi-symbol seqs,
 *  optional(seq) with non-anon members, or non-symbol leaves). */
```

#### body

```text
// Shape 1: bare SYMBOL.
```

#### body

```text
// Shape 2: optional(SYMBOL).
```

#### body

```text
// Shape 3: optional(seq(SYMBOL, <anon…>)) — exactly one SYMBOL,
// all other seq members anonymous (STRING / PATTERN).
```

```text
// >1 SYMBOL — too complex
```

```text
// non-anonymous, non-symbol — too complex
```

### `packages/codegen/src/dsl/enrich.ts::countSymbolsInRepeat`

```text
/**
 * @internal Count symbols inside repeat/repeat1 wrappers. Used to
 * disqualify bare symbols whose kind also appears under a repeat.
 * Stops at field/alias boundaries.
 */
```

#### body

```text
// STRING / PATTERN / TOKEN / BLANK — leaves with no symbols.
```

### `packages/codegen/src/dsl/enrich.ts::promoteInsideRepeatMembers`

```text
/**
 * @internal — iterate outer-seq members and descend into any that are
 * `repeat(seq(...))` / `repeat1(seq(...))` (possibly prec-wrapped).
 * Applies the same field-promotion logic to bare symbols in the inner
 * seq. Returns the original array unchanged when no promotions fire.
 *
 * @param ruleName       - the parent rule name (for diagnostics)
 * @param members        - the outer seq's (possibly already-enriched) members
 * @param supertypeNames - declared supertype names for `_prefix` handling
 * @param existing       - mutable set of field names already claimed on
 *                         the parent seq (checked to prevent collisions)
 * @returns the same `members` array if nothing changed, or a new array
 *   with rebuilt repeat members
 */
```

### `packages/codegen/src/dsl/enrich.ts::tryPromoteInRepeatMember`

```text
/**
 * @internal — given a single outer-seq member, check whether it is a
 * `repeat`/`repeat1` (possibly prec-wrapped) whose content is a `seq`.
 * If so, apply field-promotion to the inner seq's bare symbols.
 *
 * @returns the rebuilt member if any promotions fired, or `null` if
 *   the member was left unchanged.
 */
```

#### body

```text
// Peel prec wrappers on the member itself.
```

#### body

```text
// Peel prec wrappers on the repeat's content.
```

#### body

```text
// Same supertype-only-bare gate as `applySymbolToField` —
// see that function for the rationale.
```

#### body

```text
// Direct-position counts within the repeat's inner seq drive the
// numbered-duplicate naming; deeper-nested repeats disqualify entirely.
```

#### body

```text
// Skip when the same symbol kind appears in the outer seq — promoting
// it here would split the kind across $fields (inner) and $children
// (outer bare symbol), which variadic factories can't reconstruct.
```

#### body

```text
// Rebuild: inner seq → inner prec stack → repeat → member prec stack.
```

### `packages/codegen/src/dsl/enrich.ts::tryPromoteInRepeatSeq`

```text
/**
 * @internal — handle `repeat(seq(...))` / `repeat1(seq(...))` patterns
 * (possibly prec-wrapped) when the top-level rule is NOT itself a seq.
 *
 * Descends into the repeat's content, peeling any prec wrappers on
 * the inner rule. If the inner content is a seq, applies the same
 * per-member field-promotion logic as the top-level seq path:
 * `detectSymbolTarget` + uniqueness via `kindCounts` + claimed-name
 * via `collectFieldNamesRuntime` + `countSymbolsInRepeat` for further
 * nested repeats.
 *
 * @returns The rebuilt rule if any promotions fired; the original rule
 *   unchanged otherwise.
 */
```

#### body

```text
// Peel prec wrappers on the inner content (e.g.
// `repeat(prec.left(seq($.a, $.b)))`).
```

#### body

```text
// Same supertype-only-bare gate as `applySymbolToField`.
```

#### body

```text
// Count symbols in further-nested repeats within the inner seq so
// a symbol appearing both as a direct seq member and inside a
// nested repeat is disqualified from numbering/wrapping.
```

#### body

```text
// Rebuild: inner seq → inner prec stack → repeat → outer prec stack
```

### `packages/codegen/src/dsl/enrich.ts::peelPrec`

```text
/** @internal — strip any number of prec/prec.left/prec.right/prec.dynamic
 *  wrappers and return the innermost rule. Returns the input unchanged
 *  when no prec wrapper is present. */
```

### `packages/codegen/src/dsl/enrich.ts::canonicalStringifyClause`

```text
/**
 * @internal — canonical JSON stringify with sorted object keys. Ensures
 * that two structurally-equal rule bodies stringify identically even
 * when property insertion order differs between rule construction paths.
 * Mirrors the helper in auto-groups.ts; the two are kept in sync by hand
 * and should be extracted into one shared helper.
 */
```

### `packages/codegen/src/dsl/enrich.ts::listSeparatorOfOptionalSeq`

```text
/**
 * @internal — extract the list separator string from an `optional(seq(...))`
 * (or `CHOICE[seq,BLANK]`) whose seq body carries a separated-list repeat.
 * Returns the separator literal (e.g. `","`) or null when the member is not an
 * optional-seq containing a repeat.
 *
 * Handles both the raw tree-sitter form `repeat(seq(STRING sep, x))` (separator
 * not yet lifted — enrich runs pre-evaluate) and an already-lifted
 * `repeat(x, separator)`.
 */
```

#### body

```text
// Already-lifted separator attribute.
```

#### body

```text
// Raw form: repeat(seq(SEP, x)) — detect the separator from the content
// via the shared list-pattern detector (same logic evaluate's lift uses).
```

#### body

```text
// Falls through to the next seq member when the choice has no
// string arm (e.g. all-symbol/external-scanner separator position)
// — matches the pre-PR-S behavior, where `separatorOf`
// itself returned null for a stringless choice and the loop kept
// scanning for a real separator elsewhere in the same seq.
```

### `packages/codegen/src/dsl/enrich.ts::optionalStringLiteral`

```text
/**
 * @internal — if `rule` is `optional(STRING)` / `CHOICE[STRING,BLANK]`, return
 * the string literal; else null. Recognizes a stranded trailing separator
 * member. Returns null for `optional(seq(...))` (inner is not a bare string),
 * so it never matches the list member itself.
 */
```

### `packages/codegen/src/dsl/enrich.ts::appendTrailingMemberToOptionalSeq`

```text
/**
 * @internal — fold a stranded trailing `optional(sep)` into the preceding
 * `optional(seq(...))`'s body. Appends `trailingOptional` as the last seq
 * member and rebuilds the optional wrapper (both `optional` and
 * `CHOICE[seq,BLANK]` forms, via withOptionalContent).
 */
```

### `packages/codegen/src/dsl/enrich.ts::absorbTrailingListSeparators`

```text
/**
 * @internal — pre-fold a seq's member list, pulling each separated-list's
 * stranded trailing `optional(sep)` INTO the preceding `optional(seq(...
 * repeat(sep) ...))`. Returns the rewritten member array, or null when nothing
 * folds (reference-preserving when no fold applies).
 *
 * Trigger: adjacent `[ optional(seq containing repeat(sep S)) , optional(S) ]`
 * where the trailing literal `S` equals the list's own separator. The
 * separator-match guard prevents swallowing an unrelated trailing optional
 * (e.g. `optional(';')` after a comma-separated list).
 *
 * Why here: tree-sitter authors write the canonical separated-list-with-trailing
 * either as `optional(seq(list, optional(sep)))` (already one unit — handled) or
 * as `seq(optional(list), optional(sep))` (python `argument_list`). This pass
 * canonicalizes the second form into the first BEFORE the group-lift below, so
 * the whole list (head + repeat + trailing) is captured as one group. Without
 * it the trailing separator strands as a standalone member → wrapper-deletion
 * makes it a phantom `nonterminal:true` slot, and for visible (inline-unsafe)
 * groups it is permanently split from its list across the hoisted-compound
 * boundary. link's `liftSeq` then absorbs the folded `optional(sep)`
 * into the group's `repeat1` as `trailing: true`.
 */
```

```text
// consume the stranded trailing separator
```

### `packages/codegen/src/dsl/enrich.ts::applyClauseHoist`

```text
/**
 * @internal — walk `rule` and hoist any `optional(seq(STRING,FIELD…))` /
 * `CHOICE[seq(STRING,FIELD…),BLANK]` positions into hidden group rules.
 * Returns a (possibly rewritten) rule; never mutates the input.
 *
 * COUNTER DISCIPLINE: the `counter.opt` increments for EVERY `optional(seq)`
 * shape encountered in traversal order — both clause-seqs (which this pass
 * hoists) and non-clause-seqs (which applyAutoGroups hoists later). This
 * keeps the numbering in sync so the two passes never assign the same number
 * to different bodies within the same parent. applyAutoGroups resets its
 * own counter per-parent to 0 and counts from 1; after enrich, any position
 * where enrich hoisted is now `optional(SYMBOL)` — applyAutoGroups skips
 * those (not a seq) so its counter only increments for the non-clause
 * positions, which are the ones enrich skipped and left with their counter
 * slots intact.
 */
```

A seq that is a `terminated` separated list (`separatedListBodyInfo`) is
returned as it is: the whole seq is the list, so the choice after its first
element is not a set of arms to mint and nothing inside it is hoisted. Without
this the arm holding the further elements would become a kind of its own and
the list would be split across two nodes.

#### body

```text
// (2026-07-21 union-slot design): the innermost PREC wrapper (if any)
// currently enclosing `rule` in the traversal — e.g. rust's
// `or_pattern: $ => prec.left(-2, choice)` deliberately deprioritizes
// its WHOLE choice relative to sibling pattern rules. Extracting one
// arm into its own hidden rule (mintStructuredChoiceArm) strips that
// precedence from the extracted piece (the outer prec still wraps the
// CHOICE containing the alias reference, but the newly-registered
// hidden rule's OWN definition has none) — a genuine new tree-sitter LR
// ambiguity, not a naming collision. Threaded through every recursive
// call so a mint under a prec wrapper can re-apply the SAME wrapper to
// its own registered body.
```

#### body

```text
// The nearest enclosing `field(name, ...)` this position is STILL
// directly the content of — set on FIELD descent, propagated unchanged
// through PREC/REPEAT/OPTIONAL (transparent wrappers, same position),
// reset to `undefined` at SEQ/CHOICE member boundaries (a member is a
// distinct position, no longer "the field's content" as a whole).
// Consumed by `visibleGroupSynthName` to prefer `_<parent>_<field>`
// over an opaque ordinal when a group is hoisted from a fielded slot.
```

#### body

```text
// Check if this node is an optional(seq) or CHOICE[seq,BLANK] pattern.
```

#### body

```text
// Post-order: recurse into the seq body FIRST, then classify.
```

#### body

```text
// Empty-matching body: tree-sitter rejects named rules that match the
// empty string — never hoist. Counter must still increment because
// applyAutoGroups does NOT check empty-matching and will consume this
// counter slot for its own numbering.
```

#### body

```text
// Rebuild wrapper with the recursed (possibly updated) seq body, but
// leave this position un-hoisted.
```

#### body

```text
// Inline-safe: exactly one field/symbol slot after dropping literals.
// Hoist into a hidden _<parent>_optionalN rule (today's clause path).
// clauseHoistSynthName increments the counter internally.
```

#### body

```text
// CHOICE[seq, BLANK] form
```

#### body

```text
// name === null: collision — skip but still count the position.
// (Counter was already incremented inside clauseHoistSynthName
// before the collision was detected — see that function's comments.)
```

#### body

```text
// Inline-unsafe: multi-slot or bare-choice body. Surface it as a
// VISIBLE CST kind via the standard tree-sitter named-group pattern:
//   Pass 1 — register a HIDDEN rule `_<parent>_group<N>` whose body is
//     the seq (visibleGroupSynthName injects it into clauseGroupRules,
//     exactly like the inline-safe clause-hoist path), and reference it
//     with a clean `symbol($._<parent>_group<N>)`.
//   Pass 2 — wrap that symbol ref in `alias($._<name>, $.<name>)` so
//     tree-sitter renames the ONE symbol-node into ONE clean visible CST
//     node. (Aliasing the multi-member seq DIRECTLY made tree-sitter
//     DISTRIBUTE the alias across the seq's members → scattered empty
//     leaves → reader "singular slot got array" → dropped slot.)
// The hidden rule stays the single source of truth; link's
// `aliasSourceKinds` mechanism (assemble.ts) promotes it to
// user-facing visibility once its slot reference is hydrated,
// rather than the alias minting a second, duplicate rule.
// Keep `counter.opt` advancing too — the hidden-hoist name space must
// stay consistent with applyAutoGroups's ordinal numbering for any
// run where it is still active (it is disabled this chunk, but the
// invariant is cheap to preserve).
```

#### body

```text
// Pass 2 tag: this hidden rule backs a VISIBLE alias → keep it OUT of
// the `inline:` list (so tree-sitter aliases the symbol-node, not the
// expanded seq). Classify ONCE here; read in enrich() at clauseGroupNames.
```

#### body

```text
// Pass 1: symbol ref to the hidden rule (mirrors makeGroupLiftSymbol).
```

#### body

```text
// Pass 2: wrap in a visible alias so the inline-unsafe group surfaces
// as a clean CST node (`<name>`). The alias carries metadata.aliasSource
// 'visible-group', so transform-path travels through it; link mints the
// kind structurally.
```

#### body

```text
// aliasName === null: collision — leave inline (un-aliased).
```

#### body

```text
// Optional position with a NON-seq body (optional(seq) was peeled above).
// `optionalContentOf` normalizes both runtime spellings — sittir's
// `{ type: OPTIONAL, content }` and the tree-sitter CLI's desugared
// `CHOICE[content, BLANK]` — into ONE hoist path. Before this branch the
// desugared form reached the mint via the generic CHOICE arm walk while
// the OPTIONAL form fell through untouched, so the two runtimes hoisted
// DIFFERENT grammars: the parser minted `_<parent>_group<N>` for e.g.
// rust `attribute`'s `optional(choice(seq('=', value), arguments))`
// while the IR never registered the kind — the wrapped tree then carried
// a group node the model couldn't drill (rendered `#[doc =]`, value
// dropped). Recurse into the content, then offer it to the arm mint
// exactly as a `CHOICE[content, BLANK]` non-BLANK arm.
```

#### body

```text
// Single non-BLANK arm: no siblings, no leading-name collisions.
```

#### body

```text
// The whole optional content is still the field's logical
// position (this is optional(seq)/CHOICE[content, BLANK], not a
// seq/choice member boundary) — carry the field name in.
```

#### body

```text
// CHOICE[content, BLANK] spelling — swap the non-BLANK member.
```

#### body

```text
// Descend into seq members.
```

#### body

```text
// Pre-fold: pull a separated-list's stranded trailing `optional(sep)` INTO
// the preceding `optional(seq(... repeat(sep) ...))` so the per-member hoist
// below captures the whole list (head + repeat + trailing) as one group.
```

#### body

```text
// Run hoist: a flank-carrying separated list INLINE among this seq's
// members (sharing the seq with delimiters, e.g. macro_definition's
// `'(' repeat(seq(rule, ';')) optional(rule) ')'` or type_arguments'
// `'<' type sep-run optional(',') '>'`) carries per-instance separator
// facts with no node to hang them on. Hoist the run into its own
// VISIBLE separatedList kind — the same hidden-rule + alias mint the
// optional(seq) whole-body path uses; flankless runs stay inline.
// Post-order (after member recursion) so inner content is settled.
// A seq that IS one whole-body list is owned by the whole-body mint
// paths — carving a sub-run out of it would strand its head element.
```

#### body

```text
// The empty-matchable tail run `repeat(elem sep) elem?` hoists as
// `optional(<classic list>)`: the classic non-empty spelling
// `elem (sep elem)* sep?` describes the same language, gives the
// kind the canonical separated-list shape downstream phases
// recognize, and the optional wrapper keeps the empty case
// node-free in the parent.
```

#### body

```text
// Runtime-native constructors so each pipeline gets ITS optional
// spelling (sittir: OPTIONAL; tree-sitter CLI: CHOICE[X, BLANK]).
```

#### body

```text
// Descend into choice branches that are NOT optional(seq) wrappers
// (those were handled above via optionalSeqBodyOf).
```

#### body

```text
/* Permutable-modifier arms (isPermutationChoice): decline minting —
		   the arms differ only in ordering/optionality of one modifier-slot
		   set, so kind identity would be pure ceremony — and normalize each
		   arm's raw keyword steps to marker fields so every arm spells the
		   same slot the same way. */
```

#### body

```text
// (2026-07-21 union-slot design): leading-symbol collisions across
// THIS choice's arms — any leading name shared by 2+ arms (see
// armStartsWithSymbol's doc comment for the two exemplars this
// catches). Arms whose leading symbol collides don't get minted;
// whichever OTHER mechanism already resolves that ambiguity (a
// sibling bare-symbol arm rendering the extension arm's mint
// redundant, or this grammar's own variant() patches)
// keeps doing so, unimpeded.
```

#### body

```text
// (2026-07-21 union-slot design): a bare choice-arm position
// (unnamed, no field wrapper — the gate (c) field-named-mixed-row
// case is a separate, not-yet-implemented follow-up) that is
// STRUCTURED (multi-slot, or a symbol ref to a hidden rule whose
// own body is multi-slot) has no kind identity to serve as a
// distinguishable union member — an inline symbol/anonymous seq
// produces no CST node of its own. Mint (or promote an existing
// hidden rule to) a visible alias, same mechanism as the
// inline-unsafe optional(seq) path above, just without the
// optional wrapper: the arm position is replaced directly.
//
// Split justification: an arm that differs from a SIBLING only at
// a literal-choice position stays unminted — extracting it would
// create a form whose sole difference is a cardinality-1
// (determined) enum; the literal belongs in the parent's own
// enum slot instead.
```

#### body

```text
// Descend into repeat / repeat1 / prec wrappers.
```

#### body

```text
// (2026-07-21 union-slot design): entering a PREC wrapper updates
// the ambient prec context for everything beneath it — a mint
// under here should carry THIS wrapper's precedence, not an outer
// one (innermost wins, matching how prec actually scopes). `rule`
// itself is reused as the wrapper shape; its own `content` gets
// swapped out wherever it's applied later.
```

#### body

```text
// A repeat whose element, after recursion, is a multi-slot seq
// (isMultiSlotRepeatElement) is lifted into a visible group, the same mint
// as the inline-unsafe optional(seq) path. Without it the builders push the
// repeat's multiplicity onto each slot and splice the seq into the parent,
// leaving parallel arrays that lose which slots came from one repetition.
// An authored groups: pattern covering the element's whole body takes the
// mint over in wire (adoptMintedGroups).
```

#### body

```text
// Descend into field content (a field-wrapped optional(seq) is also a target).
```

### `packages/codegen/src/dsl/enrich.ts::clauseHoistSynthName`

```text
/**
 * @internal — get or create the synthesized hidden-rule name for a given
 * clause-seq body. Increments the per-parent counter and injects the seq
 * into `clauseGroupRules` on first encounter; dedupes across parents via
 * `dedupeMap`.
 *
 * Returns `null` when the synthesized name would collide with an existing
 * rule in `rulesBag` (already-authored rule with the same name). A stderr
 * notice is emitted in that case. The counter is incremented BEFORE the
 * collision check so the ordinal-position invariant with applyAutoGroups
 * is maintained even when a collision prevents hoisting.
 */
```

#### body

```text
// Dedupe hit: reuse the already-assigned name. Do NOT increment the
// counter again — the ordinal slot was consumed when the name was first
// created. Inject into clauseGroupRules if not there yet.
```

#### body

```text
// Increment FIRST so the slot is reserved before any collision check.
```

#### body

```text
// Collision guard: if base.grammar.rules already has this name, skip.
```

### `packages/codegen/src/dsl/enrich.ts::visibleGroupSynthName`

```text
/**
 * @internal — mint the name of the visible rule an inline-UNSAFE body becomes,
 * so enrich surfaces it as ONE clean CST kind.
 *
 * The body is registered as its own rule in `clauseGroupRules` and the caller
 * references it by symbol. Aliasing the multi-member seq directly
 * (`alias(SEQ(...), $.name)`) would not work: tree-sitter distributes such an
 * alias across the seq's members, scattering empty leaves.
 *
 * Naming, first free candidate wins: a separated list's element-derived name;
 * `<parent>_<field>` after the enclosing field; `<parent>_group<N>` /
 * `<parent>_arm<N>` by per-parent ordinal. A candidate is taken when the base
 * rules or `clauseGroupRules` already hold it (hidden or visible spelling), so a
 * second body never overwrites the first. Cross-parent dedupe via
 * `canonicalStringifyClause`. Returns `null` when even the ordinal collides with
 * an existing rule (caller leaves the body inline).
 *
 * The visible name must NOT carry a leading `_` (tree-sitter would classify it
 * HIDDEN → the minted kind's slot is dropped at wrap/read), so `parentKind`'s
 * own leading `_` is stripped before composing the base name.
 */
```

#### body

```text
// (2026-07-21 union-slot design): the PREC wrapper (if any) enclosing
// the CHOICE this content was extracted from — see
// `applyClauseHoist`'s `ambientPrec` doc comment. Applied to the
// registered hidden rule's OWN body so extracting an arm out of a
// deliberately low/high-precedence choice (e.g. rust's `or_pattern: $
// => prec.left(-2, choice)`) doesn't strip that precedence from the
// extracted piece and create a NEW ambiguity that didn't exist in the
// un-extracted grammar.
```

#### body

```text
// The field this content was hoisted out of (e.g. `field('attributes',
// optional(seq(...)))`), if any — `applyClauseHoist` threads this
// through FIELD/PREC/REPEAT/OPTIONAL descent, resetting it at SEQ/CHOICE
// member boundaries (a seq member is no longer "the field's content").
// Naming the group after the field it fills (`_<parent>_<field>`) is
// more legible than an opaque ordinal and reuses a name the grammar
// author already chose, rather than minting a fresh one.
```

#### body

```text
// Ordinal-fallback suffix: 'arm' when the minted content is a CHOICE
// arm (mintStructuredChoiceArm), 'group' for a nested sequence group —
// the two constructs carry distinct name suffixes.
```

#### body

```text
// Key on the registered body, not the bare content: two occurrences of
// the identical content under different ambient precedence must NOT
// dedupe to one hidden rule, or the second occurrence's precedence
// silently vanishes (first-registered body wins at line below).
```

#### body

```text
// Pass 1 — uniform hidden creation: register the seq body as a HIDDEN
// rule so tree-sitter sees a single named symbol to alias.
```

#### body

```text
// Separated-list naming: a flank-carrying list body names its kind after
// its element — the bare pluralized element name when globally unique
// (`use_clauses`), else the `<parent>_<field>` composite, else
// `<parent>_elements`. Falls through to the ordinal path only when every
// candidate is taken.
```

#### body

```text
// Register the FLATTENED head-form spelling — the canonical shape the
// link phase's separator lift recognizes, so the kind classifies
// 'list' (kind-level flank keys) instead of an ordinary hoisted compound
// with per-field capture. Language-identical (seq nesting is associative);
// the ambient prec wrapper re-applies around the flat seq.
```

#### body

```text
// Also decline when a DIFFERENT group body already claimed this same
// field-derived name (e.g. two distinct group bodies under the same
// parent both wrapped in `field('body', ...)`) — `rulesBag` alone
// can't see this, since a synthesized hidden name only ever lands in
// `clauseGroupRules`, never the base grammar.
```

### `packages/codegen/src/dsl/enrich.ts::promoteExistingHiddenRuleName`

```text
/**
 * (2026-07-21 union-slot design): promote an EXISTING hidden rule to a
 * visible group alias without duplicating its body ("mint = promote, not
 * synthesize" — the arm is already a bare `symbol(existingHiddenName)` ref;
 * the hidden rule just needs a friendly visible name). Dedupe key is the
 * hidden name itself (the rule IS the identity here, unlike
 * `visibleGroupSynthName`'s anonymous-body dedupe by content stringify).
 * Shares the SAME per-parent `grp` counter as `visibleGroupSynthName`, so
 * every choice-arm mint for a given parent gets a unique `_<parent>_group<N>`
 * name in traversal order, regardless of which of the two mint paths minted
 * it.
 */
```

#### body

```text
// See visibleGroupSynthName's `flavor` — armN for choice arms.
```

#### body

```text
// The rule being promoted already HAS an identity — its own stripped
// name (`_simple_statements` surfacing visibly is `simple_statements`,
// not an ordinal `<parent>_group<N>`). Reusing the stripped spelling
// also converges with any other alias of the same rule under that name
// (e.g. an upstream reference-site alias): every site then shares ONE
// visible name, so tree-sitter keeps one symbol for the pair instead of
// minting a second visible kind for identical content. Ordinal naming
// survives only as the collision fallback.
```

### `packages/codegen/src/dsl/rule-patterns.ts::RuleListEntry`

One entry of a grammar's `extras` list, in grammar.json's own shape: a SYMBOL (a rule or scanner token by name), a STRING (a literal text), or a PATTERN (a regex source). The list stays a rule list from evaluate to the node map, in declaration order, so every reader sees each entry's rule type rather than a name-or-text string.

### `packages/codegen/src/dsl/rule-patterns.ts::RuleListParts`

The three views of a rule list that `ruleListParts` returns: `names` (SYMBOL entries), `literals` (STRING values) and `patterns` (PATTERN sources), each in list order.

### `packages/codegen/src/dsl/rule-patterns.ts::ruleListParts`

The one derivation of names, literals and patterns from an `extras` rule list. A consumer that asks by name (prune roots, renames, trivia) reads `names`; nothing stores a split copy of the list.

### `packages/codegen/src/dsl/rule-patterns.ts::armLeadingSymbolName`

```text
/**
 * Resolve `rule`'s LEFTMOST reachable symbol name — descending through a
 * SEQ's first member and single-content wrappers (optional/field/repeat/
 * prec/token/...), the same shape a parser's FIRST-set walk would follow.
 * An optional `x` in either spelling (`optionalContentOf`) resolves to `x`'s
 * leftmost symbol, so both pipelines decline or mint the same arms. Any
 * other CHOICE has no single leftmost symbol (it varies per arm) and
 * resolves to `undefined`; the `seen` set guards against infinite recursion on a
 * self-referential rule.
 *
 * For a SYMBOL, hiddenness gates whether the name IS the leftmost
 * boundary or resolution must descend further: `rulesBag[name]?.hidden`
 * — the referenced rule's OWN stamp, looked up by name — decides, never
 * a property read off the reference itself (a SYMBOL reference carries
 * no `hidden` of its own; only top-level rules do). A visible target's
 * name IS the leftmost boundary — return it. A hidden target is
 * invisible to the parser's distinguishable-item boundary, so its own
 * leftmost symbol (found by recursing into its body) is what actually
 * matters; if that recursion resolves to `undefined` (e.g. the hidden
 * body is a CHOICE), the hidden name is returned as the fallback.
 *
 * `armStartsWithSymbol` (this file) is the boolean guard built on top:
 * true when this resolved name collides with a sibling arm's own
 * leading symbol — the shared-prefix collision that would create an
 * unresolvable tree-sitter LR conflict if a choice arm minted its own
 * hidden rule while structurally being a recursive extension of a
 * sibling arm (e.g. python's `expression_statement`: one arm is bare
 * `$.expression`; another is `seq(commaSep1($.expression),
 * optional(','))`, which itself starts with `$.expression`).
 */
```

#### body

```text
// A visible target (`rulesBag[name]?.hidden !== true`) is its own
// meaningful boundary for LR prefix-collision purposes — stop here. A
// hidden target is invisible to the parser's distinguishable-item
// boundary, so its OWN leading symbol (descend into its body) is what
// matters instead.
```

#### body

```text
// A nested choice's own leading symbol is ambiguous (varies per
// branch) — conservatively report none rather than pick one arm.
```

#### body

```text
// Single-content wrappers (optional/field/repeat/prec/token/...) — the
// leftmost path travels through their one child, same convention as
// this file's other structural walks (e.g. `countBodyAnchors`-style
// content fallback in dsl/transform/transform.ts).
```

### `packages/codegen/src/dsl/enrich.ts::armStartsWithSymbol`

```text
/**
 * (2026-07-21 union-slot design) — narrowing guard: true when `arm`'s
 * leading symbol (armLeadingSymbolName) is shared by another arm in the
 * same choice (per `collidingLeadingNames`, precomputed once per choice —
 * see the CHOICE branch of applyClauseHoist). Guards against minting a
 * choice arm that structurally shares its PREFIX with a sibling arm — two
 * exemplars, both python: `expression_statement`'s bare `$.expression` arm
 * vs. its `seq(commaSep1($.expression), optional(','))` arm (both lead
 * with `expression`); `except_clause`'s "as" vs. "list" arms (both lead
 * with `field('value', expr)`'s `expression` reference). Minting either
 * half of such a pair creates a second grammar production sharing the
 * other's leading symbol — an unresolvable tree-sitter LR conflict
 * (confirmed: no `conflicts:` declaration or rename resolves it, since
 * it's a genuine shared-prefix ambiguity between two live productions).
 * Skipping the mint leaves BOTH arms exactly as enrich found them —
 * whatever OTHER mechanism (variant() patches in this grammar's own
 * grammar.sittir.ts, same as before) already handles them keeps doing so,
 * unimpeded.
 */
```

### `packages/codegen/src/dsl/enrich.ts::makeGroupLiftSymbol`

```text
/**
 * @internal — build a SYMBOL reference for a synthesized enrich group-lift
 * (clause hoist today; all `optional(seq)`/`repeat(seq)` once the hoist
 * generalizes). Built via the active runtime's injected symbol constructor
 * (see `nativeRuleFn`) rather than any hand-rolled shape — `referenceRule`
 * is unused by construction (both runtimes agree on the `SYMBOL`
 * discriminant; the shape distinction lives in WHICH constructor is
 * injected, not in the wrapper rule's own case) but kept in the signature
 * for call-site symmetry with the other `make*` helpers.
 *
 * Markers, in the opaque `metadata` bag:
 *   - `metadata.symbolSource: 'group-lift'` — the fact path-descent
 *     (transform-path.ts's `isEnrichGroupLiftSymbol`) keys on to recognize
 *     an enrich-synthesized group-lift symbol and travel THROUGH it into the
 *     hoisted body, so authored `transform()`/`groups:` path patches that
 *     address into a now-hoisted seq still resolve.
 *   - `metadata.author: 'enrich'` — who wrote the reference; nothing
 *     branches on it.
 */
```

#### body

```text
// Pure ref — NO inline body. Tree-sitter serializes any extra structural
// field on a SYMBOL into grammar.json (a `content` here leaks the seq into
// the parser), so the symbol stays a clean name-ref. `metadata` carries
// the markers: `dsl/transform/transform-path.ts`'s path-descent (the
// sanctioned dsl-side reader) keys on `symbolSource: 'group-lift'` and
// LOOKS UP the referenced `_<parent>_<kind><N>` rule body by name to travel
// through (not by carrying the body here). `metadata` is inert to
// tree-sitter's parse tables. The compiler side does not read these
// markers: `compiler/link.ts`'s `mintContentAliasKinds` and `resolveRule`'s
// ALIAS case identify this population structurally via
// `isClauseHoistVisibleGroupAlias`.
// Route through the runtime-injected symbol constructor (`symbol` under
// sittir, `sym` under tree-sitter's CLI — see `nativeRuleFn`) so the ref
// carries the SAME construction stamps (`hidden`, `inline =
// name.startsWith('_')`) as every other ref under sittir's runtime —
// these `_<parent>_<kind>N` helpers are `_`-prefixed → inline=true.
// Keeping one constructor (revised at push-down / link) makes `inline`
// authoritative on the normalizedRules path, so normalize's fold can read it.
// Under tree-sitter's CLI runtime the injected constructor is the raw
// SYMBOL form (parser-side, never reaches the IR inline gate).
```

### `packages/codegen/src/dsl/enrich.ts::makeVisibleGroupAlias`

```text
/**
 * @internal — wrap a SYMBOL ref to an existing HIDDEN rule that enrich promotes
 * (a grammar-authored `_x` list or choice arm) in a TAGGED visible alias so it
 * surfaces as a single clean CST kind. Rules enrich mints itself are visible by
 * name and referenced by symbol; only a promoted hidden rule needs this alias.
 *
 * Shape (confirmed against generated grammar.json ALIAS nodes):
 *   `{ type: 'ALIAS', content: symbol($._<name>), named: true,
 *      value: '<name>', metadata: { author: 'enrich', aliasSource: 'visible-group' } }`
 *
 * - The aliased thing is a SYMBOL ref to the hidden `_<name>` rule (NOT the raw
 *   multi-member seq). tree-sitter renames that ONE symbol-node into ONE visible
 *   CST node for `<name>` (a real kindId in parser.c). Aliasing the raw seq
 *   instead made tree-sitter DISTRIBUTE the alias name across the seq members.
 * - `metadata.aliasSource === 'visible-group'` is REQUIRED for transform-path: it
 *   is the sole test `dsl/transform/transform-path.ts`'s `isEnrichContentAlias`
 *   keys on to travel THROUGH this tag for authored path-patches
 *   (`descendThroughEnrichContentAlias`), rather than a normal aliased symbol's
 *   single-content descent. `metadata.author: 'enrich'` records who wrote it;
 *   nothing branches on it.
 *   `compiler/link.ts`'s `mintContentAliasKinds` reads neither tag — it
 *   identifies the same population structurally via
 *   `isClauseHoistVisibleGroupAlias`, keying on the alias's
 *   `optional`/`CHOICE[x,BLANK]` parent shape, the target name's absence from
 *   `rules`, and the hidden content symbol not being in the grammar's
 *   `inline:` list.
 * - Case is the active runtime's: built via the injected `alias()`/`symbol()`
 *   constructors, so sittir evaluate yields lowercase, tree-sitter CLI uppercase.
 */
```

#### body

```text
// Pass a SYMBOL value so the runtime constructor sets named:true, value=name
// (a bare-string value would yield named:false). `metadata.aliasSource:
// 'visible-group'` is REQUIRED for transform-path's path-descent (see doc
// comment above) — the runtime alias() doesn't add it, so stamp it, plus
// `author: 'enrich'`, on the cased result.
```

### `packages/codegen/src/dsl/rule-patterns.ts::matchesEmpty`

```text
/**
 * Conservative empty-matching predicate. Returns true iff the rule can produce
 * the empty string:
 *   - `optional` / `repeat` / any blank                    → always matches empty
 *   - `string`                                              → iff its value is empty
 *   - `pattern`                                             → iff the pattern accepts the empty string
 *   - `repeat1` / `field` / prec-wrapper                    → iff content matches empty
 *   - `seq`                                                 → iff ALL members match empty
 *   - `choice`                                              → iff ANY member matches empty
 *   - `symbol` / `token` / `alias`                          → false (non-empty)
 *
 * The one emptiness predicate: the transform's empty-arm factoring, the
 * token-form split, enrich's hoist and element-mint guards and the group
 * classifiers all ask it.
 */
```

It reads rules through `realizesEmpty` (`types/runtime-shapes.ts`), the same emptiness law the model's empty forms use; `ruleEmptiness` settles the leaves above and leaves `seq`, `choice`, `repeat1`, `field` and prec wrappers to their children.

```text
// ---------------------------------------------------------------------------
// Group classification
// ---------------------------------------------------------------------------
```

```text
/**
 * Group classification — shared predicates for inline-safe vs inline-unsafe
 * group classification.
 *
 * **Scope: DSL layer only.** Uses `runtime-shapes.ts` predicates so these
 * work on both sittir and tree-sitter-CLI rule forms (dual-RUNTIME, not
 * dual-case — both runtimes agree on UPPERCASE discriminants).
 *
 * Two exported functions, used by enrich (hoist decision) and, later, the
 * wire pass:
 *
 *   • `matchesEmpty(rule)` — conservative: returns true iff the rule can
 *     produce the empty string. Guards both the inline-safe hoist and the
 *     inline-unsafe alias paths: tree-sitter rejects named rules (and aliases)
 *     that match the empty string.
 *
 *   • `isInlineSafe(seqBody)` — true iff the seq body reduces to exactly ONE
 *     slot that is a `field` or `symbol` (NOT a bare `choice`) after dropping
 *     pure literals/punctuation and `blank`. The inline+gate render path can
 *     key on that single slot; multi-slot or bare-choice bodies need to be
 *     visible (their own hoisted-compound template).
 */
```

### `packages/codegen/src/dsl/group-classify.ts::isPlainRepeatType`

```text
/** plain repeat (not repeat1). Duplicates `isPlainRepeatType` in
 *  runtime-shapes but keeps this module self-contained. */
```

### `packages/codegen/src/dsl/group-classify.ts::collectSlots`

```text
/**
 * Collects the "slot" members of a seq body after dropping pure
 * literals/punctuation and `blank`. Descends transparently through `prec`
 * wrappers and `field` wrappers to find the underlying slot type.
 *
 * A "slot" is a member that contributes structured content — `field`,
 * `symbol`, `choice`, `repeat`, `repeat1`, `seq` (nested), or any non-literal
 * non-blank rule. Pure literals (`string`, `token`) and `blank` are dropped.
 */
```

#### body

```text
/* Drop a SYMBOL slot that resolves to no rule body in `rulesBag` — a
		   structural/external scanner token (indent/dedent/newline-role and
		   similar), not content. Without this, e.g. python's `_suite` middle
		   arm `seq($._indent, $.block)` counts as TWO slots (`_indent`,
		   `block`) instead of one, wrongly classifying it inline-UNSAFE and
		   minting a group that fragments `_suite`'s otherwise-uniform `block`
		   output across its three choice arms. `rulesBag` is optional
		   (existing test-only call sites pass none) — omitting it preserves
		   the permissive counting that ignores this distinction. */
```

### `packages/codegen/src/dsl/rule-patterns.ts::isMultiSlotRepeatElement`

Whether a repeat's element, prec peeled, is a seq that needs its own group:
two or more slots (`collectSlots`, the same slot notion `isInlineSafe` uses)
and not a separated-list body (`separatorOf` is null), because a separator
plus element is one slot and link lifts it into a list. Link-phase
`diagnoseRepeatedSeqGrouping` reports the same shape when it survives to link.

### `packages/codegen/src/dsl/rule-patterns.ts::unwrapPrec`

```text
/**
 * Unwrap `prec` wrappers to reach the underlying slot type. Descends through
 * a chain of prec layers only. Returns the innermost rule that is not a prec
 * wrapper.
 *
 * NOTE: we do NOT descend through `field` here because a `field` slot is
 * itself the thing we are classifying (it is field-typed → inline-safe). If
 * we descended through it we would see its content (e.g. a bare `choice`),
 * which would incorrectly mark the slot as unsafe.
 */
```

### `packages/codegen/src/dsl/rule-patterns.ts::throughPrec`

Applies `fn` to a rule's core and rebuilds the chain of `PREC` wrappers
around the result, returning the rule itself when nothing changed: a label or
a rewrite lands on the core, never on a wrapper. The counterpart of
`unwrapPrec`, used by the automatic stamp and relabel and by enrich's
`annotateTokenFormArms`.

### `packages/codegen/src/dsl/group-classify.ts::flattenSeqMembers`

```text
/**
 * Recursively inline the members of nested `seq` children into one flat list,
 * descending transparently through `prec` wrappers and nested `seq`s only. Does
 * NOT descend into `choice`/`field`/`optional`/`repeat` content — those are
 * opaque slots whose internals must not be flattened into the parent member list.
 */
```

### `packages/codegen/src/dsl/group-classify.ts::seqHasTopLevelRepeat`

```text
/**
 * True iff the seq members contain a `repeat`/`repeat1` slot once nested seqs
 * are flattened (the hallmark of a list). `prec` wrappers are transparent.
 */
```

### `packages/codegen/src/dsl/group-classify.ts::isNonterminalSeparatorType`

```text
/**
 * True iff a detected repeat separator itself varies per-instance: a
 * non-literal (`choice`/`symbol`/`pattern`) separator rule rather than a bare
 * `string` literal. A choice-of-separators (e.g. tree-sitter-typescript's
 * `sepBy1(choice(',', $._semicolon), X)`) or a symbol/pattern separator
 * (external-scanner-driven) means the concrete separator text can differ
 * per instance, so the list can't render from one fixed separator string —
 * the same signal `detectRepeatSeparator`'s existing callers
 * (`enrich.ts`'s `listSeparatorOfOptionalSeq`) already act on.
 */
```

### `packages/codegen/src/dsl/group-classify.ts::repeatHasNonterminalSeparator`

```text
/**
 * True iff `repeatRule`'s own separator (per `detectRepeatSeparator` run on
 * its `content`) is non-literal — see `isNonterminalSeparatorType`.
 */
```

### `packages/codegen/src/dsl/group-classify.ts::isOptionalSeparatorFlank`

```text
/**
 * True iff `member` is an `optional(STRING sep)` or `choice(STRING sep,
 * blank)` flank whose literal value equals `sepValue` — mirrors the shape
 * `absorbTrailingListSeparators`/`optionalSeqBodyOf` already
 * recognize for a stranded leading/trailing separator flank sibling to a
 * list's repeat (e.g. `commaSep1(E)`'s desugared
 * `seq(E, repeat(seq(SEP, E)), optional(SEP))`).
 */
```

### `packages/codegen/src/dsl/group-classify.ts::repeatMemberHasGenuineSeparatorVariability`

```text
/**
 * True iff `repeatRule` (a top-level repeat member found among `siblings`,
 * the flattened seq member list it lives in) has genuine per-instance
 * separator variability: either its own separator is non-literal
 * (`repeatHasNonterminalSeparator`), or a SIBLING member in the same
 * flattened seq is an optional/choice-of-blank flank of that same separator
 * literal (a stranded leading/trailing comma). Either shape means the list
 * can't be rendered from one fixed separator string — it needs its own
 * visible `AssembledList` template, not the hidden inline-flat
 * path.
 */
```

### `packages/codegen/src/dsl/group-classify.ts::repeatHasGenuineSeparatorVariability`

```text
/**
 * True iff a BARE repeat/repeat1 body (not embedded in an enclosing seq) has
 * genuine separator variability. No sibling flank check applies here — a
 * bare repeat has no enclosing seq member list to hold a stranded flank —
 * so this reduces to the non-literal-separator check only.
 */
```

### `packages/codegen/src/dsl/group-classify.ts::seqHasGenuineSeparatorVariability`

```text
/**
 * True iff `members` (post-flattening) contains EXACTLY ONE separator-
 * carrying top-level repeat/repeat1 member AND that one repeat has genuine
 * separator variability — see `repeatMemberHasGenuineSeparatorVariability`.
 *
 * Scoped to the single-SEPARATOR-CARRYING-repeat case deliberately: a seq
 * body representing a genuine separated list (`commaSep1(E)` and its
 * Task-1-confirmed real-world shape) has exactly ONE top-level repeat
 * carrying the list's separator. The census here only counts repeats whose
 * content itself has a `detectRepeatSeparator`-detectable separator shape —
 * a repeat with NO separator shape at all can neither BE the separated
 * list (it has nothing to flag as separator-variable) nor be the
 * unrelated-repeat this guard exists to protect against (there's no
 * separator to mis-match a sibling flank against). This matters for real
 * grammar shapes like rust's `enum_variant_list`/`field_declaration_list`/
 * `ordered_field_declaration_list`/`arguments`, whose per-element unit is
 * `seq(repeat($.attribute_item), X)` — a per-element MODIFIER repeat with no
 * separator of its own, which `flattenSeqMembers` surfaces as a second
 * top-level repeat alongside the real list's separator-carrying repeat. A
 * naive "exactly one repeat, of ANY shape" census (the original guard) saw
 * 2 repeats there and bailed, leaving these kinds un-promoted; scoping the
 * census to separator-carrying repeats only fixes that without reopening
 * the original decoy-repeat false positive (the decoy CHOICE-with-no-
 * string-arm test case still detects as separator-carrying via
 * `detectRepeatSeparator`, so it's still correctly counted and the guard
 * still declines to flag multi-separator-repeat compound seqs). A seq with
 * MULTIPLE separator-carrying top-level repeats remains a different,
 * compound shape outside this qualification's design intent — declining to
 * flag it reverts to the existing inline-flat floor behavior (safe by
 * construction, per this file's existing "cannot regress below floor"
 * convention) rather than risking a false-positive match.
 */
```

### `packages/codegen/src/dsl/group-classify.ts::isInlineSafe`

```text
/**
 * Returns true iff the seq body is "inline-safe":
 *   - After dropping pure literals (`string`, `token`) and `blank` from the
 *     seq's direct members, exactly ONE slot remains.
 *   - That slot (after descending through `prec`/`field` transparently) is a
 *     `field` or `symbol` — NOT a bare `choice`, `repeat`, `repeat1`, `seq`,
 *     or any other multi-valued / compound type.
 *
 * Multi-slot or bare-choice bodies are "inline-unsafe" and require a visible
 * hoisted-compound template for correct rendering.
 *
 * @param seqBody — the rule to classify. Typically the body of an
 *   `optional(seq)` position, but may also be called with non-seq bodies
 *   (returns false for them).
 */
```

#### body

```text
/* Bare `repeat`/`repeat1` body — a LIST is one flat slot (e.g.
	   `formal_parameters = repeat1(parameter, SEP)`, `class_body`, `enum_body`).
	   Like the separated-list seq shape below, aliasing a bare repeat makes
	   tree-sitter DISTRIBUTE the alias across every element (one alias node
	   per element) instead of one group → array-of-siblings → empty render.
	   A list stays INLINE-FLAT (one list slot); only genuine co-optional
	   groups (a bare `choice`, e.g. rust `visibility_modifier`) take the
	   visible-alias path.

	   EXCEPT when the repeat has genuine per-instance separator variability
	   (a non-literal separator rule) — such a list can't render from one
	   fixed separator string on the inline-flat path and needs its own
	   visible `AssembledList` template instead. See
	   `repeatHasGenuineSeparatorVariability`. */
```

#### body

```text
/* A bare `alias(content, $.name)` body is ALSO one flat slot — the alias
	   already gives the position its OWN kind identity (whatever `.value`
	   names), producing exactly one CST node regardless of how complex
	   `content` is internally. Minting a second wrapper kind around it is
	   redundant (and wrong — the mint's synthesized template doesn't know
	   about the alias's own relabeling, e.g. rust's `_type` choice arm
	   `alias($.identifier, $.type_identifier)`: promoting the arm's owning
	   hidden rule produced a template referencing `type_identifier` while the
	   derived slot model expected the arm's OWN field name — a
	   slot-preservation crash, not a naming collision). */
```

#### body

```text
/* A body containing a (possibly nested) top-level `repeat`/`repeat1` is a
	   LIST → render flat, NOT a co-optional group. This generalizes the
	   separated-list guard below: the list's repeat is frequently nested
	   inside an inner seq — `commaSep1` desugars to
	   `seq(seq(E, repeat(seq(SEP, E))), optional(SEP))`, so the repeat is two
	   levels down (where_clause / formal_parameters / enum_body /
	   list_pattern) — or sits beside a trailing element
	   (`seq(repeat(E), field(last))`, e.g. rust `match_block`). Aliasing any
	   of these makes tree-sitter distribute the alias across each element
	   (array-of-siblings → "not an array" AST mismatch). Only genuine groups
	   with NO repeat (a bare `choice`, e.g. rust `visibility_modifier`;
	   python `slice`) take the visible-alias path. Safe by construction:
	   declining to mint reverts the kind to inline (floor) behavior, which
	   cannot regress below floor.

	   EXCEPT when the top-level repeat has genuine per-instance separator
	   variability (a non-literal separator, or an adjacent stranded
	   optional/choice-of-blank separator flank sibling in this same seq) —
	   see `seqHasGenuineSeparatorVariability`. Such a list falls through to
	   the visible-promotion path below, same as a multi-slot/bare-choice
	   body. */
```

#### body

```text
/* The single slot must be a field or symbol (not a bare choice, repeat,
	   etc.). Descend through prec wrappers only — a field slot is itself
	   field-typed and is already inline-safe; descending into it would
	   expose its content (possibly a choice), which would incorrectly
	   classify the slot as unsafe. */
```

### `packages/codegen/src/dsl/rule-patterns.ts::isNamedArmChoice`

A CHOICE (at the root; a `PREC`-wrapped choice is not one) whose every member
is a named ALIAS of a SYMBOL: a dispatch choice where each arm names its own
node. Link computes it on the raw rules, before its resolve step flattens
such aliases to symbols, and passes it to `hiddenChoiceClass`;
`isSupertypeOwner` computes it on the same body it classifies.

### `packages/codegen/src/dsl/rule-patterns.ts::HiddenChoiceClass`

What link makes of a hidden choice rule: `'enum'` (every member a literal),
`'named-arms'` (a named-arm choice, left a polymorph), or `'supertype'`
(every member, nested choices flattened, supertype-compatible).

### `packages/codegen/src/dsl/rule-patterns.ts::hiddenChoiceClass`

The one hidden-choice classification, used by link's
`classifyHiddenChoiceRule` and by the automatic stamp's `isSupertypeOwner`.
No class for a hoisted rule or a rule whose root is not a CHOICE (a
`PREC`-wrapped choice included). Otherwise `'enum'` when every top-level
member is a literal (`isEnumMember`), `'named-arms'` when `namedArms` says so,
`'supertype'` when every member of the flattened choice
(`flattenChoiceMembers`) is supertype-compatible (`isSupertypeMember`), else
no class. `storageBodyOf` resolves a named alias's storage rule for the
literal test; `namedArms` is supplied because link reads that fact from the
raw rules. A declared supertype is link's own override and not part of this
test.

### `packages/codegen/src/dsl/rule-patterns.ts::ChoiceShape`

The structural view `hiddenChoiceClass` and its helpers read, covering the
fields a choice member carries in both the enrich-phase and link-phase trees.

### `packages/codegen/src/dsl/rule-patterns.ts::typeOf`

A shape's `type` when it is a string.

### `packages/codegen/src/dsl/rule-patterns.ts::isNamedAlias`

Whether a shape is a named ALIAS.

### `packages/codegen/src/dsl/rule-patterns.ts::isEnumMember`

Whether a choice member is a literal for the enum test: a STRING, a SYMBOL
carrying a `literal`, or a named ALIAS whose content is a STRING or a SYMBOL
whose storage rule is a STRING.

### `packages/codegen/src/dsl/rule-patterns.ts::aliasesSymbol`

Whether an alias content is a SYMBOL, directly or under TOKEN wrappers.

### `packages/codegen/src/dsl/rule-patterns.ts::isSupertypeMember`

Whether a flattened member can be a supertype's subtype: a SYMBOL, a STRING,
or a named ALIAS over a STRING or a symbol (`aliasesSymbol`).

### `packages/codegen/src/dsl/rule-patterns.ts::flattenChoiceMembers`

A choice's members with every nested CHOICE spread in place.

### `packages/codegen/src/dsl/group-classify.ts::isSupertypeLike`

```text
/**
 * STRUCTURAL supertype test: true iff the rule body is a dispatch union —
 * a bare `choice` whose every arm reduces (through prec wrappers only) to a
 * plain symbol ref. Such a rule contributes no structure of its own: at
 * parse time exactly one arm's node materializes and the hidden rule
 * splices away, so wrapping it in a mint alias inserts a CST node level
 * into every position the union appears in AND severs the wrap layer's
 * concrete-kind expansion (keyed on `instanceof AssembledSupertype`) — the
 * failure class that took python to 0/115 when `_compound_statement` was
 * wrapped.
 *
 * Deliberately SHAPE-ONLY (string type tags via runtime-shapes, no
 * constructor stamps, no name conventions, no provenance registries): the
 * result must be identical under sittir's runtime and tree-sitter's CLI
 * runtime, or the two sides mint divergently (the
 * `_expression_statement_block_ending` phantom: sittir's transparent
 * `prec()` exposed a bare SYMBOL arm that minted, while the CLI saw
 * `PREC(SYMBOL)` and never minted — the IR then modeled a kind the parser
 * never produces).
 *
 * Distinct from the DECLARED-supertype gate (`counter.supertypeNames`),
 * which stays: declaration is authoritative where present; this predicate
 * covers the undeclared unions (`_expression_ending_with_block`,
 * `_expression_except_range`, …) that are supertypes in every structural
 * sense except the grammar's `supertypes:` array.
 */
```

#### body

```text
/* Member compatibility mirrors link's `classifyHiddenChoiceRule` supertype
	   test (SYMBOL / named alias / enum-or-string): each such arm
	   materializes its OWN node (or token) at parse time, so the choice as a
	   whole stays a pure dispatch point. A named ALIAS arm (e.g.
	   tree-sitter-rust's aliased `u8|i8|…` primitive enum inside
	   `_expression_except_range`) is as dispatchable as a bare symbol ref. */
```

### `packages/codegen/src/dsl/group-classify.ts::isPermutationChoice`

A choice whose arms are permutations of one modifier-slot set — every arm is
a seq of singular atoms (optional-or-required keyword literals, marker
fields, or symbol refs), and all arms carry the SAME atom set, differing only
in ordering/optionality. Splitting such arms into kinds would mint identity
for pure modifier ceremony (the permutable-modifiers row of the
split-justification taxonomy: structural delta ⇒ kind, literal-only delta ⇒
enum slot, permutable modifiers ⇒ marker slots). Callers (`applyClauseHoist`'s
CHOICE branch and `mintStructuredChoiceArm`) decline the arm mint and let the
parent's own slots absorb the markers; `promotePermutationArmKeywords`
(enrich) then normalizes required raw keyword steps to the shared
`field('<kw>', $._kw_*)` spelling so the arms' slots merge.

Atom identity: a generated `<literal>` field collapses to its literal
(the keyword-promotion spelling of the same fact), while any OTHER authored
field name is slot identity and stays in the key — reordered same-named
fields are a permutation, differing field sets are alternatives. The
`kwRules` bag resolves `_kw_*` refs so a promoted keyword in one arm keys
equal to its raw spelling in a sibling. `public_field_definition`'s modifier
positions are the exemplar; the byte-identity of the other two grammars under
the decline is the conservatism gate.

```text
/** Permutable-modifier choice (same atom set per arm, order/optionality
 *  delta only) — callers decline the arm mint; full contract in
 *  docs/glossary/dsl.md. */
```

#### body

```text
/* Byte-identical arms are not a permutation delta — require at least two
	   structurally distinct arms so plain duplicated alternatives keep their
	   existing handling. */
```

### `permutationArmSlotKeys` / `permutationAtomKey` / `resolveRuleLiteral` (`packages/codegen/src/dsl/group-classify.ts`)

Support for `isPermutationChoice`: per-arm atom-key sets (null = arm
ineligible — non-seq arm, <2 members, repeat/nested steps, duplicate keys,
non-word literals), the per-step identity key described above, and the
literal text of a keyword-shaped rule body (STRING, TOKEN- or prec-wrapped).

```text
/** Per-arm atom-key set for `isPermutationChoice`; null = arm ineligible. */
```

### `packages/codegen/src/dsl/list-patterns.ts::separatorFactsEqual`

```text
/**
 * Structural equality for the nested separator fact (`{value, trailing?,
 * leading?}`). The wrapper object itself has no `.type` discriminant, so
 * `rulesEqual` can't be called on it directly — compare
 * `trailing`/`leading` primitively and `value` (the inner Rule) via
 * `rulesEqual`.
 *
 * SSOT for this comparison: both `rulesEqual` below (repeat/repeat1 case) and
 * `normalize.ts`'s own `rulesEqual` (REPEAT case) delegate here instead of
 * `===`, which — post-PR-S — would compare object identity on a freshly
 * allocated wrapper per lift call rather than the separator's actual value.
 *
 * `rulesEqual(a.value, b.value)` runs on the separator's inner Rule, which is
 * always a terminal/simple rule (a literal string or a small choice/seq of
 * literals) even when this helper is reached post-wrapper-deletion (e.g. from
 * `rule-attrs.ts`'s `sharedArmAttrs`) — so it's safe despite `rulesEqual`'s own
 * "do NOT call after wrapper-deletion" doc note, which is about the STRUCTURAL
 * rule being compared, not this always-simple nested value.
 */
```

### `packages/codegen/src/dsl/list-patterns.ts::rulesEqual`

```text
/**
 * Structural equality for rule trees. Limited to the rule shapes that exist
 * pre-link (no polymorph/supertype/terminal — those appear only after
 * Link). Used by the commaSep1 lift to verify a seq's standalone element
 * matches the repeat's content. Lowers both sides' `type` before comparing
 * so this stays correct regardless of case (both runtimes agree on
 * UPPERCASE today, but the lower-both-sides comparison needs no update if
 * that ever changes).
 */
```

### `packages/codegen/src/dsl/list-patterns.ts::firstStringOfChoice`

```text
/**
 * Extract the first string literal from a choice rule, if any.
 *
 * Handles the choice-of-separators pattern (e.g. tree-sitter-typescript's
 * `sepBy1(choice(',', $._semicolon), X)`): the separator position is a choice
 * of a literal and an external symbol. The first string member is the
 * canonical render-side separator; parse still accepts either form.
 */
```

### `packages/codegen/src/dsl/list-patterns.ts::detectRepeatSeparator`

```text
/**
 * Detect the `seq(SEP, X)` / `seq(X, SEP)` separated-list shape inside a
 * repeat/repeat1 content body, where `SEP` is a string literal or a choice
 * whose arms may include non-literal (symbol/external-scanner) members —
 * not just a choice-of-literals. Returns the non-separator content, the FULL
 * detected separator rule (a `StringRule` for the literal case, the whole
 * `ChoiceRule` for a choice-shaped one — no longer narrowed to its first arm,
 * PR-S, and no longer required to contain a string arm at all), and whether
 * the separator was trailing (`seq(X, SEP)`); or `null` when no separator
 * shape is present.
 *
 * Callers that need a literal string out of a returned CHOICE separator
 * (e.g. `enrich.ts`'s `listSeparatorOfOptionalSeq`) must handle the
 * no-string-arm case themselves — `firstStringOfChoice` returns `null` for
 * an all-symbol choice, which is not the same as "no separator shape here".
 *
 * Pure: reports the shape; the caller decides whether to lift it onto a
 * `repeat` (link) or read it for group creation (enrich).
 */
```

### `packages/codegen/src/dsl/rule-attrs.ts::withAttrsFrom`

```text
/**
 * Transfer slot-identity attributes from a discarded wrapper node onto the
 * survivor. Only absent attributes are transferred (`hasOwnProperty` guard
 * means the survivor's own values always win). This ensures:
 *   - `fieldName` / `multiplicity` / `separator` — slot-classification attrs
 *   - `id` — rule identity, so `slotByRuleId` resolves against the wrapper's
 *     pre-simplification id rather than degrading to fragile name fallbacks.
 *
 * Non-overriding: a passed-through inner node keeps its own id; only a
 * freshly-rebuilt structural node (`{ type:'CHOICE', members }`) gets the
 * source id stamped.
 */
```

#### body

```text
// Identity rides along with the attrs: the result absorbs the original's
// `id` (when it did not take it over) and `absorbedIds`, so a rewrite that
// replaces a node — a literal-only seq folded to one STRING — keeps every
// slot id the replaced subtree carried (`slotByRuleId` coverage).
```

### `packages/codegen/src/dsl/rule-attrs.ts::absorbIds`

```text
/** `absorbIds(host, ...absorbed)` returns `host` with `absorbedIds`
 *  extended by each absorbed rule's own `id` and its own `absorbedIds`
 *  (deduped, and never the host's own id). Returns `host` unchanged when
 *  nothing new is added. Used wherever simplify reduces sibling or nested
 *  nodes into one survivor — the survivor's `absorbedIds` is how a later
 *  slot lookup still resolves an id the simplified tree no longer has a
 *  node for.
 */
```

### `packages/codegen/src/dsl/rule-attrs.ts::withKindFacts`

```text
/** Carries a rule's `hidden`/`inlinedFrom` facts from `source` onto
 *  `result` when `result` doesn't already have them — `hidden` only
 *  overwrites on a real difference, `inlinedFrom` only fills an absent
 *  slot (never overwrites an existing splice-provenance stamp). Used
 *  where a pass rebuilds a rule's root fresh — flatten's `flattenRules`
 *  carries the pre-flatten rule's facts onto the flattened root; link's
 *  `classifyAndLogHiddenRules` carries them onto a reclassified
 *  EnumRule/SupertypeRule; normalize's alias-bodies merge carries the
 *  MAIN rules map's already-facted entry onto the separately re-derived
 *  alias-body rule when both exist for the same kind — and the
 *  pre-rebuild rule's kind-level facts would otherwise be silently
 *  dropped. */
```

#### body

```text
// `original` may be a wrapper-bearing (evaluate/link) rule where these
// stamped leaf attrs aren't part of the type yet (they're populated by
// `flattenRules` during Normalize) — but `collapseWrappers`
// (normalize.ts, pre-Normalize) legitimately calls this with `Rule<'link'>`
// wrapper nodes that already carry link-lifted attrs defensively. Read
// structurally rather than narrowing the param type, matching the
// established pattern (see `findRepeatFlag` in dsl/rule-transforms.ts).
```

#### body

```text
// `nonterminal` is deliberately NOT transferred: every survivor a collapse
// site produces is intrinsically nonterminal (isSlotNode's structural
// fallback covers it). `optionalElement` has no structural fallback — the
// deleted-wrapper fact would die with the discarded node.
```

#### body

```text
// Lexical token facts (Link's flattened `token(...)` wrappers) have no
// structural fallback either — a collapse survivor must keep them or an
// immediate token kind loses its seam-free rendering.
```

#### body

```text
// Preserve the rule's identity through collapse: renderRule.id === collapsedRule.id
// so the emitter (walks renderRule) and collectSlots (reads simplifiedRule) still
// share one of the slot's `sourceRuleIds`, making `slotByRuleId` (the canonical,
// primary slot lookup) resolve instead of degrading to fragile fallbacks.
```

Also carries the source root's whole `annotations` bag (merged over the
result's own), because the annotation is the only representation of a
kind-level declaration such as `hoisted`: a pass that rebuilds the root
(normalize's wrapper collapse and choice factoring, `inlineSingleUseHidden`,
simplify's canonicalisation, flatten) would otherwise drop it. Every root
rebuild goes through here.


### `packages/codegen/src/dsl/rule-attrs.ts::withId`

```text
/** Stamp a rule id onto a built rule when there is one to stamp. Identity
 *  is not a DSL parameter, so no constructor takes it: `flatten` applies
 *  `id: node.id ?? built.id` once per rebuilt node (the wrapper's own id
 *  wins over the survivor's — `slotByRuleId` resolves the wrapper's id),
 *  `inlineRefs` keeps the reference's id over the inlined body's, and
 *  link's mints stamp the rule they replace. */
```

### `packages/codegen/src/dsl/rule-attrs.ts::rebaseRuleIds`

```text
/** Re-key a spliced body's rule ids under the host reference's id. Ids are
 *  minted once, per source kind, by the rule catalog; `ruleIdPath` reads
 *  their path back;
 *  when link or normalize splices a body into another rule, the descendants
 *  would otherwise keep the source owner's ids, and every host that inlines
 *  the same body would register the same id in `slotByRuleId` — last writer
 *  wins, so a host could resolve another host's slot (and inherit its
 *  requiredness). The body root takes the host id; each descendant becomes
 *  `<hostId>/<path>`, so ids stay unique per host and `slotByRuleId` resolves
 *  the host's own slot. A missing host id leaves the body untouched. */
```

### `packages/codegen/src/dsl/rule-attrs.ts::armsOf`

```text
/** The arms of a choice (`members`); `[]` otherwise. */
```

### `packages/codegen/src/dsl/rule-metadata.ts::makeRuleMetadata`

```text
/** Construct opaque rule metadata from the real shape — the single write seam. */
```

### `packages/codegen/src/dsl/rule-metadata.ts::readRuleMetadata`

```text
/**
 * Read opaque rule metadata back as the real shape. Sanctioned callers only
 * (see module header) — never call from compiler logic or an emitter's
 * branching path.
 *
 * Accepts `unknown` (not just `RuleMetadata`) as input: hand-constructed test
 * fixtures and some dsl-layer boundary shapes (`FieldLike`/`RuntimeRule`,
 * types/runtime-shapes.ts) carry `metadata` typed loosely — the read seam
 * itself is still the single sanctioned place the real shape is exposed, so
 * widening the input type here doesn't loosen the opacity contract on
 * `RuleBase.metadata` (which stays `RuleMetadata`, unreadable without this
 * function regardless of caller layer).
 */
```

### `packages/codegen/src/dsl/rule-metadata.ts::normalizeEnumMembers`

Normalizes a closed literal set to its canonical rule shape. A single literal
collapses to that StringRule, so downstream phases classify it as the
corresponding keyword or token instead of carrying a degenerate enum; two or
more members stay a ChoiceRule (enum-shaped). No metadata is attached.

### `packages/codegen/src/dsl/rule-transforms.ts::combineMultiplicity`

```text
/**
 * Combine an OUTER multiplicity (pushed down from an enclosing wrapper) with
 * a leaf's own INNER multiplicity into the effective slot multiplicity.
 *
 * `undefined` means "single / exactly one". The lattice:
 *   - nothing pushed (`outer === undefined`) → keep `inner`.
 *   - either side is a collection (array / nonEmptyArray) → the result is a
 *     collection. It is `nonEmptyArray` only when BOTH sides guarantee ≥1
 *     element (a side guarantees ≥1 iff it is single (`undefined`) or
 *     `nonEmptyArray`); otherwise `array` (allows empty).
 *   - neither is a collection → `optional` if either is optional, else single.
 *
 * Examples (the cases this fixes):
 *   combine('nonEmptyArray', undefined)  → 'nonEmptyArray'  (type_arguments union: ≥1)
 *   combine('nonEmptyArray', 'optional') → 'array'          (trait_bounds: 0-or-more)
 *   combine('array', 'optional')         → 'array'
 *   combine('optional', 'optional')      → 'optional'
 *
 * This replaces the prior "outer wins unless inner is already an array" rule,
 * which clobbered an inner `optional` with the outer `nonEmptyArray` and
 * produced `NonEmptyArray<T>` where the runtime slot is 0-or-more.
 *
 * Moved from rule-attrs.ts (origin: rule-attrs.ts:70).
 */
```

```text
/* The `RuleBuilder` construction strategy (`structuralBuilder` /
   `attributeBuilder`) lives in `dsl/builders.ts`, which imports the shared
   transform utilities below (dsl -> dsl). Phase contexts live in the
   compiler layer: compiler/ctx.ts holds `BaseCtx<R>`; per-phase classes
   (NormalizeCtx / SimplifyCtx / …) extend it in their phase files. Helpers
   here that need a builder take a structural `{ builder?: RuleBuilder }`
   slice — never the compiler ctx — so there is no dsl -> compiler cycle. */
```

```text
// ---------------------------------------------------------------------------
// Shared, idempotent rule transforms.
// ---------------------------------------------------------------------------
```

#### body

```text
// `'single'` is the canonical required-one value (rule.ts `Multiplicity`);
// a missing multiplicity defaults to it (null-coalesce). The lattice then
// operates in `'single'` terms: `optional` trumps single
// (`combine(optional, single) → optional`), and `guaranteesOne('single')`
// is true (`combine(nonEmptyArray, single) → nonEmptyArray`, not `array`).
```

#### body

```text
/* Both are 'single' → required-one / default. Return `undefined` rather
	   than the explicit string so callers that only stamp non-default values
	   don't write a spurious `multiplicity: 'single'` onto clean nodes. */
```

### `packages/codegen/src/dsl/rule-transforms.ts::extractRepeatShape`

```text
/**
 * Unwrap structural wrappers around a repeat / repeat1 so the caller
 * can detect `optional(repeat(...))`, `group(repeat1(...))`, etc.
 * Returns `null` for anything that isn't ultimately a repeat shape.
 *
 * Moved from simplify.ts (origin: simplify.ts:1164).
 */
```

#### body

```text
// Cast, not narrow: `AnyRule = Rule<PhaseName>` distributes REPEAT
// across every phase, while `RepeatRule`/`Repeat1Rule` (bare) default
// to the single 'link' phase — same "narrow via AnyRule, cast back"
// convention as rule-patterns.ts's `ruleChildren`.
```

### `packages/codegen/src/dsl/rule-transforms.ts::pushAttrsToLeaves`

```text
/**
 * Stamp `multiplicity` / `separator` / `fieldName` onto the slot-bearing
 * leaves of a (wrapper-free) rule body. Structural nodes are descended;
 * leaves are stamped. An existing array / nonEmptyArray multiplicity on a
 * leaf is preserved (it is already at least as multi as the pushed value).
 * `fieldName` is only applied to a leaf that has no field name yet.
 *
 * Moved from simplify.ts (origin: simplify.ts:1101). Was file-local; now exported.
 */
```

#### body

```text
/* A seq is flattened into its parent by `canonicalizeSeqOfLeaves`, so
			   a seq-level multiplicity would be lost. Push into members instead. */
```

#### body

```text
/* A choice at a seq position is a SINGLE slot boundary (the field
			   walker unions its arms into one slot). `deriveSlotsRaw`'s choice
			   case reads multiplicity from the choice NODE (effectiveMultiplicity),
			   then overrides each arm value with it — so stamp the node itself.
			   The node survives flattening (only seqs flatten), so leaf-level
			   stamping of the arms is unnecessary here. */
```

#### body

```text
/* Propagate the pushed-down fieldName onto the choice NODE too (the
			   leaf case does this; the choice case forgot). A choice is the slot
			   boundary, so without this an inlined `field('body', _suite)` whose
			   `_suite` is a choice loses the `body` name → buildSlot falls back to
			   an arbitrary arm kind (`block`). See python `function_definition.body`. */
```

#### body

```text
// Leaf: symbol / string / pattern / terminal / enum / supertype / etc.
```

### `packages/codegen/src/dsl/rule-transforms.ts::inlineRefs`

```text
/**
 * Inline hidden symbol references by substituting their content. Two inlining
 * paths are applied in priority order:
 *
 *  1. GROUP / MULTI path: hidden group rules (seq-with-fields) and hidden
 *     multi helpers (repeat / repeat1 wrappers) are always inlined so the
 *     referrer's field walker sees the fields / multi-slot directly.
 *
 *  2. grammar.inline path: hidden symbol refs whose target appears in the
 *     grammar's `inline:` array are inlined unconditionally — these are
 *     helpers tree-sitter itself expands at parse time. Sittir's derivation
 *     view must match what tree-sitter produces: if the parser inlines a
 *     helper, the simplified rule must too. Skipped when the reference
 *     carries `aliasedTo` — an aliased occurrence materializes as its own
 *     node regardless of the grammar's `inline:` array.
 *
 * The inlined body takes the REFERENCE's id (`id: ref.id ?? body.id`) — the
 * parent's identity survives a nesting that disappears, the same rule
 * `flatten` applies to a deleted wrapper. The render view keeps the
 * reference, so both views name the slot by one id and `slotByRuleId`
 * resolves the template walk's lookups without a second derivation.
 *
 * Cycle-safe via visited set.
 */
```

### `packages/codegen/src/dsl/rule-transforms.ts::resolveGroupOrMultiInlineTarget`

```text
/**
 * Return the rule to inline for a hidden symbol target, or `null` if the
 * target should not be inlined. Takes the referring symbol and the
 * `InlineRefsCtx` (rules + `hoistedKinds`) and resolves the target itself.
 * Two target shapes are inlined:
 *  - Hoisted hidden rules (`ctx.hoistedKinds`): inline the body (the
 *    seq-with-fields) so the referrer's field walker sees the fields directly.
 *  - Hidden MULTI helpers (body unwraps to a `repeat` / `repeat1`):
 *    inline the whole target rule so the wrapper survives and the
 *    walker marks the child slot as multi-valued.
 * All other hidden rules stay as-is — they are distinct structural
 * nodes or dispatch points.
 */
```

#### body

```text
// `extractRepeatShape` finds a REPEAT/REPEAT1 wrapper node — the link-phase
// shape. Called post-wrapper-deletion (normalize's own `inlineHiddenSeqRefs`
// fixpoint, which only ever sees the wrapper-deleted `normalizedRules` view),
// that node is already gone: the SAME fact survives as a bare
// `multiplicity: 'array' | 'nonEmptyArray'` attribute on the target's own
// rule. Checking both keeps this function correct for its wrapper-bearing
// caller (`inlineRefs`, from assemble's link-phase `inlinedRule`) and its
// wrapper-deleted caller alike.
```

### `packages/codegen/src/dsl/rule-transforms.ts::reapplyInlinedLeafAttrs`

```text
/**
 * Re-apply a referring symbol's pushed-down leaf attributes onto the body
 * that replaced it during inlining.
 *
 * wrapper-deletion collapses modifier wrappers onto the innermost leaf
 * (e.g. `repeat1(SYMBOL(_x_repeat1))` → `SYMBOL{multiplicity:'nonEmptyArray',
 * separator}`). When `inlineRefs` substitutes that symbol with its target
 * body, the attributes on the symbol would be lost — collapsing a
 * multi-valued slot to singular and dropping the separator. We reconstruct
 * the equivalent modifier wrapper around the inlined body and re-run the
 * idempotent `flatten`, which re-pushes the attributes onto the
 * inlined body's leaves using the same "outer wins" rule wrapper-deletion
 * applied originally.
 *
 * The attributes are pushed onto the inlined body's *leaves* (symbols /
 * fields / terminals), not onto an enclosing seq node. A seq-level
 * multiplicity would be lost when `canonicalizeSeqOfLeaves` flattens the
 * inlined seq into its parent; leaf-level multiplicity survives flattening
 * and is what `deriveSlots` reads. Stamping descends through structural
 * nodes (seq / choice / group / variant / clause / token / alias) and stops
 * at leaves, where it sets the multiplicity (a leaf that is already
 * multi-valued keeps its stronger array/nonEmptyArray) and separator.
 *
 * No-op when the referring symbol carries no non-default leaf attributes.
 */
```

### `packages/codegen/src/dsl/rule-transforms.ts::sameSlotShape`

```text
/**
 * Structural identity of two slot-bearing rules ignoring multiplicity and
 * separator. Used to decide that a head element and a repeat element are
 * "the same list element".
 */
```

The field name is part of the identity at every level: a head in one field and a repeat in another are two slots (`_let_chain`'s `left` beside its `right` list), never one list.

```text
```

#### body

```text
// enum-shaped ChoiceRules fall through to default.
```

### `packages/codegen/src/dsl/rule-transforms.ts::tryFusePair`

```text
/**
 * If `head` + `next` form a head+repeat list pair, return the fused multi
 * element; otherwise `null`.
 */
```

The fused element absorbs the head's id (and, for the separator-choice idiom, the choice's), so the render view's head occurrence still resolves to the list slot through `sourceRuleIds`.

```text
// head is already multi — not a head+repeat pair
```

#### body

```text
// Idiom A: [E, E{array}]
```

```text
// the array element absorbs the single head occurrence
```

#### body

```text
// Idiom B: [E, choice(sepString, E{array})]
```

#### body

```text
/* Fall back to the choice's separator-string arm, marking a
			   mandatory trailing separator. `repArm`'s static type is the full
			   AnyRule union (the `.find()` predicate above doesn't narrow it),
			   so spread through `object` first to sidestep the excess-property
			   check on the added `separator` key. */
```


### `packages/codegen/src/dsl/rule-walker.ts::childEdgesOf`

```text
/**
	 * THE canonical child-edge relation WITH the property path to reach each
	 * child — single source of truth for both "what are this rule's children"
	 * and "how do I address one for a targeted rewrite". Edges: `members`
	 * (seq/choice) at `['members', i]`, `content` (wrappers/variant/group/
	 * token/alias) at `['content']`, and the stamped separator rule (the
	 * nested `separator.value` — a single `Rule`) at `['separator', 'value']`
	 * (`trailing`/`leading` live alongside it on the wrapper object but
	 * aren't rule-tree edges). Leaves return []. `childrenOf` derives from
	 * this so there is exactly ONE edge relation; path-aware callers (e.g.
	 * enrich's un-aliasing rewrite) walk the edges directly to record a
	 * rewrite path without maintaining a second, possibly-incomplete descent
	 * of their own.
	 */
```

### `packages/codegen/src/dsl/rule-walker.ts::childrenOf`

```text
/**
	 * THE canonical child-edge relation — single source of truth for "what
	 * are this rule's children" (see `childEdgesOf` for the edge/path detail).
	 * map, fold, find, foldDeep, and findDeep all use this relation
	 * identically; a subclass narrows it only through `descends`.
	 */
```

### `packages/codegen/src/dsl/rule-walker.ts::map`

```text
/**
	 * Bottom-up rebuild. Applies `visit` to each child's mapped result, then
	 * rebuilds this node ONLY if a child changed. Returns the SAME reference
	 * when nothing changed — load-bearing for fixpoint loops that compare
	 * `r === before` (enrich). Each edge (`members`, `content`, separator)
	 * tracks its own change independently, so an untouched sibling edge keeps
	 * its exact input reference even when another edge on the same node is
	 * rebuilt. Rebuilds via the SAME `childrenOf` edge relation `fold`/`find`
	 * use.
	 */
```

### `packages/codegen/src/dsl/rule-walker.ts::fold`

```text
/** Pre-order accumulate: visits `rule` itself, then descends childrenOf. */
```

### `packages/codegen/src/dsl/rule-walker.ts::find`

```text
/** Pre-order search: tests `rule` itself, short-circuits on first match. */
```

### `packages/codegen/src/dsl/rule-walker.ts::deref`

```text
/** One-step SYMBOL resolve through the bound rules map. */
```

### `packages/codegen/src/dsl/rule-walker.ts::foldDeep`

```text
/**
	 * fold that additionally descends THROUGH symbol refs (cycle-safe). Each
	 * reachable rule node is visited at most once per invocation (seen-set
	 * keyed on node identity); symbol refs are followed through the bound
	 * rules map.
	 */
```

### `packages/codegen/src/dsl/rule-walker.ts::findDeep`

```text
/**
	 * find that additionally descends THROUGH symbol refs (cycle-safe). Each
	 * reachable rule node is visited at most once per invocation (seen-set
	 * keyed on node identity); symbol refs are followed through the bound
	 * rules map.
	 */
```

### `packages/codegen/src/dsl/rule-walker.ts::isLexedBoundary`

```text
/**
 * True for a TOKEN or IMMEDIATE_TOKEN node: the boundary of a lexed
 * interior. Everything under it is lexed as one token, so it holds no parser
 * nodes, no fields and no kind references of the syntactic grammar. Every
 * enrich pass that mints fields, labels or lifts stops here, through
 * SyntacticRuleWalker or by checking this predicate in its own descent. The
 * boundary node itself is still visited; only its interior is not.
 */
```

### `packages/codegen/src/dsl/rule-walker.ts::RuleWalker.descends`

```text
/**
 * Whether the walker enters this node's children. childEdgesOf (and so
 * childrenOf, fold, find, foldDeep, findDeep) and map all consult it, so a
 * subclass narrows every traversal at one place. The base walker descends
 * everywhere.
 */
```

### `packages/codegen/src/dsl/rule-walker.ts::SyntacticRuleWalker`

```text
/**
 * A RuleWalker that walks the syntactic layer only: it never descends past
 * isLexedBoundary. Enrich's rewriting passes use it so nothing they mint
 * lands inside a token's lexed interior.
 */
```

### `packages/codegen/src/dsl/dsl-authoring.ts::AuthoringField`

```text
/** 1-arg → transform placeholder; 2-arg → a grammar-shapes `FieldRule` (rule body). */
```

### `packages/codegen/src/dsl/dsl-authoring.ts::AuthoringAlias`

```text
/** 1-arg string → transform placeholder; 1/2-arg rule → a grammar-shapes `AliasRule`. */
```

### `packages/codegen/src/dsl/enrich.ts::EnrichedGrammar`

```text
/**
 * Type-level mirror of what `enrich()` does to the rules at runtime: each rule
 * is replaced by its post-enrich shape (`EnrichRule`). Applied to a flat
 * grammar-shape schema (`{ rules: {…} }`); other inputs (e.g. the internal
 * `GrammarResult` wrapper) pass through unchanged.
 */
```

### `packages/codegen/src/dsl/enrich.ts::name`

```text
/** Raw symbol name (preserves any leading underscore for supertype detection). */
```

### `packages/codegen/src/dsl/enrich.ts::symbolRule`

```text
/** The SYMBOL rule itself, used as the FIELD's content. */
```

### `packages/codegen/src/dsl/enrich.ts::wrap`

```text
/** Rebuild the original seq-member rule around a freshly-built FIELD node. */
```

### `packages/codegen/src/dsl/enrich.ts::slotKey`

```text
/**
	 * Enclosing FIELD name, when this value sits (directly or transitively)
	 * inside a `field(name, …)` wrapper — otherwise `undefined` (positional).
	 * Two aliases sharing a `targetName` but living in DIFFERENT fields are
	 * genuinely distinguishable (the field name disambiguates the read-time
	 * slot), so the collision bucketing keys on `(slotKey ?? targetName,
	 * targetName)` rather than `targetName` alone. When `undefined` the
	 * effective key falls back to `targetName`, preserving the pre-slotKey
	 * behavior for positional (non-field-wrapped) collisions.
	 */
```

### `packages/codegen/src/dsl/list-patterns.ts::SeparatorFact`

```text
/**
 * The nested separator fact's shape (`{value, trailing?, leading?}`),
 * phrased structurally over `RuntimeRule` (rather than a specific
 * `RuleBase<Phase>['separator']`) so `separatorFactsEqual` accepts the fact
 * at ANY phase view (`RuleBase<'normalize'>.separator`,
 * `RepeatRule<'link'>.separator`, …) without a phase-widening cast at the
 * call site — they all share this identical structural shape post-PR-S.
 */
```

### `packages/codegen/src/dsl/rule-attrs.ts::SharedArmAttrs`

```text
/**
 * Attributes shared across the arms of a choice / polymorph. ONE derivation
 * consumed by both phases (was previously implemented twice, inconsistently —
 * simplify's `liftSharedArmAttrs` was choice-only + unanimous-multiplicity;
 * collect-slots' `sharedArmFieldName` + `strongestArmMultiplicity` were
 * choice+polymorph + strongest-multiplicity):
 *  - simplify's `liftSharedArmAttrs` hoists the UNANIMOUS attrs onto the choice.
 *  - collect-slots reads the unanimous `fieldName` (slot naming) and the
 *    `strongestMultiplicity` (to lift an array multiplicity a single arm carries,
 *    e.g. `choice(commaSep1(X), X)`).
 *
 * `fieldName` / `multiplicity` / `separator` are UNANIMOUS — present and
 * equal on EVERY arm, else `undefined`; `nonterminal` lifts only a unanimous
 * `true` (arms that are each fixed text do not make the choice text — a
 * choice is nonterminal). `strongestMultiplicity` is
 * the most-multi multiplicity ANY single arm carries (`nonEmptyArray > array >
 * optional`; `single` / absent ignored), regardless of unanimity.
 */
```

### `packages/codegen/src/dsl/rule-attrs.ts::StampedAttrs`

```text
/**
 * Structural-read shape for the stamped leaf attributes. These only exist
 * on `RuleBase<'normalize' | 'simplify'>` per the type, but `sharedArmAttrs`
 * is called from `collect-slots.ts` with `AnyRule` values that are, at
 * runtime, always post-wrapper-deletion (normalize-phase) rules — the
 * wrapper-bearing 'evaluate'/'link' views just don't carry these fields.
 * Matches the established structural-read-cast pattern (see
 * `findRepeatFlag` in dsl/rule-transforms.ts).
 */
```

### `packages/codegen/src/dsl/rule-metadata.ts::RuleMetadataShape`

The facts the opaque metadata bag carries, one key per fact because their
value sets differ: `fieldSource`, `symbolSource` and `aliasSource` record how
a FIELD, a SYMBOL reference or an ALIAS arose. Every key is read only in the
DSL phase (enrich, transform); no compiler or model phase branches on
metadata.

### `packages/codegen/src/dsl/rule-metadata.ts::fieldSource`

```text
/** Who placed a FIELD: the grammar, an override patch, or enrich. */
```

### `packages/codegen/src/dsl/rule-metadata.ts::symbolSource`

```text
/** How a SYMBOL reference arose: the grammar, link, or an enrich group-lift (the fact transform-path's descent keys on). */
```

### `packages/codegen/src/dsl/rule-metadata.ts::aliasSource`

Stamped `'visible-group'` by enrich's `makeVisibleGroupAlias` on the
content alias it mints for a promoted hidden rule. The only reader is
`dsl/transform/transform-path.ts`'s `isEnrichContentAlias`, which keys on
this field alone to decide whether path-descent should travel transparently
through the alias.

### `packages/codegen/src/dsl/rule-transforms.ts::RuleBuilder`

```text
/**
 * Strategy interface for constructing wrapper/structural rules. Injected via
 * `TransformCtx.builder` so each call-site delegates node-vs-attribute
 * decisions to the phase rather than hard-coding them. Two implementations:
 *
 *  - `structuralBuilder` (defined here, dsl-side): builds plain node literals
 *    exactly as construction sites did before — byte-identical results. Used
 *    as the no-ctx default (`ctx.builder ?? structuralBuilder`).
 *
 *  - `attributeBuilder` (defined in compiler/simplify.ts): overrides the
 *    wrapper constructors to push attributes instead of building nodes — so
 *    simplify stays field/optional/repeat/repeat1-node-free by construction.
 */
```

### `packages/codegen/src/dsl/rule-transforms.ts::InlineRefsCtx`

```text
/**
 * Ctx for the shared `inlineRefs` op. Self-contained so
 * non-phase callers (assemble's alias-body path) can construct it without a
 * full TransformCtx. `hoistedKinds` is the grammar's hoisted-kind set; a
 * caller without one (a bare rules map in a test) inlines only multi helpers.
 */
```

### `packages/codegen/src/dsl/enrich.ts::ENRICH_RULE_ORIGINS_KEY`

The non-enumerable key under which `enrich()` attaches its rule-origin map to the grammar result (see `getEnrichRuleOrigins`).

### `packages/codegen/src/dsl/arm-names.ts::polymorphVisibleName`

The rule name a polymorph variant mints — also its node kind, since a
variant is a visible rule rather than a hidden rule behind an alias. When
the parent is itself a hidden rule (name starts with `_`) — e.g.
`_for_header` — its leading underscores are stripped
(`undisplayedKindAddress`) so the variant kind
(`for_header_lhs`) is visible in the parse tree; without stripping,
tree-sitter would hide it, collapsing the variant. The one naming
convention every wire/transform placeholder-resolution path, `link.ts`'s
override-polymorph matching, and `emitters/overlays/module.ts`'s minted-route
detection share, so a variant registered under a given parent and suffix is
found under the same name wherever it is minted or looked up.

### `packages/codegen/src/dsl/arm-names.ts::undisplayedKindAddress`

The underscore-less address of a kind: strips every leading underscore,
unconditionally — the one way this module removes a hidden prefix.
`display-name.ts`'s `displayOfParserName` applies it only
to a hidden-prefixed parser name; `automatic-variants.ts`'s `armDisplayOf`
and `node-map.ts`'s `armFactsOf` apply it directly to a SYMBOL's own name or
a literal arm's resolved kind to get the name an arm label is built from.

### `packages/codegen/src/dsl/arm-names.ts::prefixNamedSuffix`

The suffix that turns `parentKind`'s visible name into `targetName`
(`polymorphVisibleName(parentKind, suffix)`), or `null` when `targetName` is
not so named or the suffix would be empty. Both names may carry leading
underscores (`undisplayedKindAddress`). Module-private: callers name an arm
through `armNameOf`.

### `packages/codegen/src/dsl/arm-names.ts::GROUP_TOKEN_SYNONYMS`

Token spellings that name the same syntactic category as one of
`CATEGORY_TOKENS` under a different word than the category itself —
`item`/`stmt` for `statement`, `expr` for `expression`, `decl` for
`declaration`, `impl` for `implementation`. `normalizeGroupToken` maps a raw
member/group token through this table before two names' tokens are compared,
so `declaration_statement` and `function_item` agree they share a category
token even though neither spells it `statement`.

### `packages/codegen/src/dsl/arm-names.ts::CATEGORY_TOKENS`

The token vocabulary `supertypeMemberName` may drop from a member's trailing
position when nothing else in the member's name already overlaps the
supertype's own tokens: syntactic categories rather than constructs
(`expression`, `statement`, `literal`, `declaration`, `definition`,
`operator`, `pattern`, `type`). `line_comment` keeps `comment` because
comment is the construct, not one of these categories.

### `packages/codegen/src/dsl/arm-names.ts::normalizeGroupToken`

A token's canonical spelling for group-name comparison: itself, unless
`GROUP_TOKEN_SYNONYMS` names a synonym.

### `packages/codegen/src/dsl/arm-names.ts::tokensOf`

A kind name's underscore-separated tokens, with empty segments dropped.

### `packages/codegen/src/dsl/arm-names.ts::supertypeMemberName`

The one derivation of a supertype member's short name: `memberKind`'s tokens
with whatever `supertypeKind`'s own name already says (synonym-normalized via
`normalizeGroupToken`) removed. When nothing overlapped and the member has
more than one token, a trailing `CATEGORY_TOKENS` token is dropped instead.
Falls back to the bare, unstripped member name when nothing was left to drop
or the surviving tokens would just repeat the supertype's own name (a
stutter). Called through `armNameOf` for a supertype owner's arms (the
automatic-variant stamp and relabel in `automatic-variants.ts`), and directly by
`emitters/ir.ts`'s `memberKeyFor` to key a member inside its supertype's
grouped namespace — one derivation, so an arm's variant name and its ir
group key never drift apart.

### `packages/codegen/src/dsl/arm-names.ts::armNameOf`

The one arm-naming rule: a supertype owner names its members by
`supertypeMemberName(display, owner)` (a short name stripped of the owner's
own tokens or trailing category word); any other owner by
`prefixNamedSuffix(owner, display) ?? display` (the owner-prefix suffix, or
the bare display when the display isn't so prefixed). `automatic-variants.ts`'s
`labelOf` and `node-map.ts`'s `armFactsOf` both route through this one
function so an arm's enrich-stamped name and its structurally-derived name
can never diverge.

### `packages/codegen/src/dsl/automatic-variants.ts::module`

Stamps `variant`/`variantOf` annotations on every arm that needs one, once,
in `enrich`, right after `synthesizeFieldEnumRules`, so a sub-factory arm
exists exactly where a variant label sits at the end of wire and nothing
downstream re-derives arm-ness from a choice's shape. A label carries no
authorship marker: whether it is automatic is answered by one record,
`AutomaticVariants`, which enrich attaches to its result, wire copies into
each wire context (`seedAutomaticVariants`), evaluate carries onto
`RawGrammar.automaticVariants`, and link reads for `definedBy`. Wire's
readers take it from the context: `resolveFieldPlaceholder` strips a label
a patch fields (`withoutAutomaticVariants`); `resolveAliasPlaceholder` and
`replaceInBodyRt` restamp a label at a rewritten site (`relabelledArm`); an
authored label writer claims its site (`withAuthoredLabel`).

### `packages/codegen/src/dsl/automatic-variants.ts::AutomaticVariants`

The record of which labels are automatic: `keys` holds every automatic
label's key (`automaticVariantKey`) and is the single source of truth for
"this label is automatic"; `supertypeOwners` holds the owners whose arms are
named by the supertype member rule (`isSupertypeOwner`), decided once at
enrich. Enrich builds it, wire keeps one copy per context and edits that
copy (restamps add keys, authored writers remove them), and link reads the
copy evaluate carries.

### `packages/codegen/src/dsl/automatic-variants.ts::ArmShape`

The structural view the module reads and rebuilds through: wide enough for a
SYMBOL, an ALIAS, a CHOICE's `members`, a wrapper's `content`, and the
`annotations` a label lives on, without committing to one phase's node
types.

### `packages/codegen/src/dsl/automatic-variants.ts::ENRICH_AUTOMATIC_VARIANTS_KEY`

Well-known non-enumerable key attached by `enrich()` to the grammar result:
the `AutomaticVariants` sidecar (`keys` + `supertypeOwners`)
`stampAutomaticVariants` accumulated. `withWireContext`/`wire()` read it
(`getEnrichAutomaticVariants`) into `WireContext.automaticVariants`, the
record `withoutAutomaticVariants` strips a label against.

### `packages/codegen/src/dsl/automatic-variants.ts::SLOT_BOUNDARIES`

The rule types `visit`/`holdsChoice` never recurse past: FIELD, TOKEN,
IMMEDIATE_TOKEN, ALIAS, PATTERN, STRING, SYMBOL, BLANK. A FIELD already
addresses whatever choice it wraps by name, so nothing inside needs an arm
label; TOKEN/IMMEDIATE_TOKEN/ALIAS/PATTERN/STRING/BLANK are leaves or
lexical wrappers with no further choice structure to label. SYMBOL is here
for `holdsChoice`'s sake (a bare reference has no body of its own to walk
into); `visit` special-cases SYMBOL itself, ahead of this boundary, to
decide whether the rule it names is a hoisted choice worth labelling.

### `packages/codegen/src/dsl/automatic-variants.ts::coreOf`

An arm's `PREC`-unwrapped core (`rule-patterns.ts`'s `unwrapPrec`, read back
as an `ArmShape`) — where an arm's own type and annotations actually live,
ignoring any precedence wrapper around it.

### `packages/codegen/src/dsl/automatic-variants.ts::armDisplayOf`

The display name an arm would be labelled with, if any, read off its
`coreOf` (through any `PREC` wrapper): a SYMBOL's own name with leading
underscores stripped (`undisplayedKindAddress`), or a named ALIAS-of-SYMBOL's
`value`. `undefined` for anything else — a literal, an unnamed alias, a
seq — which is exactly what makes the arm `variantOf`-only.

### `packages/codegen/src/dsl/automatic-variants.ts::isDisplayedLiteral`

Whether an arm is a named alias over a STRING: a literal shown under
another kind's display. Such an arm is never labelled — `stamp` skips it
outright, since the display it stands under already has its own arm.

### `packages/codegen/src/dsl/automatic-variants.ts::annotationsOf`

The annotation payload a rule shape carries its `variant`/`variantOf` stamp
on: an ALIAS keeps them on its `content`, everything else on itself.

### `packages/codegen/src/dsl/automatic-variants.ts::refOf`

The identity half of an arm's stamp key: an ALIAS keys by its `value` and
its content's `name` (so re-pointing a mint at a new target changes the
key), a SYMBOL keys by its own `name`, anything else by its
JSON-stringified `value` (a literal keys by its own text).

### `packages/codegen/src/dsl/automatic-variants.ts::automaticVariantKey`

An arm's label key, `variantOf\0variant\0ref` (`refOf`), or `undefined` for
an arm with no `variantOf`. Exported because link's `definedByOf` looks a
labelled arm up in the record by the same key. The key is content-based, so
two sites with the same owner, name and reference share it; an authored
label that spells the automatic name removes the key (`withAuthoredLabel`),
which is how authoring claims the site.

### `packages/codegen/src/dsl/automatic-variants.ts::labelOf`

The `variant`/`variantOf` annotation pair for an arm: `{ variantOf: owner }`
alone when the arm has no display, else `{ variant: armNameOf(owner,
display, ownerIsSupertype), variantOf: owner }` — `armNameOf` picks the
supertype or suffix naming rule from `ownerIsSupertype`.

### `packages/codegen/src/dsl/automatic-variants.ts::withAutomaticLabel`

Writes an automatic label onto an arm's core (`withAnnotations`) and records
the labelled node's key in the record. The one site that mints an automatic
label: `stampRuleVariants` and `relabelledArm`'s automatic branch both go
through it.

### `packages/codegen/src/dsl/automatic-variants.ts::holdsChoice`

Whether a rule body holds a qualifying choice (two or more non-blank arms)
anywhere beneath it: descends into every member and wrapper, but a
`SLOT_BOUNDARIES` type stops the walk, since a labellable choice can't sit
inside one. Used only to answer whether a hoisted group is itself a
choice-holding one (`isHoistedChoiceGroup`); `visit`/`stamp` find and label
a choice directly, on their own walk, when they reach one.

### `packages/codegen/src/dsl/automatic-variants.ts::isElementChoiceRef`

Whether a node is a reference to an element supertype, bare or as a field's value. The supertype is the group's element choice minted as its own rule (`registerElementSupertype`), so `holdsChoice` counts the reference as the choice it replaced: a list group keeps its label on the parent, and the parent keeps the route that mounts the group, whether or not the element choice was lifted.

### `packages/codegen/src/dsl/automatic-variants.ts::isHoistedChoiceGroup`

Whether a referenced rule is a hoisted group (`annotations.hoisted`) that
itself holds a choice (`holdsChoice`) — the condition under which a plain
SYMBOL reference to it gets labelled (`visit`'s SYMBOL case): the reference
stands in for a choice one hop away, so it needs the label that choice's
own arms would get if inlined.

### `packages/codegen/src/dsl/automatic-variants.ts::isSupertypeOwner`

Whether an owner's arms are named by the supertype member rule: a declared
supertype, or a parser-hidden, non-inline rule that link classifies a
supertype (`hiddenChoiceClass` returns `'supertype'`, with the named-arm fact
computed from the same body by `isNamedArmChoice`). The one decision for
both the automatic stamp (`supertypeOwners`) and enrich's token-form arm
names (`annotateTokenFormArms`).

### `packages/codegen/src/dsl/automatic-variants.ts::stampRuleVariants`

Labels one rule's choice arms. `visit` walks the rule; at a CHOICE with two
or more non-blank members, each non-blank member goes through `stamp`: it is
labelled on its core under any `PREC` wrappers (`throughPrec`), unless it
already carries a `variantOf` or is a displayed literal, or its core is
itself a CHOICE, which `visit` recurses into so only the innermost arms are
labelled. A choice with fewer than two non-blank members is walked but not
labelled. A bare SYMBOL naming a hoisted choice-holding rule is labelled as
a stand-in for that choice (`isHoistedChoiceGroup`); `SLOT_BOUNDARIES` stop
the walk. A seq that is a `terminated` list (`separatedListBodyInfo`) is not
entered: the choice after its first element is the list's own spelling, not a
set of variants. The label is `labelOf(owner, armDisplayOf(core), <owner is in
supertypeOwners>)`, written and recorded by `withAutomaticLabel`.

### `packages/codegen/src/dsl/automatic-variants.ts::stampAutomaticVariants`

Labels every eligible choice arm across the grammar. First decides
`supertypeOwners` (`isSupertypeOwner` for every rule), then runs
`stampRuleVariants` over each rule with a lookup back into `rules`, replacing
the rule in place. Called once from `enrich`, after
`synthesizeFieldEnumRules` so the synthesized field-enum choices are
labelled too. Returns the record, which `enrich` always attaches to its
result as `ENRICH_AUTOMATIC_VARIANTS_KEY`.

### `packages/codegen/src/dsl/automatic-variants.ts::getEnrichAutomaticVariants`

The record on an enriched grammar, or `undefined` when the grammar carries
none (it never went through `enrich`). A value under the key that is not a
`{ keys: Set, supertypeOwners: Set }` record throws: a malformed record is
an error, never read as empty.

### `packages/codegen/src/dsl/automatic-variants.ts::seedAutomaticVariants`

The record a wire context starts from, built once when the context is: a
copy of the base's record (its own `keys` set, so wire's edits never reach
enrich's), or a new empty record when the base never went through `enrich`,
since then no label is automatic.

### `packages/codegen/src/dsl/automatic-variants.ts::withoutAutomaticVariants`

Strips every automatically-stamped label (never an override-declared one —
only a key present in `automatic.keys`) from a rule tree. Checks
`automaticVariantKey` at every node it visits, starting at the root itself,
not only at choice-member positions: a match is de-labelled
(`withoutLabel`), and the walk still recurses into what's left — through
`members`/`content` — until it passes a `SLOT_BOUNDARIES` type, where it
stops. A grammar with no automatic labels at all (`automatic.keys.size ===
0`) short-circuits to the input unchanged. Used by `resolveFieldPlaceholder`
so a patch that pulls a labelled arm under a `field()` doesn't leave the
enrich label sitting underneath the field's own address.

### `packages/codegen/src/dsl/automatic-variants.ts::withoutLabel`

Removes `variant`/`variantOf` from a rule's own annotations (or, for an
ALIAS, its `content`'s), dropping the `annotations` key entirely once both
are gone rather than leaving an empty object behind. Generic and exported
directly: `wire.ts`'s `wireRegisterSyntheticRule` calls it on a minted body
with no `AutomaticVariants` set to check against, since a mint's label
belongs on the reference site that names it, not on the body it points to;
`withoutAutomaticVariants`'s own strip calls it once a node's key is
confirmed to be in `automatic.keys`.

### `packages/codegen/src/dsl/automatic-variants.ts::withAuthoredLabel`

Writes an authored label onto `site` (`withAnnotations`) and removes the
labelled site's key from the record: authoring claims the site, so an
authored label that spells the automatic name is never taken for automatic
and survives a later strip. `relabelledArm`'s authored branch and
`transform/transform.ts`'s `withVariantAnnotation` (every `variant()`) go
through it.

### `packages/codegen/src/dsl/automatic-variants.ts::relabelledArm`

Re-labels a rewritten site after the arm it replaced (`original`, read off
its `coreOf`). No `variantOf` on `original` leaves `site` untouched. An
authored original (its key not in the record) keeps its label whole —
`variantOf`, `variant`, `default` — written onto `site` through
`withAuthoredLabel`. An automatic original is restamped from the site's own
display (`armDisplayOf`, `labelOf` with the owner's `supertypeOwners`
membership) through `withAutomaticLabel`, so the name matches what the site
now spells and the new key is recorded. Used by `resolveAliasPlaceholder`'s
lift/mint/rename branches and `replaceInBodyRt`'s group substitution.

### `packages/codegen/src/dsl/rule-transforms.ts::flagWalker`

```text
/**
 * Does `rule` contain a repeat/repeat1 that declares the given flag?
 *
 * `trailing: true` marks `sepBy` shapes where the final separator is
 * optional (e.g. rust's `{ a, b, }`). `leading: true` marks the
 * mirror shape `sep, x, (sep x)*` (rust's or_pattern `| a | b`, if
 * written as a single repeat). Link's `liftSeq` captures
 * both from their canonical seq patterns. Render reads each flag via
 * the `joinByTrailing` / `joinByLeading` template hints to know
 * whether to probe for a flanking anon-separator token when emitting
 * `$$$CHILDREN`.
 *
 * Walks the same transparent-wrapper set as `findNestedSeparator`
 * (seq / choice / optional / variant / clause / group / field).
 *
 * Moved from template-walker.ts (origin: template-walker.ts:65).
 */
```

### `packages/codegen/src/dsl/rule-transforms.ts::fuseHeadRepeatListsWalker`

```text
/**
 * Fuse head+repeat separated-list pairs into a single multi slot, recursively.
 * Behaviour-preserving everywhere else — non-seq rules and seqs without the
 * head+repeat shape pass through unchanged (reference-identical when no fusion
 * applies).
 *
 * Recursion is delegated to a bare `RuleWalker<AnyRule>` (traversal
 * engine), replacing the former `recurseChildren`-based self-recursive
 * visitor. `RuleWalker.map` is NOT a drop-in replacement: `map` already
 * recurses the whole subtree internally and applies `visit` to every
 * already-mapped node, so `visit` here (`fuseAtNode`) does ONLY the
 * single-level fusion — it must NOT call `fuseHeadRepeatLists` on itself
 * (that would recurse twice). `fuseHeadRepeatLists` additionally applies
 * `fuseAtNode` to `map`'s own return value, since `map` rebuilds a node's
 * children bottom-up but does not apply `visit` to the top node itself —
 * matching `recurseChildren(rule, fuseHeadRepeatLists)` followed by the
 * seq-fusion check that used to sit inline in this function.
 */
```

### `dsl-authoring.ts` — module purpose (`packages/codegen/src/dsl/dsl-authoring.ts`)

An authoring-typed facade over the DSL primitives, imported by `grammar.sittir.ts`.
Same runtime implementations as `./index.ts`, but with grammar-shapes return
types that are accurate in the tree-sitter authoring context, where these
primitives produce tree-sitter-shaped rules. The loose dual-runtime
`FieldLike` / `RuntimeRule` types stay codegen-internal — `grammar.sittir.ts` never
sees them. One boundary cast per primitive asserts the authoring-context
contract; runtime behaviour is unchanged.

### `prec` / `token` (`packages/codegen/src/dsl/dsl-authoring.ts`)

Both are runtime-injected by `saveAndInjectDslGlobals` (see
`compiler/evaluate.ts`) before an `grammar.sittir.ts` module graph is evaluated —
the same mechanism as `field` / `alias`'s underlying primitives. Unlike those
two there is no sittir-owned `primitives/prec.ts` / `primitives/token.ts`
runtime, because tree-sitter's own `prec` / `token` need no override-specific
placeholder behaviour. So this module re-types the SAME injected global rather
than re-implementing it.

`grammar.sittir.ts` imports these and thereby shadows the ambient `prec` / `token`
declared in `authoring-globals.d.ts`, via ordinary lexical scoping. That
sidesteps the fact that `const`-declared ambient globals don't merge as
overloads across files the way `declare function` does. `seq` / `choice` /
`field` / `alias` / `optional` / `repeat` / `repeat1` / `sym` / `string` /
`blank` merge fine and need no such treatment. A grammar that calls `prec` or
`token` must import them: without the import the ambient tree-sitter
declaration wins and rejects the grammar-json rules the other builders return.
`prec.left` and `prec.right` also take the one-argument form (`prec.right(rule)`,
precedence 0) that tree-sitter's own DSL accepts; `authoring-globals.d.ts`
declares the same overloads. `field(name)` returns a `FieldPlaceholder` that
keeps its name as a type, which is how a patch list knows which labels an earlier
map minted; `role()` takes a symbol reference, matching the runtime check.

### `packages/codegen/src/dsl/dsl-authoring.ts::grammar`

Runtime-injected the same way — this is `evaluate.ts`'s own `grammarFn`, NOT
tree-sitter's ambient `grammar()`. Its real two-arg (extension) contract is
`(base: <flat enriched grammar shape>, options: WiredOpts) => GrammarResult`:
`enrich(base)` returns `EnrichedGrammar<B>`, the SAME flat `{ name, rules, … }`
shape as `B` (sittir's readonly-tupled grammar-shape rules, each enriched) and
not a `{ grammar: { … } }` wrapper, while `wire()` returns `WiredOpts`.
`grammarFn`'s own return value IS `{ grammar: { … } }`-shaped
(`GrammarResult`), which is what a base-extension call receives.

Tree-sitter's ambient overloads instead expect a flat but MUTABLE
`GrammarSchema` base. Typing this re-export against the real contract is what
lets `grammar.sittir.ts` call `grammar(enrichedBase, wire(…))` without a
suppression.

### `mergeUnanimousAttrs` — separator comparison (`packages/codegen/src/dsl/rule-attrs.ts`)

`separator` is the nested `{ value, trailing?, leading? }` fact, and the
wrapper object carries no `.type` discriminant, so it is compared via
`separatorFactsEqual` rather than the generic rule comparison.

`separatorFactsEqual` narrows to whatever `rulesEqual`'s switch explicitly
handles and returns `false` silently for a `.value` shape `rulesEqual` doesn't
recognise. That is harmless today — a post-wrapper-deletion separator's
`.value` is always a STRING literal at this point — but it is the thing to
revisit if separators ever grow richer rule-shaped values.

### `collapseSingletonMintOrdinals` (enrich.ts)

Drops the ordinal from arm/group mint names whose parent minted exactly one
of that flavor — the ordinal only disambiguates siblings, so a lone
`<parent>_group1` / `<parent>_arm2` becomes `<parent>_group` / `<parent>_arm`.
Runs once over the merged rule bag right after the clause-group mints merge,
before the later passes and wire's override callbacks read names. Renames
the hidden rule key (in the merged bag AND the minted-rule bag, whose keys
later derive the `inline:` list), the visible alias value, every symbol
reference, and the rule-origin map (`ruleOrigins`). A name collision with any existing rule keeps the
ordinal. Only the clause-group mint namespace is surveyed; a sibling that was
registered but later unused still counts as a sibling.

```text
// Singleton-ordinal collapse — see docs/glossary/dsl.md (`collapseSingletonMintOrdinals`).
```

#### body

```text
// The minted-rule bag is read again after this pass (clauseGroupNames
// derives the inline list from its keys) — rename there too.
```

### `packages/codegen/src/dsl/builders.ts::collapseSingletonSeq`

```text
/**
 * A seq with exactly one member IS that member — the seq's own attributes
 * merge onto it by the same composition rules every collapse site in this
 * codebase uses: `withAttrsFrom`'s absent-only transfer for the identity
 * and flag attributes, `combineMultiplicity` for the composing one. This is
 * `collapseSingleMemberSeq` + `withAttrsFrom` (simplify's own later pass
 * over the whole tree), applied here at construction instead.
 */
```

#### body

```text
// The seq is the current rule: its identity wins over the survivor's,
// the same `id: rule.id ?? input.id` every builder stamps.
```

### `packages/codegen/src/dsl/annotations.ts::withAnnotations`

Merge annotations onto a runtime rule. An ALIAS is transparent: the
annotation lands on its content, which is the rule the alias faces, so a
stamp on `alias($._x, $.x)` reads back from `$._x`'s body. Lives in its own
module because both the transform (variant lift, `patches` lowering) and
wire / enrich (the `groups:` and clause-hoist mints) stamp through it, and
neither may import the other.


### `packages/codegen/src/dsl/annotations.ts::withHoistedAnnotation`

`withAnnotations(rule, { hoisted: true })`: the one spelling of the hoisted
declaration. Every route that mints a rule which is a form of its parent
stamps through here; link's `classifyHiddenRule` reads the stamp and nothing
else decides hoisting. Stamp the body, not a wrapper around it — evaluate
unwraps `prec` and a stamp on the wrapper is lost.


### `packages/codegen/src/dsl/builders.ts::slotShaped`

```text
/**
 * A rule is a slot by its own type alone: SYMBOL/SUPERTYPE/PATTERN (a
 * reference) or CHOICE (a union). One level: a wrapper type (SEQ/
 * GROUP) is never inspected here — its own builder already stamped
 * `nonterminal` on it when applicable, so `optional` reads that stamp
 * instead of recursing. A repetition never arrives as a node on this view:
 * `repeat`'s builder already stamped `nonterminal: true` on its content.
 */
```

### `packages/codegen/src/dsl/builders.ts::overlaySeq`

```text
/**
 * A seq's own stamped facts (metadata, …) ride along under `built`'s
 * freshly-computed shape — `buildSeq` constructs a new node and has no
 * access to the original's identity. `built` may be a collapsed singleton
 * survivor (buildSeq's own singleton collapse), so its own `type`/`members`
 * must win outright, not merely its stamped attrs: a plain
 * `{...content, ...built}` spread would leave `content`'s stale `members`
 * array on a survivor that has none. Shared by `buildOptional`,
 * `buildRepeatLike` and `flatten`'s SEQ case.
 */
```

### `packages/codegen/src/dsl/builders.ts::buildOptional`

```text
/**
 * optional(x) — the core formula, with no empty-match folding. This is what
 * `flatten` (compiler/flatten.ts) calls directly for every
 * OPTIONAL node in a raw rule tree: RenderRule production never strips a
 * bare literal to an empty seq (only `simplifyRules`'s own construction, via
 * `foldOptionalEmptyMatch` below, does that later).
 */
```


### `packages/codegen/src/dsl/builders.ts::foldOptionalEmptyMatch`

```text
/**
 * simplify's OWN `optional` construction (empty-match choice folding, see
 * `simplifyChoiceRule`) additionally strips an empty-seq or bare
 * (non-slot-promoted) string body to the empty-seq sentinel — a delimiter
 * that can't individually carry `multiplicity: 'optional'` collapses to
 * "renders nothing" instead. `attributeBuilder.optional` is this fold;
 * `flatten` never reaches it (it calls `buildOptional` directly).
 */
```

### `packages/codegen/src/dsl/builders.ts::repeatCombine`

```text
/**
 * repeat/repeat1's own multiplicity dominates an already-optional content
 * (`repeat1(optional(x))` keeps the repeat1's `nonEmptyArray` — the repeat
 * still guarantees at least one POSITION; the individual position may be
 * blank, tracked separately via `optionalElement`) rather than composing
 * through the lattice, which would degrade `nonEmptyArray` to `array`.
 */
```

### `packages/codegen/src/dsl/builders.ts::buildSeq`

```text
/**
 * seq(members, mult?) — receives already-rebuilt members. Splices a bare
 * nested seq (`isSpliceableBareSeq`: no fieldName/separator/multiplicity of
 * its own) into the member list first, at THIS level — since members arrive
 * bottom-up, a member that is itself a multi-level chain of bare seqs has
 * already flattened its own nested bare seqs one level down by the time its
 * own `buildSeq` call returned, so splicing here reaches every level: a
 * three-deep `seq(seq(seq(x,y),z),w)` fully flattens to `seq(x,y,z,w)`, one
 * splice decision per level, not one pass over the whole tree. The
 * at-least-one guarantee of a repeat1 belongs to the seq as a whole, not to
 * each individual member — enclosing multiplicity is pushed onto each
 * slot-bearing member through the lattice AFTER splicing (a bare,
 * non-slot-promoted string/pattern literal is a co-optional delimiter and
 * is skipped — the template emitter drops a literal stamped
 * `multiplicity: 'optional'`), and retained on the seq node itself only
 * when a bare literal member survives (the co-optional-delimiter guard:
 * literals can't individually carry the multiplicity, so the whole unit
 * needs it instead).
 */
```

#### body

```text
// The seq's own stamp: nonterminal iff any member is. Multiplicity pushed
// down from an enclosing optional/repeat lands on the members; their
// terminality does not change — `optional` reaches one level only.
```

### `packages/codegen/src/dsl/builders.ts::buildRepeatLike`

```text
/**
 * (Also the seq branch of `buildOptional`.) A wrapper directly around a seq is not a leaf spread: the enclosing
 * multiplicity must reach the seq's own slot-bearing members (Table 2's
 * per-field storage), so this re-enters `buildSeq` with the combined
 * multiplicity instead of stamping the seq node as if it were opaque.
 * The separator is read off the content: `repeat(x)` has no separator
 * parameter (the DSL has none), so link's lifted separator arrives already
 * stamped on the content by `flatten`, and a content that carries one from
 * an earlier collapse is the same case.
 */
```


### `packages/codegen/src/dsl/builders.ts::module`

```text
/**
 * dsl/builders.ts — the `RuleBuilder<P>` construction strategies. The
 * interface is the grammar DSL's own constructor vocabulary — `seq(...)`,
 * `choice(...)`, `optional(x)`, `repeat(x)`, `field(name, x)`,
 * `alias(x, target)`, `token(x)` / `token.immediate(x)`, `prec(n, x)` /
 * `prec.left` / `prec.right` / `prec.dynamic`, plus sittir's `variant` /
 * `group` and the leaf constructors — with only the types changed: every
 * constructor takes and returns `Rule<P>` for one phase `P`.
 * `structuralBuilder` is `RuleBuilder<'evaluate'>` (what the DSL evaluates
 * into: real wrapper nodes); `attributeBuilder` is `RuleBuilder<'normalize'>`
 * (pushes modifiers onto leaf attributes instead of wrapping). Every
 * `attributeBuilder` constructor is a pure function of its ALREADY-BUILT
 * `Rule<'normalize'>` input, looking exactly one level down — `flatten`
 * (compiler/flatten.ts) rebuilds a rule tree bottom-up by calling these
 * same methods, so this is the one place wrapper-vs-attribute construction
 * logic lives. Facts that are not DSL parameters — a rule's `id`, link's
 * lifted separator — are not constructor parameters either: `flatten`
 * applies identity uniformly after construction and stamps the separator
 * on the content `repeat` receives.
 *
 * dsl-side: the transforms that need a builder take a structural
 * `{ builder?: RuleBuilder<P> }` slice, never a compiler ctx, so this module
 * has no dsl -> compiler dependency and no compiler phase module needs to
 * import another compiler phase module for builder code.
 */
```

### `packages/codegen/src/dsl/builders.ts::PrecKind`

```text
// ---------------------------------------------------------------------------
// RuleBuilder — context-injected rule construction strategy
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/dsl/builders.ts::TokenBuilder`

```text
/** `token(x)` with `token.immediate(x)` hanging off it, exactly as the DSL
 *  spells them: a callable with a property, not two methods. */
```

### `packages/codegen/src/dsl/builders.ts::PrecBuilder`

```text
/** `prec(n, x)` with `prec.left` / `prec.right` / `prec.dynamic`, the DSL's
 *  spelling. On the normalize view the family is vocabulary only —
 *  precedence never reaches link (the compile boundary strips it), so
 *  `attributeBuilder.prec` stamps `prec` but nothing routes through it. */
```

#### body

```text
// `prec` / `prec.left` / `prec.right` take tree-sitter's named precedences
// (`prec.left('binary_relation', …)`) as well as numbers; only
// `prec.dynamic` is numeric.
```

### `packages/codegen/src/dsl/builders.ts::RuleBuilder`

```text
/**
 * One construction strategy, closed over one phase `P`: every constructor
 * takes `Rule<P>` children and returns a `Rule<P>` — a builder never sees
 * a value from another phase, so `attributeBuilder` receives already
 * attribute-built children (bottom-up) and `structuralBuilder` receives
 * evaluate-phase nodes. The identity constructors (variant, group, the
 * leaves) return their exact node type — both strategies build exactly
 * that node. `choice` and the content-consuming constructors return
 * `Rule<P>` at this level because a strategy may recognize on them; each
 * strategy's own interface (`StructuralBuilder`, `AttributeBuilder`)
 * states what it really returns. The content-consuming constructors
 * (optional, repeat, field, alias, token, prec) return `Rule<P>` because
 * the attribute strategy returns its content, of whatever type that was.
 * `alias`'s target is a string (anonymous alias) or a symbol (named), as
 * in tree-sitter — named-ness is derived from the target's type.
 */
```

### `packages/codegen/src/dsl/builders.ts::StructuralBuilder`

```text
/** `RuleBuilder<'evaluate'>` with the node each constructor actually
 *  builds: `seq` a SeqRule, `field` a FieldRule, `alias` an AliasRule,
 *  `repeat`/`repeat1` their repeat node, `token` a TokenRule and
 *  `token.immediate` tree-sitter's own IMMEDIATE_TOKEN shape (enrich runs
 *  before the fold and must see the same tag in both pipelines), the
 *  `prec` family its four PREC nodes. Where recognition can change the
 *  node the return is the honest union: `choice` is a ChoiceRule or the
 *  FieldRule an all-same-name-field choice collapses to; `optional` is an
 *  OptionalRule or the RepeatRule that `optional(repeat…)` becomes. Unions
 *  rather than input-conditional overloads: a wide `Rule<'evaluate'>`
 *  argument would pick the catch-all overload and lie about the result. */
```

### `packages/codegen/src/dsl/builders.ts::StructuralToken`

```text
/** `token` / `token.immediate` with their exact evaluate-phase node types. */
```

### `packages/codegen/src/dsl/builders.ts::StructuralPrec`

```text
/** `prec` / `prec.left` / `prec.right` / `prec.dynamic` with their exact
 *  evaluate-phase node types. */
```

### `packages/codegen/src/dsl/builders.ts::AttributeBuilder`

```text
/** `RuleBuilder<'normalize'>` with what the attribute strategy actually
 *  returns. An attribute constructor only stamps attributes on its input,
 *  so it is identity-preserving in the type: `field`, `token`,
 *  `token.immediate`, `prec`, and `alias` are all `<R>(…, content: R): R` —
 *  `alias` stamps `aliasedTo`/`aliasedToId` onto whatever `R` it's given,
 *  symbol, literal, or structural, uniformly, never changing its shape.
 *  The exceptions are exactly the recognitions, spelled as overloads on the
 *  INPUT type (never as a conditional return type — a deferred conditional
 *  cannot be checked against the implementation's literals and would force
 *  casts back into the builders): `optional`/`repeat`/`repeat1` re-enter
 *  `buildSeq` for a SEQ (→ `Rule`) and `optional` folds a bare literal to
 *  the empty seq (→ `Rule`), otherwise `R`; `choice` is always a
 *  ChoiceRule (no FIELD exists on this view). A catch-all `(Rule) → Rule`
 *  overload closes each set so a wide argument stays honest. */
```

### `packages/codegen/src/dsl/builders.ts::attributeBuilder`

```text
/**
 * Every attribute builder stamps the terminality of the node it builds —
 * `nonterminal` is the single slot switch, and this table is its one
 * source (`dsl/rule-patterns.ts::classifyByType` is the same table read
 * off the type tags):
 *   string / indent / dedent / newline → false
 *   pattern / symbol / supertype       → true
 *   choice                             → true, always: the choice node is the
 *                                        slot; its arms keep their own stamps
 *   seq                                → true iff any member is true
 *   repeat / repeat1                   → true
 *   optional                           → its content's (`buildOptional`), one
 *                                        level down — never into a seq's members
 *   field / alias / token / group / variant → the content's, untouched
 * The one stamp no builder can make is a symbol that references a literal
 * rule (it needs the rule map): `compiler/flatten.ts::stampTerminality`
 * flips that to false after the whole map is built.
 */
```

### `packages/codegen/src/dsl/builders.ts::AttributeToken`

```text
/** Identity-preserving `token` / `token.immediate`: a tokenized leaf is the
 *  same leaf with `tokenized` (and `immediate`) stamped. */
```

### `packages/codegen/src/dsl/builders.ts::AttributePrec`

```text
/** Identity-preserving `prec` family: the input with `prec` stamped. */
```

### `packages/codegen/src/dsl/builders.ts::attributeOptional`

```text
/** The overload set is the type-level statement of `foldOptionalEmptyMatch`
 *  + `buildOptional`: identity for anything that is not a SEQ or a bare
 *  literal. Declared as functions (not arrows in the object literal)
 *  because an arrow cannot be contextually typed against an overloaded
 *  property; `attributeRepeat`, `attributeRepeat1`, `attributeField` and
 *  `attributeAlias` are the same shape. */
```

### `packages/codegen/src/dsl/builders.ts::structuralBuilder`

Each method builds the node tree-sitter's own DSL builds for the same call:
`seq` and `choice` keep every member, a single one included; `optional`,
`repeat`, `repeat1` and `field` wrap their content as given; `token` carries
no `immediate` flag and `token.immediate` builds its own `IMMEDIATE_TOKEN`
node. Nothing collapses at construction, so enrich and wire — which run
under both runtimes — read the same shape tree-sitter reads. The canonical
shape the compiler phases read is produced once, at the compile boundary,
by `compiler/canonical-rules.ts::canonicalRuleTree`. Evaluate's DSL wrappers
only coerce their inputs before delegating here; the one exception is
`choice(x, blank())`, which builds `optional(x)` (the same language, and the
one representation difference `rulesEqual` treats as equal).

### `packages/codegen/src/dsl/builders.ts::structuralBuilder.prec`

```text
// The evaluate-only PREC family collapses to four distinct type tags —
// structuralBuilder mirrors the runtime's own `prec`/`prec.left`/
// `prec.right`/`prec.dynamic` shape (grammar-shapes/grammar-json.ts).
```

### `packages/codegen/src/dsl/builders.ts::attributeBuilder.alias`

```text
// The one expression for any content: `{...content, aliasedTo: target.name,
// aliasedToId: target.kindId, inline: false}` — an alias never changes
// terminality, with one exception: a literal aliased to a named symbol is a
// slot (`nonterminal: true`), because the parser produces a named node for
// it. `name`/
// `kindId` on `content` stay the SOURCE (storage) kind; `aliasedTo` is the
// alias TARGET (the parse kind). No other branching on content shape — a
// symbol or any other built rule takes the same stamp uniformly.
```

### `packages/codegen/src/dsl/builders.ts::structuralBuilder.alias`

```text
// The tree-sitter ALIAS wrapper: `content` unchanged except a bare SYMBOL
// content is stamped `inline: false` (an alias confers a real visible CST
// kind, so its wrapped reference must materialize rather than fold away —
// link's `stampParserVisibility` forces the same stamp on any symbol it finds
// under an ALIAS built some other way). Evaluate never
// mints `aliasedTo`/`aliasedToId` here; those are wrapper-deletion facts
// (`attributeAlias`), stamped once the ALIAS wrapper itself is consumed.
```

### `packages/codegen/src/dsl/rule-metadata.ts::module`

```text
/**
 * dsl/rule-metadata.ts — the REAL shape behind `RuleBase.metadata`'s opaque
 * `RuleMetadata` brand (types/rule-metadata-brand.ts), plus its construct/read
 * accessors.
 *
 * Mirrors the two-seam split already established by
 * `compiler/opaque-facts.ts` for slot-level facts: WRITING is unrestricted
 * (`makeRuleMetadata` — any phase may record a provenance fact; recording is
 * not the same as branching on it), READING the real shape back
 * (`readRuleMetadata`, `RuleMetadataShape`) is restricted to:
 *   - `dsl/enrich.ts`
 *   - `dsl/wire/*.ts` (including wire's transform machinery, e.g.
 *     `dsl/transform/transform-path.ts`'s `symbolSource`/`aliasSource`
 *     descent keying)
 *   - diagnostics-emission code (e.g. `packages/tools/src/validate/*`,
 *     node-model serialization in `emitters/node-model.ts`)
 *
 * Everything else — compiler phases (`compiler/*.ts`) and emitters that drive
 * codegen DECISIONS (as opposed to serializing a diagnostic dump) — must treat
 * `RuleMetadata` as opaque: construct-and-forget or blind-carry only, never
 * call `readRuleMetadata` to branch. This is enforced by
 * `dsl/__tests__/rule-metadata-layering.test.ts` (see that file's header for
 * the mechanism).
 *
 * The compiler must neither read a provenance tag NOR reconstruct
 * authorship STRUCTURALLY. A fact a later phase decides on travels as
 * return-value dataflow or a carried record (e.g. `compiler/link.ts`'s
 * `classifyHiddenRule` / `classifyHiddenChoiceRule`, and the
 * automatic-variant record link's `definedByOf` reads), never as a tag a
 * later phase re-reads.
 *
 * Layering: `types/rule-metadata-brand.ts` (which `types/` CAN own, since it
 * has no dsl-facing dependency) declares the opaque brand type `RuleMetadata`.
 * This module imports that brand and casts through it internally — the only
 * place in the codebase allowed to do so.
 */
```

### `packages/codegen/src/dsl/authoring-globals.d.ts::module`

```text
// Sittir-owned authoring type surface for grammar.sittir.ts.
//
// These ambient `declare global` signatures type the tree-sitter-INJECTED DSL
// globals (`seq`/`choice`/`field`/…) over the sittir-owned `AuthoringRule`
// vocabulary (grammar-shapes rules + bare literals), so authoring in grammar.sittir.ts
// composes into the recursive rule types and gets IntelliSense.
//
// Why our own `AuthoringRule` and not tree-sitter's `RuleOrLiteral`: our rule
// shapes are READONLY tuples (needed for the `as const` emit + path indexing),
// which are NOT assignable to tree-sitter's MUTABLE `Rule`. Declaring the params
// over `AuthoringRule` lets our rules compose into each other (the mismatch that
// otherwise breaks `seq(choice(...))`). These merge with tree-sitter's ambient
// `declare function seq` as overloads; ours matches the grammar-shapes args.
// Scoped to overrides via tsconfig.grammar-sittir.json; codegen internals untouched.
//
// The declared set mirrors EXACTLY the runtime globals sittir injects
// (compiler/evaluate.ts saveAndInjectDslGlobals): grammar, seq, choice,
// optional, repeat, repeat1, sym, string, field, token, prec, alias, blank.
// Do not declare a global here without a runtime counterpart there — a
// bare-literal already types as `StringRule<S>` via `ToGrammarRule`, so no
// `str()`/`pattern()` wrappers exist (or are needed) at runtime.
```

```text
/** Runtime-injected `string()` literal wrapper (see saveAndInjectDslGlobals). */
```

### `packages/codegen/src/dsl/authoring-globals.d.ts::token`

```text
// `token` / `prec` are callable VALUES with method properties, so they are
// declared `const` with per-call-signature generics (an `interface` here
// would declare a type, not the global value, and a generic param on the
// container would make bare `token(...)` uninstantiable).
```

### `packages/codegen/src/dsl/rule-walker.ts::module`

```text
/**
 * dsl/rule-walker.ts — RuleWalker<R>: the one traversal engine.
 *
 * One canonical child-edge relation (`childrenOf`) + thin primitives over it.
 * The walker owns RECURSION, never DISPATCH: call sites keep exhaustive
 * `switch (rule.type)` arms (feedback_rule_type_discrimination).
 * Layering mirrors RuleBuilder: dsl-side class; compiler's BaseCtx binds an
 * instance over its rules map (+ diagnostics).
 * Spec: docs/superpowers/specs/2026-07-01-r12-rulewalker-design.md
 */
```

### `packages/codegen/src/dsl/rule-walker.ts::RuleWalker.diagnostics`

```text
/** Sink for future diagnostic-emitting walks (slot-grouping family). Public
	 *  readonly (not #private) — nothing reads it yet; a private field would
	 *  trip the unused-member lint. */
```

### `packages/codegen/src/dsl/rule-attrs.ts::module`

```text
/**
 * compiler/rule-attrs.ts — shared attr-preservation helpers.
 *
 * `withAttrsFrom` is used by every collapse site that discards a structural
 * wrapper (seq / choice) in favour of a single survivor. Originally local to
 * simplify.ts; it lives here so normalize.ts's `collapseWrappers` and
 * simplify.ts's `canonicalizeSeqOfLeaves` use the SAME implementation, and
 * future collapse sites can't drift apart. (`combineMultiplicity`, its usual
 * companion at those sites, lives in `dsl/rule-transforms.ts`.)
 */
```

### `packages/codegen/src/dsl/rule-patterns.ts::ruleKey`

```text
/**
 * The canonical structural-identity key for rule shapes.
 *
 * `ruleKey` gives every distinguishable rule shape a stable string, so a
 * many-way "have I already seen a rule structurally identical to this one"
 * lookup is a single `Map<string, ...>` pass (O(n)) instead of a pairwise
 * scan against every candidate seen so far (O(n^2)). `rule-patterns.ts`'s
 * `rulesEqual` is defined in terms of it: `ruleKey(a) === ruleKey(b)` iff
 * `rulesEqual(a, b)`. `enrich.ts`'s group/clause-hoist dedupe
 * (`visibleGroupSynthName`/`clauseHoistSynthName`) key their dedupe maps
 * with it too, in place of a former standalone `canonicalStringifyClause`.
 *
 * Deliberately minimal traversal: `type`, `name`, `value`, `named`,
 * `separator`, and children (`.members` or `.content`, whichever is present)
 * are the only fields read. DSL-layer rules are materialized by two
 * different runtimes (sittir's own `evaluate()`, tree-sitter's CLI) that
 * agree on these but aren't guaranteed to agree on every shape a field can
 * take, or on which extra bookkeeping fields get stamped onto a rule object
 * along the way — e.g. `.separator` is a plain string pre-lift and a
 * `{value,trailing,leading}` fact post-lift for the exact same logical
 * rule; a raw string literal used directly inside `seq(...)`/`choice(...)`
 * is still a bare string (not yet coerced to a `STRING` rule node) at the
 * point enrich runs; and either runtime may stamp provenance fields (an
 * `id`, a `metadata` bag) the other never adds. Provenance stamps are what
 * broke group-dedupe before this key existed: hashing a rule by its whole
 * object (minus a hand-maintained exclusion list of known-bad fields) meant
 * every NEW provenance stamp added anywhere in the Rule shape
 * was a fresh way for the same logical body to hash differently under the
 * two runtimes, re-opening the exact bug — a rust `slice_pattern`/
 * `tuple_struct_pattern` shared group body minted as two silently-empty
 * phantom duplicates instead of one. Reading a small, fixed, INCLUSION list
 * of fields is immune to that failure mode by construction: an unlisted
 * field, however it got stamped or by whichever runtime, is never read, so
 * it can never affect the key.
 *
 * Only fields a shape's identity depends on are read — never the whole rule
 * object. `metadata`, `id`, `inline`, and other `RuleBase` bookkeeping are
 * diagnostic-only and must not affect whether two rules count as "the same"
 * (see `.claude/coding-standards.md` on metadata never driving behavior).
 *
 * `SYMBOL` has no `.content`/`.members` — it's a leaf keyed by `.name` alone,
 * never recursing into the rule it references, which is also what keeps
 * this cycle-safe on self-referential (recursive) grammar rules.
 */
```

The key also reads the DSL's representation pairs as one shape: every blank
(`isBlank`), `OPTIONAL(x)` and `CHOICE[x, blank]` (`optionalContentOf`), and
`IMMEDIATE_TOKEN(x)` and `TOKEN(x)` with `immediate: true`
(`isImmediateToken`). A `TOKEN` whose `immediate` is false or absent keys as a
plain token.

### `packages/codegen/src/dsl/shared.ts::baseRulesOf`

The rules a grammar object offers when it is used as a base: its `.rules`, through a `{ grammar }` wrapper or not. sittir's `grammar()` returns rules exactly as its DSL built them — canonicalization runs later, at the compile boundary — so enrich, wire and an extending `grammar()` read the same shapes under sittir's evaluation as under tree-sitter's.

### `packages/codegen/src/dsl/rule-transforms.ts::module`

```text
/**
 * dsl/rule-transforms.ts — shared, idempotent rule transforms and the
 * `RuleBuilder` construction strategy used across normalize/simplify.
 */
```

### `packages/codegen/src/dsl/rule-transforms.ts::LeafMultiplicity`

```text
// `'single'` is the canonical required-one value (rule.ts `Multiplicity`); a
// missing multiplicity defaults to it (`combineMultiplicity` null-coalesces).
```

### `packages/codegen/src/dsl/rule-transforms.ts::Mult`

```text
// ---------------------------------------------------------------------------
// List-fusion pass — fuse a separated-list's head + repeat occurrences into
// a single multi-valued slot.
//
// tree-sitter grammars author `sepBy1`/`commaSep1` lists in shapes that
// link's `liftSeq` does not always collapse — notably when a choice
// arm is an alias (`argument_list`) or the trailing separator lives in a
// choice (`pattern_list`). After wrapper-deletion those survive as a HEAD
// element (single) plus a REPEAT of the same element (array). Two idioms
// are recognized inside a `seq` (after recursing children):
//
//   A. adjacent `[E, E{array|nonEmptyArray, sep?}]` where the two elements are
//      structurally identical ignoring leaf attributes → fuse to the array E.
//   B. `[E, choice(sepString, E{array|nonEmptyArray, sep?})]` → fuse to the
//      array E, taking the choice's separator string as the trailing separator.
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/dsl/rule-transforms.ts::fuseAtNode`

```text
// consume the repeat member too
```

### `packages/codegen/src/dsl/rule-patterns.ts::module`

```text
/**
 * dsl/rule-patterns.ts — the catalog of rule-shape recognizers.
 *
 * Every shape a phase reasons about is a named function here, and nowhere
 * else: terminality (`classifyByType` / `isNonterminalRuleType`), enum and
 * spliceable-seq shapes, separated-list detection (`separatorOf`), group
 * classification (`isInlineSafe` / `isSupertypeLike` / `isPermutationChoice`
 * / `matchesEmpty`), and the self-referential chain fold. Recognizers
 * inspect and report; they never mutate. What a caller does with a
 * recognized shape is the caller's phase concern.
 *
 * Each recognizer looks one level down — at the node and the attributes its
 * children's builders already stamped — and returns the fact it recognizes,
 * or `undefined`/`false` when the shape is absent. A phase's builders are
 * the consumers; a pass that hand-rolls `type === … && members.length === n`
 * is re-deriving something that belongs here.
 *
 * **Runtime-agnostic by design.** DSL-layer code runs under two runtimes
 * (sittir, tree-sitter CLI) that agree on UPPERCASE discriminants; enrich in
 * particular sees both. The list and group recognizers therefore type their
 * input as `RuntimeRule` and compare tags through `typeEq`, while the
 * terminality and phase-typed predicates take the `Rule` union directly.
 *
 * **List shapes are pre-pushdown.** Separator/trailing shapes are
 * reconstructable only while the wrappers (`optional`/`repeat`/`repeat1`/
 * `field`) are intact — enrich/wire/evaluate/link — not after
 * wrapper-deletion has flattened them to `multiplicity`/`separator`
 * attributes.
 */
```

### `packages/codegen/src/dsl/rule-patterns.ts::SymbolSource`

The one interface every phase asks about a grammar's symbols, beside the rule bodies and external names: whether the parser issues a symbol for a name at all (`hasSymbol`), issues it as a terminal (`isTerminal`), inlines it (`isInlined`), hides it (`isHidden`: a hidden name the parser does not show under a default alias), dispatches on it as a supertype (`isSupertype`), and issues it as a visible external token (`isVisibleExternal`). Every source answers from kind-catalog rows (`symbol-table.ts::catalogSymbolSource`); only the rows differ by phase. While grammar.js evaluates no parser.c exists, so enrich and its separator detection ask the predicted catalog of the rules at hand (`symbol-table.ts::predictedSymbolSourceOf`), the grammar diagnostics ask the catalog evaluate predicted (`RawGrammar.predictedKinds`), and link asks the same predicted catalog after asserting it against the parser's (`symbol-table.ts::assertPredictedKindEntries`).

### `packages/codegen/src/dsl/rule-patterns.ts::SymbolFacts`

The declared grammar facts a `SymbolSource` is built from: rule bodies, and the `externals`, `inline`, `supertypes`, `extras` and `visibleExternals` names.

### `packages/codegen/src/dsl/rule-patterns.ts::RuleListEntry`

One entry of a grammar's `extras` or `externals` list, in grammar.json's own shape: a SYMBOL (a rule or scanner token by name), a STRING (a literal text), or a PATTERN (a regex source). Externals hold SYMBOL and STRING entries; extras hold all three. The lists stay rule lists from evaluate to the serialized node model, in declaration order, so every reader sees each entry's rule type rather than a name-or-text string.

### `packages/codegen/src/dsl/rule-patterns.ts::ruleListEntryOf`

The `RuleListEntry` a grammar's list value stands for: a string is a STRING, a RegExp a PATTERN (its source), and a SYMBOL, STRING or PATTERN rule object is copied to grammar.json's shape without any other property. Anything else is `undefined`, for the caller to reject with its own list's name. The one reader of list entries, shared by evaluate's list callbacks and enrich's list harvest.

### `packages/codegen/src/dsl/rule-patterns.ts::RuleListParts`

The three views of a rule list that `ruleListParts` returns: `names` (SYMBOL entries), `literals` (STRING values) and `patterns` (PATTERN sources), each in list order.

### `packages/codegen/src/dsl/rule-patterns.ts::ruleListParts`

The one derivation of names, literals and patterns from an `extras` or `externals` rule list. A consumer that asks by name (prune roots, synthetic external rules, renames, inline-at-reference, trivia) reads `names`; nothing stores a split copy of the list.

### `packages/codegen/src/dsl/rule-patterns.ts::nodelessExtrasRun`

The anchored RegExp matching a whole run of a grammar's node-less extras — the extras that lex as nothing: one or more of its PATTERN sources, escaped STRING literals and SYMBOL extras naming a parser-hidden rule (`isParserHiddenName`), resolved through their rules (`ruleToRegexSource`), in any order. A visible SYMBOL extra (a comment) lexes as a node, so it is a trivia kind and never part of the run, whatever its rule. A symbol whose rule no single RegExp expresses (one that references another symbol) contributes nothing; `ruleToRegexSource` never follows a symbol, so resolution cannot cycle. Whitespace is exactly text this run matches: enrich admits the whitespace members by it (`admitsWhitespaceMember`), and a loose trivia string is read as whitespace by it (`whitespaceTrivia`). A grammar with no lexical extras has no run; an extra that does not compile as a JavaScript RegExp is an error, not a silent miss.

Its rule map is any phase's (`AnyRule`): enrich calls it on the DSL rules, and link calls it once on the evaluated grammar's rules and stamps the result as `nodelessExtrasRun` on the linked grammar, which normalize and assemble carry to the `NodeMap`. Rules past link are simplified (repeats folded into multiplicity), which `ruleToRegexSource` does not read, so no later phase re-derives the run.

### `packages/codegen/src/dsl/enrich.ts::effectiveExtras`

The extras the final grammar lexes: the upstream list, or what the config's `extras:` callback returns when handed a symbol `$` and that list as `previous`, the call tree-sitter makes. Enrich reads every extras fact from it (the predicted symbol source, the whitespace vocabulary), so a config that adds or clears whitespace extras changes the vocabulary with the parser.

### `packages/codegen/src/dsl/enrich.ts::symbolDollar`

The `$` enrich hands a grammar list callback: any name reads as a SYMBOL rule of that name.

### `packages/codegen/src/dsl/enrich.ts::ruleListEntries`

A list of `extras` or `externals` values as rule-list entries (`ruleListEntryOf`); an entry that is not a SYMBOL, STRING or PATTERN rule is an error naming the list.

### `packages/codegen/src/dsl/whitespace.ts::WhitespaceBody`

The render body of a whitespace member: a STRING, whose value is the member's text or, for `_indent`/`_dedent`, the writer's depth mark (`INDENT_TEXT`/`DEDENT_TEXT`), the same body the `indent()`/`dedent()` builders make.

### `packages/codegen/src/dsl/whitespace.ts::TIGHT_MEMBER`

`_tight`, the whitespace member that renders nothing. Every grammar admits it, since joining two tokens with nothing between them needs no lexing; it is the default arm of a grammar that admits no space (`defaultWhitespaceKindOf`).

### `packages/codegen/src/dsl/whitespace.ts::SPACE_MEMBER`

`_space`, the whitespace member that renders one space, and the default arm of every grammar that admits it.

### `packages/codegen/src/dsl/whitespace.ts::TAB_MEMBER`

`_tab`, the whitespace member that renders one tab. Admitted where the grammar's extras accept a tab, like any member (`admitsWhitespaceMember`).

### `packages/codegen/src/dsl/whitespace.ts::INDENT_MEMBERS`

The members an indentation unit is made of: `_space` and `_tab`. The characters a render's `indent` may use are the texts of those of them the grammar admits (`indentChars`), so the unit is always text the grammar lexes as whitespace.

### `packages/codegen/src/dsl/whitespace.ts::NEWLINE_MEMBER`

`_newline`, the whitespace member that renders one line break. It is the stated default of a seam that admits only line breaks: the after edge of a line-terminated trivia kind (`lineBreakingKinds`), and the one member that owns the line-ending arms (`NEWLINE_ARMS`).

### `packages/codegen/src/dsl/whitespace.ts::NEWLINE_ARMS`

The spellings of one line break: `'\n'`, `'\r\n'`, `'\r'`, in that order. They are declared once, as the arms of `_newline`'s choice; the line-ending option's type and its validation read this constant, so no other place lists them.

### `packages/codegen/src/dsl/whitespace.ts::MemberRule`

How a whitespace member is defined: a string (its text), a choice over strings with the preferred arm named (`_newline`), or a sequence of references to other members (`_blankline` and `_double_blankline` reference `_newline`, so they declare no arms of their own and take its preference).

### `packages/codegen/src/dsl/whitespace.ts::WHITESPACE_MEMBERS`

Every whitespace member sittir can mint, in the order `_layout` lists them: `_tight`, `_space`, `_tab`, `_newline`, `_blankline`, `_double_blankline`, `_indent`, `_dedent`, each with its `rule` (`MemberRule`). The text everything downstream sees is the rule's canonical text (`canonicalText`).

### `packages/codegen/src/dsl/whitespace.ts::whitespaceMemberRule`

A member's `MemberRule` by name; throws, naming it, for a name outside the vocabulary.

### `packages/codegen/src/dsl/whitespace.ts::canonicalText`

A member's text in the one internal spelling: a string rule is its value, a choice is its preferred arm, a sequence is its references' canonical texts joined, so a line break is always `'\n'`. The emitted body, the admission test and the node map all read it; a member outside the vocabulary throws.

### `packages/codegen/src/dsl/whitespace.ts::bodyOf`

A member's `WhitespaceBody`: the canonical text as a fixed string, which is what `visibleExternals:` receives.

### `packages/codegen/src/dsl/whitespace.ts::admittedTextOf`

The text a member must lex as extras for the grammar to admit it: its own text, except that `_indent` and `_dedent` ride on the horizontal space an indented line starts with, so they are admitted exactly when a space is.

### `packages/codegen/src/dsl/whitespace.ts::admitsWhitespaceMember`

The one admission law for a whitespace member: `_tight` always, any other member when the extras run matches its admitted text (`admittedTextOf`). Enrich filters the members with it, and assemble checks the final `_layout` against the link-stamped run with it (`assertWhitespaceAdmitted`), so the two can only disagree when the extras themselves do.

### `packages/codegen/src/dsl/whitespace.ts::EnrichedWhitespace`

What `enrichWhitespace` derives: the admitted `members` in `WHITESPACE_MEMBERS` order, the `addedExternals` the upstream grammar does not already declare, the render `bodies` wire makes visible, the `_layout` rule (a CHOICE of the members), and the upstream `collisions`.

### `packages/codegen/src/dsl/whitespace.ts::WhitespaceCollision`

A name enrich mints for the whitespace vocabulary that the grammar also defines, with where the definition sits: `upstream` (a rule of the upstream grammar) or `visibleExternals` (a key the grammar's config declares). Enrich and wire stamp these where they find them; evaluate carries them to the compile gate as `whitespace-mint-collision` records.

### `packages/codegen/src/dsl/whitespace.ts::enrichWhitespace`

Derives a grammar's whitespace vocabulary from its facts: a member is admitted when the grammar's extras run (`nodelessExtrasRun`) matches its admitted text (`admittedTextOf`), and `_tight` always is. A member's body is its canonical text (`canonicalText`), derived from its rule. A text member whose name the upstream grammar already declares as an external is reused rather than added, keeping its minted body (python's scanned `_newline`). A depth member (`_indent`, `_dedent`) whose name is an upstream external is left out entirely, neither minted nor a member: a scanned depth token renders through its role, not a fixed body, so python's depth tokens come from its upstream roles, not `_layout`. The enriched stage, evaluated without the config's roles, then agrees with the final evaluation. Enrich calls it once per grammar, so no grammar authors its whitespace externals, supertype or vocabulary rule. Given the upstream rules, it reports as `collisions` each minted name (`_layout` and every added member) that an upstream rule defines differently; enrich then drops that rule so the minted definition stands. An upstream rule equal to the minted one is enrich's own output and passes through, which keeps enrich idempotent.

### `packages/codegen/src/dsl/rule-patterns.ts::symbolFactsOf`

Reads a grammar's `SymbolFacts`, as sets, off anything shaped like an evaluated grammar; its `externals` and `extras` are the SYMBOL names of the grammar's rule lists (`ruleListParts`), and `visibleExternals` is the keys of the grammar's declared record (none when it declares none).

### `packages/codegen/src/dsl/rule-patterns.ts::InlineAtReferenceCtx`

What `inlinesAtReference` reads: one `SymbolSource`, the grammar's `inline:` names, and the per-name self-reference answers already computed (`selfReferencing`, filled by `isSelfReferencing`).

### `packages/codegen/src/dsl/rule-patterns.ts::inlinesAtReference`

The one decision whether a reference to `name` is spliced (`inline: true`), meaning the referenced rule has no node of its own in sittir's model of the tree. It asks only the `SymbolSource`, so link's stamp (over the catalog) and any check over the evaluated rules (over the prediction) run the same predicate. It follows the parser: a parser-hidden kind splices and a visible one does not; the grammar's `inline:` array splices whatever the spelling; and a hidden terminal the model can represent (one with a rule body, or a visible external) keeps its own leaf kind, since the parser gives it a token of its own. A hidden external scanner token with neither (rust `_error_sentinel`, typescript `__error_recovery`, python `_indent`/`_dedent`) has no text to model, so a reference to it splices.

Three structural boundaries override the parser fact, each derived from the rule, never from the name:

- a supertype never splices, even when it is also in `inline:`: it is a dispatch over its members, and splicing it would leave its slot with no kind to dispatch on;
- a rule that references itself (`isSelfReferencing`) never splices: splicing a cycle has no finite result, and tree-sitter keeps the recursion as nested hidden nodes (flattening a hidden left-recursive rule into a repeat, as tree-sitter does, is not modelled yet);
- a hidden rule whose body is only anonymous tokens (`isLiteralChoiceContent`: one STRING, or a choice of STRINGs) stays a leaf kind. This is the one boundary that is not a parser fact: the parser splices such a nonterminal, but sittir models it as a leaf so its members keep their enum's identity and seams (`enumKind`).

### `packages/codegen/src/dsl/rule-patterns.ts::isSelfReferencing`

Whether a rule body contains a SYMBOL reference to its own name (direct self-reference only; references are not followed), remembered per name in `InlineAtReferenceCtx.selfReferencing`, so a body is walked once however many references reach it.

### `packages/codegen/src/dsl/rule-patterns.ts::choiceArmsOf`

The arms of a choice, nested choices flattened, or `undefined` for content
that is not a choice.

### `packages/codegen/src/dsl/rule-patterns.ts::terminalContentOf`

Whether content the parser sees at a position is a terminal: a symbol by
the caller's `isTerminalSymbol`, a string, pattern or token, or a choice
whose every arm is terminal. The symbol test is a parameter so the one body
walk serves an inlined name in `symbol-table.ts::catalogSymbolSource`, whose
other names answer from their row's `terminal` fact.

### `packages/codegen/src/dsl/rule-patterns.ts::lexesAsOneToken`

Whether a rule body is one token as tree-sitter's extract_tokens sees it: a
bare string or pattern, or anything under token / immediate-token, through
precedence wrappers. It is the shape question alone. Whether the *rule* becomes a terminal
also depends on grammar-wide facts (how often the token is used, externals,
inline), which only the predicted symbol table answers
(`symbol-table.ts::predictSymbolTable`). A minted rule whose
body lexes as one token is a subtype leaf, not a hoisted group
(`transform.ts::hoistedUnlessToken`).

### `packages/codegen/src/dsl/rule-patterns.ts::TokenShape`

The structural view of a rule `extractedToken` and `lexesAsOneToken` read:
a type, a value and a content, so runtime and phase rules both fit.

### `packages/codegen/src/dsl/rule-patterns.ts::extractedToken`

```text
The token a rule body reduces to, if any: token / immediate-token / precedence wrappers merged into one key, over a
STRING or PATTERN. `anonymous` when the inner content is a plain string. Undefined for a precedence-only chain or any
non-token body.
```

### `packages/codegen/src/dsl/rule-patterns.ts::classifyByType`

```text
// ---------------------------------------------------------------------------
// Terminality — the per-rule-type decision table and the predicate over it
// ---------------------------------------------------------------------------
```

#### body

```text
/* No separate ENUM case: enum-shaped ChoiceRules are classified under
			   the CHOICE arm below. */
```

#### body

```text
/* Unconditionally nonterminal: a choice is a single union slot
			   (literal-only = enum); a repeat captures a variable-length sequence
			   (array slot) even when its content is terminal. */
```

#### body

```text
/* No TERMINAL case: the Rule<'evaluate'> union has no TerminalRule
		   variant. */
```

#### body

```text
/* PREC family is stripped at the compile boundary
		   (`canonicalRuleTree`) before this runs, so these cases are
		   unreachable at runtime. Transparent single-child wrapper,
		   same as TOKEN/FIELD above. String literals (not rule-types.ts
		   consts): that module is deprecated for new imports — see its
		   header. */
```

#### body

```text
/* IMMEDIATE_TOKEN is folded into TOKEN+immediate at the compile
		   boundary (`canonicalRuleTree`) before this runs — unreachable at
		   runtime, transparent single-child wrapper like TOKEN. */
```

### `packages/codegen/src/dsl/rule-patterns.ts::collectFixedLiteral`

```text
/**
 * The single derivation of a literal-only body's rendered text — the
 * fixed-literal join every literal-text consumer (`isAllTextRender`'s
 * SEQ/CHOICE fold in `simplifySeqRule`, `AssembledPattern.fixedLiteralText`,
 * `flatten.ts::stampTerminality`'s "is this rule a literal" test, the
 * template emitter's fixed-text render of a `nonterminal: false` reference)
 * goes through rather than re-walking the tree itself.
 *
 * Walks `rule` collecting leaf `string` values and returns the single
 * distinct string every parse produces, or `undefined` the moment a
 * content-bearing symbol or a multi-value divergence is found. Undefined
 * for a nonterminal rule, an array-multiplicity rule (`array` /
 * `nonEmptyArray` — repetition has no single realisation), and an
 * `optional`-multiplicity rule when `ctx.deterministic` is set (two
 * realisations: present or absent). Blanks (an empty `choice` or `seq`)
 * are skipped in non-deterministic mode — they contribute no text and
 * represent the "omit" arm of an optional — but bail the whole CHOICE to
 * `undefined` in deterministic mode, where a blank arm IS a second
 * realisation.
 *
 * A CHOICE is fixed only when every non-blank arm resolves to the SAME
 * string. A SEQ with exactly one non-blank member recurses directly on it
 * (no join needed); with more than one, every member is walked in
 * `deterministic` mode (an optional member or a blank-arm CHOICE inside a
 * seq means divergent realisations, not a fixed one) and the results are
 * joined with `ctx.joiner` — e.g. python's `_not_in` = `seq('not', 'in')`,
 * aliased to `'not in'`, IS a fixed realisation: every parse produces
 * exactly the same token sequence.
 */
```

The SEQ join inserts a space only where the lexer needs one: when the last character of the left part and the first of the right are both word characters under `wordCharClass`. A punctuation pair joins tight (`seq('(', ')')` is `()`, not `( )`), a word pair keeps its space (`raw const`), and a `tokenized` context means the parts are one lexeme, so no seam exists at all. The joiner is the same question the render sink answers at write time; there is no fixed joiner string.

`ctx.wordMatcher` is the grammar's Link-pinned word matcher; every caller
that derives a literal for a grammar (flatten's terminality stamp, simplify's
SEQ collapse, the assembled leaf's `fixedLiteralText`) supplies it, and only
the unit tests over synthetic rules take the `\w` fallback.

### `packages/codegen/src/dsl/rule-patterns.ts::composeTokenText`

The whole-text regex source of a token, composed from its interior rule: a string is escaped (regex syntax characters, and control characters as the letter escape where one exists (`\n \r \t \v \f`, and `\0` unless a digit follows) or `\xHH` otherwise), a pattern is kept verbatim, a sequence concatenates, a choice alternates (a blank arm makes the group optional), `optional`, `repeat` and `repeat1` become `?`, `*` and `+` groups, and `token`, `field` and `alias` are transparent. A symbol is followed through `lookup` (an alias of another lexical kind) with a cycle guard. Anything else, or a pattern that is empty (a token an external scanner produces), makes the whole composition `undefined`: no regex is derived rather than a partial one. The composer is the one rule for a token's interior; the emitter consumes its result through `AssembledPattern.textPattern` and never re-derives it.

### `packages/codegen/src/dsl/rule-patterns.ts::FixedLiteralCtx`

```text
/**
 * @param joiner - separator used when concatenating a multi-member SEQ's
 *   literals: a single space at grammar level (canonical token
 *   separation), an empty string inside a `tokenized` subtree (contiguous
 *   by construction — a `tokenized` rule forces this joiner for its own
 *   recursive calls).
 * @param deterministic - when true, any optionality (`multiplicity:
 *   'optional'`, a blank CHOICE arm) makes the subtree non-fixed. Set for
 *   the members of a multi-member SEQ, where "same text OR absent" is no
 *   longer a single fixed realisation.
 */
```

### `packages/codegen/src/dsl/rule-patterns.ts::ruleChildren`

#### body

```text
/* Narrow via AnyRule, cast back — children share the parent's phase by
	   construction. Exhaustive over every AnyRule variant (no default
	   fallthrough) so a newly added rule type fails compilation here instead
	   of silently contributing no children — see classifyByType's own
	   exhaustive switch for the sibling convention. */
```

#### body

```text
/* PREC family: stripped before this runs (see classifyByType's PREC
		   comment) — unreachable at runtime, transparent single-child
		   wrapper for exhaustiveness. */
```

#### body

```text
/* No TERMINAL case: the Rule<'evaluate'> union has no TerminalRule
			   variant. */
```

#### body

```text
/* Unconditionally nonterminal per classifyByType — these children
			   never actually feed a classification decision — but returned for
			   real (not `[]`) so `ruleChildren` stays structurally honest about
			   what each rule type's children are. */
```

#### body

```text
/* Genuinely childless: SYMBOL/PATTERN/STRING/INDENT/DEDENT/NEWLINE are
			   leaves; SUPERTYPE's `subtypes` are kind-name strings, not
			   Rule<Phase> nodes. */
```

### `packages/codegen/src/dsl/rule-patterns.ts::isEnumChoiceRule`

```text
// ---------------------------------------------------------------------------
// Rule-shape predicates on the phase-typed `Rule` union
// ---------------------------------------------------------------------------
```

#### body

```text
// STRING members and literal-carrying link SYMBOLs (`isLinkSymbol`,
// canonicalized operators AND aliased fixed-text externals like
// `automatic_semicolon`) are both terminal-valued — `literalTextOf`
// serves both shapes uniformly downstream.
```

### `packages/codegen/src/dsl/rule-patterns.ts::isSpliceableBareSeq`

```text
/**
 * A nested `seq` member carrying none of its own `fieldName`/`separator`/
 * `multiplicity` is structurally redundant — its members are siblings of
 * whatever else shares the parent seq, not a cardinality-carrying unit — and
 * splices (flattens) into the parent rather than surviving as its own
 * nesting level. `seq` applies it at construction (simplify's `buildSeq`), so
 * every derivation of "does this nested seq need to stay nested" agrees.
 */
```

### `packages/codegen/src/dsl/rule-patterns.ts::separatorOf`

Recognizes a two-member `seq` as one separated-list step: `seq(SEP, X)` (leading) or `seq(X, SEP)` (trailing). A separator is a token: a literal, or an arm choice (`isArmChoice`; an optional literal is not a separator) whose every arm lexes as one token by `terminalContentOf` over the grammar's source symbols — literals, patterns, token bodies, externals, and inlined rules whose own bodies are tokens (typescript's `_semicolon`, a choice of the external `_automatic_semicolon` and `;`). The full choice is kept, never narrowed to one literal arm; `separatorArmKinds` consumes the same shape.

A choice of nonterminals is content, not a separator: regex's `term` is `seq(choice(<atoms>), optional(<quantifier>))`, an element followed by its quantifier. An optional token (`choice(tok, blank)`) is not one either — it may be absent, so it is a per-element flank.

Terminal-ness is the `SymbolSource`'s `isTerminal`, a predicted kind catalog's `terminal` fact in both enrich (over the rules at hand) and link (`LinkCtx.sourceSymbols`, over the catalog evaluate predicted), so the test is the same in both.

### `packages/codegen/src/dsl/rule-patterns.ts::permutationAtomKey`

```text
/**
 * Identity key for one permutation-arm step: a word-shaped keyword literal
 * (raw, `_kw_*`-promoted, or marker-fielded — all key to the literal) or a
 * symbol ref (keyed by name). Optionality and field wrappers are peeled —
 * they are the permutation delta, not the atom identity. Anything else
 * (repeat, nested seq, non-optional choice) disqualifies the arm.
 */
```

#### body

```text
// Keep the OUTERMOST authored field name — it is slot identity;
// two arms fielding the same symbol under different names are
// distinct slots, not a permutation.
```

#### body

```text
/* A generated `<literal>` field is the keyword-promotion spelling
	   of the same literal — collapse it so a raw keyword in one arm keys
	   equal to its promoted sibling. Any other field name is authored slot
	   identity and stays in the key. */
```

### `packages/codegen/src/dsl/rule-patterns.ts::resolveRuleLiteral`

```text
/** Literal text of a keyword-shaped rule body (STRING, possibly TOKEN- or
 *  prec-wrapped), else null. */
```

### `packages/codegen/src/dsl/rule-patterns.ts::isParserHiddenName`

```text
/**
 * The parser's own hiddenness rule: a symbol name beginning with `_`. The
 * DSL-phase answer to "the parser hides this symbol", used where no parser
 * catalog exists yet (grammar.js runs before parser.c is generated):
 * `selfReferentialFoldOf` reads it on a self-reference's name, and
 * `parserHiddenOf` falls back to it for a name with no catalog row. Distinct from
 * `RuleBase.hidden` (sittir's own PUBLISHED visibility fact, stamped by
 * link from the parser catalog): a
 * symbol occurrence is parser-hidden purely by its name, independent of
 * whatever visibility sittir later publishes the rule under.
 */
```

### `packages/codegen/src/dsl/rule-patterns.ts::selfReferentialFoldOf`

```text
// ---------------------------------------------------------------------------
// Self-referential chain fold
// ---------------------------------------------------------------------------
```

```text
/**
 * Tree-sitter's prec.left self-referential-choice flattening: a CHOICE
 * rule whose arms are all 3-member SEQs
 * `[base, STRING(separator), extension]` with the SAME separator literal
 * and the same fielding at each position across every arm (both operands
 * fielded under one name pair, or unfielded), where at least one arm's base field is a bare (non-alias-wrapped)
 * SYMBOL reference to THIS rule's own name whose name is
 * `isParserHiddenName` — the PARSER's own hiddenness rule (leading `_`),
 * not `RuleBase.hidden` (sittir's published-visibility fact, stamped by
 * link from the parser catalog): tree-sitter
 * flattens an occurrence of a symbol whenever THAT occurrence's name is
 * hidden, regardless of whether sittir later publishes the target rule as
 * visible under an alias — an unaliased inner self-reference is still
 * flattened by the parser even when the rule it names is otherwise
 * published visibly elsewhere. Tree-sitter's LR table collapses the
 * recursion into ONE FLAT node at parse time: the base field stays
 * singular — only the true base operand carries it, since inner
 * recursive occurrences dissolve into siblings and the leftover separator
 * tokens are anonymous so the reader drops them — while the extension
 * field repeats once per additional chained operand. No wrapper shape and
 * no node-types.json entry can see this: the multiplicity is an emergent
 * property of LR precedence-climbing over a self-referential choice.
 * Confirmed case: rust's `_let_chain` (`a && b && c && d` parses as one
 * node with a single `left` and a repeated `right`).
 *
 * Only meaningful at the TOP of a named rule's own body: the self-reference
 * check requires the SYMBOL's name to equal the rule being processed, so a
 * nested CHOICE inside some OTHER rule's body can never coincidentally match.
 *
 * Field-agnostic because enrich asks before `patches:` fields exist: `wire()`
 * applies patches to the already-enriched rules, and enrich must not lift a
 * fold's arms into rules of their own — a fold is one flat node, not a
 * choice of forms — so the same predicate serves enrich (unfielded) and
 * flatten (fielded).
 */
```

```text
// self-ref on the extension side — bail, don't guess
```

### `packages/codegen/src/dsl/rule-patterns.ts::exclusiveFieldChoiceBranches`

```text
// ---------------------------------------------------------------------------
// Enrich-phase recognizers (raw DSL rule shapes, both runtime spellings)
// ---------------------------------------------------------------------------
```

```text
/** The branches of a choice whose every arm is a single, distinctly-named
 *  field — the shape that means "exactly one of these". Reached either
 *  directly or through a hidden rule, since such a choice is usually spelled
 *  as a helper (`_line_doc_comment_marker`) rather than inline.
 *
 *  Two arms sharing a field name are ONE slot with a union value, not a set
 *  of alternatives, so a repeated name declines. */
```

### `packages/codegen/src/dsl/rule-patterns.ts::separatedListElementName`

```text
/**
 * @internal — derive the element name a separated-list position exposes from
 * mint-time-visible facts ONLY (`type`/`name`/`members`/`content`), never the
 * per-pipeline decoration stamps (`id`/`metadata`) — the tree-sitter CLI
 * bundle and sittir's evaluate() must derive the SAME name for the same body.
 * A single symbol (or choice-of-one, or FIELD wrapper) names the element; a
 * multi-arm choice or compound seq has no single name (`null` — the caller
 * falls back to the `elements` basis).
 */
```

### `packages/codegen/src/dsl/rule-patterns.ts::SeparatedListBodyInfo.elementName`

```text
/** Element name per {@link separatedListElementName}; null for multi-arm/compound elements. */
```

### `packages/codegen/src/dsl/rule-patterns.ts::SeparatedListBodyInfo.flankCarrying`

```text
/** True when a flank is per-instance data: an optional trailing/leading
	 *  separator, an optionally-unterminated tail form, or a separator-kind
	 *  choice. Flankless lists carry no such data and never hoist. */
```

### `packages/codegen/src/dsl/rule-patterns.ts::SeparatedListBodyInfo.form`

```text
/** Which spelling matched: `head` = `[elem, repeat(sep elem), opt(sep)?]`,
	 *  `leading` = `[repeat1(sep elem), opt(sep)]` (continues a parent-side
	 *  head), `tail` = `[repeat(elem sep), opt(elem)]` (each element
	 *  separator-terminated, last optionally bare). */
```

`terminated` is the list whose first element carries a required separator:
one element is the list only with its separator (`x,`), and from two elements
on the trailing separator is optional. Two spellings are that form
(`terminatedListOf`), and neither is rewritten into the other, so each
grammar's parser keeps the spelling its upstream wrote:

- suffix: `[seq(elem, sep), repeat(seq(elem, sep)), optional(elem)]`
- choice: `[elem, choice(sep, seq(repeat1(seq(sep, elem)), optional(sep)))]`

`flatMembers` is the body's members as written.

### `packages/codegen/src/dsl/rule-patterns.ts::SeparatedListBodyInfo.element`

```text
/** The element rule at the repeat position (fields/wrappers intact). */
```

### `packages/codegen/src/dsl/rule-patterns.ts::SeparatedListBodyInfo.separatorRule`

```text
/** The separator rule (STRING literal or CHOICE). */
```

### `packages/codegen/src/dsl/rule-patterns.ts::SeparatedListBodyInfo.flatMembers`

```text
/** The body's members with any nested-head seq spliced FLAT — the
	 *  canonical head-form spelling link's separator lift recognizes.
	 *  Language-identical to the original (seq nesting is associative). */
```

### `packages/codegen/src/dsl/rule-patterns.ts::isInlineSafe`

A seq that is a `terminated` separated list (`separatedListBodyInfo`) is never
inline-safe. Its last member is an optional ELEMENT, not an optional
separator, so the separator-flank test (`seqHasGenuineSeparatorVariability`)
does not see that the list carries per-instance data (whether the last element
has its separator); asking the form directly does. This is what makes
`optional(<terminated run>)` hoist as a list kind of its own, the way an
optional head-form list does. The rest of the predicate is described under its
earlier home, `dsl/group-classify.ts::isInlineSafe`.

### `packages/codegen/src/dsl/rule-patterns.ts::terminatedListOf`

The one recognizer of the `terminated` list form, in either spelling
(`suffixTerminatedList`, `choiceTerminatedList`). Besides the element and the
separator it returns `elementSites`: the path from the body to every position
an element stands in, three in the suffix spelling and two in the choice
spelling. Elements are compared by `sameElementRule`, so a body whose elements
are only partly fielded is still the form. The suffix spelling's middle
repetition must be a `repeat`, zero or more: with `repeat1` the parser demands
a second element, and lifting that to one `repeat1` would offer a one-element
list the parser refuses. Enrich reads it through
`separatedListBodyInfo` and `mapTerminatedListElements`; link reads it through
`separatedListBodyInfo`, so the stamp `terminated` on the lifted repeat and the
decisions enrich takes about the same body come from one test.

### `packages/codegen/src/dsl/rule-patterns.ts::mapTerminatedListElements`

Rebuilds a `terminated` list body with `fn` applied to each element position
and everything else kept; `null` when the body is not that form. Enrich fields
the elements with it, which is why element fielding needs no window matcher of
its own for this form.

### `packages/codegen/src/dsl/rule-patterns.ts::sameElementRule`

Whether two element positions of a separated list admit the same rule: the
rules are structurally equal once a `field` wrapper is taken off each, and the
two positions are not fielded with different names. A field changes no
language, so a fielded and an unfielded position still match. Two different
field names are two slots, so they never match, even over the same rule; a
shared field name over different rules does not match either, and neither do
`item` and `_item`. The lift replaces every position with the repeat's
element, so it is sound only when the positions really are the same rule.
Every form compares its positions this way.

### `packages/codegen/src/dsl/rule-patterns.ts::SeparatorFlank`

How a separator stands at one end of a separated list: `mandatory` when the
grammar writes it bare, `optional` when it is wrapped in `optional`. An end
with no separator has no flank.

### `packages/codegen/src/dsl/rule-patterns.ts::separatedListBodyInfo`

```text
/**
 * @internal — recognize a whole seq body as ONE separated list, in the
 * spellings the raw grammars use:
 *   head-form: `[elem, repeat(seq(sep, elem)), optional(sep)?]`
 *              (incl. the nested-head variant `[[elem, repeat(...)], optional(sep)]`)
 *   tail-form: `[repeat(seq(elem, sep)), optional(elem)?]`
 *   terminated-form: either spelling `terminatedListOf` reads, tried first
 * Works on the pre-pushdown wrapper-intact rule tree (this phase has no
 * `separator`/flank attributes yet) and on both runtime spellings of
 * `optional`. Returns null when the body is not a single separated list.
 */
```

A member beside the list counts as a flank only when it is the separator: the
separator itself, one of its arms when it is a choice, or a choice that shares
an arm with a choice separator. Any other token beside the list (an
`optional('.')` next to a `,`/`;` list) is not part of the list, so a body
holding one is not a single list.

Besides the form, the result carries what a consumer needs to build the list
without matching the shape again: `repeat` (the grammar's repeat member),
`leading` and `trailing` (whether a separator stands before the first element
or after the last, and whether it is `mandatory` or `optional`), and `carrier`
(the nested seq the list was written as, when it was). Link builds its
canonical repeat from these (`separatedListAt`); the `terminated` form sets
none of them.

#### body

```text
// A list's repeat member is the one whose content is a separator run —
// NOT just any repeat (an attributed element is itself `seq(repeat(attr),
// X)`, whose inner repeat carries no separator).
```

#### body

```text
// Nested-head variant: [flank?, [elem, repeat(sep-run)], flank?] — splice
// the nested seq's members into place and re-examine as the flat
// head-form (the nested seq may sit after a leading flank member, e.g.
// object_type_content's optional leading separator).
```

#### body

```text
// Head-form: repeat is seq(SEP, elem); the member BEFORE the repeat is
// the head element, an optional(SEP) member after it is the trailing
// flank (a leading optional(SEP)/bare SEP before the head is the
// leading flank). A leading-run variant carries NO in-body head — the
// list continues a head element living in the parent
// (`[repeat1(seq(sep, elem)), optional(sep)]`, python's
// expression_list/pattern_list tail groups) — recognized only when a
// trailing flank follows, so a bare `repeat(seq(sep, elem))` member
// alone never reads as a whole-body list.
```

#### body

```text
// REPEAT1 only: a zero-or-more repeat plus an optional flank would
// match the empty string — not a rule tree-sitter accepts, and not
// this shape (the leading run CONTINUES a mandatory head element).
```

#### body

```text
// Compound/multi-arm elements: both positions must still AGREE
// structurally — compare their canonical keys instead of names.
```

#### body

```text
// A bare separator literal is a MANDATORY flank — part of the list
// shape, but compile-time-known (not per-instance data).
```

#### body

```text
// A choice-of-separators flank next to a choice-separator list — the
// two spellings routinely diverge in decoration (one side may hold
// substituted symbol refs), so match on both being choices rather
// than exact keys.
```

#### body

```text
// Any member that is not the head, the repeat, or a flank breaks
// the "whole body is one list" reading.
```

#### body

```text
// Tail-form: repeat is seq(elem, SEP); the optional(elem) member after the
// repeat means the last element may omit its separator — per-instance
// trailing-separator data. A bare separator-terminated repeat with NO
// elem? tail is not this shape (every element is mandatorily terminated).
```

### `packages/codegen/src/dsl/rule-patterns.ts::isLiteralChoiceContent`

```text
/** A position whose content is a literal choice: one string, or a choice
 *  of strings — the shape a kind-enum slot carries. */
```

### `packages/codegen/src/dsl/rule-patterns.ts::armsDifferOnlyByLiteralChoice`

```text
/**
 * Two choice arms that differ ONLY at literal-choice positions must stay
 * one kind with an enum slot — splitting them would mint a form whose
 * sole difference is a cardinality-1 (determined) enum.
 * `mintStructuredChoiceArm`'s callers decline such arms. Returns true
 * when the arms are structurally identical except for at least one
 * literal-choice position whose texts differ.
 */
```

#### body

```text
// EXACTLY one differing position: the delta must be expressible as ONE
// enum slot. Arms differing at two literal positions (`new.target` vs
// `import.meta`) are distinct forms — folding them would cross-combine
// the literals.
```

### `packages/codegen/src/dsl/rule-patterns.ts::isHiddenKind`

```text
/**
 * Authoritative "is this kind hidden?" check shared by Link and
 * downstream passes. Tree-sitter treats a rule as hidden when:
 *
 *   (a) its name begins with `_` (convention), OR
 *   (b) its name appears in the grammar's `inline:` array (explicit).
 *
 * Grammars that don't follow the leading-underscore convention can
 * still mark rules hidden via `inline`. Passing `undefined` for
 * `inlineList` falls back to convention-only, which is the safe
 * default when Link doesn't have grammar metadata at hand.
 */
```

### `packages/codegen/src/dsl/rule-patterns.ts::isNonInlinableLeafShape`

```text
/** A rule shape that must never be spliced into every occurrence site by
 *  reference-inlining: an enum choice, SUPERTYPE, PATTERN, or STRING body.
 *  Each of those is a whole leaf CLASS with its own catalog identity, not
 *  a single-use structural fragment — folding one into an inline SYMBOL
 *  reference would duplicate that class at every reference site instead of
 *  collapsing a single occurrence. Consumer: `inline-sets.ts` reads the
 *  negation as an inlinability check for grammar diagnostics. Link's
 *  reference `inline` stamp does not read it (`inlinesAtReference`).
 */
```

### `packages/codegen/src/dsl/rule-patterns.ts::isHiddenRule`

```text
/**
 * Reads the `hidden` stamp `RuleBase.hidden` puts on a rule (link's
 * `stampParserVisibility` from the parser catalog, and
 * `stampLinkMintedVisibility` for link's own mints) instead of re-deriving
 * hidden-ness from a leading underscore. The stamp — not the name — is
 * authoritative once a rule has passed through link.
 */
```

### `packages/codegen/src/dsl/rule-patterns.ts::isComplexBody`

```text
/**
 * Returns true when `rule` is complex enough to be a meaningful structural
 * pattern. Excludes trivial single-terminal bodies that would match too
 * broadly (every bare string, every symbol reference, every pattern).
 *
 * Exported for use by `deriveComplexAliasTargetHidden`.
 */
```

#### body

```text
// A REPEAT is complex only when its content is itself non-trivial
// (not a bare string or symbol).
```

### `packages/codegen/src/dsl/rule-patterns.ts::deriveComplexAliasTargetHidden`

```text
/**
 * Derive the set of hidden (`_`-prefixed) kinds that:
 *   1. Appear as the source of a NAMED ALIAS — either the wrapper form
 *      (`alias(symbol(_X), $visible)`, kept through link since link never
 *      restructures an ALIAS it can't reduce) or the reduced form link
 *      produces for a complex alias content that targets a declared rule
 *      (`symbol(_X, aliasedTo:'visible')`).
 *   2. Whose own rule body in `rules` satisfies {@link isComplexBody}.
 *
 * This is the on-demand structural replacement for `patternReplacementKinds`.
 * Both consumers receive different rule-map shapes:
 *   - `link.ts` calls this on `raw.rules` (pre-link; only the wrapper form exists).
 *   - `normalize.ts` calls this on `linked.rules` (post-link; both forms can appear).
 *
 * The predicate is intentionally conservative (the derived set may be a
 * strict superset of the old `patternReplacementKinds` cache). Probe-verified
 * byte-identical for rust/typescript/python across normalize's rules,
 * normalizedRules, and simplifiedRules outputs.
 *
 * @remarks
 * The walk covers seq/choice members, content, polymorph forms, and
 * separator rule lists so aliases nested in any position are captured.
 */
```

#### body

```text
// Wrapper form: alias(symbol(_X), $visible)
```

#### body

```text
// Reduced form: symbol(_X, aliasedTo:'visible')
```

#### body

```text
// `rules` is deliberately AnyRule (both pre-link and post-link callers,
// see doc comment above); isComplexBody only checks SEQ/CHOICE members +
// BLANK-arm shape, phase-agnostic in practice — widen the phase view
// (post-PR-S, RepeatRule<'evaluate'>/<'link'> genuinely diverge in shape,
// so AnyRule no longer coincidentally structurally matches Rule<'evaluate'>).
```

### `packages/codegen/src/dsl/index.ts::module`

```text
/**
 * @sittir/codegen/dsl — sittir's DSL layer for override files.
 *
 * This is the stable import surface for `packages/<lang>/grammar.sittir.ts`.
 * Override files import from here:
 *
 *     import { transform, role, enrich, field, alias } from '@sittir/codegen/dsl'
 *
 * Two categories of exports:
 *
 * **Pure sittir extensions** (no tree-sitter equivalent):
 *   - `transform` — override-authoring primitive that patches positions
 *     in an existing rule tree.
 *   - `role` — structural-whitespace annotation with per-grammar
 *     accumulator.
 *   - `enrich` — mechanical enrichment passes applied before the
 *     override's own rule callbacks run.
 *
 * **Sittir shadows of baseline tree-sitter DSL** (add one-arg shorthand;
 * two-arg calls delegate to the runtime-injected native):
 *   - `field(name)` — one-arg placeholder for `transform()` patches.
 *     Two-arg form delegates to the runtime's native `field()`.
 *   - `alias($.name)` — one-arg shorthand for `alias($.name, $.name)`.
 *     Two-arg form delegates to the runtime's native `alias()`.
 *
 * The remaining baseline tree-sitter DSL functions (`grammar`, `seq`,
 * `choice`, `optional`, `repeat`, `repeat1`, `token`, `prec`, `blank`)
 * are NOT exported from here — they're injected as globals by
 * `compiler/evaluate.ts` (sittir runtime) or by `tree-sitter` CLI
 * (transpiled output), mirroring tree-sitter's own convention where
 * grammar.js files call `grammar(...)` without importing it.
 */
```

### `packages/codegen/src/dsl/enrich.ts::module`

```text
/**
 * dsl/enrich.ts — mechanical grammar enrichment passes.
 *
 * `enrich(base)` returns a new grammar with each rule's body enriched
 * by mechanical passes. No side-channel callbacks: enrich builds the
 * wrapped FIELD/SYMBOL nodes inline and injects any required `_kw_<name>`
 * hidden rules directly into `base.grammar.rules`, so tree-sitter's
 * native `grammar()` sees a complete, self-consistent grammar.
 *
 *     export default grammar(enrich(base), { rules: { ... } })
 *
 * Current passes:
 *
 *   1. Unambiguous kind-to-name field wrapping — bare `$.kind` symbol
 *      at a top-level seq position appearing exactly once → wrap as
 *      `field('kind', $.kind)` with `source: 'enriched'`.
 *
 *   2. Bare leading-keyword field promotion — first seq member is an
 *      identifier-shaped string literal (`'break'`, `'async'`) →
 *      wrap as `field(kw, SYMBOL(_kw_<kw>))` and register the hidden
 *      rule `_kw_<kw>: prec.left(1, 'kw')` so tree-sitter's normalizer
 *      preserves the FIELD around SYMBOL (bare STRING inside FIELD
 *      gets stripped).
 *
 *   3. Optional keyword-prefix promotion — `optional(identifier-literal)`
 *      at any seq position → wrap inner as the same FIELD(SYMBOL) form.
 *      Field is named by the keyword itself (`async`): the slot says
 *      whether that keyword is present. A reserved word is a legal
 *      property and method name; where a generator needs a bare
 *      identifier it applies its own reserved-word rule.
 *
 *   4. Optional-symbol promotion — at a TOP-LEVEL seq position:
 *
 *        optional($.kind)                    → wrap inner SYMBOL
 *        optional(seq($.kind, <anon…>))      → wrap inner SYMBOL
 *
 *      Both descend through `CHOICE(X, BLANK)` (tree-sitter's
 *      normalized optional form). Case B stays strict: the inner seq
 *      must contain exactly one SYMBOL; all other members must be
 *      anonymous terminals (STRING / PATTERN) — guards against
 *      accidentally labelling multi-symbol seqs. Same uniqueness +
 *      claimed-name guards as pass 1.
 *
 *   5. Choice-arm terminal field wrapping — pass 1 only inspects a
 *      rule's OWN top-level body when it's a bare seq (or repeat(seq)).
 *      A seq buried as an ARM of a top-level CHOICE (e.g.
 *      `export_statement: choice(previous, seq('export','type',
 *      $.export_clause,optional($._from_clause),$._semicolon), ...)`)
 *      never gets pass 1's treatment, even once that arm is later
 *      promoted into its own visible node kind by a downstream
 *      choice-arm-promotion mechanism. This pass applies pass 1's Shape-1
 *      (bare SYMBOL only) decision independently to each seq-shaped
 *      choice arm. Also widens eligibility for underscore-prefixed
 *      targets beyond `supertypeNames` (tree-sitter's declared
 *      `supertypes:` list) to any hidden rule that is "terminal-shaped"
 *      — built entirely from anonymous literals and/or references to
 *      other terminal-shaped hidden rules, recursively (see
 *      `isAnonymousLiteralShapedRule`) — since a rule like `_semicolon
 *      = choice($._automatic_semicolon, ';')` is exactly this shape but
 *      was never a declared supertype. One level of choice-arm descent
 *      only (an arm that is itself a further CHOICE is left alone).
 *      Doesn't share pass 1's numbered-duplicate / nested-repeat
 *      disqualification machinery — choice arms are simple,
 *      single-occurrence positions in practice; per-arm collisions still
 *      skip via `reportSkip`.
 *
 *   6. Node-choice field wrapping — a bare `repeat(choice(...))` wraps the
 *      whole choice as `field('elements', choice(...))` instead of leaving
 *      each arm to route into a separate per-kind read bucket; a bare
 *      eligible-referent symbol as a repeat's direct content gets the same
 *      treatment; and a separated list's leading + repeated element
 *      positions get the SAME field name so they merge into one slot (see
 *      `applyNodeChoiceFieldWrap`'s doc comment for all three). Runs once,
 *      LAST, over the fully-merged rule map — not part of the fixed-point
 *      loop above. Numbered on collision (`elements_2`, ...) rather than
 *      skipped, and reaches hidden rules too — unlike passes 1-5. Callers
 *      exempt individual rule names via `enrich()`'s `config` parameter
 *      when the wrap would be structurally correct but empirically wrong
 *      (a choice arm that's an implicit, unmodeled text gap rather than a
 *      real CST child; or a rule whose own override already fields this
 *      exact position).
 *
 * All passes collision-aware: skip (stderr notification) when the
 * promotion would shadow an existing field name. Strictly local — no
 * cross-rule analysis, no thresholds. All enrich-added FIELDs carry
 * `source: 'enriched'` so downstream passes distinguish them from
 * user-authored overrides.
 *
 * Why inject `_kw_<name>` into `base.grammar.rules` instead of using
 * `registerSyntheticRule`: the synthetic-rules module-level map gets
 * reset by `installGrammarWrapper` at the start of every `wrappedGrammar`
 * call (synthetic-rules.ts:394). That works when the registration
 * happens INSIDE a rule callback (pass-1 dry-run captures it before the
 * reset), but enrich runs BEFORE `grammar()` — so the reset wipes the
 * registrations and the enriched rules end up with dangling SYMBOL
 * references. Injecting the hidden rules directly into `base.grammar.rules`
 * sidesteps the scope machinery entirely; tree-sitter's native grammar
 * picks them up via line-315 `Object.assign({}, baseGrammar.rules)`.
 */
```

### `packages/codegen/src/dsl/enrich.ts::GrammarResult`

```text
// Shape of the tree-sitter grammar result that our grammarFn produces.
// The outer wrapper is `{ grammar: {...} }` because tree-sitter's
// top-level `grammar()` call wraps its result; we preserve that shape.
```

### `packages/codegen/src/dsl/enrich.ts::enrich`

Works on a copy of its input's rules: the input grammar is never written,
so the upstream module stays as published for every later evaluation.

The optional second argument carries the authored config enrich must see
(`EnrichAuthoredConfig`). With it, a visible group whose whole body an
authored `groups:` pattern covers is not minted: the body stays where it is,
and wire's pattern replacement names it under the authored key. The enriched
grammar is then already self-consistent, with no minted rule for a later
stage to take back.

Before the token-form hoist, every rule passes through `factorSharedOptional`, so a choice whose every member is optional reaches the hoist as one optional choice and the blank case becomes its own arm. After clause hoisting, every clause group is stamped `hoisted` except the token-form parents, which are supertypes.

### `packages/codegen/src/dsl/enrich.ts::EnrichAuthoredConfig`

The part of a grammar's authored config enrich reads: `groupBodies`, the
evaluated `groups:` body patterns (`authoredGroupBodies`), and `extras`, the
config's `extras:` callback, which decides the extras the final grammar
lexes (`effectiveExtras`).

`fieldSites` maps each kind to the sites its authored patches mark with `field()` (`authoredFieldSites`): index path and field name. The token-form hoist leaves a choice at one of those paths unsplit, and an element choice under a fielded repeat takes the site's name as its slot (`elementChoiceSlots`).

### `packages/codegen/src/dsl/enrich.ts::coveredByAuthoredGroup`

Whether an authored group pattern covers a would-be visible group's whole
body, compared with `rulesEqual` after `unwrapPrec`, since enrich registers
the ambient prec on the lifted body. Read by `visibleGroupSynthName` (every
synthesized group, list and arm) and by the promote-existing-hidden-rule branch
of `mintStructuredChoiceArm`; either declines on a match. A pattern covering
only part of the body declines nothing, and the pattern is replaced inside the
minted group.

### `packages/codegen/src/dsl/sittir-grammar.ts::sittirGrammar`

The one composition of a sittir grammar: `enrich(base, { groupBodies, extras })`
with the config's authored group patterns and `extras:` callback, then `wire(config, enriched, base)`, which keeps the pre-enrich
base as the raw stage,
then the ambient `grammar()` (tree-sitter's in the bundled `.sittir/grammar.js`,
sittir's `grammarFn` under evaluate) over the enriched base and wired options,
then `blankDeadEnrichMints`, which blanks the rules enrich
added that the wired grammar never reaches, `attachDerivationRecords`,
which records the upstream conflicts and each reshaped rule's upstream source
for the conflict loop, and the imported resolutions and whether the config
authors `conflicts` for the diagnostics, and last `applyConflictResolutions`, which sets the
grammar's conflicts to the derived resolutions the config passes as
`resolutions` (each grammar imports its own `.sittir/resolutions.json`).
A `bindings` overlay is applied after that (`bindGrammar`).
Every `grammar.sittir.ts` and the bootstrap template call it as
`export default sittirGrammar(base, { … })`.

`B` infers from the upstream `base`, and the config is contextually typed as
`WireConfig<EnrichedGrammar<B>>`, so rule callbacks get the grammar-shaped
`$` and `previous` exactly as a direct `wire({…}, enrich(base))` call did; in
`vocabulary()` and `reauthored()` callbacks `$` is grammar-shaped too, where
the separate-binding form left it unshaped. `P` and `O` infer from the
`patches` and `options` blocks and are forwarded to `wire` explicitly, so
`PatchesCheck` and `OptionsCheck` judge the grammar's written keys.

#### body

```text
// Grammar-wide word-shape matcher (Camp A). `word`'s shape depends on
// which runtime is evaluating us: under sittir's own `grammarFn` (the
// globalThis.grammar shim — see compiler/evaluate.ts
// saveAndInjectDslGlobals) it is already a resolved rule NAME (string |
// null); but the emitted `.sittir/grammar.js` runs enrich() BEFORE
// tree-sitter's native `grammar()`, so there `word` is still the raw `$
// => $.identifier` callback. Resolve the callback form with the same
// symbol-shaped-proxy trick `extractGrammarSymbolNames` uses, so both paths
// compile the SAME word regex (PR #111 review finding — previously the
// CLI path silently fell back to /^\w+$/, letting keyword promotion
// diverge between parser and IR). ruleToRegexSource in util/word-matcher
// is dual-case for the same reason. Single source of truth via
// matchesWordShape; used by pass 3's optional-keyword-prefix below.
```

#### body

```text
// Extract declared supertype names so pass 3 can treat `_prefix`-
// stripped labels as valid field names (e.g. `optional($._expression)`
// → `field('expression', $._expression)`). `supertypes` is a
// `$ => [...]` callback on the base grammar; we invoke it with a
// trivial symbol-shaped proxy so enrich can extract the names
// without waiting for tree-sitter to run the real grammar pipeline.
```

#### body

```text
// Per-enrich hidden-rule bag. Passes that wrap keywords populate it
// via `registerKwRule` below; the final rule map merges it with the
// enriched user rules.
```

#### body

```text
// Clause-hoist hidden-rule bag. The clause-hoist pass injects hoisted
// optional(seq(STRING,FIELD…)) groups here so tree-sitter sees them
// from base.grammar.rules (same path as _kw_* rules).
```

#### body

```text
// Cross-parent dedupe map for clause-hoist: canonicalStringify(seq) → name.
// Shared across all parent rules within a single enrich() call — mirrors
// applyAutoGroups's dedupe map so identical clause seqs in different
// parents reuse the same hidden rule.
```

#### body

```text
// Cross-parent dedupe map for inline-UNSAFE visible content-aliases:
// canonicalStringify(content) → `_<parent>_group<N>` name. Identical
// inline-unsafe bodies in different parents reuse the same visible kind.
```

#### body

```text
// Hidden-rule names (`_<parent>_group<N>`) for VISIBLE-aliased groups. These
// are registered in `clauseGroupRules` (so tree-sitter sees the rule) but must
// be EXCLUDED from the `inline:` list: the parent references them via
// `alias($._<name>, $.<name>)`, and inlining the hidden rule would make
// tree-sitter alias the EXPANDED seq (re-distributing the alias across its
// members — the exact bug this restructure fixes). Inline-safe clause groups
// stay in `inline:`. Tagged ONCE at creation (visibleGroupSynthName) — read
// here, never re-derived.
```

#### body

```text
// Loop 1: field-wrap every rule to its fixed point BEFORE any hoisting, so
// the hoist stage below sees the whole grammar's enriched fields (the
// separated-list naming needs grammar-global field-name knowledge).
```

#### body

```text
// Whole-body list normalization: an existing rule whose ENTIRE body is a
// flank-carrying separated list in the nested-head spelling
// (`seq(seq(elem, repeat(sep elem)), flank)`) — e.g. python's upstream
// `_patterns`/`_parameters`/`_import_list` helpers — flattens to the
// canonical head-form so the link phase's separator lift recognizes it
// and the kind classifies 'list' (kind-level flank keys), same
// as the mints below. Language-identical: seq nesting is associative.
```

#### body

```text
// Exclusive field-choice distribution, BEFORE loop 2: the mint below lifts
// choice arms into kinds, so the alternatives have to be arms by the time
// it runs — afterwards they are already fused onto one kind as independent
// optional fields. Reads `enrichedRules` for the hidden marker helpers it
// inlines, so it sees them fully field-wrapped.
```

#### body

```text
// Loop 2: clause/group hoisting + base-grammar un-aliasing, per rule in the
// same order loop 1 ran. The separated-list name counts computed from the
// fully field-wrapped grammar are what let a mint claim a bare element
// name only with global uniqueness.
```

#### body

```text
// Inject `_kw_<kw>` hidden rules — `registerKwRule` already checked
// each one against `rulesBag` (reusing or declining on collision), so
// nothing here can shadow a base-grammar rule of the same name.
// Inject clause-group rules — user rules NEVER shadow them either
// (they start with `_<parentKind>_optional`, a synthesized prefix).
```

#### body

```text
// Singleton-ordinal collapse: an arm/group mint's ordinal exists only to
// disambiguate siblings under one parent — a parent with exactly one mint
// of a flavor drops it (`slice_group1` → `slice_group`). Runs before the
// later passes so they (and wire's override callbacks) see final names.
```

#### body

```text
// Node-choice field wrapping (pass 6) — runs once, last, over every rule
// this enrich() call produced (original + kw + clause-hoist mints), never
// inside the fixed-point loop above. Needs `mergedRules` itself (to
// dereference a hidden referent's own body, and to mint literal-arm
// promotion rules directly into the final rule bag). See
// `applyNodeChoiceFieldWrap`'s doc comment for why.
```

#### body

```text
// Mint inline field-enum choices (`field('operator', choice('+', '-', …))`)
// as named hidden rules directly into `mergedRules`, pre-generate — see
// `synthesizeFieldEnumRules`'s doc comment. Runs last so it also sees
// clause-hoist-minted rules from the merge above. Verified across all
// three grammars (docs/superpowers/specs/2026-07-30-kindid-invariant-restoration.md
// §1): `tree-sitter generate` succeeds, `grammar.json`'s `conflicts` array
// is unchanged, and `node-types.json` is byte-identical for rust,
// typescript, and python — the `prec(-1, …)` wrapper (see
// `tryExtractFieldEnum`) is what keeps a newly-real hidden rule from
// shifting any LR state, so no grammar's `conflicts:` list needed a
// manual entry.
```

#### body

```text
// Register the merged rule-map so transform()/groups path-descent can resolve
// (and patch) enrich group-lift symbol bodies by name — the lookup that lets a
// path patch travel THROUGH a hoisted `_<parent>_<kind><N>` symbol into its
// referenced body. Write-back mutates THIS object (the grammar's `rules` point
// at it below), so a patched group rule reaches both the parser seed and the
// IR-materialized kind. Last-registration-wins is safe: codegen processes one
// grammar at a time and enrich runs before any transform fn executes.
```

#### body

```text
// Attach the set of clause-group names as a well-known non-enumerable
// property on the enriched grammar. Wire.ts reads this to register the
// hoisted groups in `context.syntheticInline` so they get added to the
// grammar's `inline:` list — without inlining, tree-sitter creates LR
// conflicts for the new hidden rules. Non-enumerable so it is invisible
// to rule iteration, JSON serialization, and spread operators.
// Only inline-safe hidden clause groups go into `inline:` (syntheticInline).
// VISIBLE-aliased groups' hidden rules (`_<parent>_group<N>`) are excluded —
// inlining them would re-distribute the visible alias across the seq members.
```

#### body

```text
// Attach the hidden SOURCE names behind every visible-group mint (both the
// promote-existing and synthesize-new categories). Wire reads this to
// FILTER these names out of the grammar's final `inline:` list: a mint
// `alias($._src, $.visible)` only survives to the parser if `_src` is a
// real (non-inlined) rule — tree-sitter's inline processing erases inlined
// rules before table construction, taking the alias (and the minted kind's
// entire parser identity) with it, while the IR still models the kind —
// the "VAPORIZED" phantom divergence. See getEnrichVisibleSubsequenceSources.
```

Each clause group is stamped `annotations.hoisted` (`withHoistedAnnotation`)
in place, right after its unalias pass — not at the merge, because
`collapseSingletonMintOrdinals` rereads `clauseGroupRules` after the merge and
a stamp made there would be lost. The stamp is the declaration link collects
`hoistedKinds` from; enrich is one of its minting routes.


A config may carry a `bindings` overlay (`bind.ts::Bindings`). `checkBindingPatches` checks its alias patches against the enriched grammar, `withBindingPatches` joins its patch sets to wire's patch stage (base names, enriched paths), and after `applyConflictResolutions` the result's grammar goes through `bindGrammar` with the effects wire recorded (`wire.ts::wireBindingEffects`). Resolutions therefore stay in base names, and `bindGrammar`'s renames carry them along. Under an unbound evaluation (`UNBOUND_ENV`) the overlay is skipped.

### `packages/codegen/src/dsl/enrich.ts::applyFieldWrapPasses`

#### body

```text
// Fixed-point loop. The current pass set has well-defined
// non-overlapping outputs (symbol-to-field wraps SYMBOLs as FIELD;
// optional-keyword wraps optional(STRING) as FIELD(SYMBOL(_kw_<x>))),
// so a single iteration converges in practice. Looping is defensive:
// if a pass's output ever exposes new candidates for an earlier
// pass (e.g. structural simplification creates a new top-level
// SYMBOL position), we converge instead of silently losing the
// promotion. `MAX_ITERATIONS` caps blow-ups from any future pass
// that accidentally produces ever-changing output.
```

#### body

```text
// Choice-arm terminal field wrapping (pass 5) — see
// `applyChoiceArmFieldWrap`'s doc comment. Mutually exclusive with
// `applySymbolToField` at the top level (a rule's own body is
// either a seq/repeat(seq) or a choice, never both), so ordering
// within this loop doesn't matter.
```

#### body

```text
// Repeat-union field promotion (pass 6) — see
// `applyRepeatUnionFieldPromotion`'s doc comment. Targets a shape no
// other pass touches (bare `repeat($._union)` content, including in
// hidden rules), so loop ordering doesn't matter.
```

#### body

```text
// Bare leading-keyword pass intentionally omitted — the docstring
// above explains why: wrapping bare leading literals as FIELD(SYM)
// adds `_kw_<name>` hidden rules that shift tree-sitter's parser-
// generator tables, breaking unrelated rules' reparse (rust corpus
// regresses by ~47/136 with this pass on).
```

### `packages/codegen/src/dsl/enrich.ts::isAnonymousLiteralShapedRule`

```text
/**
 * @internal — true when `name` (an underscore-prefixed hidden-rule
 * reference, e.g. `_semicolon`) is "terminal-shaped": its own body is
 * built ENTIRELY from anonymous literals (STRING/PATTERN) and/or SYMBOL
 * references to other terminal-shaped hidden rules, recursively (e.g.
 * `_semicolon = choice($._automatic_semicolon, ';')`). A SYMBOL with no
 * entry in `rulesBag` is presumed to be an external-scanner token (e.g.
 * `_automatic_semicolon`, `_function_signature_automatic_semicolon`) —
 * these have no rule body of their own (they're declared in `externals:`,
 * not `rules:`), but are exactly as terminal/anonymous-shaped as a bare
 * STRING for this purpose.
 *
 * This is a WIDER net than `supertypeNames` (tree-sitter's own declared
 * `supertypes:` list, which only covers real NAMED-node unions like
 * `_expression`/`_statement`) — a hidden rule can be "purely a choice of
 * anonymous alternatives" without ever being declared a supertype, and
 * `applySymbolToField`'s existing `supertypeNames.has()` gate wrongly
 * treats such rules the same as any other unclassified hidden helper,
 * blocking a bare `$._semicolon`-shaped reference from ever being
 * auto-fielded even when the containing rule IS a top-level seq.
 */
```

```text
// cycle guard — never seen in practice, but don't hang if it occurs
```

```text
// no rule body — presumed external scanner token
```

### `packages/codegen/src/dsl/enrich.ts::applyChoiceArmFieldWrap`

```text
/**
 * Pass 5 (choice-arm terminal field wrapping). Pass 1
 * (`applySymbolToField`) only inspects a rule's OWN top-level body when
 * it's (optionally prec-wrapped) a bare seq, or a repeat/repeat1 wrapping
 * one (`tryPromoteInRepeatSeq`) — it never descends into individual arms
 * of a top-level CHOICE. `export_statement`'s body is
 * `choice(previous, seq('export','type',$.export_clause,
 * optional($._from_clause),$._semicolon), seq(...), seq(...))` — a
 * top-level CHOICE with the semicolon-bearing seq buried as one arm. Pass
 * 1 never sees it, so when that arm is later promoted into its own
 * visible node kind (`_export_statement_type_export`) by a downstream
 * choice-arm-promotion mechanism, it inherits a body where `semicolon`
 * was never fielded — a real bug: `automatic_semicolon` is a NAMED node
 * type, so the native reader routes an unfielded occurrence of it to its
 * own kind-keyed `_automatic_semicolon` field, a different key than
 * generated wrap code checks (which only catches the anonymous `;`
 * alternative via the generic `$other` bucket). Explicit `;` worked; ASI
 * (no trailing `;`) threw.
 *
 * This pass mirrors pass 1's per-member decision (Shape 1 / bare SYMBOL
 * only — the same restriction pass 1 applies to underscore-prefixed
 * targets, since wrapping Shape 2/3 nested inside an OPTIONAL breaks
 * override `transform()` patches that expect a direct enriched FIELD),
 * applied independently to each seq-shaped CHOICE arm instead of only a
 * rule's own top-level seq. Non-underscore bare symbols use their own
 * kind name; underscore-prefixed ones are eligible when either a real
 * declared supertype OR (new) `isAnonymousLiteralShapedRule`.
 *
 * Deliberately ONE level of choice-arm descent (arms that are themselves
 * a nested CHOICE, rather than a SEQ, are left alone) — matches the
 * concrete need (`export_statement`'s arms are each a flat seq) without
 * open-ended recursion into arbitrarily deep choice-of-choice shapes.
 * Deliberately omits pass 1's numbered-duplicate and nested-repeat
 * disqualification machinery — choice arms in practice are simple,
 * single-occurrence positions; a per-arm collision (`existing.has`) still
 * skips with `reportSkip` rather than risk stamping a wrong/colliding
 * field name.
 */
```

```text
// skip hidden helpers — same gate as pass 1
```

```text
// Shape 1 only, same as pass 1's underscore restriction
```

### `packages/codegen/src/dsl/enrich.ts::isAllArmsNodeShaped`

```text
/**
 * A choice whose arms are all node-shaped (SYMBOL/ALIAS references, no bare
 * literal arm) is the merge-order-bug shape this pass targets. Run as-is
 * against a repeat's raw choice content, a bare literal arm (e.g.
 * `class_body`'s `;` terminator alongside method/member arms) disqualifies
 * it here — but `promoteLiteralChoiceArms` (below) runs first and turns a
 * literal arm into a node-shaped one, so by the time this check matters it
 * usually no longer applies. See that function's doc comment for why
 * promoting is safe.
 */
```

### `packages/codegen/src/dsl/enrich.ts::isAllArmsNodeOrLiteralShaped`

```text
/**
 * Same as `isAllArmsNodeShaped` but also accepts a bare literal (STRING /
 * PATTERN) arm — the shape `promoteLiteralChoiceArms` knows how to fix.
 * Deliberately excludes anything else (nested SEQ/CHOICE arms, etc.): those
 * are a different shape (e.g. a separated list) that this pass doesn't
 * touch.
 */
```

### `packages/codegen/src/dsl/enrich.ts::LITERAL_ARM_NAMES`

```text
/** Minimal punctuation → readable-name map for `promoteLiteralChoiceArms`.
 * Not a general token-naming utility (that's `compiler/link.ts`'s
 * `tokenToName`, a later compiler phase enrich.ts doesn't import from —
 * same reasoning as `pluralizeFieldName`); the promoted name is a
 * synthesized hidden-rule identifier immediately folded into the outer
 * `elements` field, so it only needs to be valid, unique, and readable
 * enough for debugging, not exhaustive. */
```

### `packages/codegen/src/dsl/enrich.ts::promoteLiteralChoiceArms`

```text
/**
 * Promotes each bare literal (STRING/PATTERN) arm of a choice into a
 * minted `_kw_<name>` hidden-rule SYMBOL — via `registerKwRule`, the same
 * mechanism passes 2-4 already use for keyword promotion — so a mixed
 * node+literal choice becomes all-node-shaped and reaches case 1's
 * ordinary `field('elements', repeat(choice(...)))` wrap.
 *
 * Only called on a REPEAT's direct choice content (never a rule's own
 * top-level dispatch choice, which classifies what variant a single node
 * itself is): `isAllArmsNodeShaped`'s doc comment used to warn that a
 * literal arm here signals per-arm `variant()` classification that
 * fielding the choice would break. That classification (see
 * `node-model.json5`'s `childKind` maps) is keyed by each occurrence's own
 * CST kind name, not by its position among the choice's arms or which wire
 * bucket it arrived in — promoting the literal doesn't rename or reorder
 * any node-shaped arm, so the classification survives fielding the whole
 * repeat the same way case 1 already does for a purely node-shaped choice.
 *
 * Returns `null` (no-op) if nothing changed — e.g. every arm was already
 * node-shaped, or a mint declined due to a genuine name collision
 * (`registerKwRule`'s own conservative guard); the caller keeps the
 * original choice in that case rather than risk a partially-promoted one.
 */
```

### `packages/codegen/src/dsl/enrich.ts::pluralizeFieldName`

```text
/**
 * Node-choice field wrapping. Two independent targets, one tree walk:
 *
 *  1. `repeat(choice(...))` with no field wrapper routes each repetition
 *     into a separate per-arm-kind read bucket (tree-sitter has no field to
 *     key on), and any arm whose text collapses to a scalar leaf on the
 *     wire loses the position data needed to recombine those buckets in
 *     document order (`typescript`'s `template_literal_type` —
 *     string_fragment/template_type arms — is the motivating case).
 *     Rewriting `repeat(choice(...))` to `field('elements',
 *     repeat(choice(...)))` — the field wraps the WHOLE repeat, matching
 *     the codebase's existing `field(name, repeat(...))` convention (e.g.
 *     `array: {1: field('elements')}`) rather than living inside it —
 *     keeps every repetition in a single read bucket, in source order,
 *     regardless of arm kind, with no cross-bucket reassembly needed. The
 *     outer placement also keeps a pre-existing hand-authored
 *     `field(newName)` override at this same position working unmodified:
 *     it finds a plain top-level FIELD and renames it via
 *     `resolveFieldPlaceholder`'s ordinary unwrap-and-rewrap path (see
 *     `transform.ts`) instead of finding a bare REPEAT underneath and
 *     nesting a second field around it. Scoped to all-node-shaped choices
 *     (`isAllArmsNodeShaped`) — a choice with a literal arm alongside node
 *     arms (e.g. `class_body`'s method/member arms plus a `;` terminator)
 *     first goes through `promoteLiteralChoiceArms`, which turns the
 *     literal arm into a node-shaped one so it reaches this same wrap; a
 *     choice with any OTHER shape (nested SEQ/CHOICE arms — a separated
 *     list, say) is left alone.
 *
 *  2. `repeat($.statement)` — an eligible field referent
 *     (`isEligibleFieldReferent`: a DECLARED supertype from `supertypeNames`,
 *     OR an undeclared de facto union — a hidden rule whose whole body is a
 *     node-shaped CHOICE, `isHiddenPureUnionRule` — the grammar just never
 *     added it to `supertypes:`) as the DIRECT content of a REPEAT, e.g.
 *     `program`'s `field('statements', repeat($.statement))` — is case 1's
 *     own territory extended to a bare symbol instead of a choice: the field
 *     wraps the WHOLE repeat from outside, same as case 1's
 *     `field('elements', repeat(...))` convention, rather than living inside
 *     it. Named after the referent,
 *     pluralized (`pluralizeFieldName` — an array-valued slot gets a plural
 *     name, e.g. `statement` → `statements`, matching `program`'s own
 *     hand-authored name for this exact position). Restricted to a single,
 *     unambiguous case: it's the rule's ONLY unfielded occurrence of that
 *     referent AND the repeat isn't `suppressed` (threaded through the
 *     walk) — a direct arm of a CHOICE (a dispatch alternative, "this arm
 *     names a possible kind", where fielding it would corrupt the
 *     polymorph/dispatch classification every OTHER rule referencing that
 *     choice depends on). Deliberately does NOT extend to a bare supertype
 *     symbol ANYWHERE ELSE (a plain SEQ member, say) — an earlier, wider
 *     version fielding those too regressed python's validate:native
 *     metrics in ways traced to real but scattered causes: wire()'s
 *     clause-hoist/alias-promotion for `yield`'s `'from'` clause depends on
 *     finding that exact bare shape (enrich runs before wire, so fielding
 *     it first hid the promotable shape), and a downstream node-model
 *     polymorph/variant classification pass got confused by
 *     `expression_list`'s newly-fielded first item. The REPEAT-direct-
 *     content variant carries none of that risk — it was clean end to end
 *     for both rust and typescript — so it's the only form kept.
 *
 * Deliberately NOT run from `enrich()`'s fixed-point loop, and deliberately
 * NOT skipping hidden (`_`-prefixed) rule names — both differ from every
 * other pass in this file. Run mid-loop, it would fire before the loop's
 * other passes (and clause-hoist, which runs once after the loop settles)
 * have finished reshaping the rule, risking a wrap that clause-hoist no
 * longer recognizes as hoistable. Run instead as the LAST step of
 * `enrich()`, over the fully-merged `mergedRules` bag (every rule's fixed
 * point already reached, every clause-hoist mint already folded in) — see
 * the call site near `synthesizeFieldEnumRules`. Hidden rules are eligible
 * because by this point they're the final atomic units; nothing later in
 * `enrich()` restructures them further.
 *
 * A `repeat(choice(...))` shape this pass would get wrong is answered on
 * the rule, never by a name-keyed exemption: python's `string_content`,
 * whose plain-text runs are implicit gaps (no CST child), is rewritten by
 * its override to alias those runs visible, so the read captures them as
 * leaf nodes and there is no verbatim fallback left for a field to
 * displace.
 *
 * Note this still runs BEFORE `wire()`, so a rule split apart later by
 * `variant()` (e.g. `typescript`'s `string` choice, whose two arms
 * `variant('double')`/`variant('single')` later mint into their own
 * `_string_double` / `_string_single` rules) is wrapped as ONE rule here —
 * both of its repeat-choice sites get `elements` in the same call, so the
 * second is numbered `elements_2` to avoid colliding with the first.
 */
```

```text
/** Pluralizes a snake_case grammar field name for an array-valued slot
 * (repeated/array slots get plural names). Deliberately local rather than
 * importing `compiler/model/node-map.ts`'s camelCase `pluralize` — that
 * would pull a later compiler-phase module into the DSL layer, which runs
 * first; grammar field names are snake_case, not camelCase, so the two
 * naming domains don't share a suffix vocabulary anyway. */
```

### `packages/codegen/src/dsl/enrich.ts::isHiddenPureUnionRule`

```text
/**
 * A hidden rule (`_`-prefixed) whose ENTIRE top-level body — after peeling
 * PREC-family wrappers, same convention as `isAllArmsNodeShaped`'s per-arm
 * peel — is itself a node-shaped CHOICE: a de facto union that just never
 * got added to the grammar's declared `supertypes:` list. Eligible for
 * case 2's `repeat($.referent)` variant the same way a declared supertype
 * is; see `isEligibleFieldReferent`.
 */
```

### `packages/codegen/src/dsl/enrich.ts::peelTransparentElementWrappers`

```text
/** Field name for a separated list's element pair (see
 * `fieldSeparatedListElements`): named after the element's own referent
 * when it's a single SYMBOL/ALIAS (matching case 2's
 * `refName.replace(/^_/, '')` convention — singular, since each field
 * occurrence covers one element, not the whole list); falls back to the
 * generic `element` for a choice-shaped element (no single referent to
 * name it after). */
```

```text
/** Peel PREC wrappers and single-member CHOICEs (they can nest in either
 * order) — a choice-of-one is a transparent wrapper around its referent,
 * not a union, and the slot derivation downstream names the slot after
 * that referent; the field must land on the same name or coverage sees a
 * declared-but-unreferenced field (one fact, two derivations). */
```

### `packages/codegen/src/dsl/enrich.ts::fieldTerminatedListElements`

Fields every element of a `terminated` list body with one name, taking the
element positions from `mapTerminatedListElements`. When some element is
already fielded (an earlier pass or an authored patch fielded it), the others
take that name, so all positions agree and link's lift sees one element; when
none is, the name is `elementSlotName` of the element, reserved in the rule's
scope. A body whose elements are all fielded is left alone.

### `packages/codegen/src/dsl/enrich.ts::fieldSeparatedListElements`

```text
/**
 * A separated list — `seq(element, repeat(seq(SEP, element)), optional(SEP))`
 * (tree-sitter's `commaSep1`-style desugaring; `dsl/rule-patterns.ts`'s
 * `separatorOf` is the canonical recognizer for the repeat's own
 * `seq(SEP, element)` content) — has no field tying its LEADING element
 * and its REPEATED elements together.
 *
 * Fields the LEADING element and the repeat's per-iteration element with
 * the SAME name. Tree-sitter tracks a field by name across every position
 * it's attached to within a rule, and `compiler/model/node-map.ts`'s
 * `mergeSlotsByName` already folds same-named slots at different
 * structural positions into one array-valued slot downstream — so two
 * SIBLING per-occurrence fields (this position, and the repeat's own) is
 * enough; no outer field wrapping the whole list is needed. That outer-
 * field approach was tried earlier and abandoned: it collided with an
 * ancestor override's own field at the same position ("fields don't
 * stack" — tree-sitter only keeps the innermost field name). Two sibling
 * fields at different positions carries no such risk.
 *
 * Declines when the element may be absent (`matchesEmpty` — an
 * `optional(...)` element, typescript's `[, a, , b]` holes): a per-element
 * field marks only the elements that are present, so the holes, visible
 * only as consecutive separators, would leave the slot. Such a list keeps
 * its span unfielded; an override that fields the whole span (typescript's
 * `array`, `object`, `arguments`) keeps the separators as field children,
 * which is how the read counts the holes.
 * Declines when the leading position is already fielded (nothing to do),
 * when the repeat is the TRAILING-separator form (`seq(element, SEP)` —
 * `detected.trailing`, a different, rarer shape not handled here), or
 * when the leading element and the repeat's element aren't the same shape
 * (`sameElementShape` — a mismatch means this isn't really one list, e.g.
 * an unrelated repeat happens to sit right after some other element).
 *
 * Runs everywhere the shape matches — same as case 1/case 2 above, no
 * pass-specific gate and no name-keyed exemption. Enrich runs before any
 * override, so an override that fields the same span meets the fields
 * minted here; the transform relabels them in place rather than nesting
 * (`resolveFieldPlaceholder`), so the author's name wins: rust's
 * `trait_bounds: { 1: field('bounds') }` and typescript's
 * `lexical_declaration: { 1: field('declarators') }` keep their slot name
 * with the field on each element, and the separator leaves the field.
 */
```

The mint declines when the element is a choice one of whose arms already
carries a field (`hasFieldedArm`): a uniform `element` field over that
choice would erase the arm's own label, which routes that arm at read
time. The list is otherwise handled as any other, so its flat spelling
and separator spacing sites are unchanged; typescript's
`_enum_body_elements` (`choice(field('name', _property_name),
enum_assignment)`) is the shape this covers.


### `packages/codegen/src/dsl/enrich.ts::separatedListTail`

The one list-element predicate: whether the member at `i` heads a separated list. That is, the next member (through prec wrappers) is a repeat whose content `separatorOf` reads as `seq(SEP, element)` with no trailing separator, the element has the head's shape (`sameElementShape`), and the head is neither fielded inside nor able to match empty. It returns the repeat, its content and the prec wrappers on each, which `fieldSeparatedListElements` rebuilds. A list's head and its tail elements are one slot, so they are fielded together or not at all. The per-member field passes (`applySymbolToField`, `tryPromoteInRepeatSeq`, `tryPromoteInRepeatMember`, `applyChoiceArmFieldWrap`) leave a member for which this holds to `fieldSeparatedListElements`, which fields the head and every tail element with one name. A pass that fielded the head alone would leave an unfielded tail that list fusion, which compares field names, cannot join to it (go `statements`).

### `packages/codegen/src/dsl/enrich.ts::SeparatedListTail`

The separated tail `separatedListTail` found after a list head: the repeat, its prec-peeled content, the tail element, and the prec wrappers outside and inside the repeat.
### `packages/codegen/src/dsl/enrich.ts::hasFieldedArm`

Whether a list element, once its transparent wrappers are peeled, is an
arm choice (`isArmChoice`; an optional `x` is not one) with at least one
`field(...)` arm. Such an element keeps its own
field labels instead of taking the minted `element` field.

### `packages/codegen/src/dsl/enrich.ts::applyNodeChoiceFieldWrap`

#### body

```text
// `suppressed` is true exactly when case 2 must not fire at `r`'s own
// top position because an established convention already owns it:
// either `r` is a direct member of a CHOICE (an alternative in a
// dispatch decision — see the function doc comment), or `r` is the
// DIRECT content of a REPEAT (case 1's own territory — a bare
// supertype symbol there is the standard `field(name, repeat($.super))`
// shape, e.g. `program`'s `field('statements', repeat($.statement))`;
// fielding the inner `$.statement` too would nest a field inside a
// field, and tree-sitter fields don't stack — the outer field would
// silently end up with zero children, the SAME "ancestor collision"
// class as the rust `trait_bounds` case found earlier).
```

#### body

```text
// Case 2, repeat variant: `inner` is itself a bare eligible
// supertype symbol — `repeat($.statement)` is exactly
// `program`'s `field('statements', repeat($.statement))` shape.
// Field the WHOLE repeat from outside (never suppress and skip
// — an earlier version tried that; the codebase's own
// `field(name, repeat($.super))` convention is what
// hand-authored overrides expect to find and rename).
```

#### body

```text
// A mixed node+literal choice (e.g. class_body's method/member
// arms plus its `;` terminator) — promote the literal arm(s) into
// node-shaped symbols first, then fall through to the ordinary
// all-node-shaped field wrap below. See
// `promoteLiteralChoiceArms`'s doc comment for why this is safe.
```

#### body

```text
// Field wraps the WHOLE repeat (matching the codebase's existing
// `field(name, repeat(...))` convention — e.g. `array: {1:
// field('elements')}` — rather than living inside it) so an
// existing hand-authored `field(newName)` override targeting this
// same position sees a plain top-level FIELD and renames it via
// `resolveFieldPlaceholder`'s ordinary unwrap-and-rewrap path,
// instead of finding a bare REPEAT and nesting a second field
// around it.
```

#### body

```text
// Minted names are reserved per exclusive region, not per rule. A
// name is taken only by fields that can occur in the SAME parse: the
// scope entering a choice keeps every name outside the choice, and
// each arm sees that plus its own pre-existing fields — never a
// sibling arm's. Sibling arms therefore reuse a name (both `string`
// arms field their fragment repeat `elements`, exactly as
// `public_field_definition` shares one field across its exclusive
// modifier orders), and only a genuine same-parse collision earns a
// `_<n>` suffix. Names minted inside an arm are folded back into the
// enclosing scope afterwards, since a later sibling in the enclosing
// seq does co-occur with them.
```

### `packages/codegen/src/dsl/enrich.ts::distributeExclusiveFieldChoices`

```text
/**
 * Exclusive field-choice distribution — `seq(…, choice(field('a', X),
 * field('b', Y)), …)` becomes `choice(seq(…, field('a', X), …), seq(…,
 * field('b', Y), …))`.
 *
 * Arms that are each a single, distinctly-named field are ALTERNATIVES: only
 * one of them is ever parsed. Left as a choice sitting inside a sequence they
 * land on ONE kind as N independent optional fields, and that flattening
 * admits combinations no parse produces — several of the fields at once, or
 * none of them. Rust's doc comments are the case in hand: `///` and `//!` are
 * the `outer`/`inner` marker fields of a single `line_comment` arm, so the
 * flattened kind accepts both markers together, and also neither, the latter
 * rendering a doc-comment kind as a plain `//` comment.
 *
 * Distributing the choice over its sequence gives each alternative its own
 * arm, which the mint downstream lifts into its own kind. Exclusivity then
 * rides on the kind rather than on a convention nothing enforces, and each
 * alternative gains a constructor a caller can name.
 *
 * Language-identical: `seq(A, choice(X, Y), B)` and `choice(seq(A, X, B),
 * seq(A, Y, B))` accept the same strings.
 */
```

#### body

```text
/** One rule again, choosing between the alternatives when there are
	 *  several. */
```

#### body

```text
/** The alternatives a node expands to — normally just itself. A sequence
	 *  carrying an exclusive field choice expands to one alternative per
	 *  branch, and an enclosing CHOICE absorbs them as its own arms instead of
	 *  nesting a second choice inside one arm. That flattening is what keeps
	 *  the arms individually addressable, both to the mint that lifts them
	 *  into kinds and to the variant paths that name them. */
```

#### body

```text
// Rebuild children first, so a choice uncovered deeper has already
// distributed by the time this level inspects its own members.
```

#### body

```text
// Re-expand each arm, so a sequence carrying two such choices
// distributes over both.
```

### `packages/codegen/src/dsl/enrich.ts::applyRepeatUnionFieldPromotion`

```text
/**
 * Pass 6 — repeat-union field promotion: an un-fielded `repeat($._union)`
 * (bare hidden-CHOICE symbol content) gets the whole repeat wrapped in
 * `field('<stripped>', repeat(...))`.
 *
 * A field-keyed read delivers the elements as ONE array in cursor order,
 * under the parser's field. The field name is the union symbol's name
 * stripped of leading underscores — the same name wrapper-deletion
 * derives for the slot, so storage keys are stable.
 *
 * Positions already under a `field()` (authored or override-applied) are
 * owned — never re-wrapped. Grammar-declared supertype repeats that reach
 * enrich un-fielded are equally eligible: "bare at enrich time" IS the
 * unnamed-slot population, since differently-named positions get their
 * field from overrides before enrich runs.
 */
```

#### body

```text
// Names owned by fields that existed BEFORE this pass — those positions
// (or their siblings) claimed the name deliberately; never shadow them.
```

#### body

```text
// This pass's own mints, keyed by the union symbol they name. The SAME
// name recurring for the SAME symbol across sibling CHOICE arms is the
// normal shape (each delimiter arm of a token tree carries the same
// repeat) — mutually exclusive at parse time, one shared slot at model
// time. A DIFFERENT symbol wanting an already-minted name is a real
// collision and skips.
```

#### body

```text
// A fielded position is owned — its content is that field's business.
```

#### body

```text
// Repeated/array slots get plural names — same convention
// pluralizeFieldName serves everywhere else in enrich.
```

### `packages/codegen/src/dsl/enrich.ts::makeSymbol`

#### body

```text
// Both runtimes inject the symbol constructor under the SAME name `sym`
// (sittir's `saveAndInjectDslGlobals` shadows tree-sitter's baseline `sym`).
```

### `packages/codegen/src/dsl/enrich.ts::SymbolTarget`

```text
// ---------------------------------------------------------------------------
// Pass 1+3: symbol-to-field promotion
// ---------------------------------------------------------------------------
// Wraps unique bare symbols as field(name, symbol) on non-hidden rules.
// Handles bare, optional(symbol), optional(seq(symbol, anon...)) shapes.
// Guards: skip hidden rules, duplicate symbols, claimed names, _-prefix
// (except supertypes). See compiler-phase-glossary.md for full details.
```

### `packages/codegen/src/dsl/enrich.ts::applySymbolToField`

```text
// skip hidden helpers
```

#### body

```text
// Peel prec wrappers; rebuild on top after field-wrapping.
```

#### body

```text
// Not a top-level seq — check for repeat/repeat1 wrapping a seq.
```

#### body

```text
// Direct-position counts power the duplicate-numbering decision:
// when the same kind appears at >1 direct seq positions, those get
// numbered (`<kind>1`, `<kind>2`). Nested-repeat appearances are
// tracked separately and disqualify direct positions entirely so
// the direct-position field doesn't collide with whatever
// `promoteInsideRepeatMembers` does inside the repeat's seq.
```

#### body

```text
// Supertype-prefixed kinds (`_expression`, `_type`, ...) only
// wrap when the member IS the bare SYMBOL (Shape 1). Wrapping
// Shape 2 (`optional($._expression)`) or Shape 3
// (`optional(seq($._expression, anon))`) adds an enriched FIELD
// inside an OPTIONAL — and user overrides often apply
// `field('newname')` patches to the SAME position via
// `transform()`. `resolveFieldPlaceholder` (transform.ts) only
// peels a direct enriched FIELD; one nested inside OPTIONAL
// survives, producing `FIELD(override, OPTIONAL(FIELD(enriched,
// SYMBOL)))` that downstream codegen can't handle. Non-supertype
// kinds keep the original three-shape behavior — their wrap
// names are the kind itself (e.g. `visibility_modifier`) and
// rarely collide with override targets.
```

#### body

```text
// Nested-repeat counts disqualify direct-position wrapping for any
// kind that also surfaces inside a repeat — splitting it across
// $fields (direct) and $children (inside-repeat) breaks variadic
// factory reconstruction.
```

#### body

```text
// Per-rule sequence counters for numbered-duplicate naming. Reset
// per seq so each numbered-suffix sequence starts at 1 within its
// own outer seq.
```

#### body

```text
// Numbered duplicates: 1-based sequence index per kind.
```

#### body

```text
// Second pass: descend into repeat/repeat1 members whose content is a
// seq. Promotes bare symbols inside the inner seq to field() wrappers.
// Pattern: seq("(", repeat(seq($.attr, $.content)), ")")
// → the repeat member's inner seq gets its bare symbols field-wrapped.
// Pass the combined kindCounts (direct + nested) so the repeat-inner
// pass keeps the same outer-shadow-prevention invariant as before.
```

### `packages/codegen/src/dsl/enrich.ts::applyOptionalKeyword`

```text
// `enrichFieldWrappers` REMOVED — `fieldName` is derived by
// `flattenRules`'s FIELD case (push the field's name onto its content; a
// field never changes terminality) and its SEQ case (retains fieldName on the seq node), with
// `materializeInlinedBody` carrying fieldName through group inlining. Stamping it
// in enrich was premature (nothing reads it before wrapper-deletion); enrich no
// longer stamps the derived slot attributes at all (see also the removed
// `enrichMultiplicityWrappers`). Field naming that enrich INFERS on bare symbols
// still happens in `applySymbolToField` (a real structural promotion, not a
// derived-attr stamp).
```

```text
// Multiplicity / nonterminal are NOT stamped here — they are derived later by
// `flattenRules` (normalize) from the OPTIONAL/REPEAT/REPEAT1/FIELD
// wrapper structure, the single source of truth. Stamping them in enrich was
// premature (nothing reads them before wrapper-deletion) and polluted the
// `nonterminal` slot signal — enrich marked bare `optional(',')` delimiters
// `nonterminal:true`, which wrapper-deletion deliberately does not (a bare
// optional terminal is render-only, not a slot).
```

```text
// ---------------------------------------------------------------------------
// Pass 2: optional keyword-prefix
// ---------------------------------------------------------------------------
```

#### body

```text
// Peel prec wrappers so claimed-name set covers the inner seq.
```

### `packages/codegen/src/dsl/enrich.ts::tryPromoteOptionalNode`

```text
// Peels an optional-shape node (sittir's own OPTIONAL wrapper, or
// tree-sitter's native CHOICE(X, BLANK) sugar for optional()) and attempts
// keyword-prefix promotion on its inner content. `matched: false` means the
// node isn't optional-shaped at all — caller should try other handling.
// `matched: true, result: null` means it IS optional-shaped but promotion
// declined (already claimed, collision, non-keyword inner, etc).
```

### `packages/codegen/src/dsl/enrich.ts::walkOptionalKeyword`

#### body

```text
// tree-sitter's native optional() is sugar for choice(rule, blank()) —
// it never produces a distinct OPTIONAL wrapper, so a CHOICE(X, BLANK)
// arriving here (as opposed to sittir's own optional(), which preserves
// OPTIONAL) IS an optional-shape and must be tried via optionalContentOf
// before falling back to generic per-member CHOICE recursion below.
```

#### body

```text
// Descend through prec wrappers to reach inner seqs.
```

### `packages/codegen/src/dsl/enrich.ts::tryPromoteInnerKeyword`

#### body

```text
// The field is named by the keyword itself. Where a generator needs the name
// as a bare identifier, its own reserved-word rule applies (`safeParamName`,
// `rustFieldIdent`).
```

### `packages/codegen/src/dsl/enrich.ts::ClauseHoistCounter`

```text
// ---------------------------------------------------------------------------
// Pass: clause-hoist — optional(seq(STRING, FIELD…)) → optional(SYMBOL(_N))
// ---------------------------------------------------------------------------
// Hoists `optional(seq(...))` whose seq contains ≥1 STRING and ≥1 FIELD
// member into a hidden rule `_<parent>_optional<N>` injected into
// `base.grammar.rules`, so tree-sitter (kindId) AND the IR (evaluate→link)
// both see it from one source. This matches detectClause's exact predicate
// (link.ts:2043–2045) so the pass covers precisely the clause-shaped optionals.
//
// Predicate: `members.some(isString) && members.some(isField)` — no
// restriction on seq member count; multi-member seqs (string + field1 +
// field2) also match. Does NOT fire on:
//   - optional(field(X))         — no inner seq
//   - optional(seq(field, field)) — seq has no string
//   - optional(seq(symbol, …))   — seq has no field
//
// Handles both the sittir-shape `optional(seq(...))` and the tree-sitter-
// normalized `CHOICE[seq, BLANK]` form (same descent as the existing
// optionalContentOf helper).
//
// Collision-aware: when the synthesized name is already claimed in
// `rulesBag` (base.grammar.rules), skip with a stderr notice.
//
// Naming: `_<parentKind>_optional<N>` (per-parent 1-indexed counter);
// cross-parent dedupe via canonicalStringify (same convention as
// auto-groups.ts synthesizeGroupName).
```

### `packages/codegen/src/dsl/enrich.ts::ClauseHoistCounter.opt`

```text
// Counts ALL optional(seq) positions in traversal order — both clause
// (which enrich hoists) and non-clause (which applyAutoGroups hoists).
// Keeping the counter global across both kinds ensures that the numbers
// enrich assigns to clause-seqs never collide with the numbers
// applyAutoGroups assigns to non-clause-seqs in the same parent.
//
// Example: index_signature has two optional(seq) positions:
//   pos 1 — non-clause seq(sign_field, ...)   → applyAutoGroups takes _optional1
//   pos 2 — clause seq('readonly', field(...)) → enrich takes _optional2
// If enrich started its own counter at 1, it would emit _optional1 and
// collide with applyAutoGroups's emission for the non-clause position.
```

### `packages/codegen/src/dsl/enrich.ts::ClauseHoistCounter.grp`

```text
// Counts inline-UNSAFE positions surfaced as visible content-aliases
// (`_<parent>_group<N>`). Independent of `opt` — the visible-alias name
// space is distinct from the hidden hoist name space, and applyAutoGroups
// is disabled this chunk so there is no cross-pass numbering to keep in
// sync for the visible groups.
```

### `packages/codegen/src/dsl/enrich.ts::ClauseHoistCounter.arm`

```text
// Counts CHOICE-arm mints surfaced as visible content-aliases
// (`_<parent>_arm<N>`). Separate from `grp`: an arm of a choice and a
// nested sequence group are different constructs and carry different
// name suffixes (armN vs groupN).
```

### `packages/codegen/src/dsl/enrich.ts::ClauseHoistCounter.supertypeNames`

```text
// DECLARED supertype names (grammar's `supertypes:` array, base +
// overrides — never structurally inferred). mintStructuredChoiceArm
// declines symbol arms referencing these: a declared supertype is
// already a dispatchable union (subtype expansion IS its identity);
// wrapping it in a mint alias adds a CST wrapper node to every tree it
// appears in and severs its wrap-time concrete-kind expansion (which
// keys on `instanceof AssembledSupertype`). Carried on this per-rule ctx
// bag (§7.7 Principle #14) because it already travels through every
// applyClauseHoist recursion into the mint site.
```

### `packages/codegen/src/dsl/enrich.ts::InlineSeparatedListRun.body`

```text
/** The run's synthetic seq body — the exact members slice, reusable as a
	 *  hoisted rule body. */
```

### `packages/codegen/src/dsl/enrich.ts::detectInlineSeparatedListRuns`

```text
/** @internal — flank-carrying separated-list runs INLINE among a seq's
 *  members (a list that shares its seq with delimiters/other content, e.g.
 *  `'(' repeat(seq(rule, ';')) optional(rule) ')'`). Each window of 3 then 2
 *  adjacent members is offered to {@link separatedListBodyInfo} as a
 *  synthetic seq. A run spanning the WHOLE member list is not reported —
 *  that is the seq body itself, owned by the whole-body paths. Consumed by
 *  the proposal count AND by the seq-descent run hoist. */
```

#### body

```text
// A window member "carries" the list's repeat either directly or one seq
// level down (`commaSep1` nests `[elem, repeat(sep elem)]` as a sub-seq
// with the flank as a SIBLING member; macro_definition nests the whole
// tail run as one sub-seq member) — separatedListBodyInfo's nested-head
// splice unpacks these, this predicate only pre-filters.
```

#### body

```text
// A size-1 window is a nested whole-list sub-seq member — offer it
// directly (the ≥2-member synthetic path is for flat/sibling runs).
```

#### body

```text
// Only the empty-matchable `repeat(elem sep) elem?` family
// (macro_definition) is a hoistable tail run — it rewrites to
// an optional classic list of the SAME language. A REPEAT1
// tail, or a tail continuing a mandatory elem-sep pair member
// before it (tuple_expression's `pair pair* elem?` — the
// single-element-tuple constraint), is NOT a plain separated
// list; those stay inline.
```

### `packages/codegen/src/dsl/enrich.ts::collectSeparatedListNameProposals`

```text
/**
 * @internal — grammar-global proposal counts for separated-list kind names:
 * how many DISTINCT flank-carrying list bodies would claim each pluralized
 * element name. A name with count 1 is globally unique and the list kind may
 * take it bare (`use_clauses`); a contested name forces the composite
 * fallback. Identical bodies (by {@link ruleKey}) count once — they dedupe to
 * a single mint anyway. Computed AFTER the field-wrap loop (enrich() loop 1)
 * and consumed by every mint in loop 2 via {@link separatedListNameCounts}.
 */
```

#### body

```text
// Same pre-fold the hoist applies: pull a stranded trailing
// `optional(sep)` into its list so the shapes counted here match
// the shapes the mints will see.
```

### `packages/codegen/src/dsl/enrich.ts::promoteHiddenListRef`

```text
/**
 * @internal — a bare SYMBOL reference to a hidden rule whose ENTIRE body is
 * a flank-carrying separated list (python's `_import_list`) gets wrapped in
 * a visible alias: the rule IS the per-instance-fact carrier, so its splice
 * must surface as a node. The visible name follows the settled separated-
 * list chain (bare pluralized element name when globally unique, then
 * `<base>_<field>`, then `<base>_elements`) and is cached so every
 * reference agrees. Returns the member unchanged when it is not such a
 * reference.
 */
```

### `packages/codegen/src/dsl/enrich.ts::promotePermutationArmKeywords`

```text
/**
 * Normalize a permutation choice's arms (`isPermutationChoice`) so every raw
 * word-shaped keyword step carries the same marker-field shape the
 * optional-keyword pass gives optional spellings: a REQUIRED keyword in one
 * arm and `optional('<kw>')` in a sibling are the same modifier slot, and
 * slot merging needs both spelled `field('<kw>', $._kw_<kw>)`.
 * Scoped to permutation arms only — global bare-keyword promotion is
 * deliberately off (it shifts parser tables grammar-wide).
 */
```

### `packages/codegen/src/dsl/enrich.ts::mintStructuredChoiceArm`

#### body

```text
// See visibleGroupSynthName's doc comment — same field-derived naming as
// applyClauseHoist's OPTIONAL-position callers thread in; only those
// callers pass a value, seq/choice-member callers correctly omit it (a
// member is a distinct position, not "the field's content" as a whole).
```

#### body

```text
// Descend through a precedence wrapper (PREC/PREC_LEFT/PREC_RIGHT/
// PREC_DYNAMIC — tree-sitter's own dsl.js prec shape, now matched under
// sittir's runtime too, see evaluate.ts's `prec`). Mint on the CONTENT,
// then re-wrap the resulting alias/symbol-ref IN THE SAME PREC — not the
// other way around. Tree-sitter's LR conflict resolution needs the
// precedence visible AT THE CHOICE-ARM POSITION (where this alternative
// competes against its siblings), not buried one level down inside the
// minted hidden rule's own body: a bare alias at the arm position carries
// NO precedence signal to the enclosing choice's own conflict resolution,
// which is exactly what broke typescript's `binary_expression`'s `in`
// arm — extracting it left `for (var x = y in z)` unable to disambiguate
// against `_initializer` (no explicit conflict references the new
// symbol). Embedding the alias inside the prec (not the reverse)
// preserves the SAME precedence signal, in the SAME position, that the
// un-extracted `prec.left(N, seq(...))` arm carried before minting.
// Without this branch at all, a PREC-wrapped arm's `type` matches neither
// `isSymbolType` nor `isSeqType`/`isChoiceType` below and this function
// declines — the original divergence this branch closes.
```

#### body

```text
// Thread this prec wrapper down as `ambientPrec` (mirrors
// `applyClauseHoist`'s `innerAmbientPrec` at the analogous descent) so
// `visibleGroupSynthName` also applies it to the minted hidden rule's
// OWN body, not only to the outer alias re-wrapped below. A choice arm
// like `prec('call', seq(field('function', choice($.expression, ...)),
// ...))` carries an ambiguity (here: `expression` reaching
// `instantiation_expression`) INSIDE that seq — the precedence needs to
// stay in scope there too, not just at the arm position, or the
// internal conflict falls back to unrelated lookahead-sensitive
// tie-breaking instead of the precedence the un-extracted grammar
// used to resolve it with.
```

#### body

```text
// Hidden-ness by NAME (`_` prefix — tree-sitter's own convention), NOT
// the constructor-stamped `hidden` attribute: the stamp exists only
// under sittir's runtime. Under tree-sitter's CLI runtime (the bundled
// grammar.js executing this same code), `sym()` produces no `hidden`
// property, so a stamp-based check silently declines the mint on the
// parser side while the IR side mints — the exact phantom-kind
// divergence this file's mints kept hitting.
```

```text
// already a real/visible kind — fine as-is
```

#### body

```text
// DECLARED supertype arm (grammar `supertypes:` array — a declared
// fact, never structural inference): decline. A declared supertype
// is already a dispatchable union — its subtype expansion IS its
// runtime identity — so a mint adds nothing, while the alias wrapper
// it introduces (a) inserts a CST node level into every tree the
// supertype appears in, and (b) severs the supertype's wrap-time
// concrete-kind expansion (keyed on `instanceof AssembledSupertype`).
// Empirically: minting python's `_compound_statement` arm produced
// `statement_group2` wrappers that broke wrap universally (0/115).
```

#### body

```text
// Enrich's OWN synthesized helpers (`_<parent>_optional<N>` clause
// hoists and prior group mints — every key in `clauseGroupRules`, a
// declared set, no inference): decline. These are inline-SAFE by
// construction — their whole design is "hidden helper, spliced away
// via `inline:`" (syntheticInline). Promoting one as a choice-arm
// mint puts it in `visibleGroupHiddenNames`, which the un-inline
// sidecar then removes from `inline:` — the exact opposite of the
// helper's contract (rust: `_block_optional1` et al vaporized,
// fixtures 399→41).
```

#### body

```text
// STRUCTURALLY supertype-shaped arm (bare choice-of-symbols union,
// `isSupertypeLike`): decline, same rationale as the declared gate
// above — a dispatch union's subtype expansion IS its runtime
// identity, and the mint's alias wrapper both reshapes every tree
// the union appears in and severs wrap-time concrete-kind expansion.
// Complements (does not replace) the declared gate: covers undeclared
// unions like `_expression_ending_with_block`. Shape-only test, so
// both runtimes decline identically — the prec-transparency
// divergence (sittir minted this arm, the CLI never saw it as a
// SYMBOL) cannot recur for this class.
```

#### body

```text
// Same structural-union decline as the SYMBOL branch above: a bare
// choice-of-symbols arm IS a dispatch union in place (the spliced
// body of a supertype-shaped hidden rule reaches this branch when a
// prior pass inlined the ref) — minting it wraps the union. See
// `isSupertypeLike`'s doc comment for the two-runtime rationale.
```

#### body

```text
/* Permutable-modifier choice offered whole (optional-position path):
		   same decline as the per-arm path — the markers collapse into the
		   parent's own slots instead of minting a group kind. */
```

A promoted arm's body is re-registered with `annotations.hoisted` stamped: the
promotion is a mint, and the seat it declares is what link collects.


### `packages/codegen/src/dsl/enrich.ts::synthesizeFieldEnumRules`

Each enum rule it adds is recorded in `ruleOrigins` as a `field-enum` mint.

```text
// ---------------------------------------------------------------------------
// Field-enum synthesis — promote inline field-enums to named hidden rules
// ---------------------------------------------------------------------------
//
// `field('operator', choice('+', '-', …))` has no catalog row of its own —
// tree-sitter never sees a name for the choice, only the anon tokens it
// collapses to — the phantom-kind class documented in
// docs/superpowers/specs/2026-07-30-kindid-invariant-restoration.md §1.
// Mints a named hidden rule for each distinct field-enum member set directly
// into the rules bag here, at enrich time, so BOTH runtimes (tree-sitter's
// CLI and sittir's evaluate()) see the same name and tree-sitter issues it a
// real symbol.
//
// `compiler/evaluate.ts`'s post-pass version of this same mechanism is
// DELETED, not still running as a verification pass over it (spec
// docs/superpowers/specs/2026-07-30-kindid-invariant-restoration.md §1 calls
// for the post-pass to become assertion-only; that follow-up hasn't landed
// yet). Concretely: `enrich(base)` runs before `wire()` applies overrides
// (see e.g. `packages/typescript/grammar.sittir.ts`), so a field-enum shape
// introduced only by an override is invisible to this pass and nothing
// synthesizes it — a known, currently-unexercised coverage gap, not a
// silently-caught case.
//
// Ported from evaluate.ts's post-pass version of the same name; differs only
// in operating on the enrich-time `Rule` shape (dual-runtime, pre-link) and
// dropping evaluate's `EvaluateCtx`/provenance bookkeeping and its
// multi-generation `purgeSupersededEnumRules` cleanup — enrich runs exactly
// once per grammar load, so neither applies here.
```

### `packages/codegen/src/dsl/enrich.ts::walkFieldEnums`

#### body

```text
// Peel one level of repeat/repeat1 wrapper so that
// `field(name, repeat(choice('a','b')))` is treated the same as
// `field(name, choice('a','b'))` for occurrence collection purposes.
// The repeat wrapper is preserved in the rewrite pass below.
```

#### body

```text
// Always recurse into content — a field can nest other fields.
```

### `packages/codegen/src/dsl/enrich.ts::buildCanonicalEnumNames`

#### body

```text
// Group occurrences by memberKey.
```

#### body

```text
// One O(rules) pass building memberKey → existing rule name, rather than
// rescanning every rule for every distinct occurrence group below.
// Candidates are collected per key, then resolved to the lexicographically
// smallest name — NOT first-registration-wins over `Object.entries`
// iteration order, which is insertion-order-dependent and therefore not
// guaranteed identical between sittir's own runtime and tree-sitter's CLI
// (the same live hazard `project_grammar_js_nondeterministic_reorder`
// documents for python's `grammar.js`). A pick that depends on host
// iteration order can choose DIFFERENT existing names under the two
// runtimes for the same member set — minting the exact class of
// runtime-divergent phantom this pass exists to eliminate.
```

### `packages/codegen/src/dsl/enrich.ts::deriveCandidateName`

#### body

```text
// Priority 0: some existing rule, anywhere in the grammar, already has
// this exact member set — reuse ITS name verbatim (whatever it is,
// visible or hidden), regardless of whether this occurrence's field
// happens to share that name. Two rules with identical string-choice
// bodies are the same production to tree-sitter; minting a second one
// creates a real, separately-symbolized duplicate the LR table
// generator then has to disambiguate against the original (e.g.
// `_accessibility_modifier` vs the pre-existing `accessibility_modifier`).
```

#### body

```text
// Priority 2: shared field name across ≥2 distinct parent kinds.
```

#### body

```text
// Priority 3: fallback — first parent + field name.
```

### `packages/codegen/src/dsl/enrich.ts::rewriteFieldEnums`

#### body

```text
// Replace the field's inline content with the replacement content rule.
// For bare enum: symbol(enumKindName).
// For repeat/repeat1(enum): repeat/repeat1(symbol(enumKindName)).
```

#### body

```text
// Content isn't an enum candidate — recurse to find nested fields.
```

### `packages/codegen/src/dsl/enrich.ts::tryExtractFieldEnum`

#### body

```text
// Peel one level of repeat/repeat1 wrapper so `field(name, repeat(enum))`
// is handled alongside `field(name, enum)`. The wrapper type is remembered
// so the rewrite can restore it around the synthesized symbol reference.
```

#### body

```text
// The body is the plain choice of members, without a precedence: wire
// inlines every `field-enum` mint (`getEnrichFieldBackings`), so it is never
// a nonterminal of its own for a precedence to rank. A precedence on an
// inlined body would still rank the productions it is folded into.
```

#### body

```text
// Already the canonical reference — nothing to rewrite. Without this,
// every occurrence gets rebuilt through the branch below even when it's
// already correct, and since that branch hand-built its SYMBOL rather
// than routing through the shared constructor (see below), the rebuild
// alone used to leak a spurious `hidden` field into tree-sitter-side
// grammar.json for zero semantic effect.
```

#### body

```text
// Route through the shared `makeSymbol` constructor so the ref carries
// the SAME construction stamps (`hidden`, `inline = name.startsWith('_')`)
// as every other ref under sittir's runtime — hand-building
// `{ type: 'SYMBOL', ... }` here skipped `inline`, which normalize's fold
// treats as authoritative.
```

### `packages/codegen/src/dsl/enrich.ts::resolveToEnumMembers`

#### body

```text
// `isEnumChoiceRule` also accepts a literal-carrying SYMBOL arm, but
// `.literal` is a link-phase stamp that doesn't exist yet at enrich
// time, so at this phase the predicate reduces to the same
// all-STRING check this function always needed — one canonical
// "what counts as an enum-shaped choice" instead of a second copy.
```

#### body

```text
// A bare single STRING is never a field-enum candidate — that's exactly
// the class of hidden single-literal rules (e.g. `_kw_<name>`) already
// minted by an earlier enrich pass. A genuine field-enum is inherently a
// CHOICE of ≥2 alternatives; unlike evaluate.ts's post-pass, this
// enrich-time pass runs against those very hidden rules, so it must not
// match STRING here or one level through SYMBOL (below) — doing so once
// hijacked `_kw_async`'s reference into a spurious re-synthesized name.
```

#### body

```text
// Follow one level of symbol indirection.
```

### `packages/codegen/src/dsl/enrich.ts::resolveToEnumMembersOneLevelDeep`

#### body

```text
// A synthesized field-enum's own body is `prec(-1, …)`-wrapped; peel it so
// it still resolves as a reusable CHOICE/STRING enum. `isPrecWrapper`
// (not a bare `type === 'PREC'` check) so a user-authored rule wrapped in
// `prec.left`/`prec.right`/`prec.dynamic` around a choice-of-strings is
// just as reusable as one wrapped in plain `prec`.
```
### `packages/codegen/src/dsl/rule-attrs.ts::structuralKey`

```text
/** A rule's grammar shape as a string — `id` / `absorbedIds` (identity
 *  provenance, distinct per occurrence) excluded. The one comparison every
 *  structural equality goes through: `flatten`'s arm factoring,
 *  `simplify`'s arm merge and fixpoint test. Comparing whole-rule JSON
 *  would make every position differ by its ids. */
```


### `packages/codegen/src/dsl/enrich.ts::withContent`

The one place enrich rebuilds a wrapper around new content. Every rebuild
site used to spread-and-assert inline; the assertion needs a rule shape that
carries `content`, and with GROUP/VARIANT gone from the rule union the
inline literals no longer type-checked. One helper, one cast.

### `packages/codegen/src/dsl/primitives/preference.ts::preference`

A preference's arm: the value chosen at the site an `options:` key addresses.
The key is the address, so the arm is all a preference carries.

A choice is addressable because it is a choice, not because anything labelled
it. What names a site for a reader is the `options:` key, and a binding maps
one address onto another key, so a name never has to be stamped onto the arms
themselves.

### `packages/codegen/src/dsl/primitives/preference.ts::isPreference`

```text
/** Whether a patch value is a preference placeholder. */
```

### `packages/codegen/src/dsl/enrich.ts::hoistTokenForms`

The unconditional token-form hoist, one pass over every rule before clause hoisting: the body is distributed over its outermost form alternation (`distributeTokenForms`); each arm is minted as a visible group of the `arm` flavor through `visibleGroupSynthName` and referenced by a group-lift symbol, so the arms are reachable by path patches through the lift and a `variant()` on the parent's arms renames them (`renameEnrichLift`), exactly as for any other enrich-minted arm. The rule becomes a choice of the minted symbols and its name is pushed onto `parents`, which enrich appends to the grammar's supertypes. Minted arms get a visible-group source entry and the parent as owner, like every other enrich mint, so `collapseSingletonMintOrdinals` drops the ordinal from a lone unnamed arm. The grammar's `word` rule is left alone too: keyword extraction needs it to stay one token. A rule the grammar declares in `externals` is left alone: the scanner produces that token, and tree-sitter rejects a name that is both an external token and a non-terminal.

The hoist recurses: each minted arm's body is hoisted in turn under the arm's own name, so an arm that is itself a token over a form alternation becomes a nested parent, listed as a supertype like the top-level one, with its own minted arms. A nested parent keeps `tokenForm` but is never stamped `hoisted` (enrich's group-stamping pass skips every name in `parents`): it is a supertype, and a `hoisted` stamp would make link skip its supertype promotion and assemble classify it as a compound.

Only unfielded alternations are split. `fielded` lists the index paths, relative to this rule, where the authored patches put a `field()` (`authoredFieldSites`); a choice at one of those paths is a field's value and stays one lexeme, as does anything under a `FIELD` node. Each arm's recursion receives the sites under its own index.

### `packages/codegen/src/dsl/enrich.ts::annotateTokenFormArms`

Labels a token-form parent's arms once its mints are final: each arm gets
`variant` from the one naming rule (`armNameOf` over the arm's
underscore-less name, with the parent's supertype-ness from
`isSupertypeOwner`), `variantOf` the parent, and the preferred arm
(`defaultTokenFormArm`) `default: true`. The labels land on the choice under
any `PREC` wrappers (`throughPrec`).

### `packages/codegen/src/dsl/enrich.ts::defaultTokenFormArm`

The arm a token-form parent's own factory builds from a bare value. Among the arms whose body holds at least one pattern, the one with the fewest enum choices (a choice of literals is a slot the caller must fill), then the fewest leaves; ties go to the first arm, and a parent with no pattern arm defaults to its first. It is a heuristic and the author overrides it with `variant(name, { default: true })`.

### `packages/codegen/src/dsl/enrich.ts::appendGrammarNames`

Appends rule names to one of the grammar's name lists (`supertypes` or `externals`), whether it is an array or a `$ => [...]` function, skipping names already listed. An array takes each name through `entryOf` (a bare name for `supertypes`, a SYMBOL entry for `externals`, matching how the base grammar holds each list); a function appends `$[name]`. The token-form parents and `_layout` join `supertypes` here so tree-sitter treats each as a supertype, and the whitespace members the upstream grammar lacks join `externals`.

### `packages/codegen/src/dsl/enrich.ts::ENRICH_WHITESPACE_KEY`

The non-enumerable key under which enrich leaves its whitespace sidecar (`EnrichWhitespaceSidecar`) on the enriched grammar, for `wire()` to merge into `visibleExternals` and the wire context.

### `packages/codegen/src/dsl/enrich.ts::EnrichWhitespaceSidecar`

The part of `EnrichedWhitespace` wire reads: the members' render `bodies` and the upstream `collisions`.

### `packages/codegen/src/dsl/enrich.ts::getEnrichWhitespace`

Reads the sidecar enrich left under `ENRICH_WHITESPACE_KEY`; a grammar enrich did not produce has no bodies and no collisions.

### `packages/codegen/src/dsl/wire/symbol-renames.ts::renameRule`

Applies a rename map to every `SYMBOL` name and every `variantOf` arm owner in a value, however deep, following chains (`a` renamed to `b` renamed to `c` resolves to `c`). `wire()` runs it, at the end of its own assembly, over `reserved`; the list-shaped callbacks (`extras`, `externals`, `precedences`) go through `renameNameList`, since sittir's evaluate hands them base entries as bare names, reading the live rename map when the callback runs so it sees every rename registered while the rules evaluated. A rename registered by a `variant()` on an enrich-minted arm therefore reaches every reference, not only the rule bodies. A changed node is copied, never written: the copy is built from the original's property descriptors with the renamed values set in them, so a frozen input (the enriched base) copies cleanly.

A `variantOf` annotation names a rule as well, so it follows the same map: when a `variant()` renames an enrich-minted parent whose arms were already stamped with that parent as owner, the arms' `variantOf` moves with it. Without that, a renamed nested token-form parent would keep arms owned by its minted name, and the flattened-parent derivation would reject them.

### `packages/codegen/src/dsl/wire/symbol-renames.ts::renameNameList`

The same rename for the lists tree-sitter holds as names (`conflicts`, `inline`, `supertypes`): bare strings and symbol entries both. Callbacks are wrapped only for keys the config defines or the base grammar declares (`baseDeclares`), since tree-sitter rejects a callback for a property that must be an object (`reserved`) or that the grammar lacks; a wrapper for a key the config leaves out returns the base's value renamed.

### `packages/codegen/src/dsl/enrich.ts::replaceExtras`

A token-form parent that the grammar lists in `extras` is replaced there by its minted arms (`tokenFormArms`, read from the parent's final members after ordinals collapse), for an array of rules, an array of bare names (what sittir's evaluate holds) or a `$ => [...]` function alike. The arms are then renamed with everything else when `variant()` names them, so a grammar no longer restates its extras to swap a parent for its arms.

### `packages/codegen/src/dsl/rule-transforms.ts::DistributeAliasCtx`

```text
The one fact distribution needs from the grammar: the body of an inlined rule (`inlineBodyOf`, undefined for
anything not in `inline`).
```

### `packages/codegen/src/dsl/rule-transforms.ts::distributeInlineAliasChoices`

```text
Applies tree-sitter's alias semantics to an alias over a choice: `alias(choice(a, b), $.t)` becomes
`choice(alias(a, $.t), alias(b, $.t))`, recursively through nested choices, whether or not `t` is a rule of its own.
Each arm keeps its own storage with `t` as display — a keyword aliased to `identifier` is stored as the keyword's
own symbol, which is what a read of that node reports. An inlined rule has no symbol of its own (tree-sitter
substitutes its body), so an alias over an inlined choice rule, or an inlined choice rule among the arms,
contributes that rule's arms: rust and typescript `alias($._reserved_identifier, $.identifier)` becomes one
`alias('<keyword>', $.identifier)` per keyword, the shape python writes directly. Any other symbol arm is aliased
as it stands.

A distributed alias that is itself a member of a choice splices its arms into that choice: a nested choice there
would be lifted into an arm rule of its own, a visible kind the parser would then build. Runs in enrich, so
tree-sitter's grammar and sittir's evaluate see the same arms. It is the only place distribution happens:
distributing earlier on one side only would hand the two enrich runs different shapes.
```

### `packages/codegen/src/dsl/rule-transforms.ts::LiteralAliasStorage`

The result of `mintInlineLiteralAliasStorage`: the rewritten rules and the storage rule names it minted.

### `packages/codegen/src/dsl/rule-transforms.ts::mintInlineLiteralAliasStorage`

```text
An inline named alias over a choice of literals whose display is not a rule
(rust `alias(choice('u8', ...), $.primitive_type)`) has no storage symbol, so
tree-sitter reports every literal under one shared id the catalog cannot
name. Mint the storage: one hidden rule `_<display>` holding the literal
choice, shared by every site of that display, and each site becomes
`alias($._<display>, $.<display>)`. Returns the rewritten rules together
with the minted storage names, which enrich records as
`literal-alias-storage` origins. A display whose sites disagree on the
literal set is left to distribution rather than guessed. Runs in enrich
before distribution, so both executions mint the same rule; a precedence
the new reduction point needs is authored as an override on the minted
rule, which the grammar sees as `original`.
```

### `packages/codegen/src/dsl/rule-transforms.ts::InlineTextTokens`

The result of `mintInlineTextTokens`: the rewritten rules and the text-token rule names it minted.

### `packages/codegen/src/dsl/rule-transforms.ts::peelPrec`

The rule under any chain of PREC wrappers.

### `packages/codegen/src/dsl/rule-transforms.ts::isTerminalRootRule`

Whether a rule, under its PREC wrappers, is a PATTERN, a STRING or a token: a rule tree-sitter compiles to one lexical token of its own.

### `packages/codegen/src/dsl/rule-transforms.ts::isLiteralOnlyRule`

Whether a rule, under PREC and token wrappers, is only literal text: a STRING, or a CHOICE or SEQ of literal-only members. A hidden rule of this shape has fixed text, so its content is never lost when the parser hides it.

### `packages/codegen/src/dsl/rule-transforms.ts::tokenBodyKey`

The identity of a token body, compared the way tree-sitter compares tokens: the rule's JSON without the sittir-side `annotations`, `metadata`, `id` and `hidden` stamps. `mintInlineTextTokens` shares a minted rule among sites with one key, and `auxTokenKinds` finds the named rules tree-sitter folds onto one token.

### `packages/codegen/src/dsl/rule-transforms.ts::mintInlineTextTokens`

Names every inline text token of a non-terminal rule. A text token is an unnamed PATTERN, or a TOKEN / IMMEDIATE_TOKEN whose content (after peeling PREC) is not a STRING: the shapes tree-sitter otherwise extracts as an anonymous auxiliary token (`<rule>_token<n>`), which the reader cannot tell apart from the text around it. Sites with the same body (`tokenBodyKey`) share one minted rule, as tree-sitter shares one auxiliary token among them.

Names come from `ctx.namingRules`, which defaults to `rules` itself. Enrich passes the upstream rules, so a site named after the rule that held it upstream keeps that name after enrich lifts it into a hoisted arm (rust `line_comment_text1`, not the lifted arm's name). A body is named after the first rule in naming order that holds it, with any leading underscores dropped: `<owner>_text`, or `<owner>_text1..n` in site order when that owner holds more than one body. A body enrich produced that has no upstream site is named after its owner in `rules`. Only the names still referenced are minted.

The minted rule is the body without its site annotations. Each site becomes a reference to it that keeps the site's annotations (`variantOf` and the like belong to the arm, not to the token), and `owners` lists the rules that reference each minted name. The walk does not descend into a named ALIAS (the alias already names its content) or into a token (a token is one site). A rule whose root is a terminal is skipped, since it is already a named token. `ctx.symbol` builds the reference in the calling runtime's own shape. A minted name the grammar already uses is an error.

Enrich runs it after its hoists and automatic-variant stamping, so it does not change any shape enrich decides. Wire then addresses a patch that lands on a minted reference through the mint (`transform/transform.ts::resolvePatch`).

### `packages/codegen/src/dsl/rule-transforms.ts::TextTokenMintCtx`

What `mintInlineTextTokens` needs beyond the rules it rewrites: `symbol`, the reference builder in the calling runtime's shape, and `namingRules`, the rules whose sites name each body.

### `packages/codegen/src/dsl/rule-transforms.ts::TextSiteCtx`

The per-site rewrite `mapTextTokenSites` applies: `visit` returns what replaces a text-token site.

### `packages/codegen/src/dsl/rule-transforms.ts::isTextTokenSite`

True for an unnamed PATTERN, or a TOKEN / IMMEDIATE_TOKEN whose content after peeling PREC is not a STRING: the shapes tree-sitter would extract as an anonymous auxiliary token.

### `packages/codegen/src/dsl/rule-transforms.ts::mapTextTokenSites`

Rewrites every text-token site of a rule through `ctx.visit`, stopping at a site (a token is one site) and at a named ALIAS (the alias already names its content).

### `packages/codegen/src/dsl/rule-transforms.ts::liftAliasedHiddenRuleBodies`

```text
A hidden rule whose whole body is a named alias over non-symbol content (rust `_reserved_identifier:
alias(choice('default', 'union', 'gen'), $.identifier)`) becomes that content, and every reference to it becomes the
alias over the reference — the shape typescript writes upstream. A reference that is already the direct content of
an outer alias keeps only the outer one, which is the name tree-sitter reports. Runs before
`distributeInlineAliasChoices`, so a lifted inline rule is then read through like any other alias over an inline
symbol.
```

### `packages/codegen/src/dsl/rule-transforms.ts::OverloadedDisplayCtx`

```text
The `SymbolSource` `unaliasOverloadedDisplays` classifies storages with (enrich passes the predicted source over the enriched rules).
```

### `packages/codegen/src/dsl/rule-transforms.ts::unaliasOverloadedDisplays`

```text
Gives every display name one parser identity. A display is overloaded when named alias sites put storages of
different parser classes under it. Each storage is keyed by its symbol, or by its content when inline, and marked
terminal when tree-sitter would give it a token (`SymbolSource.isTerminal`; an inlined symbol is judged by its body).

- Display that is a rule of its own: sites over the rule itself stay. When the display rule is terminal, terminal
  storages stay too — tree-sitter reuses the display's symbol for them (a keyword aliased to `identifier` is
  `sym_identifier`). Every other storage is split off.
- Display with no rule: two or more nonterminal storages are all split; a single nonterminal among terminals is
  split unless its stripped name is the display, in which case the terminals' aliases are dropped instead.

Storages are classified by the predicted catalog of the enriched rules, so a storage under an alias site no rule
reaches has no row and is a nonterminal, as tree-sitter issues it no symbol. Splitting drops the alias over a
visible symbol or an inline literal, renames the alias over a hidden symbol to the
symbol's name without underscores (or `<display>_<name>` when that is taken; a free name is required, else it
throws), and throws for an inline nonterminal, which needs a rule of its own. Runs in enrich, so the parser and the
model see the same kinds.
```

### `packages/codegen/src/dsl/rule-transforms.ts::innermostNamedAliasContent`

```text
The content under a chain of named aliases.
```

### `packages/codegen/src/dsl/enrich-ctx.ts::EnrichMintKind`

What kind of rule enrich added:
- `keyword`: a `_kw_<name>` rule from `registerKwRule` (inlined by wire);
- `hidden-subsequence`: an inline-safe clause hoist;
- `visible-subsequence`: a visible group, list, structured-arm or token-form lift;
- `literal-alias-storage`: `mintInlineLiteralAliasStorage`;
- `field-enum`: `synthesizeFieldEnumRules` (inlined by wire);
- `whitespace`: the `_layout` supertype.

A mint is a rule enrich adds, so a name the base grammar already has is never one.

### `packages/codegen/src/dsl/enrich-ctx.ts::EnrichRuleOrigin`

Why enrich records a rule name: either a mint (`kind` is an `EnrichMintKind`), or `promoted-group`, an upstream hidden rule enrich exposes through an alias; the rule itself is unchanged. A `promoted-group` entry carries `visibleName`, the name the parent's arm aliases the rule to, so no reader re-derives the pairing from the underscore convention. It is the only origin that is not a mint. A `text` entry is a text token `mintInlineTextTokens` minted, and it carries `owners`, the rules that reference it. An `element-supertype` entry is the hidden supertype minted for the element choice of a list (`registerElementSupertype`); it carries `slot`, the name of the slot its elements fill, and `authoredSlot`, whether an authored `field()` patch gave that name.

### `packages/codegen/src/dsl/enrich-ctx.ts::EnrichCtx`

The one shared context of an `enrich()` call. It carries the values every enrich pass reads or fills: the base grammar's rules (`rulesBag` — mutated in place when the clause hoist annotates an existing hidden rule it promotes), the grammar's supertypes, externals, inline names and word matcher, the authored group bodies enrich declines to mint (`authoredGroupBodies`, empty unless the call came through `sittirGrammar`), and the per-call mint registries (`kwRules`, `clauseGroupRules`, the clause and visible-group dedupe maps, `ruleOrigins`). `ruleOrigins` is stamped at each site that adds a rule, with the rule's `EnrichMintKind`, and where an upstream hidden rule is exposed through an alias (`promoted-group`); `enrich()` attaches it to its result as the one rule-origin sidecar. Helpers take the ctx instead of threading these as positional parameters; a helper that runs on a *different* rule set (the merged or enriched rules) takes that set as its own parameter, so the two are never confused.

`sourceSymbols` is the predicted `SymbolSource` over the base rules (`enrichSymbolSource`) — the grammar-source facts separator detection reads. It is distinct from the one `enrich()` builds over the enriched rules for `unaliasOverloadedDisplays` at the end (`enrichedSymbols`): the two describe the grammar at different points and are never merged.

`hoist` is present only on the view `enrich()` hands to the clause-hoist loop (`withHoist`). Helpers that are also reached before that loop — `visibleGroupSynthName` from the token-form hoist — read it to tell the two apart: without it they fall back to ordinal naming and skip hidden-list promotion.

### `packages/codegen/src/dsl/enrich-ctx.ts::EnrichCtx.create`

Builds the ctx for one `enrich()` call from the grammar-level inputs, with empty mint registries and no hoist state.

### `packages/codegen/src/dsl/enrich-ctx.ts::EnrichCtx.withHoist`

The clause-hoist view: the same ctx — the registries are shared, not copied, so mints made through the view are the call's mints — with `hoist` set.

### `packages/codegen/src/dsl/enrich-ctx.ts::ClauseHoistState`

State that exists only while the clause hoist runs. `separatedListNameCounts` is the grammar-global count of each proposed separated-list name, computed after the field-wrap and token-form passes and read by every list mint so a name is taken bare only when globally unique. `hiddenListPromotionNames` caches, per hidden rule whose whole body is a flank-carrying separated list, the visible kind every bare reference to it aliases to, so all references agree. `ownerPrefixedListSlots` maps each list kind that was named after its owner (`<owner>_<plural>`, or `<owner>_elements` when the element has no single name) to the slot name its owner gives it: the plural, or `elements`. `visibleGroupSynthName` writes it where it picks the name; `fieldOwnerPrefixedLists` reads it.

### `packages/codegen/src/dsl/enrich.ts::BlankRule`

The empty arm tree-sitter's `optional` writes into a choice. It is a runtime shape the typed rule union does not carry, so a walk over enrich's rules that enumerates every rule type names it beside the union.

### `packages/codegen/src/dsl/enrich.ts::fieldOwnerPrefixedLists`

A kind name must be unique in the grammar; a slot name only within its owner. When a hoisted list kind had to take its owner as a prefix to be unique, the owner's slot should not repeat the owner's name, so the reference is wrapped in a field carrying the short name recorded in `ownerPrefixedListSlots`; the kind keeps its unique name.

Its walk enumerates every rule type: it descends through precedence wrappers, seqs, choices, repeats and optionals, stops at a field, an alias, a token or a terminal, and refuses a type it does not know. It runs once over every owner after the clause hoist, over the grammar's rules and the rules enrich minted alike, since a list can be hoisted out of a minted rule. Positions follow the patch-path convention, so a reference at or under a position an authored `field(...)` patch names is left to the patch. When the short name is already a slot of the owner, the reference stays unfielded, the slot keeps the name its kind gives it, and a `list-slot-name` skip is reported.

### `packages/codegen/src/dsl/enrich-ctx.ts::EnrichCtxInit`

The grammar-level inputs of an `enrich()` call: the base rules, the supertype and inline names, the externals and extras rule lists, the `word` rule's name, and the compiled word matcher.


### `packages/codegen/src/dsl/enrich-ctx.ts::enrichSymbolSource`

The predicted `SymbolSource` of an `enrich()` call over a given rule set: the kind catalog tree-sitter would build from those rules and the ctx's lists (`symbol-table.ts::predictedSymbolSourceOf`). Wire, which runs after enrich, declares the visible externals, so enrich stands in for that declaration: an external with a visible name and no rule body is a visible external. Both of enrich's sources (`sourceSymbols` over the base rules, `enrichedSymbols` over the enriched ones) are built by it.

### `packages/codegen/src/dsl/symbol-table.ts::ParserSymbolTable`

A parser's symbol table as the kind catalog needs it: each symbol's C name with its id, in id order (`symbols`); the name `ts_symbol_names` gives each (`names`); and the per-symbol facts — visible, named, supertype, aliased non-terminal, and the token count (`facts`). The parser.c reader fills one from the generated C source; the catalog predictor fills one from the grammar.

### `packages/codegen/src/dsl/symbol-table.ts::kindTableOfSymbolTable`

The one derivation of the kind catalog's rows from a symbol table and its grammar.json: literal texts (`resolveSymbolTextFacts`), runtime kind names (`deriveSymbolRuntimeName`), lexical ranks (`collectLexicalRanks`), joined per symbol by `joinIdNames`, plus `ERROR_KIND_ROW`. Both sources of a table go through it, so a predicted row and a real row can differ only where the tables do.

### `packages/codegen/src/dsl/symbol-table.ts::ERROR_KIND_ROW`

The catalog row for tree-sitter's builtin ERROR symbol (`ts_builtin_sym_error`), under `ERROR_KIND_NAME` at `ERROR_KIND_ID` from `@sittir/common/error-kind`. parser.c's symbol enum never lists it, since tree-sitter issues it and no grammar declares it, so `kindTableOfSymbolTable` adds it to every table. The TS and Rust kind tables then carry it for every grammar, and a read tree holding an ERROR stays within the ids its transports decode. The row is named, visible and neither an alias nor aux, which is how the parser shows an ERROR node.

### `packages/codegen/src/dsl/symbol-table.ts::literalRuleValue`

```text
/**
 * The literal text a grammar-JSON rule node stands for, when the node is
 * itself a bare `STRING` or an unnamed `ALIAS` wrapping one — the two rule
 * shapes tree-sitter treats as a literal for aliasing purposes. Returns
 * `undefined` for every other rule shape.
 */
```

### `packages/codegen/src/dsl/symbol-table.ts::walkGrammarNode`

```text
/**
 * One pass over the grammar-JSON rule tree, collecting every `STRING`
 * value, every named-ALIAS target name, and every unnamed-ALIAS-of-a-SYMBOL
 * pair (the literal-rule chain `findEntryForLiteralText` falls back to).
 * Recurses into arrays and every object value uniformly, since a rule tree
 * has no fixed shape by node type.
 */
```

### `packages/codegen/src/dsl/symbol-table.ts::ParserSymbolFacts`

The per-symbol facts read from `parser.c` beside the name tables: the symbols in `ts_non_terminal_alias_map`, each symbol's `.visible` and `.named` flags, the symbols flagged `.supertype` (`collectSymbolFlags`), and `TOKEN_COUNT` (`collectTokenCount`), below which every symbol id is a terminal.

### `packages/codegen/src/dsl/symbol-table.ts::collectLexicalRanks`

The lexical precedence of every rule, external and alias display in the compiled `grammar.json`, as a dense rank (0 first). The loose surface builds a bare string as the first admitted text kind in this order, so the order has to follow the facts tree-sitter's lexer uses when two tokens could match the same text. Each name gets a key, compared element by element:

1. externals before rules — the external scanner runs before the internal lexer;
2. higher lexical precedence first — a `PREC` directly inside `TOKEN`/`IMMEDIATE_TOKEN` (`tokenLexicalPrec`);
3. fixed text before a pattern (`isFixedTextRule`) — tree-sitter prefers a string match over a regex match of the same length;
4. position — the index in `externals` or `rules`.

A sittir mint (a `SYMBOL` stamped `metadata.symbolSource: 'group-lift'`) takes its source rule's position followed by its arm order within that rule, so it ranks where its text was declared. A named `ALIAS` display that is not itself a rule takes its storage symbol's key, since the lexer matches the storage token. Ties at the key are broken by name so the order is deterministic.

### `packages/codegen/src/dsl/symbol-table.ts::GrammarJsonRule`

The slice of a `grammar.json` rule node `collectLexicalRanks` reads: type, name, value, `named`, content, members and the `symbolSource` stamp.

### `packages/codegen/src/dsl/symbol-table.ts::LexicalKey`

A lexical sort key: a sequence of numbers compared element by element (`compareLexicalKeys`).

### `packages/codegen/src/dsl/symbol-table.ts::grammarNameOfSymbol`

The grammar name of a parser symbol's C name: `sym_`, `anon_sym_`, `aux_sym_` or `alias_sym_` stripped. It is the key `collectLexicalRanks` rows are looked up by.

### `packages/codegen/src/dsl/symbol-table.ts::compareLexicalKeys`

Element-by-element comparison of two `LexicalKey`s; a key that is a prefix of the other sorts first.

### `packages/codegen/src/dsl/symbol-table.ts::tokenLexicalPrec`

The lexical precedence of a rule: the value of a `PREC` placed directly inside `TOKEN` or `IMMEDIATE_TOKEN`, else 0. A `PREC` outside the token is a parse precedence and does not order the lexer.

### `packages/codegen/src/dsl/symbol-table.ts::isFixedTextRule`

Whether a rule, under its `TOKEN`/`IMMEDIATE_TOKEN`/`PREC` wrappers, is a single `STRING`.

### `packages/codegen/src/dsl/symbol-table.ts::joinIdNames`

Joins a symbol table's C enum to runtime keys, one row per key, and never
throws. Two symbols deriving one key resolve three ways: a named symbol and a
punctuation token share the key by giving the punctuation side the
`PUNCTUATION_KEY_SUFFIX` (Go's `.` becomes `dot_punctuation` beside the named
`dot`) — punctuation meaning not stamped `keyword`, the same fact that gives a
keyword its `KEYWORD_KEY_SUFFIX`, so a keyword clashing with a named rule is a
`KindKeyCollision` with the named rule kept;
an alias symbol folds onto the row it aliases (`parseId`/`parseName`); any
other pair is a `KindKeyCollision`, the first symbol kept and the second left
without a row. The collisions come back beside the rows (`JoinedIds`), and the
predicted catalog turns them into `kind-key-collision` records.

### `packages/codegen/src/dsl/symbol-table.ts::KindKeyCollision`

A key two parser symbols derive, with both C names: the one the catalog kept,
then the one left without a row.

### `packages/codegen/src/dsl/symbol-table.ts::JoinedIds`

What `joinIdNames` returns: the rows by key and the collisions it could not
resolve.

### `packages/codegen/src/dsl/symbol-table.ts::KEYWORD_KEY_SUFFIX`

`_keyword`, the suffix a keyword-shaped anonymous token's key takes after its
own spelling, case kept (C's `_Alignof` becomes `_Alignof_keyword`).

### `packages/codegen/src/dsl/symbol-table.ts::PUNCTUATION_KEY_SUFFIX`

`_punctuation`, the suffix a punctuation token's key takes when a named rule
derives the same key; the named rule keeps the plain key, as a keyword's
`KEYWORD_KEY_SUFFIX` never displaces a named kind either.

### `packages/codegen/src/dsl/symbol-table.ts::ParsedIdEntry`

A catalog row whose parser metadata is present, the shape `joinIdNames` places.

#### body

```text
/* The join key is the **prefix-stripped C symbol name**:
	   `sym__array_expression_list` becomes `_array_expression_list`, distinct
	   from the visible `sym_array_expression_list` (would-be
	   `array_expression_list`). The lookup table `ts_symbol_names[]` is
	   intentionally lossy — it canonicalizes display labels and collapses
	   `sym__as_pattern` and `sym_as_pattern` to the same `"as_pattern"` string —
	   so it can NOT be used as the identity key. The symbol name survives as a
	   diagnostic label on the catalog row. */
```

#### body

```text
/* `_newline`'s `sym__newline` (kept as `existing`, id 101,
			   `ts_symbol_names` label `"_newline"`) and `alias_sym_newline` (this
			   `entry`, id 294, label `"newline"`) both join to key `_newline` —
			   same underlying rule, but the alias occurrence is the ONLY thing
			   that ever displays under the visible name `"newline"` (no plain
			   `sym_newline` exists in this grammar).

			   A node parsed at THIS alias's grammar position always carries the
			   alias's OWN numeric id at runtime (294), never the hidden rule's id
			   (101) — aliasing creates a genuinely distinct parser symbol, not
			   just a cosmetic rename. So when an alias introduces a display name
			   not already covered by `existing`, the alias's id — not the hidden
			   rule's — is what `$type` dispatch must key on for that name.
			   (Cascade: prefer a real `sym_<name>` under that exact visible name
			   if one exists elsewhere in the catalog — `shouldReplaceSymbol`
			   already handles that case before we ever get here — falling back
			   to the alias's id only when nothing else claims the name. An
			   anonymous and a named entry reaching the same key here, after
			   keyword-suffixing has already run, is a genuine naming collision:
			   `joinIdNames` throws rather than inventing a second name for it.) */
```

#### body

```text
/* `id` stays the STORAGE kind id (101, the rule's own truth —
				   `_newline` as a rule, regardless of how/whether it's ever
				   aliased). `parseId` is the separate PARSE/dispatch id: what a
				   node actually carries at runtime when produced through THIS
				   alias (294) — the id every render-dispatch match arm must key
				   on, since that's what tree-sitter really emits. */
```

#### parseName

The fold records the alias's display name as `parseName` beside `parseId` and leaves the row's parser metadata (its own `symbolName`) untouched, so a consumer names the storage id by the row's own symbol and the parse id by `parseName`.

#### lexicalRank

Each row's parser metadata carries the symbol's `lexicalRank` from `collectLexicalRanks`, looked up by the symbol's grammar name (`grammarNameOfSymbol`); `createParserMetadata` stamps it and a symbol with no rule, external or alias display gets none.

### `packages/codegen/src/dsl/symbol-table.ts::collectGrammarFacts`

Ground truth for a symbol's literal text and alias status, read once from the compiled grammar.json rather than re-derived per symbol: `aliasTargets` maps every named `ALIAS` target to the set of literals aliased to it (a `STRING` content, seen through `token`/`prec` wrappers — see `aliasedLiteral`; a symbol-content alias contributes the name with no literal), and `literalRules` records the named rules that are themselves nothing but a literal — a bare STRING body or an unnamed ALIAS body, keyed by rule name. Whether a given rule IS the alias source is decided later, at the symbol, by comparing the parser's own display name against the rule name derived from the C symbol (see `resolveSymbolTextFacts`) — never by re-walking the grammar tree.

### `packages/codegen/src/dsl/symbol-table.ts::resolveSymbolTextFacts`

Per-C-symbol literal-text and literal-rule facts, keyed by `cName`, fed into `createParserMetadata`. `symbolName` (the parser's own display name) is never touched here — it comes straight from `ts_symbol_names[]`. This resolves the separate fact `literalText`: for an aliased `anon_sym_*`, the literal `resolveAliasedTokenLiterals` pairs it with; for any other `anon_sym_*`, the display name itself. For `sym_*`, present only when the rule is a bare-literal rule (`literalRules`) AND the parser's display name for that symbol equals the rule name parsed from `cName` — a mismatch means tree-sitter compiled this rule's hidden body into the same symbol id as a differently-named alias elsewhere (python's `_wildcard_pattern` compiling into the `wildcard_pattern` alias symbol), and the alias's own display name must survive untouched.

### `packages/codegen/src/dsl/symbol-table.ts::deriveSymbolRuntimeName`

Anonymous tokens (`anon_sym_LPAREN`, `anon_sym_PLUS`, `anon_sym_RBRACE`)
arrive in parser.c with tail names made by per-character substitution, the
substituted characters as all-caps words. A punctuation token's key is its
literal text through the same substitution (`sanitizeCIdentifier`) with the
words lower-cased and the literal letters kept as written, so it reads like
every other snake-case key (`lparen`, `comma`) and prefixes differing only by
case stay apart (C's `u'` → `u_squote`, `U'` → `U_squote`; regex's `(?P<` →
`lparen_qmarkP_lt`). A token whose C name is not its sanitized literal text
lower-cases its C tail. A keyword's key keeps the keyword's spelling (below),
since two keywords may differ only by case (C's `_alignof` and `_Alignof`). The original C-side name is preserved in
`parser.cSymbol`; the parser's display name is preserved in
`parser.symbolName`, and the token's own verbatim text — which for an
aliased anonymous token differs from `symbolName` — is `parser.literalText`.

#### body — keyword tokens

A keyword is not detected by a regex or a word-shape test on the runtime
name; parser.c already names it that way. An anonymous symbol's own C name
is `anon_sym_` followed by its literal text verbatim exactly when
tree-sitter minted that symbol from an identifier-shaped keyword — `class`,
`expr_2021` — since a symbolic token instead goes through per-character
name substitution (`anon_sym_COMMA` for `,`, `anon_sym_macro_rules_BANG` for
`macro_rules!`), which never reproduces the literal text after the
`anon_sym_` prefix. That exact match (`cName === 'anon_sym_' + literalText`)
is the one predicate: every keyword token gets the `_keyword` suffix on its
spelling, case kept, collision with a same-named kind or not — `fn_keyword`,
`class_keyword`, `u8_keyword`, `tt_keyword`, `MISSING_keyword`,
`_Alignof_keyword`. Every name derived from the key keeps its case too: seam and
slot labels, options keys, and the Rust constant (`toScreamingSnakeCase` reads a
run of capitals as one word). `_` is punctuation, not a keyword, even though
its C name matches the exact-text predicate: text made of nothing but
underscores derives `underscore` (`underscore2` for `__`, one more
underscore character per further doubling, mirroring tree-sitter's own `LT2`
convention for a doubled symbolic character) rather than `__keyword` —
underscore is the one identifier-class character tree-sitter never escapes
to a symbolic name, so this is the symbolic name it omitted, sitting beside
`comma`/`lparen`. A symbolic token keeps its plain derived name (`comma`,
`macro_rules_bang`). This is the ONE derivation of a keyword's runtime name:
the `TSKindId` member, the kind string, factories, and the nested option key
`nestedKey` derives all follow from it. If a derived key still collides,
`joinIdNames` records the collision rather than guess a second name.

### `packages/codegen/src/dsl/symbol-table.ts::keywordTextOf`

The keyword predicate described under `deriveSymbolRuntimeName`, in one
place: the literal text of an anonymous symbol whose C name is `anon_sym_`
followed by that text verbatim and which is not made only of underscores,
else `undefined`. `deriveSymbolRuntimeName` suffixes `_keyword` exactly when
it returns text, and `createParserMetadata` stamps `keyword: true` on the
same kinds, so the name and the fact cannot disagree.

#### body

```text
/* `alias_sym_<target>` is the parser symbol for an aliased kind. The
	   codegen rule that produces it is the hidden source (leading
	   underscore) — e.g. tree-sitter-rust aliases `_field_identifier` →
	   `field_identifier`, which appears in parser.c as
	   `alias_sym_field_identifier`. Map back to the hidden source name so
	   the join hits the codegen-side rule key. */
```

### `packages/codegen/src/dsl/symbol-table.ts::resolveAliasedTokenLiterals`

The literal each aliased anonymous token lexes. Tree-sitter names an anonymous token by its alias only when every use of that token aliases it to the same name, so a parser symbol displayed as an alias target `D` lexes one of the literals aliased to `D` in grammar.json — and the parser keeps no other record of which. Per display name: (a) a C symbol whose `anon_sym_` suffix is one of `D`'s literals as tree-sitter spells it in C (`sanitizeCIdentifier`, the same derivation the predicted table names its symbols by) is that literal; (b) the symbols left over take the literals no (a) symbol claimed, which resolves only when exactly one symbol and one literal remain; (c) anything else throws, naming the symbol, `D` and the unclaimed literals. A symbol whose display equals its own suffix is not aliased at all and is skipped — its text is its display. A C name is only ever compared with a literal's C spelling, never decoded; (b) covers a symbol tree-sitter suffixed to keep its C name unique.

### `packages/codegen/src/dsl/symbol-table.ts::aliasedLiterals`

The literals a named alias wraps. Tree-sitter applies an alias to every step of its content, so the walk collects each `STRING` under a `CHOICE` or `SEQ` member, looking through `LITERAL_WRAPPERS`; any other content (a symbol, a pattern, a nested alias) contributes none.

### `packages/codegen/src/dsl/symbol-table.ts::LITERAL_WRAPPERS`

Rule types an alias reaches through to the steps it names: `token`, `token.immediate`, `prec*`, `optional`, `repeat`, `repeat1` and `field`.

### `packages/codegen/src/dsl/symbol-table.ts::findEntryForKindName`

```text
/**
 * THE kind-name resolution chain — for callers holding a KIND / RULE NAME
 * (never a bare literal token text; those go through
 * {@link findEntryForLiteralText}).
 *
 * 1. Exact catalog key (the canonical case).
 * 2. `_`-prefixed key — visible variant-child kinds emitted from hidden
 *    alias sources (`closure_expression_expr` → `_closure_expression_expr`).
 * 3. ANON-scoped symbolName — anonymous tokens whose display string differs
 *    from their key (`anon_sym_PLUS` → key `plus`, symbolName `"+"`).
 *    Anon-scoping is load-bearing: a general symbolName match at this
 *    position caused the `_as_pattern` shadowing bug (hidden `_as_pattern`
 *    symbolName `"as_pattern"` shadowing the real `as_pattern` entry).
 * 4. Named symbolName — hidden NAMED compound tokens whose display string
 *    is not a valid key spelling (`sym__is_not` → key `_is_not`, symbolName
 *    `"is not"`). Ordered AFTER the anon step so an anon twin always wins
 *    for texts both could match; reachable only when steps 1-3 all miss.
 */
```

#### body

```text
An `alias_sym` row is never claimed by an exact parser-name match: its
parser name is `_<display>`, which collides with hidden rules and minted
content unions of that name. The row resolves only through its display name.
modelKindOfEntry (kind-discriminant.ts) is the inverse.

The exclusion covers the exact-name step only: the symbol-name steps (3, 4)
still return an alias row whose display string matches. A caller that must
never land on another kind's row resolves through `findOwnKindEntry`
(kind-discriminant.ts), which keeps this chain's answer only when its
`modelKindOfEntry` is the requested kind.
```

### `packages/codegen/src/dsl/symbol-table.ts::reservedWordset`

The one reader of a grammar's declared reserved wordsets. For the named wordset it returns the members' literal texts (`words`): a `STRING` member's value, a `SYMBOL` member's catalog `literalText`. Every other member is listed in `nonLiteral` (a symbol by name, anything else by rule type), which `reservedMemberDiagnostics` reports. An absent wordset reads as empty.

### `packages/codegen/src/dsl/symbol-table.ts::findAnonEntryForLiteralText`

```text
/**
 * The ANONYMOUS token whose verbatim literal text (`literalText`, never
 * `symbolName` — that is the parser's display name, which for an aliased
 * anon token differs from the text it lexes) is exactly this string, or
 * `undefined`. The strict half of the literal-text chain: it answers "does
 * the grammar already lex this text as an anonymous token?" and never falls
 * back to the kind-name chain.
 *
 * Callers deciding whether a literal-text spelling already HAS an identity
 * must use this rather than {@link findEntryForLiteralText} — the fallback
 * there matches named symbols too, so a scanner symbol whose name happens to
 * read as text (`_template_chars`) would answer yes and lose its own rule.
 */
```

### `packages/codegen/src/dsl/symbol-table.ts::findEntryForLiteralText`

```text
/**
 * THE literal-text resolution chain — for callers holding a LITERAL TOKEN
 * TEXT (a `STRING` rule's value / enum member text), matched against each
 * entry's `literalText` (its verbatim text, distinct from `symbolName`, the
 * parser's display name). The anon-scoped match runs FIRST: the caller holds
 * a literal, so the anonymous token is the correct identity even when a
 * NAMED rule shares the spelling (python's `'type'` keyword vs the `type`
 * rule). Falls back to the literal-rule chain for literals with no anon
 * twin — a named rule whose body is exactly a bare STRING or an unnamed
 * ALIAS (rust `'crate'`/`'self'`, python's `'is not'`/`'not in'`). The last
 * arm is the lexical fact: a terminal row carrying `literalText` is a string
 * token whatever its namedness, which catches a token every use aliases to a
 * named kind (regex `'\-'` under `alias('\-', $.identity_escape)`): tree-sitter
 * stamps it `.named`, so it has no `anon` and the first arm misses it.
 */
```

### `packages/codegen/src/dsl/symbol-table.ts::findEntryForPatternValue`

```text
/**
 * A PATTERN rule's value may name either a literal token's text or a kind
 * directly by name (unlike a STRING, whose value is always literal text).
 * Tries the literal-text chain first, then falls back to the kind-name
 * chain.
 */
```

### `packages/codegen/src/dsl/symbol-table.ts::GeneratedIdEntry`

```text
/**
 * One row of the parser symbol catalog (KindID runtime migration design,
 * 2026-04-30). When `id` / `parser` are absent, the kind exists in the
 * codegen rule set but tree-sitter inlined it during parser compilation —
 * presence is `TSGrammar` only, not `TSInternals`. A row's mere existence
 * here is the canonical record of "this kind is reachable from the
 * grammar"; downstream code reads `parser` to discover whether it also
 * surfaces at runtime.
 */
```

### `packages/codegen/src/dsl/symbol-table.ts::KindEntryLike`

```text
/**
 * Minimal structural shape shared by every catalog-entry type that the kind
 * resolution chain operates on (`GeneratedKindEntry` here, `KindEnumEntry`
 * in emitters/kind-discriminant.ts). PR-K1 (KindId-NodeRefs design,
 * docs/superpowers/specs/2026-07-20-kindid-noderefs-design.md §2.2): there
 * is exactly ONE resolution chain pair in the codebase — the two modules
 * previously carried parallel chains whose step-3 scopes disagreed, and
 * every divergence between them was a latent bug of the #129 class.
 */
```

`aliasedNonTerminal` is the parser's fact that some `alias()` shows the nonterminal under another name; `isAliasedHiddenStorage` reads it.

### `packages/codegen/src/dsl/symbol-table.ts::isRenamedEntry`

Whether a catalog row is a hidden rule the parser shows under another name: not an alias, anonymous or literal row, not declared in the grammar's `visibleExternals` (`visibleExternal`, so a declared whitespace external keeps its own kind), visible in the parser, not an alias fold (`parseId` unset, so its `symbolName` is its own symbol's), its `symbolName` differs from its grammar name, and exactly one visible row carries that tree name (`visibleTreeNameCount`). Such a row's model kind is its tree name.

### `packages/codegen/src/dsl/symbol-table.ts::visibleTreeNameCount`

How many visible, named rows show a tree name, counted once per entry list (cached by list identity).

### `packages/codegen/src/dsl/symbol-table.ts::modelKindOfEntry`

The model kind a catalog row names: an alias row's display name, a renamed row's tree name (`isRenamedEntry`), otherwise its grammar name. The inverse of `findEntryForKindName`; the id → name tables and the `TSKindId` member names read it so both directions agree.

### `packages/codegen/src/dsl/symbol-table.ts::parserHiddenOf`

Whether a kind is hidden in the parser: its catalog row's `hidden` fact (never for an alias row). The leading-underscore spelling decides only for a name with no catalog row: a phantom kind (a sittir mint with no parser symbol, held to the phantom-kind ceilings) or an `inline:` entry, which the parser never gives a symbol. A name the catalog owns never reaches that fallback (`findOwnKindEntry` throws instead).

### `packages/codegen/src/dsl/symbol-table.ts::isParserHiddenKind`

`parserHiddenOf` for a kind name, looked up by its own row (`findOwnKindEntry`).

### `packages/codegen/src/dsl/symbol-table.ts::parserSupertypeOf`

Whether a kind is a supertype: its catalog row's `supertype` flag. For a name with no catalog row it is the grammar's `supertypes:` declaration, because tree-sitter issues no symbol for a hidden supertype (rust `_declaration_statement`, python `_suite`, every grammar's `_layout`); this is the same rowless-only class as `parserHiddenOf`'s spelling fallback.

### `packages/codegen/src/dsl/symbol-table.ts::surfaceHiddenOf`

Whether a kind is hidden on the generated surface, from the two parser symbol flags in `ts_symbol_metadata`:

- parser-hidden (`.visible = false`, `parserHiddenOf`) and not a supertype. Tree-sitter compiles every supertype as an invisible symbol, but a supertype is the user-facing polymorph parent, so it keeps its namespace, `ir` key and type;
- or a grammar rule the parser issues as an anonymous token (`.named = false`, the row's `anon`, on a `literalRule` row): typescript `_ternary_qmark`, python `_not_in`/`_is_not`. Its node stays in the model, so an enum slot keeps its own kind id, but it has no factory or `ir` key. Keyword and punctuation leaves minted from anonymous literals are not rules and stay on the surface. This is the one predicate every surface emitter and the link `hidden` stamps read; link's inline decision reads the plain parser fact.

### `packages/codegen/src/dsl/symbol-table.ts::seatedOf`

A kind seats on its parent when its rule is `hoisted` and its content lands
in a node its parent emits. A kind the parser declares a supertype (`supertype` on its
kind entry) has no node: its subtypes reach the parent's slot directly,
the way any supertype's do, so there is nothing to seat. Typescript
`export_statement_default` is the case: a variant parent nested in
`export_statement`'s variants, both supertypes to the parser, so link
classifies it a supertype and its transport claims its arms.

Link reads it to decide whether a hidden rule is left as a hoisted form
(`classifyHiddenRule`), assemble to classify the kind before the node exists,
and the node for `seated`, so all three read the same fact.

### `packages/codegen/src/dsl/symbol-table.ts::supertypeArmsOf`

The kinds a parser-declared supertype's rule names directly: a `SUPERTYPE`
rule's subtypes, or a `CHOICE` rule's members, kept where they are symbols.
Assemble derives it once from the normalized rules and hands it to every node
construction (`KindFacts.supertypeArms`), where it decides `ownSurface`. Seating
does not read it: an arm seats on its parent like any hoisted kind.

### `packages/codegen/src/dsl/symbol-table.ts::isAliasedHiddenStorage`

Whether a kind is hidden storage the parser shows under an alias: its own row (`findOwnKindEntry`) is an `aliasedNonTerminal` and `surfaceHiddenOf` holds. Supertypes fail the second test, so an aliased supertype (python `expression` under `as_pattern_target`) stays a supertype. Link and assemble ask it to make such a kind an envelope rather than a supertype or polymorph.

### `packages/codegen/src/dsl/symbol-table.ts::isShownConcreteKind`

Whether the parser shows a kind as a concrete node: its own row (`findOwnKindEntry`) exists, carries no supertype flag, and `surfaceHiddenOf` does not hold. A declared supertype the parser displays under a default alias (python `match_block`) is one. Link's `classifyHiddenChoiceRule` keeps such a kind concrete.

### `packages/codegen/src/dsl/symbol-table.ts::isSurfaceHiddenKind`

`surfaceHiddenOf` for a kind name, looked up by its own row (`findOwnKindEntry`).

### `packages/codegen/src/dsl/symbol-table.ts::findOwnKindEntry`

The catalog row whose model kind is exactly `kind` (`findEntryForKindName`, then `modelKindOfEntry` must agree), or `undefined` for a name with no row. Whether any row owns `kind` is one lookup in a per-catalog `modelKind → row` index (`modelKindOwner`), so a rowless name returns without scanning the catalog. A kind that some row names as its model kind but that the resolution chain misses throws: a rowless fallback (the leading-underscore name rule) is only for synthetic grammars and sittir mints, never for a kind the catalog owns.

### `packages/codegen/src/dsl/symbol-table.ts::modelKindOwner`

The first catalog row whose `modelKindOfEntry` is `kind`, from an index built once per catalog array and cached in a WeakMap keyed by that array (the same scheme as `visibleTreeNameCount`).

### `packages/codegen/src/dsl/symbol-table.ts::stampVisibleExternals`

Marks the rows named in the grammar's `visibleExternals` with `parser.visibleExternal`, returning new tables (idempotent; tables without such rows pass through). Link is its only caller on the compile path: it stamps the tables it is given, reads its catalog from them, and returns them on `LinkedGrammar.generatedIdTables`, which the grammar diagnostics, assemble and `Compilation.generatedIdTables` take, so a caller that passes raw tables to link sees the same fact. Consumers read the stamp, never the grammar's list: `isRenamedEntry` excludes the rows, so `collapseRenamedRules` keeps their kinds, and the slot-preservation check accepts a declared token written as a seam (`rendersAsDeclaredTokenSeam`).

### `packages/codegen/src/dsl/symbol-table.ts::GeneratedKindEntry`

One catalog row. Beyond the id tables, it carries:

- `parseName`: set only on an alias fold (`joinIdNames`), the display name tree-sitter issues under `parseId`. The row keeps its own `symbolName`, so the storage id still names the row's own symbol and the parse id names the display;
- `aux`: parser.c declares the symbol as `aux_sym_…`, an auxiliary symbol the grammar never named (a repeat helper or, when `terminal`, an anonymous auxiliary token), read by `compiler/diagnostics/catalog-coverage.ts::auxTokenKinds`;
- `supertype`: the symbol is a tree-sitter supertype (`collectSymbolFlags`), read by `surfaceHiddenOf` and `parserSupertypeOf`;
- `terminal`: the symbol's id is below parser.c's `TOKEN_COUNT` (`collectTokenCount`), so the parser issues it as a token;
- `visibleExternal`: the row is declared in the grammar's `visibleExternals` (`stampVisibleExternals`).

### `packages/codegen/src/dsl/symbol-table.ts::symbolNameIsNotable`

```text
/**
 * Whether a catalog row's `symbolName` is worth emitting alongside `kind`:
 * either it differs from the kind's own catalog key, or the row is a
 * literal rule (whose `symbolName` can legitimately equal `kind` while its
 * `literalText` still differs and needs to travel with the entry). Shared
 * between `collectGeneratedKindEntries` and `collectKindEntries` so the
 * exemption is decided once, not re-derived per emitter.
 */
```

### `packages/codegen/src/dsl/symbol-table.ts::CatalogSymbolFacts`

The grammar's `dsl/rule-patterns.ts::SymbolFacts` plus the catalog rows (empty before the first generate): what `catalogSymbolSource` and `renameAwareSymbolSource` build a source from.

### `packages/codegen/src/dsl/symbol-table.ts::catalogSymbolSource`

Answers from the parser catalog. A name is inlined when it is in `inline:` and has no row (tree-sitter issues no symbol for an inlined rule); it is a terminal when its row's `terminal` fact says so (id below `TOKEN_COUNT`). An inlined name is classified by its body (`terminalContentOf`), since the parser substitutes it; a rowless name that is not inlined is a nonterminal. It is hidden when its own row is hidden and not an alias row (`parserHiddenOf`), a supertype when the row or the declared `supertypes:` say so (`parserSupertypeOf`), and a visible external when its row carries `visibleExternal`. It answers `hasSymbol` by whether the name has a row. Link stamps inlining through it over the parser's rows; every earlier phase asks it over predicted rows.

### `packages/codegen/src/dsl/symbol-table.ts::PredictorRule`

A rule body the predictor accepts: an evaluated rule, or a grammar.json rule as the tree-sitter CLI's own grammar.json carries it (which spells an empty choice arm as `BLANK`), so one port predicts from either.

### `packages/codegen/src/dsl/symbol-table.ts::PredictedGrammar`

What `predictSymbolTable` reads from an evaluated grammar: its rules in declaration order (the first is the start rule), its `extras` and `externals` rule lists, and its `supertypes`, `inline` and `word` names. The caller passes the faithful rules — before canonicalization peels wrappers the parser's symbol table depends on — without the evaluate-synthesized ones, which tree-sitter never sees.

### `packages/codegen/src/dsl/symbol-table.ts::AliasFact`

An alias as tree-sitter compares aliases: its name and whether it is named.

### `packages/codegen/src/dsl/symbol-table.ts::MetaParams`

The metadata tree-sitter keeps on a wrapped rule: token-ness, immediacy, the alias, the field name and the precedences. Nested wrappers merge into one set unless the inner one is a token, which keeps its own.

### `packages/codegen/src/dsl/symbol-table.ts::InternedRule`

A rule after tree-sitter's interning: `OPTIONAL` and `REPEAT` are rewritten into `CHOICE`/`REPEAT` over `BLANK`, an empty `SEQ` or `CHOICE` is `BLANK`, wrappers collapse into one `META`, and a reference is a `SYM` key — `nt:<rule>`, `t:<lexical index>` or `ext:<external index>`.

### `packages/codegen/src/dsl/symbol-table.ts::VariableKind`

A symbol's kind in tree-sitter's variable tables: `named`, `hidden` (underscore-led or a supertype), `anonymous` (a literal text) or `auxiliary` (a symbol tree-sitter mints: a `_tokenN` or a `_repeatN`).

### `packages/codegen/src/dsl/symbol-table.ts::Variable`

One entry of a syntax, lexical or external variable table: its name, kind and interned rule. Token extraction and repeat expansion update it in place.

### `packages/codegen/src/dsl/symbol-table.ts::ProductionStep`

One step of a flattened production: the symbol key and, when one applies, the alias over it. Clearing a default alias deletes the step's alias.

### `packages/codegen/src/dsl/symbol-table.ts::BLANK_RULE`

The interned empty rule.

### `packages/codegen/src/dsl/symbol-table.ts::sameShape`

Structural equality of two interned values, the equality tree-sitter uses to dedupe lexical rules, productions and aliases.

### `packages/codegen/src/dsl/symbol-table.ts::withMeta`

Adds metadata to an interned rule: merged into an existing non-token `META`, otherwise a new `META` around it.

### `packages/codegen/src/dsl/symbol-table.ts::internRule`

Interns one evaluated rule the way tree-sitter's grammar preparation does, resolving each reference to its symbol key. A sittir-only rule type (`SUPERTYPE`, `INDENT`, `DEDENT`, `NEWLINE`) has no parser symbol and throws.

### `packages/codegen/src/dsl/symbol-table.ts::TokenExtractor`

Tree-sitter's token extraction: each `STRING`, `PATTERN` or token-wrapped rule becomes a lexical variable, deduped by shape. A string names its variable by its text (`anonymous`); anything else is `<owner>_tokenN` (`auxiliary`), counted per owning variable. A token wrapper with more metadata than token-ness extracts whole. `usage` counts the references to each lexical variable.

### `packages/codegen/src/dsl/symbol-table.ts::mapSymbolKeys`

Rewrites every `SYM` key in an interned rule.

### `packages/codegen/src/dsl/symbol-table.ts::productionsOf`

Flattens an interned rule into its productions: a `CHOICE` contributes each member's productions (deduped), a `SEQ` the cartesian product of its members', and the innermost alias applies to every step under it.

### `packages/codegen/src/dsl/symbol-table.ts::C_SYMBOL_CHARACTER_NAMES`

The words tree-sitter spells punctuation with in a C symbol name.

### `packages/codegen/src/dsl/symbol-table.ts::C_CONTROL_CHARACTER_NAMES`

The words tree-sitter spells control characters (below U+0020) with in a C symbol name.

### `packages/codegen/src/dsl/symbol-table.ts::sanitizeCIdentifier`

Tree-sitter's C symbol name for a symbol name: word characters stay, punctuation and control characters become their words (`SPACE` only for a lone space) joined with `_`, and anything else becomes `uXXXX` per UTF-16 unit. `spellReplacement` spells each substituted word: as written for the C name, lower-cased for a punctuation token's kind key (`deriveSymbolRuntimeName`), so both come from the one table.

### `packages/codegen/src/dsl/symbol-table.ts::referencedNames`

Every name a rule references through a `SYMBOL`.

### `packages/codegen/src/dsl/symbol-table.ts::liveRuleNames`

The rules reachable from the grammar's roots (`grammarRootNames`: the start rule and the extras' SYMBOL entries) — the rules tree-sitter keeps. The rest never become symbols.

### `packages/codegen/src/dsl/symbol-table.ts::expandRepeats`

Tree-sitter's repeat expansion: each `REPEAT` becomes an auxiliary `<owner>_repeatN` variable (`choice(seq(self, self), inner)`), deduped across the grammar by its inner rule. A hidden variable whose whole rule is a `REPEAT` becomes that auxiliary itself.

### `packages/codegen/src/dsl/symbol-table.ts::defaultAliasesOf`

Each symbol's default alias: over the productions of reachable variables, skipping steps whose symbol is inlined, a symbol that every use aliases takes its most frequent alias (the first on a tie); one unaliased use clears it.

### `packages/codegen/src/dsl/symbol-table.ts::clearDefaultAliases`

Removes a default alias from each step that carries it, unless another production of the same variable has a different alias at that position.

### `packages/codegen/src/dsl/symbol-table.ts::predictSymbolTable`

Predicts the parser's symbol table from the evaluated grammar by porting tree-sitter's preparation: live rules (`liveRuleNames`), interning, token extraction (the `word` rule first), single-use whole-rule token replacement, externals (a literal external is an anonymous token), extras, repeat expansion, flattening, reachability from the start rule and the extras (every external is reachable), default aliases and their clearing. Symbols are ordered terminals, externals, then non-inlined nonterminals, then the aliases no symbol displays as, sorted by name and namedness; ids follow that order from 1 and C names come from `sanitizeCIdentifier` with numeric suffixes on collision. Each symbol's name is its display name — its default alias when it has one — and its visible, named, supertype and aliased-non-terminal flags follow tree-sitter's metadata. A default alias replaces the symbol's metadata, so a declared supertype a default alias displays carries no supertype flag, as in parser.c's `ts_symbol_metadata` (python `_match_block`, shown as `match_block`). A reference that names no rule and no external is what tree-sitter rejects the grammar for; the prediction does not stop there. Such a reference stays an opaque nonterminal step (so the rule holding it keeps its class) that is never issued a symbol, and every such name is returned in `undefinedNames` beside the table of the names that are defined. `kindTableOfSymbolTable` turns the table into rows exactly as it turns parser.c's.

### `packages/codegen/src/dsl/symbol-table.ts::PredictedSymbolTable`

A predicted symbol table and the names the grammar references that are neither rules nor externals. Tree-sitter rejects a grammar with any; the table still answers for every defined name, so enrich can classify a grammar before its undefined names are reported.

### `packages/codegen/src/dsl/symbol-table.ts::PredictedKinds`

What `compiler/canonical-rules.ts::canonicalGrammar` stamps as `RawGrammar.predictedKinds` (`predictedKindsOf`): the predicted kind catalog's rows with its key collisions, or why it could not be predicted — the failure's message and the undefined names when that was the cause.

### `packages/codegen/src/dsl/symbol-table.ts::undefinedNamesOf`

The names a failed prediction found undefined, or none when the prediction succeeded or found another cause. Hydrate skips these names (`compiler/assemble.ts::hydrateValues`), since link already records each as a dangling reference.

### `packages/codegen/src/dsl/symbol-table.ts::predictedEntriesOf`

The predicted rows, or none when the prediction failed.

### `packages/codegen/src/dsl/symbol-table.ts::PREDICTED_KIND_FIELDS`

The catalog-row fields the predicted catalog must match: every field the pipeline reads, ids included (the front half runs on predicted ids exactly as on the parser's), and not `lexicalRank`, which the prediction does not derive.

### `packages/codegen/src/dsl/symbol-table.ts::assertPredictedKindEntries`

Compares the predicted kind catalog with the parser's row by row on `PREDICTED_KIND_FIELDS`, plus each side's kind set, and throws listing every disagreement. An id disagreement is a stop like any other, which catches a tree-sitter upgrade that changes id assignment.

### `packages/codegen/src/dsl/symbol-table.ts::PredictedKindCatalog`

The rows `predictKindCatalog` predicts, with the grammar's undefined names and key collisions beside them.

### `packages/codegen/src/dsl/symbol-table.ts::predictKindCatalog`

The kind-catalog rows tree-sitter would generate for a grammar: `predictSymbolTable` turned into rows by `kindTableOfSymbolTable`, with the declared visible externals stamped as the parser catalog's are, and without `lexicalRank`, which the prediction does not derive faithfully. A grammar with undefined names still gets the rows of its defined names; the names come back in `undefinedNames`, and an undefined name has no row.

### `packages/codegen/src/dsl/symbol-table.ts::predictedKindsOf`

The one derivation of `PredictedKinds`: the rows when the grammar defines every name it references, else the failure, naming the undefined names, or the error of any other failure to build the table. `canonicalGrammar` stamps it (through `compiler/canonical-rules.ts::predictKinds`), and test fixtures stamp theirs with it rather than by hand.

### `packages/codegen/src/dsl/symbol-table.ts::catalogRenames`

The default aliases a kind catalog records: each given name whose own row is a renamed entry (`isRenamedEntry`), mapped to the tree name it shows as. Link's `collapseRenames` and the pre-rename sources (`renameAwareSymbolSource`) read the renames through it, so both derive them from rows the same way.

### `packages/codegen/src/dsl/symbol-table.ts::renameAwareSymbolSource`

A `catalogSymbolSource` for a grammar whose rules still carry the names the catalog renames away: every question about a renamed rule or external is asked about its tree name (`catalogRenames`). Enrich and the grammar diagnostics read the grammar before link's rename, so they ask through it; link, after the rename, asks the catalog directly.

### `packages/codegen/src/dsl/symbol-table.ts::predictedSymbolSourceOf`

The `SymbolSource` of a grammar before any parser.c exists: its predicted kind catalog (`predictKindCatalog`), asked through `renameAwareSymbolSource`. A name the grammar leaves undefined has no row, so `hasSymbol` and `isTerminal` are false for it; the failure itself is reported from `RawGrammar.predictedKinds`, never here. Enrich builds one per rule set it classifies (`enrich-ctx.ts::enrichSymbolSource`).
### `packages/codegen/src/dsl/symbol-table.ts::kindCatalogOf`

The one route to the kind catalog the front half reads: the parser's rows, as stamped by the tables' owner (link stamps the declared visible externals before it reads them), when id tables are passed, else the rows evaluate predicted (`RawGrammar.predictedKinds`), ids included. Link, the grammar diagnostics, the diagnostics tool and the upstream compile all read it.

### `packages/codegen/src/dsl/conflict-resolutions.ts::PolicyStep`

Whether a derived conflict is one upstream declared: `upstream-declared` when the conflict's rules, each mapped to its upstream source and deduplicated, are exactly a set upstream listed in its own `conflicts`; otherwise `default`. Every conflict is resolved with AddConflict either way; the step is a record, not a choice between resolutions.

### `packages/codegen/src/dsl/conflict-resolutions.ts::ConflictResolutionRecord`

One entry of `resolutions.json` as the JSON reads: `DerivedResolution` with the resolution kind and the policy step widened to strings, the type a grammar's import infers. The diagnostics read these.

### `packages/codegen/src/dsl/conflict-resolutions.ts::sameConflictSet`

Set equality of two rule-name lists, order and duplicates ignored: how a conflict's sources are compared with a set upstream declared.

### `packages/codegen/src/dsl/conflict-resolutions.ts::sourceChain`

The chain from a rule name to its upstream source: follow the reshaping edges
until a name has none. A name with no edge is its own source. The records
cannot legitimately form a cycle; one throws with the chain in the message. The conflict policy and the dynamic-precedence check both map names through it.

### `packages/codegen/src/dsl/conflict-resolutions.ts::upstreamSourcesOf`

The distinct upstream sources of a resolution: the last name of each source chain, deduplicated, so two variants of one upstream rule count as that rule once. Both the policy's declared test and the unnecessary-upstream diagnostic compare these with the upstream sets.

### `packages/codegen/src/dsl/conflict-resolutions.ts::DerivedResolution`

One entry of `resolutions.json` as the derivation writes it: the AddConflict set, the policy step, the conflict it resolved (symbol sequence, lookahead, and the rules of each interpretation), and `sourceChains`, for each rule of the set the chain from its name to its upstream source (`dsl/conflict-resolutions.ts::sourceChain`), so a reviewer can see why a set counted as declared upstream.

### `packages/codegen/src/dsl/conflict-resolutions.ts::ConflictResolutionsFile`

The shape of `.sittir/resolutions.json`. `grammarHash` is the hash of the evaluated grammar the resolutions were derived for, computed without its conflicts (`transpile/evaluate-for-derivation.ts::grammarHash`). It is the verified stamp: written only once the set has generated cleanly, so a file with a matching hash always held a set that built.

### `packages/codegen/src/dsl/conflict-resolutions.ts::UNVERIFIED_GRAMMAR_HASH`

The hash of a resolution set no clean `generate` has confirmed: the seed, and every candidate the derivation probes. No grammar hashes to it, so such a set is always derived again rather than reused.

### `packages/codegen/src/dsl/conflict-resolutions.ts::ConflictResolutionsInput`

The resolutions a grammar passes to `sittirGrammar`: `ConflictResolutionRecord`s, so the JSON a grammar imports satisfies it as TypeScript infers it (string literals widen, so the file does not type as `ConflictResolutionsFile`).

### `packages/codegen/src/dsl/conflict-resolutions.ts::CONFLICT_RESOLUTIONS_FILE`

The file name under a package's `.sittir/` that holds the derived resolutions, and that every `grammar.sittir.ts` imports as `./.sittir/resolutions.json`.

### `packages/codegen/src/dsl/conflict-resolutions.ts::EMPTY_CONFLICT_RESOLUTIONS`

The resolutions of a grammar nothing has been derived for, carrying `UNVERIFIED_GRAMMAR_HASH`: the seed a new package's first bundle imports, and the starting point of every derivation.

### `packages/codegen/src/dsl/conflict-resolutions.ts::applyConflictResolutions`

Sets the grammar's final `conflicts` to the resolution sets, replacing whatever `grammar()` produced. Upstream's declared conflicts and anything an author wrote never reach the final list; every conflict the grammar keeps was derived. It runs last in `sittirGrammar`, so both runtimes see the same list.


### `packages/codegen/src/dsl/enrich.ts::applyElidedListField`

Wraps an elided separated list in one field, separators included. The list is an optional first element followed by a repeat of separator and optional element, as a whole seq or as the body of an optional member of a seq. The field is named for the pluralised element symbol, or `elements` when the element is not one symbol. A tree-sitter field tags every child inside it, so the separators land in the field's slot beside the elements and a hole between two separators survives a parse. An already fielded list is left alone, and a name the rule already uses is skipped with a report.

### `packages/codegen/src/dsl/choice-arm-partition.ts::module`

The one classification of a choice's arms by slot topology, shared by the DSL stage (enrich) and the simplify stage (collect-slots). Slot identity has exactly two sources, with disjoint parse routing: `field()` is slot identity (named per-arm slots, routed by field label), and an unnamed single-nonterminal arm is union-member kind identity (all such arms share one `content` union slot, routed by kind). Both stages call `partitionChoiceArms` with their `ArmStage`; neither re-derives the buckets.

### `packages/codegen/src/dsl/choice-arm-partition.ts::ArmStage`

How one compiler stage spells the facts the partition reads. `fieldName` is the field a node names, `fieldBody` the node whose slot-ness decides a degenerate field arm, `isSlotNode` whether a node is a slot, and `unwrap` strips wrappers that carry no slot topology.

### `packages/codegen/src/dsl/choice-arm-partition.ts::simplifyArmStage`

Simplify-stage reading: a field is the `fieldName` stamp on the node itself, and slot-ness is the `nonterminal` stamp (`flatten.ts::stampTerminality`), falling back to `isNonterminalRuleType` on an unstamped node. Simplified rules carry no precedence wrappers, so `unwrap` is the identity.

### `packages/codegen/src/dsl/choice-arm-partition.ts::dslArmStage`

DSL-stage reading: a field is a `FIELD` wrapper whose body is its content, slot-ness is `isNonterminalRuleType` (a `SYMBOL`/`ALIAS` reference), and `PREC*` and optional wrappers are transparent. An optional is read through `optionalContentOf`, so tree-sitter's `CHOICE(x, BLANK)` and sittir's `OPTIONAL(x)` classify alike and the two pipelines mint the same kinds.

### `packages/codegen/src/dsl/choice-arm-partition.ts::carriesNamedField`

True iff the rule, anywhere in its tree, names a field. Decides whether a choice arm contributes named fields or is a bare union member.

### `packages/codegen/src/dsl/choice-arm-partition.ts::ChoiceArmPartition`

The per-arm partition of a choice. Every arm lands in exactly one bucket.

### `packages/codegen/src/dsl/choice-arm-partition.ts::ChoiceArmPartition.degenerateNamedArms`

Arms that reduce to a bare `field(x, ref)`: one slot, no ambient literals (enum_body's `field('name', _property_name)`). They join the union slot, routed by field label; tree-sitter already labels these children.

### `packages/codegen/src/dsl/choice-arm-partition.ts::ChoiceArmPartition.structuredNamedArms`

Arms with fields plus ambient literals, or more than one field (dict_pattern's `field(key) ":" field(value)`). They keep their own field slots.

### `packages/codegen/src/dsl/choice-arm-partition.ts::ChoiceArmPartition.unionArms`

Unnamed single-nonterminal reference arms: union-member kind identity.

### `packages/codegen/src/dsl/choice-arm-partition.ts::ChoiceArmPartition.literalArms`

Bare terminal arms (a literal string or token): no slot and no kind identity.

### `packages/codegen/src/dsl/choice-arm-partition.ts::ChoiceArmPartition.structuredArms`

Unnamed structured arms: a multi-member seq with ambient literals, or a nested choice.

### `packages/codegen/src/dsl/choice-arm-partition.ts::soleMember`

Unwraps transparent wrappers and single-member seqs down to the node an arm reduces to.

### `packages/codegen/src/dsl/choice-arm-partition.ts::isDegenerateFieldArm`

True iff a named arm reduces to exactly one field-named slot node, with no ambient literals and no other field beside it. Only a degenerate named arm can be label-routed into the union slot.

### `packages/codegen/src/dsl/choice-arm-partition.ts::degenerateArmFieldName`

The field name a degenerate arm carries, read through the same unwrapping as `isDegenerateFieldArm`.

### `packages/codegen/src/dsl/choice-arm-partition.ts::partitionChoiceArms`

Partitions a choice's arms. Each arm is classified in priority order: field-named (degenerate, else structured named), then nested choice or multi-member seq (structured), then single-nonterminal reference (union), then bare literal. A single-member seq classifies as its sole member.

### `packages/codegen/src/dsl/choice-arm-partition.ts::unionRoutingGateB`

A fieldless structural choice qualifies for union routing iff it has at least one union arm and every arm is either field-named or a union arm. Whether the union slot's storage name is free in the owning rule needs whole-rule visibility and is checked at the `deriveSlots` boundary (`_deriveSlotsInternal`, node-map.ts), not here.

### `packages/codegen/src/dsl/choice-arm-partition.ts::ArmTopology`

The slot topology an arm produces: `field-routed` (a degenerate named arm), `union-routed` (a union arm), or `structured` (a structured arm, named or not). Literal arms produce no slot and have no topology.

### `packages/codegen/src/dsl/choice-arm-partition.ts::armTopologies`

The set of topologies a partition's arms produce.

### `packages/codegen/src/dsl/choice-arm-partition.ts::isTopologyMixed`

True iff the arms produce more than one slot topology. Kinds, supertype expansion and variant kinds never enter it: two arms routed by different field names are the same topology, and so are two union arms of different kinds.

### `packages/codegen/src/dsl/enrich.ts::ClauseHoistCounter.elementChoices`

The owner's element choices (`elementChoiceSlots`), computed on the rule before the clause hoist rewrites it: `ruleKey` of the choice → the slot its elements fill.

### `packages/codegen/src/dsl/enrich.ts::ElementSlot`

The slot an element choice fills: `slot` is its name, `authoredSlot` says the name came from an authored `field()` patch on the repeat. An authored slot is fielded by that patch; enrich only reads the name and adds no field of its own.

### `packages/codegen/src/dsl/enrich.ts::AuthoredFieldSite`

One authored `field()` patch on a kind: the index path it addresses and the field name it gives. Enrich receives them before any patch is applied, so a name it derives from a site is the name the patch will write.

### `packages/codegen/src/dsl/enrich.ts::elementChoiceSlots`

The choices under a `REPEAT`/`REPEAT1` whose arms produce more than one slot topology (`isTopologyMixed` at the DSL stage), keyed by `ruleKey`, each with the slot its elements fill. The key also matches the same choice outside the repeat, which is the head element of a separated list. Tokens and aliases are not entered.

The slot name has one derivation. An authored `field()` at the repeat's index path (or on the repeat's content) gives it. Otherwise it is `elementSlotName`: `elements` for a choice that is the repeat's whole content, the separated-list element name for a choice inside a sequence. One choice found under two different slot names in one rule throws.

### `packages/codegen/src/dsl/enrich.ts::elementSupertypeName`

`_<owner>_<singular of the slot name>`: the hidden supertype minted for an element choice. `singularFieldName` is the inverse of `pluralizeFieldName` for the names enrich produces.

### `packages/codegen/src/dsl/enrich.ts::singularFieldName`

The singular of a slot name (`members` → `member`, `entries` → `entry`). It is a suffix rule: `-ies` → `-y`, otherwise a trailing `s` is dropped. It mis-handles `-ses`, `-xes` and `-ches` (`classes` → `classe`, `boxes` → `boxe`, `matches` → `matche`); no slot name enrich produces today ends that way.

### `packages/codegen/src/dsl/enrich.ts::registerElementSupertype`

Registers an element choice, with its lifted arms already replaced by references, as a hidden rule under its supertype name and records the origin `element-supertype` with its slot. `groupDedupeMap` shares one supertype across owners of an identical choice, so the first owner names it and its arm kinds. A shared choice reached under a different slot name, or a supertype name that is already a rule, throws.

The supertype is not hoisted and not inlined. Enrich appends it to the grammar's `supertypes` and passes it to `stampAutomaticVariants` as a supertype owner, so every arm (lifted or already a kind) is labelled a variant of the supertype and none of the list's owner.

### `packages/codegen/src/dsl/enrich.ts::elementSupertypeOrigin`

The `element-supertype` origin of a list element that is a reference to an element supertype (through the transparent element wrappers), or `undefined`.

### `packages/codegen/src/dsl/enrich.ts::elementSlotName`

The one slot-name function for a list element, by where the element sits. In a list kind's body (`'list'`, per `listKindBodySeqs`) the field is always `item`, so every list kind has the same slot, `items`, whatever it holds; what the list holds is said by the owner's slot. Elsewhere the element is a slot of its owner: the stamped slot of an element supertype, else `deriveElementFieldName` for a separated run that shares the owner with other members (`'separated'`) and `elements` for a repeat's content (`'repeat'`). A field the grammar authored on an element is never renamed. `applyNodeChoiceFieldWrap` and `fieldSeparatedListElements` field through it, so the name on the supertype and the name of the field are the same fact.

### `packages/codegen/src/dsl/enrich.ts::listKindBodySeqs`

The seqs that hold a list kind's elements, given a seq: the seq itself and a seq directly inside it (the head run written as its own seq, beside the trailing separator) when the whole seq is a separated list whose separator varies per instance (`separatedListBodyInfo(...).flankCarrying`), and none otherwise. That is the condition under which the model classifies a kind as a list, and a seq of that shape always ends as its own kind: it is a rule's body, or enrich splits it out of its owner as a hoisted list or a choice arm. A separated run with a fixed separator and no optional flank is a slot of an owner that is not a list.

### `packages/codegen/src/dsl/enrich.ts::listKindElementPlural`

The pluralized element name a separated list's kind is named from, or `null` when the element has no name of its own. An element supertype is a choice, so it has none and the list keeps the `<owner>_elements` name.

### `packages/codegen/src/dsl/enrich.ts::getEnrichElementSupertypes`

Element supertype name → slot name, read from the rule origins. Wire reads it to name variants reached through a supertype and to check an authored field name against the slot.

### `packages/codegen/src/dsl/enrich.ts::mintFieldRoutedArm`

Mints a bare `field(name, ref)` arm of an element choice as its own visible kind and references it by a group-lift symbol. The naming parent is the element supertype, so the kind is `<supertype without the underscore>_<field>` through `visibleGroupSynthName`. With the structured arms minted by `mintStructuredChoiceArm` under the same parent, every element of the list is then a kind: one ordered union slot, and the field lives one level down on the minted kind. An authored `variant()` on the arm names the kind (`wireRenameLift`). An arm that matches the empty string is left alone.

### `packages/codegen/src/dsl/choice-arm-partition.ts::unwrapPrecAndOptional`

Strips `PREC*` and optional wrappers down to the node that decides an arm's slot topology.

### `packages/codegen/src/dsl/rule-patterns.ts::isNonterminalRuleType`

#### body

A `BLANK` is never a slot. Tree-sitter's DSL spells an optional as `CHOICE(x, BLANK)`, so a rule read at the DSL stage under tree-sitter's run carries blanks that sittir's own rule union does not name.

### `packages/codegen/src/dsl/choice-arm-partition.ts::PREC_TYPES`

The precedence wrapper types, which carry no slot topology.

### `packages/codegen/src/dsl/symbol-table.ts::generatedFieldIds`

The parser's field table as `{ name, id }` rows in id order, skipping entries without an id. It is the field-side counterpart of `collectGeneratedKindEntries` and the single source `field_ids.rs` is emitted from.

### `packages/codegen/src/dsl/bind.ts::Rename`

A kind-level rename in a bindings overlay: the base rule or external `from` takes the name `to`.

### `packages/codegen/src/dsl/bind.ts::Bindings`

A grammar's bindings overlay, the argument of `bindings()`. `patches` holds ordinary patch sets in base names and enriched paths; `sittirGrammar` appends them after the authored sets of the same kind. `renames` and `splits` are kind-level edits that `bindGrammar` applies to the grammar `grammar()` returned. `hash` is the hash of the `bindings.scm` and vocabulary sources the overlay was derived from (`bindings/hash.ts::bindingsSourceHash`); `bindings/hash.ts::assertBindingsFresh` compares it with the sources on disk.

### `packages/codegen/src/dsl/bind.ts::bindings`

Declares a bindings overlay and returns it unchanged; the call exists to type the overlay. A `grammar.bindings.ts` default-exports one and `grammar.sittir.ts` passes it to `sittirGrammar` as `bindings` while the overlay is on.

### `packages/codegen/src/dsl/bind.ts::rename`

The `Rename` primitive: `rename('function_item', 'function_declaration')`.

### `packages/codegen/src/dsl/bind.ts::split`

The `Split` primitive: `split(kind, as, { within, containers })` mints `as` from `kind` where it sits under the placement `within` (innermost first, the placement's owner last), with a container rule per intermediate ancestor named and fielded as `containers` gives.

### `packages/codegen/src/dsl/bind.ts::BindingEffect`

What one binding patch did, as wire records it while the patch applies: a `segment` effect is an option-path segment of the patched kind that the patch renamed (a field `from:` to `to:`, or a wrapped child or token to the new field), and an `alias` effect is a kind the patch aliased to a new name.

### `packages/codegen/src/dsl/bind.ts::BINDING_SET`

The non-enumerable mark on a patch set that came from a bindings overlay. `transform` applies a marked set inside `wireWithBindingEffects`, so only binding patches record effects.

### `packages/codegen/src/dsl/bind.ts::markBindingSet`

A copy of a patch set carrying `BINDING_SET`; the overlay's own object stays unmarked.

### `packages/codegen/src/dsl/bind.ts::isBindingSet`

Whether a patch set carries `BINDING_SET`.

### `packages/codegen/src/dsl/bind.ts::aliasTargetIssue`

Why an alias from `from` to `to` cannot stand, or `undefined`: an alias never flips hiddenness, and its target may not name a rule of the grammar. Tree-sitter folds an alias whose value names a rule into that rule's kind, so such a target would change the parse; a group that has to share a name with a rule is a merge.

### `packages/codegen/src/dsl/bind.ts::checkBindingPatches`

Refuses every named alias of a symbol in a bindings overlay's patches that `aliasTargetIssue` rejects against the enriched grammar, before wire applies any of them.

### `packages/codegen/src/dsl/bind.ts::rewriteBindingOptions`

Carries the authored options block through the binding patches. The block is authored in base names, so each `segment` effect rewrites that segment in its owner's option paths (`rewriteOwnedSegments`), and each `alias` effect renames the kind wherever an option path names it (`renameOptions`), as a kind rename would.

### `packages/codegen/src/dsl/bind.ts::bindGrammar`

The kind-level half of a bindings overlay, applied to the grammar `grammar()` returned: the options block first takes the binding patches' effects (`rewriteBindingOptions`), then `renameGrammar` renames the kinds and `splitGrammar` splits them, the splits named in base names and mapped through the renames.

### `packages/codegen/src/dsl/bind.ts::renameReparseHosts`

The authored `reparseHosts` block under a rename. It is authored in base names; a host's key and every `priority` and `gated` entry name kinds, while a host's template is source text and stays as written. A block that names no `priority` takes `REPARSE_HOST_PRIORITY`, renamed too, so the emitted table and the kinds it is consulted with share one spelling.

### `packages/codegen/src/dsl/sittir-grammar.ts::UNBOUND_ENV`

The environment variable that asks for a grammar's base: while it is `1`, `sittirGrammar` skips the bindings overlay. `evaluate`'s unbound import sets it around its import, and conflict derivation sets it on the `tree-sitter generate` runs that derive resolutions, so both see the base without building the bound grammar first, and a broken overlay cannot stop the base from evaluating.

### `packages/codegen/src/dsl/sittir-grammar.ts::unboundRequested`

Whether `UNBOUND_ENV` is `1`.

### `packages/codegen/src/dsl/sittir-grammar.ts::patchSets`

A patches entry as its list of sets: one map, an array of maps, or none.

### `packages/codegen/src/dsl/sittir-grammar.ts::withBindingPatches`

The authored patches with each overlay kind's sets appended after the kind's authored sets, each marked by `markBindingSet`. A binding patch therefore sees the rule the authored patches produced, and its paths address that shape.

### `packages/codegen/src/dsl/rule-patterns.ts::onlyAliasedSymbols`

The symbols a set of rule bodies references under a named alias and never by name. An authored hidden rule in that set is not a pattern candidate: its owner gave it a visible name at every reference, and the parser makes that alias the rule's own name only while every reference carries it. Folding an unrelated inline body of the same shape into a plain reference would add an unaliased reference, and the kind would stop being the aliased one. Evaluate's `applyPatternReplacement` and wire's `applyWirePatternReplacement` both ask it; a candidate that folds into an alias site (a declared group) is not subject to it.
