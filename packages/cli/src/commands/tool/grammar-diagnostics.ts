import type { CommandModule } from '../../framework/command-module.ts';
import { withGrammar } from '../../framework/options.ts';
import { grammarDiagnostics as runGrammarDiagnostics } from '@sittir/tools';

export const grammarDiagnostics: CommandModule = {
	name: 'grammar-diagnostics',
	describe: 'Run pre-codegen grammar diagnostics',
	register: (program) => {
		withGrammar(program.command('grammar-diagnostics'))
			.description('Run pre-codegen grammar diagnostics')
			.action(async (opts: { grammar?: string }) => {
				const code = await runGrammarDiagnostics({
					grammar: opts.grammar ?? 'rust',
				});
				if (code !== 0) process.exitCode = code;
			});
	},
};
