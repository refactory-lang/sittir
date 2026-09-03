import {
	isBlankType,
	isChoiceType,
	isFieldType,
	isOptionalType,
	isPrecWrapper,
	isRepeatType,
	isSeqType,
	isStringType,
	isSymbolType,
	typeEq,
	type RuntimeRule
} from '../types/runtime-shapes.ts';
import { matchesWordShape } from '../util/word-matcher.ts';
import {
	ALIAS,
	CHOICE,
	DEDENT,
	FIELD,
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
} from '../types/rule-types.ts'; // @rule-type-consts
import type { AnyRule, ChoiceRule, PhaseName, RenderRule, RepeatRule, Rule, SeqRule } from '../types/rule.ts';
import { assertNever } from '../polymorph-variant.ts';
import { RuleWalker } from './rule-walker.ts';

export function classifyByType(
	ruleType: Rule<'evaluate'>['type'],
	anyChildNonterminal: boolean
): 'terminal' | 'nonterminal' {
	switch (ruleType) {
		case SYMBOL:
		case SUPERTYPE:
		case PATTERN:
			return 'nonterminal';
		case CHOICE:
		case REPEAT:
		case REPEAT1:
			return 'nonterminal';
		case STRING:
		case INDENT:
		case DEDENT:
		case NEWLINE:
			return 'terminal';
		case TOKEN:
		case FIELD:
		case ALIAS:
		case SEQ:
		case OPTIONAL:
		case 'PREC':
		case 'PREC_LEFT':
		case 'PREC_RIGHT':
		case 'PREC_DYNAMIC':
		case 'IMMEDIATE_TOKEN':
			return anyChildNonterminal ? 'nonterminal' : 'terminal';
		default:
			return assertNever(ruleType);
	}
}

export function isNonterminalRuleType<Phase extends PhaseName>(rule: Rule<Phase>): boolean {
	const anyChildNonterminal = ruleChildren(rule).some((child) => isNonterminalRuleType(child));
	return classifyByType(rule.type, anyChildNonterminal) === 'nonterminal';
}

function ruleChildren<Phase extends PhaseName>(rule: Rule<Phase>): readonly Rule<Phase>[] {
	const anyRule = rule as AnyRule;
	switch (anyRule.type) {
		case TOKEN:
		case FIELD:
		case ALIAS:
		case OPTIONAL:
		case 'PREC':
		case 'PREC_LEFT':
		case 'PREC_RIGHT':
		case 'PREC_DYNAMIC':
		case 'IMMEDIATE_TOKEN':
			return [anyRule.content as Rule<Phase>];
		case SEQ:
			return anyRule.members as Rule<Phase>[];
		case CHOICE:
		case REPEAT:
		case REPEAT1:
			return (anyRule.type === CHOICE ? anyRule.members : [anyRule.content]) as Rule<Phase>[];
		case SYMBOL:
		case SUPERTYPE:
		case PATTERN:
		case STRING:
		case INDENT:
		case DEDENT:
		case NEWLINE:
			return [];
		default:
			return assertNever(anyRule);
	}
}

export function isEnumChoiceRule<P extends PhaseName>(
	rule: Rule<P>
): rule is ChoiceRule<P> & { readonly __enumShaped?: never } {
	return (
		rule.type === CHOICE &&
		rule.members.length >= 2 &&
		rule.members.every((m) => m.type === STRING || (m.type === SYMBOL && m.literal !== undefined))
	);
}

export function isSpliceableBareSeq(rule: Rule<'normalize'>): rule is SeqRule<'normalize'> {
	return (
		rule.type === SEQ && rule.fieldName === undefined && rule.separator === undefined && rule.multiplicity === undefined
	);
}
import type { DelimiterMode } from '../types/rule.ts';
import { ruleKey } from './shared.ts';

interface SeparatorFact {
	readonly value: RuntimeRule;
	readonly trailing?: DelimiterMode;
	readonly leading?: DelimiterMode;
}

export function separatorFactsEqual(a: SeparatorFact | undefined, b: SeparatorFact | undefined): boolean {
	if (a === undefined || b === undefined) return a === b;
	return a.trailing === b.trailing && a.leading === b.leading && rulesEqual(a.value, b.value);
}

export function rulesEqual(a: RuntimeRule, b: RuntimeRule): boolean {
	return ruleKey(a) === ruleKey(b);
}

export function leadingLiteralOf(r: RuntimeRule): string | null {
	if (!typeEq(r.type, 'CHOICE')) return null;
	const members = ((r as { members?: RuntimeRule[] }).members ?? []) as RuntimeRule[];
	const lit = members.find((m) => typeEq(m.type, 'STRING'));
	return lit ? ((lit as { value?: unknown }).value as string) : null;
}

