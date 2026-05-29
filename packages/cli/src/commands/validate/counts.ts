import type { CommandModule } from '../../framework/command-module.ts';
import { withBackend } from '../../framework/options.ts';
import { runCountsCli } from '@sittir/validator';

export const counts: CommandModule = {
	name: 'counts',
	describe: 'Per-grammar raw pass/total counts for all four validators',
	register: (program) => {
		withBackend(program.command('counts'))
			.description('Per-grammar raw pass/total counts for all four validators')
			.argument('[grammars...]', 'Grammars to validate; defaults to all')
			.action(async (grammars: string[], opts: { backend: 'native' | 'js' | 'all' }) => {
				await runCountsCli(grammars, opts.backend);
			});
	},
};
