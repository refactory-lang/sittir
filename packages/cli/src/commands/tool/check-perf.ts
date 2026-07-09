import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { checkPerf as runCheckPerf } from '@sittir/tools';

export const checkPerf: CommandModule = {
	name: 'check-perf',
	describe: 'Check native FFI performance against committed baseline',
	register: (program) => {
		defineCommand(program, checkPerf)
			.option('--baseline <path>', 'Path to committed PerfBaseline JSON')
			.option('--metrics <path>', 'Path to freshly produced MetricsFile JSON (default: ./metrics-native.json)')
			.action(async (opts: { baseline?: string; metrics?: string }) => {
				const code = await runCheckPerf({
					baseline: opts.baseline,
					metrics: opts.metrics
				});
				if (code !== 0) process.exitCode = code;
			});
	}
};
