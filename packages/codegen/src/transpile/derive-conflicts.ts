import {
	draftOf,
	sameConflictSet,
	sourceChain,
	upstreamSourcesOf,
	type DerivedResolution,
	type ResolutionSection,
	type SectionDraft
} from '../dsl/conflict-resolutions.ts';
import { conflictKey, type ConflictReport, type GenerateOutcome } from './conflict-summary.ts';
import { mappedName } from '../dsl/bind.ts';

export interface UpstreamContext {
	readonly upstreamConflicts: readonly (readonly string[])[];
	readonly sourceEdges: Readonly<Record<string, string>>;
	readonly baseNames: Readonly<Record<string, string>>;
}

function sourceChainOf(name: string, upstream: UpstreamContext): readonly string[] {
	const base = mappedName(upstream.baseNames, name);
	return base === name ? sourceChain(name, upstream.sourceEdges) : [name, ...sourceChain(base, upstream.sourceEdges)];
}

export type PolicyChoice = { readonly kind: 'chosen'; readonly resolution: DerivedResolution } | { readonly kind: 'unusable' };

export type DerivationResult =
	| (SectionDraft & { readonly kind: 'reused'; readonly iterations: 1 })
	| { readonly kind: 'stale'; readonly outcome: FailedGenerate; readonly resolutions: readonly DerivedResolution[] }
	| (SectionDraft & { readonly kind: 'converged'; readonly iterations: number })
	| {
			readonly kind: 'unresolvable';
			readonly reason: 'repeated' | 'no-usable-offer' | 'cap' | 'dropped-set-returned';
			readonly report: ConflictReport;
			readonly resolutions: readonly DerivedResolution[];
	  };

function declaredUpstream(sources: readonly string[], upstream: UpstreamContext): boolean {
	return upstream.upstreamConflicts.some((declared) => sameConflictSet(declared, sources));
}

export function chooseResolution(report: ConflictReport, upstream: UpstreamContext): PolicyChoice {
	const offer = report.possible_resolutions.find((candidate) => 'AddConflict' in candidate);
	if (!offer || !('AddConflict' in offer)) return { kind: 'unusable' };
	const symbols = offer.AddConflict.symbols;
	const sourceChains = symbols.map((name) => sourceChainOf(name, upstream));
	return {
		kind: 'chosen',
		resolution: {
			resolution: { kind: 'AddConflict', symbols },
			step: declaredUpstream(upstreamSourcesOf(sourceChains), upstream) ? 'upstream-declared' : 'default',
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
	readonly inherited: readonly (readonly string[])[];
	readonly generate: (draft: SectionDraft) => Promise<GenerateOutcome>;
}

export type FailedGenerate = Exclude<GenerateOutcome, { kind: 'clean' }>;

function conflictReportOf(outcome: FailedGenerate): ConflictReport {
	if (outcome.kind === 'error') {
		throw new Error(`tree-sitter generate failed without a conflict report:\n${JSON.stringify(outcome.summary, null, 2)}`);
	}
	return outcome.report;
}

export type Settled = Extract<DerivationResult, { readonly kind: 'reused' | 'converged' }>;

export async function pruneUnnecessary(input: DerivationInput, start: Settled, unnecessary: readonly (readonly string[])[]): Promise<DerivationResult> {
	let { resolutions, withdrawn, iterations } = start;
	let pending = unnecessary;
	for (let pass = 0; ; pass++) {
		const reported = (symbols: readonly string[]): boolean => pending.some((set) => sameConflictSet(set, symbols));
		const held = (set: readonly string[]): boolean => withdrawn.some((other) => sameConflictSet(other, set));
		const drop = resolutions.filter((entry) => reported(entry.resolution.symbols));
		const withdraw = input.inherited.filter((set) => reported(set) && !held(set));
		if (drop.length === 0 && withdraw.length === 0) return pass === 0 ? start : { kind: 'converged', resolutions, withdrawn, iterations };
		resolutions = resolutions.filter((entry) => !drop.includes(entry));
		withdrawn = input.inherited.filter((set) => held(set) || withdraw.includes(set));
		iterations++;
		const outcome = await input.generate({ resolutions, withdrawn });
		if (outcome.kind === 'clean') {
			pending = outcome.unnecessary;
			continue;
		}
		return { kind: 'unresolvable', reason: 'dropped-set-returned', report: conflictReportOf(outcome), resolutions };
	}
}

export async function deriveConflictResolutions(input: DerivationInput): Promise<DerivationResult> {
	const resolutions: DerivedResolution[] = [];
	const reported = new Set<string>();
	for (let iterations = 1; ; iterations++) {
		const outcome = await input.generate({ resolutions, withdrawn: [] });
		if (outcome.kind === 'clean') return pruneUnnecessary(input, { kind: 'converged', resolutions, withdrawn: [], iterations }, outcome.unnecessary);
		const report = conflictReportOf(outcome);
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
	input: DerivationInput & {
		readonly saved: ResolutionSection;
		readonly grammarHash: string;
		readonly generateSaved: () => Promise<GenerateOutcome>;
	}
): Promise<DerivationResult> {
	if (input.saved.grammarHash === input.grammarHash) {
		const outcome = await input.generateSaved();
		if (outcome.kind === 'clean') return pruneUnnecessary(input, { kind: 'reused', ...draftOf(input.saved), iterations: 1 }, outcome.unnecessary);
		return { kind: 'stale', outcome, resolutions: input.saved.resolutions };
	}
	return deriveConflictResolutions(input);
}
