import { nativeRuleFn } from '../enrich.ts';

export interface SpellingRule {
	readonly case?: true;
	readonly order?: true;
	readonly readOnly?: true;
	readonly singleLine?: true;
}

export interface SpellingOptions {
	readonly escape?: string;
}

export interface SpellingGroup {
	readonly member: string;
	readonly spellings: readonly string[];
	readonly readOnly: boolean;
	readonly singleLine: boolean;
	readonly escape?: string;
}

const groupsByChoice = new WeakMap<object, readonly SpellingGroup[]>();

function orders(text: string): string[] {
	if (text.length <= 1) return [text];
	return [...new Set([...text].flatMap((char, at) => orders(text.slice(0, at) + text.slice(at + 1)).map((rest) => char + rest)))];
}

function cases(text: string): string[] {
	return [...text].reduce<string[]>(
		(spelled, char) => spelled.flatMap((prefix) => [...new Set([char.toLowerCase(), char.toUpperCase()])].map((variant) => prefix + variant)),
		['']
	);
}

function closureOf(member: string, rule: SpellingRule): string[] {
	const ordered = rule.order === true ? orders(member) : [member];
	const spelled = rule.case === true ? ordered.flatMap(cases) : ordered;
	return [member, ...new Set(spelled.filter((spelling) => spelling !== member))];
}

export function spellings(members: Readonly<Record<string, SpellingRule>>, options: SpellingOptions = {}): unknown {
	const groups: SpellingGroup[] = Object.entries(members).map(([member, rule]) => ({
		member,
		spellings: closureOf(member, rule),
		readOnly: rule.readOnly === true,
		singleLine: rule.singleLine === true,
		...(options.escape === undefined ? {} : { escape: options.escape })
	}));
	const owner = new Map<string, string>();
	for (const { member, spellings: spelled } of groups) {
		for (const spelling of spelled) {
			const other = owner.get(spelling);
			if (other !== undefined) throw new Error(`spellings(): '${spelling}' spells both '${other}' and '${member}'`);
			owner.set(spelling, member);
		}
	}
	const choice = nativeRuleFn<(...members: readonly string[]) => object>('choice')(...groups.flatMap((group) => group.spellings));
	groupsByChoice.set(choice, groups);
	return choice;
}

export type SpellingFields = ReadonlyMap<string, ReadonlyMap<string, readonly SpellingGroup[]>>;

export function spellingFieldsOf(bodies: Readonly<Record<string, unknown>> | undefined): SpellingFields | undefined {
	const kinds = new Map<string, Map<string, readonly SpellingGroup[]>>();
	const visit = (kind: string, rule: unknown, field: string | undefined): void => {
		if (typeof rule !== 'object' || rule === null) return;
		const groups = groupsByChoice.get(rule);
		if (groups !== undefined) {
			if (field === undefined) throw new Error(`spellings(): the spellings in '${kind}' sit in no field`);
			(kinds.get(kind) ?? kinds.set(kind, new Map()).get(kind)!).set(field, groups);
			return;
		}
		const { type, name, content, members } = rule as { type?: unknown; name?: unknown; content?: unknown; members?: unknown };
		const inner = type === 'FIELD' && typeof name === 'string' ? name : field;
		visit(kind, content, inner);
		if (Array.isArray(members)) for (const member of members) visit(kind, member, inner);
	};
	for (const [kind, body] of Object.entries(bodies ?? {})) visit(kind, body, undefined);
	return kinds.size === 0 ? undefined : kinds;
}
