# `packages/codegen/src/dsl` — Function Glossary

Per-function reference for `packages/codegen/src/dsl/`, mechanically relocated from source
comments by `scripts/relocate-comments-to-glossary.mts` (mechanical pass —
unedited, unverified). A later pass reformats/verifies these entries and decides
what merges into docs/compiler-phase-glossary.md's phase narrative.

See [AGENTS.md § Wave-style decomposition before commits](../../AGENTS.md).

---



### `packages/codegen/src/dsl/enrich.ts::getEnrichClauseGroups`

```text
/**
 * Extract the set of enrich-hoisted clause-group names from an enriched grammar
 * result. Returns an empty set when the grammar was not enriched or no clause
 * groups were synthesized.
 */
```

### `packages/codegen/src/dsl/enrich.ts::getEnrichClauseGroupOwners`

```text
/**
 * Extract the synthesized-name → owning-parent-kind map from an enriched
 * grammar result. Returns an empty map when the grammar was not enriched or
 * no clause groups were synthesized.
 */
```

### `packages/codegen/src/dsl/enrich.ts::getEnrichVisibleGroupSources`

```text
/**
 * Extract the hidden source names behind visible-group mints from an
 * enriched grammar result. Wire filters these OUT of the grammar's final
 * `inline:` list before it reaches tree-sitter: an inlined source rule is
 * erased during tree-sitter's inline processing, which vaporizes the alias
 * (and the minted kind's parser identity) while sittir's IR still models
 * the kind — the phantom-kind divergence. Un-inlining the source keeps the
 * mint real on both sides.
 */
```

### `packages/codegen/src/dsl/enrich.ts::extractSupertypeNames`

```text
/**
 * @internal — pull the declared-supertype name set out of the base
 * grammar. Handles both the `{ grammar: { supertypes: $ => [...] } }`
 * wrapped form and the bare `{ supertypes: $ => [...] }` form. Returns
 * names WITH their leading underscore so callers can test
 * `supertypeNames.has('_expression')` and still strip the prefix when
 * composing the field name.
 */
```

#### body

```text
// Callback form (raw author grammar): `$ => [$._expr, ...]`. Invoke
// with a symbol-shaped proxy and harvest the names.
```

#### body

```text
// Proxy that returns a SYMBOL-shaped object for any property access —
// matches tree-sitter's grammar-authoring protocol where `$.foo`
// produces a SYMBOL reference named 'foo'. Enough to let the
// callback return its array; any `.field()` / `.optional()` calls
// inside would miss but no grammars we've seen do that in
// supertypes:.
```

#### body

```text
// Pre-evaluated form: tree-sitter's native grammar() and sittir's
// evaluate() both convert the supertypes callback to an array before
// returning. Tree-sitter native emits `[{type:'SYMBOL', name:'_expr'}, …]`;
// sittir evaluate() emits `['_expr', …]`. Accept both forms.
```

### `packages/codegen/src/dsl/enrich.ts::extractWordName`

```text
/**
 * Resolve the grammar's `word` declaration to a rule NAME across both
 * runtimes. Under sittir's grammarFn it is already a string; in the emitted
 * `.sittir/grammar.js` (which runs enrich BEFORE tree-sitter's native
 * `grammar()`) it is still the raw `$ => $.identifier` callback — invoke it
 * with the same symbol-shaped proxy `extractSupertypeNames` uses and take
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
 *  normalization, `_ref.fieldName` stamping). A missing global means enrich
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
// The name is a convention (`_<kw>_marker`), not a reservation — a base
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

### `packages/codegen/src/dsl/enrich.ts::peelOptional`

```text
/**
 * Detect `optional(content)` across both runtimes:
 * - sittir:      `{ type: 'OPTIONAL', content }`
 * - tree-sitter: `{ type: 'CHOICE', members: [content, {BLANK}] }`
 */
```

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

### `packages/codegen/src/dsl/enrich.ts::peelOptionalSeq`

```text
/**
 * @internal — peel an optional wrapper from a rule node. Returns the inner
 * seq content if the rule is `optional(seq)` (sittir form) or
 * `CHOICE[seq, BLANK]` (tree-sitter normalized form). Returns null if the
 * rule is not an optional-wrapping-a-seq pattern.
 *
 * Also returns the seq member and the index of the seq in the members array
 * (for CHOICE form) so callers can rebuild the CHOICE with a different member.
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
 * `CHOICE[seq,BLANK]` forms, via rebuildOptional).
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
 * boundary. evaluate's `liftCommaSep` then absorbs the folded `optional(sep)`
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
// Record which parent's body this hoist was minted from — see
// `ENRICH_CLAUSE_GROUP_OWNERS_KEY` for why wire() needs this.
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
// Record which parent's body this visible-group hoist was minted
// from — see `ENRICH_CLAUSE_GROUP_OWNERS_KEY` for why wire() needs
// this (an override that redeclares `parentKind` orphans this hidden
// rule, since the synthesized name could never appear in the
// override author's own text).
```

#### body

```text
// Pass 1: symbol ref to the hidden rule (mirrors makeGroupLiftSymbol).
```

#### body

```text
// Pass 2: wrap in a visible alias so the inline-unsafe group surfaces
// as a clean CST node (`<name>`). The alias carries metadata.author so
// transform-path travels through it and link mints the kind.
```

#### body

```text
// aliasName === null: collision — leave inline (un-aliased).
```

#### body

```text
// Optional position with a NON-seq body (optional(seq) was peeled above).
// `peelOptional` normalizes both runtime spellings — sittir's
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
// (those were handled above via peelOptionalSeq).
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
// Descend into field content (a field-wrapped optional(seq) is also a target).
```

### `packages/codegen/src/dsl/enrich.ts::clusterSignatures`

```text
/**
 * Assign a stable cluster-id string to each value in `values`, where two
 * values get the SAME id iff `rulesEqual` (dsl/list-patterns.ts) says they're
 * structurally equal. Used as `diagnoseParseKindCollisions`'s
 * `structuralSignature` input — that function only needs values sharing a
 * signature to be groupable via `distinct()`, not a globally-canonical hash,
 * so an arbitrary-but-consistent per-call cluster index is sufficient and
 * avoids hand-rolling a serializer (DRY: reuses the existing, already
 * separator-shape-aware `rulesEqual` instead).
 *
 * @internal — exported for testing only.
 */
```

```text
// ---------------------------------------------------------------------------
// Base-grammar un-aliasing (parsekind-noninjective auto-fix)
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/dsl/enrich.ts::getEnrichUnaliasDiagnostics`

```text
/**
 * Extract the un-aliasing diagnostics `enrich()` attached to an enriched
 * grammar result (or a grammar object that inherited them, e.g. via
 * `grammarFn`). Returns an empty array when none were attached.
 */
```

### `packages/codegen/src/dsl/enrich.ts::collectUnaliasCandidates`

```text
/**
 * @internal — walk `node` collecting every ALIAS site and bare SYMBOL leaf,
 * resolving each to its referenced rule body via `rulesBag` for structural
 * comparison. Descent runs through `RuleWalker.childEdgesOf` — the ONE
 * canonical child-edge relation (`dsl/rule-walker.ts`) — so every edge the
 * project's walker knows about is covered automatically: SEQ/CHOICE members,
 * FIELD/OPTIONAL/REPEAT/REPEAT1/PREC/TOKEN content, AND a repeat's
 * `separator.value`. (The former hand-rolled descent here silently omitted
 * the separator and token-wrapper edges, so an alias in one of those
 * positions was invisible — a coverage gap and a second, incomplete rule-tree
 * edge relation alongside the canonical one.)
 *
 * Two node kinds get special handling BEFORE the generic descent:
 *   - ALIAS: recorded as a candidate; NOT descended into (its resolved body
 *     is looked up directly via `rulesBag` instead) — mirrors
 *     `applyClauseHoist`'s treatment of its own synthesized wrappers as
 *     opaque once classified.
 *   - SYMBOL: recorded as a candidate leaf (its own storage kind IS its parse
 *     kind); leaves have no edges so descent is a no-op regardless.
 *
 * FIELD additionally rebinds `slotKey` to the field's name for its subtree, so
 * a field-wrapped alias buckets under its enclosing field rather than merging
 * with a same-target alias in a sibling field.
 *
 * The bare `OPTIONAL` edge (absent from `applyClauseHoist`'s
 * `optional(seq(...))`-specific descent) is covered too: sittir's own evaluate
 * runtime produces bare `OPTIONAL` nodes (not always the tree-sitter-CLI-lowered
 * `CHOICE[x,BLANK]` form) before tree-sitter's `grammar()` runs, so a
 * base-grammar alias can sit directly under `optional(...)` at this phase —
 * and `childEdgesOf` descends its `content` edge.
 */
