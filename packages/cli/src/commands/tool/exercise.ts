import type { CommandModule } from '../../framework/command-module.ts';
import { withGrammar } from '../../framework/options.ts';
import { exercise as runExercise } from '@sittir/tools';

export const exercise: CommandModule = {
	name: 'exercise',
	describe: 'Exercise factory round-trips with built-in or corpus cases',
	register: (program) => {
		withGrammar(program.command('exercise'))
			.description('Exercise factory round-trips with built-in or corpus cases')
			.option('-k, --kinds <kind,...>', 'Comma-separated kind list to exercise')
			.action(async (opts: { grammar?: string; kinds?: string }) => {
				const kinds =
					opts.kinds
						? opts.kinds.split(',').map((k) => k.trim()).filter((k) => k.length > 0)
						: [];
				const code = await runExercise({
					grammar: opts.grammar ?? 'rust',
					kinds,
				});
				if (code !== 0) process.exitCode = code;
			});
	},
};
