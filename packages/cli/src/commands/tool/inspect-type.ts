import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { withGrammar } from '../../framework/options.ts';
import { inspectType as runInspectType, DEFAULT_NAMESPACES } from '@sittir/tools';

export const inspectType: CommandModule = {
	name: 'inspect-type',
	describe: 'Inspect Loose/Config type shapes via the TS compiler API',
	register: (program) => {
		withGrammar(defineCommand(program, inspectType))
			.option('--entry <kindNs>', 'Single namespace interface to inspect')
			.option('--namespaces <ns,...>', 'Comma-separated list of namespaces (overrides --entry)')
			.option('--slots', 'Print each slot type on the resolved Loose shape')
			.option('--config', 'Print Config shape for comparison')
			.action(async (opts: { grammar?: string; entry?: string; namespaces?: string; slots?: boolean; config?: boolean }) => {
				const grammar = opts.grammar ?? 'rust';
				let namespaces: string[];
				if (opts.namespaces) {
					namespaces = opts.namespaces.split(',').map((s) => s.trim()).filter(Boolean);
				} else if (opts.entry) {
					namespaces = [opts.entry];
				} else {
					namespaces = DEFAULT_NAMESPACES[grammar] ?? ['FieldDeclarationNs'];
				}
				const code = await runInspectType({
					grammar,
					namespaces,
					showSlots: opts.slots ?? false,
					showConfig: opts.config ?? false,
				});
				if (code !== 0) process.exitCode = code;
			});
	},
};
