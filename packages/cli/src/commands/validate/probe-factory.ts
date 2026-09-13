import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { runProbeFactoryCli } from '@sittir/tools';
import { Option } from 'commander';

export const probeFactory: CommandModule = {
	name: 'probe-factory',
	describe: 'Factory-render-parse error bucketing (top-8 buckets)',
	register: (program) => {
		defineCommand(program, probeFactory)
			.argument('[grammars...]', 'Grammars to validate; defaults to all')
			.addOption(
				new Option('--surface <surface>', 'Factory surface to build through: raw builders or the ir bindings')
					.choices(['raw', 'ir'])
					.default('raw')
			)
			.action(async (grammars: string[], opts: { surface: 'raw' | 'ir' }) => {
				await runProbeFactoryCli(grammars, 'native', opts.surface);
			});
	}
};
