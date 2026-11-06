import { type CommandModule, defineCommand } from '../../framework/command-module.ts';

export const portableAdmission: CommandModule = {
	name: 'portable-admission',
	describe:
		"List the vocabulary members and own slots whose type admits a kind no read in the grammar's typed portable module gives",
	register: (program) => {
		defineCommand(program, portableAdmission)
			.option('--grammar <grammar...>', 'The grammars to read (default: every grammar with bindings)')
			.action(async (opts: { grammar?: string[] }) => {
				const { portableAdmission: runPortableAdmission } = await import('@sittir/tools');
				const code = await runPortableAdmission(opts.grammar === undefined ? {} : { grammars: opts.grammar });
				if (code !== 0) process.exitCode = code;
			});
	}
};
