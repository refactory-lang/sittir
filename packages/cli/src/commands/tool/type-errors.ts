import { type CommandModule, defineCommand } from '../../framework/command-module.ts';

export const typeErrors: CommandModule = {
	name: 'type-errors',
	describe: 'Count the type errors in a type-check log per package, checked against the log\'s error records',
	register: (program) => {
		defineCommand(program, typeErrors)
			.requiredOption('--log <path>', 'Type-check log (tsrs or tsc output)')
			.option('--json', 'Machine-readable JSON output')
			.action(async (opts: { log: string; json?: boolean }) => {
				const { typeErrors: runTypeErrors } = await import('@sittir/tools');
				const code = await runTypeErrors({ log: opts.log, json: opts.json ?? false });
				if (code !== 0) process.exitCode = code;
			});
	}
};
