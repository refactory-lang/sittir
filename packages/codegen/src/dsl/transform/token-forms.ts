import { isChoiceType, isPrecWrapper, isSeqType, isTokenWrapperType, matchesEmpty, type RuntimeRule } from '../../types/runtime-shapes.ts';

export type TokenChoiceClass = 'presence' | 'spelling' | 'forms';

type Typed = { type?: string; members?: RuntimeRule[]; content?: RuntimeRule; value?: unknown };

const typeOf = (rule: RuntimeRule): string => (rule as Typed).type ?? '';
const membersOf = (rule: RuntimeRule): RuntimeRule[] => (rule as Typed).members ?? [];
const contentOf = (rule: RuntimeRule): RuntimeRule => (rule as Typed).content!;
const rebuilt = (rule: RuntimeRule, patch: Partial<Typed>): RuntimeRule => ({ ...rule, ...patch });
const isBlank = (rule: RuntimeRule): boolean => typeOf(rule) === 'BLANK';
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

function findOutermostForms(rule: RuntimeRule, path: readonly number[]): Site | undefined {
	const t = typeOf(rule);
	if (isChoiceType(t)) {
		const cls = classifyTokenChoice(rule);
		if (cls === 'forms') return { path, arms: flattenFormArms(membersOf(rule)) };
		if (cls === 'spelling') return undefined;
		const live = membersOf(rule).filter((m) => !isBlank(m));
		const only = live.length === 1 ? live[0]! : undefined;
		if (only !== undefined && isChoiceType(typeOf(only)) && classifyTokenChoice(only) === 'forms') {
			return { path, arms: [...flattenFormArms(membersOf(only)), membersOf(rule).find(isBlank)!] };
		}
		return undefined;
	}
	if (t === 'OPTIONAL') {
		const inner = contentOf(rule);
		if (isChoiceType(typeOf(inner)) && classifyTokenChoice(inner) === 'forms') {
			return { path, arms: [...flattenFormArms(membersOf(inner)), BLANK] };
		}
		return undefined;
	}
	if (isSeqType(t)) {
		const members = membersOf(rule);
		for (let i = 0; i < members.length; i++) {
			const found = findOutermostForms(members[i]!, [...path, i]);
			if (found) return found;
		}
		return undefined;
	}
	if (contentOf(rule) !== undefined) return findOutermostForms(contentOf(rule), [...path, 0]);
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

const canonical = (rule: RuntimeRule): string =>
	JSON.stringify(rule, (key, value: unknown) => (key === 'id' || key === 'metadata' ? undefined : value));

export function distributeTokenForms(rule: RuntimeRule, kind: string): RuntimeRule {
	const precStack: RuntimeRule[] = [];
	let core = rule;
	while (isPrecWrapper(core)) {
		precStack.push(core);
		core = contentOf(core);
	}
	if (!isTokenWrapper(core)) return rule;
	const body = contentOf(core);
	const site = findOutermostForms(body, []);
	if (site === undefined) return rule;
	const arms = site.arms.map((arm) => (isBlank(arm) ? dropAt(body, site.path) : replaceAt(body, site.path, arm)));
	const empty = arms.findIndex(matchesEmpty);
	if (empty >= 0) throw new Error(`token forms: arm ${empty} of '${kind}' matches the empty string`);
	const seen = new Map<string, number>();
	arms.forEach((arm, i) => {
		const key = canonical(arm);
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