```

#### body

```text
// `path` addresses a real, editable location in the TOP-LEVEL rule passed
// to `applyUnaliasDistinct` only while every ancestor call stayed within
// that rule's own tree. Once a bare-symbol expansion (below) descends into
// a REFERENCED rule's body instead, `path` keeps accumulating segments
// relative to that OTHER rule's structure — segments `rewriteUnaliasAt`
// cannot follow, since the top-level rule's tree has only a bare SYMBOL at
// that point, not the referenced rule's expanded shape. `rewritable`
// tracks whether we're still inside the original rule's own tree; once
// false (set the moment expansion crosses into a referenced rule), it
// stays false for every deeper call, and any ALIAS found from then on is
// witness-only (contributes to collision detection / signature voting)
// and must never be handed to `rewriteUnaliasAt`.
```

```text
// do not descend into the alias's own content
```

#### body

```text
// A bare reference to a rule whose OWN body is a pure CHOICE gets
// its own display identity UNLESS the rule is hidden (leading `_`)
// or a declared supertype — those are the only two mechanisms
// that make tree-sitter collapse straight through to whichever
// arm matched (the same fact this compiler's supertype
// classification already relies on elsewhere); a plain visible,
// non-supertype CHOICE-shaped rule still emits its OWN wrapper
// node, so expanding into it here would be checking the wrong
// question. When the erasure condition holds, expand into the
// rule instead of registering ONE leaf candidate named after the
// union itself, so a sibling alias whose target is only reachable
// through one of THIS union's arms — not the union's own name —
// is still caught as a genuine parsekind-noninjective collision
// (confirmed case: python's argument_list, whose bare `expression`
// arm — a declared supertype — reaches `parenthesized_expression`
// several levels down, colliding with a sibling
// `alias($.parenthesized_list_splat, $.parenthesized_expression)`
// arm). `visited` guards against infinite recursion through
// self/mutually-recursive union grammars (e.g. `expression`
// referencing itself).
```

### `packages/codegen/src/dsl/enrich.ts::rewriteUnaliasAt`

```text
/**
 * @internal — replace the node at `path` (as recorded by
 * `collectUnaliasCandidates`, mirroring `RuleWalker.childEdgesOf`'s segments)
 * with `replacement`. Segments are `'members', <index>` (SEQ/CHOICE),
 * `'content'` (FIELD/OPTIONAL/REPEAT/REPEAT1/PREC/TOKEN), or
 * `'separator', 'value'` (a repeat's separator inner rule). The generic
 * single-property branch handles `content`/`separator`/`value` uniformly (an
 * object spread of the separator wrapper preserves its `trailing`/`leading`).
 */
```

### `packages/codegen/src/dsl/enrich.ts::applyUnaliasDistinct`

```text
/**
 * @internal — resolve `alias($.X, $.Y)` sites where `X`'s rule body is
 * structurally distinct from the other value(s) sharing parse kind `Y`
 * (a `parsekind-noninjective` collision), so each storage kind surfaces under
 * its own name at read time instead of being coerced onto a shared kind.
 *
 * Reuses `diagnoseParseKindCollisions` (the same decision function the
 * later, assemble-time check calls) fed by locally-computed storage/parse
 * kind facts — its comparison logic is phase-agnostic, so it is not
 * reimplemented here. Structurally-identical collisions (the common,
 * intentional case, e.g. multiple hidden rules aliased to one shared display
 * name) merge with no diagnostic, unchanged from `diagnoseParseKindCollisions`'s
 * existing behavior. Only genuinely-distinct collisions trigger a rewrite.
 * This is usually safe (a distinct-storage-kind collision makes read-time
 * dispatch non-injective regardless of author intent), but "distinct" here
 * is judged by `rulesEqual` over RAW, pre-simplify rule shapes — a shallower
 * notion than the assemble-time check's post-simplify/catalog-resolved
 * `structuralSignatureOfValue`/`canonicalRuleSignature` comparison, and the
 * two CAN disagree in principle. No rule name is special-cased here anymore
 * (the former `GRANULARITY_MISMATCH_EXCLUSIONS` python `_suite` carve-out was
 * removed in `cb44e218b` — both `_simple_statements`/`_newline` retargeted
 * cleanly with no live issue remaining, and python's baseline actually
 * improved 107→108).
 * The diagnostic is downgraded to non-blocking severity and kept only as an
 * audit trail of the auto-fix, not a build-blocking error.
 *
 * Per firing candidate, the fix branches on whether `X`'s OWN top-level rule
 * (`rulesBag[X]`) is hidden (leading `_`, tree-sitter/sittir convention) or
 * visible:
 *   - visible → DROP the alias at this site (`alias($.X, $.Y)` → bare `$.X`),
 *     unchanged from this pass's original behavior — `X` already produces an
 *     independent named CST node once un-aliased.
 *   - hidden → RETARGET the alias at this site, from `alias($.X, $.Y)` to
 *     `alias($.X, $.<X-without-leading-underscore>)`. A hidden rule produces
 *     no CST node of its own if merely un-aliased (tree-sitter inlines its
 *     raw content wherever referenced) — aliasing IS the standard mechanism
 *     for giving a hidden rule independent visibility, so retargeting to a
 *     non-colliding name keeps it visible instead of dropping visibility
 *     altogether. Guarded: if the stripped name already exists as a rule
 *     (`rulesBag`/`kwRules`/`clauseGroupRules`), do NOT retarget — leave this
 *     specific candidate's alias untouched and do not downgrade its
 *     diagnostic (stays at original `error` severity, still-blocking, same as
 *     if this pass declined to act).
 *
 * Strictly single-site: only the rule passed in is inspected/rewritten — no
 * cross-rule sweep. Other occurrences of the same `alias($.X, $.Y)` pair in
 * sibling top-level rules are untouched by this call (each such rule gets its
 * own independent call from `applyEnrichPasses`, and is fixed only if ITS OWN
 * local bucket independently diagnoses a collision).
 */
