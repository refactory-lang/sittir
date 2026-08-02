import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { withGrammar } from '../../framework/options.ts';
import { corpusCoverageCensus as runCorpusCoverageCensus } from '@sittir/tools';

export const corpusCoverageCensus: CommandModule = {
	name: 'corpus-coverage-census',
	describe: 'Declared rule kinds with zero corpus exposure (round-trip-fidelity Phase 0)',
	register: (program) => {
		withGrammar(defineCommand(program, corpusCoverageCensus))
			.option('--all-grammars', 'Run all three grammars')
			.option('--format <fmt>', 'Output format: list | json', 'list')
			.action(async (opts: { grammar?: string; allGrammars?: boolean; format?: string }) => {
				const code = await runCorpusCoverageCensus({
					grammar: opts.grammar ?? 'rust',
					allGrammars: opts.allGrammars ?? false,
					format: opts.format ?? 'list'
				});
				if (code !== 0) process.exitCode = code;
			});
	}
};
