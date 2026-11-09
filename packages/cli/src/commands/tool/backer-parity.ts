import { type CommandModule, defineCommand } from '../../framework/command-module.ts';

export const backerParity: CommandModule = {
	name: 'backer-parity',
	describe:
		"Compare arena storage's record backer with the tree backer on every node of each TypeScript source of a corpus, read whole",
	register: (program) => {
		defineCommand(program, backerParity)
			.requiredOption('--corpus <dir>', 'The corpus root every path is read under')
			.option('--admitted <json>', "The corpus harness's admitted list, whose files' paths are read")
			.option('--files <paths...>', 'These paths under the corpus root, without an admitted list')
			.option('--json', 'Print the census as JSON')
			.action(async (opts: { corpus: string; admitted?: string; files?: string[]; json?: boolean }) => {
				const { backerParity: runBackerParity } = await import('@sittir/tools');
				const code = await runBackerParity({
					corpus: opts.corpus,
					admitted: opts.admitted,
					files: opts.files ?? [],
					json: opts.json ?? false
				});
				if (code !== 0) process.exitCode = code;
			});
	}
};
