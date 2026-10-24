import { join } from 'node:path';
import { conflictStaleRecord, conflictUnresolvableRecord } from '../compiler/diagnostics/conflicts.ts';
import { GrammarDiagnosticError, writeGrammarDiagnosticsJson } from '../compiler/diagnostics/grammar-diagnostics.ts';
import {
	UNVERIFIED_GRAMMAR_HASH,
	draftOf,
	resolutionSection,
	type ConflictResolutionsFile,
	type ResolutionSection,
	type SectionDraft
} from '../dsl/conflict-resolutions.ts';
import { sittirDirOf, type GrammarPackage } from '../grammars.ts';
import type { GrammarDiagnostic } from '../types/diagnostics.ts';
import { parseGenerateOutcome, splitGenerateStderr, type GenerateOutcome } from './conflict-summary.ts';
import { readConflictResolutions, rewriteConflictResolutions, writeConflictResolutions } from './conflict-resolutions-file.ts';
import { reuseOrDeriveConflictResolutions, type DerivationResult } from './derive-conflicts.ts';
import { evaluateForDerivation, type DerivationInputs } from './evaluate-for-derivation.ts';
import { withScratchEntry } from './scratch-entry.ts';
import { runTreeSitterCliCapturing } from './tree-sitter-cli.ts';

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
		store.write(grammar === 'base' ? { ...section, bound: store.read().bound } : { ...store.read(), bound: section });
	const probe = (grammar: GeneratedGrammar) => async (draft: SectionDraft): Promise<GenerateOutcome> => {
		writeSection(grammar, resolutionSection(UNVERIFIED_GRAMMAR_HASH, draft));
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
				inherited: [],
				generate: probe('base'),
				generateSaved: () => input.runGenerate('base')
			});
	if (base !== undefined) {
		if (!settled(base)) return { kind: 'failed', grammar: 'base', result: base };
		if (base.kind === 'converged') writeSection('base', resolutionSection(inputs.base.grammarHash, base));
	}
	const settledBase: SettledResult = base ?? { kind: 'reused', ...draftOf(saved), iterations: 1 };
	const bound = await reuseOrDeriveConflictResolutions({
		saved: store.read().bound,
		grammarHash: inputs.bound.grammarHash,
		ruleCount: inputs.bound.ruleCount,
		upstream: inputs.bound,
		inherited: settledBase.resolutions.map((entry) => entry.resolution.symbols),
		generate: probe('bound'),
		generateSaved: () => input.runGenerate('bound')
	});
	if (!settled(bound)) return { kind: 'failed', grammar: 'bound', result: bound };
	if (bound.kind === 'converged') writeSection('bound', resolutionSection(inputs.bound.grammarHash, bound));
	return { kind: 'settled', base: settledBase, bound };
}

function stopRegen(sittirDir: string, blocking: GrammarDiagnostic): never {
	writeGrammarDiagnosticsJson([blocking], join(sittirDir, 'grammar-diagnostics.json'));
	throw new GrammarDiagnosticError([blocking]);
}

const settledLine = (grammar: GeneratedGrammar, result: SettledResult): string =>
	(result.kind === 'reused'
		? `${grammar} ${result.resolutions.length} resolutions reused`
		: `${grammar} ${result.resolutions.length} resolutions re-derived (${result.iterations} iterations)`) +
	(result.withdrawn.length === 0 ? '' : `, ${result.withdrawn.length} inherited withdrawn`);

export async function generateWithDerivedConflicts(pkg: GrammarPackage): Promise<SettledConflicts> {
	const sittirDir = sittirDirOf(pkg);
	const result = await settleConflictResolutions({
		store: {
			read: () => readConflictResolutions(pkg),
			write: (file) => writeConflictResolutions(pkg, file)
		},
		inputs: evaluateForDerivation(pkg),
		runGenerate: async (grammar) => {
			const args = ['generate', '--json-summary'];
			const run = grammar === 'base' ? withScratchEntry(pkg, 'sittir', (dir) => runTreeSitterCliCapturing(args, dir)) : runTreeSitterCliCapturing(args, sittirDir);
			if (run.status === 0) {
				const { preamble, summary } = splitGenerateStderr(run.stderr);
				process.stderr.write(preamble);
				process.stdout.write(summary);
			}
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
