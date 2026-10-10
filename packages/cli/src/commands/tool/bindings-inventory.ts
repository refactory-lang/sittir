import { type CommandModule, defineCommand } from '../../framework/command-module.ts';

export const bindingsInventory: CommandModule = {
	name: 'bindings-inventory',
	describe: 'Compile the bindings, derive the vocabulary they imply, and check it against the authored vocabulary',
	register: (program) => {
		defineCommand(program, bindingsInventory)
			.option('--check', 'Compile every bindings.scm against its parser, report totality diagnostics, and report where the bindings and the vocabulary disagree')
			.option('--members', 'Print member names and kinds per shared kind')
			.option('--write', 'Write each grammar.bindings.ts: the bindings overlay and the hash of the sources it was derived from')
			.action(async (opts: { check?: boolean; members?: boolean; write?: boolean }) => {
				const { bindingsInventory: runBindingsInventory } = await import('@sittir/tools');
				const code = await runBindingsInventory({
					check: opts.check ?? false,
					members: opts.members ?? false,
					write: opts.write ?? false
				});
				if (code !== 0) process.exitCode = code;
			});
	}
};
