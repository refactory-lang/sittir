import { join } from 'node:path';
import { conflictStaleRecord, conflictUnresolvableRecord } from '../compiler/diagnostics/conflicts.ts';
import { GrammarDiagnosticError, writeGrammarDiagnosticsJson } from '../compiler/diagnostics/grammar-diagnostics.ts';
import { sittirDirOf, type GrammarPackage } from '../grammars.ts';
import type { GrammarDiagnostic } from '../types/diagnostics.ts';
import { parseGenerateOutcome } from './conflict-summary.ts';
import { readConflictResolutions, writeConflictResolutions } from './conflict-resolutions-file.ts';
import { reuseOrDeriveConflictResolutions, type DerivationResult } from './derive-conflicts.ts';
import { evaluateForDerivation } from './evaluate-for-derivation.ts';
import { runTreeSitterCliCapturing } from './tree-sitter-cli.ts';
import { transpileOverrides } from './transpile-overrides.ts';

function stopRegen(sittirDir: string, blocking: GrammarDiagnostic): never {
	writeGrammarDiagnosticsJson([blocking], join(sittirDir, 'grammar-diagnostics.json'));
	throw new GrammarDiagnosticError([blocking]);
}

export async function generateWithDerivedConflicts(pkg: GrammarPackage): Promise<DerivationResult> {
	const saved = readConflictResolutions(pkg);
	const inputs = evaluateForDerivation(pkg);
	const sittirDir = sittirDirOf(pkg);
	const result = await reuseOrDeriveConflictResolutions({
		saved,
		grammarHash: inputs.grammarHash,
		ruleCount: inputs.ruleCount,
		upstream: inputs,
		generate: async (resolutions) => {
			writeConflictResolutions(pkg, { grammarHash: inputs.grammarHash, resolutions });
			await transpileOverrides({ package: pkg });
			const run = runTreeSitterCliCapturing(['generate', '--json-summary'], sittirDir);
			if (run.status === 0) process.stderr.write(run.stderr);
			return parseGenerateOutcome(run.status, run.stderr);
		}
	});
	if (result.kind === 'stale') stopRegen(sittirDir, conflictStaleRecord(pkg.name, result.report));
	if (result.kind === 'unresolvable') stopRegen(sittirDir, conflictUnresolvableRecord(pkg.name, result.reason, result.report));
	console.log(
		result.kind === 'reused'
			? `  conflicts: ${result.resolutions.length} resolutions reused`
			: `  conflicts: ${result.resolutions.length} resolutions re-derived (${result.iterations} iterations)`
	);
	return result;
}
