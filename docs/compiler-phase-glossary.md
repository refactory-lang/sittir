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
>   → evaluate (compiler/evaluate.ts: runs DSL, wire())
>     → link (compiler/link.ts)
>       → normalize (compiler/normalize.ts: + applyWrapperDeletion + computeSimplifiedRules)
>         → assemble (compiler/assemble.ts + node-map.ts + collect-slots.ts)
>           → emit (emitters/*.ts)
> ```
>
> **Three Rule shapes flow through `normalizeGrammar()` and are attached per node in
> `assemble()`** (see [Rule data model](#rule-ir-compilerrulets)):
>
> | Snapshot | Produced by | Attached as | Consumed by |
> |---|---|---|---|
> | **RawRule** | `applyNormalizationPasses` (post-link) | `node.rule` | legacy walker (`renderTemplate`, until PR3) |
> | **RenderRule** | `applyWrapperDeletion` | `node.renderRule` | the authoritative `TemplateEmitter` |
> | **SimplifiedRule** | `computeSimplifiedRules` | `node.simplifiedRule` | slot derivation (`collectSlots`), factories/wrap/from |
>
> (phase-visibility-tightening: `AssembledBranch.simplifiedRule` / `AssembledGroup.simplifiedRule`
> were previously typed `Rule<'link'>` — a stale annotation predating PR1/PR2's SimplifiedRule
> snapshot — despite always holding a genuine `SimplifiedRule` value per this table; retyped to
> match. `emitRule` and its templates.ts walker family were similarly retyped `Rule<'link'>` →
> `RenderRule`, matching the `node.renderRule` row above.)
>
> **What's shipped (PR0 + PR1 + PR2):**
> - **RuleBase attributes** (PR0): `fieldName` / `multiplicity` / `nonterminal` / `separator` / `aliasedFrom` / `aliasNamed` on every Rule via the shared `RuleBase` interface (`types/rule.ts` — R11 moved the Rule IR layer to `codegen/src/types/`).
> - **enrich attribute passes** (PR0): `enrichFieldWrappers` ships in `dsl/enrich.ts`. `enrichMultiplicityWrappers` was REMOVED — `multiplicity`/`nonterminal` are derived solely by `applyWrapperDeletion` from wrapper structure (enrich stamping them was premature + polluted the `nonterminal` slot signal by marking bare `optional(',')` delimiters). The originally-planned `decomposeOptional` / `decomposeRepeat` did **NOT** land in enrich — group SYNTHESIS moved to `dsl/wire/auto-groups.ts` (`applyAutoGroups`) at the time, **but that pass was later retired** (see the updated Phase 1 note below): enrich's `applyClauseHoist` now hoists every `optional(seq)`/`repeat(seq)`/`repeat1(seq)` itself, clause-shaped or not.
> - **`applyWrapperDeletion`** (PR1, `compiler/wrapper-deletion.ts`): new last pass of `normalizeGrammar()`; pushes modifier wrappers (optional / field / repeat / repeat1 / alias) down to leaf `RuleBase` attributes. Output: `RenderRule` (wrapper-free) snapshot.
> - **RenderRule + SimplifiedRule branded types** (PR1/PR2, `types/rule.ts`).
> - **`computeSimplifiedRules`** (relocated PR1 to `compiler/simplify.ts`): takes RenderRule, runs `inlineRefs` + `simplifyRules` + `canonicalizeSeqOfLeaves` + `deleteWrapper` (post-fixpoint wrapper-free guard) + `fuseHeadRepeatLists`. Output: `Record<string, SimplifiedRule>`.
> - **Alias-body + polymorph-form snapshots** (PR2): `normalizeGrammar()` threads top-level alias-bodies and polymorph-form contents through `applyWrapperDeletion` + `computeSimplifiedRules` and merges them into `normalizedRules` / `rules` (`SimplifiedGrammar`'s phase-product field — renamed from `simplifiedRules` 2026-07-05, PR-137). `assemble.ts` reads snapshots directly; per-call `simplifyRule(...)` / `deleteWrapper(...)` fallbacks deleted.
> - **`applyAutoGroups` re-enabled (PR2), then RETIRED (`51b0347d8`):** `dsl/wire/auto-groups.ts` is physically deleted. Enrich now owns ALL `optional/repeat(seq)` hoisting itself — inline-safe into a hidden `_<parent>_optional<N>` symbol, inline-unsafe into a visible content-alias that `link.ts`'s `mintContentAliasKinds` registers as a real IR kind. The old wire-time pass had to go because it ran BEFORE link and pre-consumed inline-unsafe seqs link must see as inline content. See `dsl/enrich.ts`'s `applyClauseHoist` and Phase 0 below.
> - **`inlineRefs`** (PR2, renamed from `inlineGroupRefs`): inlines (a) hidden GROUP / MULTI refs and (b) any ref whose target is in `grammar.inline`. Matches tree-sitter's parse-time inlining. R3: lives in `dsl/rule-transforms.ts` as a shared op — `inlineRefs(rule, ctx: InlineRefsCtx, visited?)`.
> - **R3 (#14 sweep + M1 closure):** `compiler/transforms.ts` and `compiler/rule-attrs.ts` moved to **`dsl/rule-transforms.ts`** / **`dsl/rule-attrs.ts`** (named to avoid the existing `dsl/transform/` override-transform module). `SimplifyCtx` is now a real interface (`extends TransformCtx`, adds `polymorphSkipExtra?`). Entry points: `simplifyRules(rules, ctx?)`, `computeSimplifiedRules(normalizedRules, ctx?)`, `normalizeToFixpoint(rule, ctx, rules)`, `applyNormalizationPasses(rawRules, ctx?, preserveKinds?)`, `inlineHiddenSeqRefs(rules, ctx, keepRef)`. The `inlineRefs` / `canonicalizeSeqOfLeaves` clusters moved to `dsl/rule-transforms.ts`; **`simplifySeqRule` (formerly `collapseSeq`) stays in simplify** (mutually recursive with `simplifyRule` — phase-internal, not a shareable op) and **`deleteWrapper`/wrapper-deletion.ts stays compiler-side** (depends on list-fusion / rule-catalog — moving it would invert the dsl→compiler direction).
> - **`collectSlots`** (PR2/post-PR2, NEW file `compiler/collect-slots.ts`): the `deriveSlotsRaw` fold/merge/`effectiveMultiplicity` walker is **deleted**. `_deriveSlotsInternal` now delegates to `collectSlots` ("a slot IS a `nonterminal`-flagged node"). `deriveSlots` keeps its signature.
> - **New `TemplateEmitter`** (PR2, `emitters/templates.ts`): authoritative, modelType-dispatching, consumes `node.renderRule`. `runTemplateEmitter()` is the entry point. Slot-preservation gate (`SITTIR_SLOT_PRESERVATION`) replaced the byte-equivalence diff gate.
>
> **What's still ahead (PR3):**
> - Delete `compiler/template-walker.ts` (~66 KB) + the `node-map.ts` translation pipeline + `AssembledXxx.renderTemplate()` methods. **These all still exist** and are still referenced from `render-module.ts:2324`, the legacy `emitBodyForNode` (`templates.ts:1615`), and `node-map.ts:2343/2364`.
> - Delete `ClauseRule` + `detectClause` + sweep `'clause'` case sites. **Still present.**
> - Delete wrapper rule types (`OptionalRule` / `FieldRule` / `RepeatRule` / `Repeat1Rule`). **Still present** (wrapper-deletion still needs them as input).
> - Delete the RawRule snapshot from `normalizeGrammar()`.
> - Replace `deriveSlotsRaw`'s recursive contract entirely (already done — `collectSlots` is the replacement; the `clause` branch in `collectSlots` is the remaining ClauseRule dependency).
> - Wire `assertUniversalShapeRule` as a production fail-fast gate (currently `SITTIR_ASSERT_UNIVERSAL_SHAPE=1`-gated).
> - Migrate render-module per-slot separator stamping to all kinds; drop the node-wide `meta.separators` fallback.

---

## Rule IR (`types/rule.ts`)

> **R11 (types extraction):** `rule.ts`, `rule-types.ts`, `diagnostics.ts` (from `compiler/`), and `runtime-shapes.ts` (from `dsl/`) now live in `packages/codegen/src/types/` — plus `ir.ts` (PolymorphVariant / ExternalRole, re-exported by `compiler/types.ts` for existing importers). Both `dsl/` and `compiler/` import DOWN into this layer; the `sym` constructor moved here too, closing the last dsl→compiler value edge. The dependency shape is `dsl → types ← compiler` — acyclic, verified.

One discriminated union (`Rule`) throughout the pipeline. Presence varies by
phase: after Evaluate `symbol`/`alias`/`token`/`repeat1` are present; after
Link `alias`/`token` are gone and `clause`/`group`/`indent`/`dedent`/`newline`
are added; after Normalize `variant`/`polymorph` are present. `repeat1` is
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
  readonly inline?: boolean;               // per-ref inline decision: hidden && !aliased
  readonly metadata?: RuleMetadata;        // opaque provenance brand — see below
  readonly splicedBody?: boolean;          // declared: this seq occupies a group-splice site
  readonly variantArms?: readonly string[]; // declared: pre-flatten CHOICE arms a SupertypeRule erased
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
- **`inline`** — per-ref decision, `inline = hidden && !aliased`. Default
  `hidden` (`name.startsWith('_')`) stamped at construction (`evaluate.ts`
  `symbol`/`createProxy`); flipped `false` by the `alias` wrapper during
  push-down (`wrapper-deletion.ts` ALIAS case) — an alias confers a real
  visible CST kind that must materialize, not flatten. Read directly off the
  rule (`isHiddenKind` fallback for link-synthesized symbols).
- **`splicedBody`** — declared once by `compiler/normalize.ts`'s
  `materializeInlinedBody` at the moment it splices a hidden group's body
  into a parent at a former `symbol(_x)` ref position. Not provenance: it
  names a present-tense structural fact ("this seq occupies a splice site"),
  read directly with no re-derivation. Consumed by `emitters/templates.ts`'s
  boundary walkers (`rightmostBoundary`/`leftmostBoundary`) so a spliced seq
  keeps the spacing of the opaque unit it replaced (`for await (`, not
  `for await(`).
- **`variantArms`** — declared once by `link.ts`'s `classifyHiddenChoiceRule`
  at the exact moment it flattens a hidden CHOICE into a `SupertypeRule`'s
  `subtypes: string[]` — an operation that otherwise erases which pre-flatten
  arms were variant-adoption children. Holds those arms' target kind names,
  in member order. Only ever set on a `SupertypeRule`; every other variant
  leaves it `undefined`. Consumed by `assemble.ts`'s `variantChildKindsSet`
  construction as the one narrow supplement to `deriveStructuralVariantChildren`'s
  structural derivation (`compiler/variant-structural.ts`, Phase 4: Assemble
  below). Same pattern as `splicedBody`: a declared, once-stamped fact replacing what
  would otherwise be a destroyed-then-reconstructed read.

### Metadata provenance (`RuleMetadata` opaque brand)

`RuleBase.metadata` is an OPAQUE brand (`types/rule-metadata-brand.ts`) over
the real shape in `dsl/rule-metadata.ts` (`RuleMetadataShape` — `author`,
`classifiedBy`, `fieldSource`, `symbolSource`; absorbs what used to be
scattered `source?`/`inlinedFrom?` fields on several rule types). Two-seam
access, mirroring `compiler/opaque-facts.ts`'s slot-level pattern:

- **`makeRuleMetadata`** (write) — unrestricted. Any phase may record a
  provenance fact; recording is not the same as branching on it.
- **`readRuleMetadata`** / **`RuleMetadataShape`** (read) — restricted to
  `dsl/enrich.ts`, `dsl/wire/*` (incl. `dsl/transform/transform-path.ts`'s
  `author === 'enrich'` descent keying), and diagnostics-emission code
  (`packages/tools/src/validate/*`, `emitters/node-model.ts` serialization).
  Enforced by `dsl/__tests__/rule-metadata-layering.test.ts`, which walks
  every `.ts` file and asserts any import of the restricted read names is
  sanctioned-or-allowlisted (currently: allowlist EMPTY — any new entry needs
  individual justification).

Everything else — compiler phases and emitters driving codegen DECISIONS
(as opposed to serializing a diagnostic dump) — must treat `RuleMetadata` as
opaque: construct-and-forget or blind-carry only
(`feedback_metadata_not_behavior`). The governing rule: the compiler must
neither read a provenance tag NOR reconstruct authorship structurally.
Stamp-then-reread (a phase stamps a tag, a LATER phase re-reads the same
rule to decide behavior) must become return-value dataflow instead — see
`link.ts`'s `classifyHiddenRule`/`classifyHiddenChoiceRule` for the converted
example. `splicedBody` and `variantArms` above are the declared-fact pattern
this doctrine prefers over metadata reads: a structural attribute stamped
once by the pass that creates the fact, read directly, never round-tripped
through the opaque bag.

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
**Action:** Fixed-point loop (max 8 iterations) applying, until convergence: `applySymbolToField` → `applyOptionalKeyword`.
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

> **`enrichFieldWrappers` REMOVED (with `enrichMultiplicityWrappers`):** `fieldName` + `nonterminal` are derived by `applyWrapperDeletion`'s FIELD case (pushes the field's name + nonterminal onto its content) and its SEQ case (retains fieldName on the seq node), with `materializeInlinedBody` carrying fieldName through group inlining. Stamping in enrich was premature (nothing reads it before wrapper-deletion). Field naming that enrich INFERS on bare symbols still happens in `applySymbolToField` (a real structural promotion, not a derived-attr stamp). Net: **enrich no longer stamps any derived slot attribute.**

> **`enrichMultiplicityWrappers` REMOVED:** `multiplicity` + `nonterminal` are
> derived solely by `applyWrapperDeletion` (Phase 3) from the
> optional/repeat/repeat1/field wrapper structure — the single source of truth.
> Stamping them in enrich was premature (nothing read them before
> wrapper-deletion) and made `nonterminal` unreliable as the slot signal: enrich
> marked bare `optional(',')` delimiters `nonterminal:true`, whereas
> wrapper-deletion deliberately does not (a bare optional terminal is render-only,
> not a slot). With it gone, `nonterminal === true` is the authoritative
> slot-presence check everywhere (collect-slots, simplify's strip decision).

> **Reconciliation:** the spec's planned `decomposeOptional` / `decomposeRepeat`
> enrich passes were NOT implemented under those names. Group synthesis for
> structural optional/repeat content initially moved to `dsl/wire/auto-groups.ts`
> (a wire-time pass, so it would reach tree-sitter) but that pass has SINCE
> been retired (`51b0347d8`, the file is deleted) — enrich's `applyClauseHoist`
> (below) now performs this hoisting itself, pre-tree-sitter, for BOTH
> clause-shaped and non-clause `optional(seq)`/`repeat(seq)`/`repeat1(seq)`
> content. Separator-lift / attribute push-down still live in
> `applyWrapperDeletion`.

### `applyClauseHoist(parentKind, rule, rulesBag, ...)`
**Pattern:** Any `optional(seq(...))` / `CHOICE[seq(...), BLANK]` position, clause-shaped (`seq(STRING, FIELD, …)`) or not.
**Action:** Hoists the matched seq into a hidden group rule — inline-safe content becomes a hidden `_<parent>_optional<N>` symbol; inline-unsafe content becomes a visible content-alias that `link.ts`'s `mintContentAliasKinds` registers as a real IR kind. Runs pre-tree-sitter (enrich phase), so both shapes reach the parser correctly — the superseded `applyAutoGroups` ran at wire-time (post-enrich, pre-tree-sitter-consumption) and pre-consumed inline-unsafe seqs that link needed to see as inline content; that ordering bug is why the wire-time pass was retired in favor of doing this in enrich instead.
**Output:** Rewritten rule with clause/group positions hoisted to hidden rules; `rulesBag` gains the synthesized entries.

---

## Phase 1: Evaluate (`compiler/evaluate.ts` + `dsl/wire/*` + `types/runtime-shapes.ts`)

Executes the grammar.js DSL and produces a `RawGrammar`. Mirrors tree-sitter's
`grammar()` with sittir extensions.

> **Two-compiler-shape divergence (`types/runtime-shapes.ts`):** the DSL globals
> run in two runtimes. Sittir's evaluator keeps `optional` as a lowercase
> `{type:'optional'}` wrapper; tree-sitter's CLI lowers `optional(x)` to
> `CHOICE[x, BLANK]` (uppercase). `runtime-shapes.ts` exposes dual-case
> predicates (`isChoiceType`, `isBlankType`, `isSeqType`, `isOptionalType`,
> `isPrecWrapper`, `typeEq`) so wire-side passes recognize both forms — see
> `wire.ts`'s `unwrapOptionalChoiceRt`.

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
**Action:** Folds declarative override config into the options object before tree-sitter sees it. Composes/synthesizes polymorph + transform parent fns; injects deferred-content fns for `_<parent>_<suffix>` / `_kw_<field>` / `_<alias>` hidden rules; wraps every rule fn so a per-invocation `WireContext` (and `currentRuleKind`) is active; drains accumulated conflict groups and synthetic-inline names into the `conflicts` / `inline` callbacks; runs `applyWirePatternReplacement` (the tree-sitter-runtime counterpart of evaluate's pattern replacement) for body-pattern `groups:`. (No longer runs `applyAutoGroups` — retired, see Phase 0's `applyClauseHoist`.)
**Output:** `WiredOpts` with a non-enumerable `__wireContext__` attached for the compiler pipeline (`evaluate` → `link`) to read polymorph/group metadata.

Key wire internals: `composeOrSynthesize{Polymorph,Transform}Parents`,
`buildPolymorphParentFn`, `injectHiddenRulePlaceholders`,
`makeDeferredContentFn` (deposit → `previous` base rule → `blank()` fallback),
`wrapAllRuleFns`, `buildWiredConflictsFn`, `buildWiredInlineFn`
(`nativeInlineRef` constructs symbols via the runtime's `symbol()`),
`applyWirePatternReplacement` + `replaceInBodyRt` / `patternBodyEqual` /
`isComplexBodyRt`.

### `applyAutoGroups(base, outRules, context, authoredSynthesisKinds)` (`dsl/wire/auto-groups.ts`) **(RETIRED — file deleted, `51b0347d8`)**
Kept here for historical/naming-convention context only — the `group-lift` source tag this pass minted lives on (`inlineRefs`'s `source==='group-lift'` handling, Phase 3.5), even though this function and its file no longer exist. Superseded by enrich's `applyClauseHoist` (Phase 0), which does the same synthesis earlier in the pipeline (pre-tree-sitter, not wire-time) for both clause and non-clause shapes.

**Pattern (as it worked before retirement):** A parent rule body containing `optional(seq(...))` / `repeat(seq(...))` / `repeat1(seq(...))` (STRICT seq content only — `field`/`choice`/leaf content passes through). Recognized both sittir lowercase and tree-sitter `CHOICE[seq, BLANK]` forms.
**Action:** SYNTHESIS ONLY. For each match, synthesized a hidden helper `_<parent>_optional<N>` / `_<parent>_repeat<N>` (cross-parent dedupe by canonical-stringified body) holding the inner seq, and rewrote the parent body's content to a `group-lift`-sourced SYMBOL ref. Wrote into `outRules`, not the base seed. Registered each helper in `context.syntheticInline` so the wired `inline:` callback added it to `grammar.inline` → tree-sitter inlined it → flat runtime. Skipped author-overridden rules and `authoredSynthesisKinds` (kinds opted into `transforms:` / `polymorphs:` / path-mode `groups:`).
**Output (historical):** Mutated `outRules` (synthesized helper fns + rewritten parent fns); populated `syntheticInline`.

> **Why it was retired:** running at wire-time (after enrich, but still
> before tree-sitter consumes the grammar) meant auto-groups pre-consumed
> inline-unsafe seqs that `link.ts` needed to see intact as inline content —
> an ordering bug. Moving the same synthesis into enrich (`applyClauseHoist`,
> which now runs pre-tree-sitter for both clause and non-clause shapes)
> resolved it structurally rather than patching the ordering.
>
> **Explicitly NOT decomposition (still true of `applyClauseHoist` today):**
> this pass never touches `separator`/`trailing`/`leading` metadata.
> Separator-lift and attribute stamping are a separate concern handled in
> `applyWrapperDeletion` / simplify, keeping the two passes from
> re-introducing the renderer-reads-separator-on-all-repeats regression.

---

## Phase 2: Link (`compiler/link.ts`)

Resolves what nodes ARE. After Link: no `alias`, no `token` wrapper; all field
nodes carry provenance; polymorphs/variants classified. Shape is otherwise
preserved (no restructuring).

### `link(raw, include?)`
**Pattern:** Called with a `RawGrammar`.
**Action:** Resolves all rules, classifies hidden rules, promotes terminals, infers field names, detects polymorphs, applies override polymorphs + `applyGroupOverrides` (user `groups:`), hoists indent into repeats, annotates block-bearer fields, collects repeated shapes. Auto-synthesized hidden groups from enrich's `applyClauseHoist` are already in the rules map and classify through the normal hidden-rule path.
**Output:** `LinkedGrammar` (resolved rules, derivation log, alias map, top-level alias bodies, word, pattern-replacement kinds).

> **Word-matcher pin-at-link invariant.** `LinkedGrammar.wordMatcher` (a
> `RegExp | undefined`) is compiled ONCE by `compileWordMatcher(raw.word,
> raw.rules)` from the EVALUATE-view rule tree, where the `word` rule's
> authored wrappers (notably a trailing `REPEAT`) are still intact. Every
> later phase (`NormalizedGrammar` → `SimplifiedGrammar` → `NodeMap`) CARRIES
> this value forward rather than recompiling from its own `rules`/`linkRules`
> view — compiling post-normalize is unsound in general, because
> wrapper-deletion collapses `REPEAT`/`OPTIONAL` into leaf `multiplicity`
> attributes that `ruleToRegexSource`'s walker doesn't consult, silently
> undercounting the regex (confirmed regression: typescript's `identifier`
> word rule lost its trailing `REPEAT` under a post-link recompile). Consumers
> read the carried value (`ctx.wordMatcher` in Link's `resolveRule`;
> `matchesWordShape(s, normalized.wordMatcher)` in `AssembleCtx.from`) — never
> recompile it themselves. See `docs/superpowers/specs/2026-07-04-grammar-phase-ctx-design.md`
> (PR-137 follow-on) for the falsifying probe.

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

## Phase 3: Normalize (`compiler/normalize.ts`)

Restructures seq/choice/optional/repeat for simplification (non-lossy on named
content), then produces the RenderRule + SimplifiedRule snapshots.

### `normalizeGrammar(linked, ctx?)`
**Pattern:** Called with a `LinkedGrammar`.
**Action:**
1. `applyNormalizationPasses(rawRules, …)` — collapse → fan-out → factor → dedupe → inline → re-collapse. Produces the **RawRule** map.
2. `applyWrapperDeletion(rules)` — pushes modifier wrappers to leaf attributes. Produces the **RenderRule** snapshot.
3. `computeSimplifiedRules(normalizedRules, word, inlineKinds)` — produces the **SimplifiedRule** snapshot.
4. Threads top-level **alias bodies** and **polymorph-form** contents through the same `applyNormalizationPasses` → `applyWrapperDeletion` → `computeSimplifiedRules` pipeline and merges them into `normalizedRules` / `rules` (so `assemble.ts` reads snapshots, never re-simplifies per call).
**Output:** `SimplifiedGrammar` with `linkRules` (RawRule — renamed from `rules` in the phase-visibility-tightening pass; the pre-simplify, post-normalization-passes/pre-wrapper-deletion view), `normalizedRules` (RenderRule), `rules` (SimplifiedRule — the phase product; renamed from `simplifiedRules` 2026-07-05/PR-137 so every `Grammar<P>` names its phase product `rules` uniformly).

> **`normalizedRules` vs `rules` — the opacity invariant.** Three snapshots
> coexist on `SimplifiedGrammar` (and, carried, on `NodeMap`) because each is
> a genuinely different SHAPE, not a naming convenience: `linkRules` still has
> wrapper nodes (`optional`/`field`/`repeat`/`alias`), `normalizedRules` is
> wrapper-free (attributes pushed to leaves) but pre-fixpoint, `rules` is the
> post-fixpoint SimplifiedRule phase product. **Default to `rules`** — it's
> what every phase-product consumer (slot derivation, factories/wrap/from)
> reads. Reach for `linkRules` or `normalizedRules` ONLY when a consumer
> genuinely needs a wrapper-node shape or a pre-fixpoint view that `rules`
> has already collapsed away — each such exception is enumerated on
> `NodeMap.linkRules`'s doc comment (`compiler/types.ts`), e.g.
> `templates.ts`'s hidden-helper inlining reads `normalizedRules` because it
> doesn't need wrapper shapes but does need the pre-simplify structure. A new
> consumer reaching past `rules` without landing in that enumerated list is a
> signal the phase-visibility boundary is being punched through, not a
> routine implementation choice.

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

**Wrapper-node-free invariant (PR #101):** by the time Simplify runs,
`applyWrapperDeletion` has already converted every `field`/`optional`/`repeat`/
`repeat1` wrapper to a leaf attribute (`fieldName`/`multiplicity`/`nonterminal`).
Simplify never re-introduces those nodes: all rule construction inside Simplify
goes through an injected **`ctx.builder`** (a `RuleBuilder`), and the simplify
ctx supplies the `attributeBuilder` whose wrapper constructors push attributes
instead of building nodes. So `simplifyRule`'s switch handles only structural
nodes (`seq`/`choice`/`group`/`variant`) + leaves, and its `default` THROWS — a
stray `field`/`optional`/`repeat`/`repeat1` node reaching Simplify is a bug,
caught loudly. (A full regen of all three grammars hits the throw zero times.)

### `RuleBuilder` / `structuralBuilder` / `attributeBuilder`
**Pattern:** Phase-injected rule-construction strategy (`ctx.builder`).
**Action:** `RuleBuilder` (interface, `dsl/rule-transforms.ts`) exposes `seq`/`choice`/`optional`/`repeat`/`repeat1`/`field`. `structuralBuilder` (same file, pure, the default on `TransformCtx.builder`) builds plain wrapper nodes. `attributeBuilder` (`compiler/simplify.ts`, injected into the simplify ctx by `makeDefaultCtx` + `normalize`'s `computeSimplifiedRules` calls) overrides the wrapper constructors to push attributes via `deleteWrapper`: `field(n,X)`→`fieldName`+`nonterminal` on X; `optional(X)`→empty-seq fold / bare-delimiter strip / else `multiplicity:'optional'`; `repeat`/`repeat1`→`multiplicity`. `seq`/`choice` stay plain nodes. Construction sites resolve `ctx?.builder ?? structuralBuilder`.
**Output:** A `Rule` — node or attribute-stamped per the active builder.

### `computeSimplifiedRules(normalizedRules, ctx?)`
**Pattern:** Called from `normalizeGrammar()` with the RenderRule map; ctx carries `builder: attributeBuilder`.
**Action:** `simplifyRules` (fixpoint of `inlineRefs` + `simplifyRule`) → per-rule `canonicalizeSeqOfLeaves` → `deleteWrapper` (final wrapper-free guard) → `fuseHeadRepeatLists` (re-fuse head-single + tail-array pairs an inline exposed). Optionally runs `assertUniversalShapeRule` per kind when `SITTIR_ASSERT_UNIVERSAL_SHAPE=1`.
**Output:** `Record<string, SimplifiedRule>`.

### `simplifyRules(rules, ctx?)` / `normalizeToFixpoint(rule, ctx?, rules)`
**Pattern:** Full rule map / single rule.
**Action:** `normalizeToFixpoint` loops `simplifyRule(inlineRefs(current, …))` up to 16 iterations until structural convergence (each transform is non-increasing on tree size).
**Output:** Simplified map / converged rule.

### `simplifyRule(rule, ctx?)`
**Pattern:** Any rule node (post wrapper-deletion → no `field`/`optional`/`repeat` nodes at the input).
**Action:** Per-rule-type dispatch: `seq`→`simplifySeqRule`; `choice`→`simplifyChoiceRule`; `group`→`simplifyGroupRule`; `variant`→`simplifyVariantRule`; leaves (`symbol`/`string`/`pattern`/`alias`/`token`/`supertype`/`indent`/`dedent`/`newline`) pass through unchanged; **`default` throws** (field/optional/repeat/repeat1 must already be attributes — see the wrapper-node-free invariant above). `withAttrsFrom` carries discarded nodes' slot attributes onto survivors.
**Output:** Simplified rule.

### `simplifySeqRule(rule, ctx?)` (formerly `collapseSeq`)
**Pattern:** A `seq` during simplify.
**Action:** Maps + filters members (strips non-keyword strings and empty-seq sentinels), flattens bare nested seqs (a nested seq that carries its OWN `multiplicity`/`separator`/`fieldName` is kept as one member so its cardinality isn't lost). On collapse to one member, **`multiplicity` COMBINES via `combineMultiplicity`** (rather than the survivor silently keeping its narrower own); `separator`/`fieldName`/`id` ride along absent-only.
**Output:** Collapsed seq / single survivor / empty seq.

### `simplifyChoiceRule(rule, ctx?)`
**Pattern:** A `choice` during simplify.
**Action:** Recurses each member; folds an empty-match member (`pattern("")`, empty seq) into `ctx.builder.optional(inner)` (→ `multiplicity:'optional'` attribute in simplify, or empty-seq when `inner` is a bare delimiter); collapses a single member; else `mergeChoiceBranches(…, ctx)` then `hoistSharedFieldAcrossChoiceBranches(…, ctx)`. Variant wrappers are preserved for polymorph detection.
**Output:** Simplified choice / optional-attributed inner / merged seq.

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

### `hoistFieldOutOfSingleContentWrapper(rule)` (no longer in the Simplify pipeline)
**Pattern:** `repeat(field('n', X))` / `optional(field('n', X))`.
**Action:** Rewrites to `field('n', repeat(X))` / `field('n', optional(X))`. As of PR #101 the deleted `simplifyOptionalRule`/`simplifyRepeatRule` were its only callers; field-in-wrapper is now resolved by `attributeBuilder` (via `deleteWrapper`). Still exported, exercised only by tests.
**Output:** Field hoisted outward.

### `hoistInnerFieldOutOfFieldWrapper(rule)` / `hasNamedSiblingOfInnerField` / `isNamedReference` / `hasInnerFieldAtExposableDepth`
**Pattern:** `field('outer', wrapper(… field('inner', X) …))`.
**Action:** Drops the outer field when an inner field sits at exposable depth and no named-symbol sibling would lose its label. Bails on direct field nesting or a named-symbol sibling. No longer in `simplifyRule`'s switch (no FIELD case) — used by the template path `hoistInnerFieldsForTemplate`.
**Output:** Inner content (outer field stripped) or original.

### `hoistSharedFieldAcrossChoiceBranches(rule, ctx?)` / `mergeChoiceBranches(rule, ctx?)` / `extractFieldAcrossBranches(perBranch, name, ctx?)` / `mergePosition(position, ctx?)`
**Pattern:** Choices where a field name appears once per branch / same-length structurally-equivalent seq branches. Driven by `simplifyChoiceRule`, which threads `ctx` so field construction routes through `ctx.builder.field` (→ attribute push in simplify).
**Action:** Lift a shared field out and union its contents (residuals → `ctx.builder.optional(...)`); or merge into a flat seq with per-position unioned field contents (`field('op', choice('&&','||','+'))` → field as `fieldName` attribute on the unioned choice). When the branches aren't mergeable seqs (a choice of leaf arms — the wrapper-free operator case) `mergeChoiceBranches` falls through to `liftSharedArmAttrs`.
**Output:** `seq(choice(…){fieldName:A}, …)` (field as attribute).

### `liftSharedArmAttrs(rule)`
**Pattern:** A wrapper-free `choice` whose arms each carry a slot attribute — post wrapper-deletion a distributed per-arm `field`/`optional`/`repeat` survives only as a leaf attr per arm (e.g. rust `binary_expression` operator: `choice(string{fieldName:'operator'}, enum{fieldName:'operator'}, …)`).
**Action:** Hoists the UNANIMOUS arm attrs (`fieldName`/`multiplicity`/`separator`/`nonterminal`, via `sharedArmAttrs`) onto the choice NODE — the single slot boundary — but only attrs the node doesn't already carry. Mirrors `deleteWrapper`'s field→choice case (one wrapper enclosing the whole choice) for the distributed-across-arms case. Without it, slot derivation reads the bare node's absent attr and falls back (`fieldName` → `content`). Arms keep their attrs (legacy shared-arm recovery still reads them; output unchanged).
**Output:** Choice with shared arm attrs stamped on the node.

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

### `assemble(normalized)`
**Pattern:** Called with a `SimplifiedGrammar`.
**Action:** Classifies each rule into a model type, constructs `AssembledNode` instances (attaching `.rule` / `.renderRule` / `.simplifiedRule`), collects anonymous tokens/keywords, resolves colliding names, assigns ir keys, marks parameterless/user-facing kinds. Slot-ref hydration is deferred to `hydrateSlotRefs`.
**Output:** `NodeMap` with `nodes`, `signatures`, `derivations`, `linkRules` (renamed from `rules` in the phase-visibility-tightening pass — same pre-simplify `Rule<'link'>` view as `SimplifiedGrammar.linkRules`; PR-137 narrowed its consumers to justified wrapper-shape-dependent exceptions, enumerated on `NodeMap.linkRules`'s doc comment in `compiler/types.ts`), `normalizedRules` (PR-137: the wrapper-deleted `RenderRule` view, for consumers that don't need wrapper shapes — e.g. `templates.ts`'s hidden-helper inlining), `externals`.

### `deriveStructuralVariantChildren(rules)` (`compiler/variant-structural.ts`)
**Pattern:** Any CHOICE node found anywhere in a kind `K`'s post-link rule body (recursive descent, e.g. rust's `function_type`/`range_pattern` nested-choice case).
**Action:** A CHOICE qualifies as a variant-adoption site when at least one member is a "named-kind arm" (a bare ALIAS/SYMBOL ref, through a VARIANT wrapper if present, or a SEQ whose first member is such a ref) whose target is BOTH **prefix-named** against `K` (`${K-without-leading-_}_<suffix>`, target's own leading `_` stripped first) AND **alias-minted** (`isAliasMintedRef` — a bare ALIAS, or a SYMBOL whose target has no independent rule body elsewhere in the grammar; the PR-0c mint-site condition, reapplied here to exclude coincidental prefix-name collisions with ordinary sibling rules). Only qualifying arms contribute a child; this deliberately does NOT implement the "any choice of named kinds" widening — zero qualifying arms means zero variant children, full stop.
**Output:** `{parent -> childFullName[]}`, replacing the deleted `WireContext.polymorphVariants` channel (decision-7 V2) — this module derives the SAME shape structurally, straight from the tree. The one case needing a supplement — a SUPERTYPE-classified parent whose CHOICE-flatten destroys the alias-mint linkage before this module sees it (python's `_simple_pattern`) — is covered by `RuleBase.variantArms`, a declared fact `classifyHiddenChoiceRule` stamps at flatten time using this module's own `isAliasMintedRef`. `tool variant-derivation-probe` is a cross-commit drift detector comparing this derivation's live output against the committed `node-model.json5`, not a structural-vs-wire equality check (the wire side no longer exists).

**Known non-reproductions** (expected gaps vs the old wire channel, not bugs — see `docs/superpowers/specs/2026-07-04-variant-structural-derivation-research.md` for the full adjudication table): (1) a separate naming mechanism can win the visible kind name over the expected `${parent}_${suffix}` form (rust's `visibility_modifier`/`in_path`, via `groups:`), so the structural derivation never sees the expected name; (2) some `variant()` registrations target a lone aliased member with no sibling alternation at all — no CHOICE node for the predicate to match (python's `dict_pattern`'s `kv` child); (3) the supertype/group case covered by `variantArms` above. All three are pre-existing, zero-drift gaps confirmed against the committed `node-model.json5`, not derivation bugs.

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

### R4 — link/assemble ctx families
- **`ResolveCtx`** (`link.ts`): `{ allRules, supertypes, externalRoles }` — pass-constant state for the rule-resolution walk. `resolveRule(rule, ctx, currentName)`, `resolveRepeat1PreservingNonEmpty`, `resolveSymbolRoleOrPass(rule, ctx)`, `resolveNamedAliasWithProvenance(content, ctx, targetName)`, `dereferenceTopLevelAliasBody(rule, ctx, resolvedRules, seen)`, `mintContentAliasKinds(rules, ctx, from, to)`, `collectTopLevelAliasBodies(resolvedRules, ctx, complex?)`. `currentName` stays explicit — per-top-level-rule attribution (CW6); `seen` cycle guards stay explicit.
- **`LinkCtx`** (`link.ts`, `BaseCtx<'evaluate'>`): merges the former `ResolveCtx` (rule-resolution walk) and `HiddenClassifyCtx` (hidden-rule classification: `inline`/`derivations`/`applyPromotedRules`/`hiddenChoicesWithNamedAliasMembers`) — both were pass-constant/pass-shared state for the same `link()` call. `externalRoles`/`derivations` are write-through accumulators, kept as plain mutable fields (mirroring `AssembleCtx.nodes`'s getter tradeoff). `ctx.rules` is honestly the RAW pre-resolve view (`Grammar<'evaluate'>`), never the `Rule<'link'>` resolve-loop accumulator — every read site inside `link.ts` that consults `ctx.rules` (the ALIAS-mint condition in `resolveRule`, `resolveSymbolRoleOrPass`'s legacy role detection, `mintContentAliasKinds`'s walk, `collectTopLevelAliasBodies`'s walk) genuinely needs the RAW view (finding ALIAS/dummy-role shapes the resolve loop has already collapsed); the post-resolve accumulator is threaded explicitly as a plain parameter everywhere it IS needed (e.g. `dereferenceTopLevelAliasBody`'s `resolvedRules` param), never read off the ctx.
- **`SubtypeCtx`** (`assemble.ts`): `{ rules, topLevelAliasBodies }` — the supertype-subtype resolution family: `resolveHiddenSubtypes(names, ctx, ownerName?)`, `includeAliasMemberKinds(subtypes, ctx, ownerName?)`, `isAliasMemberKind(rule, ctx, name, subtypeSet)`, `isCompatibleSubtypeMember(name, ctx, subtypeSet, seen)`. The unused `_aliasedHiddenKinds` parameter was dropped.
- **`AssembleCtx`** (`assemble.ts`, `BaseCtx<'simplify'>`): absorbs the former `SubtypeCtx`. Exposes both `rules` (`grammar.rules`, the `SimplifiedRule` phase product) and `normalizedRules` (`grammar.normalizedRules`, the wrapper-deleted `RenderRule` view) as separate getters — the hidden-body/subtype-resolution family (`resolveHiddenSubtypes` / `includeAliasMemberKinds` / `isAliasMemberKind` / `isCompatibleSubtypeMember` / `resolveHiddenRuleContent`) reads `normalizedRules` specifically, and **must not** be migrated to `rules`: verified empirically that `rules` (which has gone through simplify's SEQ-collapse, not just wrapper-deletion) unmasks an intentionally opaque multi-member SEQ into a dispatchable shape for python's `_simple_pattern_negative` (`SEQ[OPTIONAL('-'), CHOICE(integer, float)]` collapses to the bare inner `CHOICE`), corrupting the family's "unresolvable → keep the hidden name" fallback and silently dropping the polymorph-variant-adopted subtype entry from `_simple_pattern`'s dispatch. `normalizedRules` (wrapper-deletion only, no further structural canonicalization) is the only source where the family's opacity-via-shape fallback holds.
- Honest non-conforming leaves are utilities/comparators (`setsEqual`, `rulesEqualForVariant`, `nameVariant`, rename helpers, classify leaf predicates) and single-grammar-wide-arg passes (the `kindEntries` canonicalize trio — folding ONE arg into a fabricated ctx adds indirection without navigability gain).

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

### `emitters/transport-common.ts` — `classifySlot(kinds, supertypeMap)`
**Pattern:** Any multi-kind slot, classified against `buildSupertypeTransportSet(nodeMap)`.
**Action:** Requires an EXACT-SET match (slot kinds === supertype's full resolved subtype set), not a subset match. A proper-subset match would collapse the slot onto a wider supertype transport than it ranges over — for a large self-recursive supertype (e.g. rust's `match_arm` field being a 2-of-21 subset of `declaration_statement`, which transitively references `match_arm` again) the generated `FromNapiValue` would recurse through the whole statement graph and overflow the native stack. Subset slots fall through to `heterogeneous` (a per-slot enum of exactly their kinds) instead.
**Output:** `SlotClass` (`concrete` / `supertype` / `heterogeneous`).

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