export function separatorOf<R extends RuntimeRule>(
	resolved: R
): { content: R; separator: R; trailing?: boolean } | null {
	if (!typeEq(resolved.type, 'SEQ')) return null;
	const members = (resolved as { members?: R[] }).members;
	if (!members || members.length !== 2) return null;
	const [first, second] = members as [R, R];

	const firstIsStr = typeEq(first.type, 'STRING');
	const secondIsStr = typeEq(second.type, 'STRING');

	if (firstIsStr && !secondIsStr) return { content: second, separator: first };
	if (secondIsStr && !firstIsStr) return { content: first, separator: second, trailing: true };

	const firstIsChoice = typeEq(first.type, 'CHOICE');
	const secondIsChoice = typeEq(second.type, 'CHOICE');
	if (firstIsChoice && !secondIsStr) return { content: second, separator: first };
	if (secondIsChoice && !firstIsStr) return { content: first, separator: second, trailing: true };

	return null;
}

export function ruleMatchesEmpty(rule: unknown): boolean {
	if (!rule || typeof rule !== 'object') return false;
	const r = rule as Record<string, unknown>;
	const t = typeof r.type === 'string' ? r.type : '';

	if (isOptionalType(t) || isPlainRepeatType(t) || isBlankType(t)) return true;

	if (typeEq(t, 'REPEAT1')) {
		return ruleMatchesEmpty(r.content);
	}

	if (isSeqType(t)) {
		const members = r.members;
		if (!Array.isArray(members) || members.length === 0) return true;
		return members.every((m) => ruleMatchesEmpty(m));
	}

	if (typeEq(t, 'CHOICE')) {
		const members = r.members;
		if (!Array.isArray(members)) return false;
		return members.some((m) => ruleMatchesEmpty(m));
	}

	if (isFieldType(t) || isPrecWrapper(r as { type: string })) {
		return ruleMatchesEmpty(r.content);
	}

	if (isStringType(t) || isSymbolType(t) || typeEq(t, 'TOKEN') || typeEq(t, 'PATTERN')) return false;

	return false;
}

function isPlainRepeatType(t: string): boolean {
	return t === 'REPEAT';
}

function collectSlots(members: unknown[], rulesBag?: Record<string, unknown>): unknown[] {
	const slots: unknown[] = [];
	for (const m of members) {
		if (!m || typeof m !== 'object') continue;
		const r = m as Record<string, unknown>;
		const t = typeof r.type === 'string' ? r.type : '';

		if (isStringType(t) || typeEq(t, 'TOKEN') || isBlankType(t)) continue;

		if (rulesBag && isSymbolType(t)) {
			const name = typeof r.name === 'string' ? r.name : undefined;
			if (name !== undefined && !(name in rulesBag)) continue;
		}

		slots.push(m);
	}
	return slots;
}

function unwrapPrec(rule: unknown): unknown {
	let cur = rule;
	while (cur && typeof cur === 'object') {
		const r = cur as Record<string, unknown>;
		if (isPrecWrapper(r as { type: string })) {
			cur = r.content;
		} else {
			break;
		}
	}
	return cur;
}

function isRepeatLike(t: string): boolean {
	return isRepeatType(t) || typeEq(t, 'REPEAT1');
}

function flattenSeqMembers(members: unknown[]): unknown[] {
	const out: unknown[] = [];
	for (const m of members) {
		const core = unwrapPrec(m);
		if (core && typeof core === 'object') {
			const ct = (core as Record<string, unknown>).type;
			const inner = (core as Record<string, unknown>).members;
			if (typeof ct === 'string' && isSeqType(ct) && Array.isArray(inner)) {
				out.push(...flattenSeqMembers(inner));
				continue;
			}
		}
		out.push(m);
	}
	return out;
}

function seqHasTopLevelRepeat(members: unknown[]): boolean {
	for (const m of flattenSeqMembers(members)) {
		const core = unwrapPrec(m);
		if (!core || typeof core !== 'object') continue;
		const ct = (core as Record<string, unknown>).type;
		if (typeof ct === 'string' && isRepeatLike(ct)) return true;
	}
	return false;
}

function isNonterminalSeparatorType(t: string): boolean {
	return isChoiceType(t) || isSymbolType(t) || typeEq(t, 'PATTERN');
}

function repeatHasNonterminalSeparator(repeatRule: RuntimeRule): boolean {
	const content = (repeatRule as { content?: unknown }).content;
	if (!content || typeof content !== 'object') return false;
	const detected = separatorOf(content as RuntimeRule);
	if (!detected) return false;
	return isNonterminalSeparatorType(detected.separator.type);
}

