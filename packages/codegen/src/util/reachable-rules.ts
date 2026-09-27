import { isBlank } from '../dsl/rule-patterns.ts';

export function rootRuleName(rules: Readonly<Record<string, unknown>>): string | undefined {
	return Object.keys(rules)[0];
}

export function collectSymbolRefs(node: unknown, into: Set<string>): void {
	if (Array.isArray(node)) {
		for (const item of node) collectSymbolRefs(item, into);
		return;
	}
	if (!node || typeof node !== 'object') return;
	const obj = node as Record<string, unknown>;
	if (obj.type === 'SYMBOL' && typeof obj.name === 'string') into.add(obj.name);
	for (const value of Object.values(obj)) collectSymbolRefs(value, into);
}

export function collectOrphanedRules(
	rules: Readonly<Record<string, unknown>>,
	protectedNames: ReadonlySet<string>
): string[] {
	const reachable = new Set<string>();
	const queue: string[] = [];
	const enqueue = (name: string): void => {
		if (reachable.has(name) || !(name in rules)) return;
		reachable.add(name);
		queue.push(name);
	};
	const isRoot = (name: string): boolean => !name.startsWith('_') && !isBlank(rules[name]);
	for (const name of Object.keys(rules)) {
		if (isRoot(name)) enqueue(name);
	}
	for (const name of protectedNames) enqueue(name);
	while (queue.length > 0) {
		const refs = new Set<string>();
		collectSymbolRefs(rules[queue.pop()!], refs);
		for (const ref of refs) enqueue(ref);
	}
	return Object.keys(rules).filter((name) => !isRoot(name) && !reachable.has(name));
}

export interface OrphanPrune<R> {
	readonly rules: Record<string, R>;
	readonly inline: string[];
	readonly conflicts: string[][];
	readonly pruned: readonly string[];
}

export function pruneOrphanedRules<R>(
	grammar: {
		readonly rules: Readonly<Record<string, R>>;
		readonly inline?: readonly string[];
		readonly conflicts?: readonly (readonly string[])[];
	},
	protectedNames: ReadonlySet<string>
): OrphanPrune<R> {
	const pruned = collectOrphanedRules(grammar.rules, protectedNames);
	const dead = new Set(pruned);
	return {
		rules: Object.fromEntries(Object.entries(grammar.rules).filter(([name]) => !dead.has(name))),
		inline: (grammar.inline ?? []).filter((name) => !dead.has(name)),
		conflicts: (grammar.conflicts ?? []).filter((pair) => !pair.some((name) => dead.has(name))).map((pair) => [...pair]),
		pruned
	};
}
