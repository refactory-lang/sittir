import type { CommandModule } from '../../framework/command-module.ts';
import { withBackend } from '../../framework/options.ts';
import { runProbeFactoryCli } from '@sittir/validator';

export const probeFactory: CommandModule = {
	name: 'probe-factory',
	describe: 'Factory-render-parse error bucketing (top-8 buckets)',
	register: (program) => {
		withBackend(program.command('probe-factory'))
			.description('Factory-render-parse error bucketing (top-8 buckets)')
			.argument('[grammars...]', 'Grammars to validate; defaults to all')
			.action(async (grammars: string[], opts: { backend: 'native' | 'js' | 'all' }) => {
				await runProbeFactoryCli(grammars, opts.backend);
			});
	},
};
