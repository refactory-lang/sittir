import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { recordTestRun, formatTestRunReport, runTestHistoryCli } from '@sittir/tools';

export const testHistory: CommandModule = {
	name: 'test-history',
	describe: 'Record or show `vitest run` result history (test-history.jsonl)',
	register: (program) => {
		defineCommand(program, testHistory)
			.argument('[n]', 'Number of entries to show (ignored with --record)', '10')
			.option('--record', 'Run the full vitest suite and record a new entry')
			.action(async (n: string, opts: { record?: boolean }) => {
				if (opts.record) {
					const result = await recordTestRun();
					console.log(formatTestRunReport(result));
					if (result.newlyFailing.length > 0) process.exitCode = 1;
					return;
				}
				runTestHistoryCli([n]);
			});
	}
};
