import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { benchCodemod as runBenchCodemod } from '@sittir/tools';

export const benchCodemod: CommandModule = {
	name: 'bench-codemod',
	describe: 'Benchmark codemod on a corpus directory',
	register: (program) => {
		defineCommand(program, benchCodemod)
			.argument('<corpus-dir>', 'Corpus directory to benchmark')
			.action(async (corpusDir: string) => {
				const code = await runBenchCodemod({ corpus: corpusDir });
				if (code !== 0) process.exitCode = code;
			});
	}
};
