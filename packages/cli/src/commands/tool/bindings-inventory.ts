import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { bindingsInventory as runBindingsInventory } from '@sittir/tools';

export const bindingsInventory: CommandModule = {
	name: 'bindings-inventory',
	describe: 'Compile the bindings, derive the vocabulary they imply, and emit the base interface tree',
	register: (program) => {
		defineCommand(program, bindingsInventory)
			.option('--check', 'Compile every bindings.scm against its parser and report totality diagnostics')
			.option('--members', 'Print member names and kinds per shared kind')
			.option('--emit [dir]', 'Emit the vocabulary tree into a directory (default: packages/types/src/vocabulary, the checked-in tree)')
			.action(async (opts: { check?: boolean; members?: boolean; emit?: string | true }) => {
				const code = await runBindingsInventory({
					check: opts.check ?? false,
					members: opts.members ?? false,
					...(opts.emit !== undefined ? { emit: opts.emit } : {})
				});
				if (code !== 0) process.exitCode = code;
			});
	}
};
