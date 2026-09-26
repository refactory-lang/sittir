import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { withGrammar } from '../../framework/options.ts';

export const overrideCensus: CommandModule = {
	name: 'override-census',
	describe: 'List hand-written rules and patch sites, labelled against the upstream compile',
	register: (program) => {
		withGrammar(defineCommand(program, overrideCensus))
			.option('--json', 'Print the census as JSON')
			.action(async (opts: { grammar?: string; json?: boolean }) => {
				const { overrideCensus: runOverrideCensus } = await import('@sittir/tools');
				const code = await runOverrideCensus({ grammar: opts.grammar ?? 'rust', json: opts.json ?? false });
				if (code !== 0) process.exitCode = code;
			});
	}
};
