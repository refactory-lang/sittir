import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { withGrammar } from '../../framework/options.ts';

export const uncoveredContent: CommandModule = {
	name: 'uncovered-content',
	describe:
		'List corpus nodes whose non-whitespace text no child covers, with the hidden grammar producer; exits 1 if any',
	register: (program) => {
		withGrammar(defineCommand(program, uncoveredContent))
			.option('--all-grammars', 'Run every grammar')
			.option('--json', 'Print the census as JSON')
			.action(async (opts: { grammar?: string; allGrammars?: boolean; json?: boolean }) => {
				const { uncoveredContent: runUncoveredContent } = await import('@sittir/tools');
				const code = await runUncoveredContent({
					grammar: opts.grammar ?? 'rust',
					allGrammars: opts.allGrammars ?? false,
					json: opts.json ?? false
				});
				if (code !== 0) process.exitCode = code;
			});
	}
};
