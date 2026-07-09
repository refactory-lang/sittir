import {
	SEQ,
	OPTIONAL,
	CHOICE,
	REPEAT,
	REPEAT1,
	FIELD,
	VARIANT,
	SUPERTYPE,
	GROUP,
	STRING,
	PATTERN,
	INDENT,
	DEDENT,
	NEWLINE,
	SYMBOL,
	ALIAS,
	TOKEN
} from './rule-types.ts';
import type { RuleMetadata } from './rule-metadata-brand.ts';
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

// tokenToName is defined locally below to avoid a circular import with
// compiler/link.ts (which imports helpers from this file). A small map
// covering the common non-word optionals (`!`, `?`) is enough; bail to
// null for anything else and the caller falls back to existing behavior.

// ---------------------------------------------------------------------------
// Rule — the shared intermediate representation
// ---------------------------------------------------------------------------

export type RuleId = string;

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
export type Multiplicity = 'optional' | 'single' | 'array' | 'nonEmptyArray';

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
export type PhaseName = 'evaluate' | 'link' | 'normalize' | 'simplify';

/** Phases whose views are wrapper-free (at-or-after wrapper-deletion). */
type NormalizedPhase = 'normalize' | 'simplify';
/** Phases where modifier wrappers + reference nodes still exist. */
type WrapperPhase = 'evaluate' | 'link';

/**
 * The any-phase view — the union of every phase's Rule union. Phase-agnostic
 * utilities (tree walkers, guards, the transform DSL) accept this; phase
 * modules pin the precise view (`Rule<'link'>`, `RenderRule`, …).
 */
export type AnyRule = Rule<PhaseName>;

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
export type RuleBase<Phase extends PhaseName = 'normalize'> = {
	readonly id?: RuleId;

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
	readonly inline?: boolean;

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
	readonly metadata?: RuleMetadata;

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
	readonly splicedBody?: boolean;

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
	readonly variantArms?: readonly string[];
} & (Phase extends NormalizedPhase
	? {
			// All stamped attributes below are populated by
			// `applyWrapperDeletion` (Normalize) — the structured `separator`
			// object included: wrapper-deletion carries the repeat node's own
			// link-lifted `separator` object across unchanged as it deletes
			// the repeat wrapper (RepeatRule<'link'>/Repeat1Rule<'link'>
			// share this identical nested shape). None of them exist on
			// evaluate/link views' RuleBase (they exist on the repeat/repeat1
			// wrapper nodes themselves pre-deletion).
			readonly fieldName?: string;
			readonly multiplicity?: Multiplicity;
			readonly nonterminal?: boolean;

			/** Single canonical separator fact (widened from the former 3-way
			 *  `string | Rule[] | {rules, trailing?, leading?}` union, PR-S).
			 *  `value` is a StringRule for the common literal case;
			 *  ChoiceRule/SeqRule for a rule-shaped separator. `trailing`/
			 *  `leading` are nested HERE (not top-level siblings) so an
			 *  orphan trailing/leading-without-a-separator state is
			 *  structurally impossible, and so `applyWrapperDeletion` can
			 *  carry this whole fact across the phase boundary unchanged
			 *  from RepeatRule<'link'>'s identical shape. */
			readonly separator?: {
				readonly value: Rule<Phase>;
				readonly trailing?: boolean;
				readonly leading?: boolean;
			};

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
			readonly aliasedFrom?: string;
			readonly aliasNamed?: boolean;
		}
	: {});

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
export type Rule<Phase extends PhaseName = 'normalize'> =
	// Structural grouping — Normalize restructures these
	| SeqRule<Phase>
	| ChoiceRule<Phase>

	// Named patterns — clean wrappers, no derived metadata
	| VariantRule<Phase>
	// EnumRule is now ChoiceRule (PR-P): removed from union to avoid duplicate
	| SupertypeRule<Phase>
	| GroupRule<Phase>
	// TerminalRule removed (PR-P Task 2): terminals classify by shape at Assemble

	// Terminals
	| StringRule<Phase>
	| PatternRule<Phase>

	// Structural whitespace
	| IndentRule<Phase>
	| DedentRule<Phase>
	| NewlineRule<Phase>

	// References — symbol refs persist through every phase (they are the
	// cross-rule reference mechanism all the way to emit)
	| SymbolRule<Phase>

	// Bounded-lifetime nodes — each collapses to `never` outside its phase
	// window (see the per-type conditionals): alias/token are consumed by
	// Link (surviving into the 'link' view only defensively);
	// optional/field/repeat/repeat1 are consumed by Normalize's
	// applyWrapperDeletion. None appear in the wrapper-free views.
	| OptionalRule<Phase>
	| FieldRule<Phase>
	| RepeatRule<Phase>
	| Repeat1Rule<Phase>
	| AliasRule<Phase>
	| TokenRule<Phase>;

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
export type RenderRule = Rule<'normalize'> & {
	readonly __renderRule?: never;
};

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
export type SimplifiedRule = Rule<'simplify'> & {
	readonly __renderRule?: never;
	readonly __simplifiedRule?: never;
};

