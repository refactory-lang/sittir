import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { withGrammar } from '../../framework/options.ts';

export const nodeJsonCensus: CommandModule = {
	name: 'node-json-census',
	describe: 'Census what node JSON and the reviver rest on: unwrapped text leaves, kinds the coercer cannot build, slot value shapes, comment kinds',
	register: (program) => {
		withGrammar(defineCommand(program, nodeJsonCensus))
			.option('--all-grammars', 'Run every stable grammar')
			.action(async (opts: { grammar?: string; allGrammars?: boolean }) => {
				const { nodeJsonCensus: runNodeJsonCensus } = await import('@sittir/tools');
				const code = await runNodeJsonCensus({ grammar: opts.grammar ?? 'rust', allGrammars: opts.allGrammars ?? false });
				if (code !== 0) process.exitCode = code;
			});
	}
};
