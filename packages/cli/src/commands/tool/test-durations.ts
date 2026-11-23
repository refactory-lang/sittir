import { type CommandModule, defineCommand } from '../../framework/command-module.ts';

export const testDurations: CommandModule = {
	name: 'test-durations',
	describe: 'Per-file durations, the slowest tests and worker-seconds of a vitest JSON report',
	register: (program) => {
		defineCommand(program, testDurations)
			.option('--report <path>', 'Vitest JSON report (default: .vitest-report.json in the cwd)')
			.option('--json', 'Machine-readable JSON output')
			.option('--slowest <n>', 'Slowest tests shown', (value) => Number.parseInt(value, 10), 10)
			.action(async (opts: { report?: string; json?: boolean; slowest: number }) => {
				const { testDurations: runTestDurations } = await import('@sittir/tools');
				const code = await runTestDurations({ report: opts.report, json: opts.json ?? false, slowest: opts.slowest });
				if (code !== 0) process.exitCode = code;
			});
	}
};
