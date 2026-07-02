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
	TOKEN,
} from './rule-types.ts';
/**
 * compiler/rule.ts — Shared IR
 *
 * One type throughout the pipeline. Defined once, never extended.
 * Rule type presence varies by phase:
 *   - After Evaluate: symbol, alias, token, repeat1 present
 *   - After Link: symbol, alias, token gone; group, indent/dedent/newline added.
 *     `repeat1` is preserved so downstream field/child derivation can stamp the
 *     `nonEmpty` flag on the resulting slot for emitter tuple-type rendering.
 *   - After Optimize: variant added; structural grouping may be restructured
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
 *   'optimize' — wrapper-free (applyWrapperDeletion ran): optional/field/
 *                repeat/repeat1/alias/token GONE; their meaning lives in the
 *                stamped leaf attributes (fieldName/multiplicity/separator/
 *                aliasedFrom). This is the RenderRule shape.
 *   'simplify' — same structure as 'optimize' plus the universal
 *                seq-of-leaves invariant (see SimplifiedRule brand).
 */
export type PhaseName = 'evaluate' | 'link' | 'optimize' | 'simplify';

/** Phases whose views are wrapper-free (at-or-after wrapper-deletion). */
type OptimizedPhase = 'optimize' | 'simplify';
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
 * - `id` is the existing identity tag (see RuleIdentity history).
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
 * placement (`trailing`/`leading` booleans) lives ON the structured
 * `separator` object below.
 */