function isOptionalSeparatorFlank(member: unknown, sepValue: string): boolean {
	if (!member || typeof member !== 'object') return false;
	const r = member as Record<string, unknown>;
	const t = typeof r.type === 'string' ? r.type : '';

	if (isOptionalType(t)) {
		const content = r.content;
		if (!content || typeof content !== 'object') return false;
		const cr = content as Record<string, unknown>;
		return isStringType(typeof cr.type === 'string' ? cr.type : '') && cr.value === sepValue;
	}

	if (isChoiceType(t)) {
		const members = r.members;
		if (!Array.isArray(members) || members.length !== 2) return false;
		const hasBlank = members.some(
			(m) => m && typeof m === 'object' && isBlankType((m as Record<string, unknown>).type as string)
		);
		const hasMatchingLiteral = members.some(
			(m) =>
				m &&
				typeof m === 'object' &&
				isStringType(
					typeof (m as Record<string, unknown>).type === 'string' ? ((m as Record<string, unknown>).type as string) : ''
				) &&
				(m as Record<string, unknown>).value === sepValue
		);
		return hasBlank && hasMatchingLiteral;
	}

	return false;
}

function repeatMemberHasGenuineSeparatorVariability(repeatRule: RuntimeRule, siblings: unknown[]): boolean {
	if (repeatHasNonterminalSeparator(repeatRule)) return true;

	const content = (repeatRule as { content?: unknown }).content;
	if (!content || typeof content !== 'object') return false;
	const detected = separatorOf(content as RuntimeRule);
	if (!detected || !isStringType(detected.separator.type)) return false;
	const sepValue = (detected.separator as unknown as { value?: unknown }).value;
	if (typeof sepValue !== 'string') return false;

	return siblings.some((m) => m !== repeatRule && isOptionalSeparatorFlank(m, sepValue));
}

function repeatHasGenuineSeparatorVariability(repeatRule: RuntimeRule): boolean {
	return repeatHasNonterminalSeparator(repeatRule);
}

function seqHasGenuineSeparatorVariability(members: unknown[]): boolean {
	const flat = flattenSeqMembers(members);
	const repeatMembers: RuntimeRule[] = [];
	for (const m of flat) {
		const core = unwrapPrec(m);
		if (!core || typeof core !== 'object') continue;
		const ct = (core as Record<string, unknown>).type;
		if (typeof ct !== 'string' || !isRepeatLike(ct)) continue;
		const content = (core as { content?: unknown }).content;
		if (content && typeof content === 'object' && separatorOf(content as RuntimeRule) !== null) {
			repeatMembers.push(core as RuntimeRule);
		}
	}
	if (repeatMembers.length !== 1) return false;
	return repeatMemberHasGenuineSeparatorVariability(repeatMembers[0]!, flat);
}

export function isInlineSafe(seqBody: unknown, rulesBag?: Record<string, unknown>): boolean {
	if (!seqBody || typeof seqBody !== 'object') return false;
	const r = seqBody as Record<string, unknown>;
	const t = typeof r.type === 'string' ? r.type : '';

	if (isRepeatLike(t)) return !repeatHasGenuineSeparatorVariability(seqBody as RuntimeRule);

	if (typeEq(t, 'ALIAS')) return true;

	if (!isSeqType(t)) return false;

	const members = r.members;
	if (!Array.isArray(members)) return false;

	if (seqHasTopLevelRepeat(members)) return !seqHasGenuineSeparatorVariability(members);

	const slots = collectSlots(members, rulesBag);

	if (slots.length !== 1) return false;

	const core = unwrapPrec(slots[0]);
	if (!core || typeof core !== 'object') return false;
	const coreType = (core as Record<string, unknown>).type;
	if (typeof coreType !== 'string') return false;

	return isFieldType(coreType) || isSymbolType(coreType);
}

export function isSupertypeLike(body: unknown): boolean {
	const b = unwrapPrec(body);
	if (!b || typeof b !== 'object') return false;
	const t = (b as Record<string, unknown>).type;
	if (typeof t !== 'string' || !isChoiceType(t)) return false;
	const members = (b as Record<string, unknown>).members;
	if (!Array.isArray(members) || members.length === 0) return false;
	return members.every((m) => {
		const core = unwrapPrec(m);
		if (!core || typeof core !== 'object') return false;
		const c = core as Record<string, unknown>;
		const coreType = c.type;
		if (typeof coreType !== 'string') return false;
		if (isSymbolType(coreType) || isStringType(coreType)) return true;
		if (typeEq(coreType, 'ALIAS')) return c.named === true;
		return false;
	});
}

export function isKindChoice(body: unknown): boolean {
	const b = unwrapPrec(body);
	if (!b || typeof b !== 'object') return false;
	const t = (b as Record<string, unknown>).type;
	if (typeof t !== 'string' || !isChoiceType(t)) return false;
	const members = (b as Record<string, unknown>).members;
	if (!Array.isArray(members) || members.length === 0) return false;
	return members.every((m) => {
		const core = unwrapPrec(m);
		if (!core || typeof core !== 'object') return false;
		const c = core as Record<string, unknown>;
		const coreType = c.type;
		if (typeof coreType !== 'string') return false;
		if (isSymbolType(coreType)) return true;
		return typeEq(coreType, 'ALIAS') && c.named === true;
	});
}

