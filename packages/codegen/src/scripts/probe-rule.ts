/**
 * probe-rule — compatibility shim for the legacy positional API.
 *
 * Legacy usage:  npx tsx packages/codegen/src/scripts/probe-rule.ts <grammar> <kind>
 *
 * Delegates to probe-stages with --grammar, --kind, and --brief so callers
 * get a concise JSON summary of the rule through every compiler phase.
 * Do NOT re-implement compiler-phase logic here.
 */

import { run as runStages } from './probe-stages.ts';

export async function run(argv: string[]): Promise<number> {
	const [grammar, kind] = argv;
	if (!grammar || !kind) {
		process.stderr.write('Usage: probe-rule.ts <grammar> <kind>\n');
		return 1;
	}

	return runStages(['--grammar', grammar, '--kind', kind, '--brief']);
}

const _isMain = import.meta.url === `file://${process.argv[1]}`;
if (_isMain) {
	run(process.argv.slice(2)).then(process.exit).catch((e) => {
		process.stderr.write(`probe-rule: ${(e as Error).stack ?? e}\n`);
		process.exit(1);
	});
}
