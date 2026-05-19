# Compiler Phase Glossary

Site documentation for every significant function in the sittir codegen
compiler pipeline. Each entry covers pattern (when it fires), action
(what it does), and output (what changes). Phases run in order:
Enrich -> Evaluate -> Link -> Optimize -> Simplify -> Assemble.

> **Updated 2026-05-19 to reflect the planned rule-attribute / template-emitter
> refactor.** Sections marked **(PR0 / PR1 / PR2 / PR3 — planned)** describe the
> target state after the 4-PR refactor lands. See
> [`docs/superpowers/specs/2026-05-18-rule-attributes-and-template-emitter-design.md`](./superpowers/specs/2026-05-18-rule-attributes-and-template-emitter-design.md)
> for the source-of-truth design. Items marked **(legacy — to be removed in PRn)**
> describe pre-refactor behavior that remains in effect on `master` until the
> referenced PR lands. Trust the spec when it differs from the
> [implementation plan](./superpowers/plans/2026-05-19-rule-attributes-and-template-emitter.md).

---

## Rule IR (`compiler/rule.ts`) — planned attribute set

> **(PR0 — planned)** Every `Rule` extends a shared `RuleBase` with modifier
> attributes that previously lived only as wrapper rule types. Wrapper types
> stay in place through PR0–PR2 and delete in PR3; the attributes are additive
> until then. Vocabulary mirrors `NodeOrTerminal` exactly so values that flow
> from a rule to its slot use identical field names (see memory entry
> `feedback_rule_slot_vocabulary_alignment`).

```ts
interface RuleBase {
  readonly id?: RuleId;

  readonly fieldName?: string;
  readonly multiplicity?: Multiplicity;   // 'optional' | 'single' | 'array' | 'nonEmptyArray'
  readonly nonterminal?: boolean;         // explicit slottiness; promotes terminals to slots

  readonly separator?:
    | string
    | readonly Rule[]
    | {
        readonly rules: readonly Rule[];
        readonly trailing?: boolean;     // separator MAY appear after last element
        readonly leading?: boolean;      // separator MAY appear before first element
      };
}
```

- `Multiplicity` moves from `compiler/node-map.ts` to `compiler/rule.ts` (or
  shared `compiler/multiplicity.ts`) so `rule.ts` can reference it without
  inverting the existing `rule.ts` → `node-map.ts` layering.
- **Wrapper rule types (`OptionalRule`, `FieldRule`, `RepeatRule`, `Repeat1Rule`)
  ultimately delete in PR3.** Information they carried (presence, cardinality,
  field binding, slottiness) lives on the inner rule as attributes. Type guards
  collapse to attribute reads: `isOptional(r)` → `r.multiplicity === 'optional'`,
  `isField(r)` → `r.fieldName !== undefined`, etc.
