import { isChoiceType, isRepeatType, isSeqType, isTokenWrapperType, type RuntimeRule } from '../../types/runtime-shapes.ts';
import { isBlank, matchesEmpty, optionalContentOf, peelPrecs } from '../rule-patterns.ts';

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

type Site = { readonly path: readonly number[]; readonly class: TokenChoiceClass; readonly arms: readonly RuntimeRule[] };

export type SitePaths = readonly (readonly number[])[];

export interface AuthoredSitePaths {
	readonly fielded: SitePaths;
	readonly variants: SitePaths;
}

const NO_SITES: AuthoredSitePaths = { fielded: [], variants: [] };

const isFieldedAt = (fielded: SitePaths, path: readonly number[]): boolean =>
	fielded.some((site) => site.length === path.length && site.every((index, i) => index === path[i]));

function outermostChoices(rule: RuntimeRule, path: readonly number[], fielded: SitePaths): Site[] {
	const t = typeOf(rule);
	if (t === 'FIELD' || isRepeatType(t)) return [];
	const optional = optionalContentOf(rule);
	if ((optional !== undefined || isChoiceType(t)) && isFieldedAt(fielded, path)) return [];
	if (optional !== undefined) {
		const forms = isChoiceType(typeOf(optional)) && classifyTokenChoice(optional) === 'forms';
		return [{ path, class: forms ? 'forms' : 'presence', arms: [...(forms ? flattenFormArms(membersOf(optional)) : [optional]), BLANK] }];
	}
	if (isChoiceType(t)) return [{ path, class: classifyTokenChoice(rule), arms: flattenFormArms(membersOf(rule)) }];
	if (isSeqType(t)) return membersOf(rule).flatMap((member, i) => outermostChoices(member, [...path, i], fielded));
	if (contentOf(rule) !== undefined) return outermostChoices(contentOf(rule), [...path, 0], fielded);
	return [];
}

function presenceSite(choices: readonly Site[], kind: string): Site {
	const presence = choices.filter((choice) => choice.class === 'presence');
	const [only, ...others] = presence;
	if (only !== undefined && others.length === 0) return only;
	const found =
		presence.length === 0
			? 'no unfielded presence choice'
			: `${presence.length} unfielded presence choices, at ${presence.map((choice) => choice.path.join('/') || '(body)').join(', ')} in its token body`;
	throw new Error(`token forms: authored variants name the arms of '${kind}', which has no form alternation to split and ${found}`);
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

function tokenOverArms(precs: readonly RuntimeRule[], core: RuntimeRule, arms: readonly RuntimeRule[]): RuntimeRule {
	let out = { type: 'CHOICE', members: arms.map((arm) => ({ ...core, content: arm })) } as unknown as RuntimeRule;
	for (let i = precs.length - 1; i >= 0; i--) out = { ...precs[i]!, content: out } as unknown as RuntimeRule;
	return out;
}

export function distributeLeafEnum(rule: RuntimeRule): RuntimeRule {
	const { precs, core } = peelPrecs(rule);
	if (!isTokenWrapper(core)) return rule;
	const body = contentOf(core);
	if (!isChoiceType(typeOf(body)) || classifyTokenChoice(body) !== 'spelling') return rule;
	return tokenOverArms(precs, core, membersOf(body));
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

const underWrapper = (fielded: SitePaths): SitePaths => fielded.flatMap((site) => (site[0] === 0 ? [site.slice(1)] : []));

export function distributeTokenForms(rule: RuntimeRule, kind: string, sites: AuthoredSitePaths = NO_SITES): RuntimeRule {
	const { precs: precStack, core } = peelPrecs(rule);
	if (!isTokenWrapper(core)) return rule;
	const armed = sites.variants.some((site) => site.length === 1);
	const fielded = armed ? [] : underWrapper(precStack.reduce(underWrapper, sites.fielded));
	const body = contentOf(core);
	const choices = outermostChoices(body, [], fielded);
	const site = choices.find((choice) => choice.class === 'forms') ?? (armed ? presenceSite(choices, kind) : undefined);
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
	return tokenOverArms(precStack, core, arms);
}
