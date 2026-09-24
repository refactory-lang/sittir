import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { withGrammar } from '../../framework/options.ts';

export const grammarDiagnostics: CommandModule = {
	name: 'grammar-diagnostics',
	describe: 'Run pre-codegen grammar diagnostics',
	register: (program) => {
		withGrammar(defineCommand(program, grammarDiagnostics)).action(async (opts: { grammar?: string }) => {
			const { grammarDiagnostics: runGrammarDiagnostics } = await import('@sittir/tools');
			const code = await runGrammarDiagnostics({
				grammar: opts.grammar ?? 'rust'
			});
			if (code !== 0) process.exitCode = code;
		});
	}
};
