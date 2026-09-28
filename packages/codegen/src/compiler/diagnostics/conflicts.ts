import { sameConflictSet, upstreamSourcesOf } from '../../dsl/conflict-resolutions.ts';
import type { ConflictReport } from '../../transpile/conflict-summary.ts';
import type { DerivationResult, FailedGenerate } from '../../transpile/derive-conflicts.ts';
import type { GrammarDiagnostic } from '../../types/diagnostics.ts';
import type { RawGrammar } from '../types.ts';

type UnresolvableReason = Extract<DerivationResult, { kind: 'unresolvable' }>['reason'];

export function conflictRecords(raw: Pick<RawGrammar, 'name' | 'derivationRecords'>): GrammarDiagnostic[] {
	const records = raw.derivationRecords;
	if (records === undefined) return [];
	const resolutionRecords: GrammarDiagnostic[] = records.resolutions.map(({ resolution, step, sourceChains, conflict }) => ({
		scope: 'grammar',
		code: 'conflict-resolution',
		severity: 'info',
		grammar: raw.name,
		message: `conflict between ${resolution.symbols.join(', ')} on ${conflict.lookahead} resolved by ${resolution.kind} (${step})`,
		canProceed: true,
		details: { resolution, step, sourceChains, conflict }
	}));
	const derivedSources = records.resolutions.map((entry) => upstreamSourcesOf(entry.sourceChains));
	const unnecessaryRecords: GrammarDiagnostic[] = records.upstreamConflicts
		.filter((declared) => !derivedSources.some((sources) => sameConflictSet(declared, sources)))
		.map((symbols) => ({
			scope: 'grammar',
			code: 'conflict-unnecessary-upstream',
			severity: 'info',
			grammar: raw.name,
			message: `upstream declares the conflict ${symbols.join(', ')}, which the reshaped grammar never reports`,
			canProceed: true,
			details: { symbols }
		}));
	const authoredRecords: GrammarDiagnostic[] = records.conflictsAuthored
		? [
				{
					scope: 'grammar',
					code: 'conflict-authored',
					severity: 'fail',
					grammar: raw.name,
					message: `${raw.name} authors conflicts; every conflict is derived by generating, so an authored list is never applied`,
					proposal: 'Delete the conflicts block; the derivation records each conflict it resolves in resolutions.json.',
					canProceed: false,
					details: { grammar: raw.name }
				}
			]
		: [];
	return [...resolutionRecords, ...unnecessaryRecords, ...authoredRecords];
}

export function conflictUnresolvableRecord(grammar: string, reason: UnresolvableReason, report: ConflictReport): GrammarDiagnostic {
	return {
		scope: 'grammar',
		code: 'conflict-unresolvable',
		severity: 'fail',
		grammar,
		message: `${grammar}: the conflict on ${report.conflicting_lookahead} after ${report.symbol_sequence.join(' ')} could not be resolved (${reason})`,
		canProceed: false,
		details: { reason, report }
	};
}

export function conflictStaleRecord(grammar: string, outcome: FailedGenerate): GrammarDiagnostic {
	const failure =
		outcome.kind === 'conflict'
			? `tree-sitter reports a conflict on ${outcome.report.conflicting_lookahead} after ${outcome.report.symbol_sequence.join(' ')}`
			: `tree-sitter fails to build the grammar: ${JSON.stringify(outcome.summary)}`;
	return {
		scope: 'grammar',
		code: 'conflict-resolutions-stale',
		severity: 'fail',
		grammar,
		message: `${grammar}: the saved resolutions carry the current grammar hash but no longer generate cleanly; ${failure}`,
		proposal: 'Restore resolutions.json from version control, or find the grammar input the hash does not cover.',
		canProceed: false,
		details: outcome.kind === 'conflict' ? { report: outcome.report } : { summary: outcome.summary }
	};
}
