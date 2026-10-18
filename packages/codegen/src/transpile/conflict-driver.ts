import { join } from 'node:path';
import { conflictStaleRecord, conflictUnresolvableRecord } from '../compiler/diagnostics/conflicts.ts';
import { GrammarDiagnosticError, writeGrammarDiagnosticsJson } from '../compiler/diagnostics/grammar-diagnostics.ts';
import { UNVERIFIED_GRAMMAR_HASH, type ConflictResolutionsFile, type DerivedResolution, type ResolutionSection } from '../dsl/conflict-resolutions.ts';
import { sittirDirOf, type GrammarPackage } from '../grammars.ts';
import type { GrammarDiagnostic } from '../types/diagnostics.ts';
import { parseGenerateOutcome, type GenerateOutcome } from './conflict-summary.ts';
import { readConflictResolutions, rewriteConflictResolutions, writeConflictResolutions } from './conflict-resolutions-file.ts';
import { reuseOrDeriveConflictResolutions, type DerivationResult } from './derive-conflicts.ts';
import { evaluateForDerivation, type DerivationInputs } from './evaluate-for-derivation.ts';
import { runTreeSitterCliCapturing } from './tree-sitter-cli.ts';
import { UNBOUND_ENV } from '../dsl/sittir-grammar.ts';

export interface ConflictResolutionsStore {
	read(): ConflictResolutionsFile;
	write(file: ConflictResolutionsFile): void;
}

export type GeneratedGrammar = 'base' | 'bound';

type SettledResult = Extract<DerivationResult, { readonly kind: 'reused' | 'converged' }>;

export type SettledConflicts =
	| { readonly kind: 'settled'; readonly base: SettledResult; readonly bound: SettledResult }
	| { readonly kind: 'failed'; readonly grammar: GeneratedGrammar; readonly result: Exclude<DerivationResult, SettledResult> };

const settled = (result: DerivationResult): result is SettledResult => result.kind === 'reused' || result.kind === 'converged';

export async function settleConflictResolutions(input: {
	readonly store: ConflictResolutionsStore;
	readonly inputs: DerivationInputs;
	readonly runGenerate: (grammar: GeneratedGrammar) => Promise<GenerateOutcome>;
}): Promise<SettledConflicts> {
	const { store, inputs } = input;
	const writeSection = (grammar: GeneratedGrammar, section: ResolutionSection): void =>
		store.write(grammar === 'base' ? { ...store.read(), ...section } : { ...store.read(), bound: section });
	const probe = (grammar: GeneratedGrammar) => async (resolutions: readonly DerivedResolution[]): Promise<GenerateOutcome> => {
		writeSection(grammar, { grammarHash: UNVERIFIED_GRAMMAR_HASH, resolutions });
		return input.runGenerate(grammar);
	};
	const saved = store.read();
	const reusesBoth = saved.grammarHash === inputs.base.grammarHash && saved.bound.grammarHash === inputs.bound.grammarHash;
	const base = reusesBoth
		? undefined
		: await reuseOrDeriveConflictResolutions({
				saved,
				grammarHash: inputs.base.grammarHash,
				ruleCount: inputs.base.ruleCount,
				upstream: inputs.base,
				generate: probe('base'),
				generateSaved: () => input.runGenerate('base')
			});
	if (base !== undefined) {
		if (!settled(base)) return { kind: 'failed', grammar: 'base', result: base };
		if (base.kind === 'converged') writeSection('base', { grammarHash: inputs.base.grammarHash, resolutions: base.resolutions });
	}
	const bound = await reuseOrDeriveConflictResolutions({
		saved: store.read().bound,
		grammarHash: inputs.bound.grammarHash,
		ruleCount: inputs.bound.ruleCount,
		upstream: inputs.bound,
		generate: probe('bound'),
		generateSaved: () => input.runGenerate('bound')
	});
	if (!settled(bound)) return { kind: 'failed', grammar: 'bound', result: bound };
	if (bound.kind === 'converged') writeSection('bound', { grammarHash: inputs.bound.grammarHash, resolutions: bound.resolutions });
	return { kind: 'settled', base: base ?? { kind: 'reused', resolutions: saved.resolutions, iterations: 1 }, bound };
}

function stopRegen(sittirDir: string, blocking: GrammarDiagnostic): never {
	writeGrammarDiagnosticsJson([blocking], join(sittirDir, 'grammar-diagnostics.json'));
	throw new GrammarDiagnosticError([blocking]);
}

const settledLine = (grammar: GeneratedGrammar, result: SettledResult): string =>
	result.kind === 'reused'
		? `${grammar} ${result.resolutions.length} resolutions reused`
		: `${grammar} ${result.resolutions.length} resolutions re-derived (${result.iterations} iterations)`;

export async function generateWithDerivedConflicts(pkg: GrammarPackage): Promise<SettledConflicts> {
	const sittirDir = sittirDirOf(pkg);
	const result = await settleConflictResolutions({
		store: {
			read: () => readConflictResolutions(pkg),
			write: (file) => writeConflictResolutions(pkg, file)
		},
		inputs: evaluateForDerivation(pkg),
		runGenerate: async (grammar) => {
			const run = runTreeSitterCliCapturing(['generate', '--json-summary'], sittirDir, grammar === 'base' ? { [UNBOUND_ENV]: '1' } : {});
			if (run.status === 0) process.stderr.write(run.stderr);
			return parseGenerateOutcome(run.status, run.stderr);
		}
	});
	if (result.kind === 'failed') {
		const failure = result.result;
		stopRegen(
			sittirDir,
			failure.kind === 'stale' ? conflictStaleRecord(pkg.name, failure.outcome) : conflictUnresolvableRecord(pkg.name, failure.reason, failure.report)
		);
	}
	rewriteConflictResolutions(pkg);
	console.log(`  conflicts: ${settledLine('base', result.base)}; ${settledLine('bound', result.bound)}`);
	return result;
}