export function isPermutationChoice(
	body: unknown,
	rulesBag?: Record<string, unknown>,
	kwRules?: Record<string, unknown>,
	wordMatcher?: RegExp
): boolean {
	const b = unwrapPrec(body);
	if (!b || typeof b !== 'object') return false;
	const t = (b as Record<string, unknown>).type;
	if (typeof t !== 'string' || !isChoiceType(t)) return false;
	const members = (b as Record<string, unknown>).members;
	if (!Array.isArray(members)) return false;
	const arms = members.filter(
		(m) => m && typeof m === 'object' && !isBlankType(((m as { type?: string }).type ?? '') as string)
	);
	if (arms.length < 2) return false;
	const keySets: Set<string>[] = [];
	for (const arm of arms) {
		const keys = permutationArmSlotKeys(arm, rulesBag, kwRules, wordMatcher);
		if (keys === null) return false;
		keySets.push(keys);
	}
	const first = keySets[0]!;
	if (!keySets.every((s) => s.size === first.size && [...s].every((k) => first.has(k)))) return false;
	return new Set(arms.map((a) => JSON.stringify(a))).size >= 2;
}

function permutationArmSlotKeys(
	arm: unknown,
	rulesBag?: Record<string, unknown>,
	kwRules?: Record<string, unknown>,
	wordMatcher?: RegExp
): Set<string> | null {
	const core = unwrapPrec(arm);
	if (!core || typeof core !== 'object') return null;
	const t = (core as Record<string, unknown>).type;
	if (typeof t !== 'string' || !isSeqType(t)) return null;
	const members = (core as Record<string, unknown>).members;
	if (!Array.isArray(members) || members.length < 2) return null;
	const keys = new Set<string>();
	for (const member of members) {
		const key = permutationAtomKey(member, rulesBag, kwRules, wordMatcher);
		if (key === null || keys.has(key)) return null;
		keys.add(key);
	}
	return keys;
}

function permutationAtomKey(
	member: unknown,
	rulesBag?: Record<string, unknown>,
	kwRules?: Record<string, unknown>,
	wordMatcher?: RegExp
): string | null {
	let core: unknown = unwrapPrec(member);
	let fieldName: string | undefined;
	for (;;) {
		if (!core || typeof core !== 'object') return null;
		const r = core as Record<string, unknown>;
		const t = typeof r.type === 'string' ? r.type : '';
		if (isFieldType(t)) {
			if (fieldName === undefined && typeof r.name === 'string') fieldName = r.name;
			core = unwrapPrec(r.content);
			continue;
		}
		if (isOptionalType(t)) {
			core = unwrapPrec(r.content);
			continue;
		}
		if (isChoiceType(t)) {
			const ms = r.members;
			if (Array.isArray(ms) && ms.length === 2) {
				const blankIdx = ms.findIndex(
					(m) => m && typeof m === 'object' && isBlankType(((m as { type?: string }).type ?? '') as string)
				);
				if (blankIdx !== -1) {
					core = unwrapPrec(ms[1 - blankIdx]);
					continue;
				}
			}
			return null;
		}
		break;
	}
	const r = core as Record<string, unknown>;
	const t = typeof r.type === 'string' ? r.type : '';
	const keyed = (lit: string | null, fallback: string): string => {
		if (lit !== null && (fieldName === undefined || fieldName === `${lit}_marker`)) return `lit:${lit}`;
		const bare = lit !== null ? `lit:${lit}` : fallback;
		return fieldName === undefined ? bare : `field:${fieldName}=${bare}`;
	};
	if (isStringType(t)) {
		const v = r.value;
		if (typeof v !== 'string' || !matchesWordShape(v, wordMatcher)) return null;
		return keyed(v, '');
	}
	if (isSymbolType(t)) {
		const name = typeof r.name === 'string' ? r.name : undefined;
		if (name === undefined) return null;
		const resolved = resolveRuleLiteral(kwRules?.[name] ?? rulesBag?.[name]);
		return keyed(resolved, `sym:${name}`);
	}
	return null;
}

function resolveRuleLiteral(body: unknown): string | null {
	const core = unwrapPrec(body);
	if (!core || typeof core !== 'object') return null;
	const r = core as Record<string, unknown>;
	const t = typeof r.type === 'string' ? r.type : '';
	if (typeEq(t, 'TOKEN')) return resolveRuleLiteral(r.content);
	if (isStringType(t)) return typeof r.value === 'string' ? r.value : null;
	return null;
}

export function isParserHiddenName(name: string): boolean {
	return name.startsWith('_');
}

