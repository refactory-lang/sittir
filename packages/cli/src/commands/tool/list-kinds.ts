import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { withGrammar } from '../../framework/options.ts';
import { listKinds as runListKinds } from '@sittir/tools';

export const listKinds: CommandModule = {
	name: 'list-kinds',
	describe: 'List groups, unaliased, and phantom kinds',
	register: (program) => {
		withGrammar(defineCommand(program, listKinds))
			.option('--groups', 'List all group-modelled kinds')
			.option('--unaliased', 'List groups with no visible non-group twin')
			.option('--phantom', 'List phantom kinds (nodeMap without a parser symbol)')
			.action(async (opts: { grammar?: string; groups?: boolean; unaliased?: boolean; phantom?: boolean }) => {
				const code = await runListKinds({
					grammar: opts.grammar ?? 'rust',
					groups: opts.groups ?? false,
					unaliased: opts.unaliased ?? false,
					phantom: opts.phantom ?? false
				});
				if (code !== 0) process.exitCode = code;
			});
	}
};
