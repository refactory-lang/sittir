import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { withGrammar } from '../../framework/options.ts';

export const gapCensus: CommandModule = {
	name: 'gap-census',
	describe: 'Census the source gaps between adjacent list items: exact versus the nearest member below, with the lossy ones grouped by shape',
	register: (program) => {
		withGrammar(defineCommand(program, gapCensus))
			.option('--all-grammars', 'Run every stable grammar')
			.option('--files <paths...>', 'Measure these source files of the grammar instead of its corpus')
			.option('--crlf', 'Convert the files to CRLF line endings in memory before measuring')
			.option('--runs', 'Instead of the lossy census, report blank-line counts within runs of statements and at run boundaries')
			.option('--top <n>', 'Groups to print per list with --runs', '12')
			.option('--examples <n>', 'Examples to print per lossy shape', '3')
			.option('--json', 'Print every lossy row and the summary as JSON')
			.action(async (opts: { grammar?: string; allGrammars?: boolean; files?: string[]; crlf?: boolean; runs?: boolean; top: string; examples: string; json?: boolean }) => {
				const { gapCensus: runGapCensus } = await import('@sittir/tools');
				const code = await runGapCensus({
					grammar: opts.grammar ?? 'rust',
					allGrammars: opts.allGrammars ?? false,
					files: opts.files ?? [],
					crlf: opts.crlf ?? false,
					runs: opts.runs ?? false,
					top: Number(opts.top),
					examples: Number(opts.examples),
					json: opts.json ?? false
				});
				if (code !== 0) process.exitCode = code;
			});
	}
};
