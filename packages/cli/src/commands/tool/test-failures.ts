import { type CommandModule, defineCommand } from '../../framework/command-module.ts';

export const testFailures: CommandModule = {
	name: 'test-failures',
	describe: 'Group the failures in a vitest JSON report by error message',
	register: (program) => {
		defineCommand(program, testFailures)
			.option('--report <path>', 'Vitest JSON report (default: .vitest-report.json in the cwd)')
			.option('--json', 'Machine-readable JSON output')
			.option('--examples <n>', 'Examples shown per group', (value) => Number.parseInt(value, 10), 3)
			.option('--against <path>', 'Older vitest JSON report: list new, fixed and unchanged failures by test name')
			.action(async (opts: { report?: string; json?: boolean; examples: number; against?: string }) => {
				const { testFailures: runTestFailures } = await import('@sittir/tools');
				const code = await runTestFailures({
					report: opts.report,
					json: opts.json ?? false,
					examples: opts.examples,
					against: opts.against
				});
				if (code !== 0) process.exitCode = code;
			});
	}
};
