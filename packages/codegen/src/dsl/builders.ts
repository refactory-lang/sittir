import {
	ALIAS,
	CHOICE,
	DEDENT,
	FIELD,
	GROUP,
	INDENT,
	NEWLINE,
	OPTIONAL,
	PATTERN,
	REPEAT,
	REPEAT1,
	SEQ,
	STRING,
	SUPERTYPE,
	SYMBOL,
	TOKEN,
	VARIANT
} from '../types/rule-types.ts'; // @rule-type-consts
import type {
	AliasRule,
	AnyRule,
	ChoiceRule,
	DedentRule,
	FieldRule,
	GroupRule,
	ImmediateTokenRule,
	IndentRule,
	NewlineRule,
	PatternRule,
	PhaseName,
	Rule,
	RuleId,
	SeqRule,
	StringRule,
	SupertypeRule,
	SymbolRule,
	TokenRule,
	VariantRule
} from '../types/rule.ts';
import { isSpliceableBareSeq } from './rule-patterns.ts';
import { withAttrsFrom } from './rule-attrs.ts';
import { combineMultiplicity, type LeafMultiplicity } from './rule-transforms.ts';
import { makeRuleMetadata } from './rule-metadata.ts';

export type PrecKind = 'left' | 'right' | 'dynamic' | undefined;

export interface TokenBuilder<P extends PhaseName> {
	(content: Rule<P>): Rule<P>;
	immediate(content: Rule<P>): Rule<P>;
}

export interface PrecBuilder<P extends PhaseName> {
	(value: number, content: Rule<P>): Rule<P>;
	left(value: number, content: Rule<P>): Rule<P>;
	right(value: number, content: Rule<P>): Rule<P>;
	dynamic(value: number, content: Rule<P>): Rule<P>;
}

export interface RuleBuilder<P extends PhaseName> {
	seq(...members: Rule<P>[]): Rule<P>;
	choice(...members: Rule<P>[]): Rule<P>;
	optional(content: Rule<P>): Rule<P>;
	repeat(content: Rule<P>): Rule<P>;
	repeat1(content: Rule<P>): Rule<P>;
	field(name: string, content: Rule<P>): Rule<P>;
	alias(content: Rule<P>, target: string | SymbolRule<P>): Rule<P>;
	token: TokenBuilder<P>;
	prec: PrecBuilder<P>;
	variant(name: string, content: Rule<P>): VariantRule<P>;
	group(name: string, content: Rule<P>): GroupRule<P>;
	string(value: string): StringRule<P>;
	pattern(value: string): PatternRule<P>;
	symbol(name: string): SymbolRule<P>;
	supertype(name: string, subtypes: SymbolRule<P>[]): SupertypeRule<P>;
	indent(): IndentRule<P>;
	dedent(): DedentRule<P>;
	newline(): NewlineRule<P>;
}

export interface StructuralToken extends TokenBuilder<'evaluate'> {
	(content: Rule<'evaluate'>): TokenRule<'evaluate'>;
	immediate(content: Rule<'evaluate'>): ImmediateTokenRule<'evaluate'>;
}

export interface StructuralBuilder extends RuleBuilder<'evaluate'> {
	field(name: string, content: Rule<'evaluate'>): FieldRule<'evaluate'>;
	alias(content: Rule<'evaluate'>, target: string | SymbolRule<'evaluate'>): AliasRule<'evaluate'>;
	token: StructuralToken;
}

export interface AttributeBuilder extends RuleBuilder<'normalize'> {
	choice(...members: Rule<'normalize'>[]): ChoiceRule<'normalize'>;
}

export function withId<R extends AnyRule>(rule: R, id: RuleId | undefined): R {
	return id !== undefined ? { ...rule, id } : rule;
}

type Structural = Rule<'evaluate'>;

const structuralToken: StructuralToken = Object.assign(
	(content: Structural): TokenRule<'evaluate'> => ({ type: TOKEN, content, immediate: false }),
	{ immediate: (content: Structural): ImmediateTokenRule<'evaluate'> => ({ type: 'IMMEDIATE_TOKEN', content }) }
);

const structuralPrecOf =
	(kind: PrecKind) =>
	(value: number, content: Structural): Structural => ({
		type:
			kind === 'left' ? 'PREC_LEFT' : kind === 'right' ? 'PREC_RIGHT' : kind === 'dynamic' ? 'PREC_DYNAMIC' : 'PREC',
		content,
		value
	});

const structuralPrec: PrecBuilder<'evaluate'> = Object.assign(structuralPrecOf(undefined), {
	left: structuralPrecOf('left'),
	right: structuralPrecOf('right'),
	dynamic: structuralPrecOf('dynamic')
});

