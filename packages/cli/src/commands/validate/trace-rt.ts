import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { withRecursive } from '../../framework/options.ts';
import { runTraceRtCli } from '@sittir/tools';

export const traceRt: CommandModule = {
	name: 'trace-rt',
	describe: 'Replay the first failing read-render-parse case as a rich trace',
	register: (program) => {
		withRecursive(defineCommand(program, traceRt))
			.argument('<grammar>', 'Grammar to trace (rust, typescript, python)')
			.action(async (grammar: string, opts: { recursive: boolean }) => {
				await runTraceRtCli(grammar as 'rust' | 'typescript' | 'python', 'native', { recursive: opts.recursive });
			});
	}
};
