import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { withGrammar } from '../../framework/options.ts';
import { inspectRefs as runInspectRefs } from '@sittir/tools';

export const inspectRefs: CommandModule = {
	name: 'inspect-refs',
	describe: 'Inspect symbol references or derivation suggestions',
	register: (program) => {
		withGrammar(defineCommand(program, inspectRefs))
			.option('--mode <mode>', 'Mode: refs | suggestions', 'refs')
			.option('--symbol <name>', 'Target symbol name (refs mode)', '_type_identifier')
			.option('--base', 'Use base grammar.js instead of overrides')
			.option('--limit <n>', 'Max entries per section (suggestions mode)', '10')
			.action(async (opts: { grammar?: string; mode?: string; symbol?: string; base?: boolean; limit?: string }) => {
				const code = await runInspectRefs({
					mode: opts.mode ?? 'refs',
					grammar: opts.grammar ?? 'rust',
					symbol: opts.symbol ?? '_type_identifier',
					useBase: opts.base ?? false,
					limit: opts.limit ? parseInt(opts.limit, 10) : 10
				});
				if (code !== 0) process.exitCode = code;
			});
	}
};
