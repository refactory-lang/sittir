import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { Option } from 'commander';

export const counts: CommandModule = {
	name: 'counts',
	describe: 'Per-grammar raw pass/total counts for all four validators',
	register: (program) => {
		defineCommand(program, counts)
			.argument('[grammars...]', 'Grammars to validate; defaults to all')
			.addOption(
				new Option(
					'--isolate',
					'Run each grammar in a child process; attributes SIGSEGV to the last attempted kind'
				).default(false)
			)
			.addOption(
				new Option(
					'--node-storage <storage>',
					'Node backend: parsed/built objects (object), or arena views with record builders (arena)'
				).default('object')
			)
			.addOption(
				new Option(
					'--construction <construction>',
					'Deprecated: assert object construction for object storage, or record construction for arena storage'
				)
			)
			.addOption(
				new Option('--_isolate-worker', 'Internal: run as an isolation worker for a single grammar')
					.hideHelp()
					.default(false)
			)
			.action(
				async (
					grammars: string[],
					opts: { isolate: boolean; _isolateWorker: boolean; nodeStorage: string; construction?: string }
				) => {
					const { runCountsCli, parseConstruction, parseNodeStorage } = await import('@sittir/tools');
					await runCountsCli(grammars, 'native', {
						isolate: opts.isolate,
						isolateWorker: opts._isolateWorker,
						nodeStorage: parseNodeStorage(opts.nodeStorage),
						construction: opts.construction === undefined ? undefined : parseConstruction(opts.construction)
					});
				}
			);
	}
};
