import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { withGrammar } from '../../framework/options.ts';
import { walk as runWalk } from '@sittir/tools';

export const walk: CommandModule = {
	name: 'walk',
	describe: 'Walk a parsed tree and print kind counts',
	register: (program) => {
		withGrammar(defineCommand(program, walk))
			.option('-s, --source <text>', 'Source text to parse')
			.option('--render', 'Render each visited node')
			.action(async (opts: { grammar?: string; source?: string; render?: boolean }) => {
				const code = await runWalk({
					grammar: opts.grammar ?? 'rust',
					source: opts.source,
					render: opts.render ?? false,
				});
				if (code !== 0) process.exitCode = code;
			});
	},
};
