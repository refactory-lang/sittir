import type { ConflictResolutionsFile, DerivedResolution } from '../dsl/conflict-resolutions.ts';
import { conflictKey, type ConflictReport, type GenerateOutcome } from './conflict-summary.ts';

export interface UpstreamContext {
	readonly upstreamConflicts: readonly (readonly string[])[];
	readonly sourceEdges: Readonly<Record<string, string>>;
}

export type PolicyChoice = { readonly kind: 'chosen'; readonly resolution: DerivedResolution } | { readonly kind: 'unusable' };

export type DerivationResult =
	| { readonly kind: 'reused'; readonly resolutions: readonly DerivedResolution[]; readonly iterations: 1 }
	| { readonly kind: 'converged'; readonly resolutions: readonly DerivedResolution[]; readonly iterations: number }
	| {
			readonly kind: 'unresolvable';
			readonly reason: 'repeated' | 'no-usable-offer' | 'cap';
			readonly report: ConflictReport;
			readonly resolutions: readonly DerivedResolution[];
	  };

function sameSet(left: readonly string[], right: readonly string[]): boolean {
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

function declaredUpstream(sources: readonly string[], upstream: UpstreamContext): boolean {
	return upstream.upstreamConflicts.some((declared) => sameSet(declared, sources));
}

export function chooseResolution(report: ConflictReport, upstream: UpstreamContext): PolicyChoice {
	const offer = report.possible_resolutions.find((candidate) => 'AddConflict' in candidate);
	if (!offer || !('AddConflict' in offer)) return { kind: 'unusable' };
	const symbols = offer.AddConflict.symbols;
	const sourceChains = symbols.map((name) => sourceChain(name, upstream.sourceEdges));
	return {
		kind: 'chosen',
		resolution: {
			resolution: { kind: 'AddConflict', symbols },
			step: declaredUpstream(sourceChains.map((chain) => chain[chain.length - 1]!), upstream) ? 'upstream-declared' : 'default',
			sourceChains,
			conflict: {
				symbolSequence: report.symbol_sequence,
				lookahead: report.conflicting_lookahead,
				interpretations: report.possible_interpretations.map((interpretation) => interpretation.variable_name)
			}
		}
	};
}

export interface DerivationInput {
	readonly ruleCount: number;
	readonly upstream: UpstreamContext;
	readonly generate: (resolutions: readonly DerivedResolution[]) => Promise<GenerateOutcome>;
}

export async function deriveConflictResolutions(input: DerivationInput): Promise<DerivationResult> {
	const resolutions: DerivedResolution[] = [];
	const reported = new Set<string>();
	for (let iterations = 1; ; iterations++) {
		const outcome = await input.generate(resolutions);
		if (outcome.kind === 'clean') return { kind: 'converged', resolutions, iterations };
		if (outcome.kind === 'error') {
			throw new Error(`tree-sitter generate failed without a conflict report:\n${JSON.stringify(outcome.summary, null, 2)}`);
		}
		const { report } = outcome;
		const key = conflictKey(report);
		if (reported.has(key)) return { kind: 'unresolvable', reason: 'repeated', report, resolutions };
		if (resolutions.length >= input.ruleCount) return { kind: 'unresolvable', reason: 'cap', report, resolutions };
		const choice = chooseResolution(report, input.upstream);
		if (choice.kind === 'unusable') return { kind: 'unresolvable', reason: 'no-usable-offer', report, resolutions };
		reported.add(key);
		resolutions.push(choice.resolution);
	}
}

export async function reuseOrDeriveConflictResolutions(
	input: DerivationInput & { readonly saved: ConflictResolutionsFile; readonly grammarHash: string }
): Promise<DerivationResult> {
	if (input.saved.grammarHash === input.grammarHash) {
		const outcome = await input.generate(input.saved.resolutions);
		if (outcome.kind === 'clean') return { kind: 'reused', resolutions: input.saved.resolutions, iterations: 1 };
	}
	return deriveConflictResolutions(input);
}
