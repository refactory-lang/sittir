import { type CommandModule, defineCommand } from '../framework/command-module.ts';

export const bootstrapCommand: CommandModule = {
	name: 'bootstrap',
	describe: 'Build the pinned sittir the generator reads with (the commit in bootstrap.json), once per commit',
	register: (program) => {
		defineCommand(program, bootstrapCommand).action(async () => {
			const { bootstrap } = await import('@sittir/codegen/bootstrap');
			process.stdout.write(`pinned build: ${bootstrap()}\n`);
		});
	}
};
