import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { withGrammar } from '../../framework/options.ts';
import { profile as runProfile } from '@sittir/tools';

export const profile: CommandModule = {
	name: 'profile',
	describe: 'Aggregate validator failures across grammars',
	register: (program) => {
		withGrammar(defineCommand(program, profile))
			.option('--top <n>', 'Number of top patterns', '15')
			.action(async (opts: { grammar?: string; top?: string }) => {
				const code = await runProfile({
					grammar: opts.grammar,
					top: opts.top ? parseInt(opts.top, 10) : 15
				});
				if (code !== 0) process.exitCode = code;
			});
	}
};
