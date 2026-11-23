import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { withGrammar } from '../../framework/options.ts';

export const grammarRule: CommandModule = {
	name: 'grammar-rule',
	describe: 'Print one rule of a grammar.json compactly: seq, choice, opt, repeat, field, alias',
	register: (program) => {
		withGrammar(defineCommand(program, grammarRule))
			.argument('<kind>', 'Rule name in the grammar.json')
			.action(async (kind: string, opts: { grammar?: string }) => {
				const { grammarRule: runGrammarRule } = await import('@sittir/tools');
				const code = await runGrammarRule({ grammar: opts.grammar ?? 'rust', kind });
				if (code !== 0) process.exitCode = code;
			});
	}
};
