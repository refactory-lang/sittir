import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { withGrammar } from '../../framework/options.ts';

export const triviaPlacement: CommandModule = {
	name: 'trivia-placement',
	describe: 'Classify every corpus extra by the trivia placement rule and today’s reader',
	register: (program) => {
		withGrammar(defineCommand(program, triviaPlacement))
			.option('--all-grammars', 'Run every stable grammar')
			.option('--json', 'Print rows and summary as JSON')
			.action(async (opts: { grammar?: string; allGrammars?: boolean; json?: boolean }) => {
				const { triviaPlacement: runTriviaPlacement } = await import('@sittir/tools');
				const code = await runTriviaPlacement({
					grammar: opts.grammar ?? 'rust',
					allGrammars: opts.allGrammars ?? false,
					json: opts.json ?? false
				});
				if (code !== 0) process.exitCode = code;
			});
	}
};
