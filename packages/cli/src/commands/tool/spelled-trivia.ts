import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { withGrammar } from '../../framework/options.ts';

export const spelledTrivia: CommandModule = {
	name: 'spelled-trivia',
	describe: 'List the comment kinds a trivia position builds from text spelled in full, or why the grammar has none',
	register: (program) => {
		withGrammar(defineCommand(program, spelledTrivia)).action(async (opts: { grammar?: string }) => {
			const { spelledTrivia: runSpelledTrivia } = await import('@sittir/tools');
			const code = await runSpelledTrivia({ grammar: opts.grammar ?? 'rust' });
			if (code !== 0) process.exitCode = code;
		});
	}
};
