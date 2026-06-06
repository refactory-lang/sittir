import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { withGrammar } from '../../framework/options.ts';
import { fieldProvenance as runFieldProvenance } from '@sittir/tools';

export const fieldProvenance: CommandModule = {
	name: 'field-provenance',
	describe: 'Field source tracking (override/enriched/grammar)',
	register: (program) => {
		withGrammar(defineCommand(program, fieldProvenance))
			.option('-k, --kind <K>', 'Filter to a single rule kind')
			.option('--redundant', 'Only print redundant-nested FIELD rows')
			.option('--source <src>', 'Filter by source tag: override|enriched|grammar|inferred')
			.action(async (opts: { grammar?: string; kind?: string; redundant?: boolean; source?: string }) => {
				const code = await runFieldProvenance({
					grammar: opts.grammar ?? 'rust',
					kind: opts.kind,
					redundant: opts.redundant ?? false,
					source: opts.source,
				});
				if (code !== 0) process.exitCode = code;
			});
	},
};
