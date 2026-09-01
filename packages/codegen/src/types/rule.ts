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

export type RuleId = string;

export type Multiplicity = 'optional' | 'single' | 'array' | 'nonEmptyArray';

export type PhaseName = 'evaluate' | 'link' | 'normalize' | 'simplify';

export type NormalizedPhase = 'normalize' | 'simplify';
export type WrapperPhase = 'evaluate' | 'link';

export type AnyRule = Rule<PhaseName>;

export type RuleAnnotations = {
	readonly variant?: string;
	readonly variantOf?: string;
};

export type RuleBase<Phase extends PhaseName = 'normalize'> = {
	readonly id?: RuleId;

	readonly inline?: boolean;

	readonly hidden?: boolean;

	readonly inlinedFrom?: string;

	readonly absorbedIds?: readonly RuleId[];

	readonly metadata?: RuleMetadata;

	readonly splicedBody?: boolean;

	readonly variantArms?: readonly string[];

	readonly annotations?: RuleAnnotations;
} & (Phase extends NormalizedPhase
	? {
			readonly fieldName?: string;
			readonly multiplicity?: Multiplicity;
			readonly nonterminal?: boolean;

			readonly separator?: RuleSeparator<Rule<Phase>>;

			readonly optionalElement?: boolean;

			readonly tokenized?: boolean;
			readonly immediate?: boolean;

			readonly staticSeamBefore?: 'glued' | 'spaced';

			readonly prec?: {
				readonly kind: 'left' | 'right' | 'dynamic' | undefined;
				readonly value: number | string;
			};
		}
	: {});

export type Rule<Phase extends PhaseName = 'normalize'> =
	| SeqRule<Phase>
	| ChoiceRule<Phase>
	| VariantRule<Phase>
	| SupertypeRule<Phase>
	| GroupRule<Phase>
	| StringRule<Phase>
	| PatternRule<Phase>
	| IndentRule<Phase>
	| DedentRule<Phase>
	| NewlineRule<Phase>
	| SymbolRule<Phase>
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

export type DelimiterMode = 'mandatory' | 'optional';

export type RuleSeparator<V = Rule> = {
	readonly value: V;
	readonly trailing?: DelimiterMode;
	readonly leading?: DelimiterMode;
	readonly terminated?: true;
};

export type RepeatRule<T extends PhaseName = 'link'> = T extends 'link'
	? RuleBase<T> & {
			readonly type: typeof REPEAT;
			readonly content: Rule<T>;
			readonly separator?: RuleSeparator<Rule<T>>;
		}
	: T extends 'evaluate'
		? RuleBase<T> & {
				readonly type: typeof REPEAT;
				readonly content: Rule<T>;
				readonly separator?: string;
				readonly trailing?: DelimiterMode;
				readonly leading?: DelimiterMode;
			}
		: never;

export type Repeat1Rule<T extends PhaseName = 'link'> = T extends 'link'
	? RuleBase<T> & {
			readonly type: typeof REPEAT1;
			readonly content: Rule<T>;
			readonly separator?: RuleSeparator<Rule<T>>;
		}
	: T extends 'evaluate'
		? RuleBase<T> & {
				readonly type: typeof REPEAT1;
				readonly content: Rule<T>;
				readonly separator?: string;
				readonly trailing?: DelimiterMode;
				readonly leading?: DelimiterMode;
			}
		: never;

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

export type EnumRule<T extends PhaseName = 'normalize'> = ChoiceRule<T>;

export type SupertypeRule<T extends PhaseName = 'normalize'> = RuleBase<T> & {
	readonly type: typeof SUPERTYPE;
	readonly name: string;
	readonly subtypes: SymbolRule<T>[];
};

export function subtypeParseNamesOf<T extends PhaseName>(rule: SupertypeRule<T>): Readonly<Record<string, string>> {
	const pairs: Record<string, string> = {};
	for (const s of rule.subtypes) {
		if (s.aliasedTo !== undefined && s.aliasedTo !== s.name) pairs[s.name] = s.aliasedTo;
	}
	return pairs;
}

export function aliasRestampRequired(parseKindId: number | undefined, storageKindId: number | undefined): boolean {
	return parseKindId === undefined || storageKindId === undefined || parseKindId !== storageKindId;
}

export function subtypeRestampPairsOf<T extends PhaseName>(
	rule: SupertypeRule<T>
): ReadonlyArray<readonly [string, string]> {
	const pairs: (readonly [string, string])[] = [];
	for (const s of rule.subtypes) {
		if (s.aliasedTo === undefined || s.aliasedTo === s.name) continue;
		if (!aliasRestampRequired(s.aliasedToId, s.kindId)) continue;
		pairs.push([s.aliasedTo, s.name]);
	}
	return pairs;
}

export interface TransitiveSubtypeRef {
	readonly storageKind: string;
	readonly storageKindId?: number;
	readonly kindId?: number;
}

export function transitiveParseKinds<T extends PhaseName>(
	startName: string,
	lookup: (name: string) => SupertypeRule<T> | undefined
): ReadonlyMap<string, TransitiveSubtypeRef> {
	const kinds = new Map<string, TransitiveSubtypeRef>();
	const visited = new Set<string>();
	function add(name: string, storageKind: string, storageKindId: number | undefined, kindId: number | undefined): void {
		if (kinds.has(name)) return;
		kinds.set(name, { storageKind, storageKindId, kindId });
	}
	function visit(name: string): void {
		if (visited.has(name)) return;
		visited.add(name);
		const rule = lookup(name);
		if (!rule) return;
		for (const s of rule.subtypes) {
			if (s.aliasedTo !== undefined && s.aliasedTo !== s.name) {
				add(s.aliasedTo, s.name, s.kindId, s.aliasedToId);
			}
		}
		for (const s of rule.subtypes) {
			if (lookup(s.name)) {
				visit(s.name);
			} else {
				add(s.name, s.name, s.kindId, s.kindId);
			}
		}
	}
	visit(startName);
	return kinds;
}

