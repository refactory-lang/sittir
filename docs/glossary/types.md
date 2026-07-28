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

### `GrammarDiagnostic` (`packages/codegen/src/types/diagnostics.ts:32`)

```text
/** Static, author-facing facts about the authored grammar; subject is a Rule. */
```

### `CompilerDiagnostic` (`packages/codegen/src/types/diagnostics.ts:42`)

```text
/** Emitted during the compile pipeline about a rule OR an assembled node. */
```

### `RuntimeDiagnostic` (`packages/codegen/src/types/diagnostics.ts:50`)

```text
/** Render / read / parse execution. */
```

### `DiagnosticSink` (`packages/codegen/src/types/diagnostics.ts:62`)

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

### `EmitHaltedError` (`packages/codegen/src/types/diagnostics.ts:101`)

```text
/**
 * Thrown by assertEmittable() when the DiagnosticSink contains 'fail' items.
 * Mirrors GrammarDiagnosticError's message format (code: message per line).
 */
```

### `ExternalRole` (`packages/codegen/src/types/ir.ts:15`)

```text
/** External-scanner role binding (indent / dedent / newline tokens). */
```

### `parseKindId` (`packages/codegen/src/types/parsekind-collisions.ts:25`)

```text
/**
	 * Mint-time parser id of `parseKind` (PR-K3e). When present, bucket
	 * identity is the id, not the name — same-spelled parse kinds with
	 * different parser symbols (#129 class) land in different buckets.
	 * Absent for id-less pipelines (enrich runs pre-parser).
	 */
```

### `storageKindId` (`packages/codegen/src/types/parsekind-collisions.ts:32`)

```text
/**
	 * Mint-time parser id of `storageKind` (PR-K3e). When present,
	 * storage-kind distinctness is decided by id: same-id values are the
	 * same runtime identity even under different names (hidden/visible
	 * twins), and differing ids still fall through to the structural
	 * signature for the merge-or-diagnose decision.
	 */
```

### `RuleMetadata` (`packages/codegen/src/types/rule-metadata-brand.ts:20`)

```text
/**
 * Opaque provenance bag. Exposes NO readable properties to compiler code —
 * any attempt to read a fact off it directly (`rule.metadata.source`) is a
 * compile error. The only way to construct or read the real shape is through
 * `dsl/rule-metadata.ts`'s `makeRuleMetadata` / `readRuleMetadata`.
 */
```

### `Multiplicity` (`packages/codegen/src/types/rule.ts:47`)

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

### `PhaseName` (`packages/codegen/src/types/rule.ts:59`)

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
 *   'normalize' — wrapper-free (applyWrapperDeletion ran): optional/field/
 *                 repeat/repeat1/alias/token GONE; their meaning lives in the
 *                 stamped leaf attributes (fieldName/multiplicity/separator/
 *                 aliasedFrom). This is the RenderRule shape.
 *   'simplify'  — same structure as 'normalize' plus the universal
 *                 seq-of-leaves invariant (see SimplifiedRule brand).
 */
```

### `NormalizedPhase` (`packages/codegen/src/types/rule.ts:77`)

```text
/** Phases whose views are wrapper-free (at-or-after wrapper-deletion). */
```

### `WrapperPhase` (`packages/codegen/src/types/rule.ts:79`)

```text
/** Phases where modifier wrappers + reference nodes still exist. */
```

### `AnyRule` (`packages/codegen/src/types/rule.ts:82`)

```text
/**
 * The any-phase view — the union of every phase's Rule union. Phase-agnostic
 * utilities (tree walkers, guards, the transform DSL) accept this; phase
 * modules pin the precise view (`Rule<'link'>`, `RenderRule`, …).
 */
