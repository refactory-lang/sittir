import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { withRecursive } from '../../framework/options.ts';
import { assertGrammar } from '@sittir/codegen/grammars';

export const traceRt: CommandModule = {
	name: 'trace-rt',
	describe: 'Replay the first failing read-render-parse case as a rich trace',
	register: (program) => {
		withRecursive(defineCommand(program, traceRt))
			.argument('<grammar>', 'Grammar to trace')
			.action(async (grammar: string, opts: { recursive: boolean }) => {
				const { runTraceRtCli } = await import('@sittir/tools');
				await runTraceRtCli(assertGrammar(grammar), 'native', { recursive: opts.recursive });
			});
	}
};
