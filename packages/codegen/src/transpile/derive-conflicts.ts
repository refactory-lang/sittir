import { conflictKey, type ConflictReport, type GenerateOutcome } from './conflict-summary.ts';

export type PolicyStep = 'upstream-declared' | 'upstream-precedence' | 'default';

export interface DerivedResolution {
	readonly resolution: { readonly kind: 'AddConflict'; readonly symbols: readonly string[] };
	readonly step: PolicyStep;
	readonly conflict: {
		readonly symbolSequence: readonly string[];
		readonly lookahead: string;
		readonly interpretations: readonly string[];
	};
}

export interface ConflictResolutionsFile {
	readonly grammarHash: string;
	readonly resolutions: readonly DerivedResolution[];
}

export interface UpstreamContext {
	readonly upstreamConflicts: readonly (readonly string[])[];
	readonly upstreamSourceOf: (finalName: string) => string;
}

export type PolicyChoice = { readonly kind: 'chosen'; readonly resolution: DerivedResolution } | { readonly kind: 'unusable' };

export type DerivationResult =
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

function declaredUpstream(symbols: readonly string[], upstream: UpstreamContext): boolean {
	const sources = symbols.map(upstream.upstreamSourceOf);
	return upstream.upstreamConflicts.some((declared) => sameSet(declared, sources));
}

export function chooseResolution(report: ConflictReport, upstream: UpstreamContext): PolicyChoice {
	const offer = report.possible_resolutions.find((candidate) => 'AddConflict' in candidate);
	if (!offer || !('AddConflict' in offer)) return { kind: 'unusable' };
	const symbols = offer.AddConflict.symbols;
	return {
		kind: 'chosen',
		resolution: {
			resolution: { kind: 'AddConflict', symbols },
			step: declaredUpstream(symbols, upstream) ? 'upstream-declared' : 'default',
			conflict: {
				symbolSequence: report.symbol_sequence,
				lookahead: report.conflicting_lookahead,
				interpretations: report.possible_interpretations.map((interpretation) => interpretation.variable_name)
			}
		}
	};
}

export function deriveConflictResolutions(input: {
	readonly ruleCount: number;
	readonly upstream: UpstreamContext;
	readonly generate: (resolutions: readonly DerivedResolution[]) => GenerateOutcome;
}): DerivationResult {
	const resolutions: DerivedResolution[] = [];
	const reported = new Set<string>();
	for (let iterations = 1; ; iterations++) {
		const outcome = input.generate(resolutions);
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
