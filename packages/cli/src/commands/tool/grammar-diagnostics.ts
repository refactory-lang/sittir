import { Option } from 'commander';
import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { withGrammar } from '../../framework/options.ts';

export const grammarDiagnostics: CommandModule = {
	name: 'grammar-diagnostics',
	describe: 'Run pre-codegen grammar diagnostics',
	register: (program) => {
		withGrammar(defineCommand(program, grammarDiagnostics))
			.addOption(
				new Option('--stage <stage>', 'diagnose an evaluated stage: raw (the upstream base) or enriched (the base after enrich), both with no wire config').choices([
					'raw',
					'enriched'
				])
			)
			.action(async (opts: { grammar?: string; stage?: 'raw' | 'enriched' }) => {
				const { grammarDiagnostics: runGrammarDiagnostics } = await import('@sittir/tools');
				const code = await runGrammarDiagnostics({
					grammar: opts.grammar ?? 'rust',
					...(opts.stage === undefined ? {} : { stage: opts.stage })
				});
				if (code !== 0) process.exitCode = code;
			});
	}
};
