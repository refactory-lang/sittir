import type { GrammarRule } from '../../../grammar-shapes/grammar-json.ts';
import type { Rule, RuleId } from '../../../types/rule.ts';
import { canonicalRuleTree } from '../../canonical-rules.ts';
import { rebasedRuleId, ruleIdOwner } from '../../rule-catalog.ts';

export interface RuleIdAlignment {
	readonly idsOf: ReadonlyMap<GrammarRule, readonly RuleId[]>;
	readonly unaligned: readonly string[];
}

type Evaluated = Rule<'evaluate'>;

const TOKENS = new Set<string>(['TOKEN', 'IMMEDIATE_TOKEN']);
const ORIGINS = Symbol('origins');

type Traced = Evaluated & { readonly [ORIGINS]?: readonly GrammarRule[] };

function membersOf(rule: GrammarRule | Evaluated): readonly (GrammarRule | Evaluated)[] | undefined {
	return rule.type === 'SEQ' || rule.type === 'CHOICE' ? rule.members : undefined;
}

function contentOf<R extends GrammarRule | Evaluated>(rule: R): R | undefined {
	return 'content' in rule ? (rule.content as R) : undefined;
}

function childrenOf<R extends GrammarRule | Evaluated>(rule: R): readonly R[] {
	const content = contentOf(rule);
	return (membersOf(rule) as readonly R[] | undefined) ?? (content === undefined ? [] : [content]);
}

function originsOf(rule: Evaluated): readonly GrammarRule[] {
	return (rule as Traced)[ORIGINS] ?? [];
}

export function alignRuleIds(
	rules: Readonly<Record<string, GrammarRule>>,
	evaluated: Readonly<Record<string, Evaluated>>
): RuleIdAlignment {
	const idsOf = new Map<GrammarRule, RuleId[]>();
	const unaligned: string[] = [];
	const interned = new Map<string, number>();
	const shapes = new WeakMap<Evaluated, number>();
	const shapeOf = (rule: Evaluated): number => {
		let shape = shapes.get(rule);
		if (shape === undefined) {
			const key = `${rule.type}(${childrenOf(rule).map(shapeOf).join(',')})`;
			shape = interned.get(key);
			if (shape === undefined) interned.set(key, (shape = interned.size));
			shapes.set(rule, shape);
		}
		return shape;
	};
	const traced = (rule: GrammarRule): Evaluated => {
		const origin = { [ORIGINS]: [rule] };
		if (rule.type === 'CHOICE' && rule.members.length === 2 && rule.members[1]!.type === 'BLANK') {
			const { members, ...attributes } = rule;
			return { ...attributes, ...origin, type: 'OPTIONAL', content: traced(members[0]!) } as Evaluated;
		}
		if (rule.type === 'SEQ' || rule.type === 'CHOICE')
			return { ...rule, ...origin, members: rule.members.map(traced) } as Evaluated;
		if ('content' in rule) return { ...rule, ...origin, content: traced(rule.content) } as Evaluated;
		return { ...rule, ...origin } as Evaluated;
	};
	const keepOrigins = (from: Evaluated, to: Evaluated): Traced => {
		const lost = originsOf(from).filter((origin) => !originsOf(to).includes(origin));
		return lost.length === 0 ? to : { ...to, [ORIGINS]: [...originsOf(to), ...lost] };
	};
	const stamp = (rule: GrammarRule, id: RuleId | undefined): void => {
		if (id === undefined) return;
		const ids = idsOf.get(rule);
		if (ids === undefined) idsOf.set(rule, [id]);
		else if (!ids.includes(id)) ids.push(id);
	};
	const place = (canonical: Evaluated, target: Evaluated): void => {
		for (const origin of originsOf(canonical)) stamp(origin, target.id);
		if (TOKENS.has(target.type)) return;
		const targets = childrenOf(target);
		childrenOf(canonical).forEach((child, k) => place(child, targets[k]!));
	};
	const inherit = (rule: GrammarRule, ids: readonly RuleId[]): void => {
		if (!idsOf.has(rule)) for (const id of ids) stamp(rule, id);
		if (TOKENS.has(rule.type)) return;
		for (const child of childrenOf(rule)) inherit(child, idsOf.get(rule) ?? []);
	};
	const differenceOf = (rule: Evaluated, target: Evaluated): string => {
		const kids = childrenOf(rule);
		const targets = childrenOf(target);
		if (rule.type === target.type && kids.length === targets.length) {
			const at = kids.findIndex((kid, k) => shapeOf(kid) !== shapeOf(targets[k]!));
			if (at >= 0) return differenceOf(kids[at]!, targets[at]!);
		}
		return `${rule.type} is ${target.type} (${target.id ?? 'no id'})`;
	};
	for (const [name, rule] of Object.entries(rules)) {
		const target = evaluated[name];
		if (target === undefined) {
			unaligned.push(`${name}: no evaluated rule`);
			continue;
		}
		const canonical = canonicalRuleTree(traced(rule), keepOrigins);
		if (shapeOf(canonical) !== shapeOf(target)) unaligned.push(`${name}: ${differenceOf(canonical, target)}`);
		else {
			place(canonical, target);
			inherit(rule, []);
		}
	}
	return { idsOf, unaligned };
}

export function rebasedIdsOf(
	evaluated: Readonly<Record<string, Evaluated>>,
	spliced: (name: string) => boolean
): (id: RuleId) => readonly RuleId[] {
	const refs = new Map<string, RuleId[]>();
	const walk = (rule: Evaluated): void => {
		if (rule.type === 'SYMBOL' && rule.id !== undefined && spliced(rule.name)) {
			const list = refs.get(rule.name);
			if (list === undefined) refs.set(rule.name, [rule.id]);
			else list.push(rule.id);
		}
		for (const member of membersOf(rule) ?? []) walk(member as Evaluated);
		const content = contentOf(rule);
		if (content !== undefined) walk(content);
	};
	for (const rule of Object.values(evaluated)) walk(rule);
	const prefixes = new Map<string, readonly RuleId[]>();
	const visiting = new Set<string>();
	const prefixesOf = (name: string): readonly RuleId[] => {
		const known = prefixes.get(name);
		if (known !== undefined) return known;
		if (visiting.has(name)) return [];
		visiting.add(name);
		const out = new Set<RuleId>();
		for (const ref of refs.get(name) ?? []) {
			out.add(ref);
			const owner = ruleIdOwner(ref);
			if (spliced(owner)) for (const host of prefixesOf(owner)) out.add(rebasedRuleId(ref, host));
		}
		visiting.delete(name);
		const list = [...out];
		prefixes.set(name, list);
		return list;
	};
	return (id) => prefixesOf(ruleIdOwner(id)).map((host) => rebasedRuleId(id, host));
}
