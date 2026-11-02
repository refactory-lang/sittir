import type { Rule } from '../../types/rule.ts';
import { visibleGroupSynthName } from '../automatic-groups.ts';
import { isRecord, type SymbolSource } from '../rule-patterns.ts';
import { isEnrichGroupLiftSymbol } from '../transform/transform-path.ts';

export function divergeSharedLifts(
	bodies: Map<string, unknown>,
	editors: ReadonlyMap<string, ReadonlySet<string>>,
	originals: Readonly<Record<string, unknown>>,
	symbols: SymbolSource | undefined,
	declare: (name: string) => void
): void {
	for (const [lift, by] of editors) {
		const original = originals[lift];
		if (original === undefined) continue;
		const owners = new Set([...by].flatMap((owner) => [owner, ...variantsOf(bodies, owner)]));
		const editedWith = (holder: string): boolean => owners.has(holder) || [...(editors.get(holder) ?? [])].some((owner) => owners.has(owner));
		for (const [holder, body] of bodies) {
			if (holder === lift || editedWith(holder)) continue;
			const site = liftSite(body, lift, null);
			if (site === undefined) continue;
			const name = visibleGroupSynthName(original as Rule, holder, groupContextOf(bodies, symbols), { grp: 0, arm: 0 }, undefined, site ?? undefined);
			if (name === null) throw new Error(`wire: '${holder}' shares the lift '${lift}' an edit changes, and the copy it keeps has no name`);
			bodies.set(name, original);
			declare(name);
			bodies.set(holder, repointed(body, lift, name));
		}
	}
}

function variantsOf(bodies: ReadonlyMap<string, unknown>, owner: string, seen: Set<string> = new Set()): readonly string[] {
	const found: string[] = [];
	const walk = (rule: unknown): void => {
		if (Array.isArray(rule)) for (const member of rule) walk(member);
		else if (isRecord(rule)) {
			const annotations = isRecord(rule.annotations) ? rule.annotations : undefined;
			if (rule.type === 'SYMBOL' && typeof rule.name === 'string' && annotations?.variantOf === owner && !seen.has(rule.name)) {
				seen.add(rule.name);
				found.push(rule.name, ...variantsOf(bodies, rule.name, seen));
			}
			for (const value of Object.values(rule)) walk(value);
		}
	};
	walk(bodies.get(owner));
	return found;
}

function liftSite(rule: unknown, lift: string, field: string | null): string | null | undefined {
	if (Array.isArray(rule)) {
		for (const member of rule) {
			const found = liftSite(member, lift, field);
			if (found !== undefined) return found;
		}
		return undefined;
	}
	if (!isRecord(rule)) return undefined;
	if (rule.type === 'SYMBOL' && rule.name === lift && isEnrichGroupLiftSymbol(rule)) return field;
	const within = rule.type === 'FIELD' && typeof rule.name === 'string' ? rule.name : field;
	for (const value of Object.values(rule)) {
		const found = liftSite(value, lift, within);
		if (found !== undefined) return found;
	}
	return undefined;
}

function repointed(rule: unknown, lift: string, name: string): unknown {
	if (Array.isArray(rule)) return rule.map((member) => repointed(member, lift, name));
	if (!isRecord(rule)) return rule;
	if (rule.type === 'SYMBOL' && rule.name === lift && isEnrichGroupLiftSymbol(rule)) return { ...rule, name };
	return Object.fromEntries(Object.entries(rule).map(([key, value]) => [key, repointed(value, lift, name)]));
}

function groupContextOf(bodies: ReadonlyMap<string, unknown>, symbols: SymbolSource | undefined): Parameters<typeof visibleGroupSynthName>[2] {
	return {
		rulesBag: Object.fromEntries(bodies) as Record<string, Rule>,
		clauseGroupRules: {},
		ruleOrigins: new Map(),
		groupDedupeMap: {},
		authoredGroupBodies: [],
		sourceSymbols: symbols,
		hoist: undefined
	} as Parameters<typeof visibleGroupSynthName>[2];
}
