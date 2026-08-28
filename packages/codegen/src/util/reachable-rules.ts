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

export function collectUnreachableHiddenRules(
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
	for (const name of Object.keys(rules)) {
		if (!name.startsWith('_')) enqueue(name);
	}
	for (const name of protectedNames) enqueue(name);
	while (queue.length > 0) {
		const refs = new Set<string>();
		collectSymbolRefs(rules[queue.pop()!], refs);
		for (const ref of refs) enqueue(ref);
	}
	return Object.keys(rules).filter((name) => name.startsWith('_') && !reachable.has(name));
}
