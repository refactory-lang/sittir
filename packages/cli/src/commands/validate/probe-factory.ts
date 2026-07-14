import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { runProbeFactoryCli } from '@sittir/tools';

export const probeFactory: CommandModule = {
	name: 'probe-factory',
	describe: 'Factory-render-parse error bucketing (top-8 buckets)',
	register: (program) => {
		defineCommand(program, probeFactory)
			.argument('[grammars...]', 'Grammars to validate; defaults to all')
			.action(async (grammars: string[]) => {
				await runProbeFactoryCli(grammars, 'native');
			});
	}
};
