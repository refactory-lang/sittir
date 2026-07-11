import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { recordTestRun, runTestHistoryCli } from '@sittir/tools';

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
					console.log(
						`Recorded: ${result.entry.numPassedTests}/${result.entry.numTotalTests} passed, ` +
							`${result.entry.numFailedTests} failed`
					);
					if (result.newlyFailing.length > 0) {
						console.log(`Newly failing (${result.newlyFailing.length}): ${result.newlyFailing.join(', ')}`);
						process.exitCode = 1;
					}
					if (result.newlyFixed.length > 0) {
						console.log(`Newly fixed (${result.newlyFixed.length}): ${result.newlyFixed.join(', ')}`);
					}
					return;
				}
				runTestHistoryCli([n]);
			});
	}
};
