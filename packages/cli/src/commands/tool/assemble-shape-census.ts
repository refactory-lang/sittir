import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { withGrammar } from '../../framework/options.ts';
import { assembleShapeCensus as runAssembleShapeCensus } from '@sittir/tools';

export const assembleShapeCensus: CommandModule = {
	name: 'assemble-shape-census',
	describe: 'Census the rule shapes that reach each Assembled* constructor, grouped by modelType',
	register: (program) => {
		withGrammar(defineCommand(program, assembleShapeCensus))
			.option('--all-grammars', 'Run all three grammars')
			.option('--format <fmt>', 'Output format: table | json', 'table')
			.option('--view <view>', 'Which rule view to census: constructor | simplified | both', 'both')
			.action(async (opts: { grammar?: string; allGrammars?: boolean; format?: string; view?: string }) => {
				const code = await runAssembleShapeCensus({
					grammar: opts.grammar ?? 'rust',
					allGrammars: opts.allGrammars ?? false,
					format: opts.format ?? 'table',
					view: opts.view ?? 'both'
				});
				if (code !== 0) process.exitCode = code;
			});
	}
};
