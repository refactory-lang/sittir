import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { withGrammar } from '../../framework/options.ts';
import { profileFactory as runProfileFactory } from '@sittir/tools';

export const profileFactory: CommandModule = {
	name: 'profile-factory',
	describe: 'Profile factory-render-parse failures',
	register: (program) => {
		withGrammar(defineCommand(program, profileFactory))
			.option('--ast', 'Include AST mismatch breakdown')
			.action(async (opts: { grammar?: string; ast?: boolean }) => {
				const code = await runProfileFactory({
					grammar: opts.grammar,
					showAst: opts.ast ?? false
				});
				if (code !== 0) process.exitCode = code;
			});
	}
};
