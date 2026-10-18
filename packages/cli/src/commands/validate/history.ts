import { type CommandModule, defineCommand } from '../../framework/command-module.ts';

export const history: CommandModule = {
	name: 'history',
	describe: 'Print last N validation history entries, or diff two validation reports',
	register: (program) => {
		defineCommand(program, history)
			.argument('[n]', 'Number of entries to show', '10')
			.option(
				'--diff <reports...>',
				'Diff two validation-report.json files, <base> <head>: per-grammar row and per-code count deltas, then every moved row; exits 1 when rows moved, 2 when a side is missing, empty or has no rows'
			)
			.action(async (n: string, opts: { diff?: string[] }) => {
				const { runHistoryCli, runValidationReportDiffCli } = await import('@sittir/tools');
				if (opts.diff === undefined) {
					runHistoryCli([n]);
					return;
				}
				if (opts.diff.length !== 2) {
					console.error(`validate history --diff takes exactly two reports, <base> <head>; got ${opts.diff.length}`);
					process.exitCode = 2;
					return;
				}
				const code = runValidationReportDiffCli(opts.diff[0]!, opts.diff[1]!);
				if (code !== 0) process.exitCode = code;
			});
	}
};
