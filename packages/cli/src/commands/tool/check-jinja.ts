import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { checkJinja as runCheckJinja } from '@sittir/tools';

export const checkJinja: CommandModule = {
	name: 'check-jinja',
	describe: 'Validate .jinja template files (headers, no YAML regressions)',
	register: (program) => {
		defineCommand(program, checkJinja).action(async () => {
			const code = await runCheckJinja({});
			if (code !== 0) process.exitCode = code;
		});
	}
};