export type GroupRule<T extends PhaseName = 'normalize'> = RuleBase<T> & {
	readonly type: typeof GROUP;
	readonly name: string;
	readonly content: Rule<T>;
};

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

export type IndentRule<T extends PhaseName = 'normalize'> = RuleBase<T> & {
	readonly type: typeof INDENT;
};

export type DedentRule<T extends PhaseName = 'normalize'> = RuleBase<T> & {
	readonly type: typeof DEDENT;
};

export type NewlineRule<T extends PhaseName = 'normalize'> = RuleBase<T> & {
	readonly type: typeof NEWLINE;
};

export type SymbolRule<T extends PhaseName = 'normalize'> = RuleBase<T> & {
	readonly type: typeof SYMBOL;
	readonly name: string;
	readonly literal?: string;
	readonly aliasedTo?: string;
	readonly kindId?: number;
	readonly aliasedToId?: number;
};

export type AliasRule<Phase extends PhaseName = 'link'> = Phase extends WrapperPhase
	? RuleBase<Phase> & {
			readonly type: typeof ALIAS;
			readonly content: Rule<Phase>;
			readonly named: boolean;
			readonly value: string;
			readonly kindId?: number;
		}
	: never;

export type TokenRule<Phase extends PhaseName = 'link'> = Phase extends WrapperPhase
	? RuleBase<Phase> & {
			readonly type: typeof TOKEN;
			readonly content: Rule<Phase>;
			readonly immediate: boolean;
		}
	: never;

export type ImmediateTokenRule<Phase extends PhaseName = 'evaluate'> = Phase extends 'evaluate'
	? RuleBase<Phase> & { readonly type: 'IMMEDIATE_TOKEN'; readonly content: Rule<Phase> }
	: never;

export type PrecRule<Phase extends PhaseName = 'evaluate'> = Phase extends 'evaluate'
	? RuleBase<Phase> & { readonly type: 'PREC'; readonly content: Rule<Phase>; readonly value: number | string }
	: never;
export type PrecLeftRule<Phase extends PhaseName = 'evaluate'> = Phase extends 'evaluate'
	? RuleBase<Phase> & { readonly type: 'PREC_LEFT'; readonly content: Rule<Phase>; readonly value: number | string }
	: never;
export type PrecRightRule<Phase extends PhaseName = 'evaluate'> = Phase extends 'evaluate'
	? RuleBase<Phase> & { readonly type: 'PREC_RIGHT'; readonly content: Rule<Phase>; readonly value: number | string }
	: never;
export type PrecDynamicRule<Phase extends PhaseName = 'evaluate'> = Phase extends 'evaluate'
	? RuleBase<Phase> & { readonly type: 'PREC_DYNAMIC'; readonly content: Rule<Phase>; readonly value: number }
	: never;

export const isSeq = <R extends AnyRule>(r: R): r is Extract<R, { type: typeof SEQ }> => r.type === SEQ;
export const isChoice = <R extends AnyRule>(r: R): r is Extract<R, { type: typeof CHOICE }> => r.type === CHOICE;
export const isOptional = <R extends AnyRule>(r: R): r is Extract<R, { type: typeof OPTIONAL }> => r.type === OPTIONAL;
export const isRepeat = <R extends AnyRule>(r: R): r is Extract<R, { type: typeof REPEAT }> => r.type === REPEAT;
export const isRepeat1 = <R extends AnyRule>(r: R): r is Extract<R, { type: typeof REPEAT1 }> => r.type === REPEAT1;
export const isField = <R extends AnyRule>(r: R): r is Extract<R, { type: typeof FIELD }> => r.type === FIELD;

export const isGroup = <R extends AnyRule>(r: R): r is Extract<R, { type: typeof GROUP }> => r.type === GROUP;
export const isString = <R extends AnyRule>(r: R): r is Extract<R, { type: typeof STRING }> => r.type === STRING;
export const isSymbol = <R extends AnyRule>(r: R): r is Extract<R, { type: typeof SYMBOL }> => r.type === SYMBOL;
export const isAlias = <R extends AnyRule>(r: R): r is Extract<R, { type: typeof ALIAS }> => r.type === ALIAS;
export const isLinkSymbol = <R extends AnyRule>(r: R): r is Extract<R, { type: typeof SYMBOL }> =>
	r.type === SYMBOL && r.literal !== undefined;
export const literalTextOf = (r: AnyRule): string | undefined =>
	r.type === STRING ? r.value : isLinkSymbol(r) ? r.literal : undefined;

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

export interface SymbolRef {
	refType: 'symbol' | 'alias' | 'token';
	from: string;
	to: string;
	fromRuleId?: RuleId;
	fieldName?: string;
	optional?: boolean;
	repeated?: boolean;
	position?: number;
}

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

export function sym(name: string): SymbolRule<'evaluate'> {
	return { type: SYMBOL, name, inline: name.startsWith('_') };
}

export function isIdentifierLike(value: string): boolean {
	return /^[A-Za-z_]\w*$/.test(value);
}
