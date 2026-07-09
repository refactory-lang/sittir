import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { propose14 as runPropose14 } from '@sittir/tools';

export const propose14: CommandModule = {
	name: 'propose-14',
	describe: 'Principle #14 signature-conformance ratchet (classify pipeline fns; fail on baseline increase)',
	register: (program) => {
		defineCommand(program, propose14)
			.option('--update', 'Rewrite the committed baseline to the current counts')
			.option('--table', 'Print the per-function classification table (drives R1-R4 + R8)')
			.option('--json', 'Machine-readable JSON output')
			.option('--baseline <path>', 'Baseline path (default: packages/codegen/.principle14-baseline.json)')
			.action(async (opts: { update?: boolean; table?: boolean; json?: boolean; baseline?: string }) => {
				const code = await runPropose14({
					update: opts.update ?? false,
					table: opts.table ?? false,
					json: opts.json ?? false,
					baseline: opts.baseline
				});
				if (code !== 0) process.exitCode = code;
			});
	}
};