function collapseStructuralOptional(content: Structural): Structural {
	if (content.type === OPTIONAL) return content;
	if (content.type === REPEAT) return content;
	if (content.type === REPEAT1) {
		return {
			type: REPEAT,
			content: content.content,
			separator: content.separator,
			trailing: content.trailing,
			leading: content.leading
		};
	}
	return { type: OPTIONAL, content };
}

function collapseStructuralRepeat(content: Structural): Structural {
	if (content.type === REPEAT && !content.separator) return content;
	if (content.type === OPTIONAL) return { type: REPEAT, content: content.content };
	return { type: REPEAT, content };
}

function collapseStructuralRepeat1(content: Structural): Structural {
	if (content.type === REPEAT1 && !content.separator) return content;
	return { type: REPEAT1, content };
}

function collapseOptionalRepeatInFieldContent(content: Structural): Structural {
	if (content.type !== OPTIONAL) return content;
	const inner = content.content;
	if (inner.type === REPEAT) return inner;
	if (inner.type === REPEAT1) {
		return {
			type: REPEAT,
			content: inner.content,
			separator: inner.separator,
			trailing: inner.trailing,
			leading: inner.leading
		};
	}
	return content;
}

function collapseAllFieldChoiceMembers(fieldMembers: FieldRule<'evaluate'>[]): Structural {
	const anyAlias = fieldMembers.some((f) => f.content.type === ALIAS);
	if (anyAlias) return { type: CHOICE, members: fieldMembers };
	const names = fieldMembers.map((f) => f.name);
	const allSameName = names.every((n) => n === names[0]);
	if (allSameName) {
		return {
			type: FIELD,
			name: names[0]!,
			content: { type: CHOICE, members: fieldMembers.map((f) => f.content) },
			metadata: makeRuleMetadata({ fieldSource: 'grammar' })
		};
	}
	return { type: CHOICE, members: fieldMembers };
}

function structuralChoice(...members: Structural[]): Structural {
	if (members.length >= 2 && members.every((m) => m.type === FIELD)) {
		return collapseAllFieldChoiceMembers(members);
	}
	return { type: CHOICE, members };
}

export const structuralBuilder: StructuralBuilder = {
	seq: (...members) => ({ type: SEQ, members }),
	choice: structuralChoice,
	optional: collapseStructuralOptional,
	repeat: collapseStructuralRepeat,
	repeat1: collapseStructuralRepeat1,
	field: (name, content) => ({ type: FIELD, name, content: collapseOptionalRepeatInFieldContent(content) }),
	alias: (content, target) => ({
		type: ALIAS,
		content,
		named: typeof target !== 'string',
		value: typeof target === 'string' ? target : target.name
	}),
	token: structuralToken,
	prec: structuralPrec,
	variant: (name, content) => ({ type: VARIANT, name, content }),
	group: (name, content) => ({ type: GROUP, name, content }),
	string: (value) => ({ type: STRING, value }),
	pattern: (value) => ({ type: PATTERN, value }),
	symbol: (name) => ({ type: SYMBOL, name }),
	supertype: (name, subtypes) => ({ type: SUPERTYPE, name, subtypes }),
	indent: () => ({ type: INDENT }),
	dedent: () => ({ type: DEDENT }),
	newline: () => ({ type: NEWLINE })
};

type Built = Rule<'normalize'>;
type BuiltSeq = SeqRule<'normalize'>;

function collapseSingletonSeq(seq: BuiltSeq): Built {
	const survivor = seq.members[0]!;
	const carried = withAttrsFrom(seq, survivor);
	if (seq.multiplicity !== undefined) {
		const combined = combineMultiplicity(seq.multiplicity, survivor.multiplicity);
		if (combined !== undefined) return { ...carried, multiplicity: combined };
	}
	return carried;
}

function buildSeq(input: { members: Built[]; multiplicity?: LeafMultiplicity }): Built {
	const { members: splicedInput, multiplicity } = input;
	const rawMembers = splicedInput.flatMap((m) => (isSpliceableBareSeq(m) ? m.members : [m]));
	const multToPush = multiplicity === 'nonEmptyArray' ? 'array' : multiplicity;
	const pushed = rawMembers.map((m) => {
		const isBareLiteral = (m.type === STRING || m.type === PATTERN) && !isSlotPromotedLiteral(m);
		if (multToPush === undefined || isBareLiteral) return m;
		const combined = combineMultiplicity(multToPush, m.multiplicity);
		return combined !== undefined ? { ...m, multiplicity: combined } : m;
	});
	const hasBareLiteral = rawMembers.some((m) => m.type === STRING || m.type === PATTERN);
	const seq: BuiltSeq = { type: SEQ, members: pushed };
	const withMult: BuiltSeq = hasBareLiteral && multToPush !== undefined ? { ...seq, multiplicity: multToPush } : seq;
	return pushed.length === 1 ? collapseSingletonSeq(withMult) : withMult;
}

function slotShaped(rule: Built): boolean {
	switch (rule.type) {
		case SYMBOL:
		case SUPERTYPE:
		case PATTERN:
		case CHOICE:
			return true;
		default:
			return false;
	}
}

