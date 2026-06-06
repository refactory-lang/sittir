import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { withBackend } from '../../framework/options.ts';
import { runCountsCli } from '@sittir/validator';
import { Option } from 'commander';

export const counts: CommandModule = {
	name: 'counts',
	describe: 'Per-grammar raw pass/total counts for all four validators',
	register: (program) => {
		withBackend(defineCommand(program, counts))
			.argument('[grammars...]', 'Grammars to validate; defaults to all')
			.addOption(new Option('--isolate', 'Run each grammar in a child process; attributes SIGSEGV to the last attempted kind').default(false))
			.addOption(new Option('--_isolate-worker', 'Internal: run as an isolation worker for a single grammar').hideHelp().default(false))
			.action(async (grammars: string[], opts: { backend: 'native' | 'js' | 'all'; isolate: boolean; _isolateWorker: boolean }) => {
				await runCountsCli(grammars, opts.backend, { isolate: opts.isolate, isolateWorker: opts._isolateWorker });
			});
	},
};
