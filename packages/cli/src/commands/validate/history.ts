import { type CommandModule, defineCommand } from '../../framework/command-module.ts';

export const history: CommandModule = {
	name: 'history',
	describe: 'Print last N validation history entries',
	register: (program) => {
		defineCommand(program, history)
			.argument('[n]', 'Number of entries to show', '10')
			.action(async (n: string) => {
				const { runHistoryCli } = await import('@sittir/tools');
				runHistoryCli([n]);
			});
	}
};
