import { join } from 'node:path';
import { conflictStaleRecord, conflictUnresolvableRecord } from '../compiler/diagnostics/conflicts.ts';
import { GrammarDiagnosticError, writeGrammarDiagnosticsJson } from '../compiler/diagnostics/grammar-diagnostics.ts';
import { UNVERIFIED_GRAMMAR_HASH, type ConflictResolutionsFile } from '../dsl/conflict-resolutions.ts';
import { sittirDirOf, type GrammarPackage } from '../grammars.ts';
import type { GrammarDiagnostic } from '../types/diagnostics.ts';
import { parseGenerateOutcome, type GenerateOutcome } from './conflict-summary.ts';
import { readConflictResolutions, writeConflictResolutions } from './conflict-resolutions-file.ts';
import { reuseOrDeriveConflictResolutions, type DerivationResult } from './derive-conflicts.ts';
import { evaluateForDerivation, type DerivationInputs } from './evaluate-for-derivation.ts';
import { runTreeSitterCliCapturing } from './tree-sitter-cli.ts';
import { transpileOverrides } from './transpile-overrides.ts';

export interface ConflictResolutionsStore {
	read(): ConflictResolutionsFile;
	write(file: ConflictResolutionsFile): Promise<void>;
}

export async function settleConflictResolutions(input: {
	readonly store: ConflictResolutionsStore;
	readonly inputs: DerivationInputs;
	readonly runGenerate: () => Promise<GenerateOutcome>;
}): Promise<DerivationResult> {
	const { store, inputs } = input;
	const result = await reuseOrDeriveConflictResolutions({
		saved: store.read(),
		grammarHash: inputs.grammarHash,
		ruleCount: inputs.ruleCount,
		upstream: inputs,
		generate: async (resolutions) => {
			await store.write({ grammarHash: UNVERIFIED_GRAMMAR_HASH, resolutions });
			return input.runGenerate();
		}
	});
	if (result.kind === 'reused' || result.kind === 'converged') {
		await store.write({ grammarHash: inputs.grammarHash, resolutions: result.resolutions });
	}
	return result;
}

function stopRegen(sittirDir: string, blocking: GrammarDiagnostic): never {
	writeGrammarDiagnosticsJson([blocking], join(sittirDir, 'grammar-diagnostics.json'));
	throw new GrammarDiagnosticError([blocking]);
}

export async function generateWithDerivedConflicts(pkg: GrammarPackage): Promise<DerivationResult> {
	const sittirDir = sittirDirOf(pkg);
	const result = await settleConflictResolutions({
		store: {
			read: () => readConflictResolutions(pkg),
			write: async (file) => {
				writeConflictResolutions(pkg, file);
				await transpileOverrides({ package: pkg });
			}
		},
		inputs: evaluateForDerivation(pkg),
		runGenerate: async () => {
			const run = runTreeSitterCliCapturing(['generate', '--json-summary'], sittirDir);
			if (run.status === 0) process.stderr.write(run.stderr);
			return parseGenerateOutcome(run.status, run.stderr);
		}
	});
	if (result.kind === 'stale') stopRegen(sittirDir, conflictStaleRecord(pkg.name, result.outcome));
	if (result.kind === 'unresolvable') stopRegen(sittirDir, conflictUnresolvableRecord(pkg.name, result.reason, result.report));
	console.log(
		result.kind === 'reused'
			? `  conflicts: ${result.resolutions.length} resolutions reused`
			: `  conflicts: ${result.resolutions.length} resolutions re-derived (${result.iterations} iterations)`
	);
	return result;
}
