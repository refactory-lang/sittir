import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { withGrammar } from '../../framework/options.ts';
import { classify as runClassify } from '@sittir/tools';

export const classify: CommandModule = {
	name: 'classify',
	describe: 'Inspect kind classification through the compiler phases',
	register: (program) => {
		withGrammar(defineCommand(program, classify))
			.option(
				'--kind <name>',
				'Show only this kind (repeatable)',
				(val: string, prev: string[]) => [...prev, val],
				[] as string[]
			)
			.option('--modeltype <type>', 'Filter output to this modelType')
			.option('--all', 'Show all assembled kinds')
			.action(async (opts: { grammar?: string; kind?: string[]; modeltype?: string; all?: boolean }) => {
				const kinds = (opts.kind ?? []).length > 0 ? (opts.kind as string[]) : null;
				const code = await runClassify({
					grammar: opts.grammar ?? 'rust',
					kinds,
					modelTypeFilter: opts.modeltype ?? null,
					showAll: opts.all ?? false
				});
				if (code !== 0) process.exitCode = code;
			});
	}
};
