export type PolicyStep = 'upstream-declared' | 'default';

export interface ConflictResolutionRecord {
	readonly resolution: { readonly kind: string; readonly symbols: readonly string[] };
	readonly step: string;
	readonly sourceChains: readonly (readonly string[])[];
	readonly conflict: {
		readonly symbolSequence: readonly string[];
		readonly lookahead: string;
		readonly interpretations: readonly string[];
	};
}

export interface DerivedResolution extends ConflictResolutionRecord {
	readonly resolution: { readonly kind: 'AddConflict'; readonly symbols: readonly string[] };
	readonly step: PolicyStep;
}

export interface ConflictResolutionsFile {
	readonly grammarHash: string;
	readonly resolutions: readonly DerivedResolution[];
}

export interface ConflictResolutionsInput {
	readonly resolutions: readonly ConflictResolutionRecord[];
}

export const CONFLICT_RESOLUTIONS_FILE = 'resolutions.json';

export const UNVERIFIED_GRAMMAR_HASH = '';

export const EMPTY_CONFLICT_RESOLUTIONS: ConflictResolutionsFile = { grammarHash: UNVERIFIED_GRAMMAR_HASH, resolutions: [] };

export function sameConflictSet(left: readonly string[], right: readonly string[]): boolean {
	const members = new Set(left);
	return members.size === new Set(right).size && right.every((name) => members.has(name));
}

export function sourceChain(name: string, edges: Readonly<Record<string, string>>): readonly string[] {
	const chain = [name];
	for (let next = edges[name]; next !== undefined; next = edges[next]) {
		if (chain.includes(next)) throw new Error(`reshaping records form a cycle: ${[...chain, next].join(' → ')}`);
		chain.push(next);
	}
	return chain;
}

export function upstreamSourcesOf(sourceChains: readonly (readonly string[])[]): readonly string[] {
	return [...new Set(sourceChains.map((chain) => chain[chain.length - 1]!))];
}

export function applyConflictResolutions(grammar: Record<string, unknown>, input: ConflictResolutionsInput): void {
	grammar.conflicts = input.resolutions.map((entry) => [...entry.resolution.symbols]);
}
