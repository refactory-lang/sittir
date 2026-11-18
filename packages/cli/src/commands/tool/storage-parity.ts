import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { withGrammars } from '../../framework/options.ts';

export const storageParity: CommandModule = {
	name: 'storage-parity',
	describe:
		'Compare object and arena storage on every source of the validation corpus: snapshots, node renders, layout runs, list rebuilds and side write-backs; exits 1 on a difference the allow-list does not accept',
	register: (program) => {
		withGrammars(defineCommand(program, storageParity))
			.option('--json', 'Print the report and its verdict as JSON')
			.action(async (opts: { grammar?: string[]; json?: boolean }) => {
				const { storageParity: runStorageParity } = await import('@sittir/tools');
				const code = await runStorageParity({ grammars: opts.grammar ?? [], json: opts.json ?? false });
				if (code !== 0) process.exitCode = code;
			});
	}
};
