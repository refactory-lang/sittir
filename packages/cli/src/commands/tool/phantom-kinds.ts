import type { CommandModule } from '../../framework/command-module.ts';
import { phantomKinds as runPhantomKinds } from '@sittir/tools';

export const phantomKinds: CommandModule = {
	name: 'phantom-kinds',
	describe: 'Enumerate codegen kinds with no parser symbol across grammars',
	register: (program) => {
		program.command('phantom-kinds')
			.description('Enumerate codegen kinds with no parser symbol across grammars')
			.argument('[grammars...]', 'Grammars to check (default: all three)', [])
			.action(async (grammars: string[]) => {
				const code = await runPhantomKinds({ grammars });
				if (code !== 0) process.exitCode = code;
			});
	},
};
