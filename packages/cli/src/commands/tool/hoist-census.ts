import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { withGrammar } from '../../framework/options.ts';

export const hoistCensus: CommandModule = {
	name: 'hoist-census',
	describe: 'List every holder slot that reads through a wrapper, grouped by wrapper chain',
	register: (program) => {
		withGrammar(defineCommand(program, hoistCensus)).action(async (opts: { grammar?: string }) => {
			const { hoistCensus: runHoistCensus } = await import('@sittir/tools');
			const code = await runHoistCensus({ grammar: opts.grammar ?? 'rust' });
			if (code !== 0) process.exitCode = code;
		});
	}
};