// ---------------------------------------------------------------------------
// Structural grouping
// ---------------------------------------------------------------------------

export type SeqRule<T extends PhaseName = 'normalize'> = RuleBase<T> & {
	readonly type: typeof SEQ;
	readonly members: Rule<T>[];
};

export type OptionalRule<T extends PhaseName = 'link'> = T extends WrapperPhase
	? RuleBase<T> & {
			readonly type: typeof OPTIONAL;
			readonly content: Rule<T>;
		}
	: never;

export type ChoiceRule<T extends PhaseName = 'normalize'> = RuleBase<T> & {
	readonly type: typeof CHOICE;
	readonly members: Rule<T>[];
};

export type RepeatRule<T extends PhaseName = 'link'> = T extends 'link'
	? RuleBase<T> & {
			readonly type: typeof REPEAT;
			readonly content: Rule<T>;
			/** Same nested shape as RuleBase<NormalizedPhase>.separator, one
			 *  phase earlier — applyWrapperDeletion carries this object
			 *  across unchanged rather than reconstructing it from separate
			 *  fields. */
			readonly separator?: {
				readonly value: Rule<T>;
				readonly trailing?: boolean;
				readonly leading?: boolean;
			};
		}
	: T extends 'evaluate'
		? RuleBase<T> & {
				readonly type: typeof REPEAT;
				readonly content: Rule<T>;
				/** Evaluate-phase separators are always literal strings,
				 *  reconstructed fresh by link's lift — not carried through, so
				 *  this stays the original sibling shape (unchanged by PR-S). */
				readonly separator?: string;
				readonly trailing?: boolean;
				readonly leading?: boolean;
			}
		: never;

export type Repeat1Rule<T extends PhaseName = 'link'> = T extends 'link'
	? RuleBase<T> & {
			readonly type: typeof REPEAT1;
			readonly content: Rule<T>;
			/** Same nested shape as RuleBase<NormalizedPhase>.separator, one
			 *  phase earlier — applyWrapperDeletion carries this object
			 *  across unchanged rather than reconstructing it from separate
			 *  fields. */
			readonly separator?: {
				readonly value: Rule<T>;
				readonly trailing?: boolean;
				readonly leading?: boolean;
			};
		}
	: T extends 'evaluate'
		? RuleBase<T> & {
				readonly type: typeof REPEAT1;
				readonly content: Rule<T>;
				/** Evaluate-phase separators are always literal strings,
				 *  reconstructed fresh by link's lift — not carried through, so
				 *  this stays the original sibling shape (unchanged by PR-S). */
				readonly separator?: string;
				readonly trailing?: boolean;
				readonly leading?: boolean;
			}
		: never;

// ---------------------------------------------------------------------------
// Named patterns
// ---------------------------------------------------------------------------

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
export type FieldRule<T extends PhaseName = 'link'> = T extends WrapperPhase
	? RuleBase<T> & {
			readonly type: typeof FIELD;
			readonly name: string;
			readonly content: Rule<T>;
			/**
			 * True if the field's value is rendered as an indented block — its
			 * content resolves (through symbol refs) to a subtree containing an
			 * `indent` Rule node. The template walker prefixes `\n  ` to the
			 * field slot so `class X:$BODY` renders as `class X:\n  $BODY`.
			 * Set by Link's `annotateBlockBearerFields` pass.
			 */
			readonly blockBearer?: boolean;
			/**
			 * Internal marker used by Evaluate's `transform()` DSL: a `field()`
			 * call with no content is a placeholder patch that takes its content
			 * from the original rule at patch-resolve time. Never survives past
			 * `resolvePatch` — if this shows up anywhere else, it's a bug.
			 */
			readonly _needsContent?: boolean;
		}
	: never;

export type VariantRule<T extends PhaseName = 'normalize'> = RuleBase<T> & {
	readonly type: typeof VARIANT;
	readonly name: string;
	readonly content: Rule<T>;
};

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

/**
 * EnumRule — a normalized choice-of-strings.
 *
 * PR-P: EnumRule is now a type alias for ChoiceRule. The ENUM discriminant
 * is retired; enum-ness is detected structurally via isEnumChoiceRule().
 * Shape-compatible with ChoiceRule (both expose `members`); every member
 * is a StringRule. The provenance moves to `metadata.author`/`metadata.classifiedBy`
 * (debt: source-homonym resolution, decision 6).
 */
