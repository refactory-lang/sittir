# `packages/codegen/src/types` — Function Glossary

Per-function reference for `packages/codegen/src/types/`, mechanically relocated from source
comments by `scripts/relocate-comments-to-glossary.mts` (mechanical pass —
unedited, unverified). A later pass reformats/verifies these entries and decides
what merges into docs/compiler-phase-glossary.md's phase narrative.

See [AGENTS.md § Wave-style decomposition before commits](../../AGENTS.md).

---


### `packages/codegen/src/types/diagnostics.ts::fail`

```text
/** Emit a blocking (fail) diagnostic. `canProceed` is forced to `false` —
	 *  a `'fail'` is blocking by definition, so the caller cannot supply it. */
```

### `packages/codegen/src/types/diagnostics.ts::all`

```text
/** Returns a shallow copy — callers cannot mutate the sink's backing array. */
```

### `packages/codegen/src/types/diagnostics.ts::hasBlocking`

```text
/** Returns true iff at least one item has severity === 'fail'. */
```

### `packages/codegen/src/types/parsekind-collisions.ts::kindKey`

```text
/**
 * Bucket / distinctness key for a kind: the stamped parser id when the
 * value carries one (collision-free identity), the name otherwise. The
 * two key spaces are prefixed so a numeric id can never be spelled by a
 * kind name.
 */
```

### `packages/codegen/src/types/rule.ts::isEnumChoiceRule`

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

### `packages/codegen/src/types/rule.ts::collectFieldNames`

```text
/**
 * Collect the set of field names referenced anywhere in a rule tree.
 * Returns names only — cheap one-pass walker with no AssembledField
 * allocation. Pre-assembly phases (classifier) that only need field-set equality call this
 * instead of constructing full AssembledField objects just to extract
 * names.
 */
```

```text
// ---------------------------------------------------------------------------
// Tree walkers — pure Rule-tree projections, no AssembledNode concepts
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/types/rule.ts::replaceAtPath`

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

```text
// ---------------------------------------------------------------
// Path-addressed rule rewriting
//
// Slash-separated positional paths (e.g. '1/1/0/1/3') used by
// `polymorphs:` / `transforms:` / `groups:` in grammar.sittir.ts. See
// docs/superpowers/specs/2026-05-15-024-assembled-group-synthesis-design.md
// for the path semantics.
// ---------------------------------------------------------------
```

### `packages/codegen/src/types/rule.ts::sym`

```text
/**
 * The one symbol reference constructor: `{ type: SYMBOL, name, inline:
 * name.startsWith('_') }`. A reference never carries `hidden` — that fact
 * is rule-level only, stamped on top-level rules by evaluate's
 * `canonicalizeRawGrammar`, never on a SYMBOL. `inline` here is the
 * name's leading-underscore convention alone; `canonicalizeRawGrammar`
 * later corrects it for inline-array entries and supertype names, and
 * forces `inline:false` on a symbol wrapped by an alias. Used wherever a
 * rule needs a plain reference built from a name rather than through the
 * DSL proxy: `createProxy`, `structuralBuilder.symbol`, pattern/external-ref
 * rewriting.
 */
```

### `packages/codegen/src/types/rule.ts::isIdentifierLike`

```text
/** Whether a string matches `/^[A-Za-z_]\w*$/` — a bare identifier, as
 *  opposed to arbitrary literal text. */
```

### `packages/codegen/src/types/runtime-shapes.ts::extractSymbolName`

```text
/**
 * Extract the symbol name from a value that might be a symbol reference
 * in any runtime shape. Tree-sitter CLI wraps `$` references as
 * nested objects; this unwraps to the name string if possible.
 */
```

#### body

```text
// Tree-sitter CLI: $.name → { symbol: { type: 'SYMBOL', name: '...' } }
```

### `packages/codegen/src/types/runtime-shapes.ts::isEnrichShapedFieldWrapper`

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

#### body

```text
// Shape 2: reserved `_kw_` prefix — enrich's exclusive namespace.
```

#### body

```text
/* Shape 1: NAME === SYM, or the supertype-stripped variant. Exact equality
	   is checked FIRST so a symbol whose own name ends in digits
	   (`field('foo2', $.foo2)`) is not misclassified by the suffix-strip
	   below. */
```

#### body

```text
/* Numbered-duplicate variant: enrich appends a digit run to the field
	   name when the same symbol occurs multiple times in one seq
	   (`expression1`, `expression2`) — strip the suffix and re-compare. */
```

### `packages/codegen/src/types/runtime-shapes.ts::isContainerType`

```text
/**
 * True for `SEQ` / `CHOICE` — rules with a `members: Rule[]` payload.
 */
```

### `packages/codegen/src/types/runtime-shapes.ts::isWrapperType`

```text
/**
 * True for single-content wrapper types — `OPTIONAL`, `REPEAT`,
 * `REPEAT1`, `FIELD`, plus the token-wrapper variants tree-sitter
 * uses internally.
 */
```

### `packages/codegen/src/types/runtime-shapes.ts::isPrecWrapper`

```text
/**
 * True for precedence wrappers — `PREC`, `PREC_LEFT`, `PREC_RIGHT`,
 * `PREC_DYNAMIC`. Sittir's runtime strips these (see
 * `evaluate.ts::prec`); tree-sitter preserves them. Path addressing
 * treats them as transparent.
 */
```

### `packages/codegen/src/types/runtime-shapes.ts::typeEq`

```text
/** True if `t` equals `upper` (both runtimes now agree on the discriminant case). */
```

### `packages/codegen/src/types/diagnostics.ts::GrammarDiagnostic`

```text
/** Static, author-facing facts about the authored grammar; subject is a Rule. */
```

### `packages/codegen/src/types/diagnostics.ts::CompilerDiagnostic`

```text
/** Emitted during the compile pipeline about a rule OR an assembled node. */
```

### `packages/codegen/src/types/diagnostics.ts::RuntimeDiagnostic`

```text
/** Render / read / parse execution. */
```

### `packages/codegen/src/types/diagnostics.ts::DiagnosticSink`

```text
/**
 * Accumulator for pipeline diagnostics. Passed through the compile chain;
 * the Assemble→Project gate (emit-gate.ts::assertEmittable) consults it.
 *
 * Sugar methods (fail/warn/info) map to the underlying severity values so
 * PR-H/PR-L callers can use the spec vocabulary while the Severity union
 * stays single-sourced here.
 *
 * hasBlocking() keys on severity === 'fail' — NOT on canProceed — so the
 * gate remains inert until PR-L (when real diagnostics start emitting 'fail').
 */
```

### `packages/codegen/src/types/diagnostics.ts::EmitHaltedError`

```text
/**
 * Thrown by assertEmittable() when the DiagnosticSink contains 'fail' items.
 * Mirrors GrammarDiagnosticError's message format (code: message per line).
 */
```

### `packages/codegen/src/types/ir.ts::ExternalRole`

```text
/** External-scanner role binding (indent / dedent / newline tokens). */
```

```text
/**
 * types/ir.ts — IR-level metadata types shared by the DSL and the compiler
 * (R11). Both sides import DOWN into this layer; neither imports the other.
 */
```

```text
/**
 * (R12/decision-7 V2 Task 2) `PolymorphVariant` — the wire-registered
 * `{parent, child}` pair type — is DELETED. Variant-adoption pairs are now
 * discovered structurally from the post-link rule tree
 * (`deriveStructuralVariantChildren`, compiler/variant-structural.ts)
 * instead of a metadata channel. This comment marks the historical
 * deletion site; do not resurrect the type.
 */
```

