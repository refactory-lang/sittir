import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { withGrammar } from '../../framework/options.ts';

export const typedReadParity: CommandModule = {
	name: 'typed-read-parity',
	describe: "Compare the typed reader with today's read and wrap on every corpus entry; exits 1 on any refusal, difference or entry today's pipeline cannot decode",
	register: (program) => {
		withGrammar(defineCommand(program, typedReadParity))
			.option('--all-grammars', 'Run every stable grammar')
			.option('--json', 'Print rows and summary as JSON')
			.action(async (opts: { grammar?: string; allGrammars?: boolean; json?: boolean }) => {
				const { typedReadParity: runTypedReadParity } = await import('@sittir/tools');
				const code = await runTypedReadParity({
					grammar: opts.grammar ?? 'rust',
					allGrammars: opts.allGrammars ?? false,
					json: opts.json ?? false
				});
				if (code !== 0) process.exitCode = code;
			});
	}
};
