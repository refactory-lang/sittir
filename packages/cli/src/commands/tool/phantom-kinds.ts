import { type CommandModule, defineCommand } from '../../framework/command-module.ts';

export const phantomKinds: CommandModule = {
	name: 'phantom-kinds',
	describe: 'Enumerate codegen kinds with no parser symbol across grammars',
	register: (program) => {
		defineCommand(program, phantomKinds)
			.argument('[grammars...]', 'Grammars to check (default: every stable grammar)', [])
			.action(async (grammars: string[]) => {
				const { phantomKinds: runPhantomKinds } = await import('@sittir/tools');
				const code = await runPhantomKinds({ grammars });
				if (code !== 0) process.exitCode = code;
			});
	}
};
