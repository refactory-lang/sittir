import { type CommandModule, defineCommand } from '../../framework/command-module.ts';

export const syncBase: CommandModule = {
	name: 'sync-base',
	describe: 'Merge the base branch into this one, taking the base side of generated files and regenerating them',
	register: (program) => {
		defineCommand(program, syncBase)
			.option('--base <ref>', 'The ref to merge (fetched first when it names a remote)', 'origin/master')
			.action(async (opts: { base: string }) => {
				const { syncBase: runSyncBase } = await import('@sittir/tools');
				const code = await runSyncBase({ base: opts.base });
				if (code !== 0) process.exitCode = code;
			});
	}
};