### `packages/codegen/src/types/parsekind-collisions.ts::parseKindId`

```text
/**
	 * Mint-time parser id of `parseKind` (PR-K3e). When present, bucket
	 * identity is the id, not the name — same-spelled parse kinds with
	 * different parser symbols (#129 class) land in different buckets.
	 * Absent for id-less pipelines (enrich runs pre-parser).
	 */
```

### `packages/codegen/src/types/parsekind-collisions.ts::storageKindId`

```text
/**
	 * Mint-time parser id of `storageKind` (PR-K3e). When present,
	 * storage-kind distinctness is decided by id: same-id values are the
	 * same runtime identity even under different names (hidden/visible
	 * twins), and differing ids still fall through to the structural
	 * signature for the merge-or-diagnose decision.
	 */
```

### `packages/codegen/src/types/rule-metadata-brand.ts::RuleMetadata`

```text
/**
 * Opaque provenance bag. Exposes NO readable properties to compiler code —
 * any attempt to read a fact off it directly (`rule.metadata.source`) is a
 * compile error. The only way to construct or read the real shape is through
 * `dsl/rule-metadata.ts`'s `makeRuleMetadata` / `readRuleMetadata`.
 */
```

### `packages/codegen/src/types/rule.ts::Multiplicity`

```text
/**
 * Per-rule cardinality + optionality tag. Mirrors NodeOrTerminal.multiplicity
 * (see compiler/node-map.ts) — same values, same semantic. When a rule is
 * pushed-down from a wrapper, this attribute records what the wrapper meant.
 *
 * - `'optional'`      → T | undefined            (from `optional(X)`)
 * - `'single'`        → T                        (default — no wrapper)
 * - `'array'`         → readonly T[]              (from `repeat(X)`)
 * - `'nonEmptyArray'` → NonEmptyArray<T>          (from `repeat1(X)`)
 */
```

### `packages/codegen/src/types/rule.ts::PhaseName`

```text
/**
 * Pipeline phase names, in pipeline order. `Rule<Phase>` is that phase's
 * OUTPUT view of the IR: which rule variants can still appear, and which
 * stamped attributes are readable. Properties appear monotonically as the
 * stamping phase runs; wrapper/reference variants disappear once consumed.
 *
 *   'evaluate' — raw post-evaluate: all variants incl. alias/token/wrappers.
 *   'link'     — references resolved (alias/token survive only defensively);
 *                separator strings lifted onto repeat nodes.
 *   'normalize' — wrapper-free (flattenRules ran): optional/field/
 *                 repeat/repeat1/alias/token GONE; their meaning lives in the
 *                 stamped leaf attributes (fieldName/multiplicity/separator/
 *                 aliasedTo). This is the RenderRule shape.
 *   'simplify'  — same structure as 'normalize' plus the universal
 *                 seq-of-leaves invariant (see SimplifiedRule brand).
 */
```

### `packages/codegen/src/types/rule.ts::NormalizedPhase`

```text
/** Phases whose views are wrapper-free (at-or-after wrapper-deletion). */
```

### `packages/codegen/src/types/rule.ts::WrapperPhase`

```text
/** Phases where modifier wrappers + reference nodes still exist. */
```

### `packages/codegen/src/types/rule.ts::AnyRule`

```text
/**
 * The any-phase view — the union of every phase's Rule union. Phase-agnostic
 * utilities (tree walkers, guards, the transform DSL) accept this; phase
 * modules pin the precise view (`Rule<'link'>`, `RenderRule`, …).
 */
```

### `packages/codegen/src/types/rule.ts::RuleBase`

```text
/**
 * Shared base every Rule type extends via the intersection on `Rule` below.
 *
 * - `id` is the existing identity tag.
 * - `fieldName` / `multiplicity` / `nonterminal` / `separator` are modifier
 *   attributes populated by enrich passes when a rule was originally wrapped
 *   by `field` / `optional` / `repeat` / `repeat1`. The wrapper continues
 *   to exist until PR3; these attributes are additive and let downstream
 *   consumers (the new template emitter, future consumers) read modifier
 *   facts directly from the inner rule.
 *
 * Vocabulary matches NodeOrTerminal (node-map.ts:117, 144) so values that
 * flow from rules to slots use identical field names. See
 * feedback_rule_slot_vocabulary_alignment.
 *
 * Per spec's universal-shape decision: NO `leading`/`trailing` `Rule[]` at
 * rule level. Flanking literals live as adjacent seq members. Separator
 * placement (`trailing`/`leading` booleans) lives NESTED inside the
 * structured `separator` object below (not as top-level siblings), so an
 * orphan trailing/leading-without-a-separator state is structurally
 * impossible.
 */
```

### `packages/codegen/src/types/rule.ts::inline`

