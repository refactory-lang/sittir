import { type CommandModule, defineCommand } from '../../framework/command-module.ts';

export const portableConformance: CommandModule = {
	name: 'portable-conformance',
	describe: "Write each grammar's vocabulary-typed portable module, type-check it and count its errors by cause",
	register: (program) => {
		defineCommand(program, portableConformance)
			.option('--grammar <grammar...>', 'The grammars to check (default: every grammar with bindings)')
			.action(async (opts: { grammar?: string[] }) => {
				const { portableConformance: runPortableConformance } = await import('@sittir/tools');
				const code = await runPortableConformance(opts.grammar === undefined ? {} : { grammars: opts.grammar });
				if (code !== 0) process.exitCode = code;
			});
	}
};
