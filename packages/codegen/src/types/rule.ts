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

export type Multiplicity = 'optional' | 'single' | 'array' | 'nonEmptyArray';

export type PhaseName = 'evaluate' | 'link' | 'normalize' | 'simplify';

type NormalizedPhase = 'normalize' | 'simplify';
type WrapperPhase = 'evaluate' | 'link';

export type AnyRule = Rule<PhaseName>;

export type RuleBase<Phase extends PhaseName = 'normalize'> = {
	readonly id?: RuleId;

	readonly inline?: boolean;

	readonly metadata?: RuleMetadata;

	readonly splicedBody?: boolean;

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

			readonly separator?: {
				readonly value: Rule<Phase>;
				readonly trailing?: SeparatorFlankMode;
				readonly leading?: SeparatorFlankMode;
			};

			readonly aliasedFrom?: string;
			readonly aliasNamed?: boolean;
		}
	: {});

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
	| TokenRule<Phase>
	| ImmediateTokenRule<Phase>
	| PrecRule<Phase>
	| PrecLeftRule<Phase>
	| PrecRightRule<Phase>
	| PrecDynamicRule<Phase>;

export type RenderRule = Rule<'normalize'> & {
	readonly __renderRule?: never;
};

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

export type SeparatorFlankMode = 'mandatory' | 'optional';

export type RepeatRule<T extends PhaseName = 'link'> = T extends 'link'
	? RuleBase<T> & {
			readonly type: typeof REPEAT;
			readonly content: Rule<T>;
			readonly separator?: {
				readonly value: Rule<T>;
				readonly trailing?: SeparatorFlankMode;
				readonly leading?: SeparatorFlankMode;
			};
		}
	: T extends 'evaluate'
		? RuleBase<T> & {
				readonly type: typeof REPEAT;
				readonly content: Rule<T>;
				readonly separator?: string;
				readonly trailing?: SeparatorFlankMode;
				readonly leading?: SeparatorFlankMode;
			}
		: never;

export type Repeat1Rule<T extends PhaseName = 'link'> = T extends 'link'
	? RuleBase<T> & {
			readonly type: typeof REPEAT1;
			readonly content: Rule<T>;
			readonly separator?: {
				readonly value: Rule<T>;
				readonly trailing?: SeparatorFlankMode;
				readonly leading?: SeparatorFlankMode;
			};
		}
	: T extends 'evaluate'
		? RuleBase<T> & {
				readonly type: typeof REPEAT1;
				readonly content: Rule<T>;
				readonly separator?: string;
				readonly trailing?: SeparatorFlankMode;
				readonly leading?: SeparatorFlankMode;
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

export type EnumRule<T extends PhaseName = 'normalize'> = ChoiceRule<T>;

export function isEnumChoiceRule<R extends AnyRule>(
	rule: R
): rule is Extract<R, { type: typeof CHOICE }> & { readonly __enumShaped?: never } {
	return (
		rule.type === CHOICE &&
		rule.members.length >= 2 &&
		// STRING members and literal-carrying link SYMBOLs (`isLinkSymbol`,
		// canonicalized operators AND aliased fixed-text externals like
		// `automatic_semicolon`) are both terminal-valued — `literalTextOf`
		// serves both shapes uniformly downstream.
		rule.members.every((m) => m.type === STRING || (m.type === SYMBOL && m.literal !== undefined))
	);
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

export type SupertypeRule<T extends PhaseName = 'normalize'> = RuleBase<T> & {
	readonly type: typeof SUPERTYPE;
	readonly name: string;
	readonly subtypes: string[];

	readonly subtypeParseNames?: Readonly<Record<string, string>>;
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
	readonly resolvedKindId?: number;
};

export type PatternRule<T extends PhaseName = 'normalize'> = RuleBase<T> & {
	readonly type: typeof PATTERN;
	readonly value: string;
	readonly resolvedKindId?: number;
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

export type SymbolRule<T extends PhaseName = 'normalize'> = RuleBase<T> & {
	readonly type: typeof SYMBOL;
	readonly name: string;
	readonly literal?: string;
	readonly hidden?: boolean;
	readonly aliasedFrom?: string;
	readonly kindId?: number;
	readonly aliasedFromId?: number;
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

// ImmediateTokenRule exists ONLY within the 'evaluate' phase view.
// `token.immediate()` constructs this real IMMEDIATE_TOKEN-tagged node
// (matching tree-sitter's own dsl.js shape, and grammar-shapes/grammar-json.ts's
// existing `ImmediateTokenRule` model of it) instead of folding straight into
// `TokenRule`'s `immediate: true` — so a dedup/equality check running during
// enrich (e.g. dsl/list-patterns.ts's `rulesEqual`, which dispatches purely on
// `type`) sees the SAME distinct tag under both runtimes, matching tree-sitter's
// CLI-runtime `token.immediate()` which was never foldable to sittir's shape in
// the first place. `grammarFn`'s `normalizeImmediateTokens` folds every
// remaining IMMEDIATE_TOKEN into `TokenRule` + `immediate: true` once enrich's
// decisions are locked in, matching what the compiler pipeline (Link onward)
// already expects — see docs/glossary/compiler-model.md's `NodeRef.immediate`.
export type ImmediateTokenRule<Phase extends PhaseName = 'evaluate'> = Phase extends 'evaluate'
	? RuleBase<Phase> & { readonly type: 'IMMEDIATE_TOKEN'; readonly content: Rule<Phase> }
	: never;

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
export type PrecRule<Phase extends PhaseName = 'evaluate'> = Phase extends 'evaluate'
	? RuleBase<Phase> & { readonly type: 'PREC'; readonly content: Rule<Phase>; readonly value: number }
	: never;
export type PrecLeftRule<Phase extends PhaseName = 'evaluate'> = Phase extends 'evaluate'
	? RuleBase<Phase> & { readonly type: 'PREC_LEFT'; readonly content: Rule<Phase>; readonly value: number }
	: never;
export type PrecRightRule<Phase extends PhaseName = 'evaluate'> = Phase extends 'evaluate'
	? RuleBase<Phase> & { readonly type: 'PREC_RIGHT'; readonly content: Rule<Phase>; readonly value: number }
	: never;
export type PrecDynamicRule<Phase extends PhaseName = 'evaluate'> = Phase extends 'evaluate'
	? RuleBase<Phase> & { readonly type: 'PREC_DYNAMIC'; readonly content: Rule<Phase>; readonly value: number }
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
export const isLinkSymbol = <R extends AnyRule>(r: R): r is Extract<R, { type: typeof SYMBOL }> =>
	r.type === SYMBOL && r.literal !== undefined;
export const literalTextOf = (r: AnyRule): string | undefined =>
	r.type === STRING ? r.value : isLinkSymbol(r) ? r.literal : undefined;

// ---------------------------------------------------------------------------
// Tree walkers — pure Rule-tree projections, no AssembledNode concepts
// ---------------------------------------------------------------------------

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
// `polymorphs:` / `transforms:` / `groups:` in grammar.sittir.ts. See
// docs/superpowers/specs/2026-05-15-024-assembled-group-synthesis-design.md
// for the path semantics.
// ---------------------------------------------------------------

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

export function sym(name: string): SymbolRule {
	return { type: SYMBOL, name, hidden: name.startsWith('_'), inline: name.startsWith('_') };
}
