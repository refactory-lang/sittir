import { type CommandModule, defineCommand } from '../../framework/command-module.ts';

export const benchStorage: CommandModule = {
	name: 'bench-storage',
	describe: 'Measure native workflows or object/arena validation buckets',
	register: (program) => {
		defineCommand(program, benchStorage)
			.argument('[grammars...]', 'Defaults to all stable grammars')
			.option('--rounds <n>', 'Fresh-process rounds per grammar', '5')
			.option('--warmup <n>', 'Warmup batches per timed phase', '2')
			.option('--iterations <n>', 'Measured corpus batches per phase and round', '3')
			.option('--limit <n>', 'Use only the first n corpus entries (smoke runs)')
			.option('--native-depth <depth>', 'Native hydration depth: a positive integer or all', 'all')
			.option('--validation', 'Profile deep read, factory and IR render/parse validators with object and arena storage')
			.option(
				'--construction <construction>',
				"How the arena arm's builders construct nodes in validation profiles: as objects (objects), or as records (records)",
				'objects'
			)
			.option('--idle-gate <path>', 'Run a shell idle gate before each worker, passing the current directory')
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
						construction: string;
						idleGate?: string;
						output?: string;
					}
				) => {
					const { benchStorage: run, parseConstruction } = await import('@sittir/tools');
					process.exitCode = await run({
						grammars,
						rounds: Number(opts.rounds),
						warmup: Number(opts.warmup),
						iterations: Number(opts.iterations),
						limit: opts.limit === undefined ? undefined : Number(opts.limit),
						nativeDepth: opts.nativeDepth === 'all' ? 'all' : Number(opts.nativeDepth),
						validation: opts.validation,
						construction: parseConstruction(opts.construction),
						idleGate: opts.idleGate,
						output: opts.output
					});
				}
			);
	}
};
