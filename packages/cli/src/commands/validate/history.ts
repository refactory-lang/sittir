import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { runHistoryCli } from '@sittir/tools';

export const history: CommandModule = {
	name: 'history',
	describe: 'Print last N validation history entries',
	register: (program) => {
		defineCommand(program, history)
			.argument('[n]', 'Number of entries to show', '10')
			.action((n: string) => {
				runHistoryCli([n]);
			});
	}
};
