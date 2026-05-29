import type { Command } from 'commander';

/**
 * A single CLI command. `register` receives the parent commander program (or
 * namespace sub-program) and attaches exactly one command via `parent.command(...)`.
 */
export interface CommandModule {
	readonly name: string;
	readonly describe: string;
	register(parent: Command): void;
}

/**
 * Create a namespace sub-command (e.g. `validate`) on `program` and register
 * every module's command under it.
 */
export function registerNamespace(
	program: Command,
	namespace: string,
	describe: string,
	modules: readonly CommandModule[],
): void {
	const group = program.command(namespace).description(describe);
	for (const mod of modules) mod.register(group);
}
