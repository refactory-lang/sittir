import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { withGrammar } from '../../framework/options.ts';
import { separatedLists as runSeparatedLists } from '@sittir/tools';

export const separatedLists: CommandModule = {
	name: 'separated-lists',
	describe: 'Census separated-list shapes: flank-carrying (visible-kind hoist) vs flankless (inline)',
	register: (program) => {
		withGrammar(defineCommand(program, separatedLists))
			.option('--all-grammars', 'Run all three grammars')
			.option('--format <fmt>', 'Output format: table | json', 'table')
			.action(async (opts: { grammar?: string; allGrammars?: boolean; format?: string }) => {
				const code = await runSeparatedLists({
					grammar: opts.grammar ?? 'rust',
					allGrammars: opts.allGrammars ?? false,
					format: opts.format ?? 'table'
				});
				if (code !== 0) process.exitCode = code;
			});
	}
};
