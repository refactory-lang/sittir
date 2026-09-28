import { CHOICE, DEDENT, INDENT, NEWLINE, PATTERN, SEQ, STRING, SUPERTYPE, SYMBOL } from '../../types/rule-types.ts';
import type { RenderRule } from '../../types/rule.ts';
import { isNullableMultiplicity } from './node-map.ts';

export const OPAQUE_TOKEN = '\u0000opaque';

export interface FirstTokenSets {
	readonly nullable: ReadonlySet<string>;
	readonly first: ReadonlyMap<string, ReadonlySet<string>>;
}

type Rules = Readonly<Record<string, RenderRule>>;

function terminalOf(rule: RenderRule): string | undefined {
	switch (rule.type) {
		case STRING:
			return rule.value;
		case PATTERN:
		case INDENT:
		case DEDENT:
		case NEWLINE:
			return OPAQUE_TOKEN;
		case SYMBOL:
			return rule.literal;
		default:
			return undefined;
	}
}

const repeats = (rule: RenderRule): boolean => rule.multiplicity === 'array' || rule.multiplicity === 'nonEmptyArray';

function ruleNullable(rule: RenderRule, nullable: ReadonlySet<string>): boolean {
	if (isNullableMultiplicity(rule)) return true;
	const terminal = terminalOf(rule);
	if (terminal !== undefined) return terminal === '';
	switch (rule.type) {
		case SYMBOL:
			return nullable.has(rule.name);
		case SEQ:
			return rule.members.every((m) => ruleNullable(m, nullable));
		case CHOICE:
			return rule.members.length === 0 || rule.members.some((m) => ruleNullable(m, nullable));
		case SUPERTYPE:
			return rule.subtypes.some((m) => ruleNullable(m, nullable));
		default:
			return false;
	}
}

function ruleFirst(
	rule: RenderRule,
	first: ReadonlyMap<string, ReadonlySet<string>>,
	nullable: ReadonlySet<string>
): ReadonlySet<string> {
	const terminal = terminalOf(rule);
	if (terminal !== undefined) return new Set([terminal]);
	switch (rule.type) {
		case SYMBOL:
			return first.get(rule.name) ?? new Set([OPAQUE_TOKEN]);
		case SEQ: {
			const out = new Set<string>();
			for (const m of rule.members) {
				for (const t of ruleFirst(m, first, nullable)) out.add(t);
				if (!ruleNullable(m, nullable)) break;
			}
			return out;
		}
		case CHOICE:
		case SUPERTYPE: {
			const out = new Set<string>();
			for (const m of rule.type === CHOICE ? rule.members : rule.subtypes) {
				for (const t of ruleFirst(m, first, nullable)) out.add(t);
			}
			return out;
		}
		default:
			return new Set();
	}
}

export function firstTokenSets(rules: Rules): FirstTokenSets {
	const nullable = new Set<string>();
	const first = new Map<string, Set<string>>(Object.keys(rules).map((name) => [name, new Set<string>()]));
	let changed = true;
	while (changed) {
		changed = false;
		for (const [name, rule] of Object.entries(rules)) {
			if (!nullable.has(name) && ruleNullable(rule, nullable)) {
				nullable.add(name);
				changed = true;
			}
			const into = first.get(name)!;
			for (const token of ruleFirst(rule, first, nullable)) {
				if (!into.has(token)) {
					into.add(token);
					changed = true;
				}
			}
		}
	}
	return { nullable, first };
}

export function directFollowers(rules: Rules, sets: FirstTokenSets = firstTokenSets(rules)): ReadonlyMap<string, ReadonlySet<string>> {
	const followers = new Map<string, Set<string>>();
	const splicedFollow = new Map<string, Set<string>>();
	const firstOf = (rule: RenderRule) => ruleFirst(rule, sets.first, sets.nullable);
	const nullableOf = (rule: RenderRule) => ruleNullable(rule, sets.nullable);
	let changed = true;
	const addAll = (into: Set<string>, from: Iterable<string>): void => {
		for (const t of from) {
			if (!into.has(t)) {
				into.add(t);
				changed = true;
			}
		}
	};
	const followSet = (map: Map<string, Set<string>>, key: string): Set<string> => {
		const existing = map.get(key);
		if (existing !== undefined) return existing;
		const created = new Set<string>();
		map.set(key, created);
		return created;
	};
	const walk = (rule: RenderRule, afterRule: ReadonlySet<string>): void => {
		const after = repeats(rule) ? new Set([...afterRule, ...firstOf(rule)]) : afterRule;
		const terminal = terminalOf(rule);
		if (terminal !== undefined) {
			addAll(followSet(followers, terminal), after);
			return;
		}
		switch (rule.type) {
			case SYMBOL:
				if (rules[rule.name]?.hidden === true) addAll(followSet(splicedFollow, rule.name), after);
				return;
			case SEQ:
				rule.members.forEach((member, i) => {
					const rest = new Set<string>();
					let restNullable = true;
					for (const next of rule.members.slice(i + 1)) {
						for (const t of firstOf(next)) rest.add(t);
						if (!nullableOf(next)) {
							restNullable = false;
							break;
						}
					}
					if (restNullable) for (const t of after) rest.add(t);
					walk(member, rest);
				});
				return;
			case CHOICE:
				for (const m of rule.members) walk(m, after);
				return;
			default:
				return;
		}
	};
	while (changed) {
		changed = false;
		for (const [name, rule] of Object.entries(rules)) walk(rule, splicedFollow.get(name) ?? new Set());
	}
	return followers;
}

export function sameCharMergePairs(rules: Rules): readonly string[] {
	const pairs = new Set<string>();
	for (const [token, after] of directFollowers(rules)) {
		if (token.length !== 1) continue;
		const doubled = token + token;
		for (const next of after) if (next.startsWith(doubled)) pairs.add(token);
	}
	return [...pairs].sort();
}