```

### `RuleBase` (`packages/codegen/src/types/rule.ts:89`)

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

### `inline` (`packages/codegen/src/types/rule.ts:114`)

```text
/**
	 * Per-ref inline decision: `inline = hidden && !aliased`. Default
	 * `hidden` (`name.startsWith('_')`) stamped at construction
	 * (`evaluate.ts symbol`/`createProxy`); flipped `false` by the `alias`
	 * wrapper during push-down (`wrapper-deletion.ts` ALIAS case) because an
	 * alias confers a real visible CST kind that must materialize, not
	 * flatten. Read directly off the rule (with an `isHiddenKind` fallback
	 * for link-synthesized symbols) — see `compiler/link.ts:539-540`,
	 * `dsl/rule-transforms.ts:334`. Replaces the scattered re-derivations of
	 * the inline decision (`name.startsWith('_')` combined with ad hoc alias checks).
	 */
```

### `metadata` (`packages/codegen/src/types/rule.ts:127`)

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

### `splicedBody` (`packages/codegen/src/types/rule.ts:143`)

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

### `variantArms` (`packages/codegen/src/types/rule.ts:162`)

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

### `separator` (`packages/codegen/src/types/rule.ts:202`)

```text
/** Single canonical separator fact (widened from the former 3-way
			 *  `string | Rule[] | {rules, trailing?, leading?}` union, PR-S).
			 *  `value` is a StringRule for the common literal case;
			 *  ChoiceRule/SeqRule for a rule-shaped separator. `trailing`/
			 *  `leading` are nested HERE (not top-level siblings) so an
			 *  orphan trailing/leading-without-a-separator state is
			 *  structurally impossible, and so `applyWrapperDeletion` can
			 *  carry this whole fact across the phase boundary unchanged
			 *  from RepeatRule<'link'>'s identical shape. */
```

### `aliasedFrom` (`packages/codegen/src/types/rule.ts:217`)

```text
/**
			 * Alias provenance pushed down from an `alias()` wrapper by
			 * `applyWrapperDeletion`, exactly as `fieldName` / `multiplicity` /
			 * `separator` are pushed down from `field` / `optional` / `repeat`.
			 * `aliasedFrom` is the alias TARGET (`AliasRule.value` — the name
			 * tree-sitter emits for the node), `aliasNamed` mirrors
			 * `AliasRule.named`. Consumers of the wrapper-free RenderRule /
			 * SimplifiedRule read these off the leaf instead of matching a
			 * mid-tree `alias` node. (`SymbolRule.aliasedFrom` predates this and
			 * carries the same target name for Link-resolved symbol aliases.)
			 */
```

### `Rule` (`packages/codegen/src/types/rule.ts:233`)

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

### `RenderRule` (`packages/codegen/src/types/rule.ts:281`)

```text
/**
 * A Rule shape produced by `applyWrapperDeletion` in normalize.ts. Modifier
 * wrappers (`optional` / `field` / `repeat` / `repeat1`) have been pushed
 * down to leaf attributes; structural rules (`seq` / `choice` / `variant` /
 * `group`) are preserved.
 *
 * Structurally a `Rule` minus the wrapper variants. Carries a phantom
 * `__renderRule` marker for readability at call sites, but the marker is
 * optional and never written, so it provides no assignability protection —
 * `Rule<'normalize'>` values are still structurally assignable to
 * `RenderRule` without going through `applyWrapperDeletion`.
 */
```

### `SimplifiedRule` (`packages/codegen/src/types/rule.ts:297`)

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

### `SeparatorFlankMode` (`packages/codegen/src/types/rule.ts:338`)

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

### `separator` (`packages/codegen/src/types/rule.ts:354`)

```text
/** Same nested shape as RuleBase<NormalizedPhase>.separator, one
			 *  phase earlier — applyWrapperDeletion carries this object
			 *  across unchanged rather than reconstructing it from separate
			 *  fields. */
```

### `separator` (`packages/codegen/src/types/rule.ts:368`)

```text
/** Evaluate-phase separators are always literal strings,
				 *  reconstructed fresh by link's lift — not carried through, so
				 *  this stays the original sibling shape (unchanged by PR-S). */