```

#### body

```text
// Bucket by `(slotKey ?? targetName, targetName)` — NOT `targetName` alone.
// Two aliases sharing a target name but living in different fields are
// genuinely distinguishable (the field name disambiguates the read-time
// slot), so they must not be merged into one collision bucket. `slotName`
// is the effective slot key carried onto the diagnostic (the enclosing
// field name when field-wrapped, else the target name — matching the
// assemble-time caller's use of the resolved slot name).
```

#### body

```text
// Per-candidate resolution: 'drop' (visible storage kind — bare content
// replaces the alias site) or a retarget name (hidden storage kind — a
// faithful new ALIAS node with the same content/named, stripped value).
```

#### body

```text
// Retarget names already claimed EARLIER in THIS call (across all buckets).
// Two distinct hidden storage kinds that strip to the same name (e.g.
// `_foo` and `__foo` → `foo`) would otherwise both be scheduled to retarget
// to `foo`, recreating the exact non-injective collision this pass exists to
// eliminate — under the new name. First-claimer wins; later collisions
// decline (their diagnostic stays at original severity, same as the
// pre-existing name-collision guard against `rulesBag`/etc.).
```

#### body

```text
// A collision needs at least one ALIAS site (only aliasing can make a
// storage kind's parse kind differ from its own name) plus 2+ entries
// overall sharing the target name.
```

#### body

```text
// Representative ("this parse kind's canonical shape") signature. A
// candidate whose OWN signature matches it is NOT genuinely distinct and
// is skipped, even though the bucket as a whole fired the diagnostic
// because of some OTHER candidate.
//
// Prefer the signature of the candidate whose `storageKind === targetName`
// — the bare, self-referencing value that IS the native identity for this
// parse kind. Only when the bucket has no such native value do we fall
// back to majority-by-frequency. Frequency alone is wrong: for
// `choice(alias(a1, y), alias(a2, y), y)` where a1/a2 share one shape and
// the bare `y` differs, majority-vote (2 vs 1) would pick a1/a2's shape as
// representative and skip BOTH aliases, leaving the real a1/a2-vs-y
// collision unresolved. Anchoring on the native `y` fixes that.
```

#### body

```text
// diagnoseParseKindCollisions reasons in aggregate over the bucket and
// doesn't identify which specific site(s) collided — since the
// diagnostic only fires on genuine structural distinctness, acting on
// every GENUINELY DISTINCT alias site in the bucket is correct (never
// safe to keep one aliased and not another once distinctness is
// proven) — but a candidate matching the bucket's majority signature
// (see `representativeSignature` above) is NOT genuinely distinct and
// is skipped. Each remaining site independently branches drop vs.
// retarget vs. decline-with-original-severity below.
```

#### body

```text
// Empty stripped name (a storage kind that is all underscores, e.g.
// `_`): there's no valid name to retarget to — decline.
```

#### body

```text
// Already claimed by an EARLIER retarget in this same call (see
// `claimedRetargetNames`) — declining here avoids re-introducing a
// non-injective collision under the stripped name.
```

#### body

```text
// Name-collision guard: leave this candidate's alias untouched;
// its diagnostic keeps original (error) severity below — do not
// downgrade or suppress it.
```

#### body

```text
// Only downgrade/record the diagnostic when at least one candidate in
// this bucket was actually acted on (dropped or retargeted); a bucket
// where every candidate was declined via the name-collision guard must
// keep firing at its original error severity, unchanged. Rewrite the
// wording too, not just the severity — `diagnoseParseKindCollisions`
// phrases every diagnostic as a live, actionable problem ("collapses
// onto parse kind X", "give each colliding arm a distinct alias"),
// but this one describes the BASE grammar's alias shape and has
// already been fixed by the rewrite below — left as the original
// wording, it reads as an open issue in the compiled/enriched
// grammar when it is neither: it's a resolved fact about the
// upstream construct, kept only for audit visibility.
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
 * @internal — mint the hidden-rule + visible-alias name pair for an inline-UNSAFE
 * seq body that enrich surfaces as a VISIBLE CST kind.
 *
 * Unlike the prior content-alias approach (which aliased the multi-member seq
 * DIRECTLY — `alias(SEQ(...), $.name)`, which tree-sitter DISTRIBUTES across the
 * seq's members, scattering empty leaves), this registers a HIDDEN rule whose
 * body is the seq, exactly like the inline-safe clause-hoist path
 * (`clauseHoistSynthName`). The caller then references that hidden rule via a
 * symbol and wraps the symbol in `alias($._<name>, $.<name>)` so tree-sitter has
 * a single symbol-node to rename into ONE clean CST node.
 *
 * Naming:
 *   - hidden rule  = `_<parent>_group<N>` (registered in `clauseGroupRules`)
 *   - visible alias = `<parent>_group<N>` (the same name without the `_`)
 * Per-parent 1-indexed `grp` counter; cross-parent dedupe via
 * `canonicalStringifyClause`. Returns `null` on a name collision with an existing
 * rule in `rulesBag` (caller leaves the body inline).
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

### `packages/codegen/src/dsl/rule-patterns.ts::armLeadingSymbolName`

```text
/**
 * Resolve `rule`'s LEFTMOST reachable symbol name — descending through a
 * SEQ's first member and single-content wrappers (optional/field/repeat/
 * prec/token/...), the same shape a parser's FIRST-set walk would follow.
 * A CHOICE has no single leftmost symbol (it varies per arm) and resolves
 * to `undefined`; the `seen` set guards against infinite recursion on a
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
 * Provenance markers (both now live inside the opaque `metadata` bag — debt
 * PR-P1; the former top-level `SymbolRule.source` field is deleted):
 *   - `metadata.author: 'enrich'` — the canonical marker (debt: source-
 *     homonym resolution, decision 6 — was `metadata.source: 'enrich'`).
 *     Path-descent (transform-path.ts) reads this to recognize an
 *     enrich-synthesized group-lift symbol and travel THROUGH it into the
 *     hoisted body, so authored `transform()`/`groups:` path patches that
 *     address into a now-hoisted seq still resolve.
 *   - `metadata.symbolSource: 'group-lift'` — relocated legacy marker (was
 *     the top-level `SymbolRule.source`). Diagnostics only.
 */
```

#### body

```text
// Pure ref — NO inline body. Tree-sitter serializes any extra structural
// field on a SYMBOL into grammar.json (a `content` here leaks the seq into
// the parser), so the symbol stays a clean name-ref. `metadata.author` is
// the only added marker: `dsl/transform/transform-path.ts`'s path-descent
// (the sanctioned dsl-side reader — doctrine decision 3) reads it and
// LOOKS UP the referenced `_<parent>_<kind><N>` rule body by name to travel
// through (not by carrying the body here). `metadata` is inert to
// tree-sitter's parse tables. (Debt PR-0c: the compiler side no longer
// reads this tag — `compiler/link.ts`'s `mintContentAliasKinds` and
// `resolveRule`'s ALIAS case, and `compiler/evaluate.ts`'s
// `rewriteInlineAliases`, now identify this population structurally via
// `isClauseHoistVisibleGroupAlias`. The write here stays load-bearing for
// transform-path only.)
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
 * @internal — wrap a SYMBOL ref to an inline-UNSAFE group's HIDDEN rule in a
 * TAGGED visible alias so the group surfaces as a single clean CST kind.
 *
 * Shape (confirmed against generated grammar.json ALIAS nodes):
 *   `{ type: 'ALIAS', content: symbol($._<name>), named: true,
 *      value: '<name>', metadata: { author: 'enrich' } }`
 *
 * - The aliased thing is a SYMBOL ref to the hidden `_<name>` rule (NOT the raw
 *   multi-member seq). tree-sitter renames that ONE symbol-node into ONE visible
 *   CST node for `<name>` (a real kindId in parser.c). Aliasing the raw seq
 *   instead made tree-sitter DISTRIBUTE the alias name across the seq members.
 * - `metadata.author === 'enrich'` (debt: source-homonym resolution, decision
 *   6 — was `metadata.source === 'enrich'`) is REQUIRED for transform-path: it
 *   travels THROUGH this tag for authored path-patches
 *   (`dsl/transform/transform-path.ts`'s `isEnrichContentAlias` /
 *   `descendThroughEnrichContentAlias` — the sanctioned dsl-side reader,
 *   doctrine decision 3). (Debt PR-0c: `compiler/link.ts`'s
 *   `mintContentAliasKinds` no longer reads this tag — it identifies the
 *   same population structurally via `isClauseHoistVisibleGroupAlias`,
 *   keying on the alias's `optional`/`CHOICE[x,BLANK]` parent shape, the
 *   target name's absence from `rules`, and the hidden content symbol not
 *   being in the grammar's `inline:` list. The write here stays load-bearing
 *   for transform-path only.)
 * - Case is the active runtime's: built via the injected `alias()`/`symbol()`
 *   constructors, so sittir evaluate yields lowercase, tree-sitter CLI uppercase.
 */
```

#### body

```text
// Pass a SYMBOL value so the runtime constructor sets named:true, value=name
// (a bare-string value would yield named:false). `metadata.author: 'enrich'`
// is REQUIRED for transform-path's path-descent (see doc comment above) —
// the runtime alias() doesn't add it, so stamp it on the cased result.
```

### `packages/codegen/src/dsl/group-classify.ts::ruleMatchesEmpty`

```text
/**
 * Conservative empty-matching predicate. Returns true iff the rule can produce
 * the empty string:
 *   - `optional` / `repeat` / `blank`                      → always matches empty
 *   - `repeat1`                                             → iff content matches empty
 *   - `seq`                                                 → iff ALL members match empty
 *   - `choice`                                              → iff ANY member matches empty
 *   - `field` / prec-wrapper                               → iff content matches empty
 *   - `string` / `symbol` / `token` / `pattern`            → false (non-empty)
 */
```

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
 *   • `ruleMatchesEmpty(rule)` — conservative: returns true iff the rule can
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

### `packages/codegen/src/dsl/group-classify.ts::unwrapPrec`

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
 * `absorbTrailingListSeparators`/`peelOptionalSeq` (enrich.ts) already
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
`field('<kw>_marker', $._kw_*)` spelling so the arms' slots merge.

Atom identity: a generated `<literal>_marker` field collapses to its literal
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
 *  minted once, per owner kind, by the rule catalog (`rule:<owner>:<path>`);
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

```text
/**
 * Normalize a closed literal set to the canonical rule shape.
 *
 * (Relocated from `types/rule.ts` — debt PR-P1: it constructs the
 * `metadata` bag via `makeRuleMetadata`, which `types/` cannot import.)
 *
 * Multi-member sets remain a ChoiceRule (enum-shaped). A single literal
 * collapses to that StringRule so downstream phases classify it as the
 * corresponding keyword/token instead of carrying a degenerate enum shape.
 *
 * (debt: source-homonym resolution, decision 6) Callers pass EITHER
 * `author` (evaluate's grammar-authored-literal-set callers) OR
 * `classifiedBy` (link's enum-promotion classifier) — never both; they are
 * different facts (who wrote the text vs. whether the ENUM classification
 * was declared or inferred), so they are separate optional fields rather
 * than one overloaded `source` value.
 */
```

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
 * Structural identity of two slot-bearing rules ignoring leaf attributes
 * (multiplicity / separator / fieldName / aliasedTo). Used to decide that a
 * head element and a repeat element are "the same list element".
 */
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

#### body

```text
/* Fall back to the choice's separator-string arm, marking it a
			   genuinely OPTIONAL trailing separator — this codebase's
			   convention (see `findRepeatFlag`'s doc comment) is that a bare
			   `trailing` flag always meant "optional" (there's no
			   mandatory-trailing shape anywhere in this compiler); confirmed
			   via a full regen of all 3 grammars (with a temporary diagnostic)
			   that this fallback never fires today — `repArm` already carries
			   its own separator for every current grammar rule. */
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
	 * identically — no narrower traversal exists.
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

### `packages/codegen/src/dsl/enrich.ts::UnaliasDiagnosticSink`

```text
/** A per-`enrich()`-call sink for un-aliasing diagnostics — array + dedupe-by-key
 *  Set, mirroring the assemble-time check's shape but WITHOUT the module-global
 *  lifetime. Created fresh per invocation and attached to that call's result. */
```

### `packages/codegen/src/dsl/enrich.ts::UnaliasCandidate`

```text
/**
 * @internal — a single value contributing to a target-name bucket: either an
 * ALIAS site (`aliasSite` set, eligible to be dropped) or a bare SYMBOL
 * reference sharing the same target name (its own storage kind IS its parse
 * kind — never dropped, but must be counted so `diagnoseParseKindCollisions`
 * sees the full set of colliding storage kinds, matching the real base-grammar
 * shape `choice($.generic_type, alias($.generic_type_with_turbofish,
 * $.generic_type))` where the bare `$.generic_type` branch is what makes the
 * collision detectable at all).
 */
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

```text
/**
 * The real provenance shape. Absorbs:
 *   - the former `RuleBase.metadata` bag (`source` / `inlinedFrom`)
 *   - the former top-level `FieldRule.source` (`'grammar' | 'override' |
 *     'enriched' | 'inferred'`) — relocated here as `fieldSource` (debt PR-P1
 *     item 2; the 'inferred' arm is dropped per the confirmed-dead-writer
 *     probe, lingering-debt-inventory-research.md §2.6)
 *   - the former top-level `SymbolRule.source` (`'grammar' | 'link' |
 *     'group-lift'`) — relocated here as `symbolSource` (debt PR-P1 item 2)
 *
 * Deliberately kept as separate per-fact keys rather than one unified
 * `source` — the three vocabularies are genuinely different value sets (see
 * lingering-debt-inventory-research.md §5.4's "source homonyms" note);
 * collapsing them is a separate design discussion, not in scope here.
 *
 * (debt: source-homonym resolution, decision 6, 2026-07-04) The former
 * `source?: 'grammar' | 'promoted' | 'override' | 'enrich' | 'group-lift'`
 * field wore TWO different facts under one name:
 *   - WHO ORIGINALLY WROTE the rule's text — grammar authoring, an
 *     grammar.sittir.ts patch, dsl-side enrich synthesis, or evaluate synthesis.
 *     This is `author` below. `'group-lift'` never actually appeared as a
 *     `source` value in practice (only as `symbolSource`) and is dropped.
 *   - WHETHER a classification was DECLARED (grammar-authored, e.g.
 *     `grammar.supertypes`) or INFERRED by link's structural classifier
 *     (the former `'promoted'` value). This is `classifiedBy` below — it is
 *     NOT an authorship fact (the rule's text is still grammar-authored
 *     either way; only the ENUM/SUPERTYPE classification decision was
 *     inferred rather than declared).
 */
```

### `packages/codegen/src/dsl/rule-metadata.ts::author`

```text
/**
	 * WHO wrote this rule's text. `'grammar'` — authored directly in the
	 * grammar. `'override'` — authored or replaced by an grammar.sittir.ts patch.
	 * `'enrich'` — dsl-side enrich synthesized this position (path-descent in
	 * transform-path.ts and link's enrich↔link handoff key on this to travel
	 * through / resolve the synthesized position). `'evaluate'` — evaluate
	 * synthesized this rule (mirrors `RuleProvenance`'s
	 * `'evaluate-synthesized'`, decision 6).
	 */
```

### `packages/codegen/src/dsl/rule-metadata.ts::classifiedBy`

```text
/**
	 * WHETHER a rule's ENUM/SUPERTYPE classification was declared in the
	 * grammar (`'grammar'`, e.g. present in `grammar.supertypes`) or inferred
	 * by link's structural classifier (`'link'`, the former `source:
	 * 'promoted'` value). Diagnostics-only (the `promotedRules` derivation
	 * log) — never an
	 * authorship fact.
	 */
```

### `packages/codegen/src/dsl/rule-metadata.ts::fieldSource`

```text
/** Relocated `FieldRule.source` (debt PR-P1 item 2). */
```

### `packages/codegen/src/dsl/rule-metadata.ts::symbolSource`

```text
/** Relocated `SymbolRule.source` (debt PR-P1 item 2). */
```

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

### `packages/codegen/src/dsl/enrich.ts::ENRICH_CLAUSE_GROUPS_KEY`

```text
/**
 * Well-known non-enumerable key attached by `enrich()` to the grammar result
 * when clause-hoist synthesized any hidden group rules. Wire.ts reads this to
 * register the hoisted names in `WireContext.syntheticInline` so they end up
 * in the grammar's `inline:` list (required to prevent tree-sitter LR
 * conflicts from the newly-injected hidden rules).
 */
```

### `packages/codegen/src/dsl/enrich.ts::ENRICH_CLAUSE_GROUP_OWNERS_KEY`

```text
/**
 * Well-known non-enumerable key attached by `enrich()` to the grammar result:
 * synthesized clause-hoist name → the parent kind whose (pre-override) body
 * it was hoisted from. Covers BOTH categories `ENRICH_CLAUSE_GROUPS_KEY`
 * covers (inline-safe) AND the visible-aliased hidden names it deliberately
 * excludes (`_<parent>_group<N>`) — wire() needs both, since an override
 * redeclaring the recorded owner orphans the synthesized rule regardless of
 * which category it's in.
 */
```

### `packages/codegen/src/dsl/enrich.ts::ENRICH_VISIBLE_GROUP_SOURCES_KEY`

```text
/**
 * Well-known non-enumerable key attached by `enrich()`: the hidden SOURCE
 * rule names behind every visible-group mint (`alias($._src, $.visible)`) —
 * both the promote-existing-hidden-rule and synthesize-new-body categories.
 */
```

### `packages/codegen/src/dsl/enrich.ts::ENRICH_UNALIAS_DIAGNOSTICS_KEY`

```text
/**
 * Well-known non-enumerable key under which `enrich()` attaches the
 * (downgraded, non-blocking) `parsekind-noninjective` diagnostics its
 * un-aliasing pass produced for a given grammar evaluation. Read via
 * `getEnrichUnaliasDiagnostics`.
 *
 * Attached to the SAME evaluation's own return object rather than a
 * module-level accumulator (the former design): a module-global array only
 * populated on the FIRST import of a grammar's entry path — Node caches the
 * module, so a second `evaluate()` of the same grammar in one process would
 * observe an empty drain even though the diagnostics conceptually still apply;
 * concurrent evaluations of different grammars would also interleave into one
 * shared array. Travelling with the result object avoids both: the diagnostics
 * stay on the (cached) grammar object, correct on every read, per-grammar.
 */
```

### `packages/codegen/src/dsl/rule-transforms.ts::structuralBuilder`

```text
/**
 * Structural builder: each method builds the plain node literal exactly as
 * the construction sites previously did. Byte-identical to hand-written
 * literals; used as the safe default when no ctx.builder is present.
 */
```

### `packages/codegen/src/dsl/rule-transforms.ts::flagWalker`

```text
/**
 * Does `rule` contain a repeat/repeat1 that declares the given flag?
 *
 * `trailing: true` marks `sepBy` shapes where the final separator is
 * optional (e.g. rust's `{ a, b, }`). `leading: true` marks the
 * mirror shape `sep, x, (sep x)*` (rust's or_pattern `| a | b`, if
 * written as a single repeat). Evaluate's `liftCommaSep` captures
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
`blank` merge fine and need no such treatment.

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
reference, and the wire-facing tracking structures (`visibleGroupHiddenNames`,
`clauseGroupOwners`). A name collision with any existing rule keeps the
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
 *  precedence never reaches link (evaluate strips it), so
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

### `packages/codegen/src/dsl/builders.ts::structuralBuilder.choice`

```text
/**
 * Choice combinator's one-level shape recognition: an all-same-name FIELD
 * choice factors to a single FIELD wrapping a CHOICE of the arms' contents
 * (delegates to {@link collapseAllFieldChoiceMembers}); any other member
 * shape passes through as a plain CHOICE. The single-member collapse,
 * `choice(x, blank())` → `optional(x)`, and all-string → EnumRule
 * detection are evaluate's own sugar (compiler/evaluate.ts's `choice()`
 * wrapper) — they run before this is ever reached, not builder work.
 */
```

### `packages/codegen/src/dsl/builders.ts::collapseAllFieldChoiceMembers`

```text
/**
 * Collapse an all-field choice into a factored field, or leave it as a
 * plain choice of (heterogeneously-named) fields.
 *
 * @param fieldMembers - All members of the choice, already confirmed to be FieldRule<'evaluate'>.
 * @returns A factored `FieldRule<'evaluate'>` when every branch shares one field
 *   name, otherwise a raw `choice` of the original `field()` members.
 * @remarks
 * All branches wrap the SAME field name — factor the field outward to
 * `field('x', choice(A, B))`. The choice content may itself simplify to an
 * enum when all inners are strings.
 *
 * Otherwise (different field names, or any branch wraps an alias — see below),
 * the choice passes through as-is: `choice(field('body', seq), field('semi',
 * seq))` stays exactly that. PR 2 (2026-07-21 union-slot design) retired the
 * prior VARIANT-retype encoding here (`FieldRule<'evaluate'>` / `VariantRule`
 * share the same `name`+`content` shape, so the retype was a pure discriminator
 * change) — that existed only for Link's now-deleted `promotePolymorph` pass to
 * recognize the shape and wrap the rule in a `PolymorphRule`;
 * `PolymorphRule`/`AssembledPolymorph` are fully gone from the pipeline, so the
 * fields now stay FIELD-typed and route into named slots via the per-arm
 * union-slot routing (`carriesNamedField`), same as any other heterogeneous
 * fielded choice.
 *
 * @remarks
 * Any branch wrapping an alias directly takes this same passthrough (checked
 * first, before the same-name factoring). Aliases are structural rename
 * markers; downstream passes (Link, assemble) depend on the alias appearing
 * inside a plain choice to route the synthetic kind into the NodeMap —
 * factoring or retyping shifts classification and leaves the alias target
 * unregistered (observed on rust `_line_doc_comment_marker` /
 * `_block_doc_comment_marker`).
 */
```

### `packages/codegen/src/dsl/builders.ts::structuralBuilder.optional`

```text
/**
 * Optional combinator's one-level shape recognition.
 *
 * @remarks
 * `optional(optional(x))` collapses to `optional(x)` — two layers of
 * "zero or one" is the same as one layer.
 *
 * @remarks
 * `optional(repeat(x))` returns `repeat(x)` unchanged. `repeat` is
 * already optional in the config surface (`items?: T[]`, null-coalesced
 * to `[]` in the factory), so the wrapper adds no information.
 *
 * @remarks
 * `optional(repeat1(x))` is lowered to `repeat(x)`. The two are
 * parse-identical: tree-sitter surfaces "optional didn't fire" and
 * "repeat1 fired with zero items" identically (an empty children list).
 * The non-empty guarantee a bare `repeat1` carries only holds when there
 * is no `optional` wrapper to swallow the empty case.
 */
```

### `packages/codegen/src/dsl/builders.ts::structuralBuilder.repeat`

```text
/**
 * Zero-or-more repetition combinator's one-level shape recognition.
 *
 * @remarks
 * `repeat(repeat(x))` collapses to `repeat(x)` when neither layer carries
 * a distinct separator — the outer loop is redundant.
 *
 * @remarks
 * `repeat(optional(x))` collapses to `repeat(x)` — repeat already handles
 * zero occurrences, so the optional wrapper is redundant.
 *
 * @remarks
 * The separator LIFT (`repeat(seq(sep, x))` → `repeat{separator}`) runs in
 * the link pass, not here — see compiler/lift-separators.ts.
 */
```

### `packages/codegen/src/dsl/builders.ts::structuralBuilder.repeat1`

```text
/**
 * One-or-more repetition combinator's one-level shape recognition.
 *
 * @remarks
 * `repeat1(repeat1(x))` collapses to `repeat1(x)` — the outer "one or
 * more" of "one or more" accepts the same strings as the inner.
 *
 * @remarks
 * `repeat1(repeat(x))` is NOT collapsed to `repeat1(x)`. The inner
 * `repeat(x)` can match empty, so `repeat1(repeat(x))` accepts
 * zero-or-more `x` (one outer iteration of zero inner matches), which
 * matches `repeat(x)`'s language — not `repeat1(x)`'s. The shape is
 * left alone to preserve grammar author intent.
 *
 * @remarks
 * The separator LIFT runs in the link pass, not here — see
 * compiler/lift-separators.ts.
 */
```

### `packages/codegen/src/dsl/builders.ts::structuralBuilder.field`

```text
/**
 * Field combinator's one-level shape recognition: collapses
 * `optional(repeat(...))` and `optional(repeat1(...))` field content to
 * `repeat(...)` (delegates to {@link collapseOptionalRepeatInFieldContent}).
 * Both are parse-identical to `repeat(x)` — tree-sitter surfaces any empty
 * case as an empty children list. Collapsing here keeps evaluate output
 * canonical across all the equivalent list encodings grammar authors write.
 *
 * @remarks
 * Ref-name propagation, the `content === undefined` placeholder sugar for
 * `resolvePatch`, and stopping at inner field/alias boundaries are
 * evaluate's own wrapper concern (compiler/evaluate.ts's `field()`), not
 * builder work — this only shapes the content.
 */
```

### `packages/codegen/src/dsl/builders.ts::collapseOptionalRepeatInFieldContent`

```text
/**
 * Collapse `optional(repeat(...))` and `optional(repeat1(...))` to
 * `repeat(...)` inside a field's content.
 *
 * @param content - The field's already-resolved content rule.
 * @returns The canonicalized rule with the optional wrapper removed when
 *   the inner content is a repeat variant.
 */
```

### `packages/codegen/src/dsl/builders.ts::structuralBuilder.token.immediate`

```text
/**
 * Real IMMEDIATE_TOKEN node (tree-sitter's own dsl.js shape), not
 * `{type: TOKEN, immediate: true}` — see the `ImmediateTokenRule` entry
 * in `docs/glossary/types.md`. `grammarFn`'s `normalizeImmediateTokens`
 * (compiler/evaluate.ts) folds this into TOKEN+immediate once enrich's
 * minting decisions (which must see the same arm shape under both
 * runtimes) are locked in.
 */
```

### `packages/codegen/src/dsl/builders.ts::structuralBuilder.choice`

```text
/**
 * Choice combinator's one-level shape recognition: an all-same-name FIELD
 * choice factors to a single FIELD wrapping a CHOICE of the arms' contents
 * (delegates to {@link collapseAllFieldChoiceMembers}); any other member
 * shape passes through as a plain CHOICE. The single-member collapse,
 * `choice(x, blank())` → `optional(x)`, and all-string → EnumRule
 * detection are evaluate's own sugar (compiler/evaluate.ts's `choice()`
 * wrapper) — they run before this is ever reached, not builder work.
 */
```

### `packages/codegen/src/dsl/builders.ts::collapseAllFieldChoiceMembers`

```text
/**
 * Collapse an all-field choice into a factored field, or leave it as a
 * plain choice of (heterogeneously-named) fields.
 *
 * @param fieldMembers - All members of the choice, already confirmed to be FieldRule<'evaluate'>.
 * @returns A factored `FieldRule<'evaluate'>` when every branch shares one field
 *   name, otherwise a raw `choice` of the original `field()` members.
 * @remarks
 * All branches wrap the SAME field name — factor the field outward to
 * `field('x', choice(A, B))`. The choice content may itself simplify to an
 * enum when all inners are strings.
 *
 * Otherwise (different field names, or any branch wraps an alias — see below),
 * the choice passes through as-is: `choice(field('body', seq), field('semi',
 * seq))` stays exactly that. PR 2 (2026-07-21 union-slot design) retired the
 * prior VARIANT-retype encoding here (`FieldRule<'evaluate'>` / `VariantRule`
 * share the same `name`+`content` shape, so the retype was a pure discriminator
 * change) — that existed only for Link's now-deleted `promotePolymorph` pass to
 * recognize the shape and wrap the rule in a `PolymorphRule`;
 * `PolymorphRule`/`AssembledPolymorph` are fully gone from the pipeline, so the
 * fields now stay FIELD-typed and route into named slots via PR 1's per-arm
 * union-slot routing (`carriesNamedField`), same as any other heterogeneous
 * fielded choice.
 *
 * @remarks
 * Any branch wrapping an alias directly takes this same passthrough (checked
 * first, before the same-name factoring). Aliases are structural rename
 * markers; downstream passes (Link, assemble) depend on the alias appearing
 * inside a plain choice to route the synthetic kind into the NodeMap —
 * factoring or retyping shifts classification and leaves the alias target
 * unregistered (observed on rust `_line_doc_comment_marker` /
 * `_block_doc_comment_marker`).
 */
```

### `packages/codegen/src/dsl/builders.ts::structuralBuilder.optional`

```text
/**
 * Optional combinator's one-level shape recognition.
 *
 * @remarks
 * `optional(optional(x))` collapses to `optional(x)` — two layers of
 * "zero or one" is the same as one layer.
 *
 * @remarks
 * `optional(repeat(x))` returns `repeat(x)` unchanged. `repeat` is
 * already optional in the config surface (`items?: T[]`, null-coalesced
 * to `[]` in the factory), so the wrapper adds no information.
 *
 * @remarks
 * `optional(repeat1(x))` is lowered to `repeat(x)`. The two are
 * parse-identical: tree-sitter surfaces "optional didn't fire" and
 * "repeat1 fired with zero items" identically (an empty children list).
 * The non-empty guarantee a bare `repeat1` carries only holds when there
 * is no `optional` wrapper to swallow the empty case.
 */
```

### `packages/codegen/src/dsl/builders.ts::structuralBuilder.repeat`

```text
/**
 * Zero-or-more repetition combinator's one-level shape recognition.
 *
 * @remarks
 * `repeat(repeat(x))` collapses to `repeat(x)` when neither layer carries
 * a distinct separator — the outer loop is redundant.
 *
 * @remarks
 * `repeat(optional(x))` collapses to `repeat(x)` — repeat already handles
 * zero occurrences, so the optional wrapper is redundant.
 *
 * @remarks
 * The separator LIFT (`repeat(seq(sep, x))` → `repeat{separator}`) runs in
 * the link pass, not here — see compiler/lift-separators.ts.
 */
```

### `packages/codegen/src/dsl/builders.ts::structuralBuilder.repeat1`

```text
/**
 * One-or-more repetition combinator's one-level shape recognition.
 *
 * @remarks
 * `repeat1(repeat1(x))` collapses to `repeat1(x)` — the outer "one or
 * more" of "one or more" accepts the same strings as the inner.
 *
 * @remarks
 * `repeat1(repeat(x))` is NOT collapsed to `repeat1(x)`. The inner
 * `repeat(x)` can match empty, so `repeat1(repeat(x))` accepts
 * zero-or-more `x` (one outer iteration of zero inner matches), which
 * matches `repeat(x)`'s language — not `repeat1(x)`'s. The shape is
 * left alone to preserve grammar author intent.
 *
 * @remarks
 * The separator LIFT runs in the link pass, not here — see
 * compiler/lift-separators.ts.
 */
```

### `packages/codegen/src/dsl/builders.ts::structuralBuilder.field`

```text
/**
 * Field combinator's one-level shape recognition: collapses
 * `optional(repeat(...))` and `optional(repeat1(...))` field content to
 * `repeat(...)` (delegates to {@link collapseOptionalRepeatInFieldContent}).
 * Both are parse-identical to `repeat(x)` — tree-sitter surfaces any empty
 * case as an empty children list. Collapsing here keeps evaluate output
 * canonical across all the equivalent list encodings grammar authors write.
 *
 * @remarks
 * Ref-name propagation, the `content === undefined` placeholder sugar for
 * `resolvePatch`, and stopping at inner field/alias boundaries are
 * evaluate's own wrapper concern (compiler/evaluate.ts's `field()`), not
 * builder work — this only shapes the content.
 */
```

### `packages/codegen/src/dsl/builders.ts::collapseOptionalRepeatInFieldContent`

```text
/**
 * Collapse `optional(repeat(...))` and `optional(repeat1(...))` to
 * `repeat(...)` inside a field's content.
 *
 * @param content - The field's already-resolved content rule.
 * @returns The canonicalized rule with the optional wrapper removed when
 *   the inner content is a repeat variant.
 */
```

### `packages/codegen/src/dsl/builders.ts::structuralBuilder.token.immediate`

```text
/**
 * Real IMMEDIATE_TOKEN node (tree-sitter's own dsl.js shape), not
 * `{type: TOKEN, immediate: true}` — see the ImmediateTokenRule doc
 * comment in types/rule.ts. `grammarFn`'s `normalizeImmediateTokens`
 * (compiler/evaluate.ts) folds this into TOKEN+immediate once enrich's
 * minting decisions (which must see the same arm shape under both
 * runtimes) are locked in.
 */
```

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
// terminality. `name`/
// `kindId` on `content` stay the SOURCE (storage) kind; `aliasedTo` is the
// alias TARGET (the parse kind). No branching on content shape — a literal,
// a symbol, or any other built rule all take the same stamp uniformly.
```

### `packages/codegen/src/dsl/builders.ts::structuralBuilder.alias`

```text
// The tree-sitter ALIAS wrapper: `content` unchanged except a bare SYMBOL
// content is stamped `inline: false` (an alias confers a real visible CST
// kind, so its wrapped reference must materialize rather than fold away —
// mirrors evaluate's own `canonicalizeRawGrammar`, which forces the same
// stamp on any symbol it finds under an ALIAS built some other way). Evaluate never
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
 *     `dsl/transform/transform-path.ts`'s `author === 'enrich'` descent
 *     keying — was `source === 'enrich'` before decision 6's unified
 *     `author` vocabulary)
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
 * Per the governing doctrine (decision 3 + corollary,
 * docs/superpowers/specs/2026-07-02-rule-type-model-ssot-research.md): the
 * compiler must neither read a provenance tag NOR reconstruct authorship
 * STRUCTURALLY. Stamp-then-reread patterns (a phase stamps a tag, a LATER
 * phase/caller re-reads the same rule to decide behavior) must become
 * return-value dataflow instead — see `compiler/link.ts`'s
 * `classifyHiddenRule` / `classifyHiddenChoiceRule` for the converted example
 * (debt PR-P1, item 3).
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

### `packages/codegen/src/dsl/shared.ts::module`

```text
/**
 * dsl/shared.ts — canonical structural-identity key for rule shapes.
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
 * point enrich runs; and sittir's own `evaluate()` runtime stamps every
 * `$.foo` reference with a `_ref: {refType, from, to}` provenance field
 * that tree-sitter's CLI runtime never adds. That last one is exactly what
 * broke group-dedupe before this key existed: hashing a rule by its whole
 * object (minus a hand-maintained exclusion list of known-bad fields like
 * `_ref`) meant every NEW provenance stamp added anywhere in the Rule shape
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

### `packages/codegen/src/dsl/rule-transforms.ts::hasAnyField`

```text
// Genuinely link-phase only — see "Rule IR and snapshots" in
// docs/compiler-phase-glossary.md for the phase-scoping rationale.
```

### `packages/codegen/src/dsl/rule-transforms.ts::Mult`

```text
// ---------------------------------------------------------------------------
// List-fusion pass — fuse a separated-list's head + repeat occurrences into
// a single multi-valued slot.
//
// tree-sitter grammars author `sepBy1`/`commaSep1` lists in shapes that
// `liftCommaSep` (evaluate) does not always collapse — notably when a choice
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
 * / `ruleMatchesEmpty`), and the self-referential chain fold. Recognizers
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
/* PREC family is stripped by evaluate.ts's `stripPrecedenceWrappers`
		   before this runs — see that function's doc comment — so these
		   cases are unreachable at runtime. Transparent single-child wrapper,
		   same as TOKEN/FIELD above. String literals (not rule-types.ts
		   consts): that module is deprecated for new imports — see its
		   header. */
```

#### body

```text
/* IMMEDIATE_TOKEN is folded into TOKEN+immediate by evaluate.ts's
		   `normalizeImmediateTokens` before this runs — unreachable at
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

#### body

```text
// Canonical: `seq(SEP, X)` (leading) or `seq(X, SEP)` (trailing).
```

#### body

```text
// Choice-of-separators in the separator position — preserve the FULL
// choice; the caller (and everything downstream) now knows how to handle
// a non-literal separator rule. No literal-presence check here by design:
// a choice with zero STRING arms (all-symbol/external-scanner) still
// counts as a detected separator shape — it's up to the caller to decide
// what to do when it can't extract a literal from it.
```

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
/* A generated `<literal>_marker` field is the keyword-promotion spelling
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
 * single source for "the parser hides this symbol" — evaluate's
 * `canonicalizeRawGrammar` reads it for both the rule-level `hidden` stamp
 * and the reference-level `inline` computation, and `selfReferentialFoldOf`
 * reads it directly on a self-reference's name. Distinct from
 * `RuleBase.hidden` (sittir's own PUBLISHED visibility fact, which link's
 * `unhideAliasedTargets` may flip to `false` for an alias target): a
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
 * `[field(base), STRING(separator), field(extension)]` with the SAME
 * (base, extension) field-name pair and separator literal across every
 * arm, where at least one arm's base field is a bare (non-alias-wrapped)
 * SYMBOL reference to THIS rule's own name whose name is
 * `isParserHiddenName` — the PARSER's own hiddenness rule (leading `_`),
 * not `RuleBase.hidden` (sittir's published-visibility fact, which link's
 * `unhideAliasedTargets` may flip for an alias target): tree-sitter
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
 * per-pipeline decoration stamps (`id`/`_ref`/`metadata`) — the tree-sitter CLI
 * bundle and sittir's evaluate() must derive the SAME name for the same body.
 * A single symbol (or choice-of-one, or FIELD wrapper) names the element; a
 * multi-arm choice or compound seq has no single name (`null` — the caller
 * falls back to the `elements` basis).
 */
```

### `packages/codegen/src/dsl/rule-patterns.ts::peelOptionalEitherSpelling`

```text
/** @internal — `rule` matches `optional(X)` in either runtime spelling
 *  (`OPTIONAL{content}` or the CLI-desugared `CHOICE[X, BLANK]`); returns the
 *  inner X, else null. */
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

### `packages/codegen/src/dsl/rule-patterns.ts::separatedListBodyInfo`

```text
/**
 * @internal — recognize a whole seq body as ONE separated list, in the two
 * spellings the raw grammars use:
 *   head-form: `[elem, repeat(seq(sep, elem)), optional(sep)?]`
 *              (incl. the nested-head variant `[[elem, repeat(...)], optional(sep)]`)
 *   tail-form: `[repeat(seq(elem, sep)), optional(elem)?]`
 * Works on the pre-pushdown wrapper-intact rule tree (this phase has no
 * `separator`/flank attributes yet) and on both runtime spellings of
 * `optional`. Returns null when the body is not a single separated list.
 */
```

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
 *  collapsing a single occurrence. Consumers: evaluate's
 *  `canonicalizeRawGrammar` gates a reference's `inline` stamp on this
 *  (unless the reference's own name is explicitly in the grammar's
 *  `inline:` array, which overrides the guard); `inline-sets.ts` and
 *  `assemble.ts` read the negation directly as an inlinability check.
 */
```

### `packages/codegen/src/dsl/rule-patterns.ts::isHiddenRule`

```text
/**
 * Reads the `hidden` stamp `RuleBase.hidden` puts on a rule (evaluate's
 * `canonicalizeRawGrammar`, corrected by link's `unhideAliasedTargets` /
 * `stampLinkMintedVisibility`) instead of re-deriving hidden-ness from a
 * leading underscore. The stamp — not the name — is authoritative once a
 * rule has passed through evaluate: a rule some named alias wraps is
 * `hidden:false` even though its name starts with `_`.
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
 *      Field is named `<token>_marker` (semantic suffix indicating
 *      "presence-indicator slot for this literal"); avoids JS-reserved-
 *      keyword collisions (`async`, `static`, `const`) at the
 *      factory/config surface.
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

### `packages/codegen/src/dsl/enrich.ts::EnrichConfig.skip`

```text
/**
	 * Rule names exempt from EVERY mechanical enrich pass — the fixed-point
	 * loop (symbol-to-field, choice-arm-field-wrap, optional-keyword),
	 * clause-hoist, un-aliasing, and `applyNodeChoiceFieldWrap`. Escape
	 * hatch for a rule where the grammar shape looks like a pass's target
	 * but empirically isn't — e.g. python's `string_content`, or rust's
	 * `tuple_type`/`trait_bounds` whose own hand-authored override already
	 * fields the exact position `applyNodeChoiceFieldWrap`'s separated-list
	 * target would also try to field (see that function's doc comment) —
	 * rather than a
	 * per-pass knob that every future pass would need its own copy of.
	 */
```

### `packages/codegen/src/dsl/enrich.ts::enrich`

#### body

```text
// Grammar-wide word-shape matcher (Camp A). `word`'s shape depends on
// which runtime is evaluating us: under sittir's own `grammarFn` (the
// globalThis.grammar shim — see compiler/evaluate.ts
// saveAndInjectDslGlobals) it is already a resolved rule NAME (string |
// null); but the emitted `.sittir/grammar.js` runs enrich() BEFORE
// tree-sitter's native `grammar()`, so there `word` is still the raw `$
// => $.identifier` callback. Resolve the callback form with the same
// symbol-shaped-proxy trick `extractSupertypeNames` uses, so both paths
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
// Synthesized clause-hoist name → the parent kind whose body it was
// hoisted FROM (recorded once, at first mint — see the two record sites
// inside `applyClauseHoist`). Exposed via `ENRICH_CLAUSE_GROUP_OWNERS_KEY`
// so wire() can tell, once an override redeclares that owner, that the
// synthesized name is now orphaned (the override author could never have
// typed a reference to a name that doesn't exist until THIS enrich() call
// mints it from the base grammar's own, pre-override shape).
```

#### body

```text
// Per-call un-aliasing diagnostic sink (see ENRICH_UNALIAS_DIAGNOSTICS_KEY):
// local to THIS enrich() invocation, attached to its result below.
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
// Base-grammar un-aliasing also needs to reach clause-hoist-minted group
// rules, not just the original rulesBag entries above. `applyEnrichPasses`
// only calls `applyUnaliasDistinct` on EACH RULE'S OWN body — but the
// widened clause-hoist mint gate can hoist a `choice(…, alias($._reserved_identifier,
// $.identifier), …)`-shaped position OUT of a rule that pass would otherwise
// have un-aliased, into a brand-new `clauseGroupRules` entry the per-name
// loop above never independently visits (it iterates `rulesBag`, not
// `clauseGroupRules`). Run the same pass over every minted group once the
// main loop has fully settled, so it sees every mint from every rule.
```

#### body

```text
// Inject `_<kw>_marker` hidden rules — `registerKwRule` already checked
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
// Attach the synthesized-name → owning-parent-kind map (BOTH categories —
// inline-safe AND visible-aliased) so wire() can detect when an override
// redeclares the owner and orphans the synthesized rule. See
// `getEnrichClauseGroupOwners`.
```

#### body

```text
// Attach this call's un-aliasing diagnostics to its own result (non-enumerable,
// like the clause-groups key) so they travel with the grammar object instead
// of a module-global accumulator — see ENRICH_UNALIAS_DIAGNOSTICS_KEY.
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
// the "VAPORIZED" phantom divergence. See getEnrichVisibleGroupSources.
```

### `packages/codegen/src/dsl/enrich.ts::applyFieldWrapPasses`

#### body

```text
// Fixed-point loop. The current pass set has well-defined
// non-overlapping outputs (symbol-to-field wraps SYMBOLs as FIELD;
// optional-keyword wraps optional(STRING) as FIELD(SYMBOL(_<x>_marker))),
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

### `packages/codegen/src/dsl/enrich.ts::applyHoistAndUnalias`

```text
// Clause-hoist runs AFTER the field-wrapping loop has converged — it must
// see the enrich-inferred (`source:'enriched'`) FIELDs, because its trigger
// is `optional(seq(…))` with `some(isString) && some(isField)`. Running it
// first (the original placement) missed every clause whose field is added
// by applySymbolToField (e.g. rust `abstract_type`'s
// `for <type_parameters>`), leaving those for detectClause. One pass: once a
// seq is hoisted its replacement is `optional(SYMBOL)`, which won't re-trigger.
// It is a separate per-rule stage (not the tail of `applyFieldWrapPasses`)
// so enrich() can field-wrap EVERY rule before hoisting ANY of them — the
// separated-list naming below needs grammar-global field-name uniqueness,
// which only exists once all rules carry their enriched fields.
```

#### body

```text
// Per-parent counter is local; dedupeMap + clauseGroupRules are shared across rules.
```

#### body

```text
// Base-grammar un-aliasing: drop (visible X) or retarget (hidden X)
// alias($.X, $.Y) sites where X's storage kind is structurally distinct
// from the other value(s) sharing parse kind Y (parsekind-noninjective).
// Runs after clause-hoist has settled so it sees the final member shape.
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
 * ordinary `field('elements', repeat(choice(...)))` wrap instead of
 * staying split across per-kind wire buckets joined by
 * `_concatInSourceOrder`.
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
 * Some `repeat(choice(...))` shapes still can't be judged safe from grammar
 * structure alone even at this late point — e.g. python's `string_content`,
 * whose plain-text arm is an implicit gap (no real CST child), correctly
 * rendered today via a verbatim `$TEXT` fallback that fielding would
 * displace. That's a corpus fact, not a structural one, so callers pass an
 * explicit `EnrichConfig.skip` list for cases like it — see `enrich()`'s
 * `config` parameter (skips ALL enrich passes for the named rule, not just
 * this one).
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

### `packages/codegen/src/dsl/enrich.ts::fieldSeparatedListElements`

```text
/**
 * A separated list — `seq(element, repeat(seq(SEP, element)), optional(SEP))`
 * (tree-sitter's `commaSep1`-style desugaring; `dsl/rule-patterns.ts`'s
 * `separatorOf` is the canonical recognizer for the repeat's own
 * `seq(SEP, element)` content) — routes its LEADING element and every
 * REPEATED element into separate per-kind wire buckets today (no field
 * ties them together), needing `_concatInSourceOrder` to reassemble
 * document order at read time.
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
 * Declines when the leading position is already fielded (nothing to do),
 * when the repeat is the TRAILING-separator form (`seq(element, SEP)` —
 * `detected.trailing`, a different, rarer shape not handled here), or
 * when the leading element and the repeat's element aren't the same shape
 * (`sameElementShape` — a mismatch means this isn't really one list, e.g.
 * an unrelated repeat happens to sit right after some other element).
 *
 * Runs everywhere the shape matches — same as case 1/case 2 above, no
 * pass-specific gate of its own. Rules whose own hand-authored override
 * already fields this exact position exempt themselves the standard way,
 * via `enrich()`'s `config.skip` (see `EnrichConfig.skip`'s doc comment):
 * enrich runs before any override, so it has no way to see one exists.
 * rust's `tuple_type: { '(_type)': field('type') }` was the first found
 * this way — this pass fielding `_type` first left the override's kind
 * search with zero occurrences to find, a hard `tree-sitter generate`
 * failure, not a silent one; `trait_bounds`'s own `'bounds'`-fielding
 * override showed up the same way, as an `accessor-throw: repeated slot
 * "bounds" requires at least one value` — both are skip-listed in their
 * grammar's own `enrich(base, { skip: [...] })` call, same discovery path
 * as python's `string_content`.
 */
```

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
 * An unnamed union repeat forces the native read to bucket children
 * per concrete kind and the wrap to re-merge them (`_concatInSourceOrder`),
 * which cannot order text-collapsed scalar elements (no `$span` /
 * `$childIndex`) and does not guarantee cross-kind interleaving even for
 * node stubs. A field-keyed read delivers ONE array in cursor order and
 * never enters that path. The field name is the union symbol's name
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
// OPTIONAL) IS an optional-shape and must be tried via peelOptional
// before falling back to generic per-member CHOICE recursion below.
```

#### body

```text
// Descend through prec wrappers to reach inner seqs.
```

### `packages/codegen/src/dsl/enrich.ts::tryPromoteInnerKeyword`

#### body

```text
// `_marker` suffix avoids JS-reserved-keyword collisions.
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
// peelOptional helper).
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

### `packages/codegen/src/dsl/enrich.ts::separatedListNameCounts`

```text
/** Grammar-global separated-list name counts for the CURRENT enrich() call —
 *  set between loop 1 (field-wrap) and loop 2 (hoist), cleared after. Module
 *  state rather than a threaded parameter, matching the `setGroupLiftRuleMap`
 *  precedent; null outside enrich() (standalone hoist tests keep ordinal
 *  naming). */
```

### `packages/codegen/src/dsl/enrich.ts::separatedListEnrichSkip`

```text
/** The current enrich() call's skip set — consulted by the mint-path list
 *  flattening (a skipped kind keeps its original body spelling: the skip
 *  exists because downstream fielding must not touch it, and the flat
 *  spelling changes its slot derivation). Same lifecycle as
 *  {@link separatedListNameCounts}. */
```

### `packages/codegen/src/dsl/enrich.ts::hiddenListPromotionNames`

```text
/** Per-enrich() cache of hidden-list-rule promotions: hidden rule name →
 *  the visible kind name every bare reference aliases to. Same lifecycle as
 *  {@link separatedListNameCounts}. */
```

### `packages/codegen/src/dsl/enrich.ts::hoistKwRules`

```text
// Loop-2 (clause-hoist) access to the enrich() call's keyword bag and word
// matcher, for the permutation-choice decline + marker normalization: a
// keyword already `_kw_*`-promoted in one arm must key identically to its
// raw string spelling in a sibling arm, and only word-shaped literals are
// modifier candidates. Same set/reset-in-try/finally pattern as the
// separated-list state above.
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
 * slot merging needs both spelled `field('<kw>_marker', $._kw_<kw>_marker)`.
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

### `packages/codegen/src/dsl/enrich.ts::synthesizeFieldEnumRules`

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
// Low precedence so this newly-real rule defers to whatever else the
// same literal can start, without a `conflicts:` entry per occurrence.
// `author: 'enrich'` — this CHOICE body is minted by this pass, not
// authored directly in the grammar (`'grammar'` would misattribute it).
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

```text
/**
 * `preference(label, default)` — a user-facing choice, declared on the
 * choice-shaped kind it lives on. As a kind-level patch value it labels
 * every arm of the kind's choice and marks the arm spelled `default`
 * (literal text, alias target, symbol name or variant name) as the one
 * that applies when the user sets nothing; as a path-level patch value it
 * does the same for the choice at that position. The label is the option
 * key in the generated catalog, shared by every site that references the
 * kind. Distinct from `arm.default`, which is the semantic default a bare
 * construction takes and is never an option.
 */
```

### `packages/codegen/src/dsl/primitives/preference.ts::isPreference`

```text
/** Whether a patch value is a preference placeholder. */
```
