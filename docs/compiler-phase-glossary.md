# Compiler Phase Glossary

Per-function reference for every significant function in the sittir codegen
compiler pipeline. Each entry covers pattern (when it fires), action (what it
does), and output (what changes).

> **Updated 2026-05-22 — reconciled to the PR2 merge (`bbadd99b` on master).**
> The 4-PR [rule-attribute / template-emitter refactor](./superpowers/specs/2026-05-18-rule-attributes-and-template-emitter-design.md)
> has shipped PR0 + PR1 + PR2. This glossary now documents the code as it
> stands; the prior "planned" annotations have been reconciled to shipped
> reality. **PR3 is still ahead** (legacy walker / `ClauseRule` / wrapper
> rule-type deletion) and is flagged inline where it matters.
>
> **Pipeline order (as built today):**
>
> ```
> enrich (author wraps grammar(enrich(base), …))   ← module-load, pre-tree-sitter
>   → evaluate (compiler/evaluate.ts: runs DSL, wire(), auto-groups)
>     → link (compiler/link.ts)
>       → optimize (compiler/optimize.ts: + applyWrapperDeletion + computeSimplifiedRules)
>         → assemble (compiler/assemble.ts + node-map.ts + collect-slots.ts)
>           → emit (emitters/*.ts)
> ```
>
> **Three Rule shapes flow through `optimize()` and are attached per node in
> `assemble()`** (see [Rule data model](#rule-ir-compilerrulets)):
>
> | Snapshot | Produced by | Attached as | Consumed by |
> |---|---|---|---|
> | **RawRule** | `applyNormalizationPasses` (post-link) | `node.rule` | legacy walker (`renderTemplate`, until PR3) |
> | **RenderRule** | `applyWrapperDeletion` | `node.renderRule` | the authoritative `TemplateEmitter` |
> | **SimplifiedRule** | `computeSimplifiedRules` | `node.simplifiedRule` | slot derivation (`collectSlots`), factories/wrap/from |
>
> **What's shipped (PR0 + PR1 + PR2):**
> - **RuleBase attributes** (PR0): `fieldName` / `multiplicity` / `nonterminal` / `separator` / `aliasedFrom` / `aliasNamed` on every Rule via the shared `RuleBase` interface (`compiler/rule.ts`).
> - **enrich attribute passes** (PR0): `enrichFieldWrappers` + `enrichMultiplicityWrappers` ship in `dsl/enrich.ts`. The originally-planned `decomposeOptional` / `decomposeRepeat` did **NOT** land in enrich — group SYNTHESIS moved to `dsl/wire/auto-groups.ts` (`applyAutoGroups`), and wrapper-attribute push-down lives in `applyWrapperDeletion`.
> - **`applyWrapperDeletion`** (PR1, `compiler/wrapper-deletion.ts`): new last pass of `optimize()`; pushes modifier wrappers (optional / field / repeat / repeat1 / alias) down to leaf `RuleBase` attributes. Output: `RenderRule` (wrapper-free) snapshot.
> - **RenderRule + SimplifiedRule branded types** (PR1/PR2, `compiler/rule.ts`).
> - **`computeSimplifiedRules`** (relocated PR1 to `compiler/simplify.ts`): takes RenderRule, runs `inlineRefs` + `simplifyRules` + `canonicalizeSeqOfLeaves` + `deleteWrapper` (post-fixpoint wrapper-free guard) + `fuseHeadRepeatLists`. Output: `Record<string, SimplifiedRule>`.
> - **Alias-body + polymorph-form snapshots** (PR2): `optimize()` threads top-level alias-bodies and polymorph-form contents through `applyWrapperDeletion` + `computeSimplifiedRules` and merges them into `renderRules` / `simplifiedRules`. `assemble.ts` reads snapshots directly; per-call `simplifyRule(...)` / `deleteWrapper(...)` fallbacks deleted.
> - **`applyAutoGroups` re-enabled** (PR2): `dsl/wire/wire.ts` invokes it; synthesized helpers (`_<parent>_optional<N>` / `_<parent>_repeat<N>`) are registered in `grammar.inline` via `WireContext.syntheticInline`.
> - **`inlineRefs`** (PR2, renamed from `inlineGroupRefs`): inlines (a) hidden GROUP / MULTI refs and (b) any ref whose target is in `grammar.inline`. Matches tree-sitter's parse-time inlining.
> - **`collectSlots`** (PR2/post-PR2, NEW file `compiler/collect-slots.ts`): the `deriveSlotsRaw` fold/merge/`effectiveMultiplicity` walker is **deleted**. `_deriveSlotsInternal` now delegates to `collectSlots` ("a slot IS a `nonterminal`-flagged node"). `deriveSlots` keeps its signature.
> - **New `TemplateEmitter`** (PR2, `emitters/templates.ts`): authoritative, modelType-dispatching, consumes `node.renderRule`. `runTemplateEmitter()` is the entry point. Slot-preservation gate (`SITTIR_SLOT_PRESERVATION`) replaced the byte-equivalence diff gate.
>
> **What's still ahead (PR3):**
> - Delete `compiler/template-walker.ts` (~66 KB) + the `node-map.ts` translation pipeline + `AssembledXxx.renderTemplate()` methods. **These all still exist** and are still referenced from `render-module.ts:2324`, the legacy `emitBodyForNode` (`templates.ts:1615`), and `node-map.ts:2343/2364`.
> - Delete `ClauseRule` + `detectClause` + sweep `'clause'` case sites. **Still present.**
> - Delete wrapper rule types (`OptionalRule` / `FieldRule` / `RepeatRule` / `Repeat1Rule`). **Still present** (wrapper-deletion still needs them as input).
> - Delete the RawRule snapshot from `optimize()`.
> - Replace `deriveSlotsRaw`'s recursive contract entirely (already done — `collectSlots` is the replacement; the `clause` branch in `collectSlots` is the remaining ClauseRule dependency).
> - Wire `assertUniversalShapeRule` as a production fail-fast gate (currently `SITTIR_ASSERT_UNIVERSAL_SHAPE=1`-gated).
> - Migrate render-module per-slot separator stamping to all kinds; drop the node-wide `meta.separators` fallback.

---

## Rule IR (`compiler/rule.ts`)

One discriminated union (`Rule`) throughout the pipeline. Presence varies by
phase: after Evaluate `symbol`/`alias`/`token`/`repeat1` are present; after
Link `alias`/`token` are gone and `clause`/`group`/`indent`/`dedent`/`newline`
are added; after Optimize `variant`/`polymorph` are present. `repeat1` is
preserved end-to-end so downstream slot derivation can stamp the `nonEmpty`
flag.

### `RuleBase` (shipped attribute set)

Every Rule variant extends `RuleBase`. Beyond the identity tag `id`, it carries
modifier attributes pushed down from wrappers. Vocabulary deliberately mirrors
`NodeOrTerminal` (node-map.ts) so values flow rule→slot under identical names
(`feedback_rule_slot_vocabulary_alignment`):

```ts
interface RuleBase {
  readonly id?: RuleId;
  readonly fieldName?: string;
  readonly multiplicity?: Multiplicity;   // 'optional' | 'single' | 'array' | 'nonEmptyArray'
  readonly nonterminal?: boolean;          // explicit slottiness; promotes terminals to slots
  readonly aliasedFrom?: string;           // alias target, pushed down from alias() by wrapper-deletion
  readonly aliasNamed?: boolean;
  readonly separator?:
    | string
    | readonly Rule[]
    | { readonly rules: readonly Rule[]; readonly trailing?: boolean; readonly leading?: boolean };
}
```

- `Multiplicity = 'optional' | 'single' | 'array' | 'nonEmptyArray'` lives in
  `rule.ts` (moved from `node-map.ts` so layering isn't inverted). `'single'`
  is the canonical required-one value; a missing multiplicity defaults to it.
- `RuleIdentity` is a deprecated alias of `RuleBase`.
- **Wrapper rule types** (`OptionalRule` / `FieldRule` / `RepeatRule` /
  `Repeat1Rule`) and `ClauseRule` still exist. They are `applyWrapperDeletion`'s
  *input*; PR3 deletes them once nothing consumes the wrapped shape.

### `RenderRule` / `SimplifiedRule` (branded types)

- `RenderRule = Exclude<Rule, OptionalRule | FieldRule | RepeatRule | Repeat1Rule> & { __renderRule?: never }`.
  Modifier wrappers pushed down to leaf attributes; structural rules
  (`seq` / `choice` / `variant` / `group` / `polymorph`) preserved.
- `SimplifiedRule = RenderRule & { __simplifiedRule?: never }`. Additionally
  satisfies the universal seq-of-leaves invariant (enforced only under
  `SITTIR_ASSERT_UNIVERSAL_SHAPE=1` today).

### Helpers in `rule.ts`

- `normalizeEnumMembers(members, source?)` — single literal collapses to its
  `StringRule`; multi-member stays `EnumRule`.
- Per-variant type guards (`isSeq`, `isChoice`, `isField`, …) — prefer over
  inline `r.type === …` in `.filter`/`.find`; stay with literal case arms inside
  a `switch` for exhaustiveness.
- `literalTextOf(r)` — string value or a link-symbol's `literal`.
- `collectFieldNames(rule)` — cheap one-pass field-name set, no AssembledField allocation.
- `replaceAtPath(rule, path, replacement)` — pure path-addressed rewrite for
  `polymorphs:` / `transforms:` / `groups:` overrides.

---

## Phase 0: Enrich (`dsl/enrich.ts`)

Pre-evaluation mechanical grammar enrichment. The grammar author wraps the base
as `grammar(enrich(base), { rules: { … } })`, so enrich runs at module-load
**before tree-sitter consumes the grammar** — its synthesized `_kw_*` helpers
reach the parser. (Enrich's attribute passes operate on the codegen-internal
Rule view; per `feedback_enrich_post_evaluation_only` they shape the TS surface,
not the parse table.)

### `enrich(base)`
**Pattern:** Called with a `GrammarResult` before `grammar()`.
**Action:** Applies all enrichment passes to every rule; injects synthesized `_kw_*` hidden rules into the rules map.
**Output:** New `GrammarResult` with enriched rules + merged `_kw_*` entries.

### `applyEnrichPasses(ruleName, rule, kwRules, supertypeNames)`
**Pattern:** Each rule in the grammar.
**Action:** Fixed-point loop (max 8 iterations) applying, until convergence: `applySymbolToField` → `applyOptionalKeyword` → `enrichFieldWrappers` → `enrichMultiplicityWrappers`.
**Output:** Enriched rule with field wrappers, `_kw_*` registrations, and pushed-down attributes.

### `extractSupertypeNames(base, hasWrapper)` / `harvestSupertypeNames(result)`
**Pattern:** Grammar has a `supertypes:` callback.
**Action:** Invokes the callback with a proxy `$` to extract supertype kind names.
**Output:** `ReadonlySet<string>` of supertype names (leading `_`).

### `applySymbolToField(ruleName, rule, supertypeNames)`
**Pattern:** Non-hidden rule with a top-level seq containing bare symbols.
**Action:** Wraps unique bare symbols as `field(name, symbol)`. Handles bare, `optional(symbol)`, and `optional(seq(symbol, anon…))`. Skips hidden rules, duplicate symbols, claimed names, symbols inside repeats, and supertype-only-bare targets.
**Output:** Rule with FIELD wrappers carrying `source: 'enriched'`.

### `detectSymbolTarget(member)` / `isBareShapeTarget(member, target)`
**Pattern:** A seq member that is a bare symbol, `optional(symbol)`, or `optional(seq(symbol, anon…))`.
**Action:** Returns a `SymbolTarget` (symbol name + `wrap()` rebuilder).
**Output:** `SymbolTarget | null`.

### `countSymbolsInRepeat(node, kindCounts, inRepeat)`
**Pattern:** Any rule position.
**Action:** Counts symbol refs inside `repeat`/`repeat1` wrappers; stops at field/alias boundaries.
**Output:** Mutates `kindCounts`.

### `promoteInsideRepeatMembers(...)` / `tryPromoteInRepeatMember(...)` / `tryPromoteInRepeatSeq(...)`
**Pattern:** Outer seq members that are `repeat(seq(...))` / `repeat1(seq(...))`, or a top-level `repeat(seq(...))`.
**Action:** Field-promotes bare symbols inside the inner seq (after peeling prec wrappers).
**Output:** Rebuilt rule with field wrappers, or original unchanged.

### `applyOptionalKeyword(ruleName, rule, kwRules)` / `walkOptionalKeyword(...)` / `tryPromoteInnerKeyword(...)` / `registerKwRule(...)`
**Pattern:** Rule containing `optional(identifier-literal)` at any position.
**Action:** Wraps the inner literal as `field(<kw>_marker, symbol(_kw_<kw>))` and registers a hidden `_kw_*` rule.
**Output:** Rule with keyword promotions; new `_kw_*` entries.

### `enrichFieldWrappers(rule)` **(SHIPPED — PR0)**
**Pattern:** Every `FieldRule` (recursed throughout the tree via `recurseChildren`).
**Action:** Propagates `fieldName` (and slottiness) onto the wrapped content. The wrapper stays in place until PR3.
**Output:** Field rule whose inner content carries the field-binding attribute directly.

### `enrichMultiplicityWrappers(rule)` **(SHIPPED — PR0)**
**Pattern:** Every `OptionalRule` / `RepeatRule` / `Repeat1Rule`.
**Action:** Propagates `'optional'` / `'array'` / `'nonEmptyArray'` (and `nonterminal: true`) onto the wrapped content. Wrapper stays until PR3.
**Output:** Wrapper rule whose inner content carries the multiplicity attribute directly.

> **Reconciliation:** the spec's planned `decomposeOptional` / `decomposeRepeat`
> enrich passes were NOT implemented. Group synthesis for structural
> optional/repeat content moved to `dsl/wire/auto-groups.ts` (it must reach
> tree-sitter), and separator-lift / attribute push-down live in
> `applyWrapperDeletion`. Enrich only ships the two attribute passes above.

---

## Phase 1: Evaluate (`compiler/evaluate.ts` + `dsl/wire/*` + `dsl/runtime-shapes.ts`)

Executes the grammar.js DSL and produces a `RawGrammar`. Mirrors tree-sitter's
`grammar()` with sittir extensions.

> **Two-compiler-shape divergence (`dsl/runtime-shapes.ts`):** the DSL globals
> run in two runtimes. Sittir's evaluator keeps `optional` as a lowercase
> `{type:'optional'}` wrapper; tree-sitter's CLI lowers `optional(x)` to
> `CHOICE[x, BLANK]` (uppercase). `runtime-shapes.ts` exposes dual-case
> predicates (`isChoiceType`, `isBlankType`, `isSeqType`, `isOptionalType`,
> `isPrecWrapper`, `typeEq`) so wire-side passes recognize both forms — see
> `auto-groups.ts`'s `CHOICE[seq, BLANK]` → optional handling and `wire.ts`'s
> `unwrapOptionalChoiceRt`.

### `evaluate(entryPath)`
**Pattern:** CLI invocation with a grammar.js or overrides.ts path.
**Action:** Injects DSL globals, imports the module, extracts the grammar, runs post-evaluation passes (synthetic-alias-source synthesis, field-enum synthesis, pattern replacement).
**Output:** `Promise<RawGrammar>`.

### `seq` / `choice` / `optional` / `repeat` / `repeat1` / `field` (DSL primitives)
**Pattern:** DSL constructor calls.
**Action:** Normalize members; collapse degenerate nestings; `choice(x, blank())` → `optional(x)`; compact all-string choices to `EnumRule`; factor all-field choices; lift `commaSep1`-shaped seqs to `repeat1` + separator; propagate field names to nested refs.
**Output:** Canonical Rule objects.

### `createProxy(currentRule, refs)` / `isHiddenKind(name, inlineList?)`
**Pattern:** Each rule evaluation needs a `$` proxy; any hidden-kind check.
**Action:** Proxy records symbol refs; `isHiddenKind` is true for `_`-prefixed names or names in the `inline` list.
**Output:** ref-recording proxy / `boolean`.

### `synthesizeInlineAliasSources(...)` / `synthesizeFieldEnumRules(...)` / `collapseAllFieldChoiceMembers(...)` / `liftCommaSep(...)`
**Pattern:** Post rule-evaluation.
**Action:** Synthesize `_<target>` hidden rules for non-bare `alias(...)` sources; synthesize named hidden enum rules from `field(name, choice('a','b'))`; factor / retype all-field choices to `field(choice(...))` or `variant`s; lift comma-separated seqs to `repeat1` with separator.
**Output:** Mutated rules map; rewritten contents.

### `grammarFn(optionsOrBase, options?)`
**Pattern:** Top-level `grammar()` call.
**Action:** Evaluates all rule fns + metadata callbacks, injects synthetics, builds the rule catalog. R2 (#14 sweep): constructs the single **`EvaluateCtx`** (`rules` / `provenanceByKind` / `refs` / `opts` / `baseRules` / `baseGrammar` / `externals` / `isExtension` / `sinks` / `setWord`) that every evaluate-phase pass takes as its second parameter — `synthesizeInlineAliasSources(rules, ctx)`, `synthesizeFieldEnumRules(rules, ctx)`, `evaluateRulesAndInjectSynthetics(rules, ctx)`, `evaluateMetadataCallbacks(opts, ctx)`, `drainRenderAsMetadata(opts, ctx)`, etc. Pass-LOCAL derived state stays in explicit params per CW6 (`externalSet` in the inline-alias rewrite; `FieldEnumSweepState` in the enum sweep; `PatternCandidate[]` in pattern replacement). The DSL primitives (`field`, `alias`, `createProxy`, `walkRefs`, `grammarFn` itself) keep their tree-sitter-dictated signatures.
**Output:** `{ grammar: RawGrammar }`.

### `wire(config, base?)` (`dsl/wire/wire.ts`)
**Pattern:** Author wraps `grammar(enrich(base), wire({ rules, polymorphs, transforms, groups, renderAs, … }))`.
**Action:** Folds declarative override config into the options object before tree-sitter sees it. Composes/synthesizes polymorph + transform parent fns; injects deferred-content fns for `_<parent>_<suffix>` / `_kw_<field>` / `_<alias>` hidden rules; wraps every rule fn so a per-invocation `WireContext` (and `currentRuleKind`) is active; drains accumulated conflict groups and synthetic-inline names into the `conflicts` / `inline` callbacks; runs `applyWirePatternReplacement` (the tree-sitter-runtime counterpart of evaluate's pattern replacement) for body-pattern `groups:`; then runs `applyAutoGroups`.
**Output:** `WiredOpts` with a non-enumerable `__wireContext__` attached for the compiler pipeline (`evaluate` → `link`) to read polymorph/group metadata.

Key wire internals: `composeOrSynthesize{Polymorph,Transform}Parents`,
`buildPolymorphParentFn`, `injectHiddenRulePlaceholders`,
`makeDeferredContentFn` (deposit → `previous` base rule → `blank()` fallback),
`wrapAllRuleFns`, `buildWiredConflictsFn`, `buildWiredInlineFn`
(`nativeInlineRef` constructs symbols via the runtime's `symbol()`),
`applyWirePatternReplacement` + `replaceInBodyRt` / `patternBodyEqual` /
`isComplexBodyRt`.

### `applyAutoGroups(base, outRules, context, authoredSynthesisKinds)` (`dsl/wire/auto-groups.ts`) **(SHIPPED — re-enabled PR2)**
**Pattern:** A parent rule body containing `optional(seq(...))` / `repeat(seq(...))` / `repeat1(seq(...))` (STRICT seq content only — `field`/`choice`/leaf content passes through). Recognizes both sittir lowercase and tree-sitter `CHOICE[seq, BLANK]` forms.
**Action:** SYNTHESIS ONLY. For each match, synthesizes a hidden helper `_<parent>_optional<N>` / `_<parent>_repeat<N>` (cross-parent dedupe by canonical-stringified body) holding the inner seq, and rewrites the parent body's content to a `group-lift`-sourced SYMBOL ref. **Writes into `outRules`, not the base seed** (tree-sitter calls each `outRules` fn and overwrites the seeded entry). Registers each helper in `context.syntheticInline` so the wired `inline:` callback adds it to `grammar.inline` → tree-sitter inlines it → flat runtime. Skips author-overridden rules and `authoredSynthesisKinds` (kinds opted into `transforms:` / `polymorphs:` / path-mode `groups:`).
**Output:** Mutated `outRules` (synthesized helper fns + rewritten parent fns); populated `syntheticInline`.

> **Explicitly NOT decomposition:** auto-groups never touches
> `separator`/`trailing`/`leading` metadata. Separator-lift and attribute
> stamping are a separate concern handled in `applyWrapperDeletion` /
> simplify, keeping the two passes from re-introducing the
> renderer-reads-separator-on-all-repeats regression.

---

## Phase 2: Link (`compiler/link.ts`)

Resolves what nodes ARE. After Link: no `alias`, no `token` wrapper; all field
nodes carry provenance; polymorphs/variants classified. Shape is otherwise
preserved (no restructuring).

### `link(raw, include?)`
**Pattern:** Called with a `RawGrammar`.
**Action:** Resolves all rules, classifies hidden rules, promotes terminals, infers field names, detects polymorphs, applies override polymorphs + `applyGroupOverrides` (user `groups:`), hoists indent into repeats, annotates block-bearer fields, collects repeated shapes. Auto-synthesized hidden groups from `applyAutoGroups` are already in the rules map and classify through the normal hidden-rule path.
**Output:** `LinkedGrammar` (resolved rules, derivation log, alias map, top-level alias bodies, word, pattern-replacement kinds).

### `resolveRule(rule, currentName, allRules, supertypes, externalRoles)`
**Pattern:** Every rule, recursively.
**Action:** Resolves aliases (named → symbol with `aliasedFrom`; unnamed non-word → string literal), flattens token wrappers, inlines role symbols, detects clauses (`detectClause`).
**Output:** Resolved tree, no aliases or token wrappers.

### `classifyHiddenRule(name, rule, supertypes, references)`
**Pattern:** Hidden (`_`-prefixed) or supertype-declared rules.
**Action:** Promotes all-string choices to `EnumRule`; symbol-compatible choices to `SupertypeRule`; hidden seqs with fields to `GroupRule`.
**Output:** Classified rule or original.

### `promotePolymorph(rule)` / `applyOverridePolymorphs(...)` / `findVariantChoice(rule)` / `wrapVariants(choice)` / `nameVariant(...)` / `tokenToName(token)`
**Pattern:** Top-level / nested variant-bearing choices; `polymorphVariants` from wire.
**Action:** Build `PolymorphRule`s (promoted or override-sourced) with fused prefix/suffix; wrap each choice member in a `variant` with a derived name; map punctuation to readable names.
**Output:** `PolymorphRule` / variant-wrapped choices.

### `detectClause(content, currentName)` **(legacy — PR3 deletes)**
**Pattern:** Content of an `optional` that is `seq(string, field, …)`.
**Action:** Wraps as `ClauseRule` named after the first field.
**Output:** `ClauseRule` or plain `optional`. **Still live** — `ClauseRule` and the `'clause'` case sites (incl. `collectSlots`'s `clause` arm) have not been removed.

### `inferFieldNames(references)` / `hoistIndentIntoRepeat(rules)` / `annotateBlockBearerFields(rules)` / `collectRepeatedShapes(rules, out)`
**Pattern:** Symbol ref graph; indent-bearing seqs; fields reaching `indent`; repeated content-type sets.
**Action:** Infer field names (≥5 named refs, ≥80% agreement); set `separator: '\n'` on the following repeat; mark `blockBearer: true`; suggest shared supertype/group names.
**Output:** Inferred-name map / mutated repeat & field rules / `RepeatedShapeEntry` items.

### `looksLikePolymorphCandidate(choice)` / `choiceNeedsVariantWrapping(choice)`
**Pattern:** A choice during polymorph suggestion.
**Action:** `looksLike…` requires ≥2 distinguishable branches with heterogeneous signatures. `choiceNeeds…` checks whether any arm is anonymous (needs a variant wrapper for render dispatch). A choice qualifies for variant-wrapping when BOTH hold.
**Output:** `boolean`.

---

## Phase 3: Optimize (`compiler/optimize.ts`)

Restructures seq/choice/optional/repeat for simplification (non-lossy on named
content), then produces the RenderRule + SimplifiedRule snapshots.

### `optimize(linked, inlineKinds?)`
**Pattern:** Called with a `LinkedGrammar`.
**Action:**
1. `applyNormalizationPasses(rawRules, …)` — collapse → fan-out → factor → dedupe → inline → re-collapse. Produces the **RawRule** map.
2. `applyWrapperDeletion(rules)` — pushes modifier wrappers to leaf attributes. Produces the **RenderRule** snapshot.
3. `computeSimplifiedRules(renderRules, word, inlineKinds)` — produces the **SimplifiedRule** snapshot.
4. Threads top-level **alias bodies** and **polymorph-form** contents through the same `applyNormalizationPasses` → `applyWrapperDeletion` → `computeSimplifiedRules` pipeline and merges them into `renderRules` / `simplifiedRules` (so `assemble.ts` reads snapshots, never re-simplifies per call).
**Output:** `OptimizedGrammar` with `rules` (RawRule), `renderRules` (RenderRule), `simplifiedRules` (SimplifiedRule).

### Normalization passes
- `fanOutSeqChoices(rule)` — `seq(a, choice(b,c), d)` → `choice(seq(a,b,d), seq(a,c,d))` (single inner choice; preserves variant labels).
- `factorChoiceBranches(rule)` — extracts common prefix/suffix across choice branches; wraps remainder in `optional` when some branches are empty.
- `dedupeSeqMembers(rule)` — collapses adjacent structurally-equal members.
- `inlineSingleUseHidden(rules)` — inlines hidden rules referenced from exactly one parent (fixpoint, ≤4 passes); skips supertype/polymorph/enum/terminal/group.
- `collapseWrappers(rule)` — bottom-up collapse of degenerate wrappers.
- `rulesEqual(a, b)` — recursive structural equality (incl. `aliasedFrom`).
- `needsSpace(prev, next)` — true when both boundary chars are word chars.

### `applyWrapperDeletion(rules)` (`compiler/wrapper-deletion.ts`) **(SHIPPED — PR1)**
**Pattern:** Any rule map. Also exposed as `deleteWrapper(rule)` for a single tree.
**Action:** Pushes `optional` / `field` / `repeat` / `repeat1` / `alias` wrappers DOWN to leaf `RuleBase` attributes (`multiplicity` / `fieldName` / `separator` / `aliasedFrom`), removing the wrapper nodes. Structural rules (`seq` / `choice` / `variant` / `group` / `polymorph`) are preserved. "Outer wins" when stamping. Idempotent on wrapper-free input.
**Output:** `RenderRule`-shaped tree(s).

---

## Phase 3.5: Simplify (`compiler/simplify.ts`)

Computes the SimplifiedRule view consumed by slot derivation. Inlines
parser-inlined helpers, strips anonymous delimiters, canonicalizes toward the
universal seq-of-leaves shape, and re-pushes any wrapper attributes that hoist
transforms re-introduced.

### `computeSimplifiedRules(renderRules, word, inlineKinds?)`
**Pattern:** Called from `optimize()` with the RenderRule map.
**Action:** `simplifyRules` (fixpoint of `inlineRefs` + `simplifyRule`) → per-rule `canonicalizeSeqOfLeaves` → `deleteWrapper` (final wrapper-free guard) → `fuseHeadRepeatLists` (re-fuse head-single + tail-array pairs an inline exposed). Optionally runs `assertUniversalShapeRule` per kind when `SITTIR_ASSERT_UNIVERSAL_SHAPE=1`.
**Output:** `Record<string, SimplifiedRule>`.

### `simplifyRules(rules, wordMatcher?, inlineKinds?)` / `normalizeToFixpoint(rule, wordMatcher, rules, inlineKinds?)`
**Pattern:** Full rule map / single rule.
**Action:** `normalizeToFixpoint` loops `simplifyRule(inlineRefs(current, …))` up to 16 iterations until structural convergence (each transform is non-increasing on tree size).
**Output:** Simplified map / converged rule.

### `simplifyRule(rule, wordMatcher?, inField?)`
**Pattern:** Any rule node.
**Action:** seq → `collapseSeq`; choice → recurse, fold empty-match member to `optional`, collapse single-member, `mergeChoiceBranches`, then `hoistSharedFieldAcrossChoiceBranches`; optional/repeat/repeat1 → recurse + `hoistFieldOutOfSingleContentWrapper`; field → recurse with `inField=true` + `hoistInnerFieldOutOfFieldWrapper`; group/variant/clause → recurse into content.
**Output:** Simplified rule. `withAttrsFrom` carries the discarded node's slot attributes onto the survivor.

### `collapseSeq(rule, wordMatcher?, inField?)`
**Pattern:** A `seq` during simplify.
**Action:** Maps + filters members (strips non-keyword strings and empty-seq sentinels), flattens bare nested seqs (a nested seq that carries its OWN `multiplicity`/`separator`/`fieldName` is kept as one member so its cardinality isn't lost). On collapse to one member, **`multiplicity` COMBINES via `combineMultiplicity`** (rather than the survivor silently keeping its narrower own); `separator`/`fieldName`/`id` ride along absent-only.
**Output:** Collapsed seq / single survivor / empty seq.

### `combineMultiplicity(outer, inner)`
**Pattern:** Combining a pushed-down OUTER multiplicity with a leaf's INNER one.
**Action:** Lattice over `'single'` (the canonical required-one; `undefined` defaults to it): `outer==='single'` → keep inner; either side a collection → `nonEmptyArray` only when BOTH guarantee ≥1 (single or nonEmptyArray), else `array`; neither a collection → `optional` if either is, else `single`. (E.g. `combine('nonEmptyArray', 'optional') → 'array'` for `trait_bounds`.)
**Output:** Effective `LeafMultiplicity`.

### `inlineRefs(rule, rules, inlineKinds?, visited?)` **(renamed from `inlineGroupRefs`, PR2)**
**Pattern:** Symbol refs to inlinable targets.
**Action:** Two paths. (1) **`grammar.inline` path:** ANY symbol whose name is in `inlineKinds` is inlined — regardless of `source` or `hidden` — because tree-sitter inlines exactly those kinds at parse time; group/multi targets inline their CONTENT. (2) **GROUP/MULTI path:** hidden refs to group/multi helpers inline (group → its `content`, multi → the whole wrapper). `source==='group-lift'` refs skip this path (they materialize as their own AssembledGroup). Both paths preserve the referring symbol's pushed-down leaf attributes via `reapplyInlinedLeafAttrs`. Cycle-safe via `visited`.
**Output:** Rule with inline targets expanded.

### `resolveGroupOrMultiInlineTarget(target)`
**Pattern:** A hidden symbol target.
**Action:** Returns the group's `content` (group target) or the whole rule (multi target, via `extractRepeatShape`); `null` for anything else.
**Output:** `Rule | null`.

### `reapplyInlinedLeafAttrs(ref, inlined)` / `pushAttrsToLeaves(rule, multiplicity, separator, fieldName)`
**Pattern:** After substituting a ref with its target body during inlining.
**Action:** Re-applies the referring symbol's `multiplicity`/`separator`/`fieldName` onto the inlined body's LEAVES (not an enclosing seq, which `canonicalizeSeqOfLeaves` would flatten). `pushAttrsToLeaves` descends structural nodes; the **`choice` case stamps the choice NODE itself** (the choice is a single slot boundary that survives flattening) — including `fieldName` (the leaf case did this; the choice case previously forgot, mis-naming inlined `field('body', _suite)` → `block`). Multiplicity combines via the lattice; an existing array/nonEmptyArray is preserved.
**Output:** Body with attributes re-stamped.

### `hoistFieldOutOfSingleContentWrapper(rule)`
**Pattern:** `repeat(field('n', X))` / `optional(field('n', X))`.
**Action:** Rewrites to `field('n', repeat(X))` / `field('n', optional(X))`.
**Output:** Field hoisted outward.

### `hoistInnerFieldOutOfFieldWrapper(rule)` / `hasNamedSiblingOfInnerField` / `isNamedReference` / `hasInnerFieldAtExposableDepth`
**Pattern:** `field('outer', wrapper(… field('inner', X) …))`.
**Action:** Drops the outer field when an inner field sits at exposable depth and no named-symbol sibling would lose its label. Bails on direct field nesting or a named-symbol sibling.
**Output:** Inner content (outer field stripped) or original.

### `hoistSharedFieldAcrossChoiceBranches(rule)` / `mergeChoiceBranches(rule)`
**Pattern:** Choices where a field name appears once per branch / same-length structurally-equivalent seq branches.
**Action:** Lift a shared field out and union its contents (residuals → optional choice); or merge into a flat seq with per-position unioned field contents (`field('op', choice('&&','||','+'))`).
**Output:** `seq(field(A, choice(…)), …)`.

### `canonicalizeSeqOfLeaves(rule)` / `isLeaf(rule)` / `assertUniversalShapeRule(rule, kind)` / `assertUniversalShape(node)`
**Pattern:** A simplified rule body / a post-simplify rule or node.
**Action:** Flattens nested seqs toward a flat seq of leaves; `isLeaf` recognizes pure literals + slot-ref leaves. The assertions fail loud if a branch/group/polymorph/multi body still nests `optional`/`repeat`/`seq`/`choice` where it shouldn't — currently gated behind `SITTIR_ASSERT_UNIVERSAL_SHAPE=1`.
**Output:** Canonicalized rule / throws on violation.

### `extractRepeatShape(rule)`
**Pattern:** A rule that unwraps to `repeat` / `repeat1`.
**Action:** Peels optional/variant/clause/group/token wrappers.
**Output:** `{ repeat, nonEmpty }` or `null`.

### `hoistInnerFieldsForTemplate(rule)` **(legacy template path)**
**Pattern:** Any rule (template-side).
**Action:** Applies `hoistInnerFieldOutOfFieldWrapper` throughout without stripping anonymous delimiters.
**Output:** Inner fields hoisted, literals preserved. Used by the legacy walker; PR3 removes the legacy path.

---

## Phase 4: Assemble (`compiler/assemble.ts`)

First time nodes appear. All metadata derived from the rule snapshots.

### `assemble(optimized)`
**Pattern:** Called with an `OptimizedGrammar`.
**Action:** Classifies each rule into a model type, constructs `AssembledNode` instances (attaching `.rule` / `.renderRule` / `.simplifiedRule`), collects anonymous tokens/keywords, resolves colliding names, assigns ir keys, marks parameterless/user-facing kinds. Slot-ref hydration is deferred to `hydrateSlotRefs`.
**Output:** `NodeMap` with `nodes`, `signatures`, `derivations`, `rules`, `externals`.

### `classifyNode(kind, rule, opts?)`
**Pattern:** Each rule.
**Action:** Dispatches on `rule.type` for pre-classified rules (enum / supertype / group / terminal / polymorph / pattern / string); falls back to `hasAnyField` / `hasAnyChild` for branch detection and `isAllTextShape` for terminal fallback.
**Output:** `ModelType`.

### `hydrateSlotRefs(nodeMap)`
**Pattern:** Called after assembly + serialization.
**Action:** Replaces every `UnresolvedRef` in slot **values** with the concrete `AssembledNode` (retrying hidden-source `_<name>` lookup). **Resolves value refs only — does NOT touch slot metadata** (`storageName` / `propertyName` / multiplicity are already final from `collectSlots`). Logs unresolvable refs.
**Output:** Mutates slot value refs in place; node graph becomes cyclic.

### `markUserFacing(nodes)` / `markParameterlessKinds(nodes)` / `resolveCollidingNames(nodes)` / `resolveIrKeys(nodes)` / `collectAnonymousNodes(...)`
**Pattern:** Post-assembly fixpoints/passes.
**Action:** `markUserFacing` flags hidden kinds that surface as alias sources in some rule's slots (so they get their own template); `markParameterlessKinds` two-phase-marks keywords/tokens then compounds whose required slots all auto-stamp; `resolveCollidingNames` disambiguates colliding typeNames; `resolveIrKeys` assigns the ir namespace; `collectAnonymousNodes` creates `AssembledKeyword` / `AssembledToken` entries from string literals.
**Output:** Mutated node metadata.

### `nameNode(kind)` / `nameField(fieldName)` (from `node-map.ts`)
**Pattern:** Any kind / field name.
**Action:** snake_case → PascalCase typeName + camelCase factoryName / propertyName; reserved-word + operator-token handling.
**Output:** name records.

---

## Slot model + Assembled hierarchy (`compiler/node-map.ts`, `compiler/collect-slots.ts`)

### `AssembledNodeBase<R>` and subclasses
`AssembledBranch` / `AssembledPolymorph` / `AssembledGroup` / `AssembledMulti`
/ `AssembledPattern` / `AssembledKeyword` / `AssembledToken` / `AssembledEnum`
/ `AssembledSupertype`. Each stores its rule snapshots and precomputes
model-type-specific metadata.

- **`AssembledBranch`** holds `protected _slots: Record<string, AssembledNonterminal>` =
  `slotRecord ?? buildSlotsRecord(simplifiedRule, ctx, renderRule)` (R1: the
  grammar-wide inputs — kind entries, collision signatures, alias targets,
  simplified rules — travel in a `KindedDeriveCtx`). Getters:
  `slots` → `_slots`; **`fields` → `Object.values(this.slots)`** (every slot,
  field-named or kind-named — consumers must NOT branch on origin);
  **`children` → `[]`** (retired post slot-unification; kept as an
  empty-returning getter for un-migrated callers); `members` → the seq/choice
  members; `separator` → the repeat separator; `isContainerShape` →
  `!hasAnyField(this.rule)`.
- **`AssembledPolymorph`** stores pre-built forms (each with its own slots);
  `fields` / `children` follow the same unified pattern.
- **`AssembledGroup`** is the hidden synthesized-group shape; same getters.

> **Legacy translation pipeline — DELETED (R1):** the `node-map.ts` Jinja
> half (`translateToJinja` / `filterForFlanks` / `wrapOptionalFieldPlaceholders`
> / `isWithinGuardedRange` / `JinjaTranslateMeta`) and the external-boundary
> trio (`hasHiddenExternalRef` / `hasExternalBoundaries` /
> `isExternalTerminalMember`) were zero-caller dead code (lsproxy-verified)
> and were removed in R1. `emitRule` (emitters/templates.ts) is the
> authoritative template path; `template-walker.ts` removal remains a PR3
> item.

### `collectSlots(rule, kindForName?, kindEntries?, inherited?, inheritedSeparator?)` (`compiler/collect-slots.ts`) **(NEW — replaces `deriveSlotsRaw`)**
**Pattern:** A wrapper-free (post-`deleteWrapper`) rule body.
**Action:** "A slot IS a `nonterminal`-flagged node." Walks the tree emitting one `AssembledNonterminal` per nonterminal node:
- `seq` → **distribute**: flat-collect member slots; the seq emits no slot. A multi-slot seq that survives derivation propagates its own `multiplicity`/`separator` to members that have none (`slotMultiplicity`; an inherited `nonEmptyArray` relaxes to `array` because a single member of a repeat1-seq isn't itself guaranteed ≥1).
- `choice` → **two routes.** If field-named OR a non-structural union (`!isStructuralChoice`) → ONE union slot via `buildSlot`. If `fieldName === undefined && isStructuralChoice` → **distribute** into arms, `mergeByName` within each arm, `mergeChoiceArms` across arms (a field absent from some arm relaxes to optional). The **field-named-choice guard** is load-bearing: a `field('body', choice(...))` is ONE slot named by the field — distributing it would drop the field name and split the body into per-arm slots (the python block family: `field('body', _suite)` mis-deriving to `block`).
- `variant` / `group` → transparent, recurse into content; `clause` → transparent but forces `'optional'` (ClauseRule carries no stamped multiplicity).
- non-nonterminal leaf → `[]`.
**Output:** `AssembledNonterminal[]` (folded by `mergeSlotsByName` at the `_deriveSlotsInternal` boundary).

Supporting predicates: `isSlotNode` (intrinsic nonterminal via
`isNonterminalRuleType`, or pushed-down `nonterminal: true`),
`isStructuralChoice` (an arm is a multi-member seq OR `carriesNamedField`, AND
not a shared-arm-field operator-enum), `sharedArmFieldName`,
`strongestArmMultiplicity`.

### `buildSlot(rule, kindForName?, kindEntries?, inherited, inheritedSeparator)`
**Pattern:** A single nonterminal node.
**Action:** Computes the slot. **Name derivation (`baseName`/`source`/`origin`):** `rule.fieldName` wins (`source` from rule, `origin` unset); else by type — `symbol`/`supertype` → strip leading `_`, `source='inferred'`, `origin='kind'`; `choice`/`polymorph` → recover a `sharedArmFieldName` (operator-enum) else warn (unnamed-choice) and fall back to `'content'` with `origin='kind'`; default → elide (`null`). Values via `deriveValuesForRule` (polymorph: union of form contents); `'content'` arrays relax `nonEmptyArray`→`array` (may be legitimately empty). Separator + `hasTrailing`/`hasLeading` from `rule.separator ?? inheritedSeparator` (object form reads `.trailing`/`.leading`; else `findRepeatFlag`). Pluralizes multi-slot property names.
**Output:** `AssembledNonterminal` (or `null`).

> **`_new` naming getters (diagnostic scaffolding):** `buildSlot` additionally
> stamps `fieldName`, `storageNameNew`, `nameNew`, `parseNamesNew` on every
> slot — the **intended future single-source naming**: `fieldName` wins, else
> the single referenced kind name (incl. a supertype's own name), else
> `'content'`; `parseNamesNew = [fieldName]` (parser routes by field) or the
> ref-kind names. These run alongside the legacy `baseName`/`origin`
> derivation and are the migration target for retiring it.

### `deriveSlots(rule, ctx?)` / `_deriveSlotsInternal(rule, ctx?)` / `mergeSlotsByName(slots)` / `buildSlotsRecord(rule, ctx, renderRule?)`
**Pattern:** Public slot-derivation entry point.
**Action:** R1 (#14 sweep): grammar-wide inputs travel in a **`DeriveCtx`** (`kindEntries` / `kindName` / `collision` signatures / `visibleAliasTargets` / `simplifiedRules` / `nodes`); per-kind builders take **`KindedDeriveCtx`** (`kindName` required). Recursion-local traversal state — `multiplicity` in `deriveValuesForRule(rule, ctx, multiplicity)` — stays an explicit parameter per CW6. `deriveSlots` → `_deriveSlotsInternal` → `deleteWrapper(rule)` then `mergeSlotsByName(collectSlots(canonical, …))`. `mergeSlotsByName` folds same-named slots across positions (e.g. python `if_statement.alternative` from a repeat AND an optional) into one `AssembledNonterminal` whose `values` union.
**Output:** `readonly AssembledNonterminal[]`.

### Slot helpers
- `extractSeparatorString(sep)` — string / `Rule[]` / `{rules, trailing?, leading?}` → joined separator text.
- `stampSeparatorOnValues(values, sep)` — stamps separator onto array/nonEmptyArray values only.
- `isRequired` / `isMultiple` / `isNonEmpty` — derived from per-value `multiplicity`, no stored booleans.
- `hasAnyField(rule)` / `hasAnyChild(rule)` — cheap short-circuit predicates.
- `snakeToCamel` / `pluralize` / `safeParamName` / `kindsOf(slot)`.

---

## Phase 5: Emit (`emitters/*.ts`)

Every emitter follows the canonical pattern: iterate `nodeMap.nodes`, dispatch
on `node.modelType`, own ALL string generation locally; compiler-side Assembled
classes expose data only (`feedback_emitter_pattern_consistency`).

### `emitters/templates.ts` — `TemplateEmitter` / `runTemplateEmitter(config)` **(authoritative — PR2)**
**Pattern:** Once per regen with the assembled `NodeMap`.
**Action:** `runTemplateEmitter` walks `nodeMap.nodes` and dispatches: `branch` → `emitBranchTemplate` (consumes `node.renderRule`), `polymorph` → `emitPolymorphTemplate` (per-form `renderRule`; uses `variant`, not `$variant`, for Askama compatibility), `group` → `emitGroupTemplate`, `multi` → `emitMultiTemplate`; `supertype`/`pattern`/`keyword`/`token`/`enum` skipped. The shared `emitRule(rule, ctx)` switches on `Rule.type` and reads PR0 leaf attributes directly; slot property names resolve through the `EmitCtx`'s ownerSlots. A **slot-preservation gate** (each declared slot appears in the output exactly once; bypass with `SITTIR_SLOT_PRESERVATION=0`) replaced the byte-equivalence diff gate.
**Output:** `EmittedTemplates` (`bodies: Map<kind, jinja>`); `writeJinjaTemplates` writes + prunes stale `.jinja` files.

> **Stale notes:** the file's top docstring still claims template generation
> "happens inside the `AssembledNode` class hierarchy … `renderTemplate()`" —
> that is the legacy path. `emitBodyForNode` (still calling `renderTemplate`)
> is a residual legacy helper; the `TemplateEmitter` class is authoritative.

### `emitters/wrap.ts`
**Pattern:** Per node; tree node → typed NodeData hydration.
**Action:** Emits per-kind `wrap*` functions. **`collectConcreteStorageKeys(slot, nodeMap)`** is the `origin === 'kind'` arm-probe: for kind-named slots it expands runtime discriminator kinds, inverts the slot's `aliasSources` (`{target: source}`) to rewrite source→target storage keys, and returns the candidate `_<kind>` keys (or `undefined` when they collapse to the nominal `_<name>`). **`resolveSlotStoreExpr(slot, dataExpr, candidateKeys?)`** emits a `(_a ?? _b ?? _name)` multi-key probe over those candidates (the runtime data populates exactly one). This is the alias-target routing fix (`project_alias_target_routing`).
**Output:** wrap function source.

### `emitters/factories.ts` / `from.ts` / `types.ts` / `render-module.ts` / `transport-common.ts`
**Pattern:** Per node.
**Action:** Iterate nodes, dispatch on modelType, consume the AssembledNode slot view. `render-module.ts` reads per-slot separator from the slot's NodeRef/TerminalValue stamp, falling back to the node-wide `meta.separators` for slots not yet stamped (PR3 drops the fallback once stamping covers all kinds). `from.ts` consumes `AssembledGroup` for synthesized-group projection.
**Output:** Generated TS / Rust render code.

### `emitters/node-model.ts` / `suggested.ts` / `compiler/grammar.ts` **(PR3 re-wrap target)**
These serialize rules / re-print override syntax / emit grammar.js for
cross-process consumers. When wrapper rule types delete (PR3), they gain a
re-wrap pass reconstructing canonical wrapped form from attribute form, and
`node-model.json5` bumps its schema with a migration step in `cli.ts`.

---

## Complexity hotspots (simplification candidates)

Feeds an upcoming simplification design. These are the over-conditional /
surprising bits worth flagging:

1. **`collectSlots` choice distribution vs union (`collect-slots.ts:504`).**
   The `choice` case forks on `fieldName === undefined && isStructuralChoice`.
   Distribution (per-arm slots merged by name) is only correct for
   field-contributing branches like ts `variable_declarator`
   (`choice(seq(field('name'), …), seq(…))` → `name`/`type`/`value`). It
   **mis-handled `field('body', _suite)`** (python block family) — the
   field-named-choice guard (`rule.fieldName === undefined`) was added precisely
   so a field-named choice stays ONE slot. The dual-path choice handling
   (distribute / union / field-named) is the single most condition-dense site
   in slot derivation and a prime candidate for collapsing into a uniform
   "choice = one union slot, named by the enclosing field or shared-arm field"
   rule once `_new` naming subsumes it.

2. **`origin` is unreliable; naming derivation is scattered.** `buildSlot`
   derives a slot name from three interacting sources — `rule.fieldName`,
   per-type `baseName` fallback, and choice **distribution** — and stamps
   `origin: 'kind'` on positional/unnamed slots. But `origin` is then **flipped
   to `'kind'` by a later pass even for slots that originated from a `field()`**
   (the `source='inferred'` positional-symbol arm forces it), so consumers that
   branch on `origin` (e.g. wrap's `collectConcreteStorageKeys`, which keys
   entirely off `slot.origin === 'kind'`) read a derived-not-authoritative
   signal. The parallel **`_new` getters** (`fieldName` / `storageNameNew` /
   `nameNew` / `parseNamesNew`) exist as the single-source replacement but run
   *alongside* the legacy `baseName`/`origin` logic — both paths live until the
   migration completes.

3. **Supertype/hidden-choice name lost on inline.** When a hidden choice or a
   supertype is inlined (`inlineRefs` / `pushAttrsToLeaves`), the **supertype's
   own name is not preserved onto the resulting slot** — the choice case in
   `pushAttrsToLeaves` had to be patched to propagate `fieldName` onto the
   choice node (it previously only stamped leaves), and even so an inlined
   `field('body', _suite)` over a choice recovers its name only via the
   `sharedArmFieldName` fallback in `buildSlot`, not from the inlined
   supertype. Inlining a named structural node should carry that name forward
   as the slot's `baseName` rather than relying on downstream recovery.

4. **Transport/bridge render code referencing stale slot names.** A recurring
   Codex PR-review class: generated Rust render / transport code references slot
   names that no longer match the current slot model after auto-group synthesis
   and inlining — e.g. `type_arguments_repeat1`, `*_optional1`
   (`_<parent>_optional<N>` / `_<parent>_repeat<N>` synthesized helpers), and ts
   `export_statement`. These arise because the synthesized-helper names leak
   into emitted artifacts (`types.ts` / `consts.ts` / `transport.rs`) while the
   slot the parent actually exposes is the inlined content. The render-module
   per-slot-separator fallback (`meta.separators` node-wide) is part of the same
   smell — render code reads a node-wide map keyed by names that may not survive
   inlining. PR3's per-slot stamping + helper-name cleanup target this.

5. **Three legacy template paths still live (PR3).** `template-walker.ts`
   (~66 KB), the `node-map.ts` translation pipeline, and every
   `AssembledXxx.renderTemplate()` method coexist with the authoritative
   `TemplateEmitter`. The `templates.ts` top docstring + `emitBodyForNode`
   still describe/use the legacy path. This is dead-weight duplication that
   confuses every reader until PR3 deletes it.