export type EnumRule<T extends PhaseName = 'normalize'> = ChoiceRule<T>;

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
export function isEnumChoiceRule<R extends AnyRule>(
	rule: R
): rule is Extract<R, { type: typeof CHOICE }> & { readonly __enumShaped?: never } {
	return rule.type === CHOICE && rule.members.length >= 2 && rule.members.every((m) => m.type === STRING);
}

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
export type SupertypeRule<T extends PhaseName = 'normalize'> = RuleBase<T> & {
	readonly type: typeof SUPERTYPE;
	readonly name: string;
	readonly subtypes: string[];
};

export type GroupRule<T extends PhaseName = 'normalize'> = RuleBase<T> & {
	readonly type: typeof GROUP;
	readonly name: string;
	readonly content: Rule<T>;
};

// ---------------------------------------------------------------------------
// Terminals
// ---------------------------------------------------------------------------

export type StringRule<T extends PhaseName = 'normalize'> = RuleBase<T> & {
	readonly type: typeof STRING;
	readonly value: string;
};

export type PatternRule<T extends PhaseName = 'normalize'> = RuleBase<T> & {
	readonly type: typeof PATTERN;
	readonly value: string;
};

// ---------------------------------------------------------------------------
// Structural whitespace
// ---------------------------------------------------------------------------

export type IndentRule<T extends PhaseName = 'normalize'> = RuleBase<T> & {
	readonly type: typeof INDENT;
};

export type DedentRule<T extends PhaseName = 'normalize'> = RuleBase<T> & {
	readonly type: typeof DEDENT;
};

export type NewlineRule<T extends PhaseName = 'normalize'> = RuleBase<T> & {
	readonly type: typeof NEWLINE;
};

// ---------------------------------------------------------------------------
// References. Symbol refs persist through EVERY phase (wrapper-deletion
// stamps fieldName/multiplicity/separator onto them as leaves — that is the
// core of the RenderRule design). alias/token are consumed by Link and only
// exist in the WrapperPhase views.
// ---------------------------------------------------------------------------

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
export type SymbolRule<T extends PhaseName = 'normalize'> = RuleBase<T> & {
	readonly type: typeof SYMBOL;
	readonly name: string;
	/** Original literal text when Link synthesized this ref from a string token. */
	readonly literal?: string;
	readonly hidden?: boolean;
	/**
	 * Alias provenance: when this symbol was produced by resolving
	 * `alias($.aliasedFrom, $.name)`, `aliasedFrom` is the source kind
	 * whose shape the parse tree body follows (while tree-sitter emits
	 * the node with `$type === name`, the alias target). Preserved so
	 * the wrap emitter can rewrite \$type at drill-in via drillAs().
	 * Used by the wrap emitter for alias-target rewrites.
	 */
	readonly aliasedFrom?: string;
};

export type AliasRule<Phase extends PhaseName = 'link'> = Phase extends WrapperPhase
	? RuleBase<Phase> & {
			readonly type: typeof ALIAS;
			readonly content: Rule<Phase>;
			readonly named: boolean;
			readonly value: string;
		}
	: never;

export type TokenRule<Phase extends PhaseName = 'link'> = Phase extends WrapperPhase
	? RuleBase<Phase> & {
			readonly type: typeof TOKEN;
			readonly content: Rule<Phase>;
			readonly immediate: boolean;
		}
	: never;

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

// Phase-generic: each guard narrows WITHIN the caller's phase view (for a
// view where the variant cannot exist — e.g. isOptional on Rule<'normalize'>
// — the narrowed type is `never`, surfacing the dead check at compile time).
export const isSeq = <R extends AnyRule>(r: R): r is Extract<R, { type: typeof SEQ }> => r.type === SEQ;
export const isChoice = <R extends AnyRule>(r: R): r is Extract<R, { type: typeof CHOICE }> => r.type === CHOICE;
export const isOptional = <R extends AnyRule>(r: R): r is Extract<R, { type: typeof OPTIONAL }> => r.type === OPTIONAL;
export const isRepeat = <R extends AnyRule>(r: R): r is Extract<R, { type: typeof REPEAT }> => r.type === REPEAT;
export const isRepeat1 = <R extends AnyRule>(r: R): r is Extract<R, { type: typeof REPEAT1 }> => r.type === REPEAT1;
export const isField = <R extends AnyRule>(r: R): r is Extract<R, { type: typeof FIELD }> => r.type === FIELD;

