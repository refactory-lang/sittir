/**
 * Reachability over a rule map — the single derivation behind pruning
 * unreferenced hidden rules from BOTH pipelines' final rule sets
 * (`transpile/prune-grammar-json.ts` for the tree-sitter CLI's grammar.json,
 * `compiler/evaluate.ts` for the sittir-evaluated rule map). The two prunes
 * MUST agree or the model diverges from the parser (the phantom-kind class),
 * which is why the traversal lives here once.
 *
 * Rules are duck-typed: any object tree whose SYMBOL nodes carry
 * `{ type: 'SYMBOL', name }` — both grammar.json's JSON shape and
 * `Rule<'evaluate'>` satisfy this.
 */

/** Every `{type:'SYMBOL', name}` reference inside `node`, added to `into`. */
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

/**
 * Hidden (`_`-prefixed) rules unreachable from the grammar's roots: every
 * VISIBLE rule plus `protectedNames` (externals/extras/inline/conflicts/
 * supertypes/word — names the grammar machinery references outside rule
 * bodies). Reachability — not per-rule reference counting — so a hidden rule
 * kept alive only by other dead hidden rules (or by itself) is still
 * reported. Callers delete the returned names.
 */
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
