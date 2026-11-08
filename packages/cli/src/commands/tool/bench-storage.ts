import { type CommandModule, defineCommand } from '../../framework/command-module.ts';

export const benchStorage: CommandModule = {
	name: 'bench-storage',
	describe: 'Measure native workflows or paired backend validation buckets',
	register: (program) => {
		defineCommand(program, benchStorage)
			.argument('[grammars...]', 'Defaults to all stable grammars')
			.option('--rounds <n>', 'Fresh-process rounds per grammar', '5')
			.option('--warmup <n>', 'Warmup batches per timed phase', '2')
			.option('--iterations <n>', 'Measured corpus batches per phase and round', '3')
			.option('--limit <n>', 'Use only the first n corpus entries (smoke runs)')
			.option('--native-depth <depth>', 'Native hydration depth: a positive integer or all', 'all')
			.option('--validation', 'Profile deep read, factory and IR render/parse validators under both paired backends')
			.option(
				'--baseline <tree>',
				"With --validation, also measure another built checkout's own validation workers in the same rounds, the order turning each round, with the memory of loading one grammar and every grammar, and the bytes a host install of each grammar costs, for both"
			)
			.option('--idle-gate <path>', "Run a shell idle gate before each worker, passing the worker's checkout")
			.option('--output <path>', 'Write the complete JSON report to this file')
			.action(
				async (
					grammars: string[],
					opts: {
						rounds: string;
						warmup: string;
						iterations: string;
						limit?: string;
						nativeDepth: string;
						validation?: boolean;
						idleGate?: string;
						output?: string;
						baseline?: string;
					}
				) => {
					const { benchStorage: run } = await import('@sittir/tools');
					process.exitCode = await run({
						grammars,
						rounds: Number(opts.rounds),
						warmup: Number(opts.warmup),
						iterations: Number(opts.iterations),
						limit: opts.limit === undefined ? undefined : Number(opts.limit),
						nativeDepth: opts.nativeDepth === 'all' ? 'all' : Number(opts.nativeDepth),
						validation: opts.validation,
						idleGate: opts.idleGate,
						output: opts.output,
						baseline: opts.baseline
					});
				}
			);
	}
};