export function selfReferentialFoldOf(
	name: string,
	rule: Rule<'link'>
): { extensionFieldName: string; separator: Rule<'link'> } | undefined {
	if (rule.type !== CHOICE) return undefined;
	let baseFieldName: string | undefined;
	let extensionFieldName: string | undefined;
	let separator: Rule<'link'> | undefined;
	let sawSelfRef = false;
	const isSelfRef = (content: Rule<'link'>): boolean =>
		content.type === SYMBOL &&
		content.name === name &&
		isParserHiddenName(content.name) &&
		(content as { aliasedTo?: string }).aliasedTo === undefined;
	for (const arm of rule.members) {
		if (arm.type !== SEQ || arm.members.length !== 3) return undefined;
		const m0 = arm.members[0];
		const sep = arm.members[1];
		const m2 = arm.members[2];
		if (m0 === undefined || sep === undefined || m2 === undefined) return undefined;
		if (m0.type !== FIELD || m2.type !== FIELD || sep.type !== STRING) return undefined;
		if (baseFieldName === undefined) {
			baseFieldName = m0.name;
			extensionFieldName = m2.name;
		} else if (m0.name !== baseFieldName || m2.name !== extensionFieldName) {
			return undefined;
		}
		if (separator === undefined) separator = sep;
		else if (separator.type !== STRING || separator.value !== sep.value) return undefined;
		if (isSelfRef(m0.content)) sawSelfRef = true;
		else if (isSelfRef(m2.content)) return undefined;
	}
	if (!sawSelfRef || extensionFieldName === undefined || separator === undefined) return undefined;
	return { extensionFieldName, separator };
}

export function exclusiveFieldChoiceBranches<P extends PhaseName>(
	member: Rule<P>,
	rulesBag: Record<string, Rule<P>>
): readonly Rule<P>[] | undefined {
	let target: Rule<P> | undefined = member;
	if (isSymbolType((member as { type?: string }).type)) {
		const name = (member as { name?: string }).name;
		if (typeof name !== 'string' || !name.startsWith('_')) return undefined;
		target = rulesBag[name];
	}
	if (!target || !isChoiceType((target as { type?: string }).type)) return undefined;
	const branches = (target as unknown as { members?: Rule<P>[] }).members;
	if (!Array.isArray(branches) || branches.length < 2) return undefined;
	const names = new Set<string>();
	for (const branch of branches) {
		if (!isFieldType((branch as { type?: string }).type)) return undefined;
		const name = (branch as { name?: string }).name;
		if (typeof name !== 'string') return undefined;
		names.add(name);
	}
	return names.size === branches.length ? branches : undefined;
}

export function normalizeMember(m: unknown): {
	type: string;
	value?: string;
	content?: unknown;
	members?: unknown[];
	name?: string;
} {
	if (typeof m === 'string') return { type: 'STRING', value: m };
	if (m instanceof RegExp) return { type: 'PATTERN', value: m.source };
	return (m as { type: string }) ?? { type: 'UNKNOWN' };
}

export function peelOptional<P extends PhaseName>(rule: Rule<P>): { inner: Rule<P>; isOptional: boolean } {
	if (isOptionalType(rule.type)) {
		return {
			inner: (rule as unknown as { content: Rule<P> }).content,
			isOptional: true
		};
	}
	if (isChoiceType(rule.type)) {
		const members = (rule as unknown as { members: Array<{ type: string }> }).members;
		if (members.length === 2) {
			const blankIdx = members.findIndex((m) => m.type === 'BLANK');
			if (blankIdx !== -1) {
				const inner = members[1 - blankIdx] as unknown as Rule<P>;
				return { inner, isOptional: true };
			}
		}
	}
	return { inner: rule, isOptional: false };
}

export function peelOptionalSeq<P extends PhaseName>(
	rule: Rule<P>
): {
	seqBody: Rule<P>;
	form: 'optional' | 'choice';
	seqIdx: number;
} | null {
	if (isOptionalType(rule.type)) {
		const content = (rule as unknown as { content?: Rule<P> }).content;
		if (content && isSeqType((content as { type?: string }).type)) {
			return { seqBody: content, form: 'optional', seqIdx: -1 };
		}
		return null;
	}
	if (isChoiceType(rule.type)) {
		const members = (rule as unknown as { members?: Rule<P>[] }).members;
		if (!Array.isArray(members) || members.length !== 2) return null;
		const blankIdx = members.findIndex((m) => isBlankType((m as { type?: string } | undefined)?.type));
		const seqIdx = members.findIndex((m) => isSeqType((m as { type?: string }).type));
		if (blankIdx === -1 || seqIdx === -1 || blankIdx === seqIdx) return null;
		return { seqBody: members[seqIdx]!, form: 'choice', seqIdx };
	}
	return null;
}

