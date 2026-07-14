import type { Command } from 'commander';

/**
 * A single CLI command. `register` receives the parent commander program (or
 * namespace sub-program) and attaches exactly one command via `parent.command(...)`.
 *
 * `name`/`describe` are the single source of truth for the command's name and
 * its commander description; pass them to {@link defineCommand} inside `register`
 * rather than repeating the literals in a `.command()`/`.description()` chain.
 */
export interface CommandModule {
	readonly name: string;
	readonly describe: string;
	register(parent: Command): void;
}

/**
 * Create the module's command on `parent` with its `name` and `describe`
 * applied (so neither literal is duplicated inside `register`). Returns the
 * commander {@link Command} for option/argument/action chaining.
 *
 * @example
 *   register: (parent) => {
 *     withGrammar(defineCommand(parent, walk))
 *       .option('-s, --source <text>', 'Source text to parse')
 *       .action(async (opts) => { ... });
 *   }
 */
export function defineCommand(parent: Command, mod: Pick<CommandModule, 'name' | 'describe'>): Command {
	return parent.command(mod.name).description(mod.describe);
}

/**
 * Create a namespace sub-command (e.g. `validate`) on `program` and register
 * every module's command under it.
 */
export function registerNamespace(
	program: Command,
	namespace: string,
	describe: string,
	modules: readonly CommandModule[]
): void {
	const group = program.command(namespace).description(describe);
	for (const mod of modules) mod.register(group);
}
