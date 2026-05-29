import type { CommandModule } from '../../framework/command-module.ts';
import { withBackend, withRecursive } from '../../framework/options.ts';
import { runTraceRtCli, resolveBackends } from '@sittir/validator';

export const traceRt: CommandModule = {
	name: 'trace-rt',
	describe: 'Replay the first failing read-render-parse case as a rich trace',
	register: (program) => {
		withRecursive(withBackend(program.command('trace-rt')))
			.description('Replay the first failing read-render-parse case as a rich trace')
			.argument('<grammar>', 'Grammar to trace (rust, typescript, python)')
			.action(async (grammar: string, opts: { backend: 'native' | 'js' | 'all'; recursive: boolean }) => {
				for (const backend of resolveBackends(opts.backend)) {
					await runTraceRtCli(grammar as 'rust' | 'typescript' | 'python', backend, { recursive: opts.recursive });
				}
			});
	},
};
