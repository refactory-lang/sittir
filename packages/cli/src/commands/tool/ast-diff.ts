import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { withGrammar } from '../../framework/options.ts';

export const astDiff: CommandModule = {
	name: 'ast-diff',
	describe: 'Compare the tree-sitter parse trees of two files with the validator\'s AST comparison',
	register: (program) => {
		withGrammar(defineCommand(program, astDiff))
			.argument('<a>', 'First file')
			.argument('<b>', 'Second file')
			.action(async (a: string, b: string, opts: { grammar?: string }) => {
				const { astDiff: runAstDiff } = await import('@sittir/tools');
				const code = await runAstDiff({ grammar: opts.grammar ?? 'rust', a, b });
				if (code !== 0) process.exitCode = code;
			});
	}
};