```

### `separator` (`packages/codegen/src/types/rule.ts:381`)

```text
/** Same nested shape as RuleBase<NormalizedPhase>.separator, one
			 *  phase earlier — applyWrapperDeletion carries this object
			 *  across unchanged rather than reconstructing it from separate
			 *  fields. */
```

### `separator` (`packages/codegen/src/types/rule.ts:395`)

```text
/** Evaluate-phase separators are always literal strings,
				 *  reconstructed fresh by link's lift — not carried through, so
				 *  this stays the original sibling shape (unchanged by PR-S). */
```

### `FieldRule` (`packages/codegen/src/types/rule.ts:408`)

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

### `blockBearer` (`packages/codegen/src/types/rule.ts:424`)

```text
/**
			 * True if the field's value is rendered as an indented block — its
			 * content resolves (through symbol refs) to a subtree containing an
			 * `indent` Rule node. The template walker prefixes `\n  ` to the
			 * field slot so `class X:$BODY` renders as `class X:\n  $BODY`.
			 * Set by Link's `annotateBlockBearerFields` pass.
			 */
```

### `_needsContent` (`packages/codegen/src/types/rule.ts:432`)

```text
/**
			 * Internal marker used by Evaluate's `transform()` DSL: a `field()`
			 * call with no content is a placeholder patch that takes its content
			 * from the original rule at patch-resolve time. Never survives past
			 * `resolvePatch` — if this shows up anywhere else, it's a bug.
			 */
```

### `EnumRule` (`packages/codegen/src/types/rule.ts:459`)

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

### `SupertypeRule` (`packages/codegen/src/types/rule.ts:495`)

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

### `subtypeParseNames` (`packages/codegen/src/types/rule.ts:512`)

```text
/**
	 * Storage→parse name pairs for the aliased arms of the flattened CHOICE,
	 * stamped by `classifyHiddenChoiceRule` (compiler/link.ts) at the moment
	 * the flatten erases them — the same declared-fact pattern as
	 * `RuleBase.variantArms`. Keys are `subtypes` entries (the STORAGE kind —
	 * `SymbolRule.aliasedFrom`, the rule whose body/slots/template model the
	 * arm); values are the PARSE names (the visible label tree-sitter emits at
	 * that arm's position, carrying its own `alias_sym_*` runtime symbol id).
	 * Consumed by node-map's supertype value derivation (`parseKindId` stamps)
	 * and the supertype transport-enum emitter (accepted dispatch ids) so
	 * runtime nodes arriving under the alias occurrence's id — enrich-minted
	 * arms like `alias($._expression_except_range, $.expression_group1)` —
	 * route to the storage kind's variant instead of failing as unknown.
	 * Absent when no arm is aliased (the common case).
	 */
```

### `SymbolRule` (`packages/codegen/src/types/rule.ts:573`)

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

### `literal` (`packages/codegen/src/types/rule.ts:586`)

```text
/** Original literal text when Link synthesized this ref from a string token. */
```

### `aliasedFrom` (`packages/codegen/src/types/rule.ts:589`)

```text
/**
	 * Alias provenance: when this symbol was produced by resolving
	 * `alias($.aliasedFrom, $.name)`, `aliasedFrom` is the source kind
	 * whose shape the parse tree body follows (while tree-sitter emits
	 * the node with `$type === name`, the alias target). Preserved so
	 * the wrap emitter can rewrite \$type at drill-in via drillAs().
	 * Used by the wrap emitter for alias-target rewrites.
	 */
```

### `metadata` (`packages/codegen/src/types/runtime-shapes.ts:76`)

```text
/** Opaque (debt PR-P1): the former `source?: string` provenance tag is
	 *  gone — `dsl/primitives/field.ts` now stamps `metadata.fieldSource`
	 *  instead (via `dsl/rule-metadata.ts`'s `makeRuleMetadata`). Untyped
	 *  here since `types/` cannot import the opaque brand's dsl-owned
	 *  constructor; writers cast through `unknown`. */
```