export function listSeparatorOfOptionalSeq<P extends PhaseName>(rule: Rule<P>): string | null {
	const peeled = peelOptionalSeq(rule);
	if (peeled === null) return null;
	const seqMembers = (peeled.seqBody as unknown as { members?: Rule<P>[] }).members;
	if (!Array.isArray(seqMembers)) return null;
	for (const m of seqMembers) {
		if (!isRepeatType((m as { type?: string }).type)) continue;
		const sepAttr = (m as { separator?: unknown }).separator;
		if (typeof sepAttr === 'string') return sepAttr;
		const content = (m as { content?: RuntimeRule }).content;
		if (content) {
			const detected = separatorOf(content);
			if (detected) {
				const sep = detected.separator;
				if (typeEq(sep.type, 'STRING')) return (sep as { value?: unknown }).value as string;
				if (typeEq(sep.type, 'CHOICE')) {
					const lit = leadingLiteralOf(sep);
					if (lit !== null) return lit;
				}
			}
		}
	}
	return null;
}

export function optionalStringLiteral<P extends PhaseName>(rule: Rule<P>): string | null {
	const peeled = peelOptional(rule);
	if (!peeled.isOptional) return null;
	const innerN = normalizeMember(peeled.inner);
	if (isStringType(innerN.type) && typeof innerN.value === 'string') return innerN.value;
	return null;
}

export function separatedListElementName<P extends PhaseName>(rule: Rule<P>): string | null {
	const t = (rule as { type?: string }).type;
	if (typeof t !== 'string') return null;
	if (isFieldType(t)) {
		const name = (rule as { name?: unknown }).name;
		return typeof name === 'string' ? name : null;
	}
	if (isSymbolType(t)) {
		const name = (rule as { name?: unknown }).name;
		return typeof name === 'string' ? name.replace(/^_+/, '') : null;
	}
	if (isChoiceType(t)) {
		const members = (rule as { members?: Rule<P>[] }).members;
		if (Array.isArray(members) && members.length === 1) return separatedListElementName(members[0]!);
		return null;
	}
	if (isPrecWrapper(rule as { type: string }) || typeEq(t, 'ALIAS')) {
		const content = (rule as { content?: Rule<P> }).content;
		return content ? separatedListElementName(content) : null;
	}
	return null;
}

export function peelOptionalEitherSpelling<P extends PhaseName>(rule: Rule<P>): Rule<P> | null {
	const peeled = peelOptional(rule);
	return peeled.isOptional ? peeled.inner : null;
}

export interface SeparatedListBodyInfo<P extends PhaseName = 'normalize'> {
	elementName: string | null;
	flankCarrying: boolean;
	form: 'head' | 'leading' | 'tail';
	element: Rule<P>;
	separatorRule: Rule<P>;
	flatMembers: Rule<P>[];
}

export function separatedListBodyInfo<P extends PhaseName>(body: Rule<P>): SeparatedListBodyInfo<P> | null {
	if (!isSeqType((body as { type?: string }).type)) return null;
	const members = (body as unknown as { members?: Rule<P>[] }).members;
	if (!Array.isArray(members) || members.length === 0) return null;

	const separatorRepeatOf = (m: Rule<P>) => {
		if (!isRepeatType((m as { type?: string }).type)) return null;
		const content = (m as { content?: RuntimeRule }).content;
		return content ? separatorOf(content) : null;
	};

	if (members.length >= 2 && !members.some((m) => separatorRepeatOf(m) !== null)) {
		const nestedIdx = members.findIndex((m) => {
			if (!isSeqType((m as { type?: string }).type)) return false;
			const inner = (m as unknown as { members?: Rule<P>[] }).members;
			return Array.isArray(inner) && inner.some((im) => separatorRepeatOf(im) !== null);
		});
		if (nestedIdx !== -1) {
			const headMembers = (members[nestedIdx] as unknown as { members: Rule<P>[] }).members;
			return separatedListBodyInfo({
				...body,
				members: [...members.slice(0, nestedIdx), ...headMembers, ...members.slice(nestedIdx + 1)]
			} as Rule<P>);
		}
	}

	const repeatIdx = members.findIndex((m) => separatorRepeatOf(m) !== null);
	if (repeatIdx === -1) return null;
	const detected = separatorRepeatOf(members[repeatIdx]!)!;
	const separatorIsChoice = typeEq(detected.separator.type, 'CHOICE');
	const separatorLiteral = typeEq(detected.separator.type, 'STRING')
		? ((detected.separator as { value?: unknown }).value as string)
		: null;
	const elementName = separatedListElementName(detected.content as Rule<P>);

	if (detected.trailing !== true) {
		if (repeatIdx === 0) {
			if (!typeEq((members[0] as { type?: string }).type, 'REPEAT1')) return null;
			if (members.length !== 2) return null;
			const flank = peelOptionalEitherSpelling(members[1]!);
			const flankLit =
				flank && isStringType((flank as { type?: string }).type) ? (flank as { value?: unknown }).value : null;
			if (flankLit === null || (separatorLiteral !== null && flankLit !== separatorLiteral)) return null;
			return {
				elementName,
				flankCarrying: true,
				form: 'leading' as const,
				element: detected.content as Rule<P>,
				separatorRule: detected.separator as Rule<P>,
				flatMembers: members
			};
		}
		const head = members[repeatIdx - 1]!;
		if (separatedListElementName(head) !== elementName || elementName === null) {
			if (ruleKey(head as RuntimeRule) !== ruleKey(detected.content as RuntimeRule)) return null;
		}
		let flankCarrying = separatorIsChoice;
		for (const [i, m] of members.entries()) {
			if (i === repeatIdx || i === repeatIdx - 1) continue;
			if (isStringType((m as { type?: string }).type) && (m as { value?: unknown }).value === separatorLiteral) {
				continue;
			}
			const inner = peelOptionalEitherSpelling(m);
			const innerLit =
				inner && isStringType((inner as { type?: string }).type) ? (inner as { value?: unknown }).value : null;
			const innerMatchesChoiceSep =
				inner !== null && separatorIsChoice && isChoiceType((inner as { type?: string }).type ?? '');
			if (
				(innerLit !== null && (separatorLiteral === null || innerLit === separatorLiteral)) ||
				innerMatchesChoiceSep
			) {
				flankCarrying = true;
				continue;
			}
			return null;
		}
		return {
			elementName,
			flankCarrying,
			form: 'head' as const,
			element: detected.content as Rule<P>,
			separatorRule: detected.separator as Rule<P>,
			flatMembers: members
		};
	}

	if (repeatIdx !== 0 || members.length !== 2) return null;
	const tail = peelOptionalEitherSpelling(members[1]!);
	if (tail === null) return null;
	if (elementName !== null && separatedListElementName(tail) !== elementName) return null;
	if (elementName === null && ruleKey(tail as RuntimeRule) !== ruleKey(detected.content as RuntimeRule)) return null;
	return {
		elementName,
		flankCarrying: true,
		form: 'tail' as const,
		element: detected.content as Rule<P>,
		separatorRule: detected.separator as Rule<P>,
		flatMembers: members
	};
}

