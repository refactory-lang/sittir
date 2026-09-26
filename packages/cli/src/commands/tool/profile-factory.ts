import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { withGrammar } from '../../framework/options.ts';

export const profileFactory: CommandModule = {
	name: 'profile-factory',
	describe: 'Profile factory-render-parse failures',
	register: (program) => {
		withGrammar(defineCommand(program, profileFactory))
			.option('--ast', 'Include AST mismatch breakdown')
			.action(async (opts: { grammar?: string; ast?: boolean }) => {
				const { profileFactory: runProfileFactory } = await import('@sittir/tools');
				const code = await runProfileFactory({
					grammar: opts.grammar,
					showAst: opts.ast ?? false
				});
				if (code !== 0) process.exitCode = code;
			});
	}
};