```text
/**
	 * Per-ref inline decision. Stamped once, at evaluate, by
	 * `canonicalizeRawGrammar` (compiler/evaluate.ts):
	 * `inline = !supertype && (hidden || name in the grammar's inline array)`,
	 * with one override — a symbol wrapped by `structuralAlias`
	 * (`dsl/builders.ts`) or found under an ALIAS by `canonicalizeRawGrammar` is
	 * forced `inline:false`, because an alias confers a real visible CST kind
	 * that must materialize, not flatten. Link only ever CONSUMES this stamp
	 * (`resolveSymbolRoleOrPass`, `canonicalizeRuleLiterals`'s SYMBOL/SUPERTYPE
	 * cases, `rewriteRuleForStamp`) — it never re-derives inline-ness from the
	 * name. Normalize's `replaceSymbolRef` and `dsl/rule-transforms.ts`'s
	 * `inlineRefs` splice a reference only when `inline === true`, so an
	 * aliased reference always survives as its own node.
	 */
```

### `packages/codegen/src/types/rule.ts::hidden`

```text
/** Grammar-hidden fact: `name.startsWith('_')` for every top-level rule,
 *  stamped once at evaluate (`canonicalizeRawGrammar`) and never
 *  re-derived from the name downstream — `dsl/rule-patterns.ts`'s
 *  `isHiddenRule(name, rules)` reads this stamp. A rule-level fact only:
 *  never stamped on a SYMBOL reference (`sym`'s constructed reference
 *  carries `inline` alone), and it does not survive a splice — every
 *  inlining site (link's `inlineReferences`, normalize's
 *  `replaceSymbolRef`/`materializeInlinedBody`) drops the spliced-in
 *  body's own `hidden` before installing it at the occurrence site, since
 *  the stamp describes the SOURCE kind, not the host; flatten's
 *  `withKindFacts` re-carries the PRE-flatten rule's own `hidden` onto its
 *  flattened root, so a rule's OWN fact survives flattening even though a
 *  spliced-in body's does not. Link's `unhideAliasedTargets` flips a
 *  rule's `hidden` to `false` when some named alias wraps it (the parser
 *  now emits it as its own node, not folded into the alias); link's
 *  `stampLinkMintedVisibility` back-fills `hidden` (from the name) on any
 *  rule link minted that has no raw-grammar counterpart. */
```

### `packages/codegen/src/types/rule.ts::inlinedFrom`

```text
/** The occurrence-site name of a reference whose target rule's body was
 *  spliced into that position — the ref's own name, not the target's.
 *  Two producers stamp it: link's `inlineReferences` (every
 *  `inline === true` ref, fixed-point) and normalize's
 *  `spliceFoldableRefs`/`materializeInlinedBody` (a narrower single-pass
 *  fold of GROUP/multi-inline targets, guarded against array multiplicity
 *  and an already-assigned `fieldName`). Storage source of a slot's
 *  fallback name: `node-map.ts`'s `projectSlotNaming` falls back to
 *  `inlinedFrom` (leading underscores stripped) before falling back to
 *  `'content'`, and `collect-slots.ts`'s `inlinedFromSlotName` /
 *  `diagnostics/slot-grouping.ts`'s `isContentSlot` read the same stamp
 *  to exclude an inlined-body slot from content-slot grouping.
 *  `withKindFacts` (`dsl/rule-attrs.ts`) carries it forward whenever a
 *  later phase rebuilds the stamped rule's shape, so a splice survives
 *  flatten/normalize/simplify without re-deriving it.
 */
```

### `packages/codegen/src/types/rule.ts::absorbedIds`

```text
/** Ids of nodes this rule absorbed when simplify reduced them into it:
 *  a nested CHOICE spliced into its parent choice, a wrapper choice
 *  collapsed onto its single surviving member, or the other branches'
 *  members at a position `mergeBranchesForChoice` folds into one. Stamped
 *  by `dsl/rule-attrs.ts::absorbIds` and carried forward by ordinary
 *  spread like every other attribute. `collect-slots.ts::buildSlot` reads
 *  it to resolve a slot's `sourceRuleIds` against ids the simplified tree
 *  no longer holds a node for — the simplified tree carries every
 *  absorbed id itself, so no second derivation over another rule view is
 *  needed to find them.
 */
```

### `packages/codegen/src/types/rule.ts::kind`

```text
/** Reference-splice provenance: the name of the SYMBOL/subtype reference
 *  whose target content now occupies this position, stamped by link where it
 *  substitutes a reference for its target (`canonicalizeRuleLiterals`'s
 *  SYMBOL/SUPERTYPE cases inlining an `inline===true` reference to an
 *  alias-bodied hidden rule; `resolveSymbolRoleOrPass`'s external-role
 *  substitution; `dereferenceTopLevelAliasBody`). Flatten/normalize carry it
 *  from the pre-flatten rule onto the flattened root
 *  (`dsl/rule-attrs.ts::withKindFacts`). Absent when the rule was never the
 *  product of such a substitution. */
```

### `packages/codegen/src/types/rule.ts::metadata`

```text
/**
	 * Inert, OPAQUE provenance bag (debt PR-P1: `RuleMetadata` replaces the
	 * former structurally-typed `{ source?; inlinedFrom? }` shape). NEVER
	 * drives compiler behavior beyond path-descent lookup keying
	 * (`feedback_metadata_not_behavior`): structural facts decide
	 * folding/slotting. The real shape (`source` / `inlinedFrom` / the
	 * relocated `fieldSource` / `symbolSource` facts — see item 2 of debt
	 * PR-P1) and its construct/read accessors live in
	 * `dsl/rule-metadata.ts`, importable only by enrich, wire (incl. its
	 * transform machinery), and diagnostics-emission code. `types/` cannot
	 * import `dsl/` (layering: dsl → types ← compiler), so only the opaque
	 * brand type lives here — see `types/rule-metadata-brand.ts` for why the
	 * brand and the real shape are split across two files.
	 */
```

### `packages/codegen/src/types/rule.ts::splicedBody`

```text
/**
	 * Declared structural flag (debt PR-0c / doctrine decision 3's corollary):
	 * true when this `seq` is a hidden group's body SPLICED directly into a
	 * parent at what used to be an opaque `symbol(_x)` ref position
	 * (`compiler/normalize.ts`'s `materializeInlinedBody`, the fold-inline
	 * pass). Not provenance — it names a present-tense fact about the tree
	 * shape at this position ("this seq occupies a splice site"), set ONCE by
	 * the pass that performs the splice, read directly (no re-derivation, no
	 * stamp-then-reread through the opaque `metadata` bag). Consumed by
	 * `emitters/templates.ts`'s boundary walkers
	 * (`rightmostBoundary`/`leftmostBoundary`): a spliced seq must keep
	 * spacing like the opaque unit it replaced (`for await (`, not
	 * `for await(`) rather than exposing its own first/last literal at the
	 * outer boundary. Mirrors `inline`'s pattern (a per-ref declared
	 * construction stamp read directly off the rule) — see that field's doc
	 * comment above.
	 */
```

### `packages/codegen/src/types/rule.ts::variantArms`

```text
/**
	 * Declared structural fact (R12/decision-7 V2, doctrine decision 3's
	 * corollary): the variant-adoption CHOICE arms `classifyHiddenChoiceRule`
	 * (compiler/link.ts) ERASES when it flattens a hidden CHOICE into this
	 * `SupertypeRule`'s `subtypes: string[]`. Before the flatten, each
	 * qualifying arm is a bare ALIAS/SYMBOL ref that is alias-minted (no
	 * independent rule body elsewhere in the grammar — the same
	 * `isAliasMintedRef` test `compiler/variant-structural.ts`'s CHOICE-arm
	 * predicate uses, reapplied here at the exact moment the flatten
	 * destroys the linkage that predicate needs downstream). `variantArms`
	 * holds those arms' target kind names (the SAME name
	 * `collectSubtypeNames` records into `subtypes` for that arm — the
	 * hidden alias-mint name when present, else the visible name), in
	 * member order. Only ever set on a `SupertypeRule` produced by
	 * `classifyHiddenChoiceRule`; every other rule variant leaves it
	 * `undefined`. Not provenance — it names a present-tense fact about
	 * what this rule's pre-flatten CHOICE arms structurally were, stamped
	 * ONCE by the pass that performs the flatten, read directly (no
	 * re-derivation, no stamp-then-reread through the opaque `metadata`
	 * bag). Consumed by `compiler/assemble.ts`'s `variantChildKindsSet`
	 * construction in place of the former narrow wire-metadata read — see
	 * that call site's comment. Mirrors `splicedBody`'s pattern (a
	 * declared, once-stamped structural fact replacing a destroyed-then-
	 * reconstructed read) — see that field's doc comment above.
	 */
```

### `packages/codegen/src/types/rule.ts::separator`

```text
/** Single canonical separator fact (widened from the former 3-way
			 *  `string | Rule[] | {rules, trailing?, leading?}` union, PR-S).
			 *  `value` is a StringRule for the common literal case;
			 *  ChoiceRule/SeqRule for a rule-shaped separator. `trailing`/
			 *  `leading` are nested HERE (not top-level siblings) so an
			 *  orphan trailing/leading-without-a-separator state is
			 *  structurally impossible. The shape is `RuleSeparator<Rule<Phase>>`
			 *  — the same declaration RepeatRule<'link'> uses; `flatten`
			 *  rebuilds `value` through the builders like any rule position. */
```

### `packages/codegen/src/types/rule.ts::Rule`

```text
/**
 * Discriminated union of every Rule shape visible in the `Phase` view. Each
 * member intersects {@link RuleBase}, so the phase-gated modifier attributes
 * are reachable on every variant without an intersection here.
 *
 * The bare-`Rule` default is `'normalize'` — the most permissive
 * attribute-wise (all stamped leaf attributes readable) and the strictest
 * variant-wise (no wrappers, no alias/token). Pre-normalize modules annotate
 * `Rule<'evaluate'>` / `Rule<'link'>` explicitly; phase-agnostic utilities
 * take {@link AnyRule}.
 */
```

#### body

```text
// Structural grouping — Normalize restructures these
```

#### body

```text
// Named patterns — clean wrappers, no derived metadata
```

#### body

```text
// EnumRule is now ChoiceRule (PR-P): removed from union to avoid duplicate
```

#### body

```text
// TerminalRule removed (PR-P Task 2): terminals classify by shape at Assemble
```

#### body

```text
// Terminals
```

#### body

```text
// Structural whitespace
```

#### body

```text
// References — symbol refs persist through every phase (they are the
// cross-rule reference mechanism all the way to emit)
```

#### body

```text
// Bounded-lifetime nodes — each collapses to `never` outside its phase
// window (see the per-type conditionals): alias/token are consumed by
// Link (surviving into the 'link' view only defensively);
// optional/field/repeat/repeat1 are consumed by Normalize's
// flattenRules. None appear in the wrapper-free views.
```

### `packages/codegen/src/types/rule.ts::RenderRule`

```text
/**
 * A Rule shape produced by `flattenRules` in normalize.ts. Modifier
 * wrappers (`optional` / `field` / `repeat` / `repeat1`) have been pushed
 * down to leaf attributes; structural rules (`seq` / `choice` / `variant` /
 * `group`) are preserved.
 *
 * Structurally a `Rule` minus the wrapper variants. Carries a phantom
 * `__renderRule` marker for readability at call sites, but the marker is
 * optional and never written, so it provides no assignability protection —
 * `Rule<'normalize'>` values are still structurally assignable to
 * `RenderRule` without going through `flattenRules`.
 */
```

### `packages/codegen/src/types/rule.ts::SimplifiedRule`

```text
/**
 * A Rule shape produced by `computeSimplifiedRules` after PR2 wires
 * `canonicalizeSeqOfLeaves` and `assertUniversalShape` into the pipeline.
 *
 * Structurally a `RenderRule` (wrappers already pushed-down to leaf
 * attributes), additionally satisfying the universal seq-of-leaves
 * invariant: every branch/group/multi body is a `seq` /
 * `choice` / `repeat` / leaf-terminal (`enum` / `string` / `pattern`).
 *
 * Carries phantom `__renderRule` / `__simplifiedRule` markers for
 * readability at call sites, but both are optional and never written, so
 * they provide no assignability protection — `RenderRule` and
 * `SimplifiedRule` are mutually assignable (both resolve to the same
 * `NormalizedPhase` shape) despite the distinct brand names.
 */
```

### `packages/codegen/src/types/rule.ts::SeparatorFlankMode`

```text
/**
 * A separator flank's (`leading`/`trailing`) presence state: `'mandatory'`
 * — always present, no per-instance variability, compile-time renderable
 * exactly like `'none'` (absence, i.e. the field itself is `undefined`) —
 * or `'optional'`, the only state with genuine per-instance variability
 * requiring runtime capture. `'mandatory'` and `'none'` are identical from
 * a wire/storage and construct-surface point of view (neither needs a
 * runtime field or factory option) — they differ only at render time
 * (always-emit vs. never-emit).
 */
```

### `packages/codegen/src/types/rule.ts::separator`

```text
/** `RuleSeparator<Rule<'link'>>` — the one separator shape, one
			 *  phase earlier; `flatten` rebuilds its `value` and keeps the
			 *  placement flags. */
```

### `packages/codegen/src/types/rule.ts::separator`

```text
/** Evaluate-phase separators are always literal strings,
				 *  reconstructed fresh by link's lift — not carried through, so
				 *  this stays the original sibling shape (unchanged by PR-S). */
```

### `packages/codegen/src/types/rule.ts::separator`

```text
/** `RuleSeparator<Rule<'link'>>` — the one separator shape, one
			 *  phase earlier; `flatten` rebuilds its `value` and keeps the
			 *  placement flags. */
```

### `packages/codegen/src/types/rule.ts::separator`

```text
/** Evaluate-phase separators are always literal strings,
				 *  reconstructed fresh by link's lift — not carried through, so
				 *  this stays the original sibling shape (unchanged by PR-S). */
```

### `packages/codegen/src/types/rule.ts::RuleSeparator`

```text
/** The separator fact, parameterized by the rule it holds rather than by
 *  phase: `{ value, trailing?, leading?, terminated? }` is the same shape
 *  on RepeatRule<'link'> and on RuleBase<'normalize'>, and declaring it
 *  once keeps that a fact instead of a coincidence. Parameterized by the
 *  rule (not the phase) so TypeScript compares two phases' separators
 *  structurally through their rules, as it does for every other rule
 *  position. */
```

### `packages/codegen/src/types/rule.ts::FieldRule`

```text
/**
 * (debt PR-P1, item 2) The former top-level `source?: 'grammar' | 'override' |
 * 'enriched' | 'inferred'` field is DELETED. The fact relocated into
 * `RuleBase.metadata` as `fieldSource` (`dsl/rule-metadata.ts`'s
 * `RuleMetadataShape.fieldSource`) — write via `makeRuleMetadata`, read via
 * `readRuleMetadata` (dsl/enrich/wire/diagnostics only). The `'inferred'` arm
 * was dropped entirely: confirmed zero production writer
 * (lingering-debt-inventory-research.md §2.6) — only `compiler/collect-slots.ts`
 * wrote it, and that was the unrelated SLOT-level `AssembledNonterminal.source`,
 * not this field.
 */
```

```text
// ---------------------------------------------------------------------------
// Named patterns
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/types/rule.ts::blockBearer`

```text
/**
			 * True if the field's value is rendered as an indented block — its
			 * content resolves (through symbol refs) to a subtree containing an
			 * `indent` Rule node. The template walker prefixes `\n  ` to the
			 * field slot so `class X:$BODY` renders as `class X:\n  $BODY`.
			 * Set by Link's `annotateBlockBearerFields` pass.
			 */
```

### `packages/codegen/src/types/rule.ts::_needsContent`

```text
/**
			 * Internal marker used by Evaluate's `transform()` DSL: a `field()`
			 * call with no content is a placeholder patch that takes its content
			 * from the original rule at patch-resolve time. Never survives past
			 * `resolvePatch` — if this shows up anywhere else, it's a bug.
			 */
```

### `packages/codegen/src/types/rule.ts::EnumRule`

```text
/**
 * EnumRule — a normalized choice-of-strings.
 *
 * PR-P: EnumRule is now a type alias for ChoiceRule. The ENUM discriminant
 * is retired; enum-ness is detected structurally via isEnumChoiceRule().
 * Shape-compatible with ChoiceRule (both expose `members`); every member
 * is a StringRule. The provenance moves to `metadata.author`/`metadata.classifiedBy`
 * (debt: source-homonym resolution, decision 6).
 */
```

```text
/**
 * (debt: source-homonym resolution, decision 6) `RuleSource` ('grammar' |
 * 'promoted' | 'override') is DELETED. It wore two different facts under
 * one name: WHO authored a rule's text (grammar / override — now
 * `RuleMetadataShape.author`, which also covers 'enrich' and 'evaluate'),
 * and WHETHER a classification was declared or inferred by link's
 * structural classifier (the former 'promoted' value — now
 * `RuleMetadataShape.classifiedBy: 'grammar' | 'link'`, a separate axis,
 * not an authorship fact). See `dsl/rule-metadata.ts`.
 */
```

### `packages/codegen/src/types/rule.ts::SupertypeRule`

```text
/**
 * (debt PR-P1, item 3) `source` moved off this type into `metadata.source`
 * (`dsl/rule-metadata.ts`). Audited: no downstream consumer (assemble.ts,
 * emitters) reads `SupertypeRule.source` as a structural discriminant — the
 * only prior reader was link.ts's own stamp-then-reread
 * (`classifyAndLogHiddenRules`), converted to return-value dataflow (see
 * `classifyHiddenChoiceRule`'s new return shape). Unlike
 * `PolymorphVariantDescriptor.definedBy` (polymorph-variant.ts — a genuine
 * structural discriminant of a tagged union, renamed from `source` per
 * decision 7 cleanup b), this was pure carried provenance with no
 * structural role.
 */
```

```text
/**
 * Normalize a closed literal set to the canonical rule shape.
 *
 * (debt PR-P1) Relocated to `dsl/rule-metadata.ts` — it constructs the
 * `metadata.source` bag, and `types/` cannot import the dsl-owned
 * `makeRuleMetadata` write seam (layering: dsl → types ← compiler). See that
 * module for the implementation; re-exported here is NOT done deliberately —
 * callers (compiler/link.ts, compiler/evaluate.ts) already import from
 * `dsl/`, so they import `normalizeEnumMembers` from its new home directly.
 */
```

### `packages/codegen/src/types/rule.ts::subtypeParseNames`

```text
/**
	 * Storage→parse name pairs for the aliased arms of the flattened CHOICE,
	 * stamped by `classifyHiddenChoiceRule` (compiler/link.ts) at the moment
	 * the flatten erases them — the same declared-fact pattern as
	 * `RuleBase.variantArms`. Keys are `subtypes` entries (the STORAGE kind —
	 * `SymbolRule.name`, the rule whose body/slots/template model the
	 * arm); values are the PARSE names (`SymbolRule.aliasedTo`, the visible label tree-sitter emits at
	 * that arm's position, carrying its own `alias_sym_*` runtime symbol id).
	 * Consumed by node-map's supertype value derivation (`parseKindId` stamps)
	 * and the supertype transport-enum emitter (accepted dispatch ids) so
	 * runtime nodes arriving under the alias occurrence's id — enrich-minted
	 * arms like `alias($._expression_except_range, $.expression_group1)` —
	 * route to the storage kind's variant instead of failing as unknown.
	 * Absent when no arm is aliased (the common case).
	 */
```

### `packages/codegen/src/types/rule.ts::TransitiveSubtypeRef`

```text
One transitively-reachable subtype: its storage (render/source) identity
alongside its parse (`$type`) identity — the same two-sided reference shape
`compiler/model/node-map.ts`'s `NodeOrTerminal` uses for `.node`/`.parseKind`
plus `.storageKindId`/`.parseKindId`. Kept as this narrower pair here (not
`NodeOrTerminal` itself) because `types/` sits below `compiler/` in the
module layering and cannot import it; model-layer callers
(`compiler/supertype-closure.ts::stampSupertypeClosures`) build real
`NodeOrTerminal` entries from this where needed.
```

```text
// Narrower pair than `NodeOrTerminal` because `types/` sits below `compiler/`
// in the module layering and cannot import it — see glossary.
```

### `packages/codegen/src/types/rule.ts::transitiveParseKinds`

```text
Transitive parse-kind closure of a supertype's subtypes — recurses through
nested supertypes (e.g. python's `expression → primary_expression →
parenthesized_expression`) via `lookup`, so callers only supply how to
resolve a name to its `SupertypeRule` in whatever raw-rule representation
they hold (a rule bag pre-hydration; NOT a hydrated `NodeMap` — see
`compiler/model/node-map.ts::existingSupertypeClosureOf`, the pre-hydration
caller, and contrast with `compiler/supertype-closure.ts::stampSupertypeClosures`,
which walks the assemble-time-resolved `AssembledSupertype.subtypes` instead
and does NOT call this helper — `AssembledSupertype`'s own doc comment
explains why the two representations diverge and can't share one walk).
Keyed by parse name (what `$type` reports); values carry stamped ids, never
re-derived by name downstream.

Two-pass per supertype, matching declaration order: pass 1 records every
ALIASED arm's parse (display) identity unconditionally, regardless of
whether its storage side is itself a nested supertype; pass 2 recurses into
each subtype's own storage identity — a nested supertype expands to its
leaves only (never its own name), a plain leaf (aliased or not) lands in the
output under its bare storage name. Splitting into two passes (rather than
one pass per subtype) mirrors the order the previous implementation
(deleted `emitters/factory-map.ts::expandRuntimeDiscriminatorKinds` +
`pushAliasMintedArmParseNames`) produced — verified by diffing all 3
grammars' regenerated `wrap.ts` byte-for-byte against pre-refactor HEAD.
```

```text
// See glossary — full contract.
```

#### body

```text
// Pass 1: every ALIASED arm's parse (display) identity is reachable
// here regardless of whether its storage side is itself a nested
// supertype — in declaration order, before any recursion below.
```

#### body

```text
// Pass 2: recurse into every subtype's OWN storage identity, in
// declaration order — a nested supertype expands to its leaves
// (never its own name); a plain leaf (aliased or not) lands in the
// output under its bare storage name.
```

### `packages/codegen/src/types/rule.ts::SymbolRule`

```text
/**
 * (debt PR-P1, item 2) The former top-level `source?: 'grammar' | 'link' |
 * 'group-lift'` field is DELETED. The fact relocated into `RuleBase.metadata`
 * as `symbolSource` (`dsl/rule-metadata.ts`'s `RuleMetadataShape.symbolSource`).
 * The one behavior-driving reader (`emitters/templates.ts`'s `emitSymbol` /
 * `assertSlotPreservation`, keying on `'link'` to inline a literal instead of
 * emitting a slot reference) now reads the STRUCTURAL `literal` field
 * (present iff link synthesized the ref from a string token) instead —
 * see templates.ts.
 */
```

```text
// ---------------------------------------------------------------------------
// References. Symbol refs persist through EVERY phase (wrapper-deletion
// stamps fieldName/multiplicity/separator onto them as leaves — that is the
// core of the RenderRule design). alias/token are consumed by Link and only
// exist in the WrapperPhase views.
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/types/rule.ts::literal`

```text
/** Original literal text when Link synthesized this ref from a string token. */
```

### `packages/codegen/src/types/rule.ts::aliasedTo`

```text
/**
	 * Alias provenance: `name`/`kindId` are the SOURCE (storage) kind — the
	 * rule whose shape the parse tree body follows; `aliasedTo` is the alias
	 * NAME, the parse kind tree-sitter's display tree labels the node with
	 * (the wire `$type`). Stamped by `dsl/builders.ts::attributeAlias` at
	 * wrapper-deletion for any content the `alias()` wrapper wraps, and by
	 * link's `collectSubtypeRefs`/`classifyHiddenChoiceRule` when a supertype
	 * or enum arm folds an ALIAS member into a `SymbolRule`. Preserved to feed
	 * the display-name -> storage-kind pairs (`subtypeRestampPairsOf`,
	 * `resolveSlotAliasPairs` -> node model `fieldAliasMap`) that the
	 * corpus validators use to normalize display names.
	 */
```

### `packages/codegen/src/types/runtime-shapes.ts::metadata`

```text
/** Opaque (debt PR-P1): the former `source?: string` provenance tag is
	 *  gone — `dsl/primitives/field.ts` now stamps `metadata.fieldSource`
	 *  instead (via `dsl/rule-metadata.ts`'s `makeRuleMetadata`). Untyped
	 *  here since `types/` cannot import the opaque brand's dsl-owned
	 *  constructor; writers cast through `unknown`. */
```

### `packages/codegen/src/types/rule.ts::isLinkSymbol`

```text
/**
 * (debt PR-P1) Was `r.type === SYMBOL && r.source === 'link'`; `SymbolRule.source`
 * is deleted (relocated to `metadata.symbolSource`, dsl-owned + opaque). `literal`
 * is set ONLY by `compiler/link.ts`'s `canonicalizeRuleLiterals` — the same
 * (now-sole) writer that used to also stamp `source: 'link'` — so checking
 * `literal !== undefined` directly is the exact same condition structurally,
 * not a re-derivation: the one write site produced both facts together.
 */
```

### `packages/codegen/src/types/runtime-shapes.ts::isPlainRepeatType`

```text
/** Plain repeat (zero-or-more). Excludes repeat1. Callers that need
 *  either should use {@link isRepeatType}. */
```

### `packages/codegen/src/types/runtime-shapes.ts::isRepeatType`

```text
/** Either repeat variant — true for both `repeat` and `repeat1`. */
```

### `packages/codegen/src/types/diagnostics.ts::Severity`

`'fail'` is reserved for the Assemble→Project gate in `emit-gate.ts`. No
emitter produces it today; the `'error'` / `'warning'` vocabulary plus the
`canProceed` blocking signal carry all current blocking behaviour.

### `packages/codegen/src/types/parsekind-collisions.ts::ParseKindCollisionDiagnostic.severity`

`diagnoseParseKindCollisions` always produces `'error'`, but the field is
widened to the full `Severity` so a caller — `applyUnaliasDistinct` in
`dsl/enrich.ts` — can DOWNGRADE the diagnostic when it auto-fixes the collision
instead of merely reporting it. The shape is otherwise identical, so this stays
one type rather than a second near-duplicate interface.

### Per-type discriminators (`packages/codegen/src/types/runtime-shapes.ts`)

`typeEq` and the `isXType` family are plain equality checks — both runtimes
agree on UPPERCASE discriminants, so there is no case ambiguity left to
absorb. They are consolidated here rather than written inline as `t === 'SEQ'`
per call site because callers frequently hold a `t: unknown` and want a typed
narrowing guard.

### `packages/codegen/src/types/rule.ts::resolvedKindId`

```text
/** Parser-issued anon-token kindId for `value` — stamped once at link
 *  (`canonicalizeRuleLiterals`); the fact prepared for downstream phases to
 *  read instead of re-resolving the literal against the catalog (the
 *  consumer-side migration is a separate, later change). */
```

### `packages/codegen/src/types/rule.ts::resolvedKindId`

```text
/** Stamped at link for fixed-literal patterns only — see StringRule. */
```

### `packages/codegen/src/types/rule.ts::kindId`

```text
/** Parser-issued kindId of this occurrence's own name — stamped once at
 *  link (`canonicalizeRuleLiterals`). Absent = `name` has no parser symbol
 *  (phantom / inline / vaporized). */
```

### `packages/codegen/src/types/rule.ts::aliasedToId`

```text
/** Parser-issued kindId of `aliasedTo`'s own occurrence, present ONLY when
 *  `aliasedTo` is set. Stamped at wrapper-deletion by `attributeAlias`
 *  (from the alias target's `kindId`), and by link's `stampAliasTargetId`
 *  for a subtype symbol whose `aliasedTo` was set without a matching id —
 *  a catalog lookup by `aliasedTo` name, never a fallback onto `kindId`
 *  (that fallback is a consumer's job: `aliasedToId ?? kindId` for whoever
 *  needs the effective parse identity). */
```

### `packages/codegen/src/types/rule.ts::AliasRule.kindId`

```text
/** Parser-issued kindId of the ALIAS node's own occurrence (the alias
 *  NAME's mint), stamped by link's `canonicalizeRuleLiterals` ALIAS case —
 *  resolved by `rule.value` (the alias name), never by the wrapped
 *  content's identity. A missing entry (or an anonymous one) is reported
 *  as the `alias-target-unminted` diagnostic via
 *  `KindIdStampMisses.aliasTargets`. */
```

### `packages/codegen/src/types/runtime-shapes.ts::module`

```text
/**
 * dsl/runtime-shapes.ts — cross-runtime rule shape utilities.
 *
 * **Scope: DSL layer only.** The predicates here are dual-RUNTIME aware
 * because DSL code runs under two different runtimes:
 *
 *   1. **Sittir runtime** — `evaluate.ts` injects `grammarFn` as the
 *      global `grammar()`. Rules use sittir's `Rule` union in
 *      `compiler/rule.ts` (UPPERCASE type discriminators, matching
 *      tree-sitter's own — see decision item 2 in
 *      `docs/superpowers/specs/2026-07-02-rule-type-model-ssot-research.md`).
 *
 *   2. **Tree-sitter CLI runtime** — the transpiled `.sittir/grammar.js`
 *      is loaded by tree-sitter's parser generator. Rules use
 *      tree-sitter-cli's own `dsl.d.ts` natives — same UPPERCASE
 *      discriminators, but different SHAPES for some nodes (nested `$`
 *      refs, `PREC_LEFT` carrying `value`, `optional` lowered to
 *      `CHOICE(x, BLANK)`, etc. — see the SSOT research doc §0's
 *      divergence table).
 *
 * DSL helpers (`transform`, `applyPath`, `enrich`, `field`, `alias`,
 * `role`) run in both runtimes, so they must accept both shapes. The
 * case split that used to motivate `typeEq`'s lower/upper ladders is
 * GONE (both runtimes now agree on UPPERCASE) — what remains here is
 * SHAPE normalization: symbol refs sometimes nested (`{symbol:{...}}`),
 * FIELD `content` typed as `unknown` rather than `Rule`, etc. Consolidate
 * those predicates + type guards here rather than scattering per-file
 * shape checks.
 *
 * **Do NOT import from here in `compiler/` or `validate/`.** Code past
 * the evaluate.ts boundary operates on the sittir-internal `Rule` union
 * exclusively. Use the `isSeq` / `isChoice` / etc. guards in
 * `compiler/rule.ts` instead. Importing this module from `compiler/` is
 * a cross-pipeline-leak signal (see MEMORY.md
 * `feedback_rule_case_as_origin_signal`).
 */
```

```text
/**
 * The honest return/input type for DSL functions that accept or
 * produce rules without knowing which runtime they're running in.
 *
 * Broader than sittir's `Rule` union: any object with a string
 * `type` discriminator is a `RuntimeRule`. Consumers that need to
 * access runtime-specific fields (`members`, `content`, `name`,
 * ...) must narrow via the guards in this module (`isContainerType`,
 * `isWrapperType`, `isPrecWrapper`, `isFieldLike`, `isSymbolLike`)
 * or by pattern-matching on `type` literals.
 *
 * Why a supertype rather than a precise union? Both runtimes agree on
 * UPPERCASE type discriminators, but their SHAPES diverge for some nodes:
 * nested `$` symbol refs, `PREC_LEFT` carrying `value` as `number` (sittir's
 * `prec()` strips the wrapper entirely — see `evaluate.ts::prec` — so a
 * PREC-shaped rule only ever appears via the tree-sitter CLI runtime),
 * `content: unknown` rather than `Rule`, `optional` lowered to
 * `CHOICE(x, BLANK)`, etc. (see this file's header, and the SSOT research
 * doc §0's divergence table). Typing `transform()` as returning `Rule` would
 * lie to consumers about these shape differences; typing it as
 * `RuntimeRule` forces an honest narrowing at every inspection point.
 *
 * Intentionally shape-minimal (no index signature) so sittir's Rule
 * interfaces — which don't declare `[k: string]: unknown` — are
 * structurally assignable via the `type` field alone. Consumers cast
 * at property-access sites (e.g. `(r as SeqRule).members`).
 */
```

### `packages/codegen/src/types/diagnostics.ts::module`

```text
/**
 * Unified diagnostics model for sittir codegen.
 *
 * One base `Diagnostic` + three scope-discriminated subtypes:
 *   - GrammarDiagnostic<TRule>     — static, author-facing facts about the grammar
 *   - CompilerDiagnostic<TSubject> — pipeline-phase issues (rule or node)
 *   - RuntimeDiagnostic            — render/read/parse execution
 * `scope` is the discriminant; `ruleId` is the stable back-pointer; `subject`
 * is an optional typed escape hatch.
 *
 * NOTE: NodeData is a generated per-grammar type (emitted by emitters/types.ts),
 * not statically importable into the compiler. TSubject defaults to `Rule | unknown`
 * as the documented fallback. Callers with concrete node data may specialize
 * the generic (e.g. CompilerDiagnostic<MyNodeData>).
 */
```

### `packages/codegen/src/types/rule-types.ts::SEQ`

```text
/**
 * compiler/rule-types.ts — Rule discriminant tag constants (SLATED FOR REMOVAL).
 *
 * Each constant is exactly its tag value (`SEQ === 'SEQ'`). The `Rule`
 * union in `rule.ts` derives its `type` fields from these via `typeof SEQ`.
 * (UPPERCASE since debt PR-U — sittir's IR adopted tree-sitter's discriminant
 * case; see `docs/superpowers/specs/2026-07-02-rule-type-model-ssot-research.md`
 * DECISIONS item 2.)
 *
 * DEPRECATED: this const-string layer violates `AGENTS.md` §"Rule type
 * discrimination" — the `Rule` union is meant to be the single source of truth,
 * with inline `rule.type === 'SEQ'` literals (type-safe via discriminated-union
 * narrowing) and the per-variant guards (`isSeq`, ...) in `rule.ts`. This layer
 * adds no errors over the union itself and is a second vocabulary that can drift.
 *
 * It is kept ONLY to avoid a ~5.8k-site / ~70-file codemod inside a feature
 * branch (the file is shared with PR-N). Removal is tracked as a dedicated
 * follow-up: `docs/superpowers/plans/2026-06-05-rule-type-consts-codemod.md`.
 * Do NOT add new imports of these constants — use `rule.type` literals/guards.
 */
```

### `packages/codegen/src/types/rule-metadata-brand.ts::RULE_METADATA_BRAND`

```text
/**
 * types/rule-metadata-brand.ts — the OPAQUE type for `RuleBase.metadata`.
 *
 * Layering note (debt PR-P1): `types/` cannot import from `dsl/` (dsl → types
 * ← compiler is the acyclic dependency shape; see docs/compiler-phase-glossary.md
 * "Rule IR" §R11). But `RuleBase.metadata` (types/rule.ts) needs a TYPE here so
 * every phase-gated Rule shape can carry it, while the real provenance shape and
 * its construct/read accessors must live in `dsl/rule-metadata.ts` (only dsl-side
 * code — enrich, wire, diagnostics — is a sanctioned reader of the real shape).
 *
 * This file holds ONLY the brand: a nominal type with no structural properties.
 * `dsl/rule-metadata.ts` imports this brand type and casts through it internally
 * to implement `makeRuleMetadata` / `readRuleMetadata`. Nothing in `types/` or
 * `compiler/` may cast through the brand directly — that would defeat the
 * opacity contract (`feedback_metadata_not_behavior` / decision 3 in
 * docs/superpowers/specs/2026-07-02-rule-type-model-ssot-research.md).
 */
```

### `packages/codegen/src/types/rule.ts::RuleId`

```text
/**
 * compiler/rule.ts — Shared IR
 *
 * One type throughout the pipeline. Defined once, never extended.
 * Rule type presence varies by phase:
 *   - After Evaluate: symbol, alias, token, repeat1 present
 *   - After Link: symbol, alias, token gone; group, indent/dedent/newline added.
 *     `repeat1` is preserved so downstream field/child derivation can stamp the
 *     `nonEmpty` flag on the resulting slot for emitter tuple-type rendering.
 *   - After Normalize: variant added; structural grouping may be restructured
 *
 * @generated — do not add derived metadata (required, multiple, contentTypes, etc.)
 *              Those are derived from tree context at Assemble time.
 */
```

```text
// tokenToName is defined locally below to avoid a circular import with
// compiler/link.ts (which imports helpers from this file). A small map
// covering the common non-word optionals (`!`, `?`) is enough; bail to
// null for anything else and the caller falls back to existing behavior.
```

```text
// ---------------------------------------------------------------------------
// Rule — the shared intermediate representation
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/types/rule.ts::RuleBase.tokenized`

```text
/**
	 * Lexical token facts — normalize-phase only, like every other attribute
	 * a wrapper turns into. A `token(...)` / `token.immediate(...)` wrapper
	 * survives link as a TokenRule (immediacy on the wrapper's own
	 * `immediate` field); `flatten` consumes it through
	 * `attributeBuilder.token` / `token.immediate`, which stamp these on the
	 * leaf that replaces it. A wrapper-phase rule never carries them.
	 * `tokenized` — this subtree lexes as ONE token. `immediate` — the
	 * grammar forbids whitespace before this token (`token.immediate`, or
	 * a declared-immediate external): its rendered text must never receive
	 * a seam space.
	 */
```

### `packages/codegen/src/types/rule.ts::RuleBase.fieldName`

```text
// All stamped attributes below are populated by
// `flattenRules` (Normalize) — the structured `separator`
// object included: `flatten` rebuilds the separator's own `value`
// bottom-up (`withSeparator`) and keeps the placement flags
// (`trailing` / `leading` / `terminated`) as the repeat wrapper
// carried them. None of them exist on evaluate/link views'
// RuleBase (they exist on the repeat/repeat1 wrapper nodes
// themselves pre-flatten).
```

### `packages/codegen/src/types/rule.ts::RuleBase.separator.terminated`

```text
// Comma-TERMINATED list family (`(x sep)+ x?`): every element
// trails its own separator, so a single element REQUIRES the
// trailing delimiter (rust `(1,)` vs parenthesized `(1)`).
```

### `packages/codegen/src/types/rule.ts::RuleBase.optionalElement`

```text
// The deleted wrapper was an optional at the ELEMENT POSITION of a
// separated repeat: individual list positions may be blank (array
// elision, `[a, , b]`). Storage for such a slot is
// `Array<X | undefined>` — a hole is a real position holding no
// element, distinct from absence of the position.
```

### `packages/codegen/src/types/rule.ts::RuleBase.prec`

```text
// Precedence vocabulary stamped by the `prec` rule builder. Link
// still consumes PREC/PREC_LEFT/PREC_RIGHT/PREC_DYNAMIC wrapper
// nodes directly this step, so this attribute is reachable on the
// normalized view but not yet populated by the pipeline.
```

### `packages/codegen/src/types/rule.ts::SeqRule`

```text
// ---------------------------------------------------------------------------
// Structural grouping
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/types/rule.ts::RepeatRule.separator.terminated`

```text
/** See RuleBase.separator — comma-terminated list family. */
```

### `packages/codegen/src/types/rule.ts::Repeat1Rule.separator.terminated`

```text
/** See RuleBase.separator — comma-terminated list family. */
```

### `packages/codegen/src/types/rule.ts::SupertypeRule.subtypes`

```text
// Each subtype is a real SymbolRule reference (or, for a bare STRING
// choice arm with no natural symbol, one synthesized from its catalog
// entry) — never a name string. This is the same convention every other
// rule-tree reference to another kind uses (SeqRule/ChoiceRule members),
// so subtype kindId/aliasedToId stamp inline on the ref itself
// (`kindId`, `aliasedTo`, `aliasedToId`) instead of a parallel
// name-keyed table — `name` is the storage kind, `aliasedTo` the parse kind.
```

### `packages/codegen/src/types/rule.ts::subtypeParseNamesOf`

```text
/**
 * Storage→parse name pairs for the aliased arms of a supertype's subtypes —
 * projected on demand from `SupertypeRule.subtypes` (single source of truth;
 * replaces the former separately-stored `subtypeParseNames` field).
 */
```

### `packages/codegen/src/types/rule.ts::aliasRestampRequired`

```text
/**
 * Whether an aliased reference's display (parse) name genuinely diverges
 * from its storage kind. tree-sitter merges a hidden rule that is referenced
 * ONLY through a single alias name into the alias symbol at generate time —
 * one parser id serves both spellings, the wire `$type` already IS the
 * storage kind, and a normalization pair would remap a node to itself.
 * Distinct stamped ids mean the parser kept two symbols (the alias is not
 * globally 1:1 with its source rule), so the display name genuinely differs
 * from the storage kind. Missing ids keep the pair — the merge cannot be
 * proven from an absent stamp.
 */
```

### `packages/codegen/src/types/rule.ts::subtypeRestampPairsOf`

```text
/**
 * `subtypeParseNamesOf` narrowed to the arms whose display (parse) name
 * genuinely differs from the storage kind on the wire (see
 * {@link aliasRestampRequired}), as `[parseName, storageName]` pairs.
 * Serialized into the node model's `fieldAliasMap` and consumed by the
 * corpus validators (`validate/factory-render-parse.ts`, `validate/from.ts`)
 * to normalize display names against storage kinds; the wire `$type` itself
 * is the grammar symbol stamped by the native read and needs no restamp.
 */
```

### `packages/codegen/src/types/rule.ts::StringRule`

```text
// ---------------------------------------------------------------------------
// Terminals
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/types/rule.ts::IndentRule`

```text
// ---------------------------------------------------------------------------
// Structural whitespace
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/types/rule.ts::ImmediateTokenRule`

```text
// ImmediateTokenRule exists ONLY within the 'evaluate' phase view.
// `token.immediate()` constructs this real IMMEDIATE_TOKEN-tagged node
// (matching tree-sitter's own dsl.js shape, and grammar-shapes/grammar-json.ts's
// existing `ImmediateTokenRule` model of it) instead of folding straight into
// `TokenRule`'s `immediate: true` — so a dedup/equality check running during
// enrich (e.g. dsl/rule-patterns.ts's `rulesEqual`, which dispatches purely on
// `type`) sees the SAME distinct tag under both runtimes, matching tree-sitter's
// CLI-runtime `token.immediate()` which was never foldable to sittir's shape in
// the first place. `grammarFn`'s `normalizeImmediateTokens` folds every
// remaining IMMEDIATE_TOKEN into `TokenRule` + `immediate: true` once enrich's
// decisions are locked in, matching what the compiler pipeline (Link onward)
// already expects — see docs/glossary/compiler-model.md's `NodeRef.immediate`.
```

### `packages/codegen/src/types/rule.ts::PrecRule`

```text
// Prec*Rule exist ONLY within the 'evaluate' phase view. `prec`/`prec.left`/
// `prec.right`/`prec.dynamic` construct these (mirroring the PREC/PREC_LEFT/
// PREC_RIGHT/PREC_DYNAMIC shape `grammar-shapes/grammar-json.ts` already
// models for tree-sitter's own dsl.js prec, and that `isPrecWrapper`
// — types/runtime-shapes.ts — already recognizes) so a choice arm's
// precedence wrapping is visible to enrich's minting decisions under BOTH
// runtimes identically. `enrich`'s existing `applyClauseHoist` already
// descends through this exact shape and threads `ambientPrec` — that path
// was previously dead on sittir's own runtime because sittir's `prec` never
// produced a shape it could match. Downstream phases (Link onward) never see
// these — every remaining Prec*Rule collapses back to its content once
// enrich's minting pass completes.
```

### `packages/codegen/src/types/rule.ts::isSeq`

```text
// ---------------------------------------------------------------------------
// Per-variant type guards
//
// Prefer these over inline `r.type === 'SEQ'` checks in `.filter()`,
// `.find()`, `.some()`, `.every()`, and standalone predicates — they
// narrow the rule type through the callback (no `as SeqRule` casts
// downstream). Inside a `switch (rule.type)` stay with literal case
// arms so TS exhaustiveness checking catches missing variants when
// new Rule types are added.
// ---------------------------------------------------------------------------
```

```text
// Phase-generic: each guard narrows WITHIN the caller's phase view (for a
// view where the variant cannot exist — e.g. isOptional on Rule<'normalize'>
// — the narrowed type is `never`, surfacing the dead check at compile time).
```

### `packages/codegen/src/types/rule.ts::isString`

```text
// isTerminal removed (PR-P Task 2): TerminalRule deleted; terminals classify by shape
```

### `packages/codegen/src/types/rule.ts::SymbolRef`

```text
// ---------------------------------------------------------------------------
// Reference graph
// ---------------------------------------------------------------------------
```

### `packages/codegen/src/types/rule.ts::SymbolRef.position`

```text
// Link adds: index within parent's SEQ
```

### `packages/codegen/src/types/parsekind-collisions.ts::diagnoseParseKindCollisions`

#### body

```text
// Distinctness by stamped id where available: same-id values are the
// same runtime identity even under different names (hidden/visible
// twins); the name is only the fallback key for id-less values.
```

#### body

```text
// Read-time dispatch keys on the WIRE identity — the grammar symbol
// the read stamps as `$type` (the storage-side id for aliased
// occurrences). Distinct storage kinds sharing only a DISPLAY name
// are injective on the wire and need no diagnostic; the defect is
// distinct storage kinds whose WIRE ids coincide. Values without a
// stamped storage id cannot prove the wire distinguishes them, so
// they conservatively share one collision group.
```