- **`ClauseRule` deletes in PR2.** Its role (remembering flanking literals bound
  to an optional's field) is subsumed by the universal seq-of-leaves canonical
  shape — flanking literals naturally live as adjacent members of the
  containing seq; no dedicated rule attribute is required.

### Universal canonical shape (post-PR2)

After simplification, every `AssembledBranch` and `AssembledGroup` body is a
`SeqRule` whose members are **leaves**:

- a pure-literal rule (`StringRule` with no slot attributes), or
- a slot-ref leaf (`SymbolRule` / `StringRule` / `EnumRule` with at least one
  of `{fieldName, multiplicity, nonterminal}` set).

No nested structural rules (`optional`, `repeat`, `repeat1`, `seq`, `choice`)
appear inside a branch/group body. Wrapper content that was a single leaf is
push-down-flattened into attributes on the leaf; wrapper content that was
structural triggers group synthesis. The simplify phase is the post-condition
verifier (see Phase 3.5).

---

## Phase 0: Enrich (`dsl/enrich.ts`)

Pre-evaluation mechanical grammar enrichment. Runs before `grammar()`
so tree-sitter's native pipeline sees the enriched rules.

> **(PR0 — planned)** Enrich grows four additional passes that populate the
> new `RuleBase` modifier attributes and (for non-leaf wrapper contents)
> synthesize hidden helper rules using the same injection pattern as the
> existing `_kw_<name>` helpers. The passes are idempotent and produce no
> observable change to existing consumers — wrappers stay in place; synthesized
> groups become first-class `AssembledGroup` kinds handled by the existing
> hidden-rule classification path in Link.
>
> **Open architectural question (resolved at PR0 implementation time):** where
> auto-synthesis of multi-slot optional/repeat content lives. Option A —
> TS-side-only via enrich (requires wrap/from to virtually project the parser's
> flat CST onto the synthesized group). Option B — dual-side (wire patches the
> parser; enrich/Link mirror codegen-side); mirrors the existing authored
> `groups:` synthesis architecture. Option C — wire-only, with codegen
> inheriting via post-evaluation. The choice affects scope of PR0 but not the
> overall four-PR sequence. See spec §"Open architectural question".

### enrich(base)
**Pattern:** Called with a `GrammarResult` before `grammar()`.
**Action:** Applies all enrichment passes to every rule in the grammar. Injects synthesized `_kw_*` hidden rules into the rules map.
**Output:** New `GrammarResult` with enriched rules and merged `_kw_*` entries.

### applyEnrichPasses(ruleName, rule, kwRules, supertypeNames)
**Pattern:** Each rule in the grammar.
**Action:** Fixed-point loop (max 8 iterations) applying symbol-to-field and optional-keyword passes until convergence.
**Output:** Enriched rule with field wrappers and `_kw_*` registrations.

### extractSupertypeNames(base, hasWrapper)
**Pattern:** Grammar has a `supertypes:` callback.
**Action:** Invokes the callback with a proxy `$` to extract supertype kind names.
**Output:** `ReadonlySet<string>` of supertype names (with leading `_`).

### applySymbolToField(ruleName, rule, supertypeNames)
**Pattern:** Non-hidden rule with a top-level seq containing bare symbols.
**Action:** Wraps unique bare symbols as `field(name, symbol)`. Handles bare, optional, and optional-seq-with-one-symbol shapes. Skips hidden rules, duplicate symbols, claimed names, symbols inside repeats.
**Output:** Rule with FIELD wrappers carrying `source: 'enriched'`.

### detectSymbolTarget(member)
**Pattern:** A seq member that is a bare symbol, `optional(symbol)`, or `optional(seq(symbol, anon...))`.
**Action:** Returns a `SymbolTarget` with the symbol name and a `wrap()` rebuilder.
**Output:** `SymbolTarget | null`.

### countSymbolsInRepeat(node, kindCounts, inRepeat)
**Pattern:** Any rule tree position.
**Action:** Walks the tree, counting symbol refs that appear inside `repeat`/`repeat1` wrappers. Stops at field/alias boundaries.
**Output:** Mutates `kindCounts` map with per-symbol occurrence counts.

### promoteInsideRepeatMembers(ruleName, members, supertypeNames, existing)
**Pattern:** Outer seq members that are `repeat(seq(...))` or `repeat1(seq(...))`.
**Action:** Applies field-promotion to bare symbols inside each inner seq.
**Output:** New members array if any promotions fired; original array otherwise.

### tryPromoteInRepeatSeq(ruleName, rule, cursor, outerPrecStack, supertypeNames)
**Pattern:** Top-level rule is `repeat(seq(...))` (not itself a seq).
**Action:** Peels prec wrappers, applies field-promotion to the inner seq's bare symbols.
**Output:** Rebuilt rule with field wrappers, or original unchanged.

### applyOptionalKeyword(ruleName, rule, kwRules)
**Pattern:** Rule containing `optional(identifier-literal)` at any position.
**Action:** Wraps the inner literal as `field(<kw>_marker, symbol(_kw_<kw>))` and registers a hidden `_kw_*` rule.
**Output:** Rule with keyword promotions applied.

### walkOptionalKeyword(ruleName, rule, claimedAtSeqLevel, kwRules)
**Pattern:** Descends through seq, choice, optional, repeat, field, prec wrappers.
**Action:** Finds `optional(string-literal)` positions and delegates to `tryPromoteInnerKeyword`.
**Output:** Rewritten rule or `null` (no change).

### tryPromoteInnerKeyword(ruleName, optionalRule, inner, claimed, kwRules)
**Pattern:** Inner content of an optional is an identifier-shaped string literal.
**Action:** Creates `field(<kw>_marker, symbol(_kw_<kw>))` wrapping the literal. Registers the `_kw_*` hidden rule.
**Output:** Rebuilt optional with field-wrapped keyword, or `null`.

### registerKwRule(hostRule, stringLiteral, keyword, kwRules)
**Pattern:** A keyword literal needs a hidden rule for field wrapping.
**Action:** Registers `_kw_<keyword>` in `kwRules` (idempotent). Returns a SYMBOL ref to it.
**Output:** `SymbolRule` referencing the hidden `_kw_*` rule.

### enrichFieldWrappers(rule) **(PR0 — planned)**
**Pattern:** Every `FieldRule`.
**Action:** Propagates `fieldName` and `nonterminal: true` onto the wrapped content (matches today's `rule-catalog.ts:234` `forcedBy === 'field'` force-promotion semantics). Wrapper stays in place until PR3.
**Output:** Field rule whose inner content now carries the field-binding + slottiness attributes directly.

### enrichMultiplicityWrappers(rule) **(PR0 — planned)**
**Pattern:** Every `OptionalRule` / `RepeatRule` / `Repeat1Rule`.
**Action:** Propagates the corresponding `multiplicity` (`'optional'` / `'array'` / `'nonEmptyArray'`) plus `nonterminal: true` onto the wrapped content. Wrappers force nonterminal-ness because they're presence-tracked or list-shaped. Wrapper stays in place until PR3.
**Output:** Wrapper rule whose inner content now carries the multiplicity attribute directly.

### decomposeOptional(rule, synth) **(PR0 — planned)**
**Pattern:** `OptionalRule` whose content is a `seq` or `choice` with at least one slot-bearing member (i.e. structural content, not a single leaf).
**Action:** Synthesizes a hidden helper rule (`_opt_group_<hash>`) containing the original seq/choice verbatim; replaces the optional's content with a symbol-ref to the synthesized group. Single-leaf contents are handled by `enrichMultiplicityWrappers` instead (no synthesis needed). Co-optional semantics ("both or neither" for multi-field optionals) are preserved by construction because the entire content becomes one slot.
**Output:** Optional whose content is now a symbol-ref to a synthesized hidden group; new `_opt_group_<hash>` entry added to the rules map.

### decomposeRepeat(rule, synth) **(PR0 — planned)**
**Pattern:** `RepeatRule` / `Repeat1Rule` whose content is a `seq` / `choice` with slot-bearing members.
**Action:** Two sub-cases. (1) Single slot-bearing member with separator-like string literals: lift the separator onto the repeat's `separator` attribute as `Rule[]`; point content at the inner leaf. (2) Multi-slot content: synthesize a hidden helper rule (`_rep_group_<hash>`) containing the original content; replace the repeat's content with a symbol-ref to the synthesized group; separator (if present) stays on the repeat.
**Output:** Repeat whose content is either a leaf with attributes or a symbol-ref to a synthesized hidden group; new `_rep_group_<hash>` entry added to the rules map (case 2 only).

---

## Phase 1: Evaluate (`compiler/evaluate.ts`)

Executes grammar.js DSL and produces a `RawGrammar`. Mirrors tree-sitter's
`grammar()` function with sittir extensions.

### evaluate(entryPath)
**Pattern:** CLI invocation with a grammar.js or overrides.ts path.
**Action:** Injects DSL globals, imports the module, extracts the grammar.
**Output:** `Promise<RawGrammar>`.

### normalize(input)
**Pattern:** Any raw DSL input (string, RegExp, Rule object).
**Action:** Converts to the canonical `Rule` type.
**Output:** `StringRule`, `PatternRule`, or the input `Rule`.

### seq(...members)
**Pattern:** DSL `seq(a, b, c)` call.
**Action:** Normalizes members; collapses single-member seqs; lifts `commaSep1` patterns to `repeat1` with separator; absorbs trailing separator optionals.
**Output:** Canonical `SeqRule`, `Repeat1Rule`, or single member.

### choice(...members)
**Pattern:** DSL `choice(a, b, c)` call.
**Action:** Collapses single-member; lowers `choice(x, blank())` to `optional(x)`; compacts all-string choices to `EnumRule`; factors all-field choices.
**Output:** `ChoiceRule`, `OptionalRule`, `EnumRule`, or factored `FieldRule`.

### optional(content)
**Pattern:** DSL `optional(x)` call.
**Action:** Marks refs as optional; collapses `optional(optional(x))`, `optional(repeat(x))`, and `optional(repeat1(x))`.
**Output:** `OptionalRule` or collapsed equivalent.

### repeat(content) / repeat1(content)
**Pattern:** DSL `repeat(x)` / `repeat1(x)` calls.
**Action:** Marks refs as repeated; collapses redundant nestings; extracts separator from inner `seq(sep, x)`.
**Output:** `RepeatRule` / `Repeat1Rule` with optional `separator`, `trailing`, `leading`.

### field(name, content?)
**Pattern:** DSL `field('name', $.rule)` call.
**Action:** Normalizes content; collapses `optional(repeat*)` inside fields; propagates field name to nested symbol refs.
**Output:** `FieldRule` with propagated refs.

### createProxy(currentRule, refs)
**Pattern:** Each rule evaluation needs a `$` proxy.
**Action:** Creates a Proxy that records symbol references into `refs` on property access.
**Output:** `Record<string, SymbolRuleWithRef>` proxy.

### isHiddenKind(name, inlineList?)
**Pattern:** Any kind name check.
**Action:** Returns true for `_`-prefixed names or names in the `inline` list.
**Output:** `boolean`.

### synthesizeInlineAliasSources(rules, provenanceByKind, externals)
**Pattern:** Post rule-evaluation.
**Action:** For `alias(inlineContent, $.target)` where source is not a bare symbol, synthesizes `_${target}` hidden rule with the inline body.
**Output:** Mutates `rules` with new `_*` entries; rewrites alias sources to symbol refs.

### synthesizeFieldEnumRules(rules, provenanceByKind)
**Pattern:** Post rule-evaluation.
**Action:** Detects `field(name, choice('a','b','c'))` patterns; synthesizes named hidden enum rules with dedup and canonical naming.
**Output:** Mutates `rules` with synthesized `_*` enum entries; rewrites field contents to symbol refs.

### collapseAllFieldChoiceMembers(fieldMembers)
**Pattern:** `choice(field(x, A), field(x, B))` -- all members are fields.
**Action:** Same name: factors to `field(x, choice(A, B))`. Different names: retypes to `variant` nodes.
**Output:** Factored `FieldRule` or `choice` of `VariantRule`s.

### liftCommaSep(members)
**Pattern:** Normalized seq body matching `[x, repeat(sep, x)]` or variants.
**Action:** Lifts to `repeat1(x, separator=sep)` with optional `trailing`/`leading`.
**Output:** `Repeat1Rule` or `null`.

### grammarFn(optionsOrBase, options?)
**Pattern:** Top-level `grammar()` call in grammar.js.
**Action:** Evaluates all rule functions, metadata callbacks, injects synthetics, builds rule catalog.
**Output:** `{ grammar: RawGrammar }`.

---

## Phase 2: Link (`compiler/link.ts`)

Resolves what nodes ARE. After Link: no `alias`, no `token` wrapper.
All field nodes enriched with provenance. Shape identical before and after
(no restructuring).

> **(PR2 — planned)** Clause detection (`detectClause`) and the `ClauseRule`
> case are removed. The 27 `'clause'` case sites across the codebase collapse
> into the `'optional'` cases that already handle the same shape; flanking
> literals live as adjacent members of the containing seq under the universal
> canonical shape.
>
> **(PR0 — planned)** `applyGroupOverrides` continues to process
> user-authored `groups:` config unchanged. Auto-synthesized helper rules
> emitted by `decomposeOptional` / `decomposeRepeat` already live in the
> enriched rules map by the time Link runs; they're classified by the existing
> hidden-rule classification path (`classifyHiddenRule` → `GroupRule`) with no
> special handling.

### link(raw, include?)
**Pattern:** Called with a `RawGrammar` from Evaluate.
**Action:** Resolves all rules, classifies hidden rules, promotes terminals, infers field names, detects polymorphs, applies override polymorphs, hoists indent into repeats, annotates block-bearer fields, collects repeated shapes.
**Output:** `LinkedGrammar` with resolved rules, derivation log, alias map.

### resolveRule(rule, currentName, allRules, supertypes, externalRoles)
**Pattern:** Every rule in the grammar, recursively.
**Action:** Resolves aliases (named -> symbol with `aliasedFrom`; unnamed non-word -> string literal), flattens token wrappers, inlines role symbols, detects clauses from `optional(seq(string, field))`.
**Output:** Resolved `Rule` tree with no aliases or token wrappers.

### classifyHiddenRule(name, rule, supertypes, references)
**Pattern:** Hidden (`_`-prefixed) or supertype-declared rules.
**Action:** Promotes all-string choices to `EnumRule`; promotes symbol-compatible choices to `SupertypeRule`; wraps hidden seqs with fields as `GroupRule`.
**Output:** Classified rule or original unchanged.

### promotePolymorph(rule)
**Pattern:** Top-level choice of variant-wrapped members.
**Action:** Checks all variants are distinguishable and field sets are heterogeneous. Builds `PolymorphRule` with fused prefix/suffix.
**Output:** `PolymorphRule` with `source: 'promoted'`, or original unchanged.

### applyOverridePolymorphs(rules, variants, derivations)
**Pattern:** `polymorphVariants` from evaluate (variant() declarations).
**Action:** For each parent, finds the variant choice, builds override-source `PolymorphRule`. Pushes ambient scaffold into variant children when the choice is deeply nested.
**Output:** Mutates `rules` with `PolymorphRule` entries; logs to derivations.

### findVariantChoice(rule)
**Pattern:** Rule with a top-level choice (bare or inside a seq with exactly one choice).
**Action:** Extracts the choice and its prefix/suffix from the enclosing seq.
**Output:** `VariantChoiceLocation` or `null`.

### wrapVariants(choice)
**Pattern:** A choice rule to be variant-wrapped.
**Action:** Wraps each member in a `variant` node with a derived name (from detect token, symbol, or index).
**Output:** Choice with `VariantRule` members, deduplicated.

### nameVariant(variant, index, all)
**Pattern:** A single choice member.
**Action:** Finds a distinguishing string literal or symbol name; falls back to `form_N`.
**Output:** Variant name string.

### tokenToName(token)
**Pattern:** A punctuation/operator string.
**Action:** Maps via `TOKEN_NAMES` lookup, word-char passthrough, or char-by-char fallback.
**Output:** Readable identifier name (e.g. `'+'` -> `'plus'`).

### detectClause(content, currentName) **(legacy — to be removed in PR2)**
**Pattern:** Content of an `optional` that is `seq(string, field, ...)`.
**Action:** Wraps as `ClauseRule` named after the first field.
**Output:** `ClauseRule` or plain `optional`.

**Removal note:** PR2 deletes this function together with `ClauseRule` and the
27 `'clause'` case sites. The same shape is recognized via the universal seq-of-leaves
canonical shape — flanking string literals live as adjacent members of the
optional's containing seq; no dedicated rule type is needed.

### inferFieldNames(references)
**Pattern:** Symbol reference graph from evaluate.
**Action:** Groups refs by target; finds symbols with >=5 named refs and >=80% agreement on a field name.
**Output:** `Map<symbolName, InferredName>` with name, confidence, agreement.

### hoistIndentIntoRepeat(rules)
**Pattern:** Rules containing `seq(..., indent, repeat(...), ...)`.
**Action:** Sets `separator: '\n'` on the nearest following repeat.
**Output:** Mutates repeat rules with block separator.

### annotateBlockBearerFields(rules)
**Pattern:** Fields whose content transitively reaches an `indent` node.
**Action:** Computes hidden-bearer set by fixpoint reachability; marks fields with `blockBearer: true`.
**Output:** Mutates field rules with the `blockBearer` flag.

### collectRepeatedShapes(rules, out)
**Pattern:** Post-classification.
**Action:** Finds field content-type sets appearing in >=2 parent rules. Suggests shared supertype or group names.
**Output:** Appends `RepeatedShapeEntry` items to `out`.

### looksLikePolymorphCandidate(choice) / choiceNeedsVariantWrapping(choice)
**Pattern:** A choice rule during polymorph suggestion.
**Action:** `looksLike...` checks >=2 distinguishable branches with heterogeneous signatures. `choiceNeeds...` checks whether any arm is anonymous (needs variant for render dispatch).
**Output:** `boolean`.

---

## Phase 3: Optimize (`compiler/optimize.ts`)

Restructures seq/choice/optional/repeat for simplification. Non-lossy.
Does NOT change named content. Does NOT classify polymorphs.

### optimize(linked)
**Pattern:** Called with a `LinkedGrammar`.
**Action:** Runs normalization passes (collapse -> fan-out -> factor -> dedupe -> inline -> re-collapse), then computes simplified rules.
**Output:** `OptimizedGrammar` with `rules` and `simplifiedRules`.

### fanOutSeqChoices(rule)
**Pattern:** `seq(a, choice(b, c), d)` with exactly one inner choice.
**Action:** Distributes: `choice(seq(a, b, d), seq(a, c, d))`. Preserves variant labels.
**Output:** Rewritten `choice` of `seq`s, or original unchanged.

### factorChoiceBranches(rule)
**Pattern:** `choice` of seqs (or atoms) sharing common prefix/suffix.
**Action:** Extracts common prefix/suffix via structural equality. Wraps remainder in `optional` when some branches are empty.
**Output:** `seq(prefix, choice/optional(remainder), suffix)`.

### dedupeSeqMembers(rule)
**Pattern:** `seq` with adjacent structurally-equal members.
**Action:** Collapses adjacent duplicates using `rulesEqual`.
**Output:** `seq` with deduped members.

### inlineSingleUseHidden(rules)
**Pattern:** Hidden (`_`-prefixed) rules referenced from exactly one parent.
**Action:** Replaces the parent's symbol ref with the hidden rule's body; deletes the hidden entry. Fixed-point (up to 4 passes). Skips structurally meaningful rules (supertype, polymorph, enum, terminal, group).
**Output:** New rules map with inlined entries removed.

### collapseWrappers(rule)
**Pattern:** Any rule tree.
**Action:** Bottom-up collapse of degenerate wrappers: `optional(optional)`, `optional(repeat)`, `repeat(repeat)`, `repeat(optional)`, single-member seq/choice.
**Output:** Simplified rule tree.

### rulesEqual(a, b)
**Pattern:** Two rules to compare.
**Action:** Recursive structural equality check across all rule types. Includes `aliasedFrom` for symbols.
**Output:** `boolean`.

### needsSpace(prev, next)
**Pattern:** Two rendered text fragments.
**Action:** Returns true when both boundary characters are word chars.
**Output:** `boolean`.

---

## Phase 3.5: Simplify (`compiler/simplify.ts`)

Derivation-only view of a rule tree. Strips anonymous delimiters,
collapses single-member wrappers, normalizes idempotent nestings.
Template emission reads the raw rule; simplify feeds field/child
derivation.

> **(PR0 / PR2 — planned)** Simplify gains responsibility for normalizing every
> branch/group body toward the **universal seq-of-leaves canonical shape**:
>
> - Push leaf-content modifier wrappers into attributes on the leaf (idempotent
>   with enrich; absorbs any wrapper that escaped enrich-time attribute lifting).
> - Trigger group synthesis for any structural-content modifier wrapper
>   (any `optional` / `repeat` / `repeat1` whose content is a multi-member
>   `seq` or `choice` with slot content) that wasn't already decomposed in
>   enrich.
> - Flatten degenerate single-member seqs.
> - **Verify post-condition**: every branch and group body is a `SeqRule` of
>   leaves. Any nested structural rule (`optional`, `repeat`, `repeat1`, `seq`,
>   `choice`) inside a branch/group body is a bug — fail loud.
>
> Whether auto-synthesis itself runs in wire, enrich, or both (Options A/B/C in
> the spec), simplify is the canonical-shape verifier regardless.

### simplifyRules(rules, wordMatcher?)
**Pattern:** Full rule map from Optimize.
**Action:** Runs `normalizeToFixpoint` on each rule (inlineGroupRefs + simplifyRule fixpoint).
**Output:** New `Record<string, Rule>` with simplified views.

### simplifyRule(rule, wordMatcher?, inField?)
**Pattern:** Any rule tree node.
**Action:** Strips non-keyword string members from seqs; folds empty-match choice members to optional; collapses single-member wrappers; flattens nested seqs; hoists fields out of optional/repeat wrappers; drops outer field wrappers when inner fields are exposed.
**Output:** Simplified rule for derivation.

### normalizeToFixpoint(rule, wordMatcher, rules)
**Pattern:** A single rule to normalize.
**Action:** Loop (max 16 iterations) of `inlineGroupRefs` + `simplifyRule` until structural convergence.
**Output:** Converged simplified rule.

### hoistFieldOutOfSingleContentWrapper(rule)
**Pattern:** `repeat(field('n', X))` / `optional(field('n', X))`.
**Action:** Rewrites to `field('n', repeat(X))` / `field('n', optional(X))`.
**Output:** Rule with field hoisted to outer position.

### hoistInnerFieldOutOfFieldWrapper(rule)
**Pattern:** `field('outer', wrapper(... field('inner', X) ...))`.
**Action:** Drops the outer field when its content has an inner field at exposable depth and no named-symbol siblings of that inner field.
**Output:** Inner content with outer field stripped, or original unchanged.

### hoistSharedFieldAcrossChoiceBranches(rule)
**Pattern:** Choice where every branch contains the same field name exactly once.
**Action:** Lifts the shared field out, unions its contents, keeps branch residuals as optional choice.
**Output:** `seq(field(A, choice(X1, X2)), optional(residuals))`.

### mergeChoiceBranches(rule)
**Pattern:** Choice of same-length seqs with position-by-position structural equivalence.
**Action:** Merges into a flat seq with per-position unioned field contents.
**Output:** `seq(field('op', choice('&&','||','+')), ...)`.

### inlineGroupRefs(rule, rules, visited?)
**Pattern:** Hidden symbol references to GROUP or MULTI helper rules.
**Action:** Substitutes the symbol ref with the group's content (or the whole multi rule). Prevents cycles via visited set.
**Output:** Rule with group/multi refs expanded inline.

### extractRepeatShape(rule)
**Pattern:** Rule that unwraps to `repeat` / `repeat1`.
**Action:** Peels optional/variant/clause/group/token wrappers.
**Output:** `{ repeat, nonEmpty }` or `null`.

### hoistInnerFieldsForTemplate(rule)
**Pattern:** Any rule tree (template-side path).
**Action:** Applies `hoistInnerFieldOutOfFieldWrapper` throughout the tree without stripping anonymous delimiters (templates need them).
**Output:** Rule with inner fields hoisted but literals preserved.

---

## Phase 4: Assemble (`compiler/assemble.ts`)

First time nodes appear. All metadata derived from the rule tree.
Produces the `NodeMap` consumed by emitters.

> **(PR0 — planned)** `NodeMap` gains two back-pointer maps populated at
> assembly time:
>
> ```ts
> interface NodeMap {
>   // ... existing fields ...
>   readonly nodeByRuleId: ReadonlyMap<RuleId, AssembledNode>;
>   readonly slotByRuleId: ReadonlyMap<RuleId, AssembledNonterminal>;
> }
> ```
>
> When an `AssembledNode` is constructed from a kind's root rule, the root
> rule's `id` registers in `nodeByRuleId`. When an `AssembledNonterminal` is
> constructed from a slot's source rule (via `deriveSlots`), the source rule's
> `id` registers in `slotByRuleId`.
>
> These are the runtime lookup mechanism for the PR1 template emitter (and any
> future consumer that walks a rule tree and needs to ask "what
> `AssembledNonterminal` does this rule position correspond to") without
> falling back to owner traversal or re-derivation. See memory entry
> `feedback_ruleid_backpointer`. Enrichment passes must preserve `Rule.id`
> through any rule rewrite or the maps go stale.

### assemble(optimized)
**Pattern:** Called with an `OptimizedGrammar`.
**Action:** Classifies each rule into a model type, constructs `AssembledNode` instances, collects anonymous tokens/keywords, resolves colliding names, assigns ir keys, marks parameterless/user-facing kinds.
**Output:** `NodeMap` with `nodes`, `signatures`, `derivations`, `rules`.

### classifyNode(kind, rule, opts?)
**Pattern:** Each rule in the optimized grammar.
**Action:** Dispatches on `rule.type` for pre-classified rules (enum, supertype, group, terminal, polymorph, pattern, string). Falls back to `hasAnyField`/`hasAnyChild` for branch detection; `isAllTextShape` for terminal fallback.
**Output:** `ModelType` string.

### hydrateSlotRefs(nodeMap)
**Pattern:** Called after assembly and serialization.
**Action:** Replaces every `UnresolvedRef` in slot values with the concrete `AssembledNode`. Logs unresolvable refs; retries hidden-source lookup via `_<name>` convention.
**Output:** Mutates slot values in place; node graph becomes cyclic.

### markParameterlessKinds(nodes)
**Pattern:** Post-assembly fixpoint.
**Action:** Phase 1 marks keywords/tokens (self-initialize). Phase 2 iterates compounds: a kind is parameterless when every required slot auto-stamps (single literal or single parameterless-kind ref). Sets `isParameterless` and `stampExpression`.
**Output:** Mutates nodes with parameterless flags and stamp expressions.

### resolveCollidingNames(nodes)
**Pattern:** Post-assembly.
**Action:** Groups nodes by `typeName`; renames hidden kinds that collide with visible siblings; disambiguates with numeric suffixes.
**Output:** Mutates `typeName` and `factoryName` on colliding nodes.

### resolveIrKeys(nodes)
**Pattern:** Post-assembly.
**Action:** Two-phase ir-namespace assignment. Pre-claims supertype keys. Phase 1: nodes whose short form equals their factoryName. Phase 2: suffix-stripped abbreviations. Falls back to full factoryName on collision.
**Output:** Mutates `irKey` on each node.

### collectAnonymousNodes(rules, nodes, wordMatcher)
**Pattern:** Post-assembly.
**Action:** Walks all rules for string literals. Creates `AssembledKeyword` (word-shaped) or `AssembledToken` (punctuation) entries for each.
**Output:** Adds anonymous token/keyword entries to `nodes`.

### nameNode(kind) (from node-map.ts)
**Pattern:** Any kind string.
**Action:** Converts snake_case to PascalCase `typeName` and camelCase `factoryName`. Handles `_`-prefix, reserved words, operator tokens.
**Output:** `{ typeName, factoryName, irKey }`.

### nameField(fieldName)
**Pattern:** Any field name string.
**Action:** Converts snake_case to camelCase `propertyName`; suffixes reserved words with `_` for `paramName`.
**Output:** `{ propertyName, paramName }`.

---

## Slot Derivation (`compiler/node-map.ts`)

Classes and derivation helpers for the assembled node hierarchy.

### AssembledBranch
**Pattern:** Rule classified as `'branch'`.
**Action:** Lazy-computes `fields`, `children`, `slots` from the simplified rule. **(legacy — to be removed in PR2)** Builds `renderTemplate` from the raw (inlined+hoisted) rule.
**Output:** Node with field/child/slot metadata. **(legacy — to be removed in PR2)** plus render template body.

> **(PR2 — planned)** The `renderTemplate` method on every `AssembledXxx`
> class is deleted. Template string generation moves to `emitters/templates.ts`
> per the universal emitter pattern (see "Phase 5: Emit"). `AssembledXxx`
> classes expose data only; emitters own all string generation locally.

### AssembledPolymorph
**Pattern:** Rule classified as `'polymorph'`.
**Action:** Stores pre-built `AssembledGroup` forms. Each form has its own fields/children/slots. **(legacy — to be removed in PR2)** Plus a `renderTemplate` method that dispatches on `$variant`.
**Output:** Node with `forms` array and variant-child kind list.

### AssembledPattern / AssembledKeyword / AssembledToken / AssembledEnum / AssembledSupertype / AssembledGroup / AssembledMulti
**Pattern:** Rules classified as their respective model types.
**Action:** Each stores its rule and precomputes model-type-specific metadata. **(legacy — to be removed in PR2)** Branch/Group/Polymorph/Multi also expose `renderTemplate`.
**Output:** Specialized node instances.

### deriveSlots(rule)
**Pattern:** Canonical simplified rule.
**Action:** Single-walk derivation producing every slot (fields + children) in declared order. Delegates to `_deriveFieldsInternal`.
**Output:** `readonly AssembledNonterminal[]`.

### deriveFieldsRaw(rule, outerMultiplicity)
**Pattern:** Any rule tree node during field derivation.
**Action:** Recursive walk collecting `field()` nodes. Handles synthetic wrappers, alias sources, multiplicity threading through optional/repeat/choice. Promotes positional symbols/supertypes to child-like slots.
**Output:** `AssembledNonterminal[]`.

### hasAnyField(rule) / hasAnyChild(rule)
**Pattern:** Any rule tree.
**Action:** Cheap existence predicates that short-circuit on first find.
**Output:** `boolean`.

### isRequired(slot) / isMultiple(slot) / isNonEmpty(slot)
**Pattern:** An assembled slot's values array.
**Action:** Derived from per-value `multiplicity` flags. No stored booleans.
**Output:** `boolean`.

### snakeToCamel(name)
**Pattern:** Any snake_case string.
**Action:** Canonical `foo_bar` -> `fooBar` transformation.
**Output:** camelCase string.

### isSyntheticFieldWrapper(content)
**Pattern:** A field's content rule.
**Action:** Detects autogen outer-field wrappers (multi-member seq containing inner fields).
**Output:** `boolean`.

---

## Phase 5: Emit (`emitters/*.ts`)

Emitters consume the `NodeMap` and produce generated artifacts (factories,
wrap, from, types, render templates, transport, node-model, suggested
overrides, etc.). The **canonical emitter pattern** is established by
`emitters/factories.ts`: iterate `nodeMap.nodes`, dispatch on
`node.modelType`, own all string generation locally. Compiler-side
`AssembledXxx` classes expose data only — no `.renderXxx()` methods that
return output strings. See memory entry `feedback_emitter_pattern_consistency`.

### emitters/templates.ts **(PR1 — planned; PR2 deletes the legacy walker)**

**Pattern:** Invoked once per regen with the assembled `NodeMap`.
**Action:** Iterates `nodeMap.nodes`; dispatches on `node.modelType`
(`'branch' | 'polymorph' | 'group' | 'multi'` emit a body; `'supertype' |
'pattern' | 'keyword' | 'token' | 'enum'` are skipped). Each per-modelType
emit function calls a shared `emitRule(rule, ctx)` that switches on
`Rule.type` and reads the PR0 modifier attributes (`fieldName`,
`multiplicity`, `separator`, `nonterminal`) directly from the leaf rule. Slot
property names are resolved via `ctx.nodeMap.slotByRuleId.get(rule.id)` →
`AssembledNonterminal.propertyName` (no re-derivation from `rule.name` plus
owner traversal).
**Output:** `EmittedTemplates` — a per-kind map of Jinja template bodies.

The `EmitCtx` carries cross-cutting read-only context: hidden-symbol
resolution (`rules` map), word-matcher regex, externals list, and the
NodeMap (for `slotByRuleId` lookups). No metadata accumulators are needed
because every rule already carries its modifier attributes.

**PR1 in-process diff gate:** during PR1's lifetime the emitter runs both
the legacy walker (via `node.renderTemplate()`) and the new per-modelType
emit functions; output divergence on any kind fails regen with the kind +
diff. PR2 deletes the gate together with the legacy paths.

### Legacy template path **(legacy — to be removed in PR2)**

The pre-refactor template path is **not** an emitter in the canonical sense
and deletes wholesale in PR2:

- `compiler/template-walker.ts` (~1758 lines) — Rule-tree walker that
  re-derives structural information (cardinality, optionality, separator,
  clause-vs-plain) at emit time that assembly already learned. Emits an
  intermediate format (`$NAME`, `$$$NAME`, `$NAME_CLAUSE`, plus a `clauses`
  dict and `joinByField` metadata).
- `compiler/node-map.ts` translation pipeline — second pass over the
  walker's intermediate format:
  - `inlineJinjaClauses` (~120 lines) — inlines clause snippets.
  - `translateToJinja` (~200 lines) — produces the final Jinja text.
  - `escapeJinjaBraceCollisions` (~40 lines) — escapes brace collisions.
  - `JinjaTranslateMeta` interface and the 3 assembly call sites that
    thread it.
  - Spacing absorbers — adjacency fix-ups that won't be needed because the
    new emitter outputs literals exactly as captured on rules.
- `AssembledBranch.renderTemplate` (~50 lines), `AssembledPolymorph.renderTemplate`
  (~80), `AssembledGroup.renderTemplate` (~50), `AssembledMulti.renderTemplate`
  (~20) — the compiler-side string generators that violate the canonical
  emitter pattern.
- `ClauseRule` interface, `isClause` guard, `detectClause` (see Link). The
  27 `'clause'` case sites collapse into the existing `'optional'` cases.

PR2's regression gate requires byte-identical output vs the legacy path
(via the PR1 in-process diff gate that has already burned in). Edge case
absorption (walker hotspot fixes without tests, choice-branch literal drop,
scanner-delimited adjacency) lands as explicit test cases in
`__tests__/templates-emitter.test.ts` during PR2.

### Other emitters (unchanged pattern)

`emitters/factories.ts`, `emitters/wrap.ts`, `emitters/from.ts`,
`emitters/types.ts`, `emitters/render-module.ts`, `emitters/transport-common.ts`
already iterate `nodeMap.nodes`, dispatch on `node.modelType`, and own all
string generation locally. They consume the `AssembledNode` view and don't
walk raw rules.

**(PR3 — planned)** The two emitters that DO consume `Rule.type` migrate
when wrapper rule types delete:

- `emitters/node-model.ts` — serializes rules to `node-model.json5`.
  Serialized shape changes (no `optional`/`field`/`repeat`/`repeat1`
  wrappers); schema version bumps; a migration step in
  `packages/codegen/src/cli.ts` reads the old format and writes the new on
  first regen.
- `emitters/suggested.ts` — re-prints rule trees as TypeScript override
  syntax. Adds a re-wrap pass that reconstructs canonical wrapped form from
  attribute form when emitting (`field('name', optional(repeat($.X)))` etc.).

`compiler/grammar.ts` (tree-sitter grammar.js emit) follows the same
re-wrap pattern as `suggested.ts`.