export const isGroup = <R extends AnyRule>(r: R): r is Extract<R, { type: typeof GROUP }> => r.type === GROUP;
// isTerminal removed (PR-P Task 2): TerminalRule deleted; terminals classify by shape
export const isString = <R extends AnyRule>(r: R): r is Extract<R, { type: typeof STRING }> => r.type === STRING;
export const isSymbol = <R extends AnyRule>(r: R): r is Extract<R, { type: typeof SYMBOL }> => r.type === SYMBOL;
export const isAlias = <R extends AnyRule>(r: R): r is Extract<R, { type: typeof ALIAS }> => r.type === ALIAS;
/**
 * (debt PR-P1) Was `r.type === SYMBOL && r.source === 'link'`; `SymbolRule.source`
 * is deleted (relocated to `metadata.symbolSource`, dsl-owned + opaque). `literal`
 * is set ONLY by `compiler/link.ts`'s `canonicalizeRuleLiterals` — the same
 * (now-sole) writer that used to also stamp `source: 'link'` — so checking
 * `literal !== undefined` directly is the exact same condition structurally,
 * not a re-derivation: the one write site produced both facts together.
 */
export const isLinkSymbol = <R extends AnyRule>(r: R): r is Extract<R, { type: typeof SYMBOL }> =>
	r.type === SYMBOL && r.literal !== undefined;
export const literalTextOf = (r: AnyRule): string | undefined =>
	r.type === STRING ? r.value : isLinkSymbol(r) ? r.literal : undefined;

// ---------------------------------------------------------------------------
// Tree walkers — pure Rule-tree projections, no AssembledNode concepts
// ---------------------------------------------------------------------------

/**
 * Collect the set of field names referenced anywhere in a rule tree.
 * Returns names only — cheap one-pass walker with no AssembledField
 * allocation. Pre-assembly phases (classifier) that only need field-set equality call this
 * instead of constructing full AssembledField objects just to extract
 * names.
 */
export function collectFieldNames(rule: AnyRule): Set<string> {
	const names = new Set<string>();
	walkFieldNames(rule, names);
	return names;
}

function walkFieldNames(rule: AnyRule, out: Set<string>): void {
	switch (rule.type) {
		case FIELD:
			out.add(rule.name);
			walkFieldNames(rule.content, out);
			return;
		case SEQ:
		case CHOICE:
			for (const m of rule.members) walkFieldNames(m, out);
			return;
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case VARIANT:
		case GROUP:
			walkFieldNames(rule.content, out);
			return;
		default:
			return;
	}
}

// ---------------------------------------------------------------------------
// Reference graph
// ---------------------------------------------------------------------------

export interface SymbolRef {
	refType: 'symbol' | 'alias' | 'token';
	from: string;
	to: string;
	fromRuleId?: RuleId;
	fieldName?: string;
	optional?: boolean;
	repeated?: boolean;
	position?: number; // Link adds: index within parent's SEQ
}

// ---------------------------------------------------------------
// Path-addressed rule rewriting
//
// Slash-separated positional paths (e.g. '1/1/0/1/3') used by
// `polymorphs:` / `transforms:` / `groups:` in overrides.ts. See
// docs/superpowers/specs/2026-05-15-024-assembled-group-synthesis-design.md
// for the path semantics.
// ---------------------------------------------------------------

/**
 * Return a new rule tree with the sub-rule at `path` replaced by
 * `replacement`. Pure — no mutation of input. Path segments index into:
 *   - seq.members[i] / choice.members[i]
 *   - wrapper.content (path '0' for optional/repeat/repeat1/field/
 *     token/alias/variant/clause/group)
 *
 * Throws if any segment fails to address.
 */
export function replaceAtPath<R extends AnyRule>(rule: R, path: string, replacement: R): R {
	const segments = path.split('/').filter((s) => s.length > 0);
	return replaceAtPathRec(rule, segments, 0, replacement) as R;
}

function replaceAtPathRec(rule: AnyRule, segments: readonly string[], depth: number, replacement: AnyRule): AnyRule {
	if (depth === segments.length) return replacement;
	const idx = parseInt(segments[depth]!, 10);
	switch (rule.type) {
		case SEQ:
		case CHOICE: {
			const members = rule.members.slice();
			members[idx] = replaceAtPathRec(members[idx]!, segments, depth + 1, replacement);
			return { ...rule, members };
		}
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case FIELD:
		case TOKEN:
		case ALIAS:
		case VARIANT:
		case GROUP:
			return {
				...rule,
				content: replaceAtPathRec((rule as { content: AnyRule }).content, segments, depth + 1, replacement)
			} as AnyRule;
		default:
			throw new Error(`replaceAtPath: cannot descend into '${rule.type}' at segment ${depth}`);
	}
}

/**
 * Symbol reference constructor — baseline DSL shadow used by metadata
 * helpers that need a real runtime symbol without fabricating the object.
 */
export function sym(name: string): SymbolRule {
	return { type: SYMBOL, name, hidden: name.startsWith('_'), inline: name.startsWith('_') };
}
