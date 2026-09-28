import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { withGrammar } from '../../framework/options.ts';

export const triviaPlacement: CommandModule = {
	name: 'trivia-placement',
	describe: 'Report the owner and position the reader gives every corpus extra; exits 1 if any is lost',
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