export function armLeadingSymbolName<P extends PhaseName>(
	rule: Rule<P>,
	rulesBag: Record<string, Rule<P>>,
	seen: Set<Rule<P>> = new Set()
): string | undefined {
	if (seen.has(rule)) return undefined;
	seen.add(rule);
	const t = (rule as { type?: string }).type;
	if (typeof t !== 'string') return undefined;
	if (isSymbolType(t)) {
		const name = (rule as { name?: string }).name;
		if (typeof name !== 'string') return undefined;
		const body = rulesBag[name];
		if (body?.hidden !== true) return name;
		return body ? (armLeadingSymbolName(body, rulesBag, seen) ?? name) : name;
	}
	if (isSeqType(t)) {
		const members = (rule as unknown as { members?: Rule<P>[] }).members;
		const first = Array.isArray(members) ? members[0] : undefined;
		return first ? armLeadingSymbolName(first, rulesBag, seen) : undefined;
	}
	if (isChoiceType(t)) {
		return undefined;
	}
	const content = (rule as { content?: Rule<P> }).content;
	return content ? armLeadingSymbolName(content, rulesBag, seen) : undefined;
}

export function armStartsWithSymbol<P extends PhaseName>(
	rule: Rule<P>,
	collidingLeadingNames: ReadonlySet<string>,
	rulesBag: Record<string, Rule<P>>
): boolean {
	if (collidingLeadingNames.size === 0) return false;
	const name = armLeadingSymbolName(rule, rulesBag);
	return name !== undefined && collidingLeadingNames.has(name);
}

export function isLiteralChoiceContent<P extends PhaseName>(rule: Rule<P>): boolean {
	if (isStringType((rule as { type?: string }).type as string)) return true;
	if (isChoiceType((rule as { type?: string }).type as string)) {
		const members = (rule as unknown as { members?: Rule<P>[] }).members;
		return Array.isArray(members) && members.every((m) => isLiteralChoiceContent(m));
	}
	return false;
}

export function isHiddenKind(name: string, inlineList?: readonly string[]): boolean {
	if (name.startsWith('_')) return true;
	if (inlineList && inlineList.includes(name)) return true;
	return false;
}

export function isNonInlinableLeafShape(rule: AnyRule): boolean {
	if (isEnumChoiceRule(rule)) return true;
	return rule.type === SUPERTYPE || rule.type === PATTERN || rule.type === STRING;
}

export function isHiddenRule(name: string, rules: Readonly<Record<string, AnyRule>>): boolean {
	return rules[name]?.hidden === true;
}

export function isComplexBody(rule: Rule<'evaluate'>): boolean {
	switch (rule.type) {
		case SEQ:
			return (rule as SeqRule<'evaluate'>).members.length >= 2;
		case CHOICE:
			return (rule as ChoiceRule<'evaluate'>).members.length >= 2;
		case REPEAT:
		case REPEAT1: {
			const content = (rule as RepeatRule<'evaluate'>).content;
			return content.type !== STRING && content.type !== SYMBOL && content.type !== PATTERN;
		}
		default:
			return false;
	}
}

