import { isChoiceType, isPrecWrapper, isSeqType, isTokenWrapperType, type RuntimeRule } from '../../types/runtime-shapes.ts';
import { isBlank, matchesEmpty, optionalContentOf } from '../rule-patterns.ts';

export type TokenChoiceClass = 'presence' | 'spelling' | 'forms';

type Typed = { type?: string; members?: RuntimeRule[]; content?: RuntimeRule; value?: unknown };

const typeOf = (rule: RuntimeRule): string => (rule as Typed).type ?? '';
const membersOf = (rule: RuntimeRule): RuntimeRule[] => (rule as Typed).members ?? [];
const contentOf = (rule: RuntimeRule): RuntimeRule => (rule as Typed).content!;
const rebuilt = (rule: RuntimeRule, patch: Partial<Typed>): RuntimeRule => ({ ...rule, ...patch });
const isString = (rule: RuntimeRule): boolean => typeOf(rule) === 'STRING';

export function isTokenWrapper(rule: RuntimeRule): boolean {
	return isTokenWrapperType(typeOf(rule));
}

export function classifyTokenChoice(choice: RuntimeRule): TokenChoiceClass {
	const arms = membersOf(choice);
	if (arms.some(isBlank)) return 'presence';
	if (arms.every(isString)) return 'spelling';
	return 'forms';
}

function flattenFormArms(arms: readonly RuntimeRule[]): RuntimeRule[] {
	return arms.flatMap((arm) =>
		isChoiceType(typeOf(arm)) && classifyTokenChoice(arm) === 'forms' ? flattenFormArms(membersOf(arm)) : [arm]
	);
}

type Site = { readonly path: readonly number[]; readonly arms: readonly RuntimeRule[] };

type Fielded = readonly (readonly number[])[];

const isFieldedAt = (fielded: Fielded, path: readonly number[]): boolean =>
	fielded.some((site) => site.length === path.length && site.every((index, i) => index === path[i]));

function findOutermostForms(rule: RuntimeRule, path: readonly number[], fielded: Fielded): Site | undefined {
	const t = typeOf(rule);
	if (t === 'FIELD' || (isChoiceType(t) && isFieldedAt(fielded, path))) return undefined;
	const optional = optionalContentOf(rule);
	if (optional !== undefined) {
		const forms = isChoiceType(typeOf(optional)) && classifyTokenChoice(optional) === 'forms';
		return forms ? { path, arms: [...flattenFormArms(membersOf(optional)), BLANK] } : undefined;
	}
	if (isChoiceType(t)) {
		return classifyTokenChoice(rule) === 'forms' ? { path, arms: flattenFormArms(membersOf(rule)) } : undefined;
	}
	if (isSeqType(t)) {
		const members = membersOf(rule);
		for (let i = 0; i < members.length; i++) {
			const found = findOutermostForms(members[i]!, [...path, i], fielded);
			if (found) return found;
		}
		return undefined;
	}
	if (contentOf(rule) !== undefined) return findOutermostForms(contentOf(rule), [...path, 0], fielded);
	return undefined;
}

function replaceAt(rule: RuntimeRule, path: readonly number[], arm: RuntimeRule): RuntimeRule {
	if (path.length === 0) return arm;
	const [head, ...rest] = path;
	if (Array.isArray((rule as Typed).members)) {
		const members = membersOf(rule).map((m, i) => (i === head ? replaceAt(m, rest, arm) : m));
		return rebuilt(rule, { members });
	}
	return rebuilt(rule, { content: replaceAt(contentOf(rule), rest, arm) });
}

const BLANK = { type: 'BLANK' } as unknown as RuntimeRule;
const EMPTY_SEQ = { type: 'SEQ', members: [] } as unknown as RuntimeRule;

function dropAt(rule: RuntimeRule, path: readonly number[]): RuntimeRule {
	if (path.length === 0) return EMPTY_SEQ;
	const [head, ...rest] = path;
	if (Array.isArray((rule as Typed).members)) {
		if (rest.length === 0) return rebuilt(rule, { members: membersOf(rule).filter((_, i) => i !== head) });
		return rebuilt(rule, { members: membersOf(rule).map((m, i) => (i === head ? dropAt(m, rest) : m)) });
	}
	return rebuilt(rule, { content: dropAt(contentOf(rule), rest) });
}

export function distributeLeafEnum(rule: RuntimeRule): RuntimeRule {
	if (!isTokenWrapper(rule)) return rule;
	const body = contentOf(rule);
	if (!isChoiceType(typeOf(body)) || classifyTokenChoice(body) !== 'spelling') return rule;
	return { type: 'CHOICE', members: membersOf(body).map((arm) => ({ ...rule, content: arm })) } as unknown as RuntimeRule;
}

export function factorSharedOptional(rule: RuntimeRule): RuntimeRule {
	const typed = rule as Typed;
	let out = rule;
	if (Array.isArray(typed.members)) {
		const members = typed.members.map(factorSharedOptional);
		if (members.some((member, i) => member !== typed.members![i])) out = rebuilt(rule, { members });
	} else if (typed.content !== undefined) {
		const content = factorSharedOptional(typed.content);
		if (content !== typed.content) out = rebuilt(rule, { content });
	}
	if (!isChoiceType(typeOf(out))) return out;
	const members = membersOf(out);
	const contents = members.map((member) => optionalContentOf(member));
	if (members.length < 2 || contents.some((content) => content === undefined)) return out;
	const shared = { type: 'CHOICE', members: contents } as unknown as RuntimeRule;
	return rebuilt(out, { members: [shared, BLANK] });
}

export const canonicalRuleText = (rule: RuntimeRule): string =>
	JSON.stringify(rule, (key, value: unknown) => (key === 'id' || key === 'metadata' ? undefined : value));

const underWrapper = (fielded: Fielded): Fielded => fielded.flatMap((site) => (site[0] === 0 ? [site.slice(1)] : []));

export function distributeTokenForms(rule: RuntimeRule, kind: string, fielded: Fielded = []): RuntimeRule {
	const precStack: RuntimeRule[] = [];
	let core = rule;
	let sites = fielded;
	while (isPrecWrapper(core)) {
		precStack.push(core);
		core = contentOf(core);
		sites = underWrapper(sites);
	}
	if (!isTokenWrapper(core)) return rule;
	const body = contentOf(core);
	const site = findOutermostForms(body, [], underWrapper(sites));
	if (site === undefined) return rule;
	const arms = site.arms.map((arm) => (isBlank(arm) ? dropAt(body, site.path) : replaceAt(body, site.path, arm)));
	const empty = arms.findIndex(matchesEmpty);
	if (empty >= 0) throw new Error(`token forms: arm ${empty} of '${kind}' matches the empty string`);
	const seen = new Map<string, number>();
	arms.forEach((arm, i) => {
		const key = canonicalRuleText(arm);
		const prior = seen.get(key);
		if (prior !== undefined) throw new Error(`token forms: arms ${prior} and ${i} of '${kind}' are identical`);
		seen.set(key, i);
	});
	let out = {
		type: 'CHOICE',
		members: arms.map((arm) => ({ ...core, content: arm }))
	} as unknown as RuntimeRule;
	for (let i = precStack.length - 1; i >= 0; i--) out = { ...precStack[i]!, content: out } as unknown as RuntimeRule;
	return out;
}
