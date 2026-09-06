import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { bench as runBench } from '@sittir/tools';

export const bench: CommandModule = {
	name: 'bench',
	describe: 'Native render benchmark over the corpus',
	register: (program) => {
		defineCommand(program, bench)
			.addHelpText('after', '\nControlled via env vars: BENCH_ITERATIONS (default 100), NODE_ENV (default production)')
			.action(async () => {
				const code = await runBench({});
				if (code !== 0) process.exitCode = code;
			});
	}
};
