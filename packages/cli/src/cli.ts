#!/usr/bin/env node
import { Command } from 'commander';
import { registerValidate } from './commands/validate/index.ts';
import { registerTools } from './commands/tool/index.ts';
import { gen } from './commands/gen.ts';

/** Build the fully-registered sittir program WITHOUT parsing argv. */
export function buildProgram(): Command {
	const program = new Command()
		.name('sittir')
		.description('Unified sittir command-line surface');
	gen.register(program);
	registerValidate(program);
	registerTools(program);
	return program;
}

// Only parse when executed directly (not when imported by the glossary generator / tests).
const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
	await buildProgram().parseAsync(process.argv);
}