export type RuleBase<Phase extends PhaseName = 'optimize'> = {
	readonly id?: RuleId;

	/**
	 * Per-ref inline decision: `inline = hidden && !aliased`. Default
	 * `hidden` (`name.startsWith('_')`) stamped at construction
	 * (`evaluate.ts symbol`/`createProxy`); flipped `false` by the `alias`
	 * wrapper during push-down (`wrapper-deletion.ts` ALIAS case) because an
	 * alias confers a real visible CST kind that must materialize, not
	 * flatten. Read via `isInlineRef()` (with an `isHiddenKind` fallback for
	 * link-synthesized symbols). Replaces the scattered re-derivations of the
	 * inline decision (`name.startsWith('_')`, `source==='group-lift'`).
	 */
	readonly inline?: boolean;

	/**
	 * Inert provenance bag. NEVER drives compiler behavior beyond path-descent
	 * lookup keying (`feedback_metadata_not_behavior`): structural facts decide
	 * folding/slotting. `source` marks how the rule entered the tree
	 * (`'enrich'` for the enrich-lifted SYMBOL ref; `'group-lift'` legacy);
	 * `inlinedFrom` records the hidden kind whose body was spliced in by the
	 * normalize inline hoist (§D-2a), for diagnostics only.
	 */
	readonly metadata?: { source?: RuleSource | 'enrich' | 'group-lift'; inlinedFrom?: string };
} & (Phase extends OptimizedPhase
	? {
			// All six stamped attributes below are populated by
			// `applyWrapperDeletion` (Optimize) — the structured `separator`
			// object included: wrapper-deletion converts the repeat node's own
			// link-lifted `separator?: string` into this leaf object form as
			// it deletes the repeat wrapper. None of them exist on
			// evaluate/link views.
			readonly fieldName?: string;
			readonly multiplicity?: Multiplicity;
			readonly nonterminal?: boolean;

			readonly separator?:
				| string
				| readonly Rule<Phase>[]
				| {
						readonly rules: readonly Rule<Phase>[];
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
 * @deprecated Renamed to {@link RuleBase} now that this interface carries
 * modifier attributes in addition to identity. Retained as an alias so any
 * external consumer keeps working through PR0; remove when callers migrate.
 */
export type RuleIdentity = RuleBase;

/**
 * Discriminated union of every Rule shape visible in the `Phase` view. Each
 * member intersects {@link RuleBase}, so the phase-gated modifier attributes
 * are reachable on every variant without an intersection here.
 *
 * The bare-`Rule` default is `'optimize'` — the most permissive
 * attribute-wise (all stamped leaf attributes readable) and the strictest
 * variant-wise (no wrappers, no alias/token). Pre-optimize modules annotate
 * `Rule<'evaluate'>` / `Rule<'link'>` explicitly; phase-agnostic utilities
 * take {@link AnyRule}.
 */
export type Rule<Phase extends PhaseName = 'optimize'> =
	// Structural grouping — Optimize restructures these
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
	// optional/field/repeat/repeat1 are consumed by Optimize's
	// applyWrapperDeletion. None appear in the wrapper-free views.
	| OptionalRule<Phase>
	| FieldRule<Phase>
	| RepeatRule<Phase>
	| Repeat1Rule<Phase>
	| AliasRule<Phase>
	| TokenRule<Phase>;

/**
 * A Rule shape produced by `applyWrapperDeletion` in optimize.ts. Modifier
 * wrappers (`optional` / `field` / `repeat` / `repeat1`) have been pushed
 * down to leaf attributes; structural rules (`seq` / `choice` / `variant` /
 * `group`) are preserved.
 *
 * Structurally a `Rule` minus the wrapper variants — typed as a brand so
 * mismatches between RawRule and RenderRule consumption surface at compile
 * time.
 */
export type RenderRule = Rule<'optimize'> & {
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
 * Branded so SimplifiedRule consumers can't be silently called with a
 * pre-canonicalize RenderRule.
 */
export type SimplifiedRule = Rule<'simplify'> & {
	readonly __renderRule?: never;
	readonly __simplifiedRule?: never;
};

// ---------------------------------------------------------------------------
// Structural grouping
// ---------------------------------------------------------------------------

export type SeqRule<T extends PhaseName = 'optimize'> = RuleBase<T> & {
	readonly type: typeof SEQ;
	readonly members: Rule<T>[];
}

export type OptionalRule<T extends PhaseName = 'link'> = T extends WrapperPhase
	? RuleBase<T> & {
			readonly type: typeof OPTIONAL;
			readonly content: Rule<T>;
	  }
	: never;

export type ChoiceRule<T extends PhaseName = 'optimize'> = RuleBase<T> & {
	readonly type: typeof CHOICE;
	readonly members: Rule<T>[];
}

export type RepeatRule<T extends PhaseName = 'link'> = T extends WrapperPhase
	? RuleBase<T> & {
			readonly type: typeof REPEAT;
			readonly content: Rule<T>;
			/** Link-lifted separator string (liftSeparators); wrapper-deletion turns it into the leaf object form. */
			readonly separator?: string;
			readonly trailing?: boolean;
			readonly leading?: boolean;
	  }
	: never;

export type Repeat1Rule<T extends PhaseName = 'link'> = T extends WrapperPhase
	? RuleBase<T> & {
			readonly type: typeof REPEAT1;
			readonly content: Rule<T>;
			readonly separator?: string;
			readonly trailing?: boolean;
			readonly leading?: boolean;
	  }
	: never;

// ---------------------------------------------------------------------------
// Named patterns
// ---------------------------------------------------------------------------

export type FieldRule<T extends PhaseName = 'link'> = T extends WrapperPhase
	? RuleBase<T> & {
			readonly type: typeof FIELD;
			readonly name: string;
			readonly content: Rule<T>;
			readonly source?: 'grammar' | 'override' | 'enriched' | 'inferred';
			readonly nameFrom?: 'grammar' | 'kind' | 'override' | 'usage';
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

export type VariantRule<T extends PhaseName = 'optimize'> = RuleBase<T> & {
	readonly type: typeof VARIANT;
	readonly name: string;
	readonly content: Rule<T>;
}


/**
 * Rule-level provenance vocabulary.
 *
 *   'grammar'  — the user wrote this classification explicitly in grammar.js
 *                (e.g. `supertypes: [$._expression]` or a literal enum rule).
 *   'override' — an overrides.ts patch produced this rule.
 *   'promoted' — Link derived this classification from rule shape (hidden
 *                choice-of-strings → enum, hidden choice-of-symbols →
 *                supertype, field-free symbol-free subtree → terminal).
 *
 * Suggestion check is uniform across all rule-level sources:
 *    isSuggestion = source !== 'grammar' && source !== 'override'
 */
export type RuleSource = 'grammar' | 'promoted' | 'override';

/**
 * EnumRule — a normalized choice-of-strings.
 *
 * PR-P: EnumRule is now a type alias for ChoiceRule. The ENUM discriminant
 * is retired; enum-ness is detected structurally via isEnumChoiceRule().
 * Shape-compatible with ChoiceRule (both expose `members`); every member
 * is a StringRule. The `source` provenance moves to `metadata.source`.
 */
export type EnumRule<T extends PhaseName = 'optimize'> = ChoiceRule<T>;

/**
 * Predicate: rule is an enum-shaped ChoiceRule (flat, all-STRING members,
 * at least 2 members). Matches the pre-link form; post-link use literalTextOf.
 *
 * This is the canonical replacement for `rule.type === ENUM`.
 */
export function isEnumChoiceRule<R extends AnyRule>(rule: R): rule is Extract<R, { type: typeof CHOICE }> {
	return rule.type === CHOICE && rule.members.length >= 2 && rule.members.every((m) => m.type === STRING);
}

/**
 * Normalize a closed literal set to the canonical rule shape.
 *
 * @remarks
 * Multi-member sets remain a ChoiceRule (enum-shaped). A single literal
 * collapses to that StringRule so downstream phases classify it as the
 * corresponding keyword/token instead of carrying a degenerate enum shape.
 * The `source` provenance is carried in `metadata.source` (not top-level).
 */
export function normalizeEnumMembers(
	members: readonly StringRule[],
	source?: RuleSource
): StringRule | ChoiceRule {
	if (members.length === 1) return members[0]!;
	return {
		type: CHOICE,
		members: members as StringRule[],
		...(source !== undefined ? { metadata: { source } } : {})
	} satisfies ChoiceRule;
}

export type SupertypeRule<T extends PhaseName = 'optimize'> = RuleBase<T> & {
	readonly type: typeof SUPERTYPE;
	readonly name: string;
	readonly subtypes: string[];
	readonly source?: RuleSource;
}

export type GroupRule<T extends PhaseName = 'optimize'> = RuleBase<T> & {
	readonly type: typeof GROUP;
	readonly name: string;
	readonly content: Rule<T>;
}

// ---------------------------------------------------------------------------
// Terminals
// ---------------------------------------------------------------------------

export type StringRule<T extends PhaseName = 'optimize'> = RuleBase<T> & {
	readonly type: typeof STRING;
	readonly value: string;
}

export type PatternRule<T extends PhaseName = 'optimize'> = RuleBase<T> & {
	readonly type: typeof PATTERN;
	readonly value: string;
}

// ---------------------------------------------------------------------------
// Structural whitespace
// ---------------------------------------------------------------------------

export type IndentRule<T extends PhaseName = 'optimize'> = RuleBase<T> & {
	readonly type: typeof INDENT;
}

export type DedentRule<T extends PhaseName = 'optimize'> = RuleBase<T> & {
	readonly type: typeof DEDENT;
}

export type NewlineRule<T extends PhaseName = 'optimize'> = RuleBase<T> & {
	readonly type: typeof NEWLINE;
}

// ---------------------------------------------------------------------------
// References. Symbol refs persist through EVERY phase (wrapper-deletion
// stamps fieldName/multiplicity/separator onto them as leaves — that is the
// core of the RenderRule design). alias/token are consumed by Link and only
// exist in the WrapperPhase views.
// ---------------------------------------------------------------------------

export type SymbolRule<T extends PhaseName = 'optimize'> = RuleBase<T> & {
	readonly type: typeof SYMBOL;
	readonly name: string;
	readonly source?: 'grammar' | 'link' | 'group-lift';
	/** Original literal text when Link synthesized this ref from a string token. */
	readonly literal?: string;
	readonly hidden?: boolean;
	readonly supertype?: boolean;
	/**
	 * Alias provenance: when this symbol was produced by resolving
	 * `alias($.aliasedFrom, $.name)`, `aliasedFrom` is the source kind
	 * whose shape the parse tree body follows (while tree-sitter emits
	 * the node with `$type === name`, the alias target). Preserved so
	 * the wrap emitter can rewrite \$type at drill-in via drillAs().
	 * Used by the wrap emitter for alias-target rewrites.
	 */
	readonly aliasedFrom?: string;
}

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
// Prefer these over inline `r.type === 'seq'` checks in `.filter()`,
// `.find()`, `.some()`, `.every()`, and standalone predicates — they
// narrow the rule type through the callback (no `as SeqRule` casts
// downstream). Inside a `switch (rule.type)` stay with literal case
// arms so TS exhaustiveness checking catches missing variants when
// new Rule types are added.
// ---------------------------------------------------------------------------

// Phase-generic: each guard narrows WITHIN the caller's phase view (for a
// view where the variant cannot exist — e.g. isOptional on Rule<'optimize'>
// — the narrowed type is `never`, surfacing the dead check at compile time).
export const isSeq = <R extends AnyRule>(r: R): r is Extract<R, { type: typeof SEQ }> => r.type === SEQ;
export const isChoice = <R extends AnyRule>(r: R): r is Extract<R, { type: typeof CHOICE }> => r.type === CHOICE;
export const isOptional = <R extends AnyRule>(r: R): r is Extract<R, { type: typeof OPTIONAL }> => r.type === OPTIONAL;
export const isRepeat = <R extends AnyRule>(r: R): r is Extract<R, { type: typeof REPEAT }> => r.type === REPEAT;
export const isRepeat1 = <R extends AnyRule>(r: R): r is Extract<R, { type: typeof REPEAT1 }> => r.type === REPEAT1;
export const isField = <R extends AnyRule>(r: R): r is Extract<R, { type: typeof FIELD }> => r.type === FIELD;

export const isEnum = <R extends AnyRule>(r: R): r is Extract<R, { type: typeof CHOICE }> => isEnumChoiceRule(r);
export const isGroup = <R extends AnyRule>(r: R): r is Extract<R, { type: typeof GROUP }> => r.type === GROUP;
// isTerminal removed (PR-P Task 2): TerminalRule deleted; terminals classify by shape
export const isString = <R extends AnyRule>(r: R): r is Extract<R, { type: typeof STRING }> => r.type === STRING;
export const isSymbol = <R extends AnyRule>(r: R): r is Extract<R, { type: typeof SYMBOL }> => r.type === SYMBOL;
export const isAlias = <R extends AnyRule>(r: R): r is Extract<R, { type: typeof ALIAS }> => r.type === ALIAS;
export const isLinkSymbol = <R extends AnyRule>(r: R): r is Extract<R, { type: typeof SYMBOL }> =>
	r.type === SYMBOL && r.source === 'link';
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
			return { ...rule, content: replaceAtPathRec((rule as { content: AnyRule }).content, segments, depth + 1, replacement) } as AnyRule;
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