export function deriveComplexAliasTargetHidden(rules: Record<string, AnyRule>): ReadonlySet<string> {
	const walker = new RuleWalker<AnyRule>();
	const candidates = new Set<string>();
	for (const rule of Object.values(rules)) {
		walker.fold(rule, candidates, (acc, r) => {
			if (r.type === ALIAS && r.named && r.content.type === SYMBOL && r.content.name.startsWith('_')) {
				acc.add(r.content.name);
			}
			if (r.type === SYMBOL && (r as { aliasedTo?: string }).aliasedTo !== undefined && r.name.startsWith('_')) {
				acc.add(r.name);
			}
			return acc;
		});
	}

	const out = new Set<string>();
	for (const name of candidates) {
		const body = rules[name];
		if (body && isComplexBody(body as Rule<'evaluate'>)) out.add(name);
	}
	return out;
}

export function armsDifferOnlyByLiteralChoice<P extends PhaseName>(a: Rule<P>, b: Rule<P>): boolean {
	let literalDeltas = 0;
	const peel = (r: Rule<P>): Rule<P> => {
		while (isPrecWrapper(r as { type: string }) && (r as { content?: Rule<P> }).content) {
			r = (r as { content: Rule<P> }).content;
		}
		return r;
	};
	const same = (x: Rule<P>, y: Rule<P>): boolean => {
		x = peel(x);
		y = peel(y);
		if (isLiteralChoiceContent(x) && isLiteralChoiceContent(y)) {
			if (JSON.stringify(x) !== JSON.stringify(y)) literalDeltas++;
			return true;
		}
		const tx = (x as { type?: string }).type;
		const ty = (y as { type?: string }).type;
		if (tx !== ty || typeof tx !== 'string') return false;
		if (isSymbolType(tx)) return (x as { name?: string }).name === (y as { name?: string }).name;
		if (isFieldType(tx)) {
			return (
				(x as { name?: string }).name === (y as { name?: string }).name &&
				same((x as unknown as { content: Rule<P> }).content, (y as unknown as { content: Rule<P> }).content)
			);
		}
		const mx = (x as unknown as { members?: Rule<P>[] }).members;
		const my = (y as unknown as { members?: Rule<P>[] }).members;
		if (Array.isArray(mx) || Array.isArray(my)) {
			if (!Array.isArray(mx) || !Array.isArray(my) || mx.length !== my.length) return false;
			return mx.every((m, i) => same(m, my[i]!));
		}
		const cx = (x as { content?: Rule<P> }).content;
		const cy = (y as { content?: Rule<P> }).content;
		if (cx !== undefined || cy !== undefined) {
			return cx !== undefined && cy !== undefined && same(cx, cy);
		}
		return JSON.stringify(x) === JSON.stringify(y);
	};
	return same(a, b) && literalDeltas === 1;
}

export interface FixedLiteralCtx {
	joiner: string;
	deterministic: boolean;
}

export function collectFixedLiteral(
	rule: RenderRule,
	ctxIn: FixedLiteralCtx = { joiner: ' ', deterministic: false }
): string | undefined {
	if (rule.nonterminal || rule.multiplicity === 'array' || rule.multiplicity === 'nonEmptyArray') return undefined;
	if (rule.multiplicity === 'optional' && ctxIn.deterministic) return undefined;
	const ctx = rule.tokenized ? { ...ctxIn, joiner: '' } : ctxIn;
	switch (rule.type) {
		case STRING:
			return rule.value || undefined;
		case CHOICE: {
			if (rule.members.length === 0) return undefined;
			let found: string | undefined;
			for (const m of rule.members) {
				const isBlank = (m.type === CHOICE && m.members.length === 0) || (m.type === SEQ && m.members.length === 0);
				if (isBlank) {
					if (ctx.deterministic) return undefined;
					continue;
				}
				const v = collectFixedLiteral(m, ctx);
				if (v === undefined) return undefined;
				if (found === undefined) found = v;
				else if (found !== v) return undefined;
			}
			return found;
		}
		case SEQ: {
			if (rule.members.length === 0) return undefined;
			const nonBlanks = rule.members.filter(
				(m) => !((m.type === CHOICE && m.members.length === 0) || (m.type === SEQ && m.members.length === 0))
			);
			const [only] = nonBlanks;
			if (nonBlanks.length === 1 && only) return collectFixedLiteral(only, ctx);
			const parts: string[] = [];
			for (const m of nonBlanks) {
				const v = collectFixedLiteral(m, { ...ctx, deterministic: true });
				if (v === undefined) return undefined;
				parts.push(v);
			}
			return parts.length > 0 ? parts.join(ctx.joiner) : undefined;
		}
		default:
			return undefined;
	}
}
