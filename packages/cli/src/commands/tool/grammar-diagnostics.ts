import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { withGrammar } from '../../framework/options.ts';

export const grammarDiagnostics: CommandModule = {
	name: 'grammar-diagnostics',
	describe: 'Run pre-codegen grammar diagnostics',
	register: (program) => {
		withGrammar(defineCommand(program, grammarDiagnostics))
			.option('--upstream', "diagnose the grammar's base evaluated with no wire config")
			.action(async (opts: { grammar?: string; upstream?: boolean }) => {
				const { grammarDiagnostics: runGrammarDiagnostics } = await import('@sittir/tools');
				const code = await runGrammarDiagnostics({
					grammar: opts.grammar ?? 'rust',
					...(opts.upstream === true ? { upstream: true } : {})
				});
				if (code !== 0) process.exitCode = code;
			});
	}
};
