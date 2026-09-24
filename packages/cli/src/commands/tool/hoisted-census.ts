import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { withGrammar } from '../../framework/options.ts';

export const hoistedCensus: CommandModule = {
	name: 'hoisted-census',
	describe: 'Count hoisted kinds and list the ones no parent slot seats',
	register: (program) => {
		withGrammar(defineCommand(program, hoistedCensus)).action(async (opts: { grammar?: string }) => {
			const { hoistedCensus: runHoistedCensus } = await import('@sittir/tools');
			const code = await runHoistedCensus({ grammar: opts.grammar ?? 'rust' });
			if (code !== 0) process.exitCode = code;
		});
	}
};
