import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { withGrammar } from '../../framework/options.ts';

export const dumpAstMismatches: CommandModule = {
	name: 'dump-ast-mismatches',
	describe: 'Diagnostic for read-render-parse AST gaps',
	register: (program) => {
		withGrammar(defineCommand(program, dumpAstMismatches))
			.option('--all-grammars', 'Run every stable grammar')
			.option('-m, --mode <mode>', 'Mode: deep | shallow | diff', 'deep')
			.option('-f, --filter <substr>', 'Restrict to entries whose name contains substr')
			.option('-c, --cluster', 'Group mismatches by message pattern')
			.option('--format <fmt>', 'Output format: list | json', 'list')
			.option('-v, --verbose', 'Print INPUT/RENDERED bodies for every mismatch')
			.action(
				async (opts: {
					grammar?: string;
					allGrammars?: boolean;
					mode?: string;
					filter?: string;
					cluster?: boolean;
					format?: string;
					verbose?: boolean;
				}) => {
					const { dumpAstMismatches: runDumpAstMismatches } = await import('@sittir/tools');
					const code = await runDumpAstMismatches({
						grammar: opts.grammar ?? 'rust',
						allGrammars: opts.allGrammars ?? false,
						mode: opts.mode ?? 'deep',
						filter: opts.filter,
						cluster: opts.cluster ?? false,
						format: opts.format ?? 'list',
						verbose: opts.verbose ?? false
					});
					if (code !== 0) process.exitCode = code;
				}
			);
	}
};
