import { type CommandModule, defineCommand } from '../../framework/command-module.ts';

export const testFailures: CommandModule = {
	name: 'test-failures',
	describe: 'Group the failures in a vitest JSON report by error message',
	register: (program) => {
		defineCommand(program, testFailures)
			.option('--report <path>', 'Vitest JSON report (default: .vitest-report.json in the cwd)')
			.option('--json', 'Machine-readable JSON output')
			.option('--examples <n>', 'Examples shown per group', (value) => Number.parseInt(value, 10), 3)
			.action(async (opts: { report?: string; json?: boolean; examples: number }) => {
				const { testFailures: runTestFailures } = await import('@sittir/tools');
				const code = await runTestFailures({ report: opts.report, json: opts.json ?? false, examples: opts.examples });
				if (code !== 0) process.exitCode = code;
			});
	}
};
