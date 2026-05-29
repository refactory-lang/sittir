import type { CommandModule } from '../../framework/command-module.ts';
import { runHistoryCli } from '@sittir/validator';

export const history: CommandModule = {
	name: 'history',
	describe: 'Print last N validation history entries',
	register: (program) => {
		program
			.command('history')
			.description('Print last N validation history entries')
			.argument('[n]', 'Number of entries to show', '10')
			.action((n: string) => { runHistoryCli([n]); });
	},
};
