import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { withGrammar } from '../../framework/options.ts';

export const triviaTiming: CommandModule = {
	name: 'trivia-timing',
	describe: "Time reading every node's leading trivia after a deep parse of a file (one line-gap query per node)",
	register: (program) => {
		withGrammar(defineCommand(program, triviaTiming))
			.requiredOption('-f, --file <path>', 'Source file to parse')
			.option('-r, --rounds <n>', 'Rounds to run; the best is reported', '3')
			.option('--json', 'Print the timing as JSON')
			.action(async (opts: { grammar?: string; file: string; rounds: string; json?: boolean }) => {
				const { triviaTiming: runTriviaTiming } = await import('@sittir/tools');
				const code = await runTriviaTiming({
					grammar: opts.grammar ?? 'rust',
					file: opts.file,
					rounds: Number(opts.rounds),
					json: opts.json ?? false
				});
				if (code !== 0) process.exitCode = code;
			});
	}
};