export function overlaySeq(content: BuiltSeq, built: Built): Built {
	const merged: Built & { members?: Built[] } = { ...content, ...built };
	if (!('members' in built)) delete merged.members;
	return merged;
}

export function buildOptional(content: Built): Built {
	const nonterminal = content.nonterminal || slotShaped(content) || undefined;
	if (content.type === SEQ) {
		const built = buildSeq({
			members: content.members,
			multiplicity: combineMultiplicity('optional', content.multiplicity)
		});
		const merged = overlaySeq(content, built);
		return nonterminal !== undefined ? { ...merged, nonterminal } : merged;
	}
	return {
		...content,
		multiplicity: combineMultiplicity('optional', content.multiplicity),
		...(nonterminal !== undefined ? { nonterminal } : {})
	};
}

function foldOptionalEmptyMatch(content: Built): Built {
	const emptySeq = (): Built => withId({ type: SEQ, members: [] }, content.id);
	if (content.type === SEQ && content.members.length === 0) return emptySeq();
	if (content.type === STRING && !isSlotPromotedLiteral(content)) return emptySeq();
	return buildOptional(content);
}

function repeatCombine(input: {
	contentMult: LeafMultiplicity;
	native: 'array' | 'nonEmptyArray';
}): 'array' | 'nonEmptyArray' {
	const { contentMult, native } = input;
	if (contentMult === 'optional') return native;
	const combined = combineMultiplicity(contentMult, native);
	return combined === 'array' || combined === 'nonEmptyArray' ? combined : native;
}

function buildRepeatLike(input: { content: Built; native: 'array' | 'nonEmptyArray' }): Built {
	const { content, native } = input;
	const separator = content.separator;
	const elided = content.multiplicity === 'optional' && separator !== undefined ? true : undefined;
	const optionalElement = elided ?? content.optionalElement;
	const stamps = {
		nonterminal: true,
		...(separator !== undefined ? { separator } : {}),
		...(optionalElement !== undefined ? { optionalElement } : {})
	};
	if (content.type === SEQ) {
		const built = buildSeq({
			members: content.members,
			multiplicity: repeatCombine({ contentMult: content.multiplicity, native })
		});
		return { ...overlaySeq(content, built), ...stamps };
	}
	return { ...content, multiplicity: repeatCombine({ contentMult: content.multiplicity, native }), ...stamps };
}

const attributeToken: TokenBuilder<'normalize'> = Object.assign(
	(content: Built): Built => ({ ...content, tokenized: true }),
	{ immediate: (content: Built): Built => ({ ...content, tokenized: true, immediate: true }) }
);

const attributePrecOf =
	(kind: PrecKind) =>
	(value: number, content: Built): Built => ({ ...content, prec: { kind, value } });

const attributePrec: PrecBuilder<'normalize'> = Object.assign(attributePrecOf(undefined), {
	left: attributePrecOf('left'),
	right: attributePrecOf('right'),
	dynamic: attributePrecOf('dynamic')
});

export const attributeBuilder: AttributeBuilder = {
	seq: (...members) => buildSeq({ members }),
	choice: (...members) => ({ type: CHOICE, members }),
	optional: (content) => foldOptionalEmptyMatch(content),
	repeat: (content) => buildRepeatLike({ content, native: 'array' }),
	repeat1: (content) => buildRepeatLike({ content, native: 'nonEmptyArray' }),
	field: (name, content) => ({ ...content, fieldName: name, nonterminal: true }),
	alias: (content, target) => {
		const named = typeof target !== 'string';
		const name = typeof target === 'string' ? target : target.name;
		const nonterminal = content.nonterminal || named || undefined;
		if (content.type === SYMBOL) {
			return { ...content, name, aliasedFrom: content.name, aliasNamed: named, inline: false, nonterminal };
		}
		if (content.type === STRING) {
			const { value: literal, ...rest } = content;
			return { ...rest, type: SYMBOL, name, literal, inline: false, aliasNamed: named, nonterminal };
		}
		return { ...content, aliasNamed: named, inline: false, nonterminal };
	},
	token: attributeToken,
	prec: attributePrec,
	variant: (name, content) => ({ type: VARIANT, name, content }),
	group: (name, content) => ({ type: GROUP, name, content }),
	string: (value) => ({ type: STRING, value }),
	pattern: (value) => ({ type: PATTERN, value }),
	symbol: (name) => ({ type: SYMBOL, name }),
	supertype: (name, subtypes) => ({ type: SUPERTYPE, name, subtypes }),
	indent: () => ({ type: INDENT }),
	dedent: () => ({ type: DEDENT }),
	newline: () => ({ type: NEWLINE })
};

export function isSlotPromotedLiteral(rule: Built): boolean {
	return rule.nonterminal === true;
}
