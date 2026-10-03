import { type CommandModule, defineCommand } from '../../framework/command-module.ts';

export const codemodCorpus: CommandModule = {
	name: 'codemod-corpus',
	describe: 'Run the inline-attribute codemod through $with over the acceptance corpus and count files byte-identical to its baseline',
	register: (program) => {
		defineCommand(program, codemodCorpus)
			.option('--corpus <dir>', 'Corpus directory holding the .rs files and a baseline/ directory (default: the acceptance codemod sample)')
			.option('--json', 'Print the result as JSON')
			.action(async (opts: { corpus?: string; json?: boolean }) => {
				const { codemodCorpus: runCodemodCorpus, CODEMOD_CORPUS } = await import('@sittir/tools');
				const code = await runCodemodCorpus({ corpus: opts.corpus ?? CODEMOD_CORPUS, json: opts.json ?? false });
				if (code !== 0) process.exitCode = code;
			});
	}
};
