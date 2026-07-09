import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { phantomKinds as runPhantomKinds } from '@sittir/tools';

export const phantomKinds: CommandModule = {
	name: 'phantom-kinds',
	describe: 'Enumerate codegen kinds with no parser symbol across grammars',
	register: (program) => {
		defineCommand(program, phantomKinds)
			.argument('[grammars...]', 'Grammars to check (default: all three)', [])
			.action(async (grammars: string[]) => {
				const code = await runPhantomKinds({ grammars });
				if (code !== 0) process.exitCode = code;
			});
	}
};
