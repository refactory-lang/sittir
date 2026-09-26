import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { withGrammar } from '../../framework/options.ts';

export const textKindOverlap: CommandModule = {
	name: 'text-kind-overlap',
	describe: 'List texts a higher-ranked candidate text kind takes from a lower-ranked one in the same loose slot',
	register: (program) => {
		withGrammar(defineCommand(program, textKindOverlap)).action(async (opts: { grammar?: string }) => {
			const { textKindOverlap: runTextKindOverlap } = await import('@sittir/tools');
			const code = await runTextKindOverlap({ grammar: opts.grammar ?? 'rust' });
			if (code !== 0) process.exitCode = code;
		});
	}
};
