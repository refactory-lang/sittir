import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { withGrammar } from '../../framework/options.ts';

export const inspectRefs: CommandModule = {
	name: 'inspect-refs',
	describe: 'Inspect the references to a symbol: who names it with a field, and who refers to it without one',
	register: (program) => {
		withGrammar(defineCommand(program, inspectRefs))
			.option('--symbol <name>', 'Target symbol name', '_type_identifier')
			.option('--base', 'Use base grammar.js instead of overrides')
			.action(async (opts: { grammar?: string; symbol?: string; base?: boolean }) => {
				const { inspectRefs: runInspectRefs } = await import('@sittir/tools');
				const code = await runInspectRefs({
					grammar: opts.grammar ?? 'rust',
					symbol: opts.symbol ?? '_type_identifier',
					useBase: opts.base ?? false
				});
				if (code !== 0) process.exitCode = code;
			});
	}
};
