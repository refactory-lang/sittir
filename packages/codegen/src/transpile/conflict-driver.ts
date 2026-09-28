import { sittirDirOf, type GrammarPackage } from '../grammars.ts';
import { parseGenerateOutcome } from './conflict-summary.ts';
import { readConflictResolutions, writeConflictResolutions } from './conflict-resolutions-file.ts';
import { reuseOrDeriveConflictResolutions, type DerivationResult } from './derive-conflicts.ts';
import { evaluateForDerivation } from './evaluate-for-derivation.ts';
import { runTreeSitterCliCapturing } from './tree-sitter-cli.ts';
import { transpileOverrides } from './transpile-overrides.ts';

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
	if (result.kind === 'unresolvable') {
		throw new Error(
			`${pkg.name}: conflicts could not be derived (${result.reason}) after ${result.resolutions.length} resolution(s):\n${JSON.stringify(result.report, null, 2)}`
		);
	}
	console.log(
		result.kind === 'reused'
			? `  conflicts: ${result.resolutions.length} resolutions reused`
			: `  conflicts: ${result.resolutions.length} resolutions re-derived (${result.iterations} iterations)`
	);
	return result;
}
