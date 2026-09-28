import { sittirDirOf, type GrammarPackage } from '../grammars.ts';
import { parseGenerateOutcome } from './conflict-summary.ts';
import { ensureConflictResolutions, writeConflictResolutions } from './conflict-resolutions-file.ts';
import { deriveConflictResolutions, type DerivationResult } from './derive-conflicts.ts';
import { evaluateForDerivation } from './evaluate-for-derivation.ts';
import { runTreeSitterCliCapturing } from './tree-sitter-cli.ts';
import { transpileOverrides } from './transpile-overrides.ts';

export async function generateWithDerivedConflicts(pkg: GrammarPackage): Promise<DerivationResult> {
	ensureConflictResolutions(pkg);
	const inputs = evaluateForDerivation(pkg);
	const sittirDir = sittirDirOf(pkg);
	const result = await deriveConflictResolutions({
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
	if (result.kind === 'unresolvable') {
		throw new Error(
			`${pkg.name}: conflicts could not be derived (${result.reason}) after ${result.resolutions.length} resolution(s):\n${JSON.stringify(result.report, null, 2)}`
		);
	}
	console.log(`  conflicts: ${result.resolutions.length} derived in ${result.iterations} generate run(s)`);
	return result;
}
